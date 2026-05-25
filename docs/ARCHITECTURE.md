# OphthaSim — Architecture & Contract (Single Source of Truth)

> **STATUS:** **LIVE** di https://ophtasim.duckdns.org (AWS EC2 Sydney,
> HTTPS+HTTP/2). Streaming token-by-token aktif (Tier A v0.13.0). Flow:
> **Anamnesis → DDx → Rencana Tatalaksana → Debrief (narasi LLM)**.
> Exam Simulator dorman (v0.11.0 keputusan user). Voice (Groq/ElevenLabs)
> belum diaktifkan — degradasi mulus, arsitektur sudah siap.
> Dokumen ini **sumber kebenaran tunggal** yang menjembatani semua chat
> session.
> Versi: `0.13.0` · Terakhir diubah: 2026-05-19

---

## 0. Cara memakai dokumen ini (WAJIB dibaca tiap sesi)

1. **Satu concern per fokus kerja.** (Saat ini semua di satu sesi sampai
   context penuh, lalu migrasi — lihat §11.)
2. **Baca dokumen ini lebih dulu** sebelum mulai kerja apa pun.
3. **Kontrak hanya boleh diubah lewat dokumen ini.** Perlu ubah API / data
   model / interface → **update dokumen ini dulu** (naikkan versi + Changelog),
   baru implementasi. Ini satu-satunya pencegah *contract drift*.
4. **Non-negotiable (lihat §8).**

Kalau ada asumsi berbeda → yang menang adalah yang tertulis di sini.

### Sumber turunan
4 plan di `docs/all-plan/` (backend-tech-stack, rag-strategic-plan,
prompt-improvement-answer-restraint, voice-pipeline) sudah **direkonsiliasi** ke
dokumen ini. Jika ada konflik antara plan dan dokumen ini → **dokumen ini yang
berlaku**. Plan dipakai sebagai detail teknis, bukan kontrak.

---

## 1. Keadaan saat ini

- **Frontend:** React 18 (single shared scope) → **Vite** (Fase 1 selesai).
  25 sumber `.js/.jsx` + HTML lama **byte-identical**;
  `build/bundle-legacy.mjs` → `src/main.jsx`. Build produksi hijau.
- **Seam:** `PatientEngine` & `DataStore` sudah ada
  (`sistemnya/engine/*.js`). `StaticPatientEngine` membungkus logika lama
  (keyword `detectCategory` + `responses`), output identik. `simulator.jsx`
  `handleSend`/`handleSendStable` sudah lewat `PatientEngine`.
- **Backend / RAG / voice:** belum ada. State di `localStorage`.
- **Konten klinis (KEPUTUSAN v0.3.0):** 22 markdown di `data-kasus/`
  **adalah sumber kebenaran kanonik**. 16 kasus hardcoded Inggris di
  `data.js`/`cases-extra.js` **dipensiun** saat cutover (Fase 3); sampai itu
  tetap dipakai `StaticPatientEngine` untuk dev/offline saja.

---

## 2. Arsitektur target (berlapis)

```
┌─────────────────────────────────────────────────────────────┐
│ UI SHELL  (screens, simulator, exam stations, design.css)    │ ← stabil
├─────────────────────────────────────────────────────────────┤
│ PatientEngine (seam, STREAMING)   Evaluator (post-session)    │
│  • StaticPatientEngine (legacy/dev)  • StaticEvaluator (legacy)│
│  • RagPatientEngine   (Fase 3, WS)   • LlmJudgeEvaluator (F3)  │
│  • VoicePatientEngine (Fase 4)                                │
├─────────────────────────────────────────────────────────────┤
│ DataStore   • LocalDataStore (now)   • ApiDataStore (Fase 2)   │
├─────────────────────────────────────────────────────────────┤
│ BACKEND (FastAPI, Fase 2) → RAG (Fase 3) → Voice (Fase 4)     │
│  Postgres · Redis · Qdrant · Celery · JWT · multi-tenant      │
└─────────────────────────────────────────────────────────────┘
```

Prinsip: **UI hanya bicara ke `PatientEngine`, `Evaluator`, `DataStore`** —
tidak pernah langsung ke `detectCategory`, `fetch`, atau `localStorage`.
Ganti statis→RAG→voice = ganti implementasi, UI tidak berubah.

---

## 3. KONTRAK — `PatientEngine` (seam, streaming-ready)

> **KEPUTUSAN v0.3.0 (transport):** interface mendukung **streaming** sejak
> sekarang. RAG/voice butuh token streaming (WebSocket/SSE). Static cukup
> memanggil `onChunk` sekali.

```ts
interface PatientTurnInput {
  caseId: string;            // kanonik, lihat §5.6 (mis. "kasus-02")
  sessionId: string;
  history: Message[];        // kronologis termasuk chief complaint
  userMessage: string;       // teks mentah dokter (sudah hasil STT jika voice)
  locale: 'id' | 'en';       // default 'id'
  mode: 'normal' | 'tutorial' | 'osce';
}

interface PatientTurnResult {
  reply: string;                  // teks lengkap balasan pasien
  detectedDomain?: string | null; // OPSIONAL hint UI saja — BUKAN dasar scoring
  audioUrl?: string | null;       // Fase 4 (TTS)
}

interface PatientEngine {
  respond(
    input: PatientTurnInput,
    opts?: { onChunk?: (delta: string) => void; signal?: AbortSignal }
  ): Promise<PatientTurnResult>;
}
```

**Aturan kompatibilitas:**

- **Scoring TIDAK lagi bergantung pada `detectedDomain`** (keputusan v0.3.0,
  lihat §5.5). Engine hanya menghasilkan balasan persona. `detectedDomain`
  boleh diisi `StaticPatientEngine` untuk UI lama, dan `null` untuk RAG.
- `StaticPatientEngine` (sekarang): bungkus `detectCategory`+`responses`,
  output identik perilaku lama, panggil `onChunk(reply)` sekali lalu resolve.
  Tetap dipakai dev/offline sampai cutover Fase 3.
- `RagPatientEngine` (Fase 3): persona dari **Bagian B + Disclosure Layers +
  answer-restraint** (§5.7) + RAG context Bagian A; stream via WebSocket
  `/api/sessions/{id}/ws`, panggil `onChunk` per delta, resolve saat
  `turn_complete`.
- Engine TIDAK menghitung skor/XP/badge. Itu `Evaluator` (§3A).
- Gagal jaringan/abort → `throw`/reject; UI tampilkan fallback + retry
  (jangan telan error diam-diam).

## 3A. KONTRAK — `Evaluator` (scoring, post-session)

> **KEPUTUSAN v0.3.0 (scoring):** kanonik = **LLM-judge post-session**
> (rag-plan §8), bukan deterministik per-turn.

```ts
interface EvaluationInput {
  caseId: string;
  sessionId: string;
  transcript: Message[];
  mode: 'normal' | 'tutorial' | 'osce';
  ddx?: { dx1?; dx2?; dx3?; reasoning?; skipped? } | null;   // v0.12.0 (opsional)
  managementPlan?: { penunjang?; terapi?; edukasi?; skipped? } | null; // v0.12.0
}

interface EvaluationReport {        // bentuk persis = rag-plan §8.3
  totalScore: number;              // 0..100
  breakdown: {
    coverage:      { score: number; max: 40; detail: unknown[] };
    fife:          { score: number; max: 20; detail: unknown[] };
    redFlags:      { score: number; max: 20; detail: unknown[] };
    communication: { score: number; max: 20; detail: unknown[] };
  };
  missedItems: string[];
  positiveNotes: string[];
  summary?: string;                // v0.12.0 (opsional, aditif): narasi
                                   // LLM ringkas (apa dilakukan, bagus,
                                   // kurang) — dirender di Debrief.
}

interface Evaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationReport>;
}
```

- Kanonik: `LlmJudgeEvaluator` → backend `POST /api/scoring/evaluate`
  (LLM membandingkan transcript vs checklist Bagian A, isolasi per-kasus).
- `StaticEvaluator` (legacy): bungkus `computeScore`/`computeOSCEScore`
  untuk dev/offline. **Tidak kanonik.** XP/badge boleh diturunkan dari
  `totalScore` agar gamifikasi UI tetap jalan.
- Bobot lama frontend (55/30/15 dan 20/35/20/15/10) **superseded** oleh
  rubrik 40/20/20/20 di atas.

---

## 3B. KONTRAK — Modul Exam Simulator (KEPUTUSAN v0.10.0)

> Rekonsiliasi `docs/all-plan/ophtha-exam-simulator-unified-plan.md` (v1.0)
> ke kontrak ini. Plan = detail teknis & pedagogis; **dokumen ini yang
> berlaku** bila konflik. Alur sesi **tidak berubah**:
> `ANAMNESIS → DDx COMMIT → OCULAR EXAM → DEBRIEF` (plan §1.1).

### 3B.1 Posisi & seam

Exam = tahap **post-anamnesis, pre-debrief**. UI hanya bicara ke seam
`ExamEngine` (analog `PatientEngine` §3) — tidak pernah langsung ke
ground-truth findings atau `fetch`.

```ts
interface ExamEngine {
  // ground truth TIDAK pernah dibaca langsung UI (anti-cheat by inspection,
  // plan §6.1/§7.2). Hanya backend yang menilai.
  loadFindings(sessionId: string): Promise<ExamFindingsView>; // session-gated
  submit(record: StudentExamRecord): Promise<ExamScoringReport>;
}
```

- `StaticExamEngine` (legacy/dev/offline): bungkus station legacy yang
  SUDAH ADA (`ocular-exam.jsx` + `exam-*.jsx` + `stations/station-*-v3.jsx`)
  + `EXAM_EXTENSIONS` (`exam-data.js`). Output perilaku identik. Fallback
  saat `OPHTHA_API_BASE` kosong.
- `ApiExamEngine` (E-cutover): panggil endpoint §6 (session-gated). Selector
  sama pola C1: `window.OPHTHA_API_BASE` ada → API; else Static.
- Engine TIDAK menghitung skor. Itu backend (`POST .../exam` → scorer).

### 3B.2 Scoring TERPISAH dari Evaluator §3A

`ExamScoringReport` adalah laporan **tersendiri**, BUKAN dilebur ke
`EvaluationReport` §3A (cegah contract drift rubrik anamnesis kanonik
40/20/20/20). Komposisi skor sesi total (anamnesis + DDx + exam) =
**keputusan tertunda** (§9 K7), tidak diputuskan di v0.10.0.

```ts
interface StudentExamRecord {
  sessionId: string; caseId: string;
  stations: Record<string, {                 // stationId → catatan mahasiswa
    recorded: unknown;                        // temuan yang dicatat
    procedureSteps: string[];                 // urutan tindakan (adherence)
    completed: boolean;
  }>;
}

interface ExamScoringReport {
  examTotalScore: number;                     // 0..100
  stations: Record<string, {
    score: number; max: number; detail: unknown[];
  }>;
  missedFindings: string[];
  procedureNotes: string[];                   // adherence (plan §7.3)
  positiveNotes: string[];
}
```

Bobot per-station (plan §7.3, dinormalisasi → total 100):
`visual_acuity 15 · pupils_rapd 15 · ocular_motility 10 · visual_field 10
· slit_lamp 20 · tonometry 10 · fundoscopy 20`. Amsler/Ishihara/
fluorescein = kondisional/bonus. **Penilaian = temuan + adherence
prosedur** (urutan benar, mis. VA OD→OS, RAPD ruang gelap).

### 3B.3 Frontend stack — PENGECUALIAN BER-SCOPE (diizinkan user)

> **KEPUTUSAN v0.10.0 (user, eksplisit):** Modul exam-simulator butuh
> "mendekati alat aslinya, tanpa tradeoff" → **diizinkan memakai stack
> frontend maksimal**. Pengecualian ini **HANYA** untuk modul exam-sim.
> Sisa aplikasi tetap tunduk §8.1 (byte-identical) tanpa kecuali.

Stack exam-sim (adopsi plan §2, divalidasi): React 18 + **TypeScript** +
Vite + **Zustand** (store per-station, ter-reset antar station — isolasi
ala RAG) + **Framer Motion + SVG** (L2) + **Pixi.js v8 `@pixi/react`**
(L3, lazy) + **React Three Fiber + GLSL** (L4 slit-lamp, lazy) + **GSAP
`@gsap/react`** (timing RAPD) + Tailwind **scoped**. Fallback WebGL→L2
(plan §3.3). Pixi v8 (plan Keputusan 3). Ishihara = procedural SVG
(IP-safe, plan Keputusan 2).

### 3B.4 Invarian ISOLASI (WAJIB — pelindung §8.1)

Pengecualian §3B.3 sah HANYA jika SEMUA invarian ini dipenuhi &
diverifikasi tiap perubahan:

1. **Paket terpisah** `sistemnya/exam-sim/` — `package.json`, Vite, TS,
   build sendiri. Dependensi berat (pixi/three/r3f/tailwind/framer/gsap)
   **TIDAK PERNAH** masuk `package.json` legacy, `build/bundle-legacy.mjs`
   `LOAD_ORDER`, `src/main.jsx`, atau `design.css`.
2. **CSS tak bocor 2 arah**: exam-sim di-mount dalam **Shadow DOM root**
   (Tailwind preflight + style ter-scope di shadow). `design.css` tak
   masuk; style exam-sim tak keluar.
3. **Invarian hash main app**: `npm run build` di `sistemnya/` tetap
   menghasilkan `index-Bj97HpXF.css` (byte-identical §8.1). Diverifikasi
   tiap sesi yang menyentuh FE.
4. **Integrasi via seam + flag**: legacy `ocular-exam.jsx` flow tetap;
   delegasi render ke exam-sim hanya saat flag aktif (pola selector C1).
   Markup/`design.css` legacy tetap byte-identical (seam, bukan rombak).
5. **Alur tak berubah**: ANAMNESIS→DDx→EXAM→DEBRIEF; exam-sim mengisi
   slot EXAM, tidak mengubah screen lain.

---

## 4. KONTRAK — `DataStore` (persistensi)

```ts
interface DataStore {
  loadProfile(): Promise<Profile>;
  saveProfile(p: Profile): Promise<void>;
  loadSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  loadAuth(): Promise<AuthSession | null>;
  saveAuth(a: AuthSession | null): Promise<void>;
  listCases(): Promise<CaseSummary[]>;   // §5.6 (bukan Case penuh)
  saveCustomCase(c: unknown): Promise<unknown>;
  deleteCustomCase(id: string): Promise<void>;
  recordSession(r: unknown): Promise<void>;
}
```

`LocalDataStore` (sudah ada) — pembungkus localStorage. localStorage keys:
`ophtha_settings`, `ophtha_visited`, `ophtha_auth`, `ophtha_badges`,
`ophtha_profile`, + key custom-case.

**Scope adopsi Fase 2 (keputusan v0.4.0):**
- `ApiDataStore` + `createDataStore()` **diimplementasi di modul
  `engine/data-store.js`** (modul baru, bukan file legacy). Selector:
  `window.OPHTHA_API_BASE` di-set → `ApiDataStore`; selain itu
  `LocalDataStore` (fallback offline/dev). Memenuhi interface di atas +
  metode bantu `login/signup` (auth bukan bagian interface inti).
- **Cutover frontend ↔ backend = BERTAHAP 3 fase (keputusan v0.6.0):**
  - **C1 (dikerjakan v0.6.0):** `RagPatientEngine` sisi frontend memenuhi
    seam `PatientEngine` (§3) — panggil backend (`POST /api/sessions` lalu
    REST `/turns`, atau WS streaming). Selector: `window.OPHTHA_API_BASE`
    ada → RAG; selain itu `StaticPatientEngine` (fallback). Anamnesis pakai
    RAG nyata. **Exam/scoring/Case statis TIDAK disentuh** (kopling-dalam).
  - **C2 (ditunda):** auth nyata — `LoginScreen`→`ApiDataStore.login`,
    `loadProfile` sinkron→async di App (refactor struktur).
  - **C3 (ditunda, paling berat):** Library→`CaseSummary` + rekonsiliasi
    exam/scoring jadi server-driven; butuh verifikasi browser + gate dokter.
  Risiko diturunkan dengan urutan ini; bukan utang tersembunyi.

---

## 5. KONTRAK — Data model

### 5.1 `Case` LEGACY (static-only, akan dipensiun)
```
{ id:'case-001', ..., responses:{ [domain]:{text,found,isRedFlag} }, ... }
```
Hanya dipakai `StaticPatientEngine`/`StaticEvaluator` untuk dev/offline.
**Bukan kanonik.** Dipensiun saat cutover Fase 3.

### 5.2 `Message`
`{ id, role:'system'|'patient'|'user', text, reward?, redFlag? }`

### 5.3 `Session` (runtime, simulator.jsx)
`{ messages, discoveredDomains:Set, findings[], redFlagsFound[],
   questionCount, elapsed, scoring{...}, newBadges[], xpGained,
   osceMode, tutorialMode, mode, osceTotalSeconds, osceTimeUp?, ddxCommit? }`
> Field `scoring` lama tetap ada untuk path static; path RAG memakai
> `EvaluationReport` (§3A).

### 5.4 `Profile`
`{ xp, streak, completedCaseIds[], totalSessions, name, school, year,
   avatarEmoji, avatarColor, favoriteCaseIds[], sessionDates{}, dailyCompleted{},
   scoreHistory[] }`
> `scoreHistory` (v0.11.0, aditif): `[{ ts, caseId, score }]` (cap ~200,
> terbaru dulu) — sumber rata-rata nilai (Profil) & Skill Heatmap nyata.
> Opsional/back-compat (default `[]` bila absen).

### 5.5 Scoring (KEPUTUSAN v0.3.0)
Kanonik = `Evaluator` LLM-judge post-session (§3A). `computeScore`/
`computeOSCEScore`/`evaluateExamFinding` = legacy static path.

### 5.6 `Case` / `CaseSummary` KANONIK (turunan markdown)
Identitas kasus kanonik = nama file `kasus-XX-slug.md` → `caseId="kasus-02"`.
Frontend hanya menerima **`CaseSummary`** (katalog), bukan persona:
```
CaseSummary {
  caseId:"kasus-02", filename, title_id, title_en,
  icd10, skdi, organ_system, difficulty, tags[], references[],
  stage?:'preklinik'|'koas', caseType?:'practice'|'osce', isActive
}
```
- **Bagian A** → server-only, di-chunk & embed ke Qdrant (RAG).
- **Bagian B + Disclosure Layers** → server-only system prompt,
  **TIDAK PERNAH dikirim ke client** (anti-bocor jawaban).
- Frontend `Case` lama menyusut ke `CaseSummary` saat cutover (Fase 3).

### 5.7 Kontrak file markdown (gabungan rag-plan §2 + prompt-plan §7)
Nama: `kasus-XX-slug.md`. Struktur wajib:
- `## BAGIAN A: DATA MEDIS` → `### 1`..`### 10` (RAG corpus; chunk
  **per-section**, hybrid BM25+dense, `multilingual-e5-large`, Qdrant
  collection `kasus_XX`, **isolasi per-kasus** — retrieval tak boleh lintas
  kasus).
- `## BAGIAN B: PERSONA PASIEN` → **`### 0. DISCLOSURE LAYERS`** (volunteer /
  tanya_langsung / gejala_penyerta / tersembunyi) **+** `### 1`..`### 10`
  (persona). Bagian B disuntik penuh sebagai system prompt (tidak di-RAG).
- Parser **wajib** validasi `### 0` ada (in-file ATAU sidecar) untuk status
  "RAG-ready".
- **KEPUTUSAN v0.5.0 (mekanisme draf):** Disclosure Layers draf ditulis
  sebagai **sidecar** `data-kasus/_disclosure/kasus-XX.md`, **bukan**
  meng-edit 22 file kanonik (jaga byte-identical sampai dokter sign-off).
  Parser membaca `### 0` in-file kalau ada; kalau tidak, baca sidecar.
  Setelah dokter validasi, sidecar boleh di-merge ke file utama.
  kasus-02 sudah didraf sebagai **exemplar** (grounded prompt-plan §4/§7);
  21 sisanya menunggu (draf + review dokter).

### 5.8 Answer-restraint (WAJIB, validasi 3 dokter)
`RagPatientEngine` **wajib** sejak hari pertama: balas hanya dimensi yang
ditanya lalu BERHENTI; first-turn tidak boleh lapor keluhan saat hanya
disapa; hidden clue hanya muncul jika digali (prompt-plan §3–§6). Bukan
fitur tambahan — ini syarat kelulusan Fase 3 (QA prompt-plan §10).

### 5.9 `ExamFindings` (KEPUTUSAN v0.10.0 — sidecar, draf → dokter)

Ground-truth pemeriksaan fisik per kasus (plan §4). **Sumber kanonik =
`## BAGIAN A` → `### 5. Temuan Klinis Objektif`** di markdown (terverifikasi
ada & terstruktur, mis. kasus-02: tabel VA/TIO/pupil/motilitas/lapang +
tabel slit-lamp + fundus).

- **Mekanisme draf = SIDECAR** `data-kasus/_exam/kasus-XX.json` — cermin
  presiden §5.7 `_disclosure/`. **TIDAK** meng-edit 22 .md kanonik (jaga
  byte-identical + disiplin sign-off dokter). Loader baca sidecar; bila
  tak ada → **default aman** (semua "normal/tidak diperiksa") supaya
  endpoint tak 500. Setelah dokter validasi, boleh di-merge ke Bagian A.
- **Konten = draf asisten; dokter mata VALIDASI** (sama disiplin §5.7;
  jangan klaim tervalidasi).
- **Schema pragmatis** (bukan 200-baris TS plan §4.1 penuh — YAGNI;
  granularitas mengikuti yang markdown benar-benar sediakan):

```
ExamFindings {
  caseId, affectedEye?: 'OD'|'OS'|'OU',
  visual_acuity?: { od, os, pinhole_od?, pinhole_os?, near_od?, near_os? },
  tonometry?:     { iop_od?, iop_os?, method? },
  pupils?:        { od_size?, os_size?, od_react?, os_react?, rapd?, notes? },
  motility?:      { full?: bool, restrictions?: [], notes? },
  visual_field?:  { od?, os?, defect_pattern?, notes? },
  slit_lamp?:     { lids?, conjunctiva?, cornea?, anterior_chamber?,
                    iris?, lens?, notes? },
  fundus?:        { disc_od?, disc_os?, cdr_od?, cdr_os?, macula_od?,
                    macula_os?, vessels?, periphery?, image_od?, image_os? },
  color_vision?:  { od_correct?, os_correct?, total?, type? },
  amsler?:        { od?, os? },
  fluorescein?:   { pattern?, location?, seidel?, note? }
}
```
Field opsional + tipe fleksibel (string/struktur) — draf dari markdown
tak boleh over-constrained, tetap tervalidasi schema (Pydantic).
- **Anti-bocor**: hanya backend baca `_exam/`. Ke client lewat endpoint
  **session-gated** (§6); progressive-disclosure per-station (plan §4.3)
  = increment terjadwal, bukan dump sekaligus.

