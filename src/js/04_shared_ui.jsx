/* ---------------- shared UI ---------------- */

function AchievementToast({ achievement }) {
  if (!achievement) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 60, background: COLOR.surfaceRaised, border: `1px solid ${COLOR.gold}`, borderRadius: '14px',
        padding: '12px 16px', boxShadow: SHADOW.card, display: 'flex', alignItems: 'center', gap: '10px',
        maxWidth: '90vw', animation: 'achievementIn 0.25s ease', pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: '22px' }}>{achievement.icon}</div>
      <div>
        <div style={{ fontSize: '10.5px', color: COLOR.gold, fontWeight: 700, letterSpacing: '0.02em' }}>ACHIEVEMENT UNLOCKED</div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: COLOR.text }}>{achievement.title}</div>
      </div>
    </div>
  );
}

function AchievementsPanel({ achievements, streak, onClose }) {
  useEscapeToClose(onClose);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Achievements</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '14px' }}>
          {unlockedCount} / {achievements.length} unlocked
          {streak.current > 0 ? ` · 🔥 ${streak.current}-day streak` : ''}
          {streak.current > 0 && streak.longest > streak.current ? ` (best ${streak.longest})` : ''}
        </div>
        <div className="flex flex-col gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px',
                background: a.unlocked ? 'rgba(211,164,101,0.12)' : COLOR.surface,
                border: `1px solid ${a.unlocked ? COLOR.gold : COLOR.border}`,
                opacity: a.unlocked ? 1 : 0.75,
              }}
            >
              <div style={{ fontSize: '22px', filter: a.unlocked ? 'none' : 'grayscale(1)', flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: a.unlocked ? COLOR.gold : COLOR.text }}>{a.title}</div>
                <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.4 }}>{a.description}</div>
                {!a.unlocked && a.progress[1] > 1 && (
                  <div style={{ height: '4px', borderRadius: '2px', background: COLOR.surfaceRaised, marginTop: '7px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((a.progress[0] / a.progress[1]) * 100)}%`, background: COLOR.muted, borderRadius: '2px' }} />
                  </div>
                )}
              </div>
              {a.unlocked && <div style={{ fontSize: '13px', color: COLOR.success, fontWeight: 700, flexShrink: 0 }}>✓</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataPanel({
  trackLabel, onExport, onImportFile, importMessage, onReset, onClose,
  speechSupported, ttsVoices, ttsRate, ttsVoiceURI, onSetTtsRate, onSetTtsVoiceURI, onTestVoice, isTestSpeaking,
}) {
  useEscapeToClose(onClose);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);
  // English voices first (this app's own content is all English), but never
  // hide the rest — a bilingual user may still want their OS's other voices.
  const sortedVoices = useMemo(() => {
    if (!ttsVoices || !ttsVoices.length) return [];
    return [...ttsVoices].sort((a, b) => {
      const aEn = a.lang.startsWith('en') ? 0 : 1;
      const bEn = b.lang.startsWith('en') ? 0 : 1;
      if (aEn !== bEn) return aEn - bEn;
      return a.name.localeCompare(b.name);
    });
  }, [ttsVoices]);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Data & Progress</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>

        {speechSupported && (
          <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Voice &amp; speech</div>
            <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
              Controls every 🔊 Listen button, plus Verbal Quiz mode. Saved on this device only.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Speed</span>
              <span style={{ color: COLOR.muted }}>{ttsRate.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={ttsRate}
              onChange={(e) => onSetTtsRate(parseFloat(e.target.value))}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Voice</div>
            <select
              value={ttsVoiceURI || ''}
              onChange={(e) => onSetTtsVoiceURI(e.target.value)}
              style={{
                width: '100%', padding: '9px 10px', borderRadius: '10px', marginBottom: '10px',
                background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, color: COLOR.text, fontSize: '13px',
              }}
            >
              <option value="">Browser default</option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <button
              onClick={onTestVoice}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'transparent', border: `1px solid ${COLOR.primary}`, color: COLOR.primary, fontSize: '13px', fontWeight: 600 }}
            >
              {isTestSpeaking ? '⏸ Stop' : '▶ Test voice'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Export progress</div>
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
            Download every track's quiz/exam history, flashcard mastery, streak, and achievements as a JSON file — a backup, or a way to move progress to a new device.
          </div>
          <button
            onClick={onExport}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}
          >
            ⬇ Export progress
          </button>
        </div>

        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Import progress</div>
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
            Restore from a previously exported file. This replaces all progress currently saved in this browser.
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) onImportFile(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'transparent', border: `1px solid ${COLOR.primary}`, color: COLOR.primary, fontSize: '13px', fontWeight: 600 }}
          >
            ⬆ Import progress
          </button>
          {importMessage && (
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: importMessage.ok ? COLOR.success : COLOR.red, lineHeight: 1.4 }}>
              {importMessage.text}
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Reset progress</div>
          {!confirmingReset ? (
            <>
              <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
                Clear saved progress for {trackLabel} only. Other tracks are unaffected.
              </div>
              <button
                onClick={() => setConfirmingReset(true)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'transparent', border: `1px solid ${COLOR.red}`, color: COLOR.red, fontSize: '13px', fontWeight: 600 }}
              >
                Clear progress for {trackLabel}
              </button>
            </>
          ) : (
            <div>
              <div style={{ fontSize: '12.5px', marginBottom: '8px' }}>Clear saved progress for {trackLabel}? Export a backup first if you're not sure.</div>
              <div className="flex gap-2">
                <button onClick={() => { onReset(); setConfirmingReset(false); }} style={{ flex: 1, background: COLOR.red, color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 600 }}>Clear it</button>
                <button onClick={() => setConfirmingReset(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLOR.border}`, color: COLOR.text, borderRadius: '8px', padding: '8px', fontSize: '13px' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MODE_LABELS = { learn: 'Learn', quiz: 'Quiz', exam: 'Exam' };

// A small self-set "study N cards/questions today" ring — cheap to build
// since it just tallies activity already recorded elsewhere (flashcard
// ratings, quiz/exam questions answered) via stats.dailyGoal, rather than
// tracking anything new per-item. Tapping the ring opens a small +/-
// stepper to change the target; the ring itself never resets the count —
// that only happens the next time recordDailyActivity sees a new day.
function DailyGoalRing({ dailyGoal, onSetTarget }) {
  const [editing, setEditing] = useState(false);
  const target = dailyGoal.target;
  const count = dailyGoal.date === todayString() ? dailyGoal.count : 0;
  const pct = target > 0 ? Math.min(1, count / target) : 0;
  const met = count >= target;
  const size = 40, stroke = 4, r = (size - stroke) / 2, circumference = 2 * Math.PI * r;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px',
      padding: '10px 12px', borderRadius: '14px', background: COLOR.surface,
      border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
    }}>
      <button
        onClick={() => setEditing((e) => !e)}
        title="Tap to adjust your daily goal"
        style={{ position: 'relative', width: size, height: size, flexShrink: 0, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke={COLOR.border} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={met ? COLOR.success : COLOR.primary}
            strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: met ? '15px' : '11px', fontWeight: 700, color: met ? COLOR.success : COLOR.text,
        }}>
          {met ? '✓' : count}
        </div>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', fontWeight: 600, color: COLOR.text }}>
          {count} / {target} today
        </div>
        <div style={{ fontSize: '10.5px', color: COLOR.muted }}>Daily goal · tap the ring to change it</div>
      </div>
      {editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onSetTarget(Math.max(5, target - 5))}
            style={{ width: '26px', height: '26px', borderRadius: '8px', border: `1px solid ${COLOR.border}`, background: COLOR.surfaceRaised, color: COLOR.text, fontSize: '15px', lineHeight: 1 }}
          >
            −
          </button>
          <span style={{ fontSize: '12px', color: COLOR.muted, minWidth: '18px', textAlign: 'center' }}>{target}</span>
          <button
            onClick={() => onSetTarget(target + 5)}
            style={{ width: '26px', height: '26px', borderRadius: '8px', border: `1px solid ${COLOR.border}`, background: COLOR.surfaceRaised, color: COLOR.text, fontSize: '15px', lineHeight: 1 }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// A collapsed-by-default disclosure for the full track list — same rich
// rows (colored label, subtitle, mastery %/passed/scheduled badge) the
// old hamburger bottom-sheet menu showed, just tucked behind a single
// summary row instead of always taking up the whole page, since Home now
// has several other widgets competing for the same space.
function TrackListDropdown({ tracks, masteries, certPlan, onSelectTrack }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '12px', background: COLOR.surface,
          border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: COLOR.text }}>All tracks ({tracks.length})</span>
        <span style={{ fontSize: '11px', color: COLOR.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
          {masteries.map(({ track: t, pct }) => {
            const accent = trackAccent(t.key);
            const isCompleted = !!certPlan.completed[t.key];
            const scheduledDate = certPlan.scheduled[t.key];
            return (
              <button
                key={t.key}
                onClick={() => onSelectTrack(t.key)}
                style={{
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px',
                  background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: accent }}>{t.label}</div>
                  <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px' }}>{t.subtitle}</div>
                </div>
                {isCompleted ? (
                  <div title="Passed" style={{ fontSize: '13px', fontWeight: 700, color: COLOR.success, flexShrink: 0 }}>✓ Passed</div>
                ) : scheduledDate ? (
                  <div title="Scheduled" style={{ fontSize: '10.5px', fontWeight: 600, color: COLOR.gold, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatDateShort(scheduledDate)}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted, flexShrink: 0 }}>{pct}%</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// A single standalone question, answered once and done — not part of any
// quiz session, so it keeps its own local selection state rather than
// touching the app's session/msPending state, and reuses QuestionView
// (hideMeta + hideNext) for visual consistency with every other question
// in the app instead of a bespoke look. `stored` is the persisted
// {selected, correct} from stats.dailyChallenge if today's question was
// already answered (e.g. on a revisit later the same day); otherwise the
// question starts unanswered.
function DailyQuestionCard({ q, trackLabel, stored, onAnswer }) {
  const [selected, setSelected] = useState(stored ? stored.selected : null);
  const [msPending, setMsPending] = useState([]);
  useEffect(() => { setSelected(stored ? stored.selected : null); setMsPending([]); }, [q.id, stored]);

  const choose = (idx) => {
    if (selected !== null) return;
    let isCorrect;
    if (q.type === 'mc') isCorrect = idx === q.correct;
    else if (q.type === 'tf') isCorrect = (idx === 0) === q.answer;
    else return;
    setSelected(idx);
    onAnswer(isCorrect, idx);
  };
  const toggleMs = (idx) => {
    if (selected !== null) return;
    setMsPending((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };
  const submitMs = () => {
    if (selected !== null || msPending.length === 0) return;
    const picked = [...msPending].sort();
    const correctSet = [...q.correct].sort();
    const isCorrect = picked.length === correctSet.length && picked.every((v, i) => v === correctSet[i]);
    setSelected(picked);
    onAnswer(isCorrect, picked);
  };

  return (
    <div className="mb-4">
      <div style={{ fontSize: '11px', color: COLOR.gold, fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Question of the day · {trackLabel}
      </div>
      <QuestionView
        q={q}
        selected={selected}
        onChoose={choose}
        onNext={() => {}}
        index={0}
        total={1}
        hideMeta
        hideNext
        msPending={msPending}
        onToggleMs={toggleMs}
        onSubmitMs={submitMs}
        flashcardsData={DATA[q.__homeTrack]?.flashcards}
      />
      {selected !== null && (
        <div style={{ fontSize: '10.5px', color: COLOR.muted, textAlign: 'center', marginTop: '6px' }}>
          New question tomorrow.
        </div>
      )}
    </div>
  );
}

// A single flashcard shown as a passive daily lookup rather than a rated
// review — no "Got it/Still learning" here, since it's meant to be a
// fast glance rather than another SRS-scored rep. Revealing it still
// counts toward the daily goal ring (it's real study time), just not
// toward mastery/SRS scheduling the way an actual rating would.
function DailyVocabCard({ card, trackLabel, revealed, onReveal }) {
  return (
    <div className="mb-4">
      <div style={{ fontSize: '11px', color: COLOR.primary, fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Vocab of the day · {trackLabel}
      </div>
      <div
        onClick={() => { if (!revealed) onReveal(); }}
        style={{
          boxShadow: SHADOW.card, background: revealed ? COLOR.surfaceRaised : COLOR.surface,
          border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '22px 20px', minHeight: '96px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', cursor: revealed ? 'default' : 'pointer',
        }}
      >
        <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600, marginBottom: revealed ? '10px' : 0 }}>{card.front}</div>
        {revealed && <div style={{ fontSize: '14px', lineHeight: 1.55, color: COLOR.muted }}>{card.back}</div>}
      </div>
      <div style={{ fontSize: '10.5px', color: COLOR.muted, textAlign: 'center', marginTop: '6px' }}>
        {revealed ? 'New term tomorrow.' : 'Tap to reveal the definition'}
      </div>
    </div>
  );
}

// Turns a readinessProjection() result into the one-line honest-effort
// message shown under Home's readiness card — see 03_helpers.js for why
// most branches deliberately avoid a specific date.
function readinessProjectionMessage(projection, trackLabel) {
  if (projection.status === 'ready') return `Tracking as exam-ready for ${trackLabel} right now.`;
  if (projection.status === 'projected') {
    return `At your current pace, ${trackLabel} could be exam-ready in about ${projection.daysNeeded} day${projection.daysNeeded === 1 ? '' : 's'} (around ${formatDateShort(projection.projectedDate)}).`;
  }
  if (projection.status === 'flat') return `Pace hasn't picked up yet — answer a few more ${trackLabel} questions to get a projection.`;
  return `Keep practicing ${trackLabel} over a few more days to get a readiness projection.`;
}

// The app's landing screen — shown on every load instead of auto-resuming
// the last track+mode, so there's always a real overview to start from
// rather than dropping straight back into whatever you were doing. The
// full track list lives in a collapsed-by-default dropdown (no
// path-grouping — just every track once, mastery % included) rather than
// always taking up the whole page, since Question of the Day/Daily Vocab/
// readiness now share the space. Reachable again from any track's Learn/
// Quiz/Exam view via the header's Home button.
function HomeView({ tracks, results, seenLog, stats, certPlan, onResume, onSelectTrack, onOpenAbout, onOpenGlossary, onOpenCertPath, onSetGoalTarget, onAnswerDailyQuestion, onRevealDailyVocab }) {
  const masteries = tracks.map((t) => ({ track: t, pct: trackMastery(t.key, results) }));
  const overallAvg = masteries.length ? Math.round(masteries.reduce((s, m) => s + m.pct, 0) / masteries.length) : 0;
  const lastVisited = stats.lastVisited;
  const resumeTrack = lastVisited ? tracks.find((t) => t.key === lastVisited.track) : null;
  const nextPathKey = nextInCertPath(certPlan);
  const nextPathTrack = nextPathKey ? tracks.find((t) => t.key === nextPathKey) : null;
  const nextPathScheduled = nextPathTrack && certPlan.scheduled[nextPathTrack.key];
  const nextPathDaysUntil = nextPathScheduled ? daysBetween(todayString(), nextPathScheduled) : null;

  const focusKey = focusTrackKey(certPlan, lastVisited);
  const focusTrack = tracks.find((t) => t.key === focusKey);
  const focusLabel = focusTrack ? focusTrack.label : focusKey;
  const today = todayString();
  const challenge = stats.dailyChallenge && stats.dailyChallenge.date === today ? stats.dailyChallenge : null;

  const qPool = DATA[focusKey].questions;
  const dailyQuestion = qPool.length ? { ...qPool[seededIndex(`${today}:${focusKey}:q`, qPool.length)], __homeTrack: focusKey } : null;
  const storedQuestion = challenge && challenge.question && dailyQuestion && challenge.question.id === dailyQuestion.id ? challenge.question : null;

  const vPool = DATA[focusKey].flashcards;
  const dailyVocab = vPool.length ? vPool[seededIndex(`${today}:${focusKey}:v`, vPool.length)] : null;
  const vocabRevealed = !!(challenge && challenge.vocab && dailyVocab && challenge.vocab.id === dailyVocab.id && challenge.vocab.revealed);

  const readiness = examReadiness(focusKey, results, seenLog);
  const projection = readinessProjection(stats.readinessHistory || {}, focusKey, 80);
  const readinessColor = READINESS_COLOR[readiness.label] || COLOR.muted;

  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '14px' }}>
        {stats.streak.current > 0 ? `🔥 ${stats.streak.current}-day streak · ` : ''}{overallAvg}% average mastery across {tracks.length} tracks
      </div>

      <DailyGoalRing dailyGoal={stats.dailyGoal} onSetTarget={onSetGoalTarget} />

      {readiness.label !== 'Not started' && (
        <div style={{
          marginBottom: '14px', padding: '12px 14px', borderRadius: '14px',
          background: `${readinessColor}1F`, border: `1px solid ${readinessColor}`, boxShadow: SHADOW.card,
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{focusLabel} readiness</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: readinessColor }}>{readiness.score}%</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: readinessColor }}>{readiness.label}</div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>
            {readinessProjectionMessage(projection, focusLabel)}
          </div>
        </div>
      )}

      <button
        onClick={onOpenCertPath}
        style={{
          width: '100%', textAlign: 'left', marginBottom: '10px', padding: '12px 14px', borderRadius: '14px',
          background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '2px' }}>My Cert Path</div>
          {nextPathTrack ? (
            <div style={{ fontSize: '14px', fontWeight: 600, color: trackAccent(nextPathTrack.key) }}>
              Up next: {nextPathTrack.label}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: COLOR.text }}>Put your certs in the order you plan to take them</div>
          )}
        </div>
        {nextPathScheduled ? (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: nextPathDaysUntil < 0 ? COLOR.red : nextPathDaysUntil <= 7 ? COLOR.gold : COLOR.text }}>
              {nextPathDaysUntil < 0 ? `${-nextPathDaysUntil}d over` : nextPathDaysUntil === 0 ? 'Today' : nextPathDaysUntil === 1 ? '1 day' : `${nextPathDaysUntil} days`}
            </div>
            <div style={{ fontSize: '9.5px', color: COLOR.muted }}>{formatDateShort(nextPathScheduled)}</div>
          </div>
        ) : (
          <div style={{ color: COLOR.muted, fontSize: '15px', flexShrink: 0 }}>›</div>
        )}
      </button>

      {resumeTrack && (
        <button
          onClick={onResume}
          style={{
            width: '100%', textAlign: 'left', marginBottom: '14px', padding: '14px 16px', borderRadius: '14px',
            background: `${trackAccent(resumeTrack.key)}1F`, border: `1px solid ${trackAccent(resumeTrack.key)}`,
            boxShadow: SHADOW.card,
          }}
        >
          <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '2px' }}>Continue where you left off</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: trackAccent(resumeTrack.key) }}>
            {resumeTrack.label} · {MODE_LABELS[lastVisited.mode] || 'Learn'}
          </div>
        </button>
      )}

      {dailyQuestion && (
        <DailyQuestionCard
          q={dailyQuestion}
          trackLabel={focusLabel}
          stored={storedQuestion}
          onAnswer={(isCorrect, selected) => onAnswerDailyQuestion(focusKey, dailyQuestion, isCorrect, selected)}
        />
      )}

      {dailyVocab && (
        <DailyVocabCard
          card={dailyVocab}
          trackLabel={focusLabel}
          revealed={vocabRevealed}
          onReveal={() => onRevealDailyVocab(focusKey, dailyVocab)}
        />
      )}

      <TrackListDropdown tracks={tracks} masteries={masteries} certPlan={certPlan} onSelectTrack={onSelectTrack} />

      <button
        onClick={onOpenGlossary}
        style={{
          width: '100%', textAlign: 'left', marginTop: '10px', padding: '12px 14px', borderRadius: '12px',
          background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: SHADOW.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.text }}>Glossary</div>
        <div style={{ color: COLOR.muted, fontSize: '15px' }}>›</div>
      </button>

      <button
        onClick={onOpenAbout}
        className="btn-flat"
        style={{ width: '100%', textAlign: 'center', marginTop: '10px', padding: '8px', fontSize: '11.5px', color: COLOR.muted, background: 'transparent' }}
      >
        About & Legal
      </button>
    </div>
  );
}

