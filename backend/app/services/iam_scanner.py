import boto3
from typing import List, Dict
from botocore.exceptions import ClientError


def scan_iam(session: boto3.Session) -> List[Dict]:
    """
    Scan IAM for security issues.
    
    Returns a list of finding dictionaries.
    """
    findings = []
    iam = session.client("iam")
    
    try:
        # List all IAM users
        paginator = iam.get_paginator("list_users")
        
        for page in paginator.paginate():
            for user in page["Users"]:
                username = user["UserName"]
                user_arn = user["Arn"]
                
                # Check MFA devices
                try:
                    mfa_devices = iam.list_mfa_devices(UserName=username)
                    if len(mfa_devices.get("MFADevices", [])) == 0:
                        findings.append({
                            "category": "IAM",
                            "title": f"IAM user without MFA: {username}",
                            "description": f"The IAM user '{username}' does not have MFA enabled.",
                            "severity": "HIGH",
                            "resource_id": user_arn,
                            "remediation": f"Enable MFA for user '{username}' using AWS Console or CLI.",
                            "mapped_control": "ISO 27001 A.9.4.3",
                        })
                except ClientError as e:
                    # Log but continue
                    print(f"Error checking MFA for {username}: {e}")
                
                # Check for AdministratorAccess
                try:
                    # Check attached policies
                    attached_policies = iam.list_attached_user_policies(UserName=username)
                    for policy in attached_policies.get("AttachedPolicies", []):
                        if policy["PolicyName"] == "AdministratorAccess":
                            findings.append({
                                "category": "IAM",
                                "title": f"IAM user with AdministratorAccess: {username}",
                                "description": f"The IAM user '{username}' has AdministratorAccess policy attached.",
                                "severity": "HIGH",
                                "resource_id": user_arn,
                                "remediation": "Apply principle of least privilege. Remove AdministratorAccess and grant specific permissions.",
                                "mapped_control": "ISO 27001 A.9.2.2",
                            })
                            break
                    
                    # Check inline policies (simplified - just check if they exist)
                    inline_policies = iam.list_user_policies(UserName=username)
                    for policy_name in inline_policies.get("PolicyNames", []):
                        policy_doc = iam.get_user_policy(UserName=username, PolicyName=policy_name)
                        # Simple check for AdministratorAccess in policy document
                        policy_str = str(policy_doc.get("PolicyDocument", {}))
                        if "AdministratorAccess" in policy_str or '"Effect": "Allow"' in policy_str and '"Action": "*"' in policy_str:
                            findings.append({
                                "category": "IAM",
                                "title": f"IAM user with overly permissive inline policy: {username}",
                                "description": f"The IAM user '{username}' has an inline policy that may be overly permissive.",
                                "severity": "MEDIUM",
                                "resource_id": user_arn,
                                "remediation": "Review and restrict inline policy permissions.",
                                "mapped_control": "ISO 27001 A.9.2.2",
                            })
                            break
                            
                except ClientError as e:
                    print(f"Error checking policies for {username}: {e}")
    
    except ClientError as e:
        print(f"Error scanning IAM: {e}")
        findings.append({
            "category": "IAM",
            "title": "IAM scan failed",
            "description": f"Unable to scan IAM users: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "IAM",
            "remediation": "Check IAM permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings

