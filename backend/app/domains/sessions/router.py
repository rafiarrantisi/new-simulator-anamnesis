import jwt
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.domains.auth.models import User
from app.domains.sessions.models import SessionRow, SessionTurn
from app.rag.engine import respond as rag_respond
from app.rag.engine import stream_respond as rag_stream
from app.domains.sessions.schemas import PatchSessionRequest, StartSessionRequest, TurnRequest
from app.shared.dependencies import get_current_user
from app.shared.envelope import ok
from app.shared.security import decode_token

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _owned(db: Session, session_id: str, user: User) -> SessionRow:
    s = db.get(SessionRow, session_id)
    if s is None or s.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return s


def _next_turn_no(db: Session, session_id: str) -> int:
    n = db.scalar(
        select(func.count(SessionTurn.id)).where(SessionTurn.session_id == session_id)
    )
    return int(n or 0) + 1


def _history(db: Session, session_id: str) -> list[dict]:
    rows = db.scalars(
        select(SessionTurn)
        .where(SessionTurn.session_id == session_id)
        .order_by(SessionTurn.turn_number)
    ).all()
    return [{"role": r.role, "content": r.content} for r in rows]


@router.post("")
def start_session(
    req: StartSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = SessionRow(
        user_id=user.id,
        institution_id=user.institution_id,
        case_id=req.case_id,
        mode=req.mode,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return ok({"sessionId": s.id, "caseId": s.case_id, "mode": s.mode, "status": s.status})


@router.get("/{session_id}")
def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _owned(db, session_id, user)
    turns = db.scalars(
        select(SessionTurn)
        .where(SessionTurn.session_id == session_id)
        .order_by(SessionTurn.turn_number)
    ).all()
    return ok({
        "sessionId": s.id, "caseId": s.case_id, "mode": s.mode, "status": s.status,
        "messages": [{"role": t.role, "text": t.content} for t in turns],
        "totalScore": s.total_score, "report": s.report,
    })


@router.patch("/{session_id}")
def patch_session(
    session_id: str,
    req: PatchSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _owned(db, session_id, user)
    s.status = req.status
    if req.status == "completed" and s.ended_at is None:
        from datetime import datetime, timezone
        s.ended_at = datetime.now(timezone.utc)
        user.profile.total_sessions += 1
    db.commit()
    return ok({"sessionId": s.id, "status": s.status})


@router.post("/{session_id}/turns")
def post_turn(
    session_id: str,
    req: TurnRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """REST fallback non-stream (kontrak §6). Balasan = RagPatientEngine."""
    s = _owned(db, session_id, user)
    history = _history(db, session_id)
    n = _next_turn_no(db, session_id)
    db.add(SessionTurn(session_id=s.id, turn_number=n, role="user", content=req.text))
    try:
        reply = rag_respond(s.case_id, history, req.text)
    except FileNotFoundError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Korpus kasus '{s.case_id}' belum ter-ingest",
        )
    db.add(SessionTurn(session_id=s.id, turn_number=n + 1, role="patient", content=reply))
    db.commit()
    return ok({"reply": reply, "detectedDomain": None, "audioUrl": None})


@router.websocket("/{session_id}/ws")
async def session_ws(websocket: WebSocket, session_id: str):
    """Chat streaming (kontrak §6 protokol). Auth via ?token= query.
    Fase 2: stream balasan STUB; Fase 3 diganti RagPatientEngine."""
    await websocket.accept()
    token = websocket.query_params.get("token", "")
    try:
        claims = decode_token(token)
        if claims.get("type") != "access":
            raise jwt.PyJWTError()
    except jwt.PyJWTError:
        await websocket.close(code=4401)
        return

    db = SessionLocal()
    try:
        s = db.get(SessionRow, session_id)
        if s is None or s.user_id != claims.get("sub"):
            await websocket.close(code=4404)
            return
        while True:
            data = await websocket.receive_json()
            if data.get("type") != "text":
                await websocket.send_json({"type": "error", "message": "unsupported type"})
                continue
            history = _history(db, session_id)
            n = _next_turn_no(db, session_id)
            db.add(SessionTurn(session_id=s.id, turn_number=n, role="user", content=data["text"]))
            try:
                reply = ""
                for chunk in rag_stream(s.case_id, history, data["text"]):
                    reply += chunk
                    await websocket.send_json({"type": "chunk", "text": chunk})
            except FileNotFoundError:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Korpus kasus '{s.case_id}' belum ter-ingest",
                })
                continue
            db.add(SessionTurn(session_id=s.id, turn_number=n + 1, role="patient", content=reply))
            db.commit()
            await websocket.send_json({"type": "turn_complete"})
    except WebSocketDisconnect:
        db.commit()
    finally:
        db.close()
