"""DNS lab scenarios for the IT Playground (engine: src/js/03c_pg_dns.js, screens: src/js/04l_pg_dns.jsx).

Topology shape (see the header of the engine for the full description):
  zone:      {name, negativeTtl, records: [{id, name, type, value, ttl, pref?}], internal: [same]}
             name is relative to the zone ('@' is the apex); type is A, AAAA, CNAME or MX; ttl is seconds or '5m', '1h', '1d'
  auth:      {name, ip, online, splitHorizon}               the one authoritative server; internal = the inside view when splitHorizon is on
  resolvers: [{id, name, ip, online, upstream: 'auth'|'', network: 'internal'|'external'}]
  clients:   [{id, name, network: 'internal'|'external', dns, hosts: [{name, ip}]}]
  machines:  [{id, name, ips: [], serves: [fqdn]}]            the real devices behind the addresses
  hairpin:   bool                                            can inside clients reach an inside server by its public address?

A goal (an entry of expect / expectFixed) is {client, name, type?, verdict: 'success'|'failed', code?, answer?, label?, setup?, script?}:
the engine applies the optional setup edits ([{path, value}]), plays the optional script on a fresh clock with empty caches
([{do: 'query', client?, name?, type?} | {do: 'advance', minutes} | {do: 'edit', path, value} | {do: 'apply', fixes} | {do: 'flush', resolver?}])
and judges the last lookup. `answer` is the list of values a successful lookup must return.
A path is dot separated; inside a list a segment is an index or '#id' (the item with that id), e.g. 'zone.records.#www.value'.
A fix is a list of {path, value} (set a field), {push, value} (append to a list) or {remove} (drop a list item).
"""

TOOL_KEY = 'dns'

TOPOLOGY_KEYS = ('zone', 'auth', 'resolvers', 'clients', 'machines', 'hairpin')

RECORD_TYPES = ('A', 'AAAA', 'CNAME', 'MX')
DO_STEPS = ('query', 'advance', 'edit', 'apply', 'flush')


def _rec(rid, name, rtype, value, ttl=3600, pref=None):
    r = {'id': rid, 'name': name, 'type': rtype, 'value': value, 'ttl': ttl}
    if rtype == 'MX':
        r['pref'] = 10 if pref is None else pref
    return r


def _client(cid, name, dns='10.0.0.53', network='internal', hosts=None):
    return {'id': cid, 'name': name, 'network': network, 'dns': dns, 'hosts': hosts or []}


def _machine(mid, name, ips, serves=()):
    return {'id': mid, 'name': name, 'ips': list(ips), 'serves': list(serves)}


def _resolver(rid='res', name='Office resolver', ip='10.0.0.53', network='internal', online=True):
    return {'id': rid, 'name': name, 'ip': ip, 'online': online, 'upstream': 'auth', 'network': network}


def _topo(records, clients, machines, internal=None, split=False, hairpin=False, resolvers=None, negative_ttl=300):
    return {
        'zone': {'name': 'example.com', 'negativeTtl': negative_ttl, 'records': records, 'internal': internal or []},
        'auth': {'name': 'Zone server', 'ip': '10.0.0.54', 'online': True, 'splitHorizon': split},
        'resolvers': resolvers or [_resolver()],
        'clients': clients,
        'machines': machines,
        'hairpin': hairpin,
    }


def _goal(client, label, verdict='success', name=None, **kw):
    g = {'client': client, 'name': name or 'www.example.com', 'verdict': verdict, 'label': label}
    g.update(kw)
    return g


# ---------------------------------------------------------------- scenario 1: the record points at the wrong machine
_WRONG_RECORD = _topo(
    [_rec('intranet', 'intranet', 'A', '10.0.1.21'), _rec('files', 'files', 'A', '10.0.1.30'),
     _rec('mail', 'mail', 'A', '10.0.1.25'), _rec('mx', '@', 'MX', 'mail')],
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben desktop')],
    [_machine('intranet', 'Intranet server', ['10.0.1.20'], ['intranet.example.com']),
     _machine('print', 'Print server', ['10.0.1.21']),
     _machine('files', 'File server', ['10.0.1.30'], ['files.example.com']),
     _machine('mail', 'Mail server', ['10.0.1.25'], ['mail.example.com'])],
)

