// ============================================================
// OphthaSim — Fundoscopy V2 (interactive) + OCT B-scan
// ============================================================

// ── OCT cross-section patterns ───────────────────────────
const OCT_PATTERNS = {
  normal: {
    label: 'Normal Macula',
    layers: 'normal',
    foveal: 'preserved foveal pit',
    abnormality: null,
    findings: 'Normal foveal contour. All retinal layers intact. Outer segments preserved.'
  },
  rd: {
    label: 'Retinal Detachment',
    layers: 'detached',
    foveal: 'macula attached vs off',
    abnormality: 'rd',
    findings: '🚨 Subretinal fluid lifting neurosensory retina off the RPE. Inferotemporal RD.'
  },
  crvo: {
    label: 'CRVO with Macular Oedema',
    layers: 'thickened',
    foveal: 'cystoid spaces',
    abnormality: 'cme',
    findings: 'Diffuse retinal thickening (~620μm). Multiple intraretinal cystoid spaces. Macular oedema.'
  },
  'optic-neuritis': {
    label: 'Optic Nerve Head',
    layers: 'normal',
    foveal: 'normal contour',
    abnormality: 'onh-swelling',
    findings: 'Optic nerve head — increased RNFL thickness (papilloedema/disc swelling).'
  },
  diabetic: {
    label: 'Diabetic Macular Oedema',
    layers: 'thickened',
    foveal: 'cystoid spaces + hard exudates',
    abnormality: 'dme',
    findings: 'Central foveal thickness 420μm. Intraretinal cystic spaces. Hyper-reflective dots (exudates).'
  }
};

