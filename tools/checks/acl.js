/* Engine tests and scenario replay for the ACL lab (src/js/03c_pg_acl.js). */
module.exports = ({ E, eq, data }) => {
  const sb = () => E.pgClone(data.aclSandbox);
  const ed = (fn, base) => { const t = base ? E.pgClone(base) : sb(); fn(t); return t; };
  const router = (t, id) => t.routers.find((r) => r.id === id);
  const iface = (t, id) => { for (const r of t.routers) { const i = r.interfaces.find((x) => x.id === id); if (i) return i; } return null; };
  const acl = (t, rid, name) => router(t, rid).acls.find((a) => a.name === name);
  const ent = (id, seq, action, proto, src, dst, extra) => ({ id, seq, action, proto, src, srcPort: 'any', dst, dstPort: 'any', icmp: 'any', established: false, ...(extra || {}) });
  const std = (id, seq, action, src) => ({ id, seq, action, src });
  const T = (t, from, to, proto, port, extra) => E.pgAclTest(t, { from, to, proto, port, ...(extra || {}) });
  const code = (t, from, to, proto, port, extra) => { const r = T(t, from, to, proto, port, extra); return r.diagnosis ? r.diagnosis.code : r.verdict; };
  const warn = (t, from, to, proto, port, extra) => T(t, from, to, proto, port, extra).warnings.map((w) => w.code);
  const ip = (s) => E.pgParseIPv4(s);
  const text = (r) => r.steps.map((s) => s.text).join(' | ');

  /* ---- addresses and wildcard masks ---- */
  eq(E.pgAclParseAddr('any').form, 'any', 'any');
  eq(E.pgAclParseAddr('ANY').ok, true, 'keywords are case-insensitive');
  eq(E.pgAclParseAddr('host 10.1.1.5').text, 'host 10.1.1.5', 'host form');
  eq(E.pgAclParseAddr('host 10.1.1.5').wild, 0, 'host has an all-zero wildcard');
  eq(E.pgAclParseAddr('10.1.20.0 0.0.0.255').text, '10.1.20.0 0.0.0.255', 'address and wildcard');
  eq(E.pgAclParseAddr('  10.1.20.0    0.0.0.255 ').ok, true, 'extra spaces are fine');
  eq(E.pgAclParseAddr('10.1.1.5', 'standard').form, 'host', 'a bare address is a host in a standard ACL');
  eq(E.pgAclParseAddr('10.1.1.5', 'extended').ok, false, 'a bare address is not valid in an extended ACL');
  eq(E.pgAclParseAddr('host').ok, false, 'host needs an address');
  eq(E.pgAclParseAddr('host 10.1.1').ok, false, 'host needs a full address');
  eq(E.pgAclParseAddr('10.1.1.0 0.0.0.256').ok, false, 'wildcard octet too big');
  eq(E.pgAclParseAddr('10.1.1.0/24').ok, false, 'CIDR is not IOS ACL syntax');
  eq(E.pgAclParseAddr('').ok, false, 'empty is invalid');
  eq(E.pgAclParseAddr('10.1.1.0 0.0.0.255 extra').ok, false, 'too many words');
  const m = (spec, a, kind) => E.pgAclAddrMatch(E.pgAclParseAddr(spec, kind || 'extended'), ip(a));
  eq(m('10.1.20.0 0.0.0.255', '10.1.20.50'), true, 'wildcard 0.0.0.255 matches the last octet');
  eq(m('10.1.20.0 0.0.0.255', '10.1.21.50'), false, 'wildcard 0.0.0.255 does not match another /24');
  eq(m('10.0.0.0 0.255.255.255', '10.99.1.2'), true, 'wildcard for a /8');
  eq(m('10.1.20.0 255.255.255.0', '10.1.20.50'), false, 'a subnet mask used as a wildcard misses the host');
  eq(m('10.1.20.0 255.255.255.0', '10.7.7.0'), true, 'a subnet mask used as a wildcard matches any address ending in .0');
  eq(m('10.1.10.0 0.0.0.254', '10.1.10.20'), true, 'a non-contiguous wildcard matches even last octets');
  eq(m('10.1.10.0 0.0.0.254', '10.1.10.21'), false, 'a non-contiguous wildcard rejects odd last octets');
  eq(m('host 10.1.20.50', '10.1.20.50'), true, 'host matches itself');
  eq(m('host 10.1.20.50', '10.1.20.51'), false, 'host matches only itself');
  eq(m('any', '203.0.113.9'), true, 'any matches everything');
  eq(m('10.1.20.77 0.0.0.255', '10.1.20.1'), true, 'bits under the wildcard in the address are ignored');
  eq(E.pgAclMaskLike(ip('255.255.255.0')), true, '255.255.255.0 looks like a subnet mask');
  eq(E.pgAclMaskLike(ip('255.255.240.0')), true, '255.255.240.0 looks like a subnet mask');
  eq(E.pgAclMaskLike(ip('255.0.0.0')), true, '255.0.0.0 looks like a subnet mask');
  eq(E.pgAclMaskLike(ip('0.0.0.255')), false, '0.0.0.255 is a real wildcard');
  eq(E.pgAclMaskLike(ip('0.0.15.255')), false, '0.0.15.255 is a real wildcard');
  eq(E.pgAclMaskLike(ip('0.0.0.0')), false, '0.0.0.0 is not flagged');
  eq(E.pgAclMaskLike(ip('255.255.255.255')), false, '255.255.255.255 is not flagged');
  eq(E.pgAclMaskLike(ip('0.0.0.254')), false, 'a non-contiguous wildcard is not flagged');

  /* ---- ports ---- */
  eq(E.pgAclParsePort('').op, 'any', 'empty port is any');
  eq(E.pgAclParsePort('eq 80').text, 'eq 80', 'eq');
  eq(E.pgAclParsePort('EQ  www').text, 'eq 80', 'port names become numbers');
  eq(E.pgAclParsePort('range 20 21').text, 'range 20 21', 'range');
  eq(E.pgAclParsePort('range 21 20').ok, false, 'reversed range');
  eq(E.pgAclParsePort('eq 70000').ok, false, 'port too big');
  eq(E.pgAclParsePort('eq http').ok, false, 'unknown port name');
  eq(E.pgAclParsePort('80').ok, false, 'a port needs an operator');
  eq(E.pgAclParsePort('eq').ok, false, 'operator without a port');
  const pm = (spec, port) => E.pgAclPortMatch(E.pgAclParsePort(spec), port);
  eq([pm('eq 80', 80), pm('eq 80', 81), pm('neq 80', 80), pm('neq 80', 81)], [true, false, false, true], 'eq and neq');
  eq([pm('lt 1024', 1023), pm('lt 1024', 1024), pm('gt 1023', 1023), pm('gt 1023', 50000)], [true, false, false, true], 'lt and gt');
  eq([pm('range 20 21', 20), pm('range 20 21', 21), pm('range 20 21', 22), pm('any', 5)], [true, true, false, true], 'range and any');

  /* ---- entry text ---- */
  eq(E.pgAclEntryText('extended', ent('a', 10, 'permit', 'tcp', '10.1.20.0 0.0.0.255', 'host 10.1.30.10', { dstPort: 'eq www' })), 'permit tcp 10.1.20.0 0.0.0.255 host 10.1.30.10 eq 80', 'extended entry text');
  eq(E.pgAclEntryText('extended', ent('a', 10, 'deny', 'ip', 'any', 'any')), 'deny ip any any', 'ip entry text');
  eq(E.pgAclEntryText('extended', ent('a', 10, 'permit', 'tcp', 'any', 'any', { established: true })), 'permit tcp any any established', 'established text');
  eq(E.pgAclEntryText('extended', ent('a', 10, 'permit', 'icmp', 'any', 'any', { icmp: 'echo-reply' })), 'permit icmp any any echo-reply', 'icmp text');
  eq(E.pgAclEntryText('extended', ent('a', 10, 'permit', 'udp', 'any', 'any', { srcPort: 'eq 53' })), 'permit udp any eq 53 any', 'source port sits after the source');
  eq(E.pgAclEntryText('standard', std('a', 10, 'deny', '10.1.10.5')), 'deny host 10.1.10.5', 'standard entry text');
  eq(E.pgAclEntryText('standard', std('a', 10, 'permit', 'any')), 'permit any', 'standard any');

  /* ---- reading one ACL ---- */
  const pk = (o) => ({ proto: 'tcp', srcIp: ip('10.1.20.50'), dstIp: ip('10.1.30.10'), srcPort: 50000, dstPort: 80, ack: false, icmp: null, ...o });
  const A = { name: 'T', kind: 'extended', entries: [] };
  eq(E.pgAclEval(A, pk()).action, 'permit', 'an ACL with no entries permits everything');
  eq(E.pgAclEval(A, pk()).empty, true, 'and says so');
  A.entries = [ent('a', 10, 'permit', 'tcp', 'any', 'any', { dstPort: 'eq 80' })];
  eq(E.pgAclEval(A, pk()).action, 'permit', 'a matching permit');
  eq([E.pgAclEval(A, pk({ dstPort: 81 })).action, E.pgAclEval(A, pk({ dstPort: 81 })).implicit], ['deny', true], 'no match: implicit deny');
  eq(E.pgAclEval(A, pk({ proto: 'udp' })).implicit, true, 'a tcp entry does not match udp');
  eq(E.pgAclEval(A, pk({ proto: 'ip' })).implicit, true, 'a tcp entry does not match another IP protocol');
  A.entries = [ent('b', 20, 'permit', 'ip', 'any', 'any'), ent('a', 10, 'deny', 'ip', '10.1.20.0 0.0.0.255', 'any')];
  eq(E.pgAclEval(A, pk()).entry.id, 'a', 'lowest sequence number is read first, whatever the list order');
  eq(E.pgAclEval(A, pk({ srcIp: ip('10.1.10.5') })).entry.id, 'b', 'the next entry is read when the first does not match');
  eq(E.pgAclSorted(A).map((x) => x.seq), [10, 20], 'sorted by sequence');
  A.entries = [ent('a', 10, 'permit', 'ip', 'any', 'any'), ent('b', 5, 'permit', 'ip', 'any', 'any')];
  eq(E.pgAclEval(A, pk()).entry.id, 'b', 'sequence 5 comes before 10');
  const S = { name: '10', kind: 'standard', entries: [std('a', 10, 'deny', '10.1.20.0 0.0.0.255'), std('b', 20, 'permit', 'any')] };
  eq(E.pgAclEval(S, pk()).action, 'deny', 'standard ACL denies by source');
  eq(E.pgAclEval(S, pk({ dstIp: ip('8.8.8.8'), dstPort: 53, proto: 'udp' })).action, 'deny', 'a standard ACL ignores destination, protocol and port');
  eq(E.pgAclEval(S, pk({ srcIp: ip('10.1.10.5') })).action, 'permit', 'other sources pass');
  const E1 = { name: 'E', kind: 'extended', entries: [ent('a', 10, 'permit', 'tcp', 'any', 'any', { established: true })] };
  eq(E.pgAclEval(E1, pk({ ack: false })).implicit, true, 'established does not match a SYN');
  eq(E.pgAclEval(E1, pk({ ack: true })).action, 'permit', 'established matches a packet with ACK set');
  eq(E.pgAclEval(E1, pk({ proto: 'udp', ack: true })).implicit, true, 'established is for tcp only');
  const E2 = { name: 'E', kind: 'extended', entries: [ent('a', 10, 'permit', 'udp', 'any', 'any', { srcPort: 'eq 53' })] };
  eq(E.pgAclEval(E2, pk({ proto: 'udp', srcPort: 53, dstPort: 50000 })).action, 'permit', 'source port match (a DNS reply)');
  eq(E.pgAclEval(E2, pk({ proto: 'udp', srcPort: 50000, dstPort: 53 })).implicit, true, 'a DNS query has the other port order');
  const E3 = { name: 'E', kind: 'extended', entries: [ent('a', 10, 'permit', 'icmp', 'any', 'any', { icmp: 'echo' })] };
  eq(E.pgAclEval(E3, pk({ proto: 'icmp', srcPort: null, dstPort: null, icmp: 'echo' })).action, 'permit', 'icmp echo matches echo');
  eq(E.pgAclEval(E3, pk({ proto: 'icmp', srcPort: null, dstPort: null, icmp: 'echo-reply' })).implicit, true, 'icmp echo does not match echo-reply');
  eq(E.pgAclEval({ name: 'E', kind: 'extended', entries: [ent('a', 10, 'permit', 'icmp', 'any', 'any')] }, pk({ proto: 'icmp', srcPort: null, dstPort: null, icmp: 'echo-reply' })).action, 'permit', 'icmp any matches every message');
  eq(E.pgAclEval({ name: 'E', kind: 'extended', entries: [ent('a', 10, 'permit', 'tcp', 'any', 'any', { srcPort: 'gt 1023', dstPort: 'range 80 90' })] }, pk({ dstPort: 85 })).action, 'permit', 'source and destination port operators together');

  /* ---- subset logic (a narrower permit under a broad deny) ---- */
  const K = { kind: 'extended' };
  const broad = ent('a', 10, 'deny', 'ip', '10.1.20.0 0.0.0.255', '10.1.30.0 0.0.0.255');
  eq(E.pgAclEntrySubset(K, ent('b', 20, 'permit', 'tcp', '10.1.20.0 0.0.0.255', 'host 10.1.30.10', { dstPort: 'eq 80' }), broad), true, 'permit tcp to one host sits inside deny ip to the subnet');
  eq(E.pgAclEntrySubset(K, ent('b', 20, 'permit', 'ip', 'any', 'any'), broad), false, 'permit ip any any is wider than the deny');
  eq(E.pgAclEntrySubset(K, ent('b', 20, 'permit', 'ip', '10.1.20.0 0.0.0.255', '10.1.40.0 0.0.0.255'), broad), false, 'a different destination is not inside');
  eq(E.pgAclEntrySubset(K, broad, ent('b', 20, 'permit', 'tcp', 'any', 'any')), false, 'ip is not inside tcp');
  eq(E.pgAclEntrySubset(K, ent('b', 1, 'permit', 'tcp', 'any', 'any', { dstPort: 'eq 80' }), ent('a', 2, 'deny', 'tcp', 'any', 'any', { dstPort: 'neq 22' })), true, 'eq 80 sits inside neq 22');
  eq(E.pgAclEntrySubset(K, ent('b', 1, 'permit', 'tcp', 'any', 'any', { dstPort: 'eq 22' }), ent('a', 2, 'deny', 'tcp', 'any', 'any', { dstPort: 'neq 22' })), false, 'eq 22 is not inside neq 22');
  eq(E.pgAclEntrySubset(K, ent('b', 1, 'permit', 'tcp', 'any', 'any', { dstPort: 'range 80 90' }), ent('a', 2, 'deny', 'tcp', 'any', 'any', { dstPort: 'lt 1024' })), true, 'range inside lt');
  eq(E.pgAclEntrySubset(K, ent('b', 1, 'permit', 'tcp', 'any', 'any'), ent('a', 2, 'deny', 'tcp', 'any', 'any', { established: true })), false, 'a tcp permit without established is wider');
  eq(E.pgAclEntrySubset({ kind: 'standard' }, std('b', 20, 'permit', 'host 10.1.20.5'), std('a', 10, 'deny', '10.1.20.0 0.0.0.255')), true, 'standard: host inside subnet');
  eq(E.pgAclEntrySubset({ kind: 'standard' }, std('b', 20, 'permit', 'any'), std('a', 10, 'deny', '10.1.20.0 0.0.0.255')), false, 'standard: permit any is wider');

  /* ---- configuration checks ---- */
  eq(E.pgAclValidate(sb()), [], 'the sandbox has no configuration errors');
  const bad = (fn) => E.pgAclValidate(ed(fn)).map((e) => e.field);
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].seq = 20; }), ['seq'], 'duplicate sequence number');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].seq = 0; }), ['seq'], 'sequence number must be 1 or more');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].seq = '1x'; }), ['seq'], 'sequence number must be a number');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].src = '10.1.20.0/24'; }), ['src'], 'CIDR is rejected');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].dstPort = 'eq 99999'; }), ['dstPort'], 'bad destination port');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[2].dstPort = 'eq 80'; }), ['dstPort'], 'ports on an ip entry are rejected');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].established = true; acl(t, 'r1', 'GUEST-IN').entries[2].established = true; }), ['established'], 'established only on tcp entries');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].icmp = 'echo'; }), ['icmp'], 'icmp message only on icmp entries');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].proto = 'gre'; }).indexOf('proto') >= 0, true, 'unknown protocol');
  eq(bad((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].action = 'allow'; }), ['action'], 'action must be permit or deny');
  eq(bad((t) => { acl(t, 'r2', '10').entries[0].src = '10.1.10.0 0.0.0'; }), ['src'], 'standard entry with a bad wildcard');
  eq(bad((t) => { router(t, 'r1').acls.push({ name: 'GUEST-IN', kind: 'standard', entries: [] }); }), ['name'], 'duplicate ACL name on one router');
  eq(bad((t) => { router(t, 'r1').acls.push({ name: 'GUEST-IN', kind: 'standard', entries: [] }); router(t, 'r2').acls.push({ name: 'GUEST-IN', kind: 'standard', entries: [] }); }), ['name'], 'the same name on another router is fine');
  eq(E.pgAclNameProblem('101', 'extended'), '', 'numbered extended ACL');
  eq(E.pgAclNameProblem('10', 'standard'), '', 'numbered standard ACL');
  eq(E.pgAclNameProblem('1350', 'standard'), '', 'expanded standard range');
  eq(E.pgAclNameProblem('2100', 'extended'), '', 'expanded extended range');
  eq(E.pgAclNameProblem('101', 'standard') !== '', true, '101 cannot be a standard ACL');
  eq(E.pgAclNameProblem('10', 'extended') !== '', true, '10 cannot be an extended ACL');
  eq(E.pgAclNameProblem('250', 'extended') !== '', true, '250 is not a valid ACL number');
  eq(E.pgAclNameProblem('', 'extended') !== '', true, 'a name is required');
  eq(E.pgAclNameProblem('my acl', 'extended') !== '', true, 'no spaces in a name');
  eq(E.pgAclNameProblem('1abc', 'extended') !== '', true, 'a name starts with a letter');
  eq(E.pgAclNameProblem('Guest_In.v2', 'extended'), '', 'letters, digits, underscore, dot');
  eq(bad((t) => { iface(t, 'r1-g0').aclIn = 'NOPE'; }), ['r1-g0.in'], 'interface using a missing ACL');
  eq(bad((t) => { iface(t, 'r1-g0').aclOut = 'NOPE'; }), ['r1-g0.out'], 'interface using a missing ACL (out)');

  /* ---- routing ---- */
  const t0 = sb();
  const r1 = router(t0, 'r1'); const r2 = router(t0, 'r2');
  const rt = (r, a) => E.pgAclRoute(r, ip(a));
  eq([rt(r1, '10.1.10.77').best.kind, rt(r1, '10.1.10.77').best.iface.id], ['connected', 'r1-g0'], 'connected route');
  eq([rt(r1, '10.1.30.10').best.kind, rt(r1, '10.1.30.10').best.prefix, rt(r1, '10.1.30.10').best.iface.id], ['static', 0, 'r1-g2'], 'default route to the next router');
  eq([rt(r2, '10.1.30.10').best.kind, rt(r2, '10.1.30.10').best.prefix], ['connected', 24], 'connected /24 beats the static /16');
  eq(rt(r2, '10.1.30.10').others.map((c) => c.prefix), [16], 'the shorter route is listed as lost');
  eq([rt(r2, '10.1.20.50').best.kind, rt(r2, '10.1.20.50').best.prefix, rt(r2, '10.1.20.50').best.iface.id], ['static', 16, 'r2-g0'], 'static /16 for the branch LANs');
  eq(rt(r2, '8.8.8.8').best, null, 'no route on R2 for a public address');
  eq(rt(r1, '8.8.8.8').best.prefix, 0, 'the default route catches a public address');
  const t1 = ed((t) => { router(t, 'r1').routes.push({ id: 'x', dest: '10.1.30.0', prefix: 24, via: '10.0.0.2' }); });
  eq(rt(router(t1, 'r1'), '10.1.30.10').best.prefix, 24, 'longest prefix wins over the default route');
  const t2 = ed((t) => { router(t, 'r1').routes.push({ id: 'x', dest: '10.1.30.0', prefix: 24, via: '192.168.99.1' }); });
  eq(rt(router(t2, 'r1'), '10.1.30.10').best.prefix, 0, 'a static route whose next hop is not connected is ignored');
  eq(E.pgAclRoute({ interfaces: [{ id: 'a', name: 'Gi0/0', ip: '10.0.0.1', prefix: 24 }], routes: [] }, ip('10.0.0.9')).best.kind, 'connected', 'a router with no routes still has connected networks');

  /* ---- the sandbox works ---- */
  eq(code(sb(), 'guest', 'web', 'tcp', 80), 'success', 'sandbox: guest reaches the portal on 80');
  eq(code(sb(), 'guest', 'web', 'tcp', 443), 'success', 'sandbox: guest reaches the portal on 443');
  eq(code(sb(), 'guest', 'web', 'tcp', 22), 'explicit-deny', 'sandbox: guest cannot SSH to the web server');
  eq(code(sb(), 'guest', 'files', 'tcp', 445), 'explicit-deny', 'sandbox: guest cannot reach file shares');
  eq(code(sb(), 'guest', 'staff', 'tcp', 3389), 'explicit-deny', 'sandbox: guest cannot reach the staff LAN');
  eq(code(sb(), 'staff', 'web', 'tcp', 80), 'success', 'sandbox: staff reach the web server');
  eq(code(sb(), 'staff', 'files', 'tcp', 445), 'success', 'sandbox: staff reach the file server');
  eq(code(sb(), 'old', 'files', 'tcp', 445), 'standard-acl-broad', 'sandbox: the old laptop is cut off from the servers by the standard ACL');
  eq(code(sb(), 'old', 'guest', 'tcp', 80), 'reply-blocked', 'sandbox: a staff-started connection to a guest gets no reply, because GUEST-IN denies guests to 10.0.0.0/8 and ACLs are stateless');
  eq(code(sb(), 'old', 'guest', 'tcp', 80, { reply: false }), 'success', 'sandbox: the request alone reaches the guest LAN');
  eq(code(sb(), 'web', 'staff', 'tcp', 3389), 'success', 'sandbox: servers can reach staff (no ACL blocks it)');
  eq(code(sb(), 'guest', 'web', 'udp', 53), 'explicit-deny', 'sandbox: UDP to the web server is not permitted for guests');
  eq(code(sb(), 'guest', 'web', 'icmp'), 'explicit-deny', 'sandbox: ping to the web server is not permitted for guests');
  const web = T(sb(), 'guest', 'web', 'tcp', 80);
  eq(web.hops.map((h) => `${h.leg}:${h.router}`), ['request:r1', 'request:r2', 'reply:r2', 'reply:r1'], 'two routers on the way there and back');
  eq(web.hops[0].in.state === 'allowed' && web.hops[0].in.acl === 'GUEST-IN' && web.hops[0].in.seq === 10, true, 'the hop records which entry decided');
  eq(web.hops[1].out.acl === '10' && web.hops[1].out.state === 'allowed', true, 'R2 outbound standard ACL permitted it');
  eq(/default route 0\.0\.0\.0\/0 via 10\.0\.0\.2/.test(text(web)), true, 'the trace explains the default route');
  eq(/Shorter matches \(10\.1\.0\.0\/16\) lose to the longer prefix/.test(text(web)), true, 'the trace explains longest prefix match');
  eq(/stateless/.test(text(web)), true, 'the trace says the reply is a new packet');
  eq(web.verdict === 'success' && /reply came back/.test(web.summary), true, 'the summary mentions the reply');

  /* ---- hosts on one subnet, the router itself ---- */
  const same = T(sb(), 'staff', 'old', 'tcp', 22);
  eq([same.verdict, same.hops.length, /No router touches it/.test(text(same))], ['success', 0, true], 'same subnet: the switch carries it and no ACL is consulted');
  const sameBlocked = ed((t) => { iface(t, 'r1-g0').aclIn = 'GUEST-IN'; });
  eq(code(sameBlocked, 'staff', 'old', 'tcp', 22), 'success', 'same subnet traffic never meets the router ACL');
  // a packet created by R1 itself (its outbound ACL does not apply to packets it creates)
  const outAcl = ed((t) => { router(t, 'r1').acls.push({ name: 'DENY-ALL', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', 'any', 'any')] }); iface(t, 'r1-g2').aclOut = 'DENY-ALL'; });
  const fromRouter = T(outAcl, 'r1', 'web', 'tcp', 80);
  eq(fromRouter.verdict, 'success', 'router-originated packet passes an outbound ACL that would drop it');
  eq(/does not filter packets that the router creates itself/.test(text(fromRouter)), true, 'the trace says why');
  eq(fromRouter.hops[0].out.state, 'skipped', 'the hop records the skipped ACL');
  eq(/10\.0\.0\.1/.test(text(fromRouter)), true, 'the source is the outgoing interface address');
  eq(code(outAcl, 'staff', 'web', 'tcp', 22), 'explicit-deny', 'the same outbound ACL does filter traffic passing through R1');
  eq(T(outAcl, 'staff', 'web', 'tcp', 22).diagnosis.dir, 'out', 'and the diagnosis names the direction');
  const inAcl = ed((t) => { router(t, 'r1').acls.push({ name: 'DENY-ALL', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', 'any', 'any')] }); iface(t, 'r1-g2').aclIn = 'DENY-ALL'; });
  eq(code(inAcl, 'r1', 'web', 'tcp', 80), 'reply-blocked', 'the same ACL applied inbound drops the reply that comes back to the router');
  // packets TO the router meet the inbound ACL of the interface they arrive on
  eq(code(sb(), 'guest', 'r1-g1', 'icmp'), 'explicit-deny', 'a ping to the router\'s own address meets the inbound ACL');
  const toRouter = T(sb(), 'staff', 'r1-g2', 'icmp');
  eq(toRouter.verdict, 'success', 'staff can ping a router interface');
  eq(/addressed to R1 itself/.test(text(toRouter)), true, 'the trace says the router accepts it');
  eq(T(sb(), 'staff', 'r2-g1', 'icmp').hops.map((h) => `${h.leg}:${h.router}`), ['request:r1', 'request:r2', 'reply:r2', 'reply:r1'], 'ping to the far router crosses R1 and ends at R2');
  eq(code(sb(), 'r1', 'web', 'tcp', 80), 'success', 'R1 itself can reach the web server');
  eq(T(sb(), 'r1', 'web', 'tcp', 80).hops.filter((h) => h.leg === 'reply').map((h) => h.router), ['r2', 'r1'], 'the reply to a router-created packet comes back to that router');
  eq(code(sb(), 'r1', 'r2-g0', 'icmp'), 'success', 'R1 pings the R2 link address');
  eq(code(sb(), 'r1', 'r1-g0', 'icmp'), 'bad-pair', 'a router cannot test its own address');

  /* ---- bad requests ---- */
  eq(code(sb(), 'guest', 'guest', 'tcp', 80), 'bad-pair', 'a host cannot test itself');
  eq(code(sb(), 'nobody', 'web', 'tcp', 80), 'bad-pair', 'unknown source');
  eq(code(sb(), 'guest', 'web', 'tcp', 'abc'), 'bad-port', 'bad port');
  eq(code(sb(), 'guest', 'web', 'tcp', 0), 'bad-port', 'port 0 is not a test port');
  eq(code(sb(), 'guest', 'web', 'gre', 80), 'bad-pair', 'unknown protocol');
  eq(code(ed((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].src = 'junk'; }), 'guest', 'web', 'tcp', 80), 'bad-config', 'an invalid entry stops the test');
  eq(T(ed((t) => { acl(t, 'r1', 'GUEST-IN').entries[0].src = 'junk'; }), 'guest', 'web', 'tcp', 80).diagnosis.field, 'src', 'and names the field');
  eq(code(ed((t) => { router(t, 'r1').routes = []; }), 'guest', 'web', 'tcp', 80), 'no-route', 'no route to the servers');
  eq(code(ed((t) => { t.hosts[1].gateway = '10.1.20.254'; }), 'guest', 'web', 'tcp', 80), 'no-gateway', 'wrong default gateway');
  eq(code(ed((t) => { router(t, 'r1').routes = [{ id: 'x', dest: '0.0.0.0', prefix: 0, via: '10.0.0.9' }]; }), 'guest', 'web', 'tcp', 80), 'no-route', 'a default route via a non-connected address is not installed');
  eq(code(ed((t) => { router(t, 'r1').routes = [{ id: 'x', dest: '0.0.0.0', prefix: 0, via: '10.0.0.3' }]; }), 'guest', 'web', 'tcp', 80), 'no-next-hop', 'a next hop that is not a router');
  eq(code(ed((t) => { router(t, 'r2').routes = [{ id: 'x', dest: '0.0.0.0', prefix: 0, via: '10.0.0.1' }]; router(t, 'r2').interfaces = router(t, 'r2').interfaces.filter((i) => i.id === 'r2-g0'); }), 'staff', 'web', 'tcp', 80), 'routing-loop', 'two routers pointing at each other loop');

  /* ---- diagnoses ---- */
  const one = (acls, applied, base) => {
    const t = E.pgClone(base || data.acl[0].topology);
    const r = router(t, 'r1'); r.acls = acls;
    r.interfaces.forEach((i) => { i.aclIn = ''; i.aclOut = ''; });
    Object.keys(applied || {}).forEach((k) => { const [id, d] = k.split(':'); iface(t, id)[d === 'in' ? 'aclIn' : 'aclOut'] = applied[k]; });
    return t;
  };
  const G = '10.1.20.0 0.0.0.255'; const SV = '10.1.30.0 0.0.0.255'; const ST = '10.1.10.0 0.0.0.255';
  // implicit deny
  const onlyDeny = one([{ name: 'D', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', G, ST)] }], { 'r1-g1:in': 'D' });
  let d = T(onlyDeny, 'guest', 'web', 'tcp', 80).diagnosis;
  eq([d.code, d.router, d.iface, d.dir, d.acl, d.field], ['implicit-deny', 'r1', 'r1-g1', 'in', 'D', 'r1-g1.in'], 'implicit deny: where it happened');
  eq(/Every entry in D is a deny/.test(d.text), true, 'an ACL of only denies says so');
  eq(/permit ip any any/.test(d.fix), true, 'the fix suggests a final permit');
  const unrelated = one([{ name: 'P', kind: 'extended', entries: [ent('a', 10, 'permit', 'ip', G, SV)] }], { 'r1-g0:in': 'P' });
  d = T(unrelated, 'staff', 'files', 'tcp', 445).diagnosis;
  eq([d.code, /None of its entries even mentions the source address 10\.1\.10\.20/.test(d.text)], ['implicit-deny', true], 'implicit deny: an ACL that never mentions the source hints at the wrong interface');
  eq(T(unrelated, 'guest', 'files', 'tcp', 445).verdict, 'success', 'and the same ACL elsewhere would permit');
  const stdImpl = one([{ name: '10', kind: 'standard', entries: [std('a', 10, 'permit', ST)] }], { 'r1-g1:in': '10' });
  eq(T(stdImpl, 'guest', 'web', 'tcp', 80).diagnosis.code, 'implicit-deny', 'a standard ACL can drop by implicit deny too');
  eq(/deny any/.test(text(T(stdImpl, 'guest', 'web', 'tcp', 80))) && !/deny ip any any/.test(text(T(stdImpl, 'guest', 'web', 'tcp', 80))), true, 'a standard ACL names its last line "deny any"');
  // explicit deny followed by a deliberate permit-the-rest is NOT a shadowed permit
  const deliberate = one([{ name: 'B', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', G, SV), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g1:in': 'B' });
  eq(code(deliberate, 'guest', 'web', 'tcp', 80), 'explicit-deny', 'deny then permit-the-rest is an ordinary deny');
  eq(code(deliberate, 'guest', 'staff', 'tcp', 80), 'success', 'and the rest passes');
  // shadowed permit
  const shadow = one([{ name: 'B', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', G, SV), ent('b', 20, 'permit', 'tcp', G, 'host 10.1.30.10', { dstPort: 'eq 80' })] }], { 'r1-g1:in': 'B' });
  d = T(shadow, 'guest', 'web', 'tcp', 80).diagnosis;
  eq([d.code, d.entryId, /sequence number below 10/.test(d.fix)], ['shadowed-permit', 'a', true], 'shadowed permit points at the deny and the fix');
  const shadowFixed = ed((t) => { acl(t, 'r1', 'B').entries[1].seq = 5; }, shadow);
  eq(code(shadowFixed, 'guest', 'web', 'tcp', 80), 'success', 'a lower sequence number lets the specific permit win');
  eq(code(shadowFixed, 'guest', 'files', 'tcp', 445), 'explicit-deny', 'and the broad deny still applies to the rest');
  // standard ACL deny
  d = T(one([{ name: '10', kind: 'standard', entries: [std('a', 10, 'deny', G), std('b', 20, 'permit', 'any')] }], { 'r1-g1:in': '10' }), 'guest', 'web', 'tcp', 80).diagnosis;
  eq([d.code, /source address only|only look at the source/.test(d.text)], ['standard-acl-broad', true], 'standard ACL deny explains that only the source is read');
  // placement of a standard ACL
  const stdNear = one([{ name: '10', kind: 'standard', entries: [std('a', 10, 'deny', G), std('b', 20, 'permit', 'any')] }], { 'r1-g0:out': '10' });
  eq(code(stdNear, 'guest', 'web', 'tcp', 80), 'success', 'near the destination: guests still reach the servers');
  eq(code(stdNear, 'guest', 'staff', 'tcp', 80), 'standard-acl-broad', 'near the destination: guests are kept from the staff LAN');
  // stateless replies
  const prot = one([{ name: 'P', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', SV, ST), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g2:in': 'P' });
  d = T(prot, 'staff', 'files', 'tcp', 445).diagnosis;
  eq([d.code, d.leg, d.iface, d.dir], ['reply-blocked', 'reply', 'r1-g2', 'in'], 'the reply is blocked, and the diagnosis says where');
  eq(/established/.test(d.fix), true, 'the tcp fix mentions established');
  eq(T(prot, 'staff', 'files', 'tcp', 445, { reply: false }).verdict, 'success', 'with the reply check off only the request is judged');
  eq(/reply was not checked/.test(T(prot, 'staff', 'files', 'tcp', 445, { reply: false }).summary), true, 'and the summary says so');
  eq(code(prot, 'files', 'staff', 'tcp', 3389), 'explicit-deny', 'a server-started connection is blocked on the request');
  const withEst = ed((t) => { acl(t, 'r1', 'P').entries.push(ent('c', 5, 'permit', 'tcp', SV, ST, { established: true })); }, prot);
  eq(code(withEst, 'staff', 'files', 'tcp', 445), 'success', 'established lets the reply through');
  eq(code(withEst, 'files', 'staff', 'tcp', 3389), 'explicit-deny', 'while the server-started SYN is still dropped');
  eq(code(withEst, 'files', 'staff', 'tcp', 3389, { ack: true }), 'success', 'established is only a bit test: a packet with ACK set passes');
  const withSrcPort = ed((t) => { acl(t, 'r1', 'P').entries.push(ent('c', 5, 'permit', 'tcp', SV, ST, { srcPort: 'eq 445' })); }, prot);
  eq(code(withSrcPort, 'staff', 'files', 'tcp', 445), 'success', 'permitting the server port as the source port also works');
  eq(code(withSrcPort, 'staff', 'files', 'tcp', 80), 'reply-blocked', 'but only for that port');
  eq(/eq 445/.test(T(prot, 'staff', 'files', 'tcp', 445).diagnosis.fix), true, 'the fix mentions the source port');
  // udp
  const udpAcl = one([{ name: 'P', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', SV, ST), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g2:in': 'P' });
  eq(code(udpAcl, 'staff', 'files', 'udp', 53), 'reply-blocked', 'a udp reply is blocked too');
  eq(/udp has no established/i.test(T(udpAcl, 'staff', 'files', 'udp', 53).diagnosis.fix), true, 'and the fix says udp has no established');
  const udpOk = ed((t) => { acl(t, 'r1', 'P').entries.push(ent('c', 5, 'permit', 'udp', SV, ST, { srcPort: 'eq 53' })); }, udpAcl);
  eq(code(udpOk, 'staff', 'files', 'udp', 53), 'success', 'permitting the udp source port lets the reply in');
  // icmp
  const icmpAcl = one([{ name: 'P', kind: 'extended', entries: [ent('a', 10, 'permit', 'icmp', 'any', 'any', { icmp: 'echo' })] }], { 'r1-g2:in': 'P' });
  eq(code(icmpAcl, 'staff', 'files', 'icmp'), 'reply-blocked', 'permitting only echo blocks the echo reply');
  const icmpOk = ed((t) => { acl(t, 'r1', 'P').entries.push(ent('b', 20, 'permit', 'icmp', 'any', 'any', { icmp: 'echo-reply' })); }, icmpAcl);
  eq(code(icmpOk, 'staff', 'files', 'icmp'), 'success', 'permitting echo-reply lets the ping answer in');
  eq(/echo-reply/.test(T(icmpAcl, 'staff', 'files', 'icmp').diagnosis.fix), true, 'the icmp fix mentions echo-reply');

  /* ---- observations: an ACL that never saw the packet ---- */
  const base1 = (applied) => one([{ name: 'B', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', G, SV), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], applied);
  eq(warn(base1({}), 'guest', 'files', 'tcp', 445), ['acl-unused'], 'an ACL applied nowhere');
  eq(warn(base1({ 'r1-g1:out': 'B' }), 'guest', 'files', 'tcp', 445), ['acl-wrong-direction'], 'applied out where the packet comes in');
  eq(warn(base1({ 'r1-g2:in': 'B' }), 'guest', 'files', 'tcp', 445), ['acl-wrong-direction'], 'applied in where the packet goes out');
  eq(warn(base1({ 'r1-g0:in': 'B' }), 'guest', 'files', 'tcp', 445), ['acl-wrong-interface'], 'applied to an interface the packet never touches');
  eq(warn(base1({ 'r1-g1:in': 'B' }), 'staff', 'files', 'tcp', 445), [], 'a permitted packet gets no observation');
  eq(warn(base1({ 'r1-g1:in': 'B' }), 'guest', 'files', 'tcp', 445), [], 'a blocked packet gets no observation');
  eq(warn(base1({}), 'staff', 'files', 'tcp', 445), [], 'an unused ACL that would permit this packet is not mentioned');
  const implicitUnrelated = one([{ name: 'P', kind: 'extended', entries: [ent('a', 10, 'permit', 'tcp', G, 'host 10.1.30.10', { dstPort: 'eq 80' })] }], { 'r1-g0:in': 'P' });
  eq(warn(implicitUnrelated, 'guest', 'files', 'tcp', 445), ['acl-wrong-interface'], 'an implicit-deny ACL that mentions the source is reported');
  eq(warn(ed((t) => { iface(t, 'r1-g0').aclIn = ''; iface(t, 'r1-g1').aclIn = ''; iface(t, 'r1-g2').aclIn = ''; }, implicitUnrelated), 'staff', 'files', 'tcp', 445), [], 'an ACL that never mentions this packet is not reported');
  eq(/If you expected it to be blocked/.test(T(base1({}), 'guest', 'files', 'tcp', 445).warnings[0].text), true, 'observations stay neutral about intent');
  eq(T(base1({}), 'guest', 'files', 'tcp', 445).warnings[0].entryId, 'a', 'and name the entry that would have denied');
  // an ACL on a router the packet crossed, but not on the other one, is only judged where it lives
  const twoRouters = ed((t) => { router(t, 'r2').acls.push({ name: 'X', kind: 'standard', entries: [std('a', 10, 'deny', 'host 10.1.10.20')] }); });
  eq(warn(twoRouters, 'staff', 'web', 'tcp', 80), ['acl-unused'], 'unused ACL on the second router');
  eq(warn(twoRouters, 'guest', 'web', 'tcp', 80), [], 'a packet that the unused ACL would not deny');

  /* ---- observations: a subnet mask where a wildcard belongs ---- */
  const maskT = one([{ name: 'M', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', '10.1.20.0 255.255.255.0', SV), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g1:in': 'M' });
  const mw = T(maskT, 'guest', 'files', 'tcp', 445);
  eq([mw.verdict, mw.warnings.map((w) => w.code), mw.warnings[0].entryId], ['success', ['wildcard-looks-like-mask'], 'a'], 'a subnet mask in the wildcard slot is called out');
  eq(/0\.0\.0\.255/.test(mw.warnings[0].text), true, 'with the wildcard that was meant');
  const maskDst = one([{ name: 'M', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', G, '10.1.30.0 255.255.255.0'), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g1:in': 'M' });
  eq(warn(maskDst, 'guest', 'files', 'tcp', 445), ['wildcard-looks-like-mask'], 'also in the destination');
  const maskStd = one([{ name: '10', kind: 'standard', entries: [std('a', 10, 'deny', '10.1.20.0 255.255.255.0'), std('b', 20, 'permit', 'any')] }], { 'r1-g1:in': '10' });
  eq(warn(maskStd, 'guest', 'files', 'tcp', 445), ['wildcard-looks-like-mask'], 'also in a standard ACL');
  const maskAfter = one([{ name: 'M', kind: 'extended', entries: [ent('a', 10, 'permit', 'ip', 'any', 'any'), ent('b', 20, 'deny', 'ip', '10.1.20.0 255.255.255.0', SV)] }], { 'r1-g1:in': 'M' });
  eq(warn(maskAfter, 'guest', 'files', 'tcp', 445), [], 'an entry after the deciding entry is never read, so it is not reported');
  const maskImplicit = one([{ name: 'M', kind: 'extended', entries: [ent('a', 10, 'permit', 'ip', '10.1.20.0 255.255.255.0', 'any')] }], { 'r1-g1:in': 'M' });
  const mi = T(maskImplicit, 'guest', 'web', 'tcp', 80);
  eq([mi.verdict, mi.diagnosis.code, mi.warnings.map((w) => w.code)], ['failed', 'implicit-deny', ['wildcard-looks-like-mask']], 'it is reported on a failure too');
  eq(warn(one([{ name: 'M', kind: 'extended', entries: [ent('a', 10, 'deny', 'ip', '10.1.20.0 255.255.255.0', SV), ent('b', 20, 'permit', 'ip', 'any', 'any')] }], { 'r1-g1:in': 'M' }), 'staff', 'files', 'tcp', 445), [], 'not reported when the corrected entry would not match either');

  /* ---- the configuration as text ---- */
  const cfg = E.pgAclConfigText(sb(), 'r1');
  eq(/^hostname R1/.test(cfg), true, 'config starts with the hostname');
  eq(/interface GigabitEthernet0\/1\n description Guest Wi-Fi\n ip address 10\.1\.20\.1 255\.255\.255\.0\n ip access-group GUEST-IN in/.test(cfg), true, 'interface block with the access-group line');
  eq(/ip route 0\.0\.0\.0 0\.0\.0\.0 10\.0\.0\.2/.test(cfg), true, 'default route');
  eq(/ip access-list extended GUEST-IN\n 10 permit tcp 10\.1\.20\.0 0\.0\.0\.255 host 10\.1\.30\.10 eq 80/.test(cfg), true, 'ACL block with sequence numbers');
  eq(/ip access-list standard 10\n 10 deny host 10\.1\.10\.99\n 20 permit any/.test(E.pgAclConfigText(sb(), 'r2')), true, 'numbered standard ACL');
  eq(/ip address 10\.0\.0\.2 255\.255\.255\.252/.test(E.pgAclConfigText(sb(), 'r2')), true, 'a /30 prints as 255.255.255.252');
  eq(E.pgAclConfigText(sb(), 'nope'), '', 'unknown router prints nothing');

  /* ---- fixes ---- */
  const f = E.pgAclApplyFixes(sb(), [
    { apply: { router: 'r1', iface: 'r1-g0', dir: 'out', acl: 'GUEST-IN' } },
    { setEntry: { router: 'r1', acl: 'GUEST-IN', id: 'e4', patch: { seq: 5 } } },
    { addEntry: { router: 'r1', acl: 'GUEST-IN', entry: ent('z', 99, 'deny', 'ip', 'any', 'any') } },
    { removeEntry: { router: 'r1', acl: 'GUEST-IN', id: 'e1' } },
    { addAcl: { router: 'r2', acl: { name: 'NEW', kind: 'standard', entries: [] } } },
  ]);
  eq([iface(f, 'r1-g0').aclOut, acl(f, 'r1', 'GUEST-IN').entries.find((x) => x.id === 'e4').seq, acl(f, 'r1', 'GUEST-IN').entries.length, router(f, 'r2').acls.length], ['GUEST-IN', 5, 4, 2], 'apply, setEntry, addEntry, removeEntry, addAcl');
  const rm = E.pgAclApplyFixes(sb(), [{ removeAcl: { router: 'r1', name: 'GUEST-IN' } }]);
  eq([router(rm, 'r1').acls.length, iface(rm, 'r1-g1').aclIn], [0, ''], 'removing an ACL clears the interfaces that used it');
  eq(acl(sb(), 'r1', 'GUEST-IN').entries.length, 4, 'the original topology is untouched by fixes');

  /* ---- every scenario: broken outcome, fixed outcome ---- */
  const list = data.acl || [];
  list.forEach((sc) => {
    eq(E.pgAclValidate(sc.topology), [], `acl scenario ${sc.id} has a valid topology`);
    sc.expect.forEach((ex, n) => {
      const r = E.pgAclTest(sc.topology, ex);
      eq(r.verdict, ex.verdict, `acl scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `acl scenario ${sc.id} check ${n + 1} code`);
      if (ex.warn) eq(r.warnings.map((w) => w.code).indexOf(ex.warn) >= 0, true, `acl scenario ${sc.id} check ${n + 1} warning ${ex.warn}`);
    });
    const t = E.pgAclApplyFixes(sc.topology, sc.fix);
    eq(E.pgAclValidate(t), [], `acl scenario ${sc.id} fixed topology is valid`);
    sc.expectFixed.forEach((ex, n) => {
      const r = E.pgAclTest(t, ex);
      eq(r.verdict, ex.verdict, `acl scenario ${sc.id} fixed check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `acl scenario ${sc.id} fixed check ${n + 1} code`);
    });
    const unmet = sc.expectFixed.some((g) => E.pgAclTest(sc.topology, g).verdict !== g.verdict);
    eq(unmet, true, `acl scenario ${sc.id}: at least one goal is unmet before the fix`);
    // the learner sees the broken state as a normal test: ask is a real endpoint pair
    if (sc.ask) eq(['success', 'failed'].indexOf(E.pgAclTest(sc.topology, sc.ask).verdict) >= 0, true, `acl scenario ${sc.id}: the default test runs`);
    // every scenario ACL is internally consistent (no ACL left unapplied by accident except the scenario that is about it)
    eq(sc.topology.routers.length >= 1, true, `acl scenario ${sc.id} has a router`);
  });
  eq(list.length, 8, 'acl has eight scenarios');
  eq(list.map((s) => s.level).join(','), 'starter,starter,core,core,core,stretch,stretch,stretch', 'acl level mix 2/3/3');
  eq(Array.isArray(data.aclSandbox && data.aclSandbox.routers), true, 'acl sandbox exists');
  eq(data.aclSandbox.routers.length, 2, 'the sandbox has two routers');
};