---

## 6. KONTRAK — Backend API (Fase 2; penamaan disatukan)

> Mengadopsi penamaan **backend-tech-stack plan** (paling matang &
> enterprise). Endpoint lama di kontrak (`/api/patient/turn`, `/api/voice/*`,
> `/api/profile`) **SUPERSEDED**.

Envelope: `{ success, data?, error?, meta?:{total,page,limit} }`.
Semua skema multi-tenant: `institution_id` ada di schema sejak hari 1.

| Method | Path | Tujuan |
|---|---|---|
| POST | `/api/auth/signup` `/login` `/refresh` `/logout` | JWT (access+refresh) |
| GET/PATCH | `/api/users/me` | Profile + XP + badges |
| GET | `/api/users/me/sessions` | Riwayat sesi (pagination) |
| GET | `/api/cases` | List `CaseSummary` (filter organ/skdi/difficulty/stage) |
| GET | `/api/cases/{caseId}` | Detail `CaseSummary` (tanpa Bagian B) |
| POST/PATCH | `/api/cases` `/{caseId}` | Admin: kelola kasus |
| POST | `/api/sessions` | Mulai sesi → `sessionId` |
| GET/PATCH | `/api/sessions/{id}` | State / status (active→completed) |
| POST | `/api/sessions/{id}/turns` | Turn via REST (fallback non-stream) |
| WS | `/api/sessions/{id}/ws` | **Chat streaming (utama)** — lihat protokol |
| POST | `/api/ai/transcribe` | STT (audio→teks, Whisper) — Fase 4 |
| POST | `/api/ai/tts` | TTS (teks→audio) — Fase 4 |
| POST | `/api/scoring/evaluate` | **LLM-judge** → `EvaluationReport` (§3A) |
| GET | `/api/sessions/{id}/exam-findings` | **Exam** ground truth, **session-gated** (auth+owner+aktif) → `ExamFindings` §5.9 |
| POST | `/api/sessions/{id}/exam` | Submit `StudentExamRecord` §3B.2 → skor deterministik |
| GET | `/api/sessions/{id}/exam-report` | `ExamScoringReport` §3B.2 (setelah submit) |
| GET | `/api/analytics/*` | Fase 2+ (dashboard dosen) |

**Protokol WebSocket `/api/sessions/{id}/ws`:**
- in: `{type:'text', text}` atau `{type:'audio', audio}`
- out: `{type:'transcript', text}` · `{type:'chunk', text}` (delta) ·
  `{type:'turn_complete'}` · `{type:'error', message}`

`AuthSession = { token, refreshToken, userId, email, role, institutionId, ts }`.
Auth = **custom JWT** (backend-plan §8.1); refresh token HttpOnly cookie,
access token pendek (15 mnt). Migrasi ke Supertokens bila butuh SSO institusi.

---

## 7. Roadmap & gate

| Fase | Scope | Gate keluar |
|---|---|---|
| **0** | Kontrak | ✅ selesai |
| **1** | Seam `PatientEngine`/`Evaluator`(static)/`DataStore` di Vite | ✅ build hijau · design byte-identical |
| **2** | Backend FastAPI domain-modular (backend-plan §6.1) · custom JWT · Case Registry · Ingestion 22 markdown · **Alembic migrations** · `ApiDataStore` modul+selector | Endpoint §6 (non-AI) jalan ✅ · 22 kasus ter-ingest ✅ · Alembic baseline ✅ · `ApiDataStore` siap+terverifikasi backend ✅ · *(cutover sinkron→async + Postgres/Qdrant/Redis = increment terjadwal berikut)* |
| **3** | **Dikerjakan v0.5.0:** PromptBuilder answer-restraint (prompt-plan §4/§5/§6) · `LlmClient` abstraksi (Stub deterministik + adapter provider via env) · BM25 retriever Bagian A + isolasi per-kasus · sliding-window memory · `RagPatientEngine` → wire sessions /turns+WS (ganti stub Fase 2) · `LlmJudgeEvaluator` → `/api/scoring/evaluate` (bentuk §3A) · kasus-02 disclosure exemplar (sidecar) · tes pipeline tanpa infra. **Ditunda (increment+pemicu):** API key LLM nyata · embedding dense+Qdrant (hybrid) · 21 disclosure sisa + review dokter · cutover frontend→CaseSummary · **QA 3-dokter** | **QA 3-dokter prompt-plan §10 LULUS** (P1/P2/P3) · isolasi terverifikasi · LLM nyata aktif |
| **4** | Voice: MediaRecorder + Silero VAD + Whisper STT + dedup guard + TTS + echo-prevention + Push-to-Talk fallback, dibungkus `VoicePatientEngine` | Matriks cross-browser voice-plan §9 LULUS · no duplikasi/echo |

Urutan 0→1→2→3→4 (dependensi keras). Polish UI **non-blocking**, diselipkan;
**layar percakapan** dipoles setelah kontrak streaming/voice konkret.

---

## 8. Non-negotiable

1. `design.css` & **JSX/markup** komponen **tidak diubah** (zero perubahan
   visual). Verifikasi: build hijau + tidak ada diff `design.css`/markup.
   **KLARIFIKASI v0.6.1 (user):** `CASES` Inggris legacy (`case-00X` di
   `data.js`/`cases-extra.js`) = **dummy dev, BUKAN konten dilindungi**.
   Yang dilindungi = *design/markup*. Dummy boleh dipensiun/diganti
   `kasus-XX` saat C3 tanpa melanggar poin ini.
   **KLARIFIKASI v0.10.0 (user):** stack FE legacy = bertahap (mungkin
   di-upgrade kelak saat publish). Modul **exam-simulator** diizinkan
   **pengecualian ber-scope** memakai stack maksimal — lihat §3B.3 —
   **HANYA** jika invarian isolasi §3B.4 dipenuhi (paket terpisah, shadow
   DOM, hash `index-Bj97HpXF.css` main app tetap, seam+flag, alur tetap).
   Pengecualian TIDAK meluas ke surface lain; sisa app tetap byte-identical.
2. Editing file sumber hanya pada *seam logic* yang dijadwalkan resmi di
   Changelog. **Evolusi konten kasus** (markdown jadi kanonik, frontend
   cutover ke `CaseSummary`, pensiun hardcoded EN) **resmi dijadwalkan Fase 3**
   — bukan diam-diam. Data static lama tetap utuh sampai cutover (dev).
3. `src/main.jsx` = artefak generate, jangan diedit tangan.
4. Tidak ada secret hardcoded; auth real menggantikan localStorage di Fase 2.
5. **Isolasi kasus**: retrieval RAG terkunci ke collection `kasus_XX` aktif.
   Bagian B tidak pernah keluar dari server.

---

## 9. Keputusan tertunda (tidak memblokir Fase 2 skeleton)

Default dipakai sampai diputuskan lain (backend-plan §11):

| # | Pertanyaan | Default sementara |
|---|---|---|
| K1 | Whisper self-host vs API | API (OpenAI/Groq) Fase 3-4; self-host GPU saat scale/privasi institusi |
| K2 | LLM persona & evaluator | Abstraksi provider-agnostic; persona = Claude/GPT-4o, evaluator = model kecil. Pilih konkret Fase 3 |
| K3 | Multi-tenant | **YA** — `institution_id` sejak hari 1 (cheap, painful jika telat) |
| K4 | Real-time instructor monitoring | Tidak dulu — post-session dashboard; WS pub/sub bila perlu |
| K5 | ExamFindings extraction | Default: sidecar `_exam/` draf manual asisten + review dokter. LLM-assisted extraction (plan §4.2) = tooling admin terjadwal |
| K6 | Exam-sim FE↔backend cutover | `ApiExamEngine` seam siap; cutover bertahap (pola C1) + verifikasi browser, **ditunda** sampai station inti jalan |
| K7 | Komposisi skor sesi total (anamnesis+DDx+exam) | **Belum diputuskan.** `ExamScoringReport` tetap terpisah dari `EvaluationReport` §3A sampai diputuskan (plan §1.1 usul 40/20/40 — perlu gate dokter) |

---

## 10. Changelog kontrak

- `0.13.0` (2026-05-19): **Tier A — streaming near-real-time + deploy
  produksi AWS EC2 + HTTPS.** Pemenuhan kontrak (§3 `onChunk`/streaming
  + §6 WS protokol) yg sebelumnya belum dieksekusi di frontend; bukan
  kontrak baru. **(a) Streaming WebSocket end-to-end:** `RagPatientEngine.respond`
  rewire dari REST `/turns` non-stream → WS persistent per-sesi
  (`_ensureWs`/`_sendOverWs`/`closeRagWs`) + FIFO queue + `onChunk`
  callback per token. Re-auth+retry pada token kadaluarsa/sesi mati tetap.
  `simulator.jsx handleSendStable`: push placeholder patient msg
  `{streaming:true, text:''}` atomik bersamaan user msg → anchor visual
  instan; `onChunk` update text by-id incremental; finalize pada resolve
  (`streaming:false`). Buang `setTimeout 1100-1700ms` artificial — pakai
  TTFT nyata. `MessageBubble`: dot inline saat `streaming && !text`
  (precedent ChatGPT/Claude), gantikan `TypingIndicator` bubble terpisah
  (simbol tetap export). `ConversationPanel`: derived `isStreaming`
  gantikan local `typing` state; disable input/tombol/mic. Auto-speak
  hook gated `!last.streaming` (TTS dipanggil sekali pada teks final →
  **voice-ready**: saat key TTS diisi nanti, tak perlu code change).
  `SimulatorScreen`: `useEffect` cleanup `window.closeRagWs()` saat
  unmount. **(b) Backend `max_tokens` cap** (config-driven, back-compat):
  `llm_persona_max_tokens=220`, `llm_judge_max_tokens=1200`. Param
  opsional di `LlmClient` Protocol + `_OAI`/`_Anth` impl; `engine.respond`/
  `stream_respond` teruskan persona cap; `evaluator.judge` pakai judge
  cap. Tail latency turun ~30–50%. **(c) nginx Tier A** (`deploy/`):
  template `nginx-ophtha.conf` `proxy_read_timeout 600s`, `Connection
  $connection_upgrade`; file baru `deploy/nginx-upgrade-map.conf` (map
  `$http_upgrade` di `/etc/nginx/conf.d/`); `setup.sh` deploy map + warn
  jika blok 443 ada tanpa WS headers; **`http2 on;` di blok 443** via
  sed patch post-certbot. **(d) Deploy produksi (AWS EC2):** Ubuntu
  Server 26.04 t3.small di `ap-southeast-2` (Sydney), Elastic IP
  `3.106.144.105`, domain DuckDNS `ophtasim.duckdns.org`, Let's Encrypt
  via certbot, HTTPS+HTTP/2 aktif (terverifikasi `curl -I` → HTTP/2 200,
  `/health` 200, streaming WS live via DevTools). Tetap pakai DeepSeek
  (`deepseek/deepseek-v4-flash` via OpenRouter — zero quality risk).
  ACCESS_TOKEN_MINUTES=720 (12h) untuk demo nyaman. **Verified:** pytest
  56 passed, build hijau, `design.css` byte-identical, **CSS hash TETAP
  `index-Bj97HpXF.css`** (§8.1 utuh). **Pending eksplisit:** voice STT
  (Groq) + TTS (ElevenLabs) keys belum diisi di server `.env` →
  mic/TTS off, degradasi mulus (UI mic hidden, `speak()` silent-fail);
  aktifkan = tinggal append env vars + `systemctl restart`. Tier B
  (Groq Nitro model, prompt caching) sebagai opsi optimasi berikut.
- `0.12.0` (2026-05-17): **Debrief narasi LLM + skor menilai DDx & Rencana
  Tatalaksana; perbaikan bug pasien-kosong; Skill Heatmap & rata-rata
  nilai profil.** **(a) Bug-fix pasien tak menjawab:** akar = token akses
  kadaluarsa (TTL 15 mnt, tanpa refresh di C1) → `/api/sessions` 401 →
  RagPatientEngine fallback ke StaticPatientEngine yang **crash** di kasus
  RAG (`responses` undefined) → bubble kosong; **+** LLM sesekali balas
  `content` kosong → reply "". Fix: `patient-engine.js` re-auth tamu +
  **retry sekali** pada gagal, **buang fallback Static utk RAG** → pesan
  graceful (bukan crash/empty), guard Static; `llm.py` fallback
  `reasoning`/`reasoning_content` + treat konten kosong sbg transient
  (di-retry `_with_retry`). pytest 56 hijau. **(b) §3A diperluas
  (aditif/opsional, back-compat):** `EvaluationInput += ddx,
  managementPlan`; `EvaluationReport += summary` (narasi LLM ringkas).
  `/api/scoring/evaluate` terima `ddx`/`management_plan`; evaluator
  menyertakannya ke prompt judge + hasilkan `summary` (apa dilakukan,
  bagus, kurang). **(c) DebriefScreen** tampilkan narasi LLM (summary +
  positiveNotes + missedItems) — komponen/token design existing, **zero
  design.css baru** (invarian §8.1 tetap; CSS hash `index-Bj97HpXF.css`).
  **(d) Skill Heatmap** (dashboard) diperjelas (angka + bar + label
  kualitatif) dari data nyata; **Profil rata-rata nilai** via
  `scoreHistory` §5.4 (persist localStorage). Implementasi
  bertahap-terverifikasi (debrief → heatmap/profil); status di HANDOFF.
