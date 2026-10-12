"""Playground tool: ACL lab.

A small routed network (one or two Cisco IOS-style routers, LANs, a few hosts) with IPv4 access
lists. The engine (src/js/03c_pg_acl.js) follows a test packet the way a router does: inbound ACL on the
ingress interface, a routing decision (connected network or the longest matching static route), then the
outbound ACL on the egress interface; the reply is a separate packet that meets its own ACLs.

Facts modelled (as described in Cisco's IOS IP access-list documentation, for example "Creating an IP
Access List and Applying It to an Interface" and "IP Access List Entry Sequence Numbering"):
  - standard ACLs (1-99, 1300-1999 or named standard) match the source address only; extended ACLs
    (100-199, 2000-2699 or named extended) match protocol, source, destination and tcp/udp ports
  - address forms are any, host a.b.c.d and a.b.c.d with a WILDCARD mask (1 bit = ignore this bit)
  - entries have sequence numbers, are read lowest first, the first match decides, and an invisible
    deny ip any any ends every ACL; an ACL with no entries permits everything
  - an ACL does nothing until applied to an interface with ip access-group <acl> in|out, one ACL per
    interface per direction (IPv4); outbound ACLs do not filter packets the router itself creates
  - ACLs are stateless; the established keyword matches TCP packets with the ACK or RST bit set
  - guidance: standard ACLs close to the destination, extended ACLs close to the source

Shape (checked by validate() below and by build.py):
  topology = { routers[{id,name,interfaces[{id,name,desc,ip,prefix,aclIn,aclOut}],routes[{id,dest,prefix,via}],
                        acls[{name,kind,entries[entry]}]}], hosts[{id,name,ip,prefix,gateway,kind}] }
  entry (standard) = {id,seq,action,src}
  entry (extended) = {id,seq,action,proto,src,srcPort,dst,dstPort,icmp,established}
  expect / expectFixed entries: {'from','to','proto','port','verdict','code'?,'warn'?,'ack'?,'reply'?}
  fix entries: apply / setEntry / addEntry / removeEntry / addAcl / removeAcl (see pgAclApplyFixes)
"""

TOOL_KEY = 'acl'

CODES = {'explicit-deny', 'implicit-deny', 'shadowed-permit', 'standard-acl-broad', 'reply-blocked',
         'no-route', 'no-gateway', 'no-next-hop', 'routing-loop', 'bad-config', 'bad-port', 'bad-pair'}
WARN_CODES = {'acl-unused', 'acl-wrong-direction', 'acl-wrong-interface', 'wildcard-looks-like-mask'}


def _iface(iid, name, desc, ip, prefix=24, acl_in='', acl_out=''):
    return {'id': iid, 'name': name, 'desc': desc, 'ip': ip, 'prefix': prefix, 'aclIn': acl_in, 'aclOut': acl_out}


def _host(hid, name, ip, gateway, kind='pc', prefix=24):
    return {'id': hid, 'name': name, 'ip': ip, 'prefix': prefix, 'gateway': gateway, 'kind': kind}


def _ext(eid, seq, action, proto='ip', src='any', dst='any', sp='any', dp='any', icmp='any', est=False):
    return {'id': eid, 'seq': seq, 'action': action, 'proto': proto, 'src': src, 'srcPort': sp,
            'dst': dst, 'dstPort': dp, 'icmp': icmp, 'established': est}


def _std(eid, seq, action, src):
    return {'id': eid, 'seq': seq, 'action': action, 'src': src}


GUESTS = '10.1.20.0 0.0.0.255'
STAFF = '10.1.10.0 0.0.0.255'
SERVERS = '10.1.30.0 0.0.0.255'


