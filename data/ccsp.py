"""Categories, flashcards, questions and course content for ISC2 CCSP (Certified Cloud Security Professional).

Follows the CCSP exam outline effective August 1, 2026: six domains weighted Cloud Concepts, Architecture and Design 17,
Cloud Data Security 20, Cloud Platform and Infrastructure Security 17, Cloud Application Security 16, Cloud Security
Operations 17, Legal, Risk and Compliance 13. AI and machine learning security is folded into every domain.

The content is written with small builder helpers (f, mc, ms, tf) so each item stays compact. The helpers assign
sequential ids (f1.., q1.., msq1.., tf1..) and shuffle the option order of mc/ms items deterministically (the app also
shuffles at render time). Each item carries a topic tag that the LESSONS section uses to pick vocabulary and quiz
items for its unit; the tag is stripped from the exported FLASHCARDS and QUESTIONS.
"""
import random

CATEGORIES = [
    {'key': 'ccspConcepts', 'label': 'Cloud Concepts, Architecture and Design', 'marks': 17, 'resources': [
        {'label': 'ISC2: CCSP certification exam outline', 'url': 'https://www.isc2.org/certifications/ccsp/ccsp-certification-exam-outline'},
        {'label': 'NIST SP 800-145: The NIST Definition of Cloud Computing', 'url': 'https://csrc.nist.gov/pubs/sp/800/145/final'},
        {'label': 'CSA: Security Guidance for Critical Areas of Focus in Cloud Computing', 'url': 'https://cloudsecurityalliance.org/research/guidance'},
    ]},
    {'key': 'ccspData', 'label': 'Cloud Data Security', 'marks': 20, 'resources': [
        {'label': 'NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management', 'url': 'https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final'},
        {'label': 'NIST SP 800-88 Rev. 1: Guidelines for Media Sanitization', 'url': 'https://csrc.nist.gov/pubs/sp/800/88/r1/final'},
        {'label': 'CSA: Security Guidance (Data Security and Encryption domain)', 'url': 'https://cloudsecurityalliance.org/research/guidance'},
    ]},
    {'key': 'ccspPlatform', 'label': 'Cloud Platform and Infrastructure Security', 'marks': 17, 'resources': [
        {'label': 'NIST SP 800-190: Application Container Security Guide', 'url': 'https://csrc.nist.gov/pubs/sp/800/190/final'},
        {'label': 'NIST SP 800-125: Guide to Security for Full Virtualization Technologies', 'url': 'https://csrc.nist.gov/pubs/sp/800/125/final'},
        {'label': 'CSA: Cloud Controls Matrix (CCM)', 'url': 'https://cloudsecurityalliance.org/research/cloud-controls-matrix'},
    ]},
    {'key': 'ccspApp', 'label': 'Cloud Application Security', 'marks': 16, 'resources': [
        {'label': 'NIST SP 800-218: Secure Software Development Framework (SSDF)', 'url': 'https://csrc.nist.gov/pubs/sp/800/218/final'},
        {'label': 'OWASP API Security Project', 'url': 'https://owasp.org/API-Security/'},
        {'label': 'OWASP Top 10 for Large Language Model Applications', 'url': 'https://genai.owasp.org/llm-top-10/'},
    ]},
    {'key': 'ccspOps', 'label': 'Cloud Security Operations', 'marks': 17, 'resources': [
        {'label': 'NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations', 'url': 'https://csrc.nist.gov/pubs/sp/800/61/r3/final'},
        {'label': 'NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response', 'url': 'https://csrc.nist.gov/pubs/sp/800/86/final'},
        {'label': 'NIST SP 800-92: Guide to Computer Security Log Management', 'url': 'https://csrc.nist.gov/pubs/sp/800/92/final'},
    ]},
    {'key': 'ccspLegal', 'label': 'Legal, Risk and Compliance', 'marks': 13, 'resources': [
        {'label': 'CSA: Security, Trust, Assurance and Risk (STAR) program', 'url': 'https://cloudsecurityalliance.org/star'},
        {'label': 'EUR-Lex: General Data Protection Regulation (Regulation (EU) 2016/679)', 'url': 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'},
        {'label': 'ISO/IEC 27001: Information security management systems', 'url': 'https://www.iso.org/standard/27001'},
    ]},
]

_FC, _QS = [], []
_counts = {'f': 0, 'q': 0, 'msq': 0, 'tf': 0}


def _next(kind):
    _counts[kind] += 1
    return f"{kind}{_counts[kind]}"


def f(cat, topic, front, back, detail):
    _FC.append({'id': _next('f'), 'cat': cat, 'topic': topic, 'front': front, 'back': back, 'detail': detail})


def _shuffled(rights, wrongs, seed):
    opts = [(o, True) for o in rights] + [(o, False) for o in wrongs]
    random.Random(seed).shuffle(opts)
    return [o for o, _ in opts], [i for i, (_, ok) in enumerate(opts) if ok]


def mc(cat, topic, question, right, wrongs, explanation, why=None):
    qid = _next('q')
    options, correct = _shuffled([right], wrongs, qid)
    item = {'id': qid, 'cat': cat, 'topic': topic, 'type': 'mc', 'question': question, 'options': options,
            'correct': correct[0], 'explanation': explanation}
    if why:
        item['whyTested'] = why
    _QS.append(item)


def ms(cat, topic, question, rights, wrongs, explanation, why=None):
    qid = _next('msq')
    options, correct = _shuffled(rights, wrongs, qid)
    item = {'id': qid, 'cat': cat, 'topic': topic, 'type': 'ms', 'question': question, 'options': options,
            'correct': correct, 'explanation': explanation}
    if why:
        item['whyTested'] = why
    _QS.append(item)


def tf(cat, topic, question, answer, explanation):
    _QS.append({'id': _next('tf'), 'cat': cat, 'topic': topic, 'type': 'tf', 'question': question,
                'answer': answer, 'explanation': explanation})


C1, C2, C3, C4, C5, C6 = 'ccspConcepts', 'ccspData', 'ccspPlatform', 'ccspApp', 'ccspOps', 'ccspLegal'

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 1: Cloud Concepts, Architecture and Design (topic tag: found)
# ---------------------------------------------------------------------------------------------------------------
f(C1, 'found', 'Cloud computing (NIST SP 800-145)',
  "A model for enabling ubiquitous, convenient, on-demand network access to a shared pool of configurable computing resources that can be rapidly provisioned and released with minimal management effort or provider interaction.",
  "The NIST definition lists five essential characteristics, three service models and four deployment models; the exam expects you to reason from it, not just recite it.")
f(C1, 'found', 'Essential cloud characteristics',
  "On-demand self-service, broad network access, resource pooling, rapid elasticity and measured service (NIST). ISO/IEC 17788 names the same ideas plus multi-tenancy and scalability.",
  "If a service lacks self-service provisioning or metering, it is virtualized hosting rather than true cloud; scenario questions test that distinction.")
f(C1, 'found', 'Multi-tenancy',
  "Several customers (tenants) share the same physical and logical resources while the provider keeps their data and workloads logically isolated from one another.",
  "It is the economic engine of cloud and also its signature risk: a failure of isolation exposes one tenant to another.")
f(C1, 'found', 'Infrastructure as a service (IaaS)',
  "The provider supplies compute, storage and networking as virtualized resources; the customer installs and manages operating systems, middleware, applications and data on top.",
  "The customer owns the most security work in IaaS: guest OS patching, network rules, identity and data protection are all theirs.")
f(C1, 'found', 'Platform as a service (PaaS)',
  "The provider runs the infrastructure, operating system and runtime; the customer deploys and manages only their own applications and data.",
  "Responsibility shifts up the stack, but the customer still owns application code, configuration, identities and data.")
f(C1, 'found', 'Software as a service (SaaS)',
  "The provider delivers a complete application over the network; the customer configures it and supplies users and data but manages none of the underlying stack.",
  "Even in SaaS the customer always keeps accountability for their data, user access and acceptable-use settings.")
f(C1, 'found', 'Shared responsibility model',
  "The division of security duties between provider and customer. The provider secures the cloud itself (facilities, hardware, hypervisor, core services); the customer secures what they put in and how they configure it. The split moves with the service model.",
  "The most-tested concept in the domain; the safe default is that data, identities and customer-side configuration are always the customer's problem.")
f(C1, 'found', 'Public, private, hybrid and community cloud',
  "Public: provider-owned and open to many customers. Private: dedicated to one organization. Hybrid: two or more models bound together so data and workloads can move. Community: shared by organizations with common requirements such as a regulator.",
  "Multi-cloud (several providers) is not the same as hybrid; watch for questions that test that difference.")
f(C1, 'found', 'Multi-cloud',
  "Using services from two or more cloud providers, often for resilience, best-of-breed services or negotiating leverage.",
  "It multiplies skills, identity, logging and policy-consistency work, and is a stated focus of the newer CCSP outline.")
f(C1, 'found', 'Cloud service customer, provider, partner and broker',
  "ISO/IEC 17788 roles: the customer consumes services; the provider delivers them; a partner supports either side (for example an auditor, developer or broker); a cloud service broker intermediates, aggregates or customizes services.",
  "Questions ask who bears accountability for a given duty; a broker or reseller never removes the customer's accountability.")
f(C1, 'found', 'Cloud auditor',
  "An independent party that assesses a provider's controls and conformance to standards, producing assurance that customers and regulators can rely on.",
  "Customers rarely audit hyperscale providers directly; they rely on independent reports such as SOC 2 and ISO certifications.")
f(C1, 'found', 'Vendor lock-in',
  "A dependency on one provider's proprietary services, formats or APIs that makes moving elsewhere costly or technically hard.",
  "Mitigate with portability, open standards, exit plans and contract clauses; tested together with reversibility.")
f(C1, 'found', 'Portability, interoperability and reversibility',
  "Portability: moving workloads or data between providers with minimal change. Interoperability: different systems working together. Reversibility: the customer can retrieve their assets and have the provider delete the rest on exit.",
  "All three are cross-cutting cloud aspects and drive exit-strategy and contract questions.")
f(C1, 'found', 'Elasticity versus scalability',
  "Scalability is the ability to handle growing load by adding capacity; elasticity is the automatic, rapid adding and releasing of capacity to match demand.",
  "Elastic implies automatic and both ways (shrink as well as grow); a manual upgrade is only scalable.")
f(C1, 'found', 'Resource pooling',
  "The provider combines its computing resources to serve many customers from a shared pool, dynamically assigning and reassigning capacity by demand.",
  "It underpins multi-tenancy; the customer typically has no control over exact physical location beyond region or zone.")
f(C1, 'found', 'Measured service',
  "Resource usage is monitored, controlled and reported so it can be billed and optimized, giving transparency to both sides.",
  "The same metering feeds cost-based attacks: stolen credentials used for crypto-mining show up as a spike in usage.")
f(C1, 'found', 'Cloud cross-cutting aspects',
  "ISO/IEC 17789 lists concerns that apply across the architecture: auditability, availability, governance, interoperability, maintenance and versioning, performance, portability, privacy, regulatory, resiliency, reversibility, security and service levels.",
  "Use them as a checklist when a scenario asks what an architect must consider before adopting a service.")
f(C1, 'found', 'Cloud bursting',
  "Running a workload in a private environment and overflowing to a public cloud when demand exceeds local capacity.",
  "A hybrid pattern whose risks are data exposure in the burst environment and network latency between the two.")
f(C1, 'found', 'Cloud security principles: defense in depth, least privilege and zero trust',
  "Layer independent controls so one failure is not fatal; grant only the access required; and never trust a request because of its network location, verifying identity and context every time.",
  "Cloud has no trusted perimeter, so identity becomes the new perimeter; exam answers favor layered, identity-centric designs.")
f(C1, 'found', 'Confidential computing',
  "Protecting data while it is being processed by running workloads inside a hardware-based trusted execution environment (TEE) whose memory is encrypted and isolated even from the host and provider administrators.",
  "It closes the gap that at-rest and in-transit encryption leave open (data in use) and is named in the outline's treatment of related technologies.")
f(C1, 'found', 'Artificial intelligence and machine learning as cloud workloads',
  "Cloud platforms provide managed training, inference and model-hosting services, so training data, models and prompts become assets that need classification, access control and provenance tracking.",
  "The newer outline weaves AI and ML security into every domain; expect shared-responsibility and data-protection angles, not deep model mathematics.")
f(C1, 'found', 'Edge computing',
  "Processing data near where it is produced (devices, branches or local nodes) rather than in a central cloud region, to reduce latency and bandwidth.",
  "It widens the attack surface with many physically exposed nodes that need identity, patching and remote attestation.")
f(C1, 'found', 'Quantum computing risk and post-quantum cryptography',
  "A large-scale quantum computer could break public-key algorithms such as RSA and elliptic-curve schemes, so data that must stay secret for years is exposed to harvest-now, decrypt-later collection. Post-quantum algorithms are being standardized as the answer.",
  "Architects plan crypto agility: the ability to swap algorithms without redesigning systems.")
f(C1, 'found', 'Blockchain and distributed ledger',
  "A tamper-evident ledger replicated across many parties, with entries chained by cryptographic hashes. Cloud providers offer it as a managed service.",
  "It gives integrity and auditability, not confidentiality; do not store regulated personal data on an immutable ledger that cannot honor deletion.")
f(C1, 'found', 'Internet of things (IoT)',
  "Networked physical devices that sense or act, often resource-constrained and long-lived, feeding data to cloud back ends.",
  "Weak default credentials and no patch path are the usual findings; the cloud side needs device identity, certificate lifecycle and ingestion limits.")
f(C1, 'found', 'Cloud reference architecture',
  "A vendor-neutral model (ISO/IEC 17789 and NIST SP 500-292) describing actors, activities and functional layers of cloud computing so designs and controls can be compared consistently.",
  "Use it to locate where a control belongs: user, access, services, resources or cross-cutting layer.")
f(C1, 'found', 'Cloud service level agreement (SLA)',
  "The contract component stating measurable service targets such as availability, support response and remedies when the provider misses them.",
  "SLA credits compensate cost, not business loss; resilience still needs customer-side architecture.")

# ---- questions: Domain 1
mc(C1, 'found', "A start-up runs a customer relationship management product it licenses from a vendor. The vendor patches the platform; the start-up decides who gets accounts and what data is entered. After a data leak caused by a former employee's still-active account, who holds primary responsibility for that failure?",
   "The start-up, because user access and data handling stay with the customer in SaaS",
   ["The vendor, because it operates the entire software stack", "Shared equally, because SaaS removes the distinction between the parties", "Neither party, since the account belonged to an individual rather than an organization"],
   "In SaaS the provider manages the application and below, but customers remain responsible for identity lifecycle, access settings and the data they enter. A stale account is a customer joiner-mover-leaver failure. The vendor's operation of the stack does not extend to deprovisioning the customer's staff, and responsibility is split by layer, not evenly.",
   "Tests the part of shared responsibility that never moves, whatever the service model.")
mc(C1, 'found', "A team moves a batch-processing application from servers it manages to a managed container platform where the provider operates the host operating system and orchestration. Compared with IaaS, which responsibility has MOST clearly shifted to the provider?",
   "Patching and hardening of the host operating system and orchestration layer",
   ["Classification and protection of the sensitive data that the application stores and processes on the platform", "Writing and testing the application's authentication logic", "Defining which staff may deploy new application versions"],
   "Managed platforms move the lower layers (host OS, runtime, orchestration) to the provider. Data classification, application logic and deployment authorization remain with the customer at every service model, which is why they are tempting but wrong.")
mc(C1, 'found', "A regional hospital group, a university and a public health agency jointly fund one cloud environment built to a common research-compliance standard and open only to those organizations. Which deployment model is this?",
   "Community cloud",
   ["Private cloud, because access is restricted to named organizations", "Hybrid cloud, because several organizations contribute infrastructure", "Multi-cloud, because multiple customers participate"],
   "A community cloud is shared by organizations with a common concern, here the same compliance standard. Private cloud serves one organization. Hybrid joins different deployment models, and multi-cloud means several providers; neither is described.")
mc(C1, 'found', "An architect is asked why a workload that scales out automatically at peak and releases servers overnight is described as elastic rather than merely scalable. What is the BEST answer?",
   "Capacity is added and removed automatically in response to demand",
   ["The application can run on larger instance types if needed", "The provider guarantees a contractual availability percentage for the service each month", "Resources are shared among tenants to cut cost"],
   "Elasticity is automatic provisioning and release matching demand. A larger instance is vertical scaling by hand, availability guarantees are an SLA matter, and sharing is resource pooling or multi-tenancy.")
mc(C1, 'found', "Which statement about the cloud service broker role is MOST accurate?",
   "A broker adds value but the customer stays accountable for its own data and compliance",
   ["A broker takes on full legal liability for every item of data that is processed through its platform", "A broker is the independent party that certifies provider controls", "A broker replaces the need for a contract with the underlying provider"],
   "Brokers intermediate, aggregate or add value to services, but accountability for data and compliance cannot be outsourced. Independent certification is the auditor's role, and liability and contracts still need explicit treatment.")
mc(C1, 'found', "A security architect must keep the contents of a financial model confidential even from the cloud provider's administrators while the model is being computed on a rented virtual machine. Which technology addresses this requirement BEST?",
   "Confidential computing using a hardware-based trusted execution environment",
   ["Full-disk encryption with a provider-managed key", "TLS 1.3 between the client and the virtual machine", "Tokenization of the model's output files"],
   "Confidential computing protects data in use by processing it inside an encrypted, isolated hardware enclave. Disk encryption covers data at rest and, with provider-held keys, does not exclude the provider. TLS covers data in transit, and tokenizing outputs does nothing for the computation itself.",
   "Data in use is a growing exam theme and is named in the revised outline.")
mc(C1, 'found', "A company wants the freedom to move a critical application to another provider within a few weeks if prices rise. Which design choice BEST supports that goal?",
   "Build on open standards and containers, keep data portable and document an exit plan",
   ["Adopt each provider's proprietary managed database services wherever they improve performance", "Negotiate a three-year price lock with the incumbent provider", "Replicate all data to an on-premises server that only IT staff may access"],
   "Portability comes from open standards, portable formats and tested exit procedures. Proprietary services deepen lock-in, a price lock does not create a way out, and a private copy of the data does not make the application portable.")
mc(C1, 'found', "Which architectural principle BEST reflects the move from perimeter-based protection to cloud-native security?",
   "Verify every request using identity, device and context, not network location",
   ["Place all workloads inside a single private subnet and rely on its boundary to limit exposure", "Allow unrestricted traffic between workloads in the same virtual network", "Rely on the provider's physical security for logical access control"],
   "Zero trust treats identity and context as the control point because there is no trusted network edge in cloud. Flat internal trust and a single subnet recreate the perimeter fallacy, and physical security does not replace logical access control.")
mc(C1, 'found', "A team stores purchase records on a managed distributed ledger and later receives a lawful erasure request from a customer. What is the MOST significant design problem this reveals?",
   "Immutable ledger entries cannot be removed, which conflicts with deletion obligations for personal data",
   ["Ledgers cannot be encrypted when the data is at rest", "Ledgers cannot be replicated across regions for resilience", "Ledgers require the provider to hold every participant's private key"],
   "Immutability is a feature for integrity and a defect for erasure rights, so personal data should stay off-chain with only references or hashes on it. Ledgers can be encrypted and replicated, and participants keep their own keys.")
mc(C1, 'found', "Why is the roadmap for post-quantum cryptography a concern today for data that must remain confidential for twenty years?",
   "Adversaries can collect encrypted traffic now and decrypt it once quantum capability exists",
   ["Quantum computers will make all symmetric hashing completely unusable as soon as they exist", "Cloud providers will stop supporting current TLS versions this year", "Quantum computing can erase data from encrypted storage remotely"],
   "Harvest-now, decrypt-later makes long-lived secrets vulnerable well before capable quantum computers arrive, motivating crypto agility and migration planning. The other statements overstate or invent effects.")
mc(C1, 'found', "A customer asks which document tells them how much downtime the provider will tolerate before credits are owed. Which is the BEST answer?",
   "The service level agreement",
   ["The provider's SOC 2 report", "The shared responsibility matrix", "The data processing addendum"],
   "The SLA states measurable service targets and remedies. A SOC 2 report describes controls, the responsibility matrix divides security duties, and a data processing addendum covers personal data handling.")
mc(C1, 'found', "An IoT fleet sends telemetry to a cloud ingestion service. Which design decision MOST reduces the risk of a stolen device injecting false data?",
   "Give each device a unique certificate-based identity and authenticate every connection",
   ["Use a shared API key embedded in the firmware of all devices", "Accept data from any source address in the manufacturer's range", "Encrypt telemetry with a single key that is stored in each device's clear-text configuration file"],
   "Per-device identities allow revocation of one compromised unit without disrupting the fleet. A shared key is exposed by one extracted device, IP ranges are spoofable and a clear-text key offers no protection.")
mc(C1, 'found', "Which activity is MOST clearly the cloud customer's responsibility regardless of the service model?",
   "Deciding who may access their data and how it is classified",
   ["Maintaining the hypervisor and host firmware", "Controlling physical access to the provider's data centers", "Replacing failed disks in the provider's storage arrays"],
   "Data governance and access decisions always rest with the customer. Hypervisors, data-center access and hardware maintenance are provider duties in all service models.")
mc(C1, 'found', "An architect reviews a design against ISO/IEC 17789 cross-cutting aspects and finds no plan for leaving the provider. Which aspect has been overlooked?",
   "Reversibility",
   ["Elasticity", "Maintenance and versioning", "Performance"],
   "Reversibility concerns retrieving customer assets and having remaining copies deleted on exit. Elasticity, maintenance and performance are separate aspects and do not address exit.")
mc(C1, 'found', "A data science team wants to fine-tune a hosted foundation model with customer support transcripts. Under shared responsibility, which duty stays with the customer?",
   "Classifying and protecting the training data and access to the tuned model",
   ["Securing the physical GPU servers that run the training job", "Patching the underlying operating system of the managed training service's hosts", "Operating the provider's model-serving network"],
   "Even on a fully managed AI service, the training data, access to the resulting model and the choice of what to feed it belong to the customer. Hardware, platform patching and provider networking are provider duties.",
   "The revised outline integrates AI and ML into each domain, so shared responsibility for AI services is fair game.")

ms(C1, 'found', "Which TWO characteristics distinguish a true cloud service from ordinary hosted infrastructure? (Choose two.)",
   ["Customers can provision resources on demand without human interaction", "Usage is metered so it can be measured and billed"],
   ["The customer owns the physical servers", "Capacity is fixed in a multi-year contract", "Workloads cannot move between regions"],
   "On-demand self-service and measured service are NIST essential characteristics. Fixed capacity contracts and customer-owned hardware are traits of traditional hosting, and cloud workloads commonly can move between regions.")
ms(C1, 'found', "Which TWO statements about multi-cloud strategies are accurate? (Choose two.)",
   ["They can reduce dependence on one provider and improve resilience", "They increase the work needed for consistent identity, logging and policy"],
   ["They remove the need for a shared responsibility analysis", "They guarantee workload portability without any code change", "They are identical to hybrid cloud by definition"],
   "Using several providers spreads risk but multiplies operational and governance complexity. Each provider still needs a responsibility analysis, portability is never automatic and hybrid cloud is a different concept.")
ms(C1, 'found', "Which THREE items are properly the provider's responsibility in an IaaS deployment? (Choose three.)",
   ["Physical data-center security", "Hypervisor and host patching", "Availability of the underlying storage service"],
   ["Guest operating system patching", "Firewall rules for customer virtual networks"],
   "Facilities, hypervisor and core service availability belong to the provider. In IaaS the customer patches guest operating systems and configures their own network controls.")
ms(C1, 'found', "Which TWO technologies are most directly aimed at limiting exposure of data while it is being processed? (Choose two.)",
   ["Confidential computing with trusted execution environments", "Homomorphic or secure multi-party computation techniques"],
   ["Transport Layer Security", "Full-disk encryption", "Hash-based message authentication"],
   "Both enclaves and privacy-preserving computation protect data in use. TLS and disk encryption cover transit and rest, and message authentication provides integrity of messages rather than confidentiality of processing.")
ms(C1, 'found', "Which TWO risks are especially associated with edge computing deployments? (Choose two.)",
   ["Many physically accessible nodes that attackers can tamper with", "Inconsistent patching across a widely distributed fleet"],
   ["Complete reliance on a single central data center", "Inability to use encryption on any link"],
   "Edge widens the physical and patching surface. It reduces dependence on one center and can use encryption normally.")

tf(C1, 'found', "In a SaaS model the customer is relieved of all accountability for data protection because the provider operates the application.", False,
   "The provider operates the application stack, but the customer remains accountable for its data, user access and configuration choices.")
tf(C1, 'found', "A hybrid cloud always involves two or more different cloud providers.", False,
   "Hybrid means distinct deployment models, typically private and public, bound together. Two public providers is multi-cloud.")
tf(C1, 'found', "Measured service means the provider monitors resource use so it can be reported, controlled and billed.", True,
   "Metering underlies pay-per-use billing, quotas and cost anomaly detection.")
tf(C1, 'found', "Multi-tenancy is a risk the customer can eliminate by choosing any reputable provider.", False,
   "It is inherent to pooled cloud resources; customers manage the risk through isolation choices, encryption and dedicated options, not by eliminating it.")
tf(C1, 'found', "Containers and serverless functions are examples of technologies the CCSP treats as part of the cloud reference architecture's impact of related technologies.", True,
   "The outline asks you to consider how containers, edge, confidential computing, AI and similar technologies affect architecture and security.")
tf(C1, 'found', "Reversibility means the customer can retrieve their data and have the provider delete the remaining copies when the relationship ends.", True,
   "It is one of the cross-cutting aspects and should be backed by contract terms and verified deletion.")
tf(C1, 'found', "Moving a workload from IaaS to PaaS leaves the customer's responsibilities exactly unchanged.", False,
   "Operating system and runtime duties move to the provider; application, identity and data duties remain.")
tf(C1, 'found', "Data in use can be protected using trusted execution environments built into the processor.", True,
   "Hardware enclaves isolate and encrypt memory during computation, which is the aim of confidential computing.")

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 2: Cloud Data Security (topic tags: life, crypto)
# ---------------------------------------------------------------------------------------------------------------
f(C2, 'life', 'Cloud data life cycle',
  "Create, store, use, share, archive and destroy: the six phases data passes through, each needing its own controls and ownership. Data can move between phases in any direction over time.",
  "Tests ask which control fits which phase, for example classification at create and verified destruction at the end.")
f(C2, 'life', 'Data classification',
  "Labeling data by sensitivity and business impact (for example public, internal, confidential, restricted) so that handling, encryption, access and retention rules can be applied consistently.",
  "Classification is the first step; without it every later control is a guess. The data owner assigns it.")
f(C2, 'life', 'Data discovery',
  "Finding where sensitive data actually lives, using content inspection, pattern matching, labels and machine learning, across structured, unstructured and semi-structured stores.",
  "Cloud sprawl and shadow IT mean you cannot protect what you have not found; discovery precedes classification and DLP.")
f(C2, 'life', 'Data owner, steward and custodian',
  "The owner is accountable for the data and decides classification and access; the steward manages quality and rules day to day; the custodian operates the systems that hold it. In cloud the provider is typically a custodian or processor.",
  "Accountability cannot be delegated to the provider even though custody can.")
f(C2, 'life', 'Data controller and data processor',
  "The controller decides why and how personal data is processed and carries primary legal responsibility; the processor handles it on the controller's behalf under contract.",
  "In most cloud scenarios the customer is the controller and the provider is the processor; sub-processors extend the chain.")
f(C2, 'life', 'Structured, unstructured and semi-structured data',
  "Structured data fits a fixed schema (relational tables); unstructured has no model (documents, images, email); semi-structured carries tags but no rigid schema (JSON, XML).",
  "Discovery and DLP are hardest on unstructured data, which is most of what organizations hold.")
f(C2, 'life', 'Data loss prevention (DLP)',
  "Controls that discover, monitor and block the unauthorized movement of sensitive data across endpoints, networks and cloud services, using content and context rules.",
  "DLP depends on classification and discovery; encrypted traffic needs inspection points that can see the content.")
f(C2, 'life', 'Information rights management (IRM)',
  "Persistent protection that travels with a file, enforcing who may open, copy, print or forward it, and allowing access to be revoked after sharing.",
  "Best answer when the requirement is control of a document after it leaves your environment; DLP only controls egress.")
f(C2, 'life', 'Data retention policy',
  "Rules for how long each class of data must be kept and when it must be disposed of, driven by legal, regulatory and business needs.",
  "Keep too little and you violate law; keep too much and you enlarge breach and eDiscovery exposure.")
f(C2, 'life', 'Legal hold',
  "A directive suspending normal deletion of data that may be relevant to litigation or investigation until counsel releases it.",
  "Overrides retention schedules; cloud lifecycle and auto-delete rules must be able to honor it.")
f(C2, 'life', 'Data sanitization and crypto-shredding',
  "Because customers cannot physically destroy provider media, cloud destruction relies on cryptographic erasure: encrypt the data and destroy every copy of the key, rendering the data unrecoverable.",
  "The standard cloud answer to 'how do you guarantee deletion'; it works only if keys are truly isolated and destroyed.")
f(C2, 'life', 'Data dispersion',
  "Breaking data into fragments and spreading them across multiple locations or providers (as erasure coding does) so no single location holds usable data and availability improves.",
  "Improves durability and resilience but complicates data residency and deletion tracking.")
f(C2, 'life', 'Data flows and data flow diagrams',
  "A map of where data enters, moves, is processed, stored and leaves a system, including across providers and regions.",
  "Required to find trust boundaries, apply residency rules and answer regulator questions; a first step in cloud risk work.")
f(C2, 'life', 'Data lake and AI training dataset security',
  "Large central repositories and curated datasets used for analytics and model training need classification, fine-grained access control, lineage tracking and protection against tampering, since poisoned data corrupts every model trained on it.",
  "Newer outline content: integrity and provenance of training data matter as much as confidentiality.")
f(C2, 'life', 'Data masking and obfuscation',
  "Replacing sensitive values with realistic but non-sensitive ones (static masking in copies, dynamic masking at query time) so non-production use does not expose real data.",
  "Masking can be irreversible, unlike tokenization; the best test-data answer when real values are not needed.")
f(C2, 'life', 'Anonymization and pseudonymization',
  "Anonymization irreversibly removes the link to an individual so data is no longer personal data; pseudonymization replaces identifiers with a separate key or mapping, so data remains personal data under privacy law.",
  "Pseudonymized data is still regulated under GDPR; truly anonymized data is not. Re-identification risk is the tested trap.")
f(C2, 'life', 'Data labeling and tagging',
  "Attaching metadata such as classification, owner and retention class to data and cloud resources so policies and automation can act on them.",
  "Labels make DLP, access policy and billing work at scale; unlabeled assets are the gap attackers and auditors find.")
f(C2, 'life', 'Cloud storage types',
  "Object storage holds data as objects with metadata over APIs; block storage provides raw volumes for VMs and databases; file storage offers shared file systems. Ephemeral storage disappears with the instance.",
  "Each type has different encryption, access and exposure risks; public object buckets are the classic misconfiguration.")
f(C2, 'life', 'Database activity monitoring',
  "Tools that observe database queries and changes in real time, flagging or blocking suspicious access and producing audit trails independent of the database's own logs.",
  "A detective control for privileged-user abuse; useful where native logging is limited or tamper-prone.")
f(C2, 'crypto', 'Encryption at rest, in transit and in use',
  "At rest protects stored data, in transit protects data crossing a network (for example TLS) and in use protects data while processed (confidential computing). A complete strategy covers all three.",
  "Pick the answer that matches the state of data in the scenario; one control rarely covers all three.")
f(C2, 'crypto', 'Symmetric versus asymmetric encryption',
  "Symmetric uses one shared secret key and is fast, suiting bulk data; asymmetric uses a public and private key pair and is slower, suiting key exchange, signatures and identity.",
  "Real systems combine them: asymmetric to exchange or wrap a symmetric key that protects the bulk data.")
f(C2, 'crypto', 'Envelope encryption',
  "A data encryption key (DEK) encrypts the data; a key encryption key (KEK) held in a key management service encrypts the DEK. Rotating or revoking the KEK controls many DEKs cheaply.",
  "The default design in cloud storage and database services; crypto-shredding works by destroying the KEK.")
f(C2, 'crypto', 'Key management service (KMS)',
  "A managed service that creates, stores, rotates, controls access to and audits use of cryptographic keys, integrated with the provider's other services.",
  "Convenient and the default, but the provider operates it unless you add stronger options such as BYOK or HYOK.")
f(C2, 'crypto', 'Hardware security module (HSM)',
  "A tamper-resistant device that generates and stores keys and performs cryptographic operations without exposing the keys; validated to standards such as FIPS 140.",
  "Choose an HSM (or cloud HSM) when policy demands hardware-protected, single-tenant key custody.")
f(C2, 'crypto', 'Bring your own key (BYOK)',
  "The customer generates the key material and imports it into the provider's KMS or HSM, keeping an original copy and the ability to revoke or delete it.",
  "More control than provider-generated keys, but the provider still uses the key to decrypt on your behalf.")
f(C2, 'crypto', 'Hold your own key (HYOK)',
  "The customer keeps keys entirely outside the provider, for example in an on-premises HSM, so the provider can never decrypt the data and services that need plaintext may not work.",
  "Strongest separation of duties, with trade-offs in availability, latency and feature support.")
f(C2, 'crypto', 'Key lifecycle',
  "Generation, distribution, storage, use, rotation, revocation, archival and destruction. Weakness at any stage undermines the encryption built on the key.",
  "Know the order and the control at each step; poorly protected key storage and absent rotation are the common failures.")
f(C2, 'crypto', 'Key separation and escrow',
  "Keys should be stored apart from the data they protect and managed by different administrators than the data owners; escrow places a copy with a trusted third party for recovery.",
  "Storing keys beside data in the same account defeats encryption; escrow introduces its own exposure that must be justified.")
f(C2, 'crypto', 'Tokenization',
  "Substituting sensitive data with a random surrogate token while the real value sits in a secured vault; the token has no mathematical relationship to the original.",
  "Reduces compliance scope (for example for card data) because systems holding only tokens never touch the real value.")
f(C2, 'crypto', 'Hashing and digital signatures',
  "A hash is a one-way fixed-length fingerprint for integrity checks; a digital signature signs a hash with a private key to prove origin, integrity and non-repudiation.",
  "Hashing is not encryption and is not reversible; salted hashes protect stored passwords.")
f(C2, 'crypto', 'Transport Layer Security (TLS)',
  "The protocol that provides confidentiality, integrity and server authentication for data in transit using certificates; TLS 1.3 is the current version and removes legacy weaknesses.",
  "Prefer TLS 1.2 or higher with strong suites; disable legacy SSL and early TLS.")
f(C2, 'crypto', 'Public key infrastructure (PKI) and certificate lifecycle',
  "The roles, policies and services (certificate authorities, registration, revocation) that bind public keys to identities and manage certificates from issuance to expiry.",
  "Expired or unrevoked certificates cause outages and exposure; automate renewal and monitor transparency logs.")
f(C2, 'crypto', 'Homomorphic encryption',
  "Encryption that allows computation directly on ciphertext, yielding an encrypted result that decrypts to the correct output, so data stays protected while processed.",
  "Powerful but computationally expensive; an answer for data in use when enclaves are not acceptable.")
f(C2, 'crypto', 'Crypto agility',
  "Designing systems so cryptographic algorithms, key lengths and libraries can be replaced quickly without redesigning applications.",
  "Directly addresses post-quantum migration and deprecated algorithm risk.")
f(C2, 'crypto', 'Customer-managed versus provider-managed keys',
  "Provider-managed keys are created, rotated and held by the provider by default; customer-managed keys are controlled by the customer in KMS or HSM with their own policies, rotation and revocation, while the provider's service still performs the cryptography.",
  "Customer-managed keys mean the customer controls revocation; they are not the same as HYOK.")
f(C2, 'crypto', 'Secrets management',
  "Central storage, rotation and audited access for non-human credentials such as API keys, passwords and certificates, injected at runtime rather than embedded in code or images.",
  "Hard-coded secrets in repositories and container images are among the most frequent real-world cloud breaches.")

# ---- questions: Domain 2, life
mc(C2, 'life', "A cloud customer must prove to an auditor that a decommissioned database is unrecoverable, but cannot access the provider's physical disks. Which approach is MOST appropriate?",
   "Encrypt the data with customer-controlled keys and destroy all copies of the keys",
   ["Overwrite the logical volume once with zeros before releasing it", "Ask the provider to confirm it will degauss the disks eventually", "Move the database to another region and delete the first copy"],
   "Cryptographic erasure is the accepted cloud answer because customers cannot physically sanitize shared media. A single logical overwrite may not touch all replicas, a promise to degauss is unverifiable and moving regions just leaves more copies.",
   "Sanitization in cloud is a signature CCSP topic; the exam expects crypto-shredding.")
mc(C2, 'life', "A company learns that its object storage contains several unknown buckets with customer records. What should the security architect do FIRST to bring the data under control?",
   "Run data discovery to find and inventory where sensitive data is stored",
   ["Apply the strictest encryption setting to every bucket in the account immediately", "Deploy DLP policies that block all uploads to cloud storage", "Ask the data custodian to delete all unknown buckets"],
   "You cannot classify, encrypt or govern data you have not located; discovery comes first. Blanket encryption and blocking are premature, and deleting unknown buckets risks destroying data under legal hold or business need.")
mc(C2, 'life', "A law firm sends a confidential contract to an external party and must be able to revoke that party's access after the project ends, even if the file has been downloaded. Which control BEST meets this requirement?",
   "Information rights management applied to the document",
   ["Data loss prevention rules on the outbound email gateway and web proxy", "Transport Layer Security on the file transfer", "Full-disk encryption on the sender's laptop"],
   "IRM is persistent protection that follows the file and can be revoked. DLP only gates egress, TLS protects the transfer in transit and disk encryption protects one device.")
mc(C2, 'life', "A developer wants realistic customer data in a test environment, but the test team does not need real identities. Which approach MOST reduces risk?",
   "Apply irreversible static masking before copying data to the test environment",
   ["Copy production data into the test environment and restrict access to the test team only", "Tokenize the data and share the vault with the test team", "Encrypt the production copy with the same key as production"],
   "Irreversible masking removes real values so a test breach exposes nothing. Restricting access still leaves real data in a weaker environment, sharing the token vault defeats the point and reusing the production key enlarges exposure.")
mc(C2, 'life', "Under privacy law, which statement about pseudonymized data is MOST accurate?",
   "It remains personal data because the separate mapping allows re-identification",
   ["It is anonymous and falls outside privacy regulation", "It can be freely shared with any third party", "It no longer requires a lawful basis for processing"],
   "Pseudonymization is a safeguard, not an exemption: if re-identification is possible with additional information, the data is still regulated. Only effective anonymization removes it from scope.")
mc(C2, 'life', "A regulation requires records to be kept for seven years, yet a pending lawsuit concerns some of those records. A lifecycle rule would delete anything older than three years. What should the architect do?",
   "Suspend deletion for the affected records under a legal hold and align the retention rule to the longest applicable requirement",
   ["Let the three-year rule run and restore from backups if needed", "Delete the records to reduce eDiscovery exposure", "Move the records to a cheaper storage tier and keep the existing three-year deletion rule running unchanged"],
   "Legal and regulatory retention outrank convenient lifecycle rules; a legal hold must prevent destruction. Deleting relevant records can be spoliation, relying on backups is unreliable and tiering does not stop deletion.")
mc(C2, 'life', "Who is accountable for deciding the classification of a dataset hosted in a public cloud?",
   "The data owner within the customer organization",
   ["The cloud provider's security team", "The database administrator who runs the service", "The cloud service broker"],
   "The owner determines classification and access; custodians and providers implement. Accountability for data is never transferred through custody or brokerage.")
mc(C2, 'life', "A bank wants to stop employees from uploading files containing account numbers to personal cloud storage, including over encrypted connections. Which solution is MOST suitable?",
   "A cloud access security broker or DLP control that can inspect the content",
   ["A firewall rule blocking all outbound traffic on port 443 for every employee workstation", "Encrypting every file with a shared team password", "A policy memo reminding staff of acceptable use"],
   "Content-aware DLP at a point that can decrypt or see activity addresses the requirement. Blocking port 443 breaks the business, a shared password is weak and does not prevent upload, and a memo is not a technical control.")
mc(C2, 'life', "A data science team is building a model from several public and internal sources. Which data security concern is MOST specific to this scenario?",
   "Poisoned or tampered training data silently degrading the model's integrity",
   ["The model's training job runs inside a private virtual network with restricted egress", "The dataset is stored as compressed files", "The team uses a notebook to explore the data"],
   "Integrity and provenance of training data are the particular risk, since poisoned inputs corrupt every resulting model. Network placement, compression and notebooks are ordinary engineering choices without the same specific risk.",
   "New AI content in the revised outline is woven into data security.")
mc(C2, 'life', "In most cloud scenarios involving personal data, how are the customer and provider classified?",
   "Customer as controller and provider as processor",
   ["Customer as processor and provider as controller", "Both as joint data subjects", "Provider as data owner and customer as custodian"],
   "The customer decides purposes and means and so is controller; the provider processes on its instructions. The reverse is wrong unless the provider uses the data for its own purposes.")
mc(C2, 'life', "Why does erasure coding across several locations improve a cloud storage system's durability?",
   "Data is split into fragments with redundancy so lost fragments can be rebuilt",
   ["Every copy of the data is stored in full in every region that the provider operates worldwide", "Data is encrypted using a different key for each fragment", "The provider mirrors all data into the customer's data center"],
   "Dispersion with redundancy lets the system reconstruct data after partial loss. Full copies everywhere is replication, per-fragment keys are unrelated and mirroring to the customer is not how it works.")
mc(C2, 'life', "A security team can see a sudden volume of queries from a privileged database administrator reading many customer rows at night. Which control would have given the BEST independent evidence of this activity?",
   "Database activity monitoring feeding a separate log store",
   ["Encryption of the database volume", "A stricter password and rotation policy for all database administrators", "Daily snapshots of the database"],
   "Independent monitoring of queries records and can alert on privileged abuse. Volume encryption does not stop an authorized session reading data, passwords do not log activity and snapshots capture state, not reads.")
ms(C2, 'life', "Which TWO activities belong to the earliest phases of the cloud data life cycle? (Choose two.)",
   ["Classifying the data when it is created", "Assigning an owner and applying initial labels"],
   ["Verified destruction of media", "Moving to long-term archival storage", "Legal hold release"],
   "Classification and ownership are applied when data is created. Destruction, archiving and hold release occur later in the cycle.")
ms(C2, 'life', "Which TWO measures MOST effectively reduce the risk of public exposure of cloud object storage? (Choose two.)",
   ["Account-level controls that block public access by default", "Continuous posture monitoring that alerts on public or unencrypted buckets"],
   ["Naming buckets with hard-to-guess names", "Relying on the bucket's default network location", "Disabling versioning on every bucket"],
   "Preventive guardrails and detective posture monitoring address misconfiguration. Obscure names are security by obscurity, defaults are the common cause of exposure and versioning is a recovery feature unrelated to exposure.")
ms(C2, 'life', "Which TWO statements about data classification are correct? (Choose two.)",
   ["Handling rules such as encryption and access follow from the label", "It must be reviewed because sensitivity can change over time"],
   ["It is assigned by the cloud provider after migration", "It is unnecessary if data is encrypted", "It applies only to structured data"],
   "Labels drive controls and need periodic review. Providers do not decide the owner's classification, encryption does not replace classification and it applies to all data types.")
tf(C2, 'life', "Deleting a file in the cloud console guarantees that every replica of the underlying data has been physically destroyed.", False,
   "Logical deletion does not guarantee physical erasure; customers rely on cryptographic erasure and provider attestations.")
tf(C2, 'life', "Data discovery should generally take place before classification and DLP rules are tuned.", True,
   "You must know where data is and what it contains before labeling it or writing effective prevention rules.")
tf(C2, 'life', "Anonymized data that cannot reasonably be re-identified is generally outside the scope of privacy regulations such as GDPR.", True,
   "Properly anonymized data no longer relates to an identifiable person, unlike pseudonymized data.")
tf(C2, 'life', "Information rights management can restrict printing and forwarding of a document after it has been shared.", True,
   "IRM policies are embedded and enforced when the document is opened, and access can be revoked.")
tf(C2, 'life', "A cloud customer can transfer accountability for data protection to the provider by signing a processor contract.", False,
   "A contract assigns processing duties, but the controller stays accountable to regulators and data subjects.")
tf(C2, 'life', "Static data masking creates a copy with realistic substitute values that cannot be reversed to the original.", True,
   "Static masking is typically irreversible and suits non-production copies.")

# ---- questions: Domain 2, crypto
mc(C2, 'crypto', "A regulator requires that the cloud provider must never be able to decrypt a firm's trading records. Which key strategy BEST satisfies this requirement?",
   "Hold your own key in an on-premises HSM outside the provider's control",
   ["Provider-managed keys held in the provider's HSM with rotation every 90 days", "Bring your own key imported into the provider's KMS", "Provider-managed keys held in the provider's HSM"],
   "HYOK keeps key material outside the provider so it cannot decrypt. BYOK still imports the key where the provider's service can use it, and provider-managed keys, however rotated or hardened, are provider-accessible.",
   "BYOK versus HYOK is a favorite judgement question.")
mc(C2, 'crypto', "A company wants to retain the ability to revoke access to data at any time by deleting key material, but accepts that the provider's service performs encryption and decryption. Which option fits?",
   "Customer-managed keys in the provider's key service, with customer-controlled policies",
   ["Provider-managed keys with default settings", "Hashing the data with a salted algorithm", "Storing the key beside the encrypted data in the same account to make recovery easier"],
   "Customer-managed keys let the customer disable or delete the key and so cut off access. Defaults leave control to the provider, hashing is irreversible and cannot protect data that must be read, and co-locating the key with data undermines separation.")
mc(C2, 'crypto', "In envelope encryption, what is the main advantage of wrapping each data encryption key with a key encryption key?",
   "Rotating or revoking one key encryption key controls many data keys without re-encrypting data",
   ["It removes the need for any key management service", "It makes the encryption algorithm quantum resistant", "It lets the provider decrypt the data on demand without needing any customer approval or key policy check"],
   "The KEK protects DEKs, so rotation and revocation happen at the KEK level. Envelope encryption still needs key management, does not change algorithm strength and does not give the provider extra decryption rights.")
mc(C2, 'crypto', "An e-commerce site wants to shrink the part of its environment that must meet card-data compliance rules. Which technique MOST directly achieves this?",
   "Tokenization so most systems only hold surrogate values",
   ["Hashing card numbers with an unsalted algorithm", "Compressing card numbers before storing them", "Encrypting card numbers with a key stored in the application"],
   "Systems that hold only tokens are generally out of scope for the real value, shrinking compliance effort. Unsalted hashes of low-entropy numbers are easily reversed, compression is not security and an application-held key leaves the data in scope.")
mc(C2, 'crypto', "Which statement correctly distinguishes tokenization from encryption?",
   "A token has no mathematical relationship to the value, which sits in a vault",
   ["A token can be reversed by anyone holding the public key", "A token is always shorter than the original value", "A token is created by applying a block cipher and a secret key to the original value"],
   "Tokens are random surrogates mapped in a vault, so there is nothing to decrypt. Reversal by public key, size and cipher-based creation describe encryption or format-preserving encryption instead.")
mc(C2, 'crypto', "A team stores API keys for a payment service in the configuration file of a container image. What is the BEST remediation?",
   "Move the keys into a secrets manager and inject them at runtime with rotation enabled",
   ["Encrypt the configuration file using a hard-coded password", "Restrict the container registry to internal users only", "Rename the keys so they are harder to recognize"],
   "A secrets manager provides access control, audit and rotation, and keeps secrets out of images. A hard-coded password just moves the secret, registry restrictions do not remove embedded secrets and renaming is obscurity.")
mc(C2, 'crypto', "Which situation BEST justifies using a hardware security module rather than software-only key storage?",
   "A policy requires tamper-resistant, validated protection of root keys",
   ["The application needs much faster bulk encryption of large video files at low cost", "The team wants to avoid learning key management", "The data is classified as public"],
   "HSMs provide tamper-resistant custody and validated modules for sensitive keys. They are not for speeding bulk encryption, do not eliminate key management duties and public data does not justify the cost.")
mc(C2, 'crypto', "Two parties who have never met need to exchange a symmetric session key over an untrusted network. Which approach is MOST appropriate?",
   "Use asymmetric cryptography or a key agreement protocol to establish the key",
   ["Send the symmetric key in an email protected by a long and complex subject line", "Hash the key with SHA-256 and send the hash", "Use a pre-shared key printed on the license agreement"],
   "Asymmetric methods or key agreement solve the key distribution problem. Email is plaintext, a hash of a key does not convey it and a printed shared secret cannot be rotated or scaled.")
mc(C2, 'crypto', "An architect's design relies on encrypting data with a key kept in the same storage account as the data. What is the PRIMARY weakness?",
   "Anyone who gains access to the account can obtain both data and key, defeating the encryption",
   ["Keys cannot legally be stored in cloud storage", "The data cannot be backed up while encrypted", "The encryption algorithm will run too slowly"],
   "Key separation is a basic principle: compromise of the account should not hand over both parts. Keys can be stored in cloud services, backups work fine and performance is not the issue.")
mc(C2, 'crypto', "A company discovers its TLS certificate expired and a customer-facing service went down. Which practice would MOST directly prevent a recurrence?",
   "Automate certificate issuance and renewal and monitor expiry dates",
   ["Issue certificates with ten-year lifetimes", "Disable certificate validation in clients", "Replace TLS with a proprietary encryption protocol maintained by the application team"],
   "Automation and monitoring address the lifecycle failure. Long lifetimes increase exposure when keys are compromised, disabling validation removes authentication and proprietary protocols are riskier.")
mc(C2, 'crypto', "A firm must plan for the day current public-key algorithms are no longer safe. Which design principle is MOST useful?",
   "Crypto agility, so algorithms can be swapped without re-architecting",
   ["Standardizing every system on the longest public-key length that is available today", "Encrypting data twice with the same algorithm", "Moving all keys to a single central server"],
   "Agility lets teams migrate to new algorithms. Longer keys of a vulnerable family do not help against quantum attacks, double encryption with one algorithm shares the weakness and one central server is a single point of failure.")
ms(C2, 'crypto', "Which TWO statements about BYOK are accurate? (Choose two.)",
   ["The customer generates the key material and imports it into the provider's key service", "The provider's service can still use the key to decrypt data on the customer's behalf"],
   ["The provider can never access the key in any form", "Keys are never stored outside the customer's premises", "BYOK and HYOK are the same thing"],
   "BYOK improves customer control over key generation and lifecycle but the key lives in the provider's service. HYOK is the model where the key never leaves customer control.")
ms(C2, 'crypto', "Which TWO controls protect data at rest in a cloud database? (Choose two.)",
   ["Transparent database or volume encryption with managed keys", "Column-level encryption of especially sensitive fields"],
   ["TLS between the application and the database", "A web application firewall in front of the website", "Multi-factor authentication for console users"],
   "Volume or database encryption and field-level encryption protect stored data. TLS protects data in transit, a firewall protects the web layer and MFA protects authentication.")
ms(C2, 'crypto', "Which TWO phases of the key lifecycle are MOST relevant to crypto-shredding? (Choose two.)",
   ["Destruction of the key and all of its copies", "Generation of keys that are unique to the data being protected"],
   ["Distribution of keys to external partners", "Archival of keys for future decryption", "Use of one shared key across all data sets"],
   "Crypto-shredding needs per-dataset keys that can be destroyed completely. Archiving or sharing keys defeats the guarantee.")
tf(C2, 'crypto', "Hashing is a reversible process that lets the original data be recovered with the right key.", False,
   "Hashing is one-way; encryption is the reversible operation.")
tf(C2, 'crypto', "A digital signature provides integrity, origin authentication and non-repudiation.", True,
   "Signing a hash with the sender's private key lets anyone verify it with the public key.")
tf(C2, 'crypto', "TLS protects data at rest in a cloud storage service.", False,
   "TLS protects data in transit; storage encryption protects data at rest.")
tf(C2, 'crypto', "Rotating keys regularly limits how much data is exposed if one key is compromised.", True,
   "Rotation shortens key lifetime and reduces the data protected by any single key.")
tf(C2, 'crypto', "Tokenization is suitable for protecting data inside a vault-backed system where real values must be retrievable by authorized services.", True,
   "The vault maps tokens back to real values for authorized use, while other systems never see the real data.")
tf(C2, 'crypto', "Under HYOK the cloud provider can still decrypt data using keys held in its own key management service.", False,
   "In HYOK the keys remain outside the provider's control, so the provider cannot decrypt.")

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 3: Cloud Platform and Infrastructure Security (topic tags: infra, resil)
# ---------------------------------------------------------------------------------------------------------------
f(C3, 'infra', 'Type 1 and Type 2 hypervisors',
  "A Type 1 (bare-metal) hypervisor runs directly on hardware and underpins cloud platforms; a Type 2 (hosted) hypervisor runs as an application on a host operating system and is mostly used on workstations.",
  "A hypervisor compromise exposes every guest on the host, so hardening and patching it is the provider's top priority.")
f(C3, 'infra', 'VM escape',
  "An attack in which code inside a guest virtual machine breaks isolation and reaches the hypervisor or other guests.",
  "The canonical multi-tenancy threat; mitigations are patching, minimal hypervisor features and placing very sensitive workloads on dedicated hosts.")
f(C3, 'infra', 'Side-channel and noisy-neighbor risks',
  "Shared hardware lets one tenant infer secrets from another through timing, cache or resource-contention effects, or degrade a neighbor's performance by consuming shared resources.",
  "Mitigate with dedicated hosts, resource quotas and confidential computing for the most sensitive workloads.")
f(C3, 'infra', 'Container isolation',
  "Containers share the host kernel and are separated by namespaces and control groups; this is lighter than a virtual machine but a weaker isolation boundary.",
  "A kernel flaw can affect every container on the host; sensitive multi-tenant workloads may need VM-level isolation.")
f(C3, 'infra', 'Container image security',
  "Build images from trusted minimal base images, scan for vulnerabilities and embedded secrets, sign them and pull only from a trusted registry, and rebuild rather than patching running containers.",
  "Shift-left scanning plus admission control that refuses unsigned or vulnerable images is the standard answer.")
f(C3, 'infra', 'Kubernetes security controls',
  "Role-based access control for the API server, network policies between pods, pod security standards, secrets protection, admission controllers and an audit log of control-plane activity.",
  "The control plane and kubelet APIs are the crown jewels; an exposed dashboard or over-privileged service account is the usual breach.")
f(C3, 'infra', 'Serverless (function as a service)',
  "Code runs in short-lived, provider-managed execution environments triggered by events, with no servers for the customer to patch.",
  "Risks shift to over-privileged function roles, insecure event inputs, vulnerable dependencies and poor visibility; apply least privilege per function.")
f(C3, 'infra', 'Virtual private cloud and subnets',
  "A logically isolated virtual network in a public cloud, divided into subnets (public or private) with route tables controlling whether traffic can reach the internet.",
  "Place data tiers in private subnets with no direct internet route; public exposure should be a deliberate exception.")
f(C3, 'infra', 'Security groups versus network ACLs',
  "Security groups are stateful rules attached to instances or interfaces; network access control lists are stateless rules applied at the subnet boundary and evaluated in order.",
  "Stateful means return traffic is allowed automatically; stateless rules need both directions defined.")
f(C3, 'infra', 'Micro-segmentation',
  "Applying fine-grained policy between individual workloads or tiers so a compromised host cannot move freely to its neighbors.",
  "The cloud answer to lateral movement; it replaces coarse network zones with identity- or tag-based rules.")
f(C3, 'infra', 'Software-defined networking (SDN)',
  "Separating the network control plane from the data plane so networks are configured programmatically through APIs rather than device by device.",
  "Enables automation and consistent policy but makes the management API a high-value target.")
f(C3, 'infra', 'Zero trust network access (ZTNA)',
  "Granting access to specific applications per session based on verified user, device and context, instead of placing users on a broad network through a traditional VPN.",
  "Preferred over network-level VPN access for remote users when the stem stresses least privilege.")
f(C3, 'infra', 'Private connectivity and private endpoints',
  "Dedicated links or VPN tunnels join on-premises networks to the cloud, and private endpoints expose a cloud service on a private address so traffic never traverses the public internet.",
  "A dedicated link is private but not automatically encrypted; add encryption if the data requires it.")
f(C3, 'infra', 'Distributed denial of service (DDoS) protection',
  "Provider and third-party services absorb or scrub volumetric and application-layer floods using large capacity, anycast routing and rate limiting.",
  "Elasticity helps, but unmetered scaling during an attack can become an economic denial of service; set budgets and alerts.")
f(C3, 'infra', 'Immutable infrastructure',
  "Servers and containers are never modified after deployment; changes are made by building a new image and replacing the old instances.",
  "Removes configuration drift and makes rollback and forensics simpler; patching means redeploying.")
f(C3, 'infra', 'Infrastructure as code (IaC) security',
  "Defining infrastructure in version-controlled templates that are reviewed, scanned for misconfiguration and enforced with policy as code before deployment.",
  "A misconfigured template replicates a flaw at scale; scanning in the pipeline is cheaper than finding it in production.")
f(C3, 'infra', 'Trusted platform technologies',
  "A trusted platform module and secure or measured boot verify the integrity of firmware and boot components, and remote attestation lets a service confirm a host's state before trusting it.",
  "Underpins confidential computing and trustworthy workload placement.")
f(C3, 'infra', 'Cloud data center design',
  "Resilient facilities use redundant power, cooling and connectivity (for example N+1 or 2N), physical access control and environmental monitoring, and are evaluated against recognized tier or standards frameworks.",
  "Customers cannot inspect hyperscale sites, so they rely on independent audit reports and certification evidence.")
f(C3, 'infra', 'Cloud management plane',
  "The console, APIs and command-line tools used to create, configure and delete cloud resources.",
  "Compromise of management-plane credentials is catastrophic; protect it with multi-factor authentication, least privilege and detailed audit logging.")
f(C3, 'resil', 'Business continuity, disaster recovery and BCDR planning',
  "Business continuity keeps critical functions running through disruption; disaster recovery restores IT systems after a disaster; BCDR planning addresses both together.",
  "DR is a subset of continuity; start from business impact analysis, not from technology.")
f(C3, 'resil', 'Business impact analysis (BIA)',
  "A structured assessment of how the loss of each process affects the organization over time, producing criticality rankings and recovery targets.",
  "Recovery objectives must come from the BIA; choosing technology first is a classic wrong answer.")
f(C3, 'resil', 'Recovery time objective (RTO)',
  "The maximum acceptable time to restore a service after an outage.",
  "A smaller RTO demands more expensive, more automated recovery options.")
f(C3, 'resil', 'Recovery point objective (RPO)',
  "The maximum acceptable amount of data loss measured in time, determining how often data must be replicated or backed up.",
  "RPO drives backup and replication frequency; RTO drives the recovery architecture.")
f(C3, 'resil', 'Maximum tolerable downtime',
  "The longest an organization can lose a function before the harm becomes unacceptable, which sets an upper bound above the RTO.",
  "RTO must be shorter than the maximum tolerable downtime or recovery will arrive too late.")
f(C3, 'resil', 'Regions and availability zones',
  "A region is a geographic area; availability zones are isolated data-center groups within it. Spreading across zones tolerates a facility failure, spreading across regions tolerates a regional disaster.",
  "Match the design to the failure scenario and to data residency constraints.")
f(C3, 'resil', 'Disaster recovery strategies',
  "In increasing cost and speed: backup and restore, pilot light (minimal core running), warm standby (scaled-down copy) and active-active (full capacity in more than one location).",
  "Pick the cheapest option that meets the stated RTO and RPO.")
f(C3, 'resil', 'Synchronous versus asynchronous replication',
  "Synchronous replication commits to both sites before acknowledging, giving near-zero data loss but adding latency; asynchronous acknowledges first and copies later, performing better over distance but risking some data loss.",
  "A near-zero RPO across long distances usually conflicts with performance; know the trade-off.")
f(C3, 'resil', 'Immutable and offline backups',
  "Backups that cannot be altered or deleted for a retention period, or are logically separated from production credentials, so ransomware or an attacker cannot destroy them.",
  "The key defense against ransomware; test restores, not just backups.")
f(C3, 'resil', 'Cloud risk analysis',
  "Identifying assets, threats and vulnerabilities in a cloud design, estimating likelihood and impact and choosing treatment. Typical cloud risks include loss of governance, isolation failure, insecure interfaces, management-plane compromise and vendor lock-in.",
  "Risk analysis precedes control selection, and the owner of the asset accepts residual risk.")
f(C3, 'resil', 'Failure testing and chaos engineering',
  "Deliberately injecting failures, from game-day exercises to automated experiments, to confirm that failover, alerting and recovery procedures really work.",
  "An untested plan is an assumption; tabletop, simulation and full failover tests are increasing in realism and risk.")

# ---- questions: Domain 3, infra
mc(C3, 'infra', "A cloud provider hosts multiple tenants on shared hosts. Which attack is MOST directly aimed at breaking tenant isolation?",
   "Virtual machine escape to the hypervisor",
   ["Brute-force guessing of a customer's console password", "Cross-site scripting against a tenant's website", "Phishing a customer's help desk"],
   "A VM escape defeats the isolation boundary between guests on the same host. The other attacks target customer authentication, application code or social engineering, not the multi-tenant boundary.")
mc(C3, 'infra', "A company runs a regulated workload that must not share physical hosts with other tenants. Which option BEST meets this requirement?",
   "Dedicated hosts or single-tenant instances",
   ["Larger virtual machine sizes on shared hosts", "Spreading instances across several availability zones", "Enabling stricter security group rules"],
   "Dedicated hosts remove co-tenancy at the physical level. Larger sizes still share hardware, zones address availability and security groups filter traffic.")
mc(C3, 'infra', "A team deploys a container image containing a known critical vulnerability to production because the pipeline has no gate. What control would have PREVENTED this?",
   "Image scanning with an admission policy that blocks vulnerable images",
   ["Running the containers with a higher CPU quota", "Adding a bastion host in front of the cluster", "Enabling debug logging inside the container"],
   "Scanning and enforcing policy at admission stops vulnerable images before they run. Quotas, bastion hosts and logging do not assess image content.")
mc(C3, 'infra', "An engineer needs to reduce lateral movement between application tiers inside one virtual network after an incident. What is the MOST effective design change?",
   "Micro-segmentation with deny-by-default rules between workloads",
   ["Moving all tiers into a single flat subnet for simplicity", "Opening all ports between tiers to simplify troubleshooting during the incident", "Relying on the perimeter firewall to detect internal movement"],
   "Segmentation limits what a compromised host can reach. A flat network and open ports increase movement, and a perimeter device cannot see east-west traffic it never receives.")
mc(C3, 'infra', "A serverless function that resizes images was given an access role allowing it to read every storage bucket in the account. What is the MOST appropriate action?",
   "Replace the role with least-privilege permissions for the one bucket and actions needed",
   ["Keep the existing role but add detailed logging and alerts for all function invocations and errors", "Increase the function timeout to reduce errors", "Move the function to a larger memory configuration"],
   "Over-privileged execution roles are the main serverless risk; fix by least privilege. Logging detects but does not reduce blast radius and timeouts or memory are unrelated.")
mc(C3, 'infra', "Remote contractors need access to one internal web application only. Which approach BEST follows zero trust principles?",
   "Zero trust network access granting per-application sessions after verifying device",
   ["A full-tunnel VPN placing contractors on the corporate network", "Sharing a common account protected by a long password", "Whitelisting the contractors' home IP addresses permanently on the application firewall"],
   "ZTNA grants access to one application per verified session. A VPN gives broad network reach, a shared account destroys accountability and static IP addresses are unreliable and over-broad.")
mc(C3, 'infra', "Which statement about security groups and network ACLs in a virtual private cloud is MOST accurate?",
   "Security groups are stateful and instance-level; network ACLs are stateless and subnet-level",
   ["Both are stateful and applied only at the instance level", "Network ACLs are stateful and attached to instances, while security groups are stateless and apply at subnet boundaries", "Both are stateless and applied only to internet gateways"],
   "Security groups track connections so return traffic is allowed automatically; ACLs evaluate each packet independently and need rules for both directions.")
mc(C3, 'infra', "An organization finds that identical servers have drifted apart through manual hotfixes, making incidents hard to investigate. Which approach BEST addresses the root cause?",
   "Immutable infrastructure built from versioned images and templates",
   ["Granting all engineers administrator access to fix problems faster", "Increasing the retention of server logs", "Turning off automatic updates for all hosts"],
   "Replacing rather than modifying servers removes drift and provides known-good state. Broad admin rights make drift worse, logs do not prevent it and disabling updates adds vulnerability.")
mc(C3, 'infra', "A dedicated private link connects an on-premises network to a cloud provider. The data classification requires confidentiality in transit. Which statement is MOST accurate?",
   "The link is private, but encryption must still be configured to meet the requirement",
   ["Private links encrypt all traffic automatically at line rate with provider-managed keys", "Traffic on private links can be read by any other tenant", "Private links remove the need for any access control"],
   "Private does not mean encrypted; layer encryption on top when required. Other tenants cannot read the traffic, but access controls are still needed.")
mc(C3, 'infra', "A security team reviews an infrastructure-as-code pipeline. Which control is MOST valuable for preventing misconfigured resources from reaching production?",
   "Automated policy-as-code scanning of templates before deployment",
   ["Manual review of resources by an engineer after they have been created", "Longer log retention for the deployment tool", "A larger approval chain for budget changes"],
   "Pre-deployment scanning catches misconfiguration at low cost and is repeatable. After-the-fact review lets exposure occur first, and log retention or budget approval do not check security settings.")
mc(C3, 'infra', "An attacker obtains the credentials of a cloud administrator who has no multi-factor authentication. Why is this scenario especially severe?",
   "The management plane lets the attacker create, change and delete resources",
   ["The attacker can physically access the provider's data center", "The attacker can read other customers' data directly", "The attacker gains direct control of the provider's hypervisors and host firmware"],
   "Management-plane access grants control over the customer's whole environment, which is why strong authentication is essential. Physical access, other tenants' data and hypervisor control are provider-side and not granted by customer credentials.")
mc(C3, 'infra', "A customer asks how to confirm a provider's data center has redundant power and cooling since it cannot visit. What is the MOST appropriate source of evidence?",
   "Independent audit reports and certifications covering the facility",
   ["A marketing page describing the provider's data centers", "The provider's verbal assurance given by a senior executive during a sales call", "A network scan of the provider's public addresses"],
   "Independent reports are the dependable evidence. Marketing and verbal claims are unverified and scanning the provider's addresses is unauthorized and does not assess facilities.")
ms(C3, 'infra', "Which TWO measures best reduce the risk of an exposed Kubernetes control plane? (Choose two.)",
   ["Restrict API server access to private networks and authenticated users", "Apply least-privilege role-based access control to users and service accounts"],
   ["Expose the dashboard publicly for convenience", "Run all workloads with cluster-administrator permissions", "Disable audit logging to improve performance"],
   "Network restriction and least privilege shrink exposure and blast radius. The other options are common causes of cluster compromise.")
ms(C3, 'infra', "Which TWO are typical security concerns specific to container platforms? (Choose two.)",
   ["Shared host kernel across containers", "Vulnerable or untrusted base images"],
   ["Guest operating systems that need separate licenses per container", "Hypervisor firmware updates on the customer side"],
   "Containers share a kernel and inherit risk from images. They do not carry their own guest operating systems, and hypervisor firmware is the provider's concern.")
ms(C3, 'infra', "Which THREE actions help protect the cloud management plane? (Choose three.)",
   ["Require multi-factor authentication for all privileged users", "Use just-in-time privileged access with approval", "Send management API activity to a protected audit log"],
   ["Share one root account among administrators", "Disable alerts on console sign-ins from new locations"],
   "Strong authentication, time-bound privilege and tamper-resistant logging reduce risk and support investigation. Shared root accounts remove accountability and disabled alerts blind the team.")
tf(C3, 'infra', "Containers provide stronger isolation than virtual machines because they carry fewer components.", False,
   "Containers share the host kernel, so their isolation boundary is weaker than a VM's hypervisor-enforced boundary.")
tf(C3, 'infra', "In serverless, the customer is responsible for patching the underlying operating system of the function host.", False,
   "The provider manages the runtime host; the customer secures code, dependencies, permissions and configuration.")
tf(C3, 'infra', "Network access control lists are stateless, so rules must allow both inbound and the matching outbound traffic.", True,
   "ACLs evaluate each packet independently, unlike stateful security groups.")
tf(C3, 'infra', "A Type 2 hypervisor is the usual foundation of public cloud platforms.", False,
   "Public clouds run Type 1 (bare-metal) hypervisors for performance and a smaller attack surface.")
tf(C3, 'infra', "A cloud access role that grants a function broad read access across the account is acceptable if the function code is trusted.", False,
   "Least privilege limits the damage from bugs, vulnerable dependencies or injection even in trusted code.")

# ---- questions: Domain 3, resil
mc(C3, 'resil', "A BIA shows an order system can be offline for at most two hours and can lose at most ten minutes of transactions. Which pair of objectives does this describe?",
   "RTO of two hours and RPO of ten minutes",
   ["RTO of ten minutes and RPO of two hours", "RTO and RPO both of two hours", "Maximum tolerable downtime of ten minutes with an RPO of two hours"],
   "RTO measures time to restore service and RPO measures tolerable data loss in time. The other pairings reverse or conflate them.")
mc(C3, 'resil', "A company has an RTO of four hours and an RPO of 24 hours for an internal reporting tool and wants the lowest-cost recovery option. Which strategy fits?",
   "Backup and restore with nightly backups",
   ["Active-active deployment across two regions", "Synchronous replication to a hot standby", "Warm standby with continuous replication"],
   "The relaxed targets are met by daily backups and manual rebuild. The other options meet far stricter objectives at much higher cost.")
mc(C3, 'resil', "A bank needs near-zero data loss and failover in seconds for a payment platform, while accepting higher cost. Which design is MOST appropriate?",
   "Active-active deployment across availability zones with synchronous replication",
   ["Weekly backups to cold storage", "Pilot light with asynchronous replication", "A single zone with a larger instance type"],
   "Only active-active with synchronous replication supports near-zero RPO and fast failover. Backups and pilot light have longer recovery, and a single zone is a single failure domain.")
mc(C3, 'resil', "A planner proposes selecting a disaster recovery technology before the business impact analysis is complete. What is the BEST response?",
   "Complete the BIA first, because recovery objectives come from business criticality",
   ["Proceed with the technology choice, since the available technology determines the recovery objectives", "Choose the most expensive option to be safe", "Copy the targets from another organization"],
   "The BIA identifies what matters and how fast it must recover; technology choices follow. Cost-driven or borrowed targets are not tied to this organization's impact.")
mc(C3, 'resil', "A ransomware attack encrypted production data and the backup repository because both shared the same administrator credentials. Which control would have MOST reduced the impact?",
   "Immutable backups stored separately from production credentials",
   ["More frequent full backups written to the same repository with the same credentials", "Longer password expiry for administrators", "Larger storage capacity for the repository"],
   "Immutable, logically separated backups survive credential compromise. Backing up more often to the same repository does not protect it, and password policy or capacity does not stop deletion.")
mc(C3, 'resil', "A cloud application runs in a single availability zone. Which failure scenario is it MOST exposed to?",
   "Loss of the entire availability zone",
   ["Loss of a single virtual machine instance", "An expired application certificate", "A transient network error"],
   "Using one zone makes that facility a single point of failure. Individual instance loss could be handled by auto-scaling inside the zone and the others are unrelated to zone design.")
mc(C3, 'resil', "A multi-region design must comply with a rule that customer data stays within one country. What is the BEST approach?",
   "Choose recovery regions inside the permitted jurisdiction and verify replication",
   ["Replicate to whichever region worldwide offers the cheapest storage and compute", "Disable replication entirely", "Let the provider choose any region dynamically"],
   "Resilience must respect residency rules, so recovery sites must be within the jurisdiction. Replicating anywhere violates the rule, no replication sacrifices availability and dynamic placement removes control.")
mc(C3, 'resil', "Which statement about testing a disaster recovery plan is MOST accurate?",
   "Only a restore or failover test shows whether the objectives can actually be met",
   ["A backup job that completes without error proves recovery will work", "A yearly review of the document is sufficient", "Testing is unnecessary for cloud workloads because the provider handles it"],
   "Successful backups say nothing about restore success or timing. Document review does not test procedures, and the customer remains responsible for its own recovery.")
ms(C3, 'resil', "Which TWO statements correctly relate recovery objectives to design? (Choose two.)",
   ["A lower RPO requires more frequent replication or backup", "A lower RTO requires more automation and standby capacity"],
   ["A lower RTO can be met with weekly backups", "RPO measures how long restoration takes", "RTO should always be set longer than the maximum tolerable downtime"],
   "Tighter targets cost more. RPO measures data loss, not restoration time, and the RTO must fit within maximum tolerable downtime.")
ms(C3, 'resil', "Which TWO risks are specifically associated with cloud adoption as seen in a cloud risk analysis? (Choose two.)",
   ["Loss of governance and visibility over provider-operated layers", "Failure of isolation between tenants"],
   ["Elimination of the need for patching customer-owned systems", "Guaranteed protection from regulatory penalties"],
   "Reduced control and shared-infrastructure isolation are core cloud-specific risks. Customer systems still need patching and regulatory duties remain.")
tf(C3, 'resil', "The recovery point objective is the maximum acceptable time to restore a service after an outage.", False,
   "That is the RTO. RPO is the maximum acceptable data loss measured in time.")
tf(C3, 'resil', "Spreading workloads across availability zones protects against the failure of one data-center facility in a region.", True,
   "Zones are isolated failure domains within a region.")
tf(C3, 'resil', "Asynchronous replication guarantees zero data loss during a site failure.", False,
   "Asynchronous replication can lose the most recent writes that had not yet been copied.")
tf(C3, 'resil', "Recovery objectives for a system should be derived from the business impact analysis.", True,
   "The BIA ties recovery targets to business harm over time.")

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 4: Cloud Application Security (topic tags: app, iam)
# ---------------------------------------------------------------------------------------------------------------
f(C4, 'app', 'Secure software development life cycle (SDLC)',
  "Building security activities into every phase of development: requirements, design, coding, testing, deployment and maintenance, rather than testing for security only at the end.",
  "The earlier a defect is found the cheaper it is to fix; 'shift left' is the standard exam answer.")
f(C4, 'app', 'DevSecOps',
  "Integrating security checks, automation and shared ownership into continuous integration and delivery pipelines so security keeps pace with frequent releases.",
  "Automated scanning gates and policy as code replace slow manual security sign-offs.")
f(C4, 'app', 'Threat modeling and STRIDE',
  "A structured method to find threats during design. STRIDE categorizes them as Spoofing, Tampering, Repudiation, Information disclosure, Denial of service and Elevation of privilege.",
  "Do it at design time, using data flow diagrams and trust boundaries; know which STRIDE category matches which attack.")
f(C4, 'app', 'PASTA and attack trees',
  "PASTA is a risk-centric, seven-stage threat modeling process tied to business impact; attack trees decompose an attacker's goal into the steps needed to reach it.",
  "Other models alongside STRIDE; the exam asks you to match method to purpose, not to run them in detail.")
f(C4, 'app', 'OWASP Top 10',
  "A regularly updated awareness list of the most critical web application security risks, such as broken access control, injection and cryptographic failures.",
  "It is a list of risk categories, not a standard to certify against; broken access control tops recent editions.")
f(C4, 'app', 'Static application security testing (SAST)',
  "Analyzing source code or binaries without running them to find coding flaws early in development.",
  "Early and cheap but produces false positives and cannot see runtime or configuration issues.")
f(C4, 'app', 'Dynamic application security testing (DAST)',
  "Testing a running application from the outside by sending crafted requests to find exploitable behavior.",
  "Finds runtime and configuration flaws without source access; needs a deployed environment and is later in the cycle.")
f(C4, 'app', 'Interactive application security testing (IAST) and runtime application self-protection (RASP)',
  "IAST instruments a running application during testing to report vulnerabilities with code context; RASP embeds protection inside the application to detect and block attacks at runtime.",
  "IAST is a testing technique; RASP is a runtime defense. Do not confuse them with SAST and DAST.")
f(C4, 'app', 'Software composition analysis (SCA) and SBOM',
  "SCA finds known vulnerabilities and license issues in third-party libraries; a software bill of materials lists every component in a build so exposure can be assessed quickly when a flaw is announced.",
  "Most modern applications are mostly third-party code, so supply-chain visibility is a core cloud application control.")
f(C4, 'app', 'Software supply chain security',
  "Protecting the code, dependencies, build systems and artifacts that produce software, using signed commits and artifacts, provenance records, locked dependency versions and hardened build pipelines.",
  "Attackers target build pipelines and public packages; signing and provenance prove an artifact came from your trusted build.")
f(C4, 'app', 'API security',
  "Securing programmatic interfaces with strong authentication and authorization on every call, input and schema validation, rate limiting, encryption in transit and an API gateway that centralizes policy.",
  "Broken object-level authorization is the leading API risk; inventory shadow and deprecated APIs.")
f(C4, 'app', 'Web application firewall (WAF)',
  "A filter in front of web applications that inspects HTTP traffic and blocks common attacks such as injection and cross-site scripting.",
  "A compensating control that buys time; it does not replace fixing the vulnerable code.")
f(C4, 'app', 'Input validation and output encoding',
  "Treat all input as untrusted, validate it against an allow-list, and encode output for its context so injected content is displayed as data rather than executed.",
  "The root fix for injection and cross-site scripting; blocklists are weak.")
f(C4, 'app', 'Prompt injection',
  "An attack on applications built on large language models in which crafted input, or content the model retrieves, overrides the developer's instructions and causes disclosure or unwanted actions.",
  "Defend by treating model output as untrusted, restricting tool permissions, filtering input and output and keeping secrets out of prompts.")
f(C4, 'app', 'Securing AI-augmented applications',
  "Apply least privilege to model tools and data connectors, validate and sanitize model output before it reaches other systems, log prompts and responses and guard against data leakage and over-reliance on model decisions.",
  "Newer outline content; tie it to familiar principles such as input validation, authorization and monitoring.")
f(C4, 'app', 'Inference and model extraction attacks',
  "Attackers query a deployed model to infer whether specific records were in its training data, reconstruct sensitive attributes or copy the model's behavior.",
  "Mitigate with rate limiting, access control, output limits and privacy-preserving training.")
f(C4, 'app', 'Penetration testing and vulnerability management in the cloud',
  "Testing needs authorization within the provider's rules of engagement; findings flow into a managed process of prioritizing by risk, remediating and verifying.",
  "Never test provider infrastructure without permission; customer-controlled layers are generally allowed within published policy.")
f(C4, 'app', 'Microservices and service mesh security',
  "Many small services communicate over the network, so each needs authentication, authorization and encryption; a service mesh can enforce mutual TLS and policy between services.",
  "More endpoints mean a larger attack surface; zero trust between services is the cloud-native answer.")
f(C4, 'iam', 'Identity and access management (IAM) for cloud',
  "The processes and technology for establishing identities, authenticating them, authorizing access to resources and auditing activity, for people and for workloads.",
  "Identity is the primary control plane in cloud; most exam scenarios are won by stronger identity, not stronger network.")
f(C4, 'iam', 'Federated identity and single sign-on (SSO)',
  "Trust between an identity provider and relying services lets users authenticate once and access many systems without separate credentials, with the provider issuing signed assertions or tokens.",
  "Federation centralizes authentication and deprovisioning; compromise of the identity provider has broad impact.")
f(C4, 'iam', 'SAML, OpenID Connect and OAuth 2.0',
  "SAML exchanges XML assertions for enterprise web single sign-on; OpenID Connect adds an authentication layer on top of OAuth 2.0 using JSON tokens; OAuth 2.0 delegates authorization to access resources without sharing passwords.",
  "OAuth is authorization, not authentication; OpenID Connect is the authentication layer.")
f(C4, 'iam', 'Multi-factor authentication (MFA)',
  "Requiring two or more independent factors: something you know, have or are. Phishing-resistant methods such as hardware security keys and passkeys are strongest.",
  "SMS codes are weaker than authenticator apps or hardware keys; privileged and remote access always need MFA.")
f(C4, 'iam', 'Role-based and attribute-based access control',
  "RBAC grants permissions through roles tied to job function; ABAC decides using attributes of user, resource and context, allowing finer and more dynamic policy.",
  "ABAC scales better for dynamic cloud environments but is harder to audit; RBAC is simpler and common.")
f(C4, 'iam', 'Privileged access management and just-in-time access',
  "Controls for powerful accounts: vaulting credentials, session recording and granting elevated rights only for a limited approved period.",
  "Standing administrator rights are the risk; time-bound elevation shrinks the exposure window.")
f(C4, 'iam', 'Workload identity and service accounts',
  "Non-human identities that applications and automation use to call services, ideally issued short-lived credentials by the platform instead of long-lived static keys.",
  "Leaked static keys are a leading breach cause; prefer role assumption and managed identities.")
f(C4, 'iam', 'Least privilege and separation of duties',
  "Give each identity only the permissions needed, and split critical tasks so no single person can complete a sensitive action alone.",
  "Expect the answer that removes excess entitlements and enforces review of who can approve and who can execute.")
f(C4, 'iam', 'Identity provisioning and SCIM',
  "Automated creation, update and removal of accounts across systems (the System for Cross-domain Identity Management standard is common) so access follows joiner, mover and leaver events.",
  "Orphaned accounts after departures are a frequent finding; automate deprovisioning.")
f(C4, 'iam', 'Cloud access security broker (CASB)',
  "A control point between users and cloud services that provides visibility, data protection, threat detection and policy enforcement for sanctioned and unsanctioned services.",
  "Answers shadow IT and data-movement scenarios; works through API connections or proxy placement.")

# ---- questions: Domain 4, app
mc(C4, 'app', "A team discovers an authorization design flaw one week before launch that requires reworking the data model. In which activity would this flaw MOST cost-effectively have been found?",
   "Threat modeling during design",
   ["Penetration testing after deployment", "Production monitoring after launch", "A yearly security awareness course"],
   "Threat modeling at design time finds structural flaws when they are cheapest to fix. Testing after deployment and monitoring find them late, and awareness training does not review a design.")
mc(C4, 'app', "A threat model shows that an attacker could send a request pretending to be another user to reach private records. Which STRIDE category does this describe?",
   "Spoofing",
   ["Tampering", "Repudiation", "Denial of service"],
   "Impersonating an identity is spoofing. Tampering alters data, repudiation denies actions without evidence and denial of service degrades availability.")
mc(C4, 'app', "A company needs to find vulnerable open-source libraries and the exact versions in each release so it can respond quickly to a new advisory. Which approach BEST achieves this?",
   "Software composition analysis with a maintained software bill of materials",
   ["Static analysis of only the company's own source code before each release", "A web application firewall in front of the application", "A quarterly code review by a senior developer"],
   "SCA and an SBOM inventory third-party components. SAST of in-house code misses libraries, a WAF is a runtime filter and manual reviews cannot track dependency versions at scale.")
mc(C4, 'app', "Which testing technique can find a misconfigured response header and an exploitable input path in a running staging environment WITHOUT access to the source code?",
   "Dynamic application security testing",
   ["Static application security testing of the source code", "Software composition analysis", "Peer code review"],
   "DAST probes the running application from outside. SAST and review need source, and SCA examines components rather than behavior.")
mc(C4, 'app', "An API returns another customer's invoice when a user changes the invoice number in the request, though authentication succeeded. Which problem is this?",
   "Broken object-level authorization",
   ["Insufficient logging and monitoring of API activity", "Weak transport encryption", "Missing rate limiting"],
   "Authentication proved who the caller is, but the API failed to check whether they may access that object. This is the leading API risk. Logging, encryption and rate limiting are separate gaps.",
   "Authentication versus authorization failures appear in many forms.")
mc(C4, 'app', "A company's build server was compromised and attackers inserted a backdoor into released software, even though the source repository was clean. Which control would have MOST helped detect or prevent this?",
   "Signed build artifacts with provenance verification before deployment",
   ["More frequent manual testing of the final application before release", "A WAF rule update for the production site", "Encrypting the source repository at rest"],
   "Provenance and signing show that an artifact came from the trusted pipeline and was not altered. Manual testing may miss a backdoor, a WAF does not examine build integrity and encrypting a clean repository does nothing for the build system.")
mc(C4, 'app', "A customer support chatbot built on a large language model retrieves web pages to answer questions. A page contains hidden text telling the model to email customer records to an outside address. Which defense is MOST effective?",
   "Treat retrieved content as untrusted and limit the model's tool permissions",
   ["Increase the model's temperature setting", "Add the instruction 'ignore malicious text' to the system prompt as the only control", "Move the chatbot to a larger instance size"],
   "Indirect prompt injection is mitigated by least privilege on tools, output controls and treating inputs as untrusted. A system prompt instruction alone can be overridden, and temperature or instance size are unrelated.",
   "The revised outline adds AI application threats such as prompt injection.")
mc(C4, 'app', "Which statement about a web application firewall is MOST accurate?",
   "A compensating control that reduces exposure while the code flaw is fixed",
   ["It removes the need to patch application code because attacks never reach the server", "It encrypts data stored in the application database", "It authenticates users to the application"],
   "A WAF filters known attack patterns but does not remove vulnerabilities. It does not provide storage encryption or authentication.")
mc(C4, 'app', "A security team wants developers to receive vulnerability feedback in their code editor and pull requests before merging. Which practice BEST supports this?",
   "Shift-left automated scanning integrated into the build pipeline",
   ["Annual penetration tests by an external firm", "A security sign-off meeting held by the review board after release", "Monitoring production logs for exceptions"],
   "Automated scanning in the pipeline gives fast feedback early. Annual tests and post-release meetings are too late and log monitoring is detective only.")
mc(C4, 'app', "Which action BEST reduces the risk that a query to a deployed machine learning model reveals whether a particular person's record was in its training data?",
   "Limit query rates and output detail, and use privacy-preserving training",
   ["Publish the model weights so researchers can inspect them", "Increase the size of the training data without changing the training process", "Store the model in a bucket with a long, random name"],
   "Inference attacks rely on repeated, detailed queries; limiting them and training with privacy protections reduces leakage. Publishing weights makes it easier and obscure names are not access control.")
mc(C4, 'app', "A cloud-hosted service is vulnerable to SQL injection. Which fix addresses the ROOT cause?",
   "Use parameterized queries and validate input against an allow-list",
   ["Block the attacker's current source IP address", "Encrypt the database connection with TLS", "Increase the size of the database instance to absorb malicious queries"],
   "Parameterized queries stop input from being interpreted as code. Blocking an address is temporary, TLS protects transit and size is unrelated.")
ms(C4, 'app', "Which TWO practices strengthen API security? (Choose two.)",
   ["Authorize each request against the specific object and action", "Validate requests against a defined schema and enforce rate limits"],
   ["Rely on obscure URL paths to hide endpoints", "Use a single shared key embedded in all mobile apps", "Disable logging to protect user privacy"],
   "Per-request authorization and input and rate controls are core. Obscurity, shared embedded keys and no logging weaken security.")
ms(C4, 'app', "Which TWO are valid reasons to combine static and dynamic testing in a pipeline? (Choose two.)",
   ["Static analysis finds code flaws early without a running system", "Dynamic testing finds runtime and configuration issues static tools miss"],
   ["Either one alone finds every class of vulnerability", "Dynamic testing requires access to the source code", "Static analysis can detect flaws in the provider's hypervisor"],
   "The techniques are complementary. Neither finds everything, DAST does not need source and SAST examines customer code only.")
tf(C4, 'app', "OWASP Top 10 is a certification standard that applications must pass to be considered secure.", False,
   "It is an awareness list of common risk categories, not a certifiable standard.")
tf(C4, 'app', "Threat modeling is most valuable when performed during design, before code is written.", True,
   "Design-time modeling finds structural flaws cheaply.")
tf(C4, 'app', "A software bill of materials helps identify which applications contain a newly announced vulnerable library.", True,
   "An SBOM inventories components so exposure can be assessed quickly.")
tf(C4, 'app', "Penetration testing of a cloud provider's shared infrastructure by a customer is allowed without notification.", False,
   "Testing must follow the provider's published rules; shared infrastructure is generally off limits.")
tf(C4, 'app', "Output from a large language model should be treated as untrusted input by downstream systems.", True,
   "Model output can contain injected or incorrect content, so it must be validated like any external input.")

# ---- questions: Domain 4, iam
mc(C4, 'iam', "An organization wants employees to sign in once to access many SaaS applications and have access removed everywhere when they leave. Which approach BEST meets this?",
   "Federated single sign-on with automated provisioning and deprovisioning",
   ["A shared password stored in a team document", "Separate local accounts in each application, managed individually by the application owners", "A spreadsheet of accounts reviewed once a year"],
   "Federation centralizes authentication and, with provisioning, makes leaver removal consistent. Shared passwords and separate accounts create orphaned access and spreadsheets are slow and error-prone.")
mc(C4, 'iam', "A mobile application needs permission to read a user's calendar from a third-party service without ever seeing the user's password. Which protocol is designed for this?",
   "OAuth 2.0",
   ["SAML assertions for web single sign-on", "Basic authentication over TLS", "Kerberos ticket granting"],
   "OAuth 2.0 delegates limited access using tokens. SAML is enterprise web sign-on, basic authentication exposes the password to the app and Kerberos is for enterprise network authentication.")
mc(C4, 'iam', "A developer states that because their application uses OAuth 2.0 tokens, it already authenticates users. What is the MOST accurate response?",
   "OAuth handles authorization; OpenID Connect adds the authentication layer",
   ["OAuth is purely an authentication protocol", "OpenID Connect replaces TLS", "SAML is required for any form of token-based authentication in cloud services"],
   "OAuth was designed for delegated authorization; identity is added by OpenID Connect. The other statements misdescribe the protocols.")
mc(C4, 'iam', "Cloud administrators hold permanent elevated roles even though they use them only a few times a month. Which change MOST reduces risk?",
   "Just-in-time elevation with approval and session recording",
   ["Longer passwords with stricter complexity for administrator accounts", "Moving administrators to a separate office", "Renaming administrator accounts"],
   "Removing standing privilege shrinks the exposure window and adds accountability. Longer passwords help but leave permanent privilege, and the other options do not.")
mc(C4, 'iam', "A pipeline uses a long-lived access key stored in a repository to deploy infrastructure. Which approach is BEST?",
   "Use a platform-issued short-lived workload identity with scoped permissions",
   ["Rotate the key once per year but keep it stored in the shared code repository for the team", "Share the key with the whole engineering team", "Encode the key in base64 before committing it"],
   "Short-lived, scoped credentials issued to the workload remove stored secrets. Yearly rotation leaves a long exposure, sharing widens it and encoding is not protection.")
mc(C4, 'iam', "A company must grant access based on department, data sensitivity, device compliance and time of day. Which model fits BEST?",
   "Attribute-based access control",
   ["Role-based access control only", "Discretionary access control by file owners", "Mandatory access control with fixed labels only"],
   "ABAC evaluates multiple attributes and context at decision time. Role-only models cannot express context, DAC leaves decisions to owners and fixed labels lack contextual factors.")
mc(C4, 'iam', "Employees use unsanctioned file-sharing services to send work documents. The company wants visibility and policy enforcement over these cloud services. Which tool BEST helps?",
   "A cloud access security broker",
   ["A hardware security module", "A network time server", "A load balancer"],
   "A CASB discovers cloud service usage and enforces data and access policy. An HSM stores keys, a time server synchronizes clocks and a load balancer distributes traffic.")
mc(C4, 'iam', "Which authentication approach is MOST resistant to phishing for a cloud administrator?",
   "A hardware security key or passkey bound to the legitimate site",
   ["A one-time code sent by SMS", "A long password that is subject to a strict complexity and rotation policy", "A security question"],
   "Hardware keys and passkeys verify the site and cannot be relayed easily. SMS codes can be intercepted or phished, passwords can be disclosed and questions are guessable.")
ms(C4, 'iam', "Which TWO statements about federated identity are accurate? (Choose two.)",
   ["The relying service trusts signed assertions from the identity provider", "Compromise of the identity provider can affect many connected services"],
   ["Each service must store a separate copy of the user's password", "Federation removes the need for authorization decisions", "Federation only works inside one organization"],
   "Trust is based on signed assertions, and centralization concentrates risk. Services do not store the passwords, authorization is still needed and federation spans organizations.")
tf(C4, 'iam', "SMS one-time codes are the strongest form of multi-factor authentication available.", False,
   "SMS can be intercepted or socially engineered; hardware keys and passkeys are stronger.")
tf(C4, 'iam', "Separation of duties means one person should not be able to both request and approve a sensitive action.", True,
   "Splitting critical tasks prevents any single person from completing fraud or abuse alone.")
tf(C4, 'iam', "Orphaned accounts of departed employees are reduced by automating provisioning and deprovisioning.", True,
   "Automation ties account removal to HR events rather than manual follow-up.")

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 5: Cloud Security Operations (topic tag: ops)
# ---------------------------------------------------------------------------------------------------------------
f(C5, 'ops', 'Cloud logging and monitoring sources',
  "Key sources include management-plane audit logs (who did what through the console and APIs), network flow logs, operating system and application logs, identity provider logs and managed-service logs, all sent to a central protected store.",
  "Turn on management-plane logging first; without it you cannot reconstruct an account compromise.")
f(C5, 'ops', 'Security information and event management (SIEM)',
  "A platform that collects, normalizes and correlates logs from many sources, raises alerts on suspicious patterns and retains data for investigation and compliance.",
  "Correlation and retention are the value; a SIEM fed incomplete or unsynchronized logs gives false comfort.")
f(C5, 'ops', 'Security orchestration, automation and response (SOAR)',
  "Tools that automate repetitive response tasks and orchestrate playbooks across security and IT systems, such as enriching an alert and isolating a host.",
  "SIEM detects; SOAR responds. Automate containment of high-confidence, low-impact actions and keep humans in the loop for risky ones.")
f(C5, 'ops', 'Log integrity, centralization and retention',
  "Logs should be sent off the system that produced them, protected against tampering, time-synchronized and retained according to legal and investigative needs.",
  "Attackers delete local logs first; write-once central storage preserves evidence.")
f(C5, 'ops', 'Cloud security posture management (CSPM)',
  "Continuously checks cloud configurations against benchmarks and policy, flags misconfigurations such as public storage or open management ports and can trigger remediation.",
  "Misconfiguration, not exotic exploits, causes most cloud breaches, so CSPM is a staple answer.")
f(C5, 'ops', 'Cloud workload protection and runtime security',
  "Agent or agentless tooling that monitors running workloads, containers and functions for vulnerabilities, malware and anomalous behavior.",
  "Complements posture checks: CSPM looks at configuration, workload protection looks at what is running.")
f(C5, 'ops', 'Configuration baselines and drift detection',
  "A baseline is the approved secure configuration; drift is any deviation from it over time, detected automatically and corrected or investigated.",
  "Pairs with infrastructure as code: the template is the source of truth, and out-of-band changes are drift.")
f(C5, 'ops', 'Change management',
  "A controlled process for requesting, reviewing, approving, testing, implementing and recording changes so they do not introduce unmanaged risk.",
  "Emergency changes still need after-the-fact review; unauthorized change is a top cause of outages and incidents.")
f(C5, 'ops', 'Patch management and shared responsibility',
  "Prioritize patches by risk, test, deploy and verify. The customer patches guest operating systems and applications in IaaS; the provider patches the platform layers it operates.",
  "Know whose patch it is under each service model; unknown or unowned assets are never patched.")
f(C5, 'ops', 'System hardening',
  "Reducing attack surface by removing unneeded services, closing ports, applying secure benchmarks and setting strong defaults on every image and instance.",
  "Harden the image once and deploy it many times; benchmark checks should be automated.")
f(C5, 'ops', 'Vulnerability scanning and management',
  "Regularly scanning assets, preferably with authenticated scans, then triaging by exploitability and business impact, remediating and verifying the fix.",
  "Scanning finds issues; management is the full cycle. Prioritize by risk, not by raw score alone.")
f(C5, 'ops', 'Incident response life cycle',
  "Preparation; detection and analysis; containment, eradication and recovery; and post-incident learning. NIST SP 800-61 Rev. 3 aligns incident response with the functions of the NIST Cybersecurity Framework 2.0.",
  "Preparation (plans, tooling, contacts, logging) is what makes the other phases possible; containment precedes eradication.")
f(C5, 'ops', 'Cloud incident response challenges',
  "Ephemeral resources vanish quickly, logs may belong to the provider, responsibilities are split and access to evidence depends on contracts, so customers must prepare in advance with logging, snapshots and provider contacts.",
  "Questions reward answers that build capability beforehand rather than improvising mid-incident.")
f(C5, 'ops', 'Containment in the cloud',
  "Limiting the damage by isolating affected resources, for example moving an instance to a quarantine security group, revoking credentials and snapshotting storage, rather than powering it off and destroying volatile evidence.",
  "Preserve evidence while stopping spread; revoke or rotate compromised credentials immediately.")
f(C5, 'ops', 'Digital forensics in the cloud',
  "Collecting, preserving and analyzing evidence such as disk snapshots, memory captures and logs in a way that keeps its integrity and admissibility, within the limits of access the provider allows.",
  "Work on copies, hash evidence, document everything and know what the provider can supply under contract.")
f(C5, 'ops', 'Chain of custody',
  "A documented record of who collected, handled, stored and transferred evidence, with times and purpose, proving it has not been altered.",
  "A broken chain of custody can make evidence inadmissible, however good the analysis.")
f(C5, 'ops', 'Order of volatility',
  "Collect the most short-lived evidence first: memory and running processes, then network connections, then disk and storage, then remote logs and archival media.",
  "In cloud, snapshot memory and volumes before terminating an instance, because the instance may not exist later.")
f(C5, 'ops', 'Forensic readiness',
  "Preparing in advance to collect evidence quickly: enabling logs, defining retention, setting up isolated analysis accounts, tooling and legal and contractual arrangements with the provider.",
  "The cloud equivalent of preparation in the incident life cycle.")
f(C5, 'ops', 'Security operations center (SOC) and metrics',
  "The team and processes that monitor, triage and respond to security events. Useful metrics include mean time to detect and mean time to respond.",
  "Measure outcomes over time; alert volume alone says nothing about effectiveness.")
f(C5, 'ops', 'Playbooks and runbooks',
  "Documented, step-by-step procedures for handling specific incident types or operations, increasingly automated, so response is consistent and fast.",
  "Test them in exercises; an untested playbook fails when needed.")
f(C5, 'ops', 'Threat intelligence and threat hunting',
  "Threat intelligence provides context on adversaries and indicators; threat hunting proactively searches for undetected compromise using hypotheses, and increasingly uses machine learning to find anomalies.",
  "Hunting assumes the attacker is already in; the revised outline highlights AI and ML as hunting tools.")
f(C5, 'ops', 'User and entity behavior analytics (UEBA)',
  "Analytics that build baselines of normal behavior for users and systems and flag deviations, such as impossible travel or unusual data downloads.",
  "Useful for detecting stolen credentials and insider abuse where no signature exists.")
f(C5, 'ops', 'Model drift as a security signal',
  "A deployed machine learning model whose behavior shifts over time without an intentional update may indicate data poisoning, tampering or changed input patterns, so model performance should be monitored like any other control.",
  "New AI-related operations content: monitor models for unexpected change and investigate it as a potential incident.")
f(C5, 'ops', 'Intrusion detection and prevention in the cloud',
  "Network and host based tools, plus provider-native threat detection, that identify and optionally block malicious activity; virtual appliances and traffic mirroring supply the visibility physical taps once gave.",
  "Encrypted traffic limits network inspection; host and identity telemetry fill the gap.")
f(C5, 'ops', 'Service management and continual improvement',
  "Operations practices from frameworks such as ITIL and ISO/IEC 20000 (incident, problem, change, release, configuration and availability management) feed continual service improvement.",
  "Security operations must integrate with these processes, not sit beside them.")
f(C5, 'ops', 'Incident communication and breach notification',
  "A communication plan names who informs executives, legal counsel, regulators, customers and the provider, with timelines driven by law and contract.",
  "Legal and compliance teams decide what is disclosed and when; technical staff do not improvise public statements.")
f(C5, 'ops', 'Multi-cloud monitoring and incident response',
  "Operating across several providers requires a normalized log schema, centralized detection, consistent identity and runbooks that account for each provider's tools and evidence limits.",
  "A stated emphasis of the newer outline: tool sprawl and inconsistent visibility are the main risks.")

# ---- questions: Domain 5
mc(C5, 'ops', "A cloud account is suspected to be compromised, but the team finds the management-plane audit trail was never enabled. What is the MOST significant consequence?",
   "They cannot reliably reconstruct which identities made which changes",
   ["The provider will refuse to restore the account until a ticket has been opened", "All data in the account is automatically encrypted", "The attacker's activity is automatically blocked"],
   "Management-plane logging records who did what through the console and APIs; without it, reconstruction is guesswork. The other outcomes do not follow from missing logs.")
mc(C5, 'ops', "During an incident an engineer wants to power off a compromised virtual machine immediately. What should the team do FIRST to preserve evidence while limiting spread?",
   "Isolate the instance and snapshot its disks and memory before it is changed",
   ["Terminate the instance immediately so the attacker loses access to the host", "Reboot the instance to clear malicious processes", "Delete the instance's logs to avoid confusion"],
   "Isolation contains spread and snapshots preserve evidence. Terminating or rebooting destroys volatile evidence, and deleting logs destroys what is needed.")
mc(C5, 'ops', "A team collected disk images from a compromised server but did not record who handled them. What is the MOST significant problem?",
   "The broken chain of custody may make the evidence inadmissible",
   ["The images will fail to boot on a standard forensic analysis workstation", "The images cannot be hashed", "The images cannot be compressed"],
   "Chain of custody documents handling and proves integrity. The other concerns are technical details unrelated to admissibility.")
mc(C5, 'ops', "Which item should be collected FIRST in a live cloud forensic investigation, according to the order of volatility?",
   "Memory contents and running process information",
   ["Archived backup media", "Remote log archives", "Printed network diagrams"],
   "Memory is the most volatile and is lost on stop or reboot. Backups and archived logs persist, and diagrams are documentation.")
mc(C5, 'ops', "A company runs workloads in three cloud providers and each provider's logs use a different format, so analysts miss related alerts. Which action BEST improves detection?",
   "Centralize logs in a SIEM with a normalized schema and consistent identity data",
   ["Have analysts log in to each provider's console daily", "Disable logging in the two providers whose log formats are the hardest to parse", "Rely only on each provider's built-in alerts"],
   "Normalization and centralization enable correlation across providers. Manual review does not scale, disabling logs removes visibility and separate alerts miss cross-cloud patterns.")
mc(C5, 'ops', "An alert shows a developer's credentials were used from two continents within ten minutes. What is the BEST immediate response?",
   "Revoke sessions and keys, require MFA again and investigate activity",
   ["Wait for a second alert to confirm the pattern", "Change the developer's job title in the directory", "Reduce log retention to lower storage costs while the investigation proceeds"],
   "Impossible travel indicates likely credential compromise; contain first by revoking access, then investigate. Waiting prolongs exposure and the other options do not address the risk.")
mc(C5, 'ops', "A security operations lead wants to reduce time to respond for a well-understood, low-risk alert that currently needs manual steps. Which approach is MOST appropriate?",
   "Automate the playbook with SOAR and keep analyst approval for high-impact actions",
   ["Replace the SIEM with a larger one", "Ignore this alert type", "Require every alert of this type to be escalated to the executive team for approval"],
   "SOAR automation speeds repeatable steps while keeping humans on risky decisions. A bigger SIEM does not automate response, ignoring alerts removes control and escalating everything overwhelms leadership.")
mc(C5, 'ops', "Which activity is the cloud customer's responsibility for a virtual machine running in IaaS?",
   "Patching the guest operating system",
   ["Patching the hypervisor", "Maintaining the provider's physical data center", "Updating the provider's storage firmware"],
   "In IaaS the customer manages everything above the virtualization layer. The other tasks belong to the provider.")
mc(C5, 'ops', "A configuration scan shows that several servers no longer match the approved baseline after emergency fixes. Which practice BEST reduces recurrence?",
   "Detect drift automatically and enforce changes through version-controlled templates",
   ["Allow all engineers to modify servers directly whenever they judge a change necessary to restore service quickly", "Delete the baseline and rely on memory", "Disable the scans to reduce noise"],
   "Drift detection plus templates keeps configurations governed. Free manual changes create drift and removing the baseline removes the standard.")
mc(C5, 'ops', "A machine learning model that approves transactions begins behaving differently without any approved update, and recent training data included unreviewed external sources. How should the security team treat this?",
   "As a potential security incident involving tampering or poisoning, to be investigated",
   ["As normal variation that needs no action", "As evidence that one of the provider's data centers has suffered a hardware failure", "As a licensing issue for the vendor to resolve"],
   "Unexplained model change can indicate poisoning or tampering. Ignoring it risks fraud, and neither data center failure nor licensing explains it.",
   "Model drift as a security incident is called out in the revised outline.")
mc(C5, 'ops', "Which statement about incident response in the cloud is MOST accurate?",
   "Preparation, including logging and provider contacts, must be done before an incident because evidence may be ephemeral",
   ["The provider alone investigates all incidents on the customer's behalf", "Incident response begins when the incident is declared closed", "Logs can always be reconstructed after the fact"],
   "Because resources are ephemeral and access depends on contracts, readiness comes first. The provider does not run the customer's response and logs not collected may be gone.")
mc(C5, 'ops', "A regulator will be notified of a breach affecting customers. Who should decide the exact content and timing of the external statement?",
   "Legal and compliance leadership with incident command input",
   ["The on-call engineer who found the issue and has the most technical detail", "The marketing team alone", "The cloud provider's help desk"],
   "Disclosure carries legal obligations, so legal and compliance lead with technical facts from the response team. Single engineers or marketing lack the authority and providers do not speak for the customer.")
mc(C5, 'ops', "Which control gives continuous detection of publicly exposed storage and unencrypted databases across many cloud accounts?",
   "Cloud security posture management",
   ["A hardware security module", "A VPN gateway", "A tape backup system for archival data"],
   "CSPM continuously evaluates configuration against policy. An HSM, VPN gateway and tape backups do not assess configuration.")
mc(C5, 'ops', "A team monitors alert counts and reports that more alerts means better security. What is the BEST critique?",
   "Volume does not measure effectiveness; time to detect and respond does",
   ["Alert counts are the only valid metric", "Fewer logs always mean better security", "Metrics should never be reported to leadership because they cause unnecessary concern"],
   "Effectiveness is shown by outcomes such as detection and response times. Counts alone may reflect noise, and metrics support leadership oversight.")
ms(C5, 'ops', "Which TWO actions improve the integrity of logs used for investigations? (Choose two.)",
   ["Forward logs to a central store the source system cannot modify", "Synchronize clocks across systems"],
   ["Store logs only on the system that produced them", "Allow administrators to edit entries freely", "Delete old logs weekly to save cost"],
   "Central tamper-resistant storage and consistent time make logs trustworthy. Local-only logs and editable entries can be altered, and weekly deletion destroys evidence.")
ms(C5, 'ops', "Which TWO are typical challenges of forensics in the cloud? (Choose two.)",
   ["Ephemeral resources may disappear before evidence is collected", "Access to underlying hardware and some logs depends on the provider"],
   ["Customers always have physical access to the servers", "All evidence is stored on the customer's laptop", "Multi-tenancy never affects evidence handling"],
   "Short-lived resources and provider-held evidence limit collection. Customers do not have physical access, and multi-tenancy complicates evidence handling.")
ms(C5, 'ops', "Which THREE are sound preparation activities for cloud incident response? (Choose three.)",
   ["Enable and centralize management-plane and workload logging", "Set up a pre-approved isolated account for forensic analysis", "Agree evidence and escalation procedures with the provider"],
   ["Wait until an incident to decide who is in charge", "Disable alerts to reduce noise before audits"],
   "Logging, an isolated analysis environment and agreed provider processes are preparation. Improvising authority and disabling alerts are not.")
ms(C5, 'ops', "Which TWO inputs belong to threat hunting rather than reactive alert triage? (Choose two.)",
   ["A hypothesis that an attacker is abusing a particular cloud role", "Searching across logs for unusual behavior not tied to any alert"],
   ["Closing a ticket generated by a known false positive", "Applying a vendor patch announced last month"],
   "Hunting is proactive, hypothesis-driven searching. Closing known alerts and patching are routine operations.")
tf(C5, 'ops', "Terminating a compromised cloud instance is always the best first step because it ends the attacker's access.", False,
   "Isolate and capture evidence first; termination destroys volatile data and may lose the instance entirely.")
tf(C5, 'ops', "A SIEM is only useful if logs from relevant systems are collected and time-synchronized.", True,
   "Correlation depends on complete and consistently timed data.")
tf(C5, 'ops', "Change management applies only to production application code, not infrastructure configuration.", False,
   "Infrastructure and configuration changes carry risk and need controlled review and recording as well.")
tf(C5, 'ops', "The customer is responsible for patching the hypervisor in an IaaS service.", False,
   "The provider operates and patches the hypervisor; the customer patches guest systems.")
tf(C5, 'ops', "A documented chain of custody helps show that digital evidence has not been altered.", True,
   "It records every handling step from collection to presentation.")
tf(C5, 'ops', "Machine learning can assist threat hunting by highlighting anomalous behavior across large volumes of logs.", True,
   "ML helps identify patterns humans would miss, though results still need analyst validation.")
tf(C5, 'ops', "A cloud incident response plan can be developed after an incident because cloud providers keep all logs indefinitely.", False,
   "Providers retain logs only to their stated policies; customers must configure and retain their own.")
tf(C5, 'ops', "Persistent drift between running systems and the approved baseline is a security concern even if the systems work.", True,
   "Unreviewed change can open vulnerabilities and complicates investigations.")
tf(C5, 'ops', "Forensic readiness means collecting evidence only after an incident has been confirmed by the regulator.", False,
   "It means preparing logging, tools and agreements in advance so evidence is available when needed.")

# ---------------------------------------------------------------------------------------------------------------
# DOMAIN 6: Legal, Risk and Compliance (topic tag: legal)
# ---------------------------------------------------------------------------------------------------------------
f(C6, 'legal', 'General Data Protection Regulation (GDPR)',
  "The European Union's privacy regulation governing processing of personal data of people in the EU, with principles of lawfulness, purpose limitation, minimization, accuracy, storage limitation, integrity and confidentiality, and accountability.",
  "Applies by whom is affected, not only by where the company sits; fines can reach 4 percent of global annual turnover.")
f(C6, 'legal', 'Data subject rights',
  "Individuals can access, correct, erase, restrict, port and object to processing of their personal data, and the controller must be able to honor these requests, including from data held by processors.",
  "Design choices such as immutable stores and uncontrolled copies can make rights impossible to meet.")
f(C6, 'legal', 'Data residency and data sovereignty',
  "Residency is where data is physically stored; sovereignty is the principle that data is subject to the laws of the country where it is located or where its controller is based.",
  "Cloud replication and support access from other countries can move data across borders unnoticed.")
f(C6, 'legal', 'Cross-border transfer mechanisms',
  "Personal data may leave the EU only with a lawful mechanism: an adequacy decision, standard contractual clauses, binding corporate rules or a narrow exception, usually backed by a transfer impact assessment.",
  "Standard contractual clauses are the most common contract-based tool in cloud agreements.")
f(C6, 'legal', 'Standard contractual clauses (SCCs)',
  "Pre-approved contract terms that bind the importer of personal data outside the EU to provide equivalent protection, supplemented by assessment of the destination country's laws.",
  "Know when they are needed: transfers to a provider or sub-processor outside an adequate country.")
f(C6, 'legal', 'Data protection impact assessment (DPIA)',
  "A structured assessment of privacy risks for processing likely to result in high risk to individuals, such as large-scale profiling or new technologies, carried out before the processing starts.",
  "Often required for AI and analytics projects that use personal data at scale.")
f(C6, 'legal', 'Breach notification',
  "Many laws require notifying regulators and sometimes individuals within set deadlines; under GDPR the controller notifies the authority within 72 hours of becoming aware of a reportable breach, and processors must tell the controller without undue delay.",
  "The contract with the provider should set how fast the provider tells you.")
f(C6, 'legal', 'Government access and the US CLOUD Act',
  "The CLOUD Act allows US authorities to compel US-based providers to produce data they control regardless of where it is stored, which can conflict with foreign privacy and sovereignty rules.",
  "Customer-held keys and contractual challenge clauses are common mitigations.")
f(C6, 'legal', 'Sector-specific regulations',
  "Examples include HIPAA for US health information (with business associate agreements), the Payment Card Industry Data Security Standard for card data and Sarbanes-Oxley for financial reporting controls.",
  "Match the data type in the scenario to the regime; a processor handling protected health data needs a signed business associate agreement.")
f(C6, 'legal', 'Electronic discovery (eDiscovery)',
  "The process of identifying, preserving, collecting, reviewing and producing electronically stored information for litigation or investigation; ISO/IEC 27050 gives guidance.",
  "In cloud, ask where data is, how holds are applied, what the provider will produce and who bears the cost.")
f(C6, 'legal', 'Contract elements for cloud services',
  "Key clauses cover service levels, data ownership and location, security obligations, breach notification, audit and inspection rights, subcontracting, termination and data return and deletion, and liability.",
  "The contract is the main tool a customer has to turn provider promises into obligations.")
f(C6, 'legal', 'Right to audit and attestations',
  "Because customers rarely audit hyperscale providers directly, they rely on independent audit reports and certifications, and contracts may still reserve inspection rights.",
  "Read the scope of any report: it covers only the named services, locations and period.")
f(C6, 'legal', 'SOC 1, SOC 2 and SOC 3 reports',
  "SOC 1 addresses controls relevant to financial reporting; SOC 2 reports on security, availability, processing integrity, confidentiality and privacy criteria; SOC 3 is a general-use summary. Type I covers design at a point in time, Type II covers operating effectiveness over a period.",
  "A Type II SOC 2 is the stronger evidence; check scope, period and exceptions.")
f(C6, 'legal', 'ISO/IEC 27001, 27017 and 27018',
  "27001 certifies an information security management system; 27017 adds cloud-specific controls for providers and customers; 27018 covers protection of personal data in public clouds acting as processors.",
  "27001 is certifiable; 27017 and 27018 are guidance and control sets usually assessed alongside it.")
f(C6, 'legal', 'CSA STAR and Cloud Controls Matrix',
  "The Cloud Security Alliance Cloud Controls Matrix is a framework of cloud security controls; STAR is a public registry in which providers publish assurance, from a self-assessment (Level 1) to third-party audit or certification (Level 2).",
  "STAR gives a comparable, vendor-neutral way to review a provider before purchase.")
f(C6, 'legal', 'Risk management process and treatment options',
  "Identify assets and threats, assess likelihood and impact, then treat the risk by mitigating, transferring (for example insurance or contract), avoiding or accepting it, tracking the rest in a risk register.",
  "Risk is accepted by the business owner, not by the security team; cloud adoption transfers some duties but never accountability.")
f(C6, 'legal', 'Risk appetite and tolerance',
  "Appetite is the amount and type of risk an organization is willing to pursue; tolerance is the acceptable variation around objectives.",
  "Leadership sets appetite; security recommends controls that keep exposure within it.")
f(C6, 'legal', 'Vendor and third-party risk management',
  "Assess suppliers before onboarding (due diligence), contract for security obligations, monitor performance and evidence continuously and plan for exit, including risks from their own subprocessors.",
  "Due diligence is investigation before the decision; due care is acting responsibly afterwards.")
f(C6, 'legal', 'Governance, risk and compliance (GRC) and enterprise risk management',
  "Governance sets direction and accountability, risk management addresses uncertainty to objectives and compliance demonstrates adherence to laws and policy. ISO 31000 provides a general risk management framework.",
  "Cloud risk should feed the enterprise risk register rather than live in a separate silo.")
f(C6, 'legal', 'Shadow IT and its compliance impact',
  "Staff use unsanctioned cloud services outside IT's visibility, creating unmanaged data flows and compliance gaps.",
  "Discover through network and CASB telemetry, then offer approved alternatives rather than only blocking.")
f(C6, 'legal', 'Audit planning and cloud-specific audit challenges',
  "Define scope, objectives and evidence in advance; cloud adds limited physical access, shared responsibility, dynamic resources and reliance on provider reports, so audits depend on logs, APIs and automation.",
  "Continuous control monitoring with automated evidence suits a changing cloud estate.")
f(C6, 'legal', 'Privacy by design and by default',
  "Building privacy protections into systems from the start and defaulting to the most privacy-protective settings with minimal collection.",
  "A GDPR principle; the exam favors answers that embed controls early over bolting them on later.")
f(C6, 'legal', 'Cyber insurance and risk transfer',
  "Insurance transfers part of the financial impact of an incident but not the legal accountability or the reputational damage, and insurers often require baseline controls.",
  "A treatment option, never a substitute for controls.")
f(C6, 'legal', 'Supply chain and subprocessors',
  "A provider may depend on other companies to deliver the service. Customers need visibility of subprocessors, the right to object to changes and flow-down of security and privacy obligations; ISO/IEC 27036 addresses supplier relationships.",
  "Under GDPR the processor needs the controller's authorization to engage a subprocessor.")

# ---- questions: Domain 6
mc(C6, 'legal', "A European retailer uses a cloud provider whose support staff in another country may access personal data. Which mechanism BEST allows this transfer to be lawful if the country lacks an adequacy decision?",
   "Standard contractual clauses supported by a transfer impact assessment",
   ["A statement in the privacy policy that data may be transferred to other countries", "The provider's marketing assurance of high security", "Encrypting the data with a key the provider holds"],
   "SCCs with an assessment of destination laws are the standard contract-based safeguard. A policy statement alone is not a lawful mechanism, marketing is not a safeguard and provider-held encryption does not address legal access.")
mc(C6, 'legal', "A company is the controller of customer data and uses a SaaS processor. A breach occurs at the processor. Which statement is MOST accurate about accountability?",
   "The controller remains accountable to regulators and individuals, and the processor must notify the controller",
   ["Accountability transfers entirely to the processor", "No accountability exists for the controller because the processor suffered the breach", "Only the individuals affected are accountable"],
   "Outsourcing processing does not outsource accountability. The processor has duties to notify and assist, but the controller answers to regulators.")
mc(C6, 'legal', "An auditor asks for evidence that a SaaS provider's security controls operated effectively over the last year. Which report is MOST appropriate?",
   "SOC 2 Type II",
   ["SOC 2 Type I", "A self-published marketing white paper", "SOC 3 general-use summary"],
   "Type II tests operating effectiveness over a period. Type I examines design at a point in time, white papers are unverified and SOC 3 is a general summary without detailed testing.")
mc(C6, 'legal', "A customer wants a comparable public view of a provider's assurance before choosing between two vendors. Which resource is MOST suitable?",
   "The CSA STAR registry entries for each provider",
   ["The providers' social media accounts", "A competitor's sales brochure comparing the two providers", "An internal list of preferred vendors"],
   "STAR is a public registry with self-assessments and third-party attestations aligned to the Cloud Controls Matrix. Social media and brochures are unaudited and internal preference lists do not provide evidence.")
mc(C6, 'legal', "A processor of US health data is hosting records in the cloud. Which contractual document is typically REQUIRED between the covered entity and the provider?",
   "A business associate agreement",
   ["A non-compete agreement", "A software escrow agreement only", "A marketing co-branding agreement"],
   "Under HIPAA, providers handling protected health information as business associates must sign such an agreement. The other documents do not satisfy the requirement.")
mc(C6, 'legal', "A court order requires a company to produce emails stored in a cloud service. Which cloud-specific consideration is MOST important in the eDiscovery plan?",
   "Knowing where the data is held, how a legal hold is applied and what the provider will support",
   ["Whether the provider's marketing website has been redesigned in the last year", "The color scheme of the admin console", "The provider's number of employees"],
   "Location, hold mechanisms and provider support determine whether the company can preserve and produce data. The other facts are irrelevant.")
mc(C6, 'legal', "Management decides to buy cyber insurance to cover part of the financial loss from a major breach. How does this risk treatment BEST classify?",
   "Risk transfer, which does not remove accountability or the need for controls",
   ["Risk avoidance, because the risk no longer exists", "Risk acceptance, because no action is taken", "Risk mitigation, because the likelihood of a breach is reduced by the insurer"],
   "Insurance moves part of the financial impact to another party but leaves likelihood and legal accountability. Avoidance means stopping the activity, acceptance means retaining the risk and mitigation reduces likelihood or impact through controls.")
mc(C6, 'legal', "A department starts using a free file-sharing service to exchange customer data without telling IT. Which response is MOST appropriate?",
   "Discover the usage, assess the risk and offer an approved alternative",
   ["Ignore it because the department owns the data", "Terminate the employees immediately without any review of the business need", "Encrypt the service's servers on the department's behalf"],
   "Shadow IT should be discovered, risk-assessed and replaced with a sanctioned option. Ignoring leaves compliance gaps, summary dismissal ignores process and customers cannot encrypt another company's servers.")
mc(C6, 'legal', "A provider announces a new subprocessor in another jurisdiction. Which customer action is BEST?",
   "Review the subprocessor, exercise any right to object and reassess transfers",
   ["Accept it automatically because the provider has a strong reputation and certifications", "Cancel the contract without reading the terms", "Remove the provider's logo from the website"],
   "Contracts and GDPR give customers visibility and a say in subprocessors; review and reassess. Automatic acceptance and cancelling without review do not manage risk.")
mc(C6, 'legal', "What is the main difference between due diligence and due care?",
   "Due diligence is investigating before a decision; due care is acting responsibly to protect assets afterwards",
   ["Due diligence is the response taken after an incident, while due care happens before any incident", "They are legal terms with identical meanings", "Due care applies only to providers and due diligence only to customers"],
   "Diligence is the research performed up front, such as vendor assessment; care is the ongoing practice of protection. They are related but not identical and apply to both parties.")
mc(C6, 'legal', "A project plans to use customers' behavioral data to train a recommendation model at large scale. Which privacy activity is MOST appropriate before processing begins?",
   "Conduct a data protection impact assessment",
   ["Wait for a data subject complaint", "Delete all existing consent records before starting the project", "Publish the training dataset to the public"],
   "Large-scale profiling is the type of high-risk processing for which a DPIA is expected before it starts. The other options increase risk.",
   "AI and analytics projects often trigger a DPIA.")
mc(C6, 'legal', "A US provider receives a legal demand from its government for data stored in a European region belonging to a European customer. Which mitigation BEST limits the provider's ability to hand over readable data?",
   "Customer-held keys so the provider cannot decrypt the data",
   ["A larger service level agreement credit if the provider discloses data", "Moving the account to a cheaper pricing tier", "A longer password for the console"],
   "If the provider lacks the key, it cannot produce readable content. SLA credits, pricing tiers and passwords do not affect legal access.")
ms(C6, 'legal', "Which TWO items should be in a cloud service contract to protect the customer on exit? (Choose two.)",
   ["Data return in a usable format within a defined period", "Verified deletion of remaining copies including backups"],
   ["A clause preventing the customer from ever changing provider", "A provider right to keep copies for its own analytics", "Silence on data ownership"],
   "Return and verified deletion support reversibility. Lock-in clauses, provider retention for its own use and ambiguity work against the customer.")
ms(C6, 'legal', "Which TWO are reasons customers rely on third-party audit reports for cloud providers? (Choose two.)",
   ["Direct customer audits of large multi-tenant providers are usually impractical", "Independent reports give comparable evidence of control design and operation"],
   ["Providers are legally forbidden from being audited", "Reports remove the customer's compliance duties", "Reports are produced by the customer itself"],
   "Scale and multi-tenancy make direct audits impractical, and independent reports give assurance. Providers can be audited, customers retain obligations and independence means the reports are not self-produced.")
ms(C6, 'legal', "Which TWO risk treatments reduce the likelihood or impact of a risk through action rather than shifting or retaining it? (Choose two.)",
   ["Implementing additional security controls", "Stopping the risky activity altogether"],
   ["Buying insurance", "Documenting acceptance by the business owner", "Moving the risk to the provider by contract alone"],
   "Mitigation reduces the risk and avoidance removes the activity. Insurance and contracts transfer and documented acceptance retains it.")
ms(C6, 'legal', "Which TWO statements about GDPR are accurate? (Choose two.)",
   ["It can apply to a non-EU company processing personal data of people in the EU", "A processor must handle personal data only on the controller's documented instructions"],
   ["It applies only to companies headquartered in the EU", "It exempts companies that use cloud providers", "It forbids any transfer of personal data outside the EU"],
   "GDPR has extraterritorial reach and binds processors by controller instructions. It is not limited to EU headquarters, has no cloud exemption and permits transfers under lawful mechanisms.")
tf(C6, 'legal', "A SOC 2 Type I report describes how controls operated effectively over a period of months.", False,
   "Type I covers design at a point in time; Type II covers operating effectiveness over a period.")
tf(C6, 'legal', "Moving to the cloud transfers accountability for compliance from the customer to the provider.", False,
   "The customer remains accountable even where the provider performs some controls.")
tf(C6, 'legal', "ISO/IEC 27018 provides guidance on protecting personal data in public clouds.", True,
   "It addresses providers acting as processors of personally identifiable information.")
tf(C6, 'legal', "Under GDPR a controller must notify the supervisory authority of a reportable breach within 72 hours of becoming aware.", True,
   "This is the statutory deadline unless the breach is unlikely to result in risk to individuals.")
tf(C6, 'legal', "A legal hold overrides normal retention schedules for relevant data.", True,
   "Deletion of potentially relevant data must be suspended until counsel releases the hold.")
tf(C6, 'legal', "CSA STAR Level 1 is a third-party certification performed by an independent auditor.", False,
   "Level 1 is a self-assessment; third-party audit or certification is Level 2.")
tf(C6, 'legal', "Risk acceptance should be decided and documented by the business owner of the affected asset.", True,
   "Security advises, but the owner with authority over the business impact accepts residual risk.")
tf(C6, 'legal', "Pseudonymized personal data is outside the scope of GDPR.", False,
   "Because the data can be re-identified with additional information, it remains personal data.")
tf(C6, 'legal', "Data residency and data sovereignty refer to exactly the same concept.", False,
   "Residency is where data is stored; sovereignty concerns which country's laws govern it.")

# ---------------------------------------------------------------------------------------------------------------
# Export FLASHCARDS and QUESTIONS (topic tags stripped) and helpers for the lessons
# ---------------------------------------------------------------------------------------------------------------
FLASHCARDS = [{k: v for k, v in c.items() if k != 'topic'} for c in _FC]
QUESTIONS = [{k: v for k, v in q.items() if k != 'topic'} for q in _QS]


def _vocab(topics, n=8):
    ids = [c['id'] for c in _FC if c['topic'] in topics]
    return ids[:n]


def _quiz(topics, mcs=3, mss=1, tfs=1, extra=1):
    pool = [q for q in _QS if q['topic'] in topics]

    def spread(kind, count):
        items = [q['id'] for q in pool if q['type'] == kind]
        if count >= len(items):
            return items
        step = len(items) / count
        return [items[int(i * step)] for i in range(count)]

    chosen = spread('mc', mcs) + spread('ms', mss) + spread('tf', tfs)
    rest = [q['id'] for q in pool if q['type'] == 'mc' and q['id'] not in chosen]
    return chosen + rest[-extra:] if extra else chosen


LESSONS = [
    {
        'id': 'cloud-foundations-shared-responsibility',
        'title': 'Cloud Foundations and Shared Responsibility',
        'summary': 'What makes something cloud, the service and deployment models, who is responsible for what, and the emerging technologies (AI, confidential computing) the newer outline folds in.',
        'diagram': None,
        'vocabIds': _vocab(['found'], 9),
        'quizIds': _quiz(['found'], 3, 1, 1, 1),
        'reading': """Cloud computing is a way of renting computing power instead of owning it. The formal definition used by the exam, from NIST, names five essential characteristics: on-demand self-service (you provision resources yourself, without filing a ticket), broad network access, resource pooling, rapid elasticity and measured service. If a vendor hosts a server for you but you must phone them to resize it and pay a flat monthly fee, that is hosting, not cloud. The characteristic that most shapes security is resource pooling, because it produces multi-tenancy: many customers sharing the same physical machines, separated only by software. Isolation between tenants is therefore a cornerstone of cloud security and a favorite exam topic.

Cloud services come in three service models that differ in how much of the technology stack the provider runs for you. In infrastructure as a service you get virtual machines, storage and networks and manage everything from the guest operating system upward. In platform as a service the provider also runs the operating system and runtime, and you bring only your application and data. In software as a service you simply use a finished application. As you move from infrastructure to software, the provider takes over more of the stack and you give up control. That trade is the heart of the shared responsibility model: the provider secures the cloud itself (facilities, hardware, hypervisor, core services) and the customer secures what they put in the cloud and how they configure it. The line moves with the service model, but a few things never move. Data, identities and access decisions, and the choice of settings are always the customer's, and accountability to regulators cannot be handed to anyone.

Deployment models describe who owns and shares the environment. A public cloud is open to many customers. A private cloud serves one organization. A hybrid cloud binds two different models together so workloads and data can move between them, and a community cloud is shared by organizations with a common concern, such as the same regulator. Multi-cloud is a different idea altogether: using more than one provider.

Architects also weigh vendor lock-in. Portability, interoperability and reversibility are the properties that keep an exit possible, and the ISO/IEC 17789 cross-cutting aspects (auditability, availability, governance, privacy, regulatory, resiliency, security, service levels and more) act as a checklist of things to consider before adopting any service.

The outline also asks how newer technologies change the picture. Artificial intelligence and machine learning make training data, models and prompts into assets to classify and protect, and the customer keeps responsibility for them even on a fully managed service. Confidential computing protects data in use by running code inside a hardware-based trusted execution environment. Quantum computing threatens today's public-key algorithms, which is why architects favor crypto agility. Underlying all of this are three design principles to reach for in almost any scenario: defense in depth, least privilege and zero trust, in which identity rather than network location decides who gets in.""",
        'fundamentalsLabel': 'New to cloud security? See the everyday analogy',
        'fundamentals': "Think of renting an apartment in a large building. The landlord looks after the structure, the locks on the front door, the elevators and the fire alarms; you decide who gets a key to your flat and what you keep inside. If you leave your door unlocked, the landlord's excellent building security does not help you. The more furnished and serviced the apartment (the move from bare unit to hotel suite), the more the landlord handles, but you never hand over the question of who you let in or what you store. Other tenants share the walls and the plumbing, which is multi-tenancy, so the quality of the soundproofing between units matters. That is the shared responsibility model and the reason isolation is always on the exam.",
        'keyTerms': ['NIST essential characteristics', 'Multi-tenancy', 'IaaS, PaaS and SaaS', 'Shared responsibility model', 'Hybrid versus multi-cloud', 'Vendor lock-in and reversibility', 'Confidential computing', 'Zero trust'],
        'commonTraps': [
            "Hybrid cloud binds different deployment models together; using two public providers is multi-cloud, and the exam deliberately blurs the two.",
            "Moving up the stack toward SaaS shifts operating duties to the provider but never shifts accountability for data, identities or compliance.",
            "A brokered or resold service is still your accountability: a cloud service broker adds value but does not take on your legal duties.",
            "Elasticity means automatic scaling in both directions; a manual upgrade to a bigger instance is only scalability.",
            "Encryption in transit and at rest do not protect data in use; confidential computing is the answer when the stem asks about processing.",
        ],
        'scenario': "A retailer migrates its order system from a managed hosting contract to a public cloud and a handful of software-as-a-service tools. The CIO assumes security is now the provider's job and cancels the quarterly access review. Six months later a former contractor's account, still active in a SaaS tool, is used to download customer lists. The provider's platform was never breached; the failure sat on the customer's side of the line, which is exactly where the model says identity and data decisions live.",
        'onTheJob': "Start every cloud project by building a responsibility matrix for the specific services you intend to use, because the split differs by service and even by feature. Most providers publish one, but translate it into named owners and controls on your side. Keep an exit plan alive: know where your data would go, in what format, and how long it would take. And treat identity as your perimeter: most real-world cloud compromises begin with a stolen credential or an overly permissive role, not with a defeat of the provider's hypervisor.",
    },
    {
        'id': 'data-lifecycle-classification-dlp',
        'title': 'Data Lifecycle, Classification and Loss Prevention',
        'summary': 'Where data lives, how it is classified and handled across the life cycle, and the controls that stop it leaking: discovery, DLP, IRM, masking and secure deletion.',
        'diagram': None,
        'vocabIds': _vocab(['life'], 9),
        'quizIds': _quiz(['life'], 3, 1, 1, 1),
        'reading': """Data security begins with a simple question that many organizations cannot answer: what data do we have and where is it? The cloud data life cycle gives a structure for the answer. Data is created, stored, used, shared, archived and finally destroyed, and a different control matters most at each stage. At creation you classify the data and assign an owner. While stored it needs encryption and access control. While used it needs monitoring and rights management. When shared, it needs protection that follows it. At the end it needs retention rules, legal holds respected and verified destruction.

Classification is the keystone. It means labeling data by sensitivity and business impact, for example public, internal, confidential and restricted, so that handling rules follow from the label. The data owner, a person in the business who is accountable for the data, decides the classification; custodians such as the IT team and the cloud provider apply the controls. Before you can classify, you must discover: scanning storage, databases and files for sensitive content using patterns, labels and increasingly machine learning.

Once data is found and labeled, two families of control keep it in bounds. Data loss prevention watches data as it moves and blocks policy violations, such as card numbers leaving through a personal cloud account. Information rights management, by contrast, attaches protection to the file itself so that it can be opened only by permitted people and can be revoked after sharing. The difference matters on the exam: if the stem asks how to retain control after a document has left your environment, think IRM; if it asks how to stop sensitive content leaving, think DLP.

Not all copies of data need the real values. Masking replaces sensitive fields with realistic fake ones, which is ideal for test environments. Anonymization removes the link to a person irreversibly, so the data is no longer personal data; pseudonymization replaces identifiers but keeps a way back, so privacy law still applies. Tokenization, covered in the next lesson, swaps values for random tokens that point at a vault.

Retention and destruction deserve respect because they are where cloud differs most. Keep data too long and you enlarge breach and discovery exposure; delete too early and you violate regulations or a legal hold, which suspends normal deletion when litigation is likely. In the cloud you cannot degauss or shred the provider's disks, so the accepted answer for guaranteeing deletion is cryptographic erasure: encrypt the data with keys you control and destroy every copy of the key.

Finally, the newer outline adds data lakes and training datasets to the picture. A large central repository of mixed data needs fine-grained access control and lineage records, and a dataset used to train models needs integrity protection too, because a poisoned input quietly corrupts every model built from it. Always map data flows so you know which regions, providers and sub-processors touch the data, since privacy law attaches to those paths.""",
        'fundamentalsLabel': 'New to data security? See the everyday analogy',
        'fundamentals': "Picture the paper records of a large hospital. Someone has to decide which files are routine and which are highly sensitive, and mark them accordingly; that is classification. Staff walk through the building to find forgotten files in corridors and cupboards; that is discovery. Guards at the exit check bags for stray patient files; that is data loss prevention. A special folder that, once handed to another clinic, can still be locked remotely by the hospital is rights management. Old records follow a schedule for how long they must be kept and are then shredded, unless a lawyer places a hold on them. In the cloud you cannot watch the shredder, so you lock the records in a safe and destroy the only key.",
        'keyTerms': ['Data life cycle', 'Data classification', 'Data discovery', 'Data owner and custodian', 'DLP', 'IRM', 'Legal hold', 'Crypto-shredding', 'Pseudonymization'],
        'commonTraps': [
            "Discovery comes before classification, and classification comes before DLP rules and encryption choices: the exam punishes answers that skip ahead.",
            "Pseudonymized data is still personal data under privacy law; only effective anonymization takes it out of scope.",
            "IRM travels with the file and can be revoked; DLP only governs egress, so it cannot reclaim a document that already left.",
            "Logical deletion or a console delete does not prove physical erasure in a shared platform; cryptographic erasure is the standard answer.",
            "A legal hold overrides retention schedules and auto-delete rules, even when storage cost or policy says delete.",
        ],
        'scenario': "A healthcare analytics company copies production patient records into a test environment for a developer. A bucket in the test account is accidentally made public and the records are exposed. The team had neither discovered where copies of the data lived nor masked non-production copies. The better design would have discovered and labeled the data, applied irreversible masking for test use, enforced a guardrail against public buckets and logged access to sensitive stores.",
        'onTheJob': "Run discovery before you buy a DLP product: tune policies on real findings, not vendor templates, and start in monitor mode to learn the false positive rate. Tag resources and data consistently at creation, since policy automation depends on the tag. Keep a living data-flow map, because every audit, privacy request and incident begins with the question of where the data went. And keep deletion honest: set expiry on object stores, test that legal holds really stop it, and document the keys you destroyed.",
    },
    {
        'id': 'encryption-keys-tokenization',
        'title': 'Encryption, Key Management and Tokenization',
        'summary': 'Encrypting data at rest, in transit and in use; envelope encryption and KMS; BYOK, HYOK and HSMs; tokenization, hashing, secrets and crypto agility.',
        'diagram': None,
        'vocabIds': _vocab(['crypto'], 9),
        'quizIds': _quiz(['crypto'], 3, 1, 1, 1),
        'reading': """Encryption in the cloud is easy to switch on and easy to get wrong, because the hard part is not the algorithm but who holds the keys. Start with the three states of data. Data at rest sits in storage and is protected with volume, database or object encryption. Data in transit moves across a network and is protected by Transport Layer Security, with TLS 1.3 the current version and legacy protocols disabled. Data in use is being processed in memory, where traditional encryption cannot reach, and is protected by confidential computing or, in specialized cases, homomorphic encryption. A complete design addresses all three, and exam questions usually ask you to match a control to the state of the data in the stem.

Symmetric encryption uses one shared secret and is fast, so it protects bulk data. Asymmetric encryption uses a public and private key pair and is slower, so it is used to exchange keys, sign data and prove identity. Real systems combine the two in envelope encryption: a data encryption key encrypts the data, and a key encryption key, held in a key management service, encrypts the data key. Because only the small data key is wrapped, you can rotate or revoke access for huge volumes by changing the key encryption key. It is also why destroying that key makes the data unrecoverable, the basis of cryptographic erasure.

Key custody is where judgement questions live, and it comes in tiers. With provider-managed keys the provider creates and operates everything. With customer-managed keys you control the policies, rotation and the ability to disable the key, while the provider's service still performs the cryptography. With bring your own key you generate the key material yourself and import it into the provider's key service or HSM, retaining a copy and the power to withdraw it. With hold your own key, the key never enters the provider's environment, for example it lives in an on-premises hardware security module, so the provider cannot decrypt at all, at the cost of availability and some features. Choose by asking who must be unable to read the data: if the answer includes the provider, only hold your own key meets the bar.

A hardware security module is a tamper-resistant device that generates and stores keys and performs operations without exposing them, validated against standards such as FIPS 140. Secrets such as API keys and passwords belong in a secrets manager and are injected at run time, never hard-coded in code or container images.

Tokenization and hashing solve different problems. Tokenization replaces a sensitive value with a random token and keeps the real value in a vault, so systems holding only tokens fall out of compliance scope, which is why it is common for payment card data. Hashing is one-way and verifies integrity; with a private key it becomes a digital signature that proves origin and non-repudiation. Public key infrastructure binds public keys to identities through certificates, whose renewal and revocation must be automated to avoid outages. Finally, plan for crypto agility so algorithms can be replaced without redesign, since quantum computing will eventually weaken today's public-key schemes and adversaries may already be collecting data to decrypt later.""",
        'fundamentalsLabel': 'New to encryption? See the everyday analogy',
        'fundamentals': "Imagine shipping valuables in a locked box. The box is the encrypted data, and the lock is only as good as the story of who has the key. Provider-managed keys are like leaving the key with the courier. Customer-managed keys are like holding the courier's key log and being able to cancel it. Bring your own key means you cut the key yourself and hand a copy to the courier's safe, keeping the right to demand it back. Hold your own key means the courier never sees a key at all; the box can only be opened in your own office. Envelope encryption is a small key locked inside a master safe, so changing one master lock protects every box at once. Tokenization is swapping the valuables for a numbered ticket that is worthless unless you visit the vault.",
        'keyTerms': ['Data at rest, in transit and in use', 'Envelope encryption', 'KMS', 'HSM', 'BYOK', 'HYOK', 'Tokenization', 'Key lifecycle', 'Crypto agility'],
        'commonTraps': [
            "BYOK is not HYOK: with BYOK the key lives in the provider's service and the provider can use it; only HYOK keeps it out of reach.",
            "TLS protects data in transit only; it does nothing for data at rest or in use.",
            "Hashing is not encryption: it is irreversible, so it cannot protect data that must later be read.",
            "Tokenization removes the real value from most systems; it does not make a token a lightweight encryption of the value.",
            "Storing a key in the same account or repository as the data it protects defeats key separation.",
        ],
        'scenario': "A fintech stores customer ledgers in a public cloud and must satisfy a regulator who insists that the provider be unable to read the data. The architect proposes provider-managed keys with frequent rotation. The compliance officer rejects it because the provider can still decrypt. The final design keeps keys in an on-premises HSM, accepts the extra latency and plans for failure by replicating the HSM, because losing the only key would be as damaging as a breach.",
        'onTheJob': "Choose the weakest key-custody model that still satisfies the actual requirement, because stronger custody costs availability, features and operations effort. Whatever model you choose, test key recovery and the full outage case; key loss is a self-inflicted data loss. Automate certificate and key rotation and alert on expiry. Treat the key management service's own audit log as a first-class log source, since a spike in decrypt calls is often your earliest sign of a stolen role.",
    },
    {
        'id': 'secure-infrastructure-virtualization',
        'title': 'Securing Cloud Infrastructure, Virtualization and Containers',
        'summary': 'Hypervisors, multi-tenancy, containers and Kubernetes, serverless, virtual networks and micro-segmentation, the management plane, and secure data center design.',
        'diagram': None,
        'vocabIds': _vocab(['infra'], 9),
        'quizIds': _quiz(['infra'], 3, 1, 1, 1),
        'reading': """The cloud is built on virtualization, so the first job of an infrastructure security architect is to understand the isolation boundaries. A hypervisor allows many virtual machines to share one physical host. A bare-metal (Type 1) hypervisor runs directly on the hardware and is what cloud platforms use. Isolation between tenants rests on the hypervisor, and the signature attack is a virtual machine escape, where code in one guest reaches the hypervisor or a neighbor. Shared hardware also leaks through side channels and noisy-neighbor effects. The provider patches and hardens the hypervisor; the customer's levers are choosing dedicated hosts for very sensitive workloads, applying quotas and, where available, using confidential computing so that even the host cannot see memory.

Containers are lighter than virtual machines because they share the host's operating system kernel and are separated only by namespaces and control groups. That makes them fast and dense but a weaker isolation boundary. Security therefore focuses on what goes into the container and how the cluster is governed: build from minimal trusted images, scan them for vulnerabilities and embedded secrets, sign them and let the cluster admit only approved images from a trusted registry. In Kubernetes, secure the API server, apply least-privilege role-based access control to people and service accounts, restrict traffic between pods with network policies, enforce pod security standards and keep an audit log. An exposed dashboard or an over-privileged service account is the classic breach path.

Serverless functions remove the servers entirely, so there is no operating system for the customer to patch. The risks shift to what remains: over-privileged function roles, injection through event inputs, vulnerable dependencies and thin visibility. The remedy is the same principle again, least privilege per function.

Networks in the cloud are software defined and live inside virtual private clouds divided into subnets. Security groups are stateful rules attached to workloads, while network access control lists are stateless rules at the subnet edge. The architecture to prefer puts data stores in private subnets with no internet route, exposes only a load balancer or gateway, and uses micro-segmentation to restrict traffic between tiers so that a compromised host cannot roam. Private links and private endpoints keep service traffic off the public internet, though remember that private does not automatically mean encrypted. For remote users, zero trust network access grants per-application sessions instead of dropping them on the whole network, and distributed denial of service protection absorbs floods.

The management plane, meaning the console, command-line tools and programming interfaces that create and delete resources, is the highest-value target in any account. Protect it with multi-factor authentication, just-in-time privilege and a tamper-resistant audit log. Pair that with immutable infrastructure, where servers are replaced rather than modified, and infrastructure as code that is scanned for misconfiguration before it deploys.""",
        'fundamentalsLabel': 'New to virtualization? See the everyday analogy',
        'fundamentals': "A large office building rents floors to different companies. Virtual machines are lockable suites on a floor, each with its own walls and door. Containers are open-plan desks on the same floor with partition screens: cheaper and quicker to set up, but a loud neighbor is closer and the partitions are thinner. Serverless is hot-desking by the hour, with nothing to maintain. The building's master control panel, where tenants can request and cancel space, is the management plane; if a thief gets that panel, every floor is at risk. Micro-segmentation is locking the doors between departments rather than trusting that anyone inside the lobby belongs everywhere.",
        'keyTerms': ['Hypervisor', 'VM escape', 'Container isolation', 'Image scanning', 'Serverless', 'Security groups and ACLs', 'Micro-segmentation', 'ZTNA', 'Management plane'],
        'commonTraps': [
            "Containers share a kernel, so they are lighter but less isolated than virtual machines; do not assume equal isolation.",
            "In serverless the provider patches the host, but the customer still owns function permissions, code and dependencies.",
            "Security groups are stateful and attach to workloads; network ACLs are stateless and attach to subnets.",
            "A private network link is not automatically encrypted, so confidentiality in transit still needs a control.",
            "Compromise of management-plane credentials is far worse than compromise of a single workload; protect it first.",
        ],
        'scenario': "A software company moves a customer-facing platform to Kubernetes. A scan shows the cluster dashboard is reachable from the internet, a base image is two years old and a single service account has cluster-wide permissions. The security architect closes public access to the control plane, enforces image signing and scanning at admission, replaces the service account with narrowly scoped roles and adds network policies so that a breach of the web tier cannot reach the database pods.",
        'onTheJob': "Spend your first effort on identity and the management plane, then on exposure (what is reachable from the internet), then on workload hardening. Automate the checks: scan images and templates in the pipeline, and run posture checks against live accounts so that drift gets flagged. Document which workloads truly need VM-level isolation, since many teams default to containers for everything and discover the limits only during an audit. And capture network flow logs from day one, because you cannot turn them on retroactively after an incident.",
    },
    {
        'id': 'resilience-bcdr-risk',
        'title': 'Resilience, BCDR and Cloud Risk Analysis',
        'summary': 'Business impact analysis, RTO and RPO, availability zones and regions, disaster recovery strategies, backups and testing, and risk analysis for cloud designs.',
        'diagram': None,
        'vocabIds': _vocab(['resil'], 9),
        'quizIds': _quiz(['resil'], 3, 1, 1, 1),
        'reading': """Business continuity and disaster recovery planning answers a plain question: when something goes wrong, how fast must we recover and how much can we afford to lose? Business continuity keeps critical functions running through a disruption; disaster recovery restores information technology systems after a disaster; together they are called BCDR. Everything begins with a business impact analysis. The analysis ranks processes by how much harm their loss does over time and produces two numbers for each. The recovery time objective is how long the service may be down. The recovery point objective is how much data may be lost, measured as time. A bank might need a recovery time of minutes and a recovery point of seconds for payments, and hours and a full day for an internal reporting tool. A third number, the maximum tolerable downtime, is the ceiling beyond which the harm becomes unacceptable, and the recovery time must sit below it.

The order matters. Recovery objectives come from the business impact analysis and only then do you choose technology. A frequent wrong answer on the exam picks a favorite product first. Tighter objectives cost more: a smaller recovery point demands more frequent replication or backup, and a smaller recovery time demands more automation and standby capacity. Replication itself has a trade-off. Synchronous replication confirms writes in both places before acknowledging, so loss is near zero but latency rises and distance is limited. Asynchronous replication acknowledges first and copies afterwards, which performs better across regions but can lose the last few writes.

Cloud makes resilience a design choice rather than a purchase. A region is a geographic area, and availability zones are isolated groups of data centers inside it. Spreading a workload across zones survives the failure of a facility; spreading across regions survives a regional disaster but must respect any residency rules about where data may live. The recovery strategies run from cheap and slow to expensive and fast: backup and restore, pilot light with a minimal core running, warm standby with a scaled-down copy, and active-active with full capacity in more than one place. The right answer is the cheapest option that meets the stated recovery time and recovery point.

Backups deserve their own care. Keep copies in a separate account or logical domain from production credentials, make at least some of them immutable so ransomware or an attacker cannot delete them, and test restores regularly. A backup that has never been restored is an assumption.

Risk analysis sits alongside all of this. For a cloud design, identify assets, threats and vulnerabilities, estimate likelihood and impact and choose a treatment. Characteristic cloud risks include loss of governance and visibility, failure of tenant isolation, insecure interfaces, compromise of the management plane and vendor lock-in. The asset owner, not the security team, accepts whatever residual risk remains.""",
        'fundamentalsLabel': 'New to disaster recovery? See the everyday analogy',
        'fundamentals': "Consider a restaurant planning for a kitchen fire. How long can it stay closed before the owner loses the business is the maximum tolerable downtime. How fast they promise to reopen, perhaps in a rented kitchen across town, is the recovery time. How many orders the system can forget is the recovery point: if orders are written on a pad and photographed every five minutes, up to five minutes of orders could be lost. Having a rented kitchen idle and fully stocked is an active site and costs a lot; having the contract for one but no ingredients is cheaper but slower. And the plan is worthless until the staff has actually practiced cooking there.",
        'keyTerms': ['BIA', 'RTO', 'RPO', 'Maximum tolerable downtime', 'Availability zone and region', 'Pilot light and warm standby', 'Active-active', 'Immutable backup', 'Cloud risk analysis'],
        'commonTraps': [
            "RTO is time to restore service; RPO is acceptable data loss: candidates swap them under pressure.",
            "Pick the cheapest strategy that meets the stated objectives; the most resilient answer is often too costly to be correct.",
            "Multiple availability zones do not protect against a regional disaster, and multiple regions can violate residency rules.",
            "A successful backup job is not evidence of recoverability; only a restore test is.",
            "Recovery objectives come from the business impact analysis, not from the technology team's preference.",
        ],
        'scenario': "An online insurer runs its claims system in one availability zone and takes nightly backups to the same account that holds production administrator credentials. A ransomware incident encrypts both production and the backup repository. The leadership had never defined recovery objectives through a business impact analysis. A better design would have set objectives with the business, replicated across zones, kept immutable backups separate from production credentials and rehearsed a full restore.",
        'onTheJob': "Make the business owners sign the recovery targets; they will be far more realistic about cost once they see the price of a recovery time of minutes. Schedule restore tests the same way you schedule patching, and record the actual time and data loss so the numbers in your plan are measurements. Include dependencies such as identity, DNS, certificates and keys in the plan; many failovers stall because the key service or identity provider was single-region. And write the communication plan, because the first hour of a real event is mostly about who tells whom what.",
    },
    {
        'id': 'secure-sdlc-apis-iam',
        'title': 'Secure Development, APIs and Identity for Cloud Applications',
        'summary': 'Secure SDLC and DevSecOps, threat modeling, testing types, supply chain and API security, AI application risks, and identity federation, MFA and privileged access.',
        'diagram': None,
        'vocabIds': _vocab(['app', 'iam'], 9),
        'quizIds': _quiz(['app', 'iam'], 3, 1, 1, 1),
        'reading': """Cloud applications change quickly, so security has to be built into the process that produces them rather than inspected at the end. A secure software development life cycle places security activities in every phase: requirements define security needs, design includes threat modeling, coding follows secure standards, testing includes security tests, and deployment and maintenance include monitoring and patching. DevSecOps carries this into continuous integration and delivery, where automated scans act as gates and policy as code replaces slow manual sign-off. The principle to remember is shifting left: a flaw found in design costs a conversation, and the same flaw in production costs an incident.

Threat modeling is the design-time activity to know best. Draw how data flows through the system, mark the trust boundaries and ask what could go wrong at each. STRIDE gives a vocabulary: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service and Elevation of privilege. Testing then verifies the design. Static analysis reads code without running it; dynamic analysis attacks a running application from outside; interactive testing instruments it from within; software composition analysis finds known vulnerabilities in third-party libraries. Because most modern applications are largely third-party code, a software bill of materials and signed, provenance-checked build artifacts are now core controls against supply chain attacks.

Application programming interfaces deserve special attention because they are how cloud applications talk to each other and to the world. Authenticate every call, authorize each request against the specific object and action (broken object-level authorization is the leading API flaw), validate input against a schema, rate-limit, log, and keep an inventory so that forgotten or deprecated interfaces do not linger. A web application firewall helps as a compensating control, but it does not replace fixing the code. The root fix for injection is to treat all input as untrusted, validate it against an allow-list and use parameterized queries.

The newer outline adds the risks of applications built on large language models and other AI. Prompt injection, direct or hidden in retrieved content, can override instructions; defend by treating model output and retrieved text as untrusted, restricting what tools and data the model can reach, filtering inputs and outputs and keeping secrets out of prompts.

Identity ties it all together. Federation lets users authenticate once to an identity provider that issues signed assertions to many services, usually through SAML or OpenID Connect; OAuth 2.0 delegates authorization without sharing passwords and is not an authentication protocol by itself. Use multi-factor authentication, preferring phishing-resistant methods such as hardware keys or passkeys. Choose role-based access control for simplicity or attribute-based control for contextual decisions, remove standing privilege with just-in-time elevation, give workloads short-lived identities rather than static keys, and automate provisioning so leavers lose access everywhere.""",
        'fundamentalsLabel': 'New to secure development? See the everyday analogy',
        'fundamentals': "Building software is like building a house. An architect who checks the plans for weak points before construction (threat modeling) saves far more than an inspector who finds a missing support beam after the roof is on. Inspecting the bricks and the wood supplier's paperwork is software composition and supply chain checking; walking through the finished house testing the locks is dynamic testing. Identity is the key system: a single front-door key everyone shares is a disaster, so each person gets their own key that can be cancelled, visitors get temporary passes, and the master key is kept in a safe and signed out only when needed.",
        'keyTerms': ['Secure SDLC', 'STRIDE', 'SAST and DAST', 'SCA and SBOM', 'API authorization', 'Prompt injection', 'Federation and SSO', 'OAuth and OpenID Connect', 'Just-in-time access'],
        'commonTraps': [
            "OAuth 2.0 is authorization; authentication is added by OpenID Connect, and SAML is the enterprise web single sign-on alternative.",
            "A web application firewall is a compensating control, not a substitute for fixing vulnerable code.",
            "Threat modeling is a design-time activity; running it only before release finds structural flaws too late.",
            "Authenticated does not mean authorized: broken object-level authorization is an API flaw even when sign-in succeeded.",
            "Output from an AI model is untrusted input to whatever consumes it, not a trusted internal source.",
        ],
        'scenario': "A fintech launches a mobile app backed by public APIs and an AI assistant that summarizes account activity. A researcher shows that changing an account number in a request returns another customer's transactions, and that a crafted payee name makes the assistant reveal other users' data. The remediation adds per-object authorization checks, schema validation and rate limiting, restricts the assistant's data access to the signed-in user, treats its output as untrusted and moves to short-lived workload identities for the back-end services.",
        'onTheJob': "Put the cheap checks in the pipeline first: secret scanning, dependency scanning and infrastructure-template scanning, tuned so that developers trust them. Reserve threat modeling for new features that cross trust boundaries and keep it lightweight, a whiteboard and a list of abuse cases. Inventory your APIs from gateway logs, not from documentation. For identity, look at service accounts and long-lived keys first, since they are usually the largest unmanaged privilege in the account, and make leaver deprovisioning something HR events trigger automatically.",
    },
    {
        'id': 'cloud-security-operations-ir',
        'title': 'Cloud Security Operations, Logging, Incident Response and Forensics',
        'summary': 'Logging and SIEM, posture and configuration management, patching, detection and hunting, the incident response life cycle, forensics and evidence handling in the cloud, and AI-related operations.',
        'diagram': None,
        'vocabIds': _vocab(['ops'], 9),
        'quizIds': _quiz(['ops'], 3, 1, 1, 1),
        'reading': """Security operations is the discipline of keeping the environment secure after it is built. It starts with visibility. Management-plane audit logs record who did what through the console and interfaces; flow logs record network connections; workload, application and identity logs fill in the rest. Send them to a central store that the source systems cannot alter, keep clocks synchronized and retain them long enough for legal and investigative needs. A security information and event management platform correlates those logs and raises alerts, and orchestration and automation tools turn repetitive responses into playbooks. The pairing to remember is that the SIEM detects while orchestration responds, and both are only as good as the data they receive.

Operations also means controlling change. Configuration management defines a secure baseline and detects drift from it, ideally by holding the baseline in version-controlled templates so that out-of-band edits are flagged. Cloud security posture management scans accounts continuously for misconfigurations such as public storage or open management ports, which cause far more breaches than exotic exploits. Change management reviews, approves, tests and records changes. Patching follows shared responsibility: in infrastructure as a service the customer patches guest operating systems and applications, and the provider patches the layers it operates.

When something does go wrong, incident response follows a life cycle: preparation, detection and analysis, containment, eradication and recovery, then lessons learned. NIST's current guidance, SP 800-61 Rev. 3, aligns these activities with the functions of the Cybersecurity Framework 2.0. Preparation is the phase that decides the outcome in the cloud, because resources are ephemeral, some logs belong to the provider and responsibilities are split. Enable logging, stage an isolated analysis account, agree evidence procedures and contacts with the provider and write playbooks before you need them. During containment, isolate rather than destroy: move an affected instance into a quarantine network, snapshot its disks and memory, revoke credentials and rotate keys. Powering off or terminating first destroys volatile evidence.

Digital forensics applies the same care to evidence. Collect in order of volatility, with memory and running processes before disks and archived logs, work on copies, hash evidence to prove integrity and keep a chain of custody that records every handler. Without it even a perfect analysis can be inadmissible.

The newer outline adds several themes. Machine learning and analytics support threat hunting, the proactive search for undetected compromise based on a hypothesis. A deployed model whose behavior changes without an approved update should be investigated as a possible poisoning or tampering incident. And operating across several clouds demands a normalized log schema, consistent identity attributes and runbooks that account for each provider's tooling and evidence limits. Measure the operation by outcomes such as mean time to detect and to respond, not by alert volume.""",
        'fundamentalsLabel': 'New to security operations? See the everyday analogy',
        'fundamentals': "Think of running a large hotel. The security desk watches cameras and logs of every door card swipe (logging and the SIEM), a checklist makes sure every room is set up the same way and flags a lock that was changed without a work order (baselines and change management), and housekeeping fixes things on a schedule (patching). When an alarm sounds, staff contain the problem by closing off the floor and preserving the room exactly as found, not by cleaning it. Photos are taken, items are bagged and every person who handles them signs a form (forensics and chain of custody). The manager, not the night porter, speaks to the press.",
        'keyTerms': ['Management-plane audit logs', 'SIEM and SOAR', 'CSPM', 'Configuration drift', 'Incident response life cycle', 'Containment', 'Order of volatility', 'Chain of custody', 'Threat hunting'],
        'commonTraps': [
            "Terminating or rebooting a compromised instance first destroys volatile evidence; isolate and capture first, then eradicate.",
            "Preparation is the incident response phase that determines cloud outcomes, because evidence is ephemeral and access depends on prior agreements.",
            "The customer patches guest systems in infrastructure as a service; the provider patches the hypervisor.",
            "SIEM detects and correlates; SOAR automates response. Neither works with missing or unsynchronized logs.",
            "Alert volume is not an effectiveness metric; mean time to detect and respond are.",
        ],
        'scenario': "At 2 a.m. an alert shows an engineer's cloud key used from two continents and a new virtual machine launched in an unused region. The responder revokes the key's sessions, places the instance in a quarantine network, takes disk and memory snapshots in a pre-staged forensic account and begins reviewing the management-plane audit trail. Legal is called before any statement to customers. Later the team notes that the unused region had no monitoring and adds guardrails denying activity there.",
        'onTheJob': "Test your detection against real attacker behavior, not vendor demos: inject benign signals such as an unusual role assumption and verify that someone is paged. Keep a short list of destructive actions the automation may take without a human and review it every quarter. Rehearse incidents with the actual provider contacts and ticket paths, since escalations that work on paper fail at three in the morning. After every incident, convert the lesson into a control, a log source or a playbook edit, and track those actions to completion.",
    },
    {
        'id': 'legal-privacy-risk-audit',
        'title': 'Legal, Privacy, Risk, Audit and Vendor Management',
        'summary': 'GDPR and cross-border transfers, eDiscovery and government access, contracts and SLAs, SOC reports and ISO standards, CSA STAR, risk treatment and third-party management.',
        'diagram': None,
        'vocabIds': _vocab(['legal'], 9),
        'quizIds': _quiz(['legal'], 3, 1, 1, 1),
        'reading': """Cloud puts data in other people's buildings, often in other countries, and the law follows the data. Start with the roles. The controller decides why and how personal data is processed and carries primary legal responsibility; the processor acts on its instructions. A cloud customer is usually the controller and the provider the processor, and providers may use sub-processors of their own. Handing processing to a provider outsources work, never accountability. The European General Data Protection Regulation shows the pattern most privacy laws now follow: principles such as lawfulness, minimization and accountability, rights for individuals to access, correct, erase and port their data, breach notification to authorities within 72 hours of becoming aware, and heavy fines. It applies based on whose data you process, not only where you sit.

Where data is stored and who can reach it are separate legal questions. Residency is the physical location. Sovereignty is the principle that data is subject to the laws of the country where it sits or where its controller is based. Transfers of personal data out of the European Union need a lawful mechanism, such as an adequacy decision, standard contractual clauses or binding corporate rules, usually supported by an assessment of the destination country's laws. Foreign government access, for example through the US CLOUD Act, which can compel US providers to produce data wherever it is stored, creates conflict. Sector rules add their own layers: HIPAA for US health data with business associate agreements, the Payment Card Industry standard for card data and Sarbanes-Oxley for financial reporting controls.

Litigation brings electronic discovery, the identifying, preserving, collecting and producing of electronic data. In the cloud you must know where data is held, how a legal hold is applied so that deletion stops, what the provider will support and at what cost. Contracts are the customer's main instrument for turning promises into obligations. Look for service levels, data ownership and location, security obligations, breach notification timelines, audit rights, subprocessor controls, termination assistance and verified deletion.

Customers rarely audit a hyperscale provider themselves, so they rely on independent evidence. A SOC 1 report concerns controls over financial reporting; SOC 2 reports on security, availability, processing integrity, confidentiality and privacy, with Type I covering design at a point in time and Type II covering operating effectiveness over a period; SOC 3 is a public summary. ISO/IEC 27001 certifies an information security management system, 27017 adds cloud-specific controls and 27018 covers personal data in public clouds. The Cloud Security Alliance's Cloud Controls Matrix and STAR registry give a public, comparable view, from a self-assessment at Level 1 to third-party audit at Level 2.

Risk management ties it together. Identify assets and threats, assess likelihood and impact, and treat risk by mitigating, transferring, avoiding or accepting it. Vendor risk management applies due diligence before onboarding, contracts for obligations, ongoing monitoring and an exit plan.""",
        'fundamentalsLabel': 'New to cloud law and risk? See the everyday analogy',
        'fundamentals': "Imagine you store family heirlooms in a bank's safe deposit boxes in several countries. You remain the owner and answer for the heirlooms, even though the bank holds them, and you need a rental contract that says who may open the box, how fast you are told if something happens and what happens when you close it. Different countries have different rules about what officials may demand from a bank, so you might keep the only key yourself. Instead of inspecting every bank vault, you read independent inspection reports and check whether they covered your branch and the right period. And before choosing a bank you investigate it; afterwards you keep watching it.",
        'keyTerms': ['Controller and processor', 'GDPR', 'Data residency versus sovereignty', 'Standard contractual clauses', 'eDiscovery and legal hold', 'SOC 2 Type II', 'ISO/IEC 27001, 27017, 27018', 'CSA STAR', 'Due diligence and due care'],
        'commonTraps': [
            "Accountability stays with the controller; signing a processor contract or using a certified provider does not transfer it.",
            "Residency is where data sits; sovereignty is whose law governs it. They are different questions.",
            "SOC 2 Type I tests design at a point in time; Type II tests operation over a period and is the stronger evidence.",
            "CSA STAR Level 1 is a self-assessment; third-party audit is Level 2.",
            "Insurance is risk transfer for money only; risk is accepted by the business owner, not by the security team.",
        ],
        'scenario': "A European e-commerce company selects a US-headquartered cloud provider. Counsel identifies three issues: support staff outside the EU can reach personal data, subprocessors are not yet listed and breach notification in the draft contract is thirty days. The security architect negotiates standard contractual clauses with a transfer assessment, a subprocessor list with a right to object, notification within a day, customer-managed keys and a SOC 2 Type II plus a STAR Level 2 attestation as evidence.",
        'onTheJob': "Get legal and procurement in early and bring them a short list of must-haves: breach notification timelines, location and subprocessor controls, audit evidence and exit terms. Build a data inventory that maps each dataset to its owner, location and legal regime, because that is the first thing a regulator or litigator will ask for. When you read an assurance report, begin with the scope page and the exceptions, then map the provider's complementary customer controls to your own owners. Review vendors on a schedule tied to their risk tier and keep the exit plan current.",
    },
]

MADLIBS = [
    {
        'id': 'ml-ccsp-1', 'cat': C1,
        'scenario': "A company moves a workload from virtual machines it manages to a finished business application delivered over the web. The provider now patches the whole stack, so this is {b1}, but the company still decides who gets accounts and what data is entered, which falls under the {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['software as a service', 'infrastructure as a service', 'platform as a service'], 'correct': 0},
            {'key': 'b2', 'options': ['shared responsibility model', 'provider-only accountability', 'community cloud agreement'], 'correct': 0},
        ],
        'explanation': "A finished application delivered to users is SaaS. Under shared responsibility, identity, access decisions and data stay with the customer in every service model.",
    },
    {
        'id': 'ml-ccsp-2', 'cat': C2,
        'scenario': "To prove a retired database cannot be recovered when the customer cannot touch the provider's disks, the team encrypts the data with its own keys and then destroys every copy of the key. This technique is called {b1}. To keep an external partner's access revocable after a document is shared, they apply {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['cryptographic erasure', 'tokenization', 'data masking'], 'correct': 0},
            {'key': 'b2', 'options': ['information rights management', 'data loss prevention at the gateway', 'static data masking'], 'correct': 0},
        ],
        'explanation': "Destroying the keys renders the encrypted data unrecoverable (crypto-shredding). IRM travels with the file and allows revocation after sharing, whereas DLP only governs egress.",
    },
    {
        'id': 'ml-ccsp-3', 'cat': C2,
        'scenario': "A regulator requires that the cloud provider must never be able to decrypt a firm's records, so the firm keeps its keys in an on-premises hardware security module. This is {b1}. If instead the firm generated the key and imported it into the provider's key service, it would be {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['hold your own key', 'bring your own key', 'provider-managed keys'], 'correct': 0},
            {'key': 'b2', 'options': ['bring your own key', 'hold your own key', 'envelope encryption'], 'correct': 0},
        ],
        'explanation': "Only HYOK keeps key material outside the provider's reach. BYOK imports customer-generated key material into the provider's service, where the provider's service can use it.",
    },
    {
        'id': 'ml-ccsp-4', 'cat': C3,
        'scenario': "A BIA states a payment platform can be down for at most five minutes and can lose at most one second of transactions. The first figure is the {b1} and the second is the {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['recovery time objective', 'recovery point objective', 'maximum tolerable downtime'], 'correct': 0},
            {'key': 'b2', 'options': ['recovery point objective', 'recovery time objective', 'service level agreement'], 'correct': 0},
        ],
        'explanation': "RTO is the acceptable time to restore service; RPO is the acceptable data loss measured in time.",
    },
    {
        'id': 'ml-ccsp-5', 'cat': C4,
        'scenario': "A team draws a data flow diagram and uses the {b1} categories (Spoofing, Tampering and so on) to find threats at design time. Later, a tool that attacks the running staging application from outside without source code access is {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['STRIDE', 'OWASP Top 10', 'CIS Benchmarks'], 'correct': 0},
            {'key': 'b2', 'options': ['dynamic application security testing', 'static application security testing', 'software composition analysis'], 'correct': 0},
        ],
        'explanation': "STRIDE is a threat-modeling vocabulary used during design. DAST tests a running application from outside; SAST needs source and SCA examines third-party components.",
    },
    {
        'id': 'ml-ccsp-6', 'cat': C5,
        'scenario': "During an incident the responder places a compromised instance in a quarantine network and snapshots memory and disks before changing it. This follows the principle of {b1}, and a record of who handled each snapshot is the {b2}.",
        'blanks': [
            {'key': 'b1', 'options': ['isolating and preserving evidence', 'eradicating before containing', 'terminating immediately'], 'correct': 0},
            {'key': 'b2', 'options': ['chain of custody', 'service level agreement', 'baseline configuration'], 'correct': 0},
        ],
        'explanation': "Contain by isolating while preserving volatile evidence; the chain of custody documents every handler to keep evidence admissible.",
    },
    {
        'id': 'ml-ccsp-7', 'cat': C6,
        'scenario': "A European company that decides why and how customer data is processed is the {b1}, and the SaaS vendor that handles it on its behalf is the {b2}. For a transfer to a country without an adequacy decision, they rely on {b3}.",
        'blanks': [
            {'key': 'b1', 'options': ['controller', 'processor', 'data subject'], 'correct': 0},
            {'key': 'b2', 'options': ['processor', 'controller', 'auditor'], 'correct': 0},
            {'key': 'b3', 'options': ['standard contractual clauses', 'a marketing statement', 'SOC 3 report'], 'correct': 0},
        ],
        'explanation': "The customer is usually the controller and the provider the processor. SCCs are the common contract-based transfer mechanism.",
    },
]

SEQUENCES = [
    {
        'id': 'seq-ccsp-1', 'cat': C2,
        'prompt': "Put these steps in order for bringing an unmanaged cloud data estate under control.",
        'steps': [
            'Discover where sensitive data is stored and how it flows',
            'Classify the data and assign owners',
            'Apply handling controls such as encryption, access policy and DLP according to the label',
            'Monitor access and movement and alert on policy violations',
            'Retire data at end of retention with verified destruction',
        ],
        'explanation': "You cannot classify what you have not found, and controls follow the classification. Monitoring keeps the controls honest and destruction closes the life cycle, subject to legal holds.",
    },
    {
        'id': 'seq-ccsp-2', 'cat': C5,
        'prompt': "Put these cloud incident response steps in order after a suspected compromised virtual machine is detected.",
        'steps': [
            'Triage the alert and declare the incident',
            'Isolate the instance in a quarantine network and revoke exposed credentials',
            'Snapshot disks and memory and record the chain of custody',
            'Analyze evidence to find scope and root cause',
            'Eradicate the cause and rebuild from a known-good image',
            'Review lessons learned and update controls and playbooks',
        ],
        'explanation': "Contain before you analyze or eradicate, and capture evidence before the instance changes. Recovery uses a clean rebuild, and learning closes the loop.",
    },
    {
        'id': 'seq-ccsp-3', 'cat': C3,
        'prompt': "Put these steps in order for building a disaster recovery plan for a cloud application.",
        'steps': [
            'Conduct a business impact analysis',
            'Set recovery time and recovery point objectives',
            'Select a recovery strategy that meets the objectives at the lowest cost',
            'Implement replication, backups and failover automation',
            'Test the plan and measure actual recovery results',
            'Review and update the plan after changes and tests',
        ],
        'explanation': "Objectives come from the business impact analysis, strategy from the objectives and implementation from the strategy. Testing proves the numbers and reviews keep the plan current.",
    },
    {
        'id': 'seq-ccsp-4', 'cat': C4,
        'prompt': "Put these activities in the order they naturally occur in a secure software development life cycle for a new cloud feature.",
        'steps': [
            'Define security requirements',
            'Perform threat modeling on the design',
            'Write code following secure standards with static analysis and dependency scanning',
            'Run dynamic and integration security testing',
            'Deploy through a gated pipeline with signed artifacts',
            'Monitor and patch in production',
        ],
        'explanation': "Requirements and design-time threat modeling come first because defects are cheapest to fix there. Testing verifies the build, deployment is gated and operations continue the cycle.",
    },
    {
        'id': 'seq-ccsp-5', 'cat': C6,
        'prompt': "Put these steps in order for onboarding a new cloud service provider under a vendor risk management process.",
        'steps': [
            'Define business requirements and data classification for the service',
            'Perform due diligence on the provider using audit reports and questionnaires',
            'Negotiate contract terms for security, privacy, audit rights and exit',
            'Approve residual risk with the business owner',
            'Onboard with monitoring and periodic reassessment',
        ],
        'explanation': "Requirements shape diligence, diligence informs contract terms and residual risk is accepted by the owner before go-live. Monitoring continues after onboarding.",
    },
]

