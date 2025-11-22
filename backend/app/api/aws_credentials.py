"""
API endpoints for AWS credentials management and validation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, require_superadmin
from app.services.aws_credentials_helper import (
    validate_credentials,
    get_credentials_source,
    get_credentials_recommendation,
)

router = APIRouter()


@router.get("/status")
def get_aws_credentials_status(
    current_user=Depends(require_superadmin),
):
    """
    Get AWS credentials status and recommendations.
    
    Returns information about:
    - Whether credentials are configured
    - Source of credentials (IAM role, IAM user, etc.)
    - Validation status
    - Recommendations for best practices
    """
    try:
        validation = validate_credentials()
        source = get_credentials_source()
        recommendation = get_credentials_recommendation()
        
        return {
            "valid": validation.get("valid", False),
            "source": source,
            "account_id": validation.get("account_id"),
            "arn": validation.get("arn"),
            "message": validation.get("message"),
            "recommendation": recommendation,
            "best_practices": {
                "use_iam_roles": "If running on AWS (EC2, ECS, Lambda), use IAM roles instead of access keys",
                "use_temporary_credentials": "For Docker/local development, use temporary credentials from AWS SSO or STS",
                "rotate_regularly": "If using access keys, rotate them every 90 days",
                "minimal_permissions": "Grant only sts:AssumeRole and sts:GetCallerIdentity permissions",
                "never_commit": "Never commit credentials to version control",
                "use_secrets_manager": "Store credentials in AWS Secrets Manager for production",
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking credentials status: {str(e)}",
        )





