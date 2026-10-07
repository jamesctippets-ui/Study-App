"""Categories, flashcards, and quiz questions for Microsoft AZ-140: Configuring and Operating Microsoft Azure Virtual Desktop."""

CATEGORIES = [
    {'key': 'planInfra',
     'label': 'Plan and Implement an Azure Virtual Desktop Infrastructure',
     'marks': 45,
     'resources': [{'label': 'Microsoft Learn: Implement an Azure Virtual Desktop infrastructure',
                    'url': 'https://learn.microsoft.com/en-us/training/paths/implement-azure-virtual-infrastructure'}]},
    {'key': 'identitySecurity',
     'label': 'Plan and Implement Identity and Security',
     'marks': 18,
     'resources': [{'label': 'Microsoft Learn: Preparing for AZ-140 - Plan and implement identity and security',
                    'url': 'https://learn.microsoft.com/en-us/shows/exam-readiness-zone/preparing-for-az-140-plan-and-implement-identity-and-security'}],
     'screenshot': 'avdFilesEntraKerberos'},
    {'key': 'userEnvApps',
     'label': 'Plan and Implement User Environments and Apps',
     'marks': 24,
     'resources': [{'label': 'Microsoft Learn: Manage user environments and apps for Azure Virtual Desktop',
                    'url': 'https://learn.microsoft.com/en-us/training/paths/manage-user-environments-apps/'}],
     'screenshot': 'avdFilesShareSettings'},
    {'key': 'monitorMaintain',
     'label': 'Monitor and Maintain an Azure Virtual Desktop Infrastructure',
     'marks': 13,
     'resources': [{'label': 'Microsoft Learn: Monitor and maintain an Azure Virtual Desktop infrastructure',
                    'url': 'https://learn.microsoft.com/en-us/training/paths/monitor-maintain-azure-virtual-desktop-infrastructure/'}]},
]

FLASHCARDS = [
    {
        'id': 'f1',
        'cat': 'planInfra',
        'front': "Pooled vs. personal host pools",
        'back': "Pooled host pools let many users share multi-session session hosts, load-balanced by the pool. Personal host pools assign one user to one dedicated session host, either automatically or by direct assignment, much like a traditional VDI desktop.",
        'detail': "A personal host pool is the right fit when a user needs persistent local state or admin rights on their own VM; a pooled host pool with FSLogix is the standard choice for stateless, cost-efficient shared desktops.",
    },
    {
        'id': 'f2',
        'cat': 'planInfra',
        'front': "Breadth-first vs. depth-first load balancing",
        'back': "Breadth-first spreads new sessions evenly across all available session hosts in a pooled host pool. Depth-first fills one session host up to its configured maximum session limit before sending new sessions to the next host.",
        'detail': "Depth-first pairs naturally with autoscale, since it concentrates load onto fewer hosts and leaves other hosts empty and safe to deallocate; breadth-first favors performance by spreading load thin across more hosts.",
    },
    {
        'id': 'f3',
        'cat': 'planInfra',
        'front': "Automatic vs. direct assignment in a personal host pool",
        'back': "Automatic assignment lets Azure Virtual Desktop assign the first available session host to a user the first time they connect. Direct assignment has an admin manually assign a specific session host to a specific user ahead of time.",
        'detail': "Once a user is assigned, they always land on that same session host on every future connection, regardless of which assignment method put them there.",
    },
    {
        'id': 'f4',
        'cat': 'planInfra',
        'front': "Windows 11/10 Enterprise multi-session",
        'back': "A special SKU of Windows Enterprise, licensed for Azure Virtual Desktop, that lets multiple users run concurrent, isolated desktop sessions on a single virtual machine, something ordinary Windows client licensing does not permit.",
        'detail': "Multi-session is what makes pooled host pools cost-efficient; its licensing is tied to Azure Virtual Desktop scenarios, so it is not a general-purpose Windows client VM image you can use for any workload.",
    },
    {
        'id': 'f5',
        'cat': 'planInfra',
        'front': "Azure Compute Gallery for AVD images",
        'back': "A repository for storing, versioning, and sharing custom session host images across subscriptions and regions, replacing ad hoc managed image copies with replicated, versioned image definitions.",
        'detail': "Compute Gallery lets you stage a new image version, test it in a validation host pool, then roll it out, giving controlled, repeatable image lifecycle management instead of hand-built golden images.",
    },
    {
        'id': 'f6',
        'cat': 'planInfra',
        'front': "Workspaces, application groups, and host pools",
        'back': "A host pool is a collection of session hosts. An application group publishes either RemoteApp programs or a full Desktop from a host pool to users. A workspace is a logical container that groups application groups together for publishing to end users.",
        'detail': "Users subscribe to a workspace, which surfaces every application group (and therefore every host pool) assigned to them, in one feed.",
    },
    {
        'id': 'f7',
        'cat': 'planInfra',
        'front': "Mixing RemoteApp and Desktop app groups on one host pool",
        'back': "A pooled host pool can host multiple RemoteApp application groups, but Microsoft recommends not assigning the same users both a RemoteApp app group and a Desktop app group from the same host pool, since it causes duplicate icons and can be confusing for users.",
        'detail': "A personal host pool, by contrast, only supports a single Desktop application group, not RemoteApp groups.",
    },
    {
        'id': 'f8',
        'cat': 'planInfra',
        'front': "FSLogix Profile Containers",
        'back': "FSLogix stores a user's entire Windows profile inside a VHD/VHDX file on network storage, attached to the OS at sign-in, so the profile looks and behaves like a native local profile even though the user may land on a different session host every time.",
        'detail': "This is what makes a pooled, stateless multi-session host pool practical; without it, a user reconnecting to a different session host would see a brand-new, empty profile.",
    },
    {
        'id': 'f9',
        'cat': 'planInfra',
        'front': "FSLogix Cloud Cache",
        'back': "An FSLogix feature that writes profile changes to a local cache first and asynchronously replicates them to one or more configured storage locations (providers), giving redundancy and resilience if one storage location becomes unavailable.",
        'detail': "Cloud Cache can replicate across multiple storage providers in different regions, which standard Profile Containers pointed at a single file share cannot do on their own.",
    },
    {
        'id': 'f10',
        'cat': 'planInfra',
        'front': "MSIX app attach",
        'back': "Delivers applications packaged as MSIX from a network share, attaching them to a session host at user sign-in as a virtual disk, without installing the application into the OS image. The app appears in the Start menu but its files never touch the local disk.",
        'detail': "Because nothing is installed into the golden image, app updates just mean adding a new MSIX package version; session hosts and the master image stay untouched. Microsoft's current feature is simply called app attach (managed in the Azure portal, and it also handles App-V packages); the original standalone MSIX app attach feature was deprecated on June 1, 2025.",
    },
    {
        'id': 'f11',
        'cat': 'planInfra',
        'front': "Azure Files vs. Azure NetApp Files for FSLogix",
        'back': "Azure Files (Premium tier recommended) is the common, simpler choice for FSLogix profile storage at small-to-medium scale. Azure NetApp Files offers lower latency and higher IOPS/throughput, and is the recommended choice for large-scale or performance-sensitive deployments.",
        'detail': "Azure NetApp Files requires its own delegated subnet and capacity pool, which adds setup complexity that a straightforward Azure Files Premium share does not.",
    },
    {
        'id': 'f12',
        'cat': 'planInfra',
        'front': "RDP Shortpath",
        'back': "Establishes a direct UDP-based transport between the Remote Desktop client and the session host, bypassing the usual TCP relay through the Azure Virtual Desktop gateway, to reduce latency and improve responsiveness.",
        'detail': "RDP Shortpath for managed networks needs direct line-of-sight connectivity, such as a VPN or ExpressRoute, while RDP Shortpath for public networks uses STUN/TURN-based NAT traversal for clients anywhere on the internet.",
    },
    {
        'id': 'f13',
        'cat': 'planInfra',
        'front': "Planning for network bandwidth and latency",
        'back': "Round-trip time (RTT) between the client and the Azure region hosting the session host is the dominant factor in perceived responsiveness; Microsoft's Azure Virtual Desktop Experience Estimator tool helps assess expected experience for a given network path.",
        'detail': "As a rule of thumb, an RTT under roughly 150 ms gives a good interactive experience, while higher RTT increasingly degrades responsiveness regardless of raw bandwidth.",
    },
    {
        'id': 'f14',
        'cat': 'planInfra',
        'front': "Validation host pools",
        'back': "A host pool flagged with the 'Validation environment' setting receives Azure Virtual Desktop service updates before general availability, letting an organization test agent and service changes on a small, low-risk pool before they reach production host pools.",
        'detail': "This is purely a service/agent-update rollout ring; it has nothing to do with testing your own custom session host images, which is instead handled through Azure Compute Gallery image versions.",
    },
    {
        'id': 'f15',
        'cat': 'planInfra',
        'front': "VHD vs. VHDX for FSLogix containers",
        'back': "FSLogix can store profile and Office containers as either VHD or VHDX files. VHDX is the recommended default: it is more resilient to power failures and supports larger container sizes than the older VHD format.",
        'detail': "The container format is a per-configuration setting (VHDLocations plus a VHD/VHDX flag), not something the end user ever sees or manages.",
    },
    {
        'id': 'f16',
        'cat': 'identitySecurity',
        'front': "Microsoft Entra-joined vs. hybrid Entra-joined vs. AD DS-joined session hosts",
        'back': "A Microsoft Entra-joined session host is joined only to Entra ID and never to an AD DS domain, although its users can still be hybrid identities synced from on-premises AD. A hybrid Entra-joined host is joined to an on-premises AD DS domain that is synced to Entra ID. An AD DS-joined host is joined only to on-premises AD DS.",
        'detail': "Microsoft Entra-joined session hosts are the simplest to deploy since they need no domain join or line-of-sight to domain controllers, but FSLogix profiles on Azure Files for hybrid identities need extra configuration (Microsoft Entra Kerberos authentication on the storage account).",
    },
    {
        'id': 'f17',
        'cat': 'identitySecurity',
        'front': "Conditional Access for Azure Virtual Desktop",
        'back': "Conditional Access policies can target the Azure Virtual Desktop and Windows Cloud Login Microsoft Entra enterprise apps, requiring controls such as multi-factor authentication or a compliant device before a user can establish a remote session.",
        'detail': "The Azure Virtual Desktop app covers subscribing to the feed and authenticating to the gateway, while Windows Cloud Login covers the sign-in to the session host when single sign-on is enabled, so the two apps should generally be included in matching policies; a policy that targets only the first leaves the session host sign-in uncovered.",
    },
    {
        'id': 'f18',
        'cat': 'identitySecurity',
        'front': "Built-in Azure Virtual Desktop RBAC roles",
        'back': "Desktop Virtualization User lets a user access assigned application groups. Desktop Virtualization Contributor grants full management of Azure Virtual Desktop objects like host pools and app groups, but not the underlying VMs. Desktop Virtualization Virtual Machine Contributor manages the session host VMs themselves. Desktop Virtualization Session Host Operator views and removes session hosts and changes drain mode, while Desktop Virtualization User Session Operator sends messages to users, disconnects them, and logs them off.",
        'detail': "Desktop Virtualization Contributor alone cannot restart or resize a session host VM; that needs a VM-level role such as Virtual Machine Contributor on the VMs as well.",
    },
    {
        'id': 'f19',
        'cat': 'identitySecurity',
        'front': "Session host security baselines",
        'back': "Microsoft publishes security guidance for Azure Virtual Desktop session hosts, and Windows security baselines (available through Intune) cover settings like restricting drive/clipboard/printer redirection, disabling unneeded services, and hardening the RDP listener.",
        'detail': "Applying baseline settings through Group Policy (domain-joined hosts) or Microsoft Intune security baseline and settings catalog policies (Entra-joined hosts) is the recommended way to harden session hosts consistently at scale, rather than manually tweaking each image.",
    },
    {
        'id': 'f20',
        'cat': 'identitySecurity',
        'front': "Screen capture protection",
        'back': "An RDP property that blocks a remote session's content from being captured by screenshot tools or screen-sharing/recording applications on the client, protecting sensitive on-screen data such as clinical or financial records.",
        'detail': "It works by blacking out the session content whenever a capture attempt is detected, which also means any application relying on capturing the remote screen (like some remote-assistance tools) is blocked from doing so.",
    },
    {
        'id': 'f21',
        'cat': 'identitySecurity',
        'front': "Session watermarking",
        'back': "A control, configured on the session hosts through Intune or Group Policy, that overlays a QR code watermark across the remote desktop. The QR code encodes the session's connection ID (or the device ID in some personal-host-pool cases), which an admin can look up in Azure Virtual Desktop Insights or Log Analytics to trace a photo or leak back to a user and session host.",
        'detail': "Watermarking is a deterrent and tracing control, not a technical block; it works together with, not instead of, screen capture protection when strong data-exfiltration controls are required. Once it is enabled on a host, clients that do not support watermarking cannot connect to it.",
    },
    {
        'id': 'f22',
        'cat': 'identitySecurity',
        'front': "Least-privilege access on session hosts",
        'back': "End users should not be members of the local Administrators group on session hosts; day-to-day AVD access should flow through the Desktop Virtualization User role and app group assignment, keeping local admin rights reserved for a small set of trusted administrators.",
        'detail': "Because a pooled session host is shared by many users, giving any one user local admin rights risks that user affecting every other user sharing the same host.",
    },
    {
        'id': 'f23',
        'cat': 'userEnvApps',
        'front': "Configuring FSLogix (ADMX templates and registry)",
        'back': "FSLogix ships ADMX/ADML template files that add a 'FSLogix Profile Containers' node to Group Policy, letting admins configure settings like the VHD storage location(s), container size, and enabled state through GPO instead of editing the registry on every image.",
        'detail': "The same settings can equally be pushed as registry values through Microsoft Intune configuration profiles for session hosts that are not domain-joined to an on-premises AD.",
    },
    {
        'id': 'f24',
        'cat': 'userEnvApps',
        'front': "FSLogix Office Container vs. Profile Container",
        'back': "A Profile Container carries the entire user profile. An Office Container can optionally carry just Outlook (OST/search data) and OneDrive data separately, which is useful in a hybrid setup where the main profile stays local or on a different container while Office data still roams.",
        'detail': "Splitting Office data into its own container is mainly useful when profile size needs to be kept small or when Outlook cached-mode data would otherwise dominate the profile container.",
    },
    {
        'id': 'f25',
        'cat': 'userEnvApps',
        'front': "MSIX app attach: staging and de-staging",
        'back': "At sign-in, the MSIX app attach agent stages (mounts) the application's image and registers the app for that user; at sign-out, it de-stages (unmounts) it. The app is available for the duration of the session without ever being locally installed.",
        'detail': "Because staging happens at sign-in rather than at image build time, adding, updating, or removing an MSIX app attach application does not require touching or redeploying the session host golden image at all.",
    },
    {
        'id': 'f26',
        'cat': 'userEnvApps',
        'front': "FSLogix Application Masking",
        'back': "Hides specific applications, Start menu shortcuts, or file associations from specific users or groups on a shared multi-session image, without uninstalling the application. The app is still physically present but invisible to unauthorized users.",
        'detail': "Application Masking uses rule sets evaluated against Active Directory group membership, which is how one golden image can serve different departments each seeing only the apps licensed or relevant to them.",
    },
    {
        'id': 'f27',
        'cat': 'userEnvApps',
        'front': "Per-user Start menu and taskbar personalization",
        'back': "Windows multi-session supports per-user pinned Start menu tiles and taskbar icons that roam with the user's FSLogix profile container, so each user's customizations persist across sessions and session hosts instead of everyone sharing one fixed layout.",
        'detail': "Before this per-user taskbar capability, every user on a multi-session host shared a single, image-baked taskbar layout that no individual user could change.",
    },
    {
        'id': 'f28',
        'cat': 'userEnvApps',
        'front': "Installing language packs on a multi-session image",
        'back': "Language packs and Features on Demand must be added to the master (golden) image itself, typically via DISM against a language pack/FOD ISO, before the image is generalized and used to create session hosts. They are not installed per-user after deployment the way a desktop app would be.",
        'detail': "This is a common exam trap: language support has to be baked into the image ahead of time, unlike an MSIX-attached application which can be added dynamically per user.",
    },
    {
        'id': 'f29',
        'cat': 'userEnvApps',
        'front': "FSLogix Redirections.xml",
        'back': "An FSLogix configuration file that lets an admin explicitly exclude or redirect specific folders (like a large, disposable cache folder) out of the profile container, keeping the container smaller and sign-in faster.",
        'detail': "A common use is excluding folders such as browser caches or temp data that do not need to roam with the user and would otherwise bloat the profile container unnecessarily.",
    },
    {
        'id': 'f30',
        'cat': 'userEnvApps',
        'front': "User Profile Disks (UPD) vs. FSLogix Profile Containers",
        'back': "User Profile Disks were the older, RDS-era mechanism for a roaming per-user VHD profile. FSLogix Profile Containers are the modern, Microsoft-recommended replacement for Azure Virtual Desktop, offering finer-grained control, Cloud Cache redundancy, and better sign-in performance.",
        'detail': "Azure Virtual Desktop deployments today should use FSLogix Profile Containers, not User Profile Disks; UPD is considered legacy guidance from Remote Desktop Services on Windows Server.",
    },
    {
        'id': 'f31',
        'cat': 'userEnvApps',
        'front': "FSLogix at shared clinical (nursing-station) workstations",
        'back': "A hospital publishing a pooled multi-session desktop to shared nursing-station terminals can use FSLogix Profile Containers so that whichever terminal a clinician signs into, their desktop settings, pinned EHR shortcuts, and application state follow them automatically, without needing a personally assigned VM per clinician.",
        'detail': "This pattern avoids provisioning one expensive personal host pool VM per clinician when many clinicians only ever need a consistent, personalized session on whichever shared terminal happens to be free.",
    },
    {
        'id': 'f32',
        'cat': 'monitorMaintain',
        'front': "Azure Monitor for Azure Virtual Desktop",
        'back': "A purpose-built monitoring workbook and set of dashboards (now branded Azure Virtual Desktop Insights) that surfaces host pool, session host, and connection-level diagnostics, like connection failures, session host performance, and user session counts, by querying diagnostic data sent to a Log Analytics workspace.",
        'detail': "It requires diagnostic settings to actually be enabled on the AVD objects (host pools, workspaces, app groups) first; Azure Monitor for AVD has nothing to show until diagnostic data is flowing into a Log Analytics workspace.",
    },
    {
        'id': 'f33',
        'cat': 'monitorMaintain',
        'front': "AVD diagnostic settings and Log Analytics categories",
        'back': "Diagnostic settings on Azure Virtual Desktop objects can send categories like Checkpoint, Error, Management, Connection, HostRegistration, AgentHealthStatus, NetworkData, and SessionHostManagement logs to a Log Analytics workspace for querying and the Azure Monitor for AVD workbook.",
        'detail': "Connection and Error are typically the two most useful categories for day-to-day troubleshooting of failed or slow user sign-ins.",
    },
    {
        'id': 'f34',
        'cat': 'monitorMaintain',
        'front': "Autoscale scaling plans",
        'back': "A scaling plan defines schedules (ramp-up, peak, ramp-down, off-peak) that automatically start or deallocate session host VMs in a host pool based on time of day and current session load, reducing compute cost outside business hours.",
        'detail': "Autoscale works through the Azure Virtual Desktop service principal, which needs the Desktop Virtualization Power On Off Contributor role on the subscription or resource group holding the VMs before the plan can start and deallocate them.",
    },
    {
        'id': 'f35',
        'cat': 'monitorMaintain',
        'front': "Drain mode",
        'back': "Marking a session host as in drain mode prevents it from accepting any new user sessions while existing, already-connected sessions continue to run uninterrupted, used to safely empty a host before maintenance or patching.",
        'detail': "Drain mode alone does not sign out or disconnect existing users; an admin typically also needs to message and log off remaining users, or simply wait for them to disconnect naturally, before the host is fully idle.",
    },
    {
        'id': 'f36',
        'cat': 'monitorMaintain',
        'front': "Patching session hosts",
        'back': "Session hosts can be patched like any Azure VM, using Azure Update Manager, Microsoft Configuration Manager, or WSUS; a common pattern is to combine drain mode with scheduled patching windows, or to replace hosts entirely with a newly patched golden image rather than patching in place.",
        'detail': "Image-based replacement (deploy new session hosts from an updated Azure Compute Gallery image version, then remove the old hosts) avoids ever having user sessions running on a host mid-patch, at the cost of needing enough spare capacity to roll hosts in and out.",
    },
    {
        'id': 'f37',
        'cat': 'planInfra',
        'front': "Multimedia redirection (MMR)",
        'back': "Redirects video/audio playback processing from certain supported websites to the local client device instead of decoding it on the session host, cutting session host CPU load and improving playback smoothness for the user.",
        'detail': "This is a targeted fix for a specific bottleneck — media decoding load — distinct from the general connection-quality goal that RDP Shortpath addresses.",
    },
    {
        'id': 'f38',
        'cat': 'userEnvApps',
        'front': "Teams media optimization for AVD",
        'back': "Offloads Microsoft Teams call/meeting audio, video, and screen sharing to run directly on the client device (via the Teams AVD media optimization WebRTC redirector), instead of processing that media load on the shared session host.",
        'detail': "Without this optimization enabled, every Teams call on a multi-session host competes for the same shared session host CPU and network resources, which degrades quickly as the number of concurrent users grows.",
    },
    {
        'id': 'f39',
        'cat': 'planInfra',
        'front': "Azure Virtual Desktop vs. Windows 365 decision factors",
        'back': "AVD is a multi-session, admin-managed service billed by Azure consumption where IT controls host pool sizing, scaling, and multi-user density. Windows 365 Cloud PC is a fixed per-user, per-month priced dedicated Windows PC in the cloud with a simpler, pre-sized experience and no host pool or scaling plan to manage. Choose AVD for multi-session pooled economics and granular scaling control; choose Windows 365 for predictable per-user pricing and a simplified, dedicated PC.",
        'detail': "The two services share much of the same underlying remote-desktop technology, but a Windows 365 Cloud PC can never be pooled across multiple users or scaled the way an AVD host pool can, since it is always a fixed, dedicated, single-user VM.",
    },
    {
        'id': 'f40',
        'cat': 'planInfra',
        'front': "FSLogix profile container size limits",
        'back': "FSLogix profile containers default to a maximum size of 30 GB (the SizeInMBs setting) unless increased, and administrators should size containers based on realistic per-user profile growth rather than accepting the default blindly. The IsDynamic setting, recommended enabled, makes the VHD(X) grow only as data is actually written instead of pre-allocating its full configured size up front.",
        'detail': "A container sized too small silently fills up and can put a user into a temporary or read-only profile with no obvious sign-in error, so proactively monitoring container free space avoids a hard-to-diagnose 'why does this one user keep losing settings' ticket.",
    },
    {
        'id': 'f41',
        'cat': 'planInfra',
        'front': "Autoscale scale-out differs for personal vs. pooled host pools",
        'back': "On a pooled host pool, autoscale starts and deallocates existing session hosts to match a schedule and session load, using a capacity threshold and a minimum percentage of hosts. On a personal host pool, a scaling plan starts or deallocates the fixed set of dedicated VMs on a schedule or on disconnect/sign-out. In neither pool type does autoscale create or delete session hosts.",
        'detail': "Because a personal host pool's VM count never changes and each VM belongs to one user, 'scaling' there really just means power-state management (a personal scaling plan plus, optionally, Start VM on Connect), not the capacity-threshold behavior a pooled host pool gets.",
    },
    {
        'id': 'f42',
        'cat': 'planInfra',
        'front': "AVD control plane vs. data plane",
        'back': "The Azure Virtual Desktop control plane — Web Access, the Broker, Diagnostics, and the Gateway — is fully managed by Microsoft and runs in Microsoft's own subscription, at no infrastructure cost to the customer. The data plane — session host VMs, the virtual network, and FSLogix storage — runs in the customer's own Azure subscription, and that is the part the customer provisions, patches, and pays for.",
        'detail': "Because the control plane lives outside the customer's subscription and tenant boundary, a customer can never see or manage the Broker or Gateway directly in the portal; troubleshooting connection brokering issues means using AVD diagnostics and Log Analytics data, not inspecting a customer-owned resource.",
    },
    {
        'id': 'f43',
        'cat': 'planInfra',
        'front': "Session host VM sizing and capacity planning",
        'back': "Sizing session hosts starts from an expected user profile — light, medium, or heavy, based on the applications and multitasking typical for that user group — which Microsoft documents with recommended vCPU, RAM, and users-per-core ratios per profile; the Azure Virtual Desktop Experience Estimator and published sizing tables translate expected concurrent users and workload type into a specific VM SKU and session-per-host count.",
        'detail': "Under-sizing shows up as sluggish sessions under peak concurrent load even though the VM looks healthy at idle, so capacity planning should be validated against a pilot at real peak-hour concurrency, not just steady-state averages.",
    },
    {
        'id': 'f44',
        'cat': 'planInfra',
        'front': "Host pool maximum session limit",
        'back': "The max session limit setting on a pooled host pool caps how many concurrent user sessions any single session host in that pool will accept, working together with the load-balancing algorithm to decide when a host is considered full and new sessions should route elsewhere (breadth-first) or a new host should be brought online (depth-first with autoscale).",
        'detail': "Setting this limit too high for the VM's actual sizing overloads the host under peak load even though the pool still shows spare 'slots,' while setting it too low wastes capacity and forces autoscale to spin up more hosts than necessary.",
    },
    {
        'id': 'f45',
        'cat': 'planInfra',
        'front': "Azure Hybrid Benefit and cost optimization for session hosts",
        'back': "Azure Hybrid Benefit lets an organization apply an existing on-premises Windows Server license with Software Assurance toward session host compute cost, and Reserved Instances or Azure Savings Plans can further discount predictable VM compute, both targeting AVD's largest ongoing cost driver: the session host compute itself.",
        'detail': "Windows 10/11 multi-session VM compute is not eligible for the same per-core Hybrid Benefit discount that Windows Server workloads get, so on multi-session host pools the realistic savings levers are autoscale (avoid paying for idle capacity) and Reserved Instances/Savings Plans on compute, not Hybrid Benefit.",
    },
    {
        'id': 'f46',
        'cat': 'identitySecurity',
        'front': "Single sign-on (SSO) for AVD sessions",
        'back': "Azure Virtual Desktop can provide single sign-on so a user who already signed in with Windows Hello for Business, a FIDO2 key, or another passwordless method is not prompted for credentials again when connecting to a session host, using single sign-on with Microsoft Entra authentication, which is turned on with an RDP property on the host pool (older AD FS-based SSO is an alternative for AD FS environments).",
        'detail': "SSO is a host pool-level setting configured in addition to Conditional Access, and it specifically targets the second, in-session authentication prompt a user otherwise sees even after already completing MFA once to reach the feed — without it, users can be prompted for credentials twice for what feels like one sign-in.",
    },
    {
        'id': 'f47',
        'cat': 'identitySecurity',
        'front': "Desktop Virtualization Power On Off Contributor role",
        'back': "A built-in RBAC role that grants only the rights to start and stop (power on/off) session host VMs, without any broader Virtual Machine Contributor rights like resizing or deleting VMs; it is the role assigned to the Azure Virtual Desktop service principal so autoscale scaling plans can power hosts on and off on the customer's behalf. Start VM on Connect alone needs only the narrower Desktop Virtualization Power On Contributor role.",
        'detail': "Granting this narrower role instead of full Virtual Machine Contributor to the AVD service principal follows least privilege — the automation that starts and stops VMs for scaling has no ability to resize, delete, or reconfigure them.",
    },
    {
        'id': 'f48',
        'cat': 'identitySecurity',
        'front': "Restricting session host network exposure",
        'back': "Session hosts should have no public IP address and should never be directly reachable for inbound RDP from the internet; all user connections are brokered through the AVD Gateway over an outbound-only connection from the session host, so network security groups can safely deny all unsolicited inbound RDP while the reverse-connect transport the service needs still works.",
        'detail': "Because the session host always initiates an outbound connection to the AVD infrastructure rather than listening for inbound internet connections, admins do not need to open any inbound internet-facing RDP port on the session host's NSG at all — a common misconception carried over from traditional on-premises RDS deployments.",
    },
    {
        'id': 'f49',
        'cat': 'userEnvApps',
        'front': "Printer redirection in AVD sessions",
        'back': "The Remote Desktop Easy Print driver redirects a user's local, client-side printers into the remote session automatically without needing that specific printer's driver installed on the session host, while Universal Print, Microsoft's cloud-based print service, offers an alternative that routes print jobs through the cloud instead of relying on client-side printer redirection at all.",
        'detail': "Easy Print can be slow or fail with printers that have unusual custom drivers or many options, in which case installing the vendor driver directly on the golden image (true driver redirection) is the fallback, at the cost of having to keep that driver updated on the image.",
    },
    {
        'id': 'f50',
        'cat': 'userEnvApps',
        'front': "GPU-accelerated session hosts",
        'back': "For graphics-intensive workloads such as CAD, 3D modeling, or video editing, session hosts can run on Azure GPU-enabled VM sizes (such as the NV-series) with either GPU passthrough for a dedicated hardware GPU or GPU partitioning/vGPU for sharing one physical GPU across multiple session hosts, combined with an appropriate GPU driver installed in the image.",
        'detail': "A pooled multi-session host pool running heavy graphics workloads on a GPU-enabled SKU still shares that one GPU's capacity across every concurrent session on the host, so GPU-bound capacity planning matters just as much as vCPU/RAM sizing for this workload type.",
    },
    {
        'id': 'f51',
        'cat': 'userEnvApps',
        'front': "Deploying Win32 apps via Intune vs. MSIX app attach",
        'back': "Microsoft Intune can deploy traditional Win32 application installers to session hosts the same way it does to any managed Windows endpoint, installing the app directly into the OS the same for every user, whereas MSIX app attach dynamically attaches an MSIX-packaged app per user at sign-in with nothing installed into the OS. Intune Win32 deployment fits apps needed by every user of a host pool, while MSIX app attach fits apps assignable to specific users or groups without touching the image.",
        'detail': "An application that is not available as an MSIX package (many legacy line-of-business installers) has no MSIX app attach option at all, so Intune Win32 deployment or baking it into the golden image are the only realistic delivery paths for it.",
    },
    {
        'id': 'f52',
        'cat': 'userEnvApps',
        'front': "Enforcing a default Start menu/taskbar layout via Group Policy",
        'back': "A Start layout file exported from a reference machine (XML on Windows 10, JSON on Windows 11) can be imported through Group Policy or an Intune configuration profile to lock in a specific default set of pinned Start menu tiles and taskbar icons for every new user profile on a multi-session image, distinct from the per-user personalization that individual users can later customize and roam via FSLogix.",
        'detail': "A fully locked, non-customizable layout and a merely default, user-editable layout are two different GPO options — pushing a fully locked layout also blocks the per-user Start/taskbar personalization that FSLogix would otherwise roam for that user, so admins must choose one behavior or the other, not both.",
    },
    {
        'id': 'f53',
        'cat': 'monitorMaintain',
        'front': "Querying AVD connection data with KQL",
        'back': "The WVDConnections table in Log Analytics records each session's connection lifecycle (such as Started, Connected and Completed states) along with the user and client details, while WVDCheckpoints records the timestamped stages a connection passed through, letting an admin write a Kusto Query Language (KQL) query to pinpoint exactly which stage — client, gateway, broker, or session host — a specific failed or slow connection stalled at. Round-trip time and bandwidth estimates live in the separate WVDConnectionNetworkData table, joined by CorrelationId.",
        'detail': "Filtering WVDConnections by UserName or CorrelationId is the fastest way to trace one specific user's reported bad connection, rather than scanning the prebuilt Azure Monitor for AVD workbook visuals for an issue affecting only a single person.",
    },
    {
        'id': 'f54',
        'cat': 'monitorMaintain',
        'front': "Scheduled agent updates for session hosts",
        'back': "The Azure Virtual Desktop agent and side-by-side stack on session hosts update automatically by default, but the scheduled agent updates feature lets an admin define a specific maintenance window (day and time) during which those automatic updates are allowed to install, keeping unexpected agent restarts out of business hours.",
        'detail': "This controls only the AVD agent/side-by-side stack itself, not Windows OS updates or application patching, which still need to be managed separately through Azure Update Manager, WSUS, Configuration Manager, or golden-image replacement.",
    },
    {
        'id': 'f55',
        'cat': 'userEnvApps',
        'front': "Universal Print",
        'back': "Microsoft's cloud-based print service lets a printer register directly with Microsoft 365 instead of a traditional on-premises print server, and it can serve as an alternative to client printer redirection in AVD sessions when the Easy Print driver struggles with a printer's unusual custom options, or when there is no traditional print server available at all.",
        'detail': "Because cloud printing doesn't depend on client-side redirection or a matching driver being present on the session host, it sidesteps the exact Easy Print limitations that otherwise push an admin toward installing a vendor driver directly on the golden image instead.",
    },
    {
        'id': 'f56',
        'cat': 'monitorMaintain',
        'front': "Azure Monitor Agent (AMA) for session hosts",
        'back': "Azure Monitor Agent (AMA) is the agent installed on session host VMs that collects the performance counters and event logs behind the host panels of the Azure Virtual Desktop Insights workbook, sending them to a Log Analytics workspace according to a Data Collection Rule that defines exactly which counters and events are gathered and how often. Service-side AVD logs are separate and come from diagnostic settings.",
        'detail': "Enabling the AVD workbook without also deploying AMA and its data collection rule to every session host is a common reason the host panels show data for some hosts but stay empty for others — the workbook only ever displays what the agent actually ships to the workspace.",
    },
    {
        'id': 'f57',
        'cat': 'planInfra',
        'front': "FSLogix profile locking and the 'stuck on temp profile' symptom",
        'back': "A given FSLogix VHD(X) can only be mounted by one active session at a time, so a crashed or improperly disconnected session that never releases its lock leaves that same user's next sign-in unable to attach their real profile container file, silently dropping them into a temporary, unsaved local profile instead with no obvious error. Cloud Cache reduces exposure to a single storage location failing outright, but it does not remove this single-session lock behavior.",
        'detail': "Clearing a stuck lock usually means confirming the user has no other active or disconnected session anywhere in the host pool and, if needed, having an admin close the open file handle on the storage side before the next sign-in can mount the container normally.",
    },
    {
        'id': 'f58',
        'cat': 'planInfra',
        'front': "Azure Image Builder for session host images",
        'back': "A service that automates customizing and building a session host image through a repeatable template definition — installing applications, applying Windows updates, and running custom scripts — then distributing the finished image version to an Azure Compute Gallery, replacing a manual sysprep-and-capture workflow.",
        'detail': "Azure Image Builder handles the build-and-customize step; Azure Compute Gallery still handles the separate job of versioning, replicating, and sharing that finished image across regions and subscriptions.",
    },
    {
        'id': 'f59',
        'cat': 'planInfra',
        'front': "Network requirements for AVD service connectivity",
        'back': "Session hosts need outbound internet access, with no inbound rule required, to a defined set of Microsoft-owned FQDNs and the 'WindowsVirtualDesktop' NSG/Azure Firewall service tag, covering the Broker, Diagnostics, and agent traffic the session host depends on to register and stay healthy.",
        'detail': "This outbound-only requirement is the same reason locking down session host network exposure works at all — an NSG can safely deny all inbound RDP since nothing ever needs to reach the session host from outside.",
    },
    {
        'id': 'f60',
        'cat': 'planInfra',
        'front': "Business continuity and disaster recovery (BCDR) for AVD",
        'back': "Since the AVD control plane has no customer-facing failover to configure, BCDR for AVD means building redundancy into the data plane the customer owns: a host pool deployed in a secondary Azure region, a session host image replicated there via Azure Compute Gallery, and FSLogix storage replicated or duplicated across regions so the failover host pool has both a usable image and reachable profile storage.",
        'detail': "Because host pools in two regions are independent objects, users typically need to be reassigned to the secondary region's workspace during a failover, rather than an existing session silently moving itself.",
    },
    {
        'id': 'f61',
        'cat': 'planInfra',
        'front': "Start VM on Connect",
        'back': "A host pool setting that automatically powers on a deallocated session host the moment its assigned user attempts to connect, without a fixed scaling-plan schedule or manual admin action, fitting a host pool with unpredictable, occasional usage.",
        'detail': "It solves a different problem than scaling plans, which start hosts on a predetermined schedule rather than reactively, the instant a specific user tries to connect — and it is available on both personal and pooled host pools, not restricted to only one type.",
    },
    {
        'id': 'f62',
        'cat': 'identitySecurity',
        'front': "Virtual Machine User Login / Virtual Machine Administrator Login roles",
        'back': "Built-in Azure RBAC roles, separate from the Desktop Virtualization roles, that grant a user permission to actually sign in to a Microsoft Entra-joined Azure VM with their Entra credentials — Virtual Machine User Login for standard sign-in, Virtual Machine Administrator Login for local admin rights on that VM.",
        'detail': "Assigning a user the Desktop Virtualization User role without also assigning one of these VM login roles on an Entra-joined session host is a classic gap: the user can see and launch the published resource but is denied at the Windows sign-in screen itself.",
    },
    {
        'id': 'f63',
        'cat': 'identitySecurity',
        'front': "Conditional Access sign-in frequency for AVD sessions",
        'back': "A Conditional Access session control that forces a user to re-authenticate after a defined time interval, which can be added to Conditional Access policies for Azure Virtual Desktop, so a long-running AVD session periodically re-validates the user's identity rather than trusting one sign-in indefinitely. It is the one setting not simply mirrored between the two apps: the Every time option is supported only on Windows Cloud Login with single sign-on enabled.",
        'detail': "This complements, rather than replaces, single sign-on — SSO removes a redundant in-session prompt after a strong initial sign-in, while sign-in frequency decides how long that initial sign-in stays trusted before it must happen again.",
    },
    {
        'id': 'f64',
        'cat': 'identitySecurity',
        'front': "Custom RBAC roles for Azure Virtual Desktop",
        'back': "When none of the built-in AVD roles grant exactly the permissions needed, an administrator can define a custom Azure role scoped to specific Microsoft.DesktopVirtualization permissions, combining only the actions a particular team actually needs.",
        'detail': "This is most often used to carve out a narrower role than any built-in option provides, such as letting a team view host pool configuration without granting any of the write or delete actions Desktop Virtualization Contributor includes.",
    },
    {
        'id': 'f65',
        'cat': 'identitySecurity',
        'front': "Legacy per-user MFA vs. Conditional Access-based MFA for AVD",
        'back': "Legacy per-user multi-factor authentication, enabled directly on a user's account, applies MFA to that user everywhere with no ability to scope it to specific apps or conditions. Conditional Access is the modern, Microsoft-recommended approach instead, since it can be scoped by app, device compliance, location, or risk rather than being all-or-nothing.",
        'detail': "Per-user MFA enabled on an account applies on top of an organization's Conditional Access design, which is one reason Microsoft recommends moving entirely to Conditional Access-based MFA rather than mixing the two approaches.",
    },
    {'id': 'f66',
     'cat': 'userEnvApps',
     'front': 'MSIX app attach image formats: VHD, VHDX, and CIM',
     'back': 'App attach can stage an application image as a CIM (Composite Image File System, or CimFS), VHDX, '
             'or VHD file. CimFS mounts and unmounts faster and uses less CPU and memory than VHD or VHDX, but '
             'Microsoft recommends it only when the session hosts run Windows 11, and VHD is not recommended.',
     'detail': 'The image format is a packaging choice; users see the same app either way. A CIM image is '
               'several files (a .cim metadata file plus objectid_ and region_ data files), so copy the whole '
               'set to the share.'},
    {
        'id': 'f67',
        'cat': 'userEnvApps',
        'front': "OneDrive Known Folder Move (KFM) for AVD",
        'back': "Known Folder Move redirects a user's Desktop, Documents, and Pictures folders into OneDrive so that content syncs to the cloud, and on AVD it should be configured silently via Group Policy or Intune so every new session doesn't prompt the user to opt in manually.",
        'detail': "KFM and FSLogix Profile Containers are complementary, not competing: KFM syncs known folder content to OneDrive in the cloud, while the profile container still roams everything else about the user's Windows profile between session hosts.",
    },
    {
        'id': 'f68',
        'cat': 'userEnvApps',
        'front': "Browser-based multimedia redirection requirements",
        'back': "Multimedia redirection for browser content needs a host component installed on the session host plus the multimedia redirection extension in the supported browser (Microsoft Edge or Chrome) running in the session, and it requires the Windows desktop client on the user's device, so specific supported sites can have their video decoding offloaded to the client instead of the session host.",
        'detail': "Multimedia redirection and Teams media optimization both offload media processing to the client device, but they target different workloads — MMR covers specific supported websites' video playback, while Teams media optimization covers Teams call and meeting media specifically.",
    },
    {
        'id': 'f69',
        'cat': 'monitorMaintain',
        'front': "Scaling plan ramp-down: force logoff",
        'back': "A ramp-down phase setting inside scaling plans that, after a configured notification period, forcibly signs out any users still connected to a session host being deallocated, instead of waiting indefinitely for them to disconnect on their own.",
        'detail': "Leaving force logoff disabled is a common, easy-to-miss reason a host pool's overnight compute bill never actually drops to its expected minimum, since idle-but-still-connected sessions keep blocking affected hosts from ever reaching zero users.",
    },
    {
        'id': 'f70',
        'cat': 'monitorMaintain',
        'front': "Session host status values",
        'back': "Each session host in a host pool reports a status such as Available (healthy and accepting sessions), Needs Assistance (registered but reporting an agent or health problem), Unavailable (not reachable or not registered), or Upgrading (agent update in progress), visible on the host pool's Session Hosts page.",
        'detail': "Needs Assistance is the status worth investigating first during troubleshooting, since it specifically flags a host that is still registered with the service but reporting some kind of agent or health issue, rather than one that's simply offline.",
    },
    {
        'id': 'f71',
        'cat': 'monitorMaintain',
        'front': "FSLogix Apps Operational event log",
        'back': "FSLogix writes its own detailed profile-load events to the FSLogix Apps Operational log, under Applications and Services Logs in Event Viewer on the session host — the first place to check for the specific error behind a failed or slow sign-in, including a locked container that leaves a user stuck on a temporary profile.",
        'detail': "Because this log lives locally on the session host rather than in Log Analytics by default, diagnosing a single user's bad FSLogix sign-in usually means connecting to the specific session host they landed on and reading this log directly, unless it has separately been configured to ship to Log Analytics.",
    },
    {
        'id': 'f72',
        'cat': 'monitorMaintain',
        'front': "Scaling plan schedules for weekdays vs. weekends",
        'back': "A single scaling plan can define more than one schedule, each assigned to a specific set of days, letting an admin give weekdays an aggressive ramp-up/peak/ramp-down pattern for business-hours demand while weekends use a much lighter schedule, or no ramp-up at all, instead of forcing one schedule to fit every day.",
        'detail': "Each schedule within the plan still configures its own ramp-up, peak, ramp-down, and off-peak phases independently, so weekday and weekend behavior can differ completely even though both live inside the same scaling plan object.",
    },
    {
        'id': 'f73',
        'cat': "planInfra",
        'front': "Reverse connect transport",
        'back': "The connection model Azure Virtual Desktop uses by default: the session host's agent opens an outbound connection to the AVD service, and the user's session is joined to it through the gateway. The host needs no inbound ports or public IP address, and RDP Shortpath UDP is layered on top of it.",
        'detail': "Reverse connect is why denying all inbound traffic to session hosts works. If RDP Shortpath cannot form a direct UDP path, the session simply keeps using reverse connect, so Shortpath never replaces it.",
    },
    {
        'id': 'f74',
        'cat': "planInfra",
        'front': "Session Traversal Utilities for NAT (STUN)",
        'back': "A protocol that lets a client behind a NAT device discover its public IP address and port. RDP Shortpath for public networks uses STUN to find these endpoints and try a direct UDP connection between the client and the session host.",
        'detail': "STUN servers use UDP port 3478, so hosts need outbound UDP rather than a public IP address. If the direct path fails, a TURN relay is tried, and then the connection falls back to reverse connect.",
    },
    {
        'id': 'f75',
        'cat': "planInfra",
        'front': "Traversal Using Relays around NAT (TURN)",
        'back': "A protocol that relays UDP traffic through an intermediary server when a direct path between two endpoints cannot be formed because of NAT or firewall rules. RDP Shortpath for public networks can use a TURN relay as the fallback after a direct STUN attempt.",
        'detail': "A relayed path adds some latency compared with a direct STUN path, but it is still UDP, so it generally beats the TCP path through the gateway. Firewalls must allow the published relay address ranges.",
    },
    {
        'id': 'f76',
        'cat': "planInfra",
        'front': "Azure Private Link for Azure Virtual Desktop",
        'back': "Uses private endpoints so traffic between clients, session hosts, and the AVD service travels over private IP addresses in your virtual network instead of public endpoints. It uses one private endpoint per host pool, one per workspace for feed download, and a single one for initial feed discovery.",
        'detail': "Private Link moves service endpoints onto private IPs but does not create the direct UDP data path that RDP Shortpath provides. Plan private DNS zones too, so names resolve to the private addresses.",
    },
    {
        'id': 'f77',
        'cat': "planInfra",
        'front': "Session host",
        'back': "A virtual machine registered to a host pool that runs the AVD agent and side-by-side stack, and on which users' desktop or RemoteApp sessions actually run. Pooled hosts run multi-session Windows; personal hosts are assigned to one user.",
        'detail': "Session hosts live in your subscription, so you size, patch, secure, and pay for them. They register with the service using a host pool registration key, which is short-lived.",
    },
    {
        'id': 'f78',
        'cat': "planInfra",
        'front': "Remote Desktop Protocol (RDP)",
        'back': "Microsoft's remote-display protocol that carries a session's screen, keyboard and mouse input, audio, clipboard, and device redirection between client and host. AVD runs RDP over a TCP reverse connect transport, and over UDP when RDP Shortpath is available.",
        'detail': "Host pool RDP properties switch protocol features such as drive, clipboard, and camera redirection on or off. Changes take effect at the user's next connection.",
    },
    {
        'id': 'f79',
        'cat': "planInfra",
        'front': "RDP properties",
        'back': "Settings on a host pool, set in the portal's RDP Properties tab or as a custom property string, that control how connections behave: which devices redirect (clipboard, drives, printers, camera), display and multi-monitor options, and features such as single sign-on and screen capture protection.",
        'detail': "They apply to every user of the host pool's application groups and take effect at the next connection. Turning off clipboard or drive redirection here is a data-loss control.",
    },
    {
        'id': 'f80',
        'cat': "planInfra",
        'front': "Azure Virtual Desktop agent and side-by-side stack",
        'back': "The Remote Desktop Agent registers a session host with the AVD service and brokers connections to it, and the side-by-side stack is the RDP stack that lets multiple remote sessions run. Both are installed on every session host and update automatically by default.",
        'detail': "Their health reports drive session host status values such as Available or Needs Assistance. Scheduled agent updates control only when these components update, not Windows updates.",
    },
    {
        'id': 'f81',
        'cat': "planInfra",
        'front': "Golden image (master image)",
        'back': "A reference VM configured once with the operating system, applications, and settings, then generalized with Sysprep and captured as an image so every session host deployed from it is identical. Versions are usually stored in an Azure Compute Gallery.",
        'detail': "Install apps machine-wide and run Sysprep before capture, or deployed hosts end up with duplicate identities. Azure Image Builder can automate building and updating the image.",
    },
    {
        'id': 'f82',
        'cat': "planInfra",
        'front': "Licensing for Azure Virtual Desktop",
        'back': "Each user needs an eligible license: Microsoft 365 E3, E5, A3, A5, F3, or Business Premium, or Windows Enterprise E3 or E5, Education A3 or A5, or Windows VDA per user, for Windows client desktops. Windows Server session hosts need Remote Desktop Services licenses with Software Assurance, or RDS user subscription licenses.",
        'detail': "These licenses cover user access rights only; you still pay Azure consumption for VMs, disks, and storage. Microsoft 365 Business Basic or Microsoft 365 Apps alone do not entitle a user to Windows desktops.",
    },
    {
        'id': 'f83',
        'cat': "planInfra",
        'front': "Server Message Block (SMB)",
        'back': "The network file-sharing protocol, on TCP port 445, that session hosts use to reach FSLogix profile storage and MSIX app attach images on Azure Files or Azure NetApp Files. FSLogix needs SMB access to mount each user's VHD or VHDX.",
        'detail': "Blocked outbound traffic on port 445 from the session host subnet to the storage is a common cause of profile mount failures and temporary profiles.",
    },
    {
        'id': 'f84',
        'cat': "planInfra",
        'front': "Delegated subnet (Azure NetApp Files)",
        'back': "A dedicated subnet delegated to the Microsoft.NetApp/volumes service, which Azure NetApp Files requires for its volumes' network interfaces. Only one subnet per virtual network can be delegated to it, and the subnet cannot hold other kinds of resources.",
        'detail': "Session hosts do not have to sit in the delegated subnet; they only need network reachability to it, for example from the same or a peered VNet.",
    },
    {
        'id': 'f85',
        'cat': "planInfra",
        'front': "Capacity pool (Azure NetApp Files)",
        'back': "The block of provisioned storage, with a chosen service level such as Standard, Premium, or Ultra, from which Azure NetApp Files volumes are carved. Each volume's size counts against its pool, and the pool must exist before volumes can be created.",
        'detail': "You pay for the provisioned pool capacity rather than only the data used, so right-size it for the FSLogix containers. The service level determines the throughput available per tebibyte.",
    },
    {
        'id': 'f86',
        'cat': "identitySecurity",
        'front': "Microsoft Entra ID",
        'back': "Microsoft's cloud identity service, formerly Azure Active Directory. Azure Virtual Desktop authorizes users through it and assigns application groups to Entra identities, so users must exist there, either cloud-only or synchronized from on-premises AD DS.",
        'detail': "How session hosts are joined does not change this. Domain join only affects how the hosts authenticate users after they connect.",
    },
    {
        'id': 'f87',
        'cat': "identitySecurity",
        'front': "Microsoft Entra Connect",
        'back': "A synchronization tool that copies users and groups, and optionally password hashes, from on-premises AD DS into Microsoft Entra ID, producing hybrid identities. Microsoft Entra Cloud Sync is a lighter, cloud-managed alternative.",
        'detail': "AVD needs AD DS users synchronized before they can be assigned to application groups, even when the session hosts are only Microsoft Entra-joined.",
    },
    {
        'id': 'f88',
        'cat': "identitySecurity",
        'front': "Microsoft Entra Domain Services (Microsoft Entra DS)",
        'back': "A managed AD DS domain in Azure whose domain controllers Microsoft runs, offering Kerberos, NTLM, and Group Policy. AVD session hosts can join this managed domain when there are no on-premises or IaaS domain controllers.",
        'detail': "Identities sync one way from Microsoft Entra ID. Choosing it assumes hosts join that managed domain, and it is not a prerequisite for Microsoft Entra Kerberos on Azure Files.",
    },
    {
        'id': 'f89',
        'cat': "identitySecurity",
        'front': "Microsoft Entra Kerberos authentication for Azure Files",
        'back': "Lets hybrid user identities reach an Azure Files share over SMB using Kerberos tickets issued by Microsoft Entra ID, with no line of sight to domain controllers. Microsoft Entra-joined session hosts can then mount FSLogix profile shares.",
        'detail': "After enabling it on the storage account, grant admin consent to the new app registration, then set the share-level permissions. It is meant for hybrid identities that exist in both on-premises AD and Entra ID.",
    },
    {
        'id': 'f90',
        'cat': "identitySecurity",
        'front': "Identity source (Azure Files)",
        'back': "Azure Files authenticates SMB access with Kerberos from one identity source per storage account: on-premises AD DS, Microsoft Entra Domain Services, or Microsoft Entra Kerberos for hybrid identities. The right choice depends on how session hosts are joined and whether they can reach domain controllers.",
        'detail': "Entra Kerberos suits Entra-joined hosts with no domain controller access, AD DS suits domain-joined hosts that can reach them, and Entra Domain Services suits hosts in that managed domain.",
    },
    {
        'id': 'f91',
        'cat': "identitySecurity",
        'front': "Share-level permissions (Azure Files)",
        'back': "Azure RBAC roles that control who can mount an Azure Files share over SMB. They are the first of two layers, with NTFS permissions on folders and files as the second. A default share-level permission can apply to all authenticated users, or roles can be assigned to users and groups.",
        'detail': "Both layers must allow access. A missing share-level role gives 'Access is denied' even when NTFS permissions are correct, and clinicians or other users end up on temporary profiles.",
    },
    {
        'id': 'f92',
        'cat': "identitySecurity",
        'front': "Storage File Data SMB Share Contributor",
        'back': "A built-in Azure role that grants read, write, and delete access to files and directories in an Azure Files share over SMB. The Elevated Contributor variant additionally lets a user change NTFS permissions.",
        'detail': "Assign it to the users' group on the share or storage account so FSLogix can create and write profile containers. Storage Blob Data Contributor and Storage Account Contributor do not give access to file share data.",
    },
    {
        'id': 'f93',
        'cat': "identitySecurity",
        'front': "Windows LAPS (Local Administrator Password Solution)",
        'back': "Windows LAPS automatically randomizes and rotates each device's local administrator password and backs it up to Microsoft Entra ID or Active Directory. It is built into current Windows and replaces the older Microsoft LAPS.",
        'detail': "Microsoft Entra-joined session hosts with no AD DS use the Entra ID backup, deployed through an Intune policy, because legacy LAPS can only store passwords in Active Directory.",
    },
    {
        'id': 'f94',
        'cat': "identitySecurity",
        'front': "Windows Hello for Business",
        'back': "A passwordless sign-in method that replaces a password with a key bound to the device and unlocked by a PIN or biometric. The private key stays in the device's TPM when one is available, which makes the credential phishing-resistant and multifactor by design.",
        'detail': "A user who signed in to the AVD feed with Hello for Business is still prompted again at the session host unless single sign-on is enabled in the host pool's RDP properties.",
    },
    {
        'id': 'f95',
        'cat': "identitySecurity",
        'front': "Compliant device (Intune device compliance)",
        'back': "A device that meets the compliance rules defined in Microsoft Intune, such as disk encryption, a minimum OS version, or a required security state, and is therefore marked compliant in Microsoft Entra ID. Conditional Access can require a compliant device as a grant control.",
        'detail': "For AVD, requiring MFA or a compliant device lets you challenge only unmanaged or non-compliant client devices instead of every user on every sign-in.",
    },
    {
        'id': 'f96',
        'cat': "identitySecurity",
        'front': "Role-based access control (RBAC)",
        'back': "Azure RBAC grants access by assigning a role to a user, group, or service principal at a scope such as a subscription, resource group, or resource. AVD uses several layers of it: Desktop Virtualization roles for AVD objects, VM login roles for sign-in, and storage roles for file data.",
        'detail': "A user can hold the right Desktop Virtualization role and still fail at the VM login or the file share, so check each layer separately when troubleshooting access.",
    },
    {
        'id': 'f97',
        'cat': "userEnvApps",
        'front': "Microsoft Intune",
        'back': "Microsoft's cloud endpoint management service for configuring, securing, and deploying apps to devices. For AVD it manages Microsoft Entra-joined session hosts through settings catalog and security baseline policies, Win32 app deployment, and device compliance.",
        'detail': "Domain Group Policy cannot reach Entra-joined hosts that have no domain, so Intune policies are how you continuously enforce settings such as session watermarking on them.",
    },
    {
        'id': 'f98',
        'cat': "userEnvApps",
        'front': "Drive redirection",
        'back': "An RDP feature that exposes the client's local drives inside the remote session so users can copy files between the two. It is controlled by a host pool RDP property or by policy, and can be turned off to stop data being copied out.",
        'detail': "Disabling drive and clipboard redirection are real data-loss controls, but neither stops someone photographing the screen. That needs session watermarking and screen capture protection.",
    },
    {
        'id': 'f99',
        'cat': "userEnvApps",
        'front': "Clipboard redirection",
        'back': "An RDP feature that lets users copy and paste between their local device and the remote session. It can be disabled, or limited to one direction, through a host pool RDP property or policy.",
        'detail': "Screen capture protection does not turn it off; clipboard redirection is a separate RDP property, so blocking copy-and-paste out of the session must be configured on its own.",
    },
    {
        'id': 'f100',
        'cat': "userEnvApps",
        'front': "Microsoft 365 Apps shared computer activation",
        'back': "A licensing mode for Microsoft 365 Apps on hosts that many users share, where each user who signs in activates the apps under their own license instead of consuming one of a limited number of per-user device installs. It is required on multi-session session hosts.",
        'detail': "Enable it when installing, with a machine-wide installation on the master image. Microsoft 365 Apps use user-based licensing, so a KMS host key is not the answer.",
    },
    {
        'id': 'f101',
        'cat': "userEnvApps",
        'front': "Remote Desktop client (Windows App)",
        'back': "The app users run to subscribe to a workspace feed and connect to their AVD desktops and RemoteApps. Microsoft's current unified client is Windows App, which replaces the older Remote Desktop clients and also runs in a browser on devices where nothing can be installed.",
        'detail': "The older Remote Desktop MSI client and web client reached end of support for public cloud on 27 March 2026, so new designs point users to Windows App.",
    },
    {
        'id': 'f102',
        'cat': "userEnvApps",
        'front': "MSIX package signing certificate",
        'back': "An MSIX package must be digitally signed, and the signing certificate must be trusted by the machines that install it. For MSIX app attach, that means the session hosts, not the users' client devices.",
        'detail': "If an app attach package never appears in sessions despite correct share permissions, check certificate trust on the session hosts and that the hosts' computer accounts can read the image share.",
    },
    {
        'id': 'f103',
        'cat': "monitorMaintain",
        'front': "Log Analytics workspace",
        'back': "The Azure Monitor Logs store that AVD diagnostic settings, AVD Insights, and Azure Monitor Agent data collection rules send data to. AVD tables such as WVDConnections, WVDErrors, WVDCheckpoints, and WVDAgentHealthStatus are queried with KQL.",
        'detail': "A workspace is required to use AVD Insights. Retention is set per table, so adjust it to balance troubleshooting history against cost.",
    },
    {
        'id': 'f104',
        'cat': "monitorMaintain",
        'front': "Azure Update Manager",
        'back': "Azure's service for assessing and scheduling operating system updates across Azure VMs and Azure Arc-enabled servers from one place, using maintenance schedules. For AVD it patches the Windows OS on session hosts, separately from the AVD agent's own updates.",
        'detail': "Combine maintenance windows with drain mode or autoscale so users are not signed out mid-session, or patch the golden image and redeploy hosts instead.",
    },
    {
        'id': 'f105',
        'cat': "monitorMaintain",
        'front': "Capacity threshold (autoscale)",
        'back': "A pooled-host-pool scaling plan setting: the percentage of the pool's total session capacity at which autoscale acts. Above the threshold it starts more session hosts; below it, it can deallocate surplus ones. Capacity is session hosts multiplied by the max session limit.",
        'detail': "Autoscale does nothing when usage exactly equals the threshold. It works together with the minimum percentage of hosts, which sets a floor on how many hosts stay on.",
    },
    {
        'id': 'f106',
        'cat': "monitorMaintain",
        'front': "Azure Activity log",
        'back': "A subscription-level log that records control-plane operations on Azure resources: who created, changed, or deleted something, and when. It is kept for 90 days by default, and can be sent to a Log Analytics workspace for longer retention.",
        'detail': "Use it to find who deleted a host pool or changed a scaling plan. Connection and session data come from AVD diagnostic logs instead.",
    },
    {'id': 'f9001',
     'cat': 'planInfra',
     'front': 'RDP Multipath',
     'back': 'A reliability feature that keeps several network paths to the session host warm and switches to '
             'the best one when the active path degrades. The paths can be several UDP routes discovered through '
             'STUN and TURN, plus standby TCP Reverse Connect paths. If every path is lost, the client '
             'reconnects once the network returns.',
     'detail': 'It needs no extra configuration beyond a working RDP Shortpath setup, but the client must be a '
               'recent Windows App (version 2.0.559.0 or later for Windows). It improves session stability on '
               'unreliable networks; it is not a bandwidth or QoS feature.'},
    {'id': 'f9002',
     'cat': 'planInfra',
     'front': 'Quality of service (QoS) for RDP Shortpath',
     'back': 'QoS lets real-time RDP traffic jump ahead of delay-tolerant traffic. Session hosts mark RDP '
             'packets with a DSCP value (Microsoft recommends 46, Expedited Forwarding) using a policy-based QoS '
             'Group Policy or the New-NetQosPolicy cmdlet, and the network devices must honor the marking end to '
             'end.',
     'detail': 'The policy matches the svchost.exe executable and UDP source port 3390. QoS policies only work '
               'with RDP Shortpath for managed networks; they are not supported for the reverse connect '
               'transport, and a VPN or any hop that ignores DSCP breaks the benefit.'},
    {'id': 'f9003',
     'cat': 'planInfra',
     'front': 'Organizing subscriptions, resource groups, and management groups for AVD',
     'back': 'In an Azure landing zone, workload-specific AVD resources (session host VMs, storage accounts, key '
             'vaults, private endpoints) go in a workload subscription, while shared services (Log Analytics '
             'workspaces, data collection rules, Azure Compute Gallery, Automation) can sit in a shared-services '
             'subscription. Management groups apply Azure Policy and RBAC down to those subscriptions.',
     'detail': 'Inside a subscription, separate resource groups for AVD service objects (host pools, workspaces, '
               'application groups) and for session host VMs keep RBAC and cleanup simple. Users from different '
               'organizations should get a separate tenant and subscription rather than a shared multi-session '
               'pool.'},
    {'id': 'f9004',
     'cat': 'planInfra',
     'front': 'Automating host pool deployment (PowerShell, Azure CLI, ARM and Bicep)',
     'back': 'Host pools, workspaces, and application groups are Microsoft.DesktopVirtualization resources, so '
             'the same deployment can be scripted with Az.DesktopVirtualization cmdlets (New-AzWvdHostPool), the '
             'az desktopvirtualization command group, or ARM templates and Bicep files that declare the resource '
             'types.',
     'detail': 'Session hosts join a host pool with a registration key that is valid only for the lifetime you '
               'set (currently up to 27 days). A scripted rollout that spans longer than the key fails with '
               'EXPIRED_MACHINE_TOKEN errors, so generate a new key before the old one expires.'},
    {'id': 'f9005',
     'cat': 'planInfra',
     'front': 'Licensing Windows client session hosts (eligible licenses)',
     'back': 'For internal users, Windows 10/11 Enterprise (multi-session) session hosts need each user to hold '
             'an eligible license such as Microsoft 365 E3, E5, A3, A5, F3, Business Premium or Student Use '
             'Benefit, Windows Enterprise E3/E5, Windows Education A3/A5, or Windows VDA per user.',
     'detail': 'The license is per user, not per session host. A contractor who accesses the pool still needs an '
               'eligible license for internal commercial use; per-user access pricing does not cover that case.'},
    {'id': 'f9006',
     'cat': 'planInfra',
     'front': 'RDS CALs for Windows Server session hosts',
     'back': 'Session hosts running Windows Server (2016 through 2025) need Remote Desktop Services client '
             'access licenses with Software Assurance (per user or per device) or RDS User Subscription Licenses '
             'for each user, in addition to the server OS license.',
     'detail': 'A Microsoft 365 E3 license covers Windows client desktops, not Windows Server session hosts. '
               'Per-user access pricing for external commercial use is also not available for Windows Server '
               'session hosts.'},
    {'id': 'f9007',
     'cat': 'planInfra',
     'front': 'Per-user access pricing',
     'back': 'A billing model for external commercial purposes, such as a software vendor delivering its app to '
             'its own customers through AVD. You enroll an Azure subscription, and each month you pay a flat '
             'Apps or Desktops + apps charge for each user who connects at least once; users need no separate '
             'Microsoft 365 license.',
     'detail': 'It cannot be used for internal employees or contractors, and it is a poor fit if you also pay '
               'for eligible licenses for the same users (you would pay twice). Per-user access does not include '
               'Office or Universal Print rights.'},
    {'id': 'f9008',
     'cat': 'planInfra',
     'front': 'Azure Virtual Desktop on Azure Local',
     'back': 'A deployment option where the AVD control plane (host pools, workspaces, application groups) stays '
             'in Azure while the session hosts run on your Azure Local instance, for example for data locality, '
             'low latency to on-premises apps, or poor cloud connectivity. Azure Local must be version 23H2 or '
             'later and registered with Azure.',
     'detail': 'Session hosts need the Azure Connected Machine agent (installed automatically when you add hosts '
               'in the portal) to reach Azure Instance Metadata Service. Costs include the user access license, '
               'the Azure Local service fee, and a per-active-vCPU AVD fee.'},
    {'id': 'f9009',
     'cat': 'planInfra',
     'front': 'Session host configuration vs. standard host pool management',
     'back': 'Standard management means you create, update, and scale session hosts yourself (portal, scripts, '
             'pipelines); it works for pooled and personal pools in Azure or Azure Local. Session host '
             'configuration lets AVD manage the lifecycle of session hosts in a pooled host pool in Azure, '
             'including creating them and updating them from a defined configuration.',
     'detail': 'Choose standard management if you rely on existing pipelines, scripts, or partner tools. A '
               'session host configuration can use a managed identity for create, update, and delete actions, '
               'which then needs rights on the session host resource group and a key vault.'},
    {'id': 'f9010',
     'cat': 'planInfra',
     'front': 'Session host update',
     'back': 'For host pools that use a session host configuration, session host update replaces the VMs with '
             'new ones built from changed settings such as the image, size, disk type, security type, or custom '
             'script. It updates one initial host first, then the rest in batches you size, draining each host '
             'and signing users out after a notification.',
     'detail': 'Customizations made by hand on old hosts are lost, so put them in the image, Intune or Group '
               'Policy, or the configuration script. Turn autoscale off for the host pool until the update '
               'finishes, and check subscription quota for the temporary extra VMs.'},
    {'id': 'f9011',
     'cat': 'planInfra',
     'front': 'Image versions and lifecycle in Azure Compute Gallery',
     'back': 'A gallery image definition holds image versions. Each version can be replicated to chosen regions, '
             'given a replica count, and either excluded from the latest-version pointer or assigned an '
             'end-of-life date, so a new monthly image can be tested before hosts deploy from it.',
     'detail': 'Update an image by deploying a VM from the current version, applying OS and application updates, '
               'running Sysprep, and capturing a new version. Deleting or ending the life of old versions '
               'prevents new hosts from using stale images, but existing hosts keep running until replaced.'},
    {'id': 'f9012',
     'cat': 'planInfra',
     'front': 'Azure Virtual Desktop Agent URL Tool',
     'back': 'A tool you run on a session host to confirm it can reach every FQDN and endpoint that AVD '
             'requires. It is the quick check when new hosts fail to register or show an unavailable status '
             'right after deployment.',
     'detail': 'Run it from the first host after joining it to the subnet. Missing endpoints, usually because of '
               'an NSG, UDR, firewall, or proxy rule, are a common cause of registration failures. Prefer the '
               'WindowsVirtualDesktop service tag and the Azure Firewall FQDN tag over hand-maintained IP lists.'},
    {'id': 'f9013',
     'cat': 'planInfra',
     'front': 'Estimating RDP bandwidth requirements',
     'back': 'RDP bandwidth depends on what the user is doing and the display resolution: idle sessions use '
             'almost nothing, office apps use roughly 100 to 500 Kbps on one 1080p monitor depending on graphics '
             'mode, and video, 4K, or multi-monitor use far more. Printing and file transfers add bulk traffic.',
     'detail': 'The most reliable method is to measure real user connections with performance counters, Azure '
               'Monitor, or network equipment, then size the link per concurrent user. Minimized client windows '
               'send no graphical updates.'},
    {'id': 'f9014',
     'cat': 'planInfra',
     'front': 'SMB Multichannel for FSLogix storage',
     'back': 'SMB Multichannel opens several network connections for a single SMB session, which improves '
             'throughput and resilience for profile traffic. Azure Files supports it on premium (SSD) file '
             'shares for Windows clients.',
     'detail': 'It helps when many profile containers load at once, such as a login storm. It does not remove '
               'the need to size the share for IOPS and throughput or to place the share in the same region as '
               'the session hosts.'},
    {'id': 'f9015',
     'cat': 'planInfra',
     'front': 'Azure Virtual Desktop network connectivity checks',
     'back': 'To troubleshoot connectivity, use the Azure Virtual Desktop Experience Estimator for planning, the '
             'Connection Information dialog in the client for the transport in use, Azure Virtual Desktop '
             'Insights for round-trip time, and Network Watcher tools such as connection troubleshoot for path '
             'problems.',
     'detail': 'Check first whether the connection is using the TCP reverse connect transport or an RDP '
               'Shortpath path, because the fixes differ: UDP port rules and STUN/TURN reachability for '
               'Shortpath, and the WindowsVirtualDesktop service tag for reverse connect.'},
    {'id': 'f9101',
     'cat': 'identitySecurity',
     'front': 'The three AVD authentication phases',
     'back': 'Connecting involves cloud service authentication (to the AVD service and gateway, always Microsoft '
             'Entra ID, where Conditional Access applies), remote session authentication (to the session host, '
             'ideally via single sign-on), and in-session authentication (to apps and sites inside the session).',
     'detail': 'Each phase supports different methods. Passwordless methods (FIDO2 keys, Windows Hello for '
               'Business, Authenticator) and smart cards work for the first two phases; in-session passwordless '
               'needs the in-session passwordless feature configured.'},
    {'id': 'f9102',
     'cat': 'identitySecurity',
     'front': 'Smart card and passwordless sign-in to AVD',
     'back': 'AVD supports smart card sign-in (including Microsoft Entra certificate-based authentication and '
             'Windows Hello for Business certificate trust) and passwordless methods such as FIDO2 security '
             'keys, Windows Hello for Business with Cloud Kerberos trust or key trust, and Microsoft '
             'Authenticator. WebAuthn and smart card redirection let the local device authenticate inside the '
             'session.',
     'detail': 'Redirection of smart cards and WebAuthn is controlled by host pool RDP properties. Use '
               'authentication strengths in Conditional Access to require a phishing-resistant method for the '
               'AVD cloud apps.'},
    {'id': 'f9103',
     'cat': 'identitySecurity',
     'front': 'External identities (B2B guests) in AVD',
     'back': 'AVD can serve invited external users when session hosts are Microsoft Entra joined, single sign-on '
             'is configured, the OS is a recent Windows 11 or Windows Server 2025 build with the required '
             'cumulative update, and users connect with Windows App. Device configuration policies must target '
             'the device, not the guest user.',
     'detail': 'External identities cannot use Kerberos or NTLM to reach on-premises resources, and they still '
               'need an eligible Windows license assigned in your tenant. Guests from another cloud, such as '
               '21Vianet, are not supported.'},
    {'id': 'f9104',
     'cat': 'identitySecurity',
     'front': 'Microsoft Defender for Cloud for session hosts',
     'back': 'Defender for Cloud with its enhanced security (Defender plans) features gives AVD session hosts '
             'vulnerability assessment, regulatory compliance checks, Secure Score recommendations, and '
             'just-in-time VM access. For server OS hosts, enabling an EDR integration deploys Microsoft '
             'Defender for Endpoint.',
     'detail': 'Treat Secure Score recommendations as a prioritized to-do list: they are specific to your '
               'resources and change over time. Defender for Cloud monitors session hosts; it does not configure '
               'FSLogix exclusions or AVD-specific RDP settings for you.'},
    {'id': 'f9105',
     'cat': 'identitySecurity',
     'front': 'Microsoft Defender Antivirus on session hosts',
     'back': 'Endpoint protection should run on every session host. With Defender Antivirus in a VDI setup you '
             'can offload security-intelligence unpacking to a shared location (Set-MpPreference '
             '-SharedSignaturesPath) to reduce CPU and disk use, and you must exclude FSLogix components and '
             'VHD(X) profile files from scanning.',
     'detail': 'Without the FSLogix exclusions, scans can slow or block profile mounting and cause sign-in '
               'delays or temporary profiles. The exclusions cover FSLogix executables and drivers, the Cloud '
               'Cache and local cache paths, and the profile container file extensions.'},
    {'id': 'f9106',
     'cat': 'identitySecurity',
     'front': 'Onboarding session hosts to Microsoft Defender for Endpoint',
     'back': 'Microsoft recommends onboarding AVD hosts as a single entry per virtual desktop, using the VDI '
             'onboarding script for non-persistent endpoints. Place the script in the golden image (or a shared '
             'location) so it runs as a startup script on every host provisioned from it. Do not onboard the '
             'golden image itself.',
     'detail': 'Other routes are Microsoft Defender for Cloud integration, Intune, and Configuration Manager. '
               'Single-entry onboarding avoids duplicate device objects when hosts are frequently deleted and '
               'redeployed. Avoid the ASR rule that blocks process creations from PSExec and WMI if '
               'Configuration Manager manages the hosts.'},
    {'id': 'f9107',
     'cat': 'identitySecurity',
     'front': 'NSGs, UDRs, and Azure Firewall for session hosts',
     'back': 'Session hosts need outbound access to AVD service endpoints. NSG and Azure Firewall rules use the '
             'WindowsVirtualDesktop service tag (and related tags for Azure Monitor and Front Door), and Azure '
             'Firewall also offers a Windows Virtual Desktop FQDN tag. UDRs that send 0.0.0.0/0 to a firewall '
             'must still permit those endpoints.',
     'detail': 'No inbound port 3389 is needed from the internet because reverse connect makes outbound '
               'connections only. Forced tunneling to on-premises without an exception for the AVD tags is a '
               'classic cause of hosts showing Unavailable.'},
    {'id': 'f9108',
     'cat': 'identitySecurity',
     'front': 'Azure Bastion and just-in-time VM access',
     'back': 'For administrative access to session hosts without exposing RDP, use Azure Bastion (browser or '
             'native client connection over TLS to the VM private address) or just-in-time VM access from '
             'Defender for Cloud, which opens a management port in the NSG only for an approved time window and '
             'source.',
     'detail': 'Microsoft recommends avoiding direct RDP to session hosts. Bastion needs its own subnet '
               '(AzureBastionSubnet) in the virtual network or a peered one; JIT needs Defender for Servers Plan '
               '2 on the subscription.'},
    {'id': 'f9109',
     'cat': 'identitySecurity',
     'front': 'App Control for Business and AppLocker on session hosts',
     'back': 'RemoteApp is not a security feature: it does not stop users from launching other programs. To '
             'restrict what can run, use Application Control features: App Control for Business (formerly '
             'Windows Defender Application Control) policies or AppLocker, deployed through Intune or Group '
             'Policy.',
     'detail': 'App Control for Business is the stronger, kernel-enforced option and is the one Microsoft '
               'recommends for new deployments; AppLocker is easier to author for simple rule sets. Test in '
               'audit mode first so a bad policy does not lock users out of the shared image.'},
    {'id': 'f9110',
     'cat': 'identitySecurity',
     'front': 'Controlled folder access',
     'back': 'A Microsoft Defender Antivirus feature that protects folders such as Documents and Pictures from '
             'ransomware and other untrusted apps by allowing only trusted applications to modify files there. '
             'It can run in audit mode before you enforce it.',
     'detail': 'Apps that legitimately write to protected folders must be added to the allowed list or they are '
               'blocked. Configure it through Intune (attack surface reduction policy), Group Policy, or '
               'PowerShell, ideally in audit mode first.'},
    {'id': 'f9111',
     'cat': 'identitySecurity',
     'front': 'Trusted launch for session hosts',
     'back': 'Trusted launch Azure VMs add Secure Boot, a virtual TPM, and boot integrity monitoring to protect '
             'against rootkits, boot kits, and kernel-level malware. When you add session hosts in the Azure '
             'portal, the default security type is Trusted virtual machines, which also satisfies Windows 11 '
             'requirements.',
     'detail': 'Trusted launch needs a generation 2 image that supports it. Standard security type is still '
               'available, and session host configuration can change the security type to trusted launch or '
               'confidential during a session host update.'},
    {'id': 'f9112',
     'cat': 'identitySecurity',
     'front': 'Azure confidential VMs for session hosts',
     'back': 'Confidential VMs encrypt a virtual desktop in memory and protect it in use with hardware-based '
             'isolation, so even the hypervisor and host OS cannot read it. Supported session host OSes include '
             'Windows 11 Enterprise (multi-session), Windows 10 Enterprise (multi-session), and Windows Server '
             '2022 and 2019.',
     'detail': 'Choose confidential VMs when data in use must be protected from the platform operator. Trusted '
               'launch protects the boot chain; confidential VMs add memory encryption on top. Only specific VM '
               'series support them.'},
    {'id': 'f9113',
     'cat': 'identitySecurity',
     'front': 'Desktop Virtualization Virtual Machine Contributor',
     'back': 'The built-in AVD role that lets the AVD service principal or a host pool managed identity manage '
             'the session host VMs themselves (create, update, and delete them for a session host '
             'configuration). It is assigned on the resource group or subscription that holds the session hosts.',
     'detail': 'It lets AVD manage session host VMs without a broad Contributor role. The account that creates '
               'the host pool, workspace, and application group objects needs Desktop Virtualization '
               'Contributor, and one that creates the VMs needs Virtual Machine Contributor. Autoscale power '
               'actions use a different role, Desktop Virtualization Power On Off Contributor.'},
    {'id': 'f9114',
     'cat': 'identitySecurity',
     'front': 'Token protection for AVD connections',
     'back': 'Token protection (a Conditional Access session control) binds sign-in tokens to the device, so a '
             'stolen token cannot be replayed from another device. For AVD, require it on the endpoint that runs '
             'Windows App; it does not apply to the session host.',
     'detail': 'Support depends on the Windows App platform and on the identity type. External identities have '
               'limits. Use it with a compliant-device grant control rather than as a substitute for MFA.'},
    {'id': 'f9115',
     'cat': 'identitySecurity',
     'front': 'Managing local groups and rights on session hosts',
     'back': 'Control who is a local administrator or Remote Desktop user on hosts with Intune (Endpoint '
             'security > Account protection > local user group membership policy), Group Policy restricted '
             'groups, or, for Entra-joined hosts, the Virtual Machine Administrator Login and Virtual Machine '
             'User Login roles.',
     'detail': 'Local administrator rights should be exceptional on shared multi-session hosts because they '
               'cross user security boundaries. Give users who need admin rights a personal host pool, and use '
               'Windows LAPS for the built-in local admin password.'},
    {'id': 'f9116',
     'cat': 'identitySecurity',
     'front': 'Smart card redirection and WebAuthn redirection',
     'back': 'Host pool RDP properties let a session use the local smart card reader (redirectsmartcards) or the '
             'local FIDO2 key through WebAuthn redirection (redirectwebauthn). They are what make in-session '
             'sign-in with a hardware key or smart card possible.',
     'detail': 'Both are client-to-host redirections, so they are evaluated per connection and apply to every '
               'host in the pool. Disable them where the security policy forbids local authenticators inside '
               'sessions.'},
    {'id': 'f9201',
     'cat': 'userEnvApps',
     'front': 'Windows App and the retired Remote Desktop clients',
     'back': 'Windows App is the current client for AVD and runs on Windows, macOS, iOS/iPadOS, Android/Chrome '
             'OS, web browsers, and Meta Quest. The Remote Desktop client for Windows (MSI) and the Remote '
             'Desktop web client ended support for public cloud on March 27, 2026, and the Microsoft Store '
             'Remote Desktop app ended in September 2025.',
     'detail': 'Pick the client by device: install Windows App where installation is allowed, and use the '
               'browser client for unmanaged or locked-down devices. Deploy Windows App to managed devices with '
               'Intune or another endpoint management tool.'},
    {'id': 'f9202',
     'cat': 'userEnvApps',
     'front': 'Device redirection RDP properties',
     'back': 'Redirection is controlled per host pool with RDP properties such as drivestoredirect, '
             'redirectclipboard, redirectprinters, usbdevicestoredirect, camerastoredirect, audiomode, '
             'redirectsmartcards, and redirectwebauthn. Evaluate which redirections your security policy '
             'actually needs and turn the rest off.',
     'detail': 'Group Policy on the session host can also restrict redirection, and a redirection only works '
               'when both layers allow it. Prefer OneDrive instead of drive redirection, Universal Print instead '
               'of printer redirection, and one-way clipboard where possible.'},
    {'id': 'f9203',
     'cat': 'userEnvApps',
     'front': 'Session time limit settings',
     'back': 'Time limits for disconnected, active-but-idle, and active sessions, plus the setting that ends a '
             'session when limits are reached, are configured in Group Policy under Remote Desktop Session Host '
             '> Session Time Limits, or through Intune policy for Entra-joined hosts.',
     'detail': 'Choose limits that match the workload: aggressive limits help stateless task workers release '
               'capacity, but long-running jobs such as renders can be killed by an idle limit. Screen locks for '
               'idle sessions are a separate control.'},
    {'id': 'f9204',
     'cat': 'userEnvApps',
     'front': 'Configuring user settings with Intune or Group Policy',
     'back': 'Session hosts joined to Active Directory take settings from Group Policy objects linked to the '
             'host OU; Microsoft Entra-joined session hosts take them from Intune configuration profiles '
             '(settings catalog and administrative templates) assigned to the device group that holds the hosts.',
     'detail': 'Assign device configuration to the devices, not to users, on multi-session hosts. For external '
               'identities, user-targeted Intune policy is not applied at all.'},
    {'id': 'f9205',
     'cat': 'userEnvApps',
     'front': 'Assigning and unassigning personal desktops',
     'back': 'In a personal host pool with direct assignment, an admin assigns a specific user to a specific '
             'session host, and can unassign them to free the VM or reassign it. With automatic assignment, a '
             'user is assigned to the first available unassigned host on first sign-in.',
     'detail': 'Unassigning a user from a host is the way to free it for someone else. Personal desktop '
               'assignment decides which host a user lands on; it is separate from the application group '
               'assignment and the Desktop Virtualization User role that grant access to the desktop.'},
    {'id': 'f9206',
     'cat': 'userEnvApps',
     'front': 'FSLogix Cloud Cache configuration',
     'back': 'Cloud Cache is enabled by setting CCDLocations (instead of VHDLocations) to one or more providers '
             'such as type=smb,connectionString=\\\\server\\share. It keeps a local cache of the container and '
             'writes asynchronously to every listed provider, so users survive loss of one storage location.',
     'detail': 'The two options are not used together. Cloud Cache consumes local disk on the session host and '
               'adds write load, so it suits resilience requirements; a single regional share is simpler when '
               'you do not need cross-region failover.'},
    {'id': 'f9207',
     'cat': 'userEnvApps',
     'front': 'Publishing a RemoteApp',
     'back': 'In a RemoteApp application group you add applications from the Start menu list on the session '
             'hosts, or by file path for programs that do not appear there, and you can set the display name, '
             'icon, and command-line arguments. Users see only the apps in application groups they are assigned.',
     'detail': 'A host pool can have multiple RemoteApp application groups, and a pooled pool can also have one '
               'Desktop group. A personal host pool supports only Desktop application groups.'},
    {'id': 'f9208',
     'cat': 'userEnvApps',
     'front': 'Microsoft 365 Apps on multi-session hosts',
     'back': 'Install Microsoft 365 Apps per machine using the Office Deployment Tool with shared computer '
             'activation turned on, so each user who signs in activates against their own license instead of '
             'consuming a per-device activation. Configure update behavior centrally and consider OneDrive and '
             'Teams optimization in the image.',
     'detail': 'Shared computer activation is required for multi-session hosts and for scenarios where many '
               'users share one machine. Policies for the apps can be set through Intune or the Microsoft 365 '
               'Apps admin center.'},
    {'id': 'f9209',
     'cat': 'userEnvApps',
     'front': 'Remote Desktop WebRTC Redirector Service',
     'back': 'The component installed on session hosts that lets Teams media optimization offload audio and '
             'video processing to the user device. It works with the Teams client on the host and the Windows '
             'App client on the endpoint.',
     'detail': 'Install it in the image together with the optimization settings. Without it, Teams media is '
               'processed on the session host, which raises CPU use and degrades call quality.'},
    {'id': 'f9210',
     'cat': 'userEnvApps',
     'front': 'App attach registration types',
     'back': 'App attach supports on-demand registration, where an app is only partially registered at sign-in '
             'and fully registered when launched (the default and recommended option), and log on blocking, '
             'where each assigned app is fully registered during sign-in, which can lengthen sign-in time.',
     'detail': 'App packages are marked active or inactive, and an app only reaches a user when it is assigned '
               'to the host pool, the user can sign in through a Desktop or RemoteApp group, and the app is '
               'assigned to that user or group.'},
    {'id': 'f9211',
     'cat': 'userEnvApps',
     'front': 'Updating an app attach application',
     'back': 'Add a new version either side by side (a new application using the new image, assigned to the same '
             'pools and users) or in place (update the existing application to a new image with a different '
             'version number). Users get the new version at their next sign-in.',
     'detail': 'The version number may be higher or lower but cannot be the same. Do not delete the old image '
               'until all users have finished with it. Multiple versions of an app can run concurrently on one '
               'host.'},
    {'id': 'f9212',
     'cat': 'userEnvApps',
     'front': 'Creating an app attach package',
     'back': 'Convert an MSIX, MSIX bundle, or Appx package into a disk image (VHD, VHDX, or CIM) with the '
             'MSIXMGR tool, store it on an SMB share that session hosts can read, and register it as an app '
             'attach package in the portal. App-V packages are also supported.',
     'detail': 'Package certificates must be trusted by the session hosts. Use an Azure Files share (or Azure '
               'NetApp Files, which needs domain-joined hosts) and give each host computer account read '
               'permission to the image share.'},
    {'id': 'f9213',
     'cat': 'userEnvApps',
     'front': 'Hibernation and FSLogix or app attach',
     'back': 'Personal host pool autoscale can hibernate a disconnected or logged-off VM instead of deallocating '
             'it, which keeps the in-memory state. Hibernation is not supported together with FSLogix or app '
             'attach, so do not enable it on pools that use them.',
     'detail': 'Hibernate must be enabled on the session hosts. If profiles use FSLogix or apps use app attach, '
               'choose Deallocate for the scaling plan action instead.'},
    {'id': 'f9214',
     'cat': 'userEnvApps',
     'front': 'Browsers in AVD sessions',
     'back': 'Microsoft Edge ships on the Windows session host images and can be managed with Intune or Group '
             'Policy. For web video, browser multimedia redirection moves media decoding to the client and needs '
             'the extension and host components installed.',
     'detail': 'Treat the browser as an application surface to secure like any other: manage extensions and '
               'settings centrally through Intune or Group Policy rather than letting each user configure it.'},
    {'id': 'f9301',
     'cat': 'monitorMaintain',
     'front': 'Multi-region disaster recovery for AVD',
     'back': 'AVD has no native disaster recovery switch. Resiliency is built from Azure features: session hosts '
             'in more than one region (active-active or active-passive), Azure Site Recovery for personal '
             'desktops, replicated images, replicated profile storage (Cloud Cache or geo-redundant file '
             'shares), and identity and network that also exist in the secondary region.',
     'detail': 'Plan DR for the customer-managed pieces: session hosts, profiles, apps, user data, and '
               'identities. The AVD control plane is Microsoft-managed. In an active-passive design the '
               'secondary region has its own host pool, workspace, and application group already created, with '
               'session hosts deallocated until needed.'},
    {'id': 'f9302',
     'cat': 'monitorMaintain',
     'front': 'Backup strategy for AVD components',
     'back': 'Back up what holds state: personal desktops with Azure Backup for VMs or Site Recovery, FSLogix '
             'profile shares with Azure Files share snapshots or Azure Backup, and images by keeping them in a '
             'replicated Azure Compute Gallery. Pooled session hosts are normally rebuilt from the image rather '
             'than backed up.',
     'detail': 'Enable soft delete on the storage account so a deleted share can be recovered. Restore of '
               'FSLogix profiles means restoring the VHD(X) file, so test it as part of the plan.'},
    {'id': 'f9303',
     'cat': 'monitorMaintain',
     'front': 'Customizing the Azure Virtual Desktop Insights workbook',
     'back': 'Insights is an Azure Monitor workbook. You can edit it, add queries and visualizations over the '
             'Log Analytics workspace, change parameters, and save a copy as your own workbook, rather than '
             'building a new dashboard from scratch.',
     'detail': 'Insights needs diagnostic settings sending AVD logs to a Log Analytics workspace and the Azure '
               'Monitor Agent with a data collection rule on the session hosts for performance counters and '
               'events. After session host update, reinstall the agent (for example with Azure Policy).'},
    {'id': 'f9304',
     'cat': 'monitorMaintain',
     'front': 'Update strategy for session hosts',
     'back': 'Prefer updating the image and replacing hosts (session host update, or redeploy from a new Compute '
             'Gallery version) over patching each host in place. Use Azure Update Manager, Intune, or Windows '
             'Autopatch for hosts that must be patched in place, and patch images monthly.',
     'detail': 'In-place patching of pooled hosts needs drain mode first so users are not interrupted. '
               'Image-based replacement gives every host an identical, tested state and a clean rollback.'},
    {'id': 'f9305',
     'cat': 'monitorMaintain',
     'front': 'Managing active sessions',
     'back': 'In the host pool Sessions view an admin can send a message to a user, log off a session, or '
             'disconnect it, and drain a host to stop new connections. These actions are covered by the Desktop '
             'Virtualization Session Host Operator role.',
     'detail': 'Logging off a user ends their apps and can lose unsaved work, so send a message first. '
               'Disconnect keeps the session alive on the host and is subject to the disconnected-session time '
               'limit.'},
]

QUESTIONS = [
    {
        'id': 'q1',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso has 400 call-center agents who all use the same three line-of-business apps and have no local admin rights. Agent settings must follow them between sessions, but installed software and local changes should reset after each session. Minimizing the number of running VMs is the top priority. Which design fits?",
        'options': [
            "A personal host pool with direct assignment and a scaling plan that deallocates idle VMs",
            "A personal host pool with automatic assignment, plus FSLogix Profile Containers for settings",
            "A pooled host pool of single-session hosts, one user per VM, with FSLogix Profile Containers",
            "A pooled host pool of multi-session hosts, with FSLogix Profile Containers on a shared file share",
        ],
        'correct': 3,
        'explanation': "Multi-session hosts let many agents share each VM, which is what minimizes the running VM count, and FSLogix Profile Containers carry settings between hosts while installed software and local changes reset because a pooled host is not tied to any one user. Both personal host pool designs dedicate one VM per user, so the VM count tracks headcount however the VMs are assigned or scaled. Single-session pooled hosts keep the pooled model but still consume one VM per concurrent user.",
    },
    {
        'id': 'q2',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A pooled host pool with eight session hosts uses depth-first load balancing and a max session limit of 16. During the morning peak, the first hosts are heavily loaded while other running hosts sit nearly idle, and users on the busy hosts report lag. Cost is not a concern at peak. What should the admin change for the peak phase?",
        'options': [
            "Raise the max session limit so each loaded host can accept more concurrent users",
            "Lower the scaling plan's capacity threshold so additional hosts start sooner",
            "Place the nearly idle hosts into drain mode until peak load subsides",
            "Switch to breadth-first so each new session goes to the host with the fewest sessions",
        ],
        'correct': 3,
        'explanation': "Depth-first deliberately fills one host to its limit before using the next, which is exactly the lopsided load being reported. Breadth-first sends each new session to the available host with the fewest sessions, evening out the load across hosts that are already running. Raising the limit lets the busy hosts take even more users. Drain mode would take the idle hosts out of rotation and concentrate load further. A lower capacity threshold only starts extra hosts earlier, and depth-first would still fill the first hosts to the limit before using them.",
    },
    {
        'id': 'q3',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso has a pooled host pool with a Desktop application group assigned to the IT team. Finance staff, who are not in that group, need only one accounting application published from the same session hosts, without being given a full desktop. What should the admin add?",
        'options': [
            "A second host pool dedicated to Finance, since a host pool holds a single application group type",
            "A second Desktop application group on the same host pool, with Application Masking hiding everything except the accounting app",
            "A RemoteApp application group on the existing host pool, assigned to Finance and registered with a workspace",
            "A personal host pool for Finance, since RemoteApp publishing depends on personal host pool assignment",
        ],
        'correct': 2,
        'explanation': "A pooled host pool can contain several application groups of different types. A RemoteApp application group publishes individual programs from the pool's existing hosts, users get access through their assignment to that group, and a workspace surfaces it in their feed. A second host pool adds cost and management for no benefit, because the pool can already hold both group types. A Desktop application group still hands Finance a full desktop, and masking only hides apps inside it. A personal host pool dedicates a VM per user and is not what enables RemoteApp publishing. Microsoft's guidance against giving the same users both group types from one pool is not an issue here, since Finance receives only the RemoteApp group.",
        'whyTested': "This tests whether you know that the application group type, not the host pool type, determines what a user is offered. A distractor claiming a hard platform limit (one group type per pool, RemoteApp only on personal pools) is a common exam trap, as is a Desktop group plus masking that still hands out a full desktop.",
    },
    {
        'id': 'q4',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Each month Contoso builds a new Windows 11 multi-session image. Host pools in West Europe and East US must deploy from the same image, admins want earlier builds kept for rollback, and each new build must be piloted in a small host pool first. They currently copy a managed image between regions by hand. What should they use instead?",
        'options': [
            "A VHD in a geo-redundant storage account, used to create hosts by blob URL",
            "Versioned images in an Azure Compute Gallery, replicated to both regions",
            "A managed image per region, copied with a script after each build",
            "A recovery point of the reference VM kept in an Azure Backup vault",
        ],
        'correct': 1,
        'explanation': "Azure Compute Gallery keeps numbered image versions, replicates them to the regions where hosts will deploy, and lets a pilot pool pin the newest version while production stays on the previous one, which also gives an instant rollback path. A scripted managed-image copy only automates the manual step: managed images have no versioning or replication management. A VHD in blob storage has no version catalog or regional replication control either, and a Backup recovery point protects a VM rather than distributing a deployable image.",
    },
    {
        'id': 'q5',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso expects 6,000 concurrent users and heavy profile-load storms at 8 a.m. The design calls for the lowest-latency, highest-throughput storage for FSLogix profile containers, and the network team can dedicate a delegated subnet. Which storage should host the containers?",
        'options': [
            "An Azure NetApp Files SMB volume in a capacity pool",
            "A premium block blob container with NFS 3.0 enabled",
            "A standard Azure Files share with large file shares enabled",
            "A premium Azure Files share in a FileStorage account",
        ],
        'correct': 0,
        'explanation': "Azure NetApp Files is the option Microsoft points to for the lowest latency and highest throughput at large scale, and its extra setup (a delegated subnet and capacity pool) is exactly the cost the scenario says it can pay. Premium Azure Files is the usual choice for small-to-medium deployments but is not the top performer at this scale. Standard Azure Files is HDD-backed and a poor fit for login storms. Blob storage exposed over NFS does not give session hosts the SMB share that FSLogix profile containers need on Windows.",
    },
    {
        'id': 'q6',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Branch-office users reach the session hosts' virtual network over ExpressRoute private peering, so clients have a direct private route to the hosts. They report sluggish typing, and traffic currently relays through the AVD gateway over TCP. Which feature gives these clients a direct UDP-based transport?",
        'options': [
            "RDP Shortpath for managed networks",
            "Multimedia redirection with the host component",
            "Azure Private Link for Azure Virtual Desktop",
            "RDP Shortpath for public networks",
        ],
        'correct': 0,
        'explanation': "RDP Shortpath for managed networks creates a direct UDP transport between client and session host when the client has private connectivity such as ExpressRoute or a VPN, which matches this topology. Shortpath for public networks is built for clients with no such route and relies on STUN/TURN NAT traversal. Private Link moves the AVD service endpoints onto private IP addresses but does not by itself create the direct UDP data path, and multimedia redirection offloads video decoding rather than changing the transport.",
        'whyTested': "Shortpath for managed networks, Shortpath for public networks, and Private Link all sound like network-path improvements, so the exam describes the topology (a private route to the host subnet) and expects you to match the feature to it rather than just recognizing the word 'Shortpath'.",
    },
    {
        'id': 'q7',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso runs identical host pools in two Azure regions. If the primary region's file share is unreachable, users must still sign in with their current profile data from the second region's share, and profile data must be copied between the shares automatically. Which FSLogix configuration meets this?",
        'options': [
            "Two share paths listed in VHDLocations, with FSLogix using the first reachable path",
            "Cloud Cache, configured with one storage provider in each region",
            "Redirections.xml entries that replicate profile folders to the second share",
            "An Office Container pointed at the second region's share",
        ],
        'correct': 1,
        'explanation': "Cloud Cache writes profile changes to a local cache and asynchronously replicates them to every configured provider, so the second region's share holds current data. Listing two paths in VHDLocations only provides an ordered fallback: FSLogix uses the first location it can reach and never copies data between them, so users on the second share would see a stale or empty profile. The Office Container carries only Outlook and OneDrive data and does not replicate, and Redirections.xml controls which folders are included in or excluded from the container, not replication to another share.",
    },
    {
        'id': 'q8',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso wants early warning of a breaking Azure Virtual Desktop agent or service update before it reaches three production host pools. A small pilot host pool already exists with a handful of non-critical users. What should the admin configure?",
        'options': [
            "Set the production host pools' scheduled agent updates to a weekend maintenance window",
            "Turn on the Validation environment setting for the pilot host pool",
            "Build the pilot pool's session hosts from the newest Compute Gallery image version",
            "Place the pilot pool's session hosts in drain mode to hold back new sessions during the update",
        ],
        'correct': 1,
        'explanation': "A host pool flagged as a validation environment receives AVD service and agent updates ahead of production pools, which gives the early warning requested. A new gallery image version tests your own OS and application image, not Microsoft's service updates. Scheduled agent updates control when production hosts install updates, not whether the release reaches a pilot first. Drain mode only affects where new sessions are routed.",
        'whyTested': "Several features sound like safe-rollout tools (validation environment, scheduled agent updates, gallery image versions), but each gates something different. The exam checks that you can tell which one controls the order in which host pools receive AVD service updates.",
    },
    {'id': 'q9',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'Contoso has one host pool published as a Desktop to engineers and another published as '
                 'RemoteApps to finance staff. Several employees belong to both teams and want everything to '
                 'appear in one feed in Windows App. What should the admin do?',
     'options': ['Publish each host pool through its own workspace, so users subscribe to both feeds',
                 'Register both application groups with the same workspace, and assign users to each application '
                 'group',
                 'Assign the users the Desktop Virtualization User role on the workspace rather than on the '
                 'application groups',
                 'Move the session hosts of both host pools into a single host pool with one Desktop application '
                 'group'],
     'correct': 1,
     'explanation': 'A workspace groups application groups, including ones from different host pools, into a '
                    "single feed, while each user's assignment to an application group controls what actually "
                    'appears for them. Separate workspaces produce separate feed entries that users must '
                    'subscribe to individually. Merging the hosts into one pool throws away the distinct Desktop '
                    'and RemoteApp designs and exposes everything through one group. A role assigned on the '
                    'workspace does not grant access to any application group, because access is granted at the '
                    'application group.',
     'whyTested': 'This separates the object that aggregates what users see (a workspace) from the object that '
                  'grants access (an application group assignment). The exam plants plausible shortcuts, such as '
                  'a role on the workspace or one workspace per host pool, that look reasonable but give users '
                  'the wrong result.'},
    {
        'id': 'q10',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A finance director needs a persistent desktop that keeps locally installed software and manual customizations between sessions. IT must assign a specific VM to the director before first sign-in, and compute should not be billed while the director is offline. Which configuration fits?",
        'options': [
            "A pooled host pool publishing a RemoteApp application group with MSIX app attach",
            "A personal host pool with automatic assignment and a scaling plan that deallocates the VM after disconnect",
            "A personal host pool with direct assignment and a scaling plan that deallocates the VM after disconnect",
            "A pooled host pool with depth-first load balancing and FSLogix Profile Containers",
        ],
        'correct': 2,
        'explanation': "Only a personal host pool preserves software installed on the VM itself, and direct assignment lets an admin map a named user to a specific VM ahead of the first connection, while the personal scaling plan handles deallocating the VM when the director is away. Automatic assignment maps a user only at first connection and to whichever host is free, so it cannot reserve a particular VM in advance. Pooled designs, even with FSLogix, roam the profile but do not keep locally installed software on a host the user may not land on again.",
    },
    {
        'id': 'q11',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A new Azure Virtual Desktop deployment is planned in East US. The Experience Estimator shows a round-trip time of about 170 ms for users in Sao Paulo, and test sessions feel laggy even though their internet bandwidth is ample. Which change would most improve their experience?",
        'options': [
            "Place session hosts and profile storage in a closer Azure region such as Brazil South",
            "Switch the host pool to breadth-first load balancing to spread the sessions",
            "Upgrade the Sao Paulo office's internet link to a higher-bandwidth circuit",
            "Move the session hosts to a larger VM size with more vCPUs and memory",
        ],
        'correct': 0,
        'explanation': "Round-trip time between client and the Azure region hosting the session host is the dominant factor in perceived responsiveness, and distance sets a floor that nothing else removes, so hosting closer to the users is the fix; roughly 150 ms and below is the rule-of-thumb target. More bandwidth does not shorten the path, a bigger VM helps CPU-bound workloads rather than network delay, and load balancing only decides which host takes a session.",
    },
    {
        'id': 'q12',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "An admin publishes an application with app attach from an MSIX image on an Azure Files share that uses AD DS authentication. The package is signed with a certificate the session hosts trust, but the app never appears in sessions. Share permissions currently grant read access to the users' security group only. What is most likely missing?",
        'options': [
            "Read access on the share for the session hosts' computer accounts",
            "Modify access on the share for the users' security group",
            "Registration of the package's certificate on the users' client devices",
            "The Desktop Virtualization User role for the session host VMs",
        ],
        'correct': 0,
        'explanation': "The image is mounted on the session host at sign-in under the host's own computer account, so those computer accounts need read access to the share; user-only permissions do not allow the mount. Giving users more rights on the share changes nothing about who performs the mount. The Desktop Virtualization User role applies to users assigned to application groups, not to VMs, and certificate trust matters on the session hosts, not on client devices.",
    },
    {
        'id': 'q13',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso's session hosts are Microsoft Entra-joined and its users are hybrid identities synced from on-premises AD DS. Azure has no line of sight to the domain controllers. FSLogix profiles on Azure Files must use Kerberos authentication rather than the storage account key. What should the admin configure?",
        'options': [
            "Microsoft Entra Kerberos authentication on the storage account",
            "AD DS authentication on the storage account by joining it to the on-premises domain",
            "A shared access signature that the FSLogix agent presents to the share",
            "Microsoft Entra Domain Services authentication on the storage account",
        ],
        'correct': 0,
        'explanation': "Microsoft Entra Kerberos lets Entra-joined hosts get Kerberos tickets for an Azure Files share on behalf of hybrid identities without reaching a domain controller. AD DS authentication depends on clients obtaining tickets from reachable domain controllers, which the scenario rules out. Entra Domain Services authentication assumes hosts joined to that managed domain rather than Entra-joined. A shared access signature is a token-based mechanism, not Kerberos.",
    },
    {
        'id': 'q14',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "A help-desk technician must log off or message users' hung sessions, but must not be able to change drain mode, remove session hosts, or delete host pools. Which built-in role fits?",
        'options': [
            "Desktop Virtualization User",
            "Desktop Virtualization Session Host Operator",
            "Desktop Virtualization Contributor",
            "Desktop Virtualization User Session Operator",
        ],
        'correct': 3,
        'explanation': "Desktop Virtualization User Session Operator is scoped to acting on user sessions: sending messages, disconnecting, and logging users off. Session Host Operator is the near-miss: it manages the hosts themselves, including drain mode and removal, which the technician must not do. Desktop Virtualization Contributor can manage and delete AVD objects, and Desktop Virtualization User is an end-user role that grants access to application groups, not administrative actions.",
    },
    {
        'id': 'q15',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso enabled single sign-on with Microsoft Entra authentication on its host pools. A Conditional Access policy requiring MFA targets only the Azure Virtual Desktop app. Security wants MFA enforced for the sign-in to the session host as well. What should the admin change?",
        'options': [
            "Replace the Azure Virtual Desktop app with Windows Cloud Login in the policy",
            "Add the Microsoft 365 admin center app to the policy's target resources",
            "Enable per-user MFA for the users who connect",
            "Add the Windows Cloud Login app to the policy's target resources",
        ],
        'correct': 3,
        'explanation': "With single sign-on enabled, signing in to the feed and gateway is evaluated against the Azure Virtual Desktop app, while the sign-in to the session host is evaluated against Windows Cloud Login, so the policy must include both. Replacing one with the other would leave the feed side outside the policy. The Microsoft 365 admin center app has nothing to do with AVD sign-in. Per-user MFA is the legacy mechanism, cannot be scoped to specific apps, and is not what extends a Conditional Access policy's coverage.",
        'whyTested': "Once single sign-on is on, signing in to the feed and signing in to the session host are two separate authentications handled by different Entra apps. A policy that looks complete after targeting the obvious app can leave the host sign-in outside its scope.",
    },
    {
        'id': 'q16',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "A hospital finds photos of patient records on AVD screens circulating online. It wants future photos to reveal which user session produced them, without disrupting normal work. What should be enabled?",
        'options': [
            "Screen capture protection, configured through the host pool's RDP properties",
            "AVD Insights enabled on the host pool with a Log Analytics workspace",
            "Session watermarking, configured on the session hosts with Intune or Group Policy",
            "Clipboard redirection disabled in the host pool's RDP properties",
        ],
        'correct': 2,
        'explanation': "Watermarking overlays a QR code that encodes the session's connection ID, which an admin can look up in AVD diagnostics to identify the user and session host behind a photo. Screen capture protection blocks software capture tools on the client but cannot stop a camera or identify anyone. Disabling clipboard redirection addresses copy-and-paste, not photographs, and Insights shows session activity but cannot tie a photo found online to a specific session.",
        'whyTested': "Screen capture protection and watermarking sound like two flavors of one control, but one blocks software capture while the other traces leaks. This scenario asks for traceability after a photo already exists, which only the watermark supports.",
    },
    {
        'id': 'q17',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso's Entra-joined multi-session hosts are not domain-joined. Security wants Microsoft's AVD hardening recommendations, such as redirection restrictions, enforced consistently on each host, with compliance reporting. What should the admin use?",
        'options': [
            "Hardening applied once in the master image, with nothing enforcing it on deployed hosts afterward",
            "Network security group rules on the session host subnet",
            "Intune security baseline or settings catalog policies assigned to the session host devices",
            "A Group Policy Object linked to the organizational unit that contains the session hosts",
        ],
        'correct': 2,
        'explanation': "Intune settings catalog and security baseline policies apply to Entra-joined devices, enforce settings continuously, and report compliance, which fits hosts with no domain. A domain GPO cannot reach hosts that are not joined to the domain. Hardening only inside the master image drifts over time and gives no reporting. Network security groups filter network traffic and do not configure Windows or RDP redirection settings.",
    },
    {
        'id': 'q18',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "Contoso's pooled Windows 11 multi-session hosts are shared by staff in Tokyo and Paris. Tokyo users need a Japanese display language, have no admin rights, and the admin does not want separate host pools or images per country. What should the admin do?",
        'options': [
            "Use a Group Policy software installation package to push the language pack at sign-in",
            "Have Tokyo users install the Japanese language pack from Settings after sign-in",
            "Add the Japanese language pack to the master image, and let users pick it in Settings",
            "Deliver the Japanese language pack to Tokyo users through MSIX app attach",
        ],
        'correct': 2,
        'explanation': "Language packs and Features on Demand must be added to the master image before it is generalized; each user can then choose their own display language, and that choice roams with the profile, so one image serves both countries. Standard users cannot install language packs themselves, and a per-session install would not persist on a shared host. MSIX app attach delivers applications, not Windows language features, and a software-installation GPO is not a mechanism for adding Windows language packs either.",
    },
    {
        'id': 'q19',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A shared Windows 11 multi-session image includes a licensed finance application. Finance staff must see it in the Start menu; other departments, who get the same full desktop, must not see it at all. The admin wants to keep one image. What should be used?",
        'options': [
            "NTFS permissions on the application's folder that deny non-finance users",
            "A separate RemoteApp application group for the app, assigned to the finance group",
            "FSLogix Application Masking with a rule scoped to the finance group",
            "An AppLocker rule that blocks the application's executable for non-finance users",
        ],
        'correct': 2,
        'explanation': "Application Masking hides an installed application, including its shortcuts, from users outside the rule's scope while the app stays installed for everyone else. A RemoteApp group controls what appears as published apps, but the app would still sit in the Start menu of the shared desktop. NTFS deny permissions and AppLocker would block launching, yet the shortcut stays visible to people who are not supposed to see the app at all, which is the stated requirement.",
    },
    {
        'id': 'q20',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "FSLogix profile containers are growing because a browser cache folder in each profile does not need to roam. The admin wants smaller containers and faster sign-ins without losing other profile data or turning off FSLogix. What should be configured?",
        'options': [
            "The Office Container for the users' Outlook and OneDrive data",
            "Cloud Cache with a local cache folder on each session host",
            "An exclusion for the cache folder in Redirections.xml",
            "A lower SizeInMBs value so oversized containers are trimmed",
        ],
        'correct': 2,
        'explanation': "Redirections.xml lets an admin exclude specific folders, such as a disposable browser cache, from the profile container, which shrinks it and speeds sign-in without touching anything else. A lower SizeInMBs does not trim data; it just makes containers fill up sooner and fail to save. The Office Container moves Outlook and OneDrive data, not a browser cache. Cloud Cache adds a local cache and replication, which do not make the container smaller.",
    },
    {
        'id': 'q21',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A line-of-business app is updated monthly, and only 200 of the host pool's 1,200 users need it. Monthly image rebuilds and redeployments are unacceptable, and the app must not be installed for users who do not need it. Which approach fits?",
        'options': [
            "Deploy the installer to each session host with Intune Win32 app deployment",
            "Install it in the master image and use Application Masking to hide it from other users",
            "Package it as MSIX and deliver it with app attach, assigned to the 200 users",
            "Publish it as a RemoteApp from an application already installed in the master image",
        ],
        'correct': 2,
        'explanation': "App attach attaches the packaged app per user at sign-in, so only the assigned 200 get it, nothing is installed in the image, and a monthly update is just a new package version. Installing it in the image, with or without masking, ties every update to an image rebuild and leaves the app installed for everyone. Intune Win32 deployment installs it on every host for all users. Publishing a RemoteApp does not install anything; the app would still have to be in the image.",
    },
    {
        'id': 'q22',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "Contoso keeps its main FSLogix Profile Container on a premium share. It wants the large Outlook cache and OneDrive data stored as a separate VHD(X) on a cheaper SMB share. Which configuration achieves this?",
        'options': [
            "Configure Cloud Cache with the cheaper share as a second provider",
            "Enable the Office Container and point its VHD location at the cheaper share",
            "Add a second Profile Container with a different VHDLocations value",
            "Use Redirections.xml to redirect the Outlook and OneDrive folders to the cheaper share",
        ],
        'correct': 1,
        'explanation': "The Office Container is a separate container for Outlook and OneDrive data with its own storage location, so it can live on a different share from the Profile Container. A user has one Profile Container, so a second one is not a supported way to split data. Redirections.xml decides what is included in or excluded from the container, not which share holds a piece of it. Cloud Cache replicates the same container to each provider rather than splitting data between them.",
    },
    {
        'id': 'q23',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "The admin imports a Start layout through Group Policy that locks pinned tiles and taskbar icons for everyone on the multi-session image. Users now complain they cannot pin their own apps. Users must be able to personalize and keep their choices across session hosts. What should the admin do?",
        'options': [
            "Move the users to a personal host pool so each person has a dedicated taskbar",
            "Replace the profile container with User Profile Disks so customizations persist",
            "Deploy the layout as an editable default, and let personalization roam in the FSLogix profile",
            "Keep the layout locked and add each user's preferred apps through an Intune policy",
        ],
        'correct': 2,
        'explanation': "A default, non-locked layout gives every new profile the standard pins while still letting users change them, and those per-user changes are stored in the profile that FSLogix roams between hosts. A fully locked layout blocks personalization by design. Pushing each person's apps through policy is unmanageable and still locked. A personal host pool is a costly workaround for a policy setting, and User Profile Disks are the legacy mechanism and would not lift the lock either.",
    },
    {
        'id': 'q24',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A hospital's pooled nursing-station hosts store FSLogix profiles on Azure Files. Clinicians get a fresh, blank desktop on every sign-in. The FSLogix agent is installed on the hosts, but the FSLogix Apps Operational log shows no profile attach attempts at all. What should the admin check first?",
        'options': [
            "That the clinicians' group has the right NTFS permissions on the share",
            "That the Profile Container is enabled and VHDLocations points at the share",
            "That the host pool uses depth-first load balancing",
            "That the clinicians have the Virtual Machine User Login role",
        ],
        'correct': 1,
        'explanation': "An installed agent does nothing until the Profile Container is enabled and given a storage location, and the absence of any attach attempts in the log points at configuration that was never applied. A permissions problem would show up as logged attach failures, not silence. The load-balancing algorithm has no bearing on whether profiles attach, and a missing VM login role would block sign-in itself rather than produce a blank desktop.",
    },
    {
        'id': 'q25',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "Contoso enabled diagnostic settings on its host pool and workspace, and the AVD Insights workbook now shows connection data. The session host panels for CPU, memory, and disk are empty. What must the admin configure?",
        'options': [
            "The Monitoring Reader role assigned to administrators who open the workbook",
            "The NetworkData category added to the host pool's diagnostic setting",
            "Azure Monitor Agent on the hosts with a data collection rule for performance counters",
            "A longer data retention period configured on the Log Analytics workspace",
        ],
        'correct': 2,
        'explanation': "Insights gets service-side data such as connections from diagnostic settings, but performance counters and events from the VMs themselves come from Azure Monitor Agent governed by a data collection rule, so empty host panels mean that agent path is missing. NetworkData adds connection network metrics, not host performance counters. Retention only changes how long data is kept, and Monitoring Reader changes who can view the workbook, not what data it holds.",
    },
    {
        'id': 'q26',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "Branch-office users say sessions connect fine but feel laggy. The admin wants round-trip time and bandwidth estimates for each connection in Log Analytics. Which diagnostic category should be enabled and queried?",
        'options': [
            "HostRegistration",
            "Connection",
            "NetworkData",
            "AgentHealthStatus",
        ],
        'correct': 2,
        'explanation': "The NetworkData category records network performance for each connection, including round-trip time and bandwidth estimates, which is the evidence needed for laggy-but-working sessions. Connection records the lifecycle and outcome of a connection, which would show them succeeding. HostRegistration logs session hosts registering with the service, and AgentHealthStatus reports agent heartbeats and versions.",
    },
    {
        'id': 'q27',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "Contoso's pooled host pool must have hosts running before the 7:30 a.m. login rush each weekday, with minimal VMs running overnight and on weekends. Users must not wait for a VM to boot. What should the admin configure?",
        'options': [
            "Drain mode on the hosts except one overnight, removed each morning",
            "Reserved VM instances purchased for the full number of session hosts",
            "A scaling plan whose ramp-up phase starts hosts ahead of demand on weekdays",
            "Start VM on Connect, leaving the session hosts deallocated overnight",
        ],
        'correct': 2,
        'explanation': "A scaling plan ramp-up phase starts hosts at a scheduled time ahead of known demand and its ramp-down and off-peak phases deallocate them afterward, so users never wait for a boot. Start VM on Connect is reactive: the first users to hit a deallocated host wait for it to start, and a login rush triggers many starts at once. Drain mode does not power anything off. Reservations discount the hourly rate but do not deallocate or schedule anything.",
    },
    {
        'id': 'q28',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "Before patching one session host in a pooled host pool, the admin wants it to stop receiving new users while its current users keep working undisturbed. What should the admin do to that host?",
        'options': [
            "Lower the host pool's max session limit to the host's current session count",
            "Unassign the application group from the users currently signed in to that host",
            "Enable drain mode on that session host so it stops accepting new sessions",
            "Stop the VM from the Azure portal so users are forced to reconnect elsewhere",
        ],
        'correct': 2,
        'explanation': "Drain mode is a per-host setting that blocks new sessions while existing sessions continue untouched. Lowering the max session limit is a pool-wide change that would affect every host, not just this one. Stopping the VM disconnects the very users who were supposed to be left undisturbed. Unassigning the application group removes users' access to the published resources everywhere and does not control placement on this host.",
    },
    {
        'id': 'tf1',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two settings can be configured on a pooled host pool but not on a personal host pool? (Choose two.)",
        'options': [
            "Custom RDP properties",
            "Load-balancing algorithm",
            "Assignment type",
            "Max session limit",
            "Validation environment",
        ],
        'correct': [1, 3],
        'explanation': "Load balancing and the max session limit only make sense when many users share hosts, so they exist on pooled host pools. A personal host pool maps each user to one dedicated host and instead has an assignment type (automatic or direct), which is the near-miss here because it is the reverse case. The validation environment flag and custom RDP properties are available on both pool types.",
    },
    {
        'id': 'tf2',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso is building a Windows 11 Enterprise multi-session image for a pooled host pool, and the image must include Microsoft 365 Apps for enterprise. Several users will run the apps at the same time on each host. How should the apps be installed and licensed?",
        'options': [
            "Install with the default per-user activation, relying on each user's profile container",
            "Install with the Office Deployment Tool using shared computer activation",
            "Let each user install the apps from the Microsoft 365 portal at first sign-in",
            "Install with the default setup, then activate each host with a KMS host key",
        ],
        'correct': 1,
        'explanation': "Shared computer activation lets each signed-in user activate the apps under their own license on a host that many people share, which is what multi-session hosts require. Default per-user activation counts each host against a user's limited device installs and does not suit shared machines. Microsoft 365 Apps use user-based licensing, not a KMS host key. Per-user installs at first sign-in need rights standard users lack and would repeat on every host.",
    },
    {
        'id': 'tf3',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "Session hosts do not have to be in the delegated subnet to use an Azure NetApp Files volume; they only need network reachability to it.",
        'answer': True,
        'explanation': "The delegated subnet exists to hold the Azure NetApp Files volume's network interface and can contain only that service's resources, so session hosts live in their own subnets. Hosts in the same virtual network or a peered one mount the volume as long as routing and network security rules allow SMB traffic.",
    },
    {
        'id': 'tf4',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "RDP Shortpath for public networks can work when the session hosts have only private IP addresses.",
        'answer': True,
        'explanation': "Shortpath for public networks relies on STUN and TURN to discover public endpoints and traverse NAT, so the session host needs outbound UDP connectivity rather than a public IP address of its own. If a direct path cannot be formed, the connection falls back to the reverse connect transport.",
    },
    {
        'id': 'tf5',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "An Azure Compute Gallery image version can be shared with another subscription's admins through Azure RBAC, without copying the image into that subscription.",
        'answer': True,
        'explanation': "Galleries are shared in place: granting Azure RBAC on the gallery lets other users, groups, or subscriptions deploy from its image versions without a second copy, one of the advantages over copying managed images around by hand. Replication is a separate feature, used to place versions in the regions where hosts deploy.",
    },
    {
        'id': 'tf6',
        'cat': 'identitySecurity',
        'type': 'tf',
        'question': "Even when session hosts are joined only to on-premises AD DS, users must have identities synchronized to Microsoft Entra ID before they can be assigned to an application group.",
        'answer': True,
        'explanation': "Azure Virtual Desktop authorizes users through Microsoft Entra ID and assigns access to application groups using Entra identities, so AD DS users need to be synchronized (typically with Microsoft Entra Connect) regardless of where the hosts are joined. Domain join only affects how the hosts authenticate users once they connect.",
    },
    {
        'id': 'tf7',
        'cat': 'identitySecurity',
        'type': 'tf',
        'question': "Enabling screen capture protection on a host pool also stops users from copying content out of the session through the clipboard.",
        'answer': False,
        'explanation': "Screen capture protection blocks screenshot and screen-recording tools from capturing the session window. Clipboard redirection is a separate RDP property, so copy-and-paste out of the session must be disabled on its own if that is required.",
    },
    {
        'id': 'tf8',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "For app attach, it is enough for the users' client devices to trust the MSIX package's signing certificate; the session hosts do not need to trust it.",
        'answer': False,
        'explanation': "The package is staged and registered on the session host, so the host is the machine that validates the signature and must trust the signing certificate. Trust on the client devices is irrelevant because the application never runs or installs there.",
    },
    {
        'id': 'tf9',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "When applications are published to users as RemoteApps, assigning each RemoteApp application group only to the intended users controls who sees each app, without needing FSLogix Application Masking.",
        'answer': True,
        'explanation': "Visibility of a RemoteApp follows the user's assignment to the application group that publishes it, so separate groups per audience do the job natively. Application Masking earns its place when users receive a full desktop, where individual apps cannot be filtered by application group assignment.",
    },
    {
        'id': 'tf10',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "On multi-session session hosts, installing OneDrive per user at each person's first sign-in is the recommended approach because per-machine installs are not supported.",
        'answer': False,
        'explanation': "Per-machine installation of the OneDrive sync client is the recommended approach for AVD and similar shared environments, so it is available to every profile on the host. A per-user install at first sign-in would repeat for each user on each host and is not the guidance.",
    },
    {
        'id': 'tf11',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "The FSLogix Office Container can be used on its own, without enabling a Profile Container, for example when another solution manages the rest of the user profile.",
        'answer': True,
        'explanation': "The Office Container is a separate container for Outlook and OneDrive data and is designed to be usable with or without the Profile Container, including alongside other profile solutions. It is a configuration choice, not a dependency on the Profile Container.",
    },
    {
        'id': 'tf12',
        'cat': 'monitorMaintain',
        'type': 'tf',
        'question': "During ramp-down, autoscale places the session hosts it plans to deallocate into drain mode before shutting them down.",
        'answer': True,
        'explanation': "Drain mode is not only a manual maintenance tool: autoscale uses it during ramp-down to stop new sessions landing on hosts that are about to be powered off, then deallocates them once their sessions are gone, or after force logoff if that is configured.",
    },
    {
        'id': 'tf13',
        'cat': 'monitorMaintain',
        'type': 'tf',
        'question': "A scaling plan can power session hosts on and off as soon as it is assigned to a host pool, using the permissions of the admin who created it.",
        'answer': False,
        'explanation': "Autoscale acts through the Azure Virtual Desktop service principal, which must be granted the Desktop Virtualization Power On Off Contributor role on the subscription or resource group holding the VMs. The creating admin's own permissions are not used, so without that assignment the plan cannot start or deallocate anything.",
    },
    {
        'id': 'msq1',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two statements about pooled host pool load balancing are accurate? (Choose two.)",
        'options': [
            "Depth-first sends each new session to the host with the fewest sessions",
            "Breadth-first sends each new session to the available host with the fewest sessions",
            "Breadth-first requires a max session limit to be set",
            "Both algorithms route new sessions by the current CPU load of each host",
            "Depth-first requires a max session limit to be set",
        ],
        'correct': [1, 4],
        'explanation': "Depth-first needs a max session limit because that limit defines when a host is full and the next one is used, while breadth-first simply picks the host with the fewest sessions and does not require a limit. The statement attributing fewest-sessions routing to depth-first is the reverse of how it works: depth-first favors the busiest host that is still under its limit. Neither algorithm looks at CPU load; both route on session counts.",
    },
    {
        'id': 'msq2',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two statements about personal host pools are accurate? (Choose two.)",
        'options': [
            "With automatic assignment, a user is mapped to an unassigned session host at first connection",
            "Unassigning a user from a session host deletes that user's local profile from the VM",
            "Personal host pools distribute new sessions with breadth-first load balancing by default",
            "Unassigning a user from a session host does not erase that user's local data on the VM",
            "With direct assignment, each user picks whichever unassigned session host they prefer at sign-in",
        ],
        'correct': [0, 3],
        'explanation': "Automatic assignment maps a user to a free host the first time they connect, and unassigning only removes the mapping, so the previous user's data stays on the VM until it is cleaned or reimaged. Under direct assignment the admin chooses the host, not the user. Unassignment does not delete profiles, and personal host pools do not use load-balancing algorithms because each user has a dedicated host.",
    },
    {
        'id': 'msq3',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two capabilities does Azure Compute Gallery provide for session host images? (Choose two.)",
        'options': [
            "Replacing existing session hosts automatically whenever a new image version is published",
            "Applying Windows updates and installing apps into an image on a schedule",
            "Replicating each image version to the regions where session hosts will be deployed",
            "Running Sysprep on the reference VM before the image is captured",
            "Sharing images with other subscriptions through Azure RBAC without copying them",
        ],
        'correct': [2, 4],
        'explanation': "A gallery stores versioned images, replicates them to chosen regions, and shares them through RBAC. Customizing and updating an image on a schedule is the job of Azure Image Builder or your own build process, and the gallery does not run Sysprep either. Publishing a new version also does not swap out running session hosts; deploying hosts from the new version is a separate step.",
    },
    {
        'id': 'msq4',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two statements about RDP Shortpath are accurate? (Choose two.)",
        'options': [
            "Public networks: every session host needs a public IP address so clients can reach it",
            "If no direct UDP path forms, the session falls back to reverse connect over TCP",
            "Public networks: a VPN or ExpressRoute link to the virtual network must exist first",
            "Managed networks: traffic is relayed through a TURN server rather than flowing directly",
            "Managed networks: clients connect straight to the host's private IP over UDP, port 3390 by default",
        ],
        'correct': [1, 4],
        'explanation': "Shortpath for managed networks uses direct UDP to the host's private address, and when UDP cannot be established the session still connects over the standard reverse connect transport. Shortpath for public networks is the variant designed for clients without a private route, so requiring a VPN contradicts its purpose, and it uses STUN and TURN for NAT traversal, so hosts need no public IP. TURN relaying belongs to the public-network variant, not the direct managed-network path.",
    },
    {
        'id': 'msq5',
        'cat': 'identitySecurity',
        'type': 'ms',
        'question': "A help-desk team must set drain mode on session hosts and log off or message users' sessions, but must not create or delete host pools or application groups. Which two built-in roles should be assigned? (Choose two.)",
        'options': [
            "Desktop Virtualization User Session Operator",
            "Desktop Virtualization Contributor",
            "Desktop Virtualization Reader",
            "Desktop Virtualization Virtual Machine Contributor",
            "Desktop Virtualization Session Host Operator",
        ],
        'correct': [0, 4],
        'explanation': "Session Host Operator covers viewing and removing session hosts and changing drain mode, and User Session Operator covers messaging, disconnecting, and logging off user sessions; together they match the duties without any rights over host pools or application groups. Desktop Virtualization Contributor can create and delete AVD objects, Virtual Machine Contributor manages the VMs' power and configuration rather than AVD session objects, and Reader is view-only.",
    },
    {
        'id': 'msq6',
        'cat': 'identitySecurity',
        'type': 'ms',
        'question': "Which two controls help protect sensitive on-screen content from being captured or photographed by users? (Choose two.)",
        'options': [
            "Screen capture protection",
            "Session watermarking",
            "Disabling clipboard redirection",
            "Disabling drive redirection",
        ],
        'correct': [0, 1],
        'explanation': "Screen capture protection blocks software screenshot and recording tools, and watermarking deters photography and lets a leak be traced to a session. Disabling clipboard or drive redirection are real data-loss controls, but they stop content being copied out as data, not captured from the screen.",
    },
    {
        'id': 'msq7',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "Which two statements about delivering an application with MSIX app attach are accurate? (Choose two.)",
        'options': [
            "App attach requires each user to have a personal session host",
            "The package also has to be installed in the master image as a fallback copy",
            "The MSIX package is expanded into a VHDX, VHD, or CIM image stored on an SMB share",
            "The application's files are not installed into the session host's operating system image",
            "Each user needs local administrator rights on the session host to mount the image",
        ],
        'correct': [2, 3],
        'explanation': "App attach works from a disk image (VHDX, VHD, or CIM) built from the MSIX package and placed on a share the hosts can reach, and the application is attached at sign-in rather than installed into the OS image. Mounting is done by the system, not by users with admin rights, no fallback copy in the image is needed, and app attach works on pooled host pools.",
    },
    {
        'id': 'msq8',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "Contoso wants Outlook and OneDrive data kept in a separate VHD(X) from the main profile, and every container replicated to a second region's storage. Which two FSLogix capabilities should be used? (Choose two.)",
        'options': [
            "Redirections.xml",
            "Office Container",
            "Cloud Cache",
            "Application Masking",
        ],
        'correct': [1, 2],
        'explanation': "The Office Container supplies the separate container for Outlook and OneDrive data, and Cloud Cache supplies replication to storage in another region. Application Masking only hides applications, and Redirections.xml excludes or redirects folders within the profile; neither separates data into its own container or replicates it.",
    },
    {
        'id': 'msq9',
        'cat': 'monitorMaintain',
        'type': 'ms',
        'question': "Which two approaches patch pooled session hosts without leaving user sessions running on a host while it is being patched? (Choose two.)",
        'options': [
            "Use scheduled agent updates to install the monthly Windows cumulative update",
            "Deploy new hosts from a patched gallery image version, then retire the old hosts",
            "Place a host in drain mode, wait for users to leave or log them off, then patch it in place",
            "Patch hosts in place while they keep accepting sessions, relying on FSLogix to preserve user state",
            "Raise the ramp-down capacity threshold so patching runs when hosts are busy",
        ],
        'correct': [1, 2],
        'explanation': "Both image-based replacement and drain-then-patch avoid user sessions on a host mid-patch: the first never patches a live host, and the second empties it first. Patching live hosts leaves sessions running on them, and FSLogix preserves profile data, not a session interrupted by a reboot. Scheduled agent updates cover only the AVD agent and side-by-side stack, not Windows cumulative updates, and the capacity threshold is an autoscale setting unrelated to patching.",
    },
    {
        'id': 'q29',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Contoso will give 300 users pooled Windows 11 multi-session desktops in Azure Virtual Desktop and wants no additional AVD-specific license purchases. Which two existing licenses entitle a user to access these desktops? (Choose two.)",
        'options': [
            "Windows 11 Enterprise E3",
            "Microsoft 365 Apps for enterprise",
            "Microsoft 365 E3",
            "Microsoft 365 Business Basic",
            "Office 365 E3",
        ],
        'correct': [0, 2],
        'explanation': "Access to Windows client desktops in Azure Virtual Desktop comes with qualifying Windows or Microsoft 365 licenses such as Microsoft 365 E3 or Windows Enterprise E3; there is no separate AVD per-user access license, so the organization pays only for the Azure infrastructure. Office 365 E3, Microsoft 365 Business Basic, and Microsoft 365 Apps for enterprise include productivity services but no Windows license rights, even though the first looks similar to the correct E3 plan.",
    },
    {
        'id': 'q30',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Analysts use dedicated VMs in a personal host pool at unpredictable times. Finance wants each VM to start automatically when its analyst connects, and to be deallocated half an hour after the analyst's session ends, with no admin intervention. Which configuration achieves this?",
        'options': [
            "Start VM on Connect plus a personal scaling plan that deallocates VMs after disconnect",
            "Start VM on Connect alone, without a scaling plan assigned to the host pool",
            "A personal scaling plan whose ramp-up schedule powers on the whole pool at 8 a.m.",
            "A pooled-style scaling plan with a capacity threshold and a minimum percentage of hosts",
        ],
        'correct': 0,
        'explanation': "Start VM on Connect covers the on-demand start, and a personal host pool scaling plan supplies the timed deallocation after disconnect or sign-out, so together they remove the admin from both halves. Start VM on Connect alone never deallocates anything. A pooled-style plan is built around capacity thresholds and host percentages and does not fit a pool where each VM belongs to one user. A fixed 8 a.m. ramp-up powers on every VM whether or not its analyst shows up, which is the opposite of the unpredictable pattern described.",
    },
    {'id': 'q31',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A contractor must reach a published desktop from a personal Android tablet. Company policy '
                 'bans installing remote-access software on unmanaged devices, and the contractor has no Windows '
                 'PC. Which access method meets the policy?',
     'options': ['The Azure Virtual Desktop Store app',
                 'Windows App in a supported web browser',
                 'The Windows App client installed from Google Play',
                 'A RemoteApp and Desktop Connections feed URL added in Control Panel'],
     'correct': 1,
     'explanation': 'Windows App runs in a supported web browser, so nothing needs to be installed on the '
                    'tablet. The Google Play client is still an installed app, the Store app is a Windows '
                    'application, and RemoteApp and Desktop Connections is a Windows Control Panel feature, '
                    'which rules it out for an Android tablet. The older Remote Desktop web client is no longer '
                    'supported for public cloud, so Windows App in the browser is the current route.'},
    {
        'id': 'q32',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso's Entra-joined session hosts are managed with Intune and all share one local administrator password. Security wants each host to have its own automatically changing local admin credential, recoverable by admins from the cloud directory. What should the admin deploy?",
        'options': [
            "An eligible Virtual Machine Administrator Login assignment through Privileged Identity Management",
            "The legacy Microsoft LAPS agent that backs passwords up to Active Directory",
            "A Windows LAPS policy from Intune that backs rotated passwords up to Microsoft Entra ID",
            "An Azure Key Vault secret holding one rotated password pushed through a VM extension",
        ],
        'correct': 2,
        'explanation': "Windows LAPS can randomize and rotate each device's local administrator password and back it up to Microsoft Entra ID, deployable to Intune-managed devices. Legacy LAPS stores passwords only in Active Directory, which these hosts are not joined to. A single Key Vault password is still one password shared by every host. A Privileged Identity Management assignment grants just-in-time Entra sign-in rights, not unique, rotated passwords for the local account.",
    },
    {
        'id': 'q33',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso's Research host pool must prevent users from copying files to their local drives through the session, and other host pools must be unaffected. The admin does not want to modify the session host images. What should be configured?",
        'options': [
            "Disable drive redirection in the Research host pool's RDP properties",
            "Add an NSG rule on the session host subnet that denies outbound traffic to the client network",
            "Add a Redirections.xml exclusion for the client drives",
            "Enable screen capture protection on the Research host pool",
        ],
        'correct': 0,
        'explanation': "Drive redirection is controlled by an RDP property set per host pool, so changing it on the Research pool affects only that pool and needs no image changes. Screen capture protection blocks screenshots, not file copies. Drive redirection travels inside the RDP connection rather than as separate network traffic, so an NSG rule would not stop it. Redirections.xml governs FSLogix profile folders and has nothing to do with client drives.",
    },
    {
        'id': 'q34',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "Users report choppy Teams audio and video in their AVD sessions, and session host CPU spikes whenever calls start because the host encodes and decodes the media itself. Teams is already installed per-machine on the image. What should be enabled?",
        'options': [
            "GPU-enabled session host VM sizes with GPU drivers installed on the image",
            "Teams media optimization, with the WebRTC Redirector Service on the session hosts",
            "RDP Shortpath for public networks, so media travels over a UDP transport",
            "Multimedia redirection, with its host component and browser extension installed",
        ],
        'correct': 1,
        'explanation': "Teams media optimization moves call audio and video processing to the user's client device, removing the encode and decode load from the shared host. Multimedia redirection targets video playback on supported websites, not Teams calls. Shortpath improves the transport but the host would still do the media processing. GPU-enabled sizes help rendering workloads and add cost without moving Teams media off the host.",
    },
    {
        'id': 'q35',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "An autoscale scaling plan's ramp-up phase should start an additional session host once the running hosts reach 80% of their combined session capacity, rather than waiting until they are completely full. Which scaling plan setting controls this?",
        'options': [
            "The max session limit on the host pool",
            "The minimum percentage of hosts to keep running",
            "The capacity threshold percentage",
            "The load-balancing algorithm for the phase",
        ],
        'correct': 2,
        'explanation': "The capacity threshold is the percentage of combined session capacity in use that triggers starting another host. The minimum percentage of hosts sets how many hosts are kept on, not a utilization trigger. The max session limit defines each host's capacity, the denominator the threshold is measured against, but does not itself trigger anything. The load-balancing algorithm only decides how sessions are placed on hosts already running.",
    },
    {
        'id': 'tf14',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "A Microsoft 365 E3 license entitles a user to access Windows Server session hosts in Azure Virtual Desktop without any additional licensing.",
        'answer': False,
        'explanation': "Microsoft 365 E3 includes the Windows client license rights that cover Windows 10 or 11 desktops in AVD. Windows Server session hosts are licensed differently and require Remote Desktop Services client access licenses with active Software Assurance or RDS user subscription licenses.",
    },
    {
        'id': 'tf15',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "With media optimization for Microsoft Teams enabled, Teams runs entirely on the client device, so the Teams app does not need to be installed on the session host.",
        'answer': False,
        'explanation': "The Teams app still runs inside the session on the host; optimization offloads only the real-time audio, video, and screen-sharing media processing to the client device. Teams must still be installed on the image, along with the redirector component that makes the offload possible.",
    },
    {
        'id': 'tf16',
        'cat': 'monitorMaintain',
        'type': 'tf',
        'question': "The Log Analytics workspace that receives Azure Virtual Desktop diagnostic logs must be in the same Azure region as the host pool.",
        'answer': False,
        'explanation': "Diagnostic settings can send logs to a Log Analytics workspace in a different region or subscription from the resource being monitored. Workspace placement is a design decision about data residency, retention, and cost, not a regional requirement of the host pool.",
    },
    {
        'id': 'msq11',
        'cat': 'identitySecurity',
        'type': 'ms',
        'question': "Which two statements about hardening Azure Virtual Desktop session hosts are accurate? (Choose two.)",
        'options': [
            "Drive redirection can be disabled through Group Policy but not through host pool RDP properties",
            "Screen capture protection also blocks users from using clipboard redirection",
            "Windows LAPS can store each host's rotated local administrator password in Microsoft Entra ID",
            "Custom RDP properties set on a host pool apply to every session host in that pool",
            "Legacy LAPS can back up rotated passwords for Entra-joined session hosts to Microsoft Entra ID",
        ],
        'correct': [2, 3],
        'explanation': "Windows LAPS supports backup to Microsoft Entra ID, and RDP properties are configured per host pool so they cover every host in it. Legacy LAPS backs up only to Active Directory. Drive redirection can be disabled with a host pool RDP property as well as with Group Policy. Screen capture protection blocks screenshots only; clipboard redirection is a separate property.",
    },
    {
        'id': 'msq10',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "Which two statements about running Microsoft Teams with media optimization on a multi-session host pool are accurate? (Choose two.)",
        'options': [
            "Teams should be installed on the master image with a machine-wide (per-machine) installation",
            "MSIX app attach must be used to deliver Teams to the session hosts",
            "The Remote Desktop WebRTC Redirector Service must be installed on the session hosts",
            "Media optimization removes the need to install Teams on the session hosts",
            "Media optimization is available for personal host pools but not pooled ones",
        ],
        'correct': [0, 2],
        'explanation': "Media optimization needs the WebRTC Redirector Service on the hosts, and on a shared multi-session image Teams is installed machine-wide so every user can run it. Teams is not tied to MSIX app attach, and optimization does not replace the Teams install because the app still runs on the host. Optimization works on pooled host pools as well as personal ones.",
    },
    {
        'id': 'q36',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso's 150 knowledge workers each need their own persistent cloud PC for a full workday. Finance wants a flat, predictable monthly price per user, and IT does not want to size or scale any host infrastructure. Which solution fits best?",
        'options': [
            "Windows 365 Enterprise Cloud PCs",
            "Azure Virtual Desktop pooled host pool with FSLogix Profile Containers",
            "Azure Virtual Desktop personal host pool with a scaling plan",
            "Windows 365 Frontline Cloud PCs",
        ],
        'correct': 0,
        'explanation': "Windows 365 Enterprise gives each user a dedicated Cloud PC at a fixed per-user monthly price with no host pool or scaling plan to manage. Frontline is priced and designed for shift workers who share Cloud PCs, so it does not suit people who each need their own all day. An AVD personal host pool is billed by Azure consumption and still requires building and scaling the pool, and a pooled host pool shares VMs rather than dedicating one per person.",
    },
    {
        'id': 'q37',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "One FSLogix user's profile container has reached its configured maximum size, and the user can no longer save settings. The admin must fix this without deleting the user's profile data. SizeInMBs is still at its default of 30 GB. What should the admin do?",
        'options': [
            "Raise SizeInMBs and extend the user's existing VHD(X), since the setting applies only to new containers",
            "Enable IsDynamic so the container can grow beyond its configured maximum size",
            "Raise SizeInMBs and have the user sign in again, so FSLogix expands the existing container automatically",
            "Delete the user's container so FSLogix creates a new one at the larger size",
        ],
        'correct': 0,
        'explanation': "SizeInMBs is applied when a container is created, so an existing container must be extended as well, for example with the FSLogix frx extend-vhd command or by resizing the virtual disk, which keeps all existing data. Raising only the setting leaves the current container at its old size. IsDynamic controls whether space is allocated as data is written, not how large the container may grow. Deleting the container creates a new one but destroys the profile data the admin was told to keep.",
    },
    {
        'id': 'q38',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "An admin applies a scaling plan to a personal host pool expecting the same capacity-threshold-based start of additional hosts that a pooled host pool gets, but finds no capacity threshold or load-balancing setting. Which statement explains the behavior?",
        'options': [
            "The plan creates new session hosts from the pool's image whenever assigned users exceed the running VMs",
            "The plan is applied as a pooled-type plan, but the portal hides the capacity settings for personal pools",
            "A personal scaling plan manages each dedicated VM's power state through schedules and disconnect or sign-out actions",
            "Personal host pools do not support scaling plans, so the admin should use Start VM on Connect instead",
        ],
        'correct': 2,
        'explanation': "Each VM in a personal host pool belongs to one user, so there is no shared capacity to balance; a personal scaling plan therefore works on power state through schedule phases and actions taken when a user disconnects or signs out. A pooled-type plan cannot be assigned to a personal pool, so nothing is hidden. Personal pools do support scaling plans, and Start VM on Connect complements rather than replaces them. Autoscale never creates VMs in either pool type; it starts and deallocates existing ones.",
    },
    {
        'id': 'q39',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "An auditor asks which Azure Virtual Desktop responsibilities remain with Contoso rather than Microsoft. Which two items must Contoso handle itself? (Choose two.)",
        'options': [
            "Operating the AVD gateway that brokers client connections",
            "Installing operating system updates on the session hosts",
            "Patching the Azure Virtual Desktop connection broker",
            "Securing the virtual network and profile storage",
            "Hosting the Remote Desktop Web Access feed endpoint",
        ],
        'correct': [1, 3],
        'explanation': "The data plane runs in the customer's subscription, so Contoso patches the session host operating systems and secures the network and profile storage it provisions. The broker, gateway, and web access feed are part of the control plane, which Microsoft hosts, patches, and operates outside the customer's subscription.",
    },
    {
        'id': 'q40',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Users on Microsoft Entra-joined session hosts sign in to the feed with Windows Hello for Business, yet are prompted for credentials again when the session starts. The admin wants to remove only the second prompt, keeping Conditional Access in place. What should be configured?",
        'options': [
            "A longer Conditional Access sign-in frequency for the Azure Virtual Desktop app",
            "Single sign-on with Microsoft Entra authentication in the host pool's RDP properties",
            "Windows Hello for Business enrollment on each session host",
            "An exclusion of the Azure Virtual Desktop app from the Conditional Access policy",
        ],
        'correct': 1,
        'explanation': "The second prompt is the sign-in to the session host; enabling single sign-on with Microsoft Entra authentication on the host pool lets that connection use the identity already established, removing the prompt while Conditional Access still applies. Windows Hello for Business is not enrolled on remote hosts and does not pass the client's sign-in through. Excluding the app weakens security and does not address the host prompt, and a longer sign-in frequency changes how often the feed re-authenticates, not the in-session prompt.",
    },
    {
        'id': 'q41',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Contoso uses Start VM on Connect on its host pools but has no scaling plans. Security wants the Azure Virtual Desktop service principal to hold only the permissions needed to power on session host VMs, with no ability to deallocate, resize, or delete them. Which built-in role should be assigned?",
        'options': [
            "Desktop Virtualization Power On Off Contributor",
            "Desktop Virtualization Session Host Operator",
            "Desktop Virtualization Power On Contributor",
            "Desktop Virtualization Virtual Machine Contributor",
        ],
        'correct': 2,
        'explanation': "Start VM on Connect only needs to power VMs on, and Power On Contributor grants exactly that. Power On Off Contributor is the near-miss: it is what autoscale needs because scaling plans must also deallocate, so it grants more than this scenario allows. Virtual Machine Contributor is far broader, and Session Host Operator manages session host objects such as drain mode rather than VM power state.",
    },
    {
        'id': 'q42',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A cloud-first company has no on-premises print servers. Its printers support Universal Print natively, and users sign in from many offices. The admin wants printing from AVD sessions that does not depend on each user's local client printer being redirected. What should the admin use?",
        'options': [
            "The printer vendor's driver installed on the master image, with printers mapped by Group Policy",
            "The Remote Desktop Easy Print driver to redirect each client's local printers",
            "An Azure Files share holding printer drivers that sessions mount at sign-in",
            "Universal Print, with printers shared to the users' groups",
        ],
        'correct': 3,
        'explanation': "Universal Print is a cloud print service: printers registered with it are shared to groups and reachable from sessions without client redirection or a print server. Easy Print depends on redirecting the client's own printers, which the requirement rules out. Installing vendor drivers on the image and mapping printers by policy assumes a print server and ties the image to driver updates. A share of drivers is not a print path at all.",
    },
    {
        'id': 'q43',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A vendor's line-of-business app is available only as a Win32 installer that also installs a kernel-mode driver, and the vendor does not support MSIX packaging. Every user of the host pool needs it. Which delivery approach works?",
        'options': [
            "Publish it as a RemoteApp, which installs the application on first launch",
            "Repackage it with the MSIX Packaging Tool and deliver it through app attach",
            "Place the installer in each user's FSLogix profile container so it follows them",
            "Install it on the session hosts using Intune Win32 app deployment or in the master image",
        ],
        'correct': 3,
        'explanation': "An app that installs a kernel-mode driver has to be installed into the operating system, which Intune Win32 deployment or the master image does, and since every user needs it, a host-wide install is appropriate. MSIX packages cannot carry kernel drivers, so repackaging for app attach would not work. A RemoteApp only publishes an application that is already installed. A profile container roams user profile data and cannot carry a machine-level install.",
    },
    {
        'id': 'q44',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "The host pool's Session Hosts page shows several hosts as Needs Assistance. The admin wants to see each host's last heartbeat, the versions of the AVD components installed on it, and its upgrade state in Log Analytics. Which table should be queried?",
        'options': [
            "The WVDHostRegistrations table",
            "The WVDConnections table",
            "The WVDErrors table",
            "The WVDAgentHealthStatus table",
        ],
        'correct': 3,
        'explanation': "WVDAgentHealthStatus records periodic health reports from the agent on each host, including heartbeat, agent and side-by-side stack versions, and upgrade state. WVDHostRegistrations logs the event of a host registering with the service rather than ongoing health. WVDConnections tracks user connection lifecycles, and WVDErrors captures failures of AVD activities, not per-host health snapshots.",
    },
    {
        'id': 'tf17',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "If a user disconnects and later signs in again to the same pooled host pool, the broker reconnects them to their existing session instead of creating a new one.",
        'answer': True,
        'explanation': "The broker looks for a user's existing session in the host pool before applying the load-balancing algorithm, which preserves open applications and avoids a second session. This also matters for FSLogix, because a profile container can be attached by only one session at a time.",
    },
    {
        'id': 'tf18',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "Azure Hybrid Benefit provides the same per-core Windows Server licensing discount to Windows 11 Enterprise multi-session session host VM compute as it does to Windows Server workloads.",
        'answer': False,
        'explanation': "Windows 10 and 11 multi-session VM compute is not eligible for the same per-core Azure Hybrid Benefit discount that Windows Server workloads receive, because the client license rights come with the user's Windows or Microsoft 365 license. The realistic cost levers for multi-session pools are autoscale and Reserved Instances or Savings Plans on the compute.",
    },
    {
        'id': 'tf19',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "Choosing a GPU-enabled VM size and installing the GPU driver on the image is not enough by itself to get GPU-accelerated rendering inside sessions; a Group Policy or equivalent setting must also be configured.",
        'answer': True,
        'explanation': "Remote sessions use the software graphics adapter by default, so the hosts also need the policy that makes sessions use the hardware GPU, along with related encoding settings. Without it, the GPU sits idle even though the VM size and driver are correct. Concurrent sessions on a multi-session host then still share that one GPU's capacity.",
    },
    {
        'id': 'tf20',
        'cat': 'identitySecurity',
        'type': 'tf',
        'question': "Session hosts with no public IP address still need an explicit outbound path, such as NAT Gateway or Azure Firewall, to reach the required Azure Virtual Desktop service endpoints.",
        'answer': True,
        'explanation': "Because AVD uses a reverse connect model, the host only makes outbound connections, but they must succeed. A host without a public IP needs a deliberate outbound route to the WindowsVirtualDesktop service tag and required FQDNs, such as through a NAT gateway or a firewall, rather than relying on implicit internet access.",
    },
    {
        'id': 'msq12',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two statements about Azure Virtual Desktop and Windows 365 Enterprise Cloud PCs are accurate? (Choose two.)",
        'options': [
            "Cloud PCs require the customer to build and scale their own host pools",
            "AVD can serve many users from shared multi-session hosts, while a Cloud PC serves one assigned user",
            "Cloud PCs can publish individual RemoteApp programs from a shared pool of VMs",
            "AVD bills a flat monthly fee per user that includes the underlying compute",
            "A Cloud PC is billed at a fixed monthly price per user rather than by Azure consumption",
        ],
        'correct': [1, 4],
        'explanation': "Windows 365 trades flexibility for a predictable per-user monthly price and a dedicated single-user VM, while AVD is billed on consumption and uniquely supports pooled multi-session hosts. Cloud PCs have no customer-managed host pools to build or scale, AVD's compute is billed by Azure usage rather than a flat per-user fee, and a Cloud PC is not a shared pool that can publish RemoteApps.",
    },
    {
        'id': 'msq13',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "Which two approaches deliver an application to one department's users without changing the shared master image? (Choose two.)",
        'options': [
            "A RemoteApp group on a separate host pool whose own image already has the app",
            "FSLogix Redirections.xml entries covering the app's install folder",
            "FSLogix Application Masking rules applied on the shared image",
            "Intune Win32 app deployment to the session hosts of the shared host pool",
            "MSIX app attach with the package assigned to that department",
        ],
        'correct': [0, 4],
        'explanation': "App attach brings the app in per user at sign-in without touching the image, and a dedicated pool built from its own image keeps the shared image unchanged. Intune Win32 deployment installs the app on every host of the shared pool for all of its users. Application Masking only hides an app that is already installed in the shared image, and Redirections.xml decides what is stored in a profile container, not what is installed.",
    },
    {
        'id': 'msq14',
        'cat': 'monitorMaintain',
        'type': 'ms',
        'question': "Contoso wants to keep AVD agent updates out of business hours and still apply monthly Windows updates. Which two actions meet these goals? (Choose two.)",
        'options': [
            "Turn on the Validation environment setting so production pools skip agent updates",
            "Leave the session hosts in drain mode during business hours so updates do not run",
            "Patch Windows through Azure Update Manager, Configuration Manager, or WSUS",
            "Configure scheduled agent updates with an after-hours maintenance window on the host pool",
            "Rely on scheduled agent updates to install the monthly Windows cumulative updates",
        ],
        'correct': [2, 3],
        'explanation': "Scheduled agent updates control when the AVD agent and side-by-side stack may update, and Windows updates remain the job of Update Manager, Configuration Manager, or WSUS. Scheduled agent updates do not touch the operating system. The validation environment setting makes a pool receive updates earlier, not skip them, and drain mode only blocks new sessions without stopping updates.",
    },
    {
        'id': 'q45',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso brings in 40 contractors who each need a persistent VM with their own installed tools for the length of a project. Contractors change every few weeks, and admins do not want to maintain a user-to-VM list. When a contractor leaves, the VM should become reusable. Which approach fits?",
        'options': [
            "A pooled host pool with a max session limit of 1 and FSLogix Profile Containers",
            "A personal host pool with direct assignment, pre-assigning each VM to a named contractor",
            "A pooled host pool with breadth-first load balancing and Application Masking",
            "A personal host pool with automatic assignment, unassigning leavers' hosts to free them",
        ],
        'correct': 3,
        'explanation': "Personal hosts keep installed tools, and automatic assignment maps each new contractor to a free host at first connection with no list to maintain; unassigning a leaver returns the host to the available set, though the previous user's data stays on the VM until it is cleaned or reimaged. Direct assignment requires an admin-maintained mapping. Pooled designs, even limited to one session per host, roam the profile but do not keep locally installed tools tied to a particular VM.",
    },
    {
        'id': 'q46',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A scaling plan for a pooled host pool of 30 session hosts sets the ramp-up minimum percentage of hosts to 20% and the capacity threshold to 60%. Every host is deallocated and nobody is signed in when ramp-up begins. How many session hosts will autoscale start at the beginning of ramp-up?",
        'options': [
            "0 hosts, because autoscale waits for the first connection",
            "6 hosts, which is 20% of the 30 session hosts",
            "1 host, the minimum needed to accept a first sign-in",
            "18 hosts, which is 60% of the 30 session hosts",
        ],
        'correct': 1,
        'explanation': "The minimum percentage of hosts is the share of the pool autoscale brings online at ramp-up regardless of current demand, so 20% of 30 is 6. The capacity threshold is a different setting: it determines when additional hosts start after sessions begin using the capacity of those running, and it is not a count of hosts to start. Autoscale does not wait for the first connection when a minimum is configured.",
    },
    {
        'id': 'q47',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A pooled host pool has three running session hosts, each with a max session limit of 10. The ramp-up capacity threshold is 60%, and 18 users are currently signed in. A nineteenth user signs in. What does autoscale do?",
        'options': [
            "It rejects the sign-in until an admin starts another host manually",
            "It starts nothing, since each host still has open slots below its max session limit",
            "It starts nothing, since the threshold is evaluated once at the start of ramp-up",
            "It starts another host, because 19 of 30 slots (about 63%) is above the 60% trigger",
        ],
        'correct': 3,
        'explanation': "The capacity threshold compares sessions in use with the combined capacity of running hosts (here 3 x 10 = 30 slots), and 19 of 30 is about 63%, above 60%, so autoscale starts another host before the pool fills. Open slots on individual hosts are irrelevant because the threshold exists to add capacity before hosts are full. Autoscale is not a manual process, and it re-evaluates repeatedly rather than once.",
    },
    {
        'id': 'q48',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "Help-desk staff must be able to sign in as local administrators to specific Microsoft Entra-joined session hosts for troubleshooting, while regular users sign in as standard users. How should the admin grant this?",
        'options': [
            "Assign Desktop Virtualization Contributor to the help-desk group on the host pool",
            "Assign Virtual Machine User Login to the help-desk group on those session hosts",
            "Assign Virtual Machine Contributor to the help-desk group on those session hosts",
            "Assign Virtual Machine Administrator Login to the help-desk group on those session hosts",
        ],
        'correct': 3,
        'explanation': "Virtual Machine Administrator Login lets a user sign in to an Entra-joined VM with local administrator rights, scoped to the hosts where it is assigned. Virtual Machine User Login grants standard sign-in only, which is what regular users need. Desktop Virtualization Contributor manages AVD objects, not operating system sign-in, and Virtual Machine Contributor manages the VM resource in Azure without granting the right to sign in to it.",
    },
    {
        'id': 'q49',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "A hospital enables screen capture protection on a host pool and also deploys watermarking. A clinician then photographs the screen with a personal smartphone. Which statement about the two controls is accurate?",
        'options': [
            "Screen capture protection blocks the photo by disabling the client device's camera during the session",
            "Together the two controls make photographing the screen technically impossible",
            "The watermark blocks the photo by scrambling the display whenever a camera is detected",
            "Neither stops an external camera: one blocks software capture, the other deters and helps trace",
        ],
        'correct': 3,
        'explanation': "Both controls work on the client's software and rendering layer: screen capture protection blocks screenshot and recording tools, and watermarking overlays traceable information as a deterrent. Neither can interfere with a separate camera pointed at the screen. Screen capture protection does not disable cameras, the watermark does not detect or react to cameras, and the pair do not close the external-camera gap.",
    },
    {
        'id': 'q50',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "FSLogix Profile Containers are kept deliberately small with Redirections.xml exclusions. The admin still wants each user's Outlook cached data and OneDrive files to roam fully. Which approach meets both goals?",
        'options': [
            "Keep the trimmed Profile Container and also enable the Office Container for that data",
            "Turn on OneDrive Known Folder Move to move the Outlook cache into OneDrive",
            "Enable Cloud Cache so Outlook data is held in a local cache and synced",
            "Increase SizeInMBs on the Profile Container so the Outlook cache fits",
        ],
        'correct': 0,
        'explanation': "The Office Container is a separate container for Outlook and OneDrive data, so that data roams in full while the Profile Container stays small under its existing exclusions. Enlarging the Profile Container works against the goal of keeping it small. Cloud Cache adds replication and a local cache, not a separate store for Office data, and Known Folder Move redirects Desktop, Documents, and Pictures, not the Outlook cache.",
    },
    {
        'id': 'q51',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "FSLogix profile containers are stored on an Azure Files share with AD DS authentication enabled, and NTFS permissions are set correctly. Clinicians still fall back to temporary profiles with 'Access is denied' errors. Which assignment is most likely missing?",
        'options': [
            "Storage File Data SMB Share Contributor for the clinicians' group on the share",
            "Storage Blob Data Contributor for the clinicians' group on the share's storage account",
            "Desktop Virtualization User for the clinicians' group on the share's storage account",
            "Storage Account Contributor for the clinicians' group on the share's storage account",
        ],
        'correct': 0,
        'explanation': "Accessing an Azure Files share over SMB with identity-based authentication needs two layers: a share-level Azure role such as Storage File Data SMB Share Contributor and the NTFS permissions, and only the second was configured. Blob Data Contributor covers blob data, not file shares. Storage Account Contributor is a management-plane role that does not grant access to file data, and Desktop Virtualization User only governs access to application groups.",
    },
    {
        'id': 'q52',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "After ramp-down, several session hosts were still running. The admin wants evidence of what autoscale evaluated and why it skipped those hosts. Which data source shows this?",
        'options': [
            "The scaling plan's diagnostic settings, sending autoscale logs to a Log Analytics workspace",
            "The Azure Activity Log filtered to deallocate operations on the session host VMs",
            "The Connection diagnostic category on the host pool, queried in Log Analytics",
            "Reliability Monitor history on each of the session hosts that kept running",
        ],
        'correct': 0,
        'explanation': "A scaling plan can send its own autoscale logs to Log Analytics, recording each evaluation, the hosts considered, and the actions taken or skipped, which is the reasoning the admin needs. The Activity Log shows operations that actually happened, so it would reveal deallocations but not why a host was skipped. The Connection category describes user connections, and Reliability Monitor reports a machine's stability, not autoscale decisions.",
    },
    {'id': 'q53',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A new pooled host pool, its Desktop application group, and a workspace are created. The '
                 'application group is registered with the workspace and the session hosts show Available, yet '
                 'users see an empty feed in Windows App. What is most likely missing?',
     'options': ['A direct assignment of each user to a session host',
                 "An assignment of the users' group to the application group",
                 'Membership of the users in the local Remote Desktop Users group on each session host',
                 'The Desktop Virtualization User role assigned on the host pool resource'],
     'correct': 1,
     'explanation': 'The feed lists only the application groups a user is assigned to, so an unassigned group '
                    'leaves the feed empty even when everything else is healthy. A role granted on the host pool '
                    "resource does not give access to the application group's published resources. Local group "
                    'membership on hosts affects sign-in to a host, not whether the feed shows anything, and '
                    'direct assignment is a personal host pool concept that is not involved in the feed.'},
    {
        'id': 'q54',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "A team builds session host images by signing in to a reference VM, installing apps and updates by hand, running Sysprep, and capturing the result. They want a declarative, repeatable template that customizes the image and produces a new image version on demand. Which service should they adopt?",
        'options': [
            "Azure DevTest Labs custom images",
            "Azure Image Builder",
            "Azure Update Manager",
            "Azure Compute Gallery",
        ],
        'correct': 1,
        'explanation': "Azure Image Builder takes a template describing a source image, customization steps such as installs, updates, and scripts, and a distribution target, then builds the image repeatably. Azure Compute Gallery stores and replicates the finished versions but does not build them. Update Manager patches existing VMs, and DevTest Labs custom images are captured from a VM that someone prepared by hand, which is the manual process being replaced.",
    },
    {
        'id': 'q55',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "Contoso runs a pooled host pool with its FSLogix share in a single Azure region. The business requires users to keep working if that entire region becomes unavailable. Which design meets the requirement?",
        'options': [
            "Session hosts spread across availability zones, with a zone-redundant file share, in the same region",
            "A second host pool in another region, built from a replicated gallery image, with profile storage replicated or duplicated there",
            "Rely on the Microsoft-managed control plane, which fails over each customer host pool to another region",
            "Additional session hosts in a second region added to the existing host pool, with profiles left on the original share",
        ],
        'correct': 1,
        'explanation': "Regional disaster recovery has to be built in the customer-owned data plane: a host pool in a secondary region needs a usable image there and reachable profile data, so image replication and storage replication or duplication are both required. Availability zones protect against a datacenter failure inside a region, not the loss of the region. Extra hosts that still depend on the original region's profile share leave profiles unavailable, and the control plane has no customer-facing failover that moves a host pool for you.",
    },
    {
        'id': 'q56',
        'cat': 'planInfra',
        'type': 'mc',
        'question': "RDP Shortpath for managed networks is enabled on the session hosts. Clients connect over a corporate VPN with a private route to the hosts' subnet. Sessions work, but every connection still uses the TCP gateway path and no error is shown. What is the most likely cause?",
        'options': [
            "Outbound TCP 443 from the session hosts to the AVD service endpoints is blocked",
            "The session hosts are unable to reach the public STUN and TURN endpoints over UDP",
            "The session hosts are not hybrid Entra-joined to the on-premises domain",
            "A firewall or NSG on the path blocks UDP port 3390 between the VPN clients and the hosts",
        ],
        'correct': 3,
        'explanation': "Shortpath for managed networks needs a direct UDP path, by default to port 3390, between client and host; when something on that path drops UDP, the connection quietly falls back to the gateway over TCP. STUN and TURN reachability matters for the public-network variant, not this one. If outbound TCP 443 to the service were blocked, hosts would fail to register and sessions would not work at all, and the join type has no effect on Shortpath.",
        'whyTested': "Shortpath failures are silent because the fallback works, so the exam describes the symptom (sessions work, just over TCP) and expects you to identify the missing UDP path rather than a failure that would break sessions entirely.",
    },
    {
        'id': 'tf21',
        'cat': 'planInfra',
        'type': 'tf',
        'question': "An NSG rule allowing inbound TCP 3389 from the internet is required so the Azure Virtual Desktop gateway can reach the session hosts.",
        'answer': False,
        'explanation': "Session hosts initiate an outbound reverse connect to the AVD service, and the gateway never connects inward to them, so no inbound internet-facing RDP rule is needed. Opening one would only add attack surface.",
    },
    {
        'id': 'msq15',
        'cat': 'planInfra',
        'type': 'ms',
        'question': "Which two statements about Start VM on Connect are accurate? (Choose two.)",
        'options': [
            "A scaling plan has to be assigned to the host pool before it starts VMs",
            "The AVD service principal needs a role that lets it power on session host VMs",
            "It is enabled per host pool, and works for pooled and personal host pools",
            "It deallocates idle session hosts automatically after the last user signs out",
            "It starts VMs at a fixed time each morning, based on a configured schedule",
        ],
        'correct': [1, 2],
        'explanation': "Start VM on Connect is a host pool setting available for both pool types, and it works through the Azure Virtual Desktop service principal, which must hold a role that permits powering on the VMs. It does not depend on a scaling plan, it reacts to a connection attempt rather than running on a schedule, and it only starts VMs; deallocating idle ones is a scaling plan job.",
    },
    {
        'id': 'q57',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "A user assigned the Desktop Virtualization User role sees the published desktop in the feed, but sign-in is rejected at the Windows lock screen on a Microsoft Entra-joined session host. The user should sign in as a standard user. What is most likely missing?",
        'options': [
            "Reader on the session host VMs and their resource group",
            "Desktop Virtualization Session Host Operator on the host pool",
            "Virtual Machine User Login on the session hosts or their resource group",
            "Virtual Machine Administrator Login on the session hosts or their resource group",
        ],
        'correct': 2,
        'explanation': "Signing in to an Entra-joined VM requires a VM login role in addition to the Desktop Virtualization User role that exposes the resource in the feed, and Virtual Machine User Login grants standard-user sign-in. Administrator Login would also work but gives local admin rights, more than a standard user should have. Session Host Operator manages hosts rather than authorizing sign-in, and Reader does not permit interactive sign-in.",
    },
    {
        'id': 'q58',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "A governance team needs to view host pool, application group, and workspace configuration in the portal, but must not be able to change anything or view or manage other resources such as VMs and storage accounts. Which role should be assigned?",
        'options': [
            "Desktop Virtualization Session Host Operator at the resource group scope",
            "Desktop Virtualization Reader at the resource group scope",
            "The built-in Reader role at the resource group scope",
            "Desktop Virtualization User at the resource group scope",
        ],
        'correct': 1,
        'explanation': "Desktop Virtualization Reader grants read access to Azure Virtual Desktop resources only, matching a view-only requirement limited to AVD objects. The general Reader role would expose every resource in the group, including VMs and storage accounts. Desktop Virtualization User is an end-user role for accessing application groups, and Session Host Operator can change session host settings such as drain mode.",
    },
    {
        'id': 'tf22',
        'cat': 'identitySecurity',
        'type': 'tf',
        'question': "Sign-in frequency is configured as a Conditional Access grant control, alongside 'Require multifactor authentication'.",
        'answer': False,
        'explanation': "Sign-in frequency is a session control, which governs how long a sign-in stays trusted before the user must authenticate again. Grant controls, such as requiring MFA or a compliant device, decide whether access is allowed at all.",
    },
    {
        'id': 'msq16',
        'cat': 'identitySecurity',
        'type': 'ms',
        'question': "Contoso wants Azure Virtual Desktop users challenged for MFA only when their computer fails Intune's compliance rules, and wants contractors' computers held to the same standard. Which two configurations meet these requirements? (Choose two.)",
        'options': [
            "A host pool RDP property that forces multifactor authentication for contractors",
            "An NSG rule on the session host subnet that limits access from devices outside the corporate IP range",
            "A Conditional Access policy requiring a compliant device, targeted at the contractors' group",
            "A Conditional Access policy for the AVD apps that requires MFA or a compliant device",
            "Per-user MFA set to Enforced on the accounts of the users who connect to AVD",
        ],
        'correct': [2, 3],
        'explanation': "Conditional Access can grant access when either MFA or device compliance is satisfied, so compliant devices skip the prompt, and a separate policy scoped to the contractors' group can require compliance outright. Per-user MFA prompts the accounts regardless of device state and cannot key off compliance. RDP properties do not enforce authentication requirements, and an NSG rule filters network traffic, which neither satisfies MFA nor evaluates device compliance.",
    },
    {
        'id': 'q59',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "A team standardizing new MSIX app attach images wants the fastest attach times and the lowest CPU and memory overhead when many app images mount at sign-in. Which image format does Microsoft's guidance favor?",
        'options': [
            "ISO, a mounted optical disc image",
            "VHDX, a virtual hard disk image",
            "VHD, the older virtual hard disk image",
            "CIM, the Composite Image File System (CimFS)",
        ],
        'correct': 3,
        'explanation': "CIM is the newer image format built for app attach: it attaches faster and uses less CPU and memory than mounting a virtual disk. VHDX works and is the near-miss, and VHD is the older virtual disk format with the same overhead. ISO is not a supported staging format for app attach.",
    },
    {
        'id': 'q60',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "Users play training videos in Firefox inside their AVD sessions and still see choppy playback. Multimedia redirection is installed and works well for colleagues who use Microsoft Edge. What is the most likely reason?",
        'options': [
            "RDP Shortpath needs to be enabled before multimedia redirection works in Firefox",
            "Multimedia redirection supports Edge and Chrome, not Firefox",
            "The host pool needs a GPU-enabled VM size for Firefox video to be offloaded",
            "Teams media optimization also needs to be enabled for Firefox video to be offloaded",
        ],
        'correct': 1,
        'explanation': "Multimedia redirection works through a browser extension available for Microsoft Edge and Google Chrome, so video in Firefox is decoded on the session host as before. Teams media optimization handles Teams calls, Shortpath improves the transport rather than enabling redirection, and a GPU-enabled VM size is unrelated to offloading video to the client.",
    },
    {
        'id': 'tf23',
        'cat': 'userEnvApps',
        'type': 'tf',
        'question': "Even when OneDrive Known Folder Move is configured, a pooled host pool still needs FSLogix Profile Containers so the rest of each user's Windows profile follows them between hosts.",
        'answer': True,
        'explanation': "Known Folder Move syncs Desktop, Documents, and Pictures to OneDrive, but it does not roam the rest of the profile such as application settings and registry data. The two are complementary, and pooled hosts still rely on the profile container for everything beyond the known folders.",
    },
    {
        'id': 'msq17',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "Which two statements correctly distinguish multimedia redirection (MMR) from Teams media optimization? (Choose two.)",
        'options': [
            "MMR offloads video playback from supported websites, while Teams optimization offloads Teams call and meeting media",
            "Teams media optimization improves playback of websites in general, while MMR is meant for Teams",
            "MMR also handles Teams audio and video calls, so Teams optimization is unnecessary when MMR is enabled",
            "MMR offloads media work to the session host's GPU instead of the client device",
            "Both features move media decoding or encoding work from the session host to the client device",
        ],
        'correct': [0, 4],
        'explanation': "The two features target different workloads, website video versus Teams real-time media, but share one goal: moving media processing off the shared session host and onto the client. MMR does not cover Teams calls, the website and Teams roles are not reversed, and neither feature relies on the host's GPU.",
    },
    {
        'id': 'q61',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "A pooled host pool's overnight compute cost stays high. Autoscale evaluation logs show ramp-down skipped several hosts because users were still signed in with sessions left open. The admin wants those users warned and then signed out so the hosts can deallocate. Which ramp-down setting should be enabled?",
        'options': [
            "Breadth-first load balancing for the ramp-down phase",
            "A lower capacity threshold for the ramp-down phase",
            "A higher minimum percentage of hosts for the ramp-down phase",
            "Force logoff of users, with a warning message, during ramp-down",
        ],
        'correct': 3,
        'explanation': "Force logoff warns the remaining users after a notification delay and then signs them out, clearing the sessions that block those hosts from being deallocated. A lower capacity threshold changes when hosts are started or consolidated, not whether signed-in users are removed. A higher minimum percentage keeps more hosts running, the opposite of the goal, and breadth-first spreads sessions across more hosts, leaving fewer empty ones.",
    },
    {
        'id': 'tf24',
        'cat': 'monitorMaintain',
        'type': 'tf',
        'question': "A session host that shows a status of Unavailable must be powered off or deallocated.",
        'answer': False,
        'explanation': "Unavailable means the service cannot reach the host's agent, which happens when the VM is off but also when it is running and the agent has stopped, cannot connect, or is otherwise not reporting. Needs Assistance is a different status for a host that is reporting a health problem, so the status alone does not tell you the power state.",
    },
    {
        'id': 'q62',
        'cat': 'monitorMaintain',
        'type': 'mc',
        'question': "One clinician's sign-in fell back to a temporary profile while everyone else on the same host signed in normally. The admin wants the specific FSLogix error for that failure. Where should the admin look first?",
        'options': [
            "The FSLogix Apps Operational log on the host the clinician connected to",
            "The AVD agent's event log on the session host",
            "The WVDErrors table in Log Analytics, filtered to the clinician's user name",
            "The Azure Files share's capacity and transaction metrics",
        ],
        'correct': 0,
        'explanation': "FSLogix writes its own detailed profile-load events to the FSLogix Apps Operational log on the session host where the sign-in happened, which is where the specific error for one user's failure appears. WVDErrors captures failures of AVD service activities, not FSLogix profile errors. Storage metrics are aggregate and would not isolate one user's failure, and the AVD agent log covers agent and registration events.",
    },
    {
        'id': 'msq18',
        'cat': 'monitorMaintain',
        'type': 'ms',
        'question': "Which two statements about scaling plans are accurate? (Choose two.)",
        'options': [
            "A single scaling plan can contain several schedules, each applying to chosen days of the week",
            "All schedules in one scaling plan must share identical ramp-up and peak times",
            "A host pool can have only one scaling plan assigned at a time",
            "A host pool can have a separate scaling plan for weekdays and another for weekends",
            "A scaling plan created for pooled host pools can also be assigned to personal host pools",
        ],
        'correct': [0, 2],
        'explanation': "Different day patterns are handled by multiple schedules inside one plan, each with its own phases and times, and a host pool is governed by exactly one plan. That means weekday and weekend behavior belongs in one plan's schedules, not in two plans on the same pool. A plan is created for one host pool type, so a pooled plan cannot be used on personal pools, and schedules are free to differ.",
    },
    {
        'id': 'q63',
        'cat': 'identitySecurity',
        'type': 'mc',
        'question': "This real Azure portal screenshot shows the Microsoft Entra Kerberos pane for a storage account that will hold FSLogix profiles for Microsoft Entra-joined session hosts. The checkbox is ticked, and the Domain name and Domain GUID fields are blank. The admin will set directory and file permissions with icacls, not Windows File Explorer. Based on the text in the pane, what is true about selecting Save now?",
        'options': [
            "Save can proceed with those fields blank, because they are needed only to configure directory- and file-level permissions through Windows File Explorer",
            "Save requires the on-premises domain name and GUID, because Microsoft Entra Kerberos cannot be enabled without them",
            "Save requires Active Directory Domain Services to be set up first, because Microsoft Entra Kerberos builds on it as a second identity source",
            "Save requires default share-level permissions to be switched to all authenticated users and groups first, because that setting is what turns the identity source on",
        ],
        'correct': 0,
        'explanation': "The pane says the domain name and domain GUID are for configuring directory and file-level permissions through Windows File Explorer, and that the step is not required if you configure with icacls, so the fields can stay blank. Only one identity source can be enabled on a storage account, so adding AD DS alongside Microsoft Entra Kerberos is not how it works. Share-level permissions are Step 2 on the same page, configured after an identity source is enabled rather than as a prerequisite for saving it.",
        'whyTested': "FSLogix on Azure Files for Entra-joined hosts pushes candidates to configure identity-based access, and the exam likes to test which settings are actually mandatory. Optional fields that look required are a common distraction, as is the idea that Entra Kerberos layers on top of AD DS.",
        'image': 'avdFilesEntraKerberos',
    },
    {
        'id': 'msq19',
        'cat': 'identitySecurity',
        'type': 'ms',
        'question': "An admin saves the Microsoft Entra Kerberos pane shown in this screenshot for the storage account that holds FSLogix profile containers. Based on the banner in the pane and the Step 2 section of the page, which two follow-up tasks are still required before users' sessions can use the share? (Choose two.)",
        'options': [
            "Explicitly grant admin consent to the new Microsoft Entra ID application that enabling the feature registers in the tenant",
            "Configure share-level permissions, since Step 2 currently reads Disable permissions and no access is allowed to file shares",
            "Set up Active Directory Domain Services on the storage account as a second identity source so tickets can be issued",
            "Enter the on-premises domain name and domain GUID, which every session host needs in order to mount the share",
            "Switch the storage account to Microsoft Entra Domain Services, which Microsoft Entra Kerberos depends on to issue tickets",
        ],
        'correct': [0, 1],
        'explanation': "The banner in the pane states that after enabling Microsoft Entra Kerberos you must explicitly grant admin consent to the new application registered in the tenant. Step 2 states that once an identity source is enabled you must configure share-level permissions, and the default shown is no access, so either enable the default for authenticated users and groups or assign a share-level role to specific users or groups. A storage account can use only one identity source, so adding AD DS or Microsoft Entra Domain Services as well is not part of the setup, and the domain name and GUID fields are optional.",
        'whyTested': "Enabling the identity source is only the start: the consent step and the share-level permission layer are what the exam expects you to remember. Distractors suggest stacking identity sources or treating optional fields as mandatory.",
        'image': 'avdFilesEntraKerberos',
    },
    {
        'id': 'q64',
        'cat': 'userEnvApps',
        'type': 'mc',
        'question': "This real Azure portal screenshot shows the File share settings for a storage account where an admin plans to place an FSLogix profile share for Microsoft Entra-joined session hosts. Which setting should the admin open first in order to choose Microsoft Entra Kerberos as the authentication source?",
        'options': [
            "Identity-based access, which currently reads Not configured",
            "Default share-level permissions, which currently reads Disabled",
            "Security, which currently reads Maximum compatibility",
            "Soft delete, which currently reads Disabled",
        ],
        'correct': 0,
        'explanation': "The identity source is chosen from the Identity-based access setting, which is highlighted in the screenshot and shows Not configured because no source has been set up yet. Default share-level permissions come after an identity source is in place and only decide what authenticated users may do by default. The Security setting is a preset for SMB protocol, encryption, and authentication settings rather than the place to pick an identity source, and soft delete protects against accidental share deletion without affecting authentication.",
        'whyTested': "Candidates often know which identity source FSLogix needs but not where it is set. The settings strip shows several similar-looking options, so the exam rewards recognizing which one actually selects the identity source.",
        'image': 'avdFilesShareSettings',
    },
    {
        'id': 'msq20',
        'cat': 'userEnvApps',
        'type': 'ms',
        'question': "The administrator of the storage account in this screenshot wants Microsoft Entra-joined session hosts to mount myfileshare for FSLogix profiles using identity-based access. Based on the settings shown, which two actions are needed? (Choose two.)",
        'options': [
            "Set up an identity source under Identity-based access, which currently reads Not configured",
            "Provide share-level access, either through default share-level permissions or role assignments, since the default currently reads Disabled",
            "Turn on soft delete, which currently reads Disabled and must be enabled before an identity source can be used",
            "Move myfileshare off the Transaction optimized access tier, because identity-based access is unavailable on that tier",
            "Reduce the maximum capacity below 100 TiB, because the share quota already equals the maximum",
        ],
        'correct': [0, 1],
        'explanation': "The screenshot shows Identity-based access as Not configured, so no identity source can issue Kerberos tickets yet, and Default share-level permissions as Disabled, so users have no share-level access unless roles are assigned or the default is enabled. Soft delete is unrelated to authentication, and neither the access tier nor the 100 TiB maximum capacity blocks identity-based access; the quota matching the maximum is not a problem to fix.",
        'whyTested': "Two separate settings must be addressed for identity-based access to work, and the exam presents several unrelated-looking settings on the same page as bait. Reading the actual values in the screenshot is the skill being tested.",
        'image': 'avdFilesShareSettings',
    },
    {'id': 'q9001',
     'cat': 'planInfra',
     'type': 'mc',
     'question': "Contoso's branch users connect over an MPLS WAN that gives them a direct private path to the "
                 'session hosts, and RDP Shortpath for managed networks is enabled. Voice-heavy sessions still '
                 'stutter whenever branch users download large files. The network team agrees to honor packet '
                 'markings end to end. What should the admin configure on the session hosts?',
     'options': ['A higher max session limit on the host pool, so each host takes fewer simultaneous users '
                 'during file downloads',
                 'A second workspace so branch users connect through a separate feed and a dedicated gateway',
                 'An NSG rule that opens inbound UDP 3390 from the internet to the session hosts',
                 'A policy-based QoS Group Policy that marks RDP UDP traffic with DSCP 46'],
     'correct': 3,
     'explanation': 'RDP Shortpath for managed networks carries RDP over UDP, which can be marked with DSCP '
                    '(Microsoft recommends 46, Expedited Forwarding) so routers give it priority over bulk '
                    'downloads. The marking is applied with policy-based QoS on the session hosts, for example '
                    'matching svchost.exe and UDP source port 3390. A higher session limit puts more users on '
                    'each host and does nothing for network contention. A second workspace only changes which '
                    'feed users see. An inbound internet rule is unnecessary and unsafe, because reverse connect '
                    'and Shortpath for managed networks do not need inbound exposure of the hosts to the '
                    'internet.',
     'whyTested': 'QoS is only supported on the managed-network Shortpath transport and relies on DSCP marking '
                  'plus network devices that honor it. The exam checks whether you know where the marking is '
                  'applied.'},
    {'id': 'q9002',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A QoS policy was deployed to session hosts to prioritize RDP traffic. Remote workers connect '
                 'from home through the internet and still see jitter. Their sessions use the TCP reverse '
                 'connect transport because UDP is blocked at their firewalls. Why does the QoS policy not help '
                 'them?',
     'options': ['The DSCP value 46 is reserved for the AVD gateway and cannot be set on session hosts by Group '
                 'Policy',
                 'QoS only works for session hosts that are Microsoft Entra joined, and not for hybrid joined '
                 'session hosts',
                 'Policy-based QoS applies only to personal host pools, not to pooled host pools with '
                 'multi-session hosts',
                 'QoS policies are not supported for reverse connect, and DSCP markings are not honored across '
                 'the internet'],
     'correct': 3,
     'explanation': 'The QoS guidance requires RDP Shortpath for managed networks, and QoS policies are not '
                    'supported for reverse connect transport. Even for UDP, markings only help on links that '
                    'honor them, so they cannot improve an internet path you do not control. DSCP 46 is the '
                    'value Microsoft recommends setting on the hosts. Join type and host pool type have no '
                    'bearing on whether a QoS policy can be created.'},
    {'id': 'q9003',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'Roaming laptop users on mobile hotspots report that sessions drop whenever their active '
                 'network path degrades, then reconnect. The admin wants the client to keep standby network '
                 'paths and switch automatically without the user reconnecting. RDP Shortpath is already '
                 'configured. What should be confirmed?',
     'options': ['The Remote Desktop MSI client is installed on the laptops rather than Windows App',
                 'Each session host has a public IP address so that the client has more routes to try',
                 'Users connect with a current Windows App so that RDP Multipath can use multiple UDP and TCP '
                 'paths',
                 'The host pool uses breadth-first load balancing instead of depth-first so each client lands on '
                 'a nearer host'],
     'correct': 2,
     'explanation': 'RDP Multipath keeps multiple UDP paths (through STUN and TURN) and standby TCP reverse '
                    'connect paths, and fails over to a better one if the active path degrades. It works '
                    'automatically when Shortpath is configured, but it requires a recent Windows App (version '
                    '2.0.559.0 or later on Windows). Load-balancing mode affects where new sessions land, not '
                    'network paths. Public IPs on session hosts are not needed and would widen exposure. The '
                    'Remote Desktop MSI client no longer supports public cloud connections and does not provide '
                    'Multipath.'},
    {'id': 'q9004',
     'cat': 'planInfra',
     'type': 'mc',
     'question': "Fabrikam, a software vendor, will let its paying customers run Fabrikam's application from "
                 'published RemoteApps in Azure Virtual Desktop. The customers are not Fabrikam employees and '
                 'Fabrikam does not want to buy Microsoft 365 licenses for them. Which licensing approach is '
                 'designed for this?',
     'options': ["Azure Hybrid Benefit applied to the session hosts to cover customers' access rights",
                 'Per-user access pricing, enrolled on the Azure subscription that hosts the deployment',
                 'Microsoft 365 E3 licenses assigned to each customer through a guest account in the tenant',
                 'RDS CALs with Software Assurance and Windows Server 2019 session hosts for every customer'],
     'correct': 1,
     'explanation': 'Per-user access pricing is meant for external commercial purposes: the vendor enrolls an '
                    'Azure subscription and pays a flat monthly charge for each user who connects, so the '
                    'customers need no separate license. Assigning E3 licenses to guests is the internal-user '
                    'method and costs far more here. RDS CALs are the Windows Server route and per-user access '
                    'pricing is not available for Windows Server hosts anyway. Azure Hybrid Benefit discounts '
                    'compute licensing; it does not grant user access rights.',
     'whyTested': 'The exam separates internal commercial use (eligible licenses per user) from external '
                  'commercial use (per-user access pricing), and flags that the latter cannot be used for '
                  'employees or contractors.'},
    {'id': 'q9005',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'Contoso plans session hosts running Windows Server 2022 so that a legacy server-only '
                 'application can be published as RemoteApps to 300 employees. All employees have Microsoft 365 '
                 'E3. What licensing is still required for the server-based session hosts?',
     'options': ['Windows VDA per user licenses for each of the 300 employees using the application',
                 'Per-user access pricing for the Azure subscription that hosts the session hosts',
                 'Nothing further, because Microsoft 365 E3 already covers Windows Server session hosts',
                 'RDS client access licenses with Software Assurance (or RDS user subscription licenses)'],
     'correct': 3,
     'explanation': 'Windows Server session hosts require RDS CALs with Software Assurance or RDS user '
                    'subscription licenses for each accessing user. Microsoft 365 E3 covers Windows client '
                    'operating systems (Windows 10/11 Enterprise), not Windows Server. Windows VDA per user is '
                    'another client OS licensing option. Per-user access pricing is for external commercial '
                    'purposes and is not available for Windows Server hosts.'},
    {'id': 'q9006',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A session host configuration host pool must move all session hosts to a new monthly image. '
                 'Users must keep working, so at most three hosts may be out of service at a time. Which feature '
                 'does this?',
     'options': ['Drain mode on all hosts followed by manual image replacement on each VM',
                 'Redeploying the host pool with a new registration key',
                 'A scaling plan ramp-down schedule with force logoff enabled',
                 'Session host update with a batch size of three'],
     'correct': 3,
     'explanation': 'Session host update replaces VMs in a host pool that uses a session host configuration: it '
                    'updates one initial host to prove the process, then the rest in batches of the size you '
                    'set, draining each batch and notifying users first. Manual drain and replacement works but '
                    'loses the orchestration and rollback. A scaling plan force logoff is for capacity, not '
                    'image changes. A new registration key only lets hosts join; it does not replace existing '
                    'hosts.',
     'whyTested': 'Session host update replaces the older practice of patching or rebuilding hosts by hand, and '
                  'the exam expects you to know the batch behavior and its prerequisites such as turning '
                  'autoscale off during the update.'},
    {'id': 'q9007',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'An admin starts a session host update on a host pool that also has an enabled scaling plan. '
                 'The update fails partway with a runtime error. What is the most likely cause and the guidance?',
     'options': ['The scaling plan was left enabled during the update; disable it until the update completes',
                 'The batch size was set to one, and session host update does not support single-host batches',
                 'The scaling plan only supports personal host pools and cannot be assigned to a pooled host '
                 'pool',
                 'Compute Gallery images cannot be used by host pools that have a session host configuration'],
     'correct': 0,
     'explanation': 'During a session host update, autoscale should be disabled on the host pool and kept off '
                    'until the update finishes, because power actions from the scaling plan can interfere with '
                    'the update and cause runtime errors. Scaling plans are supported for both pooled and '
                    'personal host pools. A batch size of one is valid. Compute Gallery images can be used for '
                    'session host configurations, subject to the subscription restriction noted for '
                    'cross-subscription galleries.'},
    {'id': 'q9008',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'Contoso has a factory floor with unreliable internet. Operators need desktops that stay close '
                 'to on-premises machinery and apps, but IT wants to keep managing host pools, workspaces, and '
                 'application groups in the Azure portal. Which option fits?',
     'options': ['Azure Virtual Desktop on Azure Local, with the AVD control plane in Azure',
                 'A standalone RD Session Host farm managed with Azure Arc-enabled servers and no AVD service',
                 'Azure Virtual Desktop with session hosts in the nearest Azure region and RDP Shortpath only',
                 'Windows 365 Frontline with a cloud PC pool provisioned in the closest Azure region'],
     'correct': 0,
     'explanation': 'Azure Virtual Desktop on Azure Local keeps the AVD service objects in Azure while session '
                    'hosts run on your Azure Local instance (version 23H2 or later) near the on-premises '
                    'resources, which suits data locality and poor connectivity. Cloud-region session hosts '
                    'depend on the very internet link that is unreliable. Cloud PCs are cloud-hosted too. A '
                    'standalone RD Session Host farm gives up the Azure-managed host pool experience, and AVD on '
                    'Azure Local is not an Azure Arc-enabled service.'},
    {'id': 'q9009',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A scripted AVD deployment generates a host pool registration key with a long lifetime, then '
                 'provisions session hosts over several weeks. Hosts added in the last week fail to register '
                 'with EXPIRED_MACHINE_TOKEN. What is the correct practice?',
     'options': ['Assign the Desktop Virtualization Contributor role to each new session host VM before it '
                 'registers',
                 'Set the registration key lifetime to unlimited so that it never expires during a long rollout',
                 'Disable drain mode on the new session hosts so that they are allowed to register with the pool',
                 'Generate a new key before the old one expires, since a key lasts only as long as set (up to 27 '
                 'days)'],
     'correct': 3,
     'explanation': 'A registration key authorizes session hosts to join and is valid only for the duration you '
                    'set, with a maximum currently of 27 days; a rollout that spans longer needs a fresh key. '
                    'There is no unlimited lifetime. Roles on VMs do not influence registration tokens, and '
                    'drain mode controls new session placement, not registration.'},
    {'id': 'q9010',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'Contoso wants one Bicep file to create a host pool, a Desktop application group, and a '
                 'workspace the same way in every environment. Which statement describes how this is done?',
     'options': ['Use a Group Policy object to deploy the host pool objects from the domain to Azure',
                 'Create the host pool with Bicep, but application groups can only be created in the portal',
                 'Declare Microsoft.DesktopVirtualization resource types in the Bicep file and deploy it',
                 'Bicep cannot create AVD objects; only the Azure portal and the Azure CLI can create them'],
     'correct': 2,
     'explanation': 'Host pools, application groups, workspaces, and scaling plans are Azure resources of the '
                    'Microsoft.DesktopVirtualization provider, so they can be declared in ARM templates or '
                    'Bicep, scripted with Az PowerShell (for example New-AzWvdHostPool), or created with az '
                    'desktopvirtualization. There is no portal-only restriction, and Group Policy manages hosts, '
                    'not Azure resources.'},
    {'id': 'q9011',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'A landing zone team is organizing AVD resources. Log Analytics workspaces, data collection '
                 'rules, and the Azure Compute Gallery will be used by several AVD workloads, while VMs, storage '
                 'accounts, and private endpoints belong to each workload. How should these be placed, and how '
                 'should governance be applied?',
     'options': ['Shared services copied into every workload resource group so that RBAC is identical across the '
                 'estate',
                 'Shared services in a shared-services subscription, workload resources in workload '
                 'subscriptions, policy via management groups',
                 'Everything in one subscription, because management groups cannot contain subscriptions that '
                 'host AVD resources',
                 'A separate Microsoft Entra tenant for each workload so that Azure Policy can be applied to it'],
     'correct': 1,
     'explanation': 'The reference AVD landing zone places workload-specific resources (VMs, storage, key '
                    'vaults, private endpoints) in workload subscriptions and shared services (Log Analytics, '
                    'DCRs, compute galleries, Automation) in a shared-services subscription; management groups '
                    'then apply Azure Policy and RBAC consistently. Management groups can hold AVD '
                    'subscriptions. Duplicating shared services per workload defeats sharing. A separate tenant '
                    'is recommended for users from different organizations, not for ordinary workload '
                    'separation.'},
    {'id': 'q9012',
     'cat': 'planInfra',
     'type': 'mc',
     'question': 'New session hosts in a locked-down subnet stay Unavailable right after deployment. An NSG '
                 'denies outbound internet traffic and a UDR sends all traffic to an NVA. The admin suspects '
                 'missing AVD endpoints. What should be done first?',
     'options': ['Switch the host pool to a validation environment so the service rolls out agent fixes first',
                 'Open inbound TCP 3389 from the internet on the NSG so the AVD service can reach the hosts',
                 'Reinstall FSLogix on each host so that profile containers can attach during registration',
                 'Run the Azure Virtual Desktop Agent URL Tool, then allow the WindowsVirtualDesktop service tag '
                 'and FQDNs it reports'],
     'correct': 3,
     'explanation': 'Hosts register and connect by making outbound connections, so the NSG, UDR, and firewall '
                    'must allow the required endpoints; the Agent URL Tool shows which FQDNs the host cannot '
                    'reach, and the WindowsVirtualDesktop service tag (and Azure Firewall FQDN tag) simplify the '
                    'rules. Inbound 3389 is neither needed nor safe because AVD uses reverse connect. A '
                    'validation environment affects service update rings. FSLogix concerns profiles, not host '
                    'registration.'},
    {'id': 'q9013',
     'cat': 'planInfra',
     'type': 'mc',
     'question': "Contoso's image process: deploy a VM from the current gallery image version, apply updates, "
                 'run Sysprep, and capture a new version. The team wants to test it before production hosts pick '
                 'it up, and plans to keep older versions available for rollback. Which gallery features support '
                 'this?',
     'options': ['Delete the previous image version before publishing the new one so that only one copy exists '
                 'in the gallery',
                 'Exclude the new version from the latest pointer until tested, and set end-of-life dates on old '
                 'versions',
                 'Replicate the new version to every region and mark the host pool as a validation host pool',
                 'Convert the image to a managed image, which supports versioning and rollback natively'],
     'correct': 1,
     'explanation': 'Image versions in Azure Compute Gallery can be excluded from the latest-version pointer '
                    'while you validate them, and end-of-life dates retire older versions on a schedule, which '
                    'gives a controlled promotion path. Deleting the previous version removes the rollback '
                    'option. Replicating to all regions is unrelated to testing, and a validation host pool '
                    'tests AVD service updates, not your image. Managed images do not offer gallery versioning '
                    'and replication.'},
    {'id': 'msq9001',
     'cat': 'planInfra',
     'type': 'ms',
     'question': 'Which two statements about RDP Multipath are accurate? (Choose two.)',
     'options': ['It replaces RDP Shortpath and should be configured instead of it',
                 'It can keep redundant TCP reverse connect paths as standby transport',
                 'It requires the Remote Desktop MSI client on the endpoint',
                 'It can use multiple UDP paths discovered through STUN and TURN'],
     'correct': [1, 3],
     'explanation': 'Multipath keeps multiple UDP routes (through STUN and TURN) and standby TCP reverse connect '
                    'paths and switches among them. It depends on Windows App, not the retired MSI client, and '
                    'it builds on RDP Shortpath rather than replacing it; Microsoft recommends configuring '
                    'Shortpath as the primary transport to get the most benefit.'},
    {'id': 'msq9002',
     'cat': 'planInfra',
     'type': 'ms',
     'question': 'Which two statements about licensing Azure Virtual Desktop session hosts are accurate? (Choose '
                 'two.)',
     'options': ['Windows Server session hosts need RDS CALs with Software Assurance or RDS user subscription '
                 'licenses',
                 "Per-user access pricing is the recommended way to license a company's own employees",
                 'A Windows client session host is licensed per user through an eligible Windows or Microsoft '
                 '365 license',
                 'A Microsoft 365 E3 license covers users of Windows Server session hosts'],
     'correct': [0, 2],
     'explanation': 'Client OS hosts need an eligible per-user license such as Microsoft 365 E3 or Windows '
                    'Enterprise E3, and server OS hosts need RDS licensing. Per-user access pricing is '
                    'restricted to external commercial purposes, and E3 does not cover Windows Server session '
                    'hosts.'},
    {'id': 'tf9001',
     'cat': 'planInfra',
     'type': 'tf',
     'question': 'Azure Virtual Desktop on Azure Local keeps the session hosts on your own Azure Local hardware, '
                 'while host pools, workspaces, and application groups remain Azure resources.',
     'answer': True,
     'explanation': 'Only the session host VMs run on Azure Local (version 23H2 or later, registered with '
                    'Azure); the service objects stay in Azure and are managed through the Azure portal.'},
    {'id': 'q9101',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'Contoso wants the strongest phishing-resistant sign-in for the cloud service authentication '
                 'step to Azure Virtual Desktop, and wants users to hold a FIDO2 key rather than a password. '
                 'Where is this enforced?',
     'options': ['An NSG rule on the session hosts that allows inbound connections only from authenticated users',
                 'A host pool load-balancing option that routes passwordless users to dedicated session hosts',
                 'Conditional Access with an authentication strength that requires a phishing-resistant method',
                 'A setting in the FSLogix configuration of the profile container that requires a hardware key'],
     'correct': 2,
     'explanation': 'Cloud service authentication to AVD is performed by Microsoft Entra ID, which is where '
                    'Conditional Access and authentication strengths apply; FIDO2 security keys are a '
                    'phishing-resistant method. NSGs and load balancing do not evaluate user credentials, and '
                    'FSLogix is about profile storage.'},
    {'id': 'q9102',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': "A vendor's contractors, invited as B2B guests in Contoso's Microsoft Entra tenant, must reach "
                 'a shared desktop in Azure Virtual Desktop. Session hosts are Microsoft Entra joined, run an '
                 'eligible Windows 11 build, and single sign-on is enabled. The contractors have no AVD-eligible '
                 'license. What is still required?',
     'options': ['Per-user access pricing enrolled on the subscription that holds the host pool',
                 'Domain-joining the session hosts to AD DS so that guests can use Kerberos to sign in',
                 "An eligible Windows license assigned to each guest identity in Contoso's tenant",
                 'Assigning each guest the Global Reader role so that they can read the host pool'],
     'correct': 2,
     'explanation': "Anyone accessing AVD must be licensed; licenses from a guest's home tenant do not confer "
                    'rights in your tenant, so assign the same kind of license you use for internal users to the '
                    'guest identity. External identities require Microsoft Entra joined hosts and cannot use '
                    'Kerberos or NTLM to reach on-premises resources. Per-user access pricing is for external '
                    'commercial purposes, not contractors. Directory roles do not provide licensing.'},
    {'id': 'q9103',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'After enabling Defender Antivirus on pooled session hosts, users report slow sign-ins and some '
                 'fall back to temporary profiles. FSLogix profile containers are on an Azure Files share. What '
                 'should the admin check first?',
     'options': ['Move the Azure Files share to standard HDD storage so that scan traffic uses less IOPS',
                 'Turn off Defender Antivirus entirely on all session hosts so profile mounting is never scanned',
                 'Check that FSLogix executables, drivers, caches, and profile VHD(X) files are excluded from '
                 'scanning',
                 'Switch the host pool to depth-first load balancing so that scans are concentrated on fewer '
                 'hosts'],
     'correct': 2,
     'explanation': 'FSLogix guidance requires antivirus exclusions for its processes and drivers, the Cloud '
                    'Cache and local cache paths, and the profile container files; without them scans can delay '
                    'or block profile mounting. Turning protection off is unsafe and unnecessary. Load-balancing '
                    'mode and slower storage do not fix scan interference.'},
    {'id': 'q9104',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'Security wants Microsoft Defender for Endpoint on AVD pooled hosts that are frequently deleted '
                 'and redeployed from a golden image. Analysts must not see duplicate device records for the '
                 'same host name. How should onboarding be done?',
     'options': ['Use the VDI onboarding script for non-persistent endpoints as a startup script in the golden '
                 'image, giving one entry per desktop',
                 'Run the local onboarding script manually after each host is deployed from the image',
                 'Onboard the golden image once, so every clone inherits the same device record in the portal',
                 'Skip onboarding, because Defender for Endpoint cannot monitor Azure Virtual Desktop sessions'],
     'correct': 0,
     'explanation': 'Microsoft recommends one entry per virtual desktop using the non-persistent VDI onboarding '
                    'script placed in the golden image so it runs at first boot on every clone; the image itself '
                    'should not be onboarded. Onboarding the image creates the problems the single-entry '
                    'approach avoids, manual runs are error-prone, and Defender for Endpoint does support AVD.'},
    {'id': 'q9105',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'A security team wants administrators to reach session hosts for troubleshooting without any '
                 'management port permanently open on the NSG, and with access requested and approved for a '
                 'limited time. Which should they use?',
     'options': ['A permanent NSG rule allowing TCP 3389 from the corporate IP range',
                 'Just-in-time VM access in Microsoft Defender for Cloud',
                 'Public IP addresses on all session hosts with a strong password',
                 'The Desktop Virtualization User role on the resource group'],
     'correct': 1,
     'explanation': 'Just-in-time VM access opens the management port in the NSG only for an approved source and '
                    'time window, then closes it, which fits the requirement. A permanent rule leaves the port '
                    'open all the time, public IPs increase exposure, and the Desktop Virtualization User role '
                    'grants access to published resources, not administrative access to the VM.'},
    {'id': 'q9106',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'Contoso publishes only an accounting RemoteApp to a group of users on pooled hosts. An audit '
                 "shows that a user managed to start cmd.exe from within the app's open-file dialog. The team "
                 'believes publishing only one app restricts what can run. Which control actually restricts '
                 'which programs run on the session hosts?',
     'options': ['App Control for Business or AppLocker policies deployed to the session hosts',
                 'Move the application from a RemoteApp group to a Desktop application group',
                 'Set the host pool load-balancing algorithm to breadth-first for all session hosts',
                 'Enable screen capture protection on the host pool through its RDP properties'],
     'correct': 0,
     'explanation': 'RemoteApp is not a security boundary; it does not stop other programs from launching. App '
                    'Control for Business (formerly Windows Defender Application Control) or AppLocker enforce '
                    'an allow list of what can run. A Desktop group exposes more, not less. Screen capture '
                    'protection and load balancing are unrelated.'},
    {'id': 'q9107',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': "A healthcare firm must ensure that patient data in a user's virtual desktop is encrypted in "
                 'memory and isolated from the hypervisor and host operating system. Which session host option '
                 'addresses this?',
     'options': ['Standard security type with managed disk encryption',
                 'Azure confidential virtual machines',
                 'Trusted launch virtual machines only',
                 'A personal host pool with Start VM on Connect'],
     'correct': 1,
     'explanation': 'Confidential VMs use hardware-based isolation with memory encryption keys held in a secure '
                    'processor, so memory is protected while in use, even from the hypervisor and host OS. '
                    'Trusted launch protects the boot chain (Secure Boot, vTPM) but does not encrypt memory. '
                    'Disk encryption covers data at rest. A personal pool and Start VM on Connect have no '
                    'bearing on memory protection.'},
    {'id': 'q9108',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'A new image must satisfy Windows 11 requirements and protect against rootkits and boot kits by '
                 'verifying the boot loader, kernel, and drivers. Which security type should the session hosts '
                 'use?',
     'options': ['Standard',
                 'Trusted launch',
                 'None; Windows 11 cannot be used with Azure Virtual Desktop',
                 'Confidential virtual machines, because they are the only type with Secure Boot'],
     'correct': 1,
     'explanation': 'Trusted launch adds Secure Boot, a virtual TPM, and boot integrity monitoring, and it is '
                    'the default security type when you add session hosts in the portal. Standard does not give '
                    'those protections. Confidential VMs also include them but they add memory encryption and '
                    'have narrower size and OS support, so they are not the only option. Windows 11 is fully '
                    'supported.'},
    {'id': 'q9109',
     'cat': 'identitySecurity',
     'type': 'mc',
     'question': 'Help-desk engineers must be able to sign in as local administrators on specific Microsoft '
                 'Entra-joined session hosts, but not on others, without sharing the built-in admin password. '
                 'Which approach is appropriate?',
     'options': ['Assign the Virtual Machine Administrator Login role on the specific hosts or their resource '
                 'group',
                 'Add the engineers to the Desktop Virtualization User role on the host pool that contains the '
                 'hosts',
                 'Give them the Global Administrator role in Microsoft Entra ID for the duration of the work',
                 'Enable drive redirection for the help-desk group so they can use local tools in the session'],
     'correct': 0,
     'explanation': 'For Entra-joined hosts, the Virtual Machine Administrator Login role grants administrator '
                    'sign-in at the scope where it is assigned; use Windows LAPS to manage the built-in admin '
                    'password separately. The Desktop Virtualization User role provides access to the published '
                    'resource, not local admin rights. Drive redirection is unrelated, and Global Administrator '
                    'is far broader than needed.'},
    {'id': 'msq9003',
     'cat': 'identitySecurity',
     'type': 'ms',
     'question': 'Which two statements about security for session hosts are accurate? (Choose two.)',
     'options': ['Trusted launch encrypts the VM memory',
                 'RemoteApp publishing restricts users to the published applications only',
                 'Microsoft recommends just-in-time access or Azure Bastion rather than exposing RDP directly',
                 'Defender Antivirus can offload security-intelligence unpacking to a shared VDI location'],
     'correct': [2, 3],
     'explanation': 'Direct RDP should be avoided; JIT or Bastion reduce exposure. Defender Antivirus supports a '
                    'shared security intelligence location for VDI. RemoteApp is not a security feature and does '
                    'not stop other programs from launching, and memory encryption comes from confidential VMs, '
                    'not trusted launch.'},
    {'id': 'tf9101',
     'cat': 'identitySecurity',
     'type': 'tf',
     'question': 'Requiring token protection in Conditional Access for Azure Virtual Desktop is enforced on the '
                 'session host that the user connects to, not on the endpoint running Windows App.',
     'answer': False,
     'explanation': 'Token protection is evaluated for the client that signs in to the AVD service, so it '
                    'applies to the endpoint running Windows App; it does not apply to the session host.'},
    {'id': 'tf9102',
     'cat': 'identitySecurity',
     'type': 'tf',
     'question': 'Controlled folder access can block a legitimate application from writing to protected folders '
                 'until the application is added to the allowed list.',
     'answer': True,
     'explanation': 'Controlled folder access allows only trusted apps to modify protected folders, so a '
                    'legitimate app that is not trusted is blocked until it is allowed; audit mode lets you '
                    'discover such apps first.'},
    {'id': 'q9201',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'Users on managed Windows PCs and on a few unmanaged personal tablets need to open published '
                 'desktops. The IT policy is to standardize on the current Microsoft client and avoid the '
                 'retired Remote Desktop clients. Which choice is correct?',
     'options': ['Windows App on managed PCs, and Windows App in a web browser for unmanaged devices',
                 'The Microsoft Store Remote Desktop app, which is the current recommended client for AVD on '
                 'Windows',
                 'The Remote Desktop client for Windows (MSI) on managed PCs, as the only client available for '
                 'Windows',
                 'RemoteApp and Desktop Connections feeds, which support all device types and platforms'],
     'correct': 0,
     'explanation': 'Windows App is the current unified client and runs on Windows, macOS, iOS, Android, and in '
                    'a web browser. The MSI client and the older web client ended support for public cloud on '
                    'March 27, 2026, and the Store Remote Desktop app reached end of support in September 2025. '
                    'RemoteApp and Desktop Connections is a Windows Control Panel feature, not a cross-platform '
                    'client.'},
    {'id': 'q9202',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': "A security policy forbids copying files from the remote session to a user's local drives in "
                 'the Finance host pool, but clipboard text copy is still allowed. Where should the admin change '
                 'this?',
     'options': ["Disable drive redirection in the Finance host pool's RDP properties",
                 'Enable screen capture protection on the Finance host pool so files cannot leave the session',
                 "Uninstall Windows App on all of the Finance users' devices and use the browser client",
                 'Remove the Desktop Virtualization User role from the Finance users on the application group'],
     'correct': 0,
     'explanation': 'Drive redirection is a per-host-pool RDP property, so disabling it affects only that pool '
                    'and leaves clipboard redirection, which is a separate property, unchanged. Screen capture '
                    'protection stops screenshots, not file copy. Disabling the client or removing the role '
                    'would block all access.'},
    {'id': 'q9203',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'Users of a pooled host pool leave sessions disconnected overnight, and the hosts cannot be '
                 'deallocated because those sessions hold capacity. The admin wants disconnected sessions ended '
                 'after four hours. Which setting does this?',
     'options': ['The host pool maximum session limit, lowered so that disconnected sessions are not counted',
                 'Group Policy (or Intune policy) disconnected-session time limit, with sessions ended when the '
                 'limit is reached',
                 'Drain mode on all session hosts, which ends disconnected sessions as soon as it is turned on',
                 'The scaling plan peak load-balancing algorithm, set to depth-first for the pool overnight'],
     'correct': 1,
     'explanation': 'Session time limits (disconnected, idle, and active) are configured with Group Policy under '
                    'Remote Desktop Session Host > Session Time Limits, or with an equivalent Intune policy for '
                    'Entra-joined hosts, and ending the session when the limit is reached frees the capacity. '
                    'Load-balancing algorithm and max session limit do not end sessions, and drain mode just '
                    'stops new sessions.'},
    {'id': 'q9204',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'In a personal host pool with direct assignment, a developer leaves the company. The admin '
                 'wants to give her session host to a new hire. What should the admin do?',
     'options': ['Unassign the departing user from the session host, then assign the new hire to it',
                 'Delete the Desktop application group and recreate it with the new hire assigned',
                 'Change the host pool type to pooled so that the host can be shared by both people',
                 'Enable drain mode on the session host permanently so the old session ends'],
     'correct': 0,
     'explanation': 'With direct assignment, an admin can unassign a user from a personal desktop and assign '
                    'another user to it. Deleting the application group would disrupt everyone, you cannot '
                    'convert a personal pool to pooled in place, and drain mode only blocks new sessions.'},
    {'id': 'q9205',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'A personal host pool with scaling plan hibernation will use FSLogix profile containers and app '
                 'attach for applications. The admin enables hibernate as the disconnect action. What is the '
                 'consequence?',
     'options': ['Hibernation is supported only for pooled host pools, so it cannot be used here',
                 'Hibernation works only when the host pool is configured as a validation environment',
                 'Hibernation works, but it doubles the storage cost of the profile share for each hibernated '
                 'host',
                 'Hibernation is not supported with FSLogix or app attach, so use Deallocate instead'],
     'correct': 3,
     'explanation': 'Personal-desktop autoscale can hibernate VMs, but hibernate is not supported with FSLogix '
                    'or app attach, so Microsoft says not to enable it for pools that use them; choose '
                    'Deallocate. Hibernation applies to personal host pools (not pooled), and it has nothing to '
                    'do with validation environments.'},
    {'id': 'q9206',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'Contoso wants users of a pooled host pool to keep working if the primary profile share is '
                 'unavailable, with each profile container written to a second storage account in another '
                 'region. Which FSLogix configuration is correct?',
     'options': ['Set VHDLocations to two UNC paths separated by a semicolon so the profile is copied to both',
                 "Use a personal host pool so that the profile lives only on the user's own VM",
                 'Enable RDP Multipath on the host pool so the profile follows the user between regions',
                 'Set CCDLocations to two providers, such as type=smb,connectionString=..., to enable Cloud '
                 'Cache'],
     'correct': 3,
     'explanation': 'Cloud Cache is configured with the CCDLocations setting listing multiple providers; it '
                    'caches locally and writes asynchronously to each provider, so the loss of one is tolerated. '
                    'VHDLocations lists failover locations for a single container, not replication. RDP '
                    'Multipath is a transport feature. A personal pool avoids profile containers but does not '
                    'provide cross-region profile replication.'},
    {'id': 'q9207',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': "A company ships a new version of a department's application every month through app attach. "
                 'Users are always on the previous version at 8 a.m. and the team does not want a maintenance '
                 'window. How should the update be delivered?',
     'options': ['Rebuild the golden image and redeploy all session hosts in the host pool each month',
                 'Reinstall the app on each session host with Group Policy software installation',
                 'Create a new image with a new version number and update the existing app attach application in '
                 'place',
                 'Stop all sessions, then reuse the same version number with a modified image'],
     'correct': 2,
     'explanation': 'App attach supports in-place updates by pointing the application at a new image with a '
                    'different version number (higher or lower, never identical); users get it the next time '
                    'they sign in and no maintenance window is needed. Rebuilding images defeats the purpose, '
                    'and reusing the same version number is not allowed.'},
    {'id': 'q9208',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'Sign-in time for users of an app attach–based pool has grown as more applications are assigned '
                 'to each user. The admin wants sign-in unaffected by the number of attached apps. Which '
                 'registration type should be used?',
     'options': ['Log on blocking, so that every assigned app is fully registered during sign-in',
                 'On-demand registration, so apps are fully registered only when launched',
                 'Switching the image format from CIM to VHD, which attaches faster at sign-in',
                 'Marking all app packages as inactive so that none are processed at sign-in'],
     'correct': 1,
     'explanation': 'On-demand registration (the default) only partially registers apps at sign-in and completes '
                    'registration when an app starts, so sign-in time is not driven by the number of apps. Log '
                    'on blocking fully registers every app during sign-in, which lengthens it. Inactive packages '
                    'are ignored entirely, so users would not get the apps, and switching to VHD would make '
                    'attach slower rather than faster.'},
    {'id': 'q9209',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'The admin is preparing app attach images for a Windows 11 multi-session pool and wants the '
                 'fastest mount and unmount with the lowest CPU and memory use. Which image type should be '
                 'chosen?',
     'options': ['A ZIP archive of the MSIX files, extracted at sign-in',
                 'VHD, because it is the recommended image format for app attach images',
                 'ISO, because an ISO image mounts quickly and is read-only by design',
                 'CimFS, because the session hosts run Windows 11'],
     'correct': 3,
     'explanation': 'For MSIX and Appx images you can use CimFS, VHDX, or VHD; CimFS mounts and unmounts faster '
                    'and uses less CPU and memory, but is recommended only on Windows 11 hosts, and VHD is not '
                    'recommended. ISO and ZIP are not app attach image types.'},
    {'id': 'q9210',
     'cat': 'userEnvApps',
     'type': 'mc',
     'question': 'A multi-session image will carry Microsoft 365 Apps. Users report license activation prompts '
                 'and each user consumes a device activation. What configuration was likely missed?',
     'options': ['FSLogix Application Masking applied to the Office installation folder',
                 'Shared computer activation when installing with the Office Deployment Tool',
                 'Screen capture protection turned on for the host pool in RDP properties',
                 'RDP Shortpath for managed networks enabled on every session host'],
     'correct': 1,
     'explanation': 'On multi-session session hosts, Microsoft 365 Apps should be installed per machine with '
                    'shared computer activation so each user activates with their own license. Application '
                    'Masking hides apps, RDP Shortpath is a transport, and screen capture protection is a '
                    'data-leak control; none affects licensing.'},
    {'id': 'msq9004',
     'cat': 'userEnvApps',
     'type': 'ms',
     'question': 'Which two statements about FSLogix Cloud Cache are accurate? (Choose two.)',
     'options': ['It can be used together with VHDLocations for the same container',
                 'It removes the need for a share and stores profiles only on the session host',
                 'It is enabled with the CCDLocations setting and one or more storage providers',
                 'It keeps a local cache and writes to all configured providers asynchronously'],
     'correct': [2, 3],
     'explanation': 'Cloud Cache uses CCDLocations and a local cache with asynchronous writes to each provider, '
                    'giving resilience when one location fails. It replaces VHDLocations rather than '
                    'complementing it, and it still needs remote storage providers.'},
    {'id': 'msq9005',
     'cat': 'userEnvApps',
     'type': 'ms',
     'question': 'Which two statements about app attach are accurate? (Choose two.)',
     'options': ['Packages are stored on an SMB file share that each session host can read',
                 'Applications are installed into the golden image',
                 'The same app package can be used only in a single host pool',
                 'An application must be assigned to the host pool and to the user or group to reach the user'],
     'correct': [0, 3],
     'explanation': 'App attach mounts images from an SMB file share at sign-in and requires assignment of the '
                    'app to the host pool and to the user. It does not install into the image, and one package '
                    'can be used across multiple host pools.'},
    {'id': 'tf9201',
     'cat': 'userEnvApps',
     'type': 'tf',
     'question': 'On a session host, RemoteApp publishing is a reliable way to prevent users from launching '
                 'programs other than the published ones.',
     'answer': False,
     'explanation': 'RemoteApp is not a security feature. Restricting what can run requires App Control for '
                    'Business or AppLocker policies on the session hosts.'},
    {'id': 'q9301',
     'cat': 'monitorMaintain',
     'type': 'mc',
     'question': "Contoso's pooled AVD deployment in West Europe needs a disaster recovery plan for a regional "
                 'outage. The business accepts a short interruption, and wants costs to stay low. Which design '
                 'fits?',
     'options': ['Take nightly Azure Backup snapshots of every pooled session host VM and restore them in the '
                 'second region when needed',
                 'Rely on the AVD service, because Azure Virtual Desktop natively fails session hosts over to '
                 'another region',
                 'An active-passive design: pre-created host pool and workspace in a second region, deallocated '
                 'hosts, replicated storage, and failover steps',
                 'Increase the max session limit on the existing host pool so that fewer hosts are needed'],
     'correct': 2,
     'explanation': 'AVD has no native DR switch; you build resilience from Azure services: session hosts in a '
                    'second region (active-passive keeps them deallocated to save cost), replicated images, and '
                    'replicated profile storage. Backups of stateless pooled hosts are slow to restore and hold '
                    'little value because hosts are rebuilt from images. A higher session limit has no effect on '
                    'regional outages.'},
    {'id': 'q9302',
     'cat': 'monitorMaintain',
     'type': 'mc',
     'question': 'Which item is the most important to back up for a pooled host pool built from a gallery image '
                 'with FSLogix profile containers on Azure Files?',
     'options': ['Every pooled session host VM, backed up nightly, so any host can be restored exactly',
                 'The FSLogix profile share (for example with share snapshots or Azure Backup) and the gallery '
                 'image',
                 'The AVD gateway and broker components, which are needed to restore service',
                 'The host pool registration key, which is required to rejoin session hosts'],
     'correct': 1,
     'explanation': 'Pooled session hosts are stateless and are rebuilt from the image; what holds data is the '
                    'profile share and the image that defines the hosts. The AVD gateway and broker are '
                    'Microsoft-managed. A registration key is a short-lived secret, not something to back up.'},
    {'id': 'q9303',
     'cat': 'monitorMaintain',
     'type': 'mc',
     'question': 'The admin wants to add a custom chart of session counts per host to the AVD Insights view. '
                 'What is the recommended way?',
     'options': ['Create a new Microsoft Entra application registration that reads session data from the broker',
                 'Install a third-party dashboard agent on every session host and forward the data to it',
                 'Export the diagnostic logs to a spreadsheet weekly and chart them by hand in the spreadsheet',
                 'Edit or copy the Azure Virtual Desktop Insights workbook and add a Log Analytics query '
                 'visualization'],
     'correct': 3,
     'explanation': 'Insights is an Azure Monitor workbook, so you can customize it (or save a copy) and add '
                    'queries over the Log Analytics workspace. The other approaches add unnecessary components.'},
    {'id': 'q9304',
     'cat': 'monitorMaintain',
     'type': 'mc',
     'question': 'To maintain consistent session hosts, Contoso wants updates to be tested once, then rolled out '
                 'identically to all hosts, with a quick rollback path. Which strategy fits best?',
     'options': ['Update the image (a new gallery version) and replace hosts with it, for example through '
                 'session host update',
                 'Patch each host in place at a different time using local Windows Update, with no image change',
                 'Let each user install any pending updates themselves whenever they sign in',
                 'Disable Windows Update permanently on all session hosts to avoid unexpected changes'],
     'correct': 0,
     'explanation': 'Image-based replacement gives every host an identical, tested configuration and easy '
                    'rollback to a previous version. In-place patching causes drift, disabling updates is '
                    'unsafe, and user-driven updates are not controllable.'},
    {'id': 'tf9301',
     'cat': 'monitorMaintain',
     'type': 'tf',
     'question': 'Azure Virtual Desktop Insights needs only diagnostic settings on the AVD objects; no agent or '
                 'data collection rule is needed on the session hosts.',
     'answer': False,
     'explanation': 'Diagnostic settings send AVD service logs to Log Analytics, but the Azure Monitor Agent '
                    'with a data collection rule is also needed to collect performance counters and events from '
                    'the session hosts.'},
]

