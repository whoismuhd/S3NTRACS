"""
Notification service for sending alerts via email and Slack.
"""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime
import httpx

from app.models.finding import Finding
from app.models.tenant import Tenant
from app.models.user import User
from app.models.alert import Alert
from app.core.app_config import WEBSITE_URL, SUPPORT_EMAIL
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def send_email_notification(
    db: Session,
    tenant: Tenant,
    findings: List[Finding],
    recipients: List[str],
    subject: Optional[str] = None,
) -> bool:
    """
    Send email notification about security findings.
    
    Args:
        db: Database session
        tenant: Tenant with findings
        findings: List of findings to report
        recipients: List of email addresses
        subject: Optional custom subject
        
    Returns:
        True if sent successfully, False otherwise
    """
    if not recipients:
        logger.warning(f"No recipients provided for email notification")
        return False
    
    # Get SMTP configuration from environment
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    
    if not smtp_user or not smtp_password:
        error_msg = "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables."
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    try:
        # Group findings by severity
        critical = [f for f in findings if f.severity == "CRITICAL"]
        high = [f for f in findings if f.severity == "HIGH"]
        medium = [f for f in findings if f.severity == "MEDIUM"]
        low = [f for f in findings if f.severity == "LOW"]
        
        # Build email content
        subject = subject or f"Security Alert: {len(findings)} findings in {tenant.name}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                .finding {{ background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #e5e7eb; }}
                .critical {{ border-left-color: #dc2626; }}
                .high {{ border-left-color: #ea580c; }}
                .medium {{ border-left-color: #f59e0b; }}
                .low {{ border-left-color: #3b82f6; }}
                .severity-badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px; }}
                .critical-badge {{ background: #fee2e2; color: #991b1b; }}
                .high-badge {{ background: #fed7aa; color: #9a3412; }}
                .medium-badge {{ background: #fef3c7; color: #92400e; }}
                .low-badge {{ background: #dbeafe; color: #1e40af; }}
                .stats {{ display: flex; gap: 20px; margin: 20px 0; }}
                .stat-box {{ flex: 1; background: white; padding: 15px; border-radius: 6px; text-align: center; }}
                .stat-number {{ font-size: 24px; font-weight: bold; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
                a {{ color: #667eea; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🔒 Security Alert</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Findings detected in {tenant.name}</p>
                </div>
                <div class="content">
                    <div class="stats">
                        <div class="stat-box">
                            <div class="stat-number" style="color: #dc2626;">{len(critical)}</div>
                            <div>Critical</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" style="color: #ea580c;">{len(high)}</div>
                            <div>High</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" style="color: #f59e0b;">{len(medium)}</div>
                            <div>Medium</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number" style="color: #3b82f6;">{len(low)}</div>
                            <div>Low</div>
                        </div>
                    </div>
                    
                    <h2>Top Findings</h2>
        """
        
        # Add top findings (limit to 10 most critical)
        top_findings = sorted(findings, key=lambda x: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].index(x.severity))[:10]
        
        for finding in top_findings:
            severity_class = finding.severity.lower()
            badge_class = f"{severity_class}-badge"
            html_body += f"""
                    <div class="finding {severity_class}">
                        <span class="severity-badge {badge_class}">{finding.severity}</span>
                        <strong>{finding.title}</strong>
                        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">{finding.category} • {finding.resource_id or 'N/A'}</p>
                        {f'<p style="margin: 8px 0 0 0; font-size: 13px;">{finding.description[:200]}...</p>' if finding.description else ''}
                    </div>
            """
        
        s3ntracs_url = WEBSITE_URL
        html_body += f"""
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="{s3ntracs_url}/tenants/{tenant.id}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                            View All Findings →
                        </a>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated security alert from S3ntraCS.</p>
                        <p>Total findings: {len(findings)} | Tenant: {tenant.name}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_from
        msg['To'] = ', '.join(recipients)
        
        # Plain text version
        text_body = f"""
Security Alert: {len(findings)} findings in {tenant.name}

Critical: {len(critical)}
High: {len(high)}
Medium: {len(medium)}
Low: {len(low)}

Top Findings:
"""
        for finding in top_findings[:5]:
            text_body += f"\n[{finding.severity}] {finding.title} - {finding.category}\n"
        
        text_body += f"\nView all findings: {s3ntracs_url}/tenants/{tenant.id}\n"
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        # Log alert
        for finding in findings:
            for recipient in recipients:
                alert = Alert(
                    tenant_id=tenant.id,
                    finding_id=finding.id,
                    channel="email",
                    status="sent",
                )
                db.add(alert)
        
        db.commit()
        logger.info(f"Email notification sent to {len(recipients)} recipients for {len(findings)} findings")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}", exc_info=True)
        # Log failed alert
        for finding in findings:
            alert = Alert(
                tenant_id=tenant.id,
                finding_id=finding.id,
                channel="email",
                status="failed",
            )
            db.add(alert)
        db.commit()
        return False


async def send_slack_notification(
    db: Session,
    tenant: Tenant,
    findings: List[Finding],
    webhook_url: str,
) -> bool:
    """
    Send Slack notification about security findings.
    
    Args:
        db: Database session
        tenant: Tenant with findings
        findings: List of findings to report
        webhook_url: Slack webhook URL
        
    Returns:
        True if sent successfully, False otherwise
    """
    if not webhook_url:
        logger.warning("Slack webhook URL not provided")
        return False
    
    try:
        # Group findings by severity
        critical = [f for f in findings if f.severity == "CRITICAL"]
        high = [f for f in findings if f.severity == "HIGH"]
        medium = [f for f in findings if f.severity == "MEDIUM"]
        low = [f for f in findings if f.severity == "LOW"]
        
        s3ntracs_url = WEBSITE_URL
        
        # Build Slack message
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔒 Security Alert: {tenant.name}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Critical:*\n{len(critical)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*High:*\n{len(high)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Medium:*\n{len(medium)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Low:*\n{len(low)}"
                    }
                ]
            }
        ]
        
        # Add top findings
        top_findings = sorted(findings, key=lambda x: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].index(x.severity))[:5]
        
        if top_findings:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Top Findings:*"
                }
            })
            
            for finding in top_findings:
                severity_emoji = {
                    "CRITICAL": "🔴",
                    "HIGH": "🟠",
                    "MEDIUM": "🟡",
                    "LOW": "🔵"
                }.get(finding.severity, "⚪")
                
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{severity_emoji} *{finding.severity}*: {finding.title}\n_{finding.category}_ • {finding.resource_id or 'N/A'}"
                    }
                })
        
        # Add action button
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "View All Findings"
                    },
                    "url": f"{s3ntracs_url}/tenants/{tenant.id}",
                    "style": "primary"
                }
            ]
        })
        
        payload = {
            "text": f"Security Alert: {len(findings)} findings in {tenant.name}",
            "blocks": blocks
        }
        
        # Send to Slack
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload, timeout=10.0)
            response.raise_for_status()
        
        # Log alerts
        for finding in findings:
            alert = Alert(
                tenant_id=tenant.id,
                finding_id=finding.id,
                channel="slack",
                status="sent",
            )
            db.add(alert)
        
        db.commit()
        logger.info(f"Slack notification sent for {len(findings)} findings")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}", exc_info=True)
        # Log failed alerts
        for finding in findings:
            alert = Alert(
                tenant_id=tenant.id,
                finding_id=finding.id,
                channel="slack",
                status="failed",
            )
            db.add(alert)
        db.commit()
        return False


def send_notifications_for_findings(
    db: Session,
    tenant: Tenant,
    findings: List[Finding],
    notification_prefs: Optional[Dict] = None,
) -> Dict[str, bool]:
    """
    Send notifications for findings based on preferences.
    
    Args:
        db: Database session
        tenant: Tenant with findings
        findings: List of findings to notify about
        notification_prefs: Notification preferences dict
        
    Returns:
        Dict with notification results
    """
    results = {"email": False, "slack": False}
    
    if not findings:
        return results
    
    # Filter findings by severity based on preferences
    if notification_prefs and notification_prefs.get("notify_on_critical_only", False):
        # Only critical findings
        filtered_findings = [f for f in findings if f.severity == "CRITICAL"]
    else:
        min_severity = notification_prefs.get("min_severity", "MEDIUM") if notification_prefs else "MEDIUM"
        severity_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        min_severity_index = severity_order.index(min_severity) if min_severity in severity_order else 2
        
        filtered_findings = [
            f for f in findings
            if severity_order.index(f.severity) <= min_severity_index
        ]
    
    if not filtered_findings:
        return results
    
    # Send email notifications
    if notification_prefs and notification_prefs.get("email_enabled", False):
        email_recipients = notification_prefs.get("email_recipients", [])
        if email_recipients:
            results["email"] = send_email_notification(
                db, tenant, filtered_findings, email_recipients
            )
    
    # Send Slack notifications
    if notification_prefs and notification_prefs.get("slack_enabled", False):
        slack_webhook = notification_prefs.get("slack_webhook_url", "")
        if slack_webhook:
            import asyncio
            try:
                # Try to get existing event loop
                try:
                    loop = asyncio.get_running_loop()
                    # If we're in an async context, create a task
                    task = asyncio.create_task(send_slack_notification(db, tenant, filtered_findings, slack_webhook))
                    # Don't wait for it, but mark as sent (it will complete in background)
                    results["slack"] = True
                except RuntimeError:
                    # No running loop, create a new one
                    results["slack"] = asyncio.run(send_slack_notification(db, tenant, filtered_findings, slack_webhook))
            except Exception as e:
                logger.error(f"Failed to send Slack notification: {e}", exc_info=True)
                results["slack"] = False
    
    return results


def send_password_reset_email(
    db: Session,
    user: User,
    reset_url: str,
) -> bool:
    """
    Send password reset email to user.
    
    Args:
        db: Database session
        user: User requesting password reset
        reset_url: Full URL with reset token
        
    Returns:
        True if sent successfully, False otherwise
    """
    import os
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.core.app_config import SUPPORT_EMAIL
    
    # Get SMTP configuration from environment
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    
    if not smtp_user or not smtp_password:
        error_msg = "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables."
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    try:
        subject = "Password Reset Request - S3ntraCS"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🔒 Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your S3ntraCS account.</p>
                    <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">{reset_url}</p>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <div class="footer">
                        <p>This is an automated email from S3ntraCS.</p>
                        <p>If you have any questions, contact us at {SUPPORT_EMAIL}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
Password Reset Request - S3ntraCS

Hello,

We received a request to reset your password for your S3ntraCS account.

Click the link below to reset your password. This link will expire in 1 hour.

{reset_url}

If you didn't request a password reset, you can safely ignore this email.

This is an automated email from S3ntraCS.
If you have any questions, contact us at {SUPPORT_EMAIL}
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_from
        msg['To'] = user.email
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}", exc_info=True)
        return False

