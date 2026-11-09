"""SC-900 (Microsoft Security, Compliance, and Identity Fundamentals) part A: concepts and Microsoft Entra.

Part A owns CATEGORIES, the 'concepts' and 'entra' items, the first six lessons and the
exam-strategy cheat-sheet section. Part B (sc900_b.py) owns 'security' and part C (sc900_c.py)
owns 'compliance'. IDs are unique by range: flashcards f1-f99 here, f101+ in B, f201+ in C;
questions q1+/tf1+/msq1+ here, q101+/tf101+/msq101+ in B, q201+/tf201+/msq201+ in C.
Skills measured as of 21 October 2026.
"""

CON = 'concepts'
ENT = 'entra'

CATEGORIES = [
    {'key': 'concepts', 'label': 'Security, Compliance & Identity Concepts', 'marks': 13, 'resources': [
        {'label': 'Microsoft Learn: Introduction to security, compliance, and identity concepts', 'url': 'https://learn.microsoft.com/en-us/training/paths/describe-concepts-of-security-compliance-identity/'},
    ]},
    {'key': 'entra', 'label': 'Microsoft Entra', 'marks': 27, 'resources': [
        {'label': 'Microsoft Learn: Introduction to Microsoft Entra', 'url': 'https://learn.microsoft.com/en-us/training/paths/describe-capabilities-of-microsoft-identity-access/'},
    ]},
    {'key': 'security', 'label': 'Microsoft Security Solutions', 'marks': 37, 'resources': [
        {'label': 'Microsoft Learn: Introduction to Microsoft security solutions', 'url': 'https://learn.microsoft.com/en-us/training/paths/describe-capabilities-of-microsoft-security-solutions/'},
    ]},
    {'key': 'compliance', 'label': 'Microsoft Compliance Solutions', 'marks': 23, 'resources': [
        {'label': 'Microsoft Learn: Introduction to Microsoft Priva and Microsoft Purview', 'url': 'https://learn.microsoft.com/en-us/training/paths/describe-capabilities-of-microsoft-compliance-solutions/'},
    ]},
]


def fc(n, cat, front, back, detail):
    return {'id': f'f{n}', 'cat': cat, 'front': front, 'back': back, 'detail': detail}


def mc(qid, cat, question, options, correct, explanation, why=None):
    q = {'id': qid, 'cat': cat, 'type': 'mc', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}
    if why:
        q['whyTested'] = why
    return q


def tf(qid, cat, question, answer, explanation):
    return {'id': qid, 'cat': cat, 'type': 'tf', 'question': question, 'answer': answer, 'explanation': explanation}


def ms(qid, cat, question, options, correct, explanation):
    return {'id': qid, 'cat': cat, 'type': 'ms', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}


