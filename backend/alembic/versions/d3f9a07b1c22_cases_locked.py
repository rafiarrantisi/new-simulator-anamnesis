"""cases.locked — kasus terkunci (v0.16.0)

Non-breaking: tambah 1 kolom boolean ke tabel `cases` (default false).
Live sqlite (create_all path) ditangani _ensure_runtime_columns() di
app/database.py; Alembic = sumber kebenaran utk Postgres/prod.

Revision ID: d3f9a07b1c22
Revises: c2e8b91d4f10
Create Date: 2026-06-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3f9a07b1c22'
down_revision: Union[str, Sequence[str], None] = 'c2e8b91d4f10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('cases', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('locked', sa.Boolean(), nullable=False, server_default=sa.false())
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('cases', schema=None) as batch_op:
        batch_op.drop_column('locked')
