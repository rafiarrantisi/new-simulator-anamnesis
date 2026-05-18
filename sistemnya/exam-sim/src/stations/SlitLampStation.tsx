// Station Slit Lamp — Phase 1 SCHEMATIC mode (plan §5.7 + §9.2 "educational
// honesty": diberi label tegas "Diagram Skematik", bukan pura-pura realistis;
// upgrade volumetrik R3F = Batch E). L2 SVG. Mode iluminasi mengubah
// struktur yang revelatif. Anti-cheat: substrat = visual; mahasiswa catat.
import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '../store';
import { ErrorBoundary } from '../ErrorBoundary';

// L4 R3F volumetrik — lazy (three/r3f berat, GPU ditunda; plan §5.7 Ph3).
const SlitLampVolumetric = lazy(() =>
  import('./SlitLampVolumetric').then((m) => ({ default: m.SlitLampVolumetric })),
);

const MODES = [
  { id: 'diffuse', label: 'Diffuse' },
  { id: 'direct', label: 'Direct focal' },
  { id: 'retro', label: 'Retro-illuminasi' },
] as const;
type Mode = (typeof MODES)[number]['id'];

const STRUCTS = [
  { key: 'lids', label: 'Kelopak & bulu mata' },
  { key: 'conjunctiva', label: 'Konjungtiva/sklera' },
  { key: 'cornea', label: 'Kornea' },
  { key: 'anterior_chamber', label: 'Bilik mata depan' },
  { key: 'iris', label: 'Iris' },
  { key: 'lens', label: 'Lensa' },
] as const;

export function SlitLampStation() {
  const sub = useExam((s) => s.renderSubstrate('slit_lamp')) as Record<string, string>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['slit_lamp']);

  const [mode, setMode] = useState<Mode>('diffuse');
  const [examined, setExamined] = useState<string[]>([]);
  const [rec, setRec] = useState<Record<string, string>>({});
  const [view3d, setView3d] = useState(false);

  // Mode mana paling revelatif untuk tiap struktur (pedagogi §5.7)
  const revealedBy: Record<string, Mode> = {
    cornea: 'direct',
    lens: 'retro',
    iris: 'retro',
    anterior_chamber: 'direct',
    lids: 'diffuse',
    conjunctiva: 'diffuse',
  };

  const beamX = mode === 'diffuse' ? 0 : mode === 'direct' ? 70 : 130;
  const beamW = mode === 'diffuse' ? 220 : mode === 'direct' ? 10 : 30;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-exam-ink text-xl font-semibold">Slit Lamp</h2>
          <p className="text-exam-mut text-xs">
            Cross-section kornea · pilih mode iluminasi · catat per struktur
          </p>
        </div>
        <button
          onClick={() => setView3d((v) => !v)}
          className={`rounded-full px-3 py-1 text-[11px] ${
            view3d
              ? 'bg-exam-accent text-black'
              : 'bg-exam-warn/15 text-exam-warn'
          }`}
        >
          {view3d ? 'Volumetrik 3D (Premium)' : 'Mode Diagram Skematik'}
        </button>
      </header>

      {view3d && (
        <ErrorBoundary
          fallback={
            <div className="border-exam-line text-exam-mut rounded-xl border p-4 text-center text-xs">
              GPU/WebGL tak tersedia — gunakan Mode Diagram Skematik (plan §3.3).
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="text-exam-mut p-6 text-center text-xs">
                memuat mesin 3D (R3F)…
              </div>
            }
          >
            <SlitLampVolumetric />
          </Suspense>
        </ErrorBoundary>
      )}

      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-4 py-1.5 text-sm ${
              mode === m.id ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Cross-section schematic */}
      <div className="bg-exam-panel border-exam-line overflow-hidden rounded-xl border">
        <svg width="100%" height="220" viewBox="0 0 360 220">
          <rect width="360" height="220" fill="#0a1019" />
          <motion.rect
            y="0"
            height="220"
            fill="#bfe3ff"
            opacity="0.10"
            animate={{ x: beamX, width: beamW }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          {[
            ['Epitel', 28, '#8fd3ff'],
            ['Stroma', 60, '#cfe8ff'],
            ['Descemet', 96, '#7aa9c9'],
            ['Endotel', 108, '#9fc6e0'],
          ].map(([n, y, c], i) => (
            <g key={i}>
              <rect x="20" y={y as number} width="320" height="22" rx="4" fill={c as string} opacity="0.85" />
              <text x="28" y={(y as number) + 15} fontSize="11" fill="#04222f">
                {n} — {String(sub.cornea ?? 'jernih')}
              </text>
            </g>
          ))}
          <rect x="20" y="140" width="320" height="40" rx="4" fill="#0e2a3a" />
          <text x="28" y="164" fontSize="11" fill="#bfe3ff">
            BMD: {String(sub.anterior_chamber ?? 'dalam & tenang')}
          </text>
          <rect x="20" y="186" width="320" height="22" rx="4" fill="#172033" />
          <text x="28" y="201" fontSize="11" fill="#8b98a5">
            Iris: {String(sub.iris ?? 'normal')} · Lensa: {String(sub.lens ?? 'jernih')}
          </text>
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STRUCTS.map((s) => {
          const best = revealedBy[s.key];
          const visible = mode === best || best === 'diffuse';
          return (
            <div
              key={s.key}
              className={`border-exam-line rounded-lg border p-3 ${
                visible ? '' : 'opacity-50'
              }`}
            >
              <div className="text-exam-mut mb-1 flex items-center justify-between text-xs">
                <span>{s.label}</span>
                {!visible && (
                  <span className="text-exam-warn text-[10px]">mode {best}</span>
                )}
              </div>
              <input
                disabled={!visible}
                placeholder={visible ? 'catat temuan…' : `pakai mode ${best}`}
                value={rec[s.key] ?? ''}
                onChange={(e) => {
                  setRec((p) => ({ ...p, [s.key]: e.target.value }));
                  setExamined((p) => (p.includes(s.key) ? p : [...p, s.key]));
                }}
                className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-exam-mut text-xs">
          {examined.length}/6 struktur diperiksa · urutan: adneksa→konj→kornea→BMD→iris→lensa
        </p>
        <button
          disabled={examined.length < 4}
          onClick={() =>
            recordStation('slit_lamp', {
              recorded: {
                lids: rec.lids ?? '',
                conjunctiva: rec.conjunctiva ?? '',
                cornea: rec.cornea ?? '',
                anterior_chamber: rec.anterior_chamber ?? '',
                iris: rec.iris ?? '',
                lens: rec.lens ?? '',
              },
              procedureSteps: ['adneksa', 'konjungtiva', 'kornea', 'BMD', 'iris', 'lensa'],
              completed: true,
            })
          }
          className="bg-exam-accent rounded-lg px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {saved?.completed ? 'Perbarui' : 'Simpan Station'}
        </button>
      </div>
    </div>
  );
}
