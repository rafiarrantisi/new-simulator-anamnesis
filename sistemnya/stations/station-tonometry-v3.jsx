// ════════════════════════════════════════════════════════════════════
// Tonometry (IOP) Station — V3 (Phase 1 MVP)
//
// Procedural flow per reference doc §9:
//   1. Setup        — anestesi topikal + fluorescein
//   2. Pendekatan   — slit lamp + cobalt-blue filter, probe approach
//   3. Aplanasi     — align two semicircular mires (Goldmann)
//   4. Baca dial    — kalibrasi × 10 = IOP mmHg
//   5. Catat hasil  — interpretation
//
// Theme: LIGHT outer shell + DARK cobalt-blue inset for the slit-lamp
// view (this is the classic Goldmann visual — semicircular fluorescein
// mires under blue filter).
//
// Signature interaction: rotate the Goldmann dial → two semicircular
// mires slide horizontally until their INNER edges just touch. The
// correct dial reading × 10 = IOP.
//
// Props:
//   findings  — findings.IOP.OD/OS strings (e.g. "16 mmHg")
//   onComplete()
//   onLog({ od_iop, os_iop })
//
// MIGRATION NOTES:
//   - The mire alignment animation is a single `transform: translateX`
//     driven by `dialValue` state — maps trivially to Framer Motion.
//   - DialKnob component is reusable from shell — already designed to
//     drop into a Tailwind-themed shell.
// ════════════════════════════════════════════════════════════════════

// ── Goldmann Mires View ────────────────────────────────────────────────
// Two fluorescein-stained semicircular meniski. The INNER edges should
// just touch when correctly aligned. Misalignment shows them either:
//   - overlapping (too high force, dial too high)
//   - gap (too low force, dial too low)
const GoldmannMires = ({ dialValue, targetIOP, size = 260 }) => {
  // Convert dial value (0–80) to mires horizontal offset.
  // At dial × 10 == IOP, mires should perfectly touch (offset 0).
  const indicatedIOP = dialValue;
  const offset = (indicatedIOP - targetIOP) * 1.8; // pixels — negative = gap, positive = overlap

  // Aligned tolerance: within ±1 mmHg
  const aligned = Math.abs(indicatedIOP - targetIOP) <= 1;

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: '50%', overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #0F1F4F 0%, #050A24 75%)',
      border: '6px solid #0a0a14',
      boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6), 0 8px 28px rgba(0,0,0,0.5)',
      margin: '0 auto',
    }}>
      {/* Cobalt-blue wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(33,80,255,0.20) 0%, rgba(0,15,80,0.55) 70%)',
        mixBlendMode: 'screen',
      }} />

      {/* Cornea outline */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: size * 0.7, height: size * 0.7,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        border: '1px solid rgba(140,200,255,0.15)',
        boxShadow: 'inset 0 0 30px rgba(60,120,255,0.2)',
      }} />

      {/* Upper mire (semicircle, top half) */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="mireGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7DFFB4" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#34D399" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.7" />
          </radialGradient>
          <filter id="mireBloom">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Upper half (drifts LEFT as dial increases above target) */}
        <g style={{
          transform: `translateX(${-offset}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.18s var(--ease-panel)',
        }}>
          <path
            d={`M ${size * 0.18} ${size * 0.5}
                A ${size * 0.18} ${size * 0.18} 0 0 1 ${size * 0.54} ${size * 0.5}
                L ${size * 0.18} ${size * 0.5} Z`}
            fill="url(#mireGlow)"
            filter="url(#mireBloom)"
            opacity="0.92"
          />
        </g>

        {/* Lower half (drifts RIGHT) */}
        <g style={{
          transform: `translateX(${offset}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.18s var(--ease-panel)',
        }}>
          <path
            d={`M ${size * 0.46} ${size * 0.5}
                A ${size * 0.18} ${size * 0.18} 0 0 0 ${size * 0.82} ${size * 0.5}
                L ${size * 0.46} ${size * 0.5} Z`}
            fill="url(#mireGlow)"
            filter="url(#mireBloom)"
            opacity="0.92"
          />
        </g>

        {/* Center crosshair */}
        <line x1={size * 0.5} y1={size * 0.42} x2={size * 0.5} y2={size * 0.58}
          stroke="rgba(140,200,255,0.25)" strokeWidth="1" />
        <line x1={size * 0.42} y1={size * 0.5} x2={size * 0.58} y2={size * 0.5}
          stroke="rgba(140,200,255,0.25)" strokeWidth="1" />
      </svg>

      {/* Status overlay */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        padding: '4px 12px', borderRadius: 8,
        background: aligned ? 'rgba(52,211,153,0.25)' : 'rgba(0,0,0,0.45)',
        border: `1px solid ${aligned ? '#34D399' : 'rgba(255,255,255,0.08)'}`,
        fontSize: 10, fontWeight: 700, color: aligned ? '#5EE7C9' : '#A4B0FF',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {aligned ? '✓ Aligned' : Math.abs(offset) > 25 ? offset > 0 ? 'Overlap → reduce dial' : 'Gap → increase dial' : 'Almost…'}
      </div>

      {/* Cobalt-blue label */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        fontSize: 9, color: '#7DC4FF', fontWeight: 700, letterSpacing: '0.07em',
      }}>● COBALT BLUE</div>
    </div>
  );
};

