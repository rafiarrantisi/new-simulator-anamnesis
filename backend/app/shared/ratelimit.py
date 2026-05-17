"""Rate limiter in-memory sliding-window (kontrak v0.9.0).

CATATAN: per-proses — benar utk single instance. Multi-instance/scale =
Redis-backed (backend-plan §7.2), ditunda. Cukup utk hardening dasar
endpoint mahal (auth brute-force, LLM STT/judge abuse).
"""
import time
from collections import defaultdict

from fastapi import Depends, HTTPException, Request, status

from app.config import Settings, get_settings

_hits: dict[tuple[str, str], list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check(bucket: str, key: str, limit: int, window: int) -> bool:
    now = time.time()
    k = (bucket, key)
    arr = [t for t in _hits[k] if now - t < window]
    if len(arr) >= limit:
        _hits[k] = arr
        return False
    arr.append(now)
    _hits[k] = arr
    return True


def rate_limit(bucket: str, limit_attr: str):
    """Dependency factory. `limit_attr` = nama field limit di Settings."""

    def dep(request: Request, settings: Settings = Depends(get_settings)):
        if not settings.rate_limit_enabled:
            return
        limit = getattr(settings, limit_attr)
        window = settings.rate_limit_window_sec
        if not _check(bucket, _client_ip(request), limit, window):
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Terlalu banyak permintaan. Coba lagi dalam {window}s.",
            )

    return dep
