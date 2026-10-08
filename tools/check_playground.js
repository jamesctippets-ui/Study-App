#!/usr/bin/env node
/* Unit tests for the Playground engine (src/js/03b_playground_engine.js) and a
 * replay of every guided scenario in dist/data/playground.json against the
 * outcome the scenario data promises. build.py runs this when node is on the
 * PATH, so a scenario whose expected result drifts from the engine fails the
 * build. Run it by hand with:  node tools/check_playground.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/js/03b_playground_engine.js'), 'utf8');
const names = [...src.matchAll(/^function (pg\w+)/gm)].map((m) => m[1]);
// eslint-disable-next-line no-new-func
const E = new Function(`${src}\nreturn { ${names.join(', ')} };`)();

let failures = 0;
let checks = 0;
function eq(actual, expected, label) {
  checks += 1;
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) { failures += 1; console.error(`FAIL ${label}\n   got      ${a}\n   expected ${b}`); }
}

/* ---- addressing ---- */
eq(E.pgParseIPv4('192.168.1.10'), 3232235786, 'parse ip');
eq(E.pgParseIPv4('256.1.1.1'), null, 'octet too big');
eq(E.pgParseIPv4('1.2.3'), null, 'too few octets');
eq(E.pgParseIPv4('01.2.3.4'), null, 'leading zero');
eq(E.pgIpToString(E.pgParseIPv4('10.0.0.255')), '10.0.0.255', 'round trip');
eq(E.pgParseMask('/24').prefix, 24, 'slash mask');
eq(E.pgParseMask('255.255.255.0').prefix, 24, 'dotted /24');
eq(E.pgParseMask('255.255.254.0').prefix, 23, 'dotted /23');
eq(E.pgParseMask('0.0.0.0').prefix, 0, 'mask zero');
eq(E.pgParseMask('255.255.255.255').prefix, 32, 'mask 32');
eq(!!E.pgParseMask('255.0.255.0').error, true, 'non-contiguous mask rejected');
eq(/wildcard/.test(E.pgParseMask('0.0.0.255').error), true, 'wildcard hint');
eq(!!E.pgParseMask('/33').error, true, '/33 rejected');

const ip = (s) => E.pgParseIPv4(s);
let i = E.pgSubnetInfo(ip('192.168.10.77'), 26);
eq([i.networkText, i.broadcastText, i.firstText, i.lastText, i.usable, i.maskText, i.wildcardText], ['192.168.10.64', '192.168.10.127', '192.168.10.65', '192.168.10.126', 62, '255.255.255.192', '0.0.0.63'], '/26 info');
i = E.pgSubnetInfo(ip('10.1.2.3'), 8);
eq([i.networkText, i.broadcastText, i.usable], ['10.0.0.0', '10.255.255.255', 16777214], '/8 info');
i = E.pgSubnetInfo(ip('172.16.5.130'), 20);
eq([i.networkText, i.broadcastText, i.usable], ['172.16.0.0', '172.16.15.255', 4094], '/20 info');
i = E.pgSubnetInfo(ip('10.0.0.4'), 31);
eq([i.firstText, i.lastText, i.usable], ['10.0.0.4', '10.0.0.5', 2], '/31 info');
i = E.pgSubnetInfo(ip('10.0.0.4'), 32);
eq([i.firstText, i.lastText, i.usable], ['10.0.0.4', '10.0.0.4', 1], '/32 info');
i = E.pgSubnetInfo(ip('0.0.0.0'), 0);
eq([i.total, i.broadcastText], [4294967296, '255.255.255.255'], '/0 info');
eq(E.pgSubnetInfo(ip('192.168.1.0'), 24).role, 'network', 'network role');
eq(E.pgSubnetInfo(ip('192.168.1.255'), 24).role, 'broadcast', 'broadcast role');
eq(E.pgSubnetInfo(ip('192.168.1.1'), 24).role, 'host', 'host role');
eq(E.pgAddressKind(ip('172.31.255.1')).key, 'private', '172.31 private');
eq(E.pgAddressKind(ip('172.32.0.1')).key, 'public', '172.32 public');
eq(E.pgAddressKind(ip('169.254.3.4')).key, 'linklocal', 'apipa');
eq(E.pgAddressKind(ip('100.64.0.1')).key, 'cgnat', 'cgnat');
eq(E.pgClassOf(ip('130.5.5.5')).letter, 'B', 'class B');
eq(E.pgSameSubnet(ip('192.168.1.10'), 24, ip('192.168.1.200')), true, 'same /24');
eq(E.pgSameSubnet(ip('192.168.1.10'), 25, ip('192.168.1.200')), false, 'different /25');
eq(E.pgSubnetSteps(E.pgSubnetInfo(ip('192.168.10.77'), 26)).length, 6, 'steps with shortcut for non-octet mask');
eq(E.pgSubnetSteps(E.pgSubnetInfo(ip('192.168.10.77'), 24)).length, 5, 'steps without shortcut');
eq(E.pgSplitSubnets(ip('192.168.1.0'), 24, 26).map((x) => x.networkText), ['192.168.1.0', '192.168.1.64', '192.168.1.128', '192.168.1.192'], 'split /24 into /26');

/* ---- VLSM ---- */
let plan = E.pgVlsmPlan(ip('192.168.1.0'), 24, [{ name: 'Sales', hosts: 100 }, { name: 'Eng', hosts: 50 }, { name: 'Link', hosts: 2 }, { name: 'Guest', hosts: 20 }]);
eq(plan.allocations.map((a) => `${a.name} ${a.info.networkText}/${a.prefix}`), ['Sales 192.168.1.0/25', 'Eng 192.168.1.128/26', 'Guest 192.168.1.192/27', 'Link 192.168.1.224/30'], 'vlsm order and alignment');
eq(plan.free.map((b) => b.text), ['192.168.1.228/30', '192.168.1.232/29', '192.168.1.240/28'], 'vlsm free blocks');
eq(plan.unplaced.length, 0, 'vlsm all placed');
plan = E.pgVlsmPlan(ip('192.168.1.0'), 24, [{ name: 'A', hosts: 200 }, { name: 'B', hosts: 100 }]);
eq(plan.unplaced.map((r) => r.name), ['B'], 'vlsm overflow');
eq(E.pgPrefixForHosts(2), 30, 'prefix for 2 hosts');
eq(E.pgPrefixForHosts(1), 30, 'prefix for 1 host');
eq(E.pgPrefixForHosts(30), 27, 'prefix for 30 hosts');
eq(E.pgPrefixForHosts(31), 26, 'prefix for 31 hosts');
eq(E.pgPrefixForHosts(254), 24, 'prefix for 254 hosts');
eq(E.pgPrefixForHosts(255), 23, 'prefix for 255 hosts');

/* ---- ping model ---- */
function lanTopo(over) {
  const t = {
    segments: [{ id: 'a', label: 'Office LAN' }, { id: 'b', label: 'Server LAN' }],
    hosts: [
      { id: 'pc', name: 'PC', segment: 'a', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1' },
      { id: 'pc2', name: 'PC2', segment: 'a', ip: '192.168.1.11', mask: '255.255.255.0', gateway: '192.168.1.1' },
      { id: 'srv', name: 'Server', segment: 'b', ip: '10.0.0.10', mask: '255.255.255.0', gateway: '10.0.0.1' },
    ],
    routers: [{ id: 'r', name: 'Router', ifaces: [{ segment: 'a', ip: '192.168.1.1', mask: '/24' }, { segment: 'b', ip: '10.0.0.1', mask: '/24' }], routes: [] }],
  };
  return over ? over(t) : t;
}
const v = (t, a, b) => E.pgPing(t, a, b);
eq(v(lanTopo(), 'pc', 'pc2').verdict, 'success', 'same subnet works');
eq(v(lanTopo(), 'pc', 'srv').verdict, 'success', 'routed works');
eq(v(lanTopo(), 'pc', 'r').verdict, 'success', 'ping router');
eq(v(lanTopo(), 'pc', '10.0.0.10').verdict, 'success', 'ping by address');
eq(v(lanTopo(), 'pc', 'banana').diagnosis.code, 'bad-target', 'bad target');
eq(v(lanTopo((t) => { t.hosts[0].gateway = ''; return t; }), 'pc', 'srv').diagnosis.code, 'no-gateway', 'missing gateway');
eq(v(lanTopo((t) => { t.hosts[0].gateway = '192.168.2.1'; return t; }), 'pc', 'srv').diagnosis.code, 'gateway-offsubnet', 'gateway off subnet');
eq(v(lanTopo((t) => { t.hosts[0].gateway = '192.168.1.99'; return t; }), 'pc', 'srv').diagnosis.code, 'arp-timeout', 'wrong gateway address');
eq(v(lanTopo((t) => { t.hosts[0].gateway = '192.168.1.11'; return t; }), 'pc', 'srv').diagnosis.code, 'not-a-router', 'gateway is a host');
eq(v(lanTopo((t) => { t.hosts[0].ip = '192.168.1.0'; return t; }), 'pc', 'pc2').diagnosis.code, 'host-address', 'network address on host');
eq(v(lanTopo((t) => { t.hosts[0].ip = '192.168.1.255'; return t; }), 'pc', 'pc2').diagnosis.code, 'host-address', 'broadcast address on host');
eq(v(lanTopo((t) => { t.hosts[0].mask = '255.0.255.0'; return t; }), 'pc', 'pc2').diagnosis.code, 'bad-mask', 'bad mask');
eq(v(lanTopo((t) => { t.hosts[0].ip = '192.168.1'; return t; }), 'pc', 'pc2').diagnosis.code, 'bad-ip', 'bad ip');
// Server's gateway wrong: the request arrives but the reply cannot return.
eq(v(lanTopo((t) => { t.hosts[2].gateway = '10.0.0.99'; return t; }), 'pc', 'srv').diagnosis.code, 'reply-lost', 'reply lost');
eq(v(lanTopo((t) => { t.hosts[2].gateway = ''; return t; }), 'pc', 'srv').legs.map((l) => l.delivered), [true, false], 'request arrives, reply fails');
// Server on a /25 mask thinks the PC (192.168.1.x) is off-subnet only if mask differs; simulate wrong server mask making router look local.
eq(v(lanTopo((t) => { t.hosts[2].ip = '10.0.0.200'; t.hosts[2].mask = '255.255.255.128'; t.hosts[2].gateway = '10.0.0.129'; return t; }), 'pc', 'srv').diagnosis.code, 'reply-lost', 'server gateway outside its /25 breaks the return path');
// Duplicate address
eq(v(lanTopo((t) => { t.hosts[1].ip = '192.168.1.10'; return t; }), 'srv', '192.168.1.10').verdict, 'unreliable', 'duplicate ip');
// Mask too short on PC: it thinks a remote host is local and ARPs in vain.
eq(v(lanTopo((t) => { t.hosts[0].ip = '10.0.0.5'; t.hosts[0].mask = '255.0.0.0'; return t; }), 'pc', 'srv').diagnosis.code, 'arp-timeout', 'host on wrong segment cannot be reached directly');
eq(v(lanTopo((t) => { t.hosts[2].ip = '192.168.2.50'; t.hosts[2].gateway = '192.168.2.1'; t.routers[0].ifaces[1].ip = '192.168.2.1'; t.hosts[0].mask = '255.255.0.0'; return t; }), 'pc', 'srv').diagnosis.code, 'arp-timeout', 'oversized mask makes a remote host look local');
// Router without a connected route for the server's network
eq(v(lanTopo((t) => { t.routers[0].ifaces[1].ip = '10.9.0.1'; return t; }), 'pc', 'srv').diagnosis.code, 'no-route', 'router interface on wrong subnet has no route to the server');
// Two routers with static routes
function twoRouters() {
  return {
    segments: [{ id: 'a', label: 'LAN A' }, { id: 'w', label: 'WAN link' }, { id: 'b', label: 'LAN B' }],
    hosts: [
      { id: 'h1', name: 'H1', segment: 'a', ip: '172.16.1.10', mask: '/24', gateway: '172.16.1.1' },
      { id: 'h2', name: 'H2', segment: 'b', ip: '172.16.2.10', mask: '/24', gateway: '172.16.2.1' },
    ],
    routers: [
      { id: 'r1', name: 'R1', ifaces: [{ segment: 'a', ip: '172.16.1.1', mask: '/24' }, { segment: 'w', ip: '192.0.2.1', mask: '/30' }], routes: [{ net: '172.16.2.0', mask: '/24', via: '192.0.2.2' }] },
      { id: 'r2', name: 'R2', ifaces: [{ segment: 'w', ip: '192.0.2.2', mask: '/30' }, { segment: 'b', ip: '172.16.2.1', mask: '/24' }], routes: [{ net: '172.16.1.0', mask: '/24', via: '192.0.2.1' }] },
    ],
  };
}
eq(v(twoRouters(), 'h1', 'h2').verdict, 'success', 'two routers with routes');
let tr = twoRouters(); tr.routers[1].routes = [];
eq(v(tr, 'h1', 'h2').diagnosis.code, 'reply-lost', 'missing return route');
tr = twoRouters(); tr.routers[0].routes = [];
eq(v(tr, 'h1', 'h2').diagnosis.code, 'no-route', 'missing forward route');
tr = twoRouters(); tr.routers[0].routes[0].via = '192.0.2.9';
eq(v(tr, 'h1', 'h2').diagnosis.code, 'bad-next-hop', 'bad next hop');
tr = twoRouters(); tr.routers[0].routes[0].via = '10.9.9.9';
eq(v(tr, 'h1', 'h2').diagnosis.code, 'bad-next-hop', 'next hop not connected');
tr = twoRouters(); tr.routers[0].routes[0].via = '192.0.2.1'; // points at itself... next hop is own interface
eq(['loop', 'bad-next-hop', 'no-route'].includes(v(tr, 'h1', 'h2').diagnosis.code), true, 'self next hop does not succeed');
tr = twoRouters(); tr.routers[0].routes.push({ net: '172.16.2.0', mask: '/25', via: '192.0.2.99' });
eq(v(tr, 'h1', '172.16.2.10').diagnosis.code, 'bad-next-hop', 'longest prefix match picks the more specific (bad) route');
tr = twoRouters(); tr.routers[0].routes = [{ net: '0.0.0.0', mask: '/0', via: '192.0.2.2' }];
eq(v(tr, 'h1', 'h2').verdict, 'success', 'default route works');
// routing loop
tr = twoRouters(); tr.routers[1].routes = [{ net: '172.16.2.0', mask: '/24', via: '192.0.2.1' }]; tr.hosts[1].segment = 'zzz';
eq(v(tr, 'h1', '172.16.2.10').diagnosis.code !== undefined, true, 'loop case yields a diagnosis');

/* ---- VLAN switching ---- */
function vlanTopo(over) {
  const t = {
    switches: [
      { id: 'sw1', name: 'SW1', vlans: [10, 20], ports: [
        { id: 'Fa0/1', mode: 'access', vlan: 10 }, { id: 'Fa0/2', mode: 'access', vlan: 10 }, { id: 'Fa0/3', mode: 'access', vlan: 20 },
        { id: 'Fa0/24', mode: 'trunk', allowed: [1, 10, 20], native: 1 }, { id: 'Gi0/1', mode: 'trunk', allowed: [1, 10, 20], native: 1 } ] },
      { id: 'sw2', name: 'SW2', vlans: [10, 20], ports: [
        { id: 'Fa0/1', mode: 'access', vlan: 10 }, { id: 'Fa0/2', mode: 'access', vlan: 20 }, { id: 'Gi0/1', mode: 'trunk', allowed: [1, 10, 20], native: 1 } ] },
    ],
    links: [{ a: { switch: 'sw1', port: 'Gi0/1' }, b: { switch: 'sw2', port: 'Gi0/1' } }],
    hosts: [
      { id: 'pc1', name: 'PC1', switch: 'sw1', port: 'Fa0/1', mac: 'AA:01', ip: '192.168.10.11', mask: '/24', gateway: '192.168.10.1' },
      { id: 'pc2', name: 'PC2', switch: 'sw1', port: 'Fa0/2', mac: 'AA:02', ip: '192.168.10.12', mask: '/24', gateway: '192.168.10.1' },
      { id: 'pc3', name: 'PC3', switch: 'sw1', port: 'Fa0/3', mac: 'AA:03', ip: '192.168.20.11', mask: '/24', gateway: '192.168.20.1' },
      { id: 'pc4', name: 'PC4', switch: 'sw2', port: 'Fa0/1', mac: 'AA:04', ip: '192.168.10.13', mask: '/24', gateway: '192.168.10.1' },
      { id: 'srv', name: 'Server', switch: 'sw2', port: 'Fa0/2', mac: 'AA:05', ip: '192.168.20.10', mask: '/24', gateway: '192.168.20.1' },
    ],
    routers: [{ id: 'r1', name: 'Router', switch: 'sw1', port: 'Fa0/24', mac: 'BB:01', subifs: [{ vlan: 10, ip: '192.168.10.1', mask: '/24' }, { vlan: 20, ip: '192.168.20.1', mask: '/24' }] }],
  };
  return over ? over(t) : t;
}
const vp = (t, a, b, st) => E.pgVlanPing(t, st || E.pgVlanNewState(), a, b);
eq(vp(vlanTopo(), 'pc1', 'pc2').verdict, 'success', 'same vlan same switch');
eq(vp(vlanTopo(), 'pc1', 'pc4').verdict, 'success', 'same vlan across trunk');
eq(vp(vlanTopo(), 'pc3', 'srv').verdict, 'success', 'vlan 20 across trunk');
eq(vp(vlanTopo(), 'pc1', 'pc3').verdict, 'success', 'inter-vlan through router on a stick');
eq(vp(vlanTopo(), 'pc1', 'srv').verdict, 'success', 'inter-vlan across the trunk');
eq(vp(vlanTopo((t) => { t.switches[0].ports[1].vlan = 20; return t; }), 'pc1', 'pc2').diagnosis.code, 'vlan-mismatch', 'port in wrong vlan');
eq(vp(vlanTopo((t) => { t.switches[0].ports[4].allowed = [1, 10]; return t; }), 'pc3', 'srv').diagnosis.code, 'vlan-not-allowed', 'vlan not allowed on trunk');
eq(vp(vlanTopo((t) => { t.switches[1].vlans = [10]; return t; }), 'pc3', 'srv').diagnosis.code, 'vlan-missing', 'vlan missing on switch');
eq(vp(vlanTopo((t) => { t.switches[0].ports[3] = { id: 'Fa0/24', mode: 'access', vlan: 10 }; return t; }), 'pc1', 'pc3').diagnosis.code, 'router-untagged', 'router port is access');
eq(vp(vlanTopo((t) => { t.routers = []; return t; }), 'pc1', 'pc3').diagnosis.code, 'arp-timeout', 'no router, gateway unreachable');
eq(vp(vlanTopo((t) => { t.hosts[0].gateway = ''; return t; }), 'pc1', 'pc3').diagnosis.code, 'no-gateway', 'host without gateway');
eq(vp(vlanTopo((t) => { t.routers[0].subifs.pop(); return t; }), 'pc1', 'pc3').diagnosis.code, 'no-route', 'router lacks the sub-interface');
// native VLAN mismatch with hosts in the native VLAN
const nativeTopo = (n2) => vlanTopo((t) => {
  t.switches[0].ports[1].vlan = 1; t.switches[1].ports[0].vlan = 1; t.switches[1].ports[2].native = n2;
  t.hosts[1].ip = '192.168.1.12'; t.hosts[1].gateway = ''; t.hosts[3].ip = '192.168.1.13'; t.hosts[3].gateway = '';
  return t;
});
eq(vp(nativeTopo(1), 'pc2', 'pc4').verdict, 'success', 'native vlan agrees');
let nr = vp(nativeTopo(99), 'pc2', 'pc4');
eq([nr.verdict, nr.diagnosis.code], ['failed', 'native-mismatch'], 'native vlan mismatch');
// MAC learning: the first frame floods, then the table is used
const first = vp(vlanTopo(), 'pc1', 'pc2');
eq(first.state.mac.sw1[10]['AA:01'], 'Fa0/1', 'switch learns the sender');
eq(first.state.mac.sw1[10]['AA:02'], 'Fa0/2', 'switch learns the replier');
const second = E.pgVlanPing(vlanTopo(), first.state, 'pc1', 'pc2');
eq(second.legs.some((l) => l.steps.some((x) => /unicast/.test(x.text))), true, 'second ping uses the MAC table');
eq(first.legs.some((l) => l.steps.some((x) => /floods the frame/.test(x.text))), false, 'a known-broadcast ARP is flooded, but the data frame only floods when unknown');

/* ---- scenarios replay (if the data exists) ---- */
const scenFile = path.join(root, 'dist/data/playground.json');
if (fs.existsSync(scenFile)) {
  const data = JSON.parse(fs.readFileSync(scenFile, 'utf8'));
  (data.ipconfig || []).forEach((sc) => {
    (sc.expect || []).forEach((ex, n) => {
      const r = E.pgPing(sc.topology, ex.from, ex.to);
      eq(r.verdict, ex.verdict, `scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `scenario ${sc.id} check ${n + 1} code`);
    });
    // The scenario's documented fix must make every "fixed" expectation pass.
    if (sc.fix && sc.expectFixed) {
      const t = E.pgApplyFixes(sc.topology, sc.fix);
      sc.expectFixed.forEach((ex, n) => {
        eq(E.pgPing(t, ex.from, ex.to).verdict, ex.verdict, `scenario ${sc.id} fixed check ${n + 1}`);
      });
    }
  });
}

if (fs.existsSync(scenFile)) {
  const data = JSON.parse(fs.readFileSync(scenFile, 'utf8'));
  (data.vlan || []).forEach((sc) => {
    (sc.expect || []).forEach((ex, n) => {
      const r = E.pgVlanPing(sc.topology, E.pgVlanNewState(), ex.from, ex.to);
      eq(r.verdict, ex.verdict, `vlan scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `vlan scenario ${sc.id} check ${n + 1} code`);
    });
    const t = E.pgVlanApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((ex, n) => {
      eq(E.pgVlanPing(t, E.pgVlanNewState(), ex.from, ex.to).verdict, ex.verdict, `vlan scenario ${sc.id} fixed check ${n + 1}`);
    });
  });
}

/* ---- firewall ---- */
function fwTopo(over) {
  const t = {
    fw: { name: 'FW', stateful: true, masquerade: true, hairpin: false,
      ifaces: [{ zone: 'inside', ip: '192.168.1.1', mask: '/24' }, { zone: 'dmz', ip: '172.16.0.1', mask: '/24' }, { zone: 'outside', ip: '203.0.113.2', mask: '/29' }],
      rules: [
        { id: 'r1', action: 'allow', fromZone: 'inside', toZone: 'outside', proto: 'any', src: 'any', dst: 'any', port: 'any' },
        { id: 'r3', action: 'allow', fromZone: 'outside', toZone: 'dmz', proto: 'tcp', src: 'any', dst: '172.16.0.10', port: '443' },
      ],
      forwards: [{ id: 'f1', proto: 'tcp', extPort: 443, toIp: '172.16.0.10', toPort: 443 }] },
    hosts: [
      { id: 'pc', name: 'PC', zone: 'inside', ip: '192.168.1.10', services: [] },
      { id: 'pc2', name: 'PC2', zone: 'inside', ip: '192.168.1.11', services: [{ proto: 'tcp', port: 22 }] },
      { id: 'web', name: 'Web', zone: 'dmz', ip: '172.16.0.10', services: [{ proto: 'tcp', port: 443 }] },
      { id: 'vis', name: 'Visitor', zone: 'outside', ip: '198.51.100.50', services: [] },
      { id: 'site', name: 'Site', zone: 'outside', ip: '93.184.216.34', services: [{ proto: 'tcp', port: 443 }] },
    ],
  };
  return over ? over(t) : t;
}
const ft = (t, from, to, proto, port) => E.pgFwTest(t, { from, to, proto, port });
eq(ft(fwTopo(), 'vis', 'fw-public', 'tcp', 443).verdict, 'success', 'published web server');
eq(ft(fwTopo(), 'vis', '203.0.113.2', 'tcp', 443).verdict, 'success', 'public address typed as an IP');
eq(ft(fwTopo(), 'vis', 'fw-public', 'tcp', 80).diagnosis.code, 'no-forward', 'port with no forward');
eq(ft(fwTopo(), 'vis', 'fw-public', 'udp', 443).diagnosis.code, 'no-forward', 'forward is TCP only');
eq(ft(fwTopo(), 'vis', 'web', 'tcp', 443).diagnosis.code, 'private-unroutable', 'private address from outside');
eq(ft(fwTopo(), 'pc', 'site', 'tcp', 443).verdict, 'success', 'outbound with NAT');
eq(ft(fwTopo(), 'pc', 'site', 'tcp', 8080).diagnosis.code, 'refused', 'service not listening');
eq(ft(fwTopo(), 'pc', 'pc2', 'tcp', 22).verdict, 'success', 'same zone bypasses the firewall');
eq(ft(fwTopo(), 'pc', 'web', 'tcp', 443).diagnosis.code, 'implicit-deny', 'no inside to dmz rule');
eq(ft(fwTopo((t) => { t.fw.masquerade = false; return t; }), 'pc', 'site', 'tcp', 443).diagnosis.code, 'no-nat', 'no source NAT');
eq(ft(fwTopo((t) => { t.fw.stateful = false; return t; }), 'pc', 'site', 'tcp', 443).diagnosis.code, 'return-blocked', 'stateless without return rule');
eq(ft(fwTopo((t) => { t.fw.stateful = false; t.fw.rules.push({ id: 'r9', action: 'allow', fromZone: 'outside', toZone: 'inside', proto: 'tcp', src: 'any', dst: 'any', port: '1024-65535' }); return t; }), 'pc', 'site', 'tcp', 443).verdict, 'success', 'stateless with a return rule');
eq(ft(fwTopo((t) => { t.fw.rules.unshift({ id: 'r0', action: 'deny', fromZone: 'outside', toZone: 'dmz', proto: 'any', src: 'any', dst: 'any', port: 'any' }); return t; }), 'vis', 'fw-public', 'tcp', 443).diagnosis.code, 'rule-denied', 'deny above allow');
eq(ft(fwTopo((t) => { t.fw.rules.unshift({ id: 'r0', action: 'deny', fromZone: 'outside', toZone: 'dmz', proto: 'any', src: 'any', dst: 'any', port: 'any' }); return t; }), 'vis', 'fw-public', 'tcp', 443).orderProblem, true, 'order problem is flagged');
eq(ft(fwTopo((t) => { t.fw.rules.unshift({ id: 'r0', action: 'deny', fromZone: 'any', toZone: 'any', proto: 'tcp', src: '198.51.100.0/24', dst: 'any', port: 'any' }); return t; }), 'vis', 'fw-public', 'tcp', 443).diagnosis.code, 'rule-denied', 'source range deny');
eq(ft(fwTopo((t) => { t.fw.forwards[0].toIp = '172.16.0.99'; return t; }), 'vis', 'fw-public', 'tcp', 443).diagnosis.code, 'forward-target-missing', 'forward to nothing');
eq(ft(fwTopo((t) => { t.fw.forwards[0].toPort = 8443; t.fw.rules[1].port = 'any'; return t; }), 'vis', 'fw-public', 'tcp', 443).diagnosis.code, 'refused', 'forward to the wrong port (rule allows it, service absent)');
eq(ft(fwTopo((t) => { t.fw.forwards[0].toPort = 8443; return t; }), 'vis', 'fw-public', 'tcp', 443).diagnosis.code, 'implicit-deny', 'rules match the translated port');
eq(ft(fwTopo(), 'pc', 'site', 'icmp', null).verdict, 'success', 'ping through NAT');
eq(ft(fwTopo(), 'pc', 'site', 'tcp', 'abc').diagnosis.code, 'bad-port', 'bad port');
// hairpin
const hp = (hair) => fwTopo((t) => { t.fw.forwards = [{ id: 'f1', proto: 'tcp', extPort: 22, toIp: '192.168.1.11', toPort: 22 }]; t.fw.hairpin = hair; return t; });
eq(ft(hp(false), 'pc', 'fw-public', 'tcp', 22).diagnosis.code, 'hairpin', 'hairpin missing');
eq(ft(hp(true), 'pc', 'fw-public', 'tcp', 22).verdict, 'success', 'hairpin enabled');
eq(E.pgFwEvaluate({ rules: [{ id: 'x', action: 'allow', fromZone: 'any', toZone: 'any', proto: 'tcp', src: '10.0.0.0/8', dst: 'any', port: '80-90' }] }, { proto: 'tcp', srcIp: E.pgParseIPv4('10.1.1.1'), srcZone: 'a', dstIp: 1, dstZone: 'b', dstPort: 85 }).index, 0, 'rule matching with cidr and range');
eq(E.pgFwEvaluate({ rules: [{ id: 'x', action: 'allow', fromZone: 'any', toZone: 'any', proto: 'tcp', src: '10.0.0.0/8', dst: 'any', port: '80-90' }] }, { proto: 'tcp', srcIp: E.pgParseIPv4('11.1.1.1'), srcZone: 'a', dstIp: 1, dstZone: 'b', dstPort: 85 }), null, 'rule not matching outside cidr');

if (fs.existsSync(scenFile)) {
  const data = JSON.parse(fs.readFileSync(scenFile, 'utf8'));
  (data.firewall || []).forEach((sc) => {
    (sc.expect || []).forEach((ex, n) => {
      const r = E.pgFwTest(sc.topology, ex);
      eq(r.verdict, ex.verdict, `firewall scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `firewall scenario ${sc.id} check ${n + 1} code`);
    });
    const t = E.pgFwApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((ex, n) => eq(E.pgFwTest(t, ex).verdict, ex.verdict, `firewall scenario ${sc.id} fixed check ${n + 1}`));
  });
  if (data.firewallSandbox) {
    eq(E.pgFwTest(data.firewallSandbox, { from: 'visitor', to: 'fw-public', proto: 'tcp', port: 443 }).verdict, 'success', 'firewall sandbox starts working');
    eq(E.pgFwTest(data.firewallSandbox, { from: 'pc', to: 'site', proto: 'tcp', port: 443 }).verdict, 'success', 'firewall sandbox outbound works');
  }
  if (data.vlanSandbox) eq(E.pgVlanPing(data.vlanSandbox, E.pgVlanNewState(), 'pc1', 'srv').verdict, 'success', 'vlan sandbox starts working');
}

if (failures) { console.error(`\n${failures} of ${checks} playground checks failed`); process.exit(1); }
console.log(`playground engine: ${checks} checks passed`);
