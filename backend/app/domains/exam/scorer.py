"""Deterministic exam scorer — kontrak §3B.2.

Nilai = akurasi temuan + adherence prosedur (plan §7.3). Deterministik &
explainable (bukan LLM) supaya testable. Hanya station yang ground-truth-nya
punya data ("applicable") yang masuk denominator — mahasiswa tak dihukum
untuk kasus yang memang tak punya temuan di station itu.
"""
from __future__ import annotations

import re

from app.domains.exam.schemas import (
    STATION_WEIGHTS,
    ExamFindings,
    ExamScoringReport,
    StationScore,
    StudentExamRecord,
)

# station → (field ExamFindings, daftar key komparabel)
_STATION_MAP: dict[str, tuple[str, list[str]]] = {
    "visual_acuity": ("visual_acuity", ["od", "os", "pinhole_od", "pinhole_os", "near_od", "near_os"]),
    "pupils_rapd": ("pupils", ["od_size", "os_size", "od_react", "os_react", "rapd"]),
    "ocular_motility": ("motility", ["full", "notes"]),
    "visual_field": ("visual_field", ["od", "os", "defect_pattern"]),
    "slit_lamp": ("slit_lamp", ["lids", "conjunctiva", "cornea", "anterior_chamber", "iris", "lens"]),
    "tonometry": ("tonometry", ["iop_od", "iop_os"]),
    "fundoscopy": ("fundus", ["disc_od", "disc_os", "cdr_od", "cdr_os", "macula_od", "macula_os", "vessels", "periphery"]),
}

_VA_SCALE = ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60", "3/60", "1/60", "cf", "hm", "pl", "npl"]

# Station KONDISIONAL (kontrak §3B.2 = plan §7.3 "bonus/conditional").
# Dilaporkan terpisah, TIDAK mengubah examTotalScore (komposisi tetap = 7
# weighted; cegah contract drift). max informatif.
_COND_MAX = 10.0
_COND_MAP: dict[str, tuple[str, list[str]]] = {
    "amsler": ("amsler", ["od", "os"]),
    "color_vision": ("color_vision", ["od_correct", "os_correct", "type"]),
    "fluorescein": ("fluorescein", ["pattern", "location", "seidel"]),
}


def _norm(v) -> str:
    return re.sub(r"[^a-z0-9/]+", " ", str(v).lower()).strip()


def _toks(v) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", str(v).lower()) if t}


def _num(v):
    m = re.search(r"-?\d+(?:\.\d+)?", str(v))
    return float(m.group()) if m else None


def _va_idx(v: str) -> int | None:
    n = _norm(v)
    for i, s in enumerate(_VA_SCALE):
        if s in n:
            return i
    return None


def _match(key: str, truth, student) -> float:
    """Skor kecocokan [0..1] satu field (deterministik)."""
    if student is None or str(student).strip() == "":
        return 0.0
    if (
        key.startswith("iop")
        or key.startswith("cdr")
        or key.endswith("_size")
        or key.endswith("_correct")
    ):
        a, b = _num(truth), _num(student)
        if a is None or b is None:
            return 0.0
        if key.startswith("iop"):
            tol = 3.0
        elif key.startswith("cdr"):
            tol = 0.15
        elif key.endswith("_correct"):
            tol = 1.0  # plate Ishihara: toleransi ±1
        else:
            tol = 1.0
        return 1.0 if abs(a - b) <= tol else 0.0
    if key in ("od", "os", "pinhole_od", "pinhole_os") and _va_idx(truth) is not None:
        ti, si = _va_idx(truth), _va_idx(student)
        return 1.0 if (si is not None and abs(ti - si) <= 1) else 0.0
    if isinstance(truth, bool):
        return 1.0 if _norm(truth) == _norm(student) else 0.0
    tt, st = _toks(truth), _toks(student)
    if not tt:
        return 1.0 if not st else 0.5
    overlap = len(tt & st) / len(tt)
    return 1.0 if overlap >= 0.6 else round(overlap, 3)


_TESTED_EYE_RE = re.compile(r"(?:periksa|test|baca|read|examine|nilai)\s+(od|os)")


def _tested_eye_seq(steps: list[str]) -> list[str]:
    """Urutan mata yang DIPERIKSA per langkah. Verb-anchored supaya frasa
    'Tutup OS, periksa OD' terbaca OD (bukan OS dari kata 'tutup')."""
    seq: list[str] = []
    for s in steps:
        low = s.lower()
        m = _TESTED_EYE_RE.search(low)
        if m:
            seq.append(m.group(1))
            continue
        t = re.search(r"\b(od|os)\b", low)  # fallback: token mata pertama
        if t:
            seq.append(t.group(1))
    return seq


