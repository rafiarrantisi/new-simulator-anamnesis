// ════════════════════════════════════════════════════════════════════
// OphthaSim — Station Shell (Phase 1 MVP, v3)
//
// Shared UI primitives for all examination stations:
//   • StationShell       (light/dark frame, header, body slots)
//   • StepLadder         (numbered procedural progression)
//   • StationStage       (instrument visual area)
//   • StationControls    (button cluster row)
//   • StructuredField    (numeric/select hybrid scoring input)
//   • StationFooter      (proceed-to-next-step + complete actions)
//   • DialKnob, Toggle   (instrument-like controls)
//
// MIGRATION NOTES (Next.js + Vite + TS + Tailwind + Framer Motion):
//   - Each export here maps cleanly to a `components/exam/*` file.
//   - Theme-aware classes drive light/dark via Tailwind `dark:` variants.
//   - CSS keyframes + transitions in design.css map to Framer Motion's
//     <motion.div animate transition={{ type:'spring' }}>.
//   - useStep() reducer pattern → easily lifted to Zustand store slice.
// ════════════════════════════════════════════════════════════════════

// ── useStep: tiny procedural-flow reducer ─────────────────────────────
// MIGRATE: Replace with Zustand slice if step state needs to be shared
// across components (e.g. progress shown in a parent header).
function useStep(totalSteps, initial = 0) {
  const [step, setStep] = React.useState(initial);
  const [done, setDone] = React.useState(new Set());

  const next = React.useCallback(() => {
    setDone(prev => new Set([...prev, step]));
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }, [step, totalSteps]);

  const goto = React.useCallback((i) => setStep(Math.max(0, Math.min(i, totalSteps - 1))), [totalSteps]);
  const markCurrentDone = React.useCallback(() => setDone(prev => new Set([...prev, step])), [step]);
  const reset = React.useCallback(() => { setStep(0); setDone(new Set()); }, []);

  return { step, done, next, goto, markCurrentDone, reset, total: totalSteps, isLast: step === totalSteps - 1 };
}

// ── StationShell: outer container, dark or light ──────────────────────
const StationShell = ({ theme = 'light', icon, title, subtitle, kbd, children }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      borderRadius: 20,
      background: dark
        ? 'linear-gradient(160deg, #0E1024 0%, #07080F 100%)'
        : 'var(--surface)',
      border: dark ? '1px solid #1F2342' : '1px solid var(--border)',
      boxShadow: dark
        ? '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
        : 'var(--sh-md)',
      color: dark ? '#E0E6FA' : 'var(--text-1)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ambient grain for dark theme */}
      {dark && <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(900px 500px at 20% -10%, rgba(88,101,242,0.10) 0%, transparent 60%), radial-gradient(700px 400px at 110% 110%, rgba(20,184,166,0.06) 0%, transparent 60%)',
      }} />}

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'var(--border)'}`,
        background: dark ? 'rgba(0,0,0,0.25)' : 'var(--surface-2)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: dark ? 'rgba(88,101,242,0.15)' : 'var(--primary-l)',
          color: dark ? '#8B95E0' : 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: dark ? '#F2F5FF' : 'var(--text-1)', lineHeight: 1.15 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: dark ? '#8B95C0' : 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          fontSize: 10, padding: '3px 9px', borderRadius: 7, fontWeight: 700,
          background: dark ? 'rgba(20,184,166,0.18)' : 'var(--teal-l)',
          color: dark ? '#5EE7C9' : 'var(--teal-d)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{kbd || 'Guided'}</div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 20px' }}>
        {children}
      </div>
    </div>
  );
};

// ── StepLadder: horizontal step progress ──────────────────────────────
const StepLadder = ({ steps, current, done, theme = 'light', onJump }) => {
  const dark = theme === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {steps.map((label, i) => {
        const isCurrent = i === current;
        const isDone = done.has(i);
        const canJump = isDone || i <= current;
        return (
          <React.Fragment key={i}>
            <button
              type="button"
              onClick={() => canJump && onJump && onJump(i)}
              disabled={!canJump}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 11px 5px 5px',
                borderRadius: 999,
                background: isCurrent
                  ? (dark ? 'rgba(88,101,242,0.22)' : 'var(--primary-l)')
                  : isDone
                    ? (dark ? 'rgba(52,211,153,0.15)' : 'var(--green-l)')
                    : (dark ? 'rgba(255,255,255,0.04)' : 'var(--surface-2)'),
                border: `1px solid ${isCurrent
                  ? (dark ? 'rgba(88,101,242,0.5)' : 'var(--primary)40')
                  : isDone
                    ? (dark ? 'rgba(52,211,153,0.4)' : 'var(--green)35')
                    : (dark ? 'rgba(255,255,255,0.06)' : 'var(--border)')}`,
                color: isCurrent
                  ? (dark ? '#A4B0FF' : 'var(--primary)')
                  : isDone
                    ? (dark ? '#5EE7C9' : 'var(--green)')
                    : (dark ? '#6B7AA0' : 'var(--text-3)'),
                fontSize: 11, fontWeight: 700,
                cursor: canJump ? 'pointer' : 'not-allowed',
                fontFamily: 'Poppins',
                transition: 'all 0.2s var(--ease-hover)',
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: isCurrent
                  ? (dark ? '#5865F2' : 'var(--primary)')
                  : isDone
                    ? (dark ? '#34D399' : 'var(--green)')
                    : (dark ? 'rgba(255,255,255,0.06)' : 'var(--surface-3)'),
                color: (isCurrent || isDone) ? '#fff' : (dark ? '#6B7AA0' : 'var(--text-3)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {isDone ? '✓' : i + 1}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
            </button>
            {i < steps.length - 1 && (
              <div style={{
                width: 8, height: 1,
                background: dark ? 'rgba(255,255,255,0.08)' : 'var(--border)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── StationStage: large central area for instrument visual ────────────
const StationStage = ({ theme = 'light', minHeight = 320, children, style = {} }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      borderRadius: 16,
      background: dark
        ? 'radial-gradient(circle at 50% 30%, #0A0F22 0%, #03050C 100%)'
        : 'var(--surface-2)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'var(--border)'}`,
      minHeight,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
};