// ── Probe Approach Visual ──────────────────────────────────────────────
const ProbeApproach = ({ approached, contacted }) => (
  <div style={{
    width: 200, height: 200, position: 'relative',
    margin: '0 auto',
  }}>
    {/* Eye (frontal view) */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 140, height: 140, borderRadius: '50%',
      background: 'radial-gradient(circle at 55% 45%, #fff 0 18%, #5865F2 18% 36%, #1A1D2E 36% 48%, #fff 48%)',
      border: '2px solid #1A1D2E',
    }} />

    {/* Yellow fluorescein tint */}
    {contacted && (
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 140, height: 140, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, rgba(255,240,100,0.4) 0%, rgba(255,240,100,0.1) 60%, transparent 80%)',
        pointerEvents: 'none',
        animation: 'fadeIn 0.5s var(--ease-panel)',
      }} />
    )}

    {/* Probe (slides in from right) */}
    <div style={{
      position: 'absolute', top: '50%', right: contacted ? 70 : approached ? 100 : 200,
      transform: 'translateY(-50%)',
      width: 80, height: 8, background: 'linear-gradient(90deg, #8B95C0 0%, #C0CAEC 100%)',
      borderRadius: 3,
      transition: 'right 0.6s var(--ease-panel)',
    }}>
      <div style={{
        position: 'absolute', left: -10, top: -8, width: 22, height: 24,
        background: 'rgba(180,220,255,0.4)',
        borderRadius: '50%',
        border: '1px solid rgba(180,220,255,0.6)',
      }} />
    </div>
  </div>
);

