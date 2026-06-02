// ============================================================
// OphthaSim — Dashboard, CaseLibrary, Debrief, Settings
// ============================================================

// ── App Header ────────────────────────────────────────────
const AppHeader = ({ onNav, screen, onSettings, profile, badges, auth, onLogout }) => {
  const levelInfo = getLevelInfo(profile.xp);
  const earnedCount = badges.filter(b => b.earned).length;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const displayName = auth?.name || (auth?.email ? auth.email.split('@')[0] : 'Dokter Muda');
  const initial = (displayName.match(/[A-Za-z]/) || ['D'])[0].toUpperCase();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(245,247,255,0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
           onClick={() => onNav('dashboard')}>
        <EyeOrb size={32} tone="normal" animate={false} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>OphthaSim</div>
          <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ophthalmology Edition</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {[['dashboard','Dashboard'],['library','Cases']].map(([s,l]) => (
          <button key={s} onClick={() => onNav(s)} style={{
            padding: '6px 14px', borderRadius: 10, border: 'none',
            background: screen === s ? 'var(--primary-l)' : 'transparent',
            color: screen === s ? 'var(--primary)' : 'var(--text-2)',
            fontSize: 13, fontWeight: screen === s ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.18s ease',
            fontFamily: 'Poppins',
          }}>{l}</button>
        ))}
        {/* v0.15.0: tombol Dev hanya utk admin. ADITIF, sama pola dgn tombol
            di atas (CSS var existing) — design.css TIDAK tersentuh. */}
        {auth?.role === 'admin' && (
          <button onClick={() => onNav('dev-dashboard')} style={{
            padding: '6px 14px', borderRadius: 10, border: 'none',
            background: screen === 'dev-dashboard' ? 'var(--primary-l)' : 'transparent',
            color: screen === 'dev-dashboard' ? 'var(--primary)' : 'var(--text-2)',
            fontSize: 13, fontWeight: screen === 'dev-dashboard' ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'Poppins',
          }} title="Developer Dashboard">🛠 Dev</button>
        )}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--amber-l)', borderRadius: 12, padding: '5px 12px',
          border: '1px solid var(--amber)25',
        }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-d)' }}>{profile.streak} day streak</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--primary-ll)', borderRadius: 12, padding: '5px 12px',
          border: '1px solid var(--primary-l)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Lv {levelInfo.level}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{profile.xp} XP</span>
        </div>
        <button onClick={onSettings} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--surface)', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease',
        }}>⚙️</button>

        {/* User avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '3px 10px 3px 3px', borderRadius: 999,
              border: '1px solid var(--border)', background: menuOpen ? 'var(--primary-ll)' : 'var(--surface)',
              cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'Poppins',
            }}
            title={displayName}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, boxShadow: '0 2px 6px var(--primary-glow)',
            }}>{initial}</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>

          {menuOpen && (
            <div className="af" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 240, background: 'var(--surface)',
              borderRadius: 16, border: '1px solid var(--border)',
              boxShadow: 'var(--sh-lg)', overflow: 'hidden',
              zIndex: 200,
              animation: 'fadeUp 0.2s var(--ease-in) both',
            }}>
              {/* User info */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--primary-ll)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, flexShrink: 0,
                }}>{initial}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{displayName}</div>
                  <div className="truncate" style={{ fontSize: 11, color: 'var(--text-3)' }}>{auth?.email || 'Tamu'}</div>
                </div>
              </div>
              {/* Stats inline */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Level</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Lv {levelInfo.level} · {profile.xp} XP</span>
                </div>
                <div style={{ fontSize: 13 }}>🔥 {profile.streak}d</div>
              </div>
              {/* Actions */}
              {[
                { icon: '📊', label: 'Dashboard', onClick: () => { onNav('dashboard'); setMenuOpen(false); } },
                { icon: '👤', label: 'Profil', onClick: () => { onNav('profile'); setMenuOpen(false); } },
                { icon: '📑', label: 'Case Library', onClick: () => { onNav('library'); setMenuOpen(false); } },
                { icon: '⚙️', label: 'Settings', onClick: () => { onSettings(); setMenuOpen(false); } },
              ].map((m, i) => (
                <button key={i} onClick={m.onClick} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', background: 'transparent', border: 'none',
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-1)', fontWeight: 500,
                  fontFamily: 'Poppins', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14 }}>{m.icon}</span>{m.label}
                </button>
              ))}
              {/* Logout (separated) */}
              <div style={{ borderTop: '1px solid var(--border)', padding: 6 }}>
                <button
                  onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', fontSize: 13, color: 'var(--red-d)', fontWeight: 600,
                    fontFamily: 'Poppins', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red-l)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14 }}>→</span> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================
