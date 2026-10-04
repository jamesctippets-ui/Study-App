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
    case 'check':
      return <svg {...common} strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>;
    default:
      return null;
  }
}

function PathRing({ done, total, size = 40 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLOR.border} strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={complete ? COLOR.success : COLOR.primary} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill={complete ? COLOR.success : COLOR.text}>
        {done}/{total}
      </text>
    </svg>
  );
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
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
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
            style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 600 }}
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

function PathQuizStep({ questions, passPct, label, categories, flashcardsData, onAnswer, onFinished, onPass, onRetry }) {
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
              {reviewOnly ? 'Back to the path ›' : 'Continue ›'}
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

function PathApplyStep({ unit, categories, onDone }) {
  return (
    <div>
      <LessonApplySections lesson={unit.lesson} categories={categories} lessonCatKeys={unit.cats} />
      <button
        onClick={() => onDone(null)}
        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        Got it
      </button>
    </div>
  );
}

function PathStepComplete({ unit, step, pct, unitComplete, testedOut, next, onNext, onBack }) {
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '26px 22px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: COLOR.success, color: COLOR.onAccent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <PathIcon kind="check" size={28} />
      </div>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600 }}>
        {testedOut ? 'Tested out' : unitComplete ? 'Unit complete' : 'Step complete'}
      </div>
      <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.5 }}>
        {testedOut ? `You tested out of ${unit.title} at ${pct}%.` : unitComplete ? `You've finished every step of ${unit.title}.` : step.label}
        {pct !== null && pct !== undefined && !unitComplete && !testedOut ? ` · ${pct}%` : ''}
      </div>
      {next ? (
        <button
          onClick={onNext}
          style={{ width: '100%', marginTop: '18px', padding: '13px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
        >
          {next.unit.index !== unit.index ? `Next unit: ${next.unit.title}` : `Next: ${next.step.label}`}
        </button>
      ) : (
        <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: 600, color: COLOR.success }}>That's the whole path.</div>
      )}
      <button
        onClick={onBack}
        style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 600 }}
      >
        Back to the path
      </button>
    </div>
  );
}

/* ---- the path itself ---- */

const PATH_NODE_OFFSETS = [0, 24, 40, 24];

