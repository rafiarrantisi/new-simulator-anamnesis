# Voice Pipeline: Diagnosis & Solusi Teknis
**Virtual Patient Simulator — Perbaikan STT/Voice Layer**
**Versi**: 1.0 | **Tanggal**: 2025-05-16

---

## Daftar Isi

1. [Diagnosis Masalah](#1-diagnosis-masalah)
2. [Root Cause: Web Speech API](#2-root-cause-web-speech-api)
3. [Arsitektur Solusi: Ganti Pendekatan](#3-arsitektur-solusi-ganti-pendekatan)
4. [Komponen 1 — Audio Capture (MediaRecorder)](#4-komponen-1--audio-capture-mediarecorder)
5. [Komponen 2 — Voice Activity Detection (VAD)](#5-komponen-2--voice-activity-detection-vad)
6. [Komponen 3 — Server-Side STT (Whisper)](#6-komponen-3--server-side-stt-whisper)
7. [Komponen 4 — Deduplication & Request Guard](#7-komponen-4--deduplication--request-guard)
8. [Komponen 5 — TTS Output](#8-komponen-5--tts-output)
9. [Kompatibilitas Browser & Device](#9-kompatibilitas-browser--device)
10. [Push-to-Talk sebagai Fallback Andalan](#10-push-to-talk-sebagai-fallback-andalan)
11. [Full Stack Architecture](#11-full-stack-architecture)
12. [Checklist Implementasi](#12-checklist-implementasi)

---

## 1. Diagnosis Masalah

Dari deskripsi yang ada, terdapat **empat gejala berbeda** yang perlu dipisahkan karena penyebabnya berbeda:

| # | Gejala | Nama Teknis |
|---|---|---|
| G1 | Sistem "tidak mendengar" — input suara tidak terdeteksi | **Missed detection / false silence** |
| G2 | Transkrip muncul dobel-dobel | **Duplicate transcription** |
| G3 | Transkrip isinya salah / tidak akurat | **ASR accuracy error** |
| G4 | Tidak jalan di semua browser / HP | **Cross-browser / cross-device incompatibility** |

Semua gejala ini memiliki **satu akar masalah yang sama**, dan semuanya bisa diselesaikan dengan mengganti pendekatan arsitektur voice pipeline.

---

## 2. Root Cause: Web Speech API

Hampir pasti sistem lama menggunakan **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) — API bawaan browser untuk speech-to-text. Ini adalah penyebab keempat gejala di atas.

### Mengapa Web Speech API Bermasalah untuk Production

**G4 — Kompatibilitas:**
Web Speech API hanya benar-benar berfungsi di **Chrome dan Edge desktop**. Di browser lain:

| Browser | Status Web Speech API |
|---|---|
| Chrome desktop | ✅ Berfungsi (tapi kirim audio ke Google server) |
| Edge desktop | ⚠️ Sebagian berfungsi |
| Firefox | ❌ Tidak didukung sama sekali |
| Safari desktop | ⚠️ Berfungsi tapi ada bug duplikasi transkrip yang diketahui |
| Chrome Android | ✅ Berfungsi |
| Safari iOS | ❌ Sangat bermasalah (isFinal selalu false, event tidak konsisten) |
| Brave / Vivaldi / Opera | ❌ Tidak berfungsi — tidak boleh gunakan Google API tanpa bayar lisensi |
| Browser di laptop kampus | ❌ Tergantung kebijakan institusi, sering diblokir |

**G2 — Duplikasi transkrip:**
Ini adalah **bug yang sudah lama diketahui di implementasi Safari** dari Web Speech API. Ketika `isFinal` tidak pernah menjadi `true`, browser mengirim `interimResults` berulang kali, dan jika handler tidak diimplementasikan dengan benar, teks yang sama muncul dua kali. Di Chrome pun, jika `continuous = true` digunakan tanpa kontrol yang ketat, event `onresult` bisa terpanggil beberapa kali untuk ucapan yang sama.

**G1 — Tidak mendeteksi:**
Web Speech API mengandalkan silence detection dan VAD internal browser yang tidak bisa dikonfigurasi. Di lingkungan yang sedikit berisik (kipas, AC ruang kelas/lab), API sering tidak pernah "memulai" karena ambang batas energi suara tidak terpenuhi. Ini juga yang menyebabkan kadang "tidak terdengar" walau user sudah bicara.

**G3 — Akurasi transkrip:**
Web Speech API (Chrome) mengirim audio ke server Google untuk ditranskripsi. Model Google tidak dioptimalkan untuk:
- Bahasa Indonesia dengan campuran istilah medis Latin
- Istilah seperti "konjungtivitis", "preaurikular", "anamnesis"
- Aksen dan dialek Indonesia

### Kesimpulan

> Web Speech API adalah solusi rapid prototype yang tidak layak untuk production cross-browser, apalagi untuk konteks medis yang butuh akurasi tinggi.

**Solusi:** Ganti arsitektur. Gunakan `MediaRecorder API` (bukan Web Speech API) di sisi browser untuk capture audio, lalu kirim ke backend yang menjalankan **Whisper** untuk transkripsi. Ini adalah pendekatan yang digunakan oleh hampir semua voice assistant production modern.

---

## 3. Arsitektur Solusi: Ganti Pendekatan

### Sebelum (Bermasalah)

```
Browser
├── Web Speech API (SpeechRecognition)
│   ├── Capture audio (internal)
│   ├── Kirim ke Google server (tidak bisa dikontrol)
│   └── Return teks → langsung ke LLM pipeline
└── Masalah: kompatibilitas, duplikasi, akurasi, tidak bisa dikonfigurasi
```

### Sesudah (Solusi)

```
Browser
├── MediaRecorder API — capture audio blob (kompatibel semua browser modern)
├── VAD (Silero VAD / @ricky0123/vad-web) — deteksi awal/akhir ucapan
└── Kirim audio blob ke backend via HTTP POST atau WebSocket
        ↓
Backend (FastAPI / Node.js)
├── Whisper large-v3-turbo — transkripsi (akurasi tinggi, bahasa Indonesia)
├── Request deduplication guard — cegah double processing
└── Return teks → LLM pipeline → TTS → kembali ke browser
```

---

## 4. Komponen 1 — Audio Capture (MediaRecorder)

### Mengapa MediaRecorder, Bukan Web Speech API

`MediaRecorder` adalah Web API standar untuk merekam audio/video dari browser. Berbeda dari Web Speech API, `MediaRecorder`:
- Didukung di **semua browser modern** termasuk Firefox, Safari, dan browser mobile
- Menghasilkan **audio blob** yang bisa dikirim ke backend manapun
- Tidak memiliki dependensi ke server eksternal (Google, dll)
- Bisa dikonfigurasi format audio (WebM, MP4, OGG)

### Implementasi Dasar (JavaScript)

```javascript
class AudioCapture {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  async init() {
    // Minta izin mikrofon
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,       // Mono cukup untuk speech
        sampleRate: 16000,     // 16kHz optimal untuk Whisper
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  }

  startRecording() {
    if (this.isRecording) return; // Guard: jangan mulai dua kali

    this.audioChunks = [];
    
    // Deteksi MIME type yang didukung browser ini
    const mimeType = this.getSupportedMimeType();
    
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Kumpulkan chunk setiap 100ms
    this.isRecording = true;
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.isRecording) return resolve(null);

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType
        });
        this.isRecording = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  getSupportedMimeType() {
    // Prioritas: WebM (Chrome/Firefox) → MP4 (Safari) → OGG
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
  }

  // Cek apakah browser mendukung MediaRecorder
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
              window.MediaRecorder);
  }
}
```

### Kirim Audio ke Backend

```javascript
async function sendAudioForTranscription(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('session_id', currentSessionId); // untuk dedup guard

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result.transcript;
}
```

---

## 5. Komponen 2 — Voice Activity Detection (VAD)

### Masalah yang Dipecahkan VAD

VAD menyelesaikan dua gejala sekaligus:
- **G1 (tidak mendeteksi):** VAD mendeteksi kapan user mulai bicara → `startRecording()` otomatis dipanggil
- **G2 (duplikasi):** VAD mendeteksi kapan user berhenti bicara → `stopRecording()` dipanggil sekali saja → satu request ke backend

Tanpa VAD, developer harus manual trigger recording, yang sering menyebabkan:
- Recording dimulai terlalu awal (tangkap silence)
- Recording tidak berhenti (continuous mode tak terkendali)
- Double request karena event handler terpanggil dua kali

### Pilihan Library VAD

**Rekomendasi: `@ricky0123/vad-web`** (Silero VAD di browser via ONNX Runtime)

```bash
npm install @ricky0123/vad-web
```

Ini adalah port dari **Silero VAD** — model VAD open source yang banyak digunakan di production. Keunggulannya:
- Berjalan di browser (WebAssembly + ONNX Runtime)
- Tidak butuh backend untuk deteksi VAD
- Akurat untuk berbagai kondisi background noise
- Tidak bergantung pada threshold energi statis (beda dari Web Speech API)

### Implementasi VAD + MediaRecorder

```javascript
import { MicVAD } from '@ricky0123/vad-web';

class VoicePipeline {
  constructor({ onTranscript, onSpeechStart, onSpeechEnd }) {
    this.onTranscript = onTranscript;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.vad = null;
    this.isProcessing = false; // Dedup guard
  }

  async init() {
    this.vad = await MicVAD.new({
      // Berapa ms silence dianggap "selesai bicara"
      // 1000ms = 1 detik silence → stop recording
      // Naikkan ke 1500ms jika user sering "dipotong" sebelum selesai
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.3,
      redemptionFrames: 8,
      minSpeechFrames: 3,

      onSpeechStart: () => {
        console.log('🎤 Bicara terdeteksi...');
        this.onSpeechStart?.();
      },

      onSpeechEnd: async (audio) => {
        // audio = Float32Array — langsung tersedia, tidak perlu MediaRecorder
        console.log('✅ Selesai bicara, mengirim ke Whisper...');
        this.onSpeechEnd?.();

        if (this.isProcessing) {
          console.warn('⚠️ Request sebelumnya masih diproses, skip.');
          return; // Dedup guard: cegah double submit
        }

        this.isProcessing = true;
        try {
          const transcript = await this.sendToWhisper(audio);
          this.onTranscript(transcript);
        } finally {
          this.isProcessing = false;
        }
      },

      onVADMisfire: () => {
        // Dipanggil jika suara yang terdeteksi ternyata bukan speech
        console.log('🔇 Bukan bicara, diabaikan.');
      }
    });
  }

  async sendToWhisper(audioFloat32) {
    // Konversi Float32Array ke WAV blob
    const wavBlob = float32ToWav(audioFloat32, 16000);

    const formData = new FormData();
    formData.append('audio', wavBlob, 'speech.wav');
    
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.transcript;
  }

  start() { this.vad?.start(); }
  pause() { this.vad?.pause(); }
  destroy() { this.vad?.destroy(); }
}
```

### Konversi Float32Array ke WAV

```javascript
function float32ToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeStr = (offset, str) =>
    [...str].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert Float32 → Int16
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
```

### Tuning Parameter VAD

Parameter yang paling penting untuk di-tune sesuai kondisi lingkungan penggunaan:

| Parameter | Default | Naikan jika... | Turunkan jika... |
|---|---|---|---|
| `positiveSpeechThreshold` | 0.8 | Terlalu banyak false detection (noise dikira bicara) | Suara user sering tidak terdeteksi |
| `negativeSpeechThreshold` | 0.3 | Sering terputus di tengah kalimat | Recording terlalu lama setelah berhenti bicara |
| `redemptionFrames` | 8 | User sering terputus saat jeda antar kata | — |
| `minSpeechFrames` | 3 | Terlalu banyak deteksi suara pendek (batuk, dehem) | — |

---

## 6. Komponen 3 — Server-Side STT (Whisper)

### Mengapa Whisper

- Mendukung **99 bahasa termasuk Bahasa Indonesia** dengan baik
- Menangani **campuran Indonesia-Latin medis** lebih baik dari Google STT
- Bisa di-**self-host** (data audio tidak meninggalkan server sendiri — penting untuk data pasien)
- **Whisper large-v3-turbo** (rilis Sep 2024): 5.4x lebih cepat dari large-v3 dengan akurasi hampir setara — optimal untuk real-time

### Setup Backend (FastAPI + Whisper)

```python
# requirements.txt
fastapi
uvicorn
openai-whisper
python-multipart
torch

# backend/main.py
import whisper
import tempfile
import os
import hashlib
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Load model sekali saat startup
# "turbo" = large-v3-turbo (direkomendasikan)
# Ganti ke "large-v3" jika GPU punya VRAM cukup (>10GB) dan prioritas akurasi
model = whisper.load_model("turbo")

# Deduplication store (in-memory, cukup untuk single-instance)
# Key: hash audio blob, Value: timestamp terakhir diproses
recent_requests: dict[str, float] = {}
DEDUP_WINDOW_SECONDS = 5  # request dengan audio sama dalam 5 detik = duplikat

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan domain spesifik di production
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.post("/api/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    session_id: str = Form(default="")
):
    audio_bytes = await audio.read()

    # Deduplication check
    audio_hash = hashlib.md5(audio_bytes).hexdigest()
    now = time.time()
    
    if audio_hash in recent_requests:
        last_seen = recent_requests[audio_hash]
        if now - last_seen < DEDUP_WINDOW_SECONDS:
            # Duplikat terdeteksi — kembalikan empty string, jangan proses ulang
            return {"transcript": "", "is_duplicate": True}
    
    recent_requests[audio_hash] = now
    
    # Cleanup cache yang sudah expired
    expired = [k for k, v in recent_requests.items() if now - v > DEDUP_WINDOW_SECONDS * 2]
    for k in expired:
        del recent_requests[k]

    # Tulis ke temp file (Whisper butuh file path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(
            tmp_path,
            language="id",                    # Force Bahasa Indonesia
            initial_prompt=(                   # Context hint untuk istilah medis
                "Percakapan antara dokter dan pasien dalam bahasa Indonesia. "
                "Istilah medis: anamnesis, konjungtivitis, preaurikular, "
                "blefaritis, keratitis, visus, tonometri, slit lamp."
            ),
            fp16=False,                        # Set True jika GPU mendukung FP16
            temperature=0.0,                   # Deterministic output
            no_speech_threshold=0.6,           # Skip jika probabilitas non-speech tinggi
            condition_on_previous_text=False   # Cegah halusinasi dari konteks sebelumnya
        )

        transcript = result["text"].strip()
        return {"transcript": transcript, "is_duplicate": False}

    finally:
        os.unlink(tmp_path)
```

### Konfigurasi Whisper yang Penting

| Parameter | Nilai | Alasan |
|---|---|---|
| `language="id"` | Wajib | Force Indonesian — tanpa ini Whisper sering auto-detect ke bahasa lain |
| `initial_prompt` | Custom per domain | "Membocorkan" kosakata medis ke model sebelum transkripsi — signifikan tingkatkan akurasi istilah khusus |
| `temperature=0.0` | Wajib | Output deterministik, tidak ada variasi random |
| `no_speech_threshold=0.6` | Direkomendasikan | Skip audio yang hampir pasti bukan speech (silence, noise) — cegah halusinasi |
| `condition_on_previous_text=False` | Direkomendasikan | Cegah model "mengarang" teks berdasarkan transkrip sebelumnya |

### Model Selection

| Model | VRAM | Kecepatan | Akurasi Indonesia | Rekomendasi |
|---|---|---|---|---|
| `tiny` | ~1GB | Sangat cepat | Rendah | Jangan dipakai |
| `base` | ~1GB | Cepat | Cukup | Hanya untuk dev/test |
| `small` | ~2GB | Cepat | Baik | Minimum untuk staging |
| `medium` | ~5GB | Sedang | Sangat baik | Acceptable |
| `turbo` | ~6GB | Cepat (5.4x vs large) | Sangat baik | **Rekomendasi production** |
| `large-v3` | ~10GB | Lambat | Terbaik | Jika GPU memadai |

### Jika Tidak Punya GPU / Resource Terbatas

Gunakan **OpenAI Whisper API** (hosted): $0.006/menit, tidak perlu GPU, setup 5 menit:

```python
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def transcribe_with_openai_api(audio_bytes: bytes, filename: str) -> str:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=(filename, audio_bytes, "audio/wav"),
        language="id",
        prompt=(
            "Percakapan dokter dan pasien. "
            "Istilah: anamnesis, konjungtivitis, blefaritis, keratitis."
        )
    )
    return transcript.text
```

Estimasi biaya: satu sesi anamnesis ~10-15 menit → $0.06–$0.09 per sesi.

---

## 7. Komponen 4 — Deduplication & Request Guard

Ini adalah perbaikan langsung untuk **G2 (duplikasi transkrip)**. Duplikasi bisa terjadi di dua tempat berbeda, dan keduanya harus dijaga.

### Layer 1: Frontend Guard (Cegah Double Submit)

```javascript
class RequestGuard {
  constructor() {
    this.isProcessing = false;
    this.lastSubmitTime = 0;
    this.MIN_INTERVAL_MS = 500; // Minimum jeda antar request
  }

  canSubmit() {
    const now = Date.now();
    if (this.isProcessing) {
      console.warn('Guard: request sedang diproses, diabaikan.');
      return false;
    }
    if (now - this.lastSubmitTime < this.MIN_INTERVAL_MS) {
      console.warn('Guard: terlalu cepat, diabaikan.');
      return false;
    }
    return true;
  }

  lock() {
    this.isProcessing = true;
    this.lastSubmitTime = Date.now();
  }

  unlock() {
    this.isProcessing = false;
  }
}

// Penggunaan
const guard = new RequestGuard();

async function handleSpeechEnd(audioBlob) {
  if (!guard.canSubmit()) return;

  guard.lock();
  try {
    const transcript = await sendToBackend(audioBlob);
    if (transcript && transcript.trim().length > 0) {
      processTranscript(transcript);
    }
  } finally {
    guard.unlock();
  }
}
```

### Layer 2: Backend Deduplication (MD5 Hash Guard)

Sudah diimplementasikan di kode backend section 6. Cara kerjanya:
1. Hitung MD5 hash dari audio bytes
2. Cek apakah hash ini sudah diproses dalam 5 detik terakhir
3. Jika ya → return `{"transcript": "", "is_duplicate": true}` tanpa memanggil Whisper

### Layer 3: Transcript Validation (Frontend)

```javascript
function isValidTranscript(text) {
  if (!text || text.trim().length === 0) return false;
  if (text.trim().length < 3) return false; // Terlalu pendek, kemungkinan noise
  
  // Cek apakah transkrip sama persis dengan yang terakhir
  // Whisper kadang menghasilkan teks yang identik untuk noise
  if (text.trim() === lastTranscript.trim()) {
    console.warn('Transkrip duplikat terdeteksi, diabaikan.');
    return false;
  }
  
  return true;
}
```

---

## 8. Komponen 5 — TTS Output

Untuk output suara (pasien menjawab), ada dua opsi:

### Opsi A: Browser Web Speech Synthesis (TTS)

Web Speech **Synthesis** (bukan Recognition) — berbeda dari SpeechRecognition, ini **jauh lebih kompatibel** karena hanya menggunakan engine TTS lokal device. Tidak ada dependensi Google server.

```javascript
function speakText(text, onEnd) {
  // Hentikan TTS yang sedang berjalan
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';   // Bahasa Indonesia
  utterance.rate = 0.9;        // Sedikit lebih lambat dari normal
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Pilih suara Indonesia jika tersedia
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith('id'));
  if (idVoice) utterance.voice = idVoice;

  utterance.onend = () => {
    onEnd?.();
    // Baru enable VAD lagi setelah TTS selesai
    // Ini cegah sistem mendengar suaranya sendiri (echo)
    voicePipeline.start();
  };

  utterance.onerror = (e) => {
    console.error('TTS error:', e);
    onEnd?.();
    voicePipeline.start();
  };

  // Pause VAD dulu selama TTS berbicara
  voicePipeline.pause();
  window.speechSynthesis.speak(utterance);
}
```

**Masalah Browser TTS Indonesia:** Tidak semua device/browser punya suara `id-ID`. Jika tidak tersedia, browser fallback ke suara default (biasanya Inggris dengan aksen aneh).

### Opsi B: Server-Side TTS (Lebih Konsisten)

Untuk hasil lebih baik dan konsisten lintas device, gunakan API TTS:

| Provider | Model | Kelebihan | Harga |
|---|---|---|---|
| **OpenAI TTS** | `tts-1` / `tts-1-hd` | Suara natural, setup mudah | $0.015/1K karakter |
| **ElevenLabs** | Multilingual v2 | Kualitas terbaik, Indonesian support | ~$0.18/1K karakter |
| **Google Cloud TTS** | WaveNet `id-ID` | Suara Indonesia resmi | $0.016/1K karakter |

Contoh dengan OpenAI TTS:

```python
# backend: generate TTS
@app.post("/api/tts")
async def generate_tts(text: str = Form(...)):
    from openai import OpenAI
    client = OpenAI()
    
    response = client.audio.speech.create(
        model="tts-1",
        voice="nova",   # Pilih: alloy, echo, fable, onyx, nova, shimmer
        input=text,
        response_format="mp3"
    )
    
    return Response(
        content=response.content,
        media_type="audio/mpeg"
    )
```

```javascript
// Frontend: play TTS response
async function playTTSResponse(text) {
  voicePipeline.pause(); // Stop listening selama TTS
  
  const response = await fetch('/api/tts', {
    method: 'POST',
    body: new URLSearchParams({ text })
  });
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
    voicePipeline.start(); // Resume listening setelah TTS selesai
  };
  
  audio.play();
}
```

### Penting: Cegah Echo Loop

Saat TTS berbicara (pasien virtual menjawab), VAD **harus di-pause** agar sistem tidak mendengar suaranya sendiri. Ini adalah sumber **G2 duplikasi** yang lain — sistem "mendengar" output TTS dan memprosesnya sebagai input user.

```
TTS mulai → VAD.pause() → TTS selesai → VAD.start()
```

---

## 9. Kompatibilitas Browser & Device

### Matriks Kompatibilitas Arsitektur Baru

| Platform | MediaRecorder | VAD (Silero) | Whisper Backend | TTS Browser | Status |
|---|---|---|---|---|---|
| Chrome desktop | ✅ | ✅ | ✅ | ✅ | **Fully supported** |
| Firefox desktop | ✅ | ✅ | ✅ | ✅ (suara terbatas) | **Fully supported** |
| Safari desktop | ✅ (MP4) | ✅ | ✅ | ✅ | **Fully supported** |
| Edge desktop | ✅ | ✅ | ✅ | ✅ | **Fully supported** |
| Chrome Android | ✅ | ✅ | ✅ | ✅ | **Fully supported** |
| Safari iOS | ✅ (ada quirk) | ✅ | ✅ | ✅ (butuh user gesture) | ⚠️ **Sebagian** |
| Brave / Opera | ✅ | ✅ | ✅ | ✅ | **Fully supported** |

Dengan arsitektur baru, dari 4 environment yang bermasalah di arsitektur lama, 3 sudah teratasi sepenuhnya.

### Quirk iOS Safari yang Perlu Dihandle

iOS Safari memiliki dua limitasi khusus:
1. `MediaRecorder.start()` hanya bisa dipanggil dari **user gesture** (tap/click) — tidak bisa auto-start
2. Audio playback (`new Audio().play()`) harus dari user gesture pertama

```javascript
// Workaround iOS: unlock audio context dengan user gesture pertama
document.addEventListener('click', function unlockAudio() {
  const ctx = new AudioContext();
  ctx.resume();
  document.removeEventListener('click', unlockAudio);
}, { once: true });
```

### Feature Detection & Graceful Degradation

```javascript
function detectCapabilities() {
  const caps = {
    mediaRecorder: !!(window.MediaRecorder),
    getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
    speechSynthesis: !!(window.speechSynthesis)
  };

  if (!caps.mediaRecorder || !caps.getUserMedia) {
    // Fallback: tampilkan text input sebagai alternatif voice
    showTextInputFallback();
    return false;
  }

  return true;
}

function showTextInputFallback() {
  document.getElementById('voice-input').style.display = 'none';
  document.getElementById('text-input').style.display = 'block';
  showMessage(
    '⚠️ Browser Anda tidak mendukung perekaman suara. ' +
    'Gunakan input teks atau buka di Chrome/Firefox terbaru.'
  );
}
```

---

## 10. Push-to-Talk sebagai Fallback Andalan

VAD otomatis lebih nyaman tapi lebih kompleks. Jika VAD masih bermasalah di environment tertentu (ruang berisik, koneksi lambat), **Push-to-Talk (PTT) adalah solusi paling reliable**.

Prinsipnya sederhana: user tekan tombol → recording mulai → lepas tombol → recording berhenti dan dikirim.

### Implementasi PTT

```javascript
class PushToTalk {
  constructor(button, onTranscript) {
    this.button = button;
    this.onTranscript = onTranscript;
    this.audioCapture = new AudioCapture();
    this.isHolding = false;
    
    this.setupEvents();
  }

  async setupEvents() {
    await this.audioCapture.init();
    
    // Mouse (desktop)
    this.button.addEventListener('mousedown', () => this.startHold());
    this.button.addEventListener('mouseup', () => this.endHold());
    this.button.addEventListener('mouseleave', () => this.endHold()); // Safety
    
    // Touch (mobile)
    this.button.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Cegah scroll
      this.startHold();
    });
    this.button.addEventListener('touchend', () => this.endHold());
    
    // Keyboard shortcut (spacebar saat tombol difokus)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && !this.isHolding) {
        e.preventDefault();
        this.startHold();
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.endHold();
    });
  }

  startHold() {
    if (this.isHolding) return;
    this.isHolding = true;
    this.button.classList.add('recording');
    this.button.textContent = '🔴 Sedang merekam...';
    this.audioCapture.startRecording();
  }

  async endHold() {
    if (!this.isHolding) return;
    this.isHolding = false;
    this.button.classList.remove('recording');
    this.button.textContent = '🎤 Tahan untuk bicara';
    
    const audioBlob = await this.audioCapture.stopRecording();
    if (!audioBlob) return;
    
    // Minimum duration check — cegah accidental short tap
    // (VAD otomatis sudah handle ini via minSpeechFrames)
    
    const transcript = await sendAudioForTranscription(audioBlob);
    if (transcript?.trim()) {
      this.onTranscript(transcript);
    }
  }
}
```

### UX PTT yang Baik

- **Ikon yang jelas:** Tampilkan status recording secara visual (border merah berkedip, waveform animasi)
- **Keyboard shortcut:** Spacebar sebagai shortcut PTT — nyaman untuk simulasi di laptop
- **Minimum hold time:** Jika user hanya tap sebentar (< 300ms), abaikan — kemungkinan accidental
- **Feedback audio:** Suara "bip" pendek saat mulai dan selesai recording (opsional tapi sangat membantu)

---

## 11. Full Stack Architecture

### Diagram Flow Lengkap

```
USER BICARA
     │
     ▼
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│                                             │
│  VAD (Silero)        Push-to-Talk           │
│  Deteksi otomatis    Tombol manual          │
│       │                    │                │
│       └──────────┬─────────┘               │
│                  │                          │
│          MediaRecorder                      │
│       (audio blob, WAV)                     │
│                  │                          │
│         Request Guard                       │
│    (cegah double submit)                    │
└─────────────────┼───────────────────────────┘
                  │  HTTP POST /api/transcribe
                  ▼
┌─────────────────────────────────────────────┐
│                 BACKEND                      │
│                                             │
│    Dedup Guard (MD5 hash check)             │
│              │                              │
│        Whisper STT                          │
│  (large-v3-turbo, language=id,              │
│   initial_prompt=medical terms)             │
│              │                              │
│         Transcript                          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│            LLM PIPELINE                      │
│                                             │
│  RAG Retrieval (Bagian A, locked per kasus) │
│          +                                  │
│  Persona LLM (Bagian B as system prompt)    │
│          │                                  │
│      LLM Response (teks)                    │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│                TTS OUTPUT                    │
│                                             │
│  Browser Speech Synthesis     Server TTS    │
│  (gratis, kualitas varies)    (OpenAI/EL,   │
│                                kualitas     │
│                                konsisten)   │
│              │                              │
│        VAD.pause() saat TTS                 │
│        VAD.start() setelah TTS selesai      │
└─────────────────────────────────────────────┘
```

### State Machine Sesi

```
IDLE
  │ (user mulai sesi)
  ▼
LISTENING ──(VAD: speech_start / PTT: hold)──► RECORDING
  ▲                                                │
  │                                                │ (VAD: speech_end / PTT: release)
  │                                                ▼
  │                                          TRANSCRIBING
  │                                          (Whisper STT)
  │                                                │
  │                                                ▼
  │                                          GENERATING
  │                                          (RAG + LLM)
  │                                                │
  │◄──────────(TTS selesai)────────────────  SPEAKING
                                             (TTS output)
```

---

## 12. Checklist Implementasi

### Phase 1 — Ganti Audio Pipeline (Prioritas Tertinggi)

- [ ] Hapus semua referensi ke `SpeechRecognition` / `webkitSpeechRecognition`
- [ ] Implementasi `AudioCapture` class dengan `MediaRecorder API`
- [ ] Test `MediaRecorder` di Chrome, Firefox, Safari, dan satu browser mobile
- [ ] Pastikan `getSupportedMimeType()` berjalan di semua browser target
- [ ] Setup backend FastAPI dengan Whisper
- [ ] Test endpoint `/api/transcribe` dengan audio Indonesia

### Phase 2 — VAD + Dedup (Prioritas Tinggi)

- [ ] Install `@ricky0123/vad-web` dan integrasikan ke frontend
- [ ] Tune parameter VAD di lingkungan target (ruang kelas / lab)
- [ ] Implementasi `RequestGuard` di frontend
- [ ] Implementasi MD5 dedup guard di backend
- [ ] Test: bicara → stop → konfirmasi hanya 1 request terkirim ke backend

### Phase 3 — TTS & Echo Prevention

- [ ] Implementasi `VAD.pause()` sebelum TTS mulai berbicara
- [ ] Implementasi `VAD.start()` setelah TTS selesai (event `onended`)
- [ ] Test di headphone vs speaker — pastikan tidak ada echo loop
- [ ] Pilih dan setup TTS provider (browser native atau server-side)

### Phase 4 — PTT Fallback & Compatibility

- [ ] Implementasi Push-to-Talk sebagai mode alternatif
- [ ] Tambah keyboard shortcut (Spacebar)
- [ ] Implementasi feature detection dan text input fallback
- [ ] Test di iOS Safari — pastikan audio unlock via user gesture sudah ada
- [ ] Tambahkan banner warning jika browser tidak mendukung

### Phase 5 — QA

- [ ] Test sesi lengkap 10 menit di Chrome desktop: tidak ada duplikasi, tidak ada missed detection
- [ ] Test di Firefox: sama
- [ ] Test di HP Android Chrome: sama
- [ ] Test di ruangan ber-AC / berisik: VAD masih berfungsi
- [ ] Test: sistem TTS berbicara → VAD tidak mendeteksi suara TTS sebagai input

---

## Ringkasan Perubahan

| Komponen | Sebelum | Sesudah | Masalah yang Diselesaikan |
|---|---|---|---|
| Audio input | Web Speech API | MediaRecorder API + Silero VAD | G1, G2, G4 |
| STT engine | Google (via Web Speech) | Whisper large-v3-turbo | G3, G4 |
| Dedup | Tidak ada | MD5 hash guard + Request Guard | G2 |
| TTS | Web Speech Synthesis | Browser native + Server TTS (opsional) | G4 (partial) |
| Kompatibilitas | Chrome only (effectively) | Semua browser modern | G4 |
| Mobile | Tidak berfungsi | Berfungsi (dengan quirk iOS) | G4 |

---

*Dokumen ini adalah panduan teknis voice pipeline untuk virtual patient simulator. Update dokumen ini setiap ada perubahan signifikan pada audio stack.*

**Last updated:** 2025-05-16
