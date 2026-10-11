"""Playground tool: Azure NSG tester.

One virtual network with two subnets and three VMs. Network security groups (NSGs) carry
inbound and outbound rules and can be associated with a subnet, a VM's NIC, or both. The
engine (src/js/03c_pg_nsg.js) evaluates a test connection the way the Azure documentation
describes: lowest priority number first, first match wins, built-in default rules at
65000/65001/65500, subnet NSG then NIC NSG inbound (NIC then subnet outbound), every level
that has an NSG must allow it, a level without an NSG filters nothing.

Facts checked against learn.microsoft.com: "Azure network security groups overview"
(rule properties, priority 100-4096, default rules, stateful flow records), "How network
security groups filter network traffic" (evaluation order, subnet vs NIC, VM with a Standard
public IP and no NSG), "Azure service tags overview" (Internet, VirtualNetwork,
AzureLoadBalancer) and "Public IP addresses in Azure" (Standard SKU is closed to inbound
traffic until an NSG allows it).

Shape (checked by validate() below and by build.py):
  topology = { vnet{name,space}, subnets[{id,name,cidr,nsg}], vms[{id,name,subnet,ip,publicIp,nic{nsg}}],
               nsgs[{id,name,inbound[rule],outbound[rule]}], externals[{id,name,ip,kind,role}] }
  rule = {id,name,priority,source,srcPort,dest,destPort,proto,action}
  expect / expectFixed entries: {'from','to','proto','port','verdict','code'?,'warn'?}
  fix entries: addRule / setRule / removeRule / associate / setPublicIp (see pgNsgApplyFixes)
"""

TOOL_KEY = 'nsg'

CODES = {'denied-by-rule', 'default-deny', 'lower-priority-loses', 'nic-nsg-blocks', 'subnet-nsg-blocks',
         'no-nsg-public-ip', 'no-public-ip', 'bad-config', 'bad-port', 'bad-pair'}
WARN_CODES = {'management-port-exposed', 'vnet-default-allow'}


def _r(rid, name, priority, source, dest_port, proto, action, dest='*', src_port='*'):
    return {'id': rid, 'name': name, 'priority': priority, 'source': source, 'srcPort': src_port,
            'dest': dest, 'destPort': dest_port, 'proto': proto, 'action': action}


def _base():
    """A correct, working virtual network: web subnet with a public VM, data subnet with a database."""
    return {
        'vnet': {'name': 'vnet-prod', 'space': '10.0.0.0/16'},
        'subnets': [
            {'id': 'web', 'name': 'snet-web', 'cidr': '10.0.1.0/24', 'nsg': 'nsg-web'},
            {'id': 'data', 'name': 'snet-data', 'cidr': '10.0.2.0/24', 'nsg': 'nsg-data'},
        ],
        'vms': [
            {'id': 'web1', 'name': 'vm-web', 'subnet': 'web', 'ip': '10.0.1.4', 'publicIp': '20.50.60.70', 'nic': {'nsg': None}},
            {'id': 'tool1', 'name': 'vm-test', 'subnet': 'web', 'ip': '10.0.1.5', 'publicIp': '', 'nic': {'nsg': None}},
            {'id': 'db1', 'name': 'vm-db', 'subnet': 'data', 'ip': '10.0.2.4', 'publicIp': '', 'nic': {'nsg': None}},
        ],
        'nsgs': [
            {'id': 'nsg-web', 'name': 'nsg-web',
             'inbound': [
                 _r('r-https', 'Allow-HTTPS', 100, 'Internet', '443', 'Tcp', 'Allow'),
                 _r('r-rdp', 'Allow-RDP-Office', 110, '198.51.100.20', '3389', 'Tcp', 'Allow'),
             ],
             'outbound': []},
            {'id': 'nsg-data', 'name': 'nsg-data',
             'inbound': [
                 _r('r-sql', 'Allow-SQL-Web', 100, '10.0.1.4', '1433', 'Tcp', 'Allow'),
                 _r('r-vnet-deny', 'Deny-VNet-Other', 4000, 'VirtualNetwork', '*', 'Any', 'Deny'),
             ],
             'outbound': []},
        ],
        'externals': [
            {'id': 'visitor', 'name': 'Visitor (internet)', 'ip': '203.0.113.50', 'kind': 'internet', 'role': 'client'},
            {'id': 'office', 'name': 'Office admin', 'ip': '198.51.100.20', 'kind': 'internet', 'role': 'client'},
            {'id': 'probe', 'name': 'Azure load balancer probe', 'ip': '168.63.129.16', 'kind': 'probe', 'role': 'probe'},
            {'id': 'site', 'name': 'Public website', 'ip': '93.184.216.34', 'kind': 'internet', 'role': 'server'},
        ],
    }


def _edit(fn):
    t = _base()
    fn(t)
    return t


def _nsg(t, nsg_id):
    return next(n for n in t['nsgs'] if n['id'] == nsg_id)


def _conn(frm, to, port, verdict, proto='Tcp', **extra):
    return {'from': frm, 'to': to, 'proto': proto, 'port': port, 'verdict': verdict, **extra}


SANDBOX = _base()

SCENARIOS = []


def _add(s):
    SCENARIOS.append(s)


# ---------------------------------------------------------------- starters

_add({
    'id': 'nsg-default-deny',
    'title': 'The website does not answer',
    'goal': 'No rule allows it, so the built-in deny wins: allow HTTPS in, and nothing else.',
    'level': 'starter',
    'story': 'The web server in the web subnet is running and has a public IP address. Visitors on the internet get no answer on port 443. Nobody remembers writing a deny rule.',
    'topology': _edit(lambda t: _nsg(t, 'nsg-web').update({'inbound': [r for r in _nsg(t, 'nsg-web')['inbound'] if r['id'] != 'r-https']})),
    'ask': _conn('visitor', 'web1', 443, 'success'),
    'expect': [_conn('visitor', 'web1', 443, 'failed', code='default-deny')],
    'hints': [
        'Read the path: which level stops the traffic, and which rule was the first match?',
        'You did not write that rule. Every NSG has built-in rules you cannot delete: which one denies inbound traffic that nobody allowed?',
        'Add an Allow rule for TCP 443 from the internet. Give it a number below 65000.',
    ],
    'fix': [{'addRule': {'nsg': 'nsg-web', 'dir': 'inbound', 'rule': _r('r-https', 'Allow-HTTPS', 100, 'Internet', '443', 'Tcp', 'Allow')}}],
    'fixText': ['In nsg-web, add an inbound rule: source Internet, destination any, destination port 443, protocol TCP, action Allow, priority 100.'],
    'expectFixed': [_conn('visitor', 'web1', 443, 'success'), _conn('visitor', 'web1', 3389, 'failed')],
    'lesson': 'Every NSG ends with built-in rules (65000, 65001 and 65500) that you cannot delete. DenyAllInBound at 65500 drops anything from the internet that no rule of yours allows, so a web server needs an explicit Allow for its port. Your rules use numbers from 100 to 4096, which always come before the defaults.',
    'related': ['AZ-104: network security groups', 'AZ-900: Azure networking'],
})

_add({
    'id': 'nsg-rdp-exposed',
    'title': 'Remote Desktop is open to everyone',
    'goal': 'Keep RDP working for the office only, not for the whole internet.',
    'level': 'starter',
    'story': 'A security scan flagged the web VM: port 3389 answers to anybody. The admin who needed remote access last year created a rule with the source set to "any" and never changed it back.',
    'topology': _edit(lambda t: _nsg(t, 'nsg-web').update({'inbound': [_r('r-https', 'Allow-HTTPS', 100, 'Internet', '443', 'Tcp', 'Allow'), _r('r-rdp', 'Allow-RDP-Any', 110, '*', '3389', 'Tcp', 'Allow')]})),
    'ask': _conn('visitor', 'web1', 3389, 'success'),
    'expect': [_conn('visitor', 'web1', 3389, 'success', warn='management-port-exposed')],
    'hints': [
        'Run the test from a visitor. It is allowed, which is exactly the problem: read the warning.',
        'The rule is fine except for one field. Who should be able to reach port 3389?',
    ],
    'fix': [{'setRule': {'nsg': 'nsg-web', 'dir': 'inbound', 'id': 'r-rdp', 'patch': {'name': 'Allow-RDP-Office', 'source': '198.51.100.20'}}}],
    'fixText': ['Change the source of the RDP rule from * to the office address 198.51.100.20 (a /32, or the office range). Better still, remove the rule and use Azure Bastion or a VPN.'],
    'expectFixed': [_conn('visitor', 'web1', 3389, 'failed'), _conn('office', 'web1', 3389, 'success')],
    'lesson': 'A rule that allows a management port (3389 for RDP, 22 for SSH) from any source exposes the VM to every scanner on the internet. Limit the source to the addresses that really need it. The rule keeps working for them, and everyone else falls through to the default deny.',
    'related': ['AZ-104: network security groups', 'SC-500: network perimeter security'],
})

# ---------------------------------------------------------------- core

_add({
    'id': 'nsg-priority-order',
    'title': 'The allow rule is there, and ignored',
    'goal': 'A LOWER priority number is read first, so the allow needs a lower number than the deny.',
    'level': 'core',
    'story': 'The team added a rule to deny all inbound traffic from the internet, then added an allow for HTTPS. The allow rule is listed, enabled and correct, yet visitors cannot reach the site.',
    'topology': _edit(lambda t: _nsg(t, 'nsg-web').update({'inbound': [
        _r('r-rdp', 'Allow-RDP-Office', 110, '198.51.100.20', '3389', 'Tcp', 'Allow'),
        _r('r-deny', 'Deny-Internet-Inbound', 300, 'Internet', '*', 'Any', 'Deny'),
        _r('r-https', 'Allow-HTTPS', 400, 'Internet', '443', 'Tcp', 'Allow'),
    ]})),
    'ask': _conn('visitor', 'web1', 443, 'success'),
    'expect': [_conn('visitor', 'web1', 443, 'failed', code='lower-priority-loses')],
    'hints': [
        'Look at the two priority numbers. Which rule is read first?',
        'In an NSG the first rule that matches stops the search, and the rule with the LOWER number is read first. The firewall tool counted by list position; here only the number counts.',
    ],
    'fix': [{'setRule': {'nsg': 'nsg-web', 'dir': 'inbound', 'id': 'r-https', 'patch': {'priority': 200}}}],
    'fixText': ['Give Allow-HTTPS a number below 300 (for example 200) so it is read before the deny. Keep the deny: it still blocks every other port from the internet.'],
    'expectFixed': [_conn('visitor', 'web1', 443, 'success'), _conn('visitor', 'web1', 8080, 'failed')],
    'lesson': 'NSG rules are ordered by their priority number, lowest first, not by where they sit in a list, and the first match wins. A specific allow must have a lower number than the broader deny it is meant to override. Leaving gaps between numbers (100, 200, 300) makes room to insert rules later.',
    'related': ['AZ-104: NSG rule priority', 'AZ-900: Azure networking'],
})

_add({
    'id': 'nsg-nic-forgotten',
    'title': 'Allowed on the subnet, blocked anyway',
    'goal': 'Traffic must be allowed at every level that has an NSG, including the NIC.',
    'level': 'core',
    'story': 'The subnet NSG allows HTTPS from the internet, and it has done so for months. After a rebuild, visitors cannot reach the web VM. Nobody changed the subnet rules.',
    'topology': _edit(lambda t: (
        t['nsgs'].append({'id': 'nsg-vm-old', 'name': 'nsg-vm-web-old', 'inbound': [_r('r-ssh', 'Allow-SSH-Admin', 100, '198.51.100.20', '22', 'Tcp', 'Allow')], 'outbound': []}),
        t['vms'][0]['nic'].update({'nsg': 'nsg-vm-old'}),
    )),
    'ask': _conn('visitor', 'web1', 443, 'success'),
    'expect': [_conn('visitor', 'web1', 443, 'failed', code='nic-nsg-blocks')],
    'hints': [
        'The path shows two inbound levels for this VM. Which one blocks?',
        'Where else can an NSG be attached besides the subnet? Look at the associations of the VM.',
    ],
    'fix': [{'associate': {'target': 'nic', 'id': 'web1', 'nsg': None}}],
    'fixText': ['Dissociate the leftover NSG nsg-vm-web-old from the VM\'s network interface (or add an allow rule for TCP 443 to it). One level of NSG is easier to reason about than two.'],
    'expectFixed': [_conn('visitor', 'web1', 443, 'success')],
    'lesson': 'An NSG can sit on the subnet, on the network interface, or on both. Inbound traffic meets the subnet NSG first and the NIC NSG second, and it needs an allow at every level that has one. A forgotten NIC-level NSG silently overrides a perfectly good subnet rule; Microsoft advises choosing one level.',
    'related': ['AZ-104: NSG association', 'SC-500: network perimeter security'],
})

_add({
    'id': 'nsg-outbound-blocked',
    'title': 'The VM cannot reach the internet',
    'goal': 'Allow outbound HTTPS only, ahead of the deny that is already there.',
    'level': 'core',
    'story': 'Security hardened the web subnet by denying outbound internet traffic. Now the VM cannot download updates or call the payment provider over HTTPS. Mail relay on port 25 must stay blocked.',
    'topology': _edit(lambda t: _nsg(t, 'nsg-web').update({'outbound': [_r('r-out-deny', 'Deny-Internet-Out', 200, '*', '*', 'Any', 'Deny', dest='Internet')]})),
    'ask': _conn('web1', 'site', 443, 'success'),
    'expect': [_conn('web1', 'site', 443, 'failed', code='denied-by-rule')],
    'hints': [
        'Outbound traffic has default rules too. Which rule matched first this time?',
        'You need an outbound Allow for TCP 443 to the internet. Mind its number against the deny.',
    ],
    'fix': [{'addRule': {'nsg': 'nsg-web', 'dir': 'outbound', 'rule': _r('r-out-https', 'Allow-HTTPS-Out', 100, '*', '443', 'Tcp', 'Allow', dest='Internet')}}],
    'fixText': ['Add an outbound rule to nsg-web: destination Internet, destination port 443, TCP, Allow, with a number lower than the deny (for example 100).'],
    'expectFixed': [_conn('web1', 'site', 443, 'success'), _conn('web1', 'site', 25, 'failed')],
    'lesson': 'Outbound traffic is filtered too. By default AllowInternetOutBound (65001) lets VMs reach the internet, and a custom Deny with a lower number overrides it. To permit just one port you add an Allow with an even lower number; the replies to allowed connections need no rule, because NSGs are stateful.',
    'related': ['AZ-104: NSG outbound rules', 'SC-500: network perimeter security'],
})

# ---------------------------------------------------------------- stretch

_add({
    'id': 'nsg-subnet-blocks',
    'title': 'I opened port 8080 and it is still closed',
    'goal': 'Open the port at the subnet level too: both NSGs have to allow it.',
    'level': 'stretch',
    'story': 'A developer added a rule for port 8080 to the NSG on the VM\'s network interface, tested it, and still cannot connect from the internet. HTTPS on 443 works.',
    'topology': _edit(lambda t: (
        t['nsgs'].append({'id': 'nsg-vm-app', 'name': 'nsg-vm-web', 'inbound': [
            _r('r-app-https', 'Allow-HTTPS', 100, 'Internet', '443', 'Tcp', 'Allow'),
            _r('r-app-8080', 'Allow-8080', 110, 'Internet', '8080', 'Tcp', 'Allow'),
        ], 'outbound': []}),
        t['vms'][0]['nic'].update({'nsg': 'nsg-vm-app'}),
    )),
    'ask': _conn('visitor', 'web1', 8080, 'success'),
    'expect': [_conn('visitor', 'web1', 8080, 'failed', code='subnet-nsg-blocks'), _conn('visitor', 'web1', 443, 'success')],
    'hints': [
        'The NIC-level NSG has the rule. Does the path ever get that far?',
        'Inbound traffic meets the subnet NSG first. What does it say about port 8080?',
    ],
    'fix': [{'addRule': {'nsg': 'nsg-web', 'dir': 'inbound', 'rule': _r('r-8080', 'Allow-8080', 120, 'Internet', '8080', 'Tcp', 'Allow')}}],
    'fixText': ['Add an inbound Allow rule for TCP 8080 from the internet to the subnet NSG nsg-web as well (it already has one for 443). Now both levels allow it.'],
    'expectFixed': [_conn('visitor', 'web1', 8080, 'success'), _conn('visitor', 'web1', 443, 'success')],
    'lesson': 'When a subnet and a NIC both carry an NSG, a packet must pass both: inbound the subnet NSG first, outbound the NIC NSG first. Opening a port at only one level changes nothing, and the level that blocks is the one to read in the path. Put your rules at one level where you can.',
    'related': ['AZ-104: NSG association', 'AZ-104: effective security rules'],
})

_add({
    'id': 'nsg-vnet-surprise',
    'title': 'The database answers a machine it should not',
    'goal': 'Only the web server may reach the database. The default AllowVnetInBound also lets every other VM in.',
    'level': 'stretch',
    'story': 'The data subnet NSG has one rule: SQL (1433) from the web server. The team assumed that meant nobody else could connect. A test VM in the web subnet connects to the database on SQL and on SSH.',
    'topology': _edit(lambda t: _nsg(t, 'nsg-data').update({'inbound': [r for r in _nsg(t, 'nsg-data')['inbound'] if r['id'] != 'r-vnet-deny']})),
    'ask': _conn('tool1', 'db1', 1433, 'success'),
    'expect': [_conn('tool1', 'db1', 1433, 'success', warn='vnet-default-allow')],
    'hints': [
        'Read the matched rule at the data subnet. Is it one you wrote?',
        'The built-in AllowVnetInBound (65000) allows traffic from anywhere in the virtual network. To shut it out you need a Deny of your own, with a number below 65000 and above your allow rules.',
    ],
    'fix': [{'addRule': {'nsg': 'nsg-data', 'dir': 'inbound', 'rule': _r('r-vnet-deny', 'Deny-VNet-Other', 4000, 'VirtualNetwork', '*', 'Any', 'Deny')}}],
    'fixText': ['In nsg-data add an inbound rule: source VirtualNetwork, any port, any protocol, action Deny, priority 4000. The allow for the web server (priority 100) is read first and keeps working.'],
    'expectFixed': [_conn('web1', 'db1', 1433, 'success'), _conn('tool1', 'db1', 1433, 'failed'), _conn('tool1', 'db1', 22, 'failed')],
    'lesson': 'The default AllowVnetInBound rule means every VM in the virtual network (and in peered or connected networks) can reach every other VM on every port unless you say otherwise. Allow rules alone do not isolate a tier; you add a Deny from VirtualNetwork with a number between your allows and 65000.',
    'related': ['AZ-104: default security rules', 'SC-500: network perimeter security', 'AZ-900: Azure networking'],
})

_add({
    'id': 'nsg-no-nsg-public-ip',
    'title': 'A public IP and no NSG: closed',
    'goal': 'A VM with a Standard public IP only accepts internet traffic once an NSG allows it.',
    'level': 'stretch',
    'story': 'A new VM has a public IP address and a web server. An NSG named nsg-web with the right HTTPS rule was created for it. From the internet, nothing answers, although the NSG exists and the rule is right.',
    'topology': _edit(lambda t: t['subnets'][0].update({'nsg': None})),
    'ask': _conn('visitor', 'web1', 443, 'success'),
    'expect': [_conn('visitor', 'web1', 443, 'failed', code='no-nsg-public-ip')],
    'hints': [
        'The path shows no NSG at either level for the VM. Is the NSG that was created attached to anything?',
        'Find the association settings for the subnet and the NIC.',
    ],
    'fix': [{'associate': {'target': 'subnet', 'id': 'web', 'nsg': 'nsg-web'}}],
    'fixText': ['Associate nsg-web with the subnet snet-web (or with the VM\'s NIC). Creating an NSG does nothing until it is associated.'],
    'expectFixed': [_conn('visitor', 'web1', 443, 'success')],
    'lesson': 'An NSG only filters traffic once it is associated with a subnet or a network interface. A VM with a Standard SKU public IP address is closed to inbound traffic by default, so with no NSG at all nothing from the internet gets in: you need an NSG that allows it. Where a level has no NSG, that level simply does not filter.',
    'related': ['AZ-104: NSG association', 'AZ-900: Azure networking'],
})

LESSON_LINKS = [
    {'track': 'az104', 'lesson': 'az104-networking', 'tool': 'nsg', 'pick': 'nsg-priority-order', 'label': 'NSG rules: the lower number wins', 'blurb': 'An allow that loses to a deny because of its priority number.'},
    {'track': 'az104', 'lesson': 'az104-networking', 'tool': 'nsg', 'pick': 'nsg-nic-forgotten', 'label': 'Subnet NSG and NIC NSG together', 'blurb': 'Why a forgotten NIC-level NSG blocks traffic the subnet allows.'},
    {'track': 'sc500', 'lesson': 'network-perimeter-security', 'tool': 'nsg', 'pick': 'nsg-vnet-surprise', 'label': 'The default rule that lets the whole VNet in', 'blurb': 'AllowVnetInBound and how to isolate a tier.'},
    {'track': 'sc500', 'lesson': 'network-perimeter-security', 'tool': 'nsg', 'pick': 'nsg-rdp-exposed', 'label': 'RDP open to the internet', 'blurb': 'Spot and fix an overly broad management-port rule.'},
    {'track': 'az900', 'lesson': 'networking', 'tool': 'nsg', 'pick': 'nsg-default-deny', 'label': 'Why a public VM does not answer', 'blurb': 'The built-in deny and the Allow rule that opens a port.'},
]

_RULE_KEYS = ('id', 'name', 'priority', 'source', 'srcPort', 'dest', 'destPort', 'proto', 'action')
_TOPO_KEYS = ('vnet', 'subnets', 'vms', 'nsgs', 'externals')


def _topo_errors(label, t):
    errs = []
    if not isinstance(t, dict) or any(k not in t for k in _TOPO_KEYS):
        return [f'{label}: topology needs {", ".join(_TOPO_KEYS)}']
    if len(t['subnets']) != 2:
        errs.append(f'{label}: exactly two subnets expected')
    nsg_ids = [n.get('id') for n in t['nsgs']]
    if len(nsg_ids) != len(set(nsg_ids)):
        errs.append(f'{label}: duplicate NSG ids')
    for s in t['subnets']:
        if s.get('nsg') is not None and s['nsg'] not in nsg_ids:
            errs.append(f"{label}: subnet '{s.get('id')}' names an unknown NSG")
    ids = {s['id'] for s in t['subnets']}
    vm_ids = [v.get('id') for v in t['vms']]
    if len(vm_ids) != len(set(vm_ids)) or len(vm_ids) < 3:
        errs.append(f'{label}: VM ids must be unique and there should be at least three VMs')
    for v in t['vms']:
        if v.get('subnet') not in ids:
            errs.append(f"{label}: VM '{v.get('id')}' is in an unknown subnet")
        if (v.get('nic') or {}).get('nsg') not in [None] + nsg_ids:
            errs.append(f"{label}: VM '{v.get('id')}' NIC names an unknown NSG")
    for n in t['nsgs']:
        for d in ('inbound', 'outbound'):
            prios = []
            for r in n.get(d, []):
                if any(k not in r for k in _RULE_KEYS):
                    errs.append(f"{label}: NSG '{n.get('id')}' has a rule missing a field")
                    continue
                if not isinstance(r['priority'], int) or not 100 <= r['priority'] <= 4096:
                    errs.append(f"{label}: rule '{r['id']}' priority must be an integer 100-4096")
                if r['proto'] not in ('Tcp', 'Udp', 'Icmp', 'Any') or r['action'] not in ('Allow', 'Deny'):
                    errs.append(f"{label}: rule '{r['id']}' has a bad protocol or action")
                prios.append(r['priority'])
            if len(prios) != len(set(prios)):
                errs.append(f"{label}: NSG '{n.get('id')}' {d} has a duplicate priority")
    return errs


def validate():
    errs = []
    errs.extend(_topo_errors('sandbox', SANDBOX))
    if not 6 <= len(SCENARIOS) <= 8:
        errs.append(f'expected 6 to 8 scenarios, found {len(SCENARIOS)}')
    levels = [s['level'] for s in SCENARIOS]
    if levels.count('starter') < 2 or levels.count('core') < 3 or not (1 <= levels.count('stretch') <= 3):
        errs.append('level mix should be 2+ starter, 3+ core and 1-3 stretch')
    for sc in SCENARIOS:
        label = f"scenario '{sc['id']}'"
        errs.extend(_topo_errors(label, sc['topology']))
        ends = {v['id'] for v in sc['topology']['vms']} | {e['id'] for e in sc['topology']['externals']}
        for key in ('expect', 'expectFixed'):
            for ex in sc[key]:
                if ex.get('from') not in ends or ex.get('to') not in ends:
                    errs.append(f'{label}: {key} names an unknown endpoint')
                if ex.get('verdict') not in ('success', 'failed'):
                    errs.append(f'{label}: {key} verdict must be success or failed')
                if ex.get('code') and ex['code'] not in CODES:
                    errs.append(f"{label}: unknown diagnosis code '{ex['code']}'")
                if ex.get('warn') and ex['warn'] not in WARN_CODES:
                    errs.append(f"{label}: unknown warning code '{ex['warn']}'")
                if ex.get('proto') not in ('Tcp', 'Udp', 'Icmp'):
                    errs.append(f'{label}: {key} needs a proto of Tcp, Udp or Icmp')
        if not any(ex.get('code') or ex.get('warn') for ex in sc['expect']):
            errs.append(f'{label}: expect needs a diagnosis code or a warning to teach from')
        if not (1 <= len(sc['hints']) <= 3):
            errs.append(f'{label}: needs 1 to 3 hints')
        for f in sc['fix']:
            if not any(k in f for k in ('addRule', 'setRule', 'removeRule', 'associate', 'setPublicIp')):
                errs.append(f'{label}: unknown fix entry {sorted(f)}')
        if sc.get('ask') and (sc['ask'].get('from') not in ends or sc['ask'].get('to') not in ends):
            errs.append(f'{label}: ask names an unknown endpoint')
    return errs
