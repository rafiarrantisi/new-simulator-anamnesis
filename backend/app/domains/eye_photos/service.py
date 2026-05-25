"""Eye photo service: simpan/list/hapus + URL builder.

Anti-cheat di filesystem level: filename random UUID + ext (bukan dari user
input) → no path traversal, no enumeration. Validasi ekstensi & MIME basic.
"""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.domains.admin.service import audit
from app.domains.eye_photos.models import EyePhoto
from app.domains.eye_photos.schemas import EyePhotoAdminOut, EyePhotoOut

# Whitelist ekstensi & MIME — gambar saja, eksplisit.
_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_ALLOWED_MIME = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}
_MAX_BYTES = 8 * 1024 * 1024  # 8 MB per foto — defensif (nginx client_max 25MB)


def _photos_dir() -> Path:
    base = Path(get_settings().upload_dir).resolve() / "eye-photos"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _public_src(filename: str) -> str:
    """Same-origin relative URL — kompatibel dgn nginx proxy /api/* & dev."""
    return f"/api/uploads/eye-photos/{filename}"


def _to_out(p: EyePhoto) -> EyePhotoOut:
    return EyePhotoOut(
        id=p.id,
        caseId=p.case_id,
        src=_public_src(p.filename),
        caption=p.caption or "",
        eye=p.eye or "",
        ord=p.ord or 0,
        uploaded_at=p.uploaded_at,
    )


def _to_admin_out(p: EyePhoto) -> EyePhotoAdminOut:
    return EyePhotoAdminOut(
        id=p.id,
        caseId=p.case_id,
        src=_public_src(p.filename),
        caption=p.caption or "",
        eye=p.eye or "",
        ord=p.ord or 0,
        uploaded_at=p.uploaded_at,
        filename=p.filename,
        uploaded_by=p.uploaded_by,
    )


def list_for_case(db: Session, case_id: str) -> list[EyePhotoOut]:
    rows = db.scalars(
        select(EyePhoto).where(EyePhoto.case_id == case_id).order_by(EyePhoto.ord, EyePhoto.uploaded_at)
    ).all()
    return [_to_out(r) for r in rows]


def list_admin(db: Session, case_id: str | None = None) -> list[EyePhotoAdminOut]:
    q = select(EyePhoto).order_by(EyePhoto.case_id, EyePhoto.ord, EyePhoto.uploaded_at)
    if case_id:
        q = q.where(EyePhoto.case_id == case_id)
    return [_to_admin_out(r) for r in db.scalars(q).all()]


async def save_photo(
    db: Session,
    *,
    case_id: str,
    eye: str,
    caption: str,
    ord_: int,
    file: UploadFile,
    user_id: str | None,
) -> EyePhotoAdminOut:
    """Simpan file ke filesystem + insert row DB.

    Raises HTTPException(400) bila ekstensi/MIME tak valid atau ukuran > limit.
    """
    case_id = (case_id or "").strip()
    if not case_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "caseId wajib diisi")
    eye = (eye or "").strip().upper()
    if eye not in {"", "OD", "OS", "OU"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "eye harus OD/OS/OU/kosong")

    orig_name = file.filename or ""
    ext = Path(orig_name).suffix.lower()
    if ext not in _ALLOWED_EXT:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Ekstensi {ext or '(kosong)'} tak diizinkan. Wajib: {sorted(_ALLOWED_EXT)}",
        )
    if file.content_type and file.content_type.lower() not in _ALLOWED_MIME:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"MIME {file.content_type} tak diizinkan.",
        )

    body = await file.read()
    if not body:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File kosong")
    if len(body) > _MAX_BYTES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File terlalu besar ({len(body)//1024} KB; max {_MAX_BYTES//1024} KB)",
        )

    # Filename random — no user input, no path traversal.
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = _photos_dir() / safe_name
    dest.write_bytes(body)

    row = EyePhoto(
        case_id=case_id,
        filename=safe_name,
        caption=caption or "",
        eye=eye,
        ord=int(ord_ or 0),
        uploaded_by=user_id,
    )
    db.add(row)
    audit(db, user_id=user_id, action="photo_upload", target_type="photo",
          target_id=row.id, diff={"caseId": case_id, "eye": eye, "bytes": len(body)})
    db.commit()
    db.refresh(row)
    return _to_admin_out(row)


def delete_photo(db: Session, photo_id: str, *, user_id: str | None = None) -> None:
    row = db.get(EyePhoto, photo_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")
    # Hapus file dulu (best-effort), lalu DB row.
    try:
        (_photos_dir() / row.filename).unlink(missing_ok=True)
    except OSError:
        # File hilang/permission — DB tetap di-clean supaya tak ada orphan row.
        pass
    case_id, filename = row.case_id, row.filename
    db.delete(row)
    audit(db, user_id=user_id, action="photo_delete", target_type="photo",
          target_id=photo_id, diff={"caseId": case_id, "filename": filename})
    db.commit()


def update_photo(
    db: Session,
    photo_id: str,
    *,
    caption: str | None,
    eye: str | None,
    ord_: int | None,
) -> EyePhotoAdminOut:
    row = db.get(EyePhoto, photo_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")
    if caption is not None:
        row.caption = caption
    if eye is not None:
        eye_u = eye.strip().upper()
        if eye_u not in {"", "OD", "OS", "OU"}:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "eye harus OD/OS/OU/kosong")
        row.eye = eye_u
    if ord_ is not None:
        row.ord = int(ord_)
    db.commit()
    db.refresh(row)
    return _to_admin_out(row)


def count_by_case(db: Session, case_ids: Iterable[str]) -> dict[str, int]:
    """Untuk admin list — jumlah foto per caseId (1 query group-by)."""
    from sqlalchemy import func

    ids = list(case_ids)
    if not ids:
        return {}
    rows = db.execute(
        select(EyePhoto.case_id, func.count(EyePhoto.id))
        .where(EyePhoto.case_id.in_(ids))
        .group_by(EyePhoto.case_id)
    ).all()
    return {cid: int(n) for cid, n in rows}
