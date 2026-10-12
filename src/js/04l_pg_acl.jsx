/* ---------------- IT Playground: ACL lab ---------------- */

// A small routed network (one or two routers, LANs, a few hosts) with Cisco IOS-style
// IPv4 access lists. Edit the ACL entries (permit or deny, protocol, source, destination,
// ports, sequence number), choose which interface applies which ACL in which direction,
// then send a test packet and read the trace: the route, the inbound ACL, the outbound
// ACL, entry by entry, and the reply on its way back. The simulation is pgAclTest in
// 03c_pg_acl.js; the guided scenarios come from data/playground_acl.py
// (PLAYGROUND.acl, PLAYGROUND.aclSandbox).

const PG_ACL_UI_BLOCK_CODES = ['explicit-deny', 'implicit-deny', 'shadowed-permit', 'standard-acl-broad', 'reply-blocked'];
const PG_ACL_UI_STATE_HUE = { allowed: COLOR.success, blocked: COLOR.red, skipped: COLOR.muted };
const PG_ACL_UI_MONO = 'var(--font-mono)';
const PG_ACL_UI_ENTRY_PROTOS = [{ value: 'ip', label: 'ip (any protocol)' }, { value: 'tcp', label: 'tcp' }, { value: 'udp', label: 'udp' }, { value: 'icmp', label: 'icmp' }];
const PG_ACL_UI_ICMP = [{ value: 'any', label: 'any ICMP message' }, { value: 'echo', label: 'echo (ping request)' }, { value: 'echo-reply', label: 'echo-reply (ping answer)' }];
const PG_ACL_UI_LABEL = { display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' };

const PG_ACL_CAUSES = {
  'explicit-deny': 'A deny entry matches the packet',
  'implicit-deny': 'No entry matches, so the invisible deny at the end drops it',
  'shadowed-permit': 'A broad deny sits above a more specific permit',
  'standard-acl-broad': 'A standard ACL drops everything from that source',
  'reply-blocked': 'The request passes but a stateless ACL blocks the reply',
  'no-route': 'The router has no route to the destination',
  'no-gateway': 'The host has no working default gateway',
};

/* ---------- small helpers ---------- */

function pgAclUiName(topo, id) {
  const h = pgAclHost(topo, id);
  if (h) return h.name;
  const r = pgAclRouter(topo, id);
  if (r) return r.name;
  const f = pgAclIfaceById(topo, id);
  return f ? `${f.router.name} ${f.iface.name}` : String(id);
}
function pgAclUiWhat(g) { return g.proto === 'icmp' ? 'ping' : `${String(g.proto).toUpperCase()} ${g.port}`; }

// A goal holds when the engine gives the wanted verdict. A "blocked" goal needs a real ACL block,
// not a broken route or an invalid entry.
function pgAclUiGoalMet(topo, g) {
  const r = pgAclTest(topo, g);
  if (r.verdict !== g.verdict) return false;
  return g.verdict === 'success' || (!!r.diagnosis && PG_ACL_UI_BLOCK_CODES.indexOf(r.diagnosis.code) >= 0);
}
function pgAclUiGoalText(topo, g) {
  return g.verdict === 'success'
    ? `${pgAclUiName(topo, g.from)} can reach ${pgAclUiName(topo, g.to)} (${pgAclUiWhat(g)})`
    : `${pgAclUiName(topo, g.from)} is blocked from ${pgAclUiName(topo, g.to)} (${pgAclUiWhat(g)})`;
}

function pgAclUiShort(text, n) { const s = String(text == null ? '' : text); return s.length > n ? `${s.slice(0, n - 1)}…` : s; }

/* ---------- the diagram ---------- */

function PgAclDiagram({ topo, fromId, toId, result }) {
  const W = 320;
  const routers = topo.routers;
  // LAN segments (interfaces that no other router shares) and router-to-router links
  const cols = []; const links = [];
  routers.forEach((r) => r.interfaces.forEach((i) => {
    const n = pgAclIfaceNet(i);
    const peer = routers.filter((o) => o.id !== r.id).map((o) => ({ o, pi: o.interfaces.find((x) => { const m = pgAclIfaceNet(x); return m.net === n.net && Number(x.prefix) === Number(i.prefix); }) })).find((x) => x.pi);
    if (peer) { if (routers.indexOf(r) < routers.indexOf(peer.o)) links.push({ a: { r, i }, b: { r: peer.o, i: peer.pi }, n }); }
    else cols.push({ r, i, n, hosts: topo.hosts.filter((h) => pgSameSubnet(n.ipN, Number(i.prefix), pgParseIPv4(h.ip))) });
  }));
  const nCols = Math.max(1, cols.length);
  const colW = W / nCols;
  const cx = (k) => (k + 0.5) * colW;
  const RW = routers.length > 1 ? 84 : 112; const RY = 4; const RH = 38;
  const rx = {};
  routers.forEach((r) => { const ks = cols.map((c, k) => (c.r.id === r.id ? k : -1)).filter((k) => k >= 0); rx[r.id] = ks.length ? ks.reduce((s, k) => s + cx(k), 0) / ks.length : W / 2; });
  const SEG_Y = 96;
  const maxHosts = Math.max(1, ...cols.map((c) => c.hosts.length));
  const H = SEG_Y + 40 + maxHosts * 36 + 4;
  // what the last test did at each interface and direction
  const ifState = {};
  if (result) {
    result.hops.forEach((h) => {
      ['in', 'out'].forEach((d) => {
        const s = h[d] && h[d].state;
        if (!s || s === 'none') return;
        const key = `${h.router}|${d === 'in' ? h.ingress : h.egress}|${d}`;
        if (s === 'blocked' || !ifState[key]) ifState[key] = s;
      });
    });
  }
  const gate = (key, x, y, dir, ifc, rid) => {
    const name = dir === 'in' ? ifc.aclIn : ifc.aclOut;
    if (!name) return null;
    const st = ifState[`${rid}|${ifc.id}|${dir}`];
    const hue = st ? PG_ACL_UI_STATE_HUE[st] : COLOR.blue;
    return (
      <g key={key}>
        <rect x={x - 11} y={y - 6} width="22" height="12" rx="3" fill={tint(hue, 24)} stroke={hue} strokeWidth="1.3" />
        <text x={x} y={y + 3} textAnchor="middle" fontSize="7.5" fontWeight="800" fill={COLOR.text}>{dir}</text>
      </g>
    );
  };
  const routerStroke = (r) => (r.id === fromId ? COLOR.blue : (pgAclIfaceById(topo, toId) || { router: {} }).router.id === r.id ? COLOR.success : COLOR.border);
  const applied = [];
  routers.forEach((r) => r.interfaces.forEach((i) => { if (i.aclIn) applied.push(`${r.name} ${i.name} in: ${i.aclIn}`); if (i.aclOut) applied.push(`${r.name} ${i.name} out: ${i.aclOut}`); }));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Network diagram with routers, LANs and the interfaces that have an ACL applied" style={{ display: 'block', maxWidth: '440px', margin: '0 auto' }}>
        {cols.map((c, k) => {
          const x1 = rx[c.r.id]; const y1 = RY + RH; const x2 = cx(k); const y2 = SEG_Y;
          const at = (t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
          const [ox, oy] = at(0.3); const [ix, iy] = at(0.7);
          return (
            <g key={c.i.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLOR.muted} strokeWidth="1.3" />
              <rect x={k * colW + 5} y={SEG_Y} width={colW - 10} height={H - SEG_Y - 4} rx="9" fill={tint(COLOR.teal, 7)} stroke={COLOR.teal} strokeWidth="1.1" strokeDasharray="4 3" />
              <text x={cx(k)} y={SEG_Y + 13} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="800">{c.i.name}<tspan dx="4" fontWeight="600">{pgAclUiShort(c.i.desc || '', Math.floor((colW - 12) / 4.6) - c.i.name.length - 1)}</tspan></text>
              <text x={cx(k)} y={SEG_Y + 24} textAnchor="middle" fill={COLOR.muted} fontSize="8">{pgIpToString(c.n.net)}/{c.i.prefix}</text>
              {gate(`o${k}`, ox, oy, 'out', c.i, c.r.id)}
              {gate(`i${k}`, ix, iy, 'in', c.i, c.r.id)}
              {c.hosts.map((h, m) => (
                <g key={h.id}>
                  <rect x={k * colW + 11} y={SEG_Y + 32 + m * 36} width={colW - 22} height={31} rx="7" fill={COLOR.surfaceRaised} stroke={h.id === fromId ? COLOR.blue : h.id === toId ? COLOR.success : COLOR.border} strokeWidth={h.id === fromId || h.id === toId ? 2.4 : 1.2} />
                  <text x={cx(k)} y={SEG_Y + 45 + m * 36} textAnchor="middle" fill={COLOR.text} fontSize="8.8" fontWeight="700">{pgAclUiShort(h.name, Math.floor((colW - 26) / 4.7))}</text>
                  <text x={cx(k)} y={SEG_Y + 57 + m * 36} textAnchor="middle" fill={COLOR.muted} fontSize="8">{h.ip}</text>
                </g>
              ))}
            </g>
          );
        })}
        {links.map((l) => {
          const x0 = rx[l.a.r.id] + RW / 2; const x1 = rx[l.b.r.id] - RW / 2; const ly = RY + 19;
          return (
            <g key={l.a.i.id}>
              <line x1={x0} y1={ly} x2={x1} y2={ly} stroke={COLOR.muted} strokeWidth="1.6" />
              {gate(`ai${l.a.i.id}`, x0 + 14, ly - 9, 'in', l.a.i, l.a.r.id)}
              {gate(`ao${l.a.i.id}`, x0 + 14, ly + 9, 'out', l.a.i, l.a.r.id)}
              {gate(`bi${l.b.i.id}`, x1 - 14, ly - 9, 'in', l.b.i, l.b.r.id)}
              {gate(`bo${l.b.i.id}`, x1 - 14, ly + 9, 'out', l.b.i, l.b.r.id)}
              <text x={(x0 + x1) / 2} y={RY + RH + 8} textAnchor="middle" fill={COLOR.muted} fontSize="8">{pgIpToString(l.n.net)}/{l.a.i.prefix}</text>
            </g>
          );
        })}
        {routers.map((r) => (
          <g key={r.id}>
            <rect x={rx[r.id] - RW / 2} y={RY} width={RW} height={RH} rx="9" fill={COLOR.surfaceRaised} stroke={routerStroke(r)} strokeWidth={routerStroke(r) === COLOR.border ? 2 : 2.6} />
            <text x={rx[r.id]} y={RY + 16} textAnchor="middle" fill={COLOR.text} fontSize="11" fontWeight="800">{r.name}</text>
            <text x={rx[r.id]} y={RY + 29} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">router · {r.acls.length} ACL{r.acls.length === 1 ? '' : 's'}</text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px', lineHeight: 1.5 }}>
        <span style={{ color: ink(COLOR.blue) }}>blue = from</span> · <span style={{ color: ink(COLOR.success) }}>green = to</span> · tags show where an ACL is applied (in/out)
      </div>
      <div style={{ fontSize: '11.5px', marginTop: '6px', lineHeight: 1.6, textAlign: 'center' }}>
        {applied.length === 0 ? <span style={{ color: COLOR.muted }}>No ACL is applied to any interface.</span>
          : applied.map((a) => <span key={a} style={{ display: 'inline-block', margin: '1px 4px', fontFamily: PG_ACL_UI_MONO, color: COLOR.text, overflowWrap: 'anywhere' }}>{a}</span>)}
      </div>
    </div>
  );
}

/* ---------- interfaces: which ACL is applied where ---------- */

function PgAclInterfaces({ router, setRouter, diag }) {
  const opts = [{ value: '', label: '(none)' }].concat(router.acls.map((a) => ({ value: a.name, label: `${a.name} (${a.kind === 'standard' ? 'std' : 'ext'})` })));
  const setIface = (iid, patch) => setRouter({ ...router, interfaces: router.interfaces.map((i) => (i.id === iid ? { ...i, ...patch } : i)) });
  const hot = (field) => !!diag && diag.field === field && diag.router === router.id;
  const wrap = (isHot) => ({ outline: isHot ? `1px solid ${COLOR.red}` : 'none', outlineOffset: '2px', borderRadius: 'var(--r-ctl)' });
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>An ACL does nothing until an interface applies it. Each interface holds one ACL per direction: <strong>in</strong> reads packets arriving on the interface, <strong>out</strong> reads packets leaving through it.</div>
      {router.interfaces.map((i) => (
        <div key={i.id} style={{ marginBottom: '12px' }}>
          <div className="flex justify-between items-baseline" style={{ gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 800 }}>{i.name} <span style={{ fontWeight: 500, color: COLOR.muted }}>· {i.desc}</span></span>
            <span style={{ fontSize: '11.5px', fontFamily: PG_ACL_UI_MONO, color: COLOR.muted }}>{i.ip}/{i.prefix}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            <div style={wrap(hot(`${i.id}.in`))}><PgSelect label="Inbound ACL" value={i.aclIn || ''} onChange={(v) => setIface(i.id, { aclIn: v })} options={opts} /></div>
            <div style={wrap(hot(`${i.id}.out`))}><PgSelect label="Outbound ACL" value={i.aclOut || ''} onChange={(v) => setIface(i.id, { aclOut: v })} options={opts} /></div>
          </div>
        </div>
      ))}
      <div style={{ ...PG_ACL_UI_LABEL, marginTop: '4px' }}>Routing table</div>
      <div style={{ fontFamily: PG_ACL_UI_MONO, fontSize: '11.5px', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
        {router.interfaces.map((i) => { const n = pgAclIfaceNet(i); return <div key={i.id}>{pgIpToString(n.net)}/{i.prefix} <span style={{ color: COLOR.muted }}>connected, {i.name}</span></div>; })}
        {(router.routes || []).map((rt) => <div key={rt.id}>{rt.dest}/{rt.prefix} <span style={{ color: COLOR.muted }}>via {rt.via}{Number(rt.prefix) === 0 ? ' (default route)' : ''}</span></div>)}
      </div>
    </div>
  );
}

/* ---------- ACL entries ---------- */

function PgAclSeqField({ value, onCommit, error }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => { if (draft !== String(value)) onCommit(draft.trim()); };
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={PG_ACL_UI_LABEL}>Sequence</span>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        inputMode="numeric" aria-label="Sequence number" aria-invalid={error ? 'true' : undefined} style={pgInputStyle(!!error)} />
      {error ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.red, marginTop: '3px' }}>{error}</span> : null}
    </label>
  );
}

const PG_ACL_UI_BTN = { ...pgPillStyle, minHeight: '36px', minWidth: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

function PgAclEntry({ acl, entry, first, last, open, onToggle, onChange, onMove, onDelete, errs, matched, hot }) {
  const e = entry;
  const permit = e.action === 'permit';
  const hue = permit ? COLOR.success : COLOR.red;
  const err = (f) => (errs.find((x) => x.field === f) || {}).text;
  const ext = acl.kind === 'extended';
  const proto = e.proto || 'ip';
  const hasPorts = proto === 'tcp' || proto === 'udp';
  const setProto = (p) => onChange({ proto: p, ...(p === 'tcp' || p === 'udp' ? {} : { srcPort: 'any', dstPort: 'any' }), ...(p === 'tcp' ? {} : { established: false }), ...(p === 'icmp' ? {} : { icmp: 'any' }) });
  return (
    <div data-acl-entry={e.id} style={{ marginBottom: '8px', padding: '8px 10px', borderRadius: 'var(--r-card)', background: tint(hue, matched ? 18 : 6), border: `1px solid ${hot ? COLOR.red : matched ? hue : `color-mix(in srgb, ${hue} 30%, ${COLOR.border})`}`, outline: hot ? `1px solid ${COLOR.red}` : 'none', outlineOffset: '2px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontFamily: PG_ACL_UI_MONO, fontWeight: 800, fontSize: '12.5px', color: ink(hue), flexShrink: 0 }}>{e.seq}</span>
        <span style={{ fontFamily: PG_ACL_UI_MONO, fontSize: '12.5px', lineHeight: 1.45, minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>{pgAclEntryText(acl.kind, e)}</span>
        {matched ? <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: ink(hue), flexShrink: 0 }}>matched</span> : null}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
        <button className="btn-flat" onClick={onToggle} aria-expanded={open} aria-label={`${open ? 'Close' : 'Edit'} entry ${e.seq}`} style={{ ...PG_ACL_UI_BTN, padding: '7px 14px' }}>{open ? 'Done' : 'Edit'}</button>
        <button className="btn-flat" disabled={first} onClick={() => onMove(-1)} aria-label={`Move entry ${e.seq} up`} style={{ ...PG_ACL_UI_BTN, opacity: first ? 0.35 : 1 }}>↑</button>
        <button className="btn-flat" disabled={last} onClick={() => onMove(1)} aria-label={`Move entry ${e.seq} down`} style={{ ...PG_ACL_UI_BTN, opacity: last ? 0.35 : 1 }}>↓</button>
        <button className="btn-flat" onClick={onDelete} aria-label={`Delete entry ${e.seq}`} style={PG_ACL_UI_BTN}>✕</button>
      </div>
      {errs.length > 0 && !open ? <div style={{ fontSize: '12px', color: COLOR.red, marginTop: '6px', lineHeight: 1.45 }}>{errs[0].text}</div> : null}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '10px' }}>
          <PgAclSeqField value={e.seq} onCommit={(v) => onChange({ seq: /^\d+$/.test(v) ? Number(v) : v })} error={err('seq')} />
          <PgSelect label="Action" value={e.action} onChange={(v) => onChange({ action: v })} options={[{ value: 'permit', label: 'permit' }, { value: 'deny', label: 'deny' }]} />
          {ext && <div style={{ gridColumn: '1 / -1' }}><PgSelect label="Protocol" value={proto} onChange={setProto} options={PG_ACL_UI_ENTRY_PROTOS} /></div>}
          <div style={{ gridColumn: '1 / -1' }}><PgField label="Source" value={e.src} onChange={(v) => onChange({ src: v })} error={err('src')} placeholder="any, host 10.1.10.5 or 10.1.10.0 0.0.0.255" /></div>
          {ext && <div style={{ gridColumn: '1 / -1' }}><PgField label="Destination" value={e.dst} onChange={(v) => onChange({ dst: v })} error={err('dst')} placeholder="any, host 10.1.30.10 or 10.1.30.0 0.0.0.255" /></div>}
          {ext && hasPorts && <PgField label="Source port" value={e.srcPort} onChange={(v) => onChange({ srcPort: v })} error={err('srcPort')} placeholder="any or eq 53" />}
          {ext && hasPorts && <PgField label="Destination port" value={e.dstPort} onChange={(v) => onChange({ dstPort: v })} error={err('dstPort')} placeholder="any, eq 80, range 20 21" />}
          {ext && proto === 'icmp' && <div style={{ gridColumn: '1 / -1' }}><PgSelect label="ICMP message" value={e.icmp || 'any'} onChange={(v) => onChange({ icmp: v })} options={PG_ACL_UI_ICMP} /></div>}
          {ext && proto === 'tcp' && <div style={{ gridColumn: '1 / -1' }}><PgToggle label="established" hint="Match only TCP packets that have the ACK or RST bit set: replies and later packets of a connection, never a first SYN. It is a bit test, not connection tracking." value={!!e.established} onChange={(v) => onChange({ established: v })} hot={!!err('established')} /></div>}
          {!ext && <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>A standard ACL looks at the source address only. It cannot match a destination, protocol or port.</div>}
        </div>
      )}
    </div>
  );
}

function PgAclLists({ router, setRouter, errors, matched, implicitHit, diag }) {
  const [openEntry, setOpenEntry] = useState(null);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState('extended');
  const setAcl = (name, fn) => setRouter({ ...router, acls: router.acls.map((a) => (a.name === name ? fn(a) : a)) });
  const patchEntry = (aclName, id, patch) => setAcl(aclName, (a) => ({ ...a, entries: a.entries.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const move = (a, id, d) => {
    const list = pgAclSorted(a);
    const i = list.findIndex((x) => x.id === id);
    const x = list[i]; const y = list[i + d];
    if (!x || !y || !Number.isFinite(Number(x.seq)) || !Number.isFinite(Number(y.seq))) return;
    setAcl(a.name, (acl) => ({ ...acl, entries: acl.entries.map((z) => (z.id === x.id ? { ...z, seq: y.seq } : z.id === y.id ? { ...z, seq: x.seq } : z)) }));
  };
  const addEntry = (a) => {
    let n = a.entries.length + 1;
    while (a.entries.some((x) => x.id === `e${n}`)) n += 1;
    const id = `e${n}`;
    const top = Math.max(0, ...a.entries.map((x) => Number(x.seq)).filter((v) => Number.isFinite(v)));
    const seq = (Math.floor(top / 10) + 1) * 10;
    const entry = a.kind === 'standard' ? { id, seq, action: 'permit', src: 'any' } : { id, seq, action: 'permit', proto: 'ip', src: 'any', srcPort: 'any', dst: 'any', dstPort: 'any', icmp: 'any', established: false };
    setAcl(a.name, (acl) => ({ ...acl, entries: acl.entries.concat([entry]) }));
    setOpenEntry(id);
  };
  const removeAcl = (name) => setRouter({ ...router, acls: router.acls.filter((a) => a.name !== name), interfaces: router.interfaces.map((i) => ({ ...i, aclIn: i.aclIn === name ? '' : i.aclIn, aclOut: i.aclOut === name ? '' : i.aclOut })) });
  const nameProblem = newName.trim() === '' ? '' : (pgAclNameProblem(newName.trim(), newKind) || (router.acls.some((a) => a.name === newName.trim()) ? 'This router already has an ACL with that name.' : ''));
  const create = () => {
    const name = newName.trim();
    if (!name || nameProblem) return;
    setRouter({ ...router, acls: router.acls.concat([{ name, kind: newKind, entries: [] }]) });
    setNewName('');
  };
  const usedBy = (name) => {
    const u = [];
    router.interfaces.forEach((i) => { if (i.aclIn === name) u.push(`${i.name} in`); if (i.aclOut === name) u.push(`${i.name} out`); });
    return u;
  };
  return (
    <div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>Entries are read from the lowest sequence number up; the first match decides. If nothing matches, the invisible last line, deny ip any any, drops the packet. (An ACL with no entries permits everything.)</div>
      {router.acls.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '8px' }}>This router has no ACLs yet.</div>}
      {router.acls.map((a) => {
        const used = usedBy(a.name);
        const list = pgAclSorted(a);
        return (
          <div key={a.name} data-acl={a.name} style={{ marginBottom: '14px', paddingBottom: '4px' }}>
            <div className="flex justify-between items-baseline" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontFamily: PG_ACL_UI_MONO, fontWeight: 800, fontSize: '13.5px', overflowWrap: 'anywhere' }}>{a.name} <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: ink(a.kind === 'standard' ? COLOR.orange : COLOR.blue) }}>{a.kind}</span></span>
              <span style={{ fontSize: '11.5px', color: used.length ? COLOR.muted : ink(COLOR.orange) }}>{used.length ? `applied: ${used.join(', ')}` : 'not applied anywhere'}</span>
            </div>
            {errors.filter((x) => x.acl === a.name && (x.field === 'name' || x.field === 'kind')).map((x) => <div key={x.field} style={{ fontSize: '12px', color: COLOR.red, marginBottom: '6px' }}>{x.text}</div>)}
            {list.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>No entries, so this ACL permits everything.</div>}
            {list.map((e, i) => (
              <PgAclEntry key={e.id} acl={a} entry={e} first={i === 0} last={i === list.length - 1} open={openEntry === e.id}
                onToggle={() => setOpenEntry(openEntry === e.id ? null : e.id)}
                onChange={(patch) => patchEntry(a.name, e.id, patch)} onMove={(d) => move(a, e.id, d)}
                onDelete={() => setAcl(a.name, (acl) => ({ ...acl, entries: acl.entries.filter((x) => x.id !== e.id) }))}
                errs={errors.filter((x) => x.acl === a.name && x.entryId === e.id)}
                matched={!!matched[`${router.id}|${a.name}|${e.id}`]}
                hot={!!diag && diag.router === router.id && diag.acl === a.name && diag.entryId === e.id} />
            ))}
            {implicitHit[`${router.id}|${a.name}`] && <div style={{ fontSize: '12px', color: ink(COLOR.red), fontWeight: 700, marginBottom: '6px' }}>The packet reached the invisible last line: deny ip any any.</div>}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn-flat" onClick={() => addEntry(a)} aria-label={`Add an entry to ${a.name}`} style={{ ...PG_ACL_UI_BTN, padding: '7px 14px', color: ink(COLOR.blue) }}>+ Add an entry</button>
              <button className="btn-flat" onClick={() => removeAcl(a.name)} aria-label={`Delete ACL ${a.name}`} style={{ ...PG_ACL_UI_BTN, padding: '7px 14px' }}>Delete this ACL</button>
            </div>
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${COLOR.border}`, paddingTop: '10px' }}>
        <div style={PG_ACL_UI_LABEL}>New ACL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '8px' }}>
          <PgField label="Name or number" value={newName} onChange={setNewName} error={nameProblem} placeholder="GUEST-IN or 101" />
          <PgSelect label="Type" value={newKind} onChange={setNewKind} options={[{ value: 'extended', label: 'extended' }, { value: 'standard', label: 'standard' }]} />
        </div>
        <button className="btn-flat" disabled={!newName.trim() || !!nameProblem} onClick={create} aria-label="Create the ACL" style={{ ...PG_ACL_UI_BTN, padding: '7px 14px', color: ink(COLOR.blue), opacity: !newName.trim() || nameProblem ? 0.4 : 1 }}>Create ACL</button>
      </div>
    </div>
  );
}

/* ---------- the result ---------- */

function PgAclChecks({ topo, result }) {
  if (!result.consulted.length) return null;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ ...PG_ACL_UI_LABEL, marginBottom: '4px' }}>ACLs the packet met</div>
      {result.consulted.map((c, k) => {
        const r = pgAclRouter(topo, c.router); const i = r && r.interfaces.find((x) => x.id === c.iface);
        const a = pgAclFind(r, c.acl); const e = a && c.entryId ? a.entries.find((x) => x.id === c.entryId) : null;
        const hue = c.action === 'deny' ? COLOR.red : c.action === 'permit' ? COLOR.success : COLOR.muted;
        const verdict = c.action === 'skipped' ? 'not applied (router-made packet)' : c.empty ? 'empty: permit' : c.implicit ? 'implicit deny' : e ? `entry ${e.seq}: ${c.action}` : c.action;
        return (
          <div key={k} style={{ fontSize: '12px', padding: '5px 8px', marginBottom: '4px', borderRadius: 'var(--r-ctl)', background: tint(hue, 8), borderLeft: `3px solid ${hue}` }}>
            <span style={{ display: 'block', overflowWrap: 'anywhere' }}>{c.leg === 'reply' ? 'Reply' : 'Request'} · {r.name} {i.name} {c.dir}</span>
            <span style={{ display: 'block', fontFamily: PG_ACL_UI_MONO, fontWeight: 700, color: ink(hue), overflowWrap: 'anywhere' }}>{c.acl} · {verdict}</span>
          </div>
        );
      })}
    </div>
  );
}

function PgAclResult({ topo, result }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const d = result.diagnosis;
  const blocked = !!d && PG_ACL_UI_BLOCK_CODES.indexOf(d.code) >= 0;
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: 'var(--r-card)', background: tint(hue, 16), border: `1px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      {result.warnings.map((w) => (
        <div key={`${w.code}-${w.router}-${w.acl}-${w.entryId}`} style={{ padding: '10px 12px', borderRadius: 'var(--r-card)', background: tint(COLOR.orange, 12), border: `1px solid ${COLOR.orange}`, marginBottom: '10px', fontSize: '13px', lineHeight: 1.5 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(COLOR.orange) }}>Worth a look</div>
          <div style={{ fontWeight: 800, margin: '2px 0' }}>{w.title}</div>
          <div>{w.text}</div>
        </div>
      ))}
      <PgDiagnosis diagnosis={d} heading={blocked ? 'Why it was blocked' : 'Why it failed'} />
      <PgAclChecks topo={topo} result={result} />
      <div style={{ ...PG_ACL_UI_LABEL, marginBottom: '4px' }}>Step by step</div>
      <PgSteps steps={result.steps} />
    </div>
  );
}

/* ---------- the lab ---------- */

function PgAclLab({ topo, setTopo, goals, defaultAsk }) {
  const hostOpts = topo.hosts.map((h) => ({ value: h.id, label: h.name }));
  const fromOpts = hostOpts.concat(topo.routers.map((r) => ({ value: r.id, label: `${r.name} (the router)` })));
  const toOpts = hostOpts.concat(topo.routers.reduce((acc, r) => acc.concat(r.interfaces.map((i) => ({ value: i.id, label: `${r.name} ${i.name}` }))), []));
  const first = defaultAsk || { from: topo.hosts[0].id, to: topo.hosts[topo.hosts.length - 1].id, proto: 'tcp', port: 80 };
  const [conn, setConn] = useState({ from: first.from, to: first.to, proto: first.proto, port: String(first.port || 80), ack: false, reply: true });
  const [result, setResult] = useState(null);
  const put = (patch) => { setConn({ ...conn, ...patch }); setResult(null); };
  const setRouter = (rid) => (router) => { setTopo({ ...topo, routers: topo.routers.map((r) => (r.id === rid ? router : r)) }); setResult(null); };
  const goalStates = (goals || []).map((g) => ({ g, ok: pgAclUiGoalMet(topo, g) }));
  const errors = pgAclValidate(topo);
  const diag = result && result.diagnosis;
  const matched = {}; const implicitHit = {};
  if (result) result.consulted.forEach((c) => { if (c.entryId) matched[`${c.router}|${c.acl}|${c.entryId}`] = true; if (c.implicit) implicitHit[`${c.router}|${c.acl}`] = true; });
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgAclDiagram topo={topo} fromId={conn.from} toId={conn.to} result={result} />
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goalStates.map(({ g, ok }, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
              <span aria-hidden="true" style={{ fontWeight: 900, color: ok ? ink(COLOR.success) : COLOR.muted }}>{ok ? '✓' : '○'}</span>
              <span>{pgAclUiGoalText(topo, g)}</span>
            </div>
          ))}
        </PgCard>
      )}
      {topo.routers.map((r) => (
        <PgCard key={`if-${r.id}`} title={`${r.name}: interfaces`} hue={COLOR.blue} collapsible>
          <PgAclInterfaces router={r} setRouter={setRouter(r.id)} diag={diag} />
        </PgCard>
      ))}
      {topo.routers.map((r) => (
        <PgCard key={`acl-${r.id}`} title={`${r.name}: access lists`} hue={COLOR.pink} collapsible>
          <PgAclLists router={r} setRouter={setRouter(r.id)} errors={errors.filter((x) => x.router === r.id)} matched={matched} implicitHit={implicitHit} diag={diag} />
        </PgCard>
      ))}
      <PgCard title="Send a test packet" hue={COLOR.success}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <PgSelect label="From" value={conn.from} onChange={(v) => put({ from: v })} options={fromOpts} />
          <PgSelect label="To" value={conn.to} onChange={(v) => put({ to: v })} options={toOpts} />
          <PgSelect label="Protocol" value={conn.proto} onChange={(v) => put({ proto: v })} options={[{ value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }, { value: 'icmp', label: 'ICMP (ping)' }]} />
          {conn.proto !== 'icmp' && <PgField label="Destination port" value={conn.port} onChange={(v) => put({ port: v })} inputMode="numeric" />}
          {conn.proto === 'tcp' && <div style={{ gridColumn: '1 / -1' }}><PgSelect label="TCP packet" value={conn.ack ? 'ack' : 'syn'} onChange={(v) => put({ ack: v === 'ack' })} options={[{ value: 'syn', label: 'Connection request (SYN)' }, { value: 'ack', label: 'Mid-connection packet (ACK set)' }]} /></div>}
        </div>
        <PgToggle label="Check the reply too" hint="ACLs are stateless, so the reply is a new packet that meets the ACLs again on its way back. A connection only works when both directions get through." value={conn.reply} onChange={(v) => put({ reply: v })} />
        <div style={{ height: '8px' }} />
        <PgPredict compute={() => pgAclTest(topo, conn)} causes={PG_ACL_CAUSES} buttonLabel="Send the packet" onResult={setResult} resetKey={JSON.stringify([topo, conn])} />
        <PgAclResult topo={topo} result={result} />
      </PgCard>
      <PgCard title="Configuration as a router prints it" hue={COLOR.teal} collapsible defaultOpen={false}>
        <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>Read-only: what the settings above look like on a Cisco IOS router.</div>
        {topo.routers.map((r) => (
          <pre key={r.id} style={{ margin: '0 0 10px', padding: '8px 10px', borderRadius: 'var(--r-ctl)', background: COLOR.surface, border: `1px solid ${COLOR.border}`, fontFamily: PG_ACL_UI_MONO, fontSize: '11.5px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{pgAclConfigText(topo, r.id)}</pre>
        ))}
      </PgCard>
    </div>
  );
}

function pgAclUiValidTopo(t) {
  const str = (x) => typeof x === 'string' && x !== '';
  const entryOk = (e) => !!e && str(e.id) && (e.action === 'permit' || e.action === 'deny') && typeof e.src === 'string';
  const ifaceOk = (i) => !!i && str(i.id) && str(i.name) && typeof i.ip === 'string' && pgParseIPv4(i.ip) !== null && Number.isInteger(Number(i.prefix)) && Number(i.prefix) >= 0 && Number(i.prefix) <= 32 && typeof (i.aclIn || '') === 'string' && typeof (i.aclOut || '') === 'string';
  const routerOk = (r) => !!r && str(r.id) && str(r.name) && Array.isArray(r.interfaces) && r.interfaces.length >= 1 && r.interfaces.every(ifaceOk)
    && Array.isArray(r.routes) && r.routes.every((x) => !!x && str(x.id) && typeof x.dest === 'string' && typeof x.via === 'string')
    && Array.isArray(r.acls) && r.acls.every((a) => !!a && str(a.name) && (a.kind === 'standard' || a.kind === 'extended') && Array.isArray(a.entries) && a.entries.every(entryOk));
  return !!t && Array.isArray(t.routers) && t.routers.length >= 1 && t.routers.length <= 2 && t.routers.every(routerOk)
    && Array.isArray(t.hosts) && t.hosts.length >= 2 && t.hosts.every((h) => !!h && str(h.id) && str(h.name) && typeof h.ip === 'string' && pgParseIPv4(h.ip) !== null && Number.isInteger(Number(h.prefix)) && typeof h.gateway === 'string');
}

function AclTool({ pick, onPick }) {
  const scenarios = pgScenarios('acl');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="acl" quiz={{ kind: 'acl', causes: PG_ACL_CAUSES }} makeDefault={() => pgClone(pgData().aclSandbox)} validate={pgAclUiValidTopo} onBack={() => onPick('')}
        blurb="A working branch and head-office network. The guest ACL on R1 lets guests reach only the web portal; a standard ACL on R2 keeps one old laptop off the servers. Reorder entries, change a wildcard mask, move an ACL to another interface or direction, write a new ACL, then send packets and read the trace."
        renderLab={(topo, setTopo) => <PgAclLab topo={topo} setTopo={setTopo} defaultAsk={pgAclHost(topo, 'guest') && pgAclHost(topo, 'web') ? { from: 'guest', to: 'web', proto: 'tcp', port: 80 } : undefined} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="acl" quiz={{ kind: 'acl', causes: PG_ACL_CAUSES }} scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgAclUiGoalMet(topo, g))}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgAclLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="acl" scenarios={scenarios} onPick={onPick}
      intro="An access control list (ACL) is an ordered list of permit and deny entries that a router checks packets against, on one interface and in one direction. Change an ACL or where it is applied, send a test packet, and read the trace: the route, the inbound ACL, the outbound ACL, entry by entry, and then the reply on its way back."
      note="Simplified on purpose: IPv4 only; standard and extended ACLs with sequence numbers (editable on numbered ACLs here, as in a router's ip access-list mode); no object groups, time-based or reflexive ACLs, ACL logging or NAT; hosts have no firewall of their own and the client port is fixed at 50000; routers know connected and static routes only; hosts on one subnet talk across a switch and never meet a router ACL."
      sandboxText="A working branch and head-office network with ACLs to adjust, break and test." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'acl',
  label: 'ACL lab',
  hue: COLOR.success,
  blurb: 'A small routed network with one or two routers. Write standard and extended ACLs, apply them to interfaces in or out, then send a test packet and read the trace: the route, the inbound ACL, the outbound ACL, entry by entry, and the reply on its way back.',
  Component: AclTool,
});
