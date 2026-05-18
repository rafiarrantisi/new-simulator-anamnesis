import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STATIONS, useExam } from './store';
import type { AnyStationId, ExamSimOptions } from './types';
import { VAStation } from './stations/VAStation';
import { PupilStation } from './stations/PupilStation';
import { MotilityStation } from './stations/MotilityStation';
import { VisualFieldStation } from './stations/VisualFieldStation';
import { AmslerStation } from './stations/AmslerStation';
import { IshiharaStation } from './stations/IshiharaStation';
import { TonometryStation } from './stations/TonometryStation';
import { SlitLampStation } from './stations/SlitLampStation';

// L3 Pixi.js — lazy: init WebGL/GPU ditunda sampai station dibuka
// (plan §3.1/§3.2, kontrak §3B.3).
const FundoscopyStation = lazy(() =>
  import('./stations/FundoscopyStation').then((m) => ({ default: m.FundoscopyStation })),
);
const FluoresceinStation = lazy(() =>
  import('./stations/FluoresceinStation').then((m) => ({ default: m.FluoresceinStation })),
);

function StationLoading({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-exam-mut text-sm">{label}</p>
    </div>
  );
}

function StationPlaceholder({ id }: { id: AnyStationId }) {
  // Honest: station ini increment terjadwal (kontrak Changelog v0.10.0).
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl opacity-30">⋯</div>
      <p className="text-exam-mut max-w-md text-sm">
        Station <span className="text-exam-ink font-semibold">{id}</span> belum
        diimplementasi. Pola sama seperti VA (seam + skor server-side) —
        increment terjadwal (ARCHITECTURE.md Changelog v0.10.0).
      </p>
    </div>
  );
}

function ExamShell() {
  const current = useExam((s) => s.current);
  const records = useExam((s) => s.records);
  const navigate = useExam((s) => s.navigate);
  const submit = useExam((s) => s.submit);

  return (
    <div className="grid h-full grid-cols-[220px_1fr] gap-0">
      <nav className="bg-exam-panel border-exam-line flex flex-col gap-1 border-r p-3">
        <div className="text-exam-mut mb-2 px-2 text-xs uppercase tracking-wider">
          Pemeriksaan Mata
        </div>
        {STATIONS.map((st) => {
          const done = !!records[st.id]?.completed;
          const active = st.id === current;
          return (
            <button
              key={st.id}
              onClick={() => navigate(st.id)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                active
                  ? 'bg-exam-accent/15 text-exam-accent'
                  : 'text-exam-ink hover:bg-white/5'
              }`}
            >
              <span>
                {st.label}
                {st.conditional && (
                  <span className="text-exam-mut ml-1 text-[10px]">·kond</span>
                )}
              </span>
              {done && <span className="text-exam-ok text-xs">✓</span>}
            </button>
          );
        })}
        <button
          onClick={() => void submit()}
          className="bg-exam-accent/90 hover:bg-exam-accent mt-auto rounded-lg px-3 py-2 text-sm font-semibold text-black transition"
        >
          Akhiri &amp; Nilai
        </button>
      </nav>

      <main className="relative overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {current === 'visual_acuity' ? (
              <VAStation />
            ) : current === 'pupils_rapd' ? (
              <PupilStation />
            ) : current === 'ocular_motility' ? (
              <MotilityStation />
            ) : current === 'visual_field' ? (
              <VisualFieldStation />
            ) : current === 'amsler' ? (
              <AmslerStation />
            ) : current === 'color_vision' ? (
              <IshiharaStation />
            ) : current === 'tonometry' ? (
              <TonometryStation />
            ) : current === 'slit_lamp' ? (
              <SlitLampStation />
            ) : current === 'fundoscopy' ? (
              <Suspense fallback={<StationLoading label="memuat Pixi viewport…" />}>
                <FundoscopyStation />
              </Suspense>
            ) : current === 'fluorescein' ? (
              <Suspense fallback={<StationLoading label="memuat Pixi viewport…" />}>
                <FluoresceinStation />
              </Suspense>
            ) : (
              <StationPlaceholder id={current} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      {children}
    </div>
  );
}

export default function App({ opts }: { opts: ExamSimOptions }) {
  const phase = useExam((s) => s.phase);
  const error = useExam((s) => s.error);
  const report = useExam((s) => s.report);
  const init = useExam((s) => s.init);
  const exit = useExam((s) => s.exit);

  useEffect(() => {
    void init(opts);
  }, [init, opts]);

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <Centered>
        <motion.div
          className="border-exam-accent h-10 w-10 rounded-full border-2 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
        <p className="text-exam-mut text-sm">
          {phase === 'loading' ? 'Memuat sesi pemeriksaan…' : 'Menilai (server)…'}
        </p>
      </Centered>
    );
  }

  if (phase === 'error') {
    return (
      <Centered>
        <p className="text-exam-danger text-sm">Gagal: {error}</p>
        <button
          onClick={() => void init(opts)}
          className="border-exam-line text-exam-ink rounded-lg border px-4 py-2 text-sm"
        >
          Coba lagi
        </button>
      </Centered>
    );
  }

  if (phase === 'debrief' && report) {
    return (
      <Centered>
        <div className="text-exam-mut text-xs uppercase tracking-wider">
          Skor Pemeriksaan (server-side)
        </div>
        <div className="text-exam-accent text-6xl font-bold">
          {report.examTotalScore}
          <span className="text-exam-mut text-2xl">/100</span>
        </div>
        <div className="max-w-lg space-y-2 text-left text-sm">
          {report.positiveNotes.length > 0 && (
            <p className="text-exam-ok">+ {report.positiveNotes.join('; ')}</p>
          )}
          {report.procedureNotes.length > 0 && (
            <p className="text-exam-warn">⚠ {report.procedureNotes.join('; ')}</p>
          )}
          {report.missedFindings.length > 0 && (
            <details className="text-exam-mut">
              <summary className="cursor-pointer">
                Terlewat ({report.missedFindings.length})
              </summary>
              <ul className="ml-4 mt-1 list-disc">
                {report.missedFindings.slice(0, 12).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <button
          onClick={exit}
          className="bg-exam-accent rounded-lg px-5 py-2 text-sm font-semibold text-black"
        >
          Selesai
        </button>
      </Centered>
    );
  }

  return <ExamShell />;
}
