// ════════════════════════════════════════════════════════════════════
// Slit Lamp Station — V3 (Phase 1 MVP)
//
// Procedural flow per reference doc §7 (anterior segment, outer→inner):
//   1. Setup        — chin rest, magnif, slit width, mode
//   2. Adnexa       — lids, lashes, meibomian
//   3. Konjungtiva  — bulbi + tarsal
//   4. Cornea       — optical section (cross-section view of layers)
//   5. Anterior chamber — cells & flare grading (SUN)
//   6. Iris + Lens  — anterior segment depth
//   7. Catat hasil
//
// Theme: DARK (slit lamp room is dark per protocol)
//
// Signature interactions:
//   - Adjustable slit beam (width 0–12, angle 0–90°, magnification 6–40x)
//   - Mode swap: diffuse / direct focal / retro / cobalt blue
//   - Cornea cross-section reveals 5 layers (Epi → Bowman → Stroma →
//     Descemet → Endo) — slider sweeps the beam through them
//   - AC cells & flare grader — interactive scale 0 → 4+
//
// Props:
//   findings (case anteriorSegment + ext.fluorescein)
//   ext      (extension data)
//   caseId
//   onComplete()
//   onLog(entry)
//
// MIGRATION NOTES:
//   - Beam transform is a single CSS `transform: rotate() scaleX()` —
//     Framer Motion-friendly.
//   - Cornea layer reveal uses SVG mask — translates to <motion.path>.
//   - Mode state (diffuse/focal/retro/blue) is a string discriminator —
//     maps to a Zustand slice or a useReducer.
// ════════════════════════════════════════════════════════════════════

const SLIT_MODES = [
  { id: 'diffuse', label: 'Diffuse', icon: '◯', desc: 'Slit lebar, low angle — overview umum' },
  { id: 'focal',   label: 'Optical section', icon: '│', desc: 'Slit sempit tegak lurus — potong melintang' },
  { id: 'retro',   label: 'Retro-illumination', icon: '◐', desc: 'Cahaya dari iris/fundus — defek epi' },
  { id: 'blue',    label: 'Cobalt blue', icon: '🔵', desc: 'Filter biru — fluorescein staining' },
];

const SUN_GRADES_CELLS = [
  { value: '0',    label: '0 · < 1 sel',     score: 0 },
  { value: '0.5+', label: '0.5+ · 1–5 sel',   score: 1 },
  { value: '1+',   label: '1+ · 6–15 sel',    score: 2 },
  { value: '2+',   label: '2+ · 16–25 sel',   score: 3 },
  { value: '3+',   label: '3+ · 26–50 sel',   score: 4 },
  { value: '4+',   label: '4+ · > 50 sel',    score: 5 },
];

const FLARE_GRADES = [
  { value: '0',  label: '0 · tidak ada' },
  { value: '1+', label: '1+ · faint' },
  { value: '2+', label: '2+ · iris detail jelas' },
  { value: '3+', label: '3+ · iris detail kabur' },
  { value: '4+', label: '4+ · fibrin/plastic aqueous' },
];

