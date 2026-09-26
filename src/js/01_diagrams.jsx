/* ---------------- diagrams ---------------- */

function DBox({ x, y, w, h, label, sub }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -3 : 4)} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="600">{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">{sub}</text>}
    </g>
  );
}

function DLine({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLOR.border} strokeWidth="1.3" />;
}

function DCaption({ x, y, text }) {
  return <text x={x} y={y} textAnchor="middle" fill={COLOR.muted} fontSize="9">{text}</text>;
}

function DiagramServiceModels() {
  const cols = ['On-prem', 'IaaS', 'PaaS', 'SaaS'];
  const rows = ['Applications', 'Runtime & OS', 'Virtualization', 'Physical infra'];
  const grid = [[1, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]];
  const colW = 62, rowH = 42, labelW = 84, top = 28;
  const width = labelW + cols.length * colW + 6;
  const height = top + rows.length * rowH + 34;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {cols.map((c, ci) => (
        <text key={c} x={labelW + ci * colW + colW / 2} y={16} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="600">{c}</text>
      ))}
      {rows.map((r, ri) => (
        <React.Fragment key={r}>
          <text x={2} y={top + ri * rowH + rowH / 2 + 4} fill={COLOR.muted} fontSize="9">{r}</text>
          {cols.map((c, ci) => {
            const managed = grid[ri][ci];
            return (
              <rect
                key={c}
                x={labelW + ci * colW}
                y={top + ri * rowH}
                width={colW - 6}
                height={rowH - 6}
                rx="6"
                fill={managed ? 'rgba(167,139,250,0.16)' : 'rgba(211,164,101,0.13)'}
                stroke={managed ? COLOR.primary : COLOR.gold}
                strokeWidth="1.2"
              />
            );
          })}
        </React.Fragment>
      ))}
      <rect x={labelW} y={height - 20} width="10" height="10" fill="rgba(167,139,250,0.16)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={labelW + 15} y={height - 11} fill={COLOR.muted} fontSize="8.5">You manage</text>
      <rect x={labelW + 90} y={height - 20} width="10" height="10" fill="rgba(211,164,101,0.13)" stroke={COLOR.gold} strokeWidth="1" />
      <text x={labelW + 105} y={height - 11} fill={COLOR.muted} fontSize="8.5">Microsoft manages</text>
    </svg>
  );
}

function DiagramHierarchy() {
  return (
    <svg viewBox="0 0 310 190" style={{ width: '100%', height: 'auto' }}>
      <DBox x={115} y={8} w={100} h={30} label="Management Group" />
      <DLine x1={165} y1={38} x2={90} y2={72} />
      <DLine x1={165} y1={38} x2={240} y2={72} />
      <DBox x={40} y={72} w={100} h={30} label="Subscription A" />
      <DBox x={190} y={72} w={100} h={30} label="Subscription B" />
      <DLine x1={90} y1={102} x2={62} y2={136} />
      <DLine x1={90} y1={102} x2={122} y2={136} />
      <DLine x1={240} y1={102} x2={212} y2={136} />
      <DLine x1={240} y1={102} x2={272} y2={136} />
      <DBox x={35} y={136} w={55} h={28} label="RG" />
      <DBox x={95} y={136} w={55} h={28} label="RG" />
      <DBox x={185} y={136} w={55} h={28} label="RG" />
      <DBox x={245} y={136} w={55} h={28} label="RG" />
      <DCaption x={155} y={178} text="Policy and access assigned higher up flow down" />
    </svg>
  );
}

function DiagramNetworking() {
  return (
    <svg viewBox="0 0 320 210" style={{ width: '100%', height: 'auto' }}>
      <rect x={8} y={26} width={140} height={130} rx="10" fill="none" stroke={COLOR.border} strokeDasharray="4 3" />
      <DCaption x={78} y={18} text="Traditional office network" />
      <DBox x={58} y={44} w={40} h={26} label="Router" />
      <DLine x1={78} y1={70} x2={45} y2={104} />
      <DLine x1={78} y1={70} x2={110} y2={104} />
      <DBox x={18} y={104} w={55} h={30} label="VLAN A" />
      <DBox x={83} y={104} w={55} h={30} label="VLAN B" />
      <rect x={168} y={26} width={144} height={130} rx="10" fill="none" stroke={COLOR.border} strokeDasharray="4 3" />
      <DCaption x={240} y={18} text="Azure virtual network" />
      <DBox x={180} y={104} w={55} h={30} label="Subnet A" />
      <DBox x={245} y={104} w={55} h={30} label="Subnet B" />
      <DBox x={140} y={168} w={40} h={26} label="Gateway" />
      <DLine x1={78} y1={156} x2={160} y2={168} />
      <DLine x1={240} y1={156} x2={160} y2={168} />
      <DCaption x={160} y={204} text="A VPN Gateway or ExpressRoute links the two" />
    </svg>
  );
}

function DiagramStorage() {
  return (
    <svg viewBox="0 0 320 165" style={{ width: '100%', height: 'auto' }}>
      <rect x={10} y={8} width={300} height={66} rx="10" fill="none" stroke={COLOR.border} strokeDasharray="4 3" />
      <DCaption x={160} y={20} text="One storage account" />
      <DBox x={20} y={30} w={60} h={30} label="Blob" />
      <DBox x={93} y={30} w={60} h={30} label="Files" />
      <DBox x={166} y={30} w={60} h={30} label="Queue" />
      <DBox x={239} y={30} w={60} h={30} label="Table" />
      <DCaption x={160} y={90} text="Access tiers: cost vs. speed trade-off" />
      <rect x={20} y={98} width={70} height={22} fill="rgba(167,139,250,0.28)" stroke={COLOR.primary} strokeWidth="1" />
      <rect x={90} y={98} width={70} height={22} fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <rect x={160} y={98} width={70} height={22} fill="rgba(211,164,101,0.14)" stroke={COLOR.gold} strokeWidth="1" />
      <rect x={230} y={98} width={70} height={22} fill="rgba(211,164,101,0.28)" stroke={COLOR.gold} strokeWidth="1" />
      <text x={55} y={136} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">Hot</text>
      <text x={125} y={136} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">Cool</text>
      <text x={195} y={136} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">Cold</text>
      <text x={265} y={136} textAnchor="middle" fill={COLOR.muted} fontSize="8.5">Archive</text>
      <DCaption x={160} y={154} text="Hot: fast + pricier storage. Archive: cheap + slow to retrieve." />
    </svg>
  );
}

function DiagramIdentity() {
  return (
    <svg viewBox="0 0 300 195" style={{ width: '100%', height: 'auto' }}>
      <DBox x={90} y={8} w={120} h={30} label="Microsoft Entra ID" sub="users, groups, apps" />
      <DLine x1={150} y1={38} x2={70} y2={88} />
      <DLine x1={150} y1={38} x2={230} y2={88} />
      <DBox x={10} y={88} w={120} h={40} label="RBAC" sub="what you can do" />
      <DBox x={170} y={88} w={120} h={40} label="Conditional Access" sub="conditions to sign in" />
      <DLine x1={70} y1={128} x2={150} y2={152} />
      <DLine x1={230} y1={128} x2={150} y2={152} />
      <DBox x={90} y={152} w={120} h={30} label="Access to a resource" sub="both checks must pass" />
    </svg>
  );
}

function DiagramRbacScope() {
  return (
    <svg viewBox="0 0 300 165" style={{ width: '100%', height: 'auto' }}>
      <DBox x={20} y={10} w={110} h={40} label="Role" sub="what you can do" />
      <DBox x={170} y={10} w={110} h={40} label="Scope" sub="where it applies" />
      <DLine x1={75} y1={50} x2={150} y2={95} />
      <DLine x1={225} y1={50} x2={150} y2={95} />
      <DBox x={90} y={95} w={120} h={40} label="Role assignment" sub="combines both" />
      <DCaption x={150} y={155} text="Most permissive applicable assignment wins" />
    </svg>
  );
}

function DiagramDiskTiers() {
  return (
    <svg viewBox="0 0 320 120" style={{ width: '100%', height: 'auto' }}>
      <DCaption x={160} y={14} text="Managed disk tiers: cost vs. performance" />
      <rect x={15} y={22} width={70} height={26} fill="rgba(211,164,101,0.28)" stroke={COLOR.gold} strokeWidth="1" />
      <rect x={90} y={22} width={70} height={26} fill="rgba(211,164,101,0.14)" stroke={COLOR.gold} strokeWidth="1" />
      <rect x={165} y={22} width={70} height={26} fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <rect x={240} y={22} width={70} height={26} fill="rgba(167,139,250,0.28)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={50} y={64} textAnchor="middle" fill={COLOR.muted} fontSize="8">Standard HDD</text>
      <text x={125} y={64} textAnchor="middle" fill={COLOR.muted} fontSize="8">Standard SSD</text>
      <text x={200} y={64} textAnchor="middle" fill={COLOR.muted} fontSize="8">Premium SSD</text>
      <text x={275} y={64} textAnchor="middle" fill={COLOR.muted} fontSize="8">Ultra Disk</text>
      <DCaption x={160} y={88} text="Standard HDD: cheapest, lowest performance." />
      <DCaption x={160} y={102} text="Ultra Disk: highest, most configurable performance." />
    </svg>
  );
}

function DiagramDeploymentSlots() {
  return (
    <svg viewBox="0 0 300 120" style={{ width: '100%', height: 'auto' }}>
      <DCaption x={150} y={16} text="Swap" />
      <DBox x={15} y={28} w={110} h={50} label="Staging slot" sub="test the new version" />
      <DBox x={175} y={28} w={110} h={50} label="Production slot" sub="live traffic" />
      <line x1={128} y1={43} x2={172} y2={43} stroke={COLOR.primary} strokeWidth="1.5" />
      <line x1={172} y1={63} x2={128} y2={63} stroke={COLOR.primary} strokeWidth="1.5" />
      <DCaption x={150} y={100} text="A swap exchanges the two almost instantly" />
    </svg>
  );
}

function DiagramNsgPriority() {
  return (
    <svg viewBox="0 0 300 175" style={{ width: '100%', height: 'auto' }}>
      <DBox x={20} y={10} w={260} h={30} label="Priority 100: Allow port 443" />
      <DLine x1={30} y1={40} x2={30} y2={54} />
      <DBox x={20} y={54} w={260} h={30} label="Priority 200: Deny all inbound" />
      <DLine x1={30} y1={84} x2={30} y2={98} />
      <DBox x={20} y={98} w={260} h={30} label="Priority 65500: Default deny" />
      <DCaption x={150} y={144} text="Rules are evaluated top to bottom" />
      <DCaption x={150} y={158} text="The first matching rule wins" />
    </svg>
  );
}

function DiagramBackupRecovery() {
  return (
    <svg viewBox="0 0 300 165" style={{ width: '100%', height: 'auto' }}>
      <DBox x={95} y={8} w={110} h={30} label="Your workload" />
      <DLine x1={120} y1={38} x2={60} y2={72} />
      <DLine x1={180} y1={38} x2={240} y2={72} />
      <DBox x={10} y={72} w={100} h={44} label="Azure Backup" sub="restore a point in time" />
      <DBox x={190} y={72} w={100} h={44} label="Site Recovery" sub="failover to another region" />
      <DCaption x={150} y={135} text="Backup fixes data loss." />
      <DCaption x={150} y={149} text="Site Recovery fixes a region-wide outage." />
    </svg>
  );
}

function DiagramGroupLicensing() {
  return (
    <svg viewBox="0 0 300 195" style={{ width: '100%', height: 'auto' }}>
      <DBox x={90} y={8} w={120} h={30} label="New group member" />
      <DLine x1={150} y1={38} x2={70} y2={88} />
      <DLine x1={150} y1={38} x2={230} y2={88} />
      <DBox x={10} y={88} w={120} h={40} label="Security group" sub="added manually" />
      <DBox x={170} y={88} w={120} h={40} label="Dynamic group" sub="rule adds them automatically" />
      <DLine x1={70} y1={128} x2={150} y2={152} />
      <DLine x1={230} y1={128} x2={150} y2={152} />
      <DBox x={90} y={152} w={120} h={30} label="License + access applied" />
    </svg>
  );
}

function DiagramStorageAccess() {
  return (
    <svg viewBox="0 0 300 165" style={{ width: '100%', height: 'auto' }}>
      <DBox x={90} y={8} w={120} h={30} label="Storage account" />
      <DLine x1={150} y1={38} x2={70} y2={72} />
      <DLine x1={150} y1={38} x2={230} y2={72} />
      <DBox x={10} y={72} w={120} h={40} label="Access key" sub="full account access" />
      <DBox x={170} y={72} w={120} h={40} label="SAS token" sub="scoped + time-limited" />
      <DCaption x={150} y={135} text="A storage firewall adds a network-level gate on top of either" />
      <DCaption x={150} y={150} text="Prefer a SAS over an access key when sharing externally" />
    </svg>
  );
}

function DiagramFourDimensions() {
  return (
    <svg viewBox="0 0 300 250" style={{ width: '100%', height: 'auto' }}>
      <DCaption x={150} y={18} text="External environment — PESTLE factors" />
      <rect x={8} y={26} width={284} height={196} rx="10" fill="none" stroke={COLOR.border} strokeDasharray="4 3" />
      <DBox x={14} y={44} w={118} h={42} label="Organizations & People" />
      <DBox x={168} y={44} w={118} h={42} label="Information & Technology" />
      <DBox x={14} y={176} w={118} h={42} label="Partners & Suppliers" />
      <DBox x={168} y={176} w={118} h={42} label="Value Streams & Processes" />
      <DBox x={91} y={105} w={118} h={42} label="Value creation" sub="shaped by all four" />
      <DLine x1={132} y1={86} x2={91} y2={105} />
      <DLine x1={168} y1={86} x2={209} y2={105} />
      <DLine x1={132} y1={176} x2={91} y2={147} />
      <DLine x1={168} y1={176} x2={209} y2={147} />
      <DCaption x={150} y={238} text="Each dimension shapes, and is shaped by, the other three" />
    </svg>
  );
}

function DiagramProductServiceLifecycle() {
  return (
    <svg viewBox="0 0 372 235" style={{ width: '100%', height: 'auto' }}>
      <DBox x={12} y={16} w={76} h={32} label="Discover" />
      <DBox x={102} y={16} w={76} h={32} label="Design" />
      <DBox x={192} y={16} w={76} h={32} label="Acquire" />
      <DBox x={282} y={16} w={76} h={32} label="Build" />
      <DBox x={282} y={160} w={76} h={32} label="Transition" />
      <DBox x={192} y={160} w={76} h={32} label="Operate" />
      <DBox x={102} y={160} w={76} h={32} label="Deliver" />
      <DBox x={12} y={160} w={76} h={32} label="Support" />
      <DLine x1={88} y1={32} x2={102} y2={32} />
      <DLine x1={178} y1={32} x2={192} y2={32} />
      <DLine x1={268} y1={32} x2={282} y2={32} />
      <DLine x1={320} y1={48} x2={320} y2={160} />
      <DLine x1={282} y1={176} x2={268} y2={176} />
      <DLine x1={192} y1={176} x2={178} y2={176} />
      <DLine x1={102} y1={176} x2={88} y2={176} />
      <line x1={50} y1={160} x2={50} y2={48} stroke={COLOR.primary} strokeWidth="1.3" strokeDasharray="4 3" />
      <DCaption x={186} y={207} text="Solid: the forward flow, Discover through Support" />
      <DCaption x={186} y={221} text="Dashed: work loops back to Discover as needed" />
    </svg>
  );
}

function DiagramContinualImprovementModel() {
  const steps = [
    'What is the vision?',
    'Where are we now?',
    'Where do we want to be?',
    'How do we get there?',
    'Take action',
    'Did we get there?',
    'Keep the momentum going',
  ];
  const boxY = [8, 46, 84, 122, 160, 198, 236];
  return (
    <svg viewBox="0 0 300 304" style={{ width: '100%', height: 'auto' }}>
      {steps.map((label, i) => (
        <DBox key={label} x={30} y={boxY[i]} w={230} h={28} label={label} />
      ))}
      {boxY.slice(0, -1).map((y, i) => (
        <DLine key={i} x1={145} y1={y + 28} x2={145} y2={boxY[i + 1]} />
      ))}
      <polyline
        points={`260,${boxY[6] + 14} 280,${boxY[6] + 14} 280,${boxY[0] + 14} 260,${boxY[0] + 14}`}
        fill="none"
        stroke={COLOR.primary}
        strokeWidth="1.3"
        strokeDasharray="4 3"
      />
      <DCaption x={150} y={296} text="Loops back — continual, not a one-time project" />
    </svg>
  );
}

function DiagramDeploymentModels() {
  const cols = ['Public', 'Private', 'Hybrid', 'Community'];
  const rowLabels = ['Owned by', 'Open to', 'Chief driver'];
  const grid = [
    ['Provider', 'Your org', 'Both, linked', 'Member orgs'],
    ['Anyone', 'Your org', 'Mixed', 'Peer orgs'],
    ['Lowest cost', 'Max control', 'Compliance', 'Shared need'],
  ];
  const colW = 76, rowH = 40, labelW = 84, top = 26;
  const width = labelW + cols.length * colW + 6;
  const height = top + rowLabels.length * rowH + 40;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {cols.map((c, ci) => (
        <text key={c} x={labelW + ci * colW + colW / 2} y={16} textAnchor="middle" fill={COLOR.text} fontSize="10.5" fontWeight="600">{c}</text>
      ))}
      {rowLabels.map((r, ri) => (
        <React.Fragment key={r}>
          <text x={2} y={top + ri * rowH + rowH / 2 + 4} fill={COLOR.muted} fontSize="9">{r}</text>
          {cols.map((c, ci) => (
            <DBox key={c} x={labelW + ci * colW} y={top + ri * rowH} w={colW - 6} h={rowH - 8} label={grid[ri][ci]} />
          ))}
        </React.Fragment>
      ))}
      <DCaption x={width / 2} y={height - 24} text="Hybrid = private + public, connected together" />
      <DCaption x={width / 2} y={height - 10} text="Multi-cloud = two+ public providers, a different thing" />
    </svg>
  );
}

function DiagramScalingApproaches() {
  return (
    <svg viewBox="0 0 320 145" style={{ width: '100%', height: 'auto' }}>
      <DCaption x={82} y={12} text="Vertical (scale up)" />
      <DBox x={20} y={26} w={50} h={30} label="Server" sub="small" />
      <DLine x1={72} y1={41} x2={96} y2={41} />
      <DBox x={98} y={14} w={60} h={62} label="Server" sub="bigger" />
      <DCaption x={242} y={12} text="Horizontal (scale out)" />
      <DBox x={182} y={26} w={50} h={30} label="Server" />
      <DLine x1={234} y1={41} x2={258} y2={41} />
      <DBox x={260} y={8} w={48} h={22} label="Server" />
      <DBox x={260} y={34} w={48} h={22} label="Server" />
      <DBox x={260} y={60} w={48} h={22} label="Server" />
      <DCaption x={160} y={112} text="Vertical: bigger box, one restart, hits a size ceiling" />
      <DCaption x={160} y={126} text="Horizontal: more boxes in parallel, needs a load balancer" />
    </svg>
  );
}

function DiagramDmzZones() {
  return (
    <svg viewBox="0 0 400 150" style={{ width: '100%', height: 'auto' }}>
      <DBox x={6} y={44} w={46} h={28} label="Internet" />
      <DLine x1={52} y1={58} x2={76} y2={58} />
      <DBox x={76} y={36} w={40} h={44} label="Firewall" sub="edge" />
      <DLine x1={116} y1={58} x2={140} y2={58} />
      <rect x={140} y={26} width={140} height={64} rx="10" fill="none" stroke={COLOR.gold} strokeDasharray="4 3" />
      <DCaption x={210} y={18} text="DMZ (public-facing)" />
      <DBox x={150} y={42} w={58} h={32} label="Web server" />
      <DBox x={212} y={42} w={58} h={32} label="Mail relay" />
      <DLine x1={280} y1={58} x2={300} y2={58} />
      <DBox x={300} y={36} w={40} h={44} label="Firewall" sub="internal" />
      <DLine x1={340} y1={58} x2={362} y2={58} />
      <DBox x={362} y={40} w={36} h={36} label="LAN" sub="private" />
      <DCaption x={200} y={120} text="Each boundary firewall limits what can reach the next zone inward" />
      <DCaption x={200} y={134} text="Only the DMZ is directly exposed to the internet" />
    </svg>
  );
}

const LESSON_DIAGRAMS = {
  serviceModels: DiagramServiceModels,
  hierarchy: DiagramHierarchy,
  networking: DiagramNetworking,
  storage: DiagramStorage,
  identity: DiagramIdentity,
  rbacScope: DiagramRbacScope,
  diskTiers: DiagramDiskTiers,
  deploymentSlots: DiagramDeploymentSlots,
  nsgPriority: DiagramNsgPriority,
  backupRecovery: DiagramBackupRecovery,
  groupLicensing: DiagramGroupLicensing,
  storageAccess: DiagramStorageAccess,
  fourDimensions: DiagramFourDimensions,
  productServiceLifecycle: DiagramProductServiceLifecycle,
  continualImprovementModel: DiagramContinualImprovementModel,
  deploymentModels: DiagramDeploymentModels,
  scalingApproaches: DiagramScalingApproaches,
  dmzZones: DiagramDmzZones,
};

