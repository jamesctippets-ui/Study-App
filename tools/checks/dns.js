/* Checks for the DNS lab: engine unit tests (src/js/03c_pg_dns.js), a replay of every scenario in
 * data/playground_dns.py (the broken outcome and the fixed outcome) and the sandbox. */
module.exports = ({ E, eq, data }) => {
  const has = (text, re) => re.test(text || '');
  const code = (r) => (r.diagnosis ? r.diagnosis.code : null);
  const text = (r) => r.steps.map((s) => s.text).join(' | ');
  const set = (t, path, value) => E.pgDnsSetPath(t, path, value);

  const rec = (id, name, type, value, ttl, pref) => Object.assign({ id, name, type, value, ttl: ttl === undefined ? 3600 : ttl }, type === 'MX' ? { pref: pref === undefined ? 10 : pref } : {});
  const client = (id, extra) => Object.assign({ id, name: id.toUpperCase(), network: 'internal', dns: '10.0.0.53', hosts: [] }, extra || {});
  // One zone, one resolver (10.0.0.53) in front of the authoritative server (10.0.0.54), a web, a mail and a print machine.
  const lab = (records, extra) => Object.assign({
    zone: { name: 'example.com', negativeTtl: 300, records: records || [rec('www', 'www', 'A', '10.0.1.20'), rec('mail', 'mail', 'A', '10.0.1.25'), rec('mx', '@', 'MX', 'mail')], internal: [] },
    auth: { name: 'Zone server', ip: '10.0.0.54', online: true, splitHorizon: false },
    resolvers: [{ id: 'res', name: 'Resolver', ip: '10.0.0.53', online: true, upstream: 'auth', network: 'internal' }],
    clients: [client('c1'), client('c2')],
    machines: [
      { id: 'web', name: 'Web server', ips: ['10.0.1.20'], serves: ['www.example.com'] },
      { id: 'mail', name: 'Mail server', ips: ['10.0.1.25'], serves: ['mail.example.com'] },
      { id: 'print', name: 'Print server', ips: ['10.0.1.21'], serves: [] },
    ],
    hairpin: false,
  }, extra || {});
  const ask = (topo, st, who, name, type) => E.pgDnsResolve(topo, st || null, who || 'c1', name || 'www.example.com', type || 'A');

  /* ---- parsers and formatters ---- */
  eq(E.pgDnsParseTtl('300'), 300, 'ttl: plain seconds');
  eq(E.pgDnsParseTtl(300), 300, 'ttl: a number');
  eq(E.pgDnsParseTtl('5m'), 300, 'ttl: minutes');
  eq(E.pgDnsParseTtl('1h30m'), 5400, 'ttl: hours and minutes');
  eq(E.pgDnsParseTtl('1d'), 86400, 'ttl: a day');
  eq(E.pgDnsParseTtl('1w'), 604800, 'ttl: a week');
  eq(E.pgDnsParseTtl(' 30S '), 30, 'ttl: seconds unit, case and spaces');
  eq(E.pgDnsParseTtl('0'), 0, 'ttl: zero is allowed (do not cache)');
  eq(E.pgDnsParseTtl('2147483647'), 2147483647, 'ttl: the largest value (RFC 2181 section 8)');
  eq(E.pgDnsParseTtl('2147483648'), null, 'ttl: over 2^31-1 rejected');
  eq(E.pgDnsParseTtl('-5'), null, 'ttl: negative rejected');
  eq(E.pgDnsParseTtl('1.5'), null, 'ttl: fraction rejected');
  eq(E.pgDnsParseTtl('5x'), null, 'ttl: unknown unit rejected');
  eq(E.pgDnsParseTtl(''), null, 'ttl: blank rejected');
  eq(E.pgDnsParseTtl(null), null, 'ttl: null rejected');
  eq(E.pgDnsDuration(0), '0 s', 'duration: zero');
  eq(E.pgDnsDuration(90), '1 min 30 s', 'duration: minutes and seconds');
  eq(E.pgDnsDuration(3600), '1 h', 'duration: an hour');
  eq(E.pgDnsDuration(86400), '1 day', 'duration: a day');
  eq(E.pgDnsDuration(2 * 86400 + 3600), '2 days 1 h', 'duration: days and hours');
  eq(E.pgDnsDuration(90061), '1 day 1 h', 'duration: only the two largest units');
  eq(E.pgDnsIsIPv6('2001:db8::1'), true, 'ipv6: compressed');
  eq(E.pgDnsIsIPv6('2001:0db8:0000:0000:0000:0000:0000:0001'), true, 'ipv6: full');
  eq(E.pgDnsIsIPv6('::1'), true, 'ipv6: loopback');
  eq(E.pgDnsIsIPv6('2001:db8::1::2'), false, 'ipv6: two double colons rejected');
  eq(E.pgDnsIsIPv6('10.0.0.1'), false, 'ipv6: an IPv4 address is not one');
  eq(E.pgDnsIsIPv6('2001:db8:zz::1'), false, 'ipv6: bad digits rejected');
  eq(E.pgDnsIsPrivateV4('10.1.2.3') && E.pgDnsIsPrivateV4('172.16.0.1') && E.pgDnsIsPrivateV4('172.31.255.1') && E.pgDnsIsPrivateV4('192.168.5.5'), true, 'private ranges');
  eq(E.pgDnsIsPrivateV4('172.32.0.1') || E.pgDnsIsPrivateV4('203.0.113.10') || E.pgDnsIsPrivateV4('11.0.0.1'), false, 'public addresses are not private');
  eq(E.pgDnsOwner('www', 'example.com'), 'www.example.com', 'owner: relative name');
  eq(E.pgDnsOwner('@', 'example.com'), 'example.com', 'owner: apex');
  eq(E.pgDnsOwner('', 'example.com'), 'example.com', 'owner: blank is the apex');
  eq(E.pgDnsOwner('WWW.Example.COM', 'example.com'), 'www.example.com', 'owner: absolute and case-folded');
  eq(E.pgDnsOwner('www.example.com.', 'example.com'), 'www.example.com', 'owner: trailing dot');
  eq(E.pgDnsOwner('a.b', 'example.com'), 'a.b.example.com', 'owner: a deeper relative name');
  eq(E.pgDnsTarget('web', 'example.com'), 'web.example.com', 'target: bare label is relative');
  eq(E.pgDnsTarget('cdn.other.net', 'example.com'), 'cdn.other.net', 'target: a dotted name is complete');
  eq(E.pgDnsTarget('@', 'example.com'), 'example.com', 'target: @ is the zone');
  eq(E.pgDnsShort('example.com', 'www.example.com'), 'www', 'short: strips the zone');
  eq(E.pgDnsShort('example.com', 'example.com'), '@', 'short: apex');

  /* ---- records and the zone ---- */
  const prob = (r) => E.pgDnsRecordProblem(r, 'example.com');
  eq(prob(rec('a', 'www', 'A', '10.0.0.1')), null, 'record: a good A record');
  eq(prob(rec('a', 'www', 'A', '10.0.0.300')).field, 'value', 'record: bad IPv4 value');
  eq(prob(rec('a', 'www', 'A', '2001:db8::1')).field, 'value', 'record: IPv6 in an A record');
  eq(prob(rec('a', 'www', 'AAAA', '2001:db8::1')), null, 'record: a good AAAA record');
  eq(prob(rec('a', 'www', 'AAAA', '10.0.0.1')).field, 'value', 'record: IPv4 in an AAAA record');
  eq(prob(rec('a', 'www', 'CNAME', 'web')), null, 'record: a good CNAME');
  eq(prob(rec('a', 'www', 'CNAME', 'bad name!')).field, 'value', 'record: bad CNAME target');
  eq(prob(rec('a', 'www', 'MX', 'mail', 3600, 70000)).field, 'pref', 'record: MX preference out of range');
  eq(prob(rec('a', 'www', 'MX', 'mail', 3600, 0)), null, 'record: MX preference 0 is fine');
  eq(prob(rec('a', 'www', 'TXT', 'hello')).field, 'type', 'record: unknown type');
  eq(prob(rec('a', 'www', 'A', '10.0.0.1', 'soon')).field, 'ttl', 'record: bad ttl');
  eq(prob(rec('a', 'bad name', 'A', '10.0.0.1')).field, 'name', 'record: bad name');
  eq(prob(rec('a', 'www.other.org.', 'A', '10.0.0.1')).field, 'name', 'record: a name outside the zone');
  eq(prob(rec('a', 'www', 'A', '10.0.0.1', '5m')), null, 'record: ttl with a unit');
  const issues = (records) => E.pgDnsZoneIssues(lab(records), records).map((i) => i.code);
  eq(issues([rec('a', '@', 'CNAME', 'www'), rec('b', 'www', 'A', '10.0.0.1')]), ['cname-apex'], 'zone: a CNAME at the apex');
  eq(issues([rec('a', 'www', 'CNAME', 'web'), rec('b', 'www', 'A', '10.0.0.1')]), ['cname-conflict'], 'zone: a CNAME beside an A record');
  eq(issues([rec('a', 'www', 'CNAME', 'web'), rec('b', 'www', 'MX', 'mail')]), ['cname-conflict'], 'zone: a CNAME beside an MX record');
  eq(issues([rec('a', 'www', 'CNAME', 'web'), rec('b', 'www', 'CNAME', 'web2')]), ['cname-conflict'], 'zone: two CNAMEs on one name');
  eq(issues([rec('a', 'www', 'A', '10.0.0.1'), rec('b', 'www', 'AAAA', '2001:db8::1'), rec('c', '@', 'MX', 'mail'), rec('d', '@', 'A', '10.0.0.1')]), [], 'zone: A, AAAA, MX and an apex A coexist');
  eq(issues([rec('a', 'WWW', 'cname', 'Web'), rec('b', 'www.example.com.', 'A', '10.0.0.1')]), ['cname-conflict'], 'zone: names compare ignoring case, relative or absolute');
  eq(issues([rec('a', 'www', 'A', 'oops')]), ['bad-record'], 'zone: a bad record');
  eq(issues([rec('a', 'www', 'CNAME', 'web'), rec('b', 'web', 'A', '10.0.0.1')]), [], 'zone: a CNAME to an A record is fine');
  eq(E.pgDnsZoneIssues(lab(), lab().zone.records), [], 'zone: the lab zone is valid');

  /* ---- the authoritative server ---- */
  const L = (records) => { const t = lab(records); return (qn, qt) => E.pgDnsAuthLookup(t, t.zone.records, qn, qt || 'A'); };
  let q = L();
  eq([q('www.example.com').rcode, q('www.example.com').kind, q('www.example.com').rrs.length], ['NOERROR', 'answer', 1], 'auth: a plain answer');
  eq(q('nope.example.com').rcode, 'NXDOMAIN', 'auth: a missing name is NXDOMAIN');
  eq([q('www.example.com', 'AAAA').rcode, q('www.example.com', 'AAAA').kind], ['NOERROR', 'nodata'], 'auth: an existing name without that type is NODATA');
  eq(q('other.org').rcode, 'REFUSED', 'auth: a name outside the zone is refused');
  eq(E.pgDnsAuthLookup(lab(), [rec('a', 'x', 'A', 'bad')], 'x.example.com', 'A').rcode, 'SERVFAIL', 'auth: an invalid zone answers SERVFAIL');
  q = L([rec('a', 'sub.dept', 'A', '10.0.0.1')]);
  eq([q('dept.example.com').rcode, q('dept.example.com').kind], ['NOERROR', 'nodata'], 'auth: an empty non-terminal is NODATA, not NXDOMAIN (RFC 8020)');
  eq(q('x.sub.dept.example.com').rcode, 'NXDOMAIN', 'auth: below an existing name is NXDOMAIN');
  q = L([rec('a', 'www', 'CNAME', 'web'), rec('b', 'web', 'A', '10.0.0.1', 600), rec('c', 'web', 'A', '10.0.0.2', 60)]);
  eq(q('www.example.com').rrs.map((r) => `${r.name}:${r.type}:${r.ttl}`), ['www.example.com:CNAME:3600', 'web.example.com:A:60', 'web.example.com:A:60'], 'auth: follows the alias, and an RRset has one TTL (the lowest, RFC 2181 section 5.2)');
  eq(q('www.example.com', 'CNAME').rrs.map((r) => r.type), ['CNAME'], 'auth: asking for the CNAME itself returns it without following');
  q = L([rec('a', 'www', 'CNAME', 'web')]);
  eq([q('www.example.com').rcode, q('www.example.com').kind, q('www.example.com').name], ['NXDOMAIN', 'nxdomain', 'web.example.com'], 'auth: a dangling alias ends in NXDOMAIN for the target');
  q = L([rec('a', 'a', 'CNAME', 'b'), rec('b', 'b', 'CNAME', 'a')]);
  eq(q('a.example.com').kind, 'loop', 'auth: a loop is detected');
  const chain = [];
  for (let i = 0; i < 10; i += 1) chain.push(rec(`n${i}`, `n${i}`, 'CNAME', `n${i + 1}`));
  chain.push(rec('end', 'n10', 'A', '10.0.0.1'));
  eq(L(chain)('n0.example.com').kind, 'chain', 'auth: a very long chain is cut off');
  eq(L(chain)('n4.example.com').kind, 'answer', 'auth: a chain of six is followed');
  q = L([rec('a', 'www', 'CNAME', 'www.elsewhere.net')]);
  eq(q('www.example.com').kind, 'outside', 'auth: an alias leaving the zone is reported');
  q = L([rec('a', 'x', 'MX', 'mail', 3600, 20), rec('b', 'x', 'MX', 'mail2', 3600, 10)]);
  eq(E.pgDnsFinalValues(q('x.example.com', 'MX').rrs, 'MX'), ['10 mail2.example.com', '20 mail.example.com'], 'auth: MX values carry the preference');
  eq(E.pgDnsRrText({ name: 'www.example.com', type: 'A', value: '10.0.0.1', ttl: 300 }), 'www.example.com. 300 IN A 10.0.0.1', 'rr text: A');
  eq(E.pgDnsRrText({ name: 'www.example.com', type: 'CNAME', value: 'web.example.com', ttl: 300 }), 'www.example.com. 300 IN CNAME web.example.com.', 'rr text: CNAME has a final dot');

  /* ---- a lookup and the resolver cache ---- */
  let r = ask(lab());
  eq([r.verdict, r.rcode, r.values, r.source], ['success', 'NOERROR', ['10.0.1.20'], 'authoritative'], 'resolve: the first lookup goes to the zone server');
  eq(r.reached.name, 'Web server', 'resolve: reaches the machine behind the address');
  eq(has(text(r), /hosts file/) && has(text(r), /cache/) && has(text(r), /Zone server answers/), true, 'resolve: trace mentions hosts file, cache and the answer');
  eq(r.state.caches.res['www.example.com|A'].expires, 3600, 'cache: stored for the record TTL');
  const first = r.state;
  r = ask(lab(), first);
  eq([r.verdict, r.source, r.fromCache], ['success', 'cache', true], 'cache: the second lookup comes from the cache');
  eq(r.answers[0].ttl, 3600, 'cache: full TTL left at once');
  eq(has(text(r), /3600|1 h/), true, 'cache: trace shows the TTL');
  let t60 = E.pgDnsAdvance(lab(), first, 60).state;
  r = ask(lab(), t60);
  eq(r.answers[0].ttl, 3540, 'cache: the TTL counts down with the clock');
  eq(ask(lab(), E.pgDnsAdvance(lab(), first, 3599).state).source, 'cache', 'cache: still valid one second before the end');
  r = ask(lab(), E.pgDnsAdvance(lab(), first, 3600).state);
  eq(r.source, 'authoritative', 'cache: expired exactly at the TTL, so the zone is asked again');
  eq(r.state.caches.res['www.example.com|A'].expires, 7200, 'cache: stored again from the new time');
  eq(first.now, 0, 'resolve never mutates the state it was given');
  eq(Object.keys(E.pgDnsNewState().caches).length, 0, 'new state is empty');
  // a second client of the same resolver shares the cache; a second resolver does not
  r = ask(lab(), first, 'c2');
  eq(r.source, 'cache', 'cache: shared by every client of one resolver');
  const two = lab(null, { resolvers: [{ id: 'res', name: 'Resolver', ip: '10.0.0.53', online: true, upstream: 'auth', network: 'internal' }, { id: 'r2', name: 'Resolver 2', ip: '10.0.0.63', online: true, upstream: 'auth', network: 'internal' }], clients: [client('c1'), client('c3', { dns: '10.0.0.63' })] });
  r = ask(two, ask(two, null, 'c1').state, 'c3');
  eq(r.source, 'authoritative', 'cache: a different resolver has its own cache');
  // TTL zero is not cached
  const zero = lab([rec('www', 'www', 'A', '10.0.1.20', 0)]);
  r = ask(zero);
  eq([r.verdict, Object.keys(r.state.caches.res || {}).length], ['success', 0], 'cache: TTL 0 is never stored');
  eq(ask(zero, r.state).source, 'authoritative', 'cache: TTL 0 asks the zone every time');
  // the zone changes while the answer is cached
  const moved = set(lab(), 'zone.records.#www.value', '10.0.1.21');
  r = ask(moved, first);
  eq([r.verdict, code(r), r.values], ['failed', 'stale-cache', ['10.0.1.20']], 'cache: a changed record is not seen until the TTL ends');
  eq(r.diagnosis.ttlLeft, 3600, 'cache: the stale diagnosis says how long it lasts');
  eq(r.diagnosis.zoneValues, ['10.0.1.21'], 'cache: the stale diagnosis says what the zone holds');
  r = ask(moved, E.pgDnsFlush(first, 'res'));
  eq(code(r), 'wrong-record', 'flush: after flushing the new (here wrong) record is seen');
  r = ask(moved, E.pgDnsFlush(first, '*'));
  eq(r.source, 'authoritative', 'flush: all resolvers');
  eq(Object.keys(E.pgDnsFlush(first).caches.res).length, 0, 'flush: no id flushes everything');
  eq(Object.keys(first.caches.res).length > 0, true, 'flush: never mutates the state it was given');
  r = ask(moved, E.pgDnsAdvance(moved, first, 3600).state);
  eq(r.values, ['10.0.1.21'], 'cache: after the TTL ran out the new value arrives');
  // the cache table
  let rows = E.pgDnsCacheRows(first, 'res');
  eq(rows.map((x) => [x.name, x.type, x.kind, x.ttlLeft, x.ttl, x.text]), [['www.example.com', 'A', 'rr', 3600, 3600, '10.0.1.20']], 'cache rows: one record');
  rows = E.pgDnsCacheRows(E.pgDnsAdvance(lab(), first, 600).state, 'res');
  eq(rows[0].ttlLeft, 3000, 'cache rows: TTL left');
  eq(E.pgDnsCacheRows(E.pgDnsAdvance(lab(), first, 3600).state, 'res'), [], 'cache rows: expired entries disappear');
  eq(E.pgDnsCacheRows(null, 'res'), [], 'cache rows: no state is fine');

  /* ---- the clock ---- */
  const adv = E.pgDnsAdvance(lab(), first, 3601);
  eq(adv.state.now, 3601, 'advance: the clock moves');
  eq(adv.events.length, 1, 'advance: one event for the record that expired');
  eq([adv.events[0].t, has(adv.events[0].text, /reached the end of its TTL/)], [3600, true], 'advance: the event names the moment and the reason');
  eq(E.pgDnsAdvance(lab(), first, 10).events.length, 0, 'advance: nothing expires early');
  eq(E.pgDnsAdvance(lab(), first, -50).state.now, 0, 'advance: never goes backwards');
  const mixed = lab([rec('a', 'a', 'A', '10.0.1.20', 60), rec('b', 'b', 'A', '10.0.1.20', 120)]);
  let st = ask(mixed, null, 'c1', 'a.example.com').state;
  st = ask(mixed, st, 'c1', 'b.example.com').state;
  eq(E.pgDnsAdvance(mixed, st, 200).events.map((e) => e.t), [60, 120], 'advance: events come in the order they happened');
  eq(E.pgDnsAdvance(mixed, st, 200).state.log.length, 2, 'advance: events are kept in the log');

  /* ---- negative caching (RFC 2308) ---- */
  r = ask(lab(), null, 'c1', 'nope.example.com');
  eq([r.verdict, code(r), r.rcode], ['failed', 'nxdomain', 'NXDOMAIN'], 'nxdomain: a missing name');
  eq(r.state.caches.res['nope.example.com|*'].expires, 300, 'negative cache: stored for the negative TTL');
  eq(has(text(r), /negative TTL/), true, 'negative cache: the trace explains it');
  const neg = r.state;
  r = ask(lab(), neg, 'c2', 'nope.example.com');
  eq([r.source, code(r), has(text(r), /does not exist/)], ['cache', 'nxdomain', true], 'negative cache: the second asker is answered from the cache');
  const added = lab().zone.records.concat([rec('np', 'nope', 'A', '10.0.1.20')]);
  const nowThere = set(lab(), 'zone.records', added);
  r = ask(nowThere, neg, 'c1', 'nope.example.com');
  eq(code(r), 'negative-cache', 'negative cache: the name exists now but the resolver still says no');
  eq(r.diagnosis.ttlLeft, 300, 'negative cache: says how long it lasts');
  eq(code(ask(nowThere, E.pgDnsAdvance(nowThere, neg, 299).state, 'c1', 'nope.example.com')), 'negative-cache', 'negative cache: still there one second early');
  eq(ask(nowThere, E.pgDnsAdvance(nowThere, neg, 300).state, 'c1', 'nope.example.com').verdict, 'success', 'negative cache: gone after the negative TTL');
  eq(ask(nowThere, E.pgDnsFlush(neg, 'res'), 'c1', 'nope.example.com').verdict, 'success', 'negative cache: flushing clears it');
  r = ask(lab(), null, 'c1', 'www.example.com', 'AAAA');
  eq([r.verdict, code(r), r.rcode], ['failed', 'nodata', 'NOERROR'], 'nodata: the name exists but has no AAAA record');
  eq(r.state.caches.res['www.example.com|AAAA'].kind, 'nodata', 'nodata: cached per type');
  eq(ask(lab(), r.state, 'c1', 'www.example.com', 'A').verdict, 'success', 'nodata: the A record of the same name still works');
  eq(ask(lab(), r.state, 'c1', 'www.example.com', 'AAAA').source, 'cache', 'nodata: the second AAAA lookup comes from the cache');
  eq(ask(set(lab(), 'zone.negativeTtl', 0), null, 'c1', 'nope.example.com').state.caches.res, undefined, 'negative cache: a negative TTL of 0 stores nothing');
  eq(ask(set(lab(), 'zone.negativeTtl', '1h'), null, 'c1', 'nope.example.com').state.caches.res['nope.example.com|*'].ttl, 3600, 'negative cache: the TTL accepts units');
  // a typo in a record name is suggested
  const typo = lab([rec('h', 'helpdsk', 'A', '10.0.1.20')]);
  r = ask(typo, null, 'c1', 'helpdesk.example.com');
  eq([code(r), r.diagnosis.suggestion, r.diagnosis.recordId], ['nxdomain', 'helpdsk', 'h'], 'nxdomain: a near-miss record is suggested');
  eq(has(r.diagnosis.fix, /Rename the record "helpdsk" to "helpdesk"/), true, 'nxdomain: the fix says what to rename');
  r = ask(lab(), null, 'c1', 'zzzzzzzz.example.com');
  eq(r.diagnosis.suggestion, undefined, 'nxdomain: no suggestion when nothing is close');

  /* ---- CNAME chains and the cache ---- */
  const cn = lab([rec('www', 'www', 'CNAME', 'web', 600), rec('web', 'web', 'A', '10.0.1.20', 3600), rec('mail', 'mail', 'A', '10.0.1.25')]);
  r = ask(cn);
  eq([r.verdict, r.values, r.answers.map((a) => a.type)], ['success', ['10.0.1.20'], ['CNAME', 'A']], 'cname: the alias is followed and both records are in the answer');
  eq(Object.keys(r.state.caches.res).sort(), ['web.example.com|A', 'www.example.com|CNAME'], 'cname: each record is cached under its own name and type');
  r = ask(cn, E.pgDnsAdvance(cn, r.state, 601).state);
  eq([r.verdict, r.source], ['success', 'authoritative'], 'cname: when the alias expires the zone is asked again');
  // the alias expired but its target is still cached: the resolver asks only for the alias
  const base1 = ask(cn).state;
  const part = ask(cn, E.pgDnsAdvance(cn, base1, 601).state);
  eq(part.state.caches.res['www.example.com|CNAME'].expires, 601 + 600, 'cname: an expired alias is stored again');
  // the target changed while the alias is cached
  const reTarget = set(cn, 'zone.records.#www.value', 'mail');
  r = ask(reTarget, base1);
  eq([r.verdict, code(r), r.values], ['failed', 'stale-cache', ['10.0.1.20']], 'cname: a cached alias keeps pointing at the old target');
  r = ask(lab([rec('a', 'a', 'CNAME', 'b'), rec('b', 'b', 'CNAME', 'a')]), null, 'c1', 'a.example.com');
  eq([r.verdict, code(r), r.rcode], ['failed', 'cname-loop', 'SERVFAIL'], 'cname loop: SERVFAIL');
  eq(r.diagnosis.loop.length >= 2, true, 'cname loop: the diagnosis lists the names');
  eq(has(text(r), /loops/), true, 'cname loop: the trace says so');
  // the loop is fixed in the zone while the looping aliases are still cached
  const loopLab = lab([rec('a', 'a', 'CNAME', 'b'), rec('b', 'b', 'CNAME', 'a')]);
  const loopFixed = E.pgDnsApplyFixes(loopLab, [{ path: 'zone.records.#b.type', value: 'A' }, { path: 'zone.records.#b.value', value: '10.0.1.20' }]);
  const loopState = ask(loopLab, null, 'c1', 'a.example.com').state;
  eq(code(ask(loopLab, loopState, 'c2', 'a.example.com')), 'cname-loop', 'cname loop: the cached loop is still a loop while the zone still loops');
  r = ask(loopFixed, loopState, 'c1', 'a.example.com');
  eq([r.verdict, code(r), r.diagnosis.zoneValues], ['failed', 'stale-cache', ['10.0.1.20']], 'cname loop: fixed in the zone but still looping from the cache is a stale cache');
  eq(ask(loopFixed, E.pgDnsFlush(loopState, 'res'), 'c1', 'a.example.com').verdict, 'success', 'cname loop: a flush lets the fixed zone through');
  eq(ask(loopFixed, E.pgDnsAdvance(loopFixed, loopState, 3600).state, 'c1', 'a.example.com').verdict, 'success', 'cname loop: so does waiting out the TTL');
  r = ask(lab(chain), null, 'c1', 'n0.example.com');
  eq([code(r), r.rcode], ['cname-chain', 'SERVFAIL'], 'cname chain: too long');
  r = ask(lab([rec('a', 'www', 'CNAME', 'web')]), null, 'c1', 'www.example.com');
  eq([code(r), r.rcode], ['nxdomain', 'NXDOMAIN'], 'dangling alias: NXDOMAIN');
  r = ask(lab([rec('a', 'www', 'CNAME', 'www.elsewhere.net')]), null, 'c1', 'www.example.com');
  eq(code(r), 'out-of-zone', 'alias leaving the zone: the lab says it cannot go on');
  r = ask(cn, null, 'c1', 'www.example.com', 'CNAME');
  eq([r.verdict, r.values], ['success', ['web.example.com']], 'cname: a CNAME lookup returns the alias itself');
  // two aliases of one target: the second alias is a cache miss, so the zone server answers with the alias and the target together
  const two2 = lab([rec('a', 'a', 'CNAME', 'web'), rec('b', 'b', 'CNAME', 'web'), rec('web', 'web', 'A', '10.0.1.20')]);
  const afterA = ask(two2, null, 'c1', 'a.example.com').state;
  r = ask(two2, afterA, 'c1', 'b.example.com');
  eq([r.verdict, r.source, r.values], ['success', 'authoritative', ['10.0.1.20']], 'cname: a different alias of a cached target is still a cache miss');
  // the same alias again is answered from the cache, alias and target
  r = ask(two2, afterA, 'c2', 'a.example.com');
  eq([r.source, r.answers.map((a) => a.fromCache)], ['cache', [true, true]], 'cname: the same alias again comes entirely from the cache');

  /* ---- the zone is refused ---- */
  const apex = lab([rec('a', '@', 'CNAME', 'www'), rec('w', 'www', 'A', '10.0.1.20')]);
  r = ask(apex, null, 'c1', 'www.example.com');
  eq([r.verdict, code(r), r.rcode], ['failed', 'cname-apex', 'SERVFAIL'], 'apex CNAME: the whole zone fails');
  eq(r.diagnosis.recordId, 'a', 'apex CNAME: the record is named');
  eq(has(r.diagnosis.text, /RFC 1034/), true, 'apex CNAME: cites the RFC');
  eq(code(ask(lab([rec('a', 'www', 'CNAME', 'web'), rec('b', 'www', 'A', '10.0.1.20')]))), 'cname-conflict', 'CNAME beside other data');
  eq(code(ask(lab([rec('a', 'www', 'A', 'x.y')]))), 'bad-record', 'a bad record fails the zone');
  eq(ask(apex, null, 'c1', 'example.com', 'MX').verdict, 'failed', 'apex CNAME: MX lookups fail too');

  /* ---- clients, resolvers and the zone server ---- */
  r = ask(lab(), null, 'c1', 'www');
  eq([r.name, r.verdict], ['www.example.com', 'success'], 'query: a bare label is relative to the zone');
  eq(ask(lab(), null, 'c1', 'WWW.EXAMPLE.COM.').name, 'www.example.com', 'query: case and the final dot are ignored');
  eq(code(ask(lab(), null, 'c1', 'www.other.org')), 'out-of-zone', 'query: another zone is outside the lab');
  eq(code(ask(lab(), null, 'c1', 'bad name!')), 'bad-query', 'query: an invalid name');
  eq(code(ask(lab(), null, 'c1', 'www.example.com', 'TXT')), 'bad-query', 'query: an unknown type');
  eq(code(ask(lab(), null, 'ghost')), 'no-client', 'query: an unknown client');
  r = ask(set(lab(), 'clients.#c1.dns', '10.0.0.35'));
  eq([r.verdict, code(r), r.rcode, r.diagnosis.field], ['failed', 'wrong-dns-server', 'TIMEOUT', 'client-dns'], 'client: nothing answers at the DNS address');
  eq(has(r.diagnosis.fix, /10\.0\.0\.53/), true, 'client: the fix names the resolver');
  r = ask(set(lab(), 'clients.#c1.dns', ''));
  eq([code(r), has(r.diagnosis.title, /no DNS server/)], ['wrong-dns-server', true], 'client: no DNS server at all');
  r = ask(set(lab(), 'resolvers.0.online', false));
  eq([code(r), r.rcode, r.diagnosis.deviceId], ['resolver-down', 'TIMEOUT', 'res'], 'resolver: offline');
  r = ask(set(lab(), 'auth.online', false));
  eq([code(r), r.rcode, r.diagnosis.deviceId], ['auth-down', 'SERVFAIL', 'auth'], 'zone server: offline, uncached names fail');
  const warm = ask(lab()).state;
  r = ask(set(lab(), 'auth.online', false), warm);
  eq([r.verdict, r.source], ['success', 'cache'], 'zone server offline: cached names keep working until their TTL ends');
  r = ask(set(lab(), 'auth.online', false), E.pgDnsAdvance(lab(), warm, 3600).state);
  eq(code(r), 'auth-down', 'zone server offline: after the TTL the name fails');
  r = ask(set(lab(), 'resolvers.0.upstream', ''));
  eq([code(r), r.rcode], ['wrong-dns-server', 'SERVFAIL'], 'resolver: no path to the zone is SERVFAIL');
  r = ask(set(lab(), 'clients.#c1.dns', '10.0.0.54'));
  eq([r.verdict, r.source], ['success', 'authoritative'], 'client: may ask the zone server directly');
  eq(Object.keys(ask(set(lab(), 'clients.#c1.dns', '10.0.0.54')).state.caches).length, 0, 'zone server: keeps no cache');
  r = ask(set(set(lab(), 'clients.#c1.dns', '10.0.0.54'), 'auth.online', false));
  eq(code(r), 'auth-down', 'zone server asked directly and offline');
  const ext = lab(null, { clients: [client('far', { network: 'external', dns: '10.0.0.53' })] });
  r = ask(ext, null, 'far');
  eq([code(r), r.rcode], ['wrong-dns-server', 'TIMEOUT'], 'client: an outside client cannot reach a private resolver');

  /* ---- the hosts file ---- */
  const withHosts = (ip, name) => lab(null, { clients: [client('c1', { hosts: [{ name: name || 'www.example.com', ip }] }), client('c2')] });
  r = ask(withHosts('10.0.1.21'));
  eq([r.verdict, code(r), r.source], ['failed', 'hosts-override', 'hosts'], 'hosts: a line that disagrees with DNS and does not work');
  eq(has(text(r), /no DNS server is asked/), true, 'hosts: the trace says DNS was not asked');
  eq(Object.keys(r.state.caches).length, 0, 'hosts: no DNS query means nothing is cached');
  eq(ask(withHosts('10.0.1.21'), null, 'c2').verdict, 'success', 'hosts: other clients are not affected');
  r = ask(withHosts('10.0.1.20'));
  eq([r.verdict, r.source, r.warning], ['success', 'hosts', undefined], 'hosts: a line that agrees with DNS works');
  r = ask(withHosts('10.0.1.99'));
  eq(code(r), 'hosts-override', 'hosts: an address with no machine behind it');
  r = ask(lab([rec('www', 'www', 'A', '10.0.1.21')], { clients: [client('c1', { hosts: [{ name: 'www', ip: '10.0.1.20' }] })] }));
  eq([r.verdict, r.warning && r.warning.code], ['success', 'hosts-override'], 'hosts: a different but working address is a warning, not a failure');
  eq(ask(withHosts('10.0.1.20', 'mail.example.com'), null, 'c1', 'www.example.com').source, 'authoritative', 'hosts: a line for another name changes nothing');
  eq(ask(withHosts('10.0.1.20'), null, 'c1', 'www.example.com', 'AAAA').source !== 'hosts', true, 'hosts: an IPv4 line does not answer an AAAA query');
  eq(ask(withHosts('10.0.1.21', 'WWW.example.com')).source, 'hosts', 'hosts: names are matched ignoring case');
  r = ask(set(withHosts('10.0.1.20'), 'resolvers.0.online', false));
  eq(r.verdict, 'success', 'hosts: works even when every DNS server is down');

  /* ---- reaching the machine ---- */
  r = ask(lab([rec('www', 'www', 'A', '10.0.1.21')]));
  eq([code(r), r.diagnosis.address, r.diagnosis.recordId], ['wrong-record', '10.0.1.21', 'www'], 'reach: the name goes to a machine that does not serve it');
  eq(has(r.diagnosis.fix, /Web server's address \(10\.0\.1\.20\)/), true, 'reach: the fix names the right machine');
  r = ask(lab([rec('www', 'www', 'A', '10.0.1.99')]));
  eq([code(r), has(r.diagnosis.title, /nothing lives/)], ['wrong-record', true], 'reach: an address nobody uses');
  r = ask(lab([rec('www', 'www', 'CNAME', 'web'), rec('web', 'web', 'A', '10.0.1.20')]));
  eq(r.verdict, 'success', 'reach: an alias of a served name reaches the same machine');
  r = ask(lab(), null, 'c1', 'mail.example.com', 'MX');
  eq(code(r), 'nodata', 'mx: no MX record at a name that has none');
  r = ask(lab(), null, 'c1', 'example.com', 'MX');
  eq([r.verdict, r.values], ['success', ['10 mail.example.com']], 'mx: the apex MX record');
  r = ask(lab([rec('a', 'x', 'MX', 'm2', 3600, 20), rec('b', 'x', 'MX', 'm1', 3600, 10)]), null, 'c1', 'x.example.com', 'MX');
  eq(r.values, ['10 m1.example.com', '20 m2.example.com'], 'mx: values sorted by preference text');
  r = ask(lab([rec('a', 'www', 'AAAA', '2001:db8::1')], { machines: [{ id: 'web', name: 'Web server', ips: ['2001:db8::1'], serves: ['www.example.com'] }] }), null, 'c1', 'www.example.com', 'AAAA');
  eq([r.verdict, r.values], ['success', ['2001:db8::1']], 'aaaa: an IPv6 record works');
  eq(code(ask(lab(), null, 'c1', 'www.example.com', 'AAAA')), 'nodata', 'aaaa: nodata without a record');

  /* ---- split-horizon, private and public addresses ---- */
  const web = { id: 'web', name: 'Web server', ips: ['10.0.1.20', '203.0.113.10'], serves: ['www.example.com'] };
  const splitLab = (over) => Object.assign({
    zone: { name: 'example.com', negativeTtl: 300, records: [rec('www', 'www', 'A', '203.0.113.10')], internal: [rec('iw', 'www', 'A', '10.0.1.20')] },
    auth: { name: 'Zone server', ip: '10.0.0.54', online: true, splitHorizon: true },
    resolvers: [{ id: 'res', name: 'Office resolver', ip: '10.0.0.53', online: true, upstream: 'auth', network: 'internal' }, { id: 'isp', name: 'ISP resolver', ip: '198.51.100.53', online: true, upstream: 'auth', network: 'external' }],
    clients: [client('in'), client('out', { network: 'external', dns: '198.51.100.53' }), client('wrongway', { dns: '198.51.100.53' })],
    machines: [web], hairpin: false,
  }, over || {});
  r = ask(splitLab(), null, 'in');
  eq([r.verdict, r.values, r.view], ['success', ['10.0.1.20'], 'internal'], 'split: inside clients get the inside view');
  r = ask(splitLab(), null, 'out');
  eq([r.verdict, r.values, r.view], ['success', ['203.0.113.10'], 'external'], 'split: outside clients get the public view');
  r = ask(splitLab(), null, 'wrongway');
  eq([code(r), r.values], ['split-horizon', ['203.0.113.10']], 'split: an inside client using a public resolver gets the public address and fails');
  r = ask(splitLab({ auth: { name: 'Zone server', ip: '10.0.0.54', online: true, splitHorizon: false } }), null, 'in');
  eq(code(r), 'split-horizon', 'split: without split-horizon the inside client gets the public address and fails');
  eq(has(r.diagnosis.text, /hairpin/i), true, 'split: the diagnosis mentions hairpin NAT');
  r = ask(splitLab({ auth: { name: 'Zone server', ip: '10.0.0.54', online: true, splitHorizon: false }, hairpin: true }), null, 'in');
  eq([r.verdict, r.values], ['success', ['203.0.113.10']], 'split: hairpin NAT lets inside clients use the public address');
  r = ask(splitLab({ zone: { name: 'example.com', negativeTtl: 300, records: [rec('www', 'www', 'A', '203.0.113.10')], internal: [] } }), null, 'in');
  eq([code(r), r.rcode], ['split-horizon', 'NXDOMAIN'], 'split: a name missing from the internal view is NXDOMAIN inside, though it exists outside');
  r = ask(splitLab({ zone: { name: 'example.com', negativeTtl: 300, records: [rec('www', 'www', 'A', '10.0.1.20')], internal: [] }, auth: { name: 'Zone server', ip: '10.0.0.54', online: true, splitHorizon: false } }), null, 'out');
  eq(code(r), 'split-horizon', 'split: an outside client given a private address cannot connect');
  const sp = ask(splitLab(), null, 'in').state;
  eq(ask(splitLab(), sp, 'out').source, 'authoritative', 'split: the two resolvers do not share their caches');

  /* ---- goals, scripts and edits ---- */
  eq(E.pgDnsGoal(lab(), { client: 'c1', name: 'www.example.com', verdict: 'success' }).verdict, 'success', 'goal: plain');
  eq(code(E.pgDnsGoal(lab(), { client: 'c1', name: 'nope.example.com', verdict: 'failed' })), 'nxdomain', 'goal: a failing lookup carries its code');
  eq(E.pgDnsGoal(lab(), { client: 'c1', name: 'www.example.com', answer: ['10.0.1.20'] }).verdict, 'success', 'goal: the right answer');
  r = E.pgDnsGoal(lab(), { client: 'c1', name: 'www.example.com', answer: ['10.0.1.99'] });
  eq([r.verdict, code(r)], ['failed', 'wrong-record'], 'goal: the wrong answer fails');
  eq(E.pgDnsGoal(lab(), { client: 'c1', name: 'example.com', type: 'MX', answer: ['10 mail.example.com'] }).verdict, 'success', 'goal: an MX answer');
  eq(E.pgDnsGoal(lab(), { client: 'ghost', name: 'www.example.com' }).verdict, 'failed', 'goal: an unknown client fails');
  const mig = [{ do: 'edit', path: 'zone.records.#www.value', value: '10.0.1.20' }, { do: 'query' }, { do: 'edit', path: 'zone.records.#www.value', value: '10.0.1.21' }, { do: 'advance', minutes: 10 }];
  const longTtl = lab([rec('www', 'www', 'A', '10.0.1.21', '1d'), rec('mail', 'mail', 'A', '10.0.1.25')], { machines: [{ id: 'new', name: 'New', ips: ['10.0.1.21'], serves: ['www.example.com'] }, { id: 'old', name: 'Old', ips: ['10.0.1.20'], serves: [] }] });
  r = E.pgDnsGoal(longTtl, { client: 'c1', name: 'www.example.com', script: mig });
  eq([r.verdict, code(r)], ['failed', 'stale-cache'], 'goal script: a long TTL leaves the old address in the cache');
  eq(E.pgDnsGoal(set(longTtl, 'zone.records.#www.ttl', 300), { client: 'c1', name: 'www.example.com', script: mig }).verdict, 'success', 'goal script: a TTL of 5 minutes is over in 10');
  eq(E.pgDnsGoal(set(longTtl, 'zone.records.#www.ttl', '10m'), { client: 'c1', name: 'www.example.com', script: mig }).verdict, 'success', 'goal script: a TTL of exactly 10 minutes is over in 10');
  eq(E.pgDnsGoal(set(longTtl, 'zone.records.#www.ttl', '11m'), { client: 'c1', name: 'www.example.com', script: mig }).verdict, 'failed', 'goal script: a TTL of 11 minutes is not');
  r = E.pgDnsGoal(longTtl, { client: 'c1', name: 'www.example.com', script: mig.concat([{ do: 'flush' }]) });
  eq(r.verdict, 'success', 'goal script: a flush removes the old copy');
  r = E.pgDnsGoal(lab(), { client: 'c1', name: 'nope.example.com', script: [{ do: 'query' }, { do: 'apply', fixes: [{ push: 'zone.records', value: rec('np', 'nope', 'A', '10.0.1.20') }] }, { do: 'advance', minutes: 1 }] });
  eq(code(r), 'negative-cache', 'goal script: a record added while the failure is cached');
  r = E.pgDnsGoal(lab(), { client: 'c1', name: 'nope.example.com', script: [{ do: 'query' }, { do: 'apply', fixes: [{ push: 'zone.records', value: rec('np', 'nope', 'A', '10.0.1.20') }] }, { do: 'advance', minutes: 5 }] });
  eq(r.verdict, 'success', 'goal script: five minutes later it works');
  r = E.pgDnsGoal(set(lab(), 'auth.online', false), { client: 'c1', name: 'www.example.com', setup: [{ path: 'auth.online', value: true }] });
  eq(r.verdict, 'success', 'goal setup: forces a setting for the check');
  eq(E.pgDnsGoal(lab(), { client: 'c1', name: 'www.example.com', setup: [{ path: 'auth.online', value: false }] }).verdict, 'failed', 'goal setup: can also break something');
  const orig = lab();
  const copyOf = JSON.stringify(orig);
  E.pgDnsGoal(orig, { client: 'c1', name: 'www.example.com', setup: [{ path: 'auth.online', value: false }], script: mig });
  eq(JSON.stringify(orig), copyOf, 'goal: never changes the learner\'s topology');
  const base = lab();
  eq(E.pgDnsApplyFixes(base, [{ path: 'zone.records.#www.value', value: '10.0.1.99' }]).zone.records[0].value, '10.0.1.99', 'apply fixes: set by #id');
  eq(base.zone.records[0].value, '10.0.1.20', 'apply fixes: works on a copy');
  eq(E.pgDnsApplyFixes(base, [{ path: 'zone.records.1.value', value: '10.0.1.98' }]).zone.records[1].value, '10.0.1.98', 'apply fixes: set by index');
  eq(E.pgDnsApplyFixes(base, [{ push: 'zone.records', value: rec('n', 'n', 'A', '10.0.0.1') }]).zone.records.length, 4, 'apply fixes: push');
  eq(E.pgDnsApplyFixes(base, [{ remove: 'zone.records.#mail' }]).zone.records.map((x) => x.id), ['www', 'mx'], 'apply fixes: remove by #id');
  eq(E.pgDnsApplyFixes(base, [{ remove: 'zone.records.0' }]).zone.records.map((x) => x.id), ['mail', 'mx'], 'apply fixes: remove by index');
  eq(E.pgDnsApplyFixes(base, [{ remove: 'zone.records.#ghost' }]).zone.records.length, 3, 'apply fixes: removing a missing id does nothing');
  eq(E.pgDnsApplyFixes(base, [{ path: 'zone.records.#ghost.value', value: 'x' }]).zone.records.length, 3, 'apply fixes: a missing id is ignored');
  eq(E.pgDnsApplyFixes(base, [{ path: 'nothing.here.at.all', value: 1 }]).zone.records.length, 3, 'apply fixes: a bad path is ignored');
  eq(E.pgDnsApplyFixes(base, [{ push: 'nothing', value: 1 }]).zone.records.length, 3, 'apply fixes: a bad push is ignored');
  eq(E.pgDnsApplyFixes(base, null).zone.records.length, 3, 'apply fixes: nothing to do');
  eq(E.pgDnsSetPath(base, 'auth.online', false).auth.online, false, 'set path: a plain field');
  eq(E.pgDnsSetPath(base, 'clients.#c2.dns', '1.1.1.1').clients[1].dns, '1.1.1.1', 'set path: by #id');

  /* ---- every scenario: the broken outcome and the fixed outcome ---- */
  const scenarios = data.dns || [];
  eq(scenarios.length >= 6 && scenarios.length <= 8, true, 'dns: six to eight scenarios');
  eq(['starter', 'core', 'stretch'].every((lv) => scenarios.some((sc) => sc.level === lv)), true, 'dns: all three levels are used');
  const seenCodes = new Set();
  scenarios.forEach((sc) => {
    sc.expect.forEach((g) => {
      const res = E.pgDnsGoal(sc.topology, g);
      eq(res.verdict, g.verdict, `dns ${sc.id}: broken ${g.client} ${g.name} verdict`);
      if (g.code) { eq(code(res), g.code, `dns ${sc.id}: broken ${g.client} ${g.name} code`); seenCodes.add(g.code); }
      eq(res.steps.length > 0, true, `dns ${sc.id}: broken ${g.client} has a trace`);
    });
    // the scenario really is broken: at least one goal of the fixed list fails before the fix
    eq(sc.expectFixed.some((g) => E.pgDnsGoal(sc.topology, g).verdict !== g.verdict), true, `dns ${sc.id}: not solved before the fix`);
    const fixed = E.pgDnsApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((g) => {
      const res = E.pgDnsGoal(fixed, g);
      eq(res.verdict, g.verdict, `dns ${sc.id}: fixed ${g.client} ${g.name} verdict`);
      eq(typeof g.label === 'string' && g.label.length > 0, true, `dns ${sc.id}: ${g.client} goal has a label`);
    });
    // the first diagnosis names a field the editors expose
    const firstFail = sc.expect.find((g) => g.verdict === 'failed');
    const d = E.pgDnsGoal(sc.topology, firstFail).diagnosis;
    eq(typeof d.title === 'string' && d.title.length > 0 && typeof d.fix === 'string' && d.fix.length > 0, true, `dns ${sc.id}: diagnosis has a title and a fix`);
    eq(['zone-records', 'internal-records', 'client-dns', 'hosts', 'ttl', 'split', 'resolver-online', 'auth-online', 'upstream', 'negative-ttl'].includes(d.field), true, `dns ${sc.id}: diagnosis field ${d.field} is one the screen highlights`);
    // the fix is minimal: undoing the last fix entry breaks it again
    const lastUndone = E.pgDnsApplyFixes(sc.topology, sc.fix.slice(0, -1));
    eq(sc.expectFixed.some((g) => E.pgDnsGoal(lastUndone, g).verdict !== g.verdict), true, `dns ${sc.id}: the last fix entry is needed`);
    // a scenario with a hairpin or flush shortcut would break the minimal-fix rule, so the topology is the only thing edited
    eq(JSON.stringify(sc.fix).indexOf('hairpin') < 0, true, `dns ${sc.id}: the fix does not rely on hairpin NAT`);
  });
  ['wrong-record', 'wrong-dns-server', 'nxdomain', 'cname-loop', 'hosts-override', 'stale-cache', 'cname-apex', 'split-horizon'].forEach((c) => eq(seenCodes.has(c), true, `dns: some scenario shows ${c}`));

  /* ---- the sandbox ---- */
  const sb = data.dnsSandbox;
  eq(!!sb, true, 'dns: sandbox exists');
  if (sb) {
    const look = (who, name, type) => ask(sb, null, who, name, type);
    const lookWarm = (who, name, type) => E.pgDnsGoal(sb, { client: who, name, type, verdict: 'success' });
    [['ana', 'www.example.com', 'A', ['10.0.1.20']], ['ana', 'intranet.example.com', 'A', ['10.0.1.20']], ['ana', 'example.com', 'A', ['10.0.1.20']], ['ana', 'files.example.com', 'A', ['10.0.1.30']],
      ['ana', 'helpdesk.example.com', 'A', ['10.0.1.40']], ['ana', 'mail.example.com', 'A', ['10.0.1.25']], ['ben', 'www.example.com', 'A', ['10.0.1.20']],
      ['ana', 'example.com', 'MX', ['10 mail.example.com']], ['remote', 'www.example.com', 'A', ['203.0.113.10']], ['remote', 'mail.example.com', 'A', ['203.0.113.25']],
      ['remote', 'example.com', 'MX', ['10 mail.example.com']]].forEach(([who, name, type, want]) => {
      const res = lookWarm(who, name, type);
      eq([res.verdict, res.values], ['success', want], `dns sandbox: ${who} ${type} ${name} works`);
    });
    eq(code(look('remote', 'files.example.com')), 'nxdomain', 'dns sandbox: an inside-only name does not exist outside');
    eq(code(look('ana', 'www.example.com', 'AAAA')), 'nodata', 'dns sandbox: no AAAA records');
    // a day of lookups: TTLs run out and the zone is asked again, never a failure
    let s = look('ana', 'www.example.com').state;
    s = E.pgDnsAdvance(sb, s, 86400).state;
    eq(ask(sb, s, 'ana', 'www.example.com').verdict, 'success', 'dns sandbox: still working after a day');
    // the learner can break it
    eq(ask(set(sb, 'auth.splitHorizon', false), null, 'ana').verdict, 'failed', 'dns sandbox: turning split-horizon off breaks the inside');
    eq(code(ask(set(sb, 'clients.#ana.dns', '10.0.0.35'), null, 'ana')), 'wrong-dns-server', 'dns sandbox: a wrong DNS server breaks one laptop');
    const cp = JSON.stringify(sb);
    ask(sb, null, 'ana');
    E.pgDnsGoal(sb, { client: 'ana', name: 'www.example.com', script: mig });
    eq(JSON.stringify(sb), cp, 'dns: the simulation never mutates its topology');
  }
};
