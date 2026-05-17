"""QA harness — answer-restraint pra-skrining (prompt-plan §10), kasus-02.

PENTING: ini PRA-SKRINING otomatis cepat, BUKAN pengganti gate Fase 3.
Gate resmi tetap **validasi 3 dokter** (kontrak §7). Output non-deterministik
(LLM) → cek heuristik toleran; status REVIEW = perlu mata manusia.

Jalankan:  python -m qa.restraint_qa     (butuh env LLM_* nyata)
Tanpa key (StubLLM) → harness skip (hasil tak bermakna).
"""
from __future__ import annotations

import re

from app.rag.engine import respond
from app.rag.llm import is_stub

CASE = "kasus-02"

_COMPLAINT = ["merah", "gatal", "berair", "lengket", "4 hari", "empat hari"]
_HIDDEN = ["pak budi", "budi", "kiri dulu", "kiri duluan", "kucek", "ngucek"]
_JARGON = ["konjungtivitis", "folikel", "adenovirus", "limfadenopati",
           "viral conjunctivitis", "injeksi konjungtiva"]


def _sentences(t: str) -> int:
    return len([s for s in re.split(r"[.!?\n]+", t) if s.strip()])


def _has(t: str, words) -> bool:
    low = t.lower()
    return any(w in low for w in words)


def _scenario(label, history, question, check):
    try:
        reply = respond(CASE, history, question)
    except Exception as e:  # noqa: BLE001 - 1 skenario gagal jangan abort semua
        return {"id": label, "q": question, "reply": "",
                "status": "ERROR", "note": f"{type(e).__name__}: {str(e)[:160]}"}
    status, note = check(reply)
    return {"id": label, "q": question, "reply": reply,
            "status": status, "note": note}


def _checks():
    P, F, R = "PASS", "FAIL", "REVIEW"

    def a1(r):  # sapaan → tak ada keluhan
        return (F, "menyebut keluhan saat hanya disapa") if _has(r, _COMPLAINT) \
            else (P, "tidak melapor keluhan")

    def a2(r):  # identitas → nama, bukan keluhan
        ok = "rizky" in r.lower()
        if _has(r, _COMPLAINT):
            return F, "lapor keluhan saat ditanya identitas"
        return (P if ok else R), ("sebut nama" if ok else "nama tak jelas")

    def a3(r):  # keluhan utama → 1 gejala, tidak dump
        dump = sum(_has(r, [w]) for w in _COMPLAINT) >= 3 or _sentences(r) > 3
        return (F, "dump multi-gejala") if dump else (P, "ringkas, 1 keluhan")

    def a4(r):  # onset → durasi saja
        if _sentences(r) > 3:
            return F, "kaskade (terlalu panjang)"
        return (P, "ringkas") if _has(r, ["hari", "minggu"]) else (R, "durasi tak jelas")

    def a5(r):
        return (P if _sentences(r) <= 3 else F), "sensasi singkat" \
            if _sentences(r) <= 3 else "terlalu panjang"

    def a7(r):  # terbuka → elaborasi 2-3 kalimat DIBOLEHKAN (prompt-plan §5)
        # FAIL hanya jika dump sungguhan: bocor hidden clue, atau lompat ke
        # domain tak diminta (keluarga/istri/sosial) spontan, atau sangat
        # panjang. Elaborasi wajar = REVIEW (gate dokter yang putuskan).
        if _has(r, _HIDDEN):
            return F, "elaborasi membocorkan hidden clue"
        if _has(r, ["istri", "hamil", "murid", "sekolah"]) or _sentences(r) > 6:
            return F, "dump lintas-domain / terlalu panjang"
        return R, "elaborasi wajar — kualitas dinilai dokter"

    def hidden(r):  # tak bocor spontan
        return (F, "hidden clue bocor spontan") if _has(r, _HIDDEN) \
            else (P, "hidden clue tetap tersembunyi")

    def reveal(r):  # ditanya spesifik → boleh ungkap kontak
        return (P, "mengungkap kontak") if _has(r, ["budi", "teman", "sekolah", "guru"]) \
            else (R, "kontak belum terungkap — cek manual")

    def jargon(r):
        return (F, "pakai istilah medis duluan") if _has(r, _JARGON) \
            else (P, "bahasa awam")

    return {
        "A1 sapaan": ([], "Selamat pagi, silakan duduk.", a1),
        "A2 identitas": ([], "Halo, dengan Bapak siapa ini?", a2),
        "A3 keluhan": ([], "Ada keluhan apa yang membuat Bapak datang?", a3),
        "A4 onset": ([{"role": "user", "content": "Ada keluhan apa?"},
                      {"role": "patient", "content": "Mata saya merah, Dok."}],
                     "Sudah berapa lama matanya merah?", a4),
        "A5 karakter": ([], "Rasanya seperti apa di matanya?", a5),
        "A7 terbuka": ([], "Bisa Bapak ceritakan lebih detail keluhannya?", a7),
        "B1 hidden": ([], "Ada keluhan apa hari ini?", hidden),
        "B2 hidden(sapa)": ([], "Selamat pagi.", hidden),
        "B3 reveal": ([{"role": "user", "content": "Ada keluhan apa?"},
                       {"role": "patient", "content": "Mata merah Dok."}],
                      "Kira-kira dari mana bisa kena? Ada kontak orang sakit mata?",
                      reveal),
        "C1 jargon": ([], "Ada keluhan apa?", jargon),
    }


def run() -> list[dict]:
    return [_scenario(lbl, h, q, c) for lbl, (h, q, c) in _checks().items()]


def main() -> int:
    print("=" * 70)
    print("QA Answer-Restraint — PRA-SKRINING (prompt-plan §10) · kasus-02")
    print("Bukan pengganti gate 3-dokter (kontrak §7). REVIEW = perlu manusia.")
    print("=" * 70)
    if is_stub():
        print("\n⚠ StubLlmClient aktif (LLM_API_KEY kosong). Harness butuh LLM "
              "nyata — hasil heuristik tak bermakna dengan stub. Skip.\n"
              "Set LLM_PROVIDER/LLM_API_KEY di backend/.env lalu ulangi.")
        return 0
    results = run()
    n = {"PASS": 0, "FAIL": 0, "REVIEW": 0, "ERROR": 0}
    for r in results:
        n[r["status"]] = n.get(r["status"], 0) + 1
        print(f"\n[{r['status']}] {r['id']} — {r['note']}")
        print(f"  Q: {r['q']}")
        print(f"  A: {r['reply'][:160]}")
    print("\n" + "-" * 70)
    print(f"PASS {n['PASS']} · FAIL {n['FAIL']} · REVIEW {n['REVIEW']} · "
          f"ERROR {n['ERROR']} / {len(results)}  → tetap perlu sign-off 3 dokter.")
    return 1 if n["FAIL"] else 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
