import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_lambda(session: boto3.Session) -> List[Dict]:
    """
    Scan Lambda functions for security issues (overly permissive roles, public access, etc.).
    
    Returns a list of finding dictionaries.
    """
    findings = []
    lambda_client = session.client("lambda", region_name=settings.AWS_REGION)
    iam = session.client("iam", region_name=settings.AWS_REGION)
    
    try:
        # List all Lambda functions
        paginator = lambda_client.get_paginator("list_functions")
        
        for page in paginator.paginate():
            for func in page.get("Functions", []):
                func_name = func["FunctionName"]
                func_arn = func["FunctionArn"]
                role_arn = func.get("Role", "")
                
                # Check if function has VPC configuration (security best practice)
                vpc_config = func.get("VpcConfig", {})
                if not vpc_config or not vpc_config.get("VpcId"):
                    findings.append({
                        "category": "LAMBDA",
                        "title": f"Lambda function not in VPC: {func_name}",
                        "description": f"Lambda function '{func_name}' is not configured to run within a VPC, which may be required for accessing private resources.",
                        "severity": "LOW",
                        "resource_id": func_arn,
                        "remediation": f"Configure Lambda function '{func_name}' with VPC settings if it needs to access private resources.",
                        "mapped_control": None,
                    })
                
                # Check IAM role permissions (overly permissive policies)
                if role_arn:
                    try:
                        role_name = role_arn.split("/")[-1]
                        
                        # Get role policies
                        attached_policies = iam.list_attached_role_policies(RoleName=role_name)
                        
                        # Check for overly permissive managed policies
                        for policy in attached_policies.get("AttachedPolicies", []):
                            policy_arn = policy["PolicyArn"]
                            
                            # Check for known overly permissive policies
                            if "AdministratorAccess" in policy_arn or "PowerUserAccess" in policy_arn:
                                findings.append({
                                    "category": "LAMBDA",
                                    "title": f"Lambda function has overly permissive IAM role: {func_name}",
                                    "description": f"Lambda function '{func_name}' uses an IAM role with overly permissive policies (AdministratorAccess/PowerUserAccess).",
                                    "severity": "HIGH",
                                    "resource_id": func_arn,
                                    "remediation": f"Apply principle of least privilege to Lambda function '{func_name}'. Grant only the specific permissions required for the function to operate.",
                                    "mapped_control": "ISO 27001 A.9.2.2",
                                })
                            
                            # Check for wildcard actions
                            if "*" in policy_arn or "FullAccess" in policy_arn:
                                findings.append({
                                    "category": "LAMBDA",
                                    "title": f"Lambda function has full access policy: {func_name}",
                                    "description": f"Lambda function '{func_name}' uses an IAM role with a full access policy, which may grant excessive permissions.",
                                    "severity": "MEDIUM",
                                    "resource_id": func_arn,
                                    "remediation": f"Review and restrict IAM role permissions for Lambda function '{func_name}' to only what's necessary.",
                                    "mapped_control": "ISO 27001 A.9.2.2",
                                })
                        
                        # Check inline policies
                        inline_policies = iam.list_role_policies(RoleName=role_name)
                        for policy_name in inline_policies.get("PolicyNames", []):
                            policy_doc = iam.get_role_policy(RoleName=role_name, PolicyName=policy_name)
                            policy_document = policy_doc.get("PolicyDocument", {})
                            
                            # Check for wildcard actions in policy document
                            for statement in policy_document.get("Statement", []):
                                actions = statement.get("Action", [])
                                if isinstance(actions, str):
                                    actions = [actions]
                                
                                for action in actions:
                                    if action == "*" or action.endswith(":*"):
                                        findings.append({
                                            "category": "LAMBDA",
                                            "title": f"Lambda function has wildcard action in IAM policy: {func_name}",
                                            "description": f"Lambda function '{func_name}' uses an IAM role with a policy containing wildcard actions ('{action}'), which may grant excessive permissions.",
                                            "severity": "MEDIUM",
                                            "resource_id": func_arn,
                                            "remediation": f"Restrict IAM policy for Lambda function '{func_name}' to specific actions only.",
                                            "mapped_control": "ISO 27001 A.9.2.2",
                                        })
                                    break
                    except ClientError as e:
                        # May not have permission to check IAM role details
                        if "AccessDenied" not in str(e) and "NoSuchEntity" not in str(e):
                            print(f"Error checking IAM role for Lambda {func_name}: {e}")
                
                # Check if function uses environment variables (security consideration)
                env_vars = func.get("Environment", {}).get("Variables", {})
                if env_vars:
                    # Flag if environment variables might contain sensitive data (heuristic)
                    sensitive_keys = ["password", "secret", "key", "token", "credential"]
                    for key in env_vars.keys():
                        if any(sensitive_word in key.lower() for sensitive_word in sensitive_keys):
                            findings.append({
                                "category": "LAMBDA",
                                "title": f"Lambda function may have sensitive data in environment variables: {func_name}",
                                "description": f"Lambda function '{func_name}' has environment variables that may contain sensitive data (e.g., passwords, keys). Consider using AWS Secrets Manager or Parameter Store instead.",
                                "severity": "MEDIUM",
                                "resource_id": func_arn,
                                "remediation": f"Move sensitive environment variables for Lambda function '{func_name}' to AWS Secrets Manager or Systems Manager Parameter Store.",
                                "mapped_control": "ISO 27001 A.9.4.3",
                            })
                            break
                
                # Check if function has dead letter queue configured (resilience)
                dead_letter_config = func.get("DeadLetterConfig", {})
                if not dead_letter_config or not dead_letter_config.get("TargetArn"):
                    findings.append({
                        "category": "LAMBDA",
                        "title": f"Lambda function has no dead letter queue: {func_name}",
                        "description": f"Lambda function '{func_name}' does not have a dead letter queue configured, which may result in lost error information.",
                        "severity": "LOW",
                        "resource_id": func_arn,
                        "remediation": f"Configure a dead letter queue for Lambda function '{func_name}' to capture failed invocations.",
                        "mapped_control": None,
                    })
                
                # Check if function has reserved concurrent executions (cost/performance)
                reserved_concurrent_executions = func.get("ReservedConcurrentExecutions")
                if reserved_concurrent_executions is None:
                    findings.append({
                        "category": "LAMBDA",
                        "title": f"Lambda function has no reserved concurrent executions: {func_name}",
                        "description": f"Lambda function '{func_name}' does not have reserved concurrent executions configured, which may lead to unexpected costs or throttling.",
                        "severity": "LOW",
                        "resource_id": func_arn,
                        "remediation": f"Consider setting reserved concurrent executions for Lambda function '{func_name}' to manage costs and prevent unlimited scaling.",
                        "mapped_control": None,
                    })
    
    except ClientError as e:
        print(f"Error scanning Lambda functions: {e}")
        findings.append({
            "category": "LAMBDA",
            "title": "Lambda scan failed",
            "description": f"Unable to scan Lambda functions: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "LAMBDA",
            "remediation": "Check Lambda permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings





