/* ---------------- shared UI: lesson & study views ---------------- */

// The SM-2 quality scale flashcards are rated on — 1 (total blank) through
// 5 (instant, no hesitation). A 3+ counts as a pass for both SRS growth and
// the app's binary mastery signal (see ratingToOutcome in 03_helpers.js).
const RATING_SCALE = [
  { n: 1, label: 'Blank', color: COLOR.red },
  { n: 2, label: 'Hard', color: COLOR.red },
  { n: 3, label: 'OK', color: COLOR.gold },
  { n: 4, label: 'Good', color: COLOR.success },
  { n: 5, label: 'Easy', color: COLOR.success },
];

function FlashcardView({ card, flipped, setFlipped, onRate, index, total, categoryLabel, speakingId, onSpeak, speechSupported, flashcardsData }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEffect(() => { setActiveTermKey(null); }, [card && card.id]);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));
  if (!card) return null;
  const otherCards = flashcardsData && flashcardsData.filter((c) => c.id !== card.id);
  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      {speechSupported && (
        <div style={{ textAlign: 'right', marginBottom: '6px' }}>
          <SpeakButton id={'card-' + card.id} text={flipped ? card.back : card.front} speakingId={speakingId} onSpeak={onSpeak} />
        </div>
      )}
      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          background: flipped ? COLOR.surfaceRaised : COLOR.surface,
          border: `1px solid ${COLOR.border}`,
          borderRadius: '18px',
          padding: '28px 20px',
          minHeight: '190px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        {!flipped ? (
          <div className="itil-display" style={{ fontSize: '21px', fontWeight: 500, lineHeight: 1.35 }}>{card.front}</div>
        ) : (
          <div style={{ fontSize: '16px', lineHeight: 1.6 }}>{autoHighlightTerms(card.back, otherCards, activeTermKey, setActiveTermKey, 2)}</div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: COLOR.muted, textAlign: 'center', marginTop: '8px' }}>
        {flipped ? 'Tap to see the term again' : 'Tap the card to reveal the definition'}
      </div>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginBottom: '6px' }}>
        How well did you know it?
      </div>
      <div className="flex gap-1">
        {RATING_SCALE.map(({ n, label, color }) => (
          <button
            key={n}
            onClick={() => onRate(n)}
            className="flex-1"
            style={{
              padding: '9px 2px', borderRadius: '10px', border: `1px solid ${color}`, color, background: 'transparent',
              fontSize: '11px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{n}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StudyEntry({ item, allFlashcards }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));
  const otherCards = allFlashcards && allFlashcards.filter((c) => c.id !== item.id);
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px' }}>
      <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{item.front}</div>
      <div style={{ fontSize: '14px', lineHeight: 1.55, color: COLOR.text, marginBottom: item.detail ? '8px' : 0 }}>
        {autoHighlightTerms(item.back, otherCards, activeTermKey, setActiveTermKey, 2)}
      </div>
      {item.detail && (
        <div style={{ fontSize: '13px', lineHeight: 1.55, color: COLOR.muted, borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '10px' }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

// When a specific category is picked (via the chips above), that's already
// a single section, shown in full. When "All" is selected, sections used to
// all stack into one long scroll — now they page one section at a time,
// with Next/Previous section controls, so the material reads like a short
// study booklet instead of one endless page.
// A compact row of "learn more" links for a category/section — used
// wherever a category's content is shown (Study section pages, a lesson's
// Vocabulary block, the cheat sheet) so a reader can jump straight to the
// specific official doc for that topic instead of only the whole-track
// links on the Exam tab.
function ResourceLinksRow({ resources, label }) {
  if (!resources || !resources.length) return null;
  return (
    <div style={{ marginBottom: '10px' }}>
      {label && <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '3px' }}>{label}</div>}
      <div className="flex flex-col gap-1">
        {resources.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11.5px', color: COLOR.primary, textDecoration: 'none', borderBottom: `1px dotted ${COLOR.primary}`, width: 'fit-content' }}
          >
            {r.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

// The flat (non-course) tracks' equivalent of a lesson's "See the real
// thing:" block — a category can optionally carry a `screenshot` key into
// REAL_PORTAL_SCREENSHOTS (02_portal_mockups.jsx), shown once per section
// in StudyView. Unlike the course-track version, there's no hand-drawn
// mockup to nest it under here, since flat tracks never had one — the real
// screenshot component already renders as a fully self-contained card on
// its own, so it needs no wrapper.
function CategoryScreenshot({ screenshotKey }) {
  const shot = screenshotKey && REAL_PORTAL_SCREENSHOTS[screenshotKey];
  if (!shot) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '6px' }}>Portal screenshot</div>
      <RealPortalScreenshot shot={shot} />
    </div>
  );
}

function QuizSectionButton({ label, count, onClick }) {
  if (!count) return null;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.gold, color: COLOR.onAccent,
        fontSize: '13px', fontWeight: 600, marginBottom: '18px',
      }}
    >
      Quiz this section: {label} ({count} question{count === 1 ? '' : 's'})
    </button>
  );
}

function StudyView({ activeCat, categories, flashcards, questionsData, onQuizCategory }) {
  const [sectionPage, setSectionPage] = useState(0);
  useEffect(() => { setSectionPage(0); }, [activeCat, flashcards]);

  if (activeCat !== 'all') {
    const items = flashcards.filter((i) => i.cat === activeCat);
    const activeCatObj = categories.find((c) => c.key === activeCat);
    const count = questionsData ? questionsData.filter((q) => q.cat === activeCat).length : 0;
    return (
      <div>
        <ResourceLinksRow resources={activeCatObj && activeCatObj.resources} label="Learn more" />
        <CategoryScreenshot screenshotKey={activeCatObj && activeCatObj.screenshot} />
        <div className="flex flex-col gap-3" style={{ marginBottom: '16px' }}>
          {items.map((item) => <StudyEntry key={item.id} item={item} allFlashcards={flashcards} />)}
        </div>
        {onQuizCategory && (
          <QuizSectionButton
            label={activeCatObj ? activeCatObj.label : activeCat}
            count={count}
            onClick={() => onQuizCategory(activeCat)}
          />
        )}
      </div>
    );
  }

  const sections = categories
    .map((c) => ({ cat: c, items: flashcards.filter((i) => i.cat === c.key) }))
    .filter((s) => s.items.length > 0);
  if (!sections.length) return null;
  const page = Math.min(sectionPage, sections.length - 1);
  const section = sections[page];
  const isFirst = page === 0;
  const isLast = page === sections.length - 1;
  const sectionQuestionCount = questionsData ? questionsData.filter((q) => q.cat === section.cat.key).length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="itil-display" style={{ fontSize: '15px', fontWeight: 600, color: COLOR.gold }}>{section.cat.label}</div>
        <div style={{ fontSize: '11px', color: COLOR.muted }}>Section {page + 1} of {sections.length}</div>
      </div>
      <ResourceLinksRow resources={section.cat.resources} label="Learn more" />
      <CategoryScreenshot screenshotKey={section.cat.screenshot} />
      <div className="flex flex-col gap-3" style={{ marginBottom: '18px' }}>
        {section.items.map((item) => <StudyEntry key={item.id} item={item} allFlashcards={flashcards} />)}
      </div>
      {onQuizCategory && (
        <QuizSectionButton
          label={section.cat.label}
          count={sectionQuestionCount}
          onClick={() => onQuizCategory(section.cat.key)}
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setSectionPage((p) => Math.max(0, p - 1))}
          disabled={isFirst}
          className="flex-1"
          style={{
            padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent',
            color: isFirst ? COLOR.muted : COLOR.text, fontSize: '13px', fontWeight: 600, opacity: isFirst ? 0.5 : 1,
          }}
        >
          ‹ Previous section
        </button>
        <button
          onClick={() => setSectionPage((p) => Math.min(sections.length - 1, p + 1))}
          disabled={isLast}
          className="flex-1"
          style={{
            padding: '12px', borderRadius: '12px',
            background: isLast ? COLOR.surfaceRaised : COLOR.primary, color: isLast ? COLOR.muted : COLOR.onAccent,
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Next section ›
        </button>
      </div>
    </div>
  );
}

function CheatSheetView({ trackLabel, sections, resources, flashcardsData }) {
  if (!sections.length) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No cheat sheet for this track yet.
      </div>
    );
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.4 }}>
          The must-know facts for {trackLabel}, condensed to one scrollable page — not a substitute for the
          flashcards/quiz, just a fast pre-exam refresher.
        </div>
      </div>
      <ResourceLinksRow resources={resources} label="Official resources for this track" />
      <button
        onClick={() => window.print()}
        className="cheat-sheet-print-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '9px 14px',
          borderRadius: '10px', border: `1px solid ${COLOR.primary}`, background: 'transparent', color: COLOR.primary,
          fontSize: '13px', fontWeight: 600,
        }}
      >
<IconPrinter /> Print / save as PDF
      </button>
      <div id="cheat-sheet-content" className="flex flex-col gap-4">
        <div className="itil-display cheat-sheet-title" style={{ fontSize: '18px', fontWeight: 600, display: 'none' }}>
          {trackLabel} — Cheat Sheet
        </div>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px' }}
          >
            <div className="itil-display" style={{ fontSize: '14.5px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>
              {section.heading}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {section.points.map((p, j) => (
                <li key={j} style={{ fontSize: '13.5px', lineHeight: 1.5, color: COLOR.text }}><GlossText text={p} pool={flashcardsData} max={2} blockId={'cs' + i + '-' + j} /></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchGame({ flashcards, roundSize, onContinue, onRoundComplete, continueLabel }) {
  // Fewer pairs per round (was 6) so a round fits more comfortably on one
  // screen and it's easier to actually see which term is being connected
  // to which definition, rather than scanning a wall of six of each.
  const ROUND_SIZE = roundSize || 4;

  const buildRound = useCallback(() => {
    const picked = shuffleArray(flashcards).slice(0, Math.min(ROUND_SIZE, flashcards.length));
    return { picked, termOrder: shuffleArray(picked), defOrder: shuffleArray(picked) };
  }, [flashcards]);

  const [round, setRound] = useState(buildRound);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  // Drag-a-line state: { termId, x, y, hoverDefId }, x/y in the container's
  // own coordinate space (see getRelativePoint) so the live line tracks the
  // pointer regardless of page scroll. This is purely additive on top of
  // the original tap-a-term-then-tap-a-definition flow below — a plain tap
  // (pointerdown+pointerup with no movement) still starts and immediately
  // clears a "drag" that never had anywhere to go, then still fires the
  // browser's own synthesized click, so tap-to-select keeps working
  // unchanged for keyboard users and anyone who just taps instead of drags.
  const [drag, setDrag] = useState(null);
  const containerRef = useRef(null);
  const termRefs = useRef({});
  const defRefs = useRef({});
  // Raw viewport-space pointer position, kept in a ref (not state) so the
  // auto-scroll loop below always reads the latest value without itself
  // being a dependency that would tear the loop down and rebuild it on
  // every single pointermove.
  const dragClientRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setRound(buildRound());
    setSelected(null);
    setMatched([]);
    setWrongPair(null);
    setMistakes(0);
    setDrag(null);
    // eslint-disable-next-line
  }, [flashcards]);

  // isDone/its effect, and the auto-scroll effect below, must run on every
  // render, before the "not enough cards" early return below — a hook
  // called only on some renders (e.g. skipped whenever flashcards.length <
  // 2, which is reachable now that a track switch can transiently leave
  // Match's category filter matching nothing in the new track) throws
  // "Rendered fewer hooks than expected" the next time the count crosses
  // back over 2.
  const isDone = round.picked.length > 0 && matched.length === round.picked.length;

  useEffect(() => {
    if (isDone && onRoundComplete) onRoundComplete();
    // eslint-disable-next-line
  }, [isDone]);

  // A round can easily run taller than one screen (up to ROUND_SIZE full
  // definitions), so dragging to a term/definition below the fold needs
  // the page to scroll itself — nothing else will, since the pointer is
  // captured for the drag rather than performing a normal touch-scroll.
  // Holding near the top/bottom edge auto-scrolls, faster the closer to
  // the edge, exactly like dragging a file near a folder window's edge.
  // Depends on the derived boolean (not `drag` itself, which gets a new
  // object reference on every pointermove) so this effect starts once per
  // drag instead of tearing down and restarting on every move.
  const isDragging = !!drag;
  useEffect(() => {
    if (!isDragging) return undefined;
    const EDGE = 70;
    const MAX_SPEED = 26;
    let rafId;
    const step = () => {
      const { x, y } = dragClientRef.current;
      const vh = window.innerHeight;
      let dy = 0;
      if (y < EDGE) dy = -MAX_SPEED * (1 - Math.max(y, 0) / EDGE);
      else if (y > vh - EDGE) dy = MAX_SPEED * (1 - Math.max(vh - y, 0) / EDGE);
      if (dy) {
        window.scrollBy(0, dy);
        setDrag((d) => (d ? { ...d, ...computeDragUpdate(x, y) } : d));
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line
  }, [isDragging]);

  if (flashcards.length < 2) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        Not enough cards in this category for a matching round — try "All" or a different category.
      </div>
    );
  }

  const newRound = () => {
    setRound(buildRound());
    setSelected(null);
    setMatched([]);
    setWrongPair(null);
    setMistakes(0);
    setDrag(null);
  };

  // Shared by both the tap flow and the drag-drop flow below, so the two
  // interaction styles can never disagree about what counts as a match.
  const evaluateMatch = (termId, defId) => {
    if (termId === defId) {
      setMatched((m) => [...m, termId]);
      setSelected(null);
    } else {
      setWrongPair({ termId, defId });
      setMistakes((m) => m + 1);
      setTimeout(() => { setWrongPair(null); setSelected(null); }, 500);
    }
  };

  const tap = (type, id) => {
    if (matched.includes(id) || wrongPair) return;
    if (!selected) { setSelected({ type, id }); return; }
    if (selected.type === type) { setSelected({ type, id }); return; }
    const termId = type === 'term' ? id : selected.id;
    const defId = type === 'def' ? id : selected.id;
    evaluateMatch(termId, defId);
  };

  // Coordinates relative to the container div (which the SVG overlay fills
  // exactly), so lines stay correctly anchored regardless of where the
  // game happens to sit on the page.
  const getRelativePoint = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const anchorFor = (refsMap, id) => {
    const el = refsMap.current[id];
    if (!el || !containerRef.current) return null;
    const r = el.getBoundingClientRect();
    const cRect = containerRef.current.getBoundingClientRect();
    return { x: r.left - cRect.left + r.width / 2, y: r.top - cRect.top + r.height / 2 };
  };

  // Shared by every place that needs to know "given this raw viewport
  // point, where's the line's end and what's underneath it" — the initial
  // pointerdown, every pointermove, and the auto-scroll loop below all
  // funnel through this so they can never compute it inconsistently.
  const computeDragUpdate = (clientX, clientY) => {
    const p = getRelativePoint(clientX, clientY);
    const el = document.elementFromPoint(clientX, clientY);
    const defEl = el && el.closest && el.closest('[data-def-id]');
    const hoverDefId = defEl ? defEl.getAttribute('data-def-id') : null;
    return { x: p.x, y: p.y, hoverDefId };
  };

  const beginDrag = (e, termId) => {
    if (matched.includes(termId) || wrongPair) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragClientRef.current = { x: e.clientX, y: e.clientY };
    setSelected({ type: 'term', id: termId });
    setDrag({ termId, ...computeDragUpdate(e.clientX, e.clientY) });
  };

  // Attached to the container (not each definition) and hit-tests with
  // elementFromPoint — the SVG overlay sits on top with pointer-events:
  // none specifically so this always sees the real definition button
  // underneath the live line, not the line itself.
  const onContainerPointerMove = (e) => {
    if (!drag) return;
    dragClientRef.current = { x: e.clientX, y: e.clientY };
    setDrag((d) => (d ? { ...d, ...computeDragUpdate(e.clientX, e.clientY) } : d));
  };

  const onContainerPointerUp = () => {
    if (!drag) return;
    const { termId, hoverDefId } = drag;
    setDrag(null);
    if (hoverDefId && !matched.includes(hoverDefId)) evaluateMatch(termId, hoverDefId);
  };

  if (isDone) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Round complete!</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginBottom: '20px' }}>
          {round.picked.length} pairs matched · {mistakes} mistake{mistakes === 1 ? '' : 's'}
        </div>
        <div className="flex gap-2" style={{ justifyContent: 'center' }}>
          <button
            onClick={newRound}
            style={{ background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, color: COLOR.text, borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
          >
            New round
          </button>
          {onContinue && (
            <button
              onClick={onContinue}
              style={{ background: COLOR.primary, color: COLOR.onAccent, borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
            >
              {continueLabel || 'Continue reading →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const termState = (id) => {
    if (matched.includes(id)) return 'matched';
    if (wrongPair && wrongPair.termId === id) return 'wrong';
    if (drag && drag.termId === id) return 'selected';
    if (selected && selected.type === 'term' && selected.id === id) return 'selected';
    return 'idle';
  };
  const defState = (id) => {
    if (matched.includes(id)) return 'matched';
    if (wrongPair && wrongPair.defId === id) return 'wrong';
    if (drag && drag.hoverDefId === id) return 'hover';
    if (selected && selected.type === 'def' && selected.id === id) return 'selected';
    return 'idle';
  };

  const stateStyle = (state) => {
    if (state === 'matched') return { background: 'rgba(52,211,153,0.12)', border: `1px solid ${COLOR.success}`, color: COLOR.muted, opacity: 0.55 };
    if (state === 'wrong') return { background: 'rgba(181,87,74,0.16)', border: `1px solid ${COLOR.red}`, color: COLOR.text };
    if (state === 'hover') return { background: 'rgba(167,139,250,0.2)', border: `2px solid ${COLOR.primary}`, color: COLOR.text };
    if (state === 'selected') return { background: 'rgba(211,164,101,0.14)', border: `1px solid ${COLOR.gold}`, color: COLOR.text };
    return { background: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.text };
  };

  // Longer compound terms (e.g. "AzCopy vs. Storage Explorer vs. Azure
  // File Sync") need a smaller size to fit their chip without wrapping
  // into an unreadable ransom-note of line breaks; short ones can afford
  // to be noticeably bigger, which also makes the row read less like a
  // dense wall of equal-weight text.
  const termFontSize = (text) => {
    if (text.length > 38) return '12px';
    if (text.length > 24) return '13.5px';
    return '15.5px';
  };

  // A small neutral badge — 1, 2, 3… on terms, A, B, C… on definitions —
  // so the pairing itself reads as "match numbered items to lettered
  // ones," the familiar worksheet convention, instead of two unlabeled
  // walls of text the player has to realize are meant to connect at all.
  const NumberBadge = ({ n }) => (
    <span
      style={{
        position: 'absolute', top: '-7px', left: '-7px', width: '20px', height: '20px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5px', fontWeight: 700,
        background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, color: COLOR.muted,
      }}
    >
      {n}
    </span>
  );

  return (
    <div
      ref={containerRef}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onPointerCancel={onContainerPointerUp}
      style={{ position: 'relative' }}
    >
      <div className="flex justify-between items-center mb-1">
        <span style={{ fontSize: '11px', color: COLOR.muted }}>
          {matched.length} / {round.picked.length} matched{mistakes > 0 ? ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ''}
        </span>
        <button onClick={newRound} className="btn-flat" style={{ fontSize: '11px', color: COLOR.primary, fontWeight: 600, padding: '4px 8px' }}>
          New round
        </button>
      </div>
      <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '10px', textAlign: 'center' }}>
        Match each numbered term to its lettered definition — tap both, or drag a term down onto its match.
      </div>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5, overflow: 'visible' }}>
        {matched.map((id) => {
          const from = anchorFor(termRefs, id);
          const to = anchorFor(defRefs, id);
          if (!from || !to) return null;
          return <line key={id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={COLOR.success} strokeWidth="2" strokeDasharray="4 4" opacity="0.55" />;
        })}
        {wrongPair && (() => {
          const from = anchorFor(termRefs, wrongPair.termId);
          const to = anchorFor(defRefs, wrongPair.defId);
          if (!from || !to) return null;
          return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={COLOR.red} strokeWidth="2.5" />;
        })()}
        {drag && (() => {
          const from = anchorFor(termRefs, drag.termId);
          if (!from) return null;
          return <line x1={from.x} y1={from.y} x2={drag.x} y2={drag.y} stroke={COLOR.primary} strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />;
        })()}
      </svg>

      <div className="flex flex-wrap gap-3 mb-5" style={{ paddingTop: '8px' }}>
        {round.termOrder.map((card, i) => {
          const state = termState(card.id);
          return (
            <button
              key={card.id}
              ref={(el) => { termRefs.current[card.id] = el; }}
              data-term-id={card.id}
              onClick={() => tap('term', card.id)}
              onPointerDown={(e) => beginDrag(e, card.id)}
              disabled={state === 'matched'}
              style={{
                ...stateStyle(state),
                position: 'relative', borderRadius: '10px', padding: '10px 14px', fontSize: termFontSize(card.front),
                fontWeight: 600, lineHeight: 1.3, textAlign: 'center', maxWidth: '170px', touchAction: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <NumberBadge n={i + 1} />
              {card.front}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {round.defOrder.map((card, i) => {
          const state = defState(card.id);
          return (
            <button
              key={card.id}
              ref={(el) => { defRefs.current[card.id] = el; }}
              data-def-id={card.id}
              onClick={() => tap('def', card.id)}
              disabled={state === 'matched'}
              style={{
                ...stateStyle(state),
                borderRadius: '10px', padding: '12px 14px', fontSize: '14.5px', lineHeight: 1.5, textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <strong style={{ color: COLOR.muted }}>{String.fromCharCode(65 + i)}.</strong> {card.back}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpeakButton({ id, text, speakingId, onSpeak }) {
  const isSpeaking = speakingId === id;
  return (
    <button
      onClick={() => onSpeak(id, text)}
      style={{
        fontSize: '11px', padding: '5px 10px', borderRadius: '8px',
        border: `1px solid ${isSpeaking ? COLOR.primary : COLOR.border}`,
        background: isSpeaking ? 'rgba(167,139,250,0.14)' : 'transparent',
        color: isSpeaking ? COLOR.primary : COLOR.muted, fontWeight: 600,
      }}
    >
      {isSpeaking ? '⏸ Stop' : '🔊 Listen'}
    </button>
  );
}

function LessonCard({ lesson, mastery, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{ width: '100%', textAlign: 'left', background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '10px' }}
    >
      <div className="flex justify-between items-start">
        <div className="itil-display" style={{ fontSize: '15px', fontWeight: 600 }}>{lesson.title}</div>
        <div style={{ fontSize: '11px', color: mastery >= 0.7 ? COLOR.success : mastery > 0 ? COLOR.gold : COLOR.muted, fontWeight: 600 }}>{Math.round(mastery * 100)}%</div>
      </div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>{lesson.summary}</div>
    </button>
  );
}

function ReadingCheckGate({ question, onPassed }) {
  const [q] = useState(() => prepareQuestion(question));
  const [selected, setSelected] = useState(null);
  const [msPending, setMsPending] = useState([]);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const evalCorrect = (answer) => {
    if (q.type === 'mc') return answer === q.correct;
    if (q.type === 'tf') return (answer === 0) === q.answer;
    if (q.type === 'ms') {
      const picked = [...answer].sort();
      const correct = [...q.correct].sort();
      return picked.length === correct.length && picked.every((v, i) => v === correct[i]);
    }
    return false;
  };

  const onChoose = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setWasCorrect(evalCorrect(idx));
  };
  const onToggleMs = (idx) => {
    if (selected !== null) return;
    setMsPending((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };
  const onSubmitMs = () => {
    if (selected !== null || msPending.length === 0) return;
    setSelected(msPending);
    setWasCorrect(evalCorrect(msPending));
  };
  const onNext = () => {
    if (wasCorrect) { onPassed(); return; }
    setAttempts((a) => a + 1);
    setSelected(null);
    setMsPending([]);
    setWasCorrect(null);
  };

  return (
    <div>
      <div style={{ fontSize: '11px', color: COLOR.gold, fontWeight: 600, marginBottom: '8px' }}>Quick check</div>
      <QuestionView
        q={q}
        selected={selected}
        onChoose={onChoose}
        onNext={onNext}
        index={0}
        total={1}
        hideMeta
        msPending={msPending}
        onToggleMs={onToggleMs}
        onSubmitMs={onSubmitMs}
        nextLabel={selected === null ? null : wasCorrect ? 'Continue reading →' : 'Try again'}
      />
      {attempts > 0 && selected === null && (
        <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '6px', textAlign: 'center' }}>
          Not quite — give it another shot.
        </div>
      )}
    </div>
  );
}

// The "apply it" half of a lesson — portal mockup or walkthrough, the real
// screenshot, the worked scenario, common exam traps, and the on-the-job
// note. Shared by the Reference tab's LessonDetail and the guided path's
// "Apply it" step so both render it identically.
function LessonApplySections({ lesson, categories, lessonCatKeys, flashcardsData, collapsePortal }) {
  const [portalOpen, setPortalOpen] = useState(!collapsePortal);
  const walkthrough = lesson.portalMockup ? PORTAL_WALKTHROUGHS[lesson.portalMockup] : null;
  const MockupComp = !walkthrough && lesson.portalMockup ? PORTAL_MOCKUPS[lesson.portalMockup] : null;
  const realShot = lesson.portalMockup ? REAL_PORTAL_SCREENSHOTS[lesson.portalMockup] : null;
  // Some flat (non-course) tracks carry a real screenshot on the CATEGORY
  // itself (CategoryScreenshot in StudyView) rather than on a lesson's
  // portalMockup — e.g. MD-102's Intune screenshots predate its course
  // content. Once such a track gains LESSONS, CourseView replaces
  // StudyView entirely (see the mode==='learn' branch in 06_app.jsx), so
  // without this fallback those screenshots would become unreachable.
  // Only kicks in when the lesson has no mockup/walkthrough of its own.
  // A lesson can span more than one category (e.g. AZ-802's clustering
  // lesson pulls vocab from both hybridWorkloads and vmContainers) — this
  // still resolves as long as exactly one of those categories carries a
  // screenshot, so it never duplicates a real screenshot already shown
  // above and never guesses between two competing candidates.
  const lessonScreenshotCats = !walkthrough && !MockupComp
    ? lessonCatKeys
        .map((k) => (categories || []).find((c) => c.key === k))
        .filter((c) => c && c.screenshot)
    : [];
  const categoryScreenshotKey = lessonScreenshotCats.length === 1 ? lessonScreenshotCats[0].screenshot : null;
  const categoryRealShot = categoryScreenshotKey ? REAL_PORTAL_SCREENSHOTS[categoryScreenshotKey] : null;
  const hasPortal = !!(walkthrough || MockupComp || categoryRealShot);
  // On the Reference page the mockup and screenshot are big, so they sit
  // behind one tap; the guided path's Apply step shows them open.
  const portalTitle = walkthrough ? `Try it: ${walkthrough.label}` : MockupComp ? 'Portal mockup' : 'Portal screenshot';
  return (
    <React.Fragment>
      {hasPortal && collapsePortal && (
        <button
          onClick={() => setPortalOpen((o) => !o)}
          aria-expanded={portalOpen}
          style={{
            width: '100%', marginBottom: portalOpen ? '10px' : '16px', padding: '11px 14px', borderRadius: '12px', textAlign: 'left',
            background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
          }}
        >
          <span>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLOR.gold }}>{portalTitle}</span>
            <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted }}>{walkthrough ? 'Click through the real flow' : realShot || categoryRealShot ? 'Layout sketch and a real screenshot' : 'A sketch of the layout'}</span>
          </span>
          <span style={{ fontSize: '11px', color: COLOR.muted }}>{portalOpen ? '▴' : '▾'}</span>
        </button>
      )}
      {portalOpen && (walkthrough || MockupComp) && (
        <div style={{ marginBottom: '16px' }}>
          {!collapsePortal && (
            <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '4px' }}>
              {portalTitle}
            </div>
          )}
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>
            {walkthrough
              ? 'A click-through illustration of the real flow, not an exact screenshot — the real portal may look slightly different.'
              : 'An illustration of the layout, not an exact screenshot — the real portal may look slightly different.'}
          </div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px' }}>
            {walkthrough ? <PortalWalkthroughPlayer walkthrough={walkthrough} /> : <MockupComp />}
          </div>
          {realShot && (
            <>
              <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '12px', marginBottom: '2px' }}>
                See the real thing:
              </div>
              <RealPortalScreenshot shot={realShot} />
            </>
          )}
        </div>
      )}

      {portalOpen && categoryRealShot && (
        <div style={{ marginBottom: '16px' }}>
          {!collapsePortal && <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '4px' }}>Portal screenshot</div>}
          <RealPortalScreenshot shot={categoryRealShot} />
        </div>
      )}

      {lesson.scenario && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>Worked scenario</div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.primary}`, borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '14px', lineHeight: 1.65, color: COLOR.text }}><GlossText text={lesson.scenario} pool={flashcardsData} max={3} blockId="scn" /></p>
          </div>
        </div>
      )}

      {lesson.commonTraps && lesson.commonTraps.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.red, marginBottom: '8px' }}>Common exam traps</div>
          <div className="flex flex-col gap-2">
            {lesson.commonTraps.map((t, i) => (
              <div
                key={i}
                style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.red}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13.5px', lineHeight: 1.55, color: COLOR.text }}
              >
                <GlossText text={t} pool={flashcardsData} max={2} blockId={'trap' + i} />
              </div>
            ))}
          </div>
        </div>
      )}

      {lesson.onTheJob && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.teal, marginBottom: '8px' }}>On the job</div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.teal}`, borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: COLOR.text }}><GlossText text={lesson.onTheJob} pool={flashcardsData} max={3} blockId="otj" /></p>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function LessonDetail({ lesson, flashcardsData, questionsData, categories, onBack, onQuiz, speakingId, onSpeak, speechSupported, isFirstLesson, isLastLesson, onPrevLesson, onNextLesson }) {
  const [showFundamentals, setShowFundamentals] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));
  const [readingPage, setReadingPage] = useState(0);
  const [unlockedPages, setUnlockedPages] = useState(1);
  const vocabItems = lesson.vocabIds.map((id) => flashcardsData.find((f) => f.id === id)).filter(Boolean);
  const lessonCatKeys = [...new Set(vocabItems.map((v) => v.cat))];
  // The lesson's own quizIds are a small, deliberately curated set used for
  // the in-reading gate checks below — the final "quiz this section" button
  // instead pulls every question tagged with the category/categories this
  // lesson's vocabulary belongs to, so it's a real full-section test rather
  // than a repeat of the same handful of gate questions. Falls back to
  // quizIds only if a lesson somehow has no categorized vocabulary at all.
  const sectionQuestions = (questionsData || []).filter((q) => lessonCatKeys.includes(q.cat));
  const finalQuizIds = sectionQuestions.length ? sectionQuestions.map((q) => q.id) : lesson.quizIds;
  const finalQuizLabel = lessonCatKeys
    .map((k) => (categories || []).find((c) => c.key === k))
    .filter(Boolean)
    .map((c) => c.label)
    .join(' & ') || lesson.title;
  const vocabResources = (categories || [])
    .filter((c) => vocabItems.some((v) => v.cat === c.key) && c.resources && c.resources.length)
    .flatMap((c) => c.resources);
  const DiagramComp = lesson.diagram ? LESSON_DIAGRAMS[lesson.diagram] : null;

  const paragraphs = lesson.reading.split('\n\n');
  const readingPages = [];
  for (let i = 0; i < paragraphs.length; i += 2) readingPages.push(paragraphs.slice(i, i + 2));
  const isLastReadingPage = readingPage === readingPages.length - 1;
  const needsGate = !isLastReadingPage && readingPage === unlockedPages - 1;

  const gateQuestions = (questionsData || [])
    .filter((q) => lesson.quizIds.includes(q.id) && (q.type === 'mc' || q.type === 'tf'));
  const gateVocabPool = useMemo(() => {
    return vocabItems.length >= 2 ? shuffleArray(vocabItems).slice(0, 3) : [];
    // eslint-disable-next-line
  }, [lesson.id, readingPage]);
  const useMatchGateHere = readingPage % 2 === 1 || gateQuestions.length === 0;
  const gateQuestion = !useMatchGateHere && gateQuestions.length
    ? gateQuestions[readingPage % gateQuestions.length]
    : null;
  const advancePastGate = () => { setUnlockedPages((n) => n + 1); setReadingPage((p) => p + 1); };

  useEffect(() => { setActiveTermKey(null); }, [readingPage]);

  return (
    <div>
      <button onClick={onBack} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '12px', padding: 0 }}>
        ‹ All lessons
      </button>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '4px' }}>{lesson.title}</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '12px' }}><GlossText text={lesson.summary} pool={flashcardsData} max={2} blockId="sum" /></div>
      <ResourceLinksRow resources={vocabResources} label="Learn more" />

      {DiagramComp && (
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <DiagramComp />
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold }}>
            Reading{readingPages.length > 1 ? ` · page ${readingPage + 1} of ${readingPages.length}` : ''}
          </div>
          {speechSupported && (
            <SpeakButton
              id={'read-' + lesson.id + '-' + readingPage}
              text={readingPages[readingPage].join(' ')}
              speakingId={speakingId}
              onSpeak={onSpeak}
            />
          )}
        </div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '8px' }}>Tap a highlighted term for its definition.</div>
        {readingPages[readingPage].map((p, i) => (
          <p key={i} style={{ fontSize: '14px', lineHeight: 1.65, color: COLOR.text, marginBottom: '10px' }}>
            {highlightTerms(p, lesson.keyTerms, flashcardsData, activeTermKey, setActiveTermKey, 'p' + i)}
          </p>
        ))}

        {readingPage > 0 && (
          <button
            onClick={() => setReadingPage((p) => p - 1)}
            className="btn-flat"
            style={{ fontSize: '12px', color: COLOR.muted, padding: '4px 0', marginBottom: '10px' }}
          >
            ‹ Previous page
          </button>
        )}

        {!isLastReadingPage && readingPage < unlockedPages - 1 && (
          <button
            onClick={() => setReadingPage((p) => p + 1)}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, color: COLOR.text, fontSize: '13px', fontWeight: 600 }}
          >
            Next page →
          </button>
        )}

        {needsGate && (
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '10px', textAlign: 'center' }}>
              {useMatchGateHere ? 'Match a few terms to unlock the next page.' : 'Answer this to unlock the next page.'}
            </div>
            {useMatchGateHere ? (
              gateVocabPool.length >= 2 ? (
                <MatchGame flashcards={gateVocabPool} roundSize={3} onContinue={advancePastGate} />
              ) : (
                <button
                  onClick={advancePastGate}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
                >
                  Continue reading →
                </button>
              )
            ) : gateQuestion ? (
              <ReadingCheckGate question={gateQuestion} onPassed={advancePastGate} />
            ) : (
              <button
                onClick={advancePastGate}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
              >
                Continue reading →
              </button>
            )}
          </div>
        )}
      </div>

      <LessonApplySections lesson={lesson} categories={categories} lessonCatKeys={lessonCatKeys} flashcardsData={flashcardsData} collapsePortal />

      <button
        onClick={() => setShowFundamentals((s) => !s)}
        style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '12px', marginBottom: showFundamentals ? '0' : '16px', fontSize: '12px', color: COLOR.primary, fontWeight: 600 }}
      >
        {showFundamentals ? '▾ ' : '▸ '}{lesson.fundamentalsLabel}
      </button>
      {showFundamentals && (
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: '0 0 12px 12px', padding: '14px', marginBottom: '16px', borderLeft: `1px solid ${COLOR.border}`, borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
          {speechSupported && (
            <div className="flex justify-end" style={{ marginBottom: '8px' }}>
              <SpeakButton id={'fund-' + lesson.id} text={lesson.fundamentals.replace(/\n+/g, ' ')} speakingId={speakingId} onSpeak={onSpeak} />
            </div>
          )}
          {lesson.fundamentals.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.text, marginBottom: '8px' }}><GlossText text={p} pool={flashcardsData} max={2} blockId={'fund' + i} /></p>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowVocabulary((s) => !s)}
        style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '12px', marginBottom: showVocabulary ? '0' : '16px', fontSize: '12px', color: COLOR.primary, fontWeight: 600 }}
      >
        {showVocabulary ? '▾ ' : '▸ '}Vocabulary ({vocabItems.length} term{vocabItems.length === 1 ? '' : 's'})
      </button>
      {showVocabulary && (
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: '0 0 12px 12px', padding: '14px', marginBottom: '16px', borderLeft: `1px solid ${COLOR.border}`, borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
          <div className="flex flex-col gap-2">
            {vocabItems.map((item) => <StudyEntry key={item.id} item={item} />)}
          </div>
        </div>
      )}

      <QuizSectionButton label={finalQuizLabel} count={finalQuizIds.length} onClick={() => onQuiz(finalQuizIds)} />

      {(onPrevLesson || onNextLesson) && (
        <div className="flex gap-2">
          <button
            onClick={onPrevLesson}
            disabled={isFirstLesson}
            className="flex-1"
            style={{
              padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent',
              color: isFirstLesson ? COLOR.muted : COLOR.text, fontSize: '13px', fontWeight: 600, opacity: isFirstLesson ? 0.5 : 1,
            }}
          >
            ‹ Previous lesson
          </button>
          <button
            onClick={onNextLesson}
            disabled={isLastLesson}
            className="flex-1"
            style={{
              padding: '12px', borderRadius: '12px',
              background: isLastLesson ? COLOR.surfaceRaised : COLOR.primary, color: isLastLesson ? COLOR.muted : COLOR.onAccent,
              fontSize: '13px', fontWeight: 600,
            }}
          >
            Next lesson ›
          </button>
        </div>
      )}
    </div>
  );
}

