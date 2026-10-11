"""Playground tool: Certificate checker (TLS server certificates, generic client behaviour).

A client connects to a server by name and decides whether to trust the certificate. The
engine (src/js/03c_pg_certs.js) replays the checks in a fixed teaching order and names the
first one that fails: host name against the subject alternative names, validity dates
(server certificate and intermediate), chain building (is the intermediate sent?), trusted
root (is the root in the client's trust store?), extended key usage, revocation and
signature algorithm. No real cryptography; dates are plain calendar dates.

Shape (checked by validate() below and by build.py):
  topology = {'server': {...}, 'inter': {...}, 'root': {'id'}, 'client': {...}}
    server: cn, sans (comma separated text), notBefore, notAfter (YYYY-MM-DD), issuedBy
            ('intermediate'|'root'|'self'), sendsIntermediate, eku, sigAlg, revoked
    inter:  name, notBefore, notAfter, sigAlg, revoked
    root:   id ('pub'|'corp'|'other')
    client: kind ('browser'|'api'), hostname, date, trusted (list of root ids, plus 'self'), checkRevocation
  expect / expectFixed entries: {'verdict': 'success'|'failed', 'code': <diagnosis code>} and optional
    client overrides {'kind', 'date', 'host', 'revocation'}, so one scenario can check several clients or
    names, and pin the settings that must not be "fixed" instead of the certificate.
  keep (optional): paths that must stay as they were for the scenario to count as solved.
  fix entries: {'path': 'server.sans', 'value': ...} | {'path': 'client.trusted', 'add': 'corp'}
"""

TOOL_KEY = 'certs'

CODES = {
    'bad-config', 'name-mismatch', 'expired', 'not-yet-valid', 'missing-intermediate', 'untrusted-root',
    'wrong-eku', 'revoked', 'weak-signature',
}

ROOT_IDS = ('pub', 'corp', 'other')
EKUS = ('server', 'server+client', 'client', 'code', 'email', 'none')
SIGS = ('sha256rsa', 'sha384ecdsa', 'sha1rsa')

# The lab's "today". Scenarios use fixed dates so they never drift with the real calendar.
_TODAY = '2026-10-11'


def _base():
    """A correct, working setup: a public-CA certificate, intermediate sent, a browser that trusts the root."""
    return {
        'server': {
            'cn': 'www.example.com',
            'sans': 'example.com, *.example.com',
            'notBefore': '2026-09-12', 'notAfter': '2026-12-11',
            'issuedBy': 'intermediate', 'sendsIntermediate': True,
            'eku': 'server', 'sigAlg': 'sha256rsa', 'revoked': False,
        },
        'inter': {'name': 'Example Issuing CA 1', 'notBefore': '2024-03-13', 'notAfter': '2034-03-11', 'sigAlg': 'sha256rsa', 'revoked': False},
        'root': {'id': 'pub'},
        'client': {'kind': 'browser', 'hostname': 'www.example.com', 'date': _TODAY, 'trusted': ['pub', 'other'], 'checkRevocation': True},
    }


def _edit(fn):
    t = _base()
    fn(t['server'], t['inter'], t['root'], t['client'])
    return t


SANDBOX = _base()

SCENARIOS = []


def _add(s):
    SCENARIOS.append(s)


_ok = {'verdict': 'success'}

# ---------------------------------------------------------------- starters

