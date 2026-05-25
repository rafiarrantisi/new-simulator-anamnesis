"""Service layer cases (kontrak v0.15.0 Developer Dashboard admin CRUD).

Pre-v0.15 router cuman query langsung; semua tulisan via CLI ingest. Service
ini centralize mutation supaya admin endpoint (POST/PATCH) + ingest CLI bisa
share logic, dgn audit + backup terintegrasi.

Filesystem layout:
  <cases_dir>/kasus-XX-slug.md           ← canonical markdown
  <cases_dir>/.history/kasus-XX-{ts}.md  ← auto-backup tiap edit
"""
from __future__ import annotations

import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.domains.admin.service import audit
from app.domains.cases.models import CaseRegistry
from pipeline.parser import parse_file, validate

_FILENAME_RE = re.compile(r"^kasus-(\d{2,3})-([a-z0-9-]+)\.md$")
_SLUG_RE = re.compile(r"^[a-z0-9-]+$")


def _cases_dir() -> Path:
    return Path(get_settings().cases_dir).resolve()


def _history_dir() -> Path:
    d = _cases_dir() / ".history"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _find_file_for_case(case_id: str) -> Path | None:
    """caseId='kasus-02' → cari file kasus-02-*.md di cases_dir."""
    m = re.match(r"^kasus-(\d{2,3})$", case_id)
    if not m:
        return None
    pat = f"kasus-{m.group(1)}-*.md"
    candidates = sorted(_cases_dir().glob(pat))
    return candidates[0] if candidates else None


def _validate_case_id(case_id: str) -> tuple[str, str]:
    """Return (num_str, normalized_caseId). Raises 400 bila tak sesuai pola."""
    m = re.match(r"^kasus-(\d{2,3})$", case_id or "")
    if not m:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "caseId harus pola 'kasus-XX' (dua-tiga digit). Dashboard tidak "
            "support kasus dummy legacy (case-00X).",
        )
    num_str = m.group(1).zfill(2)
    return num_str, f"kasus-{num_str}"


def _validate_slug(slug: str) -> str:
    s = (slug or "").strip().lower()
    if not s or not _SLUG_RE.match(s):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "slug harus a-z0-9- dan tidak boleh kosong (mis. 'konjungtivitis-viral')",
        )
    return s


def backup_case_file(case_id: str) -> Path | None:
    """Copy file existing ke .history/{caseId}-{ISO}.md. None kalau file tak ada."""
    src = _find_file_for_case(case_id)
    if src is None or not src.exists():
        return None
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = _history_dir() / f"{case_id}-{ts}.md"
    shutil.copy2(src, dest)
    return dest


def _ingest_and_upsert(db: Session, file_path: Path) -> CaseRegistry:
    """Parse file, validate, upsert ke registry. Embed dilewati (Fase 3 only)."""
    from pipeline.registry import upsert_case

    pc = parse_file(file_path)
    errs = validate(pc)
    if errs:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Validasi markdown gagal: {'; '.join(errs)}",
        )
    row = upsert_case(db, pc, embedded=False, chunk_count=len(pc.bagian_a_sections))
    db.commit()
    db.refresh(row)
    return row


def create_case(
    db: Session,
    *,
    case_id: str,
    slug: str,
    content: str,
    metadata: dict | None = None,
    user_id: str | None = None,
) -> CaseRegistry:
    """Tulis markdown baru + parse + upsert.

    Raises 409 bila caseId sudah ada di registry atau file kasus-XX-*.md
    sudah ada di filesystem.
    """
    num_str, case_id = _validate_case_id(case_id)
    slug = _validate_slug(slug)

    # Conflict check (DB + filesystem)
    if db.get(CaseRegistry, case_id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, f"caseId {case_id} sudah ada di registry")
    existing_file = _find_file_for_case(case_id)
    if existing_file is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"File {existing_file.name} sudah ada — pakai PATCH utk edit",
        )

    target = _cases_dir() / f"kasus-{num_str}-{slug}.md"
    target.write_text(content, encoding="utf-8")

    try:
        row = _ingest_and_upsert(db, target)
    except HTTPException:
        # Rollback file kalau parse/validate gagal — supaya gak orphan file.
        target.unlink(missing_ok=True)
        raise

    # Apply metadata override (kalau ada). Update_at auto via _now di model.
    if metadata:
        _apply_metadata(row, metadata)
    audit(db, user_id=user_id, action="case_create", target_type="case",
          target_id=case_id, diff={"slug": slug, "bytes": len(content)})
    db.commit()
    db.refresh(row)
    return row


