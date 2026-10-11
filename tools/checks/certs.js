/* Engine tests and scenario replay for the certificate checker (src/js/03c_pg_certs.js). */
module.exports = ({ E, eq, data }) => {
  const base = () => E.pgClone(data.certsSandbox);
  const edit = (fn) => { const t = base(); fn(t.server, t.inter, t.root, t.client, t); return t; };
  const run = (t, ask) => E.pgCertsTest(t, ask);
  const code = (t, ask) => { const r = run(t, ask); return r.diagnosis ? r.diagnosis.code : r.verdict; };
  const states = (t, ask) => run(t, ask).stages.map((s) => s.state);
  const withHost = (h, fn) => edit((s, i, r, c, t) => { c.hostname = h; if (fn) fn(s, i, r, c, t); });

  /* ---- dates ---- */
  eq(E.pgCertsDay('1970-01-01'), 0, 'epoch day');
  eq(E.pgCertsDay('2026-10-11') - E.pgCertsDay('2026-10-10'), 1, 'consecutive days');
  eq(E.pgCertsDay('2024-02-29') !== null, true, 'leap day is real');
  eq(E.pgCertsDay('2026-02-29'), null, 'no leap day in 2026');
  eq(E.pgCertsDay('2026-13-01'), null, 'month 13');
  eq(E.pgCertsDay('2026-04-31'), null, 'april has 30 days');
  eq(E.pgCertsDay('26-10-11'), null, 'two digit year');
  eq(E.pgCertsDay('2026-1-5'), null, 'unpadded date');
  eq(E.pgCertsDay(''), null, 'empty date');
  eq(E.pgCertsDay('1969-12-31'), null, 'before 1970');
  eq(E.pgCertsDay('2100-01-01'), null, 'after 2099');
  eq(E.pgCertsDayText(E.pgCertsDay('2026-10-11')), '2026-10-11', 'date round trip');
  eq(E.pgCertsAddDays('2026-10-31', 1), '2026-11-01', 'add a day across a month');
  eq(E.pgCertsAddDays('2026-01-01', -1), '2025-12-31', 'subtract a day across a year');
  eq(E.pgCertsAddDays('2026-10-11', 365), '2027-10-11', 'add a year of days');
  eq(E.pgCertsAddDays('junk', 5), 'junk', 'bad date is left alone');
  eq(E.pgCertsPeriod(10, 20, 9), -1, 'before the period');
  eq(E.pgCertsPeriod(10, 20, 10), 0, 'first day counts');
  eq(E.pgCertsPeriod(10, 20, 20), 0, 'last day counts');
  eq(E.pgCertsPeriod(10, 20, 21), 1, 'after the period');
  eq(E.pgCertsDay('2026-12-11') - E.pgCertsDay('2026-09-12'), 90, 'sandbox certificate is 90 days long');

  eq(E.pgCertsAddMonths('2026-01-31', 1), '2026-02-28', 'month end is clamped');
  eq(E.pgCertsAddMonths('2026-10-11', 3), '2027-01-11', 'add months across a year');
  eq(E.pgCertsAddMonths('2026-01-15', -2), '2025-11-15', 'subtract months across a year');
  eq(E.pgCertsAddMonths('2024-02-29', 12), '2025-02-28', 'leap day plus a year');
  eq(E.pgCertsAddMonths('2026-10-11', 12), '2027-10-11', 'add a year');
  eq(E.pgCertsAddMonths('nope', 1), 'nope', 'bad date is left alone by add months');

  /* ---- host names and SAN lists ---- */
  eq(E.pgCertsHostParse('WWW.Example.com.'), { kind: 'dns', value: 'www.example.com' }, 'host is lowercased and the trailing dot dropped');
  eq(E.pgCertsHostParse('203.0.113.5'), { kind: 'ip', value: '203.0.113.5' }, 'ip literal');
  eq(E.pgCertsHostParse('300.1.1.1'), null, 'bad ip literal');
  eq(E.pgCertsHostParse('1.2.3'), null, 'short numeric name is not a host');
  eq(E.pgCertsHostParse('bad_name.example.com'), null, 'underscore rejected');
  eq(E.pgCertsHostParse('-a.example.com'), null, 'leading hyphen rejected');
  eq(E.pgCertsHostParse('a..example.com'), null, 'empty label rejected');
  eq(E.pgCertsHostParse(''), null, 'empty host');
  eq(E.pgCertsHostParse('intranet'), { kind: 'dns', value: 'intranet' }, 'single label host');
  const sl = E.pgCertsSanList('Example.com, *.example.com;DNS:api.example.com IP:203.0.113.5');
  eq(sl.entries.map((e) => `${e.kind}:${e.value}`), ['dns:example.com', 'dns:*.example.com', 'dns:api.example.com', 'ip:203.0.113.5'], 'san list parsing');
  eq(sl.errors, [], 'san list has no errors');
  eq(E.pgCertsSanList('good.example.com, bad name!, IP:300.1.1.1, .x.com').errors, ['name!', 'IP:300.1.1.1', '.x.com'], 'san errors are collected');
  eq(E.pgCertsSanList('').entries, [], 'empty san list');

  /* ---- wildcard rules (RFC 9525 section 6.3) ---- */
  const pm = E.pgCertsPatternMatch;
  eq(pm('*.example.com', 'www.example.com'), true, 'wildcard matches one label');
  eq(pm('*.example.com', 'example.com'), false, 'wildcard does not match the bare domain');
  eq(pm('*.example.com', 'a.b.example.com'), false, 'wildcard does not span two labels');
  eq(pm('*.example.com', '.example.com'), false, 'wildcard does not match an empty label');
  eq(pm('*.example.com', 'www.example.org'), false, 'wildcard still needs the right domain');
  eq(pm('*.example.com', 'www.eexample.com'), false, 'wildcard does not match a lookalike domain');
  eq(pm('w*.example.com', 'www.example.com'), false, 'partial wildcard is invalid');
  eq(pm('*w.example.com', 'www.example.com'), false, 'partial wildcard at the end of the label is invalid');
  eq(pm('www.*.example.com', 'www.a.example.com'), false, 'wildcard not in the left-most label is invalid');
  eq(pm('*.*.example.com', 'a.b.example.com'), false, 'two wildcards are invalid');
  eq(pm('*', 'localhost'), false, 'a lone * is invalid');
  eq(pm('www.example.com', 'www.example.com'), true, 'exact name');
  eq(pm('www.example.com', 'ww.example.com'), false, 'different name');
  eq(E.pgCertsWildcardOk('*.example.com'), true, 'wildcard ok');
  eq(E.pgCertsWildcardOk('f*.example.com'), false, 'wildcard not ok');

  const nc = (cn, sans, h) => E.pgCertsNameCheck({ cn, sans }, h);
  eq(nc('x', 'www.example.com', 'WWW.EXAMPLE.COM').ok, true, 'name check is case-insensitive');
  eq(nc('x', '*.example.com', 'shop.example.com').via, 'wildcard', 'name check reports a wildcard match');
  eq(nc('x', 'DNS:www.example.com', 'www.example.com').ok, true, 'DNS: prefix accepted');
  eq(nc('www.example.com', '', 'www.example.com').ok, false, 'CN alone never matches');
  eq(nc('www.example.com', '', 'www.example.com').cnMatches, true, 'CN match is reported but does not count');
  eq(nc('www.example.com', '', 'www.example.com').hint, 'nosan', 'no SAN hint');
  eq(nc('x', '*.example.com', 'example.com').hint, 'apex:*.example.com', 'apex hint');
  eq(nc('x', '*.example.com', 'a.b.example.com').hint, 'deep:*.example.com', 'two-label hint');
  eq(nc('x', 'w*.example.com', 'www.example.com').hint, 'badwild:w*.example.com', 'invalid wildcard hint');
  eq(nc('x', 'www.example.com', '203.0.113.5').hint, 'ip', 'ip hint');
  eq(nc('x', 'www.example.com', '203.0.113.5').ok, false, 'a DNS entry never matches an IP address');
  eq(nc('x', 'IP:203.0.113.5', '203.0.113.5').ok, true, 'an IP entry matches the address');
  eq(nc('x', 'IP:203.0.113.5', '203.0.113.6').ok, false, 'an IP entry matches only that address');
  eq(nc('x', 'IP:203.0.113.5', 'www.example.com').ok, false, 'an IP entry never matches a name');
  eq(nc('x', 'www.example.com.', 'www.example.com').ok, false, 'a SAN entry with a trailing dot is an error, not a name');

  /* ---- the sandbox works ---- */
  const sb = base();
  eq(E.pgCertsValidate(sb), [], 'sandbox has no config errors');
  eq(run(sb).verdict, 'success', 'sandbox: browser');
  eq(run(sb, { kind: 'api' }).verdict, 'success', 'sandbox: api client');
  eq(run(sb, { host: 'example.com' }).verdict, 'success', 'sandbox: bare domain is in the SAN');
  eq(run(sb, { host: 'shop.example.com' }).verdict, 'success', 'sandbox: wildcard covers shop');
  eq(states(sb), ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'], 'all seven stages ok');
  eq(run(sb).notes, [], 'no notes for a clean setup');
  eq(run(sb).marks, { host: 'ok', leaf: 'ok', inter: 'ok', root: 'ok', l1: 'ok', l2: 'ok', trust: 'ok' }, 'all marks ok');
  eq(E.pgCertsClients(sb).map((c) => c.result.verdict), ['success', 'success'], 'both client kinds work in the sandbox');

  /* ---- 1. name check ---- */
  eq(code(withHost('www.example.org')), 'name-mismatch', 'other domain');
  eq(run(withHost('www.example.org')).diagnosis.deviceId, 'server', 'name mismatch points at the server certificate');
  eq(run(withHost('www.example.org')).diagnosis.field, 'sans', 'name mismatch points at the SAN field');
  eq(code(withHost('a.b.example.com')), 'name-mismatch', 'two labels under the wildcard');
  eq(/more than one label/.test(run(withHost('a.b.example.com')).diagnosis.text), true, 'two-label message');
  eq(code(withHost('www.example.com', (s) => { s.sans = 'example.com'; })), 'name-mismatch', 'www is not example.com');
  eq(code(withHost('example.com', (s) => { s.sans = '*.example.com'; })), 'name-mismatch', 'wildcard does not cover the apex');
  eq(/exactly one label/.test(run(withHost('example.com', (s) => { s.sans = '*.example.com'; })).diagnosis.text), true, 'apex message explains the wildcard');
  eq(code(withHost('www.example.com', (s) => { s.cn = 'www.example.com'; s.sans = ''; })), 'name-mismatch', 'CN only is not enough');
  eq(/does match, but it does not count/.test(run(withHost('www.example.com', (s) => { s.cn = 'www.example.com'; s.sans = ''; })).diagnosis.text), true, 'CN-only message says the CN does not count');
  eq(code(withHost('www.example.com', (s) => { s.cn = 'other.example.com'; })), 'success', 'a wrong CN does not matter when the SAN is right');
  eq(code(withHost('203.0.113.5')), 'name-mismatch', 'IP address against DNS names');
  eq(code(withHost('203.0.113.5', (s) => { s.sans += ', IP:203.0.113.5'; })), 'success', 'IP address entry in the SAN');
  eq(code(withHost('www.example.com', (s) => { s.sans = 'w*.example.com'; })), 'name-mismatch', 'partial wildcard matches nothing');
  eq(code(withHost('WWW.EXAMPLE.COM.')), 'success', 'host case and trailing dot are ignored');
  eq(states(withHost('www.example.org')), ['fail', 'skip', 'skip', 'skip', 'skip', 'skip', 'skip'], 'stages after a name failure');
  eq(run(withHost('www.example.org')).marks.host, 'fail', 'host mark fails');
  eq(code(withHost('www.example.org', (s) => { s.notBefore = '2025-01-01'; s.notAfter = '2026-01-01'; })), 'name-mismatch', 'name is checked before the dates');

  /* ---- 2. validity dates ---- */
  eq(code(edit((s) => { s.notAfter = '2026-10-10'; })), 'expired', 'expired yesterday');
  eq(code(edit((s) => { s.notAfter = '2026-10-11'; })), 'success', 'last day still counts');
  eq(code(edit((s) => { s.notBefore = '2026-10-12'; s.notAfter = '2027-01-10'; })), 'not-yet-valid', 'starts tomorrow');
  eq(code(edit((s) => { s.notBefore = '2026-10-11'; })), 'success', 'first day counts');
  eq(code(edit((s, i, r, c) => { c.date = '2019-01-01'; })), 'not-yet-valid', 'client clock far in the past');
  eq(run(edit((s, i, r, c) => { c.date = '2019-01-01'; })).diagnosis.deviceId, 'client', 'not-yet-valid points at the client clock');
  eq(code(edit((s, i, r, c) => { c.date = '2031-01-01'; })), 'expired', 'client clock far in the future');
  eq(run(edit((s) => { s.notAfter = '2026-10-10'; })).diagnosis.deviceId, 'server', 'expired points at the server certificate');
  eq(run(edit((s) => { s.notAfter = '2026-10-10'; })).diagnosis.field, 'notAfter', 'expired points at not-after');
  eq(/1 day later/.test(run(edit((s) => { s.notAfter = '2026-10-10'; })).diagnosis.text), true, 'expired message counts the days');
  eq(states(edit((s) => { s.notAfter = '2026-10-10'; })), ['ok', 'fail', 'skip', 'skip', 'skip', 'skip', 'skip'], 'stages after an expiry');
  eq(run(edit((s) => { s.notAfter = '2026-10-10'; })).marks.leaf, 'fail', 'expired leaf is marked');
  // the intermediate
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; })), 'expired', 'expired intermediate');
  eq(run(edit((s, i) => { i.notAfter = '2026-10-01'; })).diagnosis.deviceId, 'inter', 'expired intermediate points at the intermediate');
  eq(run(edit((s, i) => { i.notAfter = '2026-10-01'; })).marks.inter, 'fail', 'expired intermediate is marked');
  eq(/intermediate/.test(run(edit((s, i) => { i.notAfter = '2026-10-01'; })).diagnosis.title), true, 'expired intermediate is named in the title');
  eq(code(edit((s, i) => { i.notBefore = '2027-01-01'; i.notAfter = '2030-01-01'; })), 'not-yet-valid', 'intermediate not valid yet');
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; s.notAfter = '2026-10-01'; })), 'expired', 'leaf and intermediate both expired: leaf is named first');
  eq(run(edit((s, i) => { i.notAfter = '2026-10-01'; s.notAfter = '2026-10-01'; })).diagnosis.deviceId, 'server', 'leaf named first');
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; s.sendsIntermediate = false; }), { kind: 'api' }), 'missing-intermediate', 'an intermediate the client never sees cannot be judged by date');
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; s.sendsIntermediate = false; }), { kind: 'browser' }), 'expired', 'a browser that finds the intermediate sees that it expired');
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; s.issuedBy = 'root'; })), 'success', 'the intermediate is ignored when the root issued the certificate directly');
  eq(code(edit((s, i) => { i.notAfter = '2026-10-01'; s.issuedBy = 'self'; })), 'untrusted-root', 'the intermediate is ignored for a self-signed certificate');
  eq(code(edit((s, i, r, c) => { c.date = '2026-10-10'; s.notBefore = '2026-10-10'; })), 'success', 'client date handled as a plain calendar date');

  /* ---- 3. chain building: the intermediate ---- */
  const noInter = (fn) => edit((s, i, r, c, t) => { s.sendsIntermediate = false; if (fn) fn(s, i, r, c, t); });
  eq(code(noInter(), { kind: 'api' }), 'missing-intermediate', 'api client without the intermediate');
  eq(run(noInter(), { kind: 'api' }).diagnosis.deviceId, 'server', 'missing intermediate points at the server');
  eq(run(noInter(), { kind: 'api' }).diagnosis.field, 'sendsIntermediate', 'missing intermediate points at the chain setting');
  eq(run(noInter(), { kind: 'api' }).marks.inter, 'missing', 'the intermediate is marked as missing');
  eq(run(noInter(), { kind: 'api' }).marks.l1, 'fail', 'the link from the leaf is marked');
  eq(states(noInter(), { kind: 'api' }), ['ok', 'ok', 'fail', 'skip', 'skip', 'skip', 'skip'], 'stages after a missing intermediate');
  eq(/unable to get local issuer certificate/.test(run(noInter(), { kind: 'api' }).diagnosis.text), true, 'message names the familiar error');
  eq(code(noInter(), { kind: 'browser' }), 'success', 'a browser repairs the chain');
  eq(run(noInter(), { kind: 'browser' }).notes.length, 1, 'the browser success carries a warning note');
  eq(/Authority Information Access/.test(run(noInter(), { kind: 'browser' }).steps.map((s) => s.text).join(' ')), true, 'the trace mentions AIA');
  eq(/curl/.test(run(noInter(), { kind: 'browser' }).notes[0]), true, 'the note names the clients that fail');
  eq(E.pgCertsClients(noInter()).map((c) => c.result.verdict), ['success', 'failed'], 'browser works, api fails');
  eq(code(noInter(), { kind: 'api', host: 'www.example.org' }), 'name-mismatch', 'name is checked before the chain');
  eq(code(noInter((s, i, r) => { r.id = 'corp'; }), { kind: 'api' }), 'missing-intermediate', 'the chain is built before the root is judged');
  eq(code(edit((s) => { s.issuedBy = 'root'; s.sendsIntermediate = false; }), { kind: 'api' }), 'success', 'no intermediate is needed when the root issued it directly');
  eq(run(edit((s) => { s.issuedBy = 'root'; })).marks.inter, 'na', 'no intermediate in the diagram');

  /* ---- 4. trusted root ---- */
  const priv = (fn) => edit((s, i, r, c, t) => { r.id = 'corp'; if (fn) fn(s, i, r, c, t); });
  eq(code(priv()), 'untrusted-root', 'private root not in the store');
  eq(run(priv()).diagnosis.deviceId, 'client', 'untrusted root points at the client');
  eq(run(priv()).diagnosis.field, 'trusted', 'untrusted root points at the trust store');
  eq(/private CA/.test(run(priv()).diagnosis.text), true, 'private CA is explained');
  eq(states(priv()), ['ok', 'ok', 'ok', 'fail', 'skip', 'skip', 'skip'], 'stages after an untrusted root');
  eq(run(priv()).marks.trust, 'fail', 'trust link is marked');
  eq(run(priv()).marks.root, 'fail', 'root is marked');
  eq(code(priv((s, i, r, c) => { c.trusted.push('corp'); })), 'success', 'private root once trusted');
  eq(code(priv((s, i, r, c) => { c.trusted = ['corp']; })), 'success', 'a store with only the private root works for that chain');
  eq(code(edit((s, i, r, c) => { c.trusted = ['other', 'corp']; })), 'untrusted-root', 'the right root must be in the store');
  eq(/not in this client's trust store/.test(run(edit((s, i, r, c) => { c.trusted = []; })).diagnosis.text), true, 'public root missing from the store');
  eq(code(edit((s, i, r, c) => { c.trusted = []; })), 'untrusted-root', 'an empty trust store trusts nothing');
  eq(/Sending the root/.test(run(priv()).diagnosis.text), true, 'sending the root does not help');
  const selfsig = (fn) => edit((s, i, r, c, t) => { s.issuedBy = 'self'; if (fn) fn(s, i, r, c, t); });
  eq(code(selfsig()), 'untrusted-root', 'self-signed certificate is not trusted');
  eq(/self-signed/.test(run(selfsig()).diagnosis.title), true, 'self-signed is named');
  eq(code(selfsig((s, i, r, c) => { c.trusted.push('self'); })), 'success', 'self-signed certificate imported into the trust store');
  eq(run(selfsig((s, i, r, c) => { c.trusted.push('self'); })).marks.l1, 'na', 'no links in a self-signed chain');
  eq(code(selfsig((s, i, r, c) => { c.trusted.push('self'); s.sigAlg = 'sha1rsa'; })), 'success', 'the self-signature of a trust anchor is not judged');
  eq(code(selfsig((s, i, r, c) => { c.trusted.push('self'); s.revoked = true; })), 'success', 'a self-signed certificate has no CA to revoke it');
  eq(code(selfsig((s, i, r, c) => { c.trusted.push('self'); s.sendsIntermediate = false; }), { kind: 'api' }), 'success', 'a self-signed certificate needs no intermediate');
  eq(code(selfsig((s, i, r, c) => { c.trusted = ['pub', 'other']; r.id = 'pub'; })), 'untrusted-root', 'trusting the public roots does not help a self-signed certificate');

  /* ---- 5. key usage ---- */
  ['client', 'code', 'email'].forEach((e) => eq(code(edit((s) => { s.eku = e; })), 'wrong-eku', `eku ${e} is refused for a web server`));
  ['server', 'server+client', 'none'].forEach((e) => eq(code(edit((s) => { s.eku = e; })), 'success', `eku ${e} is accepted for a web server`));
  eq(run(edit((s) => { s.eku = 'client'; })).diagnosis.deviceId, 'server', 'wrong eku points at the server certificate');
  eq(run(edit((s) => { s.eku = 'client'; })).diagnosis.field, 'eku', 'wrong eku points at the eku field');
  eq(states(edit((s) => { s.eku = 'code'; })), ['ok', 'ok', 'ok', 'ok', 'fail', 'skip', 'skip'], 'stages after a wrong eku');
  eq(/codeSigning/.test(run(edit((s) => { s.eku = 'code'; })).diagnosis.text), true, 'message names the listed purpose');
  eq(/no restriction/.test(run(edit((s) => { s.eku = 'none'; })).steps.map((x) => x.text).join(' ')), true, 'missing eku is explained');
  eq(code(priv((s) => { s.eku = 'client'; })), 'untrusted-root', 'trust is judged before key usage');

  /* ---- 6. revocation ---- */
  eq(code(edit((s) => { s.revoked = true; })), 'revoked', 'revoked server certificate');
  eq(run(edit((s) => { s.revoked = true; })).diagnosis.deviceId, 'server', 'revoked points at the server certificate');
  eq(run(edit((s) => { s.revoked = true; })).diagnosis.field, 'revoked', 'revoked points at the flag');
  eq(states(edit((s) => { s.revoked = true; })), ['ok', 'ok', 'ok', 'ok', 'ok', 'fail', 'skip'], 'stages after a revocation');
  eq(code(edit((s, i) => { i.revoked = true; })), 'revoked', 'revoked intermediate');
  eq(run(edit((s, i) => { i.revoked = true; })).diagnosis.deviceId, 'inter', 'revoked intermediate points at the intermediate');
  eq(run(edit((s, i) => { i.revoked = true; })).marks.inter, 'fail', 'revoked intermediate is marked');
    const noRev = (fn) => edit((s, i, r, c, t) => { c.checkRevocation = false; if (fn) fn(s, i, r, c, t); });
  eq(code(noRev((s) => { s.revoked = true; })), 'success', 'a client that does not check accepts a revoked certificate');
  eq(run(noRev((s) => { s.revoked = true; })).notes.length, 1, 'the unchecked revocation is flagged');
  eq(/does not check revocation/.test(run(noRev((s) => { s.revoked = true; })).notes[0]), true, 'the note says why');
  eq(run(noRev()).notes, [], 'no note when nothing is revoked');
  eq(run(noRev()).stages[5].text, 'this client does not check revocation', 'stage says the client does not check');
  eq(code(edit((s, i) => { s.revoked = true; i.revoked = true; })), 'revoked', 'both revoked');
  eq(run(edit((s, i) => { s.revoked = true; i.revoked = true; })).diagnosis.deviceId, 'server', 'leaf revocation is named first');
  eq(code(edit((s, i) => { i.revoked = true; s.issuedBy = 'root'; })), 'success', 'an intermediate that is not in the chain cannot be revoked');
  eq(code(edit((s, i) => { s.revoked = true; s.sigAlg = 'sha1rsa'; })), 'revoked', 'revocation is checked before the signature algorithm');
  eq(code(edit((s, i) => { s.revoked = true; i.revoked = false; }), { kind: 'browser' }), 'revoked', 'revoked, browser');

  /* ---- 7. signature algorithm ---- */
  eq(code(edit((s) => { s.sigAlg = 'sha1rsa'; })), 'weak-signature', 'SHA-1 on the server certificate');
  eq(run(edit((s) => { s.sigAlg = 'sha1rsa'; })).diagnosis.deviceId, 'server', 'weak signature points at the server certificate');
  eq(run(edit((s) => { s.sigAlg = 'sha1rsa'; })).diagnosis.field, 'sigAlg', 'weak signature points at the algorithm field');
  eq(code(edit((s, i) => { i.sigAlg = 'sha1rsa'; })), 'weak-signature', 'SHA-1 on the intermediate');
  eq(run(edit((s, i) => { i.sigAlg = 'sha1rsa'; })).diagnosis.deviceId, 'inter', 'weak signature on the intermediate points at it');
  eq(code(edit((s) => { s.sigAlg = 'sha384ecdsa'; })), 'success', 'ECDSA with SHA-384 is fine');
  eq(code(edit((s, i) => { i.sigAlg = 'sha1rsa'; s.issuedBy = 'root'; })), 'success', 'a SHA-1 intermediate that is not in the chain does not matter');
  eq(states(edit((s) => { s.sigAlg = 'sha1rsa'; })), ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'fail'], 'the signature is the last check');
  eq(code(edit((s) => { s.sigAlg = 'sha1rsa'; s.eku = 'code'; })), 'wrong-eku', 'key usage is judged before the signature');
  eq(code(edit((s, i) => { s.sigAlg = 'sha1rsa'; i.sigAlg = 'sha1rsa'; })), 'weak-signature', 'both weak');
  eq(run(edit((s, i) => { s.sigAlg = 'sha1rsa'; i.sigAlg = 'sha1rsa'; })).diagnosis.deviceId, 'server', 'the server certificate is named first');
  eq(code(edit((s, i) => { i.sigAlg = 'sha1rsa'; s.sendsIntermediate = false; }), { kind: 'browser' }), 'weak-signature', 'a SHA-1 intermediate the browser found');

  /* ---- ordering: the first failure is named ---- */
  eq(code(edit((s, i, r, c) => { r.id = 'corp'; s.notAfter = '2026-10-10'; })), 'expired', 'dates come before the root');
  eq(code(edit((s, i, r, c) => { c.hostname = 'x.example.org'; s.notAfter = '2026-10-10'; s.revoked = true; })), 'name-mismatch', 'name first');
  eq(code(edit((s) => { s.revoked = true; s.eku = 'code'; })), 'wrong-eku', 'key usage before revocation');
  eq(code(edit((s) => { s.sendsIntermediate = false; s.revoked = true; }), { kind: 'api' }), 'missing-intermediate', 'chain before revocation');

  /* ---- validation ---- */
  eq(code(edit((s, i, r, c) => { c.hostname = ''; })), 'bad-config', 'empty host name');
  eq(code(edit((s, i, r, c) => { c.hostname = 'bad name'; })), 'bad-config', 'host name with a space');
  eq(run(edit((s, i, r, c) => { c.date = '11/10/2026'; })).diagnosis.field, 'date', 'bad client date');
  eq(code(edit((s) => { s.notAfter = '2026-02-30'; })), 'bad-config', 'impossible certificate date');
  eq(code(edit((s) => { s.notBefore = '2027-01-01'; })), 'bad-config', 'certificate that ends before it starts');
  eq(code(edit((s) => { s.sans = 'good.example.com, bad name!'; })), 'bad-config', 'unusable SAN entry');
  eq(E.pgCertsValidate(edit((s) => { s.sans = 'a b!'; })).map((e) => `${e.obj}.${e.field}`), ['server.sans'], 'SAN error field path');
  eq(code(edit((s, i) => { i.notAfter = 'x'; })), 'bad-config', 'bad intermediate date');
  eq(code(edit((s, i) => { i.notAfter = 'x'; s.issuedBy = 'root'; })), 'success', 'intermediate dates are not checked when unused');
  eq(code(edit((s, i, r) => { r.id = 'nope'; })), 'bad-config', 'unknown root');
  eq(code(edit((s, i, r) => { r.id = 'nope'; s.issuedBy = 'self'; })), 'untrusted-root', 'root is not needed for a self-signed certificate');
  eq(code(edit((s) => { s.eku = 'whatever'; })), 'bad-config', 'unknown eku');
  eq(code(edit((s) => { s.sigAlg = 'md2'; })), 'bad-config', 'unknown signature algorithm');
  eq(run(edit((s, i, r, c) => { c.hostname = ''; })).stages.every((s) => s.state === 'skip'), true, 'a bad setting runs no check');

  /* ---- overrides and the two clients ---- */
  eq(run(sb, { date: '2019-01-01' }).diagnosis.code, 'not-yet-valid', 'date override');
  eq(sb.client.date, '2026-10-11', 'overrides do not change the topology');
  eq(code(edit((s, i, r, c) => { r.id = 'corp'; c.checkRevocation = false; s.revoked = true; }), { revocation: true }), 'untrusted-root', 'revocation override applies (root is checked first)');
  eq(code(edit((s) => { s.revoked = true; }), { revocation: false }), 'success', 'revocation override off: a revoked certificate is accepted');
  eq(code(edit((s, i, r, c) => { c.checkRevocation = false; s.revoked = true; }), { revocation: true }), 'revoked', 'revocation override on: the client checks');
  eq(run(sb, { host: 'www.example.org' }).used.host, 'www.example.org', 'result records what was used');
  eq(E.pgCertsClients(sb, { host: 'www.example.org' }).map((c) => c.kind), ['browser', 'api'], 'both kinds are tested');

  /* ---- fixes ---- */
  const f = E.pgCertsApplyFixes(base(), [{ path: 'server.sans', value: 'a.example.com' }, { path: 'client.trusted', add: 'corp' }, { path: 'client.trusted', add: 'corp' }, { path: 'client.trusted', remove: 'other' }]);
  eq([f.server.sans, f.client.trusted, base().server.sans, base().client.trusted], ['a.example.com', ['pub', 'corp'], 'example.com, *.example.com', ['pub', 'other']], 'apply fixes (adds once, removes, and the original is untouched)');

  /* ---- the wrong "fixes" do not count ---- */
  const sc = (id) => (data.certs || []).find((x) => x.id === id);
  if (sc('certs-expired')) eq(E.pgCertsSolved(sc('certs-expired'), E.pgCertsApplyFixes(sc('certs-expired').topology, [{ path: 'client.date', value: '2026-09-20' }])), false, 'turning the clock back does not fix an expired certificate');
  if (sc('certs-revoked')) eq(E.pgCertsSolved(sc('certs-revoked'), E.pgCertsApplyFixes(sc('certs-revoked').topology, [{ path: 'client.checkRevocation', value: false }])), false, 'switching revocation checking off does not fix a revoked certificate');
  if (sc('certs-clock')) eq(E.pgCertsSolved(sc('certs-clock'), E.pgCertsApplyFixes(sc('certs-clock').topology, [{ path: 'server.notBefore', value: '2018-01-01' }])), false, 'rewriting the certificate dates does not fix a wrong client clock');
  if (sc('certs-cn-only')) eq(E.pgCertsSolved(sc('certs-cn-only'), E.pgCertsApplyFixes(sc('certs-cn-only').topology, [{ path: 'client.hostname', value: 'www.example.com' }])), false, 'typing another name does not fix the intranet certificate');
  if (sc('certs-missing-intermediate')) eq(E.pgCertsSolved(sc('certs-missing-intermediate'), E.pgCertsApplyFixes(sc('certs-missing-intermediate').topology, [{ path: 'client.kind', value: 'browser' }])), false, 'switching to a browser does not fix the chain');

  /* ---- every scenario: broken outcome, fixed outcome ---- */
  (data.certs || []).forEach((sc) => {
    eq(E.pgCertsValidate(sc.topology), [], `certs scenario ${sc.id} has a readable topology`);
    sc.expect.forEach((ex, n) => {
      const r = E.pgCertsTest(sc.topology, ex);
      eq(r.verdict, ex.verdict, `certs scenario ${sc.id} check ${n + 1} verdict`);
      if (ex.code) eq(r.diagnosis && r.diagnosis.code, ex.code, `certs scenario ${sc.id} check ${n + 1} code`);
    });
    const t = E.pgCertsApplyFixes(sc.topology, sc.fix);
    sc.expectFixed.forEach((ex, n) => eq(E.pgCertsTest(t, ex).verdict, ex.verdict, `certs scenario ${sc.id} fixed check ${n + 1}`));
    eq(sc.expect.some((e) => e.verdict === 'failed'), true, `certs scenario ${sc.id} is genuinely broken`);
    eq(E.pgCertsTest(sc.topology, sc.ask || {}).verdict === 'failed', true, `certs scenario ${sc.id}: the default run fails`);
    // the unfixed setup must not already pass every goal
    eq(E.pgCertsSolved(sc, sc.topology), false, `certs scenario ${sc.id} is not solved before the fix`);
    eq(E.pgCertsSolved(sc, t), true, `certs scenario ${sc.id} is solved by its fix`);
    eq(sc.expectFixed.every((ex) => E.pgCertsTest(sc.topology, ex).verdict === 'success'), false, `certs scenario ${sc.id} goal is not met before the fix`);
  });
  eq((data.certs || []).length >= 6, true, 'certs has at least six scenarios');
  eq(new Set((data.certs || []).map((sc) => sc.expect.map((e) => e.code).filter(Boolean)[0])).size >= 7, true, 'scenarios teach seven different first failures');
  eq(Array.isArray(data.certsSandbox && data.certsSandbox.client.trusted), true, 'certs sandbox exists');
};