// ── Main Station ───────────────────────────────────────────────────────
const TonometryStationV3 = ({ findings, onComplete, onLog }) => {
  const STEPS = ['Setup', 'Pendekatan probe', 'Aplanasi (mires)', 'Catat hasil'];
  const flow = useStep(STEPS.length);

  // Ground truth
  const targetIOPOD = parseIOPNum(findings.IOP?.OD) || 14;
  const targetIOPOS = parseIOPNum(findings.IOP?.OS) || 14;

  const [activeEye, setActiveEye] = React.useState('OD');
  const [setupDone, setSetupDone] = React.useState({ anesthetic: false, fluorescein: false, filter: false });
  const [probeState, setProbeState] = React.useState('idle'); // idle | approaching | contact
  const [dialOD, setDialOD] = React.useState(10);
  const [dialOS, setDialOS] = React.useState(10);
  const [recordedOD, setRecordedOD] = React.useState(null);
  const [recordedOS, setRecordedOS] = React.useState(null);

  const dial = activeEye === 'OD' ? dialOD : dialOS;
  const setDial = activeEye === 'OD' ? setDialOD : setDialOS;
  const targetIOP = activeEye === 'OD' ? targetIOPOD : targetIOPOS;
  const aligned = Math.abs(dial - targetIOP) <= 1;
  const measuredIOP = dial; // dial reading IS the IOP value (× 10 already conventionally)

  // ── Auto-advance probe ──
  const beginAproach = () => {
    setProbeState('approaching');
    setTimeout(() => setProbeState('contact'), 800);
  };

  const recordReading = () => {
    if (activeEye === 'OD') {
      setRecordedOD(measuredIOP);
      // auto-switch to OS
      setActiveEye('OS');
      setProbeState('idle');
      setDialOS(10);
    } else {
      setRecordedOS(measuredIOP);
      flow.next();
    }
  };

  const canComplete = recordedOD != null && recordedOS != null;

  const summary = canComplete
    ? `OD ${recordedOD} mmHg · OS ${recordedOS} mmHg · ${interpretIOP(recordedOD, recordedOS)}`
    : 'Selesaikan pengukuran kedua mata.';

  const handleComplete = () => {
    onLog && onLog({ type: 'iop', OD: recordedOD, OS: recordedOS });
    onComplete && onComplete();
  };

  const renderStep = () => {
    switch (flow.step) {
      case 0:
        return (
          <div>
            <StationIntro
              icon="💧"
              title="Persiapan pasien"
              body="Goldmann applanation tonometry adalah baku emas. Butuh anestesi topikal, fluorescein, dan slit lamp dengan filter cobalt-blue."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              <SetupToggle
                icon="💧" label="1. Anestesi topikal"
                desc="Proxymetacaine 0.5% — 1 tetes"
                done={setupDone.anesthetic}
                onClick={() => setSetupDone(s => ({ ...s, anesthetic: true }))}
              />
              <SetupToggle
                icon="🟢" label="2. Fluorescein"
                desc="Strip atau Minims — sentuh konjungtiva inferior"
                done={setupDone.fluorescein}
                onClick={() => setSetupDone(s => ({ ...s, fluorescein: true }))}
              />
              <SetupToggle
                icon="🔵" label="3. Cobalt-blue filter"
                desc="Aktifkan filter biru pada slit lamp"
                done={setupDone.filter}
                onClick={() => setSetupDone(s => ({ ...s, filter: true }))}
              />
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5,
            }}>
              <strong>Tip klinis:</strong> Pasien duduk pada slit lamp, dahi ditekan ke headband.
              Probe Goldmann disterilkan. Atur dial awal ke ~10.
            </div>

            <StationControls style={{ marginTop: 14 }}>
              <InstrumentButton tone="primary" active
                disabled={!Object.values(setupDone).every(Boolean)}
                onClick={flow.next}>
                Lanjut: Approach probe →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 1:
        return (
          <div>
            <StationIntro
              icon="·→👁"
              title={`Pendekatan probe ke kornea — ${activeEye}`}
              body={`Dekati mata ${activeEye} dari sisi temporal (±45°). Sentuhkan probe ke kornea sentral. Anda akan melihat dua meniski semilingkar berwarna hijau-fluoresensi melalui eyepiece.`}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
              <ProbeApproach
                approached={probeState !== 'idle'}
                contacted={probeState === 'contact'}
              />
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <InstrumentButton size="sm" active={activeEye === 'OD'} onClick={() => { setActiveEye('OD'); setProbeState('idle'); }}>
                    Mata OD
                  </InstrumentButton>
                  <InstrumentButton size="sm" active={activeEye === 'OS'} onClick={() => { setActiveEye('OS'); setProbeState('idle'); }}>
                    Mata OS
                  </InstrumentButton>
                </div>
                <InstrumentButton tone="primary" active={probeState !== 'idle'} disabled={probeState !== 'idle'} onClick={beginAproach}>
                  {probeState === 'idle' ? '▶ Dekati kornea' : probeState === 'approaching' ? 'Mendekati…' : '● Probe kontak'}
                </InstrumentButton>
                {probeState === 'contact' && (
                  <div className="ab" style={{
                    marginTop: 12, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--green-l)', color: 'var(--green)', fontSize: 11, fontWeight: 700,
                  }}>
                    ✓ Kontak dengan kornea — lanjutkan ke aplanasi
                  </div>
                )}
              </div>
            </div>

            <StationControls style={{ marginTop: 14 }}>
              <InstrumentButton onClick={() => flow.goto(0)}>← Setup</InstrumentButton>
              <InstrumentButton tone="primary" active disabled={probeState !== 'contact'} onClick={flow.next}>
                Lanjut: Aplanasi mires →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 2:
        return (
          <div>
            <StationIntro
              icon="◐ ◑"
              title={`Aplanasi — align mires (${activeEye})`}
              body="Putar dial Goldmann. Anda akan melihat dua meniski semilingkar bergeser. Tujuannya: tepi DALAM kedua semilingkar tepat bersentuhan. Angka dial pada titik itu = IOP (mmHg)."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'center' }}>
              <GoldmannMires dialValue={dial} targetIOP={targetIOP} size={300} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <DialKnob
                  value={dial}
                  min={0}
                  max={80}
                  step={0.5}
                  onChange={setDial}
                  size={120}
                  label="GOLDMANN DIAL"
                />

                <div style={{
                  padding: '8px 14px', borderRadius: 10,
                  background: aligned ? 'var(--green-l)' : 'var(--surface-2)',
                  border: `1px solid ${aligned ? 'var(--green)35' : 'var(--border)'}`,
                  textAlign: 'center',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                    Reading
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 800,
                    color: aligned ? 'var(--green)' : 'var(--text-1)',
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                  }}>
                    {dial.toFixed(1)} <span style={{ fontSize: 12 }}>mmHg</span>
                  </div>
                </div>

                {aligned && (
                  <InstrumentButton tone="success" active onClick={recordReading} size="md">
                    ✓ Catat & {activeEye === 'OD' ? 'lanjut OS' : 'selesai'}
                  </InstrumentButton>
                )}
              </div>
            </div>

            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-2)',
            }}>
              <strong>Tip:</strong> Drag dial ke atas (naik) atau bawah (turun). Boleh juga scroll mouse. Hasil ±1 mmHg dianggap aligned.
              {' '}{recordedOD != null && <span style={{ color: 'var(--green)' }}>· OD sudah tercatat: {recordedOD} mmHg.</span>}
            </div>

            <StationControls style={{ marginTop: 14 }}>
              <InstrumentButton onClick={() => flow.goto(1)}>← Probe</InstrumentButton>
              {recordedOD != null && recordedOS != null && (
                <InstrumentButton tone="primary" active onClick={flow.next}>
                  Lanjut: Catat hasil →
                </InstrumentButton>
              )}
            </StationControls>
          </div>
        );

      case 3:
        return (
          <div>
            <StationIntro
              icon="📋"
              title="Hasil & interpretasi"
              body="Kedua mata telah diukur. Verifikasi nilai dan interpretasi klinis."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <ResultCardLight label="IOP OD" value={recordedOD != null ? `${recordedOD} mmHg` : '—'} tone={iopTone(recordedOD)} />
              <ResultCardLight label="IOP OS" value={recordedOS != null ? `${recordedOS} mmHg` : '—'} tone={iopTone(recordedOS)} />
            </div>

            <div style={{
              padding: 14, borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Interpretasi
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6 }}>
                {interpretIOP(recordedOD, recordedOS)}
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'var(--amber-l)', border: '1px solid var(--amber)25',
              fontSize: 11, color: 'var(--amber-d)', lineHeight: 1.5,
            }}>
              💡 <strong>Ingat:</strong> IOP dipengaruhi central corneal thickness (CCT). Kornea tipis → bacaan lebih rendah; kornea tebal → lebih tinggi. Variasi diurnal normal: pagi lebih tinggi.
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <StationShell theme="light" icon="📊" title="Tonometry (IOP)" subtitle="Goldmann Applanation Tonometry — gold standard">
      <StepLadder steps={STEPS} current={flow.step} done={flow.done} onJump={flow.goto} />
      {renderStep()}
      <StationFooter
        onComplete={handleComplete}
        canComplete={canComplete}
        summary={summary}
      />
    </StationShell>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────
