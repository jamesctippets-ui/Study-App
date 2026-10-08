/* ---------------- IT Playground: IP configuration lab ---------------- */

// Build a small network (hosts, a gateway, one or more routers), change an
// address, mask or route, then "ping" and read exactly why traffic works or
// fails. The simulation is pgPing in 03b_playground_engine.js; guided
// scenarios come from data/playground.py (the PLAYGROUND constant).

const PG_SANDBOX = {
  segments: [{ id: 'office', label: 'Office LAN' }, { id: 'servers', label: 'Server LAN' }],
  hosts: [
    { id: 'pc1', name: 'PC 1', segment: 'office', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1' },
    { id: 'pc2', name: 'PC 2', segment: 'office', ip: '192.168.1.11', mask: '255.255.255.0', gateway: '192.168.1.1' },
    { id: 'srv', name: 'Server', segment: 'servers', ip: '10.0.0.10', mask: '255.255.255.0', gateway: '10.0.0.1' },
  ],
  routers: [{
    id: 'r1', name: 'Router',
    ifaces: [{ segment: 'office', ip: '192.168.1.1', mask: '255.255.255.0' }, { segment: 'servers', ip: '10.0.0.1', mask: '255.255.255.0' }],
    routes: [],
  }],
};


// Segments in a row, routers above joining them, hosts under each segment bar.
function PgTopologyDiagram({ topo, fromId, toId, failId }) {
  const W = 320;
  const n = Math.max(1, topo.segments.length);
  const colW = W / n;
  const cx = (i) => (i + 0.5) * colW;
  const segIndex = {};
  topo.segments.forEach((s, i) => { segIndex[s.id] = i; });
  const hostsBy = topo.segments.map((s) => topo.hosts.filter((h) => h.segment === s.id));
  const maxHosts = Math.max(1, ...hostsBy.map((x) => x.length));
  const barY = 92;
  const H = barY + 22 + maxHosts * 36 + 8;
  const stroke = (id) => (id === failId ? COLOR.red : id === fromId ? COLOR.blue : id === toId ? COLOR.success : COLOR.border);
  const sw = (id) => (id === failId || id === fromId || id === toId ? 2.4 : 1.3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Network diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      {topo.routers.map((r) => {
        const idx = r.ifaces.map((f) => segIndex[f.segment]).filter((x) => x !== undefined);
        const x = idx.length ? idx.reduce((s, i) => s + cx(i), 0) / idx.length : W / 2;
        return (
          <g key={r.id}>
            {idx.map((i) => <line key={i} x1={x} y1={52} x2={cx(i)} y2={barY} stroke={COLOR.muted} strokeWidth="1.3" />)}
            <rect x={x - 44} y={20} width={88} height={32} rx="8" fill={COLOR.surfaceRaised} stroke={stroke(r.id)} strokeWidth={sw(r.id)} />
            <text x={x} y={34} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="700">{r.name}</text>
            <text x={x} y={46} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">router</text>
          </g>
        );
      })}
      {topo.segments.map((s, i) => (
        <g key={s.id}>
          <rect x={i * colW + 6} y={barY} width={colW - 12} height={8} rx="4" fill={tint(COLOR.teal, 40)} stroke={COLOR.teal} strokeWidth="1" />
          <text x={i * colW + 10} y={barY - 6} textAnchor="start" fill={COLOR.muted} fontSize="9" fontWeight="700">{s.label}</text>
          {hostsBy[i].map((h, k) => (
            <g key={h.id}>
              <line x1={cx(i)} y1={barY + 8} x2={cx(i)} y2={barY + 22 + k * 36} stroke={COLOR.border} strokeWidth="1" />
              <rect x={i * colW + 10} y={barY + 22 + k * 36} width={colW - 20} height={30} rx="7" fill={COLOR.surfaceRaised} stroke={stroke(h.id)} strokeWidth={sw(h.id)} />
              <text x={cx(i)} y={barY + 35 + k * 36} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="700">{h.name}</text>
              <text x={cx(i)} y={barY + 46 + k * 36} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{h.ip || '—'}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function PgHostEditor({ host, topo, onChange, onRemove, failField, canRemove, highlight }) {
  const v = pgDeviceView(host, false)[0];
  const ipErr = v.ipN === null && v.ipText ? 'Not a valid address' : v.ipN === null ? 'Required' : null;
  const maskErr = v.maskError;
  const gwErr = v.gatewayText && v.gwN === null ? 'Not a valid address' : null;
  const bad = (f) => failField === f;
  return (
    <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: '10px 0', outline: highlight ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: highlight ? '8px' : 0 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
        <strong style={{ fontSize: '13.5px' }}>{host.name}</strong>
        {canRemove && <button className="btn-flat" onClick={onRemove} aria-label={`Remove ${host.name}`} style={{ fontSize: '12px', color: COLOR.muted }}>Remove</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <div style={bad('ip') ? { outline: `2px solid ${COLOR.red}`, borderRadius: '10px', padding: '2px' } : undefined}>
          <PgField label="IP address" value={host.ip} onChange={(val) => onChange({ ip: val })} error={ipErr} inputMode="decimal" />
        </div>
        <div style={bad('mask') ? { outline: `2px solid ${COLOR.red}`, borderRadius: '10px', padding: '2px' } : undefined}>
          <PgField label="Mask" value={host.mask} onChange={(val) => onChange({ mask: val })} error={maskErr ? 'Invalid' : null} inputMode="decimal" />
        </div>
        <div style={bad('gateway') ? { outline: `2px solid ${COLOR.red}`, borderRadius: '10px', padding: '2px' } : undefined}>
          <PgField label="Gateway" value={host.gateway} onChange={(val) => onChange({ gateway: val })} error={gwErr} placeholder="none" inputMode="decimal" />
        </div>
      </div>
      {maskErr ? <div style={{ fontSize: '11.5px', color: COLOR.red, marginTop: '4px' }}>{maskErr}</div> : null}
    </div>
  );
}

function PgRouterEditor({ router, topo, onChange, highlight, failField }) {
  const setIface = (i, patch) => onChange({ ifaces: router.ifaces.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const setRoute = (i, patch) => onChange({ routes: router.routes.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  return (
    <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: '10px 0', outline: highlight ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: highlight ? '8px' : 0 }}>
      <strong style={{ fontSize: '13.5px' }}>{router.name}</strong>
      {router.ifaces.map((f, i) => {
        const ipN = pgParseIPv4(f.ip);
        const m = pgParseMask(f.mask);
        return (
          <div key={i} style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '3px' }}>Port on <strong style={{ color: COLOR.text }}>{pgSegmentLabel(topo, f.segment)}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="IP address" value={f.ip} onChange={(val) => setIface(i, { ip: val })} error={ipN === null ? 'Invalid' : null} inputMode="decimal" />
              <PgField label="Mask" value={f.mask} onChange={(val) => setIface(i, { mask: val })} error={m.error ? 'Invalid' : null} inputMode="decimal" />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '10px', padding: failField === 'routes' ? '6px' : 0, outline: failField === 'routes' ? `2px solid ${COLOR.red}` : 'none', borderRadius: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Static routes</div>
        {router.routes.length === 0 && <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '4px' }}>None. The router only knows its directly connected networks.</div>}
        {router.routes.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto', gap: '6px', alignItems: 'end', marginBottom: '10px' }}>
            <PgField label="Network" value={r.net} onChange={(val) => setRoute(i, { net: val })} error={pgParseIPv4(r.net) === null ? 'Invalid' : null} inputMode="decimal" />
            <PgField label="Mask" value={r.mask} onChange={(val) => setRoute(i, { mask: val })} error={pgParseMask(r.mask).error ? 'Invalid' : null} inputMode="decimal" />
            <button className="btn-flat" onClick={() => onChange({ routes: router.routes.filter((_, j) => j !== i) })} aria-label="Remove route" style={{ height: '40px', width: '32px', color: COLOR.muted }}>✕</button>
            <div style={{ gridColumn: '1 / 3' }}>
              <PgField label="Next hop" value={r.via} onChange={(val) => setRoute(i, { via: val })} error={pgParseIPv4(r.via) === null ? 'Invalid' : null} inputMode="decimal" />
            </div>
          </div>
        ))}
        <button className="btn-flat" onClick={() => onChange({ routes: [...router.routes, { net: '', mask: '255.255.255.0', via: '' }] })}
          style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.teal), padding: '2px 0' }}>+ Add a static route</button>
      </div>
    </div>
  );
}

function PgPingResult({ result }) {
  if (!result) return null;
  const hue = result.verdict === 'success' ? COLOR.success : result.verdict === 'unreliable' ? COLOR.orange : COLOR.red;
  const mark = result.verdict === 'success' ? '✓' : result.verdict === 'unreliable' ? '!' : '✕';
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{mark}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      <PgDiagnosis diagnosis={result.diagnosis} />
      {result.warnings.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: '12px', background: tint(COLOR.orange, 12), border: `1.5px solid ${COLOR.orange}`, marginBottom: '10px', fontSize: '12.5px', lineHeight: 1.5 }}>
          {result.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
        </div>
      )}
      {result.legs.map((leg, i) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: leg.delivered ? ink(COLOR.success) : ink(COLOR.red), marginBottom: '4px' }}>
            {leg.label}: {leg.delivered ? 'delivered' : 'not delivered'}
          </div>
          <PgSteps steps={leg.steps} />
        </div>
      ))}
    </div>
  );
}

const PG_IP_CAUSES = {
  'bad-ip': 'A device has an invalid IP address',
  'bad-mask': 'A device has an invalid subnet mask',
  'host-address': 'A host uses the network or broadcast address of its subnet',
  'no-gateway': 'The host has no default gateway',
  'bad-gateway': 'The default gateway setting is not usable',
  'gateway-offsubnet': 'The gateway is outside the host\'s own subnet',
  'arp-timeout': 'Nobody answers for the next-hop address (wrong gateway, wrong mask or wrong network)',
  'not-a-router': 'The "gateway" is an ordinary host, not a router',
  'no-route': 'A router has no route to the destination network',
  'host-unreachable': 'The router reaches the right network but nothing there owns the address',
  'bad-next-hop': 'A static route points at a next hop that does not exist',
  'reply-lost': 'The request arrives but the reply cannot get back',
  'duplicate-ip': 'Two devices share one IP address',
  loop: 'A routing loop',
};

// The shared lab: topology editor, diagram, ping panel. `goals` (optional) are
// the scenario's success checks, re-evaluated live against the current setup.
function PgLab({ topo, setTopo, goals, sandbox, defaultAsk }) {
  const devices = [...topo.hosts.map((h) => ({ id: h.id, name: h.name })), ...topo.routers.map((r) => ({ id: r.id, name: r.name }))];
  const [fromId, setFromId] = useState(defaultAsk ? defaultAsk.from : topo.hosts[0].id);
  const [toId, setToId] = useState(defaultAsk ? defaultAsk.to : (topo.hosts[1] || topo.hosts[0]).id);
  const [result, setResult] = useState(null);
  const failDevice = result && result.diagnosis ? result.diagnosis.deviceId : null;
  const failField = result && result.diagnosis ? result.diagnosis.field : null;
  const updateHost = (id, patch) => { setTopo({ ...topo, hosts: topo.hosts.map((h) => (h.id === id ? { ...h, ...patch } : h)) }); setResult(null); };
  const updateRouter = (id, patch) => { setTopo({ ...topo, routers: topo.routers.map((r) => (r.id === id ? { ...r, ...patch } : r)) }); setResult(null); };
  const addHost = (segment) => {
    const n = topo.hosts.length + 1;
    let id = `h${n}`;
    while (topo.hosts.some((h) => h.id === id) || topo.routers.some((r) => r.id === id)) id += 'x';
    setTopo({ ...topo, hosts: [...topo.hosts, { id, name: `Host ${n}`, segment, ip: '', mask: '255.255.255.0', gateway: '' }] });
    setResult(null);
  };
  const removeHost = (id) => {
    setTopo({ ...topo, hosts: topo.hosts.filter((h) => h.id !== id) });
    if (fromId === id) setFromId(topo.hosts.find((h) => h.id !== id).id);
    if (toId === id) setToId(topo.hosts.find((h) => h.id !== id).id);
    setResult(null);
  };
  const ping = () => setResult(pgPing(topo, fromId, toId));
  const goalStates = (goals || []).map((g) => ({ g, r: pgPing(topo, g.from, g.to) }));
  const nameOf = (id) => (devices.find((d) => d.id === id) || { name: id }).name;
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgTopologyDiagram topo={topo} fromId={fromId} toId={devices.some((d) => d.id === toId) ? toId : null} failId={failDevice} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = pinging from</span> · <span style={{ color: ink(COLOR.success) }}>green = pinging to</span> · <span style={{ color: ink(COLOR.red) }}>red = where it broke</span>
        </div>
      </PgCard>

      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }) => (
            <div key={`${g.from}>${g.to}`} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{nameOf(g.from)} can reach {nameOf(g.to)}{g.to.includes('.') ? '' : ''}</span>
            </div>
          ))}
        </PgCard>
      )}

      <PgCard title="Devices" hue={COLOR.blue} collapsible>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '2px' }}>Edit any field, then ping. Masks can be written as /24 or 255.255.255.0.</div>
        {topo.segments.map((s) => (
          <div key={s.id} style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(COLOR.teal) }}>{s.label}</div>
            {topo.hosts.filter((h) => h.segment === s.id).map((h) => (
              <PgHostEditor key={h.id} host={h} topo={topo} onChange={(p) => updateHost(h.id, p)} onRemove={() => removeHost(h.id)}
                canRemove={sandbox && topo.hosts.length > 2} failField={failDevice === h.id ? failField : null} highlight={failDevice === h.id} />
            ))}
            {sandbox && <button className="btn-flat" onClick={() => addHost(s.id)} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '4px 0' }}>+ Add a host to {s.label}</button>}
          </div>
        ))}
        {topo.routers.map((r) => (
          <PgRouterEditor key={r.id} router={r} topo={topo} onChange={(p) => updateRouter(r.id, p)} highlight={failDevice === r.id} failField={failDevice === r.id ? failField : null} />
        ))}
      </PgCard>

      <PgCard title="Ping" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <PgSelect label="From" value={fromId} onChange={(v) => { setFromId(v); setResult(null); }} options={devices.map((d) => ({ value: d.id, label: d.name }))} />
          <PgSelect label="To" value={toId} onChange={(v) => { setToId(v); setResult(null); }} options={devices.map((d) => ({ value: d.id, label: d.name }))} />
        </div>
        <PgPredict compute={() => pgPing(topo, fromId, toId)} causes={PG_IP_CAUSES} buttonLabel={`Ping ${nameOf(toId)} from ${nameOf(fromId)}`} onResult={setResult} resetKey={JSON.stringify([topo, fromId, toId])} />
        <PgPingResult result={result} />
      </PgCard>
    </div>
  );
}

function pgIpDescribeFix(scenario, f) {
  const find = (id) => [...scenario.topology.hosts, ...scenario.topology.routers].find((d) => d.id === id);
  const who = (find(f.device) || { name: f.device }).name;
  if (f.route) return `Add a route on ${who}: network ${f.route.net}, mask ${f.route.mask}, next hop ${f.route.via}.`;
  if (f.routeIndex !== undefined) return `On ${who}, change the next hop of route ${f.routeIndex + 1} to ${f.value}.`;
  if (f.iface !== undefined) return `On ${who}, set the ${f.field} of port ${f.iface + 1} to ${f.value}.`;
  return `Set ${who}'s ${f.field === 'ip' ? 'IP address' : f.field} to ${f.value || 'none'}.`;
}

function pgIpValidTopo(t) {
  return !!t && Array.isArray(t.segments) && Array.isArray(t.hosts) && Array.isArray(t.routers) && t.hosts.length >= 2
    && t.hosts.every((h) => typeof h.id === 'string' && typeof h.name === 'string' && typeof h.ip === 'string' && typeof h.mask === 'string' && t.segments.some((s) => s.id === h.segment))
    && t.routers.every((r) => typeof r.id === 'string' && Array.isArray(r.ifaces) && Array.isArray(r.routes) && r.ifaces.every((f) => t.segments.some((s) => s.id === f.segment)));
}

function IpConfigTool({ pick, onPick }) {
  const scenarios = pgScenarios('ipconfig');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="ipconfig" makeDefault={() => pgClone(PG_SANDBOX)} validate={pgIpValidTopo} onBack={() => onPick('')}
        blurb="Break it on purpose. Give two hosts the same address, shrink a mask, remove a gateway, or add a route, then ping and read the explanation. Add hosts to any network."
        renderLab={(topo, setTopo) => <PgLab topo={topo} setTopo={setTopo} sandbox />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="ipconfig" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgPing(topo, g.from, g.to).verdict === g.verdict)}
        fixLines={(sc) => sc.fix.map((f) => pgIpDescribeFix(sc, f))}
        renderLab={(topo, setTopo, sc) => <PgLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="ipconfig" scenarios={scenarios} onPick={onPick}
      intro="Each scenario is a small network with something wrong. Ping to see the symptom, read the trace to find the first thing that breaks, change the setting, and ping again."
      sandboxText="A working network to break and fix however you like. Add hosts, export and import your setup." />
  );
}
