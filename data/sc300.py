"""Categories, flashcards, and quiz questions for Microsoft SC-300: Microsoft Identity and Access Administrator."""

CATEGORIES = [
    {'key': 'userIdentities', 'label': 'Implement and Manage User Identities', 'marks': 22, 'resources': [
        {'label': 'Microsoft Learn: Implement an identity management solution using Microsoft Entra ID', 'url': 'https://learn.microsoft.com/en-us/training/paths/implement-identity-management-solution/'},
    ]},
    {'key': 'authAccessMgmt', 'label': 'Implement Authentication and Access Management', 'marks': 28, 'resources': [
        {'label': 'Microsoft Learn: SC-300 - Implement an Authentication and Access Management solution', 'url': 'https://learn.microsoft.com/en-us/training/paths/implement-authentication-access-management-solution/'},
    ]},
    {'key': 'workloadIdentities', 'label': 'Plan and Implement Workload Identities', 'marks': 25, 'resources': [
        {'label': 'Microsoft Learn: Workload identities overview (Microsoft Entra Workload ID)', 'url': 'https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-overview'},
        {'label': 'Microsoft Learn: Exam readiness - Preparing for SC-300: Plan and implement workload identities', 'url': 'https://learn.microsoft.com/en-us/shows/exam-readiness-zone/preparing-for-sc-300-plan-and-implement-workload-identities'},
    ]},
    {'key': 'identityGovernance', 'label': 'Plan and Implement Identity Governance', 'marks': 25, 'resources': [
        {'label': 'Microsoft Learn: SC-300 - Plan and implement an identity governance strategy', 'url': 'https://learn.microsoft.com/en-us/training/paths/plan-implement-identity-governance-strategy'},
    ], 'screenshot': 'pimActivateRole'},
]

FLASHCARDS = [
    {
        'id': 'f1',
        'cat': 'userIdentities',
        'front': 'Microsoft Entra ID directory roles vs. Azure RBAC roles',
        'back': "Microsoft Entra ID directory roles (User Administrator, Global Administrator, License Administrator) govern directory-level administrative tasks such as resetting passwords or managing groups. Azure RBAC roles (Owner, Contributor, Reader) govern access to Azure resources at a management group, subscription, resource group, or resource scope.",
        'detail': "Holding a directory role like Global Administrator does not automatically grant Azure RBAC rights on a subscription; an administrator must explicitly elevate access under Entra ID properties to bridge the two systems.",
    },
    {
        'id': 'f2',
        'cat': 'userIdentities',
        'front': 'Administrative units',
        'back': 'An administrative unit is a container that scopes a directory role assignment to a defined subset of users, groups, or devices, such as one regional office or department, instead of granting that role across the entire tenant.',
        'detail': "A Helpdesk Administrator role assigned only within the Seattle Office administrative unit can reset passwords for users in that unit but has no rights over users outside it.",
    },
    {
        'id': 'f3',
        'cat': 'userIdentities',
        'front': 'Dynamic group membership rules',
        'back': "A dynamic group automatically adds or removes users or devices based on a membership rule evaluated against directory attributes (department, job title, device OS), rather than requiring an administrator to add or remove members manually.",
        'detail': "Dynamic membership rules can target users, or devices, but not both in the same group -- a dynamic group is either a dynamic user group or a dynamic device group, never a mix.",
    },
    {
        'id': 'f4',
        'cat': 'userIdentities',
        'front': 'Microsoft Entra Connect sync methods: Password Hash Sync, Pass-through Authentication, and Federation',
        'back': 'Password Hash Sync (PHS) synchronizes a hash of the on-premises password hash to Microsoft Entra ID so sign-in is validated in the cloud. Pass-through Authentication (PTA) validates the password directly against on-premises Active Directory via a lightweight agent, with no password hash stored in the cloud. Federation (commonly AD FS) redirects authentication entirely to an on-premises identity provider.',
        'detail': "PHS is the simplest and most resilient option Microsoft recommends by default, since it keeps working even if the on-premises PTA agents or federation servers become unavailable.",
    },
    {
        'id': 'f5',
        'cat': 'userIdentities',
        'front': 'Microsoft Entra Connect Sync vs. Microsoft Entra Cloud Sync',
        'back': 'Microsoft Entra Connect Sync is a full-featured, single-server synchronization engine with rich customization for complex on-premises topologies. Microsoft Entra Cloud Sync is a lightweight, agent-based service supporting multiple agents across multiple AD forests, managed from the cloud, aimed at simpler high-availability scenarios.',
        'detail': "Cloud Sync's multiple lightweight agents can be deployed across several on-premises AD forests for redundancy far more simply than standing up multiple Entra Connect Sync servers, but it supports fewer customization options for complex attribute-flow scenarios.",
    },
    {
        'id': 'f6',
        'cat': 'userIdentities',
        'front': 'External Identities: B2B collaboration',
        'back': "B2B collaboration lets a partner user sign in to your resources using their own home organization's Microsoft Entra (or other supported) credentials, added to your tenant as a guest user object without you managing a separate password for them.",
        'detail': "The partner's identity, MFA status, and password all remain managed by their home tenant; your tenant only decides what that guest is authorized to access, governed further by cross-tenant access settings.",
    },
    {
        'id': 'f7',
        'cat': 'userIdentities',
        'front': 'Bulk user operations',
        'back': 'The Microsoft Entra admin center supports bulk create, bulk invite (for guests), and bulk delete of user accounts using a downloadable CSV template, letting an administrator process many accounts in one operation instead of one at a time in the portal.',
        'detail': "The bulk operation downloads a CSV template with the exact required column headers first; uploading a hand-built CSV with mismatched headers is a common reason a bulk import fails.",
    },
    {
        'id': 'f8',
        'cat': 'userIdentities',
        'front': 'Restoring a deleted user',
        'back': 'A deleted Microsoft Entra ID user is soft-deleted and recoverable, along with its group memberships and licenses, for 30 days before being permanently purged.',
        'detail': "After the 30-day window closes, the user object and its associated data are gone permanently -- there is no further recovery option once that period has passed.",
    },
    {
        'id': 'f9',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access policy structure: assignments and access controls',
        'back': 'A Conditional Access policy defines assignments (who: users/groups, what: cloud apps or actions, and conditions: sign-in risk, device platform, location, client app) that determine when the policy applies, then applies access controls (grant controls like requiring MFA, or block; and session controls like limiting browser sessions) when it does.',
        'detail': 'A policy whose assignments do not match a given sign-in simply does not evaluate for that sign-in at all -- it is not the same as evaluating and then granting access.',
    },
    {
        'id': 'f10',
        'cat': 'authAccessMgmt',
        'front': 'Multifactor authentication methods',
        'back': "Microsoft Entra supports several MFA methods, including the Microsoft Authenticator app (push notification or passwordless), OATH hardware or software tokens, FIDO2 security keys, and voice call/SMS -- though voice and SMS are still supported but considered weaker than app-based and phishing-resistant methods, so Microsoft steers organizations toward stronger options.",
        'detail': "\"Strongest\" and \"phishing-resistant\" are not the same thing: standard Authenticator push notifications are stronger than SMS but can still be defeated by MFA-fatigue or consent-phishing attacks, while only methods like FIDO2 security keys, Windows Hello for Business, and certificate-based authentication are phishing-resistant (see the Conditional Access authentication strengths flashcard).",
    },
    {
        'id': 'f11',
        'cat': 'authAccessMgmt',
        'front': 'Passwordless authentication options',
        'back': 'Passwordless sign-in eliminates the password entirely using FIDO2 security keys, Windows Hello for Business (biometric or PIN tied to a specific device), or Microsoft Authenticator passwordless phone sign-in, each proving identity through possession of a device plus a biometric or PIN rather than a shared secret.',
        'detail': "FIDO2 keys are phishing-resistant because the cryptographic key never leaves the hardware device and is bound to the specific site it was registered with, unlike a password that can be typed into any lookalike site.",
    },
    {
        'id': 'f12',
        'cat': 'authAccessMgmt',
        'front': 'Self-Service Password Reset (SSPR) registration requirements',
        'back': 'SSPR lets a user reset their own forgotten password without contacting the help desk, but only after registering the required number of authentication methods (such as a phone number, email, or the Authenticator app) that an administrator has configured as mandatory.',
        'detail': "Enabling SSPR for a group has no effect on users who have not yet registered authentication methods for it -- registration is a separate, required step from enabling the feature itself.",
    },
    {
        'id': 'f13',
        'cat': 'authAccessMgmt',
        'front': 'Combined registration for security info',
        'back': 'Combined registration presents a single, unified experience where a user registers authentication methods that satisfy both multifactor authentication and SSPR requirements at once, instead of registering separately for each.',
        'detail': "A method registered once through combined registration -- like the Authenticator app -- can then satisfy both an MFA challenge and a future SSPR flow, avoiding duplicate registration.",
    },
    {
        'id': 'f14',
        'cat': 'authAccessMgmt',
        'front': 'Microsoft Entra ID Protection: user risk vs. sign-in risk',
        'back': "User risk reflects the likelihood a specific identity has been compromised, based on signals like leaked credentials found in the wild. Sign-in risk reflects the likelihood one specific authentication attempt is not genuine, based on signals like impossible travel or anonymous IP addresses.",
        'detail': "A leaked-credential detection raises user risk even if the very next sign-in looks completely normal, while an anonymous-IP sign-in raises sign-in risk for that one attempt regardless of the user's overall risk history -- the two signals are tracked and remediated independently.",
    },
    {
        'id': 'f15',
        'cat': 'authAccessMgmt',
        'front': 'Risk-based Conditional Access policies',
        'back': 'A sign-in risk policy can require MFA or block access when a sign-in attempt is judged risky. A user risk policy can require a secure password change or block access when the identity itself is judged likely compromised, remediating the underlying risk rather than just that one session.',
        'detail': "Successfully completing MFA on a risky sign-in resolves that sign-in's risk, but it does not by itself resolve an elevated user risk score -- a user risk policy typically requires a password change to actually remediate the identity-level risk.",
    },
    {
        'id': 'f16',
        'cat': 'authAccessMgmt',
        'front': 'Authentication methods policy',
        'back': "The authentication methods policy is the current, centralized location for enabling and configuring which authentication methods (Authenticator, FIDO2, SMS, voice, OATH tokens, Temporary Access Pass, and more) are available tenant-wide or scoped to specific groups, replacing the older separate MFA service settings and SSPR policy blades.",
        'detail': "Microsoft has been consolidating legacy per-feature authentication settings into this single policy; a scenario referencing a modern, unified place to manage which methods users can register is pointing at the authentication methods policy.",
    },
    {
        'id': 'f17',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access named locations',
        'back': 'Named locations let an administrator define trusted IP ranges or countries/regions (including marking some as trusted) that Conditional Access policies can reference as a condition, such as requiring extra verification for sign-ins from outside a trusted named location.',
        'detail': "Marking a named location as trusted lets Microsoft Entra ID Protection factor that location into its sign-in risk calculation (reducing false positives for known corporate networks), in addition to its being usable as a plain location condition in Conditional Access policies.",
    },
    {
        'id': 'f18',
        'cat': 'authAccessMgmt',
        'front': 'Temporary Access Pass (TAP)',
        'back': 'A Temporary Access Pass is a time-limited, one-time or limited-use passcode an administrator issues to a user, letting them sign in and register other authentication methods (like Passwordless or FIDO2) without ever needing a traditional password.',
        'detail': "TAP is the standard way to bootstrap a brand-new or password-reset user straight into passwordless registration, without first issuing them a temporary password to type in.",
    },
    {
        'id': 'f19',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access authentication strengths',
        'back': "An authentication strength is a Conditional Access grant control that requires sign-in using one of a specified combination of authentication methods (for example, only phishing-resistant methods like FIDO2 or Windows Hello for Business), rather than accepting any method that merely satisfies generic MFA.",
        'detail': "A policy requiring the built-in Phishing-resistant MFA authentication strength will reject a sign-in that used SMS-based MFA, even though SMS technically satisfies a generic require-MFA grant control.",
    },
    {
        'id': 'f20',
        'cat': 'workloadIdentities',
        'front': 'App registration vs. enterprise application',
        'back': "An app registration defines an application's identity in a tenant (its app ID, redirect URIs, requested API permissions) -- it is the global definition of the app. An enterprise application is the service principal, the local, tenant-specific instance that represents how that app is actually used and governed (assignments, SSO configuration, Conditional Access) inside one particular tenant.",
        'detail': "Registering an app in your own tenant automatically creates its enterprise application (service principal) there too; consenting to a multi-tenant app from another vendor's tenant instead creates only the enterprise application/service principal side, with no app registration of your own to manage.",
    },
    {
        'id': 'f21',
        'cat': 'workloadIdentities',
        'front': 'Service principal types',
        'back': "Microsoft Entra ID recognizes several service principal types: application (backing a registered app), managed identity (an automatically managed identity tied to an Azure resource), and legacy (older service principals predating the current app registration model).",
        'detail': "Every enterprise application list entry is technically a service principal, but not every service principal traces back to a full app registration -- a managed identity's service principal, for instance, has no corresponding app registration object.",
    },
    {
        'id': 'f22',
        'cat': 'workloadIdentities',
        'front': 'System-assigned vs. user-assigned managed identity',
        'back': "A system-assigned managed identity is created and tied to a single Azure resource's lifecycle, deleted automatically when that resource is deleted. A user-assigned managed identity is its own standalone resource that can be attached to multiple resources at once and persists independently of any one of them.",
        'detail': "When several resources need to share one identity and one set of role assignments, a user-assigned managed identity is the right choice -- a system-assigned identity cannot be reused across resources or survive its resource being deleted.",
    },
    {
        'id': 'f23',
        'cat': 'workloadIdentities',
        'front': 'Workload identity federation',
        'back': "Workload identity federation lets an external workload (such as a GitHub Actions pipeline or a Kubernetes service account) exchange a token issued by its own identity provider for a Microsoft Entra ID token, using a federated credential trust configured on an app registration or managed identity, with no client secret or certificate stored anywhere.",
        'detail': "Federation removes the ongoing secret-rotation burden entirely -- the trust relationship between the external token issuer and Entra ID replaces the secret, rather than the secret merely being rotated on a tighter schedule.",
    },
    {
        'id': 'f24',
        'cat': 'workloadIdentities',
        'front': 'Microsoft Entra Agent ID for AI agents',
        'back': "Microsoft Entra Agent ID gives an AI agent its own individually identifiable, policy-governed identity distinct from a human user, a standard app registration, or a generic shared service principal, so its actions can be authenticated, authorized, and audited across its full lifecycle, and governed with the same tools -- like Conditional Access -- used for other identities.",
        'detail': "Agent identity blueprints act as reusable templates: permissions and Conditional Access requirements set once on a blueprint automatically apply to every agent identity created from it, letting an admin govern a whole fleet of agents through a single policy.",
    },
    {
        'id': 'f25',
        'cat': 'workloadIdentities',
        'front': 'API permissions: delegated vs. application permissions',
        'back': "A delegated permission lets an app act on behalf of a signed-in user, limited to whatever that user could already do themselves. An application permission lets an app act as itself with no signed-in user present, typically used for a background service or daemon, and generally requires admin consent.",
        'detail': "An application permission is the more powerful of the two because it operates with the app's own standing rights rather than being capped by an individual user's rights -- which is exactly why application permissions almost always require admin consent rather than user consent.",
    },
    {
        'id': 'f26',
        'cat': 'workloadIdentities',
        'front': 'Admin consent vs. user consent',
        'back': "User consent lets an individual user approve the permissions a specific app requests for their own data. Admin consent, granted by a privileged administrator, approves an app's requested permissions on behalf of the entire organization (or a set of users), and is required for higher-privilege or application-level permissions that an ordinary user is not allowed to approve alone.",
        'detail': "An admin consent workflow can be configured so that when a user requests access to an app needing admin approval, the request is routed to a designated reviewer instead of being silently blocked or silently granted.",
    },
    {
        'id': 'f27',
        'cat': 'workloadIdentities',
        'front': 'SSO configuration methods for enterprise applications',
        'back': "Enterprise applications in Microsoft Entra ID can be configured for single sign-on using SAML-based SSO, OpenID Connect/OAuth-based SSO, password-based SSO (Entra stores and auto-fills the user's credentials), or linked SSO (simply links to an app that already handles its own sign-in).",
        'detail': "Password-based SSO still requires the user to have a separate password on the target app -- Entra just stores and injects it automatically -- unlike SAML or OIDC SSO, where the target app trusts Entra's own token instead of any separate password at all.",
    },
    {
        'id': 'f28',
        'cat': 'workloadIdentities',
        'front': 'Microsoft Entra application proxy',
        'back': 'Application Proxy publishes an on-premises web application for secure remote access through Microsoft Entra ID, applying the same Conditional Access and single sign-on experience to that legacy on-premises app as to a cloud-native SaaS app, using a lightweight connector installed on-premises with no inbound firewall ports opened.',
        'detail': "The on-premises connector makes only outbound connections to the Application Proxy service, which is why no inbound firewall rule ever needs to be opened for remote users to reach the published app.",
    },
    {
        'id': 'f29',
        'cat': 'identityGovernance',
        'front': 'Entitlement management: access packages',
        'back': "An access package bundles resources (groups, Teams, SharePoint sites, enterprise applications) that a user -- internal or an external guest -- can request through a defined approval workflow, often with a fixed expiration date, without an administrator manually adding them to each resource.",
        'detail': "Access packages can be exposed to external users through a connected organization, letting a whole partner organization's users self-request access without each one being separately invited as a guest beforehand.",
    },
    {
        'id': 'f30',
        'cat': 'identityGovernance',
        'front': 'Access reviews',
        'back': 'An access review periodically asks a designated reviewer (a manager, resource owner, or the users themselves) to confirm that existing access to a group, application, or role assignment is still needed, and can automatically remove access that is not confirmed within the review window.',
        'detail': "Access reviews are the direct answer whenever a scenario wants to systematically clean up stale guest access or group membership rather than relying on someone remembering to remove it by hand.",
    },
    {
        'id': 'f31',
        'cat': 'identityGovernance',
        'front': 'PIM eligible vs. active role assignments',
        'back': 'In Privileged Identity Management, an eligible assignment lets a user activate a role only when needed, typically requiring MFA, justification, and/or approval, for a limited time window. An active assignment means the role is already in effect with no activation step required.',
        'detail': 'PIM manages both Azure RBAC roles at a resource/subscription scope and Microsoft Entra directory roles like Global Administrator -- it is not limited to just one or the other.',
    },
    {
        'id': 'f32',
        'cat': 'identityGovernance',
        'front': 'PIM activation requirements: MFA, justification, and approval',
        'back': "A PIM role setting can require a user to complete MFA, supply a written justification, and/or obtain approval from a designated approver before an eligible assignment can be activated, and can cap the maximum activation duration.",
        'detail': "Requiring approval routes the activation request to a designated approver, who must explicitly approve it before the role becomes active -- the requester cannot activate it unilaterally just by supplying MFA and justification alone.",
    },
    {
        'id': 'f33',
        'cat': 'identityGovernance',
        'front': 'PIM for Groups',
        'back': "PIM for Groups extends just-in-time, time-bound activation to membership in (or ownership of) a Microsoft 365 or security group itself, rather than only to individual Entra ID directory roles or Azure RBAC roles -- letting a group's own permissions become the thing that is activated on demand.",
        'detail': "This is useful when several distinct role assignments are already bundled onto one group; making membership in that group itself eligible and time-bound activates the whole bundle at once, rather than configuring PIM separately for each individual role.",
    },
    {
        'id': 'f34',
        'cat': 'identityGovernance',
        'front': 'Terms of use (ToU)',
        'back': 'A terms of use policy requires a user to view and accept a specified document before being granted access, and can be scoped to specific users or groups, expire after a set period requiring reacceptance, and be enforced through a Conditional Access policy.',
        'detail': "Terms of use is commonly required for external guest users or contractors before they gain any access at all, and reporting shows exactly who has and has not yet accepted a given version of the document.",
    },
    {
        'id': 'f35',
        'cat': 'identityGovernance',
        'front': 'Identity Governance lifecycle workflows',
        'back': "Lifecycle workflows automate identity tasks tied to joiner, mover, and leaver events -- such as sending a welcome email and provisioning access on a new hire's start date, or disabling accounts and removing access automatically on a departure date -- without an administrator manually triggering each step.",
        'detail': "A leaver workflow can be configured to run automatically a set number of days before or after an employee's recorded termination date, removing the need for HR and IT to coordinate that timing manually.",
    },
    {
        'id': 'f36',
        'cat': 'identityGovernance',
        'front': 'Recertifying guest access with access reviews',
        'back': "Running a recurring access review specifically targeting guest users in a group or application periodically forces a reviewer to recertify that each guest still needs access, and can automatically remove any guest whose access is not confirmed, addressing the common problem of forgotten, stale B2B guest accounts.",
        'detail': "Without a recurring access review, guest accounts added years ago for a since-completed project tend to remain indefinitely, since nothing else in the platform prompts anyone to reconsider whether they should still have access.",
    },
    {
        'id': 'f37',
        'cat': 'identityGovernance',
        'front': 'Privileged access groups vs. PIM for directory roles',
        'back': "A privileged access group is a group made eligible for just-in-time PIM activation of its own membership or ownership, which is the underlying mechanism PIM for Groups uses; PIM for directory roles instead makes a specific Entra ID role itself (like Global Administrator) eligible for time-bound activation on a per-user basis.",
        'detail': "Both rely on the same eligible/active PIM activation model -- the difference is simply whether what gets activated is membership in a group or an individual directory role assignment.",
    },
    {
        'id': 'f38',
        'cat': 'identityGovernance',
        'front': 'Connected organizations in entitlement management',
        'back': "A connected organization is an external Microsoft Entra tenant (or a non-Entra domain) registered in entitlement management so that its users can be targeted as eligible requestors for an access package, without each external user needing to already exist as a guest in your tenant beforehand.",
        'detail': "Adding a connected organization does not itself grant access to anyone -- it only makes that organization's users visible as candidates who can then request an access package, which still runs through its own approval workflow.",
    },
    {
        'id': 'f39',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access report-only mode',
        'back': "Runs a Conditional Access policy against real sign-ins and logs what it would have done — grant, block, or require an extra control — without actually enforcing anything, so its impact can be reviewed before it's turned on for real.",
        'detail': "This is the recommended way to test any new or modified Conditional Access policy before flipping it to On, since it catches an overly broad policy before it locks anyone out.",
    },
    {
        'id': 'f40',
        'cat': 'identityGovernance',
        'front': 'Break-glass emergency access accounts',
        'back': "Two or more cloud-only accounts with permanent Global Administrator access, excluded from at least some Conditional Access policies and not tied to normal PIM activation, protected instead with strong phishing-resistant credentials (such as FIDO2 passkeys or certificate-based authentication) stored securely offline, and kept purely so admins can still sign in if every other authentication method is broken or unavailable.",
        'detail': "These accounts should be monitored closely with sign-in alerts, and excluded from the Conditional Access policies (such as location restrictions and risk policies) that could block them -- the whole point is that they still work when everything else has failed.",
    },
    {
        'id': 'f41',
        'cat': 'userIdentities',
        'front': 'Custom security attributes',
        'back': 'Custom security attributes are administrator-defined key-value pairs (e.g. Project = Falcon) attached to a user or other object, usable in attribute-based access control conditions on Azure role assignments (such as for Azure Storage) and for targeting applications with Conditional Access filters -- extending targeting beyond the built-in directory attributes.',
        'detail': 'Reading or assigning a custom security attribute needs its own dedicated role (Attribute Assignment Administrator or Attribute Definition Administrator) — even a Global Administrator cannot manage them without being granted one of these first.',
    },
    {
        'id': 'f42',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access policy templates',
        'back': 'Microsoft-provided Conditional Access templates pre-fill common, recommended assignments and access controls, such as requiring MFA for all users or blocking legacy authentication, so an administrator starts from a vetted baseline instead of building every policy from scratch.',
        'detail': 'Every Conditional Access policy, whether built from a template or from scratch, should explicitly exclude your break-glass emergency access accounts, so a misconfigured or unreachable policy can never lock every administrator out at once.',
    },
    {
        'id': 'f43',
        'cat': 'authAccessMgmt',
        'front': 'Identity Secure Score',
        'back': "Identity Secure Score is a percentage Microsoft Entra ID calculates from your tenant's actual security configuration, listing specific improvement actions — such as enabling multifactor authentication methods or blocking legacy authentication — each showing the points earned if implemented.",
        'detail': "The score is directional, not a pass/fail target: two tenants with very different real-world MFA and SSPR coverage can land on similar scores if they've each implemented a different subset of the recommended actions.",
    },
    {
        'id': 'f44',
        'cat': 'userIdentities',
        'front': 'Cross-tenant access settings',
        'back': "Cross-tenant access settings control which external Microsoft Entra organizations your tenant trusts for inbound B2B collaboration, including whether to trust a partner's own multifactor authentication methods and device compliance claims instead of re-enforcing your own for their guest users.",
        'detail': 'These settings apply per-organization and are separate from the B2B collaboration invitation itself — a partner org can be trusted for MFA claims by default, then have that trust explicitly overridden for one specific inbound organization.',
    },
    {
        'id': 'f45',
        'cat': 'userIdentities',
        'front': 'Seamless single sign-on (Seamless SSO)',
        'back': "Seamless SSO silently signs a user into cloud apps whenever they're already signed in to a domain-joined, on-premises Active Directory device, handling automatic sign-in on the device itself rather than how the password is validated — it pairs with, and is separate from, whichever sign-in method (Password Hash Sync, Pass-through Authentication, or Federation) an organization has chosen in Microsoft Entra Connect.",
        'detail': "Seamless SSO can be enabled alongside either Password Hash Sync or Pass-through Authentication -- it isn't itself a sign-in validation method, so a scenario about domain-joined devices skipping a sign-in prompt entirely is pointing at Seamless SSO, not at which of PHS or PTA is configured.",
    },
    {
        'id': 'f46',
        'cat': 'authAccessMgmt',
        'front': 'Password writeback',
        'back': "Password writeback synchronizes a password a user changes or resets through Self-Service Password Reset (SSPR) back down to on-premises Active Directory, so a cloud-initiated reset updates the same on-premises password instead of leaving the cloud and on-premises copies out of sync.",
        'detail': "Without password writeback enabled, a user who resets their password through SSPR in the cloud would still be stuck with their old, unchanged on-premises password the next time they sign in to a domain-joined resource.",
    },
    {
        'id': 'f47',
        'cat': 'workloadIdentities',
        'front': 'Conditional Access for workload identities',
        'back': "Conditional Access for workload identities is a separate policy scope that applies conditions -- like restricting sign-in to a known set of IP ranges -- directly to single-tenant service principals registered in your tenant (managed identities and multitenant SaaS apps are not covered), since ordinary Conditional Access policies target human users and groups, and a non-interactive identity such as a pipeline's service principal does not automatically inherit those user-targeted policies.",
        'detail': "This is exactly why a policy scoped to 'All users' never actually restricts an automated pipeline's service principal -- workload identities need their own dedicated Conditional Access policy scope to be governed at all.",
    },
    {
        'id': 'f48',
        'cat': 'userIdentities',
        'front': 'Microsoft Entra device join types: joined, hybrid joined, and registered',
        'back': "Microsoft Entra joined devices exist purely in the cloud with no on-premises Active Directory dependency, suited to corporate-owned devices managed entirely through Intune. Microsoft Entra hybrid joined devices are joined to both on-premises AD and Microsoft Entra ID, fitting existing domain-joined desktops that still need Entra ID sign-in. Microsoft Entra registered devices simply add a personal or BYOD device's owner account without making the device itself corporate-managed.",
        'detail': "A Conditional Access policy requiring a hybrid Entra ID joined device will reject a personal phone that is only Microsoft Entra registered, even if that phone has otherwise passed every other grant control.",
    },
    {
        'id': 'f49',
        'cat': 'userIdentities',
        'front': 'Group naming policy',
        'back': 'A group naming policy automatically enforces a prefix/suffix template (like a department code) and a custom blocked words list on every Microsoft 365 group name at creation time, letting self-service group creation continue under consistent, appropriate naming guardrails instead of disabling it outright.',
        'detail': 'This addresses inconsistent or inappropriate self-service group names without having to turn off self-service group creation for the whole tenant.',
    },
    {
        'id': 'f50',
        'cat': 'userIdentities',
        'front': 'Guest user default access restrictions',
        'back': 'By default, a B2B collaboration guest user has more restricted visibility into directory objects (other users, groups) than a full member, and external collaboration settings control exactly how much of the directory a guest can see and who is allowed to invite new guests in the first place.',
        'detail': 'An organization that wants guests to browse the full address list the same as members has to explicitly loosen these external collaboration settings -- that visibility restriction is not something Conditional Access or an access package configures.',
    },
    {
        'id': 'f51',
        'cat': 'userIdentities',
        'front': 'Azure AD B2C',
        'back': "Azure AD B2C is a separate, customer-facing identity solution built on its own distinct tenant type, letting an organization's customer-facing applications sign users up and in with local accounts or social identity providers. It is no longer sold to new customers (since May 1, 2025) and Microsoft Entra External ID is its successor, but it remains the classic contrast with B2B collaboration, which brings a partner organization's own employees into your workforce tenant as guests.",
        'detail': "A scenario about a retail company's shoppers creating accounts to sign in to a public storefront app is pointing at B2C, not B2B collaboration, since shoppers are consumers, not another organization's employees.",
    },
    {
        'id': 'f52',
        'cat': 'authAccessMgmt',
        'front': 'Security defaults',
        'back': "Security defaults are a free, one-size-fits-all baseline that enforces MFA registration and blocks legacy authentication tenant-wide with no per-policy customization, and a tenant generally cannot run security defaults and Conditional Access policies at the same time -- turning on Conditional Access is how an organization graduates beyond security defaults' fixed rules.",
        'detail': "A small organization with no Microsoft Entra ID P1/P2 licensing that just wants baseline MFA enforced with zero configuration is exactly the scenario security defaults is built for, while any organization that needs a granular, assignment-based Conditional Access approach has to disable security defaults first.",
    },
    {
        'id': 'f53',
        'cat': 'authAccessMgmt',
        'front': "Conditional Access 'What If' tool",
        'back': "The What If tool simulates which Conditional Access policies would apply to a specified user, app, and set of conditions, without enforcing anything or waiting for a real sign-in, letting an administrator troubleshoot or validate policy design directly.",
        'detail': "This differs from Conditional Access report-only mode, which evaluates real sign-ins over time and logs the outcome; What If instead answers a single hypothetical scenario on demand.",
    },
    {
        'id': 'f54',
        'cat': 'authAccessMgmt',
        'front': 'Microsoft Entra Password Protection and smart lockout',
        'back': 'Microsoft Entra Password Protection blocks users from setting passwords that match a global banned list plus an administrator-defined custom banned list, optionally extended on-premises via a proxy and DC agent, while smart lockout separately locks out an account after a configurable number of failed sign-in attempts to slow down password-guessing attacks.',
        'detail': 'These two features solve different problems: banned password lists stop weak or predictable passwords from ever being set, while smart lockout responds to repeated failed guesses against whatever password is already set.',
    },
    {
        'id': 'f55',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access session controls: sign-in frequency and persistent browser session',
        'back': 'Sign-in frequency forces reauthentication after a defined time interval instead of letting a token ride out its full lifetime, and the persistent browser session control, when disabled, ends the session the moment the browser is closed -- both apply after a sign-in has already been granted, unlike a grant control such as requiring MFA.',
        'detail': 'Disabling persistent browser sessions on unmanaged devices is a common way to make sure closing the browser actually signs the user out, rather than relying solely on the sign-in frequency window to eventually expire.',
    },
    {
        'id': 'f56',
        'cat': 'workloadIdentities',
        'front': 'Supported account types for app registrations',
        'back': "An app registration's supported account types setting controls who is allowed to sign in to it: single-tenant (only this organization), multi-tenant (any Microsoft Entra organization), multi-tenant plus personal Microsoft accounts, or personal Microsoft accounts only -- distinct from API permissions, which govern what the app can do once someone has signed in.",
        'detail': "A consumer-facing app that wants to accept sign-ins from any organization's Entra tenant as well as personal Outlook.com or Xbox accounts needs the multi-tenant plus personal Microsoft accounts option, not single-tenant.",
    },
    {
        'id': 'f57',
        'cat': 'workloadIdentities',
        'front': 'Automatic user provisioning (SCIM) for enterprise applications',
        'back': "Automatic user provisioning uses the SCIM protocol to automatically create, update, and deprovision a user's account in a SaaS application based on Microsoft Entra ID group membership or attributes, instead of an administrator manually creating and removing accounts in that app one at a time.",
        'detail': "Removing a user from the scoped group can automatically deprovision (disable or delete) their account in the target SaaS app, extending the same joiner/mover/leaver automation idea that lifecycle workflows apply inside Entra ID itself out to a downstream application.",
    },
    {
        'id': 'f58',
        'cat': 'workloadIdentities',
        'front': 'Publisher verification and risk-based step-up consent',
        'back': "Publisher verification confirms an app registration's publisher identity has been validated by Microsoft, shown as a verified badge during consent, while risk-based step-up consent automatically requires admin consent for a request that Microsoft Entra ID judges unusually risky, even if user consent would ordinarily be allowed for that permission.",
        'detail': "A user consent request from an unverified publisher asking for high-risk permissions is exactly the combination risk-based step-up consent is designed to intercept and escalate to an administrator rather than letting the user approve it alone.",
    },
    {
        'id': 'f59',
        'cat': 'workloadIdentities',
        'front': 'App roles',
        'back': "App roles are custom roles an application developer defines (such as Reader or Approver) and assigns to users or groups on the enterprise application, letting the app receive that role in the user's token and enforce its own fine-grained authorization -- distinct from a delegated or application API permission, which governs what the app itself can do against Microsoft Graph or another API.",
        'detail': "An API permission (delegated or application) decides whether an app can act as itself or on behalf of a user against an external API; an app role instead decides what a specific signed-in user or group is authorized to do inside that one application.",
    },
    {
        'id': 'f60',
        'cat': 'identityGovernance',
        'front': 'Segregation of duties (SoD) checks',
        'back': "A segregation of duties check in entitlement management designates two access packages (or incompatible groups) as mutually exclusive, automatically blocking a user's request for one if they already hold the other, enforcing a fraud-prevention control like never letting the same person both approve and process a payment.",
        'detail': 'This is a preventive control enforced at request time, unlike an access review, which only reassesses access that has already been granted.',
    },
    {
        'id': 'f61',
        'cat': 'identityGovernance',
        'front': 'Entitlement management catalogs',
        'back': "A catalog is a container that groups related resources (groups, Teams, SharePoint sites, applications) together in entitlement management so a delegated catalog owner -- who need not be a full administrator -- can create and manage access packages built only from that catalog's resources.",
        'detail': "Organizing resources into a catalog first is what lets a business-unit owner build and publish their own access packages without needing directory-wide administrative rights.",
    },
    {
        'id': 'f62',
        'cat': 'identityGovernance',
        'front': 'PIM alerts',
        'back': 'Privileged Identity Management surfaces built-in alerts that flag risky configurations, such as too many users holding a permanent Global Administrator assignment, roles being activated too frequently, or duplicate role assignments, so an administrator can proactively investigate rather than only reacting after an incident.',
        'detail': 'These alerts complement PIM audit history, which is a searchable log of every activation, assignment change, and approval decision for after-the-fact investigation.',
    },
    # -----------------------------------------------------------------
    # Third content pass: flashcards f63-f77, targeting gaps found by
    # re-reading the full FLASHCARDS/QUESTIONS/LESSONS lists plus the
    # official SC-300 skills-measured objectives, avoiding anything the
    # first two passes already covered (restricted management
    # administrative units, group-based licensing, B2B direct
    # federation with a non-Entra SAML/WS-Fed IdP, Conditional Access
    # authentication context, custom authentication extensions,
    # certificate-based authentication, application management
    # policies, Kerberos Constrained Delegation and connector groups
    # for Application Proxy, app registration owners, workload identity
    # risk detection, PIM discovery and insights, multi-stage access
    # package approval, access review recommendations, and access
    # package requestor scope).
    # -----------------------------------------------------------------
    {
        'id': 'f63',
        'cat': 'userIdentities',
        'front': 'Restricted management administrative units',
        'back': "A restricted management administrative unit protects its member objects from being modified (for example, having a password reset or being deleted) by any administrator who is not explicitly assigned a role scoped to that same unit, even a tenant-wide administrator -- unlike a standard administrative unit, which only narrows where a scoped role can act and does not stop tenant-wide roles from managing the same objects.",
        'detail': "This is commonly used to shield emergency access accounts or an executive's own account from routine helpdesk changes -- a tenant-wide administrator who is not assigned a role at the unit's scope cannot modify its members, whether through the portal or Microsoft Graph.",
    },
    {
        'id': 'f64',
        'cat': 'userIdentities',
        'front': 'Group-based licensing',
        'back': "Group-based licensing assigns one or more Microsoft 365 or Entra ID licenses to every member of a group automatically, adding or removing a user's license the moment their group membership changes, instead of an administrator assigning and removing licenses one user at a time. The group can be an ordinary assigned-membership group or a dynamic group whose membership follows a rule.",
        'detail': "A license assigned directly to a user and the same license also inherited from a group both stay in effect until every assigning source is removed -- removing the user from the group alone does not remove a license that was also assigned to them directly.",
    },
    {
        'id': 'f65',
        'cat': 'userIdentities',
        'front': 'Direct federation for B2B guest sign-in',
        'back': "Direct federation configures a trust with a partner's own SAML or WS-Fed identity provider so its users can sign in as B2B guests using their existing organizational credentials, covering partner organizations that have no Microsoft Entra ID or Google Workspace identity at all -- unlike standard B2B collaboration with an Entra tenant, which trusts the partner's own Entra ID directly with no separate federation setup.",
        'detail': "This is the right choice when a partner organization's identity provider is Okta, Ping, or another SAML/WS-Fed system rather than Microsoft Entra ID or Google, which are instead trusted natively with no federation trust to configure at all. It has nothing to do with Azure AD B2C, which serves an organization's own consumer-facing apps rather than a partner's workforce.",
    },
    {
        'id': 'f66',
        'cat': 'authAccessMgmt',
        'front': 'Conditional Access authentication context',
        'back': "An authentication context is a tag that can be applied to a specific sensitive action or resource (such as a SharePoint document with a particular sensitivity label, or one action inside a line-of-business app) so a Conditional Access policy can require extra verification, like step-up MFA, only at that specific point of access -- instead of a policy's ordinary cloud apps assignment applying the same requirement to the entire application.",
        'detail': "A document library where only files labeled Highly Confidential trigger step-up MFA, while every other document on the same SharePoint site requires only ordinary sign-in, is the kind of scenario authentication context is built for.",
    },
    {
        'id': 'f67',
        'cat': 'authAccessMgmt',
        'front': 'Custom authentication extensions',
        'back': "A custom authentication extension calls an external REST API, typically hosted as an Azure Function, at a defined point in the sign-in or token-issuance process -- such as just before a token is issued -- letting an organization add custom claims from an external system to the token, beyond what Entra ID's own built-in attributes can supply. Other supported events cover attribute collection during sign-up and custom delivery of one-time passcodes.",
        'detail': "A common use is calling an external HR system during token issuance to add a custom claim, like an employee's cost center, into the token, using a value that system tracks but Entra ID itself has no attribute for.",
    },
    {
        'id': 'f68',
        'cat': 'authAccessMgmt',
        'front': 'Certificate-based authentication (CBA)',
        'back': "Certificate-based authentication lets a user sign in directly with an X.509 client certificate, issued from an enterprise PKI and typically stored on a smart card or similar hardware, instead of a password -- satisfying both primary sign-in and a Conditional Access authentication strength that requires phishing-resistant MFA in one single step (when configured as multifactor), once the issuing certificate authority is configured as trusted in the tenant.",
        'detail': "Configuring CBA requires uploading the issuing certificate authority's root and intermediate certificates and mapping a certificate attribute, such as the user principal name, to the matching Microsoft Entra ID user object.",
    },
    {
        'id': 'f69',
        'cat': 'workloadIdentities',
        'front': 'Application management policies',
        'back': "An application management policy restricts, tenant-wide or for specific apps, the maximum lifetime allowed for a newly added app registration client secret or certificate, blocking the creation of a new credential that exceeds that limit rather than relying on individual developers to self-police secret lifetimes.",
        'detail': "This only constrains new credentials created going forward -- a secret that already exists and already exceeds the new limit is not immediately revoked just by enabling the policy. Where workload identity federation can be adopted instead, it removes the need for any such secret at all.",
    },
    {
        'id': 'f70',
        'cat': 'workloadIdentities',
        'front': 'Kerberos Constrained Delegation for Application Proxy',
        'back': "Kerberos Constrained Delegation (KCD) lets a Microsoft Entra application proxy connector sign a user into an on-premises application that relies on Windows-integrated (Kerberos) authentication, impersonating that user toward the backend app so they get true single sign-on instead of being prompted a second time by the app's own Windows authentication.",
        'detail': "Without KCD configured, a user who successfully signs in through Application Proxy can still hit a second, separate Windows-integrated sign-in prompt from the backend app itself, defeating the single sign-on experience Application Proxy is meant to provide for that kind of legacy app.",
    },
    {
        'id': 'f71',
        'cat': 'workloadIdentities',
        'front': 'Application Proxy connector groups',
        'back': "A connector group is a named set of one or more Microsoft Entra application proxy connectors that a published app is explicitly assigned to, letting an organization route a specific app's traffic through connectors in its own nearest region or dedicated to its own workload, instead of every published app sharing one single, undifferentiated pool of connectors.",
        'detail': "Placing multiple connectors in the same group is also how high availability is achieved per app -- one connector in the group going offline does not take that app down, while a different app assigned to a different connector group fails over entirely independently.",
    },
    {
        'id': 'f72',
        'cat': 'workloadIdentities',
        'front': 'Application registration owners',
        'back': "An app registration (or enterprise application) owner is a specific user granted the ability to manage that one application's configuration -- credentials, permissions, branding -- without being granted a tenant-wide role like Application Administrator or Cloud Application Administrator. Ownership is a separate concept from the distinction between an app registration and its enterprise application.",
        'detail': "This lets a development team manage its own app's secrets and redirect URIs day to day while a directory-wide administrative role stays reserved for broader, tenant-level application governance.",
    },
    {
        'id': 'f73',
        'cat': 'workloadIdentities',
        'front': 'Workload identity risk detection',
        'back': "Microsoft Entra ID Protection extends risk detection to service principals and other workload identities, surfacing signals like credentials leaked in a public code repository or sign-ins from anomalous locations, with a Conditional Access policy for workload identities able to block a risky service principal, much as risk-based Conditional Access policies do for human user accounts.",
        'detail': "This closes a real gap distinct from Conditional Access for workload identities, which only evaluates conditions like a fixed IP range: a compromised service principal has no password or MFA prompt to protect it the way a human user does, so dedicated risk detection built for workload identities is what catches a leaked secret being used from an unexpected location.",
    },
    {
        'id': 'f74',
        'cat': 'identityGovernance',
        'front': 'PIM discovery and insights',
        'back': "PIM discovery and insights scans a tenant for Microsoft Entra directory role assignments that are already permanent and active, outside of Privileged Identity Management entirely, and lets an administrator convert those existing standing assignments directly into PIM eligible (or time-bound active) assignments from the findings, instead of hunting for them manually first.",
        'detail': "This specifically targets the common real-world problem of a tenant adopting PIM years after go-live, by then full of permanent Global Administrator and other privileged assignments nobody ever circled back to convert.",
    },
    {
        'id': 'f75',
        'cat': 'identityGovernance',
        'front': 'Multi-stage approval for access packages',
        'back': "An access package's request policy can require approval from more than one approver in sequence -- for example a resource owner's approval followed by a second, independent approver's sign-off -- rather than a single approval step being sufficient to grant the request.",
        'detail': "Each stage can have its own designated approvers and its own response deadline, and a request rejected at an earlier stage never reaches a later stage at all.",
    },
    {
        'id': 'f76',
        'cat': 'identityGovernance',
        'front': 'Access review recommendations',
        'back': "During an access review, Microsoft Entra ID can generate a recommendation for each reviewer decision based on the user's actual recent sign-in activity and usage of the resource under review, suggesting Approve or Deny to speed up the reviewer's decision rather than leaving every single decision to the reviewer's own judgment alone.",
        'detail': "A reviewer is not forced to follow the recommendation, but it meaningfully reduces review fatigue on a large access review by giving reviewers a defensible, data-driven default for users they do not personally know.",
    },
    {
        'id': 'f77',
        'cat': 'identityGovernance',
        'front': 'Access package request policy requestor scope',
        'back': "An access package's request policy specifies exactly who is allowed to request it -- for example all users in your own directory, all users from one specific connected organization, specific named users or groups, or all users from every connected organization -- and a package can have several separate policies, each with its own requestor scope and approval settings.",
        'detail': "Scoping one policy narrowly to a single named connected organization's users, rather than to all connected organizations, is how an access package avoids becoming requestable by every partner an organization has ever connected rather than just the one it is actually intended for.",
    },
    {
        'id': "f78",
        'cat': "userIdentities",
        'front': "Microsoft Entra B2B direct connect",
        'back': "B2B direct connect is a mutual trust between two Microsoft Entra organizations that lets users sign in with their home credentials and use shared channels in Microsoft Teams. No guest account is created in either directory, and both sides must enable it in their cross-tenant access settings.",
        'detail': "Exam angle: if the scenario needs guests to appear in people pickers, or needs access beyond Teams shared channels, B2B direct connect is wrong and B2B collaboration is right.",
    },
    {
        'id': "f79",
        'cat': "userIdentities",
        'front': "Role-assignable groups",
        'back': "A role-assignable group is a Microsoft Entra security or Microsoft 365 group created with the isAssignableToRole property set to true, so a directory role can be assigned to the group instead of to each person. Its membership must be assigned, not dynamic, and only privileged admins and group owners can change it.",
        'detail': "The property cannot be changed after creation, and a tenant can hold at most 500 such groups. Protecting the group's membership this way stops a helpdesk admin from adding themselves to a privileged role.",
    },
    {
        'id': "f80",
        'cat': "userIdentities",
        'front': "Microsoft Entra Connect Health",
        'back': "Microsoft Entra Connect Health monitors the on-premises parts of a hybrid identity setup, such as Microsoft Entra Connect Sync, AD FS and Active Directory domain controllers, through agents that report health, performance and sync errors to the Microsoft Entra admin center.",
        'detail': "Use it when a question asks how to be alerted that synchronization has stopped or that AD FS is failing. It needs Microsoft Entra ID P1 and an installed agent on each monitored server.",
    },
    {
        'id': "f81",
        'cat': "userIdentities",
        'front': "Source anchor (ms-DS-ConsistencyGuid)",
        'back': "The source anchor is the on-premises attribute that uniquely ties a synchronized object to its cloud object. Microsoft Entra Connect uses ms-DS-ConsistencyGuid by default and stores it in the cloud as the immutable ID, which should never change for the life of the object.",
        'detail': "Changing it breaks the link and can leave a duplicate or orphaned cloud user. Hard match uses this value, while soft match instead compares attributes such as UPN or proxy address.",
    },
    {
        'id': "f82",
        'cat': "userIdentities",
        'front': "Staged Rollout for cloud authentication",
        'back': "Staged Rollout lets you move selected groups of users from federation, such as AD FS, to cloud authentication with password hash sync or pass-through authentication, while everyone else keeps using federation. You enable it for security groups and can grow the groups over time.",
        'detail': "It is the low-risk way to pilot cloud authentication before converting the whole domain from federated to managed. Roll back by removing the group from the feature.",
    },
    {
        'id': "f83",
        'cat': "userIdentities",
        'front': "Global Administrator role",
        'back': "Global Administrator has full access to every Microsoft Entra admin feature and to most Microsoft 365 services, and can assign any role to anyone. It is the most powerful directory role, so it should be held by very few accounts.",
        'detail': "Microsoft recommends fewer than five Global Administrators, activated just in time through PIM, with break-glass accounts kept separate. Give daily admins a narrower role instead.",
    },
    {
        'id': "f84",
        'cat': "userIdentities",
        'front': "Privileged Role Administrator",
        'back': "Privileged Role Administrator can manage role assignments in Microsoft Entra ID and all aspects of Privileged Identity Management. It can also create role-assignable groups and manage their membership, which makes it a role to protect closely.",
        'detail': "Because this role can grant other roles, treat it like Global Administrator: make it eligible in PIM, require MFA and approval, and keep the number of holders small.",
    },
    {
        'id': "f85",
        'cat': "userIdentities",
        'front': "Helpdesk Administrator vs Authentication Administrator",
        'back': "Helpdesk Administrator can reset passwords for non-administrators and other Helpdesk Administrators. Authentication Administrator can view, set and reset authentication methods, including requiring re-registration of MFA, for non-administrators. Privileged Authentication Administrator does this for any user, including admins.",
        'detail': "Pair either role with an administrative unit to limit it to a region or department. Choose Authentication Administrator when the task is resetting MFA methods rather than just a password.",
    },
    {
        'id': "f86",
        'cat': "userIdentities",
        'front': "Group expiration policy for Microsoft 365 groups",
        'back': "A group expiration policy sets a lifetime for Microsoft 365 groups. Owners get renewal notices before the end date, and a group nobody renews is soft-deleted, so it can be restored for 30 days. It applies to Microsoft 365 groups, not security groups.",
        'detail': "Use it to clean up abandoned Teams and groups automatically. Group activity, such as Teams and SharePoint use, can renew a group without the owner doing anything.",
    },
    {
        'id': "f87",
        'cat': "authAccessMgmt",
        'front': "Continuous access evaluation (CAE)",
        'back': "Continuous access evaluation lets supporting services such as Exchange Online, SharePoint Online and Teams react to critical events, like a disabled account, a password reset, revoked tokens or high user risk, in near real time instead of waiting for the access token to expire. It also enforces IP location policy instantly.",
        'detail': "CAE-aware tokens can last up to 28 hours because the service can cut access mid-session. Exam angle: it is how a fired employee loses access right away, even with a valid token.",
    },
    {
        'id': "f88",
        'cat': "authAccessMgmt",
        'front': "Token protection (Conditional Access session control)",
        'back': "Token protection is a Conditional Access session control that binds sign-in tokens to the device they were issued to, so a stolen token cannot be replayed from another machine. It currently covers supported desktop apps on Windows, such as Exchange Online and SharePoint Online.",
        'detail': "It targets token theft and replay, which MFA alone does not stop. Scope it carefully, because apps that do not support token binding are blocked once the policy applies.",
    },
    {
        'id': "f89",
        'cat': "authAccessMgmt",
        'front': "Primary refresh token (PRT)",
        'back': "A primary refresh token is a long-lived token issued to a Microsoft Entra joined, hybrid joined or registered Windows device after a user signs in. It enables single sign-on to apps and is bound to the device, protected by the TPM when one is present.",
        'detail': "Token protection builds on the PRT: it requires apps to use device-bound tokens. Malware that extracts an unbound refresh token can replay it, which is the attack being addressed.",
    },
    {
        'id': "f90",
        'cat': "authAccessMgmt",
        'front': "Number matching in Microsoft Authenticator",
        'back': "Number matching makes the Microsoft Authenticator app show a number on the sign-in screen that the user must type into the approval prompt, instead of just tapping Approve. It reduces blind approvals during MFA fatigue attacks.",
        'detail': "It does not make push MFA phishing-resistant, because a proxy page can still show the number to a victim. Phishing-resistant methods such as FIDO2 keys or Windows Hello for Business are the stronger answer.",
    },
    {
        'id': "f91",
        'cat': "authAccessMgmt",
        'front': "Registration campaign (authentication methods)",
        'back': "A registration campaign, set in the authentication methods policy, prompts users who have just signed in with MFA to register a stronger method, such as Microsoft Authenticator or a passkey. Users can be allowed to snooze the prompt and are nudged again later.",
        'detail': "It nudges users who can already sign in, so it cannot help someone with no first sign-in method. It replaces the older SSPR registration reminder setting that was retired.",
    },
    {
        'id': "f92",
        'cat': "authAccessMgmt",
        'front': "Legacy authentication and how to block it",
        'back': "Legacy authentication covers older protocols such as POP, IMAP, SMTP AUTH and basic authentication from old Office clients. They cannot perform MFA, so attackers use them for password spray. A Conditional Access policy that targets legacy clients and blocks access shuts them off.",
        'detail': "Security defaults and the Block legacy authentication template both block it. Check sign-in logs for legacy client usage first, so a needed mail app or scanner is not broken.",
    },
    {
        'id': "f93",
        'cat': "authAccessMgmt",
        'front': "Microsoft Entra sign-in logs and audit logs",
        'back': "Sign-in logs record who signed in to what, from where, and whether Conditional Access and MFA applied, including non-interactive, service principal and managed identity sign-ins. Audit logs record changes to the directory, such as role assignments, user and group edits and app consent.",
        'detail': "Use sign-in logs to troubleshoot a blocked sign-in or test report-only policies, and audit logs to find who changed a role or consent grant. Retention is limited, so export long-term copies.",
    },
    {
        'id': "f94",
        'cat': "authAccessMgmt",
        'front': "Diagnostic settings for Microsoft Entra logs",
        'back': "Diagnostic settings export Microsoft Entra sign-in and audit logs to a Log Analytics workspace, a storage account, an event hub or a partner solution. That gives long retention, KQL queries, workbooks and alerts beyond what the portal keeps.",
        'detail': "Send to Log Analytics for queries and workbooks, to a storage account for cheap archive, and to an event hub to feed an external SIEM. Microsoft Sentinel connects to the same logs.",
    },
    {
        'id': "f95",
        'cat': "authAccessMgmt",
        'front': "Risky users and risk detections (ID Protection reports)",
        'back': "Microsoft Entra ID Protection lists risky users, risky sign-ins and individual risk detections. An admin can confirm a user compromised, dismiss the risk, reset the password or block the user, and the risk state changes to match.",
        'detail': "Confirming a user compromised raises that user's risk to high, which can trigger a user risk policy. Risk clears automatically after a secure password change by the user, where self-service reset is registered.",
    },
    {
        'id': "f96",
        'cat': "authAccessMgmt",
        'front': "Conditional Access session control: Conditional Access App Control",
        'back': "Conditional Access App Control routes a sign-in session through Microsoft Defender for Cloud Apps acting as a reverse proxy. That lets admins monitor the session and block downloads, copy, or print, using session policies, for example on unmanaged devices.",
        'detail': "In the Conditional Access policy choose the session control Use Conditional Access App Control, then build the matching session policy in Defender for Cloud Apps.",
    },
    {
        'id': "f97",
        'cat': "workloadIdentities",
        'front': "OAuth 2.0 client credentials flow",
        'back': "In the client credentials flow, an app signs in as itself, with no user, using a secret, certificate or federated credential, and receives an access token carrying application permissions. It is the standard flow for daemons, background services and scripts.",
        'detail': "The app needs application permissions that an admin has consented to, such as Calendars.Read. A developer who is not an admin cannot grant them, which is a common exam trap.",
    },
    {
        'id': "f98",
        'cat': "workloadIdentities",
        'front': "Access tokens, ID tokens, and refresh tokens",
        'back': "An access token authorizes calls to an API, an ID token tells the app who signed in, and a refresh token lets the app quietly get new tokens without asking the user again. Access and ID tokens are short-lived, and refresh tokens last longer.",
        'detail': "Remember the audience: access tokens are for the API, ID tokens are for the client app. Revoking sessions invalidates refresh tokens so new access tokens cannot be issued.",
    },
    {
        'id': "f99",
        'cat': "workloadIdentities",
        'front': "Redirect URI (reply URL)",
        'back': "A redirect URI is the address where Microsoft Entra ID sends the user, with the token or authorization code, after sign-in. The URI the app sends must exactly match one registered on the app registration, or the sign-in fails.",
        'detail': "A mismatch error at sign-in usually means a missing or misspelled redirect URI, including a trailing slash difference. Register separate URIs for web, single-page and mobile platforms.",
    },
    {
        'id': "f100",
        'cat': "workloadIdentities",
        'front': "Application ID URI and exposed API scopes",
        'back': "When you expose an API, the app registration gets an Application ID URI, by default api:// followed by the client ID, which identifies the API as a token audience. You then define scopes that client apps can request as delegated permissions.",
        'detail': "A client requests a scope such as api://app-id/Files.Read. Exposing scopes is what lets one app registration call another with its own permissions.",
    },
    {
        'id': "f101",
        'cat': "workloadIdentities",
        'front': "Optional claims and group claims",
        'back': "Optional claims add extra information to tokens for an app, configured under token configuration. Group claims add the user's group memberships, as group object IDs, to ID, access or SAML tokens, and can be limited to groups assigned to the app.",
        'detail': "If a user belongs to too many groups, more than 200 for a JWT, the token carries an overage link instead of the list. Limit the claim to assigned groups to avoid that.",
    },
    {
        'id': "f102",
        'cat': "workloadIdentities",
        'front': "Claims mapping policy",
        'back': "A claims mapping policy, assigned to a service principal, changes which claims appear in tokens for an app, for example renaming a claim or sourcing its value from a different directory attribute. It can only reshape data that already exists in the directory.",
        'detail': "It is the answer when an app expects a specific claim name or attribute. If the data does not exist in the directory, it cannot be created by mapping and must be added to the user first.",
    },
    {
        'id': "f103",
        'cat': "workloadIdentities",
        'front': "Assignment required for enterprise applications",
        'back': "The Assignment required setting on an enterprise application decides whether only users and groups assigned to the app can sign in and see it in My Apps. When it is off, any user in the tenant can obtain a token for the app.",
        'detail': "It limits which tenant users can get a token, but it does not change which directories can sign in. That is controlled by the app's supported account types.",
    },
    {
        'id': "f104",
        'cat': "workloadIdentities",
        'front': "Application manifest",
        'back': "The application manifest is the JSON definition of an app registration. Editing it directly lets you set properties the portal does not show easily, such as app roles, groupMembershipClaims, the requested access token version and exposed permission scopes.",
        'detail': "Typical use: add app roles or enable group claims by editing the manifest. A syntax error blocks the save, so change one property at a time.",
    },
    {
        'id': "f105",
        'cat': "workloadIdentities",
        'front': "Microsoft Authentication Library (MSAL)",
        'back': "MSAL is the set of Microsoft libraries that apps use to sign users in and get tokens from the Microsoft identity platform. It handles token caching, silent renewal with refresh tokens and the protocol details for you.",
        'detail': "It replaces the older ADAL library, which is out of support. Exam angle: new apps should use MSAL rather than hand-built OAuth requests.",
    },
    {
        'id': "f106",
        'cat': "identityGovernance",
        'front': "PIM for Azure resources",
        'back': "Privileged Identity Management can also control Azure resource roles, such as Owner, Contributor and User Access Administrator, at management group, subscription, resource group or resource scope. Users get eligible, time-bound assignments and activate them with MFA, justification or approval.",
        'detail': "This is separate from PIM for Microsoft Entra directory roles. If a question is about someone needing Owner on a subscription temporarily, choose an eligible Azure resource role assignment.",
    },
    {
        'id': "f107",
        'cat': "identityGovernance",
        'front': "Automatic assignment policies for access packages",
        'back': "An automatic assignment policy gives an access package to users who match a membership rule, using the same kind of attribute rules as a dynamic group, and removes it when they stop matching. No request or approval is needed.",
        'detail': "Example: everyone whose department equals Research gets the Research access package, and loses it on transfer. Use it for birthright access, not for access that needs approval.",
    },
    {
        'id': "f108",
        'cat': "identityGovernance",
        'front': "Custom extensions in entitlement management",
        'back': "Custom extensions let entitlement management call an Azure Logic App at set stages of an access package, such as when a request is created or approved, when access is granted or removed, and 14 days or 1 day before an assignment expires.",
        'detail': "Use them to add steps the product lacks, such as opening a ticket, notifying a team or provisioning into a non-Entra system. Launch and continue does not wait for the Logic App, while launch and wait does.",
    },
    {
        'id': "f109",
        'cat': "identityGovernance",
        'front': "External user lifecycle in entitlement management",
        'back': "Entitlement management can govern what happens to a guest invited through an access package after losing their last package assignment. By default the guest is blocked from signing in and, after 30 days, their guest account is removed from the directory.",
        'detail': "The block-and-remove settings are set under entitlement management settings. Avoid blocking sign-in if the guest will later request other packages, because a blocked guest cannot request access.",
    },
    {
        'id': "f110",
        'cat': "identityGovernance",
        'front': "Access reviews of inactive users",
        'back': "An access review of a group can be scoped to inactive users, meaning those who have not signed in, interactively or non-interactively, for a chosen number of days, up to 730. Reviewers then confirm whether each inactive member still needs access.",
        'detail': "It focuses reviewer effort on the accounts most likely to be stale. It is especially useful for guest access, where unused accounts tend to accumulate.",
    },
    {
        'id': "f111",
        'cat': "identityGovernance",
        'front': "Access review auto-apply and default decisions",
        'back': "An access review can automatically apply its results when it ends, and can use a default decision, such as Deny or the recommendation, for reviewers who do not respond. Without auto-apply, an admin must apply the decisions manually.",
        'detail': "If auto-apply is on and the default decision is Deny, silent reviewers cause access to be removed. Test the settings on a low-risk group first.",
    },
    {
        'id': "f112",
        'cat': "identityGovernance",
        'front': "Just-in-time (JIT) access",
        'back': "Just-in-time access gives a user a privilege only when needed and only for a limited time, instead of leaving it permanently assigned. In Microsoft Entra, Privileged Identity Management provides it through eligible assignments that must be activated.",
        'detail': "JIT shrinks the window an attacker can use a stolen admin account. An eligible role that expires after activation is the textbook example.",
    },
    {
        'id': "f113",
        'cat': "identityGovernance",
        'front': "Access package assignment expiration and extension",
        'back': "An access package policy can set how long an assignment lasts, as a fixed date, a number of days or hours, or never. It can also allow users to request an extension, optionally with approval, and users get reminders before access ends.",
        'detail': "Setting an expiry is what makes access end automatically, for example after 90 days unless the user requests an extension that an approver grants.",
    },
]

