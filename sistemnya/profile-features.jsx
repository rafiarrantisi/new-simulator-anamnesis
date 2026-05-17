// ============================================================
// OphthaSim — Profile, Bookmarks, Daily Challenge, Activity Heatmap
// ============================================================

// ── Date helpers ─────────────────────────────────────────
const _todayKey = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};
const _dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

// Deterministic hash of date → index into CASES → today's challenge
const _pickDailyCase = () => {
  const k = _todayKey();
  let h = 0;
  for (let i = 0; i < k.length; i++) h = ((h << 5) - h) + k.charCodeAt(i);
  // Only practice cases — OSCE cases must stay blind / un-spoiled on the dashboard
  const cases = (typeof CASES !== 'undefined' ? CASES : []).filter(c => c.caseType !== 'osce');
  if (!cases.length) return null;
  return cases[Math.abs(h) % cases.length];
};

// ============================================================
// DAILY CHALLENGE CARD (for dashboard)
// ============================================================
const DailyChallengeCard = ({ profile, onStartCase }) => {
  const todays = _pickDailyCase();
  if (!todays) return null;
  const completed = profile.dailyCompleted && profile.dailyCompleted[_todayKey()] === todays.id;
  const caseIcons = { 'case-001':'🔴', 'case-002':'⚡', 'case-003':'🔆', 'case-004':'💧' };

  return (
    <div className="au" style={{
      borderRadius: 24, padding: '24px 28px', marginBottom: 24,
      background: completed
        ? 'linear-gradient(135deg, var(--green) 0%, var(--teal-d) 100%)'
        : `linear-gradient(135deg, ${todays.accentColor} 0%, #8B5CF6 100%)`,
      color: '#fff', position: 'relative', overflow: 'hidden',
      cursor: completed ? 'default' : 'pointer',
      transition: 'all 0.28s var(--ease-hover)',
    }}
    onClick={() => !completed && onStartCase(todays, { daily: true })}
    onMouseEnter={(e) => { if (!completed) e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(88,101,242,0.30)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* decorative rings */}
      <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.10)' }} />
      <div style={{ position: 'absolute', right: 30, bottom: -60, width: 140, height: 140, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, flexShrink: 0,
        }}>{completed ? '✓' : caseIcons[todays.id] || '👁️'}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.22)',
            borderRadius: 999, padding: '3px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            <span>🎯</span> {completed ? 'Daily Challenge Selesai' : 'Daily Challenge · Hari ini'}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 4 }}>
            {completed ? 'Mantap! +50 XP bonus didapat.' : todays.title}
          </h3>
          <p style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
            {completed
              ? 'Datang lagi besok untuk challenge baru. Streak kamu aman 🔥'
              : `${todays.category} · Selesaikan hari ini untuk dapat +50 XP & jaga streak.`}
          </p>
        </div>

        {!completed && (
          <div style={{
            background: 'rgba(255,255,255,0.95)', color: 'var(--primary)',
            borderRadius: 14, padding: '12px 20px',
            fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}>
            Mulai →
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ACTIVITY HEATMAP (GitHub-style)
// ============================================================
const ActivityHeatmap = ({ sessionDates = {}, weeks = 14 }) => {
  // Build a 7×weeks grid ending today
  const today = new Date();
  today.setHours(0,0,0,0);
  const dayOfWeek = today.getDay(); // 0=Sun ... 6=Sat
  // End on this week's Saturday
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (weeks * 7 - 1));

  const cells = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w*7 + d);
      const key = _dayKey(date);
      const count = sessionDates[key] || 0;
      const isFuture = date > today;
      col.push({ key, count, isFuture, date });
    }
    cells.push(col);
  }

  const monthLabels = [];
  let lastMonth = -1;
  cells.forEach((col, w) => {
    const m = col[0].date.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ w, label: col[0].date.toLocaleString('id-ID', { month: 'short' }) });
      lastMonth = m;
    }
  });

  const totalSessions = Object.values(sessionDates).reduce((a,b) => a+b, 0);
  const activeDays = Object.keys(sessionDates).filter(k => sessionDates[k] > 0).length;

  const cellColor = (count, isFuture) => {
    if (isFuture) return 'transparent';
    if (count === 0) return 'var(--surface-2)';
    if (count === 1) return 'rgba(88,101,242,0.30)';
    if (count === 2) return 'rgba(88,101,242,0.55)';
    if (count === 3) return 'rgba(88,101,242,0.80)';
    return 'var(--primary)';
  };

  const dayLabels = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Activity Heatmap</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {totalSessions} sesi · {activeDays} hari aktif · {weeks} minggu terakhir
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)' }}>
          <span>Sedikit</span>
          {[0, 1, 2, 3, 4].map(c => (
            <div key={c} style={{
              width: 11, height: 11, borderRadius: 3,
              background: cellColor(c, false),
              border: c === 0 ? '1px solid var(--border)' : 'none',
            }} />
          ))}
          <span>Banyak</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {/* Day labels column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 18, fontSize: 9, color: 'var(--text-3)' }}>
          {dayLabels.map((l, i) => (
            <div key={i} style={{ height: 13, lineHeight: '13px', opacity: i % 2 ? 1 : 0 }}>{l}</div>
          ))}
        </div>

        <div style={{ flex: 1, overflowX: 'auto' }}>
          {/* Month labels row */}
          <div style={{ display: 'flex', gap: 3, height: 14, position: 'relative', marginBottom: 4 }}>
            {monthLabels.map((m, i) => (
              <div key={i} style={{
                position: 'absolute', left: m.w * 16,
                fontSize: 10, color: 'var(--text-3)', fontWeight: 500,
              }}>{m.label}</div>
            ))}
          </div>
          {/* Cells grid */}
          <div style={{ display: 'flex', gap: 3 }}>
            {cells.map((col, w) => (
              <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {col.map((cell, d) => (
                  <div key={d}
                    title={cell.isFuture ? '' : `${cell.date.toLocaleDateString('id-ID')} · ${cell.count} sesi`}
                    style={{
                      width: 13, height: 13, borderRadius: 3,
                      background: cellColor(cell.count, cell.isFuture),
                      border: cell.count === 0 && !cell.isFuture ? '1px solid var(--border)' : 'none',
                      cursor: cell.isFuture ? 'default' : 'pointer',
                      transition: 'transform 0.12s',
                    }}
                    onMouseEnter={e => { if (!cell.isFuture) e.currentTarget.style.transform = 'scale(1.35)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// BOOKMARK STAR (overlay button)
// ============================================================
const BookmarkStar = ({ active, onClick, size = 32 }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={active ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: active ? 'var(--amber-l)' : hov ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
        boxShadow: hov || active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: size === 32 ? 16 : 14,
        transform: hov ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.18s var(--ease-hover)',
      }}
    >
      <span style={{
        color: active ? 'var(--amber-d)' : 'var(--text-3)',
        filter: active ? 'none' : 'grayscale(1)',
        opacity: active ? 1 : 0.7,
      }}>{active ? '★' : '☆'}</span>
    </button>
  );
};

// ============================================================
// PROFILE SCREEN
// ============================================================
const AVATAR_EMOJIS = ['👤','👨‍⚕️','👩‍⚕️','🧑‍⚕️','🧑‍🎓','👨‍🎓','👩‍🎓','🦉','🧠','👁️','🐱','🐼'];
const AVATAR_COLORS = ['#5865F2','#8B5CF6','#14B8A6','#F59E0B','#EF4444','#10B981','#FB7185','#38BDF8'];

const ProfileScreen = ({ profile, badges, auth, onUpdateProfile, onStartCase, onNav }) => {
  const levelInfo = getLevelInfo(profile.xp);
  const earnedBadges = badges.filter(b => b.earned);
  const totalSessionCount = Object.values(profile.sessionDates || {}).reduce((a,b) => a+b, 0);

  // Edit state
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: profile.name || 'Dokter Muda',
    school: profile.school || '',
    year: profile.year || '',
    avatarEmoji: profile.avatarEmoji || '👤',
    avatarColor: profile.avatarColor || '#5865F2',
  });

  React.useEffect(() => {
    setDraft({
      name: profile.name || 'Dokter Muda',
      school: profile.school || '',
      year: profile.year || '',
      avatarEmoji: profile.avatarEmoji || '👤',
      avatarColor: profile.avatarColor || '#5865F2',
    });
  }, [profile, editing]);

  const saveEdits = () => {
    onUpdateProfile(draft);
    setEditing(false);
  };

  // Favorited cases
  const favoriteCases = (profile.favoriteCaseIds || [])
    .map(id => CASES.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* ── HERO PROFILE CARD ── */}
      <div className="au" style={{
        background: 'var(--surface)', borderRadius: 28, padding: 0,
        border: '1px solid var(--border)', boxShadow: 'var(--sh-md)',
        marginBottom: 24, overflow: 'hidden',
      }}>
        {/* Cover */}
        <div style={{
          height: 120,
          background: `linear-gradient(135deg, ${draft.avatarColor} 0%, #8B5CF6 100%)`,
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.10)' }} />
          <div style={{ position: 'absolute', right: 20, top: 20, width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ padding: '0 32px 28px', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: draft.avatarColor,
            border: '5px solid var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, marginTop: -48, marginBottom: 14,
            boxShadow: 'var(--sh-md)',
            cursor: editing ? 'pointer' : 'default',
          }}>{draft.avatarEmoji}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              {!editing ? (
                <>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, letterSpacing: '-0.01em' }}>
                    {profile.name || 'Dokter Muda'}
                  </h1>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {profile.school && <span>🎓 {profile.school}</span>}
                    {profile.school && profile.year && <span style={{ color: 'var(--text-3)' }}>·</span>}
                    {profile.year && <span>Angkatan {profile.year}</span>}
                    {!profile.school && !profile.year && <span style={{ color: 'var(--text-3)' }}>Belum isi profil — yuk lengkapi!</span>}
                  </div>
                  {auth?.email && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>✉️ {auth.email}</div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ProfileInput label="Nama lengkap" value={draft.name} onChange={v => setDraft(d => ({...d, name: v}))} placeholder="Citra Hapsari" />
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <ProfileInput label="Kampus" value={draft.school} onChange={v => setDraft(d => ({...d, school: v}))} placeholder="FK Universitas Indonesia" />
                    <ProfileInput label="Angkatan" value={draft.year} onChange={v => setDraft(d => ({...d, year: v}))} placeholder="2022" />
                  </div>

                  {/* Avatar picker */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Pilih avatar</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {AVATAR_EMOJIS.map(e => (
                        <button key={e} onClick={() => setDraft(d => ({...d, avatarEmoji: e}))} style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: draft.avatarEmoji === e ? 'var(--primary-l)' : 'var(--surface)',
                          border: `1.5px solid ${draft.avatarEmoji === e ? 'var(--primary)' : 'var(--border)'}`,
                          fontSize: 20, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.18s',
                        }}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Pilih warna</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {AVATAR_COLORS.map(c => (
                        <button key={c} onClick={() => setDraft(d => ({...d, avatarColor: c}))} style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: c,
                          border: draft.avatarColor === c ? '3px solid var(--text-1)' : '3px solid transparent',
                          cursor: 'pointer', transition: 'all 0.18s',
                          boxShadow: `0 2px 8px ${c}50`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!editing ? (
                <Btn variant="secondary" icon="✏️" onClick={() => setEditing(true)}>Edit Profil</Btn>
              ) : (
                <>
                  <Btn variant="ghost" onClick={() => setEditing(false)}>Batal</Btn>
                  <Btn variant="primary" icon="✓" onClick={saveEdits}>Simpan</Btn>
                </>
              )}
            </div>
          </div>

          {/* Inline stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {[
              { v: `Lv ${levelInfo.level}`, l: levelInfo.name, c: 'var(--primary)' },
              { v: profile.xp, l: 'XP Total', c: 'var(--violet)' },
              { v: `${profile.streak}d`, l: 'Streak Aktif 🔥', c: 'var(--amber)' },
              { v: earnedBadges.length, l: `Badge dari ${badges.length}`, c: 'var(--gold)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1, letterSpacing: '-0.01em' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIVITY HEATMAP ── */}
      <div className="au d1" style={{ marginBottom: 24 }}>
        <Card padding={24}>
          <ActivityHeatmap sessionDates={profile.sessionDates || {}} weeks={14} />
        </Card>
      </div>

      {/* ── Two columns: Favorites + Badges ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Favorites */}
        <div className="au d2">
          <SectionHeader title="Kasus Favorit" sub={`${favoriteCases.length} kasus`} />
          <Card padding={20}>
            {favoriteCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
                <p style={{ fontSize: 13, marginBottom: 14 }}>Belum ada kasus favorit.<br/>Tandai kasus dengan bintang di Library.</p>
                <Btn variant="secondary" size="sm" onClick={() => onNav('library')}>Buka Library</Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {favoriteCases.slice(0, 5).map(c => (
                  <div key={c.id} onClick={() => onStartCase(c)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 12,
                    background: 'var(--surface-2)', cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.transform = 'translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {{ 'case-001':'🔴', 'case-002':'⚡', 'case-003':'🔆', 'case-004':'💧' }[c.id] || '👁️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }} className="truncate">{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.category}</div>
                    </div>
                    <span style={{ color: 'var(--amber)' }}>★</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Learning Journal */}
        <div className="au d3" style={{ marginTop: 28 }}>
          <SectionHeader title="📓 Jurnal Pembelajaran" sub={`${(profile.journalEntries || []).length} entri`} />
          {typeof JournalList !== 'undefined'
            ? <JournalList profile={profile} onUpdate={onUpdateProfile} />
            : null}
        </div>

        {/* Badges all */}
        <div className="au d3" style={{ marginTop: 28 }}>
          <SectionHeader title="Semua Badge" sub={`${earnedBadges.length} / ${badges.length}`} />
          <Card padding={20}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {badges.map((b, i) => (
                <div key={b.id} title={b.earned ? b.desc : `🔒 ${b.desc}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '10px 6px', borderRadius: 12,
                  background: b.earned ? b.bg : 'var(--surface-2)',
                  border: `1px solid ${b.earned ? b.color + '40' : 'var(--border)'}`,
                  opacity: b.earned ? 1 : 0.55,
                  filter: b.earned ? 'none' : 'grayscale(0.5)',
                  cursor: 'help',
                  transition: 'all 0.18s',
                }}>
                  <div style={{ fontSize: 22 }}>{b.earned ? b.icon : '🔒'}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: b.earned ? b.color : 'var(--text-3)', textAlign: 'center', lineHeight: 1.2 }}>
                    {b.name}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Stats summary ── */}
      <div className="au d4">
        <Card padding={24}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>Skill Heatmap</div>
          {[
            { label: 'History Taking',       value: Math.min(82, 30 + profile.totalSessions * 5), color: 'var(--primary)' },
            { label: 'Red Flag Detection',   value: Math.min(85, 25 + profile.totalSessions * 6), color: 'var(--red)' },
            { label: 'Systematic Coverage',  value: Math.min(90, 28 + profile.totalSessions * 5), color: 'var(--teal)' },
            { label: 'Clinical Efficiency',  value: Math.min(75, 22 + profile.totalSessions * 4), color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <ProgressBar label={s.label} value={s.value} max={100} color={s.color} height={6} showPct />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// Reusable input for profile editing
const ProfileInput = ({ label, value, onChange, placeholder }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
        fontSize: 13, color: 'var(--text-1)', background: 'var(--surface)',
        outline: 'none', fontFamily: 'Poppins', width: '100%',
      }}
      onFocus={e => { e.target.style.border = '1.5px solid var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
      onBlur={e => { e.target.style.border = '1.5px solid var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  </label>
);

// Helper exposed to other scripts
window._todayKey = _todayKey;
window._pickDailyCase = _pickDailyCase;
