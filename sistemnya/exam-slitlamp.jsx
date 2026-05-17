// ============================================================
// OphthaSim — Slit Lamp Biomicroscopy Simulator
// Magnification, slit beam control, cobalt blue + fluorescein,
// clickable anatomical structures, graded findings.
// ============================================================

const SLIT_STRUCTURES = [
  { id: 'lids',            label: 'Lids & Lashes',          order: 0 },
  { id: 'conjunctiva',     label: 'Conjunctiva & Sclera',   order: 1 },
  { id: 'cornea',          label: 'Cornea',                 order: 2 },
  { id: 'anteriorChamber', label: 'Anterior Chamber',       order: 3 },
  { id: 'iris',            label: 'Iris',                   order: 4 },
  { id: 'pupil',           label: 'Pupil',                  order: 5 },
  { id: 'lens',            label: 'Lens',                   order: 6 },
];

// Anatomical position on the schematic (normalized 0–1)
const STRUCT_HIT = {
  lids:            { x: 0.5,  y: 0.15, w: 0.6,  h: 0.18 },
  conjunctiva:     { x: 0.18, y: 0.5,  w: 0.18, h: 0.3  },
  cornea:          { x: 0.5,  y: 0.5,  w: 0.42, h: 0.42 },
  anteriorChamber: { x: 0.5,  y: 0.58, w: 0.32, h: 0.2  },
  iris:            { x: 0.5,  y: 0.62, w: 0.34, h: 0.28 },
  pupil:           { x: 0.5,  y: 0.62, w: 0.14, h: 0.14 },
  lens:            { x: 0.5,  y: 0.68, w: 0.22, h: 0.25 },
};

// Pathology presets — extra slit lamp signs by case
const SLIT_PATHOLOGY = {
  'case-001': { keratitis: { type: 'spk', region: 'inferior' }, dischargeOnLids: true },
  'case-002': {},
  'case-003': { kps: true, cellsFlare: { cells: '2+', flare: '1+' }, synechiae: true },
  'case-004': { spkBilateral: true, mgd: true },
  'case-005': { cornealOedema: true, shallowAC: true, fixedPupil: { size: 5, shape: 'oval' } },
  'case-006': {},
  'case-007': { papillae: true, chemosis: 'mild' },
  'case-008': { infiltrate: { size: 4, location: 'central' }, hypopyon: 1, chemosis: 'marked' },
  'case-009': {},
  'case-010': {},
};

