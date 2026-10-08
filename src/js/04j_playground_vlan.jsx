/* ---------------- IT Playground: VLAN playground ---------------- */

// Switches with access and trunk ports, hosts, an optional router on a stick.
// Ping (ARP, then the data frames) and watch each switch decide: learn, flood,
// forward, tag, or drop. The simulation is pgVlanPing in 03b_playground_engine.js;
// guided scenarios come from data/playground.py (PLAYGROUND.vlan).

const PG_VLAN_CAUSES = {
  'vlan-mismatch': 'The two devices are in different VLANs',
  'vlan-not-allowed': 'A trunk does not allow the VLAN',
  'vlan-missing': 'The VLAN does not exist on a switch',
  'native-mismatch': 'The two ends of a trunk disagree on the native VLAN',
  'router-untagged': 'The port facing the router is not a trunk',
  'access-tagged': 'A tagged frame reached an access port',
  'port-security': 'Port security blocks an untrusted MAC address',
  'no-gateway': 'The host has no default gateway',
  'gateway-offsubnet': 'The gateway is outside the host\'s subnet',
  'arp-timeout': 'Nothing answers for the address (wrong address or gateway)',
  'no-route': 'The router has no sub-interface for the destination VLAN',
  'host-unreachable': 'The router cannot find the destination host in its VLAN',
  'reply-lost': 'The request arrives but the reply cannot get back',
  'bad-ip': 'A host has an invalid IP configuration',
};

const PG_VLAN_HUES = { 1: null, 10: 'blue', 20: 'orange', 30: 'pink', 40: 'teal', 99: 'gold' };

function pgVlanColor(v) {
  const names = ['blue', 'orange', 'pink', 'teal', 'gold', 'success'];
  const key = PG_VLAN_HUES[v] !== undefined ? PG_VLAN_HUES[v] : names[Number(v) % names.length];
  return key ? COLOR[key] : COLOR.muted;
}

function PgVlanDiagram({ topo, fromId, toId, where, failHost }) {
  const W = 320;
  const sws = topo.switches;
  const n = Math.max(1, sws.length);
  const colW = W / n;
  const cx = (i) => (i + 0.5) * colW;
  const swIdx = {};
  sws.forEach((s, i) => { swIdx[s.id] = i; });
  const hostsBy = sws.map((s) => topo.hosts.filter((h) => h.switch === s.id));
  const maxHosts = Math.max(1, ...hostsBy.map((x) => x.length));
  const swY = 70;
  const H = swY + 44 + maxHosts * 38 + 6;
  const hostVlan = (h) => {
    const sw = pgVlanSwitch(topo, h.switch);
    const p = pgVlanPort(sw, h.port);
    return p && p.mode === 'access' ? Number(p.vlan) : p ? Number(p.native) : 1;
  };
  const stroke = (id, base) => (id === failHost ? COLOR.red : id === fromId ? COLOR.blue : id === toId ? COLOR.success : base);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="VLAN diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      {(topo.links || []).map((l, i) => {
        const a = swIdx[l.a.switch]; const b = swIdx[l.b.switch];
        if (a === undefined || b === undefined) return null;
        const hot = where && ((where.switchId === l.a.switch && where.portId === l.a.port) || (where.switchId === l.b.switch && where.portId === l.b.port));
        return <g key={i}><line x1={cx(a) + 38} y1={swY + 14} x2={cx(b) - 38} y2={swY + 14} stroke={hot ? COLOR.red : COLOR.gold} strokeWidth={hot ? 3 : 2.2} /><text x={(cx(a) + cx(b)) / 2} y={swY + 8} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">trunk</text></g>;
      })}
      {(topo.routers || []).map((r) => {
        const i = swIdx[r.switch];
        if (i === undefined) return null;
        const hot = where && where.switchId === r.switch && r.port === where.portId;
        return (
          <g key={r.id}>
            <line x1={cx(i)} y1={30} x2={cx(i)} y2={swY} stroke={hot ? COLOR.red : COLOR.gold} strokeWidth={hot ? 3 : 2.2} />
            <rect x={cx(i) - 40} y={4} width={80} height={26} rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.muted} strokeWidth="1.3" />
            <text x={cx(i)} y={20} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="700">{r.name}</text>
          </g>
        );
      })}
      {sws.map((s, i) => (
        <g key={s.id}>
          <rect x={cx(i) - 38} y={swY} width={76} height={28} rx="7" fill={COLOR.surfaceRaised} stroke={where && where.switchId === s.id ? COLOR.red : COLOR.border} strokeWidth={where && where.switchId === s.id ? 2.4 : 1.4} />
          <text x={cx(i)} y={swY + 17} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="700">{s.name}</text>
          {hostsBy[i].map((h, k) => {
            const v = hostVlan(h);
            const y = swY + 44 + k * 38;
            return (
              <g key={h.id}>
                <line x1={cx(i)} y1={swY + 28} x2={cx(i)} y2={y} stroke={pgVlanColor(v)} strokeWidth="1.6" />
                <rect x={i * colW + 14} y={y} width={colW - 28} height={30} rx="7" fill={COLOR.surfaceRaised} stroke={stroke(h.id, pgVlanColor(v))} strokeWidth={h.id === fromId || h.id === toId || h.id === failHost ? 2.6 : 1.6} />
                <text x={cx(i)} y={y + 13} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="700">{h.name} · VLAN {v}</text>
                <text x={cx(i)} y={y + 24} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{h.ip}</text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// A comma-separated list of VLAN numbers that keeps what you type.
function PgListInput({ label, value, onChange }) {
  const [text, setText] = useState((value || []).join(','));
  const parse = (t) => t.split(',').map((x) => x.trim()).filter((x) => /^\d+$/.test(x)).map(Number).filter((n) => n >= 1 && n <= 4094);
  useEffect(() => {
    if (JSON.stringify(parse(text)) !== JSON.stringify(value || [])) setText((value || []).join(','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);
  return <PgField label={label} value={text} onChange={(t) => { setText(t); onChange(parse(t)); }} placeholder="1,10,20" inputMode="numeric" />;
}

function PgSwitchEditor({ sw, topo, onChange, where, canEditVlans }) {
  const setPort = (id, patch) => onChange({ ports: sw.ports.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  return (
    <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: '10px 0', outline: where && where.switchId === sw.id ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px' }}>
      <strong style={{ fontSize: '13.5px' }}>{sw.name}</strong>
      <div style={{ marginTop: '6px', maxWidth: '260px' }}>
        <PgListInput label="VLANs created on this switch" value={sw.vlans} onChange={(v) => onChange({ vlans: v })} />
      </div>
      {sw.ports.map((p) => {
        const host = pgVlanHostAt(topo, sw.id, p.id);
        const router = pgVlanRouterAt(topo, sw.id, p.id);
        const far = pgVlanFarEnd(topo, sw.id, p.id);
        const attached = host ? host.name : router ? router.name : far ? `${pgVlanSwitch(topo, far.switch).name} ${far.port}` : 'nothing';
        const hot = where && where.switchId === sw.id && where.portId === p.id;
        return (
          <div key={p.id} style={{ marginTop: '10px', padding: '8px', borderRadius: '10px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: hot ? tint(COLOR.red, 8) : COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800 }}>{p.id} <span style={{ fontWeight: 500, color: COLOR.muted }}>→ {attached}</span></span>
              <select value={p.mode} aria-label={`${sw.name} ${p.id} mode`}
                onChange={(e) => (e.target.value === 'trunk' ? setPort(p.id, { mode: 'trunk', allowed: p.allowed || [1, Number(p.vlan) || 10], native: p.native || 1 }) : setPort(p.id, { mode: 'access', vlan: p.vlan || 10 }))}
                style={{ ...pgInputStyle(false), fontFamily: 'inherit', width: 'auto', padding: '5px 8px', fontSize: '12.5px' }}>
                <option value="access">access</option>
                <option value="trunk">trunk</option>
              </select>
            </div>
            {p.mode === 'access' ? (
              <div>
                <div style={{ maxWidth: '130px' }}>
                  <PgField label="VLAN" value={String(p.vlan)} onChange={(v) => setPort(p.id, { vlan: /^\d+$/.test(v) ? Number(v) : v })} error={Number.isInteger(p.vlan) ? null : 'Number'} inputMode="numeric" />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, marginTop: '8px' }}>
                  <input type="checkbox" checked={!!p.secure} onChange={(e) => setPort(p.id, { secure: e.target.checked ? { max: 1, allowed: host ? [host.mac] : [], violation: 'shutdown' } : undefined })} style={{ width: '18px', height: '18px', accentColor: COLOR.primary }} />
                  Port security
                </label>
                {p.secure && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 0.8fr) minmax(0, 1.4fr)', gap: '8px', marginTop: '6px' }}>
                    <PgField label="Trusted MACs" value={(p.secure.allowed || []).join(',')} onChange={(v) => setPort(p.id, { secure: { ...p.secure, allowed: v.split(',').map((x) => x.trim()).filter(Boolean) } })} placeholder="AA:01,AA:02" />
                    <PgField label="Max" value={String(p.secure.max)} onChange={(v) => setPort(p.id, { secure: { ...p.secure, max: /^\d+$/.test(v) ? Number(v) : 1 } })} inputMode="numeric" />
                    <PgSelect label="Violation" value={p.secure.violation || 'shutdown'} onChange={(v) => setPort(p.id, { secure: { ...p.secure, violation: v } })} options={[{ value: 'shutdown', label: 'shutdown' }, { value: 'restrict', label: 'restrict' }, { value: 'protect', label: 'protect' }]} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px' }}>
                <PgListInput label="Allowed VLANs" value={p.allowed} onChange={(v) => setPort(p.id, { allowed: v })} />
                <PgField label="Native" value={String(p.native)} onChange={(v) => setPort(p.id, { native: /^\d+$/.test(v) ? Number(v) : v })} inputMode="numeric" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PgVlanHostEditor({ host, onChange, hot }) {
  return (
    <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: '8px 0', outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px' }}>
      <strong style={{ fontSize: '13px' }}>{host.name}</strong> <span style={{ fontSize: '11.5px', color: COLOR.muted }}>on {host.switch.toUpperCase()} {host.port} · MAC {host.mac}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '4px' }}>
        <PgField label="IP address" value={host.ip} onChange={(v) => onChange({ ip: v })} error={pgParseIPv4(host.ip) === null ? 'Invalid' : null} inputMode="decimal" />
        <PgField label="Mask" value={host.mask} onChange={(v) => onChange({ mask: v })} error={pgParseMask(host.mask).error ? 'Invalid' : null} inputMode="decimal" />
        <PgField label="Gateway" value={host.gateway} onChange={(v) => onChange({ gateway: v })} placeholder="none" inputMode="decimal" />
      </div>
    </div>
  );
}

function PgRouterSubifs({ router, onChange, hot }) {
  const set = (i, patch) => onChange({ subifs: router.subifs.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <div style={{ borderTop: `1px solid ${COLOR.border}`, padding: '10px 0', outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px' }}>
      <strong style={{ fontSize: '13.5px' }}>{router.name}</strong> <span style={{ fontSize: '11.5px', color: COLOR.muted }}>on {router.switch.toUpperCase()} {router.port}</span>
      {router.subifs.map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.6fr) minmax(0, 1.4fr) auto', gap: '6px', alignItems: 'end', marginTop: '6px' }}>
          <PgField label="VLAN" value={String(s.vlan)} onChange={(v) => set(i, { vlan: /^\d+$/.test(v) ? Number(v) : v })} inputMode="numeric" />
          <PgField label="Address" value={s.ip} onChange={(v) => set(i, { ip: v })} error={pgParseIPv4(s.ip) === null ? 'Invalid' : null} inputMode="decimal" />
          <PgField label="Mask" value={s.mask} onChange={(v) => set(i, { mask: v })} error={pgParseMask(s.mask).error ? 'Invalid' : null} inputMode="decimal" />
          <button className="btn-flat" aria-label="Remove sub-interface" onClick={() => onChange({ subifs: router.subifs.filter((_, j) => j !== i) })} style={{ height: '40px', width: '30px', color: COLOR.muted }}>✕</button>
        </div>
      ))}
      <button className="btn-flat" onClick={() => onChange({ subifs: [...router.subifs, { vlan: 30, ip: '', mask: '255.255.255.0' }] })} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.teal), padding: '6px 0 0' }}>+ Add a sub-interface</button>
    </div>
  );
}

function PgMacTables({ topo, state, onClear }) {
  const rows = [];
  topo.switches.forEach((s) => {
    const t = (state.mac || {})[s.id] || {};
    Object.keys(t).sort((a, b) => a - b).forEach((v) => Object.keys(t[v]).sort().forEach((mac) => {
      const dev = [...topo.hosts, ...topo.routers].find((d) => d.mac === mac);
      rows.push({ sw: s.name, vlan: v, mac, port: t[v][mac], who: dev ? dev.name : '' });
    }));
  });
  return (
    <PgCard title="MAC address tables" hue={COLOR.pink} collapsible right={rows.length ? <button className="btn-flat" onClick={onClear} style={{ fontSize: '12px', fontWeight: 800, color: ink(COLOR.pink) }}>Clear</button> : null}>
      {rows.length === 0 ? (
        <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5 }}>Empty. Switches learn which port a device is behind from the source address of each frame they see. Until then they flood. Ping to fill the tables, then ping again and watch the second pass go straight to one port.</div>
      ) : (
        <div style={{ fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.7fr 1fr 1fr', gap: '4px', color: COLOR.muted, fontWeight: 800, paddingBottom: '3px' }}><span>Switch</span><span>VLAN</span><span>MAC</span><span>Port</span></div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.9fr 0.7fr 1fr 1fr', gap: '4px', padding: '2px 0', borderTop: `1px solid ${COLOR.border}` }}>
              <span>{r.sw}</span><span style={{ color: pgVlanColor(Number(r.vlan)), fontWeight: 800 }}>{r.vlan}</span><span title={r.who}>{r.mac}</span><span>{r.port}</span>
            </div>
          ))}
        </div>
      )}
    </PgCard>
  );
}

function PgVlanLab({ topo, setTopo, goals, defaultAsk }) {
  const [fromId, setFromId] = useState(defaultAsk ? defaultAsk.from : topo.hosts[0].id);
  const [toId, setToId] = useState(defaultAsk ? defaultAsk.to : topo.hosts[1].id);
  const [state, setState] = useState(pgVlanNewState());
  const [result, setResult] = useState(null);
  const where = result && result.diagnosis ? result.diagnosis.where : null;
  const failHost = result && result.diagnosis ? result.diagnosis.deviceId : null;
  const upd = (patch) => { setTopo({ ...topo, ...patch }); setResult(null); };
  const updSwitch = (id, patch) => upd({ switches: topo.switches.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const updHost = (id, patch) => upd({ hosts: topo.hosts.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
  const updRouter = (id, patch) => upd({ routers: topo.routers.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const ping = () => { const r = pgVlanPing(topo, state, fromId, toId); setState(r.state); setResult(r); };
  const nameOf = (id) => (topo.hosts.find((h) => h.id === id) || { name: id }).name;
  const goalStates = (goals || []).map((g) => ({ g, r: pgVlanPing(topo, pgVlanNewState(), g.from, g.to) }));
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgVlanDiagram topo={topo} fromId={fromId} toId={toId} where={where} failHost={failHost} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>Each host is outlined in its VLAN's colour. Gold lines are trunks.</div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }) => (
            <div key={`${g.from}>${g.to}`} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{nameOf(g.from)} can reach {nameOf(g.to)}</span>
            </div>
          ))}
        </PgCard>
      )}
      <PgCard title="Switches and ports" hue={COLOR.blue} collapsible>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '2px' }}>Access ports carry one VLAN, untagged. Trunk ports carry several, tagged, except the native VLAN, which travels untagged.</div>
        {topo.switches.map((s) => <PgSwitchEditor key={s.id} sw={s} topo={topo} onChange={(p) => updSwitch(s.id, p)} where={where} />)}
      </PgCard>
      <PgCard title="Hosts and router" hue={COLOR.teal} collapsible>
        {topo.hosts.map((h) => <PgVlanHostEditor key={h.id} host={h} onChange={(p) => updHost(h.id, p)} hot={failHost === h.id} />)}
        {topo.routers.map((r) => <PgRouterSubifs key={r.id} router={r} onChange={(p) => updRouter(r.id, p)} hot={failHost === r.id} />)}
      </PgCard>
      <PgCard title="Ping" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <PgSelect label="From" value={fromId} onChange={(v) => { setFromId(v); setResult(null); }} options={topo.hosts.map((h) => ({ value: h.id, label: h.name }))} />
          <PgSelect label="To" value={toId} onChange={(v) => { setToId(v); setResult(null); }} options={topo.hosts.map((h) => ({ value: h.id, label: h.name }))} />
        </div>
        <PgPredict compute={() => pgVlanPing(topo, state, fromId, toId)} causes={PG_VLAN_CAUSES} buttonLabel={`Ping ${nameOf(toId)} from ${nameOf(fromId)}`}
          onResult={(r) => { setState(r.state); setResult(r); }} resetKey={JSON.stringify([topo, fromId, toId])} />
        <PgPingResult result={result} />
      </PgCard>
      <PgMacTables topo={topo} state={state} onClear={() => setState(pgVlanNewState())} />
    </div>
  );
}

function pgVlanDescribeFix(scenario, f) {
  const find = (id) => [...scenario.topology.switches, ...scenario.topology.hosts, ...scenario.topology.routers].find((d) => d.id === id);
  const who = (find(f.device) || { name: f.device }).name;
  if (f.subif) return `Add a sub-interface on ${who}: VLAN ${f.subif.vlan}, address ${f.subif.ip}, mask ${f.subif.mask}.`;
  if (f.port) {
    const label = { vlan: 'VLAN', mode: 'mode', allowed: 'allowed VLAN list', native: 'native VLAN', secure: 'port security settings' }[f.field] || f.field;
    const v = f.field === 'secure' ? `trust ${(f.value.allowed || []).join(', ')} (max ${f.value.max}, violation ${f.value.violation})` : Array.isArray(f.value) ? f.value.join(', ') : f.value;
    return `On ${who} ${f.port}, ${f.field === 'secure' ? v : `set the ${label} to ${v}`}.`;
  }
  if (f.field === 'vlans') return `Create the missing VLANs on ${who} (it should have ${f.value.join(', ')}).`;
  return `Set ${who}'s ${f.field === 'ip' ? 'IP address' : f.field} to ${f.value || 'none'}.`;
}

function pgVlanValidTopo(t) {
  return !!t && Array.isArray(t.switches) && Array.isArray(t.hosts) && Array.isArray(t.routers) && Array.isArray(t.links) && t.hosts.length >= 2
    && t.switches.every((sw) => typeof sw.id === 'string' && Array.isArray(sw.vlans) && Array.isArray(sw.ports) && sw.ports.every((p) => p.mode === 'access' || (p.mode === 'trunk' && Array.isArray(p.allowed))))
    && t.hosts.every((h) => typeof h.id === 'string' && typeof h.mac === 'string' && !!pgVlanPort(pgVlanSwitch(t, h.switch), h.port))
    && t.routers.every((r) => Array.isArray(r.subifs));
}

function VlanTool({ pick, onPick }) {
  const scenarios = pgScenarios('vlan');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="vlan" makeDefault={() => pgClone(pgData().vlanSandbox)} validate={pgVlanValidTopo} onBack={() => onPick('')}
        blurb="A working two-switch network with two VLANs and a router on a stick. Move a port to another VLAN, trim a trunk's allowed list, change a native VLAN, lock a port to one MAC address or turn the router port into an access port, then ping and read what each switch does."
        renderLab={(topo, setTopo) => <PgVlanLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="vlan" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgVlanPing(topo, pgVlanNewState(), g.from, g.to).verdict === g.verdict)}
        fixLines={(sc) => sc.fix.map((f) => pgVlanDescribeFix(sc, f))}
        renderLab={(topo, setTopo, sc) => <PgVlanLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="vlan" scenarios={scenarios} onPick={onPick}
      intro="Switches keep each VLAN in its own broadcast domain. Ping across the network and read how every switch treats the frame: learn the sender, flood or forward, add or remove the tag, or drop it and say why."
      sandboxText="A working network with two switches, a trunk, two VLANs and a router on a stick, with MAC address tables you can watch fill." />
  );
}
