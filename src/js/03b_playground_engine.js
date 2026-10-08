/* ---------------- IT playground: pure simulation engine ---------------- */

// Everything the Playground (04h_playground_ui.jsx) calculates or simulates
// lives here as plain functions over plain objects, with no React and no DOM,
// so it can be unit-tested in Node (see tools/check_playground.js) and checked
// against every guided scenario at build time. It models only what the
// certifications teach and says so: IPv4 addressing and subnetting, a simple
// ARP / default-gateway / routing-table model for "can A reach B", and (further
// down) VLAN switching and first-match firewall rules. It never claims
// vendor-specific behaviour it does not reproduce.

/* ---- IPv4 maths: every address is an unsigned 32-bit number ---- */

function pgParseIPv4(text) {
  const s = String(text == null ? '' : text).trim();
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return null;
  let n = 0;
  for (let i = 1; i <= 4; i += 1) {
    if (m[i].length > 1 && m[i][0] === '0') return null; // leading zeros are ambiguous (octal in some tools)
    const o = Number(m[i]);
    if (o > 255) return null;
    n = n * 256 + o;
  }
  return n >>> 0;
}

function pgIpToString(n) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
}

function pgMaskFromPrefix(p) {
  return p <= 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
}

// Accepts "/24", "24" or "255.255.255.0". Returns { prefix } or { error }.
function pgParseMask(text) {
  const s = String(text == null ? '' : text).trim();
  if (!s) return { error: 'Enter a mask such as /24 or 255.255.255.0.' };
  const slash = /^\/?(\d{1,2})$/.exec(s);
  if (slash) {
    const p = Number(slash[1]);
    return p >= 0 && p <= 32 ? { prefix: p } : { error: 'A prefix length is between /0 and /32.' };
  }
  const n = pgParseIPv4(s);
  if (n === null) return { error: 'That is not a valid mask. Use /24 or four numbers such as 255.255.255.0.' };
  const inv = (~n) >>> 0;
  if (((inv + 1) & inv) !== 0) {
    // A wildcard mask (0.0.0.255) is the classic mix-up.
    const asWildcard = (((n + 1) & n) >>> 0) === 0;
    return {
      error: asWildcard
        ? `${s} looks like a wildcard mask (the inverse of a subnet mask). A subnet mask has its 1 bits first, for example ${pgIpToString((~n) >>> 0)}.`
        : `${s} is not a valid subnet mask: its 1 bits must all come first, with no gaps (for example 255.255.255.0 or 255.255.254.0).`,
    };
  }
  let p = 0;
  for (let bit = 31; bit >= 0 && ((n >>> bit) & 1); bit -= 1) p += 1;
  return { prefix: p };
}

function pgBin32(n, boundary) {
  const bits = [];
  for (let i = 31; i >= 0; i -= 1) bits.push((n >>> i) & 1);
  return bits.map((b, i) => ({ bit: b, net: boundary === undefined ? null : i < boundary }));
}

function pgAddressKind(n) {
  const a = n >>> 24;
  const b = (n >>> 16) & 255;
  if (a === 0) return { key: 'this', label: 'The "this network" block (0.0.0.0/8), never a host address' };
  if (a === 10) return { key: 'private', label: 'Private (RFC 1918, 10.0.0.0/8)' };
  if (a === 172 && b >= 16 && b <= 31) return { key: 'private', label: 'Private (RFC 1918, 172.16.0.0/12)' };
  if (a === 192 && b === 168) return { key: 'private', label: 'Private (RFC 1918, 192.168.0.0/16)' };
  if (a === 127) return { key: 'loopback', label: 'Loopback (127.0.0.0/8): the device talking to itself' };
  if (a === 169 && b === 254) return { key: 'linklocal', label: 'Link-local / APIPA (169.254.0.0/16): what a host gives itself when DHCP fails' };
  if (a === 100 && b >= 64 && b <= 127) return { key: 'cgnat', label: 'Shared address space (100.64.0.0/10), used by carrier-grade NAT' };
  if (a >= 224 && a <= 239) return { key: 'multicast', label: 'Multicast (224.0.0.0/4)' };
  if (a >= 240) return { key: 'reserved', label: 'Reserved / experimental (240.0.0.0/4)' };
  return { key: 'public', label: 'Public (routable on the internet)' };
}

function pgClassOf(n) {
  const a = n >>> 24;
  if (a < 128) return { letter: 'A', prefix: 8 };
  if (a < 192) return { letter: 'B', prefix: 16 };
  if (a < 224) return { letter: 'C', prefix: 24 };
  if (a < 240) return { letter: 'D', prefix: null };
  return { letter: 'E', prefix: null };
}

// Everything about one address/prefix pair.
function pgSubnetInfo(ip, prefix) {
  const mask = pgMaskFromPrefix(prefix);
  const wildcard = (~mask) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const hostBits = 32 - prefix;
  const total = Math.pow(2, hostBits);
  let first; let last; let usable; let note = null;
  if (prefix === 32) { first = network; last = network; usable = 1; note = 'A /32 is a single host address (used for loopbacks and host routes).'; }
  else if (prefix === 31) { first = network; last = broadcast; usable = 2; note = 'A /31 has no network or broadcast address: both addresses are hosts (point-to-point links, RFC 3021).'; }
  else { first = network + 1; last = broadcast - 1; usable = total - 2; }
  let role = 'host';
  if (prefix <= 30 && ip === network) role = 'network';
  else if (prefix <= 30 && ip === broadcast) role = 'broadcast';
  const cls = pgClassOf(ip);
  return {
    ip, prefix, mask, wildcard, network, broadcast, first, last, hostBits, total, usable, note, role,
    maskText: pgIpToString(mask), wildcardText: pgIpToString(wildcard), networkText: pgIpToString(network),
    broadcastText: pgIpToString(broadcast), firstText: pgIpToString(first), lastText: pgIpToString(last),
    kind: pgAddressKind(ip), cls,
    classfulBits: cls.prefix && prefix > cls.prefix ? prefix - cls.prefix : 0,
    binIp: pgBin32(ip, prefix), binMask: pgBin32(mask, prefix), binNetwork: pgBin32(network, prefix),
  };
}

function pgSameSubnet(ipA, prefixA, ipB) {
  return ((ipA & pgMaskFromPrefix(prefixA)) >>> 0) === ((ipB & pgMaskFromPrefix(prefixA)) >>> 0);
}

// The step-by-step "show me how" for the calculator.
function pgSubnetSteps(info) {
  const p = info.prefix;
  const o = (n) => pgIpToString(n);
  const steps = [];
  steps.push({
    title: 'Read the mask',
    text: `/${p} means the first ${p} bits of the address are the network part and the remaining ${info.hostBits} bits identify hosts. As a dotted mask that is ${info.maskText}.`,
  });
  steps.push({
    title: 'Find the network address (AND with the mask)',
    text: `Line the address up with the mask and keep only the bits where the mask has a 1. ${o(info.ip)} AND ${info.maskText} = ${info.networkText}. Setting every host bit to 0 gives the subnet's first address, the network address.`,
  });
  steps.push({
    title: 'Find the broadcast address',
    text: `Set every host bit to 1 instead (or add the wildcard mask ${info.wildcardText}): ${info.networkText} + ${info.total - 1} = ${info.broadcastText}. That is the address a host uses to talk to everyone in the subnet.`,
  });
  steps.push({
    title: 'Usable host range and count',
    text: p >= 31
      ? (info.note || '')
      : `Hosts sit between those two: ${info.firstText} to ${info.lastText}. With ${info.hostBits} host bits there are 2^${info.hostBits} = ${info.total} addresses, minus the network and broadcast addresses = ${info.usable} usable hosts.`,
  });
  if (p % 8 !== 0 && p > 0 && p < 32) {
    const octet = Math.floor(p / 8) + 1;
    const maskOctet = (info.mask >>> (8 * (4 - octet))) & 255;
    const block = 256 - maskOctet;
    const ipOctet = (info.ip >>> (8 * (4 - octet))) & 255;
    steps.push({
      title: 'The shortcut: block size',
      text: `The mask changes inside octet ${octet} (its value is ${maskOctet}). Block size = 256 - ${maskOctet} = ${block}. Subnets start at multiples of ${block} in that octet: ${ipOctet} falls in the block starting at ${Math.floor(ipOctet / block) * block}, which matches the network address.`,
    });
  }
  const prevNet = info.network - info.total;
  const nextNet = info.network + info.total;
  steps.push({
    title: 'Neighbouring subnets of the same size',
    text: `${prevNet >= 0 ? `The previous subnet starts at ${o(prevNet)}/${p}` : 'There is no previous subnet'}; ${nextNet <= 0xFFFFFFFF ? `the next starts at ${o(nextNet)}/${p}` : 'there is no next subnet'}. Two hosts can talk directly only if they are in the same one.`,
  });
  return steps;
}

// Splits a network into subnets of a longer prefix (first `limit` of them).
function pgSplitSubnets(network, prefix, newPrefix, limit) {
  const out = [];
  if (newPrefix < prefix || newPrefix > 32) return out;
  const size = Math.pow(2, 32 - newPrefix);
  const count = Math.pow(2, newPrefix - prefix);
  const base = (network & pgMaskFromPrefix(prefix)) >>> 0;
  for (let i = 0; i < count && i < (limit || 64); i += 1) out.push(pgSubnetInfo((base + i * size) >>> 0, newPrefix));
  return out;
}

// Decomposes the inclusive address range [start, end] into aligned CIDR blocks.
function pgRangeToBlocks(start, end) {
  const blocks = [];
  let cur = start;
  while (cur <= end) {
    let size = 1;
    // grow while still aligned and inside the range
    while (cur % (size * 2) === 0 && cur + size * 2 - 1 <= end && size * 2 <= 4294967296) size *= 2;
    blocks.push({ network: cur, prefix: 32 - Math.round(Math.log2(size)), size });
    cur += size;
  }
  return blocks;
}

function pgPrefixForHosts(hosts) {
  const need = Math.max(2, Number(hosts)) + 2; // + network and broadcast; a /30 is the smallest ordinary subnet
  const bits = Math.ceil(Math.log2(need));
  return 32 - bits;
}

// VLSM planner: biggest requirement first, each block aligned to its own size.
function pgVlsmPlan(baseIp, basePrefix, requests) {
  const baseInfo = pgSubnetInfo(baseIp, basePrefix);
  const start = baseInfo.network;
  const end = baseInfo.broadcast;
  const warnings = [];
  if (baseInfo.network !== baseIp) warnings.push(`${pgIpToString(baseIp)} is not the start of a /${basePrefix}; the plan starts from ${baseInfo.networkText}.`);
  const reqs = requests
    .map((r, i) => ({ name: String(r.name || `Group ${i + 1}`), hosts: Math.floor(Number(r.hosts)), order: i }))
    .filter((r) => r.hosts >= 1);
  const sized = reqs.map((r) => ({ ...r, prefix: pgPrefixForHosts(r.hosts) }));
  sized.sort((a, b) => a.prefix - b.prefix || a.order - b.order);
  let cursor = start;
  const allocations = [];
  const unplaced = [];
  sized.forEach((r) => {
    const size = Math.pow(2, 32 - r.prefix);
    const aligned = Math.ceil(cursor / size) * size;
    if (r.prefix < basePrefix || aligned + size - 1 > end) { unplaced.push(r); return; }
    const info = pgSubnetInfo(aligned, r.prefix);
    allocations.push({ ...r, info, spare: info.usable - r.hosts });
    cursor = aligned + size;
  });
  const free = cursor <= end ? pgRangeToBlocks(cursor, end).map((b) => ({ ...b, text: `${pgIpToString(b.network)}/${b.prefix}` })) : [];
  const usedAddresses = allocations.reduce((s, a) => s + a.info.total, 0);
  const neededHosts = allocations.reduce((s, a) => s + a.hosts, 0);
  return {
    base: baseInfo, allocations, unplaced, free, warnings, usedAddresses, neededHosts,
    spareHosts: allocations.reduce((s, a) => s + a.spare, 0),
    utilisation: usedAddresses ? Math.round((neededHosts / usedAddresses) * 100) : 0,
  };
}

/* ---- IP configuration model: hosts, routers, segments, "ping" ---- */

// topology = {
//   segments: [{ id, label }],                      one layer-2 broadcast domain each
//   hosts:    [{ id, name, segment, ip, mask, gateway }],   mask: "/24" or "255.255.255.0"
//   routers:  [{ id, name, ifaces: [{ segment, ip, mask }], routes: [{ net, mask, via }] }],
// }

function pgDeviceView(dev, isRouter) {
  const ifaces = isRouter ? dev.ifaces : [{ segment: dev.segment, ip: dev.ip, mask: dev.mask, gateway: dev.gateway }];
  return ifaces.map((f, i) => {
    const ipN = pgParseIPv4(f.ip);
    const m = pgParseMask(f.mask);
    const gwN = f.gateway ? pgParseIPv4(f.gateway) : null;
    return {
      dev, isRouter, index: i, segment: f.segment, ipText: String(f.ip || '').trim(), ipN, maskText: String(f.mask || '').trim(),
      prefix: m.prefix === undefined ? null : m.prefix, maskError: m.error || null,
      gatewayText: String(f.gateway || '').trim(), gwN,
      label: isRouter ? `${dev.name} (${String(f.ip || '').trim() || 'no address'})` : dev.name,
    };
  });
}

function pgAllIfaces(topo) {
  const out = [];
  (topo.hosts || []).forEach((h) => pgDeviceView(h, false).forEach((v) => out.push(v)));
  (topo.routers || []).forEach((r) => pgDeviceView(r, true).forEach((v) => out.push(v)));
  return out;
}

function pgSegmentLabel(topo, id) {
  const s = (topo.segments || []).find((x) => x.id === id);
  return s ? s.label : id;
}

// Addresses configured on more than one interface of the same segment.
function pgDuplicateAddresses(topo) {
  const seen = {};
  const dups = [];
  pgAllIfaces(topo).forEach((v) => {
    if (v.ipN === null) return;
    const key = `${v.segment}|${v.ipN}`;
    (seen[key] = seen[key] || []).push(v);
  });
  Object.keys(seen).forEach((k) => {
    if (seen[k].length > 1) dups.push({ ip: seen[k][0].ipText, segment: seen[k][0].segment, devices: seen[k].map((v) => v.dev) });
  });
  return dups;
}

function pgFail(code, title, text, fix, deviceId, field) {
  return { code, title, text, fix, deviceId: deviceId || null, field: field || null };
}

// Who answers an ARP request for `ipN` on `segment` (excluding the asker)?
function pgArp(topo, segment, ipN, exceptDev) {
  return pgAllIfaces(topo).filter((v) => v.segment === segment && v.ipN === ipN && v.dev !== exceptDev);
}

// A router looks up a destination: longest prefix wins, connected beats nothing.
function pgRouteLookup(router, dstN) {
  const candidates = [];
  pgDeviceView(router, true).forEach((v) => {
    if (v.ipN !== null && v.prefix !== null && pgSameSubnet(v.ipN, v.prefix, dstN)) {
      candidates.push({ kind: 'connected', prefix: v.prefix, net: ((v.ipN & pgMaskFromPrefix(v.prefix)) >>> 0), iface: v });
    }
  });
  (router.routes || []).forEach((r) => {
    const netN = pgParseIPv4(r.net);
    const m = pgParseMask(r.mask);
    const viaN = pgParseIPv4(r.via);
    if (netN === null || m.prefix === undefined || viaN === null) return;
    if (((dstN & pgMaskFromPrefix(m.prefix)) >>> 0) === ((netN & pgMaskFromPrefix(m.prefix)) >>> 0)) {
      candidates.push({ kind: 'static', prefix: m.prefix, net: ((netN & pgMaskFromPrefix(m.prefix)) >>> 0), viaN, viaText: r.via });
    }
  });
  candidates.sort((a, b) => b.prefix - a.prefix || (a.kind === 'connected' ? -1 : 1));
  return candidates[0] || null;
}

// A router (or the router half of a hop) forwards a packet toward dstN.
function pgForwardAt(topo, router, dstN, dstText, ttl, steps) {
  const ifaces = pgDeviceView(router, true);
  const own = ifaces.find((v) => v.ipN === dstN);
  if (own) {
    steps.push({ ok: true, text: `${router.name} owns ${dstText} itself, so the packet is delivered to the router.` });
    return { delivered: true, atRouter: router };
  }
  if (ttl <= 0) {
    steps.push({ ok: false, text: 'The packet has been passed between routers too many times (TTL expired). The routers are probably sending it round in a circle.' });
    return { delivered: false, fail: pgFail('loop', 'Routing loop', 'The packet was forwarded around until its time-to-live ran out. Two routers point at each other for this destination.', 'Fix the static route so the next hop is the router that really is closer to the destination.', router.id, 'routes') };
  }
  const route = pgRouteLookup(router, dstN);
  if (!route) {
    steps.push({ ok: false, text: `${router.name} checks its routing table for ${dstText}: no connected network and no static route matches, so it has nowhere to send it and drops the packet (it would reply "destination net unreachable").` });
    return { delivered: false, fail: pgFail('no-route', `${router.name} has no route to ${dstText}`, `A router only forwards to networks it is directly connected to or has a route for. ${dstText} matches neither.`, `Add a route on ${router.name} for the network that contains ${dstText}, or connect that network to the router.`, router.id, 'routes') };
  }
  if (route.kind === 'connected') {
    const iface = route.iface;
    steps.push({ ok: true, text: `${router.name} looks up ${dstText}: the best match is the connected network ${pgIpToString(route.net)}/${route.prefix} on its interface ${iface.ipText}.` });
    const answers = pgArp(topo, iface.segment, dstN, router);
    if (!answers.length) {
      steps.push({ ok: false, text: `${router.name} sends an ARP request on ${pgSegmentLabel(topo, iface.segment)} for ${dstText}, but nothing answers (host unreachable).` });
      return { delivered: false, fail: pgFail('host-unreachable', `Nothing on ${pgSegmentLabel(topo, iface.segment)} owns ${dstText}`, `The router did its job and put the packet on the right network, but no device there has the address ${dstText}.`, `Check the destination's address and that it is plugged into ${pgSegmentLabel(topo, iface.segment)}.`, null, 'ip') };
    }
    steps.push({ ok: true, text: `ARP: ${answers[0].dev.name} answers for ${dstText} on ${pgSegmentLabel(topo, iface.segment)}, so the router delivers the packet to it.` });
    return { delivered: true, atDevice: answers[0].dev, duplicate: answers.length > 1, segment: iface.segment };
  }
  // static route: the next hop must itself be reachable on a connected network
  const viaIface = ifaces.find((v) => v.ipN !== null && v.prefix !== null && pgSameSubnet(v.ipN, v.prefix, route.viaN));
  steps.push({ ok: true, text: `${router.name} looks up ${dstText}: the best match is the static route ${pgIpToString(route.net)}/${route.prefix} via ${route.viaText}.` });
  if (!viaIface) {
    steps.push({ ok: false, text: `The next hop ${route.viaText} is not on any network ${router.name} is connected to, so the route cannot be used.` });
    return { delivered: false, fail: pgFail('bad-next-hop', `${router.name}'s route points at an unreachable next hop`, `A static route's next hop must be an address on a network the router is directly connected to. ${route.viaText} is not.`, 'Use the address of the neighbouring router on a shared network as the next hop.', router.id, 'routes') };
  }
  const nextHops = pgArp(topo, viaIface.segment, route.viaN, router);
  if (!nextHops.length) {
    steps.push({ ok: false, text: `${router.name} ARPs for the next hop ${route.viaText} on ${pgSegmentLabel(topo, viaIface.segment)}, but nothing answers.` });
    return { delivered: false, fail: pgFail('bad-next-hop', `Nothing answers at the next hop ${route.viaText}`, 'The static route names a next-hop address that no device on that network owns.', 'Correct the next-hop address to the neighbouring router interface.', router.id, 'routes') };
  }
  const nh = nextHops[0];
  if (!nh.isRouter) {
    steps.push({ ok: false, text: `${nh.dev.name} answers at ${route.viaText}, but it is a host, not a router, so it will not forward the packet.` });
    return { delivered: false, fail: pgFail('not-a-router', `${nh.dev.name} is not a router`, 'The next hop is an end device. Hosts do not forward packets that are not meant for them.', 'Point the route at a router interface.', router.id, 'routes') };
  }
  steps.push({ ok: true, text: `ARP: ${nh.dev.name} answers for the next hop ${route.viaText}; ${router.name} hands the packet to it.` });
  return pgForwardAt(topo, nh.dev, dstN, dstText, ttl - 1, steps);
}

// One packet leaves `src` (a host or router) for dstN. Returns { delivered, steps, fail, ... }.
function pgSendPacket(topo, src, srcIsRouter, dstN, label) {
  const steps = [];
  const dstText = pgIpToString(dstN);
  if (srcIsRouter) {
    steps.push({ ok: true, text: `${src.name} (a router) sends ${label} to ${dstText}.` });
    const r = pgForwardAt(topo, src, dstN, dstText, 8, steps);
    return { ...r, steps };
  }
  const v = pgDeviceView(src, false)[0];
  steps.push({ ok: true, text: `${src.name} (${v.ipText || 'no address'}) sends ${label} to ${dstText}.` });
  if (v.ipN === null) {
    steps.push({ ok: false, text: `${src.name} has no valid IP address ("${v.ipText}"), so it cannot send anything.` });
    return { delivered: false, steps, fail: pgFail('bad-ip', `${src.name} has no valid IP address`, `"${v.ipText}" is not a valid IPv4 address.`, 'Enter four numbers from 0 to 255, such as 192.168.1.10.', src.id, 'ip') };
  }
  if (v.prefix === null) {
    steps.push({ ok: false, text: `${src.name}'s subnet mask is not valid: ${v.maskError}` });
    return { delivered: false, steps, fail: pgFail('bad-mask', `${src.name} has an invalid subnet mask`, v.maskError, 'Use a mask such as 255.255.255.0 or /24.', src.id, 'mask') };
  }
  const info = pgSubnetInfo(v.ipN, v.prefix);
  if (info.role !== 'host') {
    steps.push({ ok: false, text: `${v.ipText} is the ${info.role} address of ${info.networkText}/${v.prefix}, so it cannot be given to a host.` });
    return { delivered: false, steps, fail: pgFail('host-address', `${src.name} uses the ${info.role} address of its subnet`, `In ${info.networkText}/${v.prefix} the address ${v.ipText} is reserved as the ${info.role} address; hosts can only use ${info.firstText} to ${info.lastText}.`, `Choose an address between ${info.firstText} and ${info.lastText}.`, src.id, 'ip') };
  }
  if (dstN === v.ipN) {
    steps.push({ ok: true, text: `${dstText} is ${src.name}'s own address, so the packet never leaves the host.` });
    return { delivered: true, steps, atDevice: src };
  }
  const onLink = pgSameSubnet(v.ipN, v.prefix, dstN);
  let nextHopN = dstN;
  let nextHopText = dstText;
  if (onLink) {
    steps.push({ ok: true, text: `${dstText} is inside ${src.name}'s own subnet (${info.networkText}/${v.prefix}, mask ${info.maskText}), so ${src.name} asks for it directly with ARP; no router is involved.` });
  } else {
    steps.push({ ok: true, text: `${dstText} is outside ${src.name}'s subnet (${info.networkText}/${v.prefix}), so it must be sent to the default gateway.` });
    if (!v.gatewayText) {
      steps.push({ ok: false, text: `${src.name} has no default gateway configured, so there is nowhere to send traffic for other networks.` });
      return { delivered: false, steps, fail: pgFail('no-gateway', `${src.name} has no default gateway`, 'A host can only talk to its own subnet unless it knows a router to hand everything else to.', `Set ${src.name}'s default gateway to the router's address on its subnet.`, src.id, 'gateway') };
    }
    if (v.gwN === null) {
      steps.push({ ok: false, text: `${src.name}'s default gateway "${v.gatewayText}" is not a valid address.` });
      return { delivered: false, steps, fail: pgFail('bad-gateway', `${src.name}'s default gateway is not a valid address`, `"${v.gatewayText}" is not a valid IPv4 address.`, 'Enter the router interface address, for example 192.168.1.1.', src.id, 'gateway') };
    }
    if (!pgSameSubnet(v.ipN, v.prefix, v.gwN)) {
      steps.push({ ok: false, text: `The default gateway ${v.gatewayText} is not inside ${src.name}'s own subnet (${info.networkText}/${v.prefix}), so ${src.name} cannot reach it to hand the packet over.` });
      return { delivered: false, steps, fail: pgFail('gateway-offsubnet', `${src.name}'s gateway is on a different subnet`, 'A host can only use a gateway it can reach directly, which means the gateway must be in the same subnet as the host.', `Change the gateway to the router's address inside ${info.networkText}/${v.prefix}.`, src.id, 'gateway') };
    }
    if (v.gwN === v.ipN) {
      steps.push({ ok: false, text: `${src.name}'s default gateway is its own address.` });
      return { delivered: false, steps, fail: pgFail('bad-gateway', `${src.name}'s gateway is its own address`, 'The gateway has to be the router, not the host itself.', 'Change the gateway to the router interface address.', src.id, 'gateway') };
    }
    nextHopN = v.gwN;
    nextHopText = v.gatewayText;
    steps.push({ ok: true, text: `${src.name} will ARP for its gateway ${nextHopText} (${pgSegmentLabel(topo, src.segment)}) and give the packet to it.` });
  }
  const answers = pgArp(topo, src.segment, nextHopN, src);
  if (!answers.length) {
    steps.push({ ok: false, text: `ARP: ${src.name} asks "who has ${nextHopText}?" on ${pgSegmentLabel(topo, src.segment)} and nobody answers, so there is no hardware address to send the frame to (the ping times out).` });
    const elsewhere = pgAllIfaces(topo).find((x) => x.ipN === nextHopN && x.segment !== src.segment);
    const hint = elsewhere
      ? ` ${nextHopText} does exist, but on ${pgSegmentLabel(topo, elsewhere.segment)}, which is a different network from ${pgSegmentLabel(topo, src.segment)}.`
      : '';
    return { delivered: false, steps, fail: pgFail('arp-timeout', onLink ? `Nobody on the local network answers for ${nextHopText}` : `Nobody answers for the gateway ${nextHopText}`, `${src.name} is on ${pgSegmentLabel(topo, src.segment)} and nothing there owns ${nextHopText}.${hint}`, onLink ? `Check ${dstText} is correct and that the destination is on the same network, with a matching mask.` : `Check the gateway address matches the router's interface on ${pgSegmentLabel(topo, src.segment)}.`, onLink ? null : src.id, onLink ? null : 'gateway') };
  }
  const first = answers[0];
  const duplicate = answers.length > 1;
  steps.push({ ok: true, text: `ARP: ${first.isRouter ? `${first.dev.name}'s interface` : first.dev.name} answers for ${nextHopText}${duplicate ? ` (but ${answers.length} devices claim this address)` : ''}.` });
  if (onLink) return { delivered: true, steps, atDevice: first.dev, duplicate };
  if (!first.isRouter) {
    steps.push({ ok: false, text: `${first.dev.name} owns ${nextHopText}, but it is an ordinary host, not a router, so it does not forward the packet.` });
    return { delivered: false, steps, fail: pgFail('not-a-router', `The gateway ${nextHopText} is not a router`, `${first.dev.name} answers at that address, but end devices do not forward traffic for other networks.`, `Set ${src.name}'s gateway to the router's address.`, src.id, 'gateway') };
  }
  const fwd = pgForwardAt(topo, first.dev, dstN, dstText, 8, steps);
  return { ...fwd, steps, duplicate: duplicate || fwd.duplicate };
}

function pgFindDevice(topo, id) {
  const h = (topo.hosts || []).find((x) => x.id === id);
  if (h) return { dev: h, isRouter: false };
  const r = (topo.routers || []).find((x) => x.id === id);
  return r ? { dev: r, isRouter: true } : null;
}

// Ping from one device to another device (by id) or to a literal address.
// Runs the echo request and, if it arrives, the echo reply from the other side.
function pgPing(topo, fromId, target) {
  const from = pgFindDevice(topo, fromId);
  if (!from) return { verdict: 'failed', legs: [], summary: 'Pick a device to ping from.', diagnosis: null, warnings: [] };
  let dstN = null;
  let dstDev = null;
  const targetDev = pgFindDevice(topo, target);
  if (targetDev) {
    dstDev = targetDev;
    const view = pgDeviceView(targetDev.dev, targetDev.isRouter)[0];
    dstN = view ? view.ipN : null;
    if (targetDev.isRouter) {
      // Pinging a router: use the interface closest to the sender's segment when possible.
      const srcView = pgDeviceView(from.dev, from.isRouter)[0];
      const own = pgDeviceView(targetDev.dev, true);
      const pick = own.find((v) => srcView && v.segment === srcView.segment) || own[0];
      dstN = pick ? pick.ipN : null;
    }
  } else {
    dstN = pgParseIPv4(target);
  }
  const legs = [];
  const warnings = [];
  if (dstN === null) {
    return { verdict: 'failed', legs, summary: 'The target is not a valid IPv4 address.', diagnosis: pgFail('bad-target', 'The address to ping is not valid', `"${target}" is not a valid IPv4 address.`, 'Enter four numbers from 0 to 255.', null, null), warnings };
  }
  const srcView = pgDeviceView(from.dev, from.isRouter)[0];
  const srcIpN = srcView ? srcView.ipN : null;
  const req = pgSendPacket(topo, from.dev, from.isRouter, dstN, 'an echo request (ping)');
  legs.push({ label: 'Echo request', delivered: !!req.delivered, steps: req.steps });
  let diagnosis = req.fail || null;
  let duplicate = !!req.duplicate;
  if (req.delivered) {
    const replier = req.atRouter ? { dev: req.atRouter, isRouter: true } : { dev: req.atDevice, isRouter: !!(req.atDevice && (topo.routers || []).includes(req.atDevice)) };
    if (replier.dev === from.dev) {
      legs[0].steps.push({ ok: true, text: 'The target is the sender itself, so there is nothing more to do.' });
    } else if (srcIpN === null) {
      legs.push({ label: 'Echo reply', delivered: false, steps: [{ ok: false, text: 'The target has no address to reply to, because the sender has no valid IP address.' }] });
      diagnosis = pgFail('reply-lost', 'The reply has nowhere to go', 'The sender has no valid IP address.', 'Fix the sender address first.', from.dev.id, 'ip');
    } else {
      const rep = pgSendPacket(topo, replier.dev, replier.isRouter, srcIpN, 'the echo reply');
      legs.push({ label: 'Echo reply', delivered: !!rep.delivered, steps: rep.steps });
      duplicate = duplicate || !!rep.duplicate;
      if (!rep.delivered) {
        diagnosis = pgFail(
          'reply-lost', `The request arrives, but the reply cannot get back to ${from.dev.name}`,
          `${replier.dev.name} received the request, but when it tried to answer: ${rep.fail ? rep.fail.text : 'the reply could not be delivered.'} A ping needs both directions to work.`,
          rep.fail ? rep.fail.fix : 'Check the return path.', rep.fail ? rep.fail.deviceId : replier.dev.id, rep.fail ? rep.fail.field : null,
        );
      }
    }
  }
  pgDuplicateAddresses(topo).forEach((d) => {
    warnings.push(`${d.ip} is configured on ${d.devices.map((x) => x.name).join(' and ')} (${pgSegmentLabel(topo, d.segment)}). Two devices with one address cause intermittent failures.`);
  });
  const ok = legs.length > 0 && legs.every((l) => l.delivered);
  let verdict = ok ? 'success' : 'failed';
  if (ok && duplicate) {
    verdict = 'unreliable';
    diagnosis = pgFail('duplicate-ip', 'Duplicate IP address', 'Two devices answered for the same address. Some packets go to one, some to the other, so the ping works only some of the time.', 'Give each device its own address.', null, 'ip');
  }
  const summary = verdict === 'success'
    ? `Reply from ${pgIpToString(dstN)}: the ping works in both directions.`
    : verdict === 'unreliable' ? `Reply from ${pgIpToString(dstN)}, but only some of the time.`
      : (diagnosis ? diagnosis.title : 'Request timed out.');
  return { verdict, legs, summary, diagnosis, warnings, dstText: pgIpToString(dstN), dstName: dstDev ? dstDev.dev.name : null };
}

// Applies a scenario's documented fix (see data/playground.py) to a copy of the topology.
function pgApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    const host = (t.hosts || []).find((x) => x.id === f.device);
    const router = (t.routers || []).find((x) => x.id === f.device);
    if (f.route && router) { router.routes = router.routes || []; router.routes.push({ ...f.route }); }
    else if (f.routeIndex !== undefined && router) router.routes[f.routeIndex][f.field] = f.value;
    else if (f.iface !== undefined && router) router.ifaces[f.iface][f.field] = f.value;
    else if (host) host[f.field] = f.value;
    else if (router) router[f.field] = f.value;
  });
  return t;
}

// Clone helper so tools can edit a copy safely.
function pgClone(x) { return JSON.parse(JSON.stringify(x)); }

/* ---- VLAN switching model ---- */

// topo = {
//   switches: [{ id, name, vlans: [10, 20], ports: [
//       { id: 'Fa0/1', mode: 'access', vlan: 10 },
//       { id: 'Gi0/1', mode: 'trunk', allowed: [10, 20], native: 1 } ] }],
//   hosts:   [{ id, name, switch, port, mac, ip, mask, gateway }],
//   links:   [{ a: { switch, port }, b: { switch, port } }],          // switch-to-switch cables
//   routers: [{ id, name, switch, port, mac, subifs: [{ vlan, ip, mask }] }],  // router on a stick
// }
// state = { mac: { <switchId>: { <vlan>: { <mac>: <portId> } } } }: the learned MAC address tables.

function pgVlanNewState() { return { mac: {} }; }

function pgVlanSwitch(topo, id) { return (topo.switches || []).find((s) => s.id === id); }
function pgVlanPort(sw, id) { return sw ? sw.ports.find((p) => p.id === id) : null; }
function pgVlanHasVlan(sw, v) { return v === 1 || (sw.vlans || []).includes(v); }
function pgVlanCarries(port, v) {
  if (!port) return false;
  return port.mode === 'trunk' ? (port.allowed || []).includes(v) : Number(port.vlan) === v;
}

function pgVlanFarEnd(topo, swId, portId) {
  for (const l of topo.links || []) {
    if (l.a.switch === swId && l.a.port === portId) return l.b;
    if (l.b.switch === swId && l.b.port === portId) return l.a;
  }
  return null;
}
function pgVlanHostAt(topo, swId, portId) { return (topo.hosts || []).find((h) => h.switch === swId && h.port === portId); }
function pgVlanRouterAt(topo, swId, portId) { return (topo.routers || []).find((r) => r.switch === swId && r.port === portId); }

// Sends one frame into the switched network and reports who received it.
// sender: { kind: 'host'|'router', id, vlan }  (vlan only for a router sub-interface).
function pgVlanDeliver(topo, state, sender, dstMac, steps, notes) {
  const BROADCAST = 'FF:FF';
  const isBroadcast = dstMac === BROADCAST;
  const receivers = [];
  const drops = notes.drops;
  const dev = sender.kind === 'host' ? (topo.hosts || []).find((h) => h.id === sender.id) : (topo.routers || []).find((r) => r.id === sender.id);
  const srcMac = dev.mac;
  const queue = [];
  const startSw = pgVlanSwitch(topo, dev.switch);
  const startPort = pgVlanPort(startSw, dev.port);
  if (!startSw || !startPort) { steps.push({ ok: false, text: `${dev.name} is not plugged into a switch port.` }); return receivers; }
  if (sender.kind === 'host' && startPort.mode === 'access' && startPort.secure) {
    const sec = startPort.secure;
    const allowed = sec.allowed || [];
    if (!allowed.includes(srcMac) && !(allowed.length < Number(sec.max || 1))) {
      const mode = sec.violation || 'shutdown';
      const effect = mode === 'shutdown' ? 'the port goes into the err-disabled state and stays down until an administrator re-enables it'
        : mode === 'restrict' ? 'the offending frames are dropped and a log message is raised, but the port stays up' : 'the offending frames are silently dropped and the port stays up';
      steps.push({ ok: false, text: `Port security on ${startSw.name} ${startPort.id} only allows ${allowed.length ? allowed.join(', ') : 'learned addresses up to its limit'}, but this frame comes from ${srcMac}. That is a violation; with violation mode "${mode}" ${effect}.` });
      drops.push({ code: 'port-security', switchId: startSw.id, portId: startPort.id, field: 'secure', title: `Port security is blocking ${dev.name} on ${startSw.name} ${startPort.id}`, text: `The port only accepts frames from the MAC addresses it was told to trust (${allowed.join(', ') || 'none yet'}). ${dev.name} uses ${srcMac}, which is not one of them, so its frames are discarded.`, fix: `If ${dev.name} is legitimate, add ${srcMac} to the allowed addresses on ${startSw.name} ${startPort.id} (or raise the maximum). If it is not, the port is doing its job.` });
      return [];
    }
  }
  queue.push({ sw: startSw, port: startPort, tag: sender.kind === 'router' ? sender.vlan : null, from: dev.name });
  const seen = {};
  while (queue.length) {
    const item = queue.shift();
    const { sw, port, tag } = item;
    let vlan;
    const portDesc = port.mode === 'trunk' ? `trunk port ${port.id}` : `access port ${port.id} (VLAN ${port.vlan})`;
    if (port.mode === 'access') {
      if (tag !== null) {
        steps.push({ ok: false, text: `${sw.name} gets a tagged frame (VLAN ${tag}) on ${portDesc}. An access port only accepts untagged frames, so it is dropped.` });
        drops.push({ code: 'access-tagged', switchId: sw.id, portId: port.id, field: 'mode', title: `${sw.name} ${port.id} is an access port, but a tagged frame arrived`, text: 'Access ports carry one VLAN without tags. A router-on-a-stick or another switch sends tagged frames and needs a trunk port.', fix: `Set ${sw.name} ${port.id} to a trunk that allows the VLANs it should carry.` });
        continue;
      }
      vlan = Number(port.vlan);
    } else {
      if (tag === null) vlan = Number(port.native);
      else vlan = tag;
      if (!(port.allowed || []).includes(vlan)) {
        steps.push({ ok: false, text: `${sw.name} gets ${tag === null ? `an untagged frame (native VLAN ${vlan})` : `a frame tagged VLAN ${vlan}`} on ${portDesc}, but VLAN ${vlan} is not in that trunk's allowed list (${(port.allowed || []).join(', ') || 'none'}), so it is dropped.` });
        drops.push({ code: 'vlan-not-allowed', switchId: sw.id, portId: port.id, field: 'allowed', title: `VLAN ${vlan} is not allowed on ${sw.name} ${port.id}`, text: `A trunk only carries the VLANs in its allowed list. VLAN ${vlan} is missing, so its traffic is dropped at this port.`, fix: `Add VLAN ${vlan} to the allowed list on ${sw.name} ${port.id} (and on the other end of the trunk).` });
        continue;
      }
    }
    if (!pgVlanHasVlan(sw, vlan)) {
      steps.push({ ok: false, text: `${sw.name} receives the frame on ${portDesc} in VLAN ${vlan}, but VLAN ${vlan} does not exist on ${sw.name}, so the frame is dropped.` });
      drops.push({ code: 'vlan-missing', switchId: sw.id, portId: port.id, field: 'vlans', title: `VLAN ${vlan} does not exist on ${sw.name}`, text: 'A switch can only forward a VLAN it knows about. Ports assigned to a missing VLAN are effectively dead until the VLAN is created.', fix: `Create VLAN ${vlan} on ${sw.name}.` });
      continue;
    }
    const key = `${sw.id}|${vlan}|${port.id}`;
    if (seen[key]) continue;
    seen[key] = true;
    // learn the source address
    state.mac[sw.id] = state.mac[sw.id] || {};
    state.mac[sw.id][vlan] = state.mac[sw.id][vlan] || {};
    const table = state.mac[sw.id][vlan];
    const learned = table[srcMac] !== port.id;
    table[srcMac] = port.id;
    const known = !isBroadcast && table[dstMac];
    let egress;
    let how;
    if (known && known !== port.id) { egress = [known]; how = `it already knows ${dstMac} is behind ${known}, so it forwards out that port only (unicast)`; }
    else if (known && known === port.id) { egress = []; how = `the destination is on the port the frame came from, so nothing is forwarded`; }
    else {
      egress = sw.ports.filter((p) => p.id !== port.id && pgVlanCarries(p, vlan)).map((p) => p.id);
      how = isBroadcast ? `it is a broadcast, so it is flooded out every other port in VLAN ${vlan}` : `${dstMac} is not in its MAC table yet, so it floods the frame out every other port in VLAN ${vlan}`;
    }
    if (!known) {
      sw.ports.forEach((p) => {
        if (p.id !== port.id && p.mode === 'trunk' && !pgVlanCarries(p, vlan) && (pgVlanFarEnd(topo, sw.id, p.id) || pgVlanRouterAt(topo, sw.id, p.id))) {
          notes.pruned.push({ vlan, code: 'vlan-not-allowed', switchId: sw.id, portId: p.id, field: 'allowed', title: `VLAN ${vlan} is not allowed on ${sw.name} ${p.id}`, text: `${sw.name} will not send VLAN ${vlan} out the trunk ${p.id} because VLAN ${vlan} is not in its allowed list (${(p.allowed || []).join(', ') || 'none'}), so devices in VLAN ${vlan} on the far side can never be reached.`, fix: `Add VLAN ${vlan} to the allowed list on ${sw.name} ${p.id} (and on the other end of the trunk).` });
        }
      });
    }
    steps.push({ ok: true, text: `${sw.name} receives it on ${portDesc}${port.mode === 'trunk' ? ` (${tag === null ? `untagged, so native VLAN ${vlan}` : `tagged VLAN ${vlan}`})` : ''}${learned ? `, learns ${srcMac} is on ${port.id}` : ''}; ${how}${egress.length ? `: ${egress.join(', ')}` : ''}.` });
    egress.forEach((pid) => {
      const q = pgVlanPort(sw, pid);
      const host = pgVlanHostAt(topo, sw.id, pid);
      const router = pgVlanRouterAt(topo, sw.id, pid);
      const far = pgVlanFarEnd(topo, sw.id, pid);
      if (host) {
        if (isBroadcast || host.mac === dstMac) receivers.push({ kind: 'host', id: host.id, vlan });
      } else if (router) {
        const outTag = q.mode === 'trunk' && vlan !== Number(q.native) ? vlan : null;
        const sub = (router.subifs || []).find((s) => Number(s.vlan) === vlan);
        if (outTag === null) {
          steps.push({ ok: false, text: `${sw.name} sends the frame to ${router.name} untagged on ${pid}, but ${router.name}'s sub-interfaces expect 802.1Q tags, so the router ignores it.` });
          drops.push({ code: 'router-untagged', switchId: sw.id, portId: pid, field: 'mode', title: `${router.name} only understands tagged frames, but ${sw.name} ${pid} sends them untagged`, text: `${router.name} uses one sub-interface per VLAN (router on a stick), so the switch port facing it must be a trunk so the VLAN tag is kept.`, fix: `Make ${sw.name} ${pid} a trunk that allows the VLANs ${router.name} routes.` });
        } else if (!sub) {
          steps.push({ ok: false, text: `${router.name} gets the frame tagged VLAN ${vlan}, but it has no sub-interface for VLAN ${vlan}, so it ignores it.` });
        } else if (isBroadcast || router.mac === dstMac) receivers.push({ kind: 'router', id: router.id, vlan });
      } else if (far) {
        const outTag = q.mode === 'trunk' && vlan !== Number(q.native) ? vlan : null;
        const farSw = pgVlanSwitch(topo, far.switch);
        const farPort = pgVlanPort(farSw, far.port);
        if (farSw && farPort) {
          if (q.mode === 'trunk' && farPort.mode === 'trunk' && Number(q.native) !== Number(farPort.native)) {
            notes.warnings.push({ code: 'native-mismatch', switchId: sw.id, portId: pid, field: 'native', title: 'Native VLAN mismatch on the trunk', text: `${sw.name} ${pid} says the native VLAN is ${q.native}, but ${farSw.name} ${far.port} says ${farPort.native}. Untagged frames from one side land in a different VLAN on the other (VLAN hopping risk, and broken connectivity for native-VLAN traffic).`, fix: `Set the native VLAN to the same value on both ends of the trunk.` });
          }
          queue.push({ sw: farSw, port: farPort, tag: outTag, from: sw.name });
        }
      }
    });
  }
  const uniq = [];
  receivers.forEach((r) => { if (!uniq.some((u) => u.kind === r.kind && u.id === r.id && u.vlan === r.vlan)) uniq.push(r); });
  return uniq;
}

function pgVlanHostView(h) {
  const ipN = pgParseIPv4(h.ip);
  const m = pgParseMask(h.mask);
  const gwN = h.gateway ? pgParseIPv4(h.gateway) : null;
  return { ipN, prefix: m.prefix === undefined ? null : m.prefix, gwN, gwText: String(h.gateway || '').trim() };
}

function pgVlanOf(topo, host) {
  const sw = pgVlanSwitch(topo, host.switch);
  const p = pgVlanPort(sw, host.port);
  return p && p.mode === 'access' ? Number(p.vlan) : (p ? Number(p.native) : null);
}

// A host sends an IP packet toward dstN: ARP for the next hop, then the data frame; a router in the path forwards it.
function pgVlanSendIp(topo, state, host, dstN, label, legs, notes) {
  const v = pgVlanHostView(host);
  const dstText = pgIpToString(dstN);
  const steps0 = [];
  const mk = (l, delivered, steps) => legs.push({ label: `${label}: ${l}`, delivered, steps });
  if (v.ipN === null || v.prefix === null) {
    mk('configuration', false, [{ ok: false, text: `${host.name} has no valid IP address or mask.` }]);
    return { delivered: false, fail: pgFail('bad-ip', `${host.name} has no valid IP configuration`, 'The address or mask is not valid.', 'Enter a valid address and mask.', host.id, 'ip') };
  }
  const onLink = pgSameSubnet(v.ipN, v.prefix, dstN);
  let nextHop = dstN;
  if (!onLink) {
    if (!v.gwText) { mk('routing decision', false, [{ ok: false, text: `${dstText} is outside ${host.name}'s subnet and ${host.name} has no default gateway.` }]); return { delivered: false, fail: pgFail('no-gateway', `${host.name} has no default gateway`, 'To reach another VLAN\'s subnet a host needs a gateway: the router interface for its own VLAN.', 'Set the default gateway to the router\'s address in this VLAN.', host.id, 'gateway') }; }
    if (v.gwN === null || !pgSameSubnet(v.ipN, v.prefix, v.gwN)) { mk('routing decision', false, [{ ok: false, text: `${host.name}'s gateway ${v.gwText} is not inside its own subnet.` }]); return { delivered: false, fail: pgFail('gateway-offsubnet', `${host.name}'s gateway is not in its subnet`, 'The gateway must be an address in the host\'s own subnet.', 'Use the router interface address for this VLAN.', host.id, 'gateway') }; }
    nextHop = v.gwN;
  }
  steps0.push({ ok: true, text: onLink ? `${dstText} is in ${host.name}'s own subnet, so ${host.name} ARPs for it directly.` : `${dstText} is in another subnet, so ${host.name} ARPs for its default gateway ${pgIpToString(nextHop)}.` });
  // ARP request: broadcast; the owner of nextHop must receive it
  const arpSteps = steps0.slice();
  const owners = [];
  (topo.hosts || []).forEach((h) => { if (h.id !== host.id && pgParseIPv4(h.ip) === nextHop) owners.push({ kind: 'host', dev: h }); });
  (topo.routers || []).forEach((r) => (r.subifs || []).forEach((s) => { if (pgParseIPv4(s.ip) === nextHop) owners.push({ kind: 'router', dev: r, sub: s }); }));
  const before = notes.drops.length;
  const rx = pgVlanDeliver(topo, state, { kind: 'host', id: host.id }, 'FF:FF', arpSteps, notes);
  const owner = owners.find((o) => rx.some((r) => r.kind === o.kind && r.id === o.dev.id));
  if (!owner) {
    arpSteps.push({ ok: false, text: `Nobody that owns ${pgIpToString(nextHop)} receives the ARP request, so ${host.name} never learns its hardware address.` });
    mk('ARP request', false, arpSteps);
    const needsRouter = owners.some((o) => o.kind === 'router');
    const drop = notes.drops.slice(before).find((d) => d.code !== 'router-untagged' || needsRouter);
    const warn = notes.warnings[0];
    const hostVlan = pgVlanOf(topo, host);
    const ownerVlans = owners.map((o) => (o.kind === 'host' ? pgVlanOf(topo, o.dev) : (o.sub ? Number(o.sub.vlan) : null)));
    const pruned = notes.pruned.find((p) => p.vlan === hostVlan);
    let fail;
    if (!owners.length) fail = pgFail('arp-timeout', `Nothing owns ${pgIpToString(nextHop)}`, `No device in this network has the address ${pgIpToString(nextHop)}.`, onLink ? 'Check the destination address.' : `Check the gateway address against the router's sub-interface.`, host.id, onLink ? null : 'gateway');
    else if (warn && warn.code === 'native-mismatch') fail = pgFail(warn.code, warn.title, warn.text, warn.fix, null, warn.field);
    else if (drop) fail = pgFail(drop.code, drop.title, drop.text, drop.fix, null, drop.field);
    else if (pruned) fail = pgFail(pruned.code, pruned.title, pruned.text, pruned.fix, null, pruned.field);
    else if (warn) fail = pgFail(warn.code, warn.title, warn.text, warn.fix, null, warn.field);
    else fail = pgFail('vlan-mismatch', `${host.name} and ${owners[0].dev.name} are in different VLANs`, `${host.name} is in VLAN ${hostVlan} and ${owners[0].dev.name} is in VLAN ${ownerVlans[0]}. Each VLAN is its own broadcast domain, so the ARP broadcast never crosses between them. Hosts in different VLANs can only talk through a router.`, `Put both ports in the same VLAN, or route between the VLANs.`, null, 'vlan');
    if (pruned && fail.code === 'vlan-not-allowed') arpSteps.push({ ok: false, text: pruned.text });
    const src = fail.code === 'native-mismatch' ? warn : fail.code === 'vlan-not-allowed' && !drop ? pruned : drop || null;
    fail.where = src ? { switchId: src.switchId, portId: src.portId } : null;
    return { delivered: false, fail };
  }
  arpSteps.push({ ok: true, text: `${owner.dev.name} receives the ARP request and answers with its hardware address.` });
  // ARP reply (unicast back)
  const replySender = owner.kind === 'host' ? { kind: 'host', id: owner.dev.id } : { kind: 'router', id: owner.dev.id, vlan: Number(owner.sub.vlan) };
  const rrx = pgVlanDeliver(topo, state, replySender, host.mac, arpSteps, notes);
  if (!rrx.some((r) => r.kind === 'host' && r.id === host.id)) {
    arpSteps.push({ ok: false, text: `The ARP reply never reaches ${host.name}.` });
    mk('ARP', false, arpSteps);
    const drop = notes.drops[notes.drops.length - 1];
    return { delivered: false, fail: drop ? pgFail(drop.code, drop.title, drop.text, drop.fix, null, drop.field) : pgFail('reply-lost', 'The ARP reply cannot get back', 'The answer takes a different path that does not work.', 'Check the trunk and VLAN settings on the return path.', null, null) };
  }
  mk('ARP', true, arpSteps);
  // data frame to the owner
  const dataSteps = [{ ok: true, text: `${host.name} sends the packet in a frame addressed to ${owner.dev.name}'s hardware address.` }];
  const drx = pgVlanDeliver(topo, state, { kind: 'host', id: host.id }, owner.dev.mac, dataSteps, notes);
  if (!drx.some((r) => r.kind === owner.kind && r.id === owner.dev.id)) {
    mk('frame', false, dataSteps);
    const drop = notes.drops[notes.drops.length - 1];
    return { delivered: false, fail: drop ? pgFail(drop.code, drop.title, drop.text, drop.fix, null, drop.field) : pgFail('frame-lost', 'The frame is not delivered', 'The frame did not reach the next hop.', 'Check VLAN and trunk settings.', null, null) };
  }
  if (owner.kind === 'host') { dataSteps.push({ ok: true, text: `${owner.dev.name} receives the packet.` }); mk('frame', true, dataSteps); return { delivered: true, atHost: owner.dev }; }
  // router forwards
  const router = owner.dev;
  dataSteps.push({ ok: true, text: `${router.name} receives it on its VLAN ${owner.sub.vlan} sub-interface (${owner.sub.ip}) and looks up ${dstText}.` });
  const out = (router.subifs || []).find((s) => { const ip = pgParseIPv4(s.ip); const m = pgParseMask(s.mask); return ip !== null && m.prefix !== undefined && pgSameSubnet(ip, m.prefix, dstN); });
  if (!out) {
    dataSteps.push({ ok: false, text: `${router.name} has no sub-interface in the network that contains ${dstText}, so it has no route and drops the packet.` });
    mk('routing', false, dataSteps);
    return { delivered: false, fail: pgFail('no-route', `${router.name} has no route to ${dstText}`, 'A router-on-a-stick can only route between the VLAN subnets it has sub-interfaces for.', `Add a sub-interface on ${router.name} for the VLAN that holds ${dstText}.`, router.id, 'subifs') };
  }
  dataSteps.push({ ok: true, text: `${dstText} is in the connected network of the VLAN ${out.vlan} sub-interface, so ${router.name} sends it out the same port again, tagged VLAN ${out.vlan}.` });
  // ARP for the destination, from the router, on the out VLAN
  const target = (topo.hosts || []).find((h) => pgParseIPv4(h.ip) === dstN);
  const rs = { kind: 'router', id: router.id, vlan: Number(out.vlan) };
  const arx = pgVlanDeliver(topo, state, rs, 'FF:FF', dataSteps, notes);
  if (!target || !arx.some((r) => r.kind === 'host' && r.id === target.id)) {
    dataSteps.push({ ok: false, text: `${router.name} asks "who has ${dstText}?" on VLAN ${out.vlan} and gets no answer.` });
    mk('forwarding', false, dataSteps);
    const drop = notes.drops[notes.drops.length - 1];
    return { delivered: false, fail: drop ? pgFail(drop.code, drop.title, drop.text, drop.fix, null, drop.field) : pgFail('host-unreachable', `Nothing in VLAN ${out.vlan} answers for ${dstText}`, `${router.name} routed the packet correctly but the destination is not reachable in VLAN ${out.vlan}.`, 'Check the destination host\'s VLAN and address.', target ? target.id : null, 'vlan') };
  }
  const fx = pgVlanDeliver(topo, state, { kind: 'host', id: target.id }, router.mac, dataSteps, notes);
  const fwd = pgVlanDeliver(topo, state, rs, target.mac, dataSteps, notes);
  if (!fwd.some((r) => r.kind === 'host' && r.id === target.id)) {
    mk('forwarding', false, dataSteps);
    return { delivered: false, fail: pgFail('frame-lost', 'The routed frame is not delivered', 'The frame did not reach the destination in its VLAN.', 'Check the destination port and trunk.', null, null) };
  }
  dataSteps.push({ ok: true, text: `${target.name} receives the packet.` });
  mk('frame', true, dataSteps);
  return { delivered: true, atHost: target };
}

// Ping between two hosts on the switched network (request, then reply).
function pgVlanPing(topo, state, fromId, toId) {
  const st = pgClone(state || pgVlanNewState());
  const from = (topo.hosts || []).find((h) => h.id === fromId);
  const to = (topo.hosts || []).find((h) => h.id === toId);
  const legs = [];
  const notes = { drops: [], warnings: [], pruned: [] };
  if (!from || !to) return { verdict: 'failed', legs, summary: 'Pick two hosts.', diagnosis: null, state: st, warnings: [] };
  const dstN = pgParseIPv4(to.ip);
  if (dstN === null) return { verdict: 'failed', legs, summary: `${to.name} has no valid IP address.`, diagnosis: pgFail('bad-ip', `${to.name} has no valid IP address`, 'The address is not valid.', 'Enter a valid address.', to.id, 'ip'), state: st, warnings: [] };
  const srcN = pgParseIPv4(from.ip);
  const req = pgVlanSendIp(topo, st, from, dstN, 'Echo request', legs, notes);
  let diagnosis = req.fail || null;
  if (req.delivered && srcN !== null) {
    const rep = pgVlanSendIp(topo, st, to, srcN, 'Echo reply', legs, notes);
    if (!rep.delivered && rep.fail) diagnosis = pgFail('reply-lost', `The request arrives, but ${to.name}'s reply cannot get back`, `${rep.fail.text} A ping needs both directions to work.`, rep.fail.fix, rep.fail.deviceId, rep.fail.field);
    if (!rep.delivered && rep.fail) diagnosis.where = rep.fail.where || null;
  }
  const ok = !diagnosis;
  const warnings = [];
  const seenW = {};
  notes.warnings.forEach((w) => { if (!seenW[w.code + w.switchId]) { seenW[w.code + w.switchId] = 1; warnings.push(`${w.title}: ${w.text}`); } });
  return { verdict: ok ? 'success' : 'failed', legs, diagnosis, warnings, state: st, summary: ok ? `Reply from ${pgIpToString(dstN)}: the ping works in both directions.` : diagnosis.title };
}

// Applies a VLAN scenario's documented fix to a copy of the topology.
function pgVlanApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    const sw = (t.switches || []).find((x) => x.id === f.device);
    const host = (t.hosts || []).find((x) => x.id === f.device);
    const router = (t.routers || []).find((x) => x.id === f.device);
    if (f.subif && router) router.subifs.push({ ...f.subif });
    else if (sw && f.port) { const p = sw.ports.find((x) => x.id === f.port); if (p) p[f.field] = f.value; }
    else if (sw) sw[f.field] = f.value;
    else if (host) host[f.field] = f.value;
    else if (router) router[f.field] = f.value;
  });
  return t;
}

/* ---- Firewall and port forwarding ---- */

// topo = {
//   fw: { name, stateful, masquerade, hairpin,
//         ifaces: [{ zone: 'inside'|'dmz'|'outside', ip, mask }],
//         rules: [{ id, action: 'allow'|'deny', fromZone: 'any'|zone, toZone: 'any'|zone, proto: 'any'|'tcp'|'udp'|'icmp',
//                   src: 'any'|'a.b.c.d[/n]', dst: 'any'|'a.b.c.d[/n]', port: 'any'|'443'|'1024-65535' }],
//         forwards: [{ id, proto, extPort, toIp, toPort }] },
//   hosts: [{ id, name, zone, ip, services: [{ proto, port }] }],
// }
// Rules are matched top to bottom; the first match wins; nothing matching is an implicit deny. Rules are
// matched against the address after port-forward translation (the "real" inside address).

const PG_FW_EPHEMERAL = 49152;

function pgFwOutsideIp(fw) {
  const f = (fw.ifaces || []).find((x) => x.zone === 'outside');
  return f ? pgParseIPv4(f.ip) : null;
}

function pgFwInCidr(spec, ipN) {
  const s = String(spec || 'any').trim();
  if (s === '' || s.toLowerCase() === 'any') return true;
  const [a, len] = s.split('/');
  const base = pgParseIPv4(a);
  if (base === null) return false;
  const prefix = len === undefined ? 32 : Number(len);
  if (!(prefix >= 0 && prefix <= 32)) return false;
  return pgSameSubnet(base, prefix, ipN);
}

function pgFwPortMatch(spec, port) {
  const s = String(spec == null ? 'any' : spec).trim().toLowerCase();
  if (s === '' || s === 'any') return true;
  if (port === null || port === undefined) return false;
  const m = /^(\d+)(?:-(\d+))?$/.exec(s);
  if (!m) return false;
  const lo = Number(m[1]);
  const hi = m[2] === undefined ? lo : Number(m[2]);
  return port >= lo && port <= hi;
}

function pgFwRuleText(r) {
  const z = (x) => (x === 'any' ? 'any zone' : x);
  const p = r.proto === 'any' ? 'any protocol' : r.proto.toUpperCase();
  const port = String(r.port || 'any').toLowerCase() === 'any' || r.proto === 'icmp' ? '' : ` port ${r.port}`;
  return `${r.action === 'allow' ? 'Allow' : 'Deny'} ${p}${port} from ${z(r.fromZone)} (${r.src || 'any'}) to ${z(r.toZone)} (${r.dst || 'any'})`;
}

function pgFwEvaluate(fw, pkt) {
  for (let i = 0; i < (fw.rules || []).length; i += 1) {
    const r = fw.rules[i];
    if (r.fromZone !== 'any' && r.fromZone !== pkt.srcZone) continue;
    if (r.toZone !== 'any' && r.toZone !== pkt.dstZone) continue;
    if (r.proto !== 'any' && r.proto !== pkt.proto) continue;
    if (!pgFwInCidr(r.src, pkt.srcIp)) continue;
    if (!pgFwInCidr(r.dst, pkt.dstIp)) continue;
    if (pkt.proto === 'icmp') { if (String(r.port || 'any').toLowerCase() !== 'any') continue; }
    else if (!pgFwPortMatch(r.port, pkt.dstPort)) continue;
    return { rule: r, index: i };
  }
  return null;
}

// One connection attempt through the firewall.
// conn = { from: hostId, to: hostId | 'fw-public' | '<ipv4>', proto, port }
function pgFwTest(topo, conn) {
  const fw = topo.fw;
  const steps = [];
  let matched = null;
  const fail = (code, title, text, fix, field, ruleId) => ({ verdict: 'failed', steps, diagnosis: { code, title, text, fix, field: field || null, ruleId: ruleId || null }, summary: title, matched });
  const src = (topo.hosts || []).find((h) => h.id === conn.from);
  if (!src) return { verdict: 'failed', steps, diagnosis: null, summary: 'Pick a source host.' };
  const srcN = pgParseIPv4(src.ip);
  const proto = conn.proto;
  let port = proto === 'icmp' ? null : Number(conn.port);
  if (proto !== 'icmp' && !(port >= 1 && port <= 65535)) return { verdict: 'failed', steps, diagnosis: pgFail('bad-port', 'Not a valid port', 'A TCP or UDP port is a number from 1 to 65535.', 'Enter a port number.'), summary: 'Not a valid port' };
  const pubN = pgFwOutsideIp(fw);
  let dstN = null;
  let dst = null;
  const toPublic = conn.to === 'fw-public' || (pubN !== null && pgParseIPv4(conn.to) === pubN);
  const portText = proto === 'icmp' ? '' : ` port ${port}`;
  if (toPublic) {
    dstN = pubN;
    steps.push({ ok: true, text: `${src.name} (${src.ip}) connects to the firewall's public address ${pgIpToString(pubN)} using ${proto.toUpperCase()}${portText}.` });
  } else {
    dst = (topo.hosts || []).find((h) => h.id === conn.to) || (topo.hosts || []).find((h) => pgParseIPv4(h.ip) === pgParseIPv4(conn.to));
    if (!dst) return fail('no-host', 'Nothing has that address', 'No device in this network owns the destination address.', 'Pick one of the listed hosts.');
    dstN = pgParseIPv4(dst.ip);
    steps.push({ ok: true, text: `${src.name} (${src.ip}) connects to ${dst.name} (${dst.ip}) using ${proto.toUpperCase()}${portText}.` });
  }
  let dstZone = dst ? dst.zone : 'outside';
  let dstPort = port;
  let dstIp = dstN;
  // Port forwarding (destination NAT) on the public address.
  if (toPublic) {
    const f = (fw.forwards || []).find((x) => x.proto === proto && Number(x.extPort) === port);
    if (!f || proto === 'icmp') {
      steps.push({ ok: false, text: `The firewall has no port-forward for ${proto.toUpperCase()}${portText} on its public address, so it has nothing to hand this connection to and drops it (the firewall itself offers no such service).` });
      return fail('no-forward', 'No port forward matches', `Traffic to the public address is only passed on if a port-forward maps that port to an inside server. None exists for ${proto.toUpperCase()}${portText}.`, 'Add a port forward from this external port to the inside server, then allow it in the rules.', 'forwards');
    }
    const target = (topo.hosts || []).find((h) => pgParseIPv4(h.ip) === pgParseIPv4(f.toIp));
    steps.push({ ok: true, text: `Port forward matched: ${proto.toUpperCase()} ${f.extPort} on the public address is translated to ${f.toIp}:${f.toPort} (destination NAT).` });
    if (!target) {
      steps.push({ ok: false, text: `Nothing on the network owns ${f.toIp}, so the translated packet has nowhere to go.` });
      return fail('forward-target-missing', `The port forward points at ${f.toIp}, where nothing lives`, 'The forward translates the destination to an inside address, but no device has that address (a typo, or the server was renumbered).', 'Correct the "forward to" address to the real server.', 'forwards');
    }
    dst = target; dstIp = pgParseIPv4(f.toIp); dstPort = Number(f.toPort); dstZone = target.zone;
    port = port;
  }
  if (src.zone === dstZone && toPublic) {
    // Hairpin: an inside client using the public address of an inside server.
    steps.push({ ok: true, text: `${src.name} and ${dst.name} are in the same zone (${src.zone}), but ${src.name} used the public address, so the packet still goes to the firewall first.` });
    if (!fw.hairpin) {
      steps.push({ ok: false, text: `The firewall translates the destination to ${dst.name} but leaves the source as ${src.ip}. ${dst.name} sees a client on its own network and replies directly, bypassing the firewall. ${src.name} receives a reply from ${dst.ip} when it expected one from ${pgIpToString(pubN)}, and discards it.` });
      return fail('hairpin', 'Hairpin (loopback) NAT is missing', 'The client and the server are on the same network, but the client used the public address. Without hairpin NAT the reply skips the firewall and arrives from the wrong address, so the connection never completes.', 'Turn on hairpin NAT (NAT reflection), or use split-horizon DNS so inside clients get the server\'s inside address.', 'hairpin');
    }
    steps.push({ ok: true, text: 'Hairpin NAT is on: the firewall also rewrites the source to its own address, so the server replies through it and the client sees the reply it expects.' });
  } else if (src.zone === dstZone) {
    steps.push({ ok: true, text: `${src.name} and ${dst.name} are both in the ${src.zone} zone: the packet is switched locally and never reaches the firewall, so no rule is applied.` });
  } else {
    // Zone rules
    if (src.zone === 'outside' && dstZone !== 'outside' && !toPublic) {
      steps.push({ ok: false, text: `${dst.ip} is a private address. Routers on the internet do not forward private (RFC 1918) addresses, so a connection from the outside cannot be aimed at it directly.` });
      return fail('private-unroutable', 'The internet cannot reach a private address', 'Inside servers use private addresses. Outside clients must connect to the firewall\'s public address, and a port forward carries the traffic in.', 'Connect to the firewall\'s public address instead, with a port forward for the service.');
    }
    const pkt = { proto, srcIp: srcN, srcZone: src.zone, dstIp, dstZone, dstPort };
    const hit = pgFwEvaluate(fw, pkt);
    if (!hit) {
      steps.push({ ok: false, text: `Rules, top to bottom: no rule matches ${src.zone} → ${dstZone}, ${proto.toUpperCase()}${dstPort ? ` port ${dstPort}` : ''} to ${pgIpToString(dstIp)}. The implicit deny at the end of every rule list drops the packet.` });
      return fail('implicit-deny', 'No rule allows this traffic (implicit deny)', 'A firewall denies anything that no rule explicitly allows. Nothing here matches this connection.', 'Add an allow rule for this source, destination and port.', 'rules');
    }
    matched = hit.rule.id;
    steps.push({ ok: hit.rule.action === 'allow', text: `Rule ${hit.index + 1} matches first: ${pgFwRuleText(hit.rule)}. ${hit.rule.action === 'allow' ? 'The packet is allowed.' : 'The packet is dropped.'}` });
    if (hit.rule.action !== 'allow') {
      const later = (fw.rules || []).slice(hit.index + 1).findIndex((r) => r.action === 'allow' && (() => { const h2 = pgFwEvaluate({ rules: [r] }, pkt); return !!h2; })());
      return { ...fail('rule-denied', `Rule ${hit.index + 1} denies this traffic`, later >= 0 ? `Rules are checked top to bottom and the first match wins. Rule ${hit.index + 1} matches and denies the packet before rule ${hit.index + 2 + later}, which would have allowed it, is ever looked at.` : `Rule ${hit.index + 1} matches and denies the connection.`, later >= 0 ? 'Move the more specific allow rule above the broader deny rule.' : 'Change or remove the deny rule, or add an allow rule above it.', 'rules', hit.rule.id), orderProblem: later >= 0 };
    }
    // Return path
    if (fw.stateful) {
      steps.push({ ok: true, text: 'The firewall is stateful: it records this connection, so the reply is allowed back automatically without needing its own rule.' });
    } else {
      const back = { proto, srcIp: dstIp, srcZone: dstZone, dstIp: srcN, dstZone: src.zone, dstPort: PG_FW_EPHEMERAL };
      const bhit = pgFwEvaluate(fw, back);
      if (!bhit || bhit.rule.action !== 'allow') {
        steps.push({ ok: false, text: `The firewall is stateless, so the reply is judged as a brand-new packet from ${dstZone} to ${src.zone} (to a high port such as ${PG_FW_EPHEMERAL}). ${bhit ? `Rule ${bhit.index + 1} denies it.` : 'No rule allows it, so the implicit deny drops it.'}` });
        return fail('return-blocked', 'The request is allowed, but the reply is blocked', 'A stateless filter does not remember connections. The return traffic needs its own allow rule (for example established or high ports back to the client), or the firewall must be stateful.', 'Make the firewall stateful, or add a rule that allows the replies back.', 'stateful');
      }
      steps.push({ ok: true, text: `Stateless firewall: the reply is checked separately and rule ${bhit.index + 1} allows it.` });
    }
    // Source NAT toward the internet
    if (dstZone === 'outside' && src.zone !== 'outside') {
      if (fw.masquerade) steps.push({ ok: true, text: `Source NAT (masquerade): ${src.ip} is rewritten to the firewall's public address ${pgIpToString(pubN)}, so replies can find their way back.` });
      else {
        steps.push({ ok: false, text: `${src.ip} is a private address and the firewall is not translating it. The packet leaves with a private source, which internet routers drop or which no reply can ever be routed back to.` });
        return fail('no-nat', 'Private addresses are not being translated', 'Hosts using private addresses reach the internet only through source NAT (masquerade / PAT), which swaps the private address for the public one.', 'Turn on source NAT (masquerade) for outbound traffic.', 'masquerade');
      }
    }
  }
  // The service on the destination
  if (proto === 'icmp') {
    steps.push({ ok: true, text: `${dst.name} answers the ping.` });
    return { verdict: 'success', steps, diagnosis: null, summary: `${dst.name} answered: the connection works.`, matched };
  }
  const listens = (dst.services || []).some((s) => s.proto === proto && Number(s.port) === dstPort);
  if (!listens) {
    steps.push({ ok: false, text: `The packet reaches ${dst.name}, but nothing there is listening on ${proto.toUpperCase()} port ${dstPort}, so it answers "connection refused" (a reset). The firewall let it through; the service is not there.` });
    return fail('refused', `${dst.name} is not listening on port ${dstPort}`, 'The firewall and the network are fine: the packet arrived and the host refused it because no service uses that port. This is different from a firewall drop, which usually just times out.', toPublic ? 'Make the port forward point at the port the server really listens on.' : 'Connect to the port the service uses.', toPublic ? 'forwards' : null);
  }
  steps.push({ ok: true, text: `${dst.name} is listening on ${proto.toUpperCase()} ${dstPort} and accepts the connection.` });
  return { verdict: 'success', steps, diagnosis: null, summary: `Connected to ${dst.name} on ${proto.toUpperCase()} ${dstPort}.`, matched };
}

// Applies a scenario's documented fix. fix entries: { field: 'stateful'|'masquerade'|'hairpin', value },
// { rules: [...] } (replace the rule list), { addRule: {...} }, { addForward: {...} }, { forward: id, field, value }.
function pgFwApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.rules) t.fw.rules = pgClone(f.rules);
    else if (f.addRule) t.fw.rules.push({ ...f.addRule });
    else if (f.addForward) t.fw.forwards.push({ ...f.addForward });
    else if (f.forward) { const x = t.fw.forwards.find((y) => y.id === f.forward); if (x) x[f.field] = f.value; }
    else if (f.field) t.fw[f.field] = f.value;
  });
  return t;
}

/* ---- IPv6 (BigInt arithmetic: an address is a 128-bit integer) ---- */

function pgParseIPv6(text) {
  const s = String(text == null ? '' : text).trim().toLowerCase();
  if (!s || /[^0-9a-f:.]/.test(s) || s.includes(':::')) return null;
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const toGroups = (part) => {
    if (part === '') return [];
    const groups = part.split(':');
    const out = [];
    for (let i = 0; i < groups.length; i += 1) {
      const g = groups[i];
      if (g.includes('.')) {
        if (i !== groups.length - 1) return null;
        const v4 = pgParseIPv4(g);
        if (v4 === null) return null;
        out.push((v4 >>> 16).toString(16), (v4 & 0xFFFF).toString(16));
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
        out.push(g);
      }
    }
    return out;
  };
  const head = toGroups(halves[0]);
  const tail = halves.length === 2 ? toGroups(halves[1]) : [];
  if (head === null || tail === null) return null;
  let groups;
  if (halves.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null;
    groups = head.concat(new Array(missing).fill('0'), tail);
  } else {
    if (head.length !== 8) return null;
    groups = head;
  }
  let n = 0n;
  groups.forEach((g) => { n = (n << 16n) | BigInt(parseInt(g, 16)); });
  return n;
}

function pgIPv6Groups(n) {
  const out = [];
  for (let i = 7; i >= 0; i -= 1) out.push(Number((n >> BigInt(i * 16)) & 0xFFFFn));
  return out;
}

function pgIPv6Expand(n) { return pgIPv6Groups(n).map((g) => g.toString(16).padStart(4, '0')).join(':'); }

// RFC 5952: lower case, no leading zeros, the longest run of two or more zero groups becomes "::".
function pgIPv6Compress(n) {
  const g = pgIPv6Groups(n);
  let best = { start: -1, len: 0 };
  for (let i = 0; i < 8;) {
    if (g[i] !== 0) { i += 1; continue; }
    let j = i;
    while (j < 8 && g[j] === 0) j += 1;
    if (j - i > best.len) best = { start: i, len: j - i };
    i = j;
  }
  const hex = g.map((x) => x.toString(16));
  if (best.len < 2) return hex.join(':');
  const left = hex.slice(0, best.start).join(':');
  const right = hex.slice(best.start + best.len).join(':');
  return `${left}::${right}`;
}

function pgV6Mask(prefix) {
  if (prefix <= 0) return 0n;
  return ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
}

function pgV6Kind(n) {
  const top = (bits, len) => n >> BigInt(128 - len) === BigInt(bits);
  if (n === 0n) return { key: 'unspecified', label: 'The unspecified address (::), used before a host has an address' };
  if (n === 1n) return { key: 'loopback', label: 'Loopback (::1), the device talking to itself' };
  if (top(0xFFFF, 96) || (n >> 32n) === 0xFFFFn) return { key: 'mapped', label: 'IPv4-mapped address (::ffff:0:0/96), an IPv4 address carried in IPv6 form' };
  if (top(0xFE80 >> 6, 10)) return { key: 'linklocal', label: 'Link-local (fe80::/10): valid only on one link, never routed; used for neighbour discovery and next hops' };
  if (top(0xFC >> 1, 7)) return { key: 'ula', label: 'Unique local address (fc00::/7), the IPv6 counterpart of private addresses' };
  if (top(0xFF, 8)) return { key: 'multicast', label: 'Multicast (ff00::/8). IPv6 has no broadcast; multicast does that job' };
  if (n >> 96n === 0x20010db8n) return { key: 'documentation', label: 'Documentation range (2001:db8::/32), reserved for examples' };
  if (top(0x2000 >> 13, 3)) return { key: 'global', label: 'Global unicast (2000::/3), routable on the internet' };
  return { key: 'reserved', label: 'Reserved or not yet allocated' };
}

function pgV6Info(ip, prefix) {
  const mask = pgV6Mask(prefix);
  const network = ip & mask;
  const last = network | ((~mask) & ((1n << 128n) - 1n));
  const hostBits = 128 - prefix;
  return {
    ip, prefix, network, last, hostBits, kind: pgV6Kind(ip),
    expanded: pgIPv6Expand(ip), compressed: pgIPv6Compress(ip),
    networkText: pgIPv6Compress(network), lastText: pgIPv6Compress(last),
    subnets64: prefix <= 64 ? (1n << BigInt(64 - prefix)) : null,
    addresses: 1n << BigInt(hostBits),
    interfaceId: ip & ((1n << 64n) - 1n),
  };
}

// The modified EUI-64 interface identifier for a MAC address, or null if the MAC is not valid.
function pgEui64(mac) {
  const hex = String(mac || '').trim().replace(/[:\-.]/g, '').toLowerCase();
  if (!/^[0-9a-f]{12}$/.test(hex)) return null;
  const b = [];
  for (let i = 0; i < 12; i += 2) b.push(parseInt(hex.slice(i, i + 2), 16));
  b[0] ^= 0x02; // flip the universal/local bit
  const bytes = [b[0], b[1], b[2], 0xFF, 0xFE, b[3], b[4], b[5]];
  let n = 0n;
  bytes.forEach((x) => { n = (n << 8n) | BigInt(x); });
  return n;
}

function pgV6Subnets(ip, prefix, newPrefix, limit) {
  const out = [];
  if (newPrefix < prefix || newPrefix > 128) return out;
  const step = 1n << BigInt(128 - newPrefix);
  const base = ip & pgV6Mask(prefix);
  const count = 1n << BigInt(newPrefix - prefix);
  for (let i = 0n; i < count && i < BigInt(limit || 8); i += 1n) out.push({ network: base + i * step, prefix: newPrefix, text: `${pgIPv6Compress(base + i * step)}/${newPrefix}` });
  return out;
}

function pgFormatBig(n) {
  const s = n.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
