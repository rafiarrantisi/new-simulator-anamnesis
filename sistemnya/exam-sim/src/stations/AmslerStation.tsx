// Station Amsler Grid (plan §5.5). L2 SVG + filter. Metamorphopsia via
// feTurbulence+feDisplacementMap; scotoma via patch. Anti-cheat: distorsi
// dari substrat (mahasiswa melihat→menilai), label tak ditampilkan.
// Station KONDISIONAL (kontrak §3B.2).
import { useState } from 'react';
import { useExam } from '../store';

type Eye = 'OD' | 'OS';
const N = 16;

export function AmslerStation() {
  const sub = useExam((s) => s.renderSubstrate('amsler')) as Record<string, string>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['amsler']);

  const [eye, setEye] = useState<Eye>('OD');
  const [od, setOd] = useState('');
  const [os, setOs] = useState('');

  const cond = String(sub[eye === 'OD' ? 'od' : 'os'] ?? 'normal').toLowerCase();
  const distort = /metamorph|distors/.test(cond);
  const scotoma = /scotoma|skotoma/.test(cond);
  const micro = /micro|mikro/.test(cond);

  const lines = Array.from({ length: N + 1 });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Amsler Grid</h2>
        <p className="text-exam-mut text-xs">
          Fiksasi titik tengah · laporkan garis bergelombang / area hilang
        </p>
      </header>

      <div className="flex gap-2">
        {(['OD', 'OS'] as Eye[]).map((e) => (
          <button
            key={e}
            onClick={() => setEye(e)}
            className={`rounded-md px-4 py-1.5 text-sm ${
              eye === e ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
            }`}
          >
            Mata {e}
          </button>
        ))}
      </div>

      <div className="mx-auto rounded-xl bg-white p-4">
        <svg width="320" height="320" viewBox="0 0 320 320">
          <defs>
            <filter id="meta">
              <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves={2} result="t" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="t"
                scale={distort ? 22 : 0}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <radialGradient id="sc">
              <stop offset="0%" stopColor="#888" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#aaa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g filter={distort ? 'url(#meta)' : undefined} transform={micro ? 'scale(0.9) translate(18 18)' : undefined}>
            {lines.map((_, i) => (
              <line key={`h${i}`} x1={10} y1={10 + i * 18.75} x2={310} y2={10 + i * 18.75} stroke="#222" strokeWidth="1" />
            ))}
            {lines.map((_, i) => (
              <line key={`v${i}`} x1={10 + i * 18.75} y1={10} x2={10 + i * 18.75} y2={310} stroke="#222" strokeWidth="1" />
            ))}
          </g>
          {scotoma && <circle cx="160" cy="160" r="46" fill="url(#sc)" />}
          <circle cx="160" cy="160" r="4" fill="#c00" />
        </svg>
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        {(
          [
            ['OD', od, setOd],
            ['OS', os, setOs],
          ] as const
        ).map(([lbl, val, set]) => (
          <label key={lbl} className="text-sm">
            <div className="text-exam-mut mb-1 text-xs">Penilaian {lbl}</div>
            <select
              value={val}
              onChange={(e) => set(e.target.value)}
              className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              <option value="normal">Normal</option>
              <option value="metamorphopsia">Metamorphopsia</option>
              <option value="scotoma">Scotoma</option>
              <option value="micropsia">Micropsia</option>
            </select>
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          disabled={!od || !os}
          onClick={() =>
            recordStation('amsler', {
              recorded: { od, os },
              procedureSteps: ['fiksasi sentral OD', 'fiksasi sentral OS'],
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
