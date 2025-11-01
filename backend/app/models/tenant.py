import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    aws_account_id = Column(String, nullable=True)
    aws_role_arn = Column(String, nullable=False)
    aws_external_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="tenant")
    scan_runs = relationship("ScanRun", back_populates="tenant", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="tenant", cascade="all, delete-orphan")

