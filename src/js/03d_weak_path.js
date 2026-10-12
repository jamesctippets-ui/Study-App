/* ---------------- weak subjects: what to review, and in what order ---------------- */

// Pure logic (no React, no DOM; tested in Node by tools/check_weak_path.js).
//
// The app only keeps the LAST outcome of each question in `results`, which says
// "you got it wrong" but not "you keep getting it wrong". `stats.missLog` adds the
// missing history for items that have ever been missed: how many times, how many
// correct answers since, and the date of the last miss. From those two sources
// (plus tough flashcards from spaced repetition) weakAnalyze() decides which
// LESSONS need another pass, ranks them, and says why. A snapshot of that ranking
// becomes the learner's "weak subjects" path: for each weak lesson a re-read,
// targeted flashcards, a quiz built around the misses, and a retest, in priority
// order instead of course order.

const WEAK_MAX_UNITS = 6;
const WEAK_MIN_SCORE = 0.9;          // below this a lesson is not worth a detour
const WEAK_CARDS_PER_UNIT = 8;
const WEAK_FIX_QUESTIONS = 10;
const WEAK_FRESH_QUESTIONS = 3;      // new questions mixed in with the misses
const WEAK_RETEST_QUESTIONS = 6;
const WEAK_PASS_PCT = 70;
// Scenario questions (a situation, then "what should you do") are worth a little more than short recall
// ones: missing them says the idea did not transfer. The weights are small on purpose.
const WEAK_KIND_WEIGHT = { scenario: 1.15, recall: 0.85 };
const WEAK_TIERS = ['critical', 'high', 'watch'];
const WEAK_TIER_LABEL = { critical: 'Top priority', high: 'Needs work', watch: 'Keep an eye on' };

/* ---- the miss log ---- */

// { [trackKey]: { [itemId]: { m: times missed, c: correct answers since, l: 'YYYY-MM-DD' of the last miss } } }
function normalizeMissLog(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach((tk) => {
    const t = raw[tk];
    if (!t || typeof t !== 'object') return;
    const clean = {};
    Object.keys(t).forEach((id) => {
      const e = t[id];
      if (e && Number.isFinite(e.m) && e.m > 0) {
        clean[id] = { m: Math.min(Math.floor(e.m), 99), c: Number.isFinite(e.c) && e.c > 0 ? Math.min(Math.floor(e.c), 99) : 0, l: typeof e.l === 'string' ? e.l : null };
      }
    });
    if (Object.keys(clean).length) out[tk] = clean;
  });
  return out;
}

// Items never missed leave no entry, so the log stays as small as the set of things
// you have actually struggled with.
function recordMissLog(log, trackKey, id, outcome, today) {
  const base = log || {};
  const track = base[trackKey] || {};
  const e = track[id];
  if (outcome === 'incorrect') {
    const next = { m: Math.min(((e && e.m) || 0) + 1, 99), c: (e && e.c) || 0, l: today };
    return { ...base, [trackKey]: { ...track, [id]: next } };
  }
  if (outcome === 'correct' && e) {
    return { ...base, [trackKey]: { ...track, [id]: { ...e, c: Math.min(e.c + 1, 99) } } };
  }
  return base;
}

/* ---- relevance of a flashcard to the questions you missed ---- */

const WEAK_STOP = new Set(['the', 'and', 'for', 'are', 'that', 'this', 'with', 'from', 'not', 'when', 'how', 'what', 'which', 'you', 'your', 'can', 'will', 'its', 'has', 'have', 'into', 'than', 'then', 'they', 'them', 'was', 'were', 'but', 'all', 'any', 'one', 'use', 'used', 'using']);

