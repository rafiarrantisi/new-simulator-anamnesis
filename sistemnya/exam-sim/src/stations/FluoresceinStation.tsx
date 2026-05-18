// Station Fluorescein (plan §5.8). L3 Pixi.js v8 (lazy). Cobalt-blue via
// overlay tint (robust, hindari risiko API filter v8) + staining hijau per
// substrat. Seidel test. KONDISIONAL → record 'fluorescein'. Anti-cheat:
// pola dari substrat = visual; mahasiswa menafsir & mencatat.
import { useEffect, useRef, useState } from 'react';
import { Container, Graphics } from 'pixi.js';
import { usePixiApp } from '../pixi/usePixiApp';
import { useExam } from '../store';

export function FluoresceinStation() {
  const sub = useExam((s) => s.renderSubstrate('fluorescein')) as Record<string, unknown>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['fluorescein']);
  const { hostRef, app } = usePixiApp(440, 360, 0x0b0f14);

  const [cobalt, setCobalt] = useState(false);
  const [seidelTest, setSeidelTest] = useState(false);
  const [pattern, setPattern] = useState('');
  const [location, setLocation] = useState('');
  const [seidel, setSeidel] = useState('');

  const truePattern = String(sub.pattern ?? 'none');
  const trueSeidel = sub.seidel === true;
  const layerRef = useRef<Container | null>(null);

  useEffect(() => {
    if (!app) return;
    const root = new Container();
    app.stage.addChild(root);
    layerRef.current = root;

    // mata segmen anterior (sklera, kornea, pupil)
    root.addChild(new Graphics().ellipse(220, 180, 200, 130).fill(0xf3ece0));
    root.addChild(new Graphics().circle(220, 180, 96).fill(0xcfe0ea));
    root.addChild(new Graphics().circle(220, 180, 44).fill(0x2a3a4d));
    root.addChild(new Graphics().circle(220, 180, 20).fill(0x05080c));

    // cobalt-blue tint overlay (toggle)
    const blue = new Graphics().rect(0, 0, 440, 360).fill({ color: 0x1030d0, alpha: 0.0 });
    blue.label = 'cobalt';
    root.addChild(blue);

    // staining hijau-kuning per pola (di atas cobalt)
    const stain = new Graphics();
    const green = { color: 0x9bff5c, alpha: 0.0 };
    if (truePattern.includes('spk') || truePattern.includes('punctate')) {
      for (let i = 0; i < 40; i++)
        stain.circle(180 + Math.random() * 80, 150 + Math.random() * 70, 2.5).fill(green);
    } else if (truePattern.includes('abrasion') || truePattern.includes('ulcer') || truePattern.includes('defect')) {
      stain.ellipse(220, 185, 34, 24).fill(green);
    } else if (truePattern.includes('dendrite')) {
      stain
        .moveTo(200, 160)
        .lineTo(225, 180)
        .lineTo(210, 205)
        .lineTo(245, 195)
        .stroke({ width: 4, color: 0x9bff5c, alpha: 0 });
    }
    stain.label = 'stain';
    root.addChild(stain);

    // Seidel: aliran gelap (aqueous) menembus fluorescein
    const seidelG = new Graphics()
      .moveTo(220, 180)
      .bezierCurveTo(224, 220, 230, 270, 236, 330)
      .stroke({ width: 8, color: 0x0a1a0a, alpha: 0 });
    seidelG.label = 'seidel';
    root.addChild(seidelG);

    return () => {
      root.destroy({ children: true });
    };
  }, [app, truePattern]);

  // toggle cobalt / staining / seidel visibility
  useEffect(() => {
    const root = layerRef.current;
    if (!root) return;
    const find = (n: string) => root.children.find((c) => (c as Graphics).label === n) as Graphics | undefined;
    const b = find('cobalt');
    const s = find('stain');
    const sd = find('seidel');
    if (b) b.alpha = cobalt ? 0.55 : 0;
    if (s) s.alpha = cobalt ? 1 : 0.15;
    if (sd) sd.alpha = cobalt && seidelTest && trueSeidel ? 0.9 : 0;
  }, [cobalt, seidelTest, trueSeidel, app, truePattern]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-exam-ink text-xl font-semibold">Fluorescein</h2>
          <p className="text-exam-mut text-xs">
            Teteskan fluorescein · cobalt-blue · nilai pola · Seidel test
          </p>
        </div>
        <span className="bg-exam-warn/15 text-exam-warn rounded-full px-3 py-1 text-[11px]">
          Kondisional · ilustrasi
        </span>
      </header>

      <div
        ref={hostRef}
        className="border-exam-line mx-auto overflow-hidden rounded-xl border"
        style={{ width: 440, height: 360 }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCobalt((v) => !v)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            cobalt ? 'bg-exam-accent text-black' : 'border-exam-line text-exam-ink border'
          }`}
        >
          {cobalt ? 'Cobalt-blue: ON' : 'Nyalakan cobalt-blue'}
        </button>
        <button
          onClick={() => setSeidelTest((v) => !v)}
          disabled={!cobalt}
          className="border-exam-line text-exam-ink rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
        >
          {seidelTest ? 'Seidel: diamati' : 'Lakukan Seidel test'}
        </button>
      </div>

      <div className="bg-exam-panel border-exam-line grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Pola staining</div>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {['none', 'spk', 'abrasion', 'dendrite', 'ulcer', 'punctate'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Lokasi</div>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="mis. central / inferior 1/3"
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <div className="text-exam-mut mb-1 text-xs">Seidel</div>
          <select
            value={seidel}
            onChange={(e) => setSeidel(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            <option value="false">Negatif</option>
            <option value="true">Positif</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          disabled={!pattern || !seidel}
          onClick={() =>
            recordStation('fluorescein', {
              recorded: { pattern, location, seidel: seidel === 'true' },
              procedureSteps: ['teteskan fluorescein', 'cobalt-blue', 'Seidel test'],
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
