import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
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
    
    # Remediation tracking
    remediation_status = Column(String, nullable=True, default='open')  # open, marked_fixed, verified_fixed, false_positive
    marked_as_fixed_at = Column(DateTime, nullable=True)
    marked_as_fixed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_fixed_at = Column(DateTime, nullable=True)
    remediation_metadata = Column(JSON, nullable=True)  # Store AWS CLI commands, Terraform code, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="findings")
    scan_run = relationship("ScanRun", back_populates="findings")
    marked_by_user = relationship("User", foreign_keys=[marked_as_fixed_by])

    __table_args__ = (
        Index('ix_findings_remediation_status', 'remediation_status'),
    )