def _one_router():
    """One branch router, three LANs: staff, guest Wi-Fi and servers. No ACLs yet."""
    return {
        'routers': [{
            'id': 'r1', 'name': 'R1',
            'interfaces': [
                _iface('r1-g0', 'Gi0/0', 'Staff LAN', '10.1.10.1'),
                _iface('r1-g1', 'Gi0/1', 'Guest Wi-Fi', '10.1.20.1'),
                _iface('r1-g2', 'Gi0/2', 'Servers', '10.1.30.1'),
            ],
            'routes': [],
            'acls': [],
        }],
        'hosts': [
            _host('staff', 'Staff PC', '10.1.10.20', '10.1.10.1'),
            _host('guest', 'Guest laptop', '10.1.20.50', '10.1.20.1'),
            _host('web', 'Web server', '10.1.30.10', '10.1.30.1', 'server'),
            _host('files', 'File server', '10.1.30.20', '10.1.30.1', 'server'),
        ],
    }


def _two_routers():
    """Branch router R1 (staff and guest LANs) linked to head-office router R2 (servers). No ACLs yet."""
    return {
        'routers': [
            {
                'id': 'r1', 'name': 'R1',
                'interfaces': [
                    _iface('r1-g0', 'Gi0/0', 'Staff LAN', '10.1.10.1'),
                    _iface('r1-g1', 'Gi0/1', 'Guest Wi-Fi', '10.1.20.1'),
                    _iface('r1-g2', 'Gi0/2', 'Link to R2', '10.0.0.1', 30),
                ],
                'routes': [{'id': 'rt1', 'dest': '0.0.0.0', 'prefix': 0, 'via': '10.0.0.2'}],
                'acls': [],
            },
            {
                'id': 'r2', 'name': 'R2',
                'interfaces': [
                    _iface('r2-g0', 'Gi0/0', 'Link to R1', '10.0.0.2', 30),
                    _iface('r2-g1', 'Gi0/1', 'Servers', '10.1.30.1'),
                ],
                'routes': [{'id': 'rt2', 'dest': '10.1.0.0', 'prefix': 16, 'via': '10.0.0.1'}],
                'acls': [],
            },
        ],
        'hosts': [
            _host('staff', 'Staff PC', '10.1.10.20', '10.1.10.1'),
            _host('guest', 'Guest laptop', '10.1.20.50', '10.1.20.1'),
            _host('web', 'Web server', '10.1.30.10', '10.1.30.1', 'server'),
            _host('files', 'File server', '10.1.30.20', '10.1.30.1', 'server'),
        ],
    }


def _router(t, rid):
    return next(r for r in t['routers'] if r['id'] == rid)


def _iface_of(t, iid):
    for r in t['routers']:
        for i in r['interfaces']:
            if i['id'] == iid:
                return i
    raise KeyError(iid)


def _with(base, acls=None, applied=None, rid='r1'):
    """Build a topology: add ACLs to a router and apply them: applied = {ifaceId: ('in'|'out', aclName)}."""
    t = base()
    r = _router(t, rid)
    r['acls'] = acls or []
    for iid, (d, name) in (applied or {}).items():
        _iface_of(t, iid)['aclIn' if d == 'in' else 'aclOut'] = name
    return t


def _conn(frm, to, proto, port, verdict, **extra):
    return {'from': frm, 'to': to, 'proto': proto, 'port': port, 'verdict': verdict, **extra}


# ---------------------------------------------------------------- the working sandbox

def _sandbox():
    t = _two_routers()
    _router(t, 'r1')['acls'] = [{
        'name': 'GUEST-IN', 'kind': 'extended', 'entries': [
            _ext('e1', 10, 'permit', 'tcp', GUESTS, 'host 10.1.30.10', dp='eq 80'),
            _ext('e2', 20, 'permit', 'tcp', GUESTS, 'host 10.1.30.10', dp='eq 443'),
            _ext('e3', 30, 'deny', 'ip', GUESTS, '10.0.0.0 0.255.255.255'),
            _ext('e4', 40, 'permit', 'ip', 'any', 'any'),
        ]}]
    _iface_of(t, 'r1-g1')['aclIn'] = 'GUEST-IN'
    t['hosts'].append(_host('old', 'Old laptop', '10.1.10.99', '10.1.10.1'))
    _router(t, 'r2')['acls'] = [{
        'name': '10', 'kind': 'standard', 'entries': [
            _std('e1', 10, 'deny', 'host 10.1.10.99'),
            _std('e2', 20, 'permit', 'any'),
        ]}]
    _iface_of(t, 'r2-g1')['aclOut'] = '10'
    return t


SANDBOX = _sandbox()

SCENARIOS = []


def _add(s):
    SCENARIOS.append(s)


BLOCK_GUEST = {'name': 'BLOCK-GUEST', 'kind': 'extended', 'entries': [
    _ext('e1', 10, 'deny', 'ip', GUESTS, SERVERS),
    _ext('e2', 20, 'permit', 'ip', 'any', 'any'),
]}

# ---------------------------------------------------------------- starters

_add({
    'id': 'acl-not-applied',
    'title': 'The ACL nobody applied',
    'goal': 'Keep the guest laptop away from the file server.',
    'level': 'starter',
    'story': 'Last week you wrote an ACL called BLOCK-GUEST to keep the guest Wi-Fi away from the servers. Today a guest opened a file share on the file server anyway. The ACL is right there in R1\'s configuration, so why does it do nothing?',
    'topology': _with(_one_router, [BLOCK_GUEST]),
    'ask': _conn('guest', 'files', 'tcp', 445, 'failed'),
    'expect': [_conn('guest', 'files', 'tcp', 445, 'success', warn='acl-unused')],
    'hints': [
        'Send the packet and read the trace. Which ACLs does the packet meet on R1? Look for the lines that say no ACL is applied.',
        'An ACL is only a list until an interface is told to use it. Open the R1 interface settings and look at the ACL boxes.',
        'Guests arrive on Gi0/1. An extended ACL works best close to the traffic it blocks, so apply BLOCK-GUEST inbound on Gi0/1.',
    ],
    'fix': [{'apply': {'router': 'r1', 'iface': 'r1-g1', 'dir': 'in', 'acl': 'BLOCK-GUEST'}}],
    'fixText': ['On R1 Gi0/1 set the inbound ACL to BLOCK-GUEST. On a real router that is ip access-group BLOCK-GUEST in under the interface.'],
    'expectFixed': [_conn('guest', 'files', 'tcp', 445, 'failed', code='explicit-deny'), _conn('staff', 'files', 'tcp', 445, 'success')],
    'lesson': 'Writing an ACL changes nothing by itself. The router reads an ACL only for packets that cross the interface it is applied to, in the direction you chose, using ip access-group <name> in|out. When a rule seems to be ignored, check first that the ACL is applied, and where.',
    'related': ['CCNA: ACLs', 'CCNA: ip access-group'],
})

_add({
    'id': 'acl-wrong-direction',
    'title': 'Right interface, wrong direction',
    'goal': 'Make BLOCK-GUEST stop the guest laptop by applying it the right way round.',
    'level': 'starter',
    'story': 'BLOCK-GUEST is applied to the guest Wi-Fi interface, Gi0/1, exactly where it belongs. Even so, guests still reach the file server. A colleague insists it is on the correct port.',
    'topology': _with(_one_router, [BLOCK_GUEST], {'r1-g1': ('out', 'BLOCK-GUEST')}),
    'ask': _conn('guest', 'files', 'tcp', 445, 'failed'),
    'expect': [_conn('guest', 'files', 'tcp', 445, 'success', warn='acl-wrong-direction')],
    'hints': [
        'In and out are seen from the router. Inbound reads packets arriving on the interface; outbound reads packets leaving through it.',
        'Guest packets arrive on Gi0/1 from the guest Wi-Fi. Which direction reads packets as they arrive?',
        'Apply BLOCK-GUEST inbound on Gi0/1 and clear the outbound box.',
    ],
    'fix': [{'apply': {'router': 'r1', 'iface': 'r1-g1', 'dir': 'in', 'acl': 'BLOCK-GUEST'}}, {'apply': {'router': 'r1', 'iface': 'r1-g1', 'dir': 'out', 'acl': ''}}],
    'fixText': ['On R1 Gi0/1 set the inbound ACL to BLOCK-GUEST and set the outbound ACL to none (ip access-group BLOCK-GUEST in, and remove the out line).'],
    'expectFixed': [_conn('guest', 'files', 'tcp', 445, 'failed', code='explicit-deny'), _conn('staff', 'files', 'tcp', 445, 'success')],
    'lesson': 'Direction is judged from the router\'s side of the interface. Traffic coming in from the LAN behind Gi0/1 is inbound on Gi0/1; the same ACL applied outbound would only look at packets heading back to that LAN, such as replies. Entries that name the guests as the SOURCE belong inbound on the guests\' interface.',
    'related': ['CCNA: ACLs', 'CCNA: ip access-group in or out'],
})

# ---------------------------------------------------------------- core

_add({
    'id': 'acl-missing-permit',
    'title': 'Everything else is blocked',
    'goal': 'Keep guests out of the staff LAN, but let them reach everything else.',
    'level': 'core',
    'story': 'The only job of the new ACL was to keep guests away from the staff LAN. Since it went live, guests cannot open the intranet web page either. In fact nothing works for them.',
    'topology': _with(_one_router, [{'name': 'NO-GUEST-TO-STAFF', 'kind': 'extended', 'entries': [
        _ext('e1', 10, 'deny', 'ip', GUESTS, STAFF),
    ]}], {'r1-g1': ('in', 'NO-GUEST-TO-STAFF')}),
    'ask': _conn('guest', 'web', 'tcp', 80, 'success'),
    'expect': [_conn('guest', 'web', 'tcp', 80, 'failed', code='implicit-deny')],
    'hints': [
        'Read the trace line for the ACL. Which entries were checked, and what happened after the last one?',
        'Every ACL ends with a line you cannot see: deny ip any any. An ACL made only of deny lines therefore blocks everything.',
        'Add a last entry, with a higher sequence number than the deny, that permits all other traffic.',
    ],
    'fix': [{'addEntry': {'router': 'r1', 'acl': 'NO-GUEST-TO-STAFF', 'entry': _ext('e2', 20, 'permit', 'ip', 'any', 'any')}}],
    'fixText': ['Add entry 20 to NO-GUEST-TO-STAFF: permit ip any any. The deny at 10 is read first, so guests are still kept out of the staff LAN.'],
    'expectFixed': [_conn('guest', 'web', 'tcp', 80, 'success'), _conn('guest', 'staff', 'tcp', 3389, 'failed', code='explicit-deny'), _conn('staff', 'web', 'tcp', 80, 'success')],
    'lesson': 'After the last entry of every ACL there is an invisible deny ip any any. A deny that you write only removes the traffic it names; to let everything else through you must say so with a final permit. Always ask what the ACL does to traffic it does not mention.',
    'related': ['CCNA: ACLs', 'CCNA: implicit deny'],
})

_add({
    'id': 'acl-wrong-interface',
    'title': 'Applied to the wrong LAN',
    'goal': 'Let the staff PC use the file server again, and keep guests limited to the web portal.',
    'level': 'core',
    'story': 'The guest ACL GUEST-WEB-ONLY lets guests reach the web portal and nothing else. Since it went live the staff PC cannot open the file server any more, while the guest laptop can still browse the file shares.',
    'topology': _with(_one_router, [{'name': 'GUEST-WEB-ONLY', 'kind': 'extended', 'entries': [
        _ext('e1', 10, 'permit', 'tcp', GUESTS, 'host 10.1.30.10', dp='eq 80'),
        _ext('e2', 20, 'permit', 'tcp', GUESTS, 'host 10.1.30.10', dp='eq 443'),
    ]}], {'r1-g0': ('in', 'GUEST-WEB-ONLY')}),
    'ask': _conn('staff', 'files', 'tcp', 445, 'success'),
    'expect': [_conn('staff', 'files', 'tcp', 445, 'failed', code='implicit-deny'), _conn('guest', 'files', 'tcp', 445, 'success', warn='acl-wrong-interface')],
    'hints': [
        'Look at which interface blocks the staff PC, and at the source addresses in the ACL entries. Whose traffic is the ACL really about?',
        'The entries talk about the guest subnet, 10.1.20.0/24, but the ACL is applied where staff traffic arrives.',
        'Take the ACL off Gi0/0 and apply it inbound on the guest Wi-Fi interface, Gi0/1.',
    ],
    'fix': [{'apply': {'router': 'r1', 'iface': 'r1-g0', 'dir': 'in', 'acl': ''}}, {'apply': {'router': 'r1', 'iface': 'r1-g1', 'dir': 'in', 'acl': 'GUEST-WEB-ONLY'}}],
    'fixText': ['Clear the inbound ACL on R1 Gi0/0 (staff LAN) and set the inbound ACL of R1 Gi0/1 (guest Wi-Fi) to GUEST-WEB-ONLY.'],
    'expectFixed': [_conn('staff', 'files', 'tcp', 445, 'success'), _conn('guest', 'files', 'tcp', 445, 'failed', code='implicit-deny'), _conn('guest', 'web', 'tcp', 80, 'success')],
    'lesson': 'An ACL only sees the traffic that crosses the interface and direction it is applied to. The same list on the staff interface drops the staff (nothing permits them) and leaves the guests untouched. Match the ACL\'s source and destination to the traffic that really crosses that interface.',
    'related': ['CCNA: ACL placement', 'CCNA: ip access-group'],
})

_add({
    'id': 'acl-order',
    'title': 'A specific permit under a broad deny',
    'goal': 'Let guests load the web portal, but nothing else on the servers LAN.',
    'level': 'core',
    'story': 'Guests are allowed to use the visitor portal on the web server (port 80) but nothing else on the servers LAN. GUEST-IN contains both lines, yet the portal will not load for guests.',
    'topology': _with(_one_router, [{'name': 'GUEST-IN', 'kind': 'extended', 'entries': [
        _ext('e1', 10, 'deny', 'ip', GUESTS, SERVERS),
        _ext('e2', 20, 'permit', 'tcp', GUESTS, 'host 10.1.30.10', dp='eq 80'),
        _ext('e3', 30, 'permit', 'ip', 'any', 'any'),
    ]}], {'r1-g1': ('in', 'GUEST-IN')}),
    'ask': _conn('guest', 'web', 'tcp', 80, 'success'),
    'expect': [_conn('guest', 'web', 'tcp', 80, 'failed', code='shadowed-permit')],
    'hints': [
        'Both lines are there, so read the trace: which entry decides the portal packet?',
        'Entries are read from the lowest sequence number up, and the first match wins. The broad deny is read before the specific permit.',
        'Give the permit a lower sequence number than the deny (5 works; on a router you would type 5 permit ... inside ip access-list extended GUEST-IN), or move it up.',
    ],
    'fix': [{'setEntry': {'router': 'r1', 'acl': 'GUEST-IN', 'id': 'e2', 'patch': {'seq': 5}}}],
    'fixText': ['Change the sequence number of the permit tcp ... host 10.1.30.10 eq 80 entry from 20 to 5 (or move it up twice) so it is read before the deny at 10.'],
    'expectFixed': [_conn('guest', 'web', 'tcp', 80, 'success'), _conn('guest', 'files', 'tcp', 445, 'failed', code='explicit-deny'), _conn('staff', 'files', 'tcp', 445, 'success')],
    'lesson': 'Specific entries go above general ones, because the first match wins. Named ACLs and sequence numbers let you insert a line anywhere without retyping the list: a new entry numbered 5 is read before the entry numbered 10. Where the exception sits in the list changes the outcome.',
    'related': ['CCNA: ACLs', 'CCNA: ACL sequence numbers'],
})

# ---------------------------------------------------------------- stretch

