import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_logging(session: boto3.Session) -> List[Dict]:
    """
    Scan CloudTrail and GuardDuty for logging and monitoring configuration.
    
    Returns a list of finding dictionaries.
    """
    findings = []
    
    # Check CloudTrail
    try:
        cloudtrail = session.client("cloudtrail", region_name=settings.AWS_REGION)
        trails = cloudtrail.describe_trails()
        
        enabled_trails = [t for t in trails.get("trailList", []) if t.get("IsLogging", False)]
        
        if len(enabled_trails) == 0:
            findings.append({
                "category": "LOGGING",
                "title": "CloudTrail not enabled",
                "description": "No CloudTrail trails are currently logging in this AWS account.",
                "severity": "HIGH",
                "resource_id": "CloudTrail",
                "remediation": "Enable CloudTrail logging for AWS account activity monitoring.",
                "mapped_control": "ISO 27001 A.12.4.1",
            })
        else:
            # Check if any trail has global service events enabled
            has_global = any(t.get("IncludeGlobalServiceEvents", False) for t in enabled_trails)
            if not has_global:
                findings.append({
                    "category": "LOGGING",
                    "title": "CloudTrail missing global service events",
                    "description": "CloudTrail trails are enabled but do not capture global service events.",
                    "severity": "MEDIUM",
                    "resource_id": "CloudTrail",
                    "remediation": "Enable 'Include global service events' in CloudTrail configuration.",
                    "mapped_control": "ISO 27001 A.12.4.1",
                })
    
    except ClientError as e:
        print(f"Error scanning CloudTrail: {e}")
        findings.append({
            "category": "LOGGING",
            "title": "CloudTrail scan failed",
            "description": f"Unable to scan CloudTrail: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "CloudTrail",
            "remediation": "Check CloudTrail permissions for the assumed role.",
            "mapped_control": None,
        })
    
    # Check GuardDuty (optional)
    try:
        guardduty = session.client("guardduty", region_name=settings.AWS_REGION)
        detectors = guardduty.list_detectors()
        
        detector_ids = detectors.get("DetectorIds", [])
        if len(detector_ids) == 0:
            findings.append({
                "category": "LOGGING",
                "title": "GuardDuty not enabled",
                "description": "GuardDuty is not enabled in this AWS account.",
                "severity": "MEDIUM",
                "resource_id": "GuardDuty",
                "remediation": "Enable GuardDuty for threat detection and continuous monitoring.",
                "mapped_control": "ISO 27001 A.12.4.2",
            })
        else:
            # Check if detector is enabled
            for detector_id in detector_ids:
                detector = guardduty.get_detector(DetectorId=detector_id)
                if not detector.get("Status", "").upper() == "ENABLED":
                    findings.append({
                        "category": "LOGGING",
                        "title": f"GuardDuty detector disabled: {detector_id}",
                        "description": f"GuardDuty detector '{detector_id}' exists but is not enabled.",
                        "severity": "MEDIUM",
                        "resource_id": detector_id,
                        "remediation": f"Enable GuardDuty detector '{detector_id}'.",
                        "mapped_control": "ISO 27001 A.12.4.2",
                    })
    
    except ClientError as e:
        # GuardDuty might not be available in all regions or accounts
        if "AccessDenied" not in str(e) and "InvalidInputException" not in str(e):
            print(f"Error scanning GuardDuty: {e}")
    
    return findings