- `0.11.0` (2026-05-17): **PIVOT (keputusan user): Exam Simulator DICABUT
  dari flow.** Setelah ditinjau user, exam-sim dinilai tak sesuai
  (design/UX) & tak diperlukan di alur anamnesis. **(a)** K6 (v0.10.1)
  di-revert penuh: 4 edit inline App + `engine/exam-engine.js` dari
  `LOAD_ORDER` dikembalikan → `Virtual Patient Simulator.html` &
  `bundle-legacy.mjs` **byte-identical original** (terverifikasi git diff
  kosong + CSS hash `index-Bj97HpXF.css`). File **disimpan dorman** (tak
  dihapus): `sistemnya/exam-sim/`, backend domain `exam`, sidecar
  `data-kasus/_exam/`, `engine/exam-engine.js` — TIDAK di-bundle/di-wire.
  Kontrak §3B/§5.9/§6 exam & E1 tetap tercatat sbg historis tapi
  **flow-nya superseded**. **(b) Flow kanonik baru:** `Anamnesis → DDx →
  **Rencana Tatalaksana** → Debrief`. Step **Rencana Tatalaksana** (baru,
  `learning-extras.jsx`, design **identik** DDxCommitScreen — token CSS
  var existing, komponen `Btn/Card`, **tanpa design.css baru**): mahasiswa
  rekomendasi **pemeriksaan penunjang** + **terapi/obat**; tersimpan di
  `session.managementPlan`. **(c) Debrief = narasi LLM:** surface
  `EvaluationReport` (§3A) `missedItems`/`positiveNotes` + penjelasan
  (apa yg dilakukan, kurang/bagus) di DebriefScreen pakai design existing;
  managementPlan disertakan ke evaluasi LLM. **(d) Skill Heatmap**
  (dashboard) diperjelas (angka + bar + label kualitatif), data nyata.
  **(e) Profil:** rata-rata nilai (butuh persist skor-history di Profile
  §5.4 — field baru `scoreHistory[]`). **WAJIB design SAMA PERSIS**
  landing/dashboard/cases (token+komponen existing; zero design.css baru —
  invarian §8.1 tetap). Implementasi bertahap-terverifikasi; status di
  HANDOFF. **Catatan §5.4:** Profile + `scoreHistory:[{ts,caseId,score}]`
  (aditif, opsional, localStorage + backend bila ada).
- `0.10.1` (2026-05-17): **K6 dieksekusi — exam-sim masuk alur legacy
  (seam aditif).** Bukan keputusan kontrak baru; implementasi §9 K6 yg
  sudah dijadwalkan. **Perubahan perilaku:** kasus RAG yang dulu
  *auto-skip exam* (Changelog 0.7.0) kini, bila `window.OphthaExam`
  tersedia, route ke screen baru `examsim` → mount exam-sim terisolasi
  (Shadow DOM) → `onExit` jalankan skor RAG + debrief (urutan lama
  dipertahankan, di-ekstrak `ragScoreThenDebrief`). 4 edit aditif inline
  App (pola C1 terjadwal): `examHostRef`+callback, effect mount/unmount,
  routing `{screen==='examsim'}` (inline-style, **tanpa class
  design.css**), `isExamSim`→`hideHeader`. **Fallback-safe:** OphthaExam
  absen / mount gagal / tak ada RAG session → `ragScoreThenDebrief()`
  (perilaku lama persis, tak dead-end). **Diverifikasi asisten:** main
  app build hijau + **CSS hash TETAP `index-Bj97HpXF.css`** (§8.1/§3B.4
  utuh; `design.css`/markup screen lain byte-identical) + exam-sim build
  + pytest 56. **WAJIB diverifikasi user (tak bisa asisten):** (a)
  runtime browser flow ANAMNESIS→DDx→**EXAM(exam-sim)**→DEBRIEF dgn
  backend hidup; (b) **deployment**: `dist/exam-sim/` (hasil build
  `sistemnya/exam-sim`) harus terlayani di `<app>/exam-sim/exam-sim.js`
  atau set `window.OPHTHA_EXAM_BUNDLE` — dynamic import path environmental,
  bukan bug kode.
- `0.10.0` (2026-05-17): **Modul Exam Simulator — kontrak ditetapkan (E1).**
  Rekonsiliasi `all-plan/ophtha-exam-simulator-unified-plan.md` v1.0.
  (a) **§3B** seam `ExamEngine` (Static legacy/dev vs Api; selector pola
  C1) — alur ANAMNESIS→DDx→EXAM→DEBRIEF tak berubah. (b) **Scoring exam
  TERPISAH** dari Evaluator §3A (`ExamScoringReport`; bobot per-station
  plan §7.3 dinormalisasi 100; nilai = temuan + adherence prosedur).
  Komposisi sesi total = tertunda (§9 K7). (c) **§3B.3 PENGECUALIAN
  ber-scope diizinkan user**: exam-sim boleh stack maksimal (React18+TS+
  Vite+Zustand+FramerMotion/SVG+Pixi.js v8+R3F/GLSL+GSAP+Tailwind scoped;
  Pixi v8; Ishihara procedural IP-safe). (d) **§3B.4 invarian ISOLASI
  WAJIB** (pelindung §8.1): paket terpisah `sistemnya/exam-sim/`, deps
  berat tak masuk bundle legacy, Shadow DOM (CSS tak bocor 2 arah), hash
  `index-Bj97HpXF.css` main app TETAP, integrasi seam+flag. §8.1 +
  KLARIFIKASI v0.10.0. (e) **§5.9 `ExamFindings`** = sidecar
  `data-kasus/_exam/kasus-XX.json` (cermin §5.7 `_disclosure/`; tak edit
  22 .md kanonik; default aman bila absen; **draf asisten → dokter
  validasi**); sumber kanonik = Bagian A `### 5`. (f) **§6** +3 endpoint
  session-gated (`/exam-findings`, `/exam`, `/exam-report`). (g) §9 +K5/
  K6/K7. **Implementasi v0.10.0 (TUNTAS — sistem lengkap):** backend
  domain `exam` (schemas/loader/scorer/router) + skor kondisional
  amsler/ishihara/fluorescein (terpisah dari examTotalScore) + pilot
  sidecar kasus-02 (draf) + 10 tests (pytest 56 passed). Paket exam-sim
  terisolasi + **10 station plan §5 SEMUA jadi**: VA, Pupil/RAPD
  (SVG+Framer+GSAP), Motilitas, Lapang Pandang, Amsler, Ishihara
  (prosedural IP-safe), Tonometri (Goldmann), Slit-Lamp (skematik L2 **+**
  volumetrik R3F/GLSL L4 lazy + fallback), Fundoskopi (Pixi L3 lazy),
  Fluorescein (Pixi L3 lazy). Code-split lazy nyata (Pixi/R3F chunk
  terpisah, init GPU ditunda). Seam `engine/exam-engine.js` di LOAD_ORDER
  (pola C1, dormant). **Verified:** exam-sim build hijau; **CSS hash main
  app TETAP `index-Bj97HpXF.css`** (invarian §8.1/§3B.4 terbukti).
  **Ditunda eksplisit (terjadwal, bukan utang tersembunyi):** (1) call-site
  DOM legacy memanggil `window.OphthaExam.mount` = **§9 K6**, di-gate
  verifikasi browser + butuh slot markup (perubahan area dilindungi →
  review §8.1). (2) 21 sidecar `_exam` sisa + **validasi dokter** semua
  konten (§5.9). (3) Asset pipeline foto fundus nyata (plan §8; kini
  ilustrasi prosedural, dilabel jujur §9.2). (4) Komposisi skor sesi total
  (§9 K7). (5) Verifikasi browser exam-sim (build-verified saja; butuh
  backend hidup + sesi + token).
- `0.9.0` (2026-05-16): **Security/production hardening pass.** Dikerjakan:
  (a) **prod-guard fail-fast** — `ENV in {prod,staging}` + config tak aman
  (JWT secret default/<32B, DATABASE_URL sqlite, CORS `*`, key kosong) →
  app TOLAK start; di dev hanya warn. (b) **Security headers** middleware
  (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, HSTS saat prod). (c) **Rate limiter** in-memory
  sliding-window pada endpoint sensitif (auth login/signup, ai/transcribe,
  scoring/evaluate) → 429 bila lewat batas. (d) `.env.example` panduan
  secret kuat + rotate. (e) Hygiene: cek tak ada secret hardcoded di
  source; `.env` gitignored. **Ditunda (infra/kamu, terdokumentasi):**
  rotate 3 key bocor (OpenRouter/Groq/ElevenLabs — HANYA kamu, di
  dashboard), rate-limit Redis terdistribusi (multi-instance), refresh
  token → HttpOnly cookie (ubah alur frontend), provisioning Postgres +
  uji deploy Docker, secrets manager (Vault/cloud), guest-auth flag.