// ── StationControls: floating row of controls ─────────────────────────
const StationControls = ({ children, theme = 'light', align = 'left', style = {} }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      padding: '12px 14px',
      borderRadius: 14,
      background: dark ? 'rgba(255,255,255,0.03)' : 'var(--surface-2)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'var(--border)'}`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ── InstrumentButton: dark- or light-themed action button ─────────────
const InstrumentButton = ({ children, onClick, active = false, disabled = false, theme = 'light', tone = 'neutral', size = 'md', icon = null, style = {} }) => {
  const dark = theme === 'dark';
  const sz = size === 'sm' ? { padding: '6px 12px', fontSize: 11 }
           : size === 'lg' ? { padding: '11px 20px', fontSize: 14 }
           :                { padding: '8px 14px', fontSize: 12 };
  const toneColor = tone === 'primary' ? 'var(--primary)'
                  : tone === 'danger'  ? 'var(--red)'
                  : tone === 'success' ? 'var(--green)'
                  : tone === 'amber'   ? 'var(--amber)'
                  :                      (dark ? '#A4B0FF' : 'var(--text-2)');
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick && onClick()}
      disabled={disabled}
      style={{
        ...sz,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 10,
        background: active
          ? (dark ? `${toneColor}25` : tone === 'neutral' ? 'var(--primary-l)' : `${toneColor}15`)
          : (dark ? 'rgba(255,255,255,0.05)' : 'var(--surface)'),
        border: `1.5px solid ${active
          ? toneColor + (dark ? '80' : '60')
          : (dark ? 'rgba(255,255,255,0.08)' : 'var(--border)')}`,
        color: active ? toneColor : (dark ? '#C0CAEC' : 'var(--text-2)'),
        fontFamily: 'Poppins', fontWeight: active ? 700 : 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.18s var(--ease-hover)',
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: sz.fontSize + 2 }}>{icon}</span>}
      {children}
    </button>
  );
};