def _proc_factor(station: str, steps: list[str]) -> tuple[float, str | None]:
    """Adherence prosedur (plan §7.3). Tanpa langkah → 1.0 (jangan hukum)."""
    if not steps:
        return 1.0, None
    if station == "visual_acuity":
        seq = _tested_eye_seq(steps)
        if "od" in seq and "os" in seq and seq.index("od") > seq.index("os"):
            return 0.7, "Visual acuity: OD harus diperiksa sebelum OS"
    if station == "pupils_rapd":
        joined = " ".join(s.lower() for s in steps)
        if not re.search(r"gelap|dim|semi|redup", joined):
            return 0.85, "Pupil/RAPD: lakukan di ruang semi-gelap"
    return 1.0, None


def _score_conditional(
    gt: ExamFindings,
    rec: StudentExamRecord,
    stations: dict[str, StationScore],
    missed: list[str],
    positive: list[str],
) -> None:
    """Station kondisional (amsler/ishihara/fluorescein). Dilaporkan tapi
    TIDAK mengubah examTotalScore (kontrak §3B.2 — bonus/conditional)."""
    for station, (field, keys) in _COND_MAP.items():
        gobj = getattr(gt, field, None)
        truth = {k: getattr(gobj, k, None) for k in keys} if gobj else {}
        cmp_keys = [k for k in keys if truth.get(k) is not None]
        if not cmp_keys:
            continue
        srec = rec.stations.get(station)
        s_recorded = srec.recorded if srec else {}
        detail: list = []
        acc_sum = 0.0
        for k in cmp_keys:
            m = _match(k, truth[k], s_recorded.get(k))
            acc_sum += m
            detail.append({"key": k, "truth": truth[k], "student": s_recorded.get(k), "match": m})
            if m == 0.0:
                missed.append(f"{station}.{k}: {truth[k]}")
        acc = acc_sum / len(cmp_keys)
        stations[station] = StationScore(
            score=round(_COND_MAX * acc, 2), max=_COND_MAX, detail=detail
        )
        if acc >= 0.8:
            positive.append(f"{station} (kondisional): akurat ({round(acc * 100)}%)")


def score_exam(gt: ExamFindings, rec: StudentExamRecord) -> ExamScoringReport:
    stations: dict[str, StationScore] = {}
    missed: list[str] = []
    proc_notes: list[str] = []
    positive: list[str] = []
    applicable_w = 0.0
    achieved = 0.0

    for station, weight in STATION_WEIGHTS.items():
        field, keys = _STATION_MAP[station]
        gobj = getattr(gt, field, None)
        truth = {k: getattr(gobj, k, None) for k in keys} if gobj else {}
        cmp_keys = [k for k in keys if truth.get(k) is not None]
        if not cmp_keys:
            continue  # station tak punya ground truth → di luar denominator
        applicable_w += weight
        srec = rec.stations.get(station)
        s_recorded = srec.recorded if srec else {}
        s_steps = srec.procedureSteps if srec else []

        detail: list = []
        acc_sum = 0.0
        for k in cmp_keys:
            m = _match(k, truth[k], s_recorded.get(k))
            acc_sum += m
            detail.append({"key": k, "truth": truth[k], "student": s_recorded.get(k), "match": m})
            if m == 0.0:
                missed.append(f"{station}.{k}: {truth[k]}")
        acc = acc_sum / len(cmp_keys)

        pf, note = _proc_factor(station, s_steps)
        if note:
            proc_notes.append(note)
        sc = round(weight * acc * pf, 2)
        achieved += sc
        stations[station] = StationScore(score=sc, max=float(weight), detail=detail)
        if acc >= 0.8:
            positive.append(f"{station}: temuan akurat ({round(acc * 100)}%)")

    # Kondisional selalu dinilai (tak ubah examTotalScore).
    _score_conditional(gt, rec, stations, missed, positive)

    if applicable_w == 0.0:
        proc_notes.append(
            "ExamFindings weighted belum tersedia (sidecar draf) — "
            "examTotalScore 0; menunggu konten + validasi dokter (kontrak §5.9)"
        )
        return ExamScoringReport(
            examTotalScore=0.0,
            stations=stations,
            missedFindings=missed,
            procedureNotes=proc_notes,
            positiveNotes=positive,
        )

    total = round(100.0 * achieved / applicable_w, 1)
    return ExamScoringReport(
        examTotalScore=total,
        stations=stations,
        missedFindings=missed,
        procedureNotes=proc_notes,
        positiveNotes=positive,
    )
