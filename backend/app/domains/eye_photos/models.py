"""Eye Photo model (kontrak v0.15.0 Developer Dashboard).

Binary foto disimpan di filesystem (`<UPLOAD_DIR>/eye-photos/<filename>`),
metadata di DB. Filename = UUID + ext (anti-collision, no path traversal).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class EyePhoto(Base):
    __tablename__ = "eye_photos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    # FK soft (string) ke case_registry.case_id — gak hard FK krn case_id
    # boleh dummy/kustom (mis. "case-001") yg belum tentu di registry.
    case_id: Mapped[str] = mapped_column(String, index=True)
    # Filename relatif (dlm UPLOAD_DIR/eye-photos/), unik.
    filename: Mapped[str] = mapped_column(String, unique=True)
    caption: Mapped[str] = mapped_column(String, default="")
    # "OD" | "OS" | "OU" | "" (none)
    eye: Mapped[str] = mapped_column(String, default="")
    # Urutan tampil di carousel (0 = pertama).
    ord: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    uploaded_by: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
