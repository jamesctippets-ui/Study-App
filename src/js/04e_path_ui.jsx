/* ---------------- guided study path ---------------- */

// The Path tab: a Duolingo-style walk through one track, one unit per lesson,
// each unit a mixed-order run of steps (read, flashcards, quiz, a mini-game,
// an apply-it scenario, more cards/quiz, a checkpoint). The unit/step model
// and progress maths live in 03_helpers.js (buildPathUnits and friends); this
// file is only the screens. Every step reuses an existing view over a given
// set of items and records through the same handlers the Practice tab uses
// (passed in as `api`), so mastery, spaced repetition, streaks, the daily
// goal, and achievements all keep working with no path-specific scoring.

function PathIcon({ kind, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'read':
      return <svg {...common}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
    case 'cards':
    case 'cards2':
      return <svg {...common}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
    case 'quiz':
    case 'quiz2':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'game':
      return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'apply':
      return <svg {...common}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case 'checkpoint':
      return <svg {...common}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'check':
      return <svg {...common} strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>;
    default:
      return null;
  }
}

/* ---- step runners ---- */

function PathReadStep({ unit, flashcardsData, speech, onDone }) {
  const { lesson } = unit;
  const [page, setPage] = useState(0);
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));
  useEffect(() => { setActiveTermKey(null); }, [page]);
  const paragraphs = lesson.reading.split('\n\n');
  const pages = [];
  for (let i = 0; i < paragraphs.length; i += 2) pages.push(paragraphs.slice(i, i + 2));
  const isLast = page === pages.length - 1;
  const DiagramComp = page === 0 && lesson.diagram ? LESSON_DIAGRAMS[lesson.diagram] : null;
  return (
    <div>
      {DiagramComp && (
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <DiagramComp />
        </div>
      )}
      <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold }}>
          Reading{pages.length > 1 ? ` · page ${page + 1} of ${pages.length}` : ''}
        </div>
        {speech.speechSupported && (
          <SpeakButton id={'path-read-' + lesson.id + '-' + page} text={pages[page].join(' ')} speakingId={speech.speakingId} onSpeak={speech.onSpeak} />
        )}
      </div>
      <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '8px' }}>Tap a highlighted term for its definition.</div>
      {pages[page].map((p, i) => (
        <p key={i} style={{ fontSize: '14px', lineHeight: 1.65, color: COLOR.text, marginBottom: '10px' }}>
          {highlightTerms(p, lesson.keyTerms, flashcardsData, activeTermKey, setActiveTermKey, 'pp' + i)}
        </p>
      ))}
      <div className="flex gap-2" style={{ marginTop: '14px' }}>
        {page > 0 && (
          <button
            onClick={() => setPage((n) => n - 1)}
            className="flex-1"
            style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 600 }}
          >
            ‹ Back
          </button>
        )}
        <button
          onClick={() => (isLast ? onDone(null) : setPage((n) => n + 1))}
          className="flex-1"
          style={{ padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {isLast ? 'Done reading' : 'Next ›'}
        </button>
      </div>
    </div>
  );
}

function PathCardsStep({ cards, categories, flashcardsData, speech, onRate, onDone }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const card = cards[index];
  const rate = (quality) => {
    onRate(card.id, quality);
    const nextKnown = known + (quality >= 3 ? 1 : 0);
    setKnown(nextKnown);
    setFlipped(false);
    if (index + 1 >= cards.length) onDone(Math.round((nextKnown / cards.length) * 100));
    else setIndex(index + 1);
  };
  return (
    <FlashcardView
      card={card}
      flipped={flipped}
      setFlipped={setFlipped}
      onRate={rate}
      index={index}
      total={cards.length}
      categoryLabel={categories.find((c) => c.key === card.cat)?.label}
      speakingId={speech.speakingId}
      onSpeak={speech.onSpeak}
      speechSupported={speech.speechSupported}
      flashcardsData={flashcardsData}
    />
  );
}

function PathQuizStep({ questions, passPct, label, categories, flashcardsData, onAnswer, onFinished, onPass, onRetry, continueLabel, header }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [msPending, setMsPending] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const q = questions[index];
  const correctCount = answers.filter((a) => a.correct).length;

  const record = (isCorrect, selection) => {
    setSelected(selection);
    setAnswers((a) => [...a, { id: q.id, cat: q.cat, prompt: q.question, correct: isCorrect, explanation: q.explanation, whyTested: q.whyTested }]);
    onAnswer(q.id, isCorrect);
  };
  const choose = (idx) => {
    if (selected !== null || !q || q.type === 'ms') return;
    const isCorrect = q.type === 'mc' ? idx === q.correct : (idx === 0) === q.answer;
    record(isCorrect, idx);
  };
  const toggleMs = (idx) => {
    if (selected !== null) return;
    setMsPending((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };
  const submitMs = () => {
    if (selected !== null || !q || q.type !== 'ms' || !msPending.length) return;
    const picked = [...msPending].sort();
    const correct = [...q.correct].sort();
    record(picked.length === correct.length && picked.every((v, i) => v === correct[i]), picked);
  };
  const advance = () => {
    setSelected(null);
    setMsPending([]);
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
  };

  useEffect(() => {
    if (!finished) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    onFinished(correctCount, answers.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    const pct = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
    const passed = pct >= passPct;
    const reviewOnly = passPct === 0;
    return (
      <div>
        <div style={{
          marginBottom: '14px', padding: '14px', borderRadius: '14px', textAlign: 'center',
          border: `1px solid ${passed ? COLOR.success : COLOR.gold}`, background: passed ? 'rgba(52,211,153,0.10)' : `${COLOR.gold}14`,
        }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: passed ? COLOR.success : COLOR.gold }}>
            {passed ? (reviewOnly ? `${label} done` : `${label} passed`) : `Not quite yet — ${passPct}% to pass`}
          </div>
          <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '3px' }}>
            {passed
              ? (reviewOnly ? 'Anything you missed again is below.' : 'The questions you missed are below if you want to review them.')
              : 'Read the explanations below, then try again with a fresh set.'}
          </div>
          {passed && (
            <button
              onClick={() => onPass(pct)}
              style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', background: COLOR.success, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
            >
              {reviewOnly ? (continueLabel || 'Back to the path ›') : 'Continue ›'}
            </button>
          )}
        </div>
        <QuizSummary
          score={{ correct: correctCount, total: answers.length }}
          answers={answers}
          categories={categories}
          onRestart={onRetry}
          restartLabel={passed ? 'Practice again' : 'Try again'}
        />
      </div>
    );
  }

  return (
    <div>
    {header}
    <QuestionView
      q={q}
      selected={selected}
      onChoose={choose}
      onNext={advance}
      index={index}
      total={questions.length}
      categoryLabel={categories.find((c) => c.key === q.cat)?.label}
      badgeLabel={label}
      msPending={msPending}
      onToggleMs={toggleMs}
      onSubmitMs={submitMs}
      flashcardsData={flashcardsData}
    />
    </div>
  );
}

function PathMadlibStep({ item, categories, flashcardsData, onResult, onDone }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const submit = () => {
    const ok = item.blanks.every((b) => answers[b.key] === b.correct);
    setSubmitted(true);
    setScore({ correct: ok ? 1 : 0, total: 1 });
    onResult(item.id, ok ? 'correct' : 'incorrect');
  };
  return (
    <MadLibsView
      session={[item]}
      index={0}
      score={score}
      categories={categories}
      answers={answers}
      onSetBlank={(key, idx) => { if (!submitted) setAnswers((a) => ({ ...a, [key]: idx })); }}
      submitted={submitted}
      onSubmit={submit}
      onNext={() => onDone(score.correct ? 100 : 0)}
      onRestart={() => {}}
      flashcardsData={flashcardsData}
    />
  );
}

function PathSequenceStep({ item, categories, flashcardsData, onResult, onDone }) {
  const [order, setOrder] = useState(() => {
    let o = shuffleArray(item.steps.map((_, i) => i));
    if (o.length > 1 && o.every((v, i) => v === i)) o = [...o].reverse();
    return o;
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const move = (position, direction) => {
    if (submitted) return;
    setOrder((cur) => {
      const target = position + direction;
      if (target < 0 || target >= cur.length) return cur;
      const next = [...cur];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
  };
  const submit = () => {
    const ok = checkSequenceOrder(order);
    setSubmitted(true);
    setScore({ correct: ok ? 1 : 0, total: 1 });
    onResult(item.id, ok ? 'correct' : 'incorrect');
  };
  return (
    <SequenceView
      session={[item]}
      index={0}
      score={score}
      categories={categories}
      workingOrder={order}
      onMove={move}
      submitted={submitted}
      onSubmit={submit}
      onNext={() => onDone(score.correct ? 100 : 0)}
      onRestart={() => {}}
      flashcardsData={flashcardsData}
    />
  );
}

function PathCompareStep({ item, categories, flashcardsData, onResult, onDone }) {
  const prepared = useMemo(() => {
    const swap = Math.random() < 0.5;
    const better = item.better === 'A' ? 0 : 1;
    return { ...item, options: swap ? [item.optionB, item.optionA] : [item.optionA, item.optionB], betterIdx: swap ? 1 - better : better };
  }, [item.id]);
  const [choice, setChoice] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const choose = (i) => {
    if (choice !== null) return;
    const ok = i === prepared.betterIdx;
    setChoice(i);
    setScore({ correct: ok ? 1 : 0, total: 1 });
    onResult(item.id, ok ? 'correct' : 'incorrect');
  };
  return (
    <CompareView
      session={[prepared]}
      index={0}
      score={score}
      categories={categories}
      choice={choice}
      onChoose={choose}
      onNext={() => onDone(score.correct ? 100 : 0)}
      onRestart={() => {}}
      flashcardsData={flashcardsData}
    />
  );
}

function PathApplyStep({ unit, categories, flashcardsData, onDone }) {
  return (
    <div>
      <LessonApplySections lesson={unit.lesson} categories={categories} lessonCatKeys={unit.cats} flashcardsData={flashcardsData} />
      <button
        onClick={() => onDone(null)}
        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        Got it
      </button>
    </div>
  );
}

// A burst of confetti behind the celebration card. Positions, colours and
// timings come from the index so the burst is the same every time.
function Confetti({ count = 18 }) {
  const colors = [COLOR.primary, COLOR.gold, COLOR.success, COLOR.red, COLOR.teal, '#38BDF8'];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37 + 11) % 97}%`, background: colors[i % colors.length],
            animationDelay: `${((i * 13) % 9) * 0.09}s`, animationDuration: `${1.8 + ((i * 7) % 8) * 0.1}s`,
            width: i % 3 === 0 ? '7px' : '9px', height: i % 3 === 1 ? '9px' : '14px',
          }}
        />
      ))}
    </div>
  );
}

function PathStepComplete({ unit, step, pct, unitComplete, testedOut, next, onNext, onBack, nextLabel, backLabel }) {
  const { streak, goalCount, goalTarget } = React.useContext(ProgressSummaryContext);
  const hasScore = pct !== null && pct !== undefined;
  const stars = !hasScore ? 0 : pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  const eyebrow = unitComplete ? 'Unit conquered!' : testedOut ? 'Skipped ahead!'
    : !hasScore ? 'Nice work!' : pct >= 90 ? 'Perfect!' : pct >= 70 ? 'Great work!' : 'Keep going!';
  const confetti = unitComplete ? 34 : testedOut ? 22 : stars === 3 ? 18 : 0;
  useEffect(() => {
    playCelebrationSound(unitComplete ? 'unit' : testedOut || stars === 3 ? 'great' : 'ok');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const goalMet = goalTarget > 0 && goalCount >= goalTarget;
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalCount / goalTarget) * 100)) : 0;
  return (
    <div style={{ position: 'relative', boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '20px', padding: '30px 22px 22px', textAlign: 'center', overflow: 'hidden' }}>
      {confetti > 0 && <Confetti count={confetti} />}
      <div style={{ position: 'relative' }}>
        <div className="pop-in" style={{ width: '84px', height: '84px', borderRadius: '50%', background: unitComplete ? COLOR.gold : COLOR.success, color: COLOR.onAccent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 0 rgba(0,0,0,0.3)' }}>
          {unitComplete ? <TabIcon kind="exam" size={40} /> : <PathIcon kind="check" size={40} />}
        </div>
        <div className="rise-in" style={{ animationDelay: '0.15s', fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: unitComplete ? COLOR.gold : COLOR.success, marginTop: '16px' }}>{eyebrow}</div>
        <div className="itil-display rise-in" style={{ animationDelay: '0.2s', fontSize: '24px', marginTop: '2px' }}>
          {testedOut ? 'Tested out' : unitComplete ? 'Unit complete' : 'Step complete'}
        </div>
        <div className="rise-in" style={{ animationDelay: '0.25s', fontSize: '14px', color: COLOR.muted, marginTop: '6px', lineHeight: 1.5 }}>
          {testedOut ? `You tested out of ${unit.title} at ${pct}%.` : unitComplete ? `You've finished every step of ${unit.title}.` : step.label}
          {hasScore && !unitComplete && !testedOut ? ` · ${pct}%` : ''}
        </div>
        {stars > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }} aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map((i) => (
              <svg key={i} className="pop-in" style={{ animationDelay: `${0.35 + i * 0.18}s` }} width="38" height="38" viewBox="0 0 24 24" fill={i < stars ? COLOR.gold : 'none'} stroke={i < stars ? COLOR.gold : COLOR.border} strokeWidth="2" strokeLinejoin="round">
                <polygon points="12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9" />
              </svg>
            ))}
          </div>
        )}
        <div className="rise-in" style={{ animationDelay: '0.5s', display: 'flex', gap: '8px', marginTop: '18px', textAlign: 'left' }}>
          <div style={{ flex: 1, minWidth: 0, border: `2px solid ${COLOR.border}`, borderRadius: '14px', padding: '8px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FF9A3D' }}>Streak</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>🔥 {streak} day{streak === 1 ? '' : 's'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, border: `2px solid ${goalMet ? COLOR.success : COLOR.border}`, borderRadius: '14px', padding: '8px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: goalMet ? COLOR.success : COLOR.primary }}>{goalMet ? 'Goal met' : 'Daily goal'}</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{goalMet ? '✓ ' : ''}{goalCount} / {goalTarget}</div>
            <div style={{ height: '5px', borderRadius: '3px', background: COLOR.surfaceRaised, marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${goalPct}%`, background: goalMet ? COLOR.success : COLOR.primary }} />
            </div>
          </div>
        </div>
        {next ? (
          <button
            onClick={onNext}
            className="btn-3d"
            style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '14px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '15px', fontWeight: 800 }}
          >
            {nextLabel || (next.unit.index !== unit.index ? `Next unit: ${next.unit.title}` : `Next: ${next.step.label}`)}
          </button>
        ) : (
          <div style={{ marginTop: '18px', fontSize: '14px', fontWeight: 800, color: COLOR.success }}>That's the whole path.</div>
        )}
        <button
          onClick={onBack}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '14px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '14px', fontWeight: 700 }}
        >
          {backLabel || 'Back to the path'}
        </button>
      </div>
    </div>
  );
}

/* ---- the path itself ---- */

// Builds what a step needs to run: the cards/questions/game item for it,
// drawn from the cert `trackKey`. Pure apart from `api.markSeen`.
function buildStepPayload(trackKey, units, results, seenLog, api, unit, step) {
  const mod = DATA[trackKey];
  const flashById = new Map(mod.flashcards.map((f) => [f.id, f]));
  const questionById = new Map(mod.questions.map((q) => [q.id, q]));
  const poolQuestions = (ids) => ids.map((id) => questionById.get(id)).filter(Boolean);
  const preparedQuestions = (pool, count) => {
    const picked = pickRotated(pool, Math.min(count, pool.length), seenLog);
    const prepared = picked.map(prepareQuestion);
    api.markSeen(prepared.map((q) => q.id));
    return prepared;
  };
  switch (step.kind) {
    case 'cards':
    case 'cards2':
      return { cards: step.cardIds.map((id) => flashById.get(id)).filter(Boolean) };
    case 'quiz':
    case 'quiz2':
    case 'testout':
    case 'review':
      return { questions: preparedQuestions(poolQuestions(step.poolIds), step.count) };
    case 'checkpoint': {
      const earlier = units.slice(0, unit.index).flatMap((u) => u.poolIds);
      const weak = poolQuestions(earlier.filter((id) => results[id] !== 'correct'));
      const review = pickRotated(weak, Math.min(PATH_CHECKPOINT_REVIEW, weak.length), seenLog);
      const own = pickRotated(poolQuestions(step.poolIds), Math.max(1, step.count - review.length), seenLog);
      const prepared = shuffleArray([...review, ...own]).map(prepareQuestion);
      api.markSeen(prepared.map((q) => q.id));
      return { questions: prepared, reviewCount: review.length };
    }
    case 'deep':
      return {
        cards: step.cardIds.map((id) => flashById.get(id)).filter(Boolean),
        questions: preparedQuestions(poolQuestions(step.poolIds), step.count),
      };
    case 'bridge': {
      const bridge = BRIDGES.find((b) => b.id === step.bridgeId);
      return { bridge, questions: bridge ? bridge.questions.map(prepareQuestion) : [] };
    }
    case 'game': {
      const g = step.game;
      if (g.kind === 'match') return { kind: 'match', cards: unit.lesson.vocabIds.map((id) => flashById.get(id)).filter(Boolean) };
      const source = g.kind === 'madlib' ? mod.madlibs : g.kind === 'sequence' ? mod.sequences : mod.compare;
      return { kind: g.kind, item: (source || []).find((x) => x.id === g.id) };
    }
    default:
      return {};
  }
}

// Runs one path step for any cert. Used by a cert's own Path tab and by the
// Home study path, so a step behaves identically in both. `onDone(pct)` is
// called when the step finishes and the caller decides what that means
// (recording it, showing the completion screen); `onExit` backs out.
function PathStepRunner({ trackKey, units, unit, step, results, seenLog, categories, speech, api, onDone, onExit, exitLabel, certLabel, planKeys, onOpenCert, onAddToPlan }) {
  const mod = DATA[trackKey];
  const [run, setRun] = useState(() => ({ payload: buildStepPayload(trackKey, units, results, seenLog, api, unit, step), nonce: 0 }));
  const { payload, nonce } = run;
  const retry = () => setRun((r) => ({ payload: buildStepPayload(trackKey, units, results, seenLog, api, unit, step), nonce: r.nonce + 1 }));
  const runnerKey = step.id + '-' + nonce;
  const common = { categories, flashcardsData: mod.flashcards };
  let runner = null;
  if (step.kind === 'read') {
    runner = <PathReadStep key={runnerKey} unit={unit} flashcardsData={mod.flashcards} speech={speech} onDone={onDone} />;
  } else if (step.kind === 'cards' || step.kind === 'cards2') {
    runner = <PathCardsStep key={runnerKey} cards={payload.cards} speech={speech} onRate={api.rateCard} onDone={onDone} {...common} />;
  } else if (step.kind === 'quiz' || step.kind === 'quiz2' || step.kind === 'checkpoint' || step.kind === 'testout' || step.kind === 'review') {
    runner = (
      <PathQuizStep
        key={runnerKey}
        questions={payload.questions}
        passPct={step.kind === 'testout' ? PATH_TESTOUT_PCT : step.kind === 'review' ? 0 : PATH_PASS_PCT}
        label={step.label}
        onAnswer={(id, ok) => api.recordResult(id, ok ? 'correct' : 'incorrect')}
        onFinished={api.finishQuiz}
        onPass={onDone}
        onRetry={retry}
        {...common}
      />
    );
  } else if (step.kind === 'deep') {
    runner = <PathDeepStep key={runnerKey} cards={payload.cards} questions={payload.questions} api={api} onRetry={retry} onDone={onDone} {...common} />;
  } else if (step.kind === 'bridge') {
    runner = <PathBridgeStep key={runnerKey} bridge={payload.bridge} questions={payload.questions} planKeys={planKeys || []} api={api} onRetry={retry} onDone={onDone} onOpenCert={onOpenCert} onAddToPlan={onAddToPlan} />;
  } else if (step.kind === 'apply') {
    runner = <PathApplyStep key={runnerKey} unit={unit} categories={categories} flashcardsData={mod.flashcards} onDone={onDone} />;
  } else if (step.kind === 'game') {
    if (payload.kind === 'match') {
      runner = (
        <MatchGame
          key={runnerKey}
          flashcards={payload.cards}
          roundSize={Math.min(5, payload.cards.length)}
          onRoundComplete={api.onMatchRound}
          onContinue={() => onDone(null)}
          continueLabel="Continue ›"
        />
      );
    } else if (payload.kind === 'madlib') {
      runner = <PathMadlibStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={onDone} {...common} />;
    } else if (payload.kind === 'sequence') {
      runner = <PathSequenceStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={onDone} {...common} />;
    } else {
      runner = <PathCompareStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={onDone} {...common} />;
    }
  }
  return (
    <div>
      <button onClick={onExit} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '10px', padding: 0 }}>
        {exitLabel}
      </button>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {step.kind === 'review' ? 'Spaced review' : step.kind === 'bridge' ? 'Optional · Cross-cert bridge' : `${certLabel ? certLabel + ' · ' : ''}Unit ${unit.index + 1} · ${unit.title}${step.optional ? ' · Optional' : ''}`}
        </div>
        <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>{step.label}</div>
      </div>
      {runner}
    </div>
  );
}

// Horizontal wiggle of the trail, in px from centre, cycling per node.
const PATH_WAVE = [0, 44, 68, 44, 0, -44, -68, -44];

function PathStars({ pct }) {
  const n = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  return (
    <span aria-label={`${n} of 3 stars`} style={{ display: 'inline-flex', gap: '2px', marginTop: '6px' }}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < n ? COLOR.gold : 'none'} stroke={i < n ? COLOR.gold : COLOR.border} strokeWidth="2.2" strokeLinejoin="round">
          <polygon points="12 2 15 9 22 9.5 16.5 14.5 18 22 12 18 6 22 7.5 14.5 2 9.5 9 9" />
        </svg>
      ))}
    </span>
  );
}

// One stop on the trail: a big round "3D" node with its label. The whole
// thing is a single button; the face sinks when pressed.
function PathTrailNode({ step, index, done, isNext, entry, onOpen }) {
  const checkpoint = step.kind === 'checkpoint';
  const size = isNext ? 78 : 68;
  const bg = done ? COLOR.success : isNext ? COLOR.primary : checkpoint ? COLOR.gold : COLOR.surfaceRaised;
  const fg = done || isNext || checkpoint ? COLOR.onAccent : COLOR.muted;
  const starKinds = ['quiz', 'quiz2', 'game', 'checkpoint'];
  const showStars = done && entry && typeof entry.pct === 'number' && starKinds.includes(step.kind);
  return (
    <button
      onClick={onOpen}
      className="btn-flat trail-node"
      aria-label={`${step.label}, ${done ? 'completed' : 'not completed'}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', color: COLOR.text, padding: 0,
        transform: `translateX(${PATH_WAVE[index % PATH_WAVE.length]}px)`, marginBottom: '22px', width: '170px',
      }}
    >
      {isNext && (
        <span className="bob" style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', color: COLOR.primary, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '10px', padding: '3px 10px', marginBottom: '8px', position: 'relative', animation: 'bob 1.4s ease-in-out infinite' }}>
          START
        </span>
      )}
      <span
        className={`node-face${isNext ? ' pulse' : ''}`}
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: bg, color: fg, border: !done && !isNext && !checkpoint ? `2px solid ${COLOR.border}` : 'none',
          animation: isNext ? 'pulseRing 1.6s ease-out infinite' : 'none',
        }}
      >
        <PathIcon kind={done ? 'check' : step.kind} size={isNext ? 34 : 30} />
      </span>
      {showStars && <PathStars pct={entry.pct} />}
      <span style={{ marginTop: showStars ? '4px' : '10px', fontSize: '13px', fontWeight: isNext ? 800 : 700, color: done ? COLOR.muted : COLOR.text, textAlign: 'center', lineHeight: 1.25 }}>{step.label}</span>
      {isNext && step.meta && <span style={{ fontSize: '12px', color: COLOR.muted, marginTop: '1px' }}>{step.meta}</span>}
    </button>
  );
}

