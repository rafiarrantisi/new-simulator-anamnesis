"""eye_photos + admin_audit_log (kontrak v0.15.0 Developer Dashboard)

Non-breaking: hanya CREATE TABLE, tak meng-alter tabel existing.

Revision ID: c2e8b91d4f10
Revises: a1f4e2d7c903
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2e8b91d4f10'
down_revision: Union[str, Sequence[str], None] = 'a1f4e2d7c903'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: tambah eye_photos & admin_audit_log."""
    # eye_photos: metadata foto mata per kasus (binary di filesystem)
    op.create_table(
        'eye_photos',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('caption', sa.String(), nullable=False, server_default=''),
        sa.Column('eye', sa.String(), nullable=False, server_default=''),
        sa.Column('ord', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('uploaded_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('filename', name='uq_eye_photos_filename'),
    )
    with op.batch_alter_table('eye_photos', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_eye_photos_case_id'), ['case_id'], unique=False
        )

    # admin_audit_log: forensik mutation oleh admin (case_create/edit, photo_upload/delete, ingest)
    op.create_table(
        'admin_audit_log',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('target_type', sa.String(), nullable=False, server_default=''),
        sa.Column('target_id', sa.String(), nullable=False, server_default=''),
        sa.Column('diff_summary', sa.JSON(), nullable=True),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('admin_audit_log', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_admin_audit_log_ts'), ['ts'], unique=False)
        batch_op.create_index(batch_op.f('ix_admin_audit_log_action'), ['action'], unique=False)
        batch_op.create_index(batch_op.f('ix_admin_audit_log_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('admin_audit_log', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_admin_audit_log_user_id'))
        batch_op.drop_index(batch_op.f('ix_admin_audit_log_action'))
        batch_op.drop_index(batch_op.f('ix_admin_audit_log_ts'))
    op.drop_table('admin_audit_log')

    with op.batch_alter_table('eye_photos', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_eye_photos_case_id'))
    op.drop_table('eye_photos')
