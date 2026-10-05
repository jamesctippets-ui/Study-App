/* ---------------- shared UI: quiz & game modes ---------------- */

function QuizSetup({ length, setLength, types, toggleType, onReroll, poolSize, missedCount, onReviewMissed, isMixed }) {
  const lengths = [5, 10, 15, 25];
  // Length and question-type filters are set-and-forget for most sessions,
  // so they fold into one summary row instead of stacking three more
  // always-visible control rows above the first question.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const typeNames = [['mc', 'Multiple choice'], ['ms', 'Multi-select'], ['tf', 'True / False']]
    .filter(([key]) => types[key]).map(([, label]) => label);
  const typeSummary = typeNames.length === 3 ? 'all types' : typeNames.join(', ');
  return (
    <div style={{ marginBottom: '14px' }}>
      {missedCount > 0 && (
        <button
          onClick={onReviewMissed}
          style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '12px', border: `1px solid ${COLOR.red}`, background: 'rgba(181,87,74,0.1)', color: COLOR.red, fontSize: '13px', fontWeight: 600 }}
        >
          Review {missedCount} missed question{missedCount === 1 ? '' : 's'}
        </button>
      )}
      <div className="flex justify-between items-center mb-2">
        <div style={{ fontSize: '11px', color: COLOR.muted }}>
          {poolSize} questions{isMixed ? ' · mixed across every category on purpose' : ''}
        </div>
        <button
          onClick={onReroll}
          style={{ fontSize: '11px', color: COLOR.primary, background: 'transparent', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${COLOR.primary}`, flexShrink: 0 }}
        >
          New quiz
        </button>
      </div>
      <div style={{ border: `2px solid ${COLOR.border}`, borderRadius: '12px', background: COLOR.surface, overflow: 'hidden' }}>
        <button
          onClick={() => setOptionsOpen((o) => !o)}
          className="btn-flat"
          style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'transparent', color: COLOR.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
        >
          <span style={{ fontSize: '12px' }}>
            <span style={{ color: COLOR.muted }}>Options: </span>
            <span style={{ fontWeight: 600 }}>{length} questions · {typeSummary}</span>
          </span>
          <span style={{ fontSize: '11px', color: COLOR.muted }}>{optionsOpen ? '▴' : '▾'}</span>
        </button>
        {optionsOpen && (
          <div style={{ padding: '4px 12px 12px', borderTop: `1px solid ${COLOR.border}` }}>
            <div className="flex items-center gap-2" style={{ margin: '10px 0' }}>
              <label htmlFor="quiz-length-select" style={{ fontSize: '11px', color: COLOR.muted }}>Length</label>
              <select
                id="quiz-length-select"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                style={{
                  padding: '6px 10px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 600,
                  border: `1px solid ${COLOR.primary}`, background: 'rgba(167,139,250,0.14)', color: COLOR.primary,
                }}
              >
                {lengths.map((n) => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {[['mc', 'Multiple choice'], ['ms', 'Multi-select'], ['tf', 'True / False']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleType(key)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                    border: `1px solid ${types[key] ? COLOR.gold : COLOR.border}`,
                    background: types[key] ? 'rgba(211,164,101,0.14)' : COLOR.surface,
                    color: types[key] ? COLOR.gold : COLOR.muted,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hands-free, audio-only quiz mode (ROADMAP.md section 16): reads a
// question aloud, pauses for a fixed "thinking" interval, reads the
// answer + explanation, then auto-advances — no tap-to-answer, so this
// is deliberately a much sparer screen than QuestionView above (a rare
// glance, not something read while driving).
function VerbalQuizPanel({
  speechSupported, phase, session, index, step, length, setLength, pauseSec, setPauseSec,
  poolSize, categories, onStart, onTogglePause, onSkip, onRestart,
}) {
  if (!speechSupported) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        Verbal Quiz needs text-to-speech, which this browser doesn't support.
      </div>
    );
  }

  if (phase === 'setup') {
    const lengths = [5, 10, 15, 25];
    return (
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>🔊 Verbal Quiz</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '16px' }}>
          Hands-free, audio-only studying — reads each question aloud, pauses so you can think, then reads
          the answer and explanation before moving on. No microphone, no answer capture: this is a
          listen-and-recall study aid, not a scored quiz, so it won't move your mastery % or daily goal.
          Multi-select questions are skipped — there's nothing to select without a mic.
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="verbal-length-select" style={{ fontSize: '11px', color: COLOR.muted, minWidth: '90px' }}>Length</label>
          <select
            id="verbal-length-select"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 600, border: `1px solid ${COLOR.primary}`, background: 'rgba(167,139,250,0.14)', color: COLOR.primary }}
          >
            {lengths.map((n) => <option key={n} value={n}>{n} questions</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="verbal-pause-select" style={{ fontSize: '11px', color: COLOR.muted, minWidth: '90px' }}>Thinking pause</label>
          <select
            id="verbal-pause-select"
            value={pauseSec}
            onChange={(e) => setPauseSec(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 600, border: `2px solid ${COLOR.border}`, background: COLOR.surfaceRaised, color: COLOR.text }}
          >
            {[4, 6, 8, 10, 15].map((n) => <option key={n} value={n}>{n} seconds</option>)}
          </select>
        </div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '14px' }}>{poolSize} questions available with this filter.</div>
        <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '16px', lineHeight: 1.4 }}>
          Keeps this screen awake while playing, so audio doesn't stop the moment your phone would
          otherwise lock — leave the app open and in view. Backgrounding the tab or a hard screen-lock
          can still pause playback; that's outside any web app's control.
        </div>
        <button
          onClick={onStart}
          disabled={poolSize === 0}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', background: poolSize === 0 ? COLOR.border : COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          ▶ Start Verbal Quiz
        </button>
      </div>
    );
  }

  const q = session[index];
  if (phase === 'complete' || !q) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Session complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '18px' }}>
          Read through {session.length} question{session.length === 1 ? '' : 's'}. Nothing was scored —
          start another round whenever you're ready.
        </div>
        <button className="btn-3d" onClick={onRestart} style={{ padding: '10px 20px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}>
          Back to setup
        </button>
      </div>
    );
  }

  const stepLabels = { question: 'Question', options: 'Options', thinking: 'Thinking…', answer: 'Answer', explanation: 'Explanation' };
  const categoryLabel = categories.find((c) => c.key === q.cat)?.label;
  const showAnswer = step === 'answer' || step === 'explanation';

  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {session.length}</span>
      </div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px',
          background: phase === 'paused' ? COLOR.surfaceRaised : 'rgba(167,139,250,0.14)',
          color: phase === 'paused' ? COLOR.muted : COLOR.primary, fontSize: '11px', fontWeight: 600, marginBottom: '18px',
        }}>
          {phase === 'paused' ? '⏸ Paused' : `🔊 ${stepLabels[step] || ''}`}
        </div>
        <div style={{ fontSize: '16px', lineHeight: 1.5, fontWeight: 500, marginBottom: showAnswer ? '10px' : 0 }}>{q.question}</div>
        {showAnswer && (
          <div style={{ fontSize: '13.5px', color: COLOR.success, fontWeight: 600, marginBottom: '8px' }}>
            {q.type === 'tf' ? (q.answer ? 'True' : 'False') : q.options[q.correct]}
          </div>
        )}
        {step === 'explanation' && (
          <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginTop: '8px' }}>{q.explanation}</div>
        )}
      </div>
      <div className="flex gap-3" style={{ marginTop: '18px' }}>
        <button
          onClick={onTogglePause}
          className="flex-1 btn-3d"
          style={{ padding: '16px', borderRadius: '14px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '15px', fontWeight: 600 }}
        >
          {phase === 'paused' ? '▶ Play' : '⏸ Pause'}
        </button>
        <button
          onClick={onSkip}
          className="flex-1"
          style={{ padding: '16px', borderRadius: '14px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '15px', fontWeight: 600 }}
        >
          Skip ⏭
        </button>
      </div>
    </div>
  );
}

// CLI/PowerShell command-practice mode (ROADMAP.md section 4): type the
// command for a stated task, get checked against expected syntax/flags
// (checkCliAnswer in 03_helpers.js) rather than picking from options —
// only shown for tracks that actually ship CLI_CHALLENGES content
// (AZ-104, AZ-802 today). Deliberately self-contained and not wired into
// mastery/results/exam-readiness — CATEGORIES' marks-to-100 weighting is
// calibrated to flashcards+questions counts only, and folding a third
// item kind into that math wasn't worth the risk for what's meant to be
// a lightweight practice add-on; score is tracked for the session only.
function CommandPracticeView({ session, index, score, categories, input, setInput, result, onSubmit, onNext, onRestart }) {
  if (!session.length) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No command challenges match this filter.
      </div>
    );
  }

  const challenge = session[index];
  if (!challenge) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Set complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '18px' }}>
          {score.correct} / {score.total} correct (exact or structurally right — see each answer's canonical form for the precise syntax).
        </div>
        <button className="btn-3d" onClick={onRestart} style={{ padding: '10px 20px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}>
          New set
        </button>
      </div>
    );
  }

  const categoryLabel = categories.find((c) => c.key === challenge.cat)?.label;
  const total = session.length;
  const submitted = result !== null;
  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: COLOR.gold, marginBottom: '8px', textTransform: 'uppercase' }}>
          {challenge.tool === 'powershell' ? 'PowerShell' : 'Azure CLI'}
        </div>
        <div style={{ fontSize: '16px', lineHeight: 1.45, fontWeight: 500, marginBottom: '14px' }}>{challenge.prompt}</div>
        <input
          type="text"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={input}
          disabled={submitted}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !submitted && input.trim()) onSubmit(); }}
          placeholder="Type the command…"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '13.5px',
            border: `1px solid ${submitted ? (result === 'incorrect' ? COLOR.red : COLOR.success) : COLOR.border}`,
            background: COLOR.surfaceRaised, color: COLOR.text,
          }}
        />
        {!submitted ? (
          <button
            onClick={onSubmit}
            disabled={!input.trim()}
            style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', background: input.trim() ? COLOR.primary : COLOR.border, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}
          >
            Check
          </button>
        ) : (
          <div style={{ marginTop: '14px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, marginBottom: '8px',
              color: result === 'incorrect' ? COLOR.red : COLOR.success,
            }}>
              {result === 'exact' ? '✓ Exactly right' : result === 'close' ? '✓ Right idea — close enough' : '✕ Not quite'}
            </div>
            <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '4px' }}>Canonical answer:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12.5px', padding: '10px 12px', borderRadius: '10px', background: COLOR.surfaceRaised, color: COLOR.text, marginBottom: '12px', wordBreak: 'break-word' }}>
              {challenge.command}
            </div>
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>{challenge.explanation}</div>
          </div>
        )}
      </div>
      {submitted && (
        <button className="btn-3d"
          onClick={onNext}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {index + 1 >= total ? 'Finish' : 'Next'}
        </button>
      )}
    </div>
  );
}

// Scenario Mad Libs (ROADMAP.md section 13): a short real-world scenario
// paragraph with a few dropdown blanks, filled from a small set of term
// choices — reinforces vocabulary in context instead of as an isolated
// flashcard front/back. Scored all-or-nothing per scenario (every blank
// right, or it counts as a miss) and feeds into results/mastery the same
// way flashcards and questions do (see trackMastery/masteryByCategory) —
// unlike Verbal Quiz and CLI practice, which are deliberately unscored.
function MadLibsView({ session, index, score, categories, answers, onSetBlank, submitted, onSubmit, onNext, onRestart, flashcardsData }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEffect(() => { setActiveTermKey(null); }, [session[index] && session[index].id]);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));

  if (!session.length) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No Mad Libs scenarios match this filter.
      </div>
    );
  }

  const item = session[index];
  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Set complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '18px' }}>
          {score.correct} / {score.total} scenario{score.total === 1 ? '' : 's'} fully correct.
        </div>
        <button className="btn-3d" onClick={onRestart} style={{ padding: '10px 20px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}>
          New set
        </button>
      </div>
    );
  }

  const categoryLabel = categories.find((c) => c.key === item.cat)?.label;
  const total = session.length;
  const parts = item.scenario.split(/\{(\w+)\}/);
  const blanksByKey = {};
  item.blanks.forEach((b) => { blanksByKey[b.key] = b; });
  const allAnswered = item.blanks.every((b) => answers[b.key] !== undefined && answers[b.key] !== null);
  const anyWrong = submitted && item.blanks.some((b) => answers[b.key] !== b.correct);

  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '15.5px', lineHeight: 2 }}>
          {parts.map((part, i) => {
            if (i % 2 === 0) {
              return (
                <span key={i}>
                  {autoHighlightTerms(part, flashcardsData, activeTermKey, setActiveTermKey, 2, 'ml-' + item.id + '-' + i)}
                </span>
              );
            }
            const blank = blanksByKey[part];
            if (!blank) return null;
            const selectedIdx = answers[part];
            const isCorrectSel = submitted && selectedIdx === blank.correct;
            return (
              <select
                key={i}
                value={selectedIdx === undefined || selectedIdx === null ? '' : selectedIdx}
                disabled={submitted}
                onChange={(e) => onSetBlank(part, Number(e.target.value))}
                style={{
                  margin: '0 3px', padding: '4px 8px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  border: `1.5px solid ${submitted ? (isCorrectSel ? COLOR.success : COLOR.red) : COLOR.primary}`,
                  background: submitted ? (isCorrectSel ? 'rgba(52,211,153,0.15)' : 'rgba(181,87,74,0.15)') : 'rgba(167,139,250,0.14)',
                  color: submitted ? (isCorrectSel ? COLOR.success : COLOR.red) : COLOR.primary,
                }}
              >
                <option value="" disabled>— choose —</option>
                {blank.options.map((opt, oi) => <option key={oi} value={oi}>{opt}</option>)}
              </select>
            );
          })}
        </div>
        {submitted && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${COLOR.border}` }}>
            {anyWrong && (
              <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>
                Correct answer{item.blanks.length > 1 ? 's' : ''}: {item.blanks.map((b) => b.options[b.correct]).join(', ')}
              </div>
            )}
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
              {autoHighlightTerms(item.explanation, flashcardsData, activeTermKey, setActiveTermKey, 3, 'ml-exp-' + item.id)}
            </div>
          </div>
        )}
      </div>
      {!submitted ? (
        <button
          onClick={onSubmit}
          disabled={!allAnswered}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: allAnswered ? COLOR.primary : COLOR.border, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          Check
        </button>
      ) : (
        <button className="btn-3d"
          onClick={onNext}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {index + 1 >= total ? 'Finish' : 'Next'}
        </button>
      )}
    </div>
  );
}

