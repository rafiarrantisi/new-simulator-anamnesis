"""Security/production hardening (kontrak v0.9.0)."""
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.shared.ratelimit import _check

client = TestClient(app)


# ── Prod-guard ──
def test_dev_config_has_issues_but_does_not_raise():
    s = Settings(env="dev", jwt_secret="dev-only-change-me",
                 database_url="sqlite:///./x.db")
    assert s.production_issues()          # ada masalah
    assert s.is_prod() is False
    s.assert_production_safe()            # dev → warn, TIDAK raise


def test_prod_with_insecure_config_refuses_start():
    s = Settings(env="prod", jwt_secret="dev-only-change-me",
                 database_url="sqlite:///./x.db",
                 cors_origins=["*"], llm_api_key="")
    assert s.is_prod() is True
    iss = s.production_issues()
    assert any("JWT_SECRET" in i for i in iss)
    assert any("sqlite" in i for i in iss)
    assert any("CORS" in i for i in iss)
    with pytest.raises(RuntimeError, match="PROD GUARD"):
        s.assert_production_safe()


def test_prod_with_safe_config_ok():
    s = Settings(
        env="prod",
        jwt_secret="x" * 48,
        database_url="postgresql+psycopg2://u:p@db:5432/ophtha",
        cors_origins=["https://ophtha.example.id"],
        llm_api_key="some-key",
    )
    assert s.production_issues() == []
    s.assert_production_safe()            # tidak raise


# ── Security headers ──
def test_security_headers_present():
    r = client.get("/health")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert r.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


# ── Rate limiter (unit, deterministik) ──
def test_rate_limiter_sliding_window():
    key = "unit-test-ip"
    assert _check("b", key, limit=2, window=60) is True   # 1
    assert _check("b", key, limit=2, window=60) is True   # 2
    assert _check("b", key, limit=2, window=60) is False  # 3 → blokir
    assert _check("b", "lain", limit=2, window=60) is True  # key beda OK
