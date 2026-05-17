"""Settings — pydantic-settings, .env driven (backend-plan §6.1)."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "OphthaSim Backend"
    env: str = "dev"  # dev | staging | prod

    # DB: sqlite untuk dev (runnable tanpa Docker); Postgres via env utk prod.
    # Kontrak §7: prod = PostgreSQL. Ini hanya kenyamanan dev.
    database_url: str = "sqlite:///./ophtha_dev.db"

    # Auth (custom JWT, kontrak §6 / backend-plan §8.1)
    jwt_secret: str = "dev-only-change-me"  # WAJIB di-override via env di prod
    jwt_alg: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Multi-tenant (kontrak §9 K3 — institution_id sejak hari 1)
    default_institution_id: str = "default"

    # RAG infra (Fase 3 — opsional saat skeleton Fase 2)
    qdrant_url: str = "http://localhost:6333"
    embed_model: str = "intfloat/multilingual-e5-large"

    # LLM provider (kontrak §9 K2). Default OpenRouter (OpenAI-compatible,
    # banyak model via 'vendor/model'). Kosongkan key → StubLlmClient.
    llm_provider: str = "openrouter"  # openrouter | openai | anthropic | ""
    llm_api_key: str = ""
    llm_base_url: str = "https://openrouter.ai/api/v1"
    llm_model: str = "anthropic/claude-3.5-sonnet"  # persona (kuat) — sesuaikan
    llm_judge_model: str = "openai/gpt-4o-mini"      # judge (murah, rag-plan §9.1)
    # OpenRouter opsional (atribusi; aman dikosongkan)
    llm_site_url: str = ""
    llm_app_title: str = "OphthaSim"

    # ── Voice (Fase 4) ──
    # STT: OpenAI-compatible /audio/transcriptions. Default reuse OpenRouter
    # base+key (kosong → fallback ke llm_*). CAVEAT: OpenRouter mungkin tak
    # dukung audio → set STT_BASE_URL ke endpoint Whisper lain (mis. Groq).
    stt_base_url: str = ""   # kosong → pakai llm_base_url
    stt_api_key: str = ""    # kosong → pakai llm_api_key
    stt_model: str = "openai/whisper-large-v3-turbo"
    stt_language: str = "id"
    # TTS: ElevenLabs (env-driven; nonaktif sampai TTS_API_KEY diisi)
    tts_provider: str = "elevenlabs"
    tts_api_key: str = ""
    tts_base_url: str = "https://api.elevenlabs.io"
    tts_voice_id: str = "EXAVITQu4vr4xnSDxMaL"  # ElevenLabs "Sarah" (multibahasa)
    tts_model: str = "eleven_multilingual_v2"

    # ── Rate limiting (in-memory; Redis-backed = scale, ditunda) ──
    rate_limit_enabled: bool = True
    rate_limit_auth: int = 20      # /api/auth/* per IP per menit
    rate_limit_ai: int = 30        # /api/ai|scoring per user per menit
    rate_limit_window_sec: int = 60

    def stt_base(self) -> str:
        return self.stt_base_url or self.llm_base_url

    def stt_key(self) -> str:
        return self.stt_api_key or self.llm_api_key

    def is_prod(self) -> bool:
        return self.env.lower() in ("prod", "production", "staging")

    def production_issues(self) -> list[str]:
        """Konfigurasi tak-aman utk lingkungan prod/staging."""
        issues: list[str] = []
        weak = {"", "dev-only-change-me", "change-me", "secret"}
        if self.jwt_secret in weak or len(self.jwt_secret) < 32:
            issues.append("JWT_SECRET lemah/default (wajib acak >=32 byte)")
        if self.database_url.startswith("sqlite"):
            issues.append("DATABASE_URL sqlite (wajib PostgreSQL di prod)")
        if "*" in self.cors_origins:
            issues.append("CORS_ORIGINS wildcard '*' (wajib origin spesifik)")
        if not self.llm_api_key:
            issues.append("LLM_API_KEY kosong")
        return issues

    def assert_production_safe(self) -> None:
        """Fail-fast: prod/staging tolak start bila tak aman; dev → warn."""
        issues = self.production_issues()
        if not issues:
            return
        msg = "Konfigurasi tak aman: " + "; ".join(issues)
        if self.is_prod():
            raise RuntimeError(f"[PROD GUARD] {msg}")
        import warnings
        warnings.warn(f"[DEV] {msg} — wajib diperbaiki sebelum prod.", stacklevel=2)

    # Korpus kasus markdown (sumber kebenaran kanonik, kontrak §5.6)
    cases_dir: str = str(_REPO_ROOT / "data-kasus")


@lru_cache
def get_settings() -> Settings:
    return Settings()
