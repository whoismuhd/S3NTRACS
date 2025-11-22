import logging
from datetime import datetime
from typing import Dict, List
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.scan_run import ScanRun
from app.models.finding import Finding
from app.models.tenant import Tenant
from app.services.aws_assume import assume_tenant_role
from app.services.iam_scanner import scan_iam
from app.services.s3_scanner import scan_s3
from app.services.logging_scanner import scan_logging
from app.services.ec2_scanner import scan_ec2
from app.services.ebs_scanner import scan_ebs
from app.services.rds_scanner import scan_rds
from app.services.lambda_scanner import scan_lambda
from app.services.cloudwatch_scanner import scan_cloudwatch

logger = logging.getLogger(__name__)


def run_scan(db: Session, scan_run_id: UUID, tenant_id: UUID) -> ScanRun:
    """
    Orchestrate a security scan for a tenant.
    
    Args:
        db: Database session
        scan_run_id: UUID of the scan run to update
        tenant_id: UUID of the tenant to scan
        
    Returns:
        ScanRun object with status and findings
    """
    # Get scan run
    scan_run = db.query(ScanRun).filter(ScanRun.id == scan_run_id).first()
    if not scan_run:
        raise ValueError(f"Scan run {scan_run_id} not found")
    
    # Get tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise ValueError(f"Tenant {tenant_id} not found")
    
    # Update scan status to running
    scan_run.status = "running"
    db.commit()
    db.refresh(scan_run)
    
    # Notify WebSocket connections about scan start
    try:
        import asyncio
        from app.api.websocket import notify_scan_update
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(notify_scan_update(tenant_id, scan_run, db))
            else:
                loop.run_until_complete(notify_scan_update(tenant_id, scan_run, db))
        except RuntimeError:
            # No event loop, create new one
            asyncio.run(notify_scan_update(tenant_id, scan_run, db))
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {e}", exc_info=True)
    
    all_findings = []
    
    try:
        # Assume role
        logger.info(f"Assuming role for tenant {tenant_id}: {tenant.aws_role_arn}")
        session = assume_tenant_role(tenant.aws_role_arn, tenant.aws_external_id)
        
        # Run scanners (fail-soft: continue if one fails)
        # Get enabled scanners from tenant, default to all if not set
        available_scanners = {
            "IAM": scan_iam,
            "S3": scan_s3,
            "LOGGING": scan_logging,
            "EC2": scan_ec2,
            "EBS": scan_ebs,
            "RDS": scan_rds,
            "LAMBDA": scan_lambda,
            "CLOUDWATCH": scan_cloudwatch,
        }
        
        # Get enabled scanners from tenant config, default to all if not set
        enabled_scanner_names = tenant.enabled_scanners if tenant.enabled_scanners else list(available_scanners.keys())
        
        # Build scanner list from enabled scanners
        scanners = [
            (name, available_scanners[name])
            for name in enabled_scanner_names
            if name in available_scanners
        ]
        
        if not scanners:
            logger.warning(f"No enabled scanners found for tenant {tenant_id}, using default scanners")
            scanners = [
                ("IAM", scan_iam),
                ("S3", scan_s3),
                ("LOGGING", scan_logging),
            ]
        
        for scanner_name, scanner_func in scanners:
            try:
                logger.info(f"Running {scanner_name} scanner for tenant {tenant_id}")
                findings = scanner_func(session)
                all_findings.extend(findings)
                logger.info(f"{scanner_name} scanner found {len(findings)} issues")
            except Exception as e:
                logger.error(f"{scanner_name} scanner failed: {e}", exc_info=True)
                # Create a finding about the scanner failure
                all_findings.append({
                    "category": scanner_name,
                    "title": f"{scanner_name} scanner error",
                    "description": f"The {scanner_name} scanner encountered an error: {str(e)}",
                    "severity": "MEDIUM",
                    "resource_id": scanner_name,
                    "remediation": f"Check {scanner_name} scanner logs and permissions.",
                    "mapped_control": None,
                })
        
        # Check for previously marked-as-fixed findings that are now resolved
        # Get all findings marked as fixed from previous scans
        marked_fixed_findings = (
            db.query(Finding)
            .filter(
                Finding.tenant_id == tenant_id,
                Finding.remediation_status == "marked_fixed",
                Finding.verified_fixed_at.is_(None)
            )
            .all()
        )
        
        # Create a set of current finding identifiers (category + resource_id + title pattern)
        current_finding_keys = set()
        for finding_data in all_findings:
            key = (
                finding_data["category"],
                finding_data.get("resource_id", ""),
                finding_data["title"]
            )
            current_finding_keys.add(key)
        
        # Verify which marked-as-fixed findings are no longer present
        verified_count = 0
        for old_finding in marked_fixed_findings:
            old_key = (
                old_finding.category,
                old_finding.resource_id or "",
                old_finding.title
            )
            # If this finding is not in the current scan results, it's been fixed!
            if old_key not in current_finding_keys:
                old_finding.remediation_status = "verified_fixed"
                old_finding.verified_fixed_at = datetime.utcnow()
                verified_count += 1
                logger.info(f"Finding {old_finding.id} verified as fixed")
        
        # Store new findings (with deduplication)
        # Get existing active findings for this tenant to avoid duplicates
        existing_findings_query = (
            db.query(Finding)
            .filter(
                Finding.tenant_id == tenant_id,
                Finding.remediation_status.in_([None, "open", "marked_fixed"])  # Only active findings
            )
        )
        existing_findings = {(
            f.category,
            f.resource_id or "",
            f.title
        ): f for f in existing_findings_query.all()}
        
        new_findings_count = 0
        updated_findings_count = 0
        
        for finding_data in all_findings:
            finding_key = (
                finding_data["category"],
                finding_data.get("resource_id", ""),
                finding_data["title"]
            )
            
            # Check if this finding already exists
            existing_finding = existing_findings.get(finding_key)
            
            if existing_finding:
                # Update existing finding: refresh scan_run_id
                existing_finding.scan_run_id = scan_run.id
                # Only update status if it was marked as fixed but the issue persists
                if existing_finding.remediation_status == "marked_fixed":
                    existing_finding.remediation_status = "open"  # Issue still exists
                    existing_finding.verified_fixed_at = None
                updated_findings_count += 1
            else:
                # Create new finding
                finding = Finding(
                    tenant_id=tenant_id,
                    scan_run_id=scan_run.id,
                    category=finding_data["category"],
                    title=finding_data["title"],
                    description=finding_data.get("description"),
                    severity=finding_data["severity"],
                    resource_id=finding_data.get("resource_id"),
                    remediation=finding_data.get("remediation"),
                    mapped_control=finding_data.get("mapped_control"),
                )
                db.add(finding)
                new_findings_count += 1
        
        # Calculate summary
        summary = {
            "total_findings": len(all_findings),
            "new_findings": new_findings_count,
            "updated_findings": updated_findings_count,
            "verified_fixed": verified_count,
            "by_severity": {
                "CRITICAL": len([f for f in all_findings if f["severity"] == "CRITICAL"]),
                "HIGH": len([f for f in all_findings if f["severity"] == "HIGH"]),
                "MEDIUM": len([f for f in all_findings if f["severity"] == "MEDIUM"]),
                "LOW": len([f for f in all_findings if f["severity"] == "LOW"]),
            },
            "by_category": {},
        }
        
        for finding in all_findings:
            category = finding["category"]
            summary["by_category"][category] = summary["by_category"].get(category, 0) + 1
        
        # Update scan run
        scan_run.status = "completed"
        scan_run.finished_at = datetime.utcnow()
        scan_run.summary = summary
        
        db.commit()
        db.refresh(scan_run)
        
        logger.info(f"Scan {scan_run.id} completed with {len(all_findings)} findings")
        
        # Send notifications for new findings
        try:
            from app.services.notification_service import send_notifications_for_findings
            
            # Get notification preferences
            notification_prefs = tenant.notification_preferences or {}
            
            # Only send if enabled and there are findings
            if notification_prefs.get("notify_on_scan_complete", True) and all_findings:
                # Get stored findings from this scan
                finding_objects = (
                    db.query(Finding)
                    .filter(
                        Finding.tenant_id == tenant_id,
                        Finding.scan_run_id == scan_run.id
                    )
                    .all()
                )
                
                if finding_objects:
                    send_notifications_for_findings(
                        db, tenant, finding_objects, notification_prefs
                    )
                    logger.info(f"Notifications sent for {len(finding_objects)} findings")
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}", exc_info=True)
        
        # Notify WebSocket connections about scan completion
        try:
            import asyncio
            from app.api.websocket import notify_scan_update
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(notify_scan_update(tenant_id, scan_run, db))
                else:
                    loop.run_until_complete(notify_scan_update(tenant_id, scan_run, db))
            except RuntimeError:
                # No event loop, create new one
                asyncio.run(notify_scan_update(tenant_id, scan_run, db))
        except Exception as e:
            logger.error(f"Failed to send WebSocket notification: {e}", exc_info=True)
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"Scan {scan_run.id} failed: {error_message}", exc_info=True)
        scan_run.status = "failed"
        scan_run.finished_at = datetime.utcnow()
        scan_run.summary = {"error": error_message, "error_type": type(e).__name__}
        db.commit()
        db.refresh(scan_run)
        
        # Notify WebSocket connections about scan failure
        try:
            import asyncio
            from app.api.websocket import notify_scan_update
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(notify_scan_update(tenant_id, scan_run, db))
                else:
                    loop.run_until_complete(notify_scan_update(tenant_id, scan_run, db))
            except RuntimeError:
                # No event loop, create new one
                asyncio.run(notify_scan_update(tenant_id, scan_run, db))
        except Exception as e:
            logger.error(f"Failed to send WebSocket notification: {e}", exc_info=True)
    
    return scan_run

