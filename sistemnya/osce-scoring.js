// ============================================================
// OphthaSim — OSCE Scoring Engine
// Mengacu pada OSCE_RUBRIC.md §D
//
// Total 100 pts:
//   D.1 Process & Structure   — 20 pts
//   D.2 Domain Coverage       — 35 pts
//   D.3 Critical Domains      — 20 pts
//   D.4 Red Flag Detection    — 15 pts
//   D.5 Diagnosis & Exam      — 10 pts
// ============================================================

function computeOSCEScore(session, caseData, examResult) {
  examResult = examResult || {};
  var discovered = session.discoveredDomains || new Set();
  var messages = session.messages || [];
  var userMessages = messages.filter(function (m) { return m.role === 'user'; });

  // ─── D.1 Process & Structure (20 pts) ──────────────────
  var processBreakdown = scoreProcess(userMessages, session);
  var processPts = processBreakdown.total;

  // ─── D.2 Domain Coverage (35 pts) ──────────────────────
  var keyDomains = caseData.keyDomains || [];
  var covered = keyDomains.filter(function (d) { return discovered.has(d); });
  var domainCoverage = keyDomains.length > 0 ? covered.length / keyDomains.length : 0;
  var domainPts = Math.round(domainCoverage * 35);

  // ─── D.3 Critical Domains (20 pts) ─────────────────────
  var critDomains = caseData.criticalDomains || [];
  var critCovered = critDomains.filter(function (d) { return discovered.has(d); });
  var critCoverage = critDomains.length > 0 ? critCovered.length / critDomains.length : 1;
  var critPts = Math.round(critCoverage * 20);
  var critMissed = critDomains.length - critCovered.length;

  // ─── D.4 Red Flag Detection (15 pts) ───────────────────
  var totalRedFlags = Object.values(caseData.responses || {}).filter(function (r) { return r.isRedFlag; }).length;
  var rfFound = (session.redFlagsFound || []).length;
  var rfPts = totalRedFlags > 0 ? Math.round((rfFound / totalRedFlags) * 15) : 15;

  // ─── D.5 Diagnosis & Examination (10 pts) ──────────────
  var dxPts = 0;
  if (examResult.isCorrect === true) dxPts += 6;
  if (examResult.differentials && examResult.differentials.length >= 1) dxPts += 2;
  if (examResult.examCompleted && examResult.examCompleted >= 6) dxPts += 2;

  // ─── Modifiers ──────────────────────────────────────────
  var osceMode = session.osceMode === true;
  var bonusFastOsce = 0;
  if (osceMode && session.osceTimeUp !== true && session.elapsed) {
    var totalAllowed = session.osceTotalSeconds || 420;
    if (session.elapsed < totalAllowed * 0.8) bonusFastOsce = 3;
  }
  var penaltyOsceMissed = 0;
  if (osceMode && critMissed > 0) penaltyOsceMissed = -5;

  var raw = processPts + domainPts + critPts + rfPts + dxPts + bonusFastOsce + penaltyOsceMissed;

  // Cap: critical domain terlewat → max 75
  var cap = 100;
  if (critMissed > 0) cap = Math.min(cap, 75);

  var finalScore = Math.max(0, Math.min(cap, raw));

  // Grade band
  var grade = gradeFromScore(finalScore);

  return {
    score: finalScore,
    grade: grade,
    breakdown: {
      process: { earned: processPts, max: 20, items: processBreakdown.items },
      coverage: { earned: domainPts, max: 35, covered: covered, missed: keyDomains.filter(function (d) { return !discovered.has(d); }) },
      critical: { earned: critPts, max: 20, covered: critCovered, missed: critDomains.filter(function (d) { return !discovered.has(d); }) },
      redFlags: { earned: rfPts, max: 15, found: rfFound, total: totalRedFlags },
      diagnosis: { earned: dxPts, max: 10, correct: examResult.isCorrect === true, differentialCount: (examResult.differentials || []).length, examCompleted: examResult.examCompleted || 0 },
    },
    modifiers: {
      osceMode: osceMode,
      bonusFast: bonusFastOsce,
      penaltyMissed: penaltyOsceMissed,
      cap: cap,
    },
    completeness: Math.round(domainCoverage * 100),
    criticalCovered: critCovered.length,
    criticalTotal: critDomains.length,
    redFlagsFound: rfFound,
    totalRedFlags: totalRedFlags,
    confidence: Math.min(100, Math.round(finalScore * 0.9 + (userMessages.length > 5 ? 10 : userMessages.length * 2))),
  };
}

function scoreProcess(userMessages, session) {
  var items = [];
  var total = 0;

  // 1. Salam + perkenalan (2 pts) — cek 3 pesan pertama untuk kata kunci
  var firstThree = userMessages.slice(0, 3).map(function (m) { return m.text.toLowerCase(); }).join(' ');
  var greeted = /(selamat|halo|assalam|pagi|siang|sore|malam|perkenalkan|nama saya|saya dokter)/.test(firstThree);
  items.push({ label: 'Salam + perkenalan diri', earned: greeted ? 2 : 0, max: 2, hit: greeted });
  total += greeted ? 2 : 0;

  // 2. Konfirmasi identitas (2 pts)
  var confirmed = /(nama|usia|umur|panggilan|panggil|kerja|pekerjaan)/i.test(firstThree);
  items.push({ label: 'Konfirmasi identitas pasien', earned: confirmed ? 2 : 0, max: 2, hit: confirmed });
  total += confirmed ? 2 : 0;

  // 3. Open-ended question (3 pts) — cek apakah pertanyaan pertama setelah greeting bersifat open
  var openEnded = userMessages.slice(0, 4).some(function (m) {
    var t = m.text.toLowerCase();
    return /(apa yang|bisa cerita|keluhan|bagaimana|jelaskan|bisa di(jelaskan|ceritakan))/i.test(t);
  });
  items.push({ label: 'Open-ended question awal', earned: openEnded ? 3 : 0, max: 3, hit: openEnded });
  total += openEnded ? 3 : 0;

  // 4. Klarifikasi istilah awam (2 pts) — minimal 1 pertanyaan klarifikasi "maksudnya", "seperti apa", "bisa dijelaskan"
  var clarified = userMessages.some(function (m) {
    var t = m.text.toLowerCase();
    return /(maksudnya|seperti apa|bisa di(jelaskan|gambarkan)|gambarkan|jelaskan lebih|warnanya apa|konsistensinya)/i.test(t);
  });
  items.push({ label: 'Klarifikasi istilah pasien', earned: clarified ? 2 : 0, max: 2, hit: clarified });
  total += clarified ? 2 : 0;

  // 5. Pertanyaan satu-per-satu (2 pts) — penalti jika banyak yang berisi "?" multiple
  var stacked = userMessages.filter(function (m) {
    return (m.text.match(/\?/g) || []).length >= 3;
  }).length;
  var oneByOne = stacked <= 1;
  items.push({ label: 'Pertanyaan satu per satu (tidak menumpuk)', earned: oneByOne ? 2 : 0, max: 2, hit: oneByOne });
  total += oneByOne ? 2 : 0;

  // 6. Urutan logis (4 pts) — minimal 5 domain ditanyakan
  var orderly = (session.discoveredDomains && session.discoveredDomains.size >= 5);
  items.push({ label: 'Urutan logis & sistematis', earned: orderly ? 4 : 2, max: 4, hit: orderly });
  total += orderly ? 4 : 2;

  // 7. Active listening (3 pts) — cek apakah ada keyword rangkum
  var listened = userMessages.some(function (m) {
    var t = m.text.toLowerCase();
    return /(jadi (sa|i)|ringkas|jadi yang|kalau begitu|berdasarkan cerita)/i.test(t);
  });
  items.push({ label: 'Active listening / rangkum', earned: listened ? 3 : 0, max: 3, hit: listened });
  total += listened ? 3 : 0;

  // 8. Closing (2 pts) — cek pesan terakhir
  var lastFew = userMessages.slice(-3).map(function (m) { return m.text.toLowerCase(); }).join(' ');
  var closed = /(terima kasih|terimakasih|terima ksih|baik (saya|akan)|cukup dulu|ok pak|ok bu|baik bu|baik pak)/i.test(lastFew);
  items.push({ label: 'Closing / terima kasih', earned: closed ? 2 : 0, max: 2, hit: closed });
  total += closed ? 2 : 0;

  return { total: total, items: items };
}

function gradeFromScore(score) {
  if (score >= 90) return { letter: 'A', label: 'Luar Biasa', color: 'var(--green)', emoji: '⭐' };
  if (score >= 75) return { letter: 'B', label: 'Bagus Sekali', color: 'var(--teal)', emoji: '🎯' };
  if (score >= 60) return { letter: 'C', label: 'Cukup Baik', color: 'var(--amber)', emoji: '👍' };
  if (score >= 40) return { letter: 'D', label: 'Perlu Latihan', color: '#FB923C', emoji: '💪' };
  return { letter: 'E', label: 'Perlu Ulang', color: 'var(--red)', emoji: '🔁' };
}

