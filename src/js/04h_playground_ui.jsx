/* ---------------- IT Playground: shell and subnet tools ---------------- */

// A self-study sandbox that is not tied to any cert. Nothing in it touches
// mastery, results, the daily goal or exam readiness. The maths and the
// simulation live in 03b_playground_engine.js; this file is only the screens.
// The IP configuration tester is in 04i_playground_net.jsx.

const PLAYGROUND_TOOLS = [
  { key: 'subnet', label: 'Subnet calculator', hue: COLOR.blue, ready: true,
    blurb: 'Network, broadcast and host range for any address and mask, with the working shown. Plus VLSM planning, a same-subnet checker and a subnetting drill.' },
  { key: 'ipconfig', label: 'IP configuration lab', hue: COLOR.teal, ready: true,
    blurb: 'Hosts, a gateway and routers. Change an address, mask or route and ping to see exactly why traffic works or fails. Includes guided troubleshooting scenarios.' },
  { key: 'vlan', label: 'VLAN playground', hue: COLOR.orange, ready: true,
    blurb: 'Two switches, access and trunk ports, native VLANs and a router on a stick. Ping across the network and watch each switch learn, flood, tag or drop the frame, with guided troubleshooting scenarios.' },
  { key: 'firewall', label: 'Firewall and port forwarding', hue: COLOR.pink, ready: true,
    blurb: 'Ordered allow and deny rules with an implicit deny, port forwards, NAT and stateful inspection. Fire test connections and see which rule matched and why one was blocked.' },
];

function pgInputStyle(invalid) {
  return {
    width: '100%', padding: '9px 8px', borderRadius: '10px', fontSize: '13.5px', minWidth: 0,
    border: `2px solid ${invalid ? COLOR.red : COLOR.border}`, background: COLOR.surface, color: COLOR.text,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };
}

function PgCard({ title, hue, right, children, style }) {
  return (
    <div style={{ boxShadow: SHADOW.card, background: tint(hue, 7), border: `2px solid color-mix(in srgb, ${hue} 38%, ${COLOR.border})`, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', ...style }}>
      {(title || right) && (
        <div className="flex justify-between items-baseline" style={{ marginBottom: '10px', gap: '8px' }}>
          <div className="itil-display" style={{ fontSize: '16px', color: ink(hue) }}>{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function PgField({ label, value, onChange, error, placeholder, hint, inputMode }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '3px' }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={label}
        aria-invalid={error ? 'true' : undefined}
        style={pgInputStyle(!!error)}
      />
      {error ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.red, marginTop: '3px' }}>{error}</span> : null}
      {!error && hint ? <span style={{ display: 'block', fontSize: '11.5px', color: COLOR.muted, marginTop: '3px' }}>{hint}</span> : null}
    </label>
  );
}

function PgSegmented({ options, value, onChange, hue }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className="btn-flat"
            style={{
              flex: '1 1 0', minWidth: '72px', padding: '8px 6px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800,
              border: `2px solid ${active ? hue : COLOR.border}`, background: active ? tint(hue, 20) : 'transparent',
              color: active ? ink(hue) : COLOR.muted,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// 32 bits as four octets; network bits are coloured, host bits muted.
function PgBinary({ bits, hue, label }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: COLOR.muted, marginBottom: '2px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '13.5px', letterSpacing: '0.04em' }}>
        {[0, 1, 2, 3].map((o) => (
          <span key={o}>
            {bits.slice(o * 8, o * 8 + 8).map((b, i) => (
              <span key={i} style={{ color: b.net ? ink(hue) : COLOR.muted, fontWeight: b.net ? 800 : 500, borderLeft: b.net === false && o * 8 + i > 0 && bits[o * 8 + i - 1].net ? `2px solid ${COLOR.gold}` : 'none', paddingLeft: b.net === false && o * 8 + i > 0 && bits[o * 8 + i - 1].net ? '1px' : 0 }}>{b.bit}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function PgResult({ label, value, sub, hue }) {
  return (
    <div style={{ minWidth: 0, background: tint(hue, 13), border: `2px solid color-mix(in srgb, ${hue} 40%, ${COLOR.border})`, borderRadius: '12px', padding: '8px 10px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: ink(hue) }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.25, marginTop: '1px', overflowWrap: 'anywhere', letterSpacing: '-0.01em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>{value}</div>
      {sub ? <div style={{ fontSize: '11px', color: COLOR.muted, marginTop: '1px' }}>{sub}</div> : null}
    </div>
  );
}

// Accepts "192.168.10.77/26", or an address plus a mask in the other box.
function pgReadAddress(addrText, maskText) {
  let addr = String(addrText || '').trim();
  let mask = String(maskText || '').trim();
  const slash = addr.indexOf('/');
  if (slash >= 0) { mask = addr.slice(slash); addr = addr.slice(0, slash); }
  const ip = pgParseIPv4(addr);
  const m = pgParseMask(mask);
  return {
    ip, prefix: m.prefix === undefined ? null : m.prefix,
    ipError: ip === null ? (addr ? 'Not a valid IPv4 address. Use four numbers from 0 to 255, such as 192.168.10.77.' : 'Enter an IPv4 address.') : null,
    maskError: m.error || null,
  };
}

/* ---------- Calculator ---------- */

function SubnetCalculator() {
  const [addr, setAddr] = useState('192.168.10.77');
  const [mask, setMask] = useState('/26');
  const [showHow, setShowHow] = useState(false);
  const [splitTo, setSplitTo] = useState(0);
  const r = pgReadAddress(addr, mask);
  const ok = r.ip !== null && r.prefix !== null;
  const info = ok ? pgSubnetInfo(r.ip, r.prefix) : null;
  const splitOptions = ok ? [1, 2, 3, 4, 5, 6].map((d) => r.prefix + d).filter((p) => p <= 30) : [];
  const splitPrefix = splitTo && splitOptions.includes(splitTo) ? splitTo : 0;
  const hue = COLOR.blue;
  const examples = [['192.168.10.77', '/26'], ['10.1.2.3', '255.255.240.0'], ['172.16.5.130', '/20'], ['203.0.113.9', '/29']];
  return (
    <div>
      <PgCard title="Address and mask" hue={hue}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '10px' }}>
          <PgField label="IPv4 address" value={addr} onChange={setAddr} error={r.ipError} placeholder="192.168.10.77" inputMode="decimal" />
          <PgField label="Mask or /prefix" value={mask} onChange={setMask} error={r.maskError} placeholder="/24 or 255.255.255.0" hint="Or type 10.0.0.5/24 in the address box." />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {examples.map(([a, m]) => (
            <button key={a + m} className="btn-flat" onClick={() => { setAddr(a); setMask(m); }}
              style={{ fontSize: '11.5px', padding: '4px 9px', borderRadius: '999px', border: `1.5px solid ${COLOR.border}`, color: COLOR.muted }}>
              {a}{m.startsWith('/') ? m : ` ${m}`}
            </button>
          ))}
        </div>
      </PgCard>

      {info && (
        <>
          <PgCard title="Result" hue={hue}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              <PgResult label="Network address" value={`${info.networkText}/${info.prefix}`} hue={hue} />
              <PgResult label="Broadcast address" value={info.broadcastText} hue={hue} />
              <PgResult label="First host" value={info.firstText} hue={COLOR.success} />
              <PgResult label="Last host" value={info.lastText} hue={COLOR.success} />
              <PgResult label="Usable hosts" value={info.usable.toLocaleString()} sub={`${info.total.toLocaleString()} addresses in total`} hue={COLOR.orange} />
              <PgResult label="Block size" value={info.total.toLocaleString()} sub={`${info.hostBits} host bit${info.hostBits === 1 ? '' : 's'}`} hue={COLOR.orange} />
              <PgResult label="Subnet mask" value={info.maskText} hue={COLOR.teal} />
              <PgResult label="Wildcard mask" value={info.wildcardText} sub="used in ACLs and OSPF" hue={COLOR.teal} />
            </div>
            <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '10px', lineHeight: 1.5 }}>
              <div><strong style={{ color: COLOR.text }}>{pgIpToString(info.ip)}</strong> is {info.role === 'host' ? 'a usable host address in this subnet' : <strong style={{ color: COLOR.red }}>the {info.role} address, so a host cannot use it</strong>}.</div>
              <div>{info.kind.label}.</div>
              <div>Class {info.cls.letter}{info.cls.prefix ? ` (default /${info.cls.prefix})${info.classfulBits ? `, subnetted with ${info.classfulBits} extra network bit${info.classfulBits === 1 ? '' : 's'}` : ''}` : ''}.</div>
              {info.note ? <div>{info.note}</div> : null}
            </div>
          </PgCard>

          <PgCard title="Binary view" hue={COLOR.gold} right={<span style={{ fontSize: '11px', color: COLOR.muted }}>network bits bold, host bits grey</span>}>
            <PgBinary bits={info.binIp} hue={COLOR.gold} label="Address" />
            <PgBinary bits={info.binMask} hue={COLOR.gold} label="Mask" />
            <PgBinary bits={info.binNetwork} hue={COLOR.gold} label="Address AND mask = network" />
          </PgCard>

          <PgCard
            title="Show me how"
            hue={COLOR.teal}
            right={<button className="btn-flat" onClick={() => setShowHow(!showHow)} style={{ fontSize: '12px', fontWeight: 800, color: ink(COLOR.teal) }}>{showHow ? 'Hide' : 'Show the steps'}</button>}
          >
            {showHow ? (
              <ol style={{ margin: 0, paddingLeft: '20px', listStyle: 'decimal', fontSize: '13px', lineHeight: 1.55 }}>
                {pgSubnetSteps(info).map((st) => (
                  <li key={st.title} style={{ marginBottom: '8px' }}>
                    <strong>{st.title}.</strong> {st.text}
                  </li>
                ))}
              </ol>
            ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>The same working you would do on paper in the exam, one step at a time.</div>}
          </PgCard>

          <PgCard title="Split into smaller subnets" hue={COLOR.pink}>
            {splitOptions.length ? (
              <>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {splitOptions.map((p) => (
                    <button key={p} className="btn-flat" onClick={() => setSplitTo(splitPrefix === p ? 0 : p)}
                      style={{ fontSize: '12px', fontWeight: 800, padding: '5px 10px', borderRadius: '999px', border: `2px solid ${splitPrefix === p ? COLOR.pink : COLOR.border}`, background: splitPrefix === p ? tint(COLOR.pink, 20) : 'transparent', color: splitPrefix === p ? ink(COLOR.pink) : COLOR.muted }}>
                      /{p}
                    </button>
                  ))}
                </div>
                {splitPrefix ? (
                  <div>
                    <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '6px' }}>
                      {Math.pow(2, splitPrefix - info.prefix)} subnets of {Math.pow(2, 32 - splitPrefix).toLocaleString()} addresses each ({Math.max(0, Math.pow(2, 32 - splitPrefix) - 2).toLocaleString()} usable).
                    </div>
                    {pgSplitSubnets(info.network, info.prefix, splitPrefix, 16).map((s) => (
                      <div key={s.network} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px', padding: '4px 0', borderTop: `1px solid ${COLOR.border}`, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                        <span style={{ fontWeight: 800 }}>{s.networkText}/{s.prefix}</span>
                        <span style={{ color: COLOR.muted }}>{s.firstText} – {s.lastText}</span>
                      </div>
                    ))}
                    {Math.pow(2, splitPrefix - info.prefix) > 16 ? <div style={{ fontSize: '11.5px', color: COLOR.muted, marginTop: '4px' }}>Showing the first 16.</div> : null}
                  </div>
                ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>Pick a longer prefix to see how this network divides.</div>}
              </>
            ) : <div style={{ fontSize: '12.5px', color: COLOR.muted }}>This network is already as small as ordinary subnets get.</div>}
          </PgCard>
        </>
      )}
    </div>
  );
}

/* ---------- Same subnet? ---------- */

function SubnetCompare() {
  const [a, setA] = useState('192.168.1.10');
  const [b, setB] = useState('192.168.1.200');
  const [maskA, setMaskA] = useState('255.255.255.128');
  const [maskB, setMaskB] = useState('255.255.255.128');
  const ra = pgReadAddress(a, maskA);
  const rb = pgReadAddress(b, maskB);
  const ok = ra.ip !== null && ra.prefix !== null && rb.ip !== null && rb.prefix !== null;
  let body = null;
  if (ok) {
    const ia = pgSubnetInfo(ra.ip, ra.prefix);
    const ib = pgSubnetInfo(rb.ip, rb.prefix);
    const aSeesB = pgSameSubnet(ra.ip, ra.prefix, rb.ip);
    const bSeesA = pgSameSubnet(rb.ip, rb.prefix, ra.ip);
    const sameNet = ia.network === ib.network && ia.prefix === ib.prefix;
    const verdict = aSeesB && bSeesA
      ? (sameNet ? { text: 'Same subnet. They can talk directly, with no router.', hue: COLOR.success } : { text: 'Each thinks the other is local, but their masks disagree, so one side\'s view is wrong.', hue: COLOR.orange })
      : !aSeesB && !bSeesA ? { text: 'Different subnets. A router (and a default gateway on each side) is needed between them.', hue: COLOR.red }
        : { text: 'The masks disagree: one host believes the other is local and the other does not. Expect odd, one-way failures.', hue: COLOR.orange };
    body = (
      <>
        <div style={{ padding: '10px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '13.5px', background: tint(verdict.hue, 16), border: `2px solid ${verdict.hue}`, color: ink(verdict.hue), marginBottom: '10px' }}>{verdict.text}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          <PgResult label="Host A is in" value={`${ia.networkText}/${ia.prefix}`} sub={`${ia.firstText} – ${ia.lastText}`} hue={COLOR.blue} />
          <PgResult label="Host B is in" value={`${ib.networkText}/${ib.prefix}`} sub={`${ib.firstText} – ${ib.lastText}`} hue={COLOR.teal} />
        </div>
        <div style={{ fontSize: '12.5px', color: COLOR.muted, marginTop: '8px', lineHeight: 1.5 }}>
          A thinks B is {aSeesB ? 'local (inside its subnet)' : 'remote (outside its subnet)'}. B thinks A is {bSeesA ? 'local' : 'remote'}.
          {ia.role !== 'host' ? <div style={{ color: COLOR.red }}>A is the {ia.role} address of its subnet, so it cannot be a host.</div> : null}
          {ib.role !== 'host' ? <div style={{ color: COLOR.red }}>B is the {ib.role} address of its subnet, so it cannot be a host.</div> : null}
        </div>
      </>
    );
  }
  return (
    <PgCard title="Are these two hosts in the same subnet?" hue={COLOR.blue}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '10px', marginBottom: '10px' }}>
        <PgField label="Host A address" value={a} onChange={setA} error={ra.ipError} />
        <PgField label="Host A mask" value={maskA} onChange={setMaskA} error={ra.maskError} />
        <PgField label="Host B address" value={b} onChange={setB} error={rb.ipError} />
        <PgField label="Host B mask" value={maskB} onChange={setMaskB} error={rb.maskError} />
      </div>
      {body}
    </PgCard>
  );
}

/* ---------- VLSM planner ---------- */

function VlsmPlanner() {
  const [base, setBase] = useState('192.168.1.0');
  const [baseMask, setBaseMask] = useState('/24');
  const [rows, setRows] = useState([
    { name: 'Sales', hosts: '100' }, { name: 'Engineering', hosts: '50' }, { name: 'Guest Wi-Fi', hosts: '20' }, { name: 'Router link', hosts: '2' },
  ]);
  const rb = pgReadAddress(base, baseMask);
  const reqs = rows.map((r) => ({ name: r.name, hosts: Number(r.hosts) }));
  const rowErrors = rows.map((r) => (r.hosts.trim() === '' || !/^\d+$/.test(r.hosts.trim()) || Number(r.hosts) < 1 ? 'Whole number of hosts, at least 1' : null));
  const ok = rb.ip !== null && rb.prefix !== null && rb.prefix <= 30;
  const plan = ok && !rowErrors.some(Boolean) ? pgVlsmPlan(rb.ip, rb.prefix, reqs) : null;
  const setRow = (i, patch) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <PgCard title="Network to divide" hue={COLOR.orange}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '10px' }}>
          <PgField label="Network address" value={base} onChange={setBase} error={rb.ipError} />
          <PgField label="Mask or /prefix" value={baseMask} onChange={setBaseMask} error={rb.maskError || (rb.prefix !== null && rb.prefix > 30 ? 'Needs /30 or shorter' : null)} />
        </div>
      </PgCard>
      <PgCard title="Who needs how many hosts?" hue={COLOR.orange}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1.4fr) auto', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
            <PgField label={i === 0 ? 'Group' : 'Group'} value={r.name} onChange={(v) => setRow(i, { name: v })} />
            <PgField label="Hosts" value={r.hosts} onChange={(v) => setRow(i, { hosts: v })} error={rowErrors[i] ? ' ' : null} inputMode="numeric" />
            <button className="btn-flat" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove ${r.name || 'row'}`}
              style={{ height: '40px', width: '36px', color: COLOR.muted, fontSize: '16px' }}>✕</button>
          </div>
        ))}
        <button className="btn-flat" onClick={() => setRows([...rows, { name: `Group ${rows.length + 1}`, hosts: '10' }])}
          style={{ fontSize: '12.5px', fontWeight: 800, color: ink(COLOR.orange), padding: '4px 0' }}>+ Add a group</button>
      </PgCard>

      {plan && (
        <PgCard title="The plan" hue={COLOR.success}>
          <div style={{ fontSize: '12.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.5 }}>
            Largest need first, each block starts on a boundary that fits its own size. That keeps the leftover space in one piece.
          </div>
          {plan.warnings.map((w) => <div key={w} style={{ fontSize: '12.5px', color: COLOR.orange, marginBottom: '6px' }}>{w}</div>)}
          {plan.allocations.map((a) => (
            <div key={a.name + a.info.network} style={{ borderTop: `1px solid ${COLOR.border}`, padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '13.5px' }}>{a.name}</strong>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontWeight: 800, color: ink(COLOR.success), fontSize: '13.5px' }}>{a.info.networkText}/{a.prefix}</span>
              </div>
              <div style={{ fontSize: '12px', color: COLOR.muted, lineHeight: 1.5 }}>
                needs {a.hosts} host{a.hosts === 1 ? '' : 's'}; gets {a.info.usable} usable ({a.info.firstText} – {a.info.lastText}), mask {a.info.maskText}; {a.spare} spare.
              </div>
            </div>
          ))}
          {plan.unplaced.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '10px', background: tint(COLOR.red, 14), border: `2px solid ${COLOR.red}`, fontSize: '12.5px' }}>
              <strong>Does not fit:</strong> {plan.unplaced.map((u) => `${u.name} (${u.hosts} hosts, needs a /${u.prefix})`).join('; ')}. Use a shorter prefix for the whole network or reduce the requirements.
            </div>
          )}
          <div style={{ borderTop: `1px solid ${COLOR.border}`, marginTop: '4px', paddingTop: '8px', fontSize: '12.5px', lineHeight: 1.55 }}>
            <div><strong>Efficiency:</strong> {plan.neededHosts} hosts needed in {plan.usedAddresses} addresses allocated ({plan.utilisation}% of the allocated addresses are hosts you asked for).</div>
            <div><strong>Left free:</strong> {plan.free.length ? plan.free.map((f) => f.text).join(', ') : 'nothing; the network is fully allocated'}.</div>
          </div>
        </PgCard>
      )}
    </div>
  );
}

/* ---------- Drill ---------- */

const PG_DRILL_KINDS = [
  { key: 'network', label: 'the network address', get: (i) => i.networkText },
  { key: 'broadcast', label: 'the broadcast address', get: (i) => i.broadcastText },
  { key: 'first', label: 'the first usable host', get: (i) => i.firstText },
  { key: 'last', label: 'the last usable host', get: (i) => i.lastText },
  { key: 'hosts', label: 'the number of usable hosts', get: (i) => String(i.usable) },
  { key: 'mask', label: 'the subnet mask (dotted)', get: (i) => i.maskText },
];

function pgNewDrill(level) {
  const rnd = (n) => Math.floor(Math.random() * n);
  const range = level === 'easy' ? [24, 30] : level === 'hard' ? [17, 30] : [20, 30];
  const prefix = range[0] + rnd(range[1] - range[0] + 1);
  const bases = [[192, 168, rnd(256)], [10, rnd(256), rnd(256)], [172, 16 + rnd(16), rnd(256)]];
  const b = bases[rnd(bases.length)];
  const ip = pgParseIPv4(`${b[0]}.${b[1]}.${b[2]}.${1 + rnd(254)}`);
  const kinds = level === 'easy' ? PG_DRILL_KINDS.slice(0, 5) : PG_DRILL_KINDS;
  return { ip, prefix, kind: kinds[rnd(kinds.length)].key, id: Math.random() };
}

function SubnetDrill() {
  const [level, setLevel] = useState('medium');
  const [q, setQ] = useState(() => pgNewDrill('medium'));
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const info = pgSubnetInfo(q.ip, q.prefix);
  const kind = PG_DRILL_KINDS.find((k) => k.key === q.kind);
  const expected = kind.get(info);
  const next = (lv) => { setQ(pgNewDrill(lv || level)); setAnswer(''); setChecked(null); };
  const check = () => {
    const given = answer.trim().replace(/,/g, '');
    const right = given === expected;
    setChecked({ right });
    setScore((s) => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }));
  };
  return (
    <PgCard title="Subnetting drill" hue={COLOR.pink} right={<span style={{ fontSize: '12px', color: COLOR.muted }}>{score.right} / {score.total} this visit</span>}>
      <PgSegmented
        hue={COLOR.pink}
        value={level}
        onChange={(lv) => { setLevel(lv); next(lv); }}
        options={[{ key: 'easy', label: 'Easy (/24–/30)' }, { key: 'medium', label: 'Medium' }, { key: 'hard', label: 'Hard (/17–/30)' }]}
      />
      <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.45, marginBottom: '10px' }}>
        For the host <span style={{ fontFamily: 'ui-monospace, monospace', color: ink(COLOR.pink) }}>{pgIpToString(q.ip)}/{q.prefix}</span>, what is {kind.label}?
      </div>
      <PgField
        label="Your answer"
        value={answer}
        onChange={setAnswer}
        inputMode={q.kind === 'hosts' ? 'numeric' : 'decimal'}
        placeholder={q.kind === 'hosts' ? 'a number' : 'a dotted address'}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        {!checked ? (
          <button className="btn-3d" disabled={!answer.trim()} onClick={check}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 700, opacity: answer.trim() ? 1 : 0.5 }}>Check</button>
        ) : (
          <button className="btn-3d" onClick={() => next()}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', background: COLOR.primary, color: COLOR.onAccent, fontSize: '13px', fontWeight: 700 }}>Next question</button>
        )}
        {!checked && <button className="btn-flat" onClick={() => setChecked({ right: false, gaveUp: true })} style={{ fontSize: '12.5px', color: COLOR.muted, padding: '0 8px' }}>Show answer</button>}
      </div>
      {checked && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ padding: '8px 10px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', background: tint(checked.right ? COLOR.success : COLOR.red, 16), border: `2px solid ${checked.right ? COLOR.success : COLOR.red}`, marginBottom: '8px' }}>
            {checked.right ? 'Correct.' : `The answer is ${expected}.`}
          </div>
          <ol style={{ margin: 0, paddingLeft: '20px', listStyle: 'decimal', fontSize: '12.5px', lineHeight: 1.55 }}>
            {pgSubnetSteps(info).map((st) => <li key={st.title} style={{ marginBottom: '6px' }}><strong>{st.title}.</strong> {st.text}</li>)}
          </ol>
        </div>
      )}
    </PgCard>
  );
}

const SUBNET_TABS = [
  { key: 'calc', label: 'Calculator' },
  { key: 'same', label: 'Same subnet?' },
  { key: 'vlsm', label: 'VLSM' },
  { key: 'drill', label: 'Drill' },
];

function SubnetTool() {
  const [tab, setTab] = useState('calc');
  return (
    <div>
      <PgSegmented options={SUBNET_TABS} value={tab} onChange={setTab} hue={COLOR.blue} />
      {tab === 'calc' && <SubnetCalculator />}
      {tab === 'same' && <SubnetCompare />}
      {tab === 'vlsm' && <VlsmPlanner />}
      {tab === 'drill' && <SubnetDrill />}
    </div>
  );
}

/* ---------- Shell ---------- */

function PlaygroundView({ tool, onSelectTool, onExit }) {
  const current = PLAYGROUND_TOOLS.find((t) => t.key === tool && t.ready);
  useEffect(() => { window.scrollTo(0, 0); }, [tool]);
  if (!current) {
    return (
      <div>
        <div style={{ marginBottom: '14px' }}>
          <div className="itil-display" style={{ fontSize: '22px', color: ink(COLOR.success) }}>IT Playground</div>
          <div style={{ fontSize: '13px', color: COLOR.muted, lineHeight: 1.5, marginTop: '4px' }}>
            Change something and watch what happens. The cert tracks teach and test; this is where you try it. It is a sandbox, not a graded tool: nothing here touches your mastery, results, daily goal or readiness.
          </div>
        </div>
        {PLAYGROUND_TOOLS.map((t) => (
          <button
            key={t.key}
            className="btn-flat"
            disabled={!t.ready}
            onClick={() => t.ready && onSelectTool(t.key)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', marginBottom: '12px', padding: '14px 16px', borderRadius: '16px',
              background: tint(t.hue, t.ready ? 10 : 4), border: `2px solid color-mix(in srgb, ${t.hue} ${t.ready ? 45 : 20}%, ${COLOR.border})`,
              opacity: t.ready ? 1 : 0.7, color: COLOR.text, boxShadow: t.ready ? SHADOW.card : 'none',
            }}
          >
            <div className="flex justify-between items-baseline">
              <span className="itil-display" style={{ fontSize: '16px', color: ink(t.hue) }}>{t.label}</span>
              {!t.ready && <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLOR.muted }}>Coming soon</span>}
            </div>
            <div style={{ fontSize: '12.5px', color: COLOR.muted, lineHeight: 1.5, marginTop: '4px' }}>{t.blurb}</div>
          </button>
        ))}
        <div style={{ fontSize: '11.5px', color: COLOR.muted, lineHeight: 1.5, marginTop: '6px' }}>
          The simulations are simplified on purpose: they model what the certifications teach, not any one vendor's exact behaviour. IPv6 is not included yet.
        </div>
        <button className="btn-flat" onClick={onExit} style={{ marginTop: '14px', fontSize: '13px', fontWeight: 800, color: COLOR.muted }}>‹ Back to Home</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center" style={{ gap: '8px', marginBottom: '12px' }}>
        <button className="btn-flat" onClick={() => onSelectTool('')} aria-label="Back to the playground" style={{ fontSize: '13px', fontWeight: 800, color: COLOR.muted, padding: '4px 0' }}>‹ Playground</button>
        <div className="itil-display" style={{ fontSize: '18px', color: ink(current.hue), marginLeft: 'auto' }}>{current.label}</div>
      </div>
      {current.key === 'subnet' && <SubnetTool />}
      {current.key === 'ipconfig' && <IpConfigTool />}
      {current.key === 'vlan' && <VlanTool />}
      {current.key === 'firewall' && <FirewallTool />}
    </div>
  );
}
