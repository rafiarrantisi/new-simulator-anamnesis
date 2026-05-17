// ============================================================
// OphthaSim — Ocular Examination Screen V2
// Full clinical exam workflow across 11 interactive stations.
// ============================================================

// Keep legacy FundoscopyView referenced from other files
const FUNDOSCOPY_TYPES = {
  normal:           { label: 'Normal Fundus',                   bg: ['#C44B1A','#A83A12'], disc: '#F5DEB3', cup: '#FFE4B5', vessels: '#7B0000', pathology: null },
  'retinal-detachment': { label: 'Retinal Detachment',          bg: ['#C44B1A','#A83A12'], disc: '#F5DEB3', cup: '#FFE4B5', vessels: '#7B0000', pathology: 'rd' },
  uveitis:          { label: 'Vitreous Haze',                   bg: ['#9B3A14','#7A2D0E'], disc: '#D4B896', cup: '#E8C9A0', vessels: '#6B0000', pathology: 'haze' },
  crvo:             { label: 'Central Retinal Vein Occlusion', bg: ['#B53D17','#8B2E10'], disc: '#F5DEB3', cup: '#FFE4B5', vessels: '#8B0000', pathology: 'crvo' },
  glaucoma:         { label: 'Glaucomatous Disc',              bg: ['#9A4420','#7A3310'], disc: '#E8D4A0', cup: '#F0DFB0', vessels: '#6B0000', pathology: 'glaucoma' },
  'optic-neuritis': { label: 'Disc Oedema',                    bg: ['#C44B1A','#A83A12'], disc: '#FFF0D0', cup: null, vessels: '#7B0000', pathology: 'optic-neuritis' },
  diabetic:         { label: 'Diabetic Retinopathy',           bg: ['#B84020','#A03318'], disc: '#F5DEB3', cup: '#FFE4B5', vessels: '#7B0000', pathology: 'diabetic' }
};

const EXAM_STATIONS = [
  { id: 'va',         label: 'Visual Acuity',     icon: '👁', group: 'Basic',     short: 'VA' },
  { id: 'pupil',      label: 'Pupils + RAPD',     icon: '🔦', group: 'Basic',     short: 'Pupil' },
  { id: 'eom',        label: 'Ocular Motility',   icon: '↕',  group: 'Basic',     short: 'EOM' },
  { id: 'vf',         label: 'Visual Field',      icon: '◐',  group: 'Basic',     short: 'VF' },
  { id: 'amsler',     label: 'Amsler Grid',       icon: '▦',  group: 'Basic',     short: 'Amsler' },
  { id: 'color',      label: 'Color (Ishihara)',  icon: '🎨', group: 'Sensory',   short: 'Color' },
  { id: 'slitlamp',   label: 'Slit Lamp',         icon: '🔬', group: 'Anterior',  short: 'Slit' },
  { id: 'fluor',      label: 'Fluorescein',       icon: '🟢', group: 'Anterior',  short: 'Fluor' },
  { id: 'iop',        label: 'Tonometry (IOP)',   icon: '📊', group: 'Anterior',  short: 'IOP' },
  { id: 'fundus',     label: 'Fundoscopy',        icon: '🔴', group: 'Posterior', short: 'Fundus' },
  { id: 'oct',        label: 'OCT',               icon: '📈', group: 'Posterior', short: 'OCT' },
];

