/* ---------------- IT Playground: Azure NSG tester ---------------- */

// One virtual network, two subnets and a few VMs. Network security groups (NSGs)
// hold inbound and outbound rules; each can be attached to a subnet, to a VM's
// network interface (NIC), or to both. Edit the rules (they are read by PRIORITY
// NUMBER, lowest first, not by list position), change which NSG sits where, then
// test a connection and read which rule decided at every level. The simulation is
// pgNsgTest in 03c_pg_nsg.js; the guided scenarios come from
// data/playground_nsg.py (PLAYGROUND.nsg, PLAYGROUND.nsgSandbox).

const PG_NSG_UI_HUE = { allowed: COLOR.success, blocked: COLOR.red, notreached: COLOR.muted, none: COLOR.muted };
const PG_NSG_UI_MARK = { allowed: '✓', blocked: '✕', notreached: '○', none: '–' };
const PG_NSG_UI_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const PG_NSG_UI_PORTS = ['22', '80', '443', '1433', '3389', '8080'];
const PG_NSG_UI_NSG_HUES = [COLOR.blue, COLOR.pink, COLOR.orange, COLOR.teal];

// Worst state among the hops of a result that satisfy `pred`: blocked, allowed, not reached, none (or null without a result)
function pgNsgUiState(result, pred) {
  if (!result) return null;
  const hs = result.hops.filter(pred);
  if (!hs.length) return null;
  if (hs.some((h) => h.state === 'blocked')) return 'blocked';
  if (hs.some((h) => h.state === 'allowed')) return 'allowed';
  if (hs.some((h) => h.state === 'notreached')) return 'notreached';
  return 'none';
}

function pgNsgUiShort(text, n) { const s = String(text == null ? '' : text); return s.length > n ? `${s.slice(0, n - 1)}…` : s; }

function pgNsgUiName(topo, id) {
  const v = pgNsgVm(topo, id);
  if (v) return v.name;
  const e = pgNsgExternal(topo, id);
  return e ? e.name : String(id);
}

// A goal holds when the engine gives the wanted verdict (an invalid rule never counts as "blocked on purpose")
function pgNsgUiGoalMet(topo, g) {
  const r = pgNsgTest(topo, { from: g.from, to: g.to, proto: g.proto, port: g.port, noWarn: true });
  if (r.verdict !== g.verdict) return false;
  return !(g.verdict === 'failed' && r.diagnosis && /^bad-/.test(r.diagnosis.code));
}

function pgNsgUiGoalText(topo, g) {
  const what = g.proto === 'Icmp' ? 'ping' : `${String(g.proto).toUpperCase()} ${g.port}`;
  return g.verdict === 'success'
    ? `${pgNsgUiName(topo, g.from)} can reach ${pgNsgUiName(topo, g.to)} (${what})`
    : `${pgNsgUiName(topo, g.from)} is blocked from ${pgNsgUiName(topo, g.to)} (${what})`;
}

// One line describing what a rule matches, for the read-only order list
function pgNsgUiBrief(r) {
  const proto = r.proto === 'Any' ? 'any protocol' : String(r.proto).toUpperCase();
  const sp = pgNsgIsAnyPorts(r.srcPort) ? '' : `, source port ${String(r.srcPort).trim()}`;
  return `${proto}, ${pgNsgPortText(r.destPort)}${sp}, ${pgNsgAddrText(r.source)} → ${pgNsgAddrText(r.dest)}`;
}

function PgNsgDiagram({ topo, fromId, toId, result }) {
  const W = 320;
  const VM_H = 44;
  const SUB_Y = 66;
  const vmsIn = (s) => topo.vms.filter((v) => v.subnet === s.id);
  const maxVms = Math.max(1, ...topo.subnets.map((s) => vmsIn(s).length));
  const subH = 50 + maxVms * (VM_H + 5);
  const H = SUB_Y + subH + 10;
  const fromExt = pgNsgExternal(topo, fromId);
  const toExt = pgNsgExternal(topo, toId);
  const ext = fromExt || toExt;
  const vmFrom = pgNsgVm(topo, fromId);
  const vmTo = pgNsgVm(topo, toId);
  const lineHue = result ? (result.verdict === 'success' ? COLOR.success : COLOR.red) : COLOR.muted;
  const hueOf = (st, fallback) => (st ? PG_NSG_UI_HUE[st] : fallback);
  const markOf = (st) => (st ? ` ${PG_NSG_UI_MARK[st]}` : '');
  // the arrow between the internet band and the subnet of the VM involved
  const endVm = fromExt ? vmTo : toExt ? vmFrom : null;
  const endIdx = endVm ? topo.subnets.findIndex((s) => s.id === endVm.subnet) : -1;
  const arrowX = endIdx >= 0 ? 10 + endIdx * 152 + 128 : 0;
  const inbound = !!fromExt;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Virtual network diagram" style={{ display: 'block', maxWidth: '420px', margin: '0 auto' }}>
      <rect x={4} y={4} width={312} height={34} rx="10" fill={tint(COLOR.pink, 8)} stroke={COLOR.pink} strokeWidth="1.2" strokeDasharray="4 3" />
      <text x={14} y={17} fill={ink(COLOR.pink)} fontSize="9" fontWeight="800">{ext && ext.kind === 'probe' ? 'AZURE HOST ADDRESS' : 'INTERNET'}</text>
      {ext ? (
        <text x={14} y={30} fill={fromExt ? ink(COLOR.blue) : ink(COLOR.success)} fontSize="9" fontWeight="700">{pgNsgUiShort(`${ext.name} · ${ext.ip}`, 46)}</text>
      ) : (
        <text x={14} y={30} fill={COLOR.muted} fontSize="8.5">Visitors, the office, outside servers</text>
      )}
      <rect x={4} y={46} width={312} height={H - 50} rx="12" fill="none" stroke={COLOR.teal} strokeWidth="1.2" strokeDasharray="4 3" />
      <text x={14} y={59} fill={ink(COLOR.teal)} fontSize="9" fontWeight="800">{pgNsgUiShort(`${topo.vnet.name}  ${topo.vnet.space}`, 30)}</text>
      {endIdx >= 0 && (
        <g>
          <line x1={arrowX} y1={inbound ? 38 : SUB_Y + 1} x2={arrowX} y2={inbound ? SUB_Y - 4 : 42} stroke={lineHue} strokeWidth="3" strokeDasharray={result ? undefined : '5 4'} strokeLinecap="round" />
          <polygon points={inbound ? `${arrowX - 5},${SUB_Y - 6} ${arrowX + 5},${SUB_Y - 6} ${arrowX},${SUB_Y + 1}` : `${arrowX - 5},43 ${arrowX + 5},43 ${arrowX},37`} fill={lineHue} />
        </g>
      )}
      {topo.subnets.map((s, i) => {
        const x0 = 10 + i * 152;
        const nsg = s.nsg ? pgNsgFind(topo, s.nsg) : null;
        const st = pgNsgUiState(result, (h) => h.level === 'subnet' && h.subnetId === s.id);
        const hue = hueOf(st, nsg ? COLOR.blue : COLOR.muted);
        return (
          <g key={s.id}>
            <rect x={x0} y={SUB_Y} width={148} height={subH} rx="9" fill={tint(COLOR.teal, 8)} stroke={st === 'blocked' ? COLOR.red : COLOR.border} strokeWidth={st === 'blocked' ? 2 : 1.2} />
            <text x={x0 + 8} y={SUB_Y + 13} fill={COLOR.text} fontSize="9.5" fontWeight="800">{pgNsgUiShort(s.name, 18)}</text>
            <text x={x0 + 8} y={SUB_Y + 24} fill={COLOR.muted} fontSize="8.5">{s.cidr}</text>
            <rect x={x0 + 6} y={SUB_Y + 30} width={136} height={14} rx="5" fill={tint(hue, 18)} stroke={hue} strokeWidth="1.1" strokeDasharray={nsg ? undefined : '3 2'} />
            <text x={x0 + 74} y={SUB_Y + 40} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="700">{nsg ? `NSG: ${pgNsgUiShort(nsg.name, 17)}${markOf(st)}` : 'no NSG on the subnet'}</text>
            {vmsIn(s).map((v, k) => {
              const y = SUB_Y + 50 + k * (VM_H + 5);
              const nic = v.nic && v.nic.nsg ? pgNsgFind(topo, v.nic.nsg) : null;
              const vst = pgNsgUiState(result, (h) => h.level === 'nic' && h.vmId === v.id);
              const vhue = hueOf(vst, nic ? COLOR.blue : COLOR.muted);
              const role = v.id === fromId ? COLOR.blue : v.id === toId ? COLOR.success : COLOR.border;
              const active = v.id === fromId || v.id === toId;
              return (
                <g key={v.id}>
                  <rect x={x0 + 6} y={y} width={136} height={VM_H} rx="7" fill={COLOR.surfaceRaised} stroke={role} strokeWidth={active ? 2.4 : 1.2} />
                  <text x={x0 + 12} y={y + 12} fill={COLOR.text} fontSize="9" fontWeight="800">{pgNsgUiShort(v.name, 16)}</text>
                  <text x={x0 + 12} y={y + 23} fill={COLOR.muted} fontSize="8">{pgNsgUiShort(`${v.ip}${v.publicIp ? ` · public ${v.publicIp}` : ''}`, 30)}</text>
                  <rect x={x0 + 10} y={y + 28} width={128} height={12} rx="4" fill={tint(vhue, 18)} stroke={vhue} strokeWidth="1" strokeDasharray={nic ? undefined : '3 2'} />
                  <text x={x0 + 74} y={y + 37} textAnchor="middle" fill={COLOR.text} fontSize="8" fontWeight="700">{nic ? `NIC NSG: ${pgNsgUiShort(nic.name, 14)}${markOf(vst)}` : 'no NSG on the NIC'}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function PgNsgSection({ id, title, hue, summary, open, setOpen, hot, children }) {
  const isOpen = !!open[id];
  return (
    <div id={`pgnsg-${String(id).replace(/[^\w-]/g, '-')}`}>
      <PgCard title={title} hue={hue} style={hot ? { outline: `2px solid ${COLOR.red}`, outlineOffset: '2px' } : undefined}
        right={<button className="btn-flat" aria-label={`${title}: ${isOpen ? 'hide' : 'show'}`} aria-expanded={isOpen} onClick={() => setOpen({ ...open, [id]: !isOpen })}
          style={{ ...pgPillStyle, padding: '5px 12px', minHeight: '36px' }}>{isOpen ? 'Hide' : 'Show'}</button>}>
        {isOpen ? children : <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>{summary}</div>}
      </PgCard>
    </div>
  );
}

/* ---------- one custom rule ---------- */

function PgNsgRule({ rule, errs, hot, hops, onChange, onDelete }) {
  const err = (f) => { const e = errs.find((x) => x.field === f); return e ? e.text : undefined; };
  const set = (patch) => onChange({ ...rule, ...patch });
  const hue = rule.action === 'Allow' ? COLOR.success : COLOR.red;
  const decided = hops.length ? hops[0] : null;
  return (
    <div data-pg="nsg-rule" style={{ marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', background: tint(hue, decided || hot ? 18 : 6), border: `2px solid ${hot ? COLOR.red : decided ? hue : `color-mix(in srgb, ${hue} 30%, ${COLOR.border})`}` }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '6px', gap: '8px' }}>
        <strong style={{ fontSize: '12.5px', color: ink(hue), minWidth: 0, overflowWrap: 'anywhere' }}>
          {rule.name || 'Unnamed rule'} · priority {String(rule.priority)} · {rule.action}{decided ? ` · decided at ${decided.label.toLowerCase()}` : ''}
        </strong>
        <button className="btn-flat" onClick={onDelete} aria-label={`Delete rule ${rule.name}`} style={{ width: '36px', height: '36px', color: COLOR.muted, flexShrink: 0 }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <PgField label="Name" value={rule.name} onChange={(v) => set({ name: v })} error={err('name')} />
        <PgField label="Priority" value={String(rule.priority)} onChange={(v) => set({ priority: /^\d+$/.test(v) ? Number(v) : v })} error={err('priority')} inputMode="numeric" placeholder="100-4096" />
        <PgField label="Source" value={rule.source} onChange={(v) => set({ source: v })} error={err('source')} placeholder="*, Internet, 10.0.0.0/24" />
        <PgField label="Source port" value={rule.srcPort} onChange={(v) => set({ srcPort: v })} error={err('srcPort')} placeholder="* or 1024-65535" />
        <PgField label="Destination" value={rule.dest} onChange={(v) => set({ dest: v })} error={err('dest')} placeholder="*, VirtualNetwork, 10.0.2.4" />
        <PgField label="Destination port" value={rule.destPort} onChange={(v) => set({ destPort: v })} error={err('destPort')} placeholder="443 or 80, 8000-8100" />
        <PgSelect label="Protocol" value={rule.proto} onChange={(v) => set({ proto: v })} options={PG_NSG_PROTOS} />
        <PgSelect label="Action" value={rule.action} onChange={(v) => set({ action: v })} options={PG_NSG_ACTIONS} />
      </div>
    </div>
  );
}

// The merged, read-only list in the order Azure reads it: your rules and the built-in ones together, lowest number first
function PgNsgOrder({ nsg, dir, hops, hotRuleId }) {
  const valid = (nsg[dir] || []).filter((r) => String(r.priority).trim() !== '' && Number.isInteger(Number(r.priority)));
  const list = pgNsgEffective({ [dir]: valid }, dir);
  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '2px' }}>The order Azure reads them</div>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '6px' }}>Lowest number first; the first match decides, whatever order your rules are listed in above. The grey built-in rules (65000 and up) cannot be deleted, only overridden by a rule with a lower number.</div>
      {list.map((r) => {
        const hue = r.action === 'Allow' ? COLOR.success : COLOR.red;
        const where = hops.filter((h) => h.dir === dir && h.nsg === nsg.id && h.ruleId === r.id);
        const hot = hotRuleId === r.id;
        return (
          <div key={r.id} data-pg="nsg-order-row" style={{ display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) auto', gap: '6px', alignItems: 'baseline', padding: '5px 8px', marginBottom: '3px', borderRadius: '8px', fontSize: '12px', background: r.builtin ? tint(COLOR.muted, 7) : tint(hue, 8), border: `1.5px solid ${hot ? COLOR.red : where.length ? hue : 'transparent'}` }}>
            <strong style={{ fontFamily: PG_NSG_UI_MONO }}>{r.priority}</strong>
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <strong>{r.name}</strong>{r.builtin && <span style={{ color: COLOR.muted }}> · built-in</span>}
              <span style={{ display: 'block', color: COLOR.muted }}>{pgNsgUiBrief(r)}</span>
              {where.length > 0 && <span style={{ display: 'block', fontWeight: 700, color: ink(hue) }}>decided at: {where.map((h) => h.label).join(', ')}</span>}
            </span>
            <span style={{ fontWeight: 800, color: ink(hue) }}>{r.action}</span>
          </div>
        );
      })}
    </div>
  );
}

function PgNsgEditor({ topo, setTopo, nsg, idx, open, setOpen, dirTab, setDirTab, diag, result }) {
  const tab = dirTab[nsg.id] || 'inbound';
  const hue = PG_NSG_UI_NSG_HUES[idx % PG_NSG_UI_NSG_HUES.length];
  const rules = nsg[tab] || [];
  const errs = pgNsgValidate(topo).filter((e) => e.nsg === nsg.id && e.dir === tab);
  const hops = result ? result.hops : [];
  const mine = diag && diag.deviceId === nsg.id;
  const where = topo.subnets.filter((s) => s.nsg === nsg.id).map((s) => `subnet ${s.name}`).concat(topo.vms.filter((v) => v.nic && v.nic.nsg === nsg.id).map((v) => `NIC of ${v.name}`));
  const update = (patch) => setTopo({ ...topo, nsgs: topo.nsgs.map((n) => (n.id === nsg.id ? { ...n, ...patch } : n)) });
  const setRules = (list) => update({ [tab]: list });
  const addRule = () => {
    const used = rules.map((r) => Number(r.priority)).filter((n) => Number.isFinite(n));
    let p = used.length ? Math.min(4096, Math.max(...used) + 10) : 100;
    while (used.indexOf(p) >= 0 && p > 100) p -= 1;
    let n = rules.length + 1;
    while (rules.some((r) => r.name === `Rule-${n}` || r.id === `${nsg.id}-${tab.slice(0, 1)}${n}`)) n += 1;
    setRules([...rules, { id: `${nsg.id}-${tab.slice(0, 1)}${n}`, name: `Rule-${n}`, priority: p, source: '*', srcPort: '*', dest: '*', destPort: '443', proto: 'Tcp', action: 'Allow' }]);
  };
  const remove = () => setTopo({
    ...topo,
    nsgs: topo.nsgs.filter((n) => n.id !== nsg.id),
    subnets: topo.subnets.map((s) => (s.nsg === nsg.id ? { ...s, nsg: null } : s)),
    vms: topo.vms.map((v) => (v.nic && v.nic.nsg === nsg.id ? { ...v, nic: { ...v.nic, nsg: null } } : v)),
  });
  const summary = `${where.length ? `Attached to ${where.join(' and ')}` : 'Not attached to anything yet'} · ${nsg.inbound.length} inbound and ${nsg.outbound.length} outbound custom rule${nsg.inbound.length + nsg.outbound.length === 1 ? '' : 's'}. Tap Show to edit.`;
  return (
    <PgNsgSection id={`nsg:${nsg.id}`} title={nsg.name} hue={hue} summary={summary} open={open} setOpen={setOpen} hot={!!mine}>
      <div data-pg="nsg-editor">
        <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>
          {where.length ? `Attached to ${where.join(' and ')}.` : 'Not attached to anything: an NSG filters nothing until it is associated with a subnet or a NIC.'} Address fields take * (any), one service tag (Internet, VirtualNetwork, AzureLoadBalancer) or addresses and CIDRs separated by commas. Port fields take *, 443, 1024-65535 or a comma list. Priorities run from 100 to 4096.
        </div>
        <PgSegmented hue={hue} value={tab} onChange={(k) => setDirTab({ ...dirTab, [nsg.id]: k })}
          options={[{ key: 'inbound', label: `Inbound (${nsg.inbound.length})` }, { key: 'outbound', label: `Outbound (${nsg.outbound.length})` }]} />
        {rules.length === 0 && <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '8px' }}>No custom {tab} rules: only the built-in ones below apply.</div>}
        {rules.map((r) => (
          <PgNsgRule key={r.id} rule={r} errs={errs.filter((e) => e.ruleId === r.id)} hops={hops.filter((h) => h.dir === tab && h.nsg === nsg.id && h.ruleId === r.id)}
            hot={!!mine && diag.dir === tab && diag.ruleId === r.id}
            onChange={(nr) => setRules(rules.map((x) => (x.id === r.id ? nr : x)))} onDelete={() => setRules(rules.filter((x) => x.id !== r.id))} />
        ))}
        <button className="btn-flat" onClick={addRule} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add an {tab} rule</button>
        <PgNsgOrder nsg={nsg} dir={tab} hops={hops} hotRuleId={mine && diag.dir === tab ? diag.ruleId : null} />
        <div style={{ marginTop: '10px' }}>
          <button className="btn-flat" onClick={remove} style={{ ...pgPillStyle, minHeight: '36px' }}>Delete this NSG</button>
        </div>
      </div>
    </PgNsgSection>
  );
}

/* ---------- which NSG sits where ---------- */

function PgNsgAssoc({ topo, setTopo, diag, open, setOpen }) {
  const opts = [{ value: '', label: '(no NSG)' }].concat(topo.nsgs.map((n) => ({ value: n.id, label: n.name })));
  const g2 = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' };
  const fieldHot = (f) => !!diag && (diag.field === f || (f === 'assoc' && /^(subnet|nic)\./.test(String(diag.field || ''))));
  const setSubnetNsg = (s, v) => setTopo({ ...topo, subnets: topo.subnets.map((x) => (x.id === s.id ? { ...x, nsg: v || null } : x)) });
  const setVm = (id, fn) => setTopo({ ...topo, vms: topo.vms.map((v) => (v.id === id ? fn(v) : v)) });
  const addNsg = () => {
    let n = topo.nsgs.length + 1;
    while (topo.nsgs.some((x) => x.id === `nsg-extra-${n}` || x.name === `nsg-extra-${n}`)) n += 1;
    setTopo({ ...topo, nsgs: [...topo.nsgs, { id: `nsg-extra-${n}`, name: `nsg-extra-${n}`, inbound: [], outbound: [] }] });
  };
  const summary = `${topo.subnets.map((s) => `${s.name}: ${s.nsg ? (pgNsgFind(topo, s.nsg) || { name: '?' }).name : 'no NSG'}`).join(' · ')}. Tap Show to change associations or public IPs.`;
  const subnetHot = !!diag && /^subnet\./.test(String(diag.field || ''));
  return (
    <PgNsgSection id="assoc" title="Where each NSG is attached" hue={COLOR.teal} summary={summary} open={open} setOpen={setOpen} hot={!!diag && (diag.field === 'assoc' || diag.field === 'publicIp' || subnetHot || /^nic\./.test(String(diag.field || '')))}>
      <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '8px' }}>An NSG does nothing until it is associated with a subnet, a VM's network interface (NIC) or both, and traffic must be allowed at every level that has one. A VM also needs a public IP address to be reached from the internet (leave the field empty for none).</div>
      <div style={g2}>
        {topo.subnets.map((s) => (
          <div key={s.id} style={{ outline: subnetHot && diag.field === `subnet.${s.id}` ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px', minWidth: 0 }}>
            <PgSelect label={`Subnet ${s.name}`} value={s.nsg || ''} onChange={(v) => setSubnetNsg(s, v)} options={opts} />
          </div>
        ))}
      </div>
      {topo.vms.map((v) => {
        const sub = pgNsgSubnetOf(topo, v);
        const badIp = v.publicIp && pgParseIPv4(v.publicIp) === null;
        const hot = !!diag && diag.deviceId === v.id && (diag.field === 'assoc' || diag.field === 'publicIp');
        return (
          <div key={v.id} style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '12px', border: `2px solid ${hot ? COLOR.red : COLOR.border}`, background: COLOR.surface }}>
            <div style={{ fontSize: '12.5px', marginBottom: '6px' }}><strong>{v.name}</strong><span style={{ color: COLOR.muted }}> · {v.ip}{sub ? ` in ${sub.name}` : ''}</span></div>
            <div style={g2}>
              <div style={{ outline: fieldHot('assoc') && diag.deviceId === v.id ? `2px solid ${COLOR.red}` : 'none', outlineOffset: '3px', borderRadius: '10px', minWidth: 0 }}>
                <PgSelect label={`NIC of ${v.name}`} value={(v.nic && v.nic.nsg) || ''} onChange={(val) => setVm(v.id, (x) => ({ ...x, nic: { ...x.nic, nsg: val || null } }))} options={opts} />
              </div>
              <PgField label={`Public IP of ${v.name}`} value={v.publicIp || ''} onChange={(val) => setVm(v.id, (x) => ({ ...x, publicIp: val.trim() }))} error={badIp ? 'Use an IPv4 address such as 20.50.60.70, or leave empty.' : undefined} placeholder="none" inputMode="decimal" />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '10px' }}>
        <button className="btn-flat" onClick={addNsg} style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.blue), padding: '6px 0', minHeight: '36px' }}>+ Add an empty NSG</button>
      </div>
    </PgNsgSection>
  );
}

/* ---------- the result ---------- */

function PgNsgHops({ hops }) {
  if (!hops.length) return null;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '4px' }}>The rule that decided at each level, in order</div>
      {hops.map((h, i) => {
        const hue = PG_NSG_UI_HUE[h.state] || COLOR.muted;
        const live = h.state === 'allowed' || h.state === 'blocked';
        const text = live
          ? `${h.nsgName}: ${h.rule} (priority ${h.priority}${h.builtin ? ', built-in' : ''}) → ${h.action}`
          : h.state === 'notreached' ? 'Not reached: an earlier level already stopped the traffic.' : 'No NSG here, so nothing is filtered at this level.';
        return (
          <div key={h.key} data-pg="nsg-hop" style={{ display: 'flex', gap: '8px', alignItems: 'baseline', padding: '6px 10px', marginBottom: '4px', borderRadius: '10px', background: tint(hue, live ? 12 : 4), border: `1.5px solid color-mix(in srgb, ${hue} 50%, ${COLOR.border})` }}>
            <span aria-hidden="true" style={{ fontWeight: 900, width: '14px', flexShrink: 0, color: live ? ink(hue) : COLOR.muted }}>{PG_NSG_UI_MARK[h.state]}</span>
            <span style={{ minWidth: 0, fontSize: '12.5px', lineHeight: 1.4 }}>
              <strong>{i + 1}. {h.label}</strong><span style={{ color: COLOR.muted }}> · {h.where}</span>
              <span style={{ display: 'block', color: live ? COLOR.text : COLOR.muted, overflowWrap: 'anywhere' }}>{text}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

const PG_NSG_CAUSES = {
  'default-deny': 'No rule of mine matches, so a built-in default rule decides',
  'denied-by-rule': 'A Deny rule matches the traffic',
  'lower-priority-loses': 'An Allow rule exists, but a Deny with a lower number is read first',
  'nic-nsg-blocks': 'The NSG on the VM\'s network interface blocks it',
  'subnet-nsg-blocks': 'The NSG on the subnet blocks it',
  'no-nsg-public-ip': 'A public IP with no NSG at either level is closed',
  'no-public-ip': 'The VM has no public IP address for the internet to reach',
  'bad-config': 'A rule has a value Azure would reject',
};

function PgNsgResult({ result, onWhere }) {
  if (!result) return null;
  const ok = result.verdict === 'success';
  const hue = ok ? COLOR.success : COLOR.red;
  const d = result.diagnosis;
  const canShow = !!d && !!(d.deviceId && d.field);
  return (
    <div>
      <div style={{ padding: '10px 12px', borderRadius: '12px', background: tint(hue, 16), border: `2px solid ${hue}`, marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 900, color: ink(hue), fontSize: '16px' }}>{ok ? '✓' : '✕'}</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px', lineHeight: 1.4 }}>{result.summary}</span>
      </div>
      {result.warnings.map((w) => (
        <div key={w.code} style={{ padding: '10px 12px', borderRadius: '12px', background: tint(COLOR.orange, 12), border: `2px solid ${COLOR.orange}`, marginBottom: '10px', fontSize: '13px', lineHeight: 1.5 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(COLOR.orange) }}>Allowed, but look twice</div>
          <div style={{ fontWeight: 800, margin: '2px 0' }}>{w.title}</div>
          <div>{w.text}</div>
        </div>
      ))}
      <PgDiagnosis diagnosis={d} heading="First thing that is wrong" />
      {canShow && (
        <button className="btn-flat" onClick={() => onWhere(d)} style={{ ...pgPillStyle, marginBottom: '10px', minHeight: '36px', border: `2px solid ${COLOR.primary}`, color: ink(COLOR.primary) }}>Show me where</button>
      )}
      <PgNsgHops hops={result.hops} />
      <PgSteps steps={result.steps} />
    </div>
  );
}

/* ---------- the lab ---------- */

function PgNsgLab({ topo, setTopo, goals, defaultAsk }) {
  const vms = topo.vms;
  const exts = topo.externals;
  const isExt = (id) => !!pgNsgExternal(topo, id);
  const firstClient = exts.find((e) => e.role === 'client') || exts[0];
  const firstServer = exts.find((e) => e.role === 'server') || exts.find((e) => e.role !== 'probe') || exts[0];
  const [conn, setConn] = useState(() => (defaultAsk
    ? { from: defaultAsk.from, to: defaultAsk.to, proto: defaultAsk.proto, port: defaultAsk.port == null ? '' : String(defaultAsk.port) }
    : { from: firstClient.id, to: vms[0].id, proto: 'Tcp', port: '443' }));
  const [ran, setRan] = useState(null);
  const [open, setOpen] = useState({ assoc: true });
  const [dirTab, setDirTab] = useState({});
  const key = JSON.stringify([topo, conn]);
  const result = ran && ran.key === key ? ran.result : null; // an old result is hidden as soon as anything changes
  const diag = result && result.diagnosis;
  const direction = isExt(conn.from) ? 'in' : isExt(conn.to) ? 'out' : 'vm';
  const vmOpts = vms.map((v) => ({ value: v.id, label: `${v.name} (${v.ip})` }));
  const extOpts = (list) => list.map((e) => ({ value: e.id, label: `${e.name} (${e.ip})` }));
  const fromOpts = direction === 'in' ? extOpts(exts) : vmOpts;
  const toOpts = direction === 'in' ? vmOpts : direction === 'out' ? extOpts(exts.filter((e) => e.role !== 'probe')) : vmOpts;
  const setConnField = (patch) => setConn({ ...conn, ...patch });
  const pickDirection = (d) => {
    const vmId = pgNsgVm(topo, conn.to) ? conn.to : pgNsgVm(topo, conn.from) ? conn.from : vms[0].id;
    const other = (vms.find((v) => v.id !== vmId) || vms[0]).id;
    if (d === 'in') setConn({ ...conn, from: firstClient.id, to: vmId });
    else if (d === 'out') setConn({ ...conn, from: vmId, to: firstServer.id });
    else setConn({ ...conn, from: vmId, to: other });
  };
  const where = (d) => {
    const next = { ...open };
    if (d.field === 'assoc' || d.field === 'publicIp' || /^(subnet|nic)\./.test(String(d.field || ''))) next.assoc = true;
    else if (d.deviceId) {
      next[`nsg:${d.deviceId}`] = true;
      if (d.dir) setDirTab({ ...dirTab, [d.deviceId]: d.dir });
    }
    setOpen(next);
    const target = d.field === 'assoc' || d.field === 'publicIp' || /^(subnet|nic)\./.test(String(d.field || '')) ? 'pgnsg-assoc' : `pgnsg-nsg-${String(d.deviceId).replace(/[^\w-]/g, '-')}`;
    setTimeout(() => { const el = document.getElementById(target); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 80);
  };
  return (
    <div>
      <PgCard title="The network" hue={COLOR.teal}>
        <PgNsgDiagram topo={topo} fromId={conn.from} toId={conn.to} result={result} />
        <div style={{ fontSize: '11.5px', color: COLOR.muted, textAlign: 'center', marginTop: '4px', lineHeight: 1.5 }}>
          <span style={{ color: ink(COLOR.blue) }}>blue = sending</span> {'·'} <span style={{ color: ink(COLOR.success) }}>green = receiving</span> {'·'} after a test, <span style={{ color: ink(COLOR.success) }}>{'✓'} allowed</span> or <span style={{ color: ink(COLOR.red) }}>{'✕'} blocked</span> at each NSG
        </div>
      </PgCard>
      {goals && goals.length > 0 && (
        <PgCard title="Goal" hue={COLOR.gold}>
          {goals.map((g, i) => {
            const met = pgNsgUiGoalMet(topo, g);
            return (
              <div key={i} data-pg="nsg-goal" style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px', padding: '3px 0' }}>
                <span aria-hidden="true" style={{ fontWeight: 900, color: met ? ink(COLOR.success) : COLOR.muted }}>{met ? '✓' : '○'}</span>
                <span>{pgNsgUiGoalText(topo, g)}</span>
              </div>
            );
          })}
        </PgCard>
      )}
      <PgNsgAssoc topo={topo} setTopo={setTopo} diag={diag} open={open} setOpen={setOpen} />
      {topo.nsgs.map((n, i) => (
        <PgNsgEditor key={n.id} topo={topo} setTopo={setTopo} nsg={n} idx={i} open={open} setOpen={setOpen} dirTab={dirTab} setDirTab={setDirTab} diag={diag} result={result} />
      ))}
      <PgCard title="Test a connection" hue={COLOR.success}>
        <div data-pg="nsg-test">
          <PgSegmented hue={COLOR.success} value={direction} onChange={pickDirection}
            options={[{ key: 'in', label: 'Inbound' }, { key: 'out', label: 'Outbound' }, { key: 'vm', label: 'VM to VM' }]} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <PgSelect label="From" value={conn.from} onChange={(v) => setConnField({ from: v })} options={fromOpts} />
            <PgSelect label="To" value={conn.to} onChange={(v) => setConnField({ to: v })} options={toOpts} />
            <PgSelect label="Protocol" value={conn.proto} onChange={(v) => setConnField({ proto: v })} options={[{ value: 'Tcp', label: 'TCP' }, { value: 'Udp', label: 'UDP' }, { value: 'Icmp', label: 'ICMP (ping)' }]} />
            {conn.proto !== 'Icmp' && <PgField label="Port" value={String(conn.port)} onChange={(v) => setConnField({ port: v })} inputMode="numeric" placeholder="1-65535" />}
          </div>
          {conn.proto !== 'Icmp' ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }} role="group" aria-label="Common ports">
              {PG_NSG_UI_PORTS.map((p) => (
                <button key={p} className="btn-flat" onClick={() => setConnField({ port: p })} aria-label={`Use port ${p}`}
                  style={{ ...pgPillStyle, padding: '4px 10px', minHeight: '36px', fontFamily: PG_NSG_UI_MONO, border: `2px solid ${String(conn.port) === p ? COLOR.primary : COLOR.border}`, color: String(conn.port) === p ? ink(COLOR.primary) : COLOR.muted }}>{p}</button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5, marginBottom: '10px' }}>Ping has no ports, so a rule only matches it when its port fields are *.</div>
          )}
          <PgPredict compute={() => pgNsgTest(topo, conn)} causes={PG_NSG_CAUSES} buttonLabel="Test the connection" onResult={(r) => setRan({ key, result: r })} resetKey={key} />
          <PgNsgResult result={result} onWhere={where} />
        </div>
      </PgCard>
    </div>
  );
}

function pgNsgUiValidTopo(t) {
  const str = (x) => typeof x === 'string';
  const ruleOk = (r) => !!r && str(r.id) && str(r.name) && str(r.source) && str(r.srcPort) && str(r.dest) && str(r.destPort) && ['Tcp', 'Udp', 'Icmp', 'Any'].indexOf(r.proto) >= 0 && ['Allow', 'Deny'].indexOf(r.action) >= 0 && (typeof r.priority === 'number' || str(r.priority));
  return !!t && !!t.vnet && str(t.vnet.name) && pgNsgCidr(t.vnet.space) !== null
    && Array.isArray(t.subnets) && t.subnets.length === 2 && t.subnets.every((s) => str(s.id) && str(s.name) && str(s.cidr) && (s.nsg === null || str(s.nsg)))
    && Array.isArray(t.nsgs) && t.nsgs.every((n) => str(n.id) && str(n.name) && Array.isArray(n.inbound) && Array.isArray(n.outbound) && n.inbound.every(ruleOk) && n.outbound.every(ruleOk))
    && Array.isArray(t.vms) && t.vms.length >= 1 && t.vms.every((v) => str(v.id) && str(v.name) && str(v.ip) && pgParseIPv4(v.ip) !== null && str(v.publicIp) && !!v.nic && (v.nic.nsg === null || str(v.nic.nsg)) && t.subnets.some((s) => s.id === v.subnet))
    && Array.isArray(t.externals) && t.externals.length >= 1 && t.externals.every((e) => str(e.id) && str(e.name) && str(e.ip) && pgParseIPv4(e.ip) !== null && ['internet', 'probe'].indexOf(e.kind) >= 0 && ['client', 'server', 'probe'].indexOf(e.role) >= 0);
}

function NsgTool({ pick, onPick }) {
  const scenarios = pgScenarios('nsg');
  const scenario = scenarios.find((s) => s.id === pick);
  if (pick === 'sandbox') {
    return (
      <PgSandboxShell tool="nsg" makeDefault={() => pgClone(pgData().nsgSandbox)} validate={pgNsgUiValidTopo} onBack={() => onPick('')}
        blurb="A working virtual network: a web subnet with a public VM and a test VM, and a data subnet with a database. Change a priority, a source or a port, move an NSG from the subnet to a NIC (or both), add a Deny rule, then test connections from the internet, from a VM, or out to the internet and read which rule decided at each level."
        renderLab={(topo, setTopo) => <PgNsgLab topo={topo} setTopo={setTopo} />} />
    );
  }
  if (scenario) {
    return (
      <PgScenarioShell key={scenario.id} tool="nsg" scenario={scenario} onBack={() => onPick('')}
        isSolved={(topo) => scenario.expectFixed.every((g) => pgNsgUiGoalMet(topo, g))}
        fixLines={(sc) => sc.fixText}
        renderLab={(topo, setTopo, sc) => <PgNsgLab topo={topo} setTopo={setTopo} goals={sc.expectFixed} defaultAsk={sc.ask} />} />
    );
  }
  return (
    <PgScenarioPicker tool="nsg" scenarios={scenarios} onPick={onPick}
      intro="A network security group (NSG) is Azure's basic traffic filter: a list of allow and deny rules that you attach to a subnet, to a VM's network interface (NIC), or to both. If you have used the Firewall tester, one thing changes: there, the first matching rule by its position in the list wins; here every rule carries a priority number from 100 to 4096, the LOWEST number is read first, and where the rule sits on the screen does not matter. Azure also adds built-in rules at 65000, 65001 and 65500 that you can override but not delete. Inbound traffic meets the subnet NSG and then the NIC NSG, outbound the NIC NSG and then the subnet NSG, and each level that has an NSG must allow it."
      note="Simplified on purpose: one virtual network with two subnets; the only service tags are Internet, VirtualNetwork and AzureLoadBalancer (VirtualNetwork here is this network's address space plus Azure's host address 168.63.129.16, with no peering or VPN); no application security groups, Virtual Network Manager security admin rules, Azure Firewall, route tables or operating-system firewalls; only the NSG rules are judged, so nothing has to be listening on the port; the client's source port is fixed at 50000; flow records for existing connections are not simulated."
      sandboxText="A working virtual network with a web subnet and a data subnet to adjust, break and test." />
  );
}

PLAYGROUND_EXTRA_TOOLS.push({
  key: 'nsg',
  label: 'Azure NSG tester',
  hue: COLOR.primary,
  blurb: 'A virtual network with two subnets and a few VMs. Edit the inbound and outbound rules of each network security group (read by priority number, lowest first), choose whether an NSG sits on a subnet or a NIC, then test a connection and see which rule decided at every level.',
  Component: NsgTool,
});
