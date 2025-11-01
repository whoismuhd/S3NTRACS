from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.api.deps import get_current_user, require_superadmin
from app.core.validation import (
    validate_aws_role_arn,
    validate_aws_account_id,
    validate_external_id,
)

router = APIRouter()


@router.get("/", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tenants (superadmin sees all, tenant_admin sees only their tenant)."""
    if current_user.role == "superadmin":
        tenants = db.query(Tenant).all()
    elif current_user.role == "tenant_admin" and current_user.tenant_id:
        tenants = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).all()
    else:
        tenants = []
    
    return tenants


@router.post("/", response_model=TenantResponse)
def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create a new tenant (superadmin only)."""
    # Validate AWS role ARN
    if not validate_aws_role_arn(tenant_data.aws_role_arn):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid AWS role ARN format",
        )
    
    # Validate AWS account ID if provided
    if tenant_data.aws_account_id and not validate_aws_account_id(tenant_data.aws_account_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid AWS account ID format (must be 12 digits)",
        )
    
    # Validate external ID
    if not validate_external_id(tenant_data.aws_external_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid external ID format",
        )
    
    tenant = Tenant(
        name=tenant_data.name,
        description=tenant_data.description,
        aws_account_id=tenant_data.aws_account_id,
        aws_role_arn=tenant_data.aws_role_arn,
        aws_external_id=tenant_data.aws_external_id,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get tenant details."""
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
    
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update tenant (superadmin or tenant_admin of this tenant)."""
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
    
    # Update fields
    if tenant_data.name is not None:
        tenant.name = tenant_data.name
    if tenant_data.description is not None:
        tenant.description = tenant_data.description
    if tenant_data.aws_account_id is not None:
        tenant.aws_account_id = tenant_data.aws_account_id
    if tenant_data.aws_role_arn is not None:
        tenant.aws_role_arn = tenant_data.aws_role_arn
    if tenant_data.aws_external_id is not None:
        tenant.aws_external_id = tenant_data.aws_external_id
    
    db.commit()
    db.refresh(tenant)
    
    return tenant

