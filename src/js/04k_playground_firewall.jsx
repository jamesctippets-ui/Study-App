/* ---------------- IT Playground: firewall and port forwarding ---------------- */

// A small three-zone firewall (inside, DMZ, outside): an ordered rule list with
// an implicit deny, a port-forward (destination NAT) table, source NAT, a
// stateful/stateless switch and hairpin NAT. Fire test connections and read
// which rule matched, what was translated and why a connection was blocked.
// The simulation is pgFwTest in 03b_playground_engine.js; guided scenarios come
// from data/playground.py (PLAYGROUND.firewall).

const PG_FW_ZONES = [
  { key: 'inside', label: 'Inside', hue: 'blue' },
  { key: 'dmz', label: 'DMZ', hue: 'orange' },
  { key: 'outside', label: 'Internet', hue: 'pink' },
];

function PgFwDiagram({ topo, fromId, toId, failZone }) {
  const W = 320;
  const colW = W / 3;
  const cx = (i) => (i + 0.5) * colW;
  const by = PG_FW_ZONES.map((z) => topo.hosts.filter((h) => h.zone === z.key));
  const maxHosts = Math.max(1, ...by.map((x) => x.length));
  const H = 96 + maxHosts * 38 + 6;
  const stroke = (id, base) => (id === fromId ? COLOR.blue : id === toId ? COLOR.success : base);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Firewall diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      <rect x={cx(1) - 44} y={4} width={88} height={34} rx="8" fill={COLOR.surfaceRaised} stroke={failZone === 'fw' ? COLOR.red : COLOR.gold} strokeWidth="2" />
      <text x={cx(1)} y={19} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="700">{topo.fw.name}</text>
      <text x={cx(1)} y={31} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{topo.fw.stateful ? 'stateful' : 'stateless'}{topo.fw.masquerade ? ' · NAT' : ''}</text>
      {PG_FW_ZONES.map((z, i) => (
        <g key={z.key}>
          <line x1={cx(1)} y1={38} x2={cx(i)} y2={62} stroke={COLOR.muted} strokeWidth="1.3" />
          <rect x={i * colW + 6} y={62} width={colW - 12} height={H - 66} rx="10" fill={tint(COLOR[z.hue], 8)} stroke={COLOR[z.hue]} strokeWidth="1.2" strokeDasharray="4 3" />
          <text x={cx(i)} y={78} textAnchor="middle" fill={COLOR[z.hue]} fontSize="9.5" fontWeight="800">{z.label.toUpperCase()}</text>
          {by[i].map((h, k) => (
            <g key={h.id}>
              <rect x={i * colW + 12} y={86 + k * 38} width={colW - 24} height={32} rx="7" fill={COLOR.surfaceRaised} stroke={stroke(h.id, COLOR.border)} strokeWidth={h.id === fromId || h.id === toId ? 2.4 : 1.2} />
              <text x={cx(i)} y={99 + k * 38} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="700">{h.name.length > 17 ? `${h.name.slice(0, 16)}…` : h.name}</text>
              <text x={cx(i)} y={111 + k * 38} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{h.ip}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function PgToggle({ label, hint, value, onChange, hot }) {
  return (
    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${COLOR.border}`, outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: COLOR.primary, flexShrink: 0 }} />
      <span><span style={{ fontSize: '13.5px', fontWeight: 800, display: 'block' }}>{label}</span><span style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.45 }}>{hint}</span></span>
    </label>
  );
}

function PgSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} style={{ ...pgInputStyle(false), fontFamily: 'inherit' }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const PG_ZONE_OPTS = [{ value: 'any', label: 'any' }, { value: 'inside', label: 'inside' }, { value: 'dmz', label: 'dmz' }, { value: 'outside', label: 'outside' }];
const PG_PROTO_OPTS = [{ value: 'any', label: 'any' }, { value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }, { value: 'icmp', label: 'ICMP' }];

function PgFwRules({ fw, onChange, matchedId, hotRule }) {
  const set = (i, patch) => onChange(fw.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i, d) => { const rules = fw.rules.slice(); const [r] = rules.splice(i, 1); rules.splice(i + d, 0, r); onChange(rules); };
  const nextId = () => { let n = fw.rules.length + 1; while (fw.rules.some((r) => r.id === `r${n}`)) n += 1; return `r${n}`; };
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>Checked top to bottom; the first match wins. If nothing matches, the traffic is denied.</div>
      {fw.rules.map((r, i) => {
        const hue = r.action === 'allow' ? COLOR.success : COLOR.red;
        const hot = hotRule === r.id;
        return (
          <div key={r.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', background: tint(hue, hot || matchedId === r.id ? 18 : 6), border: `2px solid ${hot ? COLOR.red : matchedId === r.id ? hue : `color-mix(in srgb, ${hue} 30%, ${COLOR.border})`}` }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '12.5px', color: ink(hue) }}>Rule {i + 1}{matchedId === r.id ? ' · matched' : ''}</strong>
              <span style={{ display: 'flex', gap: '2px' }}>
                <button className="btn-flat" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move rule ${i + 1} up`} style={{ width: '30px', height: '28px', color: COLOR.muted, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button className="btn-flat" disabled={i === fw.rules.length - 1} onClick={() => move(i, 1)} aria-label={`Move rule ${i + 1} down`} style={{ width: '30px', height: '28px', color: COLOR.muted, opacity: i === fw.rules.length - 1 ? 0.3 : 1 }}>↓</button>
                <button className="btn-flat" onClick={() => onChange(fw.rules.filter((_, j) => j !== i))} aria-label={`Delete rule ${i + 1}`} style={{ width: '30px', height: '28px', color: COLOR.muted }}>✕</button>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgSelect label="Action" value={r.action} onChange={(v) => set(i, { action: v })} options={[{ value: 'allow', label: 'Allow' }, { value: 'deny', label: 'Deny' }]} />
              <PgSelect label="Protocol" value={r.proto} onChange={(v) => set(i, { proto: v })} options={PG_PROTO_OPTS} />
              <PgSelect label="From zone" value={r.fromZone} onChange={(v) => set(i, { fromZone: v })} options={PG_ZONE_OPTS} />
              <PgSelect label="To zone" value={r.toZone} onChange={(v) => set(i, { toZone: v })} options={PG_ZONE_OPTS} />
              <PgField label="Source address" value={r.src} onChange={(v) => set(i, { src: v })} placeholder="any or 10.0.0.0/8" />
              <PgField label="Destination address" value={r.dst} onChange={(v) => set(i, { dst: v })} placeholder="any or 172.16.0.10" />
              <PgField label="Dest. port" value={r.port} onChange={(v) => set(i, { port: v })} placeholder="any, 443 or 1024-65535" />
            </div>
          </div>
        );
      })}
      <button className="btn-flat" onClick={() => onChange([...fw.rules, { id: nextId(), action: 'allow', fromZone: 'any', toZone: 'any', proto: 'tcp', src: 'any', dst: 'any', port: '443' }])}
        style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '2px 0' }}>+ Add a rule at the bottom</button>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '6px' }}>Implicit last rule: deny everything else.</div>
    </div>
  );
}

function PgFwForwards({ fw, onChange, hot }) {
  const set = (i, patch) => onChange(fw.forwards.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const nextId = () => { let n = fw.forwards.length + 1; while (fw.forwards.some((f) => f.id === `f${n}`)) n += 1; return `f${n}`; };
  return (
    <div style={{ outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px' }}>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>Traffic to the firewall's public address on a given port is passed on to an inside server (destination NAT).</div>
      {fw.forwards.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>No port forwards.</div>}
      {fw.forwards.map((f, i) => (
        <div key={f.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${COLOR.border}`, background: COLOR.surface }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
            <strong style={{ fontSize: '12.5px' }}>Forward {i + 1}</strong>
            <button className="btn-flat" onClick={() => onChange(fw.forwards.filter((_, j) => j !== i))} aria-label={`Delete forward ${i + 1}`} style={{ width: '30px', height: '28px', color: COLOR.muted }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            <PgSelect label="Protocol" value={f.proto} onChange={(v) => set(i, { proto: v })} options={[{ value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }]} />
            <PgField label="Public port" value={String(f.extPort)} onChange={(v) => set(i, { extPort: /^\d+$/.test(v) ? Number(v) : v })} inputMode="numeric" />
            <PgField label="Forward to (inside address)" value={f.toIp} onChange={(v) => set(i, { toIp: v })} inputMode="decimal" />
            <PgField label="Inside port" value={String(f.toPort)} onChange={(v) => set(i, { toPort: /^\d+$/.test(v) ? Number(v) : v })} inputMode="numeric" />
          </div>
        </div>
      ))}
      <button className="btn-flat" onClick={() => onChange([...fw.forwards, { id: nextId(), proto: 'tcp', extPort: 8080, toIp: '', toPort: 80 }])}
        style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '2px 0' }}>+ Add a port forward</button>
    </div>
  );
}

function PgFwResult({ result }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      {result.diagnosis && (
        <div style={{ padding: '10px 12px', borderRadius: '12px', background: COLOR.surface, border: `1.5px solid ${COLOR.border}`, marginBottom: '10px', fontSize: '13px', lineHeight: 1.5 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted }}>Why it failed</div>
          <div style={{ fontWeight: 800, margin: '2px 0' }}>{result.diagnosis.title}</div>
          <div>{result.diagnosis.text}</div>
          <div style={{ marginTop: '4px' }}><strong>Try:</strong> {result.diagnosis.fix}</div>
        </div>
      )}
      <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: '12.5px', lineHeight: 1.5 }}>
        {result.steps.map((st, j) => (
          <li key={j} style={{ display: 'flex', gap: '6px', marginBottom: '3px', color: st.ok ? COLOR.text : ink(COLOR.red), fontWeight: st.ok ? 400 : 700 }}>
            <span aria-hidden="true" style={{ flexShrink: 0, width: '14px', color: st.ok ? ink(COLOR.success) : ink(COLOR.red) }}>{st.ok ? '✓' : '✕'}</span>
            <span>{st.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PgFwLab({ topo, setTopo, goals, defaultAsk }) {
  const fw = topo.fw;
  const publicIp = (fw.ifaces.find((i) => i.zone === 'outside') || {}).ip || '';
  const targets = [...topo.hosts.map((h) => ({ value: h.id, label: `${h.name} (${h.ip})` })), { value: 'fw-public', label: `Firewall public address (${publicIp})` }];
  const [conn, setConn] = useState(defaultAsk || { from: topo.hosts[0].id, to: 'fw-public', proto: 'tcp', port: 443 });
  const [result, setResult] = useState(null);
  const setFw = (patch) => { setTopo({ ...topo, fw: { ...fw, ...patch } }); setResult(null); };
  const run = () => setResult(pgFwTest(topo, conn));
  const nameOf = (id) => (id === 'fw-public' ? 'the public address' : (topo.hosts.find((h) => h.id === id) || { name: id }).name);
  const goalStates = (goals || []).map((g) => ({ g, r: pgFwTest(topo, g) }));
  const diag = result && result.diagnosis;
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgFwDiagram topo={topo} fromId={conn.from} toId={conn.to} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px' }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = connecting from</span> · <span style={{ color: ink(COLOR.success) }}>green = connecting to</span>
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{nameOf(g.from)} can connect to {nameOf(g.to)}{g.proto === 'icmp' ? ' (ping)' : ` on ${g.proto.toUpperCase()} ${g.port}`}</span>
            </div>
          ))}
        </PgCard>
      )}
      <PgCard title="Firewall settings" hue={COLOR.gold}>
        <PgToggle label="Stateful inspection" hint="Remember connections so replies come back automatically. Off = a stateless packet filter that judges every packet alone." value={fw.stateful} onChange={(v) => setFw({ stateful: v })} hot={diag && diag.field === 'stateful'} />
        <PgToggle label="Source NAT (masquerade)" hint="Rewrite inside private addresses to the public address on the way out." value={fw.masquerade} onChange={(v) => setFw({ masquerade: v })} hot={diag && diag.field === 'masquerade'} />
        <PgToggle label="Hairpin NAT (NAT reflection)" hint="Let inside clients reach an inside server through the public address." value={fw.hairpin} onChange={(v) => setFw({ hairpin: v })} hot={diag && diag.field === 'hairpin'} />
      </PgCard>
      <PgCard title="Rules" hue={COLOR.blue}>
        <PgFwRules fw={fw} onChange={(rules) => setFw({ rules })} matchedId={result ? result.matched : null} hotRule={diag ? diag.ruleId : null} />
      </PgCard>
      <PgCard title="Port forwards" hue={COLOR.pink}>
        <PgFwForwards fw={fw} onChange={(forwards) => setFw({ forwards })} hot={diag && diag.field === 'forwards'} />
      </PgCard>
      <PgCard title="Test a connection" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <PgSelect label="From" value={conn.from} onChange={(v) => { setConn({ ...conn, from: v }); setResult(null); }} options={topo.hosts.map((h) => ({ value: h.id, label: h.name }))} />
          <PgSelect label="To" value={conn.to} onChange={(v) => { setConn({ ...conn, to: v }); setResult(null); }} options={targets} />
          <PgSelect label="Protocol" value={conn.proto} onChange={(v) => { setConn({ ...conn, proto: v }); setResult(null); }} options={[{ value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }, { value: 'icmp', label: 'ICMP (ping)' }]} />
          {conn.proto !== 'icmp' && <PgField label="Port" value={String(conn.port)} onChange={(v) => { setConn({ ...conn, port: v }); setResult(null); }} inputMode="numeric" />}
        </div>
        <button className="btn-3d" onClick={run} style={{ width: '100%', padding: '11px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
          Try the connection
        </button>
        <PgFwResult result={result} />
      </PgCard>
    </div>
  );
}

function FirewallScenario({ scenario, onBack }) {
  const [topo, setTopo] = useState(() => pgClone(scenario.topology));
  const [hintsShown, setHintsShown] = useState(0);
  const [showFix, setShowFix] = useState(false);
  const solved = scenario.expectFixed.every((g) => pgFwTest(topo, g).verdict === g.verdict);
  const reset = () => { setTopo(pgClone(scenario.topology)); setHintsShown(0); setShowFix(false); };
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title={scenario.title} hue={COLOR.gold} right={<span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLOR.muted }}>{PG_LEVEL_LABEL[scenario.level]}</span>}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>{scenario.story}</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '6px' }}>Your job: find out what is wrong and fix it so the goal below turns green.</div>
      </PgCard>
      <PgFwLab topo={topo} setTopo={setTopo} goals={scenario.expectFixed} defaultAsk={scenario.ask} />
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
        {showFix && <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.55 }}>{scenario.fixText.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      </PgCard>
    </div>
  );
}

function FirewallSandbox({ onBack }) {
  const base = (typeof PLAYGROUND !== 'undefined' && PLAYGROUND.firewallSandbox) || null;
  const [topo, setTopo] = useState(() => pgClone(base));
  if (!base) return null;
  return (
    <div>
      <button className="btn-flat" onClick={onBack} style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '2px 0 10px' }}>‹ All scenarios</button>
      <PgCard title="Free sandbox" hue={COLOR.gold}>
        <div style={{ fontSize: '13px', lineHeight: 1.55 }}>A working firewall with an inside network, a DMZ web server and the internet. Reorder or add rules, switch stateful inspection or NAT off, change a forward, then test connections and read which rule matched.</div>
        <button className="btn-flat" onClick={() => setTopo(pgClone(base))} style={{ marginTop: '8px', fontSize: '12.5px', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', border: `2px solid ${COLOR.border}`, color: COLOR.muted }}>Reset to the working setup</button>
      </PgCard>
      <PgFwLab topo={topo} setTopo={setTopo} />
    </div>
  );
}

function FirewallTool() {
  const scenarios = (typeof PLAYGROUND !== 'undefined' && PLAYGROUND.firewall) || [];
  const [pick, setPick] = useState(null);
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') return <FirewallSandbox onBack={() => setPick(null)} />;
  if (scenario) return <FirewallScenario key={scenario.id} scenario={scenario} onBack={() => setPick(null)} />;
  const levelHue = { starter: COLOR.success, core: COLOR.blue, stretch: COLOR.orange };
  return (
    <div>
      <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.55, marginBottom: '8px' }}>
        A firewall decides, rule by rule, what may cross between zones, and NAT decides which address a packet carries. Fire a connection and read how the firewall handled it.
      </div>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '12px' }}>
        Simplified on purpose: rules are matched against the address and port after port-forward translation, traffic inside one zone never reaches the firewall, and vendors differ in details such as where an ACL is applied.
      </div>
      <button className="btn-flat" onClick={() => setPick('sandbox')}
        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '12px', padding: '14px 16px', borderRadius: '16px', background: tint(COLOR.gold, 10), border: `2px solid color-mix(in srgb, ${COLOR.gold} 45%, ${COLOR.border})`, color: COLOR.text, boxShadow: SHADOW.card }}>
        <div className="itil-display" style={{ fontSize: '15px', color: ink(COLOR.gold) }}>Free sandbox</div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '3px' }}>A working three-zone firewall to rearrange, break and test.</div>
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
