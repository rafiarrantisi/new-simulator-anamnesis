"""AI I/O — STT/TTS (Fase 4, kontrak v0.8.0).

/api/ai/transcribe : Whisper (OpenAI-compatible) + MD5 dedup guard, butuh
                     auth. Balas {transcript, is_duplicate}.
/api/ai/tts        : ElevenLabs → audio/mpeg; 501 jelas bila belum
                     dikonfigurasi (TTS_API_KEY kosong).
"""
import hashlib
import time

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from app.domains.auth.models import User
from app.shared.dependencies import get_current_user
from app.shared.envelope import err, ok
from app.shared.ratelimit import rate_limit
from app.voice.stt import SttUnavailable, transcribe
from app.voice.tts import TtsFailed, TtsNotConfigured, synthesize

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"],
    dependencies=[Depends(rate_limit("ai", "rate_limit_ai"))],
)

# Dedup guard in-memory (voice-plan §6): hash audio → ts terakhir.
_recent: dict[str, float] = {}
_DEDUP_WINDOW = 5.0  # detik


def _is_dup(h: str) -> bool:
    now = time.time()
    for k in [k for k, v in _recent.items() if now - v > _DEDUP_WINDOW * 2]:
        _recent.pop(k, None)
    last = _recent.get(h)
    _recent[h] = now
    return last is not None and (now - last) < _DEDUP_WINDOW


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(default=""),
    user: User = Depends(get_current_user),
):
    data = await audio.read()
    if not data:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST, content=err("Audio kosong")
        )
    if _is_dup(hashlib.md5(data).hexdigest()):
        return ok({"transcript": "", "is_duplicate": True})
    try:
        text = transcribe(data, audio.filename or "speech.webm")
    except SttUnavailable as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=err(str(e))
        )
    return ok({"transcript": text, "is_duplicate": False})


class TtsRequest(BaseModel):
    text: str


@router.post("/tts")
def tts(req: TtsRequest, user: User = Depends(get_current_user)):
    try:
        audio = synthesize(req.text)
    except TtsNotConfigured as e:
        return JSONResponse(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, content=err(str(e))
        )
    except TtsFailed as e:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY, content=err(str(e))
        )
    return Response(content=audio, media_type="audio/mpeg")