# ---------------------------------------------------------------- scenario 2: a client with the wrong DNS server
_WRONG_DNS = _topo(
    [_rec('www', 'www', 'A', '10.0.1.20'), _rec('files', 'files', 'A', '10.0.1.30')],
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben laptop', dns='10.0.0.35')],
    [_machine('web', 'Web server', ['10.0.1.20'], ['www.example.com']),
     _machine('files', 'File server', ['10.0.1.30'], ['files.example.com'])],
)

# ---------------------------------------------------------------- scenario 3: a typo in a record name
_NXDOMAIN = _topo(
    [_rec('helpdesk', 'helpdsk', 'A', '10.0.1.40'), _rec('www', 'www', 'A', '10.0.1.20')],
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben desktop')],
    [_machine('helpdesk', 'Helpdesk server', ['10.0.1.40'], ['helpdesk.example.com']),
     _machine('web', 'Web server', ['10.0.1.20'], ['www.example.com'])],
)

# ---------------------------------------------------------------- scenario 4: two aliases pointing at each other
_LOOP = _topo(
    [_rec('www', 'www', 'CNAME', 'web'), _rec('web', 'web', 'CNAME', 'www'), _rec('files', 'files', 'A', '10.0.1.30')],
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben desktop')],
    [_machine('web', 'Web server', ['10.0.1.20'], ['www.example.com', 'web.example.com']),
     _machine('files', 'File server', ['10.0.1.30'], ['files.example.com'])],
)

# ---------------------------------------------------------------- scenario 5: an old hosts file line
_HOSTS = _topo(
    [_rec('intranet', 'intranet', 'A', '10.0.1.20'), _rec('files', 'files', 'A', '10.0.1.30')],
    [_client('ana', 'Ana laptop'),
     _client('dave', "Dave's PC", hosts=[{'name': 'intranet.example.com', 'ip': '10.0.1.19'}])],
    [_machine('intranet', 'Intranet server', ['10.0.1.20'], ['intranet.example.com']),
     _machine('files', 'File server', ['10.0.1.30'], ['files.example.com'])],
)

# ---------------------------------------------------------------- scenario 6: a long TTL in front of a move
_MIGRATE = [
    {'do': 'edit', 'path': 'zone.records.#www.value', 'value': '10.0.1.20'},
    {'do': 'query'},
    {'do': 'edit', 'path': 'zone.records.#www.value', 'value': '10.0.1.30'},
    {'do': 'advance', 'minutes': 10},
]
_STALE = _topo(
    [_rec('www', 'www', 'A', '10.0.1.30', ttl='1d'), _rec('mail', 'mail', 'A', '10.0.1.25')],
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben desktop')],
    [_machine('old', 'Old web server', ['10.0.1.20']),
     _machine('new', 'New web server', ['10.0.1.30'], ['www.example.com']),
     _machine('mail', 'Mail server', ['10.0.1.25'], ['mail.example.com'])],
)

# ---------------------------------------------------------------- scenario 7: a CNAME at the zone apex
_APEX = _topo(
    [_rec('apex', '@', 'CNAME', 'www'), _rec('mx', '@', 'MX', 'mail'), _rec('www', 'www', 'A', '10.0.1.20'),
     _rec('mail', 'mail', 'A', '10.0.1.25')],
    [_client('ana', 'Ana laptop')],
    [_machine('web', 'Web server', ['10.0.1.20'], ['www.example.com', 'example.com']),
     _machine('mail', 'Mail server', ['10.0.1.25'], ['mail.example.com'])],
)

# ---------------------------------------------------------------- scenario 8: inside clients get the public address
_SPLIT = _topo(
    [_rec('www', 'www', 'A', '203.0.113.10'), _rec('mail', 'mail', 'A', '203.0.113.25')],
    [_client('ana', 'Ana laptop'), _client('remote', 'Remote worker', dns='198.51.100.53', network='external')],
    [_machine('web', 'Web server', ['10.0.1.20', '203.0.113.10'], ['www.example.com']),
     _machine('mail', 'Mail server', ['10.0.1.25', '203.0.113.25'], ['mail.example.com'])],
    resolvers=[_resolver(), _resolver('isp', 'ISP resolver', '198.51.100.53', 'external')],
)

SCENARIOS = [
    {
        'id': 'wrong-record',
        'title': 'The intranet opens the printer page',
        'goal': 'Make intranet.example.com open the intranet server.',
        'level': 'starter',
        'story': 'Everyone can type intranet.example.com and the page starts to load, but it is the login page of the print server, not the intranet. Nothing is wrong with the network: the name resolves and the connection works. Somebody edited the DNS record last week.',
        'topology': _WRONG_RECORD,
        'expect': [
            _goal('ana', 'Ana reaches the wrong machine', 'failed', name='intranet.example.com', code='wrong-record'),
        ],
        'hints': [
            'Run the lookup and read the trace: the name does resolve, so DNS answered. Ask yourself what is at the address it gave.',
            'Compare the address in the intranet record with the addresses in the list of servers. The record has to hold the address of the machine that really serves the intranet.',
            'Change the value of the intranet A record from 10.0.1.21 to 10.0.1.20, the intranet server. If the next lookup still shows the old address, the resolver has cached it: use "Flush and look again" under the result.',
        ],
        'fix': [{'path': 'zone.records.#intranet.value', 'value': '10.0.1.20'}],
        'fixText': ['In the zone, change the value of the intranet A record from 10.0.1.21 (the print server) to 10.0.1.20 (the intranet server).'],
        'expectFixed': [
            _goal('ana', 'Ana reaches the intranet server', name='intranet.example.com', answer=['10.0.1.20']),
            _goal('ben', 'Ben reaches the intranet server', name='intranet.example.com', answer=['10.0.1.20']),
            _goal('ana', 'The file server still works', name='files.example.com'),
        ],
        'lesson': 'A record is only a statement that a name maps to an address; DNS never checks that the address belongs to the right machine. So "the name resolves" and "the name goes to the right place" are two different questions. When a name gives the wrong site or a timeout, compare the value in the record with the real address of the server before you blame the network.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'wrong-dns-server',
        'title': 'Ben can ping addresses but not names',
        'goal': 'Make every laptop able to look up names.',
        'level': 'starter',
        'story': 'Ben says "the internet is down", yet he can ping 10.0.1.20 and 10.0.1.30 by address. Ana, next to him, opens www.example.com and files.example.com without problems. The resolver and the zone are fine.',
        'topology': _WRONG_DNS,
        'expect': [
            _goal('ben', 'Ben cannot look up names', 'failed', code='wrong-dns-server'),
            _goal('ana', 'Ana can look up names'),
        ],
        'hints': [
            'Only one laptop is affected, and pinging an address works. So the network is fine; something in this laptop\'s own settings is different from Ana\'s.',
            'Open the Clients editor and compare the DNS server address of the two laptops with the address of the resolver.',
            'Ben\'s DNS server is 10.0.0.35, a typing mistake. Set it to the resolver\'s address, 10.0.0.53.',
        ],
        'fix': [{'path': 'clients.#ben.dns', 'value': '10.0.0.53'}],
        'fixText': ['In the Clients editor, change Ben laptop\'s DNS server from 10.0.0.35 to 10.0.0.53, the address of the Office resolver.'],
        'expectFixed': [
            _goal('ben', 'Ben can look up www.example.com'),
            _goal('ben', 'Ben can look up files.example.com', name='files.example.com'),
            _goal('ana', 'Ana can still look up names'),
        ],
        'lesson': 'A client sends every DNS query to the DNS server in its own IP settings (usually handed out by DHCP together with the address, mask and gateway). If that address is wrong, or nothing answers there, every lookup waits and then times out, although traffic to IP addresses works. "I can ping the address but not the name" points at DNS settings; nslookup or dig against the intended server shows whether it answers.',
        'related': ['CCNA: DNS', 'CCNA: DHCP'],
    },
    {
        'id': 'nxdomain',
        'title': 'Helpdesk: server not found',
        'goal': 'Make helpdesk.example.com resolve for everyone.',
        'level': 'core',
        'story': 'The helpdesk team moved their ticket system to a new server and added a DNS record for it. Now everybody gets "server not found" for helpdesk.example.com. The server itself is up and answers on 10.0.1.40.',
        'topology': _NXDOMAIN,
        'expect': [
            _goal('ana', 'The name does not exist', 'failed', name='helpdesk.example.com', code='nxdomain'),
        ],
        'hints': [
            'Read the result: the zone server answers NXDOMAIN, which means "no record of that name exists". It is not a problem of the server being down.',
            'Compare the name that is asked for, helpdesk.example.com, with the names of the records in the zone, letter by letter.',
            'The record is called helpdsk. Rename it to helpdesk. If it still fails afterwards, the resolver may have remembered the failure: flush its cache or move the clock forward 5 minutes.',
        ],
        'fix': [{'path': 'zone.records.#helpdesk.name', 'value': 'helpdesk'}],
        'fixText': ['In the zone, rename the record helpdsk to helpdesk (the value 10.0.1.40 is right).', 'If the resolver still answers "no such name", it cached the failure (negative caching): flush its cache or advance the clock by 5 minutes.'],
        'expectFixed': [
            _goal('ana', 'Ana reaches the helpdesk server', name='helpdesk.example.com', answer=['10.0.1.40']),
            _goal('ben', 'Ben reaches the helpdesk server', name='helpdesk.example.com', answer=['10.0.1.40']),
            _goal('ana', 'www still works', name='www.example.com'),
        ],
        'lesson': 'NXDOMAIN ("non-existent domain") means the server is sure the name does not exist: usually a typo in the record name or in the name being looked up, or a record that was never created. Resolvers cache that negative answer too, for the zone\'s negative TTL (RFC 2308), so after you fix the zone a resolver may keep answering "no such name" for a few more minutes. Fixing the zone does not clear a cached answer.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'cname-loop',
        'title': 'Two aliases chase each other',
        'goal': 'Make www.example.com resolve to the web server.',
        'level': 'core',
        'story': 'Someone tidied the zone and turned the web server\'s name into an alias, "so there is only one place to change the address". Since then www.example.com fails for everyone with a server failure, while files.example.com still works.',
        'topology': _LOOP,
        'expect': [
            _goal('ana', 'The aliases never reach an address', 'failed', code='cname-loop'),
            _goal('ana', 'files still works', name='files.example.com'),
        ],
        'hints': [
            'A CNAME record says "this name is another name for that one". Follow the chain starting at www, one record at a time, and write down every name you visit.',
            'www points at web and web points at www. An alias chain has to end at a name that holds an address (an A record).',
            'Turn the web record into an A record with the web server\'s address, 10.0.1.20. Then www is an alias of web, and web has an address. The resolver may have cached the loop: flush it and look again.',
        ],
        'fix': [{'path': 'zone.records.#web.type', 'value': 'A'}, {'path': 'zone.records.#web.value', 'value': '10.0.1.20'}],
        'fixText': ['In the zone, change the web record from a CNAME to an A record with the value 10.0.1.20.', 'The www record can stay an alias of web.'],
        'expectFixed': [
            _goal('ana', 'Ana reaches the web server through the alias', answer=['10.0.1.20']),
            _goal('ben', 'Ben reaches the web server', answer=['10.0.1.20']),
            _goal('ana', 'web.example.com resolves too', name='web.example.com', answer=['10.0.1.20']),
        ],
        'lesson': 'A CNAME makes one name an alias of another; the resolver restarts the lookup at the target and repeats until it meets a name with the wanted record type. If aliases form a circle it never reaches an address, so the resolver gives up (typically with SERVFAIL) and every lookup of those names fails. Chains also cost one extra lookup per alias, so keep them short, and end every chain at an A or AAAA record.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'hosts-override',
        'title': 'Only Dave still sees the old intranet',
        'goal': 'Make Dave\'s PC reach the same intranet server as everybody else.',
        'level': 'core',
        'story': 'The intranet moved to a new server last month and DNS was updated at once. Everyone reaches it, except Dave, whose browser says the connection timed out. His colleague at the next desk has no trouble. Dave\'s PC is the oldest in the office.',
        'topology': _HOSTS,
        'expect': [
            _goal('dave', 'Dave still goes to the old address', 'failed', name='intranet.example.com', code='hosts-override'),
            _goal('ana', 'Ana reaches the intranet', name='intranet.example.com'),
        ],
        'hints': [
            'DNS is fine for everyone else, so look for something that is different on this one PC. Read the first steps of its trace.',
            'Most systems read a local hosts file (a list of name-to-address lines) before they ask a DNS server, and a line there wins. Open the Clients editor and look at Dave\'s hosts file.',
            'Delete the line that maps intranet.example.com to 10.0.1.19 from Dave\'s hosts file.',
        ],
        'fix': [{'remove': 'clients.#dave.hosts.0'}],
        'fixText': ['In the Clients editor, delete the hosts file line intranet.example.com 10.0.1.19 from Dave\'s PC.'],
        'expectFixed': [
            _goal('dave', 'Dave reaches the intranet server', name='intranet.example.com', answer=['10.0.1.20']),
            _goal('ana', 'Ana still reaches the intranet', name='intranet.example.com', answer=['10.0.1.20']),
        ],
        'lesson': 'Before a computer asks a DNS server, it normally checks its local hosts file, and a matching line wins. That is handy for testing, but forgotten lines outlive the servers they pointed to, and they affect only that one machine, so changing DNS never helps it. When one device disagrees with all the others, check its hosts file and its DNS cache before touching the zone.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'stale-cache',
        'title': 'Half the office still reaches the old web server',
        'goal': 'Make a web server move show up for everyone within ten minutes.',
        'level': 'stretch',
        'story': 'The company moved www.example.com to a new server (10.0.1.30) and changed the A record immediately. An hour later some people still land on the old server (10.0.1.20) and others do not. The record says 10.0.1.30 and its TTL is one day. Use "Replay the story" to watch the cache.',
        'topology': _STALE,
        'expect': [
            _goal('ana', 'Ten minutes after the move Ana still gets the old address', 'failed', code='stale-cache', script=_MIGRATE),
        ],
        'hints': [
            'Replay the story and look at the cache table: the resolver kept the old answer, and it will keep it until the TTL runs out. Changing the zone does not reach into a cache.',
            'The only thing the zone owner controls is how long resolvers may keep a record: the TTL. The goal says that ten minutes after the move the new address must be seen.',
            'Set the TTL of the www record to 300 seconds (5 min) or anything up to 10 minutes. In real life you lower the TTL one old TTL before the move, change the record, and raise the TTL afterwards.',
        ],
        'fix': [{'path': 'zone.records.#www.ttl', 'value': 300}],
        'fixText': ['Set the TTL of the www record to 300 (5 minutes). The replay assumes the lower TTL was already in place before the move.', 'In real life, lower the TTL at least one old TTL (here a day) before the change, change the record, and raise the TTL again once everything works.'],
        'expectFixed': [
            _goal('ana', 'Ten minutes after the move Ana gets the new address', script=_MIGRATE, answer=['10.0.1.30']),
            _goal('ben', 'Ten minutes after the move Ben gets the new address', script=_MIGRATE, answer=['10.0.1.30']),
        ],
        'lesson': 'A resolver keeps each record for its TTL and does not ask again until that runs out, so a change in the zone reaches clients only as the cached copies expire: up to one full TTL later. The cached copy keeps the TTL it had when it was stored, so lowering the TTL after a change does not help. Lower it ahead of a planned change (at least one old TTL earlier), make the change, then raise it again. Low TTLs mean more queries to your server, which is why they are not the default.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'cname-apex',
        'title': 'The whole domain stopped working',
        'goal': 'Make example.com, www and the mail records resolve again.',
        'level': 'stretch',
        'story': 'The owner wanted people who type just example.com (no www) to reach the website, so the admin added a CNAME for the bare domain pointing at www. Within minutes web and mail were both down: every lookup of the domain fails with a server failure.',
        'topology': _APEX,
        'expect': [
            _goal('ana', 'The zone is refused because of the apex CNAME', 'failed', name='example.com', code='cname-apex'),
            _goal('ana', 'Even www fails', 'failed', code='cname-apex'),
        ],
        'hints': [
            'Read the diagnosis: it names the record that makes the whole zone invalid. Look at which name that record belongs to.',
            'The bare domain (the zone apex, written @) already holds other records, such as the MX record for mail. A CNAME means "this name has no data of its own", so it cannot share a name with any other record.',
            'Change the apex record from a CNAME to an A record with the web server\'s address, 10.0.1.20.',
        ],
        'fix': [{'path': 'zone.records.#apex.type', 'value': 'A'}, {'path': 'zone.records.#apex.value', 'value': '10.0.1.20'}],
        'fixText': ['Change the record for @ from a CNAME to an A record with the value 10.0.1.20.', 'Some DNS providers offer an "alias" or "flattening" record for this case, but that is a provider feature, not standard DNS.'],
        'expectFixed': [
            _goal('ana', 'example.com resolves to the web server', name='example.com', answer=['10.0.1.20']),
            _goal('ana', 'www.example.com resolves too', answer=['10.0.1.20']),
            _goal('ana', 'The mail exchanger is found', name='example.com', type='MX', answer=['10 mail.example.com']),
        ],
        'lesson': 'A CNAME says "this name is only an alias" and the name can hold no other data (RFC 1034 section 3.6.2, RFC 2181 section 10.1). The zone apex always holds the zone\'s SOA and NS records, and usually MX records too, so a CNAME there is not allowed. Servers differ in how they react (refusing the record, or refusing the whole zone as in this lab), but the safe answer is always an A or AAAA record at the apex.',
        'related': ['CCNA: DNS'],
    },
    {
        'id': 'split-horizon',
        'title': 'Inside the office the website is unreachable',
        'goal': 'Give inside clients the inside addresses and keep the public addresses for the outside.',
        'level': 'stretch',
        'story': 'The web and mail servers are in the office and reachable from the Internet through public addresses (203.0.113.10 and .25). The remote worker has no problems. Inside the office www.example.com times out: DNS hands out the public address, and the firewall does not send inside traffic out and back in.',
        'topology': _SPLIT,
        'expect': [
            _goal('ana', 'Ana gets the public address and cannot connect', 'failed', code='split-horizon'),
            _goal('remote', 'The remote worker reaches www', answer=['203.0.113.10']),
        ],
        'hints': [
            'Compare the addresses: the outside world needs the public address, but a computer in the office should talk to the server directly with its inside address.',
            'Split-horizon DNS answers the same name differently for inside and outside. Turn it on in the Zone server settings, then look at the internal view: what goes in it?',
            'Turn on split-horizon, then add www (10.0.1.20) and mail (10.0.1.25) to the internal records. An internal view has to contain every name the inside needs, or those names do not exist for the inside. If the old public answer is still cached, flush the resolver and look again.',
        ],
        'fix': [
            {'path': 'auth.splitHorizon', 'value': True},
            {'push': 'zone.internal', 'value': _rec('i-www', 'www', 'A', '10.0.1.20')},
            {'push': 'zone.internal', 'value': _rec('i-mail', 'mail', 'A', '10.0.1.25')},
        ],
        'fixText': ['Turn on split-horizon DNS on the zone server.', 'In the internal records add www A 10.0.1.20 and mail A 10.0.1.25.', 'The public records stay as they are, so the remote worker keeps the public addresses.', 'Turning on hairpin NAT in the firewall would also let inside clients use the public address, but this goal asks for the inside addresses.'],
        'expectFixed': [
            _goal('ana', 'Ana gets the inside address of www', answer=['10.0.1.20']),
            _goal('ana', 'Ana gets the inside address of mail', name='mail.example.com', answer=['10.0.1.25']),
            _goal('remote', 'The remote worker still gets the public address', answer=['203.0.113.10']),
        ],
        'lesson': 'With split-horizon DNS (also called split-brain DNS) one server answers the same name differently depending on who asks: the inside view gives inside addresses, the public view gives public ones. It avoids hairpin NAT and keeps private addresses out of public DNS. The trap is that the internal view is a separate zone: every name the inside needs must be in it, or inside clients get NXDOMAIN for names that exist outside.',
        'related': ['CCNA: DNS', 'CCNA: NAT'],
    },
]

# ---------------------------------------------------------------- the sandbox: a working company network
_SB_PUBLIC = [
    _rec('www', 'www', 'A', '203.0.113.10', ttl=300),
    _rec('apex', '@', 'A', '203.0.113.10', ttl=300),
    _rec('mail', 'mail', 'A', '203.0.113.25'),
    _rec('mx', '@', 'MX', 'mail'),
]
_SB_INTERNAL = [
    _rec('i-www', 'www', 'A', '10.0.1.20', ttl=300),
    _rec('i-apex', '@', 'A', '10.0.1.20', ttl=300),
    _rec('i-mail', 'mail', 'A', '10.0.1.25'),
    _rec('i-mx', '@', 'MX', 'mail'),
    _rec('i-intranet', 'intranet', 'CNAME', 'www'),
    _rec('i-files', 'files', 'A', '10.0.1.30'),
    _rec('i-helpdesk', 'helpdesk', 'A', '10.0.1.40'),
]

SANDBOX = _topo(
    _SB_PUBLIC,
    [_client('ana', 'Ana laptop'), _client('ben', 'Ben desktop'),
     _client('remote', 'Remote worker', dns='198.51.100.53', network='external')],
    [_machine('web', 'Web server', ['10.0.1.20', '203.0.113.10'], ['www.example.com', 'example.com', 'intranet.example.com']),
     _machine('mail', 'Mail server', ['10.0.1.25', '203.0.113.25'], ['mail.example.com']),
     _machine('files', 'File server', ['10.0.1.30'], ['files.example.com']),
     _machine('helpdesk', 'Helpdesk server', ['10.0.1.40'], ['helpdesk.example.com']),
     _machine('print', 'Print server', ['10.0.1.21'])],
    internal=_SB_INTERNAL, split=True,
    resolvers=[_resolver(), _resolver('isp', 'ISP resolver', '198.51.100.53', 'external')],
)

# Lesson links: the CCNA lesson that covers NAT, DHCP, DNS and NTP.
LESSON_LINKS = [
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dns', 'pick': 'wrong-dns-server', 'label': 'Pings work, names do not', 'blurb': 'Why a wrong DNS server address breaks every lookup.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dns', 'pick': 'nxdomain', 'label': 'NXDOMAIN and negative caching', 'blurb': 'A typo in a record name, and why a resolver remembers the failure.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dns', 'pick': 'stale-cache', 'label': 'TTL and cached records on a virtual clock', 'blurb': 'Why a changed record takes up to a full TTL to reach everyone.'},
    {'track': 'ccna', 'lesson': 'nat-dhcp-dns-ntp', 'tool': 'dns', 'pick': 'sandbox', 'label': 'A DNS lab to experiment with', 'blurb': 'Records, resolvers, caches, hosts files and split-horizon DNS in a small company network.'},
]


def validate():
    """Shape rules for the DNS topology and its scenarios; returns a list of error strings."""
    errors = []
    ip_re = __import__('re').compile(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$')

    def is_ip(v):
        m = isinstance(v, str) and ip_re.match(v)
        return bool(m) and all(0 <= int(x) <= 255 for x in m.groups())

    def check_records(records, label, where):
        ids = set()
        for r in records:
            if not isinstance(r, dict) or not r.get('id') or r['id'] in ids:
                errors.append(f'{label}: {where} record ids must be unique and non-empty')
                continue
            ids.add(r['id'])
            if r.get('type') not in RECORD_TYPES:
                errors.append(f'{label}: record {r["id"]} has an unknown type')
            for k in ('name', 'value'):
                if not isinstance(r.get(k), str):
                    errors.append(f'{label}: record {r["id"]} needs a string {k}')
            if not isinstance(r.get('ttl'), (int, str)) or isinstance(r.get('ttl'), bool):
                errors.append(f'{label}: record {r["id"]} needs a ttl')
            if r.get('type') == 'A' and not is_ip(r.get('value')):
                errors.append(f'{label}: A record {r["id"]} needs an IPv4 value')
            if r.get('type') == 'MX' and not isinstance(r.get('pref'), int):
                errors.append(f'{label}: MX record {r["id"]} needs an integer pref')

    def check_topo(topo, label):
        for k in TOPOLOGY_KEYS:
            if k not in topo:
                errors.append(f'{label}: topology needs {k}')
                return set()
        zone = topo['zone']
        if not isinstance(zone.get('name'), str) or '.' not in zone['name']:
            errors.append(f'{label}: zone needs a name')
        if not isinstance(zone.get('negativeTtl'), (int, str)):
            errors.append(f'{label}: zone needs a negativeTtl')
        check_records(zone.get('records') or [], label, 'zone')
        check_records(zone.get('internal') or [], label, 'internal')
        auth = topo['auth']
        if not is_ip(auth.get('ip')) or not isinstance(auth.get('online'), bool) or not isinstance(auth.get('splitHorizon'), bool):
            errors.append(f'{label}: auth needs ip, online and splitHorizon')
        rids = set()
        for r in topo['resolvers']:
            if not r.get('id') or r['id'] in rids:
                errors.append(f'{label}: resolver ids must be unique and non-empty')
            rids.add(r.get('id'))
            if not is_ip(r.get('ip')) or r.get('network') not in ('internal', 'external') or r.get('upstream') not in ('auth', ''):
                errors.append(f'{label}: resolver {r.get("id")} needs ip, network and upstream')
        cids = set()
        for c in topo['clients']:
            if not c.get('id') or c['id'] in cids:
                errors.append(f'{label}: client ids must be unique and non-empty')
            cids.add(c.get('id'))
            if c.get('network') not in ('internal', 'external') or not isinstance(c.get('dns'), str):
                errors.append(f'{label}: client {c.get("id")} needs network and dns')
            for h in c.get('hosts') or []:
                if not isinstance(h.get('name'), str) or not is_ip(h.get('ip')):
                    errors.append(f'{label}: client {c.get("id")} has a bad hosts line')
        if not cids:
            errors.append(f'{label}: needs at least one client')
        mids = set()
        for m in topo['machines']:
            if not m.get('id') or m['id'] in mids:
                errors.append(f'{label}: machine ids must be unique and non-empty')
            mids.add(m.get('id'))
            if not isinstance(m.get('ips'), list) or not m['ips'] or not isinstance(m.get('serves'), list):
                errors.append(f'{label}: machine {m.get("id")} needs ips and serves lists')
        if not isinstance(topo['hairpin'], bool):
            errors.append(f'{label}: hairpin must be a boolean')
        return cids

    def check_goals(goals, clients, label, need_label):
        for g in goals:
            if g.get('client') not in clients:
                errors.append(f'{label}: goal names unknown client {g.get("client")}')
            if g.get('verdict') not in ('success', 'failed'):
                errors.append(f'{label}: goal verdict must be success or failed')
            if g.get('verdict') == 'success' and g.get('code'):
                errors.append(f'{label}: a success goal cannot carry a code')
            if not isinstance(g.get('name'), str) or not g['name']:
                errors.append(f'{label}: every goal needs a name to look up')
            if need_label and not g.get('label'):
                errors.append(f'{label}: every goal needs a label')
            for st in g.get('setup') or []:
                if 'path' not in st or 'value' not in st:
                    errors.append(f'{label}: a setup step needs path and value')
            for st in g.get('script') or []:
                if st.get('do') not in DO_STEPS:
                    errors.append(f'{label}: unknown script step {st}')
                if st.get('client') is not None and st['client'] not in clients:
                    errors.append(f'{label}: script names unknown client {st["client"]}')

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
            if target.split('.')[0] not in TOPOLOGY_KEYS:
                errors.append(f'{label}: fix path {target} must start with a topology key')
        if not 1 <= len(sc['hints']) <= 3:
            errors.append(f'{label}: needs 1 to 3 hints')
    levels = [s['level'] for s in SCENARIOS]
    if levels.count('starter') < 2:
        errors.append('needs at least two starter scenarios')
    check_topo(SANDBOX, 'sandbox')
    return errors