function weakTokens(text) {
  return (String(text || '').toLowerCase().match(/[a-z0-9][a-z0-9+#.\-]*/g) || []).filter((t) => t.length > 2 && !WEAK_STOP.has(t));
}

function weakQuestionText(q) {
  return [q.question, ...(q.options || []), q.explanation || ''].join(' ');
}

function weakCardRelevance(card, tokenSet, haystack) {
  const front = String(card.front || '').toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  let s = 0;
  if (front.length > 2 && haystack.includes(front)) s += 4;
  const ft = weakTokens(front);
  if (ft.length) s += (3 * ft.filter((t) => tokenSet.has(t)).length) / ft.length;
  const abbr = (String(card.front || '').match(/\(([A-Za-z0-9]{2,8})\)/) || [])[1];
  if (abbr && haystack.includes(abbr.toLowerCase())) s += 2;
  return s;
}

/* ---- scenario or recall ---- */

function weakQuestionKind(q) {
  const stem = String((q && q.question) || '');
  if (stem.length >= 170) return 'scenario';
  if (stem.length >= 110 && /\b(you|your|team|company|organization|administrator|engineer|technician|analyst|developer|users?|customer)\b/i.test(stem)) return 'scenario';
  return 'recall';
}

/* ---- the analysis ---- */

function weakTierFor(priority, max, rate, missed) {
  const rel = priority >= 0.66 * max ? 'critical' : priority >= 0.33 * max ? 'high' : 'watch';
  const abs = priority >= 2.2 ? 'critical' : priority >= 1.2 ? 'high' : 'watch';
  let tier = WEAK_TIERS[Math.max(WEAK_TIERS.indexOf(rel), WEAK_TIERS.indexOf(abs))];
  if (rate >= 0.5 && missed >= 3) tier = 'critical';
  return tier;
}

function weakReason(row) {
  const parts = [];
  if (row.missed.length) {
    parts.push(row.attempted > row.missed.length
      ? `You missed ${row.missed.length} of the ${row.attempted} questions you have answered here`
      : `You missed ${row.missed.length} question${row.missed.length === 1 ? '' : 's'} here`);
  }
  const recent = row.missed.filter((m) => m.days !== null && m.days <= 14).length;
  const repeat = row.missed.filter((m) => m.misses >= 2).length;
  const extras = [];
  if (recent && recent !== row.missed.length) extras.push(`${recent} in the last two weeks`);
  if (repeat) extras.push(`${repeat} more than once`);
  const scen = row.missed.filter((m) => m.kind === 'scenario').length;
  if (row.missed.length >= 3 && scen / row.missed.length >= 0.67) extras.push('mostly scenario questions');
  else if (row.missed.length >= 3 && (row.missed.length - scen) / row.missed.length >= 0.67) extras.push('mostly recall questions');
  if (extras.length && parts.length) parts[0] += ` (${extras.join(', ')})`;
  if (row.tough.length) parts.push(`${row.tough.length} flashcard${row.tough.length === 1 ? '' : 's'} you rated as tough`);
  if (row.games.length) parts.push(`${row.games.length} mini-game${row.games.length === 1 ? '' : 's'} you got wrong`);
  if (row.cases) parts.push(`${row.cases} case-study question${row.cases === 1 ? '' : 's'} missed`);
  let text = parts.join('; ');
  if (!text) text = 'Flagged from earlier misses';
  if (row.marks) text += `. This area is about ${Math.round(row.marks)}% of the exam`;
  return `${text}.`;
}

// Everything the "weak spots" screens need for one cert.
function weakAnalyze(trackKey, results, seenLog, srs, missLog, today) {
  const mod = DATA[trackKey];
  const empty = { trackKey, hasData: false, attempted: 0, units: [], categories: [], totals: { missed: 0, recovered: 0, tough: 0 } };
  if (!mod) return empty;
  const tr = results || {};
  const ml = (missLog && missLog[trackKey]) || {};
  const units = buildPathUnits(trackKey);
  const catByKey = new Map((mod.categories || []).map((c) => [c.key, c]));
  const nCats = (mod.categories || []).length || 1;

  const unitOfId = new Map();
  units.forEach((u) => {
    u.poolIds.forEach((id) => { if (!unitOfId.has(id)) unitOfId.set(id, u.index); });
    u.games.forEach((g) => { if (g.id && !unitOfId.has(g.id)) unitOfId.set(g.id, u.index); });
  });
  const unitOfCard = new Map();
  units.forEach((u) => [...u.coreCardIds, ...u.extraCardIds].forEach((id) => { if (!unitOfCard.has(id)) unitOfCard.set(id, u.index); }));
  const unitByCat = (cat) => { const u = units.find((x) => x.cats.includes(cat)); return u ? u.index : -1; };

  const rows = units.map((u) => ({ unit: u, score: 0, attempted: 0, missed: [], recovered: [], games: [], tough: [], cases: 0 }));
  const cats = {};
  const catRow = (k) => (cats[k] = cats[k] || { key: k, attempted: 0, missed: 0, score: 0 });
  let attempted = 0;
  let recovered = 0;

  mod.questions.forEach((q) => {
    const r = tr[q.id];
    if (!r) return;
    attempted += 1;
    const idx = unitOfId.has(q.id) ? unitOfId.get(q.id) : unitByCat(q.cat);
    const c = catRow(q.cat);
    c.attempted += 1;
    if (idx >= 0) rows[idx].attempted += 1;
    const e = ml[q.id];
    if (r === 'incorrect') {
      const days = e && e.l ? Math.max(0, daysBetween(e.l, today)) : null;
      const recency = days === null ? 0.85 : days <= 7 ? 1 : days <= 14 ? 0.9 : days <= 30 ? 0.8 : 0.65;
      const repeat = e ? Math.max(0, Math.min(e.m, 4) - 1) : 0;
      const kind = weakQuestionKind(q);
      const score = (1 + 0.25 * repeat) * recency * WEAK_KIND_WEIGHT[kind];
      c.missed += 1;
      c.score += score;
      if (idx >= 0) { rows[idx].score += score; rows[idx].missed.push({ q, misses: e ? e.m : 1, lastMiss: e ? e.l : null, days, score, kind }); }
    } else if (r === 'correct' && e && e.m > 0) {
      recovered += 1;
      if (idx >= 0) { rows[idx].score += 0.1 * Math.min(e.m, 3); rows[idx].recovered.push({ q, misses: e.m }); }
    }
  });

  // Flashcards you rated as tough (spaced repetition) or last answered wrongly.
  const toughSet = new Set(toughCardIds((srs && srs[trackKey]) || {}, mod.flashcards));
  let toughTotal = 0;
  mod.flashcards.forEach((card) => {
    if (!(toughSet.has(card.id) || tr[card.id] === 'incorrect')) return;
    toughTotal += 1;
    const idx = unitOfCard.has(card.id) ? unitOfCard.get(card.id) : unitByCat(card.cat);
    if (idx < 0 || rows[idx].tough.length >= 6) return;
    rows[idx].score += 0.35;
    rows[idx].tough.push(card);
    catRow(card.cat).score += 0.2;
  });

  // Mini-games and case studies you got wrong.
  [['madlib', mod.madlibs], ['sequence', mod.sequences], ['compare', mod.compare]].forEach(([kind, list]) => {
    (list || []).forEach((g) => {
      if (tr[g.id] !== 'incorrect') return;
      const idx = unitOfId.has(g.id) ? unitOfId.get(g.id) : unitByCat(g.cat);
      if (idx < 0) return;
      rows[idx].score += 0.6;
      rows[idx].games.push({ kind, id: g.id, cat: g.cat });
      catRow(g.cat).score += 0.4;
    });
  });
  (mod.caseStudies || []).forEach((cs) => {
    const n = cs.questions.filter((q) => tr[q.id] === 'incorrect').length;
    if (!n) return;
    const idx = unitByCat(cs.cat);
    if (idx < 0) return;
    rows[idx].score += 0.6 * n;
    rows[idx].cases += n;
    catRow(cs.cat).score += 0.4 * n;
  });

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const total = rows.length || 1;
  const ranked = rows
    .map((row) => {
      const marksList = row.unit.cats.map((k) => (catByKey.get(k) || {}).marks).filter((m) => Number.isFinite(m));
      const marks = marksList.length ? marksList.reduce((s, m) => s + m, 0) / marksList.length : 0;
      const weight = marks ? clamp(marks / (100 / nCats), 0.7, 1.5) : 1;
      const rate = row.attempted ? Math.min(1, row.missed.length / row.attempted) : 0;
      const priority = row.score * (0.6 + 0.8 * rate) * weight;
      const order = priority * (1 + (0.04 * (total - row.unit.index)) / total); // earlier lessons win ties
      return { ...row, marks, weight, rate, priority, order };
    })
    .filter((row) => row.score >= WEAK_MIN_SCORE)
    .sort((a, b) => b.order - a.order);

  const max = ranked.length ? ranked[0].priority : 0;
  ranked.forEach((row) => {
    row.tier = weakTierFor(row.priority, max, row.rate, row.missed.length);
    row.reason = weakReason(row);
    // Cards to review: the ones that match the missed questions, tough ones first.
    const missedText = row.missed.map((m) => weakQuestionText(m.q)).join(' ').toLowerCase();
    const tokenSet = new Set(weakTokens(missedText));
    const toughIds = new Set(row.tough.map((c) => c.id));
    const byId = new Map(mod.flashcards.map((c) => [c.id, c]));
    const pool = [...row.unit.coreCardIds, ...row.unit.extraCardIds, ...row.tough.map((c) => c.id)]
      .filter((id, i, a) => a.indexOf(id) === i)
      .map((id) => byId.get(id))
      .filter(Boolean);
    const scored = pool
      .map((card) => ({ card, s: weakCardRelevance(card, tokenSet, missedText) + (toughIds.has(card.id) ? 3 : 0) }))
      .sort((a, b) => b.s - a.s);
    let picks = scored.filter((x) => x.s > 0.9).map((x) => x.card);
    if (picks.length < 4) picks = picks.concat(row.unit.coreCardIds.map((id) => byId.get(id)).filter((c) => c && !picks.includes(c)));
    row.cards = picks.slice(0, WEAK_CARDS_PER_UNIT);
    // Readings: the lesson itself, plus official resources of the weakest categories.
    const resources = [];
    row.unit.cats.forEach((k) => ((catByKey.get(k) || {}).resources || []).forEach((r) => { if (resources.length < 3 && !resources.some((x) => x.url === r.url)) resources.push(r); }));
    row.readings = { lesson: row.unit.lesson, minutes: estimateReadMinutes(row.unit.lesson.reading), resources };
  });

  const categories = Object.values(cats)
    .filter((c) => c.score > 0)
    .map((c) => {
      const cat = catByKey.get(c.key) || {};
      return { key: c.key, label: cat.label || c.key, marks: cat.marks || 0, attempted: c.attempted, missed: c.missed, score: c.score, pctMissed: c.attempted ? Math.round((c.missed / c.attempted) * 100) : 0 };
    })
    .sort((a, b) => b.score * (b.marks || 1) - a.score * (a.marks || 1));

  return {
    trackKey, hasData: attempted > 0, attempted, units: ranked, categories,
    totals: { missed: ranked.reduce((n, r) => n + r.missed.length, 0), recovered, tough: toughTotal },
  };
}

// The same analysis across several certs at once: every weak lesson carries its trackKey and the
// list is ranked together (priority is already scaled by each area's share of its own exam), so
// "what should I work on across my certs" has one answer. Tiers are recomputed against the
// strongest lesson of the whole set.
function weakAnalyzeMany(trackKeys, resultsAll, seenLogAll, srs, missLog, today) {
  const parts = trackKeys.map((k) => weakAnalyze(k, (resultsAll && resultsAll[k]) || {}, (seenLogAll && seenLogAll[k]) || {}, srs, missLog, today));
  const units = [];
  const categories = [];
  parts.forEach((a) => {
    a.units.forEach((r) => units.push({ ...r, trackKey: a.trackKey }));
    a.categories.forEach((c) => categories.push({ ...c, trackKey: a.trackKey }));
  });
  units.sort((a, b) => b.order - a.order);
  const max = units.length ? units[0].priority : 0;
  units.forEach((r) => { r.tier = weakTierFor(r.priority, max, r.rate, r.missed.length); });
  categories.sort((a, b) => b.score * (b.marks || 1) - a.score * (a.marks || 1));
  return {
    trackKeys: trackKeys.slice(),
    hasData: parts.some((a) => a.hasData),
    attempted: parts.reduce((n, a) => n + a.attempted, 0),
    units, categories,
    totals: {
      missed: parts.reduce((n, a) => n + a.totals.missed, 0),
      recovered: parts.reduce((n, a) => n + a.totals.recovered, 0),
      tough: parts.reduce((n, a) => n + a.totals.tough, 0),
    },
  };
}

/* ---- the weak subjects path ---- */

// A stable snapshot of the ranking: the learner works through this list even as
// their results change, and rebuilds it when they want a fresh look.
function buildWeakSnapshot(analysis, today, limit, perTrackCap) {
  const taken = {};
  const picks = [];
  analysis.units.forEach((r) => {
    if (picks.length >= (limit || WEAK_MAX_UNITS)) return;
    const tk = r.trackKey || analysis.trackKey;
    if (perTrackCap && (taken[tk] || 0) >= perTrackCap) return;
    taken[tk] = (taken[tk] || 0) + 1;
    picks.push(r);
  });
  return {
    created: today,
    units: picks.map((r) => ({
      trackKey: r.trackKey || analysis.trackKey,
      lessonId: r.unit.id,
      tier: r.tier,
      priority: Math.round(r.priority * 100) / 100,
      why: r.reason,
      missedIds: r.missed.map((m) => m.q.id),
      cardIds: r.cards.map((c) => c.id),
      games: r.games.slice(0, 2).map((g) => ({ kind: g.kind, id: g.id, cat: g.cat })),
      baselineMissed: r.missed.length,
      baselineAttempted: r.attempted,
    })),
  };
}

function normalizeWeakPath(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach((tk) => {
    const e = raw[tk];
    const snap = e && e.snapshot;
    if (!snap || typeof snap !== 'object' || !Array.isArray(snap.units) || !snap.units.length) return;
    const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 60) : []);
    const units = snap.units.slice(0, 12).filter((u) => u && typeof u.lessonId === 'string' && (tk !== 'mix' || typeof u.trackKey === 'string')).map((u) => ({
      trackKey: typeof u.trackKey === 'string' ? u.trackKey : tk,
      lessonId: u.lessonId,
      tier: WEAK_TIERS.includes(u.tier) ? u.tier : 'high',
      priority: Number.isFinite(u.priority) ? u.priority : 0,
      why: typeof u.why === 'string' ? u.why.slice(0, 400) : '',
      missedIds: strs(u.missedIds),
      cardIds: strs(u.cardIds),
      games: (Array.isArray(u.games) ? u.games : []).filter((g) => g && typeof g.id === 'string' && ['madlib', 'sequence', 'compare'].includes(g.kind)).slice(0, 2).map((g) => ({ kind: g.kind, id: g.id, cat: g.cat })),
      baselineMissed: Number.isFinite(u.baselineMissed) ? u.baselineMissed : 0,
      baselineAttempted: Number.isFinite(u.baselineAttempted) ? u.baselineAttempted : 0,
    }));
    if (!units.length) return;
    const done = {};
    const rawDone = e.done && typeof e.done === 'object' ? e.done : {};
    Object.keys(rawDone).forEach((id) => {
      const d = rawDone[id];
      if (d && typeof d === 'object') done[id] = { at: typeof d.at === 'string' ? d.at : null, pct: Number.isFinite(d.pct) ? d.pct : null, via: null };
    });
    out[tk] = { snapshot: { created: typeof snap.created === 'string' ? snap.created : null, units }, done };
  });
  return out;
}

function createWeakPath(weakPath, trackKey, snapshot) {
  return { ...(weakPath || {}), [trackKey]: { snapshot, done: {} } };
}

function markWeakStepDone(weakPath, trackKey, stepId, pct, today) {
  const base = weakPath || {};
  const cur = base[trackKey];
  if (!cur) return base;
  return { ...base, [trackKey]: { ...cur, done: { ...cur.done, [stepId]: { at: today, pct: Number.isFinite(pct) ? pct : null, via: null } } } };
}

function clearWeakPath(weakPath, trackKey) {
  const base = { ...(weakPath || {}) };
  delete base[trackKey];
  return base;
}

// Turns a snapshot into units the Path step runner understands (see buildPathUnits):
// re-read, targeted flashcards, a quiz built around the misses, an optional game,
// and a retest. Ids are prefixed so they can never collide with the course path's.
function buildWeakUnits(trackKey, snapshot) {
  const mod = DATA[trackKey];
  if (!mod || !snapshot) return [];
  const base = new Map(buildPathUnits(trackKey).map((u) => [u.id, u]));
  const qIds = new Set(mod.questions.map((q) => q.id));
  const cardIds = new Set(mod.flashcards.map((c) => c.id));
  const out = [];
  snapshot.units.forEach((su) => {
    const b = base.get(su.lessonId);
    if (!b) return;
    const lesson = b.lesson;
    const missed = su.missedIds.filter((id) => qIds.has(id));
    const cards = su.cardIds.filter((id) => cardIds.has(id));
    const fixPool = [...missed, ...b.poolIds.filter((id) => !missed.includes(id))];
    const steps = [];
    const add = (kind, spec) => steps.push({ id: `weak::${lesson.id}::${kind}`, kind, ...spec });
    if (lesson.reading) add('read', { label: 'Re-read the lesson', meta: `${estimateReadMinutes(lesson.reading)} min read` });
    if (cards.length) add('cards', { label: 'Targeted flashcards', meta: `${cards.length} cards`, cardIds: cards });
    if (missed.length) {
      const count = Math.min(WEAK_FIX_QUESTIONS, missed.length + WEAK_FRESH_QUESTIONS);
      add('weakquiz', { label: 'Fix your misses', meta: `${count} questions`, missedIds: missed, poolIds: fixPool, count });
    }
    const game = (su.games || [])[0];
    if (game) add('game', { label: PATH_GAME_LABELS[game.kind] || 'Mini-game', meta: 'Mini-game', game });
    if (b.poolIds.length) add('retest', { label: 'Retest', meta: `${Math.min(WEAK_RETEST_QUESTIONS, b.poolIds.length)} questions · ${WEAK_PASS_PCT}% to pass`, poolIds: b.poolIds, count: WEAK_RETEST_QUESTIONS });
    if (!steps.length) return;
    out.push({
      id: lesson.id, index: out.length, weak: true, tier: su.tier, priority: su.priority, why: su.why,
      lesson, title: lesson.title, summary: lesson.summary, cats: b.cats, poolIds: b.poolIds, steps,
      baselineMissed: su.baselineMissed, baselineAttempted: su.baselineAttempted,
      coreCardIds: b.coreCardIds, extraCardIds: [], extraQuestionIds: [], games: [], coreGame: null,
    });
  });
  return out;
}

// Like buildWeakUnits, for a path that may span several certs (scope 'mix'). Each unit
// remembers its trackKey and lessonId; in a mixed path the unit and step ids are prefixed with
// the cert so two certs' lessons can never collide.
function buildWeakUnitsFor(scopeKey, snapshot) {
  if (!snapshot) return [];
  const multi = scopeKey === 'mix';
  const out = [];
  snapshot.units.forEach((su) => {
    const tk = su.trackKey || scopeKey;
    const built = buildWeakUnits(tk, { units: [su] })[0];
    if (!built) return;
    out.push({
      ...built,
      id: multi ? `${tk}::${built.id}` : built.id,
      lessonId: built.id,
      trackKey: tk,
      index: out.length,
      steps: built.steps.map((st) => ({ ...st, id: multi ? st.id.replace('weak::', `weak::${tk}::`) : st.id, trackKey: tk })),
    });
  });
  return out;
}

// A weak lesson retires itself once every question that put it on the list is answered correctly
// again (answered anywhere: Practice, the course path, an exam), so the path never makes you redo a
// lesson you have already fixed. Lessons flagged only by flashcards or games never retire this way.
// Returns the effective progress map: your own `done` plus every step of a retired lesson.
function weakEffectiveDone(units, snapshot, resultsAll, scopeKey, done, today) {
  const retired = new Set();
  const merged = { ...(done || {}) };
  if (!snapshot) return { done: merged, retired };
  const byLesson = new Map(snapshot.units.map((su) => [`${su.trackKey || scopeKey}::${su.lessonId}`, su]));
  units.forEach((u) => {
    const su = byLesson.get(`${u.trackKey}::${u.lessonId}`);
    if (!su || !su.missedIds.length) return;
    const tr = (resultsAll && resultsAll[u.trackKey]) || {};
    if (!su.missedIds.every((id) => tr[id] === 'correct')) return;
    retired.add(u.id);
    u.steps.forEach((st) => { if (!merged[st.id]) merged[st.id] = { at: today || null, pct: null, via: 'mastered' }; });
  });
  return { done: merged, retired };
}

// How much of what the path set out to fix is actually fixed now.
function weakPathOutcome(snapshot, results, scopeKey) {
  // `results` is one cert's results, or (for a mixed path) the results of every cert keyed by trackKey.
  const trOf = (su) => (scopeKey === 'mix' ? ((results && results[su.trackKey]) || {}) : (results || {}));
  const units = snapshot.units.map((su) => {
    const tr = trOf(su);
    const now = su.missedIds.filter((id) => tr[id] !== 'correct').length;
    return { lessonId: su.lessonId, baseline: su.missedIds.length, now, fixed: Math.max(0, su.missedIds.length - now) };
  });
  return {
    units,
    baseline: units.reduce((n, u) => n + u.baseline, 0),
    now: units.reduce((n, u) => n + u.now, 0),
    fixed: units.reduce((n, u) => n + u.fixed, 0),
  };
}

// Every question you have missed in these certs, newest miss first. `state` is 'wrong' while your
// latest answer is still wrong (or the question has not been answered since) and 'fixed' once it
// is correct again. A question whose latest answer is wrong but that predates the miss log still
// counts (as one miss, with no date). Entries whose question no longer exists are dropped.
function missedHistory(trackKeys, resultsAll, missLog) {
  const out = [];
  trackKeys.forEach((tk) => {
    const mod = DATA[tk];
    const log = (missLog && missLog[tk]) || {};
    if (!mod) return;
    const byId = new Map(mod.questions.map((q) => [q.id, q]));
    const tr = (resultsAll && resultsAll[tk]) || {};
    const ids = new Set(Object.keys(log));
    Object.keys(tr).forEach((id) => { if (tr[id] === 'incorrect') ids.add(id); });
    ids.forEach((id) => {
      const q = byId.get(id);
      const e = log[id];
      if (!q) return;
      out.push({ trackKey: tk, q, misses: e && e.m ? e.m : 1, correct: e ? e.c || 0 : 0, last: e ? e.l || null : null, state: tr[id] === 'correct' ? 'fixed' : 'wrong' });
    });
  });
  out.sort((a, b) => (b.last || '').localeCompare(a.last || '') || b.misses - a.misses || (a.q.id < b.q.id ? -1 : 1));
  return out;
}

// For the Home card: the top weak lessons of each cert in the plan.
function weakSummaryForTracks(trackKeys, results, seenLog, srs, missLog, today) {
  return trackKeys
    .map((key) => {
      const a = weakAnalyze(key, (results && results[key]) || {}, (seenLog && seenLog[key]) || {}, srs, missLog, today);
      return { trackKey: key, units: a.units, totals: a.totals, hasData: a.hasData };
    })
    .filter((s) => s.units.length);
}
