from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.finding import Finding
from app.models.user import User
from app.schemas.finding import FindingResponse
from app.api.deps import get_current_user
from app.api.pagination import paginate_query, PaginatedResponse

router = APIRouter()


@router.get("/{tenant_id}", response_model=List[FindingResponse])
def list_findings(
    tenant_id: UUID,
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    category: Optional[str] = Query(None, description="Filter by category (IAM, S3, LOGGING, EC2, EBS, RDS, LAMBDA, CLOUDWATCH)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List findings for a tenant with optional filters and pagination."""
    # Check tenant access
    if current_user.role != "superadmin" and (
        (current_user.role not in ("tenant_admin", "viewer")) or current_user.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    query = db.query(Finding).filter(Finding.tenant_id == tenant_id)
    
    # Apply filters
    if severity:
        severity_upper = severity.upper()
        valid_severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        if severity_upper not in valid_severities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}",
            )
        query = query.filter(Finding.severity == severity_upper)
    
    if category:
        category_upper = category.upper()
        valid_categories = ["IAM", "S3", "LOGGING", "EC2", "EBS", "RDS", "LAMBDA", "CLOUDWATCH"]
        if category_upper not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}",
            )
        query = query.filter(Finding.category == category_upper)
    
    # Apply ordering
    query = query.order_by(
        Finding.severity.desc(),
        Finding.created_at.desc(),
    )
    
    # Paginate
    findings, total, total_pages = paginate_query(query, page, page_size)
    
    # For backward compatibility, return list directly
    # In future, could return PaginatedResponse[FindingResponse]
    return findings


@router.get("/{tenant_id}/{finding_id}", response_model=FindingResponse)
def get_finding(
    tenant_id: UUID,
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific finding."""
    # Check tenant access
    if current_user.role != "superadmin" and (
        (current_user.role not in ("tenant_admin", "viewer")) or current_user.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    finding = (
        db.query(Finding)
        .filter(Finding.id == finding_id, Finding.tenant_id == tenant_id)
        .first()
    )
    
    if not finding:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    return finding


@router.post("/{tenant_id}/{finding_id}/mark-fixed", response_model=FindingResponse)
def mark_finding_as_fixed(
    tenant_id: UUID,
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a finding as fixed. Will be verified on the next scan."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    finding = (
        db.query(Finding)
        .filter(Finding.id == finding_id, Finding.tenant_id == tenant_id)
        .first()
    )
    
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    # Update finding status
    finding.remediation_status = "marked_fixed"
    finding.marked_as_fixed_at = datetime.utcnow()
    finding.marked_as_fixed_by = current_user.id
    
    db.commit()
    db.refresh(finding)
    
    return finding


@router.post("/{tenant_id}/{finding_id}/mark-false-positive", response_model=FindingResponse)
def mark_finding_as_false_positive(
    tenant_id: UUID,
    finding_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a finding as false positive (not a real issue)."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    finding = (
        db.query(Finding)
        .filter(Finding.id == finding_id, Finding.tenant_id == tenant_id)
        .first()
    )
    
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    # Update finding status
    finding.remediation_status = "false_positive"
    finding.marked_as_fixed_at = datetime.utcnow()
    finding.marked_as_fixed_by = current_user.id
    
    db.commit()
    db.refresh(finding)
    
    return finding


@router.post("/{tenant_id}/bulk-mark-fixed")
def bulk_mark_findings_as_fixed(
    tenant_id: UUID,
    finding_ids: List[UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark multiple findings as fixed."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    findings = (
        db.query(Finding)
        .filter(Finding.id.in_(finding_ids), Finding.tenant_id == tenant_id)
        .all()
    )
    
    if not findings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No findings found",
        )
    
    updated_count = 0
    for finding in findings:
        finding.remediation_status = "marked_fixed"
        finding.marked_as_fixed_at = datetime.utcnow()
        finding.marked_as_fixed_by = current_user.id
        updated_count += 1
    
    db.commit()
    
    return {"message": f"Marked {updated_count} findings as fixed", "count": updated_count}


@router.delete("/{tenant_id}/cleanup-disabled-scanners")
def cleanup_disabled_scanner_findings(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete findings from disabled scanners (EC2, EBS, RDS, LAMBDA, CLOUDWATCH)."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Core scanners: IAM, S3, LOGGING only
    enabled_categories = ["IAM", "S3", "LOGGING"]
    disabled_categories = ["EC2", "EBS", "RDS", "LAMBDA", "CLOUDWATCH"]
    
    # Delete findings from disabled scanners
    deleted = (
        db.query(Finding)
        .filter(
            Finding.tenant_id == tenant_id,
            Finding.category.in_(disabled_categories)
        )
        .delete(synchronize_session=False)
    )
    
    db.commit()
    
    return {
        "message": f"Deleted {deleted} findings from disabled scanners",
        "deleted_count": deleted,
        "disabled_categories": disabled_categories
    }


@router.delete("/{tenant_id}/deduplicate")
def deduplicate_findings(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove duplicate findings, keeping only the most recent one for each unique (category, resource_id, title) combination."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Get all findings for this tenant
    all_findings = (
        db.query(Finding)
        .filter(Finding.tenant_id == tenant_id)
        .order_by(Finding.created_at.desc())
        .all()
    )
    
    # Group by (category, resource_id, title)
    findings_by_key = {}
    duplicates_to_delete = []
    
    for finding in all_findings:
        key = (
            finding.category,
            finding.resource_id or "",
            finding.title
        )
        
        if key in findings_by_key:
            # This is a duplicate - keep the most recent one (already in dict)
            duplicates_to_delete.append(finding)
        else:
            findings_by_key[key] = finding
    
    # Delete duplicates
    deleted_count = 0
    for duplicate in duplicates_to_delete:
        db.delete(duplicate)
        deleted_count += 1
    
    db.commit()
    
    return {
        "message": f"Removed {deleted_count} duplicate findings",
        "deleted_count": deleted_count,
        "unique_findings": len(findings_by_key)
    }

