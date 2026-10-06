/* ---------------- CCNA lesson diagrams ---------------- */

function DgCcnaText({ x, y, t, size = 9, fill, anchor = 'middle', weight }) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill || COLOR.muted} fontSize={size} fontWeight={weight}>{t}</text>;
}

// Tinted rounded box with a one- or two-line label.
function DgCcnaBox({ x, y, w, h, color, label, sub, size = 10, dashed, pct = 16 }) {
  const stroke = color || COLOR.border;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={color ? tint(color, pct) : COLOR.surfaceRaised}
        stroke={stroke} strokeWidth="1.3" strokeDasharray={dashed ? '4 3' : undefined} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 3.5)} textAnchor="middle" fill={COLOR.text} fontSize={size} fontWeight="600">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{sub}</text>}
    </g>
  );
}

function DgCcnaArrow({ x1, y1, x2, y2, color, dashed, both, width = 1.6 }) {
  const c = color || COLOR.muted;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (x, y, ang) => {
    const p = (d) => `${x - 7 * Math.cos(ang + d)},${y - 7 * Math.sin(ang + d)}`;
    return <polygon points={`${x},${y} ${p(-0.42)} ${p(0.42)}`} fill={c} />;
  };
  const s = 5;
  const lx2 = x2 - s * Math.cos(a), ly2 = y2 - s * Math.sin(a);
  const lx1 = both ? x1 + s * Math.cos(a) : x1, ly1 = both ? y1 + s * Math.sin(a) : y1;
  return (
    <g>
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={c} strokeWidth={width} strokeDasharray={dashed ? '4 3' : undefined} />
      {head(x2, y2, a)}
      {both && head(x1, y1, a + Math.PI)}
    </g>
  );
}

function DgCcnaPill({ x, y, w = 30, label, color }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 7} width={w} height="14" rx="7" fill={tint(color, 30)} stroke={color} strokeWidth="1.2" />
      <text x={x} y={y + 3.2} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="700">{label}</text>
    </g>
  );
}

function DgCcnaSeg({ x, y, w, h = 24, color, label }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={tint(color, 24)} stroke={color} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="600">{label}</text>
    </g>
  );
}

/* 1. OSI / TCP-IP encapsulation */
function DiagramCcnaEncapsulation() {
  const bx = 96, rowH = 48, top = 26;
  const rows = [
    { name: 'Application', pdu: 'Data', col: COLOR.primary },
    { name: 'Transport (L4)', pdu: 'Segment', col: COLOR.teal },
    { name: 'Internet (L3)', pdu: 'Packet', col: COLOR.blue },
    { name: 'Data Link (L2)', pdu: 'Frame', col: COLOR.orange },
    { name: 'Physical (L1)', pdu: 'Bits', col: COLOR.muted },
  ];
  const dx = bx + 120; // data column is fixed so headers visibly grow to the left
  const y = (i) => top + i * rowH + 4;
  return (
    <svg viewBox="0 0 340 296" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={14} t="Sender: each layer wraps what the layer above gave it" fill={COLOR.text} size={10} weight="600" />
      {rows.map((r, i) => (
        <g key={r.name}>
          <DgCcnaText x={4} y={y(i) + 11} t={r.name} fill={COLOR.text} size={10} weight="600" anchor="start" />
          <DgCcnaText x={4} y={y(i) + 23} t={r.pdu} fill={r.col} size={9.5} weight="700" anchor="start" />
        </g>
      ))}
      <DgCcnaSeg x={dx} y={y(0)} w={70} color={COLOR.primary} label="Data" />
      <DgCcnaSeg x={dx - 44} y={y(1)} w={44} color={COLOR.teal} label="TCP/UDP" />
      <DgCcnaSeg x={dx} y={y(1)} w={70} color={COLOR.primary} label="Data" />
      <DgCcnaSeg x={dx - 76} y={y(2)} w={32} color={COLOR.blue} label="IP" />
      <DgCcnaSeg x={dx - 44} y={y(2)} w={44} color={COLOR.teal} label="TCP/UDP" />
      <DgCcnaSeg x={dx} y={y(2)} w={70} color={COLOR.primary} label="Data" />
      <DgCcnaSeg x={dx - 120} y={y(3)} w={44} color={COLOR.orange} label="Eth hdr" />
      <DgCcnaSeg x={dx - 76} y={y(3)} w={32} color={COLOR.blue} label="IP" />
      <DgCcnaSeg x={dx - 44} y={y(3)} w={44} color={COLOR.teal} label="TCP/UDP" />
      <DgCcnaSeg x={dx} y={y(3)} w={70} color={COLOR.primary} label="Data" />
      <DgCcnaSeg x={dx + 70} y={y(3)} w={44} color={COLOR.orange} label="Trailer" />
      <rect x={bx} y={y(4)} width={dx + 114 - bx} height="24" rx="4" fill="none" stroke={COLOR.border} strokeWidth="1.2" strokeDasharray="4 3" />
      <DgCcnaText x={(bx + dx + 114) / 2} y={y(4) + 15} t="1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 ..." size={9.5} />
      <DgCcnaText x={dx - 76} y={y(1) + 38} t="adds src/dst ports" anchor="start" size={8.5} />
      <DgCcnaText x={dx - 76} y={y(2) + 38} t="adds src/dst IP addresses" anchor="start" size={8.5} />
      <DgCcnaText x={bx} y={y(3) + 38} t="adds src/dst MAC + trailer (FCS)" anchor="start" size={8.5} />
      <DgCcnaText x={170} y={272} t="Switch forwards frames (L2); router forwards packets (L3)" size={9} fill={COLOR.text} />
      <DgCcnaText x={170} y={286} t="Receiver strips one header per layer: decapsulation" />
    </svg>
  );
}

/* 2. Subnetting with the interesting-octet method */
function DiagramCcnaSubnetBlocks() {
  const cx = (i) => 128 + i * 22 + (i >= 4 ? 8 : 0);
  const addr = [0, 0, 1, 0, 1, 1, 0, 1];
  const mask = [1, 1, 1, 1, 0, 0, 0, 0];
  const net = [0, 0, 1, 0, 0, 0, 0, 0];
  const vals = [128, 64, 32, 16, 8, 4, 2, 1];
  const rows = [
    { l: '3rd octet: 45', bits: addr },
    { l: 'Mask octet: 240', bits: mask },
    { l: 'AND = network: 32', bits: net },
  ];
  return (
    <svg viewBox="0 0 340 312" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={14} t="172.16.45.200/20  =  mask 255.255.240.0" fill={COLOR.text} size={10.5} weight="600" />
      <DgCcnaText x={170} y={28} t="Interesting octet: the 3rd. Block size = 256 - 240 = 16" size={9} />
      <DgCcnaText x={cx(0) + 44} y={42} t="network bits" fill={COLOR.blue} size={8.5} weight="600" />
      <DgCcnaText x={cx(4) + 44} y={42} t="host bits" fill={COLOR.gold} size={8.5} weight="600" />
      {vals.map((v, i) => (
        <DgCcnaText key={v} x={cx(i) + 10} y={54} t={String(v)} size={8.5} />
      ))}
      {rows.map((r, ri) => (
        <g key={r.l}>
          <DgCcnaText x={4} y={58 + ri * 26 + 14} t={r.l} fill={COLOR.text} size={9} anchor="start" />
          {r.bits.map((b, i) => {
            const col = i < 4 ? COLOR.blue : COLOR.gold;
            return (
              <g key={i}>
                <rect x={cx(i)} y={58 + ri * 26} width="20" height="20" rx="3" fill={tint(col, 22)} stroke={col} strokeWidth="1" />
                <text x={cx(i) + 10} y={58 + ri * 26 + 14} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="600">{b}</text>
              </g>
            );
          })}
        </g>
      ))}
      <DgCcnaText x={170} y={150} t="Host bits are zeroed, so 45 falls back to the block that starts at 32" size={9} />
      <DgCcnaText x={26} y={172} t="3rd octet in blocks of 16" anchor="start" size={8.5} />
      <polygon points="224,177 233,177 228.5,184" fill={COLOR.blue} />
      <DgCcnaText x={228} y={174} t="45" fill={COLOR.text} size={8.5} weight="700" />
      {['0-15', '16-31', '32-47', '48-63'].map((t, i) => (
        <DgCcnaBox key={t} x={26 + i * 72} y={186} w={70} h={26} label={t} color={i === 2 ? COLOR.blue : null} size={10} />
      ))}
      <rect x="10" y="226" width="320" height="76" rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1.2" />
      {[
        ['Network', '172.16.32.0'],
        ['Broadcast', '172.16.47.255'],
        ['Usable hosts', '172.16.32.1 - 172.16.47.254'],
        ['Host bits', '12 bits: 2^12 - 2 = 4094 hosts'],
      ].map(([k, v], i) => (
        <g key={k}>
          <DgCcnaText x={22} y={243 + i * 17} t={k} anchor="start" size={9} />
          <DgCcnaText x={104} y={243 + i * 17} t={v} anchor="start" fill={COLOR.text} size={9.5} weight="600" />
        </g>
      ))}
    </svg>
  );
}

/* 3. IPv6 address anatomy + modified EUI-64 */
function DiagramCcnaIpv6Eui64() {
  const cell = 36, x0 = 26;
  const Cells = ({ y, items }) => items.map(([idx, label, col]) => (
    <DgCcnaSeg key={idx} x={x0 + idx * cell} y={y} w={cell} h={22} color={col} label={label} />
  ));
  const mac = (c) => [[0, 'AA', c], [1, 'BB', c], [2, 'CC', c], [5, '00', COLOR.blue], [6, '12', COLOR.blue], [7, '34', COLOR.blue]];
  return (
    <svg viewBox="0 0 340 320" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={13} t="Global unicast address: 128 bits" fill={COLOR.text} size={10} weight="600" />
      <DgCcnaBox x={10} y={20} w={100} h={30} label="Site prefix" sub="48 bits" color={COLOR.teal} />
      <DgCcnaBox x={110} y={20} w={52} h={30} label="Subnet" sub="16 bits" color={COLOR.gold} size={9.5} />
      <DgCcnaBox x={162} y={20} w={168} h={30} label="Interface ID" sub="64 bits" color={COLOR.primary} />
      <DgCcnaText x={60} y={64} t="2001:DB8:0" fill={COLOR.text} size={9.5} />
      <DgCcnaText x={136} y={64} t="42" fill={COLOR.text} size={9.5} />
      <DgCcnaText x={246} y={64} t="0:0:0:1" fill={COLOR.text} size={9.5} />
      <path d="M10 72 L10 78 L160 78 L160 72" fill="none" stroke={COLOR.teal} strokeWidth="1.6" />
      <path d="M164 72 L164 78 L330 78 L330 72" fill="none" stroke={COLOR.primary} strokeWidth="1.6" />
      <DgCcnaText x={86} y={89} t="/64 prefix: every LAN" size={8.5} />
      <DgCcnaText x={246} y={89} t="built by SLAAC (EUI-64)" size={8.5} />
      <DgCcnaText x={170} y={116} t="Modified EUI-64 from MAC AA:BB:CC:00:12:34" fill={COLOR.text} size={10} weight="600" />
      <DgCcnaText x={x0} y={136} t="1  Split the 48-bit MAC in the middle" anchor="start" size={9} />
      <rect x={x0 + 3 * cell} y={142} width={2 * cell} height="22" fill="none" stroke={COLOR.border} strokeWidth="1" strokeDasharray="3 3" />
      <Cells y={142} items={mac(COLOR.teal)} />
      <DgCcnaText x={x0} y={184} t="2  Insert FF FE in the gap" anchor="start" size={9} />
      <Cells y={190} items={[...mac(COLOR.teal), [3, 'FF', COLOR.gold], [4, 'FE', COLOR.gold]]} />
      <DgCcnaText x={x0} y={232} t="3  Flip the 7th bit (U/L) of the first byte: AA to A8" anchor="start" size={9} />
      <Cells y={238} items={[...mac(COLOR.teal).slice(1), [0, 'A8', COLOR.pink], [3, 'FF', COLOR.gold], [4, 'FE', COLOR.gold]]} />
      <DgCcnaText x={170} y={284} t="Interface ID  A8BB:CCFF:FE00:1234" fill={COLOR.text} size={10} weight="700" />
      <DgCcnaText x={170} y={298} t="AA = 1010 1010 becomes A8 = 1010 1000" size={8.5} />
      <DgCcnaText x={170} y={313} t="Link-local: FE80::A8BB:CCFF:FE00:1234" size={8.5} />
    </svg>
  );
}

/* 4. 802.1Q tag + router-on-a-stick */
function DiagramCcnaTrunkDot1q() {
  const fields = [
    ['TPID 16b', 80, COLOR.orange], ['PCP 3b', 52, COLOR.orange], ['DEI 1b', 40, COLOR.orange], ['VLAN ID 12b', 108, COLOR.orange],
  ];
  let fx = 30;
  return (
    <svg viewBox="0 0 340 312" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={13} t="A trunk inserts a 4-byte 802.1Q tag in each frame" fill={COLOR.text} size={10} weight="600" />
      <DgCcnaBox x={11} y={22} w={52} h={28} label="Dest MAC" size={8.5} />
      <DgCcnaBox x={63} y={22} w={52} h={28} label="Src MAC" size={8.5} />
      <DgCcnaBox x={115} y={22} w={76} h={28} label="802.1Q" sub="4 bytes" color={COLOR.orange} />
      <DgCcnaBox x={191} y={22} w={36} h={28} label="Type" size={8.5} />
      <DgCcnaBox x={227} y={22} w={62} h={28} label="Payload" size={8.5} />
      <DgCcnaBox x={289} y={22} w={40} h={28} label="FCS" size={8.5} />
      <DgCcnaLineHelper x1={115} y1={50} x2={30} y2={74} />
      <DgCcnaLineHelper x1={191} y1={50} x2={310} y2={74} />
      {fields.map(([t, w, c]) => {
        const x = fx; fx += w;
        return (
          <g key={t}>
            <rect x={x} y={74} width={w} height="24" fill={tint(c, 22)} stroke={c} strokeWidth="1.2" />
            <text x={x + w / 2} y={89} textAnchor="middle" fill={COLOR.text} fontSize="8.5" fontWeight="600">{t}</text>
          </g>
        );
      })}
      <DgCcnaText x={170} y={114} t="VLAN ID 1-4094 usable; native-VLAN frames cross untagged" size={8.5} />

      <DgCcnaText x={170} y={140} t="Router-on-a-stick: one trunk, one subinterface per VLAN" fill={COLOR.text} size={10} weight="600" />
      <DgCcnaBox x={6} y={154} w={80} h={32} label="PC A" sub="VLAN 10" color={COLOR.blue} />
      <DgCcnaBox x={6} y={214} w={80} h={32} label="PC B" sub="VLAN 20" color={COLOR.teal} />
      <DgCcnaBox x={112} y={180} w={70} h={40} label="Switch" />
      <DgCcnaBox x={236} y={154} w={98} h={104} label="" />
      <DgCcnaText x={285} y={168} t="Router" fill={COLOR.text} size={10} weight="600" />
      <DgCcnaBox x={242} y={176} w={86} h={36} label="g0/0.10" sub="192.168.10.1" color={COLOR.blue} size={9.5} />
      <DgCcnaBox x={242} y={216} w={86} h={36} label="g0/0.20" sub="192.168.20.1" color={COLOR.teal} size={9.5} />
      <line x1={86} y1={172} x2={112} y2={194} stroke={COLOR.muted} strokeWidth="1.4" />
      <line x1={86} y1={230} x2={112} y2={206} stroke={COLOR.muted} strokeWidth="1.4" />
      <line x1={182} y1={200} x2={236} y2={200} stroke={COLOR.orange} strokeWidth="3.4" />
      <DgCcnaText x={209} y={192} t="trunk" fill={COLOR.orange} size={8.5} weight="700" />
      <DgCcnaText x={209} y={214} t="tagged" fill={COLOR.muted} size={8.5} />
      <DgCcnaText x={46} y={200} t="untagged" size={8.5} />
      <DgCcnaText x={170} y={280} t="Hosts send untagged frames on access ports;" />
      <DgCcnaText x={170} y={294} t="the trunk tag tells the router which VLAN each frame is in" />
    </svg>
  );
}

function DgCcnaLineHelper({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLOR.orange} strokeWidth="1" strokeDasharray="3 3" />;
}

/* 5. STP root election and port roles */
function DiagramCcnaStpTriangle() {
  return (
    <svg viewBox="0 0 340 306" style={{ width: '100%', height: 'auto' }}>
      <line x1={130} y1={54} x2={62} y2={150} stroke={COLOR.border} strokeWidth="2" />
      <line x1={210} y1={54} x2={278} y2={150} stroke={COLOR.border} strokeWidth="2" />
      <line x1={112} y1={172} x2={228} y2={172} stroke={COLOR.border} strokeWidth="2" />
      <line x1={170} y1={172} x2={228} y2={172} stroke={COLOR.red} strokeWidth="2.4" strokeDasharray="5 4" />
      <DgCcnaBox x={105} y={10} w={130} h={44} label="SW1: root bridge" sub="priority 4096" color={COLOR.gold} />
      <DgCcnaBox x={4} y={150} w={108} h={44} label="SW2" sub="pri 32768 · MAC 0A" />
      <DgCcnaBox x={228} y={150} w={108} h={44} label="SW3" sub="pri 32768 · MAC 0B" />
      <DgCcnaText x={84} y={102} t="cost 4" anchor="end" size={8.5} />
      <DgCcnaText x={256} y={102} t="cost 4" anchor="start" size={8.5} />
      <DgCcnaText x={166} y={162} t="cost 4" size={8.5} />
      <DgCcnaPill x={116} y={76} label="DP" color={COLOR.blue} />
      <DgCcnaPill x={78} y={129} label="RP" color={COLOR.teal} />
      <DgCcnaPill x={224} y={76} label="DP" color={COLOR.blue} />
      <DgCcnaPill x={262} y={129} label="RP" color={COLOR.teal} />
      <DgCcnaPill x={132} y={172} label="DP" color={COLOR.blue} />
      <DgCcnaPill x={200} y={172} w={48} label="Blocked" color={COLOR.red} />
      <DgCcnaText x={170} y={216} t="SW2 and SW3 tie on cost to the root, so the lower" />
      <DgCcnaText x={170} y={229} t="bridge ID (SW2) keeps the designated port" />
      <DgCcnaPill x={22} y={250} label="DP" color={COLOR.blue} />
      <DgCcnaText x={44} y={253} t="Designated: best path to root on that segment" anchor="start" size={8.5} />
      <DgCcnaPill x={22} y={266} label="RP" color={COLOR.teal} />
      <DgCcnaText x={44} y={269} t="Root port: lowest total cost to root (one per non-root)" anchor="start" size={8.5} />
      <DgCcnaPill x={22} y={282} w={36} label="Blk" color={COLOR.red} />
      <DgCcnaText x={44} y={285} t="Everything else is blocked: one loop-free path" anchor="start" size={8.5} />
    </svg>
  );
}

/* 6. Wireless architectures */
function DiagramCcnaWirelessArch() {
  const apx = [122, 192, 262];
  const rows = [
    { y: 8, name: 'Autonomous', sub: ['each AP is self-', 'contained, set up', 'one by one'] },
    { y: 112, name: 'Controller-based', sub: ['lightweight APs +', 'WLC over CAPWAP', 'tunnels'] },
    { y: 216, name: 'Cloud-based', sub: ['management plane', 'in a cloud dashboard', '(Cisco Meraki)'] },
  ];
  return (
    <svg viewBox="0 0 340 342" style={{ width: '100%', height: 'auto' }}>
      {rows.map((r, i) => (
        <g key={r.name}>
          {i > 0 && <line x1={4} y1={r.y - 4} x2={336} y2={r.y - 4} stroke={COLOR.border} strokeWidth="1" />}
          <DgCcnaText x={4} y={r.y + 38} t={r.name} fill={COLOR.text} size={10} weight="700" anchor="start" />
          {r.sub.map((s, k) => <DgCcnaText key={k} x={4} y={r.y + 52 + k * 11} t={s} anchor="start" size={8.5} />)}
          {apx.map((x) => (
            <g key={x}>
              <line x1={x + 28} y1={r.y + 66} x2={x + 28} y2={r.y + 76} stroke={COLOR.muted} strokeWidth="1.3" />
              <DgCcnaBox x={x} y={r.y + 44} w={56} h={22} label="AP" size={9.5} color={COLOR.teal} />
            </g>
          ))}
          <DgCcnaBox x={118} y={r.y + 76} w={204} h={18} label="Switch" size={9} />
        </g>
      ))}
      <DgCcnaText x={220} y={38} t="no shared brain: each AP has its own CLI/GUI" size={8.5} />
      {apx.map((x) => <line key={x} x1={220} y1={134} x2={x + 28} y2={156} stroke={COLOR.primary} strokeWidth="1.4" strokeDasharray="4 3" />)}
      <DgCcnaBox x={188} y={114} w={64} h={22} label="WLC" color={COLOR.primary} size={9.5} />
      <DgCcnaText x={184} y={122} t="CAPWAP" anchor="end" fill={COLOR.primary} size={8.5} weight="700" />
      <DgCcnaText x={184} y={133} t="UDP 5246/5247" anchor="end" size={8.5} />
      <DgCcnaText x={260} y={122} t="AP: radio" anchor="start" size={8.5} />
      <DgCcnaText x={260} y={133} t="WLC: management" anchor="start" size={8.5} />
      {apx.map((x) => <line key={x} x1={220} y1={246} x2={x + 28} y2={260} stroke={COLOR.blue} strokeWidth="1.4" strokeDasharray="4 3" />)}
      <ellipse cx={220} cy={230} rx={62} ry={15} fill={tint(COLOR.blue, 16)} stroke={COLOR.blue} strokeWidth="1.3" />
      <DgCcnaText x={220} y={233.5} t="Cloud dashboard" fill={COLOR.text} size={9.5} weight="600" />
      <DgCcnaText x={170} y={331} t="Lightweight AP does real-time radio; controller does auth, roaming, RRM" size={8.5} />
    </svg>
  );
}

/* 7. Controller-based networking: APIs and planes */
function DiagramCcnaSdnPlanes() {
  return (
    <svg viewBox="0 0 340 336" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaBox x={70} y={8} w={200} h={38} label="Applications and admins" sub="scripts, GUI, Ansible" color={COLOR.blue} />
      <DgCcnaArrow x1={170} y1={46} x2={170} y2={98} color={COLOR.blue} both />
      <DgCcnaText x={182} y={68} t="Northbound API" anchor="start" fill={COLOR.text} size={9.5} weight="700" />
      <DgCcnaText x={182} y={81} t="REST + JSON over HTTPS" anchor="start" size={8.5} />
      <DgCcnaBox x={50} y={98} w={240} h={62} label="" color={COLOR.primary} />
      <DgCcnaText x={170} y={118} t="SDN controller" fill={COLOR.text} size={10.5} weight="700" />
      <DgCcnaText x={170} y={131} t="Catalyst Center" size={8.5} />
      <DgCcnaText x={170} y={147} t="control plane centralised here" size={8.5} fill={COLOR.primary} weight="600" />
      <DgCcnaArrow x1={170} y1={160} x2={170} y2={190} color={COLOR.teal} both />
      <DgCcnaText x={182} y={171} t="Southbound" anchor="start" fill={COLOR.text} size={9.5} weight="700" />
      <DgCcnaText x={182} y={183} t="NETCONF, OpenFlow, CLI" anchor="start" size={8.5} />
      {[55, 170, 285].map((x) => <line key={x} x1={170} y1={190} x2={x} y2={216} stroke={COLOR.teal} strokeWidth="1.4" />)}
      <DgCcnaBox x={6} y={216} w={98} h={40} label="Switch" sub="forwards traffic" color={COLOR.teal} />
      <DgCcnaBox x={121} y={216} w={98} h={40} label="Router" sub="forwards traffic" color={COLOR.teal} />
      <DgCcnaBox x={236} y={216} w={98} h={40} label="Access point" sub="forwards traffic" color={COLOR.teal} />
      {[
        [COLOR.blue, 'Management plane: configure and monitor (SSH, SNMP, APIs)'],
        [COLOR.primary, 'Control plane: builds routing, MAC and ARP tables'],
        [COLOR.teal, 'Data plane: forwards user traffic'],
      ].map(([c, t], i) => (
        <g key={t}>
          <circle cx={14} cy={282 + i * 16} r={4} fill={c} />
          <DgCcnaText x={26} y={285 + i * 16} t={t} anchor="start" size={8.5} fill={COLOR.text} />
        </g>
      ))}
      <DgCcnaText x={170} y={332} t="North faces up to apps; south faces down to devices" />
    </svg>
  );
}

/* 8. Longest prefix match */
function DiagramCcnaLongestPrefix() {
  return (
    <svg viewBox="0 0 340 290" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={13} t="Which route does the packet use?" fill={COLOR.text} size={10} weight="600" />
      <rect x={10} y={22} width={320} height={154} rx="8" fill={tint(COLOR.muted, 10)} stroke={COLOR.muted} strokeWidth="1.2" />
      <DgCcnaText x={20} y={37} t="10.1.0.0/16  OSPF [110]" anchor="start" fill={COLOR.text} size={9} weight="600" />
      <rect x={22} y={46} width={296} height={122} rx="7" fill={tint(COLOR.orange, 14)} stroke={COLOR.orange} strokeWidth="1.2" />
      <DgCcnaText x={32} y={61} t="10.1.1.0/24" anchor="start" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={32} y={73} t="EIGRP [90]" anchor="start" size={8.5} />
      <rect x={170} y={80} width={140} height={80} rx="6" fill={tint(COLOR.teal, 22)} stroke={COLOR.teal} strokeWidth="1.2" />
      <DgCcnaText x={240} y={94} t="10.1.1.128/25" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={240} y={106} t="static [1]" size={8.5} />
      <circle cx={96} cy={126} r={5} fill={COLOR.primary} />
      <DgCcnaText x={96} y={146} t="10.1.1.100" fill={COLOR.text} size={9} weight="600" />
      <circle cx={240} cy={126} r={5} fill={COLOR.primary} />
      <DgCcnaText x={240} y={146} t="10.1.1.200" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={170} y={192} t="10.1.1.200: inside the /25, the longest match, so static wins" fill={COLOR.text} size={9} />
      <DgCcnaText x={170} y={206} t="10.1.1.100: not in the /25, so the /24 wins despite static's AD 1" fill={COLOR.text} size={9} />
      <DgCcnaText x={170} y={228} t="Then, only among routes with the SAME prefix:" size={8.5} />
      <DgCcnaBox x={10} y={236} w={102} h={26} label="1  Longest mask" color={COLOR.blue} size={9} />
      <DgCcnaBox x={119} y={236} w={102} h={26} label="2  Lowest AD" color={COLOR.orange} size={9} />
      <DgCcnaBox x={228} y={236} w={102} h={26} label="3  Lowest metric" color={COLOR.teal} size={9} />
      <DgCcnaText x={170} y={282} t="The mask is checked first; AD and metric never override it" />
    </svg>
  );
}

/* 9. OSPF neighbor states */
function DiagramCcnaOspfStates() {
  const rows = [
    ['Down', COLOR.blue, ['No Hello heard from the', 'neighbor yet']],
    ['Init', COLOR.blue, ['Hello seen, but my router ID is not in it', 'Stuck here = Hellos flow one way only']],
    ['2-Way', COLOR.blue, ['Two-way Hellos; DR/BDR are elected', 'DROther pairs stay here (normal)']],
    ['ExStart', COLOR.orange, ['Pick master and slave, start the', 'database description (DBD) exchange']],
    ['Exchange', COLOR.orange, ['Swap database summaries (DBD)', 'Looping ExStart/Exchange = MTU mismatch']],
    ['Loading', COLOR.orange, ['Ask for (LSR) and receive (LSU)', 'the LSAs that are missing']],
    ['Full', COLOR.teal, ['Link-state databases identical', 'Full only with the DR and BDR']],
  ];
  const rh = 38, top = 24;
  return (
    <svg viewBox="0 0 340 342" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={13} t="Hello every 10 s, dead after 40 s; neighbors climb the ladder" fill={COLOR.text} size={9.5} weight="600" />
      {rows.map(([name, col, desc], i) => {
        const y = top + i * rh;
        return (
          <g key={name}>
            {i > 0 && <DgCcnaArrow x1={50} y1={y - 8} x2={50} y2={y + 4} color={COLOR.muted} width={1.3} />}
            <rect x={8} y={y + 4} width={84} height={24} rx="12" fill={tint(col, 26)} stroke={col} strokeWidth="1.3" />
            <text x={50} y={y + 20} textAnchor="middle" fill={COLOR.text} fontSize="10" fontWeight="700">{name}</text>
            <DgCcnaText x={104} y={y + 14} t={desc[0]} anchor="start" size={9} fill={COLOR.text} />
            <DgCcnaText x={104} y={y + 26} t={desc[1]} anchor="start" size={8.5} />
          </g>
        );
      })}
      {[[COLOR.blue, 'Discover', 8], [COLOR.orange, 'Sync databases', 108], [COLOR.teal, 'Adjacent', 238]].map(([c, t, x]) => (
        <g key={t}>
          <rect x={x} y={298} width="10" height="10" rx="2" fill={tint(c, 30)} stroke={c} strokeWidth="1" />
          <DgCcnaText x={x + 15} y={307} t={t} anchor="start" size={8.5} />
        </g>
      ))}
      <DgCcnaText x={170} y={332} t="DR/BDR cut a full mesh of adjacencies on one Ethernet segment" />
    </svg>
  );
}

/* 10. HSRP */
function DiagramCcnaHsrp() {
  return (
    <svg viewBox="0 0 340 326" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaBox x={50} y={6} w={240} h={34} label="Virtual IP 192.168.1.1" sub="plus a virtual MAC, shared by the group" color={COLOR.gold} />
      <line x1={110} y1={40} x2={75} y2={66} stroke={COLOR.gold} strokeWidth="1.3" strokeDasharray="3 3" />
      <line x1={230} y1={40} x2={265} y2={66} stroke={COLOR.gold} strokeWidth="1.3" strokeDasharray="3 3" />
      <DgCcnaBox x={20} y={66} w={110} h={52} label="R1: Active" sub="192.168.1.2 · pri 110" color={COLOR.blue} />
      <DgCcnaBox x={210} y={66} w={110} h={52} label="R2: Standby" sub="192.168.1.3 · pri 100" />
      <DgCcnaArrow x1={134} y1={92} x2={206} y2={92} both dashed />
      <DgCcnaText x={170} y={84} t="hello 3 s" size={8.5} />
      <DgCcnaText x={170} y={106} t="hold 10 s" size={8.5} />
      <DgCcnaBox x={50} y={156} w={240} h={22} label="Switch" size={9.5} />
      <line x1={75} y1={118} x2={110} y2={156} stroke={COLOR.blue} strokeWidth="3" />
      <line x1={265} y1={118} x2={230} y2={156} stroke={COLOR.muted} strokeWidth="1.4" strokeDasharray="4 3" />
      <DgCcnaText x={86} y={142} t="forwards" anchor="end" fill={COLOR.blue} size={8.5} weight="700" />
      <DgCcnaText x={254} y={142} t="idle" anchor="start" size={8.5} />
      <line x1={100} y1={178} x2={100} y2={200} stroke={COLOR.muted} strokeWidth="1.3" />
      <line x1={240} y1={178} x2={240} y2={200} stroke={COLOR.muted} strokeWidth="1.3" />
      <DgCcnaBox x={50} y={200} w={100} h={36} label="Host 1" sub="gateway 192.168.1.1" size={9.5} />
      <DgCcnaBox x={190} y={200} w={100} h={36} label="Host 2" sub="gateway 192.168.1.1" size={9.5} />
      <rect x={10} y={250} width={320} height={52} rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1.2" />
      <DgCcnaText x={20} y={266} t="R1 fails or sends no hellos for 10 s:" anchor="start" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={20} y={279} t="R2 becomes Active with the same virtual IP and MAC" anchor="start" size={8.5} />
      <DgCcnaText x={20} y={292} t="Preempt is off by default: add standby preempt" anchor="start" size={8.5} />
      <DgCcnaText x={170} y={319} t="Hosts never change their gateway; only the active router changes" />
    </svg>
  );
}

/* 11. NAT / PAT translation */
function DiagramCcnaNatPat() {
  return (
    <svg viewBox="0 0 340 300" style={{ width: '100%', height: 'auto' }}>
      <rect x={4} y={8} width={100} height={84} rx="8" fill="none" stroke={COLOR.blue} strokeWidth="1.2" strokeDasharray="4 3" />
      <DgCcnaText x={54} y={21} t="Inside (LAN)" fill={COLOR.blue} size={8.5} weight="700" />
      <DgCcnaBox x={12} y={28} w={84} h={26} label="PC1" sub="192.168.10.10" size={9} />
      <DgCcnaBox x={12} y={58} w={84} h={26} label="PC2" sub="192.168.10.11" size={9} />
      <DgCcnaBox x={134} y={34} w={72} h={44} label="NAT router" sub="PAT overload" color={COLOR.primary} size={9.5} />
      <rect x={236} y={8} width={100} height={84} rx="8" fill="none" stroke={COLOR.orange} strokeWidth="1.2" strokeDasharray="4 3" />
      <DgCcnaText x={286} y={21} t="Internet" fill={COLOR.orange} size={8.5} weight="700" />
      <DgCcnaBox x={244} y={34} w={84} h={44} label="Server" sub="198.51.100.10" size={9.5} />
      <DgCcnaArrow x1={104} y1={56} x2={134} y2={56} color={COLOR.blue} />
      <DgCcnaArrow x1={206} y1={56} x2={236} y2={56} color={COLOR.orange} />
      <DgCcnaText x={6} y={118} t="Inside local" anchor="start" fill={COLOR.blue} size={9.5} weight="700" />
      <DgCcnaText x={6} y={130} t="private address of the host" anchor="start" size={8.5} />
      <DgCcnaText x={178} y={118} t="Inside global" anchor="start" fill={COLOR.orange} size={9.5} weight="700" />
      <DgCcnaText x={178} y={130} t="what the Internet sees" anchor="start" size={8.5} />
      {[
        ['192.168.10.10:49152', '203.0.113.2:49152'],
        ['192.168.10.11:49152', '203.0.113.2:49153'],
      ].map(([a, b], i) => (
        <g key={a}>
          <DgCcnaBox x={6} y={140 + i * 32} w={156} h={26} label={a} color={COLOR.blue} size={9.5} />
          <DgCcnaArrow x1={163} y1={153 + i * 32} x2={177} y2={153 + i * 32} color={COLOR.muted} width={1.4} />
          <DgCcnaBox x={178} y={140 + i * 32} w={156} h={26} label={b} color={COLOR.orange} size={9.5} />
        </g>
      ))}
      <DgCcnaText x={170} y={224} t="PAT: one public address, a unique source port per flow" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={170} y={240} t="Outside local = outside global = 198.51.100.10:80" size={8.5} />
      <DgCcnaText x={170} y={254} t="(the remote host's address is not translated)" size={8.5} />
      <DgCcnaText x={170} y={284} t="The ACL only selects which inside hosts get translated" />
    </svg>
  );
}

/* 12. ACL top-down first match */
function DiagramCcnaAclFlow() {
  const rows = [
    { y: 34, code: '10 deny   tcp host 10.1.1.9 any eq 80', out: 'Packet A (src 10.1.1.9) matches first: dropped', col: COLOR.red },
    { y: 96, code: '20 permit tcp 10.1.1.0 0.0.0.255 any eq 80', out: 'Packet B (src 10.1.1.5) skips line 10: permitted', col: COLOR.teal },
    { y: 158, code: 'implicit  deny ip any any   (invisible)', out: 'Packet C (src 10.2.2.2) matches nothing: dropped', col: COLOR.red, dashed: true },
  ];
  return (
    <svg viewBox="0 0 340 262" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={14} t="Three TCP packets to port 80 meet this ACL top to bottom" fill={COLOR.text} size={9.5} weight="600" />
      <DgCcnaArrow x1={14} y1={30} x2={14} y2={206} color={COLOR.muted} width={1.4} />
      {rows.map((r) => (
        <g key={r.code}>
          <rect x={28} y={r.y} width={304} height={54} rx="7" fill={tint(r.col, 12)} stroke={r.col} strokeWidth="1.3" strokeDasharray={r.dashed ? '4 3' : undefined} />
          <text x={38} y={r.y + 21} fill={COLOR.text} fontSize="9.5" fontWeight="600" fontFamily="ui-monospace, Menlo, Consolas, monospace">{r.code}</text>
          <DgCcnaText x={38} y={r.y + 40} t={r.out} anchor="start" size={8.5} fill={COLOR.text} />
        </g>
      ))}
      <DgCcnaText x={170} y={228} t="First match decides and the scan stops" fill={COLOR.text} size={9} weight="600" />
      <DgCcnaText x={170} y={243} t="Specific lines go first; a lone deny list blocks everything" />
      <DgCcnaText x={170} y={256} t="and an early permit ip any any hides the lines after it" />
    </svg>
  );
}

/* 13. Syslog severity threshold */
function DiagramCcnaSyslogLevels() {
  const lv = ['Emergency', 'Alert', 'Critical', 'Error', 'Warning', 'Notice', 'Informational', 'Debugging'];
  const rh = 26, top = 30;
  return (
    <svg viewBox="0 0 340 276" style={{ width: '100%', height: 'auto' }}>
      <DgCcnaText x={170} y={14} t="Syslog severity: lower number = more severe" fill={COLOR.text} size={10} weight="600" />
      {lv.map((n, i) => {
        const on = i <= 4;
        const col = on ? COLOR.red : COLOR.muted;
        const y = top + i * rh + (i > 4 ? 8 : 0);
        return (
          <g key={n}>
            <circle cx={22} cy={y + 10} r={10} fill={tint(col, on ? 26 : 12)} stroke={col} strokeWidth="1.2" />
            <text x={22} y={y + 13.5} textAnchor="middle" fill={COLOR.text} fontSize="9.5" fontWeight="700">{i}</text>
            <rect x={40} y={y} width={140} height={20} rx="5" fill={tint(col, on ? 14 : 8)} stroke={col} strokeWidth="1" />
            <text x={50} y={y + 14} fill={on ? COLOR.text : COLOR.muted} fontSize="9.5" fontWeight="600">{n}</text>
          </g>
        );
      })}
      <line x1={14} y1={top + 5 * rh + 3} x2={196} y2={top + 5 * rh + 3} stroke={COLOR.gold} strokeWidth="2" strokeDasharray="5 3" />
      <DgCcnaText x={202} y={top + 5 * rh + 6} t="logging trap 4" anchor="start" fill={COLOR.gold} size={9.5} weight="700" />
      <path d={`M190 ${top} L196 ${top} L196 ${top + 4 * rh + 20} L190 ${top + 4 * rh + 20}`} fill="none" stroke={COLOR.red} strokeWidth="1.3" />
      <DgCcnaText x={204} y={top + 30} t="Sent to the" anchor="start" fill={COLOR.text} size={9.5} weight="600" />
      <DgCcnaText x={204} y={top + 43} t="collector:" anchor="start" fill={COLOR.text} size={9.5} weight="600" />
      <DgCcnaText x={204} y={top + 58} t="levels 0 to 4" anchor="start" size={9} />
      <path d={`M190 ${top + 5 * rh + 8} L196 ${top + 5 * rh + 8} L196 ${top + 7 * rh + 28} L190 ${top + 7 * rh + 28}`} fill="none" stroke={COLOR.muted} strokeWidth="1.3" />
      <DgCcnaText x={204} y={top + 5 * rh + 36} t="Discarded:" anchor="start" size={9.5} weight="600" />
      <DgCcnaText x={204} y={top + 5 * rh + 49} t="Notice, Info," anchor="start" size={9} />
      <DgCcnaText x={204} y={top + 5 * rh + 61} t="Debugging" anchor="start" size={9} />
      <DgCcnaText x={170} y={262} t="A threshold keeps that level and everything more severe" />
    </svg>
  );
}

Object.assign(LESSON_DIAGRAMS, {
  ccnaEncapsulation: DiagramCcnaEncapsulation,
  ccnaSubnetBlocks: DiagramCcnaSubnetBlocks,
  ccnaIpv6Eui64: DiagramCcnaIpv6Eui64,
  ccnaTrunkDot1q: DiagramCcnaTrunkDot1q,
  ccnaStpTriangle: DiagramCcnaStpTriangle,
  ccnaWirelessArch: DiagramCcnaWirelessArch,
  ccnaSdnPlanes: DiagramCcnaSdnPlanes,
  ccnaLongestPrefix: DiagramCcnaLongestPrefix,
  ccnaOspfStates: DiagramCcnaOspfStates,
  ccnaHsrp: DiagramCcnaHsrp,
  ccnaNatPat: DiagramCcnaNatPat,
  ccnaAclFlow: DiagramCcnaAclFlow,
  ccnaSyslogLevels: DiagramCcnaSyslogLevels,
});