CASE_STUDIES = [
    {
        'id': 'cs-ccsp-meridian-health-analytics',
        'cat': C2,
        'title': "Meridian Health Analytics and the Key Question",
        'scenario': (
            "Meridian Health Analytics is a European company that processes patient imaging data for hospitals. It is moving "
            "its archive and a machine learning training pipeline to a public cloud provider headquartered in the United "
            "States, using the provider's object storage and managed training service. Meridian is the controller of the "
            "personal data. A hospital customer has told Meridian that its contract requires that no staff of any "
            "subcontractor, including the cloud provider, can read the images. The data science team also wants to copy "
            "production images into an unrestricted notebook environment for experiments, and a scan has already found "
            "several untagged buckets that nobody can explain. Leadership wants a decision on key management, data handling "
            "for experiments and a plan for retiring images when a hospital contract ends. The provider offers provider-managed "
            "keys, customer-managed keys in its key service, import of customer-generated keys and integration with an "
            "external on-premises hardware security module. The provider has also announced two new subprocessors outside the "
            "European Union."
        ),
        'questions': [
            {
                'id': 'cs-ccsp-meridian-health-analytics-q1', 'type': 'mc',
                'question': "Which key strategy BEST meets the hospital's requirement that no provider staff can read the images?",
                'options': [
                    "Keep keys in an on-premises hardware security module outside the provider",
                    "Use customer-managed keys in the provider's key service with strict access policies",
                    "Import customer-generated keys into the provider's key service",
                    "Rely on provider-managed keys with automatic annual rotation",
                ],
                'correct': 0,
                'explanation': "Only holding the key outside the provider's environment guarantees the provider cannot decrypt. Customer-managed keys and imported keys give the customer more control but the provider's service still holds and uses the key. Provider-managed keys with rotation remain fully provider-accessible.",
            },
            {
                'id': 'cs-ccsp-meridian-health-analytics-q2', 'type': 'mc',
                'question': "What is the BEST way to satisfy the data science team's need for realistic images in experiments?",
                'options': [
                    "Provide de-identified or synthetic copies",
                    "Grant the team read access to production images",
                    "Tokenize the images and share the vault with the team",
                    "Copy production images but delete them after each experiment",
                ],
                'correct': 0,
                'explanation': "De-identified or synthetic data removes real patient content from a weaker environment. Direct production access and temporary copies still expose real images, and sharing the token vault removes the protection tokenization provides.",
            },
            {
                'id': 'cs-ccsp-meridian-health-analytics-q3', 'type': 'ms',
                'question': "Which TWO actions should Meridian take about the untagged buckets and the new subprocessors? (Choose two.)",
                'options': [
                    "Run data discovery to identify and classify the contents of the unknown buckets",
                    "Review the subprocessors against the contract and transfer rules and exercise any right to object",
                    "Delete the unknown buckets immediately to remove the risk",
                    "Accept the subprocessors automatically because the provider is reputable",
                ],
                'correct': [0, 1],
                'explanation': "Discovery establishes what the buckets hold before any decision, and reviewing the subprocessors applies the controller's rights and transfer obligations. Immediate deletion risks destroying data under legal or contractual obligations, and automatic acceptance skips the controller's duties.",
            },
            {
                'id': 'cs-ccsp-meridian-health-analytics-q4', 'type': 'tf',
                'question': "When a hospital contract ends, destroying every copy of the key protecting that hospital's data, encrypted under a dedicated key, is an acceptable way to make the data unrecoverable in the cloud.",
                'answer': True,
                'explanation': "Cryptographic erasure is the accepted method where physical media destruction is not possible, provided keys are dedicated per customer and all copies are destroyed.",
            },
        ],
    },
    {
        'id': 'cs-ccsp-nimbus-retail-incident',
        'cat': C5,
        'title': "Nimbus Retail and the Midnight Key",
        'scenario': (
            "Nimbus Retail runs its online store across two public cloud providers. At midnight the security operations "
            "center is alerted that an engineer's cloud access key was used from an unfamiliar country to create "
            "several large virtual machines in a region the company never uses. The management-plane audit trail is enabled "
            "in one provider but was never turned on in the second, and the two providers' logs arrive in different "
            "formats, so analysts must correlate events by hand. An engineer on call suggests terminating the new "
            "instances immediately. The team has a pre-approved isolated account for forensic analysis but its incident "
            "playbook does not mention the second provider. Customer payment tokens are stored in a vault and there is no "
            "evidence yet that tokens or card data were accessed. Legal counsel has asked to be consulted before any "
            "external statement. A data science team also notes that a fraud detection model began flagging far fewer "
            "transactions this week without any approved update."
        ),
        'questions': [
            {
                'id': 'cs-ccsp-nimbus-retail-incident-q1', 'type': 'mc',
                'question': "What should the responder do FIRST regarding the suspicious virtual machines?",
                'options': [
                    "Isolate them, revoke the key's sessions and capture snapshots",
                    "Terminate them to stop the cost and the attacker's access to the account",
                    "Reboot them to clear any malicious processes",
                    "Leave them running unchanged until the next business day",
                ],
                'correct': 0,
                'explanation': "Containment with evidence preservation limits damage and keeps volatile data. Terminating or rebooting destroys evidence, and waiting lets the attacker continue and spend.",
            },
            {
                'id': 'cs-ccsp-nimbus-retail-incident-q2', 'type': 'mc',
                'question': "Which improvement would MOST have helped analysts investigate across both providers?",
                'options': [
                    "Enable audit logging everywhere and centralize logs in a SIEM",
                    "Ask each provider to investigate independently and send reports",
                    "Reduce logging to only the provider with the cleanest format",
                    "Give all engineers read access to both providers' consoles",
                ],
                'correct': 0,
                'explanation': "Complete, centralized, normalized logging is the foundation of cross-cloud detection and forensics. Independent provider reports do not correlate events, reducing logs removes visibility and broader access does not create it.",
            },
            {
                'id': 'cs-ccsp-nimbus-retail-incident-q3', 'type': 'mc',
                'question': "How should the team treat the fraud model's unexplained change in behavior?",
                'options': [
                    "As a possible tampering event to investigate with the incident",
                    "As normal drift that needs no action",
                    "As proof that the cloud provider's hypervisor was breached",
                    "As a licensing matter for the model vendor",
                ],
                'correct': 0,
                'explanation': "An unapproved change in model behavior during a suspected compromise could signal tampering or poisoning, so it should be investigated. Ignoring it risks fraud, and neither the hypervisor nor licensing explains it.",
            },
            {
                'id': 'cs-ccsp-nimbus-retail-incident-q4', 'type': 'ms',
                'question': "Which TWO actions belong in the post-incident improvements? (Choose two.)",
                'options': [
                    "Extend the playbook and monitoring to the second provider",
                    "Add guardrails denying resource creation in regions the company does not use",
                    "Remove the pre-approved forensic account to reduce costs",
                    "Delay legal involvement until after public statements",
                ],
                'correct': [0, 1],
                'explanation': "Closing the playbook gap and restricting unused regions address the weaknesses revealed. Removing the forensic account weakens readiness, and legal must lead external communication.",
            },
        ],
    },
    {
        'id': 'cs-ccsp-harbor-fintech-launch',
        'cat': C4,
        'title': "Harbor Fintech's API and Assistant Launch",
        'scenario': (
            "Harbor Fintech is launching a mobile banking app backed by public APIs, a microservices platform running in "
            "containers and an assistant built on a large language model that summarizes a customer's transactions. During "
            "testing a researcher finds that changing an account identifier in an API request returns another customer's "
            "transactions, even though the caller is correctly signed in. The assistant retrieves merchant descriptions from "
            "third-party sources and can call an internal tool that emails statements. A hidden instruction in a merchant "
            "description made the assistant attempt to email a statement to an outside address. The build pipeline pulls "
            "open-source libraries and deploys images without signature checks, and service-to-service calls use a single "
            "long-lived key stored in the repository. The security team has no software inventory for the platform and "
            "no record of which APIs exist beyond those in the documentation. Management wants to launch in two weeks and "
            "asks for the highest-impact fixes, an explanation of the root causes and a plan for ongoing assurance."
        ),
        'questions': [
            {
                'id': 'cs-ccsp-harbor-fintech-launch-q1', 'type': 'mc',
                'question': "What is the ROOT cause of the exposure of another customer's transactions through the API?",
                'options': [
                    "Missing object-level authorization checks",
                    "Weak transport encryption between the app and the API",
                    "Lack of rate limiting on the sign-in endpoint",
                    "An out-of-date web application firewall rule set",
                ],
                'correct': 0,
                'explanation': "The caller was authenticated but the API failed to verify that they may access the requested object. Transport encryption, sign-in throttling and WAF rules do not address this authorization flaw.",
            },
            {
                'id': 'cs-ccsp-harbor-fintech-launch-q2', 'type': 'mc',
                'question': "Which control MOST directly limits the harm from the hidden instruction in a merchant description?",
                'options': [
                    "Restrict the assistant's tools and treat retrieved text as untrusted",
                    "Increase the model's context window size",
                    "Rewrite the system prompt in a friendlier tone",
                    "Store merchant descriptions in a larger database",
                ],
                'correct': 0,
                'explanation': "Least privilege on tools and treating retrieved content as untrusted address prompt injection at its source. Context size, prompt tone and database size do not stop the model acting on hostile text.",
            },
            {
                'id': 'cs-ccsp-harbor-fintech-launch-q3', 'type': 'mc',
                'question': "What is the BEST fix for the single long-lived key stored in the repository?",
                'options': [
                    "Replace it with short-lived scoped workload identities",
                    "Rotate the key once a year but keep it in the shared repository for the whole team",
                    "Encode the key in base64 before committing it",
                    "Share the key with the security team for safekeeping",
                ],
                'correct': 0,
                'explanation': "Short-lived scoped identities remove stored secrets and limit blast radius. Annual rotation leaves long exposure, encoding is not protection and sharing the key spreads it further.",
            },
            {
                'id': 'cs-ccsp-harbor-fintech-launch-q4', 'type': 'ms',
                'question': "Which TWO changes best strengthen the build and deployment pipeline? (Choose two.)",
                'options': [
                    "Scan dependencies and generate a software bill of materials for each build",
                    "Sign build artifacts and verify provenance before deployment",
                    "Allow developers to push images straight to production from their laptops",
                    "Disable dependency scanning to speed up releases",
                ],
                'correct': [0, 1],
                'explanation': "Dependency scanning with an SBOM and signed, provenance-checked artifacts counter supply chain risk. Pushing from laptops and disabling scanning remove protections.",
            },
        ],
    },
]