// ────────────────────────────────────────────────────────
// Manual examination finding evaluation
// Membandingkan jawaban mahasiswa dengan ground truth
// ────────────────────────────────────────────────────────
function evaluateExamFinding(userText, groundTruth, options) {
  options = options || {};
  if (!userText || !userText.trim()) {
    return { match: 'none', score: 0, feedback: 'Belum diisi.' };
  }
  var user = userText.toLowerCase().trim();
  var truth = String(groundTruth || '').toLowerCase();

  // Extract keywords from truth (numbers, key terms)
  var truthKeywords = extractKeywords(truth);
  var userKeywords = extractKeywords(user);

  // Match score: % of truth keywords appearing in user text
  var matched = truthKeywords.filter(function (kw) {
    return user.indexOf(kw) >= 0;
  });

  var pct = truthKeywords.length > 0 ? matched.length / truthKeywords.length : 0;

  if (pct >= 0.6) return { match: 'full', score: 1, feedback: '✓ Temuan utama tertangkap.' };
  if (pct >= 0.3) return { match: 'partial', score: 0.5, feedback: '◐ Sebagian benar. Bisa lebih spesifik.' };
  if (user.length > 5) return { match: 'attempt', score: 0.2, feedback: '○ Catatan dicatat — tapi kurang akurat dengan temuan sebenarnya.' };
  return { match: 'none', score: 0, feedback: '○ Catatan terlalu singkat.' };
}

function extractKeywords(text) {
  if (!text) return [];
  // Extract: numbers/ratios, medical keywords
  var keywords = [];
  // Numerical patterns (e.g. 6/6, 6/18, 14, 62)
  var nums = text.match(/\b\d+[\/\.]?\d*\b/g) || [];
  keywords = keywords.concat(nums);
  // Important medical terms
  var medTerms = [
    'rapd', 'mucopurulent', 'discharge', 'injection', 'ciliary', 'perilimbal',
    'oedema', 'edema', 'haze', 'hazy', 'shallow', 'mid-dilated', 'fixed',
    'cells', 'flare', 'kps', 'keratic', 'synechiae', 'hypopyon',
    'detachment', 'retinal', 'haemorrhage', 'hemorrhage', 'macular', 'macula',
    'normal', 'reduced', 'severe', 'mild', 'moderate', 'elevated', 'low',
    'spk', 'punctate', 'infiltrate', 'ulcer', 'papilla', 'papillae',
    'cataract', 'nuclear', 'sclerosis', 'icterus', 'jaundice',
    'photopsia', 'flashes', 'floaters', 'curtain', 'shadow', 'scotoma',
    'cf', 'hm', 'lp', 'mmhg', 'snellen', 'logmar',
    'positive', 'negative', 'pinhole', 'ranbow', 'halo', 'halos',
  ];
  medTerms.forEach(function (term) {
    if (text.indexOf(term) >= 0) keywords.push(term);
  });
  return keywords;
}

// Suggested findings prompt for each station (used as light hint in normal mode)
var STATION_HINTS = {
  va: 'Pikirkan: angka Snellen per mata (OD/OS), apakah ada penurunan, apakah pinhole improves.',
  pupil: 'Pikirkan: ukuran (mm), bentuk (round/oval/irregular), reaktivitas, RAPD (+/-).',
  eom: 'Pikirkan: full range atau ada limitasi pada arah tertentu? Diplopia (+/-)? Nystagmus (+/-)?',
  vf: 'Pikirkan: lapang pandang full atau ada defect? Kuadran mana yang defektif?',
  amsler: 'Pikirkan: garis lurus normal atau ada distorsi/scotoma? Mata mana?',
  color: 'Pikirkan: berapa plate yang benar dari total? Tipe deficit (merah-hijau/biru-kuning)?',
  slitlamp: 'Pikirkan: lids, conjunctiva (injection pattern), cornea (clarity/SPK/ulcer), AC (depth/cells), iris, lens.',
  fluor: 'Pikirkan: ada staining (+/-)? Pola (punctate/dendritic/abrasion)? TBUT seconds?',
  iop: 'Pikirkan: angka mmHg per mata. Normal 10–21. >30 emergency.',
  fundus: 'Pikirkan: disc (margin/cup), macula, vessels, periphery. Ada hemorrhage/exudate/detachment?',
  oct: 'Pikirkan: ketebalan fovea, ada cystic spaces? Ada subretinal fluid?',
};

// Expose
if (typeof window !== 'undefined') {
  window.computeOSCEScore = computeOSCEScore;
  window.gradeFromScore = gradeFromScore;
  window.evaluateExamFinding = evaluateExamFinding;
  window.STATION_HINTS = STATION_HINTS;
}
