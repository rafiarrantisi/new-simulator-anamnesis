"""Alembic env — diwirekan ke settings (DATABASE_URL) + Base metadata.

Mekanisme migrasi skema RESMI (backend-plan §10 / kontrak §10 v0.4.0).
`init_db()` create_all hanya bootstrap dev/test (idempotent, tak alter).
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from app.config import get_settings
from app.database import Base

# Import semua model agar terdaftar di Base.metadata utk autogenerate.
from app.domains.auth import models as _auth  # noqa: F401,E402
from app.domains.cases import models as _cases  # noqa: F401,E402
from app.domains.sessions import models as _sessions  # noqa: F401,E402

config = context.config
config.set_main_option("sqlalchemy.url", get_settings().database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # sqlite: ALTER via batch (kontrak: dev sqlite)
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
