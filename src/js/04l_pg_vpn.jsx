/* ---------------- IT Playground: site-to-site VPN lab ---------------- */

// Two sites joined by an IPsec tunnel. Edit either end (addresses, firewall,
// phase 1, phase 2, selectors, routes, NAT), run a test from a host at one site
// to a host at the other, and read the tunnel status per stage plus the first
// thing that fails. The simulation is pgVpnTest in 03c_pg_vpn.js; the guided
// scenarios come from data/playground_vpn.py (PLAYGROUND.vpn).

function pgVpnSetPath(site, path, value) {
  const s = pgClone(site);
  const keys = path.split('.');
  let o = s;
  for (let i = 0; i < keys.length - 1; i += 1) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
  return s;
}

const PG_VPN_STATE_HUE = { ok: COLOR.success, partial: COLOR.orange, fail: COLOR.red, skip: COLOR.muted };
const PG_VPN_STATE_MARK = { ok: '✓', partial: '◐', fail: '✕', skip: '○' };

// Which editor card holds a diagnosis field (so "Show me where" can open it)
function pgVpnCardFor(field) {
  const f = String(field || '');
  if (f === 'fw') return 'fw';
  if (f.indexOf('ike') === 0) return 'p1';
  if (f.indexOf('child') === 0) return 'p2';
  if (f === 'selectors' || f.indexOf('selector.') === 0) return 'sel';
  if (f === 'routes' || f === 'natExempt' || f === 'mode' || f.indexOf('route.') === 0) return 'route';
  return 'net';
}

const PG_VPN_CARD_TITLES = { net: 'Network and gateway', fw: 'Firewall in front of the gateway', p1: 'Phase 1 (IKE SA)', p2: 'Phase 2 (child SA, ESP)', sel: 'Traffic selectors', route: 'Routing and NAT' };

function PgVpnDiagram({ topo, fromId, toId, result }) {
  const W = 320;
  const A = topo.sites[0];
  const B = topo.sites[1];
  const maxSub = Math.max(1, A.subnets.length, B.subnets.length);
  const H = 82 + maxSub * 40 + 4;
  const p2 = result ? result.stages[2].state : 'skip';
  const lineColor = PG_VPN_STATE_HUE[p2] || COLOR.muted;
  const diag = result && result.diagnosis;
  const failAt = (s) => !!diag && (diag.deviceId === s.id || diag.deviceId === 'both') && diag.code !== 'bad-config';
  const col = (s, x0) => {
    const cx = x0 + 56;
    const hotGw = failAt(s);
    return (
      <g key={s.id}>
        <text x={cx} y={13} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="800">{s.name}</text>
        <line x1={cx} y1={62} x2={cx} y2={82 + (s.subnets.length - 1) * 40 + 17} stroke={COLOR.muted} strokeWidth="1.3" />
        <rect x={x0} y={22} width={112} height={40} rx="8" fill={COLOR.surfaceRaised} stroke={hotGw ? COLOR.red : COLOR.gold} strokeWidth="2" />
        <text x={cx} y={37} textAnchor="middle" fill={COLOR.text} fontSize="9.5" fontWeight="700">VPN gateway</text>
        <text x={cx} y={49} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{s.gwPublic}</text>
        <text x={cx} y={59} textAnchor="middle" fill={COLOR.muted} fontSize="7.5">{s.behindNat ? 'behind a NAT device' : (s.mode === 'policy' ? 'policy-based' : 'route-based')}</text>
        {s.subnets.map((n, k) => {
          const isFrom = n.host.id === fromId;
          const isTo = n.host.id === toId;
          return (
            <g key={n.id}>
              <rect x={x0 + 4} y={82 + k * 40} width={104} height={34} rx="7" fill={tint(COLOR.teal, 8)} stroke={isFrom ? COLOR.blue : isTo ? COLOR.success : COLOR.border} strokeWidth={isFrom || isTo ? 2.4 : 1.2} />
              <text x={cx} y={96 + k * 40} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="700">{n.host.name} {n.host.ip}</text>
              <text x={cx} y={108 + k * 40} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{n.cidr}</text>
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Site-to-site VPN diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      {col(A, 4)}
      {col(B, 204)}
      <line x1={116} y1={42} x2={204} y2={42} stroke={lineColor} strokeWidth="4" strokeDasharray={p2 === 'skip' ? '6 4' : undefined} strokeLinecap="round" />
      <text x={160} y={31} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">Internet</text>
      <text x={160} y={58} textAnchor="middle" fill={lineColor} fontSize="8.5" fontWeight="700">{result ? (p2 === 'ok' ? 'tunnel up' : p2 === 'partial' ? 'partly up' : p2 === 'fail' ? 'no tunnel' : 'no tunnel') : 'IPsec tunnel'}</text>
      {[A, B].map((s, i) => (
        <g key={`fw-${s.id}`}>
          <rect x={i === 0 ? 120 : 176} y={34} width={24} height={16} rx="4" fill={COLOR.surfaceRaised} stroke={failAt(s) && diag.field === 'fw' ? COLOR.red : COLOR.border} strokeWidth="1.5" />
          <text x={i === 0 ? 132 : 188} y={45} textAnchor="middle" fill={COLOR.text} fontSize="8" fontWeight="700">FW</text>
        </g>
      ))}
    </svg>
  );
}

function PgVpnHot({ hot, children }) {
  return <div style={{ outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px', minWidth: 0 }}>{children}</div>;
}

function PgVpnSection({ id, siteId, open, setOpen, hue, hotCard, children }) {
  const isOpen = !!open[`${siteId}:${id}`];
  const title = PG_VPN_CARD_TITLES[id];
  return (
    <PgCard title={title} hue={hue} style={hotCard ? { outline: `2px solid ${COLOR.red}`, outlineOffset: '2px' } : undefined}
      right={<button className="btn-flat" aria-label={`${title}: ${isOpen ? 'hide' : 'show'}`} aria-expanded={isOpen} onClick={() => setOpen({ ...open, [`${siteId}:${id}`]: !isOpen })}
        style={{ ...pgPillStyle, padding: '5px 12px', minHeight: '36px' }}>{isOpen ? 'Hide' : 'Show'}</button>}>
      {isOpen ? children : <div style={{ fontSize: '12px', color: COLOR.muted }}>Tap Show to edit.</div>}
    </PgCard>
  );
}

function PgVpnSiteEditor({ topo, site, setSite, diag, open, setOpen }) {
  const errs = pgVpnValidate(topo).filter((e) => e.site === site.id);
  const err = (f) => { const e = errs.find((x) => x.field === f); return e ? e.text : undefined; };
  const hotField = (...fields) => !!diag && diag.code !== 'bad-config' && (diag.deviceId === site.id || diag.deviceId === 'both') && fields.some((f) => diag.field === f || (f.slice(-1) === '*' && String(diag.field || '').indexOf(f.slice(0, -1)) === 0));
  const badField = (f) => !!diag && diag.code === 'bad-config' && diag.deviceId === site.id && diag.field === f;
  const hotCard = (id) => !!diag && (diag.deviceId === site.id || diag.deviceId === 'both') && pgVpnCardFor(diag.field) === id;
  const put = (path, value) => setSite(pgVpnSetPath(site, path, value));
  const num = (path) => (v) => put(path, /^\d+$/.test(v) ? Number(v) : v);
  const sec = (id, hue, children) => <PgVpnSection id={id} siteId={site.id} open={open} setOpen={setOpen} hue={hue} hotCard={hotCard(id)}>{children}</PgVpnSection>;
  const g2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' };
  const setSubnet = (n, patch, hostPatch) => put('subnets', site.subnets.map((x) => (x.id === n.id ? { ...x, ...patch, host: { ...x.host, ...(hostPatch || {}) } } : x)));
  const setSel = (id, patch) => put('selectors', site.selectors.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const nextId = (list, prefix) => { let n = list.length + 1; while (list.some((x) => x.id === `${prefix}${n}`)) n += 1; return `${prefix}${n}`; };
  const otherNets = topo.sites.filter((s) => s.id !== site.id)[0].subnets;
  return (
    <div>
      {sec('net', COLOR.teal, (
        <div>
          <div style={g2}>
            <PgVpnHot hot={hotField('gwPublic') || badField('gwPublic')}><PgField label="Gateway public address" value={site.gwPublic} onChange={(v) => put('gwPublic', v)} error={err('gwPublic')} inputMode="decimal" /></PgVpnHot>
            <PgVpnHot hot={hotField('peerIp') || badField('peerIp')}><PgField label="Peer address (the other gateway)" value={site.peerIp} onChange={(v) => put('peerIp', v)} error={err('peerIp')} inputMode="decimal" /></PgVpnHot>
          </div>
          {site.subnets.map((n) => (
            <div key={n.id} style={{ ...g2, marginTop: '8px' }}>
              <PgField label={`${n.name} subnet`} value={n.cidr} onChange={(v) => setSubnet(n, { cidr: v })} error={err(`subnet.${n.id}.cidr`)} placeholder="10.1.0.0/24" />
              <PgField label={`${n.host.name} address`} value={n.host.ip} onChange={(v) => setSubnet(n, {}, { ip: v })} error={err(`subnet.${n.id}.host`)} inputMode="decimal" />
            </div>
          ))}
          <div style={{ marginTop: '8px' }}>
            <PgToggle label="Gateway sits behind a NAT device" hint="The public address belongs to a router or firewall that translates it to the gateway's private address. The peers then have to use NAT traversal." value={site.behindNat} onChange={(v) => put('behindNat', v)} />
            <PgToggle label="NAT traversal (NAT-T) enabled" hint="Lets IKE and ESP be wrapped in UDP port 4500 so a NAT device can translate them. Both gateways need it when either one is behind NAT." value={site.natT} onChange={(v) => put('natT', v)} hot={hotField('natT')} />
          </div>
        </div>
      ))}
      {sec('fw', COLOR.gold, (
        <PgVpnHot hot={hotField('fw')}>
          <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '4px' }}>What the firewall in front of this gateway lets in from the other site.</div>
          <PgToggle label="Allow UDP 500 (IKE)" hint="Needed to start any IKE negotiation." value={site.fw.udp500} onChange={(v) => put('fw.udp500', v)} />
          <PgToggle label="Allow UDP 4500 (NAT-T)" hint="Needed only when a NAT device is in the path: IKE and ESP then move to this port." value={site.fw.udp4500} onChange={(v) => put('fw.udp4500', v)} />
          <PgToggle label="Allow ESP (IP protocol 50)" hint="The encrypted data. It is neither TCP nor UDP, so there is no port to open." value={site.fw.esp} onChange={(v) => put('fw.esp', v)} />
        </PgVpnHot>
      ))}
      {sec('p1', COLOR.blue, (
        <div style={g2}>
          <PgVpnHot hot={hotField('ike.version')}><PgSelect label="IKE version" value={site.ike.version} onChange={(v) => put('ike.version', v)} options={PG_VPN_VERSIONS} /></PgVpnHot>
          <PgVpnHot hot={hotField('ike')}><PgSelect label="Encryption" value={site.ike.enc} onChange={(v) => put('ike.enc', v)} options={PG_VPN_ENC} /></PgVpnHot>
          <PgVpnHot hot={hotField('ike')}><PgSelect label="Integrity / hash" value={site.ike.hash} onChange={(v) => put('ike.hash', v)} options={PG_VPN_HASH} /></PgVpnHot>
          <PgVpnHot hot={hotField('ike')}><PgSelect label="DH group" value={String(site.ike.dh)} onChange={(v) => put('ike.dh', Number(v))} options={PG_VPN_DH} /></PgVpnHot>
          <PgVpnHot hot={hotField('ike.psk') || badField('ike.psk')}><PgField label="Pre-shared key" value={site.ike.psk} onChange={(v) => put('ike.psk', v)} error={err('ike.psk')} /></PgVpnHot>
          <PgField label="Lifetime (seconds)" value={String(site.ike.lifetime)} onChange={num('ike.lifetime')} error={err('ike.lifetime')} inputMode="numeric" hint="Not negotiated in IKEv2." />
        </div>
      ))}
      {sec('p2', COLOR.pink, (
        <div style={g2}>
          <PgVpnHot hot={hotField('child')}><PgSelect label="ESP encryption" value={site.child.enc} onChange={(v) => put('child.enc', v)} options={PG_VPN_ENC} /></PgVpnHot>
          <PgVpnHot hot={hotField('child')}><PgSelect label="ESP integrity" value={site.child.hash} onChange={(v) => put('child.hash', v)} options={PG_VPN_HASH} /></PgVpnHot>
          <PgVpnHot hot={hotField('child.pfs')}><PgSelect label="PFS group" value={String(site.child.pfs)} onChange={(v) => put('child.pfs', v === 'none' ? 'none' : Number(v))} options={PG_VPN_PFS} /></PgVpnHot>
          <PgField label="Lifetime (seconds)" value={String(site.child.lifetime)} onChange={num('child.lifetime')} error={err('child.lifetime')} inputMode="numeric" />
        </div>
      ))}
      {sec('sel', COLOR.orange, (
        <PgVpnHot hot={hotField('selectors')}>
          <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>Which source and destination networks this end protects. Each selector here needs a mirror image at the other end: this end's local is the other end's remote.</div>
          {site.selectors.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>No selectors: nothing is protected.</div>}
          {site.selectors.map((x, i) => (
            <div key={x.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: COLOR.surface }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                <strong style={{ fontSize: '12.5px' }}>Selector {i + 1}</strong>
                <button className="btn-flat" onClick={() => put('selectors', site.selectors.filter((y) => y.id !== x.id))} aria-label={`Delete selector ${i + 1}`} style={{ width: '36px', height: '36px', color: COLOR.muted }}>{'✕'}</button>
              </div>
              <div style={g2}>
                <PgField label="Local network" value={x.local} onChange={(v) => setSel(x.id, { local: v })} error={err(`selector.${x.id}.local`)} placeholder="10.1.0.0/24" />
                <PgField label="Remote network" value={x.remote} onChange={(v) => setSel(x.id, { remote: v })} error={err(`selector.${x.id}.remote`)} placeholder="10.2.0.0/24" />
              </div>
            </div>
          ))}
          <button className="btn-flat" onClick={() => put('selectors', [...site.selectors, { id: nextId(site.selectors, `${site.id}-s`), local: site.subnets[0].cidr, remote: otherNets[0].cidr }])}
            style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add a selector</button>
        </PgVpnHot>
      ))}
      {sec('route', COLOR.teal, (
        <div>
          <PgVpnHot hot={hotField('mode')}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>How traffic gets into the tunnel</div>
            <PgSegmented hue={COLOR.teal} value={site.mode} onChange={(v) => put('mode', v)} options={[{ key: 'route', label: 'Route-based' }, { key: 'policy', label: 'Policy-based' }]} />
          </PgVpnHot>
          {site.mode === 'route' ? (
            <PgVpnHot hot={hotField('routes')}>
              <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>Static routes whose next hop is the tunnel. Anything without a route follows the default route to the ISP.</div>
              {site.routes.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>No routes into the tunnel.</div>}
              {site.routes.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}><PgField label={`Route ${i + 1}: destination (next hop: tunnel)`} value={r.dest} onChange={(v) => put('routes', site.routes.map((y) => (y.id === r.id ? { ...y, dest: v } : y)))} error={err(`route.${r.id}.dest`)} placeholder="10.2.0.0/24" /></div>
                  <button className="btn-flat" onClick={() => put('routes', site.routes.filter((y) => y.id !== r.id))} aria-label={`Delete route ${i + 1}`} style={{ width: '36px', height: '38px', color: COLOR.muted }}>{'✕'}</button>
                </div>
              ))}
              <button className="btn-flat" onClick={() => put('routes', [...site.routes, { id: nextId(site.routes, `${site.id}-r`), dest: otherNets[0].cidr }])}
                style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add a route into the tunnel</button>
            </PgVpnHot>
          ) : (
            <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>Policy-based: traffic that matches one of this end's selectors is encrypted; no route into the tunnel is needed.</div>
          )}
          <div style={{ marginTop: '8px' }}>
            <PgToggle label="Source NAT (PAT) for internet access" hint="Rewrites private LAN addresses to the public address on the way out." value={site.snat} onChange={(v) => put('snat', v)} />
            <PgVpnHot hot={hotField('natExempt') || badField('natExempt')}>
              <PgField label="NAT exemption: destinations that skip NAT" value={site.natExempt} onChange={(v) => put('natExempt', v)} error={err('natExempt')} placeholder="10.2.0.0/24, 10.3.0.0/24" hint="Traffic to these networks keeps its private source address, so it can match the tunnel." />
            </PgVpnHot>
          </div>
        </div>
      ))}
    </div>
  );
}

function PgVpnStatus({ stages }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Tunnel status</div>
      {stages.map((s) => (
        <div key={s.key} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', padding: '6px 10px', marginBottom: '4px', borderRadius: '10px', background: tint(PG_VPN_STATE_HUE[s.state], s.state === 'skip' ? 4 : 12), border: `1.5px solid color-mix(in srgb, ${PG_VPN_STATE_HUE[s.state]} 50%, ${COLOR.border})` }}>
          <span aria-hidden="true" style={{ fontWeight: 900, width: '14px', flexShrink: 0, color: s.state === 'skip' ? COLOR.muted : ink(PG_VPN_STATE_HUE[s.state]) }}>{PG_VPN_STATE_MARK[s.state]}</span>
          <span style={{ minWidth: 0, fontSize: '12.5px', lineHeight: 1.4 }}><strong>{s.label}</strong><span style={{ color: COLOR.muted }}> {'·'} {s.state === 'skip' ? 'not reached' : s.state === 'partial' ? `partly up: ${s.text}` : s.state === 'ok' ? `up: ${s.text}` : `down: ${s.text}`}</span></span>
        </div>
      ))}
    </div>
  );
}

function PgVpnCompare({ topo, a, b }) {
  const rows = pgVpnCompare(topo);
  return (
    <div style={{ fontSize: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr) 18px', gap: '4px 6px', alignItems: 'baseline' }}>
        <span />
        <strong style={{ color: COLOR.muted, fontSize: '10.5px', textTransform: 'uppercase' }}>{a.name}</strong>
        <strong style={{ color: COLOR.muted, fontSize: '10.5px', textTransform: 'uppercase' }}>{b.name}</strong>
        <span />
        {rows.map((r) => (
          <React.Fragment key={r.label}>
            <span style={{ color: COLOR.muted }}>{r.label}</span>
            <span style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{r.a}</span>
            <span style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{r.b}</span>
            <span aria-label={r.state === 'ok' ? 'match' : r.state === 'bad' ? 'mismatch' : 'differs, not fatal'} style={{ fontWeight: 900, color: r.state === 'ok' ? ink(COLOR.success) : r.state === 'bad' ? ink(COLOR.red) : COLOR.muted }}>{r.state === 'ok' ? '✓' : r.state === 'bad' ? '✕' : '≈'}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '8px', lineHeight: 1.5 }}>{'≈'} means the values differ but the tunnel can still come up (lifetimes). The pre-shared key is only compared, never shown here.</div>
    </div>
  );
}

const PG_VPN_CAUSES = {
  'wrong-peer-address': 'A gateway is pointed at the wrong peer address',
  'firewall-blocks-ike': 'A firewall blocks UDP 500 or UDP 4500',
  'nat-t-disabled': 'A NAT device is in the path but NAT traversal is off',
  'ike-version-mismatch': 'One end uses IKEv1 and the other IKEv2',
  'proposal-mismatch': 'The phase 1 algorithms do not overlap',
  'psk-mismatch': 'The pre-shared keys are different',
  'esp-proposal-mismatch': 'The phase 2 (ESP) algorithms do not overlap',
  'pfs-mismatch': 'PFS is set differently on the two ends',
  'selector-mismatch': 'The traffic selectors are not mirror images, or do not cover this traffic',
  'no-route-to-tunnel': 'No route sends this traffic into the tunnel',
  'nat-not-exempt': 'Source NAT rewrites the traffic before it is encrypted',
  'firewall-blocks-esp': 'A firewall drops ESP (IP protocol 50)',
};

function PgVpnResult({ result, onWhere }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const d = result.diagnosis;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      <PgVpnStatus stages={result.stages} />
      <PgDiagnosis diagnosis={d} heading="First thing that is wrong" />
      {d && d.field && (
        <button className="btn-flat" onClick={() => onWhere(d)} style={{ ...pgPillStyle, marginBottom: '10px', minHeight: '36px', border: `2px solid ${COLOR.primary}`, color: ink(COLOR.primary) }}>Show me where</button>
      )}
      <PgSteps steps={result.steps} />
    </div>
  );
}

function PgVpnLab({ topo, setTopo, goals, defaultAsk }) {
  const hosts = pgVpnHosts(topo);
  const [conn, setConn] = useState(defaultAsk || { from: hosts[0].id, to: hosts[hosts.length - 1].id });
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(topo.sites[0].id);
  const [open, setOpen] = useState({});
  const site = topo.sites.find((s) => s.id === tab) || topo.sites[0];
  const setSite = (s) => { setTopo({ ...topo, sites: topo.sites.map((x) => (x.id === s.id ? s : x)) }); setResult(null); };
  const hostLabel = (id) => { const h = hosts.find((x) => x.id === id); return h ? h.name : id; };
  const goalStates = (goals || []).map((g) => ({ g, r: pgVpnTest(topo, g) }));
  const diag = result && result.diagnosis;
  const where = (d) => {
    // 'both' means the same setting is wrong on the two ends: open it at each end and stay on the current tab
    const targets = d.deviceId && d.deviceId !== 'both' ? [d.deviceId] : topo.sites.map((s) => s.id);
    if (targets.length === 1) setTab(targets[0]);
    const next = { ...open };
    targets.forEach((id) => { next[`${id}:${pgVpnCardFor(d.field)}`] = true; });
    setOpen(next);
  };
  const hostOpts = hosts.map((h) => ({ value: h.id, label: `${h.name} (${(pgVpnSiteOf(topo, h.site) || {}).name})` }));
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgVpnDiagram topo={topo} fromId={conn.from} toId={conn.to} result={result} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = sending</span> {'·'} <span style={{ color: ink(COLOR.success) }}>green = receiving</span> {'·'} FW = firewall in front of the gateway
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{hostLabel(g.from)} and {hostLabel(g.to)} can talk through the tunnel</span>
            </div>
          ))}
        </PgCard>
      )}
      <PgCard title="Compare the two ends" hue={COLOR.blue} collapsible defaultOpen={false}>
        <PgVpnCompare topo={topo} a={topo.sites[0]} b={topo.sites[1]} />
      </PgCard>
      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, margin: '2px 0 4px' }}>Settings for</div>
      <PgSegmented hue={COLOR.pink} value={site.id} onChange={setTab} options={topo.sites.map((s) => ({ key: s.id, label: s.name }))} />
      <PgVpnSiteEditor topo={topo} site={site} setSite={setSite} diag={diag} open={open} setOpen={setOpen} />
      <PgCard title="Test the tunnel" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <PgSelect label="From" value={conn.from} onChange={(v) => { setConn({ ...conn, from: v }); setResult(null); }} options={hostOpts} />
          <PgSelect label="To" value={conn.to} onChange={(v) => { setConn({ ...conn, to: v }); setResult(null); }} options={hostOpts} />
        </div>
        <PgPredict compute={() => pgVpnTest(topo, conn)} causes={PG_VPN_CAUSES} buttonLabel="Run the test" onResult={setResult} resetKey={JSON.stringify([topo, conn])} />
        <PgVpnResult result={result} onWhere={where} />
      </PgCard>
    </div>
  );
}

function pgVpnValidTopo(t) {
  return !!t && Array.isArray(t.sites) && t.sites.length === 2 && t.sites.every((s) => typeof s.id === 'string' && s.ike && s.child && s.fw && Array.isArray(s.subnets) && s.subnets.length >= 1
    && s.subnets.every((n) => n.host && typeof n.host.id === 'string' && typeof n.host.ip === 'string' && typeof n.cidr === 'string') && Array.isArray(s.selectors) && Array.isArray(s.routes)
    && typeof s.gwPublic === 'string' && typeof s.peerIp === 'string' && (s.mode === 'route' || s.mode === 'policy'));
}

function VpnTool({ pick, onPick }) {
  const scenarios = pgScenarios('vpn');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="vpn" makeDefault={() => pgClone(pgData().vpnSandbox)} validate={pgVpnValidTopo} onBack={() => onPick('')}
        blurb="A working IPsec tunnel between a head office with two LANs and a branch. Change the IKE version, a proposal, the key, a selector, a route or a firewall rule, switch NAT or policy mode, then test traffic and read which step fails first."
        renderLab={(topo, setTopo) => <PgVpnLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="vpn" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgVpnTest(topo, g).verdict === g.verdict)}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgVpnLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="vpn" scenarios={scenarios} onPick={onPick}
      intro="An IPsec tunnel has to come up in order: the two gateways reach each other through their firewalls, phase 1 builds a protected IKE channel, phase 2 builds the tunnel that will carry your traffic, and only then do routes, NAT and selectors decide whether a packet really enters it. Run a test and read which step fails first."
      note="Simplified on purpose: this is generic IPsec (IKE, ESP, NAT traversal), not any vendor's commands or menus. Each gateway offers one proposal (real ones offer lists), selectors must mirror exactly (IKEv2 can narrow overlapping ones), and lifetimes, rekeying, MTU, certificates and dead-peer detection are not simulated. Both firewalls are checked because either end can start the tunnel."
      sandboxText="A working tunnel between a head office and a branch to adjust, break and test." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'vpn',
  label: 'Site-to-site VPN lab',
  hue: COLOR.pink,
  blurb: 'Two sites, a firewall in front of each gateway and an IPsec tunnel between them. Set IKE phase 1 and phase 2, the pre-shared key, traffic selectors, routes and NAT exemption, then test traffic and see which step fails first.',
  Component: VpnTool,
});
