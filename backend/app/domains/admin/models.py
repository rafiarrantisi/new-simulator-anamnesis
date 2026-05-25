"""Admin audit log (kontrak v0.15.0 Developer Dashboard).

Forensik trail untuk semua mutation oleh admin:
  - case_create, case_edit, case_reingest
  - photo_upload, photo_delete, photo_edit
  - (future: user_promote, etc.)

V1 hanya tabel + endpoint baca paginated; UI viewer = v2.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String, index=True)  # mis. "case_create"
    target_type: Mapped[str] = mapped_column(String, default="")  # "case" | "photo"
    target_id: Mapped[str] = mapped_column(String, default="")    # caseId / photoId
    diff_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
