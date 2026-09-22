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
  dp900: '#818CF8',
  dp300: '#A78BFA',
  az305: '#C084FC',
  az802: '#E879F9',
  sc300: '#F472B6',
  sc500: '#FB923C',
  cloudplus: '#FACC15',
  ehrintegration: '#2DD4BF',
};

function trackAccent(key) {
  return TRACK_ACCENTS[key] || COLOR.primary;
}

const SHADOW = {
  card: '0 3px 10px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)',
};
