"""SQLAlchemy engine + session factory (backend-plan §6.1).

DB URL configurable: sqlite (dev, runnable tanpa Docker) atau Postgres (prod
via env). Schema multi-tenant: setiap tabel domain punya institution_id.
"""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

_settings = get_settings()

_connect_args = (
    {"check_same_thread": False}
    if _settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(_settings.database_url, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables. Dev convenience; prod pakai Alembic (backend-plan §10)."""
    # Import models so they register on Base.metadata.
    # (users domain pakai model dari auth — tidak punya models.py sendiri)
    from app.domains.auth import models as _auth  # noqa: F401
    from app.domains.cases import models as _cases  # noqa: F401
    from app.domains.sessions import models as _sessions  # noqa: F401

    Base.metadata.create_all(bind=engine)
