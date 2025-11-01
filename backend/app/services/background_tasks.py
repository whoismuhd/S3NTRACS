"""
Background task utilities for async operations.
"""
import logging
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.scan_service import run_scan
from app.db.session import SessionLocal
from app.models.scan_run import ScanRun

logger = logging.getLogger(__name__)


def run_scan_background(scan_run_id: UUID, tenant_id: UUID):
    """
    Background task to run a scan.
    Creates its own database session.
    
    Args:
        scan_run_id: The scan run ID to update
        tenant_id: The tenant ID to scan
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting background scan {scan_run_id} for tenant {tenant_id}")
        # The run_scan function will update the scan_run status
        run_scan(db, scan_run_id, tenant_id)
        logger.info(f"Background scan {scan_run_id} completed for tenant {tenant_id}")
    except Exception as e:
        logger.error(f"Background scan {scan_run_id} failed for tenant {tenant_id}: {e}", exc_info=True)
        # Update scan status to failed
        try:
            scan_run = db.query(ScanRun).filter(ScanRun.id == scan_run_id).first()
            if scan_run:
                from datetime import datetime
                scan_run.status = "failed"
                scan_run.finished_at = datetime.utcnow()
                scan_run.summary = {"error": str(e)}
                db.commit()
        except Exception as update_error:
            logger.error(f"Failed to update scan status: {update_error}")
    finally:
        db.close()

