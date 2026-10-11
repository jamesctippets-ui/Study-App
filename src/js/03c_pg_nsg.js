/* ---------------- IT Playground: Azure network security group (NSG) tester (pure engine) ---------------- */

// One virtual network with two subnets and a few virtual machines. Network security
// groups (NSGs) hold inbound and outbound rules and can be associated with a subnet,
// with a VM's network interface (NIC), or both. The engine evaluates a test connection
// the way the Azure documentation describes it ("Network security groups" and "How
// network security groups filter network traffic" on learn.microsoft.com):
//   - inside one NSG the rules are read by priority number, LOWEST number first, and the first match
//     decides (so list position does not matter, unlike the firewall tool)
//   - the built-in default rules (65000, 65001, 65500) cannot be deleted, only overridden by a lower number
//   - inbound traffic meets the subnet NSG first, then the NIC NSG; outbound meets the NIC NSG first, then
//     the subnet NSG; every level that HAS an NSG must allow the traffic, a level without one filters nothing
//   - rules see the private address for inbound traffic (public addresses are translated first)
//   - NSGs are stateful: the reply to an allowed connection needs no rule of its own
// Simplified on purpose: no application security groups, no augmented service tags beyond the three below,
// no Virtual Network Manager admin rules, no Azure Firewall or route tables, no OS firewall, nothing listens
// on a port (the tester judges the NSG rules only), the client's source port is a fixed high port, and an
// ICMP packet only matches a rule whose port fields are *.
//
// topo = {
//   vnet: { name, space: '10.0.0.0/16' },
//   subnets: [{ id, name, cidr, nsg: nsgId|null }],
//   vms: [{ id, name, subnet: subnetId, ip, publicIp: ''|'20.x.x.x', nic: { nsg: nsgId|null } }],
//   nsgs: [{ id, name, inbound: [rule], outbound: [rule] }],
//   externals: [{ id, name, ip, kind: 'internet'|'probe', role: 'client'|'server'|'probe' }]
// }
// rule = { id, name, priority (100-4096), source, srcPort, dest, destPort, proto: 'Tcp'|'Udp'|'Icmp'|'Any', action: 'Allow'|'Deny' }
// address fields: '*' (any), a service tag (Internet, VirtualNetwork, AzureLoadBalancer), or addresses/CIDRs separated by commas
// port fields: '*', '443', '1024-65535' or a comma list such as '80, 8000-8100'

const PG_NSG_EPHEMERAL = 50000;
const PG_NSG_PROBE_IP = '168.63.129.16';
const PG_NSG_TAGS = ['Internet', 'VirtualNetwork', 'AzureLoadBalancer'];
const PG_NSG_PROTOS = [{ value: 'Tcp', label: 'TCP' }, { value: 'Udp', label: 'UDP' }, { value: 'Icmp', label: 'ICMP' }, { value: 'Any', label: 'Any' }];
const PG_NSG_ACTIONS = [{ value: 'Allow', label: 'Allow' }, { value: 'Deny', label: 'Deny' }];
const PG_NSG_MGMT_PORTS = [22, 3389];
const PG_NSG_STRANGER_IP = '192.0.2.77';

const PG_NSG_DEFAULTS = {
  inbound: [
    { id: 'default-in-65000', name: 'AllowVnetInBound', priority: 65000, source: 'VirtualNetwork', srcPort: '*', dest: 'VirtualNetwork', destPort: '*', proto: 'Any', action: 'Allow', builtin: true },
    { id: 'default-in-65001', name: 'AllowAzureLoadBalancerInBound', priority: 65001, source: 'AzureLoadBalancer', srcPort: '*', dest: '*', destPort: '*', proto: 'Any', action: 'Allow', builtin: true },
    { id: 'default-in-65500', name: 'DenyAllInBound', priority: 65500, source: '*', srcPort: '*', dest: '*', destPort: '*', proto: 'Any', action: 'Deny', builtin: true },
  ],
  outbound: [
    { id: 'default-out-65000', name: 'AllowVnetOutBound', priority: 65000, source: 'VirtualNetwork', srcPort: '*', dest: 'VirtualNetwork', destPort: '*', proto: 'Any', action: 'Allow', builtin: true },
    { id: 'default-out-65001', name: 'AllowInternetOutBound', priority: 65001, source: '*', srcPort: '*', dest: 'Internet', destPort: '*', proto: 'Any', action: 'Allow', builtin: true },
    { id: 'default-out-65500', name: 'DenyAllOutBound', priority: 65500, source: '*', srcPort: '*', dest: '*', destPort: '*', proto: 'Any', action: 'Deny', builtin: true },
  ],
};