function PathView({ track, trackKey, doneMap, results, seenLog, categories, speech, api, toughCount, autoStart, onAutoStarted }) {
  const mod = DATA[trackKey];
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
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>No guided path yet</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
          {track.label} doesn't have lessons to build a path from. Use Practice for quizzes and games, or Reference for the study notes.
        </div>
      </div>
    );
  }

  const flashById = new Map(mod.flashcards.map((f) => [f.id, f]));
  const questionById = new Map(mod.questions.map((q) => [q.id, q]));
  const overall = pathOverallProgress(units, doneMap);
  const next = pathNextStep(units, doneMap);
  const reviewIds = pathReviewQuestionIds(units, doneMap, results, seenLog);
  const startReview = () => startStep(null, {
    id: 'review', kind: 'review', label: 'Review weak spots', poolIds: reviewIds, count: PATH_REVIEW_QUESTIONS,
  });

  const preparedQuestions = (pool, count) => {
    const picked = pickRotated(pool, Math.min(count, pool.length), seenLog);
    const prepared = picked.map(prepareQuestion);
    api.markSeen(prepared.map((q) => q.id));
    return prepared;
  };

  const buildPayload = (unit, step) => {
    switch (step.kind) {
      case 'cards':
      case 'cards2':
        return { cards: step.cardIds.map((id) => flashById.get(id)).filter(Boolean) };
      case 'quiz':
      case 'quiz2':
        return { questions: preparedQuestions(step.poolIds.map((id) => questionById.get(id)).filter(Boolean), step.count) };
      case 'testout':
        return { questions: preparedQuestions(step.poolIds.map((id) => questionById.get(id)).filter(Boolean), step.count) };
      case 'review':
        return { questions: preparedQuestions(step.poolIds.map((id) => questionById.get(id)).filter(Boolean), step.count) };
      case 'checkpoint': {
        const earlier = units.slice(0, unit.index).flatMap((u) => u.poolIds);
        const weak = earlier.filter((id) => results[id] !== 'correct').map((id) => questionById.get(id)).filter(Boolean);
        const review = pickRotated(weak, Math.min(PATH_CHECKPOINT_REVIEW, weak.length), seenLog);
        const own = pickRotated(step.poolIds.map((id) => questionById.get(id)).filter(Boolean), Math.max(1, step.count - review.length), seenLog);
        const prepared = shuffleArray([...review, ...own]).map(prepareQuestion);
        api.markSeen(prepared.map((q) => q.id));
        return { questions: prepared, reviewCount: review.length };
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
  };

  const startStep = (unit, step) => {
    const payload = buildPayload(unit, step);
    setCompletion(null);
    setSession({ unit, step, payload, nonce: Date.now() });
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
    const { unit, step, payload } = session;
    const runnerKey = step.id + '-' + session.nonce;
    const common = { categories, flashcardsData: mod.flashcards };
    let runner = null;
    if (step.kind === 'read') {
      runner = <PathReadStep key={runnerKey} unit={unit} flashcardsData={mod.flashcards} speech={speech} onDone={finishStep} />;
    } else if (step.kind === 'cards' || step.kind === 'cards2') {
      runner = <PathCardsStep key={runnerKey} cards={payload.cards} speech={speech} onRate={api.rateCard} onDone={finishStep} {...common} />;
    } else if (step.kind === 'quiz' || step.kind === 'quiz2' || step.kind === 'checkpoint' || step.kind === 'testout' || step.kind === 'review') {
      runner = (
        <PathQuizStep
          key={runnerKey}
          questions={payload.questions}
          passPct={step.kind === 'testout' ? PATH_TESTOUT_PCT : step.kind === 'review' ? 0 : PATH_PASS_PCT}
          label={step.label}
          onAnswer={(id, ok) => api.recordResult(id, ok ? 'correct' : 'incorrect')}
          onFinished={api.finishQuiz}
          onPass={finishStep}
          onRetry={() => startStep(unit, step)}
          {...common}
        />
      );
    } else if (step.kind === 'apply') {
      runner = <PathApplyStep key={runnerKey} unit={unit} categories={categories} onDone={finishStep} />;
    } else if (step.kind === 'game') {
      if (payload.kind === 'match') {
        runner = (
          <MatchGame
            key={runnerKey}
            flashcards={payload.cards}
            roundSize={Math.min(5, payload.cards.length)}
            onRoundComplete={api.onMatchRound}
            onContinue={() => finishStep(null)}
            continueLabel="Continue ›"
          />
        );
      } else if (payload.kind === 'madlib') {
        runner = <PathMadlibStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={finishStep} {...common} />;
      } else if (payload.kind === 'sequence') {
        runner = <PathSequenceStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={finishStep} {...common} />;
      } else {
        runner = <PathCompareStep key={runnerKey} item={payload.item} onResult={api.recordResult} onDone={finishStep} {...common} />;
      }
    }
    return (
      <div>
        <button onClick={backToMap} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '10px', padding: 0 }}>
          ‹ Back to the path
        </button>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            {step.kind === 'review' ? 'Spaced review' : `Unit ${unit.index + 1} · ${unit.title}`}
          </div>
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>{step.label}</div>
        </div>
        {runner}
      </div>
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
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
        <div className="flex justify-between items-baseline" style={{ marginBottom: '8px' }}>
          <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600 }}>{track.label} path</div>
          <div style={{ fontSize: '12px', color: COLOR.muted }}>{overall.unitsComplete} of {overall.unitCount} units</div>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${overall.pct}%`, background: COLOR.success, borderRadius: '3px' }} />
        </div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '12px' }}>
          {overall.done} of {overall.total} steps done · reading, flashcards, quizzes, and games in a mixed order
        </div>
        {next ? (
          <button
            onClick={() => startStep(next.unit, next.step)}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

      {reviewIds.length > 0 && (
        <button
          onClick={startReview}
          style={{
            width: '100%', marginBottom: '14px', padding: '11px 14px', borderRadius: '12px', textAlign: 'left',
            border: `1px solid ${COLOR.red}`, background: 'rgba(181,87,74,0.1)', color: COLOR.red, fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
          }}
        >
          <span>
            Review weak spots
            <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 400, opacity: 0.85 }}>
              {reviewIds.length} question{reviewIds.length === 1 ? '' : 's'} you missed in units you've started
            </span>
          </span>
          <span style={{ fontSize: '16px' }}>›</span>
        </button>
      )}

      {toughCount > 0 && (
        <button
          onClick={api.openToughTerms}
          style={{
            width: '100%', marginBottom: '14px', padding: '11px 14px', borderRadius: '12px', textAlign: 'left',
            border: `1px solid ${COLOR.gold}`, background: 'rgba(200,160,60,0.1)', color: COLOR.gold, fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
          }}
        >
          <span>
            Tough terms
            <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 400, opacity: 0.85 }}>
              {toughCount} flashcard{toughCount === 1 ? '' : 's'} you rated OK or lower
            </span>
          </span>
          <span style={{ fontSize: '16px' }}>›</span>
        </button>
      )}

      {units.map((unit) => {
        const prog = pathUnitProgress(unit, doneMap);
        const open = !!expanded[unit.index];
        return (
          <div key={unit.id} style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', marginBottom: '12px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpanded((e) => ({ ...e, [unit.index]: !e[unit.index] }))}
              className="btn-flat"
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: 'transparent', color: COLOR.text, display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <PathRing done={prog.done} total={prog.total} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '10px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Unit {unit.index + 1}</span>
                <span style={{ display: 'block', fontSize: '14.5px', fontWeight: 600 }}>{unit.title}</span>
                {!open && <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, marginTop: '1px' }}>{unit.summary}</span>}
              </span>
              <span style={{ fontSize: '12px', color: COLOR.muted }}>{open ? '▴' : '▾'}</span>
            </button>
            {open && (
              <div style={{ padding: '2px 14px 14px', borderTop: `1px solid ${COLOR.border}` }}>
                <div style={{ fontSize: '12px', color: COLOR.muted, margin: '10px 0 6px', lineHeight: 1.45 }}>{unit.summary}</div>
                {unit.steps.map((step, i) => {
                  const done = pathStepIsDone(doneMap, step.id);
                  const isNext = !!next && next.step.id === step.id;
                  const accent = step.kind === 'checkpoint' ? COLOR.gold : COLOR.primary;
                  const lit = done || isNext;
                  return (
                    <button
                      key={step.id}
                      onClick={() => startStep(unit, step)}
                      className="btn-flat"
                      aria-label={`${step.label}, ${done ? 'completed' : 'not completed'}`}
                      style={{
                        width: `calc(100% - ${PATH_NODE_OFFSETS[i % PATH_NODE_OFFSETS.length]}px)`, marginLeft: `${PATH_NODE_OFFSETS[i % PATH_NODE_OFFSETS.length]}px`,
                        textAlign: 'left', background: 'transparent', color: COLOR.text, padding: '7px 0', display: 'flex', alignItems: 'center', gap: '14px',
                      }}
                    >
                      <span style={{
                        width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? COLOR.success : isNext ? accent : COLOR.surfaceRaised,
                        color: lit ? COLOR.onAccent : COLOR.muted,
                        border: `2px solid ${done ? COLOR.success : (isNext || step.kind === 'checkpoint') ? accent : COLOR.border}`,
                        boxShadow: isNext ? `0 0 0 5px ${accent}33` : 'none',
                      }}>
                        <PathIcon kind={done ? 'check' : step.kind} size={21} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '13.5px', fontWeight: isNext ? 700 : 600, color: done ? COLOR.muted : COLOR.text }}>{step.label}</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted }}>
                          {done ? 'Done' : step.meta}{isNext ? ' · up next' : ''}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {!prog.complete && (
                  <button
                    onClick={() => startStep(unit, pathTestOutStep(unit))}
                    className="btn-flat"
                    style={{ marginTop: '6px', padding: '8px 0', background: 'transparent', color: COLOR.primary, fontSize: '12px', fontWeight: 600, textAlign: 'left' }}
                  >
                    Already know this? Test out of the unit ›
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