QUESTIONS = [
    {
        'id': 'q1',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': "Contoso has helpdesk teams in Seattle, London, and Tokyo. Each team must reset passwords only for users in its own office and must hold no rights over the other offices' users. The design must follow least privilege with minimal ongoing effort. What should you do?",
        'options': [
            'Create a custom directory role containing only the password-reset permission and assign it tenant-wide to every helpdesk team',
            "Place each office's users in a security group and assign Helpdesk Administrator to that group",
            'Create an administrative unit for each region and assign Helpdesk Administrator to each team scoped to its own unit',
            'Assign Helpdesk Administrator tenant-wide to each team as a PIM eligible assignment that requires approval',
        ],
        'correct': 2,
        'explanation': "Administrative units are the only option here that limits where a role applies, so each team can reset passwords only for the users in its own unit. A custom role with only password reset narrows what the role can do, but it still applies to the whole tenant. A PIM eligible assignment narrows when the role is usable, not which users it reaches. Assigning the role to a group of an office's users hands the role to those users, tenant-wide, and does nothing to scope the helpdesk staff.",
    },
    {
        'id': 'q2',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Contoso uses a group for license assignment that must contain every employee, but no guests, whose department attribute is Sales. Membership must stay current as people join, move, or leave, with no administrator action. Some guest accounts also have department set to Sales. Which approach meets the requirements?',
        'options': [
            'An assigned group, with a quarterly access review that removes guests from the group',
            'A dynamic user group whose rule matches users on the department attribute alone',
            'An assigned group, with a lifecycle workflow that adds new hires on their start dates',
            'A dynamic user group whose rule matches department Sales and also requires the user type Member',
        ],
        'correct': 3,
        'explanation': "A dynamic group evaluates its rule continuously, and adding the user type condition is what keeps Sales guests out. The rule on department alone would pull the Sales guests in. An assigned group with a quarterly access review needs people to be added by hand and only cleans up guests after the fact. An assigned group fed by a lifecycle workflow handles joiners on their start date but would not re-evaluate when someone's department changes.",
    },
    {
        'id': 'q3',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Contoso must validate cloud sign-ins against on-premises Active Directory at the moment of each sign-in, so disabled accounts and logon-hour restrictions take effect immediately. No password hash may be stored in Microsoft Entra ID, and the team will not build federation servers. Which sign-in method should you configure?',
        'options': [
            'Federation with AD FS, with Web Application Proxy servers in the perimeter',
            'Password Hash Sync, together with Seamless single sign-on',
            'Pass-through Authentication, with agents installed on two or more servers',
            'Cloud Sync, with password writeback enabled in the tenant',
        ],
        'correct': 2,
        'explanation': 'Pass-through Authentication checks each password against Active Directory in real time through lightweight agents, so account state and logon hours apply at sign-in, and it stores no hash in the cloud. Password Hash Sync stores a derived hash and validates in the cloud, so it breaks the no-hash rule and does not apply on-premises restrictions at the moment of sign-in. Federation also validates on-premises but requires the server farm the team refuses to build. Cloud Sync is a synchronization engine and password writeback only pushes cloud resets down to Active Directory, so neither validates a sign-in.',
    },
    {
        'id': 'q4',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Contoso and two acquired companies each run their own Active Directory forest, and the forests cannot reach each other over the network. All identities must sync to one Microsoft Entra tenant with agent-level redundancy and minimal administration, and no custom attribute-flow rules are needed. What should you deploy?',
        'options': [
            'Microsoft Entra Cloud Sync, with provisioning agents installed in each forest',
            'AD FS in each forest, with users created directly in the tenant',
            'Microsoft Entra Connect Sync with a second server in staging mode for failover',
            'One Microsoft Entra Connect Sync server in the Contoso forest, with the other forests added as connected directories',
        ],
        'correct': 0,
        'explanation': 'Cloud Sync agents only need outbound access from their own forest, so disconnected forests can all feed one tenant, and several agents per forest provide redundancy. A single Connect Sync server must be able to reach every forest it synchronizes, which the stem rules out. A staging-mode Connect Sync server is a manual failover copy with the same connectivity requirement, not agent-level redundancy. AD FS handles authentication redirection and creates no synchronized identities.',
    },
    {
        'id': 'q5',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Fabrikam is an independent partner with its own Microsoft Entra tenant. Fabrikam employees must open documents on a Contoso SharePoint site. Contoso must not manage their passwords, and must be able to apply its own Conditional Access policies and access reviews to those users. What should Contoso use?',
        'options': [
            'B2B collaboration, inviting Fabrikam employees as guest users',
            'Cross-tenant synchronization configured from the Fabrikam tenant into Contoso',
            "Direct federation with a SAML trust to Fabrikam's tenant",
            'B2B direct connect configured with mutual trust to the Fabrikam tenant',
        ],
        'correct': 0,
        'explanation': "B2B collaboration creates a guest object in Contoso's directory while authentication stays with Fabrikam, so Contoso can target those guests with Conditional Access, access reviews, and SharePoint permissions. B2B direct connect creates no directory object and is limited to Teams shared channels, so it cannot give SharePoint access or be reviewed. Cross-tenant synchronization is built for tenants belonging to one organization and needs Fabrikam's administrators to configure outbound sync. Direct federation is only for partners whose identity provider is not Microsoft Entra ID.",
    },
    {
        'id': 'q6',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'HR provides a spreadsheet of 200 new employees who need member accounts in the contoso.com domain, each with an initial password. The administrator wants to avoid creating accounts one at a time in the portal. What should the administrator do?',
        'options': [
            "Download the bulk invite template and upload it with the employees' email addresses",
            'Import the spreadsheet into Microsoft Entra Cloud Sync as the source of the new accounts',
            "Create a lifecycle workflow that creates the accounts on the employees' start dates",
            'Download the bulk create template, fill in the required columns, and upload it',
        ],
        'correct': 3,
        'explanation': 'Bulk create uses a Microsoft-provided template with the required columns, such as user principal name and initial password, to create member accounts in your own domain in one pass. Bulk invite produces guest users who receive invitation emails rather than member accounts with passwords. Cloud Sync synchronizes objects from Active Directory and does not import spreadsheets. Lifecycle workflows run tasks against user objects that already exist, such as enabling an account or adding it to groups, and do not create accounts.',
    },
    {
        'id': 'q7',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': "An automation mistake deleted two cloud-only user accounts: Dana's 12 days ago and Raj's 41 days ago. Both people need their access back. What should the administrator do?",
        'options': [
            'Restore Dana, and open a Microsoft support case asking for Raj to be recovered from backup',
            'Restore both users from the deleted users list',
            'Restore Dana from the deleted users list and create a new account for Raj',
            "Extend the tenant's soft-delete retention period to 60 days, then restore both users",
        ],
        'correct': 2,
        'explanation': 'A deleted user is recoverable for 30 days, so Dana can be restored with her properties, while Raj is past the window and has been permanently purged, which means a new account and fresh group and license assignments. Restoring both fails for Raj because his object no longer appears in the deleted list. The 30-day retention is not a tenant setting that can be extended after the fact. Support cannot bring back an object that has already been permanently deleted.',
    },
    {
        'id': 'q8',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'Policy 1 applies to the Finance group and a line-of-business app and requires a compliant device. Policy 2 applies to all users and all apps and requires MFA. A user who is not in Finance signs in to the line-of-business app from an unmanaged laptop and completes MFA. What is the result?',
        'options': [
            'Access is blocked, because being outside Policy 1 means no policy grants the user access',
            'Access is granted, because only Policy 2 applies and its requirement was met',
            'Access is blocked, because Policy 1 targets the app and the laptop is not compliant',
            'Access is granted only after a second MFA prompt, because both policies apply to the app',
        ],
        'correct': 1,
        'explanation': 'A policy evaluates only for sign-ins that match its assignments, so Policy 1 is out of scope for a user outside Finance even though it names the app. Policy 2 applies and its MFA requirement was satisfied, so access is granted. Treating Policy 1 as applicable confuses the app assignment with the user assignment. Conditional Access has no implicit deny for sign-ins that match no policy, so a non-match does not block anyone. A second MFA prompt would only come from a second policy that actually applied.',
    },
    {
        'id': 'q9',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'Attackers are using reverse-proxy sites that relay passwords, one-time codes, and push approvals to Microsoft Entra ID in real time. Contoso wants administrator sign-ins to fail on such sites. Which Conditional Access grant should be required for the administrator roles?',
        'options': [
            'A custom authentication strength limited to Authenticator push and hardware OATH tokens',
            'The classic Require multifactor authentication grant control',
            'The built-in Passwordless MFA authentication strength',
            'The built-in Phishing-resistant MFA authentication strength',
        ],
        'correct': 3,
        'explanation': 'The Phishing-resistant MFA strength accepts only origin-bound methods such as FIDO2 security keys, Windows Hello for Business, and certificate-based authentication, which will not produce a valid sign-in on a relay site. The Passwordless MFA strength is stronger than plain MFA but still includes Authenticator phone sign-in, where a relayed number can still be approved. The classic Require multifactor authentication control accepts any method that satisfies MFA, including relayable codes. A custom strength of push and OATH tokens is entirely relayable.',
        'whyTested': "SC-300 tests whether you can separate 'passwordless' from 'phishing-resistant' and choose the right built-in authentication strength. Passwordless removes the password, but only origin-bound methods defeat a proxy that relays everything the user types or approves.",
    },
    {
        'id': 'q10',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "Contoso's 40 executives sign in on corporate computers that have TPM chips. Their accounts were compromised through lookalike sign-in pages that relayed a password and a push approval. Security wants a method that resists this attack, with no new hardware purchases. Which method should the executives use?",
        'options': [
            'FIDO2 security keys issued to the executives',
            'Windows Hello for Business enrolled on their devices',
            'Hardware OATH tokens that generate time-based codes',
            'Microsoft Authenticator push with number matching',
        ],
        'correct': 1,
        'explanation': "Windows Hello for Business uses a key held in the laptop's TPM and bound to the real sign-in site, so a lookalike page cannot obtain a usable sign-in, and it needs no extra hardware. FIDO2 security keys resist the same attack but would require buying a key for every executive. Authenticator push with number matching reduces blind approvals, but a proxy page can still display the number to the victim. Hardware OATH tokens produce codes that can be typed into a lookalike page and relayed.",
    },
    {
        'id': 'q11',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'SSPR is enabled for all users, yet the help desk still handles many reset calls because most users never registered authentication information. Contoso wants users to be prompted to register the next time they sign in. Which setting should be changed?',
        'options': [
            'In the SSPR on-premises integration settings, turn on password writeback',
            'In the SSPR registration settings (the legacy "require users to register when signing in" setting), require users to register at sign-in',
            'In the SSPR settings, lower the number of methods required to reset a password to one',
            'In the authentication methods policy, enable the Temporary Access Pass method',
        ],
        'correct': 1,
        'explanation': 'Requiring registration at sign-in is the setting that makes users enter their reset methods the next time they authenticate. Note that this legacy SSPR setting was retired on September 30, 2025; the modern equivalent is a registration campaign in the authentication methods policy, but of the choices offered it is the only one that prompts for registration at sign-in. Lowering the number of required methods makes registration easier to satisfy but never prompts anyone to register. Password writeback is needed so a cloud reset reaches on-premises Active Directory, and it has no effect on whether users have registered. Enabling Temporary Access Pass gives administrators a bootstrap credential to issue, but it does not prompt users for SSPR registration.',
    },
    {
        'id': 'q12',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "A user risk policy requires a secure password change at High risk, and a sign-in risk policy requires MFA at Medium and above. Identity Protection finds a user's credentials in a leaked set, raising user risk to High. The user next signs in from a usual device and location. What happens?",
        'options': [
            'The user signs in normally, because the sign-in risk policy sees a low-risk sign-in',
            'The user is prompted for MFA only, because completing MFA resolves both risk types',
            'The user is blocked until an administrator dismisses the user risk',
            'The user must set a new password after MFA, because user risk still applies to this sign-in',
        ],
        'correct': 3,
        'explanation': 'User risk is tracked separately from sign-in risk, so the High user risk triggers the user risk policy at the next sign-in and the user must change their password, after completing MFA to prove who they are. Treating the low-risk sign-in as the deciding factor ignores the user risk policy entirely. MFA clears sign-in risk for that attempt but does not remediate the leaked credential. Nothing in the scenario configures a block, and an administrator dismissing the risk would leave the leaked password valid.',
    },
    {
        'id': 'q13',
        'cat': 'authAccessMgmt',
        'type': 'ms',
        'question': 'A user flagged High user risk for leaked credentials completes MFA during a sign-in that a sign-in risk policy challenged. An analyst wants to close the incident properly. Which two statements are true? (Choose two.)',
        'options': [
            'The completed MFA remediated the sign-in risk but left the user risk unchanged',
            'Self-remediation needs the user registered for SSPR, plus password writeback for a synced user',
            'Marking the user as confirmed compromised returns their risk level to Low',
            'Dismissing the user risk in the portal forces the user to change their password at the next sign-in',
        ],
        'correct': [0, 1],
        'explanation': "MFA proves a sign-in was genuine, which clears that sign-in's risk, but the leaked credential still exists, so user risk stays elevated until the password is changed or an administrator acts. Self-remediation through a secure password change depends on the user having registered for SSPR and, for a synced user, on password writeback so the new password reaches Active Directory. Dismissing user risk only clears the flag and forces nothing, leaving the leaked password valid. Confirming a user as compromised raises their risk to High rather than lowering it.",
        'whyTested': "This isolates the user-risk versus sign-in-risk distinction at the remediation step: MFA closes the door on one sign-in without touching the identity-level risk, and self-remediation has prerequisites that a candidate who only memorized 'password change fixes it' will miss.",
    },
    {
        'id': 'q14',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'Contoso wants FIDO2 security keys to be registrable only by members of the Security Operations group, and Temporary Access Pass only by the help desk group. Everyone else must not be able to register either method. Where should this be configured?',
        'options': [
            'In the legacy per-user MFA settings, choosing verification options for each user',
            'In the authentication methods policy, targeting each method at its group',
            'In a Conditional Access authentication strength that lists FIDO2 and Temporary Access Pass',
            'In the SSPR settings, choosing which methods each group may use to reset passwords',
        ],
        'correct': 1,
        'explanation': 'The authentication methods policy is where each method is enabled and scoped to specific groups, which controls who can register and use it. An authentication strength decides which method combinations satisfy a Conditional Access requirement at sign-in and does not govern who may register. The legacy per-user MFA settings are the older, per-user mechanism the policy replaces and cannot target a method at a group. SSPR settings control reset behavior, not tenant-wide method registration.',
    },
    {
        'id': 'q15',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "A new hire's cloud-only account has no registered authentication methods, and security prohibits issuing any password, even a temporary one. The employee must complete a first sign-in and register a FIDO2 security key. What should the help desk provide?",
        'options': [
            'A Temporary Access Pass generated for the account with a short lifetime',
            'A one-time password sent by email, to be changed at first sign-in',
            'An invitation to the Authenticator registration campaign in the authentication methods policy',
            'Combined registration enforced through the SSPR setting that requires registration at sign-in',
        ],
        'correct': 0,
        'explanation': 'A Temporary Access Pass is a time-limited credential that lets an account with no methods sign in for the first time and register passwordless methods, without any password ever existing. The registration campaign nudges users who can already sign in and has no way to start a first sign-in. Enforced combined registration likewise only prompts after the user has authenticated some other way. An emailed one-time password is still a password, which the requirement forbids and which can be phished or forwarded.',
    },
    {
        'id': 'q16',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "A Contoso developer registers a new app named ContosoPortal. Separately, a Contoso administrator grants consent to a multi-tenant SaaS app published by Fabrikam. Which objects now exist in Contoso's tenant?",
        'options': [
            'ContosoPortal has only an app registration; the Fabrikam app has only an enterprise application',
            'ContosoPortal has only an enterprise application; the Fabrikam app has both an app registration and an enterprise application',
            'Both apps have an app registration and an enterprise application',
            'ContosoPortal has an app registration and an enterprise application; the Fabrikam app has only an enterprise application',
        ],
        'correct': 3,
        'explanation': "Registering an app in your own tenant creates the app registration and automatically creates its enterprise application, the local service principal. Consenting to another publisher's multi-tenant app creates only the service principal in your tenant, because the registration stays in the publisher's tenant. Giving both apps a registration is wrong for the vendor app. Leaving ContosoPortal without a service principal ignores the automatic creation. Reversing the two outcomes puts a registration where none can exist.",
    },
    {
        'id': 'q17',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "An Azure Function must read secrets from Azure Key Vault. Security forbids storing any credential in the function's settings, and the platform team does not want to create or maintain an app registration. Which identity should the function use?",
        'options': [
            'A service principal from a new app registration that uses a federated credential',
            'A system-assigned managed identity enabled on the function app',
            'A guest user account that holds the Key Vault Secrets User role',
            'A service principal from a new app registration that uses a certificate credential',
        ],
        'correct': 1,
        'explanation': 'A managed identity is created and credentialed by Azure, appears as a service principal with no app registration, and leaves nothing for the team to store or rotate. A certificate-based app registration still needs a registration to maintain and a private key to keep somewhere. A federated credential is designed for workloads outside Azure that present tokens from another identity provider, so it adds registration work without being needed here. A guest user is a human identity and cannot authenticate an unattended function.',
    },
    {
        'id': 'q18',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'Ten Azure Function apps must call the same downstream API using one identity and one role assignment. The identity must keep working when any Function app is deleted and redeployed. Which configuration meets the requirement?',
        'options': [
            'One app registration with a client certificate copied into all ten Function apps',
            'A system-assigned managed identity on each Function app, each with its own role assignment',
            'A system-assigned managed identity on each app, all added to one security group that holds the role assignment',
            'One user-assigned managed identity holding the role assignment, attached to all ten Function apps',
        ],
        'correct': 3,
        'explanation': 'A user-assigned managed identity is a standalone resource, so one identity and one role assignment can be shared by all ten apps and survive any app being deleted. Ten system-assigned identities collected in a group are ten different identities, and each one is destroyed and replaced with a new principal when its app is deleted, which removes it from the group. A copied certificate is a shared credential that has to be distributed and rotated. Ten system-assigned identities with separate role assignments are neither one identity nor stable across redeployments.',
    },
    {
        'id': 'q19',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'A GitHub Actions workflow on GitHub-hosted runners must deploy to Azure. Security requires that no client secret or certificate exists anywhere in the repository or its settings. What should be configured?',
        'options': [
            "A federated credential on the app registration that trusts GitHub's token issuer for the repository and branch",
            'A system-assigned managed identity enabled on the GitHub-hosted runner machine',
            "A certificate credential whose private key is stored in the repository's encrypted secrets",
            'A client secret stored in GitHub encrypted secrets and rotated on a 30-day schedule',
        ],
        'correct': 0,
        'explanation': "A federated credential lets the workflow exchange its GitHub-issued token for a Microsoft Entra token, so no secret or certificate is stored anywhere. A rotated client secret and a stored certificate both still leave a credential in GitHub's settings that can leak or expire. A managed identity can only exist on an Azure resource, and GitHub-hosted runners are not Azure resources you can assign one to.",
        'whyTested': "Exams like offering 'rotate it faster' or 'use a certificate instead' as plausible half-measures, and a managed identity as a tempting but impossible option for a runner you do not own. The skill tested is recognizing that workload identity federation removes the stored credential entirely.",
    },
    {
        'id': 'q20',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "A nightly daemon with no signed-in user must read every user's calendar in the tenant using the client credentials flow. The developer is not an administrator. What must be configured for the service to work?",
        'options': [
            'A delegated permission for calendars, with users consenting when they first sign in',
            'A delegated permission for calendars, with admin consent granted on behalf of the organization',
            'An application permission for calendars, with admin consent granted by an administrator',
            'An application permission for calendars, with the developer granting consent for the app',
        ],
        'correct': 2,
        'explanation': 'With no signed-in user, the app acts as itself, which requires an application permission, and such standing tenant-wide access needs consent from an administrator. A delegated permission needs a signed-in user context even when an administrator consents for all users, so it cannot work for a daemon. A developer without an administrator role cannot consent to an application permission. Per-user consent applies only to delegated permissions and still needs a user present.',
    },
    {
        'id': 'q21',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'Contoso uses a SaaS app that supports only its own username-and-password sign-in form, with no SAML or OpenID Connect. Users should reach it from My Apps without typing credentials, and each user keeps their own existing login for the app. Which single sign-on mode should be configured?',
        'options': [
            "Linked single sign-on pointing at the app's sign-in page",
            'SAML-based single sign-on with a custom claim carrying the password',
            'Password-based single sign-on',
            'Header-based single sign-on published through Application Proxy',
        ],
        'correct': 2,
        'explanation': "Password-based SSO stores each user's credentials for the app and fills the sign-in form for them, which is the mode built for apps that only understand a form. Linked SSO only adds a shortcut tile, so users still type their credentials. SAML requires the app to accept a signed assertion, which this app cannot do, and a password claim is not how SAML works. Header-based SSO is for apps that read identity from HTTP headers, not apps that present a credential form.",
    },
    {
        'id': 'q22',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'Contoso must give remote employees access to an on-premises intranet website and to SMB file shares. Access must be governed by Conditional Access, no inbound firewall ports may be opened, and no VPN is to be rolled out. What should Contoso deploy?',
        'options': [
            'Microsoft Entra application proxy with a connector group',
            'AD FS with a Web Application Proxy server in the perimeter network',
            'A Windows VPN profile with certificate-based authentication to a perimeter VPN server',
            'Microsoft Entra Private Access with a private network connector',
        ],
        'correct': 3,
        'explanation': 'Entra Private Access publishes private resources through an outbound-only connector and supports non-web traffic such as SMB alongside websites, with Conditional Access applied. Application Proxy also uses outbound connectors and fits the intranet site but is built for web applications, so it does not cover the file shares. AD FS with Web Application Proxy exposes web endpoints through inbound perimeter access and does not handle SMB. Always On VPN is the VPN approach the requirement excludes and needs inbound exposure.',
    },
    {
        'id': 'q23',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Employees of a partner company must obtain a Teams site, a security group, and an enterprise app together through one approval, routed to a Contoso sponsor. Their access must end after 90 days unless they renew. Which feature should Contoso use?',
        'options': [
            'A lifecycle workflow that adds partner users to the resources on a schedule',
            'A quarterly access review of the three resources, with the guests as self-reviewers',
            'An access package with an approval stage and an expiration date',
            "A dynamic group for the partner's email domain, assigned to the three resources",
        ],
        'correct': 2,
        'explanation': 'An access package bundles several resources into one request with an approver and an expiration, and renewal is another request. An access review can only confirm or remove access that already exists and never grants a bundle through a request. A lifecycle workflow runs on joiner, mover, and leaver triggers for existing users and has no request or approval step for partners. A dynamic group gives no request workflow and no expiry.',
    },
    {
        'id': 'q24',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Contoso has hundreds of Microsoft 365 groups and Teams, many with guests added years ago for finished projects. Group owners rarely clean up membership. The administrator wants guests whose access is not reconfirmed to be removed without manual cleanup, with minimal setup per group. What should be configured?',
        'options': [
            'A separate access review created and scheduled by hand per group that contains guests',
            'An access package with a 90-day expiration, assigned to the guests already sitting in groups',
            'An external collaboration setting that stops guests from being added to new groups',
            'One recurring access review scoped to groups that contain guests, decided by group owners and auto-applied',
        ],
        'correct': 3,
        'explanation': 'A single recurring review scoped to all Microsoft 365 groups with guests covers every group at once, asks the owners who know the context, and removes access that is not confirmed when results apply automatically. Building one review per group does the job but contradicts the minimal-setup requirement. An access package only governs access granted through that package, so it would not expire guests already sitting in groups. Restricting who can add guests only prevents new additions and leaves the old guests in place.',
    },
    {
        'id': 'q25',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'On-call engineers need Exchange Administrator only while handling an incident, for no more than four hours at a time, with a written justification each time. They must hold no standing access between incidents. What should be configured in Privileged Identity Management?',
        'options': [
            'A time-bound active assignment lasting 90 days, with justification at assignment',
            'A permanent active assignment with a four-hour Conditional Access sign-in frequency',
            'An eligible assignment that expires after four hours, with required justification',
            'An eligible assignment with a four-hour maximum activation duration and required justification',
        ],
        'correct': 3,
        'explanation': 'An eligible assignment has no access until the engineer activates it, and the role setting caps each activation at four hours and demands a justification. Making the eligibility itself expire after four hours mixes up assignment duration with activation duration and would leave nobody able to activate once it lapsed. A time-bound active assignment makes the role usable continuously for 90 days, which is standing access. A permanent active assignment with a sign-in frequency only forces reauthentication and never removes the role between incidents.',
    },
    {
        'id': 'q26',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'An administrator sets the Application Administrator role in Privileged Identity Management to require approval but selects no specific approvers. An eligible user then requests activation, supplying MFA and a justification. What happens next?',
        'options': [
            'The request goes to Privileged Role Administrators or Global Administrators, who can approve or deny it',
            'The request is held until a Global Administrator manually adds approvers to the role setting',
            'The request fails at once, because approval is not allowed without named approvers',
            'The role activates immediately, because nobody is named to review the request',
        ],
        'correct': 0,
        'explanation': 'When approval is required and no approvers are named, the default approvers are the users holding Privileged Role Administrator or Global Administrator, so the request is routed to them. The role does not activate on MFA and justification alone, because the approval requirement still applies. The setting can be saved without named approvers, so the request does not fail. The request also does not wait for someone to add approvers first, because the default approvers already exist.',
        'whyTested': "This tests whether you know the approval gate is real even when nobody was configured as an approver: PIM falls back to default approvers rather than skipping approval, which trips up candidates who assume 'no approvers' means 'no approval'.",
    },
    {
        'id': 'q27',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Several Azure RBAC and Microsoft Entra directory role assignments are already bundled onto one role-assignable group. Security wants membership in that group itself to require just-in-time activation, with the least administrative effort. What should be configured?',
        'options': [
            'An access package that adds users to the group for four hours, approved by their manager',
            "A PIM eligible assignment per role, replacing the group's role assignments",
            "PIM for Groups, making the group's membership eligible and time-bound",
            "A recurring monthly access review of the group's members",
        ],
        'correct': 2,
        'explanation': 'PIM for Groups makes membership of the group itself eligible, so one activation brings the whole bundle of roles with it, which is the least effort. Rebuilding every role as its own eligible assignment works but repeats the configuration role by role and discards the group design. An access package gives request-and-approval access rather than activation with MFA and justification at the moment of need. A monthly access review only recertifies members after the fact and leaves membership standing in between.',
    },
    {
        'id': 'q28',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Contoso requires every external contractor to read and accept a legal document before reaching any application, with a report showing who accepted the current version. Which configuration meets this?',
        'options': [
            'A custom security attribute recording when contractors accepted',
            'Custom text on the Microsoft Entra sign-in page through company branding',
            'A question in an access package request policy that contractors answer',
            'A terms of use policy required through Conditional Access for guest users',
        ],
        'correct': 3,
        'explanation': 'A terms of use policy presents the document, records each acceptance per user and version, and enforces acceptance as a Conditional Access grant control before access is granted. Company branding text is only displayed and records nothing. A request-policy question is answered once at request time, applies only to that access package, and is not enforced at sign-in. A custom security attribute is a manual label that nothing enforces and no acceptance report is built from.',
    },
    {
        'id': 'q29',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "When a new hire's employeeHireDate arrives, the account must be enabled, a Temporary Access Pass generated and sent to the manager, and the user added to the Onboarding group. Contoso does not want to maintain scripts. What should be configured?",
        'options': [
            'A dynamic group whose rule matches users whose hire date has passed',
            'A lifecycle workflow that uses the hire date as its trigger',
            'An access package auto-assignment policy matching users whose hire date has passed',
            'A Logic App on a daily recurrence that calls Microsoft Graph for new hires',
        ],
        'correct': 1,
        'explanation': 'A lifecycle workflow triggered by the hire date has built-in tasks for enabling the account, generating and sending a Temporary Access Pass, and adding the user to groups, with no code to maintain. An auto-assignment policy can grant access package resources but cannot enable the account or send a pass. A dynamic group only manages group membership. A scheduled Logic App could be made to work but is exactly the custom automation the team wants to avoid.',
    },
    {
        'id': 'q30',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "Contoso wants users from a partner's Microsoft Entra tenant to request an access package themselves, without anyone first inviting each user as a guest. B2B collaboration with the partner is already allowed. What must be configured first?",
        'options': [
            'A connected organization representing the partner tenant in entitlement management',
            "A cross-tenant access setting that trusts the partner's multifactor authentication claims",
            "An access review of the partner's guests so users re-request access periodically",
            "A dynamic group matching the partner's email domain, used as the package's requestor group",
        ],
        'correct': 0,
        'explanation': "A connected organization registers the partner in entitlement management so its users can be chosen as eligible requestors without existing as guests, and the request still passes through the package's own approval. Trusting the partner's MFA claims changes how their guests authenticate but does not make them able to request anything. An access review can only reassess access that already exists. A dynamic group can only contain users that already exist in the directory, which these partner users do not.",
    },
    {
        'id': 'tf1',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': 'A user holds Helpdesk Administrator scoped to one administrative unit and also holds the same role tenant-wide through a separate assignment. This user can reset passwords only for users inside that unit.',
        'answer': False,
        'explanation': 'Role assignments are additive, so the tenant-wide assignment applies across the whole directory and the unit-scoped assignment adds nothing to narrow it. To limit someone to a unit, the tenant-wide assignment has to be removed.',
    },
    {
        'id': 'tf2',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': "If a user matches a dynamic group's membership rule, an administrator cannot remove that user from the group by hand; the rule itself has to change.",
        'answer': True,
        'explanation': 'Membership of a dynamic group is controlled entirely by its rule, so manual additions and removals are not allowed. To keep a matching user out, adjust the rule with an exclusion condition or use an assigned group instead.',
    },
    {
        'id': 'tf3',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': 'When both Pass-through Authentication and Password Hash Sync are enabled, cloud sign-ins automatically fail over to cloud-side validation if every Pass-through Authentication agent goes offline.',
        'answer': False,
        'explanation': 'Password Hash Sync can be kept as a backup, but the failover is not automatic: an administrator has to change the sign-in method in Microsoft Entra Connect to switch validation to the cloud. Until then, sign-ins that depend on the agents fail.',
    },
    {
        'id': 'tf4',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': 'An administrator can permanently delete a soft-deleted user immediately, without waiting for the 30-day retention period to end.',
        'answer': True,
        'explanation': 'The deleted users list lets an administrator remove an object permanently at any time, which is useful for privacy or cleanup requests. The 30-day window is the maximum time the object stays recoverable, not a mandatory waiting period, and a permanently deleted user cannot be restored.',
    },
    {
        'id': 'tf5',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': 'If two Conditional Access policies apply to the same sign-in, one that blocks access and one that grants access after MFA, the sign-in is blocked.',
        'answer': True,
        'explanation': 'A block control overrides grant controls from other policies, so completing MFA for the granting policy cannot rescue the sign-in. This is why exclusions need to be designed into the blocking policy itself rather than relying on another policy to grant access.',
    },
    {
        'id': 'tf6',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': 'Because Microsoft Authenticator push approvals make the user enter a number shown on the sign-in screen, push approval with number matching is phishing-resistant.',
        'answer': False,
        'explanation': 'Number matching defeats blind or fatigue-driven approvals, but a reverse-proxy page can show the number to the victim, who then enters it and completes the relay. Only origin-bound methods such as FIDO2 security keys, Windows Hello for Business, and certificate-based authentication are phishing-resistant.',
    },
    {
        'id': 'tf7',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': 'Security questions can be offered as a self-service password reset method but cannot satisfy a multifactor authentication challenge.',
        'answer': True,
        'explanation': 'Security questions exist only for self-service password reset, where they are one of the methods a user may register. They are not an MFA method, so combined registration cannot use them to satisfy an MFA prompt, which is why they should not be relied on as a strong second factor.',
    },
    {
        'id': 'tf8',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': "A user's risk level in Microsoft Entra ID Protection can rise to High without that user attempting any sign-in.",
        'answer': True,
        'explanation': 'User risk reflects the likelihood that the identity itself is compromised, and detections such as leaked credentials are found offline. The user can therefore be flagged High before they authenticate at all, which is exactly why user risk is tracked separately from the risk of an individual sign-in.',
    },
    {
        'id': 'tf9',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': "Deleting an app registration also deletes its enterprise application (service principal) in the app's home tenant.",
        'answer': True,
        'explanation': 'The service principal in the home tenant is tied to the registration, so removing the registration removes it too, and both can be restored for a limited period. The reverse is not true: deleting only the enterprise application leaves the app registration in place.',
    },
    {
        'id': 'tf10',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': "A managed identity's service principal appears in the Enterprise applications list even though it has no app registration in the tenant.",
        'answer': True,
        'explanation': 'Every managed identity is represented by a service principal, and service principals are listed under enterprise applications (filterable by managed identities). Unlike an application service principal, it has no backing app registration object.',
    },
    {
        'id': 'tf11',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'A federated credential configured for one GitHub repository and branch also lets workflows in other repositories of the same GitHub organization obtain tokens for that app.',
        'answer': False,
        'explanation': 'A federated credential trusts a specific issuer and subject, and the subject identifies the exact repository and branch or environment. A workflow from another repository presents a different subject and is rejected unless it has its own matching federated credential.',
    },
    {
        'id': 'tf12',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'Some delegated Microsoft Graph permissions require administrator consent even though they only act on behalf of a signed-in user.',
        'answer': True,
        'explanation': 'Whether admin consent is needed depends on how sensitive the permission is, not only on whether it is delegated or application. High-privilege delegated permissions are marked as requiring admin consent, so assuming every delegated permission is user-consentable is a mistake.',
    },
    {
        'id': 'tf13',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': 'In Privileged Identity Management, an active assignment can be given an end date, so active does not always mean permanent.',
        'answer': True,
        'explanation': 'Active describes whether the role is in effect without an activation step, while permanent describes the lack of an end date. A time-bound active assignment is in effect immediately and then expires, which is different from an eligible assignment that has to be activated.',
    },
    {
        'id': 'tf14',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': 'Access review decisions are applied to the resource automatically only when auto-apply is enabled; otherwise an administrator must apply the results.',
        'answer': True,
        'explanation': "Auto-apply is a review setting. With it off, the review completes and records the reviewers' decisions but nobody loses access until an administrator applies the results, which is a common reason a completed review appears to have had no effect.",
    },
    {
        'id': 'tf15',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': 'A terms of use policy can be required only of guest users; Conditional Access cannot make member users accept one.',
        'answer': False,
        'explanation': 'Terms of use is enforced as a Conditional Access grant control, so it can target any users, groups, or roles the policy includes, internal members as well as guests. It is commonly used for guests and contractors, which is where the misconception comes from.',
    },
    {
        'id': 'tf16',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': 'A security group that uses dynamic membership can be onboarded to PIM for Groups to make its membership eligible.',
        'answer': False,
        'explanation': 'PIM for Groups has to add and remove members as users activate and expire, which conflicts with a rule-driven membership list, so dynamic-membership groups are not supported. Use an assigned-membership group for just-in-time membership.',
    },
    {
        'id': 'msq1',
        'cat': 'userIdentities',
        'type': 'ms',
        'question': 'Contoso is replacing AD FS with Pass-through Authentication. Which two statements about Pass-through Authentication are true? (Choose two.)',
        'options': [
            'Installing agents on additional servers adds redundancy for cloud sign-ins',
            'Users can still sign in while the on-premises directory is down, as long as one agent is running',
            'The authentication agents make only outbound connections, so no inbound firewall port has to be opened',
            'A Web Application Proxy server must be deployed in the perimeter network to receive sign-in requests',
        ],
        'correct': [0, 2],
        'explanation': 'Pass-through Authentication agents call out to the cloud service, so no inbound port is needed, and extra agents on other servers give redundancy for the validation path. A running agent is not enough during a directory outage, because each password is still checked against a domain controller. A Web Application Proxy is part of the AD FS design that Pass-through Authentication replaces, not a requirement of it.',
    },
    {
        'id': 'msq2',
        'cat': 'userIdentities',
        'type': 'ms',
        'question': 'Which two statements about administrative units are true? (Choose two.)',
        'options': [
            "Global Administrator can be assigned at unit scope to limit its reach to that unit's objects",
            'A unit can contain Azure resource groups so that Azure RBAC roles can be scoped to them',
            'A user can belong to more than one administrative unit at the same time',
            'Adding a group to a unit lets a scoped administrator manage the group, not its members',
        ],
        'correct': [2, 3],
        'explanation': "Membership in several units is allowed, and a group added to a unit brings only the group object, not its members' user accounts. Administrative units contain users, groups, and devices rather than Azure resources, and Azure RBAC is a separate system. Global Administrator is not a role that can be limited to a unit, so only roles designed for unit scope, such as Helpdesk Administrator or User Administrator, can be narrowed this way.",
    },
    {
        'id': 'msq3',
        'cat': 'authAccessMgmt',
        'type': 'ms',
        'question': 'Which two statements about Conditional Access evaluation are true? (Choose two.)',
        'options': [
            'A user who is directly included in a policy is still subject to it when a group containing that user is excluded',
            'When a block policy and a grant policy both apply to a sign-in, the block wins',
            'A policy cannot be saved if it contains only session controls and no grant control',
            'Policies are enforced after first-factor authentication has completed',
        ],
        'correct': [1, 3],
        'explanation': 'Conditional Access acts after the first factor, so it cannot stop a user from reaching the password prompt, and a block overrides grants from any other applicable policy. A policy may contain only session controls, such as a sign-in frequency policy, so that statement is false. Exclusions take precedence over inclusions, so excluding a group exempts its members even when they are also included directly.',
    },
    {
        'id': 'msq4',
        'cat': 'authAccessMgmt',
        'type': 'ms',
        'question': 'An analyst reviews risk detections in Microsoft Entra ID Protection. Which two detections raise sign-in risk for the attempt itself, rather than only user risk? (Choose two.)',
        'options': [
            'An administrator confirming the user as compromised',
            'Credentials found in a leaked credential set',
            'A sign-in from an anonymous IP address',
            'A sign-in that shows atypical travel for the user',
        ],
        'correct': [2, 3],
        'explanation': 'Anonymous IP addresses and atypical travel are properties of a particular authentication attempt, so they raise sign-in risk. Leaked credentials describe the identity rather than any one attempt and raise user risk. An administrator confirming a user as compromised is also an identity-level action that sets user risk, not a signal about a single sign-in.',
    },
    {
        'id': 'msq5',
        'cat': 'workloadIdentities',
        'type': 'ms',
        'question': 'One workload uses a system-assigned managed identity on a single VM. Another workload runs on three VMs that share one user-assigned managed identity. Which two statements are true? (Choose two.)',
        'options': [
            'The user-assigned identity is deleted automatically when the last VM using it is deleted',
            'A recreated first VM gets a new identity that needs its role assignments granted again',
            'The system-assigned identity can be attached to a second VM so both share its role assignments',
            'Deleting one of the three VMs leaves the user-assigned identity and its role assignments in place for the other two',
        ],
        'correct': [1, 3],
        'explanation': 'A system-assigned identity lives and dies with its resource, so a recreated VM gets a new principal with no roles, while a user-assigned identity is its own resource and keeps working for the remaining VMs. A system-assigned identity cannot be attached to a second resource. A user-assigned identity is also not removed when its last user disappears, because it is managed independently.',
    },
    {
        'id': 'msq6',
        'cat': 'workloadIdentities',
        'type': 'ms',
        'question': 'A Contoso administrator grants consent to a multi-tenant SaaS app published by Fabrikam. Which two statements are true afterward? (Choose two.)',
        'options': [
            "Contoso now has an app registration it can edit, including the app's redirect URIs",
            'Contoso now has an enterprise application it can assign users to and govern with Conditional Access',
            "Fabrikam's administrators can change which Contoso users are assigned to the app",
            "The permissions Contoso consented to are recorded on the app's service principal in Contoso's tenant",
        ],
        'correct': [1, 3],
        'explanation': "Consent creates a service principal, shown as an enterprise application in Contoso's tenant, which is where Contoso governs assignment and Conditional Access, and the consented permissions are stored on it. The app registration, including redirect URIs, stays in Fabrikam's tenant and is not copied to Contoso. Fabrikam controls its own application but has no authority over assignments inside Contoso's tenant.",
    },
    {
        'id': 'msq7',
        'cat': 'identityGovernance',
        'type': 'ms',
        'question': 'Which two statements about entitlement management access packages are true? (Choose two.)',
        'options': [
            'Approvers of an access package must hold a tenant-wide administrator role',
            'One access package can have several policies, each with its own requestor scope and approval settings',
            'Assignments never expire unless a separate access review is configured to remove them',
            "Every resource in an access package must come from that package's catalog",
        ],
        'correct': [1, 3],
        'explanation': 'A package can carry multiple policies for different audiences, and its resources are drawn from the catalog that contains it. Approvers can be managers, sponsors, or named users and do not need an administrator role. Each policy can set an expiration for assignments, so expiry does not depend on a separate access review.',
    },
    {
        'id': 'msq8',
        'cat': 'identityGovernance',
        'type': 'ms',
        'question': 'Which two statements about Privileged Identity Management are true? (Choose two.)',
        'options': [
            'PIM can protect both Microsoft Entra directory roles and Azure resource roles',
            'Activation requirements can be configured separately for each user who is eligible for the same role',
            'Azure resource roles can be managed in PIM only at subscription scope',
            'Activation settings, such as maximum duration and approval, are defined per role',
        ],
        'correct': [0, 3],
        'explanation': 'PIM covers Entra directory roles and Azure resource roles under the same eligible and active model, and its role settings belong to the role, so every eligible user of that role activates under the same rules. Per-user activation settings do not exist. Azure resource roles in PIM are not limited to subscriptions, since management groups, resource groups, and resources can be managed too.',
    },
    {
        'id': 'q31',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': "A company issues corporate-owned Windows laptops that must be fully managed through Intune with no on-premises Active Directory dependency at all, while a separate set of existing on-premises domain-joined desktops still needs Microsoft Entra ID sign-in for cloud apps. Which join types should be used for the laptops and the desktops respectively?",
        'options': [
            "Microsoft Entra registered for the laptops, Microsoft Entra joined for the desktops",
            "Microsoft Entra joined for both the laptops and the desktops",
            "Microsoft Entra joined for the laptops, Microsoft Entra hybrid joined for the desktops",
            "Microsoft Entra hybrid joined for the laptops, Microsoft Entra registered for the desktops",
        ],
        'correct': 2,
        'explanation': "Microsoft Entra joined devices exist purely in the cloud with no on-premises AD dependency, fitting the new laptops exactly, while Microsoft Entra hybrid joined devices are joined to both on-premises AD and Entra ID, fitting the existing domain-joined desktops that still need Entra ID sign-in without a full rejoin. Microsoft Entra registered is meant for personal/BYOD devices adding only a work account, not for corporate-managed or existing domain-joined machines.",
    },
    {
        'id': 'q32',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "New employees frequently delay registering strong authentication methods until they are unexpectedly prompted during a risky sign-in weeks later. The security team wants users nudged to register additional authentication methods proactively, during routine sign-in, before any risk event ever occurs. Which policy should be configured?",
        'options': [
            "A registration campaign in the authentication methods policy",
            "The sign-in risk policy, set to block access until MFA is completed",
            "A Conditional Access policy requiring a compliant device for every sign-in",
            "The user risk policy, set to require a password change",
        ],
        'correct': 0,
        'explanation': "A registration campaign in the authentication methods policy proactively nudges users who have not yet registered a stronger authentication method (such as Microsoft Authenticator) during ordinary, non-risky sign-in, rather than waiting for a risk event to force the issue. It replaces the legacy Identity Protection MFA registration policy. The sign-in risk and user risk policies both react to risk signals that have already occurred rather than proactively encouraging registration beforehand, and device compliance has nothing to do with authentication method registration.",
    },
    {
        'id': 'q33',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "Security wants passwords containing 'Contoso' and its common variations rejected whenever a password is set, both in the cloud and when users change passwords against on-premises Active Directory. What should be configured?",
        'options': [
            'Microsoft Entra Password Protection with a custom banned list, left cloud-only without on-premises agents',
            'Microsoft Entra Password Protection with a custom banned list, plus the on-premises proxy and DC agents',
            'Smart lockout with a lower failed-attempt threshold configured in the tenant',
            'A fine-grained password policy in Active Directory that raises minimum length and complexity',
        ],
        'correct': 1,
        'explanation': 'The custom banned list covers cloud password changes, and the proxy service plus domain controller agents carry that same list to password changes made against on-premises Active Directory. The banned list alone leaves on-premises changes unchecked. Longer, more complex passwords do not ban specific terms, so a password containing the brand name can still pass. Smart lockout reacts to repeated failed sign-ins and never inspects password content.',
    },
    {
        'id': 'q34',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "Users see 'Need admin approval' when they try a new third-party app. Security wants to keep user consent restricted, but give users a way to ask for approval that reaches the people Security names, without involving the help desk. What should be enabled?",
        'options': [
            'Tenant-wide admin consent granted in advance for the apps users have tried',
            'The admin consent workflow with designated reviewers',
            'User consent opened up to apps from unverified publishers',
            'An access package that bundles the requested apps with an approval step',
        ],
        'correct': 1,
        'explanation': 'The admin consent workflow lets a blocked user submit a request that goes to the reviewers you designate, who approve or deny it, while ordinary user consent stays restricted. Opening user consent to every publisher removes the control entirely. Granting tenant-wide consent to every attempted app approves them all without review. An access package decides who is assigned to an app, but it does not grant the OAuth permissions the app is requesting.',
    },
    {
        'id': 'q35',
        'cat': 'workloadIdentities',
        'type': 'ms',
        'question': 'A production outage occurred because a client secret on an app registration expired unnoticed. Contoso wants the fix that removes this class of failure wherever possible. Which two actions achieve that? (Choose two.)',
        'options': [
            'Issue each secret with the longest lifetime the tenant allows and note the expiry in a calendar',
            'Replace secrets with federated credentials for workloads running outside Azure, such as GitHub Actions',
            'Replace each client secret with a certificate credential that has a two-year lifetime',
            'Replace secrets with a managed identity for apps hosted on Azure resources',
        ],
        'correct': [1, 3],
        'explanation': 'A managed identity and a federated credential both remove the stored credential entirely, so there is nothing left to expire or leak, and they cover Azure-hosted and external workloads respectively. A longer secret only postpones the same outage and depends on someone remembering the calendar. A two-year certificate is a better credential type but is still a credential that expires and can be stolen.',
    },
    {
        'id': 'q36',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Contoso wants a way to regain Global Administrator access if an MFA provider outage, a Conditional Access misconfiguration, or a failure of on-premises identity services blocks every normal administrator. What should be configured?',
        'options': [
            'Global Administrator accounts that sign in through AD FS with smart cards and are exempt from MFA',
            'Two cloud-only Global Administrator accounts with permanent active roles, excluded from the Conditional Access policies that could block them, with sign-in alerts',
            'Two Global Administrator accounts synchronized from Active Directory and covered by the same Conditional Access policies as other administrators',
            'A PIM eligible Global Administrator assignment for every IT staff member, approved by the security team',
        ],
        'correct': 1,
        'explanation': 'Emergency access accounts must be independent of everything that can fail: cloud-only, permanently active so no activation step is needed, excluded from the Conditional Access policies that could block them, and monitored so any use is noticed. Synchronized accounts under the normal policies depend on both on-premises services and the very policies that may be locking everyone out. PIM eligible assignments need working MFA and activation, which are the paths that may be down. Accounts that sign in through AD FS depend on the on-premises federation farm, which is one of the failure modes listed.',
    },
    {
        'id': 'q37',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'The Finance Approver and Finance Payment Processor access packages must never be held by the same person. Contoso wants the conflict prevented at request time rather than found afterward. What should be configured?',
        'options': [
            'A dynamic group for each package with a rule that excludes members of the other package',
            'A separation-of-duties setting on each package that lists the other package as incompatible',
            'A second approval stage in each package that routes requests to the compliance officer',
            "A monthly access review of both packages' assignees, with managers as reviewers",
        ],
        'correct': 1,
        'explanation': 'Marking each package as incompatible with the other makes entitlement management refuse a request from anyone who already holds the conflicting package, which is preventive. A monthly access review is detective and leaves the conflict in place until the next cycle. An extra approval stage depends on a person noticing the conflict and does not enforce anything. A dynamic group cannot see who holds which access package, so its rule has nothing to evaluate.',
    },
    {
        'id': 'tf17',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Contoso Group has four subsidiary Microsoft Entra tenants. Employees in each tenant must automatically appear as users in the other tenants, so they can be assigned apps and show in people pickers, with accounts created and removed without manual invitations. Which feature should be configured?',
        'options': [
            'Cross-tenant synchronization from each source tenant to the others',
            'Entitlement management access packages that each employee requests in every other tenant',
            'B2B direct connect between the tenants',
            'A monthly bulk invitation of employees from a CSV file',
        ],
        'correct': 0,
        'explanation': 'Cross-tenant synchronization automatically creates, updates, and removes users in target tenants for organizations that operate several tenants, with no invitation step. B2B direct connect creates no user objects, so employees would not appear in people pickers or be assignable to apps. A monthly CSV invitation is manual and lets accounts go stale between runs. Access packages require every employee to request access in every other tenant and do not keep accounts in step with the source.',
    },
    {
        'id': 'tf18',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': 'A Conditional Access policy that requires a password change as its grant control can be tied to a user risk condition, but not to a sign-in risk condition.',
        'answer': True,
        'explanation': 'Requiring a password change only makes sense when the identity is at risk, so that grant control is available with user risk. A risky sign-in is remediated by requiring MFA instead, which is why the two risk types map to different remediation controls.',
    },
    {
        'id': 'tf19',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'Sign-ins made by managed identities are listed in the same Service principal sign-ins view as sign-ins made by app registrations.',
        'answer': False,
        'explanation': 'Microsoft Entra sign-in logs separate interactive user, non-interactive user, service principal, and managed identity sign-ins into distinct views. Troubleshooting a failing Azure-hosted workload therefore means looking at the managed identity view rather than the service principal view.',
    },
    {
        'id': 'msq9',
        'cat': 'identityGovernance',
        'type': 'ms',
        'question': 'Contoso is planning lifecycle workflows for joiners and leavers. Which two statements are true? (Choose two.)',
        'options': [
            'A time-based trigger can offset a workflow in days from the hire or leave date',
            'A workflow can run a custom task extension that calls an Azure Logic App',
            'Workflows act only on objects in Microsoft Entra ID and cannot call any external system',
            'A workflow can create the user account on the hire date when none exists yet',
        ],
        'correct': [0, 1],
        'explanation': 'Custom task extensions let a workflow call a Logic App to reach external systems, and time-based triggers apply an offset in days to a date attribute on the user. Saying workflows cannot reach outside Entra ID ignores custom task extensions. Workflows run tasks on user objects that already exist and do not create accounts, which is a job for HR-driven provisioning.',
    },
    {
        'id': 'msq10',
        'cat': 'authAccessMgmt',
        'type': 'ms',
        'question': 'Which two statements about Conditional Access session controls are true? (Choose two.)',
        'options': [
            'Setting a sign-in frequency blocks any sign-in that happens after the interval has elapsed',
            'Application enforced restrictions work only with Exchange Online and SharePoint Online',
            "Sign-in frequency can force reauthentication before the token's normal lifetime would have ended",
            'Session controls are evaluated first and decide whether a sign-in may begin',
        ],
        'correct': [1, 2],
        'explanation': 'Sign-in frequency asks the user to reauthenticate sooner than the token would require, and application enforced restrictions depend on the app honoring the signal, which only Exchange Online and SharePoint Online do. Session controls apply to a session that has already been granted rather than deciding whether it starts. Sign-in frequency also does not block anyone after the interval; it prompts the user to authenticate again.',
    },
    {
        'id': 'q38',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'A project manager provides a spreadsheet of 150 contractors from several partner firms, each identified by an external email address. They must be added to Contoso as guests and receive invitations. What is the most efficient approach?',
        'options': [
            "Download the bulk invite template, enter each contractor's email address, and upload it",
            'Add each partner firm as a connected organization in entitlement management',
            'Use the bulk create template with each external email address as the user principal name',
            "Configure cross-tenant synchronization from each partner firm's tenant",
        ],
        'correct': 0,
        'explanation': "Bulk invite takes a list of external email addresses, creates a guest user for each, and sends the invitations in one operation. Bulk create builds member accounts in your own domains, and an external address cannot be a valid user principal name there. A connected organization only lets that organization's users become eligible requestors and creates no guests by itself. Cross-tenant synchronization is for tenants of one organization and would need each partner firm to configure sync.",
    },
    {
        'id': 'q39',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Self-service Microsoft 365 group names at Contoso are inconsistent and sometimes inappropriate. IT wants every new group name to carry a department-based label and be screened for banned terms, while users keep creating groups themselves. What should be configured?',
        'options': [
            'The setting that limits group creation to members of a designated security group',
            'A group expiration policy that deletes groups nobody renews',
            'A group naming policy with a prefix template and a blocked-words list',
            "Sensitivity labels that set a group's privacy and external sharing",
        ],
        'correct': 2,
        'explanation': 'A group naming policy applies the prefix template and blocked-words check at creation time, so self-service creation continues under consistent names. An expiration policy manages the lifecycle of groups and says nothing about names. Limiting group creation to a security group removes self-service from most users, which the stem rules out. Sensitivity labels govern privacy and sharing settings rather than naming.',
    },
    {
        'id': 'q40',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "A Conditional Access policy requires MFA for all users except sign-ins from the headquarters named location, defined by the office's public egress IP addresses. Employee A is in the office. Employee B works from home on a full-tunnel VPN that exits through headquarters. Employee C works from home on a split-tunnel VPN, so Microsoft 365 traffic leaves through the home ISP. Who is prompted for MFA?",
        'options': [
            'Employee C only',
            'Employees A and B',
            'Employees B and C',
            'All three employees',
        ],
        'correct': 0,
        'explanation': "A named location is evaluated against the public IP address that Microsoft Entra ID sees. Employee A and Employee B both appear to come from the headquarters egress addresses, so both fall inside the exempted location. Employee C's sign-in leaves through the home ISP because of the split tunnel, so it falls outside the location and the MFA requirement applies. The other answers either treat split-tunnel traffic as if it left through headquarters or judge location by where the person physically sits.",
    },
    {
        'id': 'q41',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'A Conditional Access session control sets sign-in frequency to 4 hours and disables persistent browser sessions for sign-ins from unmanaged devices. A user signs in from a personal unmanaged laptop, closes the browser after 30 minutes, then reopens it an hour later. What happens?',
        'options': [
            'The user must sign in again, because closing the browser ended the session even though four hours had not passed',
            'The user is blocked until an administrator revokes the existing session',
            'The user stays signed in, because closing the browser only pauses the four-hour countdown until reopening',
            'The user stays signed in, because the four-hour window has not elapsed and takes priority over browser persistence',
        ],
        'correct': 0,
        'explanation': 'Disabling persistent browser sessions makes the session end when the browser closes, regardless of how much of the sign-in frequency window remains. Sign-in frequency sets only the maximum age of a session, so it cannot keep a session alive after the browser has ended it. The countdown is not paused when the browser closes. Nothing in these controls blocks the user or needs an administrator, since they simply authenticate again.',
    },
    {
        'id': 'q42',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "Three policies apply to a sign-in. Policy A (On) requires a compliant device. Policy B (On) requires MFA. Policy C (Report-only) requires the Phishing-resistant MFA authentication strength. The user's device is compliant, and the user has so far signed in with only a password. What happens?",
        'options': [
            'The user must satisfy MFA and the phishing-resistant strength, because all applicable policies are combined',
            'The user is prompted for MFA and then granted access; Policy C only logs its result',
            'The user is blocked, because the requirement in Policy C is not met',
            'The user is granted access immediately, because the compliant device satisfies the policies',
        ],
        'correct': 1,
        'explanation': 'Policies that are On combine, so the user must satisfy both the compliant device requirement and MFA, and the user still has MFA to complete. Report-only policies are evaluated and logged but never enforced, so Policy C affects nothing here. A compliant device alone does not excuse Policy B. Policy C cannot block or add requirements while it is in report-only mode, which rules out both the block and the combined-requirements answers.',
    },
    {
        'id': 'q43',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "Contoso registers an internal expenses app that must accept sign-ins only from accounts in Contoso's own tenant. Sign-ins from other organizations' tenants and from personal Microsoft accounts must be rejected by the app registration itself. Which setting accomplishes this?",
        'options': [
            'An inbound cross-tenant access setting that blocks B2B collaboration from other organizations',
            "User assignment required set to Yes on the app's enterprise application",
            'A redirect URI restricted to the Contoso domain in the app registration',
            'Supported account types set to accounts in this organizational directory only',
        ],
        'correct': 3,
        'explanation': "Supported account types on the app registration decides which directories and account kinds the app accepts, and the single-tenant choice limits it to Contoso. Requiring user assignment limits which Contoso users can obtain a token but does not change which directories the registration accepts. Blocking inbound B2B collaboration affects guest access to Contoso resources, not the app's account types. A redirect URI controls where responses are sent and has no bearing on who can sign in.",
    },
    {
        'id': 'q44',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "The pipeline for Contoso's deployment tool authenticates as a single-tenant service principal. Security wants it to be able to authenticate only from the company's known egress IP ranges. Which configuration enforces this?",
        'options': [
            'A Conditional Access policy for users with a location condition, because service principals inherit user policies',
            'Converting the pipeline to a managed identity and targeting it with a workload identity policy',
            'A Conditional Access policy for workload identities, targeting the service principal with a location condition',
            'A federated credential on the app that limits issued tokens to requests from the known IP ranges',
        ],
        'correct': 2,
        'explanation': 'Conditional Access for workload identities is a separate policy scope that applies conditions, such as a location, to a single-tenant service principal. A user-targeted policy never evaluates a service principal sign-in, so it would not restrict the pipeline. Managed identities are not covered by workload identity policies, so converting would remove the control instead of adding it. A federated credential matches an issuer and subject and has no IP restriction.',
    },
    {
        'id': 'q45',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'An access review has one named reviewer, who leaves Contoso before responding. No fallback reviewers are configured. When the review period ends, what determines the outcome for the users under review?',
        'options': [
            "The review reassigns itself to the group's owners, who decide within a grace period",
            "The review's setting for non-responding reviewers, such as no change, remove, or take recommendations",
            'Users under review lose access, because an unanswered review fails closed',
            'The review stays open past its end date until an administrator assigns a replacement reviewer',
        ],
        'correct': 1,
        'explanation': 'Each review has a setting for what happens to users when reviewers do not respond, and that setting is applied when the period ends, which is why it should be chosen deliberately. A review does not extend itself while waiting for a replacement reviewer. It does not remove access by default, because the default depends on that setting and can be no change. Group owners are only involved if they were configured as reviewers or fallback reviewers.',
    },
    {
        'id': 'q46',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "A leaver workflow disables a departing employee's account and removes their group memberships. An auditor finds that the employee's entitlement management access package assignment, which expires in four months, is still active. What should be added to the workflow?",
        'options': [
            'A task that removes all license assignments from the user',
            'A task that removes the user from all Teams',
            "A task that sends the manager a reminder to review the departing user's access",
            "A task that removes all of the user's access package assignments",
        ],
        'correct': 3,
        'explanation': 'An access package assignment is tracked by entitlement management, so removing group memberships and disabling the account does not end it, and a task that removes access package assignments is what closes the gap. Removing the user from Teams or removing licenses addresses different assignments and leaves the package in place. A reminder email depends on the manager acting and does not remove anything automatically.',
    },
]

