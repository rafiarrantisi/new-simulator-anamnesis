// ============================================================
// OphthaSim — Simulator Room (3-Panel Layout)
// ============================================================

// ── Patient Card (top of conversation panel) ──────────────
const PatientCard = ({ caseData, sessionTime }) => {
  const toneLabel = {
    anxious: 'Tampak cemas', worried: 'Tampak khawatir',
    tired: 'Tampak lelah', 'pain-affected': 'Kesakitan',
    cooperative: 'Kooperatif',
  };
  const mins = Math.floor(sessionTime / 60);
  const secs = sessionTime % 60;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <EyeOrb size={48} tone={caseData.patientTone} animate />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
          {caseData.patientProfile.name}
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>
            {caseData.patientProfile.age}th, {caseData.patientProfile.gender}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{caseData.patientProfile.occupation}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <span style={{
            fontSize: 9, background: caseData.accentLight, color: caseData.accentColor,
            padding: '2px 8px', borderRadius: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{toneLabel[caseData.patientTone] || caseData.patientTone}</span>
          <span style={{ fontSize: 9, background: 'var(--surface-2)', color: 'var(--text-3)', padding: '2px 8px', borderRadius: 7, fontWeight: 600 }}>
            {caseData.category}
          </span>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--surface-2)', borderRadius: 10, padding: '6px 12px',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>⏱</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          {mins}:{secs.toString().padStart(2,'0')}
        </span>
      </div>
    </div>
  );
};

