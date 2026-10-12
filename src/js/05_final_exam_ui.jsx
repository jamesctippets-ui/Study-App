/* ---------------- final exam UI ---------------- */

const READINESS_COLOR = {
  'Exam ready': COLOR.success,
  'Getting there': COLOR.gold,
  'Building': COLOR.gold,
  'Just starting': COLOR.muted,
  'Not started': COLOR.muted,
};

function ExamIntro({ track, config, readiness, onStart, onStartFinal }) {
  const readinessColor = READINESS_COLOR[readiness.label] || COLOR.muted;
  const started = readiness.label !== 'Not started';
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', padding: '22px' }}>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '8px' }}>{track.label} Final Exam</div>
      <ExperienceChip trackKey={track.key} style={{ marginBottom: '10px' }} />
      {started && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', padding: '9px 12px', borderRadius: 'var(--r-ctl)', background: `${readinessColor}1F`, border: `1px solid ${readinessColor}` }}>
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: COLOR.muted }}>Exam readiness · <span style={{ color: readinessColor, fontWeight: 700 }}>{readiness.label}</span></span>
          <span className="mono" style={{ fontSize: '15px', fontWeight: 700, color: readinessColor }}>{readiness.score}%</span>
        </div>
      )}
      <div style={{ fontSize: '13px', color: COLOR.text, marginBottom: '14px' }}>{config.length} questions · {config.minutes}-minute time limit</div>
      <button
        onClick={onStart}
        style={{ width: '100%', padding: '13px', borderRadius: 'var(--r-card)', background: COLOR.gold, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
      >
        Start Practice Exam
      </button>
      <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: 'var(--r-card)', border: `1px solid ${COLOR.gold}`, borderLeft: `3px solid ${COLOR.gold}`, background: `${COLOR.gold}14` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: COLOR.gold, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          Final Mock — proctored-style
        </div>
        <div style={{ fontSize: '12px', color: COLOR.text, lineHeight: 1.55, marginBottom: '10px' }}>
          Same questions and clock, stricter rules: each answer locks as you move on, no going back, no submitting early and nothing shown until the end. Scored pass/fail at the real pass mark, with a per-area breakdown.
        </div>
        <button
          onClick={onStartFinal}
          style={{ width: '100%', padding: '11px', borderRadius: 'var(--r-card)', border: `1px solid ${COLOR.gold}`, background: 'transparent', color: COLOR.gold, fontSize: '14px', fontWeight: 700 }}
        >
          Start Final Mock
        </button>
      </div>
      {/* The reading (pass mark, experience, format, readiness, official links) is folded away. */}
      <Disclosure label="About this exam" summary="pass mark, format, resources" style={{ marginTop: '14px', marginBottom: 0 }}>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '12px', lineHeight: 1.5 }}>{config.passLabel}</div>
        <ExperienceCard trackKey={track.key} />
        <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.6, marginBottom: started || (Array.isArray(config.resources) && config.resources.length > 0) ? '14px' : 0 }}>
          Multiple choice, true/false, and multi-select only, pulled from every category regardless of the current filter. No feedback until you submit, just like the real thing. Questions and order change each attempt.
        </div>
        {started && (
          <div style={{ fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.45, marginBottom: Array.isArray(config.resources) && config.resources.length > 0 ? '14px' : 0 }}>
            Readiness is {readiness.mastery}% lifetime mastery{readiness.freshness < 0.99 ? ', discounted for how long it\'s been since you last practiced' : ''}, not just a flat percentage that never decays.
          </div>
        )}
        {Array.isArray(config.resources) && config.resources.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: COLOR.muted, fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Official study resources
            </div>
            <div className="flex flex-col gap-1">
              {config.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: COLOR.primary, textDecoration: 'none', borderBottom: `1px dotted ${COLOR.primary}`, width: 'fit-content' }}
                >
                  {r.label} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </Disclosure>
    </div>
  );
}

