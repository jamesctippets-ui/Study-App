/* ---------------- IT Playground: DHCP lab engine ---------------- */

// Pure simulation of DHCP for IPv4 (no React, no DOM). It models what the CCNA
// teaches and says so: one router, one DHCP server, DORA (Discover, Offer,
// Request, Acknowledge), the relay agent (ip helper-address) and its giaddr,
// scopes with an address pool, excluded addresses, a default-gateway option,
// a DNS option and a lease time, conflict detection (the server's ping and the
// client's ARP probe followed by DHCPDECLINE), and lease timers T1 (50%, renew
// by unicast), T2 (87.5%, rebind by broadcast) and expiry on a virtual clock.
//
// Left out on purpose: DHCP options other than mask, gateway, DNS and lease
// time; INIT-REBOOT; several servers, failover or split scopes; DHCP snooping;
// IPv6; retransmission timers (one attempt stands for the retries); the
// ten-second pause a client takes after DHCPDECLINE (the clock does not move);
// and overlapping scopes (the most specific scope simply wins here, while some
// real servers refuse to create them). Vendors differ in details such as
// whether conflict detection is on by default.
//
// topo = {
//   segments: [{ id, label }],
//   router:   { name, ifaces: [{ segment, ip, mask, helper }] },        // helper = relay target, '' = none
//   server:   { name, segment, ip, mask, online, conflictDetection,
//               scopes: [{ id, name, network, mask, start, end, excluded, gateway, dns, leaseHours }] },
//   dns:      ['10.0.0.53'],                                              // addresses that really answer DNS
//   hosts:    [{ id, name, segment, mode: 'dhcp'|'static', mac, probe, ip, mask, gateway }],
// }
// state = { now (seconds), leases: { <ip>: { mac, client, start, end } }, bad: { <ip>: true },
//           clients: { <id>: { phase, lease, duplicate, warnings, lastFailure, lastSteps } }, log: [] }

const PG_DHCP_MAX_ATTEMPTS = 6;

/* ---- small parsers and formatters ---- */

// A lease time in hours, as typed. Returns a number of hours or null.
function pgDhcpHours(v) {
  const n = typeof v === 'number' ? v : Number(String(v == null ? '' : v).trim());
  return Number.isFinite(n) && n >= 0.05 && n <= 24 * 365 ? n : null;
}

function pgDhcpDuration(sec) {
  const s = Math.round(sec);
  if (s <= 0) return '0 min';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const parts = [];
  if (d) parts.push(`${d} day${d === 1 ? '' : 's'}`);
  if (h) parts.push(`${h} h`);
  if (m) parts.push(`${m} min`);
  if (r && !d && !h) parts.push(`${r} s`);
  return parts.join(' ') || '0 min';
}

// "192.168.10.1, 192.168.10.20-192.168.10.30" -> { ranges: [{ lo, hi }], errors: [text] }
function pgDhcpParseExcluded(text) {
  const out = { ranges: [], errors: [] };
  const cleaned = String(text == null ? '' : text).replace(/\s*-\s*/g, '-');
  cleaned.split(/[,;\s]+/).filter(Boolean).forEach((tok) => {
    const parts = tok.split('-');
    const lo = pgParseIPv4(parts[0]);
    const hi = parts.length === 2 ? pgParseIPv4(parts[1]) : lo;
    if (parts.length > 2 || lo === null || hi === null || hi < lo) out.errors.push(tok);
    else out.ranges.push({ lo, hi });
  });
  return out;
}

// One scope, parsed. Everything the server needs from it.
function pgDhcpScope(scope) {
  const netIp = pgParseIPv4(scope.network);
  const m = pgParseMask(scope.mask);
  const errors = [];
  if (netIp === null) errors.push('network');
  if (m.prefix === undefined) errors.push('mask');
  const info = netIp !== null && m.prefix !== undefined ? pgSubnetInfo(netIp, m.prefix) : null;
  const startN = pgParseIPv4(scope.start);
  const endN = pgParseIPv4(scope.end);
  if (startN === null) errors.push('start');
  if (endN === null) errors.push('end');
  const hours = pgDhcpHours(scope.leaseHours);
  if (hours === null) errors.push('lease');
  const ex = pgDhcpParseExcluded(scope.excluded);
  if (ex.errors.length) errors.push('excluded');
  return {
    scope, info, prefix: m.prefix === undefined ? null : m.prefix, startN, endN, hours, excluded: ex.ranges, excludedErrors: ex.errors,
    gwN: pgParseIPv4(scope.gateway), dnsN: pgParseIPv4(scope.dns), errors,
    name: scope.name || scope.network || 'scope',
  };
}

// The usable part of the pool: the start-end range cut down to the scope's own network.
function pgDhcpPoolRange(sc) {
  if (!sc.info || sc.startN === null || sc.endN === null) return null;
  const lo = Math.max(sc.startN, sc.info.first);
  const hi = Math.min(sc.endN, sc.info.last);
  return lo <= hi ? { lo, hi } : null;
}

function pgDhcpExcludedAt(sc, n) {
  return sc.excluded.some((r) => n >= r.lo && n <= r.hi);
}

// How many addresses the pool can hand out (pool inside the network, minus exclusions).
function pgDhcpPoolSize(sc) {
  const r = pgDhcpPoolRange(sc);
  if (!r) return 0;
  const clipped = sc.excluded.map((e) => ({ lo: Math.max(e.lo, r.lo), hi: Math.min(e.hi, r.hi) })).filter((e) => e.lo <= e.hi).sort((a, b) => a.lo - b.lo);
  let removed = 0;
  let curLo = null;
  let curHi = null;
  clipped.forEach((e) => {
    if (curLo === null) { curLo = e.lo; curHi = e.hi; } else if (e.lo <= curHi + 1) curHi = Math.max(curHi, e.hi);
    else { removed += curHi - curLo + 1; curLo = e.lo; curHi = e.hi; }
  });
  if (curLo !== null) removed += curHi - curLo + 1;
  return r.hi - r.lo + 1 - removed;
}

function pgDhcpIface(topo, segId) {
  return ((topo.router && topo.router.ifaces) || []).find((f) => f.segment === segId) || null;
}

function pgDhcpSegLabel(topo, segId) {
  const s = (topo.segments || []).find((x) => x.id === segId);
  return s ? s.label : segId;
}

function pgDhcpHost(topo, id) { return (topo.hosts || []).find((h) => h.id === id) || null; }

// The hardware address the server keys its lease on (falls back to the id if none is typed).
function pgDhcpMac(host) { return String(host.mac || '').trim().toLowerCase() || host.id; }

