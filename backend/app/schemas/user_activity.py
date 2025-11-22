from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserActivityResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    user_email: Optional[str] = None  # For display purposes

    class Config:
        from_attributes = True









