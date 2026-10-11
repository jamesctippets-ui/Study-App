/* ---------------- Spanning Tree lab (Playground tool key: stp) ---------------- */

// topo = {
//   costTable: 'short' | 'long',                      // which standard path-cost table the switches use
//   switches: [{ id, name, priority, mac, stp, pos? }], // priority: multiple of 4096 (default 32768); stp: false = STP turned off
//   links: [{ id, speed, disabled,                    // speed in Mbps; disabled = cable cut or port shut
//             a: { sw, port, cost, prio }, b: { sw, port, cost, prio } }],  // cost: null = automatic; prio: port priority (default 128)
//   edges: [{ id, sw, port, name, device: 'pc' | 'switch', portfast, bpduGuard, rogue: { priority, mac } }],
// }
// One VLAN, one spanning tree. Every link is a point-to-point segment.
//
// Simplified on purpose: no BPDU timing (only the converged result is computed), no VLANs, no TCN/flush
// behaviour, and a switch with STP off is modelled as neither sending nor passing BPDUs and forwarding on
// every port (real devices differ in how they treat BPDUs when STP is off).

const PG_STP_COST = {
  // IEEE 802.1D-1998 recommended values ("short" or classic path costs)
  short: { 10: 100, 100: 19, 1000: 4, 10000: 2 },
  // IEEE 802.1t / 802.1D-2004 values ("long" path costs, 20 000 000 000 / speed in kbit/s)
  long: { 10: 2000000, 100: 200000, 1000: 20000, 10000: 2000 },
};
const PG_STP_SPEEDS = [10, 100, 1000, 10000];
const PG_STP_DEFAULT_PORT_PRIO = 128;
const PG_STP_ROLE = { root: 'Root', designated: 'Designated', alternate: 'Alternate', backup: 'Backup', down: 'Down', off: 'STP off' };

// Every diagnosis code pgStpTest can return for a failed check (the screens key their "predict first" causes on these).
function pgStpCodes() { return ['wrong-root', 'rogue-root', 'suboptimal-path', 'loop-no-stp', 'no-backup-root', 'no-redundancy', 'partitioned', 'no-path']; }

function pgStpSpeedText(speed) { return speed >= 1000 ? `${speed / 1000} Gbps` : `${speed} Mbps`; }

// A MAC address as 12 lowercase hex digits, or null. Accepts aa:bb:cc:dd:ee:ff, aa-bb-..., aabb.ccdd.eeff.
function pgStpMacNorm(text) {
  const s = String(text == null ? '' : text).trim().toLowerCase();
  if (!/^[0-9a-f]{2}([:-]?[0-9a-f]{2}){5}$/.test(s) && !/^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/.test(s)) return null;
  return s.replace(/[:.-]/g, '');
}
function pgStpMacText(norm) { return norm ? norm.replace(/(..)(?=.)/g, '$1:') : ''; }
function pgStpMacError(text) { return pgStpMacNorm(text) ? '' : 'Six pairs of hex digits, like 00:1a:2b:3c:4d:5e'; }

function pgStpPortNum(name) {
  const m = String(name).match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

// Lower bridge ID wins: priority first, then MAC address (fixed-length hex compares like a number).
function pgStpCmpBridge(a, b) {
  if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
  if (a.macNorm !== b.macNorm) return a.macNorm < b.macNorm ? -1 : 1;
  return 0;
}
// Lower port ID wins: port priority first, then port number.
function pgStpCmpPort(a, b) {
  if (a.prio !== b.prio) return a.prio < b.prio ? -1 : 1;
  if (a.num !== b.num) return a.num < b.num ? -1 : 1;
  return 0;
}
function pgStpBridgeText(n) { return `${n.priority} / ${n.mac}`; }
function pgStpPortIdText(p) { return `${p.prio}.${p.num}`; }

/* ---- validation ---- */

function pgStpValidate(topo) {
  const errs = [];
  if (!topo || !Array.isArray(topo.switches) || !Array.isArray(topo.links)) return ['The setup needs a list of switches and a list of links.'];
  if (topo.costTable !== 'short' && topo.costTable !== 'long') errs.push('The cost method must be short or long.');
  if (topo.switches.length < 2 || topo.switches.length > 5) errs.push('Use between 2 and 5 switches.');
  const ids = {};
  const macs = {};
  topo.switches.forEach((s) => {
    if (!s || typeof s.id !== 'string' || !s.id) { errs.push('A switch has no id.'); return; }
    if (ids[s.id]) errs.push(`Two switches share the id ${s.id}.`);
    ids[s.id] = s;
    const nm = typeof s.name === 'string' && s.name.trim() ? s.name : s.id;
    if (typeof s.name !== 'string' || !s.name.trim()) errs.push(`Switch ${s.id} needs a name.`);
    if (!Number.isInteger(s.priority) || s.priority < 0 || s.priority > 61440 || s.priority % 4096 !== 0) errs.push(`${nm}: the bridge priority must be a multiple of 4096 from 0 to 61440.`);
    const m = pgStpMacNorm(s.mac);
    if (!m) errs.push(`${nm}: "${s.mac}" is not a MAC address.`);
    else if (macs[m]) errs.push(`${nm}: the MAC address ${s.mac} is already used by another switch.`);
    else macs[m] = true;
  });
  const portUse = {};
  const useNum = (sw, port, what) => {
    if (typeof port !== 'string' || !port.trim()) { errs.push(`${what} needs a port name.`); return; }
    const key = `${sw}|${pgStpPortNum(port)}`;
    const nameKey = `${sw}|n|${port}`;
    if (portUse[key] || portUse[nameKey]) errs.push(`${what}: the port ${port} (or its number) is already used on that switch.`);
    portUse[key] = true;
    portUse[nameKey] = true;
  };
  const linkIds = {};
  topo.links.forEach((l) => {
    if (!l || typeof l.id !== 'string' || !l.id) { errs.push('A link has no id.'); return; }
    if (linkIds[l.id]) errs.push(`Two links share the id ${l.id}.`);
    linkIds[l.id] = true;
    if (PG_STP_SPEEDS.indexOf(l.speed) < 0) errs.push(`Link ${l.id}: speed must be 10, 100, 1000 or 10000 Mbps.`);
    ['a', 'b'].forEach((side) => {
      const e = l[side];
      if (!e || !ids[e.sw]) { errs.push(`Link ${l.id}: end ${side} is not attached to a known switch.`); return; }
      useNum(e.sw, e.port, `Link ${l.id}`);
      if (e.cost !== null && e.cost !== undefined && !(Number.isInteger(e.cost) && e.cost >= 1 && e.cost <= 200000000)) errs.push(`Link ${l.id}: a manual cost must be a whole number from 1 to 200000000, or empty for automatic.`);
      if (e.prio !== null && e.prio !== undefined && !(Number.isInteger(e.prio) && e.prio >= 0 && e.prio <= 240 && e.prio % 16 === 0)) errs.push(`Link ${l.id}: a port priority must be a multiple of 16 from 0 to 240.`);
    });
  });
  const edgeIds = {};
  (topo.edges || []).forEach((e) => {
    if (!e || typeof e.id !== 'string' || !e.id) { errs.push('An edge port has no id.'); return; }
    if (edgeIds[e.id]) errs.push(`Two edge ports share the id ${e.id}.`);
    edgeIds[e.id] = true;
    if (!ids[e.sw]) { errs.push(`Edge port ${e.id} is not attached to a known switch.`); return; }
    useNum(e.sw, e.port, `Edge port ${e.id}`);
    if (e.device !== 'pc' && e.device !== 'switch') errs.push(`Edge port ${e.id}: the device must be a PC or a switch.`);
    if (e.device === 'switch') {
      const r = e.rogue || {};
      const m = pgStpMacNorm(r.mac);
      if (!Number.isInteger(r.priority) || r.priority < 0 || r.priority > 61440 || r.priority % 4096 !== 0) errs.push(`Edge port ${e.id}: the attached switch needs a priority that is a multiple of 4096.`);
      if (!m) errs.push(`Edge port ${e.id}: the attached switch needs a MAC address.`);
      else if (macs[m]) errs.push(`Edge port ${e.id}: the attached switch reuses a MAC address.`);
      else macs[m] = true;
    }
  });
  return errs;
}

/* ---- building the working model ---- */

// opts: { downSwitches: [ids or '~edgeId'], failLinks: [linkIds] } to simulate a failure on a copy.
function pgStpBuild(topo, opts) {
  const o = opts || {};
  const down = o.downSwitches || [];
  const failed = o.failLinks || [];
  const table = PG_STP_COST[topo.costTable] || PG_STP_COST.short;
  const nodes = [];
  const byId = {};
  const addNode = (n) => { nodes.push(n); byId[n.id] = n; };
  topo.switches.forEach((s) => {
    if (down.indexOf(s.id) >= 0) return;
    const norm = pgStpMacNorm(s.mac);
    addNode({ id: s.id, name: s.name, priority: s.priority, macNorm: norm, mac: pgStpMacText(norm), stp: s.stp !== false, rogue: false });
  });
  const edgeInfo = [];
  const pseudoLinks = [];
  (topo.edges || []).forEach((e) => {
    const host = byId[e.sw];
    if (!host || down.indexOf(`~${e.id}`) >= 0) return;
    const info = { id: e.id, sw: e.sw, port: e.port, name: e.name || e.id, device: e.device, portfast: !!e.portfast, bpduGuard: !!e.bpduGuard, state: 'forwarding', note: '', rogueNode: null };
    if (e.device === 'switch') {
      if (e.bpduGuard) {
        info.state = 'errdisabled';
        info.note = `${info.name} sent a BPDU, so BPDU Guard shut port ${e.port} down (error-disabled). Its BPDUs never reach the spanning tree.`;
      } else {
        const r = e.rogue || {};
        const norm = pgStpMacNorm(r.mac);
        const id = `~${e.id}`;
        addNode({ id, name: e.name || 'Switch on edge port', priority: r.priority, macNorm: norm, mac: pgStpMacText(norm), stp: true, rogue: true, edge: e.id });
        info.rogueNode = id;
        info.note = `${info.name} is a switch, and nothing stops its BPDUs: it takes part in the root election like any other bridge.${e.portfast ? ' PortFast alone does not block BPDUs.' : ''}`;
        pseudoLinks.push({ id, speed: 100, disabled: false, a: { sw: e.sw, port: e.port }, b: { sw: id, port: 'Fa0/1' } });
      }
    } else if (e.portfast) {
      info.note = 'PortFast: the port goes straight to forwarding, so the PC gets a link at once.';
    } else {
      info.note = 'No PortFast: the port first works through the listening and learning states (15 seconds each with default classic timers), so the PC waits about 30 seconds.';
    }
    edgeInfo.push(info);
  });
  const links = [];
  const ports = [];
  const portByKey = {};
  const addLink = (spec) => {
    const na = byId[spec.a.sw];
    const nb = byId[spec.b.sw];
    if (!na || !nb) return;
    const lk = { id: spec.id, speed: spec.speed, up: !spec.disabled && failed.indexOf(spec.id) < 0, pseudo: spec.id.charAt(0) === '~', ends: [], status: 'down', winner: null };
    ['a', 'b'].forEach((side) => {
      const end = spec[side];
      const manual = Number.isInteger(end.cost) && end.cost > 0;
      const p = {
        key: `${end.sw}:${end.port}`, sw: end.sw, name: end.port, num: pgStpPortNum(end.port),
        prio: Number.isInteger(end.prio) ? end.prio : PG_STP_DEFAULT_PORT_PRIO,
        link: spec.id, side, cost: manual ? end.cost : table[spec.speed], autoCost: table[spec.speed], manualCost: manual,
        role: null, state: null, why: '', up: lk.up,
      };
      lk.ends.push(p);
      ports.push(p);
      portByKey[p.key] = p;
    });
    links.push(lk);
  };
  topo.links.forEach(addLink);
  pseudoLinks.forEach(addLink);
  return { nodes, byId, links, ports, portByKey, edgeInfo, table };
}

/* ---- the spanning tree computation ---- */

function pgStpOffer(node, port, dist) { return { cost: dist[node.id], node, port }; }
function pgStpCmpOffer(x, y) {
  if (x.cost !== y.cost) return x.cost < y.cost ? -1 : 1;
  const b = pgStpCmpBridge(x.node, y.node);
  return b !== 0 ? b : pgStpCmpPort(x.port, y.port);
}
function pgStpWhyBeat(w, l) {
  // Why offer w beat offer l on a segment (the words used in the trace).
  if (w.cost !== l.cost) return `it offers a lower root path cost (${w.cost} versus ${l.cost})`;
  if (pgStpCmpBridge(w.node, l.node) !== 0) return `the root path costs tie at ${w.cost}, so the lower bridge ID wins (${w.node.name} ${pgStpBridgeText(w.node)} beats ${l.node.name} ${pgStpBridgeText(l.node)})`;
  return `the cost and bridge ID tie, so the lower port ID wins (${pgStpPortIdText(w.port)} beats ${pgStpPortIdText(l.port)})`;
}

function pgStpCompute(topo, opts) {
  const errors = pgStpValidate(topo);
  const empty = { errors, nodes: [], ports: [], portMap: {}, links: [], roots: [], root: null, rootName: '', active: [], loop: false, loopLinks: [], storm: null, realComps: 0, edges: [], trace: { election: [], rootPorts: [], segments: [] }, costTable: topo && topo.costTable };
  if (errors.length) return empty;
  const m = pgStpBuild(topo, opts);
  const nodes = m.nodes;
  const byId = m.byId;
  const links = m.links;
  const portByKey = m.portByKey;
  const trace = { election: [], rootPorts: [], segments: [] };
  const name = (id) => (byId[id] ? byId[id].name : id);
  const peer = (p) => { const lk = links.find((x) => x.id === p.link); return lk.ends[0] === p ? lk.ends[1] : lk.ends[0]; };
  const linkOf = (p) => links.find((x) => x.id === p.link);

  // 1. Groups of STP switches that can hear each other's BPDUs (joined by up links; a switch with STP off is not part of any group).
  const uf = {};
  nodes.forEach((n) => { uf[n.id] = n.id; });
  const find = (x) => { let r = x; while (uf[r] !== r) r = uf[r]; return r; };
  links.forEach((lk) => {
    const a = byId[lk.ends[0].sw];
    const b = byId[lk.ends[1].sw];
    if (lk.up && a.stp && b.stp) uf[find(a.id)] = find(b.id);
  });
  const groups = {};
  nodes.filter((n) => n.stp).forEach((n) => { const r = find(n.id); (groups[r] = groups[r] || []).push(n); });
  const groupList = Object.keys(groups).map((k) => groups[k]).sort((x, y) => (y.length - x.length) || pgStpCmpBridge(x.slice().sort(pgStpCmpBridge)[0], y.slice().sort(pgStpCmpBridge)[0]));

  const dist = {};
  const rootOf = {};
  const rootPortOf = {};
  const rootInfo = {};
  const roots = [];
  groupList.forEach((g) => {
    // 2. Root bridge election: the lowest bridge ID (priority, then MAC) in the group.
    const sorted = g.slice().sort(pgStpCmpBridge);
    const root = sorted[0];
    roots.push(root.id);
    const label = groupList.length > 1 ? ` (group of ${g.length})` : '';
    if (sorted.length === 1) {
      trace.election.push({ ok: true, text: `${root.name} (bridge ID ${pgStpBridgeText(root)}) has no STP neighbour${label}, so it is its own root bridge.` });
    } else {
      const list = sorted.map((n) => `${n.name} ${pgStpBridgeText(n)}`).join('  <  ');
      trace.election.push({ ok: true, text: `Bridge IDs (priority / MAC), lowest first${label}: ${list}.` });
      const why = sorted[0].priority < sorted[1].priority
        ? `${root.name} has the lowest priority (${root.priority}); the MAC address is only compared when priorities are equal.`
        : `The lowest priority is shared (${root.priority}), so the lowest MAC address decides: ${root.mac} is lower than ${sorted[1].mac}.`;
      trace.election.push({ ok: true, text: `${root.name} wins and is the root bridge. ${why}` });
    }
    g.forEach((n) => { dist[n.id] = Infinity; rootOf[n.id] = root.id; });
    dist[root.id] = 0;
    // 3. Root path cost: the cost of each port a BPDU is received on is added on the way down the tree.
    const glinks = links.filter((lk) => lk.up && uf[lk.ends[0].sw] !== undefined && find(lk.ends[0].sw) === find(root.id) && byId[lk.ends[0].sw].stp && byId[lk.ends[1].sw].stp && lk.ends[0].sw !== lk.ends[1].sw);
    for (let pass = 0; pass < g.length + 1; pass += 1) {
      glinks.forEach((lk) => {
        const a = lk.ends[0];
        const b = lk.ends[1];
        if (dist[a.sw] + b.cost < dist[b.sw]) dist[b.sw] = dist[a.sw] + b.cost;
        if (dist[b.sw] + a.cost < dist[a.sw]) dist[a.sw] = dist[b.sw] + a.cost;
      });
    }
  });

  // 4. Each segment (link) has one designated port: the end offering the best vector (root path cost, bridge ID, port ID).
  links.forEach((lk) => {
    const a = lk.ends[0];
    const b = lk.ends[1];
    const na = byId[a.sw];
    const nb = byId[b.sw];
    if (!lk.up) { a.role = 'down'; b.role = 'down'; a.state = 'down'; b.state = 'down'; a.why = 'The link is down.'; b.why = 'The link is down.'; return; }
    if (!na.stp || !nb.stp) {
      [[a, na, nb], [b, nb, na]].forEach((t) => {
        const p = t[0];
        if (!t[1].stp) { p.role = 'off'; p.state = 'forwarding'; p.why = 'STP is off on this switch: the port simply forwards.'; }
        else { p.role = 'designated'; p.state = 'forwarding'; p.why = `No BPDUs arrive here because ${t[2].name} does not run STP, so this port is designated and forwards.`; }
      });
      return;
    }
    const oa = pgStpOffer(na, a, dist);
    const ob = pgStpOffer(nb, b, dist);
    const aWins = pgStpCmpOffer(oa, ob) < 0;
    lk.winner = aWins ? 0 : 1;
    const w = aWins ? a : b;
    const l = aWins ? b : a;
    const wo = aWins ? oa : ob;
    const lo = aWins ? ob : oa;
    w.role = 'designated';
    w.state = 'forwarding';
    l.role = 'pending';
    lk.offers = { winner: wo, loser: lo };
  });

  // 5. Root port: on each non-root switch, the best BPDU heard from a designated port (lowest root path cost, then lowest
  //    sender bridge ID, then lowest sender port ID, then lowest own port ID).
  nodes.filter((n) => n.stp).forEach((n) => {
    const heard = [];
    m.ports.filter((p) => p.sw === n.id && p.role === 'pending').forEach((p) => {
      const lk = linkOf(p);
      const q = peer(p);
      if (q.sw === n.id) return;
      if (lk.ends[lk.winner] !== q) return;
      heard.push({ port: p, sender: byId[q.sw], senderPort: q, cost: dist[q.sw] + p.cost });
    });
    heard.sort((x, y) => (x.cost - y.cost) || pgStpCmpBridge(x.sender, y.sender) || pgStpCmpPort(x.senderPort, y.senderPort) || pgStpCmpPort(x.port, y.port));
    const isRoot = rootOf[n.id] === n.id;
    if (isRoot || !heard.length) {
      rootInfo[n.id] = { candidates: [], reason: isRoot ? 'root' : 'none' };
      return;
    }
    const best = heard[0];
    let reason = 'only';
    if (heard.length > 1) {
      const s = heard[1];
      if (best.cost !== s.cost) reason = 'cost';
      else if (pgStpCmpBridge(best.sender, s.sender) !== 0) reason = 'sender-bridge';
      else if (pgStpCmpPort(best.senderPort, s.senderPort) !== 0) reason = 'sender-port';
      else reason = 'own-port';
    }
    best.port.role = 'root';
    best.port.state = 'forwarding';
    rootPortOf[n.id] = best.port;
    dist[n.id] = best.cost;
    rootInfo[n.id] = { candidates: heard, reason };
    let text = `${n.name}: root port ${best.port.name}, total root path cost ${best.cost} through ${best.sender.name}.`;
    if (heard.length > 1) {
      const s = heard[1];
      const other = `${s.port.name} via ${s.sender.name} costs ${s.cost}`;
      if (reason === 'cost') text += ` The other candidate (${other}) is more expensive; the lowest path cost to the root wins.`;
      else if (reason === 'sender-bridge') text += ` Another port ties on cost (${other}), so the lower sender bridge ID decides: ${best.sender.name} ${pgStpBridgeText(best.sender)} beats ${s.sender.name} ${pgStpBridgeText(s.sender)}.`;
      else if (reason === 'sender-port') text += ` Another port ties on cost and sender bridge (${other}), so the lower sender port ID decides: ${pgStpPortIdText(best.senderPort)} beats ${pgStpPortIdText(s.senderPort)}.`;
      else text += ` Another port ties on everything the sender announces, so the lower local port ID decides: ${pgStpPortIdText(best.port)} beats ${pgStpPortIdText(s.port)}.`;
    }
    if (best.port.manualCost) text += ` This port has a manual cost of ${best.port.cost} (the automatic value would be ${best.port.autoCost}).`;
    trace.rootPorts.push({ ok: true, text });
  });
  nodes.filter((n) => n.stp && rootOf[n.id] === n.id).forEach((n) => {
    trace.rootPorts.unshift({ ok: true, text: `${n.name} is a root bridge: it has no root port, and all its ports are designated.` });
  });

  // 6. Everything that is not designated and not a root port is alternate (the winner is another switch) or backup (the same switch).
  links.forEach((lk) => {
    if (!lk.up) return;
    lk.ends.forEach((p) => {
      if (p.role !== 'pending') return;
      const q = peer(p);
      p.role = q.sw === p.sw ? 'backup' : 'alternate';
      p.state = 'discarding';
    });
  });
  // plain-language reasons per port, and the segment trace
  links.forEach((lk) => {
    if (!lk.up || !lk.offers) return;
    const w = lk.offers.winner;
    const l = lk.offers.loser;
    const wp = w.port;
    const lp = l.port;
    const beat = pgStpWhyBeat(w, l);
    const isBackup = wp.sw === lp.sw;
    wp.why = rootOf[w.node.id] === w.node.id && w.node.stp && !isBackup
      ? `Designated: ${w.node.name} is the root bridge, so its ports are designated (root path cost 0).`
      : `Designated: the best port on this segment because ${beat}.`;
    if (lp.role === 'root') lp.why = `Root port: the best path to the root bridge, total cost ${dist[l.node.id]}.`;
    else if (lp.role === 'backup') lp.why = `Backup: both ends of this cable are on ${l.node.name}. The port with the lower port ID (${wp.name}) stays designated and this one is held back, because ${beat}.`;
    else lp.why = `Alternate: ${w.node.name} ${wp.name} is the designated port on this segment because ${beat}. This port is a standby path to the root and takes over if the root port fails.`;
    const ln = `${name(wp.sw)} ${wp.name} - ${name(lp.sw)} ${lp.name}`;
    let text;
    if (lp.role === 'root') text = `${ln}: ${name(wp.sw)} is designated, ${name(lp.sw)} uses this as its root port. Both forward.`;
    else if (lp.role === 'backup') text = `${ln}: a cable between two ports of one switch. ${wp.name} is designated; ${lp.name} is the backup port and discards.`;
    else text = `${ln}: ${name(wp.sw)} ${wp.name} is designated because ${beat}. ${name(lp.sw)} ${lp.name} becomes an alternate port and discards (classic STP: blocking).`;
    trace.segments.push({ ok: true, blocked: lp.role === 'alternate' || lp.role === 'backup', text, link: lk.id });
  });

  // 7. Which links actually carry traffic, loops, and the storm that follows a loop.
  const active = [];
  links.forEach((lk) => {
    if (!lk.up) { lk.status = 'down'; return; }
    const fwd = lk.ends[0].state === 'forwarding' && lk.ends[1].state === 'forwarding';
    lk.status = fwd ? 'forwarding' : 'blocked';
    if (fwd) active.push({ link: lk.id, u: lk.ends[0].sw, v: lk.ends[1].sw, speed: lk.speed });
  });
  const loopLinks = active.filter((e, i) => {
    if (e.u === e.v) return true;
    const seen = {};
    seen[e.u] = true;
    const stack = [e.u];
    while (stack.length) {
      const x = stack.pop();
      active.forEach((f, j) => {
        if (j === i) return;
        const y = f.u === x ? f.v : f.v === x ? f.u : null;
        if (y !== null && !seen[y]) { seen[y] = true; stack.push(y); }
      });
    }
    return !!seen[e.v];
  }).map((e) => e.link);
  links.forEach((lk) => { if (loopLinks.indexOf(lk.id) >= 0) lk.status = 'loop'; });
  // components of the active topology, counting real switches only
  const au = {};
  nodes.forEach((n) => { au[n.id] = n.id; });
  const afind = (x) => { let r = x; while (au[r] !== r) r = au[r]; return r; };
  active.forEach((e) => { au[afind(e.u)] = afind(e.v); });
  const compSet = {};
  nodes.filter((n) => !n.rogue).forEach((n) => { compSet[afind(n.id)] = true; });
  const realComps = Object.keys(compSet).length;

  // node summaries
  const nodeOut = nodes.map((n) => ({
    id: n.id, name: n.name, rogue: n.rogue, stp: n.stp, priority: n.priority, mac: n.mac, macNorm: n.macNorm, edge: n.edge || null,
    bridgeId: pgStpBridgeText(n),
    isRoot: n.stp && rootOf[n.id] === n.id,
    rootId: n.stp ? rootOf[n.id] : null,
    rootCost: n.stp ? dist[n.id] : null,
    rootPort: rootPortOf[n.id] ? rootPortOf[n.id].key : null,
    rootInfo: rootInfo[n.id] || null,
  }));
  const portMap = {};
  m.ports.forEach((p) => { portMap[p.key] = p; });
  // primary root: the root of the biggest group
  const primary = roots.length ? roots[0] : null;
  const res = {
    errors: [], costTable: topo.costTable, nodes: nodeOut, ports: m.ports, portMap,
    links: links.map((lk) => ({ id: lk.id, speed: lk.speed, up: lk.up, status: lk.status, a: lk.ends[0].key, b: lk.ends[1].key, pseudo: lk.pseudo, winner: lk.winner })),
    roots, root: primary, rootName: primary ? name(primary) : '', multiRoot: roots.length > 1,
    active, loop: loopLinks.length > 0, loopLinks, realComps, edges: m.edgeInfo, trace,
  };
  res.storm = res.loop ? pgStpStorm(res) : null;
  return res;
}

// What a broadcast does in a loop: copies of one frame in flight after each hop (no TTL, so they never die).
function pgStpStorm(res) {
  const eds = res.active.filter((e) => res.loopLinks.indexOf(e.link) >= 0);
  const all = res.active;
  if (!eds.length) return null;
  const start = eds[0].u;
  let flight = {};
  const put = (map, k, c) => { map[k] = Math.min(1e12, (map[k] || 0) + c); };
  all.forEach((e, i) => {
    if (e.u === e.v) { if (e.u === start) put(flight, `${i}>${e.v}`, 1); return; }
    if (e.u === start) put(flight, `${i}>${e.v}`, 1);
    else if (e.v === start) put(flight, `${i}>${e.u}`, 1);
  });
  const hops = [];
  for (let hop = 1; hop <= 6; hop += 1) {
    hops.push({ hop, copies: Object.keys(flight).reduce((s, k) => s + flight[k], 0) });
    const next = {};
    Object.keys(flight).forEach((k) => {
      const parts = k.split('>');
      const ei = Number(parts[0]);
      const at = parts[1];
      all.forEach((f, j) => {
        if (f.u !== at && f.v !== at) return;
        if (j === ei && !(f.u === f.v)) return;
        const to = f.u === at ? f.v : f.u;
        put(next, `${j}>${to}`, flight[k]);
      });
    });
    flight = next;
  }
  return { hops, growing: hops[hops.length - 1].copies > hops[0].copies, copies: hops[hops.length - 1].copies };
}

/* ---- comparing two results (what changed when a cable failed) ---- */

function pgStpRoleText(p) {
  if (p.role === 'down') return 'down';
  if (p.role === 'off') return 'STP off (forwarding)';
  return `${PG_STP_ROLE[p.role].toLowerCase()} (${p.state})`;
}
function pgStpDiff(before, after) {
  const out = [];
  if (!before || !after || before.errors.length || after.errors.length) return out;
  if (before.root !== after.root && before.root && after.root) out.push({ kind: 'root', text: `The root bridge changed from ${before.rootName} to ${after.rootName}.` });
  const nameOf = (res, id) => (res.nodes.find((n) => n.id === id) || { name: id }).name;
  after.ports.forEach((p) => {
    const q = before.portMap[p.key];
    if (!q) return;
    if (q.role === p.role && q.state === p.state) return;
    const unblocked = q.state === 'discarding' && p.state === 'forwarding';
    const blocked = q.state === 'forwarding' && p.state === 'discarding';
    const text = `${nameOf(after, p.sw)} ${p.name}: ${pgStpRoleText(q)} to ${pgStpRoleText(p)}${unblocked ? '. A blocked port starts forwarding.' : blocked ? '. This port is now held back.' : ''}`;
    out.push({ kind: unblocked ? 'unblocked' : blocked ? 'blocked' : 'change', text, port: p.key });
  });
  return out;
}

/* ---- reachability ---- */

function pgStpPath(res, from, to) {
  if (from === to) return { nodes: [from], links: [], speeds: [], bottleneck: null };
  const prev = {};
  prev[from] = null;
  const queue = [from];
  while (queue.length) {
    const x = queue.shift();
    for (let i = 0; i < res.active.length; i += 1) {
      const e = res.active[i];
      const y = e.u === x ? e.v : e.v === x ? e.u : null;
      if (y === null || y === x || prev[y] !== undefined) continue;
      prev[y] = { from: x, link: e.link, speed: e.speed };
      queue.push(y);
    }
  }
  if (prev[to] === undefined) return null;
  const nodes = [to];
  const ls = [];
  const speeds = [];
  let cur = to;
  while (prev[cur]) { ls.unshift(prev[cur].link); speeds.unshift(prev[cur].speed); cur = prev[cur].from; nodes.unshift(cur); }
  return { nodes, links: ls, speeds, bottleneck: speeds.length ? Math.min.apply(null, speeds) : null };
}

// The real switches that are cut off from the biggest connected part of the active topology.
function pgStpCutOff(res) {
  const au = {};
  res.nodes.forEach((n) => { au[n.id] = n.id; });
  const afind = (x) => { let r = x; while (au[r] !== r) r = au[r]; return r; };
  res.active.forEach((e) => { au[afind(e.u)] = afind(e.v); });
  const sizes = {};
  res.nodes.filter((n) => !n.rogue).forEach((n) => { const r = afind(n.id); sizes[r] = (sizes[r] || 0) + 1; });
  let bigRoot = null;
  Object.keys(sizes).forEach((r) => { if (bigRoot === null || sizes[r] > sizes[bigRoot]) bigRoot = r; });
  return res.nodes.filter((n) => !n.rogue && afind(n.id) !== bigRoot).map((n) => n.name);
}

/* ---- helpers for names ---- */

function pgStpName(topo, id) {
  const s = (topo.switches || []).find((x) => x.id === id);
  return s ? s.name : id;
}
function pgStpLinkName(topo, id) {
  const l = (topo.links || []).find((x) => x.id === id);
  if (!l) return id;
  return `${pgStpName(topo, l.a.sw)} (${l.a.port}) to ${pgStpName(topo, l.b.sw)} (${l.b.port})`;
}
function pgStpLinkShort(topo, id) {
  const l = (topo.links || []).find((x) => x.id === id);
  if (!l) return id;
  return l.a.sw === l.b.sw ? `${pgStpName(topo, l.a.sw)} ${l.a.port} to ${l.b.port}` : `${pgStpName(topo, l.a.sw)} to ${pgStpName(topo, l.b.sw)}`;
}

// The wording of a goal or question (shown in the goal checklist).
function pgStpGoalText(topo, g) {
  const n = (id) => pgStpName(topo, id);
  switch (g.check) {
    case 'health': return 'The network is healthy: no loop and every switch can reach the others';
    case 'no-loop': return 'There is no switching loop (no broadcast storm)';
    case 'root': return `${n(g.switch)} is the root bridge`;
    case 'backup-root': return `If the root bridge failed, ${n(g.switch)} would become the new root`;
    case 'survive': return `Losing the ${pgStpLinkShort(topo, g.link)} cable does not cut any switch off`;
    case 'redundant': return 'No single cable failure cuts a switch off';
    case 'forwarding': return `The ${pgStpLinkShort(topo, g.link)} link forwards traffic`;
    case 'path': return `Traffic from ${n(g.from)} to ${n(g.to)} ${g.via ? `uses the ${pgStpLinkShort(topo, g.via)} link` : 'has a path'}`;
    default: return g.check;
  }
}

/* ---- checks (goals and questions) ---- */

function pgStpOutcome(verdict, summary, diagnosis, steps, state) {
  return { verdict, summary, diagnosis: diagnosis || null, steps, state };
}

function pgStpLoopDiagnosis(topo, res) {
  const offIds = {};
  res.loopLinks.forEach((id) => {
    const l = topo.links.find((x) => x.id === id);
    if (l) [l.a.sw, l.b.sw].forEach((s) => { const sw = topo.switches.find((x) => x.id === s); if (sw && sw.stp === false) offIds[s] = true; });
  });
  const offNames = Object.keys(offIds).map((s) => pgStpName(topo, s));
  const who = offNames.length ? `${offNames.join(' and ')} ${offNames.length > 1 ? 'have' : 'has'} STP turned off, so ${offNames.length > 1 ? 'they forward' : 'it forwards'} on every port and nothing blocks the cable ring` : 'Every port in the ring is forwarding';
  const links = res.loopLinks.map((id) => pgStpLinkShort(topo, id)).join(', ');
  return pgFail('loop-no-stp', 'A switching loop with no spanning tree protecting it',
    `${who} (${links}). A broadcast frame sent into this ring is forwarded out of every other port, comes back round and is forwarded again. Ethernet frames have no time-to-live, so the copies never die: this is a broadcast storm, and MAC address tables start flapping too.`,
    'Turn STP back on for every switch in the loop (or remove the redundant cable). With STP on, one port in the ring is blocked and the frames stop circulating.',
    Object.keys(offIds)[0] || null, 'stp');
}

function pgStpWhyNotUsed(topo, res, linkId) {
  const lk = res.links.find((x) => x.id === linkId);
  if (!lk) return { text: 'That link does not exist.', port: null };
  const label = pgStpLinkShort(topo, linkId);
  if (!lk.up) return { text: `The ${label} link is down.`, port: null };
  const pa = res.portMap[lk.a];
  const pb = res.portMap[lk.b];
  const held = [pa, pb].find((p) => p.state === 'discarding');
  if (!held) return { text: `The ${label} link is forwarding.`, port: null };
  const nm = pgStpName(topo, held.sw);
  let text = `The ${label} link is not carrying traffic: ${nm} ${held.name} is an ${held.role} port (${held.state}). ${held.why}`;
  const manual = [pa, pb].find((p) => p.manualCost);
  if (manual) text += ` Note that ${pgStpName(topo, manual.sw)} ${manual.name} has a manual cost of ${manual.cost}; the automatic cost for ${pgStpSpeedText(lk.speed)} would be ${manual.autoCost}.`;
  return { text, port: manual || held };
}

function pgStpTest(topo, ask) {
  const res = pgStpCompute(topo);
  if (res.errors.length) {
    return pgStpOutcome('failed', 'The setup has a problem, so no spanning tree can be worked out.',
      pgFail('bad-setup', 'The setup is not valid', res.errors.join(' '), 'Fix the fields marked in red.', null, null),
      res.errors.map((t) => ({ ok: false, text: t })), res);
  }
  const g = ask || { check: 'health' };
  const sw = (id) => res.nodes.find((x) => x.id === id);
  const n = (id) => pgStpName(topo, id);
  const election = res.trace.election;
  switch (g.check) {
    case 'health': {
      const cut = pgStpCutOff(res);
      const steps = [{ ok: !res.loop, text: res.loop ? `A forwarding loop exists on: ${res.loopLinks.map((id) => pgStpLinkShort(topo, id)).join(', ')}.` : 'No forwarding loop: the ports that forward form a tree.' },
        { ok: cut.length === 0, text: cut.length ? `These switches are cut off from the rest: ${cut.join(', ')}.` : 'Every switch can reach every other switch over forwarding ports.' }];
      if (res.loop) return pgStpOutcome('failed', 'There is a switching loop.', pgStpLoopDiagnosis(topo, res), steps.concat(res.storm ? [{ ok: false, text: `Broadcast storm: one broadcast frame becomes ${res.storm.hops[res.storm.hops.length - 1].copies} copies in flight after ${res.storm.hops.length} hops and never expires.` }] : []), res);
      if (cut.length) return pgStpOutcome('failed', `${cut.join(', ')} cannot reach the rest of the network.`, pgFail('partitioned', 'Part of the network is cut off', `${cut.join(', ')} ${cut.length > 1 ? 'have' : 'has'} no forwarding path to the other switches, usually because a link is down or disabled.`, 'Bring the missing link back up, or add a second uplink.', null, 'disabled'), steps, res);
      return pgStpOutcome('success', `Healthy: ${res.multiRoot ? 'the spanning trees are loop-free' : `one loop-free tree with ${res.rootName} as root`}, and every switch is reachable.`, null, steps.concat(election), res);
    }
    case 'no-loop': {
      if (res.loop) return pgStpOutcome('failed', 'There is a switching loop.', pgStpLoopDiagnosis(topo, res), [{ ok: false, text: `Forwarding loop on: ${res.loopLinks.map((id) => pgStpLinkShort(topo, id)).join(', ')}.` }].concat(res.storm ? [{ ok: false, text: `One broadcast becomes ${res.storm.copies} copies in flight after ${res.storm.hops.length} hops and none of them expires.` }] : []), res);
      return pgStpOutcome('success', 'No loop: the forwarding ports form a tree.', null, [{ ok: true, text: 'The forwarding links connect the switches without a closed ring, so a broadcast reaches every switch once and stops.' }], res);
    }
    case 'root': {
      const want = sw(g.switch);
      if (!want) return pgStpOutcome('failed', 'That switch does not exist.', pgFail('bad-goal', 'Unknown switch', `There is no switch called ${g.switch}.`, 'Pick a switch from the list.'), [], res);
      const actual = sw(res.root);
      if (res.root === g.switch && !res.multiRoot) {
        return pgStpOutcome('success', `${want.name} is the root bridge.`, null, election, res);
      }
      if (!want.stp) {
        return pgStpOutcome('failed', `${want.name} cannot be the root: STP is turned off on it.`,
          pgFail('wrong-root', `${want.name} does not take part in the election`, `${want.name} has STP turned off, so it sends no BPDUs and is not in the root election. ${res.rootName ? `${res.rootName} is the root of what is left.` : ''}`, `Turn STP on for ${want.name}.`, want.id, 'stp'),
          election, res);
      }
      if (res.multiRoot && res.root === g.switch) {
        const others = res.roots.filter((r) => r !== g.switch).map((r) => n(r) || r);
        return pgStpOutcome('failed', `${want.name} is a root, but not the only one: ${others.join(', ')} also think${others.length === 1 ? 's' : ''} they are root.`,
          pgFail('wrong-root', 'More than one root bridge', `A switch with STP turned off does not pass BPDUs, so the STP switches on either side of it cannot hear each other and each side elects its own root (${res.roots.map((r) => res.nodes.find((x) => x.id === r).name).join(', ')}).`, 'Turn STP on for every switch so there is a single spanning tree.', null, 'stp'),
          election, res);
      }
      if (actual && actual.rogue) {
        const edge = res.edges.find((e) => e.rogueNode === actual.id);
        return pgStpOutcome('failed', `${actual.name} on ${n(edge ? edge.sw : '')} port ${edge ? edge.port : ''} is the root bridge, not ${want.name}.`,
          pgFail('rogue-root', 'A device on an edge port took over as root bridge', `${actual.name} is a switch plugged into an access port and its bridge ID (${pgStpBridgeText(actual)}) is lower than ${want.name}'s (${pgStpBridgeText(want)}). Nothing on that port stops its BPDUs, so it won the election and now every path leads towards a wall socket.`, 'Enable BPDU Guard (with PortFast) on edge ports: a port that should only ever connect to end devices is shut down the moment a BPDU arrives.', edge ? edge.id : null, 'bpduGuard'),
          election, res);
      }
      return pgStpOutcome('failed', `${actual ? actual.name : 'Another switch'} is the root bridge, not ${want.name}.`,
        pgFail('wrong-root', `The wrong switch is the root bridge (${actual ? actual.name : '?'})`,
          `${actual ? actual.name : 'Another switch'} has the lowest bridge ID (${actual ? actual.bridgeId : ''}) and won the election; ${want.name} is ${pgStpBridgeText(want)}. ${actual && actual.priority === want.priority ? `The priorities tie at ${want.priority}, so the lowest MAC address decides (${actual.mac} is lower than ${want.mac}).` : `${actual ? actual.name : 'It'} has the lower priority${actual ? ` (${actual.priority} versus ${want.priority})` : ''}; the MAC address is only compared when the priorities are equal.`} Left to the defaults, the root is simply whichever switch has the lowest MAC address, whether or not it is a sensible place for the centre of the tree.`,
          `Give ${want.name} a lower bridge priority than every other switch (4096 is a common choice) so it wins on priority, and set a higher number than that on the intended backup root.`, want.id, 'priority'),
        election, res);
    }
    case 'backup-root': {
      const want = sw(g.switch);
      if (!want) return pgStpOutcome('failed', 'That switch does not exist.', pgFail('bad-goal', 'Unknown switch', `There is no switch called ${g.switch}.`), [], res);
      if (!res.root) return pgStpOutcome('failed', 'There is no root bridge.', pgFail('no-backup-root', 'No STP root', 'No switch is running STP.', 'Turn STP on.'), [], res);
      if (res.root === g.switch) {
        return pgStpOutcome('failed', `${want.name} is the root bridge right now, so it cannot be the backup.`, pgFail('no-backup-root', 'This switch is the root, not the backup', `${want.name} wins the election today. A backup root is the switch that wins when the root is gone.`, 'Give the backup root a priority just above the root (for example 8192 against 4096).', want.id, 'priority'), election, res);
      }
      const after = pgStpCompute(topo, { downSwitches: [res.root] });
      const wn = after.nodes.find((x) => x.id === g.switch);
      const winner = wn && wn.stp ? after.nodes.find((x) => x.id === wn.rootId) : null;
      const steps = [{ ok: true, text: `Today ${res.rootName} is the root. Switch it off and run the election again among the rest.` }].concat(after.trace.election);
      if (winner && winner.id === g.switch) return pgStpOutcome('success', `If ${res.rootName} failed, ${want.name} would win the election and become the root bridge.`, null, steps, res);
      const who = winner ? winner.name : 'nobody';
      return pgStpOutcome('failed', `If ${res.rootName} failed, ${who} would become the root, not ${want.name}.`,
        pgFail('no-backup-root', 'No backup root bridge has been set', `With ${res.rootName} gone, ${who} has the lowest bridge ID of the switches left (${winner ? winner.bridgeId : '-'}) and becomes the root. ${want.name} is ${pgStpBridgeText(want)}. Unless a second switch has a deliberately low priority, the backup root is decided by whichever MAC address happens to be lowest.`,
          `Give ${want.name} a priority that is higher (a worse number) than the root's but lower than every other switch, for example 4096 on the root and 8192 on ${want.name}.`, want.id, 'priority'),
        steps, res);
    }
    case 'survive':
    case 'redundant': {
      const ids = g.check === 'survive' ? [g.link] : res.links.filter((l) => l.up && !l.pseudo).map((l) => l.id);
      if (g.check === 'survive' && !topo.links.some((l) => l.id === g.link)) return pgStpOutcome('failed', 'That link does not exist.', pgFail('bad-goal', 'Unknown link', `There is no link ${g.link}.`), [], res);
      const baseCut = pgStpCutOff(res);
      if (baseCut.length) return pgStpOutcome('failed', `${baseCut.join(', ')} is already cut off before any failure.`, pgFail('partitioned', 'Part of the network is cut off', `${baseCut.join(', ')} cannot reach the rest of the network right now.`, 'Bring the missing link back up first.', null, 'disabled'), [], res);
      const steps = [];
      for (let i = 0; i < ids.length; i += 1) {
        const after = pgStpCompute(topo, { failLinks: [ids[i]] });
        const cut = pgStpCutOff(after);
        const diff = pgStpDiff(res, after);
        if (g.check === 'survive') {
          steps.push({ ok: true, text: `Cut the cable ${pgStpLinkShort(topo, ids[i])} and run the election again.` });
          diff.forEach((d) => steps.push({ ok: true, text: d.text }));
          if (!diff.length) steps.push({ ok: true, text: 'No port changes role: this link was not carrying traffic that anything depends on.' });
        }
        if (cut.length) {
          steps.push({ ok: false, text: `${cut.join(', ')} ${cut.length > 1 ? 'are' : 'is'} cut off when ${pgStpLinkShort(topo, ids[i])} fails: no other forwarding or blocked path is available.` });
          return pgStpOutcome('failed', `If the ${pgStpLinkShort(topo, ids[i])} link fails, ${cut.join(', ')} loses the network.`,
            pgFail('no-redundancy', 'A single cable failure cuts a switch off', `${cut.join(', ')} depends on the single link ${pgStpLinkShort(topo, ids[i])}: there is no alternate port to take over. A blocked port is not a fault, it is the standby path; a link that is down or disabled provides no standby at all.`, 'Give the switch a second uplink and keep it enabled, so STP can hold it as an alternate port and use it if the first fails.', null, 'disabled'),
            steps, res);
        }
        if (g.check === 'survive') steps.push({ ok: true, text: 'Every switch can still reach the others, so the network recovers on its own (classic STP in about 30 to 50 seconds, RSTP in about a second).' });
      }
      if (g.check === 'redundant') steps.push({ ok: true, text: `Each of the ${ids.length} links was cut in turn and every switch could still reach the others.` });
      return pgStpOutcome('success', g.check === 'survive' ? `The network survives losing ${pgStpLinkShort(topo, g.link)}.` : 'No single cable failure cuts a switch off.', null, steps, res);
    }
    case 'forwarding': {
      const lk = res.links.find((x) => x.id === g.link);
      if (!lk) return pgStpOutcome('failed', 'That link does not exist.', pgFail('bad-goal', 'Unknown link', `There is no link ${g.link}.`), [], res);
      if (lk.status === 'forwarding' || lk.status === 'loop') return pgStpOutcome('success', `The ${pgStpLinkShort(topo, g.link)} link forwards traffic.`, null, [{ ok: true, text: 'Both ends of the link are in the forwarding state.' }], res);
      const why = pgStpWhyNotUsed(topo, res, g.link);
      return pgStpOutcome('failed', `The ${pgStpLinkShort(topo, g.link)} link is not forwarding.`, pgFail('suboptimal-path', 'The link is blocked', why.text, 'Change what makes the other path cheaper: remove manual costs, fix the real speed, or move the root bridge.', why.port ? why.port.sw : null, 'cost'), [{ ok: false, text: why.text }], res);
    }
    case 'path': {
      if (!sw(g.from) || !sw(g.to)) return pgStpOutcome('failed', 'That switch does not exist.', pgFail('bad-goal', 'Unknown switch', 'Pick two switches from the list.'), [], res);
      const p = pgStpPath(res, g.from, g.to);
      if (!p) {
        return pgStpOutcome('failed', `${n(g.from)} cannot reach ${n(g.to)}.`, pgFail('no-path', 'No forwarding path', `There is no chain of forwarding links between ${n(g.from)} and ${n(g.to)}. A cable may be down, or the only path goes through a blocked port.`, 'Restore a link so the two sit in the same tree.', null, 'disabled'), [{ ok: false, text: 'No path over forwarding ports.' }], res);
      }
      const route = p.nodes.map(n).join(' to ');
      const steps = [{ ok: true, text: `Traffic follows the tree: ${route}${p.bottleneck ? `, slowest link ${pgStpSpeedText(p.bottleneck)}` : ''}. Frames only ever use forwarding ports, so this is the one path the tree allows.` }];
      if (g.via && p.links.indexOf(g.via) < 0) {
        const why = pgStpWhyNotUsed(topo, res, g.via);
        steps.push({ ok: false, text: why.text });
        return pgStpOutcome('failed', `Traffic from ${n(g.from)} to ${n(g.to)} does not use the ${pgStpLinkShort(topo, g.via)} link; it goes ${route}.`,
          pgFail('suboptimal-path', 'Traffic takes a longer or slower path than intended', why.text, 'STP picks the path with the lowest total cost to the root, not the fastest-looking cable. Remove a manual port cost, make sure the link runs at its real speed, or put the root where you want the traffic to flow.', why.port ? why.port.sw : null, 'cost'),
          steps, res);
      }
      return pgStpOutcome('success', `Traffic from ${n(g.from)} to ${n(g.to)}: ${route}.`, null, steps, res);
    }
    default:
      return pgStpOutcome('failed', 'Unknown check.', pgFail('bad-goal', 'Unknown check', String(g.check), 'Pick a check from the list.'), [], res);
  }
}

/* ---- fixes (the scenario data uses these to show the answer and for tests) ---- */

// fixes: [{ switch, field, value }] | [{ link, field, value }] | [{ link, end: 'a'|'b', field: 'cost'|'prio', value }] | [{ edge, field, value }] | [{ costTable }]
function pgStpApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.switch) { const s = t.switches.find((x) => x.id === f.switch); if (s) s[f.field] = f.value; }
    else if (f.link && f.end) { const l = t.links.find((x) => x.id === f.link); if (l) l[f.end][f.field] = f.value; }
    else if (f.link) { const l = t.links.find((x) => x.id === f.link); if (l) l[f.field] = f.value; }
    else if (f.edge) { const e = (t.edges || []).find((x) => x.id === f.edge); if (e) { if (f.sub) e[f.sub][f.field] = f.value; else e[f.field] = f.value; } }
    else if (f.costTable) t.costTable = f.costTable;
  });
  return t;
}
