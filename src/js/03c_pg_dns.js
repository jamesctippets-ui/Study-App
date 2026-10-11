/* ---------------- IT Playground: DNS lab engine ---------------- */

// Pure simulation of DNS name resolution (no React, no DOM). It models what the
// CCNA and Security+ teach and says so: one zone (records A, AAAA, CNAME, MX,
// each with a TTL), one authoritative server, caching resolvers that clients use
// (a resolver keeps each record until its TTL runs out, and keeps "no such name"
// answers too: negative caching, RFC 2308), clients with a configured DNS server
// and an optional hosts file, a virtual clock, optional split-horizon (an
// internal view and a public view of the zone) and a simple hairpin switch.
//
// Left out on purpose: recursion from the root (the resolver simply asks the one
// authoritative server of the lab), other zones and names outside the zone,
// delegation, NS and SOA records (a single "negative TTL" stands for the SOA
// minimum), wildcard records, DNSSEC, EDNS, TCP fallback, retries, the
// browser's and the operating system's own caches (real clients cache too),
// round-robin ordering, and a resolver serving stale data while the server is
// down. A resolver gives up on an alias chain after 8 steps here; real limits
// differ. Servers differ in what they do with an invalid zone: here the whole
// zone answers SERVFAIL.
//
// topo = {
//   zone:      { name, negativeTtl, records: [{ id, name, type, value, ttl, pref? }], internal: [same] },
//   auth:      { name, ip, online, splitHorizon },
//   resolvers: [{ id, name, ip, online, upstream: 'auth' | '', network: 'internal' | 'external' }],
//   clients:   [{ id, name, network, dns, hosts: [{ name, ip }] }],
//   machines:  [{ id, name, ips: [], serves: [fqdn] }],      // the real devices behind the addresses
//   hairpin:   false,                                          // can inside clients reach an inside server by its public address?
// }
// A record name is relative to the zone ('@' or '' is the apex, 'www'); a trailing dot makes it absolute.
// state = { now (seconds), caches: { <resolverId>: { '<name>|<TYPE>': entry } }, log: [] }

const PG_DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX'];
const PG_DNS_MAX_CHAIN = 8;
const PG_DNS_MAX_TTL = 2147483647;

/* ---- small parsers and formatters ---- */

// A TTL as typed: plain seconds, or zone-file style units (30s, 5m, 1h, 1d, 1w, 1h30m). Returns seconds or null.
function pgDnsParseTtl(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= PG_DNS_MAX_TTL ? v : null;
  const t = String(v == null ? '' : v).trim().toLowerCase();
  if (!t) return null;
  if (/^\d+$/.test(t)) { const n = Number(t); return n <= PG_DNS_MAX_TTL ? n : null; }
  const m = t.match(/^(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return null;
  const total = (Number(m[1] || 0) * 604800) + (Number(m[2] || 0) * 86400) + (Number(m[3] || 0) * 3600) + (Number(m[4] || 0) * 60) + Number(m[5] || 0);
  return total <= PG_DNS_MAX_TTL ? total : null;
}

// 90 -> "1 min 30 s", 90061 -> "1 day 1 h" (the two largest units that are not zero).
function pgDnsDuration(sec) {
  let s = Math.max(0, Math.round(sec));
  if (s === 0) return '0 s';
  const units = [['day', 86400], ['h', 3600], ['min', 60], ['s', 1]];
  const parts = [];
  units.forEach(([name, size]) => {
    const n = Math.floor(s / size);
    s -= n * size;
    if (n > 0) parts.push(name === 'day' ? `${n} day${n === 1 ? '' : 's'}` : `${n} ${name}`);
  });
  return parts.slice(0, 2).join(' ');
}

function pgDnsLower(v) { return String(v == null ? '' : v).trim().toLowerCase(); }

function pgDnsLabelsOk(name) {
  if (!name || name.length > 253) return false;
  return name.split('.').every((l) => /^[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?$/.test(l));
}

function pgDnsIsIPv6(v) {
  const s = pgDnsLower(v);
  if (!/^[0-9a-f:]+$/.test(s) || s.indexOf(':') < 0) return false;
  const dbl = s.split('::');
  if (dbl.length > 2) return false;
  const groups = (part) => (part === '' ? [] : part.split(':'));
  const all = groups(dbl[0]).concat(dbl.length === 2 ? groups(dbl[1]) : []);
  if (!all.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return false;
  return dbl.length === 2 ? all.length <= 7 : all.length === 8;
}

function pgDnsIsPrivateV4(text) {
  const n = pgParseIPv4(text);
  if (n === null) return false;
  return (n >>> 24) === 10 || (n >>> 20) === 0xAC1 || (n >>> 16) === 0xC0A8;
}

// The owner name of a record: relative to the zone unless it ends with a dot or already ends with the zone name.
function pgDnsOwner(name, zone) {
  const z = pgDnsLower(zone).replace(/\.$/, '');
  const n = pgDnsLower(name);
  if (n === '' || n === '@') return z;
  if (n.endsWith('.')) return n.slice(0, -1);
  if (n === z || n.endsWith(`.${z}`)) return n;
  return `${n}.${z}`;
}

// The target of a CNAME or MX, or a queried name: a bare label is relative to the zone, anything with a dot is absolute.
function pgDnsTarget(value, zone) {
  const z = pgDnsLower(zone).replace(/\.$/, '');
  const n = pgDnsLower(value);
  if (n === '@') return z;
  if (n.endsWith('.')) return n.slice(0, -1);
  if (n.indexOf('.') < 0 && n !== '') return `${n}.${z}`;
  return n;
}

function pgDnsInZone(zone, name) {
  const z = pgDnsLower(zone).replace(/\.$/, '');
  return name === z || name.endsWith(`.${z}`);
}

// Strip the zone name for display: "www.example.com" -> "www", the apex -> "@".
function pgDnsShort(zone, name) {
  const z = pgDnsLower(zone).replace(/\.$/, '');
  if (name === z) return '@';
  return name.endsWith(`.${z}`) ? name.slice(0, -(z.length + 1)) : name;
}

/* ---- records and the zone ---- */

function pgDnsNormRecord(r, zone) {
  const type = String(r.type || '').toUpperCase();
  let value = String(r.value == null ? '' : r.value).trim();
  if (type === 'CNAME' || type === 'MX') value = pgDnsTarget(value, zone);
  else value = value.toLowerCase();
  const pref = type === 'MX' ? (r.pref === '' || r.pref == null ? 10 : Number(r.pref)) : null;
  return { id: r.id, owner: pgDnsOwner(r.name, zone), type, value, ttl: pgDnsParseTtl(r.ttl), pref };
}

// What is wrong with one record on its own? { field, text } or null.
function pgDnsRecordProblem(r, zone) {
  const n = pgDnsNormRecord(r, zone);
  if (!pgDnsLabelsOk(n.owner) || !pgDnsInZone(zone, n.owner)) return { field: 'name', text: `"${r.name}" is not a valid name inside ${pgDnsLower(zone)}.` };
  if (!PG_DNS_TYPES.includes(n.type)) return { field: 'type', text: `"${r.type}" is not a record type this lab knows (${PG_DNS_TYPES.join(', ')}).` };
  if (n.type === 'A' && pgParseIPv4(n.value) === null) return { field: 'value', text: `"${r.value}" is not an IPv4 address, so an A record cannot hold it.` };
  if (n.type === 'AAAA' && !pgDnsIsIPv6(n.value)) return { field: 'value', text: `"${r.value}" is not an IPv6 address, so an AAAA record cannot hold it.` };
  if ((n.type === 'CNAME' || n.type === 'MX') && !pgDnsLabelsOk(n.value)) return { field: 'value', text: `"${r.value}" is not a valid host name for a ${n.type} record.` };
  if (n.type === 'MX' && (!Number.isInteger(n.pref) || n.pref < 0 || n.pref > 65535)) return { field: 'pref', text: 'An MX preference is a whole number from 0 to 65535.' };
  if (n.ttl === null) return { field: 'ttl', text: `"${r.ttl}" is not a TTL. Use seconds (300) or units (5m, 1h, 1d).` };
  return null;
}

// Problems that make a server refuse the zone: bad values, a CNAME at the apex, a CNAME next to other records.
function pgDnsZoneIssues(topo, list) {
  const zone = pgDnsLower(topo.zone.name);
  const out = [];
  const norm = list.map((r) => pgDnsNormRecord(r, zone));
  norm.forEach((n) => {
    if (n.type === 'CNAME' && n.owner === zone) out.push({ code: 'cname-apex', recordId: n.id, field: 'type', text: `A CNAME at the zone apex (${zone}) is not allowed. The apex must also hold the zone's SOA and NS records, and a CNAME cannot share a name with any other record (RFC 1034 section 3.6.2, RFC 1912 section 2.4).` });
  });
  const byOwner = {};
  norm.forEach((n) => { (byOwner[n.owner] = byOwner[n.owner] || []).push(n); });
  Object.keys(byOwner).forEach((o) => {
    if (o === zone) return;
    const g = byOwner[o];
    const cn = g.filter((x) => x.type === 'CNAME');
    if (cn.length && g.length > 1) out.push({ code: 'cname-conflict', recordId: cn[0].id, field: 'type', text: `${o} has a CNAME and also ${cn.length > 1 ? 'another CNAME' : 'other records'}. A name that is an alias cannot hold any other data (RFC 1034 section 3.6.2, RFC 2181 section 10.1).` });
  });
  list.forEach((r) => { const p = pgDnsRecordProblem(r, zone); if (p) out.push({ code: 'bad-record', recordId: r.id, field: p.field, text: p.text }); });
  return out;
}

// The records a query from `network` is answered from.
function pgDnsView(topo, network) {
  return topo.auth && topo.auth.splitHorizon && network === 'internal' ? (topo.zone.internal || []) : topo.zone.records;
}

// What the authoritative server answers for (qname, qtype), following in-zone aliases. rrs is the answer section in order.
function pgDnsAuthLookup(topo, list, qname, qtype) {
  const zone = pgDnsLower(topo.zone.name);
  if (!pgDnsInZone(zone, qname)) return { rcode: 'REFUSED', kind: 'refused', rrs: [] };
  const issues = pgDnsZoneIssues(topo, list);
  if (issues.length) return { rcode: 'SERVFAIL', kind: 'invalid', issue: issues[0], rrs: [] };
  const norm = list.map((r) => pgDnsNormRecord(r, zone));
  const rrs = [];
  const seen = [];
  let cur = qname;
  for (let hop = 0; hop <= PG_DNS_MAX_CHAIN; hop += 1) {
    if (seen.includes(cur)) return { rcode: 'NOERROR', kind: 'loop', rrs, name: cur };
    if (hop === PG_DNS_MAX_CHAIN) return { rcode: 'NOERROR', kind: 'chain', rrs, name: cur };
    seen.push(cur);
    if (!pgDnsInZone(zone, cur)) return { rcode: 'NOERROR', kind: 'outside', rrs, name: cur };
    const here = norm.filter((n) => n.owner === cur);
    if (!here.length) {
      if (norm.some((n) => n.owner.endsWith(`.${cur}`))) return { rcode: 'NOERROR', kind: 'nodata', rrs, name: cur };
      return { rcode: 'NXDOMAIN', kind: 'nxdomain', rrs, name: cur };
    }
    const match = here.filter((n) => n.type === qtype);
    if (match.length) {
      const ttl = Math.min(...match.map((m) => m.ttl));
      match.forEach((m) => rrs.push({ id: m.id, name: cur, type: m.type, value: m.value, ttl, pref: m.pref }));
      return { rcode: 'NOERROR', kind: 'answer', rrs, name: cur };
    }
    const cn = here.find((n) => n.type === 'CNAME');
    if (cn && qtype !== 'CNAME') { rrs.push({ id: cn.id, name: cur, type: 'CNAME', value: cn.value, ttl: cn.ttl, pref: null }); cur = cn.value; continue; }
    return { rcode: 'NOERROR', kind: 'nodata', rrs, name: cur };
  }
  return { rcode: 'SERVFAIL', kind: 'chain', rrs, name: cur };
}

function pgDnsRrText(rr) {
  return `${rr.name}. ${rr.ttl} IN ${rr.type} ${rr.type === 'MX' ? `${rr.pref} ` : ''}${rr.type === 'CNAME' || rr.type === 'MX' ? `${rr.value}.` : rr.value}`;
}

function pgDnsFinalValues(rrs, qtype) {
  return rrs.filter((r) => r.type === qtype).map((r) => (r.type === 'MX' ? `${r.pref} ${r.value}` : r.value)).sort();
}

/* ---- state and the cache ---- */

function pgDnsNewState() { return { now: 0, caches: {}, log: [] }; }

function pgDnsCacheGet(st, resolverId, name, type) {
  const c = st.caches[resolverId];
  const e = c ? c[`${name}|${type}`] : null;
  return e && e.expires > st.now ? e : null;
}

function pgDnsCachePut(st, resolverId, entry) {
  if (!(entry.ttl > 0)) return;
  if (!st.caches[resolverId]) st.caches[resolverId] = {};
  st.caches[resolverId][entry.key] = Object.assign({ stored: st.now, expires: st.now + entry.ttl }, entry);
}

function pgDnsCacheRrs(st, resolverId, rrs, view) {
  const groups = {};
  rrs.forEach((r) => { (groups[`${r.name}|${r.type}`] = groups[`${r.name}|${r.type}`] || []).push(r); });
  Object.keys(groups).forEach((key) => {
    const g = groups[key];
    pgDnsCachePut(st, resolverId, { key, name: g[0].name, type: g[0].type, kind: 'rr', rrs: g.map((x) => ({ ...x })), ttl: Math.min(...g.map((x) => x.ttl)), view });
  });
}

// Live cache entries of one resolver, for the table in the screen: [{ key, name, type, kind, text, ttlLeft, ttl }]
function pgDnsCacheRows(st, resolverId) {
  const c = (st && st.caches && st.caches[resolverId]) || {};
  return Object.keys(c).map((k) => c[k]).filter((e) => e.expires > st.now).sort((a, b) => (a.name + a.type).localeCompare(b.name + b.type)).map((e) => ({
    key: e.key, name: e.name, type: e.type === '*' ? 'any' : e.type, kind: e.kind, ttl: e.ttl, ttlLeft: e.expires - st.now,
    text: e.kind === 'nxdomain' ? 'no such name (NXDOMAIN)' : e.kind === 'nodata' ? `no ${e.type} record` : e.rrs.map((r) => (r.type === 'MX' ? `${r.pref} ${r.value}` : r.value)).join(', '),
  }));
}

function pgDnsFlush(st0, resolverId) {
  const st = pgClone(st0);
  const ids = resolverId && resolverId !== '*' ? [resolverId] : Object.keys(st.caches);
  ids.forEach((id) => { st.caches[id] = {}; });
  return st;
}

// Moves the clock forward and drops the cache entries whose TTL ran out, logging each in time order.
function pgDnsAdvance(topo, st0, seconds) {
  const st = pgClone(st0);
  const target = st.now + Math.max(0, Math.round(seconds));
  const due = [];
  Object.keys(st.caches).forEach((rid) => {
    Object.keys(st.caches[rid]).forEach((k) => { const e = st.caches[rid][k]; if (e.expires <= target) due.push({ rid, k, e }); });
  });
  due.sort((a, b) => a.e.expires - b.e.expires || (a.rid + a.k).localeCompare(b.rid + b.k));
  const events = [];
  due.forEach(({ rid, k, e }) => {
    const res = (topo.resolvers || []).find((r) => r.id === rid);
    const text = `${res ? res.name : rid}: the cached ${e.kind === 'nxdomain' ? 'no-such-name answer' : e.kind === 'nodata' ? `no-${e.type}-record answer` : `${e.type} record`} for ${e.name} reached the end of its TTL (${pgDnsDuration(e.ttl)}) and was dropped. The next lookup asks the authoritative server again.`;
    const ev = { t: e.expires, resolver: rid, ok: true, text };
    events.push(ev);
    st.log.push(ev);
    delete st.caches[rid][k];
  });
  if (st.log.length > 200) st.log.splice(0, st.log.length - 200);
  st.now = target;
  return { state: st, events };
}

/* ---- resolving a name ---- */

function pgDnsEditDistance(a, b) {
  const m = a.length; const n = b.length;
  const d = [];
  for (let i = 0; i <= m; i += 1) { d.push([i]); }
  for (let j = 1; j <= n; j += 1) d[0][j] = j;
  for (let i = 1; i <= m; i += 1) for (let j = 1; j <= n; j += 1) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// A record whose name is a near miss of the one asked for ("helpdsk" for "helpdesk"), or null.
function pgDnsSuggest(topo, list, qname) {
  const zone = pgDnsLower(topo.zone.name);
  const want = pgDnsShort(zone, qname);
  let best = null;
  list.forEach((r) => {
    const own = pgDnsShort(zone, pgDnsOwner(r.name, zone));
    const dist = pgDnsEditDistance(want, own);
    if (own !== want && dist <= 2 && dist < want.length && (!best || dist < best.dist)) best = { name: own, recordId: r.id, dist };
  });
  return best;
}

// What the zone really says for this client's resolver (no cache, no hosts file). null when it cannot be known.
function pgDnsTruth(topo, client, qname, qtype) {
  const dns = String(client.dns == null ? '' : client.dns).trim();
  const res = (topo.resolvers || []).find((r) => r.ip === dns);
  const auth = topo.auth;
  let network;
  if (res) { if (res.upstream !== 'auth') return null; network = res.network; } else if (auth && auth.ip === dns) network = client.network; else return null;
  if (!auth || !auth.online) return null;
  const r = pgDnsAuthLookup(topo, pgDnsView(topo, network), qname, qtype);
  if (r.kind === 'invalid' || r.kind === 'refused') return null;
  return { rcode: r.rcode, kind: r.kind, values: r.kind === 'answer' ? pgDnsFinalValues(r.rrs, qtype) : [] };
}

function pgDnsResolveInto(topo, st, clientId, qnameRaw, qtype0) {
  const zone = pgDnsLower(topo.zone.name);
  const steps = [];
  const client = (topo.clients || []).find((c) => c.id === clientId);
  const qtype = String(qtype0 || 'A').toUpperCase();
  const qname = pgDnsTarget(qnameRaw, zone);
  const out = { client: clientId, name: qname, type: qtype, verdict: 'failed', rcode: null, summary: '', steps, diagnosis: null, answers: [], address: null, values: [], reached: null, source: null, fromCache: false, resolver: null, view: null };
  const fail = (code, title, text, fix, deviceId, field, rcode, extra) => {
    out.verdict = 'failed';
    out.rcode = rcode || out.rcode;
    out.diagnosis = Object.assign(pgFail(code, title, text, fix, deviceId, field), extra || {});
    out.summary = title;
    return out;
  };
  const step = (ok, text) => steps.push({ ok, text });
  if (!client) return fail('no-client', 'There is no such client', 'Pick a client that exists in this network.', 'Choose one of the clients.', null, null, null);
  if (!PG_DNS_TYPES.includes(qtype)) return fail('bad-query', `This lab does not look up ${qtype} records`, `The lab knows ${PG_DNS_TYPES.join(', ')} records.`, 'Pick A, AAAA, MX or CNAME.', clientId, null, null);
  if (!pgDnsLabelsOk(qname)) return fail('bad-query', `"${qnameRaw}" is not a valid host name`, 'A name is made of labels (letters, digits and hyphens) separated by dots.', 'Type a name such as www.example.com.', clientId, null, null);
  step(true, `${client.name} wants the ${qtype} record for ${qname}.`);
  if (!pgDnsInZone(zone, qname)) {
    step(false, `${qname} is not inside the zone ${zone}. This lab only simulates that one zone, so there is nothing to ask.`);
    return fail('out-of-zone', `${qname} is outside the lab's zone`, `This lab only knows the zone ${zone}. A real resolver would walk down from the root servers to find the right servers for any other name.`, `Ask for a name that ends in ${zone}.`, clientId, null, null);
  }
  const wantsAddress = qtype === 'A' || qtype === 'AAAA';
  let usedCache = false;
  let negativeHit = null;
  let finalRrs = null;
  let cachedEntries = [];

  /* 1. the hosts file is read before any DNS server */
  const hostsHit = (client.hosts || []).find((h) => pgDnsOwner(h.name, zone) === qname && ((qtype === 'A' && pgParseIPv4(h.ip) !== null) || (qtype === 'AAAA' && pgDnsIsIPv6(h.ip))));
  if (hostsHit) {
    out.source = 'hosts';
    step(true, `${client.name} first reads its hosts file (a local list of name-to-address lines). It has a line for ${qname}: ${hostsHit.ip}. The answer comes from the file and no DNS server is asked.`);
    out.answers = [{ name: qname, type: qtype, value: hostsHit.ip, ttl: null, pref: null, fromCache: false, fromHosts: true }];
    out.values = [hostsHit.ip];
    out.address = hostsHit.ip;
    out.rcode = 'NOERROR';
    const truth = pgDnsTruth(topo, client, qname, qtype);
    out.truth = truth;
    const differs = !!truth && ((truth.kind === 'answer' && !truth.values.includes(hostsHit.ip)) || truth.kind !== 'answer');
    if (differs) {
      const zoneSays = truth.kind === 'answer' ? `DNS itself would answer ${truth.values.join(', ')} for ${qname}` : `DNS itself has no ${qtype} answer for ${qname} (${truth.rcode})`;
      step(false, `${zoneSays}. The hosts file overrides it for this device only.`);
      // does the address from the file work anyway? Then it is only a warning; if not, it is the cause.
      const reach = pgDnsReach(topo, client, qname, qtype, [], hostsHit.ip);
      if (!reach.ok) {
        step(false, reach.stepText);
        return fail('hosts-override', `The hosts file overrides DNS for ${qname}`, `${client.name} uses ${hostsHit.ip} from its hosts file, but ${truth.kind === 'answer' ? `DNS says ${truth.values.join(', ')}` : `DNS has no ${qtype} answer for it`}. Every other device gets the DNS answer, so only this one behaves differently, and changing DNS never helps it.`, `Delete the ${qname} line from ${client.name}'s hosts file (or correct it).`, clientId, 'hosts', 'NOERROR', { hostsName: qname, hostsIp: hostsHit.ip });
      }
      out.warning = pgFail('hosts-override', `The hosts file overrides DNS for ${qname}`, `${client.name} reaches ${qname} only because of a line in its hosts file; DNS says something different. If the server moves, this device will not follow.`, `Delete the ${qname} line from the hosts file once DNS is right.`, clientId, 'hosts');
    }
  } else {
    step(true, `${client.name} first checks its hosts file: no line for ${qname}. It asks its DNS server.`);
  }

  if (!hostsHit) {
    /* 2. which DNS server is it */
    const dnsText = String(client.dns == null ? '' : client.dns).trim();
    if (!dnsText) {
      step(false, `${client.name} has no DNS server configured, so it has nobody to ask.`);
      return fail('wrong-dns-server', `${client.name} has no DNS server`, 'Without a DNS server address the client cannot turn names into addresses (pinging an address still works).', `Set ${client.name}'s DNS server to the resolver.`, clientId, 'client-dns', null);
    }
    const resolver = (topo.resolvers || []).find((r) => r.ip === dnsText);
    const auth = topo.auth || {};
    const direct = !resolver && auth.ip === dnsText;
    const goodResolvers = (topo.resolvers || []).filter((r) => r.network === client.network).map((r) => r.ip);
    if (!resolver && !direct) {
      step(false, `${client.name} sends the query to its DNS server ${dnsText}. Nothing at that address runs a DNS service, so no answer ever comes back and the lookup times out.`);
      return fail('wrong-dns-server', `Nothing answers at the DNS server address ${dnsText}`, `${client.name} is configured to use ${dnsText} for DNS, but no DNS server lives there. Lookups wait and then time out, which looks like "the internet is down" although pinging an address still works.`, `Set ${client.name}'s DNS server to ${goodResolvers[0] || 'the resolver'}${goodResolvers.length > 1 ? ` (or ${goodResolvers.slice(1).join(', ')})` : ''}.`, clientId, 'client-dns', 'TIMEOUT');
    }
    if (resolver && client.network === 'external' && resolver.network === 'internal') {
      step(false, `${client.name} is outside the network and sends the query to ${resolver.ip}, a private address. Private addresses are not routed on the Internet, so the query never arrives and the lookup times out.`);
      return fail('wrong-dns-server', `${client.name} cannot reach the DNS server ${dnsText}`, `${resolver.name} lives at a private address that only the inside network can reach. ${client.name} is outside, so its lookups time out.`, `Set ${client.name}'s DNS server to a resolver it can reach${goodResolvers.length ? ` (${goodResolvers.join(' or ')})` : ''}.`, clientId, 'client-dns', 'TIMEOUT');
    }
    if (direct) {
      out.source = 'authoritative';
      out.view = client.network;
      step(true, `${client.name} sends the query straight to ${auth.name || 'the authoritative server'} (${auth.ip}). An authoritative server answers from its own zone and keeps no cache.`);
      if (!auth.online) {
        step(false, `${auth.name || 'The authoritative server'} is switched off or its DNS service has stopped, so there is no answer.`);
        return fail('auth-down', 'The authoritative server does not answer', `${auth.name || 'The authoritative server'} is offline, so nothing can answer for the zone ${zone}.`, 'Bring the authoritative server back online.', 'auth', 'auth-online', 'TIMEOUT');
      }
      const view = pgDnsView(topo, client.network);
      const ar = pgDnsAuthLookup(topo, view, qname, qtype);
      return pgDnsFinish(topo, st, out, client, ar, null, steps, fail, step, { qname, qtype, view: client.network, wantsAddress, direct: true });
    }
    out.resolver = resolver.id;
    out.view = resolver.network;
    step(true, `${client.name} sends the query to its DNS server ${resolver.name} (${resolver.ip}).`);
    if (!resolver.online) {
      step(false, `${resolver.name} is switched off or its DNS service has stopped, so there is no answer and the lookup times out.`);
      return fail('resolver-down', `${resolver.name} does not answer`, `The DNS server ${resolver.name} (${resolver.ip}) is offline, so ${client.name} gets no answer to any lookup.`, `Bring ${resolver.name} back online, or point the client at another working resolver.`, resolver.id, 'resolver-online', 'TIMEOUT');
    }
    /* 3. the resolver: cache first, then the authoritative server */
    let cur = qname;
    const seen = [];
    let answered = false;
    for (let hop = 0; hop <= PG_DNS_MAX_CHAIN && !answered; hop += 1) {
      if (seen.includes(cur)) {
        step(false, `${cur} was already visited: the aliases lead back to it, so the chain never ends.`);
        const fresh = cachedEntries.length ? pgDnsAuthLookup(topo, pgDnsView(topo, resolver.network), qname, qtype) : null;
        if (fresh && fresh.kind === 'answer') {
          // the loop is only in the cache: the zone has been fixed since
          const oldest = cachedEntries.slice().sort((a, b) => a.expires - b.expires)[0];
          const left = oldest.expires - st.now;
          step(false, `The zone itself no longer loops (it now answers ${pgDnsFinalValues(fresh.rrs, qtype).join(', ')}), but the aliases ${resolver.name} cached earlier still point at each other, for another ${pgDnsDuration(left)}.`);
          return fail('stale-cache', `${resolver.name} still follows the old aliases`, `${client.name} gets a loop from ${resolver.name}'s cache, although the zone has been fixed. A resolver keeps each record for its whole TTL, here another ${pgDnsDuration(left)}, and does not ask the zone server again until it runs out.`, `Flush ${resolver.name}'s cache, or wait ${pgDnsDuration(left)}.`, resolver.id, 'ttl', 'SERVFAIL', { ttlLeft: left, zoneValues: pgDnsFinalValues(fresh.rrs, qtype) });
        }
        return fail('cname-loop', 'The alias records loop', `The CNAME records point at each other in a circle (${seen.concat(cur).join(' -> ')}), so the resolver can never reach an address and gives up.`, 'Break the loop: make the last name in the chain an A (or AAAA) record with an address.', 'auth', 'zone-records', 'SERVFAIL', { loop: seen.concat(cur) });
      }
      if (hop === PG_DNS_MAX_CHAIN) {
        step(false, `After ${PG_DNS_MAX_CHAIN} aliases ${resolver.name} gives up.`);
        return fail('cname-chain', 'The alias chain is too long', `Each CNAME costs one more lookup, and a resolver gives up on a long chain (the lab stops after ${PG_DNS_MAX_CHAIN}).`, 'Shorten the chain: point the first name straight at the final name.', 'auth', 'zone-records', 'SERVFAIL', { loop: seen });
      }
      seen.push(cur);
      const nx = pgDnsCacheGet(st, resolver.id, cur, '*');
      const typed = pgDnsCacheGet(st, resolver.id, cur, qtype);
      const cnamed = qtype !== 'CNAME' ? pgDnsCacheGet(st, resolver.id, cur, 'CNAME') : null;
      if (nx) {
        usedCache = true; negativeHit = nx;
        step(true, `${resolver.name} checks its cache for ${cur}: it remembers that the name does not exist (NXDOMAIN), for another ${pgDnsDuration(nx.expires - st.now)}. It answers from the cache without asking anyone.`);
        out.rcode = 'NXDOMAIN';
        answered = true;
        finalRrs = [];
      } else if (typed && typed.kind === 'nodata') {
        usedCache = true; negativeHit = typed;
        step(true, `${resolver.name} checks its cache for ${cur} ${qtype}: it remembers that the name has no ${qtype} record, for another ${pgDnsDuration(typed.expires - st.now)}.`);
        out.rcode = 'NOERROR';
        answered = true;
        finalRrs = [];
      } else if (typed && typed.kind === 'rr') {
        usedCache = true; cachedEntries.push(typed);
        const left = typed.expires - st.now;
        step(true, `${resolver.name} checks its cache for ${cur} ${qtype}: found ${typed.rrs.map((r) => (r.type === 'MX' ? `${r.pref} ${r.value}` : r.value)).join(', ')}, with ${pgDnsDuration(left)} of its ${pgDnsDuration(typed.ttl)} TTL left. It answers from the cache.`);
        finalRrs = (finalRrs || []).concat(typed.rrs.map((r) => ({ ...r, ttl: left, cached: true })));
        answered = true;
      } else if (cnamed && cnamed.kind === 'rr') {
        usedCache = true; cachedEntries.push(cnamed);
        const left = cnamed.expires - st.now;
        step(true, `${resolver.name} checks its cache for ${cur}: it holds the alias ${cur} CNAME ${cnamed.rrs[0].value} (${pgDnsDuration(left)} of TTL left) and follows it.`);
        finalRrs = (finalRrs || []).concat(cnamed.rrs.map((r) => ({ ...r, ttl: left, cached: true })));
        cur = cnamed.rrs[0].value;
      } else {
        step(true, `${resolver.name} checks its cache for ${cur} ${qtype}: nothing (or its TTL ran out). It must ask the authoritative server.`);
        if (resolver.upstream !== 'auth' || !auth.name) {
          step(false, `${resolver.name} has no forwarder or other path that leads to the authoritative server of ${zone}, so it cannot get an answer and replies SERVFAIL.`);
          return fail('wrong-dns-server', `${resolver.name} cannot resolve ${zone}`, `${client.name} reached its resolver, but the resolver does not know where to ask about ${zone} (no forwarder to the authoritative server), so it answers SERVFAIL. A DNS server that cannot find the zone looks just like a broken zone to the client.`, `Point ${client.name} at a resolver that can reach the zone, or give ${resolver.name} an upstream (forwarder) to the authoritative server.`, resolver.id, 'upstream', 'SERVFAIL');
        }
        if (!auth.online) {
          step(false, `${resolver.name} asks ${auth.name} (${auth.ip}) and gets no answer: the authoritative server is switched off or its DNS service has stopped.`);
          return fail('auth-down', 'The authoritative server does not answer', `${resolver.name} had nothing in its cache and could not reach ${auth.name}, so the answer is SERVFAIL. Names whose records are still cached keep working until their TTL ends.`, 'Bring the authoritative server back online.', 'auth', 'auth-online', 'SERVFAIL');
        }
        const viewName = auth.splitHorizon && resolver.network === 'internal' ? 'internal view' : 'public view';
        step(true, `${resolver.name} asks ${auth.name} (${auth.ip}) for ${cur} ${qtype}. ${auth.splitHorizon ? `The server uses its ${viewName} because the question comes from the ${resolver.network} network.` : ''}`.trim());
        const ar = pgDnsAuthLookup(topo, pgDnsView(topo, resolver.network), cur, qtype);
        return pgDnsFinish(topo, st, out, client, ar, resolver, steps, fail, step, { qname, qtype, view: resolver.network, wantsAddress, prefix: finalRrs || [], usedCache, cachedEntries, viewName });
      }
    }
    /* answered from the cache */
    out.fromCache = true;
    out.source = 'cache';
    return pgDnsFinishCached(topo, st, out, client, resolver, finalRrs || [], negativeHit, cachedEntries, steps, fail, step, { qname, qtype, wantsAddress });
  }
  /* answered by the hosts file and it agrees with DNS: check the connection */
  return pgDnsConnect(topo, out, client, qname, qtype, [], steps, fail, step);
}

// The authoritative answer arrived (resolver !== null: a resolver asked it, null: the client asked it directly).
function pgDnsFinish(topo, st, out, client, ar, resolver, steps, fail, step, ctx) {
  const zone = pgDnsLower(topo.zone.name);
  const prefix = ctx.prefix || [];
  const auth = topo.auth;
  out.rcode = ar.rcode;
  out.source = 'authoritative';
  const all = prefix.concat(ar.rrs.map((r) => ({ ...r })));
  const store = () => { if (resolver) pgDnsCacheRrs(st, resolver.id, ar.rrs, ctx.view); };
  if (ar.kind === 'invalid') {
    step(false, `${auth.name} refuses to serve the zone: ${ar.issue.text} Every question about ${zone} gets SERVFAIL.`);
    const code = ar.issue.code;
    const title = code === 'cname-apex' ? 'A CNAME at the zone apex is not allowed' : code === 'cname-conflict' ? 'A CNAME shares its name with other records' : 'A record in the zone is not valid';
    return fail(code, title, `${ar.issue.text} A server that loads the zone refuses it (or answers SERVFAIL), so the whole zone stops resolving.`, code === 'cname-apex' ? 'Replace the CNAME at the apex with an A (or AAAA) record holding the address. Some DNS providers offer a proprietary alias or flattening record for this, but it is not standard DNS.' : code === 'cname-conflict' ? 'Keep either the CNAME or the other records at that name, not both.' : 'Correct the highlighted record.', 'auth', 'zone-records', 'SERVFAIL', { recordId: ar.issue.recordId, recordField: ar.issue.field });
  }
  if (ar.kind === 'loop' || ar.kind === 'chain') {
    ar.rrs.forEach((r) => step(true, `${auth.name} answers: ${pgDnsRrText(r)}`));
    store();
    if (ar.kind === 'loop') {
      step(false, `The aliases lead back to ${ar.name}: the chain loops and never reaches an address.`);
      return fail('cname-loop', 'The alias records loop', `The CNAME records point at each other in a circle, ending back at ${ar.name}. The resolver can never reach an address and gives up (SERVFAIL).`, 'Break the loop: make the last name in the chain an A (or AAAA) record with an address.', 'auth', 'zone-records', 'SERVFAIL', { loop: all.map((r) => r.name).concat(ar.name) });
    }
    step(false, `The chain is longer than ${PG_DNS_MAX_CHAIN} aliases; the resolver gives up.`);
    return fail('cname-chain', 'The alias chain is too long', `Each CNAME costs one more lookup, and a resolver gives up on a long chain (the lab stops after ${PG_DNS_MAX_CHAIN}).`, 'Shorten the chain: point the first name straight at the final name.', 'auth', 'zone-records', 'SERVFAIL', { loop: all.map((r) => r.name) });
  }
  if (ar.kind === 'outside') {
    ar.rrs.forEach((r) => step(true, `${auth.name} answers: ${pgDnsRrText(r)}`));
    step(false, `The alias leads to ${ar.name}, outside the lab's zone. A real resolver would continue the lookup with other servers; this lab stops here.`);
    return fail('out-of-zone', 'The alias leads outside the lab', `The CNAME ends at ${ar.name}, which this lab cannot resolve (it simulates only ${zone}).`, 'Point the alias at a name inside the zone.', 'auth', 'zone-records', 'NOERROR');
  }
  if (ar.kind === 'nxdomain') {
    ar.rrs.forEach((r) => step(true, `${auth.name} answers: ${pgDnsRrText(r)}`));
    step(false, `${auth.name} answers NXDOMAIN: the name ${ar.name} does not exist in the zone.`);
    if (resolver) {
      const nttl = pgDnsParseTtl(topo.zone.negativeTtl);
      if (nttl > 0) {
        pgDnsCachePut(st, resolver.id, { key: `${ar.name}|*`, name: ar.name, type: '*', kind: 'nxdomain', rrs: [], ttl: nttl, view: ctx.view });
        step(true, `${resolver.name} caches that "no such name" answer for ${pgDnsDuration(nttl)} (the negative TTL, RFC 2308), so repeated questions are answered without asking again.`);
      }
      store();
    }
    return pgDnsNxdomain(topo, out, client, ar, ctx, fail);
  }
  if (ar.kind === 'nodata') {
    ar.rrs.forEach((r) => step(true, `${auth.name} answers: ${pgDnsRrText(r)}`));
    step(false, `${auth.name} answers NOERROR with no data: the name ${ar.name} exists, but it has no ${ctx.qtype} record.`);
    if (resolver) {
      const nttl = pgDnsParseTtl(topo.zone.negativeTtl);
      if (nttl > 0) pgDnsCachePut(st, resolver.id, { key: `${ar.name}|${ctx.qtype}`, name: ar.name, type: ctx.qtype, kind: 'nodata', rrs: [], ttl: nttl, view: ctx.view });
      store();
    }
    return fail('nodata', `${ar.name} has no ${ctx.qtype} record`, `The name exists, but there is nothing of type ${ctx.qtype} at it. ${ctx.qtype === 'AAAA' ? 'Clients that only try IPv6 fail; most also try IPv4 (an A record).' : ''}`.trim(), `Add a ${ctx.qtype} record for ${ar.name}, or look up a type that exists.`, 'auth', 'zone-records', 'NOERROR', { recordName: ar.name });
  }
  if (ar.kind === 'refused') return fail('out-of-zone', 'The name is outside the zone', 'This server only answers for its own zone.', 'Ask for a name inside the zone.', 'auth', null, 'REFUSED');
  /* a good answer */
  ar.rrs.forEach((r) => step(true, `${auth.name} answers: ${pgDnsRrText(r)}`));
  if (resolver) {
    store();
    step(true, `${resolver.name} stores ${ar.rrs.length === 1 ? 'the record' : 'each record'} in its cache for its own TTL (${Array.from(new Set(ar.rrs.map((r) => `${r.name} ${r.type}: ${pgDnsDuration(r.ttl)}`))).join('; ')}) and passes the answer to ${client.name}.`);
  }
  out.answers = all.map((r) => ({ id: r.id, name: r.name, type: r.type, value: r.value, ttl: r.ttl, pref: r.pref, fromCache: !!r.cached }));
  out.values = pgDnsFinalValues(all, ctx.qtype);
  out.rcode = 'NOERROR';
  if (prefix.length && ctx.usedCache) {
    // part of the chain came from the cache: is it still what the zone says?
    const tr = pgDnsAuthLookup(topo, pgDnsView(topo, ctx.view), ctx.qname, ctx.qtype);
    const tv = tr.kind === 'answer' ? pgDnsFinalValues(tr.rrs, ctx.qtype) : [];
    if (tr.kind === 'answer' && tv.join('|') !== out.values.join('|')) {
      const entry = ctx.cachedEntries.slice().sort((a, b) => a.expires - b.expires)[0];
      const left = entry ? entry.expires - st.now : 0;
      step(false, `Part of the chain came from ${resolver ? resolver.name : 'the'} cache and is out of date: the zone now says ${tv.join(', ')}. The cached alias stays valid for ${pgDnsDuration(left)}.`);
      return fail('stale-cache', `${resolver.name} follows an old alias`, `${client.name} got ${out.values.join(', ')}, but the zone now says ${tv.join(', ')}. ${resolver.name} still holds an older record of the chain for ${pgDnsDuration(left)} and keeps following it.`, `Flush ${resolver.name}'s cache, or wait ${pgDnsDuration(left)}. Lower TTLs before changing records.`, resolver.id, 'ttl', 'NOERROR', { ttlLeft: left, cachedValues: out.values, zoneValues: tv });
    }
  }
  return pgDnsConnect(topo, out, client, ctx.qname, ctx.qtype, all, steps, fail, step);
}

function pgDnsNxdomain(topo, out, client, ar, ctx, fail) {
  const zone = pgDnsLower(topo.zone.name);
  const list = pgDnsView(topo, ctx.view);
  const publicHas = topo.auth && topo.auth.splitHorizon && ctx.view === 'internal' && (topo.zone.records || []).some((r) => pgDnsOwner(r.name, zone) === ar.name);
  if (publicHas) {
    return fail('split-horizon', `The internal view has no record for ${ar.name}`, `${ar.name} exists in the public zone, but split-horizon DNS gives internal clients a separate zone, and that one has no ${ctx.qtype} record for it. Internal clients get NXDOMAIN while everyone outside gets an answer. An internal view must contain every name the inside needs, not only the ones that differ.`, `Add ${ar.name} to the internal view (with the inside address).`, 'auth', 'internal-records', 'NXDOMAIN', { recordName: ar.name });
  }
  const sug = pgDnsSuggest(topo, list, ar.name);
  return fail('nxdomain', `No such name: ${ar.name}`, `The authoritative server says ${ar.name} does not exist. ${sug ? `The zone has a record called "${sug.name}", which looks like a typo for "${pgDnsShort(zone, ar.name)}". ` : ''}Applications report this as "server not found" or "host not found".`, sug ? `Rename the record "${sug.name}" to "${pgDnsShort(zone, ar.name)}".` : `Add a record for ${ar.name} (or fix the name that is being looked up).`, 'auth', 'zone-records', 'NXDOMAIN', sug ? { recordId: sug.recordId, suggestion: sug.name } : {});
}

// Answered from the resolver's cache only (nothing was sent to the authoritative server).
function pgDnsFinishCached(topo, st, out, client, resolver, rrs, negativeHit, cachedEntries, steps, fail, step, ctx) {
  const auth = topo.auth || {};
  const zone = pgDnsLower(topo.zone.name);
  const truthR = auth.online && resolver.upstream === 'auth' ? pgDnsAuthLookup(topo, pgDnsView(topo, resolver.network), ctx.qname, ctx.qtype) : null;
  const truthOk = truthR && truthR.kind !== 'invalid' && truthR.kind !== 'refused';
  const truthValues = truthOk && truthR.kind === 'answer' ? pgDnsFinalValues(truthR.rrs, ctx.qtype) : [];
  if (negativeHit) {
    out.rcode = negativeHit.kind === 'nxdomain' ? 'NXDOMAIN' : 'NOERROR';
    const name = negativeHit.name;
    if (truthOk && truthR.kind === 'answer') {
      const left = negativeHit.expires - st.now;
      step(false, `The zone has an answer for ${ctx.qname} now (${truthValues.join(', ')}), but ${resolver.name} still holds the earlier "no" in its cache.`);
      return fail('negative-cache', `${resolver.name} still remembers that ${name} did not exist`, `${ctx.qname} exists now (${truthValues.join(', ')}), but ${resolver.name} cached the earlier failure (negative caching, RFC 2308) and will keep answering "no" for another ${pgDnsDuration(left)}. Fixing the zone does not change a cached answer.`, `Flush ${resolver.name}'s cache, or wait ${pgDnsDuration(left)}. To avoid this next time, keep the zone's negative TTL low and add records before announcing them.`, resolver.id, 'negative-ttl', out.rcode, { ttlLeft: left, zoneValues: truthValues });
    }
    step(false, `${negativeHit.kind === 'nxdomain' ? `${name} does not exist (cached answer).` : `${name} has no ${ctx.qtype} record (cached answer).`}`);
    if (negativeHit.kind === 'nxdomain') {
      const sug = truthOk ? pgDnsSuggest(topo, pgDnsView(topo, resolver.network), name) : null;
      return fail('nxdomain', `No such name: ${name}`, `${resolver.name} answered NXDOMAIN from its cache (the zone really has no ${name}). ${sug ? `The zone has a record called "${sug.name}", which looks like a typo. ` : ''}`.trim(), sug ? `Rename the record "${sug.name}" to "${pgDnsShort(zone, name)}".` : `Add a record for ${name}.`, 'auth', 'zone-records', 'NXDOMAIN', sug ? { recordId: sug.recordId, suggestion: sug.name } : {});
    }
    return fail('nodata', `${name} has no ${ctx.qtype} record`, `${resolver.name} answered from its cache: the name exists but has no ${ctx.qtype} record.`, `Add a ${ctx.qtype} record for ${name}.`, 'auth', 'zone-records', 'NOERROR');
  }
  const values = pgDnsFinalValues(rrs, ctx.qtype);
  out.answers = rrs.map((r) => ({ id: r.id, name: r.name, type: r.type, value: r.value, ttl: r.ttl, pref: r.pref, fromCache: true }));
  out.values = values;
  out.rcode = 'NOERROR';
  if (truthOk && (truthR.kind !== 'answer' || values.join('|') !== truthValues.join('|'))) {
    const entry = cachedEntries.slice().sort((a, b) => a.expires - b.expires)[0];
    const left = entry ? entry.expires - st.now : 0;
    const now = truthR.kind === 'answer' ? truthValues.join(', ') : `nothing (${truthR.rcode})`;
    step(false, `${resolver.name} answered from its cache: ${values.join(', ') || 'no address'}. The zone now says ${now}. The cached copy is out of date, but it stays valid until its TTL ends in ${pgDnsDuration(left)}.`);
    return fail('stale-cache', `${resolver.name} answers with an old record`, `${client.name} got ${values.join(', ')} from ${resolver.name}'s cache, but the zone now says ${now}. A resolver keeps a record for its whole TTL and does not ask again until that runs out; here ${pgDnsDuration(left)} remain, so every client of this resolver keeps the old answer until then.`, `Flush ${resolver.name}'s cache, or wait ${pgDnsDuration(left)}. Next time, lower the record's TTL at least one old TTL before the change, change the record, then raise the TTL again.`, resolver.id, 'ttl', 'NOERROR', { ttlLeft: left, cachedValues: values, zoneValues: truthR.kind === 'answer' ? truthValues : [] });
  }
  step(true, `The cached answer is still correct: it matches what the zone says.`);
  return pgDnsConnect(topo, out, client, ctx.qname, ctx.qtype, rrs, steps, fail, step);
}

// Names a connection to `qname` may legitimately end up serving: the name asked for plus every alias in the chain.
function pgDnsChainNames(topo, client, qname, qtype, rrs) {
  const names = [qname];
  (rrs || []).forEach((r) => { names.push(r.name); if (r.type === 'CNAME') names.push(r.value); });
  const ar = pgDnsAuthLookup(topo, pgDnsView(topo, client.network), qname, qtype);
  (ar.rrs || []).forEach((r) => { names.push(r.name); if (r.type === 'CNAME') names.push(r.value); });
  return names.map((n) => pgDnsLower(n)).filter((n, i, all) => !!n && all.indexOf(n) === i);
}

// Can `client` use `address` for `qname`? { ok: true, machine } or { ok: false, stepText, code, title, text, fix, field, extra }.
function pgDnsReach(topo, client, qname, qtype, rrs, address) {
  const zone = pgDnsLower(topo.zone.name);
  const machines = topo.machines || [];
  const machine = machines.find((m) => (m.ips || []).includes(address));
  const names = pgDnsChainNames(topo, client, qname, qtype, rrs);
  const serves = (m) => (m.serves || []).map((x) => pgDnsOwner(x, zone));
  const owner = machines.find((m) => serves(m).some((x) => names.includes(x)));
  const recordId = ((rrs || []).find((r) => r.type === qtype) || {}).id;
  const ownerText = owner ? `Change the record so it holds ${owner.name}'s address (${(owner.ips || []).join(' or ')}).` : 'Correct the address in the record.';
  if (!machine) {
    return { ok: false, code: 'wrong-record', stepText: `${client.name} tries to connect to ${address} and nothing answers: no device has that address.`, title: `The record points at ${address}, where nothing lives`, text: `DNS answered with ${address}, a valid address, but no device uses it, so connections time out. The name resolves; the record itself is wrong.`, fix: ownerText, field: 'zone-records', extra: { address, recordId } };
  }
  if (owner && owner !== machine) {
    return { ok: false, code: 'wrong-record', stepText: `${client.name} connects to ${address}, which is ${machine.name}. It does not serve ${qname}.`, title: `${qname} points at the wrong machine`, text: `The answer ${address} belongs to ${machine.name}, which is not where ${qname} lives (${owner.name} is). The name resolves, but to the wrong place.`, fix: ownerText, field: 'zone-records', extra: { address, recordId } };
  }
  if (client.network === 'external' && qtype === 'A' && pgDnsIsPrivateV4(address)) {
    return { ok: false, code: 'split-horizon', stepText: `${address} is a private address; it is not reachable from the Internet, so ${client.name} cannot connect.`, title: 'An outside client was given a private address', text: `${client.name} is outside the network but DNS answered with the private address ${address}. Private addresses are not routed on the Internet. The inside view of the zone has leaked to the outside (or split-horizon DNS is missing).`, fix: 'Make outside clients get the public address: give them a separate (public) view of the zone, and keep private addresses in the internal view only.', field: 'split', extra: { address } };
  }
  const privateIp = (machine.ips || []).find((ip) => pgDnsIsPrivateV4(ip));
  if (client.network === 'internal' && qtype === 'A' && privateIp && !pgDnsIsPrivateV4(address) && !topo.hairpin) {
    return { ok: false, code: 'split-horizon', stepText: `${client.name} is inside the network and tries ${address}, the public address of ${machine.name}. The firewall does not send inside traffic out and back in (no hairpin NAT), so the connection fails.`, title: 'An inside client was given the public address of an inside server', text: `${client.name} should reach ${machine.name} directly at ${privateIp}, but DNS gave it the public address ${address}. Without hairpin NAT (NAT loopback) the firewall will not turn that traffic around. Split-horizon DNS solves it: inside clients get the inside address.`, fix: `Turn on split-horizon DNS and give the internal view a record with ${privateIp}.`, field: 'split', extra: { address } };
  }
  return { ok: true, machine };
}

// The client has an address (or other data): can it use it?
function pgDnsConnect(topo, out, client, qname, qtype, rrs, steps, fail, step) {
  if (qtype === 'MX' || qtype === 'CNAME') {
    out.verdict = 'success';
    out.summary = `${client.name} gets ${out.values.join(', ')} for the ${qtype} lookup of ${qname}.`;
    if (qtype === 'MX') step(true, 'A sending mail server would now look up the address of each mail host listed (lowest preference number first).');
    return out;
  }
  const address = out.values[0] || out.address;
  out.address = address;
  if (!address) return fail('nodata', `${qname} has no ${qtype} record`, 'The lookup returned no address.', 'Add the record.', 'auth', 'zone-records', 'NOERROR');
  const reach = pgDnsReach(topo, client, qname, qtype, rrs, address);
  if (!reach.ok) {
    step(false, reach.stepText);
    return fail(reach.code, reach.title, reach.text, reach.fix, 'auth', reach.field, 'NOERROR', reach.extra);
  }
  out.reached = { id: reach.machine.id, name: reach.machine.name };
  step(true, `${client.name} connects to ${address}: that is ${reach.machine.name}.`);
  out.verdict = 'success';
  out.summary = `${client.name} resolves ${qname} to ${address} (${out.source === 'cache' ? 'from the resolver cache' : out.source === 'hosts' ? 'from the hosts file' : 'fresh from the zone'}) and reaches ${reach.machine.name}.`;
  return out;
}

// One lookup for one client, on a copy of the state. The result carries the new state.
function pgDnsResolve(topo, st0, clientId, qname, qtype) {
  const st = pgClone(st0 || pgDnsNewState());
  const r = pgDnsResolveInto(topo, st, clientId, qname, qtype);
  r.state = st;
  return r;
}

/* ---- scenario goals ---- */

// A path is dot separated. Inside a list a segment is an index ("0") or "#id" (the item whose id is "id"), so a fix
// keeps working when the learner adds or removes other items: "zone.records.#www.value", "clients.#dave.hosts.0".
function pgDnsStepInto(cur, key) {
  if (cur == null) return undefined;
  if (Array.isArray(cur) && key.charAt(0) === '#') return cur.find((x) => x && x.id === key.slice(1));
  return cur[key];
}

function pgDnsSetPath(topo, path, value) {
  const t = pgClone(topo);
  const keys = String(path).split('.');
  let cur = t;
  for (let i = 0; i < keys.length - 1; i += 1) { cur = pgDnsStepInto(cur, keys[i]); if (cur == null) return t; }
  const last = keys[keys.length - 1];
  if (Array.isArray(cur) && last.charAt(0) === '#') {
    const idx = cur.findIndex((x) => x && x.id === last.slice(1));
    if (idx >= 0) cur[idx] = value;
  } else if (typeof cur === 'object') cur[last] = value;
  return t;
}

// fix entries: { path, value } sets a field, { push, value } appends to a list, { remove: 'path.0' } removes a list item.
function pgDnsApplyFixes(topo, fixes) {
  let t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.path !== undefined) t = pgDnsSetPath(t, f.path, pgClone(f.value));
    else if (f.push) {
      let cur = t;
      String(f.push).split('.').forEach((k) => { cur = pgDnsStepInto(cur, k); });
      if (Array.isArray(cur)) cur.push(pgClone(f.value));
    } else if (f.remove) {
      const keys = String(f.remove).split('.');
      const last = keys.pop();
      let cur = t;
      keys.forEach((k) => { cur = pgDnsStepInto(cur, k); });
      if (Array.isArray(cur)) {
        const idx = last.charAt(0) === '#' ? cur.findIndex((x) => x && x.id === last.slice(1)) : Number(last);
        if (idx >= 0 && idx < cur.length) cur.splice(idx, 1);
      }
    }
  });
  return t;
}

// goal = { client, name, type?, verdict, code?, answer?: [values], setup?: [{ path, value }],
//          script?: [{ do: 'query', client?, name?, type? } | { do: 'advance', minutes } | { do: 'edit', path, value } | { do: 'apply', fixes } | { do: 'flush', resolver? }] }
// The script plays out on a fresh clock; the last lookup is the one that is judged.
function pgDnsGoal(topo0, goal) {
  let topo = pgClone(topo0);
  (goal.setup || []).forEach((s) => { topo = pgDnsSetPath(topo, s.path, s.value); });
  let st = pgDnsNewState();
  const type = goal.type || 'A';
  (goal.script || []).forEach((s) => {
    if (s.do === 'query') st = pgDnsResolve(topo, st, s.client || goal.client, s.name || goal.name, s.type || type).state;
    else if (s.do === 'advance') st = pgDnsAdvance(topo, st, Math.round(s.minutes * 60)).state;
    else if (s.do === 'edit') topo = pgDnsSetPath(topo, s.path, s.value);
    else if (s.do === 'apply') topo = pgDnsApplyFixes(topo, s.fixes);
    else if (s.do === 'flush') st = pgDnsFlush(st, s.resolver);
  });
  const r = pgDnsResolve(topo, st, goal.client, goal.name, type);
  if (r.verdict === 'success' && goal.answer && goal.answer.slice().sort().join('|') !== r.values.slice().sort().join('|')) {
    r.verdict = 'failed';
    r.diagnosis = pgFail('wrong-record', 'The answer is not the one wanted', `The lookup returned ${r.values.join(', ') || 'nothing'}, but ${goal.answer.join(', ')} was wanted.`, 'Correct the record or the view that answers this client.', 'auth', 'zone-records');
    r.summary = r.diagnosis.title;
  }
  r.topo = topo;
  return r;
}