// ── Slit Lamp Anterior View ────────────────────────────────────────────
// Top-down view of the eye with adjustable slit beam crossing the cornea.
const SlitView = ({ slitWidth, slitAngle, mode, magnification, hasInfiltrate, hasHypopyon, hasFluoresceinDefect, hasKPs, irisColor = '#5865F2' }) => {
  const size = 360;
  // beam width in px (slitWidth 0–12 → 4–120 px)
  const beamWidthPx = 6 + (slitWidth / 12) * 110;

  const isBlue = mode === 'blue';
  const isRetro = mode === 'retro';
  const isDiffuse = mode === 'diffuse';
  const isFocal = mode === 'focal';

  return (
    <div style={{
      width: size, height: size * 0.85, position: 'relative',
      margin: '0 auto',
      background: 'radial-gradient(circle at 50% 50%, #050810 0%, #00000A 80%)',
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <defs>
          <radialGradient id="sl-sclera" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FAFCFF" />
            <stop offset="80%" stopColor="#DCE3F5" />
            <stop offset="100%" stopColor="#8B95C0" />
          </radialGradient>
          <radialGradient id="sl-iris" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={irisColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1A1D3E" />
          </radialGradient>
          <linearGradient id="sl-beam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"  stopColor={isBlue ? "#5BA8FF" : "#FFF6CC"} stopOpacity="0.0" />
            <stop offset="20%" stopColor={isBlue ? "#3A7AFF" : "#FFE066"} stopOpacity="0.95" />
            <stop offset="80%" stopColor={isBlue ? "#3A7AFF" : "#FFE066"} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isBlue ? "#5BA8FF" : "#FFF6CC"} stopOpacity="0.0" />
          </linearGradient>
          <filter id="sl-glow">
            <feGaussianBlur stdDeviation="2.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sclera (eye almond shape) */}
        <path
          d={`M ${size * 0.1} ${size * 0.42}
              Q ${size * 0.5} ${size * 0.05} ${size * 0.9} ${size * 0.42}
              Q ${size * 0.5} ${size * 0.78} ${size * 0.1} ${size * 0.42} Z`}
          fill="url(#sl-sclera)"
          stroke="#0a0a14"
          strokeWidth="1.5"
        />

        {/* Cornea reflection ring */}
        <circle cx={size * 0.5} cy={size * 0.42} r={size * 0.18}
          fill="rgba(255,255,255,0.05)" stroke="rgba(140,200,255,0.2)" strokeWidth="0.5" />

        {/* Iris */}
        <circle cx={size * 0.5} cy={size * 0.42} r={size * 0.15}
          fill={isRetro ? 'rgba(180,80,40,0.7)' : 'url(#sl-iris)'} />

        {/* Iris striations */}
        {!isRetro && [...Array(36)].map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r1 = size * 0.075;
          const r2 = size * 0.145;
          return (
            <line key={i}
              x1={size * 0.5 + Math.cos(a) * r1}
              y1={size * 0.42 + Math.sin(a) * r1}
              x2={size * 0.5 + Math.cos(a) * r2}
              y2={size * 0.42 + Math.sin(a) * r2}
              stroke="#1F2A7A" strokeWidth="0.4" opacity="0.5" />
          );
        })}

        {/* Pupil */}
        <circle cx={size * 0.5} cy={size * 0.42} r={size * 0.06}
          fill={isRetro ? '#FF6B35' : '#000'} opacity={isRetro ? 0.9 : 1} />

        {/* Hypopyon — layer of pus inferior AC */}
        {hasHypopyon && (
          <path
            d={`M ${size * 0.34} ${size * 0.5}
                Q ${size * 0.5} ${size * 0.58} ${size * 0.66} ${size * 0.5}
                Q ${size * 0.5} ${size * 0.55} ${size * 0.34} ${size * 0.5} Z`}
            fill="rgba(245,232,210,0.85)" stroke="#aaa" strokeWidth="0.5"
          />
        )}

        {/* Corneal infiltrate */}
        {hasInfiltrate && (
          <circle cx={size * 0.5} cy={size * 0.42} r={size * 0.04}
            fill="rgba(255,250,230,0.5)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        )}

        {/* KPs on endothelium (visible as small dots at iris periphery) */}
        {hasKPs && [...Array(8)].map((_, i) => {
          const a = Math.PI * (0.6 + i * 0.1);
          const r = size * 0.13;
          return (
            <circle key={i}
              cx={size * 0.5 + Math.cos(a) * r}
              cy={size * 0.45 + Math.sin(a) * r * 0.4}
              r="2" fill="rgba(180,140,100,0.7)"
            />
          );
        })}

        {/* Fluorescein staining (only visible under blue) */}
        {isBlue && hasFluoresceinDefect && (
          <ellipse cx={size * 0.5} cy={size * 0.43} rx={size * 0.05} ry={size * 0.04}
            fill="rgba(125,255,180,0.85)" filter="url(#sl-glow)" />
        )}

        {/* Slit beam */}
        <g transform={`rotate(${slitAngle}, ${size * 0.5}, ${size * 0.42})`}>
          <rect
            x={size * 0.5 - beamWidthPx / 2}
            y={size * 0.05}
            width={beamWidthPx}
            height={size * 0.78}
            fill="url(#sl-beam)"
            opacity={isDiffuse ? 0.35 : isFocal ? 0.85 : isRetro ? 0.6 : 0.8}
            style={{
              mixBlendMode: 'screen',
              filter: isFocal ? 'url(#sl-glow)' : 'none',
              transition: 'all 0.3s var(--ease-panel)',
            }}
          />
          {/* Bright center line for focal mode */}
          {isFocal && (
            <line
              x1={size * 0.5}
              y1={size * 0.07}
              x2={size * 0.5}
              y2={size * 0.78}
              stroke={isBlue ? '#9CC8FF' : '#FFF6CC'}
              strokeWidth="1"
              opacity="0.95"
              filter="url(#sl-glow)"
            />
          )}
        </g>
      </svg>

      {/* Magnification reticle */}
      <div style={{
        position: 'absolute', bottom: 10, left: 12,
        fontSize: 9, color: '#8B95C0', fontWeight: 700, letterSpacing: '0.06em',
      }}>
        {magnification}× · {SLIT_MODES.find(m => m.id === mode)?.label}
      </div>
      <div style={{
        position: 'absolute', bottom: 10, right: 12,
        fontSize: 9, color: '#8B95C0', fontWeight: 700, letterSpacing: '0.06em',
      }}>
        slit {slitWidth.toFixed(0)} · {slitAngle}°
      </div>
    </div>
  );
};

// ── Cornea Cross-Section (optical section view) ────────────────────────
const CorneaCrossSection = ({ activeLayer, findings }) => {
  // Show 5 layers vertically (top = epi, bottom = endo)
  const layers = [
    { id: 'epi',      label: 'Epithelium',          desc: 'Tight junction barrier (5–6 cells)', color: '#A4DCEA' },
    { id: 'bowman',   label: "Bowman's membrane",   desc: 'Acellular collagen layer',           color: '#7CC4D4' },
    { id: 'stroma',   label: 'Stroma',              desc: '90% kornea — kolagen + keratosit',    color: '#5BA8CF' },
    { id: 'descemet', label: "Descemet's",          desc: 'Basement membrane endothelium',       color: '#3D85B0' },
    { id: 'endo',     label: 'Endothelium',         desc: 'Single layer, pump function',         color: '#1E5980' },
  ];

  return (
    <div style={{
      width: 320, position: 'relative',
      background: 'radial-gradient(circle at 30% 0%, #0A0F22 0%, #020409 90%)',
      borderRadius: 14,
      padding: 16,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Cornea — optical section (40×)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14, position: 'relative' }}>
        {layers.map((layer, i) => {
          const isActive = activeLayer === layer.id;
          return (
            <div key={layer.id} style={{
              position: 'relative',
              padding: '10px 12px',
              borderRadius: 8,
              background: isActive
                ? `linear-gradient(90deg, ${layer.color}40 0%, ${layer.color}15 100%)`
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive ? layer.color : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.25s var(--ease-panel)',
              transform: isActive ? 'translateX(4px)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 4, height: 28, borderRadius: 2,
                  background: layer.color,
                  boxShadow: isActive ? `0 0 12px ${layer.color}` : 'none',
                  transition: 'box-shadow 0.3s',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#F2F5FF' : '#C0CAEC' }}>
                    {layer.label}
                  </div>
                  <div style={{ fontSize: 9, color: '#8B95C0', lineHeight: 1.3 }}>
                    {layer.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Beam sweep indicator */}
      {activeLayer && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(88,101,242,0.12)',
          border: '1px solid rgba(88,101,242,0.3)',
          fontSize: 10, color: '#A4B0FF', lineHeight: 1.5,
        }}>
          {findings?.[activeLayer] || `Lapisan ${activeLayer}: tampak normal pada optical section.`}
        </div>
      )}
    </div>
  );
};

// ── AC Cells & Flare Grader ────────────────────────────────────────────
const ACGrader = ({ cellsGrade, onCellsGrade, flareGrade, onFlareGrade, simulatedCells = 5 }) => {
  const cellsScore = SUN_GRADES_CELLS.find(g => g.value === cellsGrade)?.score ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* AC visualisation */}
      <div style={{
        position: 'relative',
        background: 'radial-gradient(circle at 30% 30%, #0A0F22 0%, #020409 90%)',
        borderRadius: 14, padding: 14,
        border: '1px solid rgba(255,255,255,0.05)',
        minHeight: 220,
      }}>
        <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          AC slit (1×1mm beam)
        </div>
        <div style={{
          position: 'relative', height: 160, borderRadius: 10,
          background: `linear-gradient(180deg,
            rgba(255,224,102,${0.05 + cellsScore * 0.04}) 0%,
            rgba(0,0,0,0.6) 100%)`,
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {/* "Headlight in fog" — flare */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at center, rgba(255,224,102,${0.1 * (FLARE_GRADES.findIndex(g => g.value === flareGrade) || 0)}) 0%, transparent 70%)`,
          }} />
          {/* floating cells */}
          {[...Array(simulatedCells)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${10 + (i * 17) % 80}%`,
              left: `${15 + (i * 23) % 70}%`,
              width: 3, height: 3, borderRadius: '50%',
              background: '#FFE066',
              boxShadow: '0 0 4px rgba(255,224,102,0.6)',
              animation: `pulse ${1.4 + (i * 0.2) % 1}s ease-in-out ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: '#8B95C0', textAlign: 'center' }}>
          Sel mengambang dilihat di beam 1×1mm pada 25–40× magnif.
        </div>
      </div>

      {/* Graders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <StructuredField label="AC Cells (SUN)" theme="dark" hint="Hitung sel dalam beam slit 1×1mm × 1mm tinggi" required>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SUN_GRADES_CELLS.map(g => (
              <InstrumentButton key={g.value} size="sm" theme="dark"
                tone={g.score === 0 ? 'success' : g.score >= 3 ? 'danger' : 'amber'}
                active={cellsGrade === g.value}
                onClick={() => onCellsGrade(g.value)}>
                {g.value}
              </InstrumentButton>
            ))}
          </div>
        </StructuredField>

        <StructuredField label="AC Flare (SUN)" theme="dark" hint="Tyndall effect — protein di humor aqueous" required>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {FLARE_GRADES.map(g => (
              <InstrumentButton key={g.value} size="sm" theme="dark"
                tone={g.value === '0' ? 'success' : g.value === '4+' ? 'danger' : 'amber'}
                active={flareGrade === g.value}
                onClick={() => onFlareGrade(g.value)}>
                {g.value}
              </InstrumentButton>
            ))}
          </div>
        </StructuredField>
      </div>
    </div>
  );
};

// ── Main Station ───────────────────────────────────────────────────────
const SlitLampStationV3 = ({ findings, ext, caseId, onComplete, onLog }) => {
  const STEPS = ['Setup', 'Adnexa', 'Konjungtiva', 'Cornea', 'AC', 'Iris + Lens', 'Catat'];
  const flow = useStep(STEPS.length);

  // Slit lamp controls
  const [slitWidth, setSlitWidth] = React.useState(8);
  const [slitAngle, setSlitAngle] = React.useState(0);
  const [magnification, setMagnification] = React.useState(10);
  const [mode, setMode] = React.useState('diffuse');
  const [activeCornealLayer, setActiveCornealLayer] = React.useState(null);

  // Findings from case
  const findingsAS = findings?.anteriorSegment || {};
  const hasInfiltrate = /infiltrat|ulcer/i.test(JSON.stringify(findingsAS) + caseId);
  const hasHypopyon   = /hypopyon/i.test(JSON.stringify(findingsAS));
  const hasFluorDefect = ext?.fluorescein?.[ext.affectedEye]?.pattern && ext.fluorescein[ext.affectedEye].pattern !== 'none';
  const hasKPs = /kps|keratic|uveit/i.test(JSON.stringify(findingsAS) + caseId);

  // Structured findings
  const [adnexaFinding, setAdnexaFinding] = React.useState(null);
  const [conjFinding, setConjFinding] = React.useState(null);
  const [cornealFinding, setCornealFinding] = React.useState(null);
  const [cellsGrade, setCellsGrade] = React.useState(null);
  const [flareGrade, setFlareGrade] = React.useState(null);
  const [lensFinding, setLensFinding] = React.useState(null);

  // simulated cells visualisation count
  const simCells = ({ '0':0, '0.5+':3, '1+':8, '2+':18, '3+':30, '4+':45 })[cellsGrade] ?? 0;

  // Auto-set sensible mode per step
  React.useEffect(() => {
    if (flow.step === 1) { setMode('diffuse'); setSlitWidth(10); setMagnification(10); }
    if (flow.step === 2) { setMode('diffuse'); setSlitWidth(8); setMagnification(10); }
    if (flow.step === 3) { setMode('focal');   setSlitWidth(2); setSlitAngle(45); setMagnification(25); }
    if (flow.step === 4) { setMode('focal');   setSlitWidth(1); setMagnification(40); }
    if (flow.step === 5) { setMode('diffuse'); setSlitWidth(6); setMagnification(16); }
  }, [flow.step]);

  const canComplete = adnexaFinding && conjFinding && cornealFinding && cellsGrade && flareGrade && lensFinding;

  const summary = canComplete
    ? `Cornea: ${cornealFinding} · AC: cells ${cellsGrade}, flare ${flareGrade} · Lens: ${lensFinding}`
    : 'Selesaikan inspeksi tiap stasiun sebelum mencatat hasil.';

  const handleComplete = () => {
    onLog && onLog({
      type: 'slitlamp',
      adnexa: adnexaFinding, conjunctiva: conjFinding,
      cornea: cornealFinding, ac_cells: cellsGrade, ac_flare: flareGrade, lens: lensFinding,
    });
    onComplete && onComplete();
  };

  // ── Step bodies ──
  const renderStep = () => {
    const slitView = (
      <SlitView
        slitWidth={slitWidth} slitAngle={slitAngle}
        mode={mode} magnification={magnification}
        hasInfiltrate={hasInfiltrate && flow.step >= 3}
        hasHypopyon={hasHypopyon && flow.step >= 4}
        hasFluoresceinDefect={hasFluorDefect && mode === 'blue'}
        hasKPs={hasKPs && flow.step >= 4}
        irisColor={ext?.pupils?.OS?.shape === 'irregular' ? '#6B5430' : '#5865F2'}
      />
    );

    const controls = (
      <SlitLampControls
        slitWidth={slitWidth} setSlitWidth={setSlitWidth}
        slitAngle={slitAngle} setSlitAngle={setSlitAngle}
        magnification={magnification} setMagnification={setMagnification}
        mode={mode} setMode={setMode}
      />
    );

    switch (flow.step) {
      case 0:
        return (
          <div>
            <StationIntro theme="dark" icon="🔬" title="Setup slit lamp"
              body="Atur chin rest & headband. Sesuaikan eyepieces (PD + dioptri). Lepas locking screw. Mulai dengan magnifikasi 10× dan iluminasi diffuse." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {slitView}
              {controls}
            </div>
            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" tone="primary" active onClick={flow.next}>
                Lanjut: Adnexa →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 1: case 2: case 5: {
        const labels = {
          1: { title: 'Adnexa & kelopak mata', body: 'Inspeksi lid margin, bulu mata (trikiasis), kelenjar Meibom (squeeze ringan untuk lihat sekresi). Eversi kelopak atas untuk papila/folikel.', finding: adnexaFinding, setFinding: setAdnexaFinding, opts: [
            { value: 'normal', label: 'Normal' }, { value: 'mgd', label: 'MGD / blepharitis' },
            { value: 'gpc', label: 'Papila — GPC/VKC' }, { value: 'folikel', label: 'Folikel viral' },
            { value: 'trikiasis', label: 'Trikiasis' }, { value: 'edema', label: 'Lid edema / discharge' },
          ]},
          2: { title: 'Konjungtiva & sklera', body: 'Bedakan injeksi konjungtiva (difuse, lebih merah ke fornix) vs perikorneal/silier (lebih merah di limbus). Cari kemosis, hemoragik, nevus.', finding: conjFinding, setFinding: setConjFinding, opts: [
            { value: 'normal', label: 'Tenang' },
            { value: 'difuse', label: 'Injeksi konjungtiva difuse' },
            { value: 'silier', label: 'Injeksi siliar (perilimbal)' },
            { value: 'kemosis', label: 'Kemosis' },
            { value: 'sch', label: 'Subkonjungtival hemoragik' },
            { value: 'skleritis', label: 'Skleritis (deep violaceous)' },
          ]},
          5: { title: 'Iris + Lens', body: 'Inspeksi iris (rubeosis, synechiae, TID). Periksa lens (NS, PSC, exfoliation). Cek red reflex.', finding: lensFinding, setFinding: setLensFinding, opts: [
            { value: 'clear', label: 'Lens clear, iris normal' },
            { value: 'ns', label: 'Nuclear sclerosis ringan' },
            { value: 'psc', label: 'PSC katarak' },
            { value: 'synechiae', label: 'Posterior synechiae' },
            { value: 'rubeosis', label: 'Rubeosis iridis' },
            { value: 'pseudoexfoliation', label: 'Pseudoexfoliation' },
          ]},
        };
        const info = labels[flow.step];
        return (
          <div>
            <StationIntro theme="dark" icon="🔬" title={info.title} body={info.body} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              {slitView}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {controls}
                <StructuredField label="Temuan struktural" theme="dark" required>
                  <StructuredSelect theme="dark" value={info.finding} onChange={info.setFinding} options={info.opts} />
                </StructuredField>
              </div>
            </div>
            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(flow.step - 1)}>← Kembali</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!info.finding} onClick={flow.next}>
                Lanjut →
              </InstrumentButton>
            </StationControls>
          </div>
        );
      }

      case 3:
        return (
          <div>
            <StationIntro theme="dark" icon="│" title="Cornea — optical section (lapis demi lapis)"
              body="Slit beam sempit, sudut 45° dari sumbu mata. Klik lapisan di kanan untuk fokus beam ke sana. Cari defek epi, infiltrat stroma, lipatan Descemet, guttae/KPs di endotelium." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              {slitView}
              <CorneaCrossSection activeLayer={activeCornealLayer} findings={findingsAS} />
            </div>

            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Sweep beam ke lapisan
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['epi', 'bowman', 'stroma', 'descemet', 'endo'].map(l => (
                  <InstrumentButton key={l} size="sm" theme="dark" active={activeCornealLayer === l} onClick={() => setActiveCornealLayer(l)}>
                    {l}
                  </InstrumentButton>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {controls}
            </div>

            <div style={{ marginTop: 12 }}>
              <StructuredField label="Temuan kornea" theme="dark" required>
                <StructuredSelect theme="dark" value={cornealFinding} onChange={setCornealFinding} options={[
                  { value: 'clear',     label: 'Clear, no defek' },
                  { value: 'spk',       label: 'SPK — punctate ringan' },
                  { value: 'abrasion',  label: 'Corneal abrasion' },
                  { value: 'infiltrate',label: '🚨 Stromal infiltrate + epi defect' },
                  { value: 'ulcer',     label: '🚨 Corneal ulcer' },
                  { value: 'hsv',       label: 'Dendritik (HSV)' },
                  { value: 'edema',     label: 'Microcystic edema' },
                  { value: 'guttae',    label: 'Endothelial guttae (Fuchs)' },
                ]} />
              </StructuredField>
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(2)}>← Konjungtiva</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!cornealFinding} onClick={flow.next}>
                Lanjut: Anterior Chamber →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 4:
        return (
          <div>
            <StationIntro theme="dark" icon="◐" title="Anterior chamber — cells & flare"
              body="Beam 1×1 mm, magnif 25–40×, fokus iris lalu geser sedikit ke depan ke tengah AC. Hitung sel mengambang per field — grade per SUN criteria. Flare = haze tyndall effect karena protein." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
              {slitView}
              <ACGrader cellsGrade={cellsGrade} onCellsGrade={setCellsGrade}
                flareGrade={flareGrade} onFlareGrade={setFlareGrade}
                simulatedCells={simCells} />
            </div>
            <div style={{ marginTop: 12 }}>{controls}</div>
            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(3)}>← Cornea</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!cellsGrade || !flareGrade} onClick={flow.next}>
                Lanjut: Iris + Lens →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 6:
        return (
          <div>
            <StationIntro theme="dark" icon="📋" title="Ringkasan slit lamp"
              body="Kompilasi temuan anterior segment lapis demi lapis." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <DarkResultCard2 label="Adnexa" value={adnexaFinding} />
              <DarkResultCard2 label="Konjungtiva" value={conjFinding} />
              <DarkResultCard2 label="Cornea" value={cornealFinding} />
              <DarkResultCard2 label="AC Cells" value={cellsGrade} />
              <DarkResultCard2 label="AC Flare" value={flareGrade} />
              <DarkResultCard2 label="Iris/Lens" value={lensFinding} />
            </div>

            {(cellsGrade && parseFloat(cellsGrade) >= 1) && (
              <div style={{
                marginTop: 14, padding: 12, borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 11, color: '#FB7185', lineHeight: 1.5,
              }}>
                🚨 <strong>AC cells {cellsGrade}</strong> + flare {flareGrade} → konsisten dengan <strong>anterior uveitis aktif</strong>. Cari etiologi sistemik (HLA-B27, sarkoidosis, infectious).
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <StationShell theme="dark" icon="🔬" title="Slit Lamp Examination" subtitle="Biomicroscopy segmen anterior — lapis demi lapis dari luar ke dalam">
      <StepLadder theme="dark" steps={STEPS} current={flow.step} done={flow.done} onJump={flow.goto} />
      {renderStep()}
      <StationFooter theme="dark" onComplete={handleComplete} canComplete={canComplete} summary={summary} />
    </StationShell>
  );
};

// ── Slit Lamp Controls ─────────────────────────────────────────────────
const SlitLampControls = ({ slitWidth, setSlitWidth, slitAngle, setSlitAngle, magnification, setMagnification, mode, setMode }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 12,
    padding: 14, borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div>
      <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Mode iluminasi
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {SLIT_MODES.map(m => (
          <InstrumentButton key={m.id} size="sm" theme="dark" tone={m.id === 'blue' ? 'primary' : 'neutral'}
            active={mode === m.id} onClick={() => setMode(m.id)} icon={m.icon}>
            {m.label}
          </InstrumentButton>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      <SliderField label="Slit width" value={slitWidth} min={0} max={12} step={0.5} unit="" onChange={setSlitWidth} />
      <SliderField label="Angle" value={slitAngle} min={0} max={90} step={5} unit="°" onChange={setSlitAngle} />
      <SliderField label="Magnif" value={magnification} min={6} max={40} step={1} unit="×" onChange={setMagnification} />
    </div>
  </div>
);

const SliderField = ({ label, value, min, max, step, unit, onChange }) => (
  <div>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontSize: 9, color: '#8B95C0', fontWeight: 700, marginBottom: 4,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      <span>{label}</span>
      <span style={{ color: '#FFE066', fontVariantNumeric: 'tabular-nums' }}>{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value} onChange={e => onChange(Number(e.target.value))}
      style={{
        width: '100%', accentColor: '#FFE066',
        height: 4, cursor: 'pointer',
      }}
    />
  </div>
);

const DarkResultCard2 = ({ label, value }) => (
  <div style={{
    padding: '10px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }}>
    <div style={{ fontSize: 9, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: '#F2F5FF' }}>{value || '—'}</div>
  </div>
);

Object.assign(window, { SlitLampStationV3 });
