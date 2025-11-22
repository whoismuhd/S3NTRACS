"""
Centralized application configuration constants.
Update these values to sync across the entire backend.
"""
from typing import Optional
import os

# Application Info
APP_NAME = "S3ntraCS"
APP_FULL_NAME = "S3ntraCS - Cloud Security Posture Management"
APP_DESCRIPTION = "Cloud Security Posture Management API"
APP_VERSION = "0.1.0"

# Repository & Links
GITHUB_OWNER = "whoismuhd"
GITHUB_REPO = "S3NTRACS"
GITHUB_URL = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}"
GITHUB_ISSUES_URL = f"{GITHUB_URL}/issues"

# Contact & Support
SUPPORT_EMAIL = "support@s3ntracs.com"
WEBSITE_URL = os.getenv("S3NTRACS_URL", "http://localhost:3000")

# Social Media
TWITTER_URL = "https://twitter.com/s3ntracs"

# Application Metadata
APP_METADATA = {
    "name": APP_NAME,
    "full_name": APP_FULL_NAME,
    "description": APP_DESCRIPTION,
    "version": APP_VERSION,
    "github_url": GITHUB_URL,
    "github_issues_url": GITHUB_ISSUES_URL,
    "support_email": SUPPORT_EMAIL,
    "website_url": WEBSITE_URL,
    "twitter_url": TWITTER_URL,
}





