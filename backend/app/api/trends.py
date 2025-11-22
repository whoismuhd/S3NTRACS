"""
Trends and historical scan analysis endpoints.
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from uuid import UUID
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan_run import ScanRun
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


def calculate_security_score(findings_by_severity: Dict[str, int]) -> float:
    """
    Calculate a security score from 0-100 based on findings.
    Lower score = worse security posture.
    
    Scoring (more realistic penalties):
    - Base score: 100
    - CRITICAL: -35 each (e.g., exposed credentials, public admin access)
    - HIGH: -20 each (e.g., IAM user without MFA, public S3 bucket)
    - MEDIUM: -8 each (e.g., missing encryption, overly permissive policies)
    - LOW: -2 each (e.g., minor configuration issues)
    
    Examples:
    - 1 HIGH finding (IAM without MFA) = 80/100 (Fair, not Good)
    - 2 HIGH findings = 60/100 (Good threshold)
    - 1 CRITICAL = 65/100 (Fair)
    - 3 HIGH findings = 40/100 (Fair)
    """
    score = 100.0
    score -= findings_by_severity.get("CRITICAL", 0) * 35
    score -= findings_by_severity.get("HIGH", 0) * 20
    score -= findings_by_severity.get("MEDIUM", 0) * 8
    score -= findings_by_severity.get("LOW", 0) * 2
    
    return max(0.0, min(100.0, score))


@router.get("/{tenant_id}/history")
def get_scan_history(
    tenant_id: UUID,
    days: int = Query(30, ge=1, le=365, description="Number of days of history to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get scan history and trends for a tenant.
    Returns historical scan data with security scores and trend analysis.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all completed scans in the date range
    scans = (
        db.query(ScanRun)
        .filter(
            and_(
                ScanRun.tenant_id == tenant_id,
                ScanRun.status == "completed",
                ScanRun.started_at >= start_date,
                ScanRun.started_at <= end_date
            )
        )
        .order_by(ScanRun.started_at.asc())
        .all()
    )
    
    if not scans:
        return {
            "tenant_id": str(tenant_id),
            "period_days": days,
            "scans": [],
            "trends": {
                "security_score_trend": [],
                "findings_count_trend": [],
                "severity_trends": {
                    "CRITICAL": [],
                    "HIGH": [],
                    "MEDIUM": [],
                    "LOW": [],
                },
                "category_trends": {},
            },
            "summary": {
                "total_scans": 0,
                "average_score": None,
                "score_change": None,
                "findings_change": None,
            },
        }
    
    # Build scan history with findings and scores
    scan_history = []
    for scan in scans:
        findings = db.query(Finding).filter(Finding.scan_run_id == scan.id).all()
        
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
        
        security_score = calculate_security_score(findings_by_severity)
        
        scan_history.append({
            "scan_id": str(scan.id),
            "scan_date": scan.started_at.isoformat() if scan.started_at else None,
            "finished_at": scan.finished_at.isoformat() if scan.finished_at else None,
            "total_findings": len(findings),
            "findings_by_severity": findings_by_severity,
            "findings_by_category": findings_by_category,
            "security_score": round(security_score, 2),
        })
    
    # Calculate trends
    security_score_trend = [
        {"date": scan["scan_date"], "score": scan["security_score"]}
        for scan in scan_history
    ]
    
    findings_count_trend = [
        {"date": scan["scan_date"], "count": scan["total_findings"]}
        for scan in scan_history
    ]
    
    severity_trends = {
        "CRITICAL": [
            {"date": scan["scan_date"], "count": scan["findings_by_severity"]["CRITICAL"]}
            for scan in scan_history
        ],
        "HIGH": [
            {"date": scan["scan_date"], "count": scan["findings_by_severity"]["HIGH"]}
            for scan in scan_history
        ],
        "MEDIUM": [
            {"date": scan["scan_date"], "count": scan["findings_by_severity"]["MEDIUM"]}
            for scan in scan_history
        ],
        "LOW": [
            {"date": scan["scan_date"], "count": scan["findings_by_severity"]["LOW"]}
            for scan in scan_history
        ],
    }
    
    # Category trends
    all_categories = set()
    for scan in scan_history:
        all_categories.update(scan["findings_by_category"].keys())
    
    category_trends = {}
    for category in all_categories:
        category_trends[category] = [
            {
                "date": scan["scan_date"],
                "count": scan["findings_by_category"].get(category, 0)
            }
            for scan in scan_history
        ]
    
    # Calculate summary statistics
    total_scans = len(scan_history)
    
    if total_scans > 0:
        scores = [scan["security_score"] for scan in scan_history]
        average_score = sum(scores) / len(scores)
        
        # Calculate changes (comparing first and last scan)
        first_scan = scan_history[0]
        last_scan = scan_history[-1]
        
        score_change = round(last_scan["security_score"] - first_scan["security_score"], 2)
        findings_change = last_scan["total_findings"] - first_scan["total_findings"]
    else:
        average_score = None
        score_change = None
        findings_change = None
    
    return {
        "tenant_id": str(tenant_id),
        "period_days": days,
        "scans": scan_history,
        "trends": {
            "security_score_trend": security_score_trend,
            "findings_count_trend": findings_count_trend,
            "severity_trends": severity_trends,
            "category_trends": category_trends,
        },
        "summary": {
            "total_scans": total_scans,
            "average_score": round(average_score, 2) if average_score is not None else None,
            "score_change": score_change,
            "findings_change": findings_change,
            "first_scan_date": scan_history[0]["scan_date"] if scan_history else None,
            "last_scan_date": scan_history[-1]["scan_date"] if scan_history else None,
        },
    }


@router.get("/{tenant_id}/compare")
def compare_scans(
    tenant_id: UUID,
    scan_id_1: UUID = Query(..., description="First scan ID to compare"),
    scan_id_2: UUID = Query(..., description="Second scan ID to compare"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Compare two scans side by side.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Get scans
    scan1 = db.query(ScanRun).filter(
        and_(ScanRun.id == scan_id_1, ScanRun.tenant_id == tenant_id)
    ).first()
    scan2 = db.query(ScanRun).filter(
        and_(ScanRun.id == scan_id_2, ScanRun.tenant_id == tenant_id)
    ).first()
    
    if not scan1 or not scan2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both scans not found",
        )
    
    # Get findings for both scans
    findings1 = db.query(Finding).filter(Finding.scan_run_id == scan1.id).all()
    findings2 = db.query(Finding).filter(Finding.scan_run_id == scan2.id).all()
    
    # Calculate statistics for each scan
    def get_scan_stats(findings):
        findings_by_severity = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        findings_by_category = {}
        
        for finding in findings:
            findings_by_severity[finding.severity] = findings_by_severity.get(finding.severity, 0) + 1
            findings_by_category[finding.category] = findings_by_category.get(finding.category, 0) + 1
        
        security_score = calculate_security_score(findings_by_severity)
        
        return {
            "total_findings": len(findings),
            "findings_by_severity": findings_by_severity,
            "findings_by_category": findings_by_category,
            "security_score": round(security_score, 2),
        }
    
    stats1 = get_scan_stats(findings1)
    stats2 = get_scan_stats(findings2)
    
    # Calculate differences
    findings_diff = stats2["total_findings"] - stats1["total_findings"]
    score_diff = stats2["security_score"] - stats1["security_score"]
    
    severity_diff = {}
    for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        severity_diff[severity] = (
            stats2["findings_by_severity"][severity] - stats1["findings_by_severity"][severity]
        )
    
    return {
        "scan1": {
            "scan_id": str(scan1.id),
            "scan_date": scan1.started_at.isoformat() if scan1.started_at else None,
            **stats1,
        },
        "scan2": {
            "scan_id": str(scan2.id),
            "scan_date": scan2.started_at.isoformat() if scan2.started_at else None,
            **stats2,
        },
        "differences": {
            "findings_change": findings_diff,
            "score_change": round(score_diff, 2),
            "severity_changes": severity_diff,
        },
    }




