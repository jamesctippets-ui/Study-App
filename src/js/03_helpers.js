/* ---------------- helpers ---------------- */

// A rough, name-based quality signal for a SpeechSynthesisVoice — the Web
// Speech API exposes no real quality metadata, just `name`/`lang`/
// `localService`/`default`. Every OS/browser that ships a nicer neural
// voice alongside its older default one flags it in the name somehow
// ("Natural", "Online", "Neural", "Premium", "Enhanced", "Wavenet",
// "Studio" — Edge, Chrome, and Android all use one of these), and a
// non-local ("network") voice is usually backed by a cloud model rather
// than the OS's older on-device engine, so both are decent proxies for
// "this will sound smoother than the OS default" without ever being able
// to actually hear the voice first.
const TTS_QUALITY_NAME_HINTS = ['natural', 'neural', 'premium', 'enhanced', 'online', 'wavenet', 'studio'];
function voiceQualityScore(voice) {
  const name = (voice.name || '').toLowerCase();
  let score = 0;
  if (TTS_QUALITY_NAME_HINTS.some((hint) => name.includes(hint))) score += 10;
  if (voice.localService === false) score += 5;
  if (voice.default) score += 1;
  return score;
}

// The best-guess default voice for a language, used both to auto-select a
// voice when the user hasn't picked one explicitly and to sort the voice
// picker so the better-sounding options surface first within each
// language instead of plain alphabetical order.
function bestVoiceForLang(voices, langPrefix) {
  if (!voices || !voices.length) return null;
  const lower = langPrefix.toLowerCase();
  const candidates = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(lower));
  const pool = candidates.length ? candidates : voices;
  return [...pool].sort((a, b) => voiceQualityScore(b) - voiceQualityScore(a))[0];
}

