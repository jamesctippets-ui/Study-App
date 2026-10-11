/* Engine tests and scenario replay for the Azure NSG tester (src/js/03c_pg_nsg.js). */
module.exports = ({ E, eq, data }) => {
  const base = () => E.pgClone(data.nsgSandbox);
  const ed = (fn) => { const t = base(); fn(t); return t; };
  const nsg = (t, id) => t.nsgs.find((n) => n.id === id);
  const rule = (id, name, priority, source, destPort, proto, action, dest = '*', srcPort = '*') => ({ id, name, priority, source, srcPort, dest, destPort, proto, action });
  const T = (t, from, to, port, proto = 'Tcp') => E.pgNsgTest(t, { from, to, proto, port });
  const code = (t, from, to, port, proto) => { const r = T(t, from, to, port, proto); return r.diagnosis ? r.diagnosis.code : r.verdict; };
  const warn = (t, from, to, port, proto) => T(t, from, to, port, proto).warnings.map((w) => w.code);
  const ip = (s) => E.pgParseIPv4(s);

  /* ---- parsing ---- */
  eq(E.pgNsgParseAddr('*').kind, 'any', 'star is any');
  eq(E.pgNsgParseAddr('Any').kind, 'any', 'Any is any');
  eq(E.pgNsgParseAddr('internet').tag, 'Internet', 'tags are case-insensitive');
  eq(E.pgNsgParseAddr('10.0.0.0/24, 10.1.0.5').list.length, 2, 'comma list of addresses');
  eq(E.pgNsgParseAddr('Internet, VirtualNetwork'), null, 'two tags cannot be combined');
  eq(E.pgNsgParseAddr('Internet, 10.0.0.0/24'), null, 'a tag cannot be mixed with addresses');
  eq(E.pgNsgParseAddr('10.0.0.0/33'), null, 'bad prefix');
  eq(E.pgNsgParseAddr(''), null, 'empty is invalid');
  eq(E.pgNsgParsePorts('*').any, true, 'star ports');
  eq(E.pgNsgParsePorts('80, 10000-10005').ranges, [[80, 80], [10000, 10005]], 'port list and range');
  eq(E.pgNsgParsePorts('0'), null, 'port 0 invalid');
  eq(E.pgNsgParsePorts('70000'), null, 'port too big');
  eq(E.pgNsgParsePorts('90-80'), null, 'reversed range');
  eq(E.pgNsgPortMatch(E.pgNsgParsePorts('80, 10000-10005'), 10003), true, 'port in range');
  eq(E.pgNsgPortMatch(E.pgNsgParsePorts('80, 10000-10005'), 81), false, 'port outside');

  /* ---- service tags ---- */
  const t0 = base();
  const m = (spec, a) => E.pgNsgAddrMatch(t0, E.pgNsgParseAddr(spec), ip(a));
  eq(m('VirtualNetwork', '10.0.1.4'), true, 'VirtualNetwork covers the VNet space');
  eq(m('VirtualNetwork', '203.0.113.50'), false, 'VirtualNetwork excludes internet addresses');
  eq(m('VirtualNetwork', '168.63.129.16'), true, 'VirtualNetwork includes the host virtual IP');
  eq(m('AzureLoadBalancer', '168.63.129.16'), true, 'AzureLoadBalancer is 168.63.129.16');
  eq(m('AzureLoadBalancer', '10.0.1.4'), false, 'AzureLoadBalancer is only the probe address');
  eq(m('Internet', '203.0.113.50'), true, 'Internet covers public addresses');
  eq(m('Internet', '10.0.1.4'), false, 'Internet excludes the VNet');
  eq(m('Internet', '168.63.129.16'), false, 'the probe address is not "Internet"');
  eq(m('10.0.1.0/24', '10.0.1.99'), true, 'cidr match');

  /* ---- effective rule order ---- */
  const eff = E.pgNsgEffective(nsg(base(), 'nsg-web'), 'inbound').map((r) => `${r.priority}:${r.name}`);
  eq(eff, ['100:Allow-HTTPS', '110:Allow-RDP-Office', '65000:AllowVnetInBound', '65001:AllowAzureLoadBalancerInBound', '65500:DenyAllInBound'], 'inbound order with defaults');
  eq(E.pgNsgEffective(nsg(base(), 'nsg-web'), 'outbound').map((r) => r.priority), [65000, 65001, 65500], 'outbound defaults');
  eq(E.pgNsgEffective({ inbound: [rule('b', 'B', 400, '*', '1', 'Tcp', 'Allow'), rule('a', 'A', 150, '*', '1', 'Tcp', 'Allow')], outbound: [] }, 'inbound').map((r) => r.name).slice(0, 2), ['A', 'B'], 'list position does not matter, only the number');

  /* ---- the sandbox works ---- */
  const sb = base();
  eq(E.pgNsgValidate(sb), [], 'sandbox has no config errors');
  eq(code(sb, 'visitor', 'web1', 443), 'success', 'sandbox: internet to web 443');
  eq(code(sb, 'office', 'web1', 3389), 'success', 'sandbox: office RDP');
  eq(warn(sb, 'office', 'web1', 3389), [], 'sandbox: office RDP has no exposure warning');
  eq(code(sb, 'visitor', 'web1', 3389), 'default-deny', 'sandbox: visitor RDP denied by default');
  eq(code(sb, 'visitor', 'web1', 80), 'default-deny', 'sandbox: port 80 not opened');
  eq(code(sb, 'web1', 'db1', 1433), 'success', 'sandbox: web to db SQL');
  eq(code(sb, 'tool1', 'db1', 1433), 'denied-by-rule', 'sandbox: other VM denied by the VNet deny');
  eq(code(sb, 'web1', 'site', 443), 'success', 'sandbox: web VM to the internet');
  eq(code(sb, 'tool1', 'site', 443), 'success', 'sandbox: test VM to the internet');
  eq(code(sb, 'web1', 'tool1', 22), 'success', 'same subnet traffic is allowed by AllowVnetInBound');
  eq(warn(sb, 'web1', 'tool1', 22), ['vnet-default-allow'], 'default VNet allow is flagged');
  eq(code(sb, 'visitor', 'tool1', 443), 'no-public-ip', 'internet to a VM without a public IP');
  eq(code(sb, 'probe', 'db1', 1433), 'denied-by-rule', 'the probe is inside VirtualNetwork, so the VNet deny catches it');
  eq(code(sb, 'probe', 'web1', 80), 'success', 'the probe reaches the web VM through the default rules');
  eq(code(sb, 'visitor', 'web1', 'abc'), 'bad-port', 'bad port');
  eq(code(sb, 'visitor', 'web1', 443, 'Any'), 'failed', 'a test needs a real protocol');
  eq(T(sb, 'visitor', 'site', 443).verdict, 'failed', 'two internet hosts is not a test');
  eq(T(sb, 'web1', 'web1', 443).verdict, 'failed', 'a VM cannot test itself');
  eq(code(sb, 'web1', 'probe', 443), 'bad-pair', 'nobody connects to the probe');
  eq(T(sb, 'visitor', 'web1', 443).hops.map((h) => h.state), ['allowed', 'none'], 'hops: subnet allowed, no NIC NSG');
  eq(T(sb, 'visitor', 'web1', 443).hops[0].rule, 'Allow-HTTPS', 'hops name the matched rule');
  eq(/stateful/.test(T(sb, 'visitor', 'web1', 443).steps.map((s) => s.text).join(' ')), true, 'success mentions that NSGs are stateful');
  eq(/private address/.test(T(sb, 'visitor', 'web1', 443).steps.map((s) => s.text).join(' ')), true, 'inbound explains the public to private translation');

  /* ---- priority: lowest number first, first match wins ---- */
  const prio = (denyP, allowP) => ed((t) => { nsg(t, 'nsg-web').inbound = [rule('d', 'Deny-Internet', denyP, 'Internet', '*', 'Any', 'Deny'), rule('a', 'Allow-HTTPS', allowP, 'Internet', '443', 'Tcp', 'Allow')]; });
  eq(code(prio(300, 400), 'visitor', 'web1', 443), 'lower-priority-loses', 'allow with the higher number loses');
  eq(code(prio(300, 200), 'visitor', 'web1', 443), 'success', 'allow with the lower number wins');
  eq(code(prio(300, 200), 'visitor', 'web1', 8080), 'denied-by-rule', 'the deny still blocks other ports');
  eq(/priority 300/.test(T(prio(300, 400), 'visitor', 'web1', 443).diagnosis.text), true, 'the message names both numbers');
  eq(T(prio(300, 400), 'visitor', 'web1', 443).diagnosis.ruleId, 'd', 'the matched rule id is reported');
  const sameList = ed((t) => { nsg(t, 'nsg-web').inbound = [rule('a', 'Allow-HTTPS', 400, 'Internet', '443', 'Tcp', 'Allow'), rule('d', 'Deny-Internet', 300, 'Internet', '*', 'Any', 'Deny')]; });
  eq(code(sameList, 'visitor', 'web1', 443), 'lower-priority-loses', 'list position is irrelevant');
  eq(code(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('d', 'D', 100, 'Internet', '*', 'Any', 'Deny')]; }), 'visitor', 'web1', 443), 'denied-by-rule', 'a plain deny with no allow behind it');
  eq(code(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('a', 'A', 100, '*', '*', 'Any', 'Allow')]; }), 'visitor', 'web1', 31337), 'success', 'allow all');
  eq(code(ed((t) => { nsg(t, 'nsg-web').inbound = []; }), 'visitor', 'web1', 443), 'default-deny', 'no custom rules: default deny');
  eq(/DenyAllInBound/.test(T(ed((t) => { nsg(t, 'nsg-web').inbound = []; }), 'visitor', 'web1', 443).diagnosis.title), true, 'default deny names the built-in rule');
  eq(code(ed((t) => { nsg(t, 'nsg-web').inbound.push(rule('x', 'Deny-All', 4096, '*', '*', 'Any', 'Deny')); }), 'web1', 'tool1', 22), 'denied-by-rule', 'a custom deny at 4096 beats AllowVnetInBound at 65000');
  eq(code(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', '20.50.60.70')]; }), 'visitor', 'web1', 443), 'default-deny', 'a rule naming the public address never matches');
  eq(/public address/.test(T(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', '20.50.60.70')]; }), 'visitor', 'web1', 443).diagnosis.text), true, 'and the message says so');

  /* ---- protocols, ports, ICMP ---- */
  const web = (rules) => ed((t) => { nsg(t, 'nsg-web').inbound = rules; });
  eq(code(web([rule('a', 'A', 100, 'Internet', '53', 'Udp', 'Allow')]), 'visitor', 'web1', 53, 'Udp'), 'success', 'udp rule matches udp');
  eq(code(web([rule('a', 'A', 100, 'Internet', '53', 'Udp', 'Allow')]), 'visitor', 'web1', 53, 'Tcp'), 'default-deny', 'udp rule does not match tcp');
  eq(code(web([rule('a', 'A', 100, 'Internet', '*', 'Icmp', 'Allow')]), 'visitor', 'web1', null, 'Icmp'), 'success', 'icmp rule matches ping');
  eq(code(web([rule('a', 'A', 100, 'Internet', '*', 'Icmp', 'Allow')]), 'visitor', 'web1', 443, 'Tcp'), 'default-deny', 'icmp rule does not match tcp');
  eq(code(web([rule('a', 'A', 100, 'Internet', '443', 'Any', 'Allow')]), 'visitor', 'web1', null, 'Icmp'), 'default-deny', 'a rule with a specific port does not match ICMP');
  eq(code(web([rule('a', 'A', 100, 'Internet', '*', 'Any', 'Allow')]), 'visitor', 'web1', null, 'Icmp'), 'success', 'an any/any rule matches ICMP');
  eq(code(web([rule('a', 'A', 100, 'Internet', '80, 443, 8000-8100', 'Tcp', 'Allow')]), 'visitor', 'web1', 8050), 'success', 'port list with a range');
  eq(code(web([rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', '*', '1024-65535')]), 'visitor', 'web1', 443), 'success', 'source port range covers the client port');
  eq(code(web([rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', '*', '443')]), 'visitor', 'web1', 443), 'default-deny', 'a source port of 443 never matches an ephemeral client port');
  eq(code(web([rule('a', 'A', 100, '203.0.113.0/24', '443', 'Tcp', 'Allow')]), 'visitor', 'web1', 443), 'success', 'cidr source');
  eq(code(web([rule('a', 'A', 100, '203.0.113.0/24, 198.51.100.20', '443', 'Tcp', 'Allow')]), 'office', 'web1', 443), 'success', 'comma list source');
  eq(code(web([rule('a', 'A', 100, '203.0.113.0/24', '443', 'Tcp', 'Allow')]), 'office', 'web1', 443), 'default-deny', 'source outside the range');
  eq(code(web([rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', '10.0.1.99')]), 'visitor', 'web1', 443), 'default-deny', 'destination address must be the VM');
  eq(code(web([rule('a', 'A', 100, 'Internet', '443', 'Tcp', 'Allow', 'VirtualNetwork')]), 'visitor', 'web1', 443), 'success', 'inbound destination VirtualNetwork matches the private address');

  /* ---- two levels: subnet then NIC (inbound), NIC then subnet (outbound) ---- */
  const twoLevel = (nicRules, subnetRules) => ed((t) => {
    t.nsgs.push({ id: 'nic', name: 'nsg-nic', inbound: nicRules, outbound: [] });
    t.vms[0].nic.nsg = 'nic';
    if (subnetRules) nsg(t, 'nsg-web').inbound = subnetRules;
  });
  const httpsRule = rule('h', 'Allow-HTTPS', 100, 'Internet', '443', 'Tcp', 'Allow');
  eq(code(twoLevel([httpsRule]), 'visitor', 'web1', 443), 'success', 'both levels allow');
  eq(T(twoLevel([httpsRule]), 'visitor', 'web1', 443).hops.map((h) => h.level), ['subnet', 'nic'], 'inbound: subnet first, then NIC');
  eq(code(twoLevel([]), 'visitor', 'web1', 443), 'nic-nsg-blocks', 'subnet allows, NIC blocks');
  eq(T(twoLevel([]), 'visitor', 'web1', 443).hops.map((h) => h.state), ['allowed', 'blocked'], 'hops after a NIC block');
  eq(code(twoLevel([httpsRule], []), 'visitor', 'web1', 443), 'subnet-nsg-blocks', 'NIC allows, subnet blocks first');
  eq(T(twoLevel([httpsRule], []), 'visitor', 'web1', 443).hops.map((h) => h.state), ['blocked', 'notreached'], 'the NIC is never reached after a subnet block');
  eq(code(twoLevel([], []), 'visitor', 'web1', 443), 'default-deny', 'both block: the rule decides the code');
  eq(code(twoLevel([rule('d', 'Deny-All', 100, '*', '*', 'Any', 'Deny')]), 'visitor', 'web1', 443), 'nic-nsg-blocks', 'an explicit NIC deny is still a NIC block');
  const nicOnly = ed((t) => { t.subnets[0].nsg = null; t.nsgs.push({ id: 'nic', name: 'nsg-nic', inbound: [httpsRule], outbound: [] }); t.vms[0].nic.nsg = 'nic'; });
  eq(code(nicOnly, 'visitor', 'web1', 443), 'success', 'NIC NSG alone is enough');
  eq(T(nicOnly, 'visitor', 'web1', 443).hops.map((h) => h.state), ['none', 'allowed'], 'a level without an NSG filters nothing');
  eq(code(nicOnly, 'visitor', 'web1', 80), 'default-deny', 'NIC NSG alone denies the rest');
  // outbound order
  const outTwo = (nicOut, subnetOut) => ed((t) => {
    t.nsgs.push({ id: 'nic', name: 'nsg-nic', inbound: [], outbound: nicOut });
    t.vms[0].nic.nsg = 'nic';
    nsg(t, 'nsg-web').outbound = subnetOut;
  });
  const denyNet = rule('o', 'Deny-Internet-Out', 100, '*', '*', 'Any', 'Deny', 'Internet');
  eq(T(outTwo([], []), 'web1', 'site', 443).hops.map((h) => h.level), ['nic', 'subnet'], 'outbound: NIC first, then subnet');
  eq(code(outTwo([denyNet], []), 'web1', 'site', 443), 'nic-nsg-blocks', 'outbound NIC block');
  eq(T(outTwo([denyNet], []), 'web1', 'site', 443).hops.map((h) => h.state), ['blocked', 'notreached'], 'outbound: subnet not reached after a NIC block');
  eq(code(outTwo([], [denyNet]), 'web1', 'site', 443), 'subnet-nsg-blocks', 'outbound subnet block after the NIC allowed');
  eq(code(ed((t) => { nsg(t, 'nsg-web').outbound = [denyNet]; }), 'web1', 'site', 443), 'denied-by-rule', 'a custom outbound deny with no NIC NSG');
  eq(code(ed((t) => { nsg(t, 'nsg-web').outbound = [rule('a', 'Allow-HTTPS-Out', 100, '*', '443', 'Tcp', 'Allow', 'Internet'), rule('o', 'Deny-Internet-Out', 200, '*', '*', 'Any', 'Deny', 'Internet')]; }), 'web1', 'site', 443), 'success', 'outbound allow ahead of the deny');
  eq(code(ed((t) => { nsg(t, 'nsg-web').outbound = [rule('a', 'Allow-HTTPS-Out', 300, '*', '443', 'Tcp', 'Allow', 'Internet'), rule('o', 'Deny-Internet-Out', 200, '*', '*', 'Any', 'Deny', 'Internet')]; }), 'web1', 'site', 443), 'lower-priority-loses', 'outbound allow behind the deny');
  eq(code(ed((t) => { nsg(t, 'nsg-web').outbound = [rule('o', 'Deny-Internet-Out', 200, '*', '*', 'Any', 'Deny', 'Internet')]; }), 'web1', 'db1', 1433), 'success', 'a deny to Internet does not touch VNet traffic');
  eq(code(ed((t) => { nsg(t, 'nsg-web').outbound = [rule('o', 'Deny-All-Out', 4000, '*', '*', 'Any', 'Deny')]; }), 'web1', 'db1', 1433), 'denied-by-rule', 'a custom deny-all outbound beats AllowVnetOutBound');
  // VM to VM crosses four levels
  const vmvm = ed((t) => { t.vms[0].nic.nsg = 'nsg-web'; t.vms[2].nic.nsg = 'nsg-data'; });
  eq(T(vmvm, 'web1', 'db1', 1433).hops.map((h) => `${h.dir}/${h.level}`), ['outbound/nic', 'outbound/subnet', 'inbound/subnet', 'inbound/nic'], 'vm to vm: source NIC, source subnet, destination subnet, destination NIC');
  eq(code(vmvm, 'web1', 'db1', 1433), 'success', 'the same NSG can sit at several levels');
  eq(code(vmvm, 'web1', 'db1', 22), 'denied-by-rule', 'vm to vm deny shows up at the first blocking level');

  /* ---- no NSG at all ---- */
  const bare = ed((t) => { t.subnets.forEach((s) => { s.nsg = null; }); });
  eq(code(bare, 'visitor', 'web1', 443), 'no-nsg-public-ip', 'public IP with no NSG anywhere is closed');
  eq(T(bare, 'visitor', 'web1', 443).hops.map((h) => h.state), ['none', 'none'], 'hops for no NSG');
  eq(code(bare, 'tool1', 'db1', 1433), 'success', 'inside the VNet nothing is filtered without NSGs');
  eq(code(bare, 'web1', 'site', 443), 'success', 'outbound is unfiltered without NSGs');
  eq(code(bare, 'probe', 'web1', 80), 'success', 'the platform probe is not blocked by the absence of an NSG');
  eq(code(ed((t) => { t.subnets[0].nsg = null; t.nsgs.push({ id: 'n', name: 'n', inbound: [httpsRule], outbound: [] }); t.vms[0].nic.nsg = 'n'; }), 'visitor', 'web1', 443), 'success', 'an NSG on the NIC alone opens a public VM');
  eq(code(ed((t) => { t.vms[0].publicIp = ''; }), 'visitor', 'web1', 443), 'no-public-ip', 'no public IP, no internet access');
  eq(code(ed((t) => { t.vms[0].publicIp = ''; }), 'web1', 'site', 443), 'success', 'outbound does not need a public IP in this model');

  /* ---- warnings ---- */
  const rdpAny = ed((t) => { nsg(t, 'nsg-web').inbound = [rule('r', 'Allow-RDP-Any', 110, '*', '3389', 'Tcp', 'Allow')]; });
  eq(T(rdpAny, 'visitor', 'web1', 3389).verdict, 'success', 'RDP from anywhere works');
  eq(warn(rdpAny, 'visitor', 'web1', 3389), ['management-port-exposed'], 'and is flagged as exposed');
  eq(warn(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('r', 'Allow-RDP-Net', 110, 'Internet', '3389', 'Tcp', 'Allow')]; }), 'visitor', 'web1', 3389), ['management-port-exposed'], 'Internet tag is also exposed');
  eq(warn(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('r', 'Allow-SSH-Any', 110, '*', '22', 'Tcp', 'Allow')]; }), 'visitor', 'web1', 22), ['management-port-exposed'], 'SSH is flagged too');
  eq(warn(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('r', 'Allow-RDP-Office', 110, '198.51.100.0/24', '3389', 'Tcp', 'Allow')]; }), 'office', 'web1', 3389), [], 'a narrow source is not flagged');
  eq(warn(ed((t) => { nsg(t, 'nsg-web').inbound = [rule('r', 'Allow-All', 110, '*', '*', 'Any', 'Allow')]; }), 'visitor', 'web1', 443), [], 'only management ports are flagged');
  eq(warn(ed((t) => { nsg(t, 'nsg-data').inbound = [rule('r', 'Allow-SQL-Web', 100, '10.0.1.4', '1433', 'Tcp', 'Allow')]; }), 'tool1', 'db1', 1433), ['vnet-default-allow'], 'the surprising default VNet allow is flagged');
  eq(warn(sb, 'web1', 'db1', 1433), [], 'an explicit allow is not flagged');
  eq(E.pgClone(rdpAny).externals.some((e) => e.id === '__stranger'), false, 'the stranger never leaks into the topology');

  /* ---- validation ---- */
  const dup = ed((t) => { nsg(t, 'nsg-web').inbound.push(rule('z', 'Another', 100, '*', '80', 'Tcp', 'Allow')); });
  eq(E.pgNsgValidate(dup).map((e) => e.field), ['priority'], 'duplicate priority in one direction');
  eq(code(dup, 'visitor', 'web1', 443), 'bad-config', 'a duplicate priority stops the test');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').outbound.push(rule('z', 'Same', 100, '*', '80', 'Tcp', 'Allow')); })), [], 'same number in the other direction is fine');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].priority = 99; })).map((e) => e.field), ['priority'], 'priority below 100');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].priority = 4097; })).map((e) => e.field), ['priority'], 'priority above 4096');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].priority = 4096; })), [], 'priority 4096 is allowed');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].priority = '12x'; })).map((e) => e.field), ['priority'], 'priority must be a number');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].name = 'bad name'; })).map((e) => e.field), ['name'], 'name with a space');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].name = 'ends-with-dash-'; })).map((e) => e.field), ['name'], 'name ending with a dash');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[1].name = 'Allow-HTTPS'; })).map((e) => e.field), ['name'], 'duplicate name');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].source = 'Internet, VirtualNetwork'; })).map((e) => e.field), ['source'], 'two tags rejected');
  eq(E.pgNsgValidate(ed((t) => { nsg(t, 'nsg-web').inbound[0].destPort = 'http'; })).map((e) => e.field), ['destPort'], 'bad port text');
  eq(E.pgNsgValidate(ed((t) => { t.subnets[0].nsg = 'ghost'; })).map((e) => e.field), ['subnet.web'], 'association to a missing NSG');

  /* ---- fixes ---- */
  const f = E.pgNsgApplyFixes(base(), [
    { addRule: { nsg: 'nsg-web', dir: 'outbound', rule: rule('n', 'New', 150, '*', '443', 'Tcp', 'Allow', 'Internet') } },
    { setRule: { nsg: 'nsg-web', dir: 'inbound', id: 'r-https', patch: { priority: 105 } } },
    { removeRule: { nsg: 'nsg-data', dir: 'inbound', id: 'r-sql' } },
    { associate: { target: 'nic', id: 'web1', nsg: 'nsg-data' } },
    { associate: { target: 'subnet', id: 'web', nsg: null } },
    { setPublicIp: { vm: 'tool1', value: '20.50.60.71' } },
  ]);
  eq([nsg(f, 'nsg-web').outbound.length, nsg(f, 'nsg-web').inbound[0].priority, nsg(f, 'nsg-data').inbound.length, f.vms[0].nic.nsg, f.subnets[0].nsg, f.vms[1].publicIp], [1, 105, 1, 'nsg-data', null, '20.50.60.71'], 'apply fixes');
  eq(nsg(base(), 'nsg-web').outbound.length, 0, 'the original topology is untouched by fixes');

  /* ---- every scenario: broken outcome, fixed outcome ---- */
  (data.nsg || []).forEach((sc) => {
    eq(E.pgNsgValidate(sc.topology), [], `nsg scenario ${sc.id} has a valid topology`);
    sc.expect.forEach((ex, n) => {
      const r = E.pgNsgTest(sc.topology, ex);
      eq(r.verdict, ex.verdict, `nsg scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `nsg scenario ${sc.id} check ${n + 1} code`);
      if (ex.warn) eq(r.warnings.map((w) => w.code).indexOf(ex.warn) >= 0, true, `nsg scenario ${sc.id} check ${n + 1} warning ${ex.warn}`);
    });
    const t = E.pgNsgApplyFixes(sc.topology, sc.fix);
    eq(E.pgNsgValidate(t), [], `nsg scenario ${sc.id} fixed topology is valid`);
    sc.expectFixed.forEach((ex, n) => eq(E.pgNsgTest(t, ex).verdict, ex.verdict, `nsg scenario ${sc.id} fixed check ${n + 1}`));
    // the fix must also remove the problem it was written for
    sc.expect.forEach((ex, n) => { if (ex.code) eq(E.pgNsgTest(t, ex).diagnosis, null, `nsg scenario ${sc.id} check ${n + 1} no longer fails after the fix`); });
    const brokenGoal = sc.expectFixed.some((g) => E.pgNsgTest(sc.topology, g).verdict !== g.verdict);
    eq(brokenGoal, true, `nsg scenario ${sc.id}: at least one goal is unmet before the fix`);
  });
  eq((data.nsg || []).length >= 6, true, 'nsg has at least six scenarios');
  eq(Array.isArray(data.nsgSandbox && data.nsgSandbox.nsgs), true, 'nsg sandbox exists');
};
