"""ExamFindings sidecar loader — kontrak §5.9.

Baca `data-kasus/_exam/kasus-XX.json` (cermin presiden §5.7 `_disclosure/`).
TIDAK meng-edit 22 .md kanonik. Sidecar tak ada / rusak → **default aman**
(semua None) supaya endpoint tak pernah 500. Konten = draf (dokter validasi).
"""
from __future__ import annotations

import json
from pathlib import Path

from app.config import get_settings
from app.domains.exam.schemas import ExamFindings


def _exam_dir() -> Path:
    return Path(get_settings().cases_dir) / "_exam"


def load_findings(case_id: str) -> ExamFindings:
    """ExamFindings untuk case_id. Selalu mengembalikan objek valid."""
    safe = ExamFindings(caseId=case_id, draft=True, source="")
    sidecar = _exam_dir() / f"{case_id}.json"
    if not sidecar.exists():
        return safe
    try:
        raw = json.loads(sidecar.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return safe  # draf rusak → jangan jatuhkan endpoint (kontrak §5.9)
    if not isinstance(raw, dict):
        return safe
    raw["caseId"] = case_id  # nama file = otoritas identitas
    raw.setdefault("source", "sidecar")
    try:
        return ExamFindings.model_validate(raw)
    except ValueError:
        return safe


def has_sidecar(case_id: str) -> bool:
    return (_exam_dir() / f"{case_id}.json").exists()
