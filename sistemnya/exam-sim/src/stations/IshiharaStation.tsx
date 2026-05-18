// Station Ishihara (plan §5.6). Plate pseudoisochromatic PROCEDURAL
// (IP-safe, kontrak §3B.3). Mahasiswa administer ke pasien virtual; respons
// pasien dari substrat (od/os correct). Anti-cheat: tak ada label jawaban —
// mahasiswa menally & klasifikasi. KONDISIONAL → record 'color_vision'.
import { useMemo, useState } from 'react';
import { useExam } from '../store';

type Eye = 'OD' | 'OS';
const PLATES = ['12', '8', '6', '29', '57', '74'];

const FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

function digitMask(num: string): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const digits = num.split('');
  const cw = 5,
    ch = 7;
  digits.forEach((d, di) => {
    const grid = FONT[d] ?? FONT['0'];
    for (let r = 0; r < ch; r++)
      for (let c = 0; c < cw; c++)
        if (grid[r][c] === '1')
          pts.push([di * (cw + 1) + c, r]);
  });
  return pts;
}

function Plate({ num, blind }: { num: string; blind: boolean }) {
  const dots = useMemo(() => {
    const mask = new Set(digitMask(num).map(([x, y]) => `${x},${y}`));
    const cols = num.length * 6;
    const out: Array<{ x: number; y: number; r: number; c: string }> = [];
    const fg = blind ? ['#b8ab98', '#a89a86', '#cbbfa9'] : ['#d97706', '#ea580c', '#f59e0b'];
    const bg = ['#65a30d', '#16a34a', '#22c55e', '#a3e635'];
    for (let i = 0; i < 520; i++) {
      const ang = Math.random() * 6.2832;
      const rad = Math.sqrt(Math.random()) * 95;
      const x = 100 + rad * Math.cos(ang);
      const y = 100 + rad * Math.sin(ang);
      const gx = Math.floor(((x - 28) / 144) * cols);
      const gy = Math.floor(((y - 36) / 128) * 7);
      const on = mask.has(`${gx},${gy}`);
      out.push({
        x,
        y,
        r: 2.6 + Math.random() * 3,
        c: on ? fg[i % fg.length] : bg[i % bg.length],
      });
    }
    return out;
  }, [num, blind]);

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="rounded-full bg-[#efe9d9]">
      <clipPath id="cp">
        <circle cx="100" cy="100" r="95" />
      </clipPath>
      <g clipPath="url(#cp)">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
        ))}
      </g>
    </svg>
  );
}

export function IshiharaStation() {
  const sub = useExam((s) => s.renderSubstrate('color_vision')) as Record<string, number>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['color_vision']);

  const [eye, setEye] = useState<Eye>('OD');
  const [idx, setIdx] = useState(0);
  const [odCorrect, setOdCorrect] = useState('');
  const [osCorrect, setOsCorrect] = useState('');
  const [type, setType] = useState('');

  const total = Number(sub.total ?? 11);
  const correctCount = Number(sub[eye === 'OD' ? 'od_correct' : 'os_correct'] ?? 11);
  const rightUpTo = Math.round((correctCount / total) * PLATES.length);
  const patientBlind = idx >= rightUpTo; // pasien gagal plate ini
  const patientSays = patientBlind ? '“tidak terlihat / samar”' : `“${PLATES[idx]}”`;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Tes Ishihara</h2>
        <p className="text-exam-mut text-xs">
          Plate prosedural · administer per mata · catat skor &amp; klasifikasi
        </p>
      </header>

      <div className="flex gap-2">
        {(['OD', 'OS'] as Eye[]).map((e) => (
          <button
            key={e}
            onClick={() => {
              setEye(e);
              setIdx(0);
            }}
            className={`rounded-md px-4 py-1.5 text-sm ${
              eye === e ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
            }`}
          >
            Mata {e}
          </button>
        ))}
      </div>

      <div className="bg-exam-panel border-exam-line flex flex-col items-center gap-3 rounded-xl border p-6">
        <Plate num={PLATES[idx]} blind={patientBlind} />
        <div className="text-exam-ink text-sm">
          Plate {idx + 1}/{PLATES.length} · Pasien: <span className="text-exam-accent">{patientSays}</span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="border-exam-line text-exam-mut rounded-md border px-3 py-1 text-xs disabled:opacity-30"
          >
            ‹ Sebelumnya
          </button>
          <button
            disabled={idx >= PLATES.length - 1}
            onClick={() => setIdx((i) => Math.min(PLATES.length - 1, i + 1))}
            className="border-exam-line text-exam-ink rounded-md border px-3 py-1 text-xs disabled:opacity-30"
          >
            Plate berikutnya ›
          </button>
        </div>
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Benar OD (/{total})</div>
          <input
            type="number"
            min={0}
            max={total}
            value={odCorrect}
            onChange={(e) => setOdCorrect(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Benar OS (/{total})</div>
          <input
            type="number"
            min={0}
            max={total}
            value={osCorrect}
            onChange={(e) => setOsCorrect(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Klasifikasi</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="normal">Normal</option>
            <option value="protan">Protan</option>
            <option value="deutan">Deutan</option>
            <option value="acquired">Acquired</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          disabled={odCorrect === '' || osCorrect === '' || !type}
          onClick={() =>
            recordStation('color_vision', {
              recorded: {
                od_correct: Number(odCorrect),
                os_correct: Number(osCorrect),
                type,
              },
              procedureSteps: ['administer Ishihara OD', 'administer Ishihara OS'],
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
