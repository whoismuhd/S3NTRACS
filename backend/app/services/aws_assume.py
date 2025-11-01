import boto3
from typing import Dict
from app.core.config import settings


def assume_tenant_role(role_arn: str, external_id: str) -> boto3.Session:
    """
    Assume an IAM role for a tenant using STS.
    
    Args:
        role_arn: The ARN of the role to assume
        external_id: External ID for additional security
        
    Returns:
        boto3.Session configured with the assumed role credentials
    """
    sts = boto3.client("sts", region_name=settings.AWS_REGION)
    
    response = sts.assume_role(
        RoleArn=role_arn,
        RoleSessionName="S3ntraCSScan",
        ExternalId=external_id,
    )
    
    creds = response["Credentials"]
    
    session = boto3.Session(
        aws_access_key_id=creds["AccessKeyId"],
        aws_secret_access_key=creds["SecretAccessKey"],
        aws_session_token=creds["SessionToken"],
    )
    
    return session

