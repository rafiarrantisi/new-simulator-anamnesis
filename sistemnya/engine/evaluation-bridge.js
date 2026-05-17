// ============================================================
// Evaluation bridge (C3 sub-step 2, kontrak v0.7.2).
// Ambil skor LLM-judge dari backend (POST /api/scoring/evaluate) lalu
// PETAKAN EvaluationReport §3A → bentuk `scoring` lama yang dibaca
// DebriefScreen (screens.jsx:780–786) — tanpa merombak DebriefScreen.
// Rubrik beda (40/20/20/20) dipetakan best-effort ke widget legacy;
// laporan kaya (missedItems/positiveNotes) = sub-step lanjutan (markup).
// ============================================================

async function fetchRagScoring(caseId) {
  try {
    if (!window.OPHTHA_API_BASE || !window.ApiDataStore || !window.getRagSessionId) return null;
    var sid = window.getRagSessionId(caseId);
    if (!sid) return null;
    var auth = await window.ApiDataStore.loadAuth();
    if (!auth || !auth.token) return null;
    // Timeout ~75s: LLM-judge bisa lambat; jangan menggantung selamanya.
    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 75000);
    var res;
    try {
      res = await fetch(window.OPHTHA_API_BASE + '/api/scoring/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
        body: JSON.stringify({ session_id: sid }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(to);
    }
    var j = await res.json();
    if (!res.ok || j.success === false || !j.data) return null;
    var r = j.data;
    var bd = r.breakdown || {};
    var cov = (bd.coverage && bd.coverage.score) || 0;
    var covMax = (bd.coverage && bd.coverage.max) || 40;
    var rf = (bd.redFlags && bd.redFlags.score) || 0;
    var rfMax = (bd.redFlags && bd.redFlags.max) || 20;
    var total = r.totalScore || 0;
    // Petakan ke 7 field yg dibaca DebriefScreen.
    return {
      score: total,
      completeness: covMax ? Math.round((cov / covMax) * 100) : 0,
      confidence: total,
      criticalCovered: rf,
      criticalTotal: rfMax,
      redFlagsFound: rf,
      totalRedFlags: rfMax,
      _report: r, // laporan asli (missedItems/positiveNotes) utk dipakai nanti
    };
  } catch (e) {
    return null; // scoring tak boleh menggagalkan alur debrief
  }
}

if (typeof window !== 'undefined') {
  window.fetchRagScoring = fetchRagScoring;
}
