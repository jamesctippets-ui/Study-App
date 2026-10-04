"""Cross-cert bridges: identity, access and authentication.

Entra ID as the identity plane; who/what/when (directory roles, Azure RBAC,
Conditional Access); hybrid sign-in; just-in-time and reviewed access;
local-admin least privilege; MFA and passwordless; workload identities;
Conditional Access signals and break-glass.
"""

BRIDGES = [
    # ------------------------------------------------------------------
    {
        'id': 'br-id-who-what-when',
        'title': 'Who, what and when: Entra roles, Azure RBAC and Conditional Access',
        'summary': 'Three controls answer three different questions. A Microsoft Entra directory role says what you may administer inside the directory itself (users, groups, apps). Azure RBAC says what you may do to Azure resources, at a scope such as a subscription or resource group. Conditional Access says whether, and under what conditions, a sign-in is allowed to happen at all, so reaching a resource normally means passing both the sign-in conditions and holding a role that authorizes the action.',
        'appearsIn': [
            {
                'track': 'az900',
                'lesson': 'identity-security',
                'angle': 'Frames the split in plain terms: Azure RBAC decides what an identity can do at a scope, while Conditional Access decides under what conditions someone can sign in at all, such as requiring MFA from an unfamiliar location or an unmanaged device. Expect questions that ask you to tell the two jobs apart.',
            },
            {
                'track': 'az104',
                'lesson': 'governance-cost',
                'angle': 'Tests the mechanics of RBAC as an administrator: assignments are additive across scopes, and the built-in roles differ in whether they can grant access (Owner and User Access Administrator can, Contributor cannot, Reader is view-only).',
            },
            {
                'track': 'sc300',
                'lesson': 'entra-user-identities',
                'angle': 'Separates Entra directory roles such as User Administrator from Azure RBAC and notes that holding one does not grant the other without an explicit elevation step. It adds administrative units to narrow how far a directory role reaches, for example one regional office instead of the whole tenant.',
            },
            {
                'track': 'sc500',
                'lesson': 'identity-access-governance',
                'angle': 'Treats directory roles and Azure RBAC as two separate authorization systems and uses that to build distractors: a Global Administrator who still cannot act on a subscription, or a scenario that quietly swaps one system for the other.',
            },
        ],
        'watchOut': 'The word "role" appears on both sides, and exam writers lean on it: Global Administrator is a directory role, not an Azure RBAC role, and neither is the "access" that Conditional Access grants. A Conditional Access grant control only lets a sign-in proceed once its condition is met; it never confers permission on a resource.',
        'questions': [
            {
                'id': 'br-id-who-what-when-q1',
                'type': 'mc',
                'question': 'A user is currently active in the Global Administrator role in Microsoft Entra ID. They sign in without any problem, but the Azure portal refuses to let them delete a virtual machine in a production subscription, reporting that they lack authorization. No Conditional Access policy is involved. What explains this and what is the correct remedy?',
                'options': [
                    'The Global Administrator role must first be activated through Privileged Identity Management before it applies to any resource',
                    'The subscription must be added to an administrative unit that contains the user',
                    'Directory roles and Azure RBAC are separate systems, so the user needs an Azure RBAC role such as Contributor at the subscription or resource group scope',
                    'A Conditional Access grant control must be added to make the Global Administrator role effective on Azure resources',
                ],
                'correct': 2,
                'explanation': 'Global Administrator is an Entra directory role: it governs administration of the directory, not authorization over Azure resources, which Azure RBAC decides at a scope. The user needs an RBAC assignment that includes the delete action. PIM would only matter if the role were eligible rather than active, and the user is already in it. Administrative units hold users, groups and devices to scope directory roles; they cannot contain subscriptions. Conditional Access governs sign-in conditions and can never add permissions, and the sign-in already succeeded.',
                'whyTested': 'The classic crossover: a strong directory role is treated as if it implied resource rights.',
            },
            {
                'id': 'br-id-who-what-when-q2',
                'type': 'mc',
                'question': 'A contractor must be able to start and stop virtual machines in the rg-app resource group and nowhere else, and must only be able to sign in from a device that Intune reports as compliant. Which design meets both requirements?',
                'options': [
                    'An Azure RBAC role that permits starting and stopping VMs, assigned at the rg-app scope, plus a Conditional Access policy requiring a compliant device for the contractor',
                    'A Conditional Access policy requiring a compliant device, with the rg-app resource group chosen as the policy scope',
                    'The Helpdesk Administrator directory role, scoped to an administrative unit that contains the VMs',
                    'Contributor at the subscription scope, with a Conditional Access policy limiting the contractor to rg-app',
                ],
                'correct': 0,
                'explanation': 'Each requirement maps to a different control: the RBAC assignment at the resource group answers what the contractor can do and where, and Conditional Access answers under what conditions they can sign in. Conditional Access policies target users, cloud apps and conditions, not resource groups, so it cannot be scoped to rg-app. Administrative units contain users, groups and devices rather than Azure resources, and a directory role carries no VM rights. A subscription-wide Contributor assignment breaks least privilege, and Conditional Access cannot narrow an RBAC scope after the fact.',
            },
            {
                'id': 'br-id-who-what-when-q3',
                'type': 'mc',
                'question': 'A Seattle support technician holds the Helpdesk Administrator role scoped to the Seattle administrative unit. Which statement about that assignment is accurate?',
                'options': [
                    'It lets the technician reset passwords for users anywhere in the tenant, because directory roles always apply tenant-wide',
                    'It also gives the technician Reader on every subscription in the tenant, because directory roles flow down into Azure RBAC',
                    'It works as a Conditional Access session control that limits the technician to signing in from Seattle',
                    'It lets the technician manage passwords only for users in the Seattle administrative unit and grants no rights over Azure resources',
                ],
                'correct': 3,
                'explanation': 'An administrative unit narrows how far a directory role reaches, so the same Helpdesk Administrator role covers only the Seattle users, groups or devices, and it still says nothing about Azure resources, which are authorized separately by RBAC. Scoping to an administrative unit is exactly what stops the role being tenant-wide. Directory roles do not flow into Azure RBAC. Administrative units are an authorization boundary for a directory role, not a Conditional Access control, and they say nothing about where the technician signs in from.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-hybrid-signin',
        'title': 'Hybrid sign-in: password hash sync, pass-through and federation',
        'summary': 'An organization that keeps on-premises Active Directory makes two separate decisions. One is how identities reach Microsoft Entra ID: Microsoft Entra Connect Sync (a full-featured single-server engine) or Microsoft Entra Cloud Sync (a lighter, agent-based option that can run several agents across several forests). The other is how users sign in: password hash sync validates in the cloud, pass-through authentication validates against on-premises AD through agents, and federation hands authentication to a provider such as AD FS.',
        'appearsIn': [
            {
                'track': 'az305',
                'lesson': 'identity-access-management',
                'angle': 'Frames it as a design trade-off. Password hash sync lets Entra ID authenticate even through a brief on-premises outage, pass-through authentication stops working if every agent is offline, and federation is justified only by requirements Entra ID cannot meet itself, at the cost of operating the federation infrastructure.',
            },
            {
                'track': 'sc300',
                'lesson': 'entra-user-identities',
                'angle': 'Adds the choice of sync engine: Entra Connect Sync for complex, highly customized attribute flows versus Entra Cloud Sync, with multiple lightweight agents across multiple forests for built-in redundancy. It also states that password hash sync is Microsoft\'s default recommendation for resilience.',
            },
            {
                'track': 'ab650',
                'lesson': 'identity-access-threat-protection',
                'angle': 'Presents the same three methods as the way on-premises identities reach Conditional Access and Entra ID Protection. Password hash sync is the recommended default, and because the hashes reach Entra ID it also enables leaked-credential detection.',
            },
            {
                'track': 'az802',
                'lesson': 'active-directory-domain-services',
                'angle': 'Views it from the on-premises administrator\'s side: password hash sync never sends a recoverable plaintext password to Entra ID, pass-through authentication calls back to AD DS through an agent, and federation means running an AD FS service yourself.',
            },
        ],
        'watchOut': 'The sync tool and the sign-in method are independent choices: picking Cloud Sync or Connect Sync does not decide between password hash sync, pass-through authentication and federation. And "hash sync" does not copy the password hash itself: Entra ID receives only a hash of the on-premises password hash, never a recoverable plaintext password.',
        'questions': [
            {
                'id': 'br-id-hybrid-signin-q1',
                'type': 'mc',
                'question': 'A retailer keeps its on-premises Active Directory. Microsoft 365 sign-in must keep working if the on-premises datacenter loses power for a few hours, Entra ID Protection must be able to flag leaked credentials, and the company does not want to operate AD FS servers. Which sign-in method meets all three requirements?',
                'options': [
                    'Pass-through authentication with agents installed on several servers inside the on-premises network',
                    'Password hash synchronization',
                    'Federation with an AD FS farm hosted on Azure virtual machines',
                    'Pass-through authentication with agents installed on Azure virtual machines',
                ],
                'correct': 1,
                'explanation': 'Password hash sync puts a hash of the password hash in Entra ID, so sign-in is validated entirely in the cloud during an on-premises outage, and those hashes are what let Entra ID Protection detect leaked credentials. Pass-through authentication still needs a reachable on-premises domain controller at every sign-in, so extra agents (wherever they run) do not remove that dependency, and it stores nothing in the cloud for leak detection. AD FS on Azure virtual machines still depends on reaching AD DS and means operating a federation farm, which the company ruled out.',
                'whyTested': 'Combines the design-resilience framing of AZ-305 with the Entra ID Protection framing of AB-650.',
            },
            {
                'id': 'br-id-hybrid-signin-q2',
                'type': 'mc',
                'question': 'A holding company has three separate AD forests, one per region. It wants the sync service to survive the loss of any single server, has no need for deep custom attribute-flow rules, and wants cloud sign-in to stay available while one region\'s domain controllers are down for maintenance. Which pairing fits?',
                'options': [
                    'Entra Connect Sync on one server for all three forests, with pass-through authentication',
                    'Entra Connect Sync with federation, because multi-forest sync requires AD FS',
                    'Entra Cloud Sync, which requires pass-through authentication as its sign-in method',
                    'Entra Cloud Sync with an agent in each forest for redundancy, together with password hash synchronization for sign-in',
                ],
                'correct': 3,
                'explanation': 'Cloud Sync is built for several lightweight agents across several forests, which removes the single point of failure, and password hash sync keeps sign-in validated in the cloud while a region\'s domain controllers are offline. A single Connect Sync server is the single point of failure being avoided, and pass-through authentication would fail users whose region has no reachable domain controller. Multi-forest sync does not require AD FS. Cloud Sync does not dictate the sign-in method, because sync and sign-in are separate decisions.',
            },
            {
                'id': 'br-id-hybrid-signin-q3',
                'type': 'mc',
                'question': 'A security reviewer objects that enabling password hash synchronization means users\' passwords are sent to the cloud. Which response is accurate?',
                'options': [
                    'Entra ID stores the on-premises password hash unchanged so it can answer NTLM challenges on behalf of Active Directory',
                    'Passwords are forwarded in encrypted form and decrypted in Entra ID at each sign-in, the same way pass-through authentication works',
                    'Entra ID receives a hash of the on-premises password hash, never a recoverable plaintext password, and validates sign-in in the cloud',
                    'Nothing is synchronized, because Entra ID calls a domain controller at every sign-in to check the password',
                ],
                'correct': 2,
                'explanation': 'Only a hash of the on-premises password hash is synchronized, so no recoverable plaintext password reaches Entra ID, and sign-in is validated there. Entra ID does not hold the original hash and does not act as an NTLM authority for AD. Forwarding a password for decryption at each sign-in, and calling a domain controller at each sign-in, both describe pass-through authentication behavior, which is a different method.',
                'whyTested': 'AZ-802 and AB-650 both test what actually leaves AD DS under password hash sync.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-time-bound-access',
        'title': 'Standing, just-in-time and reviewed access',
        'summary': 'Least privilege has a time dimension. Privileged Identity Management makes a privileged role (Entra directory or Azure RBAC) an eligible assignment that is activated just in time, for a limited window, with MFA, a justification and optionally an approver. Entitlement management gives people requestable, expiring bundles of resources through access packages, and access reviews periodically re-confirm access that already exists. Break-glass emergency accounts are the deliberate exception that stays permanently active.',
        'appearsIn': [
            {
                'track': 'az305',
                'lesson': 'identity-access-management',
                'angle': 'Tests choosing the right governance tool from the scenario wording: time-boxed, bundled access for contractors points to entitlement management, periodic recertification of existing access points to access reviews, and PIM is layered with Conditional Access, such as requiring MFA to activate an eligible role.',
            },
            {
                'track': 'sc300',
                'lesson': 'identity-governance-pim',
                'angle': 'Goes deepest on mechanics: eligible versus active assignments, activation requiring MFA, justification and possibly approval, PIM for Groups, connected organizations, access review default decisions, and break-glass accounts excluded from the policies that could block them.',
            },
            {
                'track': 'sc500',
                'lesson': 'identity-access-governance',
                'angle': 'Extends the same eligible-versus-active pattern to Azure resource roles such as Owner or Contributor, and contrasts it with just-in-time VM access, which only narrows network reachability to a VM. Entitlement management appears as access packages with an expiration.',
            },
            {
                'track': 'ab650',
                'lesson': 'identity-access-threat-protection',
                'angle': 'Uses PIM to shrink how many admin accounts are permanently privileged: a user is eligible, must activate with MFA and a business justification for a limited window, and every activation and approval lands in the audit log.',
            },
        ],
        'watchOut': 'Just-in-time is used for two unrelated things: PIM controls whether you can hold a privileged role at all, while just-in-time VM access in Microsoft Defender for Cloud only narrows which source IPs and ports can reach a VM. Access packages and PIM both expire, but an access package hands a requester a bundle of resources, whereas PIM governs when a role becomes active.',
        'questions': [
            {
                'id': 'br-id-time-bound-access-q1',
                'type': 'mc',
                'question': 'Contractors from a partner firm need a group membership, a Teams team and a SharePoint site together for 90 days. They should request the access themselves, a sponsor should approve it, and it must disappear automatically with no administrator action. What should you configure?',
                'options': [
                    'PIM eligible assignments, so the contractors activate the group\'s roles whenever they need them',
                    'A recurring access review of the group with results applied automatically',
                    'Just-in-time VM access with a 90-day request window',
                    'An entitlement management access package with an approval policy and a 90-day expiration',
                ],
                'correct': 3,
                'explanation': 'An access package bundles the group, Teams team and site into one requestable unit, runs the approval workflow, and removes access when it expires. PIM governs activation of privileged roles rather than bundled resource access for requesters. An access review only recertifies access that already exists, so it cannot grant access and would leave contractors in place until the next cycle. Just-in-time VM access is a network control for virtual machines and has nothing to do with groups or sites.',
                'whyTested': 'AZ-305 and SC-300 both test telling entitlement management apart from PIM and access reviews by scenario wording.',
            },
            {
                'id': 'br-id-time-bound-access-q2',
                'type': 'mc',
                'question': 'Cloud engineers need the Contributor role on a production subscription only while they are deploying. Each activation must require MFA, a business justification and an approver, must last at most four hours, and must leave no standing Contributor assignment between deployments. Which solution fits?',
                'options': [
                    'An entitlement management access package that grants Contributor for 90 days',
                    'PIM eligible assignments for Contributor with MFA, justification, approval and a four-hour maximum activation',
                    'A quarterly access review of the Contributor assignments',
                    'Just-in-time VM access in Microsoft Defender for Cloud with a four-hour request window',
                ],
                'correct': 1,
                'explanation': 'PIM for Azure resource roles lets the engineers be eligible rather than active, so Contributor exists only for an approved, time-capped activation. An access package with a 90-day expiration would still leave Contributor standing for the whole period. An access review recertifies standing access and does nothing to remove it between deployments. Just-in-time VM access narrows ports and source IPs on a VM and does not control who may hold a management-plane role.',
            },
            {
                'id': 'br-id-time-bound-access-q3',
                'type': 'mc',
                'question': 'A security team converts every Global Administrator assignment to PIM-eligible. The tenant also has two cloud-only emergency access accounts. How should those two accounts be handled?',
                'options': [
                    'Make them eligible with approval, so every use is reviewed before the role becomes active',
                    'Include them in a quarterly access review that removes anyone whose reviewer does not respond',
                    'Leave them permanently active and outside normal PIM activation, with strong credentials stored securely offline and sign-in alerts',
                    'Synchronize them from on-premises Active Directory so they follow the same lifecycle as other administrators',
                ],
                'correct': 2,
                'explanation': 'Emergency access accounts exist for the day the normal machinery has failed, such as a Conditional Access misconfiguration or an MFA outage, so they hold permanent, active privileged access and are protected by strong offline credentials and alerting instead. Making them eligible with approval or MFA-based activation puts them behind the same machinery that may have broken. An access review with automatic removal could silently strip their access. Synchronizing them from on-premises AD adds a dependency on infrastructure that may also be down.',
                'whyTested': 'PIM everywhere is the right default; the exam tests whether you know the deliberate exception.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-local-admin-least-privilege',
        'title': 'Least privilege on the machine: local admin, LAPS, JEA and EPM',
        'summary': 'Governing cloud roles does not help if every user is a local administrator on the machine in front of them. Least privilege on Windows has two halves: avoid handing out local administrator rights at all (elevate one approved app with Intune Endpoint Privilege Management, allow only a defined set of PowerShell cmdlets with Just Enough Administration, or give AVD users only the Desktop Virtualization User role), and make the local Administrator account that must exist unique and rotating with Windows LAPS.',
        'appearsIn': [
            {
                'track': 'md102',
                'lesson': 'protect-devices-and-access',
                'angle': 'Shows the Intune toolset: Endpoint Privilege Management lets a standard user elevate one specific, approved application, with rules that are automatic, user-confirmed (optionally with a business justification) or support-approved, and Windows LAPS gives every device its own randomized, rotated local administrator password.',
            },
            {
                'track': 'az140',
                'lesson': 'identity-and-security-for-avd',
                'angle': 'Applies it to pooled session hosts: end users must never be local Administrators, because one user could affect everyone sharing the VM, so access flows through the Desktop Virtualization User role and app group assignment. Windows LAPS rotates each host\'s local Administrator password and stores it in Microsoft Entra ID.',
            },
            {
                'track': 'az802',
                'lesson': 'securing-windows-server',
                'angle': 'Covers the server side: Windows LAPS rotates and stores the local administrator password in Active Directory or Entra ID with retrieval controlled by delegated permissions, and Just Enough Administration lets a technician run a limited set of PowerShell cmdlets under an elevated identity without full local administrator rights.',
            },
        ],
        'watchOut': 'LAPS manages one thing only: the password of the local administrator account on each machine, which it randomizes, rotates and stores in AD or Entra ID. It does not remove the need to keep users out of the local Administrators group, and it is not a way to grant limited rights. Likewise, an AVD role such as Desktop Virtualization Contributor is an Azure RBAC role for managing AVD objects, not local administrator rights on a session host.',
        'questions': [
            {
                'id': 'br-id-local-admin-least-privilege-q1',
                'type': 'mc',
                'question': 'Developers on Microsoft Entra-joined laptops need to run one internally signed deployment tool that requires elevation. They must not become local administrators, and the security team wants each developer to supply a business justification every time they elevate. Which approach fits?',
                'options': [
                    'Add the developers to the local Administrators group with an Intune policy and rely on audit logs',
                    'Give the developers the LAPS-managed local administrator password so they can elevate when needed',
                    'An Intune Endpoint Privilege Management rule for that application that requires user confirmation with a business justification',
                    'Publish a Just Enough Administration endpoint that exposes the deployment tool to the developers',
                ],
                'correct': 2,
                'explanation': 'Endpoint Privilege Management elevates one approved application for a standard user, and a user-confirmed rule can require a business justification, so the developer never holds full local administrator rights. Adding them to the local Administrators group is exactly the standing privilege being avoided. Handing out the LAPS password gives full local administrator access to anyone who has it, and LAPS only manages that password. Just Enough Administration constrains PowerShell sessions to a set of cmdlets and does not elevate an arbitrary executable.',
            },
            {
                'id': 'br-id-local-admin-least-privilege-q2',
                'type': 'mc',
                'question': 'A pooled Azure Virtual Desktop host pool uses Microsoft Entra-joined session hosts. Help-desk staff occasionally need the local Administrator account to troubleshoot a specific host. The company wants no password shared across hosts, and end users must have no more rights than their application access requires. Which design fits?',
                'options': [
                    'Windows LAPS storing each host\'s rotated local administrator password in Entra ID, with end users limited to the Desktop Virtualization User role',
                    'Add the help-desk staff to Desktop Virtualization Contributor so they can sign in to every session host as an administrator',
                    'One local administrator password for all hosts, kept in a vault and changed once a year',
                    'Make the end users local administrators of the session hosts so fewer tickets reach the help desk',
                ],
                'correct': 0,
                'explanation': 'Windows LAPS gives each host its own randomized, regularly rotated local administrator password stored in Entra ID, retrievable by delegated permission only when needed, and the Desktop Virtualization User role keeps end users to their app groups. Desktop Virtualization Contributor manages AVD objects such as host pools and does not make anyone a local administrator on a host. A shared, rarely changed password is the problem LAPS exists to remove. Local administrator rights for users on a pooled host risk affecting every other user on the same VM.',
                'whyTested': 'AZ-140 and AZ-802 both treat shared static local admin passwords and user local admin rights as anti-patterns.',
            },
            {
                'id': 'br-id-local-admin-least-privilege-q3',
                'type': 'mc',
                'question': 'Help-desk technicians must restart specific services and run a short list of approved PowerShell cmdlets on file servers over remoting. They must not receive full local administrator rights on those servers. What should you use?',
                'options': [
                    'Windows LAPS, giving the technicians the current local administrator password for each server',
                    'Membership in the Protected Users group for the technicians\' accounts',
                    'Intune Endpoint Privilege Management rules for each service-management tool',
                    'A Just Enough Administration endpoint that exposes only those cmdlets and runs them under an elevated identity',
                ],
                'correct': 3,
                'explanation': 'Just Enough Administration is built for exactly this: a constrained PowerShell endpoint where technicians can run only the permitted cmdlets, with elevation applied by the endpoint rather than by handing out administrator rights. The LAPS password would give full local administrator access. Protected Users hardens how an account authenticates (Kerberos only, no credential caching or delegation) and neither grants nor limits rights. Endpoint Privilege Management is an Intune feature that elevates specific applications for standard users on managed endpoints, not a way to expose a set of cmdlets on a server.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-mfa-passwordless',
        'title': 'From MFA to passwordless and phishing-resistant sign-in',
        'summary': 'Multifactor authentication adds factors to a password, passwordless removes the password entirely, and phishing-resistant methods go further by binding the proof cryptographically to a device and a specific site. These are different properties, so "strongest" does not mean "phishing-resistant". Supporting pieces sit around them: a Temporary Access Pass to bootstrap a first passwordless credential, and self-service password reset, which only helps users who have registered the required methods.',
        'appearsIn': [
            {
                'track': 'az900',
                'lesson': 'identity-security',
                'angle': 'Introduces the vocabulary: MFA and passwordless are not the same thing, because passwordless does not use a password at all, and Conditional Access can demand MFA only when the conditions, such as an unfamiliar location or an unmanaged device, call for it.',
            },
            {
                'track': 'az104',
                'lesson': 'identities-access',
                'angle': 'Handles it as administration: self-service password reset takes the help desk out of the most common request, and external B2B users sign in with their own existing identity rather than a new internal account.',
            },
            {
                'track': 'sc300',
                'lesson': 'authentication-methods-selfservice',
                'angle': 'Goes deepest: FIDO2 security keys, Windows Hello for Business and certificate-based authentication are phishing-resistant, while an Authenticator push is stronger than SMS but can fall to MFA fatigue. It adds Temporary Access Pass, combined registration, the authentication methods policy, and authentication strength.',
            },
            {
                'track': 'md102',
                'lesson': 'protect-devices-and-access',
                'angle': 'Shows the device side: Windows Hello for Business replaces a typed password with a PIN or biometric that unlocks a cryptographic key pair bound to the device (in its TPM where available), so no shared secret crosses the network and the credential cannot be reused on another machine.',
            },
        ],
        'watchOut': '"Passwordless", "phishing-resistant" and "MFA required" are three different statements. A plain require-MFA control is satisfied by SMS, and an Authenticator push is stronger than SMS yet can still be approved by a fatigued user; only FIDO2, Windows Hello for Business and certificate-based authentication are truly phishing-resistant. Also, switching SSPR on for a group does nothing for users who have not registered the required methods.',
        'questions': [
            {
                'id': 'br-id-mfa-passwordless-q1',
                'type': 'mc',
                'question': 'A security team wants every sign-in to the admin portals to use a method that cannot be defeated by a lookalike phishing page or by MFA-fatigue prompts. An administrator satisfied the current Conditional Access policy, which uses the require multifactor authentication grant control, by entering an SMS code. What change should be made?',
                'options': [
                    'Switch the policy to require Microsoft Authenticator push notifications instead of SMS',
                    'Replace the control with an authentication strength grant control set to phishing-resistant MFA',
                    'Turn on security defaults for the tenant',
                    'Add a session control that shortens the sign-in frequency for administrators',
                ],
                'correct': 1,
                'explanation': 'An authentication strength can require specific methods such as FIDO2, Windows Hello for Business or certificate-based authentication, and rejects SMS even though SMS satisfies a plain require-MFA control. Authenticator push is stronger than SMS but can still be approved by a fatigued user or on a consent-phishing page. Security defaults require MFA registration and cannot target only phishing-resistant methods (and they cannot run alongside Conditional Access). A shorter sign-in frequency only prompts more often with the same weak methods.',
                'whyTested': 'SC-300 tests that "strongest" is not "phishing-resistant"; AZ-900 only expects you to know MFA is a control, which is why the plain control feels sufficient.',
            },
            {
                'id': 'br-id-mfa-passwordless-q2',
                'type': 'mc',
                'question': 'A company is rolling out Windows Hello for Business and wants new hires never to type a password, not even on their first day. Which onboarding approach achieves that?',
                'options': [
                    'Email each new hire a temporary password and force a change at first sign-in',
                    'Enable self-service password reset for the new-hire group so they can set up their own credential',
                    'Create the accounts with a temporary password that expires after one hour',
                    'Issue each new hire a Temporary Access Pass to sign in once and register Windows Hello for Business',
                ],
                'correct': 3,
                'explanation': 'A Temporary Access Pass is a time-limited passcode that lets a user sign in just long enough to register a passwordless method, so no traditional password ever exists to be phished or reused. Both temporary-password approaches still put a typed, phishable password into the first sign-in. SSPR has no effect for users who have not already registered authentication methods, so it cannot bootstrap a brand-new account.',
            },
            {
                'id': 'br-id-mfa-passwordless-q3',
                'type': 'mc',
                'question': 'A user\'s Windows Hello for Business PIN is only six digits, yet it is considered stronger than a typical password. Why?',
                'options': [
                    'The PIN only unlocks a cryptographic key pair bound to that device, so it is not a shared secret sent over the network and is useless on any other machine',
                    'The PIN is hashed and synchronized to Entra ID so it can be used from any device the user owns',
                    'The PIN is an extra factor added on top of the existing password, which must still be typed at every sign-in',
                    'Windows Hello PINs are accepted only when the user also approves an SMS code',
                ],
                'correct': 0,
                'explanation': 'Windows Hello for Business replaces the password with a gesture that unlocks a key pair held on the device (in the TPM where available), so nothing reusable crosses the network and the PIN means nothing elsewhere. That is also why it is passwordless rather than MFA layered on a password, and it does not rely on SMS. The PIN is not synchronized for use on other devices.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-workload-identities',
        'title': 'Non-human identities: managed identities, service principals and federation',
        'summary': 'Applications and automation need identities too, and the goal is the same everywhere: no secret stored in code or configuration. A managed identity gives an Azure resource a credential that Azure manages, either system-assigned (tied to one resource\'s lifecycle) or user-assigned (a standalone resource that many resources can share). For a workload running outside Azure, such as GitHub Actions or a Kubernetes service account, workload identity federation exchanges the workload\'s own token for an Entra ID token, so there is nothing to rotate or leak.',
        'appearsIn': [
            {
                'track': 'az900',
                'lesson': 'identity-security',
                'angle': 'Presents a managed identity as the answer whenever an Azure resource must authenticate to another service without credentials embedded in code, typically alongside Key Vault, where access is still governed through Microsoft Entra ID and Azure RBAC.',
            },
            {
                'track': 'az305',
                'lesson': 'identity-access-management',
                'angle': 'Makes it a design decision: apps that must share one identity, or apps that are deleted and recreated, point to a single user-assigned managed identity, because a system-assigned identity is created and deleted with its resource and its role assignment would have to be granted again each time.',
            },
            {
                'track': 'sc300',
                'lesson': 'workload-identities-apps',
                'angle': 'Explains the objects behind it: an app registration is the global definition, an enterprise application is the tenant-local service principal, and a managed identity\'s service principal has no app registration. Delegated versus application permissions decide whether an app acts for a user or as itself, and federation is set up as a federated credential trust.',
            },
            {
                'track': 'sc500',
                'lesson': 'identity-access-governance',
                'angle': 'Stresses the credential-free pattern: workload identity federation lets an external identity provider\'s token be exchanged for an Entra ID token with no client secret or certificate stored anywhere, and it contrasts this with cross-tenant access settings, which govern human partner sign-ins.',
            },
        ],
        'watchOut': 'Three different things get called "federation" or "identity" across these exams. AD FS federation hands human sign-in to an on-premises provider, cross-tenant access settings govern how far you trust a partner\'s users, and workload identity federation is a token exchange for non-human workloads. A managed identity only works for Azure resources, so an external pipeline needs federation instead.',
        'questions': [
            {
                'id': 'br-id-workload-identities-q1',
                'type': 'mc',
                'question': 'A GitHub Actions pipeline deploys to Azure using an app registration whose client secret is stored as a repository variable. The secret expired unnoticed and caused an outage, and the team now wants no secret or certificate stored anywhere. What should they do?',
                'options': [
                    'Enable a system-assigned managed identity on the GitHub-hosted runner and grant it the deployment role',
                    'Move the secret into Azure Key Vault and rotate it every 30 days',
                    'Add a federated credential that trusts GitHub\'s token issuer to the app registration, or to a user-assigned managed identity',
                    'Configure federation with AD FS so the pipeline authenticates through the on-premises provider',
                ],
                'correct': 2,
                'explanation': 'Workload identity federation exchanges GitHub\'s own token for an Entra ID token through a federated credential trust, so no secret exists to expire. A system-assigned managed identity can only belong to an Azure resource, and a GitHub-hosted runner is not one. Key Vault with rotation still stores and manages a secret, which is the thing being removed. AD FS federation is for human users signing in through an on-premises provider, not for workload tokens.',
                'whyTested': 'SC-300 and SC-500 both test federation as the secret-free answer for workloads outside Azure.',
            },
            {
                'id': 'br-id-workload-identities-q2',
                'type': 'mc',
                'question': 'An application on a single virtual machine must read secrets from Key Vault with no credentials in code. Only that VM uses the identity, and policy requires that the identity cease to exist when the VM is decommissioned so nothing is left orphaned. Which identity should it use?',
                'options': [
                    'A user-assigned managed identity attached to the VM',
                    'A service principal with a certificate stored on the VM',
                    'A guest user account created for the application',
                    'A system-assigned managed identity on the VM',
                ],
                'correct': 3,
                'explanation': 'A system-assigned managed identity is created with the resource and deleted when the resource is deleted, which matches the no-orphans requirement, and it holds no credential in code. A user-assigned identity is a standalone resource that persists after any single resource is removed, which is the right choice for sharing but leaves something to clean up here. A service principal with a certificate still involves a stored credential to protect and rotate. Guest accounts are for external people, not workloads.',
            },
            {
                'id': 'br-id-workload-identities-q3',
                'type': 'mc',
                'question': 'A partner organization\'s employees collaborate as B2B guests in your tenant. The partner already enforces MFA and device compliance, and you do not want its users challenged for MFA a second time. Which feature controls that trust?',
                'options': [
                    'Cross-tenant access settings that trust the partner\'s MFA and device-compliance claims',
                    'Workload identity federation with the partner\'s identity provider',
                    'A user-assigned managed identity shared with the partner',
                    'An AD FS federation trust with the partner\'s on-premises domain',
                ],
                'correct': 0,
                'explanation': 'Cross-tenant access settings decide, per partner organization, whether to trust that partner\'s own MFA and device-compliance claims for inbound B2B users. Workload identity federation is a token exchange for non-human workloads, not human partner sign-ins. A managed identity belongs to Azure resources and cannot be used by people. AD FS federation would hand authentication of your own on-premises users to another provider and is not how guest collaboration trust is configured.',
            },
        ],
    },
    # ------------------------------------------------------------------
    {
        'id': 'br-id-conditional-access-signals',
        'title': 'Conditional Access: one engine, many signals, one lockout risk',
        'summary': 'Conditional Access is the "under what conditions" engine. A policy has assignments (users, the cloud apps targeted, and conditions such as device state, location and risk) and access controls (grant controls like MFA or a compliant device, or block, plus session controls). Each cert feeds it a different signal: Intune device compliance, Entra ID Protection risk, or which app is being targeted. When several policies apply, all of their grant controls must be met, and a bad policy can lock out every administrator, which is why report-only mode and emergency access accounts exist.',
        'appearsIn': [
            {
                'track': 'ab650',
                'lesson': 'identity-access-threat-protection',
                'angle': 'Separates grant controls (whether access is allowed at all) from session controls (restrictions inside a granted session, such as browser-only access with no downloads), notes that security defaults and Conditional Access cannot both be active, and ties in Entra ID Protection\'s sign-in risk and user risk signals.',
            },
            {
                'track': 'md102',
                'lesson': 'protect-devices-and-access',
                'angle': 'Supplies the device signal: the require-compliant-device grant control checks the specific signing-in device against Intune compliance, a device still inside its grace period counts as compliant, and a Defender for Endpoint risk rule can make a compromised device fail compliance and lose access.',
            },
            {
                'track': 'az140',
                'lesson': 'identity-and-security-for-avd',
                'angle': 'Applies it to Azure Virtual Desktop, where two Entra apps are involved: Azure Virtual Desktop (feed and gateway) and Windows Cloud Login (sign-in to the session host with single sign-on). Enforcing MFA or compliant-device across the whole connection means targeting both.',
            },
            {
                'track': 'sc300',
                'lesson': 'conditional-access-risk',
                'angle': 'Covers the structure and the safety net: assignments versus access controls, named locations, authentication strength, templates, report-only mode to preview impact before enforcing, and the rule that all required grant controls from every applicable policy must be satisfied together.',
            },
        ],
        'watchOut': 'Intune compliance and Entra ID Protection risk are different signals that are easy to swap: device compliance describes the endpoint, user risk describes the identity, and satisfying MFA clears sign-in risk but not user risk. A compliant-device requirement is also checked against the specific device signing in, and a device inside its grace period still counts as compliant.',
        'questions': [
            {
                'id': 'br-id-conditional-access-signals-q1',
                'type': 'mc',
                'question': 'An Azure Virtual Desktop deployment uses single sign-on. A Conditional Access policy requiring MFA targets only the Azure Virtual Desktop app, and auditors find that the sign-in to the session host itself is not evaluated by any policy. What should you do?',
                'options': [
                    'Add a session control with a shorter sign-in frequency to the existing policy',
                    'Change the existing policy from a grant control to a session control',
                    'Replace the policy with security defaults, which cover every app automatically',
                    'Create a matching policy that also targets the Windows Cloud Login app',
                ],
                'correct': 3,
                'explanation': 'AVD involves two Entra apps: Azure Virtual Desktop is evaluated when the user subscribes to the feed and authenticates to the gateway, and Windows Cloud Login is evaluated when the user signs in to the session host with single sign-on. Targeting both with matching policies covers the whole connection. Sign-in frequency changes how often a prompt occurs but not which app is evaluated, and a session control does not replace a grant requirement. Security defaults cannot be used alongside Conditional Access and offer no per-app targeting.',
                'whyTested': 'The same Conditional Access engine, but AZ-140 adds an app-targeting wrinkle that generic CA knowledge misses.',
            },
            {
                'id': 'br-id-conditional-access-signals-q2',
                'type': 'mc',
                'question': 'A Conditional Access policy already requires a compliant device for Microsoft 365. Routine compliance failures, such as a missed OS update, should get a five-day grace period, but a device that Microsoft Defender for Endpoint rates as high risk must lose access immediately. What should you do?',
                'options': [
                    'Add a Conditional Access condition that blocks high user risk',
                    'Put the Defender for Endpoint machine risk rule in a separate compliance policy whose Mark device noncompliant action runs immediately',
                    'Add the machine risk rule to the existing compliance policy that uses the five-day schedule',
                    'Change the Conditional Access policy to a browser-only session control for all devices',
                ],
                'correct': 1,
                'explanation': 'The grace period is the schedule on the Mark device noncompliant action, so the risky-device rule needs its own compliance policy with an immediate schedule, and the existing require-compliant-device control then blocks the device as soon as it is noncompliant. User risk comes from Entra ID Protection and describes the identity, not the health of the endpoint. Adding the rule to the existing policy would keep a compromised device counting as compliant for the five-day grace period. A browser-only session control restricts the session but does not cut off access.',
            },
            {
                'id': 'br-id-conditional-access-signals-q3',
                'type': 'mc',
                'question': 'A new Conditional Access policy requires phishing-resistant MFA for all users and all apps. A configuration error blocks every administrator, and the tenant has no way back in. Which preparation would have prevented the lockout?',
                'options': [
                    'Making every administrator PIM-eligible so a privileged role can be activated during an incident',
                    'Turning on security defaults alongside the policy as a fallback',
                    'Two cloud-only emergency access accounts with permanent Global Administrator, excluded from the policy, protected by strong offline credentials and sign-in alerts',
                    'Federated administrator accounts from an on-premises AD FS farm, excluded from the policy',
                ],
                'correct': 2,
                'explanation': 'Emergency access accounts are the guaranteed way in when a policy misfires: cloud-only, permanently privileged, excluded from the policies that could block them, and protected by strong credentials and monitoring instead. PIM activation still requires a successful sign-in, which the blocking policy prevents. Security defaults and Conditional Access cannot both be active, so security defaults are not a fallback. Federated accounts depend on on-premises infrastructure and the federation service being reachable. Testing the policy in report-only mode first is the complementary habit that avoids the lockout in the first place.',
                'whyTested': 'Break-glass accounts are the standard exception to Conditional Access and PIM, and SC-300 and AZ-305 both test them.',
            },
        ],
    },
]
