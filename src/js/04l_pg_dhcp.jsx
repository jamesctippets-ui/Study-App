/* ---------------- IT Playground: DHCP lab ---------------- */

// One router, one DHCP server with scopes, optional relay (ip helper-address),
// clients that run DORA, conflict detection and DECLINE, and lease timers on a
// virtual clock. The simulation is src/js/03c_pg_dhcp.js; guided scenarios come
// from data/playground_dhcp.py (PLAYGROUND.dhcp).

const PG_DHCP_CAUSES = {
  'pool-exhausted': 'The address pool has no free address left',
  'no-relay': 'The broadcast never crosses the router (no relay on that interface)',
  'relay-wrong-server': 'The relay forwards to an address that is not the DHCP server',
  'no-scope': 'The server has no scope for the client\'s subnet',
  'server-down': 'The DHCP server is offline',
  'address-conflict': 'The pool hands out an address that something else already uses',
  'bad-gateway-option': 'The scope hands out a gateway the client cannot use',
  'bad-dns-option': 'The scope hands out no working DNS server',
  'wrong-mask': 'The scope hands out the wrong subnet mask',
  'lease-expired': 'The lease ran out while the server could not be reached',
  'bad-config': 'A scope or server setting is not a valid value',
};

const PG_DHCP_PHASE_LABEL = { bound: 'Bound', renewing: 'Renewing', rebinding: 'Rebinding', expired: 'Expired', none: 'No lease', idle: 'Not asked yet', static: 'Static' };
const PG_DHCP_SEG_HUES = ['blue', 'orange', 'pink', 'teal'];

// Which diagnosis fields point at which scope input.
const PG_DHCP_FIELDS = {
  network: ['scope-network'], mask: ['scope-mask'], start: ['scope-pool', 'scope-start'], end: ['scope-pool', 'scope-end'],
  excluded: ['excluded', 'scope-excluded'], gateway: ['scope-gateway'], dns: ['scope-dns'], leaseHours: ['scope-lease'],
};

function pgDhcpClip(s, k) { const t = String(s == null ? '' : s); return t.length > k ? `${t.slice(0, k - 1)}…` : t; }

