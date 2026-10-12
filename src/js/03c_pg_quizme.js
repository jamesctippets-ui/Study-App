/* ---------------- IT Playground: "Quiz me on this setup" ---------------- */

// Pure (no React, no DOM; tested in Node by tools/checks/quizme.js). Builds a short multiple-choice
// quiz from the network the learner has on screen. Every answer comes from the same engine calls the
// labs themselves use (pgPing, pgVlanPing, pgFwTest, pgSubnetInfo ...), so a question can never
// disagree with what the lab would show.
//
// A question is { id, kind, prompt, options: [text], correct: index, explain }.
// kind 'ipconfig' | 'vlan' | 'firewall' | 'acl'. `opts` = { count (default 5), seed, causes } where `causes`
// is the lab's own diagnosis-code -> plain-language-cause map (PG_IP_CAUSES and friends).

const PG_QUIZ_COUNT = 5;

// A small seeded random generator (mulberry32) so a round is repeatable in tests.
function pgQuizRng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pgQuizShuffle(list, rnd) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The correct answer plus up to three different wrong ones, in a random order.
function pgQuizChoices(correct, wrongs, rnd) {
  const seen = new Set([String(correct)]);
  const picked = [];
  pgQuizShuffle(wrongs, rnd).forEach((w) => {
    const s = String(w);
    if (!seen.has(s) && picked.length < 3) { seen.add(s); picked.push(s); }
  });
  const options = pgQuizShuffle([String(correct)].concat(picked), rnd);
  return { options, correct: options.indexOf(String(correct)) };
}

// Every ordered pair [a, b] from two lists, a !== b.
function pgQuizPairs(from, to) {
  const out = [];
  from.forEach((a) => to.forEach((b) => { if (a.id !== b.id) out.push([a, b]); }));
  return out;
}

/* ---- IP configuration lab ---- */

const PG_QUIZ_PING_OPTIONS = [
  'Yes, it works in both directions',
  'No: the request never reaches it',
  'No: the request arrives but the reply cannot get back',
  'Only some of the time (two devices share an address)',
];

function pgQuizPingChoice(verdict, code) {
  if (verdict === 'success') return 0;
  if (verdict === 'unreliable') return 3;
  return code === 'reply-lost' ? 2 : 1;
}

function pgQuizBuildIp(topo, rnd, count) {
  const hosts = topo.hosts || [];
  const devs = hosts.concat(topo.routers || []);
  const out = [];
  // Ping questions: up to two, from different pairs.
  pgQuizShuffle(pgQuizPairs(hosts, devs), rnd).slice(0, 2).forEach(([a, b]) => {
    const r = pgPing(topo, a.id, b.id);
    out.push({
      id: `ip-ping-${a.id}-${b.id}`, kind: 'ipconfig',
      prompt: `Will a ping from ${a.name} reach ${b.name}?`,
      options: PG_QUIZ_PING_OPTIONS.slice(), correct: pgQuizPingChoice(r.verdict, r.diagnosis && r.diagnosis.code),
      explain: `${r.summary}${r.diagnosis ? ` ${r.diagnosis.text}` : ''}`,
    });
  });
  // Subnet questions: one host each, only for valid addresses.
  const usable = pgQuizShuffle(hosts.filter((h) => { const v = pgDeviceView(h, false)[0]; return v.ipN !== null && v.prefix !== null && v.prefix <= 30; }), rnd);
  const makers = [
    (h, info) => ({ tag: 'net', prompt: `${h.name} has ${h.ip} with mask ${h.mask}. What is the network address of its subnet?`, right: info.networkText, wrong: [info.broadcastText, info.firstText, info.lastText], explain: `Writing the address and the mask in binary and keeping only the network bits gives ${info.networkText}. ${info.broadcastText} is the broadcast address (all host bits 1).` }),
    (h, info) => ({ tag: 'bc', prompt: `${h.name} has ${h.ip} with mask ${h.mask}. What is the broadcast address of its subnet?`, right: info.broadcastText, wrong: [info.networkText, info.firstText, info.lastText], explain: `The broadcast address sets every host bit to 1: ${info.broadcastText}. ${info.networkText} is the network address (all host bits 0).` }),
    (h, info) => ({ tag: 'hosts', prompt: `How many usable host addresses does ${h.name}'s subnet (${info.networkText}/${info.prefix}) have?`, right: String(info.usable), wrong: [String(info.usable + 2), String(Math.max(1, info.usable - 1)), String(info.usable * 2 + 2), String(info.usable + 1)], explain: `${info.total} addresses in the block, minus the network and broadcast addresses, leaves ${info.usable} usable hosts.` }),
    (h, info) => ({ tag: 'first', prompt: `What is the first usable host address in ${h.name}'s subnet (${info.networkText}/${info.prefix})?`, right: info.firstText, wrong: [info.networkText, info.lastText, info.broadcastText], explain: `The first usable host is one above the network address: ${info.firstText}.` }),
  ];
  usable.forEach((h, i) => {
    if (out.length >= count) return;
    const v = pgDeviceView(h, false)[0];
    const info = pgSubnetInfo(v.ipN, v.prefix);
    const q = makers[(i + Math.floor(rnd() * makers.length)) % makers.length](h, { ...info, prefix: v.prefix });
    const c = pgQuizChoices(q.right, q.wrong, rnd);
    out.push({ id: `ip-${q.tag}-${h.id}`, kind: 'ipconfig', prompt: q.prompt, options: c.options, correct: c.correct, explain: q.explain });
  });
  return out;
}

/* ---- VLAN playground ---- */

const PG_QUIZ_VLAN_PING_OPTIONS = [
  'Yes, it works in both directions',
  'No: the request never reaches it',
  'No: the request arrives but the reply cannot get back',
];

function pgQuizBuildVlan(topo, rnd, count, causes) {
  const hosts = topo.hosts || [];
  const out = [];
  const state = pgVlanNewState();
  pgQuizShuffle(pgQuizPairs(hosts, hosts), rnd).slice(0, 2).forEach(([a, b]) => {
    const r = pgVlanPing(topo, state, a.id, b.id);
    const code = r.diagnosis && r.diagnosis.code;
    out.push({
      id: `vlan-ping-${a.id}-${b.id}`, kind: 'vlan',
      prompt: `Will a ping from ${a.name} reach ${b.name}?`,
      options: PG_QUIZ_VLAN_PING_OPTIONS.slice(), correct: r.verdict === 'success' ? 0 : code === 'reply-lost' ? 2 : 1,
      explain: `${r.summary}${r.diagnosis ? ` ${r.diagnosis.text}` : ''}`,
    });
    // For a failure with a known cause, ask for that cause too (the first problem the trace reports).
    if (r.verdict !== 'success' && code && causes && causes[code] && out.length < count) {
      const wrong = Object.keys(causes).filter((c) => c !== code).map((c) => causes[c]);
      const c = pgQuizChoices(causes[code], wrong, rnd);
      out.push({ id: `vlan-why-${a.id}-${b.id}`, kind: 'vlan', prompt: `The ping from ${a.name} to ${b.name} fails. Which problem does the lab's trace report first?`, options: c.options, correct: c.correct, explain: `${r.diagnosis.title}. ${r.diagnosis.text}` });
    }
  });
  // Which VLAN is a host's access port in?
  pgQuizShuffle(hosts, rnd).forEach((h) => {
    if (out.length >= count) return;
    const v = pgVlanOf(topo, h);
    if (v === null || Number.isNaN(v)) return;
    const vlans = [];
    (topo.switches || []).forEach((s) => (s.vlans || []).concat([1]).forEach((x) => { if (!vlans.includes(x)) vlans.push(x); }));
    const c = pgQuizChoices(`VLAN ${v}`, vlans.map((x) => `VLAN ${x}`).concat([`VLAN ${v + 10}`, `VLAN ${v + 20}`]), rnd);
    out.push({ id: `vlan-of-${h.id}`, kind: 'vlan', prompt: `${h.name} is plugged into ${h.switch} port ${h.port}. Which VLAN is it in?`, options: c.options, correct: c.correct, explain: `Port ${h.port} on ${h.switch} is configured for VLAN ${v}, so ${h.name}'s frames belong to VLAN ${v}.` });
  });
  // Does a trunk allow a VLAN?
  const trunks = [];
  (topo.switches || []).forEach((s) => s.ports.forEach((p) => { if (p.mode === 'trunk') trunks.push({ s, p }); }));
  pgQuizShuffle(trunks, rnd).forEach(({ s, p }) => {
    if (out.length >= count) return;
    const known = [];
    (topo.switches || []).forEach((x) => (x.vlans || []).forEach((v) => { if (!known.includes(v)) known.push(v); }));
    if (!known.length) return;
    const v = known[Math.floor(rnd() * known.length)];
    const allowed = pgVlanCarries(p, v);
    out.push({
      id: `vlan-trunk-${s.id}-${p.id}-${v}`, kind: 'vlan', prompt: `Trunk port ${p.id} on ${s.name || s.id}: does it carry VLAN ${v}?`,
      options: ['Yes, VLAN ' + v + ' is allowed on this trunk', 'No, VLAN ' + v + ' is not in the trunk\'s allowed list'], correct: allowed ? 0 : 1,
      explain: allowed ? `VLAN ${v} is in the allowed list, so its frames cross the trunk.` : `VLAN ${v} is not in the allowed list, so its frames are not sent across this trunk.`,
    });
  });
  return out;
}