const SlitLampStation = ({ findings, ext, caseId, onComplete, onLog }) => {
  // Slit lamp controls
  const [magnification, setMagnification] = React.useState(10); // 10x, 16x, 25x, 40x
  const [slitWidth, setSlitWidth] = React.useState(2);  // mm: 0.1–6
  const [slitAngle, setSlitAngle] = React.useState(45); // degrees: 0–90
  const [slitHeight, setSlitHeight] = React.useState(80); // % 10–100
  const [filter, setFilter] = React.useState('white'); // white | cobalt | red-free
  const [fluorescein, setFluorescein] = React.useState(false);
  const [diffuser, setDiffuser] = React.useState(false); // diffuse illumination
  const [eye, setEye] = React.useState('OD');

  // Examined structures
  const [examined, setExamined] = React.useState(new Set());
  const [hoveredStruct, setHoveredStruct] = React.useState(null);
  const [activeStruct, setActiveStruct] = React.useState(null);

  const path = SLIT_PATHOLOGY[caseId] || {};

  // Determine which side of patient has pathology
  const affectedEye = ext.affectedEye || 'OD';
  const isAffected = eye === affectedEye || affectedEye === 'OU';

  const examineStruct = (id) => {
    setActiveStruct(id);
    setExamined(prev => new Set([...prev, id + '-' + eye]));
    onLog(`Slit lamp ${eye} — ${id}: ${findings.anteriorSegment[id] || 'examined'}`);
  };

  React.useEffect(() => {
    // Complete when 4+ structures examined per affected eye
    const examinedAffected = [...examined].filter(k => k.endsWith('-' + affectedEye));
    if (examinedAffected.length >= 4 || examined.size >= 6) onComplete();
  }, [examined, affectedEye, onComplete]);

  // Cobalt + fluorescein reveals defects
  const showCobaltFluor = filter === 'cobalt' && fluorescein;

  return (
    <div>
      <SectionIntro icon="🔬" title="Slit Lamp Biomicroscopy"
        sub="The cornerstone of ophthalmic examination. Adjust magnification, slit beam, and filters to examine each structure systematically." />

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>EYE</div>
        {['OD','OS'].map(e => (
          <button key={e} onClick={() => setEye(e)} style={{
            padding: '6px 14px', borderRadius: 10,
            border: `1.5px solid ${eye === e ? 'var(--primary)' : 'var(--border)'}`,
            background: eye === e ? 'var(--primary-l)' : 'var(--surface)',
            color: eye === e ? 'var(--primary)' : 'var(--text-2)',
            fontWeight: 700, fontFamily: 'Poppins', cursor: 'pointer', fontSize: 12,
          }}>
            {e === affectedEye && <span style={{ fontSize: 9, marginRight: 4, color: 'var(--red)' }}>●</span>}
            {e}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          <strong>{magnification}x</strong> · slit {slitWidth.toFixed(1)}mm @ {slitAngle}° ·{' '}
          <span style={{ color: filter === 'cobalt' ? '#5B9DFF' : filter === 'red-free' ? '#5BFF7F' : 'var(--text-2)' }}>
            {filter === 'cobalt' ? 'COBALT BLUE' : filter === 'red-free' ? 'RED-FREE' : 'WHITE'}
          </span>
          {fluorescein && ' · 🟢 FLUORESCEIN'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Main scope view ───────────────────── */}
        <InstrumentFrame title={`Eyepiece view · ${eye}`} dark style={{ flex: 1, minWidth: 480 }}>
          <SlitLampView
            magnification={magnification}
            slitWidth={slitWidth}
            slitAngle={slitAngle}
            slitHeight={slitHeight}
            filter={filter}
            fluorescein={fluorescein}
            diffuser={diffuser}
            isAffected={isAffected}
            path={path}
            hoveredStruct={hoveredStruct}
            activeStruct={activeStruct}
            examined={examined}
            eye={eye}
            onStructClick={examineStruct}
            onStructHover={setHoveredStruct}
            findings={findings}
          />
        </InstrumentFrame>

        {/* ── Control Panel ───────────────────── */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Magnification */}
          <InstrumentFrame title="Magnification">
            <div style={{ padding: 12, display: 'flex', gap: 6 }}>
              {[10, 16, 25, 40].map(m => (
                <button key={m} onClick={() => setMagnification(m)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1.5px solid ${magnification === m ? 'var(--primary)' : 'var(--border)'}`,
                  background: magnification === m ? 'var(--primary-l)' : 'var(--surface)',
                  fontFamily: 'Poppins', fontSize: 12, fontWeight: 800,
                  color: magnification === m ? 'var(--primary)' : 'var(--text-2)',
                  cursor: 'pointer',
                }}>{m}x</button>
              ))}
            </div>
          </InstrumentFrame>

          {/* Slit width */}
          <InstrumentFrame title="Slit Beam Width">
            <div style={{ padding: 12 }}>
              <input type="range" min="0.1" max="6" step="0.1" value={slitWidth}
                onChange={e => setSlitWidth(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                <span>thin</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{slitWidth.toFixed(1)} mm</span>
                <span>wide</span>
              </div>
            </div>
          </InstrumentFrame>

          {/* Slit angle */}
          <InstrumentFrame title="Slit Angle">
            <div style={{ padding: 12 }}>
              <input type="range" min="0" max="90" step="5" value={slitAngle}
                onChange={e => setSlitAngle(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                <span>0°</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{slitAngle}°</span>
                <span>90°</span>
              </div>
            </div>
          </InstrumentFrame>

          {/* Filter */}
          <InstrumentFrame title="Filter">
            <div style={{ padding: 12, display: 'flex', gap: 6 }}>
              {[
                ['white', 'White', '#FFFFFF'],
                ['cobalt', 'Cobalt', '#3D80FF'],
                ['red-free', 'Red-free', '#5BFF7F'],
              ].map(([v, l, c]) => (
                <button key={v} onClick={() => setFilter(v)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10,
                  border: `1.5px solid ${filter === v ? c : 'var(--border)'}`,
                  background: filter === v ? c + '20' : 'var(--surface)',
                  fontFamily: 'Poppins', fontSize: 10, fontWeight: 700,
                  color: filter === v ? c : 'var(--text-2)',
                  cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </InstrumentFrame>

          {/* Toggles */}
          <InstrumentFrame title="Adjuncts">
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ToggleRow label="🟢 Fluorescein staining" value={fluorescein} onChange={setFluorescein} />
              <ToggleRow label="◯ Diffuse illumination" value={diffuser} onChange={setDiffuser} />
            </div>
          </InstrumentFrame>

          {/* Examined log */}
          <InstrumentFrame title={`Examined · ${eye}`}>
            <div style={{ padding: 12 }}>
              {SLIT_STRUCTURES.map(s => {
                const done = examined.has(s.id + '-' + eye);
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 0', fontSize: 11,
                    color: done ? 'var(--green)' : 'var(--text-3)',
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 4,
                      background: done ? 'var(--green)' : 'var(--surface-2)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800,
                    }}>{done ? '✓' : ''}</span>
                    <span style={{ fontWeight: done ? 700 : 400 }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </InstrumentFrame>
        </div>
      </div>

      {/* Finding description hidden — student transcribes own observation (OSCE_RUBRIC §H) */}
      {activeStruct && (
        <div className="ab" style={{ marginTop: 14 }}>
          <InstrumentFrame title={`Sedang memeriksa · ${SLIT_STRUCTURES.find(s => s.id === activeStruct)?.label}`}>
            <div style={{ padding: 14, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>
              👀 Amati struktur ini di slit lamp view di atas. Catat observasi Anda di Logbook (di bawah).
            </div>
          </InstrumentFrame>
        </div>
      )}
    </div>
  );
};

const ToggleRow = ({ label, value, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 11, color: 'var(--text-2)' }}>
    <div onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 12, background: value ? 'var(--primary)' : 'var(--surface-3)',
      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'all 0.2s', boxShadow: 'var(--sh-sm)',
      }} />
    </div>
    {label}
  </label>
);

// ── The actual eyepiece view ─────────────────────────────
const SlitLampView = ({ magnification, slitWidth, slitAngle, slitHeight, filter, fluorescein, diffuser, isAffected, path, hoveredStruct, activeStruct, examined, eye, onStructClick, onStructHover, findings }) => {
  // Scope view dimensions
  const W = 640, H = 440;
  const cx = W / 2, cy = H / 2;
  const baseRadius = 200;

  // Magnification scales the view
  const scale = magnification / 10;
  const viewRadius = baseRadius * 0.95;

  // Eye anatomy scaled by mag
  const corneaR = 110 * scale;
  const irisR = 75 * scale;
  const pupilR = (path.fixedPupil ? path.fixedPupil.size * 8 : 22) * scale;

  // Background color from filter
  const bgColor = filter === 'cobalt' ? '#0A2050' : filter === 'red-free' ? '#062010' : '#080812';
  const beamColor = filter === 'cobalt' ? '#7BB5FF' : filter === 'red-free' ? '#A8FFB8' : '#FFFCF0';

  // Slit beam properties
  const beamWidthPx = Math.max(1.5, slitWidth * 4);
  const beamLength = (slitHeight / 100) * viewRadius * 1.7;
  const beamAngleRad = (slitAngle * Math.PI) / 180;

  // Hit test position
  const localPos = (id) => {
    const h = STRUCT_HIT[id];
    if (!h) return { x: cx, y: cy, w: 100, h: 100 };
    return { x: h.x * W, y: h.y * H, w: h.w * W * scale * 0.6, h: h.h * H * scale * 0.6 };
  };

  return (
    <div style={{ position: 'relative', background: bgColor, padding: 0, overflow: 'hidden' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', background: bgColor }}>
        <defs>
          {/* Iris */}
          <radialGradient id="slIrisGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor={isAffected && path.cornealOedema ? '#86C0B0' : '#5A7BA8'} />
            <stop offset="60%" stopColor={isAffected && path.cornealOedema ? '#5A8B80' : '#3A5680'} />
            <stop offset="100%" stopColor="#1A2640" />
          </radialGradient>

          {/* Conjunctival injection */}
          <radialGradient id="slConjBg" cx="50%" cy="50%">
            <stop offset="60%" stopColor="#FFF8EE" />
            <stop offset="100%" stopColor={isAffected ? '#FFE0E0' : '#FAF0E0'} />
          </radialGradient>

          {/* Cornea oedema effect */}
          <filter id="slOedema">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>

          {/* Fluorescein glow */}
          <filter id="slFlGlow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Slit beam parallelepiped — the "section" through cornea */}
          <linearGradient id="slBeamGrad" gradientTransform={`rotate(${slitAngle})`}>
            <stop offset="0%"  stopColor={beamColor} stopOpacity="0.05" />
            <stop offset="50%" stopColor={beamColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={beamColor} stopOpacity="0.05" />
          </linearGradient>

          {/* Ambient illumination falloff */}
          <radialGradient id="slAmbient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* Outer ring (eyepiece vignette) */}
        <circle cx={cx} cy={cy} r={viewRadius * 1.1} fill={bgColor} />

        {/* Ambient glow (when diffuser on) */}
        {diffuser && <circle cx={cx} cy={cy} r={viewRadius} fill="url(#slAmbient)" />}

        {/* Eye anatomy clip */}
        <clipPath id="scopeClip">
          <circle cx={cx} cy={cy} r={viewRadius} />
        </clipPath>

        <g clipPath="url(#scopeClip)">
          {/* Sclera/conj */}
          <ellipse cx={cx} cy={cy} rx={viewRadius * 1.1} ry={viewRadius * 0.85} fill="url(#slConjBg)" opacity={diffuser ? 1 : 0.3} />

          {/* Conjunctival injection (vessels) */}
          {isAffected && (
            <g opacity={diffuser ? 0.7 : 0.35}>
              {Array.from({ length: 18 }, (_, i) => {
                const angle = (i / 18) * Math.PI * 2;
                const r1 = corneaR * 1.05;
                const r2 = corneaR * 1.4;
                return (
                  <line key={i}
                    x1={cx + Math.cos(angle) * r1} y1={cy + Math.sin(angle) * r1}
                    x2={cx + Math.cos(angle) * r2} y2={cy + Math.sin(angle) * r2}
                    stroke="#C03030" strokeWidth={1.5 + Math.random() * 0.8} opacity={0.65} />
                );
              })}
              {path.chemosis && (
                <ellipse cx={cx} cy={cy + 4} rx={corneaR * 1.3} ry={corneaR * 1.0}
                  fill="rgba(255,200,200,0.25)" />
              )}
            </g>
          )}

          {/* Cornea (transparent dome) */}
          <circle cx={cx} cy={cy} r={corneaR} fill="rgba(220,240,255,0.06)"
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

          {/* Corneal oedema (hazy) */}
          {isAffected && path.cornealOedema && (
            <circle cx={cx} cy={cy} r={corneaR * 0.95} fill="rgba(240,250,255,0.25)" filter="url(#slOedema)" />
          )}

          {/* Iris */}
          <circle cx={cx} cy={cy + 6} r={irisR} fill="url(#slIrisGrad)" />
          {/* Iris striae */}
          <g opacity="0.5">
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * Math.PI * 2;
              return <line key={i} x1={cx + Math.cos(a) * pupilR * 1.05} y1={cy + 6 + Math.sin(a) * pupilR * 1.05}
                x2={cx + Math.cos(a) * irisR * 0.95} y2={cy + 6 + Math.sin(a) * irisR * 0.95}
                stroke="#1a1a2e" strokeWidth="0.6" />;
            })}
          </g>

          {/* Pupil */}
          {path.fixedPupil && path.fixedPupil.shape === 'oval' ? (
            <ellipse cx={cx} cy={cy + 6} rx={pupilR * 1.2} ry={pupilR * 0.95} fill="#0a0a14" />
          ) : (
            <circle cx={cx} cy={cy + 6} r={pupilR} fill="#0a0a14" />
          )}

          {/* Posterior synechiae (iris-lens adhesion irregular pupil) */}
          {isAffected && path.synechiae && (
            <g>
              <path d={`M ${cx - pupilR * 0.9} ${cy + 6} Q ${cx} ${cy - pupilR * 0.5}, ${cx + pupilR * 0.7} ${cy + 6} Q ${cx + pupilR * 0.6} ${cy + pupilR * 0.5}, ${cx - pupilR * 0.5} ${cy + pupilR * 0.4} Z`}
                fill="#0a0a14" />
            </g>
          )}

          {/* KPs on inferior endothelium */}
          {isAffected && path.kps && (
            <g opacity="0.7">
              {[0,1,2,3,4,5,6].map(i => (
                <circle key={i} cx={cx - 30 + i * 10} cy={cy + corneaR * 0.7} r="2" fill="#FFE4B5" />
              ))}
            </g>
          )}

          {/* Cells & flare (AC reaction) */}
          {isAffected && (path.cellsFlare || path.infiltrate) && magnification >= 16 && (
            <g>
              {[...Array(20)].map((_, i) => {
                const x = cx + (Math.random() - 0.5) * corneaR * 1.4;
                const y = cy + (Math.random() - 0.5) * corneaR * 1.2;
                if (Math.sqrt((x-cx)**2 + (y-cy)**2) > corneaR * 0.9) return null;
                return <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(255,255,220,0.7)" opacity={Math.random() * 0.8} />;
              })}
            </g>
          )}

          {/* Hypopyon (sterile pus settled inferiorly in AC) */}
          {isAffected && path.hypopyon && (
            <path d={`M ${cx - corneaR * 0.7} ${cy + corneaR * 0.65}
                     Q ${cx} ${cy + corneaR * 0.45}, ${cx + corneaR * 0.7} ${cy + corneaR * 0.65}
                     L ${cx + corneaR * 0.7} ${cy + corneaR * 0.95}
                     L ${cx - corneaR * 0.7} ${cy + corneaR * 0.95} Z`}
              fill="#F5E8C8" opacity="0.92" />
          )}

          {/* Corneal infiltrate */}
          {isAffected && path.infiltrate && (
            <g>
              <ellipse cx={cx} cy={cy - 8} rx={path.infiltrate.size * 4} ry={path.infiltrate.size * 3}
                fill="rgba(245,245,225,0.85)" filter="url(#slOedema)" />
              <ellipse cx={cx} cy={cy - 8} rx={path.infiltrate.size * 2.5} ry={path.infiltrate.size * 1.8}
                fill="rgba(220,220,200,0.95)" />
            </g>
          )}

          {/* Slit beam — the "parallelepiped" of light cutting through cornea */}
          {!diffuser && (
            <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${slitAngle - 45}deg)` }}>
              {/* Light source line on cornea */}
              <rect
                x={cx - beamWidthPx / 2}
                y={cy - beamLength / 2}
                width={beamWidthPx}
                height={beamLength}
                fill={beamColor}
                opacity="0.55"
                filter="url(#slOedema)"
              />
              {/* Brighter core */}
              <rect
                x={cx - beamWidthPx / 4}
                y={cy - beamLength / 2}
                width={beamWidthPx / 2}
                height={beamLength}
                fill={beamColor}
                opacity="0.85"
              />
              {/* Reflection on iris surface (parallax-shifted) */}
              <rect
                x={cx - beamWidthPx / 2 + 28 * scale}
                y={cy - beamLength / 2 + 8}
                width={beamWidthPx * 0.85}
                height={beamLength * 0.6}
                fill={beamColor}
                opacity="0.18"
              />
            </g>
          )}

          {/* Fluorescein patterns under cobalt blue */}
          {fluorescein && filter === 'cobalt' && (
            <g filter="url(#slFlGlow)">
              {/* Diffuse SPK pattern */}
              {(path.keratitis || path.spkBilateral) && (
                <g>
                  {[...Array(40)].map((_, i) => {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.sqrt(Math.random()) * corneaR * 0.85;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    // SPK weighted to inferior
                    if (y < cy && Math.random() > 0.3) return null;
                    return <circle key={i} cx={x} cy={y} r={1.5 + Math.random() * 0.8} fill="#5BFF7F" opacity="0.85" />;
                  })}
                </g>
              )}
              {/* Large epithelial defect (keratitis) */}
              {path.infiltrate && (
                <ellipse cx={cx} cy={cy - 8} rx={path.infiltrate.size * 4.5} ry={path.infiltrate.size * 3.2}
                  fill="#5BFF7F" opacity="0.85" />
              )}
            </g>
          )}

          {/* Reticle / crosshair */}
          <g opacity="0.18">
            <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="white" strokeWidth="0.5" />
            <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="white" strokeWidth="0.5" />
          </g>

          {/* Hit zones — clickable */}
          {SLIT_STRUCTURES.map(s => {
            const isHov = hoveredStruct === s.id;
            const isActive = activeStruct === s.id;
            const isDone = examined.has(s.id + '-' + eye);
            const pos = localPos(s.id);
            return (
              <g key={s.id} style={{ cursor: 'pointer' }}
                onClick={() => onStructClick(s.id)}
                onMouseEnter={() => onStructHover(s.id)}
                onMouseLeave={() => onStructHover(null)}>
                <ellipse cx={pos.x} cy={pos.y} rx={pos.w / 2} ry={pos.h / 2}
                  fill={isHov ? 'rgba(91,255,127,0.08)' : 'transparent'}
                  stroke={isActive ? '#5BFF7F' : isHov ? 'rgba(91,255,127,0.5)' : 'transparent'}
                  strokeWidth="1.5" strokeDasharray="3 2" />
                {isHov && (
                  <text x={pos.x} y={pos.y - pos.h / 2 - 6}
                    textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Poppins"
                    fill="#5BFF7F">
                    {s.label} {isDone ? '✓' : '— click'}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Eyepiece ring */}
        <circle cx={cx} cy={cy} r={viewRadius} fill="none"
          stroke="#1a1a2e" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={viewRadius + 4} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* HUD */}
        <text x={20} y={28} fill="#5BFF7F" fontFamily="monospace" fontSize="11" opacity="0.6">
          MAG {magnification}x · SLIT {slitWidth.toFixed(1)}mm @ {slitAngle}°
        </text>
        <text x={W - 80} y={28} fill="#5BFF7F" fontFamily="monospace" fontSize="11" opacity="0.6">
          {eye} · {filter.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// FLUORESCEIN STAINING PANEL (combined with slit lamp insight)
// ══════════════════════════════════════════════════════════
const FluoresceinStation = ({ ext, onComplete, onLog }) => {
  const [stained, setStained] = React.useState({ OD: false, OS: false });
  const [eye, setEye] = React.useState('OD');

  const performStain = (e) => {
    setEye(e);
    setStained(prev => ({ ...prev, [e]: true }));
    onLog(`Fluorescein ${e}: ${ext.fluorescein[e].note}`);
  };

  React.useEffect(() => {
    if (stained.OD && stained.OS) onComplete();
  }, [stained, onComplete]);

  const f = ext.fluorescein[eye];
  const isShown = stained[eye];

  return (
    <div>
      <SectionIntro icon="🟢" title="Fluorescein Staining + Cobalt Blue"
        sub="Apply fluorescein strip to lower fornix, ask patient to blink, then examine under cobalt blue light. Epithelial defects fluoresce green." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {['OD','OS'].map(e => (
          <Btn key={e} variant={eye === e && stained[e] ? 'primary' : 'secondary'} size="sm" onClick={() => performStain(e)}>
            {stained[e] ? '✓ ' : '🟢 '}Stain {e}
          </Btn>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <InstrumentFrame title={`Cobalt blue view · ${eye}`} dark style={{ flex: 1, minWidth: 360 }}>
          <div style={{ padding: 24, background: '#000814', textAlign: 'center' }}>
            <svg width="320" height="320" viewBox="0 0 320 320">
              <defs>
                <radialGradient id="flCobaltBg" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#1A4080" />
                  <stop offset="100%" stopColor="#000814" />
                </radialGradient>
                <filter id="flGlow2">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="160" cy="160" r="150" fill="url(#flCobaltBg)" />
              {/* Cornea outline */}
              <circle cx="160" cy="160" r="100" fill="rgba(255,255,255,0.04)" stroke="rgba(91,255,127,0.2)" strokeWidth="1" />

              {/* Fluorescein patterns */}
              {isShown && f && (
                <g filter="url(#flGlow2)">
                  {f.pattern === 'punctate' && f.region === 'inferior' && (
                    [...Array(25)].map((_, i) => {
                      const a = Math.random() * Math.PI;
                      const r = Math.sqrt(Math.random()) * 90;
                      return <circle key={i} cx={160 + Math.cos(a) * r} cy={160 + Math.abs(Math.sin(a)) * r * 0.9} r={1.6 + Math.random() * 0.6} fill="#5BFF7F" opacity="0.85" />;
                    })
                  )}
                  {f.pattern === 'punctate-diffuse' && (
                    [...Array(60)].map((_, i) => {
                      const a = Math.random() * Math.PI * 2;
                      const r = Math.sqrt(Math.random()) * 95;
                      const y = 160 + Math.sin(a) * r;
                      // weight inferior
                      if (y < 160 && Math.random() > 0.35) return null;
                      return <circle key={i} cx={160 + Math.cos(a) * r} cy={y} r={1.5 + Math.random() * 0.8} fill="#5BFF7F" opacity={0.7 + Math.random() * 0.3} />;
                    })
                  )}
                  {f.pattern === 'large-defect' && (
                    <g>
                      <ellipse cx={160} cy={155} rx="34" ry="26" fill="#5BFF7F" opacity="0.9" />
                      <ellipse cx={160} cy={155} rx="34" ry="26" fill="none" stroke="#A8FFB8" strokeWidth="1.5" />
                      <text x="160" y="220" textAnchor="middle" fontSize="10" fill="#5BFF7F" fontFamily="Poppins" fontWeight="700">4×3mm epithelial defect</text>
                    </g>
                  )}
                  {f.pattern === 'microcystic' && (
                    [...Array(80)].map((_, i) => {
                      const a = Math.random() * Math.PI * 2;
                      const r = Math.sqrt(Math.random()) * 95;
                      return <circle key={i} cx={160 + Math.cos(a) * r} cy={160 + Math.sin(a) * r} r={0.8 + Math.random() * 0.6} fill="#A8FFB8" opacity={0.6} />;
                    })
                  )}
                </g>
              )}
              {isShown && f && f.pattern === 'none' && (
                <text x="160" y="160" textAnchor="middle" fontSize="11" fill="rgba(91,255,127,0.6)" fontFamily="Poppins">No staining</text>
              )}

              {/* Reticle */}
              <line x1="155" y1="160" x2="165" y2="160" stroke="rgba(91,255,127,0.4)" strokeWidth="1" />
              <line x1="160" y1="155" x2="160" y2="165" stroke="rgba(91,255,127,0.4)" strokeWidth="1" />
            </svg>
            <div style={{ fontSize: 11, color: 'rgba(91,255,127,0.7)', marginTop: 8, fontFamily: 'monospace' }}>
              COBALT BLUE · 🟢 FLUORESCEIN
            </div>
          </div>
        </InstrumentFrame>

        <InstrumentFrame title="Status" style={{ width: 280 }}>
          <div style={{ padding: 14, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>👀</div>
            Amati pola staining di tampilan cobalt blue (kiri). Catat temuan Anda di Logbook (di bawah).
          </div>
        </InstrumentFrame>
      </div>
    </div>
  );
};

Object.assign(window, {
  SlitLampStation, SlitLampView, FluoresceinStation, SLIT_STRUCTURES,
});
