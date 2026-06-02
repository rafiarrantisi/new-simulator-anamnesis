// ============================================================
// OphthaSim — CaseSummary → bentuk Case UI (C3, kontrak v0.7.0 §5.6).
// Backend hanya kirim CaseSummary (TANPA persona/Bagian B/responses —
// isolasi §8.5). Adapter mengisi field yang UI lama butuhkan dengan
// nilai aman & netral. Persona asli tetap server-side (RAG).
// ============================================================

var _ADAPT_ACCENTS = ['#5865F2', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9'];

function _titleCase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\b([a-zà-ÿ])/g, function (m) { return m.toUpperCase(); });
}

function _skdiToDifficulty(skdi) {
  var t = String(skdi || '').toUpperCase();
  if (t.indexOf('4') === 0) return { difficulty: 'Easy', difficultyLevel: 1 };
  if (t.indexOf('3') === 0) return { difficulty: 'Medium', difficultyLevel: 2 };
  return { difficulty: 'Hard', difficultyLevel: 3 };
}

function _hashIndex(str, mod) {
  var h = 0;
  for (var i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

// CaseSummary backend → objek Case yang dikonsumsi UI lama.
function adaptCaseSummary(cs) {
  var title = _titleCase(cs.title_id || cs.caseId);
  var diff = _skdiToDifficulty(cs.skdi);
  var accent = _ADAPT_ACCENTS[_hashIndex(cs.caseId || title, _ADAPT_ACCENTS.length)];
  return {
    id: cs.caseId,                       // "kasus-02" → dipakai RagPatientEngine
    _rag: true,                          // penanda kasus backend
    // Library memfilter c.stage×c.caseType (case-tracks.js filterCases).
    // Default preklinik/practice agar 22 kasus tampil & playable; stage/
    // caseType per-kasus = metadata kurikulum (isi dokter nanti via backend).
    stage: cs.stage || 'preklinik',
    caseType: cs.caseType || 'practice',
    title: title,
    category: cs.organ_system || 'Mata',
    difficulty: diff.difficulty,
    difficultyLevel: diff.difficultyLevel,
    estimatedTime: '10–15 min',
    tags: Array.isArray(cs.tags) ? cs.tags : [],
    // Kosong DISENGAJA: keluhan harus digali (answer-restraint). Simulator
    // tidak nge-seed bubble keluhan untuk kasus RAG.
    chiefComplaint: '',
    synopsis: 'Kasus ' + title + (cs.skdi ? ' (SKDI ' + cs.skdi + ')' : '') + '. Lakukan anamnesis untuk menggali keluhan pasien.',
    learningGoals: ['Anamnesis terstruktur: ' + title],
    // Persona netral — identitas asli ada di Bagian B (server-only).
    patientProfile: { name: 'Pasien Virtual', age: '—', gender: '—', occupation: '—' },
    patientTone: 'cooperative',
    accentColor: accent,
    accentLight: 'var(--primary-l)',
    orbColor: accent,
    correctDiagnosis: title,             // judul = nama diagnosis
    keyDomains: [],                      // scoring RAG = post-session Evaluator
    criticalDomains: [],
    responses: { default: { text: '', found: null, isRedFlag: false } },
    icd10: cs.icd10 || '',
    skdi: cs.skdi || '',
    // v0.16.0: kasus terkunci — tampil di library tapi tak bisa dimainkan.
    locked: !!cs.locked,
  };
}

if (typeof window !== 'undefined') {
  window.adaptCaseSummary = adaptCaseSummary;
}
