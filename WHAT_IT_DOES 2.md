# What S3ntraCS Does - Detailed Explanation

## Overview

**S3ntraCS** (S3 + Sentinel + Cloud Security) is a **Cloud Security Posture Management (CSPM)** platform designed to help organizations monitor and improve the security posture of their AWS cloud infrastructure. It acts as a centralized security scanning and compliance monitoring tool.

---

## Core Purpose

S3ntraCS connects to multiple AWS accounts (called "tenants"), performs automated security scans, identifies security misconfigurations and compliance issues, stores the findings, and provides dashboards and reports to help security teams track and remediate issues.

---

## How It Works - Step by Step

### 1. **Multi-Tenant Setup**

**What it does:**
- Allows administrators to onboard multiple AWS accounts (tenants) into the system
- Each tenant represents a customer or department with their own AWS account
- Stores AWS connection details securely (role ARN, external ID) - **never stores AWS credentials**

**Example:**
- A security company wants to monitor 10 different customer AWS accounts
- Admin creates 10 tenants in S3ntraCS, each with the customer's AWS account connection details
- Each tenant is isolated - tenants can't see each other's data

---

### 2. **AWS Connection (Secure)**

**What it does:**
- Uses AWS STS (Security Token Service) to assume a role in the target AWS account
- Uses "External ID" for additional security
- Gets temporary credentials (last 1 hour) - no long-lived keys stored
- The assumed role has read-only permissions to scan security configurations

**Why this matters:**
- Secure: No AWS access keys stored in the database
- Temporary: Credentials expire automatically
- Flexible: Each tenant uses their own IAM role

---

### 3. **Security Scanning**

**What it does:**
When you trigger a scan, S3ntraCS runs three types of security checks:

#### A. **IAM Scanner**
Checks for:
- **Users without MFA (Multi-Factor Authentication)**
  - Why: Users without MFA are vulnerable if passwords are compromised
  - Finding: "IAM user without MFA: john.doe"
  - Severity: HIGH
  - Compliance: ISO 27001 A.9.4.3

- **Users with AdministratorAccess**
  - Why: Too many admin users increases risk
  - Finding: "IAM user with AdministratorAccess: admin"
  - Severity: HIGH
  - Compliance: ISO 27001 A.9.2.2

- **Overly permissive inline policies**
  - Why: Policies that allow "*" (everything) are dangerous
  - Finding: "IAM user with overly permissive inline policy"
  - Severity: MEDIUM

#### B. **S3 Scanner**
Checks for:
- **Public buckets (accessible to everyone)**
  - Why: Public S3 buckets can expose sensitive data
  - Checks: ACL grants, bucket policies
  - Finding: "Public S3 bucket: my-data-bucket"
  - Severity: HIGH
  - Compliance: ISO 27001 A.9.1.2

- **Buckets without encryption**
  - Why: Data should be encrypted at rest
  - Finding: "S3 bucket without encryption: my-bucket"
  - Severity: MEDIUM
  - Compliance: ISO 27001 A.10.1.1

#### C. **Logging Scanner**
Checks for:
- **CloudTrail not enabled**
  - Why: CloudTrail logs all API calls for audit and security
  - Finding: "CloudTrail not enabled"
  - Severity: HIGH
  - Compliance: ISO 27001 A.12.4.1

- **GuardDuty not enabled**
  - Why: GuardDuty provides threat detection
  - Finding: "GuardDuty not enabled"
  - Severity: MEDIUM
  - Compliance: ISO 27001 A.12.4.2

**Scan Process:**
1. Admin clicks "Run Scan" for a tenant
2. Backend assumes the AWS role
3. Runs all three scanners sequentially
4. Collects all findings
5. Stores them in the database
6. Updates scan status (pending → running → completed)

---

### 4. **Finding Management**

