"""
Scheduler service for running scheduled scans.
Uses APScheduler for cron-like scheduling.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.models.scan_run import ScanRun
from app.services.background_tasks import run_scan_background

logger = logging.getLogger(__name__)


def parse_schedule(schedule_config: dict) -> Optional[dict]:
    """
    Parse schedule configuration and return next run time.
    
    Schedule format:
    {
        "enabled": true,
        "frequency": "daily" | "weekly" | "monthly" | "custom",
        "time": "HH:MM" (24-hour format),
        "day_of_week": 0-6 (0=Monday, optional for weekly),
        "day_of_month": 1-31 (optional for monthly),
        "timezone": "UTC" (optional, defaults to UTC)
    }
    
    Returns dict with next_run_time or None if disabled/invalid.
    """
    if not schedule_config.get("enabled", False):
        return None
    
    frequency = schedule_config.get("frequency", "daily")
    time_str = schedule_config.get("time", "00:00")
    
    try:
        hour, minute = map(int, time_str.split(":"))
    except (ValueError, AttributeError):
        logger.warning(f"Invalid time format: {time_str}, using 00:00")
        hour, minute = 0, 0
    
    now = datetime.utcnow()
    today = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    if frequency == "daily":
        if today > now:
            next_run = today
        else:
            next_run = today + timedelta(days=1)
        return {"next_run_time": next_run, "frequency": "daily"}
    
    elif frequency == "weekly":
        day_of_week = schedule_config.get("day_of_week", 0)  # 0=Monday
        days_ahead = day_of_week - today.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        next_run = today + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return {"next_run_time": next_run, "frequency": "weekly"}
    
    elif frequency == "monthly":
        day_of_month = schedule_config.get("day_of_month", 1)
        # Calculate next month
        if today.day >= day_of_month:
            # Move to next month
            if today.month == 12:
                next_run = today.replace(year=today.year + 1, month=1, day=day_of_month, hour=hour, minute=minute)
            else:
                next_run = today.replace(month=today.month + 1, day=day_of_month, hour=hour, minute=minute)
        else:
            # This month
            next_run = today.replace(day=day_of_month, hour=hour, minute=minute)
        next_run = next_run.replace(second=0, microsecond=0)
        return {"next_run_time": next_run, "frequency": "monthly"}
    
    return None


def check_and_run_scheduled_scans():
    """
    Check all tenants for scheduled scans and trigger them if due.
    This should be called periodically (e.g., every minute via cron or scheduler).
    """
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).all()
        triggered_count = 0
        
        for tenant in tenants:
            schedule_config = tenant.scan_schedule if hasattr(tenant, 'scan_schedule') else None
            if not schedule_config:
                continue
            
            schedule_info = parse_schedule(schedule_config)
            if not schedule_info:
                continue
            
            next_run_time = schedule_info["next_run_time"]
            now = datetime.utcnow()
            
            # Check if it's time to run (with 1-minute window)
            if next_run_time <= now and (now - next_run_time).total_seconds() < 60:
                # Check if there's already a running scan
                existing_scan = (
                    db.query(ScanRun)
                    .filter(ScanRun.tenant_id == tenant.id, ScanRun.status == "running")
                    .first()
                )
                
                if existing_scan:
                    logger.info(f"Skipping scheduled scan for tenant {tenant.id}: scan already running")
                    continue
                
                # Check last scheduled scan time to avoid duplicate runs
                from sqlalchemy import func
                last_scheduled_scan = (
                    db.query(ScanRun)
                    .filter(ScanRun.tenant_id == tenant.id)
                    .filter(ScanRun.scan_metadata.isnot(None))
                    .order_by(ScanRun.started_at.desc())
                    .first()
                )
                
                # Check if last scan was scheduled and recent
                if last_scheduled_scan and last_scheduled_scan.scan_metadata:
                    is_scheduled = last_scheduled_scan.scan_metadata.get("scheduled", False)
                    if is_scheduled and last_scheduled_scan.started_at:
                        time_since_last = (now - last_scheduled_scan.started_at).total_seconds()
                        if time_since_last < 300:  # Less than 5 minutes ago
                            logger.info(f"Skipping scheduled scan for tenant {tenant.id}: recent scan exists")
                            continue
                
                # Create and trigger scan
                scan_run = ScanRun(
                    tenant_id=tenant.id,
                    status="pending",
                    started_at=datetime.utcnow(),
                    scan_metadata={"scheduled": True, "schedule_frequency": schedule_info["frequency"]}
                )
                db.add(scan_run)
                db.commit()
                db.refresh(scan_run)
                
                # Update next run time in schedule config
                next_schedule = parse_schedule(schedule_config)
                if next_schedule:
                    schedule_config["last_run"] = now.isoformat()
                    schedule_config["next_run"] = next_schedule["next_run_time"].isoformat()
                    tenant.scan_schedule = schedule_config
                    db.commit()
                
                # Run scan in background
                run_scan_background(scan_run.id, tenant.id)
                triggered_count += 1
                logger.info(f"Triggered scheduled scan {scan_run.id} for tenant {tenant.id}")
        
        if triggered_count > 0:
            logger.info(f"Scheduled scan check: triggered {triggered_count} scans")
        
    except Exception as e:
        logger.error(f"Error checking scheduled scans: {e}", exc_info=True)
    finally:
        db.close()