FLASHCARDS = [
    # ---- Security and compliance concepts -------------------------------------------------
    fc(1, CON, 'Shared responsibility model',
       'A framework that divides security tasks between the cloud provider and the customer. In every service model the customer keeps responsibility for its information and data, its devices, and its accounts and identities, while the provider always owns the physical datacenter, network and hosts.',
       'Responsibility for the operating system, network controls and applications shifts with the model: the customer patches the OS on IaaS, Microsoft does on PaaS and SaaS, and an on-premises deployment leaves everything with the customer.'),
    fc(2, CON, 'Defense in depth',
       'A layered security strategy so that if one layer is breached the next one still protects the asset. Microsoft describes seven layers: physical security, identity and access, perimeter, network, compute, application, and data.',
       'Think of a castle: moat, wall, gate, guards, and a locked vault. No single control is trusted to stop every attack.'),
    fc(3, CON, 'Zero Trust model',
       'A security model that assumes the network is already compromised and never trusts a request just because of where it comes from. Its three guiding principles are verify explicitly, use least privilege access, and assume breach.',
       'Zero Trust replaces the old "trusted internal network" idea. Each request is checked against identity, device health, location and risk, whatever network it arrives from.'),
    fc(4, CON, 'Verify explicitly / least privilege / assume breach',
       'The three Zero Trust principles. Verify explicitly: authenticate and authorize using every available signal. Use least privilege access: limit access with just-in-time and just-enough-access. Assume breach: minimize blast radius, segment access, encrypt, and monitor.',
       'If an answer says "trust devices inside the corporate network", it is describing the model Zero Trust replaced.'),
    fc(5, CON, 'Confidentiality, integrity, availability (CIA)',
       'The three goals of information security. Confidentiality keeps data from unauthorized people, integrity keeps data from being altered improperly, and availability keeps systems and data reachable when needed.',
       'Encryption mainly serves confidentiality, hashing and digital signatures serve integrity, and redundancy and DDoS protection serve availability.'),
    fc(6, CON, 'Encryption',
       'Scrambling data with an algorithm and a key so only someone with the right key can read it. Data at rest is encrypted where it is stored (disks, databases, blobs), and data in transit is encrypted while it moves across a network, for example with TLS.',
       'Encryption is reversible by design; that is what separates it from hashing.'),
    fc(7, CON, 'Symmetric vs. asymmetric encryption',
       'Symmetric encryption uses one shared secret key to encrypt and decrypt, so it is fast and suited to bulk data. Asymmetric encryption uses a mathematically linked key pair: a public key that anyone can have and a private key that stays secret.',
       'A TLS connection uses both: asymmetric cryptography to agree on a secret safely, then symmetric encryption for the data itself.'),
    fc(8, CON, 'Hashing',
       'A one-way function that turns data of any size into a fixed-length value (a hash or digest). The same input always gives the same hash, and the original cannot be recovered from it, so hashing proves integrity rather than hiding data.',
       'Systems store password hashes instead of passwords, and compare the hash of what you type. Adding a random salt makes identical passwords hash differently.'),
    fc(9, CON, 'Governance, risk and compliance (GRC)',
       'Governance is the policies, roles and processes that direct how an organization is run and held accountable. Risk is identifying, assessing and reducing threats. Compliance is meeting the requirements of laws, regulations and standards.',
       'A short way to separate them: governance sets the rules, risk asks what could go wrong, and compliance proves the rules are followed.'),
    fc(10, CON, 'Data residency vs. data sovereignty',
       'Data residency is the physical or geographic location where data is stored. Data sovereignty means data is subject to the laws of the country or region where it is located.',
       'Choosing an Azure region addresses residency. Sovereignty is the legal consequence of that choice.'),
    fc(11, CON, 'Identity as the primary security perimeter',
       'With cloud services, remote work and personal devices, data and apps sit outside the corporate network, so the network edge no longer defines what is protected. The identity that signs in, and how well it is verified, becomes the main control point.',
       'This is why attackers target credentials, and why MFA, Conditional Access and passwordless sign-in are central to Microsoft security.'),
    fc(12, CON, 'Authentication vs. authorization',
       'Authentication proves who you are, for example with a password, an app prompt or a security key. Authorization decides what you may do once your identity is established, such as which files you can open.',
       'Authentication always comes first. "Sign in" is authentication, "permissions" is authorization.'),
    fc(13, CON, 'Identity provider (IdP)',
       'A service that creates and manages identity information and authenticates users on behalf of applications. Microsoft Entra ID is an identity provider; other examples are Google and Okta.',
       'Apps that trust an identity provider do not store passwords themselves; they accept a signed token that proves the user was authenticated.'),
    fc(14, CON, 'Directory service and Active Directory',
       'A directory service stores information about users, devices and resources and lets them be found and managed centrally. Active Directory Domain Services (AD DS) is Microsoft\'s on-premises directory, run on domain controllers and using Kerberos, NTLM and LDAP.',
       'Microsoft Entra ID is not simply AD DS in the cloud: it is built for web protocols such as SAML, OpenID Connect and OAuth rather than Kerberos and LDAP.'),
    fc(15, CON, 'Federation',
       'A trust relationship between identity providers that lets a user authenticated by one organization access resources of another with single sign-on. The trusting side accepts claims in a token issued by the other.',
       'Common federation protocols are SAML, WS-Federation and OpenID Connect. OAuth 2.0 is about authorization (delegated access), and OpenID Connect adds authentication on top of it.'),
    fc(16, CON, 'Single sign-on (SSO)',
       'Signing in once with one identity and then reaching multiple applications without separate prompts. SSO reduces password fatigue and gives the identity provider one place to enforce strong authentication.',
       'SSO does not mean weaker security: when MFA is enforced at the one sign-in, every connected app benefits.'),

    # ---- Microsoft Entra: function and identity types ------------------------------------
    fc(21, ENT, 'Microsoft Entra ID',
       'Microsoft\'s cloud-based identity and access management service, formerly Azure Active Directory. It handles sign-in, single sign-on and access to Microsoft 365, the Azure portal and thousands of other apps.',
       'Entra ID is the identity provider behind Microsoft 365 and Azure. Each organization has its own dedicated instance called a tenant.'),
    fc(22, ENT, 'Microsoft Entra family',
       'The product family around Entra ID: ID Governance, External ID, Verified ID, Workload ID, Domain Services, and the Global Secure Access services Entra Internet Access and Entra Private Access.',
       'The Entra Suite bundles several of these. Knowing the one-line purpose of each is enough for SC-900.'),
    fc(23, ENT, 'Entra ID Free, P1, P2 and Governance',
       'Free covers users, groups, SSO and basic MFA. P1 adds Conditional Access, dynamic groups, hybrid features and Application Proxy. P2 adds ID Protection and Privileged Identity Management. ID Governance adds entitlement management, access reviews and lifecycle workflows.',
       'The classic exam hook: risk-based Conditional Access and PIM need P2, plain Conditional Access needs P1.'),
    fc(24, ENT, 'Types of identities',
       'Entra ID manages user identities (people), group identities, device identities, and workload identities such as applications, service principals and managed identities. External users can be added as guests.',
       'Anything that needs to authenticate to something else can have an identity, not just people.'),
    fc(25, ENT, 'Workload identity',
       'An identity for software rather than a person: an application, service or script that needs to authenticate and access resources. In Entra ID the forms are app registrations and service principals, and managed identities.',
       'Using workload identities means code does not run under a person\'s account, so there is no password to share when the person leaves.'),
    fc(26, ENT, 'Managed identity',
       'A workload identity that Azure creates and manages for a resource, so code can authenticate to services such as Key Vault without storing any credential. System-assigned is tied to one resource\'s lifecycle; user-assigned is a standalone resource that several resources can share.',
       'The big benefit is no secrets in code or configuration. Delete the resource and a system-assigned identity goes with it.'),
    fc(27, ENT, 'Device identities',
       'Devices have identities in Entra ID in three forms. Registered devices are personal (BYOD) devices. Entra joined devices are owned by the organization and signed into with work accounts. Hybrid joined devices are joined to on-premises AD DS and also registered in Entra ID.',
       'Device identity is what lets Conditional Access ask whether a device is compliant or joined before granting access.'),
    fc(28, ENT, 'External identities (B2B)',
       'Entra External ID lets people outside the organization, such as partners and vendors, collaborate using their own identities. In B2B collaboration they are invited as guest users in your tenant and sign in with their home credentials.',
       'Guests can be limited and reviewed with access reviews. For customer-facing apps, External ID provides sign-up and sign-in for consumers.'),
    fc(29, ENT, 'Hybrid identity',
       'Using one set of identities across on-premises Active Directory and Microsoft Entra ID. Microsoft Entra Connect Sync or Microsoft Entra Cloud Sync synchronizes accounts to the cloud so users keep one identity for both worlds.',
       'Hybrid identity is how an organization with AD DS adopts Microsoft 365 without creating a second set of accounts.'),
    fc(30, ENT, 'Hybrid authentication methods',
       'For hybrid identity there are three ways to verify passwords: password hash synchronization (a hash of the on-premises hash is synced), pass-through authentication (validated against on-premises AD DS), and federation (for example AD FS, which hands sign-in to an on-premises provider).',
       'Password hash synchronization is the simplest and also enables leaked-credential detection. Federation is the most complex.'),
    fc(31, ENT, 'Microsoft Entra Domain Services',
       'A managed domain service that provides domain join, group policy, LDAP and Kerberos or NTLM authentication in Azure without deploying and managing domain controllers yourself.',
       'It suits lifting legacy apps that need traditional AD DS features into Azure.'),

    # ---- Microsoft Entra: authentication --------------------------------------------------
    fc(35, ENT, 'Multifactor authentication (MFA)',
       'Requiring two or more kinds of proof at sign-in: something you know (password or PIN), something you have (phone, security key) and something you are (fingerprint or face). A stolen password alone is no longer enough.',
       'Two passwords or two PINs are still one factor type. MFA needs different categories.'),
    fc(36, ENT, 'Entra authentication methods',
       'Methods include password, Microsoft Authenticator (push, code and passwordless), passkeys and FIDO2 security keys, Windows Hello for Business, certificate-based authentication, OATH hardware and software tokens, SMS and voice calls, and Temporary Access Pass.',
       'Microsoft recommends moving users toward stronger methods such as the Authenticator app and phishing-resistant passkeys; SMS and voice are the weakest MFA options.'),
    fc(37, ENT, 'Passwordless authentication',
       'Signing in without a password using something you have plus a biometric or PIN. The main options are Windows Hello for Business, Microsoft Authenticator, and passkeys or FIDO2 security keys.',
       'Passwordless methods remove the password from the attack surface, so phishing and password spray have nothing to steal.'),
    fc(38, ENT, 'Passkeys and FIDO2 security keys',
       'Passkeys are phishing-resistant credentials built on FIDO standards: a private key stays on the device or security key and a public key is registered with the service. Signing in needs the device plus a biometric or PIN, and the credential only works for the real site.',
       'FIDO2 security keys are hardware passkeys. Entra ID also supports passkeys in the Microsoft Authenticator app and synced passkeys.'),
    fc(39, ENT, 'Windows Hello for Business',
       'A passwordless credential tied to a device that unlocks with a PIN or biometric such as a fingerprint or face. The private key is protected by the device, commonly in a TPM.',
       'The PIN is local to the device and is never sent to a server, which is what makes it safer than a password.'),
    fc(40, ENT, 'Security defaults',
       'A free set of preconfigured security settings for Entra ID: it requires MFA registration, requires MFA for administrators and when risk is detected, and blocks legacy authentication. They suit small organizations that do not use Conditional Access.',
       'Security defaults and Conditional Access policies are not meant to be used together. Moving to Conditional Access means turning security defaults off.'),
    fc(41, ENT, 'Self-service password reset (SSPR)',
       'Lets users reset or unlock their own password after verifying with registered methods, cutting help desk calls. For on-premises accounts in a hybrid setup, password writeback is needed to send the new password back to AD DS.',
       'Password writeback requires Entra ID P1 or above.'),
    fc(42, ENT, 'Microsoft Entra Password Protection',
       'Blocks weak and commonly attacked passwords using a global banned password list that Microsoft maintains. With P1 an organization can add a custom banned list and extend protection to on-premises AD DS. Smart lockout slows password guessing.',
       'Custom banned words usually include the company name, product names and local sports teams.'),

    # ---- Microsoft Entra: access management ----------------------------------------------
    fc(45, ENT, 'Conditional Access',
       'The Entra policy engine that evaluates signals such as user, group, location, device, app and risk, then makes a decision: block access, or grant access with requirements such as MFA or a compliant device. It is the main way Zero Trust is enforced.',
       'Think "if-then" statements. Conditional Access policies are evaluated after the first-factor sign-in succeeds. Needs Entra ID P1.'),
    fc(46, ENT, 'Conditional Access report-only mode',
       'A policy state that evaluates and logs what a policy would have done without enforcing it, so administrators can test the impact before turning it on.',
       'It is the safe way to roll out a new policy, rather than risking locking everyone out.'),
    fc(47, ENT, 'Microsoft Entra roles',
       'Roles that control access to Entra resources such as users, groups, domains and policies. Examples are Global Administrator, User Administrator and Security Administrator. Assigning the least privileged role that does the job is a best practice.',
       'Entra roles manage the directory. They are separate from Azure RBAC roles, which manage Azure resources.'),
    fc(48, ENT, 'Azure RBAC vs. Entra roles',
       'Azure role-based access control controls access to Azure resources (VMs, storage) with roles such as Owner, Contributor and Reader, assigned at management group, subscription, resource group or resource scope. Entra roles control access to the identity service itself.',
       'Quick test: is the thing being managed a user or a policy in the directory (Entra role) or an Azure resource (Azure RBAC)?'),
    fc(49, ENT, 'Global Administrator',
       'The most privileged Entra role, with access to almost every setting in the tenant. Microsoft advises keeping the number of Global Administrators small and using lower-privileged roles for routine work.',
       'Emergency access accounts, sometimes called break-glass accounts, are a related best practice for recovery if normal admins are locked out.'),
    fc(50, ENT, 'Microsoft Entra Global Secure Access',
       'Microsoft\'s Security Service Edge (SSE) solution, made of Entra Internet Access (secures access to the internet and SaaS) and Entra Private Access (zero-trust access to private apps without a traditional VPN).',
       'Private Access is the answer when a question asks about replacing a VPN with identity-based access to on-premises apps.'),
    fc(51, ENT, 'Microsoft Entra Application Proxy',
       'Publishes on-premises web applications for secure remote access through Entra ID, with SSO and Conditional Access, without opening inbound firewall ports. A connector installed on-premises makes an outbound connection to the service.',
       'Application Proxy needs Entra ID P1.'),

    # ---- Microsoft Entra: protection and governance --------------------------------------
    fc(55, ENT, 'Microsoft Entra ID Governance',
       'Capabilities that make sure the right people have the right access at the right time: entitlement management (access packages), access reviews, lifecycle workflows for joiners, movers and leavers, and Privileged Identity Management.',
       'It is a licence add-on. Its job is to answer "who has access to what, and should they still?"'),
    fc(56, ENT, 'Entitlement management',
       'Bundles groups, apps and sites into access packages that users can request, with approval workflows and an expiry. It makes access time-limited and self-service, and works for guests from other organizations.',
       'An access package is a bundle of resources a person needs for a role or project.'),
    fc(57, ENT, 'Lifecycle workflows',
       'Automate identity tasks for joiners, movers and leavers, such as sending a welcome email, issuing a Temporary Access Pass, adding to groups, or removing access when someone leaves.',
       'The point is consistency: the same steps happen on the day someone joins or leaves.'),
    fc(58, ENT, 'Access reviews',
       'Periodic checks in which reviewers (managers, resource owners, or users themselves) confirm whether people still need access to groups, apps, roles or guest accounts. Results can be applied automatically, removing access that is no longer needed.',
       'They fight "privilege creep" and stale guest accounts. Recurring reviews make recertification routine.'),
    fc(59, ENT, 'Privileged Identity Management (PIM)',
       'Manages, controls and monitors privileged access with just-in-time activation. Users are eligible for a role and must activate it for a limited time, with approval, justification or MFA, so privileges are not standing. Needs Entra ID P2 or ID Governance.',
       'Eligible = can activate. Active = has the role now. Activation history gives an audit trail.'),
    fc(60, ENT, 'Microsoft Entra ID Protection',
       'Detects identity-based risks and lets you respond automatically. It scores sign-in risk (is this sign-in suspicious?) and user risk (is this account likely compromised?) and feeds risk-based Conditional Access policies. Needs Entra ID P2.',
       'Examples of detections include leaked credentials, anonymous IP addresses, impossible travel and password spray.'),
    fc(61, ENT, 'Sign-in risk vs. user risk',
       'Sign-in risk is the likelihood that a particular authentication request was not made by the account owner. User risk is the likelihood that the identity itself has been compromised.',
       'A typical response: require MFA for medium sign-in risk, and force a secure password change for high user risk.'),
    fc(62, ENT, 'Microsoft Entra Verified ID',
       'A decentralized identity service that lets organizations issue and verify digital credentials, for example proof of employment or a degree, without sharing more data than needed. The holder controls the credential.',
       'Useful when you must verify a claim about someone without a full account.'),
    fc(63, ENT, 'Microsoft Entra Agent ID',
       'Gives AI agents their own identities in Entra ID so they can be inventoried, governed and protected like other identities, for example with Conditional Access. It extends the idea of workload identities to agents.',
       'Newer than the classic workload identity types. Microsoft ties Conditional Access for agents to a Microsoft Agent 365 license, and the October 2026 outline update touched the identity types objective, so expect it to be mentioned.'),
]