// Who already owns this address on this segment (so a second owner is a duplicate)?
function pgDhcpOwner(topo, st, segId, ipN, exceptId) {
  const r = topo.router || {};
  if ((r.ifaces || []).some((f) => f.segment === segId && pgParseIPv4(f.ip) === ipN)) return { name: r.name || 'Router', kind: 'router', deviceId: 'router' };
  const s = topo.server || {};
  if (s.segment === segId && pgParseIPv4(s.ip) === ipN) return { name: s.name || 'DHCP server', kind: 'server', deviceId: 'server' };
  const hit = (topo.hosts || []).find((h) => {
    if (h.id === exceptId || h.segment !== segId) return false;
    if (h.mode === 'static' && pgParseIPv4(h.ip) === ipN) return true;
    const c = st && st.clients && st.clients[h.id];
    return !!(c && c.lease && (c.phase === 'bound' || c.phase === 'renewing' || c.phase === 'rebinding') && pgParseIPv4(c.lease.ip) === ipN);
  });
  return hit ? { name: hit.name, kind: hit.mode === 'static' ? 'static' : 'client', deviceId: hit.id } : null;
}

function pgDhcpNewState() { return { now: 0, leases: {}, bad: {}, clients: {}, log: [] }; }

function pgDhcpFindScope(topo, selectorN) {
  const all = ((topo.server && topo.server.scopes) || []).map(pgDhcpScope);
  // If scopes overlap (a wrong mask can do that) the most specific one wins; some real servers refuse overlapping scopes instead.
  const match = all.filter((s) => s.info && pgSameSubnet(s.info.network, s.prefix, selectorN)).sort((a, b) => b.prefix - a.prefix)[0] || null;
  return { match, all };
}

function pgDhcpScopeText(sc) {
  return sc.info ? `${sc.name} (${sc.info.networkText}/${sc.prefix})` : `${sc.name} (not a valid network)`;
}

function pgDhcpWith(base, extra) { return Object.assign(base, extra); }

/* ---- getting a message from the client to the server ---- */

// Does a client broadcast on `segId` reach the server (directly or through a relay)?
// Returns { ok, selectorN, steps, diagnosis }. `msg` is the message name used in the text.
function pgDhcpReachServer(topo, segId, msg, clientName) {
  const srv = topo.server || {};
  const steps = [];
  const srvN = pgParseIPv4(srv.ip);
  const segLabel = pgDhcpSegLabel(topo, segId);
  if (srvN === null) {
    return { ok: false, steps: [{ ok: false, text: `The DHCP server's own address (${srv.ip || 'blank'}) is not a valid IPv4 address.` }], diagnosis: pgDhcpWith(pgFail('bad-config', 'The DHCP server address is not valid', 'The server needs a valid IPv4 address before anything can reach it.', 'Enter the server address as four numbers, such as 10.0.0.5.', 'server', 'server-ip'), {}) };
  }
  if (segId === srv.segment) {
    steps.push({ ok: true, text: `${clientName} has no usable address yet, so it broadcasts ${msg} (source 0.0.0.0, destination 255.255.255.255, UDP 68 to 67). The DHCP server is on the same segment (${segLabel}), so it hears the broadcast directly.` });
    if (!srv.online) {
      steps.push({ ok: false, text: `${srv.name || 'The DHCP server'} is switched off or its DHCP service is stopped, so nobody answers.` });
      return { ok: false, steps, diagnosis: pgFail('server-down', 'The DHCP server does not answer', `${srv.name || 'The DHCP server'} is offline (powered off, unplugged or its DHCP service stopped), so the broadcast gets no reply.`, 'Bring the DHCP server back online. Until then clients with a valid lease keep working, and everyone else gets nothing.', 'server', 'server-online') };
    }
    return { ok: true, selectorN: srvN, via: 'same-segment', steps };
  }
  const iface = pgDhcpIface(topo, segId);
  const srvLabel = pgDhcpSegLabel(topo, srv.segment);
  steps.push({ ok: true, text: `${clientName} has no usable address yet, so it broadcasts ${msg} (source 0.0.0.0, destination 255.255.255.255, UDP 68 to 67). The DHCP server lives on a different segment (${srvLabel}), and a router never forwards broadcasts, so something must relay it.` });
  if (!iface) {
    steps.push({ ok: false, text: `There is no router interface on ${segLabel}, so the broadcast stays on the segment and nothing can relay it.` });
    return { ok: false, steps, diagnosis: pgDhcpWith(pgFail('no-relay', 'No router on this segment', `${segLabel} has no router interface, so its broadcasts cannot be relayed to the server on ${srvLabel}.`, 'Connect the segment to the router and configure a relay (ip helper-address) on that interface.', 'router', 'helper'), { segment: segId }) };
  }
  const helperText = String(iface.helper == null ? '' : iface.helper).trim();
  if (!helperText) {
    const wrongSide = (topo.router.ifaces || []).find((f) => f.segment !== segId && String(f.helper || '').trim());
    steps.push({ ok: false, text: `The router interface on ${segLabel} (${iface.ip}) has no relay (ip helper-address). The broadcast reaches the router, which does not forward it, so the DISCOVER dies here and the server never hears of it.` });
    if (wrongSide) steps.push({ ok: false, text: `A helper address (${wrongSide.helper}) is set on the interface facing ${pgDhcpSegLabel(topo, wrongSide.segment)}, but the clients' broadcasts arrive on the interface facing ${segLabel}. The relay has to sit on the client-facing interface.` });
    return { ok: false, steps, diagnosis: pgDhcpWith(pgFail('no-relay', 'The broadcast never crosses the router (no relay)', `${clientName}'s DHCPDISCOVER is a broadcast, and routers separate broadcast domains. With no relay agent on the router interface facing ${segLabel}, the request never reaches the DHCP server on ${srvLabel}.${wrongSide ? ' The helper address exists, but on the wrong interface.' : ''}`, `Configure a DHCP relay (ip helper-address ${srv.ip}) on the router interface facing ${segLabel}, the one the clients are connected to.`, 'router', 'helper'), { segment: segId }) };
  }
  const helperN = pgParseIPv4(helperText);
  const giaddrN = pgParseIPv4(iface.ip);
  if (helperN === null || giaddrN === null) {
    steps.push({ ok: false, text: `The relay target "${helperText}" or the interface address "${iface.ip}" is not a valid IPv4 address, so the router cannot relay anything.` });
    return { ok: false, steps, diagnosis: pgDhcpWith(pgFail('relay-wrong-server', 'The relay address is not a valid address', `The helper address "${helperText}" is not a valid IPv4 address.`, `Set the helper address to the DHCP server, ${srv.ip}.`, 'router', 'helper'), { segment: segId }) };
  }
  if (helperN !== srvN) {
    const owner = pgDhcpOwnerAnywhere(topo, helperN);
    const onLink = (topo.router.ifaces || []).some((f) => { const fn = pgParseIPv4(f.ip); const m = pgParseMask(f.mask); return fn !== null && m.prefix !== undefined && pgSameSubnet(fn, m.prefix, helperN); });
    steps.push({ ok: true, text: `The router interface on ${segLabel} (${iface.ip}) has a relay: it turns the broadcast into a unicast to the helper address ${helperText} and writes its own address, ${iface.ip}, into the giaddr field.` });
    steps.push({ ok: false, text: owner ? `${helperText} is ${owner}, which is not a DHCP server. It ignores UDP port 67, so the request goes unanswered.` : onLink ? `Nothing owns ${helperText}. The router's ARP request for it gets no reply, so the relayed request goes nowhere.` : `${helperText} is not on any network this router is attached to, and the router has no route to it, so the relayed request is dropped.` });
    return { ok: false, steps, diagnosis: pgDhcpWith(pgFail('relay-wrong-server', 'The relay sends the request to the wrong address', `The relay on the interface facing ${segLabel} forwards DHCP requests to ${helperText}, but the DHCP server is ${srv.ip}. ${owner ? `${helperText} is ${owner}, which does not run a DHCP server.` : 'Nothing there answers.'}`, `Change the helper address on that interface to the DHCP server, ${srv.ip}.`, 'router', 'helper'), { segment: segId }) };
  }
  steps.push({ ok: true, text: `The router interface on ${segLabel} (${iface.ip}) has a relay (ip helper-address ${helperText}): it turns the broadcast into a unicast to the server and writes its own address, ${iface.ip}, into the giaddr field. That field tells the server which subnet the client is on.` });
  if (!srv.online) {
    steps.push({ ok: false, text: `The relayed request arrives, but ${srv.name || 'the DHCP server'} is switched off or its DHCP service is stopped, so nobody answers.` });
    return { ok: false, steps, diagnosis: pgFail('server-down', 'The DHCP server does not answer', `${srv.name || 'The DHCP server'} is offline (powered off, unplugged or its DHCP service stopped), so the relayed request gets no reply.`, 'Bring the DHCP server back online. Until then clients with a valid lease keep working, and everyone else gets nothing.', 'server', 'server-online') };
  }
  return { ok: true, selectorN: giaddrN, via: 'relay', giaddr: iface.ip, steps };
}

function pgDhcpOwnerAnywhere(topo, n) {
  const r = topo.router || {};
  if ((r.ifaces || []).some((f) => pgParseIPv4(f.ip) === n)) return `the router (${r.name || 'Router'})`;
  const h = (topo.hosts || []).find((x) => x.mode === 'static' && pgParseIPv4(x.ip) === n);
  return h ? h.name : null;
}

/* ---- the lease the client ends up with, and whether its settings make sense ---- */

function pgDhcpMakeLease(topo, st, sc, ipN, segId) {
  const dur = Math.round(sc.hours * 3600);
  return {
    ip: pgIpToString(ipN), mask: sc.info ? sc.info.maskText : sc.scope.mask, prefix: sc.prefix,
    gateway: String(sc.scope.gateway || '').trim(), dns: String(sc.scope.dns || '').trim(),
    hours: sc.hours, dur, start: st.now, t1: st.now + dur * 0.5, t2: st.now + dur * 0.875, end: st.now + dur,
    scopeId: sc.scope.id, scopeName: sc.name, segment: segId, server: (topo.server || {}).ip,
  };
}

// Do the settings the client received let it work? Pushes plain steps; returns a diagnosis or null.
function pgDhcpHealth(topo, host, c, steps) {
  const L = c.lease;
  const ipN = pgParseIPv4(L.ip);
  const iface = pgDhcpIface(topo, host.segment);
  const segLabel = pgDhcpSegLabel(topo, host.segment);
  steps.push({ ok: true, text: `${host.name} now uses ${L.ip}, mask ${L.mask} (/${L.prefix}), gateway ${L.gateway || 'none'}, DNS ${L.dns || 'none'}. Checking whether those settings work...` });
  if (c.duplicate) {
    steps.push({ ok: false, text: `${L.ip} is also configured on ${c.duplicate.name}. Two devices answer for one address, so connections to either of them break at random.` });
    return pgDhcpWith(pgFail('address-conflict', `${host.name} and ${c.duplicate.name} share ${L.ip}`, `${host.name} was given ${L.ip}, but ${c.duplicate.name} already uses it and nothing checked first (no conflict detection on the server, no ARP probe on the client). Both devices now fight over one address.`, `Add ${L.ip} to the scope's excluded addresses so the pool never offers an address that is assigned by hand. (Turning on conflict detection only hides the clash after it happens.)`, 'server', 'excluded'), { scopeId: L.scopeId });
  }
  const realPrefix = iface ? pgParseMask(iface.mask).prefix : undefined;
  if (realPrefix !== undefined && L.prefix !== realPrefix) {
    const gwN = pgParseIPv4(L.gateway);
    const gwInView = gwN !== null && pgSameSubnet(ipN, L.prefix, gwN);
    const other = (topo.router.ifaces || []).filter((f) => f.segment !== host.segment).map((f) => ({ f, n: pgParseIPv4(f.ip) })).find((x) => x.n !== null && pgSameSubnet(ipN, L.prefix, x.n));
    let why;
    if (L.prefix < realPrefix) why = other ? `${host.name} believes everything in its /${L.prefix} is on its own wire, which includes ${pgDhcpSegLabel(topo, other.f.segment)} (${other.f.ip}). It will ARP for those hosts directly instead of sending them to the gateway, and nobody answers.` : `${host.name} believes a bigger block than the real /${realPrefix} is on its own wire, so for any address in that block it will ARP directly instead of using the gateway. It works until the day another network is built inside that block.`;
    else why = gwInView ? `${host.name} believes only /${L.prefix} is on its own wire, so hosts of the real /${realPrefix} outside that smaller block look remote and are sent through the gateway instead of delivered directly.` : `${host.name} believes only /${L.prefix} is on its own wire, and its gateway ${L.gateway} falls outside that smaller block, so it thinks the gateway is not reachable directly.`;
    steps.push({ ok: false, text: `The scope handed out mask ${L.mask} (/${L.prefix}), but the segment ${segLabel} is really /${realPrefix} (${iface.mask}). ${why}` });
    return pgDhcpWith(pgFail('wrong-mask', `The scope hands out the wrong mask (/${L.prefix} instead of /${realPrefix})`, `The mask in the scope is what every client on the segment will believe. ${why}`, `Change the scope's mask to ${iface.mask} so it matches the router interface on ${segLabel}.`, 'server', 'scope-mask'), { scopeId: L.scopeId });
  }
  // default gateway
  const gwN = pgParseIPv4(L.gateway);
  const routerN = iface ? pgParseIPv4(iface.ip) : null;
  if (!L.gateway || gwN === null) {
    steps.push({ ok: false, text: L.gateway ? `The gateway option "${L.gateway}" is not a valid address, so ${host.name} has no way off its subnet.` : `The scope has no default-gateway option, so ${host.name} has no way off its subnet.` });
    return pgDhcpWith(pgFail('bad-gateway-option', 'No usable default gateway was handed out', `${host.name} got an address but the scope's gateway option is ${L.gateway ? `"${L.gateway}", which is not an address` : 'empty'}. It can talk to its own subnet but to nothing beyond it.`, `Set the scope's default gateway to the router's address on this segment${iface ? `, ${iface.ip}` : ''}.`, 'server', 'scope-gateway'), { scopeId: L.scopeId });
  }
  if (!pgSameSubnet(ipN, L.prefix, gwN)) {
    steps.push({ ok: false, text: `The gateway ${L.gateway} is not inside ${host.name}'s own subnet (${pgIpToString(pgSubnetInfo(ipN, L.prefix).network)}/${L.prefix}), so the client cannot reach it directly and has no way off the subnet.` });
    return pgDhcpWith(pgFail('bad-gateway-option', 'The gateway handed out is on another network', `The scope's gateway option is ${L.gateway}, which is outside the client's subnet. A client can only use a gateway it can reach directly.`, `Set the scope's default gateway to the router's address on this segment${iface ? `, ${iface.ip}` : ''}.`, 'server', 'scope-gateway'), { scopeId: L.scopeId });
  }
  if (routerN === null || gwN !== routerN) {
    const who = pgDhcpOwner(topo, null, host.segment, gwN, host.id);
    steps.push({ ok: false, text: who ? `The gateway ${L.gateway} is ${who.name}, not the router. ${host.name} sends its off-subnet traffic there and it is never forwarded.` : `${host.name} ARPs for its gateway ${L.gateway} and nothing answers: no device on ${segLabel} has that address.` });
    return pgDhcpWith(pgFail('bad-gateway-option', `The gateway handed out (${L.gateway}) is not the router`, `${host.name} got a valid address, but the default gateway in the scope is ${L.gateway}${who ? `, which belongs to ${who.name}` : ', where nothing answers'}. The router's address on this segment is ${iface ? iface.ip : 'unknown'}, so everything off the subnet is lost.`, `Set the scope's default gateway to the router's address, ${iface ? iface.ip : 'on this segment'}.`, 'server', 'scope-gateway'), { scopeId: L.scopeId });
  }
  steps.push({ ok: true, text: `Gateway ${L.gateway} is inside the subnet and is the router's address on ${segLabel}: traffic can leave the subnet.` });
  // DNS
  const dnsN = pgParseIPv4(L.dns);
  const known = Array.isArray(topo.dns) ? topo.dns.map((d) => pgParseIPv4(d)) : null;
  if (!L.dns || dnsN === null) {
    steps.push({ ok: false, text: L.dns ? `The DNS option "${L.dns}" is not a valid address.` : 'The scope hands out no DNS server.' });
    return pgDhcpWith(pgFail('bad-dns-option', 'No usable DNS server was handed out', `${host.name} has an address and a gateway, so pinging by IP address works, but without a DNS server it cannot turn names into addresses.`, 'Set the scope\'s DNS server option to a server that answers DNS queries.', 'server', 'scope-dns'), { scopeId: L.scopeId });
  }
  if (known && !known.includes(dnsN)) {
    steps.push({ ok: false, text: `The DNS server ${L.dns} does not answer (nothing in this network runs DNS at that address), so name lookups time out.` });
    return pgDhcpWith(pgFail('bad-dns-option', `The DNS server handed out (${L.dns}) does not answer`, `${host.name} can reach addresses, but every name lookup goes to ${L.dns}, where no DNS service answers. Users report that "the internet is down" although pinging an IP address works.`, `Set the scope's DNS server option to ${topo.dns.join(' or ')}.`, 'server', 'scope-dns'), { scopeId: L.scopeId });
  }
  steps.push({ ok: true, text: `DNS server ${L.dns} answers: names can be resolved.` });
  return null;
}

/* ---- DORA ---- */

// Mutating version used inside the simulation; pgDhcpDora below clones the state first.
function pgDhcpDoraInto(topo, st, clientId) {
  const steps = [];
  const host = pgDhcpHost(topo, clientId);
  const srv = topo.server || {};
  const record = (patch) => { st.clients[clientId] = Object.assign({ phase: 'none', lease: null, duplicate: null, warnings: [], lastFailure: null, lastSteps: [] }, patch); };
  const finishFail = (diagnosis, summary) => {
    record({ phase: 'none', lastFailure: diagnosis, lastSteps: steps });
    return { verdict: 'failed', steps, diagnosis, warning: null, summary: summary || diagnosis.title, lease: null, client: clientId, conflicts, attempts };
  };
  const conflicts = [];
  let attempts = 0;
  if (!host || host.mode !== 'dhcp') {
    return { verdict: 'failed', steps, diagnosis: pgFail('not-dhcp', 'This device does not use DHCP', 'Only clients set to DHCP ask a server for an address.', 'Pick a DHCP client.', clientId, null), warning: null, summary: 'This device does not use DHCP', lease: null, client: clientId, conflicts, attempts };
  }
  const mac = pgDhcpMac(host);
  // A client that starts DORA has no address any more; the server may still remember it.
  record({ phase: 'none' });
  const reach = pgDhcpReachServer(topo, host.segment, 'DHCPDISCOVER', host.name);
  reach.steps.forEach((s) => steps.push(s));
  if (!reach.ok) return finishFail(reach.diagnosis);
  const iface = pgDhcpIface(topo, host.segment);
  const scopes = pgDhcpFindScope(topo, reach.selectorN);
  const selectorText = pgIpToString(reach.selectorN);
  if (!scopes.match) {
    const list = scopes.all.length ? scopes.all.map((s) => `${pgDhcpScopeText(s)}: no`).join('; ') : 'the server has no scopes at all';
    steps.push({ ok: false, text: `The server picks a scope by ${reach.via === 'relay' ? `the giaddr field (${selectorText})` : `the address of the interface the request came in on (${selectorText})`}. It compares it with its scopes: ${list}. No scope covers the client's subnet, so the server stays silent. (The client would retry and, after a while, give itself a 169.254.x.x address.)`, });
    const subnetText = iface ? `${pgIpToString(pgSubnetInfo(pgParseIPv4(iface.ip) || 0, pgParseMask(iface.mask).prefix || 0).network)}/${pgParseMask(iface.mask).prefix}` : selectorText;
    return finishFail(pgDhcpWith(pgFail('no-scope', 'The server has no scope for this subnet', `${host.name} is on ${subnetText} (${reach.via === 'relay' ? 'giaddr ' : 'server interface '}${selectorText}), but none of the server's scopes covers that subnet, so the server ignores the request. ${scopes.all.length ? `Scopes it has: ${scopes.all.map(pgDhcpScopeText).join(', ')}.` : ''}`, `Create or correct a scope whose network matches ${subnetText}.`, 'server', 'scope-network'), { segment: host.segment }));
  }
  const sc = scopes.match;
  steps.push({ ok: true, text: `The server picks a scope by ${reach.via === 'relay' ? `the giaddr field (${selectorText})` : `the interface the request came in on (${selectorText})`}: scope ${pgDhcpScopeText(sc)} matches.` });
  if (sc.errors.length) {
    steps.push({ ok: false, text: `The scope ${sc.name} has invalid settings (${sc.errors.join(', ')}), so the server cannot use it.` });
    return finishFail(pgDhcpWith(pgFail('bad-config', `Scope ${sc.name} has an invalid setting`, `One of the scope's settings (${sc.errors.join(', ')}) is not valid, so the server cannot offer from it.`, 'Fix the highlighted field in the scope.', 'server', `scope-${sc.errors[0]}`), { scopeId: sc.scope.id }));
  }
  const range = pgDhcpPoolRange(sc);
  const poolSize = pgDhcpPoolSize(sc);
  if (range && (sc.startN < sc.info.first || sc.endN > sc.info.last)) {
    steps.push({ ok: true, text: `Part of the pool (${sc.scope.start} to ${sc.scope.end}) lies outside the scope's network ${sc.info.networkText}/${sc.prefix}; those addresses are never offered.` });
  }
  const declined = [];
  let duplicate = null;
  let lease = null;
  while (attempts < PG_DHCP_MAX_ATTEMPTS && !lease) {
    attempts += 1;
    if (attempts > 1) steps.push({ ok: true, text: `${host.name} starts again with a new DHCPDISCOVER (a real client waits at least 10 seconds after a decline; the lab does not move the clock).` });
    // choose an address
    const bound = Object.keys(st.leases).find((ipText) => {
      const l = st.leases[ipText];
      const n = pgParseIPv4(ipText);
      return l.mac === mac && !st.bad[ipText] && n !== null && range && n >= range.lo && n <= range.hi && !pgDhcpExcludedAt(sc, n);
    });
    // RFC 2131 4.3.1: the server prefers the address it already remembers for this client, even after the lease ran out, if nobody else has it.
    let chosen = null;
    let reused = false;
    const consider = (n) => {
      const t = pgIpToString(n);
      if (st.bad[t]) return false;
      const l = st.leases[t];
      if (l && l.end > st.now && l.mac !== mac) return false;
      if (srv.conflictDetection) {
        const owner = pgDhcpOwner(topo, st, host.segment, n, host.id);
        if (owner) {
          st.bad[t] = true;
          conflicts.push({ ip: t, by: owner.name, found: 'server' });
          steps.push({ ok: false, text: `Conflict detection: before offering ${t} the server pings it and ${owner.name} answers. The server marks ${t} as in use, does not offer it, and tries the next address.` });
          return false;
        }
      }
      chosen = n;
      return true;
    };
    if (bound) { const bn = pgParseIPv4(bound); if (consider(bn)) reused = true; }
    if (!chosen && range) {
      for (let n = range.lo; n <= range.hi; n += 1) {
        const ex = sc.excluded.find((e) => n >= e.lo && n <= e.hi);
        if (ex) { n = ex.hi; continue; }
        if (consider(n)) break;
      }
    }
    if (!chosen) {
      const leasedNow = Object.keys(st.leases).filter((k) => st.leases[k].end > st.now && range && pgParseIPv4(k) >= range.lo && pgParseIPv4(k) <= range.hi);
      const badNow = Object.keys(st.bad).filter((k) => range && pgParseIPv4(k) >= range.lo && pgParseIPv4(k) <= range.hi);
      const who = leasedNow.map((k) => { const l = st.leases[k]; const h = pgDhcpHost(topo, l.client); return `${k} (${h ? h.name : l.client})`; });
      const detail = poolSize === 0
        ? `The pool ${sc.scope.start} to ${sc.scope.end} contains no usable address (it must lie inside ${sc.info.networkText}/${sc.prefix} and not be fully excluded).`
        : `The pool ${sc.scope.start} to ${sc.scope.end} has ${poolSize} usable address${poolSize === 1 ? '' : 'es'}${sc.excluded.length ? ' after exclusions' : ''}. ${leasedNow.length ? `Leased: ${who.join(', ')}. ` : ''}${badNow.length ? `Marked in conflict: ${badNow.join(', ')}. ` : ''}Nothing is free.`;
      steps.push({ ok: false, text: `${detail} The server has nothing to offer, so ${host.name} gets no answer.` });
      return finishFail(pgDhcpWith(pgFail('pool-exhausted', poolSize === 0 ? 'The pool has no usable addresses' : 'The address pool is used up', `${detail} A client that finds no free address gets no offer; after a while it gives itself a 169.254.x.x address.`, poolSize === 0 ? 'Make the pool start and end lie inside the scope network, and check the exclusions.' : 'Make the pool bigger (move the end address), shorten the lease time so old leases free up sooner, or use a bigger subnet.', 'server', 'scope-pool'), { scopeId: sc.scope.id }));
    }
    const chosenText = pgIpToString(chosen);
    // Offer, Request, Acknowledge
    const opts = `mask ${sc.info.maskText}, gateway ${sc.scope.gateway || 'none'}, DNS ${sc.scope.dns || 'none'}, lease ${sc.hours} h`;
    steps.push({ ok: true, text: `DHCPOFFER: the server proposes ${chosenText}${reused ? ' (the address it already remembers for this client)' : ''} with ${opts}${reach.via === 'relay' ? ', sent back through the relay' : ''}.` });
    steps.push({ ok: true, text: `DHCPREQUEST: ${host.name} accepts the offer. It broadcasts the request, so any other DHCP server would learn its offer was not chosen.` });
    steps.push({ ok: true, text: `DHCPACK: the server confirms the lease of ${chosenText} for ${pgDhcpDuration(Math.round(sc.hours * 3600))} and records it against ${host.name}'s MAC address.` });
    Object.keys(st.leases).forEach((k) => { if (st.leases[k].mac === mac && k !== chosenText) delete st.leases[k]; });
    st.leases[chosenText] = { mac, client: host.id, start: st.now, end: st.now + Math.round(sc.hours * 3600), scope: sc.scope.id };
    // the client's final check
    const owner = pgDhcpOwner(topo, st, host.segment, chosen, host.id);
    if (host.probe !== false) {
      if (owner) {
        steps.push({ ok: false, text: `ARP probe: before using ${chosenText}, ${host.name} asks the segment who has it, and ${owner.name} answers. The address is already in use.` });
        steps.push({ ok: false, text: `${host.name} sends DHCPDECLINE. The server marks ${chosenText} as unavailable (it will not offer it again) and ${host.name} restarts the process.` });
        delete st.leases[chosenText];
        st.bad[chosenText] = true;
        conflicts.push({ ip: chosenText, by: owner.name, found: 'client' });
        declined.push(chosenText);
        continue;
      }
      steps.push({ ok: true, text: `ARP probe: ${host.name} asks who has ${chosenText} and nobody answers, so the address is free to use.` });
    } else if (owner) {
      steps.push({ ok: false, text: `${host.name} does not probe the address with ARP, so it does not notice that ${owner.name} already uses ${chosenText}.` });
      duplicate = { ip: chosenText, name: owner.name };
    } else {
      steps.push({ ok: true, text: `${host.name} is set not to ARP-probe the address; here nobody else has ${chosenText}, so that is fine.` });
    }
    lease = pgDhcpMakeLease(topo, st, sc, chosen, host.segment);
  }
  if (!lease) {
    steps.push({ ok: false, text: `After ${attempts} tries every address offered was already in use (${declined.join(', ')}). ${host.name} gives up for now.` });
    return finishFail(pgDhcpWith(pgFail('address-conflict', 'Every address offered was already in use', `The pool keeps offering addresses that other devices already use (${declined.join(', ')}). Each time the client declines and starts over.`, 'Exclude the addresses that are assigned by hand from the pool, or move the pool to a range nobody uses.', 'server', 'excluded'), { scopeId: sc.scope.id }));
  }
  record({ phase: 'bound', lease, duplicate, warnings: [], lastSteps: steps });
  const c = st.clients[clientId];
  const health = pgDhcpHealth(topo, host, c, steps);
  if (conflicts.length) {
    const list = conflicts.map((x) => `${x.ip} (${x.by})`).join(', ');
    c.warnings.push(pgDhcpWith(pgFail('address-conflict', `The pool offered addresses that were already in use: ${list}`, `${conflicts.length} address${conflicts.length === 1 ? '' : 'es'} from the pool belonged to devices configured by hand: ${list}. ${conflicts.some((x) => x.found === 'client') ? 'The client had to decline and ask again, which costs time (a real client waits at least 10 seconds each time) and may raise an address-conflict warning. ' : ''}${conflicts.some((x) => x.found === 'server') ? 'The server\'s conflict detection caught the clash before it did harm. ' : ''}`, `Add ${conflicts.map((x) => x.ip).join(', ')} to the scope's excluded addresses so the server never offers them.`, 'server', 'excluded'), { scopeId: sc.scope.id }));
  }
  c.lastSteps = steps;
  if (health) {
    c.lastFailure = health;
    return { verdict: 'failed', steps, diagnosis: health, warning: c.warnings[0] || null, summary: health.title, lease, client: clientId, conflicts, attempts };
  }
  steps.push({ ok: true, text: `${host.name} is fully configured and everything checks out.` });
  return { verdict: 'success', steps, diagnosis: null, warning: c.warnings[0] || null, summary: `${host.name} got ${lease.ip}/${lease.prefix} (gateway ${lease.gateway}, DNS ${lease.dns}) for ${pgDhcpDuration(lease.dur)}.`, lease, client: clientId, conflicts, attempts };
}

// One DORA for one client, on a copy of the state.
function pgDhcpDora(topo, st0, clientId) {
  const st = pgClone(st0 || pgDhcpNewState());
  const r = pgDhcpDoraInto(topo, st, clientId);
  r.state = st;
  return r;
}

// Every DHCP client asks for an address, in list order, on a copy of the state (or a fresh one).
function pgDhcpRunAll(topo, st0) {
  let st = st0 ? pgClone(st0) : pgDhcpNewState();
  const parts = [];
  (topo.hosts || []).filter((h) => h.mode === 'dhcp').forEach((h) => {
    const r = pgDhcpDoraInto(topo, st, h.id);
    parts.push({ id: h.id, name: h.name, verdict: r.verdict, summary: r.summary, steps: r.steps, diagnosis: r.diagnosis, warning: r.warning, lease: r.lease });
  });
  const firstFail = parts.find((p) => p.verdict !== 'success');
  const firstWarn = parts.find((p) => p.warning);
  const steps = [];
  parts.forEach((p) => { steps.push({ ok: p.verdict === 'success', text: p.summary }); });
  return {
    state: st, parts, steps,
    verdict: parts.length && !firstFail ? 'success' : 'failed',
    diagnosis: firstFail ? firstFail.diagnosis : null,
    warning: firstWarn ? firstWarn.warning : null,
    summary: !parts.length ? 'There are no DHCP clients.' : firstFail ? `${parts.filter((p) => p.verdict !== 'success').length} of ${parts.length} clients have a problem.` : `All ${parts.length} clients are configured and working.`,
  };
}

/* ---- the clock: renewal, rebinding, expiry ---- */

// What does the server say to a renewal or rebind of lease L? Returns 'ack' | 'nak' | 'silent'.
function pgDhcpServerJudge(topo, st, host, L) {
  const ipN = pgParseIPv4(L.ip);
  const found = pgDhcpFindScope(topo, ipN);
  if (!found.match) return { kind: 'silent', why: `no scope of the server covers ${L.ip} any more` };
  const sc = found.match;
  if (sc.errors.length) return { kind: 'silent', why: `scope ${sc.name} has invalid settings` };
  const r = pgDhcpPoolRange(sc);
  if (!r || ipN < r.lo || ipN > r.hi) return { kind: 'nak', sc, why: `${L.ip} is no longer inside the pool of scope ${sc.name} (${sc.scope.start} to ${sc.scope.end})` };
  if (pgDhcpExcludedAt(sc, ipN)) return { kind: 'nak', sc, why: `${L.ip} is now an excluded address` };
  const other = st.leases[L.ip];
  if (other && other.end > st.now && other.mac !== pgDhcpMac(host)) return { kind: 'nak', sc, why: `${L.ip} is leased to another client` };
  return { kind: 'ack', sc };
}

function pgDhcpEvent(st, events, host, ok, text) {
  const e = { t: st.now, client: host.id, name: host.name, ok, text };
  events.push(e);
  st.log.push(e);
  if (st.log.length > 200) st.log.splice(0, st.log.length - 200);
}

// T1 (kind 'renew') or T2 (kind 'rebind') reached for this client.
function pgDhcpTimerAttempt(topo, st, host, kind, events) {
  const c = st.clients[host.id];
  const L = c.lease;
  const srv = topo.server || {};
  const label = kind === 'renew' ? 'T1 (50% of the lease)' : 'T2 (87.5% of the lease)';
  const nextPhase = kind === 'renew' ? 'renewing' : 'rebinding';
  const nextEvent = kind === 'renew' ? 'It keeps its address and will try again by broadcast at T2 (87.5%).' : 'It keeps its address until the lease runs out.';
  // can the message get there?
  let blocked = null;
  if (host.segment !== srv.segment) {
    if (kind === 'renew') {
      const iface = pgDhcpIface(topo, host.segment);
      const gwN = pgParseIPv4(L.gateway);
      const ok = iface && gwN !== null && gwN === pgParseIPv4(iface.ip) && pgSameSubnet(pgParseIPv4(L.ip), L.prefix, gwN);
      if (!ok) blocked = `${host.name} sends the renewal as a unicast to the server, but its gateway (${L.gateway || 'none'}) is not the router, so the message cannot leave the subnet.`;
    } else {
      const r = pgDhcpReachServer(topo, host.segment, 'DHCPREQUEST', host.name);
      if (!r.ok && r.diagnosis.code !== 'server-down') blocked = `${host.name} broadcasts the request, and that broadcast does not reach the server: ${r.diagnosis.title.toLowerCase()}.`;
    }
  }
  if (!blocked && !srv.online) blocked = `${srv.name || 'The DHCP server'} is offline, so nobody answers.`;
  if (blocked) {
    c.phase = nextPhase;
    pgDhcpEvent(st, events, host, false, `${label}: ${host.name} asks to ${kind === 'renew' ? 'renew' : 'rebind'} ${L.ip}. ${blocked} ${nextEvent}`);
    return;
  }
  const verdict = pgDhcpServerJudge(topo, st, host, L);
  if (verdict.kind === 'ack') {
    const sc = verdict.sc;
    const nl = pgDhcpMakeLease(topo, st, sc, pgParseIPv4(L.ip), host.segment);
    st.leases[L.ip] = { mac: pgDhcpMac(host), client: host.id, start: st.now, end: nl.end, scope: sc.scope.id };
    const changed = [];
    if (nl.gateway !== L.gateway) changed.push(`gateway ${L.gateway || 'none'} to ${nl.gateway || 'none'}`);
    if (nl.dns !== L.dns) changed.push(`DNS ${L.dns || 'none'} to ${nl.dns || 'none'}`);
    if (nl.mask !== L.mask) changed.push(`mask ${L.mask} to ${nl.mask}`);
    c.lease = nl;
    c.phase = 'bound';
    pgDhcpEvent(st, events, host, true, `${label}: ${host.name} ${kind === 'renew' ? 'unicasts a DHCPREQUEST to the server that gave it the lease' : 'broadcasts a DHCPREQUEST to any server'} and the server answers DHCPACK. ${L.ip} is renewed for another ${pgDhcpDuration(nl.dur)}; the timers restart.${changed.length ? ` The ACK also carried new options (${changed.join(', ')}).` : ''}`);
    return;
  }
  if (verdict.kind === 'nak') {
    delete st.leases[L.ip];
    pgDhcpEvent(st, events, host, false, `${label}: ${host.name} asks to ${kind === 'renew' ? 'renew' : 'rebind'} ${L.ip} and the server answers DHCPNAK: ${verdict.why}. ${host.name} must stop using ${L.ip} and start again with DORA.`);
    c.lease = null;
    c.phase = 'none';
    const r = pgDhcpDoraInto(topo, st, host.id);
    pgDhcpEvent(st, events, host, r.verdict === 'success', r.verdict === 'success' ? `Fresh DORA: ${host.name} gets ${r.lease.ip} from scope ${r.lease.scopeName}.` : `Fresh DORA fails: ${r.diagnosis.title}. ${host.name} has no working address.`);
    return;
  }
  c.phase = nextPhase;
  pgDhcpEvent(st, events, host, false, `${label}: ${host.name} asks to ${kind === 'renew' ? 'renew' : 'rebind'} ${L.ip}, but the server stays silent (${verdict.why}). ${nextEvent}`);
}

// Moves the clock forward by `seconds`, running every lease timer that comes due, in time order.
// Returns { state, events } (events from this advance only).
function pgDhcpAdvance(topo, st0, seconds) {
  const st = pgClone(st0);
  const events = [];
  const target = st.now + Math.max(0, Math.round(seconds));
  for (let guard = 0; guard < 5000; guard += 1) {
    let best = null;
    Object.keys(st.clients).forEach((id) => {
      const c = st.clients[id];
      if (!c.lease) return;
      let t; let kind;
      if (c.phase === 'bound') { t = c.lease.t1; kind = 'renew'; }
      else if (c.phase === 'renewing') { t = c.lease.t2; kind = 'rebind'; }
      else if (c.phase === 'rebinding') { t = c.lease.end; kind = 'expire'; }
      else return;
      if (t <= target && (best === null || t < best.t)) best = { t, id, kind };
    });
    if (!best) break;
    st.now = Math.max(st.now, best.t);
    const host = pgDhcpHost(topo, best.id);
    const c = st.clients[best.id];
    if (!host) { delete st.clients[best.id]; continue; }
    if (best.kind === 'expire') {
      const old = c.lease;
      pgDhcpEvent(st, events, host, false, `The lease on ${old.ip} runs out. ${host.name} may no longer use it: it drops the address (a Windows PC would fall back to a 169.254.x.x address) and starts again with DORA.`);
      c.lease = null;
      c.phase = 'expired';
      const r = pgDhcpDoraInto(topo, st, host.id);
      if (r.verdict === 'success') pgDhcpEvent(st, events, host, true, `Fresh DORA: ${host.name} gets ${r.lease.ip} from scope ${r.lease.scopeName}.`);
      else {
        const why = r.diagnosis ? r.diagnosis.title : 'no server answered';
        const failure = pgDhcpWith(pgFail('lease-expired', `${host.name}'s lease expired and it could not get a new one`, `The lease on ${old.ip} ran out while the server could not be reached or would not answer (${why}). The client had to give up its address, so it has no working network settings.`, 'Bring the server back (or fix the reason it does not answer) before leases expire, and use lease times long enough to survive an outage.', host.id, 'scope-lease'), { cause: r.diagnosis ? r.diagnosis.code : null });
        const rec = st.clients[host.id];
        rec.phase = 'expired';
        rec.lease = null;
        rec.lastFailure = failure;
        pgDhcpEvent(st, events, host, false, `Fresh DORA fails: ${why}. ${host.name} has no address.`);
      }
    } else pgDhcpTimerAttempt(topo, st, host, best.kind, events);
  }
  st.now = target;
  return { state: st, events };
}

/* ---- reading the state ---- */

// Where is this client now? { phase, text, lease, health, nextKind, nextIn }
function pgDhcpStatus(topo, st, id) {
  const host = pgDhcpHost(topo, id);
  const c = st && st.clients ? st.clients[id] : null;
  if (!host) return { phase: 'idle', text: 'Unknown device', verdict: 'failed', diagnosis: null };
  if (host.mode === 'static') return { phase: 'static', text: `Static ${host.ip}`, verdict: 'success', diagnosis: null };
  if (!c) return { phase: 'idle', text: 'Has not asked for an address yet', verdict: 'none', diagnosis: null };
  if (!c.lease) {
    return { phase: c.phase, text: c.phase === 'expired' ? 'Lease expired, no address' : 'No address (would use 169.254.x.x)', verdict: 'failed', diagnosis: c.lastFailure || null };
  }
  const L = c.lease;
  const health = pgDhcpHealth(topo, host, c, []);
  let nextKind; let nextAt;
  if (c.phase === 'bound') { nextKind = 'T1 renew'; nextAt = L.t1; } else if (c.phase === 'renewing') { nextKind = 'T2 rebind'; nextAt = L.t2; } else { nextKind = 'expiry'; nextAt = L.end; }
  return {
    phase: c.phase, lease: L, verdict: health ? 'failed' : 'success', diagnosis: health, warning: (c.warnings || [])[0] || null,
    text: `${L.ip}/${L.prefix}`, nextKind, nextIn: Math.max(0, nextAt - st.now), expiresIn: Math.max(0, L.end - st.now),
  };
}

// The final answer for one client after a goal's script: { verdict, diagnosis, summary, steps }.
function pgDhcpClientResult(topo, st, id, clean) {
  const host = pgDhcpHost(topo, id);
  if (!host) return { verdict: 'failed', diagnosis: null, summary: 'Unknown client', steps: [] };
  const c = st.clients[id];
  const steps = c && c.lastSteps ? c.lastSteps.slice() : [];
  if (!c || !c.lease) {
    const d = (c && c.lastFailure) || pgFail('no-lease', `${host.name} has no address`, 'The client never got a lease.', 'Run the DORA exchange for this client.', id, null);
    return { verdict: 'failed', diagnosis: d, summary: d.title, steps };
  }
  const health = pgDhcpHealth(topo, host, c, []);
  if (health) return { verdict: 'failed', diagnosis: health, summary: health.title, steps };
  if (clean && c.warnings && c.warnings.length) return { verdict: 'failed', diagnosis: c.warnings[0], summary: c.warnings[0].title, steps };
  return { verdict: 'success', diagnosis: null, summary: `${host.name} has ${c.lease.ip}/${c.lease.prefix} and everything works.`, steps, lease: c.lease };
}

/* ---- scenario goals: boot everything, run a script, look at one client ---- */

// goal = { client, verdict, code?, clean?, setup?: [{ path, value }], script?: [{ do: 'advance', minutes } | { do: 'edit', path, value } | { do: 'dora', client }] }
// `setup` edits are applied to the learner's copy before everything boots (so a switch the learner flipped to experiment,
// such as "server is running", cannot make the goal impossible); `script` then plays out over time.
function pgDhcpGoal(topo0, goal) {
  let topo = pgClone(topo0);
  (goal.setup || []).forEach((step) => { topo = pgDhcpSetPath(topo, step.path, step.value); });
  let st = pgDhcpRunAll(topo, null).state;
  (goal.script || []).forEach((step) => {
    if (step.do === 'advance') st = pgDhcpAdvance(topo, st, Math.round(step.minutes * 60)).state;
    else if (step.do === 'edit') topo = pgDhcpSetPath(topo, step.path, step.value);
    else if (step.do === 'dora') st = pgDhcpDora(topo, st, step.client).state;
  });
  const r = pgDhcpClientResult(topo, st, goal.client, !!goal.clean);
  r.state = st;
  r.topo = topo;
  return r;
}

// "server.scopes.0.end" -> sets that field on a copy.
function pgDhcpSetPath(topo, path, value) {
  const t = pgClone(topo);
  const keys = String(path).split('.');
  let cur = t;
  for (let i = 0; i < keys.length - 1; i += 1) { if (cur == null) return t; cur = cur[keys[i]]; }
  if (cur != null) cur[keys[keys.length - 1]] = value;
  return t;
}

// fix entries: { path, value } sets a field, { push, value } appends to a list, { remove: 'path.0' } removes a list item.
function pgDhcpApplyFixes(topo, fixes) {
  let t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.path !== undefined) t = pgDhcpSetPath(t, f.path, pgClone(f.value));
    else if (f.push) {
      const keys = String(f.push).split('.');
      let cur = t;
      keys.forEach((k) => { cur = cur[k]; });
      if (Array.isArray(cur)) cur.push(pgClone(f.value));
    } else if (f.remove) {
      const keys = String(f.remove).split('.');
      const idx = Number(keys.pop());
      let cur = t;
      keys.forEach((k) => { cur = cur[k]; });
      if (Array.isArray(cur)) cur.splice(idx, 1);
    }
  });
  return t;
}
