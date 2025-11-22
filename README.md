# S3ntraCS - Cloud Security Posture Management Platform

<div align="center">

![S3ntraCS Logo](frontend/src/assets/logo.svg)

**Automated AWS Security Scanning & Compliance Monitoring**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.100+-green.svg)](https://fastapi.tiangolo.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 🚀 What is S3ntraCS?

**S3ntraCS** (S3 + Sentinel + Cloud Security) is a **Cloud Security Posture Management (CSPM)** tool built for DevOps engineers and AWS security practitioners managing multiple AWS accounts.

### Why S3ntraCS?

- ✅ **Per-Account Scanner Configuration** - Enable IAM, S3, EC2, RDS, Lambda, CloudWatch, EBS, or Logging scanners per tenant via `enabled_scanners` field
- ✅ **STS AssumeRole Integration** - No long-lived credentials. Uses temporary tokens via STS AssumeRole with External ID
- ✅ **REST API Access** - JWT-authenticated API for programmatic CSPM integration in CI/CD pipelines
- ✅ **Multi-Account Management** - Centralize security posture across dev, staging, and production AWS accounts
- ✅ **Compliance Framework Mapping** - Automatic mapping to ISO 27001, GDPR, SOC 2, NIST CSF with JSON/CSV export
- ✅ **Granular Control** - Per-tenant scanner selection, scheduled scans, and custom notification preferences

---

## ✨ Features

### Core Capabilities

#### 🔍 Security Scanning
- **IAM Security Checks**
  - Users without MFA
  - Overly permissive policies
  - Administrator access monitoring
  
- **S3 Bucket Security**
  - Public bucket detection
  - Encryption verification
  - Access policy analysis
  
- **Logging & Monitoring**
  - CloudTrail configuration checks
  - GuardDuty status verification

#### 📊 Dashboard & Analytics
- Real-time security score calculation
- Comprehensive findings overview
- Tenant-specific statistics
- Historical scan tracking

#### 📋 Compliance Reporting
- Automatic framework mapping (ISO 27001, GDPR, SOC 2, NIST CSF)
- Exportable reports (JSON, CSV)
- Detailed remediation guidance

#### 🔐 Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Secure AWS role assumption (STS)
- Two-factor authentication (2FA)
- No long-lived credentials stored

---

## 🏁 Quick Start

### Prerequisites

- Docker Desktop installed and running
- AWS account with IAM permissions

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

### AWS Setup

#### Step 1: Configure S3ntraCS AWS Credentials

S3ntraCS needs AWS credentials to assume roles in tenant accounts.

**For AWS Deployments (EC2, ECS, Lambda):**
- ✅ Use IAM Roles - Attach role to your service (no access keys needed)

**For Docker/Local:**
- ✅ Use temporary credentials: `aws sts get-session-token`
- Or create IAM user with minimal permissions

See [AWS_CREDENTIALS_SETUP.md](AWS_CREDENTIALS_SETUP.md) for detailed setup.

#### Step 2: Create Tenant IAM Role

1. **Create an IAM Role** in your AWS account
2. **Configure Trust Policy** with External ID
3. **Attach Read-Only Policies**:
   - `IAMReadOnlyAccess`
   - `AmazonS3ReadOnlyAccess`
   - `CloudTrailReadOnlyAccess`
4. **Add Tenant** in S3ntraCS with Role ARN and External ID

See [DOCUMENTATION.md](DOCUMENTATION.md#aws-setup) for detailed AWS setup instructions.

---

## 📖 Documentation

All documentation is now centralized in **[DOCUMENTATION.md](DOCUMENTATION.md)**. This includes:
- Quick Start Guide
- AWS Setup Instructions
- GitHub Integration Guide
- Email & Slack Notifications Setup
- Architecture Overview
- Development Guide
- Troubleshooting
- And much more!

---

## 🏗️ Architecture

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

---

## 🔒 Security

S3ntraCS follows security best practices:

- **No Credential Storage** - Uses AWS STS AssumeRole with temporary credentials
- **Secure Authentication** - JWT tokens with bcrypt password hashing
- **Role-Based Access** - Granular permissions per tenant
- **Input Validation** - Comprehensive validation on all endpoints
- **HTTPS Ready** - Production-ready security headers
- **2FA Support** - Two-factor authentication for enhanced security

---

## 🎯 Use Cases

### Managed Security Service Providers (MSSP)
Monitor multiple customer AWS accounts from a centralized dashboard. Generate compliance reports for each customer.

### Small Business Multi-Account Security
Centralize security monitoring across development, staging, and production AWS accounts. Ensure consistent security posture.

### Compliance Audits
Generate compliance reports mapped to ISO 27001, GDPR, SOC 2, and NIST CSF frameworks. Track remediation progress over time.

### Continuous Security Monitoring
Set up regular scans to continuously monitor your AWS security posture. Get alerts on critical findings.

---

## 🛠️ Development

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

## 📈 Roadmap

### Current Features ✅
- Multi-tenant support
- 8 available scanners: IAM, S3, Logging, EC2, EBS, RDS, Lambda, and CloudWatch
- Compliance reporting
- Real-time dashboard
- Export functionality
- Two-factor authentication

### Coming Soon 🚧
- [ ] Email/Slack notifications
- [ ] Scheduled scans
- [ ] Multi-region AWS scanning
- [ ] Azure and GCP support
- [ ] PDF report generation
- [ ] Scan history comparison
- [ ] Custom compliance frameworks
- [ ] API rate limiting with Redis
- [ ] Distributed scanning with Celery

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Documentation**: Check our [docs](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/whoismuhd/S3NTRACS/issues)
- **Email**: support@s3ntracs.com (coming soon)

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [React](https://reactjs.org/) and [TailwindCSS](https://tailwindcss.com/)
- AWS integration via [Boto3](https://boto3.amazonaws.com/)

---

<div align="center">

**Made with ❤️ for the security community**

[Website](https://s3ntracs.com) • [Documentation](docs/) • [GitHub](https://github.com/whoismuhd/S3NTRACS)

</div>

