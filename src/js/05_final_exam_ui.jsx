/* ---------------- final exam UI ---------------- */

function ExamIntro({ track, config, onStart }) {
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px' }}>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '12px' }}>{track.label} Final Exam</div>
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
        Start Exam
      </button>
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

function ExamResults({ result, config, track, categories, onRestart }) {
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const missed = result.items.filter((i) => !i.correct);
  const isItil = track.key === 'itil';
  const onTarget = pct >= config.passPct;
  return (
    <div>
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '26px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '30px', fontWeight: 600, color: onTarget ? COLOR.success : COLOR.red }}>{result.correct} / {result.total}</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginTop: '4px' }}>{pct}% correct</div>
        {isItil ? (
          <div style={{ marginTop: '10px', fontSize: '15px', fontWeight: 700, color: onTarget ? COLOR.success : COLOR.red }}>
            {onTarget ? 'PASS' : 'Below the pass mark'}
          </div>
        ) : (
          <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: onTarget ? COLOR.success : COLOR.gold }}>
            {onTarget ? 'On track, comfortably above the buffer' : 'Below the safety buffer'}
          </div>
        )}
        <div style={{ marginTop: '6px', fontSize: '11px', color: COLOR.muted, lineHeight: 1.5 }}>{config.passLabel}</div>
      </div>
      {missed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Review these:</div>
          <div className="flex flex-col gap-2">
            {missed.map((m, i) => (
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
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onRestart}
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
      >
        Take another exam
      </button>
    </div>
  );
}