/* ---- firewall tester ---- */

const PG_QUIZ_FW_OPTIONS = [
  'Yes, the connection works',
  'No: a rule denies it',
  'No: no rule allows it (the implicit deny)',
  'No: the firewall lets it through but nothing is listening',
  'No: something else stops it (translation, return traffic, routing)',
];

function pgQuizFwConnections(topo) {
  const hosts = topo.hosts || [];
  const out = [];
  hosts.forEach((src) => {
    hosts.forEach((dst) => {
      if (src.id === dst.id) return;
      (dst.services || []).forEach((s) => out.push({ from: src.id, to: dst.id, proto: s.proto, port: s.port, src, dst }));
    });
    // The firewall's public address with a port-forward.
    ((topo.fw && topo.fw.forwards) || []).forEach((f) => out.push({ from: src.id, to: 'fw-public', proto: f.proto, port: f.extPort, src, dst: { name: 'the firewall\'s public address' } }));
  });
  return out;
}

function pgQuizBuildFw(topo, rnd, count) {
  const out = [];
  const conns = pgQuizShuffle(pgQuizFwConnections(topo), rnd);
  const label = (c) => `${c.src.name} to ${c.dst.name} on ${c.proto.toUpperCase()} ${c.port}`;
  conns.slice(0, 2).forEach((c) => {
    const r = pgFwTest(topo, { from: c.from, to: c.to, proto: c.proto, port: c.port });
    const code = r.diagnosis && r.diagnosis.code;
    const correct = r.verdict === 'success' ? 0 : code === 'rule-denied' ? 1 : code === 'implicit-deny' ? 2 : code === 'refused' ? 3 : 4;
    out.push({ id: `fw-conn-${c.from}-${c.to}-${c.proto}-${c.port}`, kind: 'firewall', prompt: `Will this connection work: ${label(c)}?`, options: PG_QUIZ_FW_OPTIONS.slice(), correct, explain: r.summary + (r.diagnosis ? ` ${r.diagnosis.text}` : '') });
  });
  // Which rule decides it? Only for traffic that really goes through the rule list.
  const ruleCount = ((topo.fw && topo.fw.rules) || []).length;
  conns.slice(2).forEach((c) => {
    if (out.length >= count || ruleCount < 2) return;
    const r = pgFwTest(topo, { from: c.from, to: c.to, proto: c.proto, port: c.port });
    const code = r.diagnosis && r.diagnosis.code;
    const idx = r.matched ? topo.fw.rules.findIndex((x) => x.id === r.matched) : -1;
    if (!(idx >= 0 || code === 'implicit-deny')) return;
    const names = topo.fw.rules.slice(0, 6).map((_, i) => `Rule ${i + 1}`).concat(['None: the implicit deny drops it']);
    const right = idx >= 0 ? `Rule ${idx + 1}` : 'None: the implicit deny drops it';
    const c2 = pgQuizChoices(right, names, rnd);
    out.push({ id: `fw-rule-${c.from}-${c.to}-${c.proto}-${c.port}`, kind: 'firewall', prompt: `Which rule decides this connection: ${label(c)}?`, options: c2.options, correct: c2.correct, explain: r.steps.filter((s) => /^Rule \d|Rules, top to bottom/.test(s.text)).map((s) => s.text).join(' ') || r.summary });
  });
  return out;
}

/* ---- ACL lab ---- */

const PG_QUIZ_ACL_OPTIONS = [
  'Yes, it works in both directions',
  'No: an ACL drops the request',
  'No: the request passes but an ACL drops the reply',
  'No: routing, not an ACL, stops it',
];

