/* ---------------- IT Playground: ACL lab (pure engine) ---------------- */

// A small routed network (one or two routers, a few LANs, hosts and servers) with Cisco IOS-style
// IPv4 access lists. The engine follows a test packet the way a router handles it:
//   1. the packet arrives on an interface: the INBOUND ACL of that interface (if one is applied) is read;
//   2. the router looks up the destination: a connected network, or the longest matching static route
//      (a default route is just the shortest prefix, 0.0.0.0/0);
//   3. the packet leaves through the egress interface: the OUTBOUND ACL of that interface is read.
// Facts modelled (Cisco IOS behaviour as documented for IPv4 access lists):
//   - a standard ACL (numbers 1-99 and 1300-1999, or a named standard ACL) matches the SOURCE address only;
//     an extended ACL (100-199 and 2000-2699, or named extended) matches protocol, source, destination and,
//     for tcp and udp, the ports; `established` matches TCP packets that have the ACK or RST bit set
//   - addresses are written `any`, `host a.b.c.d` or `a.b.c.d wildcard`; a WILDCARD mask is the inverse of a
//     subnet mask: a 1 bit means "ignore this bit" (0.0.0.255 matches the whole last octet)
//   - entries carry sequence numbers and are read lowest number first; the first match decides; after the
//     last entry comes an invisible `deny ip any any`; an ACL that has no entries at all permits everything
//   - an ACL does nothing until it is applied to an interface with `ip access-group <name|number> in|out`,
//     and an interface holds at most one ACL per direction for IPv4
//   - ACLs filter packets that pass THROUGH the router (and packets sent TO the router, on the inbound side);
//     an outbound ACL does not filter packets that the router itself creates
//   - ACLs are stateless: the reply to an allowed request is a separate packet and meets its own ACLs
// Simplified on purpose: IPv4 only; no object groups, time ranges, reflexive ACLs, CBAC or ACL logging; no NAT,
// fragments, TCP flags other than ACK/RST, ICMP types other than echo and echo-reply; hosts have no firewall of
// their own and nothing "listens" (the tester judges the ACLs and routes only); the client's source port is
// fixed at 50000; routers know connected and static routes only; two hosts on one subnet talk across a
// switch, so no router (and no ACL) sees that traffic.
//
// topo = {
//   routers: [{ id, name,
//     interfaces: [{ id, name: 'Gi0/0', desc, ip, prefix, aclIn: ''|aclName, aclOut: ''|aclName }],
//     routes: [{ id, dest, prefix, via }],
//     acls: [{ name, kind: 'standard'|'extended', entries: [entry] }] }],
//   hosts: [{ id, name, ip, prefix, gateway, kind: 'pc'|'server' }]
// }
// entry (standard) = { id, seq, action: 'permit'|'deny', src }
// entry (extended) = { id, seq, action, proto: 'ip'|'tcp'|'udp'|'icmp', src, srcPort, dst, dstPort, icmp: 'any'|'echo'|'echo-reply', established }
// address text: 'any' | 'host 10.0.0.5' | '10.0.0.0 0.0.0.255' (a bare address is a host, standard ACLs only)
// port text: 'any' | 'eq 80' | 'neq 80' | 'lt 1024' | 'gt 1023' | 'range 20 21'

const PG_ACL_EPHEMERAL = 50000;
const PG_ACL_MAX_VISITS = 8;
// A few of the port names IOS accepts instead of numbers.
const PG_ACL_PORT_NAMES = { www: 80, telnet: 23, ftp: 21, 'ftp-data': 20, smtp: 25, domain: 53, pop3: 110 };
const PG_ACL_PROTOS = ['ip', 'tcp', 'udp', 'icmp'];
const PG_ACL_ICMP = ['any', 'echo', 'echo-reply'];

/* ---- lookups ---- */

function pgAclRouter(topo, id) { return (topo.routers || []).find((r) => r.id === id) || null; }
function pgAclHost(topo, id) { return (topo.hosts || []).find((h) => h.id === id) || null; }
function pgAclFind(router, name) { return ((router && router.acls) || []).find((a) => a.name === name) || null; }
function pgAclIfaceById(topo, id) {
  const rs = topo.routers || [];
  for (let i = 0; i < rs.length; i += 1) {
    const f = (rs[i].interfaces || []).find((x) => x.id === id);
    if (f) return { router: rs[i], iface: f };
  }
  return null;
}
function pgAclIfaceByIp(topo, ipN) {
  if (ipN === null || ipN === undefined) return null;
  const rs = topo.routers || [];
  for (let i = 0; i < rs.length; i += 1) {
    const f = (rs[i].interfaces || []).find((x) => pgParseIPv4(x.ip) === ipN);
    if (f) return { router: rs[i], iface: f };
  }
  return null;
}
function pgAclIfaceNet(iface) {
  const ipN = pgParseIPv4(iface.ip);
  const mask = pgMaskFromPrefix(Number(iface.prefix));
  return { ipN, mask, net: ipN === null ? null : (ipN & mask) >>> 0 };
}
function pgAclLongName(n) { return String(n).replace(/^Gi(?=\d)/, 'GigabitEthernet').replace(/^Fa(?=\d)/, 'FastEthernet'); }

/* ---- parsing ---- */

const PG_ACL_ADDR_HELP = 'Write any, host 10.0.0.5, or an address followed by a wildcard mask such as 10.0.0.0 0.0.0.255.';

// -> { ok: true, form: 'any'|'host'|'net', ip, wild, text } | { ok: false, error }
function pgAclParseAddr(text, kind) {
  const s = String(text == null ? '' : text).trim().toLowerCase().replace(/\s+/g, ' ');
  if (s === '') return { ok: false, error: PG_ACL_ADDR_HELP };
  if (s === 'any') return { ok: true, form: 'any', ip: 0, wild: 0xFFFFFFFF, text: 'any' };
  const parts = s.split(' ');
  if (parts[0] === 'host') {
    const ip = parts.length === 2 ? pgParseIPv4(parts[1]) : null;
    if (ip === null) return { ok: false, error: 'After host comes one IPv4 address, for example host 10.0.0.5.' };
    return { ok: true, form: 'host', ip, wild: 0, text: `host ${pgIpToString(ip)}` };
  }
  if (parts.length === 1) {
    const ip = pgParseIPv4(parts[0]);
    if (ip !== null && kind === 'standard') return { ok: true, form: 'host', ip, wild: 0, text: `host ${pgIpToString(ip)}` };
    if (ip !== null) return { ok: false, error: 'An extended ACL needs host 10.0.0.5, or the address followed by a wildcard mask.' };
    return { ok: false, error: PG_ACL_ADDR_HELP };
  }
  if (parts.length === 2) {
    const ip = pgParseIPv4(parts[0]);
    const wild = pgParseIPv4(parts[1]);
    if (ip === null || wild === null) return { ok: false, error: `${PG_ACL_ADDR_HELP} Both parts must be dotted IPv4 numbers.` };
    return { ok: true, form: 'net', ip, wild, text: `${pgIpToString(ip)} ${pgIpToString(wild)}` };
  }
  return { ok: false, error: PG_ACL_ADDR_HELP };
}

