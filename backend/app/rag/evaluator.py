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
        "summary": "",
        "_note": note,
    }


def _plan_block(ddx: dict | None, plan: dict | None) -> str:
    """Ringkas DDx + Rencana Tatalaksana mahasiswa utk konteks judge."""
    out = []
    if ddx and not ddx.get("skipped"):
        dx = ", ".join(
            x for x in (ddx.get("dx1"), ddx.get("dx2"), ddx.get("dx3")) if x
        )
        if dx:
            out.append(f"DIAGNOSIS BANDING MAHASISWA: {dx}")
        if ddx.get("reasoning"):
            out.append(f"ALASAN KLINIS: {ddx['reasoning']}")
    if plan and not plan.get("skipped"):
        if plan.get("penunjang"):
            out.append(f"USULAN PEMERIKSAAN PENUNJANG: {plan['penunjang']}")
        if plan.get("terapi"):
            out.append(f"USULAN TATALAKSANA/TERAPI: {plan['terapi']}")
        if plan.get("edukasi"):
            out.append(f"EDUKASI/RUJUKAN: {plan['edukasi']}")
    return "\n".join(out)


def _checklist(case_id: str) -> str:
    pc = load_case(case_id)
    for s in pc.bagian_a_sections:
        if "anamnesis" in s.name.lower():
            return s.text
    return pc.bagian_a_sections[3].text if len(pc.bagian_a_sections) > 3 else ""


def _judge_prompt(
    checklist: str,
    transcript: list[dict],
    ddx: dict | None = None,
    plan: dict | None = None,
) -> tuple[str, list[dict]]:
    convo = "\n".join(
        f"{'Dokter' if m.get('role') == 'user' else 'Pasien'}: "
        f"{m.get('content', m.get('text', ''))}"
        for m in transcript
        if m.get("role") in ("user", "patient")
    )
    system = (
        "Kamu penilai OSCE anamnesis. Nilai performa dokter (mahasiswa) "
        "berdasarkan checklist Bagian A dan log percakapan. Pertimbangkan "
        "juga ketepatan diagnosis banding & rencana tatalaksana mahasiswa "
        "(bila disertakan) dalam menilai penalaran klinis. Rubrik: "
        "coverage 0-40, fife 0-20, redFlags 0-20, communication 0-20. "
        "Balas HANYA JSON valid sesuai skema EvaluationReport: keys "
        "totalScore, breakdown{coverage,fife,redFlags,communication "
        "masing-masing {score,max,detail[]}}, missedItems[] (apa yang "
        "kurang/terlewat, bahasa Indonesia), positiveNotes[] (apa yang "
        "sudah baik), summary (2-4 kalimat bahasa Indonesia: apa yang "
        "dilakukan mahasiswa, apa yang sudah bagus, apa yang kurang & "
        "saran perbaikan — termasuk komentar atas DDx & tatalaksana)."
    )
    extra = _plan_block(ddx, plan)
    content = f"CHECKLIST:\n{checklist}\n\nLOG:\n{convo}"
    if extra:
        content += f"\n\nKEPUTUSAN KLINIS MAHASISWA:\n{extra}"
    return system, [{"role": "user", "content": content}]


def evaluate(
    case_id: str,
    transcript: list[dict],
    ddx: dict | None = None,
    management_plan: dict | None = None,
) -> dict:
    if is_stub():
        return _empty_report("Fase 3: LLM-judge butuh provider nyata (env LLM_*). "
                             "Bentuk laporan valid; nilai 0 (stub).")
    try:
        system, user = _judge_prompt(
            _checklist(case_id), transcript, ddx, management_plan
        )
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
        report.setdefault("summary", "")
        report["totalScore"] = sum(
            report["breakdown"][k]["score"] for k in _RUBRIC
        )
        return report
    except Exception as e:  # scoring tak boleh menggagalkan sesi
        return _empty_report(f"judge gagal di-parse, fallback bentuk valid: {e}")
