/* ---------------- IT Playground: DNS lab ---------------- */

// One zone on one authoritative server, caching resolvers, clients with a DNS server
// and a hosts file, and a virtual clock that ages the resolver caches. The simulation
// is src/js/03c_pg_dns.js; guided scenarios come from data/playground_dns.py (PLAYGROUND.dns).

const PG_DNS_CAUSES = {
  'wrong-record': 'The record points at the wrong machine, or at an address where nothing lives',
  'wrong-dns-server': 'The client (or resolver) uses a DNS server that cannot answer',
  'nxdomain': 'The name does not exist in the zone (a typo or a missing record)',
  'nodata': 'The name exists but has no record of the type asked for',
  'cname-loop': 'Alias (CNAME) records point at each other in a circle',
  'cname-chain': 'The chain of aliases is too long',
  'cname-apex': 'A CNAME at the zone apex makes the zone invalid',
  'cname-conflict': 'A CNAME shares its name with other records',
  'bad-record': 'A record in the zone has an invalid value',
  'hosts-override': 'A line in the hosts file overrides DNS on that device',
  'stale-cache': 'The resolver still holds an old record until its TTL ends',
  'negative-cache': 'The resolver still remembers that the name did not exist',
  'split-horizon': 'The inside and the outside get the wrong view of the zone',
  'resolver-down': 'The resolver is offline',
  'auth-down': 'The authoritative zone server is offline',
  'out-of-zone': 'The name is outside the zone this lab simulates',
  'bad-query': 'The name or the record type asked for is not valid',
};

const PG_DNS_TYPE_OPTIONS = ['A', 'AAAA', 'CNAME', 'MX'].map((t) => ({ value: t, label: t }));
const PG_DNS_NET_OPTIONS = [{ value: 'internal', label: 'Inside' }, { value: 'external', label: 'Outside' }];
const PG_DNS_ADVANCES = [{ label: '+1 minute', sec: 60 }, { label: '+10 minutes', sec: 600 }, { label: '+1 hour', sec: 3600 }, { label: '+1 day', sec: 86400 }];

const pgDnsAddBtn = { fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' };
const pgDnsDelBtn = { width: '36px', height: '36px', color: COLOR.muted, flexShrink: 0 };
const pgDnsMono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' };

function pgDnsClip(s, k) { const t = String(s == null ? '' : s); return t.length > k ? `${t.slice(0, k - 1)}…` : t; }
function pgDnsSplitList(v) { return String(v || '').split(',').map((x) => x.trim()).filter(Boolean); }

/* ---------- diagram ---------- */

function PgDnsDiagram({ topo, st, selected, result, hotId }) {
  const W = 320;
  const col = { c: { x: 4, w: 90 }, r: { x: 120, w: 86 }, a: { x: 236, w: 80 } };
  const rowH = 48;
  const top = 22;
  const boxH = 42;
  const MAX_CLIENTS = 6;
  const clients = topo.clients.slice(0, MAX_CLIENTS);
  const resolvers = topo.resolvers;
  const rows = Math.max(clients.length, resolvers.length, 1);
  const H = top + rows * rowH + (topo.clients.length > MAX_CLIENTS ? 14 : 2);
  const auth = topo.auth;
  const authY = top + (rows * rowH - boxH) / 2;
  const clientY = (i) => top + i * rowH + (rowH - boxH) / 2;
  const resolverY = (j) => {
    const span = rows * rowH;
    const slot = span / Math.max(1, resolvers.length);
    return top + j * slot + (slot - boxH) / 2;
  };
  const cpt = (c) => String(c.dns == null ? '' : c.dns).trim();
  const authHot = hotId === 'auth';
  const box = (x, y, w, name, line2, line3, o) => {
    const chars = Math.floor((w - 8) / 5.1);
    return (
      <g>
        <rect x={x} y={y} width={w} height={boxH} rx="8" fill={o.fill || COLOR.surfaceRaised} stroke={o.stroke || COLOR.border} strokeWidth={o.sw || 1.2} />
        <text x={x + w / 2} y={y + 14} textAnchor="middle" fill={COLOR.text} fontSize="9.5" fontWeight="700">{pgDnsClip(name, chars)}</text>
        <text x={x + w / 2} y={y + 26} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{pgDnsClip(line2, chars + 2)}</text>
        <text x={x + w / 2} y={y + 37} textAnchor="middle" fill={o.line3 || COLOR.muted} fontSize="8" fontWeight={o.line3 ? 700 : 400}>{pgDnsClip(line3, chars + 3)}</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="DNS network diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      {[['CLIENTS', col.c], ['RESOLVER', col.r], ['ZONE SERVER', col.a]].map(([t, c]) => (
        <text key={t} x={c.x + c.w / 2} y={12} textAnchor="middle" fill={COLOR.muted} fontSize="8.5" fontWeight="800" letterSpacing="0.6">{t}</text>
      ))}
      {resolvers.map((rs, j) => {
        const y1 = resolverY(j) + boxH / 2;
        const ok = rs.upstream === 'auth';
        return <line key={`up-${rs.id}`} x1={col.r.x + col.r.w} y1={y1} x2={col.a.x} y2={authY + boxH / 2} stroke={ok ? COLOR.teal : COLOR.muted} strokeWidth="1.6" strokeDasharray={ok ? undefined : '3 3'} />;
      })}
      {clients.map((c, i) => {
        const y1 = clientY(i) + boxH / 2;
        const dns = cpt(c);
        const rj = resolvers.findIndex((rs) => rs.ip === dns);
        const direct = rj < 0 && dns && auth.ip === dns;
        const hot = hotId === c.id;
        const stroke = hot ? COLOR.red : COLOR.blue;
        if (rj >= 0) return <line key={`l-${c.id}`} x1={col.c.x + col.c.w} y1={y1} x2={col.r.x} y2={resolverY(rj) + boxH / 2} stroke={stroke} strokeWidth="1.4" />;
        if (direct) return <line key={`l-${c.id}`} x1={col.c.x + col.c.w} y1={y1} x2={col.a.x} y2={authY + boxH / 2} stroke={stroke} strokeWidth="1.2" strokeDasharray="2 3" />;
        return (
          <g key={`l-${c.id}`}>
            <line x1={col.c.x + col.c.w} y1={y1} x2={col.c.x + col.c.w + 18} y2={y1} stroke={COLOR.red} strokeWidth="1.6" strokeDasharray="3 2" />
            <text x={col.c.x + col.c.w + 24} y={y1 + 3.5} textAnchor="middle" fill={COLOR.red} fontSize="11" fontWeight="900">✕</text>
          </g>
        );
      })}
      {clients.map((c, i) => {
        const mine = result && result.client === c.id;
        let fill = COLOR.surfaceRaised;
        if (mine) fill = tint(result.verdict === 'success' ? COLOR.success : COLOR.red, 14);
        let stroke = COLOR.border; let sw = 1.2;
        if (c.id === selected) { stroke = COLOR.blue; sw = 2.4; }
        if (hotId === c.id) { stroke = COLOR.red; sw = 2.6; }
        const hosts = (c.hosts || []).length;
        return <g key={c.id}>{box(col.c.x, clientY(i), col.c.w, c.name, cpt(c) || 'no DNS server', `${c.network === 'external' ? 'outside' : 'inside'}${hosts ? ` · hosts ${hosts}` : ''}`, { fill, stroke, sw })}</g>;
      })}
      {resolvers.map((rs, j) => {
        const cached = pgDnsCacheRows(st, rs.id).length;
        const hot = hotId === rs.id;
        return (
          <g key={rs.id}>
            {box(col.r.x, resolverY(j), col.r.w, rs.name, rs.online ? rs.ip : `${rs.ip} · off`, `${rs.network === 'external' ? 'outside' : 'inside'} · ${cached} cached`, { stroke: hot ? COLOR.red : rs.online ? COLOR.teal : COLOR.red, sw: hot ? 2.6 : 1.8 })}
          </g>
        );
      })}
      {box(col.a.x, authY, col.a.w, auth.name || 'Zone server', auth.online ? auth.ip : `${auth.ip} · off`, auth.splitHorizon ? 'split-horizon' : 'no cache', { stroke: authHot ? COLOR.red : auth.online ? COLOR.gold : COLOR.red, sw: authHot ? 2.6 : 2, line3: auth.splitHorizon ? ink(COLOR.gold) : null })}
      {topo.clients.length > MAX_CLIENTS && <text x={col.c.x + col.c.w / 2} y={H - 3} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{`+${topo.clients.length - MAX_CLIENTS} more clients`}</text>}
    </svg>
  );
}

/* ---------- small controls ---------- */

function PgDnsHot({ on, children }) {
  return <div style={{ outline: on ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '10px', minWidth: 0 }}>{children}</div>;
}

function PgDnsToggle({ label, hint, value, onChange, hot }) {
  return (
    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${COLOR.border}`, outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px', minHeight: '36px' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: COLOR.primary, flexShrink: 0 }} />
      <span><span style={{ fontSize: '13.5px', fontWeight: 800, display: 'block' }}>{label}</span><span style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.45 }}>{hint}</span></span>
    </label>
  );
}

function PgDnsIp({ label, value, onChange, hot, hint, placeholder }) {
  const text = String(value == null ? '' : value);
  const bad = text.trim() !== '' && pgParseIPv4(text) === null;
  return (
    <PgDnsHot on={hot}>
      <PgField label={label} value={text} onChange={onChange} error={bad ? 'Not a valid IPv4 address' : undefined} hint={hint} placeholder={placeholder} inputMode="decimal" />
    </PgDnsHot>
  );
}

// A comma separated list kept as an array, with the typed text kept locally so a trailing comma survives typing.
function PgDnsListField({ label, value, onChange, placeholder, hint }) {
  const joined = (value || []).join(', ');
  const [raw, setRaw] = useState(joined);
  useEffect(() => { if (pgDnsSplitList(raw).join('|') !== (value || []).join('|')) setRaw(joined); }, [joined]);
  return <PgField label={label} value={raw} onChange={(v) => { setRaw(v); onChange(pgDnsSplitList(v)); }} placeholder={placeholder} hint={hint} />;
}

function PgDnsProblemBadge({ on }) {
  return on ? <span style={{ fontSize: '11px', fontWeight: 800, color: ink(COLOR.red) }}>● problem here</span> : null;
}

function PgDnsNote({ children }) {
  return <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>{children}</div>;
}

/* ---------- editors ---------- */

function PgDnsRecords({ topo, edit, listKey, diag, hotIds }) {
  const zone = topo.zone;
  const key = listKey === 'internal' ? 'internal' : 'records';
  const list = zone[key] || [];
  const setList = (l) => edit({ ...topo, zone: { ...zone, [key]: l } });
  const setRec = (i, patch) => setList(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const allIds = (zone.records || []).concat(zone.internal || []).map((r) => r.id);
  const nextId = () => { let n = allIds.length + 1; while (allIds.includes(`r${n}`)) n += 1; return `r${n}`; };
  const issues = pgDnsZoneIssues(topo, list);
  const zoneName = pgDnsLower(zone.name);
  const defaultIp = ((topo.machines || [])[0] || { ips: ['10.0.1.10'] }).ips[0] || '10.0.1.10';
  const hotRec = (r) => {
    if (!diag) return false;
    if (diag.recordId) return diag.recordId === r.id;
    if (diag.loop) return diag.loop.includes(pgDnsOwner(r.name, zoneName));
    if (diag.field === 'ttl') return hotIds.includes(r.id);
    return false;
  };
  return (
    <div>
      {issues.length > 0 && (
        <div style={{ padding: '8px 10px', borderRadius: '10px', border: `2px solid ${COLOR.red}`, background: tint(COLOR.red, 10), fontSize: '12.5px', lineHeight: 1.5, marginBottom: '10px' }}>
          <strong>The zone server would refuse this zone.</strong> {issues[0].text}
        </div>
      )}
      {list.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '8px' }}>No records yet.</div>}
      {list.map((r, i) => {
        const p = pgDnsRecordProblem(r, zoneName);
        const hot = hotRec(r);
        const ttl = pgDnsParseTtl(r.ttl);
        const ownerIssue = issues.find((x) => x.recordId === r.id);
        return (
          <div key={r.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot || ownerIssue ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
              <strong style={{ fontSize: '12.5px', ...pgDnsMono }}>{pgDnsClip(`${pgDnsShort(zoneName, pgDnsOwner(r.name, zoneName))} ${r.type}`, 30)}</strong>
              <button className="btn-flat" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Delete the ${r.name || 'blank'} ${r.type} record`} style={pgDnsDelBtn}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="Name" value={r.name} onChange={(v) => setRec(i, { name: v })} placeholder="www or @" error={p && p.field === 'name' ? p.text : undefined} />
              <PgSelect label="Type" value={r.type} onChange={(v) => setRec(i, v === 'MX' && r.pref == null ? { type: v, pref: 10 } : { type: v })} options={PG_DNS_TYPE_OPTIONS} />
            </div>
            {r.type === 'MX' && (
              <div style={{ marginTop: '8px' }}>
                <PgField label="Preference" value={String(r.pref == null ? '' : r.pref)} onChange={(v) => setRec(i, { pref: v.trim() === '' ? '' : Number(v) })} inputMode="numeric" error={p && p.field === 'pref' ? 'Whole number 0 to 65535' : undefined} hint="Lowest number is tried first." />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: '8px', marginTop: '8px' }}>
              <PgField label="Value" value={r.value} onChange={(v) => setRec(i, { value: v })}
                placeholder={r.type === 'A' ? '10.0.1.20' : r.type === 'AAAA' ? '2001:db8::1' : 'host name'}
                error={p && p.field === 'value' ? p.text : undefined}
                hint={r.type === 'CNAME' ? 'Alias for this name.' : r.type === 'MX' ? 'The mail host.' : undefined} />
              <PgDnsHot on={hot && diag && diag.field === 'ttl'}>
                <PgField label="TTL" value={String(r.ttl == null ? '' : r.ttl)} onChange={(v) => setRec(i, { ttl: v })} placeholder="5m, 1h"
                  error={p && p.field === 'ttl' ? p.text : undefined}
                  hint={ttl === null ? undefined : ttl === 0 ? 'not cached' : `= ${pgDnsDuration(ttl)}`} />
              </PgDnsHot>
            </div>
          </div>
        );
      })}
      <button className="btn-flat" style={pgDnsAddBtn}
        onClick={() => setList(list.concat([{ id: nextId(), name: 'new', type: 'A', value: defaultIp, ttl: 3600 }]))}>+ Add a record</button>
    </div>
  );
}

function PgDnsZoneServer({ topo, edit, diag }) {
  const auth = topo.auth;
  const setAuth = (patch) => edit({ ...topo, auth: { ...auth, ...patch } });
  const field = diag ? diag.field : null;
  return (
    <div>
      <PgDnsNote>The authoritative server holds the zone <strong style={pgDnsMono}>{pgDnsLower(topo.zone.name)}</strong> and answers for it. It does not cache: it is the source of the answers. A name with no dot (such as <code>www</code>) is read as inside the zone; a name with a dot is taken as complete.</PgDnsNote>
      <PgDnsToggle label="Server is running" hint="Switch it off to see which lookups still work from the resolvers' caches." value={auth.online} onChange={(v) => setAuth({ online: v })} hot={field === 'auth-online'} />
      <PgDnsToggle label="Split-horizon DNS" hint="Give inside resolvers a separate, internal copy of the zone, and everyone else the public copy." value={auth.splitHorizon} onChange={(v) => setAuth({ splitHorizon: v })} hot={field === 'split'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
        <PgDnsIp label="Server address" value={auth.ip} onChange={(v) => setAuth({ ip: v })} />
        <PgDnsHot on={field === 'negative-ttl'}>
          <PgField label="Negative TTL" value={String(topo.zone.negativeTtl == null ? '' : topo.zone.negativeTtl)} onChange={(v) => edit({ ...topo, zone: { ...topo.zone, negativeTtl: v } })} placeholder="300, 5m"
            error={pgDnsParseTtl(topo.zone.negativeTtl) === null ? 'Use seconds or 5m, 1h' : undefined} hint="How long a resolver remembers 'no such name' (the SOA minimum, RFC 2308)." />
        </PgDnsHot>
      </div>
    </div>
  );
}

function PgDnsResolvers({ topo, edit, diag }) {
  const list = topo.resolvers;
  const setList = (l) => edit({ ...topo, resolvers: l });
  const setRes = (i, patch) => setList(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const nextId = () => { let n = list.length + 1; while (list.some((r) => r.id === `res${n}`)) n += 1; return n; };
  return (
    <div>
      <PgDnsNote>A resolver (recursive server) answers the clients' questions. It keeps every answer in its cache until the TTL runs out, so the next client is answered without asking the zone server. Each resolver has its own cache.</PgDnsNote>
      {list.map((rs, i) => {
        const hot = !!diag && diag.deviceId === rs.id;
        return (
          <div key={rs.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
              <strong style={{ fontSize: '12.5px' }}>{pgDnsClip(rs.name || 'Resolver', 26)}</strong>
              <button className="btn-flat" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${rs.name}`} style={pgDnsDelBtn}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="Name" value={rs.name} onChange={(v) => setRes(i, { name: v })} />
              <PgDnsIp label="Address" value={rs.ip} onChange={(v) => setRes(i, { ip: v })} />
            </div>
            <div style={{ marginTop: '8px' }}>
              <PgSelect label="Where it lives" value={rs.network} onChange={(v) => setRes(i, { network: v })} options={PG_DNS_NET_OPTIONS} />
            </div>
            <PgDnsToggle label="Running" hint="Off: every client of this resolver gets no answer." value={rs.online} onChange={(v) => setRes(i, { online: v })} hot={hot && diag.field === 'resolver-online'} />
            <PgDnsToggle label="Can ask the zone server" hint="Off: it has no forwarder or path to the zone, so it answers SERVFAIL when its cache has nothing." value={rs.upstream === 'auth'} onChange={(v) => setRes(i, { upstream: v ? 'auth' : '' })} hot={hot && diag.field === 'upstream'} />
          </div>
        );
      })}
      <button className="btn-flat" style={pgDnsAddBtn}
        onClick={() => { const n = nextId(); setList(list.concat([{ id: `res${n}`, name: `Resolver ${n}`, ip: '', online: true, upstream: 'auth', network: 'internal' }])); }}>+ Add a resolver</button>
    </div>
  );
}

function PgDnsClients({ topo, edit, diag }) {
  const list = topo.clients;
  const setList = (l) => edit({ ...topo, clients: l });
  const setCl = (i, patch) => setList(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const nextId = () => { let n = list.length + 1; while (list.some((c) => c.id === `c${n}`)) n += 1; return n; };
  const zoneName = pgDnsLower(topo.zone.name);
  return (
    <div>
      <PgDnsNote>Each client sends its questions to the DNS server in its own settings (normally handed out by DHCP). Most systems also read a local hosts file before they ask any DNS server, and a matching line wins. These clients keep no cache of their own, although real browsers and operating systems do.</PgDnsNote>
      {list.map((c, i) => {
        const hot = !!diag && diag.deviceId === c.id;
        const hosts = c.hosts || [];
        const setHosts = (h) => setCl(i, { hosts: h });
        return (
          <div key={c.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
              <strong style={{ fontSize: '12.5px' }}>{pgDnsClip(c.name || 'Client', 26)}</strong>
              <button className="btn-flat" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${c.name}`} style={pgDnsDelBtn}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="Name" value={c.name} onChange={(v) => setCl(i, { name: v })} />
              <PgSelect label="Where it is" value={c.network} onChange={(v) => setCl(i, { network: v })} options={PG_DNS_NET_OPTIONS} />
            </div>
            <div style={{ marginTop: '8px' }}>
              <PgDnsIp label="DNS server" value={c.dns} onChange={(v) => setCl(i, { dns: v })} hot={hot && diag.field === 'client-dns'} hint="The address the client sends its questions to." placeholder="none" />
            </div>
            <PgDnsHot on={hot && diag.field === 'hosts'}>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Hosts file</div>
                {hosts.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted }}>Empty: DNS decides everything for this client.</div>}
                {hosts.map((h, k) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 36px', gap: '6px', alignItems: 'end', marginBottom: '6px' }}>
                    <PgField label="Name" value={h.name} onChange={(v) => setHosts(hosts.map((x, m) => (m === k ? { ...x, name: v } : x)))} placeholder={`www.${zoneName}`} />
                    <PgDnsIp label="Address" value={h.ip} onChange={(v) => setHosts(hosts.map((x, m) => (m === k ? { ...x, ip: v } : x)))} />
                    <button className="btn-flat" onClick={() => setHosts(hosts.filter((_, m) => m !== k))} aria-label={`Delete hosts line ${k + 1}`} style={{ ...pgDnsDelBtn, marginBottom: '2px' }}>✕</button>
                  </div>
                ))}
                <button className="btn-flat" style={pgDnsAddBtn} onClick={() => setHosts(hosts.concat([{ name: `www.${zoneName}`, ip: '10.0.1.20' }]))}>+ Add a hosts line</button>
              </div>
            </PgDnsHot>
          </div>
        );
      })}
      <button className="btn-flat" style={pgDnsAddBtn}
        onClick={() => { const n = nextId(); const res = topo.resolvers[0]; setList(list.concat([{ id: `c${n}`, name: `Client ${n}`, network: 'internal', dns: res ? res.ip : '', hosts: [] }])); }}>+ Add a client</button>
    </div>
  );
}

function PgDnsMachines({ topo, edit }) {
  const list = topo.machines || [];
  const setList = (l) => edit({ ...topo, machines: l });
  const setM = (i, patch) => setList(list.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const nextId = () => { let n = list.length + 1; while (list.some((m) => m.id === `m${n}`)) n += 1; return n; };
  return (
    <div>
      <PgDnsNote>The real servers behind the addresses. DNS only hands out an address: whether that address belongs to the right machine is up to the record. List what a machine serves to make a wrong address visible.</PgDnsNote>
      {list.map((m, i) => (
        <div key={m.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: COLOR.surface }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
            <strong style={{ fontSize: '12.5px' }}>{pgDnsClip(m.name || 'Server', 26)}</strong>
            <button className="btn-flat" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${m.name}`} style={pgDnsDelBtn}>✕</button>
          </div>
          <PgField label="Name" value={m.name} onChange={(v) => setM(i, { name: v })} />
          <div style={{ marginTop: '8px' }}>
            <PgDnsListField label="Addresses" value={m.ips} onChange={(v) => setM(i, { ips: v })} placeholder="10.0.1.20, 203.0.113.10" hint="Comma separated. A server with a public and an inside address lists both." />
          </div>
          <div style={{ marginTop: '8px' }}>
            <PgDnsListField label="Serves these names" value={m.serves} onChange={(v) => setM(i, { serves: v })} placeholder="www.example.com" hint="Leave empty for a machine that serves no name here." />
          </div>
        </div>
      ))}
      <button className="btn-flat" style={pgDnsAddBtn}
        onClick={() => { const n = nextId(); setList(list.concat([{ id: `m${n}`, name: `Server ${n}`, ips: [], serves: [] }])); }}>+ Add a server</button>
      <PgDnsToggle label="The firewall supports hairpin NAT" hint="Lets an inside client reach an inside server through its public address (also called NAT loopback). Without it that connection fails." value={topo.hairpin} onChange={(v) => edit({ ...topo, hairpin: v })} />
    </div>
  );
}

/* ---------- the result, the cache and the clock ---------- */

function PgDnsResult({ result, topo, onFlushRetry }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const warn = result.warning && (!result.diagnosis || result.warning.code !== result.diagnosis.code) ? result.warning : null;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4, flex: 1, minWidth: 0 }}>{result.summary}</span>
        {result.rcode && <span style={{ fontWeight: 800, fontSize: '10.5px', padding: '2px 7px', borderRadius: '999px', border: `1.5px solid ${hue}`, color: ink(hue), flexShrink: 0 }}>{result.rcode}</span>}
      </div>
      <PgDiagnosis diagnosis={result.diagnosis} heading="First thing that is wrong" />
      {result.diagnosis && ['stale-cache', 'negative-cache'].includes(result.diagnosis.code) && onFlushRetry && (
        <button className="btn-flat" onClick={() => onFlushRetry(result.diagnosis.deviceId)} style={{ ...pgPillStyle, minHeight: '38px', marginBottom: '10px', border: `2px solid ${COLOR.teal}`, color: ink(COLOR.teal) }}>
          Flush {pgDnsClip(((topo.resolvers || []).find((x) => x.id === result.diagnosis.deviceId) || { name: 'the cache' }).name, 22)} and look again
        </button>
      )}
      <PgDiagnosis diagnosis={warn} heading="Warning: it worked, but not cleanly" />
      {result.answers && result.answers.length > 0 && (
        <div style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `1.5px solid ${COLOR.border}`, background: COLOR.surface }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>The answer</div>
          {result.answers.map((a, i) => (
            <div key={i} style={{ fontSize: '12px', lineHeight: 1.5, wordBreak: 'break-word', ...pgDnsMono }}>
              {a.fromHosts ? `${a.name} → ${a.value}` : `${pgDnsClip(a.name, 40)} ${a.ttl} IN ${a.type} ${a.type === 'MX' ? `${a.pref} ` : ''}${a.value}`}
              <span style={{ fontFamily: 'inherit', color: COLOR.muted }}>{a.fromHosts ? '  (hosts file)' : a.fromCache ? '  (from the cache, TTL left)' : '  (fresh)'}</span>
            </div>
          ))}
        </div>
      )}
      <PgSteps steps={result.steps} />
    </div>
  );
}

function PgDnsClock({ topo, st, onAdvance, onFlush, onReset }) {
  const many = topo.resolvers.length > 1;
  const log = (st.log || []).slice(-8);
  return (
    <div>
      <PgDnsNote>
        Clock: <strong style={{ color: COLOR.text }}>{st.now === 0 ? 'start (0 min)' : pgDnsDuration(st.now)}</strong>. A resolver keeps each record until its TTL is used up, then drops it and asks the zone server next time. Changing a record in the zone does not change what a resolver already holds. Goal checks always start from an empty cache.
      </PgDnsNote>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {PG_DNS_ADVANCES.map((a) => (
          <button key={a.label} className="btn-flat" onClick={() => onAdvance(a.sec)} style={{ ...pgPillStyle, minHeight: '38px', border: `2px solid ${COLOR.teal}`, color: ink(COLOR.teal) }}>{a.label}</button>
        ))}
        <button className="btn-flat" onClick={onReset} style={{ ...pgPillStyle, minHeight: '38px' }}>Start over</button>
      </div>
      {topo.resolvers.map((rs) => {
        const rows = pgDnsCacheRows(st, rs.id);
        return (
          <div key={rs.id} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted }}>Cache of {pgDnsClip(rs.name, 24)}</div>
              <button className="btn-flat" onClick={() => onFlush(rs.id)} disabled={rows.length === 0} style={{ ...pgPillStyle, minHeight: '36px', opacity: rows.length === 0 ? 0.5 : 1 }}>{many ? `Flush ${pgDnsClip(rs.name, 14)}` : 'Flush cache'}</button>
            </div>
            {rows.length === 0 ? <div style={{ fontSize: '12.5px', color: COLOR.muted }}>Empty. Look a name up first.</div> : rows.map((row) => (
              <div key={row.key} style={{ padding: '6px 0', borderTop: `1px solid ${COLOR.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ minWidth: 0, wordBreak: 'break-word', fontSize: '12.5px' }}><strong style={pgDnsMono}>{row.name}</strong> <span style={{ fontSize: '11px', fontWeight: 800, color: ink(row.kind === 'rr' ? COLOR.blue : COLOR.orange) }}>{row.kind === 'rr' ? row.type : 'negative'}</span></span>
                  <span style={{ fontSize: '11.5px', color: COLOR.muted }}>{pgDnsDuration(row.ttlLeft)} left of {pgDnsDuration(row.ttl)}</span>
                </div>
                <div style={{ fontSize: '12px', color: COLOR.muted, wordBreak: 'break-word' }}>{row.text}</div>
                <div aria-hidden="true" style={{ height: '4px', borderRadius: '2px', background: COLOR.border, marginTop: '3px' }}>
                  <div style={{ height: '4px', borderRadius: '2px', background: row.kind === 'rr' ? COLOR.teal : COLOR.orange, width: `${Math.max(2, Math.min(100, (row.ttlLeft / Math.max(1, row.ttl)) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {log.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>What happened on the clock</div>
          <PgSteps steps={log.map((e) => ({ ok: e.ok, text: `[${e.t === 0 ? 'start' : `+${pgDnsDuration(e.t)}`}] ${e.text}` }))} />
        </div>
      )}
    </div>
  );
}

/* ---------- the lab ---------- */

function PgDnsLab({ topo, setTopo, goals }) {
  const zoneName = pgDnsLower(topo.zone.name);
  const [st, setSt] = useState(() => pgDnsNewState());
  const [result, setResult] = useState(null);
  const firstGoal = goals && goals.length ? goals[0] : null;
  const [clientPick, setClientPick] = useState(firstGoal ? firstGoal.client : '');
  const [qname, setQname] = useState(firstGoal ? firstGoal.name : `www.${zoneName}`);
  const [qtype, setQtype] = useState(firstGoal && firstGoal.type ? firstGoal.type : 'A');
  const clientId = topo.clients.some((c) => c.id === clientPick) ? clientPick : (topo.clients[0] || { id: '' }).id;
  const edit = (nt) => { setTopo(nt); setResult(null); };
  const diag = result ? result.diagnosis : null;
  const hotId = diag ? diag.deviceId : null;
  const hotIds = result && result.answers ? result.answers.map((a) => a.id).filter(Boolean) : [];
  const goalStates = (goals || []).map((g) => ({ g, r: pgDnsGoal(topo, g) }));
  const compute = () => pgDnsResolve(topo, st, clientId, qname, qtype);
  const advance = (sec) => { const a = pgDnsAdvance(topo, st, sec); setSt(a.state); setResult(null); };
  const flush = (id) => { setSt(pgDnsFlush(st, id)); setResult(null); };
  const flushRetry = (id) => {
    const st2 = pgDnsFlush(st, id);
    const res = pgDnsResolve(topo, st2, clientId, qname, qtype);
    setResult(res); setSt(res.state);
  };
  const replay = (g) => {
    const res = pgDnsGoal(topo, g);
    setClientPick(g.client); setQname(g.name); setQtype(g.type || 'A');
    setResult(res); setSt(res.state);
  };
  const names = [];
  (topo.zone.records || []).concat(topo.zone.internal || []).forEach((r) => { const n = pgDnsOwner(r.name, zoneName); if (!names.includes(n)) names.push(n); });
  const zoneHot = !!diag && ['zone-records', 'ttl', 'negative-ttl'].includes(diag.field) && !(diag.recordId && (topo.zone.internal || []).some((r) => r.id === diag.recordId));
  const internalHot = !!diag && (diag.field === 'internal-records' || (!!diag.recordId && (topo.zone.internal || []).some((r) => r.id === diag.recordId)));
  const machines = topo.machines || [];
  return (
    <div>
      <PgCard title="The network" hue={COLOR.blue}>
        <PgDnsDiagram topo={topo} st={st} selected={clientId} result={result} hotId={hotId} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = selected client</span> · <span style={{ color: ink(COLOR.success) }}>green = last lookup worked</span> · <span style={{ color: ink(COLOR.red) }}>red = problem</span>
        </div>
        {machines.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${COLOR.border}` }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>Servers behind the addresses</div>
            {machines.map((m) => (
              <div key={m.id} style={{ fontSize: '12px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                <strong>{m.name}</strong> <span style={{ ...pgDnsMono, color: COLOR.muted }}>{(m.ips || []).join(', ') || 'no address'}</span>
                <span style={{ color: COLOR.muted }}>{(m.serves || []).length ? ` · serves ${m.serves.join(', ')}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => {
            const met = r.verdict === g.verdict;
            const scripted = !!((g.script && g.script.length) || (g.setup && g.setup.length));
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', padding: '3px 0' }}>
                <span aria-hidden="true" style={{ fontWeight: 900, color: met ? ink(COLOR.success) : COLOR.muted }}>{met ? '✓' : '○'}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{g.label}</span>
                <button className="btn-flat" onClick={() => replay(g)} style={{ ...pgPillStyle, minHeight: '36px', padding: '4px 10px', fontSize: '11.5px' }}>{scripted ? 'Replay the story' : 'Try it'}</button>
              </div>
            );
          })}
        </PgCard>
      )}
      <PgCard title="Zone records" hue={COLOR.blue} collapsible right={<PgDnsProblemBadge on={zoneHot} />}>
        <PgDnsNote>The records of <strong style={pgDnsMono}>{zoneName}</strong>. A name is read as inside the zone unless it has a dot; <code>@</code> is the zone itself (the apex). TTL is how long resolvers may keep the record.</PgDnsNote>
        <PgDnsRecords topo={topo} edit={edit} listKey="records" diag={diag} hotIds={hotIds} />
      </PgCard>
      {topo.auth.splitHorizon && (
        <PgCard title="Internal view" hue={COLOR.gold} collapsible right={<PgDnsProblemBadge on={internalHot} />}>
          <PgDnsNote>Split-horizon is on: resolvers on the inside network are answered from this list instead of the zone records. Names missing here do not exist for the inside, even if they exist in the public zone.</PgDnsNote>
          <PgDnsRecords topo={topo} edit={edit} listKey="internal" diag={diag} hotIds={hotIds} />
        </PgCard>
      )}
      <PgCard title="Zone server" hue={COLOR.gold} collapsible defaultOpen={false} right={<PgDnsProblemBadge on={!!diag && ['auth-online', 'split'].includes(diag.field)} />}>
        <PgDnsZoneServer topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Resolvers" hue={COLOR.teal} collapsible defaultOpen={false} right={<PgDnsProblemBadge on={!!diag && ['resolver-online', 'upstream'].includes(diag.field)} />}>
        <PgDnsResolvers topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Clients and hosts files" hue={COLOR.pink} collapsible right={<PgDnsProblemBadge on={!!diag && ['client-dns', 'hosts'].includes(diag.field)} />}>
        <PgDnsClients topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Servers and firewall" hue={COLOR.orange} collapsible defaultOpen={false}>
        <PgDnsMachines topo={topo} edit={edit} />
      </PgCard>
      <PgCard title="Look up a name" hue={COLOR.success}>
        <div style={{ marginBottom: '10px' }}>
          <PgSelect label="Client" value={clientId} onChange={(v) => { setClientPick(v); setResult(null); }} options={topo.clients.map((c) => ({ value: c.id, label: c.name }))} />
        </div>
        <PgField label="Name" value={qname} onChange={(v) => { setQname(v); setResult(null); }} placeholder={`www.${zoneName}`} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0 10px' }}>
          {names.slice(0, 8).map((n) => (
            <button key={n} className="btn-flat" onClick={() => { setQname(n); setResult(null); }} style={{ ...pgPillStyle, minHeight: '36px', padding: '4px 10px', fontSize: '11.5px', ...pgDnsMono }}>{pgDnsShort(zoneName, n)}</button>
          ))}
        </div>
        <PgSegmented options={PG_DNS_TYPE_OPTIONS.map((o) => ({ key: o.value, label: o.label }))} value={qtype} onChange={(v) => { setQtype(v); setResult(null); }} hue={COLOR.blue} />
        <PgPredict compute={compute} causes={PG_DNS_CAUSES} buttonLabel="Look it up" onResult={(res) => { setResult(res); setSt(res.state); }} resetKey={JSON.stringify([topo, clientId, qname, qtype, st.now])} />
        <PgDnsResult result={result} topo={topo} onFlushRetry={flushRetry} />
      </PgCard>
      <PgCard title="Caches and the clock" hue={COLOR.teal}>
        <PgDnsClock topo={topo} st={st} onAdvance={advance} onFlush={flush} onReset={() => { setSt(pgDnsNewState()); setResult(null); }} />
      </PgCard>
    </div>
  );
}

function pgDnsValidTopo(t) {
  try {
    const isList = Array.isArray;
    const recOk = (r) => !!r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.type === 'string' && typeof r.value === 'string';
    return !!t && !!t.zone && typeof t.zone.name === 'string' && isList(t.zone.records) && t.zone.records.every(recOk) && isList(t.zone.internal || []) && (t.zone.internal || []).every(recOk)
      && !!t.auth && typeof t.auth.ip === 'string' && typeof t.auth.online === 'boolean'
      && isList(t.resolvers) && t.resolvers.every((r) => typeof r.id === 'string' && typeof r.ip === 'string' && (r.network === 'internal' || r.network === 'external'))
      && isList(t.clients) && t.clients.length >= 1 && t.clients.every((c) => typeof c.id === 'string' && typeof c.name === 'string' && (c.network === 'internal' || c.network === 'external') && isList(c.hosts || []))
      && isList(t.machines) && t.machines.every((m) => typeof m.id === 'string' && isList(m.ips) && isList(m.serves));
  } catch (e) { return false; }
}

function DnsTool({ pick, onPick }) {
  const scenarios = pgScenarios('dns');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="dns" makeDefault={() => pgClone(pgData().dnsSandbox)} validate={pgDnsValidTopo} onBack={() => onPick('')}
        blurb="A working company network for example.com: an inside resolver, a public resolver, split-horizon DNS and three clients. Break a record, point a client at the wrong server, add a hosts line, switch a server off and move the clock, then read the traces and the caches."
        renderLab={(topo, setTopo) => <PgDnsLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="dns" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgDnsGoal(topo, g).verdict === g.verdict)}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgDnsLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} />} />
    );
  }
  return (
    <PgScenarioPicker tool="dns" scenarios={scenarios} onPick={onPick}
      intro="DNS turns names into addresses. Make clients look up names and follow each step: the hosts file, the resolver's cache, the zone server. See why a lookup worked or failed, and move a virtual clock to watch records age out of the cache."
      note="Simplified on purpose: one zone (example.com) on one authoritative server, which the resolver asks directly instead of walking down from the root servers. Only A, AAAA, CNAME and MX records (no NS, SOA, TXT, PTR or wildcards); one negative TTL stands for the SOA minimum. No DNSSEC, retries or TCP fallback, and SERVFAIL answers are not cached. Clients keep no cache of their own (real browsers and operating systems do), and an invalid zone makes the whole zone answer SERVFAIL here, which real servers handle in different ways."
      sandboxText="A working DNS network with a split-horizon zone, two resolvers, a hosts file and a virtual clock." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'dns', label: 'DNS lab', hue: COLOR.blue,
  blurb: 'Records and TTLs, resolver caches and negative caching, CNAME rules, hosts files and split-horizon DNS. Look names up, read the trace, and move a virtual clock to watch the cache age.',
  Component: DnsTool,
});
