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

function MockupDeploymentSlot() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Add Slot</text>
      <MockField x={12} y={52} w={296} h={18} label="Name" value="staging" highlight />
      <text x={12} y={80} fill={COLOR.muted} fontSize="6.5">my-demo-app-staging.azurewebsites.net</text>
      <MockField x={12} y={90} w={296} h={18} label="Clone settings from" value="Do not clone settings" />
      <rect x={12} y={120} width="60" height="18" rx="4" fill={COLOR.primary} />
      <text x={42} y={132} textAnchor="middle" fill="#2B1620" fontSize="8" fontWeight="700">Add</text>
      <rect x={80} y={120} width="60" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={110} y={132} textAnchor="middle" fill={COLOR.muted} fontSize="8">Close</text>
    </PortalFrame>
  );
}

function MockupNsgRule() {
  return (
    <PortalFrame height={175}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Add inbound security rule</text>
      <MockField x={12} y={52} w={140} h={18} label="Source" value="Any" />
      <MockField x={160} y={52} w={148} h={18} label="Destination port ranges" value="8080" highlight />
      <text x={12} y={86} fill={COLOR.muted} fontSize="7">Action</text>
      <rect x={12} y={90} width="70" height="18" rx="4" fill="rgba(52,211,153,0.14)" stroke={COLOR.success} strokeWidth="1" />
      <text x={47} y={102} textAnchor="middle" fill={COLOR.success} fontSize="7.5">● Allow</text>
      <rect x={90} y={90} width="70" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={125} y={102} textAnchor="middle" fill={COLOR.muted} fontSize="7.5">○ Deny</text>
      <MockField x={12} y={122} w={140} h={18} label="Priority" value="100" highlight />
      <MockField x={160} y={122} w={148} h={18} label="Name" value="AllowCustom8080" />
    </PortalFrame>
  );
}

function MockupPolicyCompliance() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Get Secure — initiative compliance</text>
      <text x={12} y={58} fill={COLOR.muted} fontSize="7">Overall resource compliance</text>
      <text x={12} y={78} fill={COLOR.success} fontSize="16" fontWeight="700">100%</text>
      <rect x={12} y={86} width="150" height="4" rx="2" fill={COLOR.success} />
      <text x={180} y={58} fill={COLOR.muted} fontSize="7">Non-compliant policies</text>
      <text x={180} y={78} fill={COLOR.text} fontSize="16" fontWeight="700">0</text>
      <text x={12} y={112} fill={COLOR.muted} fontSize="7">Policies</text>
      <rect x={12} y={118} width="296" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={18} y={130} fill={COLOR.text} fontSize="7.5">Allowed locations</text>
      <text x={260} y={130} fill={COLOR.success} fontSize="7.5">✓ Compliant</text>
    </PortalFrame>
  );
}

function MockupBackupVault() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Backup Configuration</text>
      <text x={12} y={58} fill={COLOR.muted} fontSize="7">Storage replication type</text>
      <rect x={12} y={64} width="140" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={82} y={76} textAnchor="middle" fill={COLOR.muted} fontSize="7.5">○ Locally-redundant</text>
      <rect x={160} y={64} width="148" height="18" rx="4" fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
      <text x={234} y={76} textAnchor="middle" fill={COLOR.primary} fontSize="7.5">● Geo-redundant</text>
      <MockField x={12} y={98} w={296} h={18} label="Cross Region Restore" value="Disabled" />
      <rect x={230} y={126} width="78" height="18" rx="4" fill={COLOR.primary} />
      <text x={269} y={138} textAnchor="middle" fill="#2B1620" fontSize="8" fontWeight="700">Apply</text>
    </PortalFrame>
  );
}

function MockupInviteGuestUser() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Invite external user</text>
      <text x={12} y={54} fill={COLOR.muted} fontSize="6.5">Invite a guest user to collaborate with your organization.</text>
      <MockField x={12} y={62} w={296} h={18} label="Email" value="" highlight />
      <MockField x={12} y={96} w={296} h={18} label="Display name" value="" />
      <rect x={230} y={126} width="78" height="18" rx="4" fill={COLOR.primary} />
      <text x={269} y={138} textAnchor="middle" fill="#2B1620" fontSize="7.5" fontWeight="700">Review + invite</text>
    </PortalFrame>
  );
}

function MockupPricingCalculator() {
  return (
    <PortalFrame height={150}>
      <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Pricing calculator</text>
      <text x={12} y={54} fill={COLOR.muted} fontSize="6.5">Calculate your estimated hourly or monthly costs for using Azure.</text>
      <rect x={12} y={62} width="296" height="18" rx="4" fill={COLOR.surface} stroke={COLOR.border} strokeWidth="1" />
      <text x={18} y={74} fill={COLOR.muted} fontSize="7.5">🔍 Search products</text>
      <rect x={12} y={88} width="94" height="30" rx="4" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1" />
      <text x={59} y={100} textAnchor="middle" fill={COLOR.text} fontSize="7">Virtual Machines</text>
      <text x={59} y={110} textAnchor="middle" fill={COLOR.muted} fontSize="6">pay per second used</text>
      <rect x={112} y={88} width="94" height="30" rx="4" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1" />
      <text x={159} y={100} textAnchor="middle" fill={COLOR.text} fontSize="7">Storage Accounts</text>
      <text x={159} y={110} textAnchor="middle" fill={COLOR.muted} fontSize="6">pay per GB stored</text>
      <rect x={212} y={88} width="96" height="30" rx="4" fill={COLOR.surfaceRaised} stroke={COLOR.border} strokeWidth="1" />
      <text x={260} y={100} textAnchor="middle" fill={COLOR.text} fontSize="7">Azure SQL DB</text>
      <text x={260} y={110} textAnchor="middle" fill={COLOR.muted} fontSize="6">pay per tier chosen</text>
    </PortalFrame>
  );
}

const PORTAL_MOCKUPS = {
  resourceGroup: MockupResourceGroup,
  virtualNetwork: MockupVirtualNetwork,
  storageAccount: MockupStorageAccount,
  vmSize: MockupVmSize,
  roleAssignment: MockupRoleAssignment,
  deploymentSlot: MockupDeploymentSlot,
  nsgRule: MockupNsgRule,
  policyCompliance: MockupPolicyCompliance,
  backupVault: MockupBackupVault,
  inviteGuestUser: MockupInviteGuestUser,
  pricingCalculator: MockupPricingCalculator,
};

// Step-by-step interactive portal walkthroughs (ROADMAP.md section 4):
// click through creating a resource across several connected portal
// screens instead of one static illustration. Keyed by the SAME string a
// lesson's `portalMockup` field already points at — LessonDetail
// (04_shared_ui.jsx) checks PORTAL_WALKTHROUGHS first and renders the
// walkthrough player instead of the single static Mockup* component when
// an entry exists, so upgrading an existing lesson from static to
// interactive needs zero changes to that lesson's own data, just a new
// registry entry here. Every key without an entry here keeps rendering
// exactly as before (fully backward compatible; no lesson has been
// changed by adding this). Steps reuse the exact same PortalFrame/
// MockField primitives as the static mockups above — just several small
// screens chained together with Back/Next instead of one.
function WalkthroughStep({ children, height }) {
  return <PortalFrame height={height}>{children}</PortalFrame>;
}

const PORTAL_WALKTHROUGHS = {
  vmSize: {
    label: 'Create a virtual machine',
    steps: [
      {
        caption: 'Basics: pick a resource group and name the VM.',
        render: () => (
          <WalkthroughStep height={150}>
            <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Create a virtual machine</text>
            <text x={12} y={52} fill={COLOR.primary} fontSize="7" fontWeight="700">● Basics</text>
            <text x={62} y={52} fill={COLOR.muted} fontSize="7">Disks</text>
            <text x={98} y={52} fill={COLOR.muted} fontSize="7">Networking</text>
            <text x={160} y={52} fill={COLOR.muted} fontSize="7">Review + create</text>
            <MockField x={12} y={62} w={296} h={18} label="Resource group" value="rg-production" highlight />
            <MockField x={12} y={96} w={296} h={18} label="Virtual machine name" value="vm-app01" highlight />
          </WalkthroughStep>
        ),
      },
      {
        caption: 'Size: choose vCPU/RAM sized to the actual workload.',
        render: () => (
          <WalkthroughStep height={140}>
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
          </WalkthroughStep>
        ),
      },
      {
        caption: 'Networking: open only the ports this VM actually needs.',
        render: () => (
          <WalkthroughStep height={150}>
            <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Networking — inbound ports</text>
            <MockField x={12} y={52} w={296} h={18} label="Virtual network" value="vnet-prod" />
            <text x={12} y={90} fill={COLOR.muted} fontSize="7">Public inbound ports</text>
            <rect x={12} y={94} width="140" height="18" rx="4" fill="rgba(167,139,250,0.14)" stroke={COLOR.primary} strokeWidth="1" />
            <text x={82} y={106} textAnchor="middle" fill={COLOR.primary} fontSize="7.5">● Allow selected</text>
            <MockField x={12} y={120} w={296} h={18} label="Select inbound ports" value="HTTPS (443)" highlight />
          </WalkthroughStep>
        ),
      },
      {
        caption: 'Review + create: confirm the summary, then deploy.',
        render: () => (
          <WalkthroughStep height={150}>
            <text x={12} y={40} fill={COLOR.text} fontSize="9" fontWeight="700">Review + create</text>
            <text x={12} y={58} fill={COLOR.success} fontSize="8" fontWeight="700">✓ Validation passed</text>
            <MockField x={12} y={68} w={296} h={16} label="" value="Resource group: rg-production" />
            <MockField x={12} y={92} w={296} h={16} label="" value="Size: Standard_D2s_v5" />
            <rect x={230} y={124} width="78" height="18" rx="4" fill={COLOR.primary} />
            <text x={269} y={136} textAnchor="middle" fill="#2B1620" fontSize="8" fontWeight="700">Create</text>
          </WalkthroughStep>
        ),
      },
      {
        caption: 'Done — the VM is now deployed and running.',
        render: () => (
          <WalkthroughStep height={120}>
            <text x={160} y={55} textAnchor="middle" fill={COLOR.success} fontSize="22">✓</text>
            <text x={160} y={78} textAnchor="middle" fill={COLOR.text} fontSize="9" fontWeight="700">Your deployment is complete</text>
            <text x={160} y={94} textAnchor="middle" fill={COLOR.muted} fontSize="7">vm-app01 is now running in rg-production</text>
          </WalkthroughStep>
        ),
      },
    ],
  },
};

// Drives one PORTAL_WALKTHROUGHS entry: a step counter + progress dots,
// the current step's fake portal screen and plain-language caption, and
// Back/Next controls. Resets to step 0 whenever the walkthrough itself
// changes (switching lessons) so a later lesson never opens mid-way
// through an earlier one's steps.
function PortalWalkthroughPlayer({ walkthrough }) {
  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [walkthrough]);
  const steps = walkthrough.steps;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: COLOR.muted }}>Step {step + 1} of {steps.length}</div>
        <div className="flex" style={{ gap: '4px' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{ width: '6px', height: '6px', borderRadius: '999px', background: i <= step ? COLOR.primary : COLOR.border }}
            />
          ))}
        </div>
      </div>
      <div style={{ fontSize: '11.5px', color: COLOR.muted, marginBottom: '8px', lineHeight: 1.4 }}>{current.caption}</div>
      {current.render()}
      <div className="flex gap-2" style={{ marginTop: '10px' }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex-1"
          style={{
            padding: '10px', borderRadius: '10px', border: `1px solid ${COLOR.border}`, background: 'transparent',
            color: step === 0 ? COLOR.border : COLOR.text, fontSize: '12.5px', fontWeight: 600,
          }}
        >
          ‹ Back
        </button>
        <button
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
          disabled={isLast}
          className="flex-1"
          style={{
            padding: '10px', borderRadius: '10px', background: isLast ? COLOR.surfaceRaised : COLOR.primary,
            color: isLast ? COLOR.success : COLOR.onAccent, fontSize: '12.5px', fontWeight: 600,
          }}
        >
          {isLast ? '✓ Done' : 'Next ›'}
        </button>
      </div>
    </div>
  );
}

