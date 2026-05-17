// ============================================================
// OphthaSim — Shared UI Components
// ============================================================

// ── Eye Orb (abstract patient avatar) ─────────────────────
const EyeOrb = ({ color = '#5865F2', size = 64, animate = true, tone = 'normal' }) => {
  const tones = {
    normal:       '#5865F2',
    anxious:      '#EF4444',
    worried:      '#8B5CF6',
    tired:        '#14B8A6',
    'pain-affected': '#F59E0B',
    cooperative:  '#10B981',
  };
  const c = tones[tone] || color;
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${c}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      animation: animate ? 'irisBreath 3.5s ease-in-out infinite' : 'none',
      boxShadow: `0 0 0 2px ${c}25, 0 0 20px ${c}18`
    }}>
      <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="38" fill="none" stroke={c} strokeWidth="0.6" opacity="0.25" />
        <circle cx="40" cy="40" r="32" fill="none" stroke={c} strokeWidth="1" opacity="0.18" />
        <circle cx="40" cy="40" r="26" fill={`${c}14`} />
        {spokes.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={40 + Math.cos(rad) * 14} y1={40 + Math.sin(rad) * 14}
              x2={40 + Math.cos(rad) * 24} y2={40 + Math.sin(rad) * 24}
              stroke={c} strokeWidth="1.2" opacity="0.28" />
          );
        })}
        <circle cx="40" cy="40" r="26" fill="none" stroke={c} strokeWidth="1.8" opacity="0.65" />
        <circle cx="40" cy="40" r="13" fill={c} opacity="0.92" />
        <circle cx="40" cy="40" r="7"  fill={c} />
        <circle cx="46" cy="34" r="4.5" fill="white" opacity="0.42" />
        <circle cx="34" cy="46" r="2"   fill="white" opacity="0.18" />
      </svg>
    </div>
  );
};