_add({
    'id': 'acl-wildcard',
    'title': 'The mask that is not a wildcard',
    'goal': 'Block the guest laptop from the servers by fixing the address in the deny entry.',
    'level': 'stretch',
    'story': 'A colleague wrote the guest ACL late at night and copied the mask from the interface: 255.255.255.0. The ACL is applied the right way round on the guest interface, but guests still reach the servers.',
    'topology': _with(_one_router, [{'name': 'NO-GUEST-SERVERS', 'kind': 'extended', 'entries': [
        _ext('e1', 10, 'deny', 'ip', '10.1.20.0 255.255.255.0', SERVERS),
        _ext('e2', 20, 'permit', 'ip', 'any', 'any'),
    ]}], {'r1-g1': ('in', 'NO-GUEST-SERVERS')}),
    'ask': _conn('guest', 'files', 'tcp', 445, 'failed'),
    'expect': [_conn('guest', 'files', 'tcp', 445, 'success', warn='wildcard-looks-like-mask')],
    'hints': [
        'The ACL is read for this packet, so placement is fine. Why does entry 10 not match the guest laptop at 10.1.20.50?',
        'The second number in an ACL address is a wildcard mask, not a subnet mask. A 1 bit in a wildcard means ignore this bit.',
        'The wildcard for a /24 is the inverse of 255.255.255.0: use 10.1.20.0 0.0.0.255.',
    ],
    'fix': [{'setEntry': {'router': 'r1', 'acl': 'NO-GUEST-SERVERS', 'id': 'e1', 'patch': {'src': '10.1.20.0 0.0.0.255'}}}],
    'fixText': ['Change the source of entry 10 from 10.1.20.0 255.255.255.0 to 10.1.20.0 0.0.0.255. A wildcard mask is the subnet mask turned inside out.'],
    'expectFixed': [_conn('guest', 'files', 'tcp', 445, 'failed', code='explicit-deny'), _conn('guest', 'web', 'tcp', 80, 'failed', code='explicit-deny'), _conn('staff', 'web', 'tcp', 80, 'success')],
    'lesson': 'ACLs use wildcard masks, which are the inverse of subnet masks: 0.0.0.255 means ignore the last octet, while 255.255.255.0 means ignore the first three and compare only the last, which matches almost nothing you meant. The router accepts both without complaint, so the mistake only shows when the entry quietly fails to match.',
    'related': ['CCNA: wildcard masks', 'CCNA: ACLs'],
})

_add({
    'id': 'acl-standard-placement',
    'title': 'A standard ACL too close to the source',
    'goal': 'Keep guests out of the staff LAN while they can still reach the head-office web server.',
    'level': 'stretch',
    'story': 'Guests must stay out of the staff LAN but should still browse the web server at head office. The branch uses a standard ACL, NO-GUEST. Now the guest laptop cannot reach the head-office web server either.',
    'topology': _with(_two_routers, [{'name': 'NO-GUEST', 'kind': 'standard', 'entries': [
        _std('e1', 10, 'deny', GUESTS),
        _std('e2', 20, 'permit', 'any'),
    ]}], {'r1-g1': ('in', 'NO-GUEST')}),
    'ask': _conn('guest', 'web', 'tcp', 80, 'success'),
    'expect': [_conn('guest', 'web', 'tcp', 80, 'failed', code='standard-acl-broad')],
    'hints': [
        'A standard ACL can only look at the source address. What does that mean for packets from guests to any destination at all?',
        'The ACL should only be read by packets heading for the staff LAN. Which interface do only those packets leave through?',
        'Take the ACL off Gi0/1 and apply it outbound on Gi0/0, the staff LAN interface (close to the destination).',
    ],
    'fix': [{'apply': {'router': 'r1', 'iface': 'r1-g1', 'dir': 'in', 'acl': ''}}, {'apply': {'router': 'r1', 'iface': 'r1-g0', 'dir': 'out', 'acl': 'NO-GUEST'}}],
    'fixText': ['Clear the inbound ACL on R1 Gi0/1 and set the outbound ACL of R1 Gi0/0 (towards the staff LAN) to NO-GUEST. Standard ACLs belong close to the destination.'],
    'expectFixed': [_conn('guest', 'staff', 'tcp', 3389, 'failed', code='standard-acl-broad'), _conn('guest', 'web', 'tcp', 80, 'success'), _conn('staff', 'web', 'tcp', 80, 'success')],
    'lesson': 'A standard ACL matches the source address only, so it cannot say "this source, but only to that destination". Placed near the source it blocks the source everywhere. Placed close to the destination, on the interface that leads only to the network you want to protect, it blocks just that traffic. Extended ACLs can name the destination, so they go close to the source.',
    'related': ['CCNA: standard vs extended ACLs', 'CCNA: ACL placement'],
})

