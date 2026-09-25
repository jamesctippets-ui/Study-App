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

// Like pickRotated (still biased toward least-recently-seen items within
// each category), but round-robins across every category present in the
// pool so the resulting set is genuinely spread across topics rather than
// leaving that to chance — interleaved practice is more evidence-backed
// for exam-day transfer than "blocked" (all one topic) practice, which is
// what picking a single category already gives you. Used for the "All
// categories" quiz pool specifically so it's a deliberate mixed-practice
// mode, not just "no filter."
function pickInterleaved(pool, count, seenMap) {
  const byCat = {};
  pool.forEach((q) => { (byCat[q.cat] = byCat[q.cat] || []).push(q); });
  const cats = shuffleArray(Object.keys(byCat));
  cats.forEach((c) => {
    byCat[c] = shuffleArray(byCat[c]).sort((a, b) => ((seenMap && seenMap[a.id]) || 0) - ((seenMap && seenMap[b.id]) || 0));
  });
  const picked = [];
  let i = 0;
  while (picked.length < count && cats.some((c) => byCat[c].length)) {
    const c = cats[i % cats.length];
    if (byCat[c].length) picked.push(byCat[c].shift());
    i++;
  }
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

/* ---------------- spaced repetition (flashcards) ---------------- */

// Simplified SM-2. `prev` is this card's current schedule
// ({interval, ease, reps, due}), or undefined for a never-rated card.
// Returns the next schedule after rating it 'correct' or 'incorrect'. A
// miss resets the interval to 1 day but only dents the ease factor rather
// than losing all history, so a card that's usually easy recovers its
// longer interval faster than one that's chronically shaky.
function nextSrsEntry(prev, outcome, now) {
  const t = now || Date.now();
  const DAY = 86400000;
  const p = prev || { interval: 0, ease: 2.5, reps: 0, due: t };
  if (outcome === 'correct') {
    const reps = p.reps + 1;
    const ease = Math.min(2.8, p.ease + 0.1);
    const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(p.interval * ease));
    return { interval, ease, reps, due: t + interval * DAY };
  }
  const ease = Math.max(1.3, p.ease - 0.2);
  return { interval: 1, ease, reps: 0, due: t };
}

function normalizeSrs(raw) {
  if (!raw) return emptyTrackMap();
  const map = emptyTrackMap();
  TRACKS.forEach((t) => { map[t.key] = raw[t.key] || {}; });
  return map;
}

/* ---------------- cert path (personal study-order plan) ---------------- */

// `order` is the user's chosen sequence of track keys (not necessarily all
// 15 — only the ones they've added to their plan). `scheduled`/`completed`
// are keyed by track key: scheduled holds an optional 'YYYY-MM-DD' exam
// date, completed holds the 'YYYY-MM-DD' date the user marked it passed
// (its mere presence means "done"). A completed track stays in `order` —
// it's just filtered out of the active/"up next" view — so un-completing it
// restores its original position instead of losing its place in line.
function emptyCertPlan() {
  return { order: [], scheduled: {}, completed: {} };
}

function normalizeCertPlan(raw) {
  const base = emptyCertPlan();
  if (!raw || typeof raw !== 'object') return base;
  const validKeys = new Set(TRACKS.map((t) => t.key));
  const order = Array.isArray(raw.order) ? raw.order.filter((k) => validKeys.has(k)) : [];
  const scheduled = {};
  if (raw.scheduled && typeof raw.scheduled === 'object') {
    Object.keys(raw.scheduled).forEach((k) => {
      if (validKeys.has(k) && typeof raw.scheduled[k] === 'string') scheduled[k] = raw.scheduled[k];
    });
  }
  const completed = {};
  if (raw.completed && typeof raw.completed === 'object') {
    Object.keys(raw.completed).forEach((k) => {
      if (validKeys.has(k) && typeof raw.completed[k] === 'string') completed[k] = raw.completed[k];
    });
  }
  return { order, scheduled, completed };
}

// The first track in the plan's order that hasn't been marked completed —
// the single "what's next" recommendation the whole feature is built around.
function nextInCertPath(certPlan) {
  return certPlan.order.find((k) => !certPlan.completed[k]) || null;
}