_add({
    'id': 'certs-expired',
    'title': 'Everyone gets a warning on Monday morning',
    'goal': 'The certificate must be inside its validity period on the day the client connects.',
    'level': 'starter',
    'story': 'At 8:05 on Monday every customer of the booking site sees a full-page security warning. Nobody changed anything over the weekend, the web server is up, and the page itself loads fine once you click through the warning.',
    'topology': _edit(lambda s, i, r, c: s.update({'notBefore': '2026-07-12', 'notAfter': '2026-10-10'})),
    'expect': [{'verdict': 'failed', 'code': 'expired'}],
    'hints': [
        'Look at which check turned red first, and read the two dates in the message.',
        'Compare the certificate\'s not-after date with the client\'s clock. Which is earlier, and by how many days?',
        'A certificate cannot be stretched; in real life you get a new one. In the lab, give the server certificate a new validity period that includes the client\'s date.',
    ],
    'fix': [{'path': 'server.notBefore', 'value': '2026-10-11'}, {'path': 'server.notAfter', 'value': '2027-01-09'}],
    'fixText': [
        'Renew the certificate: request a new one from the CA and install it. Here that means a new validity period such as 2026-10-11 to 2027-01-09 (90 days).',
        'Then make renewal automatic. Public CAs may now issue certificates valid for at most 200 days (since 15 March 2026, falling to 100 days in March 2027 and 47 days in March 2029), so manual calendar reminders do not scale.',
    ],
    'expectFixed': [{'verdict': 'success', 'date': _TODAY}],
    'lesson': 'A certificate is only trusted between its not-before and not-after dates (the last day counts). The name, chain and signature can all be perfect and an expired certificate is still rejected. The cause is almost always a missed renewal, which is why renewals are automated and monitored, and why public certificate lifetimes keep getting shorter.',
    'related': ['CISSP: Cryptography and PKI', 'SSCP: certificate lifecycle'],
})

_add({
    'id': 'certs-cn-only',
    'title': 'The right name, in the wrong place',
    'goal': 'The name the client types must appear in the certificate\'s subject alternative names (SAN).',
    'level': 'starter',
    'story': 'The new staff intranet answers at intranet.example.com. Its certificate came from the company CA through an old request template that only fills in the subject line, CN=intranet.example.com. The administrator can read that exact name in the certificate, yet the browsers rolled out this week show a name error.',
    'topology': _edit(lambda s, i, r, c: (
        s.update({'cn': 'intranet.example.com', 'sans': ''}),
        r.update({'id': 'corp'}),
        i.update({'name': 'Corp Issuing CA'}),
        c.update({'hostname': 'intranet.example.com', 'trusted': ['pub', 'other', 'corp']}),
    )),
    'expect': [{'verdict': 'failed', 'code': 'name-mismatch'}],
    'hints': [
        'The CN and the typed name are identical. So which part of the certificate is the client actually reading?',
        'Open the server certificate and look at the subject alternative names. What does the message say about the SAN list?',
    ],
    'fix': [{'path': 'server.sans', 'value': 'intranet.example.com'}],
    'fixText': ['Reissue the certificate with intranet.example.com in the subject alternative names. Fix the request template so every future certificate carries its names as SAN entries; the CN may stay for humans to read.'],
    'expectFixed': [{'verdict': 'success', 'host': 'intranet.example.com'}],
    'lesson': 'Modern clients match the host name against the subject alternative names only. The common name is not used, however perfectly it matches (RFC 9525; Chrome stopped using it in version 58). Public CAs must put the names in the SAN anyway, so this problem mostly hides in old private-CA templates and hand-made certificates.',
    'related': ['CISSP: Cryptography and PKI', 'SSCP: PKI and certificates'],
})

# ---------------------------------------------------------------- core

_add({
    'id': 'certs-clock',
    'title': 'Only the warehouse kiosk complains',
    'goal': 'The client\'s own clock must fall inside the certificate\'s validity period.',
    'level': 'core',
    'story': 'After a power cut, the touch-screen kiosk in the warehouse reports that the company portal is "not valid yet". Every other device in the building opens the same portal without a warning, and the certificate was renewed three weeks ago.',
    'topology': _edit(lambda s, i, r, c: c.update({'date': '2019-01-01'})),
    'expect': [{'verdict': 'failed', 'code': 'not-yet-valid'}],
    'hints': [
        'The problem follows the kiosk, not the server. What does the kiosk know that the other devices do not get wrong?',
        'Compare the client\'s date with the certificate\'s not-before date.',
    ],
    'fix': [{'path': 'client.date', 'value': _TODAY}],
    'fixText': ['Set the kiosk\'s clock to the right date and keep it right with time synchronization (NTP). The certificate and the server are fine; do not touch them.'],
    'expectFixed': [_ok],
    'keep': ['server.notBefore', 'server.notAfter'],
    'lesson': 'Validity is judged against the client\'s clock, so a wrong clock breaks certificate checks in either direction: a clock in the past makes good certificates "not yet valid", a clock in the future makes them "expired". When one device fails and the rest do not, or when every site fails on one device, check its date and time before blaming the certificate.',
    'related': ['CISSP: Cryptography and PKI', 'CCNA: NTP'],
})

_add({
    'id': 'certs-wildcard',
    'title': 'The wildcard that does not cover everything',
    'goal': 'Every name people use must be covered by an entry in the SAN list.',
    'level': 'core',
    'story': 'Marketing bought a wildcard certificate for *.example.com and believes it now covers anything under the company domain. shop.example.com works. The bare example.com on the business cards and the new api.eu.example.com both show a name error.',
    'topology': _edit(lambda s, i, r, c: (
        s.update({'cn': '*.example.com', 'sans': '*.example.com'}),
        c.update({'hostname': 'example.com'}),
    )),
    'ask': {'host': 'example.com'},
    'expect': [
        {'host': 'shop.example.com', 'verdict': 'success'},
        {'host': 'example.com', 'verdict': 'failed', 'code': 'name-mismatch'},
        {'host': 'api.eu.example.com', 'verdict': 'failed', 'code': 'name-mismatch'},
    ],
    'hints': [
        'A wildcard stands for something in one position. Count the labels in *.example.com, then in example.com and in api.eu.example.com.',
        'Try each of the three names in the hostname box. The message names which kind of mistake each one is.',
        'Each name that no entry covers needs its own entry: the bare domain, and a wildcard one level lower for the eu names.',
    ],
    'fix': [{'path': 'server.sans', 'value': '*.example.com, example.com, *.eu.example.com'}],
    'fixText': [
        'Add example.com as its own SAN entry: *.example.com does not cover the bare domain.',
        'Add *.eu.example.com (or the exact name api.eu.example.com): a wildcard covers exactly one label, so it does not reach api.eu.example.com.',
    ],
    'expectFixed': [
        {'host': 'shop.example.com', 'verdict': 'success'},
        {'host': 'example.com', 'verdict': 'success'},
        {'host': 'api.eu.example.com', 'verdict': 'success'},
    ],
    'lesson': 'In a certificate, * is allowed only as the whole left-most label and stands for exactly one label (RFC 9525). So *.example.com covers www.example.com and shop.example.com, but not example.com (no label there) and not a.b.example.com (two labels). Wildcards also cannot be partial, such as w*.example.com.',
    'related': ['CISSP: Cryptography and PKI', 'SSCP: PKI and certificates'],
})

_add({
    'id': 'certs-private-ca',
    'title': 'The company wiki and the contractor\'s laptop',
    'goal': 'The client must trust the root that the server\'s chain ends at.',
    'level': 'core',
    'story': 'IT put the internal wiki behind a certificate issued by the company\'s own CA. Company laptops open it without a prompt. A contractor on a personal laptop gets "your connection is not private", and was told to just click Advanced and carry on.',
    'topology': _edit(lambda s, i, r, c: (
        s.update({'cn': 'wiki.corp.example.com', 'sans': 'wiki.corp.example.com'}),
        r.update({'id': 'corp'}),
        i.update({'name': 'Corp Issuing CA'}),
        c.update({'hostname': 'wiki.corp.example.com', 'trusted': ['pub', 'other']}),
    )),
    'expect': [{'verdict': 'failed', 'code': 'untrusted-root'}],
    'hints': [
        'The name, dates and chain checks pass. Read the failing check: whose root is at the top of the chain?',
        'Open the client\'s trust store. Which roots does this laptop trust?',
        'Company laptops trust the private root because IT put it there. Somebody has to decide that on this client too.',
    ],
    'fix': [{'path': 'client.trusted', 'add': 'corp'}],
    'fixText': [
        'Install the Corp Internal Root CA in the client\'s trust store. Company laptops get it from group policy or device management; for a contractor, hand over the root file through a trusted channel and let them check its fingerprint first.',
        'Not a fix: sending the root with the server\'s chain (clients ignore it for trust) or telling users to click through the warning.',
    ],
    'expectFixed': [_ok],
    'lesson': 'A client trusts a chain only if it ends at a root the client already holds. Public roots ship in operating systems and browsers; a private CA\'s root is trusted only by the machines that were configured to. Installing a root is a security decision: a trusted root can vouch for any name. Self-signed certificates fail the same way, because nothing the client trusts has signed them.',
    'related': ['CISSP: Cryptography and PKI', 'CISSP: certificate authorities'],
})

