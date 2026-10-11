/* ---------------- IT Playground: site-to-site IPsec VPN lab (pure engine) ---------------- */

// Two sites, each with LAN subnets, a VPN gateway with a public address, a firewall
// (or NAT device) in front of it, and the tunnel settings at its end. The engine
// replays what a generic IPsec site-to-site tunnel needs, in the order the pieces
// are needed, and names the FIRST thing that fails:
//   1. reach the peer: configured peer address, firewall (UDP 500, UDP 4500 when NAT-T is in use)
//   2. phase 1 (the IKE SA): IKE version, proposal (encryption, integrity, DH group), pre-shared key
//   3. phase 2 (the child SA, carrying ESP): ESP proposal, PFS group, traffic selectors (mirror images)
//   4. a traffic test: route into the tunnel, NAT exemption, selectors, ESP through the firewall, return path
// Simplified on purpose: one proposal per end (real gateways offer lists and a match on any one is enough),
// selectors must mirror exactly (IKEv2 can narrow overlapping selectors), no PRF/ID/certificate details, no MTU,
// no rekey timing. It models generic IPsec (RFC 4301 / 4303 / 7296 / 3948), not any vendor's commands.
//
// topo = {
//   sites: [ {
//     id: 'a', name, gwPublic: '203.0.113.10', peerIp: '198.51.100.20',
//     behindNat: false,            // the gateway has a private address behind a NAT device that owns the public one
//     natT: true,                  // NAT traversal enabled on the gateway
//     fw: { udp500, udp4500, esp },   // what the firewall in front of the gateway lets IN from the peer
//     snat: true, natExempt: '10.2.0.0/24, ...',   // source NAT (PAT) for internet-bound traffic and the destinations exempt from it
//     mode: 'route' | 'policy', routes: [{ id, dest }],   // static routes that point into the tunnel (anything else follows the default route to the ISP)
//     subnets: [{ id, name, cidr, host: { id, name, ip } }],
//     ike:   { version: 'ikev1'|'ikev2', enc, hash, dh, psk, lifetime },
//     child: { enc, hash, pfs: 'none'|group, lifetime },
//     selectors: [{ id, local, remote }]
//   }, { ... } ]
// }

const PG_VPN_ENC = [{ value: 'aes128', label: 'AES-128' }, { value: 'aes256', label: 'AES-256' }, { value: '3des', label: '3DES' }];
const PG_VPN_HASH = [{ value: 'sha1', label: 'SHA-1' }, { value: 'sha256', label: 'SHA-256' }, { value: 'sha384', label: 'SHA-384' }];
const PG_VPN_DH = [{ value: '2', label: 'Group 2 (1024-bit MODP)' }, { value: '14', label: 'Group 14 (2048-bit MODP)' }, { value: '19', label: 'Group 19 (256-bit ECP)' }, { value: '20', label: 'Group 20 (384-bit ECP)' }];
const PG_VPN_PFS = [{ value: 'none', label: 'No PFS' }].concat(PG_VPN_DH);
const PG_VPN_VERSIONS = [{ value: 'ikev1', label: 'IKEv1' }, { value: 'ikev2', label: 'IKEv2' }];

function pgVpnLabel(list, value) {
  const f = list.find((o) => String(o.value) === String(value));
  return f ? f.label : String(value);
}
function pgVpnShortDh(v) { return String(v) === 'none' ? 'no PFS' : `group ${v}`; }

/* ---- small helpers ---- */

// "10.2.0.0/24" (or a bare address, read as /32) -> { net, prefix, text } or null
function pgVpnCidr(text) {
  const m = /^\s*(\d{1,3}(?:\.\d{1,3}){3})(?:\s*\/\s*(\d{1,2}))?\s*$/.exec(String(text == null ? '' : text));
  if (!m) return null;
  const ip = pgParseIPv4(m[1]);
  const prefix = m[2] === undefined ? 32 : Number(m[2]);
  if (ip === null || !(prefix >= 0 && prefix <= 32)) return null;
  const net = (ip & pgMaskFromPrefix(prefix)) >>> 0;
  return { net, prefix, text: `${pgIpToString(net)}/${prefix}` };
}
function pgVpnInCidr(c, ipN) {
  return !!c && ipN !== null && ((ipN & pgMaskFromPrefix(c.prefix)) >>> 0) === c.net;
}
// "10.1.0.0/24, 10.1.1.0/24" -> [cidr...] or null when any part is invalid; an empty text is an empty list
function pgVpnCidrList(text) {
  const parts = String(text == null ? '' : text).split(',').map((s) => s.trim()).filter((s) => s !== '');
  const out = [];
  for (let i = 0; i < parts.length; i += 1) {
    const c = pgVpnCidr(parts[i]);
    if (!c) return null;
    out.push(c);
  }
  return out;
}
function pgVpnSiteOf(topo, id) { return (topo.sites || []).find((s) => s.id === id) || null; }
function pgVpnHosts(topo) {
  const out = [];
  (topo.sites || []).forEach((s) => (s.subnets || []).forEach((n) => {
    if (n.host) out.push({ id: n.host.id, name: n.host.name, ip: n.host.ip, site: s.id, subnetId: n.id, subnetName: n.name });
  }));
  return out;
}

/* ---- configuration checks (shape and syntax, not behaviour) ---- */

// -> [{ site, field, text }]; field names are the same paths the UI edits ('gwPublic', 'ike.psk', 'selectors', ...)
function pgVpnValidate(topo) {
  const errs = [];
  (topo.sites || []).forEach((s) => {
    const add = (field, text) => errs.push({ site: s.id, field, text });
    if (pgParseIPv4(s.gwPublic) === null) add('gwPublic', 'Not a valid IPv4 address.');
    if (pgParseIPv4(s.peerIp) === null) add('peerIp', 'Not a valid IPv4 address.');
    (s.subnets || []).forEach((n) => {
      const c = pgVpnCidr(n.cidr);
      if (!c || !/\//.test(String(n.cidr))) add(`subnet.${n.id}.cidr`, 'Write the subnet as address/prefix, for example 10.1.0.0/24.');
      const hip = pgParseIPv4(n.host.ip);
      if (hip === null) add(`subnet.${n.id}.host`, 'Not a valid IPv4 address.');
      else if (c && !pgVpnInCidr(c, hip)) add(`subnet.${n.id}.host`, `Not inside ${c.text}.`);
    });
    (s.selectors || []).forEach((x) => {
      if (!pgVpnCidr(x.local) || !/\//.test(String(x.local))) add(`selector.${x.id}.local`, 'Write the network as address/prefix.');
      if (!pgVpnCidr(x.remote) || !/\//.test(String(x.remote))) add(`selector.${x.id}.remote`, 'Write the network as address/prefix.');
    });
    (s.routes || []).forEach((r) => { if (!pgVpnCidr(r.dest) || !/\//.test(String(r.dest))) add(`route.${r.id}.dest`, 'Write the destination as address/prefix.'); });
    if (pgVpnCidrList(s.natExempt) === null) add('natExempt', 'Use address/prefix values separated by commas.');
    if (!String((s.ike || {}).psk || '').length) add('ike.psk', 'A pre-shared key cannot be empty.');
    ['ike', 'child'].forEach((k) => { const v = Number((s[k] || {}).lifetime); if (!(v >= 60 && v <= 604800)) add(`${k}.lifetime`, 'Use a lifetime between 60 and 604800 seconds.'); });
  });
  return errs;
}

/* ---- selector pairs ---- */

function pgVpnSelText(x) { return `${x.local} → ${x.remote}`; }

// The pairs both ends agree on: a selector on site A is accepted when site B holds its mirror image
// (B.local = A.remote and B.remote = A.local). -> [{ aId, bId, aLocal, aRemote }] with cidr objects.
function pgVpnPairs(A, B) {
  const out = [];
  (A.selectors || []).forEach((x) => {
    const xl = pgVpnCidr(x.local); const xr = pgVpnCidr(x.remote);
    if (!xl || !xr) return;
    const mirror = (B.selectors || []).find((y) => { const yl = pgVpnCidr(y.local); const yr = pgVpnCidr(y.remote); return yl && yr && yl.text === xr.text && yr.text === xl.text; });
    if (mirror) out.push({ aId: x.id, bId: mirror.id, aLocal: xl, aRemote: xr });
  });
  return out;
}

/* ---- negotiating the tunnel (reach, phase 1, phase 2) ---- */

function pgVpnName(s) { return s.name || s.id; }

function pgVpnNegotiate(topo) {
  const A = topo.sites[0]; const B = topo.sites[1];
  const both = [A, B];
  const steps = [];
  const stages = [
    { key: 'reach', label: 'Reach the peer', state: 'skip', text: 'Not reached yet.' },
    { key: 'p1', label: 'Phase 1 (IKE SA)', state: 'skip', text: 'Waiting for the peer to be reachable.' },
    { key: 'p2', label: 'Phase 2 (child SA)', state: 'skip', text: 'Waiting for phase 1.' },
  ];
  const out = { stages, steps, failure: null, pairs: [], natInPath: !!(A.behindNat || B.behindNat) };
  const stop = (i, diag, line) => {
    stages[i].state = 'fail'; stages[i].text = diag.title;
    steps.push({ ok: false, text: line });
    out.failure = diag;
    return out;
  };

  /* -- reach the peer -- */
  const ipA = pgParseIPv4(A.gwPublic); const ipB = pgParseIPv4(B.gwPublic);
  for (let i = 0; i < 2; i += 1) {
    const me = both[i]; const other = both[1 - i];
    const want = i === 0 ? ipB : ipA;
    if (pgParseIPv4(me.peerIp) === null || pgParseIPv4(me.peerIp) !== want) {
      return stop(0, pgFail('wrong-peer-address', `${pgVpnName(me)} points at the wrong peer address`,
        `${pgVpnName(me)} is told to build the tunnel to ${me.peerIp || '(nothing)'}, but ${pgVpnName(other)}'s gateway is at ${other.gwPublic}. IKE packets go to an address that is not running this tunnel, so nobody answers.`,
        `Set the peer address on ${pgVpnName(me)} to ${other.gwPublic}.`, me.id, 'peerIp'),
      `${pgVpnName(me)} sends IKE to ${me.peerIp || '(no address)'}, but the peer gateway is ${other.gwPublic}: no answer.`);
    }
  }
  steps.push({ ok: true, text: `Each gateway targets the other's public address (${A.gwPublic} and ${B.gwPublic}).` });
  for (let i = 0; i < 2; i += 1) {
    const s = both[i];
    if (!(s.fw || {}).udp500) {
      return stop(0, pgFail('firewall-blocks-ike', `The firewall at ${pgVpnName(s)} blocks UDP 500`,
        `IKE starts on UDP port 500. The firewall in front of ${pgVpnName(s)}'s gateway does not let it in, so the two gateways never get to exchange a single IKE message. Either end can start (or rekey) the tunnel, so both firewalls must allow it.`,
        `Allow inbound UDP 500 to the gateway at ${pgVpnName(s)}.`, s.id, 'fw'),
      `UDP 500 (IKE) is dropped by the firewall at ${pgVpnName(s)}.`);
    }
  }
  if (out.natInPath) {
    const natSite = A.behindNat ? A : B;
    for (let i = 0; i < 2; i += 1) {
      const s = both[i];
      if (!s.natT) {
        return stop(0, pgFail('nat-t-disabled', `NAT traversal is off at ${pgVpnName(s)}`,
          `${pgVpnName(natSite)}'s gateway sits behind a NAT device. ESP is IP protocol 50 and has no port numbers, so a NAT device that translates ports (PAT) cannot track it. NAT traversal (NAT-T) wraps ESP in UDP port 4500 so the translation works, and both gateways have to support and use it. Here it is switched off at ${pgVpnName(s)}.`,
          `Turn NAT traversal on at ${pgVpnName(s)} (both gateways need it when a NAT device is in the path).`, s.id, 'natT'),
        `NAT is in the path, but NAT-T is off at ${pgVpnName(s)}: ESP cannot be carried through the translation.`);
      }
    }
    for (let i = 0; i < 2; i += 1) {
      const s = both[i];
      if (!(s.fw || {}).udp4500) {
        return stop(0, pgFail('firewall-blocks-ike', `The firewall at ${pgVpnName(s)} blocks UDP 4500`,
          `A NAT device is in the path, so after the first IKE messages on UDP 500 the gateways switch to UDP port 4500 (NAT traversal), for IKE and for the encrypted traffic. The firewall in front of ${pgVpnName(s)}'s gateway lets UDP 500 in but not UDP 4500, so the exchange stalls after it starts.`,
          `Allow inbound UDP 4500 to the gateway at ${pgVpnName(s)}.`, s.id, 'fw'),
        `UDP 4500 (NAT-T) is dropped by the firewall at ${pgVpnName(s)}.`);
      }
    }
    steps.push({ ok: true, text: `A NAT device is in the path (${pgVpnName(natSite)}), so both gateways switch to UDP 4500 after the first messages. Both firewalls allow UDP 500 and UDP 4500.` });
  } else {
    steps.push({ ok: true, text: 'Both firewalls allow UDP 500, so the IKE messages get through. (No NAT in the path, so the encrypted data will travel as ESP, IP protocol 50.)' });
  }
  stages[0].state = 'ok'; stages[0].text = out.natInPath ? 'UDP 500 and 4500 reach both gateways' : 'UDP 500 reaches both gateways';

  /* -- phase 1: the IKE SA -- */
  const ia = A.ike; const ib = B.ike;
  if (ia.version !== ib.version) {
    return stop(1, pgFail('ike-version-mismatch', 'The two ends use different IKE versions',
      `${pgVpnName(A)} speaks ${pgVpnLabel(PG_VPN_VERSIONS, ia.version)} and ${pgVpnName(B)} speaks ${pgVpnLabel(PG_VPN_VERSIONS, ib.version)}. IKEv1 and IKEv2 are different protocols with different message exchanges (IKEv1 main mode and quick mode, IKEv2 IKE_SA_INIT and IKE_AUTH), so they cannot negotiate with each other; the responder rejects the exchange.`,
      'Set the same IKE version on both gateways (IKEv2 if both support it).', 'both', 'ike.version'),
    `IKE version differs: ${pgVpnLabel(PG_VPN_VERSIONS, ia.version)} against ${pgVpnLabel(PG_VPN_VERSIONS, ib.version)}. No phase 1.`);
  }
  const diffs = [];
  if (ia.enc !== ib.enc) diffs.push(`encryption ${pgVpnLabel(PG_VPN_ENC, ia.enc)} against ${pgVpnLabel(PG_VPN_ENC, ib.enc)}`);
  if (ia.hash !== ib.hash) diffs.push(`integrity/hash ${pgVpnLabel(PG_VPN_HASH, ia.hash)} against ${pgVpnLabel(PG_VPN_HASH, ib.hash)}`);
  if (String(ia.dh) !== String(ib.dh)) diffs.push(`DH group ${ia.dh} against ${ib.dh}`);
  if (diffs.length) {
    return stop(1, pgFail('proposal-mismatch', 'No phase 1 proposal in common',
      `The gateways must agree on one set of IKE algorithms. These differ: ${diffs.join('; ')}. The responder has nothing it can accept and answers with an error (IKEv2: NO_PROPOSAL_CHOSEN), so no IKE SA is created. (Real gateways usually offer a list and the first common entry wins; this lab gives each end exactly one.)`,
      'Make encryption, integrity/hash and DH group identical on both ends.', 'both', 'ike'),
    `Phase 1 proposal: no match (${diffs.join('; ')}).`);
  }
  if (ia.psk !== ib.psk) {
    return stop(1, pgFail('psk-mismatch', 'The pre-shared keys differ',
      `The proposal matched and the Diffie-Hellman exchange worked, but each gateway proves its identity with a key derived from the pre-shared key. The keys are not identical (they are case-sensitive and a stray space counts), so authentication fails (IKEv2: AUTHENTICATION_FAILED in IKE_AUTH; IKEv1: the hash check fails in main mode) and no IKE SA is kept.`,
      'Type the same pre-shared key on both gateways, character for character.', 'both', 'ike.psk'),
    'Algorithms agree, but authentication fails: the pre-shared keys are different.');
  }
  stages[1].state = 'ok';
  stages[1].text = `${pgVpnLabel(PG_VPN_VERSIONS, ia.version)} · ${pgVpnLabel(PG_VPN_ENC, ia.enc)} / ${pgVpnLabel(PG_VPN_HASH, ia.hash)} / group ${ia.dh}`;
  steps.push({ ok: true, text: `Phase 1 is up: ${pgVpnLabel(PG_VPN_VERSIONS, ia.version)}, ${pgVpnLabel(PG_VPN_ENC, ia.enc)} with ${pgVpnLabel(PG_VPN_HASH, ia.hash)}, DH group ${ia.dh}, and the pre-shared keys match. This is the IKE SA: a protected channel used to negotiate the real tunnel.` });
  if (Number(ia.lifetime) !== Number(ib.lifetime)) {
    steps.push({ ok: true, text: `Phase 1 lifetimes differ (${ia.lifetime} s and ${ib.lifetime} s). That does not stop the tunnel coming up: in IKEv2 each end enforces its own lifetime (RFC 7296), and the end whose timer expires first starts the rekey. IKEv1 negotiates it, so keep them equal to avoid surprises.` });
  }

  /* -- phase 2: the child SA -- */
  const ca = A.child; const cb = B.child;
  const cd = [];
  if (ca.enc !== cb.enc) cd.push(`ESP encryption ${pgVpnLabel(PG_VPN_ENC, ca.enc)} against ${pgVpnLabel(PG_VPN_ENC, cb.enc)}`);
  if (ca.hash !== cb.hash) cd.push(`ESP integrity ${pgVpnLabel(PG_VPN_HASH, ca.hash)} against ${pgVpnLabel(PG_VPN_HASH, cb.hash)}`);
  if (cd.length) {
    return stop(2, pgFail('esp-proposal-mismatch', 'No phase 2 (ESP) proposal in common',
      `Phase 1 is fine, but the child SA that will carry the data needs its own agreed ESP algorithms. These differ: ${cd.join('; ')}. The child SA is rejected (NO_PROPOSAL_CHOSEN), so the IKE SA may stay up while no traffic can be protected.`,
      'Make the ESP encryption and integrity identical on both ends.', 'both', 'child'),
    `Phase 2 proposal: no match (${cd.join('; ')}).`);
  }
  if (String(ca.pfs) !== String(cb.pfs)) {
    const nuance = ia.version === 'ikev2' ? ' (With IKEv2 the first child SA is created inside IKE_AUTH without a key exchange of its own, so some gateways only notice a PFS mismatch at the first rekey. The lab shows it up front.)' : '';
    return stop(2, pgFail('pfs-mismatch', 'The PFS settings do not match',
      `Perfect forward secrecy (PFS) means the child SA keys come from a fresh Diffie-Hellman exchange. ${pgVpnName(A)} uses ${pgVpnShortDh(ca.pfs)} and ${pgVpnName(B)} uses ${pgVpnShortDh(cb.pfs)}. One end asks for a key exchange the other does not offer, or the groups differ, so the child SA proposal is rejected.${nuance}`,
      'Use the same PFS setting on both ends: the same DH group, or no PFS on both.', 'both', 'child.pfs'),
    `Phase 2: PFS differs (${pgVpnShortDh(ca.pfs)} against ${pgVpnShortDh(cb.pfs)}).`);
  }
  const pairs = pgVpnPairs(A, B);
  const totalA = (A.selectors || []).length; const totalB = (B.selectors || []).length;
  if (!pairs.length) {
    const lines = [];
    (A.selectors || []).slice(0, 3).forEach((x) => lines.push(`${pgVpnName(A)} protects ${pgVpnSelText(x)}`));
    (B.selectors || []).slice(0, 3).forEach((x) => lines.push(`${pgVpnName(B)} protects ${pgVpnSelText(x)}`));
    return stop(2, pgFail('selector-mismatch', 'No traffic selectors match: phase 2 fails',
      `Phase 1 is up, but the child SA needs traffic selectors (which source and destination networks the tunnel protects) that are mirror images: what one end calls local the other must call remote. ${lines.length ? `${lines.join('; ')}.` : 'One end has no selectors at all.'} Nothing mirrors, so the responder answers TS_UNACCEPTABLE (IKEv2) or rejects the quick mode identities (IKEv1). The IKE SA looks "up" but no child SA exists, so nothing passes.`,
      'Make each end\'s local network the other end\'s remote network, and the other way round.', 'both', 'selectors'),
    'Phase 2: none of the traffic selectors mirror each other.');
  }
  stages[2].state = totalA === totalB && pairs.length === totalA ? 'ok' : 'partial';
  stages[2].text = stages[2].state === 'ok' ? `${pairs.length} selector pair${pairs.length === 1 ? '' : 's'} up · ${pgVpnLabel(PG_VPN_ENC, ca.enc)} / ${pgVpnLabel(PG_VPN_HASH, ca.hash)} · ${pgVpnShortDh(ca.pfs)}` : `${pairs.length} of ${Math.max(totalA, totalB)} selector pairs up`;
  steps.push({ ok: true, text: `Phase 2 is up for ${pairs.length} selector pair${pairs.length === 1 ? '' : 's'}: ${pairs.map((p) => `${p.aLocal.text} ↔ ${p.aRemote.text}`).join(', ')}. ESP uses ${pgVpnLabel(PG_VPN_ENC, ca.enc)} with ${pgVpnLabel(PG_VPN_HASH, ca.hash)}, ${pgVpnShortDh(ca.pfs)}.` });
  if (stages[2].state === 'partial') {
    const left = [];
    (A.selectors || []).forEach((x) => { if (!pairs.some((p) => p.aId === x.id)) left.push(`${pgVpnName(A)} ${pgVpnSelText(x)}`); });
    (B.selectors || []).forEach((y) => { if (!pairs.some((p) => p.bId === y.id)) left.push(`${pgVpnName(B)} ${pgVpnSelText(y)}`); });
    steps.push({ ok: false, text: `The tunnel is "up", but only part of it: these selectors have no mirror image and carry nothing: ${left.join('; ')}.` });
  }
  if (Number(ca.lifetime) !== Number(cb.lifetime)) steps.push({ ok: true, text: `Phase 2 lifetimes differ (${ca.lifetime} s and ${cb.lifetime} s). That is not a reason for the tunnel to fail; the end with the shorter timer rekeys first.` });
  out.pairs = pairs;
  return out;
}

/* ---- the traffic test ---- */

function pgVpnNatExempt(site, dstN) {
  const list = pgVpnCidrList(site.natExempt) || [];
  return list.some((c) => pgVpnInCidr(c, dstN));
}

// One gateway handling a packet that must enter the tunnel: route/policy, NAT, selectors.
function pgVpnLeg(topo, neg, site, hs, hd, label) {
  const steps = [];
  const srcN = pgParseIPv4(hs.ip); const dstN = pgParseIPv4(hd.ip);
  const nm = pgVpnName(site);
  const where = label === 'return' ? 'The reply' : 'The packet';
  if (site.mode === 'policy') {
    const hit = (site.selectors || []).find((x) => pgVpnInCidr(pgVpnCidr(x.local), srcN) && pgVpnInCidr(pgVpnCidr(x.remote), dstN));
    if (!hit) {
      steps.push({ ok: false, text: `${nm} is policy-based: only traffic matching a selector is encrypted. No selector covers ${hs.ip} → ${hd.ip}, so ${where.toLowerCase()} follows the default route to the ISP, unencrypted. ${hd.ip} is private, and the internet does not route it.` });
      return { steps, fail: pgFail('selector-mismatch', `No selector at ${nm} covers this traffic`,
        `${nm} uses policy-based VPN: the selectors are what send traffic into the tunnel. Nothing covers ${hs.ip} → ${hd.ip}, so the traffic is not encrypted and leaves through the normal route, where a private destination address is dropped.`,
        `Add a selector at ${nm} that covers the source and destination networks (and the mirror image at the other end).`, site.id, 'selectors') };
    }
    steps.push({ ok: true, text: `${nm} (policy-based): selector ${pgVpnSelText(hit)} matches ${hs.ip} → ${hd.ip}, so ${where.toLowerCase()} is sent to be encrypted.` });
  } else {
    const hit = (site.routes || []).map((r) => ({ r, c: pgVpnCidr(r.dest) })).filter((x) => x.c && pgVpnInCidr(x.c, dstN)).sort((a, b) => b.c.prefix - a.c.prefix)[0];
    if (!hit) {
      steps.push({ ok: false, text: `${nm} is route-based: it has no route for ${hd.ip} that points into the tunnel, so ${where.toLowerCase()} follows the default route to the ISP. ${hd.ip} is a private address, which internet routers drop.` });
      return { steps, fail: pgFail('no-route-to-tunnel', `${nm} has no route into the tunnel`,
        `The tunnel can be fully up and still carry nothing: a route-based gateway only sends traffic into the tunnel if a route says so. ${nm} has no route covering ${hd.ip}, so ${where.toLowerCase()} takes the default route out to the internet instead of through the tunnel.`,
        `Add a static route at ${nm} for the remote network with the tunnel as the next hop.`, site.id, 'routes') };
    }
    steps.push({ ok: true, text: `${nm} (route-based): route ${hit.c.text} points into the tunnel and matches ${hd.ip}.` });
  }
  if (site.snat) {
    if (!pgVpnNatExempt(site, dstN)) {
      steps.push({ ok: false, text: `${nm} translates (source NAT / PAT) traffic leaving the LAN, and ${hd.ip} is not exempt, so ${hs.ip} is rewritten to ${site.gwPublic} before the packet reaches the tunnel. The tunnel's selector expects the private LAN address as the source, so the rewritten packet no longer matches, is not encrypted and is dropped.` });
      return { steps, fail: pgFail('nat-not-exempt', `${nm} translates the traffic before it is encrypted`,
        `Source NAT (PAT) for internet access is applied to everything leaving the LAN, including traffic for the other site. The packet's source is rewritten to the public address first, so it no longer matches the tunnel's selector (which expects the private LAN address) and never enters the tunnel. Traffic to the remote site must be excluded from NAT (a NAT exemption, "no-NAT" or bypass rule, depending on the platform).`,
        `At ${nm}, exempt ${hd.ip}'s network from source NAT.`, site.id, 'natExempt') };
    }
    steps.push({ ok: true, text: `${nm} translates internet-bound traffic, but ${hd.ip} is on the NAT exemption list, so ${hs.ip} stays as it is.` });
  } else {
    steps.push({ ok: true, text: `${nm} does no source NAT on this traffic, so ${hs.ip} stays as it is.` });
  }
  const A = topo.sites[0];
  const pair = neg.pairs.find((p) => (site.id === A.id ? pgVpnInCidr(p.aLocal, srcN) && pgVpnInCidr(p.aRemote, dstN) : pgVpnInCidr(p.aRemote, srcN) && pgVpnInCidr(p.aLocal, dstN)));
  if (!pair) {
    const agreed = neg.pairs.map((p) => `${p.aLocal.text} ↔ ${p.aRemote.text}`).join(', ');
    steps.push({ ok: false, text: `No agreed selector pair covers ${hs.ip} → ${hd.ip}${agreed ? ` (only ${agreed} was negotiated)` : ''}, so there is no child SA to encrypt it with. It is not protected and is dropped.` });
    return { steps, fail: pgFail('selector-mismatch', 'No negotiated selector covers this traffic',
      `The tunnel is up, but only for the selector pairs that both ends agreed on${agreed ? ` (${agreed})` : ''}. ${hs.ip} → ${hd.ip} is not covered, because the other end has no matching mirror-image selector. Traffic outside the agreed pairs is not encrypted.`,
      'Add the mirror-image selector on the end that is missing it (what one end calls local, the other calls remote).', 'both', 'selectors') };
  }
  steps.push({ ok: true, text: `Selector pair ${pair.aLocal.text} ↔ ${pair.aRemote.text} covers it: ${nm} encrypts ${where.toLowerCase()} with ESP and sends it to the peer.` });
  return { steps, fail: null };
}

function pgVpnEspHop(topo, neg, toSite) {
  const nm = pgVpnName(toSite);
  if (neg.natInPath) return { steps: [{ ok: true, text: `NAT traversal is in use, so ESP travels wrapped in UDP port 4500, which the firewall at ${nm} allows.` }], fail: null };
  if (!(toSite.fw || {}).esp) {
    return { steps: [{ ok: false, text: `The encrypted packet arrives at ${nm} as ESP (IP protocol 50), and the firewall there drops it. The IKE negotiation worked because it uses UDP 500, which is why the tunnel looks up.` }],
      fail: pgFail('firewall-blocks-esp', `The firewall at ${nm} blocks ESP (IP protocol 50)`,
        'IKE and the encrypted data are different traffic. IKE uses UDP 500, so the tunnel negotiates and shows as up. The data travels as ESP, IP protocol 50 (not TCP or UDP, so there is no port to allow), and the firewall drops it. This is the classic "tunnel is up but no traffic passes".',
        `Allow inbound IP protocol 50 (ESP) to the gateway at ${nm}.`, toSite.id, 'fw') };
  }
  return { steps: [{ ok: true, text: `The ESP packet (IP protocol 50) is allowed in by the firewall at ${nm}.` }], fail: null };
}

// conn = { from: hostId, to: hostId }
function pgVpnTest(topo, conn) {
  const hosts = pgVpnHosts(topo);
  const hs = hosts.find((h) => h.id === conn.from); const hd = hosts.find((h) => h.id === conn.to);
  const stagesBase = [];
  if (!hs || !hd) return { verdict: 'failed', steps: [], stages: stagesBase, diagnosis: null, summary: 'Pick a source and a destination host.' };
  const bad = pgVpnValidate(topo);
  const neg = pgVpnNegotiate(topo);
  const stages = neg.stages.map((s) => ({ ...s })).concat([{ key: 'test', label: 'Traffic test', state: 'skip', text: 'Not run.' }]);
  if (bad.length) {
    const b = bad[0];
    const site = pgVpnSiteOf(topo, b.site);
    return { verdict: 'failed', steps: [{ ok: false, text: `${site ? pgVpnName(site) : 'A site'}: ${b.text}` }], stages, summary: 'A setting is not valid',
      diagnosis: pgFail('bad-config', 'A setting is not valid', `${site ? pgVpnName(site) : 'A site'} has a value the lab cannot read. ${b.text}`, 'Correct the highlighted field and try again.', b.site, b.field) };
  }
  if (hs.site === hd.site) {
    const site = pgVpnSiteOf(topo, hs.site);
    stages[3] = { key: 'test', label: 'Traffic test', state: 'ok', text: 'Same site: the tunnel is not used.' };
    return { verdict: 'success', steps: [{ ok: true, text: `${hs.name} and ${hd.name} are both at ${pgVpnName(site)}. The traffic stays on the local network and never touches the VPN, so this test says nothing about the tunnel.` }], stages, diagnosis: null, summary: `${hd.name} is local to ${hs.name}: the tunnel is not involved.` };
  }
  const steps = neg.steps.slice();
  if (neg.failure) {
    stages[3] = { key: 'test', label: 'Traffic test', state: 'fail', text: 'The tunnel is not up.' };
    steps.push({ ok: false, text: `${hs.name} → ${hd.name}: with no usable tunnel, the traffic cannot be protected.` });
    return { verdict: 'failed', steps, stages, diagnosis: neg.failure, summary: neg.failure.title };
  }
  const S = pgVpnSiteOf(topo, hs.site); const D = pgVpnSiteOf(topo, hd.site);
  const fail = (diag, phaseNote) => {
    stages[3] = { key: 'test', label: 'Traffic test', state: 'fail', text: phaseNote };
    return { verdict: 'failed', steps, stages, diagnosis: diag, summary: diag.title };
  };
  steps.push({ ok: true, text: `Test: ${hs.name} (${hs.ip}) at ${pgVpnName(S)} sends traffic to ${hd.name} (${hd.ip}) at ${pgVpnName(D)}.` });
  let r = pgVpnLeg(topo, neg, S, hs, hd, 'forward');
  r.steps.forEach((x) => steps.push(x));
  if (r.fail) return fail(r.fail, `Stopped at ${pgVpnName(S)}.`);
  r = pgVpnEspHop(topo, neg, D);
  r.steps.forEach((x) => steps.push(x));
  if (r.fail) return fail(r.fail, 'ESP is dropped on the way.');
  steps.push({ ok: true, text: `${pgVpnName(D)} decrypts the packet, checks it against the same selector pair, and delivers it to ${hd.name}.` });
  steps.push({ ok: true, text: `${hd.name} replies to ${hs.ip}. The reply must now go the other way through the tunnel.` });
  r = pgVpnLeg(topo, neg, D, hd, hs, 'return');
  r.steps.forEach((x) => steps.push(x));
  if (r.fail) { steps.push({ ok: false, text: `The request arrived, but the reply never gets back to ${hs.name}: from ${hs.name}'s point of view the other site simply does not answer.` }); return fail(r.fail, `Reply stopped at ${pgVpnName(D)}.`); }
  r = pgVpnEspHop(topo, neg, S);
  r.steps.forEach((x) => steps.push(x));
  if (r.fail) { steps.push({ ok: false, text: `The request arrived, but the reply is dropped before it reaches ${hs.name}.` }); return fail(r.fail, 'The reply ESP is dropped.'); }
  steps.push({ ok: true, text: `${pgVpnName(S)} decrypts the reply and delivers it to ${hs.name}.` });
  stages[3] = { key: 'test', label: 'Traffic test', state: 'ok', text: `${hs.name} ↔ ${hd.name} works` };
  return { verdict: 'success', steps, stages, diagnosis: null, summary: `${hs.name} and ${hd.name} can talk through the tunnel (request and reply).` };
}

/* ---- the side-by-side table ---- */

// -> [{ label, a, b, state: 'ok'|'bad'|'info' }]
function pgVpnCompare(topo) {
  const A = topo.sites[0]; const B = topo.sites[1];
  const row = (label, a, b, kind) => ({ label, a: String(a), b: String(b), state: kind === 'info' ? (String(a) === String(b) ? 'ok' : 'info') : (String(a) === String(b) ? 'ok' : 'bad') });
  const ia = A.ike; const ib = B.ike; const ca = A.child; const cb = B.child;
  const pairs = pgVpnPairs(A, B);
  const nA = (A.selectors || []).length; const nB = (B.selectors || []).length;
  const rows = [
    row('IKE version', pgVpnLabel(PG_VPN_VERSIONS, ia.version), pgVpnLabel(PG_VPN_VERSIONS, ib.version)),
    row('Phase 1 encryption', pgVpnLabel(PG_VPN_ENC, ia.enc), pgVpnLabel(PG_VPN_ENC, ib.enc)),
    row('Phase 1 integrity', pgVpnLabel(PG_VPN_HASH, ia.hash), pgVpnLabel(PG_VPN_HASH, ib.hash)),
    row('Phase 1 DH group', ia.dh, ib.dh),
    { label: 'Pre-shared key', a: ia.psk === ib.psk ? 'same' : 'differs', b: ia.psk === ib.psk ? 'same' : 'differs', state: ia.psk === ib.psk ? 'ok' : 'bad' },
    row('Phase 1 lifetime (s)', ia.lifetime, ib.lifetime, 'info'),
    row('ESP encryption', pgVpnLabel(PG_VPN_ENC, ca.enc), pgVpnLabel(PG_VPN_ENC, cb.enc)),
    row('ESP integrity', pgVpnLabel(PG_VPN_HASH, ca.hash), pgVpnLabel(PG_VPN_HASH, cb.hash)),
    row('PFS', pgVpnShortDh(ca.pfs), pgVpnShortDh(cb.pfs)),
    row('Phase 2 lifetime (s)', ca.lifetime, cb.lifetime, 'info'),
    { label: 'Selectors with a mirror', a: `${pairs.length} of ${nA}`, b: `${pairs.length} of ${nB}`, state: pairs.length === nA && pairs.length === nB && nA > 0 ? 'ok' : 'bad' },
  ];
  return rows;
}

/* ---- scenario fixes ---- */

// fix entries: { site, path: 'ike.psk' | 'fw.udp500' | 'selectors' | ..., value } (arrays replace the whole list),
//              { site, addSelector: {id, local, remote} }, { site, addRoute: {id, dest} }
function pgVpnApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    const sites = f.site === 'both' ? t.sites : t.sites.filter((s) => s.id === f.site);
    sites.forEach((s) => {
      if (f.addSelector) s.selectors.push({ ...f.addSelector });
      else if (f.addRoute) s.routes.push({ ...f.addRoute });
      else if (f.path) {
        const keys = f.path.split('.');
        let o = s;
        for (let i = 0; i < keys.length - 1; i += 1) o = o[keys[i]];
        o[keys[keys.length - 1]] = pgClone(f.value);
      }
    });
  });
  return t;
}
