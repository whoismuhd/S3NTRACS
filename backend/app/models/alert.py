import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("findings.id"), nullable=False)
    channel = Column(String, nullable=False)  # email, slack, webhook
    status = Column(String, nullable=False, default="sent")  # sent, failed

