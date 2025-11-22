"""Add notification preferences to tenants

Revision ID: 003_notifications
Revises: 002_remediation
Create Date: 2024-01-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_notifications'
down_revision = '002_remediation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add notification preferences to tenants
    op.add_column('tenants', sa.Column('notification_preferences', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add timestamp to alerts
    op.add_column('alerts', sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')))
    op.add_column('alerts', sa.Column('sent_at', sa.DateTime(), nullable=True))
    op.add_column('alerts', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('alerts', 'error_message')
    op.drop_column('alerts', 'sent_at')
    op.drop_column('alerts', 'created_at')
    op.drop_column('tenants', 'notification_preferences')





