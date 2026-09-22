/* ---------------- helpers ---------------- */

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareQuestion(q) {
  if (q.type === 'mc') {
    const order = shuffleArray(q.options.map((_, i) => i));
    return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
  }
  if (q.type === 'ms') {
    const order = shuffleArray(q.options.map((_, i) => i));
    const correct = q.correct.map((i) => order.indexOf(i)).sort((a, b) => a - b);
    return { ...q, options: order.map((i) => q.options[i]), correct };
  }
  return q;
}

function pickRotated(pool, count, seenMap) {
  const withRecency = pool.map((q) => ({ q, last: (seenMap && seenMap[q.id]) || 0 }));
  const shuffled = shuffleArray(withRecency);
  shuffled.sort((a, b) => a.last - b.last);
  const picked = shuffled.slice(0, count).map((x) => x.q);
  return shuffleArray(picked);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveLocal(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // ignore, best effort
  }
}

function emptyTrackMap() {
  const map = {};
  TRACKS.forEach((t) => { map[t.key] = {}; });
  return map;
}

function normalizeResults(raw) {
  if (!raw) return emptyTrackMap();
  const isPerTrackShape = TRACKS.some((t) => raw[t.key]);
  if (isPerTrackShape) {
    const map = emptyTrackMap();
    TRACKS.forEach((t) => { map[t.key] = raw[t.key] || {}; });
    return map;
  }
  // legacy flat shape from before multi-track support existed — treat it as ITIL progress
  const map = emptyTrackMap();
  map.itil = raw;
  return map;
}

function normalizeSeenLog(raw) {
  if (!raw) return emptyTrackMap();
  const map = emptyTrackMap();
  TRACKS.forEach((t) => { map[t.key] = raw[t.key] || {}; });
  return map;
}

/* ---------------- stats & achievements ---------------- */

function todayString() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db - da) / 86400000);
}

function emptyStats() {
  return {
    streak: { current: 0, longest: 0, lastActiveDate: null },
    counts: { quizzesCompleted: 0, examsPassed: 0, matchRoundsCompleted: 0, perfectQuizzes: 0 },
    unlocked: [],
  };
}

function normalizeStats(raw) {
  const base = emptyStats();
  if (!raw || typeof raw !== 'object') return base;
  return {
    streak: { ...base.streak, ...(raw.streak || {}) },
    counts: { ...base.counts, ...(raw.counts || {}) },
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : [],
  };
}

// Advances the streak at most once per calendar day. Consecutive days
// increment it; a gap of more than one day resets it to 1 rather than 0,
// since today itself is still a day of activity.
function advanceStreak(streak) {
  const today = todayString();
  if (streak.lastActiveDate === today) return streak;
  const gap = streak.lastActiveDate ? daysBetween(streak.lastActiveDate, today) : null;
  const nextCurrent = gap === 1 ? streak.current + 1 : 1;
  return { current: nextCurrent, longest: Math.max(streak.longest, nextCurrent), lastActiveDate: today };
}

