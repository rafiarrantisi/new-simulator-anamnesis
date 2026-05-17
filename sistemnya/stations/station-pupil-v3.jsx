// ════════════════════════════════════════════════════════════════════
// Pupils + RAPD Station — V3 (Phase 1 MVP)
//
// Procedural flow per reference doc §2:
//   1. Inspeksi awal       — sizes + symmetry + shape (dim room)
//   2. Light reflex        — direct + consensual, both eyes
//   3. Accommodation       — far-to-near focus → constriction + convergence
//   4. Swinging flashlight — alternate 3s/eye → detect RAPD
//   5. Interpretasi & catat
//
// Theme: DARK (room is semi-dark per protocol)
//
// Signature interaction: swinging flashlight beam swings between eyes,
// pupils respond with spring-physics constriction/dilation. If RAPD
// is present, the affected pupil paradoxically DILATES instead of
// constricting when the beam swings to it.
//
// Props:
//   ext (extension)  — ext.pupils.OD/OS/.RAPD
//   onComplete()
//   onLog({ od_size, os_size, rapd, grade })
//
// MIGRATION NOTES:
//   - The animated pupil radius (driven by CSS transition on `r`) maps
//     directly to a Framer Motion `<motion.circle r animate transition>`.
//   - The swinging timer (setInterval) → useAnimate() in Framer Motion
//     for cleaner cleanup + sequencing.
// ════════════════════════════════════════════════════════════════════

const RAPD_GRADES = [
  { value: '1+', label: '1+ · dilatasi awal lambat setelah konstriksi singkat' },
  { value: '2+', label: '2+ · dilatasi setelah konstriksi minimal' },
  { value: '3+', label: '3+ · dilatasi segera tanpa konstriksi awal' },
  { value: '4+', label: '4+ · amaurotic — tidak bereaksi sama sekali' },
];

// ── Animated Pupil ─────────────────────────────────────────────────────
// Renders an iris+pupil. `pupilSize` is in MM (3 = constricted, 6 = dilated).
// CSS transition handles the spring-feeling smooth animation.
const AnimatedEye = ({
  pupilSize = 4,
  irradiated = false,
  size = 160,
  label,
  shape = 'round', // 'round' | 'oval' | 'irregular'
  highlight = false,
}) => {
  const cx = size / 2, cy = size / 2;
  const eyeR = size * 0.42;
  const irisR = size * 0.28;
  const pupilR = (pupilSize / 9) * irisR * 0.95; // 9mm = max dilated to fill iris
  const pupilRx = shape === 'oval' ? pupilR * 1.15 : pupilR;
  const pupilRy = shape === 'oval' ? pupilR * 0.85 : pupilR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        position: 'relative',
        filter: highlight ? 'drop-shadow(0 0 24px rgba(255,224,102,0.4))' : 'none',
        transition: 'filter 0.4s var(--ease-panel)',
      }}>
        <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
          <defs>
            <radialGradient id={`iris-${label}-${pupilSize}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#7B8BD9" />
              <stop offset="55%" stopColor="#4453B8" />
              <stop offset="100%" stopColor="#1F2A7A" />
            </radialGradient>
            <radialGradient id={`sclera-${label}`}>
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="90%" stopColor="#E0E6F0" />
              <stop offset="100%" stopColor="#A8B5D0" />
            </radialGradient>
            <filter id={`glint-${label}`}>
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>

          {/* eye almond shape (sclera) */}
          <path
            d={`M ${cx - eyeR} ${cy}
                Q ${cx} ${cy - eyeR * 0.85} ${cx + eyeR} ${cy}
                Q ${cx} ${cy + eyeR * 0.85} ${cx - eyeR} ${cy} Z`}
            fill={`url(#sclera-${label})`}
            stroke="#1A1D2E"
            strokeWidth="1.5"
          />

          {/* iris */}
          <circle cx={cx} cy={cy} r={irisR} fill={`url(#iris-${label}-${pupilSize})`} />

          {/* iris striations */}
          {[...Array(36)].map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const x1 = cx + Math.cos(a) * irisR * 0.45;
            const y1 = cy + Math.sin(a) * irisR * 0.45;
            const x2 = cx + Math.cos(a) * irisR * 0.95;
            const y2 = cy + Math.sin(a) * irisR * 0.95;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#1F2A7A" strokeWidth="0.6" opacity="0.45" />
            );
          })}

          {/* posterior synechiae (irregular shape) */}
          {shape === 'irregular' && [...Array(3)].map((_, i) => {
            const a = (i / 3) * Math.PI * 2 + 0.5;
            return (
              <circle key={i}
                cx={cx + Math.cos(a) * pupilR * 0.95}
                cy={cy + Math.sin(a) * pupilR * 0.95}
                r="1.6" fill="#1A1D2E" opacity="0.7"
              />
            );
          })}

          {/* pupil — animated radius */}
          <ellipse
            cx={cx} cy={cy}
            rx={pupilRx} ry={pupilRy}
            fill="#000"
            style={{ transition: 'rx 0.4s var(--ease-pop), ry 0.4s var(--ease-pop)' }}
          />

          {/* light reflex glint */}
          {irradiated && (
            <circle cx={cx + pupilR * 0.3} cy={cy - pupilR * 0.3} r={Math.max(2, pupilR * 0.18)}
              fill="#FFE066" filter={`url(#glint-${label})`} opacity="0.9" />
          )}
        </svg>

        {/* beam overlay */}
        {irradiated && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: size * 0.6, height: 3,
            background: 'linear-gradient(90deg, rgba(255,224,102,0.8) 0%, rgba(255,224,102,0) 100%)',
            transform: 'translate(-100%, -50%)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease',
          }} />
        )}
      </div>

      <div style={{ fontSize: 11, color: '#8B95C0', fontWeight: 700, letterSpacing: '0.08em' }}>
        {label} · {pupilSize.toFixed(1)} mm
      </div>
    </div>
  );
};