# ---------------------------------------------------------------- stretch

_add({
    'id': 'certs-missing-intermediate',
    'title': 'Works in the browser, fails in the batch job',
    'goal': 'The server must send every certificate a client needs to reach a root it trusts, not only its own.',
    'level': 'stretch',
    'story': 'The partner portal opens in every browser the developers try. The nightly Python job and the partner\'s curl command both fail with "unable to get local issuer certificate". The certificate is new, the name is right, and the trust stores are up to date.',
    'topology': _edit(lambda s, i, r, c: (
        s.update({'sendsIntermediate': False}),
        c.update({'kind': 'api'}),
    )),
    'ask': {'kind': 'api'},
    'expect': [
        {'kind': 'browser', 'verdict': 'success'},
        {'kind': 'api', 'verdict': 'failed', 'code': 'missing-intermediate'},
    ],
    'hints': [
        'Switch the client between "Web browser" and "API client or script" and run both. What differs?',
        'The server certificate was issued by an intermediate CA, not by the root. Who is supposed to hand the client that intermediate?',
        'Look at what the server sends. Which setting in the server\'s settings controls that?',
    ],
    'fix': [{'path': 'server.sendsIntermediate', 'value': True}],
    'fixText': ['Configure the web server to send the full chain: its own certificate followed by the intermediate (for example the "fullchain" file the CA or ACME client provides, instead of the certificate-only file).'],
    'expectFixed': [
        {'kind': 'browser', 'verdict': 'success'},
        {'kind': 'api', 'verdict': 'success'},
    ],
    'lesson': 'A server should send its certificate and the intermediates, so the client can build a path to a root it trusts (RFC 8446 section 4.4.2). Browsers often paper over a missing intermediate by using one cached from another site or downloading it from the certificate\'s Authority Information Access address. Libraries and scripts usually do not, so "it works in my browser" proves nothing; test the chain with a tool that does not repair it.',
    'related': ['CISSP: Cryptography and PKI', 'SSCP: PKI and certificates'],
})

_add({
    'id': 'certs-revoked',
    'title': 'The key turned up in a public repository',
    'goal': 'A certificate the CA has revoked must be replaced by a new one.',
    'level': 'stretch',
    'story': 'Yesterday the security team found the web server\'s private key in a public code repository and had the CA revoke the certificate. Today every managed laptop refuses the intranet site. The dates are fine and nothing else was changed.',
    'topology': _edit(lambda s, i, r, c: s.update({'revoked': True})),
    'expect': [{'verdict': 'failed', 'code': 'revoked'}],
    'hints': [
        'All the earlier checks pass, so the problem is about the certificate\'s status, not its content.',
        'The client asks the CA whether the certificate is still good. What can the CA answer other than "good"?',
        'Revocation is permanent: you do not undo it. Look for the server certificate setting that stands for the CA\'s answer.',
    ],
    'fix': [{'path': 'server.revoked', 'value': False}],
    'fixText': [
        'Generate a new key pair, request a new certificate (it gets a new serial number) and install it. In the lab, clearing the "revoked" box stands for installing that replacement.',
        'Treat the leaked key as compromised everywhere it was used, and find out how it escaped.',
    ],
    'expectFixed': [{'verdict': 'success', 'revocation': True}],
    'lesson': 'A CA revokes a certificate before its expiry date when the key may be compromised or the certificate was wrongly issued, and publishes that in a certificate revocation list (CRL) or answers it live over OCSP. A revoked certificate stays revoked. Only clients that actually check revocation notice, so revocation is a safety net, not a guarantee.',
    'related': ['CISSP: Cryptography and PKI', 'CISSP: OCSP and CRL'],
})

_add({
    'id': 'certs-wrong-eku',
    'title': 'Name, dates and chain are all fine',
    'goal': 'A certificate for a web server must be allowed to serve as a web server (extended key usage serverAuth).',
    'level': 'stretch',
    'story': 'The new reporting site\'s certificate came from the company CA, and the administrator checked everything: the name is in the SAN, the dates are good, the chain is complete and the root is trusted. Browsers still refuse it. Someone remembers picking the first template in the request form.',
    'topology': _edit(lambda s, i, r, c: (
        s.update({'cn': 'reports.corp.example.com', 'sans': 'reports.corp.example.com', 'eku': 'client'}),
        r.update({'id': 'corp'}),
        i.update({'name': 'Corp Issuing CA'}),
        c.update({'hostname': 'reports.corp.example.com', 'trusted': ['pub', 'other', 'corp']}),
    )),
    'expect': [{'verdict': 'failed', 'code': 'wrong-eku'}],
    'hints': [
        'Four checks pass and the fifth fails. Read its message: what is the certificate allowed to be used for?',
        'Open "Usage, signature and revocation" on the server certificate and compare the extended key usage with what a web server needs.',
    ],
    'fix': [{'path': 'server.eku', 'value': 'server'}],
    'fixText': ['Request a new certificate from the "web server" template (extended key usage serverAuth) and install it. The EKU is part of the signed certificate, so it cannot be edited afterwards; in the lab, change the EKU to stand for the reissue.'],
    'expectFixed': [_ok],
    'lesson': 'The extended key usage says what a certificate may be used for. When the extension is present, a client must only use the certificate for the listed purposes (RFC 5280), and a TLS client looking at a web server requires serverAuth. A certificate made for client authentication, code signing or email is therefore refused as a server certificate, however good its name, dates and chain.',
    'related': ['CISSP: Cryptography and PKI', 'SSCP: PKI and certificates'],
})

# Lesson links: the CISSP cryptography and PKI lesson.
LESSON_LINKS = [
    {'track': 'cissp', 'lesson': 'cryptography-pki', 'tool': 'certs', 'pick': 'certs-private-ca', 'label': 'Why does the browser not trust this certificate?', 'blurb': 'A private CA the client has never been told to trust: the chain, the root and the trust store.'},
    {'track': 'cissp', 'lesson': 'cryptography-pki', 'tool': 'certs', 'pick': 'sandbox', 'label': 'Build and break a certificate chain', 'blurb': 'Names and wildcards, validity dates, the intermediate, trusted roots, key usage, revocation and SHA-1, with the first failure named.'},
]

_SERVER_KEYS = ('cn', 'sans', 'notBefore', 'notAfter', 'issuedBy', 'sendsIntermediate', 'eku', 'sigAlg', 'revoked')
_INTER_KEYS = ('name', 'notBefore', 'notAfter', 'sigAlg', 'revoked')
_CLIENT_KEYS = ('kind', 'hostname', 'date', 'trusted', 'checkRevocation')


def _date_ok(text):
    import datetime
    import re
    if not isinstance(text, str) or not re.match(r'^\d{4}-\d{2}-\d{2}$', text):
        return False
    try:
        d = datetime.date.fromisoformat(text)
    except ValueError:
        return False
    return 1970 <= d.year <= 2099


def _topo_errors(label, t):
    errs = []
    if not isinstance(t, dict):
        return [f'{label}: topology must be a dict']
    for part, keys in (('server', _SERVER_KEYS), ('inter', _INTER_KEYS), ('client', _CLIENT_KEYS)):
        for k in keys:
            if k not in (t.get(part) or {}):
                errs.append(f"{label}: {part} is missing '{k}'")
    if errs:
        return errs
    s, i, c = t['server'], t['inter'], t['client']
    if (t.get('root') or {}).get('id') not in ROOT_IDS:
        errs.append(f'{label}: root.id must be one of {ROOT_IDS}')
    if s['issuedBy'] not in ('intermediate', 'root', 'self'):
        errs.append(f'{label}: server.issuedBy must be intermediate, root or self')
    if s['eku'] not in EKUS:
        errs.append(f'{label}: server.eku must be one of {EKUS}')
    for who, d in (('server', s), ('inter', i)):
        if d['sigAlg'] not in SIGS:
            errs.append(f'{label}: {who}.sigAlg must be one of {SIGS}')
        if not _date_ok(d['notBefore']) or not _date_ok(d['notAfter']):
            errs.append(f'{label}: {who} dates must be real YYYY-MM-DD dates')
        elif d['notBefore'] > d['notAfter']:
            errs.append(f'{label}: {who} ends before it starts')
    if c['kind'] not in ('browser', 'api'):
        errs.append(f'{label}: client.kind must be browser or api')
    if not _date_ok(c['date']):
        errs.append(f'{label}: client.date must be a real YYYY-MM-DD date')
    if not isinstance(c['trusted'], list) or any(x not in ROOT_IDS + ('self',) for x in c['trusted']):
        errs.append(f'{label}: client.trusted must be a list of root ids (or self)')
    if not isinstance(c['hostname'], str) or not c['hostname'].strip():
        errs.append(f'{label}: client.hostname is empty')
    for who, d, keys in (('server', s, ('sendsIntermediate', 'revoked')), ('inter', i, ('revoked',)), ('client', c, ('checkRevocation',))):
        for k in keys:
            if not isinstance(d[k], bool):
                errs.append(f'{label}: {who}.{k} must be true or false')
    return errs


def _expect_errors(label, key, entries):
    errs = []
    for ex in entries:
        if ex.get('verdict') not in ('success', 'failed'):
            errs.append(f'{label}: {key} verdict must be success or failed')
        if ex.get('code') and ex['code'] not in CODES:
            errs.append(f"{label}: unknown diagnosis code '{ex['code']}'")
        if ex.get('kind') and ex['kind'] not in ('browser', 'api'):
            errs.append(f'{label}: {key} kind must be browser or api')
        if ex.get('date') and not _date_ok(ex['date']):
            errs.append(f'{label}: {key} date must be a real YYYY-MM-DD date')
        if 'host' in ex and not (isinstance(ex['host'], str) and ex['host'].strip()):
            errs.append(f'{label}: {key} host is empty')
        if 'revocation' in ex and not isinstance(ex['revocation'], bool):
            errs.append(f'{label}: {key} revocation must be true or false')
    return errs


def validate():
    errs = []
    errs.extend(_topo_errors('sandbox', SANDBOX))
    if len(SCENARIOS) < 6 or len(SCENARIOS) > 8:
        errs.append(f'expected 6 to 8 scenarios, found {len(SCENARIOS)}')
    levels = [s['level'] for s in SCENARIOS]
    if levels.count('starter') < 2 or levels.count('core') < 3 or not (1 <= levels.count('stretch') <= 3):
        errs.append('level mix should be 2+ starter, 3+ core and 1-3 stretch')
    used = set()
    for sc in SCENARIOS:
        label = f"scenario '{sc['id']}'"
        errs.extend(_topo_errors(label, sc['topology']))
        for key in ('expect', 'expectFixed'):
            errs.extend(_expect_errors(label, key, sc[key]))
            for ex in sc[key]:
                if ex.get('code'):
                    used.add(ex['code'])
        if not any(ex.get('verdict') == 'failed' for ex in sc['expect']):
            errs.append(f'{label}: expect needs at least one failing outcome')
        if any(ex.get('verdict') != 'success' for ex in sc['expectFixed']):
            errs.append(f'{label}: expectFixed must all be success')
        if not (1 <= len(sc['hints']) <= 3):
            errs.append(f'{label}: needs 1 to 3 hints')
        for f in sc['fix']:
            if not f.get('path') or not any(k in f for k in ('value', 'add', 'remove')):
                errs.append(f'{label}: a fix entry needs a path and a value, add or remove')
        if sc.get('ask'):
            errs.extend(_expect_errors(label, 'ask', [{'verdict': 'success', **sc['ask']}]))
    # every diagnosis the engine can name for a normal setup should have a scenario except the two taught in the sandbox
    for code in ('name-mismatch', 'expired', 'not-yet-valid', 'missing-intermediate', 'untrusted-root', 'revoked', 'wrong-eku'):
        if code not in used:
            errs.append(f"no scenario teaches '{code}'")
    return errs