LESSONS = [
    {
        'id': 'entra-user-identities',
        'title': 'User Identities & Hybrid Identity',
        'summary': 'Directory roles, administrative units, dynamic groups, hybrid sync, and external identities.',
        'diagram': 'groupLicensing',
        'vocabIds': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'],
        'quizIds': ['q1', 'q3', 'q5', 'q7', 'tf2', 'msq2'],
        'reading': """Microsoft Entra ID directory roles and Azure RBAC roles look similar but govern two separate systems: a directory role like User Administrator controls administrative tasks inside Entra ID itself -- resetting passwords, managing groups -- while Azure RBAC controls access to Azure resources such as VMs or storage accounts at a subscription or resource group scope. Holding one does not automatically grant the other; an administrator with Global Administrator still has to explicitly elevate access to gain Azure RBAC rights on a subscription. Administrative units narrow how far a directory role reaches: instead of assigning Helpdesk Administrator across the whole tenant, an administrative unit scopes that same role to a defined subset of users, groups, or devices, such as one regional office, so a support technician in Seattle has no rights over users in Tokyo. Dynamic group membership rules solve a related but different problem -- group membership itself. Rather than an administrator manually adding and removing members, a dynamic group evaluates a rule against directory attributes like department or job title and updates membership automatically, though a single dynamic group can only target users or devices, never a mix of both in one rule.

When a company still keeps its own on-premises Active Directory, Microsoft Entra Connect brings those identities into the cloud, and the sign-in method chosen determines how much trust and dependency stays on-premises. Password Hash Sync synchronizes a hash of the password hash to Entra ID, so sign-in is validated entirely in the cloud and keeps working even during a brief on-premises outage -- Microsoft's default recommendation for exactly that resilience. Pass-through Authentication instead validates each sign-in in real time against on-premises Active Directory through a lightweight agent, storing no password hash of any kind in the cloud, at the cost of depending on that on-premises infrastructure staying reachable. Federation goes further still, redirecting authentication entirely to an external identity provider like AD FS. Choosing how to actually run that synchronization is a separate decision: Microsoft Entra Connect Sync is a full-featured single-server engine suited to complex, highly customized attribute-flow scenarios, while Microsoft Entra Cloud Sync is a lighter, agent-based alternative that can run multiple agents across multiple on-premises AD forests for built-in redundancy, trading away some of Connect Sync's deeper customization.

Beyond an organization's own employees, B2B collaboration lets a partner's users sign in with their own home tenant's credentials as guest users, with their password and MFA status remaining entirely the partner's responsibility -- your tenant only decides what that guest can access, and cross-tenant access settings further control, per partner organization, whether to trust that partner's own MFA and device-compliance claims instead of re-enforcing your own. Day-to-day account administration has its own set of tools: bulk user operations use a Microsoft-provided CSV template to create, invite, or delete many accounts in one pass rather than one at a time, and a deleted user is only soft-deleted, recoverable along with its group memberships and licenses for 30 days before being purged permanently. Custom security attributes extend how users can be targeted beyond built-in directory fields -- an administrator-defined key-value pair like Project=Falcon can drive attribute-based access conditions on Azure role assignments (for example on Azure Storage) and Conditional Access application filters, though managing them requires its own dedicated Attribute Assignment/Definition Administrator role, one even a Global Administrator does not hold by default.""",
        'fundamentalsLabel': 'New to Entra ID identity management? See the everyday analogy',
        'fundamentals': "Think of administrative units the way a large company might delegate control of one branch office's front-door key to that branch's own manager, without handing them a master key to every office in the country -- they can act within their scope, but nowhere else. B2B collaboration is like using someone else's ID card issued by their own employer to get into your building as a visitor: you don't issue or manage that card, you just decide which rooms it's allowed to open once it's shown at your door. And Password Hash Sync versus Pass-through Authentication is the difference between a hotel keeping its own duplicate of every guest's ID on file so it can verify you even if head office's phone lines are down (PHS), versus calling head office directly every single time to confirm your identity before letting you in (PTA).",
        'keyTerms': ['Administrative units', 'Dynamic group membership rules', 'Password Hash Sync', 'Pass-through Authentication', 'Microsoft Entra Cloud Sync', 'B2B collaboration', 'Bulk user operations', 'Custom security attributes', 'Cross-tenant access settings'],
        'commonTraps': [
            "Holding a directory role like Global Administrator does not automatically grant Azure RBAC rights -- the two systems require an explicit elevation step to bridge.",
            "A dynamic group is either a dynamic user group or a dynamic device group -- a single rule can never mix both object types.",
            "Pass-through Authentication stores no password hash in the cloud at all; that is Password Hash Sync's behavior, not PTA's.",
            "After the 30-day recovery window closes, a deleted user is purged permanently -- there is no further recovery option.",
        ],
        'scenario': "A multinational company keeps its HR system authoritative in on-premises Active Directory across three regional forests, and wants sign-in to keep working even if one region's domain controllers go offline overnight for maintenance -- so it deploys Microsoft Entra Cloud Sync with an agent in each forest rather than a single Connect Sync server, and Password Hash Sync as the sign-in method rather than Pass-through Authentication. Regional helpdesk staff are each granted the Helpdesk Administrator role scoped to their own region's administrative unit, so a technician in the Singapore office can reset passwords for Singapore users but has no rights over the London office. When a contractor from a partner firm needs temporary access to a shared project site, the team adds them through B2B collaboration rather than creating a new password-managed account, and configures cross-tenant access settings to trust that partner's own MFA claims instead of re-challenging them a second time.",
        'onTheJob': "Administrative units get adopted mostly because handing a global Helpdesk Administrator role to every regional support tech is the kind of overreach an access-governance audit flags immediately, and scoping it down after the fact is a miserable cleanup project compared to designing it in up front. Choosing PHS over PTA in practice is rarely a security debate -- it's usually decided the first time an on-premises outage takes down sign-in entirely and leadership demands it never happen again. And the 30-day soft-delete window is the thing that saves an admin's career the one time someone bulk-deletes the wrong CSV of users and needs those group memberships and licenses back before anyone notices. A recurring gotcha with Pass-through Authentication specifically: it depends on lightweight on-premises agents staying patched and running, and a team that deploys only one agent for 'simplicity' has quietly built a single point of failure into cloud sign-in that PHS's fully cloud-side validation would never have had in the first place.",
    },
    {
        'id': 'authentication-methods-selfservice',
        'title': 'Authentication Methods & Self-Service Security',
        'summary': 'MFA, passwordless sign-in, SSPR, Temporary Access Pass, and the modern authentication methods policy.',
        'diagram': 'authMethodsBootstrap',
        'vocabIds': ['f10', 'f11', 'f12', 'f13', 'f16', 'f18'],
        'quizIds': ['q9', 'q10', 'q11', 'q14', 'q15', 'tf7'],
        'reading': """Microsoft Entra supports a range of multifactor authentication methods, from the Microsoft Authenticator app (push notification or fully passwordless) and FIDO2 security keys down to weaker options like SMS and voice call, which remain supported but are the least preferred methods and are increasingly discouraged. It's worth separating two ideas that sound alike but aren't: "strongest" and "phishing-resistant" are not synonyms. A standard Authenticator push notification is stronger than SMS, but it can still be defeated by an MFA-fatigue attack, where an attacker floods a user with approval prompts until one gets accidentally approved, or a consent-phishing page. Only methods like FIDO2 security keys, Windows Hello for Business, and certificate-based authentication are genuinely phishing-resistant, because the proof of identity is cryptographically bound to hardware and to the specific site it was registered with, not something that can be typed or approved on a lookalike page.

Passwordless authentication options remove the shared secret entirely: a FIDO2 security key, Windows Hello for Business, or Authenticator passwordless phone sign-in each proves identity through possession of a specific device plus a biometric or PIN, rather than something that can be phished or reused elsewhere. Bootstrapping a brand-new employee, or anyone who's had a security incident, straight into one of those passwordless methods without ever issuing them a traditional password is exactly what a Temporary Access Pass is for: a time-limited, one-time or limited-use passcode an administrator issues, letting the user sign in just long enough to register FIDO2 or Windows Hello for Business and never type a real password at all.

Self-Service Password Reset lets a user recover a forgotten password without calling the help desk, but enabling SSPR for a group has no effect on anyone who hasn't separately registered the required authentication methods first -- registration is a distinct, required step from turning the feature on. Combined registration folds that registration experience together, so a method like the Authenticator app registered once satisfies both a future MFA challenge and a future SSPR flow, instead of registering twice for what is really the same underlying method. All of this -- which methods exist, which are enabled tenant-wide or scoped to specific groups -- is now centralized in the authentication methods policy, the modern, single location that has replaced what used to be scattered across separate legacy MFA service settings and SSPR policy blades.""",
        'fundamentalsLabel': 'New to authentication methods? See the everyday analogy',
        'fundamentals': "A password is like a key that works in any lock that recognizes its shape -- including a lock a scammer built to look exactly like your front door. A FIDO2 key is more like a key that physically checks the door's serial number before it turns at all, so it simply refuses to work in a convincing fake. A Temporary Access Pass is like a locksmith letting you into your own house with a one-time master code so you can install a proper smart lock (your passwordless method) yourself, rather than mailing you a spare house key first. And combined registration is just not making you fill out the same form twice -- once you've told the building your fingerprint works for the front door, it works for the side door too.",
        'keyTerms': ['Multifactor authentication methods', 'Passwordless authentication options', 'Self-Service Password Reset', 'Combined registration', 'authentication methods policy', 'Temporary Access Pass', 'phishing-resistant', 'MFA-fatigue'],
        'commonTraps': [
            "'Strongest' and 'phishing-resistant' aren't the same thing -- only FIDO2, Windows Hello for Business, and certificate-based auth are truly phishing-resistant.",
            "Enabling SSPR for a group does nothing for users who haven't separately registered the required authentication methods.",
            "A Temporary Access Pass is for onboarding or recovery, not an everyday sign-in method -- it's not meant to replace a registered method long-term.",
        ],
        'scenario': "A company just deployed Windows Hello for Business tenant-wide, but new hires currently receive a temporary password by email on day one, typed into a browser before anything else -- exactly the kind of phishable credential the rollout is trying to eliminate. Switching new-hire onboarding to issue a Temporary Access Pass instead lets each new employee sign in for the very first time and register Windows Hello for Business directly, without a traditional password ever existing to be phished, forwarded, or reused. Because combined registration is already enabled, that same registration session also satisfies the employee's SSPR requirement, so IT doesn't have to send a second, separate registration reminder later.",
        'onTheJob': "MFA fatigue is a real, named attack technique for a reason -- real users get worn down by a flood of push notifications and eventually tap 'approve' just to make it stop, which is exactly why security teams are pushing so hard toward phishing-resistant methods instead of just any second factor. SSPR rollouts fail constantly for the boring reason that enabling the feature for a group and actually getting users to register their methods are two separate projects, and skipping the second one is why the help desk keeps getting password-reset calls the SSPR budget was supposed to eliminate. And Temporary Access Pass exists largely because IT got tired of emailing brand-new hires a plaintext temporary password that then sits in someone's inbox forever, phishable long after onboarding is over. A subtler rollout mistake is forgetting that password writeback has to be enabled separately from SSPR itself -- a team that turns on cloud password reset without it discovers, usually from an angry help desk ticket, that the user's on-premises password never actually changed and they're now locked out of anything still validated against Active Directory.",
    },
    {
        'id': 'conditional-access-risk',
        'title': 'Conditional Access, Risk & Access Decisions',
        'summary': 'How Conditional Access policies combine with RBAC, risk signals, and authentication strength to decide access.',
        'diagram': 'identity',
        'vocabIds': ['f9', 'f14', 'f15', 'f17', 'f19', 'f39', 'f42', 'f43'],
        'quizIds': ['q8', 'q12', 'q40', 'q41', 'q42', 'msq4'],
        'reading': """Every Conditional Access policy is built from two halves. Assignments define who and what it applies to -- which users or groups, which cloud apps, and under which conditions like sign-in risk, device platform, or location -- and access controls define what happens once it does apply: grant controls like requiring MFA or a compliant device, or block outright, plus session controls like limiting how long a browser session stays alive. This is exactly the Conditional Access policy structure the exam expects you to know cold. Critically, a policy whose assignments simply don't match a given sign-in doesn't evaluate for that sign-in at all; that's different from evaluating and then granting access anyway. This is also where Conditional Access and Azure RBAC divide the work cleanly: RBAC decides what an already-authenticated identity is allowed to do, at a scope like a subscription or resource group, while Conditional Access decides under what conditions that identity is allowed to sign in in the first place. Reaching a resource generally means satisfying both checks -- RBAC's permission and Conditional Access's conditions -- independently of each other. Named locations give Conditional Access one more condition to reason about: trusted IP ranges or countries an administrator defines once and then references across many policies, such as exempting a trusted corporate office from an extra verification step that untrusted networks still have to satisfy.

Microsoft Entra ID Protection layers risk signals on top of that same framework. User risk reflects the likelihood a specific identity itself has been compromised -- leaked credentials found in a breach dump being the classic example -- while sign-in risk reflects the likelihood one specific authentication attempt isn't genuine, based on signals like impossible travel or an anonymous IP address. The two are tracked and remediated independently: a leaked-credential detection raises user risk even if the very next sign-in looks completely unremarkable, and successfully completing MFA resolves that one sign-in's risk without necessarily resolving the underlying, identity-level user risk -- a user risk policy typically still requires a secure password change to actually fix that. Where a policy wants to demand more than generic MFA, an authentication strength lets it require a specific combination of methods -- for instance, only phishing-resistant options like FIDO2 or Windows Hello for Business -- rejecting a sign-in that used SMS even though SMS technically satisfies a plain require-MFA control.

Rolling out a brand-new or modified policy carries real risk of locking people out by accident, which is exactly what Conditional Access report-only mode exists to de-risk: it evaluates the policy against real sign-ins and logs what it would have done -- grant, block, or challenge -- without actually enforcing anything, so its blast radius can be reviewed before flipping it on for real. Microsoft-provided Conditional Access templates give administrators a vetted starting point for common policies, like requiring MFA for all users or blocking legacy authentication, rather than building every policy from a blank slate. And Identity Secure Score rolls a tenant's overall posture -- MFA coverage, legacy auth blocking, and more -- into a single directional percentage with specific, itemized improvement actions, useful for showing progress over time even though it isn't a pass/fail target. When multiple Conditional Access policies apply to the same sign-in, all of their required grant controls must be satisfied together, not just one of them -- satisfying Policy A's device-compliance requirement doesn't excuse a user from also completing Policy B's MFA requirement.""",
        'fundamentalsLabel': 'New to Conditional Access and risk? See the everyday analogy',
        'fundamentals': "Picture a secure building where RBAC is simply the list of doors your badge is allowed to open, decided in advance. Conditional Access is a smart guard station in front of every door that also checks conditions in real time -- is this the usual time of day, the usual device, the usual location? -- before letting even a valid badge through. User risk is like security flagging that your badge itself might have been cloned, based on something they learned separately, regardless of how normal your latest walk through the lobby looked; sign-in risk is the guard being suspicious of this one specific walk-up, based on how you're behaving right now. And report-only mode is a guard practicing the new rules on real foot traffic while writing down what they would have done, without ever actually turning anyone away yet.",
        'keyTerms': ['Conditional Access policy structure', 'named locations', 'user risk', 'sign-in risk', 'authentication strength', 'report-only mode', 'Conditional Access templates', 'Identity Secure Score'],
        'commonTraps': [
            "A Conditional Access policy whose assignments don't match a sign-in simply doesn't apply -- that's not the same as evaluating and granting access.",
            "MFA resolves sign-in risk for that one attempt; it does not by itself resolve an elevated user risk score, which usually needs a password change.",
            "When multiple policies apply to the same sign-in, ALL of their grant controls must be satisfied -- it's an AND across policies, not an OR.",
            "Report-only mode logs what a policy would have done; it never actually blocks or grants access on its own.",
        ],
        'scenario': "A security team is about to roll out a new policy requiring the Phishing-resistant MFA authentication strength for every admin role, but worries it might lock out an admin who hasn't yet registered FIDO2. They turn the policy on in report-only mode first, reviewing a week of what it would have blocked before ever setting it to enforce, and use that same window to update Identity Secure Score's MFA-registration action item. Separately, Identity Protection flags one admin's credentials as leaked (raising user risk) while a completely unrelated sign-in from that same admin scores as low sign-in risk -- the team knows these are tracked independently, so they still force a password change to remediate the user risk rather than assuming the low-risk sign-in cleared anything.",
        'onTheJob': "Report-only mode is what stands between a well-intentioned new Conditional Access policy and a Friday-afternoon company-wide lockout, which is why any experienced admin treats skipping that staging step as one of the more career-limiting mistakes available in this job. The user-risk-versus-sign-in-risk distinction is also where real incident response gets messy: a leaked credential doesn't clear itself just because someone's next sign-in looked normal, and forgetting that is how a genuinely compromised account keeps its standing access long after the 'risky sign-in' banner disappears. Identity Secure Score matters less as a number and more as the thing that gets waved around in a budget meeting to justify actually fixing the gaps it lists.",
    },
    {
        'id': 'workload-identities-apps',
        'title': 'Workload Identities & App Integrations',
        'summary': 'App registrations, service principals, managed identities, API permissions, and SSO/proxy for enterprise apps.',
        'diagram': 'workloadIdentityLandscape',
        'vocabIds': ['f20', 'f21', 'f22', 'f23', 'f25', 'f26', 'f27', 'f28'],
        'quizIds': ['q16', 'q18', 'q19', 'q20', 'q22', 'q35'],
        'reading': """Every application that authenticates to Microsoft Entra ID has two related but distinct representations. An app registration is the global definition -- its app ID, redirect URIs, requested API permissions -- created once, typically in the tenant that owns the app. An enterprise application is the local, tenant-specific instance of that same app: the service principal that actually gets assignments, SSO configuration, and Conditional Access applied to it inside one particular tenant. Registering an app in your own tenant creates both automatically; consenting to somebody else's multi-tenant app instead creates only the enterprise application side in your tenant, with no app registration of your own to manage. Not every service principal traces back to a full app registration this way -- among Entra ID's service principal types are application (backing a registered app), managed identity (tied to an Azure resource's own lifecycle), and legacy (predating the current model), and a managed identity's service principal specifically has no corresponding app registration object at all.

Managed identities remove the need for an application to hold its own credentials at all, but the two flavors behave very differently. A system-assigned managed identity is created and destroyed along with a single Azure resource -- simple, but it can't be shared, and it disappears the moment that resource is deleted. A user-assigned managed identity is its own standalone resource instead, one that can be attached to many resources at once and persists independently of any single one of them, which is exactly what you want when ten Function apps all need to share the same identity and the same role assignment. For a workload running outside Azure entirely -- a GitHub Actions pipeline, a Kubernetes service account -- workload identity federation extends that same secret-free idea across the trust boundary: it exchanges a token issued by the workload's own identity provider for a Microsoft Entra ID token, using a federated credential trust configured on an app registration or managed identity, with no client secret or certificate stored, and therefore nothing left to rotate or leak.

Once an app is registered, what it's actually allowed to do comes down to its API permissions. A delegated permission lets the app act on behalf of a signed-in user, capped by whatever that user could already do themselves -- fine for an interactive app. An application permission instead lets the app act as itself, with no user signed in at all, which is why it's the choice for an unattended background service, and why it typically requires admin consent rather than a user simply approving it for themselves: it's inherently more powerful, standing access rather than something bounded by one person's own rights. Getting users into an enterprise application in the first place can go several ways: SAML or OpenID Connect SSO, where the app trusts an Entra-issued token directly; password-based SSO, where Entra just stores and auto-fills a separate password the app still requires; or linked SSO, a plain shortcut to an app that already handles its own sign-in. For a legacy on-premises web app that predates all of this, Microsoft Entra application proxy publishes it for secure remote access through a lightweight, outbound-only connector -- no inbound firewall port ever has to open -- while still applying the same Conditional Access and SSO experience used for a cloud-native SaaS app.""",
        'fundamentalsLabel': 'New to app identities and permissions? See the everyday analogy',
        'fundamentals': "An app registration is like a business's official charter, filed once wherever the business was founded -- the enterprise application is more like that business opening a branch office in a new city, with its own local staff, hours, and local permits, even though it's still legally the same company. A managed identity is like giving an employee a company badge that self-destructs the day they're let go, so nobody has to remember to collect it; a user-assigned one is more like a master key handed to whichever employee currently needs it, that keeps existing in the drawer even after any one employee leaves. And a delegated permission versus an application permission is the difference between a delivery driver who can only sign for packages addressed to whoever hired them that day, versus a courier company itself holding a standing contract to sign for anything addressed to the building.",
        'keyTerms': ['app registration', 'enterprise application', 'service principal types', 'System-assigned', 'user-assigned managed identity', 'Workload identity federation', 'delegated permission', 'application permission', 'Admin consent', 'application proxy'],
        'commonTraps': [
            "Consenting to another vendor's multi-tenant app creates only the enterprise application/service principal in your tenant -- not a new app registration of your own.",
            "A system-assigned managed identity can't be shared across resources and disappears the moment its resource is deleted; that's what a user-assigned identity is for.",
            "Application permissions typically need admin consent because they grant standing, unattended access -- not because they're simply 'the bigger option.'",
            "Password-based SSO still requires a real password on the target app; Entra just stores and injects it -- SAML/OIDC SSO replace the password with a trusted token entirely.",
        ],
        'scenario': "A company automates its infrastructure deployments from GitHub Actions and originally stored an app registration's client secret as a repository variable, which then caused an outage when it silently expired. Switching to workload identity federation -- a federated credential trust between GitHub's own token issuer and the app registration -- removes that secret from the picture entirely, so there's nothing left to expire or rotate. Once deployed, that same pipeline calls Microsoft Graph unattended, with no user signed in, so it's granted an application permission rather than a delegated one, and because that permission is high-privilege, it requires a designated administrator's explicit admin consent before the pipeline can use it.",
        'onTheJob': "A leaked or expired app secret sitting in a CI/CD pipeline's config is one of the most common real-world causes of a 3am outage page, which is exactly the failure mode workload identity federation is designed to make structurally impossible instead of just harder to hit. The difference between a system-assigned and a user-assigned managed identity is the kind of thing that only becomes painfully obvious the first time someone redeploys a Function app and discovers its identity -- and every role assignment tied to it -- vanished along with it. And an access-governance audit will flag an application permission granted without documented admin consent every time, because standing, unattended access is exactly the kind of thing auditors are trained to hunt for.",
    },
    {
        'id': 'identity-governance-pim',
        'title': 'Identity Governance: PIM, Entitlement & Lifecycle',
        'summary': 'Just-in-time privileged access, access packages, access reviews, terms of use, and lifecycle automation.',
        'diagram': 'rbacScope',
        'vocabIds': ['f29', 'f30', 'f31', 'f32', 'f33', 'f34', 'f35', 'f38', 'f40'],
        'quizIds': ['q23', 'q25', 'q27', 'q29', 'q36', 'q37', 'msq8'],
        'reading': """Privileged Identity Management reframes a privileged role assignment as something requested just-in-time rather than held permanently. An eligible assignment means a user can activate a role -- an Azure RBAC role at a resource scope, or a Microsoft Entra directory role like Global Administrator, since PIM covers both under the same model -- only when they actually need it, typically after completing MFA, supplying a written justification, and possibly waiting for a designated approver to sign off, for a capped maximum duration. An active assignment, by contrast, is already in effect with no activation step at all. Requiring approval specifically means MFA and justification alone aren't enough -- the request sits with a reviewer until they explicitly approve it, not on any kind of automatic timer. When several distinct role assignments are already bundled onto one group, PIM for Groups -- built on the underlying idea of a privileged access group -- extends that same eligible/active activation model to membership or ownership of the group itself, activating the whole bundle of permissions at once rather than configuring PIM separately, role by role.

Entitlement management's access packages solve a different problem: letting a user -- internal or an external guest -- request a bundle of resources (a group, a Teams site, an application) through a defined approval workflow, often with a built-in expiration date, instead of an administrator manually adding them to each resource by hand. A connected organization extends that same self-service request model to an entire partner tenant, registering it so its users become visible as eligible requestors without each one first needing to already exist as a guest in your directory -- though a connected organization only makes them a candidate; the request itself still runs through the package's own approval workflow. Access reviews handle the other side of the same lifecycle: periodically asking a designated reviewer -- a manager, a resource owner, or users themselves -- to confirm that existing access to a group, an application, or a role assignment is still actually needed, and automatically removing it if nobody confirms within the review window. Running a recurring access review specifically scoped to guest users is the standard, systematic answer to the very common problem of forgotten B2B guest accounts left over from a since-completed project, quietly retaining access years after anyone remembers inviting them.

A terms of use policy adds one more gate before access is granted at all: a user has to view and explicitly accept a specified document, commonly required of external guests or contractors before they touch anything, enforced as a Conditional Access grant control and reportable down to exactly who has and hasn't accepted the current version -- and it can be configured to expire and force reacceptance periodically. Identity Governance lifecycle workflows automate the tasks tied to a user's joiner, mover, and leaver events, so a new hire's welcome email and initial access provision, or a departing employee's account disablement and access removal, happen automatically on their recorded date rather than depending on IT and HR coordinating that timing by hand. None of this governance framework, though, should ever be able to lock every administrator out at once -- which is exactly why every organization keeps break-glass emergency access accounts: cloud-only accounts with permanent Global Administrator access, deliberately excluded from the Conditional Access policies that could block them and outside normal PIM activation, protected instead by strong phishing-resistant credentials stored securely offline and by sign-in alerts, whose entire purpose is to still work when everything else -- an MFA provider outage, a misconfigured Conditional Access policy -- has failed.""",
        'fundamentalsLabel': 'New to identity governance? See the everyday analogy',
        'fundamentals': "PIM's eligible-versus-active distinction is like the difference between a hotel keeping a master key locked in a safe that any manager can check out for their shift with a manager's sign-off (eligible, activated when needed) versus just handing every manager a master key to carry around permanently (active, standing access) -- the safe version means nobody's carrying more access than the moment actually calls for. An access package is like a new employee filling out one request form for a badge, a parking pass, and a locker key together, routed to one approver, instead of visiting three separate offices. An access review is the annual audit where someone actually checks whether everyone who still has a badge should still have one. And a break-glass account is literally the fire axe behind glass: something nobody touches in the ordinary course of business, kept specifically for the day the normal front door simply won't open.",
        'keyTerms': ['eligible assignment', 'active assignment', 'PIM for Groups', 'access packages', 'connected organization', 'Access reviews', 'terms of use policy', 'lifecycle workflows', 'break-glass emergency access accounts'],
        'commonTraps': [
            "Requiring PIM approval means MFA and justification alone don't activate the role -- a designated approver still has to explicitly sign off.",
            "A connected organization only makes a partner's users visible as eligible requestors -- it does not itself grant them any access.",
            "An access review's configured default decision (auto-approve, auto-deny, or no change) is what applies if a reviewer never acts, not indefinite extension or automatic revocation.",
            "Break-glass accounts must be excluded from the Conditional Access policies that could block them, and protected with strong credentials and monitoring instead -- the whole point is that they still work when everything else has failed.",
        ],
        'scenario': "An on-call rotation of engineers needs Exchange Administrator only during their on-call week, not permanently, so the team configures a PIM eligible assignment requiring MFA, justification, and approval, capped at a four-hour activation window -- nobody carries standing Global Admin-adjacent rights between shifts. Separately, a partner firm's employees need to self-request access to a shared Teams site and SharePoint library; the team registers the partner as a connected organization and bundles both resources into a single access package with a 90-day expiration and a recurring access review scoped specifically to guest membership, so anyone whose access lapses unnoticed still gets caught and removed automatically. Underneath all of it, two break-glass accounts sit excluded from the Conditional Access policies that could block them, checked weekly for any sign-in activity, ready in case a future Conditional Access misconfiguration ever locks out every other administrator at once.",
        'onTheJob': "Access reviews are the task nobody on a team ever volunteers for, which is precisely why they get automated with a recurring schedule and a default decision instead of relying on a manager remembering to do it manually every quarter -- and skipping them is how a company ends up with a guest account from a project that ended two years ago still holding access nobody remembers granting. PIM's approval requirement exists because 'I have MFA and a good reason' isn't actually the same as 'someone in authority looked at this and said yes,' a distinction real privileged-access incidents keep proving matters. And break-glass accounts get tested maybe once a year if a team is disciplined, which is exactly the risk: the one time a Conditional Access misconfiguration locks out every real admin is also the one time nobody remembers whether the break-glass credentials still actually work. Access packages in entitlement management show up again on SC-500 too, where a Cloud & AI Security Engineer relies on the same request-and-approval bundles to grant scoped access to Azure resources and AI tooling, so a well-designed access package catalog built for SC-300-style identity governance tends to get reused rather than rebuilt once a security engineering team layers Azure resource access on top of it.",
    },
]

CHEAT_SHEET = [
    {
        'heading': 'Exam-day strategy',
        'points': [
            'Check the current exam page for the exact question count and time limit (Microsoft role-based exams typically run roughly 40-60 questions) and work out your per-question average before you start. Budget more time for multi-part scenario questions and less for straight recall, rather than pacing every question identically.',
            "Real scoring isn't a flat percentage of questions right (some count for more than others) — treat 70%+ as a safe buffer to aim for, not an exact threshold to just clear.",
            "Flag anything you're unsure of and move on rather than stalling — a question later in the exam can sometimes jog a detail you needed earlier, and you get partial credit for nothing by running out of time on one question.",
            "On multi-select ('choose N') questions, eliminate the options you're confident are wrong first; guessing among 2 plausible answers beats guessing among 4.",
            'Your first read of a question is usually right — change an answer only when you find a specific detail you missed, not from general second-guessing.',
        ],
    },
    {
        'heading': 'Entra ID core objects',
        'points': [
            'A group can be Security (access control) or Microsoft 365 (collaboration, includes a mailbox/Teams/SharePoint site) — both support assignment or dynamic membership, but only device groups can query device attributes.',
            "Dynamic group membership rules auto-add and auto-remove members based on attribute queries — you can't mix users and devices dynamically in the same group.",
            "Administrative Units scope where a role assignment applies — for example a Helpdesk Admin restricted to just one region's users — instead of tenant-wide.",
            'A device object has a trust type: Entra ID joined, Entra ID registered (BYOD), or hybrid Entra ID joined (synced from on-prem AD) — this affects which Conditional Access device-state checks apply.',
        ],
    },
    {
        'heading': 'Conditional Access policy components',
        'points': [
            'A CA policy has Assignments (users/groups, cloud apps, conditions like location or sign-in risk) and Access controls (grant, e.g. require MFA or a compliant device; or session, e.g. sign-in frequency).',
            'Grant controls decide whether access is allowed at all; session controls limit what happens after access has already been granted — they never block sign-in.',
            'Multiple grant controls on one policy can be set to require ALL of them or require ANY ONE of them — you choose that combination explicitly.',
            'Named locations are a condition you build separately and then reference inside CA policies — they are not a stand-alone security control on their own.',
            "The 'What If' tool simulates which policies would apply to a given sign-in without enforcing anything, useful for troubleshooting policy design.",
        ],
    },
    {
        'heading': 'Authentication methods & MFA',
        'points': [
            'Passwordless methods — FIDO2 security keys, Microsoft Authenticator passwordless, Windows Hello for Business — remove the password entirely; that is not the same as ordinary MFA with a password plus a second factor.',
            'Temporary Access Pass (TAP) is a time-limited passwordless credential used for onboarding or account recovery, not an everyday sign-in method.',
            'Combined registration lets users register authentication methods for both SSPR and MFA in a single experience.',
            "Security defaults (a free, one-size-fits-all baseline requiring MFA) and Conditional Access policies are mutually exclusive on a tenant — you generally can't run both at once.",
        ],
    },
    {
        'heading': 'PIM vs. standard RBAC',
        'points': [
            'Standard Azure RBAC / Entra role assignment means the permissions are active the moment the role is assigned.',
            'PIM (Privileged Identity Management) makes a role assignment eligible rather than active — the user must activate it, often with MFA, justification, and/or approval, for a time-boxed duration before it takes effect.',
            'PIM protects both Entra ID directory roles (like Global Administrator) and Azure resource roles (like Owner on a subscription) — same product, two different scopes.',
            'PIM access reviews are a recurring governance process to recertify that eligible or active assignments are still needed, not a one-time setup step.',
        ],
    },
    {
        'heading': 'External identities: B2B & B2C',
        'points': [
            'B2B collaboration invites an external partner or vendor into your tenant as a guest, authenticating with their own home identity provider.',
            'Azure AD B2C is a separate, customer-facing identity solution for your own customer-facing apps, built on a different underlying tenant type than B2B; it is no longer sold to new customers, and Microsoft Entra External ID is the successor for customer scenarios.',
            "Cross-tenant access settings control inbound (their users into your tenant) and outbound (your users into theirs) B2B trust, including whether to trust the other tenant's MFA/device compliance claims.",
            'Guest users have more restricted directory object visibility than members by default, unless external collaboration settings are changed.',
        ],
    },
    {
        'heading': 'App registrations & enterprise apps',
        'points': [
            "An App Registration is the global definition of an application; its Enterprise Application (service principal) is the local, tenant-specific instance that actually gets permissions and user assignments in a given tenant.",
            "Every app registration gets a service principal in its home tenant automatically; when users in another tenant consent to it, a service principal is created there too.",
            'API permissions come in two types: Delegated (the app acts as the signed-in user, limited to what that user could do) vs. Application (the app acts as itself, often needing admin consent, with no signed-in user context).',
            'Admin consent is required for higher-privilege or Application-type permissions; user consent, if the tenant allows it, can cover many lower-risk Delegated permissions.',
        ],
    },
    {
        'heading': 'Exam-day reminders',
        'points': [
            "SC-300 leans on scenarios — read carefully for whether the requirement is about a person's identity, an app's identity, or a device's identity, since each maps to a different tool (CA conditions, PIM, app permissions, device compliance).",
            'Time-limited or just-in-time elevated access almost always means PIM, not a standing RBAC assignment.',
            "An external partner needing occasional access without a licensed account in your tenant is a B2B guest scenario, not B2C and not a regular member account.",
            'Blocking or limiting behavior after sign-in — forcing reauthentication, restricting downloads in a browser — is a Conditional Access session control, not a grant control.',
        ],
    },
]

MADLIBS = [
    {
        'id': 'ml-sc300-1',
        'cat': 'userIdentities',
        'scenario': "A company wants passwords validated in real time against on-premises Active Directory during every cloud sign-in, with no password hash of any kind ever stored in Microsoft Entra ID — that calls for {b1}. A different team instead just wants a hash of the password hash synced to the cloud so sign-in keeps working even during a brief on-premises outage — that's {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['Pass-through Authentication (PTA)', 'Password Hash Sync (PHS)', 'Federation with AD FS', 'Seamless single sign-on'], 'correct': 0},
            {'key': 'b2', 'options': ['Pass-through Authentication (PTA)', 'Password Hash Sync (PHS)', 'Federation with AD FS', 'Password writeback'], 'correct': 1},
        ],
        'explanation': "PTA validates each sign-in directly against on-premises AD via a lightweight agent, storing no password hash in the cloud at all. PHS instead syncs a hash of the password hash to Entra ID, letting sign-in succeed even if on-premises AD is briefly unreachable — the opposite resilience trade-off from PTA.",
    },
    {
        'id': 'ml-sc300-2',
        'cat': 'authAccessMgmt',
        'scenario': "Microsoft Entra ID Protection flags a user's credentials as leaked on the dark web, which raises their {b1} — a signal evaluated independently of any single sign-in attempt. A completely separate authentication attempt from an unfamiliar location and impossible travel pattern instead raises {b2}, judged purely on that one attempt's own signals.",
        'blanks': [
            {'key': 'b1', 'options': ['user risk', 'sign-in risk', 'device compliance', 'application risk'], 'correct': 0},
            {'key': 'b2', 'options': ['user risk', 'sign-in risk', 'device compliance', 'application risk'], 'correct': 1},
        ],
        'explanation': "User risk reflects the likelihood a user's identity itself is compromised (such as from leaked credentials) and is tracked independently of any one sign-in. Sign-in risk instead judges the authenticity of one specific sign-in attempt, based on signals like impossible travel — the two are evaluated and remediated separately, not combined into one score.",
    },
    {
        'id': 'ml-sc300-3',
        'cat': 'identityGovernance',
        'scenario': "On-call engineers need the Exchange Administrator role only when needed, requiring MFA and justification, for a maximum of four hours — that calls for a PIM {b1} assignment rather than a {b2} one that would leave them holding the role at all times.",
        'blanks': [
            {'key': 'b1', 'options': ['eligible', 'permanent', 'active', 'standing'], 'correct': 0},
            {'key': 'b2', 'options': ['eligible', 'permanent', 'time-bound', 'just-in-time'], 'correct': 1},
        ],
        'explanation': "An eligible assignment requires an explicit activation step, with MFA, justification, and a maximum duration, before the role becomes active — exactly the just-in-time model this scenario needs. A permanent (active, standing) assignment instead grants the role continuously with no activation step, which is precisely the always-on access the on-call team wants to avoid.",
    },
    {
        'id': 'ml-sc300-4',
        'cat': 'workloadIdentities',
        'scenario': "A CI/CD pipeline running in GitHub Actions needs to deploy to Azure resources without ever storing a client secret or certificate in the pipeline's configuration. The team configures a {b1} on the app registration, trusting GitHub's OIDC token issuer for that specific repo and branch. Separately, a scheduled batch job running as an Azure VM needs to read from a storage account, and the platform team wants Azure to manage the credential's rotation automatically with zero setup burden, so they assign it a {b2} instead.",
        'blanks': [
            {'key': 'b1', 'options': ['federated identity credential', 'client secret', 'self-signed certificate', 'password-based credential'], 'correct': 0},
            {'key': 'b2', 'options': ['system-assigned managed identity', 'federated identity credential', 'service principal with a client secret', 'user-assigned application registration'], 'correct': 0},
        ],
        'explanation': "A federated identity credential lets an external workload (like a GitHub Actions run) exchange its own OIDC token for a Microsoft Entra token with no secret ever stored in the pipeline, based on trust in the issuer and a matching subject claim. A managed identity is the right fit for compute Azure itself hosts, like a VM, since Azure creates, rotates, and secures the credential automatically with no federation setup needed at all — the two solve the same 'no stored secret' goal for two different hosting situations.",
    },
    {
        'id': 'ml-sc300-5',
        'cat': 'authAccessMgmt',
        'scenario': "A Conditional Access policy is created with the assignments and grant control fully configured, but the administrator leaves the enable policy toggle set to {b1} while validating it — it evaluates in the sign-in logs as if it would apply, but no sign-in is actually blocked or challenged. Once satisfied, she flips it to On. A different, older policy is retired by switching it to {b2} rather than deleting it outright, so its configuration is preserved for later reference and audit even though it no longer affects any sign-in.",
        'blanks': [
            {'key': 'b1', 'options': ['Report-only', 'Off', 'On', 'Disabled'], 'correct': 0},
            {'key': 'b2', 'options': ['Off', 'Report-only', 'On', 'archived'], 'correct': 0},
        ],
        'explanation': "Report-only mode evaluates a policy against real sign-ins and logs what would have happened, without enforcing any grant or block control — exactly what's needed to validate a policy safely before going live. Off fully retires a policy while keeping its full configuration intact for later review, which is the intended way to retire (not delete) an old policy that's no longer meant to apply.",
    },
]

# Mini case studies (ROADMAP.md section 4): a shared scenario with several
# related questions answered in sequence, mirroring how a real exam groups
# multiple questions off one larger case rather than testing each fact in
# isolation. Every embedded question still follows the same mc/tf/ms shape
# as QUESTIONS above (see build.py's CASE_STUDIES validation) — only the
# shared scenario and the grouping are new.
CASE_STUDIES = [
    {
        'id': 'cs-sc300-meridian-health',
        'cat': 'authAccessMgmt',
        'title': "Meridian Health Group's External Access Overhaul",
        'scenario': (
            "Meridian Health Group is a mid-size healthcare network rolling out Microsoft Entra ID "
            "across its clinics and back-office systems. Three groups need access: full-time clinical "
            "staff (internal members), a set of external billing contractors who need access to a "
            "claims-processing web app but are not Meridian employees, and a two-person IT security "
            "team that occasionally needs Global Administrator rights to fix urgent directory issues. "
            "The security team is worried about being locked out of the tenant entirely if Conditional "
            "Access is ever misconfigured or an MFA provider has an outage, so they want at least one "
            "safeguard for that scenario. They also want the billing contractors held to a stricter "
            "access bar than internal staff, since the claims app exposes protected health information. "
            "Finally, the Global Administrator role should never sit active on any account day-to-day — "
            "it should only become usable for a short window, and only after justification and approval."
        ),
        'questions': [
            {
                'id': 'cs-sc300-meridian-health-q1',
                'type': 'mc',
                'question': "To guard against being fully locked out of the tenant if Conditional Access is ever misconfigured or MFA has an outage, what should the security team create and exclude from the Conditional Access policies that could block it?",
                'options': [
                    "One or more emergency access ('break-glass') accounts, excluded from the blocking Conditional Access policies and closely monitored for any sign-in activity",
                    "A second set of Global Administrator accounts with the same Conditional Access policies applied as everyone else",
                    "A Conditional Access policy that exempts all administrators from MFA by role",
                    "A PIM eligible assignment for Global Administrator with no activation requirements",
                ],
                'correct': 0,
                'explanation': "A dedicated emergency access account, excluded from Conditional Access policies (and typically secured with a very strong credential and heavy sign-in monitoring instead), is the standard safeguard against a tenant-wide CA misconfiguration or MFA outage locking everyone out. Applying identical CA policies to a backup admin account does not remove the lockout risk, and broadly exempting admins from MFA by role trades one security gap for another rather than solving the lockout scenario.",
            },
            {
                'id': 'cs-sc300-meridian-health-q2',
                'type': 'tf',
                'question': "True or false: because the billing contractors are external users rather than Meridian employees, Conditional Access policies do not apply to them unless a separate, contractor-specific policy is created from scratch.",
                'answer': False,
                'explanation': "Conditional Access applies to guest/external users the same way it applies to members whenever a policy's user assignment includes them (directly, via a group, or via an 'All users' scope that includes guests) — there's no separate exemption by default. The task here isn't creating access from nothing, it's scoping a policy (or an additional, stricter one) to that specific set of external users.",
            },
            {
                'id': 'cs-sc300-meridian-health-q3',
                'type': 'ms',
                'question': "Which controls would appropriately hold the billing contractors to a stricter bar than internal clinical staff for the claims-processing app? (Select all that apply.)",
                'options': [
                    "A Conditional Access policy scoped to the contractors' group requiring a compliant or Microsoft Entra hybrid joined device",
                    "Requiring acknowledgment of a terms of use policy before access to the app is granted",
                    "Removing MFA entirely for the contractors' accounts to simplify their sign-in",
                    "A Conditional Access policy scoped to the contractors' group requiring MFA on every sign-in to that app",
                ],
                'correct': [0, 1, 3],
                'explanation': "Requiring a compliant/hybrid-joined device, a terms of use acknowledgment, and per-sign-in MFA are all standard Conditional Access and governance controls for tightening access to a sensitive app for a specific population. Removing MFA does the opposite of what's asked — it weakens the contractors' access bar instead of raising it above the internal staff baseline.",
                'whyTested': "The scenario states the stricter-bar requirement once and then lists several plausible controls, only one of which is actually a loosening of security — the skill being tested is catching that one option contradicts the stated goal rather than assuming every plausible-sounding security control belongs in the 'select all' answer.",
            },
            {
                'id': 'cs-sc300-meridian-health-q4',
                'type': 'mc',
                'question': "Which Privileged Identity Management (PIM) configuration ensures Global Administrator never sits active by default, and only becomes usable for a short window after justification and approval?",
                'options': [
                    "A permanent active assignment with a Conditional Access policy requiring MFA to sign in",
                    "An eligible assignment with activation requiring approval, MFA, justification, and a maximum activation duration",
                    "A permanent eligible assignment with no maximum activation duration set",
                    "Adding the two IT security team members directly to the Global Administrators group with no PIM involvement",
                ],
                'correct': 1,
                'explanation': "An eligible PIM assignment configured to require approval, MFA, and justification, with a bounded maximum duration, is exactly the just-in-time model this scenario needs — the role stays inactive until someone deliberately activates it and self-expires afterward. A permanent active assignment (with or without a CA MFA requirement) still leaves the role usable at all times, which is precisely what the security team wants to avoid, and skipping PIM entirely removes the activation, approval, and time-bound behavior altogether.",
            },
        ],
    },
]

# ---------------------------------------------------------------------------
# Second content pass: additional flashcards f48-f62 (above) and questions
# q47-q54 / tf20-tf25 / msq11-msq13 (below) targeting genuine gaps found by
# cross-referencing LESSONS reading/keyTerms and the official SC-300
# skills-measured objectives against what FLASHCARDS/QUESTIONS already
# covered (device join types, group naming policy, guest default access
# restrictions, Azure AD B2C, security defaults, the Conditional Access
# What If tool, Password Protection/smart lockout, session controls, app
# registration supported account types, SCIM provisioning, publisher
# verification/step-up consent, app roles, segregation of duties,
# entitlement management catalogs, and PIM alerts).
# ---------------------------------------------------------------------------
_ADDITIONAL_QUESTIONS = [
    {
        'id': 'q47',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'A Conditional Access policy requires a Microsoft Entra hybrid joined device for access to the payroll app. Which device satisfies the requirement?',
        'options': [
            'A personal iPhone registered with Microsoft Entra ID and enrolled in Intune',
            'A Windows laptop joined directly to Microsoft Entra ID and marked compliant in Intune',
            'A personal Windows laptop where the owner added a work account, making it Microsoft Entra registered',
            'An on-premises domain-joined Windows desktop that has completed hybrid join',
        ],
        'correct': 3,
        'explanation': 'Hybrid joined means the device is joined to on-premises Active Directory and also present in Microsoft Entra ID, which describes the domain-joined desktop. A cloud-only Entra joined laptop can be fully compliant but is a different join type, so it does not meet a hybrid joined requirement. A registered iPhone and a registered personal laptop are BYOD registrations that add only a work account and never become hybrid joined.',
    },
    {
        'id': 'q48',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': "Contoso's default settings let guests see limited directory information. After a data-exposure review, security wants guests to be unable to enumerate other users and groups at all, while still reaching the resources shared with them. What should be changed?",
        'options': [
            'Require terms of use acceptance before guests can read the directory listing',
            'Restrict guest invitations so only administrators can invite new guests',
            'Set guest user access to the same level as members in the external collaboration settings',
            'Limit guest access to only their own directory objects in the external collaboration settings',
        ],
        'correct': 3,
        'explanation': 'The external collaboration settings offer three guest access levels, and the most restrictive one limits guests to their own directory objects so they cannot list other users and groups, while resource access granted to them still works. The same-as-members level does the opposite. A terms of use policy gates access until the document is accepted but does not change what the directory exposes afterward. Restricting who can invite guests controls how guests arrive, not what they can see.',
    },
    {
        'id': 'q49',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'A small Contoso subsidiary uses security defaults and now needs to exempt one emergency access account from MFA and to require MFA only for administrators. What should the administrator do?',
        'options': [
            'Add the emergency account to the exclusion list in security defaults',
            "Remove the emergency account's MFA registration so security defaults will not challenge it",
            'Turn off security defaults and create Conditional Access policies with the emergency account excluded',
            'Create the Conditional Access policies while leaving security defaults enabled',
        ],
        'correct': 2,
        'explanation': 'Security defaults apply one fixed baseline with no per-user exclusions and cannot run alongside Conditional Access, so the needs to scope MFA and exempt an account can only be met by turning it off and building policies. Security defaults have no exclusion list to add the account to. Conditional Access policies cannot be enabled while security defaults are on. Removing the registration does not exempt the account, because security defaults would still require it to register.',
    },
    {
        'id': 'q50',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "A botnet is guessing passwords against a Contoso executive's account from unfamiliar locations. The executive must still be able to sign in from familiar locations while the attacker's attempts are locked out. Which feature provides this?",
        'options': [
            'Self-service password reset with a second verification method',
            'Smart lockout with a configured lockout threshold and duration',
            'The custom banned password list in Microsoft Entra Password Protection',
            'A Conditional Access policy that requires MFA for the executive',
        ],
        'correct': 1,
        'explanation': 'Smart lockout tracks failed attempts and treats familiar and unfamiliar locations differently, so the attacker is locked out while the legitimate user continues to sign in. The banned password list prevents weak passwords from being chosen and does nothing about repeated guessing. Requiring MFA protects against a correct guessed password but does not stop or lock out the guessing. Self-service password reset helps a user recover a forgotten password and plays no part in blocking an attack.',
    },
    {
        'id': 'q51',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'A consumer-facing productivity add-in should let a user from any Microsoft Entra organization sign in, and also let someone with only a personal Outlook.com account sign in. Which supported account types setting should the app registration use?',
        'options': [
            'Accounts in any organizational directory (multitenant) and personal Microsoft accounts',
            'Accounts in this organizational directory only, which limits sign-in to a single tenant',
            'Personal Microsoft accounts only, such as Outlook.com and Xbox accounts',
            'Accounts in any organizational directory (multitenant) only, which excludes personal accounts',
        ],
        'correct': 0,
        'explanation': "Only the combined multitenant and personal accounts option accepts both any Entra organization's users and personal accounts such as Outlook.com. The single-tenant setting blocks every other organization. The multitenant-only setting accepts organizational accounts but rejects the personal Outlook.com user. The personal-accounts-only setting does the reverse and rejects every organizational sign-in.",
    },
    {
        'id': 'q52',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'A line-of-business application wants users assigned to it to receive either a Reader or an Approver role inside their token claims, so the application itself can enforce different in-app permissions per user. Which Microsoft Entra ID feature supports this?',
        'options': [
            'A Conditional Access authentication strength requiring specific sign-in methods',
            'App roles defined on the app registration and assigned through the enterprise application',
            'A delegated Microsoft Graph permission granted to the app by users who sign in',
            'An application permission granted to the app with tenant-wide admin consent',
        ],
        'correct': 1,
        'explanation': 'App roles are defined by the developer on the registration, assigned to users or groups on the enterprise application, and delivered in the token so the app can authorize each user. Delegated and application permissions control what the app may do against an API such as Microsoft Graph, not what each user may do inside the app. An authentication strength governs which sign-in methods satisfy a policy and carries no in-app role information.',
    },
    {
        'id': 'q53',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "A business unit's manager, who is not a directory administrator, needs to build and publish access packages using only that unit's own groups and apps. The manager must receive no broader administrative rights. What should be configured?",
        'options': [
            "A Conditional Access policy for the business unit's group that exempts the manager",
            'The Identity Governance Administrator role assigned to the manager',
            "A catalog containing the business unit's resources, with the manager as catalog owner",
            "An administrative unit containing the business unit's users, with the manager as a scoped administrator",
        ],
        'correct': 2,
        'explanation': 'A catalog limits which resources can go into access packages, and a catalog owner can build and publish packages from just those resources without any directory-wide role. The Identity Governance Administrator role is tenant-wide and would let the manager govern every catalog, violating the no-broader-rights requirement. An administrative unit scopes the management of user accounts, not authoring of access packages. A Conditional Access exemption affects sign-in conditions and grants no authoring rights.',
    },
    {
        'id': 'q54',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Every new hire in the Finance department should automatically receive a specific access package as soon as their user attributes show they have joined Finance, with no one submitting or approving a request. Which entitlement management feature supports this?',
        'options': [
            'A recurring access review of the Finance department with auto-apply enabled',
            'A request-based policy that auto-approves requests from users in the Finance department',
            'An auto-assignment policy on the package using a rule that matches Finance department users',
            'A lifecycle workflow with a joiner trigger that sends Finance new hires a welcome email',
        ],
        'correct': 2,
        'explanation': 'An auto-assignment policy evaluates a rule against user attributes and assigns the package to every match, with no request step at all. A request-based policy with automatic approval still requires each user to submit a request first. A lifecycle workflow can send email and run tasks, but it does not grant an access package by attribute rule on its own. An access review reassesses access that already exists and never grants new access.',
    },
    {
        'id': 'tf20',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': 'A group naming policy applies its prefix and blocked-word rules to security groups as well as to Microsoft 365 groups.',
        'answer': False,
        'explanation': 'The naming policy governs Microsoft 365 groups created across workloads, such as Teams and Outlook. Security groups are not subject to it, so it cannot be used to standardize the names of groups created for access control.',
    },
    {
        'id': 'tf21',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'A user in Berlin reports that last night, opening the finance app demanded a compliant device. An administrator needs to see which Conditional Access policies were evaluated for that exact event and what each one returned. Which tool should be used?',
        'options': [
            'The Conditional Access details on that event in the sign-in logs',
            'Report-only mode on the policy, then asking the user to sign in again',
            'The Conditional Access insights and reporting workbook',
            'The What If tool, entering the user, the app, and the location',
        ],
        'correct': 0,
        'explanation': 'The sign-in log records, for each real event, which policies applied and whether each succeeded, failed, or did not apply, using the conditions at that moment. What If simulates a hypothetical sign-in from values the administrator enters, so it can differ from what actually happened, such as the device state or risk level at the time. Report-only mode is forward-looking and requires reproducing the event. The insights workbook summarizes impact across many sign-ins rather than explaining one event.',
    },
    {
        'id': 'tf22',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'With the default provisioning scope for a gallery app, only users and groups assigned to the enterprise application are provisioned to the SaaS app.',
        'answer': True,
        'explanation': "Automatic provisioning defaults to syncing only assigned users and groups, so unassigned users never get an account in the target app. Changing the scope to all users and groups is possible but is a deliberate choice, and removing a user's assignment takes them out of scope for deprovisioning.",
    },
    {
        'id': 'tf23',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'Risk-based step-up consent is evaluated only when user consent has been disabled for the entire tenant.',
        'answer': False,
        'explanation': 'Step-up consent matters precisely when user consent is allowed: it overrides that permissive setting and requires admin consent for a request that Microsoft Entra ID judges unusually risky. If user consent were already disabled, every request would need an administrator anyway.',
    },
    {
        'id': 'tf24',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "A quarterly access review of a large group uses each member's manager as the reviewer. Some members have no manager attribute set. The administrator wants a person other than the member to review every member's access. What should be configured in the review?",
        'options': [
            'Self-review for the whole group instead of manager review',
            'Fallback reviewers who review members that have no manager',
            'A default decision that removes access when reviewers do not respond',
            'A scope that excludes members who have no manager',
        ],
        'correct': 1,
        'explanation': 'Fallback reviewers are the reviewers asked when the primary reviewer, here the manager, cannot be determined, so every member gets a human reviewer other than themselves. Self-review would make every member assess their own access, which the stem rules out. A remove-on-no-response default strips access without any review rather than reviewing it. Excluding members with no manager leaves exactly the people the administrator is worried about unreviewed.',
    },
    {
        'id': 'tf25',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': 'A PIM alert warning about too many permanent Global Administrators automatically converts the excess assignments to eligible.',
        'answer': False,
        'explanation': 'PIM alerts only flag risky configurations so an administrator can investigate. Changing the assignments is a separate action, which an administrator can take manually or by using discovery and insights to convert existing permanent assignments to eligible.',
    },
    {
        'id': 'msq11',
        'cat': 'userIdentities',
        'type': 'ms',
        'question': 'Which two requirements can be met only with B2B collaboration guest users, and not with B2B direct connect? (Choose two.)',
        'options': [
            'Partner employees must open documents on a Contoso SharePoint site',
            'Contoso must hold no directory object for the partner employees',
            'Partner employees must take part in a Teams shared channel hosted by Contoso',
            'Partner employees must be assigned to a Contoso enterprise application',
        ],
        'correct': [0, 3],
        'explanation': 'B2B direct connect is limited to Teams shared channels and creates no guest object, so anything that needs a directory object, such as SharePoint access or an enterprise application assignment, requires B2B collaboration. Participation in a shared channel is exactly what direct connect is for, and the requirement to hold no directory object is one only direct connect can meet, so neither belongs in the answer.',
    },
    {
        'id': 'msq12',
        'cat': 'authAccessMgmt',
        'type': 'ms',
        'question': 'Which two statements correctly distinguish authentication strengths from authentication contexts? (Choose two.)',
        'options': [
            'Authentication strengths and authentication contexts are both configured in the authentication methods policy',
            'An authentication strength defines which combinations of methods satisfy a Conditional Access requirement',
            'An authentication context labels a sensitive action so a policy can demand extra verification there',
            'An authentication context decides which authentication methods a user is allowed to register',
        ],
        'correct': [1, 2],
        'explanation': 'A strength is a grant control describing acceptable method combinations, while a context is a label that lets a policy apply a requirement to one specific action or resource. Which methods a user may register is set in the authentication methods policy, which is neither a strength nor a context. Both strengths and contexts are configured under Conditional Access, not in the authentication methods policy.',
    },
    {
        'id': 'msq13',
        'cat': 'identityGovernance',
        'type': 'ms',
        'question': 'Which two statements about how lifecycle workflows are triggered and scoped are true? (Choose two.)',
        'options': [
            'A joiner or leaver workflow can trigger on the hire or leave date plus an offset',
            "A workflow's scope can only be a fixed list of named users, not a rule over user attributes",
            'A mover workflow can be triggered by a change to a user attribute, such as department',
            "A mover workflow can be triggered by a change in the user's sign-in location",
        ],
        'correct': [0, 2],
        'explanation': "Joiner and leaver workflows use time-based triggers on date attributes with an offset, and mover workflows can trigger on attribute changes such as department. A workflow's scope is a rule over user attributes, so it is not limited to a fixed list of users. Sign-in location is not a lifecycle workflow trigger.",
    },
]

QUESTIONS.extend(_ADDITIONAL_QUESTIONS)

# ---------------------------------------------------------------------------
# Third content pass: additional flashcards f63-f77 (above) and questions
# q55-q65 / tf26-tf29 / msq14-msq15 (below) targeting genuine gaps found by
# re-reading the full FLASHCARDS/QUESTIONS/LESSONS content added in the
# first two passes and cross-referencing the official SC-300 skills-measured
# objectives (restricted management administrative units, group-based
# licensing, B2B direct federation with a non-Entra SAML/WS-Fed identity
# provider, Conditional Access authentication context, custom authentication
# extensions, certificate-based authentication, application management
# policies, Kerberos Constrained Delegation and connector groups for
# Application Proxy, app registration owners, workload identity risk
# detection, PIM discovery and insights, multi-stage access package approval,
# access review recommendations, and access package requestor scope).
# ---------------------------------------------------------------------------
_ADDITIONAL_QUESTIONS_2 = [
    {
        'id': 'q55',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': 'Contoso keeps its emergency access accounts in a dedicated administrative unit. A tenant-wide Helpdesk Administrator must be unable to reset passwords or edit those accounts, and only administrators with roles scoped to that unit may manage them. What should the unit use?',
        'options': [
            'A dynamic membership rule on the administrative unit',
            'A privileged access group that is eligible for activation',
            'Restricted management enabled on the administrative unit',
            'A custom role without password reset, assigned to the help desk',
        ],
        'correct': 2,
        'explanation': "Restricted management protects the objects in the unit from modification by tenant-wide administrators, so only roles assigned at that unit's scope can manage them. A dynamic membership rule only decides which accounts belong to the unit and does not change who can manage them. A privileged access group controls just-in-time membership of a group, not who may modify specific accounts. A custom role without password reset would limit the help desk for every user in the tenant, not just these accounts.",
    },
    {
        'id': 'q56',
        'cat': 'userIdentities',
        'type': 'mc',
        'question': "A partner company uses Okta as its corporate sign-in system and has no Microsoft Entra ID or Google Workspace tenant. Contoso wants the partner's employees to sign in as B2B guests using their existing Okta credentials rather than a new password. What should be configured?",
        'options': [
            "Cross-tenant access settings trusting the partner's Conditional Access claims",
            "Azure AD B2C configured for the partner's domain",
            "Direct federation with the partner's SAML or WS-Fed identity provider",
            "Email one-time passcode authentication for the partner's guests",
        ],
        'correct': 2,
        'explanation': "Direct federation sets up a trust with the partner's own SAML or WS-Fed identity provider, so guests authenticate with their existing Okta credentials. Email one-time passcodes avoid a password but do not use the Okta credentials the partner's users already have. Azure AD B2C serves an organization's own consumer-facing apps, not a partner's workforce. Cross-tenant access settings apply only when the partner runs its own Microsoft Entra tenant, which Okta alone does not provide.",
    },
    {
        'id': 'q57',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': 'A SharePoint site stores one document labeled Highly Confidential through a sensitivity label, while every other document on that site uses ordinary access. The security team wants step-up MFA required only when a user opens that one labeled document. Which Conditional Access capability fits?',
        'options': [
            'An authentication strength requiring phishing-resistant MFA for the entire SharePoint app',
            'A terms of use policy that visitors to the SharePoint site accept',
            'A named location that restricts the SharePoint site to the corporate office network',
            'An authentication context assigned to the sensitivity label and used by a dedicated policy',
        ],
        'correct': 3,
        'explanation': 'An authentication context tags one specific sensitive resource, so a policy can add a step-up requirement only there. An authentication strength set on the whole SharePoint app would apply to every document, not just the labeled one. A named location restricts where access may come from and does not depend on document sensitivity. A terms of use policy requires acceptance of a document and adds no MFA.',
    },
    {
        'id': 'q58',
        'cat': 'authAccessMgmt',
        'type': 'mc',
        'question': "An internal app needs a costCenter claim in its tokens, but that value lives only in Contoso's HR system and has no matching attribute in Microsoft Entra ID. The claim must reflect the HR value at the moment the token is issued. Which feature supports this?",
        'options': [
            'A claims mapping policy that renames an existing directory attribute to costCenter',
            'A custom security attribute that an administrator refreshes daily from an HR export',
            'An app role named costCenter that an administrator assigns to the users',
            "A custom authentication extension that calls the HR system's API at token issuance",
        ],
        'correct': 3,
        'explanation': 'A custom authentication extension calls an external REST API at the token issuance event, so the claim is added with the live HR value. A custom security attribute updated daily is only as fresh as the last manual update. A claims mapping policy can only reshape data that already exists in the directory, and the stem says no matching attribute exists. An app role carries a role label, not a changing HR value.',
    },
    {
        'id': 'q59',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': 'After incidents caused by developers creating app registration secrets valid for several years, security wants any new client secret added to any app registration to be rejected if its lifetime exceeds 90 days, without touching secrets that already exist. What should be configured?',
        'options': [
            'A PIM eligible assignment for the Application Administrator role',
            'An application management policy setting a maximum lifetime for new credentials',
            'A Conditional Access policy requiring workload identities to reauthenticate after 90 days',
            'Workload identity federation configured on the existing app registrations',
        ],
        'correct': 1,
        'explanation': 'An application management policy limits how long a newly created secret or certificate can be valid, tenant-wide or per app, and leaves existing credentials alone. Conditional Access for workload identities governs where a service principal may sign in and cannot cap how long a credential is issued for. Federation removes secrets rather than limiting their lifetime and is a far larger change than the requirement calls for. A PIM eligible assignment governs when an administrator holds a role, not credential lifetimes.',
    },
    {
        'id': 'q60',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "A finance team's legacy intranet app is published through Microsoft Entra application proxy, but after signing in through Entra ID, users are prompted a second time by the app's own Windows-integrated authentication. What should be configured to remove that second prompt?",
        'options': [
            'Kerberos Constrained Delegation configured for the app on the connector',
            "Automatic user provisioning with SCIM for that app's accounts",
            "A dedicated connector group placed near that app's backend servers",
            "Password-based single sign-on configured on the app's enterprise application",
        ],
        'correct': 0,
        'explanation': 'Kerberos Constrained Delegation lets the connector obtain a Kerberos ticket for the signed-in user toward the backend app, so the Windows-integrated prompt never appears. A dedicated connector group only influences routing and availability. Password-based SSO is for apps with their own credential form, not Windows-integrated authentication. SCIM provisioning creates and removes accounts in an app and does not handle sign-in.',
    },
    {
        'id': 'q61',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "Contoso publishes two applications through Microsoft Entra application proxy, one used mainly in Tokyo and one mainly in London. Each app's traffic should use connectors physically closest to its main users, and a connector outage for one app must not affect the other. What should be configured?",
        'options': [
            'The default connector group, relying on Microsoft Entra ID to choose the nearest connector',
            'One shared connector group containing the connectors from both offices',
            "A separate connector group for each app, containing connectors deployed near that app's main office",
            'A named location for each office in Conditional Access to steer connector selection',
        ],
        'correct': 2,
        'explanation': "Assigning each app to its own connector group, filled with connectors close to its users, gives per-app regional routing and keeps one app's connector outage from touching the other. A single shared group would pool every connector and lose both the locality and the isolation. The default group does not choose connectors by proximity to users. Named locations are Conditional Access conditions on sign-ins and do not influence which connector carries the traffic.",
    },
    {
        'id': 'q62',
        'cat': 'workloadIdentities',
        'type': 'mc',
        'question': "A service principal's client secret is found publicly posted in a code repository, and shortly afterward sign-ins using that service principal arrive from an unfamiliar country at an unusual hour. Which Microsoft Entra capability is designed to detect and help remediate this kind of compromise?",
        'options': [
            "An access review scheduled for the service principal's owners",
            "Smart lockout configured on the tenant's password policy",
            'A sign-in risk policy that applies to the whole user population',
            'Workload identity risk detection in Microsoft Entra ID Protection',
        ],
        'correct': 3,
        'explanation': "Workload identity risk detection brings Identity Protection's leaked-credential and anomalous-location signals to service principals, matching this incident. A sign-in risk policy for all users targets human sign-ins and does not evaluate a service principal. Smart lockout counters repeated password guessing against user accounts, not a leaked secret used successfully. An access review of the owners reassesses which people manage the app, not the risk of the service principal's own sign-ins.",
    },
    {
        'id': 'q63',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'Contoso adopts Privileged Identity Management two years after deploying Microsoft Entra ID, and suspects several Global Administrator assignments made earlier are still permanent and active rather than PIM-eligible. What should the team use to find and convert those assignments?',
        'options': [
            'The Identity Secure Score improvement actions',
            'PIM alerts about the number of Global Administrators',
            'PIM discovery and insights',
            'A recurring access review scoped to the Global Administrator role',
        ],
        'correct': 2,
        'explanation': 'Discovery and insights scans for assignments made outside PIM and lets the administrator convert them to eligible directly from the findings. An access review can recertify assignments but is not the tool for locating and converting standing ones. PIM alerts warn that there are too many privileged assignments without listing each one for conversion. Identity Secure Score recommends improvements for the whole tenant and does not locate or convert individual role assignments.',
    },
    {
        'id': 'q64',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': 'A sensitive access package requires sign-off first from the resource owner and then, separately, from a compliance officer before access is granted. A request that the resource owner rejects must never reach the compliance officer. Which request policy feature supports this?',
        'options': [
            'A single-stage approval in which the two approvers are added as alternates',
            'An access review that runs right after the request is submitted',
            'Multi-stage approval, with the resource owner and compliance officer as sequential stages',
            'A segregation of duties check between the owner role and the compliance role',
        ],
        'correct': 2,
        'explanation': 'Multi-stage approval puts approvers in sequence, so a rejection at the first stage ends the request before the second stage ever sees it. A segregation of duties check blocks requests based on conflicting packages already held, not on sign-off order. A single stage with alternates lets either approver act alone, so it does not require both. An access review reassesses access already granted and cannot gate a new request.',
    },
    {
        'id': 'q65',
        'cat': 'identityGovernance',
        'type': 'mc',
        'question': "An access package should be requestable only by users from one partner organization that is already a connected organization, and not by any other connected organization or by internal users. What should be configured on the package's request policy?",
        'options': [
            "A requestor scope set to the users in Contoso's own directory",
            'A segregation of duties check that references the connected organization',
            'A requestor scope set to the connected organizations Contoso has configured',
            'A requestor scope limited to that one connected organization',
        ],
        'correct': 3,
        'explanation': "A request policy's requestor scope can be narrowed to one specific connected organization, which matches exactly who may request. Scoping to Contoso's own users would admit internal staff and exclude the partner. Scoping to all connected organizations would open the package to every partner Contoso has ever connected. A segregation of duties check governs incompatible package combinations, not who may request.",
    },
    {
        'id': 'tf26',
        'cat': 'userIdentities',
        'type': 'tf',
        'question': 'Removing a user from a group that assigned them a Microsoft 365 license through group-based licensing also removes any copy of that same license the user was separately assigned directly to their own account.',
        'answer': False,
        'explanation': "A license assigned directly to a user and a license inherited from group-based licensing are independent sources -- removing the user from the group only removes the group-inherited copy, leaving a separately, directly assigned copy of the same license in place.",
    },
    {
        'id': 'tf27',
        'cat': 'authAccessMgmt',
        'type': 'tf',
        'question': "A certificate-based sign-in satisfies the built-in Phishing-resistant MFA strength even when the tenant's authentication binding treats that certificate as single-factor.",
        'answer': False,
        'explanation': 'Certificate-based authentication counts toward the phishing-resistant strength only when it is multifactor. The authentication binding settings decide whether a certificate is treated as single-factor or multifactor, and a single-factor certificate sign-in does not meet the strength.',
    },
    {
        'id': 'tf28',
        'cat': 'workloadIdentities',
        'type': 'tf',
        'question': 'An owner of an app registration can grant tenant-wide admin consent for the API permissions that the app requests.',
        'answer': False,
        'explanation': "Owners can manage the registration's credentials, redirect URIs, and requested permissions, but granting tenant-wide admin consent requires an administrator role with the authority to consent. Ownership is a way to delegate application management without handing out those rights.",
    },
    {
        'id': 'tf29',
        'cat': 'identityGovernance',
        'type': 'tf',
        'question': "An access review can be configured to apply the system's recommendation automatically for users whose reviewers do not respond.",
        'answer': True,
        'explanation': "Among the settings for when reviewers do not respond is taking the recommendation, which is generated from the user's sign-in and usage activity. This lets a review resolve itself sensibly when reviewers are absent instead of defaulting to approve or deny everyone.",
    },
    {
        'id': 'msq14',
        'cat': 'userIdentities',
        'type': 'ms',
        'question': 'Which two statements about group-based licensing are true? (Choose two.)',
        'options': [
            'Only Microsoft 365 groups can be licensed; security groups cannot be used',
            'A group of devices can be licensed so that every device in it receives the product',
            'Members of a nested child group do not receive licenses assigned to the parent group',
            'A dynamic user group can be the licensed group, so licenses follow attribute changes automatically',
        ],
        'correct': [2, 3],
        'explanation': 'Licenses can be assigned to a dynamic user group so they follow rule changes, and only direct members of the licensed group receive them, so nested groups are not honored. Licenses apply to users, so a device group cannot be licensed. Security groups are the usual choice for licensing, so the claim that only Microsoft 365 groups work is wrong.',
    },
    {
        'id': 'msq15',
        'cat': 'identityGovernance',
        'type': 'ms',
        'question': 'Which two statements about PIM discovery and insights and multi-stage access package approval are true? (Choose two.)',
        'options': [
            'Approvers in the second stage of a multi-stage approval review the request even after the first stage rejected it',
            'PIM discovery and insights converts every permanent assignment to eligible automatically, without administrator review',
            'In multi-stage approval, each stage can have its own approvers, and a rejection at an earlier stage ends the request',
            'PIM discovery and insights can identify directory role assignments made outside PIM and let an administrator convert them to eligible',
        ],
        'correct': [2, 3],
        'explanation': "Discovery and insights surfaces assignments made outside PIM and lets an administrator choose which to convert. Multi-stage approval gives each stage its own approvers, and a rejection stops the request before later stages. Discovery and insights never converts assignments by itself, since an administrator reviews and acts on the findings. A request rejected at an earlier stage never reaches the second stage's approvers.",
    },
]

QUESTIONS.extend(_ADDITIONAL_QUESTIONS_2)

# "Choose the more correct answer": both options are plausible, one is the
# better fit for the stated scenario. `better` names it ('A' or 'B'); the app
# re-shuffles display order per session so position never leaks the answer.
COMPARE = [
    {
        'id': 'cmp-sc300-1',
        'cat': 'userIdentities',
        'scenario': "Contoso's datacenter hosting Active Directory is offline for several hours during quarterly maintenance. Leadership wants employees to keep signing in to Microsoft 365 during those windows, and there is no policy against keeping a derived password hash in the cloud. Which sign-in method is the better fit?",
        'optionA': 'Pass-through Authentication, because every sign-in is checked directly against on-premises Active Directory.',
        'optionB': 'Password Hash Sync, because Microsoft Entra ID can validate sign-ins itself without reaching the datacenter.',
        'better': 'B',
        'why': 'Pass-through Authentication is the sensible choice when no hash may live in the cloud, and it applies on-premises account state at sign-in. But its agents must reach a domain controller for every sign-in, so a datacenter outage means failed sign-ins unless an administrator manually switches methods. Password Hash Sync validates in the cloud, which is exactly what keeps sign-in working during the maintenance windows, and the stem removes the one reason to avoid it.',
    },
    {
        'id': 'cmp-sc300-2',
        'cat': 'userIdentities',
        'scenario': 'Contoso has one on-premises Active Directory forest and must synchronize it to Microsoft Entra ID using custom attribute-flow rules and transformations that the standard cloud-managed mappings cannot express. Which synchronization option is the better fit?',
        'optionA': 'Microsoft Entra Connect Sync, because its full synchronization engine allows custom rules and complex attribute flows.',
        'optionB': 'Microsoft Entra Cloud Sync, because lightweight cloud-managed agents give simpler setup and built-in redundancy.',
        'better': 'A',
        'why': "Cloud Sync's simplicity and multi-agent redundancy are real advantages, and it would be the better pick for several simple or disconnected forests. Here the deciding requirement is customization, and Cloud Sync supports far fewer options for complex attribute flows. Connect Sync's rules engine is built for exactly this, so it is the fit even though it is heavier to run.",
    },
    {
        'id': 'cmp-sc300-3',
        'cat': 'authAccessMgmt',
        'scenario': 'A small Contoso subsidiary uses security defaults. Security now wants MFA required only for administrators and from untrusted networks, with one emergency access account exempted. Which approach is the better fit?',
        'optionA': 'Keep security defaults, because they already enforce MFA registration and block legacy authentication for the tenant.',
        'optionB': 'Replace security defaults with Conditional Access policies, because only policies can set conditions and exclude one account.',
        'better': 'B',
        'why': 'Security defaults are a fine free baseline, but they apply one fixed set of rules to everyone, with no conditions and no exclusions, so they can neither limit MFA to administrators on untrusted networks nor exempt the emergency account. Conditional Access can do both, and because the two cannot run together, security defaults have to be turned off first.',
    },
    {
        'id': 'cmp-sc300-4',
        'cat': 'authAccessMgmt',
        'scenario': 'Before enforcing a new policy that requires compliant devices for every user, Contoso wants evidence of how many real sign-ins over the next week would have been blocked. Which tool is the better fit?',
        'optionA': 'Report-only mode on the policy, reviewing the logged outcomes after a week of live sign-ins.',
        'optionB': 'The What If tool, run for a sample of users, apps, and locations before enabling the policy.',
        'better': 'A',
        'why': 'What If is useful for checking one hypothetical sign-in at a time, but it only reflects the conditions an administrator types in, so it cannot measure how many real sign-ins would be affected. Report-only mode evaluates the policy against live traffic without enforcing it and logs what would have happened, which gives the team the week of evidence it asked for.',
    },
    {
        'id': 'cmp-sc300-5',
        'cat': 'authAccessMgmt',
        'scenario': "Identity Protection reports that a user's credentials appear in a leaked set, yet the user's recent sign-ins look normal. Which control is the better fit for the problem?",
        'optionA': 'A sign-in risk policy that requires MFA when a sign-in is judged medium risk or higher.',
        'optionB': 'A user risk policy that requires a secure password change when the user is judged high risk.',
        'better': 'B',
        'why': 'A sign-in risk policy judges individual attempts, so normal-looking sign-ins would never trigger it, and an MFA prompt would not invalidate the leaked password anyway. The user risk policy responds to the identity-level detection and forces the password change that actually removes the exposed credential.',
    },
    {
        'id': 'cmp-sc300-6',
        'cat': 'workloadIdentities',
        'scenario': 'Three web apps in different resource groups call the same storage account and should share one set of role assignments that survives redeploying any single app. Which identity choice is the better fit?',
        'optionA': 'One user-assigned managed identity attached to all three apps, with the roles assigned to it once.',
        'optionB': 'A system-assigned managed identity on each app, with the roles assigned to each identity separately.',
        'better': 'A',
        'why': 'System-assigned identities work and each is simple to enable, but there would be three identities with three sets of role assignments, and redeploying an app creates a new identity that must be granted its roles again. A user-assigned identity is a standalone resource, so one role assignment serves every app and persists through redeployments.',
    },
    {
        'id': 'cmp-sc300-7',
        'cat': 'workloadIdentities',
        'scenario': 'A GitHub Actions workflow on GitHub-hosted runners deploys to Azure. The team wants to eliminate the risk of a stolen or expired credential stored in the repository settings. Which approach is the better fit?',
        'optionA': 'An app registration certificate, with the private key kept in GitHub encrypted secrets and rotated every 90 days.',
        'optionB': "A federated credential that trusts GitHub's token issuer for the repository, so the workflow stores no credential.",
        'better': 'B',
        'why': 'A certificate is a stronger credential than a secret and rotation limits exposure, but a private key still sits in GitHub settings where it can be exfiltrated or lapse. A federated credential removes the stored credential entirely: the workflow exchanges its GitHub-issued token, so there is nothing to steal, rotate, or let expire.',
    },
    {
        'id': 'cmp-sc300-8',
        'cat': 'workloadIdentities',
        'scenario': 'An internal approvals app must know whether each signed-in user is a Reader or an Approver and enforce that difference itself. Which approach is the better fit?',
        'optionA': 'App roles defined on the app registration and assigned to users or groups on the enterprise application.',
        'optionB': "Group claims in the token, with the app mapping each group's object ID to a permission level.",
        'better': 'A',
        'why': "Group claims can work, but they tie the app's authorization to directory group IDs, and a user in many groups can overflow the token so the app receives an overage indicator instead of the list. App roles are purpose-built: the developer names the roles, administrators assign them, and the token carries just the assigned role.",
    },
    {
        'id': 'cmp-sc300-9',
        'cat': 'identityGovernance',
        'scenario': "An employee's last day is known months in advance. Contoso wants their group memberships and other access removed automatically on that date. Which feature is the better fit?",
        'optionA': 'A recurring access review of the groups, with managers confirming who still needs access.',
        'optionB': "A leaver lifecycle workflow triggered by the employee's leave date, with tasks that remove access.",
        'better': 'B',
        'why': 'An access review catches leftover access eventually, but it runs on its own cycle and depends on a reviewer noticing the departure, so access can linger until the next review. A leaver workflow is driven by the leave date itself and runs the removal tasks on schedule without anyone having to remember.',
    },
    {
        'id': 'cmp-sc300-10',
        'cat': 'identityGovernance',
        'scenario': 'Engineers need Exchange Administrator only during incidents, for up to four hours, and security wants no standing use of the role between incidents. Which assignment type is the better fit?',
        'optionA': 'An eligible assignment that engineers activate with a justification, capped at four hours per activation.',
        'optionB': 'A time-bound active assignment that gives each engineer the role continuously for the next 90 days.',
        'better': 'A',
        'why': 'A time-bound active assignment is better than a permanent one because it eventually ends, but for 90 days the role is usable at any moment, which is standing access. An eligible assignment grants nothing until an engineer activates it with a justification, and each activation expires after four hours.',
    },
]

# >>> MSREFRESH-BEGIN (generated block; do not hand-edit, regenerate from patch files)


def _msr_find(coll, key):
    for it in globals()[coll]:
        if it.get('id') == key or it.get('heading') == key:
            return it
    raise KeyError((coll, key))


def _msr_fix(coll, key, field, old, new):
    it = _msr_find(coll, key)
    if isinstance(it[field], list):
        assert old in it[field], (coll, key, field, old)
        it[field] = [new if x == old else x for x in it[field]]
    else:
        assert old in it[field], (coll, key, field, old)
        it[field] = it[field].replace(old, new)

if 'FLASHCARDS' not in globals():
    FLASHCARDS = []
FLASHCARDS.extend([{'id': 'f9001',
  'cat': 'authAccessMgmt',
  'front': 'Global Secure Access (Microsoft Security Service Edge)',
  'back': "Global Secure Access is the umbrella name for Microsoft Entra Internet Access and Microsoft Entra Private Access, Microsoft's "
          'identity-centric Security Service Edge (SSE) solution. It brings network access controls into the Microsoft Entra admin center so that '
          'network traffic, like a sign-in, can be evaluated with identity, device, location, and risk signals through Conditional Access.',
  'detail': 'Internet Access secures internet and SaaS traffic as an identity-aware secure web gateway, while Private Access gives users zero-trust '
            'access to private apps without a VPN. A third, Microsoft-services path (the Microsoft traffic profile) is available with Entra ID P1 or '
            'P2.'},
 {'id': 'f9002',
  'cat': 'authAccessMgmt',
  'front': 'Traffic forwarding profiles (Microsoft, Private access, Internet access)',
  'back': 'Traffic forwarding profiles decide which network traffic is tunneled into Global Secure Access. Three exist: the Microsoft traffic '
          'profile (Microsoft 365 services), the Private access profile (private apps and Quick Access), and the Internet access profile (everything '
          'else on the internet). Traffic is matched against them in that order, and traffic that matches none is not forwarded.',
  'detail': 'Each profile can be assigned to chosen users, groups, devices, and device platforms. When several enabled profiles of the same traffic '
            'type apply to a user, only the one with the highest priority is used by the client.'},
 {'id': 'f9003',
  'cat': 'authAccessMgmt',
  'front': 'Global Secure Access client vs. remote network',
  'back': 'Traffic reaches Global Secure Access either from the Global Secure Access client installed on a device (Windows, macOS, iOS, Android) or, '
          'for Microsoft and internet traffic, from a configured remote network such as a branch office. Private Access traffic is acquired only by '
          'the client. The Windows client acquires traffic with a lightweight filter (LWF) driver instead of acting as a VPN tunnel.',
  'detail': 'Because it is not a VPN connection, the client can run side by side with a non-Microsoft SSE or VPN client. Remote networks need no '
            'software on each device, which suits devices that cannot run the client.'},
 {'id': 'f9004',
  'cat': 'authAccessMgmt',
  'front': 'Microsoft traffic profile (forward vs. bypass)',
  'back': 'The Microsoft traffic profile sends traffic for Microsoft 365 services (Exchange Online, SharePoint Online and OneDrive, Teams, and '
          'Microsoft 365 common and Office Online endpoints) through Global Secure Access. Each policy group and each rule can be set to Forward or '
          "Bypass. A bypassed destination is not acquired by the Internet access profile either; it egresses directly over the device's normal "
          'network path.',
  'detail': 'The profile requires Microsoft Entra ID P1 or P2. It underpins the compliant network check, source IP restoration, and universal tenant '
            'restrictions, which is why those features stop working if the profile is disabled.'},
 {'id': 'f9005',
  'cat': 'authAccessMgmt',
  'front': 'Entra Private Access: Quick Access vs. per-app access',
  'back': 'Quick Access is the single primary Global Secure Access enterprise application holding the FQDNs, IP addresses, and ranges you always '
          'want tunneled, which is the fast way to replace a VPN. Per-app access creates separate Global Secure Access apps (with their own TCP/UDP '
          'app segments) so a subset of private resources gets its own assignments and Conditional Access policies.',
  'detail': 'Quick Access is positioned as a transition state; once the VPN is gone, move to per-app access for application segmentation and per-app '
            'granular controls. Both are enterprise applications, so users and groups are assigned and Conditional Access is applied to them.'},
 {'id': 'f9006',
  'cat': 'authAccessMgmt',
  'front': 'Private network connector and connector groups',
  'back': 'A private network connector is a lightweight agent installed on Windows Server inside the network that brokers traffic between Entra '
          'Private Access (or application proxy) and the private resource. It makes outbound-only connections (ports 80 and 443), so no inbound '
          'firewall ports are needed. Connectors are placed in connector groups, which act as a unit for load balancing and high availability; use '
          'at least two per group.',
  'detail': 'Each Quick Access or per-app app is mapped to a connector group, so location-based groups can keep traffic close to the resources and '
            'reduce latency for apps in different regions.'},
 {'id': 'f9007',
  'cat': 'authAccessMgmt',
  'front': 'Entra Private DNS',
  'back': 'Entra Private DNS lets Private Access resolve internal names for remote users. You add DNS suffixes to the Quick Access configuration; '
          'the client then sends queries for names ending in those suffixes to a DNS proxy at the Global Secure Access edge, which forwards them to '
          "the connector's local resolver. On Windows, the client creates an NRPT entry for each suffix.",
  'detail': 'Without a matching suffix, an internal short name such as an intranet hostname fails to resolve for a remote user even though the '
            'IP-based segment is configured.'},
 {'id': 'f9008',
  'cat': 'authAccessMgmt',
  'front': 'Entra Internet Access web content filtering',
  'back': 'Web content filtering in Entra Internet Access, the identity-aware secure web gateway, blocks or allows internet destinations by web '
          'category, URL, or FQDN. Create a web content filtering policy, add it to a security profile, link that security profile to a Conditional '
          'Access policy for the target users, and make sure those users receive the Internet access traffic forwarding profile.',
  'detail': 'Secure DNS (DNS over HTTPS) in the browser or OS must be disabled so the client can see the FQDNs it needs to match against the '
            'forwarding rules.'},
 {'id': 'f9009',
  'cat': 'authAccessMgmt',
  'front': 'Compliant network check (Conditional Access)',
  'back': "The compliant network check lets a Conditional Access policy require that a request arrives through your organization's Global Secure "
          'Access tenant, via the client or a remote network, without maintaining lists of egress IP addresses. You first enable Global Secure '
          'Access signaling for Conditional Access, which creates the "All Compliant Network locations" named location, then reference it in a '
          'policy.',
  'detail': 'Enforcement happens at authentication, so a stolen token replayed from outside the compliant network is denied. The check is specific '
            'to the tenant that configures it. Turning the signaling off while policies depend on it can lock users out.'},
 {'id': 'f9010',
  'cat': 'authAccessMgmt',
  'front': 'Source IP restoration',
  'back': "Source IP restoration passes the user's original egress IP address to Microsoft Entra ID and Microsoft Graph instead of the Global Secure "
          'Access proxy address. That keeps IP-based Conditional Access locations working, improves the accuracy of ID Protection risk detections, '
          'and records the real source IP in sign-in and audit logs. It requires the Microsoft traffic profile to be enabled.',
  'detail': 'It belongs to the Adaptive Access capability of Entra Internet Access for Microsoft services and can be configured by a Global Secure '
            'Access Administrator or Global Administrator.'},
 {'id': 'f9011',
  'cat': 'authAccessMgmt',
  'front': 'Universal tenant restrictions',
  'back': 'Universal tenant restrictions extend a tenant restrictions v2 (TRv2) policy to every device that uses the Global Secure Access client or '
          'a remote network, without routing traffic through a company-managed proxy. Users on those devices can then sign in only to the external '
          'tenants and applications your TRv2 policy allows, reducing exfiltration to unauthorized or personal tenants.',
  'detail': 'It is available with the Microsoft traffic profile (Entra ID P1 or P2). Cross-tenant access settings control collaboration with '
            'specific tenants; tenant restrictions control which foreign tenants your users may sign in to.'},
 {'id': 'f9012',
  'cat': 'authAccessMgmt',
  'front': 'Global Secure Access licensing and roles',
  'back': 'Users need Microsoft Entra ID P1 or P2 for any Global Secure Access feature. The Microsoft traffic profile (compliant network, source IP '
          'restoration, universal tenant restrictions) is covered by P1 or P2, while Entra Internet Access and Entra Private Access are separate '
          'licenses also included in the Microsoft Entra Suite. The Global Secure Access Administrator role manages the features; policy work also '
          'needs Conditional Access Administrator.',
  'detail': 'Remote network connectivity requires a combined minimum of 50 licenses across Entra ID P1 and Entra Internet Access.'},
 {'id': 'f9020',
  'cat': 'workloadIdentities',
  'front': 'Cloud discovery (Defender for Cloud Apps)',
  'back': 'Cloud discovery analyzes your network traffic logs against the Defender for Cloud Apps cloud app catalog (more than 31,000 apps, each '
          'scored on more than 90 risk factors) to show which cloud apps and Shadow IT are in use and how risky they are. In the Microsoft Defender '
          'portal it lives under Cloud apps > Cloud discovery, and it only recognizes apps that exist in the catalog unless you create a custom app.',
  'detail': 'Discovery data is analyzed and refreshed several times a day, and the results can feed policies that alert on anomalous use.'},
 {'id': 'f9021',
  'cat': 'workloadIdentities',
  'front': 'Snapshot vs. continuous cloud discovery reports',
  'back': 'Snapshot reports give ad hoc visibility into traffic logs you manually upload from firewalls and proxies. Continuous reports analyze all '
          'logs forwarded automatically from your network and can flag anomalous use with machine learning anomaly detection or your own policies. '
          'Continuous reports are fed by Defender for Endpoint integration, log collectors, secure web gateway integrations, or the cloud discovery '
          'API.',
  'detail': 'Defender for Endpoint integration is the simplest way to extend discovery beyond the corporate network because every onboarded device '
            'reports its cloud app use wherever it is.'},
 {'id': 'f9022',
  'cat': 'workloadIdentities',
  'front': 'Cloud app catalog and risk score',
  'back': "The cloud app catalog is Microsoft's list of discoverable cloud apps, each scored from the weighted subscores of its properties (each "
          'property scored 0 to 10) across risk categories. By default all risk parameters have equal weight, so an organization that cares more '
          'about, for example, compliance than hosting can customize the weights to rank apps by its own priorities.',
  'detail': 'An unscored app usually means its properties are unknown. You can request a risk score update or create a custom app for software '
            'missing from the catalog.'},
 {'id': 'f9023',
  'cat': 'workloadIdentities',
  'front': 'Sanctioned vs. unsanctioned apps',
  'back': 'Tagging a discovered app Sanctioned marks it approved; Unsanctioned marks it prohibited. Tagging alone does not block anything. With '
          'Defender for Endpoint, unsanctioned apps are blocked automatically on onboarded devices (cloud protection and network protection must be '
          'on), and other integrations or a generated block script can enforce it elsewhere.',
  'detail': 'Apps connected through an app connector or onboarded to the inline proxy are treated as sanctioned in cloud discovery.'},
 {'id': 'f9024',
  'cat': 'workloadIdentities',
  'front': 'App connectors (connected apps)',
  'back': "App connectors use a SaaS provider's own APIs to give Defender for Cloud Apps visibility into activities, files, and accounts of "
          'connected apps such as Microsoft 365, Box, Salesforce, and Google Workspace, plus governance actions like removing sharing. They work out '
          'of band, after the fact, rather than controlling a live session, and multiple instances of the same app can be connected.',
  'detail': 'Real-time control of a session needs Conditional Access app control (reverse proxy) instead; many organizations use both for the same '
            'app.'},
 {'id': 'f9025',
  'cat': 'workloadIdentities',
  'front': 'Access policy vs. session policy (Conditional Access app control)',
  'back': 'Both policy types require a Microsoft Entra Conditional Access policy that routes the session to Defender for Cloud Apps. An access '
          'policy allows or blocks access outright, for example blocking Salesforce from unmanaged devices. A session policy allows access but '
          'monitors and limits what happens in the session, such as blocking download of sensitive files, requiring labeling on download, or '
          'blocking upload of malware.',
  'detail': 'Policies are scoped to the app you onboard, not to related resource apps: a policy for Teams or Exchange does not cover SharePoint or '
            'OneDrive, so create a separate policy for them.'},
 {'id': 'f9026',
  'cat': 'workloadIdentities',
  'front': 'Conditional Access app control mechanics (reverse proxy)',
  'back': 'Conditional Access app control routes browser sessions through Defender for Cloud Apps acting as a reverse proxy, with nothing installed '
          'on the device, so it suits unmanaged and partner devices. In Microsoft Edge the protection runs in the browser; other browsers show an '
          'app URL with an .mcas.ms suffix. Microsoft Entra apps are onboarded automatically while non-Microsoft IdP apps must be onboarded '
          'manually.',
  'detail': 'To stop users bypassing it, create an access policy that blocks native clients and allows only browser-based sessions.'},
 {'id': 'f9027',
  'cat': 'workloadIdentities',
  'front': 'Application-enforced restrictions',
  'back': 'Application-enforced restrictions is a Conditional Access session control that makes Microsoft Entra ID pass device information '
          '(compliant, domain-joined or not) to a cloud app, which then provides a full or limited experience. It works with Exchange Online and '
          'SharePoint Online (limited, browser-only access), which must also have their own restriction settings configured, and needs no reverse '
          'proxy.',
  'detail': 'It is the lightweight native option; use Defender for Cloud Apps session policies when you need granular real-time controls such as '
            'labeling or malware scanning.'},
 {'id': 'f9028',
  'cat': 'workloadIdentities',
  'front': 'OAuth app policies (app permission policies)',
  'back': 'OAuth app policies in Defender for Cloud Apps alert you when an OAuth app meets criteria you define, such as a high permission level '
          'authorized by more than a set number of users, and let you investigate the permissions an app requested and mark them approved or banned. '
          'Banning a permission disables the enterprise application associated with that OAuth app. They cover Microsoft 365, Google Workspace, and '
          'Salesforce apps.',
  'detail': 'This is detective and corrective, unlike Entra user-consent settings, which prevent consent up front. With app governance enabled, '
            'policies can be created from the App governance page.'},
 {'id': 'f9030',
  'cat': 'workloadIdentities',
  'front': 'Agent identity (Microsoft Entra Agent ID)',
  'back': 'An agent identity is a special service principal that represents an AI agent. It has no credentials of its own: its agent identity '
          'blueprint holds the credentials and acquires tokens on its behalf. It can carry a sponsor, and it can only be issued tokens in the tenant '
          'where it was created, so it cannot reach resources in other tenants.',
  'detail': 'Agent identities are not the same as user accounts or traditional service principals, which lack enforced sponsorship, agent-aware '
            'audit entries, and a blueprint-managed lifecycle.'},
 {'id': 'f9031',
  'cat': 'workloadIdentities',
  'front': 'Agent identity blueprint',
  'back': 'An agent identity blueprint is the template and authentication foundation for one or more agent identities. It holds the credentials '
          '(federated identity credentials or client secrets), shared properties such as app roles and permissions, and policies like Conditional '
          'Access that apply to every agent identity created from it. Disabling the blueprint stops all of its agent identities from authenticating.',
  'detail': 'A blueprint can do exactly one thing in the tenant: provision or deprovision agent identities, using a special Microsoft Graph '
            'permission (AgentIdentity.CreateAsManager). Adding a blueprint to a tenant creates an agent identity blueprint principal.'},
 {'id': 'f9032',
  'cat': 'workloadIdentities',
  'front': 'Agent owners, sponsors, and managers',
  'back': 'Owners are the technical administrators who configure and operate an agent. Sponsors are the human users or groups accountable for the '
          'agent in a business sense, able to make lifecycle decisions without technical admin rights. Managers are human users designated as the '
          "hiring manager or operational owner of an agent's user account.",
  'detail': 'The split keeps technical control and business accountability separate without handing out excess permissions, and the sponsor is who '
            'gets contacted if there is a security incident.'},
 {'id': 'f9033',
  'cat': 'workloadIdentities',
  'front': "Agent's user account",
  'back': "An agent's user account is an optional identity that lets an agent act as a user, like a digital worker with a mailbox, chat access, or "
          'inclusion in HR systems, or that needs APIs and resources reserved for user identities. It should be created only when an agent must act '
          'as a user, and it lets admins manage the agent with capabilities similar to human users.',
  'detail': 'Most agents should authenticate as an agent identity instead; assigning ordinary user accounts to agents breaks Conditional Access, ID '
            'Protection, and governance assumptions built for humans.'},
 {'id': 'f9034',
  'cat': 'workloadIdentities',
  'front': 'Group managed service account (gMSA)',
  'back': 'A gMSA is an Active Directory domain account for on-premises services, possibly across a server farm, whose 240-byte random password is '
          'managed and rotated by Windows (every 30 days) so nobody handles the credential. It is the recommended account type for on-premises '
          'services unless the service, such as failover clustering, does not support it, and it simplifies SPN management.',
  'detail': 'A gMSA is an on-premises identity. For Azure resources use a managed identity instead; for apps outside Azure use a service principal, '
            'ideally with workload identity federation.'},
 {'id': 'f9035',
  'cat': 'workloadIdentities',
  'front': 'Application collections in My Apps',
  'back': 'Collections group related applications on the My Apps portal, for example by job role, task, or project, so users see them organized '
          'rather than as one long list. An admin creates them in Enterprise apps > App launchers by naming the collection, adding applications, '
          'owners, and users or groups. They require a Microsoft Entra ID P1 or P2 license and at least the Cloud Application Administrator role.',
  'detail': 'Admin collections are managed in the Microsoft Entra admin center, not from the My Apps portal itself.'},
 {'id': 'f9040',
  'cat': 'userIdentities',
  'front': 'Custom domains in Microsoft Entra ID',
  'back': 'Every tenant starts with an initial onmicrosoft.com domain that cannot be changed or deleted. You add your own DNS name as a custom '
          'domain, prove ownership by creating the TXT or MX record Entra gives you at your registrar, then select Verify, and can make it the '
          'primary domain used for new user names. A domain name can be verified in only one tenant at a time.',
  'detail': 'If verification fails, wait for DNS propagation, check the record, and make sure the name is not already verified elsewhere, including '
            'an unmanaged tenant created by self-service sign-up, which must be taken over.'},
 {'id': 'f9041',
  'cat': 'userIdentities',
  'front': 'Device settings in Microsoft Entra ID',
  'back': 'Device settings control who may join or register devices and how. "Users may join devices" (default All) and "Users may register their '
          'devices", a maximum number of devices per user (default 50, up to 100), who becomes local administrator on joined devices, and an '
          'optional MFA requirement for join or register. Microsoft recommends using the Register or join devices user action in Conditional Access '
          'for MFA instead of the toggle.',
  'detail': 'The join and maximum-devices limits do not apply to hybrid joined devices, and the join setting also skips userless joins such as '
            'Autopilot self-deploying mode.'},
 {'id': 'f9042',
  'cat': 'userIdentities',
  'front': 'Evaluating effective permissions for Entra roles',
  'back': "A user's effective directory permissions are the union of every role assignment they hold, each limited by its own scope (tenant, "
          'administrative unit, or an individual application registration). There is no deny assignment: roles only add permissions, so a '
          'tenant-wide assignment overrides the narrowing intent of an administrative-unit assignment of the same role.',
  'detail': "To find what a user can really do, list all of the user's assignments (including those through role-assignable groups and PIM eligible "
            'ones once activated) and compare scope for each, instead of looking at a single role.'},
 {'id': 'f9043',
  'cat': 'userIdentities',
  'front': 'Microsoft Graph PowerShell for Entra administration',
  'back': 'Microsoft Graph PowerShell is the module to use for automating Microsoft Entra ID tasks. The Azure AD, Azure AD Preview, and MSOnline '
          'modules are deprecated. Cmdlets use the Mg prefix (Get-AzureADUser becomes Get-MgUser) and you connect with the permission scopes you '
          'need, which are delegated consent grants rather than directory roles alone.',
  'detail': 'For bulk work you can also use the admin center CSV templates for bulk create, delete, invite, and download of users, which need at '
            'least the User Administrator role.'},
 {'id': 'f9044',
  'cat': 'userIdentities',
  'front': 'Company branding (Entra sign-in experience)',
  'back': 'Company branding customizes the sign-in pages users see: background image or color, banner and header logos, favicon, layout, footer, '
          'sign-in page title, and a custom CSS file. It needs a Microsoft Entra ID P1 or P2 license, and the minimum role is Organizational '
          'Branding Administrator. All elements are optional, and branding does not carry over to personal Microsoft account sign-ins.',
  'detail': 'You set a default experience for the tenant and can add more specific branding per browser language. Azure AD B2C branding is a '
            'separate, more limited feature.'},
 {'id': 'f9050',
  'cat': 'authAccessMgmt',
  'front': 'Disable accounts and revoke user sessions',
  'back': 'To cut off a compromised or departing user, disable the account (User Administrator, or Privileged Authentication Administrator for admin '
          'accounts) and select Revoke sessions on the user, or run Revoke-MgUserSignInSession, which invalidates refresh tokens. An already-issued '
          'access token still works until it expires (one hour by default) unless the app supports continuous access evaluation.',
  'detail': 'For a hybrid user, disable the account and reset the password twice in on-premises Active Directory, then revoke sessions in Entra. '
            'Apps that use their own session cookies must also have the user deprovisioned.'},
 {'id': 'f9051',
  'cat': 'authAccessMgmt',
  'front': 'Microsoft Entra Kerberos for hybrid identities',
  'back': "Microsoft Entra Kerberos lets Entra ID issue a partial Kerberos ticket-granting ticket (containing only the user's SID) for an "
          'on-premises AD domain, using a Microsoft Entra Kerberos server object published from AD. The client trades it at a domain controller for '
          'a full TGT, so users who sign in with FIDO2 keys or Windows Hello for Business cloud Kerberos trust still reach on-premises resources.',
  'detail': 'Domain controllers keep issuing service tickets and controlling authorization, they must run Windows Server 2016 or later with required '
            'updates, and setup uses the AzureADHybridAuthenticationManagement module with the Hybrid Identity Administrator role.'},
 {'id': 'f9052',
  'cat': 'authAccessMgmt',
  'front': 'Passkey profiles: device-bound vs. synced passkeys',
  'back': 'Passkey profiles replace one tenant-wide FIDO2 setting with group-targeted profiles that define the passkey type (device-bound or '
          'synced), attestation, and allowed AAGUIDs. Device-bound passkeys keep the private key on one device, while synced passkeys sync through a '
          'cloud passkey provider and do not support attestation, so enforcing attestation limits a profile to device-bound passkeys.',
  'detail': 'Typical design: attested hardware keys for administrators and synced passkeys for frontline staff. An Authentication Policy '
            'Administrator configures profiles, and Microsoft Authenticator needs a minimum app version for synced passkeys.'},
 {'id': 'f9053',
  'cat': 'authAccessMgmt',
  'front': 'Analyzing Entra logs with KQL in Log Analytics',
  'back': 'After you route logs with a Microsoft Entra diagnostic setting (to a Log Analytics workspace, a storage account, or an event hub) you can '
          'query them with KQL: SigninLogs for interactive sign-ins, AuditLogs for directory changes, AADProvisioningLogs for provisioning. A '
          'typical query filters by time with where TimeGenerated >= ago(7d) and aggregates with summarize ... by.',
  'detail': 'Creating the diagnostic setting needs the Security Administrator role for the tenant plus rights on the destination. Workbooks in '
            'Monitoring & health visualize the same data without writing KQL.'}])

if 'QUESTIONS' not in globals():
    QUESTIONS = []
QUESTIONS.extend([{'id': 'q9001',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Employees of Fabrikam work from home and from cafes. Security wants Exchange Online and SharePoint Online reachable only from devices '
              "running through the organization's own network security service, so a stolen refresh token replayed from an attacker's machine fails. "
              'The team will not maintain lists of egress IP addresses and will not hairpin traffic through a VPN. What should you configure?',
  'options': ['A Conditional Access policy that blocks the Microsoft 365 apps except from a named location listing the headquarters firewall IP '
              'addresses',
              'Global Secure Access signaling for Conditional Access, the Global Secure Access client with the Microsoft traffic profile, and a '
              'policy that blocks all resources except from the compliant network location',
              'A device compliance policy in Intune combined with a grant control that requires a compliant device',
              'A sign-in frequency session control that forces reauthentication every hour for all users'],
  'correct': 1,
  'explanation': "The compliant network check is enforced at authentication, so a replayed token from a machine that is not behind the tenant's "
                 'Global Secure Access client or remote network is denied, and there are no IP lists to maintain. An IP named location fails for '
                 'remote users and requires constant upkeep. Device compliance proves the device state, not the network path the request took, so a '
                 'stolen token on a compliant but unrelated network path is not blocked this way. Shorter sign-in frequency only limits the window a '
                 'token is useful without stopping replay.'},
 {'id': 'q9002',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'A tenant has both the Microsoft traffic profile and the Internet access profile enabled for all users. An administrator sets the rule '
              "for *.sharepoint.com to Bypass in the Microsoft traffic profile. How is a user's traffic to a SharePoint Online site handled?",
  'options': ['It is acquired by the Internet access profile instead, so web content filtering still applies',
              'It is forwarded to Global Secure Access anyway because the Internet access profile is a catch-all for unmatched traffic',
              'It is blocked until the rule is changed back to Forward',
              "It skips Global Secure Access acquisition and egresses over the device's normal network path"],
  'correct': 3,
  'explanation': 'Traffic that the Microsoft traffic profile can acquire can only be acquired by that profile, so a Bypass rule means neither '
                 'profile acquires it and it leaves directly from the device. The Internet access profile does not pick it up, and nothing is '
                 'blocked, because Bypass only stops acquisition. The practical consequence is that bypassed Microsoft traffic also loses compliant '
                 'network and source IP benefits.'},
 {'id': 'q9003',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Contoso must retire its VPN within weeks. Remote users need access to about forty internal servers by FQDN and IP range, over several '
              'TCP and UDP ports, including non-web protocols. Later, the team wants separate Conditional Access policies per application. What is '
              'the best plan?',
  'options': ['Publish each server through Microsoft Entra application proxy, which handles web apps only',
              'Add the Microsoft traffic profile rules for the internal ranges so users reach them through the client',
              'Configure Quick Access with a private network connector group now, then move to per-app access for segmentation',
              'Use the Internet access profile with a web content filtering policy that allows the internal FQDNs'],
  'correct': 2,
  'explanation': 'Quick Access is the fast path for tunneling a broad set of FQDNs, IP addresses, and ranges on any port or protocol, and per-app '
                 'access later splits resources into separate Global Secure Access apps with their own policies. Application proxy publishes web '
                 'applications and does not cover arbitrary TCP and UDP services. The Microsoft traffic profile is for Microsoft 365 destinations, '
                 'and the Internet access profile governs public internet traffic, not private resources behind a connector.'},
 {'id': 'q9004',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'The network team refuses to open any inbound firewall ports into the datacenter that hosts the private applications. Which statement '
              'about deploying private network connectors for Entra Private Access is correct?',
  'options': ['Connectors only make outbound connections, so outbound ports 80 and 443 to the service are required and no inbound ports are opened',
              'Connectors must sit in a perimeter network with inbound TCP 443 published to the internet',
              "Connectors are installed on each user's device and call the datacenter directly",
              'Connectors need a site-to-site VPN to Azure before they can register'],
  'correct': 0,
  'explanation': 'The connector is an agent on Windows Server that dials out to the service, and traffic flows both ways over that established '
                 'session, so no inbound rule is needed. A perimeter network is allowed but unnecessary, and publishing inbound 443 is exactly what '
                 'the design avoids. Devices run the Global Secure Access client, not the connector. No VPN is involved, since the whole point is '
                 'VPN replacement.'},
 {'id': 'q9005',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'An administrator created a web content filtering policy that blocks the Gambling category and added it to a security profile. The '
              'Internet access forwarding profile is enabled and assigned to all users, yet gambling sites still load. Which step is missing?',
  'options': ['Add the gambling FQDNs to the Microsoft traffic profile as bypass rules',
              'Link the security profile to a Conditional Access policy that targets the users',
              'Enable Global Secure Access signaling for source IP restoration',
              'Install a private network connector in the same region as the users'],
  'correct': 1,
  'explanation': 'A security profile has no effect until it is linked to a Conditional Access policy, because Conditional Access is what applies the '
                 'profile to the users and conditions you choose. Bypass rules in the Microsoft profile would stop acquisition rather than enforce '
                 'blocking. Source IP restoration affects which IP address Entra sees, not web filtering. Connectors serve Private Access, not '
                 'internet filtering.'},
 {'id': 'q9006',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'After rolling out Entra Internet Access, FQDN-based blocking works for some Windows users but not for others whose browsers have '
              'Secure DNS (DNS over HTTPS) turned on. What should you do?',
  'options': ['Turn off DNS over HTTPS on those devices so the client can match the FQDN rules',
              'Move those users to a custom Private Access profile',
              'Create a second security profile with the same policy',
              'Raise the priority of the Microsoft traffic profile above the Internet access profile'],
  'correct': 0,
  'explanation': 'The client matches queried names against the forwarding rules, and an encrypted DNS lookup made by the browser hides those names, '
                 'so the traffic is never tunneled for filtering. Disabling DNS over HTTPS restores visibility. A Private Access profile is for '
                 'private resources. Duplicating a profile changes nothing about what the client sees, and profile order between Microsoft and '
                 'Internet is fixed rather than something you reprioritize to fix a DNS problem.'},
 {'id': 'q9007',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': "Since deploying the Global Secure Access client, Microsoft Entra sign-in logs show every user's IP address as the same Microsoft "
              'egress address. IP-based named locations no longer match and risk detections look less accurate. What fixes this without removing the '
              'client?',
  'options': ['Add the Microsoft egress address as a trusted named location',
              'Disable the Microsoft traffic profile for all users',
              'Convert the named locations to country-based locations',
              'Enable source IP restoration, which requires the Microsoft traffic profile'],
  'correct': 3,
  'explanation': "Source IP restoration securely passes the user's original egress IP to Entra ID and Microsoft Graph, so location policies, ID "
                 'Protection, and logs see the real address. Trusting the shared Microsoft address would let any attacker routed through the service '
                 'satisfy the location. Disabling the profile removes the compliant network benefit and does not restore accuracy in a controlled '
                 'way. Country-based locations still need a reliable source IP.'},
 {'id': 'q9008',
  'cat': 'authAccessMgmt',
  'type': 'ms',
  'question': 'Which two statements about the Global Secure Access client are true? (Choose two.)',
  'options': ['On Windows it acquires traffic with a lightweight filter driver, so it can coexist with a non-Microsoft SSE or VPN client',
              'It is available for Windows, macOS, iOS, and Android',
              'It is required for every traffic type, because remote networks can only carry Private Access traffic',
              'It forwards every packet from the device regardless of the traffic forwarding profiles'],
  'correct': [0, 1],
  'explanation': 'The client uses a lightweight filter driver rather than a VPN tunnel, which is why it can run beside other solutions, and clients '
                 'exist for the four listed platforms. The reverse of the third statement is true: remote networks carry Microsoft and internet '
                 'traffic from branch locations, while Private Access traffic is acquired by the client. The client forwards only the traffic that '
                 'matches the enabled traffic forwarding profiles, and unmatched traffic is not forwarded.'},
 {'id': 'q9009',
  'cat': 'authAccessMgmt',
  'type': 'tf',
  'question': 'A Conditional Access policy can target the Private Access traffic profile directly, the same way it can target the Microsoft traffic '
              'and Internet access profiles.',
  'answer': False,
  'explanation': 'Universal Conditional Access applies to the Microsoft traffic and Internet access tunnels. For Private Access you target the '
                 'individual Private Access enterprise applications, such as Quick Access or each per-app access application, in the policy.'},
 {'id': 'q9010',
  'cat': 'authAccessMgmt',
  'type': 'tf',
  'question': 'It is safe to turn off Global Secure Access signaling for Conditional Access while active policies still require the compliant '
              'network location, because those policies are simply ignored.',
  'answer': False,
  'explanation': 'The compliant network location depends on the signaling. Disabling it with policies still in place can block targeted users from '
                 'the resources they protect, so the policies should be deleted or changed first.'},
 {'id': 'q9011',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Corporate laptops run the Global Secure Access client. Leadership wants users on those laptops to sign in only to your tenant and two '
              'named partner tenants, blocking personal accounts and any other organization, without deploying a corporate proxy. Which feature '
              'meets this?',
  'options': ['Cross-tenant access settings with inbound B2B collaboration blocked for all other organizations',
              'Universal tenant restrictions enforcing a tenant restrictions v2 policy',
              'An outbound-only Conditional Access policy on the guest user type',
              'A web content filtering policy that blocks login.microsoftonline.com for other tenants'],
  'correct': 1,
  'explanation': 'Universal tenant restrictions apply the tenant restrictions v2 policy to devices that use the client or a remote network, so users '
                 'can authenticate only to the allowed external tenants. Cross-tenant access settings govern B2B collaboration trust between '
                 'tenants, not what tenants your own users may sign in to from your devices. Guest-focused Conditional Access does not govern your '
                 'own members signing in elsewhere. Filtering the sign-in endpoint by FQDN cannot distinguish tenants and would break your own '
                 'sign-in.'},
 {'id': 'q9012',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Remote users connect through Quick Access and can reach internal servers by IP address, but browsing to the internal name '
              'intranet.corp.contoso.local fails. What should you configure?',
  'options': ['A new per-app access app with a Conditional Access policy that requires MFA',
              'A public DNS record for corp.contoso.local pointing at the connector',
              'The corp.contoso.local DNS suffix in the Quick Access configuration so Private DNS can resolve it',
              'A Microsoft traffic profile rule for the internal domain with the Forward action'],
  'correct': 2,
  'explanation': 'Private DNS sends queries for names that match the configured suffix to the Global Secure Access DNS proxy, which resolves them '
                 "through the connector's resolver, so the suffix has to be added to the Quick Access configuration. A per-app app with MFA changes "
                 'access control, not name resolution. A public record for an internal name would expose it and is not how Private Access resolves '
                 'names. The Microsoft traffic profile only covers Microsoft services.'},
 {'id': 'q9013',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'A tenant has only Microsoft Entra ID P1 licenses assigned and no Entra Suite or standalone Global Secure Access licenses. Which '
              'capability can the organization use for its users?',
  'options': ['Web content filtering by category in Entra Internet Access',
              'Per-app access to private TCP applications in Entra Private Access',
              'The compliant network check enabled through the Microsoft traffic profile',
              'Private DNS name resolution for internal suffixes'],
  'correct': 2,
  'explanation': 'The Microsoft traffic profile and the features built on it, including the compliant network check, source IP restoration, and '
                 'universal tenant restrictions, are included with Microsoft Entra ID P1 or P2. Web content filtering requires the Entra Internet '
                 'Access license, and per-app access and Private DNS require the Entra Private Access license, both also available in the Microsoft '
                 'Entra Suite.'},
 {'id': 'q9014',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'A new administrator must enable the Microsoft traffic forwarding profile and then create the Conditional Access policy that requires '
              'the compliant network. Which role assignment follows least privilege?',
  'options': ['Global Administrator',
              'Global Secure Access Administrator and Conditional Access Administrator',
              'Security Administrator',
              'Application Administrator and Cloud Application Administrator'],
  'correct': 1,
  'explanation': 'The Global Secure Access Administrator role manages the Global Secure Access features and traffic profiles, and the Conditional '
                 'Access Administrator role creates and manages the Conditional Access policies and named locations. Global Administrator works but '
                 'is far broader than needed. Security Administrator does not cover either task, and the application administrator roles manage '
                 'enterprise applications, not traffic profiles or Conditional Access.'},
 {'id': 'q9101',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': "Most of Adatum's employees work remotely, so firewall and proxy logs miss much of their cloud app use. Security wants continuous "
              'Shadow IT reporting that covers devices wherever they are, without deploying log collectors. What should you use as the cloud '
              'discovery data source?',
  'options': ['Defender for Endpoint integration with Defender for Cloud Apps',
              'A snapshot report built from a weekly manual upload of proxy logs',
              'An app connector for Microsoft 365',
              'A session policy for each discovered app'],
  'correct': 0,
  'explanation': 'Defender for Endpoint reports cloud app use from every onboarded device, on or off the network, and feeds continuous cloud '
                 'discovery natively. Snapshot reports only cover the logs you upload and only on the schedule you upload them. App connectors read '
                 "data from a connected provider's API and do not enumerate every cloud app users reach. Session policies control sessions in an app "
                 'that is already onboarded; they do not discover unknown apps.'},
 {'id': 'q9102',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': "A legal team asks for a one-time evaluation of the risk of cloud apps seen in last quarter's proxy logs, which are exported files. No "
              'ongoing monitoring is needed. Which report type fits?',
  'options': ['Continuous report fed by a log collector over Syslog',
              'Snapshot report from manually uploaded traffic logs',
              'Continuous report fed by Defender for Endpoint',
              'OAuth app policy with a high permission threshold'],
  'correct': 1,
  'explanation': 'Snapshot reports give ad hoc visibility into a set of logs you upload by hand, which is exactly a one-time analysis of exported '
                 'files. Both continuous options are built for ongoing automated ingestion, which the request explicitly does not need. An OAuth app '
                 'policy governs permissions granted to OAuth apps, not discovered traffic.'},
 {'id': 'q9103',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'An analyst marked a file-sharing app as Unsanctioned in Defender for Cloud Apps. The company uses Defender for Endpoint, yet users on '
              'managed laptops can still open the app. What is the most likely missing configuration?',
  'options': ['A session policy for the file-sharing app',
              'An access policy that blocks native clients',
              'Network protection and cloud protection enabled in Defender for Endpoint',
              'A new app connector for the file-sharing app'],
  'correct': 2,
  'explanation': 'Unsanctioning does not itself block traffic. With Defender for Endpoint, blocking unsanctioned apps relies on cloud protection and '
                 'network protection being turned on for the devices. Session and access policies apply to apps routed through Conditional Access '
                 'app control, which a discovered consumer file-sharing site is not. App connectors integrate sanctioned apps through APIs and do '
                 'not block access.'},
 {'id': 'q9104',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': "Contractors use unmanaged laptops to open the company's Microsoft SharePoint Online sites in a browser. Management wants them able to "
              'browse and edit online but unable to download files labeled Confidential. Which control meets this with the least disruption?',
  'options': ['A Conditional Access grant control that requires a compliant device',
              'A Defender for Cloud Apps session policy that blocks download of labeled files, with a Conditional Access policy routing the session',
              'A Defender for Cloud Apps access policy that blocks SharePoint Online for unmanaged devices',
              'An OAuth app policy that bans the SharePoint Online app'],
  'correct': 1,
  'explanation': 'Session policies allow access while controlling in-session activity such as downloading labeled files, and they depend on a '
                 'Conditional Access policy that sends the session through Defender for Cloud Apps. Requiring a compliant device would block '
                 'contractors completely because their laptops are unmanaged. An access policy also blocks outright rather than limiting activity. '
                 'An OAuth app policy has nothing to do with browser downloads and banning the app would disable it for everyone.'},
 {'id': 'q9105',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'A third-party calendar app has been consented to by more than 80 employees and requests the permission to read and write all mail. '
              'Security wants an automatic alert on any app like this and the ability to disable offending apps. What should you configure?',
  'options': ['A session policy that blocks uploads to the calendar app',
              'A cloud discovery policy for unsanctioned apps',
              'A user consent setting that requires admin approval for all apps',
              'An OAuth app policy in Defender for Cloud Apps with a permission level and user count threshold'],
  'correct': 3,
  'explanation': "OAuth app policies alert when an app meets criteria such as high permissions authorized by many users, and banning the app's "
                 'permission disables the associated enterprise application. A session policy applies to a user session in a proxied app, not to '
                 'OAuth grants. A cloud discovery policy works on traffic logs. Tightening user consent prevents future grants but neither alerts on '
                 'the existing app nor disables it.'},
 {'id': 'q9106',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'The security team needs to scan files already stored in Box, spot overshared content, and remove external sharing links through a '
              'governance action. Users reach Box in many ways, including native sync clients, and no session routing is wanted. Which capability '
              'applies?',
  'options': ['A Conditional Access app control session policy',
              'The Box app connector in Defender for Cloud Apps',
              'Application-enforced restrictions for Box',
              'Universal tenant restrictions in Global Secure Access'],
  'correct': 1,
  'explanation': "App connectors use the provider's API to read activities and files and to run governance actions such as removing sharing, "
                 'regardless of how the user connects. Session policies only see browser sessions routed through the proxy, so they cannot scan '
                 'stored files or cover native clients. Application-enforced restrictions exist only for Exchange Online and SharePoint Online. '
                 'Tenant restrictions govern which Microsoft Entra tenants users can sign in to.'},
 {'id': 'q9107',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'Unmanaged devices should get browser-only, limited access to SharePoint Online (no download or sync). The team wants a native control '
              'that needs no reverse proxy and no Defender for Cloud Apps session policies. What should you configure?',
  'options': ['A Conditional Access session control that uses application-enforced restrictions, with the limited-access setting enabled in '
              'SharePoint Online',
              'A sign-in frequency session control set to every time',
              'A Defender for Cloud Apps session policy that monitors only',
              'A persistent browser session control set to never persistent'],
  'correct': 0,
  'explanation': 'Application-enforced restrictions make Entra ID pass device state to SharePoint Online or Exchange Online, which then deliver a '
                 'limited experience for unmanaged devices once its own restriction setting is on. Sign-in frequency and persistent browser sessions '
                 'govern how long a session lasts, not what the session can do. A monitor-only session policy observes activity but blocks nothing, '
                 'and it needs the proxy.'},
 {'id': 'q9108',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'Your organization cares far more about compliance certifications than about vendor hosting details when judging cloud apps. How '
              'should you make the Defender for Cloud Apps risk score reflect this?',
  'options': ['Unsanction every app that lacks a compliance certification',
              'Create a custom app for each discovered app with the desired score',
              'Customize the weights of the risk categories and factors used in the risk score',
              'Filter the discovery dashboard by headquarters location'],
  'correct': 2,
  'explanation': 'By default every parameter carries equal weight, and you can adjust the weights so the score matches your priorities. '
                 'Unsanctioning is a governance tag, not a change to scoring. Custom apps are for software missing from the catalog, not for '
                 'rewriting scores of catalog apps. A location filter changes what you see but not how apps are scored.'},
 {'id': 'q9109',
  'cat': 'workloadIdentities',
  'type': 'ms',
  'question': 'Which two statements about Conditional Access app control in Defender for Cloud Apps are true? (Choose two.)',
  'options': ['Microsoft Entra apps are onboarded automatically, while apps behind a non-Microsoft identity provider must be onboarded manually',
              'Sessions in non-Edge browsers show an app URL with an .mcas.ms suffix because the session is reverse proxied',
              'It requires an agent installed on every unmanaged device',
              'Policies for a host app such as Teams automatically also cover SharePoint and OneDrive'],
  'correct': [0, 1],
  'explanation': 'Entra ID apps are onboarded automatically and non-Microsoft IdP apps need manual onboarding, and the .mcas.ms suffix is how '
                 'reverse proxied sessions look in browsers other than Edge. No device agent is needed, which is the reason it suits unmanaged and '
                 'partner devices. Policies are tied to the app they were created for, so related resource apps need their own policy.'},
 {'id': 'q9110',
  'cat': 'workloadIdentities',
  'type': 'tf',
  'question': 'An access policy in Defender for Cloud Apps allows the session and monitors what the user does, while a session policy blocks or '
              'allows access outright.',
  'answer': False,
  'explanation': 'The roles are reversed. Access policies allow or block access completely, and session policies allow access while monitoring or '
                 'limiting activities in the session.'},
 {'id': 'q9111',
  'cat': 'workloadIdentities',
  'type': 'tf',
  'question': 'Marking an app Unsanctioned in Defender for Cloud Apps blocks it on every device on its own, with no other configuration.',
  'answer': False,
  'explanation': 'Unsanctioning flags the app for monitoring and governance. Blocking needs an enforcement path such as Defender for Endpoint (with '
                 'cloud protection and network protection on), a supported secure web gateway integration, or a generated block script.'},
 {'id': 'q9120',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'A company deploys 200 AI agents of the same type. Security requires that none of them stores a secret itself, that Conditional Access '
              'and permissions be governed in one place, and that all of them can be cut off at once if the type is found vulnerable. What should '
              'you use?',
  'options': ['One app registration per agent, each with its own client secret',
              'A single shared user account used by all agents',
              'One user-assigned managed identity attached to every agent',
              'An agent identity blueprint with an agent identity per agent'],
  'correct': 3,
  'explanation': 'Agent identities hold no credentials, the blueprint holds them, and Conditional Access and permissions set on the blueprint apply '
                 'to every agent identity created from it. Disabling the blueprint stops all of them from authenticating. Per-agent app '
                 'registrations with secrets scatter credentials and policy. A shared user account breaks Conditional Access and ID Protection '
                 'assumptions and defeats individual auditing. A user-assigned managed identity can only be attached to Azure resources and does not '
                 'fit agents running elsewhere.'},
 {'id': 'q9121',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'Compliance requires that every AI agent have a named person or group accountable for it who can decide to retire it, but who must not '
              'receive technical administrator rights over the agent. Which assignment should you make?',
  'options': ['Add the person as a sponsor of the agent identity',
              'Add the person as an owner of the agent identity',
              'Assign the person the Application Administrator role',
              "Assign the person as the manager of the agent's user account"],
  'correct': 0,
  'explanation': 'Sponsors provide business accountability and can make lifecycle decisions without technical admin access. Owners are the technical '
                 'administrators, which is more access than required. Application Administrator is a broad directory role. Managers are designated '
                 "for an agent's user account, which may not even exist."},
 {'id': 'q9122',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'An agent must have its own mailbox, join Teams chats, and appear in the HR system like a team member. Which identity construct is '
              'intended for this?',
  'options': ['A system-assigned managed identity on the host VM',
              "The agent's user account, created in addition to its agent identity",
              'A guest user invited through B2B collaboration',
              'A service principal with delegated Mail.Read permission'],
  'correct': 1,
  'explanation': "The optional agent's user account is meant for agents that act as digital workers needing user-only resources like mailboxes and "
                 'chat. A managed identity belongs to an Azure resource and cannot hold a mailbox. A B2B guest is an external person, not an agent. '
                 'A service principal with a delegated permission still is not a user and cannot be a chat participant.'},
 {'id': 'q9123',
  'cat': 'workloadIdentities',
  'type': 'tf',
  'question': 'An agent identity can be issued tokens in other Microsoft Entra tenants, so one agent can call APIs across partner tenants.',
  'answer': False,
  'explanation': 'Agent identities can only be issued tokens in the tenant where they are created and cannot access resources or APIs in other '
                 'tenants.'},
 {'id': 'q9124',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'An on-premises IIS farm behind a load balancer runs a service under a domain account whose password was set years ago and is shared '
              'with several administrators. You need a service account on Active Directory that avoids manual password rotation and works across all '
              'farm servers. What should you use?',
  'options': ['A system-assigned managed identity for each server',
              'A standalone managed service account on each server',
              'A group managed service account',
              'An app registration with a client secret'],
  'correct': 2,
  'explanation': 'A gMSA can be deployed to several servers in a farm, and Windows rotates its long random password automatically, so no one handles '
                 'it. A standalone managed service account is limited to a single server. A system-assigned managed identity only exists for Azure '
                 'resources, not for on-premises Windows servers. An app registration secret would add an expiring credential someone must rotate.'},
 {'id': 'q9125',
  'cat': 'workloadIdentities',
  'type': 'mc',
  'question': 'A department wants its users to see a tidy set of ten finance applications grouped together on the My Apps portal, separately from '
              'other apps. The tenant has Microsoft Entra ID P1. What should an Application Administrator configure?',
  'options': ['A custom security attribute on the finance users',
              'An application management policy for the finance apps',
              'A dynamic group of finance users assigned the apps',
              'A collection under Enterprise apps > App launchers with the apps and the finance group assigned'],
  'correct': 3,
  'explanation': 'My Apps collections group related applications for chosen users and groups and need P1 or P2. Custom security attributes label '
                 'objects but do not organize the portal. Application management policies restrict credential settings on apps. A group can grant '
                 'the apps through assignment, but it does not group them into a collection on the My Apps page.'},
 {'id': 'q9201',
  'cat': 'userIdentities',
  'type': 'mc',
  'question': 'You added contoso.com as a custom domain and created the TXT record, but verification keeps failing even after waiting several hours '
              'and confirming the record is correct. A colleague notes that a team once signed up for a Power BI trial with contoso.com addresses. '
              'What is the most likely cause and fix?',
  'options': ['The initial onmicrosoft.com domain must be deleted before another domain can be verified',
              'The domain must be registered as the primary domain before it can be verified',
              'The domain is already verified in another tenant, possibly an unmanaged one, so it must be removed or taken over there',
              'TXT records are not supported and the verification must use a CNAME record'],
  'correct': 2,
  'explanation': 'A domain name can be verified in only one tenant. Self-service sign-up can create an unmanaged tenant that already holds the name, '
                 'which has to be taken over (or the name removed from the other directory). The initial domain cannot be deleted at all and is not '
                 'an obstacle. Primary status is set after verification, not before. TXT or MX records are exactly what Entra asks for.'},
 {'id': 'q9202',
  'cat': 'userIdentities',
  'type': 'tf',
  'question': 'Setting "Users may join devices to Microsoft Entra ID" to None prevents Microsoft Entra hybrid join of domain-joined Windows '
              'computers.',
  'answer': False,
  'explanation': 'The setting applies to user-driven Microsoft Entra join. Hybrid join, Azure VMs, and Autopilot self-deploying mode work in a '
                 'userless context and are not governed by it.'},
 {'id': 'q9203',
  'cat': 'userIdentities',
  'type': 'mc',
  'question': 'A power user receives an error when registering a new tablet with Microsoft Entra ID, having already joined or registered many '
              'devices. Defaults are unchanged. What is the right adjustment?',
  'options': ['Raise the maximum number of devices per user in device settings, which defaults to 50 and can go up to 100',
              'Assign the user the Cloud Device Administrator role',
              'Remove the user from the "Users may join devices" scope',
              'Convert the user to a guest to lift device limits'],
  'correct': 0,
  'explanation': 'Joined and registered devices count against a per-user maximum that defaults to 50 and can be raised to 100, or set to unlimited '
                 "subject to other quotas. A device administrator role manages devices but does not change the user's limit. Removing the user from "
                 'the join scope would block joining instead. Guest status is unrelated.'},
 {'id': 'q9204',
  'cat': 'userIdentities',
  'type': 'mc',
  'question': 'Ravi holds User Administrator scoped to the Sales administrative unit and Groups Administrator across the whole tenant. Which '
              'statement about his effective permissions is correct?',
  'options': ['He can reset passwords for any user in the tenant because the broader assignment wins',
              'He can manage any group in the tenant but reset passwords only for users in the Sales unit',
              'He cannot manage groups because the unit-scoped assignment restricts all of his roles',
              'He can reset passwords for Sales users and manage only the groups inside the Sales unit'],
  'correct': 1,
  'explanation': 'Effective permissions are the union of assignments, each limited by its own scope. User Administrator applies only inside Sales, '
                 'and Groups Administrator is tenant-wide, so he manages all groups but resets passwords only in that unit. Groups Administrator '
                 'does not grant password reset for users, so a broader assignment does not make him an all-tenant password administrator. Scope '
                 'belongs to each assignment, not to the person, so a unit-scoped role does not restrict his other roles, and his tenant-wide group '
                 'role is not limited to the Sales unit.'},
 {'id': 'q9210',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'A synced employee with Exchange Online access is being dismissed today. HR wants access cut as fast as possible. The account is '
              'mastered in on-premises Active Directory. Which actions should the administrator take?',
  'options': ['Delete the synced user in the Entra admin center and rely on that to end all access',
              "Disable the account and reset the password twice in on-premises AD, then revoke the user's sessions in Entra",
              "Only remove the user's licenses, which immediately invalidates all tokens",
              'Only enable security defaults for the tenant'],
  'correct': 1,
  'explanation': 'For a synced user the source of authority is Active Directory, so disable it there and reset the password twice to blunt '
                 'pass-the-hash risk, then revoke sessions in Entra to invalidate refresh tokens. A cloud-side delete of a synced object does not '
                 'hold, because the source of authority is on-premises and the object can be recreated or restored by sync. Removing licenses does '
                 'not invalidate tokens already issued. Security defaults protect sign-ins in general and do nothing about this specific account.'},
 {'id': 'q9211',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Users on Microsoft Entra joined Windows laptops sign in with FIDO2 keys but cannot open on-premises file shares without a password '
              'prompt. Domain controllers run Windows Server 2022. What makes the shares work without passwords?',
  'options': ['Seamless single sign-on with the AZUREADSSOACC computer account',
              'Pass-through authentication agents on the domain controllers',
              'Microsoft Entra Kerberos, where Entra ID issues a partial TGT that a domain controller exchanges for a full TGT',
              'Password writeback so the FIDO2 key can set an AD password'],
  'correct': 2,
  'explanation': "With Entra Kerberos, Entra ID returns a ticket-granting ticket containing only the user's SID alongside the PRT, and the domain "
                 'controller exchanges it for a full TGT, so on-premises resources are reachable after a passwordless sign-in. Seamless SSO serves '
                 'domain-joined devices on the corporate network for cloud apps, not this on-premises resource scenario. Pass-through authentication '
                 'validates passwords and there is none here. Password writeback relates to resets, not Kerberos tickets.'},
 {'id': 'q9212',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Administrators must register only attested hardware security keys, while frontline staff should be allowed to use synced passkeys on '
              'their phones. Today there is one tenant-wide FIDO2 setting. What should you do?',
  'options': ['Use authentication strengths so frontline staff are exempt from phishing-resistant MFA',
              'Create separate passkey profiles targeted to each group, enforcing attestation for administrators',
              'Enable attestation tenant-wide and let frontline staff register synced passkeys anyway',
              'Disable passkeys and require Authenticator push for everyone'],
  'correct': 1,
  'explanation': 'Passkey profiles are group-targeted and can differ in passkey type and attestation, which is exactly this split. Enforcing '
                 'attestation limits a profile to device-bound passkeys because synced passkeys do not support attestation, so a tenant-wide '
                 'attestation requirement would block the frontline staff. Authentication strengths decide which methods satisfy a policy, not who '
                 'may register which passkey. Disabling passkeys discards the phishing-resistant option.'},
 {'id': 'q9213',
  'cat': 'authAccessMgmt',
  'type': 'tf',
  'question': 'Synced passkeys support attestation, so enforcing attestation in a passkey profile still allows them.',
  'answer': False,
  'explanation': 'Synced passkeys do not support attestation. With attestation enabled, only device-bound passkeys are allowed, which is why '
                 'regulated groups often get a separate profile.'},
 {'id': 'q9214',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'Entra sign-in logs are streamed to a Log Analytics workspace. Which KQL query returns the number of interactive sign-ins per '
              'application over the past seven days?',
  'options': ['AuditLogs | where TimeGenerated >= ago(7d) | summarize count() by OperationName',
              'SigninLogs | where CreatedDateTime >= ago(7d) | project AppDisplayName | count',
              'SigninLogs | where CreatedDateTime >= ago(7d) | summarize signInCount = count() by AppDisplayName',
              'AADProvisioningLogs | where TimeGenerated >= ago(7d) | summarize count() by AppDisplayName'],
  'correct': 2,
  'explanation': 'SigninLogs holds interactive sign-ins, and summarize ... by AppDisplayName produces one count per application. AuditLogs records '
                 'directory changes grouped here by operation, not sign-ins. The project then count form returns a single total instead of '
                 'per-application counts. AADProvisioningLogs records provisioning events, not user sign-ins.'},
 {'id': 'q9215',
  'cat': 'authAccessMgmt',
  'type': 'mc',
  'question': 'A new analyst must create a diagnostic setting that sends Microsoft Entra audit and sign-in logs to an existing Log Analytics '
              'workspace, with no more Entra privilege than necessary. Which Entra role should be assigned, assuming the workspace permissions are '
              'handled separately?',
  'options': ['Global Reader', 'Reports Reader', 'Security Administrator', 'Log Analytics Reader'],
  'correct': 2,
  'explanation': 'Creating or editing a Microsoft Entra diagnostic setting requires the Security Administrator role in the tenant, along with rights '
                 'on the destination. Global Reader and Reports Reader can read reports but not change settings. Log Analytics Reader is an Azure '
                 'role for reading workspace data and does not create diagnostic settings.'}])

if 'MADLIBS' not in globals():
    MADLIBS = []
MADLIBS.extend([{'id': 'ml-sc300-9001',
  'cat': 'authAccessMgmt',
  'scenario': "A tenant wants to make Microsoft 365 requests succeed only when they come through the organization's network security service, with "
              'no egress IP lists to maintain. After enabling Global Secure Access signaling for Conditional Access, an administrator references the '
              '{b1} location in a policy that blocks everything else. Branch offices without the client can still qualify by connecting through a '
              '{b2}.',
  'blanks': [{'key': 'b1',
              'options': ['All Compliant Network locations', 'All trusted locations', 'MFA trusted IPs', 'Countries and regions'],
              'correct': 0},
             {'key': 'b2', 'options': ['remote network', 'connector group', 'security profile', 'registration campaign'], 'correct': 0}],
  'explanation': 'Enabling signaling creates the All Compliant Network locations named location, which a policy can use to require traffic from the '
                 "tenant's Global Secure Access. Branch locations without the client qualify by being configured as a remote network."},
 {'id': 'ml-sc300-9002',
  'cat': 'authAccessMgmt',
  'scenario': 'To replace a VPN quickly, a team adds all internal FQDNs and IP ranges to {b1}. Later, one sensitive finance application needs its '
              'own Conditional Access policy, so the team creates a {b2} for it. Both rely on a private network connector that makes only outbound '
              'connections.',
  'blanks': [{'key': 'b1',
              'options': ['Quick Access', 'the Internet access profile', 'a web content filtering policy', 'the Microsoft traffic profile'],
              'correct': 0},
             {'key': 'b2', 'options': ['per-app access application', 'remote network', 'passkey profile', 'named location'], 'correct': 0}],
  'explanation': 'Quick Access is the primary broad set of private FQDNs and IPs, and per-app access creates separate Global Secure Access '
                 'applications so a subset of resources can have different assignments and Conditional Access policies.'},
 {'id': 'ml-sc300-9003',
  'cat': 'workloadIdentities',
  'scenario': 'To see which unapproved cloud apps users reach even from home, a security team connects Defender for Endpoint to feed {b1}. When a '
              'risky app is tagged Unsanctioned, it is actually blocked on devices only if {b2} is turned on in Defender for Endpoint.',
  'blanks': [{'key': 'b1',
              'options': ['an app connector report', 'continuous cloud discovery reports', 'a session policy', 'an access policy'],
              'correct': 1},
             {'key': 'b2', 'options': ['automated investigation', 'network protection', 'live response', 'tamper protection'], 'correct': 1}],
  'explanation': 'Defender for Endpoint integration feeds continuous cloud discovery from every onboarded device. Blocking unsanctioned apps through '
                 'Defender for Endpoint relies on network protection (with cloud protection) being enabled.'},
 {'id': 'ml-sc300-9004',
  'cat': 'workloadIdentities',
  'scenario': 'An AI agent has no credentials of its own. Its {b1} holds the credentials and acquires tokens for it, and the human accountable for '
              'the agent in a business sense is recorded as its {b2}.',
  'blanks': [{'key': 'b1',
              'options': ['agent identity blueprint', 'user-assigned managed identity', 'administrative unit', 'connected organization'],
              'correct': 0},
             {'key': 'b2', 'options': ['sponsor', 'access package', 'redirect URI', 'connector group'], 'correct': 0}],
  'explanation': 'Agent identities rely on their blueprint for credentials and token acquisition, and the sponsor field records the human or group '
                 'accountable for the agent.'}])

if 'SEQUENCES' not in globals():
    SEQUENCES = []
SEQUENCES.extend([{'id': 'seq-sc300-9001',
  'cat': 'authAccessMgmt',
  'prompt': 'Put these steps in order to block a web category for a group of users with Entra Internet Access.',
  'steps': ['Enable the Internet access traffic forwarding profile',
            'Create a web content filtering policy for the category',
            'Add the policy to a security profile',
            'Link the security profile to a Conditional Access policy for the users',
            'Assign the users or groups to the Internet access traffic forwarding profile'],
  'explanation': 'The Internet access profile must exist first so traffic can be acquired; the filtering policy defines what to block, the security '
                 'profile packages policies, the Conditional Access link applies the profile to chosen users, and assignment makes sure those users '
                 'actually receive the forwarding profile.'},
 {'id': 'seq-sc300-9002',
  'cat': 'authAccessMgmt',
  'prompt': 'Put these steps in order to require a compliant network for Microsoft 365 apps.',
  'steps': ['Enable the Microsoft traffic forwarding profile',
            'Enable Global Secure Access signaling for Conditional Access',
            'Confirm the All Compliant Network locations named location exists',
            'Create a policy that blocks all resources except the compliant network location, excluding emergency access accounts',
            'Deploy the Global Secure Access client to users'],
  'explanation': 'The profile and the signaling setting come first because they create the compliant network location. The policy then references '
                 'that location and excludes break-glass accounts. Deploy the client before enforcing, or turn the policy on in report-only mode '
                 'first, so users are not locked out.'},
 {'id': 'seq-sc300-9003',
  'cat': 'workloadIdentities',
  'prompt': 'Put these steps in order to block downloads of sensitive files from SharePoint Online to unmanaged devices with Defender for Cloud '
            'Apps.',
  'steps': ['Create a Conditional Access policy that targets the app and uses the Use Conditional Access App Control session control',
            'Create a session policy that blocks download of the sensitive files',
            'Test that downloads are blocked on an unmanaged device',
            'Review the activity in the Defender portal and tune the policy'],
  'explanation': 'The Conditional Access policy routes the sessions to Defender for Cloud Apps first; the session policy is then created and scoped '
                 'in Defender for Cloud Apps, after which you test it from an unmanaged device and tune it from the activity log.'}])

if 'CASE_STUDIES' not in globals():
    CASE_STUDIES = []
CASE_STUDIES.extend([{'id': 'cs-sc300-northwind-network',
  'cat': 'authAccessMgmt',
  'title': 'Northwind Logistics Retires Its VPN',
  'scenario': 'Northwind Logistics has 4,000 employees who mostly work remotely, plus 300 contractors who use their own unmanaged laptops in a '
              'browser. The company is retiring its VPN, which currently gives remote staff access to roughly thirty on-premises servers over '
              'several TCP and UDP ports. The identity team has Microsoft Entra ID P2 and has bought Microsoft Entra Private Access licenses, but '
              'not Entra Internet Access. Security has three goals. First, Microsoft 365 must only be reachable from devices that connect through '
              "the company's own network security service, so that a stolen token replayed from elsewhere is refused, without maintaining egress IP "
              'lists. Second, contractors must be able to view SharePoint Online documents in the browser but not download documents labeled '
              'Confidential. Third, the payroll application on-premises must have its own stricter Conditional Access policy than the rest of the '
              'data center. An audit also found a popular consumer file-sharing site in use that nobody approved; devices are onboarded to Microsoft '
              'Defender for Endpoint.',
  'questions': [{'id': 'cs-sc300-northwind-network-q1',
                 'type': 'mc',
                 'question': 'How should Northwind first replace the VPN for the thirty servers and later give payroll its own policy?',
                 'options': ['Publish every server with Microsoft Entra application proxy and one policy per server',
                             'Configure Quick Access for the whole set now, then create a per-app access application for payroll with its own '
                             'Conditional Access policy',
                             'Enable the Internet access profile and add the servers to a web content filtering allow list',
                             'Create a site-to-site VPN between the data center and Azure and use Conditional Access on the VPN gateway'],
                 'correct': 1,
                 'explanation': 'Quick Access quickly tunnels the primary FQDN, IP, and port set, and a separate per-app access application lets '
                                'payroll carry its own assignments and Conditional Access policy. Application proxy covers web apps and would '
                                'multiply the work for non-web protocols. The Internet access profile is for internet traffic and the company does '
                                'not own Entra Internet Access licenses. A site-to-site VPN keeps the VPN model the project is retiring.'},
                {'id': 'cs-sc300-northwind-network-q2',
                 'type': 'mc',
                 'question': "Which combination meets the first goal, refusing Microsoft 365 requests from outside the company's network security "
                             'service?',
                 'options': ['A Conditional Access policy that blocks all resources except from the corporate office public IP addresses',
                             'Requiring a compliant device with Intune for all Microsoft 365 apps',
                             'The Microsoft traffic profile with the Global Secure Access client, Global Secure Access signaling for Conditional '
                             'Access, and a policy that blocks all resources except the compliant network location',
                             'Source IP restoration with a trusted named location for the Microsoft egress address'],
                 'correct': 2,
                 'explanation': 'The compliant network check is enforced at authentication, so a replayed token from outside the service is denied, '
                                'and it works with only Entra ID P1 or P2 through the Microsoft traffic profile. Office IP lists fail for remote '
                                'staff and require upkeep. Device compliance does not tell Entra which network path a request used. Trusting the '
                                'Microsoft egress address would let anyone routed through the service pass, which is not tenant-specific.'},
                {'id': 'cs-sc300-northwind-network-q3',
                 'type': 'mc',
                 'question': 'How should Northwind let contractors browse SharePoint Online but not download Confidential files?',
                 'options': ['Block the contractors with an access policy for SharePoint Online',
                             'Require a compliant device for the contractor group',
                             'Ban the SharePoint Online OAuth app in an OAuth app policy',
                             'Route their sessions through Conditional Access app control with a Defender for Cloud Apps session policy that blocks '
                             'downloads of labeled files'],
                 'correct': 3,
                 'explanation': 'A session policy allows the session and limits the activity, which is the stated requirement, and routing is done '
                                'by a Conditional Access policy. An access policy blocks entirely, a compliant-device requirement fails because the '
                                'laptops are unmanaged, and banning an OAuth app would disable SharePoint Online for everyone.'},
                {'id': 'cs-sc300-northwind-network-q4',
                 'type': 'ms',
                 'question': 'Which two actions let Northwind block the unapproved consumer file-sharing site on managed laptops? (Choose two.)',
                 'options': ['Tag the app Unsanctioned in Defender for Cloud Apps',
                             'Make sure cloud protection and network protection are enabled in Defender for Endpoint',
                             'Create a session policy for the site in Conditional Access app control',
                             "Add the app's permissions to an OAuth app policy"],
                 'correct': [0, 1],
                 'explanation': 'Unsanctioning marks the app, and with Defender for Endpoint integration the block is applied on devices when cloud '
                                'protection and network protection are on. A session policy needs the app to be onboarded behind an identity '
                                'provider, which a consumer site users reach directly is not. OAuth app policies concern permissions granted to '
                                'OAuth apps, not web browsing.'}]}])

if 'COMPARE' not in globals():
    COMPARE = []
COMPARE.extend([{'id': 'cmp-sc300-9001',
  'cat': 'authAccessMgmt',
  'scenario': 'Remote engineers must reach about 20 internal servers over RDP, SSH, and SMB without a VPN, using one Conditional Access policy for '
              'the whole set. Which Private Access configuration fits first?',
  'optionA': 'Quick Access, one enterprise application holding the FQDNs, IP addresses, and ports.',
  'optionB': 'Per-app access, one Global Secure Access application per server with its own policy.',
  'better': 'A',
  'why': 'Per-app access gives the finest control but means building and assigning many applications up front. Quick Access replaces the VPN fast '
         'with a single primary set of resources and a single policy, and the team can split out sensitive systems later. The stem asks for one '
         'policy, which is what Quick Access provides.'},
 {'id': 'cmp-sc300-9002',
  'cat': 'authAccessMgmt',
  'scenario': "A company wants employees on corporate laptops to be unable to sign in to personal or other organizations' Microsoft tenants, and "
              'wants this enforced even when they are off the corporate network and no proxy exists.',
  'optionA': 'Universal tenant restrictions through the Global Secure Access client.',
  'optionB': 'Cross-tenant access settings with outbound access blocked for all organizations.',
  'better': 'A',
  'why': 'Outbound cross-tenant access settings control B2B collaboration your users start with other tenants, but they do not stop a user from '
         'signing in to an unrelated tenant or personal account from a corporate device. Universal tenant restrictions apply the tenant restrictions '
         'policy wherever the client runs, which covers the off-network case without a proxy.'},
 {'id': 'cmp-sc300-9003',
  'cat': 'workloadIdentities',
  'scenario': 'Executives want contractors on unmanaged devices to open SharePoint Online in the browser but be unable to download, print, or copy '
              'labeled documents, and want the action logged in real time.',
  'optionA': 'Application-enforced restrictions, which pass device state to SharePoint Online for a limited experience.',
  'optionB': 'A Defender for Cloud Apps session policy delivered through Conditional Access app control.',
  'better': 'B',
  'why': 'Application-enforced restrictions deliver a coarse full or limited experience that SharePoint Online implements itself, with no per-label '
         'download blocking, no print or copy control, and no session-level activity policy. Session policies run in the reverse proxy and can block '
         'download, cut, copy, and print of labeled content and log the activity, which is what the stem needs.'},
 {'id': 'cmp-sc300-9004',
  'cat': 'workloadIdentities',
  'scenario': 'A security team must stop users from reaching a risky consumer file-sharing site that is not integrated with any identity provider, '
              'and wants it enforced on managed laptops.',
  'optionA': 'Tag the app Unsanctioned and enforce it through Defender for Endpoint network protection.',
  'optionB': 'Create an access policy for the app in Conditional Access app control.',
  'better': 'A',
  'why': 'Access policies work only for apps onboarded to Conditional Access app control, where the sign-in passes through Microsoft Entra or a '
         'configured identity provider. A consumer site users reach directly is not in that path. Unsanctioning it and enforcing with Defender for '
         'Endpoint blocks it at the device network layer.'}])

if 'CHEAT_SHEET' not in globals():
    CHEAT_SHEET = []
CHEAT_SHEET.extend([{'heading': 'Global Secure Access at a glance',
  'points': ['Global Secure Access is Microsoft Entra Internet Access plus Microsoft Entra Private Access (the identity-centric SSE solution), with '
             'a third Microsoft traffic profile for Microsoft 365 that needs only Entra ID P1 or P2.',
             'Three traffic forwarding profiles: Microsoft, Private access, Internet access, matched in that order; traffic matching none is not '
             'forwarded. A Bypass rule in the Microsoft profile also stops the Internet profile from acquiring that traffic.',
             'The client (Windows, macOS, iOS, Android) acquires traffic with a lightweight filter driver and can coexist with other SSE or VPN '
             'clients. Remote networks (branches) carry Microsoft and internet traffic only; Private Access needs the client.',
             'Private Access: Quick Access (broad FQDN, IP, and port set; fast VPN replacement) then per-app access (segmented apps); outbound-only '
             'private network connectors on Windows Server in connector groups (two or more); Private DNS suffixes for name resolution.',
             'Conditional Access integration: compliant network check (All Compliant Network locations after enabling signaling), universal '
             'Conditional Access on the Microsoft and Internet tunnels, and per-application targeting for Private Access apps.',
             'Also remember source IP restoration (needs Microsoft traffic profile), universal tenant restrictions (TRv2 on the client), web content '
             'filtering via security profile linked to Conditional Access, and disabling DNS over HTTPS so FQDNs are visible.']},
 {'heading': 'Defender for Cloud Apps controls',
  'points': ['Cloud discovery analyzes traffic logs against the cloud app catalog (more than 31,000 apps, more than 90 risk factors, properties '
             'scored 0 to 10, weights customizable). Snapshot reports are manual uploads; continuous reports come from Defender for Endpoint, log '
             'collectors, SWG integration, or the API.',
             'Sanctioned/Unsanctioned is a tag; blocking needs Defender for Endpoint (network protection and cloud protection on), an SWG '
             'integration, or a block script.',
             'App connectors use provider APIs for after-the-fact visibility and governance of connected apps; Conditional Access app control is the '
             'real-time reverse proxy for browser sessions and needs a Conditional Access policy to route the session.',
             'Access policies allow or block; session policies allow but monitor and limit (block download, require labeling, block malware upload). '
             'Policies are per app, so Teams policies do not cover SharePoint.',
             'Application-enforced restrictions is a native Conditional Access session control (Exchange Online and SharePoint Online only) that '
             'passes device state so the app gives a limited experience.',
             'OAuth app policies alert on risky consented apps and can ban a permission, which disables the associated enterprise application.']},
 {'heading': 'Workload identity choices',
  'points': ['Azure resource calling Entra-protected services: managed identity (system-assigned dies with the resource; user-assigned is shared and '
             'independent).',
             'Workload outside Azure (CI/CD, other clouds): app registration or service principal with workload identity federation instead of '
             'secrets.',
             'On-premises Windows service: group managed service account (Windows rotates the password; works across a farm); standalone managed '
             'service account is single-server.',
             'AI agent: agent identity created from an agent identity blueprint (blueprint holds credentials and shared policy, sponsor records '
             "accountability, tokens only in the home tenant); the optional agent's user account only when the agent must act as a user."]},
 {'heading': 'Access revocation and monitoring quick reference',
  'points': ['Revoke access: disable the account, select Revoke sessions (Revoke-MgUserSignInSession), and for hybrid users disable and reset the '
             'password twice in AD first. Access tokens last an hour by default unless the app supports continuous access evaluation.',
             'Entra Kerberos gives passwordless sign-in (FIDO2, Hello for Business cloud Kerberos trust) access to on-premises resources through a '
             'partial TGT (SID only) exchanged at a domain controller.',
             'Passkey profiles are group-targeted: device-bound vs. synced, attestation (device-bound only), AAGUID restrictions.',
             'Custom domains: TXT or MX record to verify, only verifiable in one tenant, initial onmicrosoft.com domain is permanent. Company '
             'branding needs P1 or P2 and the Organizational Branding Administrator role.',
             'Device settings: users may join or register, maximum devices (default 50, up to 100), local administrator rules; use the Conditional '
             'Access Register or join devices action for MFA. None of it affects hybrid joined devices.',
             'Logs: diagnostic settings (Security Administrator) route SigninLogs, AuditLogs, AADProvisioningLogs and more to Log Analytics, a '
             'storage account, or an event hub; analyze with KQL or workbooks.']}])

if 'LESSONS' not in globals():
    LESSONS = []
LESSONS.extend([{'id': 'global-secure-access',
  'title': 'Global Secure Access: Internet, Private, and Microsoft Traffic',
  'summary': 'Microsoft Entra Internet Access, Entra Private Access, traffic forwarding profiles, the client, and Conditional Access integration.',
  'vocabIds': ['f9001', 'f9002', 'f9003', 'f9004', 'f9005', 'f9006', 'f9007', 'f9008', 'f9009', 'f9010', 'f9011', 'f9012'],
  'quizIds': ['q9001', 'q9002', 'q9003', 'q9004', 'q9005', 'q9006', 'q9007', 'q9008', 'q9009', 'q9010', 'q9011', 'q9012', 'q9013', 'q9014'],
  'reading': 'Global Secure Access (GSA) is where Microsoft Entra extends identity-based controls to the network. Microsoft Entra Internet Access '
             'acts as an identity-aware secure web gateway for internet and SaaS traffic, and Microsoft Entra Private Access replaces a VPN with '
             "zero-trust access to private apps; together they form Microsoft's Security Service Edge. A third path, the Microsoft traffic profile, "
             'sends Microsoft 365 traffic (Exchange Online, SharePoint Online and OneDrive, Teams, and Microsoft 365 common endpoints) through the '
             'service and needs only Entra ID P1 or P2.\n'
             '\n'
             'What gets tunneled is decided by traffic forwarding profiles: Microsoft, Private access, and Internet access, evaluated in that order, '
             'with unmatched traffic left alone. Profiles are assigned to users, groups, devices, and platforms. Traffic arrives from the Global '
             'Secure Access client (Windows, macOS, iOS, and Android), which uses a lightweight filter driver rather than a VPN tunnel and so can '
             'coexist with other security clients, or from a remote network such as a branch office for Microsoft and internet traffic. Private '
             'Access traffic comes only from the client. Setting a rule to Bypass in the Microsoft profile means the Internet profile will not '
             'acquire that traffic either.\n'
             '\n'
             'For Private Access, Quick Access holds the primary set of FQDNs, IP addresses, and ranges you always tunnel, which is the fastest way '
             'to retire a VPN; per-app access then creates separate applications for finer-grained assignments and Conditional Access. Both are '
             'enterprise applications backed by private network connectors: lightweight agents on Windows Server that make outbound-only connections '
             'on ports 80 and 443 and are grouped into connector groups of at least two for availability. Private DNS suffixes added to Quick Access '
             'let remote users resolve internal names.\n'
             '\n'
             'Global Secure Access feeds Conditional Access. After you enable Global Secure Access signaling, the All Compliant Network locations '
             "named location lets a policy require that requests come through your tenant's service, which defeats replay of stolen tokens from "
             'elsewhere without maintaining IP lists. Universal Conditional Access can target the Microsoft and Internet tunnels, while Private '
             'Access apps are targeted individually. Source IP restoration keeps the real client IP visible to Entra ID and logs, universal tenant '
             'restrictions enforce a tenant restrictions v2 policy on every client device, and Entra Internet Access web content filtering applies '
             'category, URL, and FQDN policies through a security profile linked to Conditional Access. Administer it with the Global Secure Access '
             'Administrator role plus Conditional Access Administrator for policy work.',
  'fundamentalsLabel': 'New to network access controls? See the everyday analogy',
  'fundamentals': 'Think of an office building with a smart lobby. A VPN is a key to the whole building: once you are in, you can wander. Global '
                  'Secure Access is a lobby guard who looks at your badge, your device, and where you came from, and walks you only to the room you '
                  "are allowed in. The traffic forwarding profiles are the guard's sorting rules (company mail, private rooms, public street), the "
                  'client is the badge reader on your own laptop, and Conditional Access is the building policy the guard checks.',
  'keyTerms': ['Global Secure Access',
               'traffic forwarding profile',
               'Global Secure Access client',
               'Microsoft traffic profile',
               'Quick Access',
               'per-app access',
               'private network connector',
               'Private DNS',
               'web content filtering',
               'compliant network check',
               'source IP restoration',
               'universal tenant restrictions'],
  'commonTraps': ['Bypassing a destination in the Microsoft traffic profile does not hand it to the Internet access profile; it leaves the device '
                  'directly and is not secured by the service.',
                  'Conditional Access cannot target the Private Access tunnel as a whole; target the Quick Access and per-app Private Access '
                  'enterprise applications individually.',
                  'The compliant network check is not an IP list and is specific to the tenant that configures it; disabling signaling while '
                  'policies depend on it can lock users out.',
                  'Private network connectors are outbound-only; do not open inbound ports and do not put a connector on user devices.'],
  'scenario': 'A distributed company retires its VPN. It deploys the Global Secure Access client, defines Quick Access for the data-center ranges '
              'with two connectors, and later splits payroll into its own per-app access application guarded by phishing-resistant MFA. It also '
              'enables the Microsoft traffic profile and a policy that blocks Microsoft 365 unless requests come from the compliant network, '
              'excluding break-glass accounts.',
  'onTheJob': 'Admins pair a report-only Conditional Access policy with a pilot group before enforcing a compliant network requirement, because a '
              'missing client or a disabled signaling toggle otherwise locks users out of everything the policy covers. They also keep the Microsoft '
              'Intune endpoints bypassed so devices can still reach remediation when blocked by network or compliance checks.'}])

_MSR_LESSON_APPEND = {'workload-identities-apps': {'reading': '\n'
                                         '\n'
                                         'Two more families of identities and controls round out this area. For AI agents, Microsoft Entra Agent ID '
                                         'adds an agent identity (a special service principal with no credentials of its own) created from an agent '
                                         'identity blueprint that holds the credentials and the shared policy: Conditional Access or permissions set '
                                         'on the blueprint apply to every agent identity beneath it, and disabling the blueprint stops them all from '
                                         'authenticating. Owners administer an agent technically, sponsors are accountable for it in business terms, '
                                         "and an optional agent's user account exists only for agents that must act as a user. Agent identities only "
                                         'receive tokens in their home tenant. For on-premises services, a group managed service account lets '
                                         'Windows rotate a long random password across a whole server farm, replacing a shared user account.\n'
                                         '\n'
                                         'Microsoft Defender for Cloud Apps governs how people use apps. Cloud discovery compares traffic logs with '
                                         'the cloud app catalog (scored on more than 90 risk factors, with weights you can customize) using snapshot '
                                         'reports from uploaded logs or continuous reports fed by Defender for Endpoint, log collectors, secure web '
                                         'gateways, or the API; apps can then be tagged sanctioned or unsanctioned, with blocking enforced through '
                                         'Defender for Endpoint network protection. App connectors use SaaS APIs for after-the-fact visibility and '
                                         'governance, while Conditional Access app control reverse proxies browser sessions so access policies '
                                         '(allow or block) and session policies (limit download, require labeling, block malware upload) can act in '
                                         'real time; both need a Conditional Access policy to route the session. Application-enforced restrictions '
                                         'is the lightweight native alternative for Exchange Online and SharePoint Online, and OAuth app policies '
                                         'alert on risky consented apps and can ban them. My Apps collections, created under Enterprise apps > App '
                                         'launchers, group applications for users.',
                              'keyTerms': ['cloud discovery',
                                           'cloud app catalog',
                                           'app connectors',
                                           'Conditional Access app control',
                                           'access policy',
                                           'session policy',
                                           'application-enforced restrictions',
                                           'OAuth app policies',
                                           'agent identity',
                                           'agent identity blueprint',
                                           'group managed service account',
                                           'My Apps collections'],
                              'vocabIds': ['f9020',
                                           'f9021',
                                           'f9022',
                                           'f9023',
                                           'f9024',
                                           'f9025',
                                           'f9026',
                                           'f9027',
                                           'f9028',
                                           'f9030',
                                           'f9031',
                                           'f9032',
                                           'f9033',
                                           'f9034',
                                           'f9035'],
                              'quizIds': ['q9101',
                                          'q9102',
                                          'q9103',
                                          'q9104',
                                          'q9105',
                                          'q9106',
                                          'q9107',
                                          'q9108',
                                          'q9109',
                                          'q9110',
                                          'q9111',
                                          'q9120',
                                          'q9121',
                                          'q9122',
                                          'q9123',
                                          'q9124',
                                          'q9125'],
                              'commonTraps': ['Tagging an app Unsanctioned does not block it; enforcement needs Defender for Endpoint network '
                                              'protection, a secure web gateway integration, or a block script.',
                                              'Access policies allow or block access; session policies allow access but limit what happens in it. '
                                              'Neither covers a related resource app without its own policy.',
                                              'An agent identity has no credentials of its own; the blueprint holds them, and the agent identity '
                                              'cannot be issued tokens in another tenant.']},
 'entra-user-identities': {'reading': '\n'
                                      '\n'
                                      'A few administration details are tested alongside the core objects. Add a custom domain by creating the TXT '
                                      'or MX record Entra provides and selecting Verify; the initial onmicrosoft.com domain can never be removed, '
                                      'and a name can be verified in only one tenant, which is why an unmanaged tenant from self-service sign-up can '
                                      'block verification. Device settings decide who may join or register devices, the maximum number per user (50 '
                                      'by default, up to 100), and who becomes a local administrator, while hybrid joined devices ignore most of '
                                      'them. Company branding customizes sign-in pages and needs P1 or P2 plus the Organizational Branding '
                                      "Administrator role. A user's effective directory permissions are simply the union of all role assignments, "
                                      'each bounded by its own scope, with no deny assignments, and automation should use Microsoft Graph PowerShell '
                                      'because the Azure AD and MSOnline modules are deprecated.',
                           'keyTerms': ['custom domain',
                                        'device settings',
                                        'effective permissions',
                                        'Microsoft Graph PowerShell',
                                        'company branding'],
                           'vocabIds': ['f9040', 'f9041', 'f9042', 'f9043', 'f9044'],
                           'quizIds': ['q9201', 'q9202', 'q9203', 'q9204']},
 'authentication-methods-selfservice': {'reading': '\n'
                                                   '\n'
                                                   'Two current topics round out authentication. Passkey profiles let you target different passkey '
                                                   '(FIDO2) rules at different groups: device-bound passkeys keep the key on one device and can be '
                                                   'attested, while synced passkeys travel through a cloud passkey provider and cannot be attested, '
                                                   'so a profile that enforces attestation allows only device-bound passkeys. For hybrid users, '
                                                   "Microsoft Entra Kerberos lets a passwordless sign-in obtain a partial Kerberos TGT (the user's "
                                                   'SID only) that a domain controller exchanges for a full one, so on-premises resources stay '
                                                   "reachable. Finally, ending a user's access means disabling the account and revoking sessions, "
                                                   'remembering that a still-valid access token lives about an hour unless continuous access '
                                                   'evaluation applies, and that investigating activity means routing logs with a diagnostic setting '
                                                   'and querying SigninLogs and AuditLogs in Log Analytics.',
                                        'keyTerms': ['passkey profiles',
                                                     'synced passkeys',
                                                     'Microsoft Entra Kerberos',
                                                     'revoke sessions',
                                                     'diagnostic settings'],
                                        'vocabIds': ['f9050', 'f9051', 'f9052', 'f9053'],
                                        'quizIds': ['q9210', 'q9211', 'q9212', 'q9213', 'q9214', 'q9215']}}
for _lid, _d in _MSR_LESSON_APPEND.items():
    _l = _msr_find('LESSONS', _lid)
    for _f, _v in _d.items():
        if isinstance(_v, str):
            _l[_f] = _l.get(_f, '') + _v
        else:
            _l.setdefault(_f, []).extend(x for x in _v if x not in _l.get(_f, []))

_MSR_CAT_UPDATE = {'userIdentities': {'marks': 23},
 'authAccessMgmt': {'label': 'Implement Authentication and Access Management (incl. Global Secure Access)',
                    'marks': 28,
                    'resources_add': [{'label': 'Microsoft Learn: What is Global Secure Access?',
                                       'url': 'https://learn.microsoft.com/en-us/entra/global-secure-access/overview-what-is-global-secure-access'}]},
 'workloadIdentities': {'label': 'Plan and Implement Workload Identities (apps, agents, Defender for Cloud Apps)',
                        'marks': 24,
                        'resources_add': [{'label': 'Microsoft Learn: Microsoft Defender for Cloud Apps documentation',
                                           'url': 'https://learn.microsoft.com/en-us/defender-cloud-apps/'},
                                          {'label': 'Microsoft Learn: What is Microsoft Entra Agent ID?',
                                           'url': 'https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id'}]},
 'identityGovernance': {'marks': 25}}
for _c in CATEGORIES:
    _u = _MSR_CAT_UPDATE.get(_c['key'], {})
    for _f, _v in _u.items():
        if _f == 'resources_add':
            _c['resources'].extend(r for r in _v if r not in _c['resources'])
        else:
            _c[_f] = _v

_msr_fix('LESSONS', 'conditional-access-risk', 'reading', 'which cloud apps, and under which conditions', 'which target resources (formerly called cloud apps), and under which conditions')
# <<< MSREFRESH-END
