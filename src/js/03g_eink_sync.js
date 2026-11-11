/* ---------------- e-reader progress log (pure logic) ----------------
 *
 * An e-ink reader running a study mode cannot run this app, so it studies from a "study pack" on its SD card
 * (tools/eink_pack.py) and appends what you did to /study/progress.jsonl. Data & Progress imports that file here and
 * MERGES it into this browser's progress; nothing is replaced. The format is specified in EINK_STUDY_PACK.md and
 * checked by tools/check_eink.js.
 *
 * One JSON object per line:
 *   {"log":"cert-study-eink","v":1,"id":"k3f9a2"}        header, written once when the device creates the file
 *   {"k":"c","tr":"ccna","id":"f12","q":4,"t":1762825000}  a flashcard rating, q on the app's 1-5 scale
 *   {"k":"q","tr":"ccna","id":"q3","ok":1,"t":1762825060}  a question answered right (1) or wrong (0)
 * `t` is Unix seconds and optional: a device with no clock leaves it out and the import time is used.
 */

const EINK_LOG_MAX_BYTES = 4 * 1024 * 1024;
const EINK_LOG_NAME = 'cert-study-eink';

function einkHash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Returns { id, events, bad } or null when the text is not one of these logs at all. `events` keeps one slot per
// non-blank, non-header line (null for a line that could not be read) so a position in the log stays stable
// from one import to the next.
function parseEinkLog(text) {
  if (typeof text !== 'string') return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let id = null; let bad = 0; let sawHeader = false; let firstEventLine = null;
  const events = [];
  lines.forEach((line) => {
    let o = null;
    try { o = JSON.parse(line); } catch (e) { o = null; }
    if (o && typeof o === 'object' && o.log === EINK_LOG_NAME) {
      if (!sawHeader && typeof o.id === 'string' && o.id) id = o.id.slice(0, 40);
      sawHeader = true;
      return;
    }
    if (firstEventLine === null) firstEventLine = line;
    const tr = o && typeof o.tr === 'string' ? o.tr : null;
    const cid = o && typeof o.id === 'string' ? o.id : null;
    const t = o && Number.isFinite(o.t) ? o.t : null;
    if (tr && cid && o.k === 'c' && Number.isInteger(o.q) && o.q >= 1 && o.q <= 5) {
      events.push({ k: 'c', tr, id: cid, q: o.q, t });
    } else if (tr && cid && o.k === 'q' && (o.ok === 1 || o.ok === 0 || o.ok === true || o.ok === false)) {
      events.push({ k: 'q', tr, id: cid, ok: o.ok === 1 || o.ok === true, t });
    } else {
      events.push(null);
      bad += 1;
    }
  });
  if (!sawHeader && events.length === bad) return null;
  if (!id) id = `h${einkHash(firstEventLine || '')}`;
  return { id, events, bad };
}

function normalizeEinkSyncEntry(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;
  return { id: raw.id, applied: Number.isFinite(raw.applied) && raw.applied > 0 ? Math.floor(raw.applied) : 0, at: Number.isFinite(raw.at) ? raw.at : null };
}

