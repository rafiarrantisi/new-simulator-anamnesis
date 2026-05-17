"""STT — Whisper via endpoint OpenAI-compatible (Fase 4, kontrak v0.8.0).

Default base+key = OpenRouter (sama spt LLM). CAVEAT: OpenRouter router
LLM-chat; bila tak dukung /audio/transcriptions → set STT_BASE_URL ke
endpoint Whisper OpenAI-compatible lain (mis. Groq). Provider-agnostic.
"""
from __future__ import annotations

from app.config import get_settings

# Bocorkan kosakata medis ID → akurasi istilah khusus naik (voice-plan §6).
_MEDICAL_PROMPT = (
    "Percakapan dokter dan pasien dalam bahasa Indonesia. Istilah medis: "
    "anamnesis, konjungtivitis, glaukoma, blefaritis, keratitis, uveitis, "
    "visus, tonometri, slit lamp, funduskopi, preaurikular, fotofobia."
)


class SttUnavailable(RuntimeError):
    pass


def transcribe(audio_bytes: bytes, filename: str = "speech.webm") -> str:
    s = get_settings()
    key = s.stt_key()
    if not key:
        raise SttUnavailable("STT belum dikonfigurasi (STT/LLM API key kosong)")
    try:
        from openai import OpenAI
    except ImportError as e:  # pragma: no cover
        raise SttUnavailable(f"SDK openai tak tersedia: {e}") from e
    try:
        client = OpenAI(api_key=key, base_url=s.stt_base() or None)
        r = client.audio.transcriptions.create(
            model=s.stt_model,
            file=(filename, audio_bytes, "application/octet-stream"),
            language=s.stt_language,
            prompt=_MEDICAL_PROMPT,
            temperature=0.0,
        )
        return (getattr(r, "text", None) or "").strip()
    except Exception as e:  # provider tak dukung audio / error jaringan
        raise SttUnavailable(
            f"Transkripsi gagal di {s.stt_base()}: {e}. "
            f"Jika OpenRouter tak dukung audio, set STT_BASE_URL ke endpoint "
            f"Whisper OpenAI-compatible (mis. Groq)."
        ) from e
