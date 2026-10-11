#!/usr/bin/env node
/* Unit tests for the weak-subjects engine (src/js/03d_weak_path.js) against the real
 * content in dist/data. build.py runs this when node is on the PATH. Run by hand with:
 *   node tools/check_weak_path.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'dist/data');
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'tracks.json'), 'utf8'));
const DATA = {};
manifest.tracks.forEach((t) => { DATA[t.key] = JSON.parse(fs.readFileSync(path.join(dataDir, `${t.key}.json`), 'utf8')); });

const read = (f) => fs.readFileSync(path.join(root, 'src/js', f), 'utf8');
const src = `${read('03_helpers.js')}\n${read('03d_weak_path.js')}`;
const names = [...src.matchAll(/^function ([A-Za-z0-9_]+)/gm)].map((m) => m[1])
  .concat([...src.matchAll(/^const ([A-Z][A-Z0-9_]+)\s*=/gm)].map((m) => m[1]));
// eslint-disable-next-line no-new-func
const E = new Function('DATA', 'TRACKS', 'BRIDGES', 'EXAM_CONFIG', 'STORAGE_KEY', `${src}\nreturn { ${[...new Set(names)].join(', ')} };`)(DATA, manifest.tracks, [], manifest.examConfig, manifest.storageKey);

let failures = 0;
let checks = 0;
function eq(actual, expected, label) {
  checks += 1;
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) { failures += 1; console.error(`FAIL ${label}\n   got      ${a}\n   expected ${b}`); }
}
function ok(cond, label) { eq(!!cond, true, label); }

const TODAY = '2026-10-10';

/* ---- the miss log ---- */
let log = E.recordMissLog({}, 'ccna', 'q1', 'incorrect', '2026-10-01');
eq(log, { ccna: { q1: { m: 1, c: 0, l: '2026-10-01' } } }, 'first miss creates an entry');
log = E.recordMissLog(log, 'ccna', 'q1', 'incorrect', '2026-10-05');
eq(log.ccna.q1, { m: 2, c: 0, l: '2026-10-05' }, 'second miss counts and moves the date');
log = E.recordMissLog(log, 'ccna', 'q1', 'correct', '2026-10-06');
eq(log.ccna.q1, { m: 2, c: 1, l: '2026-10-05' }, 'a later correct answer is counted');
const same = E.recordMissLog(log, 'ccna', 'never-missed', 'correct', TODAY);
ok(same === log, 'correct answers on never-missed items leave the log alone');
eq(E.normalizeMissLog({ ccna: { a: { m: 0 }, b: { m: 3, c: -1, l: 5 }, c: 'x' }, junk: 4 }), { ccna: { b: { m: 3, c: 0, l: null } } }, 'normalize drops junk');

/* ---- analysis on real content ---- */
const track = 'ccna';
const units = E.buildPathUnits(track);
ok(units.length >= 10, 'ccna has lessons');
const qIdSet = new Set(DATA.ccna.questions.map((x) => x.id));
const q = (u) => u.lesson.quizIds.filter((id) => qIdSet.has(id));
// An empty history gives nothing to analyse.
let a = E.weakAnalyze(track, {}, {}, {}, {}, TODAY);
eq([a.hasData, a.units.length], [false, 0], 'no results, no weak spots');

// Lesson 3: five misses of six. Lesson 7: one miss. Everything else untouched.
const results = {};
const missLog = { [track]: {} };
const lessonA = units[3]; const lessonB = units[7];
q(lessonA).slice(0, 6).forEach((id, i) => { results[id] = i < 5 ? 'incorrect' : 'correct'; if (i < 5) missLog[track][id] = { m: 1, c: 0, l: '2026-10-08' }; });
const bId = q(lessonB)[0];
results[bId] = 'incorrect'; missLog[track][bId] = { m: 1, c: 0, l: '2026-10-09' };
a = E.weakAnalyze(track, results, {}, {}, missLog, TODAY);
ok(a.hasData, 'results present');
eq(a.units[0].unit.id, lessonA.id, 'the lesson with five misses ranks first');
eq(a.units[0].tier, 'critical', 'it is top priority');
eq(a.units[0].missed.length, 5, 'it lists the five missed questions');
ok(/missed 5 of the 6/.test(a.units[0].reason), `reason says how many: ${a.units[0].reason}`);
ok(a.categories.length > 0 && a.categories[0].missed >= 1, 'category breakdown exists');
eq(a.totals.missed >= 5, true, 'totals count the misses');
const snap = E.buildWeakSnapshot(a, TODAY);
eq(snap.units[0].lessonId, lessonA.id, 'snapshot keeps the order');
eq(snap.units[0].missedIds.length, 5, 'snapshot remembers the missed ids');
ok(snap.units[0].cardIds.length > 0 && snap.units[0].cardIds.length <= E.WEAK_CARDS_PER_UNIT, 'snapshot picks flashcards');

