"""DHCP lab scenarios for the IT Playground (engine: src/js/03c_pg_dhcp.js, screens: src/js/04l_pg_dhcp.jsx).

Topology shape (see the header of the engine for the full description):
  segments: [{id, label}]
  router:   {name, ifaces: [{segment, ip, mask, helper}]}        helper = relay target ('' = none)
  server:   {name, segment, ip, mask, online, conflictDetection, scopes: [{id, name, network, mask, start, end, excluded, gateway, dns, leaseHours}]}
  dns:      [addresses that really answer DNS]
  hosts:    [{id, name, segment, mode: 'dhcp'|'static', mac, probe, ip, mask, gateway}]
  optional (a topology without them behaves exactly as before; each one adds its own editor card to the lab):
  rogue:    {name, segment, enabled, answersFirst, ip, mask, start, end, gateway, dns}   a DHCP server nobody authorised
  snooping: {enabled, vlans: [segment ids], trustServer, trustUplink, trustClients, rateLimit}   the access switch
  flood:    {enabled, segment, perSecond}   a starvation attack: DISCOVERs with made-up MAC addresses

A goal (an entry of expect / expectFixed) is {client, verdict: 'success'|'failed', code?, clean?, script?, label?}:
the engine applies the optional setup edits ([{path, value}], e.g. the server running), boots every DHCP client on a fresh server, runs the optional script
([{do: 'advance', minutes} | {do: 'edit', path, value} | {do: 'dora', client}]) and judges one client.
`clean` also fails the goal when the pool offered an address that was already in use.
A fix is a list of {path, value} (set a field), {push, value} (append to a list) or {remove} (drop a list item).
"""

TOOL_KEY = 'dhcp'

TOPOLOGY_KEYS = ('segments', 'router', 'server', 'dns', 'hosts')
OPTIONAL_TOPOLOGY_KEYS = ('rogue', 'snooping', 'flood')


def _scope(sid, name, network, start, end, gateway, dns, lease, mask='255.255.255.0', excluded=''):
    return {'id': sid, 'name': name, 'network': network, 'mask': mask, 'start': start, 'end': end,
            'excluded': excluded, 'gateway': gateway, 'dns': dns, 'leaseHours': lease}


def _client(cid, name, segment, n, probe=True):
    return {'id': cid, 'name': name, 'segment': segment, 'mode': 'dhcp', 'mac': f'aa:00:00:00:00:{n:02d}',
            'probe': probe, 'ip': '', 'mask': '', 'gateway': ''}


def _static(hid, name, segment, ip, mask='255.255.255.0', gateway=''):
    return {'id': hid, 'name': name, 'segment': segment, 'mode': 'static', 'mac': '', 'probe': True,
            'ip': ip, 'mask': mask, 'gateway': gateway}


def _flat(scope, hosts, extra_hosts=None, lease_note=None):
    """One office LAN with the router (192.168.10.1) and the DHCP server (also the DNS server) on it."""
    return {
        'segments': [{'id': 'lan', 'label': 'Office LAN'}],
        'router': {'name': 'Router', 'ifaces': [{'segment': 'lan', 'ip': '192.168.10.1', 'mask': '255.255.255.0', 'helper': ''}]},
        'server': {'name': 'DHCP server', 'segment': 'lan', 'ip': '192.168.10.5', 'mask': '255.255.255.0',
                   'online': True, 'conflictDetection': False, 'scopes': [scope]},
        'dns': ['192.168.10.5'],
        'hosts': (extra_hosts or []) + hosts,
    }


def _relay(scopes, ifaces, hosts, extra_hosts=None, segments=None):
    """Client networks behind the router; the DHCP server (10.0.0.5) and DNS server (10.0.0.53) are on the server LAN."""
    return {
        'segments': segments or [{'id': 'lan', 'label': 'Office'}, {'id': 'srv', 'label': 'Server LAN'}],
        'router': {'name': 'Router', 'ifaces': ifaces},
        'server': {'name': 'DHCP server', 'segment': 'srv', 'ip': '10.0.0.5', 'mask': '255.255.255.0',
                   'online': True, 'conflictDetection': False, 'scopes': scopes},
        'dns': ['10.0.0.53'],
        'hosts': (extra_hosts or []) + hosts,
    }


SRV_IFACE = {'segment': 'srv', 'ip': '10.0.0.1', 'mask': '255.255.255.0', 'helper': ''}
DNS_HOST = _static('dns', 'DNS server', 'srv', '10.0.0.53', gateway='10.0.0.1')


def _office_iface(helper):
    return {'segment': 'lan', 'ip': '192.168.10.1', 'mask': '255.255.255.0', 'helper': helper}


def _office_scope(**kw):
    base = dict(sid='office', name='Office', network='192.168.10.0', start='192.168.10.100', end='192.168.10.150',
                gateway='192.168.10.1', dns='10.0.0.53', lease=8)
    base.update(kw)
    return _scope(**base)


def _sales_scope(**kw):
    base = dict(sid='sales', name='Sales', network='192.168.20.0', start='192.168.20.100', end='192.168.20.150',
                gateway='192.168.20.1', dns='10.0.0.53', lease=8)
    base.update(kw)
    return _scope(**base)


SALES_IFACE = {'segment': 'sales', 'ip': '192.168.20.1', 'mask': '255.255.255.0', 'helper': '10.0.0.5'}
THREE_SEGMENTS = [{'id': 'lan', 'label': 'Office'}, {'id': 'sales', 'label': 'Sales'}, {'id': 'srv', 'label': 'Server LAN'}]


def _goal(client, label, verdict='success', **kw):
    g = {'client': client, 'verdict': verdict, 'label': label}
    g.update(kw)
    return g


def _rogue(segment='lan', enabled=True, answers_first=True, **kw):
    """A home router with DHCP switched on, plugged into a wall jack: its own network, gateway and DNS."""
    r = {'name': 'Home router', 'segment': segment, 'enabled': enabled, 'answersFirst': answers_first,
         'ip': '192.168.1.1', 'mask': '255.255.255.0', 'start': '192.168.1.100', 'end': '192.168.1.150',
         'gateway': '192.168.1.1', 'dns': '192.168.1.1'}
    r.update(kw)
    return r


def _snooping(enabled=False, vlans=None, trust_server=False, trust_uplink=False, trust_clients=False, rate_limit=0):
    """The access switch: ip dhcp snooping, ip dhcp snooping vlan, ip dhcp snooping trust, ip dhcp snooping limit rate."""
    return {'enabled': enabled, 'vlans': list(vlans or []), 'trustServer': trust_server, 'trustUplink': trust_uplink,
            'trustClients': trust_clients, 'rateLimit': rate_limit}


def _flood(enabled=False, segment='lan', per_second=100):
    return {'enabled': enabled, 'segment': segment, 'perSecond': per_second}


# Goals of the security scenarios keep the intruder in place (the learner may not simply unplug it).
_ROGUE_SETUP = [{'path': 'rogue.enabled', 'value': True}, {'path': 'rogue.answersFirst', 'value': True}]
_FLOOD_SETUP = [{'path': 'flood.enabled', 'value': True}, {'path': 'flood.perSecond', 'value': 100}]


def _secure_flat(snooping, rogue=None, flood=None, end='192.168.10.129'):
    """The office LAN with the switch in the middle: desks, DHCP server and router all plug into it."""
    t = _flat(_scope('office', 'Office', '192.168.10.0', '192.168.10.100', end, '192.168.10.1', '192.168.10.5', 8),
              [_client('ana', 'Laptop Ana', 'lan', 1), _client('ben', 'Laptop Ben', 'lan', 2), _client('desk', 'Reception PC', 'lan', 3)])
    if rogue is not None:
        t['rogue'] = rogue
    t['snooping'] = snooping
    if flood is not None:
        t['flood'] = flood
    return t


# ---------------------------------------------------------------- scenario 1: the pool is too small
_POOL_HOSTS = [
    _client('front', 'Front desk PC', 'lan', 1),
    _client('ana', 'Laptop Ana', 'lan', 2),
    _client('ben', 'Laptop Ben', 'lan', 3),
    _client('tablet', 'Tablet', 'lan', 4),
    _client('phone', 'Visitor phone', 'lan', 5),
]

# ---------------------------------------------------------------- scenario 5: statics inside the pool
_STATIC_TOPO = _flat(
    _scope('office', 'Office', '192.168.10.0', '192.168.10.20', '192.168.10.40', '192.168.10.1', '192.168.10.5', 8),
    [_client('laptop', 'Laptop', 'lan', 1), _client('camera', 'Camera', 'lan', 2, probe=False)],
    extra_hosts=[_static('printer', 'Printer', 'lan', '192.168.10.20', gateway='192.168.10.1'),
                 _static('nas', 'NAS', 'lan', '192.168.10.22', gateway='192.168.10.1')],
)

# ---------------------------------------------------------------- scenario 8: a long outage
_OUTAGE_SETUP = [{'path': 'server.online', 'value': True}]
_OUTAGE_SCRIPT = [{'do': 'edit', 'path': 'server.online', 'value': False}, {'do': 'advance', 'minutes': 480}]

SCENARIOS = [
    {
        'id': 'pool-too-small',
        'title': 'Only three devices get an address',
        'goal': 'Make every device in the office receive a working address.',
        'level': 'starter',
        'story': 'A small office has five devices set to DHCP. The first three get online, but the tablet and the visitor phone say "no internet" and show an address starting with 169.254. The DHCP server is running and nothing else changed.',
        'topology': _flat(_scope('office', 'Office', '192.168.10.0', '192.168.10.100', '192.168.10.102', '192.168.10.1', '192.168.10.5', 192), _POOL_HOSTS),
        'expect': [
            _goal('front', 'Front desk PC works'),
            _goal('tablet', 'Tablet has no address', 'failed', code='pool-exhausted'),
            _goal('phone', 'Visitor phone has no address', 'failed', code='pool-exhausted'),
        ],
        'hints': [
            'Run "Everyone asks" and read the trace of a client that failed: it says what the server did with the request.',
            'The pool is the range of addresses the server may hand out. Count how many addresses the range holds, then count the devices.',
            'Move the end address of the pool up so that the range holds at least five addresses.',
        ],
        'fix': [{'path': 'server.scopes.0.end', 'value': '192.168.10.150'}],
        'fixText': ['In the Office scope, set the pool end to 192.168.10.150 (any end address that leaves room for at least five devices works).'],
        'expectFixed': [
            _goal('front', 'Front desk PC gets a working address'),
            _goal('ana', 'Laptop Ana gets a working address'),
            _goal('ben', 'Laptop Ben gets a working address'),
            _goal('tablet', 'Tablet gets a working address'),
            _goal('phone', 'Visitor phone gets a working address'),
        ],
        'lesson': 'A DHCP pool is a finite list of addresses. Every active lease occupies one until it expires or is released, so the pool must hold more addresses than the devices you expect, with room to grow. When it runs dry the server simply stays silent, and a client with no answer falls back to a 169.254.x.x link-local address (RFC 3927). A bigger pool fixes a real shortage; a shorter lease only helps when devices come and go.',
        'related': ['CCNA: DHCP'],
    },
    {
        'id': 'needs-relay',
        'title': 'The server is on another subnet',
        'goal': 'Make the office laptops get their addresses from the server on the Server LAN.',
        'level': 'starter',
        'story': 'The DHCP server now sits in the server room (10.0.0.0/24) and has a correct scope for the office (192.168.10.0/24). Since the move every office laptop ends up with a 169.254 address. The server is online and the router is up.',
        'topology': _relay([_office_scope()], [_office_iface(''), dict(SRV_IFACE)],
                           [_client('ana', 'Laptop Ana', 'lan', 1), _client('ben', 'Laptop Ben', 'lan', 2)], extra_hosts=[DNS_HOST]),
        'expect': [
            _goal('ana', 'Laptop Ana has no address', 'failed', code='no-relay'),
            _goal('ben', 'Laptop Ben has no address', 'failed', code='no-relay'),
        ],
        'hints': [
            'A client without an address starts with a broadcast. Follow that broadcast: where does it stop?',
            'A router does not forward broadcasts. To pass DHCP requests on, a router interface needs a relay (on Cisco devices: ip helper-address). It belongs on the interface the clients are connected to.',
            'Set the helper address of the router interface facing the Office to the DHCP server, 10.0.0.5.',
        ],
        'fix': [{'path': 'router.ifaces.0.helper', 'value': '10.0.0.5'}],
        'fixText': ['On the router interface facing the Office (192.168.10.1), set the helper address to the DHCP server, 10.0.0.5.'],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets a working address'),
            _goal('ben', 'Laptop Ben gets a working address'),
        ],
        'lesson': 'DHCPDISCOVER is a broadcast, and a router never forwards broadcasts, so a server on another subnet hears nothing. A relay agent (on Cisco routers, ip helper-address) on the client-facing interface turns the broadcast into a unicast to the server and writes its own interface address into the giaddr field. The server uses giaddr to pick the scope for the client\'s subnet (RFC 2131).',
        'related': ['CCNA: DHCP relay'],
    },
    {
        'id': 'relay-wrong-address',
        'title': 'The relay forwards to the wrong machine',
        'goal': 'Make the office laptops get addresses again after the DHCP server moved.',
        'level': 'core',
        'story': 'Last month the DHCP service moved to a new server, 10.0.0.5. The office laptops now get no address, although the router still has a helper address configured and the new server is up.',
        'topology': _relay([_office_scope()], [_office_iface('10.0.0.20'), dict(SRV_IFACE)],
                           [_client('ana', 'Laptop Ana', 'lan', 1), _client('ben', 'Laptop Ben', 'lan', 2)],
                           extra_hosts=[DNS_HOST, _static('files', 'File server', 'srv', '10.0.0.20', gateway='10.0.0.1')]),
        'expect': [
            _goal('ana', 'Laptop Ana has no address', 'failed', code='relay-wrong-server'),
            _goal('ben', 'Laptop Ben has no address', 'failed', code='relay-wrong-server'),
        ],
        'hints': [
            'The relay is configured, so read the trace: where does it say the relayed request ends up?',
            'The helper address must be the address of a machine that actually runs the DHCP server.',
            'Change the helper address on the Office interface from the old address to the new DHCP server, 10.0.0.5.',
        ],
        'fix': [{'path': 'router.ifaces.0.helper', 'value': '10.0.0.5'}],
        'fixText': ['Change the helper address on the router interface facing the Office from 10.0.0.20 (now the file server) to 10.0.0.5, the DHCP server.'],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets a working address'),
            _goal('ben', 'Laptop Ben gets a working address'),
        ],
        'lesson': 'A relay agent forwards the request as a unicast to whatever address you configured, and it does not check that a DHCP server lives there. If the target is a machine that does not listen on UDP port 67 (or nothing at all), the request is silently lost, so after a server migration every helper address on every router needs updating.',
        'related': ['CCNA: DHCP relay'],
    },
    {
        'id': 'wrong-gateway',
        'title': 'Sales PCs cannot leave their subnet',
        'goal': 'Make the Sales PCs able to reach beyond their own network.',
        'level': 'core',
        'story': 'The company added a Sales network (192.168.20.0/24). Its DHCP scope was made by copying the Office scope and changing the address range. Sales PCs get an address, yet they cannot browse and cannot even reach the server room.',
        'topology': _relay([_office_scope(), _sales_scope(gateway='192.168.10.1')],
                           [_office_iface('10.0.0.5'), dict(SALES_IFACE), dict(SRV_IFACE)],
                           [_client('staff', 'Office PC', 'lan', 1), _client('sales1', 'Sales PC 1', 'sales', 2), _client('sales2', 'Sales PC 2', 'sales', 3)],
                           extra_hosts=[DNS_HOST], segments=THREE_SEGMENTS),
        'expect': [
            _goal('staff', 'Office PC works'),
            _goal('sales1', 'Sales PC 1 has a bad gateway', 'failed', code='bad-gateway-option'),
            _goal('sales2', 'Sales PC 2 has a bad gateway', 'failed', code='bad-gateway-option'),
        ],
        'hints': [
            'The Sales PCs do get an address. Read the settings the trace lists for one of them and compare the gateway with the Sales network.',
            'A client can only use a gateway that is inside its own subnet. Which address does the router have on the Sales network?',
            'Set the default gateway option of the Sales scope to the router\'s Sales address, 192.168.20.1.',
        ],
        'fix': [{'path': 'server.scopes.1.gateway', 'value': '192.168.20.1'}],
        'fixText': ['In the Sales scope, change the default gateway from 192.168.10.1 (copied from the Office scope) to 192.168.20.1, the router\'s address on the Sales network.'],
        'expectFixed': [
            _goal('staff', 'Office PC still works'),
            _goal('sales1', 'Sales PC 1 can leave its subnet'),
            _goal('sales2', 'Sales PC 2 can leave its subnet'),
        ],
        'lesson': 'The default gateway is a DHCP option, so it belongs to the scope, and every scope needs the router address of its own subnet. Copying a scope and forgetting the gateway is a classic mistake: the client gets a valid address but a gateway it cannot reach directly, so it can talk to its own subnet and nothing else.',
        'related': ['CCNA: DHCP options'],
    },
    {
        'id': 'static-in-pool',
        'title': 'Two devices share one address',
        'goal': 'Stop the pool from handing out addresses that are set by hand.',
        'level': 'core',
        'story': 'A printer (192.168.10.20) and a NAS (192.168.10.22) were given fixed addresses long ago. The DHCP pool starts at 192.168.10.20. Users report that the printer drops off, that the NAS is unreliable, and that one laptop sometimes shows an "address conflict" warning.',
        'topology': _STATIC_TOPO,
        'expect': [
            _goal('laptop', 'Laptop hits a conflict first', 'failed', code='address-conflict', clean=True),
            _goal('camera', 'Camera shares an address with the NAS', 'failed', code='address-conflict'),
        ],
        'hints': [
            'Run "Everyone asks" and read both traces. Which addresses did the server offer, and who already used them?',
            'The server does not know about devices configured by hand unless you tell it: addresses that must never be offered are excluded from the scope.',
            'Exclude the range 192.168.10.20 to 192.168.10.29 in the scope. (Conflict detection only reacts to a clash, it does not prevent the pool from covering fixed addresses.)',
        ],
        'fix': [{'path': 'server.scopes.0.excluded', 'value': '192.168.10.20-192.168.10.29'}],
        'fixText': ['Add the excluded range 192.168.10.20-192.168.10.29 to the Office scope (or move the pool start above the statics) so the server never offers the printer\'s or the NAS\'s address.'],
        'expectFixed': [
            _goal('laptop', 'Laptop gets an address with no conflict at all', clean=True),
            _goal('camera', 'Camera gets an address with no conflict at all', clean=True),
        ],
        'lesson': 'A server only knows about its own leases. Any device configured by hand inside the pool range will eventually collide with a lease. A client that probes with ARP notices, sends DHCPDECLINE and asks again (the server marks that address as bad); a client or device that does not probe ends up sharing the address. The clean fix is to exclude fixed addresses from the pool; conflict detection and DECLINE are only the safety net.',
        'related': ['CCNA: DHCP', 'RFC 2131: DHCPDECLINE'],
    },
    {
        'id': 'scope-wrong-subnet',
        'title': 'The server hears the relay but stays silent',
        'goal': 'Make the Office devices get an address; the Guest network already works.',
        'level': 'stretch',
        'story': 'The Office and Guest networks both relay to the same DHCP server. Guest devices are fine. Office devices get nothing, even though the relay is configured and the server is online.',
        'topology': _relay([_office_scope(network='192.168.1.0'), _scope('guest', 'Guest', '192.168.30.0', '192.168.30.100', '192.168.30.150', '192.168.30.1', '10.0.0.53', 2)],
                           [_office_iface('10.0.0.5'), {'segment': 'guest', 'ip': '192.168.30.1', 'mask': '255.255.255.0', 'helper': '10.0.0.5'}, dict(SRV_IFACE)],
                           [_client('office1', 'Office PC', 'lan', 1), _client('guest1', 'Guest phone', 'guest', 2)],
                           extra_hosts=[DNS_HOST],
                           segments=[{'id': 'lan', 'label': 'Office'}, {'id': 'guest', 'label': 'Guest'}, {'id': 'srv', 'label': 'Server LAN'}]),
        'expect': [
            _goal('office1', 'Office PC has no address', 'failed', code='no-scope'),
            _goal('guest1', 'Guest phone works'),
        ],
        'hints': [
            'The relay works (the Guest network proves it). Read how the server chooses a scope for a relayed request.',
            'With a relay, the server picks the scope that contains the giaddr, the address of the router interface the request came through. Compare it with the network of each scope.',
            'The Office scope\'s network is 192.168.1.0, but the Office is 192.168.10.0. Correct the scope network.',
        ],
        'fix': [{'path': 'server.scopes.0.network', 'value': '192.168.10.0'}],
        'fixText': ['Change the network of the Office scope from 192.168.1.0 to 192.168.10.0, so that the giaddr 192.168.10.1 falls inside a scope.'],
        'expectFixed': [
            _goal('office1', 'Office PC gets a working address'),
            _goal('guest1', 'Guest phone still works'),
        ],
        'lesson': 'A DHCP server serving several subnets chooses the scope from the giaddr of a relayed request (or from the receiving interface for a local one). No scope containing that address means no offer, and no error is sent to the client: the server simply stays quiet. When a relay seems to work for one network and not another, compare the router interface address with each scope\'s network.',
        'related': ['CCNA: DHCP relay', 'RFC 2131 section 4.3.1'],
    },
    {
        'id': 'wrong-mask',
        'title': 'Office PCs cannot reach Sales',
        'goal': 'Make the Office PCs treat Sales as a different network.',
        'level': 'stretch',
        'story': 'Office PCs browse the internet and reach the servers, but they cannot reach any PC in the Sales network (192.168.20.0/24). Routing on the router is fine and the Sales PCs work.',
        'topology': _relay([_office_scope(mask='255.255.0.0'), _sales_scope()],
                           [_office_iface('10.0.0.5'), dict(SALES_IFACE), dict(SRV_IFACE)],
                           [_client('office1', 'Office PC', 'lan', 1), _client('sales1', 'Sales PC', 'sales', 2)],
                           extra_hosts=[DNS_HOST], segments=THREE_SEGMENTS),
        'expect': [
            _goal('office1', 'Office PC has the wrong mask', 'failed', code='wrong-mask'),
            _goal('sales1', 'Sales PC works'),
        ],
        'hints': [
            'Compare the mask the Office PC received with the mask on the router\'s Office interface.',
            'A host decides what is "on my own wire" with its mask. Which addresses does 192.168.0.0/16 cover, and does that include the Sales network?',
            'Set the Office scope\'s mask to 255.255.255.0, the same as the router interface.',
        ],
        'fix': [{'path': 'server.scopes.0.mask', 'value': '255.255.255.0'}],
        'fixText': ['Change the mask of the Office scope from 255.255.0.0 to 255.255.255.0 so it matches the router interface.'],
        'expectFixed': [
            _goal('office1', 'Office PC gets the right mask and works'),
            _goal('sales1', 'Sales PC still works'),
        ],
        'lesson': 'The mask in the scope is what every client believes about its own subnet. A mask that is too short makes a client treat other networks as local: it ARPs for them directly instead of using the gateway, and nobody answers. A mask that is too long hides parts of the real subnet. The scope mask must match the router interface mask on that segment.',
        'related': ['CCNA: IPv4 subnetting', 'CCNA: DHCP options'],
    },
    {
        'id': 'lease-outage',
        'title': 'Everyone lost the network overnight',
        'goal': 'Make clients keep working through an eight-hour DHCP server outage.',
        'level': 'stretch',
        'story': 'The DHCP server was switched off for about eight hours of maintenance. The server came back fine, but laptops that stayed on all night had lost their network settings. Try it: press "Everyone asks", switch the server off, move the clock forward eight hours and look at the leases.',
        'topology': _flat(_scope('office', 'Office', '192.168.10.0', '192.168.10.100', '192.168.10.150', '192.168.10.1', '192.168.10.5', 2),
                          [_client('ana', 'Laptop Ana', 'lan', 1), _client('ben', 'Laptop Ben', 'lan', 2)]),
        'expect': [
            _goal('ana', 'Laptop Ana loses its address during the outage', 'failed', code='lease-expired', setup=_OUTAGE_SETUP, script=_OUTAGE_SCRIPT),
        ],
        'hints': [
            'Watch the lease timers while the clock advances: when does Laptop Ana try to renew, and what happens when the server does not answer?',
            'A client keeps using its address until the lease runs out. The lease time must be longer than the longest outage you want to survive.',
            'Raise the lease time of the Office scope from 2 hours to 24 hours (anything above eight hours passes this test).',
        ],
        'fix': [{'path': 'server.scopes.0.leaseHours', 'value': 24}],
        'fixText': ['Raise the lease time in the Office scope from 2 hours to 24 hours, so a lease outlives the eight-hour outage.'],
        'expectFixed': [
            _goal('ana', 'Laptop Ana still has a working address after the outage', setup=_OUTAGE_SETUP, script=_OUTAGE_SCRIPT),
            _goal('ben', 'Laptop Ben still has a working address after the outage', setup=_OUTAGE_SETUP, script=_OUTAGE_SCRIPT),
        ],
        'lesson': 'A lease is a loan. At T1 (50% of the lease) the client asks its server to renew by unicast; if that fails it broadcasts a request at T2 (87.5%); if nobody answers by the end of the lease it must stop using the address. Clients ride out a server outage only while their lease lasts, so lease times should be longer than the outages you must survive (and shorter than the time you are willing to wait for freed addresses).',
        'related': ['CCNA: DHCP', 'RFC 2131 section 4.4.5'],
    },
    {
        'id': 'rogue-router',
        'title': 'A wall-jack router hands out the wrong gateway',
        'goal': 'Make the PCs keep the office\'s own settings even though the stray router is still plugged in.',
        'level': 'starter',
        'story': 'A small office has one managed switch: the desks, the DHCP server (192.168.10.5) and the router (192.168.10.1) all plug into it. Last week someone in marketing plugged a Wi-Fi router into a wall jack to get better coverage. Since then PCs that restart show an address starting with 192.168.1 and have no internet and no file server. The real DHCP server is running and its scope has not changed.',
        'topology': _secure_flat(_snooping(False, ['lan']), _rogue()),
        'expect': [
            _goal('ana', 'Laptop Ana gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
            _goal('desk', 'Reception PC gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
        ],
        'hints': [
            'Run "Everyone asks" and read the trace of one PC: which device answered its DISCOVER first, and how do its address, gateway and DNS server differ from this network\'s?',
            'The switch can decide which port a DHCP server may sit behind. With DHCP snooping on, it drops DHCPOFFER, DHCPACK and DHCPNAK that come in on untrusted ports, and every port is untrusted until you trust it. So think about which port the real server is plugged into.',
            'Switch DHCP snooping on, keep the Office LAN in the snooped VLANs and mark the port facing the DHCP server as trusted. Leave the client ports untrusted: the stray router is on one of them.',
        ],
        'fix': [{'path': 'snooping.enabled', 'value': True}, {'path': 'snooping.trustServer', 'value': True}],
        'fixText': [
            'On the switch, turn DHCP snooping on (ip dhcp snooping) and make sure the Office LAN VLAN is in the snooped list (ip dhcp snooping vlan).',
            'Mark the port facing the DHCP server as trusted (ip dhcp snooping trust). Leave the client ports untrusted, so the stray router\'s offers are dropped. (Then find the router and unplug it.)',
        ],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets the office\'s own settings, with the stray router still plugged in', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben gets the office\'s own settings, with the stray router still plugged in', setup=_ROGUE_SETUP),
            _goal('desk', 'Reception PC gets the office\'s own settings, with the stray router still plugged in', setup=_ROGUE_SETUP),
        ],
        'lesson': 'A DHCP client cannot tell a legitimate server from a stranger: it takes an offer from whichever server it hears, so a home router or an attacker\'s laptop is enough to hand out a wrong gateway or a hostile DNS server. DHCP snooping turns the switch into the gatekeeper. Every port is untrusted by default and drops server messages (DHCPOFFER, DHCPACK, DHCPNAK) that arrive on it, while clients may still send DISCOVER and REQUEST. Only the port toward the real server, or the uplink toward it, is marked ip dhcp snooping trust. In real life the race between the two servers has no fixed winner; the lab assumes the rogue answers first so you can see the effect.',
        'related': ['CCNA: DHCP snooping', 'CCNA: Layer 2 security'],
    },
    {
        'id': 'snooping-no-trust',
        'title': 'Snooping is on and nobody gets an address',
        'goal': 'Make the PCs get an address again, with snooping still on and the stray router still plugged in.',
        'level': 'core',
        'story': 'To stop stray routers, the network admin switched on DHCP snooping for the Office VLAN on Friday evening and then went home. On Monday every PC that restarts shows a 169.254 address and says there is no network. The DHCP server is running and its scope looks fine. The stray Wi-Fi router is still plugged into a wall jack in marketing.',
        'topology': _secure_flat(_snooping(True, ['lan']), _rogue()),
        'expect': [
            _goal('ana', 'Laptop Ana hears no server at all', 'failed', code='snoop-blocks-server', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben hears no server at all', 'failed', code='snoop-blocks-server', setup=_ROGUE_SETUP),
            _goal('desk', 'Reception PC hears no server at all', 'failed', code='snoop-blocks-server', setup=_ROGUE_SETUP),
        ],
        'hints': [
            'Read the trace of one PC. The real server does make an offer; follow the OFFER and see where it ends up.',
            'Snooping drops DHCPOFFER, DHCPACK and DHCPNAK that arrive on untrusted ports, and every port starts untrusted. Which port does the real server\'s OFFER arrive on?',
            'Mark the port facing the DHCP server as trusted. Keep the client ports untrusted, so the stray router stays silent.',
        ],
        'fix': [{'path': 'snooping.trustServer', 'value': True}],
        'fixText': ['On the switch, mark the port facing the DHCP server as trusted (ip dhcp snooping trust). The client ports stay untrusted, so the stray router is still silenced.'],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets the office\'s own settings, with snooping on and the stray router plugged in', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben gets the office\'s own settings, with snooping on and the stray router plugged in', setup=_ROGUE_SETUP),
            _goal('desk', 'Reception PC gets the office\'s own settings, with snooping on and the stray router plugged in', setup=_ROGUE_SETUP),
        ],
        'lesson': 'Turning snooping on without telling it where the real server is silences everyone: all ports are untrusted until you trust one, so the legitimate server\'s OFFER is dropped just like the rogue\'s. The switch is not broken, it is doing exactly what it was told. After enabling snooping, always trust the port toward the DHCP server (or the uplink toward it) and test with a client that has to ask for a new address.',
        'related': ['CCNA: DHCP snooping', 'CCNA: Layer 2 security'],
    },
    {
        'id': 'snooping-vlan-missing',
        'title': 'Snooping is on, but Sales is not protected',
        'goal': 'Stop the stray router in Sales from handing out settings, without touching the trusted uplink.',
        'level': 'core',
        'story': 'Snooping was rolled out last quarter, and the Office is fine. In Sales, PCs that restart sometimes get an address starting with 192.168.1 and no internet. A colleague checks the switch and reports "DHCP snooping is enabled", so everyone assumed the problem could not be DHCP. Somebody did plug a Wi-Fi router into a wall jack in Sales.',
        'topology': dict(_relay([_office_scope(), _sales_scope()],
                                [_office_iface('10.0.0.5'), dict(SALES_IFACE), dict(SRV_IFACE)],
                                [_client('staff', 'Office PC', 'lan', 1), _client('sales1', 'Sales PC 1', 'sales', 2), _client('sales2', 'Sales PC 2', 'sales', 3)],
                                extra_hosts=[DNS_HOST], segments=THREE_SEGMENTS),
                         rogue=_rogue('sales'), snooping=_snooping(True, ['lan'], trust_uplink=True)),
        'expect': [
            _goal('staff', 'Office PC works', setup=_ROGUE_SETUP),
            _goal('sales1', 'Sales PC 1 gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
            _goal('sales2', 'Sales PC 2 gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
        ],
        'hints': [
            'The Office is fine and Sales is not, although snooping is on. What does the trace of a Sales PC say about snooping on its network?',
            'Snooping is enabled globally and then for specific VLANs. A VLAN that is not in the list is not inspected at all, whatever the global switch says (show ip dhcp snooping lists the VLANs it is configured on).',
            'Add Sales to the snooped VLANs and keep Office in the list. The uplink toward the router stays trusted, because the relayed replies come in over it.',
        ],
        'fix': [{'path': 'snooping.vlans', 'value': ['lan', 'sales']}],
        'fixText': ['Add the Sales VLAN to the snooped VLANs (ip dhcp snooping vlan), keeping the Office VLAN in the list. The uplink to the router stays trusted, because the server\'s replies come back over it.'],
        'expectFixed': [
            _goal('staff', 'Office PC still works', setup=_ROGUE_SETUP),
            _goal('sales1', 'Sales PC 1 gets the Sales network\'s own settings, with the stray router plugged in', setup=_ROGUE_SETUP),
            _goal('sales2', 'Sales PC 2 gets the Sales network\'s own settings, with the stray router plugged in', setup=_ROGUE_SETUP),
        ],
        'lesson': 'DHCP snooping must be enabled globally and then for each VLAN you want to protect. A VLAN that is missing from the list is simply not inspected, so a rogue server there is forwarded like any other device, while the Office next door looks perfectly healthy. When a rogue appears despite snooping, check which VLANs snooping is configured on before suspecting anything else.',
        'related': ['CCNA: DHCP snooping', 'CCNA: Layer 2 security'],
    },
    {
        'id': 'snooping-wrong-port-trusted',
        'title': 'The wrong port was trusted',
        'goal': 'Make the Office PCs get the real server\'s settings, with the stray router still plugged in.',
        'level': 'stretch',
        'story': 'The DHCP server lives in the server room, behind the router, and relays carry the Office PCs\' requests to it. After snooping was switched on, nobody in the Office got an address, so a junior admin trusted the PCs\' wall-jack ports "to make DHCP work". PCs now get addresses again, but with a gateway and a DNS server nobody recognises. A stray Wi-Fi router sits on one of the wall jacks.',
        'topology': dict(_relay([_office_scope()], [_office_iface('10.0.0.5'), dict(SRV_IFACE)],
                                [_client('ana', 'Laptop Ana', 'lan', 1), _client('ben', 'Laptop Ben', 'lan', 2)], extra_hosts=[DNS_HOST]),
                         rogue=_rogue('lan'), snooping=_snooping(True, ['lan'], trust_clients=True)),
        'expect': [
            _goal('ana', 'Laptop Ana gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben gets the stray router\'s settings', 'failed', code='rogue-server', setup=_ROGUE_SETUP),
        ],
        'hints': [
            'Read the trace: snooping is on for the Office, yet the stray router\'s OFFER was forwarded. Which ports are marked trusted?',
            'A rogue plugs into a client port, so trusting client ports lets it through. The real server is not on this switch at all: its replies come back through the router\'s relay, over the uplink.',
            'Make the client ports untrusted again and mark the uplink toward the router as trusted. Check the trace again: with the uplink untrusted, the real server\'s offers would be dropped too.',
        ],
        'fix': [{'path': 'snooping.trustClients', 'value': False}, {'path': 'snooping.trustUplink', 'value': True}],
        'fixText': [
            'Remove the trust from the client ports (no ip dhcp snooping trust): that is where the stray router plugs in.',
            'Trust the uplink toward the router instead (ip dhcp snooping trust): the relayed replies from the real server come in over it. The port "facing the DHCP server" is the uplink here, because the server is not on this switch.',
        ],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets the Office\'s own settings, with the stray router plugged in', setup=_ROGUE_SETUP),
            _goal('ben', 'Laptop Ben gets the Office\'s own settings, with the stray router plugged in', setup=_ROGUE_SETUP),
        ],
        'lesson': 'The trusted port is the one the legitimate DHCP replies arrive on. If the server is behind a router and a relay (ip helper-address) does the forwarding, the replies come in over the uplink, so the uplink is the port to trust, never the client ports. Trusting everything "to make it work" turns snooping off in all but name. Trust as few ports as possible: the uplink or the server port, and nothing a user can plug a device into.',
        'related': ['CCNA: DHCP snooping', 'CCNA: DHCP relay'],
    },
    {
        'id': 'dhcp-starvation',
        'title': 'A flood uses up the whole pool',
        'goal': 'Keep the pool usable for real devices even while a flood of fake requests arrives.',
        'level': 'stretch',
        'story': 'A visitor\'s laptop in a meeting room starts a program that sends DHCPDISCOVER after DHCPDISCOVER, each with a different made-up MAC address. Within seconds the Office pool (30 addresses, for three PCs) is empty, and every device that restarts shows a 169.254 address. DHCP snooping is on, the DHCP server\'s port is trusted, and the server itself is fine.',
        'topology': _secure_flat(_snooping(True, ['lan'], trust_server=True), flood=_flood(True)),
        'expect': [
            _goal('ana', 'Laptop Ana finds the pool empty', 'failed', code='starvation', setup=_FLOOD_SETUP),
            _goal('ben', 'Laptop Ben finds the pool empty', 'failed', code='starvation', setup=_FLOOD_SETUP),
            _goal('desk', 'Reception PC finds the pool empty', 'failed', code='starvation', setup=_FLOOD_SETUP),
        ],
        'hints': [
            'Read the trace and the leases: who holds the addresses of the pool? Compare the MAC addresses with the real devices.',
            'The flood consists of ordinary client messages, which an untrusted port may send, so snooping alone lets it through. The switch can also limit how many DHCP packets per second a port may deliver, and shut down a port that exceeds it.',
            'Set a rate limit on the untrusted ports (ip dhcp snooping limit rate), for example 15 packets per second. A normal client sends only a few DHCP packets, so the flooding port is cut off after a handful of addresses.',
        ],
        'fix': [{'path': 'snooping.rateLimit', 'value': 15}],
        'fixText': ['On the switch, limit the DHCP packet rate on the untrusted ports (ip dhcp snooping limit rate 15). The flooding port exceeds it within the first second and is put in the error-disabled state, after taking only about 15 addresses. Port security (a maximum number of MAC addresses per port) helps too, but the lab only models the rate limit.'],
        'expectFixed': [
            _goal('ana', 'Laptop Ana gets an address, with the flood still running', setup=_FLOOD_SETUP),
            _goal('ben', 'Laptop Ben gets an address, with the flood still running', setup=_FLOOD_SETUP),
            _goal('desk', 'Reception PC gets an address, with the flood still running', setup=_FLOOD_SETUP),
        ],
        'lesson': 'In a DHCP starvation attack the attacker asks for addresses with made-up MAC addresses until the pool is empty; real clients then get no offer, and attackers often follow up by running a rogue server. Snooping alone does not stop it, because the flood is made of ordinary client messages. A rate limit on the untrusted ports (ip dhcp snooping limit rate) shuts down a port that sends too many DHCP packets, and port security, which limits the MAC addresses per port, also helps. A smarter attacker may stay under the limit, so the limit only reduces the damage.',
        'related': ['CCNA: DHCP snooping', 'CCNA: Layer 2 security'],
    },
]


def _sandbox():
    """A working three-network DHCP setup: Office and Sales relay to the server on the Server LAN."""
    topo = _relay(
        [
            _office_scope(start='192.168.10.100', end='192.168.10.200', excluded='192.168.10.150-192.168.10.160', lease=8),
            _sales_scope(start='192.168.20.100', end='192.168.20.200', lease=24),
        ],
        [_office_iface('10.0.0.5'), dict(SALES_IFACE), dict(SRV_IFACE)],
        [_client('ana', 'Office laptop A', 'lan', 1), _client('ben', 'Office laptop B', 'lan', 2),
         _client('sam', 'Sales PC A', 'sales', 3), _client('sue', 'Sales PC B', 'sales', 4)],
        extra_hosts=[DNS_HOST, _static('printer', 'Printer', 'lan', '192.168.10.20', gateway='192.168.10.1')],
        segments=THREE_SEGMENTS,
    )
    topo['server']['conflictDetection'] = True
    # Protected from the start: the uplink is trusted, client ports are not. Plug the rogue in or start the flood to test it.
    topo['rogue'] = _rogue('lan', enabled=False)
    topo['snooping'] = _snooping(True, ['lan', 'sales'], trust_uplink=True, rate_limit=15)
    topo['flood'] = _flood(False, 'lan', 100)
    return topo


SANDBOX = _sandbox()

LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dhcp', 'pick': 'needs-relay', 'label': 'DHCP across a router', 'blurb': 'Why a broadcast needs a relay (ip helper-address) to reach a server on another subnet.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dhcp', 'pick': 'lease-outage', 'label': 'Lease timers and a server outage', 'blurb': 'Watch T1, T2 and expiry on a virtual clock.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dhcp', 'pick': 'sandbox', 'label': 'A DHCP lab to experiment with', 'blurb': 'Scopes, exclusions, relays and leases in a small network.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'dhcp', 'pick': 'rogue-router', 'label': 'A rogue DHCP server and DHCP snooping', 'blurb': 'A stray router hands out the wrong gateway; turn on snooping and trust the right port.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'dhcp', 'pick': 'snooping-no-trust', 'label': 'Why snooping needs a trusted port', 'blurb': 'Snooping is on and nobody gets an address: every port starts untrusted.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'dhcp', 'pick': 'snooping-vlan-missing', 'label': 'Snooping per VLAN', 'blurb': 'Snooping is on globally but a VLAN is missing from the list.'},
]


def validate():
    """Shape rules for the DHCP topology and its scenarios; returns a list of error strings."""
    errors = []
    ip_re = __import__('re').compile(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$')

    def is_ip(v):
        m = ip_re.match(v) if isinstance(v, str) else None
        return bool(m) and all(int(g) <= 255 for g in m.groups())

    def check_topo(topo, label):
        if not isinstance(topo, dict) or any(k not in topo for k in TOPOLOGY_KEYS):
            errors.append(f'{label}: topology needs {", ".join(TOPOLOGY_KEYS)}')
            return set()
        segs = {s.get('id') for s in topo['segments']}
        if len(segs) != len(topo['segments']) or not segs:
            errors.append(f'{label}: segments need unique ids')
        for s in topo['segments']:
            if not s.get('label'):
                errors.append(f'{label}: segment {s.get("id")} needs a label')
        ifaces = topo['router'].get('ifaces') or []
        if not ifaces:
            errors.append(f'{label}: the router needs interfaces')
        for f in ifaces:
            if f.get('segment') not in segs:
                errors.append(f'{label}: router interface on unknown segment {f.get("segment")}')
            if not is_ip(f.get('ip')) or not isinstance(f.get('mask'), str) or not isinstance(f.get('helper'), str):
                errors.append(f'{label}: router interface {f.get("segment")} needs ip, mask and helper strings')
        srv = topo['server']
        if srv.get('segment') not in segs or not is_ip(srv.get('ip')):
            errors.append(f'{label}: the server needs a known segment and an ip')
        if not isinstance(srv.get('online'), bool) or not isinstance(srv.get('conflictDetection'), bool):
            errors.append(f'{label}: server online and conflictDetection must be booleans')
        scope_ids = set()
        if not srv.get('scopes'):
            errors.append(f'{label}: the server needs at least one scope')
        for sc in srv.get('scopes') or []:
            for k in ('id', 'name', 'network', 'mask', 'start', 'end', 'excluded', 'gateway', 'dns'):
                if not isinstance(sc.get(k), str):
                    errors.append(f'{label}: scope {sc.get("id")} needs a string {k}')
            if not isinstance(sc.get('leaseHours'), (int, float)) or sc['leaseHours'] <= 0:
                errors.append(f'{label}: scope {sc.get("id")} needs a positive leaseHours')
            scope_ids.add(sc.get('id'))
        if len(scope_ids) != len(srv.get('scopes') or []):
            errors.append(f'{label}: scope ids must be unique')
        ids = set()
        clients = set()
        for h in topo['hosts']:
            if not h.get('id') or h['id'] in ids:
                errors.append(f'{label}: host ids must be unique and non-empty')
            ids.add(h.get('id'))
            if h.get('segment') not in segs:
                errors.append(f'{label}: host {h.get("id")} is on an unknown segment')
            if h.get('mode') not in ('dhcp', 'static'):
                errors.append(f'{label}: host {h.get("id")} mode must be dhcp or static')
            if h.get('mode') == 'static' and not is_ip(h.get('ip')):
                errors.append(f'{label}: static host {h.get("id")} needs an ip')
            if h.get('mode') == 'dhcp':
                clients.add(h.get('id'))
                if not h.get('mac'):
                    errors.append(f'{label}: dhcp host {h.get("id")} needs a mac')
        if not clients:
            errors.append(f'{label}: needs at least one DHCP client')
        if 'rogue' in topo:
            ro = topo['rogue']
            if not isinstance(ro, dict):
                errors.append(f'{label}: rogue must be an object')
            else:
                for k in ('name', 'segment', 'ip', 'mask', 'start', 'end', 'gateway', 'dns'):
                    if not isinstance(ro.get(k), str):
                        errors.append(f'{label}: rogue needs a string {k}')
                if ro.get('segment') not in segs:
                    errors.append(f'{label}: rogue is on an unknown segment {ro.get("segment")}')
                for k in ('ip', 'start', 'end'):
                    if not is_ip(ro.get(k)):
                        errors.append(f'{label}: rogue {k} must be an IPv4 address')
                for k in ('enabled', 'answersFirst'):
                    if not isinstance(ro.get(k), bool):
                        errors.append(f'{label}: rogue {k} must be a boolean')
        if 'snooping' in topo:
            sn = topo['snooping']
            if not isinstance(sn, dict):
                errors.append(f'{label}: snooping must be an object')
            else:
                for k in ('enabled', 'trustServer', 'trustUplink', 'trustClients'):
                    if not isinstance(sn.get(k), bool):
                        errors.append(f'{label}: snooping {k} must be a boolean')
                vl = sn.get('vlans')
                if not isinstance(vl, list) or any(v not in segs for v in vl):
                    errors.append(f'{label}: snooping vlans must be a list of segment ids')
                rl = sn.get('rateLimit')
                if isinstance(rl, bool) or not (isinstance(rl, int) and 0 <= rl <= 2048):
                    errors.append(f'{label}: snooping rateLimit must be a whole number from 0 (none) to 2048')
        if 'flood' in topo:
            fl = topo['flood']
            if not isinstance(fl, dict):
                errors.append(f'{label}: flood must be an object')
            else:
                if not isinstance(fl.get('enabled'), bool):
                    errors.append(f'{label}: flood enabled must be a boolean')
                if fl.get('segment') not in segs:
                    errors.append(f'{label}: flood is on an unknown segment {fl.get("segment")}')
                ps = fl.get('perSecond')
                if isinstance(ps, bool) or not (isinstance(ps, int) and 1 <= ps <= 10000):
                    errors.append(f'{label}: flood perSecond must be a whole number from 1 to 10000')
        return clients

    def check_goals(goals, clients, label, need_label):
        for g in goals:
            if g.get('client') not in clients:
                errors.append(f'{label}: goal names unknown client {g.get("client")}')
            if g.get('verdict') not in ('success', 'failed'):
                errors.append(f'{label}: goal verdict must be success or failed')
            if g.get('verdict') == 'success' and g.get('code'):
                errors.append(f'{label}: a success goal cannot carry a code')
            if need_label and not g.get('label'):
                errors.append(f'{label}: every goal needs a label')
            for st in g.get('setup') or []:
                if 'path' not in st or 'value' not in st:
                    errors.append(f'{label}: a setup step needs path and value')
                elif str(st['path']).split('.')[0] not in TOPOLOGY_KEYS + OPTIONAL_TOPOLOGY_KEYS:
                    errors.append(f'{label}: setup path {st["path"]} must start with a topology key')
            for st in g.get('script') or []:
                if st.get('do') not in ('advance', 'edit', 'dora'):
                    errors.append(f'{label}: unknown script step {st}')

    for sc in SCENARIOS:
        label = f'scenario {sc["id"]}'
        clients = check_topo(sc['topology'], label)
        check_goals(sc['expect'], clients, label + ' expect', False)
        check_goals(sc['expectFixed'], clients, label + ' expectFixed', True)
        if not any(g['verdict'] == 'failed' for g in sc['expect']):
            errors.append(f'{label}: expect needs at least one failing outcome')
        if any(g['verdict'] != 'success' for g in sc['expectFixed']):
            errors.append(f'{label}: expectFixed must all be success goals')
        if not sc.get('fix'):
            errors.append(f'{label}: needs fix edits')
        for f in sc.get('fix') or []:
            if not (('path' in f and 'value' in f) or ('push' in f and 'value' in f) or 'remove' in f):
                errors.append(f'{label}: a fix entry needs path+value, push+value or remove')
            target = f.get('path') or f.get('push') or f.get('remove') or ''
            if target.split('.')[0] not in TOPOLOGY_KEYS + OPTIONAL_TOPOLOGY_KEYS:
                errors.append(f'{label}: fix path {target} must start with a topology key')
            elif target.split('.')[0] in OPTIONAL_TOPOLOGY_KEYS and target.split('.')[0] not in sc['topology']:
                errors.append(f'{label}: fix path {target} names an optional section the topology does not have')
        if not 1 <= len(sc['hints']) <= 3:
            errors.append(f'{label}: needs 1 to 3 hints')
    levels = [s['level'] for s in SCENARIOS]
    if levels.count('starter') < 2:
        errors.append('needs at least two starter scenarios')
    check_topo(SANDBOX, 'sandbox')
    return errors
