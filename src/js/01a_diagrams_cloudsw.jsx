/* ---------------- diagrams: CCSP + CSSLP (cloudsw) ---------------- */

function DgCswDefs() {
  return (
    <defs>
      <marker id="dgCswArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={COLOR.muted} />
      </marker>
    </defs>
  );
}

function DgCswArrow({ x1, y1, x2, y2, color, dash }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color || COLOR.muted} strokeWidth="1.3"
      strokeDasharray={dash ? '4 3' : undefined}
      markerEnd="url(#dgCswArr)"
    />
  );
}

function DgCswT({ x, y, children, size, color, weight, anchor, halo }) {
  return (
    <text
      x={x} y={y}
      textAnchor={anchor || 'middle'}
      fill={color || COLOR.muted}
      fontSize={size || 9}
      fontWeight={weight || 400}
      stroke={halo ? COLOR.surface : undefined}
      strokeWidth={halo ? 3 : undefined}
      paintOrder={halo ? 'stroke' : undefined}
    >{children}</text>
  );
}

// A tinted box. lines[0] is the bold title, the rest are muted detail lines.
function DgCswBox({ x, y, w, h, lines, color, dashed }) {
  const n = lines.length;
  const lh = 12;
  const y0 = y + h / 2 - ((n - 1) * lh) / 2 + 3.5;
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="7"
        fill={color ? tint(color, 16) : COLOR.surfaceRaised}
        stroke={color || COLOR.border} strokeWidth="1.2"
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      {lines.map((t, i) => (
        <text
          key={i} x={x + w / 2} y={y0 + i * lh} textAnchor="middle"
          fill={i === 0 ? COLOR.text : COLOR.muted}
          fontSize={i === 0 ? 10 : 8.5} fontWeight={i === 0 ? 600 : 400}
        >{t}</text>
      ))}
    </g>
  );
}

/* ---- CCSP ---- */

function DiagramCswShared() {
  const cols = ['IaaS', 'PaaS', 'SaaS'];
  // true = customer, false = provider
  const rows = [
    ['Data & classification', [1, 1, 1]],
    ['Identities & access', [1, 1, 1]],
    ['Configuration', [1, 1, 1]],
    ['Application code', [1, 1, 0]],
    ['OS & runtime', [1, 0, 0]],
    ['Hypervisor & hardware', [0, 0, 0]],
    ['Facilities', [0, 0, 0]],
  ];
  const labelW = 118, colW = 72, top = 26, rowH = 28;
  const height = top + rows.length * rowH + 44;
  return (
    <svg viewBox={`0 0 340 ${height}`} style={{ width: '100%', height: 'auto' }}>
      {cols.map((c, ci) => (
        <DgCswT key={c} x={labelW + ci * colW + (colW - 6) / 2} y={16} size={10.5} weight={600} color={COLOR.text}>{c}</DgCswT>
      ))}
      {rows.map(([label, vals], ri) => (
        <React.Fragment key={label}>
          <DgCswT x={4} y={top + ri * rowH + 16} anchor="start" size={9.5} color={COLOR.text}>{label}</DgCswT>
          {vals.map((v, ci) => (
            <g key={ci}>
              <rect
                x={labelW + ci * colW} y={top + ri * rowH} width={colW - 6} height={rowH - 4} rx="6"
                fill={tint(v ? COLOR.primary : COLOR.gold, 16)} stroke={v ? COLOR.primary : COLOR.gold} strokeWidth="1.2"
              />
              <DgCswT x={labelW + ci * colW + (colW - 6) / 2} y={top + ri * rowH + 15} size={9} color={COLOR.text}>{v ? 'You' : 'Provider'}</DgCswT>
            </g>
          ))}
        </React.Fragment>
      ))}
      <rect x={labelW} y={height - 32} width="10" height="10" rx="2" fill={tint(COLOR.primary, 16)} stroke={COLOR.primary} strokeWidth="1" />
      <DgCswT x={labelW + 15} y={height - 23} anchor="start" size={8.5}>Customer secures</DgCswT>
      <rect x={labelW + 100} y={height - 32} width="10" height="10" rx="2" fill={tint(COLOR.gold, 16)} stroke={COLOR.gold} strokeWidth="1" />
      <DgCswT x={labelW + 115} y={height - 23} anchor="start" size={8.5}>Provider secures</DgCswT>
      <DCaption x={170} y={height - 6} text="The line shifts by model; data, identities, settings stay yours" />
    </svg>
  );
}

function DiagramCswLifecycle() {
  const bw = 96, bh = 52, xs = [8, 122, 236], y1 = 10, y2 = 96;
  const stages = [
    { n: '1 Create', a: 'classify', b: 'assign an owner', x: xs[0], y: y1 },
    { n: '2 Store', a: 'encrypt', b: 'access control', x: xs[1], y: y1 },
    { n: '3 Use', a: 'monitor', b: 'rights management', x: xs[2], y: y1 },
    { n: '4 Share', a: 'DLP, IRM', b: 'protection follows', x: xs[2], y: y2 },
    { n: '5 Archive', a: 'retention rules', b: 'legal hold', x: xs[1], y: y2 },
    { n: '6 Destroy', a: 'verified deletion', b: 'crypto-erase', x: xs[0], y: y2, c: COLOR.red },
  ];
  return (
    <svg viewBox="0 0 340 258" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      {stages.map((s) => (
        <DgCswBox key={s.n} x={s.x} y={s.y} w={bw} h={bh} lines={[s.n, s.a, s.b]} color={s.c || COLOR.teal} />
      ))}
      <DgCswArrow x1={104} y1={36} x2={121} y2={36} />
      <DgCswArrow x1={218} y1={36} x2={235} y2={36} />
      <DgCswArrow x1={284} y1={63} x2={284} y2={95} />
      <DgCswArrow x1={235} y1={122} x2={219} y2={122} />
      <DgCswArrow x1={121} y1={122} x2={105} y2={122} />
      <DgCswBox x={8} y={166} w={160} h={46} color={COLOR.blue} lines={['DLP', 'watches data in motion', 'blocks policy violations']} />
      <DgCswBox x={172} y={166} w={160} h={46} color={COLOR.pink} lines={['IRM', 'protection sits on the file', 'revocable after sharing']} />
      <DgCswBox x={8} y={220} w={324} h={26} color={COLOR.orange} lines={['Cannot shred provider disks: encrypt, then destroy every key copy']} />
    </svg>
  );
}

function DiagramCswEnvelope() {
  const rows = [
    ['Provider-managed', 'Provider creates and runs', 'everything', 'Yes', ''],
    ['Customer-managed', 'You set policy, rotation,', 'and can disable the key', 'Yes', '(you can disable)'],
    ['BYOK', 'You generate, then import', 'into provider KMS/HSM', 'Yes', '(you can withdraw)'],
    ['HYOK', 'Key never enters provider:', 'e.g. your on-prem HSM', 'No', '(less availability)'],
  ];
  const ty = 168, rh = 36;
  return (
    <svg viewBox="0 0 340 340" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswT x={8} y={11} anchor="start" size={9.5} weight={600} color={COLOR.text}>Envelope encryption</DgCswT>
      <DgCswBox x={8} y={18} w={78} h={30} lines={['Data']} />
      <DgCswArrow x1={86} y1={33} x2={248} y2={33} />
      <DgCswT x={167} y={27} size={8.5} halo>encrypted by the DEK</DgCswT>
      <DgCswBox x={250} y={18} w={82} h={30} lines={['Ciphertext']} color={COLOR.blue} />
      <DgCswBox x={8} y={70} w={78} h={30} lines={['DEK']} color={COLOR.gold} />
      <DgCswArrow x1={86} y1={85} x2={248} y2={85} />
      <DgCswT x={167} y={79} size={8.5} halo>wrapped by the KEK</DgCswT>
      <DgCswBox x={250} y={70} w={82} h={30} lines={['Wrapped DEK']} color={COLOR.gold} />
      <rect x={244} y={12} width={94} height={94} rx="9" fill="none" stroke={COLOR.border} strokeWidth="1.1" strokeDasharray="4 3" />
      <DgCswT x={291} y={119} size={8.5}>stored together</DgCswT>
      <DgCswBox x={112} y={112} w={110} h={30} lines={['KEK in KMS / HSM']} color={COLOR.primary} />
      <DgCswArrow x1={167} y1={112} x2={167} y2={89} />
      <DgCswT x={8} y={150} anchor="start" size={9.5} weight={600} color={COLOR.text}>Who holds the key</DgCswT>
      <DgCswT x={250} y={150} anchor="start" size={8.5}>Provider decrypts?</DgCswT>
      {rows.map((r, i) => {
        const y = ty + i * (rh + 4);
        const no = r[3] === 'No';
        return (
          <g key={r[0]}>
            <rect x={4} y={y} width={332} height={rh} rx="7" fill={no ? tint(COLOR.teal, 16) : COLOR.surfaceRaised} stroke={no ? COLOR.teal : COLOR.border} strokeWidth="1.2" />
            <DgCswT x={12} y={y + 22} anchor="start" size={9.5} weight={600} color={COLOR.text}>{r[0]}</DgCswT>
            <DgCswT x={112} y={y + 15} anchor="start" size={8.5}>{r[1]}</DgCswT>
            <DgCswT x={112} y={y + 27} anchor="start" size={8.5}>{r[2]}</DgCswT>
            <DgCswT x={254} y={y + (r[4] ? 15 : 22)} anchor="start" size={9.5} weight={700} color={no ? COLOR.teal : COLOR.text}>{r[3]}</DgCswT>
            {r[4] && <DgCswT x={254} y={y + 27} anchor="start" size={8.5}>{r[4]}</DgCswT>}
          </g>
        );
      })}
      <DCaption x={170} y={336} text="Must the provider be unable to read it? Only HYOK qualifies" />
    </svg>
  );
}

function DiagramCswIsolation() {
  return (
    <svg viewBox="0 0 340 262" style={{ width: '100%', height: 'auto' }}>
      <DgCswT x={86} y={14} size={10.5} weight={600} color={COLOR.text}>Virtual machines</DgCswT>
      <DgCswT x={254} y={14} size={10.5} weight={600} color={COLOR.text}>Containers</DgCswT>
      <DgCswBox x={8} y={24} w={75} h={64} lines={['VM A', 'guest OS', '+ app']} color={COLOR.blue} />
      <DgCswBox x={89} y={24} w={75} h={64} lines={['VM B', 'guest OS', '+ app']} color={COLOR.blue} />
      <DgCswBox x={8} y={94} w={156} h={26} lines={['Hypervisor (Type 1)']} color={COLOR.primary} />
      <DgCswBox x={8} y={126} w={156} h={26} lines={['Shared hardware']} />
      <DgCswBox x={176} y={24} w={48} h={38} lines={['Ctr A', 'app+libs']} color={COLOR.blue} />
      <DgCswBox x={230} y={24} w={48} h={38} lines={['Ctr B', 'app+libs']} color={COLOR.blue} />
      <DgCswBox x={284} y={24} w={48} h={38} lines={['Ctr C', 'app+libs']} color={COLOR.blue} />
      <DgCswBox x={176} y={68} w={156} h={22} lines={['Container runtime']} />
      <DgCswBox x={176} y={96} w={156} h={24} lines={['One shared OS kernel']} color={COLOR.orange} />
      <DgCswBox x={176} y={126} w={156} h={26} lines={['Shared hardware']} />
      <rect x={8} y={162} width={156} height={78} rx="7" fill={tint(COLOR.primary, 12)} stroke={COLOR.primary} strokeWidth="1.2" />
      <DgCswT x={86} y={177} size={9.5} weight={600} color={COLOR.text}>Boundary: hypervisor</DgCswT>
      <DgCswT x={86} y={192}>Risk: VM escape, side</DgCswT>
      <DgCswT x={86} y={204}>channels, noisy neighbor</DgCswT>
      <DgCswT x={86} y={220}>You: dedicated hosts,</DgCswT>
      <DgCswT x={86} y={232}>confidential computing</DgCswT>
      <rect x={176} y={162} width={156} height={78} rx="7" fill={tint(COLOR.orange, 12)} stroke={COLOR.orange} strokeWidth="1.2" />
      <DgCswT x={254} y={177} size={9.5} weight={600} color={COLOR.text}>Boundary: namespaces</DgCswT>
      <DgCswT x={254} y={192}>+ cgroups, shared kernel:</DgCswT>
      <DgCswT x={254} y={204}>weaker isolation</DgCswT>
      <DgCswT x={254} y={220}>You: scanned, signed images,</DgCswT>
      <DgCswT x={254} y={232}>RBAC, network policies</DgCswT>
      <DCaption x={170} y={256} text="Tenant isolation rests on the hypervisor; containers share a kernel" />
    </svg>
  );
}

function DiagramCswBcdr() {
  const strat = [
    { n: 'Backup & restore', f: 0, t: 'data copies only', r: 'Slowest', c: 'lowest cost' },
    { n: 'Pilot light', f: 0.18, t: 'minimal core running', r: 'Slow', c: 'low cost' },
    { n: 'Warm standby', f: 0.5, t: 'scaled-down copy', r: 'Faster', c: 'higher cost' },
    { n: 'Active-active', f: 1, t: 'full capacity, 2+ sites', r: 'Near zero', c: 'highest cost' },
  ];
  const y0 = 128, rh = 32;
  return (
    <svg viewBox="0 0 340 352" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswT x={110} y={14} size={9} color={COLOR.text}>RPO: data you can lose</DgCswT>
      <line x1={50} y1={22} x2={170} y2={22} stroke={COLOR.gold} strokeWidth="1.6" />
      <line x1={50} y1={18} x2={50} y2={26} stroke={COLOR.gold} strokeWidth="1.6" />
      <line x1={170} y1={18} x2={170} y2={26} stroke={COLOR.gold} strokeWidth="1.6" />
      <line x1={20} y1={40} x2={322} y2={40} stroke={COLOR.border} strokeWidth="1.4" />
      <circle cx={50} cy={40} r={4.5} fill={COLOR.blue} />
      <circle cx={170} cy={40} r={4.5} fill={COLOR.red} />
      <circle cx={290} cy={40} r={4.5} fill={COLOR.blue} />
      <DgCswT x={50} y={58}>last good copy</DgCswT>
      <DgCswT x={170} y={58}>disaster</DgCswT>
      <DgCswT x={290} y={58}>service restored</DgCswT>
      <line x1={170} y1={68} x2={290} y2={68} stroke={COLOR.primary} strokeWidth="1.6" />
      <line x1={170} y1={64} x2={170} y2={72} stroke={COLOR.primary} strokeWidth="1.6" />
      <line x1={290} y1={64} x2={290} y2={72} stroke={COLOR.primary} strokeWidth="1.6" />
      <DgCswT x={230} y={84} size={9} color={COLOR.text}>RTO: downtime allowed</DgCswT>
      <DgCswT x={8} y={112} anchor="start" size={9.5} weight={600} color={COLOR.text}>Recovery strategy</DgCswT>
      <DgCswT x={108} y={112} anchor="start" size={8.5}>Running in the DR site</DgCswT>
      <DgCswT x={248} y={112} anchor="start" size={8.5}>Recovery time</DgCswT>
      {strat.map((s, i) => {
        const y = y0 + i * (rh + 4);
        return (
          <g key={s.n}>
            <DgCswT x={8} y={y + 20} anchor="start" size={9.5} weight={600} color={COLOR.text}>{s.n}</DgCswT>
            <rect x={108} y={y} width={132} height={rh} rx="6" fill="none" stroke={COLOR.border} strokeWidth="1.2" />
            {s.f > 0 && <rect x={112} y={y + rh - 11} width={124 * s.f} height={6} rx="3" fill={COLOR.teal} />}
            <DgCswT x={114} y={y + 14} anchor="start" size={8.5} color={COLOR.text}>{s.t}</DgCswT>
            <DgCswT x={248} y={y + 14} anchor="start" size={9.5} weight={600} color={COLOR.text}>{s.r}</DgCswT>
            <DgCswT x={248} y={y + 26} anchor="start" size={8.5}>{s.c}</DgCswT>
          </g>
        );
      })}
      <DgCswBox x={8} y={276} w={160} h={50} color={COLOR.blue} lines={['Synchronous', 'ack after both sites write', 'RPO near 0, more latency']} />
      <DgCswBox x={172} y={276} w={160} h={50} color={COLOR.orange} lines={['Asynchronous', 'ack first, copy after', 'faster, may lose last writes']} />
      <DCaption x={170} y={344} text="Pick the cheapest row that meets RTO and RPO (RTO below MTD)" />
    </svg>
  );
}

function DiagramCswApiFlow() {
  const cx = { cl: 38, idp: 118, gw: 214, be: 298 };
  return (
    <svg viewBox="0 0 340 306" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      {Object.values(cx).map((x) => (
        <line key={x} x1={x} y1={34} x2={x} y2={262} stroke={COLOR.border} strokeWidth="1.1" strokeDasharray="3 3" />
      ))}
      <DgCswBox x={7} y={8} w={62} h={26} lines={['Client']} color={COLOR.blue} />
      <DgCswBox x={85} y={8} w={66} h={26} lines={['IdP']} color={COLOR.teal} />
      <DgCswBox x={170} y={8} w={88} h={26} lines={['API gateway']} color={COLOR.primary} />
      <DgCswBox x={268} y={8} w={64} h={26} lines={['Backend']} color={COLOR.gold} />
      <DgCswArrow x1={cx.cl} y1={58} x2={cx.idp - 2} y2={58} />
      <DgCswT x={78} y={52} size={8.5} halo>1 sign in + MFA</DgCswT>
      <DgCswArrow x1={cx.idp} y1={86} x2={cx.cl + 2} y2={86} />
      <DgCswT x={78} y={80} size={8.5} halo>2 access token</DgCswT>
      <DgCswArrow x1={cx.cl} y1={114} x2={cx.gw - 2} y2={114} />
      <DgCswT x={126} y={108} size={8.5} color={COLOR.text} halo>3 request + token</DgCswT>
      <rect x={146} y={124} width={134} height={66} rx="7" fill={tint(COLOR.primary, 14)} stroke={COLOR.primary} strokeWidth="1.2" />
      <DgCswT x={213} y={139} size={9.5} weight={600} color={COLOR.text}>Gateway checks</DgCswT>
      <DgCswT x={213} y={152}>token valid (authentication)</DgCswT>
      <DgCswT x={213} y={164}>rate limit + schema validation</DgCswT>
      <DgCswT x={213} y={176}>log the call</DgCswT>
      <DgCswArrow x1={cx.gw} y1={210} x2={cx.be - 2} y2={210} />
      <DgCswT x={256} y={204} size={8.5} halo>4 forward</DgCswT>
      <rect x={232} y={220} width={104} height={50} rx="7" fill={tint(COLOR.gold, 14)} stroke={COLOR.gold} strokeWidth="1.2" />
      <DgCswT x={284} y={235} size={9.5} weight={600} color={COLOR.text}>Backend checks</DgCswT>
      <DgCswT x={284} y={248}>this object + action</DgCswT>
      <DgCswT x={284} y={260}>(stops BOLA)</DgCswT>
      <DCaption x={170} y={288} text="OAuth 2.0 delegates access; OIDC proves who you are" />
      <DCaption x={170} y={300} text="A WAF compensates; per-object authorization is the real fix" />
    </svg>
  );
}

function DiagramCswIr() {
  const ph = [
    { l: ['1 Prepare'], c: COLOR.blue },
    { l: ['2 Detect &', 'analyze'] },
    { l: ['3 Contain'], c: COLOR.orange },
    { l: ['4 Eradicate', '& recover'] },
    { l: ['5 Lessons', 'learned'] },
  ];
  return (
    <svg viewBox="0 0 340 312" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      {ph.map((p, i) => (
        <DgCswBox key={i} x={8 + i * 68} y={8} w={62} h={38} lines={p.l.length === 1 ? p.l : [p.l[0], p.l[1]]} color={p.c} />
      ))}
      <DgCswBox x={8} y={56} w={324} h={44} color={COLOR.blue} lines={['Prepare decides the outcome in the cloud', 'logging on · isolated analysis account', 'provider contacts · written playbooks']} />
      <rect x={8} y={110} width={324} height={100} rx="8" fill={tint(COLOR.orange, 12)} stroke={COLOR.orange} strokeWidth="1.2" />
      <DgCswT x={170} y={126} size={10} weight={600} color={COLOR.text}>Contain: isolate, do not destroy</DgCswT>
      <DgCswBox x={16} y={136} w={92} h={38} lines={['Quarantine', 'network']} />
      <DgCswBox x={124} y={136} w={92} h={38} lines={['Snapshot', 'disks + memory']} />
      <DgCswBox x={232} y={136} w={92} h={38} lines={['Revoke creds,', 'rotate keys']} />
      <DgCswArrow x1={108} y1={155} x2={123} y2={155} />
      <DgCswArrow x1={216} y1={155} x2={231} y2={155} />
      <DgCswT x={170} y={196} size={9} weight={600} color={COLOR.red}>Power off or terminate first = volatile evidence lost</DgCswT>
      <DgCswT x={8} y={230} anchor="start" size={9.5} weight={600} color={COLOR.text}>Evidence: collect in order of volatility</DgCswT>
      <DgCswBox x={8} y={238} w={96} h={38} lines={['Memory +', 'processes']} color={COLOR.red} />
      <DgCswBox x={122} y={238} w={96} h={38} lines={['Disks', 'from snapshots']} color={COLOR.gold} />
      <DgCswBox x={236} y={238} w={96} h={38} lines={['Archived', 'logs']} color={COLOR.teal} />
      <DgCswArrow x1={104} y1={257} x2={121} y2={257} />
      <DgCswArrow x1={218} y1={257} x2={235} y2={257} />
      <DCaption x={170} y={296} text="Work on copies · hash to prove integrity · chain of custody" />
    </svg>
  );
}

function DiagramCswLegal() {
  const rows = [
    ['SOC 1', 'controls over financial reporting', ''],
    ['SOC 2', 'security, availability, integrity,', 'confidentiality, privacy'],
    ['', 'Type I: design at a point in time', 'Type II: operating over a period'],
    ['SOC 3', 'public summary report', ''],
    ['ISO 27001', 'certifies an ISMS; 27017 adds cloud', '27018 covers personal data'],
    ['CSA STAR', 'Level 1: self-assessment', 'Level 2: third-party audit'],
  ];
  return (
    <svg viewBox="0 0 340 376" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswT x={8} y={12} anchor="start" size={9.5} weight={600} color={COLOR.text}>Transfer of EU personal data</DgCswT>
      <DgCswBox x={8} y={20} w={88} h={64} lines={['Personal data', 'stored in the EU']} color={COLOR.blue} />
      <DgCswBox x={110} y={20} w={124} h={64} color={COLOR.gold} lines={['Lawful mechanism', 'adequacy decision,', 'SCCs, or BCRs', '+ transfer assessment']} />
      <DgCswBox x={248} y={20} w={84} h={64} lines={['Third country', 'other legal', 'system']} color={COLOR.teal} />
      <DgCswArrow x1={96} y1={52} x2={109} y2={52} />
      <DgCswArrow x1={234} y1={52} x2={247} y2={52} />
      <DgCswBox x={8} y={94} w={324} h={36} color={COLOR.red} lines={['Foreign access can still apply', 'e.g. US CLOUD Act can compel a US provider anywhere']} />
      <DgCswT x={170} y={146} size={8.5}>Residency = where it sits. Sovereignty = whose law governs it.</DgCswT>
      <DgCswT x={8} y={170} anchor="start" size={9.5} weight={600} color={COLOR.text}>Independent assurance reports</DgCswT>
      {rows.map((r, i) => {
        const y = 178 + i * 30;
        return (
          <g key={i}>
            {r[0] && <rect x={4} y={y} width={80} height={r[0] === 'SOC 2' ? 58 : 26} rx="6" fill={tint(COLOR.primary, 16)} stroke={COLOR.primary} strokeWidth="1.2" />}
            {r[0] && <DgCswT x={44} y={y + (r[0] === 'SOC 2' ? 33 : 16)} size={9.5} weight={600} color={COLOR.text}>{r[0]}</DgCswT>}
            <DgCswT x={92} y={y + (r[2] ? 11 : 16)} anchor="start" size={8.5} color={COLOR.text}>{r[1]}</DgCswT>
            {r[2] && <DgCswT x={92} y={y + 22} anchor="start" size={8.5} color={COLOR.text}>{r[2]}</DgCswT>}
          </g>
        );
      })}
      <DCaption x={170} y={370} text="The customer stays accountable even when the provider processes" />
    </svg>
  );
}

/* ---- CSSLP ---- */

function DiagramCswPrinciples() {
  const groups = [
    {
      t: 'Limit who can do what', c: COLOR.blue, y: 8,
      items: [
        ['Least privilege', 'only the access needed'],
        ['Separation of duties', 'no one finishes it alone'],
        ['Separation of privilege', 'needs more than one condition'],
        ['Least common mechanism', 'minimize shared components'],
      ],
    },
    {
      t: 'Check every time, fail closed', c: COLOR.orange, y: 112,
      items: [
        ['Fail-safe defaults', 'deny by default, fail closed'],
        ['Complete mediation', 'check every access, every time'],
        ['Defense in depth', 'several independent layered controls'],
      ],
    },
    {
      t: 'Keep it simple and honest', c: COLOR.teal, y: 216,
      items: [
        ['Economy of mechanism', 'small, simple, verifiable'],
        ['Open design', 'only the keys are secret'],
        ['Psychological acceptability', 'controls people will not bypass'],
      ],
    },
  ];
  return (
    <svg viewBox="0 0 340 330" style={{ width: '100%', height: 'auto' }}>
      {groups.map((g) => (
        <g key={g.t}>
          <DgCswT x={8} y={g.y + 8} anchor="start" size={9.5} weight={700} color={g.c}>{g.t}</DgCswT>
          {g.items.map((it, i) => {
            const full = g.items.length === 3 && i === 2;
            const col = full ? 0 : i % 2;
            const row = full ? 1 : Math.floor(i / 2);
            const x = 8 + col * 164, w = full ? 324 : 160, y = g.y + 16 + row * 40;
            return <DgCswBox key={it[0]} x={x} y={y} w={w} h={36} color={g.c} lines={[it[0], it[1]]} />;
          })}
        </g>
      ))}
      <DCaption x={170} y={322} text="Admin-run service, fail-open gateway, check-once API: each breaks one" />
    </svg>
  );
}

function DiagramCswSdlc() {
  const ph = [
    ['Requirements', 'security + privacy requirements'],
    ['Design', 'threat modeling, secure architecture'],
    ['Implementation', 'secure coding, code review'],
    ['Testing', 'security tests, exit criteria'],
    ['Release', 'signed build, hardening, acceptance'],
    ['Operations', 'monitoring, patching, response'],
  ];
  const rowH = 42;
  return (
    <svg viewBox="0 0 340 296" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <line x1={24} y1={27} x2={24} y2={27 + 5 * rowH} stroke={COLOR.border} strokeWidth="1.5" />
      {ph.map((p, i) => {
        const y = 10 + i * rowH;
        return (
          <g key={p[0]}>
            <circle cx={24} cy={y + 17} r={5} fill={COLOR.teal} />
            <rect x={44} y={y} width={222} height={34} rx="7" fill={tint(COLOR.teal, 14)} stroke={COLOR.teal} strokeWidth="1.2" />
            <DgCswT x={54} y={y + 14} anchor="start" size={10} weight={600} color={COLOR.text}>{p[0]}</DgCswT>
            <DgCswT x={54} y={y + 27} anchor="start" size={8.5}>{p[1]}</DgCswT>
            {i < ph.length - 1 && (
              <path d={`M24,${y + 38} l5,4 l-5,4 l-5,-4 z`} fill={COLOR.gold} stroke={COLOR.gold} strokeWidth="1" />
            )}
          </g>
        );
      })}
      <DgCswT x={306} y={14} size={8.5}>cheap</DgCswT>
      <DgCswArrow x1={306} y1={22} x2={306} y2={228} />
      <text x={296} y={125} fill={COLOR.muted} fontSize="9" textAnchor="middle" transform="rotate(90 296 125)">cost to fix a defect rises</text>
      <DgCswT x={306} y={242} size={8.5}>incident</DgCswT>
      <path d="M8,268 l5,4 l-5,4 l-5,-4 z" fill={COLOR.gold} stroke={COLOR.gold} strokeWidth="1" />
      <DgCswT x={20} y={276} anchor="start" size={8.5}>Gate: criteria to pass; exception = documented risk acceptance</DgCswT>
      <DCaption x={170} y={292} text="Shift left: found in requirements it costs a conversation" />
    </svg>
  );
}

function DiagramCswAbuse() {
  const chain = [['Source', 52], ['Requirement', 76], ['Design', 54], ['Code', 44], ['Test', 44]];
  let cxp = 8;
  const chainPos = chain.map(([n, w]) => { const r = [n, w, cxp]; cxp += w + 13; return r; });
  return (
    <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswBox x={8} y={8} w={156} h={74} color={COLOR.blue} lines={['Use case', 'actor: customer', 'places an order']} />
      <DgCswBox x={176} y={8} w={156} h={74} color={COLOR.red} lines={['Abuse case', 'attacker: thousands of orders', 'with stolen cards, or edits the', 'order number to read another']} />
      <DgCswArrow x1={86} y1={82} x2={86} y2={104} />
      <DgCswBox x={8} y={106} w={156} h={46} lines={['Functional tests', 'does it do what it should?']} />
      <DgCswArrow x1={254} y1={82} x2={254} y2={104} />
      <DgCswBox x={176} y={106} w={156} h={60} color={COLOR.gold} lines={['Security requirements', 'rate limiting', 'fraud checks', 'object-level authorization']} />
      <DgCswArrow x1={254} y1={166} x2={254} y2={186} />
      <DgCswBox x={176} y={188} w={156} h={30} color={COLOR.orange} lines={['Negative test cases']} />
      <DgCswT x={8} y={244} anchor="start" size={9.5} weight={600} color={COLOR.text}>Traceability matrix links each requirement to</DgCswT>
      {chainPos.map((c, i) => (
        <React.Fragment key={c[0]}>
          <DgCswBox x={c[2]} y={252} w={c[1]} h={28} lines={[c[0]]} color={c[0] === 'Requirement' ? COLOR.gold : undefined} />
          {i < chainPos.length - 1 && <DgCswArrow x1={c[2] + c[1]} y1={266} x2={chainPos[i + 1][2] - 1} y2={266} />}
        </React.Fragment>
      ))}
      <DCaption x={170} y={296} text="Abuse cases become requirements, then negative tests" />
    </svg>
  );
}

function DiagramCswDfd() {
  const stride = [
    ['S', 'Spoofing', 'authentication'],
    ['T', 'Tampering', 'integrity'],
    ['R', 'Repudiation', 'non-repudiation'],
    ['I', 'Information disclosure', 'confidentiality'],
    ['D', 'Denial of service', 'availability'],
    ['E', 'Elevation of privilege', 'authorization'],
  ];
  return (
    <svg viewBox="0 0 340 320" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <rect x={4} y={6} width={98} height={140} rx="8" fill="none" stroke={COLOR.orange} strokeWidth="1.3" strokeDasharray="5 3" />
      <rect x={108} y={6} width={120} height={140} rx="8" fill="none" stroke={COLOR.orange} strokeWidth="1.3" strokeDasharray="5 3" />
      <rect x={234} y={6} width={102} height={140} rx="8" fill="none" stroke={COLOR.orange} strokeWidth="1.3" strokeDasharray="5 3" />
      <DgCswT x={53} y={20} size={8.5}>Internet</DgCswT>
      <DgCswT x={168} y={20} size={8.5}>App tier</DgCswT>
      <DgCswT x={285} y={20} size={8.5}>Data tier</DgCswT>
      <DgCswBox x={12} y={62} w={64} h={38} lines={['User', 'external']} color={COLOR.blue} />
      <ellipse cx={168} cy={81} rx={40} ry={26} fill={tint(COLOR.primary, 16)} stroke={COLOR.primary} strokeWidth="1.2" />
      <DgCswT x={168} y={79} size={10} weight={600} color={COLOR.text}>Web app</DgCswT>
      <DgCswT x={168} y={91} size={8.5}>process</DgCswT>
      <rect x={246} y={62} width={78} height={38} fill={tint(COLOR.gold, 16)} stroke="none" />
      <line x1={246} y1={62} x2={324} y2={62} stroke={COLOR.gold} strokeWidth="1.4" />
      <line x1={246} y1={100} x2={324} y2={100} stroke={COLOR.gold} strokeWidth="1.4" />
      <DgCswT x={285} y={79} size={10} weight={600} color={COLOR.text}>Database</DgCswT>
      <DgCswT x={285} y={91} size={8.5}>data store</DgCswT>
      <DgCswArrow x1={76} y1={81} x2={126} y2={81} />
      <DgCswArrow x1={208} y1={81} x2={245} y2={81} />
      <DgCswT x={101} y={72} size={8.5} color={COLOR.orange} weight={700} halo>T·I·D</DgCswT>
      <DgCswT x={227} y={72} size={8.5} color={COLOR.orange} weight={700} halo>T·I·D</DgCswT>
      <DgCswT x={44} y={116} size={8.5}>S·R</DgCswT>
      <DgCswT x={168} y={126} size={8.5}>S·T·R·I·D·E</DgCswT>
      <DgCswT x={285} y={116} size={8.5}>T·R·I·D</DgCswT>
      <DgCswT x={8} y={166} anchor="start" size={9.5} weight={600} color={COLOR.text}>STRIDE: threat and the property it violates</DgCswT>
      {stride.map((s, i) => (
        <g key={s[0]}>
          <DgCswT x={12} y={184 + i * 17} anchor="start" size={10} weight={700} color={COLOR.orange}>{s[0]}</DgCswT>
          <DgCswT x={28} y={184 + i * 17} anchor="start" size={9} color={COLOR.text}>{s[1]}</DgCswT>
          <DgCswT x={164} y={184 + i * 17} anchor="start" size={9}>{'→ ' + s[2]}</DgCswT>
        </g>
      ))}
      <DCaption x={170} y={298} text="Look first at flows that cross a trust boundary" />
      <DCaption x={170} y={311} text="STRIDE classifies threats; DREAD ranks them" />
    </svg>
  );
}

function DiagramCswValidate() {
  return (
    <svg viewBox="0 0 340 296" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswBox x={70} y={6} w={200} h={36} color={COLOR.red} lines={['Untrusted input', 'form, URL, header, API body']} />
      <DgCswArrow x1={170} y1={42} x2={170} y2={58} />
      <DgCswBox x={30} y={60} w={280} h={42} color={COLOR.blue} lines={['1 Input validation, on the server', 'allow-list: type, length, range, format']} />
      <DgCswArrow x1={170} y1={102} x2={170} y2={118} />
      <DgCswBox x={30} y={120} w={280} h={42} color={COLOR.primary} lines={['2 Authorization on every request', 'default deny; check object ownership']} />
      <DgCswArrow x1={170} y1={162} x2={60} y2={186} />
      <DgCswArrow x1={170} y1={162} x2={170} y2={186} />
      <DgCswArrow x1={170} y1={162} x2={280} y2={186} />
      <DgCswT x={170} y={178} size={8.5} halo>3 output side: keep data out of code</DgCswT>
      <DgCswBox x={8} y={188} w={104} h={62} color={COLOR.teal} lines={['Database', 'parameterized', 'queries only', 'stops SQL injection']} />
      <DgCswBox x={118} y={188} w={104} h={62} color={COLOR.teal} lines={['Browser page', 'encode for context', 'HTML, attr, JS, URL', 'stops XSS (+ CSP)']} />
      <DgCswBox x={228} y={188} w={104} h={62} color={COLOR.teal} lines={['Outbound fetch', 'allow-list targets', 'block internal ranges', 'stops SSRF']} />
      <DgCswT x={170} y={268} size={8.5}>Errors: generic message to the user, detail to protected logs</DgCswT>
      <DCaption x={170} y={284} text="Client-side checks are a convenience, never the control" />
    </svg>
  );
}

function DiagramCswTestTools() {
  const cols = [
    { x: 4, w: 136, t: 'Code + build', s: 'no running app', c: COLOR.blue },
    { x: 144, w: 108, t: 'Running test app', s: 'exercised by tests', c: COLOR.orange },
    { x: 256, w: 80, t: 'Production', s: 'live traffic', c: COLOR.pink },
  ];
  return (
    <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }}>
      {cols.map((c) => (
        <g key={c.t}>
          <rect x={c.x} y={4} width={c.w} height={226} rx="8" fill={tint(c.c, 7)} stroke={c.c} strokeWidth="1" strokeDasharray="4 3" />
          <DgCswT x={c.x + c.w / 2} y={19} size={9.5} weight={600} color={COLOR.text}>{c.t}</DgCswT>
          <DgCswT x={c.x + c.w / 2} y={30} size={8.5}>{c.s}</DgCswT>
        </g>
      ))}
      <DgCswBox x={8} y={40} w={128} h={38} color={COLOR.blue} lines={['SAST', 'source or binaries, no run']} />
      <DgCswBox x={8} y={86} w={128} h={38} color={COLOR.teal} lines={['SCA', 'vulnerable components']} />
      <DgCswBox x={148} y={40} w={100} h={38} color={COLOR.orange} lines={['Fuzzing', 'malformed input']} />
      <DgCswBox x={148} y={86} w={100} h={38} color={COLOR.orange} lines={['IAST', 'sensors inside app']} />
      <DgCswBox x={148} y={132} w={100} h={38} color={COLOR.orange} lines={['DAST', 'probes from outside']} />
      <DgCswBox x={260} y={40} w={72} h={54} color={COLOR.pink} lines={['RASP', 'inside the app,', 'blocks attacks']} />
      <DgCswT x={72} y={152} size={8.5}>finds the exact line,</DgCswT>
      <DgCswT x={72} y={164} size={8.5}>but false positives</DgCswT>
      <DgCswT x={72} y={176} size={8.5}>and blind to runtime</DgCswT>
      <DgCswT x={198} y={196} size={8.5}>real behavior, but only</DgCswT>
      <DgCswT x={198} y={208} size={8.5}>paths the tests reach</DgCswT>
      <DgCswT x={170} y={252} size={8.5}>Vulnerability scan lists potential weaknesses</DgCswT>
      <DgCswT x={170} y={265} size={8.5}>Pen test proves exploitability (written authorization first)</DgCswT>
      <DCaption x={170} y={288} text="Static sees code; dynamic sees behavior; RASP defends" />
    </svg>
  );
}

function DiagramCswSbom() {
  return (
    <svg viewBox="0 0 340 330" style={{ width: '100%', height: 'auto' }}>
      <DgCswDefs />
      <DgCswT x={8} y={12} anchor="start" size={9.5} weight={600} color={COLOR.text}>1 Assemble and ship</DgCswT>
      <DgCswBox x={8} y={20} w={100} h={66} color={COLOR.blue} lines={['Suppliers', 'open-source libs,', 'images, vendors,', 'update channels']} />
      <DgCswBox x={120} y={20} w={100} h={66} color={COLOR.teal} lines={['Your build', 'lock files + hashes', 'SCA on every build', 'private registry']} />
      <DgCswBox x={232} y={20} w={100} h={66} color={COLOR.gold} lines={['Release', 'signed artifact', 'SBOM + provenance', '(SLSA record)']} />
      <DgCswArrow x1={108} y1={53} x2={119} y2={53} />
      <DgCswArrow x1={220} y1={53} x2={231} y2={53} />
      <DgCswT x={8} y={108} anchor="start" size={9.5} weight={600} color={COLOR.text}>2 React when a CVE is announced</DgCswT>
      <DgCswBox x={8} y={116} w={100} h={46} color={COLOR.red} lines={['New CVE', 'in a library']} />
      <DgCswBox x={120} y={116} w={100} h={46} lines={['Match against', 'SBOM inventory']} />
      <DgCswBox x={232} y={116} w={100} h={46} color={COLOR.gold} lines={['VEX statement', 'affected or not']} />
      <DgCswArrow x1={108} y1={139} x2={119} y2={139} />
      <DgCswArrow x1={220} y1={139} x2={231} y2={139} />
      <DgCswT x={8} y={184} anchor="start" size={9.5} weight={600} color={COLOR.text}>3 Dependency confusion</DgCswT>
      <DgCswBox x={8} y={192} w={100} h={50} color={COLOR.red} lines={['Public registry', 'attacker posts', 'internal-lib v99']} />
      <DgCswBox x={120} y={192} w={100} h={50} lines={['Build tool', 'takes the', 'highest version']} />
      <DgCswBox x={232} y={192} w={100} h={50} color={COLOR.teal} lines={['Private registry', 'real internal-lib', 'v1.2']} />
      <DgCswArrow x1={108} y1={217} x2={119} y2={217} color={COLOR.red} />
      <DgCswArrow x1={232} y1={217} x2={221} y2={217} />
      <DgCswBox x={8} y={252} w={324} h={52} color={COLOR.teal} lines={['Fix', 'scope or reserve internal names, resolve from private registry', 'pin versions + verify hashes, limit build network access']} />
      <DCaption x={170} y={322} text="SBOM is an inventory; VEX says if it is exploitable here" />
    </svg>
  );
}

Object.assign(LESSON_DIAGRAMS, {
  cswShared: DiagramCswShared,
  cswLifecycle: DiagramCswLifecycle,
  cswEnvelope: DiagramCswEnvelope,
  cswIsolation: DiagramCswIsolation,
  cswBcdr: DiagramCswBcdr,
  cswApiFlow: DiagramCswApiFlow,
  cswIr: DiagramCswIr,
  cswLegal: DiagramCswLegal,
  cswPrinciples: DiagramCswPrinciples,
  cswSdlc: DiagramCswSdlc,
  cswAbuse: DiagramCswAbuse,
  cswDfd: DiagramCswDfd,
  cswValidate: DiagramCswValidate,
  cswTestTools: DiagramCswTestTools,
  cswSbom: DiagramCswSbom,
});
