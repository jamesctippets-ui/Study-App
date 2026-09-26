/* ---------------- main app ---------------- */

function CertStudyApp() {
  const [theme, toggleTheme] = useTheme();
  const [activeTrack, setActiveTrack] = useState('az900');
  const [mode, setMode] = useState('home');
  const [learnView, setLearnView] = useState('study');
  const [quizView, setQuizView] = useState('questions');
  const [activeCat, setActiveCat] = useState('all');
  const [results, setResults] = useState(emptyTrackMap);
  const [seenLog, setSeenLog] = useState(emptyTrackMap);
  const [srs, setSrs] = useState(emptyTrackMap);
  const [certPlan, setCertPlan] = useState(emptyCertPlan);
  const [flipped, setFlipped] = useState(false);
  const [fIndex, setFIndex] = useState(0);
  const [syncMode, setSyncMode] = useState('loading');
  const [saveError, setSaveError] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [showAchievements, setShowAchievements] = useState(false);
  const [toastAchievement, setToastAchievement] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showCertPath, setShowCertPath] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

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
  // Today's Mix — a single quiz session pulling from every active track in
  // the user's My Cert Path at once (see startTodaysMix below), each
  // question tagged with its own source track (`__track`) since there's
  // no single activeTrack for a session that spans several certs.
  const [isMixSession, setIsMixSession] = useState(false);
  const [msPending, setMsPending] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const { ttsRate, ttsVoiceURI, setTtsRate, setTtsVoiceURI } = useTtsPrefs();
  const [ttsVoices, setTtsVoices] = useState([]);

  // Verbal Quiz — a hands-free, audio-only quiz flow (read question, pause
  // to think, read the answer + explanation, auto-advance). Deliberately a
  // separate state machine from the tap-to-answer quiz above: there's no
  // captured answer here, so it can't share sessionScore/sessionAnswers,
  // and its read-pause-reveal-advance sequencing needs a strict chained
  // order (see the driver effect below) that the tap-driven flow has no
  // use for.
  const [verbalPhase, setVerbalPhase] = useState('setup'); // 'setup' | 'active' | 'paused' | 'complete'
  const [verbalSession, setVerbalSession] = useState([]);
  const [verbalIndex, setVerbalIndex] = useState(0);
  const [verbalStep, setVerbalStep] = useState('question');
  const [verbalLength, setVerbalLength] = useState(10);
  const [verbalPauseSec, setVerbalPauseSec] = useState(6);
  const verbalTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // CLI/PowerShell command-practice mode (ROADMAP.md section 4) — only
  // meaningful for tracks that ship CLI_CHALLENGES (AZ-104, AZ-802 today).
  const [cliSession, setCliSession] = useState([]);
  const [cliIndex, setCliIndex] = useState(0);
  const [cliInput, setCliInput] = useState('');
  const [cliResult, setCliResult] = useState(null);
  const [cliScore, setCliScore] = useState({ correct: 0, total: 0 });

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

  // Mirror results/seenLog/stats so persistPayload can always read the
  // latest value of the two fields a given save*() call isn't itself
  // updating. Plain state closures go stale within a single effects-flush
  // (e.g. selecting a track fires both the quiz-session-start effect and
  // the last-visited-tracking effect in the same tick) — updating these
  // refs synchronously, right alongside every setResults/setSeenLog/
  // setStats call, means the second effect to run always sees the first
  // one's write instead of overwriting it with a stale copy.
  const resultsRef = useRef(results);
  const seenLogRef = useRef(seenLog);
  const statsRef = useRef(stats);
  const srsRef = useRef(srs);
  const certPlanRef = useRef(certPlan);

  const track = TRACKS.find((t) => t.key === activeTrack);
  const visibleTracks = TRACKS.filter((t) => !t.hidden);
  const categories = DATA[activeTrack].categories;
  const flashcardsData = DATA[activeTrack].flashcards;
  const questionsData = DATA[activeTrack].questions;
  const trackResults = results[activeTrack] || {};

  // Applies a freshly-loaded (not user-edited) value to both the React
  // state and its mirror ref, without triggering a persistPayload write —
  // used wherever data is loaded FROM storage rather than saved TO it.
  const applyResults = (v) => { resultsRef.current = v; setResults(v); };
  const applySeenLog = (v) => { seenLogRef.current = v; setSeenLog(v); };
  const applyStats = (v) => { statsRef.current = v; setStats(v); };
  const applySrs = (v) => { srsRef.current = v; setSrs(v); };
  const applyCertPlan = (v) => { certPlanRef.current = v; setCertPlan(v); };

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
        applyResults(normalizeResults(local.results || local));
        if (local.seenLog) applySeenLog(normalizeSeenLog(local.seenLog));
        if (local.stats) applyStats(normalizeStats(local.stats));
        if (local.srs) applySrs(normalizeSrs(local.srs));
        if (local.certPlan) applyCertPlan(normalizeCertPlan(local.certPlan));
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
                    if (data && data.results) applyResults(normalizeResults(data.results));
                    if (data && data.seenLog) applySeenLog(normalizeSeenLog(data.seenLog));
                    if (data && data.stats) applyStats(normalizeStats(data.stats));
                    if (data && data.srs) applySrs(normalizeSrs(data.srs));
                    if (data && data.certPlan) applyCertPlan(normalizeCertPlan(data.certPlan));
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

  // saveLocal's return tells us whether the write actually landed —
  // silently swallowing a failure (a full quota, private-browsing
  // restrictions) would mean progress just stops saving with no signal
  // at all, which is the opposite of "runs smoothly." setSaveError drives
  // a small banner instead.
  const persistPayload = (payload) => {
    if (docRef.current) {
      writeChain.current = writeChain.current.then(() =>
        docRef.current.set(payload).then(
          () => setSaveError(false),
          () => setSaveError(!saveLocal(payload))
        )
      );
    } else {
      setSaveError(!saveLocal(payload));
    }
  };

  const saveResults = (nextResults) => {
    resultsRef.current = nextResults;
    setResults(nextResults);
    persistPayload({ results: nextResults, seenLog: seenLogRef.current, stats: statsRef.current, srs: srsRef.current, certPlan: certPlanRef.current, updatedAt: Date.now() });
  };

  const saveSeen = (nextSeenLog) => {
    seenLogRef.current = nextSeenLog;
    setSeenLog(nextSeenLog);
    persistPayload({ results: resultsRef.current, seenLog: nextSeenLog, stats: statsRef.current, srs: srsRef.current, certPlan: certPlanRef.current, updatedAt: Date.now() });
  };

  const saveStats = (nextStats) => {
    statsRef.current = nextStats;
    setStats(nextStats);
    persistPayload({ results: resultsRef.current, seenLog: seenLogRef.current, stats: nextStats, srs: srsRef.current, certPlan: certPlanRef.current, updatedAt: Date.now() });
  };

  const saveSrs = (nextSrs) => {
    srsRef.current = nextSrs;
    setSrs(nextSrs);
    persistPayload({ results: resultsRef.current, seenLog: seenLogRef.current, stats: statsRef.current, srs: nextSrs, certPlan: certPlanRef.current, updatedAt: Date.now() });
  };

  const saveCertPlan = (nextCertPlan) => {
    certPlanRef.current = nextCertPlan;
    setCertPlan(nextCertPlan);
    persistPayload({ results: resultsRef.current, seenLog: seenLogRef.current, stats: statsRef.current, srs: srsRef.current, certPlan: nextCertPlan, updatedAt: Date.now() });
  };

  const addToCertPath = (key) => {
    if (certPlan.order.includes(key)) return;
    saveCertPlan({ ...certPlan, order: [...certPlan.order, key] });
  };

  const removeFromCertPath = (key) => {
    const scheduled = { ...certPlan.scheduled }; delete scheduled[key];
    const completed = { ...certPlan.completed }; delete completed[key];
    saveCertPlan({ order: certPlan.order.filter((k) => k !== key), scheduled, completed });
  };

  const moveCertPath = (key, direction) => {
    saveCertPlan({ ...certPlan, order: moveActiveTrack(certPlan.order, certPlan.completed, key, direction) });
  };

  const setCertScheduled = (key, dateOrNull) => {
    const scheduled = { ...certPlan.scheduled };
    if (dateOrNull) scheduled[key] = dateOrNull; else delete scheduled[key];
    saveCertPlan({ ...certPlan, scheduled });
  };

  const toggleCertCompleted = (key) => {
    const completed = { ...certPlan.completed };
    if (completed[key]) delete completed[key]; else completed[key] = todayString();
    saveCertPlan({ ...certPlan, completed });
  };

  const goToCertPathTrack = (key) => {
    setActiveTrack(key);
    setMode((m) => (m === 'home' ? 'learn' : m));
    setShowCertPath(false);
  };

  // Track-parameterized so Today's Mix (spanning several certs at once,
  // with no single activeTrack) can record each question against its own
  // source track — markSeen/recordResult are just these pinned to
  // activeTrack, for every other session type that only ever touches one.
  // Reads/writes through the refs (not the `seenLog`/`results` state
  // closures) so back-to-back calls in the same tick — e.g. Today's Mix
  // marking several tracks seen in one forEach — each see the previous
  // call's write instead of racing on a stale closure and losing all but
  // the last one.
  const markSeenFor = (trackKey, ids) => {
    if (!ids.length) return;
    const now = Date.now();
    const trackLog = { ...(seenLogRef.current[trackKey] || {}) };
    ids.forEach((id, idx) => { trackLog[id] = now + idx; });
    saveSeen({ ...seenLogRef.current, [trackKey]: trackLog });
  };

  const recordResultFor = (trackKey, id, outcome) => {
    saveResults({ ...resultsRef.current, [trackKey]: { ...(resultsRef.current[trackKey] || {}), [id]: outcome } });
  };

  const markSeen = (ids) => markSeenFor(activeTrack, ids);
  const recordResult = (id, outcome) => recordResultFor(activeTrack, id, outcome);

  const recordSrs = (id, quality) => {
    const trackSrs = srs[activeTrack] || {};
    const nextEntry = nextSrsEntry(trackSrs[id], quality);
    saveSrs({ ...srs, [activeTrack]: { ...trackSrs, [id]: nextEntry } });
  };

  // Reads/writes through statsRef (not the `stats` state closure) for the
  // same reason markSeenFor/recordResultFor do — a rating and its
  // resulting daily-goal bump can land in the same tick as other stats
  // writes, and a stale closure here would silently drop progress toward
  // today's goal.
  const bumpDailyGoal = (n = 1) => {
    const current = statsRef.current;
    saveStats({ ...current, dailyGoal: recordDailyActivity(current.dailyGoal, n) });
  };

  const setDailyGoalTarget = (target) => {
    const current = statsRef.current;
    saveStats({ ...current, dailyGoal: { ...current.dailyGoal, target } });
  };

  // Merges a patch into today's dailyChallenge, discarding whichever half
  // (question/vocab) belongs to a stale date instead of carrying it
  // forward under today's date — otherwise answering today's question
  // before ever revealing yesterday's vocab would make it look like
  // today's vocab was already revealed too.
  const withTodaysChallenge = (patch) => {
    const current = statsRef.current.dailyChallenge;
    const today = todayString();
    const base = current && current.date === today ? current : { date: today, question: null, vocab: null };
    return { ...base, ...patch, date: today };
  };

  const answerDailyQuestion = (trackKey, question, isCorrect, selected) => {
    recordResultFor(trackKey, question.id, isCorrect ? 'correct' : 'incorrect');
    bumpDailyGoal(1);
    saveStats({
      ...statsRef.current,
      dailyChallenge: withTodaysChallenge({ question: { id: question.id, selected, correct: isCorrect } }),
    });
  };

  const revealDailyVocab = (trackKey, card) => {
    bumpDailyGoal(1);
    saveStats({
      ...statsRef.current,
      dailyChallenge: withTodaysChallenge({ vocab: { id: card.id, revealed: true } }),
    });
  };

  const speak = (id, text) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = ttsRate;
    if (ttsVoiceURI) {
      const voice = ttsVoices.find((v) => v.voiceURI === ttsVoiceURI);
      if (voice) utter.voice = voice;
    }
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    // Keep a reference so the utterance isn't garbage-collected mid-speech
    // (a well-known cross-browser bug that cuts playback short or silently
    // no-ops).
    utterRef.current = utter;
    setSpeakingId(id);
    // speak() MUST run synchronously within this same click-handler call
    // stack — Safari (especially iOS) only allows speech synthesis inside
    // a direct user-gesture chain, and a setTimeout/Promise tick in between
    // breaks that chain, silently dropping the utterance. Do not defer this.
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
    // eslint-disable-next-line
  }, []);

  // Chrome (and others) populate the voice list asynchronously — it's
  // often empty on the very first call, then fires 'voiceschanged' once
  // real voices are ready. Reading it both ways covers browsers that never
  // fire that event too (it's already populated by the time this runs).
  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => setTtsVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    // eslint-disable-next-line
  }, []);

  // Verbal Quiz's read-pause-reveal-advance driver. Deliberately separate
  // from speak()/speakingId above, which is a one-shot per-item toggle (tap
  // to read one card, tap again to stop) — this needs a strict chained
  // sequence per question (question -> [options] -> thinking pause ->
  // answer -> explanation -> next question), driven by each utterance's
  // onend. Runs only while verbalPhase is 'active'; the effect's own
  // cleanup below cancels speech/clears the pause timer the instant
  // verbalPhase changes away from 'active' (paused, or navigated off this
  // tab entirely), and Resume simply re-runs the same step rather than
  // trying to resume mid-sentence — far more reliable cross-browser than
  // speechSynthesis.pause()/.resume(), which several mobile browsers
  // implement inconsistently.
  useEffect(() => {
    if (verbalPhase !== 'active') return undefined;
    const q = verbalSession[verbalIndex];
    if (!q) { setVerbalPhase('complete'); return undefined; }
    const steps = q.type === 'tf' ? ['question', 'thinking', 'answer', 'explanation'] : ['question', 'options', 'thinking', 'answer', 'explanation'];

    const goNext = () => {
      const i = steps.indexOf(verbalStep);
      if (i === -1 || i + 1 >= steps.length) {
        if (verbalIndex + 1 >= verbalSession.length) { setVerbalPhase('complete'); return; }
        setVerbalIndex(verbalIndex + 1);
        setVerbalStep('question');
        return;
      }
      setVerbalStep(steps[i + 1]);
    };

    if (verbalStep === 'thinking') {
      verbalTimerRef.current = setTimeout(goNext, verbalPauseSec * 1000);
      return () => clearTimeout(verbalTimerRef.current);
    }

    const letter = (i) => String.fromCharCode(65 + i);
    let text = '';
    if (verbalStep === 'question') text = q.type === 'tf' ? `${q.question} True, or false?` : q.question;
    else if (verbalStep === 'options') text = q.options.map((opt, i) => `Option ${letter(i)}: ${opt}.`).join(' ');
    else if (verbalStep === 'answer') {
      text = q.type === 'tf'
        ? `The correct answer is ${q.answer ? 'True' : 'False'}.`
        : `The correct answer is option ${letter(q.correct)}: ${q.options[q.correct]}.`;
    } else if (verbalStep === 'explanation') text = q.explanation;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = ttsRate;
    if (ttsVoiceURI) {
      const voice = ttsVoices.find((v) => v.voiceURI === ttsVoiceURI);
      if (voice) utter.voice = voice;
    }
    utter.onend = goNext;
    utter.onerror = goNext;
    window.speechSynthesis.speak(utter);
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verbalPhase, verbalIndex, verbalStep]);

  // Screen Wake Lock — keeps the screen from auto-locking while a Verbal
  // Quiz session is actively playing, since speechSynthesis playback is
  // commonly suspended the moment a mobile browser tab is backgrounded or
  // the screen locks (a platform limitation no web app can override).
  // Feature-detected: silently a no-op on browsers without support.
  useEffect(() => {
    if (verbalPhase !== 'active' || !('wakeLock' in navigator)) return undefined;
    let cancelled = false;
    navigator.wakeLock.request('screen').then((lock) => {
      if (cancelled) { lock.release().catch(() => {}); return; }
      wakeLockRef.current = lock;
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (wakeLockRef.current) { wakeLockRef.current.release().catch(() => {}); wakeLockRef.current = null; }
    };
  }, [verbalPhase]);

  // Leaving the Verbal Quiz tab (or switching tracks) mid-session should
  // stop the audio rather than let it keep talking in the background —
  // resets back to its own setup screen so returning to the tab starts
  // fresh rather than resuming a stale session.
  useEffect(() => {
    if (mode === 'quiz' && quizView === 'verbal') return;
    if (speechSupported) window.speechSynthesis.cancel();
    setVerbalPhase((p) => (p === 'setup' ? p : 'setup'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quizView, activeTrack]);

  const verbalPool = useMemo(() => {
    const byCat = activeCat === 'all' ? questionsData : questionsData.filter((q) => q.cat === activeCat);
    // Multi-select questions don't map to an audio-only pause/reveal flow
    // — there's nothing to "select" without a mic — so they're excluded
    // from this mode's pool entirely, per ROADMAP.md section 16.
    return byCat.filter((q) => q.type !== 'ms');
  }, [activeCat, questionsData]);

  const startVerbalSession = () => {
    const len = Math.min(verbalLength, verbalPool.length);
    const picked = activeCat === 'all'
      ? pickInterleaved(verbalPool, len, seenLog[activeTrack] || {})
      : pickRotated(verbalPool, len, seenLog[activeTrack] || {});
    const prepared = picked.map(prepareQuestion);
    setVerbalSession(prepared);
    setVerbalIndex(0);
    setVerbalStep('question');
    setVerbalPhase('active');
    markSeen(prepared.map((q) => q.id));
  };

  const toggleVerbalPause = () => setVerbalPhase((p) => (p === 'paused' ? 'active' : 'paused'));

  const skipVerbal = () => {
    if (speechSupported) window.speechSynthesis.cancel();
    clearTimeout(verbalTimerRef.current);
    if (verbalIndex + 1 >= verbalSession.length) { setVerbalPhase('complete'); return; }
    setVerbalIndex(verbalIndex + 1);
    setVerbalStep('question');
    setVerbalPhase('active');
  };

  // The Commands sub-tab only exists for tracks with CLI_CHALLENGES —
  // switching to a track without any (from a track that has them, with
  // that tab still selected) needs to fall back to Questions rather than
  // render nothing.
  useEffect(() => {
    if (quizView === 'commands' && !DATA[activeTrack].cliChallenges) setQuizView('questions');
  }, [activeTrack, quizView]);

  const startCliPractice = () => {
    const all = DATA[activeTrack].cliChallenges || [];
    const pool = activeCat === 'all' ? all : all.filter((c) => c.cat === activeCat);
    setCliSession(shuffleArray(pool));
    setCliIndex(0);
    setCliInput('');
    setCliResult(null);
    setCliScore({ correct: 0, total: 0 });
  };

  useEffect(() => {
    if (mode !== 'quiz' || quizView !== 'commands') return;
    startCliPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quizView, activeTrack, activeCat]);

  const submitCliAnswer = () => {
    const challenge = cliSession[cliIndex];
    if (!challenge) return;
    const result = checkCliAnswer(challenge, cliInput);
    setCliResult(result);
    const isCorrect = result === 'exact' || result === 'close';
    setCliScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  };

  const nextCliChallenge = () => {
    setCliIndex((i) => i + 1);
    setCliInput('');
    setCliResult(null);
  };

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

  // Ordered by spaced-repetition due-ness (most overdue or never-rated
  // first) as of the moment you enter this category/track — deliberately
  // NOT re-sorted on every rating (srs isn't a dependency here), so the
  // order stays stable for the rest of this browsing session instead of
  // reshuffling underneath you card-by-card. It re-evaluates next time you
  // switch category, switch track, or reload.
  const filteredFlashcards = useMemo(() => {
    const list = activeCat === 'all' ? flashcardsData : flashcardsData.filter((c) => c.cat === activeCat);
    return orderBySrs(list, srsRef.current[activeTrack] || {});
    // syncMode is included so this recomputes once when the initial
    // cloud/local load finishes (loading -> local/cloud is a one-time
    // transition), picking up real srs data instead of the empty default —
    // not so it re-sorts on every subsequent change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, flashcardsData, syncMode]);

  useEffect(() => { setFIndex(0); setFlipped(false); }, [activeCat, mode, learnView, activeTrack]);
  useEffect(() => { setActiveCat('all'); }, [activeTrack]);

  // Scrolls back to the top on every real navigation (mode/track/sub-tab
  // change) — without this, switching views keeps whatever scroll
  // position the previous one was at, which is easy to not notice on a
  // short view but strands you mid-page (header and all) after leaving a
  // deeply-scrolled one, most obviously Home once its dropdown is open.
  useEffect(() => {
    // The global `html { scroll-behavior: smooth }` (used for in-page
    // anchor jumps elsewhere) would otherwise turn this reset into a
    // slow animated scroll instead of an instant one.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [mode, activeTrack, learnView, quizView]);

  // Real client-side routing: the URL hash always reflects where you are
  // (#/home, #/az900/learn/study, #/az900/quiz/questions, #/az900/exam),
  // so the browser back/forward buttons work and a link to a specific
  // track+view is shareable/refreshable instead of always dropping back
  // onto Home.
  //
  // routeStateRef always holds the latest mode/activeTrack/learnView/
  // quizView, kept current every render (a plain assignment, not an
  // effect — this needs to be readable synchronously from inside a
  // mount-once event listener, which closes over its first render's
  // values forever otherwise). applyHash reads it to tell a real
  // navigation (the parsed hash actually differs from current state)
  // apart from the harmless echo `location.hash = ...` itself generates
  // a moment after every state-driven write below — without that check,
  // the echo would still call the setters with values equal to current
  // state, which is a same-value no-op that never re-renders and so
  // never gets to reset a "just applied a hash" flag, permanently
  // stalling every navigation after the first.
  const routeStateRef = useRef({ mode, activeTrack, learnView, quizView });
  routeStateRef.current = { mode, activeTrack, learnView, quizView };

  useEffect(() => {
    const validTrackKeys = new Set(visibleTracks.map((t) => t.key));
    function applyHash() {
      const parsed = parseHash(window.location.hash, validTrackKeys);
      const cur = routeStateRef.current;
      const same = parsed.mode === 'home'
        ? cur.mode === 'home'
        : parsed.trackKey === cur.activeTrack && parsed.mode === cur.mode
          && (parsed.mode !== 'learn' || parsed.learnView === cur.learnView)
          && (parsed.mode !== 'quiz' || parsed.quizView === cur.quizView);
      if (same) return;
      if (parsed.mode === 'home') {
        setMode('home');
        return;
      }
      setActiveTrack(parsed.trackKey);
      setMode(parsed.mode);
      if (parsed.mode === 'learn') setLearnView(parsed.learnView);
      if (parsed.mode === 'quiz') setQuizView(parsed.quizView);
    }
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState(null, '', '#/home');
    } else {
      applyHash();
    }
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hash = routeToHash(mode, activeTrack, learnView, quizView);
    if (window.location.hash !== hash) window.location.hash = hash.replace(/^#/, '');
  }, [mode, activeTrack, learnView, quizView]);

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
    // "All categories" is a deliberate mixed-practice mode — interleave
    // across every category on purpose (pickInterleaved) rather than
    // leaving the topic mix to chance (pickRotated), which is what a
    // single category's blocked practice already gives you.
    const picked = activeCat === 'all'
      ? pickInterleaved(availableQuestions, len, seenLog[activeTrack] || {})
      : pickRotated(availableQuestions, len, seenLog[activeTrack] || {});
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
    setIsMixSession(false);
    markSeen(prepared.map((q) => q.id));
    // eslint-disable-next-line
  }, [availableQuestions, quizLength, seenLog, activeTrack, activeCat]);

  useEffect(() => {
    if (mode !== 'quiz') return;
    if (skipNextAutoStart.current) { skipNextAutoStart.current = false; return; }
    // A lesson quiz, missed-review, or Today's Mix session is a deliberately
    // curated set of questions — a stray category-chip tap (the weighted
    // mastery bar at the bottom of every screen sets activeCat too) must not
    // silently discard it and replace it with a freshly rolled generic session.
    if (isLessonSession || isMissedSession || isMixSession) return;
    startNewSession();
    // eslint-disable-next-line
  }, [mode, activeCat, quizLength, typesKey, activeTrack]);

  // The app always opens on Home (mode's initial state) rather than
  // auto-jumping back into the last track+mode — Home is the landing
  // screen by design, not a temporary detour on the way back to where you
  // were. "Continue where you left off" on Home still gets you there in
  // one tap, via stats.lastVisited tracked below.

  // Tracks the last track+mode actually visited (learn/quiz/exam only —
  // Home itself isn't a "place" worth resuming into) so Home's "continue
  // where you left off" button has somewhere real to point to. Skipped
  // until the initial cloud/local sync finishes, so it can't stomp a
  // freshly-loaded lastVisited with the component's default state.
  // Declared after the quiz-session-start effect above (also keyed on
  // activeTrack/mode) so that when both fire in the same commit, this
  // one's persistPayload call — which folds its update onto the same
  // `stats` closure — runs last and its write isn't the one that gets
  // overwritten.
  useEffect(() => {
    if (syncMode === 'loading' || mode === 'home') return;
    const current = stats.lastVisited;
    if (current && current.track === activeTrack && current.mode === mode) return;
    saveStats({ ...stats, lastVisited: { track: activeTrack, mode } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack, mode, syncMode]);

  // Logs one readiness snapshot a day for Home's "current cert" — the
  // only source readinessProjection has to extrapolate from. Only writes
  // when today's score for that track has actually changed from what's
  // already stored, so this doesn't spam a write on every render; it's
  // gated to when Home is actually open since that's the only place the
  // projection is shown.
  useEffect(() => {
    if (syncMode === 'loading' || mode !== 'home') return;
    const trackKey = focusTrackKey(certPlan, stats.lastVisited);
    const score = examReadiness(trackKey, results, seenLog).score;
    const today = todayString();
    const history = statsRef.current.readinessHistory || {};
    const trackHistory = history[trackKey] || [];
    const last = trackHistory[trackHistory.length - 1];
    if (last && last.date === today && last.score === score) return;
    saveStats({ ...statsRef.current, readinessHistory: recordReadinessSnapshot(history, trackKey, score) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, syncMode, results, seenLog, certPlan, stats.lastVisited]);

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
    setIsMixSession(false);
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
    setIsMixSession(false);
    skipNextAutoStart.current = true;
    setMode('quiz');
    setQuizView('questions');
    markSeen(prepared.map((q) => q.id));
  };

  const startCategoryQuiz = (catKey) => {
    startLessonQuiz(questionsData.filter((q) => q.cat === catKey).map((q) => q.id));
  };

  // Today's Mix: one quiz session drawn from every active (not-yet-passed)
  // track in the user's My Cert Path, weighted by priority order so the
  // top cert gets primary coverage and the rest supplement it, rather than
  // every active cert competing for equal space. Each question carries its
  // own `__track` since there's no single activeTrack for a session that
  // spans several certs — chooseAnswer/submitMsAnswer already record
  // against that per-question track instead of activeTrack.
  const startTodaysMix = () => {
    const activeTrackKeys = certPlan.order.filter((k) => !certPlan.completed[k] && DATA[k]);
    if (!activeTrackKeys.length) return;
    const quotas = weightedTrackQuotas(activeTrackKeys, quizLength);
    let combined = [];
    const seenByTrack = {};
    activeTrackKeys.forEach((key) => {
      const quota = quotas[key] || 0;
      if (!quota) return;
      const pool = DATA[key].questions.filter((q) => quizTypes[q.type]);
      if (!pool.length) return;
      const picked = pickRotated(pool, Math.min(quota, pool.length), seenLog[key] || {});
      const prepared = picked.map((q) => ({ ...prepareQuestion(q), __track: key }));
      combined = combined.concat(prepared);
      seenByTrack[key] = prepared.map((q) => q.id);
    });
    combined = shuffleArray(combined);
    setQuizSession(combined);
    setSessionIndex(0);
    setSelected(null);
    setMsPending([]);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, total: 0 });
    setQuizPhase('active');
    setIsMissedSession(false);
    setIsLessonSession(false);
    setIsMixSession(true);
    skipNextAutoStart.current = true;
    setMode('quiz');
    setQuizView('questions');
    Object.keys(seenByTrack).forEach((key) => markSeenFor(key, seenByTrack[key]));
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

  // Logs one per-category mastery snapshot a day for whichever track is
  // actually open (not Home — there's no single "the" track there), so
  // the weighted-mastery breakdown can show a real "+8% this week"
  // instead of only ever a live snapshot. Skipped when nothing's actually
  // changed today, same self-correcting pattern as the readiness-history
  // effect above.
  useEffect(() => {
    if (syncMode === 'loading' || mode === 'home') return;
    const pcts = {};
    categories.forEach((c) => { pcts[c.key] = Math.round((masteryByCategory[c.key] || 0) * 100); });
    const today = todayString();
    const history = statsRef.current.categoryMasteryHistory || {};
    const trackHistory = history[activeTrack] || {};
    const unchanged = categories.every((c) => {
      const catHistory = trackHistory[c.key] || [];
      const last = catHistory[catHistory.length - 1];
      return last && last.date === today && last.pct === pcts[c.key];
    });
    if (unchanged) return;
    saveStats({ ...statsRef.current, categoryMasteryHistory: recordCategoryMasterySnapshot(history, activeTrack, pcts) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, syncMode, activeTrack, masteryByCategory, categories]);

  const overallMastery = useMemo(() => trackMastery(activeTrack, results), [activeTrack, results]);

  // Cheat sheet's "Official resources" block: the track-level links already
  // shown on the Exam tab, plus every category's own links, deduped by URL
  // so a link that's relevant at both levels isn't listed twice.
  const cheatSheetResources = useMemo(() => {
    const all = [...(EXAM_CONFIG[activeTrack].resources || [])];
    categories.forEach((c) => { if (c.resources) all.push(...c.resources); });
    const seen = new Set();
    return all.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
  }, [activeTrack, categories]);

  const currentCard = filteredFlashcards[fIndex];
  const currentQ = quizSession[sessionIndex];

  // `quality` is the 1-5 confidence rating FlashcardView collects. SRS
  // scheduling uses the raw rating (real SM-2 quality scale); mastery %
  // stays on the binary signal the rest of the app already assumes, via
  // ratingToOutcome's 3+-counts-as-correct rule — see its comment in
  // 03_helpers.js for why that seam exists.
  const nextCard = (quality) => {
    if (currentCard) {
      recordResult(currentCard.id, ratingToOutcome(quality));
      recordSrs(currentCard.id, quality);
      bumpDailyGoal(1);
    }
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
    const qTrack = currentQ.__track || activeTrack;
    recordResultFor(qTrack, currentQ.id, isCorrect ? 'correct' : 'incorrect');
    bumpDailyGoal(1);
    setSessionScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setSessionAnswers((a) => [...a, { id: currentQ.id, cat: currentQ.cat, prompt: currentQ.question, correct: isCorrect, explanation: currentQ.explanation, track: qTrack }]);
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
    const qTrack = currentQ.__track || activeTrack;
    recordResultFor(qTrack, currentQ.id, isCorrect ? 'correct' : 'incorrect');
    bumpDailyGoal(1);
    setSessionScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setSessionAnswers((a) => [...a, { id: currentQ.id, cat: currentQ.cat, prompt: currentQ.question, correct: isCorrect, explanation: currentQ.explanation, track: qTrack }]);
  };

  const doReset = () => {
    saveResults({ ...results, [activeTrack]: {} });
    saveSrs({ ...srs, [activeTrack]: {} });
  };

  // Triggers a browser download of `data` as a formatted JSON file. Lives
  // here rather than in 03_helpers.js because it's a DOM-touching browser
  // utility, not portable "core" logic — a future React Native client
  // sharing that file wouldn't have `document`/`Blob`/`URL` to call.
  // Returns false instead of throwing if the browser blocks it (e.g. a
  // sandboxed iframe).
  const downloadJSON = (filename, data) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const doExport = () => {
    const ok = downloadJSON(`cert-study-hub-progress-${todayString()}.json`, { results, seenLog, stats, srs, certPlan, exportedAt: Date.now() });
    setImportMessage(ok ? { ok: true, text: 'Downloaded.' } : { ok: false, text: "Couldn't start the download — try again." });
  };

  const doImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (e) {
        setImportMessage({ ok: false, text: "That file isn't valid JSON." });
        return;
      }
      const normalized = parseImportedProgress(parsed);
      if (!normalized) {
        setImportMessage({ ok: false, text: "That doesn't look like a Cert Study Hub progress export." });
        return;
      }
      applyResults(normalized.results);
      applySeenLog(normalized.seenLog);
      applyStats(normalized.stats);
      applySrs(normalized.srs);
      applyCertPlan(normalized.certPlan);
      persistPayload({ results: normalized.results, seenLog: normalized.seenLog, stats: normalized.stats, srs: normalized.srs, certPlan: normalized.certPlan, updatedAt: Date.now() });
      setImportMessage({ ok: true, text: 'Progress restored.' });
    };
    reader.onerror = () => setImportMessage({ ok: false, text: "Couldn't read that file." });
    reader.readAsText(file);
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
      return { id: q.id, cat: q.cat, prompt: q.question, correct: isCorrect, answered, explanation: q.explanation };
    });
    setExamResult({ correct, total: examSession.length, items });
    const trackKey = examTrack || activeTrack;
    const updated = { ...(results[trackKey] || {}) };
    items.forEach((it) => { updated[it.id] = it.correct ? 'correct' : 'incorrect'; });
    const nextResults = { ...results, [trackKey]: updated };
    const pct = examSession.length ? Math.round((correct / examSession.length) * 100) : 0;
    const passed = pct >= EXAM_CONFIG[trackKey].passPct;
    const answeredCount = items.filter((it) => it.answered).length;
    const statsWithExam = passed ? { ...stats, counts: { ...stats.counts, examsPassed: stats.counts.examsPassed + 1 } } : stats;
    const nextStats = { ...statsWithExam, dailyGoal: recordDailyActivity(statsWithExam.dailyGoal, answeredCount) };
    resultsRef.current = nextResults;
    statsRef.current = nextStats;
    setResults(nextResults);
    setStats(nextStats);
    persistPayload({ results: nextResults, seenLog: seenLogRef.current, stats: nextStats, srs: srsRef.current, certPlan: certPlanRef.current, updatedAt: Date.now() });
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
      {showAbout && <AboutLegalPanel onClose={() => setShowAbout(false)} />}
      {showGlossary && <GlossaryPanel onClose={() => setShowGlossary(false)} />}
      {showCertPath && (
        <CertPathPanel
          tracks={visibleTracks}
          certPlan={certPlan}
          onAddTrack={addToCertPath}
          onRemoveTrack={removeFromCertPath}
          onMove={moveCertPath}
          onSetScheduled={setCertScheduled}
          onToggleCompleted={toggleCertCompleted}
          onGoToTrack={goToCertPathTrack}
          onStartMix={startTodaysMix}
          onClose={() => setShowCertPath(false)}
        />
      )}
      {showData && (
        <DataPanel
          trackLabel={track.label}
          onExport={doExport}
          onImportFile={doImportFile}
          importMessage={importMessage}
          onReset={doReset}
          onClose={() => setShowData(false)}
          speechSupported={speechSupported}
          ttsVoices={ttsVoices}
          ttsRate={ttsRate}
          ttsVoiceURI={ttsVoiceURI}
          onSetTtsRate={setTtsRate}
          onSetTtsVoiceURI={setTtsVoiceURI}
          onTestVoice={() => speak('__tts_test__', 'This is how flashcards and questions will sound when read aloud.')}
          isTestSpeaking={speakingId === '__tts_test__'}
        />
      )}
      <div style={{ background: COLOR.navBar, borderBottom: `1px solid ${COLOR.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.12)', position: 'relative', zIndex: 1 }}>
        <div className="max-w-md mx-auto px-4" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex justify-between items-start">
            <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingRight: '10px' }}>
              {mode !== 'home' && (
                <button
                  onClick={() => setMode('home')}
                  title="Home"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px',
                    borderRadius: '8px', border: 'none', background: 'transparent', color: COLOR.muted,
                    marginBottom: '2px', padding: 0,
                  }}
                >
                  <IconMenu />
                </button>
              )}
              {mode === 'home' ? (
                <React.Fragment>
                  <div className="itil-display" style={{ fontSize: '21px', fontWeight: 600, lineHeight: 1.2 }}>Cert Study Hub</div>
                  <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '2px' }}>
                    {stats.streak.current > 0 ? `🔥 ${stats.streak.current}-day streak` : 'Pick a track to get started'}
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="itil-display" style={{ fontSize: '21px', fontWeight: 600, lineHeight: 1.2, color: trackAccent(activeTrack) }}>{track.label}</div>
                  <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '2px' }}>{track.subtitle}</div>
                </React.Fragment>
              )}
            </div>
            <div className="flex items-start gap-1" style={{ flexShrink: 0 }}>
              {mode !== 'home' && (
                <div style={{ textAlign: 'right', marginRight: '2px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: COLOR.success }}>{overallMastery}%</div>
                </div>
              )}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button
                onClick={() => setShowAchievements(true)}
                title="Achievements"
                style={{
                  minWidth: '40px', minHeight: '40px', padding: '6px 10px', borderRadius: '10px',
                  border: `1px solid ${COLOR.gold}`, background: 'transparent', color: COLOR.gold, fontSize: '12px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <IconTrophy /> {stats.unlocked.length}
              </button>
              <button
                onClick={() => { setImportMessage(null); setShowData(true); }}
                title="Data & progress"
                style={{
                  minWidth: '40px', minHeight: '40px', padding: '6px 10px', borderRadius: '10px',
                  border: `1px solid ${COLOR.border}`, background: 'transparent', color: COLOR.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconSettings />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-5">
        {saveError ? (
          <div style={{ fontSize: '10.5px', color: COLOR.red, marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${COLOR.red}`, background: 'rgba(181,87,74,0.1)' }}>
            Your last save didn't go through — your browser's storage may be full. Try Data &amp; Progress → Export to back up what you have, then free up some space.
          </div>
        ) : syncMode === 'local' && (
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '12px' }}>
            Saving progress to this browser. Open from your Claude account to sync across devices.
          </div>
        )}

        {mode === 'home' ? (
          <HomeView
            tracks={visibleTracks}
            results={results}
            seenLog={seenLog}
            stats={stats}
            certPlan={certPlan}
            onResume={() => {
              if (stats.lastVisited) { setActiveTrack(stats.lastVisited.track); setMode(stats.lastVisited.mode); }
            }}
            onSelectTrack={(key) => { setActiveTrack(key); setMode('learn'); }}
            onOpenAbout={() => setShowAbout(true)}
            onOpenGlossary={() => setShowGlossary(true)}
            onOpenCertPath={() => setShowCertPath(true)}
            onSetGoalTarget={setDailyGoalTarget}
            onAnswerDailyQuestion={answerDailyQuestion}
            onRevealDailyVocab={revealDailyVocab}
          />
        ) : (
        <React.Fragment>
        <div className="flex gap-1 mb-4" style={{ boxShadow: SHADOW.card, background: COLOR.surface, padding: '4px', borderRadius: '12px', border: `1px solid ${COLOR.border}` }}>
          <button
            onClick={() => setMode('learn')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'learn' ? COLOR.primary : 'transparent', color: mode === 'learn' ? COLOR.onAccent : COLOR.muted }}
          >
            Learn
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'quiz' ? COLOR.primary : 'transparent', color: mode === 'quiz' ? COLOR.onAccent : COLOR.muted }}
          >
            Quiz
          </button>
          <button
            onClick={() => setMode('exam')}
            className="flex-1"
            style={{ padding: '8px 2px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, background: mode === 'exam' ? COLOR.gold : 'transparent', color: mode === 'exam' ? COLOR.onAccent : COLOR.muted }}
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
              onClick={() => setLearnView('sheet')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: learnView === 'sheet' ? COLOR.surfaceRaised : 'transparent', color: learnView === 'sheet' ? COLOR.text : COLOR.muted }}
            >
              Sheet
            </button>
          </div>
        )}

        {mode === 'quiz' && (
          <div className="flex gap-1 mb-4" style={{ background: COLOR.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${COLOR.border}` }}>
            <button
              onClick={() => setQuizView('questions')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: quizView === 'questions' ? COLOR.surfaceRaised : 'transparent', color: quizView === 'questions' ? COLOR.text : COLOR.muted }}
            >
              Questions
            </button>
            <button
              onClick={() => setQuizView('match')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: quizView === 'match' ? COLOR.surfaceRaised : 'transparent', color: quizView === 'match' ? COLOR.text : COLOR.muted }}
            >
              Match
            </button>
            <button
              onClick={() => setQuizView('verbal')}
              className="flex-1"
              style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: quizView === 'verbal' ? COLOR.surfaceRaised : 'transparent', color: quizView === 'verbal' ? COLOR.text : COLOR.muted }}
            >
              Verbal
            </button>
            {DATA[activeTrack].cliChallenges && (
              <button
                onClick={() => setQuizView('commands')}
                className="flex-1"
                style={{ padding: '6px 2px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, background: quizView === 'commands' ? COLOR.surfaceRaised : 'transparent', color: quizView === 'commands' ? COLOR.text : COLOR.muted }}
              >
                Commands
              </button>
            )}
          </div>
        )}

        {(mode === 'quiz' || (mode === 'learn' && learnView !== 'sheet' && (learnView !== 'study' || !DATA[activeTrack].lessons))) && (
          <CategoryFilterSelect
            categories={categories}
            activeCat={activeCat}
            onChange={setActiveCat}
            masteryByCategory={masteryByCategory}
          />
        )}

        {mode === 'learn' && learnView === 'cards' && Object.keys(srs[activeTrack] || {}).length > 0 && (
          <div style={{ fontSize: '10.5px', color: COLOR.muted, marginBottom: '8px', textAlign: 'center' }}>
            Cards you're overdue to review come first.
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
            flashcardsData={flashcardsData}
          />
        )}

        {mode === 'quiz' && quizView === 'questions' && (
          <React.Fragment>
            {!isLessonSession && !isMissedSession && !isMixSession && quizPhase !== 'complete' && (
              <QuizSetup
                length={quizLength}
                setLength={setQuizLength}
                types={quizTypes}
                toggleType={toggleType}
                onReroll={startNewSession}
                poolSize={availableQuestions.length}
                missedCount={missedCount}
                onReviewMissed={startMissedSession}
                isMixed={activeCat === 'all'}
              />
            )}
            {!isLessonSession && !isMissedSession && !isMixSession && availableQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLOR.muted, fontSize: '13px', padding: '30px 10px' }}>
                No questions match this filter — try enabling another question type.
              </div>
            ) : quizPhase === 'complete' ? (
              <QuizSummary
                score={sessionScore}
                answers={sessionAnswers}
                categories={categories}
                onRestart={isMixSession ? startTodaysMix : startNewSession}
              />
            ) : (
              <QuestionView
                q={currentQ}
                selected={selected}
                onChoose={chooseAnswer}
                onNext={advance}
                index={sessionIndex}
                total={quizSession.length}
                categoryLabel={
                  isMixSession && currentQ?.__track
                    ? DATA[currentQ.__track].categories.find((c) => c.key === currentQ.cat)?.label
                    : categories.find((c) => c.key === currentQ?.cat)?.label
                }
                badgeLabel={
                  isMissedSession
                    ? 'Missed review'
                    : isLessonSession
                    ? 'Lesson quiz'
                    : isMixSession
                    ? (TRACKS.find((t) => t.key === currentQ?.__track)?.label || "Today's Mix")
                    : null
                }
                msPending={msPending}
                onToggleMs={toggleMs}
                onSubmitMs={submitMsAnswer}
                flashcardsData={flashcardsData}
              />
            )}
          </React.Fragment>
        )}

        {mode === 'quiz' && quizView === 'match' && (
          <MatchGame
            flashcards={filteredFlashcards}
            onRoundComplete={() => saveStats({ ...stats, counts: { ...stats.counts, matchRoundsCompleted: stats.counts.matchRoundsCompleted + 1 } })}
          />
        )}

        {mode === 'quiz' && quizView === 'verbal' && (
          <VerbalQuizPanel
            speechSupported={speechSupported}
            phase={verbalPhase}
            session={verbalSession}
            index={verbalIndex}
            step={verbalStep}
            length={verbalLength}
            setLength={setVerbalLength}
            pauseSec={verbalPauseSec}
            setPauseSec={setVerbalPauseSec}
            poolSize={verbalPool.length}
            categories={categories}
            onStart={startVerbalSession}
            onTogglePause={toggleVerbalPause}
            onSkip={skipVerbal}
            onRestart={() => setVerbalPhase('setup')}
          />
        )}

        {mode === 'quiz' && quizView === 'commands' && (
          <CommandPracticeView
            session={cliSession}
            index={cliIndex}
            score={cliScore}
            categories={categories}
            input={cliInput}
            setInput={setCliInput}
            result={cliResult}
            onSubmit={submitCliAnswer}
            onNext={nextCliChallenge}
            onRestart={startCliPractice}
          />
        )}

        {mode === 'learn' && learnView === 'study' && (
          DATA[activeTrack].lessons ? (
            <CourseView
              key={activeTrack}
              lessons={DATA[activeTrack].lessons}
              flashcardsData={flashcardsData}
              questionsData={questionsData}
              categories={categories}
              onQuiz={startLessonQuiz}
              speakingId={speakingId}
              onSpeak={speak}
              speechSupported={speechSupported}
              masteryFn={lessonMastery}
            />
          ) : (
            <StudyView activeCat={activeCat} categories={categories} flashcards={flashcardsData} questionsData={questionsData} onQuizCategory={startCategoryQuiz} />
          )
        )}

        {mode === 'learn' && learnView === 'sheet' && (
          <CheatSheetView trackLabel={track.label} sections={DATA[activeTrack].cheatSheet || []} resources={cheatSheetResources} />
        )}

        {mode === 'exam' && (
          examPhase === 'intro' ? (
            <ExamIntro track={track} config={EXAM_CONFIG[activeTrack]} readiness={examReadiness(activeTrack, results, seenLog)} onStart={startExam} />
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
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 600 }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setExamPhase('complete')}
                    className="flex-1"
                    style={{ padding: '12px', borderRadius: '12px', background: COLOR.gold, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700 }}
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
            {categories.map((c) => {
              const trend = categoryMasteryTrend(stats.categoryMasteryHistory || {}, activeTrack, c.key);
              const pct = Math.round((masteryByCategory[c.key] || 0) * 100);
              return (
                <div
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  title={`${c.label}: ${pct}%${trend ? ` (${trend.delta > 0 ? '+' : ''}${trend.delta}% over ${trend.days}d)` : ''}`}
                  style={{ flexGrow: c.marks, cursor: 'pointer', background: COLOR.surfaceRaised, position: 'relative' }}
                >
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      width: `${pct}%`,
                      background: (masteryByCategory[c.key] || 0) > 0.7 ? COLOR.success : COLOR.gold,
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* A tap/hover title alone doesn't work on touch devices, so the
              per-category % and trend are also spelled out here — the
              only place this app shows mastery moving over time, not just
              a live snapshot. */}
          <div className="flex flex-col gap-1 mt-2">
            {categories.map((c) => {
              const trend = categoryMasteryTrend(stats.categoryMasteryHistory || {}, activeTrack, c.key);
              const pct = Math.round((masteryByCategory[c.key] || 0) * 100);
              return (
                <div key={c.key} className="flex justify-between" style={{ fontSize: '10px', color: COLOR.muted }}>
                  <span>{c.label}</span>
                  <span>
                    {pct}%
                    {trend && (
                      <span style={{ color: trend.delta > 0 ? COLOR.success : COLOR.red, marginLeft: '4px' }}>
                        ({trend.delta > 0 ? '+' : ''}{trend.delta}% / {trend.days}d)
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        </React.Fragment>
        )}
      </div>
    </div>
  );
}