// ── Message Bubble ─────────────────────────────────────────
const MessageBubble = ({ msg, isNew, showLiveFeedback = false }) => {
  const isUser    = msg.role === 'user';
  const isSystem  = msg.role === 'system';
  const isPatient = msg.role === 'patient';

  if (isSystem) return (
    <div className={isNew ? 'af' : ''} style={{
      textAlign: 'center', padding: '6px 0',
    }}>
      <span style={{
        display: 'inline-block',
        background: 'var(--surface-2)', color: 'var(--text-3)',
        fontSize: 11, padding: '4px 14px', borderRadius: 20, fontStyle: 'italic',
      }}>{msg.text}</span>
    </div>
  );

  return (
    <div className={isNew ? 'bubbleIn' : ''} style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: isNew ? 'bubbleIn 0.35s var(--ease-pop) both' : 'none',
      paddingBottom: 2,
    }}>
      {isPatient && (
        <div style={{ flexShrink: 0, marginRight: 10, marginTop: 4 }}>
          <EyeOrb size={28} tone="normal" animate={false} />
        </div>
      )}
      <div style={{ maxWidth: '72%' }}>
        {isPatient && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600 }}>Pasien</div>
        )}
        {isUser && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, textAlign: 'right', fontWeight: 600 }}>Dokter (Kamu)</div>
        )}
        <div style={{
          padding: '10px 15px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? 'var(--primary)' : 'var(--surface)',
          color: isUser ? '#fff' : 'var(--text-1)',
          fontSize: 13, lineHeight: 1.55, fontWeight: 400,
          border: isPatient ? '1px solid var(--border)' : 'none',
          boxShadow: isPatient ? 'var(--sh-xs)' : 'none',
        }}>
          {msg.streaming && !msg.text ? (
            // Tier A v0.13.0: dot inline saat menunggu chunk pertama
            // (precedent industri ChatGPT/Claude — anchor visual stabil
            // sejak detik 0). Token+keyframe existing, zero design.css baru.
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--text-3)',
                  animation: 'pulse 1.2s ease-in-out ' + (i * 0.2) + 's infinite',
                  opacity: 0.6,
                }} />
              ))}
            </span>
          ) : (
            msg.text
          )}
        </div>
        {showLiveFeedback && msg.reward && (
          <div style={{
            fontSize: 11, color: 'var(--green)', marginTop: 5, fontWeight: 700,
            animation: 'bounceIn 0.5s var(--ease-pop) 0.2s both',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ✓ {msg.reward}
          </div>
        )}
        {showLiveFeedback && msg.redFlag && (
          <div style={{
            fontSize: 11, color: 'var(--red)', marginTop: 5, fontWeight: 700,
            animation: 'bounceIn 0.5s var(--ease-pop) 0.2s both',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🚩 Red Flag ditemukan!
          </div>
        )}
      </div>
    </div>
  );
};

// ── Typing Indicator ──────────────────────────────────────
const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
    <EyeOrb size={28} tone="normal" animate={false} />
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '18px 18px 18px 4px', padding: '10px 16px',
      display: 'flex', gap: 5, alignItems: 'center',
      boxShadow: 'var(--sh-xs)',
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--text-3)',
          animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`,
        }} />
      ))}
    </div>
  </div>
);

// ── Quick Chips Row ───────────────────────────────────────
const QuickChipsRow = ({ suggestions, onChipClick, usedDomains }) => {
  const allChips = [
    { id:'laterality', label:'Mata mana?' },
    { id:'onset',      label:'Kapan mulai?' },
    { id:'pain',       label:'Ada nyeri?' },
    { id:'redness',    label:'Mata merah?' },
    { id:'photophobia',label:'Silau?' },
    { id:'visual_acuity', label:'Gangguan penglihatan?' },
    { id:'flashes',    label:'Ada kilatan?' },
    { id:'floaters',   label:'Ada floaters?' },
    { id:'discharge',  label:'Ada sekret?' },
    { id:'contact_lens',label:'Lensa kontak?' },
    { id:'trauma',     label:'Ada trauma?' },
    { id:'history',    label:'Riwayat mata?' },
    { id:'systemic',   label:'Riwayat penyakit?' },
    { id:'medication', label:'Obat-obatan?' },
    { id:'visual_field',label:'Gangguan lapang pandang?' },
  ];
  const prioritized = [
    ...suggestions.map(s => allChips.find(c => c.id === s.id)).filter(Boolean),
    ...allChips.filter(c => !suggestions.find(s => s.id === c.id) && !usedDomains.has(c.id)),
  ].slice(0, 12);

  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', padding: '0 0 4px 0',
      scrollbarWidth: 'none',
    }}>
      {prioritized.map((chip, i) => {
        const isUsed = usedDomains.has(chip.id);
        const isSuggested = suggestions.find(s => s.id === chip.id);
        return (
          <button key={chip.id}
            onClick={() => !isUsed && onChipClick(chip)}
            style={{
              flexShrink: 0, padding: '6px 13px', borderRadius: 10,
              border: `1.5px solid ${isUsed ? 'var(--border)' : isSuggested ? 'var(--primary)40' : 'var(--border)'}`,
              background: isUsed ? 'var(--surface-3)' : isSuggested ? 'var(--primary-ll)' : 'var(--surface)',
              color: isUsed ? 'var(--text-3)' : isSuggested ? 'var(--primary)' : 'var(--text-2)',
              fontSize: 11, fontWeight: isUsed ? 400 : 600,
              cursor: isUsed ? 'default' : 'pointer',
              fontFamily: 'Poppins',
              transition: 'all 0.18s var(--ease-hover)',
              textDecoration: isUsed ? 'line-through' : 'none',
              opacity: isUsed ? 0.5 : 1,
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};

// ── Left Panel — Case Summary ─────────────────────────────
const LeftPanel = ({ caseData, session }) => {
  const findings = session.findings || [];
  const { score, completeness, redFlagsFound } = session.scoring;
  const chiefSymptoms = [
    caseData.patientProfile && `${caseData.patientProfile.age}th, ${caseData.patientProfile.gender}`,
    caseData.category,
    caseData.difficulty,
  ].filter(Boolean);

  return (
    <div style={{
      width: 270, flexShrink: 0,
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Case info */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: caseData.accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          {caseData.category}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3, marginBottom: 8 }}>
          {caseData.title}
        </div>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '8px 10px',
          fontSize: 11, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.5,
        }}>
          {caseData.chiefComplaint}
        </div>
      </div>

      {/* Mini score */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>PROGRESS</div>
          <ProgressBar value={completeness} max={100} color="var(--primary)" height={5} />
          <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, marginTop: 3 }}>{completeness}% domain terjawab</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>SCORE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--text-1)', lineHeight: 1 }}>{score}</div>
        </div>
      </div>

      {/* Red flag banner */}
      {redFlagsFound > 0 && (
        <div style={{
          margin: '10px 14px 0',
          background: 'var(--red-l)', border: '1px solid var(--red)25',
          borderRadius: 10, padding: '7px 12px',
          display: 'flex', alignItems: 'center', gap: 7,
          animation: 'bounceIn 0.5s var(--ease-pop) both',
        }}>
          <span style={{ fontSize: 14 }}>🚩</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red-d)' }}>
            {redFlagsFound} Red Flag Ditemukan
          </span>
        </div>
      )}

      {/* Findings list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {findings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 11, paddingTop: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>👁️</div>
            Mulai bertanya untuk mengungkap temuan klinis
          </div>
        ) : findings.map((f, i) => (
          <FindingChip key={i} finding={f} isNew={i === findings.length - 1 && f.isNew} />
        ))}
      </div>

      {/* Critical domains reminder */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Domain Kritis</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {caseData.criticalDomains.map(d => {
            const done = session.discoveredDomains.has(d);
            return (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 5,
                  background: done ? 'var(--green-l)' : 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, flexShrink: 0,
                }}>
                  {done ? '✓' : '○'}
                </span>
                <span style={{ fontSize: 11, color: done ? 'var(--green)' : 'var(--text-3)', fontWeight: done ? 700 : 400 }}>
                  {DOMAIN_QUESTIONS[d]?.label || d}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Right Panel (NORMAL mode — stripped: progress + hint + neutral suggestions) ──
const RightPanelNormal = ({ caseData, session, onSuggestionClick }) => {
  const suggestions = getSuggestions(caseData, session.discoveredDomains);
  const { completeness } = session.scoring;

  // Neutral hint — no critical-specific spoiler
  const hint = React.useMemo(() => {
    if (!session.discoveredDomains.has('laterality')) return 'Mulai dengan dasar — siapa, mata mana, sejak kapan.';
    if (session.questionCount < 4) return 'Gali keluhan utama dengan kerangka SOCRATES (Site, Onset, Character, Severity, dst.)';
    if (completeness < 40) return 'Lengkapi domain anamnesis — past history, lensa kontak, riwayat sistemik.';
    if (completeness < 70) return 'Sudah cukup banyak yang digali. Pikirkan: ada yang masih bisa relevan?';
    return 'Hampir lengkap. Rangkum balik dan akhiri sesi untuk lanjut pemeriksaan.';
  }, [session.discoveredDomains.size, completeness, session.questionCount]);

  return (
    <div style={{
      width: 256, flexShrink: 0,
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Progress (neutral — no red flag count or critical breakdown) */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Progres Anamnesis</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreRing value={completeness} size={68} color="var(--primary)" label={`${completeness}%`} sublabel="domain" />
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
              {session.discoveredDomains.size} / {caseData.keyDomains.length} domain
            </div>
            <div style={{ color: 'var(--text-3)' }}>
              {session.questionCount} pertanyaan
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '7px 11px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 10, color: 'var(--text-3)', textAlign: 'center', fontStyle: 'italic' }}>
          Feedback lengkap muncul di akhir sesi.
        </div>
      </div>

      {/* Hint (general) */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>💡 Petunjuk</div>
        <div style={{
          background: 'var(--amber-l)', borderRadius: 10, padding: '9px 12px',
          fontSize: 11, color: 'var(--amber-d)', lineHeight: 1.55, fontStyle: 'italic',
        }}>
          {hint}
        </div>
      </div>

      {/* Suggestions (neutral — no group color coding) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Saran Pertanyaan
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestions.map(s => (
            <SuggestionItem key={s.id} suggestion={s} onSuggestionClick={onSuggestionClick} color="var(--primary)" />
          ))}
        </div>
        {suggestions.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 11, paddingTop: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
            Semua saran sudah ditanyakan.
          </div>
        )}
      </div>
    </div>
  );
};

// ── Right Panel — Suggestions / Score / Hints ─────────────
const RightPanel = ({ caseData, session, onSuggestionClick }) => {
  const suggestions = getSuggestions(caseData, session.discoveredDomains);
  const { score, completeness, confidence, criticalCovered, criticalTotal, redFlagsFound, totalRedFlags } = session.scoring;
  const groupColors = { 'Red Flags':'var(--red)', 'Symptom':'var(--primary)', 'History':'var(--amber)', 'Systemic':'var(--teal)', 'Associated':'var(--violet)' };
  const grouped = suggestions.reduce((acc, s) => {
    const g = s.group || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const hint = React.useMemo(() => {
    if (!session.discoveredDomains.has('laterality')) return 'Tanyakan lateralitas dulu — mata kiri, kanan, atau keduanya?';
    if (redFlagsFound === 0 && session.questionCount > 4) return 'Coba eksplorasi gejala visual seperti floaters, flashes, atau photophobia.';
    if (criticalCovered < criticalTotal && session.questionCount > 6) return `Masih ada ${criticalTotal - criticalCovered} domain kritis yang belum terjawab.`;
    if (completeness > 70) return 'Hampir selesai! Pastikan semua domain penting sudah tertutup.';
    return 'Terus ajukan pertanyaan spesifik tentang gejala mata.';
  }, [session.discoveredDomains.size, redFlagsFound, completeness]);

  return (
    <div style={{
      width: 256, flexShrink: 0,
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Score section */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Live Score</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 }}>
          <ScoreRing value={score} size={68} color="var(--primary)" label="Score" sublabel="pts" />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Kelengkapan</div>
              <ProgressBar value={completeness} max={100} color="var(--teal)" height={5} showPct />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Kritis</div>
              <ProgressBar value={criticalCovered} max={criticalTotal} color="var(--amber)" height={5} showPct />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Red Flags</div>
              <ProgressBar value={redFlagsFound} max={Math.max(totalRedFlags,1)} color="var(--red)" height={5} showPct />
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>💡 Petunjuk</div>
        <div style={{
          background: 'var(--amber-l)', borderRadius: 10, padding: '8px 11px',
          fontSize: 11, color: 'var(--amber-d)', lineHeight: 1.5, fontStyle: 'italic',
        }}>
          {hint}
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Pertanyaan Disarankan</div>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: groupColors[group] || 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              {group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.map(s => (
                <SuggestionItem key={s.id} suggestion={s} onSuggestionClick={onSuggestionClick} color={groupColors[group] || 'var(--primary)'} />
              ))}
            </div>
          </div>
        ))}
        {suggestions.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 11, paddingTop: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
            Semua pertanyaan penting sudah ditanyakan!
          </div>
        )}
      </div>

      {/* Domain progress footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>
          {session.discoveredDomains.size} / {caseData.keyDomains.length} domain dijawab
        </div>
        <ProgressBar value={session.discoveredDomains.size} max={caseData.keyDomains.length} color="var(--primary)" height={4} />
      </div>
    </div>
  );
};

// Small suggestion button component
const SuggestionItem = ({ suggestion, onSuggestionClick, color }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSuggestionClick(suggestion)}
      style={{
        width: '100%', textAlign: 'left', padding: '7px 10px',
        borderRadius: 9, border: `1px solid ${hov ? color + '40' : 'var(--border)'}`,
        background: hov ? `${color}08` : 'var(--surface)',
        color: hov ? color : 'var(--text-2)',
        fontSize: 11, fontWeight: hov ? 600 : 400,
        cursor: 'pointer', fontFamily: 'Poppins',
        transition: 'all 0.15s var(--ease-hover)',
        transform: hov ? 'translateX(2px)' : 'none',
        display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      <span style={{ color, flexShrink: 0 }}>›</span>
      {suggestion.question}
    </button>
  );
};

// ── Conversation Panel (Center) ───────────────────────────
const ConversationPanel = ({ caseData, session, onSend, onEnd, mode = 'normal' }) => {
  const [input, setInput] = React.useState('');
  const endRef = React.useRef(null);
  const inputRef = React.useRef(null);
  // Voice (Fase 4 v0.8.1) — Push-to-Talk; aditif, hanya jika backend+mic.
  const [recording, setRecording] = React.useState(false);
  const [vbusy, setVbusy] = React.useState(false);
  const capRef = React.useRef(null);
  const lastSpokenRef = React.useRef(null);
  const voiceOn = typeof window !== 'undefined' && window.OPHTHA_API_BASE &&
    window.OphthaVoice && window.OphthaVoice.supported();

  // Tier A v0.13.0: streaming-derived (gantikan local `typing` state).
  // True saat ada placeholder patient msg yang masih streaming.
  const isStreaming = session.messages.some(m => m.role === 'patient' && m.streaming);

  const isOSCE = mode === 'osce';
  const isTutorial = mode === 'tutorial';
  // Live feedback (green check, red flag inline) hanya untuk tutorial
  const showLiveFeedback = isTutorial;

  React.useEffect(() => {
    if (endRef.current) {
      endRef.current.parentElement.scrollTop = endRef.current.offsetTop - 40;
    }
  }, [session.messages, isStreaming]);

  // Auto-speak (v0.8.3 + Tier A v0.13.0): balasan pasien baru → TTS.
  // Gated voiceOn, skip saat merekam, dan WAJIB tunggu `!streaming` agar
  // TTS dipanggil sekali pada teks final (bukan per-chunk). Graceful bila
  // TTS_API_KEY kosong (speak() silent-return). Voice-ready: saat key
  // diisi nanti, tak perlu code change.
  React.useEffect(() => {
    if (!voiceOn || recording) return;
    const msgs = session.messages;
    const last = msgs[msgs.length - 1];
    if (last && last.role === 'patient' && last.text && !last.streaming &&
        last.id !== lastSpokenRef.current) {
      lastSpokenRef.current = last.id;
      window.OphthaVoice.speak(last.text);
    }
  }, [session.messages, voiceOn, recording]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Push-to-Talk: klik 1 = mulai rekam, klik 2 = stop → STT → kirim.
  const handleMic = async () => {
    if (vbusy || isStreaming) return;
    try {
      if (!recording) {
        const cap = new window.OphthaVoice.AudioCapture();
        await cap.start();
        capRef.current = cap;
        setRecording(true);
        return;
      }
      setRecording(false);
      setVbusy(true);
      const blob = capRef.current ? await capRef.current.stop() : null;
      capRef.current = null;
      if (!blob) { setVbusy(false); return; }
      const text = (await window.OphthaVoice.transcribeBlob(blob) || '').trim();
      setVbusy(false);
      if (text) {
        onSend(text);
        setTyping(true);
        setTimeout(() => setTyping(false), 1200 + Math.random() * 600);
      }
    } catch (e) {
      setRecording(false);
      setVbusy(false);
      // Fallback diam: pengguna tetap bisa ketik manual.
    }
  };

  const suggestions = getSuggestions(caseData, session.discoveredDomains);
  const canEnd = session.discoveredDomains.size >= Math.floor(caseData.keyDomains.length * 0.4);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', minWidth: 0, overflow: 'hidden',
    }}>
      {/* Patient card header */}
      <PatientCard caseData={caseData} sessionTime={session.elapsed} />

      {/* v0.14.0: Eye Photo Viewer — auto-hidden bila caseId belum punya
          entry di public/eye-photos/manifest.json (zero visual change). */}
      <EyePhotoBar caseId={caseData.id} />

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {session.messages.map((msg, i) => (
          <MessageBubble key={msg.id} msg={msg} isNew={i >= session.messages.length - 2} showLiveFeedback={showLiveFeedback} />
        ))}
        {/* Tier A v0.13.0: TypingIndicator terpisah dihentikan — dot inline
            di placeholder bubble (lihat MessageBubble) saat streaming.
            Komponen TypingIndicator tetap di-export utk back-compat. */}
        <div ref={endRef} />
      </div>

      {/* Quick chips — only in Normal & Tutorial, hidden in OSCE */}
      {!isOSCE && (
        <div style={{ padding: '8px 20px 4px', borderTop: '1px solid var(--border)' }}>
          <QuickChipsRow
            suggestions={suggestions}
            usedDomains={session.discoveredDomains}
            onChipClick={(chip) => {
              const q = DOMAIN_QUESTIONS[chip.id]?.question || chip.label;
              setInput(q);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          />
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: isOSCE ? '14px 20px 18px' : '10px 20px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-end',
        borderTop: isOSCE ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isOSCE ? "Tanyakan kepada pasien — tidak ada bantuan, persis seperti OSCE asli." : "Tanyakan sesuatu kepada pasien… (Enter untuk kirim)"}
            rows={1}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 14,
              border: '1.5px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'Poppins',
              outline: 'none', resize: 'none', lineHeight: 1.5,
              transition: 'border-color 0.18s, box-shadow 0.18s',
              maxHeight: 100, overflowY: 'auto',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        {voiceOn && (
          <Btn variant={recording ? 'danger' : 'secondary'} onClick={handleMic}
            disabled={isStreaming || vbusy}
            style={{ padding: '11px 14px', flexShrink: 0, borderRadius: 14 }}>
            {vbusy ? '…' : recording ? '⏹ Stop' : '🎙️'}
          </Btn>
        )}
        <Btn variant="primary" onClick={handleSend} disabled={!input.trim() || isStreaming}
          style={{ padding: '11px 18px', flexShrink: 0, borderRadius: 14 }}>
          Kirim
        </Btn>
        {canEnd && (
          <Btn variant="secondary" onClick={onEnd} style={{ flexShrink: 0, borderRadius: 14 }}>
            Akhiri
          </Btn>
        )}
      </div>
    </div>
  );
};

// ── Simulator Screen (Main) ───────────────────────────────
const SimulatorScreen = ({ caseData, onEnd, profile, mode = 'normal', osceSeconds = 420 }) => {
  // Tier A v0.13.0: tutup WebSocket RAG saat keluar simulator (navigate /
  // unmount). Cegah koneksi nyangkut + pending turn ke-orphan di server.
  React.useEffect(() => {
    return () => { if (typeof window !== 'undefined' && window.closeRagWs) window.closeRagWs(); };
  }, []);

  // OSCE countdown
  const [osceLeft, setOsceLeft] = React.useState(osceSeconds);
  const osceEndedRef = React.useRef(false);

  React.useEffect(() => {
    if (mode !== 'osce') return;
    if (osceLeft <= 0) {
      if (!osceEndedRef.current) {
        osceEndedRef.current = true;
        setSession(prev => {
          const finalScoring = computeScore(prev, caseData);
          onEnd({ ...prev, scoring: finalScoring, osceMode: true, osceTimeUp: true, osceTotalSeconds: osceSeconds });
          return prev;
        });
      }
      return;
    }
    const t = setTimeout(() => setOsceLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, osceLeft]);

  // Tutorial dismiss
  const [tutorialActive, setTutorialActive] = React.useState(mode === 'tutorial');
  const toast = useToast();
  const [session, setSession] = React.useState(() => ({
    // Kasus RAG (kontrak v0.7.0): chiefComplaint kosong DISENGAJA — keluhan
    // harus digali dokter (answer-restraint), jadi tidak nge-seed bubble
    // keluhan kalengan. Kasus dummy lama: perilaku persis seperti dulu.
    messages: [{
      id: 'intro',
      role: 'system',
      text: `Sesi anamnesis dimulai — Pasien: ${caseData.patientProfile.name}`,
    }].concat(
      (caseData.chiefComplaint && caseData.chiefComplaint.trim())
        ? [{ id: 'chief', role: 'patient', text: caseData.chiefComplaint.replace(/^"|"$/g, '') }]
        : []
    ),
    discoveredDomains: new Set(),
    findings: [],
    redFlagsFound: [],
    questionCount: 0,
    elapsed: 0,
    scoring: { score: 0, completeness: 0, confidence: 0, criticalCovered: 0, criticalTotal: caseData.criticalDomains.length, redFlagsFound: 0, totalRedFlags: Object.values(caseData.responses).filter(r => r.isRedFlag).length },
    newBadges: [],
    xpGained: 0,
  }));

  // Timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSession(prev => ({ ...prev, elapsed: prev.elapsed + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = React.useCallback((text) => {
    // Add user message immediately
    const userMsgId = Date.now() + 'u';
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, { id: userMsgId, role: 'user', text }],
      questionCount: prev.questionCount + 1,
    }));

    // Detect category and get response — via PatientEngine (StaticPatientEngine = perilaku identik)
    setTimeout(() => {
      PatientEngine.respond({ caseContext: caseData, history: session.messages, userMessage: text, locale: 'id', mode }).then(({ category, responseData }) => {
      const alreadyKnown = session.discoveredDomains.has(category);

      let patientText = responseData.text;
      if (alreadyKnown && category !== 'default') {
        const variants = [
          "Seperti yang sudah saya ceritakan, " + responseData.text.toLowerCase(),
          "Sudah saya katakan — " + responseData.text,
          responseData.text,
        ];
        patientText = variants[Math.floor(Math.random() * variants.length)];
      }

      const patientMsgId = Date.now() + 'p';
      setSession(prev => {
        const newDiscovered = new Set(prev.discoveredDomains);
        const newFindings = [...prev.findings];
        const newRedFlags = [...prev.redFlagsFound];
        let toastFired = false;

        if (!alreadyKnown && category !== 'default' && responseData.found) {
          newDiscovered.add(category);
          newFindings.push({ ...responseData, isNew: true });

          if (responseData.isRedFlag && !prev.redFlagsFound.includes(category)) {
            newRedFlags.push(category);
            setTimeout(() => toast({ type: 'redflag', title: '🚩 Red Flag Ditemukan!', message: responseData.found, duration: 4000 }), 100);
            toastFired = true;
            if (window.confetti) {
              window.confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 }, colors: ['#EF4444','#F59E0B'] });
            }
          } else if (!toastFired) {
            setTimeout(() => toast({ type: 'success', title: 'Temuan baru!', message: responseData.found, duration: 2500 }), 100);
          }
        }

        // Mark old findings as not new
        const updatedFindings = newFindings.map((f, i) => i === newFindings.length - 1 ? f : { ...f, isNew: false });

        const scoring = computeScore({ ...prev, discoveredDomains: newDiscovered, redFlagsFound: newRedFlags }, caseData);
        const xpGain = (!alreadyKnown && category !== 'default' && responseData.found) ? (responseData.isRedFlag ? 20 : 5) : 0;

        const newMsg = {
          id: patientMsgId, role: 'patient', text: patientText,
          reward: !alreadyKnown && responseData.found && !responseData.isRedFlag ? responseData.found : null,
          redFlag: !alreadyKnown && responseData.isRedFlag,
        };

        return {
          ...prev,
          messages: [...prev.messages, newMsg],
          discoveredDomains: newDiscovered,
          findings: updatedFindings,
          redFlagsFound: newRedFlags,
          scoring,
          xpGained: prev.xpGained + xpGain,
        };
      });
      });
    }, 1200 + Math.random() * 500);
  }, [caseData, session.discoveredDomains, toast]);

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion.question);
  };

  const handleEnd = () => {
    const finalScoring = computeScore(session, caseData);
    onEnd({
      ...session,
      scoring: finalScoring,
      osceMode: mode === 'osce',
      tutorialMode: mode === 'tutorial',
      mode,
      osceTotalSeconds: osceSeconds,
    });
  };

  // Ref for the session to avoid closure issues
  const sessionRef = React.useRef(session);
  React.useEffect(() => { sessionRef.current = session; }, [session]);

  const handleSendStable = React.useCallback((text) => {
    // Tier A v0.13.0: streaming token-by-token. Push user msg + placeholder
    // patient msg ({streaming:true, text:''}) atomik → anchor visual instan.
    // onChunk update text incremental; resolve finalisasi (streaming:false).
    // Buang setTimeout 1100-1700ms artificial — pakai TTFT nyata.
    const currentSession = sessionRef.current;
    const ts = Date.now();
    const userMsgId = ts + 'u';
    const patientMsgId = ts + 'p';
    setSession(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: userMsgId, role: 'user', text },
        { id: patientMsgId, role: 'patient', text: '', streaming: true },
      ],
      questionCount: prev.questionCount + 1,
    }));

    const onChunk = (delta) => {
      if (!delta) return;
      setSession(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === patientMsgId ? { ...m, text: m.text + delta } : m
        ),
      }));
    };

    PatientEngine.respond(
      { caseContext: caseData, history: currentSession.messages, userMessage: text, locale: 'id', mode },
      { onChunk }
    ).then(({ category, responseData }) => {
      const alreadyKnown = currentSession.discoveredDomains.has(category);
      let patientText = responseData.text;
      if (alreadyKnown && category !== 'default') {
        patientText = "Sudah saya ceritakan sebelumnya — " + responseData.text;
      }

      // Live feedback (toast + confetti) hanya muncul di mode TUTORIAL.
      // Normal & OSCE: feedback ditunda ke debrief akhir.
      const showLive = mode === 'tutorial';

      setSession(prev => {
        const newDiscovered = new Set(prev.discoveredDomains);
        const newRedFlags = [...prev.redFlagsFound];
        const newFindings = prev.findings.map(f => ({ ...f, isNew: false }));

        let isNewFind = false;
        if (!alreadyKnown && category !== 'default' && responseData.found) {
          newDiscovered.add(category);
          newFindings.push({ ...responseData, isNew: true });
          isNewFind = true;
          if (responseData.isRedFlag && !prev.redFlagsFound.includes(category)) {
            newRedFlags.push(category);
            if (showLive) {
              setTimeout(() => toast({ type: 'redflag', title: '🚩 Red Flag!', message: responseData.found, duration: 4000 }), 50);
              if (window.confetti) window.confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 }, colors: ['#EF4444','#F59E0B'] });
            }
          } else if (isNewFind && showLive) {
            setTimeout(() => toast({ type: 'success', title: 'Temuan baru!', message: responseData.found, duration: 2000 }), 50);
          }
        }

        const scoring = computeScore({ ...prev, discoveredDomains: newDiscovered, redFlagsFound: newRedFlags }, caseData);
        const xpGain = isNewFind ? (responseData.isRedFlag ? 20 : 5) : 0;

        return {
          ...prev,
          // Finalisasi pesan placeholder by-id: ganti text final + streaming:false.
          messages: prev.messages.map(m =>
            m.id === patientMsgId
              ? {
                  ...m,
                  text: patientText,
                  streaming: false,
                  reward: isNewFind && !responseData.isRedFlag ? responseData.found : null,
                  redFlag: isNewFind && responseData.isRedFlag,
                }
              : m
          ),
          discoveredDomains: newDiscovered,
          findings: newFindings,
          redFlagsFound: newRedFlags,
          scoring,
          xpGained: prev.xpGained + xpGain,
        };
      });
    }).catch(() => {
      // Engine sudah fallback graceful; jika sampai sini = even fallback gagal.
      setSession(prev => ({
        ...prev,
        messages: prev.messages.map(m =>
          m.id === patientMsgId
            ? { ...m, text: '(Gagal mendapat balasan. Coba kirim ulang ya, Dok.)', streaming: false, error: true }
            : m
        ),
      }));
    });
  }, [caseData, toast, mode]);

  const osceBarH = mode === 'osce' ? 44 : 0;
  const panelH = `calc(100vh - 52px - ${osceBarH}px)`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
      {/* OSCE Timer Bar */}
      {mode === 'osce' && (
        <div style={{
          height: 44, flexShrink: 0,
          background: 'linear-gradient(90deg, var(--surface) 0%, var(--red-l) 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          padding: '0 24px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>⏱️ OSCE Mode — Waktu tersisa:</span>
          <OSCETimer secondsLeft={osceLeft} totalSeconds={osceSeconds} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Anamnesis akan otomatis berakhir saat waktu habis</span>
        </div>
      )}

      {/* Tutorial Mode Banner */}
      {mode === 'tutorial' && tutorialActive && (
        <div style={{
          height: 36, flexShrink: 0,
          background: 'var(--teal-l)', borderBottom: '1px solid var(--teal)25',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 20px',
        }}>
          <span style={{ fontSize: 13 }}>📚</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-d)' }}>Tutorial Mode aktif — lihat panduan di kiri bawah layar</span>
          <button onClick={() => setTutorialActive(false)} style={{ marginLeft: 8, fontSize: 11, color: 'var(--teal-d)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Poppins', textDecoration: 'underline' }}>
            Matikan Tutorial
          </button>
        </div>
      )}

      {/* Layout — Tutorial: 3-panel · Normal: chat + neutral right panel · OSCE: chat only */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {mode === 'tutorial' && <LeftPanel caseData={caseData} session={session} />}
        <ConversationPanel
          caseData={caseData}
          session={session}
          onSend={handleSendStable}
          onEnd={handleEnd}
          mode={mode}
        />
        {mode === 'tutorial' && <RightPanel
          caseData={caseData}
          session={session}
          onSuggestionClick={handleSuggestionClick}
        />}
        {mode === 'normal' && <RightPanelNormal
          caseData={caseData}
          session={session}
          onSuggestionClick={handleSuggestionClick}
        />}
      </div>

      {/* Tutorial Overlay */}
      {mode === 'tutorial' && tutorialActive && (
        <TutorialOverlay
          session={session}
          caseData={caseData}
          onDismiss={() => setTutorialActive(false)}
        />
      )}
    </div>
  );
};

Object.assign(window, {
  PatientCard, MessageBubble, TypingIndicator,
  QuickChipsRow, LeftPanel, RightPanel, RightPanelNormal, ConversationPanel,
  SuggestionItem, SimulatorScreen,
});