// A personal, user-ordered sequence of certs (distinct from the removed
// "Learning Paths" feature, which was curated multi-track groupings — this
// is whichever certs the user themselves adds, in whichever order they
// place them). `certPlan.order` holds every track they've added; a
// completed one stays in that array (so un-completing it restores its
// spot) but is filtered out of the active list below and shown in the
// collapsed Completed section instead — the "automatically hides ones you
// complete" behavior the user asked for. The "Up next" card is just the
// first non-completed entry, so finishing one automatically promotes the
// next without any explicit re-ordering step.
function CertPathPanel({ tracks, certPlan, onAddTrack, onRemoveTrack, onMove, onSetScheduled, onToggleCompleted, onGoToTrack, onStartMix, onClose }) {
  useEscapeToClose(onClose);
  const [addingKey, setAddingKey] = useState('');
  const [completedOpen, setCompletedOpen] = useState(false);
  const trackByKey = (key) => tracks.find((t) => t.key === key);
  const activeOrder = certPlan.order.filter((k) => !certPlan.completed[k] && trackByKey(k));
  const completedOrder = certPlan.order.filter((k) => certPlan.completed[k] && trackByKey(k));
  const addable = tracks.filter((t) => !certPlan.order.includes(t.key));
  const nextKey = activeOrder[0] || null;
  const nextTrack = nextKey ? trackByKey(nextKey) : null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>My Cert Path</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>
        <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '14px', lineHeight: 1.4 }}>
          Put your certs in the order you plan to take them. We'll always show which one's next, and mark one passed to move it out of the way.
        </div>

        {nextTrack && (
          <div style={{
            marginBottom: '16px', padding: '14px 16px', borderRadius: '14px',
            background: `${trackAccent(nextTrack.key)}1F`, border: `1px solid ${trackAccent(nextTrack.key)}`, boxShadow: SHADOW.card,
          }}>
            <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '2px' }}>Up next</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: trackAccent(nextTrack.key) }}>
              {nextTrack.label} <span style={{ fontWeight: 400, color: COLOR.muted, fontSize: '12px' }}>· {nextTrack.subtitle}</span>
            </div>
            {certPlan.scheduled[nextTrack.key] && (
              <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px' }}>Scheduled {formatScheduledLabel(certPlan.scheduled[nextTrack.key])}</div>
            )}
            <button
              onClick={() => onGoToTrack(nextTrack.key)}
              style={{ marginTop: '10px', padding: '8px 14px', borderRadius: '9px', background: trackAccent(nextTrack.key), color: COLOR.onAccent, fontSize: '12.5px', fontWeight: 600 }}
            >
              Go to {nextTrack.label} →
            </button>
          </div>
        )}

        {activeOrder.length >= 2 && (
          <button
            onClick={() => { onStartMix(); onClose(); }}
            style={{
              width: '100%', marginBottom: '16px', padding: '12px 14px', borderRadius: '12px',
              background: COLOR.surfaceRaised, border: `1px solid ${COLOR.primary}`, textAlign: 'left',
            }}
          >
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: COLOR.primary }}>Start Today's Mix</span>
              <span style={{ fontSize: '13px', color: COLOR.primary }}>→</span>
            </div>
            <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>
              One quiz blending all {activeOrder.length} active certs, weighted so {nextTrack?.label || 'your top cert'} gets primary coverage and the rest supplement it.
            </div>
          </button>
        )}

        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>
          Your path{activeOrder.length ? ` (${activeOrder.length})` : ''}
        </div>
        {activeOrder.length === 0 && (
          <div style={{ fontSize: '12px', color: COLOR.muted, padding: '12px', border: `1px dashed ${COLOR.border}`, borderRadius: '12px', marginBottom: '12px' }}>
            Add a cert below to start building your path.
          </div>
        )}
        <div className="flex flex-col gap-2" style={{ marginBottom: '16px' }}>
          {activeOrder.map((key, i) => {
            const t = trackByKey(key);
            const accent = trackAccent(key);
            const scheduledDate = certPlan.scheduled[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
                <div style={{ fontSize: '12px', color: COLOR.muted, width: '14px', flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: accent }}>{t.label}</div>
                  <input
                    type="date"
                    value={scheduledDate || ''}
                    onChange={(e) => onSetScheduled(key, e.target.value || null)}
                    style={{ marginTop: '4px', fontSize: '11px', color: COLOR.muted, background: 'transparent', border: `1px solid ${COLOR.border}`, borderRadius: '6px', padding: '3px 5px', maxWidth: '130px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <button onClick={() => onMove(key, 'up')} disabled={i === 0} title="Move up" className="btn-flat" style={{ opacity: i === 0 ? 0.3 : 1, color: COLOR.muted, fontSize: '10px', padding: '2px 5px', lineHeight: 1 }}>▲</button>
                  <button onClick={() => onMove(key, 'down')} disabled={i === activeOrder.length - 1} title="Move down" className="btn-flat" style={{ opacity: i === activeOrder.length - 1 ? 0.3 : 1, color: COLOR.muted, fontSize: '10px', padding: '2px 5px', lineHeight: 1 }}>▼</button>
                </div>
                <button
                  onClick={() => onToggleCompleted(key)}
                  title="Mark passed"
                  style={{ flexShrink: 0, fontSize: '11px', fontWeight: 600, color: COLOR.success, background: 'transparent', border: `1px solid ${COLOR.success}`, borderRadius: '8px', padding: '6px 8px' }}
                >
                  Passed
                </button>
                <button onClick={() => onRemoveTrack(key)} title="Remove from path" className="btn-flat" style={{ color: COLOR.muted, fontSize: '13px', padding: '2px 4px', flexShrink: 0 }}>✕</button>
              </div>
            );
          })}
        </div>

        {addable.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '6px' }}>Add a cert to your path</div>
            <div className="flex gap-2">
              <select
                value={addingKey}
                onChange={(e) => setAddingKey(e.target.value)}
                style={{ flex: 1, minWidth: 0, padding: '9px', borderRadius: '9px', background: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.text, fontSize: '13px' }}
              >
                <option value="">Choose a cert…</option>
                {addable.map((t) => <option key={t.key} value={t.key}>{t.label} — {t.subtitle}</option>)}
              </select>
              <button
                onClick={() => { if (addingKey) { onAddTrack(addingKey); setAddingKey(''); } }}
                disabled={!addingKey}
                style={{ padding: '9px 14px', borderRadius: '9px', background: addingKey ? COLOR.primary : COLOR.surfaceRaised, color: addingKey ? COLOR.onAccent : COLOR.muted, fontSize: '13px', fontWeight: 600, flexShrink: 0 }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {completedOrder.length > 0 && (
          <div>
            <button
              onClick={() => setCompletedOpen((o) => !o)}
              style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '10px 12px', fontSize: '12.5px', color: COLOR.text, fontWeight: 600 }}
            >
              {completedOpen ? '▾ ' : '▸ '}Completed ({completedOrder.length})
            </button>
            {completedOpen && (
              <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
                {completedOrder.map((key) => {
                  const t = trackByKey(key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
                      <div style={{ fontSize: '13px', color: COLOR.success, flexShrink: 0 }}>✓</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.text }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px' }}>Passed {formatDateShort(certPlan.completed[key])}</div>
                      </div>
                      <button onClick={() => onToggleCompleted(key)} className="btn-flat" style={{ color: COLOR.muted, fontSize: '11px', padding: '4px 6px', flexShrink: 0 }}>Undo</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// A single bottom-sheet, same visual pattern as every other panel, holding
// everything that isn't study content but still needs to live somewhere:
// what the app is, what's changed recently, and the legal basics (Terms,
// Privacy, disclaimer). Kept as one panel with collapsible sections rather
// than separate screens/routes — this is a single static HTML file with no
// real routing, and folding it into the existing hamburger menu (as an
// "About & Legal" link) means zero new header chrome. Content here
// reflects today's actual data footprint (no accounts, no PII, no cookies)
// and should be revisited if that ever changes — see LAUNCH_CHECKLIST.md.
function AboutSection({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ marginBottom: '10px' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '12px', fontSize: '13px', color: COLOR.text, fontWeight: 600 }}
      >
        {open ? '▾ ' : '▸ '}{title}
      </button>
      {open && (
        <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px', fontSize: '12.5px', lineHeight: 1.6, color: COLOR.muted }}>
          {children}
        </div>
      )}
    </div>
  );
}

// A cross-track term lookup — every flashcard's front across every
// visible track, deduplicated and alphabetized (buildGlossaryEntries in
// 03_helpers.js), so a term you half-remember from a different cert
// doesn't require guessing which track it lives in. Computed once per
// panel open (flashcards don't change mid-session) rather than on every
// keystroke; the search itself just filters that fixed list.
function GlossaryPanel({ onClose }) {
  useEscapeToClose(onClose);
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const entries = useMemo(() => buildGlossaryEntries(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.front.toLowerCase().includes(q) || e.back.toLowerCase().includes(q));
  }, [entries, query]);
  const shown = filtered.slice(0, 200);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Glossary</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
          Every term across all {TRACKS.filter((t) => !t.hidden).length} tracks, in one searchable list — a term
          explained once here shows every track that uses it, not just whichever one you're currently in.
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms…"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${COLOR.border}`,
            background: COLOR.surface, color: COLOR.text, fontSize: '13px', marginBottom: '10px',
          }}
        />
        <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '8px' }}>
          {filtered.length} term{filtered.length === 1 ? '' : 's'}{filtered.length > shown.length ? ` (showing first ${shown.length})` : ''}
        </div>
        <div className="flex flex-col gap-2">
          {shown.map((entry) => {
            const key = entry.front.toLowerCase();
            const open = expandedKey === key;
            return (
              <div key={key} style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '12px', padding: '10px 12px' }}>
                <button
                  onClick={() => setExpandedKey(open ? null : key)}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: COLOR.text }}>{entry.front}</div>
                  <div className="flex gap-1" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
                    {entry.tracks.map((tk) => {
                      const t = TRACKS.find((tt) => tt.key === tk);
                      const accent = trackAccent(tk);
                      return (
                        <span
                          key={tk}
                          style={{ fontSize: '9px', fontWeight: 700, color: accent, border: `1px solid ${accent}`, borderRadius: '999px', padding: '1px 6px' }}
                        >
                          {t ? t.label : tk}
                        </span>
                      );
                    })}
                  </div>
                </button>
                {open && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${COLOR.border}`, fontSize: '13px', color: COLOR.muted, lineHeight: 1.5 }}>
                    {entry.back}
                  </div>
                )}
              </div>
            );
          })}
          {!shown.length && (
            <div style={{ fontSize: '12px', color: COLOR.muted, textAlign: 'center', padding: '20px 0' }}>
              No terms match "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutLegalPanel({ onClose }) {
  useEscapeToClose(onClose);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLOR.bg, borderTop: `1px solid ${COLOR.border}`, borderRadius: '20px 20px 0 0',
          maxWidth: '28rem', width: '100%', maxHeight: '82vh', overflowY: 'auto', padding: '18px 18px 28px',
          boxShadow: SHADOW.card,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>About & Legal</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>

        <AboutSection title="About Cert Study Hub" defaultOpen>
          <p style={{ margin: '0 0 8px' }}>
            An independent study tool for IT certification exam prep — flashcards, timed quizzes, full mock
            exams, and printable cheat sheets across Microsoft Azure/M365, CompTIA, ITIL, and a healthcare
            interoperability track.
          </p>
          <p style={{ margin: 0 }}>
            Found a wrong or outdated question, or have feedback? Reach out at{' '}
            <a href="mailto:james.c.tippets@gmail.com" style={{ color: COLOR.primary }}>james.c.tippets@gmail.com</a>.
          </p>
        </AboutSection>

        <AboutSection title="What's new">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>New: an "About & Legal" panel (this one) with Terms, Privacy, and a disclaimer.</li>
            <li>A hamburger menu replaced the old home dashboard — the app now opens straight into your last track and mode, and every cert is listed once with its own description.</li>
            <li>Real spaced repetition for flashcards, so cards you're shaky on resurface sooner.</li>
            <li>Per-category "Learn more" resource links, real Azure Portal screenshots, and printable one-page cheat sheets for every track.</li>
            <li>"Quiz this section" — test a single topic in isolation, from the reading or a lesson.</li>
            <li>Progress export/import, a daily streak, and 15 milestone achievements.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Terms of Use">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>This is an independent study aid, not an official course, and using it is not a guarantee of passing any exam.</li>
            <li>Content is provided "as is," reviewed for accuracy at the time it was written, but certification exam objectives change over time — always cross-check against the vendor's current official objectives before your exam.</li>
            <li>No account or sign-up is required. You're responsible for how you use the app; please don't attempt to disrupt, scrape at scale, or misrepresent the service.</li>
            <li>All questions, explanations, and study content are original writing, not reproductions of real exam questions.</li>
            <li>To the fullest extent permitted by law, the app is provided without warranty of any kind, and liability for its use is limited accordingly.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Privacy Policy">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>No accounts, no sign-up, and no personal information is collected by this app.</li>
            <li>Your progress (flashcard/quiz/exam results, streak, achievements) is stored either in this browser's local storage, on this device only, or — if you opened this inside a Claude artifact — synced through your own Claude account. It is never sent to a separate server run by this app.</li>
            <li>No cookies, no third-party analytics, and no ad tracking are used today. If that ever changes, this policy will be updated first, before it happens.</li>
            <li>You can download a full copy of your progress, or clear it, anytime from the ⚙ Data & Progress panel.</li>
            <li>If this app ever adds its own accounts or its own cloud sync, this policy will be rewritten to describe exactly what's collected, how long it's kept, and how to delete it.</li>
          </ul>
        </AboutSection>

        <AboutSection title="Disclaimer & trademarks">
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Microsoft, Azure, Microsoft 365, Entra ID, CompTIA, Cloud+, ITIL, and AXELOS are trademarks of their respective owners. This app is not affiliated with, endorsed by, or sponsored by any of them — those names are used only to describe which exam each track prepares you for.</li>
            <li>Real Azure Portal screenshots shown in some lessons are sourced from Microsoft's own CC BY 4.0-licensed documentation, with attribution shown alongside each one.</li>
            <li>Passing a real certification exam depends on many factors beyond any single study tool. Nothing here is a guarantee of exam results.</li>
          </ul>
        </AboutSection>

        <div style={{ fontSize: '10.5px', color: COLOR.muted, textAlign: 'center', marginTop: '6px' }}>
          This is a first draft written for a small independent project, not legal advice — worth a proper review before wider release.
        </div>
      </div>
    </div>
  );
}

// A small flyout anchored directly under the term that was clicked (see
// TermTrigger in 02_portal_mockups.jsx, which renders this as the absolute-
// positioned child of the specific word's own relatively-positioned
// wrapper) — not a block appended below the whole paragraph/card. The
// `term-flyout` class is what useClickOutsideToClose looks for to know a
// click landed inside it rather than outside.
function TermFlyout({ term, onClose, shift, arrowLeft }) {
  if (!term) return null;
  const s = shift || 0;
  return (
    <span
      className="term-flyout"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
        transform: s ? `translateX(${s}px)` : undefined,
        display: 'block', width: 'max-content', maxWidth: 'min(280px, 78vw)',
        background: COLOR.surfaceRaised, border: `1px solid ${COLOR.primary}`, borderRadius: '12px',
        padding: '10px 12px', boxShadow: SHADOW.card, textAlign: 'left', whiteSpace: 'normal',
        fontWeight: 400, fontStyle: 'normal',
      }}
    >
      <span
        style={{
          position: 'absolute', top: '-5px', left: `${arrowLeft != null ? arrowLeft : 14}px`, width: '9px', height: '9px',
          background: COLOR.surfaceRaised, borderLeft: `1px solid ${COLOR.primary}`, borderTop: `1px solid ${COLOR.primary}`,
          transform: 'rotate(45deg)',
        }}
      />
      <span className="flex justify-between items-start" style={{ display: 'flex', marginBottom: '4px', position: 'relative' }}>
        <span className="itil-display" style={{ fontSize: '13px', fontWeight: 600, color: COLOR.primary }}>{term.front}</span>
        <button onClick={onClose} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, padding: '0 0 0 8px', fontSize: '12px' }}>✕</button>
      </span>
      <span style={{ display: 'block', fontSize: '12.5px', lineHeight: 1.5, color: COLOR.text, position: 'relative' }}>{term.back}</span>
      {term.detail && (
        <span style={{ display: 'block', fontSize: '11.5px', lineHeight: 1.5, color: COLOR.muted, marginTop: '6px', borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '8px', position: 'relative' }}>
          {term.detail}
        </span>
      )}
    </span>
  );
}

// The single category filter used above Cards, Study (flat tracks), and
// both Quiz sub-views (Questions/Match) — a dropdown instead of a
// horizontally-scrolling chip row, since a phone-width chip row for a
// 5+ category track always needed a scroll-fade hint and a swipe just to
// see what else was available. Each category's live mastery % rides along
// in its option label instead of a hover-only tooltip, since a <select>'s
// options have no hover state worth relying on.
function CategoryFilterSelect({ categories, activeCat, onChange, masteryByCategory }) {
  return (
    <select
      value={activeCat}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', marginBottom: '18px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        border: `1px solid ${COLOR.primary}`, background: 'rgba(167,139,250,0.14)', color: COLOR.primary,
      }}
    >
      <option value="all">All categories</option>
      {categories.map((c) => (
        <option key={c.key} value={c.key}>{c.label} ({Math.round((masteryByCategory[c.key] || 0) * 100)}% mastered)</option>
      ))}
    </select>
  );
}

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
      <div style={{ fontSize: '10.5px', color: COLOR.muted, textAlign: 'center', marginBottom: '6px' }}>
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
              fontSize: '10px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
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
      {label && <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '3px' }}>{label}</div>}
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

function CheatSheetView({ trackLabel, sections, resources }) {
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
                <li key={j} style={{ fontSize: '13.5px', lineHeight: 1.5, color: COLOR.text }}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchGame({ flashcards, roundSize, onContinue, onRoundComplete }) {
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
              Continue reading →
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: 700,
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
  const MockupComp = lesson.portalMockup ? PORTAL_MOCKUPS[lesson.portalMockup] : null;
  const realShot = lesson.portalMockup ? REAL_PORTAL_SCREENSHOTS[lesson.portalMockup] : null;

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
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '12px' }}>{lesson.summary}</div>
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

      {MockupComp && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '4px' }}>Portal mockup</div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>
            An illustration of the layout, not an exact screenshot — the real portal may look slightly different.
          </div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px' }}>
            <MockupComp />
          </div>
          {realShot && (
            <>
              <div style={{ fontSize: '10.5px', color: COLOR.muted, marginTop: '12px', marginBottom: '2px' }}>
                See the real thing:
              </div>
              <RealPortalScreenshot shot={realShot} />
            </>
          )}
        </div>
      )}

      {lesson.scenario && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>Worked scenario</div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${COLOR.primary}`, borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '14px', lineHeight: 1.65, color: COLOR.text }}>{lesson.scenario}</p>
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
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

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
            <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: COLOR.text, marginBottom: '8px' }}>{p}</p>
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

