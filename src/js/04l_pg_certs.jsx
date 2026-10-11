/* ---------------- IT Playground: certificate checker ---------------- */

// A client opens a connection to a server by name and decides whether to trust the certificate
// it is shown. Edit the server certificate, the CA chain behind it and the client (what it
// types, its clock and its trust store), run the check, and read which step fails first. The
// simulation is pgCertsTest in 03c_pg_certs.js; the guided scenarios come from
// data/playground_certs.py (PLAYGROUND.certs).

const PG_CERTS_LAB_DATE = '2026-10-11';
const PG_CERTS_MARK_HUE = { ok: COLOR.success, fail: COLOR.red, missing: COLOR.red, idle: COLOR.border, na: COLOR.border };
const PG_CERTS_STATE_HUE = { ok: COLOR.success, fail: COLOR.red, skip: COLOR.muted };
const PG_CERTS_STATE_MARK = { ok: '✓', fail: '✕', skip: '○' };
const PG_CERTS_EKU_SHORT = { server: 'serverAuth', 'server+client': 'serverAuth, clientAuth', client: 'clientAuth only', code: 'codeSigning only', email: 'emailProtection only', none: 'no EKU extension' };

function pgCertsSetPath(topo, path, value) {
  const t = pgClone(topo);
  const keys = path.split('.');
  let o = t;
  for (let i = 0; i < keys.length - 1; i += 1) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
  return t;
}
function pgCertsCut(s, n) { const t = String(s == null ? '' : s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; }
function pgCertsKindName(kind) { return kind === 'api' ? 'API client' : 'Web browser'; }

// Which editor card holds a diagnosis target (so "Show me where" can open it). 'test' = always visible.
const PG_CERTS_CARD_TITLES = {
  server: 'Server certificate', srvx: 'Usage, signature and revocation', chain: 'Issuer and what the server sends',
  inter: 'Intermediate CA certificate', root: 'Root CA', trust: 'Client trust store and settings',
};
function pgCertsCardFor(obj, field) {
  if (obj === 'server') {
    if (field === 'eku' || field === 'sigAlg' || field === 'revoked') return 'srvx';
    if (field === 'issuedBy' || field === 'sendsIntermediate') return 'chain';
    return 'server';
  }
  if (obj === 'inter') return 'inter';
  if (obj === 'root') return 'root';
  if (obj === 'client' && (field === 'trusted' || field === 'checkRevocation')) return 'trust';
  return 'test';
}

/* ---- the chain diagram ---- */

function PgCertsDiagram({ topo, result }) {
  const W = 320; const H = 306;
  const m = result ? result.marks : { host: 'idle', leaf: 'idle', inter: 'idle', root: 'idle', l1: 'idle', l2: 'idle', trust: 'idle' };
  const diag = result && result.diagnosis;
  const sv = topo.server; const it = topo.inter; const cl = topo.client;
  const hasInter = sv.issuedBy === 'intermediate'; const self = sv.issuedBy === 'self';
  const root = pgCertsRoot(topo.root.id);
  const sanTxt = pgCertsSanList(sv.sans).entries.map((e) => e.raw).join(', ') || 'none';
  const hue = (mk) => PG_CERTS_MARK_HUE[mk] || COLOR.border;
  const strong = (mk) => mk === 'ok' || mk === 'fail' || mk === 'missing';
  const icon = (mk) => ({ ok: '✓', fail: '✕', missing: '?', na: '–' })[mk] || '';
  const box = (key, y, h, mk, lines, dashed) => {
    const c = hue(mk);
    return (
      <g key={key}>
        <rect x="4" y={y} width="312" height={h} rx="9" fill={strong(mk) ? tint(c, 10) : COLOR.surfaceRaised} stroke={c} strokeWidth={strong(mk) ? 2.4 : 1.5} strokeDasharray={dashed ? '5 4' : undefined} />
        {lines.map((ln, i) => <text key={i} x="14" y={y + 15 + i * 11.5} fill={i < 2 ? COLOR.text : COLOR.muted} fontSize={i === 0 ? '10.5' : '8.8'} fontWeight={i === 0 ? '800' : '500'}>{ln}</text>)}
        {icon(mk) ? <text x="300" y={y + h / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="900" fill={mk === 'na' ? COLOR.muted : ink(c)}>{icon(mk)}</text> : null}
      </g>
    );
  };
  const link = (key, y1, y2, mk, label) => {
    const c = mk === 'idle' || mk === 'na' ? COLOR.muted : hue(mk);
    return (
      <g key={key}>
        <line x1="160" y1={y1} x2="160" y2={y2 - 1} stroke={c} strokeWidth={strong(mk) ? 2.6 : 1.5} strokeDasharray={mk === 'na' || mk === 'missing' ? '4 3' : undefined} />
        <path d={`M155 ${y2 - 6} L160 ${y2} L165 ${y2 - 6}`} fill="none" stroke={c} strokeWidth={strong(mk) ? 2.4 : 1.5} />
        <text x="172" y={(y1 + y2) / 2 + 3} fill={mk === 'idle' || mk === 'na' ? COLOR.muted : ink(c)} fontSize="8.5" fontWeight="700">{label}</text>
      </g>
    );
  };
  const clientFail = !!diag && diag.deviceId === 'client' && diag.field === 'date';
  const trustNames = (cl.trusted || []).map((id) => (id === 'self' ? 'this server certificate' : (pgCertsRoot(id) || { name: id }).name)).join(', ') || 'empty';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Certificate chain diagram: client, server certificate, intermediate CA, root CA and the client trust store" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      <rect x="4" y="4" width="312" height="36" rx="9" fill={COLOR.surfaceRaised} stroke={clientFail ? COLOR.red : COLOR.blue} strokeWidth={clientFail ? 2.6 : 1.8} />
      <text x="14" y="19" fill={COLOR.text} fontSize="10.5" fontWeight="800">{pgCertsKindName(cl.kind)} · clock {cl.date}</text>
      <text x="14" y="32" fill={COLOR.muted} fontSize="8.8">connects to {pgCertsCut(cl.hostname, 44)}</text>
      {link('lh', 40, 60, m.host, m.host === 'fail' ? 'name not on the certificate' : 'name check')}
      {box('leaf', 60, 56, m.leaf, [
        self ? 'Server certificate (self-signed)' : 'Server certificate',
        `CN ${pgCertsCut(sv.cn || 'none', 24)} · SAN ${pgCertsCut(sanTxt, 30)}`,
        `${sv.notBefore} → ${sv.notAfter} · ${pgCertsSigName(sv.sigAlg)}`,
        `Use: ${PG_CERTS_EKU_SHORT[sv.eku] || sv.eku}${sv.revoked && !self ? ' · REVOKED' : ''}`,
      ])}
      {link('l1', 116, 136, m.l1, self ? 'signs itself' : (m.inter === 'missing' ? 'intermediate not sent' : 'issued by'))}
      {hasInter
        ? box('inter', 136, 46, m.inter, [
          `Intermediate CA · ${sv.sendsIntermediate ? 'sent by the server' : 'not sent by the server'}`,
          pgCertsCut(it.name, 44),
          `${it.notBefore} → ${it.notAfter} · ${pgCertsSigName(it.sigAlg)}${it.revoked ? ' · REVOKED' : ''}`,
        ], !sv.sendsIntermediate)
        : box('inter', 136, 46, 'na', ['No intermediate', self ? 'The certificate signs itself.' : 'The root issued the server certificate directly.'], true)}
      {link('l2', 182, 202, m.l2, hasInter ? 'issued by' : '')}
      {self
        ? box('root', 202, 40, 'na', ['No root', 'Self-signed: nothing above this certificate.'], true)
        : box('root', 202, 40, m.root, [`Root CA · ${pgCertsCut(root.name, 34)}`, root.kind === 'private' ? 'A private CA: not in public trust stores' : 'A public CA root'])}
      {link('lt', 242, 262, m.trust, m.trust === 'fail' ? 'not in the trust store' : 'in the trust store?')}
      {box('store', 262, 40, m.trust === 'ok' ? 'ok' : 'idle', ['Client trust store', pgCertsCut(trustNames, 54)])}
    </svg>
  );
}

/* ---- small controls ---- */

function PgCertsDate({ label, value, onChange, error, hot, steps }) {
  const valid = pgCertsDay(value) !== null;
  const btn = (text, aria, fn) => (
    <button key={text} className="btn-flat" disabled={!valid} aria-label={`${label}: ${aria}`} onClick={() => onChange(fn(value))}
      style={{ ...pgPillStyle, padding: '4px 10px', minHeight: '36px', minWidth: '44px', opacity: valid ? 1 : 0.4 }}>{text}</button>
  );
  return (
    <div style={{ outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px', minWidth: 0 }}>
      <label style={{ display: 'block', minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>{label}</span>
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} aria-invalid={error ? 'true' : undefined} style={{ ...pgInputStyle(!!error), fontFamily: 'inherit', minHeight: '40px' }} />
      </label>
      {error ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.red, marginTop: '3px' }}>{error}</span> : null}
      {steps ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {btn('−1 year', 'back one year', (v) => pgCertsAddMonths(v, -12))}
          {btn('−1 month', 'back one month', (v) => pgCertsAddMonths(v, -1))}
          {btn('−1 day', 'back one day', (v) => pgCertsAddDays(v, -1))}
          {btn('+1 day', 'forward one day', (v) => pgCertsAddDays(v, 1))}
          {btn('+1 month', 'forward one month', (v) => pgCertsAddMonths(v, 1))}
          {btn('+1 year', 'forward one year', (v) => pgCertsAddMonths(v, 12))}
        </div>
      ) : null}
    </div>
  );
}

function PgCertsHot({ hot, children }) {
  return <div style={{ outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px', minWidth: 0 }}>{children}</div>;
}

function PgCertsSection({ id, open, setOpen, hue, hotCard, summary, children }) {
  const isOpen = !!open[id];
  const title = PG_CERTS_CARD_TITLES[id];
  return (
    <PgCard title={title} hue={hue} style={hotCard ? { outline: `2px solid ${COLOR.red}`, outlineOffset: '2px' } : undefined}
      right={<button className="btn-flat" aria-label={`${title}: ${isOpen ? 'hide' : 'show'}`} aria-expanded={isOpen} onClick={() => setOpen({ ...open, [id]: !isOpen })}
        style={{ ...pgPillStyle, padding: '5px 12px', minHeight: '36px' }}>{isOpen ? 'Hide' : 'Show'}</button>}>
      {isOpen ? children : <div style={{ fontSize: '12px', color: COLOR.muted, overflowWrap: 'anywhere' }}>{summary || 'Tap Show to edit.'}</div>}
    </PgCard>
  );
}

/* ---- the editors ---- */

function PgCertsEditors({ topo, setTopo, diag, open, setOpen }) {
  const sv = topo.server; const it = topo.inter; const cl = topo.client;
  const errs = pgCertsValidate(topo);
  const err = (obj, f) => { const e = errs.find((x) => x.obj === obj && x.field === f); return e ? e.text : undefined; };
  const real = !!diag && diag.code !== 'bad-config';
  const hot = (obj, ...fields) => real && diag.deviceId === obj && fields.indexOf(diag.field) >= 0;
  const bad = (obj, f) => !!diag && diag.code === 'bad-config' && diag.deviceId === obj && diag.field === f;
  const hotCard = (id) => !!diag && pgCertsCardFor(diag.deviceId, diag.field) === id;
  const put = (path, value) => setTopo(pgCertsSetPath(topo, path, value));
  const sec = (id, hue, summary, children) => <PgCertsSection id={id} open={open} setOpen={setOpen} hue={hue} hotCard={hotCard(id)} summary={summary}>{children}</PgCertsSection>;
  const g2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' };
  const hasInter = sv.issuedBy === 'intermediate';
  const root = pgCertsRoot(topo.root.id);
  const toggleTrust = (id, on) => put('client.trusted', on ? (cl.trusted.indexOf(id) < 0 ? cl.trusted.concat([id]) : cl.trusted) : cl.trusted.filter((x) => x !== id));
  return (
    <div>
      {sec('server', COLOR.teal, `CN ${sv.cn || 'none'} · valid ${sv.notBefore} to ${sv.notAfter}`, (
        <div>
          <PgField label="Subject common name (CN)" value={sv.cn} onChange={(v) => put('server.cn', v)} hint="For humans to read. Clients do not use it to check the host name." />
          <div style={{ marginTop: '8px' }}>
            <PgCertsHot hot={hot('server', 'sans') || bad('server', 'sans')}>
              <PgField label="Subject alternative names (SAN)" value={sv.sans} onChange={(v) => put('server.sans', v)} error={err('server', 'sans')} placeholder="www.example.com, *.example.com"
                hint="Comma separated. A * is allowed only as the whole left-most label and stands for one label. Write an address as IP:203.0.113.5." />
            </PgCertsHot>
          </div>
          <div style={{ ...g2, marginTop: '8px' }}>
            <PgCertsDate label="Not before" value={sv.notBefore} onChange={(v) => put('server.notBefore', v)} error={err('server', 'notBefore')} hot={hot('server', 'notBefore') || bad('server', 'notBefore')} />
            <PgCertsDate label="Not after" value={sv.notAfter} onChange={(v) => put('server.notAfter', v)} error={err('server', 'notAfter')} hot={hot('server', 'notAfter') || bad('server', 'notAfter')} />
          </div>
        </div>
      ))}
      {sec('srvx', COLOR.blue, `${PG_CERTS_EKU_SHORT[sv.eku] || sv.eku} · ${pgCertsSigName(sv.sigAlg)}${sv.revoked ? ' · revoked' : ''}`, (
        <div>
          <div style={g2}>
            <PgCertsHot hot={hot('server', 'eku') || bad('server', 'eku')}><PgSelect label="Extended key usage" value={sv.eku} onChange={(v) => put('server.eku', v)} options={PG_CERTS_EKU} /></PgCertsHot>
            <PgCertsHot hot={hot('server', 'sigAlg') || bad('server', 'sigAlg')}><PgSelect label="CA's signature algorithm" value={sv.sigAlg} onChange={(v) => put('server.sigAlg', v)} options={PG_CERTS_SIG} /></PgCertsHot>
          </div>
          <div style={{ marginTop: '8px' }}>
            <PgToggle label="Revoked by the CA" hint="The CA lists this certificate on its revocation list (CRL) and answers 'revoked' over OCSP. Revocation is permanent: a replacement is a new certificate. Clearing the box stands for installing the replacement." value={sv.revoked} onChange={(v) => put('server.revoked', v)} hot={hot('server', 'revoked')} />
          </div>
        </div>
      ))}
      {sec('chain', COLOR.gold, `${(PG_CERTS_ISSUED.find((o) => o.key === sv.issuedBy) || {}).label || sv.issuedBy}${hasInter ? (sv.sendsIntermediate ? ' · server sends the intermediate' : ' · server does not send the intermediate') : ''}`, (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Who issued the server certificate</div>
          <PgCertsHot hot={hot('server', 'issuedBy') || bad('server', 'issuedBy')}>
            <PgSegmented hue={COLOR.gold} value={sv.issuedBy} onChange={(v) => put('server.issuedBy', v)} options={PG_CERTS_ISSUED} />
          </PgCertsHot>
          {hasInter ? (
            <PgToggle label="The server sends the intermediate CA certificate" hint="A server should send its own certificate followed by the intermediates (the 'fullchain' file). Browsers may repair a missing one; most other clients do not." value={sv.sendsIntermediate} onChange={(v) => put('server.sendsIntermediate', v)} hot={hot('server', 'sendsIntermediate')} />
          ) : (
            <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>{sv.issuedBy === 'self' ? 'A self-signed certificate has no CA above it, so there is nothing else for the server to send.' : 'The root issued this certificate directly, so there is no intermediate to send.'}</div>
          )}
        </div>
      ))}
      {sec('inter', COLOR.orange, hasInter ? `${it.name} · valid ${it.notBefore} to ${it.notAfter}` : 'Not used: the server certificate was not issued by an intermediate.', (
        hasInter ? (
          <div>
            <PgField label="Intermediate CA name" value={it.name} onChange={(v) => put('inter.name', v)} />
            <div style={{ ...g2, marginTop: '8px' }}>
              <PgCertsDate label="Intermediate not before" value={it.notBefore} onChange={(v) => put('inter.notBefore', v)} error={err('inter', 'notBefore')} hot={hot('inter', 'notBefore') || bad('inter', 'notBefore')} />
              <PgCertsDate label="Intermediate not after" value={it.notAfter} onChange={(v) => put('inter.notAfter', v)} error={err('inter', 'notAfter')} hot={hot('inter', 'notAfter') || bad('inter', 'notAfter')} />
            </div>
            <div style={{ marginTop: '8px' }}>
              <PgCertsHot hot={hot('inter', 'sigAlg') || bad('inter', 'sigAlg')}><PgSelect label="Root's signature algorithm on the intermediate" value={it.sigAlg} onChange={(v) => put('inter.sigAlg', v)} options={PG_CERTS_SIG} /></PgCertsHot>
            </div>
            <PgToggle label="Intermediate revoked by the root CA" hint="Revoking a CA certificate cancels trust in everything it issued." value={it.revoked} onChange={(v) => put('inter.revoked', v)} hot={hot('inter', 'revoked')} />
          </div>
        ) : <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>Not used: the server certificate was not issued by an intermediate. Pick Intermediate CA under "Issuer and what the server sends" to use it.</div>
      ))}
      {sec('root', COLOR.pink, sv.issuedBy === 'self' ? 'Not used: the certificate is self-signed.' : `${root.name} (${root.kind})`, (
        sv.issuedBy === 'self' ? <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>Not used: the certificate is self-signed, so there is no root above it.</div> : (
          <div>
            <PgCertsHot hot={hot('root', 'id') || bad('root', 'id')}>
              <PgSelect label="The root CA at the top of the chain" value={topo.root.id} onChange={(v) => put('root.id', v)} options={PG_CERTS_ROOTS.map((r) => ({ value: r.id, label: `${r.name} (${r.kind})` }))} />
            </PgCertsHot>
            <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginTop: '6px' }}>{root.kind === 'public' ? 'A public CA root: operating systems and browsers ship it in their trust stores.' : 'A private CA root: only machines that were set up to trust it do. Public trust stores do not contain it.'} Its own expiry is not checked in this lab.</div>
          </div>
        )
      ))}
      {sec('trust', COLOR.success, `Trusts ${(cl.trusted || []).length} root${(cl.trusted || []).length === 1 ? '' : 's'} · ${cl.checkRevocation ? 'checks revocation' : 'does not check revocation'}`, (
        <div>
          <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '4px' }}>A client trusts a chain only if it ends at a certificate in this list. Sending a root along with the chain does not add it.</div>
          <PgCertsHot hot={hot('client', 'trusted')}>
            {PG_CERTS_ROOTS.map((r) => (
              <PgToggle key={r.id} label={r.name} hint={r.kind === 'public' ? 'A public CA root, shipped in operating systems and browsers.' : 'A private CA root: trusted only on machines set up for it (device management, group policy).'} value={cl.trusted.indexOf(r.id) >= 0} onChange={(v) => toggleTrust(r.id, v)} />
            ))}
            <PgToggle label="This server's own self-signed certificate" hint="Imported by hand as a trusted certificate. It only matters when the server certificate is self-signed." value={cl.trusted.indexOf('self') >= 0} onChange={(v) => toggleTrust('self', v)} />
          </PgCertsHot>
          <PgToggle label="Client checks revocation (CRL or OCSP)" hint="Many clients do not by default. A client that does not ask cannot notice a revoked certificate." value={cl.checkRevocation} onChange={(v) => put('client.checkRevocation', v)} hot={hot('client', 'checkRevocation')} />
        </div>
      ))}
    </div>
  );
}

/* ---- results ---- */

function PgCertsStatus({ stages }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>The checks, in order</div>
      {stages.map((s) => (
        <div key={s.key} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', padding: '6px 10px', marginBottom: '4px', borderRadius: '10px', background: tint(PG_CERTS_STATE_HUE[s.state], s.state === 'skip' ? 4 : 12), border: `1.5px solid color-mix(in srgb, ${PG_CERTS_STATE_HUE[s.state]} 50%, ${COLOR.border})` }}>
          <span aria-hidden="true" style={{ fontWeight: 900, width: '14px', flexShrink: 0, color: s.state === 'skip' ? COLOR.muted : ink(PG_CERTS_STATE_HUE[s.state]) }}>{PG_CERTS_STATE_MARK[s.state]}</span>
          <span style={{ minWidth: 0, fontSize: '12.5px', lineHeight: 1.4 }}><strong>{s.label}</strong><span style={{ color: COLOR.muted }}> {'·'} {s.state === 'ok' ? `passed: ${s.text}` : s.state === 'fail' ? `failed: ${s.text}` : s.text}</span></span>
        </div>
      ))}
    </div>
  );
}

const PG_CERTS_CAUSES = {
  'name-mismatch': 'The name the client typed is not in the certificate\'s SAN list',
  expired: 'A certificate in the chain is past its not-after date',
  'not-yet-valid': 'A certificate in the chain starts after the client\'s clock',
  'missing-intermediate': 'The server did not send the intermediate CA certificate',
  'untrusted-root': 'The chain ends at a root the client does not trust',
  'wrong-eku': 'The certificate is not allowed to be used for a web server',
  revoked: 'The CA has revoked a certificate in the chain',
  'weak-signature': 'A certificate is signed with a deprecated algorithm (SHA-1)',
};

