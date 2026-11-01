// First-visit guided tour.
//
// Shows once per account the first time someone opens the app (the "seen"
// flag lives in stats, so it follows the learner across devices when they
// are signed in to Claude), can be skipped at any step, and can be replayed
// from the Profile tab.
//
// Layout-agnostic on purpose: every step finds its target with a
// [data-tour="..."] selector and measures it with getBoundingClientRect at
// show time and on every resize/scroll, so nothing here assumes where the
// header or tab bar sit. A step may list several selectors (for example a
// mobile bottom tab and a desktop sidebar link carrying the same data-tour
// name); the first one that is actually visible wins. If none is visible the
// step falls back to a centered card, so a layout that drops an element never
// breaks the tour.

const TOUR_STEPS = [
  {
    title: 'Welcome to Cert Study Hub',
    body: 'A quick look around so you know where everything lives. It takes under a minute, and you can skip it at any time.',
  },
  {
    target: ['menu'],
    title: 'Your cert plan',
    body: 'Open this menu to pick the certifications you are working toward, put them in order and set exam dates. Home and your Path follow this plan.',
  },
  {
    target: ['tab-home'],
    title: 'Home',
    body: 'Your daily dashboard: what you are studying now, a daily goal, a daily challenge question and a quick way to pick up where you left off.',
  },
  {
    target: ['tab-path'],
    title: 'Path',
    body: 'A guided course for the current cert, unit by unit: short lessons, then practice that checks you understood them.',
  },
  {
    target: ['tab-quiz'],
    title: 'Practice',
    body: 'Quizzes, flashcard reviews, fill-in-the-blank, ordering and compare questions, plus case studies. Mix and match whatever you need.',
  },
  {
    target: ['tab-learn'],
    title: 'Reference',
    body: 'Study notes, flashcards and a cheat sheet for each exam area, for when you want to read rather than be tested.',
  },
  {
    target: ['tab-exam'],
    title: 'Exam',
    body: 'Timed practice exams that mirror the real one. Your results show which areas still need work.',
  },
  {
    target: ['streak'],
    title: 'Streak',
    body: 'Study a little every day to grow your streak.',
  },
  {
    target: ['theme'],
    title: 'Light or dark',
    body: 'Switch between light and dark mode whenever you like.',
  },
  {
    target: ['tab-profile'],
    title: 'Profile and settings',
    body: 'Your stats, achievements and settings live here. You can replay this tour from Profile any time.',
    last: true,
  },
];

const TOUR_PAD = 6; // spotlight padding around the target, px
const TOUR_GAP = 12; // space between spotlight and card, px
const TOUR_MARGIN = 12; // minimum distance from the viewport edge, px
const TOUR_CARD_MAX_W = 340;

function tourFindTarget(names) {
  if (!names) return null;
  for (const name of names) {
    const els = document.querySelectorAll(`[data-tour="${name}"]`);
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && el.getClientRects().length > 0) return el;
    }
  }
  return null;
}

