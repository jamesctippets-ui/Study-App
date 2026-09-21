/* ---------------- shared UI ---------------- */

function CategoryChip({ label, active, mastery, onClick }) {
  const tint = Math.round((mastery || 0) * 100);
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '7px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        border: `1px solid ${active ? COLOR.teal : COLOR.border}`,
        background: active ? 'rgba(63,167,150,0.14)' : COLOR.surface,
        color: active ? COLOR.teal : COLOR.muted,
      }}
      title={label === 'All' ? undefined : `${tint}% mastered`}
    >
      {label}
    </button>
  );
}

function FlashcardView({ card, flipped, setFlipped, onRate, index, total, categoryLabel, speakingId, onSpeak, speechSupported }) {
  if (!card) return null;
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
          <div style={{ fontSize: '15px', lineHeight: 1.55 }}>{card.back}</div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: COLOR.muted, textAlign: 'center', marginTop: '8px' }}>
        {flipped ? 'Tap to see the term again' : 'Tap the card to reveal the definition'}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onRate('incorrect')}
          className="flex-1"
          style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.red}`, color: COLOR.red, fontSize: '14px', fontWeight: 600, background: 'transparent' }}
        >
          ✕ Still learning
        </button>
        <button
          onClick={() => onRate('correct')}
          className="flex-1"
          style={{ padding: '12px', borderRadius: '12px', background: COLOR.teal, color: '#0E1210', fontSize: '14px', fontWeight: 600 }}
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}

function StudyEntry({ item }) {
  return (
    <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px' }}>
      <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{item.front}</div>
      <div style={{ fontSize: '13px', lineHeight: 1.5, color: COLOR.text, marginBottom: item.detail ? '8px' : 0 }}>{item.back}</div>
      {item.detail && (
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: COLOR.muted, borderLeft: `2px solid ${COLOR.teal}`, paddingLeft: '10px' }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

function StudyView({ activeCat, categories, flashcards }) {
  if (activeCat !== 'all') {
    const items = flashcards.filter((i) => i.cat === activeCat);
    return (
      <div className="flex flex-col gap-3">
        {items.map((item) => <StudyEntry key={item.id} item={item} />)}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {categories.map((c) => {
        const catItems = flashcards.filter((i) => i.cat === c.key);
        if (!catItems.length) return null;
        return (
          <div key={c.key}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>{c.label}</div>
            <div className="flex flex-col gap-3">
              {catItems.map((item) => <StudyEntry key={item.id} item={item} />)}
            </div>
          </div>
        );
      })}
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
        border: `1px solid ${isSpeaking ? COLOR.teal : COLOR.border}`,
        background: isSpeaking ? 'rgba(63,167,150,0.14)' : 'transparent',
        color: isSpeaking ? COLOR.teal : COLOR.muted, fontWeight: 600,
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
        <div style={{ fontSize: '11px', color: mastery >= 0.7 ? COLOR.teal : mastery > 0 ? COLOR.gold : COLOR.muted, fontWeight: 600 }}>{Math.round(mastery * 100)}%</div>
      </div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>{lesson.summary}</div>
    </button>
  );
}

function LessonDetail({ lesson, flashcardsData, onBack, onQuiz, speakingId, onSpeak, speechSupported }) {
  const [showFundamentals, setShowFundamentals] = useState(false);
  const vocabItems = lesson.vocabIds.map((id) => flashcardsData.find((f) => f.id === id)).filter(Boolean);
  const DiagramComp = lesson.diagram ? LESSON_DIAGRAMS[lesson.diagram] : null;
  const MockupComp = lesson.portalMockup ? PORTAL_MOCKUPS[lesson.portalMockup] : null;
  return (
    <div>
      <button onClick={onBack} style={{ fontSize: '12px', color: COLOR.teal, background: 'transparent', marginBottom: '12px', padding: 0 }}>
        ‹ All lessons
      </button>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '4px' }}>{lesson.title}</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '16px' }}>{lesson.summary}</div>

      {DiagramComp && (
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <DiagramComp />
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold }}>Reading</div>
          {speechSupported && <SpeakButton id={'read-' + lesson.id} text={lesson.reading.replace(/\n+/g, ' ')} speakingId={speakingId} onSpeak={onSpeak} />}
        </div>
        {lesson.reading.split('\n\n').map((p, i) => (
          <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.text, marginBottom: '10px' }}>{highlightTerms(p, lesson.keyTerms)}</p>
        ))}
      </div>

      {MockupComp && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '4px' }}>Portal mockup</div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>
            An illustration of the layout, not an exact screenshot — the real portal may look slightly different.
          </div>
          <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px' }}>
            <MockupComp />
          </div>
        </div>
      )}

      {lesson.scenario && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>Worked scenario</div>
          <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.teal}`, borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.text }}>{lesson.scenario}</p>
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
                style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.red}`, borderRadius: '10px', padding: '10px 12px', fontSize: '12.5px', lineHeight: 1.5, color: COLOR.text }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowFundamentals((s) => !s)}
        style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '12px', marginBottom: showFundamentals ? '0' : '16px', fontSize: '12px', color: COLOR.teal, fontWeight: 600 }}
      >
        {showFundamentals ? '▾ ' : '▸ '}{lesson.fundamentalsLabel}
      </button>
      {showFundamentals && (
        <div style={{ background: COLOR.surfaceRaised, borderRadius: '0 0 12px 12px', padding: '14px', marginBottom: '16px', borderLeft: `1px solid ${COLOR.border}`, borderRight: `1px solid ${COLOR.border}`, borderBottom: `1px solid ${COLOR.border}` }}>
          {speechSupported && (
            <div className="flex justify-end" style={{ marginBottom: '8px' }}>
              <SpeakButton id={'fund-' + lesson.id} text={lesson.fundamentals.replace(/\n+/g, ' ')} speakingId={speakingId} onSpeak={onSpeak} />
            </div>
          )}
          {lesson.fundamentals.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.text, marginBottom: '8px' }}>{p}</p>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>Vocabulary</div>
        <div className="flex flex-col gap-2">
          {vocabItems.map((item) => <StudyEntry key={item.id} item={item} />)}
        </div>
      </div>

      <button
        onClick={() => onQuiz(lesson.quizIds)}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', background: COLOR.teal, color: '#0E1210', fontSize: '14px', fontWeight: 600 }}
      >
        Take the {lesson.quizIds.length}-question quiz
      </button>
    </div>
  );
}

function CourseView({ lessons, flashcardsData, onQuiz, speakingId, onSpeak, speechSupported, masteryFn }) {
  const [lessonId, setLessonId] = useState(null);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (lesson) {
    return (
      <LessonDetail
        lesson={lesson}
        flashcardsData={flashcardsData}
        onBack={() => setLessonId(null)}
        onQuiz={onQuiz}
        speakingId={speakingId}
        onSpeak={onSpeak}
        speechSupported={speechSupported}
      />
    );
  }
  const masteredCount = lessons.filter((l) => masteryFn(l) >= 0.7).length;
  const avgMastery = lessons.length ? lessons.reduce((sum, l) => sum + masteryFn(l), 0) / lessons.length : 0;
  return (
    <div>
      <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: COLOR.muted }}>Course progress</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: masteredCount === lessons.length ? COLOR.teal : COLOR.text }}>
            {masteredCount} of {lessons.length} lessons strong
          </div>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: COLOR.surfaceRaised, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(avgMastery * 100)}%`, background: COLOR.teal, borderRadius: '3px' }} />
        </div>
      </div>
      {lessons.map((l) => (
        <LessonCard key={l.id} lesson={l} mastery={masteryFn(l)} onOpen={() => setLessonId(l.id)} />
      ))}
    </div>
  );
}