function PgCertsResult({ result, onWhere }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const d = result.diagnosis;
  const card = d ? pgCertsCardFor(d.deviceId, d.field) : 'test';
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      {result.notes && result.notes.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(COLOR.orange, 12), border: `2px solid color-mix(in srgb, ${COLOR.orange} 55%, ${COLOR.border})`, marginBottom: '10px', fontSize: '12.5px', lineHeight: 1.5 }}>
          <strong>Worth knowing:</strong> {result.notes.join(' ')}
        </div>
      )}
      <PgCertsStatus stages={result.stages} />
      <PgDiagnosis diagnosis={d} heading="First thing that is wrong" />
      {d && d.deviceId && card !== 'test' && (
        <button className="btn-flat" onClick={() => onWhere(d)} style={{ ...pgPillStyle, marginBottom: '10px', minHeight: '36px', border: `2px solid ${COLOR.primary}`, color: ink(COLOR.primary) }}>Show me where</button>
      )}
      <PgSteps steps={result.steps} />
    </div>
  );
}

function PgCertsClients({ topo }) {
  const rows = pgCertsClients(topo);
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>The same server, name and date, seen by two kinds of client. A browser may repair a chain that a script cannot.</div>
      {rows.map((c) => {
        const ok = c.result.verdict === 'success';
        return (
          <div key={c.kind} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', padding: '6px 10px', marginBottom: '4px', borderRadius: '10px', background: tint(ok ? COLOR.success : COLOR.red, 10), border: `1.5px solid color-mix(in srgb, ${ok ? COLOR.success : COLOR.red} 50%, ${COLOR.border})`, fontSize: '12.5px', lineHeight: 1.4 }}>
            <span aria-hidden="true" style={{ fontWeight: 900, width: '14px', flexShrink: 0, color: ink(ok ? COLOR.success : COLOR.red) }}>{ok ? '✓' : '✕'}</span>
            <span style={{ minWidth: 0 }}><strong>{c.label}</strong>{' · '}{ok ? (c.result.notes.length ? 'trusted, but only because it repairs the chain' : 'trusted') : c.result.diagnosis.title}</span>
          </div>
        );
      })}
    </div>
  );
}

function pgCertsGoalLabel(topo, g) {
  const who = (g.kind || topo.client.kind) === 'api' ? 'An API client' : 'A web browser';
  const host = g.host || topo.client.hostname;
  return `${who} trusts ${host}${g.date ? ` with its clock at ${g.date}` : ''}`;
}

/* ---- the lab ---- */

function PgCertsLab({ topo, setTopo, goals, defaultOpen }) {
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(defaultOpen || {});
  const cl = topo.client;
  const edit = (t) => { setTopo(t); setResult(null); };
  const diag = result && result.diagnosis;
  const where = (d) => setOpen({ ...open, [pgCertsCardFor(d.deviceId, d.field)]: true });
  const errs = pgCertsValidate(topo);
  const cerr = (f) => { const e = errs.find((x) => x.obj === 'client' && x.field === f); return e ? e.text : undefined; };
  const real = !!diag && diag.code !== 'bad-config';
  const badC = (f) => !!diag && diag.code === 'bad-config' && diag.deviceId === 'client' && diag.field === f;
  const goalStates = (goals || []).map((g) => ({ g, r: pgCertsTest(topo, g) }));
  return (
    <div>
      <PgCard title="The chain" hue={COLOR.teal}>
        <PgCertsDiagram topo={topo} result={result} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px', lineHeight: 1.5 }}>
          <span style={{ color: ink(COLOR.success) }}>green = passed</span> {'·'} <span style={{ color: ink(COLOR.red) }}>red = the first thing that fails</span> {'·'} dashed = not used or not sent
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{pgCertsGoalLabel(topo, g)}</span>
            </div>
          ))}
        </PgCard>
      )}
      <PgCard title="Compare a browser and an API client" hue={COLOR.blue} collapsible defaultOpen={false}>
        <PgCertsClients topo={topo} />
      </PgCard>
      <PgCertsEditors topo={topo} setTopo={edit} diag={diag} open={open} setOpen={setOpen} />
      <PgCard title="Connect from the client" hue={COLOR.success}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Kind of client</div>
        <PgSegmented hue={COLOR.blue} value={cl.kind} onChange={(v) => edit(pgCertsSetPath(topo, 'client.kind', v))} options={PG_CERTS_KINDS.map((k) => ({ key: k.value, label: k.label }))} />
        <PgCertsHot hot={badC('hostname')}>
          <PgField label="Hostname the client types" value={cl.hostname} onChange={(v) => edit(pgCertsSetPath(topo, 'client.hostname', v))} error={cerr('hostname')} placeholder="www.example.com" hint="The name in the address. Clients check this name, not the one a DNS alias points to." />
        </PgCertsHot>
        <div style={{ marginTop: '10px' }}>
          <PgCertsDate label="Client clock (today's date on the client)" value={cl.date} onChange={(v) => edit(pgCertsSetPath(topo, 'client.date', v))} error={cerr('date')} hot={(real && diag.deviceId === 'client' && diag.field === 'date') || badC('date')} steps />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
            <button className="btn-flat" onClick={() => edit(pgCertsSetPath(topo, 'client.date', PG_CERTS_LAB_DATE))} style={{ ...pgPillStyle, minHeight: '36px' }}>Set to the lab date</button>
            <span style={{ fontSize: '11.5px', color: COLOR.muted }}>In the lab, today is {PG_CERTS_LAB_DATE}.</span>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <PgPredict compute={() => pgCertsTest(topo)} causes={PG_CERTS_CAUSES} buttonLabel="Check the certificate" onResult={setResult} resetKey={JSON.stringify(topo)} />
          <PgCertsResult result={result} onWhere={where} />
        </div>
      </PgCard>
    </div>
  );
}

function pgCertsValidTopo(t) {
  return !!t && !!t.server && !!t.inter && !!t.root && !!t.client && typeof t.server.sans === 'string' && typeof t.server.notBefore === 'string' && typeof t.server.notAfter === 'string'
    && ['intermediate', 'root', 'self'].indexOf(t.server.issuedBy) >= 0 && typeof t.server.sendsIntermediate === 'boolean' && typeof t.server.revoked === 'boolean'
    && typeof t.inter.notBefore === 'string' && typeof t.inter.notAfter === 'string' && typeof t.inter.name === 'string'
    && typeof t.root.id === 'string' && (t.client.kind === 'browser' || t.client.kind === 'api') && typeof t.client.hostname === 'string' && typeof t.client.date === 'string'
    && Array.isArray(t.client.trusted) && typeof t.client.checkRevocation === 'boolean';
}

function CertsTool({ pick, onPick }) {
  const scenarios = pgScenarios('certs');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="certs" makeDefault={() => pgClone(pgData().certsSandbox)} validate={pgCertsValidTopo} onBack={() => onPick('')}
        blurb="A working HTTPS setup: a certificate from a public CA through an intermediate, and a browser that trusts the root. Change the name the client types, move its clock, stop the server sending the intermediate, swap the root, change the key usage, revoke the certificate or choose SHA-1, and see which check fails first. Try letting the intermediate expire while the server certificate is still in date."
        renderLab={(topo, setTopo) => <PgCertsLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="certs" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => pgCertsSolved(scenario, topo)}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgCertsLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} />} />
    );
  }
  return (
    <PgScenarioPicker tool="certs" scenarios={scenarios} onPick={onPick}
      intro="A client decides whether to trust a server's certificate by checking it step by step: does the name it typed appear in the certificate, is every certificate in date, can it build a chain up to a root it trusts, is the certificate allowed to be a web server certificate, has the CA revoked it, and was it signed with a deprecated algorithm. Run the check and read which step fails first."
      note="Simplified on purpose: no real cryptography (no keys are used and no signatures are verified), and dates are plain calendar dates with both ends included. The checks run in one fixed teaching order; real clients differ and often report several errors at once. Only the extended key usage is modelled, not the other key usage bits, name constraints or certificate policies. A root's own expiry is not checked, a client either checks revocation or does not (no soft-fail or stapling), and only DNS names and IPv4 addresses exist. The lab's calendar says today is 2026-10-11. Name rules follow RFC 9525 (which replaces RFC 6125)."
      sandboxText="A working HTTPS setup to adjust, break and check." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'certs',
  label: 'Certificate checker',
  hue: COLOR.gold,
  blurb: 'A client, a server certificate and the CA chain behind it. Change the name, the dates, the intermediate, the trust store, the key usage or the revocation status, then check the certificate and see which step fails first.',
  Component: CertsTool,
});
