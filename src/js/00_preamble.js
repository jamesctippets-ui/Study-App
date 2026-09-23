const { useState, useEffect, useMemo, useCallback, useRef } = React;

const COLOR = {
  bg: '#1E1828',
  surface: '#282032',
  surfaceRaised: '#332A3D',
  border: '#4A3F56',
  text: '#EDE4DC',
  muted: '#A296AC',
  // Primary: the app's main interactive accent (active tabs, links, buttons,
  // "you selected this" highlighting) — deliberately NOT used for "this
  // answer is correct," so the two meanings never collide.
  primary: '#A78BFA',
  // Success: the ONLY color that means "correct" anywhere in the app —
  // used nowhere else, so it stays an unambiguous signal.
  success: '#34D399',
  red: '#F87171',
  gold: '#E3B274',
  // A genuine teal, used sparingly for secondary accents/variety.
  teal: '#2DD4BF',
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
