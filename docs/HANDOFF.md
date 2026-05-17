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

## 6. Provider aktif (lihat backend/.env)

- LLM persona+judge: OpenRouter `deepseek/deepseek-v4-flash`.
- STT: Groq `whisper-large-v3-turbo`. TTS: ElevenLabs (voice provisional
  "Liam"). Tanpa key → fallback Stub/offline otomatis (kontrak §3/§9).
