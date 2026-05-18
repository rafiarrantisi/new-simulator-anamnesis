// Station Visual Field (plan §5.4). L2 SVG interaktif. Konfrontasi 4
// kuadran/mata → reveal status; lalu kuis lokalisasi. Anti-cheat: status
// kuadran dari substrat (bukan label nilai); mahasiswa simpulkan + catat.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '../store';

type Eye = 'OD' | 'OS';
const QUAD = ['superior', 'temporal', 'inferior', 'nasal'] as const;
type Quad = (typeof QUAD)[number];

function quadStatus(field: string, q: Quad): 'full' | 'defect' | 'absent' {
  const f = field.toLowerCase();
  if (/full|normal|tidak ada defek/.test(f)) return 'full';
  if (/absent|tidak ada respons|hilang total/.test(f)) return 'absent';
  if (f.includes(q)) return 'absent';
  if (/defek|defect|scotoma|skotoma|curtain|tirai|quadrant|kuadran/.test(f)) return 'defect';
  return 'full';
}

export function VisualFieldStation() {
  const sub = useExam((s) => s.renderSubstrate('visual_field')) as Record<string, string>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['visual_field']);

  const [tested, setTested] = useState<Record<string, boolean>>({});
  const [odConcl, setOdConcl] = useState('');
  const [osConcl, setOsConcl] = useState('');
  const [pattern, setPattern] = useState('');

  const FieldMap = ({ eye }: { eye: Eye }) => {
    const field = String(sub[eye === 'OD' ? 'od' : 'os'] ?? 'full');
    return (
      <div className="flex flex-col items-center gap-2">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="74" fill="#0f1620" stroke="#1f2a37" />
          {QUAD.map((q, i) => {
            const key = `${eye}-${q}`;
            const seen = tested[key];
            const st = quadStatus(field, q);
            const a0 = (i * Math.PI) / 2 - Math.PI / 4;
            const a1 = a0 + Math.PI / 2;
            const path = `M80 80 L${80 + 74 * Math.cos(a0)} ${80 + 74 * Math.sin(a0)} A74 74 0 0 1 ${80 + 74 * Math.cos(a1)} ${80 + 74 * Math.sin(a1)} Z`;
            return (
              <motion.path
                key={key}
                d={path}
                onClick={() => setTested((p) => ({ ...p, [key]: true }))}
                className="cursor-pointer"
                initial={{ fill: '#121823' }}
                animate={{
                  fill: !seen
                    ? '#121823'
                    : st === 'full'
                      ? '#1b3a2a'
                      : st === 'defect'
                        ? '#5a4410'
                        : '#5a1414',
                }}
                stroke="#1f2a37"
              />
            );
          })}
          <circle cx="80" cy="80" r="4" fill="#4cc2ff" />
        </svg>
        <span className="text-exam-mut text-xs">{eye} — klik kuadran utk konfrontasi</span>
      </div>
    );
  };

  const allTested = QUAD.every((q) => tested[`OD-${q}`] && tested[`OS-${q}`]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Lapang Pandang</h2>
        <p className="text-exam-mut text-xs">Konfrontasi finger-counting · 4 kuadran/mata · lokalisasi</p>
      </header>

      <div className="bg-exam-panel border-exam-line flex justify-center gap-12 rounded-xl border p-6">
        <FieldMap eye="OD" />
        <FieldMap eye="OS" />
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
        {(
          [
            ['OD', odConcl, setOdConcl],
            ['OS', osConcl, setOsConcl],
          ] as const
        ).map(([lbl, val, set]) => (
          <label key={lbl} className="text-sm">
            <div className="text-exam-mut mb-1 text-xs">Kesimpulan {lbl}</div>
            <select
              value={val}
              onChange={(e) => set(e.target.value)}
              className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              <option value="full to finger counting">Full to finger counting</option>
              <option value="defek parsial">Defek parsial</option>
              <option value="defek berat">Defek berat / absent</option>
            </select>
          </label>
        ))}
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Pola defek</div>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="none">Tidak ada</option>
            <option value="bitemporal">Bitemporal</option>
            <option value="homonymous_right">Homonim kanan</option>
            <option value="homonymous_left">Homonim kiri</option>
            <option value="central_scotoma">Skotoma sentral</option>
            <option value="altitudinal">Altitudinal</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-exam-mut text-xs">
          {allTested ? 'Semua kuadran diuji' : 'Uji semua kuadran OD & OS'}
        </p>
        <button
          disabled={!odConcl || !osConcl || !allTested}
          onClick={() =>
            recordStation('visual_field', {
              recorded: { od: odConcl, os: osConcl, defect_pattern: pattern },
              procedureSteps: ['konfrontasi 4 kuadran OD', 'konfrontasi 4 kuadran OS'],
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
