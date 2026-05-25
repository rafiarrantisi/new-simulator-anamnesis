# HANDOFF — Onboarding Sesi Baru

> Baca **`docs/ARCHITECTURE.md`** (v0.13.0) DULU = kontrak & sumber kebenaran
> tunggal (data model, API, roadmap, semua keputusan di Changelog).
> Dokumen ini hanya **runbook + status + konvensi** yang tidak ada di sana.
> Jangan menurunkan-ulang keputusan; ikuti changelog.

## 1. Status singkat (per v0.13.0 — Tier A)

**LIVE PRODUCTION:** **https://ophtasim.duckdns.org** (AWS EC2 Sydney,
HTTPS+HTTP/2, streaming WebSocket aktif). Ibu (dokter mata, target user)
sudah bisa coba penuh.

- **Flow kanonik:** Anamnesis → DDx → **Rencana Tatalaksana** → Debrief
  (Penilaian AI: summary + positiveNotes + missedItems).
- **Tier A v0.13.0 (live, verified):** Streaming token-by-token via WS
  `/api/sessions/{id}/ws` — TTFT ~1 dtk, kata mengalir ChatGPT-style.
  `RagPatientEngine` persistent WS per-sesi + FIFO queue + `onChunk`.
  `MessageBubble` dot inline saat menunggu chunk pertama. Auto-speak
  TTS gated `!streaming` (**voice-ready**: tinggal isi STT/TTS key di
  server `.env`, tak perlu code change). Backend `max_tokens` cap
  (persona 220, judge 1200) — tail latency ↓30–50%. nginx HTTP/2 + WS
  upgrade map.
- **Flow + UI selesai (v0.10–0.12):** `ManagementPlanScreen`
  (penunjang+terapi+edukasi); Debrief narasi LLM (summary+covered/missed
  via `/api/scoring/evaluate` extended `ddx`+`management_plan`);
  Skill Heatmap dashboard dari rubrik nyata (`scoreHistory`);
  Profil "Performa Penilaian" (rata-rata/tertinggi/sparkline).
- **Exam Simulator (v0.11.0) DICABUT dari flow** — file dorman, tak di-wire
  (`sistemnya/exam-sim/`, backend `exam`, `data-kasus/_exam/`,
  `engine/exam-engine.js` out of LOAD_ORDER).
- **Frontend** (`sistemnya/`): Vite; seam `PatientEngine`/`DataStore`;
  design asli **tidak diubah** — CSS hash build SELALU
  `index-Bj97HpXF.css` (terbukti tiap commit dari v0.9.0–v0.13.0).
- **Backend** (`backend/`): FastAPI domain-modular, JWT, Alembic, RAG
  (BM25 + answer-restraint + LLM-judge), STT/TTS endpoint, prod-guard/
  headers/rate-limit. **56 pytest passed, 1 skipped**.
- GitHub: `rafiarrantisi/new-simulator-anamnesis` (`main`).
  Latest commit Tier A: `617ea53`.

## 2. Layout repo

```
backend/      FastAPI + RAG + voice + pipeline ingestion + tests
sistemnya/    Frontend (sumber .js/.jsx + engine/ + Vite); design.css
              + exam-sim/ (paket terpisah, dorman)
data-kasus/   22 kasus markdown (kanonik) + _disclosure/ (6 sidecar draf)
              + _exam/ (1 sidecar pilot kasus-02, dorman)
deploy/       AWS EC2 deploy kit: setup.sh (idempoten), nginx-ophtha.conf,
              nginx-upgrade-map.conf, ophtha-backend.service,
              env.server.example, duckdns-update.sh, README-DEPLOY.md
docs/         ARCHITECTURE.md (kontrak), HANDOFF.md, all-plan/
```

## 3. Cara jalan & verifikasi

### Lokal Windows
```
# Backend (dari backend/)
.venv\Scripts\python.exe -m pytest -q          # target 56 passed, 1 skipped
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
.venv\Scripts\python.exe -m pipeline.ingest --all --no-embed   # bila DB kosong

# Frontend (dari sistemnya/)
npm run build      # WAJIB hijau; CEK CSS hash TETAP index-Bj97HpXF.css
npm run dev        # bundler regen src/main.jsx (JANGAN edit src/main.jsx)
```
- DB dev = sqlite `backend/ophtha_dev.db` (22 kasus pre-ingested).
- `backend/.env` (gitignored) WAJIB ada lokal: LLM_API_KEY OpenRouter
  minimal. Tanpa itu → StubLLM (pipeline tetap valid, balasan stub).

### Deploy/update produksi (EC2 Instance Connect via AWS Console)
```bash
# Update kode + rebuild + restart (idempoten, ~3-5 mnt)
cd /opt/ophtha
git pull
sudo PUBLIC_ORIGIN=https://ophtasim.duckdns.org \
     DOMAIN=ophtasim.duckdns.org bash deploy/setup.sh

# Smoke verifikasi
curl -sI https://ophtasim.duckdns.org | head -1   # HTTP/2 200
curl -s  https://ophtasim.duckdns.org/health      # {"success":true,...}

# Log + operasional
journalctl -u ophtha-backend -f                   # tail backend
sudo systemctl restart ophtha-backend             # restart bila perlu
sudo nginx -t && sudo systemctl reload nginx
```
- Server `/opt/ophtha/backend/.env`: ENV=dev, JWT_SECRET acak,
  ACCESS_TOKEN_MINUTES=720, LLM_API_KEY OpenRouter, CORS=https://ophtasim.duckdns.org.