// ── DialKnob: rotary dial for instruments (Goldmann, slit width, etc.) ─
const DialKnob = ({ value, min = 0, max = 100, step = 1, onChange, size = 84, label, unit = '', theme = 'light' }) => {
  const dark = theme === 'dark';
  const range = max - min;
  const pct = (value - min) / range;
  const angle = -135 + pct * 270; // -135 to +135 degrees
  const dragRef = React.useRef(null);

  const handleMouseDown = (e) => {
    const startY = e.clientY;
    const startVal = value;
    const onMove = (ev) => {
      const delta = startY - ev.clientY;
      const next = Math.min(max, Math.max(min, startVal + (delta / 100) * range));
      onChange(Math.round(next / step) * step);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const next = Math.min(max, Math.max(min, value + (e.deltaY < 0 ? step : -step)));
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: dark
            ? 'radial-gradient(circle at 30% 30%, #2a2f4a 0%, #0E1024 70%)'
            : 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d8def2 70%)',
          border: `2px solid ${dark ? '#1F2342' : 'var(--border-2)'}`,
          boxShadow: dark
            ? 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)'
            : 'inset 0 2px 6px rgba(0,0,0,0.08), 0 4px 8px rgba(88,101,242,0.10)',
          position: 'relative',
          cursor: 'ns-resize',
          transition: 'box-shadow 0.18s',
          userSelect: 'none',
        }}
      >
        {/* tick marks */}
        {[...Array(11)].map((_, i) => {
          const tickAng = -135 + i * 27;
          const isMajor = i % 2 === 0;
          return (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 2, height: isMajor ? 8 : 4,
              background: dark ? '#3B4267' : 'var(--text-3)',
              transform: `translate(-50%, -50%) rotate(${tickAng}deg) translateY(-${size/2 - 4}px)`,
              transformOrigin: 'center',
              borderRadius: 1,
              opacity: isMajor ? 0.9 : 0.5,
            }} />
          );
        })}
        {/* indicator */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 3, height: size * 0.34,
          background: dark ? '#FFE066' : 'var(--primary)',
          borderRadius: 2,
          transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          transformOrigin: 'bottom center',
          transition: 'transform 0.06s linear',
          boxShadow: dark ? '0 0 10px rgba(255,224,102,0.5)' : '0 0 6px rgba(88,101,242,0.4)',
        }} />
        {/* center dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 14, height: 14,
          borderRadius: '50%', transform: 'translate(-50%, -50%)',
          background: dark ? '#0A0A14' : '#fff',
          border: `1px solid ${dark ? '#3B4267' : 'var(--border)'}`,
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          color: dark ? '#FFE066' : 'var(--primary)',
        }}>{value}{unit}</div>
        {label && <div style={{ fontSize: 10, color: dark ? '#6B7AA0' : 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>}
      </div>
    </div>
  );
};

// ── StructuredField: hybrid scoring input ─────────────────────────────
// Captures key clinical values (numbers, selects) — feeds auto-scoring.
const StructuredField = ({ label, hint, theme = 'light', children, required = false }) => {
  const dark = theme === 'dark';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: 10, fontWeight: 700,
        color: dark ? '#8B95C0' : 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 10, color: dark ? '#6B7AA0' : 'var(--text-3)', lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
    </div>
  );
};

const StructuredSelect = ({ value, onChange, options, theme = 'light', placeholder = '— pilih —' }) => {
  const dark = theme === 'dark';
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        border: `1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
        background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface)',
        color: dark ? '#E0E6FA' : 'var(--text-1)',
        fontSize: 12, fontFamily: 'Poppins', fontWeight: 600,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );
};

const StructuredNumber = ({ value, onChange, min, max, unit = '', theme = 'light', placeholder = '—' }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      borderRadius: 10,
      border: `1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
      background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface)',
    }}>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        min={min} max={max}
        placeholder={placeholder}
        style={{
          flex: 1, width: '100%', minWidth: 0,
          padding: '6px 0',
          border: 'none', background: 'transparent', outline: 'none',
          color: dark ? '#FFE066' : 'var(--primary)',
          fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          fontFamily: 'Poppins',
        }}
      />
      {unit && <span style={{ fontSize: 11, color: dark ? '#8B95C0' : 'var(--text-3)', fontWeight: 700 }}>{unit}</span>}
    </div>
  );
};

// ── StationFooter: gather structured findings + complete CTA ──────────
const StationFooter = ({ theme = 'light', onComplete, onReset, canComplete = true, completeLabel = 'Tandai stasiun selesai', summary }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      marginTop: 16, padding: 14,
      borderRadius: 14,
      background: dark ? 'rgba(88,101,242,0.08)' : 'var(--primary-ll)',
      border: `1px solid ${dark ? 'rgba(88,101,242,0.25)' : 'var(--primary)20'}`,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#A4B0FF' : 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          Ringkasan stasiun
        </div>
        <div style={{ fontSize: 12, color: dark ? '#C0CAEC' : 'var(--text-2)', lineHeight: 1.45 }}>
          {summary || 'Selesaikan langkah-langkah pemeriksaan dulu, lalu isi catatan klinis.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onReset && (
          <InstrumentButton size="sm" onClick={onReset} theme={theme}>
            ↺ Ulang
          </InstrumentButton>
        )}
        <InstrumentButton
          tone="primary"
          theme={theme}
          active
          disabled={!canComplete}
          onClick={onComplete}
          size="md"
        >
          {completeLabel} →
        </InstrumentButton>
      </div>
    </div>
  );
};

// ── Subtle helper: SectionIntro (clinical context blurb) ──────────────
const StationIntro = ({ icon, title, body, theme = 'light' }) => {
  const dark = theme === 'dark';
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 14px', marginBottom: 14,
      background: dark ? 'rgba(20,184,166,0.08)' : 'var(--teal-l)',
      border: `1px solid ${dark ? 'rgba(20,184,166,0.25)' : 'var(--teal)20'}`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: dark ? '#5EE7C9' : 'var(--teal-d)', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: dark ? '#9EB8B0' : 'var(--text-2)', lineHeight: 1.5 }}>
          {body}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  StationShell, StepLadder, StationStage, StationControls,
  InstrumentButton, DialKnob,
  StructuredField, StructuredSelect, StructuredNumber,
  StationFooter, StationIntro,
  useStep,
});
