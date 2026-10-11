/* Checks for the Spanning Tree lab (src/js/03c_pg_stp.js, data/playground_stp.py). */
module.exports = ({ E, eq, data }) => {
  let o;
  const sandbox = () => JSON.parse(JSON.stringify(data.stpSandbox));
  const fix = (t, fixes) => E.pgStpApplyFixes(t, fixes);
  const ports = (r) => r.ports.map((p) => `${p.key}=${p.role}/${p.state}`).sort();
  const roleOf = (r, key) => (r.portMap[key] ? `${r.portMap[key].role}/${r.portMap[key].state}` : 'missing');
  const mk = (id, name, priority, mac) => ({ id, name, priority, mac, stp: true });
  const lk = (id, a, ap, b, bp, speed, extra) => Object.assign({ id, speed, disabled: false, a: { sw: a, port: ap, cost: null, prio: null }, b: { sw: b, port: bp, cost: null, prio: null } }, extra || {});

  /* ---- small helpers ---- */
  eq(E.pgStpMacNorm('7A:10:00:00:00:01'), '7a1000000001', 'mac with colons');
  eq(E.pgStpMacNorm('7a10.0000.0001'), '7a1000000001', 'mac in dotted form');
  eq(E.pgStpMacNorm('7a-10-00-00-00-01'), '7a1000000001', 'mac with dashes');
  eq(E.pgStpMacNorm('7a:10:00:00:00'), null, 'mac too short');
  eq(E.pgStpMacNorm('zz:10:00:00:00:01'), null, 'mac not hex');
  eq(E.pgStpMacText('7a1000000001'), '7a:10:00:00:00:01', 'mac text');
  eq(E.pgStpPortNum('Gi0/12'), 12, 'port number');
  eq(E.pgStpSpeedText(10000), '10 Gbps', 'speed text 10G');
  eq(E.pgStpSpeedText(100), '100 Mbps', 'speed text 100M');
  eq(E.pgStpCodes().includes('loop-no-stp') && E.pgStpCodes().includes('wrong-root') && E.pgStpCodes().includes('no-backup-root') && E.pgStpCodes().includes('suboptimal-path'), true, 'diagnosis codes listed');

  /* ---- validation ---- */
  eq(E.pgStpValidate(sandbox()), [], 'sandbox is a valid setup');
  let t = sandbox(); t.switches[1].mac = t.switches[0].mac;
  eq(E.pgStpValidate(t).some((m) => /already used/.test(m)), true, 'duplicate MAC rejected');
  t = sandbox(); t.switches[0].priority = 5000;
  eq(E.pgStpValidate(t).some((m) => /multiple of 4096/.test(m)), true, 'priority must be a multiple of 4096');
  t = sandbox(); t.switches[0].mac = 'nonsense';
  eq(E.pgStpValidate(t).some((m) => /not a MAC/.test(m)), true, 'bad MAC rejected');
  t = sandbox(); t.links[1].a.port = 'Te0/1';
  eq(E.pgStpValidate(t).some((m) => /already used/.test(m)), true, 'a port cannot be used twice');
  t = sandbox(); t.links[0].speed = 40;
  eq(E.pgStpValidate(t).some((m) => /speed/.test(m)), true, 'unknown speed rejected');
  t = sandbox(); t.links[0].a.cost = 0;
  eq(E.pgStpValidate(t).some((m) => /manual cost/.test(m)), true, 'cost 0 rejected');
  t = sandbox(); t.links[0].b.sw = 'ghost';
  eq(E.pgStpValidate(t).some((m) => /known switch/.test(m)), true, 'link to unknown switch rejected');
  t = sandbox(); t.costTable = 'medium';
  eq(E.pgStpValidate(t).some((m) => /short or long/.test(m)), true, 'cost method validated');
  eq(E.pgStpCompute(t).errors.length > 0 && E.pgStpTest(t, { check: 'health' }).diagnosis.code, 'bad-setup', 'invalid setup returns bad-setup');
  eq(E.pgStpValidate(null).length, 1, 'null setup rejected');

  /* ---- the sandbox: root election, root ports, designated and alternate ports ---- */
  let r = E.pgStpCompute(sandbox());
  eq([r.root, r.rootName, r.roots, r.loop, r.realComps], ['core1', 'Core-1', ['core1'], false, 1], 'sandbox elects Core-1');
  eq(ports(r), ['acc1:Gi0/1=root/forwarding', 'acc1:Gi0/2=alternate/discarding', 'acc2:Gi0/1=root/forwarding', 'acc2:Gi0/2=alternate/discarding', 'core1:Gi0/2=designated/forwarding', 'core1:Gi0/3=designated/forwarding', 'core1:Te0/1=designated/forwarding', 'core2:Gi0/2=designated/forwarding', 'core2:Gi0/3=designated/forwarding', 'core2:Te0/1=root/forwarding'], 'sandbox port roles');
  eq(r.links.map((l) => `${l.id}:${l.status}`), ['cc:forwarding', 'a1c1:forwarding', 'a1c2:blocked', 'a2c1:forwarding', 'a2c2:blocked'], 'sandbox link states');
  eq(r.nodes.map((n) => `${n.id}:${n.rootCost}`), ['core1:0', 'core2:2', 'acc1:4', 'acc2:4'], 'root path costs with the short table');
  eq(r.portMap['acc1:Gi0/1'].cost, 4, '1 Gbps port costs 4 (short)');
  eq(r.portMap['core1:Te0/1'].cost, 2, '10 Gbps port costs 2 (short)');
  eq(r.nodes.find((n) => n.id === 'acc1').rootPort, 'acc1:Gi0/1', 'root port recorded');
  eq(r.trace.election.length >= 2 && /Core-1/.test(r.trace.election[1].text) && /lowest priority/.test(r.trace.election[1].text), true, 'election trace says priority decided');
  eq(E.pgStpTest(sandbox(), { check: 'health' }).verdict, 'success', 'sandbox is healthy');
  eq(E.pgStpTest(sandbox(), { check: 'root', switch: 'core1' }).verdict, 'success', 'sandbox root check');
  eq(E.pgStpTest(sandbox(), { check: 'backup-root', switch: 'core2' }).verdict, 'success', 'sandbox backup root check');
  eq(E.pgStpTest(sandbox(), { check: 'redundant' }).verdict, 'success', 'sandbox survives any single cable failure');
  eq(E.pgStpTest(sandbox(), { check: 'survive', link: 'a1c1' }).verdict, 'success', 'sandbox survives losing an uplink');
  eq(E.pgStpTest(sandbox(), { check: 'no-loop' }).verdict, 'success', 'sandbox has no loop');
  eq(E.pgStpTest(sandbox(), { check: 'forwarding', link: 'cc' }).verdict, 'success', 'core link forwards');
  eq(E.pgStpTest(sandbox(), { check: 'forwarding', link: 'a1c2' }).diagnosis.code, 'suboptimal-path', 'blocked link is reported');
  eq(E.pgStpTest(sandbox(), { check: 'path', from: 'acc1', to: 'acc2' }).summary, 'Traffic from Acc-1 to Acc-2: Acc-1 to Core-1 to Acc-2.', 'path through the root');
  eq(E.pgStpPath(r, 'acc1', 'acc2').bottleneck, 1000, 'bottleneck speed of a path');
  eq(E.pgStpPath(r, 'acc1', 'acc1').links.length, 0, 'path to itself');
  eq(r.edges.map((e) => `${e.id}:${e.state}`), ['e1:forwarding', 'e2:forwarding'], 'edge ports forward');
  eq(/PortFast/.test(r.edges[0].note) && /about 30 seconds/.test(r.edges[1].note), true, 'PortFast notes');

  /* ---- election rules: priority first, then MAC ---- */
  t = sandbox(); t.switches[3].priority = 0;               // Acc-2 gets the lowest priority
  eq(E.pgStpCompute(t).root, 'acc2', 'lowest priority wins the election');
  t = sandbox(); t.switches.forEach((s) => { s.priority = 32768; });
  eq(E.pgStpCompute(t).root, 'core1', 'equal priority: lowest MAC wins (Core-1 7a:10..01)');
  t.switches[1].mac = '00:00:5e:00:53:07';
  eq(E.pgStpCompute(t).root, 'core2', 'equal priority: lowest MAC wins (a MAC starting 00 beats 7a)');
  eq(/lowest MAC address decides/.test(E.pgStpCompute(t).trace.election[1].text), true, 'trace names the MAC tie-break');
  t.switches[0].priority = 61440; t.switches[1].priority = 61440; t.switches[2].priority = 4096;
  eq(E.pgStpCompute(t).root, 'acc1', 'a lower priority beats a lower MAC');
  t = sandbox(); t.switches[2].mac = '00:00:00:00:00:01'; t.switches[0].priority = 0; t.switches[1].priority = 0; t.switches[2].priority = 0; t.switches[3].priority = 0;
  eq(E.pgStpCompute(t).root, 'acc1', 'all priority 0: MAC decides');

  /* ---- cost tables ---- */
  t = sandbox(); t.costTable = 'long';
  r = E.pgStpCompute(t);
  eq([r.portMap['acc1:Gi0/1'].cost, r.portMap['core1:Te0/1'].cost, r.nodes.find((n) => n.id === 'acc1').rootCost], [20000, 2000, 20000], 'long path costs');
  t = sandbox(); t.links.forEach((l) => { l.speed = 100; });
  eq(E.pgStpCompute(t).portMap['acc1:Gi0/1'].cost, 19, '100 Mbps costs 19 (short)');
  t.links.forEach((l) => { l.speed = 10; });
  eq(E.pgStpCompute(t).portMap['acc1:Gi0/1'].cost, 100, '10 Mbps costs 100 (short)');
  t.costTable = 'long';
  eq(E.pgStpCompute(t).portMap['acc1:Gi0/1'].cost, 2000000, '10 Mbps costs 2000000 (long)');

  /* ---- manual cost: added by the receiving port ---- */
  t = sandbox(); t.links[1].b.cost = 100;                  // Acc-1 end of a1c1
  r = E.pgStpCompute(t);
  eq([roleOf(r, 'acc1:Gi0/1'), roleOf(r, 'acc1:Gi0/2')], ['alternate/discarding', 'root/forwarding'], 'manual cost on the receiving port moves the root port');
  eq(r.nodes.find((n) => n.id === 'acc1').rootCost, 6, 'path via the other core costs 4 + 2');
  t = sandbox(); t.links[1].a.cost = 100;                  // Core-1 end: the root never adds its own port cost
  eq(roleOf(E.pgStpCompute(t), 'acc1:Gi0/1'), 'root/forwarding', 'a manual cost on the root bridge side does not matter');
  eq(E.pgStpCompute(t).portMap['core1:Gi0/2'].manualCost, true, 'manual cost is flagged');

  /* ---- tie-breaks: sender bridge ID, sender port ID ---- */
  const diamond = () => ({
    costTable: 'short',
    switches: [mk('x', 'X', 0, '00:00:00:00:00:01'), mk('a', 'A', 4096, '00:00:00:00:00:0a'), mk('b', 'B', 4096, '00:00:00:00:00:0b'), mk('s', 'S', 32768, '00:00:00:00:00:0c')],
    links: [lk('xa', 'x', 'Gi0/1', 'a', 'Gi0/1', 1000), lk('xb', 'x', 'Gi0/2', 'b', 'Gi0/1', 1000), lk('sa', 'a', 'Gi0/2', 's', 'Gi0/1', 1000), lk('sb', 'b', 'Gi0/2', 's', 'Gi0/2', 1000)],
    edges: [],
  });
  r = E.pgStpCompute(diamond());
  eq(r.root, 'x', 'diamond: X is root');
  eq([roleOf(r, 's:Gi0/1'), roleOf(r, 's:Gi0/2')], ['root/forwarding', 'alternate/discarding'], 'equal cost: the lower sender bridge ID (A) wins the root port');
  eq(r.nodes.find((n) => n.id === 's').rootInfo.reason, 'sender-bridge', 'reason is the sender bridge ID');
  t = diamond(); t.switches[1].priority = 8192;           // A is now worse than B
  r = E.pgStpCompute(t);
  eq([roleOf(r, 's:Gi0/1'), roleOf(r, 's:Gi0/2')], ['alternate/discarding', 'root/forwarding'], 'priority decides the sender tie-break');
  t = diamond(); t.switches[1].priority = 8192; t.switches[2].priority = 8192;
  eq(roleOf(E.pgStpCompute(t), 's:Gi0/1'), 'root/forwarding', 'equal priorities then the lower MAC of the sender');
  // parallel links: sender port ID
  const parallel = () => ({
    costTable: 'short',
    switches: [mk('r', 'R', 0, '00:00:00:00:00:01'), mk('s', 'S', 32768, '00:00:00:00:00:02'), mk('q', 'Q', 32768, '00:00:00:00:00:03')],
    links: [lk('p1', 'r', 'Gi0/1', 's', 'Gi0/1', 1000), lk('p2', 'r', 'Gi0/2', 's', 'Gi0/2', 1000), lk('rq', 'r', 'Gi0/3', 'q', 'Gi0/1', 1000)],
    edges: [],
  });
  r = E.pgStpCompute(parallel());
  eq([roleOf(r, 's:Gi0/1'), roleOf(r, 's:Gi0/2')], ['root/forwarding', 'alternate/discarding'], 'parallel links: the lower sender port ID wins');
  eq(r.nodes.find((n) => n.id === 's').rootInfo.reason, 'sender-port', 'reason is the sender port ID');
  t = parallel(); t.links[1].a.prio = 64;                  // R's Gi0/2 now has port ID 64.2
  eq([roleOf(E.pgStpCompute(t), 's:Gi0/1'), roleOf(E.pgStpCompute(t), 's:Gi0/2')], ['alternate/discarding', 'root/forwarding'], 'port priority changes the port ID tie-break');
  eq(E.pgStpValidate(parallel()), [], 'parallel topology is valid');

  /* ---- designated port on a segment: equal cost goes to the lower bridge ID ---- */
  r = E.pgStpCompute(data.stp[0].topology);
  eq(roleOf(r, 'core1:Te0/1') + ' ' + roleOf(r, 'dist1:Te0/1'), 'designated/forwarding alternate/discarding', 'equal cost segment: lower bridge ID is designated');
  eq(/lower bridge ID wins/.test(r.portMap['core1:Te0/1'].why), true, 'designated reason mentions the bridge ID');
  eq(/standby path/.test(r.portMap['dist1:Te0/1'].why), true, 'alternate reason mentions the standby path');

  /* ---- backup port: a cable between two ports of one switch ---- */
  t = sandbox(); t.links.push(lk('self', 'acc1', 'Gi0/20', 'acc1', 'Gi0/21', 1000));
  r = E.pgStpCompute(t);
  eq([roleOf(r, 'acc1:Gi0/20'), roleOf(r, 'acc1:Gi0/21')], ['designated/forwarding', 'backup/discarding'], 'self-loop cable: lower port ID designated, the other backup');
  eq([r.loop, r.links.find((l) => l.id === 'self').status], [false, 'blocked'], 'self-loop cable is blocked when STP runs');
  eq(E.pgStpTest(t, { check: 'no-loop' }).verdict, 'success', 'no storm from the self-loop with STP on');
  t.switches[2].stp = false;
  r = E.pgStpCompute(t);
  eq([r.loop, r.loopLinks.includes('self')], [true, true], 'self-loop cable with STP off is a loop');
  eq(E.pgStpTest(t, { check: 'no-loop' }).diagnosis.code, 'loop-no-stp', 'self-loop with STP off is loop-no-stp');
  // a self-loop on the root bridge
  t = sandbox(); t.links.push(lk('self', 'core1', 'Gi0/20', 'core1', 'Gi0/21', 1000));
  eq([roleOf(E.pgStpCompute(t), 'core1:Gi0/20'), roleOf(E.pgStpCompute(t), 'core1:Gi0/21')], ['designated/forwarding', 'backup/discarding'], 'self-loop on the root bridge');

  /* ---- link failure: the blocked port starts forwarding ---- */
  t = sandbox(); t.links[1].disabled = true;               // a1c1 cut
  r = E.pgStpCompute(t);
  eq([roleOf(r, 'acc1:Gi0/1'), roleOf(r, 'acc1:Gi0/2'), r.links.find((l) => l.id === 'a1c1').status], ['down/down', 'root/forwarding', 'down'], 'alternate port takes over');
  eq(r.nodes.find((n) => n.id === 'acc1').rootCost, 6, 'new root path cost after the failure');
  let d = E.pgStpDiff(E.pgStpCompute(sandbox()), r);
  eq(d.filter((x) => x.kind === 'unblocked').map((x) => x.port), ['acc1:Gi0/2'], 'diff names the port that starts forwarding');
  eq(d.some((x) => /starts forwarding/.test(x.text)), true, 'diff text says a blocked port starts forwarding');
  eq(E.pgStpDiff(r, r), [], 'no diff against itself');
  eq(E.pgStpDiff(null, r), [], 'no diff without a before');
  t = sandbox(); t.links[0].disabled = true;               // the core link cut
  r = E.pgStpCompute(t);
  eq([r.root, roleOf(r, 'core2:Gi0/2')], ['core1', 'root/forwarding'], 'core link cut: Core-2 reaches the root through an access switch');
  eq(r.nodes.find((n) => n.id === 'core2').rootCost, 8, 'Core-2 path via Acc-1 costs 4 + 4');
  t = sandbox(); t.links[1].disabled = true; t.links[3].disabled = true;   // Core-1 loses both uplinks to access
  eq(E.pgStpCompute(t).root, 'core1', 'root unchanged when its access links fail');
  eq(E.pgStpTest(sandbox(), { check: 'survive', link: 'a1c1' }).steps.some((s) => /starts forwarding/.test(s.text)), true, 'survive check names the port that takes over');

  /* ---- root failure: the next root ---- */
  r = E.pgStpCompute(sandbox(), { downSwitches: ['core1'] });
  eq([r.root, r.nodes.length], ['core2', 3], 'if Core-1 fails Core-2 becomes root');
  t = sandbox(); t.switches[1].priority = 61440;
  o = E.pgStpTest(t, { check: 'backup-root', switch: 'core2' });
  eq([o.verdict, o.diagnosis.code, /Acc-1/.test(o.summary)], ['failed', 'no-backup-root', true], 'a worse priority on the backup lets an access switch win');
  eq(E.pgStpTest(sandbox(), { check: 'backup-root', switch: 'core1' }).diagnosis.code, 'no-backup-root', 'the root cannot be its own backup');

  /* ---- STP off: loops and storms ---- */
  t = sandbox(); t.switches[3].stp = false;
  r = E.pgStpCompute(t);
  eq([r.loop, r.loopLinks.sort()], [true, ['a2c1', 'a2c2', 'cc']], 'STP off on Acc-2 closes the ring Core-1, Core-2, Acc-2');
  eq(E.pgStpTest(t, { check: 'no-loop' }).diagnosis.code, 'loop-no-stp', 'loop-no-stp is reported');
  eq(E.pgStpTest(t, { check: 'no-loop' }).diagnosis.deviceId, 'acc2', 'the STP-off switch is named');
  eq(E.pgStpTest(t, { check: 'health' }).diagnosis.code, 'loop-no-stp', 'health reports the loop');
  eq([roleOf(r, 'acc2:Gi0/1'), roleOf(r, 'core1:Gi0/3')], ['off/forwarding', 'designated/forwarding'], 'STP-off ports forward and neighbours stay designated');
  eq(E.pgStpTest(sandbox(), { check: 'redundant' }).verdict, 'success', 'sanity: redundant with STP on');
  eq(r.storm.hops.length, 6, 'storm simulation covers six hops');
  eq(r.storm.hops[0].copies >= 2, true, 'storm starts with copies in both directions');
  t = sandbox(); t.switches.forEach((s) => { s.stp = false; });
  r = E.pgStpCompute(t);
  eq([r.loop, r.storm.growing, r.storm.copies > r.storm.hops[0].copies], [true, true, true], 'a meshed loop multiplies the copies');
  t = sandbox(); t.switches[3].stp = false; t.links[3].disabled = true;
  eq(E.pgStpCompute(t).loop, false, 'cutting a cable also removes the loop');
  // STP off leaf switch: no loop
  t = sandbox(); t.links.splice(4, 1); t.switches[3].stp = false;
  eq([E.pgStpCompute(t).loop, E.pgStpCompute(t).realComps], [false, 1], 'an STP-off switch with a single cable makes no loop');
  // STP off in the middle splits the spanning tree in two
  t = { costTable: 'short', switches: [mk('a', 'A', 0, '00:00:00:00:00:01'), mk('m', 'M', 32768, '00:00:00:00:00:02'), mk('b', 'B', 32768, '00:00:00:00:00:03')], links: [lk('am', 'a', 'Gi0/1', 'm', 'Gi0/1', 1000), lk('mb', 'm', 'Gi0/2', 'b', 'Gi0/1', 1000)], edges: [] };
  t.switches[1].stp = false;
  r = E.pgStpCompute(t);
  eq([r.roots.sort(), r.multiRoot, r.loop], [['a', 'b'], true, false], 'a switch with STP off splits the spanning tree');
  o = E.pgStpTest(t, { check: 'root', switch: 'a' });
  eq([o.verdict, o.diagnosis.code], ['failed', 'wrong-root'], 'two roots is not one root');
  o = E.pgStpTest(t, { check: 'root', switch: 'm' });
  eq([o.verdict, /STP is turned off/.test(o.summary)], ['failed', true], 'an STP-off switch cannot be root');

  /* ---- partitions ---- */
  t = sandbox(); t.links[1].disabled = true; t.links[2].disabled = true;
  o = E.pgStpTest(t, { check: 'health' });
  eq([o.verdict, o.diagnosis.code, /Acc-1/.test(o.summary)], ['failed', 'partitioned', true], 'both uplinks down: Acc-1 is cut off');
  eq(E.pgStpTest(t, { check: 'path', from: 'acc1', to: 'core1' }).diagnosis.code, 'no-path', 'no path to a cut-off switch');
  eq(E.pgStpTest(t, { check: 'survive', link: 'a2c1' }).diagnosis.code, 'partitioned', 'survive refuses when already cut off');
  t = sandbox(); t.links[2].disabled = true;
  o = E.pgStpTest(t, { check: 'survive', link: 'a1c1' });
  eq([o.verdict, o.diagnosis.code], ['failed', 'no-redundancy'], 'a disabled standby uplink leaves no redundancy');
  o = E.pgStpTest(t, { check: 'redundant' });
  eq([o.verdict, o.diagnosis.code], ['failed', 'no-redundancy'], 'redundant check finds the weak link');

  /* ---- rogue switch on an edge port and BPDU guard ---- */
  t = sandbox(); t.edges[1].device = 'switch'; t.edges[1].rogue = { priority: 0, mac: '00:00:5e:00:53:63' };
  r = E.pgStpCompute(t);
  eq([r.root, r.rootName], ['~e2', 'Wall socket 12'], 'a switch on an edge port can win the election');
  o = E.pgStpTest(t, { check: 'root', switch: 'core1' });
  eq([o.verdict, o.diagnosis.code, o.diagnosis.deviceId, o.diagnosis.field], ['failed', 'rogue-root', 'e2', 'bpduGuard'], 'rogue-root diagnosis points at the edge port');
  t.edges[1].bpduGuard = true;
  r = E.pgStpCompute(t);
  eq([r.root, r.edges[1].state, r.nodes.length], ['core1', 'errdisabled', 4], 'BPDU guard error-disables the port and the root is back');
  eq(E.pgStpTest(t, { check: 'root', switch: 'core1' }).verdict, 'success', 'root check passes with BPDU guard');
  t = sandbox(); t.edges[1].device = 'switch'; t.edges[1].rogue = { priority: 61440, mac: '00:00:5e:00:53:63' };
  r = E.pgStpCompute(t);
  eq([r.root, roleOf(r, 'acc2:Fa0/10'), roleOf(r, '~e2:Fa0/1')], ['core1', 'designated/forwarding', 'root/forwarding'], 'a harmless switch joins the tree');
  eq(E.pgStpValidate((() => { const x = sandbox(); x.edges[1].device = 'switch'; x.edges[1].rogue = { priority: 1, mac: 'x' }; return x; })()).length >= 2, true, 'an edge switch needs a valid priority and MAC');
  eq(E.pgStpCompute(sandbox(), { downSwitches: ['~e1'] }).edges.length, 1, 'a down edge device is dropped');

  /* ---- goals have wording ---- */
  const topo0 = sandbox();
  [{ check: 'health' }, { check: 'no-loop' }, { check: 'root', switch: 'core1' }, { check: 'backup-root', switch: 'core2' }, { check: 'survive', link: 'a1c1' }, { check: 'redundant' }, { check: 'forwarding', link: 'cc' }, { check: 'path', from: 'acc1', to: 'core1', via: 'a1c1' }].forEach((g) => {
    eq(typeof E.pgStpGoalText(topo0, g) === 'string' && E.pgStpGoalText(topo0, g).length > 10, true, `goal text for ${g.check}`);
  });
  eq(E.pgStpGoalText(topo0, { check: 'root', switch: 'core1' }), 'Core-1 is the root bridge', 'root goal wording');
  eq(E.pgStpLinkName(topo0, 'a1c1'), 'Core-1 (Gi0/2) to Acc-1 (Gi0/1)', 'link name');
  eq(E.pgStpTest(topo0, { check: 'root', switch: 'ghost' }).diagnosis.code, 'bad-goal', 'unknown switch in a goal');
  eq(E.pgStpTest(topo0, { check: 'nonsense' }).diagnosis.code, 'bad-goal', 'unknown check');

  /* ---- apply fixes does not touch the original ---- */
  const orig = sandbox();
  const fixed = fix(orig, [{ switch: 'core1', field: 'priority', value: 0 }, { link: 'cc', field: 'speed', value: 1000 }, { link: 'a1c1', end: 'b', field: 'cost', value: 7 }, { edge: 'e2', field: 'bpduGuard', value: true }, { costTable: 'long' }]);
  eq([orig.switches[0].priority, fixed.switches[0].priority, fixed.links[0].speed, fixed.links[1].b.cost, fixed.edges[1].bpduGuard, fixed.costTable], [4096, 0, 1000, 7, true, 'long'], 'applyFixes edits a copy');

  /* ---- replay every scenario: broken outcomes, the fix, the sandbox ---- */
  eq((data.stp || []).length >= 6 && data.stp.length <= 8, true, 'six to eight scenarios');
  eq(E.pgStpValidate(data.stpSandbox), [], 'data sandbox validates');
  const codes = E.pgStpCodes();
  (data.stp || []).forEach((sc) => {
    eq(E.pgStpValidate(sc.topology), [], `stp scenario ${sc.id}: topology validates`);
    eq(sc.topology.switches.length >= 3 && sc.topology.switches.length <= 5, true, `stp scenario ${sc.id}: three to five switches`);
    const before = JSON.stringify(sc.topology);
    sc.expect.forEach((ex, n) => {
      const o2 = E.pgStpTest(sc.topology, ex);
      eq(o2.verdict, ex.verdict, `stp scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) {
        eq(o2.diagnosis && o2.diagnosis.code, ex.code, `stp scenario ${sc.id} check ${n + 1} code`);
        eq(codes.includes(ex.code), true, `stp scenario ${sc.id} check ${n + 1}: code is a known code`);
      }
      eq(o2.steps.length > 0 && o2.summary.length > 0, true, `stp scenario ${sc.id} check ${n + 1} explains itself`);
    });
    eq(E.pgStpTest(sc.topology, sc.ask).verdict, 'failed', `stp scenario ${sc.id}: the default question fails on the broken setup`);
    const fixedTopo = E.pgStpApplyFixes(sc.topology, sc.fix);
    eq(JSON.stringify(sc.topology), before, `stp scenario ${sc.id}: the fix leaves the original untouched`);
    sc.expectFixed.forEach((ex, n) => {
      eq(E.pgStpTest(fixedTopo, ex).verdict, ex.verdict, `stp scenario ${sc.id} fixed check ${n + 1}`);
    });
    eq(sc.expectFixed.some((ex) => E.pgStpTest(sc.topology, ex).verdict !== ex.verdict), true, `stp scenario ${sc.id}: something is actually broken before the fix`);
    sc.expectFixed.concat(sc.expect).forEach((g) => eq(E.pgStpGoalText(sc.topology, g).length > 10, true, `stp scenario ${sc.id}: goal wording`));
  });
  eq(E.pgStpTest(data.stpSandbox, { check: 'health' }).verdict, 'success', 'stp sandbox starts working');
  eq(E.pgStpTest(data.stpSandbox, { check: 'root', switch: 'core1' }).verdict, 'success', 'stp sandbox root is Core-1');
};