QUESTIONS = [
    # ---- concepts ----
    mc('q1', CON, 'A company moves its on-premises file server to a virtual machine in Azure. Which security task still belongs to the company after the move?',
       ['Physical security of the datacenter', 'Patching the guest operating system', 'Maintaining the physical network cabling', 'Replacing failed host hardware'], 1,
       'On IaaS the customer manages the guest operating system and everything above it, so patching is still theirs. The datacenter, cabling and host hardware are always Microsoft\'s in the cloud.',
       'The exam checks that you know which layers stay with the customer in every model.'),
    mc('q2', CON, 'Which items stay the customer\'s responsibility no matter whether the workload is IaaS, PaaS or SaaS?',
       ['Information and data, devices, and accounts and identities', 'Physical hosts, physical network and datacenter', 'The operating system and runtime patching in every service model', 'Hypervisor security, host firmware and the physical servers beneath them'], 0,
       'Data, devices and identities are always the customer\'s. Physical hosts, network and datacenter are always the provider\'s, and the operating system shifts depending on the model.'),
    mc('q3', CON, 'A security team puts a firewall at the perimeter, segments the network, enables MFA, encrypts data and locks the server room. Which concept does this describe?',
       ['Zero Trust', 'Defense in depth', 'Federation', 'Single sign-on'], 1,
       'Defense in depth uses several independent layers (physical, identity, perimeter, network, compute, application, data) so one failure does not expose everything. Zero Trust is about verifying every request, not about stacking layers.'),
    mc('q4', CON, 'Which statement matches the Zero Trust principle "assume breach"?',
       ['Trust any request that originates from inside the corporate network by default', 'Segment access, encrypt data and monitor so damage from a compromise is limited', 'Grant administrators permanent standing access so routine work is faster', 'Verify a user once at the start of the day and trust the session afterwards'], 1,
       'Assume breach means designing so that an attacker who gets in can do limited damage: segmentation, end-to-end encryption and analytics to detect threats. Trusting the internal network or granting standing access is the opposite.'),
    mc('q5', CON, 'A system must store user passwords so they can be checked at sign-in but never recovered if the database is stolen. Which technique fits?',
       ['Symmetric encryption with a shared key', 'Hashing with a salt', 'Asymmetric encryption with a public key', 'Encoding the passwords in Base64'], 1,
       'A salted hash is one-way, so the original password cannot be recovered from the database. Encryption is reversible by anyone holding the key, and Base64 is just an encoding, not protection.'),
    mc('q6', CON, 'Which describes asymmetric encryption?',
       ['One shared secret key is used for both encrypting and decrypting', 'A public key and a private key form a linked pair', 'Data is converted into a fixed-length value that cannot be reversed', 'Data is encrypted only while stored on disk'], 1,
       'Asymmetric encryption uses a key pair: what one key encrypts only the other can decrypt. A single shared key is symmetric, a fixed-length irreversible output is a hash, and "at rest" describes where data is, not the algorithm.'),
    mc('q7', CON, 'An auditor asks the team to show that policies are followed and evidence of the controls is kept. Which part of GRC is this?',
       ['Governance', 'Risk', 'Compliance', 'Authorization'], 2,
       'Compliance is demonstrating adherence to laws, regulations and standards. Governance sets the rules and accountability, and risk is identifying and reducing what could go wrong.'),
    mc('q8', CON, 'A European retailer chooses to keep customer data only in Azure regions inside the EU, so local laws apply to that data. Which pair of terms applies?',
       ['Data residency, with data sovereignty as the legal effect', 'Data sovereignty only, because residency is not relevant to the choice of region', 'Federation, with single sign-on as the legal effect', 'Hashing, with encryption as the resulting legal effect on stored data'], 0,
       'Choosing the location is data residency; the fact that the laws of that location govern the data is data sovereignty. Federation and hashing are unrelated.'),
    mc('q9', CON, 'A user signs in with a password and approves a prompt in an app. A moment later the system checks that the user may open a specific document. Which two processes happened, in order?',
       ['Authorization, then authentication', 'Authentication, then authorization', 'Federation, then hashing', 'Encryption, then authentication'], 1,
       'The system first proves who the user is (authentication) and then decides what that identity is allowed to do (authorization). The order never reverses.'),
    mc('q10', CON, 'Which statement explains why identity is called the primary security perimeter?',
       ['Firewalls no longer exist in cloud environments, so nothing else can be controlled', 'Users and data often sit outside the corporate network, so the verified identity is the key control', 'Passwords are impossible to steal once they are stored in the cloud', 'Only administrators have identities that need protecting in the cloud'], 1,
       'When apps and data live in the cloud and people work from anywhere, the network edge no longer decides who gets in; the verified identity does. Firewalls still exist, and passwords are routinely stolen, which is why stronger methods matter.'),
    mc('q11', CON, 'Contoso employees sign in to a partner\'s web app with their own Contoso accounts, and the partner trusts Contoso\'s sign-in. What is this trust arrangement called?',
       ['Federation', 'Hashing', 'Defense in depth', 'Data residency'], 0,
       'Federation is a trust between identity providers so one authenticates users for the other\'s resources. Hashing, layered defense and data location are different concepts.'),
    tf('tf1', CON, 'Microsoft Entra ID is the same product as on-premises Active Directory Domain Services, simply hosted in the cloud.', False,
       'Entra ID is a cloud identity provider built around web protocols such as SAML, OpenID Connect and OAuth. AD DS is an on-premises directory built around Kerberos, NTLM, LDAP and domain controllers. They are often used together in hybrid identity.'),
    tf('tf2', CON, 'Hashing is reversible if you hold the correct key.', False,
       'Hashing is a one-way function with no key to reverse it. Reversibility with a key describes encryption.'),
    ms('msq1', CON, 'Which two statements describe the Zero Trust model? (Choose two.)',
       ['Verify explicitly using all available signals', 'Trust devices because they are on the internal network', 'Use least privilege access', 'Rely on a strong network perimeter as the main control'], [0, 2],
       'Verify explicitly and use least privilege access are two of the three principles (the third is assume breach). Trusting the internal network and leaning on the perimeter are the traditional model Zero Trust replaces.'),
    ms('msq2', CON, 'Which two items are always the customer\'s responsibility in the shared responsibility model? (Choose two.)',
       ['The physical datacenter', 'Information and data', 'Accounts and identities', 'The physical network'], [1, 2],
       'Data and identities (along with devices) are always the customer\'s. The datacenter and the physical network are the provider\'s in a cloud service.'),

    # ---- Entra: function and identity types ----
    mc('q21', ENT, 'Which statement best describes Microsoft Entra ID?',
       ['An on-premises directory service that runs only on Windows Server domain controllers', 'Microsoft\'s cloud-based identity and access management service', 'A managed firewall for filtering traffic between Azure virtual networks', 'A tool for classifying and labeling documents in Microsoft 365'], 1,
       'Entra ID, formerly Azure Active Directory, is the cloud identity and access management service behind Microsoft 365 and Azure. Domain controllers belong to on-premises AD DS, firewalls to network security, and classification to Purview.'),
    mc('q22', ENT, 'A web app running in Azure must read secrets from Azure Key Vault without any password stored in its code. Which identity type fits best?',
       ['A guest user account', 'A managed identity', 'A security group', 'A personal registered device'], 1,
       'A managed identity gives the app an automatically managed credential so no secret is stored. Guest accounts are for external people, groups collect identities, and devices are not used for app authentication.'),
    mc('q22b', ENT, 'Which statement about managed identities is correct?',
       ['A system-assigned identity is created with, and deleted with, the Azure resource it belongs to', 'A user-assigned identity can only ever be used by exactly one Azure resource at a time', 'Managed identities require a client secret that must be stored in the app settings', 'Managed identities are intended only for human users who sign in interactively'], 0,
       'System-assigned identities share the lifecycle of their resource. User-assigned identities are standalone and can be shared across resources, and the whole point of a managed identity is that no secret is stored.'),
    mc('q23', ENT, 'A consultant from a partner company needs to access one SharePoint site using the consultant\'s own work account. Which Entra feature supports this?',
       ['Entra Domain Services with a managed domain', 'B2B collaboration with a guest user', 'Password hash synchronization from Active Directory', 'A system-assigned managed identity'], 1,
       'B2B collaboration invites external people as guests who sign in with their own credentials. Domain Services provides managed AD DS, and the other options are unrelated to external collaboration.'),
    mc('q24', ENT, 'A company has Active Directory on premises and wants users to keep one identity for Microsoft 365. Which approach provides this?',
       ['Hybrid identity using Microsoft Entra Connect or Cloud Sync', 'Creating separate cloud accounts and distributing new passwords', 'Using Azure RBAC to copy users', 'Enabling security defaults'], 0,
       'Hybrid identity synchronizes on-premises accounts to Entra ID so users have a single identity. Separate accounts create the duplication hybrid identity avoids, and RBAC and security defaults do not sync identities.'),
    mc('q25', ENT, 'Which hybrid authentication method validates user passwords directly against on-premises Active Directory at the time of sign-in?',
       ['Password hash synchronization', 'Pass-through authentication', 'Passkeys', 'Temporary Access Pass'], 1,
       'Pass-through authentication checks the password against on-premises AD DS when the user signs in. Password hash synchronization validates against a synced hash in the cloud instead.'),
    mc('q26', ENT, 'A laptop is owned by the company, joined directly to Microsoft Entra ID, and the user signs in with a work account. How is this device described?',
       ['Microsoft Entra registered', 'Microsoft Entra joined', 'Microsoft Entra hybrid joined', 'A workload identity'], 1,
       'Entra joined devices belong to the organization and sign in with work accounts. Registered means a personal device, and hybrid joined means joined to on-premises AD DS and registered with Entra ID.'),
    mc('q27', ENT, 'Which Entra license tier is the lowest one that includes Conditional Access?',
       ['Free', 'P1', 'P2', 'Governance only'], 1,
       'Conditional Access needs Entra ID P1. Risk-based conditions need P2 because they rely on ID Protection, and Free provides security defaults instead.'),
    tf('tf21', ENT, 'A workload identity can represent an application or a service, not just a person.', True,
       'Entra ID supports identities for software, including app registrations, service principals and managed identities, so code can authenticate without borrowing a person\'s account.'),
    tf('tf23', ENT, 'Microsoft Entra Agent ID gives AI agents identities of their own instead of having them borrow a person\'s account.', True,
       'Agent identities extend the workload identity idea to AI agents, so each agent can be governed, protected and audited separately from the people who use it.'),
    tf('tf22', ENT, 'A guest user in B2B collaboration must be given a new password in your tenant.', False,
       'Guests authenticate with the credentials from their own home organization or identity provider, which is a key benefit of B2B collaboration.'),
    ms('msq21', ENT, 'Which two items are examples of workload identities? (Choose two.)',
       ['A managed identity', 'A service principal', 'A guest user', 'A Microsoft 365 group'], [0, 1],
       'Managed identities and service principals represent software. A guest user is a person from outside, and a group is a collection used to assign access.'),

    # ---- Entra: authentication ----
    mc('q31', ENT, 'A user signs in with a password and then enters a code from an authenticator app. Which factors are combined?',
       ['Something you know and something you have', 'Something you are and something you have', 'Two things you know', 'Something you are and something you know'], 0,
       'The password is knowledge and the app or phone is possession. Two knowledge items would not be true multifactor authentication.'),
    mc('q32', ENT, 'Which authentication method is considered passwordless and phishing-resistant?',
       ['A code delivered by SMS text message', 'A passkey on a FIDO2 security key', 'Answers to security questions', 'A one-time code sent by email'], 1,
       'Passkeys and FIDO2 keys use a device-held private key bound to the real site, so a fake site cannot capture a reusable secret. SMS, email codes and security questions can all be intercepted or guessed.'),
    mc('q33', ENT, 'Which Windows feature replaces passwords with a PIN or biometric tied to the device?',
       ['Windows Hello for Business', 'Entra Domain Services managed domain', 'Entra Application Proxy for on-premises apps', 'Security defaults'], 0,
       'Windows Hello for Business is a passwordless credential unlocked locally by PIN or biometrics. The others serve different purposes.'),
    mc('q34', ENT, 'A small organization with no Conditional Access licenses wants a quick, free baseline that requires MFA registration and blocks legacy authentication. What should it enable?',
       ['Security defaults', 'Privileged Identity Management', 'Access reviews', 'Entitlement management'], 0,
       'Security defaults are free preconfigured settings that enforce MFA registration and block legacy authentication. PIM, access reviews and entitlement management are governance features that need higher licenses.'),
    mc('q35', ENT, 'Users must be able to reset their own forgotten passwords, and the new password must flow back to on-premises AD DS. Which feature is needed beyond SSPR itself?',
       ['Password writeback', 'Smart lockout', 'Entra Verified ID', 'A custom banned password list'], 0,
       'Password writeback sends a reset or change made in the cloud back to on-premises Active Directory. Smart lockout and banned lists protect against guessing and weak passwords but do not write back.'),
    mc('q36', ENT, 'An organization wants to prevent users from choosing passwords that contain the company name. Which capability should it use?',
       ['Custom banned password list in Microsoft Entra Password Protection', 'Conditional Access policies running in report-only mode', 'Registering devices in Microsoft Entra ID', 'Access packages in entitlement management'], 0,
       'Password Protection with a custom banned list blocks specified terms in addition to Microsoft\'s global banned list. The custom list requires P1.'),
    mc('q37', ENT, 'Which statement about SMS and voice call authentication is accurate?',
       ['They are the most phishing-resistant methods that Entra ID supports', 'They are supported MFA methods but weaker than the Authenticator app or passkeys', 'They are only available to guest users from partner organizations', 'They replace the need for a password entirely in every sign-in'], 1,
       'Phone-based verification works as a second factor but can be intercepted or socially engineered, so stronger methods are preferred. They do not remove the password.'),
    tf('tf31', ENT, 'Using two different passwords for the same sign-in counts as multifactor authentication.', False,
       'MFA needs factors from different categories, such as knowledge plus possession. Two passwords are both something you know.'),
    tf('tf32', ENT, 'With passkeys, the private key is sent to the website when you sign in.', False,
       'The private key never leaves the device or security key. The device signs a challenge, and the service verifies it with the registered public key.'),
    ms('msq31', ENT, 'Which two are passwordless methods supported by Microsoft Entra ID? (Choose two.)',
       ['Microsoft Authenticator passwordless sign-in', 'Security questions', 'FIDO2 security keys', 'A longer password with symbols'], [0, 2],
       'The Authenticator app and FIDO2 keys can sign a user in without a password. Security questions and long passwords are still knowledge-based secrets.'),

    # ---- Entra: access management ----
    mc('q41', ENT, 'A policy states: if a user signs in from outside the corporate network to the finance app, require MFA. Which Entra feature enforces this?',
       ['Conditional Access', 'Access reviews', 'Password Protection', 'Entitlement management'], 0,
       'Conditional Access evaluates signals such as location and app and applies controls such as requiring MFA. The others handle recertification, password quality and access bundles.'),
    mc('q42', ENT, 'Before enforcing a new Conditional Access policy, an administrator wants to see which sign-ins it would have affected without blocking anyone. What should be used?',
       ['Report-only mode', 'Deleting the policy', 'Security defaults', 'A resource lock'], 0,
       'Report-only mode logs the policy\'s effect without enforcing it, which allows safe testing. Deleting the policy would show nothing, and security defaults are a separate baseline.'),
    mc('q43', ENT, 'Which role would you assign so someone can create and manage Azure virtual machines in one resource group but not manage Entra users?',
       ['Global Administrator for the whole tenant', 'An Azure RBAC role such as Contributor at the resource group scope', 'User Administrator for the directory', 'Privileged Role Administrator in Entra ID'], 1,
       'Azure RBAC controls Azure resources and can be scoped to a resource group. Global Administrator, User Administrator and Privileged Role Administrator are Entra roles that govern the directory and carry far more power than needed.'),
    mc('q44', ENT, 'Which statement correctly contrasts Entra roles with Azure RBAC roles?',
       ['Entra roles manage directory resources such as users and policies; Azure RBAC manages Azure resources', 'Entra roles manage Azure virtual machines; Azure RBAC manages users and groups', 'They are identical and can be used interchangeably in any scenario', 'Azure RBAC only applies to Microsoft 365 mailboxes and nothing else'], 0,
       'Entra roles are for the identity service itself, and Azure RBAC is for Azure resources. They use separate role sets and different scopes.'),
    mc('q45', ENT, 'A company wants employees to reach internal web apps remotely without a traditional VPN, using identity-based, zero-trust access. Which Entra service fits?',
       ['Entra Private Access', 'Entra Verified ID', 'Entra Domain Services', 'Entra Internet Access'], 0,
       'Entra Private Access, part of Global Secure Access, provides identity-aware access to private apps instead of a network-wide VPN. Internet Access secures internet and SaaS traffic, which is the other half of the SSE solution.'),
    mc('q46', ENT, 'Which Conditional Access result is the strictest?',
       ['Grant access', 'Grant access and require MFA', 'Block access', 'Report only'], 2,
       'Block access denies the request outright. The other results allow access, with or without extra requirements, or only log.'),
    tf('tf41', ENT, 'Conditional Access policies are evaluated after first-factor authentication has completed.', True,
       'Conditional Access acts as a policy engine after the user passes the initial sign-in, then decides whether to allow, require more proof, or block.'),
    tf('tf42', ENT, 'A user who holds the Azure Owner role on a subscription automatically has the Entra Global Administrator role.', False,
       'Azure RBAC and Entra roles are separate systems. Owning an Azure subscription does not grant directory administration, and the reverse is also true by default.'),
    ms('msq41', ENT, 'Which two signals can Conditional Access use in a policy? (Choose two.)',
       ['Device state', 'Sign-in location', 'The color of the user\'s monitor', 'The user\'s favorite application theme'], [0, 1],
       'Conditional Access signals include user or group, location, device, application and risk. The other items are not signals.'),

    # ---- Entra: protection and governance ----
    mc('q51', ENT, 'An organization needs managers to confirm every quarter which guests still need access to Teams. Which capability handles this?',
       ['Access reviews', 'Security defaults', 'Windows Hello for Business', 'Application Proxy'], 0,
       'Access reviews let designated reviewers recertify access on a schedule, and can remove access automatically. The others are authentication or publishing features.'),
    mc('q52', ENT, 'A system administrator should only hold the Exchange Administrator role for a few hours when needed, after giving a justification. Which feature provides this?',
       ['Privileged Identity Management', 'Conditional Access report-only mode', 'Password hash synchronization', 'Entra Verified ID'], 0,
       'PIM provides just-in-time, time-limited role activation with justification, approval and MFA options. It requires P2 or ID Governance.'),
    mc('q53', ENT, 'In PIM, what does it mean when a user is "eligible" for a role?',
       ['They hold the role permanently with no activation needed', 'They can activate the role when needed', 'They have been explicitly denied the role by an administrator', 'They are a guest user from an external organization'], 1,
       'Eligible assignments must be activated, usually for a limited time. Active assignments are the ones in effect now.'),
    mc('q54', ENT, 'Microsoft Entra ID Protection detects that a sign-in came from an anonymous IP address and an unfamiliar location. What is this an example of?',
       ['A risk detection that contributes to sign-in risk', 'An access package request in entitlement management', 'A lifecycle workflow task for a new joiner', 'A system-assigned identity for an Azure resource'], 0,
       'ID Protection flags suspicious sign-in behavior as risk detections that can feed risk-based Conditional Access. The other options belong to governance and workload identity.'),
    mc('q55', ENT, 'Which license is required to use risk-based Conditional Access policies that react to sign-in risk?',
       ['Entra ID Free', 'Entra ID P1 alone', 'Entra ID P2', 'None, they are included in security defaults'], 2,
       'Risk-based conditions rely on ID Protection, a P2 feature. P1 gives standard Conditional Access without risk signals.'),
    mc('q56', ENT, 'A new employee starts Monday. The organization wants group membership, a welcome email and a Temporary Access Pass to be set up automatically. Which feature automates this?',
       ['Lifecycle workflows', 'Access reviews of existing group members', 'Conditional Access report-only mode', 'Password writeback to on-premises AD DS'], 0,
       'Lifecycle workflows automate joiner, mover and leaver tasks. Access reviews recertify existing access instead of provisioning it.'),
    mc('q57', ENT, 'Which feature lets a user request a bundle of groups, apps and sites that expires automatically and can require manager approval?',
       ['Entitlement management with access packages', 'Security defaults for the whole tenant', 'Windows Hello for Business credentials', 'Managed identities for Azure resources'], 0,
       'Access packages in entitlement management bundle resources, approvals and expirations. They are an ID Governance capability.'),
    tf('tf51', ENT, 'Privileged Identity Management can require approval and a justification when a user activates a privileged role.', True,
       'PIM supports approval, justification, MFA and time limits on activation, and keeps an audit history of activations.'),
    tf('tf52', ENT, 'Access reviews can only be performed by Global Administrators.', False,
       'Reviewers can be resource owners, managers, group owners, selected reviewers or the users themselves, which is what makes recertification scale.'),
    ms('msq51', ENT, 'Which two are capabilities of Microsoft Entra ID Governance? (Choose two.)',
       ['Entitlement management', 'Access reviews', 'Blocking DDoS attacks on public IP addresses', 'Encrypting Azure Storage with customer-managed keys'], [0, 1],
       'Entitlement management and access reviews are core ID Governance features. DDoS Protection and storage encryption belong to Azure infrastructure security.'),
    ms('msq52', ENT, 'Which two features require Microsoft Entra ID P2 (or ID Governance)? (Choose two.)',
       ['Privileged Identity Management', 'Microsoft Entra ID Protection', 'Basic single sign-on', 'Security defaults'], [0, 1],
       'PIM and ID Protection are P2 features. Basic SSO and security defaults are available without a paid tier.'),
]