**What it does:**
- Stores each security issue as a "Finding"
- Each finding includes:
  - **Title**: Brief description ("IAM user without MFA")
  - **Description**: Detailed explanation
  - **Severity**: CRITICAL, HIGH, MEDIUM, LOW
  - **Category**: IAM, S3, LOGGING
  - **Resource ID**: Which specific resource (bucket name, IAM username)
  - **Remediation**: How to fix it ("Enable MFA for this user")
  - **Mapped Control**: Compliance framework reference ("ISO 27001 A.9.4.3")

**Example Finding:**
```json
{
  "title": "Public S3 bucket: sensitive-data",
  "description": "S3 bucket 'sensitive-data' has public access via ACL",
  "severity": "HIGH",
  "category": "S3",
  "resource_id": "sensitive-data",
  "remediation": "Remove public ACL grants from bucket 'sensitive-data'",
  "mapped_control": "ISO 27001 A.9.1.2"
}
```

---

### 5. **Dashboard & Analytics**

**What it does:**
The dashboard provides:

- **Overview Statistics:**
  - Total number of tenants being monitored
  - Total findings across all tenants
  - High priority findings (Critical + High severity)
  - Total scans run

- **Tenant Cards:**
  - Each tenant shown as a card
  - Last scan date
  - Security score (calculated from findings)
  - Finding counts by severity
  - Quick access to details

- **Real-time Updates:**
  - Dashboard refreshes every 30 seconds
  - Shows latest scan status
  - Updates findings counts automatically

---

### 6. **Tenant Detail View**

**What it does:**
When you click on a tenant, you see:

- **Statistics Cards:**
  - Total findings count
  - Critical findings count
  - High findings count
  - Last scan date and status

- **Findings Table:**
  - List of all security findings
  - Filter by severity (Critical, High, Medium, Low)
  - Filter by category (IAM, S3, Logging)
  - Search by keyword
  - Each finding shows:
    - Severity badge (color-coded)
    - Category badge
    - Title and description
    - Resource identifier
    - Remediation instructions
    - Compliance mapping

- **Actions:**
  - Run new scan
  - View compliance report
  - Export findings to CSV

---

### 7. **Compliance Reporting**

**What it does:**
Generates compliance snapshot reports that:

- **Map findings to compliance frameworks:**
  - ISO 27001
  - GDPR
  - SOC 2
  - NIST CSF

- **Provide summaries:**
  - Total findings by severity
  - Findings by category
  - Framework-specific mapping
  - All findings with details

- **Export options:**
  - Download as JSON
  - Ready for audit documentation

**Example:**
A report might show:
- "ISO 27001 A.9.4.3: IAM user without MFA (HIGH severity)"
- "GDPR Art.32: S3 bucket without encryption (MEDIUM severity)"

---

## Real-World Use Cases

### Use Case 1: Managed Security Service Provider (MSSP)

**Scenario:**
A security company manages security for 50 different customers, each with their own AWS account.

**How S3ntraCS helps:**
1. Admin creates 50 tenants (one per customer)
2. Weekly automated scans check all 50 accounts
3. Dashboard shows which customers have security issues
4. Reports generated for each customer
5. Security team can prioritize fixing critical issues

---

### Use Case 2: Enterprise Multi-Account Security

**Scenario:**
A large company has multiple AWS accounts (development, staging, production, different teams).

**How S3ntraCS helps:**
1. Each AWS account registered as a tenant
2. Centralized security monitoring
3. Compare security posture across accounts
4. Ensure all accounts meet compliance requirements
5. Track remediation progress

---

### Use Case 3: Compliance Audits

**Scenario:**
A company needs to demonstrate ISO 27001 compliance for an audit.

**How S3ntraCS helps:**
1. Run scans regularly (weekly/monthly)
2. Generate compliance reports
3. Show audit trail of findings
4. Demonstrate remediation actions
5. Export reports as evidence

---

### Use Case 4: Security Monitoring

**Scenario:**
Security team wants to continuously monitor AWS security posture.

