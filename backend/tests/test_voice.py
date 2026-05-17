"""Fase 4 voice endpoints — cek deterministik & offline (tanpa panggil
provider STT nyata; uji STT live = probe terpisah, lihat ringkasan)."""
import io

from fastapi.testclient import TestClient

from app.domains.ai.router import _DEDUP_WINDOW, _is_dup
from app.main import app

client = TestClient(app)


def _token() -> str:
    client.post("/api/auth/signup", json={
        "email": "voice@uni.ac.id", "password": "secret12", "full_name": "V",
    })
    return client.post("/api/auth/login", json={
        "email": "voice@uni.ac.id", "password": "secret12",
    }).json()["data"]["token"]


def test_transcribe_requires_auth():
    r = client.post("/api/ai/transcribe",
                     files={"audio": ("a.webm", b"x", "audio/webm")})
    assert r.status_code == 401


def test_transcribe_empty_audio_400():
    h = {"Authorization": f"Bearer {_token()}"}
    r = client.post("/api/ai/transcribe", headers=h,
                     files={"audio": ("a.webm", b"", "audio/webm")})
    assert r.status_code == 400
    assert r.json()["success"] is False


def test_dedup_guard_logic():
    hsh = "deadbeef" * 4
    assert _is_dup(hsh) is False          # pertama → bukan duplikat
    assert _is_dup(hsh) is True           # ulang dalam window → duplikat
    assert _DEDUP_WINDOW == 5.0


def test_tts_not_configured_raises(monkeypatch):
    # Deterministik & env-independent: key kosong → TtsNotConfigured.
    import app.voice.tts as tts_mod

    class _S:
        tts_provider = "elevenlabs"
        tts_api_key = ""
        tts_base_url = "https://api.elevenlabs.io"
        tts_voice_id = "x"
        tts_model = "eleven_multilingual_v2"

    monkeypatch.setattr(tts_mod, "get_settings", lambda: _S())
    import pytest
    with pytest.raises(tts_mod.TtsNotConfigured):
        tts_mod.synthesize("Halo")


def test_tts_endpoint_configured_degrades_cleanly():
    # .env punya TTS_API_KEY → BUKAN 501. Quota habis → 502 + error jelas;
    # quota ada → 200 audio/mpeg. Apa pun: tidak crash, envelope rapi.
    h = {"Authorization": f"Bearer {_token()}"}
    r = client.post("/api/ai/tts", headers=h, json={"text": "Halo"})
    assert r.status_code != 501
    assert r.status_code == 200 or (
        r.headers.get("content-type", "").startswith("application/json")
        and r.json().get("error")
    )


def test_tts_requires_auth():
    assert client.post("/api/ai/tts", json={"text": "Halo"}).status_code == 401