LESSONS = [
    {
        'id': 'security-compliance-concepts',
        'title': 'Security and Compliance Concepts',
        'summary': 'Shared responsibility, defense in depth, Zero Trust, encryption, hashing and GRC.',
        'diagram': None,
        'vocabIds': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'],
        'quizIds': ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'tf2', 'msq1', 'msq2'],
        'reading': """Security starts with who is responsible for what. Under the shared responsibility model, Microsoft always secures the physical datacenter, network and hosts, and the customer always secures its own information and data, its devices, and its accounts and identities. The operating system, network controls and applications move between the two as you go from IaaS to PaaS to SaaS, so on a virtual machine you patch the OS and on a platform service Microsoft does.

Two ideas describe how to build protection. Defense in depth stacks independent layers, from physical security and identity through the perimeter, network, compute and application to data, so a single failure does not expose everything. Zero Trust changes the assumption underneath: it treats the network as hostile, so every request is checked. Its three principles are verify explicitly, use least privilege access, and assume breach.

Cryptography supports these goals. Encryption makes data unreadable without a key, either symmetrically (one shared key, fast, used for bulk data) or asymmetrically (a public and private key pair, used for key exchange and signatures). Encryption protects data at rest and in transit. Hashing is different: it is a one-way fingerprint used to check integrity and to store passwords safely.

Compliance and risk sit around the technology. Governance, risk and compliance (GRC) is the shared discipline of setting rules and accountability, identifying and reducing risk, and proving that laws and standards are met. Data residency is where data is stored, and data sovereignty is the legal reality that the laws of that location apply to it.""",
        'fundamentalsLabel': 'New to security? See the everyday analogy',
        'fundamentals': """Think of renting an apartment in a managed building. The landlord guards the front door and the building structure (the provider's side), but you still lock your own door, protect your keys and decide who you let in (your side). That split is shared responsibility.

Defense in depth is a bank with a street door, a guard, a vault and a safe-deposit box. Zero Trust is a bank that checks ID every time you walk in, even if the teller knows your face.""",
        'keyTerms': ['shared responsibility model', 'defense in depth', 'Zero Trust', 'encryption', 'hashing', 'symmetric', 'asymmetric', 'GRC', 'data residency', 'data sovereignty'],
        'commonTraps': [
            'Data, devices and identities are the customer\'s in every service model, even SaaS.',
            'Hashing is one-way and encryption is reversible with a key; do not mix them up.',
            'Zero Trust is a mindset of verifying every request, not a single product or a stronger firewall.',
        ],
        'scenario': 'A company moves a HR app from its own server room to Azure. The cloud provider now handles the building, power and hardware, but the company still decides who can sign in, still protects employee data, and still has to patch the VM operating system if it chose IaaS. Moving to a PaaS database would hand the OS patching to Microsoft, but not the question of who may read the records.',
        'onTheJob': 'In practice the shared responsibility model is the first slide in any cloud risk review. Auditors ask "which layer is yours?" and gaps appear where a team assumes the provider covers identity or data classification. Writing the split down per workload, and mapping each customer-side item to an owner, prevents most of the arguments after an incident.',
    },
    {
        'id': 'identity-concepts',
        'title': 'Identity Concepts',
        'summary': 'Identity as the perimeter, authentication, authorization, identity providers, directories and federation.',
        'diagram': None,
        'vocabIds': ['f11', 'f12', 'f13', 'f14', 'f15', 'f16'],
        'quizIds': ['q9', 'q10', 'q11', 'tf1'],
        'reading': """When data and apps live in the cloud and people work from anywhere, the corporate network is no longer the edge that defines what is protected. The identity requesting access is, so identity is described as the primary security perimeter. Attackers know this and go after credentials, which is why strong verification matters more than ever.

Two words must stay separate. Authentication proves who you are; authorization decides what you may do. Authentication happens first. An identity provider (IdP) creates and manages identities and performs authentication for applications, handing them a signed token instead of a password. Microsoft Entra ID is an identity provider.

A directory service stores identity information centrally. Active Directory Domain Services (AD DS) is Microsoft's on-premises directory, based on domain controllers and protocols such as Kerberos, NTLM and LDAP. Microsoft Entra ID is a different, cloud-native service built for web protocols. Many organizations run both and connect them with hybrid identity.

Federation is a trust between identity providers, so a user authenticated by one organization can reach another's apps with single sign-on. SAML, WS-Federation and OpenID Connect are typical protocols, and OAuth 2.0 handles delegated authorization.""",
        'fundamentalsLabel': 'New to identity? See the everyday analogy',
        'fundamentals': """Showing your passport at airport check-in is authentication: it proves who you are. The boarding pass then says which flight you may board, which is authorization.

Federation is like two countries agreeing to honor each other's visas. The traveler is checked once by their home country, and the other country trusts that check.""",
        'keyTerms': ['identity perimeter', 'authentication', 'authorization', 'identity provider', 'directory service', 'Active Directory', 'federation', 'single sign-on', 'SAML', 'OpenID Connect'],
        'commonTraps': [
            'Authentication proves identity; authorization grants permissions. The first does not imply the second.',
            'Entra ID is not AD DS in the cloud; they use different protocols and are often combined.',
            'OAuth 2.0 is about authorization. OpenID Connect adds authentication on top.',
        ],
        'scenario': 'Fabrikam employees open a supplier\'s portal by clicking "Sign in with your work account". Fabrikam\'s Entra ID authenticates them and sends a signed token; the supplier\'s app trusts it and only then checks which orders the employee may see. The first step is authentication through federation, the second is authorization.',
        'onTheJob': 'Most breaches in the cloud begin with a stolen or phished credential rather than a broken firewall, so identity teams spend their time on strong sign-in and clean permissions. When a team says "the app handles its own logins", ask who owns the password store: moving to a shared identity provider removes a whole class of risk and gives one place to enforce MFA.',
    },
    {
        'id': 'entra-identities',
        'title': 'Microsoft Entra ID and Identity Types',
        'summary': 'What Entra ID is, the editions, the identity types, workload identities and hybrid identity.',
        'diagram': None,
        'vocabIds': ['f21', 'f22', 'f23', 'f24', 'f25', 'f26', 'f27', 'f28', 'f29', 'f30', 'f31', 'f63'],
        'quizIds': ['q21', 'q22', 'q22b', 'q23', 'q24', 'q25', 'q26', 'q27', 'tf21', 'tf22', 'tf23', 'msq21'],
        'reading': """Microsoft Entra ID, formerly Azure Active Directory, is Microsoft's cloud identity and access management service. Each organization has its own dedicated instance, called a tenant, which holds its users, groups, devices and applications. Entra ID signs people in to Microsoft 365, the Azure portal and thousands of SaaS apps, and it comes in Free, P1 and P2 tiers, with ID Governance as an add-on. The Entra family also includes External ID, Verified ID, Workload ID, Domain Services and the Global Secure Access services.

Entra ID manages several types of identity. People are users, and external partners can be invited as guests (B2B collaboration). Devices have identities too, as registered, joined or hybrid joined devices. Software gets workload identities: app registrations, service principals and managed identities, so code never has to run as a person. A managed identity is created and rotated by Azure, which removes secrets from code.

Hybrid identity connects on-premises Active Directory with Entra ID so users have one identity. Microsoft Entra Connect Sync or Cloud Sync copies accounts to the cloud, and passwords can be validated through password hash synchronization, pass-through authentication or federation. Microsoft Entra Domain Services is a separate managed service for legacy apps that need domain join, LDAP or Kerberos in Azure.""",
        'fundamentalsLabel': 'New to Entra ID? See the everyday analogy',
        'fundamentals': """A tenant is like a company's badge office. It issues badges to employees (users), guests and contractors (guest users), laptops (devices), and even to the building's robots (workload identities). Hybrid identity is the badge office keeping its on-site records and its online records in sync.""",
        'keyTerms': ['Microsoft Entra ID', 'tenant', 'Entra ID P1', 'Entra ID P2', 'workload identity', 'managed identity', 'service principal', 'B2B collaboration', 'hybrid identity', 'Microsoft Entra Connect', 'password hash synchronization', 'pass-through authentication'],
        'commonTraps': [
            'Guests sign in with their own home credentials; you do not create passwords for them.',
            'A workload identity represents software, not a person.',
            'Entra Domain Services is a managed AD DS-like service, not the same as Entra ID.',
        ],
        'scenario': 'A retailer keeps its staff accounts in on-premises Active Directory but wants everyone on Microsoft 365. It installs Entra Connect to synchronize accounts, so each person has one identity. A web app in Azure reads secrets from Key Vault through a managed identity, and a vendor\'s consultant is invited as a B2B guest with her own company login.',
        'onTheJob': 'The most common surprise is licensing: a feature in a demo turns out to need P1 or P2, so check the tier before promising it. Also watch for service accounts with passwords in config files; swapping them for managed identities is one of the cheapest security wins in an Azure estate.',
    },
    {
        'id': 'entra-authentication',
        'title': 'Authentication in Microsoft Entra',
        'summary': 'MFA, passwordless sign-in, passkeys, security defaults, SSPR and password protection.',
        'diagram': None,
        'vocabIds': ['f35', 'f36', 'f37', 'f38', 'f39', 'f40', 'f41', 'f42'],
        'quizIds': ['q31', 'q32', 'q33', 'q34', 'q35', 'q36', 'q37', 'tf31', 'tf32', 'msq31'],
        'reading': """Passwords alone are the weakest link, so Entra ID supports several stronger ways to prove identity. Multifactor authentication combines at least two kinds of proof: something you know, something you have, and something you are. The method matters too: the Microsoft Authenticator app and passkeys are preferred, while SMS and voice calls are supported but weaker because they can be intercepted or socially engineered.

Passwordless sign-in goes further and removes the password. Windows Hello for Business, Microsoft Authenticator and passkeys or FIDO2 security keys all use a private key held on the device, unlocked by a PIN or biometric. Passkeys are phishing-resistant because the credential only works for the real site, so a fake login page captures nothing reusable.

For organizations without Conditional Access, security defaults offer a free baseline that requires MFA registration, protects administrators and blocks legacy authentication. Self-service password reset lets people recover their own accounts, and password writeback returns the new password to on-premises AD DS. Entra Password Protection blocks weak passwords with a global banned list, adds a custom list with P1, and smart lockout slows guessing attacks.""",
        'fundamentalsLabel': 'New to MFA? See the everyday analogy',
        'fundamentals': """Withdrawing cash needs your card (something you have) and your PIN (something you know). One without the other is useless. MFA applies the same idea to sign-in.

A passkey is like a key that only fits the one lock it was made for and refuses to open a lookalike door built by a thief.""",
        'keyTerms': ['multifactor authentication', 'Microsoft Authenticator', 'passkey', 'FIDO2', 'Windows Hello for Business', 'passwordless', 'security defaults', 'self-service password reset', 'password writeback', 'smart lockout', 'banned password list'],
        'commonTraps': [
            'MFA needs different factor categories; two passwords are still one factor type.',
            'SMS and voice work for MFA but are not phishing-resistant.',
            'Security defaults and Conditional Access are not used together.',
        ],
        'scenario': 'A 30-person firm with only basic licenses turns on security defaults, and everyone has to register the Authenticator app. Later the firm buys P1, turns security defaults off and moves to Conditional Access, adds a custom banned list with its company name, and enables self-service password reset.',
        'onTheJob': 'Rolling out MFA is mostly a people problem. Registration campaigns, a clear help desk script for lost phones, and a Temporary Access Pass for new starters matter as much as the technology. Expect pushback on SMS removal; show the phishing numbers.',
    },
    {
        'id': 'entra-access-governance',
        'title': 'Access Management, Protection and Governance',
        'summary': 'Conditional Access, Entra roles vs. Azure RBAC, ID Governance, access reviews, PIM and ID Protection.',
        'diagram': None,
        'vocabIds': ['f45', 'f46', 'f47', 'f48', 'f49', 'f50', 'f51', 'f55', 'f56', 'f57', 'f58', 'f59', 'f60', 'f61', 'f62'],
        'quizIds': ['q41', 'q42', 'q43', 'q44', 'q45', 'q46', 'tf41', 'tf42', 'msq41', 'q51', 'q52', 'q53', 'q54', 'q55', 'q56', 'q57', 'tf51', 'tf52', 'msq51', 'msq52'],
        'reading': """Conditional Access is the policy engine of Zero Trust. It evaluates signals such as the user, location, device, application and risk after the first sign-in, then decides to block, or to grant access with requirements such as MFA or a compliant device. Report-only mode lets administrators see a policy's effect before enforcing it. Conditional Access needs P1, and risk signals need P2.

Entra roles and Azure RBAC are two different permission systems. Entra roles, such as Global Administrator or User Administrator, control the directory. Azure RBAC roles, such as Owner, Contributor and Reader, control Azure resources and apply at management group, subscription, resource group or resource scope. Give the least privileged role that does the job, and keep Global Administrators few. Global Secure Access, with Entra Internet Access and Entra Private Access, is Microsoft's SSE solution for identity-aware access to the internet and private apps.

Identity governance keeps access appropriate over time. Entitlement management bundles resources into access packages, lifecycle workflows automate joiners, movers and leavers, and access reviews have owners or managers recertify access, removing it automatically if it is no longer needed. Privileged Identity Management turns standing admin rights into eligible ones that must be activated just in time, with approval, justification and MFA. Entra ID Protection scores sign-in risk and user risk from detections such as leaked credentials and impossible travel, and drives automated responses through Conditional Access.""",
        'fundamentalsLabel': 'New to access control? See the everyday analogy',
        'fundamentals': """Conditional Access is a bouncer with a checklist: "Are you on the list? Is it your usual door? Is your ID valid? Then come in, but show me a second ID if you came in through the back." PIM is a key cabinet: admin keys are signed out for an hour with a reason, not carried around all year. Access reviews are the quarterly check that everyone with a key still needs one.""",
        'keyTerms': ['Conditional Access', 'report-only mode', 'Entra roles', 'Azure RBAC', 'Global Administrator', 'Global Secure Access', 'entitlement management', 'access package', 'lifecycle workflows', 'access review', 'Privileged Identity Management', 'ID Protection', 'sign-in risk', 'user risk'],
        'commonTraps': [
            'Entra roles manage the directory; Azure RBAC manages Azure resources. Owning one does not grant the other.',
            'Conditional Access needs P1, but risk-based conditions need P2 because they use ID Protection.',
            'PIM makes admins eligible, not permanent; they must activate the role.',
        ],
        'scenario': 'Contoso wants finance staff to use MFA from outside the office and wants high-risk sign-ins blocked. It creates a Conditional Access policy in report-only mode, checks the logs, then enforces it. Administrators become eligible in PIM and activate roles for two hours with a justification, and a quarterly access review asks managers to confirm which guests still need Teams.',
        'onTheJob': 'Conditional Access policies that lock out everyone, including the admin who created them, are a classic incident. Keep emergency access accounts excluded and monitored, and always begin in report-only mode. Reviews and PIM only pay off when someone actually reads the results, so assign owners.',
    },
]

CHEAT_SHEET = [
    {
        'heading': 'Exam-day strategy',
        'points': [
            'Microsoft Fundamentals exams give about 45 minutes and typically 40 to 60 questions. Pace yourself at under a minute per question and flag any you are unsure about.',
            'Microsoft scores this 0 to 1000 with 700 to pass, not a flat percentage. Treat 75%+ in practice as a safe buffer, not an exact predictor.',
            'The exam is breadth over depth: know what each product is for and which one fits a scenario, not how to configure it.',
            'Most traps are look-alike product names (Defender for Cloud vs Defender for Cloud Apps, sensitivity labels vs retention labels, Entra roles vs Azure RBAC). Read the scenario for the one clue that separates them.',
        ],
    },
    {
        'heading': 'Concepts in one breath',
        'points': [
            'Shared responsibility: customer always owns data, devices and identities; provider always owns the physical layer; the OS shifts with IaaS, PaaS and SaaS.',
            'Defense in depth = layers (physical, identity, perimeter, network, compute, application, data). Zero Trust = verify explicitly, least privilege, assume breach.',
            'Encryption is reversible with a key (symmetric = one key, asymmetric = key pair). Hashing is one-way and proves integrity.',
            'Authentication = who you are. Authorization = what you may do. Federation = trust between identity providers.',
        ],
    },
    {
        'heading': 'Entra: licenses and identities',
        'points': [
            'Free: users, groups, SSO, basic MFA and security defaults. P1: Conditional Access, dynamic groups, Application Proxy, password writeback. P2: ID Protection, PIM. ID Governance: entitlement management, access reviews, lifecycle workflows.',
            'Identity types: users, groups, devices (registered, joined, hybrid joined) and workload identities (app registrations, service principals, managed identities). Guests use B2B collaboration with their own credentials.',
            'Hybrid identity uses Entra Connect or Cloud Sync, with password hash synchronization, pass-through authentication or federation.',
        ],
    },
    {
        'heading': 'Entra: sign-in and access',
        'points': [
            'MFA = two different factor categories. Passwordless = Windows Hello for Business, Authenticator, passkeys and FIDO2 keys. SMS and voice are the weakest.',
            'Conditional Access = signals in, decision out (block or grant with controls). Use report-only mode first. Risk-based policies need P2.',
            'Entra roles manage the directory; Azure RBAC manages Azure resources. PIM = eligible, time-limited, just-in-time. Access reviews = recertify.',
            'Entra Private Access replaces VPN-style access to private apps. Entra Internet Access secures internet and SaaS traffic.',
        ],
    },
]