// Opens directly into the first lesson's content (not a list you must tap
// into first) so Study behaves like StudyView's section-at-a-time reading
// flow — a course track used to force an extra click through a full lesson
// list before showing any actual content. Previous/Next lesson buttons let
// you move straight through the course; the lesson list ("‹ All lessons")
// is still there for jumping to a specific lesson out of order, it's just
// no longer the mandatory starting point.
function CourseView({ lessons, flashcardsData, questionsData, categories, onQuiz, speakingId, onSpeak, speechSupported, masteryFn }) {
  const [lessonId, setLessonId] = useState(lessons.length ? lessons[0].id : null);
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[lessonIndex];
  if (lesson) {
    return (
      <LessonDetail
        key={lesson.id}
        lesson={lesson}
        flashcardsData={flashcardsData}
        questionsData={questionsData}
        categories={categories}
        onBack={() => setLessonId(null)}
        onQuiz={onQuiz}
        speakingId={speakingId}
        onSpeak={onSpeak}
        speechSupported={speechSupported}
        isFirstLesson={lessonIndex === 0}
        isLastLesson={lessonIndex === lessons.length - 1}
        onPrevLesson={() => setLessonId(lessons[Math.max(0, lessonIndex - 1)].id)}
        onNextLesson={() => setLessonId(lessons[Math.min(lessons.length - 1, lessonIndex + 1)].id)}
      />
    );
  }
  const masteredCount = lessons.filter((l) => masteryFn(l) >= 0.7).length;
  const avgMastery = lessons.length ? lessons.reduce((sum, l) => sum + masteryFn(l), 0) / lessons.length : 0;
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: COLOR.muted }}>Course progress</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: masteredCount === lessons.length ? COLOR.success : COLOR.text }}>
            {masteredCount} of {lessons.length} lessons strong
          </div>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(avgMastery * 100)}%`, background: COLOR.success, borderRadius: '3px' }} />
        </div>
      </div>
      {lessons.map((l) => (
        <LessonCard key={l.id} lesson={l} mastery={masteryFn(l)} onOpen={() => setLessonId(l.id)} />
      ))}
    </div>
  );
}