const OcularExamScreen = ({ caseData, session, onDiagnose, onBack, mode = 'normal' }) => {
  const findings = EXAM_FINDINGS[caseData.id];

  // If no exam data exists, skip gracefully
  if (!findings) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔬</div>
        <h3 style={{ marginBottom: 8 }}>No examination data for this case</h3>
        <p style={{ marginBottom: 20 }}>Skipping to debrief.</p>
        <Btn variant="primary" onClick={() => onDiagnose({ skipped: true })}>Continue to Debrief →</Btn>
      </div>
    );
  }

  const ext = getExamExtension(caseData.id, caseData);
  const isOSCE = mode === 'osce';

  const [activeId, setActiveId] = React.useState('va');
  const [completed, setCompleted] = React.useState(new Set());
  const [findingsLog, setFindingsLog] = React.useState([]);
  const [diagnosisPhase, setDiagnosisPhase] = React.useState(false);
  const [selectedPrimary, setSelectedPrimary] = React.useState(null);
  const [selectedDifferentials, setSelectedDifferentials] = React.useState(new Set());
  const [submitted, setSubmitted] = React.useState(false);
  // Track which stations the student has visually performed (saw the visual reveal)
  const [performedStations, setPerformedStations] = React.useState(new Set());
  // Manual entries grouped by station (this is what populates findingsLog)
  const [userEntries, setUserEntries] = React.useState({}); // {stationId: [{text, time, evaluation}]}

  // Auto-logs from stations are SUPPRESSED — they only mark "performed" silently.
  // The findings logbook is populated exclusively from manual entries.
  const noopLog = React.useCallback((entry) => {
    // Silent — only used to mark station as "performed" so manual entry unlocks.
    setPerformedStations(prev => new Set([...prev, activeId]));
  }, [activeId]);

  // Mark station as PERFORMED (sub-tests done, ready for manual entry).
  // Station is only COMPLETED when user clicks "Selesai Stasiun Ini ✓" after entering findings.
  const markPerformed = React.useCallback((id) => {
    setPerformedStations(prev => new Set([...prev, id]));
  }, []);

  // User saves a manual finding for the current station
  const saveManualEntry = React.useCallback((stationId, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    // Evaluate against ground truth using the OSCE scoring helper (if available)
    const truth = getStationGroundTruth(stationId, findings, ext, caseData);
    const evaluation = (typeof evaluateExamFinding === 'function')
      ? evaluateExamFinding(trimmed, truth)
      : { match: 'unknown', score: 0.5, feedback: '' };

    const entry = { text: trimmed, time: Date.now(), station: stationId, evaluation, truth };
    setUserEntries(prev => ({ ...prev, [stationId]: [...(prev[stationId] || []), entry] }));
    setFindingsLog(prev => [entry, ...prev]);
  }, [findings, ext, caseData]);

  const removeEntry = (stationId, idx) => {
    setUserEntries(prev => {
      const list = (prev[stationId] || []).filter((_, i) => i !== idx);
      return { ...prev, [stationId]: list };
    });
    setFindingsLog(prev => prev.filter(e => !(e.station === stationId && e.text === userEntries[stationId]?.[idx]?.text)));
  };

  const completeStation = React.useCallback((id) => {
    setCompleted(prev => new Set([...prev, id]));
  }, []);

  // Sidebar groups
  const groupedStations = [
    { group: 'Basic',     icon: '✓', items: EXAM_STATIONS.filter(s => s.group === 'Basic') },
    { group: 'Sensory',   icon: '🎨', items: EXAM_STATIONS.filter(s => s.group === 'Sensory') },
    { group: 'Anterior',  icon: '🔬', items: EXAM_STATIONS.filter(s => s.group === 'Anterior') },
    { group: 'Posterior', icon: '🔴', items: EXAM_STATIONS.filter(s => s.group === 'Posterior') },
  ];

  const isStationRelevant = (id) => {
    if (id === 'oct') return !!(findings.oct || ext.oct);
    if (id === 'amsler') return true;
    return true;
  };
  const relevantCount = EXAM_STATIONS.filter(s => isStationRelevant(s.id)).length;
  const completedRelevant = [...completed].filter(id => isStationRelevant(id)).length;

  const canDiagnose = completedRelevant >= Math.min(relevantCount, 7);

  // Diagnosis options
  const dxOptions = findings.diagnosis_options || [];
  const correctDx = dxOptions[findings.correct_diagnosis_index];

  const submitDiagnosis = () => {
    setSubmitted(true);
    const isCorrect = selectedPrimary === correctDx;
    setTimeout(() => {
      onDiagnose({
        selectedDiagnosis: selectedPrimary,
        differentials: [...selectedDifferentials],
        isCorrect,
        findingsLog,
        userEntries,
        examCompleted: completedRelevant,
      });
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 112px)', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Left Sidebar — station nav ──────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 16px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Examination
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {groupedStations.map(grp => (
            <div key={grp.group} style={{ marginBottom: 8 }}>
              <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {grp.group}
              </div>
              {grp.items.map(s => {
                if (!isStationRelevant(s.id)) return null;
                const isActive = activeId === s.id;
                const isDone = completed.has(s.id);
                return (
                  <button key={s.id} onClick={() => setActiveId(s.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, border: 'none',
                    background: isActive ? 'var(--primary-l)' : 'transparent',
                    color: isActive ? 'var(--primary)' : isDone ? 'var(--green)' : 'var(--text-2)',
                    fontFamily: 'Poppins', fontSize: 12, fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span style={{ flex: 1 }}>{s.label}</span>
                    {isDone && <span style={{ fontSize: 11 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Progress + diagnose button */}
        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
          <ProgressBar value={completedRelevant} max={relevantCount} color="var(--teal)" height={5} label={`${completedRelevant}/${relevantCount} Stations`} />
          {canDiagnose && !diagnosisPhase && (
            <Btn variant="teal" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={() => setDiagnosisPhase(true)}>
              Formulate Diagnosis →
            </Btn>
          )}
          {!canDiagnose && (
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>
              Complete {Math.min(7, relevantCount) - completedRelevant} more stations to formulate diagnosis
            </div>
          )}
        </div>
      </aside>

      {/* ── Main work area ──────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', position: 'relative' }}>

        {/* Diagnosis phase */}
        {diagnosisPhase && !submitted && (
          <DiagnosisPanel
            dxOptions={dxOptions}
            selectedPrimary={selectedPrimary}
            onSelectPrimary={setSelectedPrimary}
            selectedDifferentials={selectedDifferentials}
            onToggleDifferential={(d) => {
              setSelectedDifferentials(prev => {
                const next = new Set(prev);
                if (next.has(d)) next.delete(d); else if (next.size < 2) next.add(d);
                return next;
              });
            }}
            findings={findings}
            findingsLog={findingsLog}
            onCancel={() => setDiagnosisPhase(false)}
            onSubmit={submitDiagnosis}
          />
        )}

        {submitted && (
          <div className="ab" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 400, gap: 16,
          }}>
            <div style={{ fontSize: 64 }}>{selectedPrimary === correctDx ? '✅' : '📋'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Diagnosis submitted</h2>
            <p style={{ color: 'var(--text-2)' }}>Preparing your debrief…</p>
            <LoadingDots />
          </div>
        )}

        {!diagnosisPhase && !submitted && (
          <div key={activeId} className="au">
            {/* Station header context */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 18, padding: '10px 14px',
              background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                <span>Patient: <strong style={{ color: 'var(--text-1)' }}>{caseData.patientProfile.name}</strong></span>
                <span>·</span>
                <span>Affected eye: <strong style={{ color: ext.affectedEye === 'OS' ? 'var(--primary)' : ext.affectedEye === 'OU' ? 'var(--violet)' : 'var(--amber)' }}>{ext.affectedEye === 'OU' ? 'Both' : ext.affectedEye}</strong></span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Station {EXAM_STATIONS.findIndex(s => s.id === activeId) + 1} / {relevantCount}
              </div>
            </div>

            {/* Active station ── Phase 1 MVP V3 stations active for 5 priorities ── */}
            {activeId === 'va' && (
              (typeof VisualAcuityStationV3 !== 'undefined') ? (
                <VisualAcuityStationV3 findings={findings}
                  onComplete={() => markPerformed('va')} onLog={noopLog} />
              ) : (
                <VisualAcuityStation findings={findings}
                  onComplete={() => markPerformed('va')} onLog={noopLog} />
              )
            )}
            {activeId === 'pupil' && (
              (typeof PupilStationV3 !== 'undefined') ? (
                <PupilStationV3 ext={ext}
                  onComplete={() => markPerformed('pupil')} onLog={noopLog} />
              ) : (
                <PupillaryStation ext={ext}
                  onComplete={() => markPerformed('pupil')} onLog={noopLog} />
              )
            )}
            {activeId === 'eom' && (
              <EOMStation ext={ext}
                onComplete={() => markPerformed('eom')} onLog={noopLog} />
            )}
            {activeId === 'vf' && (
              <ConfrontationStation ext={ext}
                onComplete={() => markPerformed('vf')} onLog={noopLog} />
            )}
            {activeId === 'amsler' && (
              <AmslerStation ext={ext}
                onComplete={() => markPerformed('amsler')} onLog={noopLog} />
            )}
            {activeId === 'color' && (
              <IshiharaStation ext={ext}
                onComplete={() => markPerformed('color')} onLog={noopLog} />
            )}
            {activeId === 'slitlamp' && (
              (typeof SlitLampStationV3 !== 'undefined') ? (
                <SlitLampStationV3 findings={findings} ext={ext} caseId={caseData.id}
                  onComplete={() => markPerformed('slitlamp')} onLog={noopLog} />
              ) : (
                <SlitLampStation findings={findings} ext={ext} caseId={caseData.id}
                  onComplete={() => markPerformed('slitlamp')} onLog={noopLog} />
              )
            )}
            {activeId === 'fluor' && (
              <FluoresceinStation ext={ext}
                onComplete={() => markPerformed('fluor')} onLog={noopLog} />
            )}
            {activeId === 'iop' && (
              (typeof TonometryStationV3 !== 'undefined') ? (
                <TonometryStationV3 findings={findings}
                  onComplete={() => markPerformed('iop')} onLog={noopLog} />
              ) : (
                <TonometryStation findings={findings}
                  onComplete={() => markPerformed('iop')} onLog={noopLog} />
              )
            )}
            {activeId === 'fundus' && (
              (typeof FundoscopyStationV3 !== 'undefined') ? (
                <FundoscopyStationV3 findings={findings} ext={ext} caseId={caseData.id}
                  onComplete={() => markPerformed('fundus')} onLog={noopLog} />
              ) : (
                <FundoscopyStationV2 findings={findings} ext={ext} caseId={caseData.id}
                  onComplete={() => markPerformed('fundus')} onLog={noopLog} />
              )
            )}
            {activeId === 'oct' && (
              <OCTStation findings={findings} ext={ext}
                onComplete={() => markPerformed('oct')} onLog={noopLog} />
            )}

            {/* Manual finding entry (per OSCE_RUBRIC.md §H) */}
            <ManualFindingForm
              stationId={activeId}
              mode={mode}
              entries={userEntries[activeId] || []}
              onSave={saveManualEntry}
              onRemove={removeEntry}
              onMarkComplete={completeStation}
              stationCompleted={completed.has(activeId)}
              hasPerformed={performedStations.has(activeId)}
            />

            {/* Next station nav */}
            {completed.has(activeId) && (
              <div className="ab" style={{
                marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 14, background: 'var(--green-l)', borderRadius: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Station complete</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Continue to the next examination station</div>
                  </div>
                </div>
                <NextStationButton activeId={activeId} completed={completed} isRelevant={isStationRelevant}
                  onPick={setActiveId} onDiagnose={() => setDiagnosisPhase(true)} canDiagnose={canDiagnose} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Right Findings Log ───────── */}
      <aside style={{
        width: 280, flexShrink: 0, background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Findings Logbook</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Catatan klinis manual</div>
          </div>
          <div style={{
            padding: '3px 9px', background: 'var(--primary-l)', borderRadius: 8,
            fontSize: 10, fontWeight: 700, color: 'var(--primary)',
          }}>{findingsLog.length}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {findingsLog.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 11 }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📝</div>
              <div style={{ marginBottom: 4 }}>Belum ada catatan.</div>
              <div style={{ fontSize: 10, lineHeight: 1.5 }}>Lakukan pemeriksaan di stasiun aktif, lalu tulis temuan Anda di form bawah area pemeriksaan.</div>
            </div>
          )}
          {findingsLog.map((f, i) => {
            const station = EXAM_STATIONS.find(s => s.id === f.station);
            const isRedFlag = String(f.text || '').toLowerCase().match(/(curtain|rapd|hypopyon|infiltrate|edema|detach|62 mmhg|severe|emergency|🚨|⚠)/);
            return (
              <div key={i} className={i === 0 ? 'ab' : ''} style={{
                padding: '8px 10px', borderRadius: 10, marginBottom: 6,
                background: isRedFlag ? 'var(--red-l)' : 'var(--surface-2)',
                border: `1px solid ${isRedFlag ? 'var(--red)25' : 'transparent'}`,
                fontSize: 11,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: isRedFlag ? 'var(--red-d)' : 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {station?.icon} {station?.short || f.station}
                  </span>
                </div>
                <div style={{ color: 'var(--text-1)', lineHeight: 1.4 }}>{f.text || f.entry}</div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// Next-Station Smart Button
// ══════════════════════════════════════════════════════════
const NextStationButton = ({ activeId, completed, isRelevant, onPick, onDiagnose, canDiagnose }) => {
  // Find next station not yet completed
  const allIds = EXAM_STATIONS.filter(s => isRelevant(s.id)).map(s => s.id);
  const currentIdx = allIds.indexOf(activeId);
  // Try next, wrap
  let nextId = null;
  for (let i = 1; i <= allIds.length; i++) {
    const idx = (currentIdx + i) % allIds.length;
    if (!completed.has(allIds[idx])) { nextId = allIds[idx]; break; }
  }
  if (!nextId && canDiagnose) {
    return <Btn variant="teal" size="sm" onClick={onDiagnose}>All stations complete → Formulate Diagnosis</Btn>;
  }
  if (!nextId) return null;
  const nextStation = EXAM_STATIONS.find(s => s.id === nextId);
  return (
    <Btn variant="primary" size="sm" onClick={() => onPick(nextId)}>
      Next: {nextStation.icon} {nextStation.label} →
    </Btn>
  );
};

// ══════════════════════════════════════════════════════════
// Diagnosis Panel
// ══════════════════════════════════════════════════════════
const DiagnosisPanel = ({ dxOptions, selectedPrimary, onSelectPrimary, selectedDifferentials, onToggleDifferential, findings, findingsLog, onCancel, onSubmit }) => {
  const [shuffled] = React.useState(() => [...dxOptions].sort(() => Math.random() - 0.5));
  const canSubmit = selectedPrimary;

  return (
    <div className="au">
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-l) 0%, var(--primary-ll) 100%)',
        borderRadius: 20, padding: 24, marginBottom: 16, border: '1.5px solid var(--primary)30',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🧠</span>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Clinical Reasoning</h2>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
          Based on history, examination findings, and investigations — formulate your diagnosis.
          Select <strong>1 primary diagnosis</strong> and up to <strong>2 differentials</strong> you'd consider.
        </p>
      </div>

      {/* Findings summary */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Examination Recap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          <ReviewCell label="VA (OD)" value={findings.visualAcuity.OD} />
          <ReviewCell label="VA (OS)" value={findings.visualAcuity.OS} />
          <ReviewCell label="IOP (OD)" value={findings.IOP.OD} />
          <ReviewCell label="IOP (OS)" value={findings.IOP.OS} />
          <ReviewCell label="Fundus" value={FUNDOSCOPY_TYPES[findings.fundoscopyType]?.label || '—'} />
        </div>
      </div>

      {/* Primary diagnosis */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 18, marginBottom: 14, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: 'var(--primary)', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</span>
          Primary Diagnosis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffled.map((opt, i) => {
            const isSelected = selectedPrimary === opt;
            const isDifferential = selectedDifferentials.has(opt);
            return (
              <button key={opt} onClick={() => onSelectPrimary(opt)} disabled={isDifferential} style={{
                padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                background: isSelected ? 'var(--primary-l)' : 'var(--surface)',
                color: isSelected ? 'var(--primary)' : isDifferential ? 'var(--text-3)' : 'var(--text-1)',
                fontFamily: 'Poppins', fontSize: 13, fontWeight: isSelected ? 700 : 500,
                cursor: isDifferential ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                opacity: isDifferential ? 0.5 : 1,
              }}>
                <span style={{
                  display: 'inline-block', width: 24, marginRight: 8,
                  color: isSelected ? 'var(--primary)' : 'var(--text-3)',
                  fontWeight: 700,
                }}>{String.fromCharCode(65 + i)}.</span>
                {opt}
                {isDifferential && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-3)' }}>(in differentials)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Differentials */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 18, marginBottom: 18, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: 'var(--amber)', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</span>
          Differential Diagnoses (up to 2)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {shuffled.map(opt => {
            const isDiff = selectedDifferentials.has(opt);
            const isPrimary = selectedPrimary === opt;
            const disabled = isPrimary || (selectedDifferentials.size >= 2 && !isDiff);
            return (
              <button key={opt} onClick={() => onToggleDifferential(opt)} disabled={disabled} style={{
                padding: '8px 14px', borderRadius: 999,
                border: `1.5px solid ${isDiff ? 'var(--amber)' : 'var(--border)'}`,
                background: isDiff ? 'var(--amber-l)' : 'var(--surface)',
                color: isDiff ? 'var(--amber-d)' : isPrimary ? 'var(--text-3)' : 'var(--text-2)',
                fontFamily: 'Poppins', fontSize: 11, fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
              }}>
                {isDiff && '✓ '}{opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <Btn variant="secondary" onClick={onCancel}>← Back to Exam</Btn>
        <Btn variant="primary" disabled={!canSubmit} onClick={onSubmit}>
          Submit Diagnosis → Debrief
        </Btn>
      </div>
    </div>
  );
};

const ReviewCell = ({ label, value }) => (
  <div style={{
    padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 10,
  }}>
    <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{value}</div>
  </div>
);

// ══════════════════════════════════════════════════════════
// Manual Finding Entry Form — student transcribes observations
// Per OSCE_RUBRIC.md §H — findings logbook tidak auto-fill
// ══════════════════════════════════════════════════════════
const ManualFindingForm = ({ stationId, mode, entries, onSave, onRemove, onMarkComplete, stationCompleted, hasPerformed }) => {
  const [text, setText] = React.useState('');
  const station = EXAM_STATIONS.find(s => s.id === stationId);
  const isOSCE = mode === 'osce';
  const hint = (typeof STATION_HINTS !== 'undefined') ? STATION_HINTS[stationId] : null;

  const handleSave = () => {
    if (!text.trim()) return;
    onSave(stationId, text);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div style={{
      marginTop: 24,
      padding: 18,
      background: 'var(--surface)',
      borderRadius: 16,
      border: '2px solid var(--primary)30',
      boxShadow: 'var(--sh-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>📝</span>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
          Catat Temuan Anda — {station?.label}
        </h3>
        {stationCompleted && (
          <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--green-l)', color: 'var(--green)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
            ✓ Sudah dicatat
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
        {hasPerformed
          ? 'Tulis apa yang Anda observasi dari instrumen di atas. Gunakan terminologi klinis. Ini akan masuk ke logbook.'
          : 'Lakukan pemeriksaan dulu di atas → setelah Anda mendapat data, catat temuan di sini.'}
      </div>

      {/* Hint — hanya di normal/tutorial */}
      {!isOSCE && hint && (
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '8px 12px',
          fontSize: 11, color: 'var(--text-2)', marginBottom: 12, fontStyle: 'italic',
          borderLeft: '3px solid var(--amber)',
        }}>
          💡 {hint}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Mis: OD 6/6, OS 6/9 — turun mild. Pinhole tidak improve."
        rows={3}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 12,
          border: '1.5px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins',
          outline: 'none', resize: 'vertical', lineHeight: 1.5,
          transition: 'border-color 0.18s, box-shadow 0.18s',
          minHeight: 70,
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
          Tip: Ctrl/⌘+Enter untuk simpan cepat
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={handleSave} disabled={!text.trim()}>
            + Tambah ke Logbook
          </Btn>
          {entries.length > 0 && !stationCompleted && (
            <Btn variant="primary" size="sm" onClick={() => onMarkComplete(stationId)}>
              Selesai Stasiun Ini ✓
            </Btn>
          )}
        </div>
      </div>

      {/* Entries for this station */}
      {entries.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Catatan untuk stasiun ini ({entries.length})
          </div>
          {entries.map((e, i) => (
            <div key={i} style={{
              padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 10,
              marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4 }}>{e.text}</div>
              <button onClick={() => onRemove(stationId, i)} style={{
                background: 'none', border: 'none', color: 'var(--text-3)',
                cursor: 'pointer', fontSize: 12, padding: 0,
              }} title="Hapus">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper: extract ground truth string for a station (used for evaluation)
function getStationGroundTruth(stationId, findings, ext, caseData) {
  switch (stationId) {
    case 'va':       return `OD ${findings.visualAcuity.OD}, OS ${findings.visualAcuity.OS}`;
    case 'pupil':    return ext.pupils?.notes || (ext.pupils?.RAPD ? `RAPD positive ${ext.pupils.RAPD}` : 'PERRL no RAPD');
    case 'eom':      return ext.motility?.notes || (ext.motility?.full ? 'Full EOM no limitation' : 'Limited');
    case 'vf':       return `OD ${ext.confrontation?.OD} OS ${ext.confrontation?.OS}`;
    case 'amsler':   return `OD ${ext.amsler?.OD} OS ${ext.amsler?.OS}`;
    case 'color':    return `Ishihara OD ${ext.colorVision?.OD.correct}/${ext.colorVision?.OD.total} OS ${ext.colorVision?.OS.correct}/${ext.colorVision?.OS.total}`;
    case 'slitlamp': return Object.values(findings.anteriorSegment || {}).join(' ');
    case 'fluor':    return ext.fluorescein || '';
    case 'iop':      return `OD ${findings.IOP.OD} OS ${findings.IOP.OS}`;
    case 'fundus':   return (FUNDOSCOPY_TYPES[findings.fundoscopyType]?.label || 'normal') + ' ' + (ext.fundusFindings || '');
    case 'oct':      return ext.oct?.findings || (findings.oct ? findings.oct.findings : '');
    default:         return '';
  }
}

// Re-export legacy FundoscopyView for backwards compatibility (if anything still uses it)
const FundoscopyView = ({ type = 'normal', size = 260, revealed = false }) => {
  const cfg = FUNDOSCOPY_TYPES[type] || FUNDOSCOPY_TYPES.normal;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  return (
    <div style={{ borderRadius: '50%', overflow: 'hidden', filter: revealed ? 'none' : 'blur(8px)', transition: 'filter 1.2s ease' }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id={`legRetBg-${size}`} cx="55%" cy="45%">
            <stop offset="0%" stopColor={cfg.bg[0]} />
            <stop offset="100%" stopColor={cfg.bg[1]} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={`url(#legRetBg-${size})`} />
        <ellipse cx={cx+28} cy={cy} rx={22} ry={28} fill={cfg.disc} />
        {cfg.cup && <ellipse cx={cx+28} cy={cy} rx={9} ry={13} fill={cfg.cup} />}
        <circle cx={cx-36} cy={cy+4} r={5} fill="#8B5A00" opacity="0.5" />
      </svg>
    </div>
  );
};

Object.assign(window, {
  OcularExamScreen, FundoscopyView, FUNDOSCOPY_TYPES,
  EXAM_STATIONS, DiagnosisPanel, ManualFindingForm,
  getStationGroundTruth,
});
