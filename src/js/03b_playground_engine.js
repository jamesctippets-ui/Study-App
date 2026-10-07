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