// DASHBOARD SCREEN
// ============================================================
const DashboardScreen = ({ onNav, onStartCase, profile, badges }) => {
  const levelInfo = getLevelInfo(profile.xp);
  const completedCount = profile.completedCaseIds.length;
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Daily Challenge — prominent slot at top */}
      <DailyChallengeCard profile={profile} onStartCase={onStartCase} />

      {/* Hero */}
      <div className="au" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
        borderRadius: 28, padding: '36px 40px', marginBottom: 28,
        position: 'relative', overflow: 'hidden', color: '#fff',
      }}>
        {/* Decorative rings */}
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 320, height: 320, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 220, height: 220, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.12)',
        }} />
        <div style={{
          position: 'absolute', right: 40, top: 20,
          width: 140, height: 140, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.15)',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 16, backdropFilter: 'blur(8px)',
            }}>
              <span style={{ fontSize: 13 }}>👁️</span> Ophthalmology Simulator
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
              Selamat datang kembali,<br />Dokter Muda! 👋
            </h1>
            <p style={{ fontSize: 14, opacity: 0.82, marginBottom: 28, lineHeight: 1.6 }}>
              Latih skill anamnesis mata kamu. Setiap pasien virtual membawa pelajaran baru.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn size="lg" variant="primary" style={{ background: '#fff', color: 'var(--primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                onClick={() => onNav('library')} icon="▶">
                Mulai Kasus Baru
              </Btn>
              {completedCount > 0 && (
                <Btn size="lg" variant="ghost" style={{ color: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => onNav('library')}>
                  Lanjutkan Sesi
                </Btn>
              )}
            </div>
          </div>

          {/* XP progress in hero */}
          <div style={{
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
            borderRadius: 20, padding: '18px 22px', minWidth: 200,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Progress</div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>Lv {levelInfo.level}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 14 }}>{levelInfo.name}</div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 6, marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 999, background: '#fff',
                width: `${levelInfo.progress}%`, transition: 'width 1s var(--ease-panel)',
              }} />
            </div>
            <div style={{ fontSize: 11, opacity: 0.65, textAlign: 'right' }}>
              {levelInfo.currentXP} / {levelInfo.nextXP < 99999 ? levelInfo.nextXP : '∞'} XP
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="au d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Kasus Selesai" value={completedCount || MOCK_RECENT.length} icon="📋" color="var(--primary)" sub="dari 4 tersedia" />
        <StatCard label="Streak Aktif" value={`${profile.streak}d`} icon="🔥" color="var(--amber)" sub="hari berturut-turut" />
        <StatCard label="Badge Earned" value={earnedBadges.length} icon="🏅" color="var(--gold)" sub={`dari ${BADGES.length} total`} />
        <StatCard label="Avg Score" value="74%" icon="📈" color="var(--teal)" sub="across all cases" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Recent Activity */}
        <div>
          <SectionHeader title="Sesi Terakhir" sub="Hasil anamnesis terbaru kamu" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_RECENT.map((s, i) => {
              const caseData = CASES.find(c => c.id === s.caseId);
              return (
                <div key={s.caseId} className={`au d${i+2}`}>
                  <Card hover onClick={() => onStartCase(caseData)} padding={16}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: caseData ? caseData.accentLight : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>
                        {caseData ? { 'case-001':'🔴', 'case-002':'⚡', 'case-003':'🔆', 'case-004':'💧' }[s.caseId] : '👁️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{s.caseName}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {caseData && <DiffBadge level={caseData.difficultyLevel} />}
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.date}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{
                          fontSize: 20, fontWeight: 800,
                          color: s.score >= 80 ? 'var(--green)' : s.score >= 60 ? 'var(--amber)' : 'var(--red)',
                        }}>{s.score}%</span>
                        <div style={{ width: 100 }}>
                          <ProgressBar value={s.domains} max={s.total}
                            color={s.score >= 80 ? 'var(--green)' : s.score >= 60 ? 'var(--amber)' : 'var(--red)'}
                            height={5} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{s.domains}/{s.total} domains</span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badge sidebar */}
        <div>
          <SectionHeader title="Badge Collection" sub={`${earnedBadges.length} earned`} />
          <Card padding={20}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, justifyItems: 'center' }}>
              {badges.slice(0, 9).map((badge, i) => (
                <div key={badge.id} className={`ab d${Math.min(i+1,8)}`}>
                  <BadgeItem badge={badge} size="md" />
                </div>
              ))}
            </div>
            {earnedBadges.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, marginTop: 10 }}>
                Complete cases to unlock badges!
              </p>
            )}
          </Card>

          {/* Skill Heatmap — data NYATA dari scoreHistory (kontrak §3A
              rubrik). Lebih jelas: nilai + label kualitatif + bar tebal. */}
          <div style={{ marginTop: 16 }}>
            <Card padding={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Skill Heatmap</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Rata-rata penilaian AI
                </div>
              </div>
              {(() => {
                const META = {
                  coverage:      { label: 'Cakupan Anamnesis', color: 'var(--primary)' },
                  fife:          { label: 'FIFE & Empati',      color: 'var(--violet)' },
                  redFlags:      { label: 'Deteksi Red Flag',   color: 'var(--red)' },
                  communication: { label: 'Komunikasi',          color: 'var(--teal)' },
                };
                const rows = (typeof skillAverages === 'function' ? skillAverages(profile) : [])
                  .filter(r => META[r.key]);
                const hasData = rows.some(r => r.value !== null);
                if (!hasData) {
                  return (
                    <div style={{
                      textAlign: 'center', padding: '18px 8px',
                      fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6,
                    }}>
                      Selesaikan kasus (dinilai AI) untuk melihat<br />kekuatan &amp; kelemahan skill kamu di sini.
                    </div>
                  );
                }
                const tag = (v) => v == null ? { t: '—', c: 'var(--text-3)' }
                  : v >= 80 ? { t: 'Baik',         c: 'var(--green)' }
                  : v >= 60 ? { t: 'Cukup',        c: 'var(--amber-d)' }
                  :           { t: 'Perlu latihan', c: 'var(--red)' };
                return rows.map(r => {
                  const m = META[r.key];
                  const v = r.value;
                  const g = tag(v);
                  return (
                    <div key={r.key} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{m.label}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: v == null ? 'var(--text-3)' : m.color }}>
                            {v == null ? '—' : v}
                            {v != null && <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>/100</span>}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: g.c + '1A', color: g.c,
                          }}>{g.t}</span>
                        </span>
                      </div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999, width: (v == null ? 0 : v) + '%',
                          background: `linear-gradient(90deg, ${m.color}, ${m.color}cc)`,
                          transition: 'width 0.8s var(--ease-panel)',
                          boxShadow: `0 0 8px ${m.color}40`,
                        }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CASE LIBRARY SCREEN
// ============================================================
// Taxonomy:
//   Stage     : 'preklinik' | 'koas'
//   Case type : 'practice' (Latihan & Tutorial) | 'osce'
//   Difficulty: Easy / Medium / Hard
//
// Practice cards expose minimal pre-anamnesis info (title + first impression).
// OSCE cards expose NOTHING beyond a case number + difficulty — student walks
// in blind, exactly like a real OSCE station.

// ── Practice case card (minimal info — first impression only) ───────────
const PracticeCaseCard = ({ c, isComplete, isFav, isHov, onMouseEnter, onMouseLeave, onClick, onToggleFavorite }) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      borderRadius: 22,
      border: `1.5px solid ${isHov ? c.accentColor + '55' : 'var(--border)'}`,
      boxShadow: isHov ? `0 16px 48px ${c.accentColor}1F, var(--sh-md)` : 'var(--sh-sm)',
      transform: isHov ? 'translateY(-4px)' : 'none',
      transition: 'all 0.28s var(--ease-hover)',
      cursor: 'pointer', overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}
  >
    {onToggleFavorite && (
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2 }}>
        <BookmarkStar active={isFav} onClick={() => onToggleFavorite(c.id)} size={30} />
      </div>
    )}
    {/* Accent strip */}
    <div style={{ height: 5, background: `linear-gradient(90deg, ${c.accentColor}, ${c.accentColor}88)` }} />

    <div style={{ padding: '22px 22px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Top row — case # + difficulty */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, paddingRight: 36,
      }}>
        <span style={{
          fontSize: 10, color: 'var(--text-3)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.09em',
        }}>
          Kasus #{(c.id || '').replace(/[^0-9]/g, '').replace(/^0+/, '') || '—'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <DiffBadge level={c.difficultyLevel} />
          {isComplete && (
            <span style={{ fontSize: 10, background: 'var(--green-l)', color: 'var(--green)', fontWeight: 700, padding: '2px 8px', borderRadius: 7 }}>
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Title — biggest item on the card */}
      <h3 style={{
        fontSize: 17, fontWeight: 800, color: 'var(--text-1)',
        lineHeight: 1.3, marginBottom: 12, textWrap: 'pretty',
      }}>{c.title}</h3>

      {/* First impression — physical appearance only, nothing more */}
      {c.firstImpression && (
        <div style={{
          background: 'var(--surface-2)',
          borderLeft: `3px solid ${c.accentColor}`,
          borderRadius: '4px 10px 10px 4px',
          padding: '10px 12px',
          fontSize: 12, color: 'var(--text-2)',
          lineHeight: 1.55, marginBottom: 14,
        }}>
          <div style={{
            fontSize: 9, color: 'var(--text-3)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
          }}>Kesan Pertama</div>
          {c.firstImpression}
        </div>
      )}

      {/* Footer — duration + CTA */}
      <div style={{
        marginTop: 'auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 6,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⏱ {c.estimatedTime}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          color: c.accentColor, fontSize: 12, fontWeight: 700,
          opacity: isHov ? 1 : 0.4, transition: 'opacity 0.2s',
        }}>
          Mulai →
        </div>
      </div>
    </div>
  </div>
);

