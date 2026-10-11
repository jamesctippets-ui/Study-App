/* ---------------- IT Playground: certificate checker (pure engine) ---------------- */

// A client connects to a server by name and decides whether to trust the certificate it is shown.
// The engine replays the checks a TLS client makes, in a fixed teaching order, and names the FIRST
// one that fails:
//   1. name check      the host name the client typed against the certificate's subject alternative names
//   2. validity dates  the server certificate (and the intermediate, when the client has it) against the client's clock
//   3. chain building  can the client get from the server certificate up to a root? (is the intermediate there?)
//   4. trusted root    does the chain end at a root that is in this client's trust store?
//   5. key usage       is the certificate allowed to be used for a web server (extended key usage)?
//   6. revocation      has the CA revoked the certificate (CRL / OCSP)?
//   7. signature       is the CA's signature on the certificate made with a deprecated algorithm (SHA-1)?
// Simplified on purpose: there is no real cryptography (no keys, no signatures are verified), dates are plain
// calendar dates (inclusive at both ends, no time of day or time zone), a root's own expiry is not checked,
// only the extended key usage is modelled (not the key usage bits, path length or name constraints), a client
// either checks revocation or does not (no soft-fail, no stapling), and only DNS names and IPv4 addresses exist.
// Real clients also do not agree on the order of the checks; the lab fixes one order so a single cause can be named.
// Sources: RFC 5280 (certificate profile, validity, extended key usage, path validation), RFC 9525 (service
// identity in TLS, replaces RFC 6125), RFC 8446 section 4.4.2 (what a server sends), RFC 6960 (OCSP).
//
// topo = {
//   server: { cn, sans: 'www.example.com, example.com', notBefore: 'YYYY-MM-DD', notAfter, issuedBy: 'intermediate'|'root'|'self',
//             sendsIntermediate: true, eku: 'server'|'server+client'|'client'|'code'|'email'|'none', sigAlg, revoked },
//   inter:  { name, notBefore, notAfter, sigAlg, revoked },       // used when server.issuedBy === 'intermediate'
//   root:   { id: 'pub'|'corp'|'other' },                           // used when server.issuedBy !== 'self'
//   client: { kind: 'browser'|'api', hostname, date, trusted: ['pub', ...], checkRevocation }
// }
// A test can override the client: pgCertsTest(topo, { kind, date, host, revocation }).

const PG_CERTS_ROOTS = [
  { id: 'pub', name: 'Example Public Root CA', kind: 'public' },
  { id: 'corp', name: 'Corp Internal Root CA', kind: 'private' },
  { id: 'other', name: 'Other Public Root CA', kind: 'public' },
];
const PG_CERTS_EKU = [
  { value: 'server', label: 'serverAuth (TLS web server)' },
  { value: 'server+client', label: 'serverAuth + clientAuth' },
  { value: 'client', label: 'clientAuth only (TLS client)' },
  { value: 'code', label: 'codeSigning only' },
  { value: 'email', label: 'emailProtection only (S/MIME)' },
  { value: 'none', label: 'No EKU extension' },
];
const PG_CERTS_SIG = [
  { value: 'sha256rsa', label: 'SHA-256 with RSA', weak: false },
  { value: 'sha384ecdsa', label: 'SHA-384 with ECDSA', weak: false },
  { value: 'sha1rsa', label: 'SHA-1 with RSA (deprecated)', weak: true },
];
const PG_CERTS_KINDS = [{ value: 'browser', label: 'Web browser' }, { value: 'api', label: 'API client or script' }];
const PG_CERTS_ISSUED = [{ key: 'intermediate', label: 'Intermediate CA' }, { key: 'root', label: 'Root CA directly' }, { key: 'self', label: 'Self-signed' }];
const PG_CERTS_STAGES = [
  ['host', 'Name check'], ['dates', 'Validity dates'], ['chain', 'Chain building'], ['trust', 'Trusted root'],
  ['usage', 'Key usage'], ['revoke', 'Revocation'], ['sig', 'Signature algorithm'],
];

function pgCertsLabel(list, value) {
  const f = list.find((o) => String(o.value) === String(value));
  return f ? f.label : String(value);
}
function pgCertsRoot(id) { return PG_CERTS_ROOTS.find((r) => r.id === id) || null; }
function pgCertsSigWeak(v) { const f = PG_CERTS_SIG.find((o) => o.value === v); return !!f && f.weak; }
function pgCertsSigName(v) { return pgCertsLabel(PG_CERTS_SIG, v).replace(' (deprecated)', ''); }
// Extended key usage: which purposes does the extension list, and may such a certificate serve a web server?
function pgCertsEkuAllows(v) { return v === 'server' || v === 'server+client' || v === 'none'; }
function pgCertsEkuName(v) { return v === 'none' ? 'no extended key usage extension' : pgCertsLabel(PG_CERTS_EKU, v); }

/* ---- dates: plain calendar dates, YYYY-MM-DD ---- */

// -> whole days since 1970-01-01, or null when it is not a real calendar date between 1970 and 2099
function pgCertsDay(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text == null ? '' : text).trim());
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  if (y < 1970 || y > 2099 || mo < 1 || mo > 12 || d < 1) return null;
  const t = Date.UTC(y, mo - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return Math.round(t / 86400000);
}
function pgCertsDayText(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
function pgCertsAddDays(text, n) {
  const d = pgCertsDay(text);
  if (d === null) return String(text);
  const r = d + n;
  const out = pgCertsDayText(r);
  return pgCertsDay(out) === null ? String(text) : out;
}
// Move by whole months, keeping the day of the month where it exists (31 January + 1 month = last day of February).
function pgCertsAddMonths(text, n) {
  const d = pgCertsDay(text);
  if (d === null) return String(text);
  const dt = new Date(d * 86400000);
  const idx = dt.getUTCFullYear() * 12 + dt.getUTCMonth() + n;
  const y = Math.floor(idx / 12); const mo = idx - y * 12;
  const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const out = pgCertsDayText(Math.round(Date.UTC(y, mo, Math.min(dt.getUTCDate(), last)) / 86400000));
  return pgCertsDay(out) === null ? String(text) : out;
}
function pgCertsDaysWord(n) { const a = Math.abs(n); return `${a} day${a === 1 ? '' : 's'}`; }
// -1 before the period, 0 inside it (both ends inclusive, RFC 5280 section 4.1.2.5), 1 after it
function pgCertsPeriod(nb, na, day) { return day < nb ? -1 : day > na ? 1 : 0; }

/* ---- names ---- */

// What the client typed -> { kind: 'dns'|'ip', value } or null when it is not a host name or IPv4 address.
function pgCertsHostParse(text) {
  let s = String(text == null ? '' : text).trim().toLowerCase();
  if (s.slice(-1) === '.') s = s.slice(0, -1);
  if (!s) return null;
  if (/^[0-9.]+$/.test(s)) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return null;
    const ip = pgParseIPv4(s);
    return ip === null ? null : { kind: 'ip', value: pgIpToString(ip) };
  }
  if (s.length > 253) return null;
  const labels = s.split('.');
  if (!labels.every((l) => l.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(l))) return null;
  return { kind: 'dns', value: s };
}

// The SAN text -> { entries: [{ kind, value, raw }], errors: [raw] }. Entries may be written "DNS:name" or "IP:1.2.3.4".
function pgCertsSanList(text) {
  const entries = []; const errors = [];
  String(text == null ? '' : text).split(/[\s,;]+/).forEach((rawIn) => {
    const raw = rawIn.trim();
    if (!raw) return;
    const low = raw.toLowerCase();
    if (low.indexOf('ip:') === 0) {
      const ip = pgParseIPv4(low.slice(3));
      if (ip === null || !/^\d{1,3}(\.\d{1,3}){3}$/.test(low.slice(3))) errors.push(raw); else entries.push({ kind: 'ip', value: pgIpToString(ip), raw });
      return;
    }
    const name = low.indexOf('dns:') === 0 ? low.slice(4) : low;
    if (!name || !/^[a-z0-9*.-]+$/.test(name) || name.charAt(0) === '.' || name.slice(-1) === '.' || name.indexOf('..') >= 0) { errors.push(raw); return; }
    entries.push({ kind: 'dns', value: name, raw });
  });
  return { entries, errors };
}

// RFC 9525 section 6.3: a wildcard is allowed only as the whole left-most label, and there is only one.
function pgCertsWildcardOk(pattern) {
  const pl = String(pattern).split('.');
  return pl.length >= 2 && pl[0] === '*' && pl.slice(1).every((l) => l !== '' && l.indexOf('*') < 0);
}
// pattern and host are lower case without a trailing dot. A wildcard stands for exactly one label.
function pgCertsPatternMatch(pattern, host) {
  if (pattern.indexOf('*') < 0) return pattern === host;
  if (!pgCertsWildcardOk(pattern)) return false;
  const pl = pattern.split('.'); const hl = host.split('.');
  if (pl.length !== hl.length || !hl[0]) return false;
  for (let i = 1; i < pl.length; i += 1) if (pl[i] !== hl[i]) return false;
  return true;
}

// -> { ok, host, matched (the SAN entry text), via: 'exact'|'wildcard'|'ip', cnMatches, hint, entries, invalid }
function pgCertsNameCheck(server, hostText) {
  const host = pgCertsHostParse(hostText);
  const list = pgCertsSanList(server.sans);
  const out = { ok: false, host, matched: null, via: null, cnMatches: false, hint: '', entries: list.entries, invalid: [] };
  if (!host) return out;
  const cn = String(server.cn == null ? '' : server.cn).trim().toLowerCase();
  out.cnMatches = host.kind === 'dns' && !!cn && pgCertsPatternMatch(cn, host.value);
  list.entries.forEach((e) => { if (e.kind === 'dns' && e.value.indexOf('*') >= 0 && !pgCertsWildcardOk(e.value)) out.invalid.push(e.raw); });
  if (host.kind === 'ip') {
    const hit = list.entries.find((e) => e.kind === 'ip' && e.value === host.value);
    if (hit) { out.ok = true; out.matched = hit.raw; out.via = 'ip'; }
    else out.hint = 'ip';
    return out;
  }
  const hit = list.entries.find((e) => e.kind === 'dns' && pgCertsPatternMatch(e.value, host.value));
  if (hit) { out.ok = true; out.matched = hit.raw; out.via = hit.value.indexOf('*') >= 0 ? 'wildcard' : 'exact'; return out; }
  // near misses, so the message can say what is actually going on
  const hl = host.value.split('.');
  const wild = list.entries.filter((e) => e.kind === 'dns' && pgCertsWildcardOk(e.value));
  const apex = wild.find((e) => e.value.slice(2) === host.value);
  const deep = wild.find((e) => hl.length > e.value.split('.').length && host.value.slice(-(e.value.length - 1)) === e.value.slice(1));
  if (apex) out.hint = `apex:${apex.raw}`;
  else if (deep) out.hint = `deep:${deep.raw}`;
  else if (out.invalid.length) out.hint = `badwild:${out.invalid[0]}`;
  else if (!list.entries.some((e) => e.kind === 'dns')) out.hint = 'nosan';
  return out;
}

/* ---- configuration checks (shape and syntax, not behaviour) ---- */

// -> [{ obj, field, text }]; obj is 'server' | 'inter' | 'root' | 'client' and field is the key inside it
function pgCertsValidate(topo) {
  const errs = [];
  const add = (obj, field, text) => errs.push({ obj, field, text });
  const sv = topo.server || {}; const it = topo.inter || {}; const cl = topo.client || {};
  const dateErr = 'Write the date as YYYY-MM-DD, for example 2026-10-11.';
  if (!pgCertsHostParse(cl.hostname)) add('client', 'hostname', 'Type a host name such as www.example.com, or an IPv4 address.');
  if (pgCertsDay(cl.date) === null) add('client', 'date', dateErr);
  if (cl.kind !== 'browser' && cl.kind !== 'api') add('client', 'kind', 'Pick a client type.');
  if (!Array.isArray(cl.trusted)) add('client', 'trusted', 'The trust store must be a list.');
  const nb = pgCertsDay(sv.notBefore); const na = pgCertsDay(sv.notAfter);
  if (nb === null) add('server', 'notBefore', dateErr);
  if (na === null) add('server', 'notAfter', dateErr);
  if (nb !== null && na !== null && nb > na) add('server', 'notAfter', 'The certificate would end before it starts. Pick a not-after date on or after the not-before date.');
  const san = pgCertsSanList(sv.sans);
  if (san.errors.length) add('server', 'sans', `"${san.errors[0]}" is not a usable entry. Use names like www.example.com or *.example.com (comma separated), or IP:203.0.113.5 for an address.`);
  if (['intermediate', 'root', 'self'].indexOf(sv.issuedBy) < 0) add('server', 'issuedBy', 'Pick who issued the certificate.');
  if (!PG_CERTS_EKU.some((o) => o.value === sv.eku)) add('server', 'eku', 'Pick an extended key usage.');
  if (!PG_CERTS_SIG.some((o) => o.value === sv.sigAlg)) add('server', 'sigAlg', 'Pick a signature algorithm.');
  if (sv.issuedBy === 'intermediate') {
    const inb = pgCertsDay(it.notBefore); const ina = pgCertsDay(it.notAfter);
    if (inb === null) add('inter', 'notBefore', dateErr);
    if (ina === null) add('inter', 'notAfter', dateErr);
    if (inb !== null && ina !== null && inb > ina) add('inter', 'notAfter', 'The intermediate would end before it starts.');
    if (!PG_CERTS_SIG.some((o) => o.value === it.sigAlg)) add('inter', 'sigAlg', 'Pick a signature algorithm.');
  }
  if (sv.issuedBy !== 'self' && !pgCertsRoot((topo.root || {}).id)) add('root', 'id', 'Pick a root CA.');
  return errs;
}

/* ---- the check ---- */

function pgCertsEffective(topo, ask) {
  const t = pgClone(topo);
  if (ask) {
    if (ask.kind) t.client.kind = ask.kind;
    if (ask.date) t.client.date = ask.date;
    if (ask.host !== undefined && ask.host !== null) t.client.hostname = ask.host;
    if (ask.revocation !== undefined && ask.revocation !== null) t.client.checkRevocation = !!ask.revocation;
  }
  return t;
}

function pgCertsInterName(t) { return (t.inter && t.inter.name) || 'the intermediate CA'; }

function pgCertsTest(topo, ask) {
  const t = pgCertsEffective(topo, ask);
  const stages = PG_CERTS_STAGES.map(([key, label]) => ({ key, label, state: 'skip', text: 'not reached' }));
  const marks = { host: 'idle', leaf: 'idle', inter: 'idle', root: 'idle', l1: 'idle', l2: 'idle', trust: 'idle' };
  const steps = []; const notes = [];
  const out = { verdict: 'failed', summary: '', steps, stages, marks, notes, diagnosis: null, used: { kind: t.client && t.client.kind, date: t.client && t.client.date, host: t.client && t.client.hostname } };
  const stage = (key) => stages.find((s) => s.key === key);
  const pass = (key, text) => { const s = stage(key); s.state = 'ok'; s.text = text; };
  const stop = (key, diag, line, failMarks) => {
    const s = stage(key); s.state = 'fail'; s.text = diag.title;
    steps.push({ ok: false, text: line });
    (failMarks || []).forEach((k) => { marks[k] = 'fail'; });
    out.diagnosis = diag; out.summary = diag.title;
    return out;
  };

  const errs = pgCertsValidate(t);
  if (errs.length) {
    const e = errs[0];
    const d = pgFail('bad-config', 'A setting is not valid', e.text, 'Correct the highlighted field and run it again.', e.obj, e.field);
    steps.push({ ok: false, text: e.text });
    out.diagnosis = d; out.summary = d.title;
    return out;
  }

  const sv = t.server; const it = t.inter; const cl = t.client;
  const host = pgCertsHostParse(cl.hostname);
  const day = pgCertsDay(cl.date);
  const hasInter = sv.issuedBy === 'intermediate';
  const selfSigned = sv.issuedBy === 'self';
  const root = selfSigned ? null : pgCertsRoot(t.root.id);
  const isBrowser = cl.kind === 'browser';
  const who = isBrowser ? 'The browser' : 'The API client';
  const interName = pgCertsInterName(t);
  const interSent = hasInter && !!sv.sendsIntermediate;
  const interKnown = hasInter && (interSent || isBrowser);   // the client has the intermediate in hand (sent, cached or fetched)
  const leafName = sv.cn || '(no common name)';
  const sent = `its own certificate${interSent ? ' and the intermediate CA certificate' : ''}`;
  steps.push({ ok: true, text: `${who} connects to ${host.value} with its clock at ${cl.date}. The server sends ${sent}.` });

  /* 1. name check */
  const nc = pgCertsNameCheck(sv, cl.hostname);
  if (!nc.ok) {
    let why;
    let fixText = `Reissue the certificate with ${host.value} in its subject alternative names (SAN), or connect using a name the certificate lists.`;
    const sanText = nc.entries.length ? nc.entries.map((e) => e.raw).join(', ') : 'none';
    if (nc.hint === 'ip') {
      why = `${host.value} is an IP address. A DNS-name entry never matches an IP address (RFC 9525): the certificate would need an IP address entry in its SAN. This one lists: ${sanText}.`;
      fixText = `Connect by host name instead of the IP address, or have the certificate issued with the address (IP:${host.value}) in its SAN.`;
    } else if (nc.hint.indexOf('apex:') === 0) {
      why = `The certificate lists ${nc.hint.slice(5)}. A wildcard stands for exactly one label, so it covers names like www.${host.value} but not ${host.value} itself, which has no label in that position. SAN entries: ${sanText}.`;
      fixText = `Add ${host.value} as its own SAN entry next to the wildcard, or connect with a name the wildcard covers.`;
    } else if (nc.hint.indexOf('deep:') === 0) {
      why = `The certificate lists ${nc.hint.slice(5)}. A wildcard stands for exactly one label, and ${host.value} has more than one label in that position, so it is not covered. SAN entries: ${sanText}.`;
      fixText = `Add the exact name (or a wildcard one level lower, such as *.${host.value.split('.').slice(1).join('.')}) to the SAN, or use a name with a single label in front of the domain.`;
    } else if (nc.hint.indexOf('badwild:') === 0) {
      why = `"${nc.hint.slice(8)}" is not a valid wildcard: the * may only be the whole left-most label, once (RFC 9525 section 6.3), so clients ignore the entry. SAN entries: ${sanText}.`;
    } else if (nc.hint === 'nosan') {
      why = `The certificate has no DNS names in its subject alternative names at all, so there is nothing to match ${host.value} against.`;
    } else {
      why = `The certificate's subject alternative names are: ${sanText}. None of them covers ${host.value}.`;
    }
    const cnLine = nc.cnMatches
      ? ` The subject CN (${leafName}) does match, but it does not count: modern clients ignore the CN for host names and use only the SAN (RFC 9525; Chrome stopped using the CN in version 58).`
      : (sv.cn ? ` The subject CN is ${leafName}, but clients ignore the CN for host names and use only the SAN.` : '');
    return stop('host', pgFail('name-mismatch', `The certificate is not valid for ${host.value}`, `${why}${cnLine}`, fixText, 'server', 'sans'),
      `${host.value} is not in the certificate's SAN list (${sanText}).${nc.cnMatches ? ' The CN matches but is not used.' : ''}`, ['host']);
  }
  marks.host = 'ok';
  pass('host', nc.via === 'wildcard' ? `${host.value} matches ${nc.matched}` : `${host.value} is in the SAN list`);
  steps.push({ ok: true, text: nc.via === 'wildcard'
    ? `The name ${host.value} matches the SAN entry ${nc.matched} (the wildcard stands for exactly one label). The CN is not used for this check.`
    : nc.via === 'ip' ? `The address ${host.value} matches the IP address entry ${nc.matched} in the SAN.`
      : `The name ${host.value} is in the SAN list (entry ${nc.matched}). The CN is not used for this check.` });

  /* 2. validity dates */
  const lnb = pgCertsDay(sv.notBefore); const lna = pgCertsDay(sv.notAfter);
  const lp = pgCertsPeriod(lnb, lna, day);
  if (lp < 0) {
    return stop('dates', pgFail('not-yet-valid', 'The certificate is not valid yet',
      `The certificate becomes valid on ${sv.notBefore}, and the client's clock says ${cl.date}, ${pgCertsDaysWord(lnb - day)} earlier. Either the client's clock is wrong or the certificate really starts later. A certificate issued today is normally already valid, so a clock that is behind (a flat CMOS battery, a VM restored from an old snapshot, a manually changed date) is the first thing to rule out.`,
      'Check the client\'s date and time first. Only if the clock is right is the certificate itself starting later than it should.', 'client', 'date'),
    `The certificate's first valid day is ${sv.notBefore}; the client's clock says ${cl.date}.`, ['leaf']);
  }
  if (lp > 0) {
    return stop('dates', pgFail('expired', 'The certificate has expired',
      `The certificate was valid until ${sv.notAfter} (the last day counts, RFC 5280 section 4.1.2.5). The client's clock says ${cl.date}, ${pgCertsDaysWord(day - lna)} later. An expired certificate is rejected whatever else is right about it. If many unrelated sites fail on this one client at once, suspect its clock rather than every server.`,
      'Renew the certificate and install the new one, with a new not-after date. Automate renewals, because public certificates now last at most 200 days and the limit keeps falling.', 'server', 'notAfter'),
    `The certificate's last valid day was ${sv.notAfter}; the client's clock says ${cl.date}.`, ['leaf']);
  }
  marks.leaf = 'ok';
  steps.push({ ok: true, text: `${cl.date} is inside the server certificate's validity period (${sv.notBefore} to ${sv.notAfter}, both days included).` });
  let datesText = `server certificate valid ${sv.notBefore} to ${sv.notAfter}`;
  if (hasInter) {
    if (interKnown) {
      const inb = pgCertsDay(it.notBefore); const ina = pgCertsDay(it.notAfter);
      const ip = pgCertsPeriod(inb, ina, day);
      if (ip !== 0) {
        const early = ip < 0;
        return stop('dates', pgFail(early ? 'not-yet-valid' : 'expired', early ? 'The intermediate CA certificate is not valid yet' : 'The intermediate CA certificate has expired',
          early
            ? `The server certificate is fine, but the intermediate CA certificate (${interName}) only becomes valid on ${it.notBefore} and the client's clock says ${cl.date}. Every certificate in the chain has to be inside its own validity period.`
            : `The server certificate is fine, but the intermediate CA certificate (${interName}) expired on ${it.notAfter} and the client's clock says ${cl.date}. Every certificate in the chain has to be inside its own validity period, so everything this intermediate signed stops working at once, even certificates with years left.`,
          early ? 'Check the clock; otherwise get the correct intermediate from the CA.' : 'Replace the intermediate the server sends with the CA\'s current one, which the CA publishes. If the CA reissued its chain, install the new chain bundle.', 'inter', early ? 'notBefore' : 'notAfter'),
        `The intermediate CA certificate is outside its validity period (${it.notBefore} to ${it.notAfter}); the client's clock says ${cl.date}.`, ['inter']);
      }
      marks.inter = 'ok';
      steps.push({ ok: true, text: `The intermediate (${interName}) is inside its validity period too (${it.notBefore} to ${it.notAfter}).` });
      datesText += '; intermediate in date';
    } else {
      steps.push({ ok: true, text: 'The intermediate\'s dates cannot be checked yet: the server did not send it and this client does not have it. Chain building comes next.' });
      datesText += '; intermediate not available to check';
    }
  }
  pass('dates', datesText);

  /* 3. chain building */
  if (selfSigned) {
    marks.l1 = 'na'; marks.l2 = 'na'; marks.inter = 'na';
    pass('chain', 'self-signed: the chain is one certificate');
    steps.push({ ok: true, text: 'The certificate is self-signed: its issuer is itself, so the chain is just this one certificate.' });
  } else if (!hasInter) {
    marks.l1 = 'ok'; marks.l2 = 'na'; marks.inter = 'na';
    pass('chain', 'issued directly by the root');
    steps.push({ ok: true, text: `The certificate was issued directly by the root (${root.name}), so no intermediate is needed.` });
  } else if (interSent) {
    marks.l1 = 'ok'; marks.l2 = 'ok'; 
    pass('chain', 'server certificate, sent intermediate, then root');
    steps.push({ ok: true, text: `The server sent the intermediate (${interName}), so the client can link the server certificate to it and the intermediate to ${root.name} (RFC 8446 section 4.4.2: the server sends its certificate first, then the CA certificates that certify it).` });
  } else if (isBrowser) {
    marks.l1 = 'ok'; marks.l2 = 'ok';
    pass('chain', 'intermediate missing from the server, found by the browser');
    steps.push({ ok: true, text: `The server did not send the intermediate (${interName}), but a browser can usually find it on its own: it may have the intermediate cached from another site, or download it from the "CA Issuers" address in the certificate's Authority Information Access extension (RFC 5280 section 4.2.2.1). Here the chain is completed that way.` });
    notes.push(`The server is not sending its intermediate (${interName}). This browser repaired the chain itself, which is why it works here. Clients that only use what the server sends plus their trust store (curl, Python, Java, Go, most API libraries and scripts) will fail. "Works in my browser" does not prove the chain is complete; the fix belongs on the server.`);
  } else {
    marks.l1 = 'fail'; marks.inter = 'missing';
    return stop('chain', pgFail('missing-intermediate', 'The chain is incomplete: the intermediate is missing',
      `The server sent only its own certificate. That certificate says it was issued by ${interName}, but this client has no certificate by that name: it knows only what the server sends and the roots in its trust store, and it does not go looking for issuers. It cannot link the server certificate to a trusted root, so it stops. Tools usually report this as "unable to get local issuer certificate" (OpenSSL's wording). A browser often hides the same mistake by fetching or caching the intermediate itself.`,
      'Configure the server to send the full chain: its certificate followed by the intermediate (the "fullchain" file, not the certificate-only file). Do not "fix" it by copying the intermediate to every client.', 'server', 'sendsIntermediate'),
    `The server sent only the leaf. The issuer ${interName} is not in the client's hands and the client does not fetch issuers: no path to a root.`, ['l1']);
  }

  /* 4. trusted root */
  const trusted = cl.trusted || [];
  if (selfSigned) {
    if (trusted.indexOf('self') < 0) {
      return stop('trust', pgFail('untrusted-root', 'The certificate is self-signed and not trusted',
        `A self-signed certificate vouches only for itself: no CA the client trusts has signed it, so nothing ties it to the real server (anyone can make one for any name). The client would trust it only if this exact certificate had been put into its trust store beforehand, and it has not. Sending a certificate does not make it trusted; trust always comes from what the client was configured with (RFC 5280 section 6.1.1: a trust anchor is trusted because it was delivered to the client in advance).`,
        'Get a certificate from a CA the client trusts. For an internal system, deliberately install the certificate (or better, a private CA) in the clients that need it. Do not teach users to click through the warning.', 'client', 'trusted'),
      'The chain ends at the server\'s own self-signed certificate, which is not in the client\'s trust store.', ['trust', 'root']);
    }
    marks.root = 'ok'; marks.trust = 'ok';
    pass('trust', 'the client was set up to trust this exact certificate');
    steps.push({ ok: true, text: 'The client has this exact self-signed certificate in its trust store, so it is a trust anchor here. (A self-signed certificate is trusted because the client was given it in advance, not because of its own signature.)' });
  } else if (trusted.indexOf(root.id) < 0) {
    const priv = root.kind === 'private';
    return stop('trust', pgFail('untrusted-root', `The root (${root.name}) is not trusted by this client`,
      priv
        ? `The chain ends at ${root.name}, a private CA. Public trust stores do not contain private roots; only clients that were set up to trust it do (for example through a company device-management or group policy). This client was not, so it cannot tell this chain from one an attacker made. Sending the root along with the server's chain would not help: a client trusts a root because it was configured to, not because a server showed it.`
        : `The chain ends at ${root.name}, which is not in this client's trust store. That happens on old devices that never received the root, in minimal container images without a CA bundle, or with a bundle that has been pinned or trimmed. Sending the root along with the server's chain would not help: a client trusts a root because it was configured to, not because a server showed it.`,
      priv ? 'Distribute the private root to the clients that need it (device management, group policy, an image), or use a certificate from a CA those clients already trust.' : 'Update the client\'s trust store (operating system updates or the CA bundle), or use a certificate from a CA the client already trusts.', 'client', 'trusted'),
    `The chain ends at ${root.name}, which is not in the client's trust store.`, ['trust', 'root']);
  } else {
    marks.root = 'ok'; marks.trust = 'ok';
    pass('trust', `${root.name} is in the trust store`);
    steps.push({ ok: true, text: `The chain ends at ${root.name}, and the client's trust store contains it. That is the anchor of trust: the client trusts this root because it was configured to.` });
  }

  /* 5. key usage */
  if (!pgCertsEkuAllows(sv.eku)) {
    return stop('usage', pgFail('wrong-eku', 'The certificate is not allowed to identify a web server',
      `The certificate's extended key usage (EKU) lists: ${pgCertsEkuName(sv.eku)}. A client that is checking a web server requires the serverAuth purpose, and RFC 5280 section 4.2.1.12 says that when the extension is present the certificate must only be used for the purposes it lists. The name, dates and chain can all be perfect and the certificate is still refused for this job, which is what happens when a code-signing, S/MIME or client-authentication certificate is installed on a web server.`,
      'Request a certificate from a template or profile that includes serverAuth (a "web server" certificate) and install that one. The EKU cannot be edited after issuance.', 'server', 'eku'),
    `The EKU lists ${pgCertsEkuName(sv.eku)}, not serverAuth.`, ['leaf']);
  }
  pass('usage', sv.eku === 'none' ? 'no EKU extension (no purpose restriction)' : 'serverAuth is allowed');
  steps.push({ ok: true, text: sv.eku === 'none'
    ? 'The certificate has no extended key usage extension, and RFC 5280 places no restriction on its purpose in that case, so it is accepted for a web server. (Public CAs include serverAuth anyway.)'
    : `The extended key usage includes serverAuth (${pgCertsEkuName(sv.eku)}), which is what a client needs from a web server.` });

  /* 6. revocation */
  const leafRevoked = !!sv.revoked && !selfSigned;
  const interRevoked = hasInter && interKnown && !!it.revoked;
  if (selfSigned) {
    pass('revoke', 'no CA, nothing to revoke');
    steps.push({ ok: true, text: 'A self-signed certificate has no CA behind it, so there is no CRL or OCSP answer to ask for.' });
  } else if (!cl.checkRevocation) {
    pass('revoke', 'this client does not check revocation');
    steps.push({ ok: true, text: 'This client does not check revocation (CRL or OCSP), so it would not notice a revoked certificate. Many clients do not by default, or only soft-fail when they cannot ask.' });
    if (leafRevoked) notes.push('The CA has revoked the server certificate, but this client does not check revocation, so it connects anyway. Revocation only protects clients that ask.');
    else if (interRevoked) notes.push('The CA has revoked the intermediate certificate, but this client does not check revocation, so it connects anyway.');
  } else if (leafRevoked) {
    return stop('revoke', pgFail('revoked', 'The CA has revoked this certificate',
      'Before trusting the certificate the client asked the CA whether it is still good, using a certificate revocation list (CRL, RFC 5280 section 5) or an OCSP responder (RFC 6960), and the answer was "revoked". A CA revokes a certificate when its private key may have leaked, when the owner no longer controls the name, or when it was issued by mistake. Revocation is permanent: the same certificate is never good again, even if its dates are fine.',
      'Generate a new key, get a new certificate (new serial number) from the CA and install it. Find out why it was revoked: if the key leaked, treat the old key as compromised everywhere it was used.', 'server', 'revoked'),
    'The CA reports the server certificate as revoked (CRL or OCSP).', ['leaf']);
  } else if (interRevoked) {
    return stop('revoke', pgFail('revoked', 'The CA has revoked the intermediate certificate',
      `The server certificate itself is not revoked, but the intermediate that issued it (${interName}) is. Revoking a CA certificate cancels trust in everything it issued, so every certificate below it fails the revocation check.`,
      'The CA has to replace the intermediate and reissue certificates from the new one. Ask the CA for a replacement chain and install it on the server.', 'inter', 'revoked'),
    `The CA reports the intermediate certificate (${interName}) as revoked.`, ['inter']);
  } else {
    pass('revoke', 'the CA reports the certificate as good');
    steps.push({ ok: true, text: `The client checked the CA's revocation information (CRL or OCSP) and the certificate${hasInter ? ' and the intermediate are' : ' is'} not revoked.` });
  }

  /* 7. signature algorithm */
  if (selfSigned) {
    pass('sig', 'self-signature of a trust anchor is not checked');
    steps.push({ ok: true, text: 'The self-signature on a certificate that is trusted directly is not what makes it trusted, so the algorithm is not judged.' });
  } else if (pgCertsSigWeak(sv.sigAlg)) {
    return stop('sig', pgFail('weak-signature', 'The CA signed the certificate with a deprecated algorithm',
      `The CA's signature on the server certificate uses ${pgCertsSigName(sv.sigAlg)}. SHA-1 is broken for collision resistance (a practical collision was demonstrated in 2017). The public web PKI stopped issuing SHA-1 certificates around 2016 and browsers stopped accepting them around 2017, so modern clients reject the chain. If collisions are cheap, an attacker can craft a different certificate that carries the same signature.`,
      'Have the CA reissue the certificate signed with SHA-256 or stronger. Old internal CAs and appliances are the usual source; check the CA configuration, not just the certificate.', 'server', 'sigAlg'),
    'The server certificate is signed with SHA-1.', ['leaf']);
  } else if (hasInter && interKnown && pgCertsSigWeak(it.sigAlg)) {
    return stop('sig', pgFail('weak-signature', 'The intermediate CA is signed with a deprecated algorithm',
      `The root's signature on the intermediate certificate (${interName}) uses ${pgCertsSigName(it.sigAlg)}. SHA-1 is broken for collision resistance, so modern clients reject chains that depend on it, even when the server certificate itself uses SHA-256.`,
      'The CA must reissue the intermediate with a SHA-256 or stronger signature, and the server must send the new one.', 'inter', 'sigAlg'),
    'The intermediate certificate is signed with SHA-1.', ['inter']);
  } else {
    pass('sig', `${pgCertsSigName(sv.sigAlg)}${hasInter ? ' (and the intermediate\'s signature is acceptable)' : ''}`);
    steps.push({ ok: true, text: `The signatures in the chain use acceptable algorithms (${pgCertsSigName(sv.sigAlg)}${hasInter ? ` on the server certificate, ${pgCertsSigName(it.sigAlg)} on the intermediate` : ''}). The root's own self-signature is not checked: a root is trusted because it is in the store.` });
  }

  out.verdict = 'success';
  out.summary = `${who} trusts ${host.value}: the certificate is valid for the name, in date, chained to a trusted root and allowed for a web server.`;
  steps.push({ ok: true, text: `All checks passed: the connection to ${host.value} is trusted. (In real life the client would also check that the server holds the private key, which the lab does not simulate.)` });
  return out;
}

// The same server seen by a browser and by an API client (other overrides in `ask` apply to both).
function pgCertsClients(topo, ask) {
  return PG_CERTS_KINDS.map((k) => ({ kind: k.value, label: k.label, result: pgCertsTest(topo, { ...(ask || {}), kind: k.value }) }));
}

/* ---- scenario fixes ---- */

// fix entries: { path: 'server.sans', value } | { path: 'client.trusted', add: 'corp' } | { path: 'client.trusted', remove: 'corp' }
function pgCertsApplyFixes(topo, fixes) {
  const t = pgClone(topo);
  (fixes || []).forEach((f) => {
    const keys = f.path.split('.');
    let o = t;
    for (let i = 0; i < keys.length - 1; i += 1) o = o[keys[i]];
    const k = keys[keys.length - 1];
    if (f.add !== undefined) { if (o[k].indexOf(f.add) < 0) o[k].push(f.add); }
    else if (f.remove !== undefined) o[k] = o[k].filter((x) => x !== f.remove);
    else o[k] = pgClone(f.value);
  });
  return t;
}

/* ---- scenario goals ---- */

function pgCertsGet(topo, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), topo);
}
// A scenario is solved when every expectFixed outcome holds on the learner's copy, and the settings the
// scenario says must stay as they were (`keep`: a list of paths) have not been changed to get there.
function pgCertsSolved(scenario, topo) {
  const keepOk = (scenario.keep || []).every((p) => JSON.stringify(pgCertsGet(topo, p)) === JSON.stringify(pgCertsGet(scenario.topology, p)));
  return keepOk && scenario.expectFixed.every((g) => pgCertsTest(topo, g).verdict === g.verdict);
}