function PathView({ track, trackKey, doneMap, unlockedMap, pathLocking, results, seenLog, categories, speech, api, toughCount, autoStart, onAutoStarted }) {
  const units = useMemo(() => buildPathUnits(trackKey), [trackKey]);
  const [session, setSession] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    const first = pathNextStep(units, doneMap);
    return { [first ? first.unit.index : 0]: true };
  });

  // Home's "Continue where you left off" asks for the next unfinished step
  // to open directly instead of the map. One-shot: the flag is cleared as
  // soon as it's consumed so later visits to the Path tab show the map.
  useEffect(() => {
    if (!autoStart) return;
    const upNext = units.length ? pathNextStep(units, doneMap) : null;
    if (upNext) startStep(upNext.unit, upNext.step);
    if (onAutoStarted) onAutoStarted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!units.length) {
    return (
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>No guided path yet</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
          {track.label} doesn't have lessons to build a path from. Use Practice for quizzes and games, or Reference for the study notes.
        </div>
      </div>
    );
  }

  const overall = pathOverallProgress(units, doneMap);
  const next = pathNextStep(units, doneMap);
  const reviewIds = pathReviewQuestionIds(units, doneMap, results, seenLog);
  const startReview = () => startStep(null, {
    id: 'review', kind: 'review', label: 'Review weak spots', poolIds: reviewIds, count: PATH_REVIEW_QUESTIONS,
  });

  const startStep = (unit, step) => {
    setCompletion(null);
    setSession({ unit, step, nonce: Date.now() });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const finishStep = (pct) => {
    const { unit, step } = session;
    if (step.kind === 'review') {
      // Review is practice, not progress: it never completes a step.
      setSession(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const testedOut = step.kind === 'testout';
    const stepIds = testedOut ? unit.steps.map((s) => s.id) : [step.id];
    if (testedOut) api.completeSteps(stepIds, pct, 'testout');
    else api.completeStep(step.id, pct);
    setCompletion({ unit, step, pct, testedOut });
    setSession(null);
    // Finishing a unit folds it away and opens the next one, so the map the
    // learner returns to is already pointing at what to do next.
    const doneNow = { ...doneMap };
    stepIds.forEach((id) => { doneNow[id] = true; });
    const unitComplete = pathUnitProgress(unit, doneNow).complete;
    const nextNow = pathNextStep(units, doneNow);
    setExpanded((e) => {
      const copy = { ...e, [unit.index]: !unitComplete };
      if (nextNow) copy[nextNow.unit.index] = true;
      return copy;
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const backToMap = () => { setSession(null); setCompletion(null); };

  /* ---- a step is running ---- */
  if (session) {
    return (
      <PathStepRunner
        key={session.step.id + '-' + session.nonce}
        trackKey={trackKey}
        units={units}
        unit={session.unit}
        step={session.step}
        results={results}
        seenLog={seenLog}
        categories={categories}
        speech={speech}
        api={api}
        onDone={finishStep}
        onExit={backToMap}
        exitLabel="‹ Back to the path"
      />
    );
  }

  /* ---- a step just finished ---- */
  if (completion) {
    const doneNow = { ...doneMap, [completion.step.id]: true };
    if (completion.testedOut) completion.unit.steps.forEach((st) => { doneNow[st.id] = true; });
    const unitComplete = pathUnitProgress(completion.unit, doneNow).complete;
    const nextNow = pathNextStep(units, doneNow);
    return (
      <PathStepComplete
        unit={completion.unit}
        step={completion.step}
        pct={completion.pct}
        unitComplete={unitComplete}
        testedOut={!!completion.testedOut}
        next={nextNow}
        onNext={() => startStep(nextNow.unit, nextNow.step)}
        onBack={backToMap}
      />
    );
  }

  /* ---- the map ---- */
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
        <div className="flex justify-between items-baseline" style={{ marginBottom: '8px' }}>
          <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600 }}>{track.label} path</div>
          <div style={{ fontSize: '12px', color: COLOR.muted }}>{overall.unitsComplete} of {overall.unitCount} units</div>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${overall.pct}%`, background: COLOR.success, borderRadius: '3px' }} />
        </div>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '12px' }}>
          {overall.done} of {overall.total} steps done
        </div>
        {next ? (
          <button
            onClick={() => startStep(next.unit, next.step)}
            className="btn-3d"
            style={{ width: '100%', padding: '13px', borderRadius: '14px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {overall.done === 0 ? 'Start' : 'Continue'} · Unit {next.unit.index + 1}
              </span>
              <span style={{ display: 'block' }}>{next.step.label}</span>
            </span>
            <span style={{ fontSize: '18px' }}>›</span>
          </button>
        ) : (
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.success, textAlign: 'center' }}>
            Path complete — open any step below to review it.
          </div>
        )}
      </div>

      {(reviewIds.length > 0 || toughCount > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: reviewIds.length > 0 && toughCount > 0 ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: '8px', marginBottom: '16px' }}>
          {reviewIds.length > 0 && (
            <button
              onClick={startReview}
              className="btn-flat"
              style={{ padding: '10px 12px', borderRadius: '14px', textAlign: 'left', border: `2px solid ${COLOR.red}`, background: 'rgba(181,87,74,0.1)', color: COLOR.red, minWidth: 0 }}
            >
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 800 }}>Review weak spots</span>
              <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, opacity: 0.9 }}>
                {reviewIds.length} question{reviewIds.length === 1 ? '' : 's'} missed
              </span>
            </button>
          )}
          {toughCount > 0 && (
            <button
              onClick={api.openToughTerms}
              className="btn-flat"
              style={{ padding: '10px 12px', borderRadius: '14px', textAlign: 'left', border: `2px solid ${COLOR.gold}`, background: 'rgba(200,160,60,0.1)', color: COLOR.gold, minWidth: 0 }}
            >
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 800 }}>Tough terms</span>
              <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, opacity: 0.9 }}>
                {toughCount} flashcard{toughCount === 1 ? '' : 's'} to revisit
              </span>
            </button>
          )}
        </div>
      )}

      {units.map((unit) => {
        const prog = pathUnitProgress(unit, doneMap);
        const open = !!expanded[unit.index];
        const locked = isPathUnitLocked(units, unit, doneMap, unlockedMap, pathLocking);
        const blocker = locked ? units.find((u) => u.index < unit.index && !pathUnitProgress(u, doneMap).complete) : null;
        return (
          <div key={unit.id} style={{ marginBottom: '14px' }}>
            <div style={{ position: 'sticky', top: `${APP_HEADER_HEIGHT}px`, zIndex: 20, background: COLOR.bg, padding: '10px 0 8px' }}>
            <button
              onClick={() => setExpanded((e) => ({ ...e, [unit.index]: !e[unit.index] }))}
              className="btn-3d"
              aria-expanded={open}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'stretch',
                borderRadius: '18px', padding: 0, overflow: 'hidden',
                background: locked ? COLOR.surfaceRaised : prog.complete ? COLOR.success : COLOR.primary, color: locked ? COLOR.muted : COLOR.onAccent,
                border: locked ? `2px solid ${COLOR.border}` : 'none',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, padding: '12px 16px' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.85 }}>
                  Unit {unit.index + 1} · {locked ? 'Locked' : `${prog.done}/${prog.total}`}
                </span>
                <span style={{ display: 'block', fontSize: '18px', fontWeight: 800, lineHeight: 1.2 }}>{unit.title}</span>
              </span>
              <span style={{ width: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '2px solid rgba(0,0,0,0.18)', fontSize: '14px' }}>
                {locked ? <PathIcon kind="lock" size={20} /> : open ? '▴' : '▾'}
              </span>
            </button>
            </div>
            {open && locked ? (
              <div style={{ padding: '14px 4px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '13.5px', color: COLOR.muted, lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>
                  Finish Unit {blocker ? blocker.index + 1 : unit.index} to open this one, or jump ahead if you already know the earlier material.
                </div>
                <button
                  onClick={() => api.unlockUnit(unit.id)}
                  className="btn-flat"
                  style={{ marginTop: '12px', padding: '10px 18px', borderRadius: '14px', border: `2px solid ${COLOR.primary}`, background: 'transparent', color: COLOR.primary, fontSize: '13px', fontWeight: 800 }}
                >
                  Unlock anyway
                </button>
              </div>
            ) : open ? (
              <div style={{ padding: '20px 0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: COLOR.muted, textAlign: 'center', maxWidth: '300px', lineHeight: 1.45, marginBottom: '22px' }}>{unit.summary}</div>
                {unit.steps.map((step, i) => (
                  <PathTrailNode
                    key={step.id}
                    step={step}
                    index={i}
                    done={pathStepIsDone(doneMap, step.id)}
                    isNext={!!next && next.step.id === step.id}
                    entry={doneMap[step.id]}
                    onOpen={() => startStep(unit, step)}
                  />
                ))}
                {!prog.complete && (
                  <button
                    onClick={() => startStep(unit, pathTestOutStep(unit))}
                    className="btn-flat"
                    style={{ padding: '10px 18px', borderRadius: '14px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted, fontSize: '13px', fontWeight: 800 }}
                  >
                    Already know this? Test out ›
                  </button>
                )}
              </div>
            ) : (
              unit.summary && <div style={{ fontSize: '12.5px', color: COLOR.muted, padding: '10px 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.summary}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