- `0.8.3` (2026-05-16): **Auto-speak wired.** `ConversationPanel` effect:
  pesan `role:'patient'` baru → `window.OphthaVoice.speak()` otomatis
  (loop voice lengkap: STT→teks→TTS). Aditif, gated `voiceOn`, di-skip saat
  `recording` (echo dasar; PTT manual jadi risiko echo rendah). Graceful
  bila TTS gagal. Tidak ubah markup/design.css. **Tetap ditunda:** VAD
  auto-detect (Silero), echo-prevention penuh (pause VAD saat TTS),
  toggle suara di Settings, verifikasi mic nyata oleh user (browser).
- `0.8.2` (2026-05-16): **TTS ElevenLabs aktif & verified live** (key benar;
  5 sampel suara dibuat di `backend/tts-samples/`: Liam/Charlie/Adam/Josh/
  Brian, kalimat pasien ID, `eleven_multilingual_v2`). `TTS_VOICE_ID`
  provisional = Liam (`TX3LPaxmHKxFdv7VOQHJ`) — **final voice menunggu
  user dengar sampel & pilih** (asisten tak bisa menilai audio). Endpoint
  `/api/ai/tts` non-501 (configured) → 200 audio / 502 rapi bila error
  provider. Test diperbaiki (not-configured = unit monkeypatch; configured
  = degradasi bersih). Suite 41 passed. Per-kasus voice (gender/usia sesuai
  persona) = refinement lanjutan.
- `0.8.1` (2026-05-16): **STT=Groq, terverifikasi live** (`whisper-large-v3
  -turbo`, base `api.groq.com/openai/v1`, HTTP 200 — vs OpenRouter 500).
  **Slice frontend voice (Push-to-Talk):** `engine/voice-engine.js`
  (AudioCapture MediaRecorder + `transcribeBlob`→/api/ai/transcribe +
  `speak`→/api/ai/tts graceful) + tombol mic ADITIF di `ConversationPanel`
  (pakai komponen `Btn` existing + token existing; muncul hanya bila
  backend dikonfigurasi → mode offline/dummy tak berubah; record→STT→isi
  input→kirim via path existing). design.css TIDAK diubah; markup hanya
  +1 kontrol konsisten (seam terjadwal). **Ditunda:** VAD auto-detect
  (Silero), echo-prevention, auto-speak balasan (TTS output) — butuh
  ElevenLabs key + browser+mic; voice-plan §5/§8/§10. **Batas verifikasi
  jujur:** alur mic nyata tak bisa diuji headless; STT/TTS endpoint +
  build terverifikasi.
- `0.8.0` (2026-05-16): **Fase 4 dimulai — backend STT/TTS slice.**
  `/api/ai/transcribe` (Whisper via OpenAI-compatible, default base
  OpenRouter + key sama, model `openai/whisper-large-v3-turbo`, lang id +
  prompt medis, MD5 dedup guard 5s, butuh auth) & `/api/ai/tts`
  (ElevenLabs, env-driven; 501 jelas bila `TTS_API_KEY` kosong) gantikan
  stub 501. Provider-agnostic: `STT_BASE_URL/STT_API_KEY/STT_MODEL`,
  `TTS_*`. **Caveat jujur:** OpenRouter = router LLM chat; bila tak dukung
  `/audio/transcriptions`, set `STT_BASE_URL` ke endpoint Whisper
  OpenAI-compatible (mis. Groq) — config, bukan kode. **Ditunda (slice
  Fase 4 berikut):** frontend voice — MediaRecorder + Silero VAD + dedup
  client + PTT fallback + echo-prevention + `VoicePatientEngine` (butuh
  browser+mic nyata; voice-pipeline plan). Gate Fase 4 = matriks
  cross-browser voice-plan §9. **PROBE LIVE (terbukti):** OpenRouter
  `/audio/transcriptions` → **HTTP 500** (OpenRouter = router LLM-chat,
  tak punya Whisper). Kode STT benar & provider-agnostic; **STT terblokir
  provider** sampai `STT_BASE_URL`+`STT_API_KEY` diarahkan ke endpoint
  Whisper OpenAI-compatible nyata (mis. Groq `https://api.groq.com/openai/v1`
  + key Groq, atau OpenAI `/v1` + key OpenAI). Config-only, BUKAN kode.
  TTS ElevenLabs siap, nonaktif sampai `TTS_API_KEY` diisi. Backend slice
  (endpoint+auth+dedup+test) hijau 40 passed.
- `0.7.3` (2026-05-16): **UX loading saat `/evaluate`** (follow-up v0.7.2).
  Inline App: state `evaluating` → overlay loading App-level (ADITIF, pakai
  komponen existing `Overlay`+`LoadingDots`, token CSS existing — markup
  komponen & design.css TIDAK diubah) selama fetchRagScoring berjalan,
  lalu navigate debrief. `evaluation-bridge.js`: AbortController timeout
  ~75s → null (debrief tetap lanjut, tak menggantung selamanya).
- `0.7.2` (2026-05-16): **2 sub-step C3 dieksekusi.** (1) Verifikasi/wiring
  tombol kirim chat simulator dgn RagPatientEngine (seam sudah balik bentuk
  kompatibel — verifikasi browser, fix hanya bila ada bug nyata). (2) Skor
  debrief kasus RAG via `POST /api/scoring/evaluate`: expose RAG sessionId
  (`patient-engine.js`), bridge evaluasi (modul engine), inline App map
  `EvaluationReport`§3A → bentuk `scoring` lama sebelum `navigate('debrief')`
  (DebriefScreen tak dirombak; markup byte-identical). Edit terjadwal:
  `patient-engine.js`, modul engine baru, inline App; `simulator.jsx` hanya
  bila bug nyata. **VERIFIED browser:** (1) kirim via tombol "Kirim" →
  balasan RAG nyata ("Mata saya merah, sudah 4 hari ini", non-stub,
  answer-restrained); seam sudah kompatibel → `simulator.jsx` TIDAK diubah.
  (2) Akhiri→DDx Lewati→`/api/scoring/evaluate`→DebriefScreen tampil
  **44/100 "Perlu Latihan"** (skor LLM-judge nyata; kasus RAG sebelumnya 0).
  Modul baru `engine/evaluation-bridge.js` + `getRagSessionId`. design.css
  byte-identical. **Caveat jujur (follow-up):** `/evaluate` lambat (~25–40s,
  LLM-judge deepseek, tanpa timeout/loading) → user diam di layar DDx; bukan
  bug korektnes, perlu loading-state/timeout (sub-step UX berikutnya).
- `0.7.1` (2026-05-16): **C3 diverifikasi live di browser** (uvicorn+vite,
  user otorisasi). Terbukti: Vite env→`OPHTHA_API_BASE`, CORS, selector→
  RagPatientEngine; **C2 auth nyata** (signup→token→dashboard di UI);
  **Library 22 kasus backend** Title-cased, filter bucket benar; simulator
  kasus RAG **tanpa bubble keluhan kalengan**; **jalur RAG penuh**
  (auto-guest→/api/sessions→/turns→deepseek) balas answer-restrained nyata
  ("Mata saya merah sejak 4 hari", non-stub). **Bug ditemukan & diperbaiki
  via verifikasi:** backend `EmailStr` tolak TLD `.local` (422) → email
  auto-guest diubah `@ophtha-guest.com` (+ adapter set `stage`/`caseType`
  default agar 22 kasus tampil di filter library). design.css byte-identical
  (CSS hash tetap). **Ditunda (sub-step C3 berikut):** wiring tombol kirim
  chat UI legacy (detail DOM, bukan deliverable C3 — jalur engine sudah
  terbukti via fetch+pytest) & **debrief skor via `/api/scoring/evaluate`**
  (DebriefScreen terkopel bentuk skor statis; perlu pemetaan hati-hati +
  iterasi browser) — eksplisit, bukan utang tersembunyi.
