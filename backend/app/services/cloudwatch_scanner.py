import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_cloudwatch(session: boto3.Session) -> List[Dict]:
    """
    Scan CloudWatch Log Groups for security issues (retention, encryption, etc.).
    
    Returns a list of finding dictionaries.
    """
    findings = []
    logs = session.client("logs", region_name=settings.AWS_REGION)
    
    try:
        # List all log groups
        paginator = logs.get_paginator("describe_log_groups")
        
        for page in paginator.paginate():
            for log_group in page.get("logGroups", []):
                log_group_name = log_group["logGroupName"]
                log_group_arn = log_group.get("arn", log_group_name)
                
                # Check retention period
                retention_in_days = log_group.get("retentionInDays")
                if retention_in_days is None:
                    findings.append({
                        "category": "CLOUDWATCH",
                        "title": f"CloudWatch Log Group has no retention policy: {log_group_name}",
                        "description": f"CloudWatch Log Group '{log_group_name}' does not have a retention policy configured, which means logs will be retained indefinitely and may incur unnecessary costs.",
                        "severity": "MEDIUM",
                        "resource_id": log_group_arn,
                        "remediation": f"Set an appropriate retention period for Log Group '{log_group_name}' (recommended: 30-90 days for general logs, longer for compliance requirements).",
                        "mapped_control": "ISO 27001 A.12.4.1",
                    })
                elif retention_in_days > 365:
                    findings.append({
                        "category": "CLOUDWATCH",
                        "title": f"CloudWatch Log Group has extended retention: {log_group_name}",
                        "description": f"CloudWatch Log Group '{log_group_name}' has a retention policy of {retention_in_days} days, which may incur high storage costs.",
                        "severity": "LOW",
                        "resource_id": log_group_arn,
                        "remediation": f"Review retention period for Log Group '{log_group_name}'. Consider archiving older logs to S3 with Glacier for cost optimization.",
                        "mapped_control": None,
                    })
                
                # Check encryption at rest
                kms_key_id = log_group.get("kmsKeyId")
                if not kms_key_id:
                    # Check if encryption is enabled via describe_log_groups (some AWS accounts may have default encryption)
                    try:
                        log_group_details = logs.describe_log_groups(logGroupNamePrefix=log_group_name, limit=1)
                        for detailed_group in log_group_details.get("logGroups", []):
                            if detailed_group["logGroupName"] == log_group_name:
                                if not detailed_group.get("kmsKeyId"):
                                    findings.append({
                                        "category": "CLOUDWATCH",
                                        "title": f"CloudWatch Log Group not encrypted: {log_group_name}",
                                        "description": f"CloudWatch Log Group '{log_group_name}' does not have encryption at rest enabled.",
                                        "severity": "MEDIUM",
                                        "resource_id": log_group_arn,
                                        "remediation": f"Enable encryption at rest for Log Group '{log_group_name}' using AWS KMS.",
                                        "mapped_control": "ISO 27001 A.10.1.1",
                                    })
                                break
                    except ClientError:
                        # If we can't get details, assume no encryption if kmsKeyId is not in the original response
                        findings.append({
                            "category": "CLOUDWATCH",
                            "title": f"CloudWatch Log Group encryption status unknown: {log_group_name}",
                            "description": f"Unable to verify encryption status for Log Group '{log_group_name}'. Ensure encryption at rest is enabled.",
                            "severity": "LOW",
                            "resource_id": log_group_arn,
                            "remediation": f"Verify and enable encryption at rest for Log Group '{log_group_name}' using AWS KMS if not already enabled.",
                            "mapped_control": "ISO 27001 A.10.1.1",
                        })
                
                # Check log group name patterns (security best practices)
                # Log groups containing sensitive keywords
                sensitive_patterns = ["password", "secret", "key", "token", "credential", "auth"]
                log_group_lower = log_group_name.lower()
                if any(pattern in log_group_lower for pattern in sensitive_patterns):
                    findings.append({
                        "category": "CLOUDWATCH",
                        "title": f"CloudWatch Log Group may contain sensitive data: {log_group_name}",
                        "description": f"CloudWatch Log Group '{log_group_name}' has a name suggesting it may contain sensitive information. Ensure proper access controls and encryption are in place.",
                        "severity": "LOW",
                        "resource_id": log_group_arn,
                        "remediation": f"Review access controls and encryption for Log Group '{log_group_name}' to ensure sensitive data is protected.",
                        "mapped_control": "ISO 27001 A.9.4.3",
                    })
        
        # Check if CloudWatch Logs service has encryption enabled by default (account-level)
        # Note: This is a best practice check, not directly verifiable via API
        # We'll skip this as it requires account-level configuration
    
    except ClientError as e:
        print(f"Error scanning CloudWatch Log Groups: {e}")
        findings.append({
            "category": "CLOUDWATCH",
            "title": "CloudWatch Log Groups scan failed",
            "description": f"Unable to scan CloudWatch Log Groups: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "CLOUDWATCH",
            "remediation": "Check CloudWatch Logs permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings





