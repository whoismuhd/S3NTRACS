from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenData
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user


def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be superadmin."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


def require_tenant_access_factory(tenant_id: UUID):
    """Factory function to create a dependency that checks tenant access."""
    def _require_tenant_access(current_user: User = Depends(get_current_user)) -> User:
        """Require user to be superadmin or tenant_admin of this tenant."""
        if current_user.role == "superadmin":
            return current_user
        
        if current_user.role == "tenant_admin" and current_user.tenant_id == tenant_id:
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    return _require_tenant_access


def require_tenant_access(
    tenant_id: UUID,
    current_user: User = Depends(get_current_user),
) -> User:
    """Require user to be superadmin or tenant_admin of this tenant."""
    if current_user.role == "superadmin":
        return current_user
    
    if current_user.role == "tenant_admin" and current_user.tenant_id == tenant_id:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not enough permissions to access this tenant",
    )