function iopTone(v) {
  if (v == null) return 'neutral';
  if (v < 6) return 'danger';     // hypotony
  if (v <= 21) return 'success';  // normal
  if (v <= 25) return 'amber';    // borderline
  return 'danger';                 // elevated
}

function interpretIOP(od, os) {
  if (od == null || os == null) return 'Lengkapi pengukuran kedua mata.';
  const parts = [];
  const eyes = [{ eye: 'OD', val: od }, { eye: 'OS', val: os }];
  for (const { eye, val } of eyes) {
    if (val < 6)        parts.push(`${eye}: hypotony (< 6) — cari kebocoran/injury.`);
    else if (val <= 21) parts.push(`${eye}: normal (${val} mmHg).`);
    else if (val <= 25) parts.push(`${eye}: borderline (${val}) — investigasi disc + lapang pandang.`);
    else if (val <= 30) parts.push(`${eye}: ⚠ elevated (${val}) — curiga glaukoma.`);
    else if (val <= 40) parts.push(`${eye}: 🚨 markedly elevated (${val}) — urgent management.`);
    else                parts.push(`${eye}: 🚨 ${val} mmHg — possible acute angle closure crisis!`);
  }
  if (Math.abs(od - os) >= 5) parts.push(`Asimetri ${Math.abs(od - os)} mmHg antar mata signifikan.`);
  return parts.join(' ');
}

// ── Small UI helpers ───────────────────────────────────────────────────
const SetupToggle = ({ icon, label, desc, done, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '12px 14px', borderRadius: 12,
    background: done ? 'var(--green-l)' : 'var(--surface)',
    border: `1.5px solid ${done ? 'var(--green)45' : 'var(--border)'}`,
    cursor: 'pointer',
    transition: 'all 0.2s var(--ease-hover)',
    textAlign: 'left',
    fontFamily: 'Poppins',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{done ? '✓' : icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: done ? 'var(--green)' : 'var(--text-1)' }}>{label}</span>
    </div>
    <span style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.45 }}>{desc}</span>
  </button>
);

const ResultCardLight = ({ label, value, tone = 'neutral' }) => {
  const color = tone === 'success' ? 'var(--green)'
              : tone === 'amber'   ? 'var(--amber-d)'
              : tone === 'danger'  ? 'var(--red-d)'
              :                       'var(--primary)';
  const bg = tone === 'success' ? 'var(--green-l)'
           : tone === 'amber'   ? 'var(--amber-l)'
           : tone === 'danger'  ? 'var(--red-l)'
           :                       'var(--surface-2)';
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: bg, border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
};

Object.assign(window, { TonometryStationV3 });
