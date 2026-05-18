"""exam records (kontrak §3B.2 — modul Exam Simulator v0.10.0)

Tabel BARU `exam_records` (1:1 sesi). Non-breaking: tak meng-alter tabel
existing, tak menimpa `sessions.report` (§3A terpisah dari §3B.2).

Revision ID: a1f4e2d7c903
Revises: 0834c3ac0f93
Create Date: 2026-05-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f4e2d7c903'
down_revision: Union[str, Sequence[str], None] = '0834c3ac0f93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'exam_records',
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('record', sa.JSON(), nullable=False),
        sa.Column('report', sa.JSON(), nullable=True),
        sa.Column('exam_score', sa.Float(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('session_id'),
    )
    with op.batch_alter_table('exam_records', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_exam_records_case_id'), ['case_id'], unique=False
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('exam_records', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_exam_records_case_id'))
    op.drop_table('exam_records')
