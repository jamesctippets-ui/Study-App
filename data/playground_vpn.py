"""Playground tool: Site-to-site VPN lab (IPsec, generic behaviour).

Two sites, each with LAN subnets, a VPN gateway with a public address, a firewall
in front of it and the tunnel settings at its end. The engine (src/js/03c_pg_vpn.js)
replays: reach the peer (firewall, NAT-T), phase 1 (IKE version, proposal, pre-shared
key), phase 2 (ESP proposal, PFS, traffic selectors), then a traffic test (route into the
tunnel, NAT exemption, selectors, ESP through the firewall, return path) and names the
first failure.

Shape (checked by validate() below and by build.py):
  topology = {'sites': [site_a, site_b]}, each site:
    id, name, gwPublic, peerIp, behindNat, natT, fw{udp500,udp4500,esp}, snat, natExempt,
    mode ('route'|'policy'), routes[{id,dest}], subnets[{id,name,cidr,host{id,name,ip}}],
    ike{version,enc,hash,dh,psk,lifetime}, child{enc,hash,pfs,lifetime}, selectors[{id,local,remote}]
  expect / expectFixed entries: {'from': hostId, 'to': hostId, 'verdict': 'success'|'failed', 'code': <diagnosis code>}
  fix entries: {'site': 'a'|'b'|'both', 'path': 'ike.psk', 'value': ...} | {'site', 'addSelector': {...}} | {'site', 'addRoute': {...}}
"""

TOOL_KEY = 'vpn'

CODES = {
    'bad-config', 'wrong-peer-address', 'firewall-blocks-ike', 'nat-t-disabled', 'ike-version-mismatch',
    'proposal-mismatch', 'psk-mismatch', 'esp-proposal-mismatch', 'pfs-mismatch', 'selector-mismatch',
    'no-route-to-tunnel', 'nat-not-exempt', 'firewall-blocks-esp',
}

_PSK = 'Maple-Harbor-42'


def _ike(**kw):
    d = {'version': 'ikev2', 'enc': 'aes256', 'hash': 'sha256', 'dh': 14, 'psk': _PSK, 'lifetime': 28800}
    d.update(kw)
    return d


def _child(**kw):
    d = {'enc': 'aes256', 'hash': 'sha256', 'pfs': 14, 'lifetime': 3600}
    d.update(kw)
    return d


def _base():
    """A correct, working tunnel between a head office (two LANs) and a branch (one LAN)."""
    return {
        'sites': [
            {
                'id': 'a', 'name': 'Head office', 'gwPublic': '203.0.113.10', 'peerIp': '198.51.100.20',
                'behindNat': False, 'natT': True,
                'fw': {'udp500': True, 'udp4500': True, 'esp': True},
                'snat': True, 'natExempt': '10.2.0.0/24',
                'mode': 'route', 'routes': [{'id': 'a-r1', 'dest': '10.2.0.0/24'}],
                'subnets': [
                    {'id': 'a1', 'name': 'Office LAN', 'cidr': '10.1.0.0/24', 'host': {'id': 'pc-a', 'name': 'PC-A', 'ip': '10.1.0.50'}},
                    {'id': 'a2', 'name': 'Server LAN', 'cidr': '10.1.1.0/24', 'host': {'id': 'srv-a', 'name': 'Server-A', 'ip': '10.1.1.20'}},
                ],
                'ike': _ike(), 'child': _child(),
                'selectors': [
                    {'id': 'a-s1', 'local': '10.1.0.0/24', 'remote': '10.2.0.0/24'},
                    {'id': 'a-s2', 'local': '10.1.1.0/24', 'remote': '10.2.0.0/24'},
                ],
            },
            {
                'id': 'b', 'name': 'Branch', 'gwPublic': '198.51.100.20', 'peerIp': '203.0.113.10',
                'behindNat': False, 'natT': True,
                'fw': {'udp500': True, 'udp4500': True, 'esp': True},
                'snat': True, 'natExempt': '10.1.0.0/24, 10.1.1.0/24',
                'mode': 'route', 'routes': [{'id': 'b-r1', 'dest': '10.1.0.0/24'}, {'id': 'b-r2', 'dest': '10.1.1.0/24'}],
                'subnets': [
                    {'id': 'b1', 'name': 'Branch LAN', 'cidr': '10.2.0.0/24', 'host': {'id': 'pc-b', 'name': 'PC-B', 'ip': '10.2.0.60'}},
                ],
                'ike': _ike(), 'child': _child(),
                'selectors': [
                    {'id': 'b-s1', 'local': '10.2.0.0/24', 'remote': '10.1.0.0/24'},
                    {'id': 'b-s2', 'local': '10.2.0.0/24', 'remote': '10.1.1.0/24'},
                ],
            },
        ],
    }


def _edit(fn):
    t = _base()
    fn(t['sites'][0], t['sites'][1])
    return t


SANDBOX = _base()

_ask = {'from': 'pc-a', 'to': 'pc-b'}
_ok = {**_ask, 'verdict': 'success'}
_ok_srv = {'from': 'srv-a', 'to': 'pc-b', 'verdict': 'success'}

SCENARIOS = []


def _add(s):
    SCENARIOS.append(s)


# ---------------------------------------------------------------- starters

_add({
    'id': 'vpn-psk',
    'title': 'The key was rotated and the tunnel died',
    'goal': 'Both gateways must hold the identical pre-shared key.',
    'level': 'starter',
    'story': 'The branch gateway was re-keyed after a security review. Since then the branch cannot reach head office, and the head office team says the algorithms on both ends have not changed.',
    'topology': _edit(lambda a, b: b['ike'].update({'psk': 'Maple-Harbor-24'})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'psk-mismatch'}],
    'hints': [
        'Look at the tunnel status: which stage is the first one that fails?',
        'The algorithms agreed (the trace says so). What else does each gateway prove to the other during phase 1?',
        'Compare the two pre-shared keys character by character, including digits and case.',
    ],
    'fix': [{'site': 'b', 'path': 'ike.psk', 'value': _PSK}],
    'fixText': ['Set the Branch pre-shared key to Maple-Harbor-42, exactly as at Head office (the digits were swapped).'],
    'expectFixed': [_ok],
    'lesson': 'With pre-shared-key authentication both gateways must hold exactly the same secret. The proposal can match perfectly and the Diffie-Hellman exchange can succeed, and authentication still fails when one character differs (keys are case-sensitive). Phase 1 never completes, so there is no tunnel at all.',
    'related': ['CCNA: IPsec site-to-site VPN', 'AZ-802: shared key on a site-to-site connection'],
})

_add({
    'id': 'vpn-ike-version',
    'title': 'Old branch firewall, new head office',
    'goal': 'Both ends must run the same IKE version.',
    'level': 'starter',
    'story': 'Head office moved its VPN gateway to IKEv2 during an upgrade. The branch device was left alone and the tunnel has been down since the maintenance window.',
    'topology': _edit(lambda a, b: b['ike'].update({'version': 'ikev1'})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'ike-version-mismatch'}],
    'hints': [
        'The firewall rules are fine and the peers reach each other. Which phase fails?',
        'Compare the IKE version on the two ends, in the table at the top of the settings.',
    ],
    'fix': [{'site': 'b', 'path': 'ike.version', 'value': 'ikev2'}],
    'fixText': ['Set the Branch gateway to IKEv2 as well (or, if it truly cannot do IKEv2, set Head office back to IKEv1). The two ends have to match.'],
    'expectFixed': [_ok],
    'lesson': 'IKEv1 and IKEv2 are different protocols with different message exchanges, not two settings of the same one, so a gateway cannot negotiate with a peer that speaks the other. The fix is to agree on one version; IKEv2 is the newer one and should be preferred where both ends support it.',
    'related': ['CCNA: IPsec site-to-site VPN', 'SC-500: VPN gateways'],
})

# ---------------------------------------------------------------- core

_add({
    'id': 'vpn-firewall',
    'title': 'A new firewall in front of the branch gateway',
    'goal': 'The firewall must let IKE in (UDP 500) and the encrypted data in (ESP, IP protocol 50).',
    'level': 'core',
    'story': 'Branch IT put a new firewall in front of the VPN gateway. It allows web traffic and nothing else. Head office cannot reach the branch, and the logs show IKE packets leaving but no replies.',
    'topology': _edit(lambda a, b: b['fw'].update({'udp500': False, 'udp4500': False, 'esp': False})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'firewall-blocks-ike'}],
    'hints': [
        'Read the status stages: the first one is red, so nothing else has even been tried.',
        'IKE negotiation uses a UDP port. Which firewall switches control it?',
        'Fix the first problem and run it again. A second one can be hiding behind it: the encrypted data is a different protocol from IKE.',
    ],
    'fix': [{'site': 'b', 'path': 'fw.udp500', 'value': True}, {'site': 'b', 'path': 'fw.esp', 'value': True}],
    'fixText': [
        'Allow inbound UDP 500 (IKE) to the Branch gateway.',
        'Then allow inbound IP protocol 50 (ESP). Without it phase 1 and phase 2 come up, but every encrypted packet is dropped.',
        'UDP 4500 is only needed when a NAT device sits in the path (NAT traversal); there is none here.',
    ],
    'expectFixed': [_ok],
    'lesson': 'A VPN needs the firewall to allow two different things: IKE (UDP 500, plus UDP 4500 when NAT traversal is in use) to build the tunnel, and ESP (IP protocol 50, which has no ports) to carry the data. Allowing only UDP 500 gives the classic "tunnel is up, nothing passes".',
    'related': ['CCNA: IPsec site-to-site VPN', 'SC-500: network perimeter security'],
})

