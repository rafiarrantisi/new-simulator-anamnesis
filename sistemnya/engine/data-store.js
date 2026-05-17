// ============================================================
// OphthaSim — DataStore (abstraksi persistensi, lihat ARCHITECTURE.md §4)
// ------------------------------------------------------------
// Scope Fase 1 (kontrak v0.2.0): interface + LocalDataStore DIPERKENALKAN
// sebagai modul, tapi call-site lama BELUM dibongkar (YAGNI — tanpa
// backend, mengganti semua pemanggil hanya indireksi tanpa manfaat).
// Adopsi call-site inkremental mulai Fase 2 (ApiDataStore).
//
// LocalDataStore mereplikasi perilaku localStorage yang ada sekarang —
// key & bentuk data identik dengan kode lama (App inline + data.js).
// ============================================================

var LocalDataStore = {
  loadProfile: function () {
    // loadProfile() global (data.js) — sumber kebenaran lama.
    return Promise.resolve(loadProfile());
  },
  saveProfile: function (p) {
    saveProfile(p); // saveProfile() global (data.js)
    return Promise.resolve();
  },

  loadSettings: function () {
    try {
      var s = localStorage.getItem('ophtha_settings');
      return Promise.resolve(s ? JSON.parse(s) : null);
    } catch (e) { return Promise.resolve(null); }
  },
  saveSettings: function (s) {
    try { localStorage.setItem('ophtha_settings', JSON.stringify(s)); } catch (e) {}
    return Promise.resolve();
  },

  loadAuth: function () {
    try {
      var raw = localStorage.getItem('ophtha_auth');
      return Promise.resolve(raw ? JSON.parse(raw) : null);
    } catch (e) { return Promise.resolve(null); }
  },
  saveAuth: function (a) {
    try {
      if (a) localStorage.setItem('ophtha_auth', JSON.stringify(a));
      else localStorage.removeItem('ophtha_auth');
    } catch (e) {}
    return Promise.resolve();
  },

  listCases: function () {
    // CASES global (data.js + cases-extra.js push). Salinan agar tak termutasi.
    return Promise.resolve(Array.isArray(CASES) ? CASES.slice() : []);
  },
  saveCustomCase: function (c) {
    if (typeof saveCustomCase === 'function') saveCustomCase(c);
    return Promise.resolve(c);
  },
  deleteCustomCase: function (id) {
    if (typeof deleteCustomCase === 'function') deleteCustomCase(id);
    return Promise.resolve();
  },

  // Riwayat sesi: di Fase 1 disimpan via Profile (perilaku lama). Endpoint
  // nyata /api/sessions baru ada di Fase 2 — placeholder no-op di sini.
  recordSession: function (_result) {
    return Promise.resolve();
  },
};

// ============================================================
// ApiDataStore (Fase 2, kontrak v0.4.0 §4) — backend FastAPI.
// Aktif jika window.OPHTHA_API_BASE di-set; selain itu LocalDataStore
// (fallback offline/dev). Auth session disimpan di localStorage
// 'ophtha_api_auth' (token Bearer). Memenuhi interface DataStore +
// metode bantu login/signup (auth bukan bagian interface inti).
// Cutover call-site sinkron→async = increment terjadwal berikut (§4).
// ============================================================

var API_AUTH_KEY = 'ophtha_api_auth';

function _apiBase() {
  return (typeof window !== 'undefined' && window.OPHTHA_API_BASE) || '';
}

function _readApiAuth() {
  try {
    var raw = localStorage.getItem(API_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

async function _apiFetch(path, opts) {
  opts = opts || {};
  var headers = { 'Content-Type': 'application/json' };
  var auth = _readApiAuth();
  if (auth && auth.token) headers['Authorization'] = 'Bearer ' + auth.token;
  var res = await fetch(_apiBase() + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  var json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  if (!res.ok || (json && json.success === false)) {
    // Kontrak §3: jangan telan error — lempar agar UI bisa fallback/retry.
    throw new Error((json && json.error) || ('HTTP ' + res.status));
  }
  return json ? json.data : null;
}

var ApiDataStore = {
  // — auth (metode bantu di luar interface inti) —
  login: async function (email, password) {
    var s = await _apiFetch('/api/auth/login', {
      method: 'POST', body: { email: email, password: password },
    });
    await ApiDataStore.saveAuth(s);
    return s;
  },
  signup: async function (payload) {
    var s = await _apiFetch('/api/auth/signup', { method: 'POST', body: payload });
    await ApiDataStore.saveAuth(s);
    return s;
  },

  loadAuth: function () { return Promise.resolve(_readApiAuth()); },
  saveAuth: function (a) {
    try {
      if (a) localStorage.setItem(API_AUTH_KEY, JSON.stringify(a));
      else localStorage.removeItem(API_AUTH_KEY);
    } catch (e) {}
    return Promise.resolve();
  },

  loadProfile: async function () {
    var d = await _apiFetch('/api/users/me');
    // Map ke bentuk Profile yang dipakai UI (kontrak §5.4) sebisanya.
    return {
      name: d.full_name || 'Dokter Muda',
      school: d.school || '', year: d.year || '',
      avatarEmoji: d.avatar_emoji || '👤', avatarColor: d.avatar_color || '#5865F2',
      xp: d.xp || 0, streak: d.streak || 0,
      totalSessions: d.total_sessions || 0,
      completedCaseIds: [], favoriteCaseIds: [],
      sessionDates: {}, dailyCompleted: {},
      _server: d,
    };
  },
  saveProfile: async function (p) {
    await _apiFetch('/api/users/me', {
      method: 'PATCH',
      body: {
        full_name: p.name, school: p.school, year: p.year,
        avatar_emoji: p.avatarEmoji, avatar_color: p.avatarColor,
      },
    });
  },

  // Settings = preferensi klien; backend belum punya endpoint → localStorage.
  loadSettings: LocalDataStore.loadSettings,
  saveSettings: LocalDataStore.saveSettings,

  listCases: function () {
    // Mengembalikan CaseSummary[] (kontrak §5.6) — beda dari Case legacy.
    return _apiFetch('/api/cases');
  },
  saveCustomCase: function () {
    // Custom-case oleh student belum di-scope backend (Fase 3+).
    return Promise.reject(new Error('saveCustomCase via API belum tersedia (Fase 3+)'));
  },
  deleteCustomCase: function () {
    return Promise.reject(new Error('deleteCustomCase via API belum tersedia (Fase 3+)'));
  },

  recordSession: async function (result) {
    // Best-effort: buat sesi + tandai selesai. Scoring nyata = /scoring
    // /evaluate (Fase 3 stub). result diharapkan punya caseId & mode.
    var caseId = (result && (result.caseId || result.case_id)) || '';
    var mode = (result && result.mode) || 'normal';
    if (!caseId) return;
    var s = await _apiFetch('/api/sessions', {
      method: 'POST', body: { case_id: caseId, mode: mode },
    });
    await _apiFetch('/api/sessions/' + s.sessionId, {
      method: 'PATCH', body: { status: 'completed' },
    });
  },
};

// Selector: API jika window.OPHTHA_API_BASE di-set, selain itu Local.
function createDataStore() {
  return _apiBase() ? ApiDataStore : LocalDataStore;
}

var DataStore = createDataStore();

window.LocalDataStore = LocalDataStore;
window.ApiDataStore = ApiDataStore;
window.createDataStore = createDataStore;
window.DataStore = DataStore;
