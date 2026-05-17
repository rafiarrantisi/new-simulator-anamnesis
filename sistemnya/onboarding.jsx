// ============================================================
// OphthaSim — Onboarding, Mode Selection, Tutorial Overlay
// ============================================================

// ── Onboarding Modal (First Visit) ───────────────────────
const OnboardingModal = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);
  const steps = [
    {
      icon: null,
      title: 'Selamat datang di OphthaSim',
      subtitle: 'Virtual Patient Simulator — Ophthalmology Edition',
      content: 'Platform latihan anamnesis mata yang dirancang untuk mahasiswa kedokteran, koas, dan dokter muda. Belajar sambil berlatih langsung dengan pasien virtual.',
      cta: 'Mulai Tour →',
    },
    {
      icon: '💬',
      title: 'Cara Kerja Anamnesis',
      subtitle: '3 langkah sederhana',
      content: null,
      steps3: [
        { icon: '❓', label: 'Tanya', desc: 'Ajukan pertanyaan kepada pasien virtual. Gunakan quick chips atau ketik pertanyaan sendiri.' },
        { icon: '🔍', label: 'Temukan', desc: 'Setiap pertanyaan membuka temuan klinis. Red flag terdeteksi otomatis.' },
        { icon: '📋', label: 'Diagnosis', desc: 'Kerjakan pemeriksaan mata, lalu formulasikan diagnosis kamu.' },
      ],
      cta: 'Selanjutnya →',
    },
    {
      icon: '🎯',
      title: 'Sistem Penilaian',
      subtitle: 'Tiga komponen utama',
      content: null,
      scores: [
        { label: 'Domain Coverage', pct: 55, color: 'var(--primary)', desc: 'Berapa banyak domain anamnesis yang kamu tanyakan' },
        { label: 'Critical Domains', pct: 30, color: 'var(--amber)', desc: 'Domain kritis yang tidak boleh terlewat' },
        { label: 'Red Flag Detection', pct: 15, color: 'var(--red)', desc: 'Kemampuan mendeteksi tanda bahaya klinis' },
      ],
      cta: 'Selanjutnya →',
    },
    {
      icon: '🏅',
      title: 'Gamification & Progress',
      subtitle: 'Belajar lebih menyenangkan',
      content: null,
      features: [
        { icon: '⚡', label: 'XP & Level', desc: 'Kumpulkan XP setiap sesi untuk naik level' },
        { icon: '🏅', label: '10 Badge', desc: 'Unlock badge untuk pencapaian khusus' },
        { icon: '🔥', label: 'Streak', desc: 'Jaga streak harian untuk bonus XP' },
        { icon: '🎉', label: 'Konfeti', desc: 'Reward visual saat mencapai milestone besar' },
      ],
      cta: 'Mulai Berlatih! 🚀',
    },
  ];
  const s = steps[step];

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,29,46,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'overlayIn 0.3s ease both',
      }}>
        <div className="as" style={{
          background: 'var(--surface)', borderRadius: 28,
          padding: '40px 44px', maxWidth: 520, width: '90%',
          boxShadow: 'var(--sh-xl)',
          border: '1px solid var(--border)',
        }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 7, height: 7, borderRadius: 4,
                background: i === step ? 'var(--primary)' : i < step ? 'var(--primary)50' : 'var(--border)',
                transition: 'all 0.35s var(--ease-panel)',
              }} />
            ))}
          </div>

          {/* Content */}
          <div key={step} className="au" style={{ textAlign: 'center' }}>
            {/* Step 0 — big eye orb */}
            {step === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <EyeOrb size={80} tone="normal" animate />
              </div>
            )}
            {s.icon && step > 0 && (
              <div style={{ fontSize: 44, marginBottom: 16 }}>{s.icon}</div>
            )}

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>{s.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{s.subtitle}</p>

            {s.content && (
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 28 }}>{s.content}</p>
            )}

            {s.steps3 && (
              <div style={{ display: 'flex', gap: 14, marginBottom: 28, textAlign: 'left' }}>
                {s.steps3.map((st, i) => (
                  <div key={i} style={{
                    flex: 1, background: 'var(--surface-2)', borderRadius: 14,
                    padding: '14px 12px', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{st.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{st.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{st.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {s.scores && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left' }}>
                {s.scores.map((sc, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{sc.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{sc.pct}%</span>
                    </div>
                    <ProgressBar value={sc.pct} max={100} color={sc.color} height={6} />
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sc.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {s.features && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28, textAlign: 'left' }}>
                {s.features.map((f, i) => (
                  <div key={i} style={{
                    background: 'var(--surface-2)', borderRadius: 12, padding: '12px',
                    border: '1px solid var(--border)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 20 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step < steps.length - 1 ? (
              <button onClick={onComplete} style={{
                background: 'none', border: 'none', color: 'var(--text-3)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'Poppins',
              }}>Skip tour</button>
            ) : <div />}
            <Btn variant="primary" size="md"
              onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}>
              {s.cta}
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Mode Selection Modal ──────────────────────────────────
// Behaviour depends on caseData.caseType:
//   • 'osce'     → blind start. No name / category / chief complaint reveal.
//                  Only a case number, difficulty, and duration selector.
//   • 'practice' → minimal preview (title + first impression). Tutorial +
//                  Normal modes are offered; OSCE is NOT (OSCE has its own
//                  set of cases in the library).
const ModeSelectModal = ({ caseData, onSelect, onClose }) => {
  const [osceMinutes, setOsceMinutes] = React.useState(7);

  const isOsceCase = caseData.caseType === 'osce';

  // Tutorial only available for the 3 designated practice cases
  const tutorialAvailable = !isOsceCase
    && typeof isTutorialCase === 'function'
    && isTutorialCase(caseData.id);

  const modes = [
    {
      id: 'normal',
      icon: '🎯',
      label: 'Mode Normal',
      desc: 'Latihan bebas tanpa batas waktu. Ada progres & saran, tapi feedback baru muncul di akhir sesi.',
      color: 'var(--primary)',
      bg: 'var(--primary-l)',
      available: true,
    },
    {
      id: 'tutorial',
      icon: '📚',
      label: 'Mode Tutorial',
      desc: tutorialAvailable
        ? 'Panduan langkah demi langkah khusus kasus ini. Setiap pertanyaan dijelaskan rationale-nya.'
        : '🔒 Tutorial hanya tersedia untuk 3 kasus latihan terpilih (mudah / sedang / sulit). Setelah menguasai itu, alur anamnesis untuk kasus lain diharapkan sudah dikuasai.',
      color: 'var(--teal)',
      bg: 'var(--teal-l)',
      available: tutorialAvailable,
    },
  ];

  const [selected, setSelected] = React.useState(isOsceCase ? 'osce' : 'normal');

  const caseNumber = caseData.displayId
    || (caseData.id || '').replace(/[^0-9]/g, '').replace(/^0+/, '')
    || '—';

  return (
    <>
      <Overlay onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, pointerEvents: 'none',
      }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 24, padding: '32px',
        width: 520, maxWidth: '94vw', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: 'var(--sh-xl)', border: '1px solid var(--border)',
        animation: 'scaleIn 0.35s var(--ease-pop) both',
        pointerEvents: 'auto',
      }}>

        {/* ── Case preview ── */}
        {isOsceCase ? (
          // OSCE: blind. No name / category / chief complaint.
          <div style={{
            marginBottom: 22, padding: '20px 22px',
            background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
            color: '#fff', borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                OSCE · {caseData.stage === 'koas' ? 'Koas' : 'Pre-klinik'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>
                Kasus {caseNumber}
              </div>
            </div>
            <DiffBadge level={caseData.difficultyLevel} />
          </div>
        ) : (
          // Practice: title + first impression. No chief complaint, no synopsis.
          <div style={{
            marginBottom: 22, padding: '16px 18px',
            background: caseData.accentLight, borderRadius: 18,
            border: `1.5px solid ${caseData.accentColor}25`,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: caseData.firstImpression ? 10 : 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: caseData.accentColor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {caseData.stage === 'koas' ? 'Koas · Latihan' : 'Pre-klinik · Latihan'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>
                  {caseData.title}
                </div>
              </div>
              <DiffBadge level={caseData.difficultyLevel} />
            </div>
            {caseData.firstImpression && (
              <div style={{
                background: 'var(--surface)', borderRadius: 10,
                padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
              }}>
                <div style={{
                  fontSize: 9, color: 'var(--text-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
                }}>Kesan Pertama</div>
                {caseData.firstImpression}
              </div>
            )}
          </div>
        )}

        {/* ── Body: mode picker OR OSCE duration ── */}
        {isOsceCase ? (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Mulai OSCE</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
              Tidak ada hint, tidak ada progres yang terlihat. Anda hanya tahu nomor kasus
              sampai pasien mulai bicara. Pilih durasi yang diinginkan.
            </p>
            <div style={{
              background: 'var(--red-l)', borderRadius: 12, padding: '14px 16px',
              marginBottom: 22, border: '1px solid var(--red)25',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red-d)', marginBottom: 10 }}>⏱️ Durasi Station</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 7, 10].map(m => (
                  <button key={m} onClick={() => setOsceMinutes(m)} style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: osceMinutes === m ? 'var(--red)' : 'var(--surface)',
                    color: osceMinutes === m ? '#fff' : 'var(--text-2)',
                    border: `1.5px solid ${osceMinutes === m ? 'var(--red)' : 'var(--border)'}`,
                    fontFamily: 'Poppins', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}>
                    {m} min<br/>
                    <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>
                      {m === 7 ? 'Standard' : m === 5 ? 'Cepat' : 'Santai'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Pilih Mode Bermain</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
              Latihan terbuka — untuk OSCE, pilih dari tab OSCE di Case Library.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {modes.map(m => {
                const isDisabled = !m.available;
                return (
                  <button key={m.id}
                    onClick={() => !isDisabled && setSelected(m.id)}
                    disabled={isDisabled}
                    style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                    background: isDisabled ? 'var(--surface-3)' : selected === m.id ? m.bg : 'var(--surface-2)',
                    border: `2px solid ${isDisabled ? 'var(--border)' : selected === m.id ? m.color + '40' : 'var(--border)'}`,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s var(--ease-hover)',
                    transform: !isDisabled && selected === m.id ? 'scale(1.01)' : 'scale(1)',
                    fontFamily: 'Poppins',
                    opacity: isDisabled ? 0.6 : 1,
                  }}>
                    <span style={{ fontSize: 24, filter: isDisabled ? 'grayscale(0.5)' : 'none' }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDisabled ? 'var(--text-3)' : selected === m.id ? m.color : 'var(--text-1)', marginBottom: 3 }}>
                        {m.label} {isDisabled && <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6 }}>· tidak tersedia untuk kasus ini</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{m.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: `2px solid ${isDisabled ? 'var(--border)' : selected === m.id ? m.color : 'var(--border)'}`,
                      background: !isDisabled && selected === m.id ? m.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!isDisabled && selected === m.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Batal</Btn>
          <Btn variant="primary" onClick={() => onSelect({ mode: selected, osceSeconds: osceMinutes * 60 })}>
            {isOsceCase
              ? `Mulai OSCE · ${osceMinutes} min →`
              : `Mulai ${modes.find(m => m.id === selected)?.label} →`}
          </Btn>
        </div>
      </div>
      </div>
    </>
  );
};

// ── Tutorial Overlay (case-specific scripted coaching) ──────────────
// Mengikuti `tutorial-scripts.js` per kasus
const TutorialOverlay = ({ session, caseData, onDismiss }) => {
  const script = (typeof getTutorialScript === 'function') ? getTutorialScript(caseData.id) : null;
  const [stepIdx, setStepIdx] = React.useState(-1); // -1 = intro
  const [minimized, setMinimized] = React.useState(false);
  const [showRationale, setShowRationale] = React.useState(true);

  // If no script for this case (shouldn't happen with the gate, but safety)
  if (!script) {
    return null;
  }

  const steps = script.steps || [];
  const isIntro = stepIdx < 0;
  const current = isIntro ? null : steps[stepIdx];
  const isFinal = stepIdx >= steps.length;

  // Auto-advance when target domain just got discovered
  React.useEffect(() => {
    if (isIntro || isFinal || !current || !current.expectedDomain) return;
    if (session.discoveredDomains.has(current.expectedDomain)) {
      // Wait a moment for student to see the patient response, then show afterPatientResponds
      setShowRationale(false);
      const t = setTimeout(() => setShowRationale(true), 800);
      return () => clearTimeout(t);
    }
  }, [session.discoveredDomains.size, stepIdx]);

  const advance = () => {
    if (stepIdx < steps.length) setStepIdx(s => s + 1);
  };

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)} style={{
        position: 'fixed', bottom: 100, left: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--teal)', color: '#fff',
        border: 'none', cursor: 'pointer', fontSize: 22,
        boxShadow: 'var(--sh-lg)', zIndex: 200,
        animation: 'pulse 2s infinite',
      }} title="Tutorial Coach">📚</button>
    );
  }

  // ── Intro screen ──────────────────────────
  if (isIntro) {
    return (
      <div style={{
        position: 'fixed', bottom: 90, left: 16,
        width: 340, background: 'var(--surface)',
        borderRadius: 18, boxShadow: 'var(--sh-xl)',
        border: '2px solid var(--teal)40',
        zIndex: 200, animation: 'slideLeft 0.4s var(--ease-pop) both',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, var(--teal-l) 0%, var(--teal-l) 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>📚</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal-d)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tutorial Coach</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', padding: '0 6px' }}>−</button>
            <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
            {script.intro.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 14 }}>
            {script.intro.body}
          </div>
          <div style={{
            background: 'var(--teal-l)', borderRadius: 10, padding: '10px 12px',
            fontSize: 10, color: 'var(--teal-d)', lineHeight: 1.5, marginBottom: 12,
          }}>
            💡 Tutorial ini akan memandu kamu langkah demi langkah ({steps.length} step). Kamu bisa ketik pertanyaan sendiri atau gunakan saran. Setelah pasien menjawab, kita lanjut ke step berikut.
          </div>
          <button onClick={advance} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: 'var(--teal)', color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Poppins',
          }}>
            Mulai Step 1 →
          </button>
        </div>
      </div>
    );
  }

  // ── Final / done screen ──────────────────────────
  if (isFinal) {
    return (
      <div style={{
        position: 'fixed', bottom: 90, left: 16,
        width: 340, background: 'var(--surface)',
        borderRadius: 18, boxShadow: 'var(--sh-xl)',
        border: '2px solid var(--green)40',
        zIndex: 200, animation: 'slideLeft 0.4s var(--ease-pop) both',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px', background: 'var(--green-l)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>🎓</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tutorial Selesai</span>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6, marginBottom: 12 }}>
            Kamu sudah melalui semua step tutorial untuk kasus ini. Sekarang lanjutkan pemeriksaan fisik atau akhiri sesi untuk lihat ringkasan performa.
          </div>
          <button onClick={onDismiss} style={{
            width: '100%', padding: '9px', borderRadius: 10, border: 'none',
            background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'Poppins',
          }}>
            Tutup Tutorial
          </button>
        </div>
      </div>
    );
  }

  // ── Active step ──────────────────────────
  const domainAlreadyDiscovered = current.expectedDomain
    ? session.discoveredDomains.has(current.expectedDomain)
    : false;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 16,
      width: 360, maxHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column',
      background: 'var(--surface)',
      borderRadius: 18, boxShadow: 'var(--sh-xl)',
      border: '2px solid var(--teal)40',
      zIndex: 200, animation: 'slideLeft 0.4s var(--ease-pop) both',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px', background: 'var(--teal-l)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>📚</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal-d)' }}>
            Step {stepIdx + 1} / {steps.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', padding: '0 6px' }}>−</button>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>✕</button>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 3, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < stepIdx ? 'var(--teal)' : i === stepIdx ? 'var(--teal)' : 'var(--border)',
            opacity: i <= stepIdx ? 1 : 0.4,
          }} />
        ))}
      </div>

      {/* Content (scrollable) */}
      <div key={stepIdx} style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8, lineHeight: 1.35 }}>
          {current.title}
        </div>

        {/* WHY (rationale, before patient answers) */}
        {!domainAlreadyDiscovered && (
          <div style={{
            background: 'var(--amber-l)', borderRadius: 10, padding: '10px 12px',
            marginBottom: 10, borderLeft: '3px solid var(--amber)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--amber-d)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🤔 Kenapa pertanyaan ini?
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55 }}>
              {current.why}
            </div>
          </div>
        )}

        {/* Suggested question */}
        {!domainAlreadyDiscovered && current.suggestedQuestion && (
          <div style={{
            background: 'var(--teal-l)', borderRadius: 10, padding: '10px 12px',
            marginBottom: 10, borderLeft: '3px solid var(--teal)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--teal-d)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              💬 Saran pertanyaan
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.55, fontStyle: 'italic' }}>
              "{current.suggestedQuestion}"
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
              Kamu boleh tulis versi sendiri — yang penting maksudnya sama.
            </div>
          </div>
        )}

        {/* Waiting indicator */}
        {!domainAlreadyDiscovered && current.expectedDomain && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 10, padding: '8px 12px',
            fontSize: 10, color: 'var(--text-3)', textAlign: 'center',
            display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ animation: 'pulse 1.4s infinite' }}>⏳</span>
            Menunggu kamu menanyakan ke pasien...
          </div>
        )}

        {/* AFTER patient responds — clinical reasoning */}
        {(domainAlreadyDiscovered || !current.expectedDomain) && showRationale && (
          <div className="au" style={{
            background: 'var(--green-l)', borderRadius: 10, padding: '12px 14px',
            marginBottom: 10, borderLeft: '3px solid var(--green)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--green)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ✅ Clinical reasoning
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.6 }}>
              {current.afterPatientResponds}
            </div>
          </div>
        )}
      </div>

      {/* Footer (controls) */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 6, flexShrink: 0, background: 'var(--surface-2)',
      }}>
        <button onClick={() => setStepIdx(s => Math.max(-1, s - 1))}
          disabled={stepIdx <= 0}
          style={{
            padding: '7px 12px', borderRadius: 9, fontSize: 11, fontWeight: 600,
            background: 'var(--surface)', color: 'var(--text-2)',
            border: '1px solid var(--border)',
            cursor: stepIdx <= 0 ? 'default' : 'pointer', fontFamily: 'Poppins',
            opacity: stepIdx <= 0 ? 0.4 : 1,
          }}>← Prev</button>
        <button onClick={advance}
          disabled={!domainAlreadyDiscovered && current.expectedDomain}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700,
            background: (!domainAlreadyDiscovered && current.expectedDomain) ? 'var(--surface-3)' : 'var(--teal)',
            color: (!domainAlreadyDiscovered && current.expectedDomain) ? 'var(--text-3)' : '#fff',
            border: 'none',
            cursor: (!domainAlreadyDiscovered && current.expectedDomain) ? 'default' : 'pointer',
            fontFamily: 'Poppins',
          }}>
          {(!domainAlreadyDiscovered && current.expectedDomain) ? 'Tanyakan dulu...' : (stepIdx === steps.length - 1 ? 'Selesai 🎓' : 'Step berikut →')}
        </button>
      </div>
    </div>
  );
};

// ── OSCE Timer Display ────────────────────────────────────
const OSCETimer = ({ secondsLeft, totalSeconds }) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = (secondsLeft / totalSeconds) * 100;
  const isWarning = secondsLeft <= 120;
  const isDanger = secondsLeft <= 60;
  const color = isDanger ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 14px', borderRadius: 12,
      background: isDanger ? 'var(--red-l)' : isWarning ? 'var(--amber-l)' : 'var(--green-l)',
      border: `1.5px solid ${color}35`,
      animation: isDanger ? 'pulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: 14 }}>⏱️</span>
      <span style={{
        fontSize: 16, fontWeight: 800, color,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em',
      }}>
        {mins}:{secs.toString().padStart(2,'0')}
      </span>
      <div style={{ width: 60, height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 1s linear, background 0.5s' }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700 }}>OSCE</span>
    </div>
  );
};

Object.assign(window, {
  OnboardingModal, ModeSelectModal, TutorialOverlay, OSCETimer,
});
