"""IT Playground tool: Spanning Tree lab.

Exports TOOL_KEY, SCENARIOS, SANDBOX, LESSON_LINKS and validate(). The engine is
src/js/03c_pg_stp.js (pgStpCompute, pgStpTest, pgStpApplyFixes); the screens are
src/js/04l_pg_stp.jsx; tools/checks/stp.js replays every scenario through the engine.

Topology shape (one VLAN, one spanning tree, every link a point-to-point segment):
  costTable: 'short' (802.1D-1998 recommended: 10G=2, 1G=4, 100M=19, 10M=100) or
             'long' (802.1t / 802.1D-2004: 10G=2000, 1G=20000, 100M=200000, 10M=2000000)
  switches:  {id, name, priority (multiple of 4096), mac, stp (False = STP off), pos [x, y]}
  links:     {id, speed (Mbps), disabled, a: {sw, port, cost (None = automatic), prio (None = 128)}, b: {...}}
  edges:     {id, sw, port, name, device ('pc' | 'switch'), portfast, bpduGuard, rogue: {priority, mac}}
MAC addresses are made up; 00:00:5e:00:53:xx is the documentation range, used for "old" switches.

Goal / expectation checks understood by pgStpTest:
  {'check': 'root', 'switch': id}                  the switch is the (only) root bridge
  {'check': 'backup-root', 'switch': id}           the switch would win the election if the root failed
  {'check': 'path', 'from': id, 'to': id, 'via': link id}   traffic between two switches uses that link
  {'check': 'forwarding', 'link': id}              the link is forwarding at both ends
  {'check': 'survive', 'link': id}                 cutting the link leaves every switch connected
  {'check': 'redundant'}                           no single cable failure cuts a switch off
  {'check': 'no-loop'} / {'check': 'health'}       no forwarding loop / no loop and everything reachable
"""

TOOL_KEY = 'stp'

CHECKS = {'root', 'backup-root', 'path', 'forwarding', 'survive', 'redundant', 'no-loop', 'health'}
SPEEDS = (10, 100, 1000, 10000)


def _sw(sid, name, priority, mac, pos, stp=True):
    return {'id': sid, 'name': name, 'priority': priority, 'mac': mac, 'stp': stp, 'pos': pos}


def _lk(lid, a, a_port, b, b_port, speed, disabled=False, a_cost=None, b_cost=None):
    return {
        'id': lid, 'speed': speed, 'disabled': disabled,
        'a': {'sw': a, 'port': a_port, 'cost': a_cost, 'prio': None},
        'b': {'sw': b, 'port': b_port, 'cost': b_cost, 'prio': None},
    }


def _pc(eid, sw, port, name, portfast=False, guard=False):
    return {'id': eid, 'sw': sw, 'port': port, 'name': name, 'device': 'pc', 'portfast': portfast, 'bpduGuard': guard,
            'rogue': {'priority': 32768, 'mac': '00:00:5e:00:53:99'}}


# ---- three building blocks: a triangle, two cores with two access switches, and the same with an old closet switch ----

def _triangle():
    return {
        'costTable': 'short',
        'switches': [
            _sw('core1', 'Core-1', 32768, '7a:10:00:00:00:01', [160, 40]),
            _sw('dist1', 'Dist-1', 32768, '7a:10:00:00:00:02', [64, 150]),
            _sw('acc1', 'Acc-1', 32768, '00:00:5e:00:53:07', [256, 150]),
        ],
        'links': [
            _lk('cd', 'core1', 'Te0/1', 'dist1', 'Te0/1', 10000),
            _lk('ca', 'core1', 'Gi0/2', 'acc1', 'Gi0/1', 1000),
            _lk('da', 'dist1', 'Gi0/2', 'acc1', 'Gi0/2', 1000),
        ],
        'edges': [],
    }


def _two_cores():
    return {
        'costTable': 'short',
        'switches': [
            _sw('core1', 'Core-1', 4096, '7a:10:00:00:00:01', [76, 40]),
            _sw('core2', 'Core-2', 8192, '7a:10:00:00:00:02', [244, 40]),
            _sw('acc1', 'Acc-1', 32768, '7a:20:00:00:00:01', [76, 150]),
            _sw('acc2', 'Acc-2', 32768, '7a:20:00:00:00:02', [244, 150]),
        ],
        'links': [
            _lk('cc', 'core1', 'Te0/1', 'core2', 'Te0/1', 10000),
            _lk('a1c1', 'core1', 'Gi0/2', 'acc1', 'Gi0/1', 1000),
            _lk('a1c2', 'core2', 'Gi0/2', 'acc1', 'Gi0/2', 1000),
            _lk('a2c1', 'core1', 'Gi0/3', 'acc2', 'Gi0/1', 1000),
            _lk('a2c2', 'core2', 'Gi0/3', 'acc2', 'Gi0/2', 1000),
        ],
        'edges': [],
    }


def _with_old_switch():
    """Two cores, two access switches and an old closet switch with Fast Ethernet uplinks and the lowest MAC."""
    t = _two_cores()
    for s in t['switches']:
        s['priority'] = 32768
    t['switches'][0]['pos'] = [86, 38]
    t['switches'][1]['pos'] = [234, 38]
    t['switches'][2]['pos'] = [44, 150]
    t['switches'][3]['pos'] = [276, 150]
    t['switches'].insert(3, _sw('old', 'Acc-Old', 32768, '00:00:5e:00:53:07', [160, 150]))
    t['links'] += [
        _lk('oc1', 'core1', 'Fa0/4', 'old', 'Fa0/1', 100),
        _lk('oc2', 'core2', 'Fa0/4', 'old', 'Fa0/2', 100),
    ]
    return t


def _edit(base, fn):
    t = base()
    fn(t)
    return t


def _set(t, sid, **kw):
    for s in t['switches']:
        if s['id'] == sid:
            s.update(kw)


def _link(t, lid):
    return next(x for x in t['links'] if x['id'] == lid)


SANDBOX = _edit(_two_cores, lambda t: t.update({'edges': [
    _pc('e1', 'acc1', 'Fa0/10', 'Office PC', portfast=True, guard=True),
    _pc('e2', 'acc2', 'Fa0/10', 'Wall socket 12'),
]}))

SCENARIOS = []


def _add(s):
    SCENARIOS.append(s)


# 1. Nobody set a priority ---------------------------------------------------------------------------------------------
_add({
    'id': 'stp-default-priorities',
    'title': 'Nobody set a priority',
    'goal': 'Make the core switch the root bridge instead of leaving it to the MAC addresses.',
    'level': 'starter',
    'story': 'A new three-switch block was cabled up and spanning tree was left on its defaults. The 10 Gbps link between Core-1 and Dist-1 shows as blocked, and traffic between those two switches goes the long way round through the access switch on 1 Gbps links.',
    'topology': _triangle(),
    'ask': {'check': 'root', 'switch': 'core1'},
    'expect': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'failed', 'code': 'wrong-root'},
        {'check': 'path', 'from': 'dist1', 'to': 'core1', 'via': 'cd', 'verdict': 'failed', 'code': 'suboptimal-path'},
    ],
    'hints': [
        'Read the election in the result: how many switches share the lowest priority, and what decides between them?',
        'With equal priorities the lowest MAC address wins, and Acc-1 has the lowest MAC. Nothing in the network says the core should be the root.',
        'Open the switch settings and give Core-1 a bridge priority lower than 32768 (4096 is the usual choice).',
    ],
    'fix': [{'switch': 'core1', 'field': 'priority', 'value': 4096}],
    'fixText': [
        'Set Core-1 to bridge priority 4096. It now wins on priority, before MAC addresses are compared, so the 10 Gbps core link forwards and the Dist-1 to Acc-1 cable becomes the standby (alternate) path.',
    ],
    'expectFixed': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'success'},
        {'check': 'path', 'from': 'dist1', 'to': 'core1', 'via': 'cd', 'verdict': 'success'},
    ],
    'lesson': 'The root bridge is the switch with the lowest bridge ID: the priority first (default 32768), then the MAC address. If nobody sets a priority, the lowest MAC address wins, which is usually just the oldest switch and can sit anywhere in the building. Set a low priority on the switch you want at the centre of the tree, so the design decides and not the hardware.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 2. STP turned off ----------------------------------------------------------------------------------------------------
_add({
    'id': 'stp-disabled-loop',
    'title': 'Spanning tree switched off on one switch',
    'goal': 'Stop the broadcast storm without giving up the redundant cables.',
    'level': 'starter',
    'story': 'Acc-2 kept reporting port changes, so someone turned spanning tree off on it. Since then the whole floor is crawling, the switch CPUs are maxed out and users see random disconnects.',
    'topology': _edit(_two_cores, lambda t: _set(t, 'acc2', stp=False)),
    'ask': {'check': 'no-loop'},
    'expect': [
        {'check': 'no-loop', 'verdict': 'failed', 'code': 'loop-no-stp'},
        {'check': 'redundant', 'verdict': 'success'},
    ],
    'hints': [
        'Look at the Acc-2 card: what is its STP setting? What does a switch do with its ports when STP is off?',
        'A switch with STP off forwards on every port. Core-1, Core-2 and Acc-2 now form a closed ring of forwarding links.',
        'Turn STP back on for Acc-2 so one port in the ring is blocked. Cutting a cable would also stop the loop, but then a single cable failure would cut a switch off, and the goal rules that out.',
    ],
    'fix': [{'switch': 'acc2', 'field': 'stp', 'value': True}],
    'fixText': [
        'Turn STP on for Acc-2. Its link to Core-2 becomes an alternate port and discards, so there is no loop, and the cable stays in place as the standby path.',
    ],
    'expectFixed': [
        {'check': 'no-loop', 'verdict': 'success'},
        {'check': 'redundant', 'verdict': 'success'},
    ],
    'lesson': 'Redundant cables only work because STP blocks one port in every ring. A switch with STP off keeps all its ports forwarding and the ring is closed. Ethernet frames carry no time-to-live, so a broadcast circulates until the links or CPUs are saturated: a broadcast storm. If STP seems to cause trouble, find the cause (for example, put PortFast on edge ports) instead of switching it off.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 3. Old closet switch is the root -------------------------------------------------------------------------------------
_add({
    'id': 'stp-old-low-mac',
    'title': 'An old closet switch is the root',
    'goal': 'Move the root bridge back to Core-1 and get the core link forwarding again.',
    'level': 'core',
    'story': 'The core was refreshed over the weekend and the new switches arrived on factory defaults. On Monday the 10 Gbps link between the cores is blocked, and traffic between them goes through the old print-room switch over its 100 Mbps uplinks.',
    'topology': _with_old_switch(),
    'ask': {'check': 'root', 'switch': 'core1'},
    'expect': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'failed', 'code': 'wrong-root'},
        {'check': 'forwarding', 'link': 'cc', 'verdict': 'failed', 'code': 'suboptimal-path'},
    ],
    'hints': [
        'Find the root bridge in the result. Is it one of the cores?',
        'Every priority is 32768, so the MAC address decides. Compare the MAC of Acc-Old with the cores: which one is lowest, comparing byte by byte from the left?',
        'A MAC address cannot be changed, so change the priority: lower Core-1 (4096), or raise Acc-Old so it can never win.',
    ],
    'fix': [{'switch': 'core1', 'field': 'priority', 'value': 4096}],
    'fixText': [
        'Set Core-1 to bridge priority 4096 so it wins on priority. (Giving Acc-Old a high number such as 61440 also keeps it from winning, but setting the root you want is the better habit.)',
    ],
    'expectFixed': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'success'},
        {'check': 'forwarding', 'link': 'cc', 'verdict': 'success'},
    ],
    'lesson': 'When priorities tie, the lowest MAC address wins, and old equipment tends to have low MAC addresses. Replacing a core switch with a factory-default one quietly moves the root to whatever old switch has the lowest MAC. Every root and backup root should have an explicit priority configured, so that a hardware swap cannot change the design.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 4. Manual cost -------------------------------------------------------------------------------------------------------
_add({
    'id': 'stp-manual-cost',
    'title': 'The 10 Gbps uplink sits idle',
    'goal': 'Make Acc-1 use its direct 10 Gbps uplink to the root.',
    'level': 'core',
    'story': 'Acc-1 has a 10 Gbps uplink to Core-1 and a 1 Gbps uplink to Core-2. The link is up and error-free, yet all of Acc-1\'s traffic crawls over the 1 Gbps cable and the 10 Gbps one shows almost no traffic.',
    'topology': {
        'costTable': 'short',
        'switches': [
            _sw('core1', 'Core-1', 4096, '7a:10:00:00:00:01', [76, 40]),
            _sw('core2', 'Core-2', 8192, '7a:10:00:00:00:02', [244, 40]),
            _sw('acc1', 'Acc-1', 32768, '7a:20:00:00:00:01', [160, 150]),
        ],
        'links': [
            _lk('cc', 'core1', 'Te0/1', 'core2', 'Te0/1', 10000),
            _lk('a1c1', 'core1', 'Te0/2', 'acc1', 'Te0/1', 10000, b_cost=100),
            _lk('a1c2', 'core2', 'Gi0/2', 'acc1', 'Gi0/2', 1000),
        ],
        'edges': [],
    },
    'ask': {'check': 'path', 'from': 'acc1', 'to': 'core1', 'via': 'a1c1'},
    'expect': [
        {'check': 'path', 'from': 'acc1', 'to': 'core1', 'via': 'a1c1', 'verdict': 'failed', 'code': 'suboptimal-path'},
    ],
    'hints': [
        'Is the 10 Gbps link forwarding or blocked? Read the role and the reason shown for Acc-1\'s port on it.',
        'A switch adds the cost of the port a BPDU arrives on. Look at the cost shown for Acc-1\'s port towards Core-1: is it what a 10 Gbps link should have?',
        'Open the link settings and clear the manual cost on Acc-1\'s end of the Core-1 link, so it is automatic again.',
    ],
    'fix': [{'link': 'a1c1', 'end': 'b', 'field': 'cost', 'value': None}],
    'fixText': [
        'Clear the manual cost (100) on Acc-1\'s port towards Core-1. With automatic costs the direct 10 Gbps path costs 2, which beats the 1 Gbps detour through Core-2 (4 + 2 = 6), so the direct link becomes the root port.',
    ],
    'expectFixed': [
        {'check': 'path', 'from': 'acc1', 'to': 'core1', 'via': 'a1c1', 'verdict': 'success'},
    ],
    'lesson': 'STP chooses the path with the lowest total cost to the root, not the one that looks fastest on the wiring diagram. Each switch adds the cost of the port a BPDU arrives on, so a forgotten manual cost on one port can make the best link a blocked standby. Automatic costs follow the link speed; if you set a cost by hand, document why, and check it again when the cable or the speed changes.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 5. The standby uplink was disabled ------------------------------------------------------------------------------------
_add({
    'id': 'stp-standby-disabled',
    'title': 'The "unused" uplink was shut down',
    'goal': 'Give Acc-1 a standby path, so losing the cable to Core-1 does not cut it off.',
    'level': 'core',
    'story': 'Acc-1 has two uplinks, but one of its ports showed as blocking, so someone shut that link down to tidy up. This morning a contractor cut the cable between Acc-1 and Core-1, and the whole floor went dark.',
    'topology': _edit(_two_cores, lambda t: _link(t, 'a1c2').update({'disabled': True})),
    'ask': {'check': 'survive', 'link': 'a1c1'},
    'expect': [
        {'check': 'survive', 'link': 'a1c1', 'verdict': 'failed', 'code': 'no-redundancy'},
    ],
    'hints': [
        'Look at the links: which of Acc-1\'s cables is down, and what does that leave Acc-1 with if its other cable fails?',
        'A blocked (alternate) port is not a fault. It is the standby path that STP keeps ready, and disabling it removes the redundancy.',
        'Bring the Acc-1 to Core-2 link back up, then use the cable-cut buttons on the diagram to cut the Core-1 cable and watch which port takes over.',
    ],
    'fix': [{'link': 'a1c2', 'field': 'disabled', 'value': False}],
    'fixText': [
        'Bring the Acc-1 to Core-2 link back up. STP keeps its Acc-1 end as an alternate port (blocking in classic STP, discarding in RSTP). When the Core-1 cable is cut, that alternate port becomes the root port and starts forwarding.',
    ],
    'expectFixed': [
        {'check': 'survive', 'link': 'a1c1', 'verdict': 'success'},
        {'check': 'health', 'verdict': 'success'},
    ],
    'lesson': 'A port that STP keeps in the discarding state (classic STP: blocking) is doing its job: it is the alternate path, ready to take over. Shutting it down throws the redundancy away. After a failure classic STP needs about 30 seconds (listening 15 s plus learning 15 s with default timers) for a directly detected failure, and up to about 50 seconds when the max age timer has to expire first; RSTP lets an alternate port take over much faster, typically in about a second on point-to-point links.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 6. Root and backup root ----------------------------------------------------------------------------------------------
_add({
    'id': 'stp-root-and-backup',
    'title': 'Set a root and a backup root',
    'goal': 'Core-1 is the root, and Core-2 takes over if Core-1 dies.',
    'level': 'stretch',
    'story': 'The design says Core-1 is the root and Core-2 the backup. To make both cores "preferred", the engineer set priority 4096 on each. Now Core-2 is the root, and nobody is sure what happens when it fails.',
    'topology': _edit(_two_cores, lambda t: (_set(t, 'core1', priority=4096, mac='7a:10:00:00:00:09'), _set(t, 'core2', priority=4096, mac='7a:10:00:00:00:03'))),
    'ask': {'check': 'root', 'switch': 'core1'},
    'expect': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'failed', 'code': 'wrong-root'},
        {'check': 'backup-root', 'switch': 'core2', 'verdict': 'failed', 'code': 'no-backup-root'},
    ],
    'hints': [
        'Who is the root now, and why? Both cores have the same priority, so what is the tie-break?',
        'The lowest MAC address decides when priorities are equal, and Core-2\'s MAC is lower than Core-1\'s. A root and a backup need different priorities.',
        'Keep Core-1 at 4096 and give Core-2 a slightly worse (higher) priority such as 8192, which is still better than any access switch.',
    ],
    'fix': [{'switch': 'core2', 'field': 'priority', 'value': 8192}],
    'fixText': [
        'Leave Core-1 at 4096 and set Core-2 to 8192. Core-1 now wins outright; if it fails, Core-2 (8192) beats every access switch (32768), so it becomes the root.',
    ],
    'expectFixed': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'success'},
        {'check': 'backup-root', 'switch': 'core2', 'verdict': 'success'},
    ],
    'lesson': 'Primary and backup roots need different, deliberate priorities. Equal priorities hand the decision back to the MAC address, so the "backup" can end up as the root. A common pattern is a low priority such as 4096 on the root and the next step, 8192, on the backup, with everything else left at 32768. Then if the root fails, the backup wins the next election, not whichever access switch has the lowest MAC.',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP'],
})

# 7. Rogue switch on an edge port ---------------------------------------------------------------------------------------
_add({
    'id': 'stp-rogue-switch',
    'title': 'A wall-socket switch took over as root',
    'goal': 'Keep a switch plugged into an access port from taking part in the election.',
    'level': 'stretch',
    'story': 'Since Tuesday the network has been slow, and traffic between floors passes through wall socket 12 on Acc-2. A technician plugged in a switch from the test lab, and its old configuration still says bridge priority 0.',
    'topology': _edit(_two_cores, lambda t: t.update({'edges': [
        _pc('e1', 'acc1', 'Fa0/10', 'Office PC', portfast=True, guard=True),
        {'id': 'e2', 'sw': 'acc2', 'port': 'Fa0/10', 'name': 'Lab switch', 'device': 'switch', 'portfast': True, 'bpduGuard': False,
         'rogue': {'priority': 0, 'mac': '00:00:5e:00:53:63'}},
    ]})),
    'ask': {'check': 'root', 'switch': 'core1'},
    'expect': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'failed', 'code': 'rogue-root'},
    ],
    'hints': [
        'Which switch is the root now? Is it one of the four switches in your list?',
        'The root is a device on an edge port of Acc-2. Nothing stops a switch plugged into a wall socket from sending BPDUs and joining the election.',
        'Open the edge ports and turn on BPDU Guard for that port. A port that should only face end devices is shut down the moment a BPDU arrives.',
    ],
    'fix': [{'edge': 'e2', 'field': 'bpduGuard', 'value': True}],
    'fixText': [
        'Enable BPDU Guard on Acc-2\'s wall-socket port. When the lab switch sends a BPDU the port is shut down (error-disabled), so its priority-0 bridge ID never reaches the election and Core-1 is the root again.',
    ],
    'expectFixed': [
        {'check': 'root', 'switch': 'core1', 'verdict': 'success'},
        {'check': 'health', 'verdict': 'success'},
    ],
    'lesson': 'Any switch that can send a BPDU into the network can join the root election, and a low priority wins it. PortFast makes an access port forward immediately, and BPDU Guard shuts that port down if a BPDU ever arrives, which is exactly what should happen when someone plugs in a switch. Use PortFast with BPDU Guard on access ports only. (Root guard, which protects ports that face other switches, is a related feature that this lab does not model.)',
    'related': ['CCNA: STP, RSTP, EtherChannel and CDP/LLDP', 'CISSP: network security'],
})

LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'ccna-stp-etherchannel-discovery', 'tool': 'stp', 'pick': 'stp-default-priorities', 'label': 'Who wins the root bridge election?', 'blurb': 'Default priorities, MAC addresses and why the root should be set by hand.'},
    {'track': 'ccna', 'lesson': 'ccna-stp-etherchannel-discovery', 'tool': 'stp', 'pick': 'stp-standby-disabled', 'label': 'A blocked port is the standby path', 'blurb': 'Cut a cable and watch the alternate port take over.'},
    {'track': 'ccna', 'lesson': 'ccna-stp-etherchannel-discovery', 'tool': 'stp', 'pick': 'stp-disabled-loop', 'label': 'What a broadcast storm looks like', 'blurb': 'Spanning tree switched off on one switch closes the ring.'},
    {'track': 'ccna', 'lesson': 'ccna-stp-etherchannel-discovery', 'tool': 'stp', 'pick': 'sandbox', 'label': 'Spanning tree sandbox', 'blurb': 'Change priorities, costs and cables, then read the roles of every port.'},
]


def _check_topology(t, label, errors):
    sws = t.get('switches')
    lks = t.get('links')
    if not isinstance(sws, list) or not isinstance(lks, list) or not 3 <= len(sws) <= 5:
        errors.append(f'{label}: needs 3 to 5 switches and a list of links')
        return set(), set()
    if t.get('costTable') not in ('short', 'long'):
        errors.append(f'{label}: costTable must be short or long')
    ids, macs = set(), set()
    for s in sws:
        if s['id'] in ids:
            errors.append(f"{label}: duplicate switch id {s['id']}")
        ids.add(s['id'])
        if s['priority'] % 4096 or not 0 <= s['priority'] <= 61440:
            errors.append(f"{label}: {s['id']} priority must be a multiple of 4096")
        mac = s['mac'].lower()
        parts = mac.split(':')
        if len(parts) != 6 or any(len(p) != 2 or any(c not in '0123456789abcdef' for c in p) for p in parts):
            errors.append(f"{label}: {s['id']} has a malformed MAC {s['mac']}")
        if mac in macs:
            errors.append(f"{label}: duplicate MAC {mac}")
        macs.add(mac)
        if not (isinstance(s.get('pos'), list) and len(s['pos']) == 2):
            errors.append(f"{label}: {s['id']} needs a pos [x, y]")
    link_ids, used = set(), set()
    for l in lks:
        if l['id'] in link_ids:
            errors.append(f"{label}: duplicate link id {l['id']}")
        link_ids.add(l['id'])
        if l['speed'] not in SPEEDS:
            errors.append(f"{label}: link {l['id']} has an unsupported speed")
        for side in ('a', 'b'):
            e = l[side]
            if e['sw'] not in ids:
                errors.append(f"{label}: link {l['id']} end {side} is on an unknown switch")
            num = int(''.join(c for c in e['port'].split('/')[-1] if c.isdigit()) or 0)
            if (e['sw'], num) in used:
                errors.append(f"{label}: port number {num} used twice on {e['sw']}")
            used.add((e['sw'], num))
    edge_ids = set()
    for e in t.get('edges', []):
        if e['id'] in edge_ids or e['sw'] not in ids:
            errors.append(f"{label}: bad edge {e['id']}")
        edge_ids.add(e['id'])
        num = int(''.join(c for c in e['port'].split('/')[-1] if c.isdigit()) or 0)
        if (e['sw'], num) in used:
            errors.append(f"{label}: edge {e['id']} reuses a port number on {e['sw']}")
        used.add((e['sw'], num))
        if e['device'] not in ('pc', 'switch'):
            errors.append(f"{label}: edge {e['id']} device must be pc or switch")
    return ids, link_ids | edge_ids


def _check_goal(g, ids, link_ids, label, errors):
    if g.get('check') not in CHECKS:
        errors.append(f"{label}: unknown check {g.get('check')!r}")
        return
    for key in ('switch', 'from', 'to'):
        if key in g and g[key] not in ids:
            errors.append(f'{label}: {key} {g[key]!r} is not a switch of the topology')
    for key in ('link', 'via'):
        if key in g and g[key] not in link_ids:
            errors.append(f'{label}: {key} {g[key]!r} is not a link of the topology')
    need = {'root': ('switch',), 'backup-root': ('switch',), 'path': ('from', 'to'), 'forwarding': ('link',), 'survive': ('link',)}
    for key in need.get(g['check'], ()):
        if key not in g:
            errors.append(f"{label}: check {g['check']} needs '{key}'")


def validate():
    errors = []
    sb_ids, sb_links = _check_topology(SANDBOX, 'sandbox', errors)
    for s in SCENARIOS:
        label = f"scenario '{s['id']}'"
        ids, links = _check_topology(s['topology'], label, errors)
        if not ids:
            continue
        _check_goal(s['ask'], ids, links, f'{label} ask', errors)
        for kind in ('expect', 'expectFixed'):
            for g in s[kind]:
                _check_goal(g, ids, links, f'{label} {kind}', errors)
                if g.get('verdict') not in ('success', 'failed'):
                    errors.append(f'{label} {kind}: verdict must be success or failed')
        if any(g['verdict'] != 'failed' for g in s['expect'] if 'code' in g):
            errors.append(f'{label}: an expectation with a code must have verdict failed')
        if not any(g['verdict'] == 'failed' for g in s['expect']):
            errors.append(f'{label}: needs at least one failing expectation')
        if any(g['verdict'] != 'success' for g in s['expectFixed']):
            errors.append(f'{label}: expectFixed entries must all be success')
        for f in s['fix']:
            ref = f.get('switch') or f.get('link') or f.get('edge')
            known = ids if f.get('switch') else links
            if ref not in known:
                errors.append(f'{label}: fix refers to unknown {ref!r}')
    return errors