COMPARE = [
    {
        'id': 'cmp-ccsp-1', 'cat': C2,
        'scenario': "A regulator requires that a cloud provider can never read a firm's archived records, and the firm accepts some loss of features and higher latency. Which key arrangement is better?",
        'optionA': "Customer-managed keys in the provider's key service with strict access policies and automatic rotation",
        'optionB': "Keys generated and held in the firm's own on-premises hardware security module, used by the provider only through a controlled interface",
        'better': 'B',
        'why': "Only keys held outside the provider's control guarantee that the provider cannot decrypt. Customer-managed keys in the provider's service are the tempting runner-up because they offer strong control and revocation, but the provider's service still holds and uses the key material.",
    },
    {
        'id': 'cmp-ccsp-2', 'cat': C2,
        'scenario': "A law firm shares a sensitive contract with an outside party and must be able to withdraw access later even if the file has been downloaded. Which control is better?",
        'optionA': "Information rights management applied to the document",
        'optionB': "A data loss prevention policy on the outbound mail gateway",
        'better': 'A',
        'why': "IRM keeps protection attached to the file and supports revocation after sharing. DLP is the tempting runner-up because it also guards sensitive content, but it only acts at the point of egress and cannot reach a file that has already left.",
    },
    {
        'id': 'cmp-ccsp-3', 'cat': C2,
        'scenario': "A retailer wants to shrink the part of its environment subject to payment card compliance while still being able to retrieve real card numbers for refunds in one controlled service. Which is better?",
        'optionA': "Tokenization with a secured vault used only by the refund service",
        'optionB': "Hashing each card number with a salted algorithm in every system",
        'better': 'A',
        'why': "Tokenization lets most systems hold only surrogate values while an authorized service retrieves the real number from the vault. Salted hashing is the tempting runner-up because it protects stored values, but hashes are irreversible, so refunds could not retrieve the original number.",
    },
    {
        'id': 'cmp-ccsp-4', 'cat': C3,
        'scenario': "An internal reporting application has an RTO of eight hours and an RPO of 24 hours. Leadership wants the lowest-cost design that meets both. Which is better?",
        'optionA': "Nightly backups to another region with a documented restore procedure",
        'optionB': "Active-active deployment in two regions with synchronous replication",
        'better': 'A',
        'why': "Nightly backups satisfy a 24-hour RPO and an eight-hour restore at the lowest cost. Active-active is the tempting runner-up because it is more resilient, but it pays for instant failover and zero data loss that nothing in the requirements asks for.",
    },
    {
        'id': 'cmp-ccsp-5', 'cat': C3,
        'scenario': "A company needs to stop a compromised web server from reaching the database tier in the same virtual network. Which change is better?",
        'optionA': "Micro-segmentation with deny-by-default rules allowing only the application port between the tiers",
        'optionB': "A stricter perimeter firewall rule set at the internet gateway",
        'better': 'A',
        'why': "The threat is lateral movement inside the network, which segmentation controls directly. A tighter perimeter is the tempting runner-up, but traffic between tiers inside the virtual network never crosses the gateway.",
    },
    {
        'id': 'cmp-ccsp-6', 'cat': C4,
        'scenario': "A team wants to find design flaws in a new payment feature while the architecture can still change cheaply. Which activity is better?",
        'optionA': "Threat modeling using data flow diagrams and STRIDE",
        'optionB': "A penetration test of the finished feature in staging",
        'better': 'A',
        'why': "Threat modeling at design time finds structural flaws when they are cheapest to fix. A penetration test is the tempting runner-up because it finds real exploits, but it happens after the design and code exist, so fixing structural flaws is expensive.",
    },
    {
        'id': 'cmp-ccsp-7', 'cat': C4,
        'scenario': "Contractors need access to one internal application from unmanaged laptops, and the company wants least privilege. Which approach is better?",
        'optionA': "Zero trust network access granting per-application sessions after verifying user and device posture",
        'optionB': "A full-tunnel VPN into the corporate network with a shared access password",
        'better': 'A',
        'why': "ZTNA limits each session to the one application and verifies identity and device. A VPN is the tempting runner-up because it is familiar and encrypted, but it places contractors on the whole network and a shared password destroys accountability.",
    },
    {
        'id': 'cmp-ccsp-8', 'cat': C5,
        'scenario': "A cloud virtual machine is suspected of running attacker malware, and the investigation may go to court. Which first action is better?",
        'optionA': "Isolate the instance with a quarantine rule and snapshot its memory and disks",
        'optionB': "Terminate the instance and rebuild it from a clean image",
        'better': 'A',
        'why': "Isolation stops spread while preserving volatile evidence and the chain of custody. Rebuilding is the tempting runner-up because it removes the malware quickly, but terminating destroys the evidence needed to understand and prosecute.",
    },
    {
        'id': 'cmp-ccsp-9', 'cat': C5,
        'scenario': "An organization sees many misconfigured storage buckets across dozens of cloud accounts. Which investment is better?",
        'optionA': "Cloud security posture management with automatic remediation and guardrails",
        'optionB': "A quarterly manual review of each account's settings by an auditor",
        'better': 'A',
        'why': "Continuous automated checks and guardrails catch and prevent misconfiguration as it happens. Manual review is the tempting runner-up because it is thorough, but at quarterly intervals exposures last for months and the review does not scale.",
    },
    {
        'id': 'cmp-ccsp-10', 'cat': C6,
        'scenario': "A buyer wants evidence that a SaaS provider's controls operated effectively over the past year before signing. Which is better?",
        'optionA': "A SOC 2 Type II report with an in-scope service and a review period covering the past year",
        'optionB': "A SOC 2 Type I report issued last month",
        'better': 'A',
        'why': "Type II tests operating effectiveness across a period. Type I is the tempting runner-up because it is recent and from the same framework, but it only assesses design at a single point in time.",
    },
]

