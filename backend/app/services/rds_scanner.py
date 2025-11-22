import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_rds(session: boto3.Session) -> List[Dict]:
    """
    Scan RDS instances for security issues (encryption, public access, etc.).
    
    Returns a list of finding dictionaries.
    """
    findings = []
    rds = session.client("rds", region_name=settings.AWS_REGION)
    
    try:
        # List all RDS instances
        paginator = rds.get_paginator("describe_db_instances")
        
        for page in paginator.paginate():
            for db_instance in page.get("DBInstances", []):
                db_id = db_instance["DBInstanceIdentifier"]
                db_arn = db_instance.get("DBInstanceArn", db_id)
                db_engine = db_instance.get("Engine", "unknown")
                
                # Check encryption status
                storage_encrypted = db_instance.get("StorageEncrypted", False)
                if not storage_encrypted:
                    findings.append({
                        "category": "RDS",
                        "title": f"RDS instance not encrypted: {db_id}",
                        "description": f"RDS instance '{db_id}' ({db_engine}) does not have encryption at rest enabled.",
                        "severity": "HIGH",
                        "resource_id": db_arn,
                        "remediation": f"Enable encryption at rest for RDS instance '{db_id}'. Note: This requires creating a new instance with encryption enabled.",
                        "mapped_control": "ISO 27001 A.10.1.1",
                    })
                
                # Check if publicly accessible
                publicly_accessible = db_instance.get("PubliclyAccessible", False)
                if publicly_accessible:
                    findings.append({
                        "category": "RDS",
                        "title": f"RDS instance is publicly accessible: {db_id}",
                        "description": f"RDS instance '{db_id}' ({db_engine}) is configured to be publicly accessible, which poses a security risk.",
                        "severity": "HIGH",
                        "resource_id": db_arn,
                        "remediation": f"Modify RDS instance '{db_id}' to disable public accessibility. Use a bastion host or VPN for secure access instead.",
                        "mapped_control": "ISO 27001 A.9.1.2",
                    })
                
                # Check if automatic backups are enabled
                backup_retention_period = db_instance.get("BackupRetentionPeriod", 0)
                if backup_retention_period == 0:
                    findings.append({
                        "category": "RDS",
                        "title": f"RDS instance has no automated backups: {db_id}",
                        "description": f"RDS instance '{db_id}' ({db_engine}) does not have automated backups enabled.",
                        "severity": "MEDIUM",
                        "resource_id": db_arn,
                        "remediation": f"Enable automated backups for RDS instance '{db_id}' with an appropriate retention period (recommended: 7+ days).",
                        "mapped_control": "ISO 27001 A.12.3.1",
                    })
                
                # Check if minor version auto-upgrade is enabled
                auto_minor_version_upgrade = db_instance.get("AutoMinorVersionUpgrade", False)
                if not auto_minor_version_upgrade:
                    findings.append({
                        "category": "RDS",
                        "title": f"RDS instance has auto minor version upgrade disabled: {db_id}",
                        "description": f"RDS instance '{db_id}' ({db_engine}) does not have automatic minor version upgrades enabled, which may result in running outdated software.",
                        "severity": "LOW",
                        "resource_id": db_arn,
                        "remediation": f"Enable automatic minor version upgrades for RDS instance '{db_id}' to keep the database engine updated with security patches.",
                        "mapped_control": "ISO 27001 A.12.6.1",
                    })
                
                # Check if Multi-AZ is enabled (for production databases)
                multi_az = db_instance.get("MultiAZ", False)
                if not multi_az and db_instance.get("DBInstanceStatus") == "available":
                    # Only flag this as LOW severity as it's more of a best practice than a security issue
                    findings.append({
                        "category": "RDS",
                        "title": f"RDS instance not in Multi-AZ mode: {db_id}",
                        "description": f"RDS instance '{db_id}' ({db_engine}) is not configured for Multi-AZ deployment, which reduces availability and durability.",
                        "severity": "LOW",
                        "resource_id": db_arn,
                        "remediation": f"Consider enabling Multi-AZ for RDS instance '{db_id}' for better availability and data durability.",
                        "mapped_control": None,
                    })
        
        # Check RDS snapshots for public access
        try:
            snapshot_paginator = rds.get_paginator("describe_db_snapshots")
            for page in snapshot_paginator.paginate():
                for snapshot in page.get("DBSnapshots", []):
                    snapshot_id = snapshot["DBSnapshotIdentifier"]
                    snapshot_arn = snapshot.get("DBSnapshotArn", snapshot_id)
                    
                    # Check if snapshot is encrypted
                    encrypted = snapshot.get("Encrypted", False)
                    if not encrypted:
                        findings.append({
                            "category": "RDS",
                            "title": f"RDS snapshot not encrypted: {snapshot_id}",
                            "description": f"RDS snapshot '{snapshot_id}' is not encrypted, which may contain sensitive data.",
                            "severity": "MEDIUM",
                            "resource_id": snapshot_arn,
                            "remediation": f"Ensure future snapshots are encrypted. Copy this snapshot to create an encrypted version if needed.",
                            "mapped_control": "ISO 27001 A.10.1.1",
                        })
        except ClientError as e:
            # Snapshot permissions might not be available
            if "AccessDenied" not in str(e):
                print(f"Error scanning RDS snapshots: {e}")
    
    except ClientError as e:
        print(f"Error scanning RDS: {e}")
        findings.append({
            "category": "RDS",
            "title": "RDS scan failed",
            "description": f"Unable to scan RDS instances: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "RDS",
            "remediation": "Check RDS permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings





