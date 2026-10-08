"""IT Playground content: guided scenarios for the simulation tools.

The engine that runs them is src/js/03b_playground_engine.js (pure JavaScript,
no server). A scenario here is *data*: a small network, the problem the learner
is asked to find, hints, the fix, and the outcome the engine must produce
before and after the fix. build.py validates the shape, then (when node is on
the PATH) replays every scenario through the engine via tools/check_playground.js
and fails the build if the stated outcomes drift from what the engine does.

Shape of one `ipconfig` scenario:

    {
      'id': 'wrong-gateway',                 # unique slug
      'title': 'The PC cannot reach the server',
      'goal': 'One sentence shown on the card.',
      'story': 'A short paragraph: who is complaining and what they see.',
      'level': 'starter' | 'core' | 'stretch',
      'topology': {                           # same shape the engine uses
        'segments': [{'id': 'a', 'label': 'Office LAN'}],
        'hosts':    [{'id', 'name', 'segment', 'ip', 'mask', 'gateway'}],
        'routers':  [{'id', 'name', 'ifaces': [{'segment', 'ip', 'mask'}],
                      'routes': [{'net', 'mask', 'via'}]}],
      },
      'ask': {'from': 'pc', 'to': 'srv'},    # the ping the learner is asked to get working
      'expect': [{'from', 'to', 'verdict': 'failed'|'success'|'unreliable', 'code': '<diagnosis code>'}],
      'hints': ['nudge', 'bigger nudge'],     # shown one at a time
      'fix': [{'device': 'pc', 'field': 'gateway', 'value': '192.168.1.1'}],
      'expectFixed': [{'from', 'to', 'verdict': 'success'}],   # the goal checklist
      'lesson': 'What this teaches, shown after the fix works.',
      'related': ['CCNA: IP addressing', ...],   # optional pointers into the cert tracks
    }

A fix entry is one of: {'device', 'field', 'value'} (host field),
{'device', 'iface': <index>, 'field', 'value'} (router interface field),
{'device', 'route': {...}} (add a static route) or
{'device', 'routeIndex': <index>, 'field', 'value'} (edit an existing route).
"""


def _office(extra_hosts=None, **over):
    """The base network most scenarios start from: an office LAN and a server
    LAN joined by one router."""
    topo = {
        'segments': [{'id': 'office', 'label': 'Office LAN'}, {'id': 'servers', 'label': 'Server LAN'}],
        'hosts': [
            {'id': 'pc', 'name': 'PC', 'segment': 'office', 'ip': '192.168.1.10', 'mask': '255.255.255.0', 'gateway': '192.168.1.1'},
            {'id': 'srv', 'name': 'File server', 'segment': 'servers', 'ip': '10.0.0.10', 'mask': '255.255.255.0', 'gateway': '10.0.0.1'},
        ],
        'routers': [{
            'id': 'r1', 'name': 'Router',
            'ifaces': [
                {'segment': 'office', 'ip': '192.168.1.1', 'mask': '255.255.255.0'},
                {'segment': 'servers', 'ip': '10.0.0.1', 'mask': '255.255.255.0'},
            ],
            'routes': [],
        }],
    }
    if extra_hosts:
        topo['hosts'].extend(extra_hosts)
    for key, edits in over.items():
        # key like "pc" -> dict of host field edits
        for h in topo['hosts']:
            if h['id'] == key:
                h.update(edits)
    return topo


def _branches(**over):
    """Two sites joined by a /30 link, one router each."""
    topo = {
        'segments': [{'id': 'hq', 'label': 'HQ LAN'}, {'id': 'wan', 'label': 'WAN link'}, {'id': 'branch', 'label': 'Branch LAN'}],
        'hosts': [
            {'id': 'hq-pc', 'name': 'HQ PC', 'segment': 'hq', 'ip': '172.16.1.10', 'mask': '255.255.255.0', 'gateway': '172.16.1.1'},
            {'id': 'br-pc', 'name': 'Branch PC', 'segment': 'branch', 'ip': '172.16.2.10', 'mask': '255.255.255.0', 'gateway': '172.16.2.1'},
        ],
        'routers': [
            {'id': 'r-hq', 'name': 'HQ router',
             'ifaces': [{'segment': 'hq', 'ip': '172.16.1.1', 'mask': '255.255.255.0'}, {'segment': 'wan', 'ip': '192.0.2.1', 'mask': '255.255.255.252'}],
             'routes': []},
            {'id': 'r-br', 'name': 'Branch router',
             'ifaces': [{'segment': 'wan', 'ip': '192.0.2.2', 'mask': '255.255.255.252'}, {'segment': 'branch', 'ip': '172.16.2.1', 'mask': '255.255.255.0'}],
             'routes': []},
        ],
    }
    return topo


def _lab():
    """Office LAN plus a lab LAN, both behind one router."""
    return {
        'segments': [{'id': 'office', 'label': 'Office LAN'}, {'id': 'lab', 'label': 'Lab LAN'}],
        'hosts': [
            {'id': 'pc', 'name': 'PC', 'segment': 'office', 'ip': '192.168.1.10', 'mask': '255.255.255.0', 'gateway': '192.168.1.1'},
            {'id': 'printer', 'name': 'Lab printer', 'segment': 'lab', 'ip': '192.168.2.20', 'mask': '255.255.255.0', 'gateway': '192.168.2.1'},
        ],
        'routers': [{
            'id': 'r1', 'name': 'Router',
            'ifaces': [
                {'segment': 'office', 'ip': '192.168.1.1', 'mask': '255.255.255.0'},
                {'segment': 'lab', 'ip': '192.168.2.1', 'mask': '255.255.255.0'},
            ],
            'routes': [],
        }],
    }


IPCONFIG_SCENARIOS = []


def _add(s):
    IPCONFIG_SCENARIOS.append(s)


_add({
    'id': 'wrong-gateway',
    'title': 'The PC cannot reach the file server',
    'goal': 'The PC can see other office PCs but not the server in the next network.',
    'level': 'starter',
    'story': 'A new PC was set up by hand. It reaches the office printer fine but "the server is down", although everyone else can use it. Find what is different about this PC.',
    'topology': _office(pc={'gateway': '192.168.1.100'}),
    'ask': {'from': 'pc', 'to': 'srv'},
    'expect': [{'from': 'pc', 'to': 'srv', 'verdict': 'failed', 'code': 'arp-timeout'}],
    'hints': [
        'Ping the server and read the trace: which step is the first to go red?',
        'The server is on a different network, so the PC must use its default gateway. Compare the gateway with the router\'s address on the Office LAN.',
    ],
    'fix': [{'device': 'pc', 'field': 'gateway', 'value': '192.168.1.1'}],
    'expectFixed': [{'from': 'pc', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'To leave its own subnet a host sends the packet to its default gateway, so the gateway must be the router\'s real interface address. A typo there leaves the PC asking "who has 192.168.1.100?" and getting silence, while everything on the local subnet still works.',
    'related': ['CCNA: IPv4 addressing and the default gateway', 'AZ-104: virtual network routing basics'],
})

_add({
    'id': 'no-gateway',
    'title': 'Local works, everything else times out',
    'goal': 'A host can ping its neighbour but nothing beyond the router.',
    'level': 'starter',
    'story': 'After a static IP was typed in, the PC can reach the PC next to it but not the server. Nothing looks wrong with the address.',
    'topology': _office(pc={'gateway': ''}),
    'ask': {'from': 'pc', 'to': 'srv'},
    'expect': [{'from': 'pc', 'to': 'srv', 'verdict': 'failed', 'code': 'no-gateway'}],
    'hints': ['Which setting does a host need in order to leave its own subnet?'],
    'fix': [{'device': 'pc', 'field': 'gateway', 'value': '192.168.1.1'}],
    'expectFixed': [{'from': 'pc', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'Without a default gateway a host only knows its own subnet. DHCP normally supplies the gateway; a hand-typed static address needs it entered too.',
    'related': ['CCNA: DHCP and static addressing', 'CC: network basics'],
})

_add({
    'id': 'mask-too-big',
    'title': 'The lab printer is "on the same network"',
    'goal': 'A mask that is too short makes a remote host look local.',
    'level': 'core',
    'story': 'The PC was given the mask 255.255.0.0 "to be safe". It can no longer print to the lab printer, but other PCs can.',
    'topology': {**_lab(), 'hosts': [
        {'id': 'pc', 'name': 'PC', 'segment': 'office', 'ip': '192.168.1.10', 'mask': '255.255.0.0', 'gateway': '192.168.1.1'},
        {'id': 'printer', 'name': 'Lab printer', 'segment': 'lab', 'ip': '192.168.2.20', 'mask': '255.255.255.0', 'gateway': '192.168.2.1'},
    ]},
    'ask': {'from': 'pc', 'to': 'printer'},
    'expect': [{'from': 'pc', 'to': 'printer', 'verdict': 'failed', 'code': 'arp-timeout'}],
    'hints': [
        'Read the first lines of the trace: does the PC think 192.168.2.20 is inside its own subnet?',
        'What range does 192.168.1.10 with mask 255.255.0.0 cover? Compare it with the network the printer really lives on.',
    ],
    'fix': [{'device': 'pc', 'field': 'mask', 'value': '255.255.255.0'}],
    'expectFixed': [{'from': 'pc', 'to': 'printer', 'verdict': 'success'}],
    'lesson': 'A host decides "local or not?" using only its own mask. With /16 it believes 192.168.2.20 is on its own wire, so it ARPs for it directly instead of using the router, and the ARP never gets an answer because the printer is behind the router.',
    'related': ['CCNA: subnet masks and the local-versus-remote decision', 'SSCP: network addressing'],
})

_add({
    'id': 'printer-wrong-subnet',
    'title': 'The printer works on its own, but nobody can print',
    'goal': 'A device is plugged into one network but addressed for another.',
    'level': 'core',
    'story': 'A printer from the lab was moved to the office and still has its old lab address. It shows "ready" on its own display, but the PC cannot print to it.',
    'topology': {
        'segments': [{'id': 'office', 'label': 'Office LAN'}, {'id': 'lab', 'label': 'Lab LAN'}],
        'hosts': [
            {'id': 'pc', 'name': 'PC', 'segment': 'office', 'ip': '192.168.1.10', 'mask': '255.255.255.0', 'gateway': '192.168.1.1'},
            {'id': 'printer', 'name': 'Printer', 'segment': 'office', 'ip': '192.168.2.20', 'mask': '255.255.255.0', 'gateway': '192.168.2.1'},
        ],
        'routers': [{'id': 'r1', 'name': 'Router', 'ifaces': [
            {'segment': 'office', 'ip': '192.168.1.1', 'mask': '255.255.255.0'},
            {'segment': 'lab', 'ip': '192.168.2.1', 'mask': '255.255.255.0'},
        ], 'routes': []}],
    },
    'ask': {'from': 'pc', 'to': 'printer'},
    'expect': [{'from': 'pc', 'to': 'printer', 'verdict': 'failed', 'code': 'host-unreachable'}],
    'hints': [
        'The PC sends the packet to the router correctly. Where does the trace go wrong afterwards?',
        'Which network is the printer physically plugged into, and which network does its address belong to?',
    ],
    'fix': [
        {'device': 'printer', 'field': 'ip', 'value': '192.168.1.20'},
        {'device': 'printer', 'field': 'gateway', 'value': '192.168.1.1'},
    ],
    'expectFixed': [{'from': 'pc', 'to': 'printer', 'verdict': 'success'}],
    'lesson': 'The router found the right network for the destination address and asked there, but the device was on a different wire. Addresses belong to a network segment: moving a device without changing its address (or DHCP lease) leaves it unreachable.',
    'related': ['CCNA: IP addressing and troubleshooting', 'CC: network devices'],
})

_add({
    'id': 'duplicate-ip',
    'title': 'The ping works... sometimes',
    'goal': 'Two devices claim the same address.',
    'level': 'core',
    'story': 'The helpdesk reports that the finance PC "drops in and out". A colleague set up a new laptop the same afternoon.',
    'topology': _office(extra_hosts=[
        {'id': 'laptop', 'name': 'New laptop', 'segment': 'office', 'ip': '192.168.1.10', 'mask': '255.255.255.0', 'gateway': '192.168.1.1'},
    ]),
    'ask': {'from': 'srv', 'to': '192.168.1.10'},
    'expect': [{'from': 'srv', 'to': '192.168.1.10', 'verdict': 'unreliable', 'code': 'duplicate-ip'}],
    'hints': [
        'Look for the warning under the ping result. What do the PC and the laptop have in common?',
        'Every device on a segment needs its own address. Change one of them to a free address in the same subnet.',
    ],
    'fix': [{'device': 'laptop', 'field': 'ip', 'value': '192.168.1.11'}],
    'expectFixed': [{'from': 'srv', 'to': '192.168.1.10', 'verdict': 'success'}, {'from': 'srv', 'to': '192.168.1.11', 'verdict': 'success'}],
    'lesson': 'When two hosts answer the ARP request for one address, whichever reply arrives last wins, so traffic flips between them. Static addresses outside the DHCP pool, DHCP reservations and DHCP conflict detection all exist to prevent this.',
    'related': ['CCNA: ARP', 'SSCP: network troubleshooting'],
})

_add({
    'id': 'broadcast-address',
    'title': 'A "valid-looking" address that cannot be used',
    'goal': 'The last address of a subnet is the broadcast address, not a host.',
    'level': 'core',
    'story': 'A technician gave a PC 192.168.1.63 with the mask 255.255.255.192 because "63 is a normal number". It cannot talk to anything.',
    'topology': _office(pc={'ip': '192.168.1.63', 'mask': '255.255.255.192', 'gateway': '192.168.1.1'}),
    'ask': {'from': 'pc', 'to': 'srv'},
    'expect': [{'from': 'pc', 'to': 'srv', 'verdict': 'failed', 'code': 'host-address'}],
    'hints': [
        'Work out the subnet that 192.168.1.63 belongs to with a /26 mask. Use the Subnet calculator tool.',
        'What are the first and last addresses of that subnet? One of them is reserved.',
    ],
    'fix': [{'device': 'pc', 'field': 'ip', 'value': '192.168.1.40'}, {'device': 'r1', 'iface': 0, 'field': 'mask', 'value': '255.255.255.192'}],
    'expectFixed': [{'from': 'pc', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'With a /26 the subnet is 192.168.1.0 to 192.168.1.63: .0 is the network address and .63 the broadcast address, so hosts can only use .1 to .62. (The router interface needs the same mask as the hosts it serves.)',
    'related': ['CCNA: subnetting', 'CC: IP addressing'],
})

_add({
    'id': 'gateway-outside-subnet',
    'title': 'The gateway is "not reachable"',
    'goal': 'The gateway must sit inside the host\'s own subnet.',
    'level': 'core',
    'story': 'A PC was moved to a smaller subnet and given 192.168.1.200 with a /25 mask. The gateway is still the router at 192.168.1.1.',
    'topology': _office(pc={'ip': '192.168.1.200', 'mask': '255.255.255.128', 'gateway': '192.168.1.1'}),
    'ask': {'from': 'pc', 'to': 'srv'},
    'expect': [{'from': 'pc', 'to': 'srv', 'verdict': 'failed', 'code': 'gateway-offsubnet'}],
    'hints': [
        'A /25 splits 192.168.1.0/24 into two halves. Which half does .200 fall in, and which half is the gateway in?',
    ],
    'fix': [{'device': 'pc', 'field': 'ip', 'value': '192.168.1.100'}, {'device': 'r1', 'iface': 0, 'field': 'mask', 'value': '255.255.255.128'}],
    'expectFixed': [{'from': 'pc', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'The two halves are 192.168.1.0 to .127 and .128 to .255. The PC is in the upper half; the router is in the lower half, so they are in different subnets and cannot talk directly. Hosts and their gateway must share a subnet.',
    'related': ['CCNA: subnetting and VLSM', 'CC: network design basics'],
})

_add({
    'id': 'reply-lost',
    'title': 'The request arrives, the reply never does',
    'goal': 'A ping needs a working path in both directions.',
    'level': 'core',
    'story': 'The PC can ping out and the server sees the request in its logs, but the PC still gets "request timed out".',
    'topology': _office(srv={'gateway': '10.0.0.99'}),
    'ask': {'from': 'pc', 'to': 'srv'},
    'expect': [{'from': 'pc', 'to': 'srv', 'verdict': 'failed', 'code': 'reply-lost'}],
    'hints': [
        'Open both legs of the trace. Which one fails, the echo request or the echo reply?',
        'The server answers using its own settings. Check its default gateway against the router\'s address on the Server LAN.',
    ],
    'fix': [{'device': 'srv', 'field': 'gateway', 'value': '10.0.0.1'}],
    'expectFixed': [{'from': 'pc', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'Troubleshoot both directions. The PC\'s settings were fine, but the server could not route its answer back to another network, so the problem sat at the far end. Packet captures at both ends show exactly this one-way pattern.',
    'related': ['CCNA: troubleshooting methodology', 'SSCP: network monitoring'],
})

_add({
    'id': 'missing-routes',
    'title': 'Two offices, one link, no connection',
    'goal': 'Routers only know connected networks until you tell them more.',
    'level': 'stretch',
    'story': 'A new branch office was connected to head office over a /30 link. Both routers are up and the link lights are green, but HQ and the branch cannot reach each other.',
    'topology': _branches(),
    'ask': {'from': 'hq-pc', 'to': 'br-pc'},
    'expect': [{'from': 'hq-pc', 'to': 'br-pc', 'verdict': 'failed', 'code': 'no-route'}],
    'hints': [
        'Which router drops the packet and why? Look at what that router is directly connected to.',
        'Add a static route on the HQ router for the branch LAN (172.16.2.0 / 255.255.255.0) via the branch router\'s WAN address 192.0.2.2. Then try again: what happens to the reply?',
        'The branch router also needs a route back to 172.16.1.0 / 255.255.255.0 via 192.0.2.1.',
    ],
    'fix': [
        {'device': 'r-hq', 'route': {'net': '172.16.2.0', 'mask': '255.255.255.0', 'via': '192.0.2.2'}},
        {'device': 'r-br', 'route': {'net': '172.16.1.0', 'mask': '255.255.255.0', 'via': '192.0.2.1'}},
    ],
    'expectFixed': [{'from': 'hq-pc', 'to': 'br-pc', 'verdict': 'success'}, {'from': 'br-pc', 'to': 'hq-pc', 'verdict': 'success'}],
    'lesson': 'A router knows its directly connected networks and nothing else. Each end of a link needs a route (static or learned from a routing protocol) for the other side\'s LAN; with only one, the request gets through and the reply is dropped.',
    'related': ['CCNA: static routing', 'AZ-104: user-defined routes'],
})

_add({
    'id': 'bad-next-hop',
    'title': 'The route is there, but it points at nothing',
    'goal': 'A static route\'s next hop has to be a real neighbour.',
    'level': 'stretch',
    'story': 'Someone added the branch route in a hurry. The route shows up in the table, but traffic to the branch still dies at HQ.',
    'topology': {**_branches(), 'routers': [
        {'id': 'r-hq', 'name': 'HQ router',
         'ifaces': [{'segment': 'hq', 'ip': '172.16.1.1', 'mask': '255.255.255.0'}, {'segment': 'wan', 'ip': '192.0.2.1', 'mask': '255.255.255.252'}],
         'routes': [{'net': '172.16.2.0', 'mask': '255.255.255.0', 'via': '192.0.2.3'}]},
        {'id': 'r-br', 'name': 'Branch router',
         'ifaces': [{'segment': 'wan', 'ip': '192.0.2.2', 'mask': '255.255.255.252'}, {'segment': 'branch', 'ip': '172.16.2.1', 'mask': '255.255.255.0'}],
         'routes': [{'net': '172.16.1.0', 'mask': '255.255.255.0', 'via': '192.0.2.1'}]},
    ]},
    'ask': {'from': 'hq-pc', 'to': 'br-pc'},
    'expect': [{'from': 'hq-pc', 'to': 'br-pc', 'verdict': 'failed', 'code': 'bad-next-hop'}],
    'hints': [
        'The /30 link has only two usable addresses. Which two? Is the route\'s next hop one of them?',
    ],
    'fix': [{'device': 'r-hq', 'routeIndex': 0, 'field': 'via', 'value': '192.0.2.2'}],
    'expectFixed': [{'from': 'hq-pc', 'to': 'br-pc', 'verdict': 'success'}],
    'lesson': 'A /30 holds the network address, two hosts and the broadcast: 192.0.2.1 and 192.0.2.2 here. A next hop of 192.0.2.3 is the broadcast address of the link, so nothing answers. Edit the route\'s next hop to the neighbour\'s real address; a route that exists but points nowhere is as useless as no route.',
    'related': ['CCNA: static routes and next hops', 'CCNA: /30 point-to-point links'],
})



def _internet_site(r1_routes):
    """HQ, a branch behind a /30 and an ISP, to show default and more-specific routes."""
    return {
        'segments': [{'id': 'lan', 'label': 'HQ LAN'}, {'id': 'wan', 'label': 'Branch link'}, {'id': 'isp', 'label': 'ISP link'},
                     {'id': 'branch', 'label': 'Branch LAN'}, {'id': 'inet', 'label': 'Internet'}],
        'hosts': [
            {'id': 'pc', 'name': 'HQ PC', 'segment': 'lan', 'ip': '10.10.0.10', 'mask': '255.255.255.0', 'gateway': '10.10.0.1'},
            {'id': 'bpc', 'name': 'Branch PC', 'segment': 'branch', 'ip': '10.20.0.10', 'mask': '255.255.255.0', 'gateway': '10.20.0.1'},
            {'id': 'web', 'name': 'Web site', 'segment': 'inet', 'ip': '198.51.100.10', 'mask': '255.255.255.0', 'gateway': '198.51.100.1'},
        ],
        'routers': [
            {'id': 'r1', 'name': 'HQ router',
             'ifaces': [{'segment': 'lan', 'ip': '10.10.0.1', 'mask': '255.255.255.0'}, {'segment': 'wan', 'ip': '192.0.2.1', 'mask': '255.255.255.252'},
                        {'segment': 'isp', 'ip': '203.0.113.2', 'mask': '255.255.255.252'}],
             'routes': r1_routes},
            {'id': 'r2', 'name': 'Branch router',
             'ifaces': [{'segment': 'wan', 'ip': '192.0.2.2', 'mask': '255.255.255.252'}, {'segment': 'branch', 'ip': '10.20.0.1', 'mask': '255.255.255.0'}],
             'routes': [{'net': '0.0.0.0', 'mask': '0.0.0.0', 'via': '192.0.2.1'}]},
            {'id': 'isp1', 'name': 'ISP router',
             'ifaces': [{'segment': 'isp', 'ip': '203.0.113.1', 'mask': '255.255.255.252'}, {'segment': 'inet', 'ip': '198.51.100.1', 'mask': '255.255.255.0'}],
             'routes': [{'net': '10.0.0.0', 'mask': '255.0.0.0', 'via': '203.0.113.2'}]},
        ],
    }


_DEFAULT_ROUTE = {'net': '0.0.0.0', 'mask': '0.0.0.0', 'via': '203.0.113.1'}

_add({
    'id': 'longest-prefix',
    'title': 'The branch is unreachable, but the internet works',
    'goal': 'The most specific route wins, even when it is the broken one.',
    'level': 'stretch',
    'story': 'HQ has a default route to the ISP and a route for the branch network. HQ can browse the internet, but nobody at HQ can reach the branch office. "Just fall back to the default route" does not happen.',
    'topology': _internet_site([_DEFAULT_ROUTE, {'net': '10.20.0.0', 'mask': '255.255.0.0', 'via': '192.0.2.9'}]),
    'ask': {'from': 'pc', 'to': 'bpc'},
    'expect': [
        {'from': 'pc', 'to': 'web', 'verdict': 'success'},
        {'from': 'pc', 'to': 'bpc', 'verdict': 'failed', 'code': 'bad-next-hop'},
    ],
    'hints': [
        'Two routes match the branch address: the default route (/0) and the branch route (/16). Which one does the router pick?',
        'Check the next hop of the branch route against the addresses on the 192.0.2.0/30 link.',
    ],
    'fix': [{'device': 'r1', 'routeIndex': 1, 'field': 'via', 'value': '192.0.2.2'}],
    'expectFixed': [
        {'from': 'pc', 'to': 'bpc', 'verdict': 'success'},
        {'from': 'bpc', 'to': 'pc', 'verdict': 'success'},
        {'from': 'pc', 'to': 'web', 'verdict': 'success'},
    ],
    'lesson': 'A router always uses the longest matching prefix. The /16 route to the branch beats the /0 default, so traffic never falls back to the default just because the specific route is broken. Fix the specific route; the default keeps serving everything else.',
    'related': ['CCNA: routing table and longest-prefix match', 'AZ-104: effective routes and user-defined routes'],
})

_add({
    'id': 'default-route',
    'title': 'Everything internal works, nothing external does',
    'goal': 'A default route is the way out for destinations the router does not know.',
    'level': 'core',
    'story': 'After a router swap the HQ and branch networks talk to each other fine, but no one can reach the internet. The router can ping the ISP.',
    'topology': _internet_site([{'net': '10.20.0.0', 'mask': '255.255.255.0', 'via': '192.0.2.2'}]),
    'ask': {'from': 'pc', 'to': 'web'},
    'expect': [
        {'from': 'pc', 'to': 'bpc', 'verdict': 'success'},
        {'from': 'pc', 'to': 'web', 'verdict': 'failed', 'code': 'no-route'},
    ],
    'hints': ['Which route would match 198.51.100.10 on the HQ router today?'],
    'fix': [{'device': 'r1', 'route': {'net': '0.0.0.0', 'mask': '0.0.0.0', 'via': '203.0.113.1'}}],
    'expectFixed': [{'from': 'pc', 'to': 'web', 'verdict': 'success'}, {'from': 'pc', 'to': 'bpc', 'verdict': 'success'}],
    'lesson': 'A route to 0.0.0.0/0 (the default route) matches everything that nothing more specific matches, which is how a site reaches the whole internet with one line. Without it the router has no idea where to send unfamiliar destinations and drops them.',
    'related': ['CCNA: default routes', 'CC: routers and gateways'],
})


# ---------------------------------------------------------------------------
# VLAN playground scenarios. Same fields as the ipconfig ones, with a switched
# topology: {'switches': [{'id','name','vlans','ports': [{'id','mode',
# 'vlan'|'allowed'+'native'}]}], 'hosts': [{'id','name','switch','port','mac',
# 'ip','mask','gateway'}], 'links': [{'a': {'switch','port'}, 'b': {...}}],
# 'routers': [{'id','name','switch','port','mac','subifs': [{'vlan','ip','mask'}]}]}.
# Fix entries: {'device': <switch|host|router id>, 'port': <port id>, 'field', 'value'}
# for a switch port, {'device': <switch id>, 'field': 'vlans', 'value': [...]},
# {'device': <host|router id>, 'field', 'value'}, or
# {'device': <router id>, 'subif': {'vlan','ip','mask'}} to add a sub-interface.
# ---------------------------------------------------------------------------

VLAN_SCENARIOS = []


def _vlan_base():
    """Two switches joined by a trunk, VLAN 10 (Sales) and VLAN 20 (Servers),
    and a router on a stick on SW1's Fa0/24."""
    return {
        'switches': [
            {'id': 'sw1', 'name': 'SW1', 'vlans': [10, 20], 'ports': [
                {'id': 'Fa0/1', 'mode': 'access', 'vlan': 10},
                {'id': 'Fa0/2', 'mode': 'access', 'vlan': 10},
                {'id': 'Fa0/3', 'mode': 'access', 'vlan': 20},
                {'id': 'Fa0/24', 'mode': 'trunk', 'allowed': [1, 10, 20], 'native': 1},
                {'id': 'Gi0/1', 'mode': 'trunk', 'allowed': [1, 10, 20], 'native': 1},
            ]},
            {'id': 'sw2', 'name': 'SW2', 'vlans': [10, 20], 'ports': [
                {'id': 'Fa0/1', 'mode': 'access', 'vlan': 10},
                {'id': 'Fa0/2', 'mode': 'access', 'vlan': 20},
                {'id': 'Gi0/1', 'mode': 'trunk', 'allowed': [1, 10, 20], 'native': 1},
            ]},
        ],
        'links': [{'a': {'switch': 'sw1', 'port': 'Gi0/1'}, 'b': {'switch': 'sw2', 'port': 'Gi0/1'}}],
        'hosts': [
            {'id': 'pc1', 'name': 'PC1', 'switch': 'sw1', 'port': 'Fa0/1', 'mac': 'AA:01', 'ip': '192.168.10.11', 'mask': '255.255.255.0', 'gateway': '192.168.10.1'},
            {'id': 'pc2', 'name': 'PC2', 'switch': 'sw1', 'port': 'Fa0/2', 'mac': 'AA:02', 'ip': '192.168.10.12', 'mask': '255.255.255.0', 'gateway': '192.168.10.1'},
            {'id': 'pc3', 'name': 'PC3', 'switch': 'sw1', 'port': 'Fa0/3', 'mac': 'AA:03', 'ip': '192.168.20.11', 'mask': '255.255.255.0', 'gateway': '192.168.20.1'},
            {'id': 'pc4', 'name': 'PC4', 'switch': 'sw2', 'port': 'Fa0/1', 'mac': 'AA:04', 'ip': '192.168.10.13', 'mask': '255.255.255.0', 'gateway': '192.168.10.1'},
            {'id': 'srv', 'name': 'Server', 'switch': 'sw2', 'port': 'Fa0/2', 'mac': 'AA:05', 'ip': '192.168.20.10', 'mask': '255.255.255.0', 'gateway': '192.168.20.1'},
        ],
        'routers': [{'id': 'r1', 'name': 'Router', 'switch': 'sw1', 'port': 'Fa0/24', 'mac': 'BB:01', 'subifs': [
            {'vlan': 10, 'ip': '192.168.10.1', 'mask': '255.255.255.0'},
            {'vlan': 20, 'ip': '192.168.20.1', 'mask': '255.255.255.0'},
        ]}],
    }


def _vlan(edit):
    topo = _vlan_base()
    edit(topo)
    return topo


def _port(topo, sw, port):
    for s in topo['switches']:
        if s['id'] == sw:
            for p in s['ports']:
                if p['id'] == port:
                    return p
    raise KeyError((sw, port))


def _vadd(s):
    VLAN_SCENARIOS.append(s)


def _e_wrong_port(t):
    _port(t, 'sw1', 'Fa0/2')['vlan'] = 20


_vadd({
    'id': 'vlan-wrong-port',
    'title': 'Two PCs side by side cannot see each other',
    'goal': 'Same subnet, same switch, still no connection.',
    'level': 'starter',
    'story': 'PC1 and PC2 sit on the same switch and both have 192.168.10.x addresses, but PC1 cannot ping PC2. Their cables are fine and both ports show link.',
    'topology': _vlan(_e_wrong_port),
    'ask': {'from': 'pc1', 'to': 'pc2'},
    'expect': [{'from': 'pc1', 'to': 'pc2', 'verdict': 'failed', 'code': 'vlan-mismatch'}],
    'hints': [
        'Read the first failing step: does the ARP broadcast from PC1 ever reach PC2?',
        'Look at which VLAN each port is assigned to. Broadcasts stay inside one VLAN.',
    ],
    'fix': [{'device': 'sw1', 'port': 'Fa0/2', 'field': 'vlan', 'value': 10}],
    'expectFixed': [{'from': 'pc1', 'to': 'pc2', 'verdict': 'success'}],
    'lesson': 'Each VLAN is a separate broadcast domain. A host in VLAN 20 never hears an ARP broadcast sent in VLAN 10, so two hosts that are physically next to each other can be completely isolated. When same-subnet hosts cannot ping, check the access-port VLAN assignments first.',
    'related': ['CCNA: VLANs and access ports', 'CC: network segmentation'],
})


def _e_allowed(t):
    _port(t, 'sw1', 'Gi0/1')['allowed'] = [1, 10]
    _port(t, 'sw2', 'Gi0/1')['allowed'] = [1, 10]


_vadd({
    'id': 'vlan-trunk-allowed',
    'title': 'The server in the other room is unreachable',
    'goal': 'A trunk only carries the VLANs it is allowed to carry.',
    'level': 'core',
    'story': 'PC3 (VLAN 20) cannot reach the server (VLAN 20) on the second switch. VLAN 10 traffic crosses the same trunk without any trouble.',
    'topology': _vlan(_e_allowed),
    'ask': {'from': 'pc3', 'to': 'srv'},
    'expect': [{'from': 'pc3', 'to': 'srv', 'verdict': 'failed', 'code': 'vlan-not-allowed'}],
    'hints': [
        'Compare the working VLAN 10 path with the failing VLAN 20 path. What differs on the trunk?',
        'Check the allowed VLAN list on the trunk port of both switches.',
    ],
    'fix': [
        {'device': 'sw1', 'port': 'Gi0/1', 'field': 'allowed', 'value': [1, 10, 20]},
        {'device': 'sw2', 'port': 'Gi0/1', 'field': 'allowed', 'value': [1, 10, 20]},
    ],
    'expectFixed': [{'from': 'pc3', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'A trunk carries many VLANs but only the ones in its allowed list. A new VLAN must be added on both ends of every trunk it crosses (or the list left at "all"). This is the classic "I made the VLAN but nobody can reach it" fault.',
    'related': ['CCNA: 802.1Q trunking and allowed VLANs'],
})


def _e_native(t):
    _port(t, 'sw1', 'Fa0/2')['vlan'] = 1
    _port(t, 'sw2', 'Fa0/1')['vlan'] = 1
    for h in t['hosts']:
        if h['id'] == 'pc2':
            h.update({'ip': '192.168.1.12', 'gateway': ''})
        if h['id'] == 'pc4':
            h.update({'ip': '192.168.1.13', 'gateway': ''})
    p = _port(t, 'sw2', 'Gi0/1')
    p['native'] = 99
    p['allowed'] = [1, 10, 20, 99]


_vadd({
    'id': 'vlan-native-mismatch',
    'title': 'Management traffic vanishes across the trunk',
    'goal': 'Both ends of a trunk must agree on the native VLAN.',
    'level': 'stretch',
    'story': 'Two management PCs share the default VLAN 1 on different switches. Tagged VLANs cross the trunk without trouble, but these two cannot ping each other. The switch log mentions a native VLAN mismatch.',
    'topology': _vlan(_e_native),
    'ask': {'from': 'pc2', 'to': 'pc4'},
    'expect': [{'from': 'pc2', 'to': 'pc4', 'verdict': 'failed', 'code': 'native-mismatch'}],
    'hints': [
        'Only one VLAN crosses a trunk untagged. Which VLAN is that on each switch?',
        'Compare the native VLAN setting on Gi0/1 of SW1 with the one on SW2.',
    ],
    'fix': [{'device': 'sw2', 'port': 'Gi0/1', 'field': 'native', 'value': 1}],
    'expectFixed': [{'from': 'pc2', 'to': 'pc4', 'verdict': 'success'}],
    'lesson': 'Frames in the native VLAN cross a trunk without a tag, so the receiving switch decides which VLAN they belong to by its own native VLAN setting. If the two ends disagree, untagged traffic is put into the wrong VLAN (which also opens VLAN-hopping tricks). Set the same native VLAN on both ends, and prefer an unused one.',
    'related': ['CCNA: native VLAN', 'SSCP: network segmentation and VLAN hopping'],
})


def _e_missing_vlan(t):
    for s in t['switches']:
        if s['id'] == 'sw2':
            s['vlans'] = [10]


_vadd({
    'id': 'vlan-missing',
    'title': 'The new switch ignores VLAN 20',
    'goal': 'A VLAN has to exist on every switch that carries it.',
    'level': 'core',
    'story': 'The second switch was added last week. VLAN 10 works there, but the server on VLAN 20 never answers anyone, and its port has link.',
    'topology': _vlan(_e_missing_vlan),
    'ask': {'from': 'pc3', 'to': 'srv'},
    'expect': [{'from': 'pc3', 'to': 'srv', 'verdict': 'failed', 'code': 'vlan-missing'}],
    'hints': ['Check which VLANs exist in the database of the switch the server is plugged into.'],
    'fix': [{'device': 'sw2', 'field': 'vlans', 'value': [10, 20]}],
    'expectFixed': [{'from': 'pc3', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'A switch only forwards VLANs it knows about. Assigning a port to a VLAN that was never created leaves that port unusable. Creating VLANs by hand on each switch is error-prone, which is what VTP (or configuration management) tries to help with.',
    'related': ['CCNA: creating VLANs', 'CCNA: VTP concepts'],
})


def _e_access_router(t):
    for s in t['switches']:
        if s['id'] == 'sw1':
            for i, p in enumerate(s['ports']):
                if p['id'] == 'Fa0/24':
                    s['ports'][i] = {'id': 'Fa0/24', 'mode': 'access', 'vlan': 10}


_vadd({
    'id': 'inter-vlan-trunk',
    'title': 'Different VLANs cannot talk, even with a router',
    'goal': 'Router-on-a-stick needs a trunk toward the router.',
    'level': 'core',
    'story': 'PC1 (VLAN 10) should reach PC3 (VLAN 20) through the router, which has a sub-interface for each VLAN. It never works. The router port on the switch shows link.',
    'topology': _vlan(_e_access_router),
    'ask': {'from': 'pc1', 'to': 'pc3'},
    'expect': [{'from': 'pc1', 'to': 'pc3', 'verdict': 'failed', 'code': 'router-untagged'}],
    'hints': [
        'The PC does its job: it ARPs for its gateway. Does the router ever see that ARP?',
        "How do the router's sub-interfaces tell VLANs apart? What must the switch port facing the router do to keep that information?",
    ],
    'fix': [
        {'device': 'sw1', 'port': 'Fa0/24', 'field': 'mode', 'value': 'trunk'},
        {'device': 'sw1', 'port': 'Fa0/24', 'field': 'allowed', 'value': [1, 10, 20]},
        {'device': 'sw1', 'port': 'Fa0/24', 'field': 'native', 'value': 1},
    ],
    'expectFixed': [{'from': 'pc1', 'to': 'pc3', 'verdict': 'success'}],
    'lesson': 'A router on a stick uses one physical link and one 802.1Q sub-interface per VLAN. The tag is what tells the router which VLAN a frame came from, so the switch port must be a trunk, not an access port. Traffic between VLANs always goes through a layer 3 device.',
    'related': ['CCNA: inter-VLAN routing (router on a stick)', 'AZ-104: routing between subnets'],
})

def _e_portsec(t):
    for s in t['switches']:
        if s['id'] == 'sw1':
            for p in s['ports']:
                if p['id'] == 'Fa0/2':
                    p['secure'] = {'max': 1, 'allowed': ['AA:99'], 'violation': 'shutdown'}


_vadd({
    'id': 'vlan-port-security',
    'title': 'The new PC never connects on the old desk port',
    'goal': 'Port security trusts specific MAC addresses; a swapped device is a violation.',
    'level': 'core',
    'story': 'PC2 was replaced over the weekend and plugged into the same wall socket. It has link, a correct address and the right VLAN, but it cannot reach anything. The network team says "that port is locked down".',
    'topology': _vlan(_e_portsec),
    'ask': {'from': 'pc1', 'to': 'pc2'},
    'expect': [{'from': 'pc1', 'to': 'pc2', 'verdict': 'failed', 'code': 'port-security'}],
    'hints': [
        'Everything about PC2 looks right. What does the switch port itself do with frames from an unfamiliar device?',
        'Compare the MAC addresses the port trusts with the MAC address PC2 sends from.',
    ],
    'fix': [{'device': 'sw1', 'port': 'Fa0/2', 'field': 'secure', 'value': {'max': 1, 'allowed': ['AA:02'], 'violation': 'shutdown'}}],
    'expectFixed': [{'from': 'pc1', 'to': 'pc2', 'verdict': 'success'}],
    'lesson': 'Port security limits which MAC addresses may use a switch port (statically configured, or learned and "stuck" up to a maximum). A frame from any other address is a violation: shutdown puts the port into err-disabled, restrict and protect drop the frames but keep the port up. After a legitimate hardware swap the trusted address list has to be updated, and an err-disabled port has to be re-enabled by an administrator.',
    'related': ['CCNA: port security', 'SSCP: network access control', 'CC: physical and network access controls'],
})

_vadd({
    'id': 'inter-vlan-gateway',
    'title': 'The PC reaches its neighbours but nothing else',
    'goal': 'To leave its VLAN a host needs the router as its default gateway.',
    'level': 'starter',
    'story': 'PC1 can talk to everything in VLAN 10 but cannot reach the server in VLAN 20, though the router is configured correctly.',
    'topology': _vlan(lambda t: [h.update({'gateway': ''}) for h in t['hosts'] if h['id'] == 'pc1']),
    'ask': {'from': 'pc1', 'to': 'srv'},
    'expect': [{'from': 'pc1', 'to': 'srv', 'verdict': 'failed', 'code': 'no-gateway'}],
    'hints': ['What does a host need in order to send traffic to another subnet?'],
    'fix': [{'device': 'pc1', 'field': 'gateway', 'value': '192.168.10.1'}],
    'expectFixed': [{'from': 'pc1', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'Different VLANs are different subnets. A host reaches another VLAN only by sending to its default gateway, the router\'s address in the host\'s own VLAN (192.168.10.1 here, not the address in the destination VLAN).',
    'related': ['CCNA: inter-VLAN routing', 'CC: network devices'],
})


def _e_missing_subif(t):
    for r in t['routers']:
        r['subifs'] = [x for x in r['subifs'] if x['vlan'] != 20]


_vadd({
    'id': 'inter-vlan-subif',
    'title': 'One VLAN was never given a gateway',
    'goal': 'The router needs a sub-interface in every VLAN it routes.',
    'level': 'core',
    'story': 'PC1 reaches PC4 and the router, but not the server in VLAN 20. A new VLAN was added to the switches last month.',
    'topology': _vlan(_e_missing_subif),
    'ask': {'from': 'pc1', 'to': 'srv'},
    'expect': [{'from': 'pc1', 'to': 'srv', 'verdict': 'failed', 'code': 'no-route'}],
    'hints': ['Look at the list of sub-interfaces on the router. Which VLANs have one?'],
    'fix': [{'device': 'r1', 'subif': {'vlan': 20, 'ip': '192.168.20.1', 'mask': '255.255.255.0'}}],
    'expectFixed': [{'from': 'pc1', 'to': 'srv', 'verdict': 'success'}],
    'lesson': 'A router only knows the networks it has an interface in. Each VLAN that needs routing needs its own sub-interface (with the gateway address for that VLAN) or an SVI on a layer 3 switch.',
    'related': ['CCNA: sub-interfaces and SVIs'],
})



# ---------------------------------------------------------------------------
# Firewall and port-forwarding scenarios. Topology:
#   {'fw': {'name', 'stateful', 'masquerade', 'hairpin',
#           'ifaces': [{'zone': 'inside'|'dmz'|'outside', 'ip', 'mask'}],
#           'rules': [{'id', 'action', 'fromZone', 'toZone', 'proto', 'src', 'dst', 'port'}],
#           'forwards': [{'id', 'proto', 'extPort', 'toIp', 'toPort'}]},
#    'hosts': [{'id', 'name', 'zone', 'ip', 'services': [{'proto', 'port'}]}]}
# A connection test is {'from': host id, 'to': host id | 'fw-public', 'proto', 'port'}.
# Fix entries: {'rules': [...]} replaces the rule list; {'addRule': {...}};
# {'addForward': {...}}; {'forward': id, 'field', 'value'}; {'field': 'stateful'|'masquerade'|'hairpin', 'value'}.
# 'fixText' is the human wording of the fix shown under "Show the fix".
# ---------------------------------------------------------------------------

FIREWALL_SCENARIOS = []


def _fw_rules():
    return [
        {'id': 'r1', 'action': 'allow', 'fromZone': 'inside', 'toZone': 'outside', 'proto': 'any', 'src': 'any', 'dst': 'any', 'port': 'any'},
        {'id': 'r2', 'action': 'allow', 'fromZone': 'inside', 'toZone': 'dmz', 'proto': 'any', 'src': 'any', 'dst': 'any', 'port': 'any'},
        {'id': 'r3', 'action': 'allow', 'fromZone': 'outside', 'toZone': 'dmz', 'proto': 'tcp', 'src': 'any', 'dst': '172.16.0.10', 'port': '443'},
    ]


def _fw_base():
    return {
        'fw': {
            'name': 'Firewall', 'stateful': True, 'masquerade': True, 'hairpin': False,
            'ifaces': [
                {'zone': 'inside', 'ip': '192.168.1.1', 'mask': '255.255.255.0'},
                {'zone': 'dmz', 'ip': '172.16.0.1', 'mask': '255.255.255.0'},
                {'zone': 'outside', 'ip': '203.0.113.2', 'mask': '255.255.255.248'},
            ],
            'rules': _fw_rules(),
            'forwards': [{'id': 'f1', 'proto': 'tcp', 'extPort': 443, 'toIp': '172.16.0.10', 'toPort': 443}],
        },
        'hosts': [
            {'id': 'pc', 'name': 'Office PC', 'zone': 'inside', 'ip': '192.168.1.10', 'services': []},
            {'id': 'wiki', 'name': 'Intranet wiki', 'zone': 'inside', 'ip': '192.168.1.30', 'services': [{'proto': 'tcp', 'port': 80}]},
            {'id': 'web', 'name': 'Web server', 'zone': 'dmz', 'ip': '172.16.0.10', 'services': [{'proto': 'tcp', 'port': 80}, {'proto': 'tcp', 'port': 443}]},
            {'id': 'visitor', 'name': 'Visitor (internet)', 'zone': 'outside', 'ip': '198.51.100.50', 'services': []},
            {'id': 'site', 'name': 'Public website', 'zone': 'outside', 'ip': '93.184.216.34', 'services': [{'proto': 'tcp', 'port': 443}]},
        ],
    }


def _fw(edit):
    t = _fw_base()
    edit(t)
    return t


def _fadd(s):
    FIREWALL_SCENARIOS.append(s)


_visitor_web = {'from': 'visitor', 'to': 'fw-public', 'proto': 'tcp', 'port': 443}
_visitor_ok = {**_visitor_web, 'verdict': 'success'}

_fadd({
    'id': 'fw-rule-order',
    'title': 'The website is allowed, yet blocked',
    'goal': 'Rules are read top to bottom and the first match wins.',
    'level': 'starter',
    'story': 'Someone added a "block everything from the internet to the DMZ" rule during an incident and left it at the top. The allow rule for the website is still in the list, but visitors cannot connect.',
    'topology': _fw(lambda t: t['fw']['rules'].insert(0, {'id': 'r0', 'action': 'deny', 'fromZone': 'outside', 'toZone': 'dmz', 'proto': 'any', 'src': 'any', 'dst': 'any', 'port': 'any'})),
    'ask': _visitor_web,
    'expect': [{**_visitor_web, 'verdict': 'failed', 'code': 'rule-denied'}],
    'hints': ['Read the trace: which rule number matches first, and is it the one you expected?', 'Is the allow rule in the list at all? What comes before it?'],
    'fix': [{'rules': _fw_rules()}],
    'fixText': ['Remove the broad deny rule at the top (or move the specific allow rule above it). The implicit deny at the end already blocks everything not allowed.'],
    'expectFixed': [_visitor_ok],
    'lesson': 'Firewalls evaluate rules in order and stop at the first match, so a broad deny placed above a specific allow makes the allow unreachable. Put specific rules first and general ones last; the implicit deny at the bottom makes a catch-all deny unnecessary.',
    'related': ['CCNA: access control lists (order matters)', 'SC-500: network security rules', 'SSCP: firewall rule bases'],
})

_fadd({
    'id': 'fw-implicit-deny',
    'title': 'The forward is there, but nothing gets through',
    'goal': 'Anything not explicitly allowed is denied.',
    'level': 'starter',
    'story': 'The port forward for the website was configured yesterday and tested from the server room. Visitors from the internet still time out.',
    'topology': _fw(lambda t: t['fw'].update({'rules': [r for r in t['fw']['rules'] if r['id'] != 'r3']})),
    'ask': _visitor_web,
    'expect': [{**_visitor_web, 'verdict': 'failed', 'code': 'implicit-deny'}],
    'hints': ['The forward translated the address. What comes next in the trace?'],
    'fix': [{'addRule': _fw_rules()[2]}],
    'fixText': ['Add an allow rule: TCP port 443 from outside to the web server 172.16.0.10 (in the DMZ).'],
    'expectFixed': [_visitor_ok],
    'lesson': 'A port forward only translates the address; it does not permit the traffic. The firewall still needs an allow rule, and without one the implicit deny at the end of the list drops the connection.',
    'related': ['CCNA: ACLs and implicit deny', 'CC: firewalls'],
})

_fadd({
    'id': 'fw-no-forward',
    'title': 'Visitors reach the firewall but not the server',
    'goal': 'The public address only reaches an inside server through a port forward.',
    'level': 'starter',
    'story': 'The rule allowing HTTPS to the web server exists, but visitors connecting to the company\'s public address get nowhere.',
    'topology': _fw(lambda t: t['fw'].update({'forwards': []})),
    'ask': _visitor_web,
    'expect': [{**_visitor_web, 'verdict': 'failed', 'code': 'no-forward'}],
    'hints': ['Inside servers have private addresses. What tells the firewall where to send traffic that arrives for its one public address?'],
    'fix': [{'addForward': {'id': 'f1', 'proto': 'tcp', 'extPort': 443, 'toIp': '172.16.0.10', 'toPort': 443}}],
    'fixText': ['Add a port forward: TCP 443 on the public address to 172.16.0.10 port 443.'],
    'expectFixed': [_visitor_ok],
    'lesson': 'One public address serves many inside servers. The port-forward (destination NAT) table says which port on the public address belongs to which inside server. With no entry the firewall has nothing to translate to and the connection goes nowhere.',
    'related': ['CCNA: static NAT and port forwarding', 'CC: network address translation'],
})

_fadd({
    'id': 'fw-wrong-target',
    'title': 'The forward points at the wrong address',
    'goal': 'A typo in the "forward to" address sends traffic nowhere.',
    'level': 'core',
    'story': 'After the web server was moved to a new subnet, the forward was edited. Rules look right, visitors still cannot connect.',
    'topology': _fw(lambda t: t['fw']['forwards'][0].update({'toIp': '172.16.0.100'})),
    'ask': _visitor_web,
    'expect': [{**_visitor_web, 'verdict': 'failed', 'code': 'forward-target-missing'}],
    'hints': ['Compare the address in the forward with the web server\'s real address.'],
    'fix': [{'forward': 'f1', 'field': 'toIp', 'value': '172.16.0.10'}],
    'fixText': ['Change the forward\'s inside address from 172.16.0.100 to 172.16.0.10.'],
    'expectFixed': [_visitor_ok],
    'lesson': 'Rules and forwards are separate settings and must agree on the inside address. When a server is renumbered, update the forward, the allow rule and DNS together.',
    'related': ['CCNA: NAT troubleshooting'],
})

_fadd({
    'id': 'fw-wrong-port',
    'title': 'Connection refused, not timed out',
    'goal': 'A refused connection means the packet arrived; the service is not on that port.',
    'level': 'core',
    'story': 'The forward and the allow rule (any port to the web server) both look fine, but the browser says "connection refused" immediately instead of hanging.',
    'topology': _fw(lambda t: (t['fw']['forwards'][0].update({'toPort': 8443}), t['fw']['rules'][2].update({'port': 'any'}))),
    'ask': _visitor_web,
    'expect': [{**_visitor_web, 'verdict': 'failed', 'code': 'refused'}],
    'hints': ['An instant refusal is different from a timeout. What does each one tell you about where the packet got to?', 'Which port does the web server actually listen on?'],
    'fix': [{'forward': 'f1', 'field': 'toPort', 'value': 443}],
    'fixText': ['Change the forward\'s inside port from 8443 to 443, the port the web server listens on.'],
    'expectFixed': [_visitor_ok],
    'lesson': 'A timeout usually means a firewall dropped the packet. An immediate "refused" means the packet reached the host and nothing was listening, so look at the forward\'s inside port and the service, not at the rules.',
    'related': ['CCNA: troubleshooting NAT and ACLs', 'SSCP: network troubleshooting'],
})

_fadd({
    'id': 'fw-no-nat',
    'title': 'The office has no internet',
    'goal': 'Private addresses need source NAT to reach the internet.',
    'level': 'core',
    'story': 'The outbound firewall rule is in place, but nobody in the office can reach any website since the firewall was replaced.',
    'topology': _fw(lambda t: t['fw'].update({'masquerade': False})),
    'ask': {'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443},
    'expect': [{'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443, 'verdict': 'failed', 'code': 'no-nat'}],
    'hints': ['The rule allows the traffic. What address does the packet carry when it leaves the building?'],
    'fix': [{'field': 'masquerade', 'value': True}],
    'fixText': ['Turn on source NAT (masquerade / PAT) for traffic going out to the internet.'],
    'expectFixed': [{'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443, 'verdict': 'success'}],
    'lesson': 'Private (RFC 1918) addresses are not routable on the internet. Source NAT (PAT) rewrites the private source to the firewall\'s public address so replies come back to it, and the firewall maps them to the right inside host.',
    'related': ['CCNA: PAT / NAT overload', 'CC: network address translation'],
})

_fadd({
    'id': 'fw-stateless',
    'title': 'Outbound is allowed; replies are not',
    'goal': 'A stateless filter treats the reply as a brand-new packet.',
    'level': 'stretch',
    'story': 'An older packet filter was put in front of the office. The outbound rule allows web browsing, but pages never load.',
    'topology': _fw(lambda t: t['fw'].update({'stateful': False})),
    'ask': {'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443},
    'expect': [{'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443, 'verdict': 'failed', 'code': 'return-blocked'}],
    'hints': ['Read the line after the matching rule: how is the reply treated?'],
    'fix': [{'field': 'stateful', 'value': True}],
    'fixText': ['Use a stateful firewall (connection tracking). On a stateless ACL you would instead add a rule allowing the replies (established / high ports) back in.'],
    'expectFixed': [{'from': 'pc', 'to': 'site', 'proto': 'tcp', 'port': 443, 'verdict': 'success'}],
    'lesson': 'A stateless filter judges every packet alone, so the reply from the server (coming from port 443 to a high port) needs its own allow rule. A stateful firewall remembers the outbound connection and permits its replies automatically, which is why modern firewalls are stateful.',
    'related': ['CCNA: ACLs are stateless', 'CC: stateful vs stateless filtering', 'SSCP: firewall types'],
})


def _e_hairpin(t):
    t['fw']['forwards'] = [{'id': 'f1', 'proto': 'tcp', 'extPort': 80, 'toIp': '192.168.1.30', 'toPort': 80}]
    t['fw']['rules'].append({'id': 'r4', 'action': 'allow', 'fromZone': 'outside', 'toZone': 'inside', 'proto': 'tcp', 'src': 'any', 'dst': '192.168.1.30', 'port': '80'})


_fadd({
    'id': 'fw-hairpin',
    'title': 'It works from home but not from the office',
    'goal': 'Inside clients using the public address of an inside server need hairpin NAT.',
    'level': 'stretch',
    'story': 'The intranet wiki is published to the internet through a port forward. Remote staff can use it fine, but office PCs that type the public name time out.',
    'topology': _fw(_e_hairpin),
    'ask': {'from': 'pc', 'to': 'fw-public', 'proto': 'tcp', 'port': 80},
    'expect': [
        {'from': 'visitor', 'to': 'fw-public', 'proto': 'tcp', 'port': 80, 'verdict': 'success'},
        {'from': 'pc', 'to': 'fw-public', 'proto': 'tcp', 'port': 80, 'verdict': 'failed', 'code': 'hairpin'},
    ],
    'hints': ['Compare the two clients: where is each one relative to the server, and which path does the reply take?'],
    'fix': [{'field': 'hairpin', 'value': True}],
    'fixText': ['Turn on hairpin NAT (NAT reflection) on the firewall, or give inside clients the wiki\'s inside address through split DNS.'],
    'expectFixed': [
        {'from': 'visitor', 'to': 'fw-public', 'proto': 'tcp', 'port': 80, 'verdict': 'success'},
        {'from': 'pc', 'to': 'fw-public', 'proto': 'tcp', 'port': 80, 'verdict': 'success'},
    ],
    'lesson': 'When an inside client and an inside server talk through the public address, the firewall rewrites only the destination, so the server replies straight back to the client instead of through the firewall. The client rejects a reply from an address it never contacted. Hairpin NAT also rewrites the source; split-horizon DNS avoids the problem entirely.',
    'related': ['CCNA: NAT behaviour', 'SSCP: network design'],
})

# ---------------------------------------------------------------------------
# Lesson "try it" links: a lesson that a Playground tool illustrates gets a
# button at its end. 'pick' is a scenario id, 'sandbox', or (for the subnet
# tool) a tab: calc, same, vlsm, drill, ipv6. build.py checks the lesson exists.
# ---------------------------------------------------------------------------

LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'ccna-ipv4-subnetting', 'tool': 'subnet', 'pick': 'calc', 'label': 'Subnet calculator and VLSM planner', 'blurb': 'Work out network, broadcast and host range, then plan a VLSM split, with the steps shown.'},
    {'track': 'ccna', 'lesson': 'ccna-ipv4-subnetting', 'tool': 'subnet', 'pick': 'drill', 'label': 'Subnetting drill', 'blurb': 'Random problems with the working explained after each answer.'},
    {'track': 'ccna', 'lesson': 'ccna-ipv4-subnetting', 'tool': 'ipconfig', 'pick': 'wrong-gateway', 'label': 'Fix a PC that cannot leave its subnet', 'blurb': 'A wrong default gateway, found by reading the ping trace.'},
    {'track': 'ccna', 'lesson': 'ccna-vlans-trunking-intervlan', 'tool': 'vlan', 'pick': 'vlan-trunk-allowed', 'label': 'A VLAN that will not cross the trunk', 'blurb': 'Allowed VLAN lists on both ends of a trunk.'},
    {'track': 'ccna', 'lesson': 'ccna-vlans-trunking-intervlan', 'tool': 'vlan', 'pick': 'inter-vlan-trunk', 'label': 'Router on a stick that never works', 'blurb': 'Why the switch port facing the router must be a trunk.'},
    {'track': 'ccna', 'lesson': 'routing-table-static-routes', 'tool': 'ipconfig', 'pick': 'missing-routes', 'label': 'Two offices, one link, no connection', 'blurb': 'Static routes in both directions.'},
    {'track': 'ccna', 'lesson': 'routing-table-static-routes', 'tool': 'ipconfig', 'pick': 'longest-prefix', 'label': 'The more specific route wins', 'blurb': 'Longest-prefix match with a default route.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'firewall', 'pick': 'fw-rule-order', 'label': 'A deny above an allow', 'blurb': 'Rule order and the implicit deny.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'firewall', 'pick': 'fw-no-nat', 'label': 'No internet without source NAT', 'blurb': 'Why private addresses need PAT to reach the internet.'},
    {'track': 'isc2cc', 'lesson': 'networking-fundamentals', 'tool': 'subnet', 'pick': 'calc', 'label': 'Subnet calculator', 'blurb': 'See what an address and mask actually mean.'},
    {'track': 'isc2cc', 'lesson': 'networking-fundamentals', 'tool': 'firewall', 'pick': 'sandbox', 'label': 'A firewall to experiment with', 'blurb': 'Rules, NAT and port forwarding in a small network.'},
    {'track': 'isc2cc', 'lesson': 'cloud-segmentation-zero-trust', 'tool': 'vlan', 'pick': 'vlan-wrong-port', 'label': 'Segmentation with VLANs', 'blurb': 'Two PCs side by side that cannot talk because they are in different VLANs.'},
    {'track': 'sscp', 'lesson': 'network-security-controls', 'tool': 'firewall', 'pick': 'fw-stateless', 'label': 'Stateful versus stateless filtering', 'blurb': 'Outbound allowed, replies dropped.'},
    {'track': 'cissp', 'lesson': 'network-architecture-segmentation', 'tool': 'vlan', 'pick': 'vlan-native-mismatch', 'label': 'Native VLAN mismatch', 'blurb': 'Untagged traffic that lands in the wrong VLAN.'},
    {'track': 'cissp', 'lesson': 'network-transport-edge-operations', 'tool': 'firewall', 'pick': 'sandbox', 'label': 'Firewall rules and NAT', 'blurb': 'Rule order, zones and port forwarding in a small network.'},
    {'track': 'az104', 'lesson': 'az104-networking', 'tool': 'subnet', 'pick': 'vlsm', 'label': 'Plan the address space for a virtual network', 'blurb': 'Carve a VNet range into subnets without waste.'},
    {'track': 'az104', 'lesson': 'az104-networking', 'tool': 'ipconfig', 'pick': 'missing-routes', 'label': 'User-defined routes in miniature', 'blurb': 'What a route table does when the next hop is wrong or missing.'},
    {'track': 'az900', 'lesson': 'networking', 'tool': 'subnet', 'pick': 'calc', 'label': 'Subnet calculator', 'blurb': 'Address spaces and subnets, worked out.'},
    {'track': 'sc500', 'lesson': 'network-perimeter-security', 'tool': 'firewall', 'pick': 'fw-implicit-deny', 'label': 'The implicit deny', 'blurb': 'A port forward without an allow rule.'},
    {'track': 'az305', 'lesson': 'compute-networking-architecture', 'tool': 'subnet', 'pick': 'vlsm', 'label': 'VLSM planner', 'blurb': 'Design subnets for tiers of different sizes.'},
]

SCENARIOS = {
    'ipconfig': IPCONFIG_SCENARIOS,
    'vlan': VLAN_SCENARIOS,
    'vlanSandbox': _vlan_base(),
    'firewall': FIREWALL_SCENARIOS,
    'firewallSandbox': _fw_base(),
}

# Extra tools live in data/playground_<tool>.py. Each exports TOOL_KEY, SCENARIOS,
# SANDBOX and (optionally) LESSON_LINKS and validate() -> list of error strings.
import importlib as _importlib
import pkgutil as _pkgutil
from pathlib import Path as _Path

EXTRA_MODULES = []
for _info in sorted(_pkgutil.iter_modules([str(_Path(__file__).parent)]), key=lambda m: m.name):
    if _info.name.startswith('playground_'):
        _mod = _importlib.import_module(f'data.{_info.name}')
        EXTRA_MODULES.append(_mod)
        SCENARIOS[_mod.TOOL_KEY] = _mod.SCENARIOS
        SCENARIOS[_mod.TOOL_KEY + 'Sandbox'] = _mod.SANDBOX
        LESSON_LINKS.extend(getattr(_mod, 'LESSON_LINKS', []))

SCENARIOS['lessonLinks'] = LESSON_LINKS
