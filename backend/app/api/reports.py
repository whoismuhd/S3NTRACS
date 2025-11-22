from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan_run import ScanRun
from app.models.tenant import Tenant
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/{tenant_id}/latest")
def generate_compliance_report(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Generate a compliance snapshot report for the latest scan.
    Maps findings to common compliance frameworks.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    # Get latest scan
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
    
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Latest scan is not completed (status: {scan.status})",
        )
    
    # Get tenant to check enabled scanners
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Get all findings for this scan, filtered by enabled scanners
    all_findings = db.query(Finding).filter(Finding.scan_run_id == scan.id).all()
    
    # Filter by enabled scanners
    enabled_scanners = tenant.enabled_scanners if tenant.enabled_scanners else ["IAM", "S3", "LOGGING"]
    findings = [f for f in all_findings if f.category in enabled_scanners]
    
    # Group by compliance framework
    compliance_mapping = {
        "ISO 27001": [],
        "GDPR": [],
        "SOC 2": [],
        "NIST CSF": [],
    }
    
    # Map findings to controls
    for finding in findings:
        if finding.mapped_control:
            if "ISO 27001" in finding.mapped_control:
                compliance_mapping["ISO 27001"].append({
                    "control": finding.mapped_control,
                    "finding_id": str(finding.id),
                    "title": finding.title,
                    "severity": finding.severity,
                    "category": finding.category,
                })
            elif "GDPR" in finding.mapped_control:
                compliance_mapping["GDPR"].append({
                    "control": finding.mapped_control,
                    "finding_id": str(finding.id),
                    "title": finding.title,
                    "severity": finding.severity,
                    "category": finding.category,
                })
        
        # Generic mappings
        if finding.severity in ["HIGH", "CRITICAL"]:
            compliance_mapping["SOC 2"].append({
                "control": "CC6 - Logical and Physical Access Controls",
                "finding_id": str(finding.id),
                "title": finding.title,
                "severity": finding.severity,
            })
    
    # Build report
    report = {
        "tenant_id": str(tenant_id),
        "scan_run_id": str(scan.id),
        "scan_date": scan.started_at.isoformat() if scan.started_at else None,
        "summary": scan.summary or {},
        "findings_by_severity": {
            "CRITICAL": len([f for f in findings if f.severity == "CRITICAL"]),
            "HIGH": len([f for f in findings if f.severity == "HIGH"]),
            "MEDIUM": len([f for f in findings if f.severity == "MEDIUM"]),
            "LOW": len([f for f in findings if f.severity == "LOW"]),
        },
        "findings_by_category": {},
        "compliance_mapping": compliance_mapping,
        "all_findings": [
            {
                "id": str(f.id),
                "category": f.category,
                "title": f.title,
                "severity": f.severity,
                "resource_id": f.resource_id,
                "remediation": f.remediation,
                "mapped_control": f.mapped_control,
            }
            for f in findings
        ],
    }
    
    # Count by category
    for finding in findings:
        category = finding.category
        report["findings_by_category"][category] = (
            report["findings_by_category"].get(category, 0) + 1
        )
    
    return report

