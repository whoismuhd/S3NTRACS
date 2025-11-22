# AWS Credentials Setup for S3ntraCS

## Why AWS Credentials Are Needed

S3ntraCS needs AWS credentials to call AWS STS (Security Token Service) to assume roles in your tenant AWS accounts. Without these credentials, scans will fail with "Unable to locate credentials" error.

## ⚠️ Security Best Practices

**Avoid using long-term access keys when possible.** Consider these alternatives based on your deployment:

### Use Case: Application Running on AWS (EC2, ECS, Lambda)

**✅ Recommended: IAM Roles / Instance Profiles**

Instead of access keys, use IAM roles attached to your compute service:

- **EC2**: Attach an IAM role to your EC2 instance
- **ECS**: Use task roles
- **Lambda**: Use execution roles
- **EKS/Fargate**: Use pod/service roles

**Benefits:**
- No credentials to manage
- Automatic rotation
- More secure
- No risk of credential leakage

**Setup:**
1. Create an IAM role with `sts:AssumeRole` permission
2. Attach the role to your EC2 instance / ECS task / Lambda function
3. S3ntraCS will automatically use the role credentials
4. No need to set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`

### Use Case: Application Running Outside AWS (Docker, Local Development)

**Option 1: Temporary Credentials (Recommended)**

Use AWS SSO or temporary credentials from AWS CLI:

```bash
# Get temporary credentials
aws sts get-session-token --duration-seconds 3600

# Use in docker-compose.yml
AWS_ACCESS_KEY_ID=<temporary-access-key>
AWS_SECRET_ACCESS_KEY=<temporary-secret-key>
AWS_SESSION_TOKEN=<session-token>
```

**Option 2: IAM User with Minimal Permissions**

If you must use long-term credentials:

1. Create a dedicated IAM user (not your personal account)
2. Grant only `sts:AssumeRole` permission
3. Enable MFA for the user
4. Rotate credentials regularly (every 90 days)
5. Use AWS Secrets Manager or environment variables (never commit to git)

### Use Case: Third-Party Service / External Monitoring

**✅ Recommended: Cross-Account IAM Roles**

Set up cross-account role assumption:

1. Create an IAM role in your S3ntraCS AWS account
2. Configure trust relationship to allow your tenant accounts to assume it
3. Use the role ARN instead of access keys

## Setup Methods

### Method 1: IAM Role (Best for AWS Deployments)

If running on EC2, ECS, or Lambda, use IAM roles:

1. Create IAM role with `sts:AssumeRole` permission
2. Attach to your compute service
3. No credentials needed - boto3 will automatically use the role

### Method 2: Environment Variables (For Docker/Local)

Add AWS credentials to your `docker-compose.yml`:

```yaml
backend:
  environment:
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    - AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN}  # Optional, for temporary credentials
```

Then create a `.env` file in the project root:

```bash
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

**Important**: 
- Add `.env` to `.gitignore` to avoid committing credentials!
- Use temporary credentials when possible
- Rotate credentials regularly

### Method 2: AWS Credentials File

If running locally (not in Docker), create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = your-access-key-id
aws_secret_access_key = your-secret-access-key
```

### Method 3: IAM Instance Profile (EC2)

If running on EC2, attach an IAM role with `sts:AssumeRole` permission.

## Required Permissions

The AWS credentials you provide need:

- `sts:AssumeRole` - To assume roles in tenant accounts
- `sts:GetCallerIdentity` - To verify credentials

## Security Best Practices

### If Using Access Keys (Not Recommended for Production)

1. **Use IAM User with Minimal Permissions**: Create a dedicated IAM user for S3ntraCS (not your personal account)
2. **Attach Policy**: Only grant `sts:AssumeRole` and `sts:GetCallerIdentity` permissions
3. **Enable MFA**: Require MFA for the IAM user
4. **Rotate Credentials**: Regularly rotate access keys (every 90 days recommended)
5. **Never Commit Credentials**: Use environment variables, secrets management, or AWS Secrets Manager
6. **Use External ID**: Always use External ID in role trust policies for additional security
7. **Monitor Usage**: Enable CloudTrail to monitor credential usage
8. **Set Expiration**: If possible, use temporary credentials with expiration

### Recommended Alternatives

1. **IAM Roles**: Use IAM roles when running on AWS (EC2, ECS, Lambda)
2. **AWS SSO**: Use AWS Single Sign-On for temporary credentials
3. **Cross-Account Roles**: Set up cross-account role assumption
4. **AWS Secrets Manager**: Store credentials in AWS Secrets Manager and retrieve at runtime
5. **Temporary Credentials**: Use `aws sts get-session-token` for short-lived credentials

## Example IAM Policies

### Policy for IAM User (If Using Access Keys)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### Policy for IAM Role (Recommended)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

**Note**: When using IAM roles, you don't need to create this policy - just attach the role to your compute service.

## Deployment-Specific Setup

### Running on AWS (EC2, ECS, Lambda)

1. **Create IAM Role**:
   - Go to IAM Console → Roles → Create Role
   - Select your service (EC2, ECS, Lambda)
   - Attach policy with `sts:AssumeRole` permission
   - Attach role to your service

2. **No Credentials Needed**: S3ntraCS will automatically use the role

### Running in Docker (Local or Non-AWS)

1. **Get Temporary Credentials** (Recommended):
   ```bash
   aws sts get-session-token --duration-seconds 3600
   ```

2. **Or Use IAM User Credentials**:
   - Create IAM user with minimal permissions
   - Generate access keys
   - Add to `.env` file

3. **Restart Backend**:
   ```bash
   docker compose restart backend
   ```

### Running on Kubernetes

1. **Use IAM Roles for Service Accounts (IRSA)**:
   - Create IAM role
   - Annotate service account with role ARN
   - Pods will automatically assume the role

2. **Or Use AWS Secrets Manager**:
   - Store credentials in Secrets Manager
   - Mount as environment variables or use AWS SDK to retrieve

## Troubleshooting

### Error: "Unable to locate credentials"

**For AWS Deployments:**
- Verify IAM role is attached to your service
- Check role has correct permissions
- Ensure role trust policy is correct

**For Docker/Local:**
- Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Verify credentials are valid: `aws sts get-caller-identity`
- Restart backend after adding credentials: `docker compose restart backend`

### Error: "Access denied when assuming role"

- Verify the role trust policy allows your AWS account
- Check that External ID matches
- Ensure your credentials have `sts:AssumeRole` permission
- Verify the role ARN is correct

### Error: "InvalidClientTokenId"

- Check that your access key ID is correct
- Verify your secret access key matches
- Ensure credentials haven't been rotated/deleted
- If using temporary credentials, check they haven't expired

