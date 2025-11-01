import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class ScanRun(Base):
    __tablename__ = "scan_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    summary = Column(JSON, nullable=True)

    tenant = relationship("Tenant", back_populates="scan_runs")
    findings = relationship("Finding", back_populates="scan_run", cascade="all, delete-orphan")

