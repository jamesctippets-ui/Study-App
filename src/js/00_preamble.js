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
// track switcher and learning-path panel — not used for correctness.
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