// Does an address (as a number) fall under a parsed address? Bits where the wildcard has a 1 are ignored.
function pgAclAddrMatch(a, ipN) {
  if (!a || !a.ok || ipN === null || ipN === undefined) return false;
  return (((ipN ^ a.ip) & ~a.wild) >>> 0) === 0;
}

// A wildcard written like a subnet mask: ones packed to the left, such as 255.255.255.0. Real wildcards pack
// their ones to the right (0.0.0.255). 0.0.0.0 and 255.255.255.255 are fine either way.
function pgAclMaskLike(wild) {
  if (wild === 0 || wild === 0xFFFFFFFF) return false;
  const inv = (~wild) >>> 0;
  return (inv & ((inv + 1) >>> 0)) === 0;
}

function pgAclPortValue(tok) {
  if (/^\d{1,5}$/.test(tok)) { const n = Number(tok); return n <= 65535 ? n : null; }
  return Object.prototype.hasOwnProperty.call(PG_ACL_PORT_NAMES, tok) ? PG_ACL_PORT_NAMES[tok] : null;
}
const PG_ACL_PORT_HELP = 'Use any, eq 80, neq 80, lt 1024, gt 1023 or range 20 21.';

// -> { ok: true, op: 'any'|'eq'|'neq'|'lt'|'gt'|'range', a, b, text } | { ok: false, error }
function pgAclParsePort(text) {
  const s = String(text == null ? '' : text).trim().toLowerCase().replace(/\s+/g, ' ');
  if (s === '' || s === 'any') return { ok: true, op: 'any', a: null, b: null, text: 'any' };
  let m = /^(eq|neq|lt|gt) (\S+)$/.exec(s);
  if (m) {
    const a = pgAclPortValue(m[2]);
    if (a === null) return { ok: false, error: `${m[2]} is not a port number (0 to 65535). ${PG_ACL_PORT_HELP}` };
    return { ok: true, op: m[1], a, b: null, text: `${m[1]} ${a}` };
  }
  m = /^range (\S+) (\S+)$/.exec(s);
  if (m) {
    const a = pgAclPortValue(m[1]); const b = pgAclPortValue(m[2]);
    if (a === null || b === null) return { ok: false, error: `A range needs two port numbers. ${PG_ACL_PORT_HELP}` };
    if (a > b) return { ok: false, error: 'In a range the first port must not be above the second.' };
    return { ok: true, op: 'range', a, b, text: `range ${a} ${b}` };
  }
  return { ok: false, error: PG_ACL_PORT_HELP };
}

function pgAclPortMatch(p, port) {
  if (!p || !p.ok) return false;
  if (p.op === 'any') return true;
  if (port === null || port === undefined) return false;
  if (p.op === 'eq') return port === p.a;
  if (p.op === 'neq') return port !== p.a;
  if (p.op === 'lt') return port < p.a;
  if (p.op === 'gt') return port > p.a;
  return port >= p.a && port <= p.b;
}

/* ---- ACL entries ---- */

function pgAclSorted(acl) { return ((acl && acl.entries) || []).slice().sort((x, y) => Number(x.seq) - Number(y.seq)); }

// The entry as a router prints it, without the sequence number: "permit tcp 10.1.20.0 0.0.0.255 host 10.1.30.10 eq 80"
function pgAclEntryText(kind, e) {
  const src = pgAclParseAddr(e.src, kind);
  const s = src.ok ? src.text : String(e.src || '').trim();
  if (kind === 'standard') return `${e.action} ${s}`;
  const proto = e.proto || 'ip';
  const dst = pgAclParseAddr(e.dst, kind);
  const d = dst.ok ? dst.text : String(e.dst || '').trim();
  const parts = [e.action, proto, s];
  if (proto === 'tcp' || proto === 'udp') {
    const sp = pgAclParsePort(e.srcPort); if (sp.ok && sp.op !== 'any') parts.push(sp.text);
    parts.push(d);
    const dp = pgAclParsePort(e.dstPort); if (dp.ok && dp.op !== 'any') parts.push(dp.text);
    if (proto === 'tcp' && e.established) parts.push('established');
  } else {
    parts.push(d);
    if (proto === 'icmp' && e.icmp && e.icmp !== 'any') parts.push(e.icmp);
  }
  return parts.join(' ');
}

// pkt = { proto: 'tcp'|'udp'|'icmp'|'ip', srcIp, dstIp (numbers), srcPort, dstPort, ack (TCP ACK/RST set), icmp: 'echo'|'echo-reply'|null }
function pgAclEntryMatches(acl, e, pkt) {
  const src = pgAclParseAddr(e.src, acl.kind);
  if (!src.ok || !pgAclAddrMatch(src, pkt.srcIp)) return false;
  if (acl.kind === 'standard') return true;
  const proto = e.proto || 'ip';
  if (proto !== 'ip' && proto !== pkt.proto) return false;
  const dst = pgAclParseAddr(e.dst, acl.kind);
  if (!dst.ok || !pgAclAddrMatch(dst, pkt.dstIp)) return false;
  if (proto === 'tcp' || proto === 'udp') {
    if (!pgAclPortMatch(pgAclParsePort(e.srcPort), pkt.srcPort) || !pgAclPortMatch(pgAclParsePort(e.dstPort), pkt.dstPort)) return false;
    if (proto === 'tcp' && e.established && !pkt.ack) return false;
  }
  if (proto === 'icmp' && e.icmp && e.icmp !== 'any' && e.icmp !== pkt.icmp) return false;
  return true;
}

// Is every packet that entry `a` matches also matched by entry `b`? (used to tell a deliberate "deny, then permit
// the rest" from a specific permit that sits below a broad deny)
function pgAclAddrSubset(a, b) {
  if (!a.ok || !b.ok) return false;
  return ((a.wild & ~b.wild) >>> 0) === 0 && (((a.ip ^ b.ip) & ~b.wild) >>> 0) === 0;
}
function pgAclPortRanges(p) {
  if (!p.ok || p.op === 'any') return [[0, 65535]];
  if (p.op === 'eq') return [[p.a, p.a]];
  if (p.op === 'neq') return [[0, p.a - 1], [p.a + 1, 65535]].filter((r) => r[0] <= r[1]);
  if (p.op === 'lt') return p.a === 0 ? [] : [[0, p.a - 1]];
  if (p.op === 'gt') return p.a === 65535 ? [] : [[p.a + 1, 65535]];
  return [[p.a, p.b]];
}
function pgAclPortSubset(pa, pb) {
  const B = pgAclPortRanges(pb);
  return pgAclPortRanges(pa).every((ra) => B.some((rb) => ra[0] >= rb[0] && ra[1] <= rb[1]));
}
function pgAclEntrySubset(acl, a, b) {
  if (!pgAclAddrSubset(pgAclParseAddr(a.src, acl.kind), pgAclParseAddr(b.src, acl.kind))) return false;
  if (acl.kind === 'standard') return true;
  const pa = a.proto || 'ip'; const pb = b.proto || 'ip';
  if (pb !== 'ip' && pa !== pb) return false;
  if (!pgAclAddrSubset(pgAclParseAddr(a.dst, acl.kind), pgAclParseAddr(b.dst, acl.kind))) return false;
  if (pb === 'tcp' || pb === 'udp') {
    if (!pgAclPortSubset(pgAclParsePort(a.srcPort), pgAclParsePort(b.srcPort)) || !pgAclPortSubset(pgAclParsePort(a.dstPort), pgAclParsePort(b.dstPort))) return false;
    if (b.established && !a.established) return false;
  }
  if (pb === 'icmp' && b.icmp && b.icmp !== 'any' && a.icmp !== b.icmp) return false;
  return true;
}

// Read an ACL for one packet -> { action, entry, index, list, implicit, empty }
function pgAclEval(acl, pkt) {
  const list = pgAclSorted(acl);
  if (!list.length) return { action: 'permit', entry: null, index: -1, list, implicit: false, empty: true };
  for (let i = 0; i < list.length; i += 1) {
    if (pgAclEntryMatches(acl, list[i], pkt)) return { action: list[i].action, entry: list[i], index: i, list, implicit: false, empty: false };
  }
  return { action: 'deny', entry: null, index: -1, list, implicit: true, empty: false };
}

// A copy of an entry whose subnet-mask-looking wildcards are inverted into real wildcards, or null when it has none.
function pgAclFixedMask(acl, e) {
  const out = { ...e }; let changed = false;
  ['src', 'dst'].forEach((f) => {
    if (acl.kind === 'standard' && f === 'dst') return;
    const a = pgAclParseAddr(e[f], acl.kind);
    if (a.ok && a.form === 'net' && pgAclMaskLike(a.wild)) { out[f] = `${pgIpToString(a.ip)} ${pgIpToString((~a.wild) >>> 0)}`; changed = true; }
  });
  return changed ? out : null;
}

/* ---- configuration checks ---- */

function pgAclNameProblem(name, kind) {
  const n = String(name == null ? '' : name);
  if (n === '') return 'Give the ACL a name or a number.';
  if (/^\d+$/.test(n)) {
    const v = Number(n);
    const std = (v >= 1 && v <= 99) || (v >= 1300 && v <= 1999);
    const ext = (v >= 100 && v <= 199) || (v >= 2000 && v <= 2699);
    if (!std && !ext) return 'A numbered ACL uses 1-99 or 1300-1999 (standard) or 100-199 or 2000-2699 (extended).';
    if (kind === 'standard' && !std) return `${n} is in the extended range (100-199, 2000-2699), so it cannot be a standard ACL. Pick a number from 1-99 or 1300-1999, or use a name.`;
    if (kind === 'extended' && !ext) return `${n} is in the standard range (1-99, 1300-1999), so it cannot be an extended ACL. Pick a number from 100-199 or 2000-2699, or use a name.`;
    return '';
  }
  if (!/^[A-Za-z][A-Za-z0-9._-]{0,62}$/.test(n)) return 'A name starts with a letter and uses letters, digits, "-", "_" or ".", with no spaces.';
  return '';
}

// -> [{ router, acl, entryId, field, text }] (field: name, seq, action, proto, src, dst, srcPort, dstPort, established, icmp, '<ifaceId>.in', '<ifaceId>.out')
function pgAclValidate(topo) {
  const errs = [];
  (topo.routers || []).forEach((r) => {
    const names = {};
    (r.acls || []).forEach((a) => {
      const add = (field, text, entryId) => errs.push({ router: r.id, acl: a.name, entryId: entryId || null, field, text });
      if (a.kind !== 'standard' && a.kind !== 'extended') add('kind', 'An ACL is standard or extended.');
      const np = pgAclNameProblem(a.name, a.kind);
      if (np) add('name', np);
      else if (names[a.name]) add('name', 'Another ACL on this router already has this name.');
      else names[a.name] = true;
      const seen = {};
      (a.entries || []).forEach((e) => {
        const addE = (field, text) => add(field, text, e.id);
        const sq = Number(e.seq);
        if (!(String(e.seq).trim() !== '' && Number.isInteger(sq) && sq >= 1 && sq <= 2147483647)) addE('seq', 'The sequence number is a whole number, 1 or higher.');
        else if (seen[sq]) addE('seq', `Sequence number ${sq} is already used in this ACL.`);
        else seen[sq] = true;
        if (e.action !== 'permit' && e.action !== 'deny') addE('action', 'Choose permit or deny.');
        const s = pgAclParseAddr(e.src, a.kind); if (!s.ok) addE('src', s.error);
        if (a.kind !== 'extended') return;
        const proto = e.proto || 'ip';
        if (PG_ACL_PROTOS.indexOf(proto) < 0) addE('proto', 'The protocol is ip, tcp, udp or icmp.');
        const d = pgAclParseAddr(e.dst, a.kind); if (!d.ok) addE('dst', d.error);
        const hasPorts = proto === 'tcp' || proto === 'udp';
        [['srcPort', e.srcPort], ['dstPort', e.dstPort]].forEach(([f, v]) => {
          const p = pgAclParsePort(v);
          if (!p.ok) addE(f, p.error);
          else if (p.op !== 'any' && !hasPorts) addE(f, 'Ports can only be matched in tcp and udp entries.');
        });
        if (e.established && proto !== 'tcp') addE('established', 'established only works in tcp entries.');
        if (e.icmp && e.icmp !== 'any' && (proto !== 'icmp' || PG_ACL_ICMP.indexOf(e.icmp) < 0)) addE('icmp', 'An ICMP message (echo, echo-reply) only works in icmp entries.');
      });
    });
    (r.interfaces || []).forEach((i) => {
      [['aclIn', 'in'], ['aclOut', 'out']].forEach(([k, d]) => {
        if (i[k] && !pgAclFind(r, i[k])) errs.push({ router: r.id, acl: null, entryId: null, field: `${i.id}.${d}`, text: `${r.name} ${i.name} is set to use an ACL named ${i[k]}, and there is no such ACL on ${r.name}.` });
      });
    });
  });
  return errs;
}

/* ---- routing ---- */

// All routes that cover a destination -> { best, others }. Connected networks and usable static routes
// compete by prefix length (longest wins); on a tie a connected route beats a static one.
function pgAclRoute(router, dstN) {
  const cands = [];
  (router.interfaces || []).forEach((i) => {
    const n = pgAclIfaceNet(i);
    if (n.ipN === null) return;
    if (((dstN & n.mask) >>> 0) === n.net) cands.push({ kind: 'connected', prefix: Number(i.prefix), net: n.net, iface: i, via: null, text: `${pgIpToString(n.net)}/${i.prefix} (connected)` });
  });
  (router.routes || []).forEach((rt) => {
    const dn = pgParseIPv4(rt.dest); const vn = pgParseIPv4(rt.via); const p = Number(rt.prefix);
    if (dn === null || vn === null || !(p >= 0 && p <= 32)) return;
    const mask = pgMaskFromPrefix(p);
    if (((dstN & mask) >>> 0) !== ((dn & mask) >>> 0)) return;
    const egress = (router.interfaces || []).find((i) => { const n = pgAclIfaceNet(i); return n.ipN !== null && n.ipN !== vn && ((vn & n.mask) >>> 0) === n.net; });
    if (!egress) return; // a static route whose next hop is not on a connected network is not installed
    cands.push({ kind: 'static', prefix: p, net: (dn & mask) >>> 0, iface: egress, via: vn, text: `${pgIpToString((dn & mask) >>> 0)}/${p} via ${rt.via}${p === 0 ? ' (default route)' : ' (static)'}` });
  });
  if (!cands.length) return { best: null, others: [] };
  let best = cands[0];
  cands.forEach((c) => { if (c.prefix > best.prefix || (c.prefix === best.prefix && c.kind === 'connected' && best.kind !== 'connected')) best = c; });
  return { best, others: cands.filter((c) => c !== best) };
}

/* ---- text helpers ---- */

function pgAclDirWord(dir) { return dir === 'in' ? 'inbound' : 'outbound'; }

function pgAclPktText(pkt) {
  const s = pkt.srcIp === null ? '?' : pgIpToString(pkt.srcIp); const d = pgIpToString(pkt.dstIp);
  if (pkt.proto === 'tcp') return `TCP ${s}:${pkt.srcPort} to ${d}:${pkt.dstPort}${pkt.ack ? ' with the ACK bit set' : ' (SYN, a new connection)'}`;
  if (pkt.proto === 'udp') return `UDP ${s}:${pkt.srcPort} to ${d}:${pkt.dstPort}`;
  if (pkt.proto === 'icmp') return `ICMP ${pkt.icmp === 'echo-reply' ? 'echo reply' : 'echo request'} from ${s} to ${d}`;
  return `an IP packet from ${s} to ${d}`;
}

// One line saying how an ACL read a packet
function pgAclStepText(router, iface, dir, acl, ev) {
  const where = `${dir === 'in' ? 'Inbound' : 'Outbound'} ACL ${acl.name} on ${router.name} ${iface.name}`;
  if (ev.empty) return `${where}: the ACL has no entries, and an ACL with no entries permits everything.`;
  const before = ev.implicit ? ev.list : ev.list.slice(0, ev.index);
  const skipped = before.length ? `${before.length === 1 ? `entry ${before[0].seq} does` : `entries ${before.map((x) => x.seq).join(', ')} do`} not match; ` : '';
  if (ev.implicit) return `${where}: ${before.length === 1 ? `entry ${before[0].seq} does not match` : `none of the ${before.length} entries (${before.map((x) => x.seq).join(', ')}) match`}, so the invisible last line, ${acl.kind === 'standard' ? 'deny any' : 'deny ip any any'}, drops the packet.`;
  const e = ev.entry;
  return `${where}: ${skipped}entry ${e.seq} (${pgAclEntryText(acl.kind, e)}) matches, so the packet is ${e.action === 'permit' ? 'permitted' : 'dropped'}.`;
}

function pgAclRouteText(router, dstIp, rt, egress) {
  const b = rt.best;
  let t;
  if (b.kind === 'connected') t = `${router.name} routes it: ${dstIp} is on the connected network ${pgIpToString(b.net)}/${b.prefix}, so the packet leaves through ${egress.name}.`;
  else if (b.prefix === 0) t = `${router.name} routes it: no more specific route matches, so the default route 0.0.0.0/0 via ${pgIpToString(b.via)} is used and the packet leaves through ${egress.name}.`;
  else t = `${router.name} routes it: the longest matching route is ${pgIpToString(b.net)}/${b.prefix} via ${pgIpToString(b.via)} (static), so the packet leaves through ${egress.name}.`;
  const shorter = rt.others.filter((c) => c.prefix < b.prefix);
  if (shorter.length) t += ` Shorter matches (${shorter.map((c) => `${pgIpToString(c.net)}/${c.prefix}`).join(', ')}) lose to the longer prefix.`;
  return t;
}

function pgAclFail(code, title, text, fix, extra) {
  return Object.assign(pgFail(code, title, text, fix, (extra && extra.router) || null, (extra && extra.field) || null), extra || {});
}

/* ---- one packet along its path ---- */

// Endpoints: { kind: 'host', host, name, ip, ipN } | { kind: 'router', router, name } (a source that creates the packet)
//          | { kind: 'iface', router, iface, name, ip, ipN } (a destination: the router's own address)
function pgAclEndpoint(topo, id, role) {
  const h = pgAclHost(topo, id);
  if (h) return { kind: 'host', host: h, name: h.name, ip: h.ip, ipN: pgParseIPv4(h.ip) };
  const r = pgAclRouter(topo, id);
  if (r && role === 'src') return { kind: 'router', router: r, name: `${r.name} (the router itself)` };
  const f = pgAclIfaceById(topo, id);
  if (f && role === 'dst') return { kind: 'iface', router: f.router, iface: f.iface, name: `${f.router.name} ${f.iface.name}`, ip: f.iface.ip, ipN: pgParseIPv4(f.iface.ip) };
  return null;
}

// Walk one packet from src to dst. leg is 'request' or 'reply'. pkt.srcIp may be null for a router source (it is
// filled in once the egress interface is known). -> { steps, hops, consulted, delivered, diagnosis, blocked, pkt, srcIface }
function pgAclRunLeg(topo, src, dst, pktIn, leg) {
  const pkt = { ...pktIn };
  const steps = []; const hops = []; const consulted = [];
  const res = { leg, steps, hops, consulted, delivered: false, diagnosis: null, blocked: null, pkt, srcIface: null };
  const dstN = dst.ipN;
  const stop = (diag) => { res.diagnosis = diag; return res; };
  const apply = (router, iface, dir, hop) => {
    const name = dir === 'in' ? iface.aclIn : iface.aclOut;
    const acl = pgAclFind(router, name);
    const ev = pgAclEval(acl, pkt);
    hop[dir] = { state: ev.action === 'permit' ? 'allowed' : 'blocked', acl: name, seq: ev.entry ? ev.entry.seq : null, action: ev.action };
    consulted.push({ router: router.id, iface: iface.id, dir, acl: name, entryId: ev.entry ? ev.entry.id : null, implicit: ev.implicit, empty: ev.empty, action: ev.action, leg });
    steps.push({ ok: ev.action === 'permit', text: pgAclStepText(router, iface, dir, acl, ev) });
    if (ev.action === 'deny') res.blocked = { router, iface, dir, acl, ev };
    return ev.action;
  };

  let router = null; let ingress = null; let origin = false;
  if (src.kind === 'router') { router = src.router; origin = true; }
  else {
    const h = src.host; const hN = pgParseIPv4(h.ip); const hp = Number(h.prefix);
    if (dst.kind === 'host' && pgSameSubnet(hN, hp, dstN)) {
      steps.push({ ok: true, text: `${dst.name} (${dst.ip}) is on the same subnet as ${h.name}, so the packet crosses the switch directly. No router touches it, so no ACL is consulted.` });
      res.delivered = true;
      return res;
    }
    if (dst.kind === 'iface' && pgSameSubnet(hN, hp, dstN)) {
      router = dst.router; ingress = dst.iface;
      steps.push({ ok: true, text: `${dst.name} (${dst.ip}) is on the same subnet as ${h.name}, so the packet goes straight to that router interface.` });
    } else {
      const gwN = pgParseIPv4(h.gateway);
      const gw = pgAclIfaceByIp(topo, gwN);
      if (!gw || !pgSameSubnet(hN, hp, gwN)) {
        steps.push({ ok: false, text: `${h.name} is not on the same subnet as ${dst.ip} and has no working default gateway (${h.gateway || 'none set'}), so it has nowhere to send the packet.` });
        return stop(pgAclFail('no-gateway', `${h.name} has no working gateway`, `${dst.ip} is on another network, so ${h.name} must hand the packet to its default gateway, and the gateway ${h.gateway || '(none)'} is not a router interface on its own subnet.`, 'Set the host\'s default gateway to its router interface address.', { router: null, field: null }));
      }
      router = gw.router; ingress = gw.iface;
      steps.push({ ok: true, text: `${dst.ip} is on another network, so ${h.name} sends the packet to its default gateway ${h.gateway}.` });
    }
  }

  for (let visit = 0; visit < PG_ACL_MAX_VISITS; visit += 1) {
    const hop = { leg, router: router.id, routerName: router.name, ingress: ingress ? ingress.id : null, egress: null, in: { state: 'none' }, out: { state: 'none' } };
    hops.push(hop);
    if (origin) steps.push({ ok: true, text: `${router.name} creates this packet itself.` });
    else {
      steps.push({ ok: true, text: `${router.name} receives it on ${ingress.name} (${ingress.ip}/${ingress.prefix}).${ingress.aclIn ? '' : ' No inbound ACL is applied there.'}` });
      if (ingress.aclIn && apply(router, ingress, 'in', hop) === 'deny') return res;
    }
    if (dst.kind === 'iface' && dst.router.id === router.id) {
      steps.push({ ok: true, text: `The packet is addressed to ${router.name} itself (${dst.ip}), so the router accepts it. It is not routed on, so no outbound ACL applies.` });
      res.delivered = true;
      return res;
    }
    const rt = pgAclRoute(router, dstN);
    if (!rt.best) {
      steps.push({ ok: false, text: `${router.name} has no connected network, static route or default route that covers ${dst.ip}, so it drops the packet.` });
      return stop(pgAclFail('no-route', `${router.name} has no route to ${dst.ip}`, `Before any outbound ACL is read, the router must know where to send the packet. No connected network or static route on ${router.name} covers ${dst.ip}, and there is no default route.`, 'Add a static or default route on that router (the tool\'s routes are fixed, so check the destination).', { router: router.id }));
    }
    const egress = rt.best.iface;
    hop.egress = egress.id;
    if (origin && pkt.srcIp === null) { pkt.srcIp = pgParseIPv4(egress.ip); res.srcIface = egress; }
    steps.push({ ok: true, text: `${pgAclRouteText(router, dst.ip, rt, egress)}${origin && !egress.aclOut ? ` Its source address is the outgoing interface address ${egress.ip}.` : ''}${egress.aclOut ? '' : ' No outbound ACL is applied there.'}` });
    if (egress.aclOut) {
      if (origin) {
        steps.push({ ok: true, text: `${egress.name} has outbound ACL ${egress.aclOut}, but an outbound ACL does not filter packets that the router creates itself, only traffic passing through. (The source address is the outgoing interface address ${egress.ip}.)` });
        hop.out = { state: 'skipped', acl: egress.aclOut };
        consulted.push({ router: router.id, iface: egress.id, dir: 'out', acl: egress.aclOut, entryId: null, implicit: false, empty: false, action: 'skipped', leg });
      } else if (apply(router, egress, 'out', hop) === 'deny') return res;
    }
    if (rt.best.kind === 'connected') {
      if (dst.kind === 'host') {
        steps.push({ ok: true, text: `${dst.name} (${dst.ip}) is on that network, so the packet is delivered.` });
        res.delivered = true;
        return res;
      }
      router = dst.router; ingress = dst.iface; origin = false;
      steps.push({ ok: true, text: `${dst.ip} is the address of ${dst.name}, on that same network.` });
    } else {
      const nh = pgAclIfaceByIp(topo, rt.best.via);
      if (!nh) {
        steps.push({ ok: false, text: `The next hop ${pgIpToString(rt.best.via)} is not a router, so nobody forwards the packet any further.` });
        return stop(pgAclFail('no-next-hop', `Nothing forwards the packet from ${pgIpToString(rt.best.via)}`, `The route points at ${pgIpToString(rt.best.via)}, which is not an interface of another router in this network.`, 'Point the route at the neighbouring router\'s interface address.', { router: router.id }));
      }
      router = nh.router; ingress = nh.iface; origin = false;
      steps.push({ ok: true, text: `The next hop ${pgIpToString(rt.best.via)} is ${nh.router.name} ${nh.iface.name}.` });
    }
  }
  steps.push({ ok: false, text: 'The packet has crossed more routers than this network has: it is going round in a loop.' });
  return stop(pgAclFail('routing-loop', 'The packet loops between routers', 'Two routes send the packet back and forth, so it never arrives.', 'Check the routes on each router.', {}));
}

/* ---- diagnosis for a packet an ACL dropped ---- */

function pgAclBlockDiag(bl, pkt, leg) {
  const { router, iface, dir, acl, ev } = bl;
  const where = `${router.name} ${iface.name} ${pgAclDirWord(dir)}`;
  const e = ev.entry;
  const line = e ? `entry ${e.seq} (${pgAclEntryText(acl.kind, e)})` : null;
  const extra = { router: router.id, iface: iface.id, dir, acl: acl.name, entryId: e ? e.id : null, leg, field: `${iface.id}.${dir}` };
  const onlyDeny = !ev.list.some((x) => x.action === 'permit');
  const srcText = pkt.srcIp === null ? '' : pgIpToString(pkt.srcIp);
  if (leg === 'reply') {
    const why = e ? `${line} of ACL ${acl.name} drops it` : `no entry in ACL ${acl.name} permits it, so the invisible final deny drops it`;
    let fixText;
    if (pkt.proto === 'tcp') fixText = `Permit the reply with an entry above the one that drops it: permit tcp ... established lets through TCP packets that have the ACK or RST bit set (every reply has it, a first SYN does not), or permit the server's port as the source port (for example eq ${pkt.srcPort}).`;
    else if (pkt.proto === 'udp') fixText = `Permit the reply explicitly with an entry above the one that drops it, matching the server's port as the SOURCE port (eq ${pkt.srcPort}); UDP has no established keyword.`;
    else if (pkt.proto === 'icmp') fixText = 'Permit the reply explicitly with an entry above the one that drops it: permit icmp ... echo-reply.';
    else fixText = 'Permit the reply explicitly with an entry above the one that drops it.';
    return pgAclFail('reply-blocked', 'The request gets through, the reply does not', `The request was delivered, but the reply is a separate packet and meets the ACLs again on its way back. At ${where}, ${why}. ACLs are stateless: a router does not remember that this reply belongs to a connection it allowed, so an ACL that blocks that direction blocks replies too.`, fixText, extra);
  }
  if (e) {
    const later = ev.list.slice(ev.index + 1).find((x) => x.action === 'permit' && pgAclEntryMatches(acl, x, pkt) && pgAclEntrySubset(acl, x, e));
    if (later) return pgAclFail('shadowed-permit', `Entry ${later.seq} never gets a chance`, `At ${where}, ACL ${acl.name} drops the packet with ${line}. Entry ${later.seq} (${pgAclEntryText(acl.kind, later)}) is a narrower rule that would permit it, but entries are read from the lowest sequence number up and the first match wins, so the broad deny is read first.`, `Give entry ${later.seq} a sequence number below ${e.seq} (or move it above), so the specific permit comes before the broad deny.`, extra);
    if (acl.kind === 'standard' && e.action === 'deny') return pgAclFail('standard-acl-broad', `Standard ACL ${acl.name} drops everything from this source`, `At ${where}, ${line} matches the source address ${srcText}. A standard ACL can only look at the source address: it cannot tell where the packet is going, so every packet from that source that crosses this interface in this direction is dropped, whatever its destination.`, 'If you only meant to keep this source away from one place, apply the standard ACL on the interface closest to that destination (standard ACLs go near the destination), or use an extended ACL that names the destination, near the source.', extra);
    return pgAclFail('explicit-deny', `Entry ${e.seq} of ${acl.name} denies it`, `At ${where}, ACL ${acl.name} reads ${line}: it is the first entry that matches this packet, and it is a deny. Entries after it are never read.`, `If this traffic should get through, put a more specific permit above entry ${e.seq}, or narrow entry ${e.seq}. If it should be blocked, this is the ACL working.`, extra);
  }
  const mentions = ev.list.some((x) => { const s = pgAclParseAddr(x.src, acl.kind); return s.ok && pgAclAddrMatch(s, pkt.srcIp); });
  const hint = !mentions && ev.list.length ? ` None of its entries even mentions the source address ${srcText}, so check that ${acl.name} is applied to the interface you meant.` : '';
  const onlyDenyNote = onlyDeny ? ` Every entry in ${acl.name} is a deny, so nothing at all can pass through it.` : '';
  const permitExample = acl.kind === 'standard' ? 'permit any' : 'permit ip any any';
  return pgAclFail('implicit-deny', `Nothing in ${acl.name} permits it`, `At ${where}, no entry of ACL ${acl.name} matches the packet, so the invisible last line of every ACL, ${acl.kind === 'standard' ? 'deny any' : 'deny ip any any'}, drops it.${onlyDenyNote}${hint}`, `Add a permit entry for this traffic, for example ${permitExample} at the end if everything not denied above should be allowed.`, extra);
}

/* ---- observations that are not failures ---- */

// ACLs on the routers a delivered packet crossed that would have denied it but never saw it
function pgAclOffPath(topo, fwd) {
  const out = []; const seen = {};
  fwd.hops.forEach((h) => {
    if (seen[h.router]) return;
    seen[h.router] = true;
    const router = pgAclRouter(topo, h.router);
    const here = fwd.hops.filter((x) => x.router === router.id);
    (router.acls || []).forEach((acl) => {
      if (fwd.consulted.some((c) => c.router === router.id && c.acl === acl.name)) return;
      const ev = pgAclEval(acl, fwd.pkt);
      if (ev.action !== 'deny') return;
      // an ACL whose entries never mention this packet's source or destination has nothing to do with it
      if (ev.implicit && !ev.list.some((x) => { const a = pgAclParseAddr(x.src, acl.kind); const d = acl.kind === 'extended' ? pgAclParseAddr(x.dst, acl.kind) : null; return (a.ok && pgAclAddrMatch(a, fwd.pkt.srcIp)) || (d && d.ok && pgAclAddrMatch(d, fwd.pkt.dstIp)); })) return;
      const apps = [];
      (router.interfaces || []).forEach((i) => { if (i.aclIn === acl.name) apps.push({ iface: i, dir: 'in' }); if (i.aclOut === acl.name) apps.push({ iface: i, dir: 'out' }); });
      const what = ev.entry ? `Entry ${ev.entry.seq} (${pgAclEntryText(acl.kind, ev.entry)}) of ACL ${acl.name}` : `The invisible final deny of ACL ${acl.name}`;
      const base = { router: router.id, acl: acl.name, entryId: ev.entry ? ev.entry.id : null };
      const tail = ' If this packet is meant to get through, that is fine. If you expected it to be blocked, this is why it is not.';
      if (!apps.length) {
        out.push({ ...base, code: 'acl-unused', title: `ACL ${acl.name} is not applied anywhere, so it never saw this packet`, text: `${what} would drop this packet. But an ACL does nothing until it is applied to an interface with ip access-group ${acl.name} in or out, and ${acl.name} is not applied to any interface.${tail}` });
        return;
      }
      const wrongDir = apps.find((a) => (a.dir === 'out' && here.some((x) => x.ingress === a.iface.id)) || (a.dir === 'in' && here.some((x) => x.egress === a.iface.id)));
      if (wrongDir) {
        const enters = wrongDir.dir === 'out';
        out.push({ ...base, code: 'acl-wrong-direction', title: `ACL ${acl.name} is applied ${pgAclDirWord(wrongDir.dir)} where this packet goes the other way`, text: `${what} would drop this packet. This packet ${enters ? 'arrives on' : 'leaves through'} ${router.name} ${wrongDir.iface.name}, but ${acl.name} is applied ${pgAclDirWord(wrongDir.dir)} there, and an ${pgAclDirWord(wrongDir.dir)} ACL only reads packets that ${wrongDir.dir === 'in' ? 'arrive on' : 'leave through'} the interface. For this packet it would have to be applied ${enters ? 'inbound' : 'outbound'}.${tail}` });
        return;
      }
      const a0 = apps[0];
      out.push({ ...base, code: 'acl-wrong-interface', title: `ACL ${acl.name} never saw this packet: it is applied to ${a0.iface.name}`, text: `${what} would drop this packet. ${acl.name} is applied ${pgAclDirWord(a0.dir)} on ${router.name} ${a0.iface.name}, and this packet does not cross that interface, so the ACL never reads it.${tail}` });
    });
  });
  return out;
}

// Entries that miss a packet only because a subnet mask was typed where a wildcard mask belongs
function pgAclMaskWarnings(topo, legs) {
  const out = []; const done = {};
  legs.forEach((lg) => {
    lg.consulted.forEach((c) => {
      if (c.action === 'skipped') return;
      const router = pgAclRouter(topo, c.router); const acl = pgAclFind(router, c.acl);
      if (!acl) return;
      const ev = pgAclEval(acl, lg.pkt);
      // only entries read before the one that decided the packet could have changed the outcome
      (ev.implicit ? ev.list : ev.list.slice(0, Math.max(ev.index, 0))).forEach((e) => {
        const key = `${router.id}|${acl.name}|${e.id}`;
        if (done[key] || pgAclEntryMatches(acl, e, lg.pkt)) return;
        const fx = pgAclFixedMask(acl, e);
        if (!fx || !pgAclEntryMatches(acl, fx, lg.pkt)) return;
        done[key] = true;
        const bad = ['src', 'dst'].map((f) => { const a = pgAclParseAddr(e[f], acl.kind); return a.ok && a.form === 'net' && pgAclMaskLike(a.wild) ? pgIpToString(a.wild) : null; }).filter(Boolean)[0];
        out.push({ code: 'wildcard-looks-like-mask', router: router.id, acl: acl.name, entryId: e.id, title: `Entry ${e.seq} of ${acl.name} has a subnet mask where a wildcard mask belongs`, text: `Entry ${e.seq} (${pgAclEntryText(acl.kind, e)}) writes ${bad}, which looks like a subnet mask. A wildcard mask is the inverse: a 1 bit means "ignore this bit", so ${bad} ignores the first octets and compares almost nothing of what you meant. The wildcard for the same addresses as that subnet mask is ${pgIpToString((~pgParseIPv4(bad)) >>> 0)}. With it, the entry would match this packet.` });
      });
    });
  });
  return out;
}

/* ---- one test: a packet and (optionally) its reply ---- */

// conn = { from, to, proto: 'tcp'|'udp'|'icmp'|'ip', port, ack (TCP only), srcPort (optional), reply (default true) }.
// from is a host id or a router id; to is a host id or a router interface id.
// -> { verdict: 'success'|'failed', summary, steps, hops, diagnosis, warnings, consulted }
function pgAclTest(topo, conn) {
  const steps = []; const hops = []; const warnings = []; const consulted = [];
  const make = (verdict, summary, diagnosis) => ({ verdict, summary, steps, hops, diagnosis: diagnosis || null, warnings, consulted });
  const bad = (diag) => make('failed', diag.title, diag);
  const src = pgAclEndpoint(topo, conn.from, 'src');
  const dst = pgAclEndpoint(topo, conn.to, 'dst');
  if (!src || !dst) return bad(pgAclFail('bad-pair', 'Pick a source and a destination', 'The test needs a sender and a receiver.', 'Choose both.', {}));
  if ((src.kind === 'host' && dst.kind === 'host' && src.host.id === dst.host.id) || (src.kind === 'router' && dst.kind === 'iface' && src.router.id === dst.router.id)) return bad(pgAclFail('bad-pair', 'Pick two different devices', 'A device talking to itself never leaves its own network stack, so no ACL is involved.', 'Pick a different destination.', {}));
  const proto = conn.proto;
  if (['tcp', 'udp', 'icmp', 'ip'].indexOf(proto) < 0) return bad(pgAclFail('bad-pair', 'Pick TCP, UDP or ICMP', 'The test packet needs a protocol.', 'Choose one.', {}));
  const hasPorts = proto === 'tcp' || proto === 'udp';
  const port = hasPorts ? Number(conn.port) : null;
  if (hasPorts && !(Number.isInteger(port) && port >= 1 && port <= 65535)) return bad(pgAclFail('bad-port', 'Not a valid port', 'A TCP or UDP port is a number from 1 to 65535.', 'Enter a port number.', {}));
  const problems = pgAclValidate(topo);
  if (problems.length) {
    const p = problems[0];
    steps.push({ ok: false, text: p.text });
    return bad(pgAclFail('bad-config', 'An ACL or setting is not valid', p.text, 'Correct the highlighted field and try again.', { router: p.router, acl: p.acl, entryId: p.entryId, field: p.field }));
  }

  const sp = Number(conn.srcPort);
  const customSrc = conn.srcPort !== undefined && conn.srcPort !== null && String(conn.srcPort).trim() !== '' && Number.isInteger(sp) && sp >= 0 && sp <= 65535;
  const srcPort = hasPorts ? (customSrc ? sp : PG_ACL_EPHEMERAL) : null;
  const reqPkt = { proto, srcIp: src.kind === 'host' ? src.ipN : null, dstIp: dst.ipN, srcPort, dstPort: port, ack: proto === 'tcp' && !!conn.ack, icmp: proto === 'icmp' ? 'echo' : null };
  const what = proto === 'icmp' ? 'a ping' : hasPorts ? `${proto.toUpperCase()} ${port}` : 'an IP packet';
  steps.push({ ok: true, text: `Request: ${src.name}${src.kind === 'host' ? ` (${src.ip})` : ''} sends ${what} to ${dst.name} (${dst.ip})${proto === 'tcp' ? (reqPkt.ack ? ', a packet with the ACK bit set (part of a connection that already exists)' : ', a connection request (SYN)') : ''}.` });
  const fwd = pgAclRunLeg(topo, src, dst, reqPkt, 'request');
  const legs = [fwd];
  steps.push(...fwd.steps); hops.push(...fwd.hops); consulted.push(...fwd.consulted);
  const finish = (verdict, summary, diag) => {
    pgAclMaskWarnings(topo, legs).forEach((w) => warnings.push(w));
    if (fwd.delivered) pgAclOffPath(topo, fwd).forEach((w) => warnings.push(w));
    warnings.splice(3);
    return make(verdict, summary, diag);
  };
  if (!fwd.delivered) {
    const diag = fwd.diagnosis || (fwd.blocked ? pgAclBlockDiag(fwd.blocked, fwd.pkt, 'request') : null);
    return finish('failed', diag ? diag.title : 'The packet did not arrive', diag);
  }
  if (conn.reply === false) return finish('success', `${src.name} reached ${dst.name} (${what}). The reply was not checked.`);

  // The reply is a new packet in the other direction: ports swapped, ACK set for TCP, echo reply for ping.
  const replySrc = dst.kind === 'host' ? { kind: 'host', host: dst.host, name: dst.name, ip: dst.ip, ipN: dst.ipN } : { kind: 'router', router: dst.router, name: `${dst.router.name} (the router itself)` };
  const srcIface = fwd.srcIface;
  const replyDst = src.kind === 'host' ? { kind: 'host', host: src.host, name: src.name, ip: src.ip, ipN: src.ipN }
    : { kind: 'iface', router: src.router, iface: srcIface, name: `${src.router.name} ${srcIface.name}`, ip: srcIface.ip, ipN: pgParseIPv4(srcIface.ip) };
  const repPkt = { proto, srcIp: dst.ipN, dstIp: replyDst.ipN, srcPort: hasPorts ? fwd.pkt.dstPort : null, dstPort: hasPorts ? fwd.pkt.srcPort : null, ack: proto === 'tcp', icmp: proto === 'icmp' ? 'echo-reply' : null };
  steps.push({ ok: true, text: `Reply: ${dst.name} answers with ${pgAclPktText(repPkt)}. ACLs are stateless, so this is a brand-new packet to every ACL on the way back.` });
  const rev = pgAclRunLeg(topo, replySrc, replyDst, repPkt, 'reply');
  legs.push(rev);
  steps.push(...rev.steps); hops.push(...rev.hops); consulted.push(...rev.consulted);
  if (!rev.delivered) {
    const diag = rev.diagnosis || (rev.blocked ? pgAclBlockDiag(rev.blocked, rev.pkt, 'reply') : null);
    return finish('failed', diag ? diag.title : 'The reply did not arrive', diag);
  }
  return finish('success', `${src.name} reached ${dst.name} (${what}) and the reply came back.`);
}

/* ---- the configuration as a router would print it ---- */

function pgAclConfigText(topo, routerId) {
  const r = pgAclRouter(topo, routerId);
  if (!r) return '';
  const L = [`hostname ${r.name}`, '!'];
  (r.interfaces || []).forEach((i) => {
    L.push(`interface ${pgAclLongName(i.name)}`);
    if (i.desc) L.push(` description ${i.desc}`);
    L.push(` ip address ${i.ip} ${pgIpToString(pgMaskFromPrefix(Number(i.prefix)))}`);
    if (i.aclIn) L.push(` ip access-group ${i.aclIn} in`);
    if (i.aclOut) L.push(` ip access-group ${i.aclOut} out`);
    L.push('!');
  });
  (r.routes || []).forEach((rt) => { L.push(`ip route ${rt.dest} ${pgIpToString(pgMaskFromPrefix(Number(rt.prefix)))} ${rt.via}`); });
  if ((r.routes || []).length) L.push('!');
  (r.acls || []).forEach((a) => {
    L.push(`ip access-list ${a.kind} ${a.name}`);
    pgAclSorted(a).forEach((e) => { L.push(` ${e.seq} ${pgAclEntryText(a.kind, e)}`); });
    L.push('!');
  });
  return L.join('\n');
}

/* ---- scenario fixes ---- */

// fix entries: { apply: { router, iface, dir: 'in'|'out', acl: ''|name } }, { setEntry: { router, acl, id, patch } },
//              { addEntry: { router, acl, entry } }, { removeEntry: { router, acl, id } },
//              { addAcl: { router, acl } }, { removeAcl: { router, name } }
function pgAclApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.apply) {
      const r = pgAclRouter(t, f.apply.router); const i = r && r.interfaces.find((x) => x.id === f.apply.iface);
      if (i) i[f.apply.dir === 'in' ? 'aclIn' : 'aclOut'] = f.apply.acl;
    } else if (f.setEntry) {
      const a = pgAclFind(pgAclRouter(t, f.setEntry.router), f.setEntry.acl); const e = a && a.entries.find((x) => x.id === f.setEntry.id);
      if (e) Object.assign(e, f.setEntry.patch);
    } else if (f.addEntry) {
      const a = pgAclFind(pgAclRouter(t, f.addEntry.router), f.addEntry.acl);
      if (a) a.entries.push({ ...f.addEntry.entry });
    } else if (f.removeEntry) {
      const a = pgAclFind(pgAclRouter(t, f.removeEntry.router), f.removeEntry.acl);
      if (a) a.entries = a.entries.filter((x) => x.id !== f.removeEntry.id);
    } else if (f.addAcl) {
      const r = pgAclRouter(t, f.addAcl.router);
      if (r) r.acls.push(pgClone(f.addAcl.acl));
    } else if (f.removeAcl) {
      const r = pgAclRouter(t, f.removeAcl.router);
      if (r) {
        r.acls = r.acls.filter((x) => x.name !== f.removeAcl.name);
        r.interfaces.forEach((i) => { if (i.aclIn === f.removeAcl.name) i.aclIn = ''; if (i.aclOut === f.removeAcl.name) i.aclOut = ''; });
      }
    }
  });
  return t;
}
