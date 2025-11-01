from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import sqlalchemy as sa
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.session import get_db
from app.api import auth, tenants, scans, findings, reports, statistics, exports

# Setup logging
setup_logging()

app = FastAPI(
    title="S3ntraCS API",
    description="Cloud Security Posture Management API",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
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
app.include_router(exports.router, prefix="/exports", tags=["exports"])


@app.get("/")
def root():
    return {"message": "S3ntraCS API", "version": "0.1.0"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Health check endpoint with database connectivity check."""
    from app.db.base import engine
    try:
        # Check database connectivity
        with engine.connect() as conn:
            conn.execute(sa.text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }, 503

@app.get("/health/simple")
def health_simple():
    """Simple health check without database."""
    return {"status": "healthy"}

