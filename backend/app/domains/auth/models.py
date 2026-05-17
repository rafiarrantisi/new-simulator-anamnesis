"""Auth + user models. Multi-tenant: institution_id di setiap baris (§9 K3)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String, default="")
    nim: Mapped[str] = mapped_column(String, default="")
    institution_id: Mapped[str] = mapped_column(String, index=True, default="default")
    role: Mapped[str] = mapped_column(String, default="student")  # student|instructor|admin
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    profile: Mapped["UserProfile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    xp: Mapped[int] = mapped_column(default=0)
    streak: Mapped[int] = mapped_column(default=0)
    total_sessions: Mapped[int] = mapped_column(default=0)
    avatar_emoji: Mapped[str] = mapped_column(String, default="👤")
    avatar_color: Mapped[str] = mapped_column(String, default="#5865F2")
    school: Mapped[str] = mapped_column(String, default="")
    year: Mapped[str] = mapped_column(String, default="")
    # Blob fleksibel utk field gamifikasi yg belum dinormalisasi (kontrak §5.4)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped[User] = relationship(back_populates="profile")
