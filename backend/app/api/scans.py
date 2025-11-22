from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.scan_run import ScanRun
from app.models.user import User
from app.schemas.scan_run import ScanRunResponse
from app.services.scan_service import run_scan
from app.services.background_tasks import run_scan_background
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/run/{tenant_id}", response_model=ScanRunResponse)
def trigger_scan(
    tenant_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a security scan for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (
        (current_user.role not in ("tenant_admin", "viewer")) or current_user.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    # Check if there's already a running scan
    existing_scan = (
        db.query(ScanRun)
        .filter(ScanRun.tenant_id == tenant_id, ScanRun.status == "running")
        .first()
    )
    
    if existing_scan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A scan is already running for this tenant",
        )
    
    # Create scan run record first
    from datetime import datetime
    
    scan_run = ScanRun(
        tenant_id=tenant_id,
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(scan_run)
    db.commit()
    db.refresh(scan_run)
    
    # Run scan in background
    background_tasks.add_task(run_scan_background, scan_run.id, tenant_id)
    
    return scan_run


@router.get("/{tenant_id}", response_model=List[ScanRunResponse])
def list_scans(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all scan runs for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (
        (current_user.role not in ("tenant_admin", "viewer")) or current_user.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    scans = (
        db.query(ScanRun)
        .filter(ScanRun.tenant_id == tenant_id)
        .order_by(ScanRun.started_at.desc())
        .all()
    )
    
    return scans


@router.get("/{tenant_id}/latest", response_model=ScanRunResponse)
def get_latest_scan(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the latest scan run for a tenant with recalculated summary from actual findings."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    scan = (
        db.query(ScanRun)
        .filter(ScanRun.tenant_id == tenant_id)
        .order_by(ScanRun.started_at.desc())
        .first()
    )
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scans found for this tenant",
        )
    
    # Recalculate summary from actual findings to ensure accuracy
    # This handles cases where findings were deduplicated or updated after scan completion
    from app.models.finding import Finding
    from app.models.tenant import Tenant
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant:
        # Get all findings for this scan
        all_findings = db.query(Finding).filter(Finding.scan_run_id == scan.id).all()
        
        # Filter by enabled scanners
        enabled_scanners = tenant.enabled_scanners if tenant.enabled_scanners else ["IAM", "S3", "LOGGING", "EC2", "EBS", "RDS", "LAMBDA", "CLOUDWATCH"]
        findings = [f for f in all_findings if f.category in enabled_scanners]
        
        # Recalculate summary from actual findings
        by_severity = {
            "CRITICAL": 0,
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0,
        }
        by_category = {}
        
        for finding in findings:
            by_severity[finding.severity] = by_severity.get(finding.severity, 0) + 1
            by_category[finding.category] = by_category.get(finding.category, 0) + 1
        
        # Update summary with recalculated values
        if scan.summary:
            scan.summary["total_findings"] = len(findings)
            scan.summary["by_severity"] = by_severity
            scan.summary["by_category"] = by_category
        else:
            scan.summary = {
                "total_findings": len(findings),
                "by_severity": by_severity,
                "by_category": by_category,
            }
    
    return scan

