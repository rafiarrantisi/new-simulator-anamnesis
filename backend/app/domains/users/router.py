from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.domains.sessions.models import SessionRow
from app.domains.users.schemas import ProfileResponse, ProfileUpdate
from app.shared.dependencies import get_current_user
from app.shared.envelope import ok

router = APIRouter(prefix="/api/users", tags=["users"])


def _to_profile(u: User) -> ProfileResponse:
    p = u.profile
    return ProfileResponse(
        user_id=u.id, email=u.email, full_name=u.full_name, nim=u.nim,
        role=u.role, institution_id=u.institution_id,
        xp=p.xp, streak=p.streak, total_sessions=p.total_sessions,
        avatar_emoji=p.avatar_emoji, avatar_color=p.avatar_color,
        school=p.school, year=p.year,
    )


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return ok(_to_profile(user).model_dump())


@router.patch("/me")
def update_me(
    patch: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = patch.model_dump(exclude_none=True)
    if "full_name" in data:
        user.full_name = data.pop("full_name")
    for k, v in data.items():
        setattr(user.profile, k, v)
    db.commit()
    db.refresh(user)
    return ok(_to_profile(user).model_dump())


@router.get("/me/sessions")
def my_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    q = (
        select(SessionRow)
        .where(SessionRow.user_id == user.id)
        .order_by(SessionRow.started_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = db.scalars(q).all()
    return ok(
        [
            {
                "id": r.id, "caseId": r.case_id, "mode": r.mode,
                "status": r.status, "startedAt": r.started_at.isoformat(),
                "endedAt": r.ended_at.isoformat() if r.ended_at else None,
                "totalScore": r.total_score,
            }
            for r in rows
        ],
        meta={"total": len(rows), "page": offset // max(limit, 1), "limit": limit},
    )
