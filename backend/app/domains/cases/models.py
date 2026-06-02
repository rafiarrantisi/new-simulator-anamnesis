"""Case Registry (rag-plan §6.1 + kontrak §5.6 CaseSummary).

Hanya METADATA katalog di sini. Konten Bagian A ada di Qdrant; Bagian B
+ Disclosure Layers server-only (tidak pernah ke client).
"""
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CaseRegistry(Base):
    __tablename__ = "cases"

    case_id: Mapped[str] = mapped_column(String, primary_key=True)  # "kasus-02"
    filename: Mapped[str] = mapped_column(String)
    title_id: Mapped[str] = mapped_column(String)
    title_en: Mapped[str] = mapped_column(String, default="")
    icd10: Mapped[str] = mapped_column(String, default="")
    skdi: Mapped[str] = mapped_column(String, default="")
    organ_system: Mapped[str] = mapped_column(String, default="Mata")
    difficulty: Mapped[str] = mapped_column(String, default="")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    references: Mapped[list] = mapped_column(JSON, default=list)
    stage: Mapped[str] = mapped_column(String, default="")        # preklinik|koas
    case_type: Mapped[str] = mapped_column(String, default="")    # practice|osce
    collection_name: Mapped[str] = mapped_column(String, default="")  # qdrant col
    chunk_count: Mapped[int] = mapped_column(default=0)
    bagian_b_chars: Mapped[int] = mapped_column(default=0)
    has_disclosure_layers: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # v0.16.0: kasus "terkunci" — TETAP ditampilkan di library (is_active),
    # tapi tak bisa dimainkan (greyed + lock badge). Dipakai utk mengarsipkan
    # batch kasus lama saat batch baru (preklinik approved) jadi aktif.
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    ingested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
