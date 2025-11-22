import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserActivity(Base):
    """User activity log for audit trail."""
    __tablename__ = "user_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "user_created", "scan_triggered", "tenant_updated"
    resource_type = Column(String, nullable=True)  # e.g., "user", "tenant", "scan"
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(Text, nullable=True)  # JSON string or description
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # superadmin, tenant_admin, viewer
    name = Column(String, nullable=True)  # Display name for the account
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    # 2FA fields
    two_factor_enabled = Column(String, nullable=False, default="false")  # "true" or "false"
    two_factor_secret = Column(String, nullable=True)  # TOTP secret
    # Password reset fields
    reset_token = Column(String, nullable=True, index=True)  # Password reset token
    reset_token_expires = Column(DateTime, nullable=True)  # Token expiration time

    tenant = relationship("Tenant", back_populates="users")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")

