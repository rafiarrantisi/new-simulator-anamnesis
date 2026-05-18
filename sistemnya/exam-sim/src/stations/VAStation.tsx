// Station Visual Acuity (plan §5.1). L1+L2: HTML/Tailwind + Framer Motion.
// Anti-cheat: TIDAK menampilkan jawaban (kontrak §3B.1). Mahasiswa
// menjalankan prosedur lalu MENCATAT temuannya; skor = server-side.
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '../store';

type EyeSel = 'OD' | 'OS';
type PerEye = Record<EyeSel, string>;

const VA_ROWS = [
  { label: '6/60', letters: 'E' },
  { label: '6/36', letters: 'F P' },
  { label: '6/24', letters: 'T O Z' },
  { label: '6/18', letters: 'L P E D' },
  { label: '6/12', letters: 'P E C F D' },
  { label: '6/9', letters: 'E D F C Z P' },
  { label: '6/6', letters: 'F E L O P Z D' },
  { label: '6/5', letters: 'D E F P O T E C' },
];
const LOW_VISION = ['CF', 'HM', 'PL', 'NPL'];
const NEAR = ['N5', 'N6', 'N8', 'N10', 'N12', 'N18', 'N24'];

function fontPx(i: number): number {
  return Math.round(64 - i * 6.2); // 6/60 besar → 6/5 kecil
}
function worseThan69(va: string): boolean {
  const order = ['6/5', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', ...LOW_VISION];
  const idx = order.indexOf(va);
  return idx === -1 ? false : idx > order.indexOf('6/9');
}

export function VAStation() {
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['visual_acuity']);

  const [tested, setTested] = useState<EyeSel | null>(null);
  const [glasses, setGlasses] = useState(true);
  const [va, setVa] = useState<PerEye>({ OD: '', OS: '' });
  const [pinhole, setPinhole] = useState<PerEye>({ OD: '', OS: '' });
  const [near, setNear] = useState<PerEye>({ OD: '', OS: '' });
  const [steps, setSteps] = useState<string[]>([]);

  const examineEye = (eye: EyeSel) => {
    setTested(eye);
    setSteps((prev) =>
      prev.some((s) => s.includes(eye)) ? prev : [...prev, `periksa ${eye}`],
    );
  };

  const occluderOn: EyeSel | null = tested === 'OD' ? 'OS' : tested === 'OS' ? 'OD' : null;
  const canSave = va.OD !== '' && va.OS !== '';

  const recorded = useMemo(
    () => ({
      od: va.OD || null,
      os: va.OS || null,
      pinhole_od: pinhole.OD || null,
      pinhole_os: pinhole.OS || null,
      near_od: near.OD || null,
      near_os: near.OS || null,
      with_correction: glasses,
    }),
    [va, pinhole, near, glasses],
  );

  const save = () => {
    recordStation('visual_acuity', {
      recorded,
      procedureSteps: steps,
      completed: true,
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-exam-ink text-xl font-semibold">Visual Acuity</h2>
          <p className="text-exam-mut text-xs">
            Snellen 6 m · oklusi satu mata · pinhole bila &lt; 6/9 · jarak dekat
          </p>
        </div>
        {saved?.completed && (
          <span className="text-exam-ok bg-exam-ok/10 rounded-full px-3 py-1 text-xs">
            tersimpan
          </span>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-exam-panel border-exam-line flex gap-1 rounded-lg border p-1">
          {(['OD', 'OS'] as EyeSel[]).map((e) => (
            <button
              key={e}
              onClick={() => examineEye(e)}
              className={`rounded-md px-4 py-1.5 text-sm transition ${
                tested === e
                  ? 'bg-exam-accent text-black'
                  : 'text-exam-ink hover:bg-white/5'
              }`}
            >
              Periksa {e}
            </button>
          ))}
        </div>
        <label className="text-exam-mut flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={glasses}
            onChange={(ev) => setGlasses(ev.target.checked)}
            className="accent-exam-accent"
          />
          Dengan koreksi (kacamata)
        </label>
      </div>

      {/* Eye illustration + occluder (Framer Motion) */}
      <div className="flex items-center justify-center gap-10 py-2">
        {(['OD', 'OS'] as EyeSel[]).map((e) => (
          <div key={e} className="relative">
            <svg width="64" height="44" viewBox="0 0 64 44" aria-label={`Mata ${e}`}>
              <ellipse cx="32" cy="22" rx="30" ry="18" fill="#0f1620" stroke="#1f2a37" />
              <circle cx="32" cy="22" r="11" fill="#2a3a4d" />
              <circle cx="32" cy="22" r="5" fill="#05080c" />
            </svg>
            <motion.div
              className="bg-exam-line absolute inset-0 flex items-center justify-center rounded-md text-xs text-white/70"
              initial={false}
              animate={{ opacity: occluderOn === e ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ pointerEvents: 'none' }}
            >
              tertutup
            </motion.div>
            <div className="text-exam-mut mt-1 text-center text-xs">{e}</div>
          </div>
        ))}
      </div>

      {/* Snellen chart */}
      <div className="bg-white text-center text-black rounded-xl p-6">
        {VA_ROWS.map((row, i) => {
          const isPick = tested && va[tested] === row.label;
          return (
            <motion.button
              key={row.label}
              disabled={!tested}
              onClick={() => tested && setVa({ ...va, [tested]: row.label })}
              whileHover={tested ? { scale: 1.03 } : undefined}
              className={`snellen-line block w-full disabled:cursor-not-allowed ${
                isPick ? 'bg-exam-accent/20 rounded' : ''
              }`}
              style={{ fontSize: fontPx(i), opacity: tested ? 1 : 0.35 }}
            >
              <span className="text-exam-mut mr-3 align-middle text-[10px]">
                {row.label}
              </span>
              {row.letters.replace(/ /g, ' ')}
            </motion.button>
          );
        })}
      </div>

      {tested && (
        <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
          <div>
            <div className="text-exam-mut mb-1 text-xs">Low vision ({tested})</div>
            <div className="flex flex-wrap gap-1">
              {LOW_VISION.map((lv) => (
                <button
                  key={lv}
                  onClick={() => setVa({ ...va, [tested]: lv })}
                  className={`rounded-md px-2.5 py-1 text-xs ${
                    va[tested] === lv
                      ? 'bg-exam-accent text-black'
                      : 'border-exam-line text-exam-ink border'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-exam-mut mb-1 text-xs">
              Pinhole {tested} {worseThan69(va[tested]) ? '' : '(opsional)'}
            </div>
            <select
              value={pinhole[tested]}
              onChange={(ev) => setPinhole({ ...pinhole, [tested]: ev.target.value })}
              className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {VA_ROWS.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-exam-mut mb-1 text-xs">Jarak dekat {tested}</div>
            <select
              value={near[tested]}
              onChange={(ev) => setNear({ ...near, [tested]: ev.target.value })}
              className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {NEAR.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-exam-mut text-xs">
          {steps.length > 0 ? `Urutan: ${steps.join(' → ')}` : 'Pilih mata untuk mulai'}
        </p>
        <button
          disabled={!canSave}
          onClick={save}
          className="bg-exam-accent rounded-lg px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          Simpan Station
        </button>
      </div>
    </div>
  );
}
