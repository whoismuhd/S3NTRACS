"""
Export endpoints for findings and reports.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import csv
import io
from datetime import datetime

from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan_run import ScanRun
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/findings/{tenant_id}/csv")
def export_findings_csv(
    tenant_id: UUID,
    scan_run_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export findings to CSV format.
    If scan_run_id is provided, exports findings from that scan only.
    Otherwise, exports all findings for the tenant.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Get findings
    query = db.query(Finding).filter(Finding.tenant_id == tenant_id)
    
    if scan_run_id:
        query = query.filter(Finding.scan_run_id == scan_run_id)
    
    findings = query.order_by(
        Finding.severity.desc(),
        Finding.created_at.desc(),
    ).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID",
        "Category",
        "Title",
        "Description",
        "Severity",
        "Resource ID",
        "Remediation",
        "Mapped Control",
        "Created At",
    ])
    
    # Write data
    for finding in findings:
        writer.writerow([
            str(finding.id),
            finding.category,
            finding.title,
            finding.description or "",
            finding.severity,
            finding.resource_id or "",
            finding.remediation or "",
            finding.mapped_control or "",
            finding.created_at.isoformat() if finding.created_at else "",
        ])
    
    # Create response
    output.seek(0)
    filename = f"findings-{tenant_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )


@router.get("/findings/{tenant_id}/json")
def export_findings_json(
    tenant_id: UUID,
    scan_run_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export findings to JSON format.
    If scan_run_id is provided, exports findings from that scan only.
    Otherwise, exports all findings for the tenant.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Get findings
    query = db.query(Finding).filter(Finding.tenant_id == tenant_id)
    
    if scan_run_id:
        query = query.filter(Finding.scan_run_id == scan_run_id)
    
    findings = query.order_by(
        Finding.severity.desc(),
        Finding.created_at.desc(),
    ).all()
    
    # Convert to dict
    findings_data = []
    for finding in findings:
        findings_data.append({
            "id": str(finding.id),
            "category": finding.category,
            "title": finding.title,
            "description": finding.description,
            "severity": finding.severity,
            "resource_id": finding.resource_id,
            "remediation": finding.remediation,
            "mapped_control": finding.mapped_control,
            "created_at": finding.created_at.isoformat() if finding.created_at else None,
        })
    
    import json
    json_data = json.dumps(findings_data, indent=2)
    
    filename = f"findings-{tenant_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    
    return Response(
        content=json_data,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )

