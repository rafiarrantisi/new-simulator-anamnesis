// ============================================================
// OphthaSim — Extended Examination Data (per case)
// Adds: Pupil/RAPD, EOM, Visual Field, Color Vision, Amsler,
// Fluorescein, OCT, Gonioscopy beyond the basic EXAM_FINDINGS.
// ============================================================

var EXAM_EXTENSIONS = {
  // case-001 Bacterial Conjunctivitis (Right)
  'case-001': {
    pupils: {
      OD: { size: 3, reactive: 'brisk' },
      OS: { size: 3, reactive: 'brisk' },
      RAPD: null, notes: 'Direct & consensual reflex intact bilaterally.'
    },
    motility: { full: true, limitations: [], notes: 'Full range of movement bilaterally. No diplopia.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No field defect to confrontation.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 12, total: 12 } },
    amsler:      { OD: 'normal', OS: 'normal' },
    fluorescein: {
      OD: { pattern: 'punctate', region: 'inferior', density: 'mild',
            note: 'Mild inferior punctate epithelial erosions — consistent with mild SPK.' },
      OS: { pattern: 'none', region: '—', density: 'none', note: 'No fluorescein uptake.' }
    },
    gonioscopy: null,
    oct: null,
    affectedEye: 'OD',
  },

  // case-002 Retinal Detachment (Left)
  'case-002': {
    pupils: {
      OD: { size: 3,   reactive: 'brisk' },
      OS: { size: 3.5, reactive: 'sluggish' },
      RAPD: 'OS', notes: '🚨 RAPD positive in OS — afferent defect, consistent with large RD.'
    },
    motility: { full: true, limitations: [], notes: 'Full bilateral motility.' },
    confrontation: {
      OD: 'full',
      OS: 'inferior-nasal quadrant defect ("curtain")',
      notes: '🚨 Inferonasal field loss — corresponds to superotemporal RD.'
    },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 7, total: 12 } },
    amsler:      { OD: 'normal', OS: 'partial scotoma — inferonasal' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No staining.' } },
    gonioscopy: null,
    oct: 'rd',
    affectedEye: 'OS',
  },

  // case-003 Anterior Uveitis HLA-B27 (Left)
  'case-003': {
    pupils: {
      OD: { size: 3,   reactive: 'brisk' },
      OS: { size: 2.5, reactive: 'sluggish', shape: 'irregular' },
      RAPD: null,
      notes: 'Left pupil irregular (posterior synechiae). Sluggish but reactive.'
    },
    motility: { full: true, limitations: [], notes: 'EOM intact bilaterally; movement painful in OS.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No gross field defect.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 10, total: 12 } },
    amsler:      { OD: 'normal', OS: 'normal' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No corneal staining (uveitis is intraocular).' } },
    gonioscopy: { OD: 'open angles', OS: 'open angles, no peripheral anterior synechiae yet' },
    oct: null,
    affectedEye: 'OS',
  },

  // case-004 Dry Eye (Bilateral, R>L)
  'case-004': {
    pupils: { OD: { size: 3, reactive: 'brisk' }, OS: { size: 3, reactive: 'brisk' }, RAPD: null, notes: 'Normal pupillary responses.' },
    motility: { full: true, limitations: [], notes: 'Full EOM.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No field defect.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 12, total: 12 } },
    amsler:      { OD: 'normal', OS: 'normal' },
    fluorescein: {
      OD: { pattern: 'punctate-diffuse', region: 'inferior 1/3', density: 'moderate',
            note: 'Diffuse inferior punctate staining — classic for dry eye/exposure.' },
      OS: { pattern: 'punctate-diffuse', region: 'inferior 1/3', density: 'mild',
            note: 'Milder inferior punctate staining.' }
    },
    gonioscopy: null,
    oct: null,
    affectedEye: 'OU',
  },

  // case-005 Acute Angle Closure Glaucoma (Left)
  'case-005': {
    pupils: {
      OD: { size: 3, reactive: 'brisk' },
      OS: { size: 5, reactive: 'non-reactive', shape: 'oval' },
      RAPD: null,
      notes: '🚨 Left pupil mid-dilated (5mm), oval, FIXED — classic AACG sign.'
    },
    motility: { full: true, limitations: [], notes: 'Full EOM, though painful on left.' },
    confrontation: { OD: 'full', OS: 'diffuse reduction (cannot reliably test — corneal oedema)', notes: 'OS field difficult — diffusely reduced vision.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 0, total: 12, note: 'Cannot perform — cornea hazy' } },
    amsler:      { OD: 'normal', OS: 'not testable' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'microcystic', region: 'corneal epithelium', density: 'diffuse', note: 'Microcystic corneal epithelial oedema visible.' } },
    gonioscopy: { OD: 'narrow but open', OS: '🚨 closed angle 360° — angle closure confirmed' },
    oct: null,
    affectedEye: 'OS',
  },

  // case-006 CRVO (Left)
  'case-006': {
    pupils: {
      OD: { size: 3, reactive: 'brisk' },
      OS: { size: 3.5, reactive: 'sluggish' },
      RAPD: 'OS', notes: '🚨 RAPD positive in OS — ischaemic CRVO suspected.'
    },
    motility: { full: true, limitations: [], notes: 'Full EOM.' },
    confrontation: { OD: 'full', OS: 'diffusely reduced — central scotoma', notes: 'Severely reduced vision OS — central scotoma.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 2, total: 12 } },
    amsler:      { OD: 'normal', OS: 'central scotoma' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No corneal staining.' } },
    gonioscopy: null,
    oct: 'crvo',
    affectedEye: 'OS',
  },

  // case-007 Allergic Conjunctivitis (Bilateral)
  'case-007': {
    pupils: { OD: { size: 3, reactive: 'brisk' }, OS: { size: 3, reactive: 'brisk' }, RAPD: null, notes: 'Normal pupils.' },
    motility: { full: true, limitations: [], notes: 'Full EOM.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No field defect.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 12, total: 12 } },
    amsler:      { OD: 'normal', OS: 'normal' },
    fluorescein: {
      OD: { pattern: 'none', note: 'No corneal staining — cornea spared.' },
      OS: { pattern: 'none', note: 'No corneal staining.' }
    },
    gonioscopy: null,
    oct: null,
    affectedEye: 'OU',
  },

  // case-008 Bacterial Keratitis (Right)
  'case-008': {
    pupils: { OD: { size: 3, reactive: 'sluggish', note: 'Limited view due to AC reaction' }, OS: { size: 3, reactive: 'brisk' }, RAPD: null, notes: 'OD pupil sluggish — anterior chamber reaction.' },
    motility: { full: true, limitations: [], notes: 'Full EOM. Pain on movement OD.' },
    confrontation: { OD: 'cannot reliably test — pain', OS: 'full', notes: 'Right eye field not reliably testable.' },
    colorVision: { OD: { correct: 0, total: 12, note: 'Cannot perform — pain + reduced VA' }, OS: { correct: 12, total: 12 } },
    amsler:      { OD: 'not testable', OS: 'normal' },
    fluorescein: {
      OD: { pattern: 'large-defect', region: 'central cornea 4×3mm', density: 'dense',
            note: '🚨 Central large epithelial defect with overlying infiltrate — classic microbial keratitis.' },
      OS: { pattern: 'none', note: 'No staining.' }
    },
    gonioscopy: null,
    oct: null,
    affectedEye: 'OD',
  },

  // case-009 Optic Neuritis (Right? based on findings — let's say OS for variety)
  'case-009': {
    pupils: {
      OD: { size: 3, reactive: 'brisk' },
      OS: { size: 3, reactive: 'sluggish' },
      RAPD: 'OS', notes: '🚨 RAPD positive OS — classic optic neuritis afferent defect.'
    },
    motility: { full: true, limitations: [], notes: 'Pain on EOM — especially upgaze (classic for retrobulbar optic neuritis).' },
    confrontation: { OD: 'full', OS: 'central scotoma', notes: 'Central scotoma OS.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 2, total: 12 } },
    amsler:      { OD: 'normal', OS: 'central scotoma' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No staining.' } },
    gonioscopy: null,
    oct: 'optic-neuritis',
    affectedEye: 'OS',
  },

  // case-010 Diabetic Retinopathy (Bilateral, R>L)
  'case-010': {
    pupils: { OD: { size: 3, reactive: 'brisk' }, OS: { size: 3, reactive: 'brisk' }, RAPD: null, notes: 'Pupils normal.' },
    motility: { full: true, limitations: [], notes: 'Full EOM.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No gross defect to confrontation.' },
    colorVision: { OD: { correct: 9, total: 12 }, OS: { correct: 11, total: 12 } },
    amsler:      { OD: 'mild distortion central', OS: 'subtle distortion' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No staining.' } },
    gonioscopy: { OD: 'open', OS: 'open' },
    oct: 'diabetic',
    affectedEye: 'OU',
  },
};

// ============================================================
// HELPERS
// ============================================================

// Affected eye preset (fallback for custom cases)
function getAffectedEye(caseData) {
  var ext = EXAM_EXTENSIONS[caseData.id];
  if (ext && ext.affectedEye) return ext.affectedEye;
  var lat = caseData.responses && caseData.responses.laterality;
  if (lat && lat.text) {
    var t = lat.text.toLowerCase();
    if (t.indexOf('both') >= 0) return 'OU';
    if (t.indexOf('left') >= 0) return 'OS';
    if (t.indexOf('right') >= 0) return 'OD';
  }
  return 'OD';
}

// Default fallback extension for cases without one
function getExamExtension(caseId, caseData) {
  if (EXAM_EXTENSIONS[caseId]) return EXAM_EXTENSIONS[caseId];
  return {
    pupils: { OD: { size: 3, reactive: 'brisk' }, OS: { size: 3, reactive: 'brisk' }, RAPD: null, notes: 'Normal pupils.' },
    motility: { full: true, limitations: [], notes: 'Full EOM.' },
    confrontation: { OD: 'full', OS: 'full', notes: 'No field defect.' },
    colorVision: { OD: { correct: 12, total: 12 }, OS: { correct: 12, total: 12 } },
    amsler: { OD: 'normal', OS: 'normal' },
    fluorescein: { OD: { pattern: 'none', note: 'No staining.' }, OS: { pattern: 'none', note: 'No staining.' } },
    gonioscopy: null, oct: null,
    affectedEye: getAffectedEye(caseData || {})
  };
}

// VA grading helper — convert "6/X" to severity
function gradeVA(vaString) {
  if (!vaString) return 'unknown';
  var s = String(vaString).toLowerCase();
  if (s.indexOf('lp') >= 0 || s.indexOf('np') >= 0) return 'severe';
  if (s.indexOf('cf') >= 0 || s.indexOf('hm') >= 0) return 'severe';
  var m = s.match(/6\s*\/\s*(\d+)/);
  if (m) {
    var denom = parseInt(m[1]);
    if (denom <= 9)  return 'normal';
    if (denom <= 18) return 'mild';
    if (denom <= 36) return 'moderate';
    if (denom <= 60) return 'severe';
    return 'severe';
  }
  return 'unknown';
}

// IOP parser
function parseIOPNum(s) {
  if (!s) return null;
  var m = String(s).match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

// Generate dot-pattern data for Ishihara plates (decorative)
// Returns array of dots {x, y, r, color}
function generateIshiharaPlate(number, hasDeficit) {
  // Two color schemes — normal sees foreground, deficit sees background only
  var fg = ['#D97706', '#F59E0B', '#FB923C', '#EA580C', '#C2410C']; // orange/red number
  var bg = ['#65A30D', '#84CC16', '#16A34A', '#22C55E', '#A3E635']; // green background
  if (hasDeficit) {
    // For red-green deficit, foreground is grayish/muted
    fg = ['#A8A29E', '#78716C', '#D6D3D1', '#A8A29E', '#92897A'];
  }
  var dots = [];
  var cx = 100, cy = 100, R = 95;
  // Background dots
  for (var i = 0; i < 320; i++) {
    var theta = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * R;
    var x = cx + r * Math.cos(theta);
    var y = cy + r * Math.sin(theta);
    dots.push({ x: x, y: y, r: 3.5 + Math.random() * 3, color: bg[Math.floor(Math.random() * bg.length)], isFg: false });
  }
  // Foreground dots forming digit shape
  var digitDots = digitShape(number, cx, cy);
  for (var j = 0; j < digitDots.length; j++) {
    dots.push({ x: digitDots[j][0], y: digitDots[j][1], r: 4 + Math.random() * 2, color: fg[Math.floor(Math.random() * fg.length)], isFg: true });
  }
  return dots;
}

// Very simple digit shape generator (pixel-grid based)
function digitShape(n, cx, cy) {
  var patterns = {
    '0': ['01110','10001','10001','10001','10001','10001','01110'],
    '2': ['01110','10001','00001','00010','00100','01000','11111'],
    '3': ['11110','00001','00001','00110','00001','00001','11110'],
    '5': ['11111','10000','11110','00001','00001','10001','01110'],
    '6': ['00110','01000','10000','11110','10001','10001','01110'],
    '7': ['11111','00001','00010','00100','01000','01000','01000'],
    '8': ['01110','10001','10001','01110','10001','10001','01110'],
    '9': ['01110','10001','10001','01111','00001','00010','01100'],
    '74':['010001110','010010001','010010001','010010001','010001111','010000001','010001110'],
    '29':['001100110','010000001','100000001','100000001','011101111','000010001','011000110']
  };
  var p = patterns[String(n)] || patterns['0'];
  var rows = p.length, cols = p[0].length;
  var cellW = 8.5, cellH = 12;
  var startX = cx - (cols * cellW) / 2;
  var startY = cy - (rows * cellH) / 2;
  var dots = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (p[r][c] === '1') {
        // place ~4-5 dots per cell with jitter
        for (var k = 0; k < 4; k++) {
          var jx = (Math.random() - 0.5) * cellW * 0.9;
          var jy = (Math.random() - 0.5) * cellH * 0.9;
          dots.push([startX + c * cellW + cellW/2 + jx, startY + r * cellH + cellH/2 + jy]);
        }
      }
    }
  }
  return dots;
}

// Ishihara test set — 4 plates per case
function getIshiharaSet(ext) {
  var od = ext.colorVision.OD.correct || 12;
  var os = ext.colorVision.OS.correct || 12;
  // Each plate result: { number, ODcorrect, OScorrect }
  var plates = [
    { number: '8',  difficulty: 1 },
    { number: '6',  difficulty: 2 },
    { number: '29', difficulty: 3 },
    { number: '74', difficulty: 4 },
  ];
  // Determine which plates each eye gets right based on score
  return plates.map(function(p, i) {
    var threshold = 12 - (i + 1) * 3; // plate 1 easiest, plate 4 hardest
    return {
      number: p.number,
      ODcorrect: od > threshold,
      OScorrect: os > threshold,
    };
  });
}

Object.assign(window, {
  EXAM_EXTENSIONS, getAffectedEye, getExamExtension,
  gradeVA, parseIOPNum, generateIshiharaPlate, getIshiharaSet
});
