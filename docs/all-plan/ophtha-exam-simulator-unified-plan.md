# OphthaSim — Unified Exam Simulator Implementation Plan
**Dokumen Terintegrasi: Exam Stations + Frontend Stack + Backend Integration**
**Versi**: 1.0 | **Tanggal**: 2026-05-16

---

## Daftar Isi

1. [Posisi Modul Exam dalam Sistem Keseluruhan](#1-posisi-modul-exam-dalam-sistem-keseluruhan)
2. [Evaluasi Tech Stack Frontend](#2-evaluasi-tech-stack-frontend)
3. [Arsitektur Rendering: Validasi & Refinement](#3-arsitektur-rendering-validasi--refinement)
4. [Data Model: ExamFindings](#4-data-model-examfindings)
5. [Mapping 10 Station: Implementasi Detail](#5-mapping-10-station-implementasi-detail)
6. [State Management Lintas Station](#6-state-management-lintas-station)
7. [Koneksi ke Backend & Scoring System](#7-koneksi-ke-backend--scoring-system)
8. [Asset Strategy](#8-asset-strategy)
9. [Prinsip Clinical Fidelity vs Complexity](#9-prinsip-clinical-fidelity-vs-complexity)
10. [Roadmap Implementasi 3 Phase](#10-roadmap-implementasi-3-phase)
11. [Keputusan Teknis yang Harus Dibuat](#11-keputusan-teknis-yang-harus-dibuat)

---

## 1. Posisi Modul Exam dalam Sistem Keseluruhan

Sebelum masuk ke teknis, penting untuk memahami posisi modul ini dalam flow keseluruhan.

### 1.1 Flow Sesi Mahasiswa

```
[ANAMNESIS] ────────────────────────────────────────────────────
Mahasiswa bicara dengan pasien virtual (LLM + RAG + Voice)
Timer OSCE berjalan (jika mode OSCE)
Scoring coverage anamnesis dihitung di background
                        │
                        ▼
[DDx COMMIT] ─────────────────────────────────────────────────
Mahasiswa memasukkan diagnosis banding (1-3 diagnosis)
Berkomit sebelum melihat exam findings
"Apakah diagnosis saya berubah setelah exam?"
                        │
                        ▼
[OCULAR EXAM] ← MODUL INI ─────────────────────────────────────
Mahasiswa "melakukan" pemeriksaan fisik mata secara virtual
Temuan muncul sesuai kondisi kasus
Setiap station memiliki interaksi dan scoring sendiri
                        │
                        ▼
[DEBRIEF] ────────────────────────────────────────────────────
Rekap anamnesis + exam + DDx
Scoring total: anamnesis (40%) + DDx accuracy (20%) + exam (40%)
Gap analysis: apa yang terlewat
```

### 1.2 Dependency Penting

Modul exam **tidak berdiri sendiri** — ia bergantung pada:

- **`EXAM_FINDINGS[case_id]`** — ground truth temuan per kasus (dikelola backend)
- **Session state** dari anamnesis — waktu elapsed, DDx yang sudah dikomit
- **OSCE timer** — jika mode OSCE, countdown tetap berjalan selama exam
- **Scoring engine** — temuan yang "ditemukan" mahasiswa di-compare ke ground truth

---

## 2. Evaluasi Tech Stack Frontend

### 2.1 Validasi Pilihan — Apa yang Sudah Benar

**React 18 + TypeScript + Vite** ✅
Pilihan yang tidak perlu didebat. Concurrent rendering React 18 memang relevan untuk simulasi yang punya animasi berat (iris dilation, RAPD timing) tanpa blocking UI. TypeScript wajib karena state medis seperti IOP value, VA score, dan CDR ratio membutuhkan type safety yang ketat.

**Zustand untuk state management** ✅
Redux memang overkill. Zustand cukup dan lebih mudah di-compose per-station. Satu concern: pastikan station state **tidak bocor** antar station (mirip isolasi kasus di RAG). Tiap station harus punya store yang ter-reset saat berpindah station.

**Framer Motion + SVG untuk Layer 2** ✅
Combo paling tepat. SVG secara native mendukung semua diagram klinis yang dibutuhkan (iris ring, H-pattern motility, visual field quadrant). Framer Motion memberikan physics spring yang natural untuk animasi pupil — ini penting karena pupil yang terlalu linear terlihat robotik dan tidak edukatif.

**Pixi.js v8 untuk Layer 3** ✅ *dengan catatan*
Pilihan yang tepat untuk performa. Tapi ada satu hal yang perlu diperhatikan: `@pixi/react` v8 masih relatif baru (Pixi.js v8 rilis Februari 2024) dan ada beberapa breaking changes dari v7. Pastikan versi yang dipakai konsisten dan cek compatibility dengan React 18 Strict Mode sebelum commit.

**React Three Fiber untuk Layer 4** ✅ *hanya untuk slit lamp MVP+*
Tepat untuk slit lamp beam. Tapi ada trade-off yang perlu dipertimbangkan: R3F menambah bundle size yang signifikan (~400KB gzip). Strategi yang direkomendasikan: **lazy load R3F hanya saat user masuk station slit lamp**, bukan bundle dengan halaman utama.

```tsx
// Lazy load R3F untuk slit lamp — jangan import di level app
const SlitLampStation = lazy(() => import('./stations/SlitLampStation'))
```

### 2.2 Evaluasi: Yang Perlu Ditambahkan atau Diubah

**GSAP untuk RAPD timing** ✅ — Tepat, tapi hanya pakai `@gsap/react` bukan global GSAP untuk menghindari konflik dengan Framer Motion di tree yang sama.

**Tailwind CSS + shadcn/ui** ✅ — Tapi perlu satu keputusan desain tambahan: dark mode harus menjadi **mode default** untuk station exam (seluruh pemeriksaan dilakukan di ruangan semi-gelap). Light mode untuk anamnesis dan UI umum.

**Zod untuk validasi scoring input** ✅ — Dan bisa di-share dengan backend (Pydantic schema bisa generate Zod schema via `openapi-typescript`).

**Yang belum ada di plan awal dan perlu ditambahkan:**

| Gap | Solusi |
|---|---|
| Image loading strategy untuk fundus/retina photos | `@pixi/assets` + CDN lazy loading per kasus |
| Error boundary per station | React `ErrorBoundary` per station agar satu crash tidak bawa down seluruh exam |
| Accessibility (a11y) | Keyboard navigation untuk semua interaktif (klik kuadran visual field harus bisa keyboard) |
| Mobile responsiveness exam stations | Banyak station butuh touch event handling yang berbeda dari mouse |
| Perf budget | Fundoscopy + Slit Lamp bersamaan bisa makan >200MB RAM di mobile |

### 2.3 Pilihan yang Direkomendasikan untuk Ditolak / Diganti

**react-zoom-pan-pinch sebagai fallback fundoscopy** ❌
Ini library 2D CSS transform — tidak cukup baik untuk fundoscopy yang butuh circular masking dan texture layering. Jika Pixi.js ada masalah compatibility, fallback lebih baik pakai pure `<canvas>` + Web API daripada CSS transform.

**Slit lamp "pendekatan sederhana" dengan SVG + CSS gradient untuk MVP** ⚠️ *didiskusikan ulang*
Untuk edukasi awal, SVG + CSS beam representation memang cukup untuk Phase 1. Tapi ada risiko: jika Phase 1 diterima dengan beam yang tidak realistis, tim mungkin tidak punya pressure untuk implement yang benar di Phase 3. Rekomendasi: buat SVG versi "schematic/diagram" (bukan pretend-to-be-realistic), lalu di Phase 3 upgrade ke volumetric dengan label "Premium Mode". Ini lebih jujur secara pedagogis.

---

## 3. Arsitektur Rendering: Validasi & Refinement

### 3.1 Layered Architecture (Validated)

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4 — OPTICAL EFFECTS (R3F + GLSL)                         │
│  Slit lamp volumetric beam, fluorescein shader, lens distortion  │
│  Bundle: ~400KB gzip | Lazy loaded | GPU required               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — INTERACTIVE CANVAS (Pixi.js v8 + @pixi/react)        │
│  Fundoscopy pan/zoom viewport, tonometry meniski, iris texture   │
│  Bundle: ~280KB gzip | Loaded on demand per station             │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — DECLARATIVE ANIMATION (Framer Motion + SVG)          │
│  Pupil dilation/constriction, RAPD sequence, H-pattern           │
│  Amsler grid, visual field mapping, cover test                   │
│  Bundle: ~55KB gzip | Core, always loaded                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — UI SHELL (React 18 + TS + Tailwind + shadcn/ui)      │
│  Navigation, station layout, input forms, scoring feedback       │
│  Bundle: ~90KB gzip | Core, always loaded                       │
└─────────────────────────────────────────────────────────────────┘

Total bundle target: Core (Layer 1+2) < 200KB | Full < 800KB
```

### 3.2 Performance Budget

| Station | Expected Peak RAM | GPU | Bundle Chunk |
|---|---|---|---|
| VA, Ishihara, Amsler | < 30MB | Tidak | Core |
| RAPD, Motility, Visual Field | < 50MB | Tidak | Core |
| Tonometry, Color Vision | < 60MB | Tidak | Core |
| Fundoscopy | < 120MB | WebGL | `chunk-pixi` |
| Fluorescein | < 150MB | WebGL | `chunk-pixi` |
| Slit Lamp | < 200MB | WebGL + GLSL | `chunk-r3f` |

### 3.3 Fallback Strategy

```
WebGL tersedia?
    ├── Ya → Gunakan Pixi.js / R3F normal
    └── Tidak → Fallback ke Layer 2 (SVG representation)
               Tampilkan banner: "Mode grafis dikurangi (GPU tidak tersedia)"
               Station slit lamp: tampilkan diagram schematic, bukan 3D rendering

Browser mobile?
    ├── iOS Safari → Perlu user gesture untuk AudioContext (sudah dibahas di voice doc)
    │               Exam canvas: gunakan touch events bukan mouse events
    └── Android Chrome → Penuh support, perhatikan RAM limit (512MB total)
```

---

## 4. Data Model: ExamFindings

Ini adalah komponen yang **paling kritis dan paling sering diabaikan** dalam desain simulator semacam ini. Tanpa data model yang tepat, station exam tidak bisa driven oleh konten kasus.

### 4.1 Struktur Ground Truth per Kasus

Setiap kasus memiliki `exam_findings` yang menjadi "kebenaran" — apa yang akan mahasiswa "temukan" jika melakukan pemeriksaan dengan benar.

```typescript
// types/exam.ts

interface ExamFindings {
  case_id: string

  visual_acuity: {
    od: VAResult           // Oculus Dexter (kanan)
    os: VAResult           // Oculus Sinister (kiri)
    pinhole_od: VAResult   // Apakah membaik dengan pinhole?
    pinhole_os: VAResult
    near_od: string        // N5, N8, dll
    near_os: string
  }

  pupils: {
    od_size_dim: number    // mm, di ruang gelap
    os_size_dim: number
    od_size_bright: number
    os_size_bright: number
    direct_od: ReactivityGrade
    direct_os: ReactivityGrade
    consensual_od: ReactivityGrade
    consensual_os: ReactivityGrade
    rapd: RAPDResult       // none | od_1plus | od_2plus | ... | os_4plus
    accommodation: 'normal' | 'reduced' | 'absent'
    special_condition?: 'horner' | 'cn3_palsy' | 'argyll_robertson' | 'pharmacologic'
  }

  ocular_motility: {
    versions: 'full' | 'restricted'
    restrictions: MotilityRestriction[]  // [{eye, direction, grade}]
    nystagmus: NystagmusResult
    strabismus: StrabismusResult
    diplopia: boolean
    diplopia_direction?: string
  }

  visual_field: {
    od: VisualFieldMap     // 4 quadrant: 'full' | 'defect' | 'absent'
    os: VisualFieldMap
    defect_pattern?: 'bitemporal' | 'homonymous_right' | 'homonymous_left' |
                     'superior_altitudinal' | 'inferior_altitudinal' | 'central_scotoma'
    localization?: string  // "chiasmal" | "left temporal lobe" | dll
  }

  amsler_grid: {
    od: 'normal' | 'metamorphopsia' | 'scotoma' | 'micropsia'
    os: 'normal' | 'metamorphopsia' | 'scotoma' | 'micropsia'
    affected_area?: AmslerZone[]  // zona grid yang terdistorsi
  }

  color_vision: {
    od_plates_correct: number   // dari 11 screening plates
    os_plates_correct: number
    type?: 'protan' | 'deutan' | 'acquired' | 'normal'
    red_saturation_od: 'normal' | 'reduced'
    red_saturation_os: 'normal' | 'reduced'
  }

  slit_lamp: {
    lids: SlitLampFinding
    conjunctiva: SlitLampFinding
    cornea: CornealFindings         // per lapisan: epithelium, stroma, endothelium
    anterior_chamber: ACFindings    // depth, cell grade, flare grade, hypopyon
    iris: IrisFindings
    lens: LensFindings              // nuclear sclerosis, PSC, PCIOL
    anterior_vitreous: VitreousFindings
    illumination_mode?: string      // mode mana yang paling revelatif
  }

  fluorescein: {
    staining_pattern: 'none' | 'spk' | 'abrasion' | 'dendrite' | 'ulcer' |
                      'inferior_punctate' | 'superior_punctate' | 'arc_ring'
    nei_zones: [number, number, number, number, number]  // zona 1-5, grade 0-3
    seidel_test: boolean
    location?: string               // "central cornea", "inferior 1/3", dll
  }

  tonometry: {
    iop_od: number                  // mmHg
    iop_os: number
    method?: 'goldmann' | 'nct'
    ccr_od?: number                 // Central Corneal Thickness
    ccr_os?: number
  }

  fundoscopy: {
    // Optic Disc
    disc_od: DiscFindings
    disc_os: DiscFindings
    // Vessels
    av_ratio_od: string             // "2:3", "1:3", dll
    av_ratio_os: string
    av_nicking: boolean
    // Retina
    retinal_findings: RetinalFinding[]  // [{type, location, severity}]
    // Macula
    macula_od: MaculaFindings
    macula_os: MaculaFindings
    // Fundus image reference
    fundus_image_od?: string        // path ke fundus photo/illustration
    fundus_image_os?: string
  }
}

// VA helper types
type VAResult = '6/6' | '6/9' | '6/12' | '6/18' | '6/24' | '6/36' | '6/60' |
                '3/60' | '1/60' | 'CF' | 'HM' | 'PL' | 'NPL'

type ReactivityGrade = 'brisk' | 'sluggish' | 'absent'

type RAPDResult = 'none' | `${'od'|'os'}_${'1'|'2'|'3'|'4'}plus`
```

### 4.2 Bagaimana ExamFindings Ter-connect ke Kasus Markdown

File kasus `.md` memiliki **Bagian A Section 5 (Temuan Klinis Objektif)** yang berisi data ini dalam format naratif. Backend perlu **extract terstruktur** ke `ExamFindings` schema di atas.

Dua opsi:
1. **Manual**: Editor konten mengisi JSON `exam_findings` saat membuat kasus
2. **LLM-assisted extraction**: Upload Bagian A → LLM extract ke JSON schema → human review

Rekomendasi: Gunakan LLM untuk draft awal, human review sebelum publish. Buat tool admin sederhana untuk ini.

### 4.3 Progressive Disclosure per Station

Sama seperti answer restraint di anamnesis, temuan exam harus **hanya muncul jika mahasiswa melakukan tindakan yang benar**. Jangan dump semua findings sekaligus.

```typescript
// Contoh: Fundoscopy harus dilihat per region
interface DiscoverableFindings {
  fundoscopy: {
    disc_od: {
      visible: boolean       // default: false
      revealed_by: 'focus_on_disc'    // action yang trigger reveal
      finding: DiscFindings
    }
    macula_od: {
      visible: boolean
      revealed_by: 'ask_patient_look_at_light'  // prosedur spesifik
      finding: MaculaFindings
    }
    // Temuan perifer hanya muncul jika mahasiswa "gerakkan mata pasien ke atas/bawah"
    superior_retina: {
      visible: boolean
      revealed_by: 'patient_looks_up'
      finding: RetinalFinding[]
    }
  }
}
```

---

## 5. Mapping 10 Station: Implementasi Detail

### 5.1 Station VA — Visual Acuity

**Layer:** L1 + L2 | **Complexity:** Rendah | **Phase:** 1

**Interaksi mahasiswa:**
1. Pilih mata yang diperiksa (OD/OS)
2. Pilih apakah pakai kacamata atau tidak
3. Pasien "membaca" Snellen chart — tampilkan chart digital
4. Input: baris terkecil yang terbaca (atau pilih dari dropdown: CF/HM/PL/NPL)
5. Pilihan: lanjut ke pinhole test?
6. Near vision test (N-notation)

**Rendering:**
- Snellen chart: HTML + Tailwind (simple text display, ukuran letter shrinks per baris)
- Chart harus `mirror-reversible` (ada toggle untuk mode cermin)
- Framer Motion: animasi occluder yang menutupi satu mata di illustration eye

**Scoring logic:**
```typescript
// Ground truth dari exam_findings.visual_acuity
// Score penuh jika mahasiswa:
// ✅ Test OD sebelum OS
// ✅ Lakukan pinhole jika VA < 6/9
// ✅ Test near vision
// ✅ Catat hasil yang sesuai ground truth ±1 baris
```

**Clinical constraint penting:** Mahasiswa tidak boleh bisa melihat "jawaban" VA sebelum melakukan pemeriksaan. VA hanya terungkap setelah mahasiswa selesai prosedur.

---

### 5.2 Station Pupils + RAPD

**Layer:** L2 (SVG + Framer Motion + GSAP) | **Complexity:** Sedang-Tinggi | **Phase:** 1

**Interaksi mahasiswa:**
1. Observasi kedua pupil di ruang semi-gelap → catat ukuran OD/OS (slider 2-9mm)
2. Sinari OD → observasi direct & consensual reflex (tombol "sinar OD" → animasi)
3. Sinari OS → idem
4. Swinging flashlight test → kontrol tombol "pindah sinar" dengan timing

**Rendering yang kritis — Pupil Animation:**
```tsx
// Iris dengan concentric rings SVG + Framer Motion
// r berubah berdasarkan: lightOnOD, lightOnOS, RAPDGrade

const pupilRadius = useDerivedPupilSize({
  eye: 'OD',
  lightState,   // 'off' | 'od' | 'os'
  rapd: findings.pupils.rapd,
  normalDimSize: findings.pupils.od_size_dim,
  normalBrightSize: findings.pupils.od_size_bright,
})

<motion.circle
  r={pupilRadius}
  fill="black"
  transition={{
    type: "spring",
    stiffness: 300,  // Lebih tinggi = lebih cepat — sesuaikan per RAPD grade
    damping: 25
  }}
/>
```

**RAPD — Logika Kritis:**
RAPD adalah salah satu konsep yang paling mudah disalah-pahami mahasiswa. Simulator harus menunjukkan dengan sangat jelas bahwa RAPD adalah **paradoxical dilation** — bukan tidak bergerak.

```typescript
// Saat sinar pindah dari mata normal ke mata dengan RAPD
// Kedua pupil BERDILATASI (bukan konstriksi)
// Ini yang membuat RAPD sulit dipahami tanpa visual

function calculatePupilResponse(
  lightTarget: 'od' | 'os',
  findings: PupilFindings
): { od: number, os: number } {
  const rapd = findings.rapd

  if (lightTarget === 'od') {
    // Menyinari mata kanan
    const isRAPD_OD = rapd.includes('od')
    return {
      od: isRAPD_OD ? findings.od_size_dim * 0.9 : findings.od_size_bright,
      os: isRAPD_OD ? findings.os_size_dim * 0.9 : findings.os_size_bright,
    }
    // Jika RAPD di OD: saat OD disinari, response minimal → hampir tidak konstriksi
  }

  if (lightTarget === 'os') {
    // Pindah sinar ke mata kiri
    const isRAPD_OD = rapd.includes('od')
    if (isRAPD_OD) {
      // PARADOXICAL DILATION: pindah dari mata normal (OS) ke mata sakit (OD)
      // Tunggu — ini salah. RAPD OD berarti OD yang sakit.
      // Saat sinar pindah ke OS (normal): kedua konstriksi normal
      // Saat sinar pindah ke OD (sakit): kedua BERDILATASI
    }
    // ...implement sesuai grade RAPD
  }
}
```

**GSAP untuk swinging flashlight timing:**
```typescript
// Timing harus presisi: ±3 detik per mata
// Mahasiswa mengontrol perpindahan sinar (tombol)
// Jika terlalu cepat < 2 detik → warning: "Tahan minimal 3 detik"

const GSAP = await import('gsap')  // dynamic import
const tl = GSAP.timeline()
tl.to(lightPosition, { x: OD_X, duration: 0.3 })  // pindah cepat
  .addPause()  // mahasiswa mengamati
  .to(lightPosition, { x: OS_X, duration: 0.3 })
```

---

### 5.3 Station Ocular Motility

**Layer:** L2 (SVG + Framer Motion) | **Complexity:** Sedang | **Phase:** 1

**Rendering:**
- H-pattern diagram SVG: 9 posisi gaze (primary + 8 cardinal)
- Dua lingkaran mata (OD dan OS) yang bergerak mengikuti target
- Mahasiswa klik/tap tiap posisi → mata bergerak → status normal/restricted ditampilkan

```tsx
// H-Pattern grid: 9 posisi
const GAZE_POSITIONS = [
  { id: 'up_left',    x: -1, y: -1, muscle_od: 'SR', muscle_os: 'IO' },
  { id: 'up',         x:  0, y: -1, muscle_od: 'SR+IO', muscle_os: 'SR+IO' },
  { id: 'up_right',   x:  1, y: -1, muscle_od: 'IO', muscle_os: 'SR' },
  { id: 'left',       x: -1, y:  0, muscle_od: 'MR', muscle_os: 'LR' },
  { id: 'primary',    x:  0, y:  0, muscle_od: null, muscle_os: null },
  { id: 'right',      x:  1, y:  0, muscle_od: 'LR', muscle_os: 'MR' },
  { id: 'down_left',  x: -1, y:  1, muscle_od: 'SO', muscle_os: 'IR' },
  { id: 'down',       x:  0, y:  1, muscle_od: 'IR+SO', muscle_os: 'IR+SO' },
  { id: 'down_right', x:  1, y:  1, muscle_od: 'IR', muscle_os: 'SO' },
]

// Jika findings.ocular_motility.restrictions berisi { eye: 'OD', direction: 'right', grade: 'complete' }
// Maka saat mahasiswa klik 'right' → OD tidak bergerak penuh (animasi abrupt stop)
```

**Cover test:** Toggle visual occluder di atas salah satu mata → "mata yang dibuka" bergerak atau tidak bergerak.

---

### 5.4 Station Visual Field

**Layer:** L2 (SVG interactive) | **Complexity:** Sedang | **Phase:** 1

**Rendering:**
- Diagram circular lapang pandang (Humphrey-style schematic)
- OD dan OS ditampilkan berdampingan
- 4 kuadran per mata yang bisa diklik untuk konfirmasi "normal/defek"
- Mahasiswa melakukan "finger counting" di 4 kuadran (pilih: berapa jari yang terlihat pasien)

```tsx
// Kuadran diagram: klik untuk reveal findings
const quadrants = ['superior', 'inferior', 'nasal', 'temporal']

// Ground truth dari exam_findings.visual_field.od
// Mahasiswa tidak langsung tahu — harus aktif "test" tiap kuadran

function QuadrantTest({ eye, quadrant, findings }) {
  const [tested, setTested] = useState(false)
  const result = findings[eye][quadrant]  // 'full' | 'defect' | 'absent'

  return (
    <button onClick={() => setTested(true)}>
      {tested ? (
        result === 'full' ? '✅ Normal' :
        result === 'defect' ? '⚠️ Defek parsial' : '❌ Tidak ada respons'
      ) : '[ Klik untuk test ]'}
    </button>
  )
}
```

**Visual localization quiz:** Setelah semua kuadran dites, minta mahasiswa mengidentifikasi pola defek (bitemporal / homonymous / dll).

---

### 5.5 Station Amsler Grid

**Layer:** L2 (SVG + CSS) | **Complexity:** Sedang | **Phase:** 1

**Rendering:**
- SVG grid 10×10 kotak dengan titik fixation di tengah
- Berdasarkan `findings.amsler_grid`, beberapa area grid "terdistorsi" (CSS filter: wave distortion, blur)
- Area scotoma: kotak hilang (opacity: 0 dengan blur edge)

```tsx
// Metamorphopsia: gunakan SVG feTurbulence + feDisplacementMap
// untuk distorsi garis yang terlihat natural

<filter id="metamorphopsia-filter">
  <feTurbulence type="turbulence" baseFrequency="0.015"
    numOctaves="2" result="turbulence" />
  <feDisplacementMap in="SourceGraphic" in2="turbulence"
    scale={distortionIntensity} xChannelSelector="R" yChannelSelector="G" />
</filter>
```

**Interaksi:** Mahasiswa klik/drag area yang "terdistorsi" atau "hilang" → overlay warna merah di grid → score berdasarkan akurasi vs ground truth.

---

### 5.6 Station Ishihara

**Layer:** L1 + L2 | **Complexity:** Rendah | **Phase:** 1

**Rendering:**
- Display plate image (atau SVG procedural dots)
- Timer 3 detik per plate (progress bar)
- Input: mahasiswa ketik angka yang dilihat

**Asset consideration:** Plate Ishihara asli memiliki copyright. Ada dua opsi:
1. Gunakan open-source Ishihara plate recreations (tersedia di WikiMedia/EyeChart projects)
2. Generate procedural SVG pseudoisochromatic plates yang terinspirasi Ishihara tapi bukan reproduction

Rekomendasi: Procedural SVG generation — lebih aman secara IP, bisa dikontrol.

**Scoring:**
```typescript
// Per plate: benar/salah/tidak melihat
// Setelah semua plate: klasifikasi normal / protan / deutan / acquired
// Output: "X/11 plate benar, sugestif deuteranomaly"
```

---

### 5.7 Station Slit Lamp

**Layer:** L2 (default) → L4 (Phase 3) | **Complexity:** Sangat Tinggi | **Phase:** 1 partial, Phase 3 full

**Phase 1 — Schematic Mode (L2):**
Bukan simulasi slit lamp yang "realistis" — tapi interactive cross-section diagram kornea.

```
[DIAGRAM SCHEMATIC: Cross-section mata (sagital view)]
    Epithelium  ████████████████  [Normal / Defek / Infiltrat]
    Stroma      ████████████████  [Clear / Edema / Scarring]
    Descemet    ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
    Endothelium ████████████████  [Normal / Guttae / KPs]
    
    AC depth:   [Deep / Shallow]
    Cell:       [Grade 0 / 0.5+ / 1+ / 2+ / 3+ / 4+]
    Flare:      [Grade 0 / 1+ / 2+ / 3+ / 4+]
```

Mahasiswa pilih "illumination mode" (diffuse / direct focal / retro-illumination) → diagram berubah memberikan informasi yang berbeda.

**Phase 3 — Volumetric Mode (L4, R3F):**
Beam of light yang bisa dirotasi, lebar beam adjustable, zoom in/out. GLSL shader untuk Tyndall effect.

```glsl
// Fragment shader: slit beam
uniform float beamAngle;    // 0-360 derajat
uniform float beamWidth;    // 0.5-8mm
uniform float slitHeight;   // sepenuhnya adjustable
void main() {
  float distFromCenter = abs(dot(vPosition, beamNormal));
  float intensity = smoothstep(beamWidth * 0.5, 0.0, distFromCenter);
  // Tyndall effect: partikel suspended jika ada flare
  float tyndall = flareGrade * noise(vPosition * 50.0);
  gl_FragColor = vec4(beamColor * (intensity + tyndall * 0.3), intensity);
}
```

**Scoring slit lamp:**
Berdasarkan urutan pemeriksaan (adnexa → konjungtiva → kornea → AC → iris → lensa), bukan hanya temuan.

---

### 5.8 Station Fluorescein

**Layer:** L3 (Pixi.js filter) | **Complexity:** Tinggi | **Phase:** 2

**Rendering:**
- Base: Virtual eye illustration (anterior segment view)
- Cobalt-blue filter: Pixi.js ColorMatrixFilter yang boost channel biru, darken non-fluorescent areas
- Staining pattern: overlay texture per `findings.fluorescein.staining_pattern`

```typescript
// Pixi.js cobalt-blue simulation
import { ColorMatrixFilter } from 'pixi.js'

const cobaltFilter = new ColorMatrixFilter()
// Matrix: boost blue, suppress red/green
cobaltFilter.matrix = [
  0.05, 0,    0,    0, 0,  // R channel → very low
  0,    0.15, 0,    0, 0,  // G channel → low
  0,    0,    0.8,  0, 0,  // B channel → dominant
  0,    0,    0,    1, 0   // Alpha unchanged
]

// Fluorescein staining areas: hijau terang di atas cobalt blue base
const fluoresceinFilter = new ColorMatrixFilter()
fluoresceinFilter.matrix = [
  0.2, 0.8, 0, 0, 0,   // Blend R+G untuk warna hijau-kuning terang
  0,   1.0, 0, 0, 0,
  0,   0.2, 0, 0, 0,
  0,   0,   0, 1, 0
]
```

**Seidel test:** Animasi khusus — "waterfall" of dark (aqueous) flowing through fluorescein.

---

### 5.9 Station Tonometry

**Layer:** L2 (Framer Motion) | **Complexity:** Sedang | **Phase:** 1

**Rendering (Goldmann Applanation — educational simulation):**
- Virtual slit lamp view dengan tonometer probe approaching cornea
- Goldmann meniski: dua setengah lingkaran biru yang harus "dipertemukan" oleh mahasiswa (dial control)

```tsx
// Meniski animation: dua arc setengah lingkaran
// Posisi relatif berdasarkan "berapa banyak tekanan yang diberikan"
// Ground truth: iop_od = 18 mmHg → dial harus di angka yang sesuai
// Jika terlalu sedikit: dua arc tidak menyentuh
// Jika tepat: inner edges touching (IOP reading)
// Jika terlalu banyak: arc overlap

const topArc = { y: -offset }   // bergerak ke atas sesuai dial
const bottomArc = { y: offset }  // bergerak ke bawah

// "Correct" saat offset = targetIOP / scalingFactor
// Mahasiswa menggeser dial, mengamati posisi meniski
```

---

### 5.10 Station Fundoscopy

**Layer:** L3 (Pixi.js) | **Complexity:** Tinggi | **Phase:** 2

**Rendering — Core Elements:**
- Circular viewport (optic disc view) dengan maskFilter circular
- Pan/zoom via mouse drag atau touch pinch
- Fundus base: retinal image per kasus (photo atau illustration)
- Overlay sprites: temuan patologis (drusen, cotton wool spots, hemorrhages)

```typescript
// Pixi.js setup fundoscopy
import { Application, Sprite, Graphics, BlurFilter, Container } from 'pixi.js'

// 1. Base fundus layer (background retinal image)
const fundusSprite = Sprite.from(`/assets/fundus/${caseId}_od.jpg`)

// 2. Pathology overlay layer (composite dari temuan)
const pathologyContainer = new Container()
// Add sprites per temuan: drusen, cotton wool spots, hemorrhages
findings.retinal_findings.forEach(finding => {
  const sprite = Sprite.from(`/assets/pathology/${finding.type}.png`)
  sprite.position.set(finding.location.x, finding.location.y)
  sprite.alpha = 0  // default: invisible
  sprite.visible = false  // only shown when student "discovers" this region
  pathologyContainer.addChild(sprite)
})

// 3. Circular mask (ophthalmoscope viewport)
const mask = new Graphics()
mask.beginFill(0xffffff)
mask.drawCircle(centerX, centerY, viewportRadius)
mask.endFill()
fundusContainer.mask = mask

// 4. Disc/macula landmarks overlay
```

**CDR Estimator (interactive):**
Mahasiswa klik-drag dua lingkaran:
- Lingkaran luar = batas disc
- Lingkaran dalam = batas cup
- CDR dihitung otomatis dan dibandingkan ground truth

**Progressive reveal:**
Retina perifer tidak terlihat langsung — hanya revealed saat mahasiswa menggerakkan bola mata pasien (tombol directional).

---

## 6. State Management Lintas Station

### 6.1 Store Architecture dengan Zustand

```typescript
// stores/examStore.ts

interface ExamStore {
  // Session context
  sessionId: string
  caseId: string
  mode: 'learning' | 'assessment' | 'osce'

  // Station navigation
  currentStation: StationId
  completedStations: Set<StationId>
  stationOrder: StationId[]

  // Ground truth (loaded dari backend, hidden dari UI)
  examFindings: ExamFindings | null
  
  // Student findings (apa yang mahasiswa catat)
  studentFindings: Partial<StudentExamRecord>

  // Per-station state (reset saat ganti station)
  vaState: VAStationState
  pupilState: PupilStationState
  motilityState: MotilityStationState
  // ...per station

  // Actions
  loadFindings: (caseId: string) => Promise<void>
  recordFinding: (station: StationId, data: unknown) => void
  completeStation: (station: StationId) => void
  navigateStation: (station: StationId) => void
  submitExam: () => Promise<ExamScoringReport>
}

// PENTING: Ground truth findings harus TIDAK langsung accessible dari UI
// Render logic harus request via action, bukan read langsung
// Ini mencegah mahasiswa "inspect element" untuk cheat
```

### 6.2 Timing Integration dengan OSCE Timer

```typescript
// examStore.ts — OSCE timer awareness
interface ExamStore {
  // ...
  remainingTime: number  // detik, dari session OSCE timer
  
  // Jika waktu habis saat exam:
  // → Auto-submit exam dengan findings yang sudah diisi
  // → Remaining stations: marked as 'not_completed'
}
```

---

## 7. Koneksi ke Backend & Scoring System

### 7.1 API Endpoints untuk Exam Module

```
// Sudah dibahas di backend tech stack doc, ini detail exam-specific:

GET    /api/cases/{id}/exam-findings
  → Return ExamFindings (dari PostgreSQL + join ke case data)
  → Auth required: mahasiswa hanya dapat findings saat session aktif
  
POST   /api/sessions/{id}/exam
  → Kirim StudentExamRecord (semua yang ditemukan mahasiswa)
  → Trigger async scoring job
  
GET    /api/sessions/{id}/exam-report
  → Return ExamScoringReport setelah scoring selesai
```

### 7.2 ExamFindings Loading Strategy

```typescript
// JANGAN load semua exam findings sekaligus di client
// Ini mencegah "cheat by inspection"

// Strategy: load per-station, saat station dibuka
async function loadStationFindings(station: StationId, sessionId: string) {
  const response = await fetch(
    `/api/sessions/${sessionId}/station-findings/${station}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  // Backend verify: session aktif + mahasiswa sudah selesai anamnesis
  // Return: hanya findings untuk station ini, bukan semua
  return response.json()
}
```

### 7.3 Scoring per Station

```typescript
// backend: scoring/exam_scorer.py

STATION_WEIGHTS = {
  'visual_acuity': 15,    # %
  'pupils_rapd': 15,
  'ocular_motility': 10,
  'visual_field': 10,
  'slit_lamp': 20,         # Station terpenting di oftalmologi
  'tonometry': 10,
  'fundoscopy': 20,
  # Sisanya (amsler, ishihara, fluorescein) = bonus/conditional
}

def score_station(station: str, student: dict, ground_truth: dict) -> StationScore:
  scorer = SCORERS[station]
  return scorer.score(
    student_findings=student,
    ground_truth=ground_truth,
    procedure_adherence=student.get('procedure_steps', [])
    # Procedure adherence: apakah mahasiswa mengikuti urutan yang benar?
  )
```

**Penilaian tidak hanya berdasarkan temuan, tapi juga prosedur:**
- Apakah VA dites OD sebelum OS?
- Apakah RAPD dilakukan di ruangan semi-gelap?
- Apakah fundoscopy dimulai dari disc, bukan macula?
- Apakah tonometry hanya dilakukan setelah anestesi topikal (diconfirm)?

---

## 8. Asset Strategy

### 8.1 Aset yang Dibutuhkan

| Aset | Jumlah | Format | Sumber |
|---|---|---|---|
| Fundus images (normal) | 5-10 | JPG 2000×2000px | Messidor, ORIGA, EyePACS (open datasets) |
| Fundus images per kondisi | 3-5 per kondisi | JPG | Same sources + synthetic |
| Patologi overlay sprites | 20-30 | PNG transparent | Illustrated, bukan foto |
| Retinal illustration | Per kasus | SVG/PNG | Custom illustration |
| Ishihara plate recreation | 25 | SVG procedural | Generate sendiri (copyright-safe) |
| Slit lamp images | Per mode | JPG | Slit lamp atlas (EyeWiki, AAO) |
| GLSL shader files | 3-5 | GLSL | Custom |

### 8.2 Open Datasets untuk Fundus Images

- **Messidor**: 1.200 retinal images, CC-BY-NC 3.0
- **DRIVE**: 40 fundus images, segmentasi vessel
- **ORIGA**: 650 images, CDR annotations
- **EyePACS**: Available via Kaggle (diabetic retinopathy challenge)

**Workflow:** Download → resize ke 1000×1000px → compress (WebP) → host di CDN → lazy load per kasus.

### 8.3 CDN & Asset Hosting

```
/assets/
  /fundus/
    {case_id}_od.webp      ← Load hanya saat station fundoscopy
    {case_id}_os.webp
  /patho/
    drusen.png             ← Overlay sprites, shared antar kasus
    cotton_wool.png
    flame_hemorrhage.png
    # dll
  /slit/
    normal_cornea.jpg      ← Slit lamp reference images
    corneal_abrasion.jpg
```

Gunakan Cloudflare CDN atau Bunny.net untuk asset serving. Format: WebP dengan fallback JPG. Lazy load via Pixi.js asset loader, bukan `<img>` tags.

---

## 9. Prinsip Clinical Fidelity vs Complexity

### 9.1 Skala Fidelity yang Direkomendasikan

Tidak semua station perlu level fidelity yang sama. Ini guideline berdasarkan **educational impact** per station:

| Station | Target Fidelity | Alasan |
|---|---|---|
| Visual Acuity | **Procedural** — urutan pemeriksaan benar | VA yang tepat mudah; yang penting mahasiswa belajar protokol |
| Pupils + RAPD | **High fidelity animasi** | RAPD adalah konsep yang paling sulit tanpa visual langsung |
| Ocular Motility | **Moderate** — H-pattern + cover test | Schematic sudah cukup untuk memahami pola |
| Visual Field | **Conceptual** — pola defek dan lokalisasi | Confrontation testing lebih tentang interpretasi |
| Amsler Grid | **Moderate** — distorsi visual realistis | Metamorphopsia harus terasa, bukan hanya explained |
| Ishihara | **Functional** — procedural timing | Plate harus procedurally generated, tapi tidak harus identik |
| Slit Lamp | **High fidelity (Phase 3)** | Teknik iluminasi adalah skill kritis yang sulit dipelajari tanpa hands-on |
| Fluorescein | **Moderate-High** — cobalt filter effect | Visual effect harus convincing |
| Tonometry | **Moderate** — meniski interaction | Konsep tekanan lebih penting dari animasi realistis |
| Fundoscopy | **High fidelity** — real fundus images | Real photos + interactive landmark annotation > illustration |

### 9.2 "Educational Honesty" dalam Simulasi

Prinsip yang harus selalu dipegang: **jangan buat simulator yang pretend to be real tapi tidak bisa**. Lebih baik tampilkan label "Diagram Schematic" daripada render 3D yang tidak akurat.

Untuk Phase 1:
- Slit lamp: tampilkan dengan jelas ini adalah "ilustrasi skematik cross-section", bukan foto slit lamp
- Fundoscopy: gunakan real fundus photos, bukan ilustrasi
- RAPD: animasi harus benar secara fisiologis, bahkan jika sederhana

---

## 10. Roadmap Implementasi 3 Phase

### Phase 1 — Core Exam Stations (Target: 8 station MVP)

**Duration:** 6-8 minggu | **Focus:** Correctness, bukan visual wow

Deliverables:
- [ ] ExamFindings data model + TypeScript types
- [ ] Zustand exam store dengan isolation per station
- [ ] `ExamFindings` JSON untuk 3 kasus pilot (Konjungtivitis, Glaukoma, DR)
- [ ] Station VA — Snellen chart interaktif + pinhole logic
- [ ] Station Pupils + RAPD — SVG iris + Framer Motion + GSAP timing
- [ ] Station Ocular Motility — H-pattern + cover test animation
- [ ] Station Visual Field — kuadran SVG interaktif + localization quiz
- [ ] Station Amsler Grid — SVG + distortion filter
- [ ] Station Ishihara — procedural plate + timer
- [ ] Station Tonometry — Goldmann meniski dial interaction
- [ ] Station Slit Lamp — schematic cross-section mode (Layer 2 saja)
- [ ] Backend: `/api/cases/{id}/exam-findings` endpoint
- [ ] Backend: `/api/sessions/{id}/exam` submission + basic scoring

---

### Phase 2 — Enhanced Visuals (Target: Fundoscopy + Fluorescein)

**Duration:** 4-6 minggu | **Focus:** Pixi.js integration

Deliverables:
- [ ] Setup Pixi.js v8 + `@pixi/react` dengan lazy loading
- [ ] Fundoscopy viewport: circular mask + real fundus photo + pan/zoom
- [ ] Fundoscopy CDR interactive estimator
- [ ] Fundoscopy: pathology sprite overlay per kasus
- [ ] Fluorescein: cobalt-blue filter via Pixi.js ColorMatrix
- [ ] Fluorescein: pola staining per kasus
- [ ] Fluorescein: Seidel test visual
- [ ] Asset pipeline: fundus image download + CDN setup
- [ ] Backend: scoring refine dengan procedure adherence check
- [ ] Performance audit: RAM + FPS pada mobile

---

### Phase 3 — Premium Visual (Target: Slit Lamp 3D)

**Duration:** 6-8 minggu | **Focus:** R3F + GLSL

Deliverables:
- [ ] Setup React Three Fiber dengan lazy loading
- [ ] Slit lamp: 3D anterior segment model
- [ ] Slit beam: volumetric light + GLSL shader
- [ ] Tyndall effect: flare simulasi
- [ ] Illumination mode switching (6 modes)
- [ ] Fluorescein: upgrade ke GLSL shader (dari Pixi.js ColorMatrix)
- [ ] Lens distortion shader untuk fundoscopy (barrel distortion)
- [ ] Performance profiling + GPU memory management
- [ ] "Schematic mode" toggle untuk low-end device

---

## 11. Keputusan Teknis yang Harus Dibuat

### Keputusan 1: Fundus Images — Real Photos atau Illustrated?

| | Real Photos (Open Dataset) | Custom Illustrations |
|---|---|---|
| Clinical fidelity | ✅ Sangat tinggi | ⚠️ Bergantung kualitas ilustrator |
| Copyright | ⚠️ Perlu cek lisensi per dataset | ✅ Milik sendiri |
| Kontrol konten | ⚠️ Temukan foto yang sesuai kasus | ✅ Bisa disesuaikan tepat ke ExamFindings |
| Cost | ✅ Gratis (open dataset) | ⚠️ Butuh illustrator medis |
| Maintainability | ✅ Tambah foto dari dataset | ✅ Request ke illustrator |

**Rekomendasi diskusi:** Hybrid — gunakan real photos untuk kondisi umum (normal, DR, AMD), custom illustrations untuk kasus spesifik yang tidak ada foto open-source-nya.

---

### Keputusan 2: Ishihara Plates — Reproduce atau Generate?

Ishihara plates asli dilindungi copyright. Dua pilihan:
- **Generate procedural SVG**: Buat pseudoisochromatic dots sendiri — legal, tapi butuh validasi apakah masih efektif mendeteksi defisiensi warna
- **License**: Beli lisensi educational dari Kanehara (publisher asli) — ada biaya tapi clinically validated

Untuk simulator edukasi (bukan diagnosis), procedural generation kemungkinan cukup.

---

### Keputusan 3: Pixi.js v7 atau v8?

Pixi.js v8 dirilis Februari 2024 — ada breaking changes dari v7. Package `@pixi/react` untuk v8 masih lebih baru dan mungkin ada edge cases yang belum resolved.

- **v7**: Lebih mature, lebih banyak contoh, tapi mulai deprecated
- **v8**: Future-proof, WebGPU support, tapi lebih sedikit community resources saat ini

**Rekomendasi:** Mulai dengan v8 dari awal — jangan technical debt dengan v7. Cek test compatibility di React 18 Strict Mode sebelum commit.

---

### Keputusan 4: Slit Lamp Phase 1 — Schematic atau Skip?

Opsi:
- **Include schematic** (L2 saja): Mahasiswa bisa belajar temuan slit lamp, tapi tanpa "pengalaman" slit lamp yang sebenarnya
- **Skip slit lamp di Phase 1**: Fokus ke station yang visual fidelity-nya lebih achievable dulu

**Rekomendasi:** Include schematic untuk Phase 1 dengan label eksplisit "Mode Diagram" — lebih baik ada dengan disclaimer daripada tidak ada sama sekali. Mahasiswa perlu latihan identifikasi temuan slit lamp untuk OSCE.

---

*Dokumen ini adalah living document. Update setelah keputusan Section 11 dibuat dan setelah prototype Phase 1 selesai untuk validasi klinis dengan dokter penguji.*

**Last updated:** 2025-05-16