function QuizSetup({ length, setLength, types, toggleType, onReroll, poolSize, missedCount, onReviewMissed, isMixed }) {
  const lengths = [5, 10, 15, 25];
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
      {isMixed && (
        <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '8px' }}>
          Mixed practice — questions interleaved across every category on purpose, not just left unfiltered.
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <div style={{ fontSize: '11px', color: COLOR.muted }}>{poolSize} questions match this filter</div>
        <button
          onClick={onReroll}
          style={{ fontSize: '11px', color: COLOR.primary, background: 'transparent', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${COLOR.primary}` }}
        >
          New quiz
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
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
      <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '2px' }}>
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
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '20px' }}>
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
      </div>

      {selected !== null && !hideNext && (
        <button
          onClick={onNext}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
        >
          {nextLabel || (isLast ? 'See results' : 'Next question')}
        </button>
      )}
    </div>
  );
}

function QuizSummary({ score, answers, categories, onRestart }) {
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
      <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
        <div className="itil-display" style={{ fontSize: '28px', fontWeight: 600, color: COLOR.success }}>{score.correct} / {score.total}</div>
        <div style={{ fontSize: '13px', color: COLOR.muted, marginTop: '4px' }}>correct this round</div>
      </div>
      {missed.length > 0 && (
        <div className="mt-4">
          <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Worth another look:</div>
          <div className="flex flex-col gap-2">
            {missed.map((m, i) => (
              <div key={i} style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, borderRadius: '10px', padding: '10px 12px', fontSize: '13px' }}>
                <div style={{ fontSize: '10px', color: COLOR.muted, marginBottom: '2px' }}>{categoryLabelFor(m)}</div>
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
        New quiz
      </button>
    </div>
  );
}

