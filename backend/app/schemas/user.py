from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "viewer"
    tenant_id: Optional[UUID] = None
    name: Optional[str] = None


class AdminUserCreate(BaseModel):
    """Schema for admin creating users."""
    email: EmailStr
    password: str
    role: str = "viewer"  # superadmin, tenant_admin, viewer
    tenant_id: Optional[UUID] = None
    name: Optional[str] = None


class AdminUserUpdate(BaseModel):
    """Schema for admin updating users."""
    role: Optional[str] = None
    tenant_id: Optional[UUID] = None
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class TwoFactorSetup(BaseModel):
    verification_code: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    name: Optional[str] = None
    tenant_id: Optional[UUID] = None
    two_factor_enabled: Optional[str] = "false"

    class Config:
        from_attributes = True

