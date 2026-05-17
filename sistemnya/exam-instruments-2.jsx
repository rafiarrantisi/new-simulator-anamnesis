// ============================================================
// OphthaSim — Examination Instruments PART 2
// EOM, Confrontation VF, Amsler Grid, Ishihara, Tonometry
// ============================================================

// ══════════════════════════════════════════════════════════
// 3. EXTRAOCULAR MOVEMENTS (EOM) — 9 Cardinal Positions
// ══════════════════════════════════════════════════════════
const EOM_POSITIONS = [
  { key: 'up-left',  label: 'Up-Left',     x: -1, y: -1, muscleLabel: 'OD: SR / OS: IO' },
  { key: 'up',       label: 'Up',          x:  0, y: -1, muscleLabel: 'SR (sup. rectus)' },
  { key: 'up-right', label: 'Up-Right',    x:  1, y: -1, muscleLabel: 'OD: IO / OS: SR' },
  { key: 'left',     label: 'Left',        x: -1, y:  0, muscleLabel: 'OD: MR / OS: LR' },
  { key: 'center',   label: 'Primary',     x:  0, y:  0, muscleLabel: 'Primary gaze' },
  { key: 'right',    label: 'Right',       x:  1, y:  0, muscleLabel: 'OD: LR / OS: MR' },
  { key: 'dn-left',  label: 'Down-Left',   x: -1, y:  1, muscleLabel: 'OD: IR / OS: SO' },
  { key: 'dn',       label: 'Down',        x:  0, y:  1, muscleLabel: 'IR (inf. rectus)' },
  { key: 'dn-right', label: 'Down-Right',  x:  1, y:  1, muscleLabel: 'OD: SO / OS: IR' },
];

