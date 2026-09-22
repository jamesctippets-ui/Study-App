/* ---------------- portal mockups (illustrations, not real screenshots) ---------------- */

function PortalFrame({ children, height }) {
  return (
    <svg viewBox={`0 0 320 ${height}`} style={{ width: '100%', height: 'auto' }}>
      <rect x="0" y="0" width="320" height={height} rx="8" fill={COLOR.surfaceRaised} stroke={COLOR.border} />
      <rect x="0" y="0" width="320" height="24" rx="8" fill={COLOR.bg} />
      <circle cx="12" cy="12" r="3" fill={COLOR.red} opacity="0.6" />
      <circle cx="22" cy="12" r="3" fill={COLOR.gold} opacity="0.6" />
      <circle cx="32" cy="12" r="3" fill={COLOR.primary} opacity="0.6" />
      <rect x="60" y="6" width="200" height="12" rx="6" fill={COLOR.surface} />
      <text x="160" y="15" textAnchor="middle" fill={COLOR.muted} fontSize="7">portal.azure.com</text>
      {children}
    </svg>
  );
}

function MockField({ x, y, w, h, label, value, highlight }) {
  return (
    <g>
      <text x={x} y={y - 3} fill={COLOR.muted} fontSize="7">{label}</text>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={highlight ? 'rgba(167,139,250,0.14)' : COLOR.surface} stroke={highlight ? COLOR.primary : COLOR.border} strokeWidth="1" />
      {value && <text x={x + 6} y={y + h / 2 + 3} fill={highlight ? COLOR.primary : COLOR.text} fontSize="8">{value}</text>}
    </g>
  );
}

function MockupResourceGroup() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Create a resource group</text>
      <MockField x={12} y={54} w={296} h={20} label="Resource group name" value="rg-production" />
      <MockField x={12} y={90} w={296} h={20} label="Region" value="(US) East US" />
      <rect x={230} y={124} width="78" height="18" rx="4" fill={COLOR.primary} />
      <text x={269} y={136} textAnchor="middle" fill="#2B1620" fontSize="8" fontWeight="700">Review + create</text>
    </PortalFrame>
  );
}

function MockupStorageAccount() {
  return (
    <PortalFrame height={175}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Create a storage account</text>
      <MockField x={12} y={52} w={296} h={18} label="Storage account name" value="stmyappdata001" />
      <text x={12} y={86} fill={COLOR.muted} fontSize="7">Performance</text>
      <rect x={12} y={90} width="90" height="18" rx="4" fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={57} y={102} textAnchor="middle" fill={COLOR.primary} fontSize="7.5">● Standard</text>
      <rect x={110} y={90} width="90" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={155} y={102} textAnchor="middle" fill={COLOR.muted} fontSize="7.5">○ Premium</text>
      <MockField x={12} y={124} w={296} h={18} label="Redundancy" value="Geo-redundant storage (GRS)" />
    </PortalFrame>
  );
}

function MockupVmSize() {
  return (
    <PortalFrame height={140}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Select a VM size</text>
      <text x={18} y={54} fill={COLOR.muted} fontSize="7">Size</text>
      <text x={200} y={54} fill={COLOR.muted} fontSize="7">vCPUs</text>
      <text x={250} y={54} fill={COLOR.muted} fontSize="7">RAM</text>
      <rect x={12} y={60} width="296" height="20" rx="4" fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={18} y={73} fill={COLOR.primary} fontSize="7.5">Standard_D2s_v5</text>
      <text x={205} y={73} fill={COLOR.primary} fontSize="7.5">2</text>
      <text x={252} y={73} fill={COLOR.primary} fontSize="7.5">8 GiB</text>
      <rect x={12} y={84} width="296" height="20" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={18} y={97} fill={COLOR.muted} fontSize="7.5">Standard_B2s</text>
      <text x={205} y={97} fill={COLOR.muted} fontSize="7.5">2</text>
      <text x={252} y={97} fill={COLOR.muted} fontSize="7.5">4 GiB</text>
      <rect x={12} y={108} width="296" height="20" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={18} y={121} fill={COLOR.muted} fontSize="7.5">Standard_F4s_v2</text>
      <text x={205} y={121} fill={COLOR.muted} fontSize="7.5">4</text>
      <text x={252} y={121} fill={COLOR.muted} fontSize="7.5">8 GiB</text>
    </PortalFrame>
  );
}

function MockupRoleAssignment() {
  return (
    <PortalFrame height={175}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Add role assignment</text>
      <MockField x={12} y={52} w={296} h={18} label="Role" value="Contributor" highlight />
      <MockField x={12} y={86} w={296} h={18} label="Scope" value="Subscription  >  rg-production" />
      <text x={12} y={122} fill={COLOR.muted} fontSize="7">Assign access to</text>
      <rect x={12} y={126} width="140" height="18" rx="4" fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={82} y={138} textAnchor="middle" fill={COLOR.primary} fontSize="7.5">● User, group</text>
      <rect x={160} y={126} width="148" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={234} y={138} textAnchor="middle" fill={COLOR.muted} fontSize="7.5">○ Managed identity</text>
    </PortalFrame>
  );
}

function MockupVirtualNetwork() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Create virtual network</text>
      <MockField x={12} y={52} w={296} h={18} label="Name" value="vnet-prod" />
      <MockField x={12} y={86} w={140} h={18} label="Address space" value="10.0.0.0/16" />
      <MockField x={160} y={86} w={148} h={18} label="Subnet" value="10.0.1.0/24" />
      <rect x={230} y={116} width="78" height="18" rx="4" fill={COLOR.primary} />
      <text x={269} y={128} textAnchor="middle" fill="#2B1620" fontSize="8" fontWeight="700">Review + create</text>
    </PortalFrame>
  );
}

const PORTAL_MOCKUPS = {
  resourceGroup: MockupResourceGroup,
  virtualNetwork: MockupVirtualNetwork,
  storageAccount: MockupStorageAccount,
  vmSize: MockupVmSize,
  roleAssignment: MockupRoleAssignment,
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Finds the flashcard that best explains a key term: an exact front match,
// then the term appearing as a whole word in a card's front (catches
// comparison cards like "CapEx vs. OpEx" for the term "CapEx"), then the
// same check against the card's back/detail text.
function findTermCard(term, vocabPool) {
  const lower = term.toLowerCase();
  let hit = vocabPool.find((v) => v.front.toLowerCase() === lower);
  if (hit) return hit;
  const wordRe = new RegExp('\\b' + escapeRegExp(lower) + '\\b', 'i');
  hit = vocabPool.find((v) => wordRe.test(v.front));
  if (hit) return hit;
  hit = vocabPool.find((v) => wordRe.test(v.back));
  if (hit) return hit;
  return vocabPool.find((v) => v.detail && wordRe.test(v.detail)) || null;
}

// Renders one highlighted term: a clickable word plus, when it's the
// active one, a flyout anchored directly under it (not appended after the
// whole paragraph/card) — the wrapping span's `position: relative` is what
// makes the flyout's `position: absolute` land right under this specific
// word instead of the block's bottom edge.
function TermTrigger({ text, card, isActive, onToggle }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn-flat term-trigger"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          color: COLOR.gold, fontWeight: 700, background: 'transparent', padding: 0,
          borderBottom: `1px dotted ${COLOR.gold}`, cursor: 'pointer', font: 'inherit',
        }}
      >
        {text}
      </button>
      {isActive && <TermFlyout term={card} onClose={onToggle} />}
    </span>
  );
}

// `activeKey`/`onToggle` let the caller track which single occurrence (if
// any) has its flyout open — `blockId` disambiguates occurrence indices
// across multiple calls in the same component (e.g. one call per paragraph)
// so two different paragraphs' "3rd highlighted word" don't collide.
function highlightTerms(text, terms, vocabPool, activeKey, onToggle, blockId) {
  if (!terms || !terms.length) return text;
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(escapeRegExp);
  const re = new RegExp('(' + escaped.join('|') + ')', 'g');
  const parts = text.split(re);
  return parts.map((part, i) => {
    const isTerm = sorted.some((t) => t === part);
    if (!isTerm) return <React.Fragment key={i}>{part}</React.Fragment>;
    const card = vocabPool ? findTermCard(part, vocabPool) : null;
    if (!card || !onToggle) {
      return <span key={i} style={{ color: COLOR.gold, fontWeight: 700 }}>{part}</span>;
    }
    const key = (blockId || '') + ':' + i;
    return (
      <TermTrigger
        key={i}
        text={part}
        card={card}
        isActive={key === activeKey}
        onToggle={() => onToggle(key === activeKey ? null : key)}
      />
    );
  });
}

// Like highlightTerms, but with no curated `keyTerms` list to work from —
// it scans a track's own flashcard fronts for ones that appear in `text`
// and makes those clickable, so every track gets term popouts for free
// (no per-question authoring needed). Capped at `maxTerms` distinct terms
// per call so a dense explanation doesn't turn into a wall of gold links.
function autoHighlightTerms(text, vocabPool, activeKey, onToggle, maxTerms, blockId) {
  const cap = maxTerms || 3;
  if (!text || !vocabPool || !vocabPool.length || !onToggle) return text;
  const candidates = vocabPool.filter((v) => v.front && v.front.length >= 4);
  if (!candidates.length) return text;
  const sorted = [...candidates].sort((a, b) => b.front.length - a.front.length);
  const escaped = sorted.map((v) => escapeRegExp(v.front));
  const re = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi');
  const parts = text.split(re);
  const shown = new Set();
  return parts.map((part, i) => {
    const match = sorted.find((v) => v.front.toLowerCase() === (part || '').toLowerCase());
    if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
    const dedupeKey = match.front.toLowerCase();
    if (!shown.has(dedupeKey) && shown.size >= cap) return <React.Fragment key={i}>{part}</React.Fragment>;
    shown.add(dedupeKey);
    const key = (blockId || '') + ':' + i;
    return (
      <TermTrigger
        key={i}
        text={part}
        card={match}
        isActive={key === activeKey}
        onToggle={() => onToggle(key === activeKey ? null : key)}
      />
    );
  });
}