def update_case(
    db: Session,
    case_id: str,
    *,
    content: str | None = None,
    slug: str | None = None,
    metadata: dict | None = None,
    user_id: str | None = None,
) -> CaseRegistry:
    """Edit kasus existing. Backup file dulu kalau content diubah."""
    _, case_id = _validate_case_id(case_id)
    row = db.get(CaseRegistry, case_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"caseId {case_id} tak ditemukan")

    src = _find_file_for_case(case_id)
    if content is not None:
        # Backup, lalu tulis baru. Bisa juga rename file kalau slug berubah.
        if src is not None:
            backup_case_file(case_id)
        # Tentukan path tujuan: kalau slug baru disuplai, rename. Else pakai file existing.
        if slug:
            slug_v = _validate_slug(slug)
            num = case_id.split("-", 1)[1]
            new_path = _cases_dir() / f"kasus-{num}-{slug_v}.md"
            if src is not None and src != new_path:
                src.unlink(missing_ok=True)
            target = new_path
        else:
            if src is None:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    "File markdown asli tak ada — wajib suplai slug utk tulis ulang",
                )
            target = src
        target.write_text(content, encoding="utf-8")
        # Re-parse + re-upsert (sync DB dgn file baru)
        row = _ingest_and_upsert(db, target)

    if metadata:
        _apply_metadata(row, metadata)
    audit(db, user_id=user_id, action="case_edit", target_type="case",
          target_id=case_id, diff={"contentChanged": content is not None,
                                    "slug": slug, "metaKeys": list((metadata or {}).keys())})
    db.commit()
    db.refresh(row)
    return row


def reingest_case(db: Session, case_id: str, *, user_id: str | None = None) -> CaseRegistry:
    """Trigger re-parse + upsert utk 1 kasus tanpa edit content."""
    _, case_id = _validate_case_id(case_id)
    src = _find_file_for_case(case_id)
    if src is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"File markdown {case_id} tak ditemukan")
    row = _ingest_and_upsert(db, src)
    audit(db, user_id=user_id, action="case_reingest", target_type="case", target_id=case_id)
    db.commit()
    return row


# Kolom yg boleh diubah lewat metadata (whitelist).
_METADATA_FIELDS = {
    "title_id", "title_en", "icd10", "skdi", "organ_system",
    "difficulty", "tags", "references", "stage", "case_type", "is_active",
}


def _apply_metadata(row: CaseRegistry, metadata: dict) -> None:
    for k, v in metadata.items():
        if k in _METADATA_FIELDS and v is not None:
            setattr(row, k, v)
    row.updated_at = datetime.now(timezone.utc)


def list_admin(db: Session, photo_counts: dict[str, int] | None = None) -> list[dict]:
    """List semua kasus (tanpa filter is_active) + field admin extra."""
    photo_counts = photo_counts or {}
    rows = db.scalars(select(CaseRegistry).order_by(CaseRegistry.case_id)).all()
    out = []
    for c in rows:
        src = _find_file_for_case(c.case_id)
        out.append({
            "caseId": c.case_id,
            "filename": c.filename,
            "title_id": c.title_id,
            "title_en": c.title_en,
            "icd10": c.icd10,
            "skdi": c.skdi,
            "organ_system": c.organ_system,
            "difficulty": c.difficulty,
            "tags": c.tags or [],
            "references": c.references or [],
            "stage": c.stage or None,
            "caseType": c.case_type or None,
            "isActive": c.is_active,
            "hasDisclosureLayers": c.has_disclosure_layers,
            "chunkCount": c.chunk_count,
            "photoCount": photo_counts.get(c.case_id, 0),
            "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
            "ingestedAt": c.ingested_at.isoformat() if c.ingested_at else None,
            "hasMarkdown": src is not None,
        })
    return out


def get_admin(db: Session, case_id: str) -> dict:
    """Return detail kasus utk admin (termasuk RAW MARKDOWN — admin only)."""
    _, case_id = _validate_case_id(case_id)
    row = db.get(CaseRegistry, case_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"caseId {case_id} tak ditemukan")
    src = _find_file_for_case(case_id)
    content = src.read_text(encoding="utf-8") if src else ""
    slug = ""
    if src:
        m = _FILENAME_RE.match(src.name)
        if m:
            slug = m.group(2)
    return {
        "caseId": row.case_id,
        "filename": row.filename,
        "slug": slug,
        "title_id": row.title_id,
        "title_en": row.title_en,
        "icd10": row.icd10,
        "skdi": row.skdi,
        "organ_system": row.organ_system,
        "difficulty": row.difficulty,
        "tags": row.tags or [],
        "references": row.references or [],
        "stage": row.stage or None,
        "caseType": row.case_type or None,
        "isActive": row.is_active,
        "hasDisclosureLayers": row.has_disclosure_layers,
        "chunkCount": row.chunk_count,
        "content": content,  # raw markdown
        "hasMarkdown": bool(content),
    }
