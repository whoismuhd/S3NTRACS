"""Add enabled_scanners to tenants

Revision ID: 005_enabled_scanners
Revises: 004_scan_schedule
Create Date: 2024-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_enabled_scanners'
down_revision = '004_scan_schedule'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add enabled_scanners to tenants (default to ["IAM", "S3", "LOGGING"] for existing tenants)
    op.add_column('tenants', sa.Column('enabled_scanners', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'enabled_scanners')





