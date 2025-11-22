"""
Scan schedule API endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.api.deps import get_current_user
from app.services.scheduler_service import parse_schedule

router = APIRouter()


class ScanSchedule(BaseModel):
    enabled: bool = False
    frequency: str = "daily"  # daily, weekly, monthly
    time: str = "00:00"  # HH:MM format
    day_of_week: Optional[int] = None  # 0-6 (0=Monday, for weekly)
    day_of_month: Optional[int] = None  # 1-31 (for monthly)
    timezone: str = "UTC"


class ScanScheduleResponse(BaseModel):
    tenant_id: UUID
    schedule: dict
    next_run_time: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/{tenant_id}", response_model=ScanScheduleResponse)
def get_scan_schedule(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scan schedule for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    schedule = tenant.scan_schedule or {
        "enabled": False,
        "frequency": "daily",
        "time": "00:00",
        "timezone": "UTC"
    }
    
    # Calculate next run time
    schedule_info = parse_schedule(schedule)
    next_run_time = schedule_info["next_run_time"].isoformat() if schedule_info and schedule_info.get("next_run_time") else None
    
    return {
        "tenant_id": tenant.id,
        "schedule": schedule,
        "next_run_time": next_run_time,
    }


@router.put("/{tenant_id}", response_model=ScanScheduleResponse)
def update_scan_schedule(
    tenant_id: UUID,
    schedule: ScanSchedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update scan schedule for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Validate frequency
    valid_frequencies = ["daily", "weekly", "monthly"]
    if schedule.frequency not in valid_frequencies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frequency. Must be one of: {', '.join(valid_frequencies)}",
        )
    
    # Validate time format
    try:
        hour, minute = map(int, schedule.time.split(":"))
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            raise ValueError("Invalid time range")
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM (24-hour format)",
        )
    
    # Validate day_of_week for weekly
    if schedule.frequency == "weekly":
        if schedule.day_of_week is None:
            schedule.day_of_week = 0  # Default to Monday
        if not (0 <= schedule.day_of_week <= 6):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="day_of_week must be between 0 (Monday) and 6 (Sunday)",
            )
    
    # Validate day_of_month for monthly
    if schedule.frequency == "monthly":
        if schedule.day_of_month is None:
            schedule.day_of_month = 1  # Default to 1st
        if not (1 <= schedule.day_of_month <= 31):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="day_of_month must be between 1 and 31",
            )
    
    # Update schedule
    schedule_dict = schedule.dict(exclude_none=True)
    tenant.scan_schedule = schedule_dict
    
    # Calculate next run time
    schedule_info = parse_schedule(schedule_dict)
    next_run_time = schedule_info["next_run_time"].isoformat() if schedule_info and schedule_info.get("next_run_time") else None
    
    db.commit()
    db.refresh(tenant)
    
    return {
        "tenant_id": tenant.id,
        "schedule": tenant.scan_schedule,
        "next_run_time": next_run_time,
    }


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan_schedule(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disable scan schedule for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    tenant.scan_schedule = None
    db.commit()