// Step-ordering / sequencing challenges (ROADMAP.md section 13): shuffle
// the steps for a stated procedure and have the user arrange them back
// into the right order with simple up/down move buttons (drag-to-reorder
// is a later enhancement, not a blocker, per the roadmap's own scoping).
// Scored all-or-nothing per sequence and feeds into results/mastery the
// same way Mad Libs does (see checkSequenceOrder in 03_helpers.js).
function SequenceView({ session, index, score, categories, workingOrder, onMove, submitted, onSubmit, onNext, onRestart, flashcardsData }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEffect(() => { setActiveTermKey(null); }, [session[index] && session[index].id]);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));

  if (!session.length) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No step-ordering challenges match this filter.
      </div>
    );
  }

  const item = session[index];
  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Set complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '18px' }}>
          {score.correct} / {score.total} sequence{score.total === 1 ? '' : 's'} in the exact right order.
        </div>
        <button className="btn-3d" onClick={onRestart} style={{ padding: '10px 20px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}>
          New set
        </button>
      </div>
    );
  }

  const categoryLabel = categories.find((c) => c.key === item.cat)?.label;
  const total = session.length;
  const anyWrong = submitted && workingOrder.some((originalIdx, pos) => originalIdx !== pos);

  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '15px', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
          {autoHighlightTerms(item.prompt, flashcardsData, activeTermKey, setActiveTermKey, 2, 'seq-prompt-' + item.id)}
        </div>
        <div className="flex flex-col gap-2">
          {workingOrder.map((originalIdx, pos) => {
            const isRight = submitted && originalIdx === pos;
            return (
              <div
                key={originalIdx}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px',
                  border: `1px solid ${submitted ? (isRight ? COLOR.success : COLOR.red) : COLOR.border}`,
                  background: submitted ? (isRight ? 'rgba(52,211,153,0.12)' : 'rgba(181,87,74,0.12)') : COLOR.surfaceRaised,
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: COLOR.muted, minWidth: '16px' }}>{pos + 1}.</span>
                <span style={{ flex: 1, fontSize: '13.5px', color: COLOR.text, lineHeight: 1.4 }}>
                  {autoHighlightTerms(item.steps[originalIdx], flashcardsData, activeTermKey, setActiveTermKey, 1, 'seq-step-' + item.id + '-' + originalIdx)}
                </span>
                {!submitted && (
                  <div className="flex" style={{ gap: '2px', flexShrink: 0 }}>
                    <button
                      onClick={() => onMove(pos, -1)}
                      disabled={pos === 0}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: pos === 0 ? COLOR.border : COLOR.primary, fontSize: '13px' }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onMove(pos, 1)}
                      disabled={pos === workingOrder.length - 1}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: pos === workingOrder.length - 1 ? COLOR.border : COLOR.primary, fontSize: '13px' }}
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {submitted && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${COLOR.border}` }}>
            {anyWrong && (
              <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.5 }}>
                Correct order: {item.steps.map((s, i) => `${i + 1}. ${s}`).join('  ')}
              </div>
            )}
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>
              {autoHighlightTerms(item.explanation, flashcardsData, activeTermKey, setActiveTermKey, 3, 'seq-exp-' + item.id)}
            </div>
          </div>
        )}
      </div>
      {!submitted ? (
        <button className="btn-3d"
          onClick={onSubmit}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          Check
        </button>
      ) : (
        <button className="btn-3d"
          onClick={onNext}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {index + 1 >= total ? 'Finish' : 'Next'}
        </button>
      )}
    </div>
  );
}

// Grouped so the Practice tab reads as three small sections instead of one
// 8-wide row of equal tabs. `requires` names the track capability a tool
// depends on (matching the same guards the old tab row used).
const PRACTICE_TOOLS = [
  { key: 'questions', group: 'Test yourself', label: 'Questions', desc: 'Mixed or per-category practice quiz' },
  { key: 'compare', group: 'Test yourself', label: 'Compare', desc: 'Pick the better of two plausible answers', requires: 'compare' },
  { key: 'casestudy', group: 'Test yourself', label: 'Case Study', desc: 'Several questions off one shared scenario', requires: 'casestudy' },
  { key: 'madlibs', group: 'Games & drills', label: 'Mad Libs', desc: 'Fill the blanks in a real-world scenario', requires: 'madlibs' },
  { key: 'sequence', group: 'Games & drills', label: 'Sequence', desc: 'Put a procedure\'s steps in the right order', requires: 'sequence' },
  { key: 'match', group: 'Games & drills', label: 'Match', desc: 'Draw lines between terms and definitions' },
  { key: 'commands', group: 'Games & drills', label: 'Commands', desc: 'Type the right CLI or PowerShell command', requires: 'commands' },
  { key: 'verbal', group: 'Hands-free', label: 'Verbal', desc: 'Audio-only quiz for driving or walking' },
];

function PracticeToolPicker({ quizView, available, onSelect }) {
  const [open, setOpen] = useState(false);
  useEscapeToClose(() => setOpen(false));
  const tools = PRACTICE_TOOLS.filter((t) => !t.requires || available[t.requires]);
  const current = tools.find((t) => t.key === quizView) || tools[0];
  const groups = [];
  tools.forEach((t) => {
    let g = groups.find((x) => x.name === t.group);
    if (!g) { g = { name: t.group, items: [] }; groups.push(g); }
    g.items.push(t);
  });
  return (
    <div style={{ marginBottom: '14px', position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '12px',
          border: `2px solid ${COLOR.border}`, background: COLOR.surface, color: COLOR.text,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '11px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Practice tool</span>
          <span style={{ display: 'block', fontSize: '14.5px', fontWeight: 600 }}>{current.label}</span>
          <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, marginTop: '1px' }}>{current.desc}</span>
        </span>
        <span style={{ fontSize: '12px', color: COLOR.muted, flexShrink: 0 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ boxShadow: SHADOW.card, marginTop: '6px', background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          {groups.map((g, gi) => (
            <div key={g.name} style={{ borderTop: gi === 0 ? 'none' : `1px solid ${COLOR.border}` }}>
              <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: 700, color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.name}</div>
              {g.items.map((t) => {
                const active = t.key === current.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => { onSelect(t.key); setOpen(false); }}
                    className="btn-flat"
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 14px', background: active ? COLOR.surfaceRaised : 'transparent',
                      color: COLOR.text, display: 'flex', alignItems: 'baseline', gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: active ? COLOR.primary : COLOR.text, minWidth: '74px' }}>{t.label}</span>
                    <span style={{ fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.35 }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareView({ session, index, score, categories, choice, onChoose, onNext, onRestart, flashcardsData }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEffect(() => { setActiveTermKey(null); }, [session[index] && session[index].id]);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));

  if (!session.length) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No "more correct answer" comparisons match this filter.
      </div>
    );
  }

  const item = session[index];
  if (!item) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px' }}>
        <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Set complete</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '18px' }}>
          {score.correct} / {score.total} time{score.total === 1 ? '' : 's'} you picked the better answer.
        </div>
        <button className="btn-3d" onClick={onRestart} style={{ padding: '10px 20px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}>
          New set
        </button>
      </div>
    );
  }

  const categoryLabel = categories.find((c) => c.key === item.cat)?.label;
  const total = session.length;
  const submitted = choice !== null;
  const gotIt = submitted && choice === item.betterIdx;

  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '11px', color: COLOR.gold, marginBottom: '8px', fontWeight: 600 }}>
          Both options are plausible — which is the better answer?
        </div>
        <div style={{ fontSize: '15px', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
          {autoHighlightTerms(item.scenario, flashcardsData, activeTermKey, setActiveTermKey, 2, 'cmp-scn-' + item.id)}
        </div>
        <div className="flex flex-col gap-2">
          {item.options.map((opt, i) => {
            const isBetter = i === item.betterIdx;
            const isChosen = i === choice;
            let bg = COLOR.surfaceRaised, border = COLOR.border, color = COLOR.text;
            if (submitted) {
              if (isBetter) { bg = 'rgba(52,211,153,0.15)'; border = COLOR.success; color = COLOR.success; }
              else if (isChosen) { bg = 'rgba(181,87,74,0.15)'; border = COLOR.red; color = COLOR.red; }
            }
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => onChoose(i)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                  border: `1px solid ${border}`, background: bg, color, fontSize: '14px', lineHeight: 1.45,
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: submitted ? color : COLOR.muted, minWidth: '14px', paddingTop: '2px' }}>{i === 0 ? 'A' : 'B'}</span>
                <span style={{ flex: 1 }}>{opt}</span>
                {submitted && isBetter && <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: '3px' }}>BETTER</span>}
                {submitted && isChosen && !isBetter && <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: '3px' }}>RUNNER-UP</span>}
              </button>
            );
          })}
        </div>
        {submitted && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${COLOR.border}` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: gotIt ? COLOR.success : COLOR.red, marginBottom: '6px' }}>
              {gotIt ? 'Right call.' : 'Close — but the other one is the better fit.'}
            </div>
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.55 }}>
              {autoHighlightTerms(item.why, flashcardsData, activeTermKey, setActiveTermKey, 3, 'cmp-why-' + item.id)}
            </div>
          </div>
        )}
      </div>
      {submitted && (
        <button className="btn-3d"
          onClick={onNext}
          style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {index + 1 >= total ? 'Finish' : 'Next'}
        </button>
      )}
    </div>
  );
}

