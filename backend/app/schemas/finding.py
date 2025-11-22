from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class FindingResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    scan_run_id: UUID
    category: str
    title: str
    description: Optional[str] = None
    severity: str
    resource_id: Optional[str] = None
    remediation: Optional[str] = None
    mapped_control: Optional[str] = None
    remediation_status: Optional[str] = None
    marked_as_fixed_at: Optional[datetime] = None
    marked_as_fixed_by: Optional[UUID] = None
    verified_fixed_at: Optional[datetime] = None
    remediation_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FindingFilter(BaseModel):
    severity: Optional[str] = None
    category: Optional[str] = None

