"""Add remediation metadata to findings

Revision ID: 002_remediation
Revises: 001_initial
Create Date: 2024-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_remediation'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add remediation status and metadata columns
    op.add_column('findings', sa.Column('remediation_status', sa.String(), nullable=True, server_default='open'))
    op.add_column('findings', sa.Column('marked_as_fixed_at', sa.DateTime(), nullable=True))
    op.add_column('findings', sa.Column('marked_as_fixed_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('findings', sa.Column('verified_fixed_at', sa.DateTime(), nullable=True))
    op.add_column('findings', sa.Column('remediation_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Add index on remediation_status for faster queries
    op.create_index('ix_findings_remediation_status', 'findings', ['remediation_status'])


def downgrade() -> None:
    op.drop_index('ix_findings_remediation_status', table_name='findings')
    op.drop_column('findings', 'remediation_metadata')
    op.drop_column('findings', 'verified_fixed_at')
    op.drop_column('findings', 'marked_as_fixed_by')
    op.drop_column('findings', 'marked_as_fixed_at')
    op.drop_column('findings', 'remediation_status')