const EOMStation = ({ ext, onComplete, onLog }) => {
  const [tested, setTested] = React.useState(new Set());
  const [activePos, setActivePos] = React.useState('center');
  const [following, setFollowing] = React.useState(false);

  const testPosition = (key) => {
    setActivePos(key);
    setFollowing(true);
    setTimeout(() => {
      setFollowing(false);
      setTested(prev => new Set([...prev, key]));
    }, 700);
  };

  const limitations = ext.motility.limitations || [];
  const isLimited = (key) => limitations.indexOf(key) >= 0;

  React.useEffect(() => {
    if (tested.size >= 9) {
      onLog(ext.motility.full ? 'EOM: Full range, no limitations' : `EOM: ${limitations.join(', ')}`);
      onComplete();
    }
  }, [tested, onComplete, onLog, ext, limitations]);

  // Eye gaze direction
  const gazeOffset = EOM_POSITIONS.find(p => p.key === activePos) || EOM_POSITIONS[4];

  return (
    <div>
      <SectionIntro icon="↕" title="Extraocular Movements (EOM)"
        sub="Test the 9 cardinal positions of gaze (H-pattern). Patient follows the target with both eyes." />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Eyes preview */}
        <InstrumentFrame title="Patient Eyes" dark style={{ flex: 1, minWidth: 360 }}>
          <div style={{
            padding: '40px 24px', background: 'radial-gradient(circle at center, #1a1d3a 0%, #060810 100%)',
            position: 'relative', minHeight: 280,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 50, alignItems: 'center' }}>
              <GazeEye label="OD" offsetX={gazeOffset.x} offsetY={gazeOffset.y} animating={following} limited={false} />
              <GazeEye label="OS" offsetX={gazeOffset.x} offsetY={gazeOffset.y} animating={following} limited={isLimited(activePos)} />
            </div>
            {/* Target finger marker */}
            <div style={{ textAlign: 'center', marginTop: 30, color: '#8B95C0', fontSize: 11 }}>
              <div style={{ marginBottom: 8 }}>
                Examiner target: <strong style={{ color: '#FFE066' }}>{EOM_POSITIONS.find(p => p.key === activePos)?.label}</strong>
                {' · '}
                {EOM_POSITIONS.find(p => p.key === activePos)?.muscleLabel}
              </div>
              {following && <div style={{ color: '#34D399' }}>● Patient following…</div>}
              {!following && isLimited(activePos) && (
                <div className="ab" style={{ color: '#FB7185', fontWeight: 700, marginTop: 6 }}>⚠️ Pasien tampak kesulitan ke arah ini</div>
              )}
            </div>
          </div>
        </InstrumentFrame>

        {/* 9-position grid */}
        <InstrumentFrame title="9 Cardinal Positions" style={{ width: 280 }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {EOM_POSITIONS.map(p => {
                const isDone = tested.has(p.key);
                const isActive = activePos === p.key;
                const lim = isDone && isLimited(p.key);
                return (
                  <button key={p.key} onClick={() => testPosition(p.key)} disabled={following} style={{
                    padding: '14px 4px', borderRadius: 10,
                    border: `1.5px solid ${isActive ? 'var(--primary)' : lim ? 'var(--red)40' : isDone ? 'var(--green)40' : 'var(--border)'}`,
                    background: isActive ? 'var(--primary-l)' : lim ? 'var(--red-l)' : isDone ? 'var(--green-l)' : 'var(--surface)',
                    cursor: following ? 'wait' : 'pointer', fontFamily: 'Poppins',
                    fontSize: 16, fontWeight: 700,
                    transition: 'all 0.2s',
                  }}>
                    {lim ? '⚠️' : isDone ? '✓' : `${p.x === 0 ? '·' : p.x < 0 ? '←' : '→'}${p.y === 0 ? '' : p.y < 0 ? '↑' : '↓'}`}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 12, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>
              {tested.size}/9 positions tested
            </div>
          </div>
        </InstrumentFrame>
      </div>

      {/* Auto reveal hidden — transcribe to Logbook (OSCE_RUBRIC §H) */}
      {tested.size >= 9 && (
        <div className="ab" style={{ marginTop: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
          ✓ Semua 9 posisi EOM telah diperiksa — silakan catat temuan Anda di Logbook (di bawah).
        </div>
      )}
    </div>
  );
};

const GazeEye = ({ label, offsetX, offsetY, animating, limited }) => {
  // If limited, eye doesn't reach the position (clamped)
  const finalX = limited ? offsetX * 0.4 : offsetX;
  const finalY = limited ? offsetY * 0.4 : offsetY;
  const pupilX = 80 + finalX * 14;
  const pupilY = 50 + finalY * 10;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#8B95C0', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <ellipse cx="80" cy="50" rx="50" ry="22" fill="#F4F0E5" stroke="#1a1d2e" strokeWidth="1.2" />
        <g style={{ transition: animating ? 'transform 0.6s ease-out' : 'transform 0.3s ease' }}>
          <circle cx={pupilX} cy={pupilY} r="14" fill="url(#irisGrad)" />
          <circle cx={pupilX} cy={pupilY} r="6" fill="#0a0a14" />
          <circle cx={pupilX - 3} cy={pupilY - 3} r="2" fill="white" opacity="0.85" />
        </g>
        <defs>
          <radialGradient id="irisGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#7A98C0" />
            <stop offset="100%" stopColor="#3A5680" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// 4. CONFRONTATION VISUAL FIELD
// ══════════════════════════════════════════════════════════
const ConfrontationStation = ({ ext, onComplete, onLog }) => {
  const [currentEye, setCurrentEye] = React.useState('OD');
  const [testedQuadrants, setTestedQuadrants] = React.useState({ OD: new Set(), OS: new Set() });
  const [activeQuadrant, setActiveQuadrant] = React.useState(null);

  const quadrants = [
    { key: 'sup-nasal',   label: 'Sup. Nasal',   x: 0, y: 0 },
    { key: 'sup-temporal',label: 'Sup. Temporal',x: 1, y: 0 },
    { key: 'inf-nasal',   label: 'Inf. Nasal',   x: 0, y: 1 },
    { key: 'inf-temporal',label: 'Inf. Temporal',x: 1, y: 1 },
  ];

  const fieldDesc = currentEye === 'OD' ? ext.confrontation.OD : ext.confrontation.OS;
  const hasDefect = fieldDesc && fieldDesc !== 'full';

  // Determine which quadrant is defective from text
  const defectQuadrant = (() => {
    if (!hasDefect) return null;
    const d = (fieldDesc || '').toLowerCase();
    if (d.indexOf('inferior') >= 0 && d.indexOf('nasal') >= 0) return 'inf-nasal';
    if (d.indexOf('inferior') >= 0 && d.indexOf('temporal') >= 0) return 'inf-temporal';
    if (d.indexOf('superior') >= 0 && d.indexOf('nasal') >= 0) return 'sup-nasal';
    if (d.indexOf('superior') >= 0 && d.indexOf('temporal') >= 0) return 'sup-temporal';
    if (d.indexOf('central') >= 0) return 'central';
    if (d.indexOf('diffus') >= 0 || d.indexOf('reduced') >= 0) return 'diffuse';
    return null;
  })();

  const testQuadrant = (key) => {
    setActiveQuadrant(key);
    setTimeout(() => {
      setTestedQuadrants(prev => ({ ...prev, [currentEye]: new Set([...prev[currentEye], key]) }));
      setActiveQuadrant(null);
    }, 700);
  };

  const eyeDone = testedQuadrants[currentEye].size >= 4;
  const allDone = testedQuadrants.OD.size >= 4 && testedQuadrants.OS.size >= 4;

  React.useEffect(() => {
    if (allDone) {
      onLog('VF (confrontation) — OD: ' + ext.confrontation.OD + ' · OS: ' + ext.confrontation.OS);
      onComplete();
    }
  }, [allDone, onComplete, onLog, ext]);

  return (
    <div>
      <SectionIntro icon="◐" title="Confrontation Visual Field"
        sub="Examiner shows fingers in each quadrant. Patient (covering one eye) reports what they see." />

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        {['OD','OS'].map(e => (
          <button key={e} onClick={() => setCurrentEye(e)} style={{
            padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${currentEye === e ? 'var(--primary)' : 'var(--border)'}`,
            background: currentEye === e ? 'var(--primary-l)' : 'var(--surface)',
            fontWeight: 700, fontFamily: 'Poppins', cursor: 'pointer',
            color: currentEye === e ? 'var(--primary)' : 'var(--text-1)',
          }}>
            Testing {e} {testedQuadrants[e].size >= 4 && '✓'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Field visualization */}
        <InstrumentFrame title={`Field — ${currentEye}`} dark style={{ flex: 1, minWidth: 320 }}>
          <div style={{
            padding: 28, background: 'radial-gradient(circle at center, #1a1d3a 0%, #0a0a14 100%)',
            position: 'relative', minHeight: 320,
          }}>
            <svg width="100%" viewBox="0 0 320 320" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
              {/* Field circle */}
              <circle cx="160" cy="160" r="140" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <circle cx="160" cy="160" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Axes */}
              <line x1="20" y1="160" x2="300" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1="160" y1="20" x2="160" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

              {/* Quadrant fill — defect */}
              {quadrants.map(q => {
                const isDefect = (testedQuadrants[currentEye].has(q.key)) && defectQuadrant === q.key;
                const isDiffuse = (testedQuadrants[currentEye].has(q.key)) && (defectQuadrant === 'diffuse' || defectQuadrant === 'central');
                if (!isDefect && !isDiffuse) return null;
                const px = q.x === 0 ? 20 : 160;
                const py = q.y === 0 ? 20 : 160;
                return (
                  <rect key={q.key} x={px} y={py} width={140} height={140}
                    fill="rgba(239,68,68,0.25)"
                    style={{ animation: 'fadeIn 0.4s' }} />
                );
              })}
              {/* Central scotoma */}
              {defectQuadrant === 'central' && testedQuadrants[currentEye].size >= 2 && (
                <circle cx="160" cy="160" r="40" fill="rgba(239,68,68,0.5)" />
              )}

              {/* Quadrant click zones */}
              {quadrants.map(q => {
                const tested = testedQuadrants[currentEye].has(q.key);
                const active = activeQuadrant === q.key;
                const px = q.x === 0 ? 20 : 160;
                const py = q.y === 0 ? 20 : 160;
                return (
                  <g key={'q-' + q.key} style={{ cursor: 'pointer' }} onClick={() => !tested && testQuadrant(q.key)}>
                    <rect x={px} y={py} width={140} height={140} fill="transparent" />
                    {/* Finger icon */}
                    <text x={px + 70} y={py + 78} textAnchor="middle" fontSize="32" opacity={active ? 1 : tested ? 0.4 : 0.7} fill={active ? '#FFE066' : tested ? '#34D399' : 'rgba(255,255,255,0.6)'}>
                      {active ? '✋' : tested ? '✓' : '✋'}
                    </text>
                    <text x={px + 70} y={py + 100} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="Poppins" fontWeight="600">
                      {q.label}
                    </text>
                  </g>
                );
              })}

              {/* Center fixation */}
              <circle cx="160" cy="160" r="5" fill="#FFE066" />
              <text x="160" y="178" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Poppins">Fixation</text>
            </svg>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#8B95C0' }}>
              {testedQuadrants[currentEye].size}/4 quadrants · click to test
            </div>
          </div>
        </InstrumentFrame>

        {/* Findings panel — hidden, student transcribes to Logbook (OSCE_RUBRIC §H) */}
        <InstrumentFrame title="Status" style={{ width: 260 }}>
          <div style={{ padding: 14, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8, fontSize: 24 }}>📝</div>
            Periksa kedua mata pada keempat kuadran. Setelah selesai, catat temuan Anda di Logbook (di bawah).
          </div>
        </InstrumentFrame>
      </div>

      {allDone && false && ext.confrontation.notes && (
        <div className="ab" style={{ marginTop: 16, padding: 14, background: 'var(--primary-l)', borderRadius: 14, fontSize: 12, color: 'var(--text-1)' }}>
          <strong style={{ color: 'var(--primary)' }}>📋 Note:</strong> {ext.confrontation.notes}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// 5. AMSLER GRID
// ══════════════════════════════════════════════════════════
const AmslerStation = ({ ext, onComplete, onLog }) => {
  const [tested, setTested] = React.useState({ OD: false, OS: false });
  const [currentEye, setCurrentEye] = React.useState('OD');

  const startTest = (eye) => {
    setCurrentEye(eye);
    setTested(prev => ({ ...prev, [eye]: true }));
    onLog(`Amsler ${eye}: ${ext.amsler[eye]}`);
  };

  React.useEffect(() => {
    if (tested.OD && tested.OS) onComplete();
  }, [tested, onComplete]);

  const distortionType = ext.amsler[currentEye] || 'normal';

  return (
    <div>
      <SectionIntro icon="▦" title="Amsler Grid"
        sub="Tests central 10° of vision. Patient fixates on the central dot — reports any distortion, missing area, or wavy lines." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {['OD','OS'].map(e => (
          <Btn key={e} variant={currentEye === e ? 'primary' : 'secondary'} size="sm"
            onClick={() => startTest(e)}>
            {tested[e] ? '✓ ' : '→ '}Test {e}
          </Btn>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <InstrumentFrame title={`Amsler · ${currentEye} — Patient's view`} dark style={{ flex: 1, minWidth: 360 }}>
          <div style={{ padding: 28, background: '#0a0a14', display: 'flex', justifyContent: 'center' }}>
            <AmslerGridSVG distortion={tested[currentEye] ? distortionType : 'normal'} />
          </div>
        </InstrumentFrame>

        <InstrumentFrame title="Status" style={{ width: 260 }}>
          <div style={{ padding: 14, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
            Periksa kedua mata dengan Amsler grid. Setelah selesai, catat distorsi/scotoma yang Anda observasi di Logbook (di bawah).
          </div>
        </InstrumentFrame>
      </div>
    </div>
  );
};

const AmslerGridSVG = ({ distortion = 'normal' }) => {
  const size = 320;
  const cells = 20;
  const step = size / cells;
  const cx = size / 2, cy = size / 2;

  // Distortion field
  const distortPoint = (x, y) => {
    if (distortion === 'normal') return [x, y];
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (distortion.indexOf('distortion') >= 0 || distortion === 'mild distortion central') {
      // wavy near center
      const factor = Math.max(0, 1 - dist / (size * 0.3));
      const wave = Math.sin(x * 0.1) * 5 * factor + Math.sin(y * 0.1) * 5 * factor;
      return [x + wave * 0.6, y + wave * 0.6];
    }
    if (distortion.indexOf('scotoma') >= 0 || distortion.indexOf('central') >= 0) {
      // central scotoma — just dim the center
      return [x, y];
    }
    return [x, y];
  };

  const isScotomaCenter = (x, y) => {
    if (distortion.indexOf('scotoma') < 0 && distortion.indexOf('central scotoma') < 0 && distortion !== 'partial scotoma — inferonasal') return false;
    if (distortion === 'partial scotoma — inferonasal') {
      return (x < cx && y > cy) && (Math.sqrt((x - cx + 40) ** 2 + (y - cy - 40) ** 2) < 60);
    }
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 50;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#0a0a14" />
      {/* Vertical lines */}
      {Array.from({ length: cells + 1 }, (_, i) => {
        const x = i * step;
        const segments = [];
        for (let j = 0; j < cells; j++) {
          const y1 = j * step, y2 = (j + 1) * step;
          const [px1, py1] = distortPoint(x, y1);
          const [px2, py2] = distortPoint(x, y2);
          const dim = isScotomaCenter((px1 + px2) / 2, (py1 + py2) / 2);
          segments.push(<line key={`v-${i}-${j}`} x1={px1} y1={py1} x2={px2} y2={py2} stroke={dim ? '#1a1d2e' : 'rgba(255,255,255,0.75)'} strokeWidth="1" />);
        }
        return <g key={`v-${i}`}>{segments}</g>;
      })}
      {/* Horizontal lines */}
      {Array.from({ length: cells + 1 }, (_, i) => {
        const y = i * step;
        const segments = [];
        for (let j = 0; j < cells; j++) {
          const x1 = j * step, x2 = (j + 1) * step;
          const [px1, py1] = distortPoint(x1, y);
          const [px2, py2] = distortPoint(x2, y);
          const dim = isScotomaCenter((px1 + px2) / 2, (py1 + py2) / 2);
          segments.push(<line key={`h-${i}-${j}`} x1={px1} y1={py1} x2={px2} y2={py2} stroke={dim ? '#1a1d2e' : 'rgba(255,255,255,0.75)'} strokeWidth="1" />);
        }
        return <g key={`h-${i}`}>{segments}</g>;
      })}
      {/* Central fixation dot */}
      <circle cx={cx} cy={cy} r="3" fill="#FFE066" />
    </svg>
  );
};

// ══════════════════════════════════════════════════════════
// 6. ISHIHARA COLOR VISION
// ══════════════════════════════════════════════════════════
const IshiharaStation = ({ ext, onComplete, onLog }) => {
  const [currentEye, setCurrentEye] = React.useState('OD');
  const [plateIdx, setPlateIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({ OD: [], OS: [] });
  const [showResult, setShowResult] = React.useState(false);

  const plates = React.useMemo(() => getIshiharaSet(ext), [ext]);

  // Pre-generate dots per plate based on user's actual eye (deficit?)
  const eyeHasDeficit = (eye) => {
    const score = ext.colorVision[eye].correct || 0;
    return score < 9;
  };
  const plate = plates[plateIdx];
  // The "shown" plate depends on which eye is being tested
  const deficit = eyeHasDeficit(currentEye);
  const plateDots = React.useMemo(() => {
    // For deficit eye on hard plates, show "alternate" number (6/9 confusion) or none
    if (deficit && plateIdx >= 2) {
      // show ambiguous — patient may guess wrong
      return generateIshiharaPlate(plate.number, true);
    }
    return generateIshiharaPlate(plate.number, false);
  }, [plate, plateIdx, deficit]);

  const submitAnswer = (answer) => {
    const correctAnswer = String(plate.number);
    const isCorrect = String(answer) === correctAnswer;
    setAnswers(prev => ({ ...prev, [currentEye]: [...prev[currentEye], { plate: plate.number, answer, correct: isCorrect }] }));
    if (plateIdx < plates.length - 1) {
      setPlateIdx(plateIdx + 1);
    } else if (currentEye === 'OD') {
      setPlateIdx(0);
      setCurrentEye('OS');
    } else {
      setShowResult(true);
      onLog(`Ishihara — OD: ${ext.colorVision.OD.correct}/${ext.colorVision.OD.total} · OS: ${ext.colorVision.OS.correct}/${ext.colorVision.OS.total}`);
      onComplete();
    }
  };

  // Generate distractor options
  const optionPool = ['3', '5', '6', '8', '12', '29', '74', '?'];
  const options = React.useMemo(() => {
    const correct = String(plate.number);
    const distractors = optionPool.filter(o => o !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return [...distractors, correct].sort(() => Math.random() - 0.5);
  }, [plate]);

  return (
    <div>
      <SectionIntro icon="🎨" title="Color Vision — Ishihara Plates"
        sub="Show each plate at ~75 cm. Patient identifies the number. Test each eye separately." />

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ padding: '6px 14px', background: currentEye === 'OD' ? 'var(--primary-l)' : 'var(--surface-2)', borderRadius: 10, fontSize: 12, fontWeight: 700, color: currentEye === 'OD' ? 'var(--primary)' : 'var(--text-2)' }}>
          {showResult ? '✓ ' : '→ '}Testing OD
        </div>
        <div style={{ padding: '6px 14px', background: currentEye === 'OS' ? 'var(--primary-l)' : 'var(--surface-2)', borderRadius: 10, fontSize: 12, fontWeight: 700, color: currentEye === 'OS' ? 'var(--primary)' : 'var(--text-2)' }}>
          {showResult ? '✓ ' : ''}Testing OS
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          Plate {plateIdx + 1} / {plates.length}
        </div>
      </div>

      {!showResult && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <InstrumentFrame title={`Plate ${plateIdx + 1}`} style={{ flex: 1, minWidth: 280 }}>
            <div style={{ padding: 24, background: '#1a1d2e', textAlign: 'center' }}>
              <svg width="240" height="240" viewBox="0 0 200 200" style={{ borderRadius: '50%', background: '#FEFBF3' }}>
                <defs>
                  <clipPath id="plateClip">
                    <circle cx="100" cy="100" r="95" />
                  </clipPath>
                </defs>
                <g clipPath="url(#plateClip)">
                  {plateDots.map((d, i) => (
                    <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} />
                  ))}
                </g>
                <circle cx="100" cy="100" r="95" fill="none" stroke="#FEFBF3" strokeWidth="3" />
              </svg>
            </div>
          </InstrumentFrame>

          <InstrumentFrame title={`What does ${currentEye} see?`} style={{ width: 260 }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>Patient response options:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {options.map(o => (
                  <button key={o} onClick={() => submitAnswer(o)} style={{
                    padding: '14px 8px', borderRadius: 12, border: '1.5px solid var(--border)',
                    background: 'var(--surface)', cursor: 'pointer', fontFamily: 'Georgia',
                    fontSize: 20, fontWeight: 800, color: 'var(--text-1)',
                  }}>{o}</button>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--amber-l)', borderRadius: 8, fontSize: 10, color: 'var(--amber-d)' }}>
                💡 What the patient reports may differ from what the plate shows — choose based on their answer.
              </div>
            </div>
          </InstrumentFrame>
        </div>
      )}

      {showResult && (
        <div className="ab" style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
          ✓ Tes Ishihara selesai untuk kedua mata. Catat skor & interpretasi Anda di Logbook (di bawah).
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// 7. TONOMETRY — Goldmann Applanation
// ══════════════════════════════════════════════════════════
const TonometryStation = ({ findings, onComplete, onLog }) => {
  const [eye, setEye] = React.useState('OD');
  const [pressure, setPressure] = React.useState(15);
  const [measured, setMeasured] = React.useState({ OD: false, OS: false });
  const [mode, setMode] = React.useState('aligning'); // aligning | measured

  const targetOD = parseIOPNum(findings.IOP.OD) || 15;
  const targetOS = parseIOPNum(findings.IOP.OS) || 15;
  const target = eye === 'OD' ? targetOD : targetOS;

  const recordPressure = () => {
    setMeasured(prev => ({ ...prev, [eye]: true }));
    setMode('measured');
    onLog(`IOP ${eye}: ${target} mmHg${target > 21 ? ' ⚠️ ELEVATED' : target < 10 ? ' ⚠️ LOW' : ''}`);
  };

  React.useEffect(() => {
    if (measured.OD && measured.OS) onComplete();
  }, [measured, onComplete]);

  const switchEye = (e) => {
    setEye(e);
    setMode('aligning');
    setPressure(15);
  };

  // Mires alignment: how close pressure is to target
  // When pressure < target, mires are apart; when = target, mires just touch
  const offset = pressure - target; // negative = apart, positive = overlapped
  const aligned = Math.abs(offset) < 0.5;

  return (
    <div>
      <SectionIntro icon="📊" title="Goldmann Applanation Tonometry"
        sub="Apply tonometer prism to the cornea. Adjust the dial until the inner edges of the two semicircular mires just touch." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {['OD','OS'].map(e => (
          <Btn key={e} variant={eye === e ? 'primary' : 'secondary'} size="sm" onClick={() => switchEye(e)}>
            {measured[e] ? '✓ ' : '→ '}Measure {e}
          </Btn>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Mires view */}
        <InstrumentFrame title={`Slit Lamp View — ${eye} (cobalt blue + fluorescein)`} dark style={{ flex: 1, minWidth: 360 }}>
          <div style={{ padding: 24, background: 'radial-gradient(circle at center, #0A1530 0%, #02060F 100%)' }}>
            <svg width="100%" height="280" viewBox="0 0 360 280" style={{ display: 'block' }}>
              <defs>
                <radialGradient id="cobaltBg" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#1A4080" />
                  <stop offset="100%" stopColor="#000814" />
                </radialGradient>
                <radialGradient id="miresGlow">
                  <stop offset="0%" stopColor="#5BFF7F" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#5BFF7F" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Field */}
              <circle cx="180" cy="140" r="125" fill="url(#cobaltBg)" />
              {/* Cornea outline */}
              <circle cx="180" cy="140" r="115" fill="none" stroke="rgba(91,255,127,0.15)" strokeWidth="1" />

              {/* Two semicircle mires */}
              <g style={{ transition: 'transform 0.3s ease' }}>
                {/* Left mire (upper) */}
                <path d={`M ${110 - offset * 3} 120 A 30 30 0 0 1 ${170 - offset * 3} 120 L ${170 - offset * 3} 120 Z`}
                  fill="#5BFF7F" opacity="0.85" filter="blur(0.6px)" />
                {/* Right mire (lower) */}
                <path d={`M ${190 + offset * 3} 160 A 30 30 0 0 0 ${250 + offset * 3} 160 L ${250 + offset * 3} 160 Z`}
                  fill="#5BFF7F" opacity="0.85" filter="blur(0.6px)" />
              </g>

              {/* Alignment indicator */}
              {aligned && (
                <g>
                  <circle cx="180" cy="140" r="50" fill="none" stroke="#5BFF7F" strokeWidth="1.5" opacity="0.5" style={{ animation: 'pulse 1.2s infinite' }} />
                  <text x="180" y="220" textAnchor="middle" fill="#5BFF7F" fontSize="11" fontWeight="700" fontFamily="Poppins">● ALIGNED — read pressure</text>
                </g>
              )}
              {!aligned && (
                <text x="180" y="220" textAnchor="middle" fill="rgba(91,255,127,0.6)" fontSize="10" fontFamily="Poppins">
                  {offset < 0 ? '↑ increase pressure' : '↓ decrease pressure'}
                </text>
              )}
            </svg>
          </div>
        </InstrumentFrame>

        {/* Dial */}
        <InstrumentFrame title="Pressure Dial" style={{ width: 240 }}>
          <div style={{ padding: 16, textAlign: 'center' }}>
            <div style={{
              fontSize: 56, fontWeight: 800, fontFamily: 'Georgia', lineHeight: 1,
              color: aligned ? 'var(--green)' : 'var(--text-1)',
              transition: 'color 0.3s',
            }}>{pressure.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>mmHg</div>

            <input type="range" min="6" max="50" step="0.5" value={pressure}
              onChange={(e) => setPressure(parseFloat(e.target.value))}
              style={{
                width: '100%', marginTop: 16, accentColor: 'var(--primary)',
                cursor: 'pointer',
              }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
              <span>6</span><span>21</span><span>50</span>
            </div>

            <Btn variant="primary" size="sm" onClick={recordPressure}
              disabled={!aligned || measured[eye]}
              style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              {measured[eye] ? '✓ Recorded' : aligned ? 'Record Pressure' : 'Align mires first'}
            </Btn>
          </div>
        </InstrumentFrame>
      </div>

      {/* Recorded readings — raw mmHg only (student reads from dial), no verdict text */}
      {(measured.OD || measured.OS) && (
        <div className="ab" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {['OD','OS'].map(e => {
            if (!measured[e]) return null;
            const val = e === 'OD' ? targetOD : targetOS;
            return (
              <div key={e} style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>{e}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)' }}>
                  {val} mmHg
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>
                  Catat & interpretasikan di Logbook.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  EOMStation, ConfrontationStation, AmslerStation,
  IshiharaStation, TonometryStation, AmslerGridSVG,
});