- `0.7.0` (2026-05-16): **C3 dikerjakan (diverifikasi browser, user
  otorisasi server).** Scope: (a) `engine/case-adapter.js` map
  `CaseSummary`→bentuk Case UI (Title-case judul, SKDI→difficulty, persona
  netral "Pasien Virtual" — Bagian B tetap server-only, no `responses`,
  `correctDiagnosis`=judul). (b) `VITE_API_BASE`→`window.OPHTHA_API_BASE`
  (header bundler + `sistemnya/.env`). (c) Bootstrap async: API aktif →
  `GET /api/cases` → adapt → isi global `CASES` (dummy `case-00X` dipensiun
  saat API aktif; fallback dummy bila API mati). (d) `simulator.jsx`: kasus
  RAG (chiefComplaint kosong) → TIDAK seed bubble keluhan kalengan (dokter
  harus menggali — inti answer-restraint). (e) Debrief skor kasus RAG via
  `POST /api/scoring/evaluate` (Evaluator §3A). (f) Exam stations auto-skip
  utk kasus RAG (sudah: guard `EXAM_FINDINGS[id]`). design.css/markup
  byte-identical. Edit terjadwal: `case-adapter.js`(baru), bundler header,
  inline App (bootstrap+debrief), `simulator.jsx` (init seed).
- `0.6.1` (2026-05-16): **Klarifikasi user:** `CASES` Inggris legacy =
  dummy dev, BUKAN konten dilindungi (§8.1) — boleh dipensiun di C3.
  **C2 dikerjakan, scope:** `LoginScreen` autentikasi nyata via
  `DataStore.login/signup` saat `OPHTHA_API_BASE` di-set (fallback mock
  offline); markup/CSS byte-identical. **Ditunda dalam C2:** refactor
  `loadProfile` sinkron→async di App (struktural, risiko tanpa browser,
  nilai marginal sebelum C3) — eksplisit, bukan utang tersembunyi.
- `0.6.0` (2026-05-16): **Cutover frontend dijadwalkan bertahap C1/C2/C3**
  (lihat §4). C1 dikerjakan: `engine/patient-engine.js` dapat
  `RagPatientEngine` (panggil backend sessions+turn, streaming opsional) +
  `createPatientEngine()` selector (`OPHTHA_API_BASE` → RAG, else Static
  fallback). C2 (auth async) & C3 (CaseSummary + exam/scoring server-driven)
  tetap ditunda — C3 = potongan terberat (UI terkopel data statis),
  perlu browser + gate dokter. design.css/markup tetap byte-identical.
- `0.5.2` (2026-05-16): **Disclosure layers diparkir sengaja.** 6 sidecar
  di-draf (kasus-01,02,09,10,16,17 di `data-kasus/_disclosure/`); 16 sisa
  (kasus-03–08,11–15,18–22) **ditunda menunggu diskusi/validasi dokter
  mata** — keputusan user: cukup untuk kembangkan sistem (pipeline
  case-agnostic; kasus-02 sudah validasi mekanisme QA 9 PASS). Bukan utang
  terlupa; resume kapan saja, file-based.
- `0.5.1` (2026-05-16): Provider LLM = **OpenRouter** default (OpenAI-compat,
  `vendor/model`); `llm.py` dukung openrouter/openai/anthropic via env.
  **Pisah model**: persona `LLM_MODEL` (kuat) vs judge `LLM_JUDGE_MODEL`
  (murah, rag-plan §9.1). **QA harness** prompt-plan §10 (A1–A7/B/C/D) =
  pra-skrining gate Fase 3 (auto-skip saat StubLLM; bukan pengganti
  validasi 3-dokter). Tanpa kontrak shape berubah.
- `0.5.0` (2026-05-16): **Fase 3 core.** (a) PromptBuilder answer-restraint
  (prompt-plan §4/§5/§6) + sliding-window memory. (b) `LlmClient` abstraksi
  (§9 K2): `StubLlmClient` deterministik (default, no key) + adapter provider
  nyata via env (`LLM_PROVIDER`/`LLM_API_KEY`). (c) Retrieval Bagian A:
  BM25 (`rank_bm25`, tanpa infra) + isolasi per-kasus; dense+RRF (Qdrant)
  pluggable, ditunda. (d) `RagPatientEngine` ganti stub Fase 2 di
  `/api/sessions/{id}/turns` + WS. (e) `LlmJudgeEvaluator` →
  `/api/scoring/evaluate` (bentuk §3A; LLM stub now). (f) Disclosure draf =
  **sidecar** `data-kasus/_disclosure/` (§5.7); kasus-02 exemplar. (g)
  Ditunda eksplisit: key LLM nyata · dense/Qdrant · 21 disclosure + review
  dokter · cutover FE→CaseSummary · QA 3-dokter (gate Fase 3).
- `0.4.0` (2026-05-16): **Fase 2 lanjut.** (a) **Alembic** = mekanisme
  migrasi skema resmi (baseline + perubahan berversi); `init_db()` create_all
  tetap untuk bootstrap dev/test (idempotent, tak meng-alter). (b)
  `ApiDataStore` + `createDataStore()` di `engine/data-store.js` (selector
  via `window.OPHTHA_API_BASE`; Local = fallback). (c) Cutover call-site
  struktural sinkron→async (profile/auth React) **eksplisit ditunda** ke
  increment berikut (berpasangan dengan layar auth nyata) — lihat §4.
  (d) Postgres/Qdrant/Redis tetap default-tertunda (§9) sesuai pemicunya.
- `0.3.0` (2026-05-16): **Rekonsiliasi 4 plan + 4 keputusan fork.**
  (a) Scoring kanonik = LLM-judge post-session (rubrik 40/20/20/20), tambah
  kontrak `Evaluator` §3A; bobot frontend lama superseded. (b) `PatientEngine`
  §3 di-redesain **streaming** (`onChunk`/`signal`); `detectedDomain` tak lagi
  mengikat scoring. (c) Konten kanonik = 22 markdown; tambah `CaseSummary`
  §5.6 + kontrak file markdown §5.7 (rag-plan §2 + `### 0 Disclosure Layers`
  prompt-plan); hardcoded EN dipensiun saat cutover Fase 3. (d) Disclosure
  Layers 22 kasus: di-draf asisten, divalidasi dokter (Fase 3).
  (e) Endpoint §6 disatukan ke penamaan backend-plan + WebSocket protokol;
  endpoint lama superseded. (f) §5.8 answer-restraint = syarat lulus Fase 3.
  (g) §9 keputusan tertunda + default. Roadmap §7 ditulis ulang.
- `0.2.0` (2026-05-16): Fase 1 dijadwalkan resmi — seam refactor
  `simulator.jsx` (`handleSend`/`handleSendStable` → `PatientEngine`),
  `DataStore`+`LocalDataStore` diperkenalkan (adopsi inkremental),
  modul `engine/patient-engine.js` & `engine/data-store.js`.
- `0.1.0` (2026-05-16): Dokumen awal — `PatientEngine`, `DataStore`,
  data model, REST API, roadmap. Migrasi Vite jalan, mesin pasien statis.
