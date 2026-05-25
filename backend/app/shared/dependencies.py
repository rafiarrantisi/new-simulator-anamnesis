"""DI: current user dari Bearer access token."""
import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.shared.security import decode_token


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = decode_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    if claims.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type")
    user = db.get(User, claims.get("sub"))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate admin endpoints (kontrak v0.15.0 Developer Dashboard).

    Cek `role == 'admin'` DARI DB (bukan JWT claim) supaya token lama tetap
    valid sampai expired, tapi privilege ditentukan real-time. Akun admin =
    seed dari .env `ADMIN_EMAIL`+`ADMIN_PASSWORD_HASH` saat startup.
    """
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