function QuestionView({ q, selected, onChoose, onNext, index, total, categoryLabel, badgeLabel, msPending, onToggleMs, onSubmitMs, nextLabel, hideMeta, hideNext, flashcardsData }) {
  const [activeTermKey, setActiveTermKey] = useState(null);
  useEffect(() => { setActiveTermKey(null); }, [q && q.id]);
  useEscapeToClose(() => setActiveTermKey(null));
  useClickOutsideToClose(!!activeTermKey, () => setActiveTermKey(null));
  if (!q) return null;
  const isLast = index + 1 >= total;
  return (
    <div>
      {!hideMeta && (
        <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
          <span>{badgeLabel ? badgeLabel + ' · ' : ''}{categoryLabel}</span>
          <span>{index + 1} / {total}</span>
        </div>
      )}
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '17px', lineHeight: 1.45, fontWeight: 500, marginBottom: q.image ? '10px' : '16px' }}>{q.question}</div>
        {q.image && REAL_PORTAL_SCREENSHOTS[q.image] && (
          <div style={{ marginBottom: '16px' }}>
            <RealPortalScreenshot shot={REAL_PORTAL_SCREENSHOTS[q.image]} hideDescription />
          </div>
        )}

        {q.type === 'mc' && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isSelected = i === selected;
              let bg = COLOR.surfaceRaised, border = COLOR.border, color = COLOR.text;
              if (selected !== null) {
                if (isCorrect) { bg = 'rgba(52,211,153,0.15)'; border = COLOR.success; color = COLOR.success; }
                else if (isSelected) { bg = 'rgba(181,87,74,0.15)'; border = COLOR.red; color = COLOR.red; }
              }
              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => onChoose(i)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                    border: `1px solid ${border}`, background: bg, color, fontSize: '15px', lineHeight: 1.45,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: selected !== null ? 'default' : 'pointer',
                  }}
                >
                  <span>{opt}</span>
                  {selected !== null && isCorrect && <span>✓</span>}
                  {selected !== null && isSelected && !isCorrect && <span>✕</span>}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'tf' && (
          <div className="flex gap-2">
            {['True', 'False'].map((label, i) => {
              const isRight = (i === 0) === q.answer;
              const isSelected = i === selected;
              let bg = COLOR.surfaceRaised, border = COLOR.border, color = COLOR.text;
              if (selected !== null) {
                if (isRight) { bg = 'rgba(52,211,153,0.15)'; border = COLOR.success; color = COLOR.success; }
                else if (isSelected) { bg = 'rgba(181,87,74,0.15)'; border = COLOR.red; color = COLOR.red; }
              }
              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => onChoose(i)}
                  className="flex-1"
                  style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${border}`, background: bg, color, fontSize: '16px', fontWeight: 600, cursor: selected !== null ? 'default' : 'pointer' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {q.type === 'ms' && (
          <div>
            <div style={{ fontSize: '11px', color: COLOR.gold, marginBottom: '8px', fontWeight: 600 }}>Select all that apply</div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const isCorrectOpt = q.correct.includes(i);
                const wasSelected = selected !== null ? selected.includes(i) : msPending.includes(i);
                let bg = COLOR.surfaceRaised, border = COLOR.border, color = COLOR.text;
                if (selected !== null) {
                  if (isCorrectOpt && wasSelected) { bg = 'rgba(52,211,153,0.15)'; border = COLOR.success; color = COLOR.success; }
                  else if (isCorrectOpt && !wasSelected) { border = COLOR.success; color = COLOR.success; }
                  else if (!isCorrectOpt && wasSelected) { bg = 'rgba(181,87,74,0.15)'; border = COLOR.red; color = COLOR.red; }
                } else if (wasSelected) {
                  bg = 'rgba(167,139,250,0.10)'; border = COLOR.primary; color = COLOR.primary;
                }
                return (
                  <button
                    key={i}
                    disabled={selected !== null}
                    onClick={() => onToggleMs(i)}
                    style={{
                      textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                      border: `1px solid ${border}`, background: bg, color, fontSize: '15px', lineHeight: 1.45,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: selected !== null ? 'default' : 'pointer',
                    }}
                  >
                    <span>{opt}</span>
                    {selected !== null && isCorrectOpt && wasSelected && <span>✓</span>}
                    {selected !== null && isCorrectOpt && !wasSelected && <span style={{ fontSize: '10px' }}>missed</span>}
                    {selected !== null && !isCorrectOpt && wasSelected && <span>✕</span>}
                    {selected === null && wasSelected && <span>●</span>}
                  </button>
                );
              })}
            </div>
            {selected === null && (
              <button
                onClick={onSubmitMs}
                disabled={msPending.length === 0}
                style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: '12px', background: msPending.length ? COLOR.primary : COLOR.surfaceRaised, color: msPending.length ? COLOR.onAccent : COLOR.muted, fontSize: '14px', fontWeight: 600 }}
              >
                Submit answer
              </button>
            )}
          </div>
        )}

        {selected !== null && q.explanation && (
          <div style={{ boxShadow: SHADOW.card, marginTop: '14px', padding: '12px', borderRadius: '10px', background: COLOR.surfaceRaised, fontSize: '14px', lineHeight: 1.55, color: COLOR.muted }}>
            {autoHighlightTerms(q.explanation, flashcardsData, activeTermKey, setActiveTermKey)}
          </div>
        )}

        {selected !== null && q.whyTested && (
          <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: `${COLOR.teal}14`, border: `1px solid ${COLOR.teal}`, fontSize: '12.5px', lineHeight: 1.5, color: COLOR.text }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: COLOR.teal, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Why this is tested</div>
            {q.whyTested}
          </div>
        )}
      </div>

      {selected !== null && !hideNext && (
        <button className="btn-3d"
          onClick={onNext}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {nextLabel || (isLast ? 'See results' : 'Next question')}
        </button>
      )}
    </div>
  );
}

function QuizSummary({ score, answers, categories, onRestart, restartLabel }) {
  const missed = answers.filter((a) => !a.correct);
  // A Today's Mix session's missed answers can come from several tracks at
  // once, each with its own category set — resolve each one's label against
  // its own track's categories (falling back to the single-track `categories`
  // prop) and prefix with the track name whenever more than one is present,
  // so "Worth another look" stays legible instead of showing labels from the
  // wrong track's category list.
  const missedTrackCount = new Set(missed.map((m) => m.track).filter(Boolean)).size;
  const categoryLabelFor = (m) => {
    const trackCats = m.track && DATA[m.track] ? DATA[m.track].categories : categories;
    const label = trackCats.find((c) => c.key === m.cat)?.label;
    if (missedTrackCount > 1 && m.track) {
      const trackLabel = TRACKS.find((t) => t.key === m.track)?.label;
      return trackLabel ? `${trackLabel} · ${label || ''}` : label;
    }
    return label;
  };
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `2px solid ${COLOR.border}`, borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '28px', fontWeight: 600, color: COLOR.success }}>{score.correct} / {score.total}</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginTop: '4px' }}>correct this round</div>
      </div>
      {missed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Worth another look:</div>
          <div className="flex flex-col gap-2">
            {missed.map((m, i) => (
              <div key={i} style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: '10px', padding: '10px 12px', fontSize: '13px' }}>
                <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '2px' }}>{categoryLabelFor(m)}</div>
                <div>{m.prompt}</div>
                {m.explanation && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${COLOR.border}`, fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>
                    {m.explanation}
                  </div>
                )}
                {m.whyTested && (
                  <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '8px', background: `${COLOR.teal}14`, border: `1px solid ${COLOR.teal}`, fontSize: '11.5px', lineHeight: 1.5, color: COLOR.text }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: COLOR.teal, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Why this is tested</div>
                    {m.whyTested}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button className="btn-3d"
        onClick={onRestart}
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        {restartLabel || 'New quiz'}
      </button>
    </div>
  );
}

