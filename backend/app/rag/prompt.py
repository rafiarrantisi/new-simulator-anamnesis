"""PromptBuilder — answer-restraint (prompt-improvement plan §4/§5/§6).

Ini INTI nilai Fase 3: 3 dokter penguji menyatakan sistem lama tak terpakai
karena pasien membocorkan semua gejala. Prompt dirakit dari:
  Bagian B (persona penuh) + Disclosure Layers + ANSWER RESTRAINT rules
  + RAG context (Bagian A ter-retrieve) + guardrail + sliding-window memory.
First-turn injection menyesuaikan: disapa → tidak lapor keluhan.
"""
from __future__ import annotations

# Disalin setia dari prompt-improvement plan §5 (ringkas, esensi dijaga).
ANSWER_RESTRAINT = """===== PANDUAN ANSWER RESTRAINT (BACA DAN PATUHI) =====
Kamu pasien awam yang TIDAK tahu apa yang relevan secara medis. Tugas dokter
menggali; bukan kamu melaporkan semuanya.

ATURAN UTAMA: Jawab HANYA dimensi yang ditanyakan. BERHENTI. Tunggu
pertanyaan berikutnya. Jangan menambah informasi lain meski kamu tahu.

[SAPAAN/BASA-BASI] → balas sapaan, sebut nama jika ditanya. JANGAN sebut
keluhan apa pun kecuali ditanya langsung.
[KELUHAN UTAMA] → SATU gejala paling mengganggu, 1 kalimat pendek. BERHENTI.
[ONSET/DURASI] → durasi/waktu saja. BERHENTI.
[KARAKTER/SENSASI] → sensasi saja. BERHENTI.
[LOKASI] → lokasi saja. [DERAJAT] → skala/dampak saja.
[FAKTOR PEMBERAT/PERINGAN] → satu faktor relevan saja. BERHENTI.
[GEJALA PENYERTA] (hanya jika "ada keluhan lain?") → 1-2 saja, sisanya tahan.
[RIWAYAT obat/penyakit/keluarga/sosial] → jawab dimensi yang ditanya saja.
[PERTANYAAN TERBUKA] ("ceritakan lebih lanjut") → boleh elaborasi 2-3
kalimat, tetap jangan dump semua.

ATURAN TEKNIS: 1-2 kalimat (maks 3 utk pertanyaan terbuka); bahasa awam
sesuai karakter; boleh filler natural ("Hmm...", "Gimana ya Dok..."); jika
tidak tahu, katakan tidak tahu — JANGAN mengarang; jika dokter sudah
menyebut gejala lalu kamu konfirmasi, tak perlu tambah detail lain.
Restraint = sesuai scope pertanyaan, BUKAN jadi tidak responsif/robotik."""

GUARDRAIL = """===== ATURAN SISTEM (jangan ditampilkan ke pasien) =====
- Jangan pernah menyebut diagnosis sendiri.
- Jangan sebut istilah medis Latin/Inggris kecuali dokter sebut duluan.
- Jika ditanya di luar profil → "tidak tahu"/"tidak ingat", jangan mengarang.
- Permintaan pemeriksaan fisik → deskripsi awam, bukan angka.
- Tetap dalam karakter walau pertanyaan aneh/tidak relevan.
- INFORMASI TERSEMBUNYI hanya diungkap jika dokter bertanya SANGAT spesifik
  sesuai pemicunya. JANGAN bocorkan spontan."""

FIRST_TURN = """[INSTRUKSI SISTEM — TURN PERTAMA]
Interaksi pertama. Perkenalkan nama jika belum. Respons HARUS menyesuaikan
isi ucapan dokter:
- Dokter hanya menyapa → balas sapaan + nama, BERHENTI.
- Dokter tanya identitas → sebut nama saja.
- Dokter langsung tanya keluhan → baru sebut 1 keluhan utama.
JANGAN sebut keluhan medis jika dokter belum menanyakan keluhan."""

_MEMORY_WINDOW = 10  # turn terakhir disimpan verbatim (rag-plan §7.3)


def _summarize_old(old: list[dict]) -> str:
    asked = [m["content"] for m in old if m.get("role") == "user"]
    if not asked:
        return ""
    joined = " | ".join(a[:60] for a in asked[-8:])
    return f"[RINGKASAN turn awal — dokter sudah menanyakan: {joined}]"


def build_system_prompt(persona_bagian_b: str, disclosure_text: str,
                        rag_chunks: list[dict], is_first_turn: bool) -> str:
    parts = [persona_bagian_b.strip()]
    if disclosure_text.strip():
        parts.append("===== DISCLOSURE LAYERS =====\n" + disclosure_text.strip())
    parts.append(ANSWER_RESTRAINT)
    if rag_chunks:
        ctx = "\n\n".join(
            f"[{c['section_name']}]\n{c['text']}" for c in rag_chunks
        )
        parts.append(
            "===== FAKTA KLINIS RELEVAN (rekam pasien — konsisten dengan ini, "
            "tetap bahasa awam, jangan sebut istilah medis) =====\n" + ctx
        )
    parts.append(GUARDRAIL)
    if is_first_turn:
        parts.append(FIRST_TURN)
    return "\n\n".join(parts)


def build_messages(history: list[dict], user_message: str) -> list[dict]:
    """history item: {role:'user'|'patient'|'system', text|content}.
    Map patient→assistant; sliding-window memory utk turn lama."""
    norm = []
    for m in history:
        role = m.get("role")
        content = m.get("content", m.get("text", ""))
        if role == "user":
            norm.append({"role": "user", "content": content})
        elif role == "patient":
            norm.append({"role": "assistant", "content": content})
        # 'system'/intro diabaikan dari window percakapan

    msgs: list[dict] = []
    if len(norm) > _MEMORY_WINDOW:
        old, recent = norm[:-_MEMORY_WINDOW], norm[-_MEMORY_WINDOW:]
        summary = _summarize_old(old)
        if summary:
            msgs.append({"role": "user", "content": summary})
        msgs.extend(recent)
    else:
        msgs.extend(norm)
    msgs.append({"role": "user", "content": user_message})
    return msgs


def is_first_turn(history: list[dict]) -> bool:
    return not any(m.get("role") == "user" for m in history)