function einkDateString(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// When a card was last rated, worked back from its schedule (a miss is due at once; a pass is due one interval on).
function einkLastRated(entry) {
  if (!entry || !Number.isFinite(entry.due)) return null;
  return entry.reps === 0 ? entry.due : entry.due - (entry.interval || 0) * 86400000;
}

// Merges a parsed log into { results, seenLog, srs, stats } and returns the new state plus a summary. Events already
// applied by an earlier import of the same log are skipped (stats.einkSync remembers how far it got). An event with a
// real clock time that is older than what this browser already holds for that item is left out, so studying in the
// app after studying on the reader is never rolled back.
function applyEinkLog(state, log, now) {
  const nowMs = now || Date.now();
  const MIN_T = 1577836800; // 2020-01-01: anything earlier is a device with no clock set
  const prevSync = normalizeEinkSyncEntry(state.stats && state.stats.einkSync);
  const start = prevSync && prevSync.id === log.id && prevSync.applied <= log.events.length ? prevSync.applied : 0;
  const results = { ...state.results }; const seenLog = { ...state.seenLog }; const srs = { ...state.srs };
  let missLog = (state.stats && state.stats.missLog) || {};
  const cardIds = {}; const questionIds = {};
  const idsFor = (cache, tr, list) => {
    if (!cache[tr]) cache[tr] = new Set(((DATA[tr] && DATA[tr][list]) || []).map((x) => x.id));
    return cache[tr];
  };
  // Copy a track's map the first time it is written, so the caller's state is never mutated.
  const copied = new Set();
  const own = (map, name, tr) => {
    if (!copied.has(`${name}:${tr}`)) { map[tr] = { ...(map[tr] || {}) }; copied.add(`${name}:${tr}`); }
    return map[tr];
  };
  const summary = { cards: 0, questions: 0, unknown: 0, stale: 0, unreadable: 0, already: start, tracks: [] };
  const tracks = new Set();
  for (let i = start; i < log.events.length; i += 1) {
    const e = log.events[i];
    if (!e) { summary.unreadable += 1; continue; }
    if (!DATA[e.tr]) { summary.unknown += 1; continue; }
    const clocked = e.t !== null && e.t >= MIN_T && e.t * 1000 <= nowMs + 86400000;
    const tMs = clocked ? e.t * 1000 : nowMs;
    if (e.k === 'c') {
      if (!idsFor(cardIds, e.tr, 'flashcards').has(e.id)) { summary.unknown += 1; continue; }
      const prev = (srs[e.tr] || {})[e.id];
      const last = einkLastRated(prev);
      if (clocked && last !== null && tMs < last) { summary.stale += 1; continue; }
      const outcome = ratingToOutcome(e.q);
      own(srs, 'srs', e.tr)[e.id] = nextSrsEntry(prev, e.q, tMs);
      own(results, 'results', e.tr)[e.id] = outcome;
      missLog = recordMissLog(missLog, e.tr, e.id, outcome, einkDateString(tMs));
      summary.cards += 1; tracks.add(e.tr);
    } else {
      if (!idsFor(questionIds, e.tr, 'questions').has(e.id)) { summary.unknown += 1; continue; }
      const seenAt = (seenLog[e.tr] || {})[e.id];
      if (clocked && Number.isFinite(seenAt) && tMs < seenAt) { summary.stale += 1; continue; }
      const outcome = e.ok ? 'correct' : 'incorrect';
      own(results, 'results', e.tr)[e.id] = outcome;
      own(seenLog, 'seen', e.tr)[e.id] = tMs;
      missLog = recordMissLog(missLog, e.tr, e.id, outcome, einkDateString(tMs));
      summary.questions += 1; tracks.add(e.tr);
    }
  }
  summary.tracks = [...tracks];
  const stats = { ...state.stats, missLog, einkSync: { id: log.id, applied: log.events.length, at: nowMs } };
  return { results, seenLog, srs, stats, summary };
}

function einkSummaryText(summary) {
  const n = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
  const applied = summary.cards + summary.questions;
  const parts = [];
  if (applied) parts.push(`Added ${n(summary.cards, 'card rating')} and ${n(summary.questions, 'answer')} from the e-reader`);
  else parts.push(summary.already ? 'Nothing new in that log since the last import' : 'No study events found in that log');
  const notes = [];
  if (applied && summary.already) notes.push(`${summary.already} imported before`);
  if (summary.stale) notes.push(`${summary.stale} older than your progress here`);
  if (summary.unknown) notes.push(`${summary.unknown} for items this version does not have`);
  if (summary.unreadable) notes.push(`${n(summary.unreadable, 'unreadable line')}`);
  return `${parts[0]}${notes.length ? ` (${notes.join('; ')})` : ''}.`;
}
