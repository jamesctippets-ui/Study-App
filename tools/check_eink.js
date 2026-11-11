#!/usr/bin/env node
/* Tests for the e-reader progress import (src/js/03g_eink_sync.js) and, when python3 is on the PATH, an end-to-end
 * check of the study pack that tools/eink_pack.py writes. build.py runs this when node is available.
 *   node tools/check_eink.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'dist/data');
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'tracks.json'), 'utf8'));
const DATA = {};
manifest.tracks.forEach((t) => { DATA[t.key] = JSON.parse(fs.readFileSync(path.join(dataDir, `${t.key}.json`), 'utf8')); });
const read = (f) => fs.readFileSync(path.join(root, 'src/js', f), 'utf8');
const src = `${read('03_helpers.js')}\n${read('03d_weak_path.js')}\n${read('03g_eink_sync.js')}`;
const names = [...src.matchAll(/^function ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
// eslint-disable-next-line no-new-func
const E = new Function('DATA', 'TRACKS', 'BRIDGES', 'EXAM_CONFIG', 'STORAGE_KEY', `${src}\nreturn { ${[...new Set(names)].join(', ')} };`)(DATA, manifest.tracks, [], manifest.examConfig, manifest.storageKey);

let failures = 0; let checks = 0;
function eq(actual, expected, label) {
  checks += 1;
  const a = JSON.stringify(actual); const b = JSON.stringify(expected);
  if (a !== b) { failures += 1; console.error(`FAIL ${label}\n   got      ${a}\n   expected ${b}`); }
}
const ok = (c, l) => eq(!!c, true, l);

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 11, 12);
const sec = (ms) => Math.floor(ms / 1000);
const track = manifest.tracks[0].key;
const [card1, card2] = DATA[track].flashcards.map((c) => c.id);
const [q1, q2] = DATA[track].questions.filter((q) => ['mc', 'tf', 'ms'].includes(q.type)).map((q) => q.id);
const fresh = () => E.parseImportedProgress({ results: {}, seenLog: {}, stats: {}, srs: {} });
const L = (...objs) => objs.map((o) => (typeof o === 'string' ? o : JSON.stringify(o))).join('\n');
const header = { log: 'cert-study-eink', v: 1, id: 'dev1' };

/* ---- parsing ---- */
eq(E.parseEinkLog('not a log at all'), null, 'plain text is not a log');
eq(E.parseEinkLog(JSON.stringify({ results: {}, stats: {} })), null, 'a progress export is not a log');
eq(E.parseEinkLog(''), null, 'empty file');
let log = E.parseEinkLog(L(header, { k: 'c', tr: track, id: card1, q: 4, t: 1762825000 }, '{broken', { k: 'q', tr: track, id: q1, ok: 0 }, { k: 'c', tr: track, id: card2, q: 9 }));
eq(log.id, 'dev1', 'header id is read');
eq(log.events.length, 4, 'one slot per event line, readable or not');
eq(log.bad, 2, 'a broken line and an out-of-range rating are unreadable');
eq(log.events[0], { k: 'c', tr: track, id: card1, q: 4, t: 1762825000 }, 'card event');
eq(log.events[2], { k: 'q', tr: track, id: q1, ok: false, t: null }, 'question event without a clock time');
log = E.parseEinkLog(L(header));
eq(log && log.events.length, 0, 'a header alone is an empty log');
const noHeader = E.parseEinkLog(`${L({ k: 'c', tr: track, id: card1, q: 4 })}\r\n\r\n`);
ok(noHeader && /^h[a-z0-9]+$/.test(noHeader.id), 'a log with no header gets an id from its first line');
eq(E.parseEinkLog(L({ k: 'c', tr: track, id: card1, q: 4 })).id, noHeader.id, 'that id is stable');

/* ---- merging ---- */
let state = fresh();
state.results[track] = { keep: 'correct' };
const before = JSON.stringify(state);
log = E.parseEinkLog(L(header,
  { k: 'c', tr: track, id: card1, q: 4, t: sec(NOW - 2 * DAY) },
  { k: 'c', tr: track, id: card2, q: 1, t: sec(NOW - 2 * DAY) },
  { k: 'q', tr: track, id: q1, ok: 1, t: sec(NOW - DAY) },
  { k: 'q', tr: track, id: q2, ok: 0 },
  { k: 'c', tr: 'no-such-track', id: 'f1', q: 4 },
  { k: 'c', tr: track, id: 'no-such-card', q: 4 },
  { k: 'q', tr: track, id: card1, ok: 1 }));
