/* ---------------- Home study path (cross-cert) ---------------- */

// The Home tab's own learning path: one trail through every cert in the
// user's plan (see homePathRemaining in 03_helpers.js for how it is ordered).
// Steps run right here on Home using the same runner a cert's Path tab uses,
// and record to that cert's own progress; "Go deeper" opens the cert itself.
// In Extended mode, optional sections (deep dives, bonus games, cross-cert
// bridges) are mixed in and can always be skipped.

const HOME_PATH_UPCOMING_MAX = 40;
const HOME_PATH_MODE_LABELS = { core: 'Just my certs', extended: 'Extended learning' };
const HOME_PATH_ORDER_LABELS = { plan: 'My plan order', smart: 'Exam date + weakest' };
const HOME_PATH_ORDER_HINTS = {
  plan: 'Certs run in the order set in your cert path.',
  smart: 'Blends how close each exam is with how weak the cert still is, and finishes a unit you\'ve started before switching.',
};
const HOME_PATH_MODE_HINTS = {
  core: 'Only the core steps of the certs in your plan.',
  extended: 'Core steps plus optional deep dives, bonus games, and bridges to other certs. Skip any you don\'t want.',
};

// Small colored cert tag shown on every step so the trail stays legible.
function HomePathCertChip({ track }) {
  const accent = trackAccent(track.key);
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, color: accent, border: `1px solid ${accent}`, borderRadius: '999px', padding: '1px 7px', whiteSpace: 'nowrap' }}>
      {track.label}
    </span>
  );
}

function OptionalTag() {
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, color: COLOR.muted, border: `1px dashed ${COLOR.muted}`, borderRadius: '999px', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      Optional
    </span>
  );
}

/* ---- optional step runners ---- */

