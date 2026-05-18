// Station Ocular Motility (plan §5.3). L2 SVG + Framer Motion. H-pattern 9
// posisi; restriksi → mata terbatas (animasi berhenti). Anti-cheat:
// substrat menggerakkan mata, mahasiswa simpulkan full/restricted.
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '../store';

const GAZE = [
  { id: 'up_left', x: -1, y: -1 }, { id: 'up', x: 0, y: -1 }, { id: 'up_right', x: 1, y: -1 },
  { id: 'left', x: -1, y: 0 }, { id: 'primary', x: 0, y: 0 }, { id: 'right', x: 1, y: 0 },
  { id: 'down_left', x: -1, y: 1 }, { id: 'down', x: 0, y: 1 }, { id: 'down_right', x: 1, y: 1 },
];

interface Restriction { eye?: string; direction?: string; grade?: string }

export function MotilityStation() {
  const sub = useExam((s) => s.renderSubstrate('ocular_motility')) as Record<string, unknown>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['ocular_motility']);

  const [gaze, setGaze] = useState('primary');
  const [tested, setTested] = useState<string[]>([]);
  const [concl, setConcl] = useState('');
  const [diplopia, setDiplopia] = useState(false);

  const restrictions: Restriction[] = useMemo(() => {
    try {
      return JSON.parse(String(sub.restrictions ?? '[]')) as Restriction[];
    } catch {
      return [];
    }
  }, [sub.restrictions]);
  const isFull = sub.full !== false && restrictions.length === 0;

  const pos = GAZE.find((g) => g.id === gaze)!;
  const limited = (eye: 'OD' | 'OS') =>
    restrictions.some(
      (r) => (r.eye ?? '').toUpperCase().includes(eye) && gaze.includes((r.direction ?? '').toLowerCase()),
    );

  const Eye = ({ label }: { label: 'OD' | 'OS' }) => {
    const lim = limited(label);
    const tx = pos.x * (lim ? 7 : 16);
    const ty = pos.y * (lim ? 7 : 16);
    return (
      <svg width="120" height="80" viewBox="0 0 120 80">
        <ellipse cx="60" cy="40" rx="52" ry="32" fill="#0f1620" stroke="#1f2a37" />
        <motion.circle
          cx={60}
          cy={40}
          r="13"
          fill="#2a3a4d"
          animate={{ cx: 60 + tx, cy: 40 + ty }}
          transition={{ type: lim ? 'tween' : 'spring', stiffness: 200, damping: 18, duration: lim ? 0.18 : undefined }}
        />
        <motion.circle cx={60} cy={40} r="6" fill="#040404" animate={{ cx: 60 + tx, cy: 40 + ty }} />
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#8b98a5">
          {label}{lim ? ' · terbatas' : ''}
        </text>
      </svg>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Motilitas Okular</h2>
        <p className="text-exam-mut text-xs">H-pattern 9 posisi · cover test · diplopia</p>
      </header>

      <div className="bg-exam-panel border-exam-line flex justify-center gap-10 rounded-xl border p-6">
        <Eye label="OD" />
        <Eye label="OS" />
      </div>

      <div className="mx-auto grid grid-cols-3 gap-2">
        {GAZE.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setGaze(g.id);
              setTested((p) => (p.includes(g.id) ? p : [...p, g.id]));
            }}
            className={`h-10 w-20 rounded-md text-xs transition ${
              gaze === g.id ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
            }`}
          >
            {g.id}
          </button>
        ))}
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Kesimpulan gerakan</div>
          <select
            value={concl}
            onChange={(e) => setConcl(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="full">Penuh ke segala arah</option>
            <option value="restricted">Ada keterbatasan</option>
          </select>
        </label>
        <label className="text-exam-mut flex items-end gap-2 text-sm">
          <input
            type="checkbox"
            checked={diplopia}
            onChange={(e) => setDiplopia(e.target.checked)}
            className="accent-exam-accent mb-2"
          />
          Diplopia (+)
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-exam-mut text-xs">
          {tested.length}/9 posisi diuji{isFull ? '' : ' · pola terbatas terdeteksi'}
        </p>
        <button
          disabled={!concl || tested.length < 5}
          onClick={() =>
            recordStation('ocular_motility', {
              recorded: {
                full: concl === 'full',
                notes: `${concl === 'full' ? 'Penuh' : 'Terbatas'}${diplopia ? ', diplopia (+)' : ''}`,
              },
              procedureSteps: [`uji ${tested.length} posisi gaze`],
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
