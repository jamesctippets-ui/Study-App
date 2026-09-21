/* ---------------- main app ---------------- */

function CertStudyApp() {
  const [activeTrack, setActiveTrack] = useState('az900');
  const [mode, setMode] = useState('flashcards');
  const [activeCat, setActiveCat] = useState('all');
  const [results, setResults] = useState({ itil: {}, az900: {}, az104: {} });
  const [seenLog, setSeenLog] = useState({ itil: {}, az900: {}, az104: {} });
  const [flipped, setFlipped] = useState(false);
  const [fIndex, setFIndex] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncMode, setSyncMode] = useState('loading');

  const [quizLength, setQuizLength] = useState(10);
  const [quizTypes, setQuizTypes] = useState({ mc: true, tf: true, sa: true, ms: true });
  const [quizSession, setQuizSession] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState('active');
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [selected, setSelected] = useState(null);
  const [saInput, setSaInput] = useState('');
  const [saRevealed, setSaRevealed] = useState(false);
  const [isMissedSession, setIsMissedSession] = useState(false);
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
        if (local.results) setResults(normalizeResults(local.results));
        if (local.seenLog) setSeenLog(normalizeSeenLog(local.seenLog));
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
    persistPayload({ results: nextResults, seenLog, updatedAt: Date.now() });
  };

  const saveSeen = (nextSeenLog) => {
    setSeenLog(nextSeenLog);
    persistPayload({ results, seenLog: nextSeenLog, updatedAt: Date.now() });
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

  const filteredFlashcards = useMemo(() => {
    const list = activeCat === 'all' ? flashcardsData : flashcardsData.filter((c) => c.cat === activeCat);
    return seededShuffle(list, 7);
  }, [activeCat, flashcardsData]);

  useEffect(() => { setFIndex(0); setFlipped(false); }, [activeCat, mode, activeTrack]);
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

  const typesKey = quizTypes.mc + '-' + quizTypes.tf + '-' + quizTypes.sa + '-' + quizTypes.ms;

  const startNewSession = useCallback(() => {
    const len = Math.min(quizLength, availableQuestions.length);
    const picked = pickRotated(availableQuestions, len, seenLog[activeTrack] || {});
    const prepared = picked.map(prepareQuestion);
    setQuizSession(prepared);
    setSessionIndex(0);
    setSelected(null);
    setSaInput('');
    setSaRevealed(false);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(false);
    markSeen(prepared.map((q) => q.id));
    // eslint-disable-next-line
  }, [availableQuestions, quizLength, seenLog, activeTrack]);

  useEffect(() => {
    if (mode === 'quiz') startNewSession();
    // eslint-disable-next-line
  }, [mode, activeCat, quizLength, typesKey, activeTrack]);

  const startMissedSession = () => {
    const pool = questionsData.filter((q) => trackResults[q.id] === 'incorrect');
    const prepared = shuffleArray(pool).map(prepareQuestion);
    setQuizSession(prepared);
    setSessionIndex(0);
    setSelected(null);
    setSaInput('');
    setSaRevealed(false);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(true);
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
    setSaInput('');
    setSaRevealed(false);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(false);
    setMode('quiz');
    markSeen(prepared.map((q) => q.id));
  };

  const toggleType = (key) => {
    setQuizTypes((t) => {
      const next = { ...t, [key]: !t[key] };
      const anyOn = next.mc || next.tf || next.sa || next.ms;
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

  const overallMastery = useMemo(() => {
    const allIds = [...flashcardsData.map((f) => f.id), ...questionsData.map((q) => q.id)];
    const correct = allIds.filter((id) => trackResults[id] === 'correct').length;
    return allIds.length ? Math.round((correct / allIds.length) * 100) : 0;
  }, [trackResults, flashcardsData, questionsData]);

  const currentCard = filteredFlashcards[fIndex];
  const currentQ = quizSession[sessionIndex];

  const nextCard = (outcome) => {
    if (currentCard) recordResult(currentCard.id, outcome);
    setFlipped(false);
    setFIndex((i) => (i + 1) % Math.max(filteredFlashcards.length, 1));
  };

  const advance = () => {
    setSelected(null);
    setSaInput('');
    setSaRevealed(false);
    setMsPending([]);
    if (sessionIndex + 1 >= quizSession.length) setQuizPhase('complete');
    else setSessionIndex((i) => i + 1);
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

  const rateSA = (outcome) => {
    if (!currentQ) return;
    const isCorrect = outcome === 'correct';
    recordResult(currentQ.id, outcome);
    setSessionScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setSessionAnswers((a) => [...a, { id: currentQ.id, cat: currentQ.cat, prompt: currentQ.question, correct: isCorrect }]);
    advance();
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
    saveResults({ ...results, [trackKey]: updated });
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
      <div className="max-w-md mx-auto px-4 py-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="itil-display" style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.1 }}>{track.label}</div>
            <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '2px' }}>{track.subtitle}</div>
          </div>
          <div className="flex items-start gap-2">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: COLOR.teal }}>{overallMastery}%</div>
              <div style={{ fontSize: '10px', color: COLOR.muted }}>mastered</div>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted, fontSize: '11px' }}
            >
              Reset
            </button>
          </div>
        </div>

        {visibleTracks.length > 1 && (
          <div className="flex gap-2 mb-4">
            {visibleTracks.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTrack(t.key)}
                className="flex-1"
                style={{
                  padding: '10px 4px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                  border: `1px solid ${activeTrack === t.key ? COLOR.gold : COLOR.border}`,
                  background: activeTrack === t.key ? 'rgba(227,178,60,0.14)' : COLOR.surface,
                  color: activeTrack === t.key ? COLOR.gold : COLOR.muted,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {syncMode === 'local' && (
          <div style={{ fontSize: '11px', color: COLOR.muted, marginBottom: '14px' }}>
            Saving progress to this browser. Open from your Claude account to sync across devices.
          </div>
        )}

        {confirmReset && (
          <div style={{ background: COLOR.surface, border: `1px solid ${COLOR.red}`, borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Clear saved progress for {track.label}?</div>
            <div className="flex gap-2">
              <button onClick={doReset} style={{ flex: 1, background: COLOR.red, color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 600 }}>Clear it</button>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLOR.border}`, color: COLOR.text, borderRadius: '8px', padding: '8px', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-4" style={{ background: COLOR.surface, padding: '4px', borderRadius: '12px', border: `1px solid ${COLOR.border}` }}>
          <button
            onClick={() => setMode('flashcards')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'flashcards' ? COLOR.teal : 'transparent', color: mode === 'flashcards' ? '#0E1210' : COLOR.muted }}
          >
            Cards
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'quiz' ? COLOR.teal : 'transparent', color: mode === 'quiz' ? '#0E1210' : COLOR.muted }}
          >
            Quiz
          </button>
          <button
            onClick={() => setMode('study')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'study' ? COLOR.teal : 'transparent', color: mode === 'study' ? '#0E1210' : COLOR.muted }}
          >
            Study
          </button>
          <button
            onClick={() => setMode('exam')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'exam' ? COLOR.gold : 'transparent', color: mode === 'exam' ? '#241C08' : COLOR.muted }}
          >
            Exam
          </button>
        </div>

        {mode !== 'exam' && !(mode === 'study' && DATA[activeTrack].lessons) && (
          <div className="flex gap-2 mb-5" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <CategoryChip label="All" active={activeCat === 'all'} mastery={overallMastery / 100} onClick={() => setActiveCat('all')} />
            {categories.map((c) => (
              <CategoryChip key={c.key} label={c.label} active={activeCat === c.key} mastery={masteryByCategory[c.key]} onClick={() => setActiveCat(c.key)} />
            ))}
          </div>
        )}

        {mode === 'flashcards' && (
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
            {availableQuestions.length === 0 ? (
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
                saInput={saInput}
                setSaInput={setSaInput}
                saRevealed={saRevealed}
                onRevealSA={() => setSaRevealed(true)}
                onRateSA={rateSA}
                onNext={advance}
                index={sessionIndex}
                total={quizSession.length}
                categoryLabel={categories.find((c) => c.key === currentQ?.cat)?.label}
                missedBadge={isMissedSession}
                msPending={msPending}
                onToggleMs={toggleMs}
                onSubmitMs={submitMsAnswer}
              />
            )}
          </React.Fragment>
        )}

        {mode === 'study' && (
          DATA[activeTrack].lessons ? (
            <CourseView
              lessons={DATA[activeTrack].lessons}
              flashcardsData={flashcardsData}
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
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.teal, color: '#0E1210', fontSize: '14px', fontWeight: 600 }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setExamPhase('complete')}
                    className="flex-1"
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.gold, color: '#241C08', fontSize: '14px', fontWeight: 700 }}
                  >
                    Submit Exam
                  </button>
                )}
              </div>
              <button
                onClick={() => setExamPhase('complete')}
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
                    background: (masteryByCategory[c.key] || 0) > 0.7 ? COLOR.teal : COLOR.gold,
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