function QuizSetup({ length, setLength, types, toggleType, onReroll, poolSize, missedCount, onReviewMissed }) {
  const lengths = [5, 10, 15, 25];
  return (
    <div style={{ marginBottom: '14px' }}>
      {missedCount > 0 && (
        <button
          onClick={onReviewMissed}
          style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '12px', border: `1px solid ${COLOR.red}`, background: 'rgba(193,85,74,0.1)', color: COLOR.red, fontSize: '13px', fontWeight: 600 }}
        >
          Review {missedCount} missed question{missedCount === 1 ? '' : 's'}
        </button>
      )}
      <div className="flex justify-between items-center mb-2">
        <div style={{ fontSize: '11px', color: COLOR.muted }}>{poolSize} questions match this filter</div>
        <button
          onClick={onReroll}
          style={{ fontSize: '11px', color: COLOR.teal, background: 'transparent', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${COLOR.teal}` }}
        >
          New quiz
        </button>
      </div>
      <div className="flex gap-2 mb-2" style={{ overflowX: 'auto', paddingBottom: '2px' }}>
        {lengths.map((n) => (
          <button
            key={n}
            onClick={() => setLength(n)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
              border: `1px solid ${length === n ? COLOR.teal : COLOR.border}`,
              background: length === n ? 'rgba(63,167,150,0.14)' : COLOR.surface,
              color: length === n ? COLOR.teal : COLOR.muted,
            }}
          >
            {n} questions
          </button>
        ))}
      </div>
      <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '2px' }}>
        {[['mc', 'Multiple choice'], ['ms', 'Multi-select'], ['tf', 'True / False']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleType(key)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
              border: `1px solid ${types[key] ? COLOR.gold : COLOR.border}`,
              background: types[key] ? 'rgba(227,178,60,0.14)' : COLOR.surface,
              color: types[key] ? COLOR.gold : COLOR.muted,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionView({ q, selected, onChoose, onNext, index, total, categoryLabel, missedBadge, msPending, onToggleMs, onSubmitMs }) {
  if (!q) return null;
  const isLast = index + 1 >= total;
  return (
    <div>
      <div className="flex justify-between items-center mb-2" style={{ fontSize: '11px', color: COLOR.muted }}>
        <span>{missedBadge ? 'Missed review · ' : ''}{categoryLabel}</span>
        <span>{index + 1} / {total}</span>
      </div>
      <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
        <div style={{ fontSize: '16px', lineHeight: 1.4, fontWeight: 500, marginBottom: '16px' }}>{q.question}</div>

        {q.type === 'mc' && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isSelected = i === selected;
              let bg = COLOR.surfaceRaised, border = COLOR.border, color = COLOR.text;
              if (selected !== null) {
                if (isCorrect) { bg = 'rgba(63,167,150,0.15)'; border = COLOR.teal; color = COLOR.teal; }
                else if (isSelected) { bg = 'rgba(193,85,74,0.15)'; border = COLOR.red; color = COLOR.red; }
              }
              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => onChoose(i)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                    border: `1px solid ${border}`, background: bg, color, fontSize: '14px', lineHeight: 1.4,
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
                if (isRight) { bg = 'rgba(63,167,150,0.15)'; border = COLOR.teal; color = COLOR.teal; }
                else if (isSelected) { bg = 'rgba(193,85,74,0.15)'; border = COLOR.red; color = COLOR.red; }
              }
              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => onChoose(i)}
                  className="flex-1"
                  style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${border}`, background: bg, color, fontSize: '15px', fontWeight: 600, cursor: selected !== null ? 'default' : 'pointer' }}
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
                  if (isCorrectOpt && wasSelected) { bg = 'rgba(63,167,150,0.15)'; border = COLOR.teal; color = COLOR.teal; }
                  else if (isCorrectOpt && !wasSelected) { border = COLOR.teal; color = COLOR.teal; }
                  else if (!isCorrectOpt && wasSelected) { bg = 'rgba(193,85,74,0.15)'; border = COLOR.red; color = COLOR.red; }
                } else if (wasSelected) {
                  bg = 'rgba(63,167,150,0.10)'; border = COLOR.teal; color = COLOR.teal;
                }
                return (
                  <button
                    key={i}
                    disabled={selected !== null}
                    onClick={() => onToggleMs(i)}
                    style={{
                      textAlign: 'left', padding: '12px 14px', borderRadius: '12px',
                      border: `1px solid ${border}`, background: bg, color, fontSize: '14px', lineHeight: 1.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: selected !== null ? 'default' : 'pointer',
                    }}
                  >
                    <span>{opt}</span>
                    {selected !== null && isCorrectOpt && wasSelected && <span>✓</span>}
                    {selected !== null && isCorrectOpt && !wasSelected && <span style={{ fontSize: '9px' }}>missed</span>}
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
                style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: '12px', background: msPending.length ? COLOR.teal : COLOR.surfaceRaised, color: msPending.length ? '#0E1210' : COLOR.muted, fontSize: '14px', fontWeight: 600 }}
              >
                Submit answer
              </button>
            )}
          </div>
        )}

        {selected !== null && q.explanation && (
          <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: COLOR.surfaceRaised, fontSize: '13px', lineHeight: 1.5, color: COLOR.muted }}>
            {q.explanation}
          </div>
        )}
      </div>

      {selected !== null && (
        <button
          onClick={onNext}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', background: COLOR.teal, color: '#0E1210', fontSize: '14px', fontWeight: 600 }}
        >
          {isLast ? 'See results' : 'Next question'}
        </button>
      )}
    </div>
  );
}

function QuizSummary({ score, answers, categories, onRestart }) {
  const missed = answers.filter((a) => !a.correct);
  return (
    <div>
      <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '28px', fontWeight: 600, color: COLOR.teal }}>{score.correct} / {score.total}</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginTop: '4px' }}>correct this round</div>
      </div>
      {missed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Worth another look:</div>
          <div className="flex flex-col gap-2">
            {missed.map((m, i) => (
              <div key={i} style={{ background: COLOR.surfaceRaised, borderRadius: '10px', padding: '10px 12px', fontSize: '13px' }}>
                <div style={{ fontSize: '10px', color: COLOR.muted, marginBottom: '2px' }}>{categories.find((c) => c.key === m.cat)?.label}</div>
                <div>{m.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onRestart}
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.teal, color: '#0E1210', fontSize: '14px', fontWeight: 600 }}
      >
        New quiz
      </button>
    </div>
  );
}

