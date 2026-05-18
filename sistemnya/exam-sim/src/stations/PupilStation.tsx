// Station Pupil + RAPD (plan §5.2). Fidelitas tinggi: SVG iris + Framer
// Motion spring + GSAP swinging-flashlight. Anti-cheat: animasi fisiologis
// (paradoxical dilation) jadi substrat — mahasiswa MENYIMPULKAN RAPD,
// label jawaban tak pernah ditampilkan. Skor = server-side.
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useExam } from '../store';

type Light = 'off' | 'od' | 'os';
type EyeSel = 'OD' | 'OS';

function rapdStrength(rapd: string, eye: EyeSel): number {
  // 1.0 = aferen normal; <1 = defek aferen relatif (plan §5.2).
  const r = rapd.toLowerCase();
  const hit = (r.includes('od') && eye === 'OD') || (r.includes('os') && eye === 'OS');
  if (!hit || r === 'none') return 1.0;
  const m = r.match(/([1-4])\s*plus/);
  const grade = m ? parseInt(m[1], 10) : 2;
  return Math.max(0.15, 1 - grade * 0.22); // makin tinggi grade makin lemah
}

export function PupilStation() {
  const sub = useExam((s) => s.renderSubstrate('pupils_rapd')) as Record<string, number | string>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['pupils_rapd']);

  const [light, setLight] = useState<Light>('off');
  const [dark, setDark] = useState(false);
  const [odSize, setOdSize] = useState(4);
  const [osSize, setOsSize] = useState(4);
  const [rapdConcl, setRapdConcl] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const torchRef = useRef<SVGGElement>(null);

  const rapd = String(sub.rapd ?? 'none');
  const odDim = Number(sub.odDim ?? 5);
  const osDim = Number(sub.osDim ?? 5);
  const odBright = Number(sub.odBright ?? 3);
  const osBright = Number(sub.osBright ?? 3);

  const radii = useMemo(() => {
    if (light === 'off' || !dark) return { od: odDim, os: osDim };
    const lit: EyeSel = light === 'od' ? 'OD' : 'OS';
    const s = rapdStrength(rapd, lit); // konsensual: kedua pupil ikut input aferen
    return {
      od: odDim - (odDim - odBright) * s,
      os: osDim - (osDim - osBright) * s,
    };
  }, [light, dark, rapd, odDim, osDim, odBright, osBright]);

  const logStep = (s: string) =>
    setSteps((p) => (p.includes(s) ? p : [...p, s]));

  const enterDark = () => {
    setDark(true);
    logStep('ruang semi-gelap');
  };

  useGSAP(
    () => {
      if (light === 'off' || !torchRef.current) return;
      gsap.fromTo(
        torchRef.current,
        { x: light === 'od' ? 60 : -60 },
        { x: 0, duration: 0.35, ease: 'power2.out' },
      );
    },
    { dependencies: [light] },
  );

  const swing = async () => {
    logStep('swinging flashlight test (ruang gelap)');
    const seq: Light[] = ['od', 'os', 'od', 'os', 'od'];
    for (const l of seq) {
      setLight(l);
      await new Promise((r) => setTimeout(r, 900)); // ≥ holding time
    }
  };

  const Pupil = ({ mm, label }: { mm: number; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <defs>
          <radialGradient id={`iris-${label}`} cx="50%" cy="45%">
            <stop offset="0%" stopColor="#6b4f2a" />
            <stop offset="55%" stopColor="#3a2c17" />
            <stop offset="100%" stopColor="#1c150b" />
          </radialGradient>
        </defs>
        <circle cx="75" cy="75" r="58" fill="#f3ece0" />
        <circle cx="75" cy="75" r="46" fill={`url(#iris-${label})`} />
        {Array.from({ length: 36 }).map((_, i) => (
          <line
            key={i}
            x1="75"
            y1="75"
            x2={75 + 46 * Math.cos((i / 36) * 6.283)}
            y2={75 + 46 * Math.sin((i / 36) * 6.283)}
            stroke="#00000022"
            strokeWidth="1"
          />
        ))}
        <motion.circle
          cx="75"
          cy="75"
          fill="#040404"
          animate={{ r: (mm / 9) * 40 + 6 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        />
        <g ref={label === 'OD' ? torchRef : undefined}>
          {((label === 'OD' && light === 'od') || (label === 'OS' && light === 'os')) && (
            <circle cx="75" cy="20" r="6" fill="#fff6c8" opacity="0.9" />
          )}
        </g>
      </svg>
      <span className="text-exam-mut text-xs">
        {label} · {mm.toFixed(1)} mm
      </span>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Pupil &amp; RAPD</h2>
        <p className="text-exam-mut text-xs">
          Ruang semi-gelap · refleks direct/consensual · swinging flashlight
        </p>
      </header>

      <div
        className={`rounded-xl p-6 transition-colors ${
          dark ? 'bg-[#05080c]' : 'bg-exam-panel'
        }`}
      >
        <div className="flex items-center justify-center gap-12">
          <Pupil mm={radii.od} label="OD" />
          <Pupil mm={radii.os} label="OS" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!dark ? (
          <button
            onClick={enterDark}
            className="bg-exam-accent rounded-lg px-4 py-2 text-sm font-semibold text-black"
          >
            Redupkan ruangan
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setLight('od');
                logStep('sinar OD');
              }}
              className="border-exam-line text-exam-ink rounded-lg border px-4 py-2 text-sm"
            >
              Sinar OD
            </button>
            <button
              onClick={() => {
                setLight('os');
                logStep('sinar OS');
              }}
              className="border-exam-line text-exam-ink rounded-lg border px-4 py-2 text-sm"
            >
              Sinar OS
            </button>
            <button
              onClick={() => setLight('off')}
              className="border-exam-line text-exam-mut rounded-lg border px-4 py-2 text-sm"
            >
              Matikan
            </button>
            <button
              onClick={() => void swing()}
              className="bg-exam-warn/90 rounded-lg px-4 py-2 text-sm font-semibold text-black"
            >
              Swinging flashlight
            </button>
          </>
        )}
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Ukuran OD (mm)</div>
          <input
            type="range"
            min={2}
            max={9}
            step={0.5}
            value={odSize}
            onChange={(e) => setOdSize(+e.target.value)}
            className="accent-exam-accent w-full"
          />
          <div className="text-exam-ink">{odSize} mm</div>
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Ukuran OS (mm)</div>
          <input
            type="range"
            min={2}
            max={9}
            step={0.5}
            value={osSize}
            onChange={(e) => setOsSize(+e.target.value)}
            className="accent-exam-accent w-full"
          />
          <div className="text-exam-ink">{osSize} mm</div>
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Kesimpulan RAPD</div>
          <select
            value={rapdConcl}
            onChange={(e) => setRapdConcl(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="none">Tidak ada RAPD</option>
            <option value="OD">RAPD positif OD</option>
            <option value="OS">RAPD positif OS</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-exam-mut text-xs">
          {steps.length ? `Urutan: ${steps.join(' → ')}` : 'Mulai: redupkan ruangan'}
        </p>
        <button
          disabled={!rapdConcl}
          onClick={() =>
            recordStation('pupils_rapd', {
              recorded: {
                od_size: odSize,
                os_size: osSize,
                od_react: 'dinilai',
                os_react: 'dinilai',
                rapd: rapdConcl,
              },
              procedureSteps: steps,
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
