import boto3
import logging
from typing import Dict
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings

logger = logging.getLogger(__name__)


def assume_tenant_role(role_arn: str, external_id: str) -> boto3.Session:
    """
    Assume an IAM role for a tenant using STS.
    
    Args:
        role_arn: The ARN of the role to assume
        external_id: External ID for additional security
        
    Returns:
        boto3.Session configured with the assumed role credentials
        
    Raises:
        NoCredentialsError: If AWS credentials are not configured
        ClientError: If role assumption fails
    """
    try:
        # Create STS client - boto3 will look for credentials in this order:
        # 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        # 2. AWS credentials file (~/.aws/credentials)
        # 3. IAM role (if running on EC2)
        sts = boto3.client("sts", region_name=settings.AWS_REGION)
        
        # Verify we have credentials by getting caller identity
        try:
            sts.get_caller_identity()
        except NoCredentialsError:
            error_msg = (
                "AWS credentials not found. S3ntraCS needs AWS credentials to assume roles in tenant accounts. "
                "Please configure AWS credentials using one of these methods:\n"
                "1. Environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n"
                "2. AWS credentials file: ~/.aws/credentials\n"
                "3. IAM instance profile (if running on EC2)\n"
                "4. Add credentials to docker-compose.yml environment section"
            )
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info(f"Assuming role {role_arn} with external ID")
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="S3ntraCSScan",
            ExternalId=external_id
        )
        
        creds = response["Credentials"]
        
        session = boto3.Session(
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
        )
        
        logger.info(f"Successfully assumed role {role_arn}")
        return session
        
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_msg = e.response.get("Error", {}).get("Message", str(e))
        
        if error_code == "AccessDenied":
            raise Exception(
                f"Access denied when assuming role {role_arn}. "
                f"Check that:\n"
                f"1. The role trust policy allows your AWS account to assume it\n"
                f"2. The External ID matches: {external_id}\n"
                f"3. Your AWS credentials have sts:AssumeRole permission"
            )
        elif error_code == "InvalidClientTokenId":
            raise Exception(
                f"Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
            )
        else:
            raise Exception(
                f"Failed to assume role {role_arn}: {error_code} - {error_msg}"
            )
    except NoCredentialsError:
        error_msg = (
            "AWS credentials not found. S3ntraCS needs AWS credentials to assume roles in tenant accounts. "
            "Please configure AWS credentials using one of these methods:\n"
            "1. Environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n"
            "2. AWS credentials file: ~/.aws/credentials\n"
            "3. IAM instance profile (if running on EC2)\n"
            "4. Add credentials to docker-compose.yml environment section"
        )
        logger.error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        # Handle any other exceptions - convert to string safely
        error_type = type(e).__name__
        error_str = str(e) if e else "Unknown error"
        
        # Check if this is a BotoCoreError that we need to handle specially
        if "BotoCoreError" in error_type or "NoCredentialsError" in error_type or "credentials" in error_str.lower():
            error_msg = (
                "AWS credentials not found. S3ntraCS needs AWS credentials to assume roles in tenant accounts. "
                "Please configure AWS credentials using one of these methods:\n"
                "1. Environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n"
                "2. AWS credentials file: ~/.aws/credentials\n"
                "3. IAM instance profile (if running on EC2)\n"
                "4. Add credentials to docker-compose.yml environment section"
            )
            logger.error(error_msg)
            raise Exception(error_msg)
        else:
            # For other errors, use the error message but wrap it safely
            logger.error(f"Unexpected error assuming role: {error_str}", exc_info=True)
            raise Exception(f"Failed to assume role: {error_str}")

