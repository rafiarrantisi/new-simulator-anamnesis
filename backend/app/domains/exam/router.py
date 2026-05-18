"""Exam endpoints — kontrak §6 + §3B. Semua **session-gated**.

Ground truth tak pernah ke client kecuali lewat sesi yang dimiliki user
(anti-cheat by inspection, plan §6.1/§7.2). Skor dihitung **server-side**
(deterministik, `scorer.py`) — UI tak pernah menilai sendiri.

Catatan kontrak: gate lebih dalam (anamnesis-selesai, drip per-station,
progressive-disclosure plan §4.3) = increment terjadwal (§5.9 / §9 K6),
bukan utang tersembunyi.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.domains.exam.loader import load_findings
from app.domains.exam.models import ExamRecordRow
from app.domains.exam.scorer import score_exam
from app.domains.exam.schemas import ExamScoringReport, StudentExamRecord
from app.domains.sessions.models import SessionRow
from app.shared.dependencies import get_current_user
from app.shared.envelope import ok

router = APIRouter(prefix="/api/sessions", tags=["exam"])


def _owned(db: Session, session_id: str, user: User) -> SessionRow:
    s = db.get(SessionRow, session_id)
    if s is None or s.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return s


@router.get("/{session_id}/exam-findings")
def get_exam_findings(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _owned(db, session_id, user)
    findings = load_findings(s.case_id)
    return ok(findings.model_dump())


@router.post("/{session_id}/exam")
def submit_exam(
    session_id: str,
    record: StudentExamRecord,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _owned(db, session_id, user)
    gt = load_findings(s.case_id)
    report: ExamScoringReport = score_exam(gt, record)

    row = db.get(ExamRecordRow, session_id)
    if row is None:
        row = ExamRecordRow(session_id=session_id, case_id=s.case_id)
        db.add(row)
    row.case_id = s.case_id
    row.record = record.model_dump()
    row.report = report.model_dump()
    row.exam_score = report.examTotalScore
    db.commit()
    return ok(report.model_dump())


@router.get("/{session_id}/exam-report")
def get_exam_report(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _owned(db, session_id, user)
    row = db.get(ExamRecordRow, session_id)
    if row is None or row.report is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Exam belum disubmit untuk sesi ini"
        )
    return ok(row.report)
