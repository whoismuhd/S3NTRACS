"""Script to add scan_metadata column to scan_runs table."""
from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add scan_metadata column if it doesn't exist
    conn.execute(text("""
        ALTER TABLE scan_runs 
        ADD COLUMN IF NOT EXISTS scan_metadata JSON
    """))
    conn.commit()
    print("Added scan_metadata column to scan_runs table")
    
    # Add scan_schedule column if it doesn't exist
    conn.execute(text("""
        ALTER TABLE tenants 
        ADD COLUMN IF NOT EXISTS scan_schedule JSON
    """))
    conn.commit()
    print("Added scan_schedule column to tenants table")
    
    print("Done!")





