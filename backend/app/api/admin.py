from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.user import User, UserActivity
from app.models.tenant import Tenant
from app.schemas.user import UserResponse, AdminUserCreate, AdminUserUpdate
from app.schemas.user_activity import UserActivityResponse
from app.core.security import get_password_hash
from app.core.validation import validate_password_strength
from app.api.deps import get_current_user, require_superadmin

router = APIRouter()


def log_activity(
    db: Session,
    user_id: UUID,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[UUID] = None,
    details: Optional[str] = None,
    request: Optional[Request] = None,
):
    """Log user activity."""
    activity = UserActivity(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(activity)
    db.commit()


@router.get("/users", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List all users (superadmin only)."""
    users = db.query(User).offset(skip).limit(limit).all()
    
    # Log activity (request is not available in GET endpoints easily, so skip it)
    try:
        log_activity(
            db,
            current_user.id,
            "users_listed",
            details=f"Listed {len(users)} users",
        )
    except Exception:
        pass
    
    return users


@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: AdminUserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Create a new user (superadmin only)."""
    # Validate role
    if user_data.role not in ["superadmin", "tenant_admin", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be: superadmin, tenant_admin, or viewer",
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    # Validate tenant_id if provided
    if user_data.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == user_data.tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )
        # Only tenant_admin and viewer can be assigned to tenants
        if user_data.role == "superadmin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Superadmin cannot be assigned to a tenant",
            )
    
    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        tenant_id=user_data.tenant_id,
        name=user_data.name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "user_created",
        resource_type="user",
        resource_id=new_user.id,
        details=f"Created user {new_user.email} with role {new_user.role}",
        request=request,
    )
    
    return new_user


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Get user by ID (superadmin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Update user (superadmin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-demotion from superadmin
    if user.id == current_user.id and user_data.role and user_data.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role from superadmin",
        )
    
    # Validate role if provided
    if user_data.role is not None:
        if user_data.role not in ["superadmin", "tenant_admin", "viewer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be: superadmin, tenant_admin, or viewer",
            )
        user.role = user_data.role
    
    # Validate tenant_id if provided
    if user_data.tenant_id is not None:
        if user_data.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == user_data.tenant_id).first()
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found",
                )
            # Only tenant_admin and viewer can be assigned to tenants
            if user.role == "superadmin":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Superadmin cannot be assigned to a tenant",
                )
        user.tenant_id = user_data.tenant_id
    
    # Update name if provided
    if user_data.name is not None:
        if len(user_data.name.strip()) == 0:
            user.name = None
        elif len(user_data.name) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be longer than 100 characters",
            )
        else:
            user.name = user_data.name.strip()
    
    db.commit()
    db.refresh(user)
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "user_updated",
        resource_type="user",
        resource_id=user.id,
        details=f"Updated user {user.email}",
        request=request,
    )
    
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Delete user (superadmin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    user_email = user.email
    db.delete(user)
    db.commit()
    
    # Log activity
    log_activity(
        db,
        current_user.id,
        "user_deleted",
        resource_type="user",
        details=f"Deleted user {user_email}",
        request=request,
    )
    
    return {"message": "User deleted successfully"}


@router.get("/activities", response_model=List[UserActivityResponse])
def list_activities(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """List user activity logs (superadmin only)."""
    query = db.query(UserActivity)
    
    if user_id:
        query = query.filter(UserActivity.user_id == user_id)
    
    activities = query.order_by(UserActivity.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add user email for display
    result = []
    for activity in activities:
        activity_dict = {
            **activity.__dict__,
            "user_email": activity.user.email if activity.user else None,
        }
        result.append(activity_dict)
    
    return result

