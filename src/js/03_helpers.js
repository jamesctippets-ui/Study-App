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
    const order = shuffleArray([0, 1, 2, 3]);
    return { ...q, options: order.map((i) => q.options[i]), correct: order.indexOf(q.correct) };
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

function normalizeResults(raw) {
  if (!raw) return { itil: {}, az900: {}, az104: {} };
  if (raw.itil || raw.az900 || raw.az104) return { itil: raw.itil || {}, az900: raw.az900 || {}, az104: raw.az104 || {} };
  // legacy flat shape from before multi-track support existed — treat it as ITIL progress
  return { itil: raw, az900: {}, az104: {} };
}

function normalizeSeenLog(raw) {
  if (!raw) return { itil: {}, az900: {}, az104: {} };
  return { itil: raw.itil || {}, az900: raw.az900 || {}, az104: raw.az104 || {} };
}

