"""
GitHub Integration API endpoints for developer-first experience.
Enables PR comments, CI/CD hooks, and automated security scanning.
"""
import os
import hmac
import hashlib
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, Body
from sqlalchemy.orm import Session
from uuid import UUID
import httpx

from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.finding import Finding
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter()

# GitHub API base URL
GITHUB_API_BASE = "https://api.github.com"


def verify_github_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify GitHub webhook signature."""
    if not secret:
        return False
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected_signature}", signature)


@router.post("/webhook")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(None, alias="X-GitHub-Event"),
    x_github_signature: str = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db),
):
    """
    GitHub webhook endpoint for PR events.
    Receives webhook events and posts security findings as PR comments.
    """
    payload = await request.body()
    
    # Verify signature if secret is configured
    github_secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    if github_secret:
        if not verify_github_signature(payload, x_github_signature or "", github_secret):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
    
    event_data = json.loads(payload)
    event_type = x_github_event
    
    if event_type == "pull_request" and event_data.get("action") in ["opened", "synchronize"]:
        # Handle PR opened/updated
        pr = event_data.get("pull_request", {})
        repo = event_data.get("repository", {})
        
        # Extract PR metadata
        pr_number = pr.get("number")
        repo_full_name = repo.get("full_name")
        repo_owner = repo.get("owner", {}).get("login")
        repo_name = repo.get("name")
        pr_head_sha = pr.get("head", {}).get("sha")
        
        # Find tenant by repository (you might want to store this mapping in DB)
        # For now, we'll use a simple approach - scan all tenants or use a config
        tenants = db.query(Tenant).all()
        
        # Post findings as PR comment
        for tenant in tenants:
            findings = (
                db.query(Finding)
                .filter(
                    Finding.tenant_id == tenant.id,
                    Finding.remediation_status.in_(["open", "marked_fixed"])
                )
                .order_by(Finding.severity.desc(), Finding.created_at.desc())
                .limit(50)  # Limit to top 50 findings
                .all()
            )
            
            if findings:
                await post_pr_comment(
                    repo_owner=repo_owner,
                    repo_name=repo_name,
                    pr_number=pr_number,
                    findings=findings,
                    tenant_name=tenant.name
                )
    
    return {"status": "ok", "event": event_type}


async def post_pr_comment(
    repo_owner: str,
    repo_name: str,
    pr_number: int,
    findings: List[Finding],
    tenant_name: str,
    github_token: Optional[str] = None
):
    """Post security findings as a PR comment."""
    github_token = github_token or os.getenv("GITHUB_TOKEN", "")
    
    if not github_token:
        # Can't post without token
        return
    
    # Group findings by severity
    critical = [f for f in findings if f.severity == "CRITICAL"]
    high = [f for f in findings if f.severity == "HIGH"]
    medium = [f for f in findings if f.severity == "MEDIUM"]
    low = [f for f in findings if f.severity == "LOW"]
    
    # Build comment body
    comment_body = f"""## 🔒 Security Findings for {tenant_name}

"""
    
    if critical:
        comment_body += f"### ⚠️ Critical ({len(critical)})\n\n"
        for finding in critical[:5]:  # Limit to top 5
            comment_body += f"- **{finding.title}** - {finding.category}\n"
        if len(critical) > 5:
            comment_body += f"- *... and {len(critical) - 5} more*\n"
        comment_body += "\n"
    
    if high:
        comment_body += f"### 🔴 High ({len(high)})\n\n"
        for finding in high[:5]:
            comment_body += f"- **{finding.title}** - {finding.category}\n"
        if len(high) > 5:
            comment_body += f"- *... and {len(high) - 5} more*\n"
        comment_body += "\n"
    
    if medium:
        comment_body += f"### 🟡 Medium ({len(medium)})\n\n"
        for finding in medium[:3]:
            comment_body += f"- **{finding.title}** - {finding.category}\n"
        if len(medium) > 3:
            comment_body += f"- *... and {len(medium) - 3} more*\n"
        comment_body += "\n"
    
    from app.core.app_config import WEBSITE_URL
    comment_body += f"""
**Total Findings:** {len(findings)}

View all findings and remediation steps in [S3ntraCS Dashboard]({WEBSITE_URL}/tenants/{findings[0].tenant_id if findings else ""})

---
*This comment was automatically generated by S3ntraCS Security Scanner*
"""
    
    # Post comment via GitHub API
    async with httpx.AsyncClient() as client:
        url = f"{GITHUB_API_BASE}/repos/{repo_owner}/{repo_name}/issues/{pr_number}/comments"
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        data = {"body": comment_body}
        
        try:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
        except httpx.HTTPError as e:
            print(f"Failed to post PR comment: {e}")
            raise


@router.post("/pr-comment/{tenant_id}")
async def create_pr_comment(
    tenant_id: UUID,
    repo_owner: str = Body(...),
    repo_name: str = Body(...),
    pr_number: int = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually post security findings as a PR comment."""
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
    
    findings = (
        db.query(Finding)
        .filter(
            Finding.tenant_id == tenant_id,
            Finding.remediation_status.in_(["open", "marked_fixed"])
        )
        .order_by(Finding.severity.desc(), Finding.created_at.desc())
        .limit(50)
        .all()
    )
    
    await post_pr_comment(
        repo_owner=repo_owner,
        repo_name=repo_name,
        pr_number=pr_number,
        findings=findings,
        tenant_name=tenant.name
    )
    
    return {"status": "success", "findings_count": len(findings)}


@router.get("/repos")
async def list_github_repos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List GitHub repositories (requires GitHub token)."""
    github_token = os.getenv("GITHUB_TOKEN", "")
    
    if not github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub token not configured",
        )
    
    async with httpx.AsyncClient() as client:
        url = f"{GITHUB_API_BASE}/user/repos"
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        try:
            response = await client.get(url, headers=headers, params={"per_page": 100})
            response.raise_for_status()
            repos = response.json()
            return [{"name": r["name"], "full_name": r["full_name"], "owner": r["owner"]["login"]} for r in repos]
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch repositories: {str(e)}",
            )


@router.post("/ci-scan")
async def ci_scan_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    CI/CD webhook endpoint for automated scanning.
    Can be called from GitHub Actions, GitLab CI, Jenkins, etc.
    """
    try:
        payload = await request.json()
    except:
        payload = {}
    
    # Extract CI metadata
    ci_type = payload.get("ci_type", "github_actions")
    tenant_id = payload.get("tenant_id")
    repo = payload.get("repo")
    branch = payload.get("branch", "main")
    commit_sha = payload.get("commit_sha")
    
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required",
        )
    
    # Trigger scan (you might want to queue this)
    from app.services.background_tasks import run_scan_background
    from app.models.scan_run import ScanRun
    from datetime import datetime
    
    tenant = db.query(Tenant).filter(Tenant.id == UUID(tenant_id)).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Create scan run
    scan_run = ScanRun(
        tenant_id=tenant.id,
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(scan_run)
    db.commit()
    db.refresh(scan_run)
    
    # Run scan in background
    run_scan_background(scan_run.id, tenant.id)
    
    return {
        "status": "scan_triggered",
        "scan_id": str(scan_run.id),
        "tenant": tenant.name,
        "repo": repo,
        "branch": branch,
    }

