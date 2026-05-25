# Eye Photo Viewer — panduan isi foto

Folder ini menampung foto mata pasien per kasus. Saat sesi anamnesis, di
header conversation panel akan muncul tombol **"👁 Lihat Kondisi Mata"**
bila kasus tsb sudah punya foto.

## Cara isi (2 langkah)

### 1. Drop file foto ke folder ini

Format: `.jpg`, `.jpeg`, `.png`, `.webp` (apa pun yang browser support).
Nama bebas, tapi konvensi yang dianjurkan:

```
kasus-02-anterior.jpg
kasus-02-fundus.jpg
case-001-od.jpg
case-001-os.jpg
```

### 2. Edit `manifest.json`

Format:

```json
{
  "kasus-02": [
    {
      "src": "kasus-02-anterior.jpg",
      "caption": "Segmen anterior — hifema 3mm",
      "eye": "OD"
    },
    {
      "src": "kasus-02-fundus.jpg",
      "caption": "Funduskopi — papil normal"
    }
  ],
  "case-001": [
    { "src": "case-001-od.jpg", "caption": "OD — injeksi konjungtiva", "eye": "OD" }
  ]
}
```

**Field:**
- `src` (wajib): nama file di folder ini, atau URL eksternal (`https://...`).
- `caption` (opsional): keterangan singkat, tampil di bawah foto di modal.
- `eye` (opsional): `"OD"` (kanan) / `"OS"` (kiri) / `"OU"` (kedua) — tampil
  sebagai chip kecil di modal.

**Urutan array = urutan tampil di carousel.** Foto pertama jadi default.

### Setelah edit

- Dev lokal: refresh browser (tak perlu rebuild — manifest = static asset).
- Produksi: rebuild + redeploy (`npm run build` di sistemnya/ + `bash deploy/setup.sh` di EC2).

## Aturan caseId

- **Kasus kanonik (RAG)**: pakai `kasus-XX` sesuai nama markdown di `data-kasus/`
  (mis. `kasus-02`, `kasus-17`).
- **Kasus dummy lama** (offline/dev): pakai id legacy (`case-001`, dst).

Tombol auto-hidden untuk kasus yang `manifest.json`-nya belum punya entry —
sesi tetap berjalan normal, zero visual change.

## Tips konten

- Resolusi anjuran: 1200–1600px sisi panjang (cukup buat zoom; tak terlalu berat).
- Crop ke area mata + sekitarnya (jangan full wajah — privasi + fokus klinis).
- Bila pakai foto dari literatur/atlas, pastikan lisensi memperbolehkan.
- Foto pasien nyata → **wajib informed consent + de-identifikasi** (tutup ID
  pasien, hapus EXIF metadata).

## Anti-bocor

Foto = anti-cheat by content (sumber bisa dari atlas, bukan jawaban
case-spesifik). Tak ada gating server-side untuk MVP — kalau ada kasus
yang fotonya **mengindikasikan diagnosis langsung** (mis. foto dgn caption
"Glaukoma akut") sebaiknya jangan ditaruh, atau pakai foto fase awal yg
tidak terlalu obvious.
