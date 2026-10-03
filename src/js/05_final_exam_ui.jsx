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
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px' }}>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '12px' }}>{track.label} Final Exam</div>
      {readiness.label !== 'Not started' && (
        <div style={{
          marginBottom: '16px', padding: '12px 14px', borderRadius: '12px',
          background: `${readinessColor}1F`, border: `1px solid ${readinessColor}`,
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exam readiness</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: readinessColor }}>{readiness.score}%</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: readinessColor }}>{readiness.label}</div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>
            {readiness.mastery}% lifetime mastery{readiness.freshness < 0.99 ? ', discounted for how long it\'s been since you last practiced' : ''} — not just a flat percentage that never decays.
          </div>
        </div>
      )}
      <div style={{ fontSize: '13px', color: COLOR.text, marginBottom: '4px' }}>{config.length} questions</div>
      <div style={{ fontSize: '13px', color: COLOR.text, marginBottom: '4px' }}>{config.minutes}-minute time limit</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '16px', lineHeight: 1.5 }}>{config.passLabel}</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.6, marginBottom: '18px' }}>
        Multiple choice, true/false, and multi-select only, pulled from every category regardless of the current filter. No feedback until you submit, just like the real thing. Questions and order change each attempt.
      </div>
      {Array.isArray(config.resources) && config.resources.length > 0 && (
        <div style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}` }}>
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
      <button
        onClick={onStart}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', background: COLOR.gold, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
      >
        Start Practice Exam
      </button>
      <div style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', border: `1px solid ${COLOR.gold}`, background: `${COLOR.gold}14` }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: COLOR.gold, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          Final Mock — proctored-style
        </div>
        <div style={{ fontSize: '12px', color: COLOR.text, lineHeight: 1.6, marginBottom: '12px' }}>
          Same {config.length} questions and {config.minutes}-minute clock, stricter rules: each answer locks the moment you move on, there's no going back and no submitting early, and you see nothing — not even a running count — until the end. Scored as a straight pass/fail at the real pass mark, with a per-area breakdown like a real score report.
        </div>
        <button
          onClick={onStartFinal}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.gold}`, background: 'transparent', color: COLOR.gold, fontSize: '14px', fontWeight: 700 }}
        >
          Start Final Mock
        </button>
      </div>
    </div>
  );
}

function ExamQuestionView({ q, selectedIdx, onSelect }) {
  if (!q) return null;
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
      <div style={{ fontSize: '16px', lineHeight: 1.4, fontWeight: 500, marginBottom: q.image ? '10px' : '16px' }}>{q.question}</div>
      {q.image && REAL_PORTAL_SCREENSHOTS[q.image] && (
        <div style={{ marginBottom: '16px' }}>
          <RealPortalScreenshot shot={REAL_PORTAL_SCREENSHOTS[q.image]} hideDescription />
        </div>
      )}
      {q.type === 'mc' && (
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isSelected = i === selectedIdx;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                  border: `1px solid ${isSelected ? COLOR.primary : COLOR.border}`,
                  background: isSelected ? 'rgba(167,139,250,0.14)' : COLOR.surfaceRaised,
                  color: isSelected ? COLOR.primary : COLOR.text, fontSize: '14px', lineHeight: 1.4,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
      {q.type === 'tf' && (
        <div className="flex gap-2">
          {['True', 'False'].map((label, i) => {
            const isSelected = i === selectedIdx;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className="flex-1"
                style={{
                  padding: '16px', borderRadius: '12px',
                  border: `1px solid ${isSelected ? COLOR.primary : COLOR.border}`,
                  background: isSelected ? 'rgba(167,139,250,0.14)' : COLOR.surfaceRaised,
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
          <div style={{ fontSize: '11px', color: COLOR.gold, marginBottom: '8px', fontWeight: 600 }}>Select all that apply</div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const picked = Array.isArray(selectedIdx) ? selectedIdx : [];
              const isSelected = picked.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => onSelect(i)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                    border: `1px solid ${isSelected ? COLOR.primary : COLOR.border}`,
                    background: isSelected ? 'rgba(167,139,250,0.14)' : COLOR.surfaceRaised,
                    color: isSelected ? COLOR.primary : COLOR.text, fontSize: '14px', lineHeight: 1.4,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && <span>●</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const REVIEW_PREVIEW_COUNT = 5;

function ExamResults({ result, config, track, categories, onRestart, variant }) {
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
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '26px', textAlign: 'center' }}>
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
        <div className="mt-4" style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px' }}>
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
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.5 }}>
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
              <div key={i} style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: '10px', padding: '10px 12px', fontSize: '13px' }}>
                <div style={{ fontSize: '10px', color: COLOR.muted, marginBottom: '2px' }}>
                  {categories.find((c) => c.key === m.cat)?.label}{!m.answered ? ' — left blank' : ''}
                </div>
                <div>{m.prompt}</div>
                {m.explanation && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${COLOR.border}`, fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>
                    {m.explanation}
                  </div>
                )}
                {m.whyTested && (
                  <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '8px', background: `${COLOR.teal}14`, border: `1px solid ${COLOR.teal}`, fontSize: '11.5px', lineHeight: 1.5, color: COLOR.text }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: COLOR.teal, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Why this is tested</div>
                    {m.whyTested}
                  </div>
                )}
              </div>
            ))}
          </div>
          {missed.length > REVIEW_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllMissed((v) => !v)}
              style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.primary, fontSize: '13px', fontWeight: 600 }}
            >
              {showAllMissed ? 'Show fewer' : `Show all ${missed.length} missed questions`}
            </button>
          )}
        </div>
      )}
      <button
        onClick={onRestart}
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        {isFinal ? 'Back to exam options' : 'Take another exam'}
      </button>
    </div>
  );
}

