// Station Fundoscopy (plan §5.10). L3 Pixi.js v8 (lazy). Viewport bulat +
// pan/zoom + estimator CDR interaktif. Fundus = ILUSTRASI prosedural
// (real photo = asset pipeline §8, terjadwal — plan §9.2 honesty).
// Anti-cheat: CDR sebenarnya hanya memposisikan cup, tak ditampilkan.
import { useEffect, useRef, useState } from 'react';
import { Container, Graphics } from 'pixi.js';
import { usePixiApp } from '../pixi/usePixiApp';
import { useExam } from '../store';

type Eye = 'OD' | 'OS';

export function FundoscopyStation() {
  const sub = useExam((s) => s.renderSubstrate('fundoscopy')) as Record<string, string | number>;
  const recordStation = useExam((s) => s.recordStation);
  const saved = useExam((s) => s.records['fundoscopy']);
  const { hostRef, app } = usePixiApp(420, 420);

  const [eye, setEye] = useState<Eye>('OD');
  const [discR, setDiscR] = useState(70);
  const [cupR, setCupR] = useState(28);
  const [discTxt, setDiscTxt] = useState('');
  const [macTxt, setMacTxt] = useState('');
  const worldRef = useRef<Container | null>(null);

  const trueCdr = Number(sub[eye === 'OD' ? 'cdr_od' : 'cdr_os'] ?? 0.3);
  const estCdr = +(cupR / discR).toFixed(2);

  // Build scene once app ready
  useEffect(() => {
    if (!app) return;
    const world = new Container();
    app.stage.addChild(world);
    worldRef.current = world;

    // viewport bulat (mask oftalmoskop)
    const mask = new Graphics().circle(210, 210, 200).fill(0xffffff);
    app.stage.addChild(mask);
    world.mask = mask;

    // fundus illustration (gradien jingga-merah berlapis)
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      world.addChild(
        new Graphics()
          .circle(210, 210, 60 + t * 180)
          .fill({ color: 0xc8521e, alpha: 0.10 }),
      );
    }
    world.addChild(new Graphics().circle(210, 210, 230).fill(0x9b3d12));

    // pembuluh darah (arkade)
    const vessels = new Graphics();
    for (let k = -2; k <= 2; k++) {
      vessels
        .moveTo(285, 210)
        .bezierCurveTo(220, 150 + k * 22, 130, 130 + k * 34, 40, 110 + k * 40)
        .stroke({ width: 3, color: 0x7a1f10, alpha: 0.7 });
    }
    world.addChild(vessels);

    // pan/zoom
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const canvas = app.canvas;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      world.x += e.clientX - lx;
      world.y += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = world.scale.x * (e.deltaY < 0 ? 1.1 : 0.9);
      world.scale.set(Math.min(3, Math.max(0.6, s)));
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      world.destroy({ children: true });
      mask.destroy();
    };
  }, [app]);

  // Optic disc + cup + estimator overlay (re-draw saat berubah)
  const discLayerRef = useRef<Graphics | null>(null);
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    discLayerRef.current?.destroy();
    const g = new Graphics();
    // disc asli (skala dgn trueCdr) — visual yg ditafsir mahasiswa
    g.circle(150, 200, 56).fill(0xf2c987);
    g.circle(150, 200, 56 * trueCdr).fill(0xf7e7c8);
    // overlay estimasi mahasiswa (lingkaran ungu)
    g.circle(150, 200, discR / 1.4).stroke({ width: 2, color: 0xb18cff });
    g.circle(150, 200, cupR / 1.4).stroke({ width: 2, color: 0x4cc2ff });
    world.addChild(g);
    discLayerRef.current = g;
  }, [discR, cupR, trueCdr, app]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-exam-ink text-xl font-semibold">Funduskopi</h2>
          <p className="text-exam-mut text-xs">
            Viewport bulat · pan (drag) / zoom (scroll) · estimasi CDR
          </p>
        </div>
        <span className="bg-exam-warn/15 text-exam-warn rounded-full px-3 py-1 text-[11px]">
          Ilustrasi prosedural
        </span>
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

      <div className="flex flex-wrap gap-6">
        <div
          ref={hostRef}
          className="border-exam-line overflow-hidden rounded-full border"
          style={{ width: 420, height: 420 }}
        />
        <div className="flex min-w-[240px] flex-1 flex-col gap-4">
          <label className="text-sm">
            <div className="text-exam-mut mb-1 flex justify-between text-xs">
              <span>Batas disc</span>
              <span>{discR}</span>
            </div>
            <input
              type="range"
              min={40}
              max={110}
              value={discR}
              onChange={(e) => setDiscR(+e.target.value)}
              className="accent-exam-accent w-full"
            />
          </label>
          <label className="text-sm">
            <div className="text-exam-mut mb-1 flex justify-between text-xs">
              <span>Batas cup</span>
              <span>{cupR}</span>
            </div>
            <input
              type="range"
              min={8}
              max={108}
              value={cupR}
              onChange={(e) => setCupR(+e.target.value)}
              className="accent-exam-accent w-full"
            />
          </label>
          <div className="bg-exam-panel border-exam-line rounded-lg border p-3 text-sm">
            <span className="text-exam-mut">Estimasi CDR Anda:</span>{' '}
            <span className="text-exam-accent font-semibold">{estCdr}</span>
          </div>
          <input
            placeholder="Deskripsi optic disc…"
            value={discTxt}
            onChange={(e) => setDiscTxt(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink rounded-md border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Deskripsi makula…"
            value={macTxt}
            onChange={(e) => setMacTxt(e.target.value)}
            className="bg-exam-bg border-exam-line text-exam-ink rounded-md border px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={!discTxt}
          onClick={() =>
            recordStation('fundoscopy', {
              recorded:
                eye === 'OD'
                  ? { disc_od: discTxt, cdr_od: estCdr, macula_od: macTxt }
                  : { disc_os: discTxt, cdr_os: estCdr, macula_os: macTxt },
              procedureSteps: ['mulai dari disc', 'telusuri pembuluh', 'makula terakhir'],
              completed: true,
            })
          }
          className="bg-exam-accent rounded-lg px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {saved?.completed ? 'Perbarui' : `Simpan ${eye}`}
        </button>
      </div>
    </div>
  );
}
