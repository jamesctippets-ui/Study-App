/* ---------------- shared UI: home & cert path ---------------- */

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
        <div style={{ fontSize: '11.5px', color: COLOR.gold, fontWeight: 700, letterSpacing: '0.02em' }}>ACHIEVEMENT UNLOCKED</div>
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
  soundOn, onSetSoundOn, pathLocking, onSetPathLocking, dyslexicFont, onSetDyslexicFont, answerSoundOn, onSetAnswerSoundOn,
}) {
  useEscapeToClose(onClose);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);
  // English voices first (this app's own content is all English), but never
  // hide the rest — a bilingual user may still want their OS's other voices.
  // Within each group, the better-sounding voices (per voiceQualityScore's
  // name-hint/network-backed heuristic) surface first instead of plain
  // alphabetical order, so the smoothest options aren't buried below a
  // long list of older on-device voices.
  const sortedVoices = useMemo(() => {
    if (!ttsVoices || !ttsVoices.length) return [];
    return [...ttsVoices].sort((a, b) => {
      const aEn = a.lang.startsWith('en') ? 0 : 1;
      const bEn = b.lang.startsWith('en') ? 0 : 1;
      if (aEn !== bEn) return aEn - bEn;
      const scoreDiff = voiceQualityScore(b) - voiceQualityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    });
  }, [ttsVoices]);
  const recommendedVoice = useMemo(() => bestVoiceForLang(ttsVoices, 'en'), [ttsVoices]);
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

        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Reading</div>
          <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginTop: '8px', fontSize: '12.5px' }}>
            <span>
              OpenDyslexic font
              <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.4 }}>A typeface with weighted letter bottoms, designed to make letters easier to tell apart. Applies to the whole app; saved on this device only.</span>
            </span>
            <input type="checkbox" checked={!!dyslexicFont} onChange={(e) => onSetDyslexicFont(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} aria-label="OpenDyslexic font" />
          </label>
          <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: COLOR.surfaceRaised, fontSize: '14px', lineHeight: 1.5 }}>
            Preview: Azure role-based access control (RBAC) assigns permissions at a scope.
          </div>
        </div>

        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Path &amp; sounds</div>
          <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginTop: '8px', fontSize: '12.5px' }}>
            <span>
              Lock later units
              <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.4 }}>A unit opens once the one before it is finished, or when you tap "Unlock anyway". Units you've started never lock.</span>
            </span>
            <input type="checkbox" checked={!!pathLocking} onChange={(e) => onSetPathLocking(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} aria-label="Lock later units" />
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginTop: '12px', fontSize: '12.5px' }}>
            <span>
              Celebration sounds
              <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.4 }}>A short chime when you finish a step or a unit. Off by default; saved on this device only.</span>
            </span>
            <input type="checkbox" checked={!!soundOn} onChange={(e) => onSetSoundOn(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} aria-label="Celebration sounds" />
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginTop: '12px', fontSize: '12.5px' }}>
            <span>
              Answer sounds
              <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.4 }}>A short rising tone for a right answer and a soft low one for a wrong answer in practice questions. Off by default; saved on this device only.</span>
            </span>
            <input type="checkbox" checked={!!answerSoundOn} onChange={(e) => onSetAnswerSoundOn(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} aria-label="Answer sounds" />
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => playCelebrationSound('great', true)}
              className="btn-flat"
              style={{ padding: '6px 12px', borderRadius: '10px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '12px', fontWeight: 700 }}
            >
              Play a test sound
            </button>
            <button
              onClick={() => { playAnswerSound(true, true); setTimeout(() => playAnswerSound(false, true), 500); }}
              className="btn-flat"
              style={{ padding: '6px 12px', borderRadius: '10px', border: `2px solid ${COLOR.border}`, background: 'transparent', color: COLOR.text, fontSize: '12px', fontWeight: 700 }}
            >
              Test answer sounds
            </button>
          </div>
        </div>

        {speechSupported && (
          <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
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
                background: COLOR.surfaceRaised, border: `2px solid ${COLOR.border}`, color: COLOR.text, fontSize: '13px',
              }}
            >
              <option value="">Auto (picks the best-sounding voice available)</option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}){recommendedVoice && v.voiceURI === recommendedVoice.voiceURI ? ' — recommended' : ''}
                </option>
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

        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Export progress</div>
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
            Download every track's quiz/exam history, flashcard mastery, streak, and achievements as a JSON file — a backup, or a way to move progress to a new device.
          </div>
          <button className="btn-3d"
            onClick={onExport}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 600 }}
          >
            ⬇ Export progress
          </button>
        </div>

        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
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

        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
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
                <button onClick={() => setConfirmingReset(false)} style={{ flex: 1, background: 'transparent', border: `2px solid ${COLOR.border}`, color: COLOR.text, borderRadius: '8px', padding: '8px', fontSize: '13px' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MODE_LABELS = { path: 'Path', learn: 'Reference', quiz: 'Practice', exam: 'Exam' };

// A small self-set "study N cards/questions today" ring — cheap to build
// since it just tallies activity already recorded elsewhere (flashcard
// ratings, quiz/exam questions answered) via stats.dailyGoal, rather than
// tracking anything new per-item. Tapping the ring opens a small +/-
// stepper to change the target; the ring itself never resets the count —
// that only happens the next time recordDailyActivity sees a new day.
function DailyGoalRing({ dailyGoal, onSetTarget, note }) {
  const [editing, setEditing] = useState(false);
  const target = dailyGoal.target;
  const count = dailyGoal.date === todayString() ? dailyGoal.count : 0;
  const pct = target > 0 ? Math.min(1, count / target) : 0;
  const met = count >= target;
  const size = 40, stroke = 4, r = (size - stroke) / 2, circumference = 2 * Math.PI * r;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px',
      padding: '10px 12px', borderRadius: '14px', background: tint(COLOR.orange, 10),
      border: `2px solid color-mix(in srgb, ${COLOR.orange} 40%, ${COLOR.border})`, boxShadow: SHADOW.card,
    }}>
      <button
        onClick={() => setEditing((e) => !e)}
        className="btn-flat"
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
        <div style={{ fontSize: '11.5px', color: COLOR.muted }}>Daily goal{note ? ` · ${note}` : ''}</div>
      </div>
      {editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onSetTarget(Math.max(5, target - 5))}
            style={{ width: '26px', height: '26px', borderRadius: '8px', border: `2px solid ${COLOR.border}`, background: COLOR.surfaceRaised, color: COLOR.text, fontSize: '15px', lineHeight: 1 }}
          >
            −
          </button>
          <span style={{ fontSize: '12px', color: COLOR.muted, minWidth: '18px', textAlign: 'center' }}>{target}</span>
          <button
            onClick={() => onSetTarget(target + 5)}
            style={{ width: '26px', height: '26px', borderRadius: '8px', border: `2px solid ${COLOR.border}`, background: COLOR.surfaceRaised, color: COLOR.text, fontSize: '15px', lineHeight: 1 }}
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
function TrackListDropdown({ tracks, masteries, certPlan, onSelectTrack, onAddToPath, defaultOpen, label }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '12px', background: tint(COLOR.blue, 9),
          border: `2px solid color-mix(in srgb, ${COLOR.blue} 35%, ${COLOR.border})`, boxShadow: SHADOW.card,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: COLOR.text }}>{label || `All tracks (${tracks.length})`}</span>
        <span style={{ fontSize: '11px', color: COLOR.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
          {masteries.map(({ track: t, pct }) => {
            const accent = trackAccent(t.key);
            const isCompleted = !!certPlan.completed[t.key];
            const scheduledDate = certPlan.scheduled[t.key];
            const inPath = certPlan.order.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => onSelectTrack(t.key)}
                style={{
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px',
                  background: COLOR.surface, border: `2px solid ${COLOR.border}`, boxShadow: SHADOW.card,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: ink(accent) }}>{t.label}</div>
                  <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px' }}>{t.subtitle}</div>
                  <ExperienceChip trackKey={t.key} style={{ marginTop: '4px' }} />
                </div>
                {isCompleted ? (
                  <div title="Passed" style={{ fontSize: '13px', fontWeight: 700, color: COLOR.success, flexShrink: 0 }}>✓ Passed</div>
                ) : scheduledDate ? (
                  <div title="Scheduled" style={{ fontSize: '11.5px', fontWeight: 600, color: COLOR.gold, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatDateShort(scheduledDate)}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted, flexShrink: 0 }}>{pct}%</div>
                )}
                {onAddToPath && !inPath && (
                  <div
                    role="button"
                    title="Add to your cert path"
                    onClick={(e) => { e.stopPropagation(); onAddToPath(t.key); }}
                    style={{
                      flexShrink: 0, width: '26px', height: '26px', borderRadius: '8px',
                      border: `1px solid ${COLOR.primary}`, color: COLOR.primary, fontSize: '15px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}
                  >
                    +
                  </div>
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
  const [open, setOpen] = useState(false);
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

  const answered = selected !== null;
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textAlign: 'left',
          padding: '12px 14px', borderRadius: '12px', background: tint(COLOR.gold, 11), border: `2px solid color-mix(in srgb, ${COLOR.gold} 40%, ${COLOR.border})`, boxShadow: SHADOW.card,
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '11px', color: COLOR.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Question of the day · {trackLabel}
          </span>
          <span style={{ display: 'block', fontSize: '12.5px', color: COLOR.muted, marginTop: '2px' }}>
            {answered ? 'Answered · tap to review' : 'One question, about a minute'}
          </span>
        </span>
        <span style={{ fontSize: '11px', color: COLOR.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>
      {open && (
        <div style={{ marginTop: '8px' }}>
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
          {answered && (
            <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '6px' }}>
              New question tomorrow.
            </div>
          )}
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
function DailyVocabCard({ card, trackLabel, revealed, onReveal, pool }) {
  return (
    <div className="mb-4">
      <div
        onClick={() => { if (!revealed) onReveal(); }}
        style={{
          boxShadow: SHADOW.card, background: tint(COLOR.teal, revealed ? 16 : 10),
          border: `2px solid color-mix(in srgb, ${COLOR.teal} 40%, ${COLOR.border})`, borderRadius: '12px', padding: '12px 14px',
          cursor: revealed ? 'default' : 'pointer',
        }}
      >
        <div style={{ fontSize: '11px', color: COLOR.teal, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Vocab of the day · {trackLabel}
        </div>
        <div className="itil-display" style={{ fontSize: '17px', fontWeight: 600, marginTop: '4px' }}>{card.front}</div>
        {revealed
          ? <div style={{ fontSize: '14px', lineHeight: 1.55, color: COLOR.muted, marginTop: '8px' }}><GlossText text={card.back} pool={pool} max={2} blockId="dv" /></div>
          : <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '2px' }}>Tap to reveal the definition</div>}
        {revealed && <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '8px' }}>New term tomorrow.</div>}
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

// The consolidated "your path" view on Home itself — replaces the old
// single-line teaser card that just linked out to CertPathPanel. The first
// (not-yet-completed) entry gets the full "up next" hero treatment
// (mastery, readiness, scheduled date, a Study button); every entry after
// it is a compact row with the same actions in less space. Reordering,
// scheduling, adding, and marking complete all still live in CertPathPanel
// — opened from the header's hamburger button now (available from any
// mode, not just Home) rather than duplicated inline here — this view is
// for seeing and jumping, not editing.
function CertPathHomeSection({ pathOrder, results, certPlan, studyingKey, pathProgressByTrack, onSelectTrack }) {
  return (
    <div className="mb-4">
      <div style={{ fontSize: '12px', color: COLOR.muted, fontWeight: 600, marginBottom: '8px' }}>Your certs ({pathOrder.length})</div>
      {pathOrder.map((t, i) => {
        const accent = trackAccent(t.key);
        const scheduledDate = certPlan.scheduled[t.key];
        const days = scheduledDate ? daysBetween(todayString(), scheduledDate) : null;
        const pct = trackMastery(t.key, results);
        const prog = pathProgressByTrack[t.key];
        const studying = t.key === studyingKey;
        return (
          <button
            key={t.key}
            onClick={() => onSelectTrack(t.key)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px', marginBottom: i === pathOrder.length - 1 ? 0 : '6px',
              background: studying ? tint(accent, 20) : tint(accent, 7), border: `2px solid ${studying ? accent : `color-mix(in srgb, ${accent} 30%, ${COLOR.border})`}`, boxShadow: SHADOW.card,
            }}
          >
            <div style={{ fontSize: '11px', color: COLOR.muted, width: '14px', flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2" style={{ display: 'flex' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: ink(accent) }}>{t.label}</span>
                {studying && <span style={{ fontSize: '10.5px', fontWeight: 700, color: ink(accent), textTransform: 'uppercase', letterSpacing: '0.04em' }}>Studying now</span>}
              </div>
              <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '1px' }}>
                {t.subtitle}{prog && prog.total ? ` · path ${prog.pct}%` : ''}
              </div>
              <ExperienceChip trackKey={t.key} style={{ marginTop: '3px' }} />
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {scheduledDate && (
                <div style={{ fontSize: '11px', fontWeight: 600, color: days < 0 ? COLOR.red : days <= 7 ? COLOR.gold : COLOR.muted }}>
                  {days < 0 ? `${-days}d over` : days === 0 ? 'Today' : `${days}d · ${formatDateShort(scheduledDate)}`}
                </div>
              )}
              <div style={{ fontSize: '12px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted }}>{pct}%</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// The app's landing screen — shown on every load instead of auto-resuming
// the last track+mode, so there's always a real overview to start from
// rather than dropping straight back into whatever you were doing. Leads
// with the user's own cert path (CertPathHomeSection) once they have one,
// or the full track browser if they don't yet — see each's own comment
// for that split. Reachable again from any track's Learn/Quiz/Exam view
// via the header's home icon; the header's hamburger (Manage cert path)
// is reachable from every mode including this one.
function HomeView({ tracks, results, seenLog, stats, certPlan, speech, srs, makePathApi, onSetHomePathMode, onSetHomePathOrder, onSetReviewReminder, onReviewStarted, onResume, onSelectTrack, onAddToPath, onOpenAbout, onOpenGlossary, onSetGoalTarget, onAnswerDailyQuestion, onRevealDailyVocab, footerNote }) {
  const masteries = tracks.map((t) => ({ track: t, pct: trackMastery(t.key, results) }));
  const overallAvg = masteries.length ? Math.round(masteries.reduce((s, m) => s + m.pct, 0) / masteries.length) : 0;
  const lastVisited = stats.lastVisited;
  const resumeTrack = lastVisited ? tracks.find((t) => t.key === lastVisited.track) : null;
  // For a Path resume, name the exact step the button will open.
  const resumeStep = useMemo(() => {
    if (!resumeTrack || !lastVisited || lastVisited.mode !== 'path') return null;
    const done = ((stats.path || {})[resumeTrack.key] || {}).done || {};
    return pathNextStep(buildPathUnits(resumeTrack.key), done);
  }, [resumeTrack && resumeTrack.key, lastVisited && lastVisited.mode, stats.path]);
  const resumeViewLabel = lastVisited && lastVisited.mode === 'quiz' && lastVisited.view && PRACTICE_TOOLS.some((t) => t.key === lastVisited.view)
    ? PRACTICE_TOOLS.find((t) => t.key === lastVisited.view).label
    : lastVisited && lastVisited.mode === 'learn' && lastVisited.view
      ? { cards: 'Cards', study: 'Study', sheet: 'Sheet' }[lastVisited.view]
      : null;

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
  const pathOrder = activeCertOrder(tracks, certPlan);

  // The cross-cert study path (see 04f_home_path_ui.jsx). Units are built once
  // per set of certs; what's done is read live from stats.path.
  const pathKeys = pathOrder.map((t) => t.key);
  const unitsByTrack = useMemo(() => {
    const map = {};
    pathKeys.forEach((k) => {
      map[k] = buildPathUnits(k).map((u) => ({ ...u, optional: buildOptionalSteps(k, u) }));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKeys.join(',')]);
  const doneByTrack = {};
  pathKeys.forEach((k) => { doneByTrack[k] = ((stats.path || {})[k] || {}).done || {}; });
  doneByTrack[BRIDGE_DONE_KEY] = ((stats.path || {})[BRIDGE_DONE_KEY] || {}).done || {};
  const homePathMode = (stats.homePath && stats.homePath.mode) || 'core';
  const homePathOrder = (stats.homePath && stats.homePath.order) || 'plan';
  const studyKeys = homePathOrder === 'smart'
    ? smartCertOrder(pathKeys, certPlan, results, seenLog, certsMidUnit(unitsByTrack, pathKeys, doneByTrack))
    : pathKeys;
  const homeRemaining = homePathRemaining(unitsByTrack, studyKeys, doneByTrack, homePathMode);
  const homeProgress = homePathProgress(unitsByTrack, pathKeys, doneByTrack);
  const homeOptional = homePathOptionalProgress(unitsByTrack, pathKeys, doneByTrack);
  const pathProgressByTrack = {};
  pathKeys.forEach((k) => { pathProgressByTrack[k] = pathOverallProgress(unitsByTrack[k] || [], doneByTrack[k] || {}); });
  const hasHomePath = homeProgress.total > 0;
  const studyingKey = (homeRemaining.find((e) => !e.step.optional) || homeRemaining[0] || {}).trackKey || (pathKeys[0] || null);
  const weakTotal = crossCertWeakQuestions(pathKeys, results, seenLog).total;
  const toughTotal = crossCertToughCards(pathKeys, srs).total;
  const gamesTotal = crossCertWeakGames(pathKeys, results).total;
  const casesTotal = crossCertWeakCases(pathKeys, results).total;
  const [homeRun, setHomeRun] = useState(null);
  const startHomeRun = (e) => setHomeRun({ kind: 'step', trackKey: e.trackKey, doneKey: e.doneKey, unit: e.unit, step: e.step, nonce: Date.now() });
  const skipHomeStep = (e) => makePathApi(e.doneKey || e.trackKey).skipStep(e.step.id);

  if (homeRun && homeRun.kind !== 'step') {
    return (
      <HomeReviewRun
        key={homeRun.nonce}
        kind={homeRun.kind}
        trackKeys={pathKeys}
        results={results}
        seenLog={seenLog}
        srs={srs}
        speech={speech}
        makeApi={makePathApi}
        onExit={() => setHomeRun(null)}
      />
    );
  }
  if (homeRun) {
    return (
      <HomePathRun
        key={homeRun.nonce}
        run={homeRun}
        tracks={tracks}
        unitsByTrack={unitsByTrack}
        trackKeys={studyKeys}
        doneByTrack={doneByTrack}
        mode={homePathMode}
        results={results}
        seenLog={seenLog}
        speech={speech}
        makeApi={makePathApi}
        onStart={startHomeRun}
        onExit={() => setHomeRun(null)}
        onOpenCert={onSelectTrack}
        onAddToPlan={onAddToPath}
      />
    );
  }

  return (
    <div>
      <DailyGoalRing dailyGoal={stats.dailyGoal} onSetTarget={onSetGoalTarget} note={`${overallAvg}% avg mastery`} />

      {hasHomePath && (
        <HomeStudyPath
          tracks={tracks}
          remaining={homeRemaining}
          progress={homeProgress}
          optionalProgress={homeOptional}
          mode={homePathMode}
          onSetMode={onSetHomePathMode}
          order={homePathOrder}
          onSetOrder={onSetHomePathOrder}
          certCount={pathKeys.length}
          onStart={startHomeRun}
          onTestOut={(e) => startHomeRun({ ...e, step: pathTestOutStep(e.unit) })}
          onSkip={skipHomeStep}
          onOpenCert={onSelectTrack}
          certPlan={certPlan}
          results={results}
          seenLog={seenLog}
        />
      )}

      {pathOrder.length > 0 && (
        <HomeReviewCard
          weakTotal={weakTotal}
          toughTotal={toughTotal}
          gamesTotal={gamesTotal}
          casesTotal={casesTotal}
          reminder={stats.reviewReminder}
          onSetReminder={onSetReviewReminder}
          onStartReview={(kind) => { onReviewStarted(); setHomeRun({ kind, nonce: Date.now() }); }}
        />
      )}

      {/* The path hero already shows the up-next track's own readiness, so
          the standalone readiness card here would just repeat it — only
          shown when there's no path (focus then falls back to lastVisited
          or a default track instead of a path entry). */}
      {pathOrder.length === 0 && readiness.label !== 'Not started' && (
        <div style={{
          marginBottom: '14px', padding: '12px 14px', borderRadius: '14px',
          background: `${readinessColor}1F`, border: `1px solid ${readinessColor}`, boxShadow: SHADOW.card,
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{focusLabel} readiness</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: readinessColor }}>{readiness.score}%</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: readinessColor }}>{readiness.label}</div>
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px', lineHeight: 1.4 }}>
            {readinessProjectionMessage(projection, focusLabel)}
          </div>
        </div>
      )}

      {pathOrder.length > 0 ? (
        <CertPathHomeSection
          pathOrder={pathOrder}
          results={results}
          certPlan={certPlan}
          studyingKey={studyingKey}
          pathProgressByTrack={pathProgressByTrack}
          onSelectTrack={onSelectTrack}
        />
      ) : (
        <div className="mb-4">
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>
            Pick a cert to start studying, or add it to your path so we track its progress and readiness right here on Home.
          </div>
          <TrackListDropdown
            tracks={tracks}
            masteries={masteries}
            certPlan={certPlan}
            onSelectTrack={onSelectTrack}
            onAddToPath={onAddToPath}
            defaultOpen
            label={`All tracks (${tracks.length})`}
          />
        </div>
      )}

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
          <div style={{ fontSize: '15px', fontWeight: 600, color: ink(trackAccent(resumeTrack.key)) }}>
            {resumeTrack.label} · {MODE_LABELS[lastVisited.mode] || 'Path'}{resumeViewLabel ? ` · ${resumeViewLabel}` : ''}
          </div>
          {resumeStep && (
            <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '3px' }}>
              Next up: Unit {resumeStep.unit.index + 1} · {resumeStep.step.label}
            </div>
          )}
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
          pool={vPool.filter((v) => v.id !== dailyVocab.id)}
          onReveal={() => onRevealDailyVocab(dailyVocab)}
        />
      )}

      {pathOrder.length > 0 && (
        <TrackListDropdown
          tracks={tracks}
          masteries={masteries}
          certPlan={certPlan}
          onSelectTrack={onSelectTrack}
          onAddToPath={onAddToPath}
          label={`Browse all tracks (${tracks.length})`}
        />
      )}

      <button
        onClick={onOpenGlossary}
        style={{
          width: '100%', textAlign: 'left', marginTop: '10px', padding: '12px 14px', borderRadius: '12px',
          background: tint(COLOR.pink, 9), border: `2px solid color-mix(in srgb, ${COLOR.pink} 35%, ${COLOR.border})`, boxShadow: SHADOW.card,
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
      {footerNote && <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', lineHeight: 1.45, padding: '0 8px' }}>{footerNote}</div>}
    </div>
  );
}

// A quick "jump to a different track" sheet reachable from the header on
// any Learn/Quiz/Exam screen — not just Home — so switching tracks
// mid-session doesn't require a trip back to Home first. Your cert path
// (if you have one) is listed first, in order, since that's most likely
// where you're jumping to/from; every other track follows below it.
// Always lands the new track on Learn (see switchTrack in 06_app.jsx for
// why), which keeps this simple: no per-mode session state to reconcile.
function TrackSwitcherSheet({ tracks, results, certPlan, activeTrack, onSelect, onClose }) {
  useEscapeToClose(onClose);
  const pathOrder = activeCertOrder(tracks, certPlan);
  const pathKeys = new Set(pathOrder.map((t) => t.key));
  const otherTracks = tracks.filter((t) => !pathKeys.has(t.key));

  const Row = ({ t, rank }) => {
    const accent = trackAccent(t.key);
    const pct = trackMastery(t.key, results);
    const isActive = t.key === activeTrack;
    return (
      <button
        key={t.key}
        onClick={() => onSelect(t.key)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 14px', borderRadius: '12px', marginBottom: '6px',
          background: isActive ? COLOR.surfaceRaised : COLOR.surface,
          border: `1px solid ${isActive ? accent : COLOR.border}`,
        }}
      >
        {rank && <div style={{ fontSize: '11px', color: COLOR.muted, width: '14px', flexShrink: 0, textAlign: 'center' }}>{rank}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: ink(accent) }}>{t.label}{isActive && <span style={{ color: COLOR.muted, fontWeight: 400 }}> · current</span>}</div>
          <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px' }}>{t.subtitle}</div>
          <ExperienceChip trackKey={t.key} style={{ marginTop: '4px' }} />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted, flexShrink: 0 }}>{pct}%</div>
      </button>
    );
  };

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
        <div className="flex justify-between items-center mb-3">
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Switch track</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>

        {pathOrder.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your cert path</div>
            {pathOrder.map((t, i) => <Row key={t.key} t={t} rank={i + 1} />)}
          </div>
        )}

        {otherTracks.length > 0 && (
          <div>
            {pathOrder.length > 0 && (
              <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>All other tracks</div>
            )}
            {otherTracks.map((t) => <Row key={t.key} t={t} />)}
          </div>
        )}
      </div>
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
            <div style={{ fontSize: '16px', fontWeight: 600, color: ink(trackAccent(nextTrack.key)) }}>
              {nextTrack.label} <span style={{ fontWeight: 400, color: COLOR.muted, fontSize: '12px' }}>· {nextTrack.subtitle}</span>
            </div>
            <ExperienceChip trackKey={nextTrack.key} style={{ marginTop: '6px' }} />
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
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
                <div style={{ fontSize: '12px', color: COLOR.muted, width: '14px', flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: ink(accent) }}>{t.label}</div>
                  <input
                    type="date"
                    value={scheduledDate || ''}
                    onChange={(e) => onSetScheduled(key, e.target.value || null)}
                    style={{ marginTop: '4px', fontSize: '11px', color: COLOR.muted, background: 'transparent', border: `2px solid ${COLOR.border}`, borderRadius: '6px', padding: '3px 5px', maxWidth: '130px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <button onClick={() => onMove(key, 'up')} disabled={i === 0} title="Move up" className="btn-flat" style={{ opacity: i === 0 ? 0.3 : 1, color: COLOR.muted, fontSize: '11px', padding: '2px 5px', lineHeight: 1 }}>▲</button>
                  <button onClick={() => onMove(key, 'down')} disabled={i === activeOrder.length - 1} title="Move down" className="btn-flat" style={{ opacity: i === activeOrder.length - 1 ? 0.3 : 1, color: COLOR.muted, fontSize: '11px', padding: '2px 5px', lineHeight: 1 }}>▼</button>
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
                style={{ flex: 1, minWidth: 0, padding: '9px', borderRadius: '9px', background: COLOR.surface, border: `2px solid ${COLOR.border}`, color: COLOR.text, fontSize: '13px' }}
              >
                <option value="">Choose a cert…</option>
                {addable.map((t) => <option key={t.key} value={t.key}>{t.label} — {t.subtitle}{trackExperience(t.key) && trackExperience(t.key).level === 'required' ? ` (${experienceShort(trackExperience(t.key))})` : ''}</option>)}
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
              style={{ width: '100%', textAlign: 'left', background: COLOR.surfaceRaised, border: `2px solid ${COLOR.border}`, borderRadius: '12px', padding: '10px 12px', fontSize: '12.5px', color: COLOR.text, fontWeight: 600 }}
            >
              {completedOpen ? '▾ ' : '▸ '}Completed ({completedOrder.length})
            </button>
            {completedOpen && (
              <div className="flex flex-col gap-2" style={{ marginTop: '8px' }}>
                {completedOrder.map((key) => {
                  const t = trackByKey(key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `2px solid ${COLOR.border}` }}>
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

