from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.domains.cases import service as case_svc
from app.domains.cases.models import CaseRegistry
from app.domains.eye_photos import service as photo_svc
from app.shared.dependencies import require_admin
from app.shared.envelope import ok

router = APIRouter(prefix="/api/cases", tags=["cases"])


def _summary(c: CaseRegistry) -> dict:
    # Bentuk CaseSummary persis kontrak §5.6 (tanpa Bagian B / persona).
    return {
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
    }


@router.get("")
def list_cases(
    db: Session = Depends(get_db),
    organ: str | None = None,
    skdi: str | None = None,
    difficulty: str | None = None,
    stage: str | None = None,
):
    q = select(CaseRegistry).where(CaseRegistry.is_active.is_(True))
    if organ:
        q = q.where(CaseRegistry.organ_system == organ)
    if skdi:
        q = q.where(CaseRegistry.skdi == skdi)
    if difficulty:
        q = q.where(CaseRegistry.difficulty == difficulty)
    if stage:
        q = q.where(CaseRegistry.stage == stage)
    rows = db.scalars(q.order_by(CaseRegistry.case_id)).all()
    return ok([_summary(c) for c in rows], meta={"total": len(rows), "page": 0, "limit": len(rows)})


@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    c = db.get(CaseRegistry, case_id)
    if c is None or not c.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")
    return ok(_summary(c))


# ── Admin (v0.15.0 Developer Dashboard) ────────────────────────────────────
# Path: /api/admin/cases* — pakai router terpisah utk hindari nested prefix.

admin_router = APIRouter(prefix="/api/admin/cases", tags=["admin-cases"])


class CaseMetadataIn(BaseModel):
    title_id: str | None = None
    title_en: str | None = None
    icd10: str | None = None
    skdi: str | None = None
    organ_system: str | None = None
    difficulty: str | None = None
    tags: list[str] | None = None
    references: list[str] | None = None
    stage: str | None = None
    case_type: str | None = None
    is_active: bool | None = None


class CaseCreateIn(BaseModel):
    case_id: str = Field(..., description="Pola 'kasus-XX' (mis. 'kasus-23')")
    slug: str = Field(..., description="a-z0-9- (mis. 'konjungtivitis-alergi')")
    content: str = Field(..., min_length=200, description="Raw markdown")
    metadata: CaseMetadataIn | None = None


class CaseUpdateIn(BaseModel):
    content: str | None = None
    slug: str | None = None
    metadata: CaseMetadataIn | None = None


@admin_router.get("")
def admin_list_cases(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rows = db.scalars(select(CaseRegistry.case_id)).all()
    counts = photo_svc.count_by_case(db, rows)
    data = case_svc.list_admin(db, photo_counts=counts)
    return ok(data, meta={"total": len(data), "page": 0, "limit": len(data)})


@admin_router.get("/{case_id}")
def admin_get_case(
    case_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return ok(case_svc.get_admin(db, case_id))


@admin_router.post("")
def admin_create_case(
    body: CaseCreateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    meta = body.metadata.model_dump(exclude_none=True) if body.metadata else None
    row = case_svc.create_case(
        db, case_id=body.case_id, slug=body.slug, content=body.content,
        metadata=meta, user_id=admin.id,
    )
    return ok(_summary(row))


@admin_router.patch("/{case_id}")
def admin_update_case(
    case_id: str,
    body: CaseUpdateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    meta = body.metadata.model_dump(exclude_none=True) if body.metadata else None
    row = case_svc.update_case(
        db, case_id, content=body.content, slug=body.slug,
        metadata=meta, user_id=admin.id,
    )
    return ok(_summary(row))


@admin_router.post("/{case_id}/ingest")
def admin_reingest_case(
    case_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    row = case_svc.reingest_case(db, case_id, user_id=admin.id)
    return ok(_summary(row))