// Real Azure Portal screenshots, pulled directly from Microsoft's own public
// documentation source (the MicrosoftDocs/azure-docs and
// MicrosoftDocs/azure-compute-docs GitHub repos), which publish their
// content — including these images — under a Creative Commons Attribution
// 4.0 International license. Not every PORTAL_MOCKUPS key has a match here;
// this only covers the ones where a clean, on-topic, non-sensitive real
// screenshot was actually found (no VNet-creation match was found, for
// instance, so that key is simply absent).
const REAL_PORTAL_SCREENSHOTS = {
  resourceGroup: {
    src: 'images/portal/resource-group.png',
    alt: 'Real Azure Portal screenshot of the Create a resource group form',
    description: "The Basics tab of the \"Create a resource group\" wizard — this is the whole form for that step: pick the subscription that will own the group, name the resource group itself, and choose the Azure region it's created in. Tags and final validation happen on their own separate tabs, not shown here.",
    sourceLabel: 'Microsoft Learn: Manage resource groups',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal',
  },
  storageAccount: {
    src: 'images/portal/storage-account.png',
    alt: 'Real Azure Portal screenshot of the storage account creation tabs',
    description: 'The full tab row across the top of "Create a storage account": Basics, Advanced, Networking, Data protection, Security, Encryption, Tags, and Review + create — each tab configures one specific aspect of the account before it exists, rather than one long form.',
    sourceLabel: 'Microsoft Learn: Create a storage account',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-account-create',
  },
  vmSize: {
    src: 'images/portal/vm-size.png',
    alt: 'Real Azure Portal screenshot of the VM Instance details section',
    description: 'The Instance details section of "Create a virtual machine" — name, region, availability options, and security type at the top, then the OS image and CPU architecture (Arm64 vs. x64) at the bottom. This is where the VM\'s size/image choice actually happens, before you ever reach networking or disks.',
    sourceLabel: 'Microsoft Learn: Create a Windows VM in the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/windows/quick-create-portal',
  },
  roleAssignment: {
    src: 'images/portal/role-assignment.png',
    alt: 'Real Azure Portal screenshot of the Access control (IAM) role assignments list',
    description: 'The Role assignments tab of a resource group\'s Access control (IAM) blade — every user, group, service principal, and managed identity that currently holds a role (Billing Reader, Contributor, etc.) at this scope, plus the Add/Remove/Download controls above the list.',
    sourceLabel: 'Microsoft Learn: Assign a role in the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/quickstart-assign-role-user-portal',
  },
  deploymentSlot: {
    src: 'images/portal/deployment-slots.png',
    alt: 'Real Azure Portal screenshot of the Add Slot panel for App Service deployment slots',
    description: 'The "Add Slot" panel opened from an App Service\'s Deployment slots blade — naming the new slot ("staging"), the auto-generated URL that slot gets, and the "Clone settings from" option for copying configuration from an existing slot instead of starting blank.',
    sourceLabel: 'Microsoft Learn: Set up staging environments for App Service',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots',
  },
  nsgRule: {
    src: 'images/portal/nsg-rule.png',
    alt: 'Real Azure Portal screenshot of the Add inbound security rule panel for a network security group',
    description: 'The "Add inbound security rule" panel for a network security group — source, destination port range, the Allow/Deny action toggle, and the Priority field that decides which rule wins when two rules could both apply to the same traffic.',
    sourceLabel: 'Microsoft Learn: Manage network security groups',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/manage-network-security-group',
  },
  policyCompliance: {
    src: 'images/portal/policy-compliance.png',
    alt: 'Real Azure Portal screenshot of an Azure Policy initiative compliance dashboard',
    description: 'An Azure Policy initiative\'s compliance dashboard — overall resource compliance at a glance (100% here), a count of non-compliant policies, and the per-policy breakdown below showing each individual policy\'s current compliance state.',
    sourceLabel: 'Microsoft Learn: Create and manage policies to enforce compliance',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/tutorials/create-and-manage',
  },
  backupVault: {
    src: 'images/portal/backup-vault.png',
    alt: 'Real Azure Portal screenshot of a Recovery Services vault\'s Backup Configuration panel',
    description: 'A Recovery Services vault\'s Backup Configuration panel — the storage replication type choice (locally-redundant vs. geo-redundant) that decides whether backup data itself would survive a full regional outage, plus the Cross Region Restore toggle.',
    sourceLabel: 'Microsoft Learn: Create and configure a Recovery Services vault',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/backup/backup-create-recovery-services-vault',
  },
  inviteGuestUser: {
    src: 'images/portal/invite-guest-user.png',
    alt: 'Real Azure Portal screenshot of the Invite external user panel',
    description: 'The "Invite external user" panel reached from Users — Basics tab collects the guest\'s email, display name, and an optional invitation message; the Properties, Assignments, and Review + invite tabs after this one finish the rest of the setup.',
    sourceLabel: 'Microsoft Learn: Assign Azure roles to external guest users',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-external-users',
  },
  pricingCalculator: {
    src: 'images/portal/pricing-calculator.png',
    alt: 'Real screenshot of the Azure pricing calculator website',
    description: 'The Azure pricing calculator\'s product picker — search or browse for a service (Virtual Machines, Storage Accounts, Azure SQL Database, and more), add it to an estimate, and configure it to see a live cost projection before you ever deploy anything. This is the consumption-based model made concrete: you\'re pricing exactly what you\'d use, not a fixed bundle.',
    sourceLabel: 'Microsoft: Azure pricing calculator documentation',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/pricing-calculator',
  },
  // Microsoft Intune admin center screenshots (MD-102) — sourced from the
  // MicrosoftDocs/memdocs GitHub repo, which uses the same CC BY 4.0
  // content license as azure-docs (see LICENSE/LICENSE-CODE there). These
  // are a different admin console from the Azure Portal, so `product`
  // overrides RealPortalScreenshot's default caption text accordingly.
  intuneDeviceProfile: {
    src: 'images/intune/create-device-profile.png',
    alt: 'Real Microsoft Intune screenshot of the device configuration profile type picker',
    description: 'The profile type picker when creating a Windows device configuration profile — Settings catalog (browse and pick individual settings directly), Templates (a pre-built group of related settings for a common scenario), or Properties catalog. Which one an admin picks changes how the profile is built, not just its name.',
    sourceLabel: 'Microsoft Learn: Configure device configuration profiles in Microsoft Intune',
    sourceUrl: 'https://learn.microsoft.com/en-us/intune/device-configuration/create-device-profile',
    product: 'Microsoft Intune admin center',
  },
  intuneWin32Detection: {
    src: 'images/intune/win32-detection-rule.png',
    alt: 'Real Microsoft Intune screenshot of a Win32 app detection rule',
    description: "A Win32 app's detection rule, configured to check for a specific registry key — this is how Intune decides an app is already installed and skips reinstalling it. A missing or wrong detection rule is a classic reason a Win32 app shows as failed or keeps reinstalling.",
    sourceLabel: 'Microsoft Learn: Add and assign Win32 apps to Microsoft Intune',
    sourceUrl: 'https://learn.microsoft.com/en-us/intune/app-management/deployment/add-win32',
    product: 'Microsoft Intune admin center',
  },
  intuneAutoEnrollScope: {
    src: 'images/intune/auto-enrollment-scope.png',
    alt: 'Real Microsoft Intune screenshot of the MDM automatic enrollment scope setting',
    description: 'The MDM user scope setting that turns on Windows automatic enrollment — None, Some (a specific group), or All. This is the single setting that decides whether a Microsoft Entra-joined Windows device automatically enrolls into Intune the moment a user signs in, with no separate manual enrollment step.',
    sourceLabel: 'Microsoft Learn: Enable MDM automatic enrollment for Windows',
    sourceUrl: 'https://learn.microsoft.com/en-us/intune/device-enrollment/windows/enable-automatic-mdm',
    product: 'Microsoft Intune admin center',
  },
  intuneNoncomplianceActions: {
    src: 'images/intune/noncompliance-notification.png',
    alt: 'Real Microsoft Intune screenshot of the create-a-noncompliance-notification wizard',
    description: "Step 2 of creating a noncompliance notification — one of several actions for noncompliance a compliance policy can trigger on a schedule (others include remotely locking the device or marking it noncompliant), rather than just silently recording that a device failed a check.",
    sourceLabel: 'Microsoft Learn: Configure compliance policies with actions for noncompliance',
    sourceUrl: 'https://learn.microsoft.com/en-us/intune/device-security/compliance/configure-noncompliance-actions',
    product: 'Microsoft Intune admin center',
  },
  intuneMonitorDashboard: {
    src: 'images/intune/monitor-dashboard-tiles.png',
    alt: 'Real Microsoft Intune screenshot of the device enrollment, compliance, and configuration health tiles',
    description: 'The at-a-glance health tiles from Intune\'s monitoring dashboard — device enrollment, device compliance, and device configuration each roll up to a single OK/warning state, with a count of anything needing attention (here, 4 configuration policies with an error or conflict) rather than requiring a click into each report to notice a problem.',
    sourceLabel: 'Microsoft Learn: Microsoft Intune reports',
    sourceUrl: 'https://learn.microsoft.com/en-us/intune/device-management/reports/overview',
    product: 'Microsoft Intune admin center',
  },
  // AZ-305 architecture reference diagrams — sourced directly from the
  // MicrosoftDocs/architecture-center GitHub repo (the Azure Architecture
  // Center's source), which is also CC BY 4.0 licensed (confirmed via its
  // own LICENSE file, same as azure-docs and memdocs above). These are
  // real Microsoft reference-architecture diagrams, not portal
  // screenshots, so `product` labels them accordingly.
  hubSpokeTopology: {
    src: 'images/az305-arch/hub-spoke-topology.svg',
    alt: 'Real Azure Architecture Center diagram of the hub-spoke virtual network topology',
    description: "A hub virtual network in the middle hosting shared services — Azure Bastion, Azure Firewall, and a VPN/ExpressRoute gateway — with production and nonproduction spoke virtual networks peered only to the hub, each spoke holding its own resource subnet of VMs. A cross-premises network on the left reaches the hub through the gateway, and Azure Monitor collects diagnostics from the hub services. Dotted lines mark which networks are connected or peered through the hub, rather than directly to each other.",
    sourceLabel: 'Microsoft Learn Azure Architecture Center: Hub-spoke network topology in Azure',
    sourceUrl: 'https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/networking/architecture/hub-spoke-content.md',
    product: 'Azure Architecture Center reference diagram',
  },
  vmLandingZoneBaseline: {
    src: 'images/az305-arch/vm-landing-zone-baseline.png',
    alt: 'Real Azure Architecture Center diagram of a VM-based workload deployed into an Azure landing zone',
    description: "An application landing zone subscription (top) holding the workload's own zone-redundant Application Gateway, frontend/backend VM scale sets spread across three availability zones, Key Vault, networking, and monitoring — plus a separate 'subscription vending' block of platform-provisioned resources (management group placement, spoke VNet, user-defined routes, policy and role assignments). Below it, a platform landing zone subscription owns the hub virtual network — Azure Firewall, Bastion, VPN, and ExpressRoute — that the spoke peers into, making explicit which resources the workload team owns versus what the central platform team provides.",
    sourceLabel: 'Microsoft Learn Azure Architecture Center: Azure landing zone baseline architecture for a VM workload',
    sourceUrl: 'https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/virtual-machines/baseline-landing-zone-content.md',
    product: 'Azure Architecture Center reference diagram',
  },
  computeDecisionTree: {
    src: 'images/az305-arch/compute-decision-tree.svg',
    alt: 'Real Azure Architecture Center decision tree diagram for choosing an Azure compute service',
    description: "A flowchart for picking a compute service: migrating a workload branches toward lift-and-shift VMs or, if it's already cloud-optimized or containerizable, toward App Service, Container Apps, AKS, or Red Hat OpenShift depending on how much orchestration control is needed; building new branches on whether full OS control, HPC, or event-driven short-lived processing is required before reaching the same container/PaaS/Functions choices. A separate box splits every option into container-exclusive versus container-compatible services.",
    sourceLabel: 'Microsoft Learn Azure Architecture Center: Choose an Azure compute service',
    sourceUrl: 'https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/guide/technology-choices/compute-decision-tree.md',
    product: 'Azure Architecture Center reference diagram',
  },
  loadBalancingDecisionTree: {
    src: 'images/az305-arch/load-balancing-decision-tree.png',
    alt: 'Real Azure Architecture Center decision tree diagram for choosing an Azure load-balancing service',
    description: "A flowchart branching first on internal vs. internet clients, then on whether traffic is layer 7 (HTTP/HTTPS) and whether the deployment spans multiple regions — routing to Azure Load Balancer or Application Gateway for single-region traffic, and to Front Door (with its built-in CDN) or Traffic Manager paired with Application Gateway for global, multi-region deployments.",
    sourceLabel: 'Microsoft Learn Azure Architecture Center: Load-balancing options in Azure',
    sourceUrl: 'https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/guide/technology-choices/load-balancing-overview.md',
    product: 'Azure Architecture Center reference diagram',
  },
  dataPartitioningHorizontal: {
    src: 'images/az305-arch/data-partitioning-horizontal.png',
    alt: 'Real Azure Architecture Center diagram illustrating horizontal data partitioning (sharding) by a partition key',
    description: "A single table of rows keyed A through Z gets split into two separate shards purely by key range — an 'A-G' shard holding the rows whose key starts A-G, and an 'H-Z' shard holding the rest — so each shard holds a distinct, non-overlapping slice of the same rows instead of one shard holding everything.",
    sourceLabel: 'Microsoft Learn Azure Architecture Center: Data partitioning guidance',
    sourceUrl: 'https://github.com/MicrosoftDocs/architecture-center/blob/main/docs/best-practices/data-partitioning-content.md',
    product: 'Azure Architecture Center reference diagram',
  },
  // DP-300 Azure SQL portal screenshot — sourced from the MicrosoftDocs/sql-docs
  // GitHub repo (its LICENSE file confirms the same CC BY 4.0 terms as
  // azure-docs, memdocs, and architecture-center above).
  sqlComputeUtilization: {
    src: 'images/azuresql/compute-utilization-metrics.png',
    alt: 'Real Azure Portal screenshot of an Azure SQL Database Overview page compute utilization metrics chart',
    description: "The Compute utilization chart from an Azure SQL Database's Overview page — CPU percentage, SQL instance CPU percentage, Data IO, Log IO, and Workers percentage all plotted together over time, with each metric's current value listed below its legend entry. This is the same kind of resource-ceiling data sys.dm_db_resource_stats reports via T-SQL, surfaced instead as an Azure Monitor metrics chart.",
    sourceLabel: 'Microsoft Learn: Monitor and tune Azure SQL Database using metrics and alerts',
    sourceUrl: 'https://github.com/MicrosoftDocs/sql-docs/blob/live/azure-sql/database/monitoring-metrics-alerts.md',
  },
  // AZ-802 Windows Admin Center / Failover Cluster Manager screenshot —
  // sourced from the MicrosoftDocs/windowsserverdocs GitHub repo, which is
  // also CC BY 4.0 licensed for its content (confirmed via its own LICENSE
  // file, same pattern as azure-docs and memdocs above). This is a real
  // Failover Cluster Manager console screenshot, not the Azure portal, so
  // `product` labels it accordingly.
  failoverClusterDrainRoles: {
    src: 'images/windowsadmincenter/failover-cluster-manager-drain-roles.png',
    alt: 'Real Failover Cluster Manager screenshot showing the Drain Roles action on a cluster node',
    description: "Failover Cluster Manager's Nodes view, right-clicking a node and choosing Pause → Drain Roles — exactly the step Cluster-Aware Updating automates across every node in turn: draining a node's roles onto the other nodes before it's patched and rebooted, then moving on to the next node once it rejoins.",
    sourceLabel: 'Microsoft Learn: Cluster operating system rolling upgrade',
    sourceUrl: 'https://github.com/MicrosoftDocs/windowsserverdocs/blob/main/WindowsServerDocs/failover-clustering/Cluster-Operating-System-Rolling-Upgrade.md',
    product: 'Failover Cluster Manager',
  },
  // SC-300 Privileged Identity Management screenshot — sourced from the
  // MicrosoftDocs/entra-docs GitHub repo, a Microsoft Docs repo carrying
  // the same CC BY 4.0 content license as azure-docs/memdocs above.
  pimActivateRole: {
    src: 'images/entra/pim-activate-role.png',
    alt: 'Real Microsoft Entra admin center screenshot of the PIM role activation panel',
    description: "The Activate panel for an eligible Microsoft Entra role (Privileged Role Administrator) opened from PIM's My roles list — the Duration (hours) slider capping how long the just-in-time activation lasts, and the required Reason field, with the banner above noting additional MFA verification is required before the request can proceed.",
    sourceLabel: 'Microsoft Learn: Activate Microsoft Entra roles in PIM',
    sourceUrl: 'https://github.com/MicrosoftDocs/entra-docs/blob/main/docs/id-governance/privileged-identity-management/pim-how-to-activate-role.yml',
    product: 'Microsoft Entra admin center',
  },
  // DP-900 screenshots. Sources: MicrosoftDocs/azure-docs (LICENSE = CC BY 4.0,
  // https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/LICENSE) and
  // MicrosoftDocs/sql-docs (LICENSE = CC BY 4.0, branch "live",
  // https://raw.githubusercontent.com/MicrosoftDocs/sql-docs/live/LICENSE).
  streamAnalyticsOutputJson: {
    src: 'images/data/stream-analytics-output-json.png',
    alt: 'Real Azure Portal screenshot of a blob opened in Edit view showing ten lines of JSON, each with messageId, deviceId, temperature, humidity and EventProcessedUtcTime fields',
    description: "The Edit tab of a blob in an Azure Storage container, with the JSON format selected. Ten numbered lines are shown, and each line is its own JSON object containing the field names messageId, deviceId, temperature, humidity and EventProcessedUtcTime followed by their values. The blob is the output file a Stream Analytics job wrote to blob storage.",
    sourceLabel: 'Microsoft Learn: Create a Stream Analytics Job using Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/stream-analytics/stream-analytics-quick-create-portal',
  },
  sqlQueryEditorJoin: {
    src: 'images/data/sql-query-editor-join.png',
    alt: 'Real Azure Portal screenshot of the Query editor for an Azure SQL database showing a SELECT TOP 20 join query and its results',
    description: "The Query editor (preview) page for a SQL database named mySampleDatabase. The query pane holds SELECT TOP 20 pc.Name as CategoryName, p.name as ProductName FROM SalesLT.ProductCategory pc JOIN SalesLT.Product p ON pc.productcategoryid = p.productcategoryid, and the Results pane lists CategoryName and ProductName columns with rows such as Road Frames, Helmets, Socks and Caps paired with product names. The Run button and Results tab are outlined in red.",
    sourceLabel: 'Microsoft Learn: Create a single database - Azure SQL Database',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/single-database-create-quickstart',
  },
  sqlCreateAdditionalSettings: {
    src: 'images/data/sql-create-additional-settings.png',
    alt: 'Real Azure Portal screenshot of the Additional settings tab of the Create SQL Database wizard with Sample selected',
    description: "The Additional settings tab of the Create SQL Database wizard. Under Data source, the Use existing data toggle offers None, Backup and Sample, with Sample selected and outlined in red, and the text AdventureWorksLT will be created as the sample database. Under Database collation, the page notes that collation cannot be changed after database creation and the Collation box shows SQL_Latin1_General_CP1_CI_AS. The Review + create button is outlined in red at the bottom.",
    sourceLabel: 'Microsoft Learn: Create a single database - Azure SQL Database',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/single-database-create-quickstart',
  },
  tableStorageAddEntity: {
    src: 'images/data/table-storage-add-entity.png',
    alt: 'Real Azure Portal screenshot of the Add entity dialog for an Azure Table storage table',
    description: "The Add entity dialog in Storage browser for an Azure Table storage table. It lists four properties with a Property Name, Type and Value for each: PartitionKey (String, mypartitionkey) and RowKey (String, myrowkey1), both greyed out, then LastName (String, Adams) and FirstName (String, Sam). An Add property button sits below the list, with Insert and Cancel buttons at the bottom.",
    sourceLabel: 'Microsoft Learn: Create a table in the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-quickstart-portal',
  },
  streamAnalyticsQuery: {
    src: 'images/data/stream-analytics-query.png',
    alt: 'Real Azure Portal screenshot of a Stream Analytics job Query page with a SELECT INTO FROM WHERE Temperature > 27 query',
    description: "The Query page of an Azure Stream Analytics job. The job topology pane lists Inputs (1) with IoTHubInput, Outputs (1) with BlobOutput, and Functions (0). The query editor shows four lines: SELECT *, INTO BlobOutput, FROM IoTHubInput, WHERE Temperature > 27. Below it, the Input preview pane shows a warning that no data was received from '2' partitions while sampling, and the toolbar shows a Job ready to start status.",
    sourceLabel: 'Microsoft Learn: Create a Stream Analytics Job using Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/stream-analytics/stream-analytics-quick-create-portal',
  },
  avdFilesEntraKerberos: {
    src: 'images/avd/azure-files-entra-kerberos.png',
    alt: 'Real Azure Portal screenshot of the Identity-based access page for an Azure Files storage account with the Microsoft Entra Kerberos pane open',
    description: 'The Identity-based access page of a storage account\'s file shares, used when FSLogix profile containers live on Azure Files. Step 1 lists three identity sources (Active Directory Domain Services, Microsoft Entra Domain Services, and Microsoft Entra Kerberos), all currently Disabled, with Set up highlighted under Microsoft Entra Kerberos. The Microsoft Entra Kerberos pane on the right has its checkbox ticked, a banner saying admin consent must be explicitly granted to the new Microsoft Entra ID application, and optional Domain name and Domain GUID fields for configuring directory- and file-level permissions through Windows File Explorer (not required if you use icacls). Step 2 below sets default share-level permissions, currently "Disable permissions and no access is allowed to file shares".',
    sourceLabel: 'Microsoft Learn: Microsoft Entra Kerberos Authentication for Azure Files',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-auth-hybrid-identities-enable',
  },
  avdFilesShareSettings: {
    src: 'images/avd/azure-files-share-settings.png',
    alt: 'Real Azure Portal screenshot of the File shares blade and File share settings for an Azure Files storage account',
    description: 'The File shares blade of a storage account that could host an FSLogix profile share. The File share settings strip shows Identity-based access: Not configured (highlighted), Default share-level permissions: Disabled, Soft delete: Disabled, Maximum capacity: 100 TiB, and Security: Maximum compatibility. One share, myfileshare, is listed with the Transaction optimized access tier and a 100 TiB quota.',
    sourceLabel: 'Microsoft Learn: Microsoft Entra Kerberos Authentication for Azure Files',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-auth-hybrid-identities-enable',
  },
  sentinelRuleScheduling: {
    src: 'images/defender/sentinel-rule-scheduling.png',
    alt: 'Real Microsoft Sentinel screenshot of the Analytics rule wizard Query scheduling, Alert threshold, Event grouping, and Suppression settings',
    description: 'The Analytics rule wizard step for a scheduled rule in Microsoft Sentinel (labelled "Azure Sentinel" in the screenshot): Query scheduling runs the query every 5 minutes with a lookup of the last 5 minutes, the alert threshold is "Is greater than" 0, Event grouping is set to "Group all events into a single alert" (the alternative is "Trigger an alert for each event"), and the Suppression toggle "Stop running query after alert is generated" is Off.',
    sourceLabel: 'Microsoft Learn: Configure security analytics for Azure Active Directory B2C data with Microsoft Sentinel',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-security-analytics-sentinel',
    product: 'Microsoft Sentinel',
  },
  sentinelAutomatedResponse: {
    src: 'images/defender/sentinel-automated-response.png',
    alt: 'Real Microsoft Sentinel screenshot of the Automated response tab of an analytics rule showing alert automation and incident automation',
    description: 'The Automated response tab when editing an existing scheduled rule named "B2C Non-successful logins". Alert automation says the selected playbook receives the alert as its input and that only playbooks configured with the alert trigger can be selected; it lists one playbook, new-inc-notification, with status Enabled. Incident automation (preview) says automation rules receive the incident as input, that only playbooks configured with the incident trigger can be called by automation rules, and its table shows "No automation rules".',
    sourceLabel: 'Microsoft Learn: Configure security analytics for Azure Active Directory B2C data with Microsoft Sentinel',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-security-analytics-sentinel',
    product: 'Microsoft Sentinel',
  },
  sentinelIncidentQueue: {
    src: 'images/defender/sentinel-incident-queue.png',
    alt: 'Real Microsoft Sentinel screenshot of the Incidents page with an incident list and a side panel for the selected incident',
    description: 'The Incidents page in Microsoft Sentinel: counters for open, new, and active incidents with an open-incidents-by-severity bar, a list filtered to Severity All and Status New, Active over the last 30 days, and a side panel for the selected incident showing its owner (Unassigned), status (New), severity (High), description, and Evidence counts of events, alerts, and bookmarks, with Entities and Tactics both at 0, a note about the investigation graph needing entities, and View full details and Actions buttons.',
    sourceLabel: 'Microsoft Learn: Configure security analytics for Azure Active Directory B2C data with Microsoft Sentinel',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-security-analytics-sentinel',
    product: 'Microsoft Sentinel',
  },
  sentinelIncidentDetails: {
    src: 'images/defender/sentinel-incident-details.png',
    alt: 'Real Microsoft Sentinel screenshot of the full incident page with timeline, evidence summary, and alert details pane',
    description: 'The full incident page in Microsoft Sentinel: the left pane shows owner, status, severity, description, an Evidence summary of events, alerts, and bookmarks, entity and tactic counts, an Incident Overview workbook link, and Investigate and Actions buttons. The main area has Timeline, Alerts, Bookmarks, Entities, and Comments tabs with one alert on the timeline, and an alert details pane whose Events entry offers a "Link to LA" link.',
    sourceLabel: 'Microsoft Learn: Configure security analytics for Azure Active Directory B2C data with Microsoft Sentinel',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-security-analytics-sentinel',
    product: 'Microsoft Sentinel',
  },
  sentinelLogsKql: {
    src: 'images/defender/sentinel-logs-kql.png',
    alt: 'Real Log Analytics screenshot of a KQL query against SigninLogs and its summarized results',
    description: 'A Log Analytics query window used with Microsoft Sentinel: a KQL query over SigninLogs that filters ResultType, summarizes a count by a 60-second time bin and UserPrincipalName, projects Count and UserPrincipalName, and keeps rows where Count is at least 1, with the Results tab below showing two rows with Count values 3 and 1 for a sample user address.',
    sourceLabel: 'Microsoft Learn: Configure security analytics for Azure Active Directory B2C data with Microsoft Sentinel',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/active-directory-b2c/configure-security-analytics-sentinel',
    product: 'Log Analytics in Microsoft Sentinel',
  },
  // Microsoft 365 admin center screenshots (AB-650) — sourced from the
  // MicrosoftDocs/microsoft-365-docs GitHub repo (public branch), whose
  // LICENSE is CC BY 4.0 (https://raw.githubusercontent.com/MicrosoftDocs/microsoft-365-docs/public/LICENSE).
  m365AdminCenterDashboard: {
    src: 'images/m365/m365-admin-center-dashboard.png',
    alt: 'Real Microsoft 365 admin center screenshot of the Home page in Dashboard view',
    description: 'The Microsoft 365 admin center Home page in Dashboard view, with quick actions (Add a user, Reset password, Add a group) and cards for Microsoft Teams, User management, Billing, Training, guides & assistance, and Microsoft 365 apps. The Teams card shows status lines such as "Teams is on for your organization" and "Guest access is on", and the Microsoft 365 apps card reports how many licensed users have installed the apps. The left navigation lists Home, Copilot, Users, Teams & groups, Marketplace, Billing and Setup, plus Customize navigation and Show all.',
    sourceLabel: 'Microsoft Learn: Add users and assign licenses in Microsoft 365',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/add-users/add-users',
    product: 'Microsoft 365 admin center',
  },
  m365UsageDashboard: {
    src: 'images/m365/m365-usage-dashboard.png',
    alt: 'Real Microsoft 365 admin center screenshot of the Usage dashboard overview',
    description: 'The Usage overview page in the Microsoft 365 admin center, showing an Active users trend chart for the past 30 days and summary cards such as Active users - Microsoft 365 Services, Active users - Microsoft 365 Apps, Email activity and Microsoft Teams activity, with OneDrive files, SharePoint files and Office activations cards below. A Product Reports list (Exchange, Forms, Microsoft Teams, OneDrive, SharePoint, Yammer and others) sits on the left, and the intro text states which reporting periods are available and how soon data appears.',
    sourceLabel: 'Microsoft Learn: Microsoft 365 admin center usage reports overview',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/activity-reports/activity-reports',
    product: 'Microsoft 365 admin center',
  },
  m365CompareAdminRoles: {
    src: 'images/m365/m365-compare-admin-roles.png',
    alt: 'Real Microsoft 365 admin center screenshot of the Compare roles permission table for Global admin and User admin',
    description: 'The Compare roles view in the Microsoft 365 admin center, listing permissions in rows with a green dot under each role that has them. Two roles are compared — Global admin ("Has unlimited access to all management features and most data in all admin centers") and User admin ("Resets user passwords, creates and manages users and groups, including filters, manages service requests, and monitors service health"). Admins use this to find the least permissive role that still grants the permissions a task needs.',
    sourceLabel: 'Microsoft Learn: Assign admin roles in the Microsoft 365 admin center',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/add-users/assign-admin-roles',
    product: 'Microsoft 365 admin center',
  },
  copilotAgentsDataAccess: {
    src: 'images/m365/copilot-agents-data-access.png',
    alt: 'Real Microsoft 365 admin center screenshot of Copilot Settings, Data access tab, with the Agents settings pane open',
    description: 'Copilot > Settings in the Microsoft 365 admin center with the Data access tab selected (listing Agents, Copilot in Power Platform and Dynamics 365, and Web search for Microsoft 365 Copilot and Microsoft 365 Copilot Chat) and the Agents pane open on the right. The pane notes that data processed by non-Microsoft services is not subject to Microsoft agreements, then offers "Choose who can access agents" (All users, No users, Specific users/groups) and two checkboxes for allowing apps and agents created by Microsoft and by external publishers.',
    sourceLabel: 'Microsoft Learn: Agents admin guide for Microsoft 365',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/m365-agents-admin-guide',
    product: 'Microsoft 365 admin center',
  },
  agentSharingSettings: {
    src: 'images/m365/agent-sharing-settings.png',
    alt: 'Real Microsoft 365 admin center screenshot of the agent Sharing settings pane',
    description: 'The Sharing pane under Agent settings in the Microsoft 365 admin center. It explains that only agents built with Copilot Studio Lite are available for sharing and that users restricted from sharing with the entire organization can still share their agents with individual users. The setting "Choose who has permission to share agents with your entire organization" offers three choices — allow all users, no users (but they can choose who they share agents with), or specific groups of users — with a search box for adding users or groups and a Save button.',
    sourceLabel: 'Microsoft Learn: Agent settings in Microsoft 365 admin center',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-settings',
    product: 'Microsoft 365 admin center',
  },
  agentRegistryOverview: {
    src: 'images/m365/agent-registry.png',
    alt: 'Real Microsoft 365 admin center screenshot of the All agents page, Registry tab',
    description: 'The All agents page in the Microsoft 365 admin center with the Registry tab selected (alongside Map and Requests). Summary tiles show Total agents, Agents without owners and Blocked agents; the toolbar offers Refresh, Export to Excel, Upload custom agent and Manage pinned agents; the filter bar shows Status, an active "Publisher: Microsoft" filter, Channel, Platform and Data source; and the table lists agents with Status, Platform, High Risks, Active users (30 days), Total sessions (30 days) and Date created columns.',
    sourceLabel: 'Microsoft Learn: Agent Registry in Microsoft 365 admin center',
    sourceUrl: 'https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-registry',
    product: 'Microsoft 365 admin center',
  },
  // SC-500 screenshots — sourced from MicrosoftDocs/azure-docs (identity ABAC,
  // Application Gateway WAF), MicrosoftDocs/azure-ai-docs (AI services
  // networking) and MicrosoftDocs/azure-monitor-docs (Log Analytics access
  // mode, Activity log). Each of those repos' own LICENSE file is
  // "Attribution 4.0 International" (CC BY 4.0) for content, confirmed via
  // https://raw.githubusercontent.com/MicrosoftDocs/<repo>/main/LICENSE.
  rbacConditionCode: {
    src: 'images/azuresec/rbac-condition-code-editor.png',
    alt: 'Real Azure Portal screenshot of the Add role assignment condition page showing a Storage Blob Data Reader condition in the code editor',
    description: "The Add role assignment condition page for a Storage Blob Data Reader role assignment with the Editor type set to Code. The condition text has two OR-ed parts: the first excludes the blob read action when the sub-operation is Blob.List, and the second compares a blob index tag named Project (the key is marked case-sensitive) using StringEqualsIgnoreCase against the value 'Cascade'.",
    sourceLabel: 'Microsoft Learn: Add or edit Azure role assignment conditions using the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/conditions-role-assignments-portal',
    product: 'Azure portal',
  },
  appGatewayWafConfigure: {
    src: 'images/azuresec/app-gateway-waf-configure.png',
    alt: 'Real Azure Portal screenshot of the Web application firewall Configure tab on an Application Gateway',
    description: "The Web application firewall blade of an Application Gateway named gw, on its Configure tab: the tier toggle (Standard V2 or WAF V2), the Firewall status toggle, the Firewall mode toggle (Detection or Prevention), an empty Exclusions table with Field, Operator and Selector columns, and the Global parameters for request body inspection, maximum request body size and file upload limit.",
    sourceLabel: 'Microsoft Learn: Create Web Application Firewall policies for Application Gateway',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/create-waf-policy-ag',
    product: 'Azure portal',
  },
  aiServicesNetworking: {
    src: 'images/azuresec/ai-services-networking.png',
    alt: 'Real Azure Portal screenshot of the Networking page for an Azure AI services resource, Firewalls and virtual networks tab',
    description: "The Networking page (Firewalls and virtual networks tab) of an Azure AI services resource named contoso-custom-vision. The Allow access from selector offers All networks, Selected Networks and Private Endpoints, or Disabled; below it are a Virtual networks table, a Firewall section with an address range box, and a second tab for Private endpoint connections.",
    sourceLabel: 'Microsoft Learn: Configure virtual networks for Foundry Tools',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-virtual-networks',
    product: 'Azure portal',
  },
  aiServicesNetworkAcls: {
    src: 'images/azuresec/ai-services-network-acls-json.png',
    alt: 'Real Azure Portal screenshot of the Resource JSON pane showing a networkAcls block',
    description: "A fragment of an Azure resource's Resource JSON pane showing its networkAcls property, a block of four settings that together express the resource's network firewall configuration.",
    sourceLabel: 'Microsoft Learn: Configure virtual networks for Foundry Tools',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-virtual-networks',
    product: 'Azure portal',
  },
  logAnalyticsAccessMode: {
    src: 'images/azuresec/log-analytics-access-control-mode.png',
    alt: 'Real Azure Portal screenshot of a Log Analytics workspace Overview page with the Access control mode field highlighted',
    description: "The Overview page of a Log Analytics workspace named CH1-LA. The Essentials section lists resource group, status, location, subscription, workspace name and ID, pricing tier, and an Access control mode field (highlighted with a red box). The left menu includes Access control (IAM), Tables, Data export and Network isolation.",
    sourceLabel: 'Microsoft Learn: Manage access to Log Analytics workspaces',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/manage-access',
    product: 'Azure portal',
  },
  monitorActivityLog: {
    src: 'images/azuresec/monitor-activity-log.png',
    alt: 'Real Azure Portal screenshot of the Azure Monitor Activity log list with filters and operation rows',
    description: "The Monitor - Activity log page: a toolbar (Edit columns, Refresh, Export to Event Hub, Download as CSV, Logs, Pin current filters, Reset filters), filter chips for management group, subscription, timespan and event severity, and a table of operations with Status, Time, Subscription and Event initiated by columns. The Settings section of the left menu includes Diagnostics settings.",
    sourceLabel: 'Microsoft Learn: Activity log in Azure Monitor',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/activity-log',
    product: 'Azure portal',
  },
  // DP-300 Azure SQL portal screenshots — sourced from the MicrosoftDocs/sql-docs
  // GitHub repo (branch `live`), whose LICENSE file is Creative Commons
  // Attribution 4.0 International (https://raw.githubusercontent.com/MicrosoftDocs/sql-docs/live/LICENSE).
  // Each image is embedded in the cited live Microsoft Learn article.
  sqlManagedInstanceCompute: {
    src: 'images/azuresql/managed-instance-compute-storage.png',
    alt: 'Real Azure Portal screenshot of the Basics tab of Create Azure SQL Managed Instance, with the Compute + storage summary and the Configure Managed Instance link highlighted',
    description: "The Basics tab of the Create Azure SQL Managed Instance page, with tabs for Basics, Networking, Security, Additional settings, Tags and Review + create. Under Managed Instance details the name is sql-mi-docs-sample and the region is (US) West US 2. The Compute + storage summary reads General Purpose, Standard-series (Gen 5), 8 vCores, 256 GB storage, Geo-redundant backup storage, zone redundancy disabled, followed by a highlighted Configure Managed Instance link that opens the page where those settings are changed.",
    sourceLabel: 'Microsoft Learn: Quickstart: Create Azure SQL Managed Instance',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/instance-create-quickstart?view=azuresql',
  },
  sqlAuditingSettings: {
    src: 'images/azuresql/auditing-settings.png',
    alt: 'Real Azure Portal screenshot of the Auditing settings blade for an Azure SQL database with Auditing set to ON and Storage and Log Analytics selected as destinations',
    description: "The Auditing blade for an Azure SQL database. The toolbar shows Save (highlighted), Discard, a greyed-out View audit logs and Feedback. A line reads Server-level Auditing: Disabled in red, with a View server settings link beside it. Below it the Auditing toggle is set to ON, and under Audit log destination (choose at least one) the Storage box is checked with storage details sqlaudit4, the Log Analytics box is checked with Log Analytics details oms-test4, and the Event Hub box is left unchecked.",
    sourceLabel: 'Microsoft Learn: Secure a Database (Azure SQL Database tutorial)',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/secure-database-tutorial?view=azuresql',
  },
  sqlQueryPerformanceInsight: {
    src: 'images/azuresql/query-performance-insight-top-queries.png',
    alt: 'Real Azure Portal screenshot of Query Performance Insight for a SQL database showing the top five resource-consuming queries by CPU with a per-query table of CPU, Data IO, Log IO, duration and executions',
    description: "Query Performance Insight for a SQL database named CRM Database, on the Resource consuming queries tab (the other tabs are Long running queries and Custom). The Top 5 queries by selector is set to CPU, Aggregation type is SUM and Time period is LAST 24 HRS. A stacked bar chart with a line for overall resource use sits above a Metrics comparison chart. The table at the bottom lists query IDs 151 to 155 with these columns: CPU[%] 51.97, 9.88, 7.15, 3.64, 3.59; Data IO[%] and Log IO[%] all 0; Duration[HH:MM:SS] 12:25:43.980, 02:22:07.459, 01:40:27.310, 00:51:20.70, 00:50:30.70; Executions count 6642, 1234, 1212, 615, 606.",
    sourceLabel: 'Microsoft Learn: Query Performance Insight for Azure SQL Database',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/query-performance-insight-use?view=azuresql',
  },
  sqlElasticJobExecutions: {
    src: 'images/azuresql/elastic-job-executions.png',
    alt: 'Real Azure Portal screenshot of the Most recent job executions table on an elastic job agent Overview page, showing nine succeeded runs of a job named t-sql Demo',
    description: "The Most recent job executions section of an elastic job agent's Overview page. A banner says the table shows the last 15 job executions, with a link to the Job executions view. Filters read Job name: All and Job execution status: All. Nine rows are listed, every one for a job named t-sql Demo with a Succeeded status. They start at about 9:00 AM, 10:00 AM and so on, hour by hour, up to about 5:00 PM on 4/2/2024, each finishing within a few seconds. A View all job executions button sits under the table.",
    sourceLabel: 'Microsoft Learn: Elastic Jobs Overview',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/elastic-jobs-overview?view=azuresql',
  },
  sqlFailoverGroupPage: {
    src: 'images/azuresql/failover-group-page.png',
    alt: 'Real Azure Portal screenshot of a failover group page for Azure SQL Database showing a world map, a Primary server in West US, a Secondary server in East US and a Customer managed failover policy',
    description: "The page for a failover group named failovergrouptutorial under mysqlserver | Failover groups. The toolbar has Save, Discard, Add databases, Edit configuration, Remove databases (these three outlined in red), Failover, Forced Failover and Delete. Tabs read Configuration details, Databases within group, Databases selected to be added (0) and Databases selected for removal (0). A world map joins two markers, one on the US west coast and one on the US east coast. The table underneath lists mysqlserver (West US) with role Primary and Read/Write failover policy Customer managed, and mysqlsecondary (East US) with role Secondary.",
    sourceLabel: 'Microsoft Learn: Configure a Failover Group (Azure SQL Database)',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/failover-group-configure-sql-db?view=azuresql',
  },
  sqlBackupRetentionPolicies: {
    src: 'images/azuresql/backup-retention-policies.png',
    alt: 'Real Azure Portal screenshot of a SQL server Backups blade on the Retention policies tab with the Configure policies pane open showing point-in-time restore retention of 7 days and a 24 hour differential backup frequency',
    description: "The Backups blade of a logical SQL server named contosohotels-acc-sqlserver, with Backups selected in the left menu (under Data management) and the Retention policies tab open. The grid lists a database named Test_Database_1 with PITR 7 Days and a differential backup frequency of 24 Hours. The Configure policies pane on the right shows Point-in-time-restore with the slider and box set to 7 days, Differential backup frequency set to 24 Hours, and a Long-term retention section whose Weekly LTR Backups and Monthly LTR Backups boxes both read 0 with Week(s) selected. Apply is greyed out and Cancel is available.",
    sourceLabel: 'Microsoft Learn: Change Automated Backup Settings (Azure SQL Database)',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/automated-backups-change-settings?view=azuresql',
  },
  // AZ-802 additional real screenshots. All are images embedded in live
  // Microsoft Learn articles whose source repos carry a CC BY 4.0 LICENSE
  // (MicrosoftDocs/windowsserverdocs, azure-docs, azure-monitor-docs; the
  // first line of each repo's LICENSE file reads "Attribution 4.0
  // International"). The Windows Admin Center and Windows LAPS images are not
  // the Azure portal, so `product` labels them accordingly.
  smsTransferMapping: {
    src: 'images/windowsadmincenter/storage-migration-service-transfer-mapping.png',
    alt: 'Real Windows Admin Center screenshot of the Storage Migration Service Transfer data step mapping source volumes and shares to a destination server',
    description: "Windows Admin Center's Storage Migration Service job named afstest2 on the Transfer data step, titled 'Specify the destination for' a source server. The Destination radio buttons offer 'Use an existing server or VM' (selected), 'Create a new Azure VM' and a choice not to transfer files; a destination device is entered with Browse and Scan. 'Map each source volume to a destination volume' lists source volumes C: and E: (both NTFS) mapped to destination volumes C: and E:, with available space of 35.6 GB and 12.6 GB, required space of 0 B and 1.82 GB, and an Azure File Sync column showing a Disabled check box for each. 'Select the shares to transfer' lists the SMB shares sales (C:\\sales, 0 B) and public (E:\\public, 1.82 GB), each with its Include check box ticked.",
    sourceLabel: 'Microsoft Learn: Migrate a file server by using Storage Migration Service',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/storage/storage-migration-service/migrate-data',
    product: 'Windows Admin Center',
  },
  smsCutoverConfig: {
    src: 'images/windowsadmincenter/storage-migration-service-cutover-config.png',
    alt: 'Real Windows Admin Center screenshot of the Storage Migration Service Cut over step configuring network adapters and the source rename',
    description: "Windows Admin Center's Storage Migration Service job afstest2 on the Cut over to the new servers step, titled 'Configure cutover from' a source server 'to' a destination server. The check boxes 'Include this device', 'Migrate network settings' and 'All network adapters migrated' are ticked. Source network adapters shows Local Area Connection 3 (Microsoft Hyper-V Network Adapter #3) with IP information beginning 10.0.0.202, labelled as a statically-assigned IP address, with a 'Use DHCP' check box ticked; Destination network adapters shows the adapter Ethernet selected, with IP information beginning 10.231.84.13. Below, 'Rename the source device after cutover' has 'Use randomly generated name' selected rather than 'Choose a new name'.",
    sourceLabel: 'Microsoft Learn: Migrate a file server by using Storage Migration Service',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/storage/storage-migration-service/migrate-data',
    product: 'Windows Admin Center',
  },
  wacVmMemorySettings: {
    src: 'images/windowsadmincenter/wac-vm-memory-settings.png',
    alt: 'Real Windows Admin Center screenshot of the Memory settings pane for a Hyper-V virtual machine',
    description: "Windows Admin Center (Hyper-Converged Cluster Manager) showing 'Settings for vm-test-1' with the Memory tab selected (tabs: General, Memory, Processors, Disks, Networks, Boot order, Checkpoints). Startup memory (GB) is 0.5, 'Enable dynamic memory' is ticked, Minimum memory (GB) is 0.5, Maximum memory (GB) is 1024, Memory buffer (%) is 20, and a Memory weight slider sits near the middle. The Save memory settings and Discard changes buttons are greyed out; Close is available.",
    sourceLabel: 'Microsoft Learn: Manage Virtual Machines with Windows Admin Center',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/manage/windows-admin-center/use/manage-virtual-machines',
    product: 'Windows Admin Center',
  },
  wacHyperVHostSettings: {
    src: 'images/windowsadmincenter/wac-hyper-v-host-settings.png',
    alt: 'Real Windows Admin Center screenshot of the Hyper-V host General settings including the hypervisor scheduler type',
    description: "Windows Admin Center (Hyper-Converged Cluster Manager) Settings page with the Hyper-V Host Settings group (General, Enhanced Session Mode, NUMA Spanning, Live Migration, Storage Migration) and General selected. A blue notice reads 'Any changes will be applied to all cluster nodes.' Fields show a default Virtual Hard Disks Path and Virtual Machines Path, each with a Browse button. Under Hypervisor Scheduler Type the radio buttons are 'Core Scheduler (Recommended)' and 'Classic Scheduler', with Classic Scheduler selected and an orange warning strongly recommending a switch to the core scheduler to protect SMT-enabled processors against side-channel security vulnerabilities, followed by a 'Restart the server to apply changes?' check box that is unticked.",
    sourceLabel: 'Microsoft Learn: Manage Virtual Machines with Windows Admin Center',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/manage/windows-admin-center/use/manage-virtual-machines',
    product: 'Windows Admin Center',
  },
  dnsResolverRulesetRules: {
    src: 'images/windowsadmincenter/dns-private-resolver-ruleset-rules.png',
    alt: 'Real Azure portal screenshot of the Rules page of an Azure DNS forwarding ruleset listing three forwarding rules',
    description: "The Azure portal page 'myruleset | Rules' for a DNS forwarding ruleset. Its text says domain name resolution requests are forwarded to the destination IP addresses in matching rules and that rules are prioritized by longest suffix match. Three rules are listed, all with rule state Enabled: AzurePrivate for azure.contoso.com. forwarding to 10.0.0.4:53, Internal for internal.contoso.com. forwarding to 10.1.0.5:53, and Wildcard for the root domain '.' forwarding to 10.5.5.5:53. The Settings menu includes Rules, Virtual Network Links and Outbound endpoints.",
    sourceLabel: 'Microsoft Learn: Quickstart - Create an Azure DNS Private Resolver using the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-get-started-portal',
  },
  dnsResolverRulesetLinks: {
    src: 'images/windowsadmincenter/dns-private-resolver-ruleset-vnet-links.png',
    alt: 'Real Azure portal screenshot of the Virtual Network Links page of an Azure DNS forwarding ruleset',
    description: "The Azure portal page 'myruleset | Virtual Network Links' for a DNS forwarding ruleset. Its text says virtual networks linked to this ruleset forward DNS requests according to matching rules, and that virtual networks can only be linked to a ruleset within the same region. Two links are listed in resource group myresourcegroup: myvnet-link for virtual network myvnet and myvnet2-link for virtual network myvnet2. The toolbar offers Add, Remove and Refresh.",
    sourceLabel: 'Microsoft Learn: Quickstart - Create an Azure DNS Private Resolver using the Azure portal',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/dns/dns-private-resolver-get-started-portal',
  },
  vmInsightsMapDependencies: {
    src: 'images/windowsadmincenter/vm-insights-map-dependencies.png',
    alt: 'Real Azure portal screenshot of the VM insights Map tab showing a virtual machine and its connected client and server-port groups',
    description: "The Azure portal 'ContosoWeb1 | Insights' page for a virtual machine with the Map tab selected and the time range 'Last 30 minutes as of 20 Mar 17:46'. In the centre is the ContosoWeb1 node (41 Processes). A client group of 18 Clients connects to it from the left. To the right are server-port groups: Port 53 (2 Servers), Port 443 (26 Servers), Port 3268 (1 Servers), Port 22 (1 Servers), Port 1433 (2 Servers) and Port 80 (2 Servers). The connection to the Port 22 group is drawn as a red dashed line while the others are solid grey. A separate group of 7 Clients sits at the top right. A right-hand strip offers Properties, Log Events, Alerts and Connections, and the left menu lists Backup, Disaster recovery, Update management, Insights and Alerts.",
    sourceLabel: 'Microsoft Learn: View app dependencies with VM insights',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/vm/vminsights-maps',
  },
  vmInsightsPerformanceDisks: {
    src: 'images/windowsadmincenter/vm-insights-performance-disks.png',
    alt: 'Real Azure portal screenshot of the VM insights Performance tab with performance insights and a logical disk performance table',
    description: "The Azure portal 'demoVM1 | Insights' page for a virtual machine with the Performance tab selected and the time range 'Last hour'. A 'Performance insights (14)' section has a 'Go to Performance Diagnostics' link, the text 'Run continuous or on-demand diagnostics', filters for Impact, Category and Diagnostic Type, and rows of Medium-impact CPU insights whose diagnostic type is Continuous. Below, 'Logical Disk Performance' lists drive C: (current size 126.45 GB, 37% used), drive D: (64 GB, 8% used) and a Total row (190.45 GB, 27% used) with P95 IOPs, throughput and latency columns, followed by a 'CPU Utilization %' chart with Avg, Min, 50th, 90th, 95th and Max buttons.",
    sourceLabel: 'Microsoft Learn: Analyze the health and status of your virtual machine with Azure Monitor',
    sourceUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/vm/vminsights-performance',
  },
  windowsLapsAdProperties: {
    src: 'images/windowsadmincenter/windows-laps-ad-properties-dialog.png',
    alt: 'Real Active Directory Users and Computers screenshot of the Windows LAPS tab in a computer object Properties dialog',
    description: "The 'LAPSAD2 Properties' dialog of a computer object in Active Directory Users and Computers with the LAPS tab selected (other tabs: General, Operating System, Member Of, Delegation, Location, Managed By, Dial-in). Under 'Local Administrator Password Solution' it shows the current LAPS password expiration (Sunday, July 31, 2022 1:35 PM), a date-time control to set a new expiration with an 'Expire now' button, the LAPS account name Administrator, the LAPS password masked with dots, and 'Copy password' and 'Show password' buttons. OK, Cancel, Apply and Help sit along the bottom, with Apply greyed out.",
    sourceLabel: 'Microsoft Learn: Set up Windows LAPS in the LAPS properties dialog',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-management-user-interface',
    product: 'Active Directory Users and Computers',
  },
  windowsLapsEventLog: {
    src: 'images/windowsadmincenter/windows-laps-event-viewer-password-update.png',
    alt: 'Real Event Viewer screenshot of the Windows LAPS Operational log with event 10018 selected',
    description: "Windows Event Viewer showing the LAPS > Operational log under Applications and Services Logs (number of events: 7). Information events from source LAPS appear in the list with event IDs 10004, 10020, 10018, 10014, 10009 and 10023; event 10018 is selected. Its General tab, outlined in red, reads 'LAPS successfully updated Active Directory with the new password.' The details show log name Microsoft-Windows-LAPS/Operational, source LAPS, event ID 10018, level Information, user SYSTEM and computer lapsAD2.laps.com.",
    sourceLabel: 'Microsoft Learn: Get started with Windows LAPS and Windows Server Active Directory',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-scenarios-windows-server-active-directory',
    product: 'Windows Event Viewer',
  },
};

// `hideDescription` is set by quiz/exam question views — the description
// spells out exactly what's in the image (tab names, field names), which
// would hand over the answer to a question asking about that same image.
// The lesson/study context wants the description shown; a question about
// the same screenshot doesn't.
function RealPortalScreenshot({ shot, hideDescription }) {
  if (!shot) return null;
  return (
    <div style={{ boxShadow: SHADOW.card, background: '#fff', border: `1px solid ${COLOR.border}`, borderRadius: '14px', padding: '8px', marginTop: '10px' }}>
      <img src={shot.src} alt={shot.alt} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
      {shot.description && !hideDescription && (
        <div style={{ fontSize: '11.5px', color: '#3A3140', marginTop: '8px', lineHeight: 1.5, padding: '0 4px' }}>
          {shot.description}
        </div>
      )}
      <div style={{ fontSize: '10px', color: COLOR.muted, marginTop: '8px', lineHeight: 1.4, padding: '0 4px' }}>
        Real {shot.product || 'Azure Portal'} screenshot — © Microsoft, licensed{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" style={{ color: COLOR.primary }}>CC BY 4.0</a>
        {' '}via{' '}
        <a href={shot.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: COLOR.primary }}>{shot.sourceLabel}</a>.
      </div>
    </div>
  );
}

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
  const wrapperRef = useRef(null);
  // Anchored under the trigger word via `left: 0` by default (see
  // TermFlyout), which overflows off the right edge of the screen for any
  // term close enough to the right margin — forcing a horizontal scroll to
  // read the rest of it. A simple left/right flip isn't enough on a narrow
  // phone screen, where a 280px-wide flyout can overflow the *other* edge
  // instead if the word sits mid-screen — so this measures the flyout's
  // actual rendered position and nudges it (via transform, not by
  // re-anchoring) by just enough to stay fully on screen, then moves the
  // little arrow the opposite amount so it still points at the real word
  // instead of drifting with the shifted box. Runs in useLayoutEffect
  // (before paint, not after) so the shift is never visible as a flash of
  // the wrong position first.
  const [pos, setPos] = useState({ shift: 0, arrowLeft: 14 });
  useLayoutEffect(() => {
    if (!isActive || !wrapperRef.current) return;
    const flyoutEl = wrapperRef.current.querySelector('.term-flyout');
    if (!flyoutEl) return;
    const MARGIN = 10;
    const rect = flyoutEl.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - MARGIN) {
      shift = (window.innerWidth - MARGIN) - rect.right;
    } else if (rect.left < MARGIN) {
      shift = MARGIN - rect.left;
    }
    const arrowLeft = Math.max(8, Math.min(14 - shift, rect.width - 18));
    setPos({ shift, arrowLeft });
  }, [isActive]);

  return (
    <span ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
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
      {isActive && <TermFlyout term={card} triggerText={text} onClose={onToggle} shift={pos.shift} arrowLeft={pos.arrowLeft} />}
    </span>
  );
}

/* ---------------- acronyms ---------------- */

// Acronym expansions (ACRONYMS, from data/acronyms.py) are shown inside every
// definition flyout, and an acronym used on its own in running text can be
// tapped to see what it stands for.
const ACRONYM_TOKEN_RE = /\b[A-Z][A-Za-z0-9]{1,7}\b/g;

// The dictionary key a token resolves to ('VMs' -> 'VM'), or null.
function acronymKey(token) {
  if (ACRONYMS[token]) return token;
  if (token.length > 2 && token.endsWith('s') && ACRONYMS[token.slice(0, -1)]) return token.slice(0, -1);
  return null;
}

function acronymExpansions(key) {
  const e = ACRONYMS[key];
  return e ? (Array.isArray(e.exp) ? e.exp : [e.exp]) : [];
}

// Each defined acronym in `text`, in order of first appearance.
function acronymsIn(text) {
  const out = [];
  (text || '').replace(ACRONYM_TOKEN_RE, (tok) => {
    const key = acronymKey(tok);
    if (key && !out.includes(key)) out.push(key);
    return tok;
  });
  return out;
}

const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const FLYOUT_FOOTER_ACRONYMS = 6;

// What a flyout should spell out: `lead` are the acronyms of the term itself
// (its title, or the acronym that was tapped), skipped when the title already
// spells them out ("Role-based access control (RBAC)"); `footer` are the other
// acronyms its definition and detail text use.
function flyoutAcronyms(term, triggerText) {
  const frontSquashed = squash(term.front || '');
  const spelledInFront = (key) => acronymExpansions(key).some((e) => frontSquashed.includes(squash(e)));
  const lead = [];
  const tappedKey = triggerText ? acronymKey(triggerText.trim()) : null;
  [tappedKey, ...acronymsIn(term.front)].forEach((k) => { if (k && !lead.includes(k) && !spelledInFront(k)) lead.push(k); });
  const footer = acronymsIn(`${term.back || ''} ${term.detail || ''}`)
    .filter((k) => !lead.includes(k) && !spelledInFront(k))
    .slice(0, FLYOUT_FOOTER_ACRONYMS);
  return { lead, footer };
}

/* ---------------- term matching ---------------- */

// How a flashcard can be referred to in running text, beyond its exact front:
// the front without a parenthetical ("Service Level Agreement (SLA)" ->
// "Service Level Agreement"), an acronym in parentheses ("SLA"), and the parts
// of a "A vs. B" comparison card. Lower priority number = stronger match, so
// when a block has more candidates than its cap, exact fronts win.
const PRI_FRONT = 1;
const PRI_PHRASE = 2;
const PRI_CARD_ACRONYM = 3;
const PRI_VS_PART = 4;
const PRI_ACRONYM_ONLY = 5;
const ACRONYM_ONLY_CAP = 3;

function frontAliases(front) {
  const phrases = [];
  const acronyms = [];
  const noParen = front.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const isVs = /\svs\.?\s/i.test(front);
  if (!isVs && noParen && noParen !== front) phrases.push({ text: noParen, pri: PRI_PHRASE });
  const re = /\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(front))) {
    const inner = m[1].trim();
    if (/^[A-Z][A-Za-z0-9/-]{1,9}$/.test(inner) && (inner.match(/[A-Z0-9]/g) || []).length >= 2) acronyms.push(inner);
  }
  if (isVs) {
    front.split(/\s+vs\.?\s+/i).forEach((part) => {
      const p = part.replace(/\s*\([^)]*\)/g, '').trim();
      // A single ordinary word ("Audit") would link far too many sentences.
      if (p.length >= 4 && (/\s/.test(p) || /[A-Z]/.test(p.slice(1)))) phrases.push({ text: p, pri: PRI_VS_PART });
    });
  }
  return { phrases, acronyms };
}

const TERM_INDEX_CACHE = new Map();

function getTermIndex(pool) {
  if (!pool.length) return null;
  const sig = [pool.length, pool[0].front, pool[pool.length >> 1].front, pool[pool.length - 1].front].join('|');
  const cached = TERM_INDEX_CACHE.get(sig);
  if (cached) return cached;
  const phrases = new Map();   // lowercase phrase -> { card, pri }
  const acronyms = new Map();  // acronym token -> { card, pri }
  const putPhrase = (text, card, pri) => {
    const k = text.toLowerCase();
    if (text.length >= 4 && (!phrases.has(k) || phrases.get(k).pri > pri)) phrases.set(k, { card, pri });
  };
  pool.forEach((card) => {
    if (!card.front) return;
    putPhrase(card.front, card, PRI_FRONT);
    const al = frontAliases(card.front);
    al.phrases.forEach((p) => putPhrase(p.text, card, p.pri));
    al.acronyms.forEach((t) => { if (!acronyms.has(t)) acronyms.set(t, { card, pri: PRI_CARD_ACRONYM }); });
  });
  Object.keys(ACRONYMS).forEach((t) => {
    if (ACRONYMS[t].trigger !== false && !acronyms.has(t)) acronyms.set(t, { card: null, pri: PRI_ACRONYM_ONLY });
  });
  const phraseKeys = [...phrases.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const acrKeys = [...acronyms.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const index = {
    phrases, acronyms,
    phraseRe: phraseKeys.length ? new RegExp('\\b(' + phraseKeys.join('|') + ')\\b', 'gi') : null,
    acrRe: acrKeys.length ? new RegExp('\\b(' + acrKeys.join('|') + ')s?\\b', 'g') : null,
  };
  if (TERM_INDEX_CACHE.size > 300) TERM_INDEX_CACHE.clear();
  TERM_INDEX_CACHE.set(sig, index);
  return index;
}

// Every place in `text` that names a card or a defined acronym, as
// { start, end, text, card, key, pri } spans (overlaps resolved, longest and
// earliest first). An acronym with no card of its own gets a small
// "acronymOnly" card that the flyout renders as just its expansion.
function findTermSpans(text, index) {
  if (!index) return [];
  const spans = [];
  if (index.phraseRe) {
    index.phraseRe.lastIndex = 0;
    let m;
    while ((m = index.phraseRe.exec(text))) {
      const hit = index.phrases.get(m[0].toLowerCase());
      if (hit) spans.push({ start: m.index, end: m.index + m[0].length, text: m[0], card: hit.card, key: 'c:' + hit.card.front.toLowerCase(), pri: hit.pri });
    }
  }
  if (index.acrRe) {
    index.acrRe.lastIndex = 0;
    let m;
    while ((m = index.acrRe.exec(text))) {
      const tok = index.acronyms.has(m[0]) ? m[0] : m[0].slice(0, -1);
      const hit = index.acronyms.get(tok);
      if (!hit) continue;
      const card = hit.card || { front: tok, back: '', acronymOnly: true };
      spans.push({ start: m.index, end: m.index + m[0].length, text: m[0], card, key: hit.card ? 'c:' + hit.card.front.toLowerCase() : 'a:' + tok, pri: hit.pri });
    }
  }
  spans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const out = [];
  let lastEnd = -1;
  spans.forEach((sp) => { if (sp.start >= lastEnd) { out.push(sp); lastEnd = sp.end; } });
  return out;
}

// The one place text becomes tappable terms. `curated` (a lesson's keyTerms)
// are always highlighted; automatic matches from `pool` are added on top, at
// most `maxTerms` distinct card terms plus a few acronym-only ones, preferring
// exact flashcard fronts over looser aliases when a block has more than that.
function renderGlossed(text, { curated, pool, activeKey, onToggle, maxTerms, blockId }) {
  if (!text) return text;
  const cap = maxTerms === 0 ? 0 : (maxTerms || 3);
  const spans = [];
  if (curated && curated.length) {
    const sorted = [...curated].sort((a, b) => b.length - a.length);
    const re = new RegExp('(' + sorted.map(escapeRegExp).join('|') + ')', 'g');
    let m;
    while ((m = re.exec(text))) {
      const card = pool && onToggle ? findTermCard(m[0], pool) : null;
      spans.push({ start: m.index, end: m.index + m[0].length, text: m[0], card, plain: !card, curated: true });
    }
  }
  let auto = [];
  if (pool && pool.length && onToggle && cap > 0) {
    const chosen = new Map();   // key -> best priority among its spans
    const all = findTermSpans(text, getTermIndex(pool));
    all.forEach((sp) => { if (!chosen.has(sp.key) || chosen.get(sp.key) > sp.pri) chosen.set(sp.key, sp.pri); });
    const curatedKeys = new Set(spans.filter((sp) => sp.card).map((sp) => 'c:' + sp.card.front.toLowerCase()));
    const firstAt = new Map();
    all.forEach((sp) => { if (!firstAt.has(sp.key)) firstAt.set(sp.key, sp.start); });
    const ranked = [...chosen.keys()].filter((k) => !curatedKeys.has(k)).sort((a, b) => chosen.get(a) - chosen.get(b) || firstAt.get(a) - firstAt.get(b));
    const keep = new Set();
    let cards = 0;
    let acr = 0;
    ranked.forEach((k) => {
      if (k.startsWith('a:')) { if (acr < ACRONYM_ONLY_CAP) { keep.add(k); acr += 1; } }
      else if (cards < cap) { keep.add(k); cards += 1; }
    });
    auto = all.filter((sp) => keep.has(sp.key));
  }
  const merged = [...spans, ...auto].sort((a, b) => a.start - b.start || (b.curated ? 1 : 0) - (a.curated ? 1 : 0) || (b.end - b.start) - (a.end - a.start));
  const out = [];
  let pos = 0;
  merged.forEach((sp) => {
    if (sp.start < pos) return;
    if (sp.start > pos) out.push(<React.Fragment key={'t' + pos}>{text.slice(pos, sp.start)}</React.Fragment>);
    if (sp.plain) {
      out.push(<span key={'p' + sp.start} style={{ color: COLOR.gold, fontWeight: 700 }}>{sp.text}</span>);
    } else {
      const key = (blockId || '') + ':' + sp.start;
      out.push(
        <TermTrigger key={'k' + sp.start} text={sp.text} card={sp.card} isActive={key === activeKey} onToggle={() => onToggle(key === activeKey ? null : key)} />
      );
    }
    pos = sp.end;
  });
  if (pos < text.length) out.push(<React.Fragment key={'t' + pos}>{text.slice(pos)}</React.Fragment>);
  return out;
}

// `activeKey`/`onToggle` let the caller track which single occurrence (if
// any) has its flyout open — `blockId` disambiguates occurrences across
// multiple calls in the same component (e.g. one call per paragraph).
function highlightTerms(text, terms, vocabPool, activeKey, onToggle, blockId) {
  if (!terms || !terms.length) return autoHighlightTerms(text, vocabPool, activeKey, onToggle, 2, blockId);
  return renderGlossed(text, { curated: terms, pool: vocabPool, activeKey, onToggle, maxTerms: 2, blockId });
}

// With no curated `keyTerms` to work from, scans a track's flashcards (fronts,
// aliases, and acronyms) for matches in `text` and makes them clickable, so
// every track gets term popouts for free (no per-question authoring needed).
function autoHighlightTerms(text, vocabPool, activeKey, onToggle, maxTerms, blockId) {
  return renderGlossed(text, { pool: vocabPool, activeKey, onToggle, maxTerms: maxTerms || 3, blockId });
}

// A self-contained glossed run of text for places that don't already manage
// an open-flyout state of their own (lesson sections, case studies, the cheat
// sheet, bridges): owns the open term, closes on Escape or an outside click,
// and closes whichever other GlossText flyout is open so only one shows.
let currentGlossClose = null;
function GlossText({ text, pool, max, blockId }) {
  const [active, setActiveRaw] = useState(null);
  const close = useCallback(() => setActiveRaw(null), []);
  const setActive = useCallback((key) => {
    if (key) {
      if (currentGlossClose && currentGlossClose !== close) currentGlossClose();
      currentGlossClose = close;
    } else if (currentGlossClose === close) {
      currentGlossClose = null;
    }
    setActiveRaw(key);
  }, [close]);
  useEffect(() => () => { if (currentGlossClose === close) currentGlossClose = null; }, [close]);
  useEscapeToClose(close);
  useClickOutsideToClose(!!active, close);
  return <React.Fragment>{autoHighlightTerms(text, pool, active, setActive, max, blockId || 'g')}</React.Fragment>;
}

