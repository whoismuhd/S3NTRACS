"""
Notification API endpoints for configuring and managing alerts.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.alert import Alert
from app.api.deps import get_current_user, require_superadmin
from app.services.notification_service import send_email_notification, send_slack_notification, send_notifications_for_findings

router = APIRouter()


class NotificationPreferences(BaseModel):
    email_enabled: bool = False
    email_recipients: List[EmailStr] = []
    slack_enabled: bool = False
    slack_webhook_url: Optional[str] = None
    min_severity: str = "MEDIUM"  # CRITICAL, HIGH, MEDIUM, LOW
    notify_on_scan_complete: bool = True
    notify_on_critical_only: bool = False


class NotificationPreferencesResponse(BaseModel):
    tenant_id: UUID
    preferences: Dict[str, Any]

    class Config:
        from_attributes = True


class NotificationHistoryItem(BaseModel):
    id: UUID
    tenant_id: UUID
    finding_id: UUID
    channel: str
    status: str
    created_at: datetime
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    finding: Optional[Dict[str, Any]] = None


@router.get("/preferences/{tenant_id}", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get notification preferences for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (
        (current_user.role not in ("tenant_admin", "viewer")) or current_user.tenant_id != tenant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    prefs = tenant.notification_preferences or {
        "email_enabled": False,
        "email_recipients": [],
        "slack_enabled": False,
        "slack_webhook_url": None,
        "min_severity": "MEDIUM",
        "notify_on_scan_complete": True,
        "notify_on_critical_only": False,
    }
    
    return {
        "tenant_id": tenant.id,
        "preferences": prefs,
    }


@router.put("/preferences/{tenant_id}", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    tenant_id: UUID,
    preferences: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notification preferences for a tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Validate severity
    valid_severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    if preferences.min_severity not in valid_severities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}",
        )
    
    # Update preferences
    tenant.notification_preferences = preferences.dict()
    db.commit()
    db.refresh(tenant)
    
    return {
        "tenant_id": tenant.id,
        "preferences": tenant.notification_preferences,
    }


@router.post("/test/email/{tenant_id}")
def test_email_notification(
    tenant_id: UUID,
    recipients: List[EmailStr] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a test email notification."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Get latest findings for test, or create a dummy finding if none exist
    from app.models.finding import Finding
    test_findings = (
        db.query(Finding)
        .filter(Finding.tenant_id == tenant_id)
        .order_by(Finding.created_at.desc())
        .limit(5)
        .all()
    )
    
    # If no findings exist, create a dummy finding for testing
    if not test_findings:
        from app.models.finding import Finding as FindingModel
        dummy_finding = FindingModel(
            tenant_id=tenant_id,
            scan_run_id=None,  # Test finding
            title="Test Notification",
            description="This is a test notification from S3ntraCS to verify your email configuration is working correctly.",
            severity="MEDIUM",
            category="SYSTEM",
            resource_id="test-notification",
            remediation="No action required - this is a test notification.",
        )
        db.add(dummy_finding)
        db.commit()
        db.refresh(dummy_finding)
        test_findings = [dummy_finding]
    
    success = send_email_notification(
        db, tenant, test_findings, [str(r) for r in recipients],
        subject=f"Test Notification - S3ntraCS Security Alert"
    )
    
    if success:
        return {"status": "success", "message": f"Test email sent to {len(recipients)} recipient(s)"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email. Check SMTP configuration.",
        )


@router.post("/test/slack/{tenant_id}")
async def test_slack_notification(
    tenant_id: UUID,
    webhook_url: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a test Slack notification."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Get latest findings for test, or create a dummy finding if none exist
    from app.models.finding import Finding
    test_findings = (
        db.query(Finding)
        .filter(Finding.tenant_id == tenant_id)
        .order_by(Finding.created_at.desc())
        .limit(5)
        .all()
    )
    
    # If no findings exist, create a dummy finding for testing
    if not test_findings:
        from app.models.finding import Finding as FindingModel
        dummy_finding = FindingModel(
            tenant_id=tenant_id,
            scan_run_id=None,  # Test finding
            title="Test Notification",
            description="This is a test notification from S3ntraCS to verify your Slack webhook is working correctly.",
            severity="MEDIUM",
            category="SYSTEM",
            resource_id="test-notification",
            remediation="No action required - this is a test notification.",
        )
        db.add(dummy_finding)
        db.commit()
        db.refresh(dummy_finding)
        test_findings = [dummy_finding]
    
    success = await send_slack_notification(db, tenant, test_findings, webhook_url)
    
    if success:
        return {"status": "success", "message": "Test Slack message sent"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test Slack message. Check webhook URL.",
        )


def _query_alerts_with_findings(db: Session, tenant_ids: Optional[List[UUID]], limit: int):
    from app.models.finding import Finding

    query = (
        db.query(Alert, Finding)
        .outerjoin(Finding, Alert.finding_id == Finding.id)
        .order_by(Alert.created_at.desc())
    )

    if tenant_ids:
        query = query.filter(Alert.tenant_id.in_(tenant_ids))

    return query.limit(limit).all()


def _serialize_alert_rows(alert_rows) -> List[NotificationHistoryItem]:
    response_items: List[NotificationHistoryItem] = []
    for alert, finding in alert_rows:
        finding_payload = None
        if finding:
            finding_payload = {
                "id": finding.id,
                "title": finding.title,
                "severity": finding.severity,
                "category": finding.category,
                "resource_id": finding.resource_id,
            }
        response_items.append(
            NotificationHistoryItem(
                id=alert.id,
                tenant_id=alert.tenant_id,
                finding_id=alert.finding_id,
                channel=alert.channel,
                status=alert.status,
                created_at=alert.created_at,
                sent_at=alert.sent_at,
                error_message=alert.error_message,
                finding=finding_payload,
            )
        )
    return response_items


@router.get("/history/{tenant_id}", response_model=List[NotificationHistoryItem])
def get_notification_history(
    tenant_id: UUID,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get notification history for a specific tenant."""
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )

    alert_rows = _query_alerts_with_findings(db, [tenant_id], limit)
    return _serialize_alert_rows(alert_rows)


@router.get("/history", response_model=List[NotificationHistoryItem])
def get_notification_history_all(
    tenant_id: Optional[UUID] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notification history. Superadmins can see all tenants or pass a specific tenant_id.
    Tenant admins can only view their assigned tenant.
    """
    if tenant_id:
        # Reuse existing per-tenant logic (will perform access checks)
        return get_notification_history(
            tenant_id=tenant_id,
            limit=limit,
            db=db,
            current_user=current_user,
        )

    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access notification history for all tenants",
        )

    alert_rows = _query_alerts_with_findings(db, tenant_ids=None, limit=limit)
    return _serialize_alert_rows(alert_rows)

