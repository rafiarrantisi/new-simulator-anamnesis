// ════════════════════════════════════════════════════════════════════
// Fundoscopy Station — V3 (Phase 1 MVP)
//
// Procedural flow per reference doc §10:
//   1. Setup        — dilate pupil (tropicamide), dim room
//   2. Red reflex   — from 50cm, large beam (cek leukocoria, opacities)
//   3. Optic disc   — DCM evaluation (Disc Colour, Cup, Margin, Vessels)
//   4. Vessels & periphery — 4 arcades, A:V ratio, AV nicking
//   5. Macula       — last (uncomfortable for patient)
//   6. Catat        — diagnosis + CDR + macula findings
//
// Theme: DARK (dilated pupil, dark room)
//
// Signature interaction:
//   - Circular viewport (simulates ophthalmoscope peephole)
//   - PAN by dragging, ZOOM with wheel/buttons
//   - CDR estimator: click center then edge of cup → measure
//   - Pathology overlay by case (drusen, hemorrhage, CWS, etc)
//
// Props: findings, ext, caseId, onComplete, onLog
//
// MIGRATION NOTES:
//   - Pan/zoom is a single transform matrix — Framer Motion `useDrag`
//     + `useScroll` will replace mouse handlers cleanly.
//   - For better photoreal in Phase 2: swap `<svg>` for `<canvas>` (or
//     Pixi.js per tech stack doc) keeping the same coord system.
// ════════════════════════════════════════════════════════════════════

// Fundus pathology presets — drives what's rendered on the fundus canvas
const FUNDUS_PATHOLOGY = {
  normal: {
    label: 'Normal Fundus', discPale: false, cupRatio: 0.3, cupNotch: false,
    hemorrhages: [], cottonWools: [], exudates: [], drusen: [], 
    macula: 'normal', vessels: 'normal', neovascular: false,
  },
  glaucoma: {
    label: 'Glaucomatous Disc', discPale: false, cupRatio: 0.75, cupNotch: true,
    hemorrhages: [], cottonWools: [], exudates: [], drusen: [],
    macula: 'normal', vessels: 'normal',
  },
  'optic-neuritis': {
    label: 'Disc Oedema / Papilledema', discPale: false, cupRatio: 0, cupNotch: false,
    discSwell: true, hemorrhages: [{ x: 0.55, y: 0.48, type: 'flame' }],
    cottonWools: [], exudates: [], drusen: [], macula: 'normal',
  },
  rd: {
    label: 'Retinal Detachment', discPale: false, cupRatio: 0.3,
    hemorrhages: [], cottonWools: [], exudates: [], drusen: [],
    retinalFold: true, macula: 'normal',
  },
  crvo: {
    label: 'Central Retinal Vein Occlusion', discPale: false, cupRatio: 0.3,
    hemorrhages: [
      { x: 0.30, y: 0.30, type: 'flame' }, { x: 0.70, y: 0.35, type: 'flame' },
      { x: 0.35, y: 0.70, type: 'flame' }, { x: 0.72, y: 0.68, type: 'flame' },
      { x: 0.45, y: 0.25, type: 'dot' }, { x: 0.62, y: 0.55, type: 'dot' },
    ],
    cottonWools: [{ x: 0.40, y: 0.55 }, { x: 0.65, y: 0.40 }],
    exudates: [], drusen: [],
    macula: 'edema', vessels: 'dilated',
  },
  diabetic: {
    label: 'Diabetic Retinopathy', discPale: false, cupRatio: 0.3,
    hemorrhages: [
      { x: 0.32, y: 0.45, type: 'dot' }, { x: 0.62, y: 0.62, type: 'dot' },
      { x: 0.55, y: 0.35, type: 'dot' }, { x: 0.40, y: 0.65, type: 'dot' },
    ],
    cottonWools: [{ x: 0.30, y: 0.30 }],
    exudates: [{ x: 0.62, y: 0.46 }, { x: 0.66, y: 0.50 }, { x: 0.59, y: 0.53 }],
    drusen: [], macula: 'edema',
    neovascular: false,
  },
  amd: {
    label: 'AMD — Dry', discPale: false, cupRatio: 0.3,
    hemorrhages: [], cottonWools: [], exudates: [],
    drusen: [
      { x: 0.62, y: 0.45 }, { x: 0.65, y: 0.50 }, { x: 0.59, y: 0.52 },
      { x: 0.55, y: 0.47 }, { x: 0.68, y: 0.48 }, { x: 0.60, y: 0.42 },
    ],
    macula: 'drusen',
  },
  uveitis: {
    label: 'Vitreous Haze', discPale: false, cupRatio: 0.3, hazy: true,
    hemorrhages: [], cottonWools: [], exudates: [], drusen: [], macula: 'normal',
  },
};

// ── Fundus Canvas (the actual retinal image) ──────────────────────────
// All coords are normalized 0..1 within the fundus circle.
const FundusCanvas = ({ pathology, transform, viewportSize = 360 }) => {
  const p = FUNDUS_PATHOLOGY[pathology] || FUNDUS_PATHOLOGY.normal;
  const innerSize = 600; // virtual fundus size (gets scaled by transform)

  return (
    <div style={{
      width: viewportSize, height: viewportSize, position: 'relative',
      borderRadius: '50%', overflow: 'hidden',
      background: '#000',
      border: '8px solid #0a0a14',
      boxShadow: '0 12px 36px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.8)',
    }}>
      {/* Ophthalmoscope vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.85) 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

      {/* Hazy overlay for vitreous haze cases */}
      {p.hazy && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle, rgba(200,140,100,0.35) 0%, rgba(120,60,30,0.5) 100%)',
          mixBlendMode: 'screen', zIndex: 2, pointerEvents: 'none',
        }} />
      )}

      {/* Transformed fundus */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: innerSize, height: innerSize,
        transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transition: 'transform 0.12s linear',
        transformOrigin: 'center',
      }}>
        <svg width={innerSize} height={innerSize} viewBox={`0 0 ${innerSize} ${innerSize}`}>
          <defs>
            <radialGradient id="fundusBg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#E76A30" />
              <stop offset="40%" stopColor="#C24820" />
              <stop offset="100%" stopColor="#7A2A0E" />
            </radialGradient>
            <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={p.discPale ? '#F0E0C0' : '#FFE8B5'} />
              <stop offset="100%" stopColor={p.discPale ? '#D4C098' : '#E5C896'} />
            </radialGradient>
            <radialGradient id="cupGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF5DC" />
              <stop offset="100%" stopColor="#F5DEB3" />
            </radialGradient>
            <radialGradient id="maculaGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#3B1808" />
              <stop offset="40%" stopColor="#7A2810" />
              <stop offset="100%" stopColor="#A8401C" />
            </radialGradient>
          </defs>

          {/* Background fundus tone */}
          <rect width={innerSize} height={innerSize} fill="url(#fundusBg)" />

          {/* Subtle retinal texture (random dots) */}
          {[...Array(200)].map((_, i) => {
            const x = (i * 73 % innerSize);
            const y = (i * 137 % innerSize);
            return <circle key={i} cx={x} cy={y} r={1 + (i % 3) * 0.5}
              fill="#5A2010" opacity="0.25" />;
          })}

          {/* Choroidal vessel hints */}
          {[...Array(40)].map((_, i) => {
            const ang = (i / 40) * Math.PI * 2;
            const r1 = innerSize * 0.15;
            const r2 = innerSize * 0.45;
            return (
              <line key={i}
                x1={innerSize/2 + Math.cos(ang) * r1}
                y1={innerSize/2 + Math.sin(ang) * r1}
                x2={innerSize/2 + Math.cos(ang) * r2}
                y2={innerSize/2 + Math.sin(ang) * r2}
                stroke="#A03818" strokeWidth="0.6" opacity="0.3" />
            );
          })}

          {/* Macula (temporal to disc — to the LEFT of center, since disc is offset right) */}
          <ellipse cx={innerSize * 0.42} cy={innerSize * 0.5}
            rx={innerSize * 0.06} ry={innerSize * 0.055}
            fill="url(#maculaGrad)" opacity="0.85" />
          {/* Foveal reflex */}
          {p.macula === 'normal' && (
            <circle cx={innerSize * 0.42} cy={innerSize * 0.5} r={2.5} fill="#FFE8B5" opacity="0.7" />
          )}

          {/* Optic disc (offset to nasal side) */}
          <circle cx={innerSize * 0.58} cy={innerSize * 0.5}
            r={innerSize * 0.07 * (p.discSwell ? 1.2 : 1)}
            fill="url(#discGrad)"
            stroke={p.discSwell ? 'rgba(255,200,100,0.5)' : 'transparent'}
            strokeWidth={p.discSwell ? 3 : 0}
            style={{ filter: p.discSwell ? 'blur(0.5px)' : 'none' }} />

          {/* Cup */}
          {p.cupRatio > 0 && (
            <ellipse cx={innerSize * 0.58} cy={innerSize * 0.5}
              rx={innerSize * 0.07 * p.cupRatio}
              ry={innerSize * 0.07 * p.cupRatio * (p.cupNotch ? 1.25 : 1)}
              fill="url(#cupGrad)" />
          )}

          {/* Vessels emerging from disc — 4 arcades */}
          {(() => {
            const cx = innerSize * 0.58, cy = innerSize * 0.5;
            const arcades = [
              { ang: -Math.PI * 0.3, label: 'STA' },  // sup. temp
              { ang: -Math.PI * 0.7, label: 'SNA' },  // sup. nasal
              { ang:  Math.PI * 0.3, label: 'ITA' },  // inf. temp
              { ang:  Math.PI * 0.7, label: 'INA' },  // inf. nasal
            ];
            const venous = p.vessels === 'dilated' ? 5 : 3;
            const arterial = 2;
            return arcades.map((a, i) => {
              const ctrl = 60;
              const x2 = cx + Math.cos(a.ang) * innerSize * 0.45;
              const y2 = cy + Math.sin(a.ang) * innerSize * 0.45;
              return (
                <g key={i}>
                  {/* Vein (darker, wider) */}
                  <path d={`M ${cx} ${cy} Q ${cx + Math.cos(a.ang) * ctrl * 2} ${cy + Math.sin(a.ang) * ctrl * 1.2} ${x2} ${y2}`}
                    stroke="#7B0000" strokeWidth={venous} fill="none" opacity="0.85" />
                  {/* Artery (brighter red) */}
                  <path d={`M ${cx} ${cy} Q ${cx + Math.cos(a.ang) * ctrl * 1.5} ${cy + Math.sin(a.ang) * ctrl} ${x2 + 4} ${y2 + 4}`}
                    stroke="#B82020" strokeWidth={arterial} fill="none" opacity="0.85" />
                </g>
              );
            });
          })()}

          {/* Hemorrhages */}
          {p.hemorrhages.map((h, i) => (
            h.type === 'flame' ? (
              <path key={i}
                d={`M ${h.x * innerSize} ${h.y * innerSize}
                    q -6 -2 -10 4 q 5 -1 10 3 q 4 -2 9 3 q -2 -8 -9 -10 Z`}
                fill="#7B0000" opacity="0.9" />
            ) : (
              <circle key={i} cx={h.x * innerSize} cy={h.y * innerSize}
                r="4" fill="#5B0000" opacity="0.95" />
            )
          ))}

          {/* Cotton wool spots */}
          {p.cottonWools.map((c, i) => (
            <ellipse key={i} cx={c.x * innerSize} cy={c.y * innerSize}
              rx="8" ry="5" fill="rgba(255,250,220,0.85)"
              style={{ filter: 'blur(0.8px)' }} />
          ))}

          {/* Hard exudates */}
          {p.exudates.map((e, i) => (
            <circle key={i} cx={e.x * innerSize} cy={e.y * innerSize}
              r="2" fill="#FFD566" opacity="0.95" />
          ))}

          {/* Drusen (yellow dots near macula) */}
          {p.drusen.map((d, i) => (
            <circle key={i} cx={d.x * innerSize} cy={d.y * innerSize}
              r="2.5" fill="rgba(245,210,140,0.85)" />
          ))}

          {/* Retinal detachment fold */}
          {p.retinalFold && (
            <path
              d={`M ${innerSize * 0.18} ${innerSize * 0.32}
                  Q ${innerSize * 0.42} ${innerSize * 0.18} ${innerSize * 0.68} ${innerSize * 0.30}
                  L ${innerSize * 0.68} ${innerSize * 0.45}
                  Q ${innerSize * 0.42} ${innerSize * 0.32} ${innerSize * 0.18} ${innerSize * 0.45} Z`}
              fill="rgba(180,80,40,0.55)" stroke="rgba(255,200,140,0.4)" strokeWidth="1.5"
            />
          )}
        </svg>
      </div>

      {/* HUD: viewport guides */}
      <div style={{
        position: 'absolute', top: 8, left: 12, zIndex: 4,
        fontSize: 9, color: '#7DC4FF', fontWeight: 700, letterSpacing: '0.06em',
      }}>● VIEWPORT 15° · {(transform.scale * 100).toFixed(0)}%</div>
      <div style={{
        position: 'absolute', bottom: 8, right: 12, zIndex: 4,
        fontSize: 9, color: '#8B95C0', fontWeight: 700,
      }}>{p.label}</div>
    </div>
  );
};

// ── CDR (Cup-to-Disc Ratio) Estimator ──────────────────────────────────
const CDREstimator = ({ value, onChange }) => (
  <div style={{
    padding: 14, borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
      Cup-to-Disc Ratio
    </div>

    {/* Visual representation */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="35" fill="#FFE8B5" stroke="#1A1D2E" strokeWidth="1" />
        <ellipse cx="50" cy="50"
          rx={35 * value} ry={35 * value}
          fill="#FFF5DC" stroke="#A88860" strokeWidth="0.5" />
        <text x="50" y="54" textAnchor="middle"
          fill="#1A1D2E" fontSize="14" fontWeight="800" fontFamily="Poppins">
          {value.toFixed(1)}
        </text>
      </svg>
    </div>

    <input type="range" min="0" max="1" step="0.1" value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: value > 0.6 ? '#EF4444' : '#5865F2' }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8B95C0', marginTop: 4 }}>
      <span>0.0</span><span>0.5</span><span>1.0</span>
    </div>

    <div style={{
      marginTop: 8, padding: '6px 10px', borderRadius: 8,
      background: value > 0.6 ? 'rgba(239,68,68,0.15)' : value > 0.4 ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)',
      fontSize: 10, fontWeight: 700,
      color: value > 0.6 ? '#FB7185' : value > 0.4 ? '#FCD34D' : '#5EE7C9',
      textAlign: 'center',
    }}>
      {value < 0.4 ? '✓ Normal CDR' : value < 0.6 ? '⚠ Borderline — monitor' : '🚨 Glaucomatous'}
    </div>
  </div>
);

// ── Main Station ───────────────────────────────────────────────────────
const FundoscopyStationV3 = ({ findings, ext, caseId, onComplete, onLog }) => {
  const STEPS = ['Setup', 'Red reflex', 'Optic disc', 'Vessels & periphery', 'Macula', 'Catat'];
  const flow = useStep(STEPS.length);

  const pathologyKey = findings?.fundoscopyType || ext?.oct || 'normal';
  const pathology = FUNDUS_PATHOLOGY[pathologyKey] ? pathologyKey : 'normal';
  const p = FUNDUS_PATHOLOGY[pathology];

  const [dilated, setDilated] = React.useState(false);
  const [redReflex, setRedReflex] = React.useState(false);
  const [transform, setTransform] = React.useState({ x: 0, y: 0, scale: 1 });

  // Structured inputs
  const [cdr, setCdr] = React.useState(0.3);
  const [discColor, setDiscColor] = React.useState(null);
  const [vesselsFinding, setVesselsFinding] = React.useState(null);
  const [maculaFinding, setMaculaFinding] = React.useState(null);

  // Pan handlers
  const panRef = React.useRef(null);
  const startPan = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startTx = transform.x, startTy = transform.y;
    const onMove = (ev) => {
      setTransform(t => ({ ...t, x: startTx + (ev.clientX - startX), y: startTy + (ev.clientY - startY) }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const zoomBy = (factor) => setTransform(t => ({ ...t, scale: Math.min(3, Math.max(0.6, t.scale * factor)) }));
  const recenter = () => setTransform({ x: 0, y: 0, scale: 1 });

  const canComplete = discColor && vesselsFinding && maculaFinding;
  const summary = canComplete
    ? `CDR ${cdr.toFixed(1)} · Disc ${discColor} · Vessels ${vesselsFinding} · Macula ${maculaFinding}`
    : 'Lengkapi pemeriksaan disc, vessels, dan macula.';

  const handleComplete = () => {
    onLog && onLog({ type: 'fundus', cdr, discColor, vessels: vesselsFinding, macula: maculaFinding, pathology });
    onComplete && onComplete();
  };

  // ── Step bodies ──
  const renderStep = () => {
    const viewport = (
      <div onMouseDown={startPan} onWheel={e => zoomBy(e.deltaY < 0 ? 1.15 : 0.87)}
        style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
        <FundusCanvas pathology={pathology} transform={transform} />
      </div>
    );

    const viewportControls = (
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        <InstrumentButton size="sm" theme="dark" onClick={() => zoomBy(1.2)}>＋</InstrumentButton>
        <InstrumentButton size="sm" theme="dark" onClick={() => zoomBy(0.83)}>−</InstrumentButton>
        <InstrumentButton size="sm" theme="dark" onClick={recenter}>↻ Center</InstrumentButton>
        <span style={{ fontSize: 10, color: '#8B95C0', alignSelf: 'center', marginLeft: 8 }}>
          Drag = pan · Wheel = zoom
        </span>
      </div>
    );

    switch (flow.step) {
      case 0:
        return (
          <div>
            <StationIntro theme="dark" icon="💧" title="Setup pre-dilatasi"
              body="Periksa VA + RAPD DULU (sebelum dilatasi). Cek kedalaman AC (cegah angle closure!). Lalu teteskan tropicamide 1% — tunggu 15–20 menit. Padamkan lampu ruangan." />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              <DarkChecklistItem text="VA & RAPD checked first" done />
              <DarkChecklistItem text="AC depth assessed (no narrow angles)" done />
              <DarkChecklistItem text="Tropicamide 1% instilled" done={dilated} onClick={() => setDilated(true)} />
            </div>

            <StationControls theme="dark">
              <InstrumentButton theme="dark" tone="primary" active disabled={!dilated} onClick={flow.next}>
                Lanjut: Red reflex →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 1:
        return (
          <div>
            <StationIntro theme="dark" icon="🔴" title="Red reflex (dari 50 cm)"
              body="Sebelum mendekat — periksa red reflex dari jarak 50 cm. Aperture: full beam. Cari LEUKOCORIA (refleks putih = katarak/RB!), opasitas, asimetri." />

            <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
              {['OS', 'OD'].map(eye => (
                <div key={eye} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 130, height: 130, borderRadius: '50%',
                    background: redReflex
                      ? 'radial-gradient(circle at 50% 50%, #FF6B35 0%, #B82020 50%, #1A1D2E 70%, #000 100%)'
                      : '#0a0a14',
                    border: '2px solid #1A1D2E',
                    transition: 'all 0.4s var(--ease-panel)',
                    boxShadow: redReflex ? '0 0 28px rgba(255,107,53,0.4)' : 'none',
                  }}/>
                  <div style={{ fontSize: 11, color: '#8B95C0', fontWeight: 700, marginTop: 8 }}>{eye}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <InstrumentButton theme="dark" tone="amber" active={redReflex} onClick={() => setRedReflex(r => !r)}>
                {redReflex ? '● Lampu ophthalmoscope ON' : '○ Nyalakan lampu'}
              </InstrumentButton>
              {redReflex && (
                <div className="ab" style={{ marginTop: 12, fontSize: 11, color: '#5EE7C9' }}>
                  ✓ Red reflex simetris bilateral — tidak ada leukocoria.
                </div>
              )}
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(0)}>← Setup</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!redReflex} onClick={flow.next}>
                Lanjut: Optic disc →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 2:
        return (
          <div>
            <StationIntro theme="dark" icon="●" title="Optic disc — DCM mnemonic"
              body="Dekati dari 15° temporal sampai dekat bulu mata. Cari pembuluh darah → ikuti panah ke optic disc. Nilai: Disc colour · Cup ratio · Margin · Vessels." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
              <div>
                {viewport}
                {viewportControls}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CDREstimator value={cdr} onChange={setCdr} />
                <StructuredField label="Disc colour & margin" theme="dark" required>
                  <StructuredSelect theme="dark" value={discColor} onChange={setDiscColor} options={[
                    { value: 'normal', label: 'Pink, margin tegas' },
                    { value: 'pale', label: 'Pucat (optic atrophy)' },
                    { value: 'swollen', label: '🚨 Swollen, batas kabur (papilledema/neuritis)' },
                    { value: 'notch', label: 'Notching rim (glaukoma)' },
                  ]} />
                </StructuredField>
              </div>
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(1)}>← Red reflex</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!discColor} onClick={flow.next}>
                Lanjut: Vessels →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 3:
        return (
          <div>
            <StationIntro theme="dark" icon="⌇" title="Pembuluh darah retina — 4 arcade"
              body="Ikuti vena dan arteri ke 4 kuadran. Normal A:V ratio 2:3. Cari: AV nicking, copper/silver wiring, hemorrhages (flame vs dot/blot), cotton wools, hard exudates." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
              <div>
                {viewport}
                {viewportControls}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StructuredField label="Vessels & periphery" theme="dark" required>
                  <StructuredSelect theme="dark" value={vesselsFinding} onChange={setVesselsFinding} options={[
                    { value: 'normal',   label: 'Normal vessels, A:V 2:3' },
                    { value: 'dr-mild',  label: 'Mikroaneurisma — mild NPDR' },
                    { value: 'dr-mod',   label: 'Dot/blot heme + exudates — moderate NPDR' },
                    { value: 'dr-sev',   label: '🚨 Hemorrhage 4 quadrant — severe NPDR' },
                    { value: 'pdr',      label: '🚨 Neovaskularisasi disc (PDR)' },
                    { value: 'crvo',     label: '🚨 Hemorrhage 4 quadrant + CWS — CRVO' },
                    { value: 'crao',     label: '🚨 Pucat retina + cherry-red spot — CRAO' },
                    { value: 'htn',      label: 'AV nicking, copper wiring — Hipertensi' },
                  ]} />
                </StructuredField>

                <div style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 11, color: '#C0CAEC', lineHeight: 1.5,
                }}>
                  Temuan yang divisualkan: {p.hemorrhages.length > 0 && `${p.hemorrhages.length} hemorrhages · `}{p.cottonWools.length > 0 && `${p.cottonWools.length} CWS · `}{p.exudates.length > 0 && `${p.exudates.length} exudates · `}{p.drusen.length > 0 && `${p.drusen.length} drusen · `}{p.retinalFold && '🚨 retinal fold · '}{(!p.hemorrhages.length && !p.cottonWools.length && !p.exudates.length && !p.drusen.length && !p.retinalFold) && 'Vessels appear normal.'}
                </div>
              </div>
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(2)}>← Disc</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!vesselsFinding} onClick={flow.next}>
                Lanjut: Macula →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 4:
        return (
          <div>
            <StationIntro theme="dark" icon="◉" title="Macula (terakhir)"
              body="Minta pasien lihat LANGSUNG ke cahaya. Macula 2 disc-diameter temporal dari optic disc. Cari foveal reflex, drusen, hemorrhage, fluid, atau cherry-red spot." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
              <div>
                {viewport}
                {viewportControls}
              </div>
              <StructuredField label="Macula" theme="dark" required>
                <StructuredSelect theme="dark" value={maculaFinding} onChange={setMaculaFinding} options={[
                  { value: 'normal',  label: 'Foveal reflex (+), warna normal' },
                  { value: 'drusen',  label: 'Drusen — AMD dry' },
                  { value: 'amd-wet', label: '🚨 Subretinal fluid/heme — AMD wet' },
                  { value: 'edema',   label: 'Macular edema' },
                  { value: 'cherry',  label: '🚨 Cherry red spot (CRAO)' },
                  { value: 'erm',     label: 'Epiretinal membrane' },
                  { value: 'pucker',  label: 'Macular pucker' },
                ]} />
              </StructuredField>
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(3)}>← Vessels</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!maculaFinding} onClick={flow.next}>
                Lanjut: Catat →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 5:
        return (
          <div>
            <StationIntro theme="dark" icon="📋" title="Ringkasan fundoscopy" body="Verifikasi temuan posterior segment dan implikasi klinis." />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
              <DarkResultCard3 label="CDR" value={cdr.toFixed(1)} highlight={cdr > 0.6} />
              <DarkResultCard3 label="Disc" value={discColor || '—'} />
              <DarkResultCard3 label="Vessels" value={vesselsFinding || '—'} />
              <DarkResultCard3 label="Macula" value={maculaFinding || '—'} />
            </div>

            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(88,101,242,0.08)', border: '1px solid rgba(88,101,242,0.25)',
              fontSize: 12, color: '#C0CAEC', lineHeight: 1.6,
            }}>
              <strong style={{ color: '#A4B0FF' }}>Pattern recognition:</strong> {' '}
              {pathology === 'normal' && 'Normal fundus — tidak ada temuan patologis signifikan.'}
              {pathology === 'glaucoma' && 'CDR meningkat + notching → glaukomatous optic neuropathy. Periksa lapang pandang.'}
              {pathology === 'optic-neuritis' && 'Disc oedema → DDx: papilledema (bilateral, ↑ICP), optic neuritis (unilateral + RAPD).'}
              {pathology === 'rd' && '🚨 Retinal detachment — referral urgent vitreoretinal.'}
              {pathology === 'crvo' && '🚨 CRVO — hemorrhage 4 kuadran + CWS. Cari penyebab sistemik (hipertensi, hyperviscosity).'}
              {pathology === 'diabetic' && 'Diabetic retinopathy — grade per ETDRS, optimalkan kontrol glukosa, rujuk untuk OCT macula.'}
              {pathology === 'amd' && 'AMD dry — drusen + atrofi macular. Monitor Amsler grid untuk konversi ke wet.'}
              {pathology === 'uveitis' && 'Vitreous haze → posterior uveitis. Cari etiologi infektif/autoimmune.'}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <StationShell theme="dark" icon="🔴" title="Fundoscopy" subtitle="Direct ophthalmoscopy segmen posterior — pan, zoom & assess">
      <StepLadder theme="dark" steps={STEPS} current={flow.step} done={flow.done} onJump={flow.goto} />
      {renderStep()}
      <StationFooter theme="dark" onComplete={handleComplete} canComplete={canComplete} summary={summary} />
    </StationShell>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────
const DarkChecklistItem = ({ text, done, onClick }) => (
  <button onClick={onClick} disabled={!onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 10,
      background: done ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`,
      cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'Poppins',
      textAlign: 'left',
      width: '100%',
      transition: 'all 0.2s',
    }}>
    <span style={{
      width: 16, height: 16, borderRadius: 4,
      background: done ? '#34D399' : 'rgba(255,255,255,0.08)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, flexShrink: 0,
    }}>{done ? '✓' : ''}</span>
    <span style={{ fontSize: 11, fontWeight: 600, color: done ? '#5EE7C9' : '#C0CAEC' }}>{text}</span>
  </button>
);

const DarkResultCard3 = ({ label, value, highlight }) => (
  <div style={{
    padding: '10px 12px', borderRadius: 10,
    background: highlight ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${highlight ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
  }}>
    <div style={{ fontSize: 9, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 800, color: highlight ? '#FB7185' : '#F2F5FF' }}>{value}</div>
  </div>
);

Object.assign(window, { FundoscopyStationV3 });
