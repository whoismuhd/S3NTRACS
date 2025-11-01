from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class ScanRunCreate(BaseModel):
    tenant_id: UUID


class ScanRunResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    summary: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

