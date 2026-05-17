from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.cases.models import CaseRegistry
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