let out = E.applyEinkLog(state, log, NOW);
eq(JSON.stringify(state), before, 'the state passed in is not mutated');
eq([out.summary.cards, out.summary.questions, out.summary.unknown, out.summary.stale, out.summary.already], [2, 2, 3, 0, 0], 'counts');
eq(out.results[track].keep, 'correct', 'existing results are kept (merge, not replace)');
eq([out.results[track][card1], out.results[track][card2], out.results[track][q1], out.results[track][q2]], ['correct', 'incorrect', 'correct', 'incorrect'], 'outcomes');
eq(out.srs[track][card1], E.nextSrsEntry(undefined, 4, NOW - 2 * DAY), 'a Got it is scheduled exactly as the app would, from the time on the reader');
eq(out.srs[track][card2], E.nextSrsEntry(undefined, 1, NOW - 2 * DAY), 'a miss too');
eq(out.seenLog[track][q1], NOW - DAY, 'a question is stamped with when it was answered');
eq(out.seenLog[track][q2], NOW, 'no clock time: the import time is used');
ok(out.stats.missLog[track][card2].m === 1 && out.stats.missLog[track][q2].m === 1, 'misses feed the weak-subjects log');
eq(out.stats.einkSync, { id: 'dev1', applied: 7, at: NOW }, 'how far the log was imported is remembered');
ok(E.normalizeStats(JSON.parse(JSON.stringify(out.stats))).einkSync.applied === 7, 'and survives a save and reload');
ok(E.einkSummaryText(out.summary).startsWith('Added 2 card ratings and 2 answers from the e-reader (3 for items'), `summary text: ${E.einkSummaryText(out.summary)}`);

// importing the same file again changes nothing
let again = E.applyEinkLog(out, log, NOW + 1000);
eq([again.summary.cards, again.summary.questions, again.summary.already], [0, 0, 7], 're-import applies nothing');
eq(again.srs, out.srs, 're-import leaves the schedule alone');
eq(E.einkSummaryText(again.summary), 'Nothing new in that log since the last import.', 're-import message');

// the log grew: only the new lines count
const grown = E.parseEinkLog(L(header, ...log.events.map(() => ({ k: 'c', tr: track, id: card1, q: 1 })), { k: 'c', tr: track, id: card1, q: 4, t: sec(NOW) }));
again = E.applyEinkLog(out, grown, NOW);
eq([again.summary.cards, again.summary.already], [1, 7], 'only lines after the last import are applied');
eq(again.srs[track][card1], E.nextSrsEntry(out.srs[track][card1], 4, NOW), 'the second Got it builds on the first');

// a different log id starts from the top
const other = E.parseEinkLog(L({ ...header, id: 'dev2' }, { k: 'q', tr: track, id: q1, ok: 0, t: sec(NOW) }));
again = E.applyEinkLog(out, other, NOW);
eq([again.summary.questions, again.summary.already, again.results[track][q1]], [1, 0, 'incorrect'], 'a new log is read from its first line');

// studying in the app afterwards is not rolled back by an older reader event
state = fresh();
state.srs[track] = { [card1]: E.nextSrsEntry(undefined, 4, NOW) };
state.results[track] = { [card1]: 'correct', [q1]: 'correct' };
state.seenLog[track] = { [q1]: NOW };
const old = E.parseEinkLog(L(header, { k: 'c', tr: track, id: card1, q: 1, t: sec(NOW - DAY) }, { k: 'q', tr: track, id: q1, ok: 0, t: sec(NOW - DAY) }));
out = E.applyEinkLog(state, old, NOW + DAY);
eq([out.summary.stale, out.summary.cards, out.summary.questions], [2, 0, 0], 'older reader events are left out');
eq([out.results[track][card1], out.results[track][q1]], ['correct', 'correct'], 'and results are untouched');
// ...but a device with no clock cannot be judged stale, and a clock set to 1970 or far in the future is ignored
const clockless = E.parseEinkLog(L(header, { k: 'c', tr: track, id: card1, q: 1 }, { k: 'q', tr: track, id: q1, ok: 0, t: 12 }, { k: 'q', tr: track, id: q2, ok: 1, t: sec(NOW + 400 * DAY) }));
out = E.applyEinkLog(state, clockless, NOW + DAY);
eq([out.summary.cards, out.summary.questions, out.results[track][card1], out.seenLog[track][q1], out.seenLog[track][q2]], [1, 2, 'incorrect', NOW + DAY, NOW + DAY], 'events with no usable clock apply at import time');

