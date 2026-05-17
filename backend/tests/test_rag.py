"""Fase 3 — RAG pipeline + answer-restraint (verifiable tanpa LLM key/Qdrant)."""
from pathlib import Path

from app.config import get_settings
from app.rag import prompt as P
from app.rag.engine import respond as rag_respond
from app.rag.evaluator import evaluate as judge_evaluate
from app.rag.retriever import retrieve
from pipeline.parser import parse_file

CASES = Path(get_settings().cases_dir)


# ── Disclosure sidecar ──
def test_kasus02_disclosure_via_sidecar():
    pc = parse_file(CASES / "kasus-02-konjungtivitis-viral.md")
    assert pc.has_disclosure_layers is True
    assert pc.disclosure_source == "sidecar"
    assert "Volunteer" in pc.disclosure_text
    assert "Pak Budi" in pc.disclosure_text  # hidden clue ada di layer


def test_case_without_sidecar_flagged_false():
    # kasus-03 belum punya sidecar (6 yg sudah didraf: 01,02,09,10,16,17).
    pc = parse_file(CASES / "kasus-03-abrasi-kornea-traumatik.md")
    assert pc.has_disclosure_layers is False
    assert pc.disclosure_source == ""


# ── Retrieval + isolasi per-kasus ──
def test_bm25_retrieve_relevant_section():
    hits = retrieve("kasus-02", "discharge sekret mata berair", k=3)
    assert hits, "retrieval kosong utk query klinis relevan"
    assert all(h["case_id"] == "kasus-02" for h in hits)  # isolasi keras


def test_per_case_isolation():
    # Query khas kasus-02 dijalankan pada kasus-01 → hanya konten kasus-01.
    hits = retrieve("kasus-01", "konjungtivitis viral folikel", k=3)
    assert all(h["case_id"] == "kasus-01" for h in hits)


# ── PromptBuilder: answer-restraint, first-turn, disclosure, guardrail ──
def test_system_prompt_contains_restraint_and_guardrail():
    pc = parse_file(CASES / "kasus-02-konjungtivitis-viral.md")
    sp = P.build_system_prompt(pc.bagian_b_text, pc.disclosure_text, [], False)
    assert "ANSWER RESTRAINT" in sp and "BERHENTI" in sp
    assert "DISCLOSURE LAYERS" in sp
    assert "ATURAN SISTEM" in sp  # guardrail
    assert "TURN PERTAMA" not in sp  # bukan first turn


def test_first_turn_injection_only_on_first():
    pc = parse_file(CASES / "kasus-02-konjungtivitis-viral.md")
    sp_first = P.build_system_prompt(pc.bagian_b_text, pc.disclosure_text, [], True)
    assert "TURN PERTAMA" in sp_first
    assert P.is_first_turn([]) is True
    assert P.is_first_turn([{"role": "user", "content": "hai"}]) is False


def test_sliding_window_memory_summarizes_old():
    hist = [{"role": "user", "content": f"tanya {i}"} for i in range(15)]
    msgs = P.build_messages(hist, "pertanyaan baru")
    assert msgs[0]["content"].startswith("[RINGKASAN")
    assert msgs[-1]["content"] == "pertanyaan baru"
    assert len(msgs) <= P._MEMORY_WINDOW + 2


def test_roles_mapped_patient_to_assistant():
    msgs = P.build_messages(
        [{"role": "user", "content": "q"}, {"role": "patient", "content": "a"}], "q2"
    )
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"


# ── Engine (StubLLM) + Evaluator shape ──
def test_engine_responds_nonempty():
    # Berlaku utk StubLlmClient maupun provider nyata (kontrak §3).
    reply = rag_respond("kasus-02", [], "Selamat pagi")
    assert isinstance(reply, str) and reply.strip()


def test_evaluator_report_shape_contract_3A():
    r = judge_evaluate("kasus-02", [
        {"role": "user", "content": "Sudah berapa lama matanya merah?"},
        {"role": "patient", "content": "4 hari Dok."},
    ])
    assert r["breakdown"]["coverage"]["max"] == 40
    assert r["breakdown"]["fife"]["max"] == 20
    assert r["breakdown"]["redFlags"]["max"] == 20
    assert r["breakdown"]["communication"]["max"] == 20
    assert isinstance(r["missedItems"], list)
    assert isinstance(r["positiveNotes"], list)
    # Bentuk kontrak §3A; nilai 0 (stub) atau 0..100 (judge nyata).
    assert isinstance(r["totalScore"], int) and 0 <= r["totalScore"] <= 100
