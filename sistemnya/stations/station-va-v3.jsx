// ════════════════════════════════════════════════════════════════════
// Visual Acuity Station — V3 (Phase 1 MVP)
//
// Procedural flow per reference doc §1:
//   1. Setup        — confirm setup (correction worn, 6m distance)
//   2. Right eye    — occlude OS, reveal Snellen rows progressively
//   3. Pinhole OD   — only if VA < 6/9
//   4. Left eye     — occlude OD, reveal Snellen rows
//   5. Pinhole OS   — only if VA < 6/9
//   6. Record       — structured input + free-text
//
// Theme: LIGHT (chart room is bright per clinical protocol)
//
// Props:
//   findings     → exam ground truth (findings.visualAcuity.OD / OS)
//   onComplete() → called when student presses "Tandai stasiun selesai"
//   onLog(entry) → called per structured finding (e.g. {OD:'6/12', pinhole:true})
//
// MIGRATION NOTES:
//   - Replace SNELLEN_LINES table import → shared constants/snellen.ts
//   - Each <step> body → its own <StepBody> component if it grows
//   - Spring on letter reveal → motion.div initial/animate
// ════════════════════════════════════════════════════════════════════

const VA_LINES = [
  { letters: 'E',              ratio: '6/60', size: 110, denom: 60 },
  { letters: 'F P',            ratio: '6/36', size: 72,  denom: 36 },
  { letters: 'T O Z',          ratio: '6/24', size: 52,  denom: 24 },
  { letters: 'L P E D',        ratio: '6/18', size: 38,  denom: 18 },
  { letters: 'P E C F D',      ratio: '6/12', size: 29,  denom: 12 },
  { letters: 'E D F C Z P',    ratio: '6/9',  size: 22,  denom: 9 },
  { letters: 'F E L O P Z D',  ratio: '6/6',  size: 17,  denom: 6 },
  { letters: 'D E F P O T E C',ratio: '6/5',  size: 14,  denom: 5 },
];

// helper: which line denom does this VA string correspond to?
function vaToDenom(va) {
  if (!va) return null;
  const s = String(va).toLowerCase();
  if (/np?l|hm|cf/.test(s)) return -1; // severe
  const m = s.match(/6\s*\/\s*(\d+)/);
  return m ? parseInt(m[1]) : null;
}

// helper: index in VA_LINES for a given target VA denom
function denomToIndex(denom) {
  if (denom == null) return VA_LINES.length - 1;
  if (denom < 0) return -1;
  for (let i = VA_LINES.length - 1; i >= 0; i--) {
    if (VA_LINES[i].denom <= denom) return i;
  }
  return 0;
}

const VA_OPTIONS = [
  { value: 'NPL',  label: 'NPL — no perception of light' },
  { value: 'PL',   label: 'PL — perception of light' },
  { value: 'HM',   label: 'HM — hand movement' },
  { value: 'CF',   label: 'CF — counting fingers' },
  { value: '6/60', label: '6/60' },
  { value: '6/36', label: '6/36' },
  { value: '6/24', label: '6/24' },
  { value: '6/18', label: '6/18' },
  { value: '6/12', label: '6/12' },
  { value: '6/9',  label: '6/9' },
  { value: '6/6',  label: '6/6 (normal)' },
  { value: '6/5',  label: '6/5 (better than normal)' },
];

