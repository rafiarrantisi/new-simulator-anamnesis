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
    // Guard: kasus RAG-adapted tak punya `responses` (case-adapter netral).
    // Tanpa guard ini, fallback ke Static pada kasus RAG → TypeError →
    // bubble pasien kosong (bug v0.11.0). Aman: default netral.
    var responses = caseContext && caseContext.responses;
    var responseData = (responses && (responses[category] || responses['default']))
      || { text: '(Maaf, jawaban pasien tidak tersedia untuk kasus ini.)', found: null, isRedFlag: false };
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

async function _ragNewGuest() {
  // C1 dev bridge: buat tamu baru (signup() menyimpan auth via saveAuth).
  // Domain valid (backend EmailStr menolak TLD special-use .local/.test).
  var rnd = Math.random().toString(36).slice(2, 10);
  return window.ApiDataStore.signup({
    email: 'guest_' + Date.now() + '_' + rnd + '@ophtha-guest.com',
    password: 'guest-' + rnd,
    full_name: 'Tamu',
  });
}

async function _ragAuthHeader() {
  var auth = await window.ApiDataStore.loadAuth();
  if (!auth || !auth.token) auth = await _ragNewGuest();
  return 'Bearer ' + auth.token;
}

// Hasil graceful saat RAG gagal total — JANGAN pakai StaticPatientEngine
// untuk kasus RAG (tak punya `responses` → crash → bubble kosong).
function _ragErrorResult() {
  var msg = '(Maaf, sambungan ke pasien terputus sebentar. Coba kirim '
    + 'pertanyaan lagi ya, Dok.)';
  return {
    category: 'default',
    responseData: { text: msg, found: null, isRedFlag: false },
    reply: msg,
    detectedDomain: null,
    audioUrl: null,
  };
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

// ============================================================
// WebSocket streaming (Tier A v0.13.0)
// Persistent WS per-sessionId. Backend protokol §6:
//   IN  {type:'text', text}
//   OUT {type:'chunk', text} × N, {type:'turn_complete'} | {type:'error', message}
// Antrian FIFO per sesi: setiap respond() menambah job ke queue, lalu
// menunggu chunk + turn_complete. Persistent connection → TTFT pure LLM.
// ============================================================
var _ragWsBySession = {};         // sid → WebSocket
var _ragQueueBySession = {};      // sid → [{resolve,reject,onChunk,accum,done}]

function _wsUrlFor(sid, token) {
  var base = _ragApiBase();
  var ws = base.replace(/^http/, 'ws'); // https → wss, http → ws
  return ws + '/api/sessions/' + sid + '/ws?token=' + encodeURIComponent(token);
}

async function _ensureWs(sid) {
  var existing = _ragWsBySession[sid];
  if (existing && existing.readyState === WebSocket.OPEN) return existing;
  if (existing && existing.readyState === WebSocket.CONNECTING) {
    await new Promise(function (res, rej) {
      existing.addEventListener('open', res, { once: true });
      existing.addEventListener('error', function () { rej(new Error('ws-failed')); }, { once: true });
    });
    return existing;
  }
  // Pastikan auth (auto-guest jika perlu) lalu pakai raw token (bukan "Bearer ...").
  var auth = await window.ApiDataStore.loadAuth();
  if (!auth || !auth.token) auth = await _ragNewGuest();
  var ws = new WebSocket(_wsUrlFor(sid, auth.token));
  _ragWsBySession[sid] = ws;
  _ragQueueBySession[sid] = _ragQueueBySession[sid] || [];

  ws.addEventListener('message', function (ev) {
    var data;
    try { data = JSON.parse(ev.data); } catch (e) { return; }
    var queue = _ragQueueBySession[sid];
    if (!queue || !queue.length) return;
    var head = queue[0];
    if (data.type === 'chunk') {
      var t = data.text || '';
      head.accum += t;
      try { if (head.onChunk) head.onChunk(t); } catch (e) {}
    } else if (data.type === 'turn_complete') {
      head.done = true;
      head.resolve(head.accum);
      queue.shift();
    } else if (data.type === 'error') {
      head.done = true;
      head.reject(new Error(data.message || 'ws-error'));
      queue.shift();
    }
  });
  ws.addEventListener('close', function (ev) {
    delete _ragWsBySession[sid];
    var queue = _ragQueueBySession[sid] || [];
    queue.forEach(function (t) {
      if (!t.done) t.reject(new Error(ev.code === 4401 ? 'auth-expired' : 'ws-closed'));
    });
    _ragQueueBySession[sid] = [];
  });

  await new Promise(function (res, rej) {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', function () { rej(new Error('ws-failed')); }, { once: true });
  });
  return ws;
}

function _sendOverWs(sid, text, onChunk) {
  return _ensureWs(sid).then(function (ws) {
    return new Promise(function (resolve, reject) {
      var queue = _ragQueueBySession[sid] = _ragQueueBySession[sid] || [];
      queue.push({ resolve: resolve, reject: reject, onChunk: onChunk, accum: '', done: false });
      ws.send(JSON.stringify({ type: 'text', text: text }));
    });
  });
}

function closeRagWs() {
  Object.keys(_ragWsBySession).forEach(function (sid) {
    try { _ragWsBySession[sid].close(1000); } catch (e) {}
  });
  _ragWsBySession = {};
  _ragQueueBySession = {};
}

var RagPatientEngine = {
  respond: async function (input, opts) {
    var caseId = _ragCaseId(input);
    // Bukan RAG-capable / backend tak dikonfigurasi → kasus legacy yang
    // PUNYA `responses` → Static aman.
    if (!caseId || !_ragApiBase() || !window.ApiDataStore) {
      return StaticPatientEngine.respond(input);
    }
    var onChunk = (opts && typeof opts.onChunk === 'function') ? opts.onChunk : null;
    async function attempt() {
      var sid = await _ragSession(caseId, input.mode);
      var reply = await _sendOverWs(sid, input.userMessage, onChunk);
      return reply || '';
    }
    var reply;
    try {
      reply = await attempt();
    } catch (e1) {
      // Token kadaluarsa (close code 4401) / sesi mati → tamu baru + sesi
      // baru + ulang SEKALI (mirror logic REST sebelumnya, kontrak §3B.1).
      try {
        if (_ragWsBySession[_ragSessionByCase[caseId]]) {
          try { _ragWsBySession[_ragSessionByCase[caseId]].close(1000); } catch (e) {}
        }
        await _ragNewGuest();
        delete _ragSessionByCase[caseId];
        reply = await attempt();
      } catch (e2) {
        return _ragErrorResult(); // graceful (BUKAN Static — crash di RAG)
      }
    }
    if (!reply) return _ragErrorResult();
    // Bentuk kompatibel simulator.jsx. Scoring RAG = post-session
    // Evaluator (kontrak §3A). Note: onChunk SUDAH dipanggil per chunk
    // selama stream — di sini tidak panggil lagi.
    return {
      category: 'default',
      responseData: { text: reply, found: null, isRedFlag: false },
      reply: reply,
      detectedDomain: null,
      audioUrl: null,
    };
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
window.closeRagWs = closeRagWs;
