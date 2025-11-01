from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

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
    category: Optional[str] = Query(None, description="Filter by category (IAM, S3, LOGGING)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List findings for a tenant with optional filters and pagination."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
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
        valid_categories = ["IAM", "S3", "LOGGING"]
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
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found",
        )
    
    return finding