**How S3ntraCS helps:**
1. Set up tenants for critical AWS accounts
2. Schedule regular scans
3. Dashboard shows security score
4. Get alerts on high-severity findings
5. Track trends over time

---

## Key Features Breakdown

### 1. **Multi-Tenancy**
- **What**: Support multiple isolated AWS accounts
- **Why**: Security companies or enterprises need to monitor many accounts
- **How**: Each tenant has separate data, roles control access

### 2. **Automated Scanning**
- **What**: Automated security checks without manual intervention
- **Why**: Saves time, catches issues early, consistent checks
- **How**: Click "Run Scan" → scans run in background → results stored

### 3. **Finding Prioritization**
- **What**: Findings ranked by severity (Critical → High → Medium → Low)
- **Why**: Helps teams focus on most critical issues first
- **How**: Color-coded badges, sorting, filtering

### 4. **Compliance Mapping**
- **What**: Links security findings to compliance requirements
- **Why**: Helps with audits, demonstrates compliance
- **How**: Each finding tagged with framework references (e.g., "ISO 27001 A.9.4.3")

### 5. **Remediation Guidance**
- **What**: Each finding includes instructions on how to fix it
- **Why**: Speeds up fixing issues
- **How**: Remediation text explains step-by-step fix

### 6. **Historical Tracking**
- **What**: All scan results stored over time
- **Why**: Track improvement, show audit trail
- **How**: Database stores all scans with timestamps

### 7. **Export & Reporting**
- **What**: Export findings and reports to CSV/JSON
- **Why**: Share with stakeholders, include in audits, analysis
- **How**: One-click export with authentication

---

## Security Architecture

### How Security is Maintained

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

## User Workflows

### Workflow 1: Admin Onboarding a New Tenant

1. Admin logs in
2. Clicks "New Tenant"
3. Enters tenant details:
   - Name: "Acme Corp"
   - AWS Account ID: "123456789012"
   - AWS Role ARN: "arn:aws:iam::123456789012:role/S3ntraCSRole"
   - External ID: "unique-id-12345"
4. Tenant created
5. Admin can now scan this tenant's AWS account

---

### Workflow 2: Running a Security Scan

1. Admin navigates to tenant detail page
2. Clicks "Run Scan" button
3. System:
   - Creates scan record (status: pending)
   - Assumes AWS role using STS
   - Runs IAM scanner → finds 5 issues
   - Runs S3 scanner → finds 2 issues
   - Runs Logging scanner → finds 1 issue
   - Stores all 8 findings
   - Updates scan status (completed)
4. User sees results immediately
5. Findings appear in table with severity badges

---

### Workflow 3: Analyzing Findings

1. User views tenant detail page
2. Sees statistics: 8 total findings (2 High, 4 Medium, 2 Low)
3. Filters to show only "HIGH" severity
4. Reviews each finding:
   - Reads description
   - Checks which resource (IAM user name, bucket name)
   - Reads remediation instructions
5. Takes action: Fixes issues in AWS console
6. Runs new scan to verify fixes

---

### Workflow 4: Generating Compliance Report

1. User clicks "View Report"
2. System generates report:
   - Collects all findings from latest scan
   - Groups by compliance framework
   - Calculates statistics
3. User sees:
   - Summary by severity
   - Findings by category
   - Compliance framework mapping
4. User clicks "Download JSON"
5. Report saved for audit documentation

---

## Technical Details

### What Gets Scanned

**IAM:**
- Lists all IAM users
- Checks MFA status for each user
- Examines attached policies
- Reviews inline policies

**S3:**
- Lists all S3 buckets
- Checks bucket ACLs (Access Control Lists)
- Reviews bucket policies
- Checks encryption configuration

**Logging:**
- Checks CloudTrail status
- Verifies GuardDuty configuration

### What Gets Stored

