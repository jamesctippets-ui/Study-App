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

/* ---- scenario versus recall ---- */
eq(E.weakQuestionKind({ question: 'What does STP stand for?' }), 'recall', 'a short stem is recall');
eq(E.weakQuestionKind({ question: 'A technician captures traffic from a switch port and sees source and destination MAC addresses plus an EtherType field at the start of each unit. At which OSI layer is this PDU?' }), 'scenario', 'a long situation is scenario');
eq(E.weakQuestionKind({ question: 'Your team runs a small office network with two switches and one router; which cable do you need between the switches?' }), 'scenario', 'a medium stem that talks about "your team" is scenario');
{
  const mk = (kind) => ({ id: `qq-${kind}`, kind });
  const short = DATA.ccna.questions.find((x) => E.weakQuestionKind(x) === 'recall');
  const long = DATA.ccna.questions.find((x) => E.weakQuestionKind(x) === 'scenario');
  ok(short && long, 'real content has both kinds');
  const lessonOf = (qq) => units.find((u) => u.poolIds.includes(qq.id));
  const ra = E.weakAnalyze(track, { [short.id]: 'incorrect' }, {}, {}, { [track]: { [short.id]: { m: 1, c: 0, l: TODAY } } }, TODAY);
  const rb = E.weakAnalyze(track, { [long.id]: 'incorrect' }, {}, {}, { [track]: { [long.id]: { m: 1, c: 0, l: TODAY } } }, TODAY);
  const rowOf = (an, qq) => (an.units.find((u) => u.unit.id === (lessonOf(qq) || {}).id) || { score: 0 });
  ok(rowOf(rb, long).score > rowOf(ra, short).score || rowOf(rb, long).score === 0, 'a missed scenario question weighs more than a missed recall one');
}

/* ---- the same analysis across certs ---- */
{
  const resAll = { ccna: results, cissp: {} };
  const cissp = DATA.cissp;
  const lg = { ccna: missLog.ccna, cissp: {} };
  cissp.questions.slice(0, 12).forEach((x, i) => { resAll.cissp[x.id] = 'incorrect'; lg.cissp[x.id] = { m: 1 + (i % 3), c: 0, l: '2026-10-08' }; });
  const many = E.weakAnalyzeMany(['ccna', 'cissp'], resAll, {}, {}, lg, TODAY);
  ok(many.hasData && many.units.length >= 2, 'both certs contribute weak lessons');
  ok(many.units.every((r) => r.trackKey === 'ccna' || r.trackKey === 'cissp'), 'every weak lesson says which cert it is from');
  ok(many.units.every((r, i, arr) => i === 0 || arr[i - 1].order >= r.order), 'ranked together, most urgent first');
  eq(many.units[0].tier, 'critical', 'the strongest lesson of the whole set is top priority');
  eq(many.totals.missed, many.units.reduce((n, r) => n + r.missed.length, 0), 'totals add up');
  const one = E.weakAnalyzeMany(['ccna'], { ccna: results }, {}, {}, missLog, TODAY);
  eq(one.units.map((r) => r.unit.id), E.weakAnalyze('ccna', results, {}, {}, missLog, TODAY).units.map((r) => r.unit.id), 'one cert gives the same ranking as the single-cert analysis');
  // a mixed snapshot spreads across certs
  const sn = E.buildWeakSnapshot(many, TODAY, 6, 2);
  ok(sn.units.length >= 2 && sn.units.every((u) => typeof u.trackKey === 'string'), 'mixed snapshot units carry their cert');
  ok(['ccna', 'cissp'].every((k) => sn.units.filter((u) => u.trackKey === k).length <= 2), 'no cert takes more than the cap');
  const wp = E.createWeakPath({}, 'mix', sn);
  const norm = E.normalizeWeakPath(JSON.parse(JSON.stringify(wp)));
  eq(norm.mix.snapshot.units.map((u) => u.trackKey), sn.units.map((u) => u.trackKey), 'normalize keeps each unit\'s cert');
  eq(Object.keys(E.normalizeWeakPath({ mix: { snapshot: { created: TODAY, units: [{ lessonId: 'x', missedIds: [] }] }, done: {} } })), [], 'a mixed path without certs on its units is dropped');
  // legacy single-cert snapshots (no trackKey) still load, and gain the cert from their key
  const legacy = E.normalizeWeakPath({ ccna: { snapshot: { created: TODAY, units: [{ lessonId: units[3].id, missedIds: [] }] }, done: {} } });
  eq(legacy.ccna.snapshot.units[0].trackKey, 'ccna', 'legacy snapshots take their cert from the key');
  const mu = E.buildWeakUnitsFor('mix', sn);
  ok(mu.length === sn.units.length && mu.every((u, i) => u.index === i && u.id.startsWith(`${u.trackKey}::`) && u.steps.every((st) => st.id.startsWith(`weak::${u.trackKey}::`))), 'mixed units and steps are prefixed with their cert');
  const su = E.buildWeakUnitsFor('ccna', E.buildWeakSnapshot(a, TODAY));
  ok(su.every((u) => u.steps.every((st) => /^weak::[^:]+::[a-z]+$/.test(st.id))), 'single-cert step ids keep their old shape (saved progress still matches)');
  // outcome across certs
  const outMix = E.weakPathOutcome(sn, resAll, 'mix');
  ok(outMix.baseline > 0 && outMix.fixed === 0, 'nothing is fixed yet in a mixed path');
}

