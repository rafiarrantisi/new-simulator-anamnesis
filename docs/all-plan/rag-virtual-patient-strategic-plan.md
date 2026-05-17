# Strategic Plan: RAG-Based Virtual Patient Simulator for Anamnesis
**Dokumen Acuan Arsitektur & Implementasi**
**Versi**: 1.0 | **Status**: Living Document

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Struktur Data & Konvensi File](#2-struktur-data--konvensi-file)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Strategi RAG](#4-strategi-rag)
5. [Ingestion Pipeline](#5-ingestion-pipeline)
6. [Case Registry](#6-case-registry)
7. [Simulation Engine](#7-simulation-engine)
8. [Scoring & Evaluasi](#8-scoring--evaluasi)
9. [Tech Stack](#9-tech-stack)
10. [Roadmap Implementasi](#10-roadmap-implementasi)
11. [Panduan Scaling](#11-panduan-scaling)
12. [Keputusan Desain Kritis](#12-keputusan-desain-kritis)

---

## 1. Ringkasan Eksekutif

### Tujuan Sistem
Membangun platform simulasi virtual patient berbasis RAG untuk latihan anamnesis mahasiswa kedokteran. Mahasiswa berinteraksi secara percakapan dengan pasien virtual yang ditenagai LLM, sementara sistem secara paralel memvalidasi dan mengevaluasi kualitas anamnesis yang dilakukan.

### Prinsip Desain Utama

| Prinsip | Implikasi |
|---|---|
| **Isolasi per kasus** | Tidak ada kebocoran informasi antar kasus selama simulasi |
| **Skalabilitas dari awal** | Arsitektur yang sama harus bisa handle 10 kasus maupun 500 kasus |
| **Format file sebagai kontrak** | Konsistensi markdown adalah fondasi seluruh pipeline otomatis |
| **Dua peran data yang berbeda** | Bagian A = RAG knowledge base. Bagian B = System prompt langsung |
| **Evaluasi berbasis bukti** | Scoring mahasiswa mengacu ke checklist eksplisit dari Bagian A |

### Batasan Scope Dokumen Ini
Dokumen ini mencakup arsitektur RAG, pipeline data, dan strategi simulasi. Tidak mencakup desain UI/UX, autentikasi pengguna, dan infrastruktur deployment (dibahas terpisah).

---

## 2. Struktur Data & Konvensi File

### 2.1 Format Penamaan File

```
kasus-{XX}-{slug-diagnosis}.md
```

**Contoh:**
```
kasus-01-appendisitis-akut.md
kasus-02-konjungtivitis-viral.md
kasus-15-diabetes-melitus-tipe2.md
kasus-27-tuberkulosis-paru.md
```

**Aturan:**
- `XX` selalu dua digit dengan leading zero (01, 02, ..., 99). Tiga digit (001) saat kasus > 99.
- Slug menggunakan huruf kecil dan tanda hubung, tanpa spasi atau karakter khusus.
- Nama file adalah sumber kebenaran untuk `case_id`. Parser mengekstrak langsung dari nama file.

### 2.2 Struktur Internal Markdown (Kontrak Format)

Setiap file kasus **wajib** mengikuti struktur header berikut secara persis. Deviasi dari struktur ini akan menyebabkan parser gagal.

```markdown
# KASUS {XX}: {NAMA DIAGNOSIS} ({ENGLISH NAME})

Dokumen ini terdiri dari dua bagian utama:
1. **BAGIAN A (DATA MEDIS)**: ...
2. **BAGIAN B (PERSONA PASIEN)**: ...

---

## BAGIAN A: DATA MEDIS & KLINIS (KNOWLEDGE BASE)

**Referensi Utama**: {referensi}

### 1. Diagnosis Kerja
### 2. Patofisiologi & Etiologi
### 3. Faktor Risiko
### 4. Temuan Klinis — Anamnesis
### 5. Temuan Klinis Objektif (Pemeriksaan Fisik)
### 6. Pemeriksaan Penunjang
### 7. Diagnosis Banding
### 8. Komplikasi
### 9. Tatalaksana
### 10. Kriteria Rujukan ke Spesialis

---

## BAGIAN B: PERSONA PASIEN (SYSTEM PROMPT)

### 1. IDENTITAS & PROFIL (PATIENT PROFILE)
### 2. ATURAN KOMUNIKASI (PERSONA CONSTRAINTS)
### 3. KONDISI SAAT INI (CURRENT PRESENTATION)
### 4. RIWAYAT PENYAKIT SEKARANG — OLDCARTS
### 5. TINJAUAN SISTEM (REVIEW OF SYSTEMS)
### 6. RIWAYAT PENYAKIT DAHULU (PAST HISTORY)
### 7. RIWAYAT PENGOBATAN (DRUG HISTORY)
### 8. RIWAYAT KELUARGA (FAMILY HISTORY)
### 9. RIWAYAT SOSIAL & LINGKUNGAN (SOCIAL HISTORY)
### 10. FIFE (PERSPEKTIF PASIEN)
```

> **⚠️ PENTING**: Urutan section, penulisan header (`##` dan `###`), dan nama section adalah kontrak antara penulis konten dan sistem. Jangan diubah tanpa update pada parser secara bersamaan.

### 2.3 Metadata yang Diekstrak dari File

Parser akan mengekstrak metadata berikut dari setiap file secara otomatis:

```python
{
    "case_id": "02",                          # dari nama file
    "filename": "kasus-02-konjungtivitis-viral.md",
    "title": "Konjungtivitis Viral",           # dari header # KASUS XX: {TITLE}
    "title_en": "Viral Conjunctivitis",        # dari header, bagian dalam kurung
    "icd10": "H10.3",                          # dari baris **Referensi Utama**
    "skdi": "4A",                              # dari ### 1. Diagnosis Kerja
    "organ_system": "Mata",                    # diisi manual atau via LLM tagging
    "tags": ["infeksi", "viral", "akut"],      # diisi manual atau via LLM tagging
    "difficulty": "beginner",                  # diisi manual
    "references": ["MCW Ophthalmic Case Study #2", "PNPK PERDAMI"],
    "ingested_at": "2025-05-16T10:00:00Z",
    "collection_name": "kasus_02",
    "chunk_count": 10,                         # diisi setelah chunking
    "bagian_b_token_count": 2847               # diisi setelah parsing
}
```

Metadata yang tidak bisa diekstrak otomatis (`organ_system`, `tags`, `difficulty`) harus diisi via **sidecar file** atau header YAML frontmatter yang ditambahkan di atas file.

---

## 3. Arsitektur Sistem

### 3.1 Diagram Arsitektur Keseluruhan

```
/cases/ (file repository)
    kasus-02-konjungtivitis-viral.md
    kasus-07-appendisitis-akut.md
    ...
           │
           ▼ (Ingestion Pipeline — otomatis)
    ┌──────────────────────────────────────┐
    │            LAYER DATA                │
    │                                      │
    │  ┌─────────────┐  ┌───────────────┐  │
    │  │Case Registry│  │  Vector Store │  │
    │  │  (SQLite/   │  │   (Qdrant)    │  │
    │  │  PostgreSQL)│  │               │  │
    │  │             │  │ col:kasus_02  │  │
    │  │  metadata,  │  │ col:kasus_07  │  │
    │  │  tags,      │  │ col:...       │  │
    │  │  catalog    │  │               │  │
    │  └──────┬──────┘  └───────┬───────┘  │
    └─────────┼─────────────────┼──────────┘
              │                 │
              ▼                 ▼
    ┌──────────────────────────────────────┐
    │         SIMULATION ENGINE            │
    │                                      │
    │  ┌──────────────┐ ┌───────────────┐  │
    │  │  Pasien LLM  │ │ Validator RAG │  │
    │  │  (Bagian B   │ │  (Bagian A    │  │
    │  │  as System   │ │  from Vector  │  │
    │  │  Prompt)     │ │  Store)       │  │
    │  └──────┬───────┘ └───────┬───────┘  │
    │         │                 │           │
    │  ┌──────▼─────────────────▼───────┐  │
    │  │     Conversation Memory        │  │
    │  │   (per session, ephemeral)     │  │
    │  └────────────────────────────────┘  │
    │                                      │
    │  ┌────────────────────────────────┐  │
    │  │        Scoring Engine          │  │
    │  │  (post-session evaluation)     │  │
    │  └────────────────────────────────┘  │
    └──────────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │              UI LAYER                │
    │  Chat interface + Session Report     │
    └──────────────────────────────────────┘
```

### 3.2 Prinsip Isolasi Kasus

**Rule paling kritis:** Selama satu sesi simulasi, retrieval RAG **hanya boleh** menjangkau collection milik kasus yang sedang aktif.

```python
# BENAR — retrieval terisolasi
retriever = qdrant.as_retriever(collection_name=f"kasus_{session.case_id}")

# SALAH — retrieval lintas kasus, tidak boleh terjadi
retriever = qdrant.as_retriever(collection_name="all_cases")
```

Setiap sesi simulasi membawa `session_context` yang menyimpan:
- `case_id` — kunci untuk memilih collection
- `session_id` — UUID unik per sesi
- `student_id` — identitas mahasiswa
- `conversation_history` — riwayat percakapan sesi ini
- `timestamp_start` — waktu mulai sesi

---

## 4. Strategi RAG

### 4.1 Pembagian Peran Data

| | Bagian A | Bagian B |
|---|---|---|
| **Nama** | Data Medis & Klinis | Persona Pasien |
| **Masuk ke** | Vector Store (di-chunk & di-embed) | System Prompt LLM (injeksi penuh) |
| **Digunakan saat** | Validasi jawaban pasien + scoring | Setiap LLM call selama sesi |
| **Metode akses** | Hybrid retrieval (BM25 + dense) | Injeksi langsung ke context window |
| **Perlu RAG?** | ✅ Ya | ❌ Tidak |

> **Alasan Bagian B tidak masuk RAG:** Bagian B adalah instruksi perilaku yang harus selalu aktif dan konsisten sepanjang sesi. Meretrieve-nya sebagian justru berbahaya karena bisa membuat persona tidak konsisten. Ukurannya (~2.000–4.000 token) masih sangat aman untuk masuk context window penuh.

### 4.2 Chunking Strategy untuk Bagian A

Gunakan **Hierarchical Section-Based Chunking** — split berdasarkan `### N.` header, bukan fixed token window.

```
Bagian A
├── Chunk A1 — Diagnosis Kerja (+ definisi, etiologi, SKDI)
├── Chunk A2 — Patofisiologi & Etiologi
├── Chunk A3 — Faktor Risiko
├── Chunk A4 — Temuan Klinis Anamnesis ⭐ (paling sering di-retrieve)
├── Chunk A5 — Temuan Fisik Objektif (tabel slit lamp, tanda vital, dll)
├── Chunk A6 — Pemeriksaan Penunjang
├── Chunk A7 — Diagnosis Banding ⭐ (kritis untuk validasi)
├── Chunk A8 — Komplikasi
├── Chunk A9 — Tatalaksana
└── Chunk A10 — Kriteria Rujukan
```

Setiap chunk diberikan metadata berikut sebelum di-embed:

```python
{
    "case_id": "02",
    "collection": "kasus_02",
    "section_index": 4,
    "section_name": "temuan_klinis_anamnesis",
    "diagnosis": "Konjungtivitis Viral",
    "icd10": "H10.3",
    "skdi": "4A",
    "text": "..." # isi chunk
}
```

**Catatan chunking:**
- Jangan split tabel (tabel diagnosis banding, tabel slit lamp) ke chunk terpisah — tetap satu unit.
- Jika satu section sangat panjang (> 800 token), split per sub-heading dengan overlap 50 token.
- Minimum chunk size: 100 token. Chunk terlalu kecil kehilangan konteks.

### 4.3 Embedding Model

**Rekomendasi:** `intfloat/multilingual-e5-large`

Alasan:
- Dilatih pada data multilingual termasuk Bahasa Indonesia
- Performa lebih baik dari `text-embedding-ada-002` OpenAI untuk teks campur Indonesia-Inggris
- Open source, dapat di-host sendiri untuk privasi data pasien
- Dimensi 1024, balance antara kualitas dan biaya storage

Alternatif jika ada budget API: `text-embedding-3-large` (OpenAI) — lebih mudah setup tapi data dikirim ke server OpenAI.

### 4.4 Retrieval Strategy: Hybrid BM25 + Dense

Gunakan hybrid retrieval, bukan pure semantic search.

**Mengapa hybrid untuk data ini:**
- Mahasiswa sering pakai istilah medis spesifik: "limfadenopati preaurikular", "discharge purulen" → BM25 lebih presisi untuk exact term matching
- Mahasiswa juga sering parafrase: "ada benjolan di depan telinga nggak?" → Dense embedding lebih baik menangkap semantik
- Campuran Bahasa Indonesia dan istilah Latin medis butuh dua pendekatan sekaligus

```
Query mahasiswa/validator
        │
   ┌────┴────┐
   │         │
BM25      Dense
retriever  retriever
   │         │
   └────┬────┘
        │
   Reciprocal Rank Fusion (RRF)
        │
   Top-K chunks (k=3 default)
        │
   [Opsional] Cross-encoder Reranker
        │
   Final context untuk LLM
```

**Parameter default:**
- BM25 weight: 0.4
- Dense weight: 0.6
- Top-K per retriever: 5 (sebelum fusi)
- Final K setelah fusi: 3

### 4.5 Kapan RAG Di-trigger

RAG **tidak di-trigger untuk setiap turn** percakapan — hanya pada kondisi berikut:

| Trigger | Deskripsi |
|---|---|
| **Validasi real-time** | Saat pasien LLM akan menjawab pertanyaan yang menyangkut fakta klinis spesifik (gejala, obat, diagnosis) |
| **Scoring post-session** | Setelah sesi selesai, sistem evaluate coverage anamnesis mahasiswa |
| **Red flag detection** | Jika mahasiswa menanyakan sesuatu yang berkaitan dengan kriteria rujukan atau kondisi darurat |

Jawaban casual percakapan (sapaan, klarifikasi pertanyaan, ekspresi emosi) tidak perlu retrieval — Bagian B sudah cukup.

---

## 5. Ingestion Pipeline

### 5.1 Struktur Direktori Repository

```
/
├── cases/                          # Source of truth semua kasus
│   ├── kasus-01-appendisitis-akut.md
│   ├── kasus-02-konjungtivitis-viral.md
│   └── ...
├── pipeline/                       # Kode ingestion
│   ├── parser.py                   # Parser markdown → chunks + metadata
│   ├── embedder.py                 # Embed chunks ke vector store
│   ├── registry.py                 # Update case registry
│   └── ingest.py                   # Entrypoint pipeline
├── registry/
│   └── case_registry.db            # SQLite (fase awal)
└── config/
    └── ingestion_config.yaml       # Config embedding model, Qdrant URL, dll
```

### 5.2 Alur Ingestion

```
File .md baru ditambahkan ke /cases/
        │
        ▼
1. DETECT — Watcher/CI mendeteksi file baru atau berubah
        │
        ▼
2. PARSE — parser.py
   ├── Ekstrak metadata dari nama file & konten
   ├── Split Bagian A dan Bagian B
   ├── Chunk Bagian A per section header
   └── Validasi format (error jika ada section yang hilang)
        │
        ▼
3. EMBED — embedder.py
   ├── Encode setiap chunk Bagian A dengan multilingual-e5-large
   ├── Buat collection baru di Qdrant: "kasus_{XX}"
   │   └── Jika sudah ada → delete & recreate (untuk update)
   └── Upsert semua chunks beserta metadata
        │
        ▼
4. REGISTER — registry.py
   ├── Insert/update record di case_registry
   └── Update field: chunk_count, bagian_b_token_count, ingested_at
        │
        ▼
5. VERIFY — cek sederhana
   ├── Query test retrieval ke collection baru
   └── Konfirmasi record ada di registry
        │
        ▼
✅ Kasus siap digunakan di platform
```

### 5.3 Trigger Ingestion

**Fase awal (< 50 kasus):** Jalankan manual via CLI
```bash
python pipeline/ingest.py --file cases/kasus-02-konjungtivitis-viral.md
python pipeline/ingest.py --all  # re-ingest semua file
```

**Fase scale (50+ kasus):** GitHub Actions trigger otomatis
```yaml
# .github/workflows/ingest.yml
on:
  push:
    paths:
      - 'cases/**.md'
jobs:
  ingest:
    steps:
      - run: python pipeline/ingest.py --changed
```

### 5.4 Validasi Format Sebelum Ingestion

Parser wajib memvalidasi format sebelum proses berlanjut. Jika validasi gagal, pipeline berhenti dan kirim notifikasi error.

**Checklist validasi:**
- [ ] Nama file sesuai konvensi `kasus-XX-slug.md`
- [ ] Header `## BAGIAN A:` ditemukan
- [ ] Header `## BAGIAN B:` ditemukan
- [ ] Semua 10 section `### N.` di Bagian A ada
- [ ] Section `### 1. IDENTITAS & PROFIL` di Bagian B ada
- [ ] File tidak kosong (minimum 1000 karakter)

---

## 6. Case Registry

### 6.1 Schema Registry

```sql
CREATE TABLE cases (
    case_id         TEXT PRIMARY KEY,       -- "02"
    filename        TEXT NOT NULL,          -- "kasus-02-konjungtivitis-viral.md"
    title_id        TEXT NOT NULL,          -- "Konjungtivitis Viral"
    title_en        TEXT,                   -- "Viral Conjunctivitis"
    icd10           TEXT,                   -- "H10.3"
    skdi            TEXT,                   -- "4A"
    organ_system    TEXT,                   -- "Mata"
    difficulty      TEXT,                   -- "beginner" | "intermediate" | "advanced"
    tags            TEXT,                   -- JSON array: ["infeksi","viral","akut"]
    collection_name TEXT NOT NULL,          -- "kasus_02" (nama collection di Qdrant)
    chunk_count     INTEGER,
    bagian_b_tokens INTEGER,
    references      TEXT,                   -- JSON array referensi klinis
    is_active       BOOLEAN DEFAULT TRUE,   -- false = kasus didisable tanpa dihapus
    ingested_at     DATETIME,
    updated_at      DATETIME,
    created_at      DATETIME DEFAULT NOW()
);
```

### 6.2 Penggunaan Registry

Registry digunakan untuk:
- **Halaman katalog kasus** — browse, filter, search kasus tersedia
- **Assignment kasus** ke mahasiswa atau kelompok
- **Filter kurikulum** — tampilkan hanya kasus SKDI 4A untuk kelas tertentu
- **Disabling kasus** — set `is_active = FALSE` tanpa menghapus data dari vector store
- **Audit** — lacak kapan kasus diupdate dan berapa kali digunakan

Registry **tidak digunakan** untuk retrieval konten klinis — itu urusan vector store.

---

## 7. Simulation Engine

### 7.1 Inisialisasi Sesi

Saat mahasiswa memilih kasus dan memulai sesi:

```python
session = {
    "session_id": uuid4(),
    "student_id": student.id,
    "case_id": "02",
    "collection_name": "kasus_02",
    "conversation_history": [],
    "timestamp_start": now(),
    "status": "active"
}

# Load Bagian B dari file (bukan dari vector store)
persona_prompt = load_bagian_b(case_id="02")

# Lock retriever ke collection kasus ini
retriever = qdrant_client.as_retriever(
    collection_name=session["collection_name"],
    search_kwargs={"k": 3}
)
```

### 7.2 Flow Setiap Turn Percakapan

```
Mahasiswa kirim pertanyaan
        │
        ▼
1. Tambahkan ke conversation_history
        │
        ▼
2. Klasifikasi intent (sederhana, rule-based):
   ├── "casual/emotional" → skip RAG
   └── "clinical question" → lanjut ke langkah 3
        │
        ▼
3. [Jika clinical] Retrieve relevant chunks dari Bagian A
   (hybrid BM25 + dense, locked ke collection kasus ini)
        │
        ▼
4. Compose prompt ke Pasien LLM:
   ┌─────────────────────────────────────────┐
   │ SYSTEM: {isi Bagian B penuh}            │
   │                                         │
   │ CONTEXT (jika ada):                     │
   │ Fakta klinis yang relevan:              │
   │ {retrieved chunks dari Bagian A}        │
   │ Pastikan jawabanmu konsisten dengan     │
   │ fakta di atas. Tetap gunakan bahasa     │
   │ awam, jangan sebut istilah medis.       │
   │                                         │
   │ HISTORY: {conversation_history}         │
   │                                         │
   │ USER: {pertanyaan mahasiswa}            │
   └─────────────────────────────────────────┘
        │
        ▼
5. Pasien LLM generate jawaban
        │
        ▼
6. Tambahkan jawaban ke conversation_history
        │
        ▼
7. Tampilkan ke mahasiswa
```

### 7.3 Conversation Memory

Gunakan **sliding window memory** dengan summarization:

```
Turn 1–10  : simpan penuh (verbatim) di history
Turn 11+   : summarize turn lama ke 1 paragraf,
             tetap simpan 5 turn terakhir verbatim
```

Ini mencegah context window overflow saat sesi panjang, sambil tetap menjaga kontinuitas percakapan.

### 7.4 Aturan yang Tidak Boleh Dilanggar Pasien LLM

Tambahkan rules ini ke akhir System Prompt Bagian B sebagai guardrail:

```
RULES SYSTEM (jangan tampilkan ke pasien):
- Jangan pernah menyebut diagnosis sendiri
- Jangan menyebut istilah medis Latin/Inggris kecuali dokter sebut duluan
- Jika ditanya sesuatu yang tidak ada di riwayat, jawab "tidak tahu" atau
  "tidak ada keluhan itu Dok" — jangan mengarang
- Jika mahasiswa meminta pemeriksaan fisik, respond dengan deskripsi
  awam apa yang bisa diobservasi, bukan data numerik (numerik hanya
  diberikan oleh sistem/narrator, bukan pasien)
- Tetap dalam karakter meski pertanyaan aneh atau tidak relevan
```

---

## 8. Scoring & Evaluasi

### 8.1 Dimensi Penilaian

Scoring dilakukan **setelah sesi selesai**, bukan real-time (agar tidak mengganggu flow percakapan).

| Dimensi | Bobot | Deskripsi |
|---|---|---|
| **Coverage Anamnesis** | 40% | Seberapa banyak item OLDCARTS + ROS + FH + SH yang ditanyakan |
| **FIFE Exploration** | 20% | Apakah mahasiswa mengeksplorasi perspektif pasien (perasaan, ide, dampak, harapan) |
| **Red Flag Screening** | 20% | Apakah mahasiswa menanyakan red flags yang relevan |
| **Komunikasi** | 20% | Empati, urutan pertanyaan logis, tidak memotong, bahasa jelas |

### 8.2 Metode Scoring Coverage (RAG-Assisted)

```python
# Setelah sesi selesai
checklist = retrieve_all_chunks(collection="kasus_02")
# Ekstrak semua item yang "harus ditanyakan" dari Bagian A Section 4 (Anamnesis)

conversation_log = session["conversation_history"]

# Gunakan LLM sebagai evaluator:
# "Berdasarkan checklist berikut dan log percakapan ini,
#  item mana yang sudah ditanyakan mahasiswa? Berikan jawaban
#  dalam format JSON: {item: string, asked: bool, quality: 'good'|'partial'|'missed'}"

score_report = llm_evaluator(checklist, conversation_log)
```

### 8.3 Output Laporan Sesi

```json
{
    "session_id": "uuid",
    "student_id": "28225007",
    "case_id": "02",
    "duration_minutes": 18,
    "total_score": 74,
    "breakdown": {
        "coverage": { "score": 32, "max": 40, "detail": [...] },
        "fife": { "score": 14, "max": 20, "detail": [...] },
        "red_flags": { "score": 16, "max": 20, "detail": [...] },
        "communication": { "score": 12, "max": 20, "detail": [...] }
    },
    "missed_items": [
        "Tidak menanyakan riwayat kontak dengan penderita",
        "Tidak mengeksplorasi dampak penyakit pada pekerjaan",
        "Tidak menanyakan warna dan konsistensi discharge"
    ],
    "positive_notes": [
        "Pertanyaan tentang FIFE istri hamil sangat baik",
        "Menanyakan red flag penurunan visus"
    ]
}
```

---

## 9. Tech Stack

### 9.1 Stack Rekomendasi

| Komponen | Tool | Alternatif | Catatan |
|---|---|---|---|
| **Vector Store** | Qdrant | ChromaDB, Weaviate | Qdrant: named collections, self-host gratis, performa bagus |
| **Embedding Model** | `multilingual-e5-large` | `text-embedding-3-large` | e5 lebih baik untuk Indonesia, gratis, self-host |
| **BM25** | `rank_bm25` (Python) | Elasticsearch | Lightweight, tidak perlu infra tambahan |
| **Reranker** | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Cohere Rerank | Opsional, signifikan tingkatkan presisi |
| **LLM (Pasien)** | GPT-4o | Claude 3.5 Sonnet | Pilih yang paling konsisten untuk roleplay |
| **LLM (Evaluator)** | GPT-4o-mini | Claude 3 Haiku | Task evaluasi lebih simpel, bisa pakai model lebih kecil |
| **Orchestrator** | LlamaIndex | LangChain | LlamaIndex: lebih native untuk RAG pipeline |
| **Registry DB** | SQLite → PostgreSQL | MySQL | SQLite untuk < 1000 kasus, migrate ke Postgres saat scale |
| **File Watcher** | `watchdog` (Python) | GitHub Actions | GitHub Actions lebih reliable untuk production |
| **Backend** | FastAPI | Django | FastAPI: async native, cocok untuk LLM calls |

### 9.2 Urutan Instalasi & Setup

```bash
# 1. Vector store
docker run -p 6333:6333 qdrant/qdrant

# 2. Python dependencies
pip install llama-index qdrant-client rank-bm25 sentence-transformers watchdog

# 3. Download embedding model
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("intfloat/multilingual-e5-large")

# 4. Jalankan ingestion pertama
python pipeline/ingest.py --all
```

---

## 10. Roadmap Implementasi

### Phase 1 — Foundation (Target: 5 kasus, sistem berjalan)

- [ ] Finalisasi dan dokumentasi format markdown sebagai kontrak resmi
- [ ] Implementasi parser.py — ekstrak metadata, split Bagian A/B, chunk per section
- [ ] Setup Qdrant lokal + schema collection
- [ ] Implementasi embedder.py dengan multilingual-e5-large
- [ ] Implementasi hybrid retriever (BM25 + dense + RRF)
- [ ] Implementasi registry SQLite
- [ ] CLI ingestion: `ingest.py --file` dan `--all`
- [ ] Simulation engine dasar: injeksi Bagian B + retrieval Bagian A
- [ ] Chat interface minimal (bisa CLI atau simple web)
- [ ] Test end-to-end dengan 5 kasus

**Deliverable:** Platform berjalan lokal, bisa simulasi 5 kasus, output percakapan di terminal/browser sederhana.

### Phase 2 — Evaluation (Target: 15 kasus, scoring berjalan)

- [ ] Implementasi scoring engine berbasis LLM evaluator
- [ ] Output laporan sesi dalam JSON
- [ ] UI laporan post-sesi untuk mahasiswa
- [ ] Conversation memory dengan sliding window + summarization
- [ ] GitHub Actions trigger untuk auto-ingestion
- [ ] Validasi format otomatis saat ingestion

**Deliverable:** Platform dengan laporan evaluasi per sesi, deployment ke server staging.

### Phase 3 — Scale (Target: 50+ kasus, multi-user)

- [ ] Migrate registry ke PostgreSQL
- [ ] Tambah reranker (cross-encoder)
- [ ] UI katalog kasus dengan filter sistem organ, SKDI, difficulty
- [ ] Sistem assignment kasus per mahasiswa/kelas
- [ ] Dashboard dosen (progress mahasiswa, kasus yang sering gagal)
- [ ] API documentation
- [ ] Load testing

**Deliverable:** Platform production-ready, multi-user, dengan dashboard monitoring.

### Phase 4 — Intelligence (Target: 100+ kasus)

- [ ] Analytics: kasus mana yang paling sering menghasilkan nilai rendah?
- [ ] Adaptive difficulty: rekomendasi kasus berikutnya berdasarkan performa
- [ ] Cross-case knowledge: knowledge base global untuk teori umum (non-isolasi)
- [ ] Feedback loop: dosen bisa koreksi scoring otomatis

---

## 11. Panduan Scaling

### Kapan Migrate dari SQLite ke PostgreSQL
Migrate saat salah satu kondisi ini terpenuhi:
- Kasus > 200 file
- Concurrent users > 20 simulasi bersamaan
- Perlu query kompleks dengan JOIN dan indexing berat

### Kapan Tambah Reranker
Tambah cross-encoder reranker saat:
- Akurasi retrieval dirasa kurang presisi (chunk yang ter-retrieve tidak relevan)
- Ada budget compute tambahan
- Biasanya diperlukan setelah kasus > 50 dengan konten yang mulai overlapping

### Strategi Saat Kasus > 500
Pertimbangkan **multi-tenant Qdrant** — pisahkan kasus per `organ_system` ke cluster Qdrant berbeda:
```
qdrant-mata:6333     → kasus oftalmologi
qdrant-bedah:6333    → kasus bedah
qdrant-interna:6333  → kasus penyakit dalam
```
Ini mencegah satu instance Qdrant menjadi bottleneck.

---

## 12. Keputusan Desain Kritis

Bagian ini mendokumentasikan keputusan penting beserta alasannya, agar tidak dipertanyakan ulang di kemudian hari.

| Keputusan | Pilihan | Alasan |
|---|---|---|
| **Bagian B tidak masuk vector store** | Injeksi langsung sebagai system prompt | Konsistensi persona sepanjang sesi lebih penting dari penghematan token. Chunk parsial berbahaya untuk roleplay. |
| **Isolasi per collection, bukan metadata filter** | Collection terpisah per kasus | Lebih aman dari risiko retrieval cross-case. Collection-level isolation lebih hard-boundary dibanding metadata filter. |
| **Chunking by section, bukan fixed token** | Section-based | Format file sudah semantik per section. Fixed token chunking akan memotong di tengah tabel atau daftar klinis. |
| **Hybrid BM25 + Dense, bukan pure dense** | Hybrid | Istilah medis Latin/Indonesia perlu exact match (BM25). Parafrase awam mahasiswa perlu semantic match (dense). |
| **Scoring post-session, bukan real-time** | Post-session | Real-time scoring mengganggu flow percakapan dan meningkatkan latency setiap turn. |
| **Multilingual-e5 bukan OpenAI embedding** | e5-large | Data medis Indonesia sensitif, lebih baik self-host. Performa e5 untuk Indonesia kompetitif dengan OpenAI. |
| **SQLite untuk fase awal** | SQLite | Zero-infra overhead. Mudah di-migrate ke Postgres saat diperlukan. Over-engineering dengan Postgres di awal buang waktu. |

---

*Dokumen ini adalah living document — update setiap ada keputusan arsitektur baru atau perubahan signifikan pada format data.*

**Last updated:** 2025-05-16
**Author:** Platform Development Team
