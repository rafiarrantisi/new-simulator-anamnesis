"""Password hashing + JWT (custom JWT, backend-plan §8.1 / kontrak §6).

Access token pendek (15 mnt). Refresh token panjang; di prod refresh
disimpan HttpOnly cookie (kontrak §6) — handler cookie ada di router auth.
"""
from datetime import datetime, timedelta, timezone

import hashlib

import bcrypt
import jwt

from app.config import get_settings

_settings = get_settings()


def _prep(raw: str) -> bytes:
    # bcrypt batas 72 byte → pre-hash sha256 (hex, 64 char) agar tak terpotong.
    return hashlib.sha256(raw.encode("utf-8")).hexdigest().encode("ascii")


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(_prep(raw), bcrypt.gensalt()).decode("ascii")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(raw), hashed.encode("ascii"))
    except ValueError:
        return False


def _encode(claims: dict, expires: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        **claims,
        "type": token_type,
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_alg)


def create_access_token(user_id: str, institution_id: str, role: str) -> str:
    return _encode(
        {"sub": user_id, "institution_id": institution_id, "role": role},
        timedelta(minutes=_settings.access_token_minutes),
        "access",
    )


def create_refresh_token(user_id: str) -> str:
    return _encode({"sub": user_id}, timedelta(days=_settings.refresh_token_days), "refresh")


def decode_token(token: str) -> dict:
    """Raises jwt.PyJWTError on invalid/expired."""
    return jwt.decode(token, _settings.jwt_secret, algorithms=[_settings.jwt_alg])
