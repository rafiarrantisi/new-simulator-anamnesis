"""Router eye_photos (kontrak v0.15.0):

Public:
  GET    /api/cases/{caseId}/eye-photos   list utk frontend viewer

Admin (require_admin):
  GET    /api/admin/eye-photos            list semua (opsional ?case_id=...)
  POST   /api/admin/eye-photos            upload multipart
  PATCH  /api/admin/eye-photos/{id}       edit caption/eye/ord
  DELETE /api/admin/eye-photos/{id}       hapus

Binary file di-serve via StaticFiles mount di main.py:
  GET /api/uploads/eye-photos/{filename}
"""
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.domains.eye_photos import service
from app.domains.eye_photos.schemas import EyePhotoUpdate
from app.shared.dependencies import require_admin
from app.shared.envelope import ok

router = APIRouter(tags=["eye_photos"])


# ── Public (dipakai eye-photo.jsx viewer) ──────────────────────────────────
@router.get("/api/cases/{case_id}/eye-photos")
def list_eye_photos_public(case_id: str, db: Session = Depends(get_db)):
    photos = service.list_for_case(db, case_id)
    return ok([p.model_dump() for p in photos], meta={"total": len(photos), "page": 0, "limit": len(photos)})


# ── Admin ─────────────────────────────────────────────────────────────────
@router.get("/api/admin/eye-photos")
def list_eye_photos_admin(
    case_id: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    photos = service.list_admin(db, case_id=case_id)
    return ok([p.model_dump() for p in photos], meta={"total": len(photos), "page": 0, "limit": len(photos)})


@router.post("/api/admin/eye-photos")
async def upload_eye_photo(
    file: UploadFile = File(...),
    case_id: str = Form(...),
    eye: str = Form(""),
    caption: str = Form(""),
    ord: int = Form(0),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    out = await service.save_photo(
        db,
        case_id=case_id,
        eye=eye,
        caption=caption,
        ord_=ord,
        file=file,
        user_id=admin.id,
    )
    return ok(out.model_dump())


@router.patch("/api/admin/eye-photos/{photo_id}")
def update_eye_photo(
    photo_id: str,
    body: EyePhotoUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    out = service.update_photo(
        db, photo_id, caption=body.caption, eye=body.eye, ord_=body.ord
    )
    return ok(out.model_dump())


@router.delete("/api/admin/eye-photos/{photo_id}")
def delete_eye_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    service.delete_photo(db, photo_id, user_id=admin.id)
    return ok({"deleted": True, "id": photo_id})
