from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.domains.auth.models import User, UserProfile
from app.domains.auth.schemas import AuthSession, SignupRequest
from app.shared.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


def _session_for(user: User) -> AuthSession:
    return AuthSession(
        token=create_access_token(user.id, user.institution_id, user.role),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
        role=user.role,
        institution_id=user.institution_id,
    )


def signup(db: Session, req: SignupRequest) -> AuthSession:
    exists = db.scalar(select(User).where(User.email == req.email))
    if exists is not None:
        raise ValueError("Email already registered")
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        nim=req.nim,
        institution_id=req.institution_id or get_settings().default_institution_id,
        role="student",
    )
    user.profile = UserProfile()
    db.add(user)
    db.commit()
    db.refresh(user)
    return _session_for(user)


def login(db: Session, email: str, password: str) -> AuthSession:
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    return _session_for(user)


def refresh(db: Session, user_id: str) -> AuthSession:
    user = db.get(User, user_id)
    if user is None:
        raise ValueError("User not found")
    return _session_for(user)
