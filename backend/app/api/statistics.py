"""
Statistics and analytics endpoints for dashboards.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan_run import ScanRun
from app.models.tenant import Tenant
from app.models.user import User
from app.api.deps import get_current_user, require_superadmin

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get dashboard statistics.
    Superadmin sees all tenants, others see only their tenant.
    """
    # Determine which tenants to include
    if current_user.role == "superadmin":
        tenant_ids = [t.id for t in db.query(Tenant.id).all()]
    elif current_user.tenant_id:
        tenant_ids = [current_user.tenant_id]
    else:
        tenant_ids = []
    
    if not tenant_ids:
        return {
            "total_tenants": 0,
            "total_findings": 0,
            "findings_by_severity": {
                "CRITICAL": 0,
                "HIGH": 0,
                "MEDIUM": 0,
                "LOW": 0,
            },
            "findings_by_category": {},
            "total_scans": 0,
            "recent_scans": [],
        }
    
    # Get total tenants
    total_tenants = len(tenant_ids)
    
    # Get findings stats (from latest scans only)
    latest_scan_ids = []
    for tenant_id in tenant_ids:
        latest_scan = (
            db.query(ScanRun)
            .filter(ScanRun.tenant_id == tenant_id)
            .order_by(ScanRun.started_at.desc())
            .first()
        )
        if latest_scan:
            latest_scan_ids.append(latest_scan.id)
    
    # Count findings by severity (only if we have scans)
    if latest_scan_ids:
        severity_counts = (
            db.query(Finding.severity, func.count(Finding.id))
            .filter(Finding.scan_run_id.in_(latest_scan_ids))
            .group_by(Finding.severity)
            .all()
        )
    else:
        severity_counts = []
    
    findings_by_severity = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }
    
    for severity, count in severity_counts:
        findings_by_severity[severity] = count
    
    # Count findings by category (only if we have scans)
    if latest_scan_ids:
        category_counts = (
            db.query(Finding.category, func.count(Finding.id))
            .filter(Finding.scan_run_id.in_(latest_scan_ids))
            .group_by(Finding.category)
            .all()
        )
        findings_by_category = {category: count for category, count in category_counts}
    else:
        findings_by_category = {}
    
    # Total findings
    total_findings = sum(findings_by_severity.values())
    
    # Get recent scans
    recent_scans = (
        db.query(ScanRun)
        .filter(ScanRun.tenant_id.in_(tenant_ids))
        .order_by(ScanRun.started_at.desc())
        .limit(5)
        .all()
    )
    
    recent_scans_data = []
    for scan in recent_scans:
        tenant = db.query(Tenant).filter(Tenant.id == scan.tenant_id).first()
        recent_scans_data.append({
            "id": str(scan.id),
            "tenant_id": str(scan.tenant_id),
            "tenant_name": tenant.name if tenant else "Unknown",
            "status": scan.status,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "finished_at": scan.finished_at.isoformat() if scan.finished_at else None,
            "total_findings": scan.summary.get("total_findings", 0) if scan.summary else 0,
        })
    
    # Total scans
    total_scans = (
        db.query(func.count(ScanRun.id))
        .filter(ScanRun.tenant_id.in_(tenant_ids))
        .scalar()
    ) or 0
    
    return {
        "total_tenants": total_tenants,
        "total_findings": total_findings,
        "findings_by_severity": findings_by_severity,
        "findings_by_category": findings_by_category,
        "total_scans": total_scans,
        "recent_scans": recent_scans_data,
    }


@router.get("/tenant/{tenant_id}")
def get_tenant_statistics(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get statistics for a specific tenant."""
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
    
    # Get latest scan
    latest_scan = (
        db.query(ScanRun)
        .filter(ScanRun.tenant_id == tenant_id)
        .order_by(ScanRun.started_at.desc())
        .first()
    )
    
    if not latest_scan:
        return {
            "tenant_id": str(tenant_id),
            "tenant_name": tenant.name,
            "total_findings": 0,
            "findings_by_severity": {
                "CRITICAL": 0,
                "HIGH": 0,
                "MEDIUM": 0,
                "LOW": 0,
            },
            "findings_by_category": {},
            "total_scans": 0,
            "last_scan_date": None,
            "scan_status": None,
        }
    
    # Get findings for latest scan
    findings = db.query(Finding).filter(Finding.scan_run_id == latest_scan.id).all()
    
    findings_by_severity = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }
    
    findings_by_category = {}
    
    for finding in findings:
        findings_by_severity[finding.severity] = (
            findings_by_severity.get(finding.severity, 0) + 1
        )
        findings_by_category[finding.category] = (
            findings_by_category.get(finding.category, 0) + 1
        )
    
    # Total scans
    total_scans = (
        db.query(func.count(ScanRun.id))
        .filter(ScanRun.tenant_id == tenant_id)
        .scalar()
    ) or 0
    
    return {
        "tenant_id": str(tenant_id),
        "tenant_name": tenant.name,
        "total_findings": len(findings),
        "findings_by_severity": findings_by_severity,
        "findings_by_category": findings_by_category,
        "total_scans": total_scans,
        "last_scan_date": latest_scan.started_at.isoformat() if latest_scan.started_at else None,
        "scan_status": latest_scan.status,
    }

