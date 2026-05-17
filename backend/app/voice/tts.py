"""TTS — ElevenLabs (Fase 4, kontrak v0.8.0). Disiapkan & env-driven.

Nonaktif sampai TTS_API_KEY diisi → endpoint balas 501 jelas. Tak ada
key hardcoded. Return audio mp3 bytes.
"""
from __future__ import annotations

import httpx

from app.config import get_settings


class TtsNotConfigured(RuntimeError):
    pass


class TtsFailed(RuntimeError):
    pass


def synthesize(text: str) -> bytes:
    s = get_settings()
    if s.tts_provider != "elevenlabs":
        raise TtsNotConfigured(f"TTS provider '{s.tts_provider}' belum didukung")
    if not s.tts_api_key:
        raise TtsNotConfigured(
            "TTS belum dikonfigurasi — isi TTS_API_KEY (ElevenLabs) di .env"
        )
    url = f"{s.tts_base_url.rstrip('/')}/v1/text-to-speech/{s.tts_voice_id}"
    try:
        resp = httpx.post(
            url,
            headers={
                "xi-api-key": s.tts_api_key,
                "accept": "audio/mpeg",
                "content-type": "application/json",
            },
            json={
                "text": text,
                "model_id": s.tts_model,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
            timeout=60,
        )
    except httpx.HTTPError as e:
        raise TtsFailed(f"TTS request gagal: {e}") from e
    if resp.status_code != 200:
        raise TtsFailed(f"ElevenLabs HTTP {resp.status_code}: {resp.text[:200]}")
    return resp.content
