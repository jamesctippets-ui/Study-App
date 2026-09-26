const { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } = React;

// Every value here is a CSS custom property reference, not a literal hex
// color — the actual dark/light values live in templates/index.html.tmpl's
// :root and :root[data-theme="light"] blocks. This means every one of the
// hundreds of `COLOR.xxx` usages across every component file below is
// already theme-aware for free: toggling the theme just flips the
// documentElement's data-theme attribute (see ThemeToggle/useTheme), and
// the browser re-resolves every var() reference in the already-rendered
// DOM instantly, with no React re-render required anywhere.
const COLOR = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  surfaceRaised: 'var(--color-surface-raised)',
  // A distinct, slightly-elevated tone for the color-blocked top nav bar —
  // intentionally its own token (not reused surfaceRaised) so the bar can
  // be tuned independently of card surfaces if it ever needs to be.
  navBar: 'var(--color-nav-bar)',
  border: 'var(--color-border)',
  text: 'var(--color-text)',
  muted: 'var(--color-muted)',
  // Primary: the app's main interactive accent (active tabs, links, buttons,
  // "you selected this" highlighting) — deliberately NOT used for "this
  // answer is correct," so the two meanings never collide.
  primary: 'var(--color-primary)',
  // Success: the ONLY color that means "correct" anywhere in the app —
  // used nowhere else, so it stays an unambiguous signal.
  success: 'var(--color-success)',
  red: 'var(--color-red)',
  gold: 'var(--color-gold)',
  // A genuine teal, used sparingly for secondary accents/variety.
  teal: 'var(--color-teal)',
  // The text color to use ON TOP of a primary/gold/success/red background
  // (buttons, badges) — dark in dark mode (since those accents stay light
  // there) and light in light mode (since light mode darkens those same
  // accents for on-page text/link contrast instead). Pairing every accent
  // background with this instead of a hardcoded dark literal is what lets
  // the accent hues themselves invert between themes without breaking any
  // button that sits on top of one.
  onAccent: 'var(--color-on-accent)',
};

// One distinct accent color per track, for quick visual recognition in the
// track menu panel — not used for correctness.
const TRACK_ACCENTS = {
  itil: '#60A5FA',
  az900: '#38BDF8',
  az104: '#22D3EE',
  dp900: '#2DD4BF',
  dp300: '#818CF8',
  az305: '#A78BFA',
  az802: '#C084FC',
  az140: '#E879F9',
  md102: '#D946EF',
  sc300: '#F472B6',
  sc200: '#FB7185',
  sc500: '#FB923C',
  cloudplus: '#FACC15',
  ehrintegration: '#94A3B8',
  ab650: '#F59E0B',
};

function trackAccent(key) {
  return TRACK_ACCENTS[key] || COLOR.primary;
}

// Closes a fixed-position overlay (panel, modal) on Escape, matching the
// click-outside-to-close behavior these overlays already have.
function useEscapeToClose(onClose) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}

// Closes an inline flyout (a term-definition popup anchored to the word
// that was clicked, not a full-screen overlay) when the user taps/clicks
// anywhere outside it — including on a different term, which this treats
// as "outside" too so the caller's own toggle logic decides what opens
// next instead of this hook fighting it. Only listens while `active`.
function useClickOutsideToClose(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      if (!e.target.closest('.term-flyout, .term-trigger')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, onClose]);
}

const SHADOW = {
  card: '0 3px 10px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)',
};

// Wireframe/line-art icons for header and menu chrome (Feather-icons style)
// — replaces the emoji previously used there. Achievement badge emoji and
// inline text emoji (e.g. the streak 🔥) are left alone; those are content,
// not menu chrome.
function IconMenu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconTrophy({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a2 2 0 0 0 2 4h1" />
      <path d="M17 5h3a2 2 0 0 1-2 4h-1" />
    </svg>
  );
}

function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconPrinter({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconSun({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
      <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
    </svg>
  );
}

function IconMoon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Persists purely to localStorage, deliberately not through the app's
// cloud/local progress sync — light vs. dark is a per-device display
// preference (like an OS setting), not study progress, so it shouldn't
// travel with the account the way results/streak/achievements do.
const THEME_STORAGE_KEY = 'certStudyHub_theme';

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* localStorage unavailable — fall through to default */ }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#FAF9F7' : '#1C1C1E');
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggleTheme];
}

// Same reasoning as THEME_STORAGE_KEY above: speech rate/voice is a
// per-device audio preference, not study progress, so it stays in plain
// localStorage rather than syncing through the app's cloud/local save
// pipeline. voiceURI (not voice name/index) is what's stored since a
// browser's voice list can reorder or vary between sessions — a saved
// index would silently pick the wrong voice next time.
const TTS_STORAGE_KEY = 'certStudyHub_ttsPrefs';
const DEFAULT_TTS_RATE = 0.95;

function useTtsPrefs() {
  const [ttsRate, setTtsRateState] = useState(DEFAULT_TTS_RATE);
  const [ttsVoiceURI, setTtsVoiceURIState] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TTS_STORAGE_KEY) || '{}');
      if (typeof saved.rate === 'number' && saved.rate >= 0.5 && saved.rate <= 2) setTtsRateState(saved.rate);
      if (typeof saved.voiceURI === 'string') setTtsVoiceURIState(saved.voiceURI);
    } catch (e) { /* localStorage unavailable or corrupt — keep defaults */ }
  }, []);

  const persist = (rate, voiceURI) => {
    try { localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify({ rate, voiceURI })); } catch (e) { /* ignore */ }
  };
  const setTtsRate = (rate) => { setTtsRateState(rate); persist(rate, ttsVoiceURI); };
  const setTtsVoiceURI = (voiceURI) => { setTtsVoiceURIState(voiceURI); persist(ttsRate, voiceURI); };

  return { ttsRate, ttsVoiceURI, setTtsRate, setTtsVoiceURI };
}

// A real sliding switch (not just an icon button) per the user's request —
// track shows both a sun and a moon so the target state is visible even
// before tapping, thumb slides to whichever side is currently active.
function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light';
  return (
    <button
      onClick={onToggle}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        position: 'relative', width: '44px', height: '24px', borderRadius: '999px', flexShrink: 0,
        background: COLOR.surface, border: `1px solid ${COLOR.border}`, padding: '2px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <span style={{ color: isLight ? COLOR.gold : COLOR.muted, display: 'flex', marginLeft: '2px' }}><IconSun /></span>
      <span style={{ color: isLight ? COLOR.muted : COLOR.primary, display: 'flex', marginRight: '2px' }}><IconMoon /></span>
      <span
        style={{
          position: 'absolute', top: '2px', left: isLight ? '22px' : '2px', width: '18px', height: '18px',
          borderRadius: '50%', background: isLight ? COLOR.gold : COLOR.primary,
          transition: 'left 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}
