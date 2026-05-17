"""LlmJudgeEvaluator (kontrak §3A) — scoring post-session, LLM-as-judge.

Bandingkan transcript vs checklist Bagian A (section "Temuan Klinis —
Anamnesis", isolasi per-kasus). Output = EvaluationReport §3A persis
(rubrik coverage 40 / FIFE 20 / redFlags 20 / communication 20).

StubLlmClient → laporan ber-bentuk valid + ditandai stub (nilai 0). LLM
nyata → judge JSON sungguhan. Kegagalan parse → fallback bentuk valid
(jangan lempar ke user; scoring tak boleh menggagalkan sesi).
"""
from __future__ import annotations

import json
import re

from app.config import get_settings
from app.rag.llm import get_llm_client, is_stub
from app.rag.retriever import load_case

_RUBRIC = {"coverage": 40, "fife": 20, "redFlags": 20, "communication": 20}


def _empty_report(note: str) -> dict:
    return {
        "totalScore": 0,
        "breakdown": {
            k: {"score": 0, "max": v, "detail": []} for k, v in _RUBRIC.items()
        },
        "missedItems": [],
        "positiveNotes": [],
        "_note": note,
    }


def _checklist(case_id: str) -> str:
    pc = load_case(case_id)
    for s in pc.bagian_a_sections:
        if "anamnesis" in s.name.lower():
            return s.text
    return pc.bagian_a_sections[3].text if len(pc.bagian_a_sections) > 3 else ""


def _judge_prompt(checklist: str, transcript: list[dict]) -> tuple[str, list[dict]]:
    convo = "\n".join(
        f"{'Dokter' if m.get('role') == 'user' else 'Pasien'}: "
        f"{m.get('content', m.get('text', ''))}"
        for m in transcript
        if m.get("role") in ("user", "patient")
    )
    system = (
        "Kamu penilai OSCE anamnesis. Nilai performa dokter (mahasiswa) "
        "berdasarkan checklist Bagian A dan log percakapan. Rubrik: "
        "coverage 0-40, fife 0-20, redFlags 0-20, communication 0-20. "
        "Balas HANYA JSON valid sesuai skema EvaluationReport: keys "
        "totalScore, breakdown{coverage,fife,redFlags,communication "
        "masing-masing {score,max,detail[]}}, missedItems[], positiveNotes[]."
    )
    user = [{"role": "user", "content": f"CHECKLIST:\n{checklist}\n\nLOG:\n{convo}"}]
    return system, user


def evaluate(case_id: str, transcript: list[dict]) -> dict:
    if is_stub():
        return _empty_report("Fase 3: LLM-judge butuh provider nyata (env LLM_*). "
                             "Bentuk laporan valid; nilai 0 (stub).")
    try:
        system, user = _judge_prompt(_checklist(case_id), transcript)
        # Judge pakai model murah terpisah (rag-plan §9.1).
        raw = get_llm_client().generate(
            system, user, model=get_settings().llm_judge_model
        )
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        report = json.loads(m.group(0) if m else raw)
        # Normalisasi bentuk minimal (jaga kontrak §3A).
        report.setdefault("breakdown", {})
        for k, mx in _RUBRIC.items():
            b = report["breakdown"].setdefault(k, {})
            b.setdefault("score", 0)
            b["max"] = mx
            b.setdefault("detail", [])
        report.setdefault("missedItems", [])
        report.setdefault("positiveNotes", [])
        report["totalScore"] = sum(
            report["breakdown"][k]["score"] for k in _RUBRIC
        )
        return report
    except Exception as e:  # scoring tak boleh menggagalkan sesi
        return _empty_report(f"judge gagal di-parse, fallback bentuk valid: {e}")