// ── Button ────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', size = 'md', onClick, disabled, style = {}, icon }) => {
  const [pressed, setPressed] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: 'Poppins', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', outline: 'none', transition: 'all 0.2s var(--ease-hover)',
    whiteSpace: 'nowrap', userSelect: 'none',
  };
  const sizes = {
    sm: { padding: '7px 16px', fontSize: 12, borderRadius: 10 },
    md: { padding: '10px 22px', fontSize: 14, borderRadius: 14 },
    lg: { padding: '14px 30px', fontSize: 15, borderRadius: 16 },
  };
  const variants = {
    primary: {
      background: pressed ? 'var(--primary-h)' : 'var(--primary)',
      color: '#fff',
      boxShadow: pressed ? 'none' : '0 4px 16px var(--primary-glow)',
      transform: pressed ? 'scale(0.97) translateY(1px)' : 'scale(1)',
    },
    secondary: {
      background: pressed ? 'var(--primary-l)' : 'var(--surface)',
      color: 'var(--primary)',
      border: '1.5px solid var(--border)',
      boxShadow: pressed ? 'none' : 'var(--sh-sm)',
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
    },
    ghost: {
      background: pressed ? 'var(--surface-2)' : 'transparent',
      color: 'var(--text-2)',
      transform: pressed ? 'scale(0.96)' : 'scale(1)',
    },
    danger: {
      background: pressed ? 'var(--red-d)' : 'var(--red)',
      color: '#fff',
      boxShadow: pressed ? 'none' : '0 4px 16px rgba(239,68,68,0.3)',
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
    },
    teal: {
      background: pressed ? 'var(--teal-d)' : 'var(--teal)',
      color: '#fff',
      boxShadow: pressed ? 'none' : '0 4px 16px rgba(20,184,166,0.3)',
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
    }
  };
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], opacity: disabled ? 0.5 : 1, ...style }}
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      {icon && <span style={{ display: 'flex', fontSize: size === 'lg' ? 18 : 15 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ── Chip / Pill ───────────────────────────────────────────
const Chip = ({ label, color, bg, active, onClick, size = 'md', dot }) => {
  const [hov, setHov] = React.useState(false);
  const sizes = {
    sm: { padding: '3px 10px', fontSize: 11, borderRadius: 8 },
    md: { padding: '5px 14px', fontSize: 12, borderRadius: 10 },
    lg: { padding: '7px 18px', fontSize: 13, borderRadius: 12 },
  };
  return (
    <button
      style={{
        ...sizes[size],
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: active ? (bg || 'var(--primary-l)') : hov ? 'var(--surface-2)' : 'var(--surface)',
        color: active ? (color || 'var(--primary)') : hov ? 'var(--text-2)' : 'var(--text-3)',
        border: `1.5px solid ${active ? (color || 'var(--primary)') + '40' : 'var(--border)'}`,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer', transition: 'all 0.18s var(--ease-hover)',
        transform: active ? 'scale(1.03)' : hov ? 'scale(1.01)' : 'scale(1)',
        boxShadow: active ? `0 2px 10px ${(color || '#5865F2')}22` : 'none',
        whiteSpace: 'nowrap', fontFamily: 'Poppins',
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color || 'var(--primary)', flexShrink: 0 }} />}
      {label}
    </button>
  );
};

// ── Card ─────────────────────────────────────────────────
const Card = ({ children, style = {}, hover = true, onClick, className = '', padding = 20 }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding,
        boxShadow: hov && hover ? 'var(--sh-lg)' : 'var(--sh-sm)',
        border: '1px solid var(--border)',
        transition: 'all 0.25s var(--ease-hover)',
        transform: hov && hover && onClick ? 'translateY(-3px) scale(1.005)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  );
};

// ── Progress Bar ─────────────────────────────────────────
const ProgressBar = ({ value = 0, max = 100, color = 'var(--primary)', height = 8, animate: anim = true, label, showPct }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      {(label || showPct) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
          {label && <span>{label}</span>}
          {showPct && <span style={{ color, fontWeight: 700 }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ background: 'var(--surface-2)', borderRadius: 999, height, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: anim ? 'width 0.8s var(--ease-panel)' : 'none',
          boxShadow: `0 0 8px ${color}40`,
        }} />
      </div>
    </div>
  );
};

// ── XP Bar ───────────────────────────────────────────────
const XPBar = ({ xp }) => {
  const info = getLevelInfo(xp);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Lv {info.level} · {info.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
          {info.currentXP} / {info.nextXP < 99999 ? info.nextXP : '∞'} XP
        </span>
      </div>
      <div style={{ background: 'var(--surface-3)', borderRadius: 999, height: 7, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: 'linear-gradient(90deg, var(--primary), var(--teal))',
          width: `${info.progress}%`,
          transition: 'width 1s var(--ease-panel)',
          boxShadow: '0 0 8px var(--primary-glow)',
        }} />
      </div>
    </div>
  );
};

// ── Score Ring ───────────────────────────────────────────
const ScoreRing = ({ value = 0, size = 80, color = 'var(--primary)', label, sublabel }) => {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s var(--ease-panel)' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{value}</span>
          {sublabel && <span style={{ fontSize: size * 0.12, color: 'var(--text-3)', fontWeight: 500 }}>{sublabel}</span>}
        </div>
      </div>
      {label && <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textAlign: 'center' }}>{label}</span>}
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────
const StatCard = ({ label, value, icon, color = 'var(--primary)', sub, animate: anim }) => (
  <div className={anim ? 'au' : ''} style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '14px 18px',
    display: 'flex', flexDirection: 'column', gap: 2,
    boxShadow: 'var(--sh-sm)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
    <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginTop: 2 }}>{sub}</span>}
  </div>
);