function PgDhcpDiagram({ topo, st, selected, hotId }) {
  const W = 320;
  const segs = topo.segments;
  const n = Math.max(1, segs.length);
  const colW = W / n;
  const cx = (i) => (i + 0.5) * colW;
  const srv = topo.server;
  const perRow = n === 1 ? 3 : 1;
  const pad = 8;
  const gap = 6;
  const boxW = (colW - 2 * pad - (perRow - 1) * gap) / perRow;
  const chars = Math.max(8, Math.floor((boxW - 8) / 5.2));
  const devicesOf = (segId) => {
    const list = [];
    if (srv.segment === segId) list.push({ id: 'server', kind: 'server' });
    topo.hosts.filter((h) => h.segment === segId).forEach((h) => list.push({ id: h.id, kind: 'host', host: h }));
    return list;
  };
  const rows = Math.max(1, ...segs.map((s) => Math.ceil(devicesOf(s.id).length / perRow)));
  const top = 108;
  const H = top + rows * 38 + 2;
  const routerHot = hotId === 'router';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="DHCP network diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      <rect x={102} y={4} width={116} height={32} rx="8" fill={COLOR.surfaceRaised} stroke={routerHot ? COLOR.red : COLOR.muted} strokeWidth={routerHot ? 2.4 : 1.4} />
      <text x={160} y={18} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="700">{pgDhcpClip(topo.router.name || 'Router', 18)}</text>
      <text x={160} y={30} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">router{(topo.router.ifaces || []).some((f) => String(f.helper || '').trim()) ? ' · relay' : ''}</text>
      {segs.map((s, i) => {
        const hue = COLOR[s.id === srv.segment ? 'gold' : PG_DHCP_SEG_HUES[i % PG_DHCP_SEG_HUES.length]];
        const iface = pgDhcpIface(topo, s.id);
        const prefix = iface ? pgParseMask(iface.mask).prefix : undefined;
        const helper = iface ? String(iface.helper || '').trim() : '';
        const relayText = s.id === srv.segment ? 'DHCP server here' : !iface ? 'no router' : helper ? `relay → ${helper}` : 'no relay';
        const devs = devicesOf(s.id);
        return (
          <g key={s.id}>
            <line x1={160} y1={36} x2={cx(i)} y2={58} stroke={hue} strokeWidth="1.6" />
            <rect x={i * colW + 3} y={58} width={colW - 6} height={H - 62} rx="10" fill={tint(hue, 8)} stroke={hue} strokeWidth="1.2" strokeDasharray="4 3" />
            <text x={cx(i)} y={72} textAnchor="middle" fill={ink(hue)} fontSize="9.5" fontWeight="800">{pgDhcpClip(s.label.toUpperCase(), Math.floor((colW - 10) / 5.6))}</text>
            <text x={cx(i)} y={83} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{iface ? `${iface.ip}${prefix !== undefined ? `/${prefix}` : ''}` : 'no router link'}</text>
            <text x={cx(i)} y={94} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{pgDhcpClip(relayText, Math.floor((colW - 10) / 4.6))}</text>
            {devs.map((d, k) => {
              const col = k % perRow;
              const row = Math.floor(k / perRow);
              const x = i * colW + pad + col * (boxW + gap);
              const y = top + row * 38;
              let name; let sub; let fill = COLOR.surfaceRaised; let stroke = COLOR.border; let sw = 1.2;
              if (d.kind === 'server') {
                name = srv.name || 'DHCP server';
                sub = srv.online ? srv.ip : `${srv.ip} · off`;
                stroke = srv.online ? COLOR.gold : COLOR.red;
                sw = 2;
              } else {
                const h = d.host;
                name = h.name;
                if (h.mode === 'static') sub = h.ip || 'static';
                else {
                  const stt = pgDhcpStatus(topo, st, h.id);
                  sub = stt.lease ? stt.lease.ip : stt.phase === 'idle' ? 'DHCP client' : 'no address';
                  if (stt.lease && stt.verdict === 'success') fill = tint(COLOR.success, 14);
                  else if (stt.phase !== 'idle') fill = tint(COLOR.red, 12);
                }
                if (h.id === selected) { stroke = COLOR.blue; sw = 2.4; }
              }
              if (hotId === d.id) { stroke = COLOR.red; sw = 2.6; }
              return (
                <g key={d.id}>
                  <rect x={x} y={y} width={boxW} height={34} rx="7" fill={fill} stroke={stroke} strokeWidth={sw} />
                  <text x={x + boxW / 2} y={y + 14} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="700">{pgDhcpClip(name, chars)}</text>
                  <text x={x + boxW / 2} y={y + 26} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{pgDhcpClip(sub, chars + 2)}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function PgDhcpHot({ on, children }) {
  return <div style={{ outline: on ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '10px', minWidth: 0 }}>{children}</div>;
}

function PgDhcpToggle({ label, hint, value, onChange, hot }) {
  return (
    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${COLOR.border}`, outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px', minHeight: '36px' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: COLOR.primary, flexShrink: 0 }} />
      <span><span style={{ fontSize: '13.5px', fontWeight: 800, display: 'block' }}>{label}</span><span style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.45 }}>{hint}</span></span>
    </label>
  );
}

function PgDhcpIp({ label, value, onChange, hot, hint, placeholder }) {
  const text = String(value == null ? '' : value);
  const bad = text.trim() !== '' && pgParseIPv4(text) === null;
  return (
    <PgDhcpHot on={hot}>
      <PgField label={label} value={text} onChange={onChange} error={bad ? 'Not a valid IPv4 address' : undefined} hint={hint} placeholder={placeholder} inputMode="decimal" />
    </PgDhcpHot>
  );
}

function PgDhcpMask({ label, value, onChange, hot }) {
  const text = String(value == null ? '' : value);
  const bad = text.trim() === '' || pgParseMask(text).prefix === undefined;
  return (
    <PgDhcpHot on={hot}>
      <PgField label={label} value={text} onChange={onChange} error={bad ? 'Not a valid mask' : undefined} placeholder="255.255.255.0" inputMode="decimal" />
    </PgDhcpHot>
  );
}

const pgDhcpAddBtn = { fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' };
const pgDhcpDelBtn = { width: '36px', height: '36px', color: COLOR.muted, flexShrink: 0 };

function PgDhcpServerEditor({ topo, edit, diag }) {
  const srv = topo.server;
  const setSrv = (patch) => edit({ ...topo, server: { ...srv, ...patch } });
  return (
    <div>
      <PgDhcpToggle label="Server is running" hint="Switch it off to simulate a crash or maintenance. Clients that already have a lease keep working until it runs out." value={srv.online} onChange={(v) => setSrv({ online: v })} hot={diag && diag.field === 'server-online'} />
      <PgDhcpToggle label="Conflict detection" hint="Before offering an address the server pings it. If something answers, the address is marked in use and skipped." value={srv.conflictDetection} onChange={(v) => setSrv({ conflictDetection: v })} />
      <div style={{ marginTop: '8px' }}>
        <PgDhcpIp label="Server address" value={srv.ip} onChange={(v) => setSrv({ ip: v })} hot={diag && diag.field === 'server-ip'} />
      </div>
    </div>
  );
}

function PgDhcpScopes({ topo, edit, diag }) {
  const scopes = topo.server.scopes;
  const setScopes = (list) => edit({ ...topo, server: { ...topo.server, scopes: list } });
  const setScope = (i, patch) => setScopes(scopes.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const isHot = (sc, key) => !!diag && (PG_DHCP_FIELDS[key] || []).includes(diag.field) && (!diag.scopeId || diag.scopeId === sc.id);
  const nextId = () => { let n = scopes.length + 1; while (scopes.some((s) => s.id === `s${n}`)) n += 1; return `s${n}`; };
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>A scope is the set of settings the server hands out for one subnet. For a relayed request the server picks the scope that contains the giaddr (the router interface address); for a local request, the one containing its own address.</div>
      {scopes.map((sc, i) => {
        const parsed = pgDhcpScope(sc);
        const size = pgDhcpPoolSize(parsed);
        const hotAny = !!diag && diag.scopeId === sc.id;
        return (
          <div key={sc.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hotAny ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
              <strong style={{ fontSize: '12.5px' }}>Scope {i + 1}: {pgDhcpClip(sc.name || 'unnamed', 22)}</strong>
              <button className="btn-flat" onClick={() => setScopes(scopes.filter((_, j) => j !== i))} aria-label={`Delete scope ${i + 1}`} style={pgDhcpDelBtn}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="Name" value={sc.name} onChange={(v) => setScope(i, { name: v })} />
              <PgDhcpIp label="Network" value={sc.network} onChange={(v) => setScope(i, { network: v })} hot={isHot(sc, 'network')} placeholder="192.168.10.0" />
              <PgDhcpMask label="Mask" value={sc.mask} onChange={(v) => setScope(i, { mask: v })} hot={isHot(sc, 'mask')} />
              <PgField label="Lease (hours)" value={String(sc.leaseHours)} onChange={(v) => setScope(i, { leaseHours: v })} inputMode="decimal" error={parsed.errors.includes('lease') ? 'Use a number of hours' : undefined} />
              <PgDhcpIp label="Pool start" value={sc.start} onChange={(v) => setScope(i, { start: v })} hot={isHot(sc, 'start')} />
              <PgDhcpIp label="Pool end" value={sc.end} onChange={(v) => setScope(i, { end: v })} hot={isHot(sc, 'end')} />
            </div>
            <div style={{ fontSize: '11.5px', color: COLOR.muted, margin: '4px 0 8px' }}>The pool holds {size} usable address{size === 1 ? '' : 'es'} (inside the network, minus exclusions).</div>
            <PgDhcpHot on={isHot(sc, 'excluded')}>
              <PgField label="Excluded addresses" value={sc.excluded} onChange={(v) => setScope(i, { excluded: v })} placeholder="192.168.10.1, 192.168.10.20-192.168.10.29" hint="Addresses the server must never hand out (comma separated, ranges with a dash)." error={parsed.errors.includes('excluded') ? 'Use addresses or ranges like 10.0.0.1-10.0.0.9' : undefined} />
            </PgDhcpHot>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
              <PgDhcpIp label="Default gateway" value={sc.gateway} onChange={(v) => setScope(i, { gateway: v })} hot={isHot(sc, 'gateway')} />
              <PgDhcpIp label="DNS server" value={sc.dns} onChange={(v) => setScope(i, { dns: v })} hot={isHot(sc, 'dns')} />
            </div>
          </div>
        );
      })}
      <button className="btn-flat" style={pgDhcpAddBtn}
        onClick={() => setScopes([...scopes, { id: nextId(), name: 'New scope', network: '', mask: '255.255.255.0', start: '', end: '', excluded: '', gateway: '', dns: '', leaseHours: 8 }])}>+ Add a scope</button>
    </div>
  );
}

function PgDhcpRouterEditor({ topo, edit, diag }) {
  const ifaces = topo.router.ifaces;
  const setIface = (i, patch) => edit({ ...topo, router: { ...topo.router, ifaces: ifaces.map((f, j) => (j === i ? { ...f, ...patch } : f)) } });
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>A router does not forward broadcasts. A helper address (relay agent, <code>ip helper-address</code>) makes an interface pass DHCP broadcasts on as unicast to that address. It belongs on the interface the clients are connected to.</div>
      {ifaces.map((f, i) => {
        const hot = !!diag && diag.field === 'helper' && (!diag.segment || diag.segment === f.segment);
        return (
          <div key={f.segment} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>Interface facing {pgDhcpSegLabel(topo, f.segment)}</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgDhcpIp label="Interface address" value={f.ip} onChange={(v) => setIface(i, { ip: v })} />
              <PgDhcpMask label="Mask" value={f.mask} onChange={(v) => setIface(i, { mask: v })} />
            </div>
            <div style={{ marginTop: '8px' }}>
              <PgDhcpIp label="Helper address (relay)" value={f.helper} onChange={(v) => setIface(i, { helper: v })} hot={hot} hint="Leave empty for no relay." placeholder="none" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PgDhcpHostsEditor({ topo, edit }) {
  const hosts = topo.hosts;
  const setHosts = (list) => edit({ ...topo, hosts: list });
  const setHost = (i, patch) => setHosts(hosts.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const segOpts = topo.segments.map((s) => ({ value: s.id, label: s.label }));
  const clientSeg = (topo.segments.find((s) => s.id !== topo.server.segment) || topo.segments[0]).id;
  const nextId = () => { let n = hosts.length + 1; while (hosts.some((h) => h.id === `h${n}`)) n += 1; return n; };
  const macFor = (n) => `aa:00:00:00:99:${String(n).padStart(2, '0')}`;
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>DHCP clients ask the server for an address. Static devices have their address typed in by hand, which is how conflicts with the pool happen. A client that does not probe with ARP cannot notice a clash.</div>
      {hosts.map((h, i) => (
        <div key={h.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: COLOR.surface }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
            <strong style={{ fontSize: '12.5px' }}>{pgDhcpClip(h.name, 24)}</strong>
            <button className="btn-flat" onClick={() => setHosts(hosts.filter((_, j) => j !== i))} aria-label={`Remove ${h.name}`} style={pgDhcpDelBtn}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            <PgSelect label="Network" value={h.segment} onChange={(v) => setHost(i, { segment: v })} options={segOpts} />
            <PgSelect label="Address from" value={h.mode} onChange={(v) => setHost(i, { mode: v })} options={[{ value: 'dhcp', label: 'DHCP' }, { value: 'static', label: 'Typed in (static)' }]} />
          </div>
          {h.mode === 'dhcp' ? (
            <div style={{ marginTop: '4px' }}>
              <PgDhcpToggle label="Checks the address with ARP first" hint={`Before using an offered address the client asks the network who has it, and declines it if someone answers. MAC ${h.mac || 'none'}.`} value={h.probe !== false} onChange={(v) => setHost(i, { probe: v })} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
              <PgDhcpIp label="Address" value={h.ip} onChange={(v) => setHost(i, { ip: v })} />
              <PgDhcpMask label="Mask" value={h.mask} onChange={(v) => setHost(i, { mask: v })} />
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button className="btn-flat" style={pgDhcpAddBtn}
          onClick={() => { const n = nextId(); setHosts([...hosts, { id: `h${n}`, name: `Client ${n}`, segment: clientSeg, mode: 'dhcp', mac: macFor(n), probe: true, ip: '', mask: '', gateway: '' }]); }}>+ Add a DHCP client</button>
        <button className="btn-flat" style={pgDhcpAddBtn}
          onClick={() => { const n = nextId(); setHosts([...hosts, { id: `h${n}`, name: `Device ${n}`, segment: clientSeg, mode: 'static', mac: '', probe: true, ip: '', mask: '255.255.255.0', gateway: '' }]); }}>+ Add a static device</button>
      </div>
    </div>
  );
}

function PgDhcpResult({ result }) {
  const [open, setOpen] = useState({});
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const warn = result.warning && result.warning !== result.diagnosis ? result.warning : null;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      <PgDiagnosis diagnosis={result.diagnosis} heading="First thing that is wrong" />
      <PgDiagnosis diagnosis={warn} heading="Warning: it worked, but not cleanly" />
      {result.parts ? (
        <div>
          {result.parts.map((p) => (
            <div key={p.id} style={{ marginBottom: '6px', borderRadius: '10px', border: `1.5px solid ${COLOR.border}`, background: COLOR.surface }}>
              <button className="btn-flat" onClick={() => setOpen({ ...open, [p.id]: !open[p.id] })} aria-expanded={!!open[p.id]}
                style={{ display: 'flex', width: '100%', gap: '8px', textAlign: 'left', padding: '8px 10px', minHeight: '36px', alignItems: 'baseline', color: COLOR.text }}>
                <span aria-hidden="true" style={{ fontWeight: 900, color: p.verdict === 'success' ? ink(COLOR.success) : ink(COLOR.red) }}>{p.verdict === 'success' ? '✓' : '✕'}</span>
                <span style={{ fontSize: '12.5px', lineHeight: 1.45, flex: 1 }}>{p.summary}</span>
                <span aria-hidden="true" style={{ fontSize: '12px', color: COLOR.muted }}>{open[p.id] ? '▾' : '▸'}</span>
              </button>
              {open[p.id] && <div style={{ padding: '0 10px 8px' }}><PgSteps steps={p.steps} /></div>}
            </div>
          ))}
          <div style={{ fontSize: '11.5px', color: COLOR.muted }}>Tap a client to read its DORA trace.</div>
        </div>
      ) : <PgSteps steps={result.steps} />}
    </div>
  );
}

const PG_DHCP_ADVANCES = [{ label: '+10 min', sec: 600 }, { label: '+1 hour', sec: 3600 }, { label: '+8 hours', sec: 8 * 3600 }, { label: '+1 day', sec: 86400 }];

function PgDhcpClock({ topo, st, onAdvance, onReset }) {
  const clients = topo.hosts.filter((h) => h.mode === 'dhcp');
  const leases = Object.keys(st.leases).filter((ip) => st.leases[ip].end > st.now).sort((a, b) => pgParseIPv4(a) - pgParseIPv4(b));
  const nameOfMac = (l) => { const h = pgDhcpHost(topo, l.client); return h ? h.name : l.client; };
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>
        Clock: <strong style={{ color: COLOR.text }}>{st.now === 0 ? 'start (0 min)' : pgDhcpDuration(st.now)}</strong>. Leases renew at T1 (50% of the lease), rebind at T2 (87.5%) and expire at 100%. Leases stay when you change a setting, as on a real network; "Start over" clears them.
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {PG_DHCP_ADVANCES.map((a) => (
          <button key={a.label} className="btn-flat" onClick={() => onAdvance(a.sec)} style={{ ...pgPillStyle, minHeight: '38px', border: `2px solid ${COLOR.teal}`, color: ink(COLOR.teal) }}>{a.label}</button>
        ))}
        <button className="btn-flat" onClick={onReset} style={{ ...pgPillStyle, minHeight: '38px' }}>Start over</button>
      </div>
      {clients.map((h) => {
        const s = pgDhcpStatus(topo, st, h.id);
        const hue = s.phase === 'bound' && s.verdict === 'success' ? COLOR.success : s.phase === 'renewing' || s.phase === 'rebinding' ? COLOR.orange : s.phase === 'idle' ? COLOR.muted : COLOR.red;
        return (
          <div key={h.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', padding: '6px 0', borderTop: `1px solid ${COLOR.border}`, fontSize: '12.5px' }}>
            <span style={{ minWidth: 0 }}><strong>{h.name}</strong> <span style={{ color: COLOR.muted }}>{s.lease ? s.text : s.phase === 'idle' ? '' : 'no address'}</span></span>
            <span style={{ fontWeight: 800, fontSize: '11.5px', padding: '2px 8px', borderRadius: '999px', border: `1.5px solid ${hue}`, color: ink(hue) }}>
              {PG_DHCP_PHASE_LABEL[s.phase] || s.phase}{s.lease && s.verdict === 'failed' ? ' · settings fail' : ''}
            </span>
            {s.lease && <span style={{ flexBasis: '100%', color: COLOR.muted, fontSize: '11.5px' }}>{s.nextKind} in {pgDhcpDuration(s.nextIn)} · lease ends in {pgDhcpDuration(s.expiresIn)}</span>}
          </div>
        );
      })}
      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, margin: '12px 0 4px' }}>Leases the server holds</div>
      {leases.length === 0 ? <div style={{ fontSize: '12.5px', color: COLOR.muted }}>None yet. Ask for addresses first.</div> : leases.map((ip) => (
        <div key={ip} style={{ fontSize: '12.5px', padding: '2px 0', display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <span><strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>{ip}</strong> <span style={{ color: COLOR.muted }}>{nameOfMac(st.leases[ip])}</span></span>
          <span style={{ color: COLOR.muted }}>{pgDhcpDuration(st.leases[ip].end - st.now)} left</span>
        </div>
      ))}
      {st.log.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>What happened on the clock</div>
          <PgSteps steps={st.log.slice(-10).map((e) => ({ ok: e.ok, text: `[${e.t === 0 ? 'start' : `+${pgDhcpDuration(e.t)}`}] ${e.text}` }))} />
        </div>
      )}
    </div>
  );
}

function PgDhcpLab({ topo, setTopo, goals }) {
  const [st, setSt] = useState(() => pgDhcpNewState());
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState('__all');
  const dhcpHosts = topo.hosts.filter((h) => h.mode === 'dhcp');
  const pickedId = selected === '__all' || dhcpHosts.some((h) => h.id === selected) ? selected : '__all';
  const edit = (nt) => { setTopo(nt); setResult(null); };
  const diag = result ? result.diagnosis : null;
  const hotId = diag ? diag.deviceId : null;
  const goalStates = (goals || []).map((g) => ({ g, r: pgDhcpGoal(topo, g) }));
  const compute = () => (pickedId === '__all' ? pgDhcpRunAll(topo, null) : pgDhcpDora(topo, st, pickedId));
  const advance = (sec) => { const a = pgDhcpAdvance(topo, st, sec); setSt(a.state); };
  const options = [{ value: '__all', label: 'Everyone asks (fresh start)' }].concat(dhcpHosts.map((h) => ({ value: h.id, label: h.name })));
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgDhcpDiagram topo={topo} st={st} selected={pickedId} hotId={hotId} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = selected client</span> · <span style={{ color: ink(COLOR.success) }}>green = working lease</span> · <span style={{ color: ink(COLOR.red) }}>red = problem</span>
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => {
            const met = r.verdict === g.verdict;
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
                <span aria-hidden="true" style={{ fontWeight: 900, color: met ? ink(COLOR.success) : COLOR.muted }}>{met ? '✓' : '○'}</span>
                <span>{g.label}</span>
              </div>
            );
          })}
        </PgCard>
      )}
      <PgCard title="DHCP server" hue={COLOR.gold} collapsible>
        <PgDhcpServerEditor topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Scopes" hue={COLOR.blue} collapsible>
        <PgDhcpScopes topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Router and relay" hue={COLOR.orange} collapsible>
        <PgDhcpRouterEditor topo={topo} edit={edit} diag={diag} />
      </PgCard>
      <PgCard title="Devices" hue={COLOR.pink} collapsible defaultOpen={false}>
        <PgDhcpHostsEditor topo={topo} edit={edit} />
      </PgCard>
      <PgCard title="Ask for an address" hue={COLOR.success}>
        <div style={{ marginBottom: '10px' }}>
          <PgSelect label="Client" value={pickedId} onChange={(v) => { setSelected(v); setResult(null); }} options={options} />
        </div>
        <PgPredict compute={compute} causes={PG_DHCP_CAUSES} buttonLabel={pickedId === '__all' ? 'Everyone asks for an address' : 'Run DORA for this client'} onResult={(res) => { setResult(res); setSt(res.state); }} resetKey={JSON.stringify([topo, pickedId])} />
        <PgDhcpResult result={result} />
      </PgCard>
      <PgCard title="Leases and the clock" hue={COLOR.teal}>
        <PgDhcpClock topo={topo} st={st} onAdvance={advance} onReset={() => setSt(pgDhcpNewState())} />
      </PgCard>
    </div>
  );
}

function pgDhcpValidTopo(t) {
  try {
    return !!t && Array.isArray(t.segments) && t.segments.length >= 1 && t.segments.every((s) => typeof s.id === 'string' && typeof s.label === 'string')
      && !!t.router && Array.isArray(t.router.ifaces) && t.router.ifaces.every((f) => typeof f.segment === 'string' && typeof f.ip === 'string' && typeof f.mask === 'string')
      && !!t.server && typeof t.server.ip === 'string' && typeof t.server.segment === 'string' && Array.isArray(t.server.scopes)
      && t.server.scopes.every((s) => typeof s.id === 'string' && typeof s.network === 'string' && typeof s.mask === 'string')
      && Array.isArray(t.hosts) && t.hosts.every((h) => typeof h.id === 'string' && typeof h.name === 'string' && (h.mode === 'dhcp' || h.mode === 'static') && t.segments.some((s) => s.id === h.segment))
      && t.segments.some((s) => s.id === t.server.segment);
  } catch (e) { return false; }
}

function DhcpTool({ pick, onPick }) {
  const scenarios = pgScenarios('dhcp');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="dhcp" makeDefault={() => pgClone(pgData().dhcpSandbox)} validate={pgDhcpValidTopo} onBack={() => onPick('')}
        blurb="A working network: Office and Sales relay to a DHCP server on the Server LAN. Break a scope, move a relay, put a static device in the pool, switch the server off and move the clock, then read the DORA traces."
        renderLab={(topo, setTopo) => <PgDhcpLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="dhcp" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgDhcpGoal(topo, g).verdict === g.verdict)}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgDhcpLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} />} />
    );
  }
  return (
    <PgScenarioPicker tool="dhcp" scenarios={scenarios} onPick={onPick}
      intro="DHCP gives a device its address, mask, gateway and DNS server for a limited time. Make clients ask (Discover, Offer, Request, Acknowledge), read what the server decided and why, and move a virtual clock to watch leases renew and expire."
      note="Simplified on purpose: one router and one DHCP server (no failover, no snooping, no IPv6), only the mask, gateway, DNS and lease-time options, one attempt stands for the retries, the pause after a DECLINE is not simulated, and servers differ in details such as whether conflict detection is on by default."
      sandboxText="A working DHCP network with a relay, two scopes and a virtual clock." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'dhcp', label: 'DHCP lab', hue: COLOR.teal,
  blurb: 'Scopes, exclusions, relays (ip helper-address), the Discover/Offer/Request/Acknowledge exchange and lease timers on a virtual clock. Make clients ask for addresses and read why a server answered or stayed silent.',
  Component: DhcpTool,
});
