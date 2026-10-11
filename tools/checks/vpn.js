/* Engine tests and scenario replay for the site-to-site VPN lab (src/js/03c_pg_vpn.js). */
module.exports = ({ E, eq, data }) => {
  const base = () => E.pgClone(data.vpnSandbox);
  const edit = (fn) => { const t = base(); fn(t.sites[0], t.sites[1], t); return t; };
  const test = (t, from, to) => E.pgVpnTest(t, { from, to });
  const code = (t, from = 'pc-a', to = 'pc-b') => { const r = test(t, from, to); return r.diagnosis ? r.diagnosis.code : r.verdict; };
  const states = (t, from = 'pc-a', to = 'pc-b') => test(t, from, to).stages.map((s) => s.state);
  const text = (t, from = 'pc-a', to = 'pc-b') => test(t, from, to).steps.map((s) => s.text).join(' ');

  /* ---- addressing helpers ---- */
  eq(E.pgVpnCidr('10.2.0.0/24').text, '10.2.0.0/24', 'cidr text');
  eq(E.pgVpnCidr('10.2.0.77/24').text, '10.2.0.0/24', 'cidr is normalised to the network');
  eq(E.pgVpnCidr('10.2.0.1').text, '10.2.0.1/32', 'bare address is a /32');
  eq(E.pgVpnCidr('10.2.0.0/33'), null, 'prefix 33 rejected');
  eq(E.pgVpnCidr('nope'), null, 'junk rejected');
  eq(E.pgVpnCidrList('10.1.0.0/24, 10.1.1.0/24').length, 2, 'cidr list');
  eq(E.pgVpnCidrList(''), [], 'empty cidr list');
  eq(E.pgVpnCidrList('10.1.0.0/24, x'), null, 'bad part rejects the list');
  eq(E.pgVpnInCidr(E.pgVpnCidr('10.1.0.0/24'), E.pgParseIPv4('10.1.0.50')), true, 'host in cidr');
  eq(E.pgVpnInCidr(E.pgVpnCidr('10.1.0.0/24'), E.pgParseIPv4('10.1.1.50')), false, 'host outside cidr');
  eq(E.pgVpnInCidr(E.pgVpnCidr('0.0.0.0/0'), E.pgParseIPv4('8.8.8.8')), true, 'default prefix covers everything');

  /* ---- the sandbox works, both directions, both LANs ---- */
  const sb = base();
  eq(E.pgVpnValidate(sb), [], 'sandbox has no config errors');
  eq(test(sb, 'pc-a', 'pc-b').verdict, 'success', 'sandbox: PC-A to PC-B');
  eq(test(sb, 'srv-a', 'pc-b').verdict, 'success', 'sandbox: Server-A to PC-B');
  eq(test(sb, 'pc-b', 'pc-a').verdict, 'success', 'sandbox: PC-B to PC-A');
  eq(test(sb, 'pc-b', 'srv-a').verdict, 'success', 'sandbox: PC-B to Server-A');
  eq(test(sb, 'pc-a', 'srv-a').verdict, 'success', 'same site never uses the tunnel');
  eq(/not involved/.test(test(sb, 'pc-a', 'srv-a').summary), true, 'same-site summary says so');
  eq(states(sb), ['ok', 'ok', 'ok', 'ok'], 'all four stages ok');
  eq(test(sb, 'nobody', 'pc-b').verdict, 'failed', 'unknown host fails softly');

  /* ---- reach the peer ---- */
  eq(code(edit((a) => { a.peerIp = '203.0.113.99'; })), 'wrong-peer-address', 'wrong peer address');
  eq(test(edit((a) => { a.peerIp = '203.0.113.99'; }), 'pc-a', 'pc-b').diagnosis.deviceId, 'a', 'wrong peer points at the site that has it');
  eq(code(edit((a, b) => { b.peerIp = '9.9.9.9'; })), 'wrong-peer-address', 'wrong peer address on the other end');
  eq(code(edit((a, b) => { b.fw.udp500 = false; })), 'firewall-blocks-ike', 'udp 500 blocked at branch');
  eq(states(edit((a, b) => { b.fw.udp500 = false; })), ['fail', 'skip', 'skip', 'fail'], 'stages after a firewall failure');
  eq(code(edit((a) => { a.fw.udp500 = false; })), 'firewall-blocks-ike', 'udp 500 blocked at head office');
  eq(code(edit((a, b) => { b.fw.udp500 = false; b.fw.esp = false; })), 'firewall-blocks-ike', 'ike blocked is reported before esp');
  // NAT in the path
  const natted = (fn) => edit((a, b) => { b.behindNat = true; if (fn) fn(a, b); });
  eq(code(natted()), 'success', 'nat in the path works when 4500 and NAT-T are on');
  eq(code(natted((a, b) => { b.fw.udp4500 = false; })), 'firewall-blocks-ike', 'udp 4500 blocked with NAT');
  eq(/4500/.test(test(natted((a, b) => { b.fw.udp4500 = false; }), 'pc-a', 'pc-b').diagnosis.title), true, 'message names UDP 4500');
  eq(code(natted((a) => { a.fw.udp4500 = false; })), 'firewall-blocks-ike', 'udp 4500 blocked at the other end too');
  eq(code(natted((a, b) => { b.natT = false; })), 'nat-t-disabled', 'NAT-T off behind NAT');
  eq(code(natted((a) => { a.natT = false; })), 'nat-t-disabled', 'NAT-T off at the far end');
  eq(code(edit((a, b) => { b.natT = false; })), 'success', 'NAT-T off does not matter without NAT');
  eq(code(natted((a, b) => { a.fw.esp = false; b.fw.esp = false; })), 'success', 'ESP rule not needed when ESP rides in UDP 4500');
  eq(code(edit((a, b) => { b.fw.udp4500 = false; a.fw.udp4500 = false; })), 'success', 'UDP 4500 not needed without NAT');

  /* ---- phase 1 ---- */
  eq(code(edit((a, b) => { b.ike.version = 'ikev1'; })), 'ike-version-mismatch', 'ikev1 against ikev2');
  eq(code(edit((a, b) => { a.ike.version = 'ikev1'; b.ike.version = 'ikev1'; })), 'success', 'both ikev1 works');
  eq(code(edit((a, b) => { b.ike.enc = 'aes128'; })), 'proposal-mismatch', 'encryption mismatch');
  eq(code(edit((a, b) => { b.ike.hash = 'sha1'; })), 'proposal-mismatch', 'hash mismatch');
  eq(code(edit((a, b) => { b.ike.dh = 2; })), 'proposal-mismatch', 'dh mismatch');
  eq(/integrity/.test(test(edit((a, b) => { b.ike.hash = 'sha1'; b.ike.dh = 2; }), 'pc-a', 'pc-b').diagnosis.text), true, 'proposal message lists the hash difference');
  eq(/DH group/.test(test(edit((a, b) => { b.ike.hash = 'sha1'; b.ike.dh = 2; }), 'pc-a', 'pc-b').diagnosis.text), true, 'proposal message lists the DH group');
  eq(code(edit((a, b) => { b.ike.psk = 'maple-harbor-42'; })), 'psk-mismatch', 'psk is case sensitive');
  eq(code(edit((a, b) => { b.ike.psk = 'Maple-Harbor-42 '; })), 'psk-mismatch', 'a trailing space counts');
  eq(code(edit((a, b) => { b.ike.version = 'ikev1'; b.ike.psk = 'x'; })), 'ike-version-mismatch', 'version is checked before the proposal and key');
  eq(code(edit((a, b) => { b.ike.enc = '3des'; b.ike.psk = 'x'; })), 'proposal-mismatch', 'proposal is checked before the key');
  eq(states(edit((a, b) => { b.ike.psk = 'x'; })), ['ok', 'fail', 'skip', 'fail'], 'stages after a psk failure');
  eq(code(edit((a, b) => { b.ike.lifetime = 3600; })), 'success', 'phase 1 lifetime mismatch is not a failure');
  eq(/lifetimes differ/.test(text(edit((a, b) => { b.ike.lifetime = 3600; }))), true, 'lifetime difference is mentioned');

  /* ---- phase 2 ---- */
  eq(code(edit((a, b) => { b.child.enc = 'aes128'; })), 'esp-proposal-mismatch', 'esp encryption mismatch');
  eq(code(edit((a, b) => { b.child.hash = 'sha384'; })), 'esp-proposal-mismatch', 'esp integrity mismatch');
  eq(code(edit((a, b) => { b.child.pfs = 'none'; })), 'pfs-mismatch', 'pfs on one end only');
  eq(code(edit((a, b) => { b.child.pfs = 20; })), 'pfs-mismatch', 'different pfs groups');
  eq(code(edit((a, b) => { a.child.pfs = 'none'; b.child.pfs = 'none'; })), 'success', 'no pfs on both ends works');
  eq(code(edit((a, b) => { b.child.pfs = '14'; })), 'success', 'pfs group as text equals the number');
  eq(states(edit((a, b) => { b.child.pfs = 'none'; })), ['ok', 'ok', 'fail', 'fail'], 'phase 1 up, phase 2 down');
  eq(/first rekey/.test(test(edit((a, b) => { b.child.pfs = 'none'; }), 'pc-a', 'pc-b').diagnosis.text), true, 'ikev2 pfs caveat is mentioned');
  eq(code(edit((a, b) => { b.child.lifetime = 7200; })), 'success', 'phase 2 lifetime mismatch is not a failure');
  eq(code(edit((a, b) => { b.child.enc = 'aes128'; b.child.pfs = 'none'; })), 'esp-proposal-mismatch', 'esp proposal before pfs');
  eq(code(edit((a, b) => { b.child.pfs = 'none'; b.selectors = []; })), 'pfs-mismatch', 'pfs before selectors');

  /* ---- selectors ---- */
  eq(code(edit((a, b) => { b.selectors = []; })), 'selector-mismatch', 'no selectors on one end');
  eq(states(edit((a, b) => { b.selectors = []; })), ['ok', 'ok', 'fail', 'fail'], 'phase 2 fails with no selector pair');
  eq(code(edit((a, b) => { b.selectors = [{ id: 'x', local: '10.2.0.0/24', remote: '10.1.0.0/16' }, { id: 'y', local: '10.2.0.0/24', remote: '10.1.1.0/25' }]; })), 'selector-mismatch', 'selectors that are not exact mirrors');
  eq(code(edit((a, b) => { b.selectors = [{ id: 'x', local: '10.1.0.0/24', remote: '10.2.0.0/24' }, { id: 'y', local: '10.1.1.0/24', remote: '10.2.0.0/24' }]; })), 'selector-mismatch', 'selectors copied instead of mirrored');
  const partial = edit((a, b) => { b.selectors = [b.selectors[0]]; });
  eq(test(partial, 'pc-a', 'pc-b').verdict, 'success', 'partial selectors: the matched LAN works');
  eq(states(partial), ['ok', 'ok', 'partial', 'ok'], 'partial selectors: phase 2 is partial');
  eq(code(partial, 'srv-a', 'pc-b'), 'selector-mismatch', 'partial selectors: the unmatched LAN fails');
  eq(code(partial, 'pc-b', 'srv-a'), 'selector-mismatch', 'partial selectors: the reverse direction fails too');
  eq(/no mirror image/.test(text(partial)), true, 'partial selectors are explained');
  eq(E.pgVpnPairs(partial.sites[0], partial.sites[1]).length, 1, 'pairs: one agreed');
  eq(E.pgVpnPairs(sb.sites[0], sb.sites[1]).length, 2, 'pairs: two agreed in the sandbox');
  const wide = edit((a, b) => { a.selectors = [{ id: 'w', local: '10.1.0.0/16', remote: '10.2.0.0/24' }]; b.selectors = [{ id: 'v', local: '10.2.0.0/24', remote: '10.1.0.0/16' }]; });
  eq(test(wide, 'pc-a', 'pc-b').verdict, 'success', 'a wider matching selector pair covers both LANs');
  eq(test(wide, 'srv-a', 'pc-b').verdict, 'success', 'wide selector covers the second LAN');
  eq(code(edit((a, b) => { b.selectors[0].local = '10.2.0.5/24'; })), 'success', 'selectors are compared as networks');

  /* ---- route into the tunnel ---- */
  eq(code(edit((a) => { a.routes = []; })), 'no-route-to-tunnel', 'no route at head office');
  eq(states(edit((a) => { a.routes = []; })), ['ok', 'ok', 'ok', 'fail'], 'tunnel up but the test fails');
  eq(test(edit((a) => { a.routes = []; }), 'pc-a', 'pc-b').diagnosis.deviceId, 'a', 'route failure points at the site');
  eq(code(edit((a) => { a.routes = [{ id: 'r', dest: '10.9.0.0/24' }]; })), 'no-route-to-tunnel', 'route for the wrong network');
  eq(code(edit((a) => { a.routes = [{ id: 'r', dest: '10.0.0.0/8' }]; })), 'success', 'a broader route also catches it');
  eq(code(edit((a, b) => { b.routes = []; })), 'no-route-to-tunnel', 'missing route on the return path');
  eq(test(edit((a, b) => { b.routes = []; }), 'pc-a', 'pc-b').diagnosis.deviceId, 'b', 'return-path route failure points at the branch');
  eq(/reply/.test(text(edit((a, b) => { b.routes = []; }))), true, 'return path is explained');
  eq(code(edit((a, b) => { b.routes = []; }), 'pc-b', 'pc-a'), 'no-route-to-tunnel', 'no route when the branch starts');
  eq(code(edit((a) => { a.mode = 'policy'; a.routes = []; })), 'success', 'policy mode needs no route');
  eq(code(edit((a, b) => { a.mode = 'policy'; b.mode = 'policy'; a.routes = []; b.routes = []; })), 'success', 'policy mode on both ends');
  eq(code(edit((a) => { a.mode = 'policy'; a.selectors = []; })), 'selector-mismatch', 'policy mode without a selector');
  eq(code(edit((a) => { a.mode = 'policy'; a.selectors = [a.selectors[1]]; })), 'selector-mismatch', 'policy mode with a selector for another LAN only');

  /* ---- NAT exemption ---- */
  eq(code(edit((a) => { a.natExempt = ''; })), 'nat-not-exempt', 'no NAT exemption at head office');
  eq(code(edit((a, b) => { b.natExempt = ''; })), 'nat-not-exempt', 'no NAT exemption on the return path');
  eq(test(edit((a, b) => { b.natExempt = ''; }), 'pc-a', 'pc-b').diagnosis.deviceId, 'b', 'NAT failure points at the branch');
  eq(code(edit((a) => { a.natExempt = '10.2.0.0/16'; })), 'success', 'a broader exemption covers it');
  eq(code(edit((a) => { a.natExempt = '10.9.0.0/24'; })), 'nat-not-exempt', 'exemption for another network');
  eq(code(edit((a, b) => { b.natExempt = '10.1.0.0/24'; })), 'success', 'branch only needs to exempt the pc-a network for pc-a');
  eq(code(edit((a, b) => { b.natExempt = '10.1.0.0/24'; }), 'pc-b', 'srv-a'), 'nat-not-exempt', 'exemption must cover the second LAN');
  eq(code(edit((a, b) => { a.snat = false; a.natExempt = ''; b.snat = false; b.natExempt = ''; })), 'success', 'no source NAT at all needs no exemption');

  /* ---- ESP through the firewall: the classic "tunnel up, nothing passes" ---- */
  eq(code(edit((a, b) => { b.fw.esp = false; })), 'firewall-blocks-esp', 'ESP blocked at the branch');
  eq(states(edit((a, b) => { b.fw.esp = false; })), ['ok', 'ok', 'ok', 'fail'], 'ESP blocked: phases up, traffic fails');
  eq(code(edit((a) => { a.fw.esp = false; })), 'firewall-blocks-esp', 'ESP blocked at head office is hit by the reply');
  eq(/reply/.test(text(edit((a) => { a.fw.esp = false; }))), true, 'ESP reply drop is explained');
  eq(code(edit((a, b) => { b.fw.udp500 = false; b.fw.esp = false; })), 'firewall-blocks-ike', 'two firewall faults: IKE first');
  eq(code(edit((a, b) => { b.fw.udp500 = true; b.fw.esp = false; b.fw.udp4500 = false; })), 'firewall-blocks-esp', 'after allowing IKE the ESP problem appears');

  /* ---- ordering: the first failure is named ---- */
  eq(code(edit((a, b) => { b.ike.psk = 'x'; a.routes = []; a.natExempt = ''; })), 'psk-mismatch', 'tunnel problems come before traffic problems');
  eq(code(edit((a) => { a.routes = []; a.natExempt = ''; })), 'no-route-to-tunnel', 'route before NAT');
  eq(code(edit((a) => { a.natExempt = ''; a.fw.esp = false; })), 'nat-not-exempt', 'NAT before ESP');

  /* ---- validation ---- */
  eq(code(edit((a) => { a.gwPublic = '203.0.113.300'; })), 'bad-config', 'invalid gateway address');
  eq(code(edit((a, b) => { b.selectors[0].remote = '10.1.0.0'; })), 'bad-config', 'selector without a prefix');
  eq(code(edit((a) => { a.subnets[0].host.ip = '10.9.9.9'; })), 'bad-config', 'host outside its subnet');
  eq(code(edit((a, b) => { b.ike.psk = ''; })), 'bad-config', 'empty psk');
  eq(code(edit((a, b) => { b.ike.lifetime = 5; })), 'bad-config', 'lifetime too small');
  eq(code(edit((a) => { a.natExempt = 'nonsense'; })), 'bad-config', 'bad nat exemption list');
  eq(E.pgVpnValidate(edit((a) => { a.routes[0].dest = 'x'; })).map((e) => e.field), ['route.a-r1.dest'], 'route error field path');

  /* ---- comparison table and fixes ---- */
  eq(E.pgVpnCompare(sb).every((r) => r.state === 'ok'), true, 'sandbox compare is all ok');
  eq(E.pgVpnCompare(edit((a, b) => { b.ike.dh = 2; b.ike.lifetime = 1; })).filter((r) => r.state !== 'ok').map((r) => r.label), ['Phase 1 DH group', 'Phase 1 lifetime (s)'], 'compare marks mismatches and info rows');
  eq(E.pgVpnCompare(edit((a, b) => { b.ike.psk = 'x'; })).find((r) => r.label === 'Pre-shared key').state, 'bad', 'compare psk');
  const f = E.pgVpnApplyFixes(base(), [{ site: 'b', path: 'ike.psk', value: 'zzz' }, { site: 'a', addRoute: { id: 'q', dest: '10.9.0.0/24' } }, { site: 'both', path: 'child.lifetime', value: 100 }]);
  eq([f.sites[1].ike.psk, f.sites[0].routes.length, f.sites[0].child.lifetime, f.sites[1].child.lifetime, base().sites[1].ike.psk], ['zzz', 2, 100, 100, 'Maple-Harbor-42'], 'apply fixes (and the original is untouched)');

  /* ---- every scenario: broken outcome, fixed outcome ---- */
  (data.vpn || []).forEach((sc) => {
    eq(E.pgVpnValidate(sc.topology), [], `vpn scenario ${sc.id} has a readable topology`);
    sc.expect.forEach((ex, n) => {
      const r = E.pgVpnTest(sc.topology, ex);
      eq(r.verdict, ex.verdict, `vpn scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `vpn scenario ${sc.id} check ${n + 1} code`);
    });
    const t = E.pgVpnApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((ex, n) => eq(E.pgVpnTest(t, ex).verdict, ex.verdict, `vpn scenario ${sc.id} fixed check ${n + 1}`));
    eq(sc.expect.some((e) => e.verdict === 'failed'), true, `vpn scenario ${sc.id} is genuinely broken`);
  });
  eq((data.vpn || []).length >= 6, true, 'vpn has at least six scenarios');
  eq(Array.isArray(data.vpnSandbox && data.vpnSandbox.sites), true, 'vpn sandbox exists');
};