// Deep dive: the unit's terms with their full detail text, one at a time, then
// a few harder questions. Never gates anything (passPct 0).
function PathDeepStep({ cards, questions, categories, flashcardsData, api, onRetry, onDone }) {
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState(cards.length ? 'read' : 'quiz');
  const card = cards[page];
  if (phase === 'read') {
    const last = page === cards.length - 1;
    return (
      <div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '8px' }}>Term {page + 1} of {cards.length} · the longer explanation behind each one</div>
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '18px 16px' }}>
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{card.front}</div>
          <div style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '10px' }}>{card.back}</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.muted, borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '10px' }}>{card.detail}</div>
        </div>
        <div className="flex gap-2" style={{ marginTop: '14px' }}>
          {page > 0 && (
            <button onClick={() => setPage((n) => n - 1)} style={{ padding: '12px 16px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, color: COLOR.text, fontSize: '14px', fontWeight: 600, background: 'transparent' }}>‹ Back</button>
          )}
          <button
            onClick={() => (last ? setPhase('quiz') : setPage((n) => n + 1))}
            className="flex-1"
            style={{ padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
          >
            {last ? (questions.length ? 'Test it ›' : 'Done') : 'Next ›'}
          </button>
        </div>
      </div>
    );
  }
  if (!questions.length) { onDone(null); return null; }
  return (
    <PathQuizStep
      questions={questions}
      passPct={0}
      label="Deep dive"
      categories={categories}
      flashcardsData={flashcardsData}
      onAnswer={(id, ok) => api.recordResult(id, ok ? 'correct' : 'incorrect')}
      onFinished={api.finishQuiz}
      onPass={onDone}
      onRetry={onRetry}
      continueLabel="Finish ›"
    />
  );
}

// Cross-cert bridge: the shared idea, how each cert frames it (certs in the
// learner's plan are flagged), the cross-cert trap, then a short check.
function PathBridgeStep({ bridge, questions, planKeys, api, onRetry, onDone, onOpenCert, onAddToPlan }) {
  const [phase, setPhase] = useState('read');
  if (!bridge) { onDone(null); return null; }
  if (phase === 'quiz') {
    return (
      <PathQuizStep
        questions={questions}
        passPct={0}
        label="Bridge check"
        categories={[]}
        flashcardsData={[]}
        onAnswer={() => api.bumpGoal()}
        onFinished={api.finishQuiz}
        onPass={onDone}
        onRetry={onRetry}
        continueLabel="Finish ›"
      />
    );
  }
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>{bridge.title}</div>
        <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>{bridge.summary}</div>
      </div>
      <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 2px 6px' }}>How each cert frames it</div>
      {bridge.appearsIn.map((a) => {
        const t = TRACKS.find((x) => x.key === a.track);
        const accent = trackAccent(a.track);
        return (
          <div key={a.track} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${accent}`, borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '3px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: accent }}>{t ? t.label : a.track}</span>
              {planKeys.includes(a.track) && <span style={{ fontSize: '9.5px', color: COLOR.muted }}>in your plan</span>}
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.55 }}>{a.angle}</div>
            {!planKeys.includes(a.track) && (onOpenCert || onAddToPlan) && (
              <div className="flex gap-3" style={{ marginTop: '6px' }}>
                {onAddToPlan && (
                  <button onClick={() => onAddToPlan(a.track)} className="btn-flat" style={{ background: 'transparent', color: accent, fontSize: '11px', fontWeight: 600, padding: 0 }}>
                    Add {t ? t.label : a.track} to my plan
                  </button>
                )}
                {onOpenCert && (
                  <button onClick={() => onOpenCert(a.track)} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, fontSize: '11px', fontWeight: 600, padding: 0 }}>
                    Take a look ›
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${COLOR.gold}`, background: `${COLOR.gold}14` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: COLOR.gold, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Watch out</div>
        <div style={{ fontSize: '12.5px', lineHeight: 1.55 }}>{bridge.watchOut}</div>
      </div>
      <button
        onClick={() => (questions.length ? setPhase('quiz') : onDone(null))}
        style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        {questions.length ? 'Check your understanding ›' : 'Done'}
      </button>
    </div>
  );
}

/* ---- the Home card ---- */

function HomeStudyPath({ tracks, remaining, progress, optionalProgress, mode, onSetMode, order, onSetOrder, certCount, onStart, onTestOut, onSkip, onOpenCert, certPlan, results, seenLog }) {
  const [shown, setShown] = useState(HOME_PATH_UPCOMING);
  const trackByKey = new Map(tracks.map((t) => [t.key, t]));
  const [first, ...rest] = remaining;
  const upcoming = rest.slice(0, shown);
  const later = rest.length - upcoming.length;
  const firstTrack = first ? trackByKey.get(first.trackKey) : null;
  const accent = firstTrack ? trackAccent(firstTrack.key) : COLOR.primary;
  const firstOptional = !!(first && first.step.optional);
  // Offered on the first step of a unit nothing has been done in yet: the
  // Home version of a unit's "test out".
  const canTestOut = !!(first && !first.step.optional && first.unit.steps[0] && first.unit.steps[0].id === first.step.id);

  // The cert behind the up-next step: exam countdown and readiness, which
  // used to sit in a separate "Up next" card further down Home.
  let certLine = null;
  if (firstTrack) {
    const scheduled = certPlan.scheduled[firstTrack.key];
    const days = scheduled ? daysBetween(todayString(), scheduled) : null;
    const readiness = examReadiness(firstTrack.key, results, seenLog);
    const parts = [];
    if (scheduled) parts.push(days < 0 ? `exam ${-days}d ago` : days === 0 ? 'exam today' : days === 1 ? 'exam tomorrow' : `exam in ${days} days`);
    if (readiness.label !== 'Not started') parts.push(`${readiness.score}% readiness · ${readiness.label}`);
    if (parts.length) certLine = { text: parts.join(' · '), color: days !== null && days >= 0 && days <= 7 ? COLOR.gold : COLOR.muted };
  }

  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
      <div className="flex justify-between items-baseline" style={{ marginBottom: '8px' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600 }}>Your study path</div>
        <div style={{ fontSize: '12px', color: COLOR.muted }}>{progress.done} of {progress.total} steps</div>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${progress.pct}%`, background: COLOR.success, borderRadius: '3px' }} />
      </div>
      <div className="flex gap-1" style={{ background: COLOR.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, marginBottom: '6px' }}>
        {HOME_PATH_MODES.map((m) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className="flex-1 btn-flat"
            style={{ padding: '5px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: mode === m ? COLOR.surfaceRaised : 'transparent', color: mode === m ? COLOR.text : COLOR.muted }}
          >
            {HOME_PATH_MODE_LABELS[m]}
          </button>
        ))}
      </div>
      {certCount > 1 && (
        <React.Fragment>
          <div className="flex gap-1" style={{ background: COLOR.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, marginBottom: '6px' }}>
            {HOME_PATH_ORDERS.map((o) => (
              <button
                key={o}
                onClick={() => onSetOrder(o)}
                className="flex-1 btn-flat"
                style={{ padding: '5px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: order === o ? COLOR.surfaceRaised : 'transparent', color: order === o ? COLOR.text : COLOR.muted }}
              >
                {HOME_PATH_ORDER_LABELS[o]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, lineHeight: 1.4, marginBottom: '6px' }}>{HOME_PATH_ORDER_HINTS[order]}</div>
        </React.Fragment>
      )}
      <div style={{ fontSize: '10.5px', color: COLOR.muted, lineHeight: 1.4, marginBottom: '12px' }}>
        {HOME_PATH_MODE_HINTS[mode]}
        {mode === 'extended' && optionalProgress.total > 0 ? ` ${optionalProgress.done} of ${optionalProgress.total} optional sections done.` : ''}
      </div>

      {first && firstTrack ? (
        <React.Fragment>
          <div className="flex gap-2">
            <button
              onClick={() => onStart(first)}
              className="flex-1"
              style={{
                padding: '13px', borderRadius: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minWidth: 0,
                background: firstOptional ? 'transparent' : accent, color: firstOptional ? accent : COLOR.onAccent,
                border: firstOptional ? `1px dashed ${accent}` : '1px solid transparent',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '10px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {firstOptional ? 'Optional' : progress.done === 0 ? 'Start' : 'Continue'} · {firstTrack.label} · Unit {first.unit.index + 1}
                </span>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{first.step.label}</span>
              </span>
              <span style={{ fontSize: '18px' }}>›</span>
            </button>
            {firstOptional && (
              <button
                onClick={() => onSkip(first)}
                style={{ padding: '0 14px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted, fontSize: '12px', fontWeight: 600 }}
              >
                Skip
              </button>
            )}
          </div>
          {firstOptional && first.step.meta && <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '5px' }}>{first.step.meta}</div>}
          {certLine && <div style={{ fontSize: '11px', color: certLine.color, marginTop: '6px' }}>{firstTrack.label}: {certLine.text}</div>}
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenCert(firstTrack.key)}
              className="btn-flat"
              style={{ background: 'transparent', color: accent, fontSize: '11.5px', fontWeight: 600, padding: '8px 2px 0' }}
            >
              Go deeper in {firstTrack.label} ›
            </button>
            {canTestOut && (
              <button
                onClick={() => onTestOut(first)}
                className="btn-flat"
                style={{ background: 'transparent', color: COLOR.muted, fontSize: '11.5px', fontWeight: 600, padding: '8px 2px 0' }}
              >
                Already know this? Test out ›
              </button>
            )}
          </div>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.success, textAlign: 'center', padding: '6px 0' }}>
          Path complete — open any cert below to review it.
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: '10px', borderTop: `1px solid ${COLOR.border}`, paddingTop: '8px' }}>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '2px' }}>Coming up</div>
          {upcoming.map((e) => (
            <div key={e.doneKey + e.step.id} className="flex items-center gap-2" style={{ display: 'flex' }}>
              <button
                onClick={() => onStart(e)}
                className="btn-flat"
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', color: COLOR.text, display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}
              >
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: COLOR.surfaceRaised, color: COLOR.muted, border: e.step.optional ? `1px dashed ${COLOR.muted}` : 'none' }}>
                  <PathIcon kind={e.step.kind === 'deep' || e.step.kind === 'bridge' ? 'read' : e.step.kind} size={15} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{e.step.label}</span>
                    {e.step.optional && <OptionalTag />}
                  </span>
                  <span style={{ display: 'block', fontSize: '10.5px', color: COLOR.muted }}>
                    {e.step.kind === 'bridge' ? e.step.meta : `Unit ${e.unit.index + 1} · ${e.unit.title}`}
                  </span>
                </span>
              </button>
              {trackByKey.get(e.trackKey) && (
                <button
                  onClick={() => onOpenCert(e.trackKey)}
                  className="btn-flat"
                  title={`Go deeper in ${trackByKey.get(e.trackKey).label}`}
                  aria-label={`Open ${trackByKey.get(e.trackKey).label}`}
                  style={{ background: 'transparent', padding: 0, flexShrink: 0 }}
                >
                  <HomePathCertChip track={trackByKey.get(e.trackKey)} />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-3" style={{ paddingTop: '4px' }}>
            {later > 0 && shown < HOME_PATH_UPCOMING_MAX && (
              <button onClick={() => setShown((n) => Math.min(n + 10, HOME_PATH_UPCOMING_MAX))} className="btn-flat" style={{ background: 'transparent', color: COLOR.primary, fontSize: '11px', fontWeight: 600, padding: 0 }}>
                Show more ({later} left)
              </button>
            )}
            {shown > HOME_PATH_UPCOMING && (
              <button onClick={() => setShown(HOME_PATH_UPCOMING)} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, fontSize: '11px', fontWeight: 600, padding: 0 }}>
                Show fewer
              </button>
            )}
            {later > 0 && shown >= HOME_PATH_UPCOMING_MAX && <span style={{ fontSize: '10.5px', color: COLOR.muted }}>+ {later} more after these</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// A step running on Home (and the "step complete" screen after it). Takes
// over the Home tab while active, like a cert's own Path does on its tab.
function HomePathRun({ run, tracks, unitsByTrack, trackKeys, doneByTrack, mode, results, seenLog, speech, makeApi, onStart, onExit, onOpenCert, onAddToPlan }) {
  const [completion, setCompletion] = useState(null);
  const track = tracks.find((t) => t.key === run.trackKey);
  const api = makeApi(run.trackKey);
  const doneApi = makeApi(run.doneKey || run.trackKey);
  const units = unitsByTrack[run.trackKey] || [];

  const finish = (pct) => {
    const { unit, step } = run;
    const doneKey = run.doneKey || run.trackKey;
    const testedOut = step.kind === 'testout';
    const stepIds = testedOut ? unit.steps.map((s) => s.id) : [step.id];
    if (testedOut) doneApi.completeSteps(stepIds, pct, 'testout');
    else doneApi.completeStep(step.id, pct);
    // What's left once this step lands — doneByTrack hasn't re-rendered yet.
    const doneNow = { ...doneByTrack, [doneKey]: { ...(doneByTrack[doneKey] || {}) } };
    stepIds.forEach((id) => { doneNow[doneKey][id] = true; });
    const left = homePathRemaining(unitsByTrack, trackKeys, doneNow, mode);
    setCompletion({
      pct, testedOut, next: left[0] || null,
      unitComplete: !step.optional && pathUnitProgress(unit, doneNow[run.trackKey] || {}).complete,
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (completion) {
    const nextTrack = completion.next ? tracks.find((t) => t.key === completion.next.trackKey) : null;
    const nextOptional = completion.next && completion.next.step.optional;
    return (
      <PathStepComplete
        unit={run.unit}
        step={run.step}
        pct={completion.pct}
        unitComplete={completion.unitComplete}
        testedOut={completion.testedOut}
        next={completion.next}
        nextLabel={completion.next && nextTrack ? `Next${nextOptional ? ' (optional)' : ''}: ${nextTrack.label} · ${completion.next.step.label}` : null}
        onNext={() => onStart(completion.next)}
        onBack={onExit}
        backLabel="Back to Home"
      />
    );
  }

  return (
    <PathStepRunner
      key={run.step.id + '-' + run.nonce}
      trackKey={run.trackKey}
      units={units}
      unit={run.unit}
      step={run.step}
      results={results[run.trackKey] || {}}
      seenLog={seenLog[run.trackKey] || {}}
      categories={DATA[run.trackKey].categories}
      speech={speech}
      api={api}
      onDone={finish}
      onExit={onExit}
      exitLabel="‹ Back to Home"
      certLabel={track ? track.label : null}
      planKeys={trackKeys}
      onOpenCert={onOpenCert}
      onAddToPlan={onAddToPlan}
    />
  );
}

/* ---- cross-cert reviews ---- */

// Home card offering the reviews that span every cert in the plan: questions
// you last missed, flashcards you rated OK or lower, and Mad Libs / Sequence /
// Compare items you got wrong — or, when more than one has something waiting,
// a single mixed round of all of them.
const REVIEW_MIXED = { weak: 6, tough: 8, games: 2, cases: 1 };

function HomeReviewCard({ weakTotal, toughTotal, gamesTotal, casesTotal, onStartReview }) {
  const available = [weakTotal, toughTotal, gamesTotal, casesTotal].filter((n) => n > 0).length;
  if (!available) return null;
  const row = (label, count, sub, kind, accent) => (
    <button
      onClick={() => onStartReview(kind)}
      disabled={!count}
      className="btn-flat"
      style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', borderRadius: '12px', border: `1px solid ${count ? accent : COLOR.border}`, background: 'transparent', color: count ? accent : COLOR.muted, opacity: count ? 1 : 0.6, marginTop: '6px' }}
    >
      <span>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, opacity: 0.85 }}>{count ? sub : 'Nothing to review right now'}</span>
      </span>
      <span style={{ fontSize: '16px' }}>›</span>
    </button>
  );
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px' }}>
      <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600 }}>Review across your certs</div>
      <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px' }}>Mixed from every cert in your plan, so one big backlog can't crowd out the rest.</div>
      {available > 1 && (
        <button
          onClick={() => onStartReview('mixed')}
          style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>
            Review everything due
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>A short round of questions, flashcards, games, and a case study</span>
          </span>
          <span style={{ fontSize: '16px' }}>›</span>
        </button>
      )}
      {row('Weak spots', weakTotal, `${weakTotal} missed question${weakTotal === 1 ? '' : 's'}${weakTotal > CROSS_REVIEW_QUESTIONS ? ` · ${CROSS_REVIEW_QUESTIONS} per round` : ''}`, 'weak', COLOR.red)}
      {row('Tough terms', toughTotal, `${toughTotal} flashcard${toughTotal === 1 ? '' : 's'} rated OK or lower${toughTotal > CROSS_REVIEW_CARDS ? ` · ${CROSS_REVIEW_CARDS} per round` : ''}`, 'tough', COLOR.gold)}
      {casesTotal > 0 && row('Missed case studies', casesTotal, `${casesTotal} case stud${casesTotal === 1 ? 'y' : 'ies'} with a missed question · one per round`, 'cases', COLOR.primary)}
      {gamesTotal > 0 && row('Missed games', gamesTotal, `${gamesTotal} Mad Lib / Sequence / Compare item${gamesTotal === 1 ? '' : 's'} to redo${gamesTotal > CROSS_REVIEW_GAMES ? ` · ${CROSS_REVIEW_GAMES} per round` : ''}`, 'games', COLOR.primary)}
    </div>
  );
}

// Picks one round of one review type across certs and prepares it to run:
// composite ids (items from different certs share ids), namespaced categories
// (so two certs' same-named categories can't be mislabeled), and the
// seen-log updated for the questions shown. `limit` overrides the per-round
// size (the mixed round uses smaller slices).
function buildReviewPhase(phase, trackKeys, results, seenLog, srs, makeApi, limit) {
  const picks = phase === 'weak'
    ? crossCertWeakQuestions(trackKeys, results, seenLog, limit).picks
    : phase === 'tough'
      ? crossCertToughCards(trackKeys, srs, limit).picks
      : phase === 'cases'
        ? crossCertWeakCases(trackKeys, results, limit).picks
        : crossCertWeakGames(trackKeys, results, limit).picks;
  const used = [...new Set(picks.map((p) => p.trackKey))];
  const categories = [];
  const flashcards = [];
  used.forEach((key) => {
    const label = (TRACKS.find((t) => t.key === key) || { label: key }).label;
    DATA[key].categories.forEach((c) => categories.push({ ...c, key: `${key}:${c.key}`, label: `${label} · ${c.label}` }));
    DATA[key].flashcards.forEach((f) => flashcards.push(f));
  });
  const items = picks.map(({ trackKey, item, kind }) => {
    if (phase === 'cases') {
      const cat = `${trackKey}:${item.cs.cat}`;
      return {
        title: item.cs.title, scenario: item.cs.scenario, cat,
        questions: item.missed.map((q) => prepareQuestion({ ...q, id: reviewItemId(trackKey, q.id), cat })),
      };
    }
    const wrapped = { ...item, id: reviewItemId(trackKey, item.id), cat: `${trackKey}:${item.cat}` };
    if (phase === 'weak') return prepareQuestion(wrapped);
    if (phase === 'games') return { kind, item: wrapped };
    return wrapped;
  });
  if (phase === 'weak') {
    used.forEach((key) => makeApi(key).markSeen(picks.filter((p) => p.trackKey === key).map((p) => p.item.id)));
  }
  return { phase, items: phase === 'weak' ? shuffleArray(items) : items, categories, flashcards };
}

function buildReviewRound(kind, trackKeys, results, seenLog, srs, makeApi) {
  const nonce = Date.now() + Math.random();
  const order = kind === 'mixed' ? ['weak', 'tough', 'games', 'cases'] : [kind];
  const phases = order
    .map((ph) => buildReviewPhase(ph, trackKeys, results, seenLog, srs, makeApi, kind === 'mixed' ? REVIEW_MIXED[ph] : undefined))
    .filter((p) => p.items.length);
  return { phases, nonce };
}

const REVIEW_PHASE_LABELS = { weak: 'Weak spots', tough: 'Tough terms', games: 'Missed games', cases: 'Missed case studies' };

// Runs one round of a cross-cert review: one phase for the single reviews,
// up to three in a row for the mixed round. Each answer, rating, or game
// result is recorded back to its own cert.
function HomeReviewRun({ kind, trackKeys, results, seenLog, srs, speech, makeApi, onExit }) {
  const [round, setRound] = useState(() => buildReviewRound(kind, trackKeys, results, seenLog, srs, makeApi));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [gameIndex, setGameIndex] = useState(0);
  const [finished, setFinished] = useState(null);
  const retry = () => { setFinished(null); setPhaseIndex(0); setGameIndex(0); setRound(buildReviewRound(kind, trackKeys, results, seenLog, srs, makeApi)); };
  const apiFor = (composite) => makeApi(splitReviewId(composite).trackKey);
  const phase = round.phases[phaseIndex];
  const advance = (pct) => {
    if (phaseIndex + 1 < round.phases.length) { setPhaseIndex(phaseIndex + 1); setGameIndex(0); window.scrollTo({ top: 0, behavior: 'instant' }); }
    else setFinished({ pct });
  };

  if (!phase) {
    return (
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '22px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>Nothing left to review</div>
        <button onClick={onExit} style={{ marginTop: '10px', padding: '11px 16px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 600 }}>Back to Home</button>
      </div>
    );
  }

  let body;
  if (finished) {
    body = (
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '16px', padding: '22px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Round complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '6px', lineHeight: 1.5 }}>
          Anything you got right is recorded to its own cert, and flashcards rated Good or Easy have left the Tough terms deck. What's still weak stays for next time.
        </div>
        <button onClick={retry} style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}>Another round</button>
        <button onClick={onExit} style={{ width: '100%', marginTop: '8px', padding: '11px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '13px', fontWeight: 600 }}>Back to Home</button>
      </div>
    );
  } else if (phase.phase === 'weak') {
    body = (
      <PathQuizStep
        key={round.nonce + 'w'}
        questions={phase.items}
        passPct={0}
        label="Weak spots"
        categories={phase.categories}
        flashcardsData={phase.flashcards}
        onAnswer={(id, ok) => { const { id: orig } = splitReviewId(id); apiFor(id).recordResult(orig, ok ? 'correct' : 'incorrect'); }}
        onFinished={(c, t) => makeApi(trackKeys[0]).finishQuiz(c, t)}
        onPass={advance}
        onRetry={retry}
        continueLabel={phaseIndex + 1 < round.phases.length ? 'Next part ›' : 'Finish ›'}
      />
    );
  } else if (phase.phase === 'tough') {
    body = (
      <PathCardsStep
        key={round.nonce + 't'}
        cards={phase.items}
        categories={phase.categories}
        flashcardsData={phase.flashcards}
        speech={speech}
        onRate={(id, q) => { const { id: orig } = splitReviewId(id); apiFor(id).rateCard(orig, q); }}
        onDone={advance}
      />
    );
  } else if (phase.phase === 'cases') {
    const cs = phase.items[gameIndex];
    const lastItem = gameIndex + 1 >= phase.items.length;
    const catLabel = (phase.categories.find((c) => c.key === cs.cat) || {}).label;
    body = (
      <PathQuizStep
        key={round.nonce + 'c' + gameIndex}
        questions={cs.questions}
        passPct={0}
        label="Case study"
        categories={phase.categories}
        flashcardsData={phase.flashcards}
        header={(
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{catLabel} · {cs.title}</div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.55 }}>{cs.scenario}</div>
          </div>
        )}
        onAnswer={(id, ok) => { const { id: orig } = splitReviewId(id); apiFor(id).recordResult(orig, ok ? 'correct' : 'incorrect'); }}
        onFinished={(c, t) => makeApi(trackKeys[0]).finishQuiz(c, t)}
        onPass={() => (lastItem ? advance(null) : setGameIndex(gameIndex + 1))}
        onRetry={retry}
        continueLabel={lastItem && phaseIndex + 1 >= round.phases.length ? 'Finish ›' : 'Next ›'}
      />
    );
  } else {
    const g = phase.items[gameIndex];
    const next = () => (gameIndex + 1 < phase.items.length ? setGameIndex(gameIndex + 1) : advance(null));
    const common = {
      key: round.nonce + 'g' + gameIndex,
      item: g.item,
      categories: phase.categories,
      flashcardsData: phase.flashcards,
      onResult: (id, outcome) => { const { id: orig } = splitReviewId(id); apiFor(id).recordResult(orig, outcome); },
      onDone: next,
    };
    body = g.kind === 'madlib' ? <PathMadlibStep {...common} /> : g.kind === 'sequence' ? <PathSequenceStep {...common} /> : <PathCompareStep {...common} />;
  }

  const title = kind === 'mixed' ? 'Review everything due' : REVIEW_PHASE_LABELS[kind];
  return (
    <div>
      <button onClick={onExit} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '10px', padding: 0 }}>‹ Back to Home</button>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Review across your certs{kind === 'mixed' && !finished ? ` · part ${phaseIndex + 1} of ${round.phases.length}` : ''}
        </div>
        <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
          {kind === 'mixed' && !finished ? REVIEW_PHASE_LABELS[phase.phase] : title}
        </div>
      </div>
      {body}
    </div>
  );
}
