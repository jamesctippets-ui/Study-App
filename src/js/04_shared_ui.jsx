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

function PathPanel({ paths, results, activeTrack, onSelectTrack, onClose }) {
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
          <div className="itil-display" style={{ fontSize: '18px', fontWeight: 600 }}>Learning Paths</div>
          <button onClick={onClose} className="btn-flat" style={{ color: COLOR.muted, fontSize: '15px', padding: '4px' }}>✕</button>
        </div>
        {paths.map((path) => {
          const steps = path.tracks.map((s) => ({ ...s, track: TRACKS.find((t) => t.key === s.key) })).filter((s) => s.track);
          if (!steps.length) return null;
          return (
            <div key={path.key} style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '14.5px', fontWeight: 600, marginBottom: '4px' }}>{path.label}</div>
              <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '12px', lineHeight: 1.4 }}>{path.description}</div>
              <div className="flex flex-col gap-2">
                {steps.map((s, i) => {
                  const pct = trackMastery(s.key, results);
                  const isActive = s.key === activeTrack;
                  const accent = trackAccent(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => onSelectTrack(s.key)}
                      style={{
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px',
                        background: isActive ? `${accent}1F` : COLOR.surface,
                        border: `1px solid ${isActive ? accent : COLOR.border}`,
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0, width: '22px', height: '22px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `${accent}26`, color: accent,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: accent }}>{s.track.label}</div>
                        <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.4 }}>{s.why}</div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted, flexShrink: 0 }}>{pct}%</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataPanel({ trackLabel, onExport, onImportFile, importMessage, onReset, onClose }) {
  useEscapeToClose(onClose);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);
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

        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>Export progress</div>
          <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '10px', lineHeight: 1.4 }}>
            Download every track's quiz/exam history, flashcard mastery, streak, and achievements as a JSON file — a backup, or a way to move progress to a new device.
          </div>
          <button
            onClick={onExport}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: COLOR.primary, color: '#2B1620', fontSize: '13px', fontWeight: 600 }}
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

function HomeDashboard({ tracks, results, stats, achievementsCount, achievementsTotal, onResume, onSelectTrack, onOpenAchievements, onOpenPaths, onOpenData }) {
  const masteries = tracks.map((t) => ({ track: t, pct: trackMastery(t.key, results) }));
  const overallAvg = masteries.length ? Math.round(masteries.reduce((s, m) => s + m.pct, 0) / masteries.length) : 0;
  const lastVisited = stats.lastVisited;
  const resumeTrack = lastVisited ? tracks.find((t) => t.key === lastVisited.track) : null;
  const iconBtn = { minWidth: '40px', minHeight: '40px', padding: '6px 10px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="itil-display" style={{ fontSize: '22px', fontWeight: 600 }}>Cert Study Hub</div>
          <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '3px', lineHeight: 1.4 }}>
            {stats.streak.current > 0 ? `🔥 ${stats.streak.current}-day streak · ` : ''}{overallAvg}% average mastery across {tracks.length} tracks
          </div>
        </div>
        <div className="flex items-start gap-1" style={{ flexShrink: 0 }}>
          <button onClick={onOpenPaths} title="Recommended study path" style={{ ...iconBtn, color: COLOR.primary }}>🗺️</button>
          <button onClick={onOpenAchievements} title="Achievements" style={{ ...iconBtn, border: `1px solid ${COLOR.gold}`, color: COLOR.gold, fontSize: '12px', fontWeight: 600, gap: '3px' }}>
            🏆 {achievementsCount}
          </button>
          <button onClick={onOpenData} title="Data & progress" style={iconBtn}>⚙</button>
        </div>
      </div>

      {resumeTrack && (
        <button
          onClick={onResume}
          style={{
            width: '100%', textAlign: 'left', marginBottom: '18px', padding: '14px 16px', borderRadius: '14px',
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

      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '8px' }}>Your tracks</div>
      <div className="flex flex-col gap-2">
        {masteries.map(({ track: t, pct }) => {
          const accent = trackAccent(t.key);
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
              <div style={{ fontSize: '13px', fontWeight: 700, color: pct >= 70 ? COLOR.success : COLOR.muted, flexShrink: 0 }}>{pct}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TermPopover({ term, onClose }) {
  if (!term) return null;
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surfaceRaised, border: `1px solid ${COLOR.primary}`, borderRadius: '12px', padding: '12px 14px', marginTop: '10px', marginBottom: '4px' }}>
      <div className="flex justify-between items-start" style={{ marginBottom: '4px' }}>
        <div className="itil-display" style={{ fontSize: '14px', fontWeight: 600, color: COLOR.primary }}>{term.front}</div>
        <button onClick={onClose} className="btn-flat" style={{ background: 'transparent', color: COLOR.muted, padding: '0 0 0 8px', fontSize: '13px' }}>✕</button>
      </div>
      <div style={{ fontSize: '14px', lineHeight: 1.55, color: COLOR.text }}>{term.back}</div>
      {term.detail && (
        <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: COLOR.muted, marginTop: '6px', borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '8px' }}>
          {term.detail}
        </div>
      )}
    </div>
  );
}

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
        border: `1px solid ${active ? COLOR.primary : COLOR.border}`,
        background: active ? 'rgba(167,139,250,0.14)' : COLOR.surface,
        color: active ? COLOR.primary : COLOR.muted,
      }}
      title={label === 'All' ? undefined : `${tint}% mastered`}
    >
      {label}
    </button>
  );
}

