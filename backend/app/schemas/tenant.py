from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class TenantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    aws_account_id: Optional[str] = None
    aws_role_arn: str
    aws_external_id: str


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    aws_account_id: Optional[str] = None
    aws_role_arn: Optional[str] = None
    aws_external_id: Optional[str] = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    aws_account_id: Optional[str] = None
    aws_role_arn: str
    aws_external_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