// Mini case studies (ROADMAP.md section 4) — a shared scenario with 2+
// related questions answered in sequence, mirroring how AZ-305's real exam
// groups several questions off one case. Unlike Mad Libs/Sequence, this
// sub-tab has its own picker screen (list of available case studies for the
// active category filter) rather than dropping straight into a session,
// since "which case study" is a real choice worth showing, not just a
// shuffle. Each embedded question reuses QuestionView as-is (mc/tf/ms all
// already supported there) — only the scenario panel above it and the
// picker/completion screens around it are new.
function CaseStudySetup({ list, onStart, categories }) {
  if (list.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
        No case studies match this filter — try "All categories."
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {list.map((cs, i) => {
        const catLabel = categories.find((c) => c.key === cs.cat)?.label;
        return (
          <button
            key={cs.id}
            onClick={() => onStart(i)}
            style={{
              textAlign: 'left', padding: '14px 16px', borderRadius: '14px',
              background: COLOR.surface, border: `2px solid ${COLOR.border}`, boxShadow: SHADOW.card,
            }}
          >
            <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '4px' }}>{catLabel}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: COLOR.text }}>{cs.title}</div>
            <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px' }}>{cs.questions.length} questions</div>
          </button>
        );
      })}
    </div>
  );
}

function CaseStudyView({ list, activeIndex, onStart, onExit, categories, question, qIndex, selected, onChoose, msPending, onToggleMs, onSubmitMs, onNext, phase, score, answers, flashcardsData }) {
  if (activeIndex === null) {
    return <CaseStudySetup list={list} onStart={onStart} categories={categories} />;
  }
  const cs = list[activeIndex];
  if (!cs) return null;
  const catLabel = categories.find((c) => c.key === cs.cat)?.label;

  if (phase === 'complete') {
    return (
      <div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '10px' }}>{catLabel} · {cs.title}</div>
        <QuizSummary score={score} answers={answers} categories={categories} onRestart={onExit} restartLabel="Back to case studies" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={onExit} className="btn-flat" style={{ color: COLOR.muted, fontSize: '11.5px', marginBottom: '10px', padding: '2px' }}>
        ‹ All case studies
      </button>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, border: `2px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{catLabel} · {cs.title}</div>
        <div style={{ fontSize: '13.5px', lineHeight: 1.55, color: COLOR.text }}><GlossText text={cs.scenario} pool={flashcardsData} max={3} blockId="cs-scn" /></div>
      </div>
      <QuestionView
        q={question}
        selected={selected}
        onChoose={onChoose}
        onNext={onNext}
        index={qIndex}
        total={cs.questions.length}
        categoryLabel={catLabel}
        badgeLabel="Case study"
        msPending={msPending}
        onToggleMs={onToggleMs}
        onSubmitMs={onSubmitMs}
        nextLabel={qIndex + 1 >= cs.questions.length ? 'See case study results' : 'Next question'}
        flashcardsData={flashcardsData}
      />
    </div>
  );
}

