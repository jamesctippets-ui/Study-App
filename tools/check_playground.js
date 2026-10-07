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

if (failures) { console.error(`\n${failures} of ${checks} playground checks failed`); process.exit(1); }
console.log(`playground engine: ${checks} checks passed`);