_add({
    'id': 'vpn-proposal',
    'title': 'Different ideas about "secure enough"',
    'goal': 'Phase 1 needs one set of IKE algorithms that both ends accept.',
    'level': 'core',
    'story': 'Head office tightened its VPN policy to SHA-256 and a 2048-bit Diffie-Hellman group. The branch gateway is older and still uses what the vendor shipped. The tunnel will not come up and the pre-shared key was checked twice.',
    'topology': _edit(lambda a, b: b['ike'].update({'hash': 'sha1', 'dh': 2})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'proposal-mismatch'}],
    'hints': [
        'The trace names the settings that differ. Read it, and do not touch the key.',
        'Compare the phase 1 rows of the comparison table: more than one value is different.',
    ],
    'fix': [{'site': 'b', 'path': 'ike.hash', 'value': 'sha256'}, {'site': 'b', 'path': 'ike.dh', 'value': 14}],
    'fixText': ['Set the Branch phase 1 integrity to SHA-256 and the DH group to 14, to match Head office (or lower Head office to SHA-1 and group 2, which is the weaker choice).'],
    'expectFixed': [_ok],
    'lesson': 'Phase 1 begins with the two gateways agreeing on encryption, integrity and a Diffie-Hellman group. If they have no combination in common, the responder rejects the exchange before any key is checked. Real gateways usually offer a list, so a mismatch means the lists do not overlap at all.',
    'related': ['CCNA: IPsec site-to-site VPN', 'SC-500: VPN gateways'],
})

_add({
    'id': 'vpn-pfs',
    'title': 'Phase 1 is up, phase 2 is not',
    'goal': 'Both ends must agree on whether to use perfect forward secrecy, and on the group.',
    'level': 'core',
    'story': 'Head office turned on PFS to satisfy an audit finding. The tunnel status shows the IKE connection as established, yet the branch cannot reach anything and no child tunnel appears.',
    'topology': _edit(lambda a, b: b['child'].update({'pfs': 'none'})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'pfs-mismatch'}],
    'hints': [
        'Phase 1 is green and phase 2 is red. Which phase 2 setting is about fresh Diffie-Hellman keys?',
        'Look at the PFS row in the comparison table.',
    ],
    'fix': [{'site': 'b', 'path': 'child.pfs', 'value': 14}],
    'fixText': ['Set PFS to group 14 on the Branch gateway as well (or turn PFS off on both ends; matching matters more than the choice).'],
    'expectFixed': [_ok],
    'lesson': 'Perfect forward secrecy makes each child SA derive its keys from a fresh Diffie-Hellman exchange, so a later key compromise does not expose old traffic. Both ends must ask for the same thing: PFS on one end only, or two different groups, causes the child SA to be rejected even though phase 1 is healthy.',
    'related': ['CCNA: IPsec site-to-site VPN', 'AZ-802: IPsec/IKE policy'],
})

# ---------------------------------------------------------------- stretch

_add({
    'id': 'vpn-selectors',
    'title': 'The tunnel is up, but only one LAN works',
    'goal': 'Each end\'s selectors must be mirror images, for every subnet you want to protect.',
    'level': 'stretch',
    'story': 'The VPN dashboard shows the tunnel as up. Users on the head office Office LAN can reach the branch, but the file server on the Server LAN gets no answer from the branch at all.',
    'topology': _edit(lambda a, b: b.update({'selectors': [b['selectors'][0]]})),
    'ask': {'from': 'srv-a', 'to': 'pc-b'},
    'expect': [{'from': 'pc-a', 'to': 'pc-b', 'verdict': 'success'}, {'from': 'srv-a', 'to': 'pc-b', 'verdict': 'failed', 'code': 'selector-mismatch'}],
    'hints': [
        'Run the test from PC-A, then from Server-A. What is different about the two?',
        'Phase 2 shows how many selector pairs came up. Does the Branch list every network Head office offers?',
        'Whatever Head office lists as local, the Branch must list as remote, and the other way round.',
    ],
    'fix': [{'site': 'b', 'addSelector': {'id': 'b-s2', 'local': '10.2.0.0/24', 'remote': '10.1.1.0/24'}}],
    'fixText': ['Add the missing selector on the Branch: local 10.2.0.0/24, remote 10.1.1.0/24 (the mirror image of Head office\'s Server LAN selector). The route and the NAT exemption for that LAN already exist.'],
    'expectFixed': [_ok, _ok_srv],
    'lesson': 'Traffic selectors say which networks the child SA protects, and each end\'s local and remote must mirror the other\'s. When some pairs match and others do not, the tunnel is genuinely up, but only for the pairs both sides agreed on; traffic for the rest is not protected and goes nowhere. Check the selector pairs, not just the green light.',
    'related': ['CCNA: IPsec site-to-site VPN', 'AZ-802: address prefixes for the on-premises network'],
})

_add({
    'id': 'vpn-no-route',
    'title': 'Everything is green and nothing passes',
    'goal': 'A route-based gateway sends traffic into the tunnel only if a route says so.',
    'level': 'stretch',
    'story': 'Both phases are up on both gateways, the firewall rules were checked and the selectors match. Still, PC-A in head office gets no reply from PC-B at the branch.',
    'topology': _edit(lambda a, b: a.update({'routes': []})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'no-route-to-tunnel'}],
    'hints': [
        'The status stages for the tunnel are green. Read the traffic test trace line by line.',
        'Where does Head office send a packet for 10.2.0.60, and what happens to it there?',
    ],
    'fix': [{'site': 'a', 'addRoute': {'id': 'a-r1', 'dest': '10.2.0.0/24'}}],
    'fixText': ['Add a static route at Head office: destination 10.2.0.0/24, next hop the VPN tunnel. (A policy-based setup would not need the route; the selectors would steer the traffic.)'],
    'expectFixed': [_ok],
    'lesson': 'The tunnel and the routing are separate things. A route-based gateway moves traffic into the tunnel only when a route (static, or learned by a routing protocol) for the remote network points at it; without one the packets follow the default route to the ISP, which drops private destinations. "Tunnel up" never means "traffic routed".',
    'related': ['CCNA: static routes', 'AZ-802: routing between on-premises and Azure'],
})

_add({
    'id': 'vpn-nat-exempt',
    'title': 'The request arrives, the reply never does',
    'goal': 'Traffic for the other site must not be source-NATed before it is encrypted.',
    'level': 'stretch',
    'story': 'PC-A pings PC-B. The packet capture at the branch shows the ping arriving, but PC-A never sees an answer. The branch router also provides internet access with NAT, and the head office side is configured correctly.',
    'topology': _edit(lambda a, b: b.update({'natExempt': ''})),
    'ask': _ask,
    'expect': [{**_ask, 'verdict': 'failed', 'code': 'nat-not-exempt'}],
    'hints': [
        'The request makes it to PC-B. Follow the reply back through the Branch gateway.',
        'Internet access needs source NAT. Should traffic for 10.1.0.0/24 and 10.1.1.0/24 get the same treatment?',
    ],
    'fix': [{'site': 'b', 'path': 'natExempt', 'value': '10.1.0.0/24, 10.1.1.0/24'}],
    'fixText': ['At the Branch, exempt the head office networks (10.1.0.0/24 and 10.1.1.0/24) from source NAT, so replies keep their private source address and match the tunnel selectors.'],
    'expectFixed': [_ok],
    'lesson': 'Source NAT for internet access rewrites the source address of everything that leaves the LAN. If traffic for the other site is translated too, it no longer matches the tunnel\'s selector (which expects the private address), so it bypasses the tunnel. Add a NAT exemption for the remote networks; the name and syntax differ between platforms, the principle does not.',
    'related': ['CCNA: NAT and PAT', 'SSCP: VPN and NAT interaction'],
})

# Lesson links: the on-premises half of a hybrid link, then the same idea for the AZ-802 lesson.
LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'security-concepts-aaa-vpn', 'tool': 'vpn', 'pick': 'vpn-psk', 'label': 'Build and break a site-to-site IPsec tunnel', 'blurb': 'Phase 1, phase 2, selectors, routes and NAT exemption, with the first failure named.'},
    {'track': 'ccna', 'lesson': 'security-concepts-aaa-vpn', 'tool': 'vpn', 'pick': 'vpn-selectors', 'label': 'The tunnel is up but only one LAN works', 'blurb': 'Mirror-image traffic selectors.'},
    {'track': 'az802', 'lesson': 'on-premises-hybrid-networking', 'tool': 'vpn', 'pick': 'sandbox', 'label': 'The on-premises half of a site-to-site VPN', 'blurb': 'Shared key, IKE and IPsec settings, address prefixes and routes: the same pieces a hybrid link needs on both sides.'},
]

_HOSTS = ('pc-a', 'srv-a', 'pc-b')
_SITE_KEYS = ('id', 'name', 'gwPublic', 'peerIp', 'behindNat', 'natT', 'fw', 'snat', 'natExempt', 'mode', 'routes', 'subnets', 'ike', 'child', 'selectors')


def _topo_errors(label, t):
    errs = []
    if not isinstance(t, dict) or not isinstance(t.get('sites'), list) or len(t['sites']) != 2:
        return [f'{label}: topology needs exactly two sites']
    ids = []
    host_ids = []
    for s in t['sites']:
        for k in _SITE_KEYS:
            if k not in s:
                errs.append(f"{label}: site '{s.get('id')}' is missing '{k}'")
        ids.append(s.get('id'))
        if s.get('mode') not in ('route', 'policy'):
            errs.append(f"{label}: site '{s.get('id')}' mode must be route or policy")
        if set((s.get('fw') or {}).keys()) != {'udp500', 'udp4500', 'esp'}:
            errs.append(f"{label}: site '{s.get('id')}' fw needs udp500, udp4500 and esp")
        for k in ('version', 'enc', 'hash', 'dh', 'psk', 'lifetime'):
            if k not in (s.get('ike') or {}):
                errs.append(f"{label}: site '{s.get('id')}' ike is missing '{k}'")
        for k in ('enc', 'hash', 'pfs', 'lifetime'):
            if k not in (s.get('child') or {}):
                errs.append(f"{label}: site '{s.get('id')}' child is missing '{k}'")
        for n in s.get('subnets', []):
            host_ids.append(n.get('host', {}).get('id'))
        sel_ids = [x.get('id') for x in s.get('selectors', [])]
        if len(sel_ids) != len(set(sel_ids)):
            errs.append(f"{label}: site '{s.get('id')}' has duplicate selector ids")
    if len(set(ids)) != 2:
        errs.append(f'{label}: the two sites need different ids')
    if len(host_ids) != len(set(host_ids)) or None in host_ids:
        errs.append(f'{label}: host ids must be unique')
    return errs


def validate():
    errs = []
    errs.extend(_topo_errors('sandbox', SANDBOX))
    host_ids = {n['host']['id'] for s in SANDBOX['sites'] for n in s['subnets']}
    if len(SCENARIOS) < 6 or len(SCENARIOS) > 8:
        errs.append(f'expected 6 to 8 scenarios, found {len(SCENARIOS)}')
    levels = [s['level'] for s in SCENARIOS]
    if levels.count('starter') < 2 or levels.count('core') < 3 or not (1 <= levels.count('stretch') <= 3):
        errs.append('level mix should be 2+ starter, 3+ core and 1-3 stretch')
    for sc in SCENARIOS:
        label = f"scenario '{sc['id']}'"
        errs.extend(_topo_errors(label, sc['topology']))
        hosts = {n['host']['id'] for s in sc['topology']['sites'] for n in s['subnets']}
        for key in ('expect', 'expectFixed'):
            for ex in sc[key]:
                if ex.get('from') not in hosts or ex.get('to') not in hosts:
                    errs.append(f'{label}: {key} names an unknown host')
                if ex.get('verdict') not in ('success', 'failed'):
                    errs.append(f'{label}: {key} verdict must be success or failed')
                if ex.get('code') and ex['code'] not in CODES:
                    errs.append(f"{label}: unknown diagnosis code '{ex['code']}'")
        if not any(ex.get('verdict') == 'failed' for ex in sc['expect']):
            errs.append(f'{label}: expect needs at least one failing outcome')
        if any(ex.get('verdict') != 'success' for ex in sc['expectFixed']):
            errs.append(f'{label}: expectFixed must all be success')
        if not (1 <= len(sc['hints']) <= 3):
            errs.append(f'{label}: needs 1 to 3 hints')
        for f in sc['fix']:
            if f.get('site') not in ('a', 'b', 'both') or not (f.get('path') or f.get('addSelector') or f.get('addRoute')):
                errs.append(f'{label}: a fix entry needs a site and a path, addSelector or addRoute')
        if sc.get('ask') and (sc['ask'].get('from') not in hosts or sc['ask'].get('to') not in hosts):
            errs.append(f'{label}: ask names an unknown host')
    for h in _HOSTS:
        if h not in host_ids:
            errs.append(f'sandbox lacks host {h}')
    return errs
