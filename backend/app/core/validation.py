"""
Validation utilities for input validation.
"""
import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.
    Returns (is_valid, error_message)
    Note: bcrypt has a 72-byte limit, so we enforce 72 characters max.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    # bcrypt has a 72-byte limit. To be safe, we limit to 72 characters
    # (assuming UTF-8 encoding, 1 char = 1 byte for ASCII, but could be more for Unicode)
    if len(password.encode('utf-8')) > 72:
        return False, "Password must be no longer than 72 bytes (approximately 72 characters)"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, None


def validate_aws_role_arn(role_arn: str) -> bool:
    """Validate AWS IAM role ARN format."""
    pattern = r'^arn:aws:iam::\d{12}:role/[a-zA-Z0-9+=,.@_-]+$'
    return bool(re.match(pattern, role_arn))


def validate_aws_account_id(account_id: str) -> bool:
    """Validate AWS account ID format."""
    return bool(re.match(r'^\d{12}$', account_id))


def validate_external_id(external_id: str) -> bool:
    """Validate external ID (should be non-empty, alphanumeric + some special chars)."""
    if len(external_id) < 1:
        return False
    if len(external_id) > 1224:  # AWS limit
        return False
    # Allow alphanumeric, dash, underscore, and some special chars
    pattern = r'^[a-zA-Z0-9=,.@:\/+\-_]+$'
    return bool(re.match(pattern, external_id))

