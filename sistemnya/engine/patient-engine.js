// ============================================================
// OphthaSim — PatientEngine (seam utama, lihat docs/ARCHITECTURE.md §3)
// ------------------------------------------------------------
// UI tidak memanggil detectCategory()/caseData.responses langsung lagi;
// ia memanggil PatientEngine.respond(). StaticPatientEngine adalah
// implementasi Fase 1 — output WAJIB identik dengan perilaku lama
// (pasangan `detectCategory(text)` + `caseData.responses[cat]||default`).
// RagPatientEngine / VoicePatientEngine (Fase 3/4) cukup mengganti
// implementasi ini tanpa menyentuh UI.
// ============================================================

// StaticPatientEngine: bungkus tepat logika lama, tanpa perubahan hasil.
var StaticPatientEngine = {
  respond: function (input) {
    var caseContext = input.caseContext;
    var userMessage = input.userMessage;

    // --- identik dengan kode lama di simulator.jsx ---
    var category = detectCategory(userMessage);
    var responseData = caseContext.responses[category] || caseContext.responses['default'];
    // -------------------------------------------------

    return Promise.resolve({
      // dipakai langsung oleh UI saat ini (bentuk lama, byte-identical):
      category: category,
      responseData: responseData,
      // bentuk kontrak PatientTurnResult (§3) — untuk RAG/voice nanti:
      reply: responseData.text,
      detectedDomain: category === 'default' ? null : category,
      finding: responseData.found || null,
      isRedFlag: !!responseData.isRedFlag,
      audioUrl: null,
    });
  },
};

// ============================================================
// RagPatientEngine — C1 (kontrak v0.6.0 §4). Panggil backend RAG
// (POST /api/sessions → /turns). AKTIF hanya jika: window.OPHTHA_API_BASE
// di-set DAN caseId berbentuk "kasus-XX" (backend cuma kenal korpus
// markdown; CASES legacy "case-00X" beda konten → C3). Selain itu, atau
// jika backend gagal, FALLBACK transparan ke StaticPatientEngine supaya
// UI lama tak pernah rusak (simulator.jsx tidak disentuh di C1).
// Auto-guest auth = jembatan dev C1; auth UI nyata = C2.
// ============================================================

var _ragSessionByCase = {}; // caseId -> sessionId (per page load)

function _ragApiBase() {
  return (typeof window !== 'undefined' && window.OPHTHA_API_BASE) || '';
}

function _ragCaseId(input) {
  var id = input.caseId ||
    (input.caseContext && (input.caseContext.caseId || input.caseContext.id)) || '';
  return /^kasus-\d+/.test(id) ? id : null; // RAG-capable hanya kasus-XX
}

async function _ragAuthHeader() {
  var store = window.ApiDataStore;
  var auth = await store.loadAuth();
  if (!auth || !auth.token) {
    // C1 dev bridge: buat tamu otomatis (C2 = LoginScreen nyata).
    var rnd = Math.random().toString(36).slice(2, 10);
    // Domain valid (backend EmailStr menolak TLD special-use .local/.test).
    auth = await store.signup({
      email: 'guest_' + Date.now() + '_' + rnd + '@ophtha-guest.com',
      password: 'guest-' + rnd,
      full_name: 'Tamu',
    });
  }
  return 'Bearer ' + auth.token;
}

async function _ragFetch(path, method, body) {
  var res = await fetch(_ragApiBase() + path, {
    method: method,
    headers: { 'Content-Type': 'application/json', Authorization: await _ragAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  var j = null;
  try { j = await res.json(); } catch (e) { j = null; }
  if (!res.ok || (j && j.success === false)) {
    throw new Error((j && j.error) || ('HTTP ' + res.status));
  }
  return j ? j.data : null;
}

async function _ragSession(caseId, mode) {
  if (_ragSessionByCase[caseId]) return _ragSessionByCase[caseId];
  var d = await _ragFetch('/api/sessions', 'POST', { case_id: caseId, mode: mode || 'normal' });
  _ragSessionByCase[caseId] = d.sessionId;
  return d.sessionId;
}

var RagPatientEngine = {
  respond: async function (input, opts) {
    var caseId = _ragCaseId(input);
    // Tak RAG-capable / backend tak dikonfigurasi → perilaku lama persis.
    if (!caseId || !_ragApiBase() || !window.ApiDataStore) {
      return StaticPatientEngine.respond(input);
    }
    try {
      var sid = await _ragSession(caseId, input.mode);
      var d = await _ragFetch('/api/sessions/' + sid + '/turns', 'POST', {
        text: input.userMessage,
      });
      var reply = (d && d.reply) || '';
      if (opts && typeof opts.onChunk === 'function') opts.onChunk(reply);
      // Bentuk kompatibel simulator.jsx lama. category 'default' → tidak
      // mengubah skor/findings live; scoring RAG = post-session Evaluator
      // (kontrak §3A). Panel findings memang kosong di mode RAG = batas
      // C1 terdokumentasi; UX scoring penuh = C3.
      return {
        category: 'default',
        responseData: { text: reply, found: null, isRedFlag: false },
        reply: reply,
        detectedDomain: null,
        audioUrl: (d && d.audioUrl) || null,
      };
    } catch (e) {
      // Resiliensi C1: backend gagal → jangan biarkan giliran menggantung
      // (simulator.jsx belum punya error-UX; itu C2). Fallback Static.
      return StaticPatientEngine.respond(input);
    }
  },
};

// Selector: RAG jika backend dikonfigurasi, selain itu Static. Dispatcher
// per-panggilan (RagPatientEngine sendiri fallback per-kasus bila perlu).
function createPatientEngine() {
  return (typeof window !== 'undefined' && window.OPHTHA_API_BASE)
    ? RagPatientEngine
    : StaticPatientEngine;
}

var PatientEngine = createPatientEngine();

// Konsisten dengan pola codebase (window.* untuk simbol lintas-file).
// Sub-step C3-2: debrief perlu sessionId backend utk minta skor Evaluator.
function getRagSessionId(caseId) { return _ragSessionByCase[caseId] || null; }

window.StaticPatientEngine = StaticPatientEngine;
window.RagPatientEngine = RagPatientEngine;
window.createPatientEngine = createPatientEngine;
window.getRagSessionId = getRagSessionId;
window.PatientEngine = PatientEngine;
