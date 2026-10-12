// Small building blocks for the "Console" look: segmented tick bars instead of
// smooth progress bars, mono section labels, a square segmented control and the
// "route" list that the Path and Home trails are drawn with. Everything here uses
// the COLOR tokens and the --r-* radius tokens, so it follows the theme.

// A progress meter made of separate ticks. `total` is the number of steps behind
// the value; the meter shows at most `ticks` of them (a 154-step path still gets 10
// ticks). A little progress always lights at least one tick so it never looks empty.
function TickBar({ value = 0, total = 10, ticks = 10, hue, height = 7, label }) {
  const n = Math.max(1, Math.min(ticks, total > 0 ? total : ticks));
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const filled = ratio >= 1 ? n : ratio > 0 ? Math.max(1, Math.floor(ratio * n)) : 0;
  const on = hue || COLOR.success;
  return (
    <span role="img" aria-label={label || `${Math.round(ratio * 100)}%`} style={{ display: 'flex', gap: '3px', width: '100%' }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ flex: 1, height: `${height}px`, borderRadius: '1px', boxSizing: 'border-box', background: i < filled ? on : COLOR.surfaceRaised, border: `1px solid ${i < filled ? on : COLOR.border}` }} />
      ))}
    </span>
  );
}

// "// TODAY" style heading above a group of cards. `count` is shown in the accent.
function SectionLabel({ children, count, first, style }) {
  return (
    <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: COLOR.muted, margin: first ? '2px 2px 9px' : '22px 2px 9px', display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      <span>{children}</span>
      {count != null && <span style={{ color: COLOR.primary }}>{count}</span>}
    </div>
  );
}

// A quiet collapsible section: a small mono label (with an optional count and a one-line
// summary on the right) that folds its content away until asked for. This is the default way to
// keep second-level controls and long lists from crowding a page: the page shows one line, the
// detail opens on demand.
function Disclosure({ label, count, summary, defaultOpen, hue, children, style, bodyStyle, onToggle }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const on = hue || COLOR.primary;
  const flip = () => { setOpen((o) => { if (onToggle) onToggle(!o); return !o; }); };
  return (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', background: COLOR.surface, marginBottom: '12px', ...style }}>
      <button
        onClick={flip}
        aria-expanded={open}
        className="btn-flat"
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'transparent', border: 'none', borderRadius: 'var(--r-card)', textAlign: 'left', color: COLOR.text }}
      >
        <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: COLOR.muted, flexShrink: 0 }}>{label}</span>
        {count != null && <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: ink(on), flexShrink: 0 }}>{count}</span>}
        <span style={{ flex: 1, minWidth: 0, textAlign: 'right', fontSize: '11.5px', color: COLOR.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary}</span>
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: '11px', color: COLOR.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>
      {open && <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${COLOR.border}`, ...bodyStyle }}>{children}</div>}
    </div>
  );
}

// Two or three options in one square row (mode switches and tab strips). The active
// option is marked by the accent colour and a line under it.
function SegmentedControl({ options, value, onChange, hue, fit, style }) {
  const on = hue || COLOR.primary;
  return (
    <div role="tablist" style={{ display: 'flex', border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-ctl)', background: COLOR.surface, overflow: 'hidden', ...style }}>
      {options.map((o, i) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            title={o.title}
            className="btn-flat"
            style={{
              flex: fit ? '1 1 auto' : '1 1 0%', position: 'relative', padding: '9px 6px', border: 'none', borderRadius: 0, minWidth: 0, lineHeight: 1.25,
              borderLeft: i ? `1px solid ${COLOR.border}` : 'none',
              background: active ? `color-mix(in srgb, ${on} 10%, ${COLOR.surface})` : 'transparent',
              color: active ? ink(on) : COLOR.muted, fontSize: '12.5px', fontWeight: active ? 700 : 600,
            }}
          >
            {o.label}
            {o.badge != null && o.badge !== '' && <span className="mono" style={{ marginLeft: '6px', fontSize: '11px', color: active ? ink(on) : COLOR.muted }}>{o.badge}</span>}
            {active && <span style={{ position: 'absolute', left: '18%', right: '18%', bottom: 0, height: '2px', background: on }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---- the route -------------------------------------------------------------
// A trail drawn as a route: a dashed line down the left, a node per step (filled
// when done, glowing when it is the next hop, hollow when ahead), and for each step
// a mono id, the title and a short detail line.

function RouteList({ children, style }) {
  return (
    <div style={{ position: 'relative', paddingLeft: '2px', ...style }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: '9px', top: '14px', bottom: '14px', borderLeft: `1px dashed ${COLOR.border}` }} />
      {children}
    </div>
  );
}

function RouteStep({ id, title, detail, kind, done, isNext, optional, locked, stars, right, rightPad, hue: nodeHue, onOpen, label }) {
  const hue = stepHue(kind);
  const on = nodeHue || COLOR.primary;
  return (
    <button
      onClick={onOpen}
      className="btn-flat trail-node"
      aria-label={label || `${title}, ${done ? 'completed' : 'not completed'}`}
      style={{
        position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%', textAlign: 'left',
        background: isNext ? `color-mix(in srgb, ${on} 8%, transparent)` : 'transparent', color: COLOR.text,
        padding: `10px ${rightPad == null ? 8 : rightPad}px 10px 0`, border: 'none', borderRadius: 'var(--r-ctl)', opacity: !done && !isNext && locked ? 0.55 : 1,
      }}
    >
      <span
        aria-hidden="true"
        className={isNext ? 'pulse' : undefined}
        style={{
          position: 'relative', zIndex: 1, flexShrink: 0, width: '16px', height: '16px', marginTop: '2px', marginLeft: '2px', borderRadius: '50%', boxSizing: 'border-box',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: done ? on : COLOR.bg,
          border: `2px ${optional && !done ? 'dashed' : 'solid'} ${done || isNext ? on : COLOR.border}`,
          boxShadow: isNext ? `0 0 0 4px color-mix(in srgb, ${on} 22%, transparent)` : 'none',
          color: COLOR.onAccent,
        }}
      >
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {id && <span className="mono" style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', color: isNext ? ink(on) : COLOR.muted, marginBottom: '2px' }}>{id}</span>}
        <span style={{ display: 'block', fontSize: '15px', fontWeight: isNext ? 700 : 600, lineHeight: 1.3, color: done ? COLOR.muted : COLOR.text }}>{title}</span>
        {detail && <span style={{ display: 'block', fontSize: '12px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.35 }}>{detail}</span>}
        {stars}
      </span>
      {right || (
        <span aria-hidden="true" style={{ flexShrink: 0, color: done ? COLOR.border : hue, display: 'flex', marginTop: '2px' }}><PathIcon kind={kind === 'deep' || kind === 'bridge' ? 'read' : kind} size={17} /></span>
      )}
    </button>
  );
}

// ---- answer options ---------------------------------------------------------
// One answer row with a lettered key (A, B, C...). `state` is idle, picked (a
// multi-select choice not yet submitted), correct, wrong or missed (a correct option the
// learner left out); the answered states also swap the letter for a mark (✓ or ✕) so
// the result never depends on colour alone.
function QuizOption({ index, text, state = 'idle', disabled, onClick, tag }) {
  const hue = state === 'correct' ? COLOR.success : state === 'wrong' ? COLOR.red : state === 'picked' ? COLOR.primary : state === 'missed' ? COLOR.success : null;
  const filled = state === 'correct' || state === 'wrong';
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'picked' ? true : undefined}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', textAlign: 'left', padding: '12px 14px', marginTop: '8px',
        borderRadius: 'var(--r-card)', border: `1px ${state === 'missed' ? 'dashed' : 'solid'} ${hue || COLOR.border}`,
        background: hue && state !== 'missed' ? `color-mix(in srgb, ${hue} ${state === 'picked' ? 9 : 11}%, ${COLOR.surface})` : COLOR.surface,
        boxShadow: state === 'picked' ? `inset 3px 0 0 ${COLOR.primary}` : 'none', color: COLOR.text,
        fontSize: '15px', lineHeight: 1.45, cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span
        aria-hidden="true"
        className="mono"
        style={{
          flexShrink: 0, width: '24px', height: '24px', borderRadius: 'var(--r-ctl)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, marginTop: '0px', boxSizing: 'border-box',
          border: `1px solid ${hue || COLOR.border}`, background: filled || state === 'picked' ? hue : 'transparent', color: filled || state === 'picked' ? COLOR.onAccent : hue || COLOR.muted,
        }}
      >
        {state === 'correct' ? '✓' : state === 'wrong' ? '✕' : String.fromCharCode(65 + index)}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{text}</span>
      {state === 'missed' && <span className="mono" style={{ fontSize: '10px', color: COLOR.success, textTransform: 'uppercase', flexShrink: 0 }}>missed</span>}
      {tag && <span className="mono" style={{ fontSize: '10px', color: hue || COLOR.muted, textTransform: 'uppercase', flexShrink: 0, paddingTop: '4px' }}>{tag}</span>}
    </button>
  );
}
