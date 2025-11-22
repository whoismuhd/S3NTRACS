from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import sqlalchemy as sa
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.app_config import APP_NAME, APP_DESCRIPTION, APP_VERSION
from app.core.logging_config import setup_logging
from app.db.session import get_db
from app.api import auth, tenants, scans, findings, reports, statistics, exports, admin, trends, websocket, pdf_reports, github, notifications, schedules, scheduler, aws_credentials

# Setup logging
setup_logging()

# Background scheduler for scheduled scans
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.scheduler_service import check_and_run_scheduled_scans

scheduler_instance = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start scheduler
    scheduler_instance.add_job(
        check_and_run_scheduled_scans,
        'interval',
        minutes=1,
        id='check_scheduled_scans',
        replace_existing=True
    )
    scheduler_instance.start()
    yield
    # Shutdown: Stop scheduler
    scheduler_instance.shutdown()

app = FastAPI(
    title=f"{APP_NAME} API",
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Allow any http/https origin in addition to explicit list so dev/testing setups work
app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(scans.router, prefix="/scans", tags=["scans"])
app.include_router(findings.router, prefix="/findings", tags=["findings"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
app.include_router(trends.router, prefix="/trends", tags=["trends"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])
app.include_router(pdf_reports.router, prefix="/pdf", tags=["pdf"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(exports.router, prefix="/exports", tags=["exports"])
app.include_router(github.router, prefix="/github", tags=["github"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
app.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
app.include_router(aws_credentials.router, prefix="/aws-credentials", tags=["aws-credentials"])


@app.get("/")
def root():
    from app.core.app_config import APP_METADATA
    return {"message": f"{APP_NAME} API", "version": APP_VERSION, **APP_METADATA}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity check."""
    try:
        db.execute(sa.text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {"status": "healthy", "database": db_status}