function ExamQuestionView({ q, selectedIdx, onSelect }) {
  if (!q) return null;
  return (
    <div>
      <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', padding: '18px 18px 16px' }}>
        <div style={{ fontSize: '16px', lineHeight: 1.5, fontWeight: 600, overflowWrap: 'anywhere' }}>{q.question}</div>
        {q.image && REAL_PORTAL_SCREENSHOTS[q.image] && (
          <div style={{ marginTop: '12px' }}>
            <RealPortalScreenshot shot={REAL_PORTAL_SCREENSHOTS[q.image]} hideDescription />
          </div>
        )}
      </div>
      {q.type === 'mc' && (
        <div>
          {q.options.map((opt, i) => (
            <QuizOption key={i} index={i} text={opt} state={i === selectedIdx ? 'picked' : 'idle'} onClick={() => onSelect(i)} />
          ))}
        </div>
      )}
      {q.type === 'tf' && (
        <div className="flex gap-2" style={{ marginTop: '8px' }}>
          {['True', 'False'].map((label, i) => {
            const isSelected = i === selectedIdx;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                aria-pressed={isSelected}
                className="flex-1"
                style={{
                  padding: '16px', borderRadius: 'var(--r-card)',
                  border: `1px solid ${isSelected ? COLOR.primary : COLOR.border}`,
                  background: isSelected ? 'color-mix(in srgb, var(--color-primary) 9%, var(--color-surface))' : COLOR.surface,
                  boxShadow: isSelected ? `inset 3px 0 0 ${COLOR.primary}` : 'none',
                  color: isSelected ? COLOR.primary : COLOR.text, fontSize: '15px', fontWeight: 600,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {q.type === 'ms' && (
        <div>
          <div style={{ fontSize: '10.5px', color: COLOR.gold, margin: '12px 2px 0', textTransform: 'uppercase' }}>Select all that apply</div>
          {q.options.map((opt, i) => {
            const picked = Array.isArray(selectedIdx) ? selectedIdx : [];
            return <QuizOption key={i} index={i} text={opt} state={picked.includes(i) ? 'picked' : 'idle'} onClick={() => onSelect(i)} />;
          })}
        </div>
      )}
    </div>
  );
}

const REVIEW_PREVIEW_COUNT = 5;

function ExamResults({ result, config, track, categories, onRestart, onWeakSpots, variant, flashcardsData }) {
  const [showAllMissed, setShowAllMissed] = useState(false);
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const missed = result.items.filter((i) => !i.correct);
  const shownMissed = showAllMissed ? missed : missed.slice(0, REVIEW_PREVIEW_COUNT);
  const isItil = track.key === 'itil';
  const isFinal = variant === 'final';
  const onTarget = pct >= config.passPct;
  // Per-area breakdown, the way a real Microsoft/CompTIA score report shows
  // it — only for the Final Mock, where the point is realism; the practice
  // exam keeps its lighter summary.
  const byCategory = isFinal
    ? categories.map((c) => {
      const its = result.items.filter((i) => i.cat === c.key);
      return { key: c.key, label: c.label, correct: its.filter((i) => i.correct).length, total: its.length };
    }).filter((r) => r.total > 0)
    : [];
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', padding: '26px', textAlign: 'center' }}>
        {isFinal && (
          <div style={{ fontSize: '11px', fontWeight: 700, color: COLOR.gold, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Final Mock</div>
        )}
        <div className="itil-display" style={{ fontSize: '30px', fontWeight: 600, color: onTarget ? COLOR.success : COLOR.red }}>{result.correct} / {result.total}</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginTop: '4px' }}>{pct}% correct</div>
        {(isItil || isFinal) ? (
          <div style={{ marginTop: '10px', fontSize: '15px', fontWeight: 700, color: onTarget ? COLOR.success : COLOR.red }}>
            {onTarget ? 'PASS' : (isFinal ? 'FAIL' : 'Below the pass mark')}
          </div>
        ) : (
          <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: onTarget ? COLOR.success : COLOR.gold }}>
            {onTarget ? 'On track, comfortably above the buffer' : 'Below the safety buffer'}
          </div>
        )}
        <div style={{ marginTop: '6px', fontSize: '11px', color: COLOR.muted, lineHeight: 1.5 }}>{config.passLabel}</div>
      </div>
      {byCategory.length > 0 && (
        <div className="mt-4" style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: COLOR.muted, fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Score report by area
          </div>
          {byCategory.map((r) => {
            const p = Math.round((r.correct / r.total) * 100);
            const color = p >= config.passPct ? COLOR.success : p >= config.passPct - 15 ? COLOR.gold : COLOR.red;
            return (
              <div key={r.key} style={{ marginBottom: '9px' }}>
                <div className="flex justify-between" style={{ fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: COLOR.text }}>{r.label}</span>
                  <span style={{ color, fontWeight: 700 }}>{r.correct}/{r.total} · {p}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', background: COLOR.border, overflow: 'hidden' }}>
                  <div style={{ width: `${p}%`, height: '100%', background: color }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.5 }}>
            Areas under the pass mark are where a real attempt would most likely fall short.
          </div>
        </div>
      )}
      {missed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>
            Review these{missed.length > REVIEW_PREVIEW_COUNT ? ` (${shownMissed.length} of ${missed.length})` : ''}:
          </div>
          <div className="flex flex-col gap-2">
            {shownMissed.map((m, i) => (
              <div key={i} style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: 'var(--r-ctl)', padding: '10px 12px', fontSize: '13px' }}>
                <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '2px' }}>
                  {categories.find((c) => c.key === m.cat)?.label}{!m.answered ? ' — left blank' : ''}
                </div>
                <div>{m.prompt}</div>
                {m.explanation && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${COLOR.border}`, fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>
                    <GlossText text={m.explanation} pool={flashcardsData} max={3} blockId={'ex' + i} />
                  </div>
                )}
                {m.whyTested && (
                  <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: 'var(--r-ctl)', background: `${COLOR.teal}14`, border: `1px solid ${COLOR.teal}`, fontSize: '11.5px', lineHeight: 1.5, color: COLOR.text }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: COLOR.teal, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Why this is tested</div>
                    {m.whyTested}
                  </div>
                )}
              </div>
            ))}
          </div>
          {missed.length > REVIEW_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllMissed((v) => !v)}
              style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: 'var(--r-card)', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.primary, fontSize: '13px', fontWeight: 600 }}
            >
              {showAllMissed ? 'Show fewer' : `Show all ${missed.length} missed questions`}
            </button>
          )}
        </div>
      )}
      {missed.length > 0 && onWeakSpots && (
        <button
          onClick={onWeakSpots}
          style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: 'var(--r-card)', background: COLOR.red, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
        >
          Study my weak spots from this exam ›
        </button>
      )}
      <button
        onClick={onRestart}
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: 'var(--r-ctl)', border: 'none', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        {isFinal ? 'Back to exam options' : 'Take another exam'}
      </button>
    </div>
  );
}