LESSONS = [
    {'id': 'host-pools-and-images',
     'title': 'Host Pools, Session Hosts & Images',
     'summary': 'Pooled vs. personal host pools, load balancing, assignment, workspaces, and managing session '
                'host images.',
     'diagram': 'hostPoolFanOut',
     'vocabIds': ['f1',
                  'f2',
                  'f3',
                  'f4',
                  'f5',
                  'f6',
                  'f7',
                  'f14',
                  'f39',
                  'f42',
                  'f9004',
                  'f9005',
                  'f9006',
                  'f9007',
                  'f9008',
                  'f9009',
                  'f9010',
                  'f9011'],
     'quizIds': ['q1',
                 'q2',
                 'q3',
                 'q4',
                 'q8',
                 'q9',
                 'q10',
                 'q29',
                 'msq1',
                 'msq2',
                 'q9004',
                 'q9005',
                 'q9006',
                 'q9007',
                 'q9008',
                 'q9009',
                 'q9010',
                 'q9013',
                 'msq9002',
                 'tf9001'],
     'reading': "Azure Virtual Desktop's building blocks nest in a specific order: a host pool is a collection "
                'of session host VMs; an application group publishes either a full Desktop or specific RemoteApp '
                'programs from that host pool; and a workspace is the logical container that groups one or more '
                "application groups together so a user sees everything they're entitled to — across every host "
                'pool assigned to them — in one unified feed in Windows App. A pooled host pool shares '
                'multi-session session hosts across many users, load-balanced by the pool itself, which is the '
                'standard, cost-efficient choice for stateless, similar-task workers. A personal host pool '
                'instead dedicates exactly one session host VM to each assigned user, either through automatic '
                'assignment (Azure Virtual Desktop assigns the first available host the first time a user '
                'connects) or direct assignment (an admin pre-assigns a specific host to a specific user ahead '
                'of their first sign-in) — and once assigned, a user always lands on that same session host on '
                'every future connection regardless of which method put them there.\n'
                '\n'
                'Within a pooled host pool, the load-balancing algorithm decides how new sessions get '
                'distributed. Breadth-first spreads new sessions evenly across every available session host, '
                'favoring performance. Depth-first instead fills one session host up to its configured maximum '
                'session limit before moving on to the next, concentrating load onto fewer hosts and leaving '
                'others empty — which pairs naturally with autoscale, since an emptied host is safe to '
                'deallocate. Multi-session itself only works because of a special SKU, Windows 11 (or 10) '
                'Enterprise multi-session, licensed specifically for Azure Virtual Desktop, letting multiple '
                'users run concurrent, isolated sessions on one VM — something ordinary Windows client licensing '
                "doesn't permit outside AVD at all. Microsoft also specifically recommends against assigning the "
                'same users both a RemoteApp application group and a Desktop application group from the same '
                'host pool, since it causes duplicate icons and user confusion, even though a pooled host pool '
                'can technically host several RemoteApp groups at once. A personal host pool, by contrast, only '
                'ever supports a single Desktop application group.\n'
                '\n'
                'Custom session host images are managed through Azure Compute Gallery, which stores, versions, '
                'and replicates image definitions across subscriptions and regions — a controlled, repeatable '
                "lifecycle in place of hand-built managed image copies. A host pool flagged with the 'Validation "
                "environment' setting receives Azure Virtual Desktop's own service and agent updates before "
                'general availability, letting an organization catch update-related issues on a small, low-risk '
                "pool first — that's purely a rollout ring for the AVD service itself, and has nothing to do "
                'with testing your own custom image versions, which Compute Gallery handles separately.\n'
                '\n'
                "It's worth being clear on what a customer is actually responsible for versus what Microsoft "
                'runs. The AVD control plane — Web Access, the Broker, Diagnostics, and the Gateway — is fully '
                "managed by Microsoft, runs in Microsoft's own subscription, and is never visible or manageable "
                "directly in the customer's portal. The data plane — session host VMs, the virtual network, and "
                "FSLogix storage — runs in the customer's own subscription, and that's the part the customer "
                "provisions, patches, and pays for. Licensing follows the same 'no extra AVD-specific tax' "
                "pattern: there's no separate per-user Azure Virtual Desktop access license at all — a "
                'qualifying Windows or Microsoft 365 license already grants a user entitlement to access AVD, on '
                'top of whatever Azure infrastructure the organization actually consumes. And when deciding '
                'between AVD and Windows 365 Cloud PC, the real distinction is pooling and control: AVD supports '
                'pooled, multi-session host pools with granular scaling and Azure consumption billing, while a '
                'Windows 365 Cloud PC is always a fixed, dedicated, single-user VM at predictable per-user '
                'monthly pricing, with no host pool or scaling plan of its own to manage.\n'
                '\n'
                'Licensing and automation round out the planning picture. Windows client session hosts need an '
                'eligible per-user license (Microsoft 365 E3/E5/A3/A5/F3/Business Premium or Windows '
                'Enterprise/Education), Windows Server session hosts need RDS CALs with Software Assurance or '
                'RDS user subscription licenses, and per-user access pricing exists only for external commercial '
                'use. Host pools, workspaces, and application groups are Microsoft.DesktopVirtualization '
                'resources, so portal, PowerShell, Azure CLI, ARM and Bicep can all create them, and session '
                'hosts join with a registration key that is valid only for the lifetime you set (up to 27 days). '
                'Pools that use a session host configuration let AVD manage host lifecycle and apply session '
                'host update, which replaces hosts in batches from a new image or changed settings; turn '
                'autoscale off while it runs. Session hosts can also run on Azure Local when data locality or '
                'connectivity requires it, while the AVD control plane stays in Azure.',
     'fundamentalsLabel': 'New to AVD host pool structure? See the everyday analogy',
     'fundamentals': "Think of a workspace, application group, and host pool the way an apartment building's "
                     'directory works: the host pool is the building itself (a set of units/session hosts), an '
                     'application group is a specific listing for one of those units (a full apartment, or just '
                     'one room in it as a RemoteApp), and a workspace is the master directory a resident checks '
                     "to see every listing they're entitled to across every building they have access to, not "
                     'just one. Depth-first load balancing is like filling up one elevator completely before '
                     'calling the next one, so the other elevators stay empty and can be powered down; '
                     'breadth-first is like spreading everyone across every elevator evenly instead.',
     'keyTerms': ['host pool',
                  'application group',
                  'workspace',
                  'pooled host pool',
                  'personal host pool',
                  'automatic assignment',
                  'direct assignment',
                  'Breadth-first',
                  'Depth-first',
                  'Azure Compute Gallery',
                  'Validation environment',
                  'control plane',
                  'data plane',
                  'session host configuration',
                  'session host update',
                  'registration key',
                  'per-user access pricing',
                  'RDS CAL',
                  'Azure Local'],
     'commonTraps': ['Depth-first fills one host before moving to the next; breadth-first spreads sessions '
                     'evenly — mixing these up flips which one pairs with autoscale for cost savings.',
                     'A personal host pool supports only a single Desktop application group — it does not '
                     'support RemoteApp application groups the way a pooled host pool does.',
                     'A validation environment host pool only affects the AVD service/agent update rollout ring '
                     '— it has nothing to do with testing your own custom Compute Gallery image versions.',
                     'There is no separate per-user Azure Virtual Desktop access license — a qualifying Windows '
                     'or Microsoft 365 license already grants that entitlement.'],
     'scenario': 'A call center wants 200 agents doing identical, non-persistent work to share a pool of Windows '
                 '11 Enterprise multi-session VMs as cheaply as possible, while a handful of developers need a '
                 'persistent desktop with locally installed tools that survive between sessions. The admin '
                 'builds a pooled host pool with depth-first load balancing for the call center agents, so '
                 'autoscale can deallocate emptied hosts overnight, and a separate personal host pool with '
                 'direct assignment for the developers, pre-assigning each one a dedicated VM before their first '
                 "sign-in. Both host pools' application groups are published through one shared workspace, so "
                 "every user — agent or developer — sees only what they're entitled to in a single feed.",
     'onTheJob': 'Depth-first versus breadth-first sounds like a minor toggle in the portal, but getting it '
                 'backwards is a classic cause of an autoscale bill that never drops overnight, since '
                 'breadth-first spreads sessions across every host and leaves nothing actually empty to '
                 "deallocate. The 'don't publish RemoteApp and Desktop from the same host pool to the same "
                 "users' guidance exists because someone, somewhere, shipped duplicate Start menu icons to a "
                 'whole call center and spent a week fielding confused help-desk tickets about it. Managing '
                 'images through Azure Compute Gallery sounds like process overhead until the first time a bad '
                 'image update needs to be rolled back fleet-wide, at which point having versioned images '
                 'instead of one hand-built golden image is the difference between a five-minute fix and a '
                 'weekend. The same Azure Virtual Desktop vs. Windows 365 decision factors question resurfaces '
                 "on MD-102 from the endpoint-management side, where it's tested as Windows 365 Cloud PC "
                 'provisioning policies — AZ-140 asks which platform to build and scale yourself, while MD-102 '
                 'asks how to actually provision and license the Cloud PC once that platform choice has already '
                 'been made.'},
    {'id': 'networking-storage-capacity-planning',
     'title': 'Networking, Storage & Capacity Planning',
     'summary': 'FSLogix storage backends, RDP Shortpath, bandwidth planning, VM sizing, and cost optimization.',
     'diagram': 'networking',
     'vocabIds': ['f8',
                  'f9',
                  'f11',
                  'f12',
                  'f13',
                  'f15',
                  'f40',
                  'f43',
                  'f44',
                  'f45',
                  'f9001',
                  'f9002',
                  'f9003',
                  'f9012',
                  'f9013',
                  'f9014',
                  'f9015'],
     'quizIds': ['q5',
                 'q6',
                 'q7',
                 'q11',
                 'q12',
                 'q37',
                 'q56',
                 'tf3',
                 'tf4',
                 'msq4',
                 'q9001',
                 'q9002',
                 'q9003',
                 'q9011',
                 'q9012',
                 'msq9001'],
     'reading': 'A pooled, stateless host pool only feels personal to the user because of FSLogix Profile '
                "Containers, which store a user's entire Windows profile inside a VHD/VHDX file on network "
                'storage, attached to the OS at sign-in — without it, landing on a different session host every '
                'time would mean a brand-new, empty profile each time. That storage has to live somewhere '
                'reachable by every session host in the pool. Azure Files, ideally the Premium tier, is the '
                'common, simpler choice for small-to-medium scale. Azure NetApp Files offers lower latency and '
                'higher IOPS/throughput and is the recommended choice at large scale or for '
                'performance-sensitive deployments — at the cost of extra setup, since it needs its own '
                "delegated subnet and capacity pool that a straightforward Azure Files share doesn't. For "
                'resilience beyond a single storage location, FSLogix Cloud Cache writes profile changes to a '
                'local cache first and asynchronously replicates them to one or more configured storage '
                "providers, so a user's profile survives even if one storage location becomes temporarily "
                'unreachable.\n'
                '\n'
                'Network transport and latency planning both come down to the path between the client and the '
                'session host. RDP Shortpath establishes a direct, UDP-based transport between the two, '
                'bypassing the usual TCP relay through the Azure Virtual Desktop gateway to cut latency — '
                'Shortpath for managed networks needs direct line-of-sight connectivity, such as a VPN or '
                'ExpressRoute, while Shortpath for public networks instead uses STUN/TURN-based NAT traversal '
                'for clients anywhere on the open internet with no such direct path. Round-trip time (RTT) '
                'between the client and the Azure region hosting the session host is the dominant factor in how '
                "responsive an interactive session actually feels, regardless of raw bandwidth; Microsoft's "
                'Azure Virtual Desktop Experience Estimator tool helps assess expected experience for a given '
                'network path, and as a rule of thumb an RTT under roughly 150 ms gives a good interactive '
                'experience.\n'
                '\n'
                'Sizing a session host starts from an expected user profile — light, medium, or heavy, based on '
                "the applications and multitasking typical for that group — which Microsoft's published sizing "
                "tables translate into a specific VM SKU and users-per-host density. The host pool's max session "
                'limit setting then caps how many concurrent sessions any single session host will accept, '
                'working together with the load-balancing algorithm to decide when a host is full; set it too '
                "high for the VM's real sizing and hosts overload under peak load even though the pool still "
                "shows spare 'slots,' set it too low and autoscale spins up more hosts than actually necessary. "
                'FSLogix containers have their own sizing consideration too: profile containers default to a '
                'maximum of 30 GB unless increased, and a container sized too small can silently put a user into '
                'a temporary or read-only profile with no obvious sign-in error — proactively monitoring '
                "container free space avoids a hard-to-diagnose 'why does this one user keep losing settings' "
                'ticket.\n'
                '\n'
                'On the cost side, Azure Hybrid Benefit lets an organization apply an existing on-premises '
                'Windows Server license with Software Assurance toward session host compute cost, and Reserved '
                'Instances or Azure Savings Plans further discount predictable compute — but Windows 10/11 '
                'multi-session VM compute specifically is not eligible for that same per-core Hybrid Benefit '
                'discount that Windows Server workloads get. On a multi-session host pool, the realistic savings '
                'levers are autoscale, avoiding paying for capacity that sits idle overnight and on weekends, '
                'and Reserved Instances or Savings Plans on the compute itself, not Hybrid Benefit.\n'
                '\n'
                'Network design extends beyond Shortpath. RDP Multipath keeps several UDP paths (found through '
                'STUN and TURN) and standby TCP paths alive and fails over between them, which helps unstable '
                'networks; it needs a current Windows App. QoS for RDP uses DSCP 46 set by policy-based QoS on '
                'the hosts and only works with RDP Shortpath for managed networks, never with reverse connect. '
                'Size links by measuring real users, because bandwidth depends on graphics activity and '
                'resolution. For connectivity, allow the WindowsVirtualDesktop service tag and required FQDNs in '
                'NSGs, UDRs, and Azure Firewall, and confirm with the Azure Virtual Desktop Agent URL Tool. '
                'Place workload resources and shared services in the right subscriptions of your landing zone '
                'and apply policy through management groups.',
     'fundamentalsLabel': 'New to AVD network and storage planning? See the everyday analogy',
     'fundamentals': 'Choosing Azure Files versus Azure NetApp Files for FSLogix is like choosing between a '
                     'well-run public storage unit and a private, climate-controlled vault: the storage unit '
                     '(Azure Files) is simpler to set up and fine for most needs, while the vault (Azure NetApp '
                     'Files) is faster and more resilient at scale, but you have to build out dedicated access '
                     'infrastructure for it first. RDP Shortpath is like taking a direct flight instead of '
                     "connecting through a hub airport (the Gateway) — it only works if there's a direct route "
                     "available, whether that's a private lane (a VPN, for Shortpath on managed networks) or a "
                     'cleverly negotiated direct path over public roads (STUN/TURN, for Shortpath on public '
                     'networks).',
     'keyTerms': ['FSLogix Profile Containers',
                  'Azure Files',
                  'Azure NetApp Files',
                  'Cloud Cache',
                  'RDP Shortpath',
                  'managed networks',
                  'public networks',
                  'Round-trip time',
                  'max session limit',
                  'Azure Hybrid Benefit',
                  'Reserved Instances',
                  'RDP Multipath',
                  'QoS',
                  'DSCP',
                  'WindowsVirtualDesktop service tag',
                  'Agent URL Tool',
                  'SMB Multichannel'],
     'commonTraps': ['Azure NetApp Files needs its own delegated subnet and capacity pool — Azure Files Premium '
                     "is the simpler default unless you're at large scale.",
                     'RDP Shortpath for managed networks needs direct line-of-sight connectivity like a VPN or '
                     'ExpressRoute; Shortpath for public networks is the one built for clients with no such '
                     'direct path.',
                     'The max session limit works with the load-balancing algorithm — setting it too high '
                     'overloads hosts even though the pool shows spare capacity, and setting it too low wastes '
                     'capacity and triggers unnecessary autoscale-outs.',
                     "Windows 10/11 multi-session VM compute is not eligible for Azure Hybrid Benefit's per-core "
                     'discount — the real multi-session savings levers are autoscale and Reserved '
                     'Instances/Savings Plans.'],
     'scenario': 'A 3,000-user deployment needs the lowest possible FSLogix profile latency and is willing to '
                 'manage a dedicated delegated subnet for it, so the team chooses Azure NetApp Files over a '
                 'simpler Azure Files share. Branch staff connect over the corporate VPN with direct '
                 'line-of-sight to the Azure virtual network, so RDP Shortpath for managed networks is enabled '
                 "to avoid relaying every packet through the Gateway. Session hosts are sized for a 'medium' "
                 "user profile based on Microsoft's published tables, with the max session limit tuned so hosts "
                 'fill to a safe level before autoscale — running depth-first — brings another host online, and '
                 'the whole multi-session fleet leans on autoscale and Reserved Instances rather than Azure '
                 "Hybrid Benefit, which doesn't apply to multi-session compute anyway.",
     'onTheJob': 'FSLogix profile corruption is one of the single most common AVD help-desk tickets in real '
                 'deployments, and it almost always traces back to a container that hit its default 30 GB size '
                 'limit and silently dropped the user into a temporary profile with no obvious error message. '
                 "RDP Shortpath's dependence on real line-of-sight connectivity means it quietly fails to "
                 'establish for a subset of remote users nobody budgeted time to test, and diagnosing that gap '
                 'after the fact is a lot more work than validating the network path before rollout. Choosing '
                 'Azure NetApp Files over a simpler Azure Files share often gets revisited after go-live once '
                 'real login-storm latency numbers come in worse than the sizing tables predicted, which is when '
                 'the extra delegated-subnet setup suddenly looks worth it. RDP Shortpath for managed networks '
                 'specifically depends on UDP port 3390 being open end-to-end between client and session host, '
                 'and a network team that only opened that port on one side of a segmented internal firewall is '
                 'a common, hard-to-spot reason Shortpath silently falls back to the Gateway relay with no error '
                 'telling anyone why.'},
    {'id': 'identity-and-security-for-avd',
     'title': 'Identity & Security for AVD',
     'summary': 'Entra join types, Conditional Access, RBAC roles, session hardening, and least-privilege '
                'access.',
     'diagram': 'identity',
     'vocabIds': ['f16',
                  'f17',
                  'f18',
                  'f19',
                  'f20',
                  'f21',
                  'f22',
                  'f46',
                  'f47',
                  'f48',
                  'f9101',
                  'f9102',
                  'f9103',
                  'f9104',
                  'f9105',
                  'f9106',
                  'f9107',
                  'f9108',
                  'f9109',
                  'f9110',
                  'f9111',
                  'f9112',
                  'f9113',
                  'f9114',
                  'f9115',
                  'f9116'],
     'quizIds': ['q13',
                 'q14',
                 'q15',
                 'q16',
                 'q17',
                 'q32',
                 'q33',
                 'msq5',
                 'msq6',
                 'msq11',
                 'q9101',
                 'q9102',
                 'q9103',
                 'q9104',
                 'q9105',
                 'q9106',
                 'q9107',
                 'q9108',
                 'q9109',
                 'msq9003',
                 'tf9101',
                 'tf9102'],
     'reading': "A session host's identity join type shapes a lot of what else is possible. A Microsoft "
                'Entra-joined host is joined only to Entra ID and never to an AD DS domain — simplest to deploy, '
                'since it needs no domain controller line-of-sight, though its users can still be hybrid '
                'identities synced from on-premises AD, and FSLogix profiles on Azure Files then need extra '
                'configuration, like Microsoft Entra Kerberos authentication on the storage account, because the '
                'host cannot get Kerberos tickets from a domain controller. A hybrid Entra-joined host is joined '
                "to an on-premises AD DS domain that's synced to Entra ID, and an AD DS-joined host is joined "
                'only to on-premises AD DS with no cloud identity at all. Whichever join type is used, session '
                'hosts should never be directly reachable for inbound RDP from the internet: all connections are '
                'brokered through the AVD Gateway over an outbound-only connection the session host itself '
                'initiates, so a network security group can safely deny all unsolicited inbound traffic while '
                'the service still works exactly as designed.\n'
                '\n'
                'Conditional Access applies to AVD the same way it applies to any other app, but with one '
                'wrinkle: there are two Microsoft Entra apps involved. The Azure Virtual Desktop app is '
                'evaluated when a user subscribes to the feed and authenticates to the AVD gateway, while the '
                'Windows Cloud Login app is evaluated when the user signs in to the session host itself with '
                'single sign-on enabled. Enforcing MFA or a compliant-device requirement across the whole '
                'connection means targeting both apps with matching policies (sign-in frequency being the one '
                'setting that differs); targeting only the first leaves the session host sign-in outside the '
                'policy. Built-in RBAC roles narrow admin access by function: Desktop Virtualization User only '
                'lets a user access their assigned application groups, Desktop Virtualization Contributor '
                'manages AVD objects like host pools and app groups but not the underlying VMs, Desktop '
                'Virtualization Virtual Machine Contributor covers the VM-level rights the AVD service needs for '
                'session hosts, Desktop Virtualization Session Host Operator views and removes session hosts and '
                'changes drain mode, and Desktop Virtualization User Session Operator sends messages to users, '
                'disconnects them, and logs them off, without the broader rights Contributor grants.\n'
                '\n'
                'For sensitive on-screen content, two controls work together rather than interchangeably: screen '
                "capture protection actively blocks a session's content from being captured by screenshot or "
                'recording tools running on the client, while session watermarking only overlays a QR code that '
                "encodes the session's connection ID, acting as a deterrent and an audit trail an admin can look "
                'up in AVD Insights or Log Analytics. Neither can reach out and stop someone from simply '
                'photographing the screen with an external camera — that gap is a known, accepted limitation of '
                "both controls, which is exactly why they're complementary rather than a complete technical "
                "guarantee. Applying Microsoft's security guidance and Windows baseline settings through Group "
                'Policy (domain-joined hosts) or Intune security baseline and settings catalog policies '
                '(Entra-joined hosts) — covering redirection restrictions and RDP listener hardening — is the '
                'supported, scalable way to harden every session host consistently, rather than configuring each '
                'one by hand.\n'
                '\n'
                "Least-privilege thinking extends down to the session host's local accounts too. End users "
                'should never be members of the local Administrators group on a shared session host, since one '
                'user with local admin rights on a pooled host risks affecting every other user sharing that '
                'same VM — day-to-day access should flow entirely through the Desktop Virtualization User role '
                'and app group assignment instead. Windows LAPS (Local Administrator Password Solution) then '
                "automatically randomizes and rotates each session host's local Administrator password on a "
                'schedule and stores it securely in Microsoft Entra ID, removing the risk of every host sharing '
                'one static, manually tracked password. And Customer Lockbox, a related but tenant-wide '
                'Microsoft 365 control, requires a Microsoft support engineer to get explicit customer approval '
                'before accessing tenant content during a support request — a narrow, specific scenario, not '
                'something that triggers for most routine support and service operations.\n'
                '\n'
                'Security on session hosts is layered. Identity: the cloud service step is always Microsoft '
                'Entra ID, so Conditional Access, MFA, and passwordless methods (FIDO2, Windows Hello for '
                'Business) apply there, smart cards and WebAuthn redirection reach inside the session, and '
                'invited B2B guests need Entra-joined hosts, SSO, and their own license. Host protection: '
                'Defender for Cloud for posture and just-in-time access, Defender Antivirus with FSLogix '
                'exclusions, Defender for Endpoint onboarded once per desktop with the VDI script in the golden '
                'image, and App Control for Business or AppLocker because RemoteApp is not a security boundary. '
                'Platform security: Trusted launch (Secure Boot, vTPM) is the portal default, and confidential '
                'VMs add memory encryption. Avoid direct RDP; use JIT or Azure Bastion. Network rules rely on '
                'the WindowsVirtualDesktop service tag, and no inbound port 3389 is required.',
     'fundamentalsLabel': 'New to identity and security hardening for AVD? See the everyday analogy',
     'fundamentals': 'Targeting both the Azure Virtual Desktop and Windows Cloud Login apps in Conditional '
                     'Access is like locking both the front door and the inner office door of a building — a '
                     'policy that only covers the front door (the feed and gateway) leaves the inner door (the '
                     'session host sign-in) completely unguarded. Screen capture protection and watermarking are '
                     "like a 'no photography' sign combined with a physical lens blocker on a security camera "
                     'feed: one visibly discourages misuse and creates a trail if it happens anyway, the other '
                     'actively blocks a specific kind of software capture, but neither one can stop someone '
                     'holding up their own phone camera to the monitor.',
     'keyTerms': ['Microsoft Entra-joined',
                  'hybrid Entra-joined',
                  'Conditional Access',
                  'Windows Cloud Login',
                  'Desktop Virtualization User',
                  'Desktop Virtualization Contributor',
                  'Desktop Virtualization Session Host Operator',
                  'screen capture protection',
                  'session watermarking',
                  'security baseline',
                  'Windows LAPS',
                  'local Administrators group',
                  'Defender for Cloud',
                  'Defender for Endpoint',
                  'just-in-time VM access',
                  'App Control for Business',
                  'controlled folder access',
                  'Trusted launch',
                  'confidential VMs',
                  'external identities',
                  'token protection'],
     'commonTraps': ['A Conditional Access policy targeting only the Azure Virtual Desktop app leaves the '
                     'session host sign-in (Windows Cloud Login, when single sign-on is enabled) unprotected — '
                     'target both apps together.',
                     'Desktop Virtualization Contributor cannot manage the underlying session host VMs — that '
                     'needs Desktop Virtualization Virtual Machine Contributor as well.',
                     'Watermarking only deters and creates an audit trail — it does not technically block a '
                     'capture the way screen capture protection does, and neither stops an external camera '
                     'photographing the screen.',
                     'Session hosts never need a public IP or an inbound internet-facing RDP rule — they only '
                     'ever initiate an outbound connection to the AVD service.'],
     'scenario': 'A hospital deploys Microsoft Entra-joined session hosts with no line of sight to domain '
                 'controllers, and configures Microsoft Entra Kerberos so its hybrid identities can still use '
                 'FSLogix profiles on an Azure Files share. To meet a compliance mandate, it enables both screen '
                 'capture protection (to actually block screenshot tools) and session watermarking (to deter and '
                 'trace any photo taken of the screen) on the host pool, while acknowledging that a clinician '
                 "using their own phone's camera can still defeat both. A Conditional Access policy requiring a "
                 'compliant device is scoped to both the Azure Virtual Desktop and Windows Cloud Login apps, so '
                 'the requirement covers both the feed and gateway sign-in and the sign-in to the session host '
                 'with single sign-on, and help-desk staff are limited to the Desktop Virtualization Session '
                 'Host Operator role rather than full Contributor rights.',
     'onTheJob': 'Conditional Access policies scoped only to the Azure Virtual Desktop app are a genuinely '
                 'common gap in real deployments, discovered when someone realizes the separate Windows Cloud '
                 'Login sign-in to the session host was never actually covered by the MFA requirement everyone '
                 'assumed was enforced everywhere. Screen capture protection and watermarking get sold to '
                 'compliance teams as a complete solution, but the honest conversation with a real client is '
                 'that neither one stops someone photographing the screen with their own phone, and setting that '
                 'expectation upfront avoids an awkward audit finding later. Windows LAPS adoption for session '
                 'hosts is usually less about following best practice and more about a help-desk team that got '
                 'tired of one shared local admin password across every pooled VM and wanted rotation without a '
                 'manual tracking spreadsheet.'},
    {'id': 'user-environments-profiles-and-apps',
     'title': 'User Environments, Profiles & Applications',
     'summary': 'FSLogix container types, MSIX app attach, Application Masking, and delivering apps and media to '
                'AVD users.',
     'diagram': 'fslogixAttach',
     'vocabIds': ['f23',
                  'f24',
                  'f25',
                  'f26',
                  'f28',
                  'f29',
                  'f30',
                  'f38',
                  'f50',
                  'f51',
                  'f9201',
                  'f9202',
                  'f9203',
                  'f9204',
                  'f9205',
                  'f9206',
                  'f9207',
                  'f9208',
                  'f9209',
                  'f9210',
                  'f9211',
                  'f9212',
                  'f9213',
                  'f9214'],
     'quizIds': ['q18',
                 'q19',
                 'q20',
                 'q21',
                 'q22',
                 'q23',
                 'q34',
                 'msq7',
                 'msq8',
                 'msq10',
                 'q9201',
                 'q9202',
                 'q9203',
                 'q9204',
                 'q9205',
                 'q9206',
                 'q9207',
                 'q9208',
                 'q9209',
                 'q9210',
                 'msq9004',
                 'msq9005',
                 'tf9201'],
     'reading': 'FSLogix is configured through ADMX/ADML template files that add a dedicated node to Group '
                'Policy — or the same registry settings can be pushed through Intune configuration profiles for '
                "session hosts that aren't domain-joined to an on-premises AD — letting an admin set the VHD "
                'storage location, container size, and enabled state without editing the registry image by '
                'image. A Profile Container carries the entire user profile, while an Office Container can '
                'optionally carry just Outlook (OST/search data) and OneDrive data separately, useful when the '
                'main profile needs to stay small or when cached-mode Outlook data would otherwise dominate it. '
                'Redirections.xml lets an admin explicitly exclude or redirect specific folders, like a '
                'disposable browser cache, out of the profile container entirely, keeping it smaller and sign-in '
                'faster without uninstalling anything or disabling FSLogix.\n'
                '\n'
                'MSIX app attach delivers an application packaged as MSIX from a network share, staging it as a '
                'virtual disk attached to the session host at sign-in and de-staging it at sign-out — the app '
                'shows up in the Start menu, but its files never actually touch the local disk or the golden '
                "image. That's exactly what makes updates lightweight: adding a new application version just "
                'means adding a new MSIX package, with no need to rebuild or redeploy the image at all. Not '
                'every application has this option, though — a legacy line-of-business installer with no MSIX '
                'package has no MSIX app attach path, leaving Intune Win32 deployment or baking it directly into '
                'the golden image as the only realistic delivery routes, and Win32 deployment fits an app every '
                'user of a host pool needs, while MSIX app attach fits one assignable to specific users or '
                'groups without ever touching the image.\n'
                '\n'
                'When an application is delivered to everyone on a shared image but should only be visible to '
                'some of them, FSLogix Application Masking hides specific applications, shortcuts, or file '
                'associations from unauthorized users or groups based on rule sets evaluated against group '
                'membership — the app stays physically installed for everyone, just invisible to those who '
                "shouldn't see it, letting one golden image serve multiple departments cleanly. Per-user Start "
                'menu and taskbar personalization roams right alongside this, through the same FSLogix profile '
                'container, so each user keeps their own pinned tiles and icons across whichever session host '
                'they land on, instead of everyone sharing one fixed, image-baked layout. Language packs and '
                "Features on Demand are the one clear exception to 'deliver it dynamically': they must be added "
                "to the master image itself, via DISM against a language pack ISO, before it's generalized and "
                "deployed — unlike an MSIX-attached app, they can't be added per-user after the fact.\n"
                '\n'
                'Two more delivery concerns round out the user experience: Teams media optimization offloads '
                'Microsoft Teams call and meeting audio, video, and screen sharing to run directly on the client '
                'device instead of the shared session host, since without it every concurrent Teams call '
                'competes for the same limited CPU and network resources as user counts grow. And for '
                'graphics-intensive workloads like CAD or video editing, GPU-accelerated session hosts run on '
                'GPU-enabled VM sizes with either GPU passthrough (a dedicated hardware GPU) or GPU '
                'partitioning/vGPU (sharing one physical GPU across multiple hosts) — but on a pooled '
                "multi-session host, every concurrent session on that host still shares the same physical GPU's "
                'capacity, so GPU-bound capacity planning matters just as much as vCPU/RAM sizing for this kind '
                'of workload.\n'
                '\n'
                'Client and user-experience settings: Windows App is the current client on Windows, macOS, iOS, '
                'Android, and the browser, and the Remote Desktop MSI client and web client are retired for '
                'public cloud. Redirections (drives, clipboard, printers, USB, camera, smart card, WebAuthn) are '
                'RDP properties on the host pool, backed by Group Policy or Intune on the host; session time '
                'limits live in the Session Time Limits policies. Personal desktops are assigned and unassigned '
                'by an admin or on first sign-in. Cloud Cache is turned on with CCDLocations and replaces '
                'VHDLocations. App attach (the current name for the feature that replaced MSIX app attach) '
                'packages MSIX, Appx, or App-V apps as CIM, VHDX, or VHD images on an SMB share; on-demand '
                'registration keeps sign-in fast, new versions arrive side by side or in place, and hibernation '
                'is not supported with FSLogix or app attach. Microsoft 365 Apps on multi-session hosts use '
                'shared computer activation.',
     'fundamentalsLabel': 'New to FSLogix and application delivery? See the everyday analogy',
     'fundamentals': "MSIX app attach is like a hotel room's furniture that's delivered and set up fresh for "
                     "each guest's stay and cleared out after checkout — nothing about the room itself (the "
                     'golden image) ever permanently changes. FSLogix Application Masking is like a shared '
                     'office building where everyone has a keycard that opens the same floor, but only some '
                     "badges actually light up the elevator button for the finance department's suite — the "
                     "door's still there for everyone, only some people can actually see and use it.",
     'keyTerms': ['Profile Container',
                  'Office Container',
                  'Redirections.xml',
                  'MSIX app attach',
                  'Intune Win32',
                  'Application Masking',
                  'personalization',
                  'Language packs',
                  'Teams media optimization',
                  'GPU passthrough',
                  'GPU partitioning',
                  'Windows App',
                  'RDP properties',
                  'session time limits',
                  'Cloud Cache CCDLocations',
                  'app attach',
                  'on-demand registration',
                  'CimFS',
                  'shared computer activation'],
     'commonTraps': ['Language packs must be baked into the golden image before deployment — they cannot be '
                     'delivered per-user after sign-in the way an MSIX-attached app can.',
                     'MSIX app attach never installs files onto the local disk or the golden image — an app with '
                     'no MSIX package has no MSIX app attach path at all.',
                     'Application Masking hides an app from unauthorized users without uninstalling it — the app '
                     'is still physically present on the shared image.',
                     'A GPU-enabled multi-session host still shares one physical GPU across every concurrent '
                     'session on it — GPU capacity planning matters as much as vCPU/RAM sizing.'],
     'scenario': "A hospital's shared nursing-station host pool needs a licensed imaging application visible "
                 'only to the radiology department, Outlook and OneDrive data roaming fully with each clinician '
                 "while the rest of the profile stays small, and Teams calls that don't degrade as more "
                 'clinicians sign in during a shift change. The admin layers FSLogix Application Masking on top '
                 'of the imaging app (already installed in the shared image) scoped to the radiology group, '
                 'configures a separate Office Container for Outlook/OneDrive data alongside a deliberately '
                 'trimmed Profile Container, and enables Teams media optimization so call audio and video '
                 "process on each clinician's own device instead of competing for session host resources.",
     'onTheJob': 'MSIX app attach gets pitched as the answer to every application delivery problem, until '
                 'someone hits a legacy line-of-business installer with no MSIX package and realizes Win32 '
                 'deployment or baking it into the golden image are the only real options left. Forgetting that '
                 'language packs have to be baked into the image before generalization is a mistake that usually '
                 'only surfaces after a whole new pool of session hosts goes live missing a language a '
                 'department specifically asked for. GPU capacity planning for a shared multi-session host is '
                 'easy to underestimate in practice, since teams size for vCPU and RAM carefully and then get '
                 'blindsided when several concurrent graphics-heavy sessions on the same host all compete for '
                 'one physical GPU.'},
    {'id': 'monitoring-maintenance-and-scaling',
     'title': 'Monitoring, Maintenance & Scaling',
     'summary': 'Azure Monitor for AVD, diagnostic categories, autoscale scaling plans, drain mode, and patching '
                'strategy.',
     'diagram': 'scalingApproaches',
     'vocabIds': ['f32', 'f33', 'f34', 'f35', 'f36', 'f53', 'f54', 'f9301', 'f9302', 'f9303', 'f9304', 'f9305'],
     'quizIds': ['q25',
                 'q26',
                 'q27',
                 'q28',
                 'q35',
                 'q46',
                 'q47',
                 'q52',
                 'msq9',
                 'tf13',
                 'tf16',
                 'q9301',
                 'q9302',
                 'q9303',
                 'q9304',
                 'tf9301'],
     'reading': 'Azure Monitor for Azure Virtual Desktop is a purpose-built workbook surfacing host pool health, '
                'session host performance, and connection-level diagnostics — but it has nothing to show until '
                'diagnostic settings are actually enabled on the AVD objects (host pools, workspaces, app '
                'groups) sending data to a Log Analytics workspace; enabling the workbook and enabling the '
                'underlying data flow are two separate steps. Diagnostic categories break that data down by '
                'purpose: Connection is typically the first stop for troubleshooting failed or slow sign-ins, '
                'Error surfaces failures broadly, and categories like AgentHealthStatus, NetworkData, and '
                'SessionHostManagement cover narrower slices of host and agent health. For a deeper dive on one '
                "specific user's bad connection, the WVDConnections table records each session's connection "
                'lifecycle, duration, and round-trip time, while WVDCheckpoints records the timestamped stages a '
                'connection passed through — together letting an admin write a Kusto Query Language (KQL) query, '
                'filtered by UserName or CorrelationId, to pinpoint exactly which stage — client, gateway, '
                'broker, or session host — one specific connection stalled at, faster than scanning the prebuilt '
                'workbook for an issue affecting a single person.\n'
                '\n'
                'Autoscale scaling plans define schedules — ramp-up, peak, ramp-down, off-peak — that '
                'automatically start or deallocate existing session host VMs based on time of day and current '
                'session load, cutting compute cost outside business hours. A capacity threshold percentage '
                "decides when a pooled plan should start an additional host, reacting once running hosts' "
                "combined session load crosses that percentage rather than waiting until they're completely "
                'full; the minimum percentage of hosts instead sets a floor on how many hosts autoscale keeps '
                'running during the ramp-up and ramp-down phases, while the peak and off-peak phases have no '
                'such floor and just apply a load-balancing algorithm. Scaling behaves differently by host pool '
                'type, but in neither case does autoscale create or delete session hosts: on a pooled host pool '
                'it starts and deallocates existing hosts to match load, while on a personal host pool a scaling '
                'plan starts or deallocates the fixed set of dedicated VMs based on schedule phases and what '
                "happens when a user disconnects or signs out — 'scaling' there really just means power-state "
                'management. For unpredictable, occasional usage, Start VM on Connect (available on both pool '
                'types) automatically powers on a deallocated VM the moment a user tries to connect, without a '
                'fixed schedule or manual admin intervention.\n'
                '\n'
                'Before patching or other maintenance, drain mode marks a session host so it stops accepting any '
                'new sessions while letting its already-connected users keep working uninterrupted — it does not '
                'sign anyone out on its own, so an admin typically still messages and logs off remaining users, '
                'or simply waits for them to disconnect naturally, before the host is fully idle and safe to '
                'touch. From there, session hosts patch like any Azure VM, through Azure Update Manager, '
                'Microsoft Configuration Manager, or WSUS, or by replacing hosts entirely with a newly patched '
                'golden image and retiring the old ones — image-based replacement avoids ever running user '
                'sessions on a host mid-patch, at the cost of needing enough spare capacity to roll hosts in and '
                'out. Separately, the AVD agent and side-by-side stack update automatically by default, and '
                'scheduled agent updates simply define a maintenance window during which those specific agent '
                'updates are allowed to install, keeping unexpected agent restarts out of business hours — it '
                'has no effect on Windows OS patching or application updates, which still need to be managed '
                'through the tools above.\n'
                '\n'
                'Resilience and updates: AVD has no native disaster recovery feature, so design active-active or '
                'active-passive deployments from Azure services: second-region host pools and workspaces, Site '
                'Recovery for personal desktops, replicated gallery images, and replicated profile storage '
                '(Cloud Cache or geo-redundant shares). Back up state (profile shares, personal desktops, '
                'images) rather than stateless pooled hosts. Prefer image-based updates (new image version, then '
                'session host update) over patching each host in place, and use drain mode for any in-place '
                'patching. The Insights workbook can be customized, and it needs the Azure Monitor Agent with a '
                'data collection rule as well as diagnostic settings.',
     'fundamentalsLabel': 'New to monitoring and scaling AVD? See the everyday analogy',
     'fundamentals': 'Depth-first load balancing feeding autoscale is like filling one checkout lane completely '
                     'before opening a second one, so the store can send the second cashier home the moment '
                     'their lane empties out — the same vertical-vs-horizontal tradeoff behind any scaling '
                     "decision, whether that's a bigger single register or simply opening and closing more of "
                     "them as the crowd ebbs and flows. Drain mode is like putting up a 'this lane is closing "
                     "soon, but you already in line will be served' sign — new customers get routed elsewhere, "
                     'but nobody already checking out gets turned away mid-transaction.',
     'keyTerms': ['Azure Monitor for Azure Virtual Desktop',
                  'diagnostic settings',
                  'Log Analytics workspace',
                  'WVDConnections',
                  'WVDCheckpoints',
                  'Kusto Query Language',
                  'Autoscale scaling plans',
                  'capacity threshold',
                  'minimum percentage of hosts',
                  'Start VM on Connect',
                  'drain mode',
                  'scheduled agent updates',
                  'active-passive',
                  'Azure Site Recovery',
                  'share snapshots',
                  'workbook customization',
                  'session host update'],
     'commonTraps': ['Azure Monitor for AVD shows nothing until diagnostic settings are enabled and sending data '
                     "to a Log Analytics workspace — the workbook itself doesn't create that data flow.",
                     'Autoscale never creates or deletes session hosts in either pool type — it only starts and '
                     'deallocates existing VMs, and on a personal host pool it works on power state rather than '
                     'capacity thresholds.',
                     'Drain mode does not sign out already-connected users — it only blocks new sessions from '
                     'landing on that host.',
                     'Scheduled agent updates control only the AVD agent/side-by-side stack timing — Windows OS '
                     'patching still needs Azure Update Manager, WSUS, or Configuration Manager.'],
     'scenario': 'An admin notices a spike in failed sign-ins and, after confirming diagnostic settings are '
                 'already flowing into a Log Analytics workspace, filters the WVDConnections and WVDCheckpoints '
                 'tables by CorrelationId to find that a specific batch of failures is stalling at the gateway '
                 'stage rather than the session host. Before rolling out a fix that requires a reboot, they '
                 'enable drain mode on the affected hosts so currently connected users can finish their work, '
                 'wait for sessions to clear naturally, then patch through Azure Update Manager. Separately, the '
                 "pooled host pool's autoscale plan is tuned with a lower capacity threshold so ramp-up reacts "
                 'before hosts fill completely, while a minimum percentage of hosts in the ramp-up phase makes '
                 'sure a baseline of hosts is already running before the morning rush.',
     'onTheJob': 'Azure Monitor for AVD showing an empty workbook is a genuinely common first-week surprise, '
                 'since enabling the dashboard and actually turning on the diagnostic settings feeding it are '
                 'two separate steps that are easy to think are the same thing. Drain mode gets used as if it '
                 'instantly clears a host for patching, but in practice an admin still has to actively message '
                 'or wait out the already-connected users, and skipping that step is how a maintenance window '
                 'turns into an unplanned outage for whoever was mid-session. Capacity threshold and '
                 'minimum-percentage tuning is rarely right on the first attempt — most real autoscale plans get '
                 'adjusted after a morning login storm outpaces ramp-up, or after finance flags a bill that '
                 "never drops overnight because a ramp-down minimum was set too high. A scaling plan's ramp-down "
                 'phase can also be configured to force log off users after a grace period, and forgetting to '
                 "enable that setting is a separate, easy-to-miss reason a host pool's compute bill never "
                 'actually drops overnight even on an otherwise well-tuned schedule, since '
                 'idle-but-still-connected sessions keep blocking the host from ever reaching zero users.'},
]

CHEAT_SHEET = [
    {
        'heading': 'Exam-day strategy',
        'points': [
            'Microsoft exams typically allow roughly 100 minutes of seat time for about 40-60 questions (check the exam page for current numbers) — around 2 minutes each on average. Budget more time for multi-part scenario questions and less for straight recall, rather than pacing every question identically.',
            "Real scoring isn't a flat percentage of questions right (some count for more than others) — treat 70%+ as a safe buffer to aim for, not an exact threshold to just clear.",
            "Flag anything you're unsure of and move on rather than stalling — a question later in the exam can sometimes jog a detail you needed earlier, and you get partial credit for nothing by running out of time on one question.",
            "On multi-select ('choose N') questions, eliminate the options you're confident are wrong first; guessing among 2 plausible answers beats guessing among 4.",
            'Your first read of a question is usually right — change an answer only when you find a specific detail you missed, not from general second-guessing.',
        ],
    },
    {'heading': 'Host pool types: personal vs. pooled',
     'points': ['Personal host pool = 1:1 static user-to-VM assignment (assigned or automatic); user state '
                'persists on that same VM between sessions.',
                "Pooled host pool = many users share a pool of session hosts; pair it with FSLogix so a user's "
                'profile and settings roam regardless of which host they land on.',
                'Pooled load balancing: Breadth-first spreads new sessions across all available hosts first; '
                'Depth-first fills one host to its max session limit before moving to the next.',
                'Validation environment host pools receive AVD service updates first — use them to test changes '
                'before rolling out to production pools.',
                'Direct assignment (personal) means manually assigning a user to a specific VM; automatic '
                'assignment lets AVD assign the first user who connects.',
                'Licensing: client OS hosts need an eligible per-user license; Windows Server hosts need RDS '
                'CALs with SA or RDS user SLs; per-user access pricing is for external commercial use only.',
                'Registration keys are valid only for the lifetime you set (up to 27 days); session host update '
                'replaces hosts in batches and needs autoscale off.']},
    {
        'heading': 'FSLogix profile containers',
        'points': [
            'Profile Container redirects the entire user profile into a VHD/VHDX on file storage (Azure Files or Azure NetApp Files, typically) so it roams between session hosts.',
            "Office Container isolates just the Outlook/OneDrive cache data — used when you don't want the full profile roamed, or alongside Profile Container for large mailbox caches.",
            'Concurrent multi-user pooled scenarios need storage with enough IOPS — Azure Files Premium or Azure NetApp Files are common choices over a Standard file share.',
            "Only one user session can mount a given VHD(X) at a time — a locked profile from a crashed or disconnected session is the classic 'stuck on temp profile' troubleshooting scenario.",
            "Cloud Cache is FSLogix's option for replicating profile data across multiple storage locations for redundancy or multi-region scenarios.",
        ],
    },
    {
        'heading': 'Session host sizing & scaling',
        'points': [
            'Native autoscale scaling plans start and deallocate existing session hosts on a schedule — they replaced the older Azure Automation runbook-based scaling script.',
            'Autoscale never creates or deletes session hosts: on personal host pools it only starts/deallocates each dedicated VM by schedule and session state, and on pooled pools it starts/deallocates existing hosts using a capacity threshold.',
            'Sizing is driven by user profile — light/medium/heavy workers need progressively more vCPU/RAM per user, which lowers users-per-host density as workload gets heavier.',
            'A pooled autoscale schedule has four phases — ramp-up, peak, ramp-down, off-peak — each with its own load-balancing algorithm; ramp-up and ramp-down also have a minimum percentage of hosts and a capacity threshold, and ramp-down adds force logoff.',
        ],
    },
    {'heading': 'Networking (RDP Shortpath & Multipath)',
     'points': ['RDP Shortpath opens a direct UDP transport between client and session host, bypassing the '
                'TCP-based reverse connect path for lower latency.',
                'Shortpath for managed networks needs a direct/private path (VPN or ExpressRoute) between client '
                'and host; Shortpath for public networks works over the open internet.',
                "If a direct path can't be established, AVD automatically falls back to the standard reverse "
                'connect transport over TCP 443 — the session still connects, just less optimally.',
                'RDP Multipath/multi-transport is about session resilience — automatically reconnecting after a '
                'brief network blip — not raw throughput.',
                'RDP Multipath keeps standby UDP and TCP paths and fails over automatically; it needs a current '
                'Windows App and a working RDP Shortpath configuration.',
                'QoS: DSCP 46 set by policy-based QoS on the session hosts, only for RDP Shortpath for managed '
                'networks (not reverse connect).',
                'Allow the WindowsVirtualDesktop service tag and required FQDNs outbound; run the Agent URL '
                'Tool; no inbound 3389 needed.']},
    {'heading': 'Identity & security for AVD',
     'points': ['AVD supports pure Microsoft Entra ID-joined session hosts as well as hybrid Entra-joined (Entra '
                'ID + on-prem AD) hosts — pure Entra ID-join removes the need for domain-controller line of '
                'sight for many scenarios.',
                'Entra ID-joined session hosts run Windows 10/11 Enterprise multi-session or single-session and '
                'support single sign-on so users are not prompted twice.',
                'Conditional Access applies to AVD like any other app — enforce MFA or a compliant-device '
                'requirement against both the Azure Virtual Desktop app (feed and gateway) and the Windows Cloud '
                'Login app (session host sign-in with SSO).',
                'RBAC roles like Desktop Virtualization User (assign to end users) and Desktop Virtualization '
                "Contributor (assign to admins) control who can use vs. manage a host pool — don't confuse "
                'resource-level Azure RBAC with in-session app permissions.',
                'Cloud service authentication is always Entra ID (Conditional Access applies); remote session '
                'sign-in should use SSO; in-session sign-in covers apps.',
                'Defender for Endpoint: onboard once per desktop with the VDI script in the golden image, not '
                'the image itself; add FSLogix exclusions to antivirus.',
                'RemoteApp is not a security boundary: use App Control for Business or AppLocker. Avoid direct '
                'RDP; use JIT or Azure Bastion.',
                'Trusted launch (Secure Boot, vTPM) is the default security type; confidential VMs add memory '
                'encryption.']},
    {'heading': 'Monitoring (Azure Monitor for AVD / Insights)',
     'points': ['Azure Monitor for AVD (AVD Insights) combines host pool health, session host performance '
                'counters, and user connection diagnostics in one dashboard.',
                'Diagnostics data lands in a Log Analytics workspace — you must enable and configure Insights, '
                "it doesn't capture detailed data by default.",
                'Connection diagnostics trace a specific failed or slow connection through each stage: client, '
                'gateway, broker, session host.',
                'DR: AVD has no native failover. Build it with second-region host pools, Site Recovery, '
                'replicated images, and replicated profile storage; back up state, not stateless pooled hosts.']},
    {'heading': 'Exam-day reminders',
     'points': ['AZ-140 is a Specialty-level certification and, like other Microsoft role-based/specialty certs, '
                'requires annual renewal via a free online assessment.',
                "'Each user needs their own persistent desktop with locally customized apps' points to a "
                "personal host pool; 'many users share stateless desktops' points to pooled + FSLogix.",
                "'Lowest latency over the managed corporate network' points to Shortpath for managed networks; "
                "'connecting over the internet without a VPN' points to Shortpath for public networks or the "
                'reverse connect fallback.',
                "Don't confuse MSIX app attach (dynamically attaching a virtualized app at sign-in without "
                'installing it on the image) with an app fully installed in the golden image.',
                'Windows App is the current client; the Remote Desktop MSI and web clients ended support for '
                'public cloud on March 27, 2026. The feature formerly called MSIX app attach is now just app '
                'attach.',
                'Hibernation (personal-pool autoscale) is not supported with FSLogix or app attach.']},
]

MADLIBS = [
    {
        'id': 'ml-az140-1',
        'cat': 'planInfra',
        'scenario': "A company wants many employees doing similar, non-persistent tasks to share a pool of multi-session VMs — that calls for a {b1}. To keep new sessions concentrated onto as few hosts as possible during off-peak hours, so autoscale can deallocate the emptied ones, that pool's load-balancing algorithm should be set to {b2} rather than the alternative that spreads sessions evenly across every host.",
        'blanks': [
            {'key': 'b1', 'options': ['pooled host pool', 'personal host pool with direct assignment', 'personal host pool with automatic assignment', 'RemoteApp application group'], 'correct': 0},
            {'key': 'b2', 'options': ['breadth-first', 'depth-first', 'round-robin', 'least recently used'], 'correct': 1},
        ],
        'explanation': "A pooled host pool is built for many non-persistent users sharing multi-session VMs. Depth-first fills each host to its session limit before moving to the next, concentrating load and leaving other hosts empty for autoscale to deallocate; breadth-first instead spreads sessions evenly, working against that consolidation goal.",
    },
    {
        'id': 'ml-az140-2',
        'cat': 'userEnvApps',
        'scenario': "A shared image includes a licensed finance app that only the finance department should see in their Start menu — hiding it from everyone else without maintaining a separate image calls for FSLogix {b1}. Separately, the company wants Outlook cached-mode data and OneDrive files to roam with each user while the rest of the profile stays small — that data specifically belongs in the FSLogix {b2}, kept apart from the main profile.",
        'blanks': [
            {'key': 'b1', 'options': ['Application Masking', 'Cloud Cache', 'Redirections.xml', 'Office Container'], 'correct': 0},
            {'key': 'b2', 'options': ['Application Masking rule set', 'Profile Container', 'Office Container', 'Cloud Cache'], 'correct': 2},
        ],
        'explanation': "Application Masking hides an installed app from unauthorized users or groups based on rule sets, without needing a separate image. The Office Container is the distinct container purpose-built for Outlook/OneDrive data, letting it roam separately from the main Profile Container rather than bloating it.",
    },
    {
        'id': 'ml-az140-3',
        'cat': 'identitySecurity',
        'scenario': "A hospital wants to technically block clinical staff from using a screenshot tool to capture sensitive patient data on screen — that calls for {b1}. A separate, weaker control just visibly overlays identifying information on the session as a deterrent and audit trail without actually blocking a capture attempt — that's {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['screen capture protection', 'watermarking', 'drain mode', 'Application Masking'], 'correct': 0},
            {'key': 'b2', 'options': ['screen capture protection', 'watermarking', 'RDP Shortpath', 'Windows LAPS'], 'correct': 1},
        ],
        'explanation': "Screen capture protection actively blocks a session's content from being captured by screenshot or recording tools on the client. Watermarking only visibly overlays deterrent, traceable information — it doesn't technically prevent the capture the way screen capture protection does, which is why the two are complementary rather than interchangeable.",
    },
    {
        'id': 'ml-az140-4',
        'cat': 'monitorMaintain',
        'scenario': "An administrator needs to patch the golden image used by a pooled host pool without disrupting anyone currently connected — that means preventing new sessions from landing on a session host while letting its existing sessions finish naturally, which is {b1}. Once that host sits completely empty, only a host pool with a {b2} already enabled will actually notice and deallocate it to save cost — otherwise it just sits idle regardless.",
        'blanks': [
            {'key': 'b1', 'options': ['drain mode', 'maintenance mode', 'Conditional Access', 'FSLogix Cloud Cache'], 'correct': 0},
            {'key': 'b2', 'options': ['scaling plan (autoscale)', 'MSIX app attach', 'Universal Print connector', 'watermarking policy'], 'correct': 0},
        ],
        'explanation': "Drain mode marks a session host so it stops accepting new sessions while existing ones keep running undisturbed — exactly what's needed before patching without disrupting connected users. But drain mode alone doesn't shut anything down: only a host pool with a scaling plan (autoscale) enabled will detect an emptied, drained host and actually deallocate it, since drain mode and autoscale solve two different halves of this problem.",
    },
    {
        'id': 'ml-az140-5',
        'cat': 'planInfra',
        'scenario': "To let users automatically power on a deallocated session host only when they actually try to connect, instead of leaving every VM running around the clock, the administrator enables {b1}. To let those same connections take a more direct, lower-latency network path between client and session host instead of always relaying through the Azure Virtual Desktop gateway, the administrator separately enables {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['Start VM on Connect', 'a scaling plan (autoscale)', 'drain mode', 'FSLogix Cloud Cache'], 'correct': 0},
            {'key': 'b2', 'options': ['RDP Shortpath', 'Start VM on Connect', 'Azure Firewall', 'FSLogix Application Masking'], 'correct': 0},
        ],
        'explanation': "Start VM on Connect powers on a stopped session host only when a user actually attempts to connect, avoiding paying for VMs that idle around the clock — it is reactive and works on both pool types, unlike scaling plans, which start and deallocate hosts on a schedule. RDP Shortpath instead establishes a more direct, typically UDP-based transport between client and host, cutting latency versus always tunneling through the AVD gateway relay — the two features solve unrelated problems (compute cost vs. network path) and neither substitutes for the other.",
    },
    {'id': 'ml-az140-9001',
     'cat': 'planInfra',
     'scenario': 'To give RDP traffic priority across the corporate network, the session hosts mark RDP packets '
                 'with DSCP value {b1} by using a policy-based QoS Group Policy. This works only when RDP '
                 'Shortpath for {b2} is in use, because QoS policies are not supported for the {b3} transport.',
     'blanks': [{'key': 'b1', 'options': ['46', '3389', '443', '0'], 'correct': 0},
                {'key': 'b2',
                 'options': ['public networks', 'internal DNS zones', 'validation hosts', 'managed networks'],
                 'correct': 3},
                {'key': 'b3',
                 'options': ['UDP Shortpath', 'Kerberos', 'reverse connect (TCP)', 'SMB'],
                 'correct': 2}],
     'explanation': 'Microsoft recommends DSCP 46 (Expedited Forwarding). The marking is useful when the network '
                    'honors it end to end, which is the managed-network Shortpath case. The reverse connect '
                    'transport does not support QoS policies.'},
    {'id': 'ml-az140-9002',
     'cat': 'userEnvApps',
     'scenario': 'App attach mounts an application image from an {b1} file share when a user signs in. With {b2} '
                 'registration, an app is only partially registered at sign-in and fully registered when the '
                 'user starts it, which is why it is the default. The fastest image format on Windows 11 hosts '
                 'is {b3}.',
     'blanks': [{'key': 'b1', 'options': ['FTP', 'SMB', 'NFS-only', 'HTTP'], 'correct': 1},
                {'key': 'b2',
                 'options': ['log on blocking', 'inactive', 'on-demand', 'side-by-side'],
                 'correct': 2},
                {'key': 'b3', 'options': ['CimFS', 'VHD', 'ISO', 'WIM'], 'correct': 0}],
     'explanation': 'App attach images live on an SMB share. On-demand registration keeps sign-in fast, whereas '
                    'log on blocking fully registers every assigned app during sign-in. CimFS mounts and '
                    'unmounts faster than VHD or VHDX and is recommended for Windows 11 hosts.'},
]

# Mini case studies: a shared scenario with several related questions
# answered in sequence, mirroring how a real exam groups multiple questions
# off one larger case rather than testing each fact in isolation. Every
# embedded question still follows the same mc/tf/ms shape as QUESTIONS above.
CASE_STUDIES = [
    {
        'id': 'cs-az140-northwind-avd',
        'cat': 'planInfra',
        'title': "Northwind Traders' Azure Virtual Desktop Rollout",
        'scenario': (
            "Northwind Traders is deploying Azure Virtual Desktop for two very different groups of users. "
            "The first group is 500 call-center agents who all run the same line-of-business app and need "
            "identical, non-persistent desktops drawn from a shared pool — none of them need to keep any "
            "local customization between sessions. The second group is 20 computer-aided-design (CAD) "
            "engineers who each need a dedicated, persistent VM that remembers their installed plugins and "
            "customizations from one session to the next. Security has separately mandated that the CAD "
            "engineers' workstations technically block any attempt to screenshot the proprietary designs on "
            "screen, not just discourage it. Finally, the operations team wants the call-center pool's session "
            "hosts to scale down automatically outside business hours to save cost, and wants a way to patch "
            "that pool's golden image without disconnecting agents who are mid-shift."
        ),
        'questions': [
            {
                'id': 'cs-az140-northwind-avd-q1',
                'type': 'mc',
                'question': "Which host pool type fits the 500 call-center agents, who share identical, non-persistent desktops with no need to retain local customization between sessions?",
                'options': [
                    "A pooled host pool",
                    "A personal host pool with direct assignment",
                    "A personal host pool with automatic assignment",
                    "A RemoteApp application group",
                ],
                'correct': 0,
                'explanation': "A pooled host pool is exactly built for many non-persistent users load-balanced across shared multi-session VMs, matching the call-center agents' needs. Both personal host pool variants dedicate one VM per user rather than sharing them, and a RemoteApp application group is a way of publishing individual apps rather than a host pool type at all.",
            },
            {
                'id': 'cs-az140-northwind-avd-q2',
                'type': 'mc',
                'question': "Which host pool type fits the 20 CAD engineers, who each need a dedicated VM that keeps their installed plugins and customizations between sessions?",
                'options': [
                    "A pooled host pool",
                    "A personal host pool",
                    "A RemoteApp application group",
                    "A pooled host pool running Windows 11 Enterprise multi-session",
                ],
                'correct': 1,
                'explanation': "A personal host pool dedicates one VM per user, so whatever a CAD engineer installs or customizes persists across sessions — the defining reason to choose personal over pooled. Every pooled variant, multi-session or not, shares VMs across users and doesn't guarantee the same VM (or its state) is there next time.",
            },
            {
                'id': 'cs-az140-northwind-avd-q3',
                'type': 'tf',
                'question': "True or false: technically blocking the CAD engineers from capturing screenshots of their session, rather than just deterring it, requires enabling FSLogix Application Masking.",
                'answer': False,
                'explanation': "FSLogix Application Masking hides an installed app from unauthorized users — it has nothing to do with screen capture at all. The control that actually blocks a screenshot or recording attempt from succeeding is screen capture protection; watermarking is the weaker, deterrent-only control that doesn't block anything either.",
            },
            {
                'id': 'cs-az140-northwind-avd-q4',
                'type': 'ms',
                'question': "Which two features should the operations team use to (a) scale the call-center pool's session hosts down automatically outside business hours and (b) patch that pool's golden image without disconnecting agents mid-shift? (Select two.)",
                'options': [
                    "A scaling plan (autoscale) applied to the pooled host pool",
                    "Drain mode on the session host being patched",
                    "FSLogix Cloud Cache for profile roaming",
                    "Start VM on Connect",
                ],
                'correct': [0, 1],
                'explanation': "A scaling plan (autoscale) is what actually powers hosts down (and back up) on a schedule to match off-peak demand. Drain mode is the separate control that stops a specific host from accepting new sessions while letting existing ones finish, which is what lets it be patched without disconnecting anyone already on it. FSLogix Cloud Cache addresses profile roaming resiliency, and Start VM on Connect only powers on a deallocated VM when a user connects — neither one scales the pool down or supports a non-disruptive patch.",
                'whyTested': "The scenario deliberately pairs two operational goals (cost savings and non-disruptive patching) that call for two different, easily confused AVD features — picking only one of the two correct options, or reaching for Start VM on Connect, which only reacts to connections and never deallocates anything, is the mistake this question is designed to catch.",
            },
        ],
    },
]

# "Choose the more correct answer": both options are plausible, one is the
# better fit for the stated scenario. `better` names it ('A' or 'B'); the app
# re-shuffles display order per session so position never leaks the answer.
COMPARE = [
    {
        'id': 'cmp-az140-1',
        'cat': 'planInfra',
        'scenario': "A 1,200-user deployment needs storage for FSLogix profile containers. Peak sign-in load is moderate, the team is small, and it wants the simplest option that still delivers SSD-class performance. Which is the better storage choice?",
        'optionA': "Azure Files Premium, because it gives SSD-backed SMB shares with no extra network design.",
        'optionB': "Azure NetApp Files, because it delivers the lowest latency and highest throughput available.",
        'better': 'A',
        'why': "At this scale and load, premium Azure Files meets the performance need without a delegated subnet, a capacity pool, or the added cost that come with Azure NetApp Files. NetApp Files is the runner-up because it really is the fastest FSLogix storage option, but that advantage matters for very large or performance-critical deployments; here it would add setup and spend for headroom the scenario does not call for.",
    },
    {
        'id': 'cmp-az140-2',
        'cat': 'planInfra',
        'scenario': "Compliance requires that Azure Virtual Desktop client and session host traffic not use public service endpoints, even though users already connect over a VPN. Which is the better way to meet the requirement?",
        'optionA': "RDP Shortpath for managed networks, because it carries session traffic directly over UDP on the private network.",
        'optionB': "Azure Private Link for Azure Virtual Desktop, because it exposes the service through private endpoints instead of public ones.",
        'better': 'B',
        'why': "The requirement is about which endpoints are reachable, and Private Link is the feature that places the AVD service behind private endpoints so connections avoid public addresses. Shortpath for managed networks is the runner-up, but it is a transport optimization: it makes the data path direct and private for clients with private connectivity, yet it does not change which service endpoints are public, and sessions fall back to the gateway path whenever UDP cannot be established.",
    },
    {
        'id': 'cmp-az140-3',
        'cat': 'planInfra',
        'scenario': "Contoso's analysts need persistent VMs with local admin rights, but each works only about two hours a day, and cost must be minimized. IT already runs Azure Virtual Desktop. Which is the better choice?",
        'optionA': "Windows 365 Enterprise Cloud PCs, because a flat monthly price per user is predictable and needs no infrastructure planning.",
        'optionB': "A personal host pool with Start VM on Connect and a deallocate-on-disconnect scaling plan, so compute is billed only while VMs run.",
        'better': 'B',
        'why': "With about two hours of use a day, paying only for running compute is the cost-minimizing model, and a personal host pool with Start VM on Connect and a scaling plan that deallocates on disconnect delivers that while keeping each analyst's persistent VM and admin rights. Windows 365 is the runner-up because its flat price is predictable and needs no planning, but that fixed fee pays for around-the-clock availability, which light daily use does not justify.",
    },
    {
        'id': 'cmp-az140-4',
        'cat': 'planInfra',
        'scenario': "A pooled host pool of 40 hosts serves 600 users who all sign in between 7:30 and 8:30 every weekday, and the hosts sit idle overnight. Management wants lower compute cost, but users must not wait for a VM to boot. Which is the better approach?",
        'optionA': "A scaling plan whose ramp-up starts hosts before 7:30 and whose ramp-down deallocates them after hours.",
        'optionB': "Start VM on Connect, with a nightly script that deallocates every host so each starts when needed.",
        'better': 'A',
        'why': "The demand pattern is predictable, so a scaling plan can have hosts running before the first user arrives and deallocate them afterward, meeting both the cost goal and the no-wait goal. Start VM on Connect is the runner-up and does cut idle cost, but it is reactive: the first users to reach each deallocated host wait for it to boot, and a rush of sign-ins triggers many starts at once. It also depends on a custom script for the overnight shutdown.",
    },
    {
        'id': 'cmp-az140-5',
        'cat': 'identitySecurity',
        'scenario': "Contoso is deploying 300 session hosts for a cloud-first company that has no domain controllers in Azure, manages devices with Intune, and runs only cloud-based apps. Which join type is the better choice for the session hosts?",
        'optionA': "Microsoft Entra join, because hosts need no domain controller line of sight and can be managed through Intune.",
        'optionB': "Hybrid Entra join, because it keeps the hosts joined to an on-premises domain while syncing to the cloud.",
        'better': 'A',
        'why': "Nothing in this environment needs AD DS, so Entra join is the simpler fit: no domain controllers to reach and no domain join to maintain, with Intune handling management (users then need a VM login role such as Virtual Machine User Login). Hybrid join is the runner-up and is the right answer when apps or file shares still depend on Kerberos or NTLM to on-premises resources, or when Group Policy is required, but here it would add domain infrastructure and device sync with no matching need.",
    },
    {
        'id': 'cmp-az140-6',
        'cat': 'identitySecurity',
        'scenario': "Security wants Azure Virtual Desktop users challenged for MFA only when their device is not Intune-compliant, with no extra prompts on compliant devices. Which is the better control?",
        'optionA': "Per-user MFA set to Enforced for the users, because it guarantees a prompt for each account.",
        'optionB': "A Conditional Access policy for the AVD apps that requires MFA or a compliant device.",
        'better': 'B',
        'why': "Conditional Access can evaluate device state and grant access when either MFA or compliance is satisfied, so compliant devices skip the prompt and everything else is challenged. Per-user MFA is the runner-up because it does guarantee MFA, but it prompts the account regardless of the device and has no way to key off Intune compliance, so it fails the requirement of no extra prompts on compliant devices.",
    },
    {
        'id': 'cmp-az140-7',
        'cat': 'userEnvApps',
        'scenario': "Teams calls in AVD sessions turn choppy once about 20 users share each multi-session host, and host CPU spikes during calls. Which is the better fix?",
        'optionA': "Move the session hosts to a larger VM size so each host has more vCPUs for media encoding.",
        'optionB': "Enable Teams media optimization so call audio and video are processed on each user's client device.",
        'better': 'B',
        'why': "Media optimization removes the cause by moving real-time media processing off the shared host and onto each user's device, so it keeps working as more users join. A larger VM is the runner-up because more vCPUs would ease the CPU pressure, but it keeps all call processing on the host, raises cost, and the problem returns as concurrency grows.",
    },
    {
        'id': 'cmp-az140-8',
        'cat': 'userEnvApps',
        'scenario': "Contoso publishes only RemoteApps, with no desktops, and a finance application, already installed on the shared hosts, must be visible to finance staff only. Which is the better way to limit visibility?",
        'optionA': "Publish it in its own RemoteApp application group and assign that group to the finance group.",
        'optionB': "Add FSLogix Application Masking and write a rule that hides the app from non-finance users.",
        'better': 'A',
        'why': "When apps are published as RemoteApps, who sees what is controlled by application group assignment, so a dedicated group for the finance app solves the problem natively with nothing extra to deploy. Application Masking is the runner-up and would hide the app, but it adds a component and rule set to maintain for something the application group already handles; it earns its place when users get a full desktop, where application group assignment cannot filter individual apps.",
    },
    {
        'id': 'cmp-az140-9',
        'cat': 'monitorMaintain',
        'scenario': "One user reports that her connection at 09:14 failed. The admin must see the sequence of stages that connection reached before it stalled. Which is the better tool?",
        'optionA': "The AVD Insights workbook, because it summarizes connection reliability across the host pool at a glance.",
        'optionB': "A KQL query against the WVDCheckpoints table, filtered by that connection's CorrelationId.",
        'better': 'B',
        'why': "The checkpoints table holds the timestamped stages each connection passed through, and filtering by the connection's correlation ID isolates this one failure and shows exactly where it stopped. Insights is the runner-up and is excellent for host pool-wide trends and failure summaries, but it aggregates data and does not lay out the stage-by-stage timeline of a single connection.",
    },
    {
        'id': 'cmp-az140-10',
        'cat': 'monitorMaintain',
        'scenario': "Contoso patches Windows monthly with Azure Update Manager, but AVD agent restarts occasionally interrupt users mid-morning. The admin wants agent updates to install only inside a weekend window. Which is the better control?",
        'optionA': "Scheduled agent updates on the host pool, with a weekend maintenance window.",
        'optionB': "An Azure Update Manager maintenance configuration scheduled for the weekend.",
        'better': 'A',
        'why': "The AVD agent and side-by-side stack update through the AVD service, and scheduled agent updates is the host pool setting that confines those updates to a chosen window. Update Manager is the runner-up and already handles the monthly Windows patches, but it schedules operating system updates, so a weekend maintenance configuration there leaves the agent free to update during business hours.",
    },
    {'id': 'cmp-az140-9001',
     'cat': 'planInfra',
     'scenario': 'A WAN team can mark packets end to end and wants RDP traffic to beat bulk transfers on a '
                 'private path between branches and the session hosts. Which is the better approach?',
     'optionA': 'RDP Shortpath for managed networks with policy-based QoS marking RDP with DSCP 46',
     'optionB': 'The reverse connect transport with a QoS policy on the session hosts',
     'better': 'A',
     'why': 'QoS policies are supported only on the managed-network Shortpath transport, where UDP traffic can '
            'carry a DSCP marking that the network honors. Reverse connect traffic flows through the AVD gateway '
            'over TCP 443, so a marking applied on the hosts does not give it priority across networks you do '
            'not control.'},
    {'id': 'cmp-az140-9002',
     'cat': 'identitySecurity',
     'scenario': 'Administrators occasionally need RDP access to specific session hosts for troubleshooting. '
                 'Security wants no standing open management ports. Which is the better approach?',
     'optionA': "A permanent NSG rule that allows TCP 3389 from the administrators' office IP range",
     'optionB': 'Just-in-time VM access or Azure Bastion, so access is requested and time-limited',
     'better': 'B',
     'why': 'Microsoft recommends avoiding direct RDP to session hosts. Just-in-time access opens the port only '
            'for an approved window and source, and Bastion removes the need to expose RDP at all. A permanent '
            'rule leaves the management port open around the clock even if the source range is restricted.'},
    {'id': 'cmp-az140-9003',
     'cat': 'monitorMaintain',
     'scenario': 'A pooled host pool needs a monthly OS update across 40 hosts, with every host ending up '
                 'identical and an easy rollback if the image misbehaves. Which is the better approach?',
     'optionA': 'Build a new tested image version and replace the hosts with it, for example through session '
                'host update',
     'optionB': 'Patch each host in place on its own schedule using Windows Update',
     'better': 'A',
     'why': 'Replacing hosts from a tested image gives every host the same configuration and lets you roll back '
            'by pointing at the previous version. In-place patching drifts over time and a bad update has to be '
            'undone host by host.'},
]
