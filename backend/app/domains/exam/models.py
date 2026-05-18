"""Exam persistence — kontrak §3B.2.

Tabel BARU `exam_records` (1:1 sesi). TIDAK meng-alter tabel existing /
TIDAK menimpa `sessions.report` (EvaluationReport §3A terpisah, kontrak
§3B.2). Non-breaking: dev = create_all; prod = Alembic (revisi terpisah).
"""
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ExamRecordRow(Base):
    __tablename__ = "exam_records"

    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.id"), primary_key=True
    )
    case_id: Mapped[str] = mapped_column(String, index=True)
    record: Mapped[dict] = mapped_column(JSON, default=dict)        # StudentExamRecord
    report: Mapped[dict | None] = mapped_column(JSON, default=None)  # ExamScoringReport §3B.2
    exam_score: Mapped[float | None] = mapped_column(Float, default=None)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
