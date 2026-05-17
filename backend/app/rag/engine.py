"""RagPatientEngine (kontrak §3) — server-side dari PatientEngine.

Alur 1 turn (rag-plan §7.2): load kasus → retrieve Bagian A (BM25, isolasi
per-kasus) → rakit system prompt (persona + disclosure + answer-restraint +
RAG ctx + guardrail + first-turn) → LLM (stream). Persona Bagian B &
Disclosure TIDAK pernah keluar ke client (kontrak §5.6/§8.5).
"""
from __future__ import annotations

from collections.abc import Iterator

from app.rag.llm import get_llm_client
from app.rag.prompt import build_messages, build_system_prompt, is_first_turn
from app.rag.retriever import load_case, retrieve


def _prepare(case_id: str, history: list[dict], user_message: str):
    pc = load_case(case_id)  # raises FileNotFoundError jika kasus tak ada
    chunks = retrieve(case_id, user_message, k=3)
    system = build_system_prompt(
        persona_bagian_b=pc.bagian_b_text,
        disclosure_text=pc.disclosure_text,
        rag_chunks=chunks,
        is_first_turn=is_first_turn(history),
    )
    messages = build_messages(history, user_message)
    return system, messages, chunks


def respond(case_id: str, history: list[dict], user_message: str) -> str:
    system, messages, _ = _prepare(case_id, history, user_message)
    return get_llm_client().generate(system, messages).strip()


def stream_respond(
    case_id: str, history: list[dict], user_message: str
) -> Iterator[str]:
    system, messages, _ = _prepare(case_id, history, user_message)
    yield from get_llm_client().stream(system, messages)
