/* ---------------- main app ---------------- */

function CertStudyApp() {
  const [activeTrack, setActiveTrack] = useState('az900');
  const [mode, setMode] = useState('learn');
  const [learnView, setLearnView] = useState('cards');
  const [activeCat, setActiveCat] = useState('all');
  const [results, setResults] = useState(emptyTrackMap);
  const [seenLog, setSeenLog] = useState(emptyTrackMap);
  const [flipped, setFlipped] = useState(false);
  const [fIndex, setFIndex] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncMode, setSyncMode] = useState('loading');
  const [stats, setStats] = useState(emptyStats);
  const [showAchievements, setShowAchievements] = useState(false);
  const [toastAchievement, setToastAchievement] = useState(null);
  const [showPaths, setShowPaths] = useState(false);

  const [quizLength, setQuizLength] = useState(10);
  const [quizTypes, setQuizTypes] = useState({ mc: true, tf: true, ms: true });
  const [quizSession, setQuizSession] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState('active');
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [selected, setSelected] = useState(null);
  const [isMissedSession, setIsMissedSession] = useState(false);
  const [isLessonSession, setIsLessonSession] = useState(false);
  const [msPending, setMsPending] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [examTrack, setExamTrack] = useState(null);
  const [examSession, setExamSession] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examIndex, setExamIndex] = useState(0);
  const [examPhase, setExamPhase] = useState('intro');
  const [examTimeLeft, setExamTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);

  const docRef = useRef(null);
  const writeChain = useRef(Promise.resolve());
  const utterRef = useRef(null);
  const skipNextAutoStart = useRef(false);

  const track = TRACKS.find((t) => t.key === activeTrack);
  const visibleTracks = TRACKS.filter((t) => !t.hidden);
  const categories = DATA[activeTrack].categories;
  const flashcardsData = DATA[activeTrack].flashcards;
  const questionsData = DATA[activeTrack].questions;
  const trackResults = results[activeTrack] || {};

  useEffect(() => {
    let cancelled = false;
    let unsub = null;

    function fallbackToLocal() {
      if (cancelled) return;
      const local = loadLocal();
      if (local) {
        // A pre-multi-track save has no `.results` wrapper at all — the
        // whole object IS the flat results map. normalizeResults() already
        // knows how to detect and migrate that shape, but only if it
        // actually gets passed the raw object instead of `undefined`.
        setResults(normalizeResults(local.results || local));
        if (local.seenLog) setSeenLog(normalizeSeenLog(local.seenLog));
        if (local.stats) setStats(normalizeStats(local.stats));
      }
      setSyncMode('local');
    }

    (async () => {
      try {
        if (window.claude && window.claude.use) {
          const db = await window.claude.use('db');
          const user = await window.claude.use('user');
          if (db && user) {
            const uid = await user.id();
            if (uid) {
              const ref = db.doc('data/users/' + uid + '/progress');
              docRef.current = ref;
              unsub = ref.onSnapshot(
                (snap) => {
                  if (cancelled) return;
                  if (snap.exists) {
                    const data = snap.data();
                    if (data && data.results) setResults(normalizeResults(data.results));
                    if (data && data.seenLog) setSeenLog(normalizeSeenLog(data.seenLog));
                    if (data && data.stats) setStats(normalizeStats(data.stats));
                  }
                  setSyncMode('cloud');
                },
                () => { fallbackToLocal(); }
              );
              return;
            }
          }
        }
        fallbackToLocal();
      } catch (e) {
        fallbackToLocal();
      }
    })();

    return () => { cancelled = true; if (unsub) unsub(); };
  }, []);

  const persistPayload = (payload) => {
    if (docRef.current) {
      writeChain.current = writeChain.current.then(() =>
        docRef.current.set(payload).catch(() => { saveLocal(payload); })
      );
    } else {
      saveLocal(payload);
    }
  };

  const saveResults = (nextResults) => {
    setResults(nextResults);
    persistPayload({ results: nextResults, seenLog, stats, updatedAt: Date.now() });
  };

  const saveSeen = (nextSeenLog) => {
    setSeenLog(nextSeenLog);
    persistPayload({ results, seenLog: nextSeenLog, stats, updatedAt: Date.now() });
  };

  const saveStats = (nextStats) => {
    setStats(nextStats);
    persistPayload({ results, seenLog, stats: nextStats, updatedAt: Date.now() });
  };

  const markSeen = (ids) => {
    if (!ids.length) return;
    const now = Date.now();
    const trackLog = { ...(seenLog[activeTrack] || {}) };
    ids.forEach((id, idx) => { trackLog[id] = now + idx; });
    saveSeen({ ...seenLog, [activeTrack]: trackLog });
  };

  const recordResult = (id, outcome) => {
    saveResults({ ...results, [activeTrack]: { ...trackResults, [id]: outcome } });
  };

  const speak = (id, text) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    // Keep a reference so the utterance isn't garbage-collected mid-speech
    // (a well-known cross-browser bug that cuts playback short or silently
    // no-ops). Also, speak() has to run in a fresh tick after cancel() —
    // calling it in the same tick is a documented Safari/iOS bug where the
    // new utterance is silently dropped.
    utterRef.current = utter;
    setSpeakingId(id);
    setTimeout(() => {
      if (utterRef.current === utter) window.speechSynthesis.speak(utter);
    }, 60);
  };

  useEffect(() => {
    return () => { if (speechSupported) window.speechSynthesis.cancel(); };
    // eslint-disable-next-line
  }, []);

  const achievements = useMemo(() => evaluateAchievements(results, stats), [results, stats]);

  // Advance the daily streak once per load, after real data (local or cloud)
  // has replaced the empty initial state — never while still `loading`.
  const streakAdvancedRef = useRef(false);
  useEffect(() => {
    if (syncMode === 'loading' || streakAdvancedRef.current) return;
    streakAdvancedRef.current = true;
    const advanced = advanceStreak(stats.streak);
    if (advanced !== stats.streak) saveStats({ ...stats, streak: advanced });
    // eslint-disable-next-line
  }, [syncMode]);

  // Unlock (and toast) one newly-earned achievement at a time — persisting
  // just that id re-triggers this effect for the next one, if any.
  useEffect(() => {
    if (syncMode === 'loading') return;
    const newlyUnlocked = achievements.find((a) => a.unlocked && !stats.unlocked.includes(a.id));
    if (newlyUnlocked) {
      setToastAchievement(newlyUnlocked);
      saveStats({ ...stats, unlocked: [...stats.unlocked, newlyUnlocked.id] });
    }
    // eslint-disable-next-line
  }, [achievements, syncMode]);

  useEffect(() => {
    if (!toastAchievement) return;
    const t = setTimeout(() => setToastAchievement(null), 4000);
    return () => clearTimeout(t);
  }, [toastAchievement]);

  const filteredFlashcards = useMemo(() => {
    const list = activeCat === 'all' ? flashcardsData : flashcardsData.filter((c) => c.cat === activeCat);
    return seededShuffle(list, 7);
  }, [activeCat, flashcardsData]);

  useEffect(() => { setFIndex(0); setFlipped(false); }, [activeCat, mode, learnView, activeTrack]);
  useEffect(() => { setActiveCat('all'); }, [activeTrack]);

  const availableQuestions = useMemo(() => {
    const byCat = activeCat === 'all' ? questionsData : questionsData.filter((q) => q.cat === activeCat);
    return byCat.filter((q) => quizTypes[q.type]);
  }, [activeCat, quizTypes, questionsData]);

  const missedIds = useMemo(
    () => questionsData.filter((q) => trackResults[q.id] === 'incorrect').map((q) => q.id),
    [questionsData, trackResults]
  );
  const missedCount = missedIds.length;

  const typesKey = quizTypes.mc + '-' + quizTypes.tf + '-' + quizTypes.ms;

  const startNewSession = useCallback(() => {
    const len = Math.min(quizLength, availableQuestions.length);
    const picked = pickRotated(availableQuestions, len, seenLog[activeTrack] || {});
    const prepared = picked.map(prepareQuestion);
    setQuizSession(prepared);
    setSessionIndex(0);
    setSelected(null);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(false);
    setIsLessonSession(false);
    markSeen(prepared.map((q) => q.id));
    // eslint-disable-next-line
  }, [availableQuestions, quizLength, seenLog, activeTrack]);

  useEffect(() => {
    if (mode !== 'quiz') return;
    if (skipNextAutoStart.current) { skipNextAutoStart.current = false; return; }
    // A lesson quiz or missed-review session is a deliberately curated set of
    // questions — a stray category-chip tap (the weighted mastery bar at the
    // bottom of every screen sets activeCat too) must not silently discard it
    // and replace it with a freshly rolled generic session.
    if (isLessonSession || isMissedSession) return;
    startNewSession();
    // eslint-disable-next-line
  }, [mode, activeCat, quizLength, typesKey, activeTrack]);

  const startMissedSession = () => {
    const pool = questionsData.filter((q) => trackResults[q.id] === 'incorrect');
    const prepared = shuffleArray(pool).map(prepareQuestion);
    setQuizSession(prepared);
    setSessionIndex(0);
    setSelected(null);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(true);
    setIsLessonSession(false);
    markSeen(prepared.map((q) => q.id));
  };

  const lessonMastery = (lesson) => {
    const ids = [...lesson.vocabIds, ...lesson.quizIds];
    const correct = ids.filter((id) => trackResults[id] === 'correct').length;
    return ids.length ? correct / ids.length : 0;
  };

  const startLessonQuiz = (ids) => {
    const pool = questionsData.filter((q) => ids.includes(q.id));
    const prepared = shuffleArray(pool).map(prepareQuestion);
    setQuizSession(prepared);
    setSessionIndex(0);
    setSelected(null);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(false);
    setIsLessonSession(true);
    skipNextAutoStart.current = true;
    setMode('quiz');
    markSeen(prepared.map((q) => q.id));
  };

  const toggleType = (key) => {
    setQuizTypes((t) => {
      const next = { ...t, [key]: !t[key] };
      const anyOn = next.mc || next.tf || next.ms;
      return anyOn ? next : t;
    });
  };

  const masteryByCategory = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const items = [
        ...flashcardsData.filter((f) => f.cat === c.key).map((f) => f.id),
        ...questionsData.filter((q) => q.cat === c.key).map((q) => q.id),
      ];
      const correct = items.filter((id) => trackResults[id] === 'correct').length;
      map[c.key] = items.length ? correct / items.length : 0;
    });
    return map;
  }, [trackResults, categories, flashcardsData, questionsData]);

  const overallMastery = useMemo(() => trackMastery(activeTrack, results), [activeTrack, results]);

  const currentCard = filteredFlashcards[fIndex];
  const currentQ = quizSession[sessionIndex];

  const nextCard = (outcome) => {
    if (currentCard) recordResult(currentCard.id, outcome);
    setFlipped(false);
    setFIndex((i) => (i + 1) % Math.max(filteredFlashcards.length, 1));
  };

  const advance = () => {
    setSelected(null);
    setMsPending([]);
    if (sessionIndex + 1 >= quizSession.length) {
      setQuizPhase('complete');
      const perfect = sessionScore.total >= 10 && sessionScore.correct === sessionScore.total;
      saveStats({
        ...stats,
        counts: {
          ...stats.counts,
          quizzesCompleted: stats.counts.quizzesCompleted + 1,
          perfectQuizzes: stats.counts.perfectQuizzes + (perfect ? 1 : 0),
        },
      });
    } else {
      setSessionIndex((i) => i + 1);
    }
  };

  const chooseAnswer = (idx) => {
    if (selected !== null || !currentQ) return;
    if (currentQ.type === 'ms') return;
    setSelected(idx);
    let isCorrect;
    if (currentQ.type === 'mc') isCorrect = idx === currentQ.correct;
    else if (currentQ.type === 'tf') isCorrect = (idx === 0) === currentQ.answer;
    else return;
    recordResult(currentQ.id, isCorrect ? 'correct' : 'incorrect');
    setSessionScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setSessionAnswers((a) => [...a, { id: currentQ.id, cat: currentQ.cat, prompt: currentQ.question, correct: isCorrect }]);
  };

  const toggleMs = (idx) => {
    if (selected !== null) return;
    setMsPending((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const submitMsAnswer = () => {
    if (selected !== null || !currentQ || currentQ.type !== 'ms' || msPending.length === 0) return;
    const picked = [...msPending].sort();
    const correct = [...currentQ.correct].sort();
    const isCorrect = picked.length === correct.length && picked.every((v, i) => v === correct[i]);
    setSelected(picked);
    recordResult(currentQ.id, isCorrect ? 'correct' : 'incorrect');
    setSessionScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setSessionAnswers((a) => [...a, { id: currentQ.id, cat: currentQ.cat, prompt: currentQ.question, correct: isCorrect }]);
  };

  const doReset = () => {
    saveResults({ ...results, [activeTrack]: {} });
    setConfirmReset(false);
  };

  /* ---- final exam logic ---- */

  const startExam = () => {
    const cfg = EXAM_CONFIG[activeTrack];
    const pool = DATA[activeTrack].questions.filter((q) => q.type === 'mc' || q.type === 'tf' || q.type === 'ms');
    const picked = pickRotated(pool, Math.min(cfg.length, pool.length), seenLog[activeTrack] || {});
    const session = picked.map(prepareQuestion);
    setExamTrack(activeTrack);
    setExamSession(session);
    setExamAnswers({});
    setExamIndex(0);
    setExamResult(null);
    setExamTimeLeft(cfg.minutes * 60);
    setExamPhase('active');
    markSeen(session.map((q) => q.id));
  };

  useEffect(() => {
    if (examPhase !== 'active') return;
    const id = setInterval(() => {
      setExamTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setExamPhase('complete');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [examPhase]);

  useEffect(() => {
    if (examPhase !== 'complete' || examResult) return;
    let correct = 0;
    const items = examSession.map((q) => {
      const sel = examAnswers[q.id];
      let isCorrect = false;
      const answered = q.type === 'ms' ? Array.isArray(sel) && sel.length > 0 : sel !== undefined;
      if (answered) {
        if (q.type === 'mc') isCorrect = sel === q.correct;
        else if (q.type === 'tf') isCorrect = (sel === 0) === q.answer;
        else if (q.type === 'ms') {
          const picked = [...sel].sort();
          const correctSet = [...q.correct].sort();
          isCorrect = picked.length === correctSet.length && picked.every((v, i) => v === correctSet[i]);
        }
      }
      if (isCorrect) correct++;
      return { id: q.id, cat: q.cat, prompt: q.question, correct: isCorrect, answered };
    });
    setExamResult({ correct, total: examSession.length, items });
    const trackKey = examTrack || activeTrack;
    const updated = { ...(results[trackKey] || {}) };
    items.forEach((it) => { updated[it.id] = it.correct ? 'correct' : 'incorrect'; });
    const nextResults = { ...results, [trackKey]: updated };
    const pct = examSession.length ? Math.round((correct / examSession.length) * 100) : 0;
    const passed = pct >= EXAM_CONFIG[trackKey].passPct;
    const nextStats = passed ? { ...stats, counts: { ...stats.counts, examsPassed: stats.counts.examsPassed + 1 } } : stats;
    setResults(nextResults);
    setStats(nextStats);
    persistPayload({ results: nextResults, seenLog, stats: nextStats, updatedAt: Date.now() });
    // eslint-disable-next-line
  }, [examPhase]);

  const examCurrentQ = examSession[examIndex];
  const examAnsweredCount = examSession.filter((q) => {
    const sel = examAnswers[q.id];
    return q.type === 'ms' ? Array.isArray(sel) && sel.length > 0 : sel !== undefined;
  }).length;

  return (
    <div
      style={{
        background: COLOR.bg,
        color: COLOR.text,
        minHeight: '100vh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {toastAchievement && <AchievementToast achievement={toastAchievement} />}
      {showAchievements && (
        <AchievementsPanel
          achievements={achievements}
          streak={stats.streak}
          onClose={() => setShowAchievements(false)}
        />
      )}
      {showPaths && (
        <PathPanel
          paths={PATHS}
          results={results}
          activeTrack={activeTrack}
          onSelectTrack={(key) => { setActiveTrack(key); setShowPaths(false); }}
          onClose={() => setShowPaths(false)}
        />
      )}
      <div className="max-w-md mx-auto px-4 py-5">
        <div className="flex justify-between items-start mb-4">
          <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingRight: '10px' }}>
            {visibleTracks.length > 1 ? (
              <select
                value={activeTrack}
                onChange={(e) => setActiveTrack(e.target.value)}
                className="itil-display"
                style={{
                  display: 'block', width: '100%', fontSize: '21px', fontWeight: 600, lineHeight: 1.2,
                  color: trackAccent(activeTrack), background: 'transparent', border: 'none', padding: 0,
                  WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none',
                }}
              >
                {visibleTracks.map((t) => (
                  <option key={t.key} value={t.key} style={{ background: COLOR.surface, color: COLOR.text }}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : null}
            {visibleTracks.length > 1 && (
              <span style={{ position: 'absolute', top: '3px', right: '-4px', fontSize: '12px', color: trackAccent(activeTrack), pointerEvents: 'none' }}>▾</span>
            )}
            {visibleTracks.length <= 1 && (
              <div className="itil-display" style={{ fontSize: '21px', fontWeight: 600, lineHeight: 1.2 }}>{track.label}</div>
            )}
            <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '2px' }}>{track.subtitle}</div>
          </div>
          <div className="flex items-start gap-1" style={{ flexShrink: 0 }}>
            <div style={{ textAlign: 'right', marginRight: '2px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: COLOR.success }}>{overallMastery}%</div>
            </div>
            {PATHS.length > 0 && (
              <button
                onClick={() => setShowPaths(true)}
                title="Recommended study path"
                style={{ padding: '6px 8px', borderRadius: '8px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.primary, fontSize: '13px' }}
              >
                🗺️
              </button>
            )}
            <button
              onClick={() => setShowAchievements(true)}
              title="Achievements"
              style={{ padding: '6px 8px', borderRadius: '8px', border: `1px solid ${COLOR.gold}`, background: 'transparent', color: COLOR.gold, fontSize: '11px', fontWeight: 600 }}
            >
              🏆 {stats.unlocked.length}
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              title="Reset progress"
              style={{ padding: '6px 8px', borderRadius: '8px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted, fontSize: '13px' }}
            >
              ⟲
            </button>
          </div>
        </div>

        {syncMode === 'local' && (
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '12px' }}>
            Saving progress to this browser. Open from your Claude account to sync across devices.
          </div>
        )}

        {confirmReset && (
          <div style={{ boxShadow: SHADOW.card, background: COLOR.surface, border: `1px solid ${COLOR.red}`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Clear saved progress for {track.label}?</div>
            <div className="flex gap-2">
              <button onClick={doReset} style={{ flex: 1, background: COLOR.red, color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 600 }}>Clear it</button>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLOR.border}`, color: COLOR.text, borderRadius: '8px', padding: '8px', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-4" style={{ boxShadow: SHADOW.card, background: COLOR.surface, padding: '4px', borderRadius: '12px', border: `1px solid ${COLOR.border}` }}>
          <button
            onClick={() => setMode('learn')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'learn' ? COLOR.primary : 'transparent', color: mode === 'learn' ? '#2B1620' : COLOR.muted }}
          >
            Learn
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'quiz' ? COLOR.primary : 'transparent', color: mode === 'quiz' ? '#2B1620' : COLOR.muted }}
          >
            Quiz
          </button>
          <button
            onClick={() => setMode('exam')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'exam' ? COLOR.gold : 'transparent', color: mode === 'exam' ? '#2E1F0C' : COLOR.muted }}
          >
            Exam
          </button>
        </div>

        {mode === 'learn' && (
          <div className="flex gap-1 mb-4" style={{ background: COLOR.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}` }}>
            <button
              onClick={() => setLearnView('cards')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: learnView === 'cards' ? COLOR.surfaceRaised : 'transparent', color: learnView === 'cards' ? COLOR.text : COLOR.muted }}
            >
              Cards
            </button>
            <button
              onClick={() => setLearnView('study')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: learnView === 'study' ? COLOR.surfaceRaised : 'transparent', color: learnView === 'study' ? COLOR.text : COLOR.muted }}
            >
              Study
            </button>
            <button
              onClick={() => setLearnView('match')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: learnView === 'match' ? COLOR.surfaceRaised : 'transparent', color: learnView === 'match' ? COLOR.text : COLOR.muted }}
            >
              Match
            </button>
          </div>
        )}

        {(mode === 'quiz' || (mode === 'learn' && (learnView !== 'study' || !DATA[activeTrack].lessons))) && (
          <div className="flex gap-2 mb-5" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <CategoryChip label="All" active={activeCat === 'all'} mastery={overallMastery / 100} onClick={() => setActiveCat('all')} />
            {categories.map((c) => (
              <CategoryChip key={c.key} label={c.label} active={activeCat === c.key} mastery={masteryByCategory[c.key]} onClick={() => setActiveCat(c.key)} />
            ))}
          </div>
        )}

        {mode === 'learn' && learnView === 'cards' && (
          <FlashcardView
            card={currentCard}
            flipped={flipped}
            setFlipped={setFlipped}
            onRate={nextCard}
            index={fIndex}
            total={filteredFlashcards.length}
            categoryLabel={categories.find((c) => c.key === currentCard?.cat)?.label}
            speakingId={speakingId}
            onSpeak={speak}
            speechSupported={speechSupported}
          />
        )}

        {mode === 'quiz' && (
          <React.Fragment>
            {!isLessonSession && !isMissedSession && quizPhase !== 'complete' && (
              <QuizSetup
                length={quizLength}
                setLength={setQuizLength}
                types={quizTypes}
                toggleType={toggleType}
                onReroll={startNewSession}
                poolSize={availableQuestions.length}
                missedCount={missedCount}
                onReviewMissed={startMissedSession}
              />
            )}
            {!isLessonSession && !isMissedSession && availableQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
                No questions match this filter — try enabling another question type.
              </div>
            ) : quizPhase === 'complete' ? (
              <QuizSummary score={sessionScore} answers={sessionAnswers} categories={categories} onRestart={startNewSession} />
            ) : (
              <QuestionView
                q={currentQ}
                selected={selected}
                onChoose={chooseAnswer}
                onNext={advance}
                index={sessionIndex}
                total={quizSession.length}
                categoryLabel={categories.find((c) => c.key === currentQ?.cat)?.label}
                badgeLabel={isMissedSession ? 'Missed review' : isLessonSession ? 'Lesson quiz' : null}
                msPending={msPending}
                onToggleMs={toggleMs}
                onSubmitMs={submitMsAnswer}
              />
            )}
          </React.Fragment>
        )}

        {mode === 'learn' && learnView === 'match' && (
          <MatchGame
            flashcards={filteredFlashcards}
            onRoundComplete={() => saveStats({ ...stats, counts: { ...stats.counts, matchRoundsCompleted: stats.counts.matchRoundsCompleted + 1 } })}
          />
        )}

        {mode === 'learn' && learnView === 'study' && (
          DATA[activeTrack].lessons ? (
            <CourseView
              lessons={DATA[activeTrack].lessons}
              flashcardsData={flashcardsData}
              questionsData={questionsData}
              onQuiz={startLessonQuiz}
              speakingId={speakingId}
              onSpeak={speak}
              speechSupported={speechSupported}
              masteryFn={lessonMastery}
            />
          ) : (
            <StudyView activeCat={activeCat} categories={categories} flashcards={flashcardsData} />
          )
        )}

        {mode === 'exam' && (
          examPhase === 'intro' ? (
            <ExamIntro track={track} config={EXAM_CONFIG[activeTrack]} onStart={startExam} />
          ) : examPhase === 'active' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: '11px', color: COLOR.muted }}>Question {examIndex + 1} of {examSession.length}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: examTimeLeft <= 300 ? COLOR.red : examTimeLeft <= 600 ? COLOR.gold : COLOR.muted }}>
                  {formatTime(examTimeLeft)}
                </span>
              </div>
              <ExamQuestionView
                q={examCurrentQ}
                selectedIdx={examCurrentQ ? examAnswers[examCurrentQ.id] : undefined}
                onSelect={(i) => setExamAnswers((a) => {
                  if (examCurrentQ.type === 'ms') {
                    const prev = Array.isArray(a[examCurrentQ.id]) ? a[examCurrentQ.id] : [];
                    const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
                    return { ...a, [examCurrentQ.id]: next };
                  }
                  return { ...a, [examCurrentQ.id]: i };
                })}
              />
              <div style={{ fontSize: '11px', color: COLOR.muted, textAlign: 'center', marginTop: '8px' }}>
                {examAnsweredCount} of {examSession.length} answered
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  disabled={examIndex === 0}
                  onClick={() => setExamIndex((i) => Math.max(0, i - 1))}
                  className="flex-1"
                  style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: examIndex === 0 ? COLOR.border : COLOR.text, fontSize: '14px', fontWeight: 600 }}
                >
                  Previous
                </button>
                {examIndex + 1 < examSession.length ? (
                  <button
                    onClick={() => setExamIndex((i) => i + 1)}
                    className="flex-1"
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.primary, color: '#2B1620', fontSize: '14px', fontWeight: 600 }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setExamPhase('complete')}
                    className="flex-1"
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.gold, color: '#2E1F0C', fontSize: '14px', fontWeight: 700 }}
                  >
                    Submit Exam
                  </button>
                )}
              </div>
              <button
                onClick={() => setExamPhase('complete')}
                className="btn-flat"
                style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '11px', color: COLOR.muted, background: 'transparent' }}
              >
                Submit early
              </button>
            </div>
          ) : (
            examResult && (
              <ExamResults
                result={examResult}
                config={EXAM_CONFIG[examTrack || activeTrack]}
                track={TRACKS.find((t) => t.key === (examTrack || activeTrack))}
                categories={DATA[examTrack || activeTrack].categories}
                onRestart={() => setExamPhase('intro')}
              />
            )
          )
        )}

        <div className="mt-6">
          <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '6px' }}>
            Weighted mastery for {track.label} — segment width matches the real exam's emphasis
          </div>
          <div className="flex" style={{ gap: '2px', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
            {categories.map((c) => (
              <div
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                title={`${c.label}: ${Math.round((masteryByCategory[c.key] || 0) * 100)}%`}
                style={{ flexGrow: c.marks, cursor: 'pointer', background: COLOR.surfaceRaised, position: 'relative' }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    width: `${Math.round((masteryByCategory[c.key] || 0) * 100)}%`,
                    background: (masteryByCategory[c.key] || 0) > 0.7 ? COLOR.success : COLOR.gold,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