_add({
    'id': 'acl-stateless-return',
    'title': 'The reply that cannot come back',
    'goal': 'Servers must not start connections to staff PCs, but staff must still use the servers.',
    'level': 'stretch',
    'story': 'Servers must never open connections to staff PCs, so PROTECT-STAFF was applied where the servers connect to R1. Since then staff cannot open files on the file server: the connection starts but never completes.',
    'topology': _with(_one_router, [{'name': 'PROTECT-STAFF', 'kind': 'extended', 'entries': [
        _ext('e1', 10, 'deny', 'ip', SERVERS, STAFF),
        _ext('e2', 20, 'permit', 'ip', 'any', 'any'),
    ]}], {'r1-g2': ('in', 'PROTECT-STAFF')}),
    'ask': _conn('staff', 'files', 'tcp', 445, 'success'),
    'expect': [_conn('staff', 'files', 'tcp', 445, 'failed', code='reply-blocked')],
    'hints': [
        'The request gets through. Follow the trace down to the Reply part: which interface drops the file server\'s answer?',
        'A reply is a separate packet from the servers to the staff subnet, which is exactly what entry 10 denies. An ACL does not remember the request.',
        'Add a permit above the deny that matches TCP packets with the ACK bit set (the established keyword) from the servers to the staff subnet. A new connection request has no ACK, so it still falls through to the deny.',
    ],
    'fix': [{'addEntry': {'router': 'r1', 'acl': 'PROTECT-STAFF', 'entry': _ext('e0', 5, 'permit', 'tcp', SERVERS, STAFF, est=True)}}],
    'fixText': ['Add entry 5 to PROTECT-STAFF: permit tcp 10.1.30.0 0.0.0.255 10.1.10.0 0.0.0.255 established. Replies carry the ACK bit and pass; a server\'s own connection request does not, and meets the deny at 10.'],
    'expectFixed': [_conn('staff', 'files', 'tcp', 445, 'success'), _conn('files', 'staff', 'tcp', 3389, 'failed', code='explicit-deny')],
    'lesson': 'ACLs are stateless. The reply to a request is a new packet and meets every ACL on its way back, so blocking one direction can break connections that start in the other. The established keyword permits TCP packets with the ACK or RST bit set, which is how replies are told apart from first packets. It is only a bit test, not connection tracking: a forged packet with ACK set would pass too.',
    'related': ['CCNA: established keyword', 'CCNA: ACLs', 'Security+: stateless vs stateful filtering'],
})

LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'acl', 'pick': 'acl-wildcard', 'label': 'The wildcard mask is not the subnet mask', 'blurb': 'Why 255.255.255.0 in an ACL entry matches almost nothing.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'acl', 'pick': 'acl-standard-placement', 'label': 'Where does a standard ACL belong?', 'blurb': 'Close to the destination, or it blocks the source everywhere.'},
    {'track': 'ccna', 'lesson': 'acls-layer2-wireless-security', 'tool': 'acl', 'pick': 'acl-wrong-direction', 'label': 'ip access-group: in or out?', 'blurb': 'The right interface with the wrong direction does nothing.'},
    {'track': 'cissp', 'lesson': 'network-transport-edge-operations', 'tool': 'acl', 'pick': 'sandbox', 'label': 'Router ACLs to experiment with', 'blurb': 'A branch and head-office router with working ACLs to break and fix.'},
]

_ENTRY_KEYS = ('id', 'seq', 'action', 'src')
_EXT_KEYS = ('proto', 'dst', 'srcPort', 'dstPort')


def _topo_errors(label, t):
    errs = []
    if not isinstance(t, dict) or 'routers' not in t or 'hosts' not in t:
        return [f'{label}: topology needs routers and hosts']
    if not 1 <= len(t['routers']) <= 2:
        errs.append(f'{label}: one or two routers expected')
    ids = [r.get('id') for r in t['routers']] + [h.get('id') for h in t['hosts']]
    ifaces = [i for r in t['routers'] for i in r.get('interfaces', [])]
    ids += [i.get('id') for i in ifaces]
    if len(ids) != len(set(ids)):
        errs.append(f'{label}: router, interface and host ids must all be unique')
    if len(t['hosts']) < 3:
        errs.append(f'{label}: at least three hosts expected')
    ips = [i.get('ip') for i in ifaces] + [h.get('ip') for h in t['hosts']]
    if len(ips) != len(set(ips)):
        errs.append(f'{label}: duplicate IP address')
    iface_ips = {i.get('ip') for i in ifaces}
    for h in t['hosts']:
        if h.get('gateway') not in iface_ips:
            errs.append(f"{label}: host '{h.get('id')}' gateway is not a router interface address")
    for r in t['routers']:
        names = [a.get('name') for a in r.get('acls', [])]
        if len(names) != len(set(names)):
            errs.append(f"{label}: router '{r.get('id')}' has duplicate ACL names")
        for i in r.get('interfaces', []):
            for k in ('aclIn', 'aclOut'):
                if i.get(k) and i[k] not in names:
                    errs.append(f"{label}: interface '{i.get('id')}' applies an unknown ACL")
        for a in r.get('acls', []):
            if a.get('kind') not in ('standard', 'extended'):
                errs.append(f"{label}: ACL '{a.get('name')}' needs kind standard or extended")
            seqs = []
            eids = []
            for e in a.get('entries', []):
                if any(k not in e for k in _ENTRY_KEYS) or (a.get('kind') == 'extended' and any(k not in e for k in _EXT_KEYS)):
                    errs.append(f"{label}: ACL '{a.get('name')}' has an entry missing a field")
                    continue
                if e['action'] not in ('permit', 'deny'):
                    errs.append(f"{label}: ACL '{a.get('name')}' entry action must be permit or deny")
                seqs.append(e['seq'])
                eids.append(e['id'])
            if len(seqs) != len(set(seqs)) or len(eids) != len(set(eids)):
                errs.append(f"{label}: ACL '{a.get('name')}' has duplicate sequence numbers or entry ids")
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
        ends = {h['id'] for h in sc['topology']['hosts']} | {r['id'] for r in sc['topology']['routers']} \
            | {i['id'] for r in sc['topology']['routers'] for i in r['interfaces']}
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
                if ex.get('proto') not in ('tcp', 'udp', 'icmp'):
                    errs.append(f'{label}: {key} needs a proto of tcp, udp or icmp')
        if not any(ex.get('code') or ex.get('warn') for ex in sc['expect']):
            errs.append(f'{label}: expect needs a diagnosis code or a warning to teach from')
        if not (1 <= len(sc['hints']) <= 3):
            errs.append(f'{label}: needs 1 to 3 hints')
        for f in sc['fix']:
            if not any(k in f for k in ('apply', 'setEntry', 'addEntry', 'removeEntry', 'addAcl', 'removeAcl')):
                errs.append(f'{label}: unknown fix entry {sorted(f)}')
        if sc.get('ask') and (sc['ask'].get('from') not in ends or sc['ask'].get('to') not in ends):
            errs.append(f'{label}: ask names an unknown endpoint')
    return errs