/* ---- parsing ---- */

function pgNsgCidr(text) {
  const m = /^\s*(\d{1,3}(?:\.\d{1,3}){3})(?:\s*\/\s*(\d{1,2}))?\s*$/.exec(String(text == null ? '' : text));
  if (!m) return null;
  const ip = pgParseIPv4(m[1]);
  const prefix = m[2] === undefined ? 32 : Number(m[2]);
  if (ip === null || !(prefix >= 0 && prefix <= 32)) return null;
  return { net: (ip & pgMaskFromPrefix(prefix)) >>> 0, prefix, text: `${pgIpToString((ip & pgMaskFromPrefix(prefix)) >>> 0)}/${prefix}` };
}
function pgNsgInCidr(c, ipN) { return !!c && ipN !== null && ((ipN & pgMaskFromPrefix(c.prefix)) >>> 0) === c.net; }

function pgNsgTagOf(text) {
  const t = String(text == null ? '' : text).trim().toLowerCase();
  return PG_NSG_TAGS.find((x) => x.toLowerCase() === t) || null;
}

// -> { kind: 'any' } | { kind: 'tag', tag } | { kind: 'cidrs', list } | null when the text is not a valid address field
function pgNsgParseAddr(text) {
  const s = String(text == null ? '' : text).trim();
  if (s === '') return null;
  if (s === '*' || s.toLowerCase() === 'any') return { kind: 'any' };
  const parts = s.split(',').map((p) => p.trim()).filter((p) => p !== '');
  if (!parts.length) return null;
  if (parts.some((p) => pgNsgTagOf(p))) return parts.length === 1 ? { kind: 'tag', tag: pgNsgTagOf(parts[0]) } : null; // a tag cannot be combined with anything else
  const list = [];
  for (let i = 0; i < parts.length; i += 1) { const c = pgNsgCidr(parts[i]); if (!c) return null; list.push(c); }
  return { kind: 'cidrs', list };
}

// -> { any: true } | { ranges: [[lo, hi], ...] } | null
function pgNsgParsePorts(text) {
  const s = String(text == null ? '' : text).trim();
  if (s === '') return null;
  if (s === '*' || s.toLowerCase() === 'any') return { any: true };
  const ranges = [];
  const parts = s.split(',').map((p) => p.trim());
  for (let i = 0; i < parts.length; i += 1) {
    const m = /^(\d{1,5})(?:\s*-\s*(\d{1,5}))?$/.exec(parts[i]);
    if (!m) return null;
    const lo = Number(m[1]); const hi = m[2] === undefined ? lo : Number(m[2]);
    if (lo < 1 || hi > 65535 || lo > hi) return null;
    ranges.push([lo, hi]);
  }
  return { ranges };
}
function pgNsgPortMatch(parsed, port) {
  if (!parsed) return false;
  if (parsed.any) return true;
  return port !== null && port !== undefined && parsed.ranges.some((r) => port >= r[0] && port <= r[1]);
}

function pgNsgInVnet(topo, ipN) { return pgNsgInCidr(pgNsgCidr(topo.vnet.space), ipN); }

