// ============================================================
// OphthaSim — Case Builder (Custom Case Creator)
// ============================================================

const BUILDER_DOMAINS = [
  'laterality','onset','duration','pain','redness','photophobia',
  'visual_acuity','floaters','flashes','visual_field','discharge',
  'trauma','contact_lens','history','medication','headache',
  'diplopia','systemic','surgical'
];

const DOMAIN_LABELS = {
  laterality:'Laterality', onset:'Onset', duration:'Duration',
  pain:'Pain', redness:'Redness', photophobia:'Photophobia',
  visual_acuity:'Visual Acuity', floaters:'Floaters', flashes:'Flashes',
  visual_field:'Visual Field', discharge:'Discharge', trauma:'Trauma',
  contact_lens:'Contact Lens', history:'Eye History', medication:'Medications',
  headache:'Headache', diplopia:'Diplopia', systemic:'Systemic Disease',
  surgical:'Surgery History'
};

const ACCENT_COLORS = [
  { color:'#5865F2', light:'#EEF0FE', name:'Indigo' },
  { color:'#EF4444', light:'#FEE2E2', name:'Red' },
  { color:'#F59E0B', light:'#FEF3C7', name:'Amber' },
  { color:'#14B8A6', light:'#CCFBF1', name:'Teal' },
  { color:'#8B5CF6', light:'#EDE9FE', name:'Violet' },
  { color:'#34D399', light:'#D1FAE5', name:'Mint' },
  { color:'#38BDF8', light:'#E0F2FE', name:'Sky' },
  { color:'#DC2626', light:'#FEE2E2', name:'Rose' },
];

const PATIENT_TONES = ['cooperative','anxious','worried','tired','pain-affected'];

function makeEmptyCase() {
  const id = 'custom-' + Date.now();
  const responses = {};
  BUILDER_DOMAINS.forEach(d => {
    responses[d] = { text: '', found: '', isRedFlag: false };
  });
  responses['default'] = { text: "I'm not sure about that. Could you be more specific?", found: null, isRedFlag: false };
  return {
    id,
    title: '',
    category: '',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10–15 min',
    tags: [],
    chiefComplaint: '',
    synopsis: '',
    learningGoals: [''],
    patientProfile: { name: '', age: 30, gender: 'Female', occupation: '' },
    patientTone: 'cooperative',
    accentColor: '#5865F2',
    accentLight: '#EEF0FE',
    orbColor: '#5865F2',
    correctDiagnosis: '',
    keyDomains: [],
    criticalDomains: [],
    responses,
    isCustom: true,
  };
}

