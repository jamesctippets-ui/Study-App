/* Checks for the DHCP lab: engine unit tests (src/js/03c_pg_dhcp.js), a replay of every scenario in
 * data/playground_dhcp.py (the broken outcome and the fixed outcome) and the sandbox. */
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

  /* ---- every scenario: the broken outcome and the fixed outcome ---- */
  const scenarios = data.dhcp || [];
  eq(scenarios.length >= 7 && scenarios.length <= 8, true, 'dhcp: seven or eight scenarios');
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
    // the fix is minimal: undoing the last fix entry breaks it again
    const lastUndone = E.pgDhcpApplyFixes(sc.topology, sc.fix.slice(0, -1));
    eq(sc.expectFixed.some((g) => E.pgDhcpGoal(lastUndone, g).verdict !== g.verdict), true, `dhcp ${sc.id}: the last fix entry is needed`);
  });
  ['pool-exhausted', 'no-relay', 'relay-wrong-server', 'bad-gateway-option', 'address-conflict', 'no-scope', 'wrong-mask', 'lease-expired'].forEach((c) => eq(seenCodes.has(c), true, `dhcp: some scenario shows ${c}`));

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
