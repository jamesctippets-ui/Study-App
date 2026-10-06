/* ---------------- diagrams: ISC2 CC, SSCP and CGRC lessons ---------------- */

// Shared helpers (unique prefix DgCore so nothing collides with other files).
function DgCoreBox({ x, y, w, h, label, sub, sub2, color, dashed, labelSize, labelWeight, body }) {
  const lines = [label, sub, sub2].filter(Boolean);
  const n = lines.length;
  const gap = 12;
  const y0 = y + h / 2 - ((n - 1) * gap) / 2 + 3.5;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={color ? tint(color, 15) : COLOR.surfaceRaised} stroke={color || COLOR.border} strokeWidth="1.3" strokeDasharray={dashed ? '4 3' : undefined} />
      {lines.map((t, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y0 + i * gap}
          textAnchor="middle"
          fill={i === 0 || body ? COLOR.text : COLOR.muted}
          fontSize={i === 0 ? (labelSize || 10.5) : (body ? 9.5 : 8.5)}
          fontWeight={i === 0 ? (labelWeight || 600) : 400}
        >{t}</text>
      ))}
    </g>
  );
}

function DgCoreFrame({ x, y, w, h, color, label, dashed }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={tint(color, 6)} stroke={color} strokeWidth="1.2" strokeDasharray={dashed ? '4 3' : undefined} />
      {label && <text x={x + 8} y={y + 14} fill={COLOR.text} fontSize="9" fontWeight="700">{label}</text>}
    </g>
  );
}

function DgCoreArrow({ x1, y1, x2, y2, color, dashed, hs }) {
  const c = color || COLOR.muted;
  const s = hs || 5;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const bx = x2 - ux * s, by = y2 - uy * s;
  const px = -uy * s * 0.6, py = ux * s * 0.6;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth="1.3" strokeDasharray={dashed ? '3 3' : undefined} />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={c} />
    </g>
  );
}

function DgCoreText({ x, y, t, size, color, weight, anchor }) {
  return (
    <text x={x} y={y} textAnchor={anchor || 'middle'} fill={color || COLOR.muted} fontSize={size || 9} fontWeight={weight || 400}>{t}</text>
  );
}

function DgCoreBadge({ cx, cy, n, color }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="8" fill={COLOR.surfaceRaised} stroke={color} strokeWidth="1.3" />
      <text x={cx} y={cy + 3.2} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="700">{n}</text>
    </g>
  );
}

// Six-step loop: left column top to bottom, then right column bottom to top, back to step 1.
function DgCoreLoop({ items, colors, top = 14, leftX = 8, rightX = 196, w = 136, h = 44, gap = 18 }) {
  const slots = [
    { x: leftX, y: top }, { x: leftX, y: top + (h + gap) }, { x: leftX, y: top + 2 * (h + gap) },
    { x: rightX, y: top + 2 * (h + gap) }, { x: rightX, y: top + (h + gap) }, { x: rightX, y: top },
  ];
  const cl = leftX + w / 2, cr = rightX + w / 2;
  return (
    <g>
      <DgCoreArrow x1={cl} y1={slots[0].y + h} x2={cl} y2={slots[1].y} />
      <DgCoreArrow x1={cl} y1={slots[1].y + h} x2={cl} y2={slots[2].y} />
      <DgCoreArrow x1={leftX + w} y1={slots[2].y + h / 2} x2={rightX} y2={slots[2].y + h / 2} />
      <DgCoreArrow x1={cr} y1={slots[3].y} x2={cr} y2={slots[4].y + h} />
      <DgCoreArrow x1={cr} y1={slots[4].y} x2={cr} y2={slots[5].y + h} />
      <DgCoreArrow x1={rightX} y1={slots[5].y + h / 2} x2={leftX + w} y2={slots[0].y + h / 2} />
      {items.map((it, i) => (
        <g key={i}>
          <DgCoreBox x={slots[i].x} y={slots[i].y} w={w} h={h} label={it[0]} sub={it[1]} color={colors[i]} />
          <DgCoreBadge cx={slots[i].x + 10} cy={slots[i].y} n={i + 1} color={colors[i]} />
        </g>
      ))}
    </g>
  );
}

/* ===================== ISC2 CC ===================== */

function DgCoreCiaControls() {
  const goals = [
    ['Confidentiality', 'right people only', 'fail: leaked list', COLOR.teal],
    ['Integrity', 'accurate, unaltered', 'fail: tampered invoice', COLOR.blue],
    ['Availability', 'works when needed', 'fail: DDoS, power cut', COLOR.orange],
  ];
  const fns = [
    ['Deterrent', 'discourages', 'Warning sign', 'physical', COLOR.orange],
    ['Preventive', 'stops it', 'Firewall', 'technical', COLOR.blue],
    ['Detective', 'notices it', 'Camera', 'physical', COLOR.orange],
    ['Corrective', 'fixes afterward', 'Restore backup', 'technical', COLOR.blue],
  ];
  return (
    <svg viewBox="0 0 340 306" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={12} t="THE THREE GOALS" size={9} weight={700} anchor="start" />
      {goals.map((g, i) => (
        <DgCoreBox key={g[0]} x={4 + i * 113} y={18} w={106} h={58} label={g[0]} sub={g[1]} sub2={g[2]} color={g[3]} labelSize={10} />
      ))}
      <DgCoreText x={6} y={98} t="CONTROL FUNCTION: WHEN IT ACTS, WITH AN EXAMPLE" size={9} weight={700} anchor="start" />
      {fns.map((f, i) => {
        const x = 6 + i * 84;
        return (
          <g key={f[0]}>
            <DgCoreBox x={x} y={106} w={76} h={44} label={f[0]} sub={f[1]} labelSize={10} />
            {i < 3 && <DgCoreArrow x1={x + 77} y1={128} x2={x + 83} y2={128} hs={3.5} />}
            <DgCoreArrow x1={x + 38} y1={150} x2={x + 38} y2={158} hs={3.5} />
            <DgCoreBox x={x} y={158} w={76} h={40} label={f[2]} sub={f[3]} color={f[4]} labelSize={9.5} labelWeight={500} />
          </g>
        );
      })}
      <circle cx={14} cy={216} r="4" fill={COLOR.blue} />
      <DgCoreText x={22} y={219} t="Technical" size={8.5} anchor="start" />
      <circle cx={76} cy={216} r="4" fill={COLOR.orange} />
      <DgCoreText x={84} y={219} t="Physical" size={8.5} anchor="start" />
      <circle cx={134} cy={216} r="4" fill={COLOR.muted} />
      <DgCoreText x={142} y={219} t="Administrative (policy, training)" size={8.5} anchor="start" />
      <DgCoreBox x={6} y={232} w={328} h={38} label="Compensating" sub="stands in when the ideal control is not possible" color={COLOR.gold} dashed labelSize={10} />
      <DgCoreText x={170} y={288} t="Function and category are separate: a camera is physical + detective" />
      <DgCoreText x={170} y={301} t="Layer many controls: defense in depth" />
    </svg>
  );
}

function DgCorePolicyLadder() {
  const rows = [
    { y: 24, label: 'Policy', sub: 'management: why and what', sub2: 'mandatory, high level', color: COLOR.primary, ex: ['All laptops must be', 'encrypted'] },
    { y: 82, label: 'Standard', sub: 'specific requirement', sub2: 'mandatory', color: COLOR.blue, ex: ['Use AES-256 full-disk', 'encryption'] },
    { y: 140, label: 'Procedure', sub: 'step-by-step task', sub2: 'mandatory', color: COLOR.teal, ex: ['1 Turn on disk encryption', '2 Save the recovery key'] },
    { y: 216, label: 'Guideline', sub: 'advice, best practice', sub2: 'optional', color: COLOR.gold, dashed: true, ex: ['Lock your screen when', 'you step away'] },
  ];
  return (
    <svg viewBox="0 0 340 304" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={14} t="DOCUMENT" size={9} weight={700} anchor="start" />
      <DgCoreText x={176} y={14} t="EXAMPLE: LAPTOP ENCRYPTION" size={9} weight={700} anchor="start" />
      {rows.map((r, i) => (
        <g key={r.label}>
          <DgCoreBox x={6} y={r.y} w={150} h={46} label={r.label} sub={r.sub} sub2={r.sub2} color={r.color} dashed={r.dashed} />
          <DgCoreArrow x1={157} y1={r.y + 23} x2={175} y2={r.y + 23} />
          <DgCoreBox x={176} y={r.y} w={158} h={46} label={r.ex[0]} sub={r.ex[1]} body labelWeight={400} labelSize={9.5} />
          {i < 2 && <DgCoreArrow x1={81} y1={r.y + 47} x2={81} y2={r.y + 57} hs={4} />}
        </g>
      ))}
      <line x1={6} y1={202} x2={334} y2={202} stroke={COLOR.border} strokeDasharray="4 3" />
      <rect x={96} y={195} width={148} height={14} fill={COLOR.surface} />
      <DgCoreText x={170} y={205} t="mandatory above, optional below" size={8.5} />
      <DgCoreText x={170} y={284} t="Ask two things: is it mandatory? how detailed?" />
      <DgCoreText x={170} y={298} t="Policy = intent, standard = specifics, procedure = steps" />
    </svg>
  );
}

function DgCoreAaaChain() {
  const chain = [
    ['Identify', 'claim identity', 'e.g. username', COLOR.primary],
    ['Authenticate', 'prove the claim', 'password, key', COLOR.blue],
    ['Authorize', 'what may you do', 'role, policy', COLOR.orange],
    ['Account', 'record actions', 'audit log', COLOR.teal],
  ];
  const factors = [
    ['Know', 'something you know', 'password, PIN'],
    ['Have', 'something you have', 'phone, key, card'],
    ['Are', 'something you are', 'fingerprint, face'],
  ];
  const models = [
    ['DAC', 'owner decides', 6, 214],
    ['MAC', 'labels + clearance, enforced', 172, 214],
    ['RBAC', 'permissions attach to job roles', 6, 256],
    ['ABAC', 'attributes + context at request', 172, 256],
  ];
  return (
    <svg viewBox="0 0 340 346" style={{ width: '100%', height: 'auto' }}>
      {chain.map((c, i) => {
        const x = 6 + i * 84;
        return (
          <g key={c[0]}>
            <DgCoreBox x={x} y={8} w={76} h={56} label={c[0]} sub={c[1]} sub2={c[2]} color={c[3]} labelSize={10} />
            {i < 3 && <DgCoreArrow x1={x + 77} y1={36} x2={x + 83} y2={36} hs={3.5} />}
          </g>
        );
      })}
      <DgCoreText x={170} y={80} t="Unique accounts make accountability possible" />
      <DgCoreText x={6} y={102} t="AUTHENTICATE: THREE FACTOR FAMILIES" size={9} weight={700} color={COLOR.blue} anchor="start" />
      {factors.map((f, i) => (
        <DgCoreBox key={f[0]} x={4 + i * 113} y={108} w={106} h={48} label={f[0]} sub={f[1]} sub2={f[2]} color={COLOR.blue} />
      ))}
      <DgCoreText x={170} y={174} t="MFA = factors from 2+ different families" size={9.5} weight={600} color={COLOR.gold} />
      <DgCoreText x={170} y={188} t="password + PIN = same family, not MFA" size={8.5} />
      <DgCoreText x={6} y={206} t="AUTHORIZE: ACCESS MODELS" size={9} weight={700} color={COLOR.orange} anchor="start" />
      {models.map((m) => (
        <DgCoreBox key={m[0]} x={m[2]} y={m[3] + 2} w={162} h={38} label={m[0]} sub={m[1]} color={COLOR.orange} labelSize={10} />
      ))}
      <DgCoreText x={170} y={316} t="All models follow least privilege and need-to-know" />
      <DgCoreText x={170} y={332} t="Identify, authenticate, authorize, account: in that order" />
    </svg>
  );
}

function DgCoreOsiPorts() {
  const layers = [
    { n: 7, name: 'Application', unit: 'browser, server', ex: 'HTTP, HTTPS, DNS', c: COLOR.teal },
    { n: 6, name: 'Presentation', unit: 'formats, encryption', ex: '' },
    { n: 5, name: 'Session', unit: 'dialogs, sessions', ex: '' },
    { n: 4, name: 'Transport', unit: 'segment', ex: 'TCP, UDP, ports', c: COLOR.blue },
    { n: 3, name: 'Network', unit: 'packet: router', ex: 'IP address', c: COLOR.orange },
    { n: 2, name: 'Data Link', unit: 'frame: switch', ex: 'MAC address', c: COLOR.pink },
    { n: 1, name: 'Physical', unit: 'bits: cable, radio', ex: '' },
  ];
  return (
    <svg viewBox="0 0 340 368" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={12} t="LAYER" size={9} weight={700} anchor="start" />
      <DgCoreText x={124} y={12} t="UNIT / DEVICE" size={9} weight={700} anchor="start" />
      <DgCoreText x={230} y={12} t="EXAMPLES" size={9} weight={700} anchor="start" />
      {layers.map((l, i) => {
        const y = 18 + i * 31;
        return (
          <g key={l.n}>
            <DgCoreBox x={6} y={y} w={112} h={27} label={`${l.n}  ${l.name}`} color={l.c} labelSize={10} dashed={!l.c} />
            <DgCoreBox x={124} y={y} w={100} h={27} label={l.unit} color={l.c} labelSize={9} labelWeight={400} />
            {l.ex ? <DgCoreBox x={230} y={y} w={104} h={27} label={l.ex} color={l.c} labelSize={9} labelWeight={400} /> : null}
          </g>
        );
      })}
      <DgCoreText x={6} y={250} t="COMMON PORTS: CLEAR TEXT, THEN ITS SECURE PAIR" size={9} weight={700} color={COLOR.blue} anchor="start" />
      <DgCoreBox x={6} y={258} w={96} h={28} label="Telnet 23" color={COLOR.red} labelSize={10} />
      <DgCoreArrow x1={103} y1={272} x2={125} y2={272} />
      <DgCoreBox x={126} y={258} w={96} h={28} label="SSH 22" color={COLOR.teal} labelSize={10} />
      <DgCoreText x={232} y={269} t="Telnet: clear text" size={8.5} anchor="start" />
      <DgCoreText x={232} y={281} t="SSH: encrypted" size={8.5} anchor="start" />
      <DgCoreBox x={6} y={294} w={96} h={28} label="HTTP 80" color={COLOR.red} labelSize={10} />
      <DgCoreArrow x1={103} y1={308} x2={125} y2={308} />
      <DgCoreBox x={126} y={294} w={96} h={28} label="HTTPS 443" color={COLOR.teal} labelSize={10} />
      <DgCoreText x={232} y={305} t="HTTP: clear text" size={8.5} anchor="start" />
      <DgCoreText x={232} y={317} t="HTTPS: wrapped in TLS" size={8.5} anchor="start" />
      <DgCoreText x={170} y={338} t="Also: FTP 21, SMTP 25, DNS 53, RDP 3389" size={9} />
      <DgCoreText x={170} y={358} t="Layer 1 up: Please Do Not Throw Sausage Pizza Away" />
    </svg>
  );
}

function DgCoreZeroTrust() {
  const dotsFlat = [[34, 62], [86, 62], [138, 62], [34, 100], [86, 100], [138, 100]];
  const zoneA = [[214, 61], [254, 61], [294, 61]];
  const zoneB = [[214, 121], [254, 121], [294, 121]];
  return (
    <svg viewBox="0 0 340 308" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={12} t="SEGMENTATION LIMITS HOW FAR MALWARE TRAVELS" size={9} weight={700} anchor="start" />
      <DgCoreFrame x={6} y={20} w={160} h={136} color={COLOR.red} />
      <DgCoreText x={86} y={36} t="Flat network" size={10} weight={600} color={COLOR.text} />
      {dotsFlat.slice(1).map((d, i) => (
        <line key={i} x1={dotsFlat[0][0]} y1={dotsFlat[0][1]} x2={d[0]} y2={d[1]} stroke={COLOR.red} strokeWidth="1.3" />
      ))}
      {dotsFlat.map((d, i) => (
        <circle key={i} cx={d[0]} cy={d[1]} r="7" fill={i === 0 ? COLOR.red : COLOR.surfaceRaised} stroke={i === 0 ? COLOR.red : COLOR.muted} strokeWidth="1.3" />
      ))}
      <DgCoreText x={86} y={148} t="malware reaches everything" size={8.5} />
      <DgCoreFrame x={174} y={20} w={160} h={136} color={COLOR.teal} />
      <DgCoreText x={254} y={36} t="Segmented" size={10} weight={600} color={COLOR.text} />
      <rect x={184} y={42} width={140} height={38} rx="6" fill={tint(COLOR.blue, 12)} stroke={COLOR.blue} />
      <rect x={184} y={102} width={140} height={38} rx="6" fill={tint(COLOR.blue, 12)} stroke={COLOR.blue} />
      {zoneA.slice(1).map((d, i) => (
        <line key={i} x1={zoneA[0][0]} y1={zoneA[0][1]} x2={d[0]} y2={d[1]} stroke={COLOR.red} strokeWidth="1.3" />
      ))}
      {zoneA.map((d, i) => (
        <circle key={i} cx={d[0]} cy={d[1]} r="7" fill={i === 0 ? COLOR.red : COLOR.surfaceRaised} stroke={i === 0 ? COLOR.red : COLOR.muted} strokeWidth="1.3" />
      ))}
      {zoneB.map((d, i) => (
        <circle key={i} cx={d[0]} cy={d[1]} r="7" fill={COLOR.surfaceRaised} stroke={COLOR.muted} strokeWidth="1.3" />
      ))}
      <rect x={184} y={85} width={140} height={13} rx="3" fill={tint(COLOR.gold, 30)} stroke={COLOR.gold} />
      <DgCoreText x={218} y={95} t="firewall" size={8.5} color={COLOR.text} />
      <line x1={296} y1={87} x2={304} y2={96} stroke={COLOR.red} strokeWidth="1.6" />
      <line x1={304} y1={87} x2={296} y2={96} stroke={COLOR.red} strokeWidth="1.6" />
      <DgCoreText x={254} y={148} t="damage stays in one zone" size={8.5} />
      <DgCoreText x={6} y={178} t="ZERO TRUST: NEVER TRUST, ALWAYS VERIFY EACH REQUEST" size={9} weight={700} anchor="start" />
      <DgCoreBox x={6} y={188} w={72} h={76} label="Request" sub="user + device" labelSize={10} />
      <DgCoreArrow x1={79} y1={226} x2={96} y2={226} />
      <DgCoreBox x={97} y={188} w={142} h={22} label="Authenticate (MFA)" color={COLOR.blue} labelSize={9.5} labelWeight={500} />
      <DgCoreBox x={97} y={215} w={142} h={22} label="Check device health" color={COLOR.teal} labelSize={9.5} labelWeight={500} />
      <DgCoreBox x={97} y={242} w={142} h={22} label="Authorize least privilege" color={COLOR.orange} labelSize={9.5} labelWeight={500} />
      <DgCoreArrow x1={240} y1={226} x2={254} y2={226} />
      <DgCoreBox x={255} y={188} w={79} h={76} label="Allow" sub="one resource," sub2="re-checked" color={COLOR.primary} labelSize={10} />
      <DgCoreText x={170} y={284} t="Network location alone never grants trust" size={9.5} weight={600} color={COLOR.gold} />
      <DgCoreText x={170} y={299} t="Zero trust is a strategy, not a product you can buy" />
    </svg>
  );
}

function DgCoreIncidentLifecycle() {
  const c = [COLOR.blue, COLOR.teal, COLOR.orange, COLOR.red, COLOR.gold];
  return (
    <svg viewBox="0 0 340 258" style={{ width: '100%', height: 'auto' }}>
      <DgCoreBox x={6} y={24} w={100} h={56} label="Preparation" sub="plan, tools, team" color={c[0]} labelSize={10} />
      <DgCoreBox x={120} y={24} w={100} h={56} label="Detect + analyze" sub="is it an incident?" color={c[1]} labelSize={10} />
      <DgCoreBox x={234} y={24} w={100} h={56} label="Containment" sub="isolate, stop spread" color={c[2]} labelSize={10} />
      <DgCoreBox x={234} y={124} w={100} h={56} label="Eradication" sub="remove the cause," sub2="then recover" color={c[3]} labelSize={10} />
      <DgCoreBox x={120} y={124} w={100} h={56} label="Post-incident" sub="lessons learned" sub2="feed back to prep" color={c[4]} labelSize={10} />
      <DgCoreArrow x1={107} y1={52} x2={119} y2={52} />
      <DgCoreArrow x1={221} y1={52} x2={233} y2={52} />
      <DgCoreArrow x1={284} y1={81} x2={284} y2={123} />
      <DgCoreArrow x1={233} y1={152} x2={221} y2={152} />
      <line x1={119} y1={152} x2={56} y2={152} stroke={COLOR.muted} strokeWidth="1.3" />
      <DgCoreArrow x1={56} y1={152} x2={56} y2={81} />
      <DgCoreText x={62} y={104} t="improves the" size={8.5} anchor="start" />
      <DgCoreText x={62} y={116} t="next response" size={8.5} anchor="start" />
      {[0, 1, 2].map((i) => <DgCoreBadge key={i} cx={16 + i * 114} cy={24} n={i + 1} color={c[i]} />)}
      <DgCoreBadge cx={244} cy={124} n={4} color={c[3]} />
      <DgCoreBadge cx={130} cy={124} n={5} color={c[4]} />
      <DgCoreText x={170} y={206} t="Isolate first (containment), then remove the cause (eradication)" size={9.5} weight={600} color={COLOR.text} />
      <DgCoreText x={170} y={221} t="Keep a documented chain of custody for any evidence" />
      <DgCoreText x={170} y={248} t="Every incident ends with lessons learned" />
    </svg>
  );
}

/* ===================== SSCP ===================== */

function DgCoreAuthProtocols() {
  const rows = [
    ['RADIUS', 'user access', COLOR.orange, 'Typical for VPN and Wi-Fi user access', 'Hides only the password in the packet'],
    ['TACACS+', 'admin access', COLOR.blue, 'Network device admin; separates AAA', 'Encrypts whole payload; per-command rights'],
    ['Kerberos', 'domain SSO', COLOR.teal, 'Tickets give single sign-on in a domain', 'Needs synchronized clocks'],
    ['SAML / OIDC', 'federation', COLOR.pink, 'Single sign-on across organizations', 'OAuth 2.0 is authorization, not authentication'],
  ];
  return (
    <svg viewBox="0 0 340 310" style={{ width: '100%', height: 'auto' }}>
      <DgCoreBox x={6} y={10} w={64} h={46} label="User" sub="laptop, phone" labelSize={10} />
      <DgCoreBox x={106} y={10} w={104} h={46} label="Access device" sub="VPN, Wi-Fi, switch" labelSize={10} />
      <DgCoreBox x={250} y={10} w={84} h={46} label="AAA server" sub="RADIUS / TACACS+" labelSize={10} color={COLOR.primary} />
      <DgCoreArrow x1={71} y1={30} x2={105} y2={30} />
      <DgCoreText x={88} y={25} t="login" size={8.5} />
      <DgCoreArrow x1={211} y1={26} x2={249} y2={26} />
      <DgCoreText x={230} y={21} t="ask" size={8.5} />
      <DgCoreArrow x1={249} y1={42} x2={211} y2={42} dashed />
      <DgCoreText x={230} y={53} t="decision" size={8.5} />
      <DgCoreText x={6} y={76} t="WHICH PROTOCOL FOR WHICH JOB" size={9} weight={700} anchor="start" />
      {rows.map((r, i) => {
        const y = 84 + i * 52;
        return (
          <g key={r[0]}>
            <DgCoreBox x={6} y={y} w={86} h={44} label={r[0]} sub={r[1]} color={r[2]} labelSize={10} />
            <rect x={98} y={y} width={236} height={44} rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1.3" />
            <DgCoreText x={106} y={y + 19} t={r[3]} size={9} weight={500} color={COLOR.text} anchor="start" />
            <DgCoreText x={106} y={y + 34} t={r[4]} size={8.5} anchor="start" />
          </g>
        );
      })}
      <DgCoreText x={170} y={304} t="RADIUS for users joining the network, TACACS+ for admins on devices" size={8.5} />
    </svg>
  );
}

function DgCoreVulnCycle() {
  const items = [
    ['Scan', 'credentialed if possible'],
    ['Validate', 'weed out false positives'],
    ['Prioritize', 'by real risk, not score'],
    ['Remediate', 'patch or compensate'],
    ['Rescan', 'confirm the fix'],
    ['Report', 'owners and leaders'],
  ];
  const colors = [COLOR.blue, COLOR.teal, COLOR.orange, COLOR.primary, COLOR.teal, COLOR.gold];
  const inputs = [['CVSS', '0-10 severity'], ['Asset value', 'how it matters'], ['Exposure', 'internet-facing'], ['Exploited?', 'CISA KEV list']];
  return (
    <svg viewBox="0 0 340 336" style={{ width: '100%', height: 'auto' }}>
      <DgCoreLoop items={items} colors={colors} top={14} />
      <DgCoreText x={6} y={208} t="PRIORITIZE: SEVERITY IS NOT RISK" size={9} weight={700} color={COLOR.orange} anchor="start" />
      {inputs.map((s, i) => {
        const x = 6 + i * 86;
        return (
          <g key={s[0]}>
            <DgCoreBox x={x} y={216} w={72} h={42} label={s[0]} sub={s[1]} color={COLOR.orange} labelSize={10} />
            {i < 3 && <DgCoreText x={x + 79} y={241} t="+" size={12} weight={700} color={COLOR.text} />}
            <line x1={x + 36} y1={259} x2={x + 36} y2={265} stroke={COLOR.muted} strokeWidth="1.3" />
          </g>
        );
      })}
      <line x1={42} y1={265} x2={300} y2={265} stroke={COLOR.muted} strokeWidth="1.3" />
      <DgCoreArrow x1={170} y1={265} x2={170} y2={276} />
      <DgCoreBox x={60} y={277} w={220} h={28} label="Real risk to your environment" color={COLOR.gold} labelSize={10} />
      <DgCoreText x={170} y={324} t="CVE names the flaw, CVSS rates it; neither measures your risk" />
    </svg>
  );
}

function DgCoreSiem() {
  const src = ['Firewall', 'Servers', 'Endpoints', 'Apps, cloud'];
  return (
    <svg viewBox="0 0 340 316" style={{ width: '100%', height: 'auto' }}>
      {src.map((s, i) => (
        <g key={s}>
          <DgCoreBox x={6 + i * 84} y={8} w={76} h={32} label={s} labelSize={9.5} labelWeight={500} />
          <DgCoreArrow x1={44 + i * 84} y1={41} x2={44 + i * 84} y2={57} />
        </g>
      ))}
      <DgCoreBox x={6} y={58} w={328} h={36} label="Central log store, off the host" sub="protected, NTP-synced clocks, retained per policy" color={COLOR.teal} labelSize={10} />
      <DgCoreArrow x1={170} y1={95} x2={170} y2={109} />
      <DgCoreBox x={6} y={110} w={328} h={62} label="SIEM" sub="normalize to one format, then correlate" sub2="50 failed logins, then a success from a new country" color={COLOR.blue} labelSize={10.5} />
      <DgCoreArrow x1={80} y1={173} x2={80} y2={189} />
      <DgCoreBox x={6} y={190} w={148} h={40} label="Alert" sub="rule or correlation fires" color={COLOR.orange} labelSize={10} />
      <DgCoreArrow x1={155} y1={210} x2={185} y2={210} />
      <DgCoreBox x={186} y={190} w={148} h={40} label="Analyst" sub="triage the alert" color={COLOR.primary} labelSize={10} />
      <DgCoreArrow x1={235} y1={231} x2={198} y2={248} />
      <DgCoreArrow x1={285} y1={231} x2={298} y2={248} />
      <DgCoreBox x={148} y={249} w={100} h={38} label="False positive" sub="tune the rule" labelSize={9.5} />
      <DgCoreBox x={254} y={249} w={80} h={38} label="True positive" sub="start IR" labelSize={9.5} color={COLOR.red} />
      <DgCoreText x={8} y={262} t="Poor tuning: alert fatigue" size={8.5} anchor="start" />
      <DgCoreText x={8} y={275} t="Weak coverage: blind spots" size={8.5} anchor="start" />
      <DgCoreText x={170} y={308} t="One failed login is noise; correlated events tell a story" />
    </svg>
  );
}

function DgCoreEvidenceCustody() {
  const vol = [
    ['1  Registers, cache', COLOR.red], ['2  Memory', COLOR.orange], ['3  Network state, processes', COLOR.gold],
    ['4  Disk', COLOR.blue], ['5  Remote logs, archives', COLOR.teal],
  ];
  const steps = [
    ['Isolate, keep powered', 'do not pull the plug'],
    ['Image via write blocker', 'bit-for-bit copy'],
    ['Hash original + copy', 'values must match'],
    ['Analyze the copy only', 'original stays sealed'],
  ];
  return (
    <svg viewBox="0 0 340 332" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={12} t="ORDER OF VOLATILITY" size={9} weight={700} anchor="start" />
      <DgCoreText x={182} y={12} t="PROTECT THE EVIDENCE" size={9} weight={700} anchor="start" />
      {vol.map((v, i) => (
        <DgCoreBox key={v[0]} x={6} y={22 + i * 38} w={146} h={32} label={v[0]} color={v[1]} labelSize={9.5} labelWeight={500} />
      ))}
      <DgCoreText x={79} y={222} t="most volatile first" size={8.5} />
      {steps.map((s, i) => (
        <g key={s[0]}>
          <DgCoreBox x={182} y={22 + i * 52} w={152} h={40} label={s[0]} sub={s[1]} color={COLOR.teal} labelSize={9.5} />
          {i < 3 && <DgCoreArrow x1={258} y1={63 + i * 52} x2={258} y2={73 + i * 52} hs={4} />}
        </g>
      ))}
      <DgCoreText x={6} y={248} t="CHAIN OF CUSTODY: WHO, WHEN, WHERE, WHY" size={9} weight={700} color={COLOR.gold} anchor="start" />
      <DgCoreBox x={6} y={256} w={92} h={40} label="Collector" sub="signs it over" color={COLOR.gold} labelSize={10} />
      <DgCoreArrow x1={99} y1={276} x2={123} y2={276} />
      <DgCoreBox x={124} y={256} w={92} h={40} label="Evidence store" sub="logged, sealed" color={COLOR.gold} labelSize={10} />
      <DgCoreArrow x1={217} y1={276} x2={241} y2={276} />
      <DgCoreBox x={242} y={256} w={92} h={40} label="Analyst" sub="signs it in" color={COLOR.gold} labelSize={10} />
      <DgCoreText x={170} y={314} t="Every transfer is signed; a gap does not prove tampering," />
      <DgCoreText x={170} y={327} t="but it gives the other side something to argue" />
    </svg>
  );
}

function DgCoreCryptoUse() {
  const rows = [
    ['Asymmetric', 'encrypt', COLOR.blue, "Recipient's PUBLIC key encrypts", 'only their PRIVATE key decrypts it'],
    ['Asymmetric', 'sign', COLOR.orange, 'Sign: your PRIVATE key. Verify: your PUBLIC key', 'Integrity, origin and non-repudiation'],
    ['Symmetric', 'AES', COLOR.teal, 'One shared key encrypts and decrypts', 'Fast for bulk data; sharing the key is the issue'],
    ['Hash', 'SHA-256', COLOR.gold, 'No key; one-way fixed fingerprint', 'Integrity only: anyone can recompute it'],
    ['HMAC', 'keyed hash', COLOR.pink, 'Shared secret mixed into a hash', 'Integrity + authenticity, no non-repudiation'],
  ];
  return (
    <svg viewBox="0 0 340 368" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={12} t="MATCH THE TOOL TO THE PROPERTY" size={9} weight={700} anchor="start" />
      {rows.map((r, i) => {
        const y = 20 + i * 50;
        return (
          <g key={i}>
            <DgCoreBox x={6} y={y} w={96} h={44} label={r[0]} sub={r[1]} color={r[2]} labelSize={10} />
            <rect x={108} y={y} width={226} height={44} rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1.3" />
            <DgCoreText x={115} y={y + 19} t={r[3]} size={9} weight={500} color={COLOR.text} anchor="start" />
            <DgCoreText x={115} y={y + 34} t={r[4]} size={8.5} anchor="start" />
          </g>
        );
      })}
      <DgCoreText x={6} y={284} t="REAL SYSTEMS COMBINE THEM (TLS)" size={9} weight={700} color={COLOR.orange} anchor="start" />
      <DgCoreBox x={6} y={292} w={96} h={46} label="Key exchange" sub="asymmetric," sub2="ephemeral keys" color={COLOR.blue} labelSize={10} />
      <DgCoreArrow x1={103} y1={315} x2={121} y2={315} />
      <DgCoreBox x={122} y={292} w={96} h={46} label="Session key" sub="shared secret" color={COLOR.teal} labelSize={10} />
      <DgCoreArrow x1={219} y1={315} x2={237} y2={315} />
      <DgCoreBox x={238} y={292} w={96} h={46} label="AES" sub="protects the data" color={COLOR.teal} labelSize={10} />
      <DgCoreText x={170} y={358} t="Ephemeral keys give forward secrecy for recorded traffic" />
    </svg>
  );
}

function DgCoreNetPlacement() {
  return (
    <svg viewBox="0 0 340 376" style={{ width: '100%', height: 'auto' }}>
      <DgCoreBox x={6} y={4} w={86} h={26} label="Remote user" labelSize={9.5} labelWeight={500} />
      <DgCoreBox x={118} y={4} w={100} h={26} label="Internet" labelSize={10} />
      <DgCoreArrow x1={49} y1={31} x2={49} y2={51} dashed />
      <DgCoreText x={56} y={45} t="tunnel" size={8.5} anchor="start" />
      <DgCoreBox x={6} y={52} w={86} h={36} label="VPN gateway" sub="ends the tunnel" color={COLOR.blue} labelSize={10} />
      <DgCoreArrow x1={168} y1={31} x2={168} y2={51} />
      <DgCoreBox x={118} y={52} w={100} h={36} label="Edge firewall" sub="stateful / NGFW" color={COLOR.orange} labelSize={10} />
      <DgCoreArrow x1={93} y1={70} x2={117} y2={70} />
      <DgCoreText x={228} y={66} t="first match wins," size={8.5} anchor="start" />
      <DgCoreText x={228} y={78} t="ends in deny all" size={8.5} anchor="start" />
      <DgCoreArrow x1={168} y1={89} x2={168} y2={103} />
      <DgCoreBox x={118} y={104} w={100} h={36} label="IPS" sub="inline: can block" color={COLOR.pink} labelSize={10} />
      <DgCoreText x={228} y={120} t="false alarms can" size={8.5} anchor="start" />
      <DgCoreText x={228} y={132} t="block real traffic" size={8.5} anchor="start" />
      <DgCoreArrow x1={168} y1={141} x2={168} y2={155} />
      <rect x={96} y={156} width={144} height={58} rx="10" fill="none" stroke={COLOR.gold} strokeDasharray="4 3" strokeWidth="1.3" />
      <DgCoreText x={104} y={169} t="DMZ: public-facing servers" size={8.5} weight={600} color={COLOR.text} anchor="start" />
      <DgCoreBox x={104} y={176} w={60} h={30} label="Web" labelSize={9.5} />
      <DgCoreBox x={172} y={176} w={60} h={30} label="Mail" labelSize={9.5} />
      <DgCoreArrow x1={168} y1={215} x2={168} y2={229} />
      <DgCoreBox x={118} y={230} w={100} h={36} label="Internal firewall" sub="only needed flows" color={COLOR.orange} labelSize={10} />
      <DgCoreText x={228} y={246} t="stops lateral" size={8.5} anchor="start" />
      <DgCoreText x={228} y={258} t="movement inward" size={8.5} anchor="start" />
      <DgCoreArrow x1={168} y1={267} x2={168} y2={285} />
      <DgCoreFrame x={6} y={286} w={220} h={70} color={COLOR.teal} label="Internal LAN" />
      <DgCoreBox x={14} y={306} w={92} h={40} label="Switch" sub="802.1X port auth" labelSize={10} />
      <DgCoreBox x={114} y={306} w={104} h={40} label="Servers" labelSize={10} />
      <DgCoreText x={290} y={298} t="span port / TAP" size={8.5} />
      <DgCoreBox x={246} y={306} w={88} h={40} label="IDS" sub="watches, alerts" color={COLOR.primary} labelSize={10} />
      <line x1={227} y1={326} x2={245} y2={326} stroke={COLOR.muted} strokeWidth="1.3" strokeDasharray="3 3" />
      <DgCoreText x={170} y={371} t="IPS sits inline and blocks; IDS watches a copy and alerts" />
    </svg>
  );
}

/* ===================== CGRC ===================== */

function DgCoreRmfLoop() {
  const cx = 170, cy = 178, R = 112, hw = 46, hh = 23;
  const steps = [
    ['2 Categorize', 'FIPS 199 impact', COLOR.blue],
    ['3 Select', 'SP 800-53B baseline', COLOR.teal],
    ['4 Implement', 'SSP + evidence', COLOR.orange],
    ['5 Assess', 'SP 800-53A, SAR', COLOR.pink],
    ['6 Authorize', 'AO accepts risk', COLOR.primary],
    ['7 Monitor', 'SP 800-137', COLOR.gold],
  ];
  const pts = steps.map((_, i) => {
    const a = (-90 + i * 60) * Math.PI / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const arrows = pts.map((p, i) => {
    const q = pts[(i + 1) % 6];
    const dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const t = Math.min(hw / Math.abs(ux || 1e-6), hh / Math.abs(uy || 1e-6)) + 3;
    return { x1: p.x + ux * t, y1: p.y + uy * t, x2: q.x - ux * t, y2: q.y - uy * t };
  });
  return (
    <svg viewBox="0 0 340 360" style={{ width: '100%', height: 'auto' }}>
      {arrows.map((a, i) => <DgCoreArrow key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} />)}
      {steps.map((s, i) => (
        <DgCoreBox key={s[0]} x={pts[i].x - hw} y={pts[i].y - hh} w={hw * 2} h={hh * 2} label={s[0]} sub={s[1]} color={s[2]} labelSize={10} />
      ))}
      <circle cx={cx} cy={cy} r="40" fill={tint(COLOR.gold, 16)} stroke={COLOR.gold} strokeWidth="1.3" strokeDasharray="4 3" />
      <DgCoreText x={cx} y={cy - 2} t="1 Prepare" size={10.5} weight={600} color={COLOR.text} />
      <DgCoreText x={cx} y={cy + 12} t="roles + strategy" size={8.5} />
      <DgCoreText x={170} y={338} t="Prepare comes first, at organization and system level" />
      <DgCoreText x={170} y={352} t="Monitor feeds back into the cycle" />
    </svg>
  );
}

function DgCoreSelectTailor() {
  const baselines = [['Low', 14, 70], ['Moderate', 92, 82], ['High', 182, 62]];
  return (
    <svg viewBox="0 0 340 412" style={{ width: '100%', height: 'auto' }}>
      <DgCoreBox x={60} y={6} w={220} h={38} label="System category" sub="FIPS 199 high-water mark" color={COLOR.blue} labelSize={10} />
      <DgCoreArrow x1={170} y1={45} x2={170} y2={57} />
      <DgCoreFrame x={6} y={58} w={328} h={66} color={COLOR.teal} label="Baseline (SP 800-53B): a first draft" />
      {baselines.map((b) => (
        <DgCoreBox key={b[0]} x={b[1]} y={80} w={b[2]} h={34} label={b[0]} labelSize={10} color={COLOR.teal} />
      ))}
      <DgCoreBox x={252} y={80} w={74} h={34} label="Privacy" sub="if PII" labelSize={10} color={COLOR.teal} />
      <DgCoreArrow x1={170} y1={125} x2={170} y2={137} />
      <DgCoreBox x={6} y={138} w={328} h={40} label="Overlay (optional)" sub="reusable tailoring for a type of system, technology or community" color={COLOR.gold} dashed labelSize={10} />
      <DgCoreArrow x1={170} y1={179} x2={170} y2={191} />
      <DgCoreFrame x={6} y={192} w={328} h={120} color={COLOR.orange} label="Tailor to this system; document every change" />
      <DgCoreBox x={14} y={214} w={152} h={26} label="Scope out what does not apply" labelSize={9} labelWeight={500} color={COLOR.orange} />
      <DgCoreBox x={174} y={214} w={152} h={26} label="Set parameter values" labelSize={9} labelWeight={500} color={COLOR.orange} />
      <DgCoreBox x={14} y={246} w={152} h={26} label="Compensating control if needed" labelSize={9} labelWeight={500} color={COLOR.orange} />
      <DgCoreBox x={174} y={246} w={152} h={26} label="Supplement if baseline is weak" labelSize={9} labelWeight={500} color={COLOR.orange} />
      <DgCoreBox x={14} y={278} w={312} h={26} label="Identify common controls: provider implements once" labelSize={9} labelWeight={500} color={COLOR.orange} />
      <DgCoreArrow x1={170} y1={313} x2={170} y2={325} />
      <DgCoreFrame x={6} y={326} w={328} h={66} color={COLOR.primary} label="Output: plans mark each control as" />
      <DgCoreBox x={14} y={348} w={96} h={36} label="Common" sub="inherited" labelSize={10} color={COLOR.primary} />
      <DgCoreBox x={122} y={348} w={96} h={36} label="Hybrid" sub="duties split" labelSize={10} color={COLOR.primary} />
      <DgCoreBox x={230} y={348} w={96} h={36} label="System-specific" sub="owned here" labelSize={9.5} color={COLOR.primary} />
      <DgCoreText x={170} y={407} t="The authorizing official approves the plans before Implement" size={8.5} />
    </svg>
  );
}

function DgCoreAssessMatrix() {
  const cols = ['Specifications', 'Mechanisms', 'Activities', 'Individuals'];
  const rows = [
    ['Examine', COLOR.teal, [['policy,', 'plan'], ['config,', 'settings'], ['records,', 'logs'], null]],
    ['Interview', COLOR.blue, [null, null, null, ['admin,', 'owner']]],
    ['Test', COLOR.orange, [null, ['firewall', 'behavior'], ['exercise', 'a process'], null]],
  ];
  const cw = 62, gap = 4, x0 = 72;
  const flow = [['Plan', 'methods + rules'], ['Assess', 'satisfied or not'], ['SAR', 'findings report'], ['POA&M', 'fix list + dates']];
  return (
    <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={6} y={14} t="METHOD (rows) x OBJECT (columns)" size={9} weight={700} anchor="start" />
      {cols.map((c, ci) => (
        <DgCoreText key={c} x={x0 + ci * (cw + gap) + cw / 2} y={30} t={c} size={8.5} weight={700} color={COLOR.text} />
      ))}
      {rows.map((r, ri) => {
        const y = 40 + ri * 48;
        return (
          <g key={r[0]}>
            <DgCoreBox x={6} y={y} w={62} h={44} label={r[0]} color={r[1]} labelSize={10} />
            {r[2].map((cell, ci) => {
              const x = x0 + ci * (cw + gap);
              if (!cell) {
                return (
                  <g key={ci}>
                    <rect x={x} y={y} width={cw} height={44} rx="7" fill="none" stroke={COLOR.border} strokeDasharray="3 3" />
                    <DgCoreText x={x + cw / 2} y={y + 26} t="-" size={10} />
                  </g>
                );
              }
              return <DgCoreBox key={ci} x={x} y={y} w={cw} h={44} label={cell[0]} sub={cell[1]} color={r[1]} labelSize={9} labelWeight={500} body />;
            })}
          </g>
        );
      })}
      <DgCoreText x={6} y={196} t="THEN THE RESULTS FLOW ON" size={9} weight={700} anchor="start" />
      {flow.map((f, i) => (
        <g key={f[0]}>
          <DgCoreBox x={6 + i * 84} y={204} w={76} h={42} label={f[0]} sub={f[1]} color={COLOR.primary} labelSize={10} />
          {i < 3 && <DgCoreArrow x1={83 + i * 84} y1={225} x2={89 + i * 84} y2={225} hs={3.5} />}
        </g>
      ))}
      <DgCoreText x={170} y={266} t="Documents and interviews show intent;" />
      <DgCoreText x={170} y={279} t="configurations and tests show what is true" />
      <DgCoreText x={170} y={294} t="Effective: correct, operating as intended, right outcome" size={8.5} />
    </svg>
  );
}

function DgCoreAuthPackage() {
  const docs = [['SSP', 'security + privacy plans'], ['SAR', 'assessment reports'], ['POA&M', 'plan of action'], ['Summary', 'executive overview']];
  return (
    <svg viewBox="0 0 340 304" style={{ width: '100%', height: 'auto' }}>
      <DgCoreText x={62} y={12} t="AUTHORIZATION PACKAGE" size={9} weight={700} />
      {docs.map((d, i) => (
        <g key={d[0]}>
          <DgCoreBox x={6} y={20 + i * 40} w={112} h={34} label={d[0]} sub={d[1]} color={COLOR.blue} labelSize={10} />
          <line x1={119} y1={37 + i * 40} x2={126} y2={37 + i * 40} stroke={COLOR.muted} strokeWidth="1.3" />
        </g>
      ))}
      <line x1={126} y1={37} x2={126} y2={157} stroke={COLOR.muted} strokeWidth="1.3" />
      <DgCoreArrow x1={126} y1={97} x2={140} y2={97} />
      <DgCoreBox x={141} y={62} w={80} h={70} label="Residual risk" sub="compared with" sub2="risk tolerance" color={COLOR.orange} labelSize={9.5} />
      <DgCoreText x={284} y={12} t="AO DECISION" size={9} weight={700} />
      <DgCoreBox x={234} y={20} w={100} h={46} label="ATO" sub="risk acceptable" sub2="may carry conditions" color={COLOR.blue} labelSize={10.5} />
      <DgCoreBox x={234} y={74} w={100} h={46} label="DATO" sub="risk not acceptable" sub2="do not operate" color={COLOR.red} labelSize={10.5} />
      <DgCoreBox x={234} y={128} w={100} h={46} label="ATU" sub="reuse another org's" sub2="authorization" color={COLOR.gold} labelSize={10.5} />
      <DgCoreArrow x1={222} y1={90} x2={233} y2={43} />
      <DgCoreArrow x1={222} y1={97} x2={233} y2={97} />
      <DgCoreArrow x1={222} y1={104} x2={233} y2={151} />
      <DgCoreText x={6} y={200} t="AFTER THE DECISION" size={9} weight={700} anchor="start" />
      <DgCoreBox x={6} y={208} w={100} h={44} label="Conditions" sub="+ termination date" color={COLOR.teal} labelSize={10} />
      <DgCoreArrow x1={107} y1={230} x2={119} y2={230} />
      <DgCoreBox x={120} y={208} w={100} h={44} label="Monitor" sub="keep data current" color={COLOR.teal} labelSize={10} />
      <DgCoreArrow x1={221} y1={230} x2={233} y2={230} />
      <DgCoreBox x={234} y={208} w={100} h={44} label="Reauthorize" sub="or ongoing auth." color={COLOR.teal} labelSize={10} />
      <DgCoreText x={170} y={274} t="Only the AO accepts risk; the assessor does not decide" size={9.5} weight={600} color={COLOR.gold} />
      <DgCoreText x={170} y={292} t="ATO = to operate, DATO = denial, ATU = to use" size={8.5} />
    </svg>
  );
}

function DgCoreConMon() {
  const items = [
    ['Define strategy', 'tied to risk tolerance'],
    ['Establish program', 'metrics, frequencies'],
    ['Implement', 'tools + manual checks'],
    ['Analyze + report', 'for decision makers'],
    ['Respond', 'fix, accept, share, avoid'],
    ['Review + update', 'as threats change'],
  ];
  const colors = [COLOR.blue, COLOR.teal, COLOR.orange, COLOR.pink, COLOR.primary, COLOR.gold];
  return (
    <svg viewBox="0 0 340 312" style={{ width: '100%', height: 'auto' }}>
      <DgCoreLoop items={items} colors={colors} top={14} />
      <DgCoreText x={6} y={208} t="CHANGE IS THE BIGGEST SOURCE OF NEW RISK" size={9} weight={700} color={COLOR.orange} anchor="start" />
      <DgCoreBox x={6} y={216} w={100} h={50} label="Change control" sub="request, approve," sub2="record" color={COLOR.orange} labelSize={10} />
      <DgCoreArrow x1={107} y1={241} x2={119} y2={241} />
      <DgCoreBox x={120} y={216} w={100} h={50} label="Impact analysis" sub="security + privacy" color={COLOR.orange} labelSize={10} />
      <DgCoreArrow x1={221} y1={241} x2={233} y2={241} />
      <DgCoreBox x={234} y={216} w={100} h={50} label="Significant?" sub="reassess or" sub2="reauthorize" color={COLOR.orange} labelSize={10} />
      <DgCoreText x={170} y={286} t="Unmanaged change causes configuration drift" />
      <DgCoreText x={170} y={301} t="Mature monitoring lets the AO move to ongoing authorization" />
    </svg>
  );
}

Object.assign(LESSON_DIAGRAMS, {
  ccCiaControls: DgCoreCiaControls,
  ccPolicyLadder: DgCorePolicyLadder,
  ccAaaChain: DgCoreAaaChain,
  ccOsiPorts: DgCoreOsiPorts,
  ccZeroTrustSegments: DgCoreZeroTrust,
  ccIncidentLifecycle: DgCoreIncidentLifecycle,
  sscpAuthProtocols: DgCoreAuthProtocols,
  sscpVulnCycle: DgCoreVulnCycle,
  sscpSiemPipeline: DgCoreSiem,
  sscpEvidenceCustody: DgCoreEvidenceCustody,
  sscpCryptoUse: DgCoreCryptoUse,
  sscpNetPlacement: DgCoreNetPlacement,
  cgrcRmfLoop: DgCoreRmfLoop,
  cgrcSelectTailor: DgCoreSelectTailor,
  cgrcAssessMatrix: DgCoreAssessMatrix,
  cgrcAuthPackage: DgCoreAuthPackage,
  cgrcConMon: DgCoreConMon,
});
