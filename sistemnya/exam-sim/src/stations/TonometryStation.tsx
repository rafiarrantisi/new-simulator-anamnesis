// Station Tonometry (plan §5.9). Goldmann applanation: dua mira setengah
// lingkaran; mahasiswa memutar dial sampai inner-edge bertemu, lalu BACA
// dial. Anti-cheat: IOP sebenarnya (substrat) hanya memposisikan mira —
// tak pernah ditampilkan; mahasiswa menemukan endpoint & mencatat.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '../store';

type Eye = 'OD' | 'OS';

export function TonometryStation() {
  const sub = useExam((s) => s.renderSubstrate('tonometry')) as Record<string, number>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['tonometry']);

  const [eye, setEye] = useState<Eye>('OD');
  const [dial, setDial] = useState(10);
  const [odIop, setOdIop] = useState<number | null>(null);
  const [osIop, setOsIop] = useState<number | null>(null);

  const trueIop = Number(sub[eye === 'OD' ? 'iop_od' : 'iop_os'] ?? 15);
  // Offset mira: 0 saat dial == trueIop (endpoint), makin jauh makin besar.
  const offset = (trueIop - dial) * 2.4;
  const aligned = Math.abs(trueIop - dial) <= 0.6;

  const capture = () => {
    if (eye === 'OD') setOdIop(dial);
    else setOsIop(dial);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <header>
        <h2 className="text-exam-ink text-xl font-semibold">Tonometri Goldmann</h2>
        <p className="text-exam-mut text-xs">
          Anestesi topikal + fluorescein · pertemukan inner-edge mira · baca dial
        </p>
      </header>

      <div className="flex gap-2">
        {(['OD', 'OS'] as Eye[]).map((e) => (
          <button
            key={e}
            onClick={() => {
              setEye(e);
              setDial(10);
            }}
            className={`rounded-md px-4 py-1.5 text-sm ${
              eye === e ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
            }`}
          >
            Mata {e}
          </button>
        ))}
      </div>

      <div className="bg-exam-panel border-exam-line flex flex-col items-center gap-4 rounded-xl border p-6">
        {/* Cobalt-blue view dgn dua mira semicircle */}
        <svg width="240" height="240" viewBox="0 0 240 240" className="rounded-full bg-[#0a2540]">
          <circle cx="120" cy="120" r="92" fill="#0d3b66" />
          <motion.path
            d="M 70 120 A 50 50 0 0 1 170 120"
            fill="none"
            stroke="#7fe3a1"
            strokeWidth="7"
            animate={{ x: -offset, y: -6 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          />
          <motion.path
            d="M 70 120 A 50 50 0 0 0 170 120"
            fill="none"
            stroke="#7fe3a1"
            strokeWidth="7"
            animate={{ x: offset, y: 6 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          />
          {aligned && (
            <motion.circle
              cx="120"
              cy="120"
              r="58"
              fill="none"
              stroke="#5ce39b"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
            />
          )}
        </svg>

        <div className="w-full max-w-xs">
          <div className="text-exam-mut mb-1 flex justify-between text-xs">
            <span>Dial (mmHg)</span>
            <span className="text-exam-ink">{dial.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={0.5}
            value={dial}
            onChange={(e) => setDial(+e.target.value)}
            className="accent-exam-accent w-full"
          />
          <p className={`mt-1 text-center text-xs ${aligned ? 'text-exam-ok' : 'text-exam-mut'}`}>
            {aligned ? 'Inner-edge bertemu — baca dial sekarang' : 'Belum sejajar'}
          </p>
        </div>

        <button
          onClick={capture}
          className="bg-exam-accent rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          Tetapkan IOP {eye} = {dial.toFixed(1)}
        </button>
        <div className="text-exam-mut text-xs">
          OD: {odIop ?? '—'} mmHg · OS: {osIop ?? '—'} mmHg
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={odIop === null || osIop === null}
          onClick={() =>
            recordStation('tonometry', {
              recorded: { iop_od: odIop, iop_os: osIop, method: 'goldmann' },
              procedureSteps: ['anestesi topikal + fluorescein', 'aplanasi OD', 'aplanasi OS'],
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