// ── Badge Item ────────────────────────────────────────────
const BadgeItem = ({ badge, size = 'md', animate: anim }) => {
  const [hov, setHov] = React.useState(false);
  const sizes = { sm: 52, md: 68, lg: 88 };
  const s = sizes[size];
  return (
    <div
      className={anim ? 'ab' : ''}
      title={badge.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: 'default', userSelect: 'none',
      }}
    >
      <div style={{
        width: s, height: s, borderRadius: '50%',
        background: badge.earned ? badge.bg : 'var(--surface-2)',
        border: `2px solid ${badge.earned ? badge.color + '40' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: s * 0.38,
        filter: badge.earned ? 'none' : 'grayscale(1) opacity(0.4)',
        transition: 'all 0.25s var(--ease-hover)',
        transform: hov && badge.earned ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
        boxShadow: hov && badge.earned ? `0 8px 20px ${badge.color}30` : badge.earned ? `0 2px 8px ${badge.color}20` : 'none',
      }}>
        {badge.icon}
      </div>
      {size !== 'sm' && (
        <span style={{
          fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.3,
          color: badge.earned ? 'var(--text-2)' : 'var(--text-3)',
          maxWidth: s + 8,
        }}>
          {badge.name}
        </span>
      )}
    </div>
  );
};

// ── Difficulty Badge ──────────────────────────────────────
const DiffBadge = ({ level }) => {
  const map = {
    1: { label: 'Easy',   color: '#10B981', bg: '#D1FAE5' },
    2: { label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
    3: { label: 'Hard',   color: '#EF4444', bg: '#FEE2E2' },
  };
  const d = map[level] || map[1];
  return (
    <span style={{
      background: d.bg, color: d.color,
      fontSize: 10, fontWeight: 700, padding: '3px 9px',
      borderRadius: 8, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {d.label}
    </span>
  );
};

// ── Red Flag Indicator ────────────────────────────────────
const RedFlagBadge = ({ count = 0 }) => (
  <span style={{
    background: count > 0 ? 'var(--red-l)' : 'var(--surface-2)',
    color: count > 0 ? 'var(--red)' : 'var(--text-3)',
    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', gap: 4,
    border: `1px solid ${count > 0 ? 'var(--red)20' : 'transparent'}`,
    animation: count > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
  }}>
    🚩 {count} Red Flag{count !== 1 ? 's' : ''}
  </span>
);

// ── Domain Finding Chip (Left Panel) ─────────────────────
const FindingChip = ({ finding, isNew }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '8px 12px', borderRadius: 12,
    background: finding.isRedFlag ? 'var(--red-l)' : 'var(--surface-2)',
    border: `1px solid ${finding.isRedFlag ? 'var(--red)25' : 'var(--border)'}`,
    animation: isNew ? 'bubbleIn 0.4s var(--ease-pop) both' : 'none',
    fontSize: 12, lineHeight: 1.4,
  }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>{finding.isRedFlag ? '🚩' : '✓'}</span>
    <span style={{ color: finding.isRedFlag ? 'var(--red-d)' : 'var(--text-2)', fontWeight: 500 }}>{finding.found}</span>
  </div>
);

// ── Loading Dots ──────────────────────────────────────────
const LoadingDots = ({ color = 'var(--primary)' }) => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        opacity: 0.6,
      }} />
    ))}
  </div>
);

// ── Toast System ──────────────────────────────────────────
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);
  const add = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), msg.duration || 3500);
  }, []);
  const remove = React.useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const typeStyles = {
    success: { bg: 'var(--green-l)', color: 'var(--green)', icon: '✓' },
    error:   { bg: 'var(--red-l)',   color: 'var(--red)',   icon: '✕' },
    warning: { bg: 'var(--amber-l)', color: 'var(--amber)', icon: '⚠' },
    info:    { bg: 'var(--primary-l)', color: 'var(--primary)', icon: 'ℹ' },
    badge:   { bg: 'var(--gold-l)',  color: 'var(--gold)',  icon: '🏅' },
    redflag: { bg: 'var(--red-l)',   color: 'var(--red-d)', icon: '🚩' },
  };

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const ts = typeStyles[t.type] || typeStyles.info;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'var(--surface)', borderRadius: 14, padding: '12px 16px',
              boxShadow: 'var(--sh-xl)', border: '1px solid var(--border)',
              maxWidth: 320, animation: 'toastSlide 0.4s var(--ease-pop) both',
              pointerEvents: 'auto', cursor: 'pointer',
            }} onClick={() => remove(t.id)}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: ts.bg, color: ts.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, flexShrink: 0,
              }}>{ts.icon}</div>
              <div>
                {t.title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3 }}>{t.title}</div>}
                {t.message && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.4 }}>{t.message}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

// ── Overlay / Backdrop ─────────────────────────────────────
const Overlay = ({ onClick }) => (
  <div onClick={onClick} style={{
    position: 'fixed', inset: 0,
    background: 'rgba(26, 29, 46, 0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    animation: 'overlayIn 0.25s ease both',
  }} />
);

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// Export everything to window
Object.assign(window, {
  EyeOrb, Btn, Chip, Card, ProgressBar, XPBar, ScoreRing,
  StatCard, BadgeItem, DiffBadge, RedFlagBadge, FindingChip,
  LoadingDots, ToastProvider, ToastContext, useToast,
  Overlay, SectionHeader,
});