**Database Tables:**
- **Users**: Who can access the system
- **Tenants**: AWS accounts being monitored
- **Scan Runs**: When scans were run, status, summary
- **Findings**: Each security issue discovered
- **Alerts**: (Future) Notifications sent

### API Endpoints

**Authentication:**
- `POST /auth/login` - Get JWT token
- `POST /auth/register` - Create account
- `GET /auth/me` - Current user info

**Tenants:**
- `GET /tenants/` - List all tenants (filtered by role)
- `POST /tenants/` - Create tenant
- `GET /tenants/{id}` - Get tenant details
- `PUT /tenants/{id}` - Update tenant

**Scans:**
- `POST /scans/run/{tenant_id}` - Start scan
- `GET /scans/{tenant_id}` - List scan history
- `GET /scans/{tenant_id}/latest` - Latest scan

**Findings:**
- `GET /findings/{tenant_id}` - List findings (with filters)
- `GET /findings/{tenant_id}/{finding_id}` - Single finding

**Reports:**
- `GET /reports/{tenant_id}/latest` - Compliance report

**Statistics:**
- `GET /statistics/dashboard` - Dashboard stats
- `GET /statistics/tenant/{tenant_id}` - Tenant stats

**Exports:**
- `GET /exports/findings/{tenant_id}/csv` - CSV export
- `GET /exports/findings/{tenant_id}/json` - JSON export

---

## Benefits

### For Security Teams
- **Visibility**: See all security issues in one place
- **Prioritization**: Focus on critical issues first
- **Tracking**: Monitor improvement over time
- **Documentation**: Reports for audits

### For Organizations
- **Compliance**: Demonstrate adherence to frameworks
- **Risk Management**: Identify and fix security gaps
- **Automation**: Reduce manual security checks
- **Multi-Account**: Centralized monitoring

### For MSPs (Managed Service Providers)
- **Scalability**: Monitor many customer accounts
- **Efficiency**: Automated scanning saves time
- **Reporting**: Generate reports for customers
- **Isolation**: Each customer's data is separate

---

## Example Scenario: Complete Flow

**Day 1: Setup**
1. Company "SecureCorp" installs S3ntraCS
2. Admin creates first user (auto-superadmin)
3. Admin creates tenant for their AWS account
4. Configures AWS role ARN and external ID

**Day 2: First Scan**
1. Admin clicks "Run Scan"
2. S3ntraCS connects to AWS account
3. Finds:
   - 3 IAM users without MFA (HIGH)
   - 1 public S3 bucket (HIGH)
   - CloudTrail not enabled (HIGH)
   - 2 buckets without encryption (MEDIUM)
4. Dashboard shows: 6 total findings (3 High, 2 Medium)

**Day 3: Remediation**
1. Security team reviews findings
2. Enables MFA for users
3. Makes S3 bucket private
4. Enables CloudTrail

**Day 4: Verification**
1. Admin runs new scan
2. New findings: 2 buckets without encryption (MEDIUM)
3. Security score improves from 40/100 to 80/100
4. Team fixes remaining encryption issues

**Week 2: Ongoing Monitoring**
1. Weekly scans scheduled
2. Dashboard shows improving security posture
3. Compliance report generated for audit
4. Export findings for documentation

---

## Summary

**S3ntraCS is essentially:**
- A **security scanner** that checks AWS configurations
- A **compliance tracker** that maps issues to frameworks
- A **dashboard** that visualizes security posture
- A **reporting tool** that generates compliance documentation
- A **multi-tenant platform** that can monitor many AWS accounts

**It helps organizations:**
- Find security misconfigurations before attackers do
- Meet compliance requirements (ISO 27001, GDPR, SOC 2)
- Monitor security posture over time
- Prioritize security fixes
- Document security efforts for audits

**Think of it as:**
A "security auditor" that continuously checks your AWS accounts, identifies problems, tells you how to fix them, and generates reports to prove you're maintaining good security practices.

