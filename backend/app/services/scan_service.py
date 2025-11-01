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
    
    all_findings = []
    
    try:
        # Assume role
        logger.info(f"Assuming role for tenant {tenant_id}: {tenant.aws_role_arn}")
        session = assume_tenant_role(tenant.aws_role_arn, tenant.aws_external_id)
        
        # Run scanners (fail-soft: continue if one fails)
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
        
        # Store findings
        for finding_data in all_findings:
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
        
        # Calculate summary
        summary = {
            "total_findings": len(all_findings),
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
        
    except Exception as e:
        logger.error(f"Scan {scan_run.id} failed: {e}", exc_info=True)
        scan_run.status = "failed"
        scan_run.finished_at = datetime.utcnow()
        scan_run.summary = {"error": str(e)}
        db.commit()
        db.refresh(scan_run)
    
    return scan_run