- Repo bisa Private; PAT/temp-public hanya saat clone awal di server.

## 4. Konvensi kerja (WAJIB diikuti)

1. **Contract-first (ARCHITECTURE.md §0.3):** ubah API/data model/perilaku
   → update ARCHITECTURE.md (naikkan versi + Changelog) DULU, baru kode.
2. **Design byte-identical (§8.1):** `design.css` & markup komponen tidak
   diubah. Verifikasi tiap perubahan FE: `npm run build` hijau + CSS hash
   tetap `index-Bj97HpXF.css` + `git diff sistemnya/design.css` kosong.
3. **Verifikasi, bukan klaim:** backend → pytest; FE → build; runtime UI
   → user (browser). Laporkan jujur batas verifikasi (mic/audio/clinical
   validation/browser flows = perlu user/dokter).
4. **`src/main.jsx` = artefak generate**, jangan diedit tangan.
5. Konten klinis: asisten **draf**, **dokter validasi** (jangan klaim valid).
6. **Secret/key** (LLM/DuckDNS/PAT/JWT_SECRET) JANGAN echo di chat;
   `backend/.env` gitignored & TIDAK pernah di-commit.

## 5. Pending (BUKAN utang tersembunyi — di Changelog)

**Aksi user (asisten tak bisa):**
- 🟡 **Voice di server**: append `STT_*` (Groq) + `TTS_API_KEY` (ElevenLabs)
  ke `/opt/ophtha/backend/.env` + `systemctl restart ophtha-backend`.
  Tanpa key sekarang → mic UI tersembunyi, TTS silent (degradasi mulus).
  *Wajib pakai key FRESH — yg lama sempat bocor.*
- 🟡 **Iterasi feedback ibu** (dokter mata): konten kasus, persona,
  rubrik, UX. Konten klinis = doktorvalidasi.
- 🟢 **Higiene** (kalau belum): rotate token DuckDNS yg sempat ter-paste
  di chat; tutup ulang SG SSH (Anywhere → My IP) jika tadi dilebarkan.

**Bisa dikerjakan asisten kapan-kapan:**
- **Tier B (optimasi latency lanjut):** Groq Nitro / Mixtral / Gemini-flash
  utk persona (perlu QA answer-restraint head-to-head); prompt caching
  (Anthropic/OpenAI) untuk TTFT subsequent turns ~100ms; trim prompt
  (RAG k=3→2). Saat ini DeepSeek + Tier A sudah "ChatGPT-snappy".
- **16 disclosure sidecar sisa** (kasus-03–08,11–15,18–22) — draf,
  validasi dokter.
- **Postgres + Alembic prod path** (Neon free) — kalau multi-user serius;
  Alembic baseline + revisi exam sudah siap.
- **Exam Simulator** (v0.10.0, §9 K6): call-site DOM legacy ke
  `window.OphthaExam.mount` — perlu slot markup (area dilindungi §8.1),
  gate browser verification + keputusan user (saat ini user tak
  menginginkan; modul dorman).
- **Per-sentence streaming TTS** (Phase 2 voice) saat key TTS aktif:
  split chunk per `./?/!` → dispatch parallel ke TTS endpoint.

## 6. Provider aktif

- **LLM persona+judge:** OpenRouter `deepseek/deepseek-v4-flash`
  (LLM_MODEL/LLM_JUDGE_MODEL sama). `max_tokens` persona 220, judge 1200.
- **STT:** Groq `whisper-large-v3-turbo` (config-driven; key kosong = off).
- **TTS:** ElevenLabs (provisional voice "Liam"; key kosong = off).
- Tanpa LLM key → StubLLM (pipeline valid; balasan stub deterministik).

## 7. Deploy snapshot (AWS)

- **Instance:** `i-01467deeec0fa5dc4` · Ubuntu 26.04 · t3.small · 20GB EBS.
- **Region:** `ap-southeast-2` (Sydney). **Elastic IP:** `3.106.144.105`.
- **Domain:** `ophtasim.duckdns.org` (DuckDNS A → Elastic IP).
- **TLS:** Let's Encrypt via certbot (`--nginx --redirect`, auto-renew).
- **SG:** `launch-wizard-1` — 22/My-IP, 80/0.0.0.0, 443/0.0.0.0.
- **Akses server:** EC2 Instance Connect (browser, via AWS Console);
  SSH lokal kadang diblok ISP user → Instance Connect lebih reliable.
- **App path:** `/opt/ophtha` (owned by ubuntu); DB
  `/opt/ophtha/backend/ophtha_prod.db` (sqlite, persist di EBS).
- **systemd:** `ophtha-backend.service` (uvicorn 1 worker, sqlite-safe).