function pgQuizAclChoice(verdict, code) {
  if (verdict === 'success') return 0;
  if (code === 'reply-blocked') return 2;
  if (['explicit-deny', 'implicit-deny', 'shadowed-permit', 'standard-acl-broad'].indexOf(code) >= 0) return 1;
  return 3;
}

function pgQuizAclConnections(topo) {
  const hosts = topo.hosts || [];
  const out = [];
  pgQuizPairs(hosts, hosts).forEach(([a, b]) => {
    [['icmp', null], ['tcp', 80], ['tcp', 443], ['tcp', 22], ['udp', 53]].forEach(([proto, port]) => out.push({ from: a.id, to: b.id, proto, port, src: a, dst: b }));
  });
  return out;
}

function pgQuizBuildAcl(topo, rnd, count) {
  const out = [];
  const word = (c) => (c.proto === 'icmp' ? 'a ping' : `${c.proto.toUpperCase()} ${c.port}`);
  const conns = pgQuizShuffle(pgQuizAclConnections(topo), rnd);
  const tested = conns.map((c) => ({ c, r: pgAclTest(topo, { from: c.from, to: c.to, proto: c.proto, port: c.port }) })).filter((x) => !(x.r.diagnosis && (x.r.diagnosis.code === 'bad-config' || x.r.diagnosis.code === 'bad-pair' || x.r.diagnosis.code === 'bad-port')));
  tested.slice(0, 2).forEach(({ c, r }) => {
    out.push({
      id: `acl-conn-${c.from}-${c.to}-${c.proto}-${c.port}`, kind: 'acl',
      prompt: `Will ${word(c)} from ${c.src.name} to ${c.dst.name} work, with its reply?`,
      options: PG_QUIZ_ACL_OPTIONS.slice(), correct: pgQuizAclChoice(r.verdict, r.diagnosis && r.diagnosis.code),
      explain: `${r.summary}${r.diagnosis ? ` ${r.diagnosis.text}` : ''}`,
    });
  });
  // Which entry of the first ACL the request meets decides it?
  tested.slice(2).forEach(({ c, r }) => {
    if (out.length >= count) return;
    const hit = r.consulted.find((x) => x.leg === 'request' && x.acl && x.action !== 'skipped' && !x.empty);
    if (!hit) return;
    const found = pgAclIfaceById(topo, hit.iface);
    const acl = found && pgAclFind(found.router, hit.acl);
    if (!acl) return;
    const entry = hit.entryId ? acl.entries.find((e) => e.id === hit.entryId) : null;
    if (!entry && !hit.implicit) return;
    const seqs = pgAclSorted(acl).map((e) => `Entry ${e.seq}`);
    const noneText = 'None: the invisible deny at the end drops it';
    const right = entry ? `Entry ${entry.seq}` : noneText;
    const ch = pgQuizChoices(right, seqs.concat([noneText]), rnd);
    out.push({
      id: `acl-entry-${c.from}-${c.to}-${c.proto}-${c.port}`, kind: 'acl',
      prompt: `${word(c)[0].toUpperCase()}${word(c).slice(1)} from ${c.src.name} to ${c.dst.name} reaches ${found.router.name} ${found.iface.name}, where ACL ${hit.acl} is applied ${hit.dir === 'in' ? 'inbound' : 'outbound'}. Which entry decides it?`,
      options: ch.options, correct: ch.correct,
      explain: entry ? `Entries are read lowest number first and the first match decides. Entry ${entry.seq} matches, so it ${hit.action === 'permit' ? 'permits' : 'denies'} the packet.` : 'No entry matches, so the invisible deny ip any any at the end of every ACL drops the packet.',
    });
  });
  return out;
}

/* ---- entry point ---- */

// A round of up to `count` questions about this topology (fewer when the network is too small).
function pgQuizBuild(kind, topo, opts) {
  const o = opts || {};
  const count = o.count || PG_QUIZ_COUNT;
  const rnd = pgQuizRng(o.seed === undefined ? 1 : o.seed);
  const list = kind === 'vlan' ? pgQuizBuildVlan(topo, rnd, count, o.causes)
    : kind === 'firewall' ? pgQuizBuildFw(topo, rnd, count)
      : kind === 'acl' ? pgQuizBuildAcl(topo, rnd, count)
        : pgQuizBuildIp(topo, rnd, count);
  return pgQuizShuffle(list, rnd).slice(0, count);
}
