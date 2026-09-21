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

