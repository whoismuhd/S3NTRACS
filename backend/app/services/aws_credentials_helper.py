"""
Helper utilities for AWS credentials management and validation.
"""
import boto3
import logging
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_credentials_source() -> str:
    """
    Determine the source of AWS credentials being used.
    
    Returns:
        str: Source of credentials ('iam_role', 'environment', 'credentials_file', 'none')
    """
    try:
        sts = boto3.client("sts", region_name=settings.AWS_REGION)
        identity = sts.get_caller_identity()
        
        # Check if using IAM role (ARN contains 'assumed-role' or 'role/')
        arn = identity.get("Arn", "")
        if "assumed-role" in arn or "/role/" in arn:
            return "iam_role"
        elif "/user/" in arn:
            return "iam_user"
        else:
            return "unknown"
    except NoCredentialsError:
        return "none"
    except Exception as e:
        logger.error(f"Error determining credentials source: {e}")
        return "unknown"


def validate_credentials() -> dict:
    """
    Validate that AWS credentials are configured and working.
    
    Returns:
        dict: Validation result with status and details
    """
    try:
        sts = boto3.client("sts", region_name=settings.AWS_REGION)
        identity = sts.get_caller_identity()
        
        source = get_credentials_source()
        
        return {
            "valid": True,
            "source": source,
            "account_id": identity.get("Account"),
            "arn": identity.get("Arn"),
            "user_id": identity.get("UserId"),
            "message": f"Credentials valid - using {source}"
        }
    except NoCredentialsError:
        return {
            "valid": False,
            "source": "none",
            "message": "No AWS credentials found. Please configure credentials."
        }
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        return {
            "valid": False,
            "source": "unknown",
            "error_code": error_code,
            "message": f"Invalid credentials: {error_code}"
        }
    except Exception as e:
        return {
            "valid": False,
            "source": "unknown",
            "message": f"Error validating credentials: {str(e)}"
        }


def get_credentials_recommendation() -> str:
    """
    Get a recommendation for the best credentials setup based on deployment.
    
    Returns:
        str: Recommendation message
    """
    source = get_credentials_source()
    
    if source == "iam_role":
        return "✅ Using IAM role - This is the most secure option. No changes needed."
    elif source == "iam_user":
        return "⚠️ Using IAM user credentials. Consider using IAM roles if running on AWS, or temporary credentials for better security."
    elif source == "none":
        return "❌ No credentials found. Configure AWS credentials to enable scanning."
    else:
        return "⚠️ Unknown credentials source. Verify your AWS credentials are configured correctly."





