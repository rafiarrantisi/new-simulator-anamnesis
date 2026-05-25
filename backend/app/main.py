"""FastAPI app — domain-modular (backend-plan §6.1, kontrak §6)."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.domains.admin.router import router as admin_router
from app.domains.ai.router import router as ai_router
from app.domains.auth.router import router as auth_router
from app.domains.cases.router import admin_router as cases_admin_router
from app.domains.cases.router import router as cases_router
from app.domains.eye_photos.router import router as eye_photos_router
from app.domains.exam.router import router as exam_router
from app.domains.scoring.router import router as scoring_router
from app.domains.sessions.router import router as sessions_router
from app.domains.users.router import router as users_router
from app.shared.envelope import ok
from app.shared.security_headers import SecurityHeadersMiddleware

_settings = get_settings()
_log = logging.getLogger("ophtha.startup")


def _ensure_upload_dirs() -> Path:
    """v0.15.0: pastikan upload dir + subdir eye-photos ada (idempoten)."""
    base = Path(_settings.upload_dir).resolve()
    (base / "eye-photos").mkdir(parents=True, exist_ok=True)
    return base


def _seed_admin_user() -> None:
    """v0.15.0: seed 1 super-admin dari .env (ADMIN_EMAIL + ADMIN_PASSWORD_HASH).

    Idempoten:
    - Email kosong / hash kosong → skip (akun admin opsional di dev).
    - Email belum ada → insert dgn role='admin'.
    - Email ada + role='admin' → skip (sudah benar).
    - Email ada + role!='admin' → log warning, JANGAN auto-promote (safety).
    """
    email = (_settings.admin_email or "").strip().lower()
    hashed = (_settings.admin_password_hash or "").strip()
    if not email or not hashed:
        return
    # Import di sini (bukan top-level) cegah circular import + tetap ringan.
    from sqlalchemy import select

    from app.domains.auth.models import User, UserProfile

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))
        if existing is None:
            user = User(
                email=email,
                hashed_password=hashed,
                full_name="Developer Admin",
                institution_id=_settings.default_institution_id,
                role="admin",
            )
            user.profile = UserProfile()
            db.add(user)
            db.commit()
            _log.info("[seed-admin] Created admin user: %s", email)
        elif existing.role != "admin":
            _log.warning(
                "[seed-admin] User %s exists with role=%s — NOT auto-promoting "
                "to admin (safety). Ubah manual via DB bila memang dimaksud.",
                email, existing.role,
            )
        # else: already admin, no-op.
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Prod-guard: prod/staging TOLAK start bila config tak aman; dev → warn.
    _settings.assert_production_safe()
    init_db()  # dev: create tables. Prod: Alembic (backend-plan §10).
    _ensure_upload_dirs()
    _seed_admin_user()
    yield


app = FastAPI(title=_settings.app_name, version="0.15.0", lifespan=lifespan)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth_router, users_router, cases_router, cases_admin_router, sessions_router, exam_router, scoring_router, ai_router, eye_photos_router, admin_router):
    app.include_router(r)


# v0.15.0: serve binary foto via FastAPI StaticFiles, mounted di bawah /api/*
# supaya nginx existing proxy `^/(api|health)` route otomatis ke uvicorn —
# zero nginx config change. Folder dibuat saat lifespan startup (idempoten).
_upload_base = Path(_settings.upload_dir).resolve()
(_upload_base / "eye-photos").mkdir(parents=True, exist_ok=True)
app.mount(
    "/api/uploads/eye-photos",
    StaticFiles(directory=str(_upload_base / "eye-photos"), check_dir=False),
    name="eye_photos_static",
)


@app.get("/health")
def health():
    return ok({"status": "up", "env": _settings.env})
