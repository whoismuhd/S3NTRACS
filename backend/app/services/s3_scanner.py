import boto3
import json
from typing import List, Dict
from botocore.exceptions import ClientError


def scan_s3(session: boto3.Session) -> List[Dict]:
    """
    Scan S3 buckets for security issues.
    
    Returns a list of finding dictionaries.
    """
    findings = []
    s3 = session.client("s3")
    
    try:
        # List all buckets
        buckets = s3.list_buckets()
        
        for bucket in buckets.get("Buckets", []):
            bucket_name = bucket["Name"]
            
            # Check bucket ACL for public access
            try:
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                for grant in acl.get("Grants", []):
                    grantee = grant.get("Grantee", {})
                    if grantee.get("Type") == "Group":
                        uri = grantee.get("URI", "")
                        if "AllUsers" in uri or "AuthenticatedUsers" in uri:
                            findings.append({
                                "category": "S3",
                                "title": f"Public S3 bucket: {bucket_name}",
                                "description": f"S3 bucket '{bucket_name}' has public access via ACL.",
                                "severity": "HIGH",
                                "resource_id": bucket_name,
                                "remediation": f"Remove public ACL grants from bucket '{bucket_name}'.",
                                "mapped_control": "ISO 27001 A.9.1.2",
                            })
                            break
            except ClientError as e:
                # Some buckets may not allow ACL access
                if "AccessDenied" not in str(e):
                    print(f"Error checking ACL for {bucket_name}: {e}")
            
            # Check bucket policy for public access
            try:
                policy = s3.get_bucket_policy(Bucket=bucket_name)
                policy_doc = json.loads(policy.get("Policy", "{}"))
                
                for statement in policy_doc.get("Statement", []):
                    principal = statement.get("Principal", {})
                    if isinstance(principal, dict):
                        if "*" in principal or "AWS" in principal and "*" in str(principal.get("AWS", "")):
                            findings.append({
                                "category": "S3",
                                "title": f"Public S3 bucket via policy: {bucket_name}",
                                "description": f"S3 bucket '{bucket_name}' has a bucket policy that allows public access.",
                                "severity": "HIGH",
                                "resource_id": bucket_name,
                                "remediation": f"Review and restrict bucket policy for '{bucket_name}'.",
                                "mapped_control": "ISO 27001 A.9.1.2",
                            })
                            break
                    elif principal == "*":
                        findings.append({
                            "category": "S3",
                            "title": f"Public S3 bucket via policy: {bucket_name}",
                            "description": f"S3 bucket '{bucket_name}' has a bucket policy that allows public access.",
                            "severity": "HIGH",
                            "resource_id": bucket_name,
                            "remediation": f"Review and restrict bucket policy for '{bucket_name}'.",
                            "mapped_control": "ISO 27001 A.9.1.2",
                        })
                        break
            except ClientError as e:
                if "NoSuchBucketPolicy" not in str(e) and "AccessDenied" not in str(e):
                    print(f"Error checking policy for {bucket_name}: {e}")
            
            # Check encryption
            try:
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                # If we get here, encryption is configured
            except ClientError as e:
                if "ServerSideEncryptionConfigurationNotFoundError" in str(e):
                    findings.append({
                        "category": "S3",
                        "title": f"S3 bucket without encryption: {bucket_name}",
                        "description": f"S3 bucket '{bucket_name}' does not have default encryption enabled.",
                        "severity": "MEDIUM",
                        "resource_id": bucket_name,
                        "remediation": f"Enable default encryption (SSE-S3 or SSE-KMS) for bucket '{bucket_name}'.",
                        "mapped_control": "ISO 27001 A.10.1.1",
                    })
                elif "AccessDenied" not in str(e):
                    print(f"Error checking encryption for {bucket_name}: {e}")
    
    except ClientError as e:
        print(f"Error scanning S3: {e}")
        findings.append({
            "category": "S3",
            "title": "S3 scan failed",
            "description": f"Unable to scan S3 buckets: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "S3",
            "remediation": "Check S3 permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings

