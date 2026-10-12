/* Checks for the DHCP lab: engine unit tests (src/js/03c_pg_dhcp.js, including DHCP snooping, a rogue server and a
 * starvation flood), a replay of every scenario in data/playground_dhcp.py (the broken outcome and the fixed outcome)
 * and the sandbox. */
module.exports = ({ E, eq, data }) => {
  const has = (text, re) => re.test(text || '');
  const code = (r) => (r.diagnosis ? r.diagnosis.code : null);
  const text = (r) => r.steps.map((s) => s.text).join(' | ');
  const set = (t, path, value) => E.pgDhcpSetPath(t, path, value);

  const client = (id, n, extra) => Object.assign({ id, name: id.toUpperCase(), segment: 'lan', mode: 'dhcp', mac: `aa:00:00:00:00:${String(n).padStart(2, '0')}`, probe: true, ip: '', mask: '', gateway: '' }, extra || {});
  const stat = (id, ip, segment) => ({ id, name: id.toUpperCase(), segment: segment || 'lan', mode: 'static', mac: '', probe: true, ip, mask: '255.255.255.0', gateway: '' });
  const scope = (extra) => Object.assign({ id: 's1', name: 'Office', network: '192.168.10.0', mask: '255.255.255.0', start: '192.168.10.100', end: '192.168.10.110', excluded: '', gateway: '192.168.10.1', dns: '192.168.10.5', leaseHours: 8 }, extra || {});
  // The server is on the same LAN as the clients (no relay needed).
  const flat = (hosts, scopeExtra) => ({
    segments: [{ id: 'lan', label: 'Office LAN' }],
    router: { name: 'Router', ifaces: [{ segment: 'lan', ip: '192.168.10.1', mask: '255.255.255.0', helper: '' }] },
    server: { name: 'DHCP server', segment: 'lan', ip: '192.168.10.5', mask: '255.255.255.0', online: true, conflictDetection: false, scopes: [scope(scopeExtra)] },
    dns: ['192.168.10.5'],
    hosts: hosts || [client('c1', 1), client('c2', 2)],
  });
  // The server is on its own LAN; the clients reach it through the router's relay.
  const relay = (helper, hosts) => ({
    segments: [{ id: 'lan', label: 'Office' }, { id: 'srv', label: 'Server LAN' }],
    router: { name: 'Router', ifaces: [{ segment: 'lan', ip: '192.168.10.1', mask: '255.255.255.0', helper: helper === undefined ? '10.0.0.5' : helper }, { segment: 'srv', ip: '10.0.0.1', mask: '255.255.255.0', helper: '' }] },
    server: { name: 'DHCP server', segment: 'srv', ip: '10.0.0.5', mask: '255.255.255.0', online: true, conflictDetection: false, scopes: [scope({ dns: '10.0.0.53' })] },
    dns: ['10.0.0.53'],
    hosts: (hosts || [client('c1', 1)]).concat([stat('dns', '10.0.0.53', 'srv'), stat('files', '10.0.0.20', 'srv')]),
  });

  /* ---- parsers and formatters ---- */
  eq(E.pgDhcpHours('8'), 8, 'dhcp hours parse');
  eq(E.pgDhcpHours(0.5), 0.5, 'dhcp hours half an hour');
  eq(E.pgDhcpHours('0'), null, 'dhcp hours zero rejected');
  eq(E.pgDhcpHours('abc'), null, 'dhcp hours text rejected');
  eq(E.pgDhcpHours(24 * 365 + 1), null, 'dhcp hours over a year rejected');
  eq(E.pgDhcpHours(''), null, 'dhcp hours blank rejected');
  eq(E.pgDhcpDuration(0), '0 min', 'duration zero');
  eq(E.pgDhcpDuration(3600), '1 h', 'duration hour');
  eq(E.pgDhcpDuration(5400), '1 h 30 min', 'duration 90 minutes');
  eq(E.pgDhcpDuration(86400), '1 day', 'duration day');
  eq(E.pgDhcpDuration(2 * 86400 + 3600), '2 days 1 h', 'duration days and hours');
  eq(E.pgDhcpDuration(45), '45 s', 'duration seconds');
  const ex = E.pgDhcpParseExcluded('192.168.10.1, 192.168.10.20 - 192.168.10.30');
  eq(ex.ranges.length, 2, 'excluded: two entries');
  eq(ex.ranges[1].hi - ex.ranges[1].lo, 10, 'excluded: range width');
  eq(E.pgDhcpParseExcluded('').ranges.length, 0, 'excluded: blank is fine');
  eq(E.pgDhcpParseExcluded('abc').errors, ['abc'], 'excluded: junk reported');
  eq(E.pgDhcpParseExcluded('192.168.10.30-192.168.10.20').errors.length, 1, 'excluded: backwards range rejected');
  eq(E.pgDhcpParseExcluded('192.168.10.1-192.168.10.5-192.168.10.9').errors.length, 1, 'excluded: three-part range rejected');

  /* ---- the pool ---- */
  const poolOf = (extra) => E.pgDhcpPoolSize(E.pgDhcpScope(scope(extra)));
  eq(poolOf({}), 11, 'pool size .100-.110');
  eq(poolOf({ excluded: '192.168.10.104' }), 10, 'pool size one exclusion');
  eq(poolOf({ excluded: '192.168.10.102-192.168.10.105, 192.168.10.104-192.168.10.106' }), 6, 'pool size overlapping exclusions merge');
  eq(poolOf({ excluded: '192.168.10.1-192.168.10.50' }), 11, 'pool size exclusion outside the pool');
  eq(poolOf({ excluded: '192.168.10.90-192.168.10.200' }), 0, 'pool fully excluded');
  eq(poolOf({ start: '192.168.10.250', end: '192.168.11.20' }), 5, 'pool clipped to the network (.250-.254)');
  eq(poolOf({ start: '192.168.11.5', end: '192.168.11.20' }), 0, 'pool outside the network is empty');
  eq(poolOf({ start: '192.168.10.110', end: '192.168.10.100' }), 0, 'backwards pool is empty');
  eq(E.pgDhcpScope(scope({ leaseHours: 'x' })).errors, ['lease'], 'scope error: lease');
  eq(E.pgDhcpScope(scope({ start: 'nope' })).errors, ['start'], 'scope error: start');
  eq(E.pgDhcpScope(scope({ mask: '255.0.255.0' })).errors, ['mask'], 'scope error: mask');
  eq(E.pgDhcpScope(scope({ excluded: 'zzz' })).errors, ['excluded'], 'scope error: excluded');

  /* ---- DORA on the same segment ---- */
  let r = E.pgDhcpDora(flat(), null, 'c1');
  eq(r.verdict, 'success', 'dora: first client succeeds');
  eq(r.lease.ip, '192.168.10.100', 'dora: first address of the pool');
  eq(r.lease.mask, '255.255.255.0', 'dora: mask in the lease');
  eq([r.lease.start, r.lease.t1, r.lease.t2, r.lease.end], [0, 14400, 25200, 28800], 'dora: T1 50%, T2 87.5%, end at 8 h');
  eq(has(text(r), /DHCPDISCOVER/) && has(text(r), /DHCPOFFER/) && has(text(r), /DHCPREQUEST/) && has(text(r), /DHCPACK/), true, 'dora: all four messages in the trace');
  eq(has(text(r), /same segment/), true, 'dora: same-segment explanation');
  eq(has(text(r), /ARP probe/), true, 'dora: ARP probe step');
  eq(r.state.leases['192.168.10.100'].mac, 'aa:00:00:00:00:01', 'dora: server records the MAC');
  let all = E.pgDhcpRunAll(flat());
  eq(all.verdict, 'success', 'run all: success');
  eq(all.parts.map((p) => p.lease.ip), ['192.168.10.100', '192.168.10.101'], 'run all: consecutive addresses');
  eq(all.summary, 'All 2 clients are configured and working.', 'run all: summary');
  eq(E.pgDhcpRunAll({ ...flat(), hosts: [stat('x', '192.168.10.50')] }).summary, 'There are no DHCP clients.', 'run all: no clients');
  r = E.pgDhcpDora(flat(), all.state, 'c1');
  eq(r.lease.ip, '192.168.10.100', 'dora again: the same client gets the same address');
  eq(r.state.clients.c2.lease.ip, '192.168.10.101', 'dora again: other clients untouched');
  eq(E.pgDhcpDora(flat([stat('s', '192.168.10.9')]), null, 's').diagnosis.code, 'not-dhcp', 'dora: static host is not a DHCP client');
  eq(E.pgDhcpDora(flat(), null, 'ghost').diagnosis.code, 'not-dhcp', 'dora: unknown client');
  eq(JSON.stringify(E.pgDhcpNewState()), JSON.stringify({ now: 0, leases: {}, bad: {}, clients: {}, log: [] }), 'new state shape');
  const st0 = E.pgDhcpNewState();
  E.pgDhcpDora(flat(), st0, 'c1');
  eq(Object.keys(st0.leases).length, 0, 'dora does not mutate the state it was given');

  /* ---- exclusions, exhaustion, bad configuration ---- */
  r = E.pgDhcpDora(flat(null, { excluded: '192.168.10.100-192.168.10.104' }), null, 'c1');
  eq(r.lease.ip, '192.168.10.105', 'excluded addresses are skipped');
  const tiny = flat([client('c1', 1), client('c2', 2), client('c3', 3)], { end: '192.168.10.101' });
  all = E.pgDhcpRunAll(tiny);
  eq(all.parts.map((p) => p.verdict), ['success', 'success', 'failed'], 'pool of two: third client fails');
  eq(all.diagnosis.code, 'pool-exhausted', 'pool of two: exhausted code');
  eq(all.diagnosis.field, 'scope-pool', 'pool of two: field to highlight');
  eq(has(all.parts[2].diagnosis.text, /2 usable addresses/), true, 'pool of two: counts the addresses');
  eq(has(all.parts[2].steps.map((s) => s.text).join(' '), /C1/), true, 'pool of two: names who holds the leases');
  eq(all.summary, '1 of 3 clients have a problem.', 'pool of two: summary');
  r = E.pgDhcpDora(flat(null, { start: '192.168.11.5', end: '192.168.11.9' }), null, 'c1');
  eq(code(r), 'pool-exhausted', 'pool outside the network');
  eq(has(r.diagnosis.title, /no usable/), true, 'pool outside the network: title says no usable address');
  r = E.pgDhcpDora(flat(null, { start: 'bad' }), null, 'c1');
  eq(code(r), 'bad-config', 'invalid pool start is a config error');
  eq(r.diagnosis.field, 'scope-start', 'invalid pool start: field');
  r = E.pgDhcpDora(flat(null, { leaseHours: '' }), null, 'c1');
  eq(r.diagnosis.field, 'scope-lease', 'blank lease: field');
  eq(code(E.pgDhcpDora(flat(null, { end: '192.168.10.200' }), null, 'c1')), null, 'a good pool has no diagnosis');
  // leases that ran out are free again; a live lease of another client is not
  let st = E.pgDhcpNewState();
  st.now = 200;
  st.leases['192.168.10.100'] = { mac: 'other', client: 'x', start: 0, end: 100 };
  eq(E.pgDhcpDora(flat(), st, 'c1').lease.ip, '192.168.10.100', 'an expired lease of someone else is reusable');
  st.leases['192.168.10.100'].end = 300;
  eq(E.pgDhcpDora(flat(), st, 'c1').lease.ip, '192.168.10.101', 'a live lease of someone else is skipped');
  st = E.pgDhcpNewState();
  st.now = 500;
  st.leases['192.168.10.103'] = { mac: 'aa:00:00:00:00:01', client: 'c1', start: 0, end: 100 };
  eq(E.pgDhcpDora(flat(), st, 'c1').lease.ip, '192.168.10.103', 'a returning client gets its remembered address back (RFC 2131 4.3.1)');
  st.leases['192.168.10.103'].mac = 'someone-else'; st.leases['192.168.10.103'].end = 9999;
  eq(E.pgDhcpDora(flat(), st, 'c1').lease.ip, '192.168.10.100', 'the remembered address is dropped when someone else holds it');

  /* ---- relay, giaddr, scope selection ---- */
  r = E.pgDhcpDora(relay(), null, 'c1');
  eq(r.verdict, 'success', 'relay: works with a helper');
  eq(has(text(r), /giaddr/) && has(text(r), /192\.168\.10\.1/), true, 'relay: giaddr named in the trace');
  eq(has(text(r), /different segment/), true, 'relay: explains the different segment');
  r = E.pgDhcpDora(relay(''), null, 'c1');
  eq([code(r), r.diagnosis.deviceId, r.diagnosis.field], ['no-relay', 'router', 'helper'], 'no helper: no-relay on the router');
  eq(has(text(r), /does not forward/), true, 'no helper: says the router does not forward');
  r = E.pgDhcpDora(set(set(relay(''), 'router.ifaces.1.helper', '10.0.0.5'), 'router.ifaces.0.helper', ''), null, 'c1');
  eq(code(r), 'no-relay', 'helper on the wrong interface: still no-relay');
  eq(has(text(r), /wrong interface|client-facing interface/), true, 'helper on the wrong interface: trace points at the interface');
  r = E.pgDhcpDora(relay('10.0.0.20'), null, 'c1');
  eq(code(r), 'relay-wrong-server', 'helper at the file server');
  eq(has(text(r), /FILES/), true, 'helper at the file server: names the machine');
  r = E.pgDhcpDora(relay('10.0.0.99'), null, 'c1');
  eq([code(r), has(text(r), /Nothing owns 10\.0\.0\.99/)], ['relay-wrong-server', true], 'helper at an unused address on a connected network');
  r = E.pgDhcpDora(relay('172.16.9.9'), null, 'c1');
  eq([code(r), has(text(r), /no route|not on any network/)], ['relay-wrong-server', true], 'helper on an unreachable network');
  r = E.pgDhcpDora(relay('10.0.0.1'), null, 'c1');
  eq([code(r), has(text(r), /router/i)], ['relay-wrong-server', true], 'helper pointing at the router itself');
  eq(code(E.pgDhcpDora(relay('ten'), null, 'c1')), 'relay-wrong-server', 'helper that is not an address');
  const noIface = relay();
  noIface.router.ifaces.splice(0, 1);
  eq(code(E.pgDhcpDora(noIface, null, 'c1')), 'no-relay', 'segment with no router interface');
  const down = relay();
  down.server.online = false;
  r = E.pgDhcpDora(down, null, 'c1');
  eq([code(r), r.diagnosis.field], ['server-down', 'server-online'], 'server offline behind a relay');
  const downFlat = flat();
  downFlat.server.online = false;
  eq(code(E.pgDhcpDora(downFlat, null, 'c1')), 'server-down', 'server offline on the same segment');
  const badSrv = relay();
  badSrv.server.ip = 'x';
  eq(code(E.pgDhcpDora(badSrv, null, 'c1')), 'bad-config', 'invalid server address');
  const wrongScope = set(relay(), 'server.scopes.0.network', '192.168.1.0');
  r = E.pgDhcpDora(wrongScope, null, 'c1');
  eq([code(r), r.diagnosis.field], ['no-scope', 'scope-network'], 'relayed request with no matching scope');
  eq(has(text(r), /giaddr field \(192\.168\.10\.1\)/), true, 'no scope: the trace shows the giaddr');
  const noScopes = relay();
  noScopes.server.scopes = [];
  eq(has(text(E.pgDhcpDora(noScopes, null, 'c1')), /no scopes at all/), true, 'no scopes at all');
  // the local server picks its scope from its own interface address
  const localMismatch = flat(null, { network: '192.168.50.0', start: '192.168.50.10', end: '192.168.50.20' });
  r = E.pgDhcpDora(localMismatch, null, 'c1');
  eq([code(r), has(text(r), /interface the request came in on/)], ['no-scope', true], 'same-segment request picks the scope by receiving interface');
  // two overlapping scopes: the more specific one answers
  const overlap = relay();
  overlap.server.scopes = [scope({ id: 'wide', name: 'Wide', mask: '255.255.0.0', start: '192.168.10.50', end: '192.168.10.60', dns: '10.0.0.53' }), scope({ id: 'narrow', name: 'Narrow', start: '192.168.10.100', end: '192.168.10.110', dns: '10.0.0.53' })];
  eq(E.pgDhcpDora(overlap, null, 'c1').lease.scopeName, 'Narrow', 'overlapping scopes: the most specific wins');

  /* ---- conflicts ---- */
  const withStatic = (probe, detect, ip) => {
    const t = flat([client('c1', 1, { probe })].concat([client('c2', 2, { probe })]), { start: '192.168.10.100', end: '192.168.10.120' });
    t.hosts.push(stat('printer', ip || '192.168.10.100'));
    t.server.conflictDetection = detect;
    return t;
  };
  r = E.pgDhcpDora(withStatic(true, false), null, 'c1');
  eq(r.verdict, 'success', 'ARP probe: the client declines and still succeeds');
  eq(r.lease.ip, '192.168.10.101', 'ARP probe: next address after the decline');
  eq(r.warning.code, 'address-conflict', 'ARP probe: raises a warning');
  eq(has(text(r), /DHCPDECLINE/), true, 'ARP probe: DHCPDECLINE in the trace');
  eq(r.state.bad['192.168.10.100'], true, 'ARP probe: the server marks the address bad');
  eq(r.conflicts, [{ ip: '192.168.10.100', by: 'PRINTER', found: 'client' }], 'ARP probe: conflict recorded');
  eq(r.attempts, 2, 'ARP probe: two attempts');
  r = E.pgDhcpDora(withStatic(true, true), null, 'c1');
  eq([r.lease.ip, r.attempts, has(text(r), /DHCPDECLINE/), r.conflicts[0].found], ['192.168.10.101', 1, false, 'server'], 'server conflict detection avoids the address before offering');
  eq(r.warning.code, 'address-conflict', 'server conflict detection still warns');
  r = E.pgDhcpDora(withStatic(false, false), null, 'c1');
  eq([r.verdict, code(r), r.diagnosis.field], ['failed', 'address-conflict', 'excluded'], 'no probe, no detection: duplicate address');
  eq(r.lease.ip, '192.168.10.100', 'duplicate: the lease exists, it is just shared');
  eq(has(r.diagnosis.fix, /excluded/), true, 'duplicate: the fix mentions exclusions');
  r = E.pgDhcpDora(withStatic(false, true), null, 'c1');
  eq(r.verdict, 'success', 'no probe but detection on: the server saved the day');
  const noPool = withStatic(true, false);
  noPool.server.scopes[0].end = '192.168.10.102';
  ['192.168.10.101', '192.168.10.102'].forEach((ip, i) => noPool.hosts.push(stat(`s${i}`, ip)));
  r = E.pgDhcpDora(noPool, null, 'c1');
  eq([r.verdict, code(r)], ['failed', 'pool-exhausted'], 'every pool address is in use by a static device');
  const clash = flat([client('c1', 1)], { start: '192.168.10.100', end: '192.168.10.150' });
  for (let i = 0; i < 10; i += 1) clash.hosts.push(stat(`s${i}`, `192.168.10.${100 + i}`));
  r = E.pgDhcpDora(clash, null, 'c1');
  eq([r.verdict, code(r), r.attempts], ['failed', 'address-conflict', 6], 'six declines in a row: the client gives up');
  const routerClash = flat(null, { start: '192.168.10.1', end: '192.168.10.10' });
  r = E.pgDhcpDora(routerClash, null, 'c1');
  eq([r.verdict, r.conflicts.length && r.conflicts[0].by], ['success', 'Router'], 'a pool covering the router address: the probe finds the router');

  /* ---- do the settings work? ---- */
  r = E.pgDhcpDora(flat(null, { gateway: '' }), null, 'c1');
  eq([code(r), r.diagnosis.field], ['bad-gateway-option', 'scope-gateway'], 'no gateway option');
  eq(code(E.pgDhcpDora(flat(null, { gateway: 'router' }), null, 'c1')), 'bad-gateway-option', 'gateway that is not an address');
  r = E.pgDhcpDora(flat(null, { gateway: '192.168.20.1' }), null, 'c1');
  eq([code(r), r.diagnosis.title], ['bad-gateway-option', 'The gateway handed out is on another network'], 'gateway on another network');
  r = E.pgDhcpDora(flat(null, { gateway: '192.168.10.99' }), null, 'c1');
  eq([code(r), has(text(r), /nothing answer/)], ['bad-gateway-option', true], 'gateway where nothing answers');
  const gwIsServer = flat(null, { gateway: '192.168.10.5' });
  r = E.pgDhcpDora(gwIsServer, null, 'c1');
  eq([code(r), has(r.diagnosis.text, /DHCP server/)], ['bad-gateway-option', true], 'gateway that is another device');
  r = E.pgDhcpDora(flat(null, { dns: '' }), null, 'c1');
  eq([code(r), r.diagnosis.field], ['bad-dns-option', 'scope-dns'], 'no DNS option');
  r = E.pgDhcpDora(flat(null, { dns: '8.8.8.8' }), null, 'c1');
  eq([code(r), has(r.diagnosis.fix, /192\.168\.10\.5/)], ['bad-dns-option', true], 'DNS server that does not answer');
  const noDnsList = flat(null, { dns: '8.8.8.8' });
  delete noDnsList.dns;
  eq(E.pgDhcpDora(noDnsList, null, 'c1').verdict, 'success', 'without a DNS list any DNS address is accepted');
  r = E.pgDhcpDora(flat(null, { mask: '255.255.0.0' }), null, 'c1');
  eq([code(r), r.diagnosis.field, r.lease.prefix], ['wrong-mask', 'scope-mask', 16], 'mask too short');
  r = E.pgDhcpDora(flat(null, { mask: '255.255.255.128' }), null, 'c1');
  eq(code(r), 'wrong-mask', 'mask too long');
  eq(has(r.diagnosis.fix, /255\.255\.255\.0/), true, 'mask too long: the fix names the right mask');
  const twoNets = relay();
  twoNets.segments.push({ id: 'sales', label: 'Sales' });
  twoNets.router.ifaces.push({ segment: 'sales', ip: '192.168.20.1', mask: '255.255.255.0', helper: '10.0.0.5' });
  twoNets.server.scopes[0].mask = '255.255.0.0';
  r = E.pgDhcpDora(twoNets, null, 'c1');
  eq([code(r), has(r.diagnosis.text, /Sales/)], ['wrong-mask', true], 'mask too short swallows the neighbouring network');
  // a scope for the whole /16 does not hijack requests from a smaller, more specific scope
  twoNets.server.scopes.push(scope({ id: 's2', name: 'Sales', network: '192.168.20.0', start: '192.168.20.100', end: '192.168.20.110', gateway: '192.168.20.1', dns: '10.0.0.53' }));
  twoNets.hosts.push(client('c9', 9, { segment: 'sales' }));
  eq(E.pgDhcpDora(twoNets, null, 'c9').lease.ip, '192.168.20.100', 'sales client is served by the sales scope');
  eq(E.pgDhcpDora(relay(), null, 'c1').diagnosis, null, 'the healthy relay topology has no diagnosis');

  /* ---- the clock: T1, T2, expiry ---- */
  const booted = E.pgDhcpRunAll(flat()).state;
  let adv = E.pgDhcpAdvance(flat(), booted, 600);
  eq([adv.state.now, adv.events.length], [600, 0], 'ten minutes: nothing happens');
  eq(adv.state.clients.c1.lease.end, 28800, 'ten minutes: lease unchanged');
  adv = E.pgDhcpAdvance(flat(), booted, 14400);
  eq(adv.events.length, 2, 'T1: both clients renew');
  eq(adv.events[0].ok && has(adv.events[0].text, /T1 \(50% of the lease\)/) && has(adv.events[0].text, /DHCPACK/) && has(adv.events[0].text, /unicasts/), true, 'T1: renewed by unicast');
  eq([adv.state.clients.c1.lease.start, adv.state.clients.c1.lease.end, adv.state.clients.c1.phase], [14400, 43200, 'bound'], 'T1: lease restarted from now');
  eq(adv.state.leases['192.168.10.100'].end, 43200, 'T1: the server extended its record');
  eq(adv.state.log.length, 2, 'T1: events also go to the log');
  adv = E.pgDhcpAdvance(flat(), booted, 14399);
  eq(adv.events.length, 0, 'one second before T1: no renewal yet');
  const offline = set(flat(), 'server.online', false);
  adv = E.pgDhcpAdvance(offline, booted, 14400);
  eq([adv.state.clients.c1.phase, adv.events[0].ok, has(adv.events[0].text, /offline/)], ['renewing', false, true], 'T1 with the server offline: renewing');
  let adv2 = E.pgDhcpAdvance(offline, adv.state, 25200 - 14400);
  eq([adv2.state.clients.c1.phase, has(adv2.events[0].text, /T2 \(87\.5% of the lease\)/), has(adv2.events[0].text, /offline/)], ['rebinding', true, true], 'T2 with the server offline: rebinding');
  let adv3 = E.pgDhcpAdvance(offline, adv2.state, 28800 - 25200 - 1);
  eq(adv3.state.clients.c1.phase, 'rebinding', 'one second before expiry: still holds the address');
  eq(E.pgDhcpStatus(offline, adv3.state, 'c1').verdict, 'success', 'one second before expiry: the client still works');
  adv3 = E.pgDhcpAdvance(offline, adv2.state, 28800 - 25200);
  eq([adv3.state.clients.c1.phase, adv3.state.clients.c1.lease, code({ diagnosis: adv3.state.clients.c1.lastFailure })], ['expired', null, 'lease-expired'], 'expiry with the server offline: no address, lease-expired');
  eq(adv3.state.clients.c1.lastFailure.field, 'scope-lease', 'expiry: lease field highlighted');
  eq(E.pgDhcpStatus(offline, adv3.state, 'c1').phase, 'expired', 'expiry: status says expired');
  eq(has(adv3.events.map((e) => e.text).join(' '), /169\.254/), true, 'expiry: mentions the 169.254 fallback');
  // the server returns at T2: the broadcast request is acknowledged
  const back = E.pgDhcpAdvance(flat(), adv.state, 25200 - 14400);
  eq([back.state.clients.c1.phase, back.state.clients.c1.lease.start, has(back.events[0].text, /broadcasts a DHCPREQUEST to any server/)], ['bound', 25200, true], 'T2 rebind succeeds when the server is back');
  // a long jump runs every timer in order
  adv = E.pgDhcpAdvance(offline, booted, 3600 * 12);
  eq(adv.events.filter((e) => e.client === 'c1').length >= 3, true, 'a long jump runs T1, T2 and expiry in order');
  eq(adv.events.map((e) => e.t).every((t, i, a) => i === 0 || t >= a[i - 1]), true, 'events come in time order');
  eq(adv.state.now, 43200, 'a long jump lands on the target time');
  eq(E.pgDhcpAdvance(flat(), booted, -50).state.now, 0, 'negative time is ignored');
  // renewal picks up new options
  const regate = set(flat(), 'server.scopes.0.gateway', '192.168.10.1');
  const newDns = set(regate, 'server.scopes.0.dns', '192.168.10.5');
  const changedGw = set(newDns, 'server.scopes.0.leaseHours', 4);
  adv = E.pgDhcpAdvance(changedGw, booted, 14400);
  eq([adv.state.clients.c1.lease.hours, has(adv.events[0].text, /renewed for another 4 h/)], [4, true], 'renewal uses the current scope (new lease length)');
  const newGw = set(flat(), 'server.scopes.0.gateway', '192.168.10.99');
  adv = E.pgDhcpAdvance(newGw, booted, 14400);
  eq([adv.state.clients.c1.lease.gateway, has(adv.events[0].text, /new options \(gateway 192\.168\.10\.1 to 192\.168\.10\.99\)/)], ['192.168.10.99', true], 'renewal carries a changed gateway');
  eq(E.pgDhcpStatus(newGw, adv.state, 'c1').diagnosis.code, 'bad-gateway-option', 'status after the new gateway shows the problem');
  // NAK
  const shrunk = set(flat(), 'server.scopes.0.start', '192.168.10.105');
  adv = E.pgDhcpAdvance(shrunk, booted, 14400);
  eq(has(adv.events[0].text, /DHCPNAK/), true, 'address outside the pool: DHCPNAK');
  eq(adv.state.clients.c1.lease.ip, '192.168.10.105', 'DHCPNAK: the client starts over and gets an address from the new pool');
  eq(adv.events.some((e) => /Fresh DORA/.test(e.text)), true, 'DHCPNAK: fresh DORA is logged');
  const excl = set(flat(), 'server.scopes.0.excluded', '192.168.10.100');
  adv = E.pgDhcpAdvance(excl, booted, 14400);
  eq(has(adv.events[0].text, /excluded address/), true, 'excluded address: DHCPNAK');
  // silence
  const gone = flat();
  gone.server.scopes = [];
  adv = E.pgDhcpAdvance(gone, booted, 14400);
  eq([adv.state.clients.c1.phase, has(adv.events[0].text, /stays silent/)], ['renewing', true], 'no scope any more: the server is silent');
  // relayed clients renew by unicast through their gateway
  const relayed = relay();
  relayed.hosts.push(client('c2', 2));
  const rbooted = E.pgDhcpRunAll(relayed).state;
  adv = E.pgDhcpAdvance(relayed, rbooted, 14400);
  eq(adv.state.clients.c1.phase, 'bound', 'relay: unicast renewal crosses the router');
  const nohelper = set(relayed, 'router.ifaces.0.helper', '');
  adv = E.pgDhcpAdvance(nohelper, rbooted, 14400);
  eq(adv.state.clients.c1.phase, 'bound', 'relay: renewal is unicast, so a missing helper does not matter at T1');
  adv = E.pgDhcpAdvance(nohelper, E.pgDhcpAdvance(nohelper, rbooted, 14400).state, 0);
  const t1Lost = set(set(relayed, 'router.ifaces.0.helper', ''), 'server.online', false);
  adv = E.pgDhcpAdvance(t1Lost, rbooted, 25200);
  eq(adv.state.clients.c1.phase, 'rebinding', 'relay: a failed T1 leads to T2');
  const noHelperT2 = set(relayed, 'router.ifaces.0.helper', '');
  // T1 succeeds on its own, so push the client to the rebinding phase by hand
  const hand = JSON.parse(JSON.stringify(rbooted));
  hand.clients.c1.phase = 'renewing';
  adv = E.pgDhcpAdvance(noHelperT2, hand, 25200);
  eq([adv.state.clients.c1.phase, has(adv.events.find((e) => e.client === 'c1').text, /does not reach the server/)], ['rebinding', true], 'relay: the T2 broadcast needs the relay');
  const badGwRenew = set(relayed, 'server.scopes.0.gateway', '192.168.10.77');
  const hand2 = JSON.parse(JSON.stringify(rbooted));
  hand2.clients.c1.lease.gateway = '192.168.10.77';
  adv = E.pgDhcpAdvance(badGwRenew, hand2, 14400);
  eq([adv.state.clients.c1.phase, has(adv.events[0].text, /gateway/)], ['renewing', true], 'relay: a bad gateway stops the unicast renewal');
  // removing a client from the topology forgets it
  const fewer = flat([client('c1', 1)]);
  adv = E.pgDhcpAdvance(fewer, booted, 14400);
  eq(Object.keys(adv.state.clients), ['c1'], 'a client that left the topology is forgotten when its timer fires');

  /* ---- status ---- */
  eq(E.pgDhcpStatus(flat(), null, 'c1').phase, 'idle', 'status: not asked yet');
  eq(E.pgDhcpStatus(flat([stat('p', '192.168.10.9')]), null, 'p').phase, 'static', 'status: static host');
  eq(E.pgDhcpStatus(flat(), null, 'ghost').verdict, 'failed', 'status: unknown host');
  let s = E.pgDhcpStatus(flat(), booted, 'c1');
  eq([s.phase, s.verdict, s.text, s.nextKind, s.nextIn, s.expiresIn], ['bound', 'success', '192.168.10.100/24', 'T1 renew', 14400, 28800], 'status: bound client');
  s = E.pgDhcpStatus(flat(), E.pgDhcpAdvance(flat(), booted, 20000).state, 'c1');
  eq([s.phase, s.nextKind], ['bound', 'T1 renew'], 'status after a renewal is bound again');
  s = E.pgDhcpStatus(offline, E.pgDhcpAdvance(offline, booted, 15000).state, 'c1');
  eq([s.phase, s.nextKind, s.nextIn], ['renewing', 'T2 rebind', 25200 - 15000], 'status: renewing counts down to T2');
  s = E.pgDhcpStatus(offline, E.pgDhcpAdvance(offline, booted, 26000).state, 'c1');
  eq([s.phase, s.nextKind], ['rebinding', 'expiry'], 'status: rebinding counts down to expiry');
  s = E.pgDhcpStatus(flat(null, { gateway: '' }), E.pgDhcpRunAll(flat(null, { gateway: '' })).state, 'c1');
  eq([s.verdict, s.diagnosis.code], ['failed', 'bad-gateway-option'], 'status: a bound client with a bad gateway');
  const failedBoot = E.pgDhcpRunAll(tiny).state;
  s = E.pgDhcpStatus(tiny, failedBoot, 'c3');
  eq([s.phase, s.verdict, s.diagnosis.code], ['none', 'failed', 'pool-exhausted'], 'status: client that found no address');

  /* ---- goals and scripts ---- */
  eq(E.pgDhcpGoal(flat(), { client: 'c1', verdict: 'success' }).verdict, 'success', 'goal: plain');
  eq(code(E.pgDhcpGoal(tiny, { client: 'c3', verdict: 'failed' })), 'pool-exhausted', 'goal: failing client carries the code');
  eq(E.pgDhcpGoal(withStatic(true, false), { client: 'c1' }).verdict, 'success', 'goal: a conflict that was recovered is a success by default');
  eq(E.pgDhcpGoal(withStatic(true, false), { client: 'c1', clean: true }).verdict, 'failed', 'goal: clean also fails on the warning');
  eq(E.pgDhcpGoal(flat(), { client: 'c1', script: [{ do: 'advance', minutes: 240 }] }).state.clients.c1.lease.start, 14400, 'goal script: advance runs the clock');
  r = E.pgDhcpGoal(flat(), { client: 'c1', script: [{ do: 'edit', path: 'server.online', value: false }, { do: 'advance', minutes: 480 }] });
  eq([r.verdict, code(r)], ['failed', 'lease-expired'], 'goal script: an 8 h outage with an 8 h lease');
  r = E.pgDhcpGoal(flat(null, { leaseHours: 9 }), { client: 'c1', script: [{ do: 'edit', path: 'server.online', value: false }, { do: 'advance', minutes: 480 }] });
  eq(r.verdict, 'success', 'goal script: a 9 h lease rides out the 8 h outage');
  r = E.pgDhcpGoal(flat(null, { leaseHours: 2 }), { client: 'c1', script: [{ do: 'edit', path: 'server.online', value: false }, { do: 'advance', minutes: 480 }, { do: 'edit', path: 'server.online', value: true }, { do: 'dora', client: 'c1' }] });
  eq(r.verdict, 'success', 'goal script: asking again after the server returns recovers');
  eq(E.pgDhcpGoal(flat(), { client: 'ghost' }).verdict, 'failed', 'goal: unknown client fails');
  const outage9 = [{ do: 'edit', path: 'server.online', value: false }, { do: 'advance', minutes: 480 }];
  const wasOff = set(flat(null, { leaseHours: 9 }), 'server.online', false);
  eq(E.pgDhcpGoal(wasOff, { client: 'c1', script: outage9 }).verdict, 'failed', 'goal: a server left off by the learner cannot boot the clients');
  eq(E.pgDhcpGoal(wasOff, { client: 'c1', setup: [{ path: 'server.online', value: true }], script: outage9 }).verdict, 'success', 'goal setup: forces the server on before the boot');
  eq(wasOff.server.online, false, 'goal setup: never changes the learner\'s topology');

  /* ---- edits ---- */
  const base = flat();
  const copy = E.pgDhcpApplyFixes(base, [{ path: 'server.scopes.0.end', value: '192.168.10.50' }]);
  eq([base.server.scopes[0].end, copy.server.scopes[0].end], ['192.168.10.110', '192.168.10.50'], 'apply fixes: set a field on a copy');
  eq(E.pgDhcpApplyFixes(base, [{ push: 'hosts', value: stat('x', '192.168.10.8') }]).hosts.length, 3, 'apply fixes: push to a list');
  eq(E.pgDhcpApplyFixes(base, [{ remove: 'hosts.0' }]).hosts.map((h) => h.id), ['c2'], 'apply fixes: remove a list item');
  eq(E.pgDhcpApplyFixes(base, [{ path: 'nothing.here.at.all', value: 1 }]).hosts.length, 2, 'apply fixes: a bad path is ignored');
  eq(E.pgDhcpApplyFixes(base, null).hosts.length, 2, 'apply fixes: nothing to do');

  /* ---- DHCP snooping, a rogue server and a starvation flood ---- */
  const rogueDef = (extra) => Object.assign({ name: 'Home router', segment: 'lan', enabled: true, answersFirst: true, ip: '192.168.1.1', mask: '255.255.255.0', start: '192.168.1.100', end: '192.168.1.150', gateway: '192.168.1.1', dns: '192.168.1.1' }, extra || {});
  const snoopDef = (extra) => Object.assign({ enabled: true, vlans: ['lan'], trustServer: false, trustUplink: false, trustClients: false, rateLimit: 0 }, extra || {});
  const floodDef = (extra) => Object.assign({ enabled: true, segment: 'lan', perSecond: 100 }, extra || {});
  const secure = (t, sec) => Object.assign(JSON.parse(JSON.stringify(t)), JSON.parse(JSON.stringify(sec)));
  const lanHosts = () => [client('c1', 1), client('c2', 2), client('c3', 3)];

  // helpers
  eq([E.pgDhcpRate('15'), E.pgDhcpRate(15), E.pgDhcpRate(''), E.pgDhcpRate('0'), E.pgDhcpRate('2049'), E.pgDhcpRate('1.5'), E.pgDhcpRate('abc'), E.pgDhcpRate(2048), E.pgDhcpRate(1)], [15, 15, 0, 0, 0, 0, 0, 2048, 1], 'snooping rate limit parse');
  eq([E.pgDhcpSnoopOn(secure(flat(), { snooping: snoopDef() }), 'lan'), E.pgDhcpSnoopOn(secure(flat(), { snooping: snoopDef({ enabled: false }) }), 'lan'), E.pgDhcpSnoopOn(secure(flat(), { snooping: snoopDef({ vlans: [] }) }), 'lan'), E.pgDhcpSnoopOn(flat(), 'lan')], [true, false, false, false], 'snooping is on only when enabled globally and listed for the VLAN');
  eq([E.pgDhcpEntryPort(flat(), 'lan'), E.pgDhcpEntryPort(relay(), 'lan'), E.pgDhcpEntryPort(relay(), 'srv')], ['server', 'uplink', 'server'], 'replies enter on the server port or on the uplink');
  eq([E.pgDhcpPortTrusted(flat(), 'server'), E.pgDhcpPortTrusted(secure(flat(), { snooping: snoopDef({ trustServer: true }) }), 'server'), E.pgDhcpPortTrusted(secure(flat(), { snooping: snoopDef({ trustUplink: true }) }), 'uplink'), E.pgDhcpPortTrusted(secure(flat(), { snooping: snoopDef({ trustClients: true }) }), 'clients')], [false, true, true, true], 'every port is untrusted until it is trusted');
  eq([E.pgDhcpPortName(flat(lanHosts()), 'lan', 'host', 'c2'), E.pgDhcpPortName(flat(lanHosts()), 'lan', 'rogue'), E.pgDhcpPortName(flat(lanHosts()), 'lan', 'flood')], ['Fa0/2', 'Fa0/4', 'Fa0/5'], 'switch port labels');
  eq(E.pgDhcpRogueView(rogueDef()).errors, [], 'a valid rogue has no errors');
  eq(E.pgDhcpRogueView(rogueDef({ ip: 'x' })).errors, ['ip'], 'rogue: bad address');
  eq(E.pgDhcpRogueView(rogueDef({ mask: '255.0.255.0' })).errors, ['mask'], 'rogue: bad mask');
  eq(E.pgDhcpRogueView(rogueDef({ start: '192.168.2.5' })).errors, ['pool'], 'rogue: pool outside its own network');
  eq(E.pgDhcpRogueView(rogueDef({ start: '192.168.1.200', end: '192.168.1.100' })).errors, ['pool'], 'rogue: backwards pool');
  eq(E.pgDhcpRogueView(null), null, 'no rogue, no view');

  // a topology with the new fields switched off behaves exactly like one without them
  const dormant = secure(flat(lanHosts()), { rogue: rogueDef({ enabled: false }), snooping: snoopDef({ enabled: false }), flood: floodDef({ enabled: false }) });
  const plainRun = E.pgDhcpRunAll(flat(lanHosts()));
  const dormantRun = E.pgDhcpRunAll(dormant);
  eq(JSON.stringify(dormantRun.parts), JSON.stringify(plainRun.parts), 'dormant security fields: identical traces and leases');
  eq(JSON.stringify(dormantRun.state), JSON.stringify(plainRun.state), 'dormant security fields: identical state');
  eq(E.pgDhcpBindings(flat(lanHosts()), plainRun.state), [], 'no snooping: no binding table');
  eq(Object.keys(plainRun.state).sort(), ['bad', 'clients', 'leases', 'log', 'now'], 'old topologies never get the new state fields');
  const oldRelay = E.pgDhcpRunAll(relay(undefined, [client('c1', 1), client('c2', 2)]));
  const oldRelayDormant = E.pgDhcpRunAll(secure(relay(undefined, [client('c1', 1), client('c2', 2)]), { rogue: rogueDef({ enabled: false }), snooping: snoopDef({ enabled: false, vlans: ['lan'] }) }));
  eq(JSON.stringify(oldRelayDormant.parts), JSON.stringify(oldRelay.parts), 'dormant security fields behind a relay: identical');

  // a rogue with nothing in its way wins
  const rogueFlat = secure(flat(lanHosts()), { rogue: rogueDef() });
  r = E.pgDhcpDora(rogueFlat, null, 'c1');
  eq([r.verdict, code(r), r.diagnosis.deviceId, r.diagnosis.field, r.diagnosis.segment], ['failed', 'rogue-server', 'rogue', 'snoop-enabled', 'lan'], 'rogue, no snooping: the client takes its offer');
  eq([r.lease.ip, r.lease.gateway, r.lease.dns, r.lease.source, r.lease.hours], ['192.168.1.100', '192.168.1.1', '192.168.1.1', 'rogue', 24], 'rogue: the lease carries the rogue\'s settings');
  eq(has(text(r), /nobody authorised/) && has(text(r), /DHCPOFFER/) && has(text(r), /DHCPACK/) && has(text(r), /first OFFER/), true, 'rogue: the trace shows its offer, the race and the ACK');
  eq(has(r.diagnosis.text, /not an address of this network/) && has(r.diagnosis.text, /not the router/) && has(r.diagnosis.text, /DNS server 192\.168\.1\.1/), true, 'rogue: the diagnosis says what is wrong with the settings');
  eq(has(r.diagnosis.fix, /snooping/) && has(r.diagnosis.fix, /trusted/), true, 'rogue: the fix names snooping and the trusted port');
  eq(has(text(r), /Assumption in this lab: the rogue answers first/), true, 'rogue: the race assumption is labelled in the trace');
  eq(E.pgDhcpStatus(rogueFlat, r.state, 'c1').diagnosis.code, 'rogue-server', 'rogue: status keeps showing the problem');
  all = E.pgDhcpRunAll(rogueFlat);
  eq([all.verdict, all.parts.map((p) => p.lease.ip)], ['failed', ['192.168.1.100', '192.168.1.101', '192.168.1.102']], 'rogue: every client is served by it, in order');
  eq(E.pgDhcpDora(rogueFlat, all.state, 'c1').lease.ip, '192.168.1.100', 'rogue: a returning client keeps its rogue address');
  eq(Object.keys(all.state.rogueLeases).length, 3, 'rogue: it keeps its own lease table');
  eq(Object.keys(all.state.leases).length, 0, 'rogue: the real server hands out nothing');
  eq(E.pgDhcpGoal(rogueFlat, { client: 'c1', verdict: 'failed' }).diagnosis.code, 'rogue-server', 'rogue: goal sees the diagnosis');
  // it is not the winner when it is not first, not on the segment, not switched on or not valid
  r = E.pgDhcpDora(set(rogueFlat, 'rogue.answersFirst', false), null, 'c1');
  eq([r.verdict, r.lease.ip, has(text(r), /arrives second/), has(text(r), /Assumption in this lab: the real server answers first/)], ['success', '192.168.10.100', true, true], 'rogue second: the real server wins and the trace says why');
  eq(E.pgDhcpDora(set(rogueFlat, 'rogue.enabled', false), null, 'c1').verdict, 'success', 'rogue switched off: nothing happens');
  const rogueOther = relay(undefined, [client('c1', 1)]);
  rogueOther.rogue = rogueDef({ segment: 'srv' });
  eq(E.pgDhcpDora(rogueOther, null, 'c1').verdict, 'success', 'a rogue on another segment never hears the broadcast');
  r = E.pgDhcpDora(set(rogueFlat, 'rogue.ip', 'nope'), null, 'c1');
  eq([r.verdict, has(text(r), /its own settings are not valid/)], ['success', true], 'an invalid rogue stays quiet');
  const smallRogue = set(rogueFlat, 'rogue.end', '192.168.1.100');
  all = E.pgDhcpRunAll(smallRogue);
  eq(all.parts.map((p) => p.verdict), ['failed', 'success', 'success'], 'a rogue with one address serves one client; the real server answers the rest');
  eq(has(all.parts[1].steps.map((s) => s.text).join(' '), /no free address left in its own pool/), true, 'rogue pool used up: said in the trace');
  // the rogue is the only offer when the real server cannot answer
  const rogueNoRelay = relay('', [client('c1', 1)]);
  rogueNoRelay.rogue = rogueDef({ answersFirst: false });
  r = E.pgDhcpDora(rogueNoRelay, null, 'c1');
  eq([code(r), has(text(r), /only one it hears/), has(text(r), /does not forward/)], ['rogue-server', true, true], 'the real server cannot be reached: even a second rogue gets the client');
  const rogueFull = set(set(rogueFlat, 'rogue.answersFirst', false), 'server.scopes.0.end', '192.168.10.100');
  all = E.pgDhcpRunAll(rogueFull);
  eq(all.parts.map((p) => p.verdict), ['success', 'failed', 'failed'], 'the real pool runs dry: the second-place rogue serves the rest');
  eq(code({ diagnosis: all.parts[1].diagnosis }), 'rogue-server', 'pool exhausted plus a rogue: rogue-server');
  const rogueOwner = secure(flat(lanHosts()), { rogue: rogueDef({ answersFirst: false, ip: '192.168.10.100', start: '192.168.10.200', end: '192.168.10.210' }) });
  r = E.pgDhcpDora(rogueOwner, null, 'c1');
  eq([r.verdict, r.conflicts.length && r.conflicts[0].by, r.lease.ip], ['success', 'Home router', '192.168.10.101'], 'the rogue answers ARP for its own address, so a client declines it');

  // snooping drops the real server's replies when its port is not trusted
  const noTrust = secure(flat(lanHosts()), { rogue: rogueDef(), snooping: snoopDef() });
  r = E.pgDhcpDora(noTrust, null, 'c1');
  eq([r.verdict, code(r), r.diagnosis.deviceId, r.diagnosis.field, r.diagnosis.segment], ['failed', 'snoop-blocks-server', 'switch', 'snoop-trust-server', 'lan'], 'snooping with nothing trusted: the real server is silenced');
  eq(r.lease, null, 'snooping with nothing trusted: no lease at all');
  eq(has(r.diagnosis.title, /^C1 never hears the real server/), true, 'snooping with nothing trusted: the title names the client (the result list shows only titles)');
  eq(has(text(r), /untrusted/) && has(text(r), /drops it/) && has(text(r), /rogue/) && has(text(r), /never hears the rogue/), true, 'snooping with nothing trusted: the trace shows both offers dropped');
  eq(has(r.diagnosis.fix, /ip dhcp snooping trust/), true, 'snooping with nothing trusted: the fix names the trust command');
  eq(code(E.pgDhcpDora(secure(flat(lanHosts()), { snooping: snoopDef() }), null, 'c1')), 'snoop-blocks-server', 'snooping with nothing trusted and no rogue: the real server is silenced too');
  eq(code(E.pgDhcpDora(set(noTrust, 'snooping.trustUplink', true), null, 'c1')), 'snoop-blocks-server', 'the uplink is not the right port when the server is on the same segment');
  eq(code(E.pgDhcpDora(set(noTrust, 'snooping.trustClients', true), null, 'c1')), 'rogue-server', 'trusting the client ports lets the rogue through');
  // ... and when the right port is trusted, the real server works and the rogue is silenced
  const guarded = set(noTrust, 'snooping.trustServer', true);
  r = E.pgDhcpDora(guarded, null, 'c1');
  eq([r.verdict, r.lease.ip, r.diagnosis], ['success', '192.168.10.100', null], 'snooping with the server port trusted: the real server wins');
  eq(has(text(r), /never hears the rogue/) && has(text(r), /port facing the DHCP server, which is trusted/) && has(text(r), /binding table/), true, 'trusted server port: the trace silences the rogue and mentions the binding table');
  all = E.pgDhcpRunAll(guarded);
  eq([all.verdict, all.state.rogueLeases], ['success', undefined], 'guarded: all clients are served by the real server and the rogue gave out nothing');
  const bind = E.pgDhcpBindings(guarded, all.state);
  eq(bind.length, 3, 'binding table: one entry per ACK that was let through');
  eq([bind[0].mac, bind[0].ip, bind[0].vlan, bind[0].port, bind[0].left, bind[0].name], ['aa:00:00:00:00:01', '192.168.10.100', 'Office LAN', 'Fa0/1', 28800, 'C1'], 'binding table: MAC, IP, VLAN, port and lease time');
  eq(E.pgDhcpBindings(guarded, E.pgDhcpAdvance(guarded, all.state, 8 * 3600 + 1).state).length >= 0, true, 'binding table: readable after the clock moves');
  eq(E.pgDhcpBindings(guarded, null), [], 'binding table: no state, no entries');
  // snooping must be enabled globally and for the VLAN
  r = E.pgDhcpDora(set(noTrust, 'snooping.vlans', []), null, 'c1');
  eq([code(r), r.diagnosis.field, has(r.diagnosis.text, /not in the list of snooped VLANs/)], ['rogue-server', 'snoop-vlan', true], 'snooping on globally but the VLAN is not listed: the rogue still wins');
  r = E.pgDhcpDora(set(noTrust, 'snooping.enabled', false), null, 'c1');
  eq([code(r), r.diagnosis.field], ['rogue-server', 'snoop-enabled'], 'VLAN listed but snooping off globally: the rogue still wins');
  eq(E.pgDhcpBindings(set(noTrust, 'snooping.vlans', []), E.pgDhcpRunAll(set(noTrust, 'snooping.vlans', [])).state), [], 'an unprotected VLAN has no binding table');
  r = E.pgDhcpDora(set(set(noTrust, 'snooping.trustClients', true), 'snooping.trustServer', true), null, 'c1');
  eq([code(r), r.diagnosis.field, has(text(r), /binding table/) && has(text(r), /cannot tell a rogue/)], ['rogue-server', 'snoop-trust-clients', true], 'trusted client ports: the rogue wins and snooping records its binding');
  eq(E.pgDhcpBindings(set(set(noTrust, 'snooping.trustClients', true), 'snooping.trustServer', true), E.pgDhcpRunAll(set(set(noTrust, 'snooping.trustClients', true), 'snooping.trustServer', true)).state)[0].ip, '192.168.1.100', 'a rogue\'s ACK on a trusted port lands in the binding table');
  // the same behind a relay: the uplink is the port to trust
  const relayRogue = (sn, helper) => { const t = relay(helper, [client('c1', 1), client('c2', 2)]); t.rogue = rogueDef(); t.snooping = sn; return t; };
  r = E.pgDhcpDora(relayRogue(snoopDef({ trustServer: true })), null, 'c1');
  eq([code(r), r.diagnosis.field, has(r.diagnosis.text, /uplink/)], ['snoop-blocks-server', 'snoop-trust-uplink', true], 'behind a relay the replies come over the uplink: trusting the server port does nothing');
  eq(has(text(r), /relay/), true, 'behind a relay: the trace mentions the relay');
  r = E.pgDhcpDora(relayRogue(snoopDef({ trustUplink: true })), null, 'c1');
  eq([r.verdict, r.lease.ip, has(text(r), /uplink toward the router/)], ['success', '192.168.10.100', true], 'behind a relay with the uplink trusted: the real server wins, the rogue is silenced');
  r = E.pgDhcpDora(relayRogue(snoopDef({ trustClients: true })), null, 'c1');
  eq([code(r), r.diagnosis.field, has(text(r), /would not have got through either/)], ['rogue-server', 'snoop-trust-clients', true], 'wrong port trusted behind a relay: the rogue wins and the trace notes the uplink problem');
  eq(code(E.pgDhcpDora(relayRogue(snoopDef({ trustUplink: true }), ''), null, 'c1')), 'no-relay', 'snooping does not hide a missing relay');
  eq(code(E.pgDhcpDora(set(relayRogue(snoopDef({ trustUplink: true })), 'server.online', false), null, 'c1')), 'server-down', 'snooping does not hide a stopped server');
  eq(code(E.pgDhcpDora(set(relayRogue(snoopDef({ trustUplink: true })), 'server.scopes.0.network', '192.168.1.0'), null, 'c1')), 'no-scope', 'snooping does not hide a missing scope');
  // another segment without snooping next door is unaffected
  const threeSeg = relay(undefined, [client('c1', 1), client('c2', 2, { segment: 'sales' })]);
  threeSeg.segments.push({ id: 'sales', label: 'Sales' });
  threeSeg.router.ifaces.push({ segment: 'sales', ip: '192.168.20.1', mask: '255.255.255.0', helper: '10.0.0.5' });
  threeSeg.server.scopes.push(scope({ id: 's2', name: 'Sales', network: '192.168.20.0', start: '192.168.20.100', end: '192.168.20.110', gateway: '192.168.20.1', dns: '10.0.0.53' }));
  threeSeg.rogue = rogueDef({ segment: 'sales' });
  threeSeg.snooping = snoopDef({ trustUplink: true });
  all = E.pgDhcpRunAll(threeSeg);
  eq([all.parts[0].verdict, all.parts[1].verdict, code({ diagnosis: all.parts[1].diagnosis })], ['success', 'failed', 'rogue-server'], 'snooping on Office only: the Office is fine and the rogue in Sales wins');
  eq(has(all.parts[0].steps.map((s) => s.text).join(' '), /snooping/i), true, 'the snooped client segment mentions snooping in its trace');
  threeSeg.snooping.vlans = ['lan', 'sales'];
  eq(E.pgDhcpRunAll(threeSeg).verdict, 'success', 'snooping on both VLANs with the uplink trusted: everything works and the rogue is silenced');

  // the clock: renewals pass through the switch too
  const guardedRun = E.pgDhcpRunAll(guarded);
  adv = E.pgDhcpAdvance(guarded, guardedRun.state, 14400);
  eq([adv.state.clients.c1.phase, adv.events[0].ok, E.pgDhcpBindings(guarded, adv.state)[0].left], ['bound', true, 28800], 'T1 under snooping: renewed, and the binding is refreshed');
  adv = E.pgDhcpAdvance(set(guarded, 'snooping.trustServer', false), guardedRun.state, 14400);
  eq([adv.state.clients.c1.phase, adv.events[0].ok, has(adv.events[0].text, /DHCP snooping drops its reply/)], ['renewing', false, true], 'T1 after the server port lost its trust: the ACK is dropped and the client keeps its address');
  adv = E.pgDhcpAdvance(set(guarded, 'snooping.trustServer', false), guardedRun.state, 28800);
  eq([adv.state.clients.c1.phase, code({ diagnosis: adv.state.clients.c1.lastFailure })], ['expired', 'lease-expired'], 'a server port that stays untrusted ends in an expired lease');
  const rogueBooted = E.pgDhcpRunAll(rogueFlat).state;
  adv = E.pgDhcpAdvance(rogueFlat, rogueBooted, 12 * 3600);
  eq([adv.state.clients.c1.phase, adv.state.clients.c1.lease.source, adv.state.clients.c1.lease.start, has(adv.events[0].text, /rogue answers DHCPACK/)], ['bound', 'rogue', 43200, true], 'a rogue lease is renewed by the rogue (24 h lease, T1 at 12 h)');
  eq(E.pgDhcpStatus(rogueFlat, adv.state, 'c1').diagnosis.code, 'rogue-server', 'a renewed rogue lease is still a problem');
  const rogueGone = set(rogueFlat, 'rogue.enabled', false);
  adv = E.pgDhcpAdvance(rogueGone, rogueBooted, 12 * 3600);
  eq([adv.state.clients.c1.phase, has(adv.events[0].text, /rogue server is gone/)], ['renewing', true], 'the rogue unplugged: its clients cannot renew');
  adv = E.pgDhcpAdvance(rogueGone, rogueBooted, 24 * 3600);
  eq([adv.state.clients.c1.phase, adv.state.clients.c1.lease.ip, adv.state.clients.c1.lease.source], ['bound', '192.168.10.100', undefined], 'the rogue unplugged: after the lease ends the client gets a real address');
  eq(has(E.pgDhcpStatus(rogueGone, rogueBooted, 'c1').diagnosis.text, /no longer on the network/), true, 'a rogue lease outlives the rogue: the diagnosis says so');
  const lateSnoop = set(set(rogueFlat, 'snooping', snoopDef({ trustServer: true })), 'rogue.answersFirst', true);
  eq([E.pgDhcpStatus(lateSnoop, rogueBooted, 'c1').diagnosis.field, has(E.pgDhcpStatus(lateSnoop, rogueBooted, 'c1').diagnosis.text, /still holds the lease it received earlier/)], [null, true], 'snooping fixed after the client got a rogue lease: the diagnosis says the lease is old');
  adv = E.pgDhcpAdvance(lateSnoop, rogueBooted, 12 * 3600);
  eq([adv.state.clients.c1.phase, has(adv.events[0].text, /snooping now drops its DHCPACK/)], ['renewing', true], 'snooping switched on later: the rogue\'s renewal ACK is dropped');
  adv = E.pgDhcpAdvance(lateSnoop, rogueBooted, 24 * 3600);
  eq([adv.state.clients.c1.lease.ip, adv.state.clients.c1.lease.source, E.pgDhcpStatus(lateSnoop, adv.state, 'c1').verdict], ['192.168.10.100', undefined, 'success'], 'snooping switched on later: the next fresh DORA heals the client');

  // a starvation flood
  const flooded = (sn, fl, end) => secure(flat(lanHosts(), { end: end || '192.168.10.129' }), { snooping: sn, flood: fl || floodDef() });
  const starved = flooded(snoopDef({ trustServer: true }));
  all = E.pgDhcpRunAll(starved);
  eq([all.verdict, all.parts.map((p) => code({ diagnosis: p.diagnosis }))], ['failed', ['starvation', 'starvation', 'starvation']], 'flood with snooping alone: the pool is gone');
  eq([all.state.flood.taken, all.state.flood.attempted, all.state.flood.limited], [30, 3000, false], 'flood: it takes the whole pool of 30');
  eq(Object.keys(all.state.leases).filter((k) => all.state.leases[k].client === 'attacker').length, 30, 'flood: thirty fake leases');
  eq([all.diagnosis.deviceId, all.diagnosis.field, has(all.diagnosis.fix, /limit rate/), has(all.diagnosis.fix, /Snooping alone does not stop the flood/)], ['flood', 'snoop-rate', true, true], 'flood: the diagnosis points at the rate limit and says snooping alone is not enough');
  eq(has(all.parts[0].steps.map((s) => s.text).join(' '), /100 DHCPDISCOVERs per second.*made-up MAC.*30 seconds/), true, 'flood: the assumption (30 seconds) is in the trace');
  eq(has(all.parts[0].steps.map((s) => s.text).join(' '), /held by the attacker/), true, 'flood: the pool step names the attacker');
  eq(has(all.parts[0].diagnosis.title, /^C1 finds no address/), true, 'flood: the title names the client');
  eq(E.pgDhcpBindings(starved, all.state).length, 30, 'flood with snooping: the binding table fills with made-up MACs');
  r = E.pgDhcpDora(starved, all.state, 'c1');
  eq(code(r), 'starvation', 'flood: asking again does not help');
  eq(E.pgDhcpDora(starved, all.state, 'c1').state.flood.taken, 30, 'flood: it runs once per state');
  const limited = secure(starved, { snooping: snoopDef({ trustServer: true, rateLimit: 15 }) });
  all = E.pgDhcpRunAll(limited);
  eq([all.verdict, all.state.flood.taken, all.state.flood.limited, all.state.flood.limit], ['success', 15, true, 15], 'rate limit 15: the flood is cut off after 15 addresses and the clients are served');
  eq(has(E.pgDhcpFloodText(limited, all.state), /error-disabled/), true, 'rate limit: the text names the err-disabled port');
  eq(has(all.parts[0].steps.map((s) => s.text).join(' '), /error-disabled/), true, 'rate limit: the trace names the err-disabled port');
  eq(all.parts.map((p) => p.lease.ip), ['192.168.10.115', '192.168.10.116', '192.168.10.117'], 'rate limit: real clients get the next addresses');
  eq(E.pgDhcpBindings(limited, all.state).length, 18, 'rate limit: 15 fake bindings plus 3 real ones');
  eq(E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ trustServer: true, rateLimit: '15' }) })).verdict, 'success', 'rate limit typed as text works');
  eq(code(E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ trustServer: true, rateLimit: '2049' }) }))), 'starvation', 'rate limit out of range is ignored (the flood runs)');
  r = E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ trustServer: true, rateLimit: 200 }) }));
  eq([r.verdict, r.state.flood.limited, has(r.diagnosis.fix, /higher than the attack rate/)], ['failed', false, true], 'a rate limit above the attack rate never trips');
  r = E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ enabled: false, trustServer: true, rateLimit: 15 }) }));
  eq([r.verdict, has(r.diagnosis.fix, /Turn DHCP snooping on/)], ['failed', true], 'a rate limit does nothing while snooping is off');
  eq(E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ vlans: [], trustServer: true, rateLimit: 15 }) })).verdict, 'failed', 'a rate limit does nothing on a VLAN that is not snooped');
  eq(E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ trustServer: true, trustClients: true, rateLimit: 15 }) })).verdict, 'failed', 'a rate limit is not applied to trusted ports');
  r = E.pgDhcpRunAll(secure(limited, { snooping: snoopDef({ rateLimit: 15 }) }));
  eq([r.state.flood.why, r.state.flood.taken, code(r)], ['dropped', 0, 'snoop-blocks-server'], 'flood and an untrusted server port: the attacker gets no offers and nobody else does either');
  eq(has(E.pgDhcpFloodText(secure(limited, { snooping: snoopDef({ rateLimit: 15 }) }), r.state), /never completes a lease/), true, 'flood text: dropped offers');
  r = E.pgDhcpRunAll(secure(starved, { flood: floodDef({ perSecond: 1 }) }));
  eq([r.state.flood.attempted, r.state.flood.taken, r.verdict], [30, 30, 'failed'], 'one request per second for 30 seconds is still enough for a pool of 30');
  r = E.pgDhcpRunAll(secure(starved, { flood: floodDef({ perSecond: 0 }) }));
  eq([r.verdict, r.state.flood.taken, E.pgDhcpFloodText(starved, r.state)], ['success', 0, null], 'a flood of nothing does nothing and is not mentioned');
  r = E.pgDhcpRunAll(secure(starved, { flood: floodDef({ enabled: false }) }));
  eq([r.verdict, r.state.flood], ['success', undefined], 'a switched-off flood leaves no trace');
  const noRelayFlood = relay('', [client('c1', 1)]);
  noRelayFlood.flood = floodDef();
  r = E.pgDhcpRunAll(noRelayFlood);
  eq([r.state.flood.why, r.state.flood.taken, code(r)], ['unreachable', 0, 'no-relay'], 'a flood that cannot reach the server does nothing');
  const exclFlood = flooded(snoopDef({ trustServer: true }), floodDef(), '192.168.10.129');
  exclFlood.server.scopes[0].excluded = '192.168.10.100-192.168.10.119';
  r = E.pgDhcpRunAll(exclFlood);
  eq([r.state.flood.taken, Object.keys(r.state.leases).every((k) => E.pgParseIPv4(k) >= E.pgParseIPv4('192.168.10.120'))], [10, true], 'a flood never takes excluded addresses');
  const before = JSON.stringify(starved);
  E.pgDhcpRunAll(starved);
  eq(JSON.stringify(starved), before, 'the flood never mutates the topology');
  const keeps = E.pgDhcpRunAll(flat(lanHosts()));
  const afterBoot = secure(flat(lanHosts()), { flood: floodDef() });
  r = E.pgDhcpDora(afterBoot, keeps.state, 'c2');
  eq(r.lease.ip, '192.168.10.101', 'a client that already holds a lease keeps it when a flood starts later');
  const flood2 = secure(flat(lanHosts()), { flood: floodDef() });
  flood2.server.scopes.push(scope({ id: 'other', name: 'Other', network: '192.168.50.0', start: '192.168.50.10', end: '192.168.50.20' }));
  eq(code(E.pgDhcpRunAll(flood2)), 'starvation', 'flood on a flat network: starvation without snooping at all');

  // the sandbox is a protected network the learner can attack
  if (data.dhcpSandbox) {
    const sbx = data.dhcpSandbox;
    eq([!!sbx.rogue, !!sbx.snooping, !!sbx.flood], [true, true, true], 'dhcp sandbox: has a rogue, a snooping switch and a flood to switch on');
    eq([sbx.rogue.enabled, sbx.flood.enabled, sbx.snooping.enabled, sbx.snooping.trustUplink, sbx.snooping.trustClients], [false, false, true, true, false], 'dhcp sandbox: protected, nothing attacking yet');
    eq(E.pgDhcpRunAll(set(sbx, 'rogue.enabled', true)).verdict, 'success', 'dhcp sandbox: a rogue plugged in is silenced');
    eq(E.pgDhcpRunAll(set(set(sbx, 'rogue.enabled', true), 'snooping.enabled', false)).parts.filter((p) => p.verdict === 'failed').map((p) => p.id), ['ana', 'ben'], 'dhcp sandbox: without snooping the rogue captures the Office clients only');
    eq(E.pgDhcpRunAll(set(sbx, 'flood.enabled', true)).verdict, 'success', 'dhcp sandbox: a flood against the rate limit is survived');
    r = E.pgDhcpRunAll(set(set(sbx, 'flood.enabled', true), 'snooping.rateLimit', 0));
    eq(r.parts.map((p) => p.verdict), ['failed', 'failed', 'success', 'success'], 'dhcp sandbox: without the rate limit the Office pool is gone and Sales is not affected');
  }

  /* ---- every scenario: the broken outcome and the fixed outcome ---- */
  const scenarios = data.dhcp || [];
  eq(scenarios.length >= 12 && scenarios.length <= 13, true, 'dhcp: twelve or thirteen scenarios');
  ['rogue-router', 'snooping-no-trust', 'snooping-vlan-missing', 'snooping-wrong-port-trusted', 'dhcp-starvation'].forEach((id) => eq(scenarios.some((sc) => sc.id === id), true, `dhcp: scenario ${id} exists`));
  eq(['starter', 'core', 'stretch'].every((lv) => scenarios.some((sc) => sc.level === lv)), true, 'dhcp: all three levels are used');
  const seenCodes = new Set();
  scenarios.forEach((sc) => {
    sc.expect.forEach((g) => {
      const res = E.pgDhcpGoal(sc.topology, g);
      eq(res.verdict, g.verdict, `dhcp ${sc.id}: broken ${g.client} verdict`);
      if (g.code) { eq(code(res), g.code, `dhcp ${sc.id}: broken ${g.client} code`); seenCodes.add(g.code); }
      eq(res.steps.length > 0 || g.script !== undefined, true, `dhcp ${sc.id}: broken ${g.client} has a trace`);
    });
    // the scenario really is broken: at least one goal of the fixed list fails before the fix
    eq(sc.expectFixed.some((g) => E.pgDhcpGoal(sc.topology, g).verdict !== g.verdict), true, `dhcp ${sc.id}: not solved before the fix`);
    const fixed = E.pgDhcpApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((g) => {
      const res = E.pgDhcpGoal(fixed, g);
      eq(res.verdict, g.verdict, `dhcp ${sc.id}: fixed ${g.client} verdict`);
      eq(typeof g.label === 'string' && g.label.length > 0, true, `dhcp ${sc.id}: ${g.client} goal has a label`);
    });
    // the first diagnosis names a field the editors expose
    const firstFail = sc.expect.find((g) => g.verdict === 'failed');
    const d = E.pgDhcpGoal(sc.topology, firstFail).diagnosis;
    eq(typeof d.title === 'string' && d.title.length > 0 && typeof d.fix === 'string' && d.fix.length > 0, true, `dhcp ${sc.id}: diagnosis has a title and a fix`);
    // an intruder cannot be "fixed" by unplugging it or by tuning its behaviour: the goals keep it in place
    if (sc.topology.rogue || sc.topology.flood) {
      let cheat = set(set(set(set(sc.topology, 'rogue.enabled', false), 'rogue.answersFirst', false), 'flood.enabled', false), 'flood.perSecond', 1);
      cheat = E.pgDhcpApplyFixes(cheat, []);
      eq(sc.expectFixed.some((g) => E.pgDhcpGoal(cheat, g).verdict !== g.verdict), true, `dhcp ${sc.id}: unplugging the intruder does not solve it`);
      eq(sc.expectFixed.every((g) => Array.isArray(g.setup) && g.setup.length > 0), true, `dhcp ${sc.id}: every goal keeps the intruder in place`);
    }
    // the fix is minimal: undoing the last fix entry breaks it again
    const lastUndone = E.pgDhcpApplyFixes(sc.topology, sc.fix.slice(0, -1));
    eq(sc.expectFixed.some((g) => E.pgDhcpGoal(lastUndone, g).verdict !== g.verdict), true, `dhcp ${sc.id}: the last fix entry is needed`);
  });
  ['pool-exhausted', 'no-relay', 'relay-wrong-server', 'bad-gateway-option', 'address-conflict', 'no-scope', 'wrong-mask', 'lease-expired', 'rogue-server', 'snoop-blocks-server', 'starvation'].forEach((c) => eq(seenCodes.has(c), true, `dhcp: some scenario shows ${c}`));

  /* ---- the sandbox ---- */
  const sb = data.dhcpSandbox;
  eq(!!sb, true, 'dhcp: sandbox exists');
  if (sb) {
    const run = E.pgDhcpRunAll(sb);
    eq(run.verdict, 'success', 'dhcp sandbox starts working');
    eq(run.warning, null, 'dhcp sandbox has no conflict warnings');
    eq(run.parts.every((p) => p.lease && p.lease.ip), true, 'dhcp sandbox: everyone has an address');
    const day = E.pgDhcpAdvance(sb, run.state, 24 * 3600);
    eq(Object.keys(day.state.clients).every((id) => E.pgDhcpStatus(sb, day.state, id).verdict === 'success'), true, 'dhcp sandbox: still working after a day of renewals');
    const cp = JSON.stringify(sb);
    E.pgDhcpRunAll(sb);
    eq(JSON.stringify(sb), cp, 'dhcp: the simulation never mutates its topology');
  }
};