// Reorders `key` one step toward the front/back of the plan, relative only
// to the other still-active (not-completed) tracks — a completed track's
// position in the underlying array is skipped over rather than swapped
// with, since it's hidden from the view this button lives on and swapping
// with it would look like a no-op to the user.
function moveActiveTrack(order, completed, key, direction) {
  const activeKeys = order.filter((k) => !completed[k]);
  const idx = activeKeys.indexOf(key);
  if (idx === -1) return order;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= activeKeys.length) return order;
  const otherKey = activeKeys[swapWith];
  const a = order.indexOf(key);
  const b = order.indexOf(otherKey);
  const next = [...order];
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

// Splits a `total`-question session across `trackKeys` (already in
// priority order — index 0 is the highest-priority/"Up next" cert) using
// harmonic weights (1, 1/2, 1/3, ...): the primary cert gets the largest
// single share, and each subsequent cert contributes a smaller
// supplemental share to reinforce it, rather than every active cert
// competing for equal coverage. Uses largest-remainder apportionment so
// the quotas always sum to exactly `total`. When there isn't even one
// slot per track, the top-weighted tracks get one each and the rest get
// none, rather than everyone rounding down to zero.
function weightedTrackQuotas(trackKeys, total) {
  const n = trackKeys.length;
  const map = {};
  if (!n || total <= 0) return map;
  if (total < n) {
    trackKeys.forEach((key, i) => { map[key] = i < total ? 1 : 0; });
    return map;
  }
  const weights = trackKeys.map((_, i) => 1 / (i + 1));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  // Every included track is guaranteed at least 1 slot (floor at 1 before
  // scaling back down to `total`), so a long tail of supplemental certs
  // never gets rounded away to zero coverage entirely.
  const raw = weights.map((w) => Math.max(1, (w / weightSum) * total));
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((v) => (v / rawSum) * total);
  const floors = scaled.map(Math.floor);
  const remainder = total - floors.reduce((a, b) => a + b, 0);
  const byFrac = scaled
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) floors[byFrac[k % n].i] += 1;
  trackKeys.forEach((key, i) => { map[key] = floors[i]; });
  return map;
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// e.g. "Nov 15 · in 32 days" / "Nov 15 · today" / "Nov 15 · 3 days past" —
// used on the scheduled-test badge in both the cert path panel and the
// track menu's compact chip.
function formatScheduledLabel(dateStr) {
  const days = daysBetween(todayString(), dateStr);
  const when = formatDateShort(dateStr);
  if (days === 0) return `${when} · today`;
  if (days > 0) return `${when} · in ${days} day${days === 1 ? '' : 's'}`;
  const overdue = -days;
  return `${when} · ${overdue} day${overdue === 1 ? '' : 's'} past`;
}

// Orders a track's flashcards for Cards-mode review: cards that are due (or
// have never been rated at all) sort first, most-overdue first; cards not
// yet due follow, soonest-due first. A seeded shuffle breaks ties so cards
// with the same due-ness don't always land in the same relative order.
function orderBySrs(list, srsForTrack, now) {
  const t = now || Date.now();
  const NEVER_RATED = Number.MIN_SAFE_INTEGER;
  const shuffled = seededShuffle(list, 7);
  const withDue = shuffled.map((card, i) => {
    const entry = srsForTrack && srsForTrack[card.id];
    return { card, due: entry ? entry.due : NEVER_RATED, i };
  });
  withDue.sort((a, b) => (a.due - b.due) || (a.i - b.i));
  return withDue.map((x) => x.card);
}

// Triggers a browser download of `data` as a formatted JSON file. Returns
// false instead of throwing if the browser blocks it (e.g. sandboxed iframe).
function downloadJSON(filename, data) {
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
}

// Validates and normalizes a parsed JSON object from a previously-exported
// progress file. Returns null if it doesn't look like one of ours at all,
// so the caller can show an error instead of silently wiping progress.
function parseImportedProgress(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.results && !raw.seenLog && !raw.stats) return null;
  return {
    results: normalizeResults(raw.results),
    seenLog: normalizeSeenLog(raw.seenLog),
    stats: normalizeStats(raw.stats),
    srs: normalizeSrs(raw.srs),
    certPlan: normalizeCertPlan(raw.certPlan),
  };
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
    lastVisited: null,
  };
}

function normalizeStats(raw) {
  const base = emptyStats();
  if (!raw || typeof raw !== 'object') return base;
  const lastVisited = raw.lastVisited && raw.lastVisited.track ? raw.lastVisited : null;
  return {
    streak: { ...base.streak, ...(raw.streak || {}) },
    counts: { ...base.counts, ...(raw.counts || {}) },
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : [],
    lastVisited,
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

