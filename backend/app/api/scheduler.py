"""
Scheduler endpoint for triggering scheduled scans.
This endpoint should be called periodically (e.g., every minute via cron).
"""
from fastapi import APIRouter
from app.services.scheduler_service import check_and_run_scheduled_scans

router = APIRouter()


@router.post("/check")
def check_scheduled_scans():
    """
    Check and trigger scheduled scans.
    This endpoint should be called periodically (e.g., every minute).
    Can be called via cron job or scheduled task.
    """
    try:
        check_and_run_scheduled_scans()
        return {"status": "success", "message": "Scheduled scans checked"}
    except Exception as e:
        return {"status": "error", "message": str(e)}