// ── OSCE case card (zero info — case number only) ───────────────────────
const OsceCaseCard = ({ c, isComplete, isHov, onMouseEnter, onMouseLeave, onClick }) => {
  const num = c.displayId || (c.id || '').replace(/[^0-9]/g, '').padStart(2, '0');
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        background: isHov
          ? `linear-gradient(135deg, var(--text-1) 0%, #1f2937 100%)`
          : `linear-gradient(135deg, #1F2937 0%, #111827 100%)`,
        color: '#fff',
        borderRadius: 22,
        border: `1.5px solid ${isHov ? '#ffffff30' : '#ffffff14'}`,
        boxShadow: isHov ? '0 16px 48px rgba(0,0,0,0.35), var(--sh-md)' : 'var(--sh-sm)',
        transform: isHov ? 'translateY(-4px)' : 'none',
        transition: 'all 0.28s var(--ease-hover)',
        cursor: 'pointer',
        aspectRatio: '5 / 4',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '22px',
      }}
    >
      {/* Subtle grid pattern */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
        backgroundSize: '18px 18px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.55)',
        }}>OSCE Station</span>
        {isComplete && (
          <span style={{
            fontSize: 9, background: 'rgba(52,211,153,0.18)', color: '#34D399',
            fontWeight: 700, padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(52,211,153,0.35)',
          }}>✓ Selesai</span>
        )}
      </div>

      <div style={{ position: 'relative', textAlign: 'left' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
          marginBottom: 4, letterSpacing: '0.04em',
        }}>Kasus</div>
        <div style={{
          fontSize: 72, fontWeight: 800, lineHeight: 0.95,
          fontFamily: 'Poppins', letterSpacing: '-0.04em',
        }}>{num}</div>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <DiffBadge level={c.difficultyLevel} />
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600,
        }}>
          ⏱ {c.estimatedTime || '7 min'}
        </span>
      </div>
    </div>
  );
};

