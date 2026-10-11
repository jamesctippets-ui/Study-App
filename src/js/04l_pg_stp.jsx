/* ---------------- IT Playground: Spanning Tree lab ---------------- */

// Three to five switches, links with speeds, bridge priorities and MAC addresses. The lab works out the
// root bridge election, every switch's root port, the designated port on every segment and the alternate
// (or backup) ports that are held back, then draws the loop-free tree. Cut a cable and it recomputes and
// names the blocked port that starts forwarding; switch STP off in a ring and it shows the broadcast storm.
// The simulation is pgStpCompute / pgStpTest in 03c_pg_stp.js; guided scenarios come from data/playground_stp.py.

const PG_STP_PRIOS = [0, 4096, 8192, 12288, 16384, 20480, 24576, 28672, 32768, 36864, 40960, 45056, 49152, 53248, 57344, 61440]
  .map((v) => ({ value: String(v), label: `${v}${v === 32768 ? ' (default)' : ''}` }));
const PG_STP_PORT_PRIOS = [0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240].map((v) => ({ value: String(v), label: `${v}${v === 128 ? ' (default)' : ''}` }));
const PG_STP_SPEED_OPTS = [{ value: '10', label: '10 Mbps' }, { value: '100', label: '100 Mbps' }, { value: '1000', label: '1 Gbps' }, { value: '10000', label: '10 Gbps' }];
const PG_STP_SPEED_SHORT = { 10: '10M', 100: '100M', 1000: '1G', 10000: '10G' };
const PG_STP_PORT_PREFIX = { 10: 'Eth0/', 100: 'Fa0/', 1000: 'Gi0/', 10000: 'Te0/' };
const PG_STP_ROLE_HUE = { root: COLOR.blue, designated: COLOR.success, alternate: COLOR.orange, backup: COLOR.pink, off: COLOR.muted, down: COLOR.muted };
const PG_STP_ROLE_LETTER = { root: 'R', designated: 'D', alternate: 'A', backup: 'B', off: '-', down: '' };

const PG_STP_CAUSES = {
  'wrong-root': 'A switch with the wrong bridge ID won the root election',
  'rogue-root': 'A device on an edge port joined the election and won',
  'suboptimal-path': 'Path costs make traffic take the slower or longer way',
  'loop-no-stp': 'STP is off somewhere in a ring, so a loop is forwarding',
  'no-backup-root': 'No switch is set up to take over when the root fails',
  'no-redundancy': 'A switch depends on a single cable with no standby',
  partitioned: 'A link is down and part of the network is cut off',
  'no-path': 'No forwarding path connects the two switches',
};

/* ---------- layout and diagram ---------- */

function PgStpLayout(topo, res) {
  const sws = topo.switches;
  const pos = {};
  const allPos = sws.every((s) => Array.isArray(s.pos) && s.pos.length === 2);
  sws.forEach((s, i) => {
    if (allPos) pos[s.id] = [s.pos[0], s.pos[1]];
    else {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / sws.length;
      pos[s.id] = [160 + 104 * Math.cos(ang), 98 + 54 * Math.sin(ang)];
    }
  });
  (res.nodes || []).filter((n) => n.rogue).forEach((n) => {
    const e = res.edges.find((x) => x.rogueNode === n.id);
    const host = e && pos[e.sw];
    if (host) pos[n.id] = [Math.max(46, Math.min(274, host[0] + (host[0] < 160 ? -34 : 34))), host[1] + 80];
  });
  return pos;
}

function PgStpDiagram({ topo, res, hot }) {
  const ok = res.errors.length === 0;
  const pos = PgStpLayout(topo, res);
  const nodes = ok ? res.nodes : topo.switches.map((s) => ({ id: s.id, name: s.name, priority: s.priority, stp: s.stp !== false, rogue: false, isRoot: false }));
  const chips = ok ? res.edges.filter((e) => !e.rogueNode) : [];
  const maxY = Math.max.apply(null, Object.keys(pos).map((k) => pos[k][1]));
  const chipY = chips.reduce((mx, e) => Math.max(mx, pos[e.sw] ? pos[e.sw][1] + 62 : 0), 0);
  const W = 320;
  const H = Math.max(176, maxY + 26, chipY);
  const links = ok ? res.links : [];
  const groups = {};
  links.forEach((l) => {
    const a = res.portMap[l.a].sw;
    const b = res.portMap[l.b].sw;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    (groups[k] = groups[k] || []).push(l.id);
  });
  const hotNode = hot && hot.node;
  const statusStroke = { forwarding: COLOR.success, blocked: COLOR.orange, down: COLOR.muted, loop: COLOR.red };

  const marker = (p, x, y) => {
    if (!p || p.role === 'down') return null;
    const hue = PG_STP_ROLE_HUE[p.role] || COLOR.muted;
    const fwd = p.state === 'forwarding';
    return (
      <g key={p.key}>
        <rect x={x - 7} y={y - 7} width={14} height={14} rx="4" fill={tint(fwd ? COLOR.success : COLOR.orange, 22)} stroke={fwd ? COLOR.success : COLOR.orange} strokeWidth="1.6" />
        <text x={x} y={y + 3.3} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="800">{PG_STP_ROLE_LETTER[p.role]}</text>
      </g>
    );
  };

  const drawLink = (l) => {
    const pa = res.portMap[l.a];
    const pb = res.portMap[l.b];
    const A = pos[pa.sw];
    const B = pos[pb.sw];
    if (!A || !B) return null;
    const stroke = statusStroke[l.status] || COLOR.muted;
    const dash = l.status === 'blocked' ? '6 4' : l.status === 'down' ? '2 5' : undefined;
    const width = l.status === 'loop' ? 4 : l.status === 'forwarding' ? 3 : 2.4;
    if (pa.sw === pb.sw) {
      const x = A[0];
      const y = A[1];
      return (
        <g key={l.id}>
          <path d={`M ${x + 6} ${y - 17} C ${x + 6} ${y - 48}, ${x + 40} ${y - 48}, ${x + 40} ${y - 17}`} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
          {marker(pa, x + 6, y - 28)}
          {marker(pb, x + 40, y - 28)}
        </g>
      );
    }
    const k = pa.sw < pb.sw ? `${pa.sw}|${pb.sw}` : `${pb.sw}|${pa.sw}`;
    const grp = groups[k];
    const idx = grp.indexOf(l.id);
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const off = (idx - (grp.length - 1) / 2) * 14;
    const x1 = A[0] - uy * off;
    const y1 = A[1] + ux * off;
    const x2 = B[0] - uy * off;
    const y2 = B[1] + ux * off;
    const edgeDist = (vx, vy) => Math.min(vx !== 0 ? 36 / Math.abs(vx) : 999, vy !== 0 ? 17 / Math.abs(vy) : 999) + 11;
    const m = edgeDist(ux, uy);
    const m2 = edgeDist(ux, uy);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return (
      <g key={l.id}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />
        {l.up && !l.pseudo && (
          <g>
            <rect x={mx - 13} y={my - 7} width={26} height={13} rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
            <text x={mx} y={my + 3} textAnchor="middle" fill={COLOR.muted} fontSize="8.5" fontWeight="700">{PG_STP_SPEED_SHORT[l.speed]}</text>
          </g>
        )}
        {!l.up && <text x={mx} y={my + 5} textAnchor="middle" fill={COLOR.red} fontSize="15" fontWeight="900">✕</text>}
        {l.up && marker(pa, x1 + ux * m, y1 + uy * m)}
        {l.up && marker(pb, x2 - ux * m2, y2 - uy * m2)}
      </g>
    );
  };

  const drawNode = (n) => {
    const p = pos[n.id];
    if (!p) return null;
    const hotHere = hotNode === n.id;
    const stroke = hotHere ? COLOR.red : n.isRoot ? COLOR.gold : n.rogue ? COLOR.pink : !n.stp ? COLOR.red : COLOR.border;
    return (
      <g key={n.id}>
        <rect x={p[0] - 36} y={p[1] - 17} width={72} height={34} rx="9" fill={COLOR.surfaceRaised} stroke={stroke} strokeWidth={n.isRoot || hotHere ? 3 : 1.6} strokeDasharray={n.rogue || !n.stp ? '4 3' : undefined} />
        <text x={p[0]} y={p[1] - 2} textAnchor="middle" fill={COLOR.text} fontSize={n.name.length > 9 ? 9 : 10.5} fontWeight="800">{n.name.length > 13 ? `${n.name.slice(0, 12)}…` : n.name}</text>
        <text x={p[0]} y={p[1] + 10} textAnchor="middle" fill={n.isRoot ? ink(COLOR.gold) : n.stp ? COLOR.muted : COLOR.red} fontSize="8.5" fontWeight={n.isRoot || !n.stp ? 800 : 400}>{!n.stp ? 'STP OFF' : n.isRoot ? `ROOT · ${n.priority}` : `priority ${n.priority}`}</text>
      </g>
    );
  };

  const chipAt = {};
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ok ? `Network diagram. ${res.rootName ? `${res.rootName} is the root bridge.` : ''} ${res.loop ? 'A switching loop is forwarding.' : ''}` : 'Network diagram'} style={{ display: 'block', maxWidth: '440px', margin: '0 auto' }}>
      {links.map(drawLink)}
      {nodes.map(drawNode)}
      {chips.map((e) => {
        const host = pos[e.sw];
        if (!host) return null;
        chipAt[e.sw] = (chipAt[e.sw] || 0) + 1;
        const i = chipAt[e.sw] - 1;
        const cx = host[0] - 22 + i * 50;
        const cy = host[1] + 46;
        const bad = e.state === 'errdisabled';
        const label = e.device === 'pc' ? 'PC' : 'SW';
        const tags = `${e.portfast ? 'PF' : ''}${e.portfast && e.bpduGuard ? '+' : ''}${e.bpduGuard ? 'BG' : ''}`;
        return (
          <g key={e.id}>
            <line x1={host[0] + (cx - host[0]) * 0.4} y1={host[1] + 17} x2={cx} y2={cy - 9} stroke={bad ? COLOR.red : COLOR.muted} strokeWidth="1.4" strokeDasharray={bad ? '3 3' : undefined} />
            <rect x={cx - 21} y={cy - 9} width={42} height={17} rx="5" fill={COLOR.surfaceRaised} stroke={bad ? COLOR.red : COLOR.border} strokeWidth="1.2" />
            <text x={cx} y={cy + 3} textAnchor="middle" fill={bad ? COLOR.red : COLOR.text} fontSize="8.5" fontWeight="700">{bad ? `${label} ✕` : label}{tags ? ` ${tags}` : ''}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PgStpLegend() {
  const dot = (hue, dashed) => <span aria-hidden="true" style={{ display: 'inline-block', width: '16px', borderTop: `3px ${dashed ? 'dashed' : 'solid'} ${hue}`, verticalAlign: 'middle', marginRight: '4px' }} />;
  return (
    <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', lineHeight: 1.8, marginTop: '4px' }}>
      <span>{dot(COLOR.success)}forwarding</span> · <span>{dot(COLOR.orange, true)}blocked (standby)</span> · <span>{dot(COLOR.red)}loop</span> · <span style={{ whiteSpace: 'nowrap' }}>✕ cable down</span>
      <br />
      <span>R root port · D designated · A alternate · B backup · ROOT = root bridge · PF PortFast · BG BPDU Guard</span>
    </div>
  );
}

function PgStpToggle({ label, hint, value, onChange, hot }) {
  return (
    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${COLOR.border}`, outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: '8px', minHeight: '36px' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: COLOR.primary, flexShrink: 0 }} />
      <span><span style={{ fontSize: '13.5px', fontWeight: 800, display: 'block' }}>{label}</span>{hint ? <span style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.45 }}>{hint}</span> : null}</span>
    </label>
  );
}

function PgStpChip({ hue, children }) {
  return <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: 800, padding: '2px 9px', borderRadius: '999px', background: tint(hue, 16), border: `1.5px solid color-mix(in srgb, ${hue} 55%, ${COLOR.border})`, color: COLOR.text }}>{children}</span>;
}

/* ---------- the live result: roles and states of every port ---------- */

function PgStpPortRow({ res, p }) {
  const [open, setOpen] = useState(false);
  const lk = res.links.find((l) => l.id === p.link);
  const other = res.portMap[p.key === lk.a ? lk.b : lk.a];
  const peerName = (res.nodes.find((n) => n.id === other.sw) || { name: other.sw }).name;
  const self = other.sw === p.sw;
  const stateHue = p.state === 'forwarding' ? COLOR.success : p.state === 'discarding' ? COLOR.orange : COLOR.muted;
  return (
    <button className="btn-flat" onClick={() => setOpen(!open)} aria-expanded={open}
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', margin: '0 0 6px', borderRadius: '10px', background: COLOR.surface, border: `1.5px solid ${COLOR.border}`, color: COLOR.text, minHeight: '36px' }}>
      <div style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
        <strong>{p.name}</strong> to {self ? `${other.name} on the same switch` : `${peerName} ${other.name}`} <span style={{ color: COLOR.muted }}>· {PG_STP_SPEED_SHORT[lk.speed]} · cost {p.cost}{p.manualCost ? ' (manual)' : ''}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px', alignItems: 'center' }}>
        <PgStpChip hue={PG_STP_ROLE_HUE[p.role]}>{PG_STP_ROLE[p.role]}</PgStpChip>
        <PgStpChip hue={stateHue}>{p.state === 'forwarding' ? 'forwarding' : p.state === 'discarding' ? 'discarding' : p.state}</PgStpChip>
        {(p.role === 'alternate' || p.role === 'backup') && <span style={{ fontSize: '11px', color: COLOR.muted }}>classic STP: blocking</span>}
        <span aria-hidden="true" style={{ marginLeft: 'auto', fontSize: '11px', color: COLOR.muted }}>{open ? '▾ why' : '▸ why'}</span>
      </div>
      {open && <div style={{ fontSize: '12.5px', lineHeight: 1.5, marginTop: '6px', color: COLOR.text }}>{p.why}</div>}
    </button>
  );
}

function PgStpResult({ topo, res }) {
  if (res.errors.length) {
    return (
      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 800, color: ink(COLOR.red), marginBottom: '4px' }}>The setup has a problem, so no tree can be worked out:</div>
        <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc' }}>{res.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      </div>
    );
  }
  const root = res.nodes.find((n) => n.id === res.root);
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(res.loop ? COLOR.red : COLOR.gold, 14), border: `2px solid ${res.loop ? COLOR.red : COLOR.gold}`, marginBottom: '10px', fontSize: '13.5px', lineHeight: 1.45 }}>
        {root ? (
          <div><strong>Root bridge: {root.name}</strong> <span style={{ color: COLOR.muted }}>(priority {root.priority}, MAC {root.mac})</span></div>
        ) : <div><strong>No switch is running STP.</strong></div>}
        {res.multiRoot && <div style={{ marginTop: '4px', color: ink(COLOR.red), fontWeight: 700 }}>More than one root: {res.roots.map((id) => (res.nodes.find((n) => n.id === id) || { name: id }).name).join(', ')}. A switch with STP off does not pass BPDUs, so each side builds its own tree.</div>}
        {res.loop && <div style={{ marginTop: '4px', color: ink(COLOR.red), fontWeight: 700 }}>Loop: {res.loopLinks.map((id) => pgStpLinkShort(topo, id)).join(', ')} all forward, so frames can circulate forever.</div>}
        {!res.loop && <div style={{ marginTop: '4px', color: COLOR.muted, fontSize: '12.5px' }}>The forwarding ports form a loop-free tree. {res.links.filter((l) => l.status === 'blocked').length} of {res.links.length} link{res.links.length === 1 ? '' : 's'} blocked as standby.</div>}
      </div>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '8px' }}>Tap a port to see why it has that role.</div>
      {res.nodes.filter((n) => !n.rogue).map((n) => {
        const mine = res.ports.filter((p) => p.sw === n.id);
        const rp = n.rootPort ? res.portMap[n.rootPort] : null;
        return (
          <div key={n.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '5px' }}>
              <strong style={{ fontSize: '14px' }}>{n.name}</strong>
              {n.isRoot && <PgStpChip hue={COLOR.gold}>root bridge</PgStpChip>}
              {!n.stp && <PgStpChip hue={COLOR.red}>STP off</PgStpChip>}
              <span style={{ fontSize: '12px', color: COLOR.muted }}>
                {n.stp ? (n.isRoot ? 'root path cost 0' : rp ? `root port ${rp.name}, root path cost ${n.rootCost}` : 'no root port') : 'forwards on every port'} · bridge ID {n.bridgeId}
              </span>
            </div>
            {mine.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted }}>No cables connected.</div>}
            {mine.map((p) => <PgStpPortRow key={p.key} res={res} p={p} />)}
          </div>
        );
      })}
      {res.edges.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>Edge ports</div>
          {res.edges.map((e) => (
            <div key={e.id} style={{ fontSize: '12.5px', lineHeight: 1.5, marginBottom: '5px' }}>
              <strong>{pgStpName(topo, e.sw)} {e.port}</strong> ({e.name}): <span style={{ color: e.state === 'errdisabled' ? ink(COLOR.red) : ink(COLOR.success), fontWeight: 800 }}>{e.state === 'errdisabled' ? 'error-disabled' : 'forwarding'}</span>. {e.note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PgStpStorm({ res }) {
  if (!res.storm) return null;
  const max = Math.max.apply(null, res.storm.hops.map((h) => h.copies));
  return (
    <PgCard title="Broadcast storm" hue={COLOR.red}>
      <div style={{ fontSize: '13px', lineHeight: 1.55, marginBottom: '8px' }}>
        With these ports forwarding, one broadcast frame is flooded round the loop and never expires: Ethernet frames have no time-to-live. Copies of one frame in flight after each hop:
      </div>
      {res.storm.hops.map((h) => (
        <div key={h.hop} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '3px' }}>
          <span style={{ width: '44px', color: COLOR.muted }}>hop {h.hop}</span>
          <span aria-hidden="true" style={{ height: '10px', width: `${Math.max(4, Math.round((h.copies / max) * 100) * 0.6)}%`, background: COLOR.red, borderRadius: '5px' }} />
          <strong>{h.copies}</strong>
        </div>
      ))}
      <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5, marginTop: '6px' }}>
        {res.storm.growing ? 'The copies multiply at every switch that has more than two forwarding links.' : 'In a plain ring the copies keep circulating at the same count, but every new broadcast, ARP request or unknown-unicast frame adds more.'} Real networks add MAC address table flapping, and the links and switch CPUs saturate within seconds.
      </div>
    </PgCard>
  );
}

/* ---------- editors ---------- */

function PgStpSwitches({ topo, change, res, diag }) {
  const edit = (fn) => { const t = pgClone(topo); fn(t); change(t); };
  const setSw = (i, patch) => edit((t) => Object.assign(t.switches[i], patch));
  const dupMac = (s) => topo.switches.filter((x) => pgStpMacNorm(x.mac) && pgStpMacNorm(x.mac) === pgStpMacNorm(s.mac)).length > 1;
  const addSwitch = () => {
    edit((t) => {
      let n = t.switches.length + 1;
      while (t.switches.some((s) => s.id === `sw${n}`)) n += 1;
      let k = n;
      const macOf = (j) => `7a:30:00:00:00:${('0' + j.toString(16)).slice(-2)}`;
      while (t.switches.some((s) => s.mac.toLowerCase() === macOf(k))) k += 1;
      const slots = [[160, 98], [48, 98], [272, 98], [160, 150]];
      const free = slots.find((sl) => t.switches.every((s) => !s.pos || Math.abs(s.pos[0] - sl[0]) + Math.abs(s.pos[1] - sl[1]) > 60)) || slots[0];
      t.switches.push({ id: `sw${n}`, name: `Switch-${n}`, priority: 32768, mac: macOf(k), stp: true, pos: free });
    });
  };
  const removeSwitch = (i) => edit((t) => {
    const id = t.switches[i].id;
    t.switches.splice(i, 1);
    t.links = t.links.filter((l) => l.a.sw !== id && l.b.sw !== id);
    t.edges = (t.edges || []).filter((e) => e.sw !== id);
  });
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>The bridge ID is the priority followed by the MAC address; the lowest bridge ID becomes the root. Priorities are multiples of 4096, and 32768 is the default.</div>
      {topo.switches.map((s, i) => {
        const hot = diag && diag.deviceId === s.id;
        return (
          <div key={s.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '12.5px' }}>{s.name || s.id}{res.errors.length === 0 && res.root === s.id ? ' · root' : ''}</strong>
              {topo.switches.length > 3 && <button className="btn-flat" onClick={() => removeSwitch(i)} aria-label={`Remove ${s.name}`} style={{ width: '36px', height: '32px', color: COLOR.muted }}>✕</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgField label="Name" value={s.name} onChange={(v) => setSw(i, { name: v.slice(0, 12) })} error={s.name.trim() ? '' : 'Needs a name'} />
              <div style={{ outline: hot && diag.field === 'priority' ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '8px' }}>
                <PgSelect label="Bridge priority" value={String(s.priority)} onChange={(v) => setSw(i, { priority: Number(v) })} options={PG_STP_PRIOS} />
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <PgField label="MAC address" value={s.mac} onChange={(v) => setSw(i, { mac: v })} error={pgStpMacError(s.mac) || (dupMac(s) ? 'Another switch has this MAC' : '')} />
            </div>
            <PgStpToggle label="Spanning tree enabled" hint="Off = the switch sends no BPDUs and forwards on every port (this lab's simplified model)." value={s.stp !== false} onChange={(v) => setSw(i, { stp: v })} hot={hot && diag.field === 'stp'} />
          </div>
        );
      })}
      {topo.switches.length < 5 && <button className="btn-flat" onClick={addSwitch} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add a switch (up to 5)</button>}
    </div>
  );
}

function PgStpNextPort(t, swId, speed, start) {
  const used = {};
  t.links.forEach((l) => ['a', 'b'].forEach((side) => { if (l[side].sw === swId) used[pgStpPortNum(l[side].port)] = true; }));
  (t.edges || []).forEach((e) => { if (e.sw === swId) used[pgStpPortNum(e.port)] = true; });
  let n = start || 1;
  while (used[n]) n += 1;
  return `${PG_STP_PORT_PREFIX[speed] || 'Gi0/'}${n}`;
}

function PgStpLinks({ topo, change, res, diag }) {
  const edit = (fn) => { const t = pgClone(topo); fn(t); change(t); };
  const [addA, setAddA] = useState(topo.switches[0].id);
  const [addB, setAddB] = useState(topo.switches[1] ? topo.switches[1].id : topo.switches[0].id);
  const [addSpeed, setAddSpeed] = useState('1000');
  const swName = (id) => pgStpName(topo, id);
  const swOpts = topo.switches.map((s) => ({ value: s.id, label: s.name }));
  const addLink = () => edit((t) => {
    let n = t.links.length + 1;
    while (t.links.some((l) => l.id === `l${n}`)) n += 1;
    const speed = Number(addSpeed);
    const a = t.switches.some((s) => s.id === addA) ? addA : t.switches[0].id;
    const b = t.switches.some((s) => s.id === addB) ? addB : t.switches[0].id;
    const link = { id: `l${n}`, speed, disabled: false, a: { sw: a, port: PgStpNextPort(t, a, speed), cost: null, prio: null }, b: { sw: b, port: 'tmp', cost: null, prio: null } };
    t.links.push(link);
    link.b.port = PgStpNextPort(t, b, speed);
  });
  const setEnd = (i, side, patch) => edit((t) => Object.assign(t.links[i][side], patch));
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>
        A port's cost comes from the link speed unless you type one. A switch adds the cost of the port a BPDU arrives on, so what matters is the cost on the end facing the root.
      </div>
      {topo.links.map((l, i) => {
        const lr = res.errors.length === 0 ? res.links.find((x) => x.id === l.id) : null;
        const hotDown = diag && diag.field === 'disabled' && l.disabled;
        return (
          <div key={l.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${l.disabled ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '6px' }}>
              <strong style={{ fontSize: '12.5px', lineHeight: 1.35 }}>{swName(l.a.sw)} {l.a.port} ↔ {swName(l.b.sw)} {l.b.port}{lr ? ` · ${lr.status}` : ''}</strong>
              <button className="btn-flat" onClick={() => edit((t) => t.links.splice(i, 1))} aria-label={`Remove the cable ${swName(l.a.sw)} to ${swName(l.b.sw)}`} style={{ width: '36px', height: '32px', color: COLOR.muted, flexShrink: 0 }}>✕</button>
            </div>
            <PgSelect label="Speed" value={String(l.speed)} onChange={(v) => edit((t) => { t.links[i].speed = Number(v); })} options={PG_STP_SPEED_OPTS} />
            <PgStpToggle label="Cable is up" hint="Untick to cut the cable (or shut the port). Everything is recomputed." value={!l.disabled} onChange={(v) => edit((t) => { t.links[i].disabled = !v; })} hot={hotDown} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '6px' }}>
              {['a', 'b'].map((side) => {
                const e = l[side];
                const auto = (PG_STP_COST[topo.costTable] || PG_STP_COST.short)[l.speed];
                const hot = diag && diag.field === 'cost' && diag.deviceId === e.sw && e.cost;
                return (
                  <div key={side} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: COLOR.muted, marginBottom: '4px' }}>{swName(e.sw)} {e.port}</div>
                    <div style={{ outline: hot ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '8px' }}>
                      <PgField label="Cost" value={e.cost == null ? '' : String(e.cost)} placeholder={`auto (${auto})`} inputMode="numeric"
                        onChange={(v) => { const d = v.replace(/[^0-9]/g, '').slice(0, 9); setEnd(i, side, { cost: d === '' ? null : Number(d) }); }}
                        error={e.cost != null && !(e.cost >= 1 && e.cost <= 200000000) ? 'Use 1 or more' : ''} />
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <PgSelect label="Port priority" value={String(e.prio == null ? 128 : e.prio)} onChange={(v) => setEnd(i, side, { prio: Number(v) === 128 ? null : Number(v) })} options={PG_STP_PORT_PRIOS} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {topo.links.length < 10 && (
        <div style={{ padding: '8px 10px', borderRadius: '12px', border: `2px dashed ${COLOR.border}` }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '6px' }}>Add a cable</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '8px' }}>
            <PgSelect label="From" value={addA} onChange={setAddA} options={swOpts} />
            <PgSelect label="To" value={addB} onChange={setAddB} options={swOpts} />
            <PgSelect label="Speed" value={addSpeed} onChange={setAddSpeed} options={PG_STP_SPEED_OPTS} />
          </div>
          <button className="btn-flat" onClick={addLink} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), minHeight: '36px' }}>+ Add this cable{addA === addB ? ' (both ends on the same switch)' : ''}</button>
        </div>
      )}
    </div>
  );
}

// An unused MAC address from the documentation range, for a switch plugged into an edge port.
function PgStpFreshMac(t) {
  const used = {};
  t.switches.forEach((s) => { used[String(s.mac).toLowerCase()] = true; });
  (t.edges || []).forEach((e) => { if (e.rogue && e.rogue.mac) used[String(e.rogue.mac).toLowerCase()] = true; });
  let k = 99;
  const mac = (j) => `00:00:5e:00:53:${('0' + j.toString(16)).slice(-2)}`;
  while (used[mac(k)]) k += 1;
  return mac(k);
}

function PgStpEdges({ topo, change, diag }) {
  const edit = (fn) => { const t = pgClone(topo); fn(t); change(t); };
  const edges = topo.edges || [];
  const set = (i, patch) => edit((t) => Object.assign(t.edges[i], patch));
  const add = () => edit((t) => {
    t.edges = t.edges || [];
    let n = t.edges.length + 1;
    while (t.edges.some((e) => e.id === `e${n}`)) n += 1;
    const sw = t.switches[0].id;
    t.edges.push({ id: `e${n}`, sw, port: PgStpNextPort(t, sw, 100, 10), name: `Device ${n}`, device: 'pc', portfast: false, bpduGuard: false, rogue: { priority: 32768, mac: PgStpFreshMac(t) } });
  });
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>
        Edge ports face end devices. PortFast sends the port straight to forwarding. BPDU Guard shuts the port down (error-disabled) if a BPDU ever arrives, which is what you want when someone plugs in a switch. Set the device to Switch to see what a switch on an edge port does to the election.
      </div>
      {edges.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>No edge ports yet.</div>}
      {edges.map((e, i) => {
        const hot = diag && diag.deviceId === e.id;
        return (
          <div key={e.id} style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '12.5px' }}>{pgStpName(topo, e.sw)} {e.port}</strong>
              <button className="btn-flat" onClick={() => edit((t) => t.edges.splice(i, 1))} aria-label={`Remove edge port ${e.port}`} style={{ width: '36px', height: '32px', color: COLOR.muted }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgSelect label="On switch" value={e.sw} onChange={(v) => edit((t) => { t.edges[i].sw = v; t.edges[i].port = PgStpNextPort(t, v, 100, 10); })} options={topo.switches.map((s) => ({ value: s.id, label: s.name }))} />
              <PgSelect label="Device" value={e.device} onChange={(v) => edit((t) => { t.edges[i].device = v; if (v === 'switch' && !(t.edges[i].rogue && pgStpMacNorm(t.edges[i].rogue.mac))) t.edges[i].rogue = { priority: 32768, mac: PgStpFreshMac(t) }; })} options={[{ value: 'pc', label: 'PC or printer' }, { value: 'switch', label: 'Switch' }]} />
            </div>
            <div style={{ marginTop: '8px' }}><PgField label="Name" value={e.name} onChange={(v) => set(i, { name: v.slice(0, 18) })} /></div>
            {e.device === 'switch' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
                <PgSelect label="Its bridge priority" value={String((e.rogue || {}).priority == null ? 32768 : e.rogue.priority)} onChange={(v) => edit((t) => { t.edges[i].rogue = Object.assign({}, t.edges[i].rogue, { priority: Number(v) }); })} options={PG_STP_PRIOS} />
                <PgField label="Its MAC address" value={(e.rogue || {}).mac || ''} onChange={(v) => edit((t) => { t.edges[i].rogue = Object.assign({}, t.edges[i].rogue, { mac: v }); })} error={pgStpMacError((e.rogue || {}).mac)} />
              </div>
            )}
            <PgStpToggle label="PortFast" hint="Straight to forwarding, no listening and learning wait." value={e.portfast} onChange={(v) => set(i, { portfast: v })} />
            <PgStpToggle label="BPDU Guard" hint="Error-disable the port if a BPDU arrives." value={e.bpduGuard} onChange={(v) => set(i, { bpduGuard: v })} hot={hot && diag.field === 'bpduGuard'} />
          </div>
        );
      })}
      {edges.length < 4 && <button className="btn-flat" onClick={add} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add an edge port</button>}
    </div>
  );
}

/* ---------- checks ---------- */

const PG_STP_ASKS = [
  { value: 'health', label: 'Is the network healthy?' },
  { value: 'root', label: 'Is a chosen switch the root bridge?' },
  { value: 'backup-root', label: 'Would a chosen switch take over if the root failed?' },
  { value: 'path', label: 'Which way does traffic go between two switches?' },
  { value: 'survive', label: 'Does it survive losing one cable?' },
  { value: 'redundant', label: 'Can any single cable failure cut a switch off?' },
  { value: 'no-loop', label: 'Is there a switching loop?' },
  { value: 'forwarding', label: 'Is a chosen cable forwarding?' },
];

function PgStpAskDefault(kind, topo) {
  const sw = topo.switches;
  const first = sw[0].id;
  const second = (sw[1] || sw[0]).id;
  const link = topo.links.length ? topo.links[0].id : '';
  if (kind === 'root') return { check: 'root', switch: first };
  if (kind === 'backup-root') return { check: 'backup-root', switch: second };
  if (kind === 'path') return { check: 'path', from: sw[sw.length - 1].id, to: first };
  if (kind === 'survive') return { check: 'survive', link };
  if (kind === 'forwarding') return { check: 'forwarding', link };
  return { check: kind };
}

function PgStpAskFix(ask, topo) {
  // keep the question valid after switches or links were removed
  const ids = topo.switches.map((s) => s.id);
  const lids = topo.links.map((l) => l.id);
  const a = Object.assign({}, ask);
  ['switch', 'from', 'to'].forEach((k) => { if (k in a && ids.indexOf(a[k]) < 0) a[k] = ids[0]; });
  ['link', 'via'].forEach((k) => { if (k in a && lids.indexOf(a[k]) < 0) { if (k === 'via') delete a.via; else a[k] = lids[0] || ''; } });
  return a;
}

function PgStpOutcomeView({ result }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      <PgDiagnosis diagnosis={result.diagnosis} heading="Why it failed" />
      <PgSteps steps={result.steps} />
    </div>
  );
}

function PgStpCheck({ topo, defaultAsk, onDiag, resetToken }) {
  const [ask, setAsk] = useState(defaultAsk || { check: 'health' });
  const [result, setResult] = useState(null);
  const a = PgStpAskFix(ask, topo);
  const swOpts = topo.switches.map((s) => ({ value: s.id, label: s.name }));
  const linkOpts = topo.links.map((l) => ({ value: l.id, label: pgStpLinkShort(topo, l.id) + (topo.links.filter((x) => pgStpLinkShort(topo, x.id) === pgStpLinkShort(topo, l.id)).length > 1 ? ` (${l.a.port})` : '') }));
  useEffect(() => { setResult(null); if (onDiag) onDiag(null); }, [resetToken]);
  const setKind = (k) => { setAsk(PgStpAskDefault(k, topo)); setResult(null); if (onDiag) onDiag(null); };
  const setField = (patch) => { setAsk(Object.assign({}, a, patch)); setResult(null); if (onDiag) onDiag(null); };
  return (
    <div>
      <PgSelect label="What do you want to check?" value={a.check} onChange={setKind} options={PG_STP_ASKS} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', margin: '10px 0' }}>
        {(a.check === 'root' || a.check === 'backup-root') && <PgSelect label="Switch" value={a.switch} onChange={(v) => setField({ switch: v })} options={swOpts} />}
        {a.check === 'path' && <PgSelect label="From" value={a.from} onChange={(v) => setField({ from: v })} options={swOpts} />}
        {a.check === 'path' && <PgSelect label="To" value={a.to} onChange={(v) => setField({ to: v })} options={swOpts} />}
        {a.check === 'path' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <PgSelect label="Should use this cable (optional)" value={a.via || ''} onChange={(v) => { const n = Object.assign({}, a); if (v) n.via = v; else delete n.via; setAsk(n); setResult(null); if (onDiag) onDiag(null); }} options={[{ value: '', label: 'Any: just show the path' }].concat(linkOpts)} />
          </div>
        )}
        {(a.check === 'survive' || a.check === 'forwarding') && <PgSelect label="Cable" value={a.link} onChange={(v) => setField({ link: v })} options={linkOpts} />}
      </div>
      <PgPredict compute={() => pgStpTest(topo, a)} causes={PG_STP_CAUSES} buttonLabel="Check it"
        onResult={(r) => { setResult(r); if (onDiag) onDiag(r.diagnosis); }} resetKey={JSON.stringify([topo, a])} />
      <PgStpOutcomeView result={result} />
    </div>
  );
}

/* ---------- the lab ---------- */

function PgStpLab({ topo, setTopo, goals, defaultAsk }) {
  const res = useMemo(() => pgStpCompute(topo), [topo]);
  const [before, setBefore] = useState(null);
  const [diag, setDiag] = useState(null);
  const change = (next) => { setBefore({ forTopo: next, res }); setTopo(next); setDiag(null); };
  const diff = before && before.forTopo === topo ? pgStpDiff(before.res, res) : [];
  const goalStates = (goals || []).map((g) => ({ g, r: pgStpTest(topo, g) }));
  const cutLabel = (l) => {
    const short = pgStpLinkShort(topo, l.id);
    return topo.links.filter((x) => pgStpLinkShort(topo, x.id) === short).length > 1 ? `${short} (${l.a.port})` : short;
  };
  const toggleCut = (id) => { const t = pgClone(topo); const l = t.links.find((x) => x.id === id); l.disabled = !l.disabled; change(t); };
  const hot = diag ? { node: diag.deviceId } : null;
  return (
    <div>
      <PgCard title="The network" hue={COLOR.orange}>
        <PgStpDiagram topo={topo} res={res} hot={hot} />
        <PgStpLegend />
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, margin: '12px 0 6px' }}>Cut or restore a cable</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {topo.links.map((l) => (
            <button key={l.id} className="btn-flat" aria-pressed={!!l.disabled} onClick={() => toggleCut(l.id)}
              style={{ ...pgPillStyle, minHeight: '36px', fontSize: '12px', padding: '6px 10px', border: `2px solid ${l.disabled ? COLOR.red : COLOR.border}`, background: l.disabled ? tint(COLOR.red, 16) : 'transparent', color: l.disabled ? ink(COLOR.red) : COLOR.text }}>
              {l.disabled ? '✕ ' : '✂ '}{cutLabel(l)}
            </button>
          ))}
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, r }, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: r.verdict === g.verdict ? ink(COLOR.success) : COLOR.muted }}>{r.verdict === g.verdict ? '✓' : '○'}</span>
              <span>{pgStpGoalText(topo, g)}</span>
            </div>
          ))}
        </PgCard>
      )}
      <PgCard title="Check the design" hue={COLOR.success}>
        <PgStpCheck topo={topo} defaultAsk={defaultAsk} onDiag={setDiag} resetToken={JSON.stringify(topo)} />
      </PgCard>
      {diff.length > 0 && (
        <PgCard title="What changed" hue={COLOR.pink}>
          <ul style={{ margin: 0, paddingLeft: '18px', listStyle: 'disc', fontSize: '13px', lineHeight: 1.55 }}>
            {diff.map((d, i) => <li key={i} style={{ fontWeight: d.kind === 'unblocked' ? 800 : 400, color: d.kind === 'unblocked' ? ink(COLOR.success) : COLOR.text }}>{d.text}</li>)}
          </ul>
          {diff.some((d) => d.kind === 'unblocked') && (
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5, marginTop: '8px' }}>
              Timing: with default timers, classic STP needs about 30 seconds (listening 15 s, then learning 15 s) before a port that was blocking forwards, and up to about 50 seconds when the failure is not on a directly connected link (max age 20 s first). RSTP lets an alternate port take over in about a second on point-to-point links. This lab shows the end result, not the timing.
            </div>
          )}
        </PgCard>
      )}
      <PgCard title="Spanning tree result" hue={COLOR.orange}>
        <PgStpResult topo={topo} res={res} />
      </PgCard>
      <PgStpStorm res={res} />
      {res.errors.length === 0 && (
        <PgCard title="How it was worked out" hue={COLOR.blue} collapsible defaultOpen={false}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>1. Root bridge election</div>
          <PgSteps steps={res.trace.election} />
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, margin: '10px 0 4px' }}>2. Root port on every other switch</div>
          <PgSteps steps={res.trace.rootPorts} />
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, margin: '10px 0 4px' }}>3. Designated port on every segment</div>
          <PgSteps steps={res.trace.segments} />
        </PgCard>
      )}
      <PgCard title="Switches" hue={COLOR.blue} collapsible>
        <PgStpSwitches topo={topo} change={change} res={res} diag={diag} />
      </PgCard>
      <PgCard title="Cables" hue={COLOR.teal} collapsible defaultOpen={false}>
        <PgStpLinks topo={topo} change={change} res={res} diag={diag} />
      </PgCard>
      {(topo.edges || []).length > 0 || !goals ? (
        <PgCard title="Edge ports" hue={COLOR.pink} collapsible defaultOpen={false}>
          <PgStpEdges topo={topo} change={change} diag={diag} />
        </PgCard>
      ) : null}
      <PgCard title="Path cost method" hue={COLOR.gold} collapsible defaultOpen={false}>
        <PgSelect label="Cost table used by every switch" value={topo.costTable} onChange={(v) => { const t = pgClone(topo); t.costTable = v; change(t); }}
          options={[{ value: 'short', label: 'Short (classic 802.1D)' }, { value: 'long', label: 'Long (802.1t / RSTP)' }]} />
        <div style={{ fontSize: '12.5px', lineHeight: 1.55, marginTop: '8px' }}>
          <div><strong>Short</strong> (IEEE 802.1D-1998): 10 Mbps = 100, 100 Mbps = 19, 1 Gbps = 4, 10 Gbps = 2.</div>
          <div><strong>Long</strong> (IEEE 802.1t, kept in 802.1D-2004): 10 Mbps = 2,000,000, 100 Mbps = 200,000, 1 Gbps = 20,000, 10 Gbps = 2,000.</div>
          <div style={{ color: COLOR.muted, marginTop: '4px' }}>The short table cannot tell fast links apart beyond 10 Gbps, which is why the long values exist. Every switch in the domain should use the same method, or costs are not comparable.</div>
        </div>
      </PgCard>
      <PgCard title="Cheat sheet: election, roles and states" hue={COLOR.success} collapsible defaultOpen={false}>
        <div style={{ fontSize: '12.5px', lineHeight: 1.6 }}>
          <div><strong>Bridge ID</strong> = priority (default 32768) then MAC address. The lowest wins the root election; the MAC only matters when priorities tie.</div>
          <div style={{ marginTop: '6px' }}><strong>Root port</strong> (one per non-root switch): the port with the lowest total path cost to the root. Ties: lowest sender bridge ID, then lowest sender port ID, then lowest local port ID.</div>
          <div style={{ marginTop: '6px' }}><strong>Designated port</strong> (one per segment): the port offering the lowest root path cost on that cable; ties go to the lower bridge ID, then the lower port ID. Every port on the root bridge is designated.</div>
          <div style={{ marginTop: '6px' }}><strong>Alternate port</strong> (RSTP): a standby path to the root through another switch. <strong>Backup port</strong> (RSTP): a spare connection to a segment this switch already has a designated port on, such as a cable between two ports of the same switch. Classic STP does not name these: it just blocks them.</div>
          <div style={{ marginTop: '6px' }}><strong>States.</strong> RSTP: discarding, learning, forwarding. Classic STP: blocking, listening, learning, forwarding. A blocking or discarding port still receives BPDUs but carries no user traffic.</div>
        </div>
      </PgCard>
    </div>
  );
}

function PgStpValidTopo(t) { return !!t && Array.isArray(t.switches) && Array.isArray(t.links) && pgStpValidate(t).length === 0; }

function StpTool({ pick, onPick }) {
  const scenarios = pgScenarios('stp');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="stp" makeDefault={() => pgClone(pgData().stpSandbox)} validate={PgStpValidTopo} onBack={() => onPick('')}
        blurb="A healthy campus block: two cores with priorities 4096 and 8192, two access switches on dual uplinks and two edge ports. Change a priority, a speed, a cost or a cable, cut a link, switch STP off on a switch, or plug a switch into a wall socket, and read what every port does."
        renderLab={(topo, setTopo) => <PgStpLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="stp" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgStpTest(topo, g).verdict === g.verdict)}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgStpLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="stp" scenarios={scenarios} onPick={onPick}
      intro="Switches elect a root bridge, every other switch picks its cheapest path to it, and the ports that would close a loop are held back. Change priorities, speeds and cables, then read the role and state of every port."
      note="Simplified on purpose: one VLAN and one spanning tree, and only the converged result is worked out (no BPDU timing; the usual classic and rapid convergence times are given in the text). Costs follow the IEEE 802.1D tables, short or long. MAC addresses are made up. A switch with STP off is modelled as sending and passing no BPDUs and forwarding on every port; real devices differ."
      sandboxText="A working two-core campus block with dual-homed access switches, to break and repair." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'stp',
  label: 'Spanning Tree lab',
  hue: COLOR.orange,
  blurb: 'Switches, priorities, MAC addresses and link costs. See the root bridge election, each root, designated and blocked port, cut a cable to watch a blocked port take over, and switch STP off in a ring to see a broadcast storm.',
  Component: StpTool,
});
