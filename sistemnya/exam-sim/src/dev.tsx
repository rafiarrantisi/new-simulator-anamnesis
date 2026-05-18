// Dev harness SAJA (bukan artefak produksi). Mensimulasikan cara app
// legacy memanggil modul: lazy-import → mountExamSim() ke host Shadow DOM.
// Param via query: ?api=…&session=…&token=…  (default → localhost:8000).
import { mountExamSim } from './mount';

const q = new URLSearchParams(location.search);
const host = document.getElementById('exam-host')!;

mountExamSim(host, {
  apiBase: q.get('api') ?? 'http://localhost:8000',
  sessionId: q.get('session') ?? 'dev-no-session',
  token: q.get('token') ?? 'dev-no-token',
  onExit: (report) => {
    // eslint-disable-next-line no-console
    console.log('[exam-sim dev] exit', report);
  },
});
