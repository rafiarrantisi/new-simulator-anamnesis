"""Upsert ParsedCase → Case Registry (DB). rag-plan §6 / kontrak §5.6."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.domains.cases.models import CaseRegistry
from pipeline.parser import ParsedCase


def upsert_case(db: Session, pc: ParsedCase, *, embedded: bool, chunk_count: int) -> CaseRegistry:
    row = db.get(CaseRegistry, pc.case_id)
    now = datetime.now(timezone.utc)
    if row is None:
        row = CaseRegistry(case_id=pc.case_id)
        db.add(row)
    row.filename = pc.filename
    row.title_id = pc.title_id
    row.title_en = pc.title_en
    row.icd10 = pc.icd10
    row.skdi = pc.skdi
    row.organ_system = "Mata"  # korpus ini oftalmologi; tagging lain = Fase 3+
    row.tags = []
    row.references = pc.references
    row.collection_name = pc.collection_name
    row.chunk_count = chunk_count
    row.bagian_b_chars = pc.bagian_b_chars
    row.has_disclosure_layers = pc.has_disclosure_layers
    row.is_active = True
    row.updated_at = now
    if embedded:
        row.ingested_at = now
    return row
