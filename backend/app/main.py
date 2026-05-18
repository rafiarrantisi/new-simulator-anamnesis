"""FastAPI app — domain-modular (backend-plan §6.1, kontrak §6)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.domains.ai.router import router as ai_router
from app.domains.auth.router import router as auth_router
from app.domains.cases.router import router as cases_router
from app.domains.exam.router import router as exam_router
from app.domains.scoring.router import router as scoring_router
from app.domains.sessions.router import router as sessions_router
from app.domains.users.router import router as users_router
from app.shared.envelope import ok
from app.shared.security_headers import SecurityHeadersMiddleware

_settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Prod-guard: prod/staging TOLAK start bila config tak aman; dev → warn.
    _settings.assert_production_safe()
    init_db()  # dev: create tables. Prod: Alembic (backend-plan §10).
    yield


app = FastAPI(title=_settings.app_name, version="0.10.0", lifespan=lifespan)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth_router, users_router, cases_router, sessions_router, exam_router, scoring_router, ai_router):
    app.include_router(r)


@app.get("/health")
def health():
    return ok({"status": "up", "env": _settings.env})