// ══════════════════════════════════════════════════════════
// FUNDOSCOPY V2 — Direct + Indirect + Multi-region
// ══════════════════════════════════════════════════════════
const FundoscopyStationV2 = ({ findings, ext, caseId, onComplete, onLog }) => {
  const [mode, setMode] = React.useState('direct'); // direct | indirect | 90D
  const [eye, setEye] = React.useState('OD');
  const [zoom, setZoom] = React.useState(1);
  const [region, setRegion] = React.useState('posterior'); // posterior | sup-temp | sup-nas | inf-temp | inf-nas
  const [redFree, setRedFree] = React.useState(false);
  const [dilated, setDilated] = React.useState(false);
  const [examined, setExamined] = React.useState(new Set()); // 'eye-region' keys

  const affectedEye = ext.affectedEye || 'OD';
  const isAffected = eye === affectedEye || affectedEye === 'OU';

  const examineRegion = (r) => {
    setRegion(r);
    setExamined(prev => new Set([...prev, eye + '-' + r]));
    onLog(`Fundus ${eye} ${r}: ${region === 'posterior' ? (FUNDOSCOPY_TYPES[findings.fundoscopyType]?.label || 'normal') : 'scanned'}`);
  };

  React.useEffect(() => {
    if (!dilated) return; // require dilation first
    const examinedAffected = [...examined].filter(k => k.startsWith(affectedEye + '-'));
    if (examinedAffected.length >= 3 || examined.size >= 5) onComplete();
  }, [examined, dilated, affectedEye, onComplete]);

  const regions = [
    { key: 'posterior', label: 'Posterior Pole', x: 0, y: 0 },
    { key: 'sup-temp',  label: 'Sup. Temporal', x: 1, y: -1 },
    { key: 'sup-nas',   label: 'Sup. Nasal',    x: -1, y: -1 },
    { key: 'inf-temp',  label: 'Inf. Temporal', x: 1, y: 1 },
    { key: 'inf-nas',   label: 'Inf. Nasal',    x: -1, y: 1 },
  ];

  return (
    <div>
      <SectionIntro icon="🔴" title="Fundoscopy — Posterior Segment"
        sub="Examine the optic disc, macula, vessels and peripheral retina. Dilate pupils for adequate view." />

      {/* Pre-flight: dilation */}
      {!dilated && (
        <InstrumentFrame title="Pre-Examination" style={{ marginBottom: 16 }}>
          <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 32 }}>💧</div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Dilate pupils (Tropicamide 1%)</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                Recommended for adequate posterior segment view. Wait 20–30 min.
                <span style={{ color: 'var(--amber-d)' }}> ⚠️ Skip if suspecting acute angle closure.</span>
              </div>
            </div>
            <Btn variant="primary" onClick={() => { setDilated(true); onLog('Pupils dilated for fundoscopy'); }}>
              💧 Instil Mydriatic →
            </Btn>
          </div>
        </InstrumentFrame>
      )}

      {dilated && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>EYE</span>
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
            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 6px' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>MODE</span>
            {[['direct','Direct','small field'],['indirect','Indirect','wide field, inverted'],['90D','Slit + 90D','stereoscopic']].map(([v, l, sub]) => (
              <button key={v} onClick={() => setMode(v)} style={{
                padding: '6px 10px', borderRadius: 10,
                border: `1.5px solid ${mode === v ? 'var(--primary)' : 'var(--border)'}`,
                background: mode === v ? 'var(--primary-l)' : 'var(--surface)',
                color: mode === v ? 'var(--primary)' : 'var(--text-2)',
                fontFamily: 'Poppins', cursor: 'pointer', fontSize: 11,
              }}>
                <div style={{ fontWeight: 700 }}>{l}</div>
                <div style={{ fontSize: 8, opacity: 0.7 }}>{sub}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Fundus view */}
            <InstrumentFrame title={`Fundoscopy · ${eye} · ${region}`} dark style={{ flex: 1, minWidth: 460 }}>
              <FundusViewV2
                findings={findings}
                ext={ext}
                isAffected={isAffected}
                mode={mode}
                zoom={zoom}
                region={region}
                redFree={redFree}
              />
            </InstrumentFrame>

            {/* Controls */}
            <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InstrumentFrame title="Region — click to scan">
                <div style={{ padding: 12 }}>
                  <svg viewBox="0 0 200 200" width="100%" style={{ display: 'block' }}>
                    <circle cx="100" cy="100" r="92" fill="var(--surface-2)" stroke="var(--border)" />
                    {regions.map(r => {
                      const isDone = examined.has(eye + '-' + r.key);
                      const isActive = region === r.key;
                      const cx = 100 + r.x * 50;
                      const cy = 100 + r.y * 50;
                      return (
                        <g key={r.key} style={{ cursor: 'pointer' }} onClick={() => examineRegion(r.key)}>
                          <circle cx={cx} cy={cy} r="22"
                            fill={isActive ? 'var(--primary)' : isDone ? 'var(--green)' : 'var(--surface)'}
                            stroke={isActive ? 'var(--primary)' : 'var(--border)'} strokeWidth="1.5" />
                          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700"
                            fill={isActive || isDone ? '#fff' : 'var(--text-2)'} fontFamily="Poppins">
                            {isDone ? '✓' : isActive ? '●' : '+'}
                          </text>
                          {isActive && (
                            <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fill="var(--primary)" fontFamily="Poppins" fontWeight="700">
                              {r.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
                    {[...examined].filter(k => k.startsWith(eye + '-')).length}/5 scanned ({eye})
                  </div>
                </div>
              </InstrumentFrame>

              <InstrumentFrame title="Zoom">
                <div style={{ padding: 12 }}>
                  <input type="range" min="1" max="4" step="0.25" value={zoom}
                    onChange={e => setZoom(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
                    <span>1x</span><span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{zoom.toFixed(2)}x</span><span>4x</span>
                  </div>
                </div>
              </InstrumentFrame>

              <InstrumentFrame title="Filter">
                <div style={{ padding: 12 }}>
                  <ToggleRow label="🟢 Red-free filter" value={redFree} onChange={setRedFree} />
                </div>
              </InstrumentFrame>
            </div>
          </div>

          {/* Findings recap */}
          {[...examined].filter(k => k.startsWith(affectedEye + '-')).length >= 1 && findings.posteriorSegment && (
            <div className="ab" style={{ marginTop: 16, padding: 14, background: 'var(--primary-l)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Posterior Findings · {affectedEye}
              </div>
              {Object.entries(findings.posteriorSegment || {}).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, marginBottom: 4 }}>
                  <strong>{k}:</strong> <span style={{ color: 'var(--text-2)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── The interactive fundus view ──────────────────────────
const FundusViewV2 = ({ findings, ext, isAffected, mode, zoom, region, redFree }) => {
  const size = 460;
  const cx = size / 2, cy = size / 2;
  const baseR = size / 2 - 12;
  const viewR = mode === 'indirect' ? baseR : baseR * 0.85;

  // Region offset — pan within fundus
  const regionShift = {
    posterior:  { dx: 0,   dy: 0 },
    'sup-temp': { dx: 80,  dy: -80 },
    'sup-nas':  { dx: -80, dy: -80 },
    'inf-temp': { dx: 80,  dy: 80 },
    'inf-nas':  { dx: -80, dy: 80 },
  }[region] || { dx: 0, dy: 0 };

  // Apply pan + zoom transform
  const tx = -regionShift.dx * zoom + (mode === 'indirect' ? 0 : 0);
  const ty = -regionShift.dy * zoom;

  // Indirect inverts the image
  const indirectScale = mode === 'indirect' ? -1 : 1;

  const fType = isAffected ? findings.fundoscopyType : 'normal';
  const cfg = FUNDOSCOPY_TYPES[fType] || FUNDOSCOPY_TYPES.normal;

  // Red-free changes color scheme
  const bg1 = redFree ? '#1A4020' : cfg.bg[0];
  const bg2 = redFree ? '#0A2010' : cfg.bg[1];
  const vesselColor = redFree ? '#1a1a1a' : cfg.vessels;

  return (
    <div style={{ position: 'relative', background: '#000814', padding: 0 }}>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <defs>
          <radialGradient id="fundBgV2" cx="50%" cy="45%">
            <stop offset="0%" stopColor={bg1} />
            <stop offset="100%" stopColor={bg2} />
          </radialGradient>
          <clipPath id="scopeViewV2">
            <circle cx={cx} cy={cy} r={viewR} />
          </clipPath>
          <radialGradient id="vignV2">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
          </radialGradient>
          <filter id="vesselGlowV2">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer dark frame */}
        <rect width={size} height={size} fill="#000814" />

        <g clipPath="url(#scopeViewV2)">
          <g transform={`translate(${cx},${cy}) scale(${zoom * indirectScale},${zoom * (mode === 'indirect' ? -1 : 1)}) translate(${tx},${ty}) translate(${-cx},${-cy})`}>
            {/* Background */}
            <circle cx={cx} cy={cy} r={baseR * 1.6} fill="url(#fundBgV2)" />

            {/* Vasculature */}
            <g stroke={vesselColor} fill="none" strokeLinecap="round" filter="url(#vesselGlowV2)">
              {[
                `M${cx+28},${cy-10} C${cx+45},${cy-28} ${cx+68},${cy-48} ${cx+88},${cy-68}`,
                `M${cx+28},${cy-10} C${cx+48},${cy-18} ${cx+72},${cy-22} ${cx+95},${cy-30}`,
                `M${cx+28},${cy-10} C${cx+14},${cy-28} ${cx+4},${cy-52} ${cx-10},${cy-72}`,
                `M${cx+28},${cy-10} C${cx+8},${cy-22} ${cx-18},${cy-30} ${cx-40},${cy-40}`,
                `M${cx+28},${cy+10} C${cx+50},${cy+28} ${cx+72},${cy+50} ${cx+90},${cy+72}`,
                `M${cx+28},${cy+10} C${cx+52},${cy+18} ${cx+78},${cy+22} ${cx+100},${cy+32}`,
                `M${cx+28},${cy+10} C${cx+10},${cy+28} ${cx-4},${cy+50} ${cx-14},${cy+72}`,
                `M${cx+28},${cy+10} C${cx+6},${cy+22} ${cx-20},${cy+32} ${cx-44},${cy+44}`,
                `M${cx+50},${cy-48} C${cx+60},${cy-60} ${cx+70},${cy-55}`,
                `M${cx+72},${cy-22} C${cx+82},${cy-16} ${cx+88},${cy-24}`,
                // Peripheral branches
                `M${cx-40},${cy-40} C${cx-80},${cy-50} ${cx-120},${cy-70}`,
                `M${cx+95},${cy-30} C${cx+135},${cy-40} ${cx+170},${cy-55}`,
                `M${cx-44},${cy+44} C${cx-80},${cy+58} ${cx-120},${cy+78}`,
                `M${cx+100},${cy+32} C${cx+145},${cy+50} ${cx+180},${cy+70}`,
              ].map((d, i) => (
                <path key={i} d={d} strokeWidth={i < 4 ? 2.4 : i < 8 ? 1.6 : i < 10 ? 1.0 : 0.8} opacity={0.78} />
              ))}
            </g>

            {/* Optic disc */}
            <ellipse cx={cx+28} cy={cy} rx={22} ry={28} fill={redFree ? '#A0A0A0' : cfg.disc} opacity="0.95" />
            {cfg.cup && (
              <ellipse cx={cx+28} cy={cy}
                rx={fType === 'glaucoma' ? 18 : 9}
                ry={fType === 'glaucoma' ? 24 : 13}
                fill={redFree ? '#D0D0D0' : cfg.cup} opacity="0.8" />
            )}

            {/* Macula */}
            <g>
              <circle cx={cx-36} cy={cy+4} r="28" fill="rgba(0,0,0,0.35)" />
              <circle cx={cx-36} cy={cy+4} r="5" fill={redFree ? '#3a3a3a' : '#8B5A00'} opacity="0.6" />
              <circle cx={cx-35} cy={cy+3} r="1.8" fill="white" opacity="0.4" />
            </g>

            {/* Pathology overlays — borrow logic from FundoscopyView */}
            {fType === 'crvo' && (
              <g opacity="0.85">
                {[
                  [cx+50,cy-40,15,25,-20],[cx+20,cy-60,12,22,10],[cx-20,cy-50,10,20,5],
                  [cx+60,cy+20,14,22,15],[cx+30,cy+50,12,24,-10],[cx-10,cy+60,10,20,-5],
                  [cx-40,cy+30,11,21,8],[cx+80,cy-10,9,18,20],[cx+70,cy+50,8,16,-15],
                  [cx-40,cy-20,9,18,0],
                ].map(([x,y,rx,ry,rot],i) => (
                  <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry}
                    fill={redFree ? '#1a1a1a' : '#8B0000'} opacity="0.65"
                    transform={`rotate(${rot},${x},${y})`} />
                ))}
              </g>
            )}
            {fType === 'retinal-detachment' && (
              <g opacity="0.8">
                <path d={`M${cx-60},${cy+60} C${cx-20},${cy+20} ${cx+20},${cy+30} ${cx+60},${cy+80}`}
                  fill="rgba(180,190,200,0.65)" stroke="rgba(150,160,170,0.8)" strokeWidth="1.5" />
                <path d={`M${cx-60},${cy+60} C${cx-40},${cy+90} ${cx+20},${cy+95} ${cx+60},${cy+80}`}
                  fill="rgba(180,190,200,0.65)" />
                <ellipse cx={cx+30} cy={cy+55} rx="8" ry="6" fill="rgba(200,100,50,0.8)" />
              </g>
            )}
            {fType === 'glaucoma' && (
              <ellipse cx={cx+28} cy={cy} rx="18" ry="24" fill="#F0DFB0" opacity="0.9" />
            )}
            {fType === 'uveitis' && (
              <circle cx={cx} cy={cy} r={baseR * 1.6} fill="rgba(255,255,220,0.22)" />
            )}
            {fType === 'optic-neuritis' && (
              <g>
                <ellipse cx={cx+28} cy={cy} rx="28" ry="34" fill="#FFF8DC" opacity="0.55" />
                <ellipse cx={cx+28} cy={cy} rx="25" ry="31" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7" />
              </g>
            )}
            {fType === 'diabetic' && (
              <g>
                {[
                  [cx-10,cy+20,3],[cx+40,cy+30,2.5],[cx-30,cy+40,3.5],
                  [cx+20,cy-30,2],[cx-50,cy+10,2.5],[cx+60,cy+10,2],
                  [cx-20,cy-40,3],[cx+50,cy-30,2],[cx-40,cy+60,2.5],
                  [cx+10,cy+50,3],[cx-60,cy-10,2],[cx+70,cy+40,2],
                ].map(([x,y,r],i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill={redFree ? '#1a1a1a' : '#8B0000'} opacity="0.75" />
                ))}
                {[[cx-15,cy+35,4],[cx+35,cy+20,3.5],[cx-40,cy+25,3]].map(([x,y,r],i) => (
                  <circle key={`ex-${i}`} cx={x} cy={y} r={r} fill={redFree ? 'rgba(200,200,200,0.7)' : 'rgba(255,255,180,0.7)'} />
                ))}
              </g>
            )}
          </g>

          {/* Vignette */}
          <circle cx={cx} cy={cy} r={viewR} fill="url(#vignV2)" />
        </g>

        {/* Eyepiece ring */}
        <circle cx={cx} cy={cy} r={viewR} fill="none" stroke="#1a1a1a" strokeWidth="6" />

        {/* HUD */}
        <text x={20} y={26} fill="#5BFF7F" fontFamily="monospace" fontSize="10" opacity="0.7">
          {mode.toUpperCase()} · {zoom.toFixed(2)}x · {region}
        </text>
        {redFree && <text x={size - 80} y={26} fill="#5BFF7F" fontFamily="monospace" fontSize="10" opacity="0.7">RED-FREE</text>}
        {mode === 'indirect' && <text x={size - 90} y={size - 14} fill="#5BFF7F" fontFamily="monospace" fontSize="9" opacity="0.7">⚠ INVERTED</text>}
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// OCT B-SCAN
// ══════════════════════════════════════════════════════════
const OCTStation = ({ findings, ext, onComplete, onLog }) => {
  const [scanPos, setScanPos] = React.useState(50); // 0–100 horizontal scan
  const [eye, setEye] = React.useState(ext.affectedEye === 'OS' ? 'OS' : 'OD');
  const [acquired, setAcquired] = React.useState({ OD: false, OS: false });

  const octType = findings.oct || ext.oct || null;

  const acquire = (e) => {
    setEye(e);
    setAcquired(prev => ({ ...prev, [e]: true }));
    onLog(`OCT ${e}: ${octType ? OCT_PATTERNS[octType]?.label : 'No abnormality'}`);
  };

  React.useEffect(() => {
    if (acquired.OD && acquired.OS) onComplete();
  }, [acquired, onComplete]);

  const showAbnormal = acquired[eye] && (eye === ext.affectedEye || ext.affectedEye === 'OU');
  const pattern = showAbnormal && octType ? OCT_PATTERNS[octType] : OCT_PATTERNS.normal;

  return (
    <div>
      <SectionIntro icon="📈" title="Optical Coherence Tomography (OCT)"
        sub="Non-invasive cross-sectional imaging of retina. Shows layer-by-layer structure of macula or optic nerve head." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {['OD','OS'].map(e => (
          <Btn key={e} variant={eye === e && acquired[e] ? 'primary' : 'secondary'} size="sm" onClick={() => acquire(e)}>
            {acquired[e] ? '✓ ' : '📈 '}Acquire {e}
          </Btn>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <InstrumentFrame title={`OCT B-scan · ${eye} · ${pattern.label}`} dark style={{ flex: 1, minWidth: 480 }}>
          <div style={{ padding: 0, background: '#000814' }}>
            <OCTBScan abnormality={pattern.abnormality} scanPos={scanPos} acquired={acquired[eye]} />
          </div>
        </InstrumentFrame>

        <InstrumentFrame title="Scan Position" style={{ width: 280 }}>
          <div style={{ padding: 14 }}>
            {/* En-face preview with scan line */}
            <div style={{
              position: 'relative', borderRadius: 10, overflow: 'hidden',
              background: 'radial-gradient(circle, #C44B1A 0%, #5A2010 100%)', aspectRatio: '1', marginBottom: 12,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: `${scanPos}%`, bottom: 0,
                width: 2, background: '#5BFF7F', boxShadow: '0 0 8px #5BFF7F',
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 28, height: 28, borderRadius: '50%', background: '#F5DEB3', opacity: 0.8,
              }} />
            </div>
            <input type="range" min="0" max="100" value={scanPos}
              onChange={e => setScanPos(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
            <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 4 }}>
              Drag to move scan position
            </div>
          </div>
        </InstrumentFrame>
      </div>

      {/* Auto-reveal hidden — student transcribes from B-scan visual (OSCE_RUBRIC §H) */}
      {acquired[eye] && (
        <div className="ab" style={{ marginTop: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-2)', textAlign: 'center', fontStyle: 'italic' }}>
          👀 Amati B-scan OCT di atas. Catat ketebalan & abnormalitas yang Anda lihat di Logbook (di bawah).
        </div>
      )}
    </div>
  );
};

// OCT B-scan visualization
const OCTBScan = ({ abnormality, scanPos, acquired }) => {
  const W = 580, H = 280;
  // Retinal layers — each is a polygon-like curve
  const baseY = H * 0.55;

  // Foveal depression
  const fovX = W * 0.5;
  const fovWidth = 80;
  const fovDepth = abnormality === 'cme' || abnormality === 'dme' ? 0 : 22;

  const layerPath = (yOffset, thickness, distortion = 'normal') => {
    const pts = [];
    for (let x = 0; x <= W; x += 8) {
      const distFromFovea = Math.abs(x - fovX);
      let y = baseY + yOffset;
      // Foveal pit
      if (distFromFovea < fovWidth) {
        y -= fovDepth * (1 - distFromFovea / fovWidth) ** 2 * (yOffset < 0 ? -0.3 : 1);
      }
      // Disturbance
      if (distortion === 'cme' && distFromFovea < 150) {
        const wobble = Math.sin(x * 0.1) * 8 + Math.sin(x * 0.04) * 4;
        y += wobble * (yOffset < -10 ? 0 : 1);
      }
      if (distortion === 'rd') {
        if (x > W * 0.55 && yOffset > -30) y -= 35; // detachment
      }
      if (distortion === 'onh-swelling' && distFromFovea < 100) {
        y -= 12;
      }
      pts.push([x, y]);
    }
    let d = `M 0 ${H} L ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
    d += ` L ${W} ${H} Z`;
    return d;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="octBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000814" />
          <stop offset="50%" stopColor="#001A30" />
          <stop offset="100%" stopColor="#000814" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#octBg)" />

      {acquired ? (
        <g>
          {/* Vitreous (clear) */}
          {/* Inner Limiting Membrane (ILM) */}
          <path d={layerPath(0, 1, abnormality)} fill="#5BFF7F" opacity="0.85" />
          {/* RNFL */}
          <path d={layerPath(8, 6, abnormality)} fill="#FFE066" opacity="0.7" />
          {/* GCL */}
          <path d={layerPath(15, 6, abnormality)} fill="#FFA040" opacity="0.6" />
          {/* IPL */}
          <path d={layerPath(22, 4, abnormality)} fill="#FF6020" opacity="0.5" />
          {/* INL */}
          <path d={layerPath(28, 5, abnormality)} fill="#FFC080" opacity="0.7" />
          {/* OPL */}
          <path d={layerPath(35, 3, abnormality)} fill="#FF4020" opacity="0.6" />
          {/* ONL */}
          <path d={layerPath(42, 12, abnormality)} fill="#1a4060" opacity="0.7" />
          {/* External Limiting Membrane (ELM) */}
          <path d={layerPath(55, 1, abnormality)} fill="#FFE0A0" opacity="0.8" />
          {/* IS/OS junction (Ellipsoid Zone) */}
          <path d={layerPath(58, 2, abnormality)} fill="#FFFFFF" opacity="0.85" />
          {/* RPE */}
          <path d={layerPath(64, 3, abnormality)} fill="#FF6040" opacity="0.85" />
          {/* Choroid */}
          <path d={layerPath(70, 30, abnormality)} fill="#604030" opacity="0.5" />

          {/* Subretinal fluid for RD */}
          {abnormality === 'rd' && (
            <path d={`M ${W * 0.55} ${baseY - 5} Q ${W * 0.75} ${baseY - 50}, ${W} ${baseY - 5} L ${W} ${baseY + 60} L ${W * 0.55} ${baseY + 30} Z`}
              fill="rgba(20,40,80,0.4)" stroke="rgba(91,255,127,0.6)" strokeWidth="1" />
          )}

          {/* Cystoid spaces (CME / DME) */}
          {(abnormality === 'cme' || abnormality === 'dme') && (
            <g opacity="0.7">
              {[fovX - 30, fovX, fovX + 30, fovX - 60, fovX + 60].map((x, i) => (
                <ellipse key={i} cx={x} cy={baseY + 18 + (i % 2) * 8} rx={12} ry={9}
                  fill="#001A30" stroke="#5BFF7F" strokeWidth="0.5" />
              ))}
            </g>
          )}

          {/* Hyper-reflective dots (hard exudates) */}
          {abnormality === 'dme' && (
            <g>
              {[...Array(8)].map((_, i) => {
                const x = fovX - 80 + i * 22;
                const y = baseY + 24 + Math.sin(i) * 4;
                return <circle key={i} cx={x} cy={y} r="1.8" fill="#FFE066" opacity="0.95" />;
              })}
            </g>
          )}

          {/* Scan position indicator */}
          <line x1={W * scanPos / 100} y1={0} x2={W * scanPos / 100} y2={H}
            stroke="rgba(91,255,127,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />

          {/* HUD */}
          <text x={12} y={20} fill="#5BFF7F" fontFamily="monospace" fontSize="10" opacity="0.7">
            CFT: {abnormality === 'cme' ? '618μm' : abnormality === 'dme' ? '420μm' : '252μm'}
          </text>
          <text x={W - 90} y={20} fill="#5BFF7F" fontFamily="monospace" fontSize="10" opacity="0.7">
            FOVEA · POS {scanPos}%
          </text>
          {/* Scale bar */}
          <line x1={W - 100} y1={H - 18} x2={W - 20} y2={H - 18} stroke="#5BFF7F" strokeWidth="1.5" />
          <text x={W - 60} y={H - 24} textAnchor="middle" fill="#5BFF7F" fontFamily="monospace" fontSize="9">1mm</text>
        </g>
      ) : (
        <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(91,255,127,0.5)" fontFamily="monospace" fontSize="12">
          [ Press Acquire to capture B-scan ]
        </text>
      )}
    </svg>
  );
};

Object.assign(window, {
  FundoscopyStationV2, FundusViewV2, OCTStation, OCTBScan, OCT_PATTERNS,
});