function GuidedTour({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardSize, setCardSize] = useState({ w: TOUR_CARD_MAX_W, h: 180 });
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const step = TOUR_STEPS[index];

  const measure = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = tourFindTarget(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Bring the target into view, then measure. Re-measure on anything that can
  // move it: resizes (including the desktop/mobile breakpoint), scrolling and
  // layout shifts inside the page.
  useLayoutEffect(() => {
    const el = tourFindTarget(step.target);
    if (el && el.scrollIntoView) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(measure);
      ro.observe(document.body);
      if (el) ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      if (ro) ro.disconnect();
    };
  }, [measure, step]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    if (Math.abs(r.width - cardSize.w) > 1 || Math.abs(r.height - cardSize.h) > 1) setCardSize({ w: r.width, h: r.height });
  });

  useEffect(() => { if (nextRef.current) nextRef.current.focus(); }, [index]);

  const finish = () => onFinish();
  const next = () => (step.last ? finish() : setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1)));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'Tab' && cardRef.current) {
        // Keep focus inside the tour card while it is open.
        const f = cardRef.current.querySelectorAll('button');
        if (!f.length) return;
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Spotlight box (target plus padding), clamped to the viewport.
  const spot = rect ? {
    top: Math.max(rect.top - TOUR_PAD, 0),
    left: Math.max(rect.left - TOUR_PAD, 0),
    width: Math.min(rect.width + TOUR_PAD * 2, viewport.w),
    height: Math.min(rect.height + TOUR_PAD * 2, viewport.h),
  } : null;

  // Card placement: below the target if it fits, otherwise above, otherwise
  // whichever side has more room; horizontally centered on the target and
  // kept inside the viewport. No target: centered on screen.
  const cardW = Math.min(TOUR_CARD_MAX_W, viewport.w - TOUR_MARGIN * 2);
  let cardStyle;
  if (spot) {
    const below = viewport.h - (spot.top + spot.height) - TOUR_GAP - TOUR_MARGIN;
    const above = spot.top - TOUR_GAP - TOUR_MARGIN;
    const placeBelow = below >= cardSize.h || (above < cardSize.h && below >= above);
    let top = placeBelow ? spot.top + spot.height + TOUR_GAP : spot.top - TOUR_GAP - cardSize.h;
    top = Math.min(Math.max(top, TOUR_MARGIN), Math.max(viewport.h - cardSize.h - TOUR_MARGIN, TOUR_MARGIN));
    let left = spot.left + spot.width / 2 - cardW / 2;
    left = Math.min(Math.max(left, TOUR_MARGIN), viewport.w - cardW - TOUR_MARGIN);
    cardStyle = { top, left };
  } else {
    cardStyle = {
      top: Math.max((viewport.h - cardSize.h) / 2, TOUR_MARGIN),
      left: Math.max((viewport.w - cardW) / 2, TOUR_MARGIN),
    };
  }

  const btn = {
    padding: '8px 14px', borderRadius: 'var(--r-ctl)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  };

  return (
    <div data-tour-overlay="1" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* Click-catcher so the page underneath can't be used mid-tour. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: spot ? 'transparent' : 'rgba(0,0,0,0.55)' }} />
      {spot && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: '10px', boxShadow: `0 0 0 2px ${COLOR.primary}, 0 0 0 9999px rgba(0,0,0,0.55)`,
            pointerEvents: 'none', transition: 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease',
          }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        style={{
          position: 'fixed', ...cardStyle, width: `${cardW}px`, boxSizing: 'border-box',
          background: COLOR.surfaceRaised, color: COLOR.text, border: `1px solid ${COLOR.border}`,
          borderTop: `3px solid ${COLOR.primary}`, borderRadius: 'var(--r-card)', padding: '14px 16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: COLOR.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Tour · {index + 1} of {TOUR_STEPS.length}
          </span>
          {!step.last && (
            <button onClick={finish} className="btn-flat" style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '12px', fontWeight: 700, color: COLOR.muted, cursor: 'pointer' }}>
              Skip tour
            </button>
          )}
        </div>
        <div id="tour-title" className="itil-display" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{step.title}</div>
        <div id="tour-body" style={{ fontSize: '13px', lineHeight: 1.5, color: COLOR.text }}>{step.body}</div>
        <div className="flex items-center" style={{ marginTop: '14px', gap: '8px' }}>
          <div aria-hidden="true" className="flex" style={{ gap: '4px', flex: 1, flexWrap: 'wrap' }}>
            {TOUR_STEPS.map((_, i) => (
              <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === index ? COLOR.primary : COLOR.border }} />
            ))}
          </div>
          {index > 0 && (
            <button onClick={back} className="btn-flat" style={{ ...btn, border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text }}>Back</button>
          )}
          <button ref={nextRef} onClick={next} style={{ ...btn, border: 'none', background: COLOR.primary, color: COLOR.onAccent }}>
            {step.last ? 'Done' : index === 0 ? 'Show me around' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
