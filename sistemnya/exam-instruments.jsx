// ============================================================
// OphthaSim — Examination Instruments
// Visual Acuity, Pupil/RAPD, EOM, Visual Field, Amsler,
// Color Vision (Ishihara), Tonometry (Goldmann)
// ============================================================

// ── Common: Instrument frame ─────────────────────────────
const InstrumentFrame = ({ children, title, dark = false, dim = false, style = {} }) => (
  <div style={{
    borderRadius: 18,
    background: dark ? 'radial-gradient(circle at 30% 20%, #1a1a2e 0%, #0A0A14 100%)' : 'var(--surface)',
    border: dark ? '1px solid #2a2a40' : '1px solid var(--border)',
    boxShadow: dark ? '0 12px 40px rgba(0,0,0,0.4), inset 0 0 80px rgba(88,101,242,0.05)' : 'var(--sh-md)',
    color: dark ? '#E0E0F0' : 'var(--text-1)',
    overflow: 'hidden',
    position: 'relative',
    ...style
  }}>
    {dim && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 1 }} />}
    {title && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px', borderBottom: `1px solid ${dark ? '#2a2a40' : 'var(--border)'}`,
        background: dark ? 'rgba(0,0,0,0.3)' : 'var(--surface-2)',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: dark ? '#8B95C0' : 'var(--text-3)',
      }}>
        <span>{title}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>● REC</span>
      </div>
    )}
    {children}
  </div>
);

// ── Eye Icon (used inline as occluder, etc) ──────────────
const TinyEye = ({ open = true, size = 28, blink = false }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 40 28" style={{ display: 'block' }}>
    {open ? (
      <g>
        <path d="M2 14 Q20 2 38 14 Q20 26 2 14 Z" fill="white" stroke="#1a1d2e" strokeWidth="1.5" />
        <circle cx="20" cy="14" r="6.5" fill="#5865F2" />
        <circle cx="20" cy="14" r="3" fill="#1a1d2e" />
        <circle cx="22" cy="11" r="1.5" fill="white" opacity="0.8" />
      </g>
    ) : (
      <path d="M2 14 Q20 22 38 14" stroke="#1a1d2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )}
  </svg>
);

// ══════════════════════════════════════════════════════════
// 1. VISUAL ACUITY — Snellen Chart (interactive)
// ══════════════════════════════════════════════════════════
const SNELLEN_LINES = [
  { letters: 'E',           ratio: '6/60', size: 96, snellen: 60 },
  { letters: 'F P',         ratio: '6/36', size: 64, snellen: 36 },
  { letters: 'T O Z',       ratio: '6/24', size: 46, snellen: 24 },
  { letters: 'L P E D',     ratio: '6/18', size: 34, snellen: 18 },
  { letters: 'P E C F D',   ratio: '6/12', size: 26, snellen: 12 },
  { letters: 'E D F C Z P', ratio: '6/9',  size: 20, snellen: 9 },
  { letters: 'F E L O P Z D', ratio: '6/6', size: 16, snellen: 6 },
  { letters: 'D E F P O T E C', ratio: '6/5', size: 13, snellen: 5 },
];

function vaToLineIndex(va) {
  if (!va) return 7;
  var s = String(va).toLowerCase();
  if (s.indexOf('lp') >= 0 || s.indexOf('hm') >= 0 || s.indexOf('cf') >= 0) return -1;
  var m = s.match(/6\s*\/\s*(\d+)/);
  if (!m) return 7;
  var denom = parseInt(m[1]);
  for (var i = 0; i < SNELLEN_LINES.length; i++) {
    if (SNELLEN_LINES[i].snellen <= denom) return Math.max(0, i);
  }
  return 0;
}

const VisualAcuityStation = ({ findings, onComplete, onLog }) => {
  const [currentEye, setCurrentEye] = React.useState('OD');
  const [stage, setStage] = React.useState('intro'); // intro | testing-od | done-od | testing-os | done-os | summary
  const [revealLines, setRevealLines] = React.useState(0);
  const [pinholeOD, setPinholeOD] = React.useState(false);
  const [pinholeOS, setPinholeOS] = React.useState(false);

  const targetLineOD = vaToLineIndex(findings.visualAcuity.OD);
  const targetLineOS = vaToLineIndex(findings.visualAcuity.OS);
  const targetLine = currentEye === 'OD' ? targetLineOD : targetLineOS;
  const showSevere = targetLine < 0;

  const startTest = (eye) => {
    setCurrentEye(eye);
    setStage(eye === 'OD' ? 'testing-od' : 'testing-os');
    setRevealLines(0);
    // Auto-progress reveal
    let count = 0;
    const tick = () => {
      count++;
      setRevealLines(count);
      if (count <= 7 && count <= (showSevere ? 0 : targetLine + 1)) {
        setTimeout(tick, 380);
      } else {
        setStage(eye === 'OD' ? 'done-od' : 'done-os');
        onLog(eye === 'OD' ? `VA OD: ${findings.visualAcuity.OD}` : `VA OS: ${findings.visualAcuity.OS}`);
      }
    };
    setTimeout(tick, 400);
  };

  const bothDone = stage === 'done-os' || stage === 'summary';
  React.useEffect(() => {
    if (bothDone && stage !== 'summary') {
      setStage('summary');
      onComplete();
    }
  }, [bothDone, stage, onComplete]);

  const reducedOD = ['mild','moderate','severe'].indexOf(gradeVA(findings.visualAcuity.OD)) >= 0;
  const reducedOS = ['mild','moderate','severe'].indexOf(gradeVA(findings.visualAcuity.OS)) >= 0;

  return (
    <div>
      <SectionIntro icon="👁️" title="Visual Acuity"
        sub="Test each eye separately at 6 metres. Cover one eye with the occluder, ask patient to read smallest line possible." />

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Snellen Chart */}
        <InstrumentFrame title="Snellen Chart · 6 metres" style={{ flex: 1, minWidth: 360 }}>
          <div style={{
            padding: '28px 36px', textAlign: 'center', minHeight: 380,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 100%)',
            position: 'relative',
          }}>
            {/* Red light bar overhead (clinical detail) */}
            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              width: 60, height: 4, background: 'linear-gradient(90deg, transparent, #DC2626, transparent)',
              borderRadius: 2, opacity: 0.5,
            }} />

            {SNELLEN_LINES.map((line, i) => {
              const isRevealed = (stage === 'intro' || stage === 'summary') ? true : i < revealLines;
              const isCurrent = stage.startsWith('testing') && i === revealLines - 1;
              const passedCurrentEye = (stage === 'done-od' || stage === 'done-os' || stage === 'summary') && i <= targetLine;
              const blurry = stage.startsWith('testing') && !isRevealed;

              return (
                <div key={i} className="line" style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 700,
                  fontSize: line.size,
                  letterSpacing: line.size > 24 ? '0.15em' : '0.2em',
                  lineHeight: 1.15,
                  color: '#0a0a14',
                  position: 'relative',
                  filter: blurry ? 'blur(4px)' : 'none',
                  opacity: isRevealed ? 1 : 0.15,
                  transition: 'all 0.35s ease',
                  marginBottom: line.size > 30 ? 4 : 2,
                }}>
                  {line.letters}
                  {isCurrent && (
                    <span style={{
                      position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 10, color: 'var(--primary)', fontFamily: 'Poppins',
                      fontWeight: 700, letterSpacing: 0,
                      animation: 'pulse 1.2s infinite',
                    }}>← reading</span>
                  )}
                  <span style={{
                    position: 'absolute', left: -42, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 10, color: 'var(--text-3)', fontFamily: 'Poppins', fontWeight: 500,
                    letterSpacing: 0,
                  }}>{line.ratio}</span>
                </div>
              );
            })}

            {showSevere && stage.startsWith('done') && (
              <div className="ab" style={{ marginTop: 20, padding: 12, background: 'var(--amber-l)', borderRadius: 10, fontFamily: 'Poppins', color: 'var(--amber-d)', fontWeight: 700, fontSize: 14 }}>
                ⚠️ Pasien tidak dapat membaca baris teratas. Catat temuan Anda di logbook.
              </div>
            )}
          </div>
        </InstrumentFrame>

        {/* Control panel */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Patient illustration */}
          <InstrumentFrame title="Patient · Cover Test">
            <div style={{ padding: 18, textAlign: 'center', background: 'var(--surface-2)' }}>
              <div style={{ display: 'inline-flex', gap: 16, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>OD (Right)</div>
                  <TinyEye open={currentEye === 'OD'} size={42} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>OS (Left)</div>
                  <TinyEye open={currentEye === 'OS'} size={42} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 10 }}>
                {stage === 'intro' && 'Select an eye to test'}
                {stage === 'testing-od' && 'Testing right eye — left occluded'}
                {stage === 'testing-os' && 'Testing left eye — right occluded'}
                {(stage === 'done-od' || stage === 'done-os') && '✓ Recording…'}
                {stage === 'summary' && '✓ Test complete'}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant={stage === 'intro' || stage === 'done-os' ? 'primary' : 'secondary'} size="sm"
                disabled={stage === 'testing-od' || stage === 'testing-os' || stage === 'done-od' || stage === 'summary'}
                onClick={() => startTest('OD')}
                style={{ justifyContent: 'center' }}>
                {stage === 'done-od' || stage === 'summary' ? '✓ OD Tested' : '→ Test OD'}
              </Btn>
              <Btn variant={(stage === 'done-od') ? 'primary' : 'secondary'} size="sm"
                disabled={stage === 'intro' || stage === 'testing-od' || stage === 'testing-os' || stage === 'summary'}
                onClick={() => startTest('OS')}
                style={{ justifyContent: 'center' }}>
                {stage === 'summary' ? '✓ OS Tested' : '→ Test OS'}
              </Btn>
            </div>
          </InstrumentFrame>

          {/* Recorded panel hidden — student must transcribe to logbook manually (OSCE_RUBRIC §H) */}
          {false && (stage === 'done-od' || stage === 'done-os' || stage === 'summary') && (
            <InstrumentFrame title="Recorded">
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: reducedOD ? 'var(--amber-l)' : 'var(--green-l)', borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>OD</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Georgia' }}>{findings.visualAcuity.OD}</span>
                </div>
                {(stage === 'summary') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: reducedOS ? 'var(--amber-l)' : 'var(--green-l)', borderRadius: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>OS</span>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Georgia' }}>{findings.visualAcuity.OS}</span>
                  </div>
                )}
                {(reducedOD || reducedOS) && stage === 'summary' && (
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--primary-l)', borderRadius: 10, fontSize: 11, color: 'var(--primary)', textAlign: 'center', fontWeight: 600 }}>
                    💡 Consider pinhole test for refractive cause
                  </div>
                )}
              </div>
            </InstrumentFrame>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// 2. PUPILLARY EXAMINATION — Direct, Consensual, RAPD
// ══════════════════════════════════════════════════════════
const PupillaryStation = ({ ext, onComplete, onLog }) => {
  const [activeTest, setActiveTest] = React.useState(null); // 'direct-od' | 'direct-os' | 'consensual' | 'rapd'
  const [completedTests, setCompletedTests] = React.useState(new Set());
  const [rapdGuess, setRapdGuess] = React.useState(null); // user's guess: 'OD' | 'OS' | 'none'
  const [rapdFeedback, setRapdFeedback] = React.useState(null);
  const [swingPos, setSwingPos] = React.useState('OD'); // for swinging flashlight animation
  const [swingCycle, setSwingCycle] = React.useState(0);

  // Swinging animation
  React.useEffect(() => {
    if (activeTest !== 'rapd') return;
    const id = setInterval(() => {
      setSwingPos(p => p === 'OD' ? 'OS' : 'OD');
      setSwingCycle(c => c + 1);
    }, 1800);
    return () => clearInterval(id);
  }, [activeTest]);

  const runTest = (test) => {
    setActiveTest(test);
    if (test !== 'rapd') {
      setTimeout(() => {
        setCompletedTests(prev => new Set([...prev, test]));
        setActiveTest(null);
        if (test === 'direct-od') onLog('Direct pupillary reflex OD: ' + ext.pupils.OD.reactive);
        if (test === 'direct-os') onLog('Direct pupillary reflex OS: ' + ext.pupils.OS.reactive);
        if (test === 'consensual') onLog('Consensual reflexes intact');
      }, 2400);
    } else {
      setSwingCycle(0);
    }
  };

  const submitRapdGuess = (g) => {
    setRapdGuess(g);
    const correct = (ext.pupils.RAPD || 'none') === g;
    setRapdFeedback(correct ? 'correct' : 'incorrect');
    setCompletedTests(prev => new Set([...prev, 'rapd']));
    onLog(`RAPD test: ${ext.pupils.RAPD ? `Positive in ${ext.pupils.RAPD}` : 'Negative (no RAPD)'} — Trainee answer: ${correct ? '✓' : '✗'}`);
    setTimeout(() => setActiveTest(null), 1200);
  };

  React.useEffect(() => {
    if (completedTests.size >= 3) onComplete();
  }, [completedTests, onComplete]);

  // Pupil rendering helpers
  const pupilSizeOD = (() => {
    if (activeTest === 'direct-od') return Math.max(1.8, ext.pupils.OD.size * 0.6);
    if (activeTest === 'consensual' && ext.pupils.OD.reactive !== 'non-reactive') return ext.pupils.OD.size * 0.65;
    if (activeTest === 'rapd') {
      // Swinging flashlight logic
      const lightOnOD = swingPos === 'OD';
      // If RAPD on OD: when light on OD, OD dilates (paradox); when light on OS (good eye), OS constricts and consensually OD constricts
      if (ext.pupils.RAPD === 'OD') {
        return lightOnOD ? ext.pupils.OD.size * 1.05 : ext.pupils.OD.size * 0.65;
      }
      if (ext.pupils.RAPD === 'OS') {
        return lightOnOD ? ext.pupils.OD.size * 0.65 : ext.pupils.OD.size * 0.7;
      }
      return ext.pupils.OD.size * 0.65;
    }
    return ext.pupils.OD.size;
  })();

  const pupilSizeOS = (() => {
    if (activeTest === 'direct-os') return Math.max(1.8, ext.pupils.OS.size * 0.6);
    if (activeTest === 'consensual' && ext.pupils.OS.reactive !== 'non-reactive') return ext.pupils.OS.size * 0.65;
    if (activeTest === 'rapd') {
      const lightOnOS = swingPos === 'OS';
      if (ext.pupils.RAPD === 'OS') {
        return lightOnOS ? ext.pupils.OS.size * 1.05 : ext.pupils.OS.size * 0.65;
      }
      if (ext.pupils.RAPD === 'OD') {
        return lightOnOS ? ext.pupils.OS.size * 0.65 : ext.pupils.OS.size * 0.7;
      }
      return ext.pupils.OS.size * 0.65;
    }
    return ext.pupils.OS.size;
  })();

  return (
    <div>
      <SectionIntro icon="🔦" title="Pupillary Examination"
        sub="Perform direct & consensual reflex testing, then the swinging flashlight test to detect RAPD." />

      <InstrumentFrame title="Penlight Examination · Dark Room" dark style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', padding: '32px 24px', minHeight: 280, background: 'radial-gradient(circle at center, #1a1d3a 0%, #060810 100%)' }}>
          {/* Eyes display */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 80, alignItems: 'center', position: 'relative' }}>
            <EyeAnimation
              label="OD"
              pupilSize={pupilSizeOD}
              shape={ext.pupils.OD.shape}
              lit={activeTest === 'direct-od' || (activeTest === 'rapd' && swingPos === 'OD') || (activeTest === 'consensual')}
              flashlight={activeTest === 'direct-od' || (activeTest === 'rapd' && swingPos === 'OD')}
            />
            <EyeAnimation
              label="OS"
              pupilSize={pupilSizeOS}
              shape={ext.pupils.OS.shape}
              lit={activeTest === 'direct-os' || (activeTest === 'rapd' && swingPos === 'OS') || (activeTest === 'consensual')}
              flashlight={activeTest === 'direct-os' || (activeTest === 'rapd' && swingPos === 'OS')}
            />
          </div>

          {/* Test info */}
          <div style={{ textAlign: 'center', marginTop: 24, color: '#8B95C0', fontSize: 11, fontFamily: 'Poppins', letterSpacing: '0.06em' }}>
            {activeTest === 'direct-od' && <span style={{ color: '#FFE066' }}>● Shining light into RIGHT eye — observe ipsilateral constriction</span>}
            {activeTest === 'direct-os' && <span style={{ color: '#FFE066' }}>● Shining light into LEFT eye — observe ipsilateral constriction</span>}
            {activeTest === 'consensual' && <span style={{ color: '#FFE066' }}>● Light in one eye — observe constriction in OTHER eye</span>}
            {activeTest === 'rapd' && <span style={{ color: '#FFE066' }}>● Swinging flashlight · cycle {Math.floor(swingCycle/2)+1} — watch for paradoxical dilation</span>}
            {!activeTest && completedTests.size === 0 && <span>Select a test to begin →</span>}
            {!activeTest && completedTests.size > 0 && <span style={{ color: '#34D399' }}>✓ {completedTests.size}/3 tests complete</span>}
          </div>
        </div>
      </InstrumentFrame>

      {/* Test buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <TestButton
          icon="→" label="Direct Reflex"
          desc="Each eye separately"
          done={completedTests.has('direct-od') && completedTests.has('direct-os')}
          active={activeTest === 'direct-od' || activeTest === 'direct-os'}
          disabled={!!activeTest}
          actions={[
            { label: 'OD', onClick: () => runTest('direct-od'), done: completedTests.has('direct-od') },
            { label: 'OS', onClick: () => runTest('direct-os'), done: completedTests.has('direct-os') },
          ]} />
        <TestButton
          icon="↔" label="Consensual"
          desc="Cross-eye response"
          done={completedTests.has('consensual')}
          active={activeTest === 'consensual'}
          disabled={!!activeTest}
          onClick={() => runTest('consensual')} />
        <TestButton
          icon="⇌" label="Swinging Flashlight (RAPD)"
          desc="Key test — afferent pathway"
          done={completedTests.has('rapd')}
          active={activeTest === 'rapd'}
          disabled={!!activeTest && activeTest !== 'rapd'}
          onClick={() => runTest('rapd')}
          highlight />
      </div>

      {/* RAPD guess panel */}
      {activeTest === 'rapd' && (
        <InstrumentFrame title="Your assessment" style={{ marginBottom: 16 }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>
              Based on the swinging flashlight test, is there a relative afferent pupillary defect?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['none', 'No RAPD'], ['OD', 'RAPD in OD'], ['OS', 'RAPD in OS']].map(([v, l]) => (
                <button key={v} onClick={() => submitRapdGuess(v)} disabled={!!rapdFeedback} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${rapdGuess === v ? 'var(--primary)' : 'var(--border)'}`,
                  background: rapdGuess === v ? 'var(--primary-l)' : 'var(--surface)',
                  color: 'var(--text-1)', fontFamily: 'Poppins', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
            {rapdFeedback && (
              <div className="ab" style={{
                marginTop: 12, padding: 10, borderRadius: 10, fontSize: 12, fontWeight: 700, textAlign: 'center',
                background: 'var(--surface-2)',
                color: 'var(--text-2)',
              }}>
                ✓ Jawaban tercatat. Catat temuan resmi Anda di Logbook (di bawah).
              </div>
            )}
          </div>
        </InstrumentFrame>
      )}

      {/* Auto findings reveal hidden — student transcribes to logbook manually (OSCE_RUBRIC §H) */}
      {false && completedTests.size >= 3 && (
        <div className="ab" style={{ padding: 14, background: 'var(--primary-l)', borderRadius: 14, fontSize: 12, color: 'var(--primary)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📋 Pupillary Findings</div>
          <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>{ext.pupils.notes}</div>
        </div>
      )}
      {completedTests.size >= 3 && (
        <div className="ab" style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
          ✓ Tes pupil selesai — silakan catat temuan Anda di form Logbook di bawah.
        </div>
      )}
    </div>
  );
};

// Eye animation for pupillary exam
const EyeAnimation = ({ label, pupilSize, shape, lit, flashlight }) => {
  const sclerColor = '#F4F0E5';
  const irisColor = '#5A7BA8';
  const pupilFinal = Math.max(1.5, Math.min(6, pupilSize));
  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>{label}</div>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <defs>
          <radialGradient id={`iris-${label}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#7A98C0" />
            <stop offset="100%" stopColor="#3A5680" />
          </radialGradient>
          <radialGradient id={`glow-${label}`}>
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#FFE066" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFE066" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Light glow */}
        {lit && <circle cx="80" cy="50" r="50" fill={`url(#glow-${label})`} />}
        {/* Sclera */}
        <ellipse cx="80" cy="50" rx="50" ry="22" fill={sclerColor} stroke="#1a1d2e" strokeWidth="1.2" />
        {/* Iris */}
        {shape === 'oval' ? (
          <ellipse cx="80" cy="50" rx="20" ry="18" fill={`url(#iris-${label})`} />
        ) : (
          <circle cx="80" cy="50" r="20" fill={`url(#iris-${label})`} />
        )}
        {/* Iris detail */}
        <g opacity="0.4">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(d => {
            const rad = (d * Math.PI) / 180;
            return (
              <line key={d} x1={80 + Math.cos(rad) * 8} y1={50 + Math.sin(rad) * 8}
                x2={80 + Math.cos(rad) * 18} y2={50 + Math.sin(rad) * 18}
                stroke="#1a1d2e" strokeWidth="0.5" />
            );
          })}
        </g>
        {/* Pupil */}
        {shape === 'oval' ? (
          <ellipse cx="80" cy="50" rx={pupilFinal * 1.4} ry={pupilFinal * 1.2} fill="#0a0a14"
            style={{ transition: 'all 0.6s ease' }} />
        ) : shape === 'irregular' ? (
          <path d={`M ${80 - pupilFinal*1.2} 50 Q ${80} ${50 - pupilFinal*1.4}, ${80 + pupilFinal*1.3} 50 Q ${80} ${50 + pupilFinal*1.1}, ${80 - pupilFinal*1.2} 50`}
            fill="#0a0a14" style={{ transition: 'all 0.6s ease' }} />
        ) : (
          <circle cx="80" cy="50" r={pupilFinal * 1.3} fill="#0a0a14"
            style={{ transition: 'all 0.6s ease' }} />
        )}
        {/* Corneal reflex (white dot when lit) */}
        {lit && <circle cx="76" cy="46" r="2" fill="white" opacity="0.9" />}
        {/* Eyelashes hint */}
        <path d="M30,28 Q80,16 130,28" stroke="#1a1d2e" strokeWidth="0.8" fill="none" opacity="0.4" />
      </svg>
      {/* Flashlight icon */}
      {flashlight && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 18, animation: 'pulse 1s infinite' }}>🔦</div>
      )}
      <div style={{ fontSize: 9, color: '#8B95C0', marginTop: 4, fontFamily: 'monospace' }}>
        {pupilFinal.toFixed(1)} mm
      </div>
    </div>
  );
};

const TestButton = ({ icon, label, desc, done, active, disabled, onClick, actions, highlight }) => (
  <div style={{
    padding: 14, borderRadius: 14,
    border: `1.5px solid ${active ? 'var(--primary)' : done ? 'var(--green)40' : 'var(--border)'}`,
    background: active ? 'var(--primary-l)' : done ? 'var(--green-l)' : highlight ? 'linear-gradient(180deg, var(--surface) 0%, var(--primary-ll) 100%)' : 'var(--surface)',
    opacity: disabled && !active ? 0.5 : 1,
    transition: 'all 0.2s',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</span>
      {done && <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--green)' }}>✓</span>}
    </div>
    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 10 }}>{desc}</div>
    {actions ? (
      <div style={{ display: 'flex', gap: 6 }}>
        {actions.map(a => (
          <button key={a.label} onClick={a.onClick} disabled={disabled || a.done} style={{
            flex: 1, padding: '6px 0', borderRadius: 8,
            border: `1px solid ${a.done ? 'var(--green)40' : 'var(--border)'}`,
            background: a.done ? 'var(--green-l)' : 'var(--surface)',
            fontSize: 11, fontWeight: 700, color: a.done ? 'var(--green)' : 'var(--text-1)',
            cursor: a.done || disabled ? 'default' : 'pointer', fontFamily: 'Poppins',
          }}>{a.done ? '✓ ' + a.label : a.label}</button>
        ))}
      </div>
    ) : (
      <button onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: '6px 0', borderRadius: 8,
        border: `1px solid ${done ? 'var(--green)40' : 'var(--primary)40'}`,
        background: done ? 'var(--green-l)' : 'var(--primary)', color: done ? 'var(--green)' : '#fff',
        fontSize: 11, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: 'Poppins',
      }}>{done ? '✓ Done' : active ? 'Running…' : 'Perform'}</button>
    )}
  </div>
);

// SectionIntro helper
const SectionIntro = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>{title}
    </h2>
    <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{sub}</p>
  </div>
);

Object.assign(window, {
  InstrumentFrame, TinyEye, EyeAnimation, TestButton, SectionIntro,
  VisualAcuityStation, PupillaryStation, SNELLEN_LINES,
});
