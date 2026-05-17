// ============================================================
// OphthaSim — Case Tracks (Pre-klinik / Koas) + Case Types (Practice / OSCE)
// ============================================================
// Runs after data.js + cases-extra.js. Two jobs:
//   1) Patches the existing 10 cases with stage / caseType / firstImpression
//      so they're discoverable in the new library taxonomy.
//   2) Adds dummy placeholder cases for the new buckets:
//        - Pre-klinik OSCE       (3 cases — easy/medium/hard)
//        - Koas Practice         (3 cases — easy/medium/hard)
//        - Koas OSCE             (3 cases — easy/medium/hard)
//      Placeholders use a generic `default` patient response so the
//      simulator still works; full content is to be authored later.
// ============================================================

(function () {
  // ── First-impression copy for the existing 10 preklinik practice cases ──
  // What a real clinician sees when the patient walks in — the rest is anamnesis.
  var FIRST_IMPRESSIONS = {
    'case-001': 'Wanita muda, tampak agak cemas. Mata kanan tampak merah dengan kerak kekuningan di kelopak.',
    'case-002': 'Pria paruh baya, tampak khawatir. Kacamata minus tebal; kedua mata tampak putih dan tenang dari luar.',
    'case-003': 'Pria dewasa, tampak kesakitan dan sering memejamkan mata kiri saat lampu ruangan menyala terang.',
    'case-004': 'Wanita dewasa, tampak lelah. Mata sedikit kemerahan dan berair, sesekali mengusap mata dengan tisu.',
    'case-005': 'Wanita lansia, kesakitan hebat. Satu tangan menutupi mata kiri; tampak mual dan agak pucat.',
    'case-006': 'Pria lansia, tampak khawatir, datang diantar istri. Kedua mata tampak normal dari luar.',
    'case-007': 'Wanita muda. Kedua mata kemerahan dan berair; sesekali bersin dan menggosok kelopak mata.',
    'case-008': 'Pria dewasa, sangat kesakitan. Memakai kacamata hitam di dalam ruangan; mata kanan tertutup.',
    'case-009': 'Wanita dewasa, tampak khawatir. Kedua mata tampak normal dari luar tanpa kemerahan.',
    'case-010': 'Pria paruh baya, perawakan gemuk, tampak lelah. Datang sendiri dengan kacamata bifokal.',
  };

  // Mark all currently-loaded cases as preklinik / practice and attach
  // firstImpression. Custom user-built cases (no stage yet) also default
  // to preklinik / practice so they remain reachable.
  if (typeof CASES !== 'undefined' && CASES.length) {
    CASES.forEach(function (c) {
      if (!c.stage)    c.stage    = 'preklinik';
      if (!c.caseType) c.caseType = 'practice';
      if (!c.firstImpression && FIRST_IMPRESSIONS[c.id]) {
        c.firstImpression = FIRST_IMPRESSIONS[c.id];
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // Dummy-case helpers
  // ──────────────────────────────────────────────────────────
  // Generic response sets — enough for the simulator to function
  // without crashing. Replace with real scripted content per case later.
  function dummyResponses(extra) {
    var base = {
      laterality:    { text: '[Dummy] Belum ditentukan — silakan otorimu menulis respons.', found: null, isRedFlag: false },
      onset:         { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      duration:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      pain:          { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      redness:       { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      visual_acuity: { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      discharge:     { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      photophobia:   { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      floaters:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      flashes:       { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      trauma:        { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      contact_lens:  { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      history:       { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      medication:    { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      headache:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      diplopia:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      systemic:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      surgical:      { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      visual_field:  { text: '[Dummy] Belum ditentukan.', found: null, isRedFlag: false },
      default:       { text: 'Maaf, saya kurang paham dengan pertanyaannya. Bisa lebih spesifik?', found: null, isRedFlag: false },
    };
    if (extra) Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  // Standard difficulty-aware key/critical domain sets (so scoring works)
  var DOMAINS_BY_DIFFICULTY = {
    1: {
      key: ['laterality','onset','duration','pain','redness','discharge','visual_acuity','history','medication'],
      critical: ['laterality','onset','visual_acuity'],
    },
    2: {
      key: ['laterality','onset','duration','pain','redness','visual_acuity','photophobia','floaters','contact_lens','history','medication','systemic'],
      critical: ['visual_acuity','pain','history','systemic'],
    },
    3: {
      key: ['laterality','onset','pain','visual_acuity','visual_field','floaters','flashes','photophobia','history','medication','systemic','surgical'],
      critical: ['onset','visual_acuity','visual_field','systemic','history'],
    },
  };

  function makeCase(spec) {
    var d = DOMAINS_BY_DIFFICULTY[spec.difficultyLevel];
    return {
      id: spec.id,
      title: spec.title,
      displayId: spec.displayId || null,                 // e.g. "01" — used by OSCE card
      stage: spec.stage,                                  // 'preklinik' | 'koas'
      caseType: spec.caseType,                            // 'practice' | 'osce'
      category: spec.category || 'Kasus Latihan',
      difficulty: spec.difficulty,                        // 'Easy' | 'Medium' | 'Hard'
      difficultyLevel: spec.difficultyLevel,              // 1 | 2 | 3
      estimatedTime: spec.estimatedTime || '10–15 min',
      tags: spec.tags || ['placeholder'],
      chiefComplaint: spec.chiefComplaint,
      synopsis: spec.synopsis || '',
      learningGoals: spec.learningGoals || ['Latih anamnesis sistematis','Identifikasi red flag','Komunikasi pasien'],
      patientProfile: spec.patientProfile,
      firstImpression: spec.firstImpression,
      patientTone: spec.patientTone || 'cooperative',
      accentColor: spec.accentColor || '#64748B',
      accentLight: spec.accentLight || '#E2E8F0',
      orbColor: spec.orbColor || spec.accentColor || '#64748B',
      correctDiagnosis: spec.correctDiagnosis || 'Diagnosis (dummy) — silakan diisi oleh author.',
      keyDomains: spec.keyDomains || d.key,
      criticalDomains: spec.criticalDomains || d.critical,
      responses: spec.responses || dummyResponses(),
      _placeholder: true,                                 // flag so authors can find these
    };
  }

  // ──────────────────────────────────────────────────────────
  // PREKLINIK · OSCE  (3 dummies)
  // ──────────────────────────────────────────────────────────
  var PREKLINIK_OSCE = [
    makeCase({
      id: 'pk-osce-001', displayId: '01',
      stage: 'preklinik', caseType: 'osce',
      title: 'Kasus OSCE Preklinik 01',
      difficulty: 'Easy', difficultyLevel: 1,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Mata saya terasa tidak nyaman sejak kemarin."',
      patientProfile: { name: 'Pasien 01', age: 24, gender: 'Perempuan', occupation: '—' },
      firstImpression: 'Dewasa muda, tampak sehat. Tidak ada kelainan eksternal yang mencolok.',
      patientTone: 'cooperative',
      accentColor: '#5865F2', accentLight: '#EEF0FE',
    }),
    makeCase({
      id: 'pk-osce-002', displayId: '02',
      stage: 'preklinik', caseType: 'osce',
      title: 'Kasus OSCE Preklinik 02',
      difficulty: 'Medium', difficultyLevel: 2,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Penglihatan saya akhir-akhir ini terganggu, dok."',
      patientProfile: { name: 'Pasien 02', age: 45, gender: 'Laki-laki', occupation: '—' },
      firstImpression: 'Dewasa, tampak gelisah. Sesekali mengedipkan mata.',
      patientTone: 'worried',
      accentColor: '#F59E0B', accentLight: '#FEF3C7',
    }),
    makeCase({
      id: 'pk-osce-003', displayId: '03',
      stage: 'preklinik', caseType: 'osce',
      title: 'Kasus OSCE Preklinik 03',
      difficulty: 'Hard', difficultyLevel: 3,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Saya merasa ada yang tidak beres dengan mata saya, dok."',
      patientProfile: { name: 'Pasien 03', age: 60, gender: 'Laki-laki', occupation: '—' },
      firstImpression: 'Lansia, tampak agak pucat. Dipapah masuk ruang pemeriksaan.',
      patientTone: 'pain-affected',
      accentColor: '#DC2626', accentLight: '#FEE2E2',
    }),
  ];

  // ──────────────────────────────────────────────────────────
  // KOAS · PRACTICE  (3 dummies)
  // ──────────────────────────────────────────────────────────
  var KOAS_PRACTICE = [
    makeCase({
      id: 'koas-001',
      stage: 'koas', caseType: 'practice',
      title: 'Pasien Klinik Mata 01',
      difficulty: 'Easy', difficultyLevel: 1,
      estimatedTime: '12–15 min',
      category: 'Latihan Koas',
      chiefComplaint: '"Mata saya sering terasa kering dan capek, dok."',
      patientProfile: { name: 'Pasien Koas 01', age: 32, gender: 'Perempuan', occupation: 'Pekerja kantoran' },
      firstImpression: 'Dewasa, tampak tenang dan kooperatif. Memakai kacamata.',
      patientTone: 'cooperative',
      accentColor: '#14B8A6', accentLight: '#CCFBF1',
    }),
    makeCase({
      id: 'koas-002',
      stage: 'koas', caseType: 'practice',
      title: 'Pasien Klinik Mata 02',
      difficulty: 'Medium', difficultyLevel: 2,
      estimatedTime: '15–18 min',
      category: 'Latihan Koas',
      chiefComplaint: '"Penglihatan kanan saya berangsur memburuk beberapa minggu terakhir."',
      patientProfile: { name: 'Pasien Koas 02', age: 50, gender: 'Laki-laki', occupation: 'Wiraswasta' },
      firstImpression: 'Dewasa, tampak lelah. Kacamata baca terselip di kerah kemeja.',
      patientTone: 'tired',
      accentColor: '#8B5CF6', accentLight: '#EDE9FE',
    }),
    makeCase({
      id: 'koas-003',
      stage: 'koas', caseType: 'practice',
      title: 'Pasien Klinik Mata 03',
      difficulty: 'Hard', difficultyLevel: 3,
      estimatedTime: '18–22 min',
      category: 'Latihan Koas',
      chiefComplaint: '"Mata saya nyeri hebat dan pandangan sangat kabur."',
      patientProfile: { name: 'Pasien Koas 03', age: 70, gender: 'Perempuan', occupation: 'Pensiunan' },
      firstImpression: 'Lansia, kesakitan. Memegang dahi dengan tangan kanan; pelan saat berjalan.',
      patientTone: 'pain-affected',
      accentColor: '#EF4444', accentLight: '#FEE2E2',
    }),
  ];

  // ──────────────────────────────────────────────────────────
  // KOAS · OSCE  (3 dummies)
  // ──────────────────────────────────────────────────────────
  var KOAS_OSCE = [
    makeCase({
      id: 'koas-osce-001', displayId: '01',
      stage: 'koas', caseType: 'osce',
      title: 'Kasus OSCE Koas 01',
      difficulty: 'Easy', difficultyLevel: 1,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Saya datang karena keluhan di mata, dok."',
      patientProfile: { name: 'Pasien 01', age: 28, gender: 'Laki-laki', occupation: '—' },
      firstImpression: 'Dewasa muda, tampak sehat. Duduk tenang di kursi pemeriksaan.',
      patientTone: 'cooperative',
      accentColor: '#5865F2', accentLight: '#EEF0FE',
    }),
    makeCase({
      id: 'koas-osce-002', displayId: '02',
      stage: 'koas', caseType: 'osce',
      title: 'Kasus OSCE Koas 02',
      difficulty: 'Medium', difficultyLevel: 2,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Penglihatan saya tidak seperti biasanya, dok."',
      patientProfile: { name: 'Pasien 02', age: 55, gender: 'Perempuan', occupation: '—' },
      firstImpression: 'Dewasa, tampak letih. Berjalan masuk tanpa bantuan.',
      patientTone: 'tired',
      accentColor: '#F59E0B', accentLight: '#FEF3C7',
    }),
    makeCase({
      id: 'koas-osce-003', displayId: '03',
      stage: 'koas', caseType: 'osce',
      title: 'Kasus OSCE Koas 03',
      difficulty: 'Hard', difficultyLevel: 3,
      estimatedTime: '7 min',
      category: 'OSCE',
      chiefComplaint: '"Mata saya sangat sakit, dok."',
      patientProfile: { name: 'Pasien 03', age: 38, gender: 'Laki-laki', occupation: '—' },
      firstImpression: 'Dewasa, kesakitan hebat. Menutupi salah satu mata dengan tangan.',
      patientTone: 'pain-affected',
      accentColor: '#DC2626', accentLight: '#FEE2E2',
    }),
  ];

  // Push everything into CASES (skip if already present — e.g. after HMR)
  function pushIfMissing(arr) {
    arr.forEach(function (c) {
      if (!CASES.find(function (x) { return x.id === c.id; })) CASES.push(c);
    });
  }
  pushIfMissing(PREKLINIK_OSCE);
  pushIfMissing(KOAS_PRACTICE);
  pushIfMissing(KOAS_OSCE);

  // ──────────────────────────────────────────────────────────
  // Public helpers — used by the library + dashboard
  // ──────────────────────────────────────────────────────────
  window.STAGES = [
    { id: 'preklinik', label: 'Pre-klinik', sub: 'Mahasiswa preklinik · template anamnesis dasar' },
    { id: 'koas',      label: 'Koas',       sub: 'Mahasiswa klinik · anamnesis luwes & berorientasi diagnosis' },
  ];

  window.CASE_TYPES = [
    { id: 'practice', label: 'Latihan & Tutorial', icon: '📚',
      sub: 'Latihan terbuka — boleh dengan tutorial atau tanpa.' },
    { id: 'osce',     label: 'OSCE',                icon: '⏱️',
      sub: 'Simulasi ujian — tanpa bantuan, kasus tidak diumumkan.' },
  ];

  // Filter helper for screens
  window.filterCases = function (stage, caseType) {
    return CASES.filter(function (c) {
      return c.stage === stage && c.caseType === caseType;
    });
  };
})();
