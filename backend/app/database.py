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
    from app.domains.admin import models as _admin  # noqa: F401
    from app.domains.auth import models as _auth  # noqa: F401
    from app.domains.cases import models as _cases  # noqa: F401
    from app.domains.exam import models as _exam  # noqa: F401
    from app.domains.eye_photos import models as _eye_photos  # noqa: F401
    from app.domains.sessions import models as _sessions  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_runtime_columns()


def _ensure_runtime_columns() -> None:
    """Tambah kolom baru secara idempoten utk jalur create_all (live sqlite
    bootstrap TIDAK menjalankan Alembic, dan create_all tak meng-ALTER tabel
    yang sudah ada). Tiap statement diisolasi — gagal (kolom sudah ada) =
    di-skip. Alembic tetap sumber kebenaran migrasi utk Postgres/prod.

    v0.16.0: cases.locked.
    """
    from sqlalchemy import text

    stmts = [
        "ALTER TABLE cases ADD COLUMN locked BOOLEAN DEFAULT 0",
    ]
    for s in stmts:
        try:
            with engine.begin() as conn:
                conn.execute(text(s))
        except Exception:
            pass  # kolom sudah ada — aman diabaikan