CHEAT_SHEET = [
    {
        'heading': 'Cloud concepts, models and responsibility',
        'points': [
            "NIST essential characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity, measured service. ISO/IEC 17788 adds multi-tenancy.",
            "Service models: IaaS (you manage guest OS upward), PaaS (you manage app and data), SaaS (you manage users, configuration and data).",
            "Deployment models: public, private, hybrid (different models bound together), community. Multi-cloud means several providers.",
            "Shared responsibility: data, identities and access decisions are always the customer's; accountability is never transferred.",
            "Cross-cutting aspects: auditability, availability, governance, interoperability, portability, privacy, regulatory, resiliency, reversibility, security, service levels.",
            "Emerging: confidential computing (data in use), AI and ML as assets to classify and protect, edge and IoT, post-quantum risk and crypto agility.",
        ],
    },
    {
        'heading': 'Data security essentials',
        'points': [
            "Life cycle: create, store, use, share, archive, destroy. Discover, then classify, then apply controls. The data owner sets classification.",
            "DLP governs data in motion and at endpoints; IRM travels with the file and supports revocation. Masking is irreversible for test data.",
            "Anonymization is out of privacy scope; pseudonymization is still personal data. Tokenization needs a vault and reduces compliance scope.",
            "Deletion guarantee in cloud: cryptographic erasure (destroy all copies of the key). Legal hold overrides retention and auto-delete.",
            "Data lakes and training sets need lineage, integrity protection and fine-grained access; poisoned data corrupts every model trained on it.",
        ],
    },
    {
        'heading': 'Encryption and key management',
        'points': [
            "Three states: at rest (storage encryption), in transit (TLS 1.3 or at least 1.2), in use (confidential computing, homomorphic encryption).",
            "Envelope encryption: a DEK encrypts the data, a KEK in KMS wraps the DEK; rotate or destroy the KEK to control many keys.",
            "Custody ladder: provider-managed, customer-managed, BYOK (imported into provider service), HYOK (never leaves customer control). Only HYOK excludes the provider.",
            "HSM: tamper-resistant key custody, validated to FIPS 140. Keep keys separate from data and key admins separate from data owners.",
            "Key lifecycle: generation, distribution, storage, use, rotation, revocation, archival, destruction. Secrets belong in a secrets manager, not code or images.",
        ],
    },
    {
        'heading': 'Platform and infrastructure',
        'points': [
            "Type 1 hypervisors power the cloud; VM escape and side channels threaten tenant isolation. Dedicated hosts or confidential computing for the most sensitive loads.",
            "Containers share the host kernel, so isolation is weaker than VMs: scan and sign images, protect the Kubernetes API, use network policies and least-privilege RBAC.",
            "Serverless: the provider patches the host; you own function permissions, code and dependencies.",
            "Security groups are stateful and per workload; network ACLs are stateless and per subnet. Micro-segmentation limits lateral movement.",
            "Protect the management plane first: MFA, just-in-time privilege and an immutable audit log. Prefer ZTNA to broad VPN access.",
            "Immutable infrastructure and scanned infrastructure as code prevent drift and replicate fewer flaws.",
        ],
    },
    {
        'heading': 'BCDR and risk analysis',
        'points': [
            "BIA comes first. RTO is time to restore; RPO is acceptable data loss; maximum tolerable downtime caps the RTO.",
            "Strategies by cost and speed: backup and restore, pilot light, warm standby, active-active. Choose the cheapest that meets stated objectives.",
            "Zones survive facility loss, regions survive regional disasters but must respect residency rules. Synchronous replication means near-zero loss but latency.",
            "Immutable backups kept separate from production credentials defend against ransomware. Only restore tests prove recoverability.",
            "Cloud risks: loss of governance, tenant isolation failure, insecure interfaces, management-plane compromise, lock-in. The asset owner accepts residual risk.",
        ],
    },
    {
        'heading': 'Application security and identity',
        'points': [
            "Shift left: security in every SDLC phase; threat model at design time. STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.",
            "SAST reads code, DAST attacks the running app, IAST instruments it, SCA checks third-party components; SBOM and signed artifacts counter supply chain attacks.",
            "APIs: authenticate every call, authorize per object (BOLA is the top flaw), validate schemas, rate-limit, inventory. A WAF is compensating, not a fix.",
            "AI apps: prompt injection (direct or via retrieved content), inference and extraction attacks. Treat model output as untrusted; limit tools and data; log.",
            "Identity: SAML and OIDC for sign-on, OAuth 2.0 for delegated authorization. Prefer phishing-resistant MFA, JIT privilege, short-lived workload credentials, automated deprovisioning.",
        ],
    },
    {
        'heading': 'Security operations and incident response',
        'points': [
            "Log management-plane, flow, workload and identity events to a protected central store; synchronize time; SIEM detects, SOAR responds.",
            "CSPM finds misconfiguration; drift detection enforces baselines; change management controls risk; the customer patches guest OS and apps in IaaS.",
            "IR life cycle: prepare, detect and analyze, contain, eradicate, recover, learn (NIST SP 800-61 Rev. 3 aligns it with CSF 2.0). Preparation decides cloud outcomes.",
            "Contain by isolating and snapshotting, not terminating. Order of volatility: memory, network, disk, remote logs. Hash evidence and keep chain of custody.",
            "Newer outline: ML-assisted threat hunting, model drift as a possible incident, and consistent multi-cloud detection and response.",
        ],
    },
    {
        'heading': 'Legal, privacy, audit and vendor management',
        'points': [
            "Controller decides purposes and carries accountability; processor acts on instruction. GDPR breach notice to the authority within 72 hours of awareness.",
            "Residency (where stored) differs from sovereignty (whose law applies). Transfers need adequacy, SCCs or BCRs. The CLOUD Act can reach data held by US providers anywhere.",
            "eDiscovery: identify, preserve, collect, review, produce (ISO/IEC 27050). Legal holds suspend deletion. HIPAA needs a business associate agreement.",
            "SOC 1 financial controls; SOC 2 trust criteria (Type II is the strong evidence); SOC 3 public summary. ISO/IEC 27001 certifies an ISMS, 27017 cloud controls, 27018 PII in clouds.",
            "CSA CCM and STAR: Level 1 self-assessment, Level 2 third-party. Risk treatments: mitigate, transfer, avoid, accept; insurance never transfers accountability.",
            "Vendor management: due diligence before, due care after, contract for audit, breach notice, subprocessors and exit.",
        ],
    },
    {
        'heading': 'Exam-day strategy',
        'points': [
            "Format: computerized adaptive test of 100 to 150 items in up to 3 hours; scored on a 0 to 1000 scale with 700 to pass. Item count varies with how confidently the engine can place you, and a share of items is unscored pilot content.",
            "Adaptive means no going back: you cannot skip and return to a question, so answer every item with your best judgement and keep moving at about a minute and a half each.",
            "Questions ask for the BEST, FIRST or MOST appropriate answer. Read for the constraint (cost, regulator, provider cannot read, near-zero data loss) and eliminate options that violate it.",
            "Think like a risk-aware architect and manager: prefer answers that start with discovery, business impact analysis or risk assessment, then controls, over jumping to a product.",
            "Remember the constants: data and accountability stay with the customer; preserve evidence before eradicating; use least privilege and the cheapest option that meets the stated objective.",
            "Do not try to game the item count. A shorter exam is not a sign of passing or failing; keep a steady pace and do not spend several minutes on one item.",
            "Prepare with all six domains weighted: Data 20, Concepts 17, Platform 17, Operations 17, Application 16, Legal 13. Bring valid identification and arrive early for the testing center check-in.",
        ],
    },
]


