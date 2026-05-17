# Backend Tech Stack: Rekomendasi & Diskusi
**OphthaSim — Virtual Patient Simulator**
**Sifat dokumen**: Diskusi strategis, bukan keputusan final
**Versi**: 1.0 | **Tanggal**: 2025-05-16

---

## Daftar Isi

1. [Pemetaan Kebutuhan Backend](#1-pemetaan-kebutuhan-backend)
2. [Apa yang Sudah Ada & Apa yang Perlu Dibangun](#2-apa-yang-sudah-ada--apa-yang-perlu-dibangun)
3. [Tiga Opsi Arsitektur Utama](#3-tiga-opsi-arsitektur-utama)
4. [Perbandingan Tradeoff](#4-perbandingan-tradeoff)
5. [Rekomendasi: Opsi A dengan Strategi Modular](#5-rekomendasi-opsi-a-dengan-strategi-modular)
6. [Arsitektur Detail Opsi yang Direkomendasikan](#6-arsitektur-detail-opsi-yang-direkomendasikan)
7. [Database Strategy](#7-database-strategy)
8. [Auth Strategy](#8-auth-strategy)
9. [Deployment Path: Dev → Staging → Enterprise](#9-deployment-path-dev--staging--enterprise)
10. [Risiko & Mitigasi](#10-risiko--mitigasi)
11. [Keputusan yang Harus Dibuat Tim](#11-keputusan-yang-harus-dibuat-tim)

---

## 1. Pemetaan Kebutuhan Backend

Dari membaca kode HTML + konteks diskusi sebelumnya, ini seluruh yang harus dilayani backend:

### 1.1 Fitur yang Sudah Ada di Frontend (Perlu Backend)

| Fitur | Kondisi Saat Ini | Backend yang Dibutuhkan |
|---|---|---|
| Auth (login/signup) | `localStorage` — tidak aman, tidak persistent antar device | Auth service + JWT |
| User profile (nama, NIM, avatar) | `localStorage` | User CRUD API |
| XP, badge, streak | `localStorage` | Gamification service |
| Completed cases, session history | `localStorage` | Session persistence API |
| Daily challenge | `localStorage` + client-side logic | Scheduler + API |
| Favorite cases | `localStorage` | User preference API |
| Case builder (buat kasus baru) | `localStorage` | Case CRUD + storage |
| Settings | `localStorage` | User preference API |

### 1.2 Fitur AI/Voice (Core Platform)

| Fitur | Status | Backend yang Dibutuhkan |
|---|---|---|
| Simulasi pasien virtual (LLM) | Ada (production, tapi detail tidak di file ini) | LLM inference + RAG pipeline |
| STT (voice input mahasiswa) | Bermasalah (lihat dokumen voice pipeline) | Whisper STT service |
| TTS (suara pasien menjawab) | Ada (browser-based) | TTS service (opsional upgrade) |
| RAG retrieval (Bagian A kasus) | Ada | Qdrant + embedding service |
| Scoring engine post-session | Ada (client-side) | Scoring API + LLM evaluator |

### 1.3 Fitur Baru yang Dibutuhkan saat Scale (Enterprise)

| Fitur | Prioritas | Deskripsi |
|---|---|---|
| Dashboard dosen | Tinggi | Lihat progress mahasiswa, assign kasus, review scoring |
| Manajemen institusi | Tinggi | Multi-tenant: ITB, UI, UGM bisa punya instance sendiri |
| Analytics | Tinggi | Kasus mana yang sering gagal, mahasiswa mana yang perlu intervensi |
| Export laporan | Sedang | PDF/Excel hasil OSCE per mahasiswa |
| Notifikasi | Sedang | Reminder daily challenge, feedback dari dosen |
| Case content management | Sedang | Admin bisa upload/edit kasus tanpa sentuh code |

---

## 2. Apa yang Sudah Ada & Apa yang Perlu Dibangun

```
SEKARANG (semua client-side):
┌─────────────────────────────────┐
│       Browser (React SPA)       │
│  • Auth (localStorage)          │
│  • User state (localStorage)    │
│  • Case data (hardcoded JS)     │
│  • Scoring (client logic)       │
│  • LLM calls (langsung ke API)  │
└─────────────────────────────────┘

TARGET (proper backend):
┌─────────────────────────────────┐
│     Vite + React + TypeScript   │
│     (SPA, no sensitive state)   │
└──────────────┬──────────────────┘
               │ HTTPS / WSS
               ▼
┌─────────────────────────────────┐
│          BACKEND                │
│  • Auth & user management       │
│  • Session & scoring storage    │
│  • AI pipeline (STT/LLM/RAG)    │
│  • Case management              │
│  • Analytics                    │
└─────────────────────────────────┘
```

**Implikasi penting:** Backend ini bukan hanya AI service. Ia juga full application backend yang mengelola user, session, dan data. Ini mempengaruhi pilihan framework secara signifikan.

---

## 3. Tiga Opsi Arsitektur Utama

### Opsi A: Python Monolith — FastAPI

Satu backend Python yang menangani semua: auth, user data, AI pipeline, scoring, analytics.

```
Vite Frontend (TypeScript)
        │
        ▼
FastAPI (Python) ─── PostgreSQL (user, session, cases)
    ├── Auth module           │
    ├── User/profile module   ├── Qdrant (vector DB)
    ├── Session module        │
    ├── AI module             └── Redis (cache, rate limit)
    │   ├── Whisper STT
    │   ├── RAG (LlamaIndex)
    │   └── LLM calls
    ├── Scoring module
    └── Analytics module
```

**Cocok untuk:** Tim yang nyaman dengan Python, MVP ke production cepat, AI-first prioritas.

---

### Opsi B: Node.js Backend (NestJS) + Python AI Service

Dua service terpisah: NestJS untuk aplikasi web, Python (FastAPI) khusus AI.

```
Vite Frontend (TypeScript)
        │
        ├── REST/WebSocket → NestJS (TypeScript)
        │                       ├── Auth & JWT
        │                       ├── User/profile CRUD
        │                       ├── Session management
        │                       ├── Gamification
        │                       └── Proxy → AI Service
        │
        └── AI calls via NestJS → FastAPI (Python)
                                    ├── Whisper STT
                                    ├── RAG pipeline
                                    ├── LLM orchestration
                                    └── Scoring engine
```

**Cocok untuk:** Tim dengan TypeScript expertise, ingin type-safety end-to-end, atau ada existing Node.js codebase.

---

### Opsi C: Hybrid BFF Pattern — Hono (Edge) + Python AI

Hono sebagai thin Backend for Frontend di edge (Cloudflare Workers / Vercel), Python sebagai AI core.

```
Vite Frontend (TypeScript)
        │
        ▼
Hono BFF (Edge / Cloudflare Workers)
    ├── Auth (via Clerk/Supertokens)
    ├── Routing & caching
    ├── User preference (via KV store)
    └── Proxy → Python AI service
                    ├── Whisper STT
                    ├── RAG + LLM
                    └── Scoring

PostgreSQL (via PlanetScale / Neon)
```

**Cocok untuk:** Ingin global edge latency, serverless, minimal DevOps. Tapi paling eksperimental.

---

## 4. Perbandingan Tradeoff

### 4.1 Tabel Perbandingan Langsung

| Dimensi | Opsi A (FastAPI Monolith) | Opsi B (NestJS + FastAPI) | Opsi C (Hono Edge + Python) |
|---|---|---|---|
| **Kecepatan development awal** | ✅ Tercepat (1 codebase) | ⚠️ Lebih lambat (2 codebase) | ⚠️ Medium (infra edge baru) |
| **Type safety dengan frontend TS** | ⚠️ Manual (Pydantic → OpenAPI → TS client) | ✅ Sangat baik (full TS) | ✅ Baik (Hono + Zod) |
| **AI/ML integration** | ✅ Native (semua Python) | ⚠️ Butuh IPC antar service | ⚠️ Butuh proxy ke Python |
| **Skalabilitas horizontal** | ⚠️ Butuh lebih banyak config | ✅ NestJS mature untuk scale | ✅ Edge auto-scale |
| **WebSocket / streaming** | ✅ Didukung (ASGI) | ✅ Sangat baik (NestJS native) | ⚠️ Terbatas di edge |
| **Auth & user management** | ⚠️ Butuh library tambahan | ✅ NestJS ecosystem sangat lengkap | ⚠️ Bergantung third-party |
| **Database ORM** | ⚠️ SQLAlchemy (verbose) | ✅ Prisma / TypeORM (developer-friendly) | ⚠️ Terbatas di edge |
| **Admin panel** | ✅ SQLAdmin / FastAPI-admin tersedia | ✅ NestJS + admin banyak opsi | ❌ Sulit, tidak cocok |
| **DevOps complexity** | ✅ 1 container | ⚠️ 2 containers + orchestration | ⚠️ Mixed: edge + container |
| **Talent pool** | ⚠️ Python backend dev | ✅ TS dev lebih banyak | ❌ Hono masih niche |
| **Cocok untuk enterprise** | ✅ OpenAI, Netflix pakai FastAPI | ✅ Enterprise NestJS sangat mature | ⚠️ Bergantung edge infra |
| **Cost efisiensi saat scale** | ✅ Self-host GPU Whisper | ✅ Bisa mixed | ⚠️ Bisa mahal di edge |

### 4.2 Tradeoff Kritis yang Perlu Dipikirkan

**Tentang Python vs TypeScript:**

Argumen terkuat untuk tetap di Python adalah bahwa semua library AI kelas satu — Whisper, LlamaIndex, SentenceTransformers, Qdrant client, OpenAI SDK — ada di Python dan mature. Versi Node.js-nya sering tertinggal atau ada gap fitur.

Argumen terkuat untuk TypeScript di backend adalah bahwa lo sudah punya frontend TypeScript, jadi type sharing antar layer bisa dilakukan (shared types, tRPC, dll). Ini signifikan mengurangi bugs di boundary API.

Cara reconcile keduanya: **Opsi B** memberikan yang terbaik dari keduanya, tapi dengan biaya kompleksitas lebih tinggi. Pertanyaannya: seberapa besar tim yang ada?

**Tentang monolith vs microservice:**

Di tahap ini, monolith jauh lebih tepat. FastAPI meninggalkan keputusan arsitektur ke developer, yang bisa jadi risiko jika tidak diimbangi dengan desain modular yang ketat dari awal — tapi ini bisa dimitigasi dengan folder structure yang benar. Microservice hanya masuk akal setelah ada masalah konkret yang tidak bisa diselesaikan monolith (biasanya di atas 50+ concurrent users dengan beban AI yang tinggi).

**Tentang Opsi C (Edge):**

Hono di Cloudflare Workers sangat menarik untuk latency global, tapi ada limitasi fundamental: Workers tidak bisa menjalankan proses berat (Whisper, embedding model) — semua harus di-offload ke external service. Ini membuat biaya meningkat signifikan dan dependency ke third-party lebih tinggi. Tidak direkomendasikan untuk fase awal.

---

## 5. Rekomendasi: Opsi A dengan Strategi Modular

### Rekomendasi Utama

**FastAPI (Python) sebagai backend utama**, dengan struktur modular yang dirancang dari awal untuk bisa dipecah jadi microservice nanti jika dibutuhkan.

Alasan utama (berdasarkan konteks sistem ini):

**1. Gravitasi ekosistem AI tidak bisa dihindari.**
Seluruh AI stack — Whisper, LlamaIndex, multilingual-e5-large, Qdrant client, scoring LLM — adalah Python. Memaksa semua ini berjalan via proxy dari Node.js hanya menambah latency dan kompleksitas tanpa benefit nyata di tahap ini.

**2. Satu codebase untuk tim kecil.**
Dua codebase (NestJS + FastAPI) berarti dua deployment pipeline, dua set dependency, dua debugging environment. Untuk tim thesis/research yang mungkin hanya 2-3 orang, ini overhead yang tidak perlu.

**3. FastAPI sudah digunakan OpenAI di production.**
FastAPI leads ML model serving, data engineering APIs, dan Python-first SaaS backends — dan OpenAI menjalankan FastAPI di production mereka. Ini bukan framework eksperimental.

**4. Type safety bisa dicapai dengan cara lain.**
FastAPI dengan Pydantic memberikan compile-time-like validation yang kuat, dan dari schema OpenAPI yang dihasilkan otomatis, bisa di-generate TypeScript client untuk frontend secara otomatis (via `openapi-typescript` atau `orval`). Type safety end-to-end tetap bisa dicapai.

### Catatan: Kapan Bermigrasi ke Opsi B

Pertimbangkan migrasi ke Opsi B (tambah NestJS layer) jika:
- Tim backend tumbuh dan ada dedicated TS developer
- Fitur non-AI (auth, notifikasi, billing, admin) berkembang jauh lebih besar dari AI pipeline
- Butuh real-time features (live collaboration, instructor monitoring real-time) yang lebih cocok di Node.js event loop

---

## 6. Arsitektur Detail Opsi yang Direkomendasikan

### 6.1 Struktur Proyek (Domain-Based, bukan Layer-Based)

```
backend/
├── app/
│   ├── main.py                   # FastAPI app, middleware, router mounting
│   ├── config.py                 # Settings (pydantic-settings, .env)
│   ├── database.py               # SQLAlchemy engine, session factory
│   │
│   ├── domains/
│   │   ├── auth/
│   │   │   ├── router.py         # POST /auth/login, /auth/signup, /auth/refresh
│   │   │   ├── service.py        # Business logic: hash, verify, generate JWT
│   │   │   ├── models.py         # SQLAlchemy models: User
│   │   │   └── schemas.py        # Pydantic: LoginRequest, TokenResponse
│   │   │
│   │   ├── users/
│   │   │   ├── router.py         # GET/PATCH /users/me, /users/{id}
│   │   │   ├── service.py        # Profile update, XP/badge logic
│   │   │   ├── models.py         # SQLAlchemy: UserProfile, Badge, UserBadge
│   │   │   └── schemas.py        # Pydantic: ProfileResponse, XPUpdateRequest
│   │   │
│   │   ├── cases/
│   │   │   ├── router.py         # GET /cases, GET /cases/{id}
│   │   │   ├── service.py        # Case registry, filtering, access control
│   │   │   ├── models.py         # SQLAlchemy: Case, CaseVersion
│   │   │   └── schemas.py        # Pydantic: CaseResponse, CaseListResponse
│   │   │
│   │   ├── sessions/
│   │   │   ├── router.py         # POST /sessions, PATCH /sessions/{id}
│   │   │   ├── service.py        # Session lifecycle, scoring
│   │   │   ├── models.py         # SQLAlchemy: Session, ConversationTurn
│   │   │   └── schemas.py        # Pydantic: SessionStartRequest, TurnRequest
│   │   │
│   │   ├── ai/
│   │   │   ├── router.py         # POST /ai/chat, POST /ai/transcribe, POST /ai/tts
│   │   │   ├── llm_service.py    # LLM calls, persona injection, RAG pipeline
│   │   │   ├── rag_service.py    # Qdrant retrieval, hybrid search
│   │   │   ├── stt_service.py    # Whisper transcription
│   │   │   ├── tts_service.py    # TTS (browser native atau server-side)
│   │   │   └── schemas.py        # Pydantic: ChatRequest, TranscribeResponse
│   │   │
│   │   ├── scoring/
│   │   │   ├── router.py         # POST /scoring/evaluate
│   │   │   ├── service.py        # LLM-as-judge scoring, report generation
│   │   │   └── schemas.py        # Pydantic: ScoringRequest, ScoringReport
│   │   │
│   │   └── analytics/            # Fase 2+
│   │       ├── router.py         # GET /analytics/student/{id}, /analytics/cases
│   │       └── service.py        # Aggregation queries, cohort analysis
│   │
│   ├── shared/
│   │   ├── dependencies.py       # Dependency injection: get_db, get_current_user
│   │   ├── middleware.py         # CORS, rate limiting, request logging
│   │   ├── exceptions.py         # Custom HTTP exceptions
│   │   └── security.py           # JWT utilities
│   │
│   └── workers/                  # Celery tasks (async background jobs)
│       ├── celery_app.py
│       ├── ingest_case.py        # Auto-ingest markdown kasus baru
│       └── scoring_task.py       # Async scoring setelah sesi selesai
│
├── alembic/                      # Database migrations
├── tests/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### 6.2 Full Stack Diagram

```
┌──────────────────────────────────────────────────┐
│        Vite + React + TypeScript (Frontend)       │
│  Auto-generated TS client dari OpenAPI schema     │
└────────────────────┬─────────────────────────────┘
                     │ HTTPS / WSS
                     ▼
              ┌─────────────┐
              │    Nginx    │  ← SSL termination, static files, reverse proxy
              └──────┬──────┘
                     │
            ┌────────▼────────┐
            │  FastAPI (ASGI)  │
            │  Gunicorn +      │
            │  Uvicorn workers │
            └───┬──────────┬───┘
                │          │
      ┌─────────▼──┐  ┌────▼──────────┐
      │ PostgreSQL  │  │     Redis      │
      │ (Primary DB)│  │ Cache + Queue  │
      └─────────────┘  └───────┬────────┘
                               │
                    ┌──────────▼─────────┐
                    │  Celery Workers     │
                    │  (Background tasks) │
                    │  - Case ingestion   │
                    │  - Async scoring    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼─────────┐
                    │  AI Services        │
                    │  - Whisper (GPU)    │
                    │  - LlamaIndex RAG   │
                    │  - LLM API calls    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼─────────┐
                    │     Qdrant          │
                    │  (Vector Store)     │
                    └─────────────────────┘
```

### 6.3 API Endpoint Design

```
Authentication:
POST   /api/auth/signup          → Register mahasiswa baru
POST   /api/auth/login           → Return access + refresh token
POST   /api/auth/refresh         → Rotate access token
POST   /api/auth/logout

Users:
GET    /api/users/me             → Profile + XP + badges + stats
PATCH  /api/users/me             → Update profile
GET    /api/users/me/sessions    → Riwayat sesi (pagination)

Cases:
GET    /api/cases                → List kasus (filter: organ, skdi, difficulty)
GET    /api/cases/{id}           → Detail kasus (tanpa Bagian B yang private)
POST   /api/cases                → Admin: tambah kasus baru
PATCH  /api/cases/{id}           → Admin: update kasus

Sessions:
POST   /api/sessions             → Mulai sesi baru, return session_id
GET    /api/sessions/{id}        → Get session state
POST   /api/sessions/{id}/turns  → Kirim 1 turn (transcript + response)
PATCH  /api/sessions/{id}        → Update status (active → completed)

AI:
POST   /api/ai/chat              → LLM inference + RAG (return text response)
POST   /api/ai/transcribe        → Audio blob → transcript (Whisper)
POST   /api/ai/tts               → Text → audio blob (opsional)

Scoring:
POST   /api/scoring/evaluate     → Evaluate session, return scoring report

Analytics (Fase 2+):
GET    /api/analytics/dashboard  → Agregat statistik mahasiswa
GET    /api/analytics/cases      → Kasus mana yang sering gagal
```

### 6.4 WebSocket untuk Chat Real-Time

Untuk simulasi pasien yang responsif, gunakan WebSocket di `/api/sessions/{id}/ws`:

```python
# Contoh WebSocket handler di FastAPI
@router.websocket("/sessions/{session_id}/ws")
async def session_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Validasi session
    session = await get_session(session_id)
    if not session:
        await websocket.close(code=4004)
        return

    try:
        while True:
            # Terima pesan dari frontend
            data = await websocket.receive_json()
            
            if data["type"] == "audio":
                # Transcribe
                transcript = await stt_service.transcribe(data["audio"])
                await websocket.send_json({"type": "transcript", "text": transcript})
            
            elif data["type"] == "text":
                # RAG + LLM → stream response
                async for chunk in llm_service.stream_response(
                    session, data["text"]
                ):
                    await websocket.send_json({"type": "chunk", "text": chunk})
                
                await websocket.send_json({"type": "turn_complete"})

    except WebSocketDisconnect:
        await save_session_state(session_id)
```

---

## 7. Database Strategy

### 7.1 PostgreSQL sebagai Primary DB

**Tidak ada alasan untuk tidak pakai PostgreSQL dari awal.** SQLite untuk production platform multi-user adalah risiko (write lock, no concurrent writes). PostgreSQL gratis, battle-tested, dan bisa dihost di mana saja.

Schema utama:

```sql
-- Users
users (id UUID PK, email, hashed_password, nim, full_name, institution, role, created_at)
user_profiles (user_id FK, xp INT, streak INT, avatar_url, settings JSONB)
user_badges (user_id FK, badge_id TEXT, earned_at)

-- Cases
cases (id TEXT PK, title_id, title_en, icd10, skdi, organ_system, 
       difficulty, tags TEXT[], is_active, collection_name, metadata JSONB)

-- Sessions
sessions (id UUID PK, user_id FK, case_id FK, mode TEXT, 
          started_at, ended_at, status TEXT, metadata JSONB)
session_turns (id UUID PK, session_id FK, turn_number INT,
               role TEXT, content TEXT, retrieved_chunks JSONB, created_at)
scoring_reports (session_id FK, total_score INT, breakdown JSONB,
                 missed_items JSONB, created_at)

-- Analytics (denormalized untuk query cepat)
daily_stats (user_id FK, date DATE, cases_attempted INT, 
             avg_score FLOAT, xp_gained INT)
```

### 7.2 Redis untuk Caching & Rate Limiting

| Kegunaan | Key Pattern | TTL |
|---|---|---|
| Cache persona (Bagian B) per kasus | `persona:{case_id}` | 1 jam |
| Rate limit per user | `ratelimit:{user_id}:{endpoint}` | 1 menit |
| Session state aktif (hot data) | `session:{session_id}` | 2 jam |
| Dedup audio hash | `dedup:{md5_hash}` | 5 detik |
| Daily challenge cache | `daily:{date}` | 24 jam |

### 7.3 Qdrant untuk Vector Store

Tetap dengan strategi per-collection per kasus seperti yang dibahas di strategic plan RAG. PostgreSQL hanya menyimpan metadata kasus; konten vector ada di Qdrant.

---

## 8. Auth Strategy

Saat ini auth adalah `localStorage` — ini harus diganti sepenuhnya. Tapi strateginya perlu dipikirkan matang karena ada dua tier user: mahasiswa dan dosen/admin.

### 8.1 Opsi Auth

**Opsi 1: Custom JWT (build sendiri)**
- Full control
- Bisa implementasi role-based access (mahasiswa, dosen, admin, institusi)
- Butuh implementasi: hashing, JWT, refresh token rotation, email verification
- Waktu: ~2-3 hari implementasi yang benar

**Opsi 2: Supertokens (self-hosted)**
- Open source, self-hosted → data tidak keluar
- Punya Python/FastAPI SDK yang bagus
- Handle: session management, MFA, email verification, password reset
- Cocok untuk enterprise (bisa SSO/SAML nanti)
- Waktu: ~4 jam setup

**Opsi 3: Auth0 / Clerk (cloud)**
- Tercepat setup
- Tapi data auth di vendor → tidak ideal untuk platform medis/pendidikan institusional
- Mahal saat scale (Auth0 pricing per MAU)

**Rekomendasi:** Mulai dengan **custom JWT** (lebih paham sistemnya sendiri, tidak ada external dependency), kemudian jika complexity auth tumbuh (SSO institusi, OAuth), migrasi ke Supertokens.

### 8.2 Role Hierarchy

```
SuperAdmin (Anthropic / Platform owner)
    └── InstitutionAdmin (Admin ITB, Admin UI)
            └── Instructor (Dosen, dr. pembimbing)
                    └── Student (Mahasiswa)
```

Implikasi pada akses:
- Student: hanya bisa akses kasus yang di-assign ke mereka/cohort-nya
- Instructor: lihat semua session mahasiswanya, review scoring
- InstitutionAdmin: manage user dalam institusinya
- SuperAdmin: semua

---

## 9. Deployment Path: Dev → Staging → Enterprise

### Phase 1: Dev / MVP (1-2 orang, < 50 user)

**Target:** Sistem berjalan, bisa dipakai ujicoba dengan mahasiswa nyata.

```
Stack minimal:
- FastAPI + Uvicorn (1 worker)
- PostgreSQL (Railway / Supabase free tier)
- Qdrant (self-host Docker, 1 container)
- Whisper API (OpenAI, $0.006/menit — tidak perlu GPU dulu)
- LLM: OpenAI API atau Groq (Llama 3.3 70B)
- Deploy: Railway / Render (free tier atau $5/bulan)

Docker Compose untuk local dev:
  services: fastapi, postgres, redis, qdrant
```

Estimasi biaya: **$0–20/bulan** di fase ini.

---

### Phase 2: Staging / Beta (3-5 orang dev, 50–500 user)

**Target:** Platform stabil, multiple institusi, dosen bisa pantau.

```
Tambahan:
- Whisper: Self-host pada GPU (RunPod / Vast.ai ~$0.3/jam on-demand)
  atau upgrade ke OpenAI gpt-4o-transcribe (lebih akurat)
- Celery + Redis untuk background jobs (scoring async)
- PostgreSQL managed (Supabase Pro / Railway Pro)
- Nginx sebagai reverse proxy
- Monitoring: Sentry (error tracking) + Prometheus + Grafana (metrics)
- Deploy: VPS (DigitalOcean $24/bulan, 4 vCPU 8GB)

Docker Compose + 1 VPS:
  services: nginx, fastapi (2 workers), celery, redis, postgres, qdrant
```

Estimasi biaya: **$50–150/bulan** tergantung GPU usage.

---

### Phase 3: Production / Scale (team 5+, 500–5000 user)

**Target:** Enterprise grade, SLA, multi-tenant, high availability.

```
Arsitektur:
- Kubernetes (GKE / EKS / self-hosted k3s)
- FastAPI: 3+ pods, horizontal pod autoscaler
- PostgreSQL: managed (Google Cloud SQL / AWS RDS, multi-AZ)
- Redis: managed (Redis Cloud / Elasticache)
- Qdrant: dedicated cluster
- Whisper: dedicated GPU service (self-host atau Deepgram Nova-3 Medical API)
- LLM: dedicated instance atau enterprise API (Azure OpenAI / Anthropic)
- CDN: Cloudflare untuk frontend static assets
- Monitoring: Datadog / New Relic + Sentry
- CI/CD: GitHub Actions → Docker registry → Kubernetes rolling deploy
- Secrets: Vault / AWS Secrets Manager

Tambahan enterprise:
- Multi-tenant: row-level security di PostgreSQL per institution_id
- SSO: SAML/OAuth via Supertokens Enterprise
- Audit log: setiap aksi user di-log untuk compliance
- GDPR/PDPA compliance: data residency, right to deletion
- Uptime SLA: 99.9% dengan health checks dan auto-restart
```

Estimasi biaya: **$500–2000+/bulan** tergantung skala.

---

## 10. Risiko & Mitigasi

| Risiko | Likelihood | Impact | Mitigasi |
|---|---|---|---|
| **Python GIL bottleneck** pada concurrent LLM calls | Medium | Medium | Gunakan async await untuk I/O bound; offload CPU-bound ke Celery workers |
| **Whisper latency** terlalu tinggi (~3-8 detik per utterance) | High | High | Self-host Whisper turbo dengan GPU, atau Deepgram streaming (sub-500ms) |
| **LLM cost** meledak saat scale | Medium | High | Implement caching (semantic cache untuk pertanyaan mirip), rate limiting per user per hari |
| **Qdrant data loss** jika node restart | Medium | High | Enable Qdrant persistence + scheduled backup ke object storage |
| **PostgreSQL migration hell** | Low | High | Pakai Alembic dari hari pertama, semua schema change via migration, tidak ada raw ALTER di production |
| **Auth token leak** | Low | Critical | HttpOnly cookie untuk refresh token, short-lived access token (15 menit), HTTPS only |
| **Persona data leak** antar kasus | Low | High | Isolasi collection Qdrant per kasus, session context selalu dicek di backend |
| **Overfitting prompt ke satu model LLM** | Medium | Medium | Abstraksi LLM layer, bisa swap model dengan minimal code change |

### Tentang Whisper Latency (Risiko Paling Kritis)

Ini perlu dibahas lebih dalam. Whisper large-v3 pada CPU bisa 30-60 detik untuk audio 15 detik. Pada GPU A10G, turun ke 1-3 detik. Untuk simulasi percakapan yang terasa natural, target latency STT harus **< 2 detik**.

Opsi:
1. **Self-host Whisper turbo + GPU**: Latency 1-2 detik, kontrol penuh, butuh GPU server
2. **Groq Whisper API**: [Sub-second latency](https://groq.com), $0.001/menit, sangat cepat — tapi data audio dikirim ke Groq
3. **Deepgram streaming**: Real-time streaming transcription, sub-500ms first token, $0.0077/menit — paling cepat tapi paling mahal
4. **OpenAI gpt-4o-transcribe**: Akurasi terbaik, pricing per karakter output

Untuk konteks medis Indonesia: **Groq Whisper + `initial_prompt` medical terms** adalah sweet spot harga-performa untuk phase 1-2.

---

## 11. Keputusan yang Harus Dibuat Tim

Ini yang perlu didiskusikan dan diputuskan sebelum mulai coding backend:

### Keputusan 1: Apakah Whisper di-host sendiri atau pakai API?

| | Self-host (GPU) | Groq API | OpenAI API |
|---|---|---|---|
| Latency | 1-2 detik | < 1 detik | 2-5 detik |
| Cost | ~$0.3/jam GPU | $0.001/menit | $0.006/menit |
| Data privacy | ✅ Data tidak keluar | ⚠️ Data ke Groq | ⚠️ Data ke OpenAI |
| Setup complexity | Tinggi | Rendah | Rendah |

**Konteks penting:** Ini platform medis pendidikan. Audio transkrip percakapan "dokter-pasien" mungkin dianggap sensitif oleh institusi. Perlu konfirmasi apakah ada kebijakan data residency dari institusi mitra.

---

### Keputusan 2: LLM mana untuk patient persona?

| | GPT-4o | Claude 3.5 Sonnet | Llama 3.3 70B (Groq) | Gemini 1.5 Pro |
|---|---|---|---|---|
| Roleplay consistency | ✅ Sangat baik | ✅ Sangat baik | ⚠️ Baik | ✅ Baik |
| Bahasa Indonesia | ✅ Baik | ✅ Baik | ⚠️ Cukup | ✅ Baik |
| Answer restraint | ⚠️ Perlu tuning | ✅ Lebih patuh | ⚠️ Perlu tuning | ⚠️ Perlu tuning |
| Cost per 1M token | $2.5/$10 | $3/$15 | $0.59/$0.79 | $1.25/$5 |
| Latency | Sedang | Sedang | ✅ Cepat (Groq) | Sedang |
| Data residency | ⚠️ OpenAI server | ⚠️ Anthropic server | ⚠️ Groq server | ⚠️ Google server |

**Rekomendasi diskusi:** Untuk phase 1, Claude 3.5 Sonnet atau GPT-4o — keduanya paling patuh pada instruksi answer restraint yang complex. Groq Llama lebih murah tapi perlu lebih banyak prompt tuning.

---

### Keputusan 3: Multi-tenant dari awal atau satu institusi dulu?

Jika target adalah platform nasional (ITB + UI + UGM + dll), arsitektur multi-tenant harus dirancang dari awal. Menambah multi-tenancy setelah sistem berjalan sangat painful (row-level security, data isolation, billing per institusi).

**Rekomendasi:** Rancang schema dengan `institution_id` dari hari pertama, meski awalnya hanya ada satu institusi. Biaya overhead sangat kecil tapi benefit jangka panjang besar.

---

### Keputusan 4: Apakah butuh real-time instructor monitoring?

Fitur "dosen bisa lihat session mahasiswa secara live" butuh WebSocket dengan pub/sub pattern (Redis Pub/Sub atau Server-Sent Events). Kalau tidak direncanakan dari awal, sulit ditambah nanti.

**Jika ya:** Butuh Redis Pub/Sub + SSE endpoint, add ke architecture dari awal.
**Jika tidak (untuk sekarang):** Cukup polling atau post-session dashboard.

---

*Dokumen ini adalah titik awal diskusi, bukan keputusan final. Update setelah alignment tim tentang keputusan di Section 11.*

**Last updated:** 2025-05-16