const ACHIEVEMENTS = [
  { id: 'first-steps', icon: '🌱', title: 'First Steps', description: 'Answer your first question or flashcard correctly.', check: (c) => c.totalCorrect >= 1, target: (c) => [Math.min(c.totalCorrect, 1), 1] },
  { id: 'quick-learner', icon: '📘', title: 'Quick Learner', description: '25 correct answers, all-time.', check: (c) => c.totalCorrect >= 25, target: (c) => [Math.min(c.totalCorrect, 25), 25] },
  { id: 'century-club', icon: '💯', title: 'Century Club', description: '100 correct answers, all-time.', check: (c) => c.totalCorrect >= 100, target: (c) => [Math.min(c.totalCorrect, 100), 100] },
  { id: 'half-grand', icon: '🏅', title: 'Half Grand', description: '500 correct answers, all-time.', check: (c) => c.totalCorrect >= 500, target: (c) => [Math.min(c.totalCorrect, 500), 500] },
  { id: 'track-master', icon: '🎯', title: 'Track Master', description: 'Reach 100% mastery in any one track.', check: (c) => c.maxTrackMastery >= 100, target: (c) => [Math.min(Math.round(c.maxTrackMastery), 100), 100] },
  { id: 'well-rounded', icon: '🌐', title: 'Well-Rounded', description: 'Reach at least 50% mastery in every track.', check: (c) => c.minTrackMastery >= 50, target: (c) => [Math.min(Math.round(c.minTrackMastery), 50), 50] },
  { id: 'course-graduate', icon: '🎓', title: 'Course Graduate', description: 'Finish every lesson in a mini-course track.', check: (c) => c.anyCourseComplete, target: (c) => [c.anyCourseComplete ? 1 : 0, 1] },
  { id: 'streak-3', icon: '🔥', title: 'Warming Up', description: 'A 3-day study streak.', check: (c) => c.longestStreak >= 3, target: (c) => [Math.min(c.longestStreak, 3), 3] },
  { id: 'streak-7', icon: '🔥', title: 'On a Roll', description: 'A 7-day study streak.', check: (c) => c.longestStreak >= 7, target: (c) => [Math.min(c.longestStreak, 7), 7] },
  { id: 'streak-30', icon: '🔥', title: 'Dedicated', description: 'A 30-day study streak.', check: (c) => c.longestStreak >= 30, target: (c) => [Math.min(c.longestStreak, 30), 30] },
  { id: 'quiz-whiz', icon: '⚡', title: 'Quiz Whiz', description: 'Complete 10 quiz sessions.', check: (c) => c.quizzesCompleted >= 10, target: (c) => [Math.min(c.quizzesCompleted, 10), 10] },
  { id: 'quiz-marathoner', icon: '🏃', title: 'Quiz Marathoner', description: 'Complete 50 quiz sessions.', check: (c) => c.quizzesCompleted >= 50, target: (c) => [Math.min(c.quizzesCompleted, 50), 50] },
  { id: 'exam-ready', icon: '🏆', title: 'Exam Ready', description: 'Pass a timed Final Exam.', check: (c) => c.examsPassed >= 1, target: (c) => [Math.min(c.examsPassed, 1), 1] },
  { id: 'perfectionist', icon: '✨', title: 'Perfectionist', description: 'Score 100% on a quiz of 10+ questions.', check: (c) => c.perfectQuizzes >= 1, target: (c) => [Math.min(c.perfectQuizzes, 1), 1] },
  { id: 'match-maker', icon: '🧩', title: 'Match Maker', description: 'Complete 5 term-matching rounds.', check: (c) => c.matchRoundsCompleted >= 5, target: (c) => [Math.min(c.matchRoundsCompleted, 5), 5] },
];

// Aggregates stats across every track (not just the active one) — achievements
// are account-wide, matching the app's single-profile, no-login model.
function buildAchievementContext(results, stats) {
  let totalCorrect = 0;
  const trackMasteries = [];
  let anyCourseComplete = false;
  Object.keys(DATA).forEach((key) => {
    const mod = DATA[key];
    const trackResults = results[key] || {};
    const items = [...mod.flashcards.map((f) => f.id), ...mod.questions.map((q) => q.id)];
    const correctHere = items.filter((id) => trackResults[id] === 'correct').length;
    totalCorrect += correctHere;
    trackMasteries.push(items.length ? (correctHere / items.length) * 100 : 0);
    if (mod.lessons && mod.lessons.length) {
      const allStrong = mod.lessons.every((lesson) => {
        const ids = [...lesson.vocabIds, ...lesson.quizIds];
        const correct = ids.filter((id) => trackResults[id] === 'correct').length;
        return ids.length > 0 && correct / ids.length >= 0.7;
      });
      if (allStrong) anyCourseComplete = true;
    }
  });
  return {
    totalCorrect,
    maxTrackMastery: trackMasteries.length ? Math.max(...trackMasteries) : 0,
    minTrackMastery: trackMasteries.length ? Math.min(...trackMasteries) : 0,
    anyCourseComplete,
    longestStreak: stats.streak.longest,
    quizzesCompleted: stats.counts.quizzesCompleted,
    examsPassed: stats.counts.examsPassed,
    perfectQuizzes: stats.counts.perfectQuizzes,
    matchRoundsCompleted: stats.counts.matchRoundsCompleted,
  };
}

// Once earned, an achievement stays earned — `stats.unlocked` is the
// permanent record. a.check(ctx) alone is a live, re-evaluated condition
// (e.g. "mastery >= 50% in every track"), which can go false later for
// reasons that have nothing to do with the user losing progress, like a new
// track being added at 0% mastery. Union the two so a past achievement
// never appears to un-earn itself.
function evaluateAchievements(results, stats) {
  const ctx = buildAchievementContext(results, stats);
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(ctx) || stats.unlocked.includes(a.id), progress: a.target(ctx) }));
}

/* ---------------- learning paths ---------------- */

// Overall mastery % for a track that may not be the active one — the same
// calculation as CertStudyApp's own overallMastery, but callable for any key
// (used by the Path panel to show progress across every step at once).
function trackMastery(trackKey, results) {
  const mod = DATA[trackKey];
  if (!mod) return 0;
  const trackResults = results[trackKey] || {};
  const ids = [...mod.flashcards.map((f) => f.id), ...mod.questions.map((q) => q.id)];
  if (!ids.length) return 0;
  const correct = ids.filter((id) => trackResults[id] === 'correct').length;
  return Math.round((correct / ids.length) * 100);
}