// ── Stage / track segmented control ─────────────────────────────────────
const SegControl = ({ options, value, onChange, accent = 'var(--primary)' }) => (
  <div style={{
    display: 'inline-flex', padding: 4, gap: 4,
    background: 'var(--surface-2)', borderRadius: 14,
    border: '1px solid var(--border)',
  }}>
    {options.map(o => {
      const active = value === o.id;
      return (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none',
          background: active ? 'var(--surface)' : 'transparent',
          color: active ? 'var(--text-1)' : 'var(--text-3)',
          fontFamily: 'Poppins', fontSize: 13, fontWeight: active ? 700 : 500,
          cursor: 'pointer', transition: 'all 0.18s var(--ease-hover)',
          boxShadow: active ? 'var(--sh-sm)' : 'none',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {o.icon && <span style={{ fontSize: 15 }}>{o.icon}</span>}
          {o.label}
          {typeof o.count === 'number' && (
            <span style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 999,
              background: active ? accent : 'var(--surface-3)',
              color: active ? '#fff' : 'var(--text-3)', fontWeight: 700,
            }}>{o.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

const CaseLibraryScreen = ({ onStartCase, completedCaseIds, onBuildCase, favoriteCaseIds = [], onToggleFavorite }) => {
  const [stage, setStage]       = React.useState('preklinik'); // 'preklinik' | 'koas'
  const [caseType, setCaseType] = React.useState('practice');  // 'practice' | 'osce'
  const [diff, setDiff]         = React.useState('All');       // 'All' | 'Easy' | 'Medium' | 'Hard'
  const [favOnly, setFavOnly]   = React.useState(false);
  const [hovered, setHovered]   = React.useState(null);
  const toast = useToast();

  // All cases matching stage + caseType (before difficulty/favorite filter)
  const inBucket = React.useMemo(() => CASES.filter(c =>
    c.stage === stage && c.caseType === caseType
  ), [stage, caseType, CASES.length]);

  // Apply difficulty + favorite filters
  const visible = inBucket.filter(c => {
    if (diff !== 'All' && c.difficulty !== diff) return false;
    if (favOnly && !favoriteCaseIds.includes(c.id)) return false;
    return true;
  });

  // Counts for sub-tabs (within current stage)
  const stageCases = React.useMemo(() => CASES.filter(c => c.stage === stage), [stage, CASES.length]);
  const practiceCount = stageCases.filter(c => c.caseType === 'practice').length;
  const osceCount     = stageCases.filter(c => c.caseType === 'osce').length;

  const stageMeta = (window.STAGES || []).find(s => s.id === stage) || { label: stage, sub: '' };
  const isOsce = caseType === 'osce';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* ── Header row ────────────────────────────────────────── */}
      <div style={{
        marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>
            Case Library
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5 }}>
            Pilih tahap pendidikan, lalu pilih antara latihan terbuka atau simulasi OSCE.
          </p>
        </div>
        {onBuildCase && (
          <Btn variant="secondary" onClick={onBuildCase} icon="✏️">Buat Kasus Baru</Btn>
        )}
      </div>

      {/* ── Stage selector (Pre-klinik / Koas) ────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <SegControl
          options={(window.STAGES || []).map(s => ({
            ...s,
            count: CASES.filter(c => c.stage === s.id).length,
          }))}
          value={stage}
          onChange={(v) => { setStage(v); }}
        />
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>{stageMeta.sub}</p>
      </div>

      {/* ── Case-type sub-tabs (Latihan / OSCE) ──────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 22, borderBottom: '1px solid var(--border)',
      }}>
        {(window.CASE_TYPES || []).map(t => {
          const active = caseType === t.id;
          const count = t.id === 'practice' ? practiceCount : osceCount;
          return (
            <button key={t.id} onClick={() => setCaseType(t.id)} style={{
              padding: '12px 4px', marginRight: 18, marginBottom: -1,
              background: 'transparent', border: 'none',
              borderBottom: `2.5px solid ${active ? 'var(--primary)' : 'transparent'}`,
              color: active ? 'var(--text-1)' : 'var(--text-3)',
              fontFamily: 'Poppins', fontSize: 14, fontWeight: active ? 800 : 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.18s',
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
              <span style={{
                fontSize: 10, padding: '1px 8px', borderRadius: 999,
                background: active ? 'var(--primary-l)' : 'var(--surface-2)',
                color: active ? 'var(--primary)' : 'var(--text-3)', fontWeight: 700,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-tab description ──────────────────────────────── */}
      <div style={{
        marginBottom: 22, padding: '12px 16px',
        background: isOsce ? 'var(--surface-2)' : 'var(--primary-ll)',
        borderRadius: 14,
        border: `1px solid ${isOsce ? 'var(--border)' : 'var(--primary-l)'}`,
        fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
      }}>
        {isOsce
          ? '⏱️ Kasus OSCE — tidak ada info awal selain nomor kasus. Anda masuk ke ruangan tanpa tahu diagnosis. Timer berjalan, tidak ada hint atau progres.'
          : '📚 Latihan & Tutorial — Anda dapat melihat kesan pertama pasien sebelum mulai. Mode Tutorial tersedia pada beberapa kasus terpilih; sisanya gunakan Mode Normal.'}
      </div>

      {/* ── Difficulty filter chips ──────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
          Tingkat
        </span>
        {['All','Easy','Medium','Hard'].map(f => (
          <Chip key={f} label={f === 'All' ? 'Semua' : f} active={diff === f}
            color="var(--primary)" bg="var(--primary-l)"
            onClick={() => setDiff(f)} />
        ))}
        {!isOsce && onToggleFavorite && (
          <>
            <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <Chip label={favOnly ? '★ Favorit' : '☆ Favorit'} active={favOnly}
              color="var(--amber-d)" bg="var(--amber-l)"
              onClick={() => setFavOnly(v => !v)} />
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          {visible.length} kasus
        </span>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isOsce
            ? 'repeat(auto-fill, minmax(220px, 1fr))'
            : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}>
          {visible.map((c, i) => {
            const isComplete = completedCaseIds.includes(c.id);
            const isFav      = favoriteCaseIds.includes(c.id);
            const locked     = !!c.locked;
            const isHov      = !locked && hovered === c.id;
            // v0.16.0: kasus terkunci → overlay + lock badge, klik = toast
            // (tak navigate). Kasus aktif → perilaku lama persis.
            const onLockedClick = () => toast.show(
              'Kasus ini masih terkunci. Fokus ke kasus preklinik dulu — batch lanjutan menyusul.',
              'info'
            );
            const common = {
              c, isComplete, isHov,
              onMouseEnter: () => { if (!locked) setHovered(c.id); },
              onMouseLeave: () => setHovered(null),
              onClick: locked ? onLockedClick : () => onStartCase(c),
            };
            return (
              <div key={c.id} className={`au d${Math.min(i+1, 6)}`} style={{ position: 'relative' }}>
                {locked && (
                  <div
                    onClick={onLockedClick}
                    style={{
                      position: 'absolute', inset: 0, zIndex: 3,
                      borderRadius: 22, cursor: 'not-allowed',
                      background: 'rgba(245,247,255,0.35)',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                      padding: 14,
                    }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 800, color: 'var(--text-2)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      padding: '5px 11px', borderRadius: 999, boxShadow: 'var(--sh-sm)',
                    }}>🔒 Terkunci</span>
                  </div>
                )}
                <div style={locked ? { filter: 'grayscale(0.85)', opacity: 0.55, pointerEvents: 'none' } : null}>
                  {isOsce
                    ? <OsceCaseCard {...common} />
                    : <PracticeCaseCard {...common} isFav={isFav} onToggleFavorite={onToggleFavorite} />
                  }
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: 'var(--text-3)',
          background: 'var(--surface-2)', borderRadius: 18,
          border: '1.5px dashed var(--border)',
        }}>
          <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.5 }}>
            {isOsce ? '⏱️' : '📋'}
          </div>
          <p style={{ fontSize: 13, marginBottom: 4, fontWeight: 600, color: 'var(--text-2)' }}>
            Belum ada kasus pada filter ini
          </p>
          <p style={{ fontSize: 11 }}>
            Kasus untuk {stageMeta.label} · {isOsce ? 'OSCE' : 'Latihan'} {diff !== 'All' ? `· tingkat ${diff}` : ''} akan ditambahkan.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// DEBRIEF SCREEN
// ============================================================
const DebriefScreen = ({ session, caseData, onRetry, onNewCase, onDashboard, profile, examResult, onUpdateProfile }) => {
  const [revealed, setRevealed] = React.useState(false);
  const [xpAnimated, setXpAnimated] = React.useState(false);
  const [expanded, setExpanded] = React.useState({ process: false, coverage: false, critical: false, redFlags: false, diagnosis: false });
  const toast = useToast();

  // Compute comprehensive OSCE-rubric score (per OSCE_RUBRIC.md §D)
  const osceScore = React.useMemo(() => {
    if (typeof computeOSCEScore === 'function') {
      return computeOSCEScore(session, caseData, examResult);
    }
    return null;
  }, [session, caseData, examResult]);

  React.useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 300);
    const t2 = setTimeout(() => setXpAnimated(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  React.useEffect(() => {
    if (xpAnimated && osceScore && osceScore.score >= 80 && typeof window.confetti === 'function') {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#5865F2','#14B8A6','#F59E0B','#8B5CF6'] });
    }
  }, [xpAnimated, osceScore]);

  // Use OSCE score as primary, fallback to legacy
  const score = osceScore ? osceScore.score : session.scoring.score;
  const completeness = osceScore ? osceScore.completeness : session.scoring.completeness;
  const confidence = osceScore ? osceScore.confidence : session.scoring.confidence;
  const criticalCovered = osceScore ? osceScore.criticalCovered : session.scoring.criticalCovered;
  const criticalTotal = osceScore ? osceScore.criticalTotal : session.scoring.criticalTotal;
  const redFlagsFound = osceScore ? osceScore.redFlagsFound : session.scoring.redFlagsFound;
  const totalRedFlags = osceScore ? osceScore.totalRedFlags : session.scoring.totalRedFlags;
  const grade = osceScore ? osceScore.grade : (
    score >= 90 ? { label: 'Luar Biasa!', color: 'var(--green)', emoji: '⭐', letter: 'A' } :
    score >= 75 ? { label: 'Bagus Sekali', color: 'var(--teal)', emoji: '🎯', letter: 'B' } :
    score >= 60 ? { label: 'Cukup Baik', color: 'var(--amber)', emoji: '👍', letter: 'C' } :
    { label: 'Perlu Latihan', color: 'var(--red)', emoji: '💪', letter: 'D' }
  );

  // §5.4 v0.12.0: catat skor sesi sekali (rata-rata profil + Skill Heatmap).
  const _scoredRef = React.useRef(false);
  React.useEffect(() => {
    if (_scoredRef.current || typeof recordScore !== 'function') return;
    _scoredRef.current = true;
    try {
      const rep = session.scoring && session.scoring._report;
      const next = recordScore(profile, {
        caseId: caseData.id, score: score,
        breakdown: rep && rep.breakdown,
      });
      if (next !== profile && typeof onUpdateProfile === 'function') onUpdateProfile(next);
    } catch (e) {}
  }, []);

  const xpGained = session.xpGained || Math.round(score * 1.5);
  const elapsed = session.elapsed || 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const newBadges = session.newBadges || [];
  const mode = session.mode || (session.osceMode ? 'osce' : session.tutorialMode ? 'tutorial' : 'normal');

  const coveredDomains = caseData.keyDomains.filter(d => session.discoveredDomains.has(d));
  const missedDomains = caseData.keyDomains.filter(d => !session.discoveredDomains.has(d));

  const tips = [
    missedDomains.includes('laterality') && 'Selalu tanyakan lateralitas (mata mana) di awal anamnesis.',
    missedDomains.includes('contact_lens') && 'Riwayat pemakaian lensa kontak sangat penting pada kasus mata merah.',
    redFlagsFound < 2 && 'Latih deteksi red flag: floaters, flashes, photophobia berat, dan curtain sign.',
    missedDomains.includes('systemic') && 'Jangan lupa kaitkan gejala mata dengan kondisi sistemik (DM, AS, hipertensi).',
    criticalCovered < criticalTotal && `Kamu melewatkan ${criticalTotal - criticalCovered} domain kritis. Fokuskan pada area ini.`,
    score >= 80 && 'Excellent! Pertahankan pola anamnesis yang sistematis dan terstruktur.',
  ].filter(Boolean).slice(0, 4);

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Grade Header */}
      <div className="as" style={{
        textAlign: 'center', marginBottom: 28,
        background: `linear-gradient(135deg, ${grade.color} 0%, ${grade.color}AA 100%)`,
        borderRadius: 28, padding: '36px 40px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          {mode === 'osce' ? '⏱️ OSCE Mode' : mode === 'tutorial' ? '📚 Tutorial Mode' : '🎯 Latihan Normal'} · {caseData.title}
        </div>
        <div style={{ fontSize: 48, marginBottom: 4, animation: 'bounceIn 0.6s var(--ease-pop) 0.3s both' }}>{grade.emoji}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{grade.label}</h1>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 18 }}>
          Grade <strong>{grade.letter}</strong> · {mins}:{secs.toString().padStart(2,'0')} menit · {session.questionCount || 0} pertanyaan
        </div>
        <div style={{
          display: 'inline-flex', gap: 28, background: 'rgba(255,255,255,0.15)',
          borderRadius: 16, padding: '14px 28px', backdropFilter: 'blur(10px)',
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{revealed ? score : 0}<span style={{ fontSize: 16, opacity: 0.75 }}>/100</span></div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>Total Skor</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{revealed ? completeness : 0}%</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>Domain</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{revealed ? redFlagsFound : 0}<span style={{ fontSize: 16, opacity: 0.75 }}>/{totalRedFlags}</span></div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>Red Flag</div>
          </div>
        </div>

        {/* OSCE modifier notice */}
        {osceScore && osceScore.modifiers && (osceScore.modifiers.bonusFast || osceScore.modifiers.penaltyMissed) && (
          <div style={{ marginTop: 14, display: 'flex', gap: 12, justifyContent: 'center', fontSize: 11, opacity: 0.92 }}>
            {osceScore.modifiers.bonusFast > 0 && <span>⚡ Bonus selesai cepat OSCE: +{osceScore.modifiers.bonusFast}</span>}
            {osceScore.modifiers.penaltyMissed < 0 && <span>⚠️ Penalti critical terlewat OSCE: {osceScore.modifiers.penaltyMissed}</span>}
            {osceScore.modifiers.cap < 100 && <span>🔒 Maks skor dibatasi {osceScore.modifiers.cap} (critical terlewat)</span>}
          </div>
        )}
      </div>

      {/* ───── RUBRIC BREAKDOWN ───── */}
      {osceScore && (
        <Card padding={20} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Rincian Penilaian (OSCE Rubric)
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
            Mengacu pada OSCE_RUBRIC.md §D · klik tiap baris untuk detail
          </div>

          {/* Component bars */}
          {[
            { key: 'process', label: 'Process & Structure', color: 'var(--violet)', icon: '📋', sub: 'Salam, urutan, klarifikasi, closing' },
            { key: 'coverage', label: 'Domain Coverage', color: 'var(--primary)', icon: '✅', sub: 'Berapa domain anamnesis yang ditanyakan' },
            { key: 'critical', label: 'Critical Domains', color: 'var(--amber)', icon: '⭐', sub: 'Domain yang tidak boleh terlewat' },
            { key: 'redFlags', label: 'Red Flag Detection', color: 'var(--red)', icon: '🚩', sub: 'Tanda bahaya klinis yang terdeteksi' },
            { key: 'diagnosis', label: 'Diagnosis & Examination', color: 'var(--teal)', icon: '🎯', sub: 'Pilihan Dx + pemeriksaan' },
          ].map(comp => {
            const data = osceScore.breakdown[comp.key];
            const pct = (data.earned / data.max) * 100;
            const isExpanded = expanded[comp.key];
            return (
              <div key={comp.key} style={{ marginBottom: 10 }}>
                <div onClick={() => toggleExpand(comp.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'var(--surface-2)', borderRadius: 12, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{comp.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{comp.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: comp.color }}>
                        {data.earned} <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>/ {data.max}</span>
                      </span>
                    </div>
                    <ProgressBar value={data.earned} max={data.max} color={comp.color} height={6} />
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{comp.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
                </div>

                {/* Expand detail */}
                {isExpanded && (
                  <div style={{ padding: '10px 14px 14px 50px', fontSize: 11, color: 'var(--text-2)' }}>
                    {comp.key === 'process' && data.items && (
                      <div>
                        {data.items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < data.items.length - 1 ? '1px dotted var(--border)' : 'none' }}>
                            <span style={{ color: it.hit ? 'var(--text-1)' : 'var(--text-3)' }}>
                              {it.hit ? '✓' : '○'} {it.label}
                            </span>
                            <span style={{ fontWeight: 700, color: it.hit ? 'var(--green)' : 'var(--text-3)' }}>{it.earned}/{it.max}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {comp.key === 'coverage' && (
                      <div>
                        <div style={{ marginBottom: 6 }}>
                          <strong>Terjawab ({data.covered.length}):</strong> {data.covered.map(d => DOMAIN_QUESTIONS[d]?.label || d).join(', ') || '—'}
                        </div>
                        <div style={{ color: 'var(--red-d)' }}>
                          <strong>Terlewat ({data.missed.length}):</strong> {data.missed.map(d => DOMAIN_QUESTIONS[d]?.label || d).join(', ') || '—'}
                        </div>
                      </div>
                    )}
                    {comp.key === 'critical' && (
                      <div>
                        <div style={{ marginBottom: 6 }}>
                          <strong>Critical terjawab:</strong> {data.covered.map(d => DOMAIN_QUESTIONS[d]?.label || d).join(', ') || '—'}
                        </div>
                        <div style={{ color: 'var(--red-d)' }}>
                          <strong>⚠️ Critical TERLEWAT:</strong> {data.missed.map(d => DOMAIN_QUESTIONS[d]?.label || d).join(', ') || '—'}
                        </div>
                        {data.missed.length > 0 && (
                          <div style={{ marginTop: 6, padding: 8, background: 'var(--red-l)', borderRadius: 8, fontSize: 10, color: 'var(--red-d)' }}>
                            Critical domain terlewat → maks skor sesi dibatasi 75.
                          </div>
                        )}
                      </div>
                    )}
                    {comp.key === 'redFlags' && (
                      <div>Anda menemukan <strong>{data.found}</strong> dari <strong>{data.total}</strong> red flag pada kasus ini.</div>
                    )}
                    {comp.key === 'diagnosis' && (
                      <div>
                        <div>• Diagnosis primer: {data.correct ? '✓ Benar' : '✗ Belum tepat'} ({data.correct ? 6 : 0}/6)</div>
                        <div>• Differential ≥1: {data.differentialCount >= 1 ? '✓' : '○'} ({data.differentialCount >= 1 ? 2 : 0}/2)</div>
                        <div>• Pemeriksaan selesai ≥6: {data.examCompleted >= 6 ? '✓' : '○'} ({data.examCompleted >= 6 ? 2 : 0}/2)</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* XP Reward */}
      {xpAnimated && (
        <div className="ab" style={{
          background: 'var(--amber-l)', border: '1.5px solid var(--amber)30',
          borderRadius: 20, padding: '16px 22px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--amber)', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--amber-d)' }}>+{xpGained} XP Earned!</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
              {getLevelInfo(profile.xp + xpGained).name} · {profile.xp + xpGained} XP total
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6 }}>Menuju Level Berikutnya</div>
            <div style={{ width: 120 }}>
              <ProgressBar value={getLevelInfo(profile.xp + xpGained).progress} max={100} color="var(--amber)" height={6} />
            </div>
          </div>
        </div>
      )}

      {/* New Badges */}
      {newBadges.length > 0 && (
        <div className="au" style={{
          background: 'var(--gold-l)', borderRadius: 20, padding: '18px 24px',
          marginBottom: 18, border: '1.5px solid var(--gold)30',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber-d)', marginBottom: 14 }}>🏅 Badge Baru Terbuka!</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {newBadges.map(b => <BadgeItem key={b.id} badge={{ ...b, earned: true }} size="md" animate />)}
          </div>
        </div>
      )}

      {/* Tips */}
      <Card padding={18} style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>💡 Rekomendasi untuk Kamu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ───── PENILAIAN AI (narasi LLM-judge, kontrak §3A v0.12.0) ───── */}
      {session.scoring && session.scoring._report &&
        (session.scoring._report.summary ||
         (session.scoring._report.positiveNotes || []).length ||
         (session.scoring._report.missedItems || []).length) ? (
        <Card padding={20} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            🧠 Penilaian AI
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
            Umpan balik dari penilai AI atas anamnesis, diagnosis banding &amp; rencana tatalaksana Anda
          </div>

          {session.scoring._report.summary && (
            <div style={{
              fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65,
              padding: '14px 16px', background: 'var(--primary-ll)',
              border: '1px solid var(--primary-l)', borderRadius: 12, marginBottom: 16,
            }}>
              {session.scoring._report.summary}
            </div>
          )}

          {(session.scoring._report.positiveNotes || []).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✓ Sudah Baik
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {session.scoring._report.positiveNotes.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 9, padding: '9px 12px',
                    background: 'var(--green-l)', borderRadius: 10,
                    fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
                  }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(session.scoring._report.missedItems || []).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-d)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚠ Perlu Diperbaiki
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {session.scoring._report.missedItems.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 9, padding: '9px 12px',
                    background: 'var(--amber-l)', borderRadius: 10,
                    fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
                  }}>
                    <span style={{ color: 'var(--amber-d)', flexShrink: 0 }}>⚠</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {/* Exam Diagnosis Result */}
      {examResult && (
        <div className="au" style={{
          marginBottom: 18,
          background: examResult.isCorrect ? 'var(--green-l)' : 'var(--red-l)',
          border: `1.5px solid ${examResult.isCorrect ? 'var(--green)' : 'var(--red)'}30`,
          borderRadius: 20, padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: examResult.isCorrect ? 'var(--green)' : 'var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {examResult.isCorrect ? '🎯' : '🔬'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: examResult.isCorrect ? 'var(--green)' : 'var(--red-d)', marginBottom: 3 }}>
              {examResult.isCorrect ? '✓ Diagnosis Benar!' : '✕ Diagnosis Kurang Tepat'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Kamu memilih: <strong>{examResult.selectedDiagnosis}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis reveal — fallback when DDx commit was skipped */}
      {!session.ddxCommit && (
        <Card padding={18} style={{ marginBottom: 18, background: 'var(--primary-ll)', border: '1.5px solid var(--primary-l)' }}>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Diagnosis Kasus Ini</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{caseData.correctDiagnosis}</div>
        </Card>
      )}

      {/* DDx commit vs correct diagnosis comparison */}
      {session.ddxCommit && !session.ddxCommit.skipped && typeof DDxCompareCard !== 'undefined' && (
        <DDxCompareCard
          ddxCommit={session.ddxCommit}
          caseData={caseData}
          examResult={examResult}
        />
      )}

      {/* Reflection journal prompt */}
      {typeof ReflectionCard !== 'undefined' && (
        <ReflectionCard
          caseData={caseData}
          session={session}
          score={score}
          profile={profile}
          onSaved={onUpdateProfile}
        />
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <Btn variant="secondary" onClick={onRetry}>🔄 Ulangi Kasus</Btn>
        <Btn variant="primary" onClick={onNewCase} icon="📋">Kasus Baru</Btn>
        <Btn variant="ghost" onClick={onDashboard}>← Dashboard</Btn>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS PANEL
// ============================================================
const SettingsPanel = ({ settings, onChange, onClose, onLogout }) => (
  <>
    <Overlay onClick={onClose} />
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 340, background: 'var(--surface)', zIndex: 1001,
      boxShadow: 'var(--sh-xl)', animation: 'drawerIn 0.38s var(--ease-panel) both',
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Settings</h2>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Kustomisasi pengalamanmu</p>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--surface-2)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Options */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {[
          { key: 'sound',    label: 'Sound Effects',    sub: 'Suara klik, sukses, dan notifikasi', icon: '🔊' },
          { key: 'motion',   label: 'Animasi Penuh',    sub: 'Spring animation dan motion effects', icon: '✨' },
          { key: 'confetti', label: 'Konfeti Reward',   sub: 'Celebrasi saat mencapai milestone', icon: '🎉' },
          { key: 'hints',    label: 'Tampilkan Hints',  sub: 'Petunjuk kecil di panel kanan', icon: '💡' },
        ].map(opt => (
          <div key={opt.key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{opt.sub}</div>
              </div>
            </div>
            <button onClick={() => onChange(opt.key, !settings[opt.key])} style={{
              width: 44, height: 24, borderRadius: 12,
              background: settings[opt.key] ? 'var(--primary)' : 'var(--border)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, borderRadius: '50%', width: 18, height: 18,
                background: '#fff', transition: 'left 0.2s var(--ease-panel)',
                left: settings[opt.key] ? 23 : 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        ))}

        {/* Theme */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tema</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Light','Dark','System'].map(t => (
              <Chip key={t} label={t} active={settings.theme === t.toLowerCase()}
                color="var(--primary)" bg="var(--primary-l)"
                onClick={() => onChange('theme', t.toLowerCase())} />
            ))}
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Keyboard Shortcuts</div>
          {[
            ['Enter', 'Kirim pesan'],
            ['Shift+Enter', 'Baris baru'],
            ['Esc', 'Tutup panel'],
            ['Tab', 'Navigasi chip'],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <code style={{ fontSize: 11, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{key}</code>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        {onLogout && (
          <button
            onClick={() => { onClose && onClose(); onLogout(); }}
            style={{
              padding: '10px 16px', borderRadius: 14,
              border: '1.5px solid var(--red)30',
              background: 'var(--red-l)', color: 'var(--red-d)',
              fontSize: 13, fontWeight: 700, fontFamily: 'Poppins',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-l)'; e.currentTarget.style.color = 'var(--red-d)'; e.currentTarget.style.borderColor = 'var(--red)30'; }}
          >→ Keluar</button>
        )}
        <Btn variant="primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Simpan & Tutup</Btn>
      </div>
    </div>
  </>
);

Object.assign(window, {
  AppHeader, DashboardScreen, CaseLibraryScreen,
  DebriefScreen, SettingsPanel,
});