// Splits a block of text into roughly one-sentence chunks for a chained
// sequence of shorter utterances instead of one long unbroken one. Several
// speech engines sound noticeably flatter/more monotone on a long run-on
// utterance (no real prosody reset between sentences) than on the same
// text spoken as several shorter utterances back to back, and very long
// text can hit a hard length cutoff on some engines. A plain sentence-
// boundary split (. ! ? followed by whitespace) is a good-enough
// heuristic here — it doesn't need to be perfect, just better than
// handing the whole paragraph over as one string.
function splitIntoSpeechChunks(text) {
  const parts = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!parts || parts.length <= 1) return [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

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

function normalizeCliText(s) {
  return (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Checks a typed CLI/PowerShell command against a challenge's canonical
// answer. Deliberately lenient about things that don't actually matter for
// learning the command's shape (whitespace, casing, flag order, and the
// exact values passed to a flag) while still requiring the right verb and
// every required flag to be present — "validated against expected syntax/
// flags" per ROADMAP.md section 4, not a byte-exact string match, which
// would fail correct answers over trivial formatting differences.
// Returns 'empty' | 'exact' | 'close' | 'incorrect'. 'close' means the verb
// and all required flags are present but the full string didn't match one
// of the canonical/alternate answers verbatim — still counted as correct
// for mastery purposes (see recordResult call sites), same seam as
// ratingToOutcome's 3+ threshold for flashcard ratings.
function checkCliAnswer(challenge, input) {
  const normInput = normalizeCliText(input);
  if (!normInput) return 'empty';
  const candidates = [challenge.command, ...(challenge.altCommands || [])].map(normalizeCliText);
  if (candidates.includes(normInput)) return 'exact';
  const verb = normalizeCliText(challenge.verb || challenge.command);
  const startsRight = normInput === verb || normInput.startsWith(verb + ' ');
  const requiredFlags = (challenge.requiredFlags || []).map(normalizeCliText);
  const hasAllFlags = requiredFlags.every((f) => normInput.includes(f));
  if (startsRight && hasAllFlags) return 'close';
  return 'incorrect';
}

// Step-ordering challenges (ROADMAP.md section 13) store `steps` in their
// correct order; the UI shuffles a working copy and tracks it as an array
// of ORIGINAL indices (e.g. [2,0,1] means "3rd step first, 1st step
// second, 2nd step last"). Correct iff that array is already [0,1,...,n-1]
// — i.e. every step ended up back in its original position.
function checkSequenceOrder(workingOrder) {
  return workingOrder.every((originalIndex, position) => originalIndex === position);
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

// Returns whether the write actually succeeded (it can fail silently
// otherwise — e.g. a full quota, private-browsing restrictions in some
// browsers) so the caller can surface that instead of losing progress
// with no signal at all.
function saveLocal(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
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

// Real SM-2, quality-scored. `prev` is this card's current schedule
// ({interval, ease, reps, due}), or undefined for a never-rated card.
// `quality` is the confidence rating a user picks after flipping a card,
// 1 (total blank) through 5 (instant, no hesitation) — the same 0-5
// "quality of response" scale SM-2 was originally designed around, not a
// bolted-on replacement for it. A quality below 3 is a miss: it resets
// the interval and repetition count (you're relearning it) but only
// dents the ease factor rather than losing all history, so a card that's
// usually easy recovers its longer interval faster than one that's
// chronically shaky. A quality of 3+ is a pass: the ease factor moves by
// the standard SM-2 formula (a 5 nudges it up more than a bare-pass 3),
// and the interval grows by the *current* ease — a 3 still advances the
// schedule, just more cautiously than a 5 would.
function nextSrsEntry(prev, quality, now) {
  const t = now || Date.now();
  const DAY = 86400000;
  const p = prev || { interval: 0, ease: 2.5, reps: 0, due: t };
  if (quality < 3) {
    const ease = Math.max(1.3, p.ease - 0.2);
    return { interval: 1, ease, reps: 0, due: t, last: quality };
  }
  const reps = p.reps + 1;
  const ease = Math.max(1.3, p.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.max(1, Math.round(p.interval * ease));
  return { interval, ease, reps, due: t + interval * DAY, last: quality };
}

// "Tough terms": cards whose most recent rating was 3 (OK) or lower. `last`
// is the raw 1-5 rating nextSrsEntry now stores alongside the schedule.
// Entries saved before it existed have no `last`; a miss (reps reset to 0)
// is the only thing they can still tell us, so that counts as tough, and
// anything with reps > 0 was a 3+ pass we can't distinguish from 4-5 and
// leave out rather than flood the deck with guesses. A card leaves the deck
// the next time it's rated 4 or 5.
const TOUGH_MAX_RATING = 3;
function isToughEntry(entry) {
  if (!entry) return false;
  if (typeof entry.last === 'number') return entry.last <= TOUGH_MAX_RATING;
  return entry.reps === 0;
}

// Tough card ids for a track, hardest first (lowest last rating, then the
// most overdue), restricted to ids that still exist in `flashcards`.
function toughCardIds(srsForTrack, flashcards) {
  const live = new Set((flashcards || []).map((c) => c.id));
  const rank = (e) => (typeof e.last === 'number' ? e.last : 2);
  return Object.keys(srsForTrack || {})
    .filter((id) => live.has(id) && isToughEntry(srsForTrack[id]))
    .sort((a, b) => rank(srsForTrack[a]) - rank(srsForTrack[b]) || (srsForTrack[a].due || 0) - (srsForTrack[b].due || 0));
}

// A flashcard rating (1-5) is stored for SRS scheduling above, but the
// app's lifetime "mastery %" (trackMastery, achievements, exam
// readiness) is built entirely on a binary correct/incorrect signal
// shared with quiz questions — rethreading that into a 1-5-aware
// average everywhere would be a much bigger, riskier change than the
// rating UI itself. This is the one deliberate seam: a 3+ (an actual
// pass, not just "not totally blank") counts as correct for mastery
// purposes, same as it does for the SRS growth branch above.
function ratingToOutcome(quality) {
  return quality >= 3 ? 'correct' : 'incorrect';
}

function normalizeSrs(raw) {
  if (!raw) return emptyTrackMap();
  const map = emptyTrackMap();
  TRACKS.forEach((t) => { map[t.key] = raw[t.key] || {}; });
  return map;
}

/* ---------------- client-side routing (hash-based) ---------------- */

// Deliberately hash-based (`#/az900/quiz/questions`) rather than real
// paths — a static site with no server has nowhere to add the rewrite
// rule a path-based router needs for a hard refresh on a deep link to
// resolve (GitHub Pages included), and a hash needs none: the fragment
// never even reaches the server. `mode === 'home'` collapses to a bare
// `#/home` since it has no track/sub-view of its own.
//
// The internal mode names ('learn', 'quiz') predate the Path / Practice /
// Reference / Exam navigation and are kept as-is so every session effect
// that keys off them still works; only the user-facing labels and URLs
// changed (learn -> reference, quiz -> practice). parseHash still accepts
// the old `learn`/`quiz` URL segments so existing bookmarks keep working.
function routeToHash(mode, trackKey, learnView, quizView) {
  if (mode === 'path') return `#/${trackKey}/path`;
  if (mode === 'learn') return `#/${trackKey}/reference/${learnView}`;
  if (mode === 'quiz') return `#/${trackKey}/practice/${quizView}`;
  if (mode === 'exam') return `#/${trackKey}/exam`;
  return '#/home';
}

// The inverse of routeToHash — turns whatever's currently in
// `location.hash` (on load, or after a hashchange from the back/forward
// buttons) back into the {mode, trackKey, learnView, quizView} state to
// apply. Falls back to `{ mode: 'home' }` for anything empty, malformed,
// or naming a track that doesn't exist (or is hidden) rather than
// crashing on a hand-edited or stale URL.
function parseHash(hash, validTrackKeys) {
  const path = (hash || '').replace(/^#\/?/, '');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length || parts[0] === 'home') return { mode: 'home' };
  const [trackKey, mode, sub] = parts;
  if (!validTrackKeys.has(trackKey)) return { mode: 'home' };
  if (mode === 'path') return { mode: 'path', trackKey };
  if (mode === 'reference' || mode === 'learn') return { mode: 'learn', trackKey, learnView: ['cards', 'study', 'sheet'].includes(sub) ? sub : 'study' };
  if (mode === 'practice' || mode === 'quiz') return { mode: 'quiz', trackKey, quizView: ['questions', 'match', 'verbal', 'commands', 'madlibs', 'sequence', 'casestudy', 'compare'].includes(sub) ? sub : 'questions' };
  if (mode === 'exam') return { mode: 'exam', trackKey };
  return { mode: 'home' };
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

// The user's active (not completed, not since-hidden) cert path, in the
// order they set it, each paired with its track record — the one shared
// list Home's path view, the header's track switcher, and CertPathPanel's
// editor all read from, so "your path" never means something different
// in one place than another.
function activeCertOrder(tracks, certPlan) {
  return certPlan.order
    .filter((k) => !certPlan.completed[k])
    .map((k) => tracks.find((t) => t.key === k))
    .filter(Boolean);
}

// A simple, stable string -> non-negative integer hash (not cryptographic,
// just deterministic) used to pick "of the day" content — the day's
// question/vocab card — from a date string, so the pick stays put across
// reloads and re-renders on the same day without needing to persist which
// item was chosen, only whether it's been answered/revealed yet.
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h;
}

function seededIndex(seedStr, len) {
  return len > 0 ? hashString(seedStr) % len : 0;
}

// Which track Home's "current cert" widgets — Question of the Day, Vocab
// of the Day, and the exam-readiness prediction — all focus on: the Cert
// Path's Up Next cert if one is set (the same priority pick Today's Mix
// weights around), else whichever track was last actually visited, else a
// sane default. One shared notion of "the cert you're currently working
// on" so these widgets agree with each other instead of each guessing
// independently.
function focusTrackKey(certPlan, lastVisited) {
  const nextKey = nextInCertPath(certPlan);
  if (nextKey && DATA[nextKey]) return nextKey;
  if (lastVisited && DATA[lastVisited.track]) return lastVisited.track;
  return 'az900';
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
function orderBySrs(list, srsForTrack) {
  const NEVER_RATED = Number.MIN_SAFE_INTEGER;
  const shuffled = seededShuffle(list, 7);
  const withDue = shuffled.map((card, i) => {
    const entry = srsForTrack && srsForTrack[card.id];
    return { card, due: entry ? entry.due : NEVER_RATED, i };
  });
  withDue.sort((a, b) => (a.due - b.due) || (a.i - b.i));
  return withDue.map((x) => x.card);
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
    counts: { quizzesCompleted: 0, examsPassed: 0, matchRoundsCompleted: 0, perfectQuizzes: 0, caseStudiesCompleted: 0, finalMocksPassed: 0 },
    unlocked: [],
    lastVisited: null,
    homePath: { mode: 'core', order: 'plan' },
    reviewReminder: { days: REVIEW_REMINDER_DEFAULT_DAYS, lastReviewAt: null },
    dailyGoal: { target: 20, date: null, count: 0 },
    dailyChallenge: { date: null, question: null, vocab: null },
    readinessHistory: {},
    categoryMasteryHistory: {},
    path: {},
    pathLocking: true,
  };
}

function normalizeStats(raw) {
  const base = emptyStats();
  if (!raw || typeof raw !== 'object') return base;
  const lastVisited = raw.lastVisited && raw.lastVisited.track ? raw.lastVisited : null;
  const rawGoal = raw.dailyGoal && typeof raw.dailyGoal === 'object' ? raw.dailyGoal : {};
  const target = Number.isFinite(rawGoal.target) && rawGoal.target > 0 ? rawGoal.target : base.dailyGoal.target;
  const count = Number.isFinite(rawGoal.count) && rawGoal.count >= 0 ? rawGoal.count : 0;
  const rawChallenge = raw.dailyChallenge && typeof raw.dailyChallenge === 'object' ? raw.dailyChallenge : {};
  return {
    streak: { ...base.streak, ...(raw.streak || {}) },
    counts: { ...base.counts, ...(raw.counts || {}) },
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : [],
    lastVisited,
    homePath: normalizeHomePath(raw.homePath),
    reviewReminder: normalizeReviewReminder(raw.reviewReminder),
    dailyGoal: { target, date: rawGoal.date || null, count },
    dailyChallenge: {
      date: rawChallenge.date || null,
      question: rawChallenge.question && typeof rawChallenge.question === 'object' ? rawChallenge.question : null,
      vocab: rawChallenge.vocab && typeof rawChallenge.vocab === 'object' ? rawChallenge.vocab : null,
    },
    readinessHistory: raw.readinessHistory && typeof raw.readinessHistory === 'object' ? raw.readinessHistory : {},
    categoryMasteryHistory: raw.categoryMasteryHistory && typeof raw.categoryMasteryHistory === 'object' ? raw.categoryMasteryHistory : {},
    path: normalizePathStats(raw.path),
    pathLocking: raw.pathLocking !== false,
  };
}

// Bumps today's study-activity count toward the daily goal ring. Rolls
// over to a fresh count (keeping the user's chosen target) the first time
// this fires on a new calendar day, rather than accumulating forever.
function recordDailyActivity(dailyGoal, n = 1) {
  const today = todayString();
  if (dailyGoal.date !== today) return { target: dailyGoal.target, date: today, count: n };
  return { ...dailyGoal, count: dailyGoal.count + n };
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

/* ---------------- guided study path ---------------- */

// A Duolingo-style walk through one track's content, built entirely from
// data the track already has — no extra authoring. One unit per lesson; each
// unit is a mixed-order run of steps (read, flashcards, quiz, a mini-game,
// an apply-it scenario, more cards/quiz, then a checkpoint) assembled from
// that lesson's own vocab/quiz ids plus whatever else in the track covers
// the same categories.
//
// Persisted shape (stats.path): { [trackKey]: { done: { [stepId]: { at, pct } } } }.
// A step id is `${lessonId}::${kind}`; ids that no longer match a lesson
// (content changed since the save) are simply ignored, never an error.

const PATH_PASS_PCT = 70;
const PATH_CARDS_FIRST = 7;
const PATH_CARDS_MORE = 8;
const PATH_QUICK_QUIZ = 5;
const PATH_PRACTICE_QUIZ = 8;
const PATH_CHECKPOINT_QUIZ = 8;
const PATH_CHECKPOINT_REVIEW = 3;
// Test-out: a harder, longer check that, if passed, marks a whole unit done so
// someone who already knows the material isn't made to re-read it.
const PATH_TESTOUT_PCT = 80;
const PATH_TESTOUT_QUESTIONS = 10;
const PATH_REVIEW_QUESTIONS = 8;

// The order rotates by unit so consecutive units don't feel identical.
// Steps with no material for a given unit (e.g. no extra flashcards, no
// scenario) are dropped when the unit is built.
const PATH_GAME_LABELS = { match: 'Match the terms', madlib: 'Mad Lib', sequence: 'Put it in order', compare: 'Pick the better answer' };

const PATH_VARIANTS = [
  ['read', 'cards', 'quiz', 'game', 'apply', 'cards2', 'quiz2', 'checkpoint'],
  ['read', 'quiz', 'cards', 'apply', 'game', 'quiz2', 'cards2', 'checkpoint'],
  ['read', 'game', 'cards', 'quiz', 'apply', 'quiz2', 'cards2', 'checkpoint'],
];

function normalizePathStats(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach((trackKey) => {
    const entry = raw[trackKey];
    const done = entry && typeof entry.done === 'object' && entry.done ? entry.done : {};
    const clean = {};
    Object.keys(done).forEach((stepId) => {
      const d = done[stepId];
      if (d && typeof d === 'object') {
        clean[stepId] = { at: typeof d.at === 'string' ? d.at : null, pct: Number.isFinite(d.pct) ? d.pct : null, via: d.via === 'testout' || d.via === 'skipped' ? d.via : null };
      }
    });
    const rawUnlocked = entry && typeof entry.unlocked === 'object' && entry.unlocked ? entry.unlocked : {};
    const unlocked = {};
    Object.keys(rawUnlocked).forEach((unitId) => { if (rawUnlocked[unitId]) unlocked[unitId] = true; });
    out[trackKey] = Object.keys(unlocked).length ? { done: clean, unlocked } : { done: clean };
  });
  return out;
}

// Marks one or more steps done. Steps already done keep their original
// record, so a later test-out never overwrites an honest earlier score.
function markPathStepsDone(pathStats, trackKey, stepIds, pct, today, via) {
  const base = pathStats || {};
  const track = base[trackKey] || { done: {} };
  const done = { ...track.done };
  stepIds.forEach((id) => {
    if (!done[id]) done[id] = { at: today, pct: Number.isFinite(pct) ? pct : null, via: via || null };
  });
  return { ...base, [trackKey]: { ...track, done } };
}

function markPathStepDone(pathStats, trackKey, stepId, pct, today, via) {
  const base = pathStats || {};
  const track = base[trackKey] || { done: {} };
  return { ...base, [trackKey]: { ...track, done: { ...track.done, [stepId]: { at: today, pct: Number.isFinite(pct) ? pct : null, via: via || null } } } };
}

// Unit locking on a cert's Path tab. A unit is locked while an earlier unit is
// unfinished, unless the learner unlocked it ("Unlock anyway") or already has
// progress in it (so saves from before locking existed never lock you out of
// work you've started). Turning locking off in settings unlocks everything.
function unlockPathUnit(pathStats, trackKey, unitId) {
  const base = pathStats || {};
  const track = base[trackKey] || { done: {} };
  return { ...base, [trackKey]: { ...track, unlocked: { ...(track.unlocked || {}), [unitId]: true } } };
}

function isPathUnitLocked(units, unit, doneMap, unlockedMap, lockingOn) {
  if (!lockingOn || unit.index === 0) return false;
  if (unlockedMap && unlockedMap[unit.id]) return false;
  if (unit.steps.some((st) => pathStepIsDone(doneMap, st.id))) return false;
  return units.some((u) => u.index < unit.index && !pathUnitProgress(u, doneMap).complete);
}

// Hands each item (anything with a `cat`) to one of the units that cover
// its category, round-robin, so material a lesson doesn't list explicitly
// still lands in exactly one unit instead of being duplicated across all of
// the lessons that happen to share a category.
function spreadAcrossUnits(items, units, claimed, push) {
  const counters = {};
  items.forEach((item) => {
    if (claimed && claimed.has(item.id)) return;
    const covering = units.filter((u) => u.cats.includes(item.cat));
    if (!covering.length) return;
    const n = counters[item.cat] || 0;
    push(covering[n % covering.length], item);
    counters[item.cat] = n + 1;
  });
}

function lessonHasApplyContent(lesson) {
  return !!(lesson.scenario || (lesson.commonTraps && lesson.commonTraps.length) || lesson.onTheJob || lesson.portalMockup);
}

function estimateReadMinutes(text) {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildPathUnits(trackKey) {
  const mod = DATA[trackKey];
  const lessons = (mod && mod.lessons) || [];
  if (!lessons.length) return [];
  const flashById = new Map(mod.flashcards.map((f) => [f.id, f]));
  const questionIds = new Set(mod.questions.map((q) => q.id));

  const units = lessons.map((lesson, index) => {
    const vocab = lesson.vocabIds.map((id) => flashById.get(id)).filter(Boolean);
    const cats = [...new Set(vocab.map((v) => v.cat))];
    const coreQuestionIds = lesson.quizIds.filter((id) => questionIds.has(id));
    if (!cats.length) {
      const byId = new Map(mod.questions.map((q) => [q.id, q]));
      coreQuestionIds.forEach((id) => { const q = byId.get(id); if (q && !cats.includes(q.cat)) cats.push(q.cat); });
    }
    return {
      id: lesson.id, index, lesson, cats,
      coreCardIds: vocab.map((v) => v.id),
      coreQuestionIds,
      extraCardIds: [],
      extraQuestionIds: [],
      games: [],
    };
  });

  const claimedCards = new Set(units.flatMap((u) => u.coreCardIds));
  const claimedQuestions = new Set(units.flatMap((u) => u.coreQuestionIds));
  spreadAcrossUnits(mod.flashcards, units, claimedCards, (u, f) => u.extraCardIds.push(f.id));
  spreadAcrossUnits(mod.questions, units, claimedQuestions, (u, q) => u.extraQuestionIds.push(q.id));
  const gameItems = [
    ...(mod.compare || []).map((g) => ({ kind: 'compare', id: g.id, cat: g.cat })),
    ...(mod.madlibs || []).map((g) => ({ kind: 'madlib', id: g.id, cat: g.cat })),
    ...(mod.sequences || []).map((g) => ({ kind: 'sequence', id: g.id, cat: g.cat })),
  ];
  spreadAcrossUnits(gameItems, units, null, (u, g) => u.games.push(g));

  return units.map((u) => {
    const { lesson } = u;
    const cardsA = u.coreCardIds.slice(0, PATH_CARDS_FIRST);
    const cardsB = [...u.coreCardIds.slice(PATH_CARDS_FIRST), ...u.extraCardIds].slice(0, PATH_CARDS_MORE);
    const quickPool = u.coreQuestionIds.length ? u.coreQuestionIds : u.extraQuestionIds;
    const fullPool = [...u.coreQuestionIds, ...u.extraQuestionIds];
    const game = u.games.length
      ? u.games[u.index % u.games.length]
      : (u.coreCardIds.length >= 3 ? { kind: 'match', id: null, cat: u.cats[0] } : null);
    const gameLabels = PATH_GAME_LABELS;
    const spec = {
      read: { label: 'Read the lesson', meta: `${estimateReadMinutes(lesson.reading)} min read`, ok: !!lesson.reading },
      cards: { label: 'Flashcards', meta: `${cardsA.length} cards`, cardIds: cardsA, ok: cardsA.length > 0 },
      quiz: { label: 'Quick check', meta: `${Math.min(PATH_QUICK_QUIZ, quickPool.length)} questions`, poolIds: quickPool, count: PATH_QUICK_QUIZ, ok: quickPool.length > 0 },
      game: { label: game ? gameLabels[game.kind] : 'Game', meta: 'Mini-game', game, ok: !!game },
      apply: { label: 'Apply it', meta: 'Scenario and on the job', ok: lessonHasApplyContent(lesson) },
      cards2: { label: 'More flashcards', meta: `${cardsB.length} cards`, cardIds: cardsB, ok: cardsB.length > 0 },
      quiz2: { label: 'Practice quiz', meta: `${Math.min(PATH_PRACTICE_QUIZ, fullPool.length)} questions`, poolIds: fullPool, count: PATH_PRACTICE_QUIZ, ok: fullPool.length > 0 },
      checkpoint: { label: 'Unit checkpoint', meta: `${Math.min(PATH_CHECKPOINT_QUIZ, fullPool.length + 3)} mixed questions`, poolIds: fullPool, count: PATH_CHECKPOINT_QUIZ, ok: fullPool.length > 0 },
    };
    const steps = PATH_VARIANTS[u.index % PATH_VARIANTS.length]
      .filter((kind) => spec[kind].ok)
      .map((kind) => ({ id: `${lesson.id}::${kind}`, kind, ...spec[kind] }));
    return {
      id: u.id, index: u.index, lesson, title: lesson.title, summary: lesson.summary, cats: u.cats,
      poolIds: fullPool, steps,
      // Not path steps themselves — what the Home path's optional sections
      // are built from (see buildOptionalSteps).
      coreCardIds: u.coreCardIds, extraCardIds: u.extraCardIds, extraQuestionIds: u.extraQuestionIds,
      games: u.games, coreGame: game,
    };
  });
}

function pathStepIsDone(doneMap, stepId) {
  return !!(doneMap && doneMap[stepId]);
}

function pathUnitProgress(unit, doneMap) {
  const total = unit.steps.length;
  const done = unit.steps.filter((s) => pathStepIsDone(doneMap, s.id)).length;
  return { done, total, complete: total > 0 && done === total };
}

// The first step you haven't finished, scanning in path order — what the
// "Continue" button opens. Null once everything is done.
function pathNextStep(units, doneMap) {
  for (const unit of units) {
    const step = unit.steps.find((s) => !pathStepIsDone(doneMap, s.id));
    if (step) return { unit, step };
  }
  return null;
}

function pathOverallProgress(units, doneMap) {
  let total = 0;
  let done = 0;
  let unitsComplete = 0;
  units.forEach((u) => {
    const p = pathUnitProgress(u, doneMap);
    total += p.total;
    done += p.done;
    if (p.complete) unitsComplete += 1;
  });
  return { total, done, unitsComplete, unitCount: units.length, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Questions worth revisiting: anything in a unit you've started that you last
// got wrong — whether that was on the path or in Practice, since both write to
// the same results. Oldest-seen first, so the longest-neglected come back
// before ones you just saw.
function pathReviewQuestionIds(units, doneMap, results, seenLog) {
  const started = units.filter((u) => u.steps.some((s) => pathStepIsDone(doneMap, s.id)));
  const ids = [...new Set(started.flatMap((u) => u.poolIds))].filter((id) => results[id] === 'incorrect');
  return ids.sort((a, b) => ((seenLog && seenLog[a]) || 0) - ((seenLog && seenLog[b]) || 0));
}

// The synthetic step a unit's "test out" runs as. Not part of unit.steps — it
// is never listed on the trail, only offered as a shortcut past it.
function pathTestOutStep(unit) {
  return {
    id: `${unit.id}::testout`, kind: 'testout', label: `Test out: ${unit.title}`, meta: `${PATH_TESTOUT_QUESTIONS} questions · ${PATH_TESTOUT_PCT}% to pass`,
    poolIds: unit.poolIds, count: PATH_TESTOUT_QUESTIONS,
  };
}

/* ---------------- cross-cert home path ---------------- */

// The Home tab's own study path: one trail built from every active cert in
// the user's plan, so a learner can work through their whole plan from
// Home and only open a cert when they want to go deeper. It adds no core
// content and no new progress record — each core entry is a unit/step
// buildPathUnits already produces for a cert, and finishing one writes to
// that cert's own stats.path[track].done, so Home and the cert's Path tab
// can never disagree.
//
// Certs run in plan order, one after another. What the learner chooses is
// how much surrounds that core: 'core' is just their certs, 'extended' mixes
// in optional sections — a deep dive on the unit's terms, extra games, and
// cross-cert "bridges" to other certs that teach the same idea. Optional
// steps are never required (each can be skipped), never count toward core
// progress, and never appear on a cert's own Path tab.
const HOME_PATH_MODES = ['core', 'extended'];
const HOME_PATH_UPCOMING = 3;
const BRIDGE_DONE_KEY = 'bridges';
const DEEP_DIVE_CARDS = 5;
const DEEP_DIVE_QUESTIONS = 4;
const BONUS_GAMES_PER_UNIT = 2;

// 'plan' follows the order the learner set; 'smart' puts certs with an
// upcoming exam first (soonest first) and orders the rest weakest first.
const HOME_PATH_ORDERS = ['plan', 'smart'];

// The cross-cert review reminder: an in-app nudge on Home (no notifications —
// this is a static app) once reviewable items have been waiting longer than the
// chosen number of days since the learner last started a Home review. `days`
// of 0 turns it off; `lastReviewAt` is a 'YYYY-MM-DD' date or null.
const REVIEW_REMINDER_OPTIONS = [
  { days: 0, label: 'Off' },
  { days: 1, label: 'Daily' },
  { days: 3, label: 'Every 3 days' },
  { days: 7, label: 'Weekly' },
];
const REVIEW_REMINDER_DEFAULT_DAYS = 3;

function normalizeReviewReminder(raw) {
  const days = raw && REVIEW_REMINDER_OPTIONS.some((o) => o.days === raw.days) ? raw.days : REVIEW_REMINDER_DEFAULT_DAYS;
  const last = raw && typeof raw.lastReviewAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastReviewAt) ? raw.lastReviewAt : null;
  return { days, lastReviewAt: last };
}

// { due, daysSince } — due only when the reminder is on, something is waiting,
// and the last review (or never) is at least `days` ago.
function reviewReminderStatus(reminder, waiting, today) {
  if (!reminder || !reminder.days || !waiting) return { due: false, daysSince: null };
  if (!reminder.lastReviewAt) return { due: true, daysSince: null };
  const daysSince = daysBetween(reminder.lastReviewAt, today);
  return { due: daysSince >= reminder.days, daysSince };
}

function normalizeHomePath(raw) {
  return {
    mode: raw && HOME_PATH_MODES.includes(raw.mode) ? raw.mode : 'core',
    order: raw && HOME_PATH_ORDERS.includes(raw.order) ? raw.order : 'plan',
  };
}

// The order certs are studied in under the 'smart' setting: a blend of how
// close the exam is and how weak the cert still is, as one priority number
// (higher goes first). Urgency decays smoothly with days to the exam — 100 on
// the day, about half at two weeks, a few points by two months — and weakness
// is 100 minus readiness; urgency counts 60% and weakness 40%, so a near exam
// outranks a weak cert with no date while a far-off exam barely moves things.
// A cert with a unit half done gets a small bonus (finish what you started)
// so the order doesn't flip mid-unit as readiness creeps up. A past exam date
// counts as no date: it is not clear whether the exam happened. Ties fall
// back to plan order.
const SMART_URGENCY_DAYS = 21;
const SMART_URGENCY_WEIGHT = 0.6;
const SMART_WEAKNESS_WEIGHT = 0.4;
const SMART_IN_PROGRESS_BONUS = 10;

function smartCertPriority(days, readinessScore, inProgress) {
  const urgency = days !== null && days >= 0 ? 100 * Math.exp(-days / SMART_URGENCY_DAYS) : 0;
  const weakness = 100 - readinessScore;
  return urgency * SMART_URGENCY_WEIGHT + weakness * SMART_WEAKNESS_WEIGHT + (inProgress ? SMART_IN_PROGRESS_BONUS : 0);
}

function smartCertOrder(trackKeys, certPlan, results, seenLog, inProgressKeys) {
  const today = todayString();
  const mid = new Set(inProgressKeys || []);
  return trackKeys
    .map((key, i) => {
      const sched = certPlan.scheduled[key];
      const days = sched ? daysBetween(today, sched) : null;
      return { key, i, priority: smartCertPriority(days, examReadiness(key, results, seenLog).score, mid.has(key)) };
    })
    .sort((a, b) => b.priority - a.priority || a.i - b.i)
    .map((r) => r.key);
}

// Certs with at least one unit that has some, but not all, of its core steps
// done — the ones with something in progress.
function certsMidUnit(unitsByTrack, trackKeys, doneByTrack) {
  return trackKeys.filter((key) => (unitsByTrack[key] || []).some((u) => {
    const p = pathUnitProgress(u, doneByTrack[key] || {});
    return p.done > 0 && !p.complete;
  }));
}

// The optional sections that can follow `unit` of cert `trackKey`. `anchor`
// is the core step kind each one slots in after (falling back to the end of
// the unit), so they are mixed into the unit rather than all piled on the
// end. A bridge is attached to the unit whose lesson it names; it records
// its done state under BRIDGE_DONE_KEY, not the cert, because it belongs to
// several certs and must only ever be offered once.
function buildOptionalSteps(trackKey, unit) {
  const mod = DATA[trackKey];
  const out = [];
  const flashById = new Map(mod.flashcards.map((f) => [f.id, f]));
  const deepCards = [...unit.coreCardIds, ...unit.extraCardIds]
    .map((id) => flashById.get(id))
    .filter((c) => c && c.detail)
    .slice(0, DEEP_DIVE_CARDS);
  const deepPool = unit.extraQuestionIds.length >= DEEP_DIVE_QUESTIONS ? unit.extraQuestionIds : unit.poolIds;
  if (deepCards.length >= 2 && deepPool.length) {
    out.push({
      id: `${unit.id}::deep`, kind: 'deep', optional: true, anchor: 'cards2', label: 'Deep dive',
      meta: `${deepCards.length} terms in depth, then ${Math.min(DEEP_DIVE_QUESTIONS, deepPool.length)} questions`,
      cardIds: deepCards.map((c) => c.id), poolIds: deepPool, count: DEEP_DIVE_QUESTIONS,
    });
  }
  const usedGame = unit.coreGame;
  (unit.games || [])
    .filter((g) => !(usedGame && g.kind === usedGame.kind && g.id === usedGame.id))
    .slice(0, BONUS_GAMES_PER_UNIT)
    .forEach((g, i) => {
      out.push({
        id: `${unit.id}::bonus${i + 1}`, kind: 'game', optional: true, anchor: 'game',
        label: `Bonus: ${PATH_GAME_LABELS[g.kind] || 'Game'}`, meta: 'Extra practice game', game: g,
      });
    });
  BRIDGES
    .filter((b) => b.appearsIn.some((a) => a.track === trackKey && a.lesson === unit.id))
    .forEach((b) => {
      const others = b.appearsIn.filter((a) => a.track !== trackKey).map((a) => (TRACKS.find((t) => t.key === a.track) || { label: a.track }).label);
      out.push({
        id: `bridge::${b.id}`, kind: 'bridge', optional: true, anchor: 'end', doneKey: BRIDGE_DONE_KEY, bridgeId: b.id,
        label: `Bridge: ${b.title}`, meta: others.length ? `Also in ${others.join(', ')}` : 'Cross-cert idea',
      });
    });
  return out;
}

function homePathUnitOrder(unitsByTrack, trackKeys) {
  return trackKeys.flatMap((key) => (unitsByTrack[key] || []).map((unit) => ({ trackKey: key, unit })));
}

// Everything left on the Home path, in order: { trackKey, unit, step,
// doneKey } entries. In 'extended' mode each unit's unfinished optional
// steps are slotted in after the core step they anchor to (units carry them
// as `unit.optional`). `doneByTrack` maps a done-key (a track key, or
// BRIDGE_DONE_KEY) to that map of finished step ids. Order is computed over
// everything and only then filtered to unfinished steps, so it stays put as
// work completes.
function homePathRemaining(unitsByTrack, trackKeys, doneByTrack, mode) {
  const out = [];
  const seenBridges = new Set();
  homePathUnitOrder(unitsByTrack, trackKeys).forEach(({ trackKey, unit }) => {
    const isDone = (step) => pathStepIsDone(doneByTrack[step.doneKey || trackKey] || {}, step.id);
    const entry = (step) => ({ trackKey, unit, step, doneKey: step.doneKey || trackKey });
    const optional = mode === 'extended'
      ? (unit.optional || []).filter((st) => {
        if (st.kind !== 'bridge') return true;
        if (seenBridges.has(st.bridgeId)) return false;
        seenBridges.add(st.bridgeId);
        return true;
      })
      : [];
    const coreKinds = new Set(unit.steps.map((st) => st.kind));
    const anchoredAt = (kind, lastKind) => optional.filter((st) => (coreKinds.has(st.anchor) ? st.anchor : lastKind) === kind);
    const lastKind = unit.steps.length ? unit.steps[unit.steps.length - 1].kind : null;
    unit.steps.forEach((step) => {
      if (!isDone(step)) out.push(entry(step));
      anchoredAt(step.kind, lastKind).filter((st) => !isDone(st)).forEach((st) => out.push(entry(st)));
    });
    if (!unit.steps.length) optional.filter((st) => !isDone(st)).forEach((st) => out.push(entry(st)));
  });
  return out;
}

// Core progress only (optional work never dilutes the path percentage).
function homePathProgress(unitsByTrack, trackKeys, doneByTrack) {
  let total = 0;
  let done = 0;
  trackKeys.forEach((key) => {
    const p = pathOverallProgress(unitsByTrack[key] || [], doneByTrack[key] || {});
    total += p.total;
    done += p.done;
  });
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

// How much of the optional layer is available and how much is finished or
// skipped, counting each bridge once.
function homePathOptionalProgress(unitsByTrack, trackKeys, doneByTrack) {
  let total = 0;
  let done = 0;
  const seen = new Set();
  homePathUnitOrder(unitsByTrack, trackKeys).forEach(({ trackKey, unit }) => {
    (unit.optional || []).forEach((st) => {
      if (st.kind === 'bridge') {
        if (seen.has(st.bridgeId)) return;
        seen.add(st.bridgeId);
      }
      total += 1;
      if (pathStepIsDone(doneByTrack[st.doneKey || trackKey] || {}, st.id)) done += 1;
    });
  });
  return { total, done };
}

/* ---------------- cross-cert reviews ---------------- */

// Review pools drawn across every cert in the plan, so a learner can go back
// over what they've missed or found hard without picking a cert first. Items
// are taken from each cert in turn (hardest / longest-neglected first within
// a cert) so one cert with a long backlog can't crowd out the others.
const CROSS_REVIEW_QUESTIONS = 10;
const CROSS_REVIEW_CARDS = 15;

function roundRobin(lists, limit) {
  const out = [];
  const longest = lists.reduce((m, l) => Math.max(m, l.length), 0);
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of lists) {
      if (list[i] && out.length < limit) out.push(list[i]);
    }
  }
  return out;
}

function missedQuestionsByTrack(trackKeys, results, seenLog) {
  return trackKeys.map((key) => {
    const trackResults = results[key] || {};
    const seen = (seenLog && seenLog[key]) || {};
    return DATA[key].questions
      .filter((q) => trackResults[q.id] === 'incorrect')
      .sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0))
      .map((q) => ({ trackKey: key, item: q }));
  });
}

function toughCardsByTrack(trackKeys, srs) {
  return trackKeys.map((key) => {
    const byId = new Map(DATA[key].flashcards.map((c) => [c.id, c]));
    return toughCardIds((srs && srs[key]) || {}, DATA[key].flashcards).map((id) => ({ trackKey: key, item: byId.get(id) }));
  });
}

// { trackKey, item } entries to run, plus the full backlog size for the
// card's count. `item` is the original question/flashcard.
function crossCertWeakQuestions(trackKeys, results, seenLog, limit) {
  const lists = missedQuestionsByTrack(trackKeys, results, seenLog);
  return { picks: roundRobin(lists, limit || CROSS_REVIEW_QUESTIONS), total: lists.reduce((n, l) => n + l.length, 0) };
}

function crossCertToughCards(trackKeys, srs, limit) {
  const lists = toughCardsByTrack(trackKeys, srs);
  return { picks: roundRobin(lists, limit || CROSS_REVIEW_CARDS), total: lists.reduce((n, l) => n + l.length, 0) };
}

// Mad Libs, Sequence, and Compare items you last got wrong. They record
// results by their own ids, like questions do. `kind` says which runner to use.
function missedGamesByTrack(trackKeys, results) {
  return trackKeys.map((key) => {
    const trackResults = results[key] || {};
    const mod = DATA[key];
    return [
      ...(mod.madlibs || []).map((g) => ({ kind: 'madlib', g })),
      ...(mod.sequences || []).map((g) => ({ kind: 'sequence', g })),
      ...(mod.compare || []).map((g) => ({ kind: 'compare', g })),
    ]
      .filter(({ g }) => trackResults[g.id] === 'incorrect')
      .map(({ kind, g }) => ({ trackKey: key, item: g, kind }));
  });
}

// Case studies where you last missed at least one question. Their questions
// lean on a shared scenario, so a round shows the scenario and only the
// questions you missed from it.
const CROSS_REVIEW_CASES = 1;
function missedCasesByTrack(trackKeys, results) {
  return trackKeys.map((key) => {
    const trackResults = results[key] || {};
    return (DATA[key].caseStudies || [])
      .map((cs) => ({ cs, missed: cs.questions.filter((q) => trackResults[q.id] === 'incorrect') }))
      .filter((c) => c.missed.length)
      .map((c) => ({ trackKey: key, item: c }));
  });
}
function crossCertWeakCases(trackKeys, results, limit) {
  const lists = missedCasesByTrack(trackKeys, results);
  return { picks: roundRobin(lists, limit || CROSS_REVIEW_CASES), total: lists.reduce((n, l) => n + l.length, 0) };
}

const CROSS_REVIEW_GAMES = 3;
function crossCertWeakGames(trackKeys, results, limit) {
  const lists = missedGamesByTrack(trackKeys, results);
  return { picks: roundRobin(lists, limit || CROSS_REVIEW_GAMES), total: lists.reduce((n, l) => n + l.length, 0) };
}

// Items from several certs share ids (every track has an f1 and a q1), so
// review items get a "<track>:<id>" id while they run, and these split it
// back apart to record each answer against its own cert.
function reviewItemId(trackKey, id) { return `${trackKey}:${id}`; }
function splitReviewId(composite) {
  const i = composite.indexOf(':');
  return { trackKey: composite.slice(0, i), id: composite.slice(i + 1) };
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
  { id: 'case-cracked', icon: '🕵️', title: 'Case Cracked', description: 'Finish your first mini case study.', check: (c) => c.caseStudiesCompleted >= 1, target: (c) => [Math.min(c.caseStudiesCompleted, 1), 1] },
  { id: 'case-veteran', icon: '📂', title: 'Case Veteran', description: 'Finish 10 mini case studies.', check: (c) => c.caseStudiesCompleted >= 10, target: (c) => [Math.min(c.caseStudiesCompleted, 10), 10] },
  { id: 'fine-print', icon: '⚖️', title: 'Fine Print', description: 'Pick the more correct answer 10 times.', check: (c) => c.compareCorrect >= 10, target: (c) => [Math.min(c.compareCorrect, 10), 10] },
  { id: 'dress-rehearsal', icon: '🎭', title: 'Dress Rehearsal', description: 'Pass a Final Mock exam under proctored-style rules.', check: (c) => c.finalMocksPassed >= 1, target: (c) => [Math.min(c.finalMocksPassed, 1), 1] },
];

// Aggregates stats across every track (not just the active one) — achievements
// are account-wide, matching the app's single-profile, no-login model.
function buildAchievementContext(results, stats) {
  let totalCorrect = 0;
  let compareCorrect = 0;
  const trackMasteries = [];
  let anyCourseComplete = false;
  Object.keys(DATA).forEach((key) => {
    const mod = DATA[key];
    const trackResults = results[key] || {};
    // Same id set trackMastery (below) folds in — flashcards/questions plus
    // Mad Libs, Sequence, Compare, and case-study questions — so "correct
    // answers, all-time" actually counts every scored item type, not just
    // the two oldest ones. Without this, someone who studies mostly through
    // case studies or Mad Libs would never see Quick Learner/Century Club/
    // etc. move, despite those items counting toward mastery everywhere else.
    const compareIds = (mod.compare || []).map((c) => c.id);
    const items = [
      ...mod.flashcards.map((f) => f.id),
      ...mod.questions.map((q) => q.id),
      ...(mod.madlibs || []).map((m) => m.id),
      ...(mod.sequences || []).map((s) => s.id),
      ...(mod.caseStudies || []).flatMap((cs) => cs.questions.map((q) => q.id)),
      ...compareIds,
    ];
    const correctHere = items.filter((id) => trackResults[id] === 'correct').length;
    totalCorrect += correctHere;
    compareCorrect += compareIds.filter((id) => trackResults[id] === 'correct').length;
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
    caseStudiesCompleted: stats.counts.caseStudiesCompleted,
    compareCorrect,
    finalMocksPassed: stats.counts.finalMocksPassed || 0,
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
  // Mad Libs and step-ordering both feed into mastery the same as
  // flashcards/questions (each scored all-or-nothing — see
  // submitMadlibAnswer/submitSequenceOrder in 06_app.jsx); CLI/PowerShell
  // command practice deliberately does NOT (see ROADMAP.md section 4). Mini
  // case studies fold in per-embedded-question, not per-case-study — each
  // question inside one is scored on its own (same as a regular quiz
  // question), matching how the real exam format they mirror grades each
  // question in a case study individually.
  const ids = [
    ...mod.flashcards.map((f) => f.id),
    ...mod.questions.map((q) => q.id),
    ...(mod.madlibs || []).map((m) => m.id),
    ...(mod.sequences || []).map((s) => s.id),
    ...(mod.caseStudies || []).flatMap((cs) => cs.questions.map((q) => q.id)),
    ...(mod.compare || []).map((c) => c.id),
  ];
  if (!ids.length) return 0;
  const correct = ids.filter((id) => trackResults[id] === 'correct').length;
  return Math.round((correct / ids.length) * 100);
}

// Every flashcard across every visible track, collapsed into one
// alphabetized cross-track glossary — a term explained once (e.g. "RBAC"
// showing up in AZ-104, AZ-140, and SC-300 alike) surfaces as a single
// entry tagged with every track that defines it, rather than requiring
// you to already be in the right track to find it. Merges purely by
// exact front-text match (case/whitespace-insensitive); tracks that
// phrase the same term slightly differently still show up as separate
// entries — that's a content-consistency problem, not one this lookup
// tries to paper over.
function buildGlossaryEntries() {
  const byFront = new Map();
  TRACKS.filter((t) => !t.hidden).forEach((t) => {
    const mod = DATA[t.key];
    if (!mod || !mod.flashcards) return;
    mod.flashcards.forEach((f) => {
      const key = f.front.trim().toLowerCase();
      if (!byFront.has(key)) byFront.set(key, { front: f.front, back: f.back, tracks: [] });
      const entry = byFront.get(key);
      if (!entry.tracks.includes(t.key)) entry.tracks.push(t.key);
    });
  });
  return Array.from(byFront.values()).sort((a, b) => a.front.localeCompare(b.front));
}

// A blended "exam readiness" signal, distinct from the flat lifetime
// mastery % above: mastery decayed by how stale it is, using each
// attempted item's last-seen timestamp (already tracked in seenLog for
// spaced repetition) as a recency proxy. A 90%-mastery track you haven't
// touched in two months reads as less exam-ready than the same 90% you
// built this week — freshness decays from 1.0 (studied today) down to a
// 0.6 floor by 30 days out, so staleness discounts the score without
// crushing it to zero. No new persisted fields — purely derived from
// results + seenLog already recorded elsewhere.
function examReadiness(trackKey, results, seenLog) {
  const mastery = trackMastery(trackKey, results);
  const trackResults = results[trackKey] || {};
  const trackSeen = seenLog[trackKey] || {};
  const attemptedIds = Object.keys(trackResults);
  if (!attemptedIds.length) return { score: 0, mastery: 0, freshness: 1, label: 'Not started' };
  const now = Date.now();
  const ages = attemptedIds
    .map((id) => trackSeen[id])
    .filter((t) => typeof t === 'number')
    .map((t) => Math.max(0, (now - t) / 86400000));
  const avgAgeDays = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  const freshness = Math.max(0.6, 1 - (avgAgeDays / 30) * 0.4);
  const score = Math.round(mastery * freshness);
  let label;
  if (score >= 80) label = 'Exam ready';
  else if (score >= 60) label = 'Getting there';
  else if (score >= 30) label = 'Building';
  else label = 'Just starting';
  return { score, mastery, freshness, label };
}

// Appends (or, same-day, overwrites) today's readiness score for one
// track, capped to the most recent 30 distinct days so this can't grow
// unbounded over months of use. This is the only "over time" history the
// app records — everything else is a lifetime tally — and it exists
// purely to feed readinessProjection below.
function recordReadinessSnapshot(history, trackKey, score) {
  const today = todayString();
  const trackHistory = history[trackKey] || [];
  const last = trackHistory[trackHistory.length - 1];
  const nextTrackHistory = last && last.date === today
    ? [...trackHistory.slice(0, -1), { date: today, score }]
    : [...trackHistory, { date: today, score }].slice(-30);
  return { ...history, [trackKey]: nextTrackHistory };
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

// A deliberately honest, low-confidence "when might I be ready" estimate:
// draws a straight line through the oldest and newest daily readiness
// snapshots recorded for a track and extrapolates how many days, at that
// pace, it'd take to cross `target`. There's no real per-attempt time
// series to fit a proper curve to — just day-level snapshots — so this
// is explicit about when NOT to show a number: fewer than 2 distinct
// days of history, a flat-or-declining trend, or a projection more than
// a year out all fall back to a plain status instead of a specific (and
// probably wrong) date.
function readinessProjection(history, trackKey, target) {
  const trackHistory = (history[trackKey] || []).filter((h) => Number.isFinite(h.score));
  if (trackHistory.length < 2) return { status: 'insufficient' };
  const first = trackHistory[0];
  const last = trackHistory[trackHistory.length - 1];
  if (last.score >= target) return { status: 'ready', score: last.score };
  const days = daysBetween(first.date, last.date);
  if (days <= 0) return { status: 'insufficient' };
  const rate = (last.score - first.score) / days;
  if (rate <= 0) return { status: 'flat', score: last.score };
  const daysNeeded = Math.ceil((target - last.score) / rate);
  if (daysNeeded > 365) return { status: 'flat', score: last.score };
  return { status: 'projected', score: last.score, daysNeeded, projectedDate: addDays(todayString(), daysNeeded) };
}

// Same self-correcting daily-snapshot pattern as recordReadinessSnapshot,
// one level deeper (per track, per category) — records every category's
// current mastery % for a track in one call, since they're always
// computed together (masteryByCategory) and change together. Capped to
// 30 entries per category so years of use can't grow this unbounded.
function recordCategoryMasterySnapshot(history, trackKey, categoryPcts) {
  const today = todayString();
  const trackHistory = { ...(history[trackKey] || {}) };
  Object.keys(categoryPcts).forEach((catKey) => {
    const catHistory = trackHistory[catKey] || [];
    const last = catHistory[catHistory.length - 1];
    const pct = categoryPcts[catKey];
    trackHistory[catKey] = last && last.date === today
      ? [...catHistory.slice(0, -1), { date: today, pct }]
      : [...catHistory, { date: today, pct }].slice(-30);
  });
  return { ...history, [trackKey]: trackHistory };
}

// The delta between a category's oldest and newest recorded snapshot —
// deliberately simple (not a fitted trend line like readinessProjection)
// since this is just "how much has this moved lately," not a forecast.
// Returns null with fewer than 2 distinct days of history, or no
// meaningful (rounds to 0%) change, so callers can skip a trend that
// wouldn't say anything.
function categoryMasteryTrend(history, trackKey, categoryKey) {
  const catHistory = (history[trackKey] && history[trackKey][categoryKey]) || [];
  if (catHistory.length < 2) return null;
  const first = catHistory[0];
  const last = catHistory[catHistory.length - 1];
  const days = daysBetween(first.date, last.date);
  if (days <= 0) return null;
  const delta = Math.round(last.pct - first.pct);
  if (delta === 0) return null;
  return { delta, days };
}

