# HANDOFF — Onboarding Sesi Baru

> Baca **`docs/ARCHITECTURE.md`** (v0.9.0) DULU = kontrak & sumber kebenaran
> tunggal (data model, API, roadmap, semua keputusan di Changelog).
> Dokumen ini hanya **runbook + status + konvensi** yang tidak ada di sana.
> Jangan menurunkan-ulang keputusan; ikuti changelog.

## 1. Status singkat (per v0.9.0)

Fase 0–4 + hardening **selesai di level vertical-slice & terverifikasi
sejauh mungkin tanpa manusia/infra**:

- **Frontend** (`sistemnya/`): Vite; seam `PatientEngine`/`DataStore`;
  cutover RAG C1–C3 (browser-verified); voice PTT mic + auto-speak.
  Design asli **tidak diubah** (invariant: CSS hash build tetap
  `index-Bj97HpXF.css`).
- **Exam Simulator DICABUT dari flow (v0.11.0, keputusan user).** File
  disimpan **dorman, tak di-wire**: `sistemnya/exam-sim/`, backend domain
  `exam`, `data-kasus/_exam/`, `engine/exam-engine.js` (out of LOAD_ORDER).
  `Virtual Patient Simulator.html` & `bundle-legacy.mjs` byte-identical
  original (revert terverifikasi).
- **Flow kanonik (v0.11.0):** Anamnesis → DDx → **Rencana Tatalaksana**
  (`ManagementPlanScreen`: penunjang+terapi+edukasi → `session.managementPlan`)
  → Debrief. Design token/komponen existing (zero design.css baru).
- **v0.12.0 (selesai, build/pytest-verified):** (a) **Bug pasien-kosong
  fixed** — `patient-engine.js` re-auth+retry+graceful (token TTL 15mnt
  habis → 401); `llm.py` robust thd content kosong. (b) **Debrief narasi
  LLM** — `/api/scoring/evaluate` terima `ddx`/`management_plan`,
  evaluator hasilkan `summary`; DebriefScreen tampilkan summary+
  positiveNotes+missedItems. (c) **Skill Heatmap** dashboard = data nyata
  (rata-rata rubrik dari `scoreHistory`) + lebih jelas. (d) **Profil
  "Performa Penilaian"** (rata-rata/tertinggi/sparkline) via `scoreHistory`
  §5.4 (di-record sekali di DebriefScreen). CSS hash tetap
  `index-Bj97HpXF.css`; pytest 56. **Batas:** runtime browser
  (narasi/heatmap/avg) butuh verifikasi user.
- **Backend** (`backend/`): FastAPI domain-modular, JWT, Alembic,
  RAG (BM25 + answer-restraint + LLM-judge), STT Groq, TTS ElevenLabs,
  prod-guard/headers/rate-limit. **46 pytest passed, 1 skipped**.
- Sudah di GitHub: `rafiarrantisi/new-simulator-anamnesis` (branch `main`).

## 2. Layout repo

```
backend/      FastAPI + RAG + voice + pipeline ingestion + tests
sistemnya/    Frontend (sumber .js/.jsx asli + engine/ + Vite); design.css
data-kasus/   22 kasus markdown (kanonik) + _disclosure/ (6 sidecar draf)
docs/         ARCHITECTURE.md (kontrak), HANDOFF.md, all-plan/ (4 plan asli)
```

## 3. Cara jalan & verifikasi (Windows)

```
# Backend (dari backend/)
.venv\Scripts\python.exe -m pytest -q                  # suite (target hijau)
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
.venv\Scripts\python.exe -m pipeline.ingest --all --no-embed   # isi registry 22 kasus

# Frontend (dari sistemnya/)
npm run build      # WAJIB hijau; cek CSS hash TETAP index-Bj97HpXF.css
npm run dev        # bundler regen src/main.jsx otomatis (jangan edit src/main.jsx)

# Exam Simulator — paket TERISOLASI (dari sistemnya/exam-sim/)
npm install        # 175 pkg (pixi/three/r3f/tailwind/framer/gsap) — sekali
npm run build      # tsc --noEmit + vite lib build; chunk Pixi/R3F terpisah
npm run dev        # harness dev (?api=&session=&token=); butuh backend hidup
```
- DB dev = sqlite `backend/ophtha_dev.db` (sudah ter-ingest 22 kasus).
- Preview browser (jika perlu verifikasi UI): `.claude/launch.json` →
  `preview_start` name `ophtha-frontend`; backend hidup dulu di :8000.

## 4. Konvensi kerja (WAJIB diikuti)

1. **Contract-first (ARCHITECTURE.md §0.3):** ubah API/data model/perilaku
   → update ARCHITECTURE.md (naikkan versi + Changelog) DULU, baru kode.
2. **Design byte-identical (§8):** `design.css` & markup komponen tidak
   diubah. Verifikasi tiap perubahan FE: `npm run build` hijau + CSS hash
   tetap `index-Bj97HpXF.css`. (`CASES` Inggris = dummy, BOLEH dipensiun.)
3. **Verifikasi, bukan klaim:** backend → pytest; FE → build + (bila perlu)
   browser preview. Laporkan jujur batas verifikasi (mis. mic nyata,
   audio, gate dokter = tak bisa otomatis).
4. **`src/main.jsx` = artefak generate**, jangan diedit tangan.
5. Konten klinis: asisten **draf**, **dokter validasi** (jangan klaim valid).

## 5. Pending (BUKAN utang tersembunyi — sudah di Changelog)

**Aksi user (tak bisa asisten):**
- 🔴 **Rotate 3 API key** (OpenRouter/Groq/ElevenLabs) — bocor di transkrip
  chat lama. Key ada di `backend/.env` (gitignored, TIDAK ter-commit) —
  sesi baru perlu `.env` ini ada secara lokal.
- **Gate 3-dokter** (exit Fase 3): validasi answer-restraint + 22 kasus +
  16 disclosure layers sisa.
- Pilih suara TTS final (sampel di `backend/tts-samples/`); uji mic di
  browser nyata.

**Bisa dikerjakan asisten (enhancement/infra-level kode):**
- 16 disclosure sidecar sisa (draf; kasus-03–08,11–15,18–22).
- Hybrid dense + Qdrant (kini BM25 saja); reranker.
- VAD Silero auto-detect + echo-prevention penuh; toggle suara Settings.
- Postgres/Alembic prod path, Docker deploy, debrief tampilkan
  missedItems/positiveNotes.
- **Exam (v0.10.0, kontrak §9 K6):** call-site DOM legacy →
  `window.OphthaExam.mount` (perlu slot markup = area dilindungi §8.1,
  gate verifikasi browser). 21 sidecar `_exam` sisa (+ validasi dokter
  SEMUA konten exam, §5.9). Asset foto fundus nyata (plan §8; kini
  ilustrasi prosedural). Komposisi skor sesi total (§9 K7).

## 6. Provider aktif (lihat backend/.env)

- LLM persona+judge: OpenRouter `deepseek/deepseek-v4-flash`.
- STT: Groq `whisper-large-v3-turbo`. TTS: ElevenLabs (voice provisional
  "Liam"). Tanpa key → fallback Stub/offline otomatis (kontrak §3/§9).
