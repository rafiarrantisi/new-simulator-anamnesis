// ============================================================
// OphthaSim — Tutorial Scripts (3 kasus latihan)
// Mengacu pada OSCE_RUBRIC.md §F
// ============================================================
//
// Tutorial mode HANYA tersedia untuk 3 kasus:
//   case-001 (Mudah) — Red Eye with Discharge
//   case-003 (Sedang) — Painful Eye + Photophobia (Uveitis)
//   case-002 (Sulit) — Sudden Flashes & Floaters (Retinal Detachment)
//
// Setiap script adalah array step. Tutorial overlay akan:
//   1. Tampilkan "why" sebelum bertanya
//   2. Tampilkan saran pertanyaan (mahasiswa boleh ketik versi sendiri)
//   3. Tunggu sampai jawaban pasien terbuka untuk domain target
//   4. Tampilkan "afterPatientResponds" sebagai clinical reasoning
//   5. Auto-advance
// ============================================================

var TUTORIAL_CASES = ['case-001', 'case-003', 'case-002'];

var TUTORIAL_SCRIPTS = {
  // ─────────────────────────────────────────────────────────
  // CASE-001 — RED EYE WITH DISCHARGE (Mudah)
  // ─────────────────────────────────────────────────────────
  'case-001': {
    intro: {
      title: 'Kasus Tutorial — Mudah',
      body: 'Pasien wanita muda dengan mata merah & discharge. Ini kasus klasik untuk belajar membedakan konjungtivitis bakteri, viral, alergi, dan red flag keratitis. Tujuan tutorial: kamu paham pola anamnesis dasar untuk red eye + kapan curiga keratitis.',
    },
    steps: [
      {
        title: 'Mulai dari lateralitas',
        why: 'Pertanyaan PERTAMA dalam oftalmologi selalu lateralitas (mata mana?). Ini langsung menyaring diagnosis: bilateral cenderung alergi/sistemik, unilateral cenderung infeksi/trauma.',
        suggestedQuestion: 'Mata mana yang bermasalah — kanan, kiri, atau keduanya?',
        expectedDomain: 'laterality',
        afterPatientResponds: 'Mata kanan saja. Bagus — unilateral menyingkirkan dry eye dan alergi (yang biasanya bilateral). Sekarang curiga ke infeksi/trauma di mata kanan.',
      },
      {
        title: 'Onset & durasi keluhan',
        why: 'Onset akut (<48 jam) + discharge → bakteri/viral. Onset gradual → alergi/dry eye. Onset sangat mendadak + nyeri hebat → curiga ulkus kornea.',
        suggestedQuestion: 'Sejak kapan keluhannya mulai?',
        expectedDomain: 'onset',
        afterPatientResponds: 'Kemarin pagi — akut. Diskaran ini menyempitkan ke infeksi akut (bakteri/viral) bukan kondisi kronik.',
      },
      {
        title: 'Karakter discharge — kunci diagnosis!',
        why: 'Discharge mukopurulen kuning-hijau → bakteri. Discharge watery + folikel → viral. Discharge tebal seperti rope, gatal → alergi. Sticky di pagi hari → bakteri klasik.',
        suggestedQuestion: 'Ada kotoran/cairan dari mata? Seperti apa warnanya dan konsistensinya?',
        expectedDomain: 'discharge',
        afterPatientResponds: 'Discharge kuning, sticky, eyelid hampir lengket pagi hari. Ini tanda klasik konjungtivitis BAKTERI. Tapi belum boleh tutup buku — kita harus singkirkan keratitis dulu.',
      },
      {
        title: 'Riwayat lensa kontak — RED FLAG!',
        why: 'Pengguna lensa kontak dengan red eye = curiga keratitis bakteri (Pseudomonas!) sampai terbukti sebaliknya. Tidur memakai lensa = risiko sangat tinggi.',
        suggestedQuestion: 'Apakah Anda memakai lensa kontak?',
        expectedDomain: 'contact_lens',
        afterPatientResponds: '🚨 RED FLAG: Dia tidur dengan lensa 2 malam lalu. Ini sangat meningkatkan curiga keratitis bakteri — bukan sekedar konjungtivitis ringan. Harus diperiksa cornea-nya dengan slit lamp + fluorescein.',
      },
      {
        title: 'Penurunan tajam penglihatan',
        why: 'Konjungtivitis biasanya TIDAK menurunkan VA secara signifikan. VA turun + red eye + lensa kontak = keratitis sampai terbukti sebaliknya.',
        suggestedQuestion: 'Apakah penglihatan Anda terganggu?',
        expectedDomain: 'visual_acuity',
        afterPatientResponds: 'Sedikit blur tapi clear setelah berkedip — relatif mild. Belum severe loss, tapi tetap perlu konfirmasi dengan Snellen.',
      },
      {
        title: 'Fotofobia & nyeri',
        why: 'Konjungtivitis = mata "gritty" (seperti pasir), TIDAK ada deep pain atau photophobia berat. Bila ada → curiga keratitis/uveitis/AACG. Selalu tanyakan keduanya.',
        suggestedQuestion: 'Apakah mata terasa nyeri? Silau saat kena cahaya?',
        expectedDomain: 'pain',
        afterPatientResponds: 'Scratchy bukan deep pain — konsisten dengan konjungtivitis bukan keratitis berat. Tapi karena ada riwayat lensa kontak, tetap harus dirujuk segera.',
      },
      {
        title: 'Riwayat dan obat-obatan',
        why: 'Tanya riwayat episode serupa (alergi sering recurrent), penyakit sistemik (diabetes mempersulit penyembuhan), dan obat yang sudah dipakai (self-medication antibiotik bisa menutupi diagnosis).',
        suggestedQuestion: 'Pernah seperti ini sebelumnya? Sedang minum obat?',
        expectedDomain: 'history',
        afterPatientResponds: 'Episode mirip 1 tahun lalu, resolusi spontan, tidak pakai lensa saat itu. Bukan pola alergi recurrent — lebih ke isolated infection episode.',
      },
      {
        title: 'Ringkas & validasi',
        why: 'Sebelum lanjut ke pemeriksaan fisik, rangkum ke pasien apa yang sudah kamu pahami. Ini "active listening" yang dinilai di OSCE.',
        suggestedQuestion: '(Tidak perlu tanya — coba akhiri sesi anamnesis.)',
        expectedDomain: null,
        afterPatientResponds: 'Working diagnosis sementara: Konjungtivitis bakteri pada mata kanan + RED FLAG pengguna lensa kontak overnight = perlu disingkirkan keratitis bakteri. Pemeriksaan fisik selanjutnya: VA, slit lamp lid+conj+cornea dengan fluorescein, IOP.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CASE-003 — PAINFUL EYE + PHOTOPHOBIA (Sedang)
  // ─────────────────────────────────────────────────────────
  'case-003': {
    intro: {
      title: 'Kasus Tutorial — Sedang',
      body: 'Laki-laki muda dengan nyeri mata + fotofobia berat + recurrent. Tujuan tutorial: belajar mengenali pola uveitis anterior dan PENTING-nya menggali kaitan ocular ↔ sistemik. Banyak kasus mata di OSCE adalah manifestasi penyakit sistemik.',
    },
    steps: [
      {
        title: 'Lateralitas + onset',
        why: 'Uveitis biasanya unilateral, recurrent, dan onset gradual (1–3 hari). Bedakan dari AACG (mendadak, hebat) dan keratitis (akut, ada pemicu).',
        suggestedQuestion: 'Mata mana yang sakit? Sudah berapa lama?',
        expectedDomain: 'laterality',
        afterPatientResponds: 'Mata kiri, recurrent setiap episode. Onset gradual 3 hari — pola uveitis (bukan AACG yang mendadak).',
      },
      {
        title: 'Karakter nyeri — DEEP ACHING',
        why: 'Sifat nyeri mata sangat informatif: (1) Deep aching → uveitis/scleritis/glaukoma. (2) Foreign body/burning → kornea (keratitis/abrasi). (3) Nyeri saat gerak mata → optic neuritis. (4) Severe + headache + nausea → AACG.',
        suggestedQuestion: 'Bagaimana sifat nyerinya — tajam, tumpul, deep, atau seperti benda asing?',
        expectedDomain: 'pain',
        afterPatientResponds: 'Deep aching pain, lebih parah saat kena cahaya. Pola klasik UVEITIS atau iritis. Bukan nyeri permukaan kornea.',
      },
      {
        title: 'Fotofobia — derajat & pola',
        why: 'Fotofobia BERAT (tidak bisa buka mata di ruangan terang) adalah hallmark uveitis anterior. Penyebab: spasme otot ciliary saat iris bergerak. Bedakan dengan fotofobia ringan pada konjungtivitis.',
        suggestedQuestion: 'Seberapa silau? Bisa buka mata di ruang terang?',
        expectedDomain: 'photophobia',
        afterPatientResponds: '🚨 Fotofobia berat — hampir tidak bisa buka mata di luar/ruang terang. Ini key feature uveitis anterior. Plus dengan deep pain → konfirmasi.',
      },
      {
        title: 'Pola kemerahan',
        why: 'Lokasi injeksi penting: (1) Diffuse merata → konjungtivitis. (2) Ciliary/perilimbal (sekitar cornea) → uveitis/keratitis/AACG. (3) Sectoral → episcleritis/scleritis.',
        suggestedQuestion: 'Bagian mana yang paling merah?',
        expectedDomain: 'redness',
        afterPatientResponds: 'Merah perilimbal (sekitar bagian berwarna) — ini ciliary injection, polanya konsisten uveitis.',
      },
      {
        title: 'Riwayat episode sebelumnya',
        why: 'Uveitis anterior sangat sering RECURRENT (50%+ kasus). Riwayat episode mirip + recurrent adalah petunjuk besar — dan harus memicu pertanyaan tentang penyakit sistemik.',
        suggestedQuestion: 'Pernah seperti ini sebelumnya?',
        expectedDomain: 'history',
        afterPatientResponds: '4× dalam 3 tahun. Pola recurrent kuat curiga uveitis associated dengan sistemik (HLA-B27 spectrum disorders).',
      },
      {
        title: '🔗 Riwayat sistemik — JUNCTION POINT!',
        why: 'INILAH inti kasus ini. Uveitis anterior 50% terkait penyakit sistemik: HLA-B27 (AS, ReA, IBD, psoriasis), sarcoidosis, JIA, herpes. JANGAN LEWATKAN tanya: nyeri punggung pagi hari, joint pain, GI symptoms, rashes.',
        suggestedQuestion: 'Apakah Anda punya kondisi medis lain — misalnya nyeri sendi atau punggung?',
        expectedDomain: 'systemic',
        afterPatientResponds: '🎯 Bingo! Ankylosing Spondylitis terdiagnosis 4 tahun lalu. Ini HLA-B27 associated uveitis — diagnosisnya hampir terkonfirmasi. Mahasiswa yang TIDAK menanyakan ini akan miss kasus ini di OSCE.',
      },
      {
        title: 'Obat & alergi',
        why: 'NSAID untuk back pain di AS adalah klue tambahan. Penting juga untuk treatment plan — pasien AS sudah familiar dengan steroid systemic.',
        suggestedQuestion: 'Sedang minum obat apa saja?',
        expectedDomain: 'medication',
        afterPatientResponds: 'Naproxen untuk back pain — konsisten AS. Mahasiswa harus tahu kombinasi ini untuk pertimbangkan referral rheumatology.',
      },
      {
        title: 'VA & floaters',
        why: 'Uveitis anterior dapat menurunkan VA ringan (karena cells/flare di AC). Floaters jarang pada uveitis anterior — bila banyak floaters → curiga uveitis intermediate/posterior.',
        suggestedQuestion: 'Penglihatan terganggu? Ada floaters?',
        expectedDomain: 'visual_acuity',
        afterPatientResponds: 'Sedikit blur + beberapa floaters. Mostly anterior — tapi follow up perlu fundoscopy.',
      },
      {
        title: 'Closing — formulasi diagnosis',
        why: 'Sintesis: uveitis anterior recurrent + AS = HLA-B27 associated uveitis. Pemeriksaan: slit lamp untuk cells/flare/KPs/synechiae, IOP, gonioscopy bila perlu.',
        suggestedQuestion: '(Akhiri sesi anamnesis & lanjut pemeriksaan fisik.)',
        expectedDomain: null,
        afterPatientResponds: 'Working diagnosis: Anterior Uveitis HLA-B27 associated (AS). Plan exam: slit lamp (cells/flare/KPs/synechiae), IOP (bisa rendah karena ciliary body shutdown), fundus (singkirkan posterior). Referral ke rheumatology.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CASE-002 — SUDDEN FLASHES & FLOATERS (Sulit)
  // ─────────────────────────────────────────────────────────
  'case-002': {
    intro: {
      title: 'Kasus Tutorial — Sulit',
      body: 'Laki-laki paruh baya dengan kilatan + floaters mendadak. Ini adalah RETINAL EMERGENCY sampai terbukti sebaliknya. Tujuan tutorial: belajar mengenali pola "PVD → retinal tear → RD" dan KECEPATAN deteksinya — keterlambatan = kebutaan permanen.',
    },
    steps: [
      {
        title: 'Lateralitas + onset (acute!)',
        why: 'Onset mendadak + visual disturbance = emergency screening. Pada kasus retinal: sudden flashes/floaters/curtain = PVD/retinal tear/RD. Pada vaskular: CRAO (sangat mendadak), CRVO (overnight).',
        suggestedQuestion: 'Mata mana? Sejak kapan?',
        expectedDomain: 'laterality',
        afterPatientResponds: '🚨 Sudden onset mata kiri pagi ini. ALARM BELL. Pada usia 54 + sudden visual change = harus dicurigai retinal emergency.',
      },
      {
        title: 'Floaters baru — KEY RED FLAG',
        why: 'NEW-ONSET floaters (sudden shower, banyak, "cobweb") = posterior vitreous detachment (PVD) yang bisa disertai retinal tear. Ini ophthalmic emergency!',
        suggestedQuestion: 'Apakah Anda melihat floaters atau bintik-bintik baru?',
        expectedDomain: 'floaters',
        afterPatientResponds: '🚨🚨 Sudden SHOWER of floaters + cobweb! Ini PVD pattern. 10–15% PVD disertai retinal tear → harus disingkirkan dengan indirect ophthalmoscopy.',
      },
      {
        title: 'Flashes (photopsia) — DARURAT KEDUA',
        why: 'Photopsia (kilatan cahaya) = traksi vitreoretinal. Otak menginterpretasi tarikan retina sebagai cahaya. Flashes + floaters baru = retinal tear sampai terbukti sebaliknya.',
        suggestedQuestion: 'Apakah ada kilatan cahaya di tepi penglihatan?',
        expectedDomain: 'flashes',
        afterPatientResponds: '🚨 Peripheral photopsia di tepi vision. Ini traksi vitreoretinal. Klasik tanda PVD ± retinal break.',
      },
      {
        title: 'Curtain sign — DIAGNOSIS RD!',
        why: 'Bayangan/tirai gelap (curtain sign) di lapang pandang = NEUROSENSORY RETINA SUDAH LEPAS. Ini RD sampai terbukti sebaliknya. Harus operasi dalam 24 jam bila macula masih on.',
        suggestedQuestion: 'Apakah ada area gelap atau seperti tirai di penglihatan?',
        expectedDomain: 'visual_field',
        afterPatientResponds: '🚨🚨🚨 CURTAIN DI BAWAH LAPANG PANDANG! INI RETINAL DETACHMENT INFEROTEMPORAL sampai terbukti sebaliknya. Critical: macula mungkin masih on (VA sentral masih relatif oke). Harus dirujuk ke vitreoretinal SURGEON HARI INI.',
      },
      {
        title: 'Karakter nyeri — RD vs CRAO',
        why: 'RD = PAINLESS (quiet white eye). Bila ada deep pain → AACG. Painless visual loss + flashes/floaters = RD. Painless severe visual loss tanpa flashes/floaters = curiga CRAO/CRVO.',
        suggestedQuestion: 'Apakah ada nyeri?',
        expectedDomain: 'pain',
        afterPatientResponds: 'Painless — "white quiet eye". Konsisten retinal pathology (RD/CRVO/CRAO), menyingkirkan inflammatory atau AACG.',
      },
      {
        title: 'Tajam penglihatan sentral',
        why: 'Jika VA sentral relatif baik = MACULA masih on (better surgical prognosis). Jika VA dramatis turun = macula sudah off (urgensi tetap tinggi tapi prognosis surgical lebih guarded).',
        suggestedQuestion: 'Penglihatan tengah masih jelas?',
        expectedDomain: 'visual_acuity',
        afterPatientResponds: 'Subjective visual disturbance tapi sentral masih ada. Macula mungkin masih on — operasi dalam <24 jam = critical untuk preserve vision.',
      },
      {
        title: 'Faktor risiko #1 — myopia',
        why: 'High myopia (>−6D) adalah risiko paling besar untuk RD (5–10× orang normal). Pada myop tinggi, retina lebih tipis dan rentan tear. Selalu tanya prescription glasses.',
        suggestedQuestion: 'Anda pakai kacamata? Berapa minus-nya?',
        expectedDomain: 'contact_lens',
        afterPatientResponds: '⚠️ Minus 7 bilateral. Myopia tinggi! Faktor risiko utama RD. Plus usia 54 → PVD age. Tahun ini banyak hasil.',
      },
      {
        title: 'Riwayat retinal sebelumnya — faktor risiko #2',
        why: 'Riwayat retinal tear/RD di mata sebelahnya = sangat tingkatkan risiko (10–15%) di mata satunya. Riwayat laser retinopexy = ada anatomic predisposition.',
        suggestedQuestion: 'Pernah ada masalah retina sebelumnya?',
        expectedDomain: 'history',
        afterPatientResponds: '⚠️ Retinal tear di mata kanan 3 tahun lalu, di-laser. Risiko RD mata kiri sekarang sangat tinggi. Stack faktor risiko: high myopia + PVD age + previous tear contralateral = perfect storm.',
      },
      {
        title: 'Sistemik & medikasi',
        why: 'DM dan HT dapat predispose komplikasi vitreoretinal lain (haemorrhage). Untuk RD murni, kurang relevan, tapi tetap tanyakan untuk gambaran komorbid.',
        suggestedQuestion: 'Punya penyakit sistemik atau obat rutin?',
        expectedDomain: 'systemic',
        afterPatientResponds: 'HT + early T2DM. Comorbid umum untuk usia. Tidak mengubah diagnosis utama RD, tapi pertimbangkan dalam perioperative planning.',
      },
      {
        title: 'Closing — TIME CRITICAL',
        why: 'Sintesis: PVD → retinal tear → RD inferotemporal pada mata kiri myop tinggi dengan riwayat tear kontralateral. ACTION: rujuk vitreoretinal HARI INI. JANGAN tunda. Window 24 jam untuk macula-on RD.',
        suggestedQuestion: '(Akhiri sesi & lanjut pemeriksaan fisik segera.)',
        expectedDomain: null,
        afterPatientResponds: '🚨 Working diagnosis: Suspected Retinal Detachment OS. Plan: VA, RAPD swinging flashlight (+ pada RD luas), dilated indirect ophthalmoscopy WAJIB, scleral indentation untuk mencari tear, OCT macula untuk staging. Rujuk vitreoretinal HARI INI. Pasien WAJIB tahu urgency.',
      },
    ],
  },
};

// Helper untuk cek apakah kasus support tutorial
function isTutorialCase(caseId) {
  return TUTORIAL_CASES.indexOf(caseId) >= 0;
}

function getTutorialScript(caseId) {
  return TUTORIAL_SCRIPTS[caseId] || null;
}
