"""Add scan schedule to tenants

Revision ID: 004_scan_schedule
Revises: 003_notifications
Create Date: 2024-01-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_scan_schedule'
down_revision = '003_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add scan schedule to tenants
    op.add_column('tenants', sa.Column('scan_schedule', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add scan_metadata to scan_runs for tracking scheduled scans (using scan_metadata instead of metadata to avoid SQLAlchemy reserved name)
    op.add_column('scan_runs', sa.Column('scan_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('scan_runs', 'scan_metadata')
    op.drop_column('tenants', 'scan_schedule')

