# S3ntraCS - Complete Documentation

> **S3ntraCS** (S3 + Sentinel + Cloud Security) - Cloud Security Posture Management Platform for AWS

**Version**: 0.1.0  
**Repository**: [https://github.com/whoismuhd/S3NTRACS](https://github.com/whoismuhd/S3NTRACS)  
**Support**: support@s3ntracs.com

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [What S3ntraCS Does](#what-s3ntracs-does)
4. [Features](#features)
5. [AWS Setup](#aws-setup)
6. [GitHub Integration](#github-integration)
7. [Email & Slack Notifications](#email--slack-notifications)
8. [Architecture](#architecture)
9. [Development](#development)
10. [Configuration Synchronization](#configuration-synchronization)
11. [Differentiation Strategy](#differentiation-strategy)
12. [Future Features](#future-features)
13. [Project Status](#project-status)
14. [UI/UX Improvements](#uiux-improvements)
15. [Troubleshooting](#troubleshooting)

---

## Overview

S3ntraCS is a **Cloud Security Posture Management (CSPM)** tool built for DevOps engineers and AWS security practitioners managing multiple AWS accounts.

### Why S3ntraCS?

- ✅ **Per-Account Scanner Configuration** - Enable IAM, S3, EC2, RDS, Lambda, CloudWatch, EBS, or Logging scanners per tenant via `enabled_scanners` field
- ✅ **STS AssumeRole Integration** - No long-lived credentials. Uses temporary tokens via STS AssumeRole with External ID
- ✅ **REST API Access** - JWT-authenticated API for programmatic CSPM integration in CI/CD pipelines
- ✅ **Multi-Account Management** - Centralize security posture across dev, staging, and production AWS accounts
- ✅ **Compliance Framework Mapping** - Automatic mapping to ISO 27001, GDPR, SOC 2, NIST CSF with JSON/CSV export
- ✅ **Granular Control** - Per-tenant scanner selection, scheduled scans, and custom notification preferences

### Use Cases

- **DevOps Teams**: Manage security posture across multiple AWS accounts with Infrastructure as Code. Integrate CSPM into CI/CD pipelines via REST API
- **AWS Security Practitioners**: Granular scanner selection per account, compliance framework mapping, and programmatic access for security automation
- **Platform Engineering Teams**: Build CSPM as a service for internal developer platforms. Multi-account management with per-tenant configuration
- **Compliance Automation**: Generate compliance reports programmatically. Export findings as JSON/CSV for audit workflows and SIEM integration

---

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- AWS account with IAM permissions
- Ports 3000 (frontend), 8000 (backend), and 5432 (database) available

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/whoismuhd/S3NTRACS.git
   cd S3ntraCS
   ```

2. **Start the application**
   ```bash
   ./run.sh
   ```
   
   Or manually:
   ```bash
   docker compose up -d --build
   sleep 10
   docker compose exec backend alembic upgrade head
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Create your account**
   - Navigate to http://localhost:3000/register
   - First user automatically becomes superadmin
   - Login and start adding AWS accounts

### Check Service Status

```bash
# See running containers
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

### Stop the Application

```bash
docker compose down
```

To also remove volumes (deletes database):
```bash
docker compose down -v
```

---

## What S3ntraCS Does

S3ntraCS connects to multiple AWS accounts (called "tenants"), performs automated security scans, identifies security misconfigurations and compliance issues, stores the findings, and provides dashboards and reports to help security teams track and remediate issues.

### How It Works - Step by Step

#### 1. Multi-Tenant Setup
- Allows administrators to onboard multiple AWS accounts (tenants) into the system
- Each tenant represents a customer or department with their own AWS account
- Stores AWS connection details securely (role ARN, external ID) - **never stores AWS credentials**

#### 2. AWS Connection (Secure)
- Uses AWS STS (Security Token Service) to assume a role in the target AWS account
- Uses "External ID" for additional security
- Gets temporary credentials (last 1 hour) - no long-lived keys stored
- The assumed role has read-only permissions to scan security configurations

#### 3. Security Scanning

When you trigger a scan, S3ntraCS runs multiple types of security checks:

**IAM Scanner:**
- Users without MFA (Multi-Factor Authentication)
- Users with AdministratorAccess policy
- Overly permissive inline policies

**S3 Scanner:**
- Publicly accessible buckets (via ACL)
- Public buckets via bucket policy
- Buckets without default encryption

**Logging Scanner:**
- CloudTrail not enabled
- CloudTrail missing global service events
- GuardDuty not enabled

**Additional Scanners:**
- EC2 security groups
- RDS configurations
- Lambda function security
- CloudWatch configurations
- EBS volume encryption

#### 4. Finding Management
- Stores each security issue as a "Finding"
- Each finding includes: title, description, severity, category, resource ID, remediation, and compliance mapping

#### 5. Dashboard & Analytics
- Overview statistics (total tenants, findings, scans)
- Tenant cards with security scores
- Real-time updates
- Historical tracking

#### 6. Compliance Reporting
- Automatic mapping to compliance frameworks (ISO 27001, GDPR, SOC 2, NIST CSF)
- Summary statistics
- Exportable reports (JSON, CSV)

---

## Features

### Core Capabilities

#### Security Scanning
- **IAM Security Checks**: Users without MFA, overly permissive policies, AdministratorAccess monitoring
- **S3 Bucket Security**: Public bucket detection, encryption verification, access policy analysis
- **Logging & Monitoring**: CloudTrail configuration checks, GuardDuty status verification
- **Additional Services**: EC2, RDS, Lambda, CloudWatch, EBS scanning

#### Dashboard & Analytics
- Real-time security score calculation
- Comprehensive findings overview
- Tenant-specific statistics
- Historical scan tracking
- Analytics dashboard with charts and trends

#### Compliance Reporting
- Automatic framework mapping (ISO 27001, GDPR, SOC 2, NIST CSF)
- Exportable reports (JSON, CSV)
- Detailed remediation guidance
- Compliance score per framework

#### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Secure AWS role assumption (STS)
- Two-factor authentication (2FA)
- No long-lived credentials stored

#### User Experience
- Dark mode support
- Keyboard shortcuts
- Help center with searchable documentation
- Real-time notifications
- Responsive design
- Professional UI/UX

### API Features

- JWT-based authentication
- Password strength validation
- Auto-superadmin for first user
- Role-based access control
- Background processing for scans
- Pagination support
- Comprehensive validation

---

## AWS Setup

### Step 1: Check Your Role

**If You're a Viewer:**
- Viewers cannot add AWS accounts - they can only view existing tenant data
- You need to be either:
  - **superadmin** (can add any AWS account)
  - **tenant_admin** (can manage your assigned tenant)

**If You Should Be Superadmin:**
If you were the first user to register, you should be superadmin. If not, a superadmin user needs to upgrade your role.

### Step 2: Add Your AWS Account (Superadmin Only)

1. **Go to Dashboard**: Click "Go to Dashboard" from the landing page
2. **Click "New Tenant"**: You'll see this button if you're a superadmin
3. **Fill in the form**:
   - **Tenant Name**: A friendly name (e.g., "My AWS Account")
   - **AWS Account ID**: Your 12-digit AWS account ID (optional but recommended)
   - **Description**: Optional notes
   - **AWS Role ARN**: The IAM role ARN (see Step 3 below)
   - **External ID**: A unique identifier (see Step 3 below)

### Step 3: Set Up AWS IAM Role

Before adding your AWS account, you need to create an IAM role in AWS that S3ntraCS can assume.

#### Create IAM Role in AWS Console

1. **Go to AWS IAM Console** → Roles → Create Role
2. **Trust relationship**: Set up cross-account access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::YOUR_S3NTRACS_ACCOUNT_ID:root"
         },
         "Action": "sts:AssumeRole",
         "Condition": {
           "StringEquals": {
             "sts:ExternalId": "your-unique-external-id-here"
           }
         }
       }
     ]
   }
   ```

3. **Attach permissions**: The role needs these permissions:
   - `IAMReadOnlyAccess` (or specific IAM read permissions)
   - `AmazonS3ReadOnlyAccess` (or specific S3 read permissions)
   - `CloudTrailReadOnlyAccess` (or CloudTrail read permissions)
   - `AmazonGuardDutyReadOnlyAccess` (optional, for GuardDuty checks)
   - `AmazonEC2ReadOnlyAccess` (for EC2 scanning)
   - `AmazonRDSReadOnlyAccess` (for RDS scanning)
   - `AWSLambdaReadOnlyAccess` (for Lambda scanning)
   - `CloudWatchReadOnlyAccess` (for CloudWatch scanning)

4. **Name the role**: e.g., `S3ntraCSRole`
5. **Copy the Role ARN**: It will look like `arn:aws:iam::123456789012:role/S3ntraCSRole`

#### Generate External ID
- Create a unique, random string (e.g., `s3ntracs-2024-unique-id-12345`)
- This ensures only S3ntraCS can assume the role
- Use this same External ID in the tenant form

### Step 4: Complete the Tenant Form

Enter:
- **AWS Role ARN**: The ARN you copied from AWS (e.g., `arn:aws:iam::123456789012:role/S3ntraCSRole`)
- **External ID**: The unique ID you used in the trust policy
- **AWS Account ID**: Your 12-digit AWS account ID (for reference)

### Step 5: Run Your First Scan

Once the tenant is created:
1. Click on the tenant card
2. Click "Run Scan" button
3. Wait for the scan to complete
4. View findings in the tenant detail page

### Troubleshooting AWS Setup

**"New Tenant" Button Not Showing?**
- You're not a superadmin
- Only superadmins can create tenants

**"Not enough permissions" Error?**
- Check your role in Settings
- You may need to ask a superadmin to upgrade your role

**Can't Assume Role Error?**
- Verify the IAM role trust policy
- Check the External ID matches
- Ensure the role ARN is correct
- Verify the role has necessary permissions

---

## GitHub Integration

S3ntraCS integrates with GitHub to provide security findings directly in your pull requests and CI/CD pipelines.

### Features

- 🔒 **PR Comments**: Security findings automatically posted as PR comments
- 🚀 **CI/CD Integration**: Automated scanning in GitHub Actions
- 📊 **Build Failures**: Optionally fail builds on critical findings
- 🔔 **Real-time Alerts**: Get notified of security issues in your workflow

### Setup

#### 1. Configure GitHub Token

Add a GitHub Personal Access Token with `repo` permissions:

```bash
# In your S3ntraCS backend environment
export GITHUB_TOKEN=ghp_your_token_here
export GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
export S3NTRACS_URL=https://your-s3ntracs-instance.com
```

#### 2. Set Up GitHub Webhook (Optional)

For automatic PR comments, configure a webhook in your GitHub repository:

1. Go to your repository → Settings → Webhooks
2. Click "Add webhook"
3. Set Payload URL: `https://your-s3ntracs-instance.com/github/webhook`
4. Set Content type: `application/json`
5. Set Secret: (same as `GITHUB_WEBHOOK_SECRET`)
6. Select events: `Pull requests`
7. Click "Add webhook"

#### 3. GitHub Actions Setup

Add the S3ntraCS security scan to your GitHub Actions workflow:

1. Create `.github/workflows/security-scan.yml`:
   ```yaml
   name: Security Scan

   on: [pull_request, push]

   jobs:
     security-scan:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger S3ntraCS Scan
           env:
             S3NTRACS_API_URL: ${{ secrets.S3NTRACS_API_URL }}
             S3NTRACS_API_TOKEN: ${{ secrets.S3NTRACS_API_TOKEN }}
             TENANT_ID: ${{ secrets.S3NTRACS_TENANT_ID }}
           run: |
             curl -X POST "${S3NTRACS_API_URL}/github/ci-scan" \
               -H "Authorization: Bearer ${S3NTRACS_API_TOKEN}" \
               -d '{"tenant_id": "${TENANT_ID}", "repo": "${{ github.repository }}"}'
   ```

2. Add secrets to your repository:
   - `S3NTRACS_API_URL`: Your S3ntraCS API URL
   - `S3NTRACS_API_TOKEN`: Your API token (get from S3ntraCS dashboard)
   - `S3NTRACS_TENANT_ID`: Your tenant UUID

### Usage

#### Automatic PR Comments

When a PR is opened or updated, S3ntraCS will:
1. Check for security findings in the associated AWS account
2. Post a formatted comment with findings grouped by severity
3. Include links to the S3ntraCS dashboard for detailed remediation

#### CI/CD Integration

The GitHub Action workflow will:
1. Trigger a security scan on PR/push events
2. Wait for scan completion
3. Post findings as PR comment
4. Optionally fail the build on critical findings

### API Endpoints

- `POST /github/webhook` - GitHub webhook endpoint
- `POST /github/pr-comment/{tenant_id}` - Manually post findings as PR comment
- `POST /github/ci-scan` - CI/CD webhook for triggering scans
- `GET /github/repos` - List GitHub repositories

### Troubleshooting

**Webhook not working:**
- Verify `GITHUB_WEBHOOK_SECRET` matches GitHub webhook secret
- Check webhook delivery logs in GitHub
- Ensure webhook URL is accessible

**PR comments not posting:**
- Verify `GITHUB_TOKEN` has `repo` permissions
- Check API logs for errors
- Ensure tenant has findings

**CI/CD scan failing:**
- Verify all secrets are set correctly
- Check API token is valid
- Ensure tenant ID is correct UUID format

---

## Email & Slack Notifications

S3ntraCS supports email and Slack notifications for security findings.

### Email Notifications

#### Prerequisites
- SMTP server access (Gmail, SendGrid, AWS SES, etc.)

#### Configuration

Set the following environment variables in your `docker-compose.yml` or `.env` file:

```yaml
# docker-compose.yml (backend service)
environment:
  - SMTP_HOST=smtp.gmail.com          # Your SMTP server hostname
  - SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
  - SMTP_USER=your-email@gmail.com     # SMTP username
  - SMTP_PASSWORD=your-app-password    # SMTP password or app password
  - SMTP_FROM=noreply@s3ntracs.com     # From email address
```

#### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASSWORD`

#### AWS SES Setup

1. **Verify your email domain** in AWS SES
2. **Create SMTP credentials** in AWS SES Console
3. Use the SMTP endpoint and credentials:
   ```yaml
   environment:
     - SMTP_HOST=email-smtp.us-east-1.amazonaws.com
     - SMTP_PORT=587
     - SMTP_USER=your-ses-smtp-username
     - SMTP_PASSWORD=your-ses-smtp-password
     - SMTP_FROM=noreply@yourdomain.com
   ```

#### Frontend Configuration

1. Navigate to a tenant detail page
2. Click the **"Notifications"** tab
3. Enable **Email Notifications**
4. Add email recipients (one per line or comma-separated)
5. Click **"Send Test Email"** to verify
6. Click **"Save Preferences"**

### Slack Notifications

#### Prerequisites
- Slack workspace access where you can create webhooks

#### Setup Steps

1. **Create a Slack Webhook**:
   - Go to [Slack API - Incoming Webhooks](https://api.slack.com/messaging/webhooks)
   - Click **"Create New Webhook"**
   - Select the channel where you want notifications
   - Copy the webhook URL

2. **Configure in S3ntraCS**:
   - Navigate to tenant detail page → **Notifications** tab
   - Enable **Slack Notifications**
   - Paste the webhook URL
   - Click **"Send Test Message"** to verify
   - Click **"Save Preferences"**

### Notification Rules

#### Minimum Severity

Choose which findings trigger notifications:
- **Critical Only**: Only CRITICAL findings
- **High and Above**: CRITICAL and HIGH findings
- **Medium and Above**: CRITICAL, HIGH, and MEDIUM findings
- **All Findings**: All findings regardless of severity

#### Notification Options

- **Notify on Scan Complete**: Send notification when a scan finishes (default: enabled)
- **Critical Findings Only**: Override minimum severity to only notify for CRITICAL findings

### Testing Notifications

#### Test Email
1. Go to **Notifications** tab
2. Add at least one email recipient
3. Click **"Send Test Email"**
4. Check your inbox for a test notification

#### Test Slack
1. Go to **Notifications** tab
2. Enter your Slack webhook URL
3. Click **"Send Test Message"**
4. Check your Slack channel for a test notification

### Troubleshooting

**Email Not Sending:**
- Check SMTP configuration: `docker compose logs backend | grep -i smtp`
- Verify credentials are correct
- Check firewall for port 587/465
- For Gmail: Use App Password, not regular password

**Slack Not Sending:**
- Verify webhook URL is correct and not expired
- Check channel permissions
- Test manually with curl
- Check backend logs: `docker compose logs backend | grep -i slack`

---

## Architecture

### Tech Stack

**Backend:**
- FastAPI (Python) - High-performance API framework
- PostgreSQL - Reliable database
- SQLAlchemy - ORM for database operations
- Alembic - Database migrations
- Boto3 - AWS SDK integration
- JWT - Authentication tokens

**Frontend:**
- React 18 - Modern UI framework
- Vite - Fast build tool
- TailwindCSS - Utility-first CSS
- Axios - HTTP client
- React Router - Client-side routing

**Infrastructure:**
- Docker & Docker Compose - Containerization
- PostgreSQL - Database
- Nginx (optional) - Reverse proxy

### Project Structure

```
S3ntraCS/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Configuration & security
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   └── alembic/         # Database migrations
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── api.js       # API client
│   └── dist/            # Build output
├── scanner/             # Lambda scanner functions
└── docs/                # Documentation
```

### Security Architecture

1. **No Credential Storage**
   - Never stores AWS access keys
   - Uses temporary credentials via STS AssumeRole
   - Credentials expire after 1 hour

2. **Role-Based Access Control**
   - **Superadmin**: Can see all tenants, create users
   - **Tenant Admin**: Can see only their tenant
   - **Viewer**: Read-only access

3. **Secure API**
   - JWT token authentication
   - HTTPS in production
   - Input validation

4. **Isolated Data**
   - Each tenant's data is separate
   - Users can only access authorized tenants

---

## Development

### Running Locally

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Create migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

## Configuration Synchronization

All application constants are centralized for easy updates.

### Centralized Configuration Files

**Frontend**: `frontend/src/config/constants.js`
- Application name, version, description
- GitHub repository URLs
- Support email and website URLs
- Social media links
- API configuration

**Backend**: `backend/app/core/app_config.py`
- Application name, version, description
- GitHub repository URLs
- Support email and website URLs
- Social media links

### How to Update Values

#### To Update Application Version:
1. Update `APP_VERSION` in `frontend/src/config/constants.js`
2. Update `APP_VERSION` in `backend/app/core/app_config.py`
3. Update `version` in `frontend/package.json`
4. Update `version` in `backend/pyproject.toml`

#### To Update GitHub Repository:
1. Update `github` object in `frontend/src/config/constants.js`
2. Update `GITHUB_OWNER` and `GITHUB_REPO` in `backend/app/core/app_config.py`
3. Update `README.md` clone command and links

#### To Update Support/Website URLs:
1. Update `support` object in `frontend/src/config/constants.js`
2. Update `SUPPORT_EMAIL` and `WEBSITE_URL` in `backend/app/core/app_config.py`

### Best Practices

1. **Always use constants** - Never hardcode values that are in the config files
2. **Update both files** - When changing a value, update both frontend and backend configs
3. **Test after updates** - Verify the app still works after config changes

---

## Differentiation Strategy

### Top 3 Recommendations

1. **AI-Powered Remediation Assistant**
   - Context-aware fix suggestions
   - Learn from past fixes
   - Auto-verify fixes worked

2. **Developer-First Experience**
   - GitHub/GitLab integration (findings in PRs)
   - CI/CD hooks
   - One-click fixes with copy-paste commands

3. **Real-Time Continuous Monitoring**
   - Event-driven scanning (not just scheduled)
   - WebSocket live updates
   - "This bucket just became public 2 minutes ago" alerts

### Quick Wins

- **Better remediation**: Add AWS CLI commands and Terraform examples to findings
- **GitHub integration**: Comment on PRs with security findings
- **Slack/Teams**: Send alerts to channels with interactive buttons
- **Security score gamification**: Show improvement over time

### Positioning

**Primary message**: "The open-source CSPM that developers actually want to use"

**Target audience:**
1. Security-conscious startups (50-500 employees)
2. MSSPs managing multiple customers
3. Enterprise teams frustrated with expensive tools

---

## Future Features

### Top Priority (High Impact, Quick Wins)

1. **Scheduled Scans** ⏰
   - Schedule scans (daily, weekly, monthly)
   - Per-tenant scheduling
   - Scan history and trends
   - Auto-trigger on tenant creation

2. **Real-Time Dashboard Updates** 🔄
   - WebSocket integration (already have infrastructure)
   - Live scan progress updates
   - Real-time finding counts
   - Toast notifications for new critical findings

### High Value Features

3. **Security Trends & Analytics** 📊
   - Security score trends (line chart)
   - Finding trends by category/severity
   - Remediation velocity metrics
   - "Days to fix" tracking
   - Comparison charts (this month vs last month)

4. **Cost-Aware Security** 💰
   - Cost impact analysis for findings
   - "This fix saves $X/month" badges
   - Waste detection (public buckets with no access = wasted storage)
   - ROI dashboard
   - Cost vs Security trade-off guidance

5. **Compliance Roadmap** 🗺️
   - "You're 80% compliant, here's how to reach 100%"
   - Gap analysis per framework
   - Step-by-step compliance checklist
   - Auto-generated evidence collection
   - Compliance score per framework

### Nice-to-Have Features

6. **Multi-Region Scanning** 🌍
7. **Finding Comments & Collaboration** 💬
8. **Export Improvements** 📥
9. **Custom Security Rules** 🛠️
10. **Mobile-Responsive Dashboard** 📱

---

## Project Status

### ✅ Completed Features

**Backend:**
- Multi-tenant database models
- JWT authentication with role-based access control
- AWS role assumption via STS
- IAM, S3, CloudTrail/GuardDuty, EC2, RDS, Lambda, CloudWatch, EBS scanners
- Background task processing for scans
- Findings storage and retrieval
- Compliance reporting
- Statistics and analytics endpoints
- Export functionality (CSV/JSON)
- Email & Slack notifications
- GitHub integration
- AI-powered remediation assistant

**Frontend:**
- Professional, modern UI design
- Login and registration pages
- Dashboard with statistics overview
- Tenant management
- Tenant detail page with findings
- Reports page with compliance mapping
- Real-time scan status updates
- Toast notification system
- Dark mode support
- Keyboard shortcuts
- Help center
- Analytics dashboard
- Onboarding flow
- Notification settings

**Infrastructure:**
- Docker Compose setup
- Database migrations (Alembic)
- Environment configuration
- Setup scripts

### 🚧 Coming Soon

- Scheduled scans
- Multi-region AWS scanning
- Azure and GCP support
- PDF report generation
- Scan history comparison
- Custom compliance frameworks
- API rate limiting with Redis
- Distributed scanning with Celery

---

## UI/UX Improvements

### Design System

**Color Palette:**
- Primary: Blue/Indigo gradient for primary actions
- Success: Green for positive states
- Warning: Yellow for medium severity
- Danger: Red for critical/high severity
- Info: Indigo for informational badges
- Neutral: Gray scale for backgrounds and text

**Typography:**
- System font stack for optimal rendering
- Clear hierarchy with appropriate font weights
- Consistent sizing

**Components:**
- Reusable StatCard component
- Badge system for status/severity
- Loading spinners
- Toast notifications
- Error boundaries
- Professional forms

### User Experience Enhancements

- ✅ Dark mode support
- ✅ Keyboard shortcuts
- ✅ Help center with searchable documentation
- ✅ Real-time updates
- ✅ Toast notification system
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Onboarding flow
- ✅ Analytics dashboard

### Accessibility

- ✅ Proper semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Color contrast compliance
- ✅ Screen reader friendly

---

## AWS Credentials Setup

S3ntraCS requires AWS credentials to assume roles in tenant AWS accounts. Without credentials, scans will fail.

### ⚠️ Security Best Practices

**Avoid long-term access keys when possible.** Use these alternatives:

#### For AWS Deployments (EC2, ECS, Lambda) - ✅ Recommended
**Use IAM Roles** - No credentials needed, most secure:
- Attach IAM role to your EC2 instance / ECS task / Lambda function
- S3ntraCS automatically uses the role
- No access keys required

#### For Docker / Local Development
**Use Temporary Credentials** - More secure than long-term keys:
```bash
aws sts get-session-token --duration-seconds 3600
```

#### For Production (If Access Keys Required)
- Create dedicated IAM user (not personal account)
- Grant only `sts:AssumeRole` permission
- Enable MFA
- Rotate every 90 days
- Use AWS Secrets Manager

### Quick Setup (Docker/Local)

**Option 1: Temporary Credentials (Recommended)**
```bash
# Get temporary credentials
aws sts get-session-token --duration-seconds 3600

# Add to .env file
AWS_ACCESS_KEY_ID=<temporary-key>
AWS_SECRET_ACCESS_KEY=<temporary-secret>
AWS_SESSION_TOKEN=<session-token>
```

**Option 2: IAM User Credentials**
Add to `docker-compose.yml`:
```yaml
environment:
  - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
  - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
```

Create `.env` file:
```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

Restart backend:
```bash
docker compose restart backend
```

### Required Permissions

Your AWS credentials need:
- `sts:AssumeRole` - To assume roles in tenant accounts
- `sts:GetCallerIdentity` - To verify credentials

See [AWS_CREDENTIALS_SETUP.md](AWS_CREDENTIALS_SETUP.md) for detailed instructions and best practices.

## Troubleshooting

### Scan Fails with "Unable to locate credentials"

**Solution**: Configure AWS credentials (see AWS Credentials Setup above)

1. Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to `docker-compose.yml`
2. Create `.env` file with your credentials
3. Restart backend: `docker compose restart backend`

### Docker Issues

**"Cannot connect to Docker daemon"**
- Start Docker Desktop application

**Port already in use**
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Kill the process or change ports in docker-compose.yml
```

**Services won't start**
```bash
# Rebuild everything
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Issues

**Database migration errors**
```bash
# Reset database (⚠️ destroys data)
docker compose down -v
docker compose up -d db
sleep 10
docker compose exec backend alembic upgrade head
```

**Database connection errors**
```bash
# Restart database
docker compose restart db

# Check database logs
docker compose logs db
```

### Backend Issues

**Backend shows errors**
```bash
# Check logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Frontend Issues

**Frontend won't start**
```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### AWS Issues

**Can't Assume Role Error**
- Verify the IAM role trust policy
- Check the External ID matches
- Ensure the role ARN is correct
- Verify the role has necessary permissions

**Scan Fails**
- Check AWS role permissions
- Verify role ARN and External ID
- Check backend logs for specific errors
- Ensure AWS account is accessible

### Notification Issues

**Email Not Sending**
- Check SMTP configuration: `docker compose logs backend | grep -i smtp`
- Verify credentials are correct
- Check firewall for port 587/465
- For Gmail: Use App Password, not regular password

**Slack Not Sending**
- Verify webhook URL is correct and not expired
- Check channel permissions
- Test manually with curl
- Check backend logs: `docker compose logs backend | grep -i slack`

---

## Support

- **Documentation**: This file
- **Issues**: [GitHub Issues](https://github.com/whoismuhd/S3NTRACS/issues)
- **Email**: support@s3ntracs.com

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [React](https://reactjs.org/) and [TailwindCSS](https://tailwindcss.com/)
- AWS integration via [Boto3](https://boto3.amazonaws.com/)

---

**Made with ❤️ for the security community**

[Website](https://s3ntracs.com) • [Documentation](DOCUMENTATION.md) • [GitHub](https://github.com/whoismuhd/S3NTRACS)

---

## 📝 Document Update Log

**Last Updated**: 2024-01-16

**Note**: All documentation is now centralized in this file. When adding new features or documentation, please update this file instead of creating new documentation files.

**Future Updates**: Always add new documentation sections to this file to maintain a single source of truth.

