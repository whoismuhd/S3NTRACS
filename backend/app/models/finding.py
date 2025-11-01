import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Finding(Base):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    scan_run_id = Column(UUID(as_uuid=True), ForeignKey("scan_runs.id"), nullable=False)
    category = Column(String, nullable=False)  # IAM, S3, LOGGING
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    resource_id = Column(String, nullable=True)
    remediation = Column(Text, nullable=True)
    mapped_control = Column(String, nullable=True)  # e.g., "ISO 27001 A.9.4.3"
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="findings")
    scan_run = relationship("ScanRun", back_populates="findings")