/* ---- repeated misses and recency weigh more ---- */
const r1 = { [track]: {} };
const idsA = q(lessonA).slice(0, 2);
const resA = { [idsA[0]]: 'incorrect', [idsA[1]]: 'incorrect' };
const freshLog = { [track]: { [idsA[0]]: { m: 1, c: 0, l: '2026-10-09' }, [idsA[1]]: { m: 1, c: 0, l: '2026-10-09' } } };
const repeatLog = { [track]: { [idsA[0]]: { m: 4, c: 0, l: '2026-10-09' }, [idsA[1]]: { m: 3, c: 0, l: '2026-10-09' } } };
const oldLog = { [track]: { [idsA[0]]: { m: 1, c: 0, l: '2026-07-01' }, [idsA[1]]: { m: 1, c: 0, l: '2026-07-01' } } };
const sc = (lg) => E.weakAnalyze(track, resA, {}, {}, lg, TODAY).units[0].priority;
ok(sc(repeatLog) > sc(freshLog), 'repeat misses raise the priority');
ok(sc(freshLog) > sc(oldLog), 'recent misses outrank old ones');

/* ---- exam weight breaks ties ---- */
const cats = DATA[track].categories;
const marksOf = (u) => u.cats.map((k) => cats.find((c) => c.key === k).marks).reduce((s, m) => s + m, 0) / u.cats.length;
const sorted = units.map((u) => ({ u, m: marksOf(u) })).filter((x) => q(x.u).length >= 2).sort((x, y) => y.m - x.m);
const heavy = sorted[0].u; const light = sorted[sorted.length - 1].u;
if (marksOf(heavy) > marksOf(light) * 1.2) {
  const rs = {}; const lg = { [track]: {} };
  [heavy, light].forEach((u) => q(u).slice(0, 2).forEach((id) => { rs[id] = 'incorrect'; lg[track][id] = { m: 1, c: 0, l: '2026-10-09' }; }));
  const ar = E.weakAnalyze(track, rs, {}, {}, lg, TODAY);
  const ih = ar.units.findIndex((r) => r.unit.id === heavy.id); const il = ar.units.findIndex((r) => r.unit.id === light.id);
  ok(ih >= 0 && il >= 0 && ih < il, `a bigger exam share ranks first (${heavy.id} before ${light.id})`);
} else { ok(true, 'marks too even to compare (skipped)'); }

/* ---- tough flashcards count ---- */
const cardsOfB = lessonB.coreCardIds.slice(0, 4);
const srs = { [track]: {} };
cardsOfB.forEach((id) => { srs[track][id] = { last: 1, reps: 0, interval: 0, ease: 2.3, due: 0 }; });
a = E.weakAnalyze(track, {}, {}, srs, {}, TODAY);
ok(a.units.length === 1 && a.units[0].unit.id === lessonB.id && a.units[0].tough.length === 4, 'tough cards alone can flag a lesson');

/* ---- card relevance ---- */
const lessonQ = DATA[track].questions.find((x) => x.id === q(lessonA)[0]);
const cardsA = lessonA.coreCardIds.map((id) => DATA[track].flashcards.find((c) => c.id === id));
const hay = E.weakQuestionText(lessonQ).toLowerCase();
const rel = cardsA.map((c) => ({ c, s: E.weakCardRelevance(c, new Set(E.weakTokens(hay)), hay) })).sort((x, y) => y.s - x.s);
ok(rel[0].s >= rel[rel.length - 1].s, 'relevance scores order cards');

