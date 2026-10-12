/* ---------------- share code and step bank (pure; tested in Node by tools/check_share.js) ---------------- */

// A share code carries the learner's own terms, acronyms and step-ordering scenarios from one
// device to another without a full progress export: copy a short text, paste it on the other
// device. The code is just base64url of a small JSON document behind a "CSH1." prefix; nothing
// leaves the device unless the learner copies it. Importing validates every item with the same
// rules as typing it in, and skips duplicates and anything over the limits.

const SHARE_PREFIX = 'CSH1.';

function shareToB64(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function shareFromB64(text) {
  let b = text.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return decodeURIComponent(escape(atob(b)));
}

function encodeShareCode(terms, scenarios) {
  const t = (terms || []).map((x) => [x.kind === 'acronym' ? 'a' : 't', x.front, x.back, x.track && x.track !== 'all' ? x.track : '']);
  const s = (scenarios || []).map((x) => [x.track, x.title, x.steps, x.note || '']);
  return SHARE_PREFIX + shareToB64(JSON.stringify({ v: 1, t, s }));
}

// -> { terms: [{kind, front, back, track}], scenarios: [{track, title, steps, note}], error }
// Items that fail the normal rules are dropped and counted in `invalid`.
function decodeShareCode(code) {
  const none = { terms: [], scenarios: [], invalid: 0 };
  const text = String(code == null ? '' : code).replace(/\s+/g, '');
  if (!text.startsWith(SHARE_PREFIX)) return { ...none, error: `That does not look like a share code. A share code starts with ${SHARE_PREFIX}` };
  let doc;
  try { doc = JSON.parse(shareFromB64(text.slice(SHARE_PREFIX.length))); } catch (e) { return { ...none, error: 'That code could not be read. Make sure you copied all of it.' }; }
  if (!doc || typeof doc !== 'object' || doc.v !== 1 || !Array.isArray(doc.t) || !Array.isArray(doc.s)) return { ...none, error: 'That code is not one this version understands.' };
  let invalid = 0;
  const terms = [];
  doc.t.forEach((x) => {
    if (!Array.isArray(x)) { invalid += 1; return; }
    const kind = x[0] === 'a' ? 'acronym' : x[0] === 't' ? 'term' : null;
    const front = typeof x[1] === 'string' ? x[1].trim() : '';
    const back = typeof x[2] === 'string' ? x[2].trim() : '';
    const track = typeof x[3] === 'string' && x[3] && DATA[x[3]] ? x[3] : 'all';
    if (!kind || validateCustomTerm(kind, front, back, [], null, track)) { invalid += 1; return; }
    terms.push({ kind, front, back, track });
  });
  const scenarios = [];
  doc.s.forEach((x) => {
    if (!Array.isArray(x)) { invalid += 1; return; }
    const track = typeof x[0] === 'string' && DATA[x[0]] ? x[0] : null;
    const title = typeof x[1] === 'string' ? x[1].trim() : '';
    const steps = Array.isArray(x[2]) ? x[2].filter((st) => typeof st === 'string').map((st) => st.trim()).filter(Boolean) : [];
    const note = typeof x[3] === 'string' ? x[3].trim() : '';
    if (!track || validateScenario(title, steps, note, [], null, track)) { invalid += 1; return; }
    scenarios.push({ track, title, steps, note });
  });
  return { terms, scenarios, invalid, error: null };
}

// Adds the decoded items to what the learner already has. Duplicates and anything past the limits
// are skipped. `makeId(prefix)` gives each new item an id. -> { terms, scenarios, added, skipped }
function mergeSharedItems(existingTerms, existingScenarios, decoded, makeId, today) {
  const terms = (existingTerms || []).slice();
  const scenarios = (existingScenarios || []).slice();
  const added = { terms: 0, scenarios: 0 };
  const skipped = { terms: 0, scenarios: 0 };
  decoded.terms.forEach((t) => {
    if (validateCustomTerm(t.kind, t.front, t.back, terms, null, t.track)) { skipped.terms += 1; return; }
    terms.push({ id: makeId('ct'), kind: t.kind, front: t.front, back: t.back, track: t.track, at: today || null });
    added.terms += 1;
  });
  decoded.scenarios.forEach((s) => {
    if (validateScenario(s.title, s.steps, s.note, scenarios, null, s.track)) { skipped.scenarios += 1; return; }
    scenarios.push({ id: makeId('sc'), track: s.track, title: s.title, steps: s.steps, note: s.note, at: today || null });
    added.scenarios += 1;
  });
  return { terms, scenarios, added, skipped };
}

/* ---- the step bank ---- */

// The steps offered while building a scenario, from the learner's own saved scenarios as well as the
// cert's built-in challenges. `lists` = [{ steps: [text], mine: boolean, track }]. The learner's own
// steps for this cert come first, then their steps from other certs, then the built-in ones; the
// same wording appears once.
function buildStepBank(lists, trackKey) {
  const rank = (l) => (l.mine && l.track === trackKey ? 0 : l.mine ? 1 : 2);
  const seen = new Set();
  const out = [];
  (lists || []).slice().sort((a, b) => rank(a) - rank(b)).forEach((l) => {
    (l.steps || []).forEach((text) => {
      const key = String(text).trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({ text: String(text).trim(), mine: !!l.mine });
    });
  });
  return out;
}

// After the step you just wrote, what usually comes next? Looks the last filled-in step up in every
// known ordered list (the learner's own scenarios count double) and suggests the steps that
// followed it, skipping any already used. -> [{ text, mine }], best first.
function suggestNextSteps(current, lists, max) {
  const norm = (x) => String(x).trim().toLowerCase().replace(/\s+/g, ' ');
  const filled = (current || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!filled.length) return [];
  const last = norm(filled[filled.length - 1]);
  const used = new Set(filled.map(norm));
  const score = new Map();
  (lists || []).forEach((l) => {
    const steps = l.steps || [];
    for (let i = 0; i < steps.length - 1; i += 1) {
      if (norm(steps[i]) !== last) continue;
      const next = String(steps[i + 1]).trim();
      const key = norm(next);
      if (!key || used.has(key)) continue;
      const e = score.get(key) || { text: next, score: 0, mine: false };
      e.score += l.mine ? 2 : 1;
      e.mine = e.mine || !!l.mine;
      score.set(key, e);
    }
  });
  return [...score.values()].sort((a, b) => b.score - a.score || (a.text < b.text ? -1 : 1)).slice(0, max || 3).map((e) => ({ text: e.text, mine: e.mine }));
}