// ── Dark Room Stage ────────────────────────────────────────────────────
const DarkRoomStage = ({ children, dim = true }) => (
  <div style={{
    background: 'radial-gradient(circle at 50% 30%, rgba(20,20,40,0.6) 0%, #03050C 70%)',
    borderRadius: 18,
    padding: '36px 24px',
    minHeight: 280,
    position: 'relative', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.04)',
  }}>
    {dim && (
      <div style={{
        position: 'absolute', top: 10, right: 14,
        fontSize: 9, color: '#5EE7C9', fontWeight: 700, letterSpacing: '0.08em',
      }}>● SEMI-DARK ROOM · 4–9 MM EXPECTED DILATION</div>
    )}
    {children}
  </div>
);

// ── Main Station ───────────────────────────────────────────────────────
const PupilStationV3 = ({ ext, onComplete, onLog }) => {
  const STEPS = ['Inspeksi', 'Light reflex', 'Accommodation', 'Swinging flashlight', 'Catat hasil'];
  const flow = useStep(STEPS.length);

  // Ground truth from case
  const odBase = ext.pupils?.OD?.size ?? 3.5;
  const osBase = ext.pupils?.OS?.size ?? 3.5;
  const rapdEye = ext.pupils?.RAPD || null; // 'OD' | 'OS' | null
  const osShape = ext.pupils?.OS?.shape || 'round';
  const odShape = ext.pupils?.OD?.shape || 'round';
  const osReactive = ext.pupils?.OS?.reactive || 'brisk';
  const odReactive = ext.pupils?.OD?.reactive || 'brisk';

  // Light reflex state — pupil sizes (mm)
  const [odSize, setOdSize] = React.useState(odBase);
  const [osSize, setOsSize] = React.useState(osBase);
  const [activeBeam, setActiveBeam] = React.useState(null); // 'OD' | 'OS' | null
  const [accommodation, setAccommodation] = React.useState(false);

  // Swinging flashlight state
  const [swingingActive, setSwingingActive] = React.useState(false);
  const [swingBeam, setSwingBeam] = React.useState(null);
  const swingTimerRef = React.useRef(null);

  // Structured input
  const [measuredOD, setMeasuredOD] = React.useState(null);
  const [measuredOS, setMeasuredOS] = React.useState(null);
  const [rapdDetected, setRapdDetected] = React.useState(null); // 'none' | 'OD' | 'OS'
  const [rapdGrade, setRapdGrade] = React.useState(null);
  const [interpretation, setInterpretation] = React.useState(null);

  // ── Helpers: simulate light response ──
  // direct: pupil being illuminated constricts to ~2mm
  // consensual: contralateral pupil also constricts via crossed pathway
  // RAPD: when beam moves TO affected eye, both pupils PARADOXICALLY dilate
  const constrict = (mm) => Math.max(2, mm * 0.45);
  const dilate = (mm) => Math.min(7, mm * 1.35);

  // Apply light reflex (steady-state during step 2)
  const shineLight = (eye) => {
    setActiveBeam(eye);
    if (eye === 'OD') {
      setOdSize(odReactive === 'non-reactive' ? odBase : constrict(odBase));
      setOsSize(osReactive === 'non-reactive' ? osBase : constrict(osBase)); // consensual
    } else if (eye === 'OS') {
      setOsSize(osReactive === 'non-reactive' ? osBase : constrict(osBase));
      setOdSize(odReactive === 'non-reactive' ? odBase : constrict(odBase));
    }
  };
  const releaseLight = () => {
    setActiveBeam(null);
    setOdSize(odBase);
    setOsSize(osBase);
  };

  // Accommodation: both pupils constrict
  const triggerAccommodation = () => {
    setAccommodation(true);
    setOdSize(constrict(odBase));
    setOsSize(constrict(osBase));
    setTimeout(() => {
      setAccommodation(false);
      setOdSize(odBase);
      setOsSize(osBase);
    }, 2200);
  };

  // ── Swinging flashlight loop ──
  React.useEffect(() => {
    if (!swingingActive) {
      if (swingTimerRef.current) clearInterval(swingTimerRef.current);
      setSwingBeam(null);
      setOdSize(odBase); setOsSize(osBase);
      return;
    }
    let toggle = 'OD';
    const tick = () => {
      setSwingBeam(toggle);
      // Healthy eye → both constrict
      // Affected eye (RAPD): when beam reaches IT, both DILATE (relative afferent defect)
      if (toggle === rapdEye) {
        // both dilate paradoxically
        setOdSize(dilate(odBase));
        setOsSize(dilate(osBase));
      } else {
        // both constrict
        setOdSize(constrict(odBase));
        setOsSize(constrict(osBase));
      }
      toggle = toggle === 'OD' ? 'OS' : 'OD';
    };
    tick(); // immediate
    swingTimerRef.current = setInterval(tick, 1800); // ~2s per eye (close to clinical 3s)
    return () => {
      if (swingTimerRef.current) clearInterval(swingTimerRef.current);
    };
  }, [swingingActive, rapdEye, odBase, osBase]);

  const canComplete = measuredOD != null && measuredOS != null && rapdDetected != null;

  const summary = canComplete
    ? `OD ${measuredOD}mm · OS ${measuredOS}mm · ${rapdDetected === 'none' ? 'No RAPD' : `RAPD positive ${rapdDetected}${rapdGrade ? ` (${rapdGrade})` : ''}`}`
    : 'Selesaikan inspeksi, light reflex, dan swinging flashlight test.';

  const handleComplete = () => {
    onLog && onLog({
      type: 'pupil', OD: measuredOD, OS: measuredOS,
      rapd: rapdDetected, grade: rapdGrade, interpretation,
    });
    onComplete && onComplete();
  };

  // ── Step bodies ──
  const renderStep = () => {
    switch (flow.step) {
      case 0:
        return (
          <div>
            <StationIntro
              theme="dark"
              icon="🔍"
              title="Inspeksi awal pupil"
              body="Ruangan semi-gelap. Minta pasien fiksasi ke objek jauh (cegah near response). Amati ukuran, simetri, dan bentuk pupil SEBELUM menyinari."
            />

            <DarkRoomStage>
              <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
                <AnimatedEye pupilSize={odBase} label="OD" shape={odShape} />
                <AnimatedEye pupilSize={osBase} label="OS" shape={osShape} />
              </div>
            </DarkRoomStage>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <StructuredField label="Diameter OD (mm)" theme="dark">
                <StructuredNumber theme="dark" value={measuredOD} onChange={setMeasuredOD} min={1} max={9} unit="mm" placeholder={odBase.toString()} />
              </StructuredField>
              <StructuredField label="Diameter OS (mm)" theme="dark">
                <StructuredNumber theme="dark" value={measuredOS} onChange={setMeasuredOS} min={1} max={9} unit="mm" placeholder={osBase.toString()} />
              </StructuredField>
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 11, color: '#FCD34D' }}>
              <strong>Tip klinis:</strong> Anisocoria signifikan jika selisih ≥ 1 mm.
              {Math.abs(odBase - osBase) >= 1 && ' ⚠ Selisih signifikan terdeteksi.'}
              {(odShape === 'irregular' || osShape === 'irregular') && ' ⚠ Bentuk irregular — pikirkan synechiae.'}
              {(odShape === 'oval' || osShape === 'oval') && ' ⚠ Bentuk oval (mid-dilated fixed) — pikirkan acute angle closure.'}
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" tone="primary" active disabled={!measuredOD || !measuredOS} onClick={flow.next}>
                Lanjut: Light reflex →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 1:
        return (
          <div>
            <StationIntro
              theme="dark"
              icon="🔦"
              title="Light reflex — direct & consensual"
              body="Sinari satu mata, amati DIRECT response (mata yang disinari) dan CONSENSUAL response (mata sebelahnya). Keduanya harus konstriksi karena jalur eferen bilateral."
            />

            <DarkRoomStage>
              <div style={{ display: 'flex', gap: 60, justifyContent: 'center', alignItems: 'center' }}>
                <AnimatedEye pupilSize={odSize} label="OD" shape={odShape} irradiated={activeBeam === 'OD'} highlight={activeBeam === 'OD'} />
                <AnimatedEye pupilSize={osSize} label="OS" shape={osShape} irradiated={activeBeam === 'OS'} highlight={activeBeam === 'OS'} />
              </div>

              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 10 }}>
                <InstrumentButton theme="dark" tone="amber" icon="🔦" active={activeBeam === 'OD'}
                  onClick={() => activeBeam === 'OD' ? releaseLight() : shineLight('OD')}>
                  {activeBeam === 'OD' ? 'Matikan' : 'Sinari OD'}
                </InstrumentButton>
                <InstrumentButton theme="dark" tone="amber" icon="🔦" active={activeBeam === 'OS'}
                  onClick={() => activeBeam === 'OS' ? releaseLight() : shineLight('OS')}>
                  {activeBeam === 'OS' ? 'Matikan' : 'Sinari OS'}
                </InstrumentButton>
              </div>
            </DarkRoomStage>

            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11, color: '#C0CAEC',
            }}>
              {activeBeam && (
                <>
                  Beam pada <strong style={{ color: '#FFE066' }}>{activeBeam}</strong>:
                  {' '}direct {activeBeam === 'OD' ? odReactive : osReactive} ·
                  {' '}consensual {activeBeam === 'OD' ? osReactive : odReactive}.
                </>
              )}
              {!activeBeam && 'Tekan tombol untuk menyinari mata. Amati kedua pupil secara simultan.'}
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(0)}>← Inspeksi</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active onClick={flow.next}>
                Lanjut: Accommodation →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 2:
        return (
          <div>
            <StationIntro
              theme="dark"
              icon="◯→·"
              title="Accommodation reflex"
              body="Minta pasien lihat jauh (objek distansial) → lalu fokus ke jari pemeriksa yang dekat. Pupil harus konstriksi + mata konvergen. Penting: bila light reflex (−) tapi accommodation (+) → Argyll Robertson pupil."
            />

            <DarkRoomStage>
              <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>
                <AnimatedEye pupilSize={odSize} label="OD" shape={odShape} />
                <AnimatedEye pupilSize={osSize} label="OS" shape={osShape} />
              </div>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <InstrumentButton theme="dark" tone="primary" active={accommodation} onClick={triggerAccommodation}>
                  ▶ Trigger near focus (3 detik)
                </InstrumentButton>
                {accommodation && (
                  <div className="ab" style={{ marginTop: 12, color: '#5EE7C9', fontSize: 12, fontWeight: 700 }}>
                    ● Pasien fokus dekat — kedua pupil konstriksi + konvergen
                  </div>
                )}
              </div>
            </DarkRoomStage>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(1)}>← Light reflex</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active onClick={flow.next}>
                Lanjut: Swinging flashlight →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 3:
        return (
          <div>
            <StationIntro
              theme="dark"
              icon="↔"
              title="Swinging flashlight test (RAPD)"
              body="Ayunkan torch antara kedua mata, ~3 detik per mata. Amati pupil pada saat beam BARU TIBA. Jika BERDILATASI (bukan konstriksi) → RAPD positif pada mata tersebut = lesi aferen (nervus optikus / retina)."
            />

            <DarkRoomStage>
              <div style={{ display: 'flex', gap: 60, justifyContent: 'center', alignItems: 'center' }}>
                <AnimatedEye pupilSize={odSize} label="OD" shape={odShape} irradiated={swingBeam === 'OD'} highlight={swingBeam === 'OD'} />

                {swingingActive && (
                  <div style={{
                    fontSize: 22, color: '#FFE066',
                    transform: swingBeam === 'OD' ? 'translateX(-30px)' : 'translateX(30px)',
                    transition: 'transform 0.9s var(--ease-panel)',
                    opacity: 0.7,
                  }}>↔</div>
                )}

                <AnimatedEye pupilSize={osSize} label="OS" shape={osShape} irradiated={swingBeam === 'OS'} highlight={swingBeam === 'OS'} />
              </div>

              <div style={{ marginTop: 22, textAlign: 'center' }}>
                <InstrumentButton theme="dark" tone={swingingActive ? 'danger' : 'amber'} active onClick={() => setSwingingActive(s => !s)}>
                  {swingingActive ? '■ Stop swinging' : '▶ Mulai swinging flashlight'}
                </InstrumentButton>
              </div>

              {swingingActive && (
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11, color: '#C0CAEC', textAlign: 'center', maxWidth: 420, margin: '16px auto 0',
                }}>
                  Beam aktif: <strong style={{ color: '#FFE066' }}>{swingBeam}</strong>.
                  Amati pupil pada saat <em>transisi</em> beam.
                  {swingBeam === rapdEye && (
                    <div style={{ marginTop: 6, color: '#FB7185', fontWeight: 700 }}>
                      ⚠ Kedua pupil DILATASI — pola RAPD pada {rapdEye}
                    </div>
                  )}
                </div>
              )}
            </DarkRoomStage>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <StructuredField label="RAPD detected?" theme="dark" required>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <InstrumentButton size="sm" theme="dark" tone="success" active={rapdDetected === 'none'} onClick={() => setRapdDetected('none')}>
                    Tidak ada
                  </InstrumentButton>
                  <InstrumentButton size="sm" theme="dark" tone="danger" active={rapdDetected === 'OD'} onClick={() => setRapdDetected('OD')}>
                    Positif OD
                  </InstrumentButton>
                  <InstrumentButton size="sm" theme="dark" tone="danger" active={rapdDetected === 'OS'} onClick={() => setRapdDetected('OS')}>
                    Positif OS
                  </InstrumentButton>
                </div>
              </StructuredField>
              {rapdDetected && rapdDetected !== 'none' && (
                <StructuredField label="Grade" theme="dark">
                  <StructuredSelect theme="dark" value={rapdGrade} onChange={setRapdGrade} options={RAPD_GRADES} />
                </StructuredField>
              )}
            </div>

            <StationControls theme="dark" style={{ marginTop: 14 }}>
              <InstrumentButton theme="dark" onClick={() => flow.goto(2)}>← Accommodation</InstrumentButton>
              <InstrumentButton theme="dark" tone="primary" active disabled={!rapdDetected} onClick={flow.next}>
                Lanjut: Catat hasil →
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 4:
        return (
          <div>
            <StationIntro
              theme="dark"
              icon="📋"
              title="Interpretasi & catat"
              body="Rangkum temuan pupil dan kaitkan dengan kemungkinan lokasi lesi."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <DarkResultCard label="Pupil OD" value={`${measuredOD || '—'} mm`} sub={odReactive} />
              <DarkResultCard label="Pupil OS" value={`${measuredOS || '—'} mm`} sub={osReactive} />
            </div>

            <div style={{
              padding: 14, borderRadius: 12,
              background: rapdDetected === 'none' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${rapdDetected === 'none' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: rapdDetected === 'none' ? '#5EE7C9' : '#FB7185', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {rapdDetected === 'none' ? '✓ No RAPD' : `🚨 RAPD positif ${rapdDetected}${rapdGrade ? ` · grade ${rapdGrade}` : ''}`}
              </div>
              <div style={{ fontSize: 11, color: '#C0CAEC', lineHeight: 1.5 }}>
                {rapdDetected === 'none'
                  ? 'Jalur aferen utuh bilateral. Tidak ada lesi asimetris pada nervus optikus atau retina.'
                  : `Indikasi lesi aferen asimetris di mata ${rapdDetected}. DDx: optic neuritis, optic nerve compression, ablasio retina luas, CRAO/CRVO, amblyopia berat.`}
              </div>
            </div>

            <StructuredField label="Interpretasi (opsional)" theme="dark" hint="Kesimpulan klinis singkat — akan masuk ke logbook">
              <StructuredSelect theme="dark" value={interpretation} onChange={setInterpretation} options={[
                { value: 'normal', label: 'Normal — PERRL, no RAPD' },
                { value: 'rapd', label: 'RAPD — afferent defect' },
                { value: 'argyll', label: 'Argyll Robertson — light(−), accomm(+)' },
                { value: 'horner', label: 'Horner — miosis + ptosis' },
                { value: 'cn3', label: 'CN III palsy — midriasis + ptosis + EOM limit' },
                { value: 'aacg', label: 'Acute angle closure — mid-dilated fixed oval' },
                { value: 'pharm', label: 'Pharmacologic mydriasis' },
              ]} />
            </StructuredField>
          </div>
        );

      default: return null;
    }
  };

  return (
    <StationShell theme="dark" icon="🔦" title="Pupils + RAPD" subtitle="Reflex pupil, akomodasi & swinging flashlight test">
      <StepLadder theme="dark" steps={STEPS} current={flow.step} done={flow.done} onJump={flow.goto} />
      {renderStep()}
      <StationFooter
        theme="dark"
        onComplete={handleComplete}
        canComplete={canComplete}
        summary={summary}
      />
    </StationShell>
  );
};

const DarkResultCard = ({ label, value, sub }) => (
  <div style={{
    padding: '14px 16px', borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }}>
    <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: '#FFE066', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#5EE7C9', marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </div>
);

Object.assign(window, { PupilStationV3 });
