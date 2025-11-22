import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_ebs(session: boto3.Session) -> List[Dict]:
    """
    Scan EBS volumes for security issues (encryption status).
    
    Returns a list of finding dictionaries.
    """
    findings = []
    ec2 = session.client("ec2", region_name=settings.AWS_REGION)
    
    try:
        # List all EBS volumes
        paginator = ec2.get_paginator("describe_volumes")
        
        for page in paginator.paginate():
            for volume in page.get("Volumes", []):
                volume_id = volume["VolumeId"]
                volume_arn = f"arn:aws:ec2:{ec2.meta.region_name}:{volume.get('OwnerId', 'unknown')}:volume/{volume_id}"
                volume_state = volume.get("State", "unknown")
                
                # Only check volumes that are in use or available (skip deleted/error states)
                if volume_state not in ["available", "in-use"]:
                    continue
                
                # Check encryption status
                encrypted = volume.get("Encrypted", False)
                if not encrypted:
                    attachments = volume.get("Attachments", [])
                    attached_to = attachments[0].get("InstanceId", "unknown") if attachments else "unattached"
                    
                    findings.append({
                        "category": "EBS",
                        "title": f"EBS volume not encrypted: {volume_id}",
                        "description": f"EBS volume '{volume_id}' is not encrypted at rest. State: {volume_state}. Attached to: {attached_to if attachments else 'unattached'}.",
                        "severity": "HIGH",
                        "resource_id": volume_arn,
                        "remediation": f"Enable encryption for EBS volume '{volume_id}'. Note: This requires creating a new encrypted volume and migrating data, or enabling encryption during volume creation.",
                        "mapped_control": "ISO 27001 A.10.1.1",
                    })
                
                # Check if volume has a KMS key (if encrypted)
                if encrypted:
                    kms_key_id = volume.get("KmsKeyId")
                    if not kms_key_id:
                        findings.append({
                            "category": "EBS",
                            "title": f"EBS volume encrypted but no KMS key specified: {volume_id}",
                            "description": f"EBS volume '{volume_id}' is encrypted but does not have a KMS key ID specified. This may use the default AWS-managed key.",
                            "severity": "LOW",
                            "resource_id": volume_arn,
                            "remediation": f"Consider using a customer-managed KMS key for EBS volume '{volume_id}' for better key management and compliance.",
                            "mapped_control": "ISO 27001 A.10.1.2",
                        })
                
                # Check volume type (performance/security consideration)
                volume_type = volume.get("VolumeType", "unknown")
                # GP3 is the latest generation, but this is more of a cost/performance consideration
                # We'll skip flagging this as it's not a security issue
                
                # Check if volume is attached (orphaned volumes)
                if volume_state == "available" and not volume.get("Attachments"):
                    # Check volume age - flag if it's been available for a while (potential orphan)
                    create_time = volume.get("CreateTime")
                    if create_time:
                        from datetime import datetime, timezone
                        now = datetime.now(timezone.utc)
                        age_days = (now - create_time.replace(tzinfo=timezone.utc)).days
                        
                        if age_days > 30:
                            findings.append({
                                "category": "EBS",
                                "title": f"Orphaned EBS volume detected: {volume_id}",
                                "description": f"EBS volume '{volume_id}' has been in 'available' state (unattached) for {age_days} days. This may indicate an orphaned volume incurring unnecessary costs.",
                                "severity": "LOW",
                                "resource_id": volume_arn,
                                "remediation": f"Review EBS volume '{volume_id}' - if it's no longer needed, delete it to reduce costs. If it's needed, attach it to an instance or create a snapshot and delete the volume.",
                                "mapped_control": None,
                            })
        
        # Check EBS snapshots for encryption
        try:
            # Get account ID from STS
            sts = session.client("sts", region_name=settings.AWS_REGION)
            account_id = sts.get_caller_identity()["Account"]
            
            snapshot_paginator = ec2.get_paginator("describe_snapshots")
            owner_filter = {"Name": "owner-id", "Values": [account_id]}
            
            for page in snapshot_paginator.paginate(Filters=[owner_filter]):
                for snapshot in page.get("Snapshots", []):
                    snapshot_id = snapshot["SnapshotId"]
                    snapshot_arn = f"arn:aws:ec2:{ec2.meta.region_name}:{snapshot.get('OwnerId', 'unknown')}:snapshot/{snapshot_id}"
                    
                    # Check encryption status
                    encrypted = snapshot.get("Encrypted", False)
                    if not encrypted:
                        findings.append({
                            "category": "EBS",
                            "title": f"EBS snapshot not encrypted: {snapshot_id}",
                            "description": f"EBS snapshot '{snapshot_id}' is not encrypted, which may contain sensitive data.",
                            "severity": "MEDIUM",
                            "resource_id": snapshot_arn,
                            "remediation": f"Ensure future snapshots are encrypted. Copy this snapshot to create an encrypted version if needed.",
                            "mapped_control": "ISO 27001 A.10.1.1",
                        })
        except ClientError as e:
            # May not have permission to list snapshots or get account ID
            if "AccessDenied" not in str(e) and "UnauthorizedOperation" not in str(e):
                print(f"Error scanning EBS snapshots: {e}")
    
    except ClientError as e:
        print(f"Error scanning EBS volumes: {e}")
        findings.append({
            "category": "EBS",
            "title": "EBS scan failed",
            "description": f"Unable to scan EBS volumes: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "EBS",
            "remediation": "Check EC2 permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings

