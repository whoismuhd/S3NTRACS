# S3ntraCS Features

## Core Features

### 1. Multi-Tenant Support
- Manage multiple AWS accounts (tenants) from a single dashboard
- Role-based access control per tenant
- Isolated scan results and findings per tenant

### 2. Security Scanning

#### IAM Scanner
- ✅ Users without MFA enabled
- ✅ Users with AdministratorAccess policy
- ✅ Overly permissive inline policies
- Maps to: ISO 27001 A.9.4.3, A.9.2.2

#### S3 Scanner
- ✅ Publicly accessible buckets (via ACL)
- ✅ Public buckets via bucket policy
- ✅ Buckets without default encryption
- Maps to: ISO 27001 A.9.1.2, A.10.1.1

#### Logging Scanner
- ✅ CloudTrail not enabled
- ✅ CloudTrail missing global service events
- ✅ GuardDuty not enabled
- Maps to: ISO 27001 A.12.4.1, A.12.4.2

### 3. Findings Management
- Categorized by type (IAM, S3, LOGGING)
- Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- Resource identification
- Remediation recommendations
- Compliance framework mapping

### 4. Compliance Reporting
- Automatic mapping to compliance frameworks:
  - ISO 27001
  - GDPR
  - SOC 2
  - NIST CSF
- JSON export available
- Summary statistics

### 5. Dashboard & Analytics
- Overview statistics:
  - Total tenants
  - High priority findings count
  - Total findings
  - Total scans
- Recent scan history
- Tenant-specific statistics

### 6. Export Functionality
- CSV export of findings
- JSON export of findings
- Filtered exports (by scan run)
- Timestamped filenames

## API Features

### Authentication
- JWT-based authentication
- Password strength validation
- Auto-superadmin for first user
- Role-based access control

### Background Processing
- Asynchronous scan execution
- Non-blocking API responses
- Status tracking (pending, running, completed, failed)

### Pagination
- Findings endpoint supports pagination
- Configurable page size (1-100)
- Efficient database queries

### Validation
- Input validation for all endpoints
- AWS resource format validation
- Email format validation
- Password strength requirements

## Web UI Features

### Dashboard
- Statistics overview cards
- Tenant list with latest scan info
- Quick tenant creation (superadmin)
- Visual severity indicators

### Tenant Detail Page
- Tenant information display
- Run scan button
- Findings table with filters
- Export options
- Report access

### Reports Page
- Compliance framework mapping
- Findings summary
- Downloadable JSON reports

### User Experience
- Error boundaries
- Loading states
- Form validation
- Responsive design with TailwindCSS

## Security Features

1. **Secure AWS Access**
   - STS AssumeRole with External ID
   - No long-lived credentials stored
   - Temporary session tokens only

2. **Application Security**
   - Password hashing (bcrypt)
   - JWT token authentication
   - CORS protection
   - Input sanitization
   - SQL injection protection (SQLAlchemy ORM)

3. **Access Control**
   - Role-based permissions
   - Tenant-level isolation
   - Superadmin oversight

## Deployment Features

- Docker Compose for local development
- Production-ready structure
- Environment-based configuration
- Health check endpoints
- Database migrations (Alembic)

## Developer Experience

- Swagger/OpenAPI documentation
- Comprehensive logging
- Error handling and reporting
- Modular code structure
- Type hints throughout

## Future Enhancements (Planned)

- [ ] Email/Slack notifications
- [ ] Scheduled scans
- [ ] Multi-region scanning
- [ ] Azure and GCP support
- [ ] PDF report generation
- [ ] Scan history comparison
- [ ] Custom compliance frameworks
- [ ] API rate limiting (Redis)
- [ ] Distributed scanning (Celery)
- [ ] Real-time scan progress updates