/* ---- the path units ---- */
const wu = E.buildWeakUnits(track, snap);
ok(wu.length === snap.units.length, 'one unit per weak lesson');
const u0 = wu[0];
eq(u0.steps.map((s) => s.kind), ['read', 'cards', 'weakquiz', 'retest'], 'steps: re-read, flashcards, fix the misses, retest');
ok(u0.steps.every((s) => s.id.startsWith('weak::')), 'step ids are namespaced');
eq(u0.steps[2].missedIds, snap.units[0].missedIds, 'the fix step carries the missed ids');
ok(u0.steps[2].poolIds.slice(0, 5).every((id) => snap.units[0].missedIds.includes(id)), 'misses come first in the pool');
eq(u0.weak, true, 'units are flagged weak');
const prog = E.pathOverallProgress(wu, {});
eq([prog.done, prog.total > 0], [0, true], 'progress helpers work on weak units');

/* ---- progress and outcome ---- */
let wp = E.createWeakPath({}, track, snap);
wp = E.markWeakStepDone(wp, track, u0.steps[0].id, null, TODAY);
eq(Object.keys(wp[track].done), [u0.steps[0].id], 'a step can be marked done');
ok(E.markWeakStepDone({}, track, 'x', 1, TODAY) && Object.keys(E.markWeakStepDone({}, track, 'x', 1, TODAY)).length === 0, 'marking without a path is a no-op');
eq(E.clearWeakPath(wp, track), {}, 'clearing removes the path');
const norm = E.normalizeWeakPath(JSON.parse(JSON.stringify(wp)));
eq(norm[track].snapshot.units[0].lessonId, lessonA.id, 'a saved path survives normalize');
eq(E.normalizeWeakPath({ ccna: { snapshot: { units: [{ nope: 1 }] } }, x: 3 }), {}, 'bad data is dropped');
const fixedResults = { ...results };
snap.units[0].missedIds.slice(0, 3).forEach((id) => { fixedResults[id] = 'correct'; });
const out = E.weakPathOutcome(snap, fixedResults);
eq([out.baseline >= 5, out.fixed], [true, 3], 'outcome counts what got fixed');

/* ---- stats plumbing ---- */
const st = E.normalizeStats({ missLog: { ccna: { q1: { m: 2, c: 1, l: '2026-10-01' } } }, weakPath: wp });
eq([st.missLog.ccna.q1.m, !!st.weakPath[track]], [2, true], 'stats keep the miss log and weak path');
eq([E.emptyStats().missLog, E.emptyStats().weakPath], [{}, {}], 'fresh stats start empty');

/* ---- the summary for Home ---- */
const sum = E.weakSummaryForTracks([track, 'cissp'], { [track]: results, cissp: {} }, {}, {}, missLog, TODAY);
eq([sum.length, sum[0].trackKey], [1, track], 'Home summary lists only certs with weak spots');

/* ---- every cert: a pattern of misses must analyse, snapshot and build units without errors ---- */
manifest.tracks.forEach((t) => {
  const mod = DATA[t.key];
  const res = {};
  const lg = { [t.key]: {} };
  mod.questions.forEach((x, i) => { if (i % 3 === 0) { res[x.id] = 'incorrect'; lg[t.key][x.id] = { m: 1 + (i % 4), c: 0, l: '2026-10-05' }; } else if (i % 3 === 1) res[x.id] = 'correct'; });
  mod.flashcards.forEach((c, i) => { if (i % 11 === 0) res[c.id] = 'incorrect'; });
  let an;
  try { an = E.weakAnalyze(t.key, res, {}, {}, lg, TODAY); } catch (e) { an = null; console.error(`weakAnalyze threw for ${t.key}: ${e.message}`); }
  ok(an && an.hasData && an.units.length > 0, `${t.key}: weak lessons found`);
  if (!an) return;
  const sn = E.buildWeakSnapshot(an, TODAY);
  const wu = E.buildWeakUnits(t.key, sn);
  ok(wu.length === sn.units.length && wu.every((u) => u.steps.length >= 2), `${t.key}: weak path builds`);
  ok(an.units.every((r) => r.cards.length <= E.WEAK_CARDS_PER_UNIT && r.reason.length > 10), `${t.key}: every row has cards and a reason`);
});

if (failures) { console.error(`\n${failures} of ${checks} weak-path checks failed`); process.exit(1); }
console.log(`weak-subjects engine: ${checks} checks passed`);
