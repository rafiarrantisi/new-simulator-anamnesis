// ============================================================
// ExamEngine seam (kontrak §3B.1 / §3B.4 #4). Pola C1 (engine/*.js,
// shared-scope, window global). Menjembatani app legacy → modul
// exam-sim TERISOLASI (Shadow DOM) tanpa menyentuh design.css/markup.
//
// ADITIF & DORMANT: hanya aktif bila DIPANGGIL. Call-site di DOM legacy
// = langkah K6 (gated verifikasi browser + slot markup) — sengaja BELUM
// dipasang agar invarian byte-identical §8.1 pasti aman.
//
// Pemakaian (saat K6): const off = await window.OphthaExam.mount(el, caseId,
//   function(report){ /* lanjut ke debrief */ });  off() utk unmount.
// ============================================================

(function () {
  // Bundle exam-sim hasil build terisolasi (paket terpisah). URL boleh
  // di-override saat deploy via window.OPHTHA_EXAM_BUNDLE. Default =
  // lokasi build (`sistemnya/exam-sim/dist/`) relatif root yang dilayani
  // (cocok utk Vite dev & static-serve sistemnya/). Deploy lain → override.
  var DEFAULT_BUNDLE = '/exam-sim/dist/exam-sim.js';

  function isAvailable() {
    // Flag selektor sama seperti RAG/C1: backend dikonfigurasi.
    return !!window.OPHTHA_API_BASE;
  }

  async function mount(hostEl, caseId, onExit) {
    try {
      if (!hostEl || !isAvailable()) return null;
      var sid =
        window.getRagSessionId && caseId ? window.getRagSessionId(caseId) : null;
      if (!sid) return null;
      var auth =
        window.ApiDataStore && window.ApiDataStore.loadAuth
          ? await window.ApiDataStore.loadAuth()
          : null;
      if (!auth || !auth.token) return null;

      var url = window.OPHTHA_EXAM_BUNDLE || DEFAULT_BUNDLE;
      var mod = await import(/* @vite-ignore */ url);
      var mountFn = mod.mountExamSim || (mod.default && mod.default.mountExamSim) || mod.default;
      if (typeof mountFn !== 'function') return null;

      // exam-sim mengelola Shadow DOM-nya sendiri (CSS tak bocor 2 arah).
      return mountFn(hostEl, {
        apiBase: window.OPHTHA_API_BASE,
        sessionId: sid,
        token: auth.token,
        onExit: typeof onExit === 'function' ? onExit : function () {},
      });
    } catch (e) {
      // Seam tak boleh menggagalkan alur legacy (pola evaluation-bridge).
      if (window.console) console.warn('[OphthaExam] mount gagal:', e);
      return null;
    }
  }

  if (typeof window !== 'undefined') {
    window.OphthaExam = { isAvailable: isAvailable, mount: mount };
  }
})();