function FlashcardView({ card, flipped, setFlipped, onRate, index, total, categoryLabel, speakingId, onSpeak, speechSupported, flashcardsData }) {
  const [activeTerm, setActiveTerm] = useState(null);
  useEffect(() => { setActiveTerm(null); }, [card && card.id]);
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
          <div style={{ fontSize: '16px', lineHeight: 1.6 }}>{autoHighlightTerms(card.back, otherCards, setActiveTerm, 2)}</div>
        )}
      </div>
      {activeTerm && <TermPopover term={activeTerm} onClose={() => setActiveTerm(null)} />}
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
          style={{ padding: '12px', borderRadius: '12px', background: COLOR.success, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}

function StudyEntry({ item, allFlashcards }) {
  const [activeTerm, setActiveTerm] = useState(null);
  const otherCards = allFlashcards && allFlashcards.filter((c) => c.id !== item.id);
  return (
    <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px 16px' }}>
      <div className="itil-display" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{item.front}</div>
      <div style={{ fontSize: '14px', lineHeight: 1.55, color: COLOR.text, marginBottom: item.detail ? '8px' : 0 }}>
        {autoHighlightTerms(item.back, otherCards, setActiveTerm, 2)}
      </div>
      {item.detail && (
        <div style={{ fontSize: '13px', lineHeight: 1.55, color: COLOR.muted, borderLeft: `2px solid ${COLOR.primary}`, paddingLeft: '10px' }}>
          {item.detail}
        </div>
      )}
      {activeTerm && <TermPopover term={activeTerm} onClose={() => setActiveTerm(null)} />}
    </div>
  );
}

function StudyView({ activeCat, categories, flashcards }) {
  if (activeCat !== 'all') {
    const items = flashcards.filter((i) => i.cat === activeCat);
    return (
      <div className="flex flex-col gap-3">
        {items.map((item) => <StudyEntry key={item.id} item={item} allFlashcards={flashcards} />)}
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
              {catItems.map((item) => <StudyEntry key={item.id} item={item} allFlashcards={flashcards} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheatSheetView({ trackLabel, sections }) {
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
      <button
        onClick={() => window.print()}
        className="cheat-sheet-print-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '9px 14px',
          borderRadius: '10px', border: `1px solid ${COLOR.primary}`, background: 'transparent', color: COLOR.primary,
          fontSize: '13px', fontWeight: 600,
        }}
      >
        🖨 Print / save as PDF
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
  const ROUND_SIZE = roundSize || 6;

  const buildRound = useCallback(() => {
    const picked = shuffleArray(flashcards).slice(0, Math.min(ROUND_SIZE, flashcards.length));
    return { picked, termOrder: shuffleArray(picked), defOrder: shuffleArray(picked) };
  }, [flashcards]);

  const [round, setRound] = useState(buildRound);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    setRound(buildRound());
    setSelected(null);
    setMatched([]);
    setWrongPair(null);
    setMistakes(0);
    // eslint-disable-next-line
  }, [flashcards]);

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
  };

  const isDone = matched.length === round.picked.length;

  useEffect(() => {
    if (isDone && onRoundComplete) onRoundComplete();
    // eslint-disable-next-line
  }, [isDone]);

  const tap = (type, id) => {
    if (matched.includes(id) || wrongPair) return;
    if (!selected) { setSelected({ type, id }); return; }
    if (selected.type === type) { setSelected({ type, id }); return; }
    const termId = type === 'term' ? id : selected.id;
    const defId = type === 'def' ? id : selected.id;
    if (termId === defId) {
      setMatched((m) => [...m, termId]);
      setSelected(null);
    } else {
      setWrongPair({ termId, defId });
      setMistakes((m) => m + 1);
      setTimeout(() => { setWrongPair(null); setSelected(null); }, 500);
    }
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
              style={{ background: COLOR.primary, color: '#2B1620', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
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
    if (selected && selected.type === 'term' && selected.id === id) return 'selected';
    return 'idle';
  };
  const defState = (id) => {
    if (matched.includes(id)) return 'matched';
    if (wrongPair && wrongPair.defId === id) return 'wrong';
    if (selected && selected.type === 'def' && selected.id === id) return 'selected';
    return 'idle';
  };

  const stateStyle = (state) => {
    if (state === 'matched') return { background: 'rgba(52,211,153,0.12)', border: `1px solid ${COLOR.success}`, color: COLOR.muted, opacity: 0.55 };
    if (state === 'wrong') return { background: 'rgba(181,87,74,0.16)', border: `1px solid ${COLOR.red}`, color: COLOR.text };
    if (state === 'selected') return { background: 'rgba(211,164,101,0.14)', border: `1px solid ${COLOR.gold}`, color: COLOR.text };
    return { background: COLOR.surface, border: `1px solid ${COLOR.border}`, color: COLOR.text };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontSize: '11px', color: COLOR.muted }}>
          {matched.length} / {round.picked.length} matched{mistakes > 0 ? ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : ''}
        </span>
        <button onClick={newRound} className="btn-flat" style={{ fontSize: '11px', color: COLOR.primary, fontWeight: 600, padding: '4px 8px' }}>
          New round
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {round.termOrder.map((card) => {
          const state = termState(card.id);
          return (
            <button
              key={card.id}
              onClick={() => tap('term', card.id)}
              disabled={state === 'matched'}
              style={{
                ...stateStyle(state),
                borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', fontWeight: 600,
                lineHeight: 1.3, textAlign: 'center', maxWidth: '150px',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {card.front}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {round.defOrder.map((card) => {
          const state = defState(card.id);
          return (
            <button
              key={card.id}
              onClick={() => tap('def', card.id)}
              disabled={state === 'matched'}
              style={{
                ...stateStyle(state),
                borderRadius: '10px', padding: '10px 12px', fontSize: '12.5px', lineHeight: 1.4, textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {card.back}
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

function LessonDetail({ lesson, flashcardsData, questionsData, onBack, onQuiz, speakingId, onSpeak, speechSupported }) {
  const [showFundamentals, setShowFundamentals] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);
  const [readingPage, setReadingPage] = useState(0);
  const [unlockedPages, setUnlockedPages] = useState(1);
  const vocabItems = lesson.vocabIds.map((id) => flashcardsData.find((f) => f.id === id)).filter(Boolean);
  const DiagramComp = lesson.diagram ? LESSON_DIAGRAMS[lesson.diagram] : null;
  const MockupComp = lesson.portalMockup ? PORTAL_MOCKUPS[lesson.portalMockup] : null;

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

  return (
    <div>
      <button onClick={onBack} className="btn-flat" style={{ fontSize: '12px', color: COLOR.primary, background: 'transparent', marginBottom: '12px', padding: 0 }}>
        ‹ All lessons
      </button>
      <div className="itil-display" style={{ fontSize: '19px', fontWeight: 600, marginBottom: '4px' }}>{lesson.title}</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '16px' }}>{lesson.summary}</div>

      {DiagramComp && (
        <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <DiagramComp />
        </div>
      )}

      <div style={{ marginBottom: activeTerm ? '10px' : '16px' }}>
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
            {highlightTerms(p, lesson.keyTerms, flashcardsData, setActiveTerm)}
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
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
                >
                  Continue reading →
                </button>
              )
            ) : gateQuestion ? (
              <ReadingCheckGate question={gateQuestion} onPassed={advancePastGate} />
            ) : (
              <button
                onClick={advancePastGate}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
              >
                Continue reading →
              </button>
            )}
          </div>
        )}
      </div>

      {activeTerm && (
        <div style={{ marginBottom: '16px' }}>
          <TermPopover term={activeTerm} onClose={() => setActiveTerm(null)} />
        </div>
      )}

      {MockupComp && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '4px' }}>Portal mockup</div>
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>
            An illustration of the layout, not an exact screenshot — the real portal may look slightly different.
          </div>
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '14px' }}>
            <MockupComp />
          </div>
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

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLOR.gold, marginBottom: '8px' }}>Vocabulary</div>
        <div className="flex flex-col gap-2">
          {vocabItems.map((item) => <StudyEntry key={item.id} item={item} />)}
        </div>
      </div>

      <button
        onClick={() => onQuiz(lesson.quizIds)}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
      >
        Take the {lesson.quizIds.length}-question quiz
      </button>
    </div>
  );
}

function CourseView({ lessons, flashcardsData, questionsData, onQuiz, speakingId, onSpeak, speechSupported, masteryFn }) {
  const [lessonId, setLessonId] = useState(null);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (lesson) {
    return (
      <LessonDetail
        lesson={lesson}
        flashcardsData={flashcardsData}
        questionsData={questionsData}
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

function QuizSetup({ length, setLength, types, toggleType, onReroll, poolSize, missedCount, onReviewMissed }) {
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
      <div className="flex justify-between items-center mb-2">
        <div style={{ fontSize: '11px', color: COLOR.muted }}>{poolSize} questions match this filter</div>
        <button
          onClick={onReroll}
          style={{ fontSize: '11px', color: COLOR.primary, background: 'transparent', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${COLOR.primary}` }}
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
              border: `1px solid ${length === n ? COLOR.primary : COLOR.border}`,
              background: length === n ? 'rgba(167,139,250,0.14)' : COLOR.surface,
              color: length === n ? COLOR.primary : COLOR.muted,
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

function QuestionView({ q, selected, onChoose, onNext, index, total, categoryLabel, badgeLabel, msPending, onToggleMs, onSubmitMs, nextLabel, hideMeta, flashcardsData }) {
  const [activeTerm, setActiveTerm] = useState(null);
  useEffect(() => { setActiveTerm(null); }, [q && q.id]);
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
        <div style={{ fontSize: '17px', lineHeight: 1.45, fontWeight: 500, marginBottom: '16px' }}>{q.question}</div>

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
                style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: '12px', background: msPending.length ? COLOR.primary : COLOR.surfaceRaised, color: msPending.length ? '#2B1620' : COLOR.muted, fontSize: '14px', fontWeight: 600 }}
              >
                Submit answer
              </button>
            )}
          </div>
        )}

        {selected !== null && q.explanation && (
          <div style={{ boxShadow: SHADOW.card, marginTop: '14px', padding: '12px', borderRadius: '10px', background: COLOR.surfaceRaised, fontSize: '14px', lineHeight: 1.55, color: COLOR.muted }}>
            {autoHighlightTerms(q.explanation, flashcardsData, setActiveTerm)}
          </div>
        )}
        {activeTerm && <TermPopover term={activeTerm} onClose={() => setActiveTerm(null)} />}
      </div>

      {selected !== null && (
        <button
          onClick={onNext}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
        >
          {nextLabel || (isLast ? 'See results' : 'Next question')}
        </button>
      )}
    </div>
  );
}

function QuizSummary({ score, answers, categories, onRestart }) {
  const missed = answers.filter((a) => !a.correct);
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
                <div style={{ fontSize: '10px', color: COLOR.muted, marginBottom: '2px' }}>{categories.find((c) => c.key === m.cat)?.label}</div>
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
        style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
      >
        New quiz
      </button>
    </div>
  );
}

