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
      {isActive && <TermFlyout term={card} onClose={onToggle} shift={pos.shift} arrowLeft={pos.arrowLeft} />}
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

