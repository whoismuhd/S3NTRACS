import boto3
from typing import List, Dict
from botocore.exceptions import ClientError
from app.core.config import settings


def scan_ec2(session: boto3.Session) -> List[Dict]:
    """
    Scan EC2 Security Groups for security issues (open ports, overly permissive rules).
    
    Returns a list of finding dictionaries.
    """
    findings = []
    ec2 = session.client("ec2", region_name=settings.AWS_REGION)
    
    try:
        # List all security groups
        paginator = ec2.get_paginator("describe_security_groups")
        
        # Common risky ports (0.0.0.0/0 or ::/0 access)
        risky_ports = {
            22: "SSH",
            23: "Telnet",
            21: "FTP",
            3389: "RDP",
            5432: "PostgreSQL",
            3306: "MySQL",
            1433: "SQL Server",
            6379: "Redis",
            27017: "MongoDB",
            5984: "CouchDB",
        }
        
        for page in paginator.paginate():
            for sg in page.get("SecurityGroups", []):
                sg_id = sg["GroupId"]
                sg_name = sg["GroupName"]
                sg_description = sg.get("Description", "")
                
                # Check ingress rules for overly permissive access
                for rule in sg.get("IpPermissions", []):
                    ip_protocol = rule.get("IpProtocol", "-1")
                    
                    # Check for all traffic (port -1 or all protocols)
                    if ip_protocol == "-1":
                        for ip_range in rule.get("IpRanges", []):
                            if ip_range.get("CidrIp") == "0.0.0.0/0":
                                findings.append({
                                    "category": "EC2",
                                    "title": f"Security Group allows all inbound traffic: {sg_id}",
                                    "description": f"Security Group '{sg_id}' ({sg_name}) allows all inbound traffic from the internet (0.0.0.0/0).",
                                    "severity": "CRITICAL",
                                    "resource_id": sg_id,
                                    "remediation": f"Restrict Security Group '{sg_id}' to specific IP ranges or VPC CIDR blocks only.",
                                    "mapped_control": "ISO 27001 A.9.1.2",
                                })
                                break
                        for ipv6_range in rule.get("Ipv6Ranges", []):
                            if ipv6_range.get("CidrIpv6") == "::/0":
                                findings.append({
                                    "category": "EC2",
                                    "title": f"Security Group allows all inbound traffic (IPv6): {sg_id}",
                                    "description": f"Security Group '{sg_id}' ({sg_name}) allows all inbound traffic from the internet (::/0).",
                                    "severity": "CRITICAL",
                                    "resource_id": sg_id,
                                    "remediation": f"Restrict Security Group '{sg_id}' to specific IPv6 ranges only.",
                                    "mapped_control": "ISO 27001 A.9.1.2",
                                })
                                break
                    
                    # Check for specific risky ports open to the world
                    if "FromPort" in rule and "ToPort" in rule:
                        from_port = rule["FromPort"]
                        to_port = rule["ToPort"]
                        
                        # Check each risky port
                        for port, service_name in risky_ports.items():
                            if from_port <= port <= to_port:
                                # Check if open to internet
                                for ip_range in rule.get("IpRanges", []):
                                    if ip_range.get("CidrIp") == "0.0.0.0/0":
                                        findings.append({
                                            "category": "EC2",
                                            "title": f"Security Group has {service_name} (port {port}) open to internet: {sg_id}",
                                            "description": f"Security Group '{sg_id}' ({sg_name}) allows inbound {service_name} traffic (port {port}) from the internet (0.0.0.0/0).",
                                            "severity": "HIGH",
                                            "resource_id": sg_id,
                                            "remediation": f"Restrict port {port} access in Security Group '{sg_id}' to specific IP ranges or remove the rule if not needed.",
                                            "mapped_control": "ISO 27001 A.9.1.2",
                                        })
                                        break
                                
                                # Check IPv6
                                for ipv6_range in rule.get("Ipv6Ranges", []):
                                    if ipv6_range.get("CidrIpv6") == "::/0":
                                        findings.append({
                                            "category": "EC2",
                                            "title": f"Security Group has {service_name} (port {port}) open to internet (IPv6): {sg_id}",
                                            "description": f"Security Group '{sg_id}' ({sg_name}) allows inbound {service_name} traffic (port {port}) from the internet (::/0).",
                                            "severity": "HIGH",
                                            "resource_id": sg_id,
                                            "remediation": f"Restrict port {port} access in Security Group '{sg_id}' to specific IPv6 ranges only.",
                                            "mapped_control": "ISO 27001 A.9.1.2",
                                        })
                                        break
                
                # Check for empty security groups (may indicate misconfiguration)
                if len(sg.get("IpPermissions", [])) == 0:
                    findings.append({
                        "category": "EC2",
                        "title": f"Security Group with no ingress rules: {sg_id}",
                        "description": f"Security Group '{sg_id}' ({sg_name}) has no inbound rules. This may indicate a misconfiguration.",
                        "severity": "LOW",
                        "resource_id": sg_id,
                        "remediation": f"Review Security Group '{sg_id}' - ensure it's intentional that no ingress rules exist.",
                        "mapped_control": None,
                    })
    
    except ClientError as e:
        print(f"Error scanning EC2 Security Groups: {e}")
        findings.append({
            "category": "EC2",
            "title": "EC2 Security Groups scan failed",
            "description": f"Unable to scan EC2 Security Groups: {str(e)}",
            "severity": "MEDIUM",
            "resource_id": "EC2",
            "remediation": "Check EC2 permissions for the assumed role.",
            "mapped_control": None,
        })
    
    return findings





