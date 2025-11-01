"""
Additional validation utilities.
"""
from typing import Optional
import re


def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input.
    Remove potentially dangerous characters.
    """
    if not text:
        return ""
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Trim whitespace
    text = text.strip()
    
    # Apply length limit if specified
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def validate_uuid(uuid_string: str) -> bool:
    """Validate UUID format."""
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(uuid_string))