/* ---- the study pack, end to end ---- */
const py = spawnSync('python3', ['--version']);
if (py.status === 0) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eink-pack-'));
  try {
    const progress = path.join(tmp, 'progress.json');
    const exported = fresh();
    exported.srs[track] = { [card1]: E.nextSrsEntry(undefined, 4, NOW), gone: E.nextSrsEntry(undefined, 4, NOW) };
    exported.stats.einkSync = { id: 'dev1', applied: 7, at: NOW };
    fs.writeFileSync(progress, JSON.stringify(exported));
    const run = spawnSync('python3', [path.join(root, 'tools/eink_pack.py'), '--out', tmp, '--sample-log', '200', '--progress', progress], { encoding: 'utf8' });
    eq(run.status, 0, `eink_pack.py ran${run.status ? `: ${run.stderr}` : ''}`);
    const study = path.join(tmp, 'study');
    const man = JSON.parse(fs.readFileSync(path.join(study, 'manifest.json'), 'utf8'));
    eq([man.pack, man.v, man.tracks.length], ['cert-study-eink', 1, manifest.tracks.length], 'manifest lists every track');
    const lines = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    man.tracks.forEach((t) => {
      const d = DATA[t.key];
      const cards = lines(path.join(study, t.key, 'cards.jsonl'));
      const qs = lines(path.join(study, t.key, 'questions.jsonl'));
      eq([cards.length, qs.length], [t.cards, t.questions], `${t.key}: manifest counts match the files`);
      eq(cards.length, d.flashcards.length, `${t.key}: every card is packed`);
      eq(qs.length, d.questions.filter((q) => !q.image && ['mc', 'tf', 'ms'].includes(q.type)).length, `${t.key}: every question without an image is packed`);
      const byId = new Map(d.flashcards.map((c) => [c.id, c]));
      ok(cards.every((c) => byId.has(c.id) && c.term === byId.get(c.id).front && c.def === byId.get(c.id).back && c.c >= 0 && c.c < t.categories.length), `${t.key}: card fields`);
      ok(cards.every((c) => (c.prompt === undefined ? !E.flashcardPrompt(byId.get(c.id)).masked : c.prompt === E.flashcardPrompt(byId.get(c.id)).text)), `${t.key}: prompts are the app's own blanked prompts`);
      const qById = new Map(d.questions.map((q) => [q.id, q]));
      ok(qs.every((q) => {
        const o = qById.get(q.id);
        if (!o || q.q !== o.question || !q.why || q.c < 0) return false;
        if (o.type === 'tf') return q.opts.length === 2 && q.ans[0] === (o.answer ? 0 : 1);
        return JSON.stringify(q.ans) === JSON.stringify([].concat(o.correct)) && q.ans.every((i) => i >= 0 && i < q.opts.length);
      }), `${t.key}: question fields and answers`);
    });
    const st = JSON.parse(fs.readFileSync(path.join(study, 'state.json'), 'utf8'));
    eq(st.synced, { id: 'dev1', applied: 7 }, 'state.json says how much of the reader log the export already holds');
    eq(Object.keys(st.srs[track]), [card1], 'state.json carries the schedule for cards that still exist');
    eq(st.srs[track][card1].due, sec(E.nextSrsEntry(undefined, 4, NOW).due), 'due time is in seconds');
    const sample = E.parseEinkLog(fs.readFileSync(path.join(study, 'progress.sample.jsonl'), 'utf8'));
    const applied = E.applyEinkLog(fresh(), sample, NOW);
    eq([sample.events.length, sample.bad, applied.summary.cards + applied.summary.questions, applied.summary.unknown], [200, 0, 200, 0], 'the sample log imports cleanly');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} else {
  console.log('  (python3 not found: skipped the study pack end-to-end check)');
}

if (failures) { console.error(`${failures} of ${checks} e-reader checks failed`); process.exit(1); }
console.log(`e-reader progress import and study pack: ${checks} checks passed`);
