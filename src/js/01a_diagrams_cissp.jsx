/* ---------------- CISSP lesson diagrams ---------------- */

// Tinted, coloured box (fill is a soft tint of `color`, stroke is the colour itself).
function DgCisspBox({ x, y, w, h, label, sub, color, labelSize, dashed }) {
  const c = color || COLOR.border;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={color ? tint(color, 16) : COLOR.surfaceRaised} stroke={c} strokeWidth="1.3" strokeDasharray={dashed ? '4 3' : undefined} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -3 : 4)} textAnchor="middle" fill={COLOR.text} fontSize={labelSize || 10.5} fontWeight="600">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{sub}</text>}
    </g>
  );
}

// A line ending in an arrowhead at (x2, y2).
function DgCisspArrow({ x1, y1, x2, y2, color }) {
  const c = color || COLOR.muted;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 6;
  const p1 = [x2 - L * Math.cos(a - 0.45), y2 - L * Math.sin(a - 0.45)];
  const p2 = [x2 - L * Math.cos(a + 0.45), y2 - L * Math.sin(a + 0.45)];
  const sx = x2 - 3 * Math.cos(a);
  const sy = y2 - 3 * Math.sin(a);
  return (
    <g>
      <line x1={x1} y1={y1} x2={sx} y2={sy} stroke={c} strokeWidth="1.4" />
      <polygon points={`${x2},${y2} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={c} />
    </g>
  );
}

// A small caption-style text (left, middle or end anchored).
function DgCisspText({ x, y, text, size, color, weight, anchor }) {
  return <text x={x} y={y} textAnchor={anchor || 'middle'} fill={color || COLOR.muted} fontSize={size || 9} fontWeight={weight}>{text}</text>;
}

/* 1. Governance: policy -> standards -> baselines -> procedures -> guidelines */
function DiagramCisspGovernance() {
  const rows = [
    { n: 'Policy', d: 'High-level intent: the "what"', o: 'Owner: senior management', m: true, c: COLOR.primary },
    { n: 'Standards', d: 'Exact required technologies', o: 'Owner: security architecture', m: true, c: COLOR.blue },
    { n: 'Baselines', d: 'Minimum secure configuration', o: 'Owner: IT and system owners', m: true, c: COLOR.teal },
    { n: 'Procedures', d: 'Step-by-step instructions', o: 'Owner: operations teams', m: true, c: COLOR.orange },
    { n: 'Guidelines', d: 'Advice that can be adapted', o: 'Owner: security team', m: false, c: COLOR.gold },
  ];
  return (
    <svg viewBox="0 0 340 266" style={{ width: '100%', height: 'auto' }}>
      {rows.map((r, i) => {
        const y = 8 + i * 46;
        return (
          <g key={r.n}>
            <DgCisspBox x={6} y={y} w={88} h={40} label={r.n} color={r.c} />
            {i > 0 && <DgCisspArrow x1={50} y1={y - 6} x2={50} y2={y} color={COLOR.muted} />}
            <text x={102} y={y + 17} fill={COLOR.text} fontSize="9.5">{r.d}</text>
            <text x={102} y={y + 31} fill={COLOR.muted} fontSize="8.5">{r.o}</text>
            <rect x={266} y={y + 10} width={68} height={20} rx="10" fill={r.m ? tint(COLOR.red, 16) : tint(COLOR.gold, 16)} stroke={r.m ? COLOR.red : COLOR.gold} strokeWidth="1.1" />
            <text x={300} y={y + 24} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="600">{r.m ? 'Mandatory' : 'Optional'}</text>
          </g>
        );
      })}
      <DgCisspText x={170} y={256} text="Top to bottom gets more specific. Only guidelines are voluntary." />
    </svg>
  );
}

/* 2. Risk management loop and treatment options */
function DiagramCisspRiskLoop() {
  const steps = [
    { l: '1 Frame', s: 'set appetite', c: COLOR.primary },
    { l: '2 Assess', s: 'ALE = SLE×ARO', c: COLOR.blue },
    { l: '3 Respond', s: 'pick treatment', c: COLOR.orange },
    { l: '4 Monitor', s: 'track residual', c: COLOR.teal },
  ];
  const xs = [6, 92, 178, 264];
  const treat = [
    { l: 'Mitigate', s: 'add controls to cut risk', c: COLOR.primary, x: 6, y: 112 },
    { l: 'Transfer', s: 'insurance or contract', c: COLOR.blue, x: 184, y: 112 },
    { l: 'Avoid', s: 'stop the risky activity', c: COLOR.orange, x: 6, y: 154 },
    { l: 'Accept', s: 'risk owner signs off', c: COLOR.gold, x: 184, y: 154 },
  ];
  return (
    <svg viewBox="0 0 340 256" style={{ width: '100%', height: 'auto' }}>
      <polyline points="299,34 299,20 41,20" fill="none" stroke={COLOR.muted} strokeWidth="1.4" />
      <DgCisspArrow x1={41} y1={20} x2={41} y2={34} />
      <DgCisspText x={170} y={14} text="Repeat: risk is never finished" size={8.5} />
      {steps.map((s, i) => (
        <g key={s.l}>
          <DgCisspBox x={xs[i]} y={34} w={70} h={44} label={s.l} sub={s.s} color={s.c} labelSize={10} />
          {i < 3 && <DgCisspArrow x1={xs[i] + 70} y1={56} x2={xs[i + 1]} y2={56} />}
        </g>
      ))}
      <DgCisspText x={170} y={104} text="pick a treatment per risk" size={8.5} />
      <polyline points="81,112 81,90 259,90 259,112" fill="none" stroke={COLOR.muted} strokeWidth="1.4" />
      <DgCisspArrow x1={213} y1={78} x2={213} y2={90} />
      <DgCisspArrow x1={81} y1={102} x2={81} y2={112} />
      <DgCisspArrow x1={259} y1={102} x2={259} y2={112} />
      {treat.map((t) => (
        <DgCisspBox key={t.l} x={t.x} y={t.y} w={150} h={36} label={t.l} sub={t.s} color={t.c} />
      ))}
      <DgCisspBox x={6} y={200} w={328} h={28} label="Residual risk remains: only the risk owner may accept it" color={COLOR.red} dashed labelSize={9} />
      <DgCisspText x={170} y={246} text="Insurance transfers the cost, never the accountability." />
    </svg>
  );
}

/* 3. RPO / RTO / WRT / MTD timeline */
function DiagramCisspRecoveryTimeline() {
  const bx = 30, dx = 125, rx = 210, ux = 270, mx = 320;
  const bar = (x1, x2, y, label, c) => (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={24} rx="5" fill={tint(c, 22)} stroke={c} strokeWidth="1.3" />
      <text x={(x1 + x2) / 2} y={y + 16} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="600">{label}</text>
    </g>
  );
  const marks = [
    { x: bx, a: 'Last good', b: 'backup', c: COLOR.gold },
    { x: dx, a: 'Disruption', b: '', c: COLOR.red },
    { x: rx, a: 'Systems', b: 'restored', c: COLOR.blue },
    { x: ux, a: 'Business', b: 'resumes', c: COLOR.teal },
    { x: mx, a: 'MTD', b: 'limit', c: COLOR.red },
  ];
  const legend = [
    { c: COLOR.gold, t: 'RPO: data loss you can accept, in time' },
    { c: COLOR.blue, t: 'RTO: target time to restore service' },
    { c: COLOR.teal, t: 'WRT: time to verify and reconfigure' },
    { c: COLOR.red, t: 'MTD: longest outage before survival is at risk' },
  ];
  return (
    <svg viewBox="0 0 340 252" style={{ width: '100%', height: 'auto' }}>
      {bar(dx, mx, 16, 'MTD: RTO + WRT must fit', COLOR.red)}
      {bar(bx, dx, 50, 'RPO', COLOR.gold)}
      {bar(dx, rx, 50, 'RTO', COLOR.blue)}
      {bar(rx, ux, 50, 'WRT', COLOR.teal)}
      <line x1={10} y1={100} x2={334} y2={100} stroke={COLOR.border} strokeWidth="1.5" />
      <DgCisspText x={295} y={92} text="time →" size={8.5} />
      {marks.map((m) => (
        <g key={m.a}>
          <line x1={m.x} y1={40} x2={m.x} y2={100} stroke={m.c} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={m.x} cy={100} r="4.5" fill={m.c} />
          <text x={m.x} y={120} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">{m.a}</text>
          {m.b && <text x={m.x} y={132} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">{m.b}</text>}
        </g>
      ))}
      {legend.map((l, i) => (
        <g key={l.t}>
          <rect x={10} y={152 + i * 19} width={10} height={10} rx="2" fill={tint(l.c, 30)} stroke={l.c} strokeWidth="1.2" />
          <text x={26} y={161 + i * 19} fill={COLOR.text} fontSize="9.5">{l.t}</text>
        </g>
      ))}
      <DgCisspText x={170} y={244} text="6h RTO + 4h WRT = 10h, which fails an 8h MTD." />
    </svg>
  );
}

/* 4. Data lifecycle with controls at each stage */
function DiagramCisspDataLifecycle() {
  const xs = [8, 122, 236];
  const st = [
    { n: '1 Create', t: 'classify it', a: 'owner assigned', b: 'label applied', c: COLOR.primary, col: 0, row: 0 },
    { n: '2 Store', t: 'data at rest', a: 'encrypt disks, DBs', b: 'and backups', c: COLOR.blue, col: 1, row: 0 },
    { n: '3 Use', t: 'data in use', a: 'access control,', b: 'secure enclaves', c: COLOR.teal, col: 2, row: 0 },
    { n: '4 Share', t: 'data in transit', a: 'TLS or IPsec,', b: 'DLP inspects', c: COLOR.orange, col: 2, row: 1 },
    { n: '5 Archive', t: 'keep or hold', a: 'retention schedule,', b: 'legal hold', c: COLOR.gold, col: 1, row: 1 },
    { n: '6 Destroy', t: 'remanence risk', a: 'clear, purge,', b: 'destroy: 800-88', c: COLOR.red, col: 0, row: 1 },
  ];
  return (
    <svg viewBox="0 0 340 212" style={{ width: '100%', height: 'auto' }}>
      {st.map((s) => {
        const x = xs[s.col];
        const y = 6 + s.row * 98;
        return (
          <g key={s.n}>
            <rect x={x} y={y} width={96} height={76} rx="7" fill={tint(s.c, 16)} stroke={s.c} strokeWidth="1.3" />
            <text x={x + 48} y={y + 16} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="600">{s.n}</text>
            <text x={x + 48} y={y + 30} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontStyle="italic">{s.t}</text>
            <text x={x + 48} y={y + 48} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{s.a}</text>
            <text x={x + 48} y={y + 61} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{s.b}</text>
          </g>
        );
      })}
      <DgCisspArrow x1={104} y1={44} x2={122} y2={44} />
      <DgCisspArrow x1={218} y1={44} x2={236} y2={44} />
      <DgCisspArrow x1={284} y1={82} x2={284} y2={104} />
      <DgCisspArrow x1={236} y1={142} x2={218} y2={142} />
      <DgCisspArrow x1={122} y1={142} x2={104} y2={142} />
      <DgCisspText x={170} y={204} text="Classification at creation drives the controls at every stage." />
    </svg>
  );
}

/* 5. Bell-LaPadula vs Biba grid */
function DiagramCisspBlpBiba() {
  const rows = [
    { l: 'Read up', s: 'object above you', blp: false, biba: true, bs: 'simple security', is: '' },
    { l: 'Read down', s: 'object below you', blp: true, biba: false, bs: '', is: 'simple integrity' },
    { l: 'Write up', s: 'object above you', blp: true, biba: false, bs: '', is: 'star integrity' },
    { l: 'Write down', s: 'object below you', blp: false, biba: true, bs: 'star property', is: '' },
  ];
  const cell = (x, y, ok, sub) => (
    <g>
      <rect x={x} y={y} width={114} height={34} rx="6" fill={tint(ok ? COLOR.success : COLOR.red, 18)} stroke={ok ? COLOR.success : COLOR.red} strokeWidth="1.2" />
      <text x={x + 57} y={y + (sub ? 15 : 21)} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="600">{ok ? '✓ allowed' : '✗ blocked'}</text>
      {sub && <text x={x + 57} y={y + 27} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{sub}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 340 236" style={{ width: '100%', height: 'auto' }}>
      <DgCisspBox x={100} y={6} w={114} h={40} label="Bell-LaPadula" sub="confidentiality" color={COLOR.primary} />
      <DgCisspBox x={220} y={6} w={114} h={40} label="Biba" sub="integrity" color={COLOR.teal} />
      {rows.map((r, i) => {
        const y = 54 + i * 40;
        return (
          <g key={r.l}>
            <text x={6} y={y + 15} fill={COLOR.text} fontSize="10.5" fontWeight="600">{r.l}</text>
            <text x={6} y={y + 28} fill={COLOR.muted} fontSize="8.5">{r.s}</text>
            {cell(100, y, r.blp, r.bs)}
            {cell(220, y, r.biba, r.is)}
          </g>
        );
      })}
      <DgCisspText x={170} y={226} text="BLP: secrets never flow down. Biba: bad data never flows up." />
    </svg>
  );
}

/* 6. PKI chain of trust */
function DiagramCisspPkiChain() {
  const boxes = [
    { y: 8, l: 'Root CA', s: 'offline, self-signed', c: COLOR.red },
    { y: 80, l: 'Intermediate CA', s: 'online, issues certificates', c: COLOR.gold },
    { y: 152, l: 'Leaf certificate', s: 'server cert (X.509)', c: COLOR.blue },
  ];
  const steps = [
    ['Name and dates', 'are valid'],
    ['Leaf signed by', 'intermediate CA'],
    ['Intermediate signed', 'by the root'],
    ['Root is in my', 'trust store'],
    ['Not revoked:', 'CRL or OCSP'],
  ];
  return (
    <svg viewBox="0 0 340 236" style={{ width: '100%', height: 'auto' }}>
      {boxes.map((b, i) => (
        <g key={b.l}>
          <DgCisspBox x={6} y={b.y} w={148} h={46} label={b.l} sub={b.s} color={b.c} />
          {i < 2 && <DgCisspArrow x1={80} y1={b.y + 46} x2={80} y2={b.y + 72} />}
          {i < 2 && <DgCisspText x={88} y={b.y + 63} text="signs" size={8.5} anchor="start" />}
        </g>
      ))}
      <text x={176} y={18} fill={COLOR.text} fontSize="10" fontWeight="600">Client checks upward</text>
      {steps.map((s, i) => {
        const y = 34 + i * 33;
        return (
          <g key={s[0]}>
            <circle cx={186} cy={y + 8} r="9" fill={tint(COLOR.primary, 22)} stroke={COLOR.primary} strokeWidth="1.2" />
            <text x={186} y={y + 11.5} textAnchor="middle" fill={COLOR.text} fontSize="9.5" fontWeight="600">{i + 1}</text>
            <text x={202} y={y + 6} fill={COLOR.text} fontSize="9">{s[0]}</text>
            <text x={202} y={y + 18} fill={COLOR.text} fontSize="9">{s[1]}</text>
          </g>
        );
      })}
      <DgCisspText x={170} y={226} text="Every link must verify, and the root key stays offline." />
    </svg>
  );
}

/* 7. Network zones: defense in depth with DMZ */
function DiagramCisspNetworkZones() {
  return (
    <svg viewBox="0 0 340 302" style={{ width: '100%', height: 'auto' }}>
      <DgCisspBox x={6} y={4} w={328} h={32} label="Internet: untrusted" color={COLOR.red} />
      <DgCisspArrow x1={170} y1={36} x2={170} y2={50} />
      <DgCisspBox x={6} y={50} w={328} h={22} label="Edge firewall: deny by default, allow 443 to DMZ" color={COLOR.gold} labelSize={9} />
      <DgCisspArrow x1={170} y1={72} x2={170} y2={82} />
      <rect x={6} y={82} width={328} height={64} rx="9" fill={tint(COLOR.orange, 10)} stroke={COLOR.orange} strokeWidth="1.3" strokeDasharray="4 3" />
      <text x={14} y={95} fill={COLOR.text} fontSize="9" fontWeight="600">Screened subnet (DMZ): public-facing servers</text>
      <DgCisspBox x={16} y={102} w={150} h={36} label="Web server" sub="behind a WAF" />
      <DgCisspBox x={174} y={102} w={150} h={36} label="Mail relay" sub="public-facing" />
      <DgCisspArrow x1={170} y1={146} x2={170} y2={156} />
      <DgCisspBox x={6} y={156} w={328} h={22} label="Internal firewall: only the ports needed go in" color={COLOR.gold} labelSize={9} />
      <DgCisspArrow x1={170} y1={178} x2={170} y2={190} />
      <rect x={6} y={190} width={328} height={78} rx="9" fill={tint(COLOR.success, 8)} stroke={COLOR.success} strokeWidth="1.3" />
      <text x={14} y={204} fill={COLOR.text} fontSize="9" fontWeight="600">Internal network, segmented by VLAN and ACL</text>
      <DgCisspBox x={14} y={212} w={96} h={46} label="User VLAN" sub="workstations" />
      <DgCisspBox x={122} y={212} w={96} h={46} label="App VLAN" sub="app servers" />
      <DgCisspBox x={230} y={212} w={96} h={46} label="Data VLAN" sub="databases" />
      <DgCisspText x={170} y={284} text="A compromised web server still faces a second firewall." />
      <DgCisspText x={170} y={297} text="An IPS sits inline and blocks; an IDS watches a copy." />
    </svg>
  );
}

/* 8. IPsec transport vs tunnel mode, AH vs ESP */
function DiagramCisspIpsecModes() {
  const seg = (x, y, w, label, c) => (
    <g>
      <rect x={x} y={y} width={w} height={30} rx="4" fill={c ? tint(c, 22) : COLOR.surfaceRaised} stroke={c || COLOR.border} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + 19} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">{label}</text>
    </g>
  );
  const bracket = (x1, x2, y, label) => (
    <g>
      <polyline points={`${x1},${y - 4} ${x1},${y} ${x2},${y} ${x2},${y - 4}`} fill="none" stroke={COLOR.muted} strokeWidth="1.2" />
      <text x={(x1 + x2) / 2} y={y + 11} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 340 272" style={{ width: '100%', height: 'auto' }}>
      <text x={6} y={13} fill={COLOR.text} fontSize="10" fontWeight="600">Transport mode <tspan fill={COLOR.muted} fontWeight="400" fontSize="9">payload, host to host</tspan></text>
      {seg(6, 20, 40, 'IP', null)}
      {seg(48, 20, 40, 'ESP', COLOR.gold)}
      {seg(90, 20, 140, 'TCP + data', COLOR.primary)}
      {seg(232, 20, 40, 'Trailer', COLOR.primary)}
      {seg(274, 20, 40, 'Auth', COLOR.teal)}
      {bracket(90, 272, 58, 'encrypted')}
      {bracket(48, 272, 76, 'authenticated')}

      <text x={6} y={111} fill={COLOR.text} fontSize="10" fontWeight="600">Tunnel mode <tspan fill={COLOR.muted} fontWeight="400" fontSize="9">whole packet, gateway to gateway</tspan></text>
      {seg(6, 118, 48, 'New IP', null)}
      {seg(56, 118, 40, 'ESP', COLOR.gold)}
      {seg(98, 118, 144, 'Orig IP + TCP + data', COLOR.primary)}
      {seg(244, 118, 44, 'Trailer', COLOR.primary)}
      {seg(290, 118, 38, 'Auth', COLOR.teal)}
      {bracket(98, 288, 156, 'encrypted')}
      {bracket(56, 288, 174, 'authenticated')}

      <DgCisspBox x={6} y={198} w={160} h={44} label="AH" sub="authenticates, no encryption" color={COLOR.orange} labelSize={10.5} />
      <DgCisspBox x={174} y={198} w={160} h={44} label="ESP" sub="adds confidentiality (encryption)" color={COLOR.blue} />
      <DgCisspText x={170} y={262} text="Tunnel mode hides the original header: the site-to-site VPN." />
    </svg>
  );
}

/* 9. Authentication factors and access control models */
function DiagramCisspAccessModels() {
  const factors = [
    { l: 'Know', s: 'password, PIN', c: COLOR.primary, x: 6 },
    { l: 'Have', s: 'token, card, phone', c: COLOR.blue, x: 118 },
    { l: 'Are', s: 'fingerprint', c: COLOR.teal, x: 230 },
  ];
  const models = [
    { l: 'DAC', t: 'the owner decides', a: 'Owner shares access freely;', b: 'flexible, but rights drift', c: COLOR.primary, x: 6, y: 112 },
    { l: 'MAC', t: 'labels decide', a: 'Clearance compared to label;', b: 'owners cannot override', c: COLOR.red, x: 172, y: 112 },
    { l: 'RBAC', t: 'the job role decides', a: 'User to role to permissions;', b: 'easy admin, least privilege', c: COLOR.teal, x: 6, y: 182 },
    { l: 'ABAC', t: 'context decides', a: 'Policy over user, data,', b: 'action and environment', c: COLOR.gold, x: 172, y: 182 },
  ];
  return (
    <svg viewBox="0 0 340 266" style={{ width: '100%', height: 'auto' }}>
      <text x={6} y={13} fill={COLOR.text} fontSize="10" fontWeight="600">Authentication factors: MFA = 2 or more categories</text>
      {factors.map((f) => (
        <DgCisspBox key={f.l} x={f.x} y={20} w={104} h={44} label={f.l} sub={f.s} color={f.c} />
      ))}
      <DgCisspText x={170} y={80} text="Password + security question is still one factor." size={8.5} />
      <text x={6} y={103} fill={COLOR.text} fontSize="10" fontWeight="600">Access models: who makes the decision?</text>
      {models.map((m) => (
        <g key={m.l}>
          <rect x={m.x} y={m.y} width={162} height={64} rx="7" fill={tint(m.c, 14)} stroke={m.c} strokeWidth="1.3" />
          <text x={m.x + 8} y={m.y + 16} fill={COLOR.text} fontSize="11" fontWeight="700">{m.l}</text>
          <text x={m.x + 44} y={m.y + 16} fill={COLOR.text} fontSize="9" fontStyle="italic">{m.t}</text>
          <text x={m.x + 8} y={m.y + 35} fill={COLOR.muted} fontSize="8.5">{m.a}</text>
          <text x={m.x + 8} y={m.y + 48} fill={COLOR.muted} fontSize="8.5">{m.b}</text>
        </g>
      ))}
      <DgCisspText x={170} y={260} text="Ask where the decision should live to choose the model." />
    </svg>
  );
}

/* 10. SAML-style federation flow */
function DiagramCisspFederationFlow() {
  const sp = 50, br = 170, idp = 290;
  const msg = (n, y, x1, x2, label) => {
    const mid = (x1 + x2) / 2;
    return (
      <g key={n}>
        <DgCisspArrow x1={x1} y1={y} x2={x2} y2={y} color={COLOR.primary} />
        <text x={mid} y={y - 6} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">{n} {label}</text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 340 308" style={{ width: '100%', height: 'auto' }}>
      <DgCisspBox x={sp - 48} y={6} w={96} h={26} label="Service provider" color={COLOR.blue} labelSize={9.5} />
      <DgCisspBox x={br - 48} y={6} w={96} h={26} label="User + browser" color={COLOR.primary} labelSize={9.5} />
      <DgCisspBox x={idp - 48} y={6} w={96} h={26} label="Identity provider" color={COLOR.teal} labelSize={9.5} />
      {[sp, br, idp].map((x) => (
        <line key={x} x1={x} y1={32} x2={x} y2={234} stroke={COLOR.border} strokeWidth="1.3" strokeDasharray="4 4" />
      ))}
      {msg(1, 60, br - 4, sp + 4, 'Open the app')}
      {msg(2, 92, sp + 4, br - 4, 'Redirect to IdP')}
      {msg(3, 124, br + 4, idp - 4, 'Sign in (MFA)')}
      {msg(4, 156, idp - 4, br + 4, 'Signed assertion')}
      {msg(5, 188, br - 4, sp + 4, 'Present assertion')}
      <rect x={2} y={200} width={112} height={32} rx="6" fill={tint(COLOR.success, 16)} stroke={COLOR.success} strokeWidth="1.2" />
      <text x={58} y={214} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">6 Verify signature,</text>
      <text x={58} y={226} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">grant access</text>
      <DgCisspBox x={6} y={246} w={106} h={40} label="SAML" sub="asserts identity" color={COLOR.teal} />
      <DgCisspBox x={117} y={246} w={106} h={40} label="OAuth 2.0" sub="authorizes" color={COLOR.orange} />
      <DgCisspBox x={228} y={246} w={106} h={40} label="OpenID Connect" sub="authenticates" color={COLOR.primary} labelSize={10} />
      <DgCisspText x={170} y={303} text="SAML flow shown: the SP trusts the IdP's signed assertion." />
    </svg>
  );
}

/* 11. Assessment depth ladder and audit types */
function DiagramCisspTestingLadder() {
  const steps = [
    { l: 'Red team', s: 'emulates adversary; tests detection + response', c: COLOR.red, off: 84, y: 20 },
    { l: 'Penetration test', s: 'exploits flaws; needs written authorization', c: COLOR.orange, off: 56, y: 66 },
    { l: 'Credentialed scan', s: 'logs in to check patches and settings', c: COLOR.gold, off: 28, y: 112 },
    { l: 'Unauthenticated scan', s: 'outside view; finds and ranks weaknesses', c: COLOR.teal, off: 0, y: 158 },
  ];
  const audits = [
    { l: 'Internal', s: 'cheap, readiness', c: COLOR.blue, x: 6 },
    { l: 'External', s: 'credible externally', c: COLOR.primary, x: 118 },
    { l: 'Third-party', s: 'examines suppliers', c: COLOR.pink, x: 230 },
  ];
  return (
    <svg viewBox="0 0 340 292" style={{ width: '100%', height: 'auto' }}>
      <text x={6} y={13} fill={COLOR.text} fontSize="10" fontWeight="600">Technical testing: rising intensity</text>
      <DgCisspText x={6} y={36} text="More depth" size={8.5} anchor="start" />
      <DgCisspText x={6} y={48} text="and risk ▲" size={8.5} anchor="start" />
      {steps.map((s) => (
        <DgCisspBox key={s.l} x={6 + s.off} y={s.y} w={240} h={40} label={s.l} sub={s.s} color={s.c} labelSize={10} />
      ))}
      <text x={6} y={218} fill={COLOR.text} fontSize="10" fontWeight="600">Audits: formal, evidence-based, valued for independence</text>
      {audits.map((a) => (
        <DgCisspBox key={a.l} x={a.x} y={226} w={104} h={42} label={a.l} sub={a.s} color={a.c} />
      ))}
      <DgCisspText x={170} y={284} text="Scans find, pen tests prove, audits verify." />
    </svg>
  );
}

/* 12. Incident response lifecycle and order of volatility */
function DiagramCisspIncidentResponse() {
  const xs = [8, 122, 236];
  const ph = [
    { l: '1 Prepare', s: 'plan, team, tools', c: COLOR.primary, col: 0, row: 0 },
    { l: '2 Detect', s: 'analyze, triage', c: COLOR.blue, col: 1, row: 0 },
    { l: '3 Contain', s: 'limit spread', c: COLOR.orange, col: 2, row: 0 },
    { l: '4 Eradicate', s: 'remove the cause', c: COLOR.red, col: 2, row: 1 },
    { l: '5 Recover', s: 'restore, monitor', c: COLOR.teal, col: 1, row: 1 },
    { l: '6 Review', s: 'no-blame lessons', c: COLOR.gold, col: 0, row: 1 },
  ];
  const vol = [
    { l: 'Memory', s: '+ processes', c: COLOR.red, x: 6 },
    { l: 'Network', s: 'connections', c: COLOR.orange, x: 92 },
    { l: 'Disk', s: 'image copy', c: COLOR.gold, x: 178 },
    { l: 'Logs', s: '+ archives', c: COLOR.teal, x: 264 },
  ];
  return (
    <svg viewBox="0 0 340 280" style={{ width: '100%', height: 'auto' }}>
      <text x={6} y={13} fill={COLOR.text} fontSize="10" fontWeight="600">Incident response lifecycle</text>
      {ph.map((p) => (
        <DgCisspBox key={p.l} x={xs[p.col]} y={22 + p.row * 68} w={96} h={46} label={p.l} sub={p.s} color={p.c} labelSize={10} />
      ))}
      <DgCisspArrow x1={104} y1={45} x2={122} y2={45} />
      <DgCisspArrow x1={218} y1={45} x2={236} y2={45} />
      <DgCisspArrow x1={284} y1={68} x2={284} y2={90} />
      <DgCisspArrow x1={236} y1={113} x2={218} y2={113} />
      <DgCisspArrow x1={122} y1={113} x2={104} y2={113} />
      <DgCisspArrow x1={56} y1={90} x2={56} y2={68} />
      <DgCisspText x={62} y={82} text="improve" size={8.5} anchor="start" />
      <DgCisspText x={170} y={146} text="Contain before eradicating; eradicate before restoring." size={8.5} />
      <text x={6} y={170} fill={COLOR.text} fontSize="10" fontWeight="600">Forensics: collect the most volatile first</text>
      {vol.map((v, i) => (
        <g key={v.l}>
          <DgCisspBox x={v.x} y={180} w={72} h={42} label={v.l} sub={v.s} color={v.c} labelSize={10} />
          {i < 3 && <DgCisspArrow x1={v.x + 72} y1={201} x2={v.x + 86} y2={201} />}
        </g>
      ))}
      <DgCisspText x={6} y={236} text="most volatile" size={8.5} anchor="start" />
      <DgCisspText x={334} y={236} text="most durable" size={8.5} anchor="end" />
      <DgCisspText x={170} y={255} text="Image through a write blocker, verify the hashes," size={9} />
      <DgCisspText x={170} y={268} text="and log chain of custody for everyone who touched it." size={9} />
    </svg>
  );
}

/* 13. Full, incremental and differential backups */
function DiagramCisspBackupTypes() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  const colX = (i) => 96 + i * 48;
  const inc = [60, 12, 16, 10, 14];
  const dif = [60, 12, 28, 38, 52];
  const block = (i, h, base, c) => (
    <g key={`${base}-${i}`}>
      <rect x={colX(i)} y={base - h} width={40} height={h} rx="3" fill={tint(c, 28)} stroke={c} strokeWidth="1.2" />
      {i === 0 && <text x={colX(i) + 20} y={base - h / 2 + 4} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">Full</text>}
    </g>
  );
  const chip = (i, label, c, y) => (
    <g key={`${y}-${i}`}>
      <rect x={colX(i)} y={y} width={40} height={20} rx="4" fill={tint(c, 24)} stroke={c} strokeWidth="1.2" />
      <text x={colX(i) + 20} y={y + 14} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="600">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 340 304" style={{ width: '100%', height: 'auto' }}>
      {days.map((d, i) => (
        <DgCisspText key={d} x={colX(i) + 20} y={13} text={d} size={9} />
      ))}
      <text x={6} y={52} fill={COLOR.text} fontSize="10.5" fontWeight="600">Incremental</text>
      <text x={6} y={65} fill={COLOR.muted} fontSize="8.5">since last backup</text>
      <line x1={92} y1={92} x2={334} y2={92} stroke={COLOR.border} strokeWidth="1.2" />
      {inc.map((h, i) => block(i, h, 92, i === 0 ? COLOR.primary : COLOR.blue))}
      <text x={6} y={134} fill={COLOR.text} fontSize="10.5" fontWeight="600">Differential</text>
      <text x={6} y={147} fill={COLOR.muted} fontSize="8.5">since last full</text>
      <line x1={92} y1={172} x2={334} y2={172} stroke={COLOR.border} strokeWidth="1.2" />
      {dif.map((h, i) => block(i, h, 172, i === 0 ? COLOR.primary : COLOR.orange))}
      <text x={6} y={196} fill={COLOR.text} fontSize="10" fontWeight="600">Restore Thursday needs</text>
      <text x={6} y={224} fill={COLOR.text} fontSize="9.5" fontWeight="600">Incremental</text>
      <text x={6} y={236} fill={COLOR.muted} fontSize="8.5">5 sets, slower</text>
      {['Full', 'Mon', 'Tue', 'Wed', 'Thu'].map((l, i) => chip(i, l, i === 0 ? COLOR.primary : COLOR.blue, 216))}
      <text x={6} y={256} fill={COLOR.text} fontSize="9.5" fontWeight="600">Differential</text>
      <text x={6} y={268} fill={COLOR.muted} fontSize="8.5">2 sets, faster</text>
      {['Full', 'Thu'].map((l, i) => chip(i, l, i === 0 ? COLOR.primary : COLOR.orange, 246))}
      <DgCisspText x={170} y={286} text="Incremental: fast to take, slow to restore." size={9} />
      <DgCisspText x={170} y={299} text="Differential: grows daily, restores faster." size={9} />
    </svg>
  );
}

/* 14. Secure SDLC phases with security activities */
function DiagramCisspSecureSdlc() {
  const rows = [
    { l: 'Requirements', a: 'Write security requirements', b: 'alongside the functional ones', c: COLOR.primary },
    { l: 'Design', a: 'Threat modeling (STRIDE)', b: 'review the design before any code', c: COLOR.blue },
    { l: 'Development', a: 'Secure coding standards', b: 'static analysis reads source early', c: COLOR.teal },
    { l: 'Testing', a: 'Dynamic and interactive tests', b: 'SCA, fuzzing, SBOM inventory', c: COLOR.orange },
    { l: 'Deployment', a: 'Hardened config, signed builds', b: 'protect the pipeline and credentials', c: COLOR.pink },
    { l: 'Maintenance', a: 'Patch, monitor, retire securely', b: 'SBOM shows what a new flaw hits', c: COLOR.gold },
  ];
  return (
    <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }}>
      <DgCisspArrow x1={9} y1={8} x2={9} y2={274} color={COLOR.red} />
      <text x={21} y={141} textAnchor="middle" fill={COLOR.muted} fontSize="8.5" transform="rotate(-90 21 141)">cost to fix a flaw rises</text>
      {rows.map((r, i) => {
        const y = 8 + i * 46;
        return (
          <g key={r.l}>
            <DgCisspBox x={32} y={y} w={92} h={34} label={`${i + 1} ${r.l}`} color={r.c} labelSize={9.5} />
            {i < 5 && <DgCisspArrow x1={78} y1={y + 34} x2={78} y2={y + 46} />}
            <text x={132} y={y + 15} fill={COLOR.text} fontSize="9.5" fontWeight="600">{r.a}</text>
            <text x={132} y={y + 28} fill={COLOR.muted} fontSize="8.5">{r.b}</text>
          </g>
        );
      })}
      <DgCisspText x={185} y={294} text="Shift left: fix flaws early, when they are cheapest." />
    </svg>
  );
}

Object.assign(LESSON_DIAGRAMS, {
  cisspGovernance: DiagramCisspGovernance,
  cisspRiskLoop: DiagramCisspRiskLoop,
  cisspRecoveryTimeline: DiagramCisspRecoveryTimeline,
  cisspDataLifecycle: DiagramCisspDataLifecycle,
  cisspBlpBiba: DiagramCisspBlpBiba,
  cisspPkiChain: DiagramCisspPkiChain,
  cisspNetworkZones: DiagramCisspNetworkZones,
  cisspIpsecModes: DiagramCisspIpsecModes,
  cisspAccessModels: DiagramCisspAccessModels,
  cisspFederationFlow: DiagramCisspFederationFlow,
  cisspTestingLadder: DiagramCisspTestingLadder,
  cisspIncidentResponse: DiagramCisspIncidentResponse,
  cisspBackupTypes: DiagramCisspBackupTypes,
  cisspSecureSdlc: DiagramCisspSecureSdlc,
});
