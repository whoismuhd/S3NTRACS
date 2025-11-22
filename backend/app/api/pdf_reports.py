"""
PDF report generation endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from io import BytesIO

from app.db.session import get_db
from app.models.finding import Finding
from app.models.scan_run import ScanRun
from app.models.tenant import Tenant
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


def generate_pdf_report(scan: ScanRun, tenant: Tenant, findings: list) -> bytes:
    """
    Generate a professional PDF report from scan data.
    Uses reportlab for PDF generation.
    """
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF generation library not installed. Install reportlab: pip install reportlab",
        )
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    elements.append(Paragraph("S3ntraCS Security Scan Report", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    metadata_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
    )
    
    scan_date = scan.started_at.strftime("%B %d, %Y at %H:%M UTC") if scan.started_at else "N/A"
    
    metadata = [
        ["Tenant:", tenant.name],
        ["Scan Date:", scan_date],
        ["Scan ID:", str(scan.id)[:8]],
        ["Status:", scan.status.upper()],
    ]
    
    if scan.summary:
        metadata.append(["Total Findings:", str(scan.summary.get("total_findings", 0))])
    
    metadata_table = Table(metadata, colWidths=[2*inch, 4*inch])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(metadata_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Executive Summary
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
    )
    elements.append(Paragraph("Executive Summary", heading_style))
    
    if scan.summary:
        summary = scan.summary
        summary_data = [
            ["Metric", "Count"],
            ["Total Findings", str(summary.get("total_findings", 0))],
            ["Critical Findings", str(summary.get("by_severity", {}).get("CRITICAL", 0))],
            ["High Findings", str(summary.get("by_severity", {}).get("HIGH", 0))],
            ["Medium Findings", str(summary.get("by_severity", {}).get("MEDIUM", 0))],
            ["Low Findings", str(summary.get("by_severity", {}).get("LOW", 0))],
        ]
        
        # Add category breakdown
        by_category = summary.get("by_category", {})
        if by_category:
            summary_data.append(["", ""])  # Empty row
            summary_data.append(["Category Breakdown", ""])
            for category, count in sorted(by_category.items(), key=lambda x: x[1], reverse=True):
                summary_data.append([f"{category} Findings", str(count)])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Findings Details
    if findings:
        elements.append(Paragraph("Detailed Findings", heading_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Group findings by severity
        findings_by_severity = {
            "CRITICAL": [f for f in findings if f.severity == "CRITICAL"],
            "HIGH": [f for f in findings if f.severity == "HIGH"],
            "MEDIUM": [f for f in findings if f.severity == "MEDIUM"],
            "LOW": [f for f in findings if f.severity == "LOW"],
        }
        
        severity_colors = {
            "CRITICAL": colors.HexColor('#dc2626'),
            "HIGH": colors.HexColor('#ea580c'),
            "MEDIUM": colors.HexColor('#f59e0b'),
            "LOW": colors.HexColor('#3b82f6'),
        }
        
        for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            severity_findings = findings_by_severity[severity]
            if not severity_findings:
                continue
            
            # Severity header
            severity_style = ParagraphStyle(
                f'Severity{severity}',
                parent=styles['Heading3'],
                fontSize=12,
                textColor=severity_colors[severity],
                spaceAfter=8,
            )
            elements.append(Paragraph(f"{severity} Severity ({len(severity_findings)} findings)", severity_style))
            elements.append(Spacer(1, 0.1*inch))
            
            # Findings table for this severity
            findings_data = [["#", "Category", "Title", "Resource ID"]]
            for idx, finding in enumerate(severity_findings, 1):
                findings_data.append([
                    str(idx),
                    finding.category,
                    finding.title[:50] + "..." if len(finding.title) > 50 else finding.title,
                    (finding.resource_id[:30] + "...") if finding.resource_id and len(finding.resource_id) > 30 else (finding.resource_id or "N/A"),
                ])
            
            findings_table = Table(findings_data, colWidths=[0.5*inch, 1.2*inch, 3.8*inch, 1.5*inch])
            findings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), severity_colors[severity]),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # Index column
                ('ALIGN', (1, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            elements.append(findings_table)
            elements.append(Spacer(1, 0.2*inch))
    
    # Footer
    elements.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#9ca3af'),
        alignment=TA_CENTER,
    )
    elements.append(Paragraph(f"Generated by S3ntraCS on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


@router.get("/{tenant_id}/pdf")
def generate_pdf_report_endpoint(
    tenant_id: UUID,
    scan_run_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a PDF report for a scan.
    If scan_run_id is not provided, uses the latest completed scan.
    """
    # Check tenant access
    if current_user.role != "superadmin" and (current_user.role != "tenant_admin" or current_user.tenant_id != tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this tenant",
        )
    
    # Get tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Get scan
    if scan_run_id:
        scan = db.query(ScanRun).filter(
            ScanRun.id == scan_run_id,
            ScanRun.tenant_id == tenant_id
        ).first()
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found",
            )
    else:
        # Get latest completed scan
        scan = (
            db.query(ScanRun)
            .filter(ScanRun.tenant_id == tenant_id, ScanRun.status == "completed")
            .order_by(ScanRun.started_at.desc())
            .first()
        )
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No completed scans found for this tenant",
            )
    
    # Get findings
    findings = db.query(Finding).filter(Finding.scan_run_id == scan.id).all()
    
    # Generate PDF
    try:
        pdf_bytes = generate_pdf_report(scan, tenant, findings)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )
    
    # Generate filename
    scan_date = scan.started_at.strftime("%Y%m%d") if scan.started_at else "unknown"
    filename = f"s3ntracs-report-{tenant.name.replace(' ', '_')}-{scan_date}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )




