import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth import service
from app.domains.auth.schemas import LoginRequest, RefreshRequest, SignupRequest
from app.shared.envelope import ok
from app.shared.ratelimit import rate_limit
from app.shared.security import decode_token

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
    dependencies=[Depends(rate_limit("auth", "rate_limit_auth"))],
)


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    try:
        return ok(service.signup(db, req).model_dump())
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        return ok(service.login(db, req.email, req.password).model_dump())
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))


@router.post("/refresh")
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        claims = decode_token(req.refresh_token)
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    if claims.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type")
    try:
        return ok(service.refresh(db, claims["sub"]).model_dump())
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))


@router.post("/logout")
def logout():
    # Stateless JWT: client membuang token. Blacklist/rotation = Fase 2+ (Redis).
    return ok({"loggedOut": True})