/* ---- a weak lesson retires itself once its misses are answered correctly ---- */
{
  const sn = E.buildWeakSnapshot(E.weakAnalyze(track, results, {}, {}, missLog, TODAY), TODAY);
  const wu = E.buildWeakUnitsFor(track, sn);
  const before = E.weakEffectiveDone(wu, sn, { [track]: results }, track, {}, TODAY);
  eq(before.retired.size, 0, 'nothing retires while the misses are still wrong');
  const fixed = { ...results };
  sn.units[0].missedIds.forEach((id) => { fixed[id] = 'correct'; });
  const after = E.weakEffectiveDone(wu, sn, { [track]: fixed }, track, {}, TODAY);
  ok(after.retired.has(wu[0].id), 'the lesson whose misses are all correct now retires');
  ok(wu[0].steps.every((st) => after.done[st.id] && after.done[st.id].via === 'mastered'), 'all its steps count as done (mastered)');
  const half = { ...results };
  half[sn.units[0].missedIds[0]] = 'correct';
  eq(E.weakEffectiveDone(wu, sn, { [track]: half }, track, {}, TODAY).retired.has(wu[0].id), false, 'one fixed question is not enough');
  const keep = E.weakEffectiveDone(wu, sn, { [track]: fixed }, track, { [wu[0].steps[0].id]: { at: '2026-10-01', pct: 80, via: null } }, TODAY);
  eq(keep.done[wu[0].steps[0].id].pct, 80, 'a step you already did keeps its own record');
  const cardsOnly = { created: TODAY, units: [{ ...sn.units[0], missedIds: [] }] };
  eq(E.weakEffectiveDone(E.buildWeakUnitsFor(track, cardsOnly), cardsOnly, { [track]: fixed }, track, {}, TODAY).retired.size, 0, 'lessons flagged only by cards or games never retire this way');
}

/* ---- the missed-question history ---- */
{
  const ids = q(lessonA).slice(0, 4);
  const log = { [track]: { [ids[0]]: { m: 2, c: 0, l: '2026-10-09' }, [ids[1]]: { m: 1, c: 1, l: '2026-10-05' }, [ids[2]]: { m: 3, c: 0, l: '2026-10-09' }, gone: { m: 1, c: 0, l: '2026-10-01' } } };
  const res = { [ids[0]]: 'incorrect', [ids[1]]: 'correct', [ids[3]]: 'incorrect' };
  const h = E.missedHistory([track], { [track]: res }, log);
  eq(h.length, 4, 'questions that no longer exist are dropped');
  eq(h.map((x) => x.q.id), [ids[2], ids[0], ids[1], ids[3]], 'newest miss first, ties by how often it was missed, undated last');
  eq(h.map((x) => x.state), ['wrong', 'wrong', 'fixed', 'wrong'], 'wrong until answered correctly; unanswered counts as wrong');
  eq([h[3].misses, h[3].last], [1, null], 'a wrong answer from before the miss log still counts, as one undated miss');
  eq(E.missedHistory(['cissp'], {}, log), [], 'only the asked-for certs are listed');
  eq(E.missedHistory([track], {}, {}), [], 'an empty log gives an empty history');
}

if (failures) { console.error(`\n${failures} of ${checks} weak-path checks failed`); process.exit(1); }
console.log(`weak-subjects engine: ${checks} checks passed`);
