"""Scoring — LLM-judge post-session (kontrak §3A).

Fase 3: `LlmJudgeEvaluator` membandingkan transcript vs checklist Bagian A
(isolasi per-kasus). Tanpa provider LLM (env LLM_*), laporan ber-bentuk
valid bernilai 0 + ditandai (StubLlmClient). Scoring tak boleh
menggagalkan sesi (fallback bentuk valid).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.auth.models import User
from app.domains.sessions.models import SessionRow, SessionTurn
from app.rag.evaluator import evaluate as judge_evaluate
from app.shared.dependencies import get_current_user
from app.shared.envelope import ok
from app.shared.ratelimit import rate_limit

router = APIRouter(
    prefix="/api/scoring",
    tags=["scoring"],
    dependencies=[Depends(rate_limit("ai", "rate_limit_ai"))],
)


class EvaluateRequest(BaseModel):
    session_id: str
    ddx: dict | None = None             # §3A v0.12.0 (opsional)
    management_plan: dict | None = None  # §3A v0.12.0 (opsional)


@router.post("/evaluate")
def evaluate(
    req: EvaluateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.get(SessionRow, req.session_id)
    if s is None or s.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    turns = db.scalars(
        select(SessionTurn)
        .where(SessionTurn.session_id == s.id)
        .order_by(SessionTurn.turn_number)
    ).all()
    transcript = [{"role": t.role, "content": t.content} for t in turns]
    report = judge_evaluate(s.case_id, transcript, req.ddx, req.management_plan)
    s.total_score = report.get("totalScore", 0)
    s.report = report
    db.commit()
    return ok(report)