// ── Snellen Chart ─────────────────────────────────────────────────────
const SnellenChart = ({ revealUpTo, pinhole = false, highlightDenom = null }) => {
  // revealUpTo: line index to show fully (others dimmed)
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '32px 24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Chart distance marker */}
      <div style={{
        position: 'absolute', top: 10, right: 14,
        fontSize: 9, color: 'var(--text-3)', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>6 m · 80–320 cd/m²</div>

      {pinhole && (
        <div style={{
          position: 'absolute', top: 10, left: 14,
          fontSize: 10, color: 'var(--amber-d)', fontWeight: 700,
          background: 'var(--amber-l)', padding: '2px 8px', borderRadius: 6,
        }}>● PINHOLE OCCLUDER</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {VA_LINES.map((line, i) => {
          const isRevealed = i <= revealUpTo;
          const isHighlight = highlightDenom != null && line.denom === highlightDenom;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', justifyContent: 'center',
                opacity: isRevealed ? 1 : 0.08,
                transition: `opacity 0.5s var(--ease-panel) ${i * 0.04}s`,
              }}
            >
              {/* line ratio */}
              <div style={{
                width: 36, fontSize: 9, color: isHighlight ? 'var(--primary)' : 'var(--text-3)',
                fontWeight: 700, textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}>{line.ratio}</div>
              <div style={{
                flex: 1, display: 'flex', justifyContent: 'center', gap: `${Math.max(4, line.size * 0.18)}px`,
                background: isHighlight ? 'var(--primary-l)' : 'transparent',
                borderRadius: 8, padding: '2px 8px',
                transition: 'background 0.3s',
              }}>
                {line.letters.split(' ').map((c, j) => (
                  <span
                    key={j}
                    style={{
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      fontSize: line.size,
                      fontWeight: 700,
                      color: '#0A0A14',
                      lineHeight: 1, letterSpacing: '0.05em',
                      animation: isRevealed ? `fadeUp 0.4s var(--ease-pop) ${i * 0.04 + j * 0.02}s both` : 'none',
                    }}
                  >{c}</span>
                ))}
              </div>
              <div style={{ width: 36 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Patient Eye Diagram (occluder visual) ─────────────────────────────
const PatientEyes = ({ occluded /* 'OD' | 'OS' | null */, pinhole = null /* same */ }) => (
  <div style={{
    display: 'flex', gap: 28, justifyContent: 'center', alignItems: 'center',
    padding: '14px 0',
  }}>
    {['OS', 'OD'].map(eye => {
      const isOccluded = occluded === eye;
      const isPinhole = pinhole === eye;
      return (
        <div key={eye} style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 50, borderRadius: '50%',
            background: isOccluded
              ? (isPinhole ? 'radial-gradient(circle at center, #fff 0 6%, #1A1D2E 6%)' : '#1A1D2E')
              : 'radial-gradient(circle at 55% 45%, #fff 0 18%, #5865F2 18% 36%, #1A1D2E 36% 48%, #fff 48%)',
            border: '2px solid #1A1D2E',
            position: 'relative', overflow: 'hidden',
            margin: '0 auto',
            transition: 'all 0.4s var(--ease-panel)',
            boxShadow: isOccluded ? 'inset 0 0 12px rgba(0,0,0,0.6)' : 'none',
          }}>
            {isOccluded && !isPinhole && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18,
              }}>⛔</div>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginTop: 6, letterSpacing: '0.08em' }}>
            {eye} {isOccluded ? (isPinhole ? '+ PINHOLE' : 'COVERED') : ''}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Main Station ──────────────────────────────────────────────────────
const VisualAcuityStationV3 = ({ findings, onComplete, onLog }) => {
  // Procedural step machine
  const STEPS = ['Setup', 'Mata Kanan (OD)', 'Pinhole OD', 'Mata Kiri (OS)', 'Pinhole OS', 'Catat hasil'];
  const flow = useStep(STEPS.length);

  // Per-eye reveal state (line index 0–7)
  const [revealOD, setRevealOD] = React.useState(0);
  const [revealOS, setRevealOS] = React.useState(0);

  // Ground truth — what the patient CAN read
  const targetDenomOD = vaToDenom(findings.visualAcuity.OD);
  const targetDenomOS = vaToDenom(findings.visualAcuity.OS);
  const targetIdxOD = denomToIndex(targetDenomOD);
  const targetIdxOS = denomToIndex(targetDenomOS);

  // Structured input
  const [vaOD, setVaOD] = React.useState(null);
  const [vaOS, setVaOS] = React.useState(null);
  const [pinholeOD, setPinholeOD] = React.useState(null); // 'improved' | 'no-change' | null
  const [pinholeOS, setPinholeOS] = React.useState(null);

  // ── Auto-reveal lines progressively (animated) ──
  const revealEye = React.useCallback((eye) => {
    const setter = eye === 'OD' ? setRevealOD : setRevealOS;
    const targetIdx = eye === 'OD' ? targetIdxOD : targetIdxOS;
    const ceiling = targetIdx < 0 ? 0 : Math.min(targetIdx + 1, VA_LINES.length - 1);
    setter(0);
    let i = 0;
    const tick = () => {
      i++;
      setter(prev => prev + 1);
      if (i < ceiling) setTimeout(tick, 420);
    };
    setTimeout(tick, 200);
  }, [targetIdxOD, targetIdxOS]);

  // Auto-start reveal when entering step
  React.useEffect(() => {
    if (flow.step === 1) revealEye('OD');
    if (flow.step === 3) revealEye('OS');
  }, [flow.step, revealEye]);

  // Pre-fill structured input from ground truth (so student "transcribes" what they see)
  const suggestOD = targetDenomOD < 0 ? 'CF' : targetDenomOD ? `6/${targetDenomOD}` : null;
  const suggestOS = targetDenomOS < 0 ? 'CF' : targetDenomOS ? `6/${targetDenomOS}` : null;

  const needsPinholeOD = targetDenomOD && targetDenomOD > 9;
  const needsPinholeOS = targetDenomOS && targetDenomOS > 9;

  // Skip pinhole steps if not needed
  const advanceFromOD = () => {
    if (needsPinholeOD) flow.next(); else flow.goto(3);
  };
  const advanceFromOS = () => {
    if (needsPinholeOS) flow.next(); else flow.goto(5);
  };

  const canComplete = vaOD && vaOS;

  const summary = canComplete
    ? `OD ${vaOD}${pinholeOD ? ` (PH: ${pinholeOD})` : ''} · OS ${vaOS}${pinholeOS ? ` (PH: ${pinholeOS})` : ''}`
    : 'Lengkapi VA OD dan OS untuk menyelesaikan stasiun ini.';

  const handleComplete = () => {
    onLog && onLog({
      type: 'va',
      OD: vaOD, OS: vaOS,
      pinholeOD, pinholeOS,
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
              icon="📐"
              title="Setup pemeriksaan"
              body="Pasien duduk pada jarak 6 meter dari chart Snellen. Pencahayaan ruang terang. Jika pasien biasa pakai kacamata/lensa kontak — TETAP dipakai (corrected VA). Mulai dengan mata kanan."
            />
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <ChecklistItem text="Chart Snellen terpasang setinggi mata pasien" />
              <ChecklistItem text="Jarak pasien-chart: 6 meter" />
              <ChecklistItem text="Koreksi optik (kacamata/lensa) tetap dipakai" />
              <ChecklistItem text="Tutup mata KIRI dulu — periksa kanan dulu" />
            </div>
            <StationControls>
              <InstrumentButton tone="primary" active icon="▶" onClick={flow.next}>
                Mulai pemeriksaan OD
              </InstrumentButton>
            </StationControls>
          </div>
        );

      case 1: case 3: {
        const eye = flow.step === 1 ? 'OD' : 'OS';
        const revealIdx = eye === 'OD' ? revealOD : revealOS;
        const targetIdx = eye === 'OD' ? targetIdxOD : targetIdxOS;
        const setVA = eye === 'OD' ? setVaOD : setVaOS;
        const va = eye === 'OD' ? vaOD : vaOS;
        const suggest = eye === 'OD' ? suggestOD : suggestOS;
        const advance = eye === 'OD' ? advanceFromOD : advanceFromOS;
        const isSevere = targetIdx < 0;

        return (
          <div>
            <StationIntro
              icon="👁"
              title={`Memeriksa mata ${eye === 'OD' ? 'KANAN (OD)' : 'KIRI (OS)'}`}
              body="Tutup mata sebelah dengan occluder/telapak tangan. Minta pasien membaca dari baris paling atas turun ke bawah, kiri-ke-kanan. Catat baris TERKECIL yang masih bisa dibaca (maksimal 2 kesalahan per baris)."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
              <SnellenChart
                revealUpTo={revealIdx}
                highlightDenom={revealIdx <= 7 && targetIdx >= 0 ? VA_LINES[Math.min(revealIdx, targetIdx)]?.denom : null}
              />
              <div>
                <PatientEyes occluded={eye === 'OD' ? 'OS' : 'OD'} />

                {isSevere ? (
                  <div style={{
                    background: 'var(--red-l)', borderRadius: 12, padding: '12px 14px',
                    border: '1px solid var(--red)30', marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red-d)', marginBottom: 4 }}>
                      ⚠ Tidak bisa baca baris teratas
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.45 }}>
                      Dekatkan ke chart, atau lanjut ke CF (counting fingers), HM (hand movement), PL/NPL.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Observasi
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 500 }}>
                      Pasien dapat membaca sampai baris <strong style={{ color: 'var(--primary)' }}>
                        {VA_LINES[targetIdx]?.ratio}
                      </strong> ({VA_LINES[targetIdx]?.letters}).
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
                      Tip: Catat hasil terbaik yang masih ≤ 2 kesalahan.
                    </div>
                  </div>
                )}

                <StructuredField label={`VA ${eye} (corrected)`} required>
                  <StructuredSelect
                    value={va}
                    onChange={setVA}
                    options={VA_OPTIONS}
                    placeholder={suggest ? `mis. ${suggest}` : '— pilih —'}
                  />
                </StructuredField>

                <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                  <InstrumentButton size="sm" onClick={() => (eye === 'OD' ? setRevealOD(7) : setRevealOS(7))}>
                    ↡ Reveal all
                  </InstrumentButton>
                  <InstrumentButton size="sm" onClick={() => (eye === 'OD' ? revealEye('OD') : revealEye('OS'))}>
                    ↻ Ulang
                  </InstrumentButton>
                </div>
              </div>
            </div>

            <StationControls style={{ marginTop: 14 }}>
              <InstrumentButton onClick={() => flow.goto(flow.step - 1)}>← Kembali</InstrumentButton>
              <InstrumentButton tone="primary" active disabled={!va} onClick={advance}>
                {needsPinholeOD && eye === 'OD' ? 'Lanjut: Pinhole OD →' :
                 needsPinholeOS && eye === 'OS' ? 'Lanjut: Pinhole OS →' :
                 eye === 'OD' ? 'Lanjut: Mata Kiri →' : 'Lanjut: Catat hasil →'}
              </InstrumentButton>
            </StationControls>
          </div>
        );
      }

      case 2: case 4: {
        const eye = flow.step === 2 ? 'OD' : 'OS';
        const va = eye === 'OD' ? vaOD : vaOS;
        const targetIdx = eye === 'OD' ? targetIdxOD : targetIdxOS;
        const pinholeVal = eye === 'OD' ? pinholeOD : pinholeOS;
        const setPinhole = eye === 'OD' ? setPinholeOD : setPinholeOS;

        // Simulated pinhole result: dryeye/contact-lens cases → no-change; conjunctivitis mild → improves
        // For simplicity, assume "improved" if target VA ≤ 6/24 and not severe
        const groundTruthPinhole = targetIdx >= 0 && targetIdx >= 2 && targetIdx <= 5 ? 'improved' : 'no-change';

        return (
          <div>
            <StationIntro
              icon="·"
              title={`Pinhole test — ${eye}`}
              body={`VA ${eye} adalah ${va}. Karena < 6/9, lakukan pinhole test. Pasang pinhole occluder di depan mata ${eye}, minta pasien baca lagi.`}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
              <SnellenChart
                revealUpTo={Math.min(7, Math.max(0, targetIdx + (groundTruthPinhole === 'improved' ? 2 : 0)))}
                pinhole
                highlightDenom={VA_LINES[Math.min(7, Math.max(0, targetIdx + (groundTruthPinhole === 'improved' ? 2 : 0)))]?.denom}
              />
              <div>
                <PatientEyes occluded={eye === 'OD' ? 'OS' : 'OD'} pinhole={eye === 'OD' ? 'OD' : 'OS'} />

                <div style={{
                  background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Hasil pinhole
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5 }}>
                    {groundTruthPinhole === 'improved'
                      ? <>Pasien sekarang dapat membaca sampai <strong style={{ color: 'var(--green)' }}>{VA_LINES[Math.min(7, targetIdx + 2)]?.ratio}</strong> — <strong>membaik</strong>.</>
                      : <>VA <strong>tidak berubah</strong> dengan pinhole — tetap {VA_LINES[Math.max(0, targetIdx)]?.ratio}.</>
                    }
                  </div>
                </div>

                <StructuredField label="Pinhole interpretation" hint="Membaik → kemungkinan refractive. Tidak berubah → media/saraf/retina.">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <InstrumentButton size="sm" tone="success" active={pinholeVal === 'improved'} onClick={() => setPinhole('improved')}>
                      Membaik
                    </InstrumentButton>
                    <InstrumentButton size="sm" tone="amber" active={pinholeVal === 'no-change'} onClick={() => setPinhole('no-change')}>
                      Tidak membaik
                    </InstrumentButton>
                  </div>
                </StructuredField>
              </div>
            </div>

            <StationControls style={{ marginTop: 14 }}>
              <InstrumentButton onClick={() => flow.goto(flow.step - 1)}>← Kembali</InstrumentButton>
              <InstrumentButton tone="primary" active disabled={!pinholeVal} onClick={() => flow.next()}>
                {eye === 'OD' ? 'Lanjut: Mata Kiri →' : 'Lanjut: Catat hasil →'}
              </InstrumentButton>
            </StationControls>
          </div>
        );
      }

      case 5:
        return (
          <div>
            <StationIntro
              icon="📋"
              title="Catat hasil & interpretasi"
              body="Verifikasi nilai final. Hasil akan masuk ke logbook dan dievaluasi otomatis terhadap ground truth."
            />

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14,
            }}>
              <ResultCard label="VA OD" value={vaOD || '—'} pinhole={pinholeOD} />
              <ResultCard label="VA OS" value={vaOS || '—'} pinhole={pinholeOS} />
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: 12, background: 'var(--amber-l)',
              border: '1px solid var(--amber)25',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-d)', marginBottom: 4 }}>
                💡 Interpretasi
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                {(pinholeOD === 'improved' || pinholeOS === 'improved') &&
                  'Pinhole-improvement → kemungkinan refractive error. '}
                {(pinholeOD === 'no-change' || pinholeOS === 'no-change') &&
                  'VA tidak membaik dengan pinhole → media opacity / retinal / nerve disease. '}
                {Math.abs((vaToDenom(vaOD) || 6) - (vaToDenom(vaOS) || 6)) >= 6 &&
                  '⚠ Asimetri signifikan antar mata — pikirkan lesi lokal.'}
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <StationShell theme="light" icon="👁" title="Visual Acuity" subtitle="Pemeriksaan ketajaman penglihatan dengan Snellen chart">
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

// Small UI helpers used above
const ChecklistItem = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px', background: 'var(--surface-2)', borderRadius: 10,
    fontSize: 11, color: 'var(--text-2)', fontWeight: 500,
    border: '1px solid var(--border)',
  }}>
    <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary-l)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>✓</span>
    {text}
  </div>
);

const ResultCard = ({ label, value, pinhole }) => (
  <div style={{
    padding: '14px 16px', borderRadius: 14,
    background: 'var(--surface)', border: '1px solid var(--border)',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {pinhole && (
      <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700,
        color: pinhole === 'improved' ? 'var(--green)' : 'var(--amber-d)',
        background: pinhole === 'improved' ? 'var(--green-l)' : 'var(--amber-l)',
        padding: '3px 8px', borderRadius: 6, display: 'inline-block',
      }}>
        Pinhole: {pinhole === 'improved' ? 'membaik' : 'tidak membaik'}
      </div>
    )}
  </div>
);

Object.assign(window, { VisualAcuityStationV3 });