def _shuffle_case_options():
    """Case-study options were written with the right answer(s) first; shuffle them deterministically."""
    for cs in CASE_STUDIES:
        for q in cs['questions']:
            if q['type'] not in ('mc', 'ms'):
                continue
            right = {q['correct']} if q['type'] == 'mc' else set(q['correct'])
            order = list(range(len(q['options'])))
            random.Random(q['id']).shuffle(order)
            q['options'] = [q['options'][i] for i in order]
            new_right = [pos for pos, i in enumerate(order) if i in right]
            q['correct'] = new_right[0] if q['type'] == 'mc' else new_right


def _shuffle_madlib_options():
    """Madlib blank options were written with the right answer first; shuffle them deterministically."""
    for ml in MADLIBS:
        for blank in ml['blanks']:
            right = blank['options'][blank['correct']]
            random.Random(f"{ml['id']}-{blank['key']}").shuffle(blank['options'])
            blank['correct'] = blank['options'].index(right)


def _balance_compare():
    """Compare items were written with the better option as A in most cases; swap every other one."""
    for i, cp in enumerate(COMPARE):
        if i % 2 == 1 and cp['better'] == 'A':
            cp['optionA'], cp['optionB'] = cp['optionB'], cp['optionA']
            cp['better'] = 'B'


_shuffle_case_options()
_shuffle_madlib_options()
_balance_compare()