// ── Step 1: Basic Info ────────────────────────────────────
const BuilderStep1 = ({ draft, onChange }) => {
  const InputRow = ({ label, name, value, placeholder, type = 'text', required }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1.5px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <InputRow label="Case Title" name="title" value={draft.title} placeholder="e.g. Red Eye with Discharge" required />
          <InputRow label="Clinical Category" name="category" value={draft.category} placeholder="e.g. Red Eye / Glaucoma" required />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Difficulty</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Easy',1],['Medium',2],['Hard',3]].map(([lbl, lvl]) => (
                <button key={lbl} onClick={() => { onChange('difficulty', lbl); onChange('difficultyLevel', lvl); }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 9, fontFamily: 'Poppins', fontSize: 12, fontWeight: 600,
                    background: draft.difficulty === lbl ? (lbl === 'Easy' ? 'var(--green-l)' : lbl === 'Medium' ? 'var(--amber-l)' : 'var(--red-l)') : 'var(--surface-2)',
                    color: draft.difficulty === lbl ? (lbl === 'Easy' ? 'var(--green)' : lbl === 'Medium' ? 'var(--amber)' : 'var(--red)') : 'var(--text-3)',
                    border: `1.5px solid ${draft.difficulty === lbl ? 'currentColor' : 'var(--border)'}20`,
                    cursor: 'pointer',
                  }}>{lbl}</button>
              ))}
            </div>
          </div>
          <InputRow label="Estimated Time" name="estimatedTime" value={draft.estimatedTime} placeholder="e.g. 10–15 min" />
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Chief Complaint <span style={{ color: 'var(--red)' }}>*</span></label>
            <textarea value={draft.chiefComplaint} onChange={e => onChange('chiefComplaint', e.target.value)}
              placeholder={'"My eye has been red since yesterday."'}
              rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins',
                outline: 'none', resize: 'vertical',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Synopsis</label>
            <textarea value={draft.synopsis} onChange={e => onChange('synopsis', e.target.value)}
              placeholder="Brief clinical synopsis of this case..."
              rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins',
                outline: 'none', resize: 'vertical',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <InputRow label="Correct Diagnosis" name="correctDiagnosis" value={draft.correctDiagnosis} placeholder="e.g. Bacterial Conjunctivitis" required />
        </div>
      </div>

      {/* Accent color */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Case Accent Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ACCENT_COLORS.map(ac => (
            <button key={ac.color} title={ac.name}
              onClick={() => { onChange('accentColor', ac.color); onChange('accentLight', ac.light); onChange('orbColor', ac.color); }}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: ac.color, cursor: 'pointer',
                boxShadow: draft.accentColor === ac.color ? `0 0 0 3px ${ac.color}60, 0 0 0 5px white` : 'none',
                transform: draft.accentColor === ac.color ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s',
              }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Step 2: Patient Profile ───────────────────────────────
const BuilderStep2 = ({ draft, onChange }) => {
  const updateProfile = (key, val) => onChange('patientProfile', { ...draft.patientProfile, [key]: val });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          {[['name','Patient Name','e.g. Sarah K.'],['occupation','Occupation','e.g. University student']].map(([k,lbl,ph]) => (
            <div key={k} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{lbl}</label>
              <input value={draft.patientProfile[k]} onChange={e => updateProfile(k, e.target.value)} placeholder={ph}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Age</label>
            <input type="number" min={5} max={99} value={draft.patientProfile.age}
              onChange={e => updateProfile('age', parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Gender</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Female','Male','Other'].map(g => (
                <button key={g} onClick={() => updateProfile('gender', g)} style={{
                  flex: 1, padding: '8px', borderRadius: 9, fontFamily: 'Poppins', fontSize: 12, fontWeight: 600,
                  background: draft.patientProfile.gender === g ? 'var(--primary-l)' : 'var(--surface-2)',
                  color: draft.patientProfile.gender === g ? 'var(--primary)' : 'var(--text-3)',
                  border: `1.5px solid ${draft.patientProfile.gender === g ? 'var(--primary)' : 'var(--border)'}40`,
                  cursor: 'pointer',
                }}>{g}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Patient Tone / Mood</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PATIENT_TONES.map(t => (
                <button key={t} onClick={() => onChange('patientTone', t)} style={{
                  padding: '9px 14px', borderRadius: 10, textAlign: 'left', fontFamily: 'Poppins', fontSize: 12,
                  fontWeight: draft.patientTone === t ? 700 : 400,
                  background: draft.patientTone === t ? 'var(--primary-l)' : 'var(--surface-2)',
                  color: draft.patientTone === t ? 'var(--primary)' : 'var(--text-2)',
                  border: `1.5px solid ${draft.patientTone === t ? 'var(--primary)40' : 'var(--border)'}`,
                  cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <EyeOrb size={20} tone={t} animate={false} color={draft.accentColor} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase' }}>Preview</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <EyeOrb size={44} tone={draft.patientTone} color={draft.accentColor} animate />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{draft.patientProfile.name || 'Patient Name'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{draft.patientProfile.age}yr, {draft.patientProfile.gender} · {draft.patientProfile.occupation || 'Occupation'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Step 3: Domain Responses ──────────────────────────────
const BuilderStep3 = ({ draft, onChange }) => {
  const [activeDomain, setActiveDomain] = React.useState(BUILDER_DOMAINS[0]);
  const updateResponse = (domain, field, val) => {
    const updated = { ...draft.responses, [domain]: { ...draft.responses[domain], [field]: val } };
    onChange('responses', updated);
  };
  const toggleKeyDomain = (d) => {
    const kd = draft.keyDomains.includes(d) ? draft.keyDomains.filter(x => x !== d) : [...draft.keyDomains, d];
    onChange('keyDomains', kd);
  };
  const toggleCritical = (d) => {
    const cd = draft.criticalDomains.includes(d) ? draft.criticalDomains.filter(x => x !== d) : [...draft.criticalDomains, d];
    onChange('criticalDomains', cd);
  };
  const resp = draft.responses[activeDomain] || { text: '', found: '', isRedFlag: false };

  return (
    <div style={{ display: 'flex', gap: 20, height: 460 }}>
      {/* Domain list */}
      <div style={{ width: 200, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Domains</div>
        {BUILDER_DOMAINS.map(d => {
          const hasText = draft.responses[d]?.text?.trim().length > 0;
          const isKey = draft.keyDomains.includes(d);
          const isCrit = draft.criticalDomains.includes(d);
          return (
            <button key={d} onClick={() => setActiveDomain(d)} style={{
              padding: '7px 10px', borderRadius: 9, textAlign: 'left', fontFamily: 'Poppins',
              fontSize: 11, fontWeight: activeDomain === d ? 700 : 400,
              background: activeDomain === d ? 'var(--primary-l)' : 'transparent',
              color: activeDomain === d ? 'var(--primary)' : hasText ? 'var(--text-1)' : 'var(--text-3)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {hasText ? <span style={{ color: 'var(--green)', fontSize: 10 }}>✓</span> : <span style={{ color: 'var(--border)', fontSize: 10 }}>○</span>}
              {DOMAIN_LABELS[d]}
              {isCrit && <span style={{ fontSize: 8, background: 'var(--red-l)', color: 'var(--red)', padding: '1px 4px', borderRadius: 4 }}>!</span>}
            </button>
          );
        })}
      </div>

      {/* Response editor */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{DOMAIN_LABELS[activeDomain]}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600, color: 'var(--text-2)' }}>
              <input type="checkbox" checked={draft.keyDomains.includes(activeDomain)} onChange={() => toggleKeyDomain(activeDomain)} />
              Key Domain
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600, color: 'var(--red)' }}>
              <input type="checkbox" checked={draft.criticalDomains.includes(activeDomain)} onChange={() => toggleCritical(activeDomain)} />
              Critical
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5 }}>Patient Response Text *</label>
          <textarea value={resp.text} rows={5}
            onChange={e => updateResponse(activeDomain, 'text', e.target.value)}
            placeholder={`What does the patient say when asked about ${DOMAIN_LABELS[activeDomain].toLowerCase()}?`}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins',
              outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 5 }}>Clinical Finding Label</label>
          <input value={resp.found || ''} onChange={e => updateResponse(activeDomain, 'found', e.target.value)}
            placeholder="e.g. Right eye affected (shown in left panel)"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={resp.isRedFlag}
            onChange={e => updateResponse(activeDomain, 'isRedFlag', e.target.checked)} />
          <span style={{ fontWeight: 600, color: 'var(--red)' }}>🚩 Mark as Red Flag — triggers alert when found</span>
        </label>
      </div>
    </div>
  );
};

// ── Case Preview Card ─────────────────────────────────────
const CasePreviewCard = ({ draft }) => (
  <Card padding={20} style={{ background: draft.accentLight, border: `1.5px solid ${draft.accentColor}30` }}>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <EyeOrb size={52} tone={draft.patientTone} color={draft.accentColor} animate />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: draft.accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{draft.category || 'Category'}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>{draft.title || 'Untitled Case'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', marginBottom: 8 }}>{draft.chiefComplaint || '"Chief complaint here…"'}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DiffBadge level={draft.difficultyLevel} />
          <span style={{ fontSize: 11, background: 'var(--surface)', borderRadius: 8, padding: '2px 8px', color: 'var(--text-3)' }}>⏱ {draft.estimatedTime}</span>
          <span style={{ fontSize: 11, background: 'var(--primary-l)', borderRadius: 8, padding: '2px 8px', color: 'var(--primary)', fontWeight: 700 }}>{draft.keyDomains.length} domains</span>
          <span style={{ fontSize: 11, background: 'var(--red-l)', borderRadius: 8, padding: '2px 8px', color: 'var(--red)', fontWeight: 700 }}>{draft.criticalDomains.length} critical</span>
        </div>
      </div>
    </div>
  </Card>
);

// ── Main Case Builder Screen ──────────────────────────────
const CaseBuilderScreen = ({ onSave, onCancel, editCase }) => {
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState(() => editCase || makeEmptyCase());
  const [saved, setSaved] = React.useState(false);
  const toast = useToast();

  const updateField = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  const steps = [
    { label: 'Informasi Dasar', icon: '📋' },
    { label: 'Profil Pasien', icon: '👤' },
    { label: 'Respons Domain', icon: '💬' },
  ];

  const validate = () => {
    if (!draft.title.trim()) { toast({ type: 'error', title: 'Title wajib diisi' }); return false; }
    if (!draft.chiefComplaint.trim()) { toast({ type: 'error', title: 'Chief complaint wajib diisi' }); return false; }
    if (!draft.correctDiagnosis.trim()) { toast({ type: 'error', title: 'Correct diagnosis wajib diisi' }); return false; }
    if (!draft.patientProfile.name.trim()) { toast({ type: 'error', title: 'Nama pasien wajib diisi' }); return false; }
    if (draft.keyDomains.length === 0) { toast({ type: 'warning', title: 'Pilih minimal 1 key domain', message: 'Di tab Domain Responses' }); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const finalCase = { ...draft, tags: [draft.category.toLowerCase().replace(/\s+/g,'-')], isCustom: true };
    saveCustomCase(finalCase);
    setSaved(true);
    toast({ type: 'badge', title: '✅ Kasus berhasil disimpan!', message: draft.title });
    if (window.confetti) window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
    setTimeout(() => onSave(finalCase), 1200);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* Header */}
      <div className="au" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={onCancel} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, color: 'var(--text-2)', fontFamily: 'Poppins' }}>← Kembali</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Case Builder</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Buat kasus anamnesis kustom kamu sendiri</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <div>
          {/* Step tabs */}
          <div className="au" style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--surface-2)', borderRadius: 14, padding: 5 }}>
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'Poppins',
                background: step === i ? 'var(--surface)' : 'transparent',
                color: step === i ? 'var(--primary)' : 'var(--text-3)',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: step === i ? 700 : 500,
                boxShadow: step === i ? 'var(--sh-sm)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Step content */}
          <Card padding={24} hover={false}>
            {step === 0 && <BuilderStep1 draft={draft} onChange={updateField} />}
            {step === 1 && <BuilderStep2 draft={draft} onChange={updateField} />}
            {step === 2 && <BuilderStep3 draft={draft} onChange={updateField} />}
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <Btn variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Prev</Btn>
            <div style={{ display: 'flex', gap: 10 }}>
              {step < 2 ? (
                <Btn variant="primary" onClick={() => setStep(s => Math.min(2, s + 1))}>Next →</Btn>
              ) : (
                <Btn variant="primary" onClick={handleSave} disabled={saved}>
                  {saved ? '✓ Tersimpan!' : '💾 Simpan & Gunakan Kasus'}
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live Preview</div>
          <CasePreviewCard draft={draft} />
          <Card padding={16} hover={false}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Basic Info', done: draft.title && draft.chiefComplaint && draft.correctDiagnosis },
                { label: 'Patient Profile', done: draft.patientProfile.name && draft.patientProfile.occupation },
                { label: 'Key Domains', done: draft.keyDomains.length > 0 },
                { label: 'Responses', done: Object.values(draft.responses).filter(r => r.text?.trim()).length >= 5 },
              ].map(({ label, done }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, background: done ? 'var(--green-l)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: done ? 'var(--green)' : 'var(--text-3)', flexShrink: 0 }}>
                    {done ? '✓' : '○'}
                  </div>
                  <span style={{ fontSize: 12, color: done ? 'var(--text-1)' : 'var(--text-3)' }}>{label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Domains filled counter */}
          <Card padding={16} hover={false}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Responses Written</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
              {Object.values(draft.responses).filter(r => r.text?.trim()).length - 1}
              <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}> / {BUILDER_DOMAINS.length}</span>
            </div>
            <ProgressBar value={Object.values(draft.responses).filter(r => r.text?.trim()).length - 1} max={BUILDER_DOMAINS.length} color="var(--primary)" height={5} style={{ marginTop: 8 }} />
          </Card>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CaseBuilderScreen });
