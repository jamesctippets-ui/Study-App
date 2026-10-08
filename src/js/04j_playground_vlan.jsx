/* ---------------- IT Playground: VLAN playground ---------------- */

// Switches with access and trunk ports, hosts, an optional router on a stick.
// Ping (ARP, then the data frames) and watch each switch decide: learn, flood,
// forward, tag, or drop. The simulation is pgVlanPing in 03b_playground_engine.js;
// guided scenarios come from data/playground.py (PLAYGROUND.vlan).

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
              <div style={{ maxWidth: '130px' }}>
                <PgField label="VLAN" value={String(p.vlan)} onChange={(v) => setPort(p.id, { vlan: /^\d+$/.test(v) ? Number(v) : v })} error={Number.isInteger(p.vlan) ? null : 'Number'} inputMode="numeric" />
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
    <PgCard title="MAC address tables" hue={COLOR.pink} right={rows.length ? <button className="btn-flat" onClick={onClear} style={{ fontSize: '12px', fontWeight: 800, color: ink(COLOR.pink) }}>Clear</button> : null}>
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
      <PgCard title="Switches and ports" hue={COLOR.blue}>
        <div style={{ fontSize: '12px', color: COLOR.muted, marginBottom: '2px' }}>Access ports carry one VLAN, untagged. Trunk ports carry several, tagged, except the native VLAN, which travels untagged.</div>
        {topo.switches.map((s) => <PgSwitchEditor key={s.id} sw={s} topo={topo} onChange={(p) => updSwitch(s.id, p)} where={where} />)}
      </PgCard>
      <PgCard title="Hosts and router" hue={COLOR.teal}>
        {topo.hosts.map((h) => <PgVlanHostEditor key={h.id} host={h} onChange={(p) => updHost(h.id, p)} hot={failHost === h.id} />)}
        {topo.routers.map((r) => <PgRouterSubifs key={r.id} router={r} onChange={(p) => updRouter(r.id, p)} hot={failHost === r.id} />)}
      </PgCard>
      <PgCard title="Ping" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          {[['From', fromId, setFromId], ['To', toId, setToId]].map(([lab, val, set]) => (
            <label key={lab} style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLOR.muted, marginBottom: '3px' }}>{lab}</span>
              <select value={val} onChange={(e) => { set(e.target.value); setResult(null); }} style={{ ...pgInputStyle(false), fontFamily: 'inherit' }}>
                {topo.hosts.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </label>
          ))}
        </div>
        <button className="btn-3d" onClick={ping} style={{ width: '100%', padding: '11px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
          Ping {nameOf(toId)} from {nameOf(fromId)}
        </button>
        <PgPingResult result={result} />
      </PgCard>
      <PgMacTables topo={topo} state={state} onClear={() => setState(pgVlanNewState())} />
    </div>
  );
}

function VlanScenario({ scenario, onBack }) {
  const [topo, setTopo] = useState(() => pgClone(scenario.topology));
  const [hintsShown, setHintsShown] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const solved = scenario.expectFixed.every((g) => pgVlanPing(topo, pgVlanNewState(), g.from, g.to).verdict === g.verdict);
  const reset = () => { setTopo(pgClone(scenario.topology)); setHintsShown(0); setShowFix(false); };
  const nameOf = (id) => [...scenario.topology.switches, ...scenario.topology.hosts, ...scenario.topology.routers].find((d) => d.id === id)?.name || id;
  const describeFix = (f) => {
    const who = nameOf(f.device);
    if (f.subif) return `Add a sub-interface on ${who}: VLAN ${f.subif.vlan}, address ${f.subif.ip}, mask ${f.subif.mask}.`;
    if (f.port) {
      const label = { vlan: 'VLAN', mode: 'mode', allowed: 'allowed VLAN list', native: 'native VLAN' }[f.field] || f.field;
      return `On ${who} ${f.port}, set the ${label} to ${Array.isArray(f.value) ? f.value.join(', ') : f.value}.`;
    }
    if (f.field === 'vlans') return `Create the missing VLANs on ${who} (it should have ${f.value.join(', ')}).`;
    return `Set ${who}'s ${f.field === 'ip' ? 'IP address' : f.field} to ${f.value || 'none'}.`;
  };
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title={scenario.title} hue={COLOR.gold} right={<span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLOR.muted }}>{PG_LEVEL_LABEL[scenario.level]}</span>}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{scenario.story}</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '6px' }}>Your job: find out what is wrong and fix it so the goal below turns green.</div>
      </PgCard>
      <PgVlanLab topo={topo} setTopo={setTopo} goals={scenario.expectFixed} defaultAsk={scenario.ask} />
      {solved && (
        <PgCard title="Fixed!" hue={COLOR.success}>
          <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{scenario.lesson}</div>
          {scenario.related && scenario.related.length > 0 && <div style={{ fontSize: '12px', color: COLOR.muted, marginTop: '8px' }}>Related study: {scenario.related.join(' · ')}</div>}
        </PgCard>
      )}
      <PgCard title="Stuck?" hue={COLOR.orange}>
        {scenario.hints.slice(0, hintsShown).map((h, i) => <div key={i} style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}><strong>Hint {i + 1}:</strong> {h}</div>)}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hintsShown < scenario.hints.length && <button className="btn-flat" onClick={() => setHintsShown(hintsShown + 1)} style={{ fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.orange}`, color: ink(COLOR.orange) }}>{hintsShown ? 'Another hint' : 'Give me a hint'}</button>}
          <button className="btn-flat" onClick={() => setShowFix(!showFix)} style={{ fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted }}>{showFix ? 'Hide the answer' : 'Show the fix'}</button>
          <button className="btn-flat" onClick={reset} style={{ fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted }}>Reset scenario</button>
        </div>
        {showFix && <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.55 }}>{scenario.fix.map((f, i) => <li key={i}>{describeFix(f)}</li>)}</ul>}
      </PgCard>
    </div>
  );
}

function VlanSandbox({ onBack }) {
  const base = (typeof PLAYGROUND !== 'undefined' && PLAYGROUND.vlanSandbox) || null;
  const [topo, setTopo] = useState(() => pgClone(base));
  if (!base) return null;
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title="Free sandbox" hue={COLOR.gold}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>A working two-switch network with two VLANs and a router on a stick. Move a port to another VLAN, trim a trunk's allowed list, change a native VLAN or turn the router port into an access port, then ping and read what each switch does.</div>
        <button className="btn-flat" onClick={() => setTopo(pgClone(base))} style={{ marginTop: '8px', fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted }}>Reset to the working network</button>
      </PgCard>
      <PgVlanLab topo={topo} setTopo={setTopo} />
    </div>
  );
}

function VlanTool() {
  const scenarios = (typeof PLAYGROUND !== 'undefined' && PLAYGROUND.vlan) || [];
  const [pick, setPick] = useState(null);
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') return <VlanSandbox onBack={() => setPick(null)} />;
  if (scenario) return <VlanScenario key={scenario.id} scenario={scenario} onBack={() => setPick(null)} />;
  const levelHue = { starter: COLOR.success, core: COLOR.blue, stretch: COLOR.orange };
  return (
    <div>
      <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginBottom: '12px' }}>
        Switches keep each VLAN in its own broadcast domain. Ping across the network and read how every switch treats the frame: learn the sender, flood or forward, add or remove the tag, or drop it and say why.
      </div>
      <button className="btn-flat" onClick={() => setPick('sandbox')}
        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '12px', padding: '14px 16px', borderRadius: '16px', background: tint(COLOR.gold, 10), border: `2px solid color-mix(in srgb, ${COLOR.gold} 45%, ${COLOR.border})`, color: COLOR.text, boxShadow: SHADOW.card }}>
        <div className="itil-display" style={{ fontSize: '15px', color: ink(COLOR.gold) }}>Free sandbox</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '3px' }}>A working network with two switches, a trunk, two VLANs and a router on a stick, with MAC address tables you can watch fill.</div>
      </button>
      {['starter', 'core', 'stretch'].map((lv) => {
        const list = scenarios.filter((s) => s.level === lv);
        if (!list.length) return null;
        return (
          <div key={lv} style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink(levelHue[lv]), margin: '10px 0 6px' }}>{PG_LEVEL_LABEL[lv]}</div>
            {list.map((s) => (
              <button key={s.id} className="btn-flat" onClick={() => setPick(s.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '8px', padding: '12px 14px', borderRadius: '14px', background: tint(levelHue[lv], 8), border: `2px solid color-mix(in srgb, ${levelHue[lv]} 38%, ${COLOR.border})`, color: COLOR.text }}>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>{s.title}</div>
                <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '2px', lineHeight: 1.45 }}>{s.goal}</div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
