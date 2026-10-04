"""Cross-cert bridges, infra group: networking, compute and deployment.

Exports BRIDGES (see data/bridges.py for the shape).
"""

BRIDGES = [
    # ------------------------------------------------------------------
    # 1. Filtering traffic
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-traffic-filtering',
        'title': 'Filtering traffic: NSGs, firewalls and ACLs',
        'summary': "Every platform stacks several layers that allow or deny traffic: a light filter close to the workload, a central firewall that can see more, and, for platform services, the service's own firewall. The skill is matching the layer to what it can actually see (address, port, protocol, a domain name, or the caller's public IP), how wide its scope is, and whether it remembers a connection or judges every packet alone.",
        'appearsIn': [
            {
                'track': 'az104',
                'lesson': 'az104-networking',
                'angle': 'Network security groups carry rules with a priority number; the lowest number is evaluated first and the first match wins, whether it allows or denies. Application security groups let a rule name a role of NICs instead of hardcoded IPs, and Network Watcher IP flow verify tells you which rule decided a flow.',
            },
            {
                'track': 'az305',
                'lesson': 'compute-networking-architecture',
                'angle': 'Frames it as a two-tier design choice: an NSG is a free per-subnet or per-NIC allow/deny filter on IP, port and protocol, while Azure Firewall is a managed, stateful, central firewall in the hub that adds FQDN-based filtering and unified logging across many VNets.',
            },
            {
                'track': 'cloudplus',
                'lesson': 'security-fundamentals',
                'angle': 'Teaches the vendor-neutral vocabulary: a stateful firewall tracks connection state and lets return traffic back automatically, a stateless filter judges each packet alone and needs rules in both directions. Security groups sit at the instance level, network ACLs at the subnet level, and a DMZ plus IDS/IPS add layered zones and inspection.',
            },
            {
                'track': 'dp300',
                'lesson': 'security-and-data-protection',
                'angle': 'Azure SQL has its own firewall at the service endpoint: server-level rules (stored in master) cover every database on the logical server, database-level rules travel with one database through copy and geo-replication, and both are allow-only rules for who may reach the public endpoint (there are no deny rules). A private endpoint is the stricter boundary that removes the public path for VNet clients.',
            },
        ],
        'watchOut': "Three things called a firewall rule behave differently. A Cloud+ network ACL is stateless and needs a rule for each direction, but an Azure NSG is stateful, so a reply to an allowed inbound connection is not stopped by an outbound deny. NSG rules are ordered by priority number, not by list position and not by deny-beats-allow. And an NSG on your subnet does not govern who reaches an Azure SQL logical server's public endpoint, where the firewall is allow-only: you list what may connect (IP ranges), and there are no deny rules.",
        'questions': [
            {
                'id': 'br-infra-traffic-filtering-q1',
                'type': 'mc',
                'question': "Your company runs a hub-and-spoke network in Azure with eight spoke VNets. Security requires that workloads in every spoke can send outbound HTTPS only to hosts under *.fabrikam-partner.com, and that allowed and denied requests are logged in one place. A colleague with a traditional data-center background proposes a stateless network ACL on each spoke subnet that lists the partner's current IP addresses. What should you implement instead?",
                'options': [
                    'An NSG on every spoke subnet with outbound rules that use the partner domain name as the destination',
                    "A stateless network ACL on every spoke subnet listing the partner's published IP ranges, reviewed monthly",
                    'Azure Firewall in the hub with an application rule for the partner domain, and user-defined routes that send spoke egress through it',
                    'Application security groups on each spoke with a rule that allows the partner by name',
                ],
                'correct': 2,
                'explanation': "FQDN-based outbound filtering with central logging across many VNets is what Azure Firewall adds: an application rule allows the partner domain, and user-defined routes force spoke egress through the hub firewall so the rule is actually applied. An NSG destination can be an IP, a range, a service tag or an application security group, never a domain name, so per-subnet NSG rules cannot express the requirement. The ACL idea fails twice: a list of IPs goes stale when the partner changes addresses, and there is no single log. Application security groups group your own NICs; they do not resolve or match external names.",
                'whyTested': 'Exams reward knowing which layer can see a domain name and which cannot, and the stateless-ACL distractor is the right instinct in a different (IP-only) frame.',
            },
            {
                'id': 'br-infra-traffic-filtering-q2',
                'type': 'mc',
                'question': 'An engineer who has managed traditional firewalls configures the NSG on an Azure subnet. Inbound rules: priority 150 denies all protocols from 203.0.113.0/24, and priority 200 allows TCP 443 from the Internet service tag. A custom outbound rule at priority 100 denies all traffic to the Internet service tag. A client at 203.0.113.9 and a client at 198.51.100.4 each try to open an HTTPS connection to a VM in the subnet. What happens?',
                'options': [
                    'The client at 203.0.113.9 is blocked by the priority 150 rule; the client at 198.51.100.4 connects and its replies leave normally, because NSGs are stateful',
                    'Both clients connect, because Azure evaluates allow rules before deny rules regardless of priority number',
                    'The client at 203.0.113.9 is blocked, but the client at 198.51.100.4 cannot complete a connection because its replies hit the outbound deny, as they would with a stateless ACL',
                    'The client at 203.0.113.9 connects, because the priority 200 allow has the higher number and is evaluated first',
                ],
                'correct': 0,
                'explanation': 'Rules are evaluated from the lowest priority number up and the first match decides, so 150 blocks 203.0.113.9 before the 200 allow is ever reached. For the permitted client, the NSG tracks the connection, so the reply to an allowed inbound flow is not subject to the outbound deny. The stateless-ACL reading (replies dropped without a mirror rule) is correct in Cloud+ vocabulary for network ACLs but wrong for NSGs. There is no allow-before-deny phase and a higher number is evaluated later, not sooner.',
                'whyTested': 'It forces you to combine two habits from different cert frames: priority-number ordering (AZ-104) and stateful versus stateless behavior (Cloud+).',
            },
            {
                'id': 'br-infra-traffic-filtering-q3',
                'type': 'mc',
                'question': 'An application in a spoke VNet connects to an Azure SQL database. A security reviewer requires that only the application VMs can reach the database, that the connection never crosses the public internet, and that nobody has to maintain IP allow lists. Which design meets all three requirements?',
                'options': [
                    "Add a server-level firewall rule for the application subnet's public outbound IP address and leave public network access on",
                    "Add a database-level firewall rule for the application subnet's public outbound IP address so the rule travels with the database",
                    'Add an inbound NSG rule on the application subnet that denies the Internet service tag',
                    'Create a private endpoint for the logical server in the VNet and turn off public network access to it',
                ],
                'correct': 3,
                'explanation': "A private endpoint gives the logical server a private IP in the VNet and, with public network access turned off, removes the public path entirely, so no IP allow list is needed. Server-level and database-level IP firewall rules both work by allowing public IP addresses, so the traffic still uses the public endpoint and someone still maintains the list (database-level rules differ only in traveling with the database). An NSG on the application subnet filters traffic to and from the VMs in that subnet; it does not control who can reach the SQL logical server's public endpoint.",
                'whyTested': 'The NSG answer is the correct tool in the network frame and simply does not apply to a platform service endpoint, which is the DP-300 point.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 2. Name resolution
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-name-resolution',
        'title': 'Name resolution across on-premises and Azure',
        'summary': "A working network link does not mean names resolve. Public DNS zones answer anyone, private zones answer only the networks they are attached to, and on-premises DNS and Azure DNS only know about each other if you wire them together with forwarding or shared replication. Most hybrid failures that look like connectivity problems are really resolving to the wrong address.",
        'appearsIn': [
            {
                'track': 'az802',
                'lesson': 'on-premises-hybrid-networking',
                'angle': 'Covers the Windows Server zone types: primary (writable), secondary (read-only copy via zone transfer), stub (only NS, SOA and glue records, refreshed from the authoritative servers) and AD-integrated (multi-master replication to every DC with secure dynamic updates). It also contrasts a stub zone with a conditional forwarder, which sends a namespace to a static list of server IPs.',
            },
            {
                'track': 'az104',
                'lesson': 'az104-networking',
                'angle': 'Azure DNS hosts public zones that resolve from the internet; private DNS zones resolve only inside the VNets linked to them, with auto-registration set per link. It is also how the normal hostname of a resource behind a private endpoint resolves to its private IP.',
            },
            {
                'track': 'az305',
                'lesson': 'compute-networking-architecture',
                'angle': 'Puts DNS in the hub of a hub-and-spoke design and tests the hybrid gap: records in a private DNS zone resolve only from linked VNets, so on-premises DNS must forward those queries to something inside Azure, such as an Azure DNS Private Resolver inbound endpoint or a forwarder VM.',
            },
            {
                'track': 'az900',
                'lesson': 'networking',
                'angle': 'Introduces Azure DNS as one of the basic networking building blocks next to VNets, peering, VPN Gateway and ExpressRoute, and tests the difference between answering public queries for your domain and resolving names only inside linked virtual networks.',
            },
        ],
        'watchOut': "Zone means two different things. In Windows Server, the zone types describe how records are copied between DNS servers you run. In Azure DNS, a zone is a managed service object that is either public or private, and a private zone is a visibility scope: only its linked VNets see it. Peering, VPN or ExpressRoute give you IP routing but not name resolution, and an Azure private zone cannot be reached by on-premises servers by itself.",
        'questions': [
            {
                'id': 'br-infra-name-resolution-q1',
                'type': 'mc',
                'question': 'A hub VNet connects to the on-premises network over ExpressRoute. VMs in the spoke VNets must resolve names in corp.contoso.com, an AD-integrated zone on on-premises domain controllers, and must still resolve privatelink records from Azure private DNS zones linked to their VNets. The team does not want to run and patch DNS VMs. What should they use?',
                'options': [
                    "Set the spoke VNets' custom DNS servers to the on-premises domain controllers",
                    'An Azure DNS Private Resolver with an outbound endpoint and a forwarding rule that sends corp.contoso.com queries to the domain controllers',
                    'A public Azure DNS zone named corp.contoso.com with the on-premises records copied into it',
                    'A private DNS zone named corp.contoso.com linked to the spokes with auto-registration enabled',
                ],
                'correct': 1,
                'explanation': 'A Private Resolver outbound endpoint with a forwarding rule sends only the on-premises namespace to the domain controllers while the VNets keep using Azure-provided DNS, so the linked private zones keep working, and nothing needs patching. Pointing the VNets at on-premises DNS sends every query there, and on-premises servers cannot see Azure private zones, so privatelink names would break. A public zone would publish internal names on the internet and go stale. Auto-registration only registers Azure VMs into the zone; it does not bring on-premises records into Azure.',
                'whyTested': 'Setting custom DNS to on-premises servers is a natural AZ-802 reflex that quietly breaks private zones, which is the AZ-305 hybrid-DNS trap.',
            },
            {
                'id': 'br-infra-name-resolution-q2',
                'type': 'mc',
                'question': 'A storage account has a private endpoint in a subnet of Spoke1, and public network access to it is disabled. The privatelink.blob.core.windows.net private DNS zone is linked only to Spoke1. VMs in the hub VNet, which is peered to Spoke1, use Azure-provided DNS and get connection failures: the account name resolves to a public IP address. What fixes it?',
                'options': [
                    'Enable auto-registration on a new link between the zone and the hub VNet',
                    'Add a stub zone for blob.core.windows.net to the hub VNet DNS settings',
                    'Link the privatelink.blob.core.windows.net zone to the hub VNet',
                    'Allow forwarded traffic on the peering between the hub and Spoke1',
                ],
                'correct': 2,
                'explanation': 'A private DNS zone answers only for the VNets linked to it, and peering does not extend that visibility, so the hub resolves the public address until the zone is linked to it. Auto-registration registers VM records and has nothing to do with the endpoint record that already exists in the zone. A stub zone is a Windows Server DNS feature and is not configured on a VNet. Allowing forwarded traffic on the peering changes packet forwarding between networks, not which DNS zones a VNet can see.',
                'whyTested': 'Peering feels like it should merge two networks completely; the exam point is that name resolution scope is a separate, per-link setting.',
            },
            {
                'id': 'br-infra-name-resolution-q3',
                'type': 'mc',
                'question': 'Contoso runs AD DS with an AD-integrated DNS zone, corp.contoso.com. It adds two domain controllers as VMs in an Azure spoke VNet. Azure-hosted servers must resolve and dynamically register in corp.contoso.com, with records replicated automatically and updates accepted only from authenticated computers, and without configuring zone transfers. What should Contoso do?',
                'options': [
                    "Install the DNS Server role on the Azure-hosted domain controllers so the AD-integrated zone replicates to them through AD, and point the VNet's custom DNS servers at them",
                    'Create an Azure private DNS zone named corp.contoso.com linked to the VNet with auto-registration, and forward on-premises queries to it',
                    'Create a secondary zone on an Azure VM and configure zone transfers from an on-premises primary',
                    'Create a stub zone for corp.contoso.com on an Azure VM',
                ],
                'correct': 0,
                'explanation': 'An AD-integrated zone is stored in Active Directory and replicates multi-master to every DNS-enabled domain controller, with secure dynamic updates, so adding DCs in Azure extends the same zone with no transfers to manage. An Azure private zone would be a second, separate zone with no secure dynamic updates from domain members and no AD replication. A secondary zone is a read-only copy kept by manually configured transfers, so clients could not update it. A stub zone holds only NS, SOA and glue records, not the actual records.',
                'whyTested': 'The Azure private zone is the answer when the question is about Azure-only name scope, and the wrong one when the requirement is AD replication and secure updates.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 3. Hybrid links: VPN versus ExpressRoute
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-hybrid-link',
        'title': 'Hybrid links: VPN, ExpressRoute and what rides on them',
        'summary': "Connecting a data center to Azure comes down to the same two on-ramps in every cert: an encrypted tunnel across the public internet, or a private dedicated circuit through a connectivity provider. The first is cheap and fast to stand up but inherits internet variability; the second gives predictable bandwidth and latency at higher cost and longer lead time. Which one you pick decides how well everything layered on top of it performs.",
        'appearsIn': [
            {
                'track': 'az900',
                'lesson': 'networking',
                'angle': 'Introduces VPN Gateway as the encrypted tunnel over the public internet (cheaper, quicker) and ExpressRoute as the private, dedicated connection with more predictable performance, and stresses that ExpressRoute is not encrypted by default.',
            },
            {
                'track': 'az802',
                'lesson': 'on-premises-hybrid-networking',
                'angle': 'Tests the choice between a Site-to-Site VPN and ExpressRoute by what the scenario values (predictable latency and available bandwidth over cost points to ExpressRoute). It also covers NPS as the RADIUS policy engine for VPN and 802.1X access, while RRAS or a third-party VPN device is what actually terminates the VPN.',
            },
            {
                'track': 'az305',
                'lesson': 'compute-networking-architecture',
                'angle': 'Puts the VPN or ExpressRoute gateway in the hub of a hub-and-spoke design, picks ExpressRoute whenever the scenario demands the highest predictable bandwidth and latency, and uses Azure Virtual WAN to automate hub and branch connectivity across many regions.',
            },
            {
                'track': 'az140',
                'lesson': 'networking-storage-capacity-planning',
                'angle': 'Shows what rides on the link: RDP Shortpath for managed networks gives a direct UDP path between client and session host, but only where direct line-of-sight exists, such as over a VPN or ExpressRoute. Round-trip time to the session host region dominates how responsive a session feels.',
            },
        ],
        'watchOut': "Private is not the same as encrypted: ExpressRoute is a private circuit with no encryption by default, while VPN Gateway is encrypted but crosses the public internet. In RDP Shortpath, a managed network means one with direct IP reachability between client and session host, not one managed by Intune. And in AZ-802, a VPN may be a remote-access VPN terminated by RRAS with NPS answering as the RADIUS server, which is a different thing from Azure's Site-to-Site gateway.",
        'questions': [
            {
                'id': 'br-infra-hybrid-link-q1',
                'type': 'mc',
                'question': 'A regulated company needs a link between its data center and Azure that avoids the public internet and has predictable latency. Its security policy also requires all traffic between the sites to be encrypted in transit. Which design meets all of this?',
                'options': [
                    'ExpressRoute alone, because a private circuit that bypasses the internet is encrypted by default',
                    'A Site-to-Site VPN alone, because it is encrypted and fast to deploy',
                    'A Site-to-Site VPN with a second tunnel for redundancy',
                    'ExpressRoute with encryption added on top, such as IPsec tunnels or TLS between the endpoints',
                ],
                'correct': 3,
                'explanation': 'ExpressRoute supplies the private path and predictable latency, but it is not encrypted by default, so the encryption requirement is met by layering your own (an IPsec tunnel or application-level TLS end to end; MACsec on ExpressRoute Direct ports protects only the physical link to Microsoft). ExpressRoute alone leaves the encryption requirement unmet because private does not mean encrypted. A Site-to-Site VPN is encrypted but crosses the public internet, so it fails both the avoid-the-internet and predictable-latency requirements, and a redundant second tunnel changes neither.',
                'whyTested': 'The private-means-encrypted assumption is the single most repeated trap across the Azure fundamentals and architect exams.',
            },
            {
                'id': 'br-infra-hybrid-link-q2',
                'type': 'mc',
                'question': 'An Azure Virtual Desktop deployment serves branch-office staff, whose offices reach the session host VNet over a site-to-site VPN, and remote employees on home broadband with no private path into Azure. The goal is lower latency by using direct UDP transport instead of relaying through the gateway, and branch traffic must stay on the private VPN path. Which approach fits?',
                'options': [
                    'RDP Shortpath for managed networks for both groups, since the VPN already provides a private path',
                    'RDP Shortpath for managed networks for the branch offices over the VPN, and RDP Shortpath for public networks for the remote employees',
                    'RDP Shortpath for public networks for both groups, since it works from any client',
                    'Neither group qualifies, because Shortpath works only over an ExpressRoute circuit',
                ],
                'correct': 1,
                'explanation': 'Shortpath for managed networks needs direct line-of-sight connectivity, which a VPN provides for the branches, so their traffic stays on the private path. Home users have no such path, so they use Shortpath for public networks, which relies on STUN and TURN NAT traversal. Using the managed variant for the home users fails because no private path exists. Using the public variant for the branches would send their traffic over the internet, breaking the stated requirement. Shortpath does not require ExpressRoute; a VPN is enough.',
                'whyTested': 'It tests whether you read managed network as a connectivity fact (VPN or ExpressRoute reachability) and not as a management term.',
            },
            {
                'id': 'br-infra-hybrid-link-q3',
                'type': 'mc',
                'question': 'A company already runs a hub-and-spoke design with one ExpressRoute circuit. It now needs to connect 40 branch offices in six regions to Azure and to each other, using a mix of VPN and ExpressRoute, and wants hub connectivity and routing automated instead of hand-building and peering a hub in every region. What should it use?',
                'options': [
                    'Azure Virtual WAN',
                    'VNet peering in a full mesh between every regional VNet',
                    'Azure Traffic Manager with each branch registered as an endpoint',
                    'A Site-to-Site VPN from every branch to the single existing hub VPN gateway',
                ],
                'correct': 0,
                'explanation': 'Azure Virtual WAN automates hub-and-spoke connectivity, branch VPN and ExpressRoute attachment, and routing across many regions, which is exactly the stated need. A peering mesh connects Azure VNets only, is not transitive, and does nothing for branch offices. Traffic Manager is DNS-based routing of client requests and creates no network connectivity. Pointing every branch at one hub gateway keeps the manual, single-region design and does not scale to six regions with automated routing.',
                'whyTested': 'It separates connecting networks (Virtual WAN) from steering clients (Traffic Manager), two services that both sound global.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 4. Virtualization, containers and session hosts
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-virtualization-layers',
        'title': 'Virtual machines, containers and session hosts',
        'summary': "Virtualization happens at different layers. A hypervisor gives each workload its own virtual machine and operating system; a container shares the host kernel, so it is lighter and starts faster; multi-session lets many users share one VM's operating system; and a Cloud PC is simply one VM per person. Each layer trades isolation, density and startup time against who has to run it.",
        'appearsIn': [
            {
                'track': 'cloudplus',
                'lesson': 'deployment-models-virtualization',
                'angle': "Vendor-neutral view: a Type 1 hypervisor runs on bare metal and is the production standard, a Type 2 hypervisor needs a host OS. A container virtualizes at the OS level and shares the host's kernel, so it starts in seconds with a small footprint but is less isolated than a VM.",
            },
            {
                'track': 'az802',
                'lesson': 'hybrid-management-clustering-virtualization',
                'angle': 'Hyper-V specifics: a VM generation (Generation 2 for UEFI, Secure Boot and boot disks above 2 TB) cannot be changed after creation, and the virtual switch type (external, internal, private) sets who the VM can reach. Containers use process isolation (shared kernel) or Hyper-V isolation (each container in its own lightweight utility VM with its own kernel).',
            },
            {
                'track': 'az140',
                'lesson': 'host-pools-and-images',
                'angle': 'Session hosts are VMs in your own subscription. A pooled host pool shares multi-session session hosts across many users using Windows Enterprise multi-session, while a personal host pool dedicates one session host to each user. The control plane (broker, gateway, web access) stays with Microsoft.',
            },
            {
                'track': 'md102',
                'lesson': 'device-provisioning-updates',
                'angle': 'Windows 365 Cloud PCs are provisioned by a policy that targets a group of licensed users, and each one is a dedicated single-user VM that Microsoft manages at a per-user price. Frontline licenses a smaller shared pool across shift-based users. Azure Virtual Desktop is the alternative where the organization builds and scales the pool itself.',
            },
        ],
        'watchOut': "Isolation means different things at different layers. Cloud+ says containers are less isolated than VMs because they share a kernel, which is true of process isolation but not of Hyper-V isolation, where each container gets its own kernel. Multi-session is neither a container nor a VM per user: it is many isolated user sessions on one OS. And a Windows 365 Cloud PC is always one dedicated VM for one user, with no host pool or scaling plan to manage.",
        'questions': [
            {
                'id': 'br-infra-virtualization-layers-q1',
                'type': 'mc',
                'question': 'A hosting company runs Windows containers for several customers who do not trust each other, all on the same Windows Server host. Customers keep their normal container workflow, but the provider needs each container to have its own kernel for VM-grade isolation. Which configuration fits?',
                'options': [
                    'Process isolation, because containers share the host kernel for the lowest overhead',
                    'A private virtual switch for every container',
                    'Hyper-V isolation, which runs each container inside its own lightweight utility VM',
                    "A Type 2 hypervisor on the host to run each customer's containers",
                ],
                'correct': 2,
                'explanation': "Hyper-V isolation wraps each container in its own utility VM with its own kernel, giving VM-grade separation for mutually distrusting tenants while keeping the container workflow. Process isolation shares the host kernel, which is the Cloud+ reason containers are less isolated than VMs. A private virtual switch isolates networking only; containers would still share the kernel. A Type 2 hypervisor is the wrong tier for production hosting, and adding one would not give containers their own kernels anyway.",
                'whyTested': 'Cloud+ teaches that containers share a kernel; the Windows Server exam adds the exception, and the question only resolves if you hold both.',
            },
            {
                'id': 'br-infra-virtualization-layers-q2',
                'type': 'mc',
                'question': 'A call center has 500 task workers who all use the same two applications on a standard desktop. IT wants to minimize compute cost by letting many users share each VM, and wants to control the images and scaling itself. Which choice fits best?',
                'options': [
                    'An Azure Virtual Desktop pooled host pool of multi-session session hosts with a scaling plan',
                    'Windows 365 Enterprise Cloud PCs, one per worker, for predictable per-user pricing',
                    'An Azure Virtual Desktop personal host pool with one assigned session host per worker',
                    'Windows 365 Frontline Cloud PCs shared across the shifts',
                ],
                'correct': 0,
                'explanation': 'A pooled host pool on Windows Enterprise multi-session puts many concurrent users on each VM, and the organization owns images and a scaling plan, which matches the cost and control goals. Windows 365 Enterprise gives each named user a dedicated Cloud PC, so there is no sharing of VMs. A personal host pool also dedicates one VM per user, adding AVD management without the density gain. Frontline shares Cloud PCs across shifts, but each active user still has a whole Cloud PC, and there is no host pool or scaling plan for IT to tune.',
                'whyTested': 'Four options all deliver a Windows desktop; the differentiators are sharing a VM, who owns scaling, and what the license model assumes.',
            },
            {
                'id': 'br-infra-virtualization-layers-q3',
                'type': 'mc',
                'question': 'A Hyper-V VM was created as Generation 1. It must now boot from a 3 TB virtual disk and use Secure Boot. A teammate with a Cloud+ background suspects the host, since only Type 1 hypervisors suit production. What is the correct action?',
                'options': [
                    'Convert the VM to Generation 2 in place from its settings, because generation is only a configuration option',
                    'Create a new Generation 2 VM and move the workload and data to it',
                    'Move the VM to a Type 1 hypervisor host, because Hyper-V is a Type 2 hypervisor',
                    'Expand the boot disk past 2 TB on the Generation 1 VM and protect it with a production checkpoint',
                ],
                'correct': 1,
                'explanation': 'A VM generation is fixed at creation. Secure Boot and boot disks larger than 2 TB need Generation 2 (UEFI with GPT), so the fix is a new Generation 2 VM and a migration of the workload. Hyper-V is itself a Type 1 hypervisor, so the host type is not the problem and moving hosts changes nothing. There is no in-place conversion. A Generation 1 VM boots through legacy BIOS and cannot boot from a disk beyond that limit, and a production checkpoint is just a recovery point for the VM, not a way around the limit.',
                'whyTested': 'The Type 1 versus Type 2 vocabulary from Cloud+ is a distractor here; the real constraint is a Hyper-V-specific, permanent creation-time choice.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 5. Scaling and elasticity
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-scaling-elasticity',
        'title': 'Scaling and elasticity: up, out and autoscale',
        'summary': "Scaling means adding capacity either by making one instance bigger (up) or by running more instances (out), and elasticity means the system does it automatically as demand moves. The principle is the same everywhere, but what the automation is actually allowed to do depends on the service: add and remove instances, only power existing ones on and off, or resize compute and pause it.",
        'appearsIn': [
            {
                'track': 'cloudplus',
                'lesson': 'scaling-resilience-storage',
                'angle': 'Separates scalability (handling more or less load, even by a planned manual step) from elasticity (automatic, real-time scaling with no human approving each step). Vertical scaling hits a hardware ceiling and usually needs a restart; horizontal scaling avoids both but only works for stateless workloads behind a load balancer.',
            },
            {
                'track': 'az104',
                'lesson': 'vms-compute',
                'angle': 'VM Scale Sets automatically add or remove instances based on demand or a schedule, and an autoscale rule tuned on quiet test data can flap instances in and out under real traffic. App Service has the same split: scaling up changes the plan size, scaling out adds instances, and autoscale rules only scale out and in.',
            },
            {
                'track': 'az140',
                'lesson': 'monitoring-maintenance-and-scaling',
                'angle': 'Autoscale scaling plans run ramp-up, peak, ramp-down and off-peak schedules, with a capacity threshold that decides when to start another host. They only start and deallocate session hosts that already exist; they never create or delete them. Depth-first load balancing pairs with autoscale because emptied hosts can be deallocated.',
            },
            {
                'track': 'dp300',
                'lesson': 'platform-resource-planning',
                'angle': 'Azure SQL has two cost levers for variable load: an elastic pool lets many databases with unpredictable, non-simultaneous spikes share one billed pool of resources, while the serverless tier auto-scales a single database within a configured range and can auto-pause (billing only for storage while paused, at the cost of a cold start).',
            },
        ],
        'watchOut': "Autoscale does not mean the same thing in every service. A VM Scale Set autoscale rule adds and removes instances, an AVD scaling plan only powers on and deallocates hosts you already deployed, and Azure SQL serverless resizes compute within a range and can pause it. An elastic pool shares capacity rather than scaling anything. And in Cloud+ vocabulary, a scheduled manual capacity increase is scalability, not elasticity.",
        'questions': [
            {
                'id': 'br-infra-scaling-elasticity-q1',
                'type': 'mc',
                'question': 'A pooled Azure Virtual Desktop host pool has 10 registered session hosts, each with a max session limit of 20. A scaling plan with ramp-up, peak, ramp-down and off-peak schedules is attached. On Monday morning 260 users sign in, and the admin expects autoscale to build more hosts the way a VM Scale Set would. What actually happens?',
                'options': [
                    'Autoscale creates three new session hosts from the golden image and registers them to the host pool',
                    'Autoscale starts the deallocated hosts it needs, up to the ten that exist, but cannot add hosts, so the pool tops out at 200 sessions until more session hosts are deployed',
                    'Autoscale raises the max session limit on each host until all 260 users fit',
                    'Switching the load-balancing algorithm to breadth-first makes the pool create extra hosts to spread the sessions',
                ],
                'correct': 1,
                'explanation': 'An AVD scaling plan only manages the power state of session hosts that already exist: it can start and deallocate them according to the schedule and capacity threshold, but it never creates or deletes hosts, so capacity is capped at 10 hosts times 20 sessions. A Scale Set creates and removes instances, which is why the expectation is natural. Autoscale does not change the max session limit, and a load-balancing algorithm only decides where sessions land, not how many hosts exist.',
                'whyTested': 'The same word, autoscale, creates instances in one service and only toggles power in another.',
            },
            {
                'id': 'br-infra-scaling-elasticity-q2',
                'type': 'mc',
                'question': "A web app runs in a VM Scale Set behind a load balancer, with shopping carts held in each instance's memory. During a sale autoscale adds instances; afterward, when it scales in, customers lose their carts and get errors as requests move between instances. What change addresses the cause?",
                'options': [
                    'Switch from scaling out to scaling up so the instance count never changes',
                    'Lengthen the load balancer health probe interval so instances stay in rotation longer',
                    'Move cart state out of the instances into a shared cache or database so every instance is stateless',
                    'Replace the metric-based autoscale rule with a schedule-based rule',
                ],
                'correct': 2,
                'explanation': 'Horizontal scaling only works cleanly for stateless workloads: any instance can be added or removed at any time, which is exactly what scale-in does. Keeping state in a shared store removes the dependency on a particular instance. Scaling up avoids scale-in but reintroduces a hardware ceiling and restarts without fixing the design. A longer health probe interval just delays when a failing instance leaves rotation. Changing the rule type changes when instances come and go, not what happens to the state on them.',
                'whyTested': 'Cloud+ gives the principle (scale out needs stateless) and AZ-104 gives the mechanism (autoscale removing instances); the question needs both.',
            },
            {
                'id': 'br-infra-scaling-elasticity-q3',
                'type': 'mc',
                'question': 'A SaaS vendor hosts 300 customer databases in Azure SQL Database. Each is quiet most of the day but spikes unpredictably at its own time, and rarely do more than a few databases spike together. The databases must always be online, and the first query after a quiet period must not wait for a resume. Which approach controls cost best?',
                'options': [
                    'Serverless compute with auto-pause enabled on every database',
                    'Provision each database at the vCore size of its own peak',
                    'Add Hyperscale named replicas to absorb each database spike',
                    'Place the databases in an elastic pool sized for their combined, non-simultaneous peak',
                ],
                'correct': 3,
                'explanation': 'An elastic pool lets databases with unpredictable, non-simultaneous usage share one pool of resources instead of each paying for its own peak, and there is no pause or resume delay. Serverless with auto-pause is also cost-oriented, but the first connection after a pause hits a cold-start delay, which the requirement rules out. Sizing each database for its own peak is the vertical, wasteful approach that the pool exists to avoid. Named replicas are extra read-only copies that add cost and do not serve writes during a spike.',
                'whyTested': 'Serverless and elastic pools both save money on variable workloads; the stem decides between them with the cold-start requirement.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 6. Infrastructure as code and staged releases
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-iac-release',
        'title': 'Infrastructure as code and staged releases',
        'summary': "Two habits keep change safe. First, describe the environment as code that is declarative, repeatable and version-controlled rather than a pile of manual clicks. Second, expose a change to a few things before everything: a separate environment you swap to, a small slice of users, or a pilot group of devices. Combined, a team can rebuild what it runs and roll out what it changes with a small blast radius.",
        'appearsIn': [
            {
                'track': 'az900',
                'lesson': 'cost-policy-monitoring',
                'angle': 'Introduces Infrastructure as Code as defining infrastructure in files instead of manual clicks, so deployments are repeatable and version-controlled. ARM templates are the native JSON format, and Bicep is the more concise language that compiles to ARM and deploys through the same Resource Manager.',
            },
            {
                'track': 'az104',
                'lesson': 'app-hosting-iac',
                'angle': 'Treats Bicep and ARM as functionally identical and tests slots: deploy a new version to a staging slot, validate it with production-like settings, swap it into production in seconds, and keep the previous version in the staging slot for a fast rollback.',
            },
            {
                'track': 'cloudplus',
                'lesson': 'deployment-strategies',
                'angle': 'Names the release strategies by exposure: blue-green (two identical environments, all traffic switches at once, instant rollback), canary (a small subset first, then gradually more) and rolling (a few instances at a time). It adds IaC, continuous delivery versus continuous deployment, and feature flags that separate deploying code from releasing it.',
            },
            {
                'track': 'md102',
                'lesson': 'device-provisioning-updates',
                'angle': 'Windows Update for Business rings stage updates by device population: a small pilot ring with a short or zero deferral catches a bad update before a larger ring with a longer deferral. Feature update deferral and quality update deferral run as independent clocks, and Windows Autopatch builds and runs the rings for you.',
            },
        ],
        'watchOut': "Deployment means two things. In ARM and Bicep, a deployment is a template submitted to Resource Manager, and its mode (incremental by default, or complete) decides whether resources outside the template are left alone or deleted. In Cloud+, deployment is getting a release to users, a separate decision from putting code in production. And a slot swap flips all traffic at once (blue-green-like) while Intune rings expose a change to one group of devices at a time (canary-like).",
        'questions': [
            {
                'id': 'br-infra-iac-release-q1',
                'type': 'mc',
                'question': 'A team deploys a new version of a web app to the staging slot of an App Service, validates it, then swaps staging into production. After the swap the previous version sits in the staging slot and can be swapped back in seconds. Which release strategy does this most resemble?',
                'options': [
                    'Blue-green deployment: two complete environments, all traffic switched at once, the old one kept for instant rollback',
                    'A canary release, because the new version is validated before the full rollout',
                    'A rolling deployment, because instances are updated a few at a time behind a load balancer',
                    'Continuous deployment, because no manual gate sits between the build and production',
                ],
                'correct': 0,
                'explanation': 'A slot swap is blue-green in practice: a full second environment is prepared and verified, traffic moves over at once, and the old version stays ready for a swap back. A canary release exposes a small share of traffic first and grows it gradually, whereas a swap moves everything together. A rolling deployment updates instances in batches within one environment and has no standing duplicate. Continuous deployment describes a pipeline with no human approval gate, which says nothing about how traffic moves from one version to the other.',
                'whyTested': 'Azure slot vocabulary and Cloud+ strategy names refer to the same mechanics, and canary is the tempting near-miss.',
            },
            {
                'id': 'br-infra-iac-release-q2',
                'type': 'mc',
                'question': "An Intune admin runs a pilot ring with no quality update deferral and a broad ring with a feature update deferral of 0 days and a quality update deferral of 5 days. The pilot ring shows that this month's cumulative update causes boot failures. To protect the broad ring, the admin raises its feature update deferral to 90 days. What is the result?",
                'options': [
                    'The broad ring is protected, because feature and quality deferrals are tied to a single clock',
                    'A safeguard hold automatically blocks the cumulative update on the broad ring because the pilot ring failed',
                    "The pilot ring's failed update is rolled back and the broad ring is automatically skipped",
                    'The broad ring is not protected: it still receives the cumulative update when its 5-day quality deferral ends, unless the admin lengthens the quality deferral or pauses quality updates',
                ],
                'correct': 3,
                'explanation': 'The feature update and quality update deferral clocks run independently, so delaying feature updates has no effect on the monthly cumulative update; the broad ring still receives it after its own 5-day quality deferral. The fix is to extend the quality deferral or pause quality updates for that ring. A safeguard hold is Microsoft detecting a known feature-update compatibility issue, not a reaction to your pilot results. Nothing rolls back or skips rings on its own; staged rings only help if you act on what the pilot ring tells you.',
                'whyTested': 'The canary idea only works if you pull the right lever, and the Intune levers are separate for feature and quality updates.',
            },
            {
                'id': 'br-infra-iac-release-q3',
                'type': 'mc',
                'question': 'A Bicep file defines two storage accounts. It is deployed with az deployment group create using the complete deployment mode to a resource group that also holds a virtual machine someone created by hand in the portal. What happens?',
                'options': [
                    'The deployment fails because the resource group contains resources the file does not define',
                    'The two storage accounts are created or updated as defined, and the hand-created VM is deleted because the file does not include it',
                    'The storage accounts are created and the VM is left alone, because declarative templates never touch resources outside the file',
                    'The VM is imported into the template state and managed by the file from then on',
                ],
                'correct': 1,
                'explanation': 'In complete mode, Resource Manager makes the resource group match the template, which means resources in the group that are not in the file are deleted. Leaving unlisted resources alone is incremental mode, the default, which is why declarative templates feel safe to rerun. The deployment does not fail on extra resources, and Resource Manager keeps no separate state file that could adopt the VM; the template describes the desired set and the resource group is the state.',
                'whyTested': 'Declarative and repeatable does not mean additive; the deployment mode is what turns a rerun into a cleanup.',
            },
        ],
    },
    # ------------------------------------------------------------------
    # 7. Migration approaches
    # ------------------------------------------------------------------
    {
        'id': 'br-infra-migration',
        'title': 'Migration approaches: assess, choose, then move',
        'summary': "Every migration framework treats a move as a sequence rather than a single tool: assess what you have, decide how much to change on the way (move as-is or modernize), use the purpose-built tool for each kind of data, and cut over with as little downtime as the business needs. The certs differ mainly in the names of the steps and in which tool owns which job.",
        'appearsIn': [
            {
                'track': 'az305',
                'lesson': 'migration-integration-operations',
                'angle': 'Azure Migrate is the hub for discovery and assessment, finding servers and workloads, right-sizing them, checking readiness and estimating cost before anything moves. The actual data move is then usually handed to a specialized tool such as Database Migration Service.',
            },
            {
                'track': 'cloudplus',
                'lesson': 'deployment-strategies',
                'angle': 'Names the path by source and target: P2V (physical to virtual), V2V (between hypervisors or platforms), P2C (physical straight to the cloud) and V2C (virtual to the cloud). A lift and shift is usually a P2C or V2C move that keeps the workload largely as-is rather than refactoring it.',
            },
            {
                'track': 'dp300',
                'lesson': 'platform-resource-planning',
                'angle': 'Picks the target by compatibility and control (SQL Database, Managed Instance or SQL Server on an Azure VM), assesses the source first with the assessment experiences now in Azure Arc, Azure Migrate and SSMS, then migrates with Azure Database Migration Service in offline mode or near-zero-downtime online mode.',
            },
            {
                'track': 'az802',
                'lesson': 'hybrid-management-clustering-virtualization',
                'angle': 'Uses migration for moves inside the Windows estate: Storage Migration Service moves files, shares and security settings from an old file server to a new one and can hand over the old name and IP so UNC paths keep working, while Live Migration and Storage Migration move running VMs or their disks between hosts. Hyper-V Replica is for disaster recovery, not migration.',
            },
        ],
        'watchOut': "Migration is overloaded. In Hyper-V, Live Migration and Storage Migration move a VM or its disks between on-premises hosts and storage, not to the cloud. In Azure, Azure Migrate assesses while Database Migration Service moves the data. In Cloud+, P2V and V2C describe the form of the source and the target. And online in Database Migration Service means the source stays live until cutover, not a type of connection; a lift and shift to a VM keeps compatibility but leaves OS patching with you.",
        'questions': [
            {
                'id': 'br-infra-migration-q1',
                'type': 'mc',
                'question': 'A company plans to move about 200 on-premises servers, including several SQL Server databases, to Azure. Leadership wants to know what will move cleanly, what size each target should be, and what it will cost before any workload is touched. What is the right sequence?',
                'options': [
                    'Start Database Migration Service for the databases, then use its results to decide which servers to assess',
                    'Convert every server with P2V first, then right-size the resulting VMs in Azure',
                    'Use Storage Migration Service to inventory the servers, then use Hyper-V Replica to move them',
                    'Use Azure Migrate to discover and assess the servers for readiness, right-sizing and cost, then hand the database moves to Database Migration Service once they are assessed as ready',
                ],
                'correct': 3,
                'explanation': 'Azure Migrate is the discovery and assessment hub that produces readiness, right-sizing and cost estimates before anything moves, and a specialized tool such as Database Migration Service then performs the database move. Starting with the data move reverses the order and answers none of the pre-move questions. P2V is a conversion path in the Cloud+ vocabulary that moves nothing to Azure and does not assess. Storage Migration Service is for file servers, and Hyper-V Replica is a disaster recovery feature, not a migration or inventory tool.',
                'whyTested': 'Several tools have migration in their name or purpose; the exam point is which one owns assessment and which one owns the move.',
            },
            {
                'id': 'br-infra-migration-q2',
                'type': 'mc',
                'question': 'A branch office runs file shares on a physical Windows Server 2008 R2 machine. The company wants the data, shares and permissions moved to a new Windows Server VM running a current OS, with the new server taking over the old name and IP address so clients keep using the same UNC paths. Which tool fits?',
                'options': [
                    'A P2V conversion of the old physical server into a VM',
                    'Hyper-V Replica from the old server to the new VM',
                    'Storage Migration Service',
                    'Live Migration of the old server to the new host',
                ],
                'correct': 2,
                'explanation': 'Storage Migration Service inventories the old file server, transfers files, shares and security settings to a new server, and can then move the old server\'s name and IP address to it so clients need no reconfiguration. A P2V conversion would carry the entire old operating system across into a VM, which defeats the goal of a current OS. Hyper-V Replica replicates running VMs for disaster recovery and the source here is physical. Live Migration moves an existing running VM between Hyper-V hosts and cannot move a physical server.',
                'whyTested': 'It contrasts the Cloud+ conversion paths with the Windows Server tool built for file-server cutovers.',
            },
            {
                'id': 'br-infra-migration-q3',
                'type': 'mc',
                'question': 'An on-premises SQL Server database uses SQL Server Agent jobs and cross-database queries. The business wants minimal operating-system administration and a migration with near-zero downtime. What should the team choose?',
                'options': [
                    'Azure SQL Managed Instance as the target, migrated with Azure Database Migration Service in online mode',
                    'Azure SQL Database as a single database, migrated with Database Migration Service in online mode',
                    'SQL Server on an Azure VM through a V2C lift-and-shift migration',
                    'Azure SQL Managed Instance as the target, migrated with Database Migration Service in offline mode',
                ],
                'correct': 0,
                'explanation': 'Managed Instance supports SQL Server Agent and cross-database queries while Microsoft handles the OS and patching, and Database Migration Service in online mode keeps the source live until cutover for near-zero downtime. A single Azure SQL database supports neither SQL Server Agent nor cross-database queries. A lift and shift to SQL Server on a VM keeps full compatibility but leaves OS patching with the team, against the minimal-administration goal. Offline mode would give the right target but means downtime for the whole migration.',
                'whyTested': 'Three requirements (compatibility, management burden, downtime) each eliminate a different tempting option.',
            },
        ],
    },
]