// The service tags are modelled as the documentation defines them: VirtualNetwork is the VNet address space
// plus the host's virtual IP (168.63.129.16); AzureLoadBalancer is that virtual IP; Internet is everything else.
function pgNsgAddrMatch(topo, parsed, ipN) {
  if (!parsed) return false;
  if (parsed.kind === 'any') return true;
  const probe = pgParseIPv4(PG_NSG_PROBE_IP);
  if (parsed.kind === 'tag') {
    if (parsed.tag === 'VirtualNetwork') return pgNsgInVnet(topo, ipN) || ipN === probe;
    if (parsed.tag === 'AzureLoadBalancer') return ipN === probe;
    return !pgNsgInVnet(topo, ipN) && ipN !== probe;
  }
  return parsed.list.some((c) => pgNsgInCidr(c, ipN));
}

function pgNsgIsAnyPorts(text) { const p = pgNsgParsePorts(text); return !!p && !!p.any; }

// pkt = { proto: 'Tcp'|'Udp'|'Icmp', srcIp, dstIp, srcPort, dstPort } (addresses as numbers)
function pgNsgRuleMatches(topo, rule, pkt) {
  if (rule.proto !== 'Any' && rule.proto !== pkt.proto) return false;
  if (!pgNsgAddrMatch(topo, pgNsgParseAddr(rule.source), pkt.srcIp)) return false;
  if (!pgNsgAddrMatch(topo, pgNsgParseAddr(rule.dest), pkt.dstIp)) return false;
  if (pkt.proto === 'Icmp') return pgNsgIsAnyPorts(rule.srcPort) && pgNsgIsAnyPorts(rule.destPort);
  return pgNsgPortMatch(pgNsgParsePorts(rule.srcPort), pkt.srcPort) && pgNsgPortMatch(pgNsgParsePorts(rule.destPort), pkt.dstPort);
}

/* ---- lookups ---- */

function pgNsgFind(topo, id) { return (topo.nsgs || []).find((n) => n.id === id) || null; }
function pgNsgVm(topo, id) { return (topo.vms || []).find((v) => v.id === id) || null; }
function pgNsgSubnetOf(topo, vm) { return (topo.subnets || []).find((s) => s.id === vm.subnet) || null; }
function pgNsgExternal(topo, id) { return (topo.externals || []).find((e) => e.id === id) || null; }

// All rules of one direction in the order Azure reads them: custom and default together, lowest number first.
function pgNsgEffective(nsg, dir) {
  const custom = ((nsg && nsg[dir]) || []).map((r, i) => ({ ...r, builtin: false, _i: i }));
  return custom.concat(PG_NSG_DEFAULTS[dir].map((r, i) => ({ ...r, _i: 1000 + i })))
    .sort((a, b) => (Number(a.priority) - Number(b.priority)) || (a._i - b._i));
}

// First matching rule for a packet in one NSG and direction -> { rule, position, list }
function pgNsgEvalNsg(topo, nsg, dir, pkt) {
  const list = pgNsgEffective(nsg, dir);
  for (let i = 0; i < list.length; i += 1) if (pgNsgRuleMatches(topo, list[i], pkt)) return { rule: list[i], position: i + 1, list, index: i };
  return { rule: null, position: 0, list, index: -1 };
}

/* ---- text helpers ---- */

function pgNsgPortText(t) { return pgNsgIsAnyPorts(t) ? 'any port' : `port ${String(t).trim()}`; }
function pgNsgAddrText(t) { const p = pgNsgParseAddr(t); if (!p) return String(t); if (p.kind === 'any') return 'any address'; if (p.kind === 'tag') return p.tag; return p.list.map((c) => c.text).join(', '); }
function pgNsgRuleText(r) {
  const proto = r.proto === 'Any' ? 'any protocol' : r.proto.toUpperCase();
  return `${r.name} (priority ${r.priority}): ${r.action} ${proto}, ${pgNsgPortText(r.destPort)}, from ${pgNsgAddrText(r.source)} to ${pgNsgAddrText(r.dest)}`;
}

/* ---- configuration checks ---- */

// -> [{ nsg, dir, ruleId, field, text }]
function pgNsgValidate(topo) {
  const errs = [];
  (topo.nsgs || []).forEach((n) => {
    ['inbound', 'outbound'].forEach((dir) => {
      const seenPriority = {};
      const seenName = {};
      (n[dir] || []).forEach((r) => {
        const add = (field, text) => errs.push({ nsg: n.id, dir, ruleId: r.id, field, text });
        const pr = Number(r.priority);
        if (!(String(r.priority).trim() !== '' && Number.isInteger(pr) && pr >= 100 && pr <= 4096)) add('priority', 'Priority must be a whole number from 100 to 4096.');
        else if (seenPriority[pr]) add('priority', `Priority ${pr} is already used by another ${dir} rule here; two rules cannot share a priority and direction.`);
        else seenPriority[pr] = true;
        if (!/^\w([\w.-]{0,78}\w)?$/.test(String(r.name || ''))) add('name', 'Use letters, digits, ".", "-" or "_" (up to 80 characters, ending with a letter, digit or "_").');
        else if (seenName[r.name]) add('name', 'Rule names must be unique within the NSG.');
        else seenName[r.name] = true;
        if (!pgNsgParseAddr(r.source)) add('source', 'Use *, one service tag (Internet, VirtualNetwork, AzureLoadBalancer) or addresses/CIDRs separated by commas. Tags cannot be combined.');
        if (!pgNsgParseAddr(r.dest)) add('dest', 'Use *, one service tag (Internet, VirtualNetwork, AzureLoadBalancer) or addresses/CIDRs separated by commas. Tags cannot be combined.');
        if (!pgNsgParsePorts(r.srcPort)) add('srcPort', 'Use *, a port (80), a range (1024-65535) or a comma list.');
        if (!pgNsgParsePorts(r.destPort)) add('destPort', 'Use *, a port (80), a range (1024-65535) or a comma list.');
      });
    });
  });
  (topo.subnets || []).forEach((s) => { if (s.nsg && !pgNsgFind(topo, s.nsg)) errs.push({ nsg: null, dir: null, ruleId: null, field: `subnet.${s.id}`, text: `${s.name} points at an NSG that does not exist.` }); });
  (topo.vms || []).forEach((v) => { if (v.nic && v.nic.nsg && !pgNsgFind(topo, v.nic.nsg)) errs.push({ nsg: null, dir: null, ruleId: null, field: `nic.${v.id}`, text: `${v.name}'s NIC points at an NSG that does not exist.` }); });
  return errs;
}

/* ---- one test connection ---- */

// conn = { from, to, proto: 'Tcp'|'Udp'|'Icmp', port }. Endpoints are VM ids or external ids.
// -> { verdict, summary, steps, hops, diagnosis, warnings, stateful }
function pgNsgTest(topo, conn) {
  const steps = []; const hops = []; const warnings = [];
  const make = (verdict, summary, diagnosis) => ({ verdict, summary, steps, hops, diagnosis: diagnosis || null, warnings });
  const fail = (diag) => make('failed', diag.title, diag);
  const src = pgNsgVm(topo, conn.from) ? { vm: pgNsgVm(topo, conn.from) } : { ext: pgNsgExternal(topo, conn.from) };
  const dst = pgNsgVm(topo, conn.to) ? { vm: pgNsgVm(topo, conn.to) } : { ext: pgNsgExternal(topo, conn.to) };
  if ((!src.vm && !src.ext) || (!dst.vm && !dst.ext)) return make('failed', 'Pick a source and a destination.');
  if (!src.vm && !dst.vm) return make('failed', 'One end has to be a virtual machine.', pgFail('bad-pair', 'One end has to be a virtual machine', 'NSGs filter traffic to and from Azure resources. Two machines on the internet never meet an NSG.', 'Pick a virtual machine as the source or the destination.'));
  if (src.vm && dst.vm && src.vm.id === dst.vm.id) return make('failed', 'Pick two different machines.', pgFail('bad-pair', 'Pick two different machines', 'A machine talking to itself does not leave its network interface.', 'Pick a different destination.'));
  if (dst.ext && dst.ext.role === 'probe') return make('failed', 'The probe only sends.', pgFail('bad-pair', 'The load balancer probe only sends', 'The Azure health probe starts the connection to your VM; a VM does not connect to it as a service.', 'Use the probe as the source.'));
  const proto = conn.proto;
  if (['Tcp', 'Udp', 'Icmp'].indexOf(proto) < 0) return make('failed', 'Pick TCP, UDP or ICMP.');
  const port = proto === 'Icmp' ? null : Number(conn.port);
  if (proto !== 'Icmp' && !(Number.isInteger(port) && port >= 1 && port <= 65535)) return make('failed', 'Not a valid port', pgFail('bad-port', 'Not a valid port', 'A TCP or UDP port is a number from 1 to 65535.', 'Enter a port number.'));
  const bad = pgNsgValidate(topo);
  if (bad.length) {
    const b = bad[0];
    steps.push({ ok: false, text: b.text });
    return fail(Object.assign(pgFail('bad-config', 'A rule or setting is not valid', b.text, 'Correct the highlighted field and try again.', b.nsg, b.field), { dir: b.dir, ruleId: b.ruleId }));
  }

  const srcIp = src.vm ? src.vm.ip : src.ext.ip;
  const dstIp = dst.vm ? dst.vm.ip : dst.ext.ip;
  const srcN = pgParseIPv4(srcIp); const dstN = pgParseIPv4(dstIp);
  const pkt = { proto, srcIp: srcN, dstIp: dstN, srcPort: proto === 'Icmp' ? null : PG_NSG_EPHEMERAL, dstPort: port };
  const portText = proto === 'Icmp' ? '' : ` port ${port}`;
  const srcName = src.vm ? src.vm.name : src.ext.name; const dstName = dst.vm ? dst.vm.name : dst.ext.name;
  steps.push({ ok: true, text: `${srcName} (${srcIp}) connects to ${dstName} (${dstIp}) using ${proto.toUpperCase()}${portText}.` });

  // Reaching a VM from the internet needs a public address, and Azure translates it to the private one first.
  const fromInternet = !!src.ext && src.ext.kind === 'internet';
  if (fromInternet && dst.vm && !dst.vm.publicIp) {
    steps.push({ ok: false, text: `${dstName} has no public IP address, only the private ${dstIp}. Internet routers do not forward private addresses, so the traffic never gets as far as an NSG.` });
    return fail(pgFail('no-public-ip', `${dstName} has no public IP`, `The internet can only reach a VM that has a public IP address (or sits behind a public load balancer). ${dstName} has only the private address ${dstIp}, and private addresses are not routable on the internet, so nothing arrives.`, 'Give the VM a public IP, or reach it another way (VPN, Bastion, a load balancer).', dst.vm.id, 'publicIp'));
  }
  if (fromInternet && dst.vm) steps.push({ ok: true, text: `Azure translates the public address ${dst.vm.publicIp} to the VM's private address ${dst.vm.ip} first. NSG rules for inbound traffic see the private address, so a rule that names the public address would never match.` });

  // The levels, in the order Azure applies them.
  const stages = [];
  if (src.vm) {
    const sub = pgNsgSubnetOf(topo, src.vm);
    stages.push({ dir: 'outbound', level: 'nic', vm: src.vm, subnet: sub, nsgId: (src.vm.nic || {}).nsg || null });
    stages.push({ dir: 'outbound', level: 'subnet', vm: src.vm, subnet: sub, nsgId: sub ? sub.nsg || null : null });
  }
  if (dst.vm) {
    const sub = pgNsgSubnetOf(topo, dst.vm);
    stages.push({ dir: 'inbound', level: 'subnet', vm: dst.vm, subnet: sub, nsgId: sub ? sub.nsg || null : null });
    stages.push({ dir: 'inbound', level: 'nic', vm: dst.vm, subnet: sub, nsgId: (dst.vm.nic || {}).nsg || null });
  }

  // A Standard public IP is closed to inbound traffic until an NSG allows it, so with no NSG at either level nothing gets in.
  if (fromInternet && dst.vm) {
    const inStages = stages.filter((s) => s.dir === 'inbound');
    if (inStages.every((s) => !s.nsgId)) {
      steps.push({ ok: false, text: `Neither the subnet nor ${dstName}'s network interface has a network security group. A VM with a Standard public IP is closed to inbound traffic by default: an NSG has to allow it, and there is none to do so.` });
      inStages.forEach((s) => hops.push({ key: `${s.dir}-${s.level}`, dir: s.dir, level: s.level, label: s.level === 'subnet' ? 'Subnet NSG (inbound)' : 'NIC NSG (inbound)', where: s.level === 'subnet' ? (s.subnet || {}).name : s.vm.name, state: 'none', nsg: null }));
      return fail(Object.assign(pgFail('no-nsg-public-ip', 'No NSG: a public IP is closed by default', `${dstName} has a public IP, but there is no network security group on its subnet or its NIC. A Standard SKU public IP address is closed to inbound traffic by default, so traffic from the internet is only allowed once an NSG allows it. With no NSG at all, nothing gets in.`, 'Associate an NSG with the subnet (or the NIC) and add an Allow rule for this port.', dst.vm.id, 'assoc'), { level: 'subnet', vmId: dst.vm.id }));
    }
  }

  const dirWord = (d) => (d === 'inbound' ? 'Inbound' : 'Outbound');
  let blockedAt = -1; let diagnosis = null;
  for (let i = 0; i < stages.length; i += 1) {
    const s = stages[i];
    const label = `${s.level === 'subnet' ? 'Subnet NSG' : 'NIC NSG'} (${s.dir})`;
    const where = s.level === 'subnet' ? (s.subnet || {}).name : s.vm.name;
    const hop = { key: `${s.dir}-${s.level}-${s.vm.id}`, dir: s.dir, level: s.level, label, where, vmId: s.vm.id, subnetId: (s.subnet || {}).id, nsg: null, state: 'none' };
    hops.push(hop);
    if (blockedAt >= 0) { hop.state = 'notreached'; continue; }
    if (!s.nsgId) {
      steps.push({ ok: true, text: `${dirWord(s.dir)}, ${s.level === 'subnet' ? `subnet ${where}` : `${where}'s network interface`}: no NSG is associated here, so nothing is filtered at this level.` });
      continue;
    }
    const nsg = pgNsgFind(topo, s.nsgId);
    const ev = pgNsgEvalNsg(topo, nsg, s.dir, pkt);
    const rule = ev.rule;
    hop.nsg = nsg.id; hop.nsgName = nsg.name; hop.rule = rule.name; hop.ruleId = rule.id; hop.priority = rule.priority; hop.builtin = rule.builtin; hop.action = rule.action; hop.state = rule.action === 'Allow' ? 'allowed' : 'blocked';
    const customBefore = ev.list.slice(0, ev.index).filter((r) => !r.builtin).length;
    const lead = `${dirWord(s.dir)}, ${s.level === 'subnet' ? `subnet ${where}` : `${where}'s network interface`} (${nsg.name}): `;
    const how = rule.builtin ? `no custom rule matches, so the built-in rule ${rule.name} (priority ${rule.priority}) decides` : `${customBefore ? `${customBefore} custom rule${customBefore === 1 ? '' : 's'} with a lower number did not match; ` : ''}rule ${rule.name} (priority ${rule.priority}) is the first match`;
    if (rule.action === 'Allow') {
      steps.push({ ok: true, text: `${lead}${how}: Allow.` });
      continue;
    }
    steps.push({ ok: false, text: `${lead}${how}: Deny. The traffic stops here${i < stages.length - 1 ? ' and later levels are never consulted' : ''}.` });
    blockedAt = i;
    // classify the failure
    const sibling = stages.find((o, j) => j !== i && o.dir === s.dir && o.vm.id === s.vm.id && o.nsgId);
    const siblingAllows = sibling ? (() => { const e2 = pgNsgEvalNsg(topo, pgNsgFind(topo, sibling.nsgId), s.dir, pkt); return !!e2.rule && e2.rule.action === 'Allow'; })() : false;
    const laterAllow = ev.list.slice(ev.index + 1).find((r) => r.action === 'Allow' && !r.builtin && pgNsgRuleMatches(topo, r, pkt));
    const base = { dir: s.dir, ruleId: rule.id, level: s.level, vmId: s.vm.id, subnetId: (s.subnet || {}).id };
    const nsgWord = s.level === 'subnet' ? `the subnet NSG ${nsg.name}` : `the NIC NSG ${nsg.name}`;
    if (sibling && siblingAllows && s.level === 'nic') {
      diagnosis = Object.assign(pgFail('nic-nsg-blocks', `The NIC's own NSG blocks it`, `Traffic has to be allowed at every level that has an NSG, and ${s.vm.name} has two: one on its subnet and one on its network interface. The subnet NSG allows this traffic, but the NIC NSG ${nsg.name} ${rule.builtin ? `has no rule that allows it, so ${rule.name} denies it` : `denies it with rule ${rule.name}`}. Opening the port at one level is not enough.`, `Allow the traffic in ${nsg.name} too, or, if that NSG is a leftover nobody needs, dissociate it from the NIC. Keeping NSGs at one level avoids this trap.`, nsg.id, 'rules'), base);
    } else if (sibling && siblingAllows && s.level === 'subnet') {
      diagnosis = Object.assign(pgFail('subnet-nsg-blocks', 'The subnet NSG blocks it', `Traffic has to be allowed at every level that has an NSG. The NSG on ${s.vm.name}'s network interface allows this traffic, but the subnet NSG ${nsg.name} ${rule.builtin ? `has no rule that allows it, so ${rule.name} denies it` : `denies it with rule ${rule.name}`}. ${s.dir === 'inbound' ? 'Inbound traffic meets the subnet NSG first' : 'Outbound traffic meets the subnet NSG after the NIC NSG'}, so the rule you opened on the NIC does not help yet.`, `Add the same Allow rule to ${nsg.name}, or move the rule so it lives at one level only.`, nsg.id, 'rules'), base);
    } else if (rule.builtin) {
      const pubNote = s.dir === 'inbound' && s.vm && s.vm.publicIp && (nsg[s.dir] || []).some((r) => String(r.dest).indexOf(s.vm.publicIp) >= 0) ? ` One rule names the public address ${s.vm.publicIp} as its destination, but inbound rules see the private address, so it never matches.` : '';
      diagnosis = Object.assign(pgFail('default-deny', `Denied by the default rule ${rule.name}`, `No rule that you created matches this traffic, so the built-in rule ${rule.name} (priority ${rule.priority}) decides. Inbound, that rule denies everything not explicitly allowed; default rules cannot be deleted, only overridden by a rule with a lower priority number.${pubNote}`, `Add an Allow rule with a priority number below ${rule.priority} (for example 100) for this source, destination and port in ${nsg.name}.`, nsg.id, 'rules'), base);
    } else if (laterAllow) {
      diagnosis = Object.assign(pgFail('lower-priority-loses', `Rule ${laterAllow.name} loses to ${rule.name}`, `Both rules match this traffic. ${laterAllow.name} (priority ${laterAllow.priority}) would allow it, but ${rule.name} (priority ${rule.priority}) is read first because a LOWER number means HIGHER priority, and the first match wins. The allow is never consulted.`, `Give ${laterAllow.name} a priority number below ${rule.priority}, or narrow ${rule.name} so it no longer matches this traffic.`, nsg.id, 'rules'), base);
    } else {
      diagnosis = Object.assign(pgFail('denied-by-rule', `Rule ${rule.name} denies it`, `${rule.name} (priority ${rule.priority}) is the first rule that matches and its action is Deny, so the traffic is dropped. Rules with higher numbers are never consulted.`, `If this traffic should be allowed, narrow ${rule.name} or add an Allow rule with a priority number below ${rule.priority}.`, nsg.id, 'rules'), base);
    }
  }
  if (diagnosis) return fail(diagnosis);

  steps.push({ ok: true, text: 'NSGs are stateful: the reply to an allowed connection travels back without needing a rule of its own.' });

  // Things that are allowed but worth a second look.
  if (!conn.noWarn && fromInternet && dst.vm && proto !== 'Icmp' && PG_NSG_MGMT_PORTS.indexOf(port) >= 0) {
    const stranger = pgNsgTest(pgNsgWithStranger(topo), { from: '__stranger', to: dst.vm.id, proto, port, noWarn: true });
    if (stranger.verdict === 'success') {
      warnings.push({ code: 'management-port-exposed', title: `${port === 3389 ? 'RDP (3389)' : 'SSH (22)'} is open to the whole internet`, text: `A random address on the internet (${PG_NSG_STRANGER_IP}) gets through too, not just the machine you meant. Management ports exposed to the internet are probed constantly. Restrict the source to your own address range, or reach the VM through a VPN or Azure Bastion.`, ruleId: null });
    }
  }
  const vnetRule = conn.noWarn ? null : hops.find((h) => h.dir === 'inbound' && h.builtin && h.rule === 'AllowVnetInBound');
  if (vnetRule && src.vm) {
    warnings.push({ code: 'vnet-default-allow', title: 'Allowed only by the built-in AllowVnetInBound rule', text: `No rule that you created matches, so the default rule AllowVnetInBound (priority 65000) let it in: by default every machine in the virtual network (and peered or connected networks) can reach this one on every port. If only certain machines should connect, add a Deny rule from VirtualNetwork with a number below 65000, below your allow rules.` });
  }
  return make('success', `${srcName} can reach ${dstName}${portText ? ` on ${proto.toUpperCase()}${portText}` : ' (ping)'}: allowed at every level.`);
}

// The stranger is a client on the internet that no rule was written for; it exists only for the exposure check above.
function pgNsgWithStranger(topo) {
  const t = topo;
  if (!(t.externals || []).some((e) => e.id === '__stranger')) return { ...t, externals: (t.externals || []).concat([{ id: '__stranger', name: 'A stranger on the internet', ip: PG_NSG_STRANGER_IP, kind: 'internet', role: 'client' }]) };
  return t;
}

/* ---- scenario fixes ---- */

// fix entries: { addRule: { nsg, dir, rule } }, { setRule: { nsg, dir, id, patch } }, { removeRule: { nsg, dir, id } },
//              { associate: { target: 'subnet'|'nic', id, nsg } }, { setPublicIp: { vm, value } }
function pgNsgApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    if (f.addRule) { const n = pgNsgFind(t, f.addRule.nsg); if (n) n[f.addRule.dir].push({ ...f.addRule.rule }); }
    else if (f.setRule) { const n = pgNsgFind(t, f.setRule.nsg); const r = n && n[f.setRule.dir].find((x) => x.id === f.setRule.id); if (r) Object.assign(r, f.setRule.patch); }
    else if (f.removeRule) { const n = pgNsgFind(t, f.removeRule.nsg); if (n) n[f.removeRule.dir] = n[f.removeRule.dir].filter((x) => x.id !== f.removeRule.id); }
    else if (f.associate) {
      if (f.associate.target === 'subnet') { const s = t.subnets.find((x) => x.id === f.associate.id); if (s) s.nsg = f.associate.nsg; }
      else { const v = pgNsgVm(t, f.associate.id); if (v) v.nic.nsg = f.associate.nsg; }
    } else if (f.setPublicIp) { const v = pgNsgVm(t, f.setPublicIp.vm); if (v) v.publicIp = f.setPublicIp.value; }
  });
  return t;
}
