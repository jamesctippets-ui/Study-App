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
        {'label': 'ISC2: CCSP certification exam outline', 'url': 'https://www.isc2.org/Certifications/CCSP/Certification-Exam-Outline'},
        {'label': 'NIST SP 800-145: The NIST Definition of Cloud Computing', 'url': 'https://csrc.nist.gov/pubs/sp/800/145/final'},
        {'label': 'CSA: Security Guidance for Critical Areas of Focus in Cloud Computing', 'url': 'https://cloudsecurityalliance.org/artifacts/security-guidance-v5'},
    ]},
    {'key': 'ccspData', 'label': 'Cloud Data Security', 'marks': 20, 'resources': [
        {'label': 'NIST SP 800-57 Part 1 Rev. 5: Recommendation for Key Management', 'url': 'https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final'},
        {'label': 'NIST SP 800-88 Rev. 2: Guidelines for Media Sanitization', 'url': 'https://csrc.nist.gov/pubs/sp/800/88/r2/final'},
        {'label': 'CSA: Security Guidance (Data Security and Encryption domain)', 'url': 'https://cloudsecurityalliance.org/artifacts/security-guidance-v5'},
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
  "The classic four phases are preparation; detection and analysis; containment, eradication and recovery; and post-incident activity (SP 800-61 Rev. 2). Rev. 3 (2025) replaces the phase model by aligning incident response with the functions of the NIST Cybersecurity Framework 2.0.",
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
# REFRESH ADDITIONS (October 2026): items added after auditing the track against the CCSP outline effective August 1,
# 2026. Their ids start at 9001 so they never collide with the original sequential ids or with saved progress.
# ---------------------------------------------------------------------------------------------------------------
_counts.update({'f': 9000, 'q': 9000, 'msq': 9000, 'tf': 9000})

# ---- flashcards added in the August 2026 outline refresh: Domain 1
f(C1, 'found', 'Regulator and cloud service partner roles',
  "The regulator is the authority that sets and enforces legal duties on customer and provider (a data protection authority or sector supervisor). A cloud service partner supports either side; ISO/IEC 17788 sub-roles are the service developer, the auditor and the service broker, which can intermediate, aggregate or arbitrage between services.",
  "Roles describe functions, not companies: one organization can hold several. Accountability stays with the customer whichever partner is involved.")
f(C1, 'found', 'Cloud building block technologies',
  "The technologies services are assembled from: virtualization (abstracts hardware), storage (object, volume, file), networking (virtual networks and software-defined control), databases (often multi-tenant managed services) and orchestration (automating provisioning, scaling and lifecycle).",
  "Each building block adds its own isolation and configuration risk; an architect should be able to say which block a control protects.")
f(C1, 'found', 'Cloud computing activities',
  "The actions each role performs in the reference architecture: the customer uses services and administers its tenancy and contract; the provider prepares, operates and secures services and manages the customer relationship; a partner audits, brokers or develops. Mapping an activity to a role shows who must perform a control.",
  "Useful when a scenario asks who should do something; the activity list is a responsibility checklist.")
f(C1, 'found', 'Cloud capability types',
  "ISO/IEC 17788 classifies what the customer gets: infrastructure capabilities (provisioning compute, storage and network), platform capabilities (deploying and running customer code on the provider's runtime) and application capabilities (using the provider's software).",
  "They resemble IaaS, PaaS and SaaS, but one service can combine capability types, so analyze each capability's responsibility split.")
f(C1, 'found', 'Other cloud service categories',
  "Besides IaaS, PaaS and SaaS, ISO/IEC 17788 names Communications as a Service, Compute as a Service, Data Storage as a Service and Network as a Service. Container and function platforms sit between IaaS and PaaS.",
  "If a category is unfamiliar, place it by asking which layer the provider operates and which the customer still configures.")
f(C1, 'found', 'Common cloud threats (CSA Top Threats)',
  "The Cloud Security Alliance Top Threats to Cloud Computing 2024 report lists eleven, led by misconfiguration and inadequate change control, then identity and access management and insecure interfaces and APIs, followed by weak cloud security strategy, insecure third-party resources, insecure software development, accidental disclosure, system vulnerabilities, limited visibility, unauthenticated resource sharing and advanced persistent threats.",
  "Most are customer-side failures of configuration and identity, not provider breaches; expect scenarios where the answer is governance and change control.")
f(C1, 'found', 'Cloud security hygiene',
  "The routine basics that prevent most incidents: patching, secure baselines, hardening, immutable architecture, configuration drift detection, least privilege and removal of unused resources and credentials.",
  "Exam answers favor automated, repeatable hygiene over one-off heroics.")
f(C1, 'found', 'Ephemeral computing',
  "Short-lived resources such as containers, functions and autoscaled instances that are created for a task and destroyed afterwards. Attackers lose persistence and state is cleaned up, but evidence disappears with the resource unless logs and snapshots are shipped out first.",
  "Pair ephemeral designs with centralized logging and automated forensic capture.")
f(C1, 'found', 'Geofencing and region restriction',
  "Controls that limit where resources can be created or from where they can be reached, such as policies allowing only approved regions or blocking access from unapproved countries using IP geolocation.",
  "Supports residency rules, but IP geolocation can be spoofed, so combine it with identity controls.")
f(C1, 'found', 'Traffic inspection in the cloud',
  "Examining packets or flows with firewalls, intrusion detection and prevention, web application firewalls or inspecting proxies, using virtual appliances, traffic mirroring or provider-native services because physical choke points no longer exist.",
  "Encrypted traffic needs termination at an inspection point or metadata analysis; the choice trades visibility against privacy and latency.")
f(C1, 'found', 'Cost-benefit analysis and return on investment (ROI)',
  "Cost-benefit analysis compares the full cost of a control or migration (licenses, labor, risk) with the benefit (loss avoided, savings). ROI is gain minus cost, divided by cost. A safeguard is justified when the annual loss it prevents exceeds its annual cost.",
  "These numbers feed the business impact analysis and the decision on which recovery or control option to fund.")
f(C1, 'found', 'Functional security requirements',
  "Security-related capabilities a cloud design must provide, including portability, interoperability, vendor lock-in limits, encryption, identity integration, logging and the ability to exit, derived from business needs and regulation.",
  "Write them before choosing a provider so the evaluation tests the requirement rather than the sales pitch.")
f(C1, 'found', 'Secure design principles and cloud design patterns',
  "Classic principles such as least privilege, fail-safe defaults, complete mediation, separation of duties, economy of mechanism and defense in depth guide architecture, as taught in SANS and similar guidance. Patterns apply them, for example landing zones, hub-and-spoke networks and private endpoints.",
  "When a question asks which design is best, pick the one that applies these principles by default instead of relying on later hardening.")
f(C1, 'found', 'Well-Architected Frameworks',
  "Provider design guidance organized into pillars. AWS Well-Architected has six: operational excellence, security, reliability, performance efficiency, cost optimization and sustainability. Azure Well-Architected has five and omits sustainability as a pillar.",
  "Treat them as review checklists; the exam cares that security is one pillar balanced against the others, not the vendor details.")
f(C1, 'found', 'CSA Enterprise Architecture',
  "A Cloud Security Alliance reference architecture, methodology and assessment tool for designing and evaluating security architecture across business operations, IT operations, information technology and security and risk management, building on established methods such as SABSA and TOGAF.",
  "Use it to compare a provider's offering with your own required security capabilities.")
f(C1, 'found', 'Secure by design and secure by default',
  "Secure by design builds security into architecture from the start through early threat modeling and a small attack surface. Secure by default ships services with safe settings (private, encrypted, least privilege) so customers need no extra hardening to be safe.",
  "Public-by-default storage or open management ports are the textbook counterexamples.")
f(C1, 'found', 'Data science and big data in the cloud',
  "Analytics and machine learning platforms that gather large datasets from many sources. Risks include aggregating sensitive data in one lake, re-identification by joining datasets, credentials embedded in notebooks and uncontrolled copies of extracts.",
  "Apply classification, minimization and fine-grained access before data enters the platform, not after.")
f(C1, 'found', 'Evaluating a cloud service provider',
  "Verify the provider against defined criteria: certifications and audit reports (ISO/IEC 27001, SOC 2, CSA STAR), control mapping to a framework such as the CCM, data location and residency, key and encryption options, incident transparency, SLA terms, financial viability and exit provisions.",
  "Define the criteria first, then collect evidence; certificates prove a scope, not suitability for your workload.")
f(C1, 'found', 'Common Criteria (ISO/IEC 15408)',
  "An international standard for evaluating the security of IT products against a security target, with results expressed as an evaluation assurance level from EAL1 to EAL7 and recognized across participating countries.",
  "It evaluates products, so a Common Criteria certified hypervisor does not certify the cloud service built on it.")
f(C1, 'found', 'FIPS 140-3 and FIPS 140-2',
  "FIPS 140 sets security requirements for cryptographic modules at four levels. FIPS 140-3 (2019) supersedes 140-2; after September 21, 2026, modules validated under 140-2 move to the Historical list and may be used only in existing systems.",
  "The outline still names 140-2; know both, and remember that validation applies to a specific module and version.")
f(C1, 'found', 'AI and ML for cloud threat detection and analysis',
  "Machine learning models learn normal behavior to flag anomalies in logs, identity activity and network flows, and can cluster alerts and prioritize them. Models need quality training data, tuning for false positives and human review of consequential actions.",
  "AI augments analysts; an automated block based on an unvalidated model is a risk in its own right.")
f(C1, 'found', 'Data source validation and verification for AI',
  "Checking that data feeding a model comes from trusted, authorized sources (validation) and that it is accurate, complete and unaltered (verification), using provenance records, hashes, schema and outlier checks.",
  "Untrusted or unverified inputs are the entry point for data poisoning.")
f(C1, 'found', 'Ethical concerns in AI',
  "Bias and unfair outcomes, lack of transparency and explainability, privacy intrusion, unclear accountability for automated decisions, and misuse such as deepfakes. Controls include diverse and reviewed data, human oversight, documentation and impact assessments.",
  "A security professional raises these as risks that need an owner, not as abstract philosophy.")
f(C1, 'found', 'AI regulation and frameworks',
  "The EU AI Act (Regulation (EU) 2024/1689) takes a risk-based approach with unacceptable, high, limited and minimal risk tiers. The NIST AI Risk Management Framework 1.0 organizes AI risk work into govern, map, measure and manage. ISO/IEC 42001 defines an AI management system.",
  "Know the structure of each, not the dates; the exam asks which approach fits a scenario.")

# ---- flashcards added in the August 2026 outline refresh: Domain 2
f(C2, 'life', 'Media sanitization levels: clear, purge and destroy',
  "NIST SP 800-88 Rev. 2 groups sanitization into clear (logical techniques such as overwriting that defeat simple recovery), purge (makes recovery infeasible even with laboratory techniques, including cryptographic erase) and destroy (physically ruining the media).",
  "Customers cannot destroy provider hardware, so in the cloud the realistic choices are overwriting where it is verifiable and cryptographic erase.")
f(C2, 'life', 'Overwriting and its limits in the cloud',
  "Overwriting writes patterns over stored data. On solid-state drives with wear leveling, and on virtualized or replicated storage, the customer cannot be sure every physical copy was overwritten, so overwriting alone gives weak assurance.",
  "Cryptographic erase sidesteps the problem, which is why it is the preferred answer for sanitization in shared storage.")
f(C2, 'life', 'Volume, raw and long-term storage',
  "Volume (block) storage attaches to an instance as a disk the customer's operating system formats. Raw storage maps a device or logical unit directly to a virtual machine, bypassing the file-system abstraction. Long-term (archive) storage is cheap with slow retrieval and often offers immutability settings. Ephemeral storage vanishes with the instance.",
  "Match the type to the requirement: durable and shared, high performance, or cheap and rarely read, and encrypt each according to its exposure.")
f(C2, 'life', 'Threats to cloud storage',
  "Misconfigured permissions and public buckets, leaked access keys, shared snapshots, data remanence after reallocation, weak or absent encryption, ransomware that deletes versions and backups, insider access at the provider and silent data corruption.",
  "Controls that map to these: private by default, encryption with customer keys, versioning and object lock, access logging and integrity checks.")
f(C2, 'life', 'Data security posture management (DSPM)',
  "Tooling that continuously discovers data stores across cloud accounts, classifies their content, maps who and what can reach them and flags exposure, so data location and risk stay current.",
  "It automates discovery and the data-location question; it does not replace DLP or encryption.")
f(C2, 'life', 'Discovery by data type',
  "Structured data is found through schemas and column scans; unstructured files need content inspection, pattern matching, OCR and machine-learning classifiers; semi-structured formats such as JSON, XML and logs are parsed for keys and values. Location comes from inventory, tags and scans.",
  "Each type needs a different technique, so one scanner rarely covers an estate.")
f(C2, 'life', 'Data mapping',
  "Documenting each data element with its source, systems, owner, purpose, location, recipients and legal basis. It is the foundation for data flow diagrams, residency decisions and the records of processing that privacy law expects.",
  "Mapping answers where data is; classification answers how sensitive it is; both are needed.")
f(C2, 'life', 'Data classification policy',
  "A policy that defines classification levels, who assigns them, the handling rules for each (storage, encryption, sharing, retention and disposal), and when labels are reviewed or downgraded.",
  "A policy without handling rules per level is only a labeling exercise.")
f(C2, 'life', 'IRM objectives: rights, provisioning and access models',
  "Data rights define what a recipient may do (view, edit, print, copy, forward, expire). Provisioning is how rights are issued and bound to users or groups. Access models decide who qualifies, such as roles, attributes or policy conditions like time and location.",
  "IRM extends access control beyond the first opening of the file.")
f(C2, 'life', 'IRM tools and challenges',
  "IRM relies on a policy server, client agents or plug-ins, and certificates or licenses that are issued to authorized users and revoked when access ends. Challenges include slow revocation for offline copies, format support, screen capture and key distribution.",
  "Revocation only works when the client checks back with the policy server.")
f(C2, 'life', 'Data obfuscation techniques',
  "Static masking creates a permanently altered copy; dynamic masking hides values at query time by role. Other techniques are substitution, shuffling, nulling, randomization, generalization and format-preserving tokens. Anonymization combines such steps until individuals cannot be re-identified.",
  "Pick static masking for test copies and dynamic masking for production views.")
f(C2, 'life', 'Data archiving procedures and mechanisms',
  "Archive in formats that remain readable for the whole retention period, plan for media and software obsolescence, protect integrity with hashes or immutable storage, keep decryption keys as long as the data, index for retrieval and test restores.",
  "An archive whose key was destroyed or whose format cannot be opened is a deletion by accident.")
f(C2, 'life', 'Data deletion procedures and mechanisms',
  "Deletion can be logical (marking data removed), overwriting, cryptographic erase or physical destruction by the provider. A real procedure also covers replicas, snapshots and backups, records proof of deletion and respects legal holds.",
  "Ask the provider for deletion evidence in the contract, because customers cannot witness destruction.")
f(C2, 'life', 'Legal hold mechanics',
  "A hold places relevant data in preservation by suspending lifecycle deletion and enabling retention locks, restricts access to authorized custodians, extends to backups and SaaS data, and ends only when counsel releases it.",
  "Document scope, custodians and release; a hold that silently fails is spoliation.")
f(C2, 'life', 'Event sources and event attributes',
  "Data events come from the management plane, identity provider, storage and database access, network flows, applications and endpoints. Useful attributes are who (identity), what action, when (synchronized time), where (IP address, geolocation, resource) and the outcome.",
  "An event missing identity or reliable time cannot support accountability or forensics.")
f(C2, 'life', 'Auditability, traceability and accountability',
  "Auditability is the ability to examine records and controls; traceability is following an action or data item from origin through its handling; accountability is attributing each action to a responsible identity who cannot plausibly deny it.",
  "They depend on unique identities, protected logs and time synchronization.")
f(C2, 'life', 'Non-repudiation',
  "Assurance that an actor cannot credibly deny an action, achieved with digital signatures made by a private key only the actor holds, trusted timestamps, tamper-evident logs, unique accounts and documented chain of custody.",
  "Shared accounts destroy non-repudiation however good the logging is.")
f(C2, 'life', 'AI dataset and model privacy',
  "Protect training data and prompts with minimization, redaction, access control and retention limits. Techniques such as differential privacy and federated learning reduce disclosure; models can memorize data, so membership inference and training-data extraction are privacy risks.",
  "Personal data used for training stays subject to privacy law even when it ends up inside weights.")
f(C2, 'life', 'AI dataset and model security',
  "Validate and verify datasets with provenance records, hashes and outlier checks to catch poisoning, and verify model artifacts with signing and scanning, including for unsafe serialization formats. Restrict the model registry, since weights are valuable intellectual property.",
  "Treat a model file like executable code from a supply chain.")

# ---- flashcards added in the August 2026 outline refresh: Domain 3
f(C3, 'infra', 'Cloud infrastructure components',
  "The physical environment (facilities, power, cooling), network and communications, compute, virtualization, storage and the management plane. Each layer has its own owner and controls, and the management plane governs all the rest.",
  "A complete risk review walks through all six layers and assigns each to the provider or the customer.")
f(C3, 'infra', 'Logical data center design: tenant partitioning',
  "Separating tenants logically with virtual networks, distinct accounts or subscriptions, per-tenant encryption keys and role-based access, so a mistake or compromise in one tenant cannot reach another. Dedicated hosts add physical separation where required.",
  "Partitioning is the logical answer to multi-tenancy; isolation evidence comes from the provider's audit reports.")
f(C3, 'infra', 'Physical data center design: location and buy or build',
  "Site choice weighs natural hazards, power and connectivity, political and legal climate, distance between sites and proximity to users. The buy, build or lease decision trades cost and control against speed and the ability to prove controls to auditors.",
  "Customers of public cloud rarely choose; they verify through reports and region selection.")
f(C3, 'infra', 'Environmental design: HVAC, fire suppression and pathways',
  "Cooling uses hot and cold aisle layouts and sensors, with ASHRAE recommending roughly 18 to 27 degrees Celsius at server inlets. Fire protection uses detection plus clean-agent or pre-action systems. Multi-vendor pathway connectivity means carriers enter by physically separate routes.",
  "Redundant carriers sharing one trench still share one failure point.")
f(C3, 'infra', 'Data center tiers',
  "The Uptime Institute rates sites from Tier I (basic capacity, commonly cited at 99.671 percent availability) through Tier II (99.741), Tier III (concurrently maintainable, 99.982) to Tier IV (fault tolerant, 99.995). Standards such as TIA-942 and ISO/IEC 22237 also describe facility design.",
  "Higher tiers mean redundant paths for power and cooling and the ability to maintain without downtime.")
f(C3, 'infra', 'Power and connectivity resilience',
  "Uninterruptible power supplies bridge outages until generators start; N+1 adds one spare unit, 2N duplicates the whole path. Resilient sites also use multiple carriers, redundant cooling and tested failover.",
  "Untested generators and shared fuel contracts are classic single points of failure.")
f(C3, 'resil', 'Quantitative risk analysis: SLE, ARO and ALE',
  "Single loss expectancy is asset value times exposure factor; annualized rate of occurrence is how often per year; annualized loss expectancy is SLE times ARO. A safeguard is worthwhile when the reduction in ALE exceeds its annual cost.",
  "Qualitative analysis ranks risks high, medium or low when numbers are unreliable.")
f(C3, 'resil', 'Qualitative and quantitative risk assessment',
  "Qualitative assessment rates likelihood and impact on scales and is fast and subjective. Quantitative assessment uses monetary values and probabilities and supports cost-benefit decisions but needs good data. Many programs combine them.",
  "Choose by the decision: ranking a backlog needs qualitative; funding a control needs numbers.")
f(C3, 'infra', 'Instance metadata service abuse',
  "A server-side request forgery flaw can make a workload fetch its own metadata service address and return temporary credentials for its role. Mitigations include the session-token version of the metadata service, least-privilege roles, egress filtering and input validation.",
  "The attack turns an application bug into cloud account access, so role scope matters.")
f(C3, 'infra', 'Common attacks on cloud infrastructure',
  "Account and credential hijacking, cryptojacking of stolen compute, exposed management interfaces, cross-tenant side-channel and escape attempts, volumetric denial of service and denial of wallet, where abuse inflates the metered bill.",
  "Detection ties to metering and baseline anomalies; prevention to identity and network controls.")
f(C3, 'infra', 'Physical and environmental protection',
  "Controls at the facility: perimeter and badge access, mantraps, cameras, visitor logs, locked cages, environmental sensors, fire suppression and secure equipment disposal. In the cloud the provider operates them and customers verify through reports; on-premises components stay the customer's task.",
  "Hybrid designs leave the customer responsible for the physical controls of its own site.")
f(C3, 'infra', 'System, storage and communication protection',
  "Protective controls for the technical stack: hardened and patched hosts, encrypted storage with managed keys, encrypted network paths, segmentation, boundary protection and denial-of-service defense, applied through policy as code.",
  "Frameworks such as NIST SP 800-53 group these as system and communications protection controls.")
f(C3, 'infra', 'Audit mechanisms: log collection, correlation and packet capture',
  "Collect management-plane, identity, flow and workload logs centrally, correlate events across sources to see attack chains, and use traffic mirroring or virtual taps for packet capture when content-level evidence is needed.",
  "Packet capture is costly and privacy-sensitive; reserve it for targeted investigations.")
f(C3, 'resil', 'Recovery service level',
  "The percentage of normal service capacity that must be available during recovery, for example running at half capacity after failover. It lets planners provision a smaller recovery environment.",
  "RSL complements RTO and RPO as the third recovery requirement from the BIA.")
f(C3, 'resil', 'BCDR plan testing types',
  "Read-through or checklist review, tabletop discussion, walkthrough, simulation, parallel test at the recovery site and full interruption test, in increasing realism and risk. Results feed plan updates.",
  "Full interruption proves recovery best but risks production, so most programs mix types.")

# ---- flashcards added in the August 2026 outline refresh: Domain 4
f(C4, 'app', 'OWASP Top 10:2025 categories',
  "In order: broken access control, security misconfiguration, software supply chain failures, cryptographic failures, injection, insecure design, authentication failures, software or data integrity failures, security logging and alerting failures, and mishandling of exceptional conditions.",
  "The 2025 edition added supply chain failures and exceptional conditions; broken access control stays first. It is an awareness list, not a pass mark.")
f(C4, 'app', 'OWASP Application Security Verification Standard (ASVS)',
  "A catalog of verifiable security requirements for web applications and services, grouped by topic and by three assurance levels, used to specify what to build and what to test. Version 5.0 is the current release.",
  "Use ASVS to turn 'be secure' into testable requirements, and the Top 10 to raise awareness.")
f(C4, 'app', 'OWASP API Security Top 10 (2023)',
  "Broken object level authorization, broken authentication, broken object property level authorization, unrestricted resource consumption, broken function level authorization, unrestricted access to sensitive business flows, server-side request forgery, security misconfiguration, improper inventory management and unsafe consumption of APIs.",
  "Broken object level authorization (changing an identifier to read another user's record) is first and the most common exam scenario.")
f(C4, 'app', 'OWASP Top 10 for LLM Applications (2025)',
  "Prompt injection, sensitive information disclosure, supply chain, data and model poisoning, improper output handling, excessive agency, system prompt leakage, vector and embedding weaknesses, misinformation and unbounded consumption.",
  "Map each to a control: validate output, limit agency and permissions, protect data, vet components and rate-limit.")
f(C4, 'app', 'CWE Top 25 (SANS/MITRE)',
  "An annual list of the most dangerous software weakness types such as cross-site scripting, injection and out-of-bounds writes, published by MITRE from vulnerability data and historically presented with the SANS Institute.",
  "CWE names a weakness class; CVE names a specific flaw in a product.")
f(C4, 'app', 'Cloud development basics and common pitfalls',
  "Good cloud practice uses stateless services, configuration outside code, managed identities and infrastructure as code. Common pitfalls are hard-coded secrets, over-permissive roles, public storage, trusting client input, unpatched dependencies and logging sensitive data.",
  "Training should target these concrete mistakes, because they cause most cloud breaches.")
f(C4, 'app', 'SDLC phases and business requirements',
  "Phases typically run requirements, design, coding, testing, deployment and maintenance. Security requirements come from business needs, regulation and data classification, then flow into design decisions and test cases.",
  "A missing business or regulatory requirement is the cheapest defect to fix and the costliest to find late.")
f(C4, 'app', 'Waterfall versus agile security',
  "Waterfall runs phases sequentially with gates and formal reviews; agile delivers in short iterations, so security must be built into stories, definition of done and automated tests. DevOps extends this to continuous delivery.",
  "Neither is inherently more secure; security fails when it is attached to only one gate or only the end.")
f(C4, 'app', 'DREAD risk rating',
  "A scoring model rating threats on damage, reproducibility, exploitability, affected users and discoverability, used to rank threats found by modeling. It is subjective and has been largely replaced by other scoring schemes.",
  "STRIDE finds threat types; DREAD ranks them.")
f(C4, 'app', 'ATASM threat modeling',
  "Architecture, threats, attack surfaces and mitigations: understand the architecture, list credible threats, map where attackers can reach it and choose mitigations for each surface.",
  "It starts from architecture and attack surface rather than from a list of threat categories.")
f(C4, 'app', 'PASTA threat modeling',
  "The Process for Attack Simulation and Threat Analysis is a seven-stage, risk-centric method that links business objectives, technical scope, application decomposition, threat analysis, vulnerability analysis, attack modeling and risk and impact analysis.",
  "Pick PASTA when the stem stresses business impact and attacker simulation.")
f(C4, 'app', 'SAFECode secure development practices',
  "The Software Assurance Forum for Excellence in Code publishes industry practices for secure development, covering design, secure coding, testing, vulnerability response and supply chain integrity.",
  "It is a practice guide from vendors; ASVS is the requirements catalog.")
f(C4, 'app', 'Software configuration management and versioning',
  "Tracking every change to code, configuration, infrastructure templates and dependencies in version control with reviews, branch protection, signed commits and tagged releases, so any build can be reproduced and traced.",
  "It underpins change control, audit and rollback.")
f(C4, 'app', 'Cloud-specific application risks',
  "Shared technology and isolation failures, provider insider threats, lack of visibility and control over the platform, legal and jurisdiction exposure and dependence on provider APIs. Design for them with encryption, logging, portability and clear data location.",
  "These risks differ from classic on-premises ones mainly in who controls the layers below the application.")
f(C4, 'app', 'Functional and non-functional testing',
  "Functional testing checks that features do what requirements say; non-functional testing checks qualities such as performance, availability, scalability and security. Both run in continuous integration and delivery pipelines.",
  "Security testing is non-functional, so a feature that passes functional tests can still be exploitable.")
f(C4, 'app', 'Black-box, gray-box and white-box testing',
  "Black-box testers have no knowledge of internals and attack from outside; white-box testers have source code and design; gray-box testers have partial knowledge such as credentials or an architecture diagram.",
  "SAST is a white-box technique and DAST is a black-box technique.")
f(C4, 'app', 'Quality assurance and secure code review',
  "Quality assurance verifies that software meets requirements before release, including security acceptance criteria. Peer and tool-assisted code review catch flaws early and spread secure coding knowledge.",
  "QA should include negative tests, not just happy paths.")
f(C4, 'app', 'Abuse case testing',
  "Writing and testing scenarios of how an attacker or careless user would misuse a feature, for example enumerating identifiers, replaying a coupon or flooding a reset endpoint, as the counterpart of use cases.",
  "Abuse cases come from threat modeling and become automated negative tests.")
f(C4, 'app', 'CI/CD pipeline security',
  "Pipelines hold powerful credentials and build the code that runs in production. Protect them with least-privilege short-lived credentials, protected branches, isolated build agents, secret scanning, signed artifacts and automated security gates.",
  "A compromised pipeline defeats every downstream control.")
f(C4, 'app', 'Third-party software management',
  "Inventory every external component and service, assess the vendor, review license and support terms, track vulnerabilities, restrict what the component can access and plan for its replacement or withdrawal.",
  "You inherit the risk of what you integrate; contracts and monitoring must say who fixes what.")
f(C4, 'app', 'Validated open-source software',
  "Use open-source components from trusted registries, pin and verify versions and hashes, check maintainer health and license terms, scan with software composition analysis and keep an internal mirror of approved packages.",
  "Copyleft licenses can impose obligations on your code; legal review belongs in the intake.")
f(C4, 'app', 'Artifact integrity and provenance',
  "Signing builds and recording provenance proves what was built, from which source and by which pipeline. Frameworks such as SLSA define levels of build integrity, and verification at deploy time blocks unsigned or tampered artifacts.",
  "Integrity and authenticity are the two supply chain properties the outline names.")
f(C4, 'app', 'XML firewall',
  "A gateway that inspects XML and SOAP traffic, validating schemas and blocking malformed or oversized messages and attacks such as XML external entity injection before they reach the service.",
  "Think of it as a specialized web application firewall for XML messages.")
f(C4, 'app', 'API gateway',
  "A front door for APIs that authenticates callers, enforces authorization, rate limits, validates requests, terminates TLS and logs traffic, giving one place to apply policy and measure use.",
  "It enforces policy at the edge; the service still needs its own authorization checks.")
f(C4, 'app', 'Sandboxing',
  "Running code in a restricted environment, such as a container, virtual machine or language runtime with limited permissions, so a compromise or untrusted file cannot affect the host or other workloads.",
  "Sandboxes are used for malware analysis, third-party plug-ins and untrusted uploads.")
f(C4, 'app', 'Application virtualization and orchestration',
  "Containers package an application with its dependencies; Docker builds and runs them and Kubernetes orchestrates scheduling, scaling and networking. Security work covers image provenance, runtime restrictions, secrets handling, cluster access and network policy.",
  "The orchestrator's control plane is as sensitive as the management plane of the cloud itself.")
f(C4, 'app', 'Load balancers and cryptography in application architecture',
  "Load balancers distribute traffic, hide back-end addresses and often terminate TLS, so certificate and cipher policy live there. Applications should use vetted libraries and managed key services rather than custom cryptography.",
  "Decide where TLS terminates and whether traffic behind the balancer is re-encrypted.")
f(C4, 'iam', 'Identity provider and service provider trust',
  "The identity provider authenticates users and issues signed assertions or tokens; the service provider (the application) trusts the provider's signature through metadata and certificates. Federation moves credentials out of each application.",
  "Compromise of the identity provider or its signing key compromises every federated application.")
f(C4, 'iam', 'User, privileged and service access in cloud design',
  "User access covers workforce and customer identities; privileged access needs stronger controls such as just-in-time elevation and session recording; service access gives workloads their own identities with short-lived credentials.",
  "Treat the three classes separately: they carry different risk and need different controls.")

# ---- flashcards added in the August 2026 outline refresh: Domain 5
f(C5, 'buildops', 'Secure by default configuration',
  "Standing up infrastructure with safe initial settings: deny-by-default networking, encryption on, unneeded services and ports off, default credentials removed and logging enabled, enforced by hardened images and policy.",
  "Defaults should be the secure state so a forgotten setting never exposes anything.")
f(C5, 'buildops', 'Hardware security configuration: HSM and TPM',
  "A hardware security module holds keys and performs cryptography in tamper-resistant hardware, so it needs access policy, firmware control and backup of key material. A trusted platform module anchors measured boot and remote attestation on a host, and must be enabled and provisioned.",
  "Know which one stores customer keys (HSM) and which one attests host integrity (TPM).")
f(C5, 'buildops', 'Management plane tools: installation and configuration',
  "Tools that provision and control the environment (consoles, command-line interfaces, orchestration and automation) need hardened hosts, multi-factor authentication, least-privilege roles, signed and current software and complete audit logging.",
  "Install them on controlled administrative hosts, never on personal machines.")
f(C5, 'buildops', 'Virtual hardware security configuration',
  "Harden virtual networks (segmentation and separate management networks), storage (encryption and access control), memory (no overcommit for sensitive tenants, guarded sharing) and CPU settings, and choose hypervisor type deliberately: Type 1 for production, Type 2 mainly on workstations.",
  "Disable unused virtual devices such as floppy, serial and clipboard sharing to shrink the attack surface.")
f(C5, 'buildops', 'Guest operating system virtualization toolsets',
  "Integration software installed in a guest, such as VMware Tools, Hyper-V integration services or cloud-init agents, improves drivers, time sync, shutdown and monitoring. It runs with high privilege and must be patched, trusted and sourced from the vendor.",
  "An outdated toolset is an attack path between guest and hypervisor.")
f(C5, 'buildops', 'Remote access: bastions, jump hosts and consoles',
  "Administrative access should pass through a hardened bastion or jump host, use SSH keys or certificates and multi-factor authentication, restrict RDP to the bastion, prefer session-managed or console access without open inbound ports, and record sessions.",
  "Exposing RDP or SSH directly to the internet is the classic finding.")
f(C5, 'buildops', 'Virtual LAN (VLAN) segmentation',
  "A VLAN divides one physical network into separate broadcast domains using tags, separating tenants, tiers or management traffic. VLANs are not encryption and misconfigured trunks allow VLAN hopping.",
  "Combine VLANs with firewall rules and, in clouds, with virtual network constructs.")
f(C5, 'buildops', 'DHCP security',
  "Rogue DHCP servers can hand out malicious gateways and resolvers, and clients can exhaust address pools. Controls include DHCP snooping on switches, port security and monitoring of lease logs.",
  "In public cloud the provider runs address assignment, but virtual networks you build still need the control.")
f(C5, 'buildops', 'DNS Security Extensions (DNSSEC)',
  "DNSSEC adds digital signatures to DNS records so resolvers can verify that answers are authentic and unmodified. It gives integrity and origin authentication but not confidentiality.",
  "It defends against cache poisoning; DNS over HTTPS or TLS provides privacy.")
f(C5, 'buildops', 'Virtual private networks (VPN)',
  "A VPN builds an encrypted tunnel across an untrusted network, using IPsec for site-to-site connections or TLS-based clients for remote users. It protects confidentiality in transit but extends the network to the endpoint, which is why zero trust access is replacing broad VPNs.",
  "A VPN is encrypted but a dedicated private link is not, unless you add encryption.")
f(C5, 'buildops', 'Honeypots and honeynets',
  "Decoy systems that look valuable but have no legitimate use, so any contact is suspicious. They reveal attacker techniques and give early warning with few false positives, but must be isolated so they cannot become a pivot.",
  "A honeypot detects and studies; it does not prevent attacks.")
f(C5, 'buildops', 'Baselines, CIS Benchmarks and STIGs',
  "A baseline is the approved secure configuration of a system. Consensus guidance such as the CIS Benchmarks and DISA STIGs provides starting settings for Windows, Linux and hypervisors, which are then monitored for drift and remediated.",
  "Baseline, monitor, remediate is the cycle the outline names for operating system hardening.")
f(C5, 'buildops', 'Clustered hosts and high availability',
  "Hosts joined in a cluster restart virtual machines elsewhere after a failure (high availability), balance load with distributed resource scheduling or dynamic optimization, and enter maintenance mode so workloads migrate before patching.",
  "Maintenance mode gives patching without downtime; reserved failover capacity makes HA work.")
f(C5, 'buildops', 'Storage clusters and guest OS availability',
  "Storage clusters replicate or stripe data across nodes so a disk or node failure causes no loss. Guest availability comes from redundant instances, health checks, autoscaling and monitoring of the operating system and its services.",
  "Cluster resilience does not replace backups, which protect against deletion and corruption.")
f(C5, 'buildops', 'Performance and capacity monitoring',
  "Track network throughput and latency, compute utilization, storage capacity and IOPS and application response time against thresholds and trends, to detect degradation and attacks such as denial of service and plan growth.",
  "Sudden capacity spikes can signal abuse such as cryptomining on stolen credentials.")
f(C5, 'buildops', 'Hardware monitoring',
  "Monitor disk health, processor load, fan speed, temperature and power in the underlying hosts, with alerts that trigger migration or replacement before failure.",
  "In public cloud the provider does this; in private or hybrid environments it is a customer duty.")
f(C5, 'buildops', 'Backup and restore configuration for hosts and guests',
  "Back up host configurations and guest images and data with defined frequency and retention, encrypt and isolate the backups, protect their credentials and test restores against the recovery objectives.",
  "A backup that has never been restored is unproven.")
f(C5, 'buildops', 'Management plane operations',
  "Scheduling, orchestration and maintenance functions, such as automated patch windows, scaling, workload placement and failover, act through privileged automation, so their roles, change approvals and logs need the same care as a human administrator.",
  "Automation accounts are powerful identities; restrict and monitor them.")
f(C5, 'buildops', 'NIST frameworks: CSF 2.0, SP 800-53 and the RMF',
  "The NIST Cybersecurity Framework 2.0 organizes outcomes into govern, identify, protect, detect, respond and recover. SP 800-53 Rev. 5 is the catalog of security and privacy controls, and the Risk Management Framework (SP 800-37) is the process for selecting, implementing and assessing them.",
  "CSF 2.0 added the Govern function; the framework is voluntary, while 800-53 is the control baseline for US federal systems.")
f(C5, 'buildops', 'ISO/IEC 27001, 27002 and 20000-1',
  "ISO/IEC 27001 specifies an information security management system and is certifiable; ISO/IEC 27002:2022 gives 93 controls in four themes (organizational, people, physical, technological); ISO/IEC 20000-1 specifies an IT service management system.",
  "27001 is the requirement you certify against; 27002 is guidance on the controls.")
f(C5, 'buildops', 'COBIT 2019',
  "ISACA's framework for governance and management of enterprise information and technology, using governance objectives and design factors to align IT with business goals and manage risk.",
  "COBIT governs and manages IT; ISO/IEC 27001 secures information; know which question each answers.")
f(C5, 'buildops', 'COSO internal control and enterprise risk frameworks',
  "The Committee of Sponsoring Organizations publishes the Internal Control Integrated Framework, widely used for financial reporting controls under Sarbanes-Oxley, and an Enterprise Risk Management framework linking risk to strategy and performance.",
  "COSO appears when scenarios mention financial reporting controls and audits.")
f(C5, 'buildops', 'CIS Critical Security Controls',
  "A prioritized set of 18 controls, such as inventory, access control, data protection and incident response, each made of specific safeguards and arranged into implementation groups IG1 to IG3 so smaller organizations start with essential hygiene.",
  "Use implementation groups to scale effort to organization size and risk.")
f(C5, 'buildops', 'ITIL 4 service management',
  "A framework of IT service management practices, including incident, problem, change, release, deployment, configuration, service level, availability, capacity and continuity management, built around a service value system and continual improvement.",
  "ISO/IEC 20000-1 is the certifiable standard that aligns with these practices.")
f(C5, 'ops', 'Communicating with relevant parties',
  "Operations needs defined channels and owners for vendors, customers, partners, regulators and other stakeholders, covering status, maintenance, incident and breach notices, with approved wording and contact lists prepared in advance.",
  "Legal and compliance approve external statements; engineers supply the facts.")
f(C5, 'ops', 'Forensic data collection methodologies',
  "Collect by order of volatility, capture memory and then disk, use snapshots, volume images and provider API exports, work on verified copies with write protection, hash every item and record every step.",
  "In the cloud collection depends on provider cooperation and the service model, so agree the process beforehand.")
f(C5, 'ops', 'Evidence management',
  "Identify, label, store and track evidence with unique identifiers, secured storage, access logs and documented transfers, so its integrity and handling can be demonstrated in court or to regulators.",
  "Admissibility depends on integrity, relevance and an unbroken chain of custody.")
f(C5, 'ops', 'Incident management versus problem management',
  "Incident management restores normal service quickly; problem management finds and removes the underlying cause to stop recurrence, often through root cause analysis and a known error record.",
  "Quick restoration is not the same as a fix; problems prevent repeat incidents.")
f(C5, 'ops', 'Release and deployment management',
  "Release management plans, schedules and controls what goes live, with testing and approvals; deployment management moves the approved build into environments, ideally through automated, repeatable and reversible pipelines.",
  "Both link to change management and need rollback plans.")
f(C5, 'ops', 'Configuration management and the CMDB',
  "Maintaining accurate records of configuration items and their relationships in a configuration management database, with controlled changes, so impact analysis, audits and incident response rely on truth rather than memory.",
  "Cloud assets change constantly, so discovery must feed the record automatically.")
f(C5, 'ops', 'Service-level management',
  "Defining, measuring and reporting service targets with customers (service level agreements) and with internal teams or suppliers (operational level agreements and underpinning contracts), and acting when targets are missed.",
  "Targets must be measurable; unmeasured promises cannot be enforced.")
f(C5, 'ops', 'Capacity and availability management',
  "Capacity management matches resources to current and forecast demand at acceptable cost; availability management designs and monitors to meet agreed uptime through redundancy, maintenance planning and fast recovery.",
  "Elastic scaling automates capacity but still needs budgets and limits to stop runaway cost.")
f(C5, 'ops', 'Continuity and information security management',
  "Continuity management ensures services can be restored after disruption using the business impact analysis and tested plans; information security management sets the policies and controls that protect confidentiality, integrity and availability.",
  "Both are management processes inside the service framework, not one-time projects.")

# ---- flashcards added in the August 2026 outline refresh: Domain 6
f(C6, 'legal', 'Conflicting international legislation',
  "A provider or customer operating across borders can face laws that clash, for example a government demand to disclose data that another country's privacy law forbids exporting. Counsel must resolve conflicts, using contracts, data location choices, encryption with customer-held keys and notice rights.",
  "There is rarely a perfect technical fix; the exam favors minimizing exposure and escalating to legal.")
f(C6, 'legal', 'Legal risks specific to cloud computing',
  "Unclear data location, multiple jurisdictions, subprocessors, loss of control over discovery and forensics, provider insolvency, third-party access demands and contracts that disclaim liability. Evaluate each against the data types and regulations involved.",
  "The customer remains accountable to the regulator for what the provider does with its data.")
f(C6, 'legal', 'ISO/IEC 27050 and CSA guidance for eDiscovery',
  "ISO/IEC 27050 is a multi-part standard for electronic discovery covering identification, preservation, collection, processing, review, analysis and production. CSA guidance adds cloud-specific points on provider cooperation, data location and the scope of custody.",
  "Cloud eDiscovery depends on contract terms that guarantee access and preservation.")
f(C6, 'legal', 'Forensic standards: ISO/IEC 27037, 27041, 27042 and 27043',
  "27037 covers identification, collection, acquisition and preservation of digital evidence; 27041 assures that an investigative method is suitable and adequate; 27042 covers analysis and interpretation of evidence; 27043 sets incident investigation principles and processes.",
  "Order them by the investigation: collect (27037), choose method (27041), analyze (27042), run the process (27043).")
f(C6, 'legal', 'Contractual versus regulated private data',
  "Regulated data (for example protected health information or personally identifiable information under law) carries statutory duties and penalties. Contractual data is protected by agreements such as payment card rules or customer confidentiality clauses, and breach brings contractual remedies.",
  "A single dataset can be both, so meet the stricter requirement.")
f(C6, 'legal', 'Health privacy: HIPAA and HITECH',
  "HIPAA's Privacy, Security and Breach Notification Rules protect protected health information held by covered entities and their business associates. The HITECH Act (2009) strengthened enforcement, extended direct liability to business associates and added breach notification; affected individuals must be told without unreasonable delay and within 60 days of discovery.",
  "A business associate agreement is required before a cloud provider handles PHI.")
f(C6, 'legal', 'FERPA',
  "The US Family Educational Rights and Privacy Act protects student education records and gives parents and eligible students rights of access and control over disclosure. Schools using cloud services must keep control through contracts.",
  "FERPA applies to education records, not to health or payment data.")
f(C6, 'legal', 'PIPEDA',
  "Canada's Personal Information Protection and Electronic Documents Act governs how private-sector organizations collect, use and disclose personal information, built on fair information principles such as consent, limiting use and accountability.",
  "Organizations remain accountable for personal data transferred to a processor, including abroad.")
f(C6, 'legal', 'India Digital Personal Data Protection Act',
  "India's Digital Personal Data Protection Act, 2023 governs processing of digital personal data, built on consent and notice, obligations on data fiduciaries and rights for data principals, with a Data Protection Board to enforce it.",
  "Know the vocabulary: fiduciary corresponds roughly to controller, principal to data subject.")
f(C6, 'legal', 'Jurisdictional differences in privacy law',
  "Laws differ in scope, consent rules, transfer limits, breach deadlines and penalties; some apply based on where data subjects live, others on where the organization operates. A global service must map each applicable regime to the data it holds.",
  "Pick the strictest common denominator when designing controls for multiple regimes.")
f(C6, 'legal', 'Generally Accepted Privacy Principles (GAPP)',
  "A privacy framework from the AICPA and CICA built on ten principles: management, notice, choice and consent, collection, use, retention and disposal, access, disclosure to third parties, security for privacy, quality, and monitoring and enforcement.",
  "GAPP underlies the privacy criteria used in SOC 2 reporting.")
f(C6, 'legal', 'Privacy impact assessment (PIA)',
  "A structured review done before launching or changing a system to identify privacy risks to individuals and the controls that reduce them. The GDPR's formal version is the data protection impact assessment, required for high-risk processing.",
  "Run it at design time; findings change the design.")
f(C6, 'legal', 'Assurance challenges of virtualization and cloud',
  "Auditors cannot inspect hypervisors or physical sites, resources are dynamic and shared, scope boundaries between provider and customer blur and evidence comes from logs and provider reports. Assurance relies on contracts, certified reports and continuous monitoring.",
  "Plan audits around evidence the customer can actually obtain.")
f(C6, 'legal', 'SSAE 18, ISAE 3402 and ISAE 3000 reports',
  "SSAE 18 is the US attestation standard behind SOC reports; ISAE 3402 is the international standard for reports on controls relevant to financial reporting, equivalent in role to SOC 1; ISAE 3000 covers other assurance engagements and underlies SOC 2 style reports abroad.",
  "Match geography and purpose: financial reporting controls or trust criteria.")
f(C6, 'legal', 'Restrictions of audit scope statements',
  "A report covers only the services, systems, locations, subservice organizations and period named in the scope statement, and often excludes customer-side controls. Reading the scope and the user-entity controls tells you what is not assured.",
  "A clean opinion on one service says nothing about another service from the same provider.")
f(C6, 'legal', 'Gap analysis and risk and control self-assessment',
  "Gap analysis compares current controls and baselines with a target standard to find shortfalls. Risk and control self-assessment has control owners evaluate their own risks and controls, then validates the results independently.",
  "Use gap analysis before an audit and self-assessment to keep control ownership close to the business.")
f(C6, 'legal', 'Internal ISMS and internal control system',
  "An information security management system is the organization's own set of policies, roles, risk processes and controls under ISO/IEC 27001. A cloud adopter extends its ISMS to cover providers, with internal and external audits testing it.",
  "Cloud use should appear in the ISMS scope, risk register and statement of applicability.")
f(C6, 'legal', 'Policies: organizational, functional and cloud computing',
  "Organizational policies set top-level direction, functional policies address areas such as access control or encryption, and a cloud computing policy governs acceptable services, data classes allowed, approval and exit. Standards and procedures implement them.",
  "A cloud policy stops shadow IT by defining who may buy what.")
f(C6, 'legal', 'Identifying and involving stakeholders',
  "List and engage the parties affected by cloud decisions: business owners, legal, privacy, risk, security, IT, procurement, audit, the provider and regulators, with defined roles for approval and communication.",
  "Missing the right stakeholder is a typical root cause of compliance surprises.")
f(C6, 'legal', 'NERC CIP',
  "North American Electric Reliability Corporation Critical Infrastructure Protection standards set mandatory cybersecurity requirements for entities operating the bulk electric system, covering asset identification, access control, monitoring, incident response and recovery.",
  "Using cloud for regulated electric-sector systems demands careful scoping and evidence.")
f(C6, 'legal', 'PCI DSS',
  "The Payment Card Industry Data Security Standard, currently version 4.0.1, sets twelve requirements for protecting cardholder data, validated by assessors or self-assessment depending on volume. Cloud customers keep PCI duties and need the provider's responsibility matrix.",
  "Tokenization shrinks scope, but it does not remove the duty to be compliant.")
f(C6, 'legal', 'Sarbanes-Oxley (SOX)',
  "A US law requiring public companies to maintain and report on internal controls over financial reporting. Cloud systems that touch financial data fall in scope and often rely on SOC 1 reports from providers.",
  "SOX is about financial reporting integrity, not general privacy.")
f(C6, 'legal', 'Impact of distributed IT',
  "Spreading systems across regions, providers and countries multiplies the legal jurisdictions, time zones, languages and support models involved, complicating residency, incident coordination, audit and contract enforcement.",
  "Control with a data location policy, regional architecture and a governance model.")
f(C6, 'legal', 'Cloud impact on enterprise risk management',
  "Cloud shifts risk from capital to operating, adds provider and concentration risk, changes visibility and control and requires the enterprise risk program to include provider assessments, risk appetite statements for cloud and monitoring of key risk indicators.",
  "Cloud risk belongs in the enterprise risk register with an owner.")
f(C6, 'legal', 'Risk frameworks',
  "Common frameworks include ISO 31000 (principles and process), the NIST Risk Management Framework (SP 800-37), COSO Enterprise Risk Management, ISO/IEC 27005 for information security risk and the ENISA cloud risk assessment guidance.",
  "Know which is general (ISO 31000) and which is system-focused (NIST RMF).")
f(C6, 'legal', 'Risk metrics and key risk indicators',
  "Key risk indicators measure the exposure that predicts trouble, such as the number of public storage buckets, unpatched critical vulnerabilities, overdue access reviews or vendors without current audit reports.",
  "Good metrics are measurable, tied to risk appetite and trigger action when thresholds are crossed.")
f(C6, 'legal', 'Assessing the risk environment',
  "Evaluate risk at several levels: the specific service, the vendor, the supporting infrastructure and the business process it supports, and combine them into a risk profile compared with the organization's appetite.",
  "A strong vendor can still host a risky service if configured poorly.")
f(C6, 'legal', 'Risk sharing',
  "Risk sharing splits the consequence with another party by contract, joint ventures or pooled insurance, whereas transfer moves the financial impact entirely. Both leave accountability with the organization.",
  "The outline lists avoid, mitigate, transfer, share and accept as separate treatments.")
f(C6, 'legal', 'Master service agreement and statement of work',
  "A master service agreement sets the general legal terms between customer and provider; a statement of work defines specific deliverables, scope, timeline and fees under it; the SLA sets measurable service levels and remedies.",
  "Order of precedence matters when the documents conflict, so state it in the contract.")
f(C6, 'legal', 'Vendor viability, lock-in and escrow',
  "Assess a provider's financial health, ownership and dependence on subcontractors. Source code, configuration or data escrow with a neutral party protects the customer if the vendor fails, and exit plans address lock-in.",
  "Escrow helps for software and custom platforms; for public cloud, data portability matters more.")
f(C6, 'legal', 'Contract terms: termination, litigation and data ownership',
  "Cover termination rights and data return and deletion, notice periods, liability caps, litigation and legal hold support, right to audit, data ownership staying with the customer, breach notification, subprocessor control and cyber risk insurance requirements.",
  "Write exit terms before signing, because leverage disappears after migration.")
f(C6, 'legal', 'Regulatory transparency requirements',
  "Duties to disclose, such as breach notification (GDPR within 72 hours to the authority), financial reporting controls under Sarbanes-Oxley and records of processing. Contracts must make the provider supply the facts and timelines needed to meet them.",
  "The provider's notice period must be shorter than the customer's legal deadline.")
f(C6, 'legal', 'Assessing a provider risk management program',
  "Review the provider's risk methodology, control framework, policies, risk profile and appetite, independent audit results and history, and compare them with your own requirements before and during the relationship.",
  "Due diligence happens before signing; ongoing assessment is due care.")

# ---- questions added in the August 2026 outline refresh: Domain 1
mc(C1, 'found', "A university wants its agency partners to resell a managed analytics service under their own brand, adding billing and support. The partners contract with the provider but the university's student data flows through the platform. Which statement about accountability is MOST accurate?",
   "The university remains accountable to regulators for the student data, whatever the reseller adds",
   ["The reseller becomes the legal owner of the data once it adds billing and support", "Accountability passes to the provider once the reseller contract is signed, because the agency only resells the service", "Accountability is split evenly among the university, the reseller and the provider because each handles the data"],
   "Brokers and resellers add value or convenience but do not take over the data owner's regulatory accountability. Ownership does not move by reselling, the provider is a processor or custodian rather than the accountable owner, and an even split is not how accountability works.",
   "Role vocabulary (partner, broker, regulator) is part of the reference architecture and is tested through accountability scenarios.")
mc(C1, 'found', "A security architect reviews a proposed design and asks, for each activity in the reference architecture, which role performs it, so that every control has an owner. What is the PRIMARY benefit of this exercise?",
   "It exposes controls that nobody owns before the service goes live",
   ["It allows the customer to hand the operation of every control to the provider and stop reviewing them", "It proves the provider holds a current ISO certificate", "It removes the need for a written contract, because the activity mapping already records each duty"],
   "Mapping activities to roles is a responsibility checklist: a control with no owner is a gap. It does not transfer duties to the provider, does not evidence certification and does not replace a contract.")
mc(C1, 'found', "A company is comparing two designs. Design one uses compute instances the company patches. Design two uses a managed function service where the company supplies only code. Which statement BEST compares the responsibility for operating system patching?",
   "In the second design the provider patches the host, while the company still owns function permissions and code",
   ["Both designs leave host patching to the customer, because compute services are always customer-managed in every model", "In the first design the provider patches the guest operating system because it owns the hardware", "Neither design requires any patching by the company, because cloud resources are kept secure by the provider by default"],
   "Serverless pushes host operating system patching to the provider; the customer keeps permissions, code, dependencies and data. In the first design the guest operating system is the customer's job, and cloud does not remove patching.")
mc(C1, 'found', "A consultant reviews a company's cloud risk register and notes that most of the 'top threats' it lists concern misconfiguration, weak identity controls and insecure APIs rather than provider breaches. Which conclusion follows MOST directly?",
   "Governance, change control and identity management on the customer side deserve the most attention",
   ["The provider's hypervisor is the most likely entry point for attackers", "Encryption of all stored data would remove the listed risks entirely, so no other control needs attention", "Moving to a private cloud eliminates these threat categories, because the listed threats occur only in public clouds"],
   "Industry threat reports consistently rank misconfiguration, identity and API weaknesses at the top, which are customer-side concerns managed through change control and access governance. The hypervisor is rarely the entry point, encryption does not fix misconfiguration and private clouds still have configuration and identity risk.",
   "Tests recognition of where real cloud incidents originate.")
mc(C1, 'found', "A decommissioned virtual disk volume must be sanitized before the cloud account is closed. The team cannot access the provider's hardware and the data is encrypted with a customer-managed key. Which approach gives the HIGHEST assurance?",
   "Destroy every copy of the key and document the destruction",
   ["Overwrite the volume once from within the virtual machine", "Delete the volume through the console and trust the status message", "Ask the provider to reformat the volume without evidence"],
   "Cryptographic erase is the purge-level technique available to customers on shared storage. Overwriting from a guest cannot reach wear-leveled or replicated copies, console deletion is logical, and an unevidenced reformat gives no proof.")
mc(C1, 'found', "A multinational wants to ensure engineers can only create resources in two approved regions to honor data residency promises. Which control MOST directly enforces this?",
   "A policy that denies resource creation outside the approved regions at the account level",
   ["Training engineers on the residency policy at onboarding and trusting them to follow it for each deployment", "An alert that reports resources in other regions after a week", "Encryption of all data with provider-managed keys, which hides content from outsiders but not from the platform"],
   "A preventive guardrail enforced centrally blocks the violation; training and delayed alerts only detect or hope, and provider-managed encryption does not constrain location.")
mc(C1, 'found', "A finance director asks whether to buy a new intrusion detection subscription. Expected annual loss from the targeted threat is 80000 and the control would cut it to 30000 for an annual cost of 20000. What is the BEST conclusion?",
   "Approve it, because the annual loss reduction exceeds its annual cost",
   ["Reject it, because the residual annual loss is still above zero", "Reject it, because the control costs more than the remaining loss", "Defer it, because a control must remove the whole risk to be worthwhile"],
   "The reduction of 50000 exceeds the 20000 cost, so the safeguard has positive value. Perfect risk removal is not required, and the cost is compared with the avoided loss, not with the residual loss.",
   "Applies cost-benefit reasoning from the BIA and risk topics.")
mc(C1, 'found', "Two cloud providers both offer an acceptable SLA. The architect wants a first-pass evaluation that is objective rather than based on presentations. What should she do FIRST?",
   "Define the security and compliance criteria, then compare each provider's evidence against them",
   ["Choose the provider with the larger market share, since popularity indicates that its controls have been proven", "Ask each provider to submit its own ranking of its strengths and choose the highest self-score", "Select the cheaper option and review security after migration"],
   "Evaluation starts with criteria derived from business and regulatory requirements; evidence such as audit reports and certifications is then compared. Market share, self-ranking and post-migration review do not verify requirements.")
mc(C1, 'found', "A procurement team notes that a provider's hypervisor holds a Common Criteria certification at a high assurance level. How should the architect interpret this?",
   "It evaluates that product against a stated security target and does not certify the entire cloud service",
   ["It proves every customer workload on the platform is secure", "It replaces the need for a SOC 2 report on the service, because both assess the same scope and criteria", "It confirms that the provider meets every privacy regulation applicable to the customer's workloads"],
   "Common Criteria evaluates products against a security target, so it supports one component's assurance. It cannot vouch for customer workloads, replace service-level audit reports or establish privacy compliance.",
   "System and product certifications are a named part of provider evaluation.")
mc(C1, 'found', "A cloud customer requires that cryptographic keys be generated in validated hardware. A vendor presents a certificate for a FIPS 140-2 validated module that was issued in 2019. What is the MOST appropriate next step?",
   "Confirm the exact module and version are validated, check its status and plan for FIPS 140-3",
   ["Accept it as sufficient, because FIPS 140 validation applies to a provider as a whole organization", "Reject it outright, because FIPS 140 applies only to software libraries and never to hardware modules", "Ignore the date because validation never changes"],
   "Validation is specific to a module, version and operating environment, and 140-2 modules moved to the Historical list in September 2026 (usable only in existing systems), so replacement under 140-3 should be planned. FIPS 140 covers hardware and software modules, not whole providers, and status does change.")
mc(C1, 'found', "A security team deploys a machine learning model that scores sign-in events and automatically blocks accounts above a threshold. Which risk deserves the MOST attention before enabling automatic blocking?",
   "False positives locking out legitimate users when the model is not validated against real traffic",
   ["The model cannot be hosted in a cloud environment because training data must stay on premises", "Machine learning cannot analyze identity logs because they contain too little structured information", "Automated blocking decisions are prohibited in every jurisdiction, so the model can only report"],
   "Unvalidated models cause false positives and false negatives; consequential actions need testing, tuning and human review. Models can run in the cloud, can analyze identity logs and are not generally prohibited.")
mc(C1, 'found', "A bank trains a fraud model using transaction data pulled from a partner's shared storage. An analyst notices that some records look unusual and cannot say where they came from. Which control would have BEST reduced the risk of poisoned training data?",
   "Verifying data provenance and integrity before the data enters the training pipeline",
   ["Increasing the number of training epochs so that the model averages out any bad records", "Encrypting the finished model at rest, which protects the file but not the data it learned from", "Moving training to a larger compute instance so poisoned records are diluted by the extra capacity"],
   "Provenance and integrity checks catch tampered or untrusted data at the entry point. More training, encrypting the output and bigger instances do nothing about bad inputs.")
mc(C1, 'found', "An organization plans a customer-facing system that uses a high-risk automated decision about loan eligibility. Which activity is MOST consistent with responsible AI governance?",
   "Assess bias and impact, document the model's purpose and keep human oversight of decisions",
   ["Keep the model logic secret from internal risk and compliance teams to protect intellectual property", "Remove all logging to protect customer privacy", "Rely on the provider's published marketing claims of fairness instead of testing outputs for the use case"],
   "Impact and bias assessment, documentation and human oversight are core to ethical and regulatory expectations such as the EU AI Act's high-risk duties. Secrecy from risk teams, removing logs and trusting marketing undermine accountability.")
ms(C1, 'found', "Which TWO statements about the NIST AI Risk Management Framework and the EU AI Act are accurate? (Choose two.)",
   ["The NIST framework organizes AI risk work into govern, map, measure and manage", "The EU AI Act classifies AI systems into risk tiers with stricter duties for higher risk"],
   ["The EU AI Act applies only to organizations established in the United States", "The NIST framework is a binding law with fines for non-compliance", "Both documents prohibit the use of cloud platforms for AI"],
   "The NIST framework is voluntary guidance with four functions. The EU AI Act is a regulation with a risk-based structure that can reach providers and deployers outside the EU when systems are used there. Neither bans cloud use.")
ms(C1, 'found', "Which TWO design measures best support ephemeral computing without losing investigative ability? (Choose two.)",
   ["Shipping logs to a protected central store before instances terminate", "Automating snapshot capture of a suspect instance before it is replaced"],
   ["Allowing administrators to patch instances manually in place", "Storing evidence on the instance's local disk", "Disabling logging to reduce cost"],
   "Short-lived resources disappear with their local state, so evidence has to leave first through central logging and automated capture. Manual in-place changes defeat immutability, local disks vanish and disabled logs leave nothing to investigate.")
ms(C1, 'found', "Which THREE items are valid inputs when evaluating a cloud service provider against criteria? (Choose three.)",
   ["Independent audit reports and certifications with their scope statements", "Data location, key management and exit terms in the contract", "The provider's incident history and breach transparency"],
   ["The number of followers the provider has on social media", "A competitor's opinion of the provider"],
   "Evaluation depends on verifiable evidence: scoped audit reports, contract terms and incident record. Popularity and competitor opinions are unverified.")
tf(C1, 'found', "The ISO/IEC 17788 cloud service partner role includes sub-roles such as the service developer, auditor and service broker.", True,
   "Partners support either customer or provider; the outline lists customer, provider, partner, broker and regulator as the roles to know.")
tf(C1, 'found', "A Common Criteria certificate for a product proves that a cloud service built on it meets every customer requirement.", False,
   "It evaluates the product against its security target only, not a whole service or a customer's workload.")
tf(C1, 'found', "FIPS 140-2 validated modules remain acceptable for new federal systems without limit, because FIPS 140-3 is optional.", False,
   "FIPS 140-3 supersedes 140-2, and after September 21, 2026 modules validated only under 140-2 are on the Historical list for existing systems.")
tf(C1, 'found', "The outline expects a CCSP to weigh ethical concerns and regulatory requirements when comparing AI and machine learning options.", True,
   "AI and ML appear in the outline in cloud design, data protection and operations, including ethics, validation of data sources and regulation.")
tf(C1, 'found', "Geofencing by IP geolocation is a complete control for data residency because it cannot be bypassed.", False,
   "Geolocation can be spoofed or routed around; combine regional policies, identity controls and encryption.")

# ---- questions added in the August 2026 outline refresh: Domain 2
mc(C2, 'life', "A team stores training images for a model in a volume attached to a virtual machine and in an object bucket, and archives older sets to a cold tier. Which pairing of storage type and primary exposure is MOST accurate?",
   "Object bucket: public access through misconfigured permissions",
   ["Cold archive tier: high exposure to latency spikes during live queries", "Attached volume: unlimited public exposure through bucket policy", "Object bucket: loss of all data when the instance restarts"],
   "Object stores are accessed through APIs and policies, so permission mistakes are the classic exposure. Archive tiers trade retrieval speed for cost, volumes have no bucket policy and object data survives instance restarts, unlike ephemeral storage.")
mc(C2, 'life', "A data protection team must find where regulated records sit across hundreds of cloud accounts, including spreadsheets, a document database and application logs in JSON. Which approach is MOST suitable?",
   "Use discovery that combines schema scans, content inspection and parsing of semi-structured formats",
   ["Rely only on column names and table descriptions in the relational database to find sensitive data", "Ask each team to email a list of what it believes it stores and take those lists as complete", "Scan only the file shares because logs never hold personal data"],
   "Different data types need different techniques, and continuous automated discovery covers the estate. Column names miss content, self-reporting is incomplete and logs often contain personal data.")
mc(C2, 'life', "A hospital's data map shows a patient portal copying records to an analytics bucket in another country. The privacy officer wants to know the lawful basis and retention for that flow. Which artifact BEST supports this?",
   "A data map recording sources, owners, purposes, locations and legal basis for each element",
   ["A network diagram that shows IP address ranges and firewall rules for every environment", "The provider's physical data center audit report, which describes facilities rather than data flows", "A list of users who hold administrator rights across the environments that process the data"],
   "Data mapping ties each element to its purpose, location and legal basis. Network diagrams, facility reports and administrator lists do not answer lawful basis or retention.")
mc(C2, 'life', "An engineering firm shares design files with a subcontractor and must be able to stop that subcontractor from printing or forwarding the files and to withdraw access at the end of the contract. Which control fits BEST?",
   "Information rights management with a policy server that can revoke licenses",
   ["Data loss prevention at the corporate email gateway, which inspects outbound mail but cannot reach a copied file", "Static data masking applied to the files before sharing, which cannot be undone once the file is out", "A much longer password on the shared folder, given only to the external party"],
   "IRM protects the file itself, controls actions such as printing and forwarding and can revoke access. DLP governs egress, masking alters content irreversibly and a password does not control use or revocation.")
mc(C2, 'life', "A company discovers that revoking an IRM license for a contractor did not stop the contractor from opening a copy previously downloaded to a laptop that stays offline. Which limitation does this illustrate?",
   "Revocation takes effect only when the client next checks with the policy server",
   ["IRM cannot protect files stored in cloud storage because the policy server must sit in the same network", "IRM licenses can never be revoked once they have been issued to a recipient's device", "IRM works only on files smaller than a megabyte, so large documents need a different control"],
   "Offline copies can remain usable until the agent contacts the policy server, so use short license lifetimes for sensitive material. IRM does protect cloud-stored files and licenses can be revoked.")
mc(C2, 'life', "A records manager moves seven-year financial archives to a cold tier encrypted with a key that is rotated and the old versions destroyed after one year. Five years later the archives cannot be opened. What went wrong?",
   "The key lifecycle was not aligned with the retention period of the data it protects",
   ["Cold tier storage cannot hold encrypted data, so the files were silently damaged in the move", "Encryption should never be used for archives, because encrypted files cannot be preserved for years", "The files were too old for any cloud service to read, since formats expire after about five years"],
   "Archive keys must survive as long as the data; destroying old key versions effectively deleted the archive. Encrypted archives are normal, and age alone does not make files unreadable.")
mc(C2, 'life', "An investigation requires proof that a privileged user in a SaaS tool exported a customer list on a specific date from an unfamiliar country. Which log attributes matter MOST?",
   "Unique identity, action, synchronized timestamp and source IP address with geolocation",
   ["Only the name of the application server that wrote the log entry and the log file size", "The color theme and display language configured on the user's account profile", "The total number of log lines written per day and the average line length"],
   "Accountability needs who, what, when and where, with reliable time. Server names alone, cosmetic settings and counts do not attribute an action.")
mc(C2, 'life', "A company wants a signed contract approval to be undeniable later. Which combination BEST provides non-repudiation?",
   "A digital signature using a private key only the signer controls, plus a trusted timestamp",
   ["A shared team account and a free-text comment field recording who agreed to the change", "A hash of the document, stored in the same folder and readable by every editor", "An email that states the approver's name, kept in the approver's own mailbox"],
   "Signatures from a private key held solely by the signer with a trusted time prove origin and integrity and resist denial. Shared accounts, an unsigned hash next to the file or a plain email can all be disputed.")
mc(C2, 'life', "A data science team fine-tunes a language model on customer support emails, and testing shows the model sometimes reproduces customer phone numbers in answers. Which action addresses the root cause MOST directly?",
   "Redact or minimize personal data in the training set before fine-tuning and test for memorization",
   ["Increase the model's response length limit so users receive fuller and more varied answers", "Move the model to a different region so that the records are no longer near their source", "Encrypt the training emails in transit only, and then use them unchanged for fine-tuning"],
   "Memorization of personal data comes from what was trained on, so minimization, redaction and extraction testing are the controls. Response length, region and in-transit encryption do not stop leakage from weights.")
mc(C2, 'life', "A research group downloads a pre-trained model file from a public registry and loads it directly into a production training pipeline with broad cloud permissions. Which risk is MOST significant?",
   "The model file may contain malicious code executed on load, so it should be scanned and verified first",
   ["The model will be unable to use any graphics processors, which makes it too slow to run safely", "The registry will charge a fee for each download", "The model's accuracy will decrease automatically over time, so it must be retrained each month"],
   "Model artifacts can embed executable code through unsafe serialization and arrive from untrusted sources; verification, scanning and sandboxed loading mitigate it. The other statements are unrelated to the security risk.")
mc(C2, 'life', "A legal team places a hold on mailbox data in a SaaS platform whose retention policy deletes items after 90 days. What is the MOST important step to make the hold effective?",
   "Apply a retention lock or hold that overrides the automatic deletion rule for the relevant custodians",
   ["Export the mailboxes to local drives and turn off logging", "Tell custodians to stop using email until the matter closes, relying on them to keep their messages", "Wait for the deletion job to run, then restore the items from backup if anyone asks for them"],
   "A hold must suspend automatic deletion at the platform. Local exports without governance, asking users to stop work and relying on restores risk spoliation.")
ms(C2, 'life', "Which TWO statements about media sanitization in a cloud context are accurate? (Choose two.)",
   ["Cryptographic erase is a purge-level technique when strong encryption and key destruction are applied", "Overwriting alone gives weak assurance on virtualized and solid-state storage"],
   ["Customers can physically destroy the provider's disks on request", "Console deletion always proves that every replica was erased", "Clear, purge and destroy all require physical access to media"],
   "NIST SP 800-88 treats cryptographic erase as a purge technique, while overwriting cannot be verified across replicas and wear-leveled flash. Customers cannot destroy provider hardware, and logical deletion is not proof.")
ms(C2, 'life', "Which TWO controls MOST directly mitigate the threat of ransomware deleting versions and backups in cloud storage? (Choose two.)",
   ["Immutable object lock or retention on backup data", "Separate credentials and accounts for the backup repository"],
   ["Public read access on backup buckets", "A single administrator account shared by production and backup", "Disabling object versioning to save cost"],
   "Immutability and credential separation keep attackers from erasing recovery points. Public access, shared admin credentials and no versioning make loss easier.")
ms(C2, 'life', "Which THREE are data rights or provisioning concepts in information rights management? (Choose three.)",
   ["Permissions such as view, print, copy and forward", "Expiration dates attached to a license", "Binding rights to users or groups through issued certificates"],
   ["Increasing the file's compression ratio", "Replacing the document with random tokens"],
   "IRM defines what recipients may do, when rights expire and how they are issued to identities. Compression and tokenization are unrelated mechanisms.")
tf(C2, 'life', "Data mapping and data classification are the same activity and one can replace the other.", False,
   "Mapping records where data is, who owns it and how it flows; classification rates its sensitivity. Both are needed.")
tf(C2, 'life', "Raw device mapping bypasses the hypervisor's file-system abstraction, so data left on reallocated raw devices is a remanence risk.", True,
   "Raw storage gives direct device access, which is why sanitization and encryption matter before the device is reused.")
tf(C2, 'life', "A digital signature alone provides confidentiality for the signed document.", False,
   "Signatures give integrity, authentication and non-repudiation; confidentiality requires encryption.")
tf(C2, 'life', "Personal data used to train a model is exempt from privacy law once it has been absorbed into the model weights.", False,
   "Models can memorize and disclose training data, and privacy duties follow personal data through the training process.")
tf(C2, 'life', "Archive keys should be kept for as long as the archived data must remain readable.", True,
   "Destroying the key before retention ends makes the archive unreadable, which can breach retention duties.")
tf(C2, 'life', "Dynamic data masking permanently alters the stored data so the original values cannot be recovered.", False,
   "Dynamic masking changes only what a query returns by role; the stored values remain. Static masking produces an altered copy.")

# ---- questions added in the August 2026 outline refresh: Domain 3
mc(C3, 'infra', "A regulated customer wants assurance that two network carriers serving a colocation site would both survive a single construction accident outside the building. Which design feature matters MOST?",
   "The carriers' cables enter the building by physically separate routes",
   ["Both carriers terminate on the same patch panel, which simplifies management and cabling", "The carriers share one conduit into the building, which keeps installation costs low", "Both carriers are chosen from the same parent company to simplify contracts and billing"],
   "Multi-vendor pathway connectivity only adds resilience when the paths are physically diverse. A shared conduit, a shared parent or a single termination point leaves one failure point.")
mc(C3, 'infra', "A cloud workload is allowed to continue running during a planned power maintenance in the data center without any customer interruption. Which facility characteristic does this describe?",
   "Concurrent maintainability, as in a Tier III design",
   ["A single power path with a generator that is tested yearly", "Basic capacity with no redundant components, as in a Tier I design", "A design that tolerates failure only by shutting down the load"],
   "Concurrently maintainable sites can take components out of service without shutting down IT load. Tier I has no redundancy, and single paths or shutdown-based maintenance interrupt service.")
mc(C3, 'infra', "A provider's site has two utility feeds, battery systems and generators, and every component has one spare available. Which description fits this redundancy level?",
   "N+1",
   ["2N with a fully duplicated independent path", "N with no spare components", "A shared single feed with surge protection"],
   "N+1 means the required capacity plus one spare component. 2N duplicates the entire path and N has no spare.")
mc(C3, 'infra', "A company is deciding whether to build its own data center, lease colocation space or use public cloud regions for a new analytics platform that must be live in six weeks. Which factor argues MOST strongly against building?",
   "The time and capital needed to construct and certify a facility exceed the deadline",
   ["Colocation space can never support encryption, so regulated data cannot be placed in it at all", "Public cloud prohibits the use of access control, so data requiring control must be hosted privately", "Building always costs less than any other option once depreciation over twenty years is counted"],
   "Building takes long lead times and capital and requires proving controls to auditors. Colocation and cloud support encryption and access control, and building is rarely cheaper at small scale.")
mc(C3, 'infra', "A cloud web application has a server-side request forgery flaw. An attacker uses it to query the workload's local metadata address and obtains temporary credentials for the instance role. Which mitigation reduces the impact MOST effectively?",
   "Use the session-token version of the metadata service and give the role only the permissions it needs",
   ["Increase the instance size so the workload can absorb the larger number of malicious requests", "Move the application to a different availability zone so the attacker's request is routed elsewhere", "Rotate the application's TLS certificate every day, which changes the identity but not the credentials stolen"],
   "Token-protected metadata access and least-privilege roles block both the request pattern and the blast radius. Instance size, zone placement and certificate rotation do not address credential theft through SSRF.")
mc(C3, 'infra', "After an incident the team needs to prove which payload an attacker sent to a database server, but flow logs show only addresses and ports. What would have provided this evidence?",
   "Targeted packet capture through traffic mirroring on the affected segment",
   ["A longer retention period for billing records and the cost allocation reports of the account", "More frequent patching of the provider's management console and its client tools", "A larger number of availability zones for the application tier of the workload"],
   "Packet capture records content-level data that flow logs omit, and traffic mirroring supplies it in virtual networks. Billing retention, console patching and more zones do not capture payloads.")
mc(C3, 'infra', "An architect must choose between sharing risk and transferring risk for a major outage of a critical vendor. Which action BEST represents risk sharing?",
   "Contracting a second provider to carry part of the workload with a split of consequences",
   ["Declining to assess the vendor at all, on the grounds that its certificate covers the risk", "Removing the workload from the business entirely, which is risk avoidance rather than sharing", "Accepting the risk without a recorded decision, owner or review date for the residual exposure"],
   "Sharing divides the impact with another party by contract or arrangement. Not assessing, removing the workload (avoidance) and silent acceptance are different or unsound treatments.")
mc(C3, 'resil', "A BIA states that during recovery the order system needs only about half its normal capacity to keep the business viable. What does this requirement describe?",
   "Recovery service level",
   ["Recovery point objective", "Maximum tolerable downtime", "Annualized rate of occurrence"],
   "The recovery service level is the share of normal capacity required while recovering and allows a smaller recovery environment. RPO is about data loss, MTD is about time and ARO is a risk frequency.")
mc(C3, 'resil', "A team wants to validate its disaster recovery procedures with minimal risk to production, but a document review alone has not exposed any issues. Which next test is MOST appropriate?",
   "A tabletop exercise where participants walk through a realistic scenario",
   ["A full interruption of production during business hours, to see whether the recovery procedures hold up", "No further testing, since a thorough document review proves that the procedures will work", "Deleting the primary site in production to prove that the backup works under real conditions"],
   "A tabletop is a low-risk step up in realism from a document review. A full interruption carries high risk and no testing leaves assumptions unproven.")
mc(C3, 'resil', "A risk analyst values an application server at 200000, estimates that an outage would destroy 25 percent of that value and expects it twice a year. What is the annualized loss expectancy?",
   "100000",
   ["50000", "200000", "400000"],
   "Single loss expectancy is 200000 times 0.25, giving 50000; multiplied by an annual rate of 2 the annualized loss expectancy is 100000. The other values come from missing one of the steps.")
mc(C3, 'infra', "A cloud security team must show an auditor how an attacker moved from a stolen developer token to an object store. Which capability is MOST essential?",
   "Correlation of identity, management-plane and storage access logs across sources",
   ["Larger log retention on a single local disk attached to each of the application servers", "Encryption of the finished audit report with a key held by the audit committee", "Faster processors on the logging servers so that events are written to disk more quickly"],
   "Correlating events across identity, control-plane and data-plane logs reveals the chain of actions. Retention on one local disk, report encryption and processor speed do not link events.")
ms(C3, 'infra', "Which TWO design choices improve the resilience of a cloud data center's environmental systems? (Choose two.)",
   ["Redundant cooling units with monitored temperature sensors", "Clean-agent or pre-action fire suppression suited to equipment rooms"],
   ["A single air conditioning unit shared by all halls", "Water-based sprinklers that discharge on every detector alarm", "Locating the generator fuel supply in a single shared tank without monitoring"],
   "Cooling redundancy with monitoring and equipment-safe fire suppression protect continuity. A single cooling unit, indiscriminate water discharge and an unmonitored single fuel point create failure points.")
ms(C3, 'infra', "Which TWO controls MOST directly protect the confidentiality of data traveling between workloads in different virtual networks? (Choose two.)",
   ["Mutual TLS between services", "An IPsec VPN or private link with encryption layered on top"],
   ["A VLAN tag on the traffic", "A larger instance type for the sending workload", "Disabling flow logs"],
   "Encryption in transit, whether TLS or IPsec, protects confidentiality. VLAN tags only separate traffic and are not encryption, and instance size or logging settings do not encrypt.")
ms(C3, 'resil', "Which TWO statements about qualitative and quantitative risk analysis are accurate? (Choose two.)",
   ["Quantitative analysis supports cost-benefit decisions when reliable data exists", "Qualitative analysis ranks risks on scales and is quicker but more subjective"],
   ["Quantitative analysis never needs asset values", "Qualitative analysis produces annualized loss expectancy in currency", "The two methods cannot be combined in one program"],
   "Quantitative uses values and probabilities for cost-benefit; qualitative uses ratings. Many programs combine them.")
tf(C3, 'infra', "Two carriers entering a data center through the same trench give full protection against a single cable cut.", False,
   "Physical path diversity is required; carriers sharing one trench share a failure point.")
tf(C3, 'infra', "The Uptime Institute Tier III classification describes a concurrently maintainable site.", True,
   "Tier III allows planned maintenance without shutting down IT load; Tier IV adds fault tolerance.")
tf(C3, 'resil', "Annualized loss expectancy equals single loss expectancy multiplied by the annualized rate of occurrence.", True,
   "ALE = SLE x ARO; compare the reduction against the annual cost of the safeguard.")
tf(C3, 'infra', "A VLAN encrypts traffic between its members.", False,
   "VLANs segment broadcast domains but provide no encryption; misconfigured trunks can even enable VLAN hopping.")

# ---- questions added in the August 2026 outline refresh: Domain 4
mc(C4, 'app', "A product team wants security requirements that can be verified in testing and that scale with the sensitivity of each application, from low-risk internal tools to payment services. Which resource is MOST appropriate as the basis?",
   "The OWASP Application Security Verification Standard with its assurance levels",
   ["The OWASP Top 10 used as a pass or fail certificate", "A single penetration test report from last year", "A list of programming languages approved by the architects and the versions of each they allow"],
   "ASVS provides testable requirements at graduated levels. The Top 10 is an awareness list rather than a standard to certify against, an old test report is not a requirement set and a language list does not define security.")
mc(C4, 'app', "A developer team building a customer-facing assistant that calls internal tools wants a risk list tailored to large language model applications. Which source is MOST relevant?",
   "The OWASP Top 10 for Large Language Model Applications",
   ["The OWASP Top 10 for web applications alone, since it already covers every application type", "The CWE Top 25 alone, because it is the only list that ranks weaknesses by severity", "A generic list of network ports and the services that traditionally use each of them on servers"],
   "The LLM list covers prompt injection, excessive agency, output handling and model poisoning that general web lists omit. The web Top 10 and CWE list are useful but not tailored, and port lists are unrelated.")
mc(C4, 'app', "A new feature lets a user reset a password. In design review a security engineer proposes a list of ways an attacker could misuse it: enumerating accounts, flooding the endpoint and replaying a token. What is this technique?",
   "Abuse case analysis feeding negative tests",
   ["Functional regression testing of the happy path", "Capacity planning for the endpoint", "Software composition analysis of dependencies"],
   "Abuse cases describe malicious use and become negative tests. Happy-path regression checks intended behavior, capacity planning concerns load and composition analysis inspects libraries.")
mc(C4, 'app', "A threat model produced a long list of threats categorized with STRIDE. The team now needs to rank them so the highest risks are fixed first. Which scoring model is named in the outline for this purpose?",
   "DREAD",
   ["PASTA", "SAFECode", "ATASM"],
   "DREAD scores damage, reproducibility, exploitability, affected users and discoverability. PASTA and ATASM are modeling methods and SAFECode is a body of practice guidance.")
mc(C4, 'app', "An organization wants a threat modeling approach tied to business objectives that simulates attacker behavior in several defined stages. Which method fits BEST?",
   "PASTA",
   ["DREAD", "STRIDE", "CVSS"],
   "PASTA is a seven-stage, risk-centric process linking business goals to attack simulation. DREAD and CVSS score threats or vulnerabilities and STRIDE categorizes threat types.")
mc(C4, 'app', "A team sees that its code scanner flags a library problem in release 4.2, but the release cannot be reproduced because the configuration and dependency versions were edited by hand on a server. Which practice would have prevented this?",
   "Software configuration management with version control and tagged, reproducible builds",
   ["Disabling the code scanner for older releases so that only new releases generate findings", "Moving the application to a larger virtual machine", "Giving every developer root access to production so that fixes can be applied directly on servers"],
   "Version-controlled code, configuration and dependencies make any build reproducible and traceable. Turning off scanning, sizing up and widening access make things worse.")
mc(C4, 'app', "A team can see the source code of a SaaS integration and tests its logic for injection flaws without running it. Which testing category is this?",
   "White-box testing using static analysis",
   ["Black-box testing using fuzzing", "Gray-box testing without code access", "Load testing for performance"],
   "Inspecting source without running it is static, white-box testing. Fuzzing runs the program from outside, gray-box testing has partial knowledge and load testing is non-functional performance work.")
mc(C4, 'app', "A company relies on an open-source library that a single maintainer abandoned, with a license that requires publishing derived source. What is the MOST appropriate response?",
   "Review license obligations and maintainer health, then replace or fork under a managed process",
   ["Keep using it unchanged, because open-source software carries no license or maintenance obligations for the user", "Remove all versioning information to avoid disclosure", "Allow each team to pull whichever copy of the library it prefers from public sources"],
   "Open-source intake includes license review and health assessment, with a plan to replace or maintain. Ignoring obligations, hiding version data and unrestricted downloads increase risk.")
mc(C4, 'app', "A build pipeline deploys whatever artifact a developer uploads to a shared registry. An attacker uploads a modified image to the registry. Which control would block it at deployment time?",
   "Signature verification against trusted keys with provenance checks",
   ["Increasing the registry's storage capacity and adding mirror copies across regions", "A longer retention period for build logs and the records of every pipeline run", "Renaming the registry repository and publishing the new name to every developer"],
   "Verifying signatures and provenance before deploy rejects unsigned or tampered artifacts. Storage, log retention and renaming do not authenticate the artifact.")
mc(C4, 'app', "A legacy partner sends large XML messages to a cloud service, and a malformed message with an external entity reference crashed a parser last month. Which component would BEST filter such traffic before it reaches the application?",
   "An XML firewall that validates schemas and blocks malformed messages",
   ["A hardware security module", "A database activity monitor", "A content delivery cache"],
   "XML firewalls inspect and validate XML and SOAP traffic. HSMs protect keys, activity monitors watch database queries and caches speed delivery.")
mc(C4, 'app', "A company exposes many internal services as APIs and wants one place to authenticate callers, rate limit and log requests, while each service still checks authorization for its own objects. Which component fits?",
   "An API gateway in front of the services",
   ["A file integrity monitor", "A bastion host", "A honeypot"],
   "A gateway centralizes authentication, throttling and logging at the edge. File integrity monitors, bastions and honeypots do not serve API traffic.")
mc(C4, 'app', "A team needs to open email attachments from unknown senders to check for malware in the cloud, without any risk to production systems. What is the BEST approach?",
   "Detonate them in an isolated sandbox with no route to production",
   ["Open them on a developer's laptop, which has VPN access and a current antivirus tool", "Copy them to the production file share first", "Disable antivirus on a shared server so that the files cannot be quarantined during the test"],
   "Sandboxes isolate untrusted content with restricted permissions and network access. The other choices expose real systems.")
mc(C4, 'iam', "A SaaS application trusts sign-in assertions from an external identity provider. The provider's signing key is stolen. What is the MOST significant consequence?",
   "An attacker can forge assertions and sign in as any user across the federated applications",
   ["Only the provider's public marketing site is affected, because assertions never reach other applications", "Users must pick much longer passwords for every federated application to stay safe", "Application logs begin to delete themselves automatically, hiding the signs of earlier logins"],
   "Federation trusts the signed assertion, so a stolen signing key lets an attacker impersonate anyone in every relying application. The other outcomes are unrelated.")
mc(C4, 'app', "A development team in a regulated company wants to avoid a single failure where both the code review and the build approval are done by the same person. Which principle does this support?",
   "Separation of duties in the delivery pipeline",
   ["Security through obscurity", "Weak coupling of services", "Role stacking for efficiency"],
   "Separating review from approval prevents one person from pushing unreviewed changes. Obscurity, loose coupling and stacking roles do not provide that control.")
ms(C4, 'app', "Which TWO statements about functional and non-functional testing are accurate? (Choose two.)",
   ["Security, performance and availability testing are non-functional", "A feature can pass every functional test and still be exploitable"],
   ["Non-functional testing checks only that features match the requirement document", "Functional testing is the only type that can run in a pipeline", "Security testing is outside the testing lifecycle"],
   "Functional testing checks behavior against requirements; security and other qualities are non-functional and both can be automated in pipelines.")
ms(C4, 'app', "Which TWO measures help secure a continuous integration and delivery pipeline? (Choose two.)",
   ["Short-lived credentials with least privilege for build jobs", "Protected branches with required reviews and signed artifacts"],
   ["A single long-lived administrator key shared by all jobs", "Allowing build agents to reach any internal network without restriction", "Storing secrets in the repository for easy access"],
   "Least-privilege short-lived credentials and protected, signed delivery limit what a compromise can do. Shared administrator keys, unrestricted agents and committed secrets are classic pipeline failures.")
ms(C4, 'app', "Which THREE belong in third-party software management? (Choose three.)",
   ["An inventory of every external component and service", "Vendor and license review before adoption", "Tracking of vulnerabilities with a plan for replacement or patches"],
   ["Trusting any package with many downloads without verification", "Letting each developer decide silently which components to use"],
   "Inventory, vendor and license review and vulnerability tracking are the foundation. Popularity is not verification and ad hoc decisions create blind spots.")
tf(C4, 'app', "In the OWASP Top 10:2025, broken access control is still listed first.", True,
   "The 2025 edition keeps broken access control at number one and adds categories for supply chain failures and mishandling of exceptional conditions.")
tf(C4, 'app', "The ASVS is a certification that an application passes once and keeps permanently.", False,
   "ASVS is a requirements and verification standard with levels; it is applied per application and revisited as the application changes.")
tf(C4, 'app', "A white-box test requires access to the source code or design of the application.", True,
   "White-box testers have internal knowledge; black-box testers have none and gray-box testers have partial knowledge.")
tf(C4, 'app', "An API gateway removes the need for each service to perform its own authorization checks.", False,
   "The gateway enforces edge policy, but object-level authorization must still be checked by the service.")
tf(C4, 'app', "Signed build provenance helps detect that an artifact was not produced by the expected pipeline.", True,
   "Signature and provenance verification address integrity and authenticity in the supply chain.")
tf(C4, 'iam', "Compromise of a federated identity provider's signing key affects only one application.", False,
   "Every relying application that trusts the provider's signature is exposed.")

# ---- questions added in the August 2026 outline refresh: Domain 5
mc(C5, 'buildops', "A new virtual machine image template exposes remote desktop and secure shell ports to the internet, has a default administrator password and logging disabled. Which principle was MOST clearly ignored?",
   "Secure by default configuration",
   ["Elastic scaling of resources", "Resource pooling among tenants", "Broad network access for customers"],
   "Safe initial settings (closed ports, no default credentials, logging on) define secure by default. Elasticity, pooling and broad access are cloud characteristics, not configuration principles.")
mc(C5, 'buildops', "Administrators in a cloud environment need to manage servers in private subnets. Which design BEST limits exposure?",
   "A hardened bastion with multi-factor authentication and recorded sessions as the only entry point",
   ["Public addresses on every server, protected only by strong passwords that are changed each quarter", "A single shared administrator account protected by a very long password stored in a team vault", "Open inbound access from the whole internet to the management port"],
   "A controlled jump point reduces exposed surface and adds accountability. Public addresses, shared accounts and open ports increase attack surface.")
mc(C5, 'buildops', "A hypervisor cluster must apply a firmware patch to one host without causing downtime for hosted applications. Which operational feature makes this possible?",
   "Placing the host in maintenance mode so workloads migrate to other hosts first",
   ["Powering off the host immediately and restarting the guests once the update has finished", "Disabling monitoring on the cluster so that the update does not trigger alerts and tickets", "Deleting the guest virtual machines and rebuilding them from templates after the update"],
   "Maintenance mode evacuates workloads before servicing, relying on cluster capacity. Powering off, disabling monitoring and deleting guests cause avoidable outage or blindness.")
mc(C5, 'buildops', "A cluster's high availability configuration restarts virtual machines on surviving hosts after a node failure, but during a test several machines failed to restart. What is the MOST likely design flaw?",
   "Insufficient reserved failover capacity on the remaining hosts",
   ["The hosts used encrypted storage, which prevents guests from being restarted on another host", "The virtual machines were too small to run their applications once the host recovered", "The network used a VLAN"],
   "High availability needs spare capacity to absorb failed hosts' workloads. Encryption, small guests or VLANs do not prevent restarts.")
mc(C5, 'buildops', "A monitoring dashboard shows one host's fan speed dropping and temperature rising. What is the BEST response?",
   "Migrate workloads away and repair the hardware before it fails",
   ["Wait until the host crashes to confirm the problem and then rebuild it from a template", "Turn off hardware alerts for the whole fleet to reduce noise and operator fatigue", "Raise the host's utilization to burn off the heat in the processor and the fans"],
   "Hardware monitoring exists to act before failure. Waiting, silencing alerts and increasing load make failure more likely.")
mc(C5, 'buildops', "A team sees a sudden, sustained rise in compute usage in an account at night with no deployment scheduled. Which interpretation deserves FIRST attention?",
   "Possible abuse such as cryptomining through stolen credentials",
   ["A routine seasonal backup of the monitoring software", "Normal behavior of a scheduled change nobody recorded", "A sign that the provider's service level has improved and fewer instances are needed"],
   "Unexplained sustained usage is a classic abuse indicator and should be investigated. The other explanations ignore the absence of a recorded change.")
mc(C5, 'buildops', "A security lead wants operating systems to stay in a known good state: documented settings, automated detection of deviations and prompt correction. Which cycle describes this?",
   "Baseline, monitor and remediate against an approved configuration",
   ["Deploy once and archive the image, since a deployed system should never change", "Patch only after an incident has shown that a weakness is exploited", "Allow administrators to change settings freely whenever an application owner requests it"],
   "Hardening is maintained by baselining, monitoring drift and remediating. One-time deployment, reactive patching and free changes allow drift.")
mc(C5, 'buildops', "An organization wants a certifiable standard it can use to demonstrate a formal IT service management system, covering incident, change and service level processes. Which should it choose?",
   "ISO/IEC 20000-1",
   ["ISO/IEC 27001", "COBIT 2019", "CIS Critical Security Controls"],
   "ISO/IEC 20000-1 specifies a service management system. ISO/IEC 27001 certifies an information security management system, COBIT is a governance framework and CIS Controls are prioritized safeguards.")
mc(C5, 'buildops', "A board wants one framework to organize cybersecurity outcomes around govern, identify, protect, detect, respond and recover. Which is it?",
   "NIST Cybersecurity Framework 2.0",
   ["ITIL 4", "PCI DSS", "The COSO internal control framework"],
   "CSF 2.0 organizes outcomes into those six functions, including the new Govern function. ITIL, PCI DSS and COSO have different structures and purposes.")
mc(C5, 'buildops', "A small company with limited staff wants a prioritized set of safeguards that scales to its size, starting with essential hygiene. Which resource fits BEST?",
   "CIS Critical Security Controls using implementation groups",
   ["The full catalog of the NIST SP 800-53 high baseline applied to every system", "A COBIT governance design built for a multinational with a large internal audit team", "A PCI DSS assessment covering all company data, not only payment card data"],
   "CIS Controls implementation groups let smaller organizations start with essential safeguards. A high baseline catalog, an enterprise governance design and a payment assessment are not sized or targeted for that goal.")
mc(C5, 'ops', "A cloud provider needs to tell customers about a maintenance window and a security incident affecting several tenants. Which preparation BEST ensures consistent and timely communication?",
   "Predefined stakeholder lists, channels and approved templates with named owners",
   ["Letting each engineer email affected customers individually with whatever details he or she has", "Posting only on social media after the incident has already been reported in the press", "Sending nothing to anyone until a regulator or a customer requests an explanation"],
   "Planned channels, owners and approved wording make communication timely and consistent. Ad hoc emails, delayed posts and silence create legal and trust failures.")
mc(C5, 'ops', "Service restoration for a failing application succeeded within ten minutes, but the same failure recurred three times that week. Which ITIL-style process should now take over?",
   "Problem management to find and remove the root cause",
   ["Release management, which ships more features in each release cycle", "Capacity management, which plans resources and removes unused storage after the incident", "Continuity management, which would relocate the data center to a different region"],
   "Problem management addresses underlying causes of recurring incidents. Release, capacity and continuity management are separate processes.")
mc(C5, 'ops', "An investigator must collect evidence from a compromised workload and a cloud storage service whose provider logs sit outside the customer's control. Which preparation would have helped MOST?",
   "Pre-agreed forensic procedures and log access arrangements in the contract",
   ["A policy that evidence is gathered only after the incident is closed and approved by management", "A verbal promise from the provider's staff to retain all logs informally for as long as needed", "Disabling logging in the affected accounts to avoid creating evidence that could be requested"],
   "Forensic readiness depends on agreed procedures and access to provider-side data. Late collection, informal promises and disabled logging weaken or destroy evidence.")
mc(C5, 'ops', "A configuration management database lists server owners, but a post-incident review finds it was months out of date, slowing impact analysis. What is the BEST improvement?",
   "Automated discovery that continuously updates configuration items",
   ["Printing the database every month and filing the report with the auditors", "Restricting updates to a single review at the end of each year to save effort", "Removing owner and status fields from every entry to simplify the records"],
   "Cloud assets change constantly, so discovery must feed the record. Printing, annual updates and removing fields do not keep it accurate.")
ms(C5, 'buildops', "Which TWO controls MOST directly harden remote administrative access to cloud virtual machines? (Choose two.)",
   ["Key- or certificate-based secure shell authentication with multi-factor authentication", "Routing access through a bastion host with session recording"],
   ["Allowing remote desktop from any internet address", "Sharing one local administrator password among all engineers", "Leaving default accounts enabled"],
   "Strong authentication and a controlled, recorded entry point reduce risk. Open remote desktop, shared passwords and default accounts raise it.")
ms(C5, 'buildops', "Which TWO statements about DNSSEC and VPNs are accurate? (Choose two.)",
   ["DNSSEC signs DNS records so resolvers can verify authenticity and integrity", "A VPN encrypts traffic across an untrusted network but extends the network to the endpoint"],
   ["DNSSEC encrypts the content of DNS queries for privacy", "A VPN removes the need for authentication on the target systems", "Both provide protection for data at rest"],
   "DNSSEC gives authenticity and integrity, not confidentiality; VPNs protect data in transit but still require endpoint and identity controls. Neither protects data at rest.")
ms(C5, 'buildops', "Which THREE belong in operating system hardening for cloud virtual machines? (Choose three.)",
   ["Applying an approved baseline such as a consensus benchmark", "Monitoring for configuration drift", "Removing unused services, accounts and ports"],
   ["Leaving vendor default passwords for convenience", "Running every service as an administrator"],
   "Baselines, drift monitoring and attack surface reduction are core hardening steps. Default passwords and excessive privilege weaken systems.")
ms(C5, 'ops', "Which TWO activities are part of evidence management? (Choose two.)",
   ["Assigning unique identifiers and logging every transfer of the item", "Storing items in secured, access-controlled locations with integrity hashes"],
   ["Editing files on the original evidence drive to annotate them", "Sharing evidence through a public link for convenience"],
   "Tracking and secure storage preserve admissibility. Altering originals or sharing publicly destroys integrity.")
tf(C5, 'buildops', "A honeypot is a preventive control that blocks attacks before they reach production.", False,
   "Honeypots detect and study attackers using decoys; they do not block traffic and must be isolated.")
tf(C5, 'buildops', "Placing a host in maintenance mode lets its workloads migrate before servicing.", True,
   "This enables patching without downtime when the cluster has spare capacity.")
tf(C5, 'buildops', "ISO/IEC 27002:2022 contains 93 controls grouped into four themes.", True,
   "The themes are organizational, people, physical and technological.")
tf(C5, 'buildops', "DNSSEC provides confidentiality for DNS queries.", False,
   "DNSSEC provides authenticity and integrity of DNS data; query privacy needs encrypted DNS transport.")
tf(C5, 'ops', "Incident management and problem management are the same process with different names.", False,
   "Incident management restores service; problem management removes underlying causes of recurring incidents.")
tf(C5, 'buildops', "COBIT 2019 is a governance and management framework for enterprise IT.", True,
   "COBIT 2019 from ISACA helps align IT with business goals and manage risk.")
tf(C5, 'buildops', "Cluster resilience such as storage replication removes the need for backups.", False,
   "Replication copies deletions and corruption too; backups protect against them.")

# ---- questions added in the August 2026 outline refresh: Domain 6
mc(C6, 'legal', "A multinational stores European customer data in a European region of a US provider. A foreign authority orders the provider to hand over the data, while European law forbids that disclosure without a lawful basis. Which action BEST reduces the customer's exposure to this conflict?",
   "Hold encryption keys under customer control and involve legal counsel to contest or narrow the demand",
   ["Disable all logging so that no records exist about the request or its handling", "Move the data to whichever region is cheapest this quarter and review jurisdiction later", "Agree to every request from any authority immediately to avoid penalties and delay"],
   "Customer-held keys limit what the provider can produce and counsel manages the conflict through legal channels. Disabling logs hides evidence, price-driven region moves ignore law and automatic compliance may breach local law.",
   "Conflicting legislation is a named topic and the answer is minimizing exposure plus legal escalation.")
mc(C6, 'legal', "A company needs a defensible method for forensic work after a cloud breach and wants standards covering collection of evidence, the suitability of the investigation method, analysis and the overall process. Which set of standards matches?",
   "ISO/IEC 27037, 27041, 27042 and 27043",
   ["ISO/IEC 27001, 27002, 27017 and 27018", "ISO/IEC 22301, 31000, 20000-1 and 9001", "ISO/IEC 15408, 17788, 17789 and 27036"],
   "The 27037 to 27043 series covers evidence handling, method assurance, analysis and investigation processes. The other sets cover management systems, continuity and risk, or product evaluation and cloud vocabulary and supplier relationships.")
mc(C6, 'legal', "A learning platform stores student grades and records for a US school district in a cloud service. Which law is MOST directly relevant to this data?",
   "FERPA",
   ["HIPAA", "PCI DSS", "NERC CIP"],
   "FERPA protects student education records. HIPAA covers health information, PCI DSS covers payment cards and NERC CIP covers the bulk electric system.")
mc(C6, 'legal', "A Canadian retailer uses a cloud analytics provider in another country to process customer purchase histories. Which statement about its accountability is MOST accurate under PIPEDA?",
   "The retailer remains accountable for personal information it transfers for processing, including abroad",
   ["Accountability ends once the contract with the processor has been signed and filed", "Only the provider is accountable because it holds the data", "No accountability exists for private-sector data, because privacy law applies only to governments"],
   "PIPEDA keeps the organization accountable for information in the hands of processors and requires comparable protection. The other statements deny continuing accountability.")
mc(C6, 'legal', "A company discovers a breach of electronic health records held by a business associate that stores them in the cloud. In which time frame must affected individuals generally be notified under US health privacy rules?",
   "Without unreasonable delay and no later than 60 days after discovery",
   ["Within 24 hours of the first alert, whether or not a breach is confirmed", "Within 72 hours to the individuals directly, regardless of the facts of the breach", "Only after the next annual audit"],
   "The breach notification rule requires notice without unreasonable delay and not later than 60 days after discovery. The 72-hour figure is the GDPR deadline for notifying the authority, not the individuals.")
mc(C6, 'legal', "A team begins planning a new service that profiles customers' behavior across devices. Which activity BEST identifies privacy risks to individuals and the controls to address them before launch?",
   "A privacy impact assessment performed during design",
   ["A penetration test performed shortly after launch by an external team", "A disaster recovery drill performed after launch to rehearse the failover plan", "A cost estimate performed by procurement during vendor selection"],
   "A privacy impact assessment at design time finds risks to individuals and changes the design. The other activities test security, recovery or cost.")
mc(C6, 'legal', "An auditor reviewing a SaaS provider's SOC report notes that it covers only the provider's main application and excludes the analytics module the customer actually uses. What should the customer do?",
   "Treat the analytics module as unassured, ask for scope extension or compensating evidence and apply customer controls",
   ["Assume the whole provider is covered by the clean opinion, since the auditor signed it", "Ignore the exclusion, because audit reports do not list scope and apply to every service", "Accept the report as it stands, because it was issued by a well-known audit firm"],
   "Scope statements define what is assured; excluded services need other evidence. A clean opinion on one service does not extend to another, and the firm's reputation does not change scope.")
mc(C6, 'legal', "A company wants a report on a provider's controls that is relevant to financial reporting and is available under an international standard rather than a US one. Which pairing is MOST accurate?",
   "ISAE 3402 corresponds to SOC 1 under SSAE 18",
   ["ISAE 3402 corresponds to a PCI assessment", "SSAE 18 corresponds to ISO/IEC 27018 certification", "ISAE 3000 produces a SOC 1 report only"],
   "ISAE 3402 is the international standard for reports on controls relevant to financial reporting, equivalent in role to SOC 1 under SSAE 18. The other pairings mismatch standards.")
mc(C6, 'legal', "A company's security leader wants control owners to evaluate their own risks and controls regularly, with independent validation afterwards, to keep ownership close to the business. Which technique is this?",
   "Risk and control self-assessment",
   ["A black-box penetration test", "A disaster recovery full interruption test", "A business impact analysis"],
   "Risk and control self-assessment lets control owners assess themselves and is then validated independently. Penetration testing, recovery tests and BIAs are different activities.")
mc(C6, 'legal', "A utility moves a monitoring system for part of the bulk electric system to a cloud service. Which regulatory regime MUST the project consider?",
   "NERC CIP standards",
   ["FERPA", "SOX Section 404", "GAPP"],
   "NERC CIP sets mandatory cybersecurity requirements for bulk electric system entities. FERPA concerns education records, SOX concerns financial reporting and GAPP is a privacy framework.")
mc(C6, 'legal', "A risk manager must decide how to treat the possibility of a long outage at a critical SaaS vendor. The company agrees to run part of the workload with a second vendor under a contract that divides the consequences. Which treatment is this?",
   "Risk sharing",
   ["Risk avoidance", "Risk acceptance", "Risk elimination"],
   "Sharing divides the consequence with another party. Avoidance stops the activity, acceptance bears it silently and elimination is not a standard treatment.")
mc(C6, 'legal', "A business rule says that a cloud provider's breach notice must reach the customer faster than the customer's own regulatory deadline. Which place BEST captures this requirement?",
   "The contract's breach notification clause with a shorter notice period than the regulatory deadline",
   ["The provider's public marketing page describing how quickly incidents are handled", "An informal email from the account manager promising prompt notice of any incident", "The customer's internal wiki, which describes the provider's duties as the customer understands them"],
   "Contract terms make notice periods enforceable. Marketing pages, informal emails and internal wikis do not bind the provider.")
mc(C6, 'legal', "A software company depends on a small vendor for a critical component and fears the vendor may fail financially. Which contractual protection BEST addresses this risk?",
   "Escrow of source code or configuration with a neutral party, with release conditions",
   ["A warranty that the vendor will never go out of business, stated in the contract", "A promise to review the vendor annually without access to its materials", "A non-disclosure agreement alone, signed by the vendor and the customer's legal team"],
   "Escrow gives access to critical assets if the vendor fails. Warranties of permanence, reviews without access and NDAs do not secure continuity.")
mc(C6, 'legal', "A company's cloud policy states which services may be bought, which data classes they may hold and who approves exceptions. What problem is this policy MOST directly designed to reduce?",
   "Unsanctioned shadow IT adoption",
   ["Hardware failure in the provider's data center", "Latency between two cloud regions", "License fees for operating systems"],
   "A cloud computing policy defines acceptable services, data classes and approvals, which limits shadow IT. The other problems are technical or financial.")
ms(C6, 'legal', "Which TWO statements about audit scope statements are accurate? (Choose two.)",
   ["A report assures only the services, locations and period named in its scope", "Customer-side controls are often excluded and must be implemented by the customer"],
   ["A clean opinion covers all services the provider sells", "Scope statements are written for marketing and can be ignored", "Excluded subservice organizations are automatically assured"],
   "Scope limits what is assured, and users must supply their own complementary controls. Other statements overstate coverage.")
ms(C6, 'legal', "Which TWO items appear among the privacy frameworks and standards named for cloud privacy requirements? (Choose two.)",
   ["ISO/IEC 27018 for protecting personal data in public clouds", "Generally Accepted Privacy Principles with ten principles"],
   ["ISO/IEC 27036 as a privacy law", "NERC CIP as a data subject rights regulation", "Common Criteria as a privacy framework"],
   "ISO/IEC 27018 and GAPP are privacy standards or frameworks. ISO/IEC 27036 concerns supplier relationships, NERC CIP is electric sector security and Common Criteria evaluates products.")
ms(C6, 'legal', "Which THREE items belong in a cloud contract to support exit and accountability? (Choose three.)",
   ["Data return and deletion terms with evidence of deletion", "Breach notification timelines and subprocessor controls", "Right to audit or access to independent assurance reports"],
   ["A clause stating the provider owns customer data", "A ban on the customer ever terminating the contract"],
   "Data return, notification, subprocessor and audit terms support exit and accountability. Provider data ownership and no termination undermine the customer.")
tf(C6, 'legal', "HIPAA breach notification to individuals may take place up to 60 days after discovery of a breach, but must not be unreasonably delayed.", True,
   "The rule requires notice without unreasonable delay and in no case later than 60 days.")
tf(C6, 'legal', "A privacy impact assessment is performed before a system launches so privacy risks to individuals can change the design.", True,
   "It is a design-time review; the DPIA is the GDPR's formal version for high-risk processing.")
tf(C6, 'legal', "A SOC report that excludes a subservice organization assures the controls of that subservice organization.", False,
   "Excluded subservice organizations are not assured by the report; customers need other evidence.")
tf(C6, 'legal', "A master service agreement sets general terms while a statement of work defines specific deliverables.", True,
   "The SOW operates under the MSA; the SLA sets measurable service levels.")
tf(C6, 'legal', "Risk transfer and risk sharing are interchangeable terms in the outline's list of treatments.", False,
   "The outline lists avoid, mitigate, transfer, share and accept as separate treatments.")
tf(C6, 'legal', "PCI DSS version 4.0.1 is the current version of the standard.", True,
   "Version 4.0.1 is the current edition of the PCI Data Security Standard.")
tf(C6, 'legal', "ISO/IEC 27050 is a standard for electronic discovery.", True,
   "It is a multi-part standard covering the eDiscovery process from identification to production.")

# ---- second-pass additions (October 2026): items filling the thinnest outline bullets found in the coverage audit
f(C5, 'ops', 'Vulnerability assessment versus penetration test',
  "A vulnerability assessment systematically scans assets for known weaknesses and ranks them by severity; it is broad, repeatable and mostly automated. A penetration test is an authorized, scoped attempt to exploit weaknesses to show real impact; it is narrower, manual and periodic. Cloud testing must follow the provider's testing policy.",
  "Assessments find and rank; penetration tests prove and chain. Written authorization and rules of engagement are required before any test.")
f(C5, 'ops', 'Intelligent monitoring of security controls',
  "Continuous monitoring of firewalls, intrusion detection and prevention, honeypots and network security groups, increasingly with machine learning that baselines normal behavior and flags anomalies. It must also confirm that the controls and log sources themselves are active and unchanged.",
  "Monitoring that cannot notice a disabled rule or a silent log source gives false comfort; analysts validate AI findings and tune out noise.")
f(C5, 'ops', 'Continual service improvement',
  "The ITIL practice of measuring service performance, reviewing incidents and audits, and turning lessons into tracked improvements, so operations get better each cycle rather than only repairing failures.",
  "Evidence of continual improvement is the review, the owner and the measured result, not a one-off fix.")
f(C6, 'legal', 'Cyber risk insurance',
  "Insurance that transfers part of the financial impact of an incident, such as response, legal and notification costs and business interruption. Insurers set conditions and exclusions, and require baseline controls before they will cover.",
  "It transfers some financial loss only; accountability, regulatory duties and reputational damage stay with the organization.")

# ---- second-pass questions: Domain 1
mc(C1, 'found', "An attacker who gains rights in the orchestration layer of a cloud platform could create, change and delete large numbers of workloads in one operation. Which control BEST protects this building block?",
   "Strong authentication, least privilege, approvals and full logging on orchestration and management calls",
   ["Column-level encryption of every database that the orchestrated workloads can reach",
    "Additional storage replicas in a second region so that deleted workloads can be rebuilt",
    "Larger virtual machine sizes so the orchestrator has spare capacity during attacks"],
   "Orchestration acts with broad privilege, so access to it needs the tightest identity controls and auditing. Database encryption, replicas and capacity do not stop a malicious operation from being issued.",
   "Maps outline objective 1.1 building block technologies to the control that fits each one.")
mc(C1, 'found', "A provider lets customers upload their own code and runs it on a managed runtime while operating the servers and operating system. Under the ISO/IEC 17788 capability types, what does the customer receive?",
   "Platform capabilities, because customers deploy and run their own code on the provider's runtime",
   ["Infrastructure capabilities, because customers provision and manage the virtual machines themselves",
    "Application capabilities, because the provider supplies the finished software that customers merely use",
    "None of the three, because managed runtimes fall outside the capability model entirely"],
   "Deploying customer code on a provider-managed runtime is a platform capability. Infrastructure capabilities leave the operating system to the customer, and application capabilities mean using the provider's own software.",
   "Tests classification of cloud service capabilities as the outline describes them.")
mc(C1, 'found', "A product team wants a new managed service to be safe without customers having to tune it: minimal exposed functionality, restrictive settings and secure behavior out of the box. Which design approach describes this?",
   "Secure by design and secure by default",
   ["Security through obscurity combined with a detailed configuration hardening guide",
    "Shift-right testing that finds weaknesses only after customers report them",
    "Defense by compliance checklist completed shortly before general availability"],
   "Secure by design builds protection into the architecture and secure by default ships with safe settings, so the customer does not carry the burden. A hardening guide pushes the work to customers, and late testing or checklists add little.",
   "Covers the outline's secure-by-design cloud design pattern.")
mc(C1, 'found', "A DevOps team releases many times a day, yet security reviews happen only before quarterly milestones and have become a backlog. What is the BEST way to keep security in step with delivery?",
   "Build automated security checks into the pipeline and share ownership of findings with developers",
   ["Cut the release frequency to the number of reviews the security team can handle each quarter",
    "Move all security staff into a separate gate team that approves every individual change by hand",
    "Defer security work until after release and fix issues only when customers report them"],
   "DevSecOps brings checks to where changes happen, such as scanning and policy gates, so feedback is fast and scales. Throttling releases, manual gates and post-release fixing do not scale or are too late.",
   "Tests the DevOps security bullet of objective 1.4.")
mc(C1, 'found', "A security team's machine learning model flags unusual network behavior. After the company migrates many workloads to a new architecture, the model begins missing attacks. What is the MOST likely cause and response?",
   "Model drift on the new traffic patterns, so validate against current data and retrain",
   ["A flaw in the cloud provider's hypervisor, so open a ticket with the provider and wait for a platform patch to be released",
    "Excess encryption of network flows, so disable TLS to restore full visibility to the model",
    "Normal behavior, since models never need review once they pass their first validation"],
   "A model trained on old traffic degrades when behavior changes; monitoring performance and retraining on validated, representative data restores it. Disabling TLS and waiting for a patch address nothing, and models need ongoing review.",
   "Covers AI-based cloud threat detection and the need to verify its data sources.")
mc(C1, 'found', "A hiring tool built on a cloud machine learning service ranks candidates, and an audit finds consistently lower scores for one protected group. Which response BEST addresses the ethical concern?",
   "Examine the training data for bias, test fairness, document the results and add human oversight",
   ["Hide the demographic fields from the audit report so the ranking appears neutral to reviewers and the regulator",
    "Rely on the cloud provider's SOC 2 report as evidence that the model outputs are fair",
    "Keep the model but encrypt the scoring results so that candidates cannot question them"],
   "Bias usually comes from data and features, so the fix is analysis, fairness testing, documentation and human review. Hiding fields, citing an infrastructure report or encrypting results leaves the harm in place.",
   "Tests the ethical concerns bullet of the AI and machine learning objective.")
mc(C1, 'found', "A security orchestration playbook automatically disables any account that triggers a high-severity alert. Analysts fear false positives will lock out executives and critical service accounts. Which design is BEST?",
   "Tier the response: automate low-impact actions, add approval for high-impact accounts",
   ["Remove automation entirely, since SOAR tools should only ever produce reports for analysts",
    "Exempt all privileged accounts from every alert so the playbook can never cause an outage",
    "Keep full automation and ask affected executives to open a ticket if they are locked out"],
   "Risk-based tiers keep the speed of automation while limiting the blast radius of an incorrect action. Removing automation loses the benefit, exempting privileged accounts opens the biggest hole, and ignoring false positives harms the business.",
   "Checks judgment about SOAR trade-offs between speed and safety.")
tf(C1, 'found', "Using a managed AI service removes the customer's need to assess regulatory requirements that apply to how the AI output is used.", False,
   "The customer remains accountable for lawful use, such as high-risk classifications under the EU AI Act, whichever party runs the model.")

# ---- second-pass questions: Domain 2
mc(C2, 'life', "A provider stores archive objects as erasure-coded fragments spread across several regions so that any subset of fragments can rebuild the object. What is the MOST important consideration for a customer with residency rules?",
   "Dispersion aids availability and limits single-site exposure, but fragment locations may breach residency rules",
   ["Dispersion guarantees that the object stays inside one country because fragments are small",
    "Dispersion removes the need for encryption because no single site holds a complete and usable copy of the object",
    "Dispersion makes deletion instant because every fragment expires automatically at exactly the same moment everywhere"],
   "Splitting data improves resilience and reduces what any one location reveals, yet fragments in other regions can still conflict with residency requirements. It does not replace encryption or guarantee jurisdiction.",
   "Tests data dispersion against data location and residency duties.")
mc(C2, 'life', "An investigator reviewing storage access logs finds the action and timestamp for each event, but cannot tell who performed it or from where. Which attributes were missing from the event definition?",
   "Identity of the actor, source IP address and geolocation",
   ["Disk block size, file system type and data center rack identifier",
    "Encryption algorithm, key length and certificate expiry date of the object",
    "Retention period, storage class and billing tag attached to the bucket"],
   "Auditability needs who, from where and when. Storage mechanics, algorithms and billing metadata do not attribute an action to an actor or a place.",
   "Covers event sources and required event attributes in objective 2.8.")
mc(C2, 'life', "A company plans to fine-tune a model on support chats that contain personal data. Which control BEST reduces the risk that the finished model reveals individual records?",
   "Minimize and de-identify the training data, then test the model for memorization",
   ["Encrypt the training volume at rest and leave the dataset content unchanged",
    "Place the model endpoint in a private subnet and keep every record in the dataset",
    "Increase the number of training epochs so that the model learns each record thoroughly and reliably"],
   "Leakage comes from what the model memorizes, so reducing and de-identifying data and testing for extraction address it directly. Storage encryption and network placement protect the container, and more training increases memorization.",
   "Tests dataset and model privacy under objective 2.9.")
tf(C2, 'life', "Spreading erasure-coded fragments of data across regions can conflict with data residency requirements even though no single region holds the whole object.", True,
   "Residency rules concern where personal or regulated data is stored or processed, so fragment placement still has to be approved.")

# ---- second-pass questions: Domain 3
mc(C3, 'infra', "A regional bank is choosing a site for a data center that must stay available through regional disasters. Which factor is MOST relevant to the decision?",
   "Natural hazard exposure, diversity of power and carriers, and the legal jurisdiction of the site",
   ["Proximity of the site to the bank's executive offices for easier ceremonial visits",
    "Whether the building was previously used for light industry rather than for ordinary office space",
    "The availability of the cheapest rack space regardless of utility diversity"],
   "Physical design is about hazard exposure, utilities, connectivity and jurisdiction, weighed with buy-or-build economics. Convenience and bargain space do not support resilience.",
   "Tests the physical design bullet of the secure data center objective.")
mc(C3, 'infra', "A provider hosts competing retailers on shared hosts. Which logical design measure MOST directly keeps their traffic and data apart?",
   "Tenant-specific virtual networks, identities and keys with isolation enforced by policy",
   ["A single flat network where each retailer's workloads are told apart by naming conventions",
    "One shared administrative account for all tenants, with tags to record who did what",
    "Host firewalls configured identically on every host so that all tenants share the same rules and rule sets"],
   "Tenant partitioning relies on separate networks, identities and keys enforced by the platform. Naming, shared accounts and uniform firewalls provide labels rather than isolation.",
   "Covers logical design and tenant partitioning.")
mc(C3, 'infra', "A site buys connectivity from two carriers, but both circuits enter the building through the same underground conduit. Which design weakness does this show?",
   "The pathways are not diverse, so one physical cut or fire could sever both carriers",
   ["Two carriers are unnecessary because a single provider with a premium contract is always safer",
    "Dual carriers create a risk of data corruption because packets arrive out of order",
    "Carrier diversity matters only for voice traffic and has no bearing on data availability"],
   "Multi-vendor pathway connectivity means carriers use physically separate routes; a shared conduit is a single point of failure. The other statements are incorrect claims about carriers.",
   "Tests environmental and resilience design for connectivity.")
mc(C3, 'resil', "During risk assessment of a new cloud platform a team has listed its assets, the threats against them and the vulnerabilities present. What is the NEXT step in analysis?",
   "Estimate the likelihood and impact of each scenario to rate and rank the risks",
   ["Accept every risk that has a low purchase price for the corresponding safeguard",
    "Transfer all identified risks to an insurer before they have been rated",
    "Select the provider's default controls and treat the assessment as complete"],
   "Identification is followed by analysis of likelihood and impact, which supports ranking and treatment decisions. Accepting, transferring or defaulting before rating skips the reasoning that treatment depends on.",
   "Covers risk assessment steps for cloud infrastructure.")
mc(C3, 'resil', "After a regional failover the standby region delivers only 40 percent of normal capacity for the first day. Which recovery planning concept does this describe?",
   "Recovery service level, the degree of service delivered after recovery",
   ["Recovery point objective, the amount of data loss that is tolerable",
    "Recovery time objective, the time allowed to restore the service",
    "Mean time between failures, the average time before the next failure"],
   "Recovery service level states how much functionality or capacity must be available once recovery completes. RPO is about data loss, RTO about time and MTBF about reliability.",
   "Tests the recovery service level term in objective 3.5.")
mc(C3, 'infra', "Auditors need to reconstruct a network incident that crossed several cloud accounts. Which audit mechanism set is MOST useful?",
   "Centralized, time-synchronized log collection with correlation and retained flow logs or captures",
   ["Separate local logs on each workload that are overwritten after a few hours",
    "Screenshots of the console taken by administrators when they remember to do so",
    "Only the provider's annual availability report, which lists uptime by region"],
   "Central, time-synchronized and correlated logs plus network records allow reconstruction across accounts. Local rotating logs, ad hoc screenshots and an uptime report cannot show who did what.",
   "Covers audit mechanisms such as log collection, correlation and packet capture.")
tf(C3, 'infra', "A cloud customer using IaaS remains responsible for physical access controls at the provider's data center.", False,
   "Physical and environmental protection of the facility is the provider's duty; the customer verifies it through audit reports and contracts.")

# ---- second-pass questions: Domain 4
mc(C4, 'app', "A team moving from waterfall to agile worries that end-of-project security reviews will block each sprint. What is the BEST approach?",
   "Put security requirements, threat modeling and automated tests in every iteration and in the definition of done",
   ["Keep a single security review after the final sprint and treat all earlier work as draft",
    "Skip threat modeling entirely because agile teams prefer working software over analysis",
    "Ask the security team to approve every user story before the sprint can start"],
   "Agile needs security tasks inside each iteration and acceptance criteria, rather than a late gate. A single late review finds problems too late, and per-story approvals do not scale.",
   "Contrasts waterfall and agile security activities in the secure SDLC objective.")
mc(C4, 'app', "An authenticated API user changes the invoice number in a request and receives another customer's invoice. Which OWASP API Security Top 10 risk is this?",
   "Broken object level authorization",
   ["Unrestricted resource consumption of the invoice service",
    "Security misconfiguration of the web server headers",
    "Improper inventory management of retired API versions"],
   "The API checks who the caller is but not whether they may access that specific object, which is broken object level authorization, the top API risk. The other risks involve load, configuration or old versions.",
   "Applies the API Security Top 10 named in objective 4.1.")
tf(C4, 'app', "The CWE Top 25 ranks the most dangerous software weakness types using vulnerability data, and it complements the OWASP Top 10 rather than replacing it.", True,
   "It lists weakness classes by prevalence and severity, while the OWASP list is an awareness document of web application risk categories.")
mc(C4, 'app', "A customer's regulated workload runs on shared cloud hardware, and the compliance officer worries about the provider's own administrators. Which treatment fits the cloud-specific risk BEST?",
   "Use customer-held keys, restrict and log provider access and review the provider's insider controls",
   ["Accept the risk because provider staff are certified and therefore cannot access any customer data",
    "Move the workload to a larger instance type that is harder for administrators to see",
    "Store the encryption keys in the same account as the data for convenience of recovery"],
   "Customer-held keys, logged access and assurance about provider controls reduce provider insider exposure. Certification does not prevent access, instance size does not hide data and co-locating keys with data weakens separation.",
   "Tests cloud-specific risks such as CSP insider threats and lack of visibility.")
mc(C4, 'app', "A QA team's functional tests all pass, yet a user can bypass a payment step by replaying an earlier request. Which testing gap does this reveal?",
   "Abuse case testing was missing, because functional tests only confirm intended behavior",
   ["Load testing was missing, because replay attacks only occur under heavy traffic",
    "Usability testing was missing, because replay depends on a confusing interface",
    "Compatibility testing was missing, because older browsers do not enforce payment steps"],
   "Abuse and misuse cases deliberately try to break rules the way an attacker would, while functional tests confirm that expected paths work. The other test types do not look for deliberate bypass.",
   "Covers abuse case testing and QA in objective 4.4.")
mc(C4, 'app', "During QA test runs a team wants security findings tied to the exact line of code that handled the request, found by instrumenting the running application. Which technique fits?",
   "Interactive application security testing",
   ["Static application security testing alone, because it executes the application in production",
    "Software composition analysis, because it reports where tainted data flows at runtime",
    "A tabletop exercise, because it traces requests through the compiled application"],
   "IAST instruments a running application and reports vulnerabilities with code context. SAST analyzes code without running it, SCA inventories components and a tabletop is a discussion.",
   "Distinguishes IAST from SAST, DAST and SCA.")

# ---- second-pass questions: Domain 5
mc(C5, 'ops', "A customer wants a repeatable weekly inventory of known weaknesses across hundreds of virtual machines, ranked by severity. Which activity is the BEST fit?",
   "An authenticated vulnerability scan with results tracked to remediation",
   ["An annual penetration test limited to the internet-facing web application of the business",
    "A red team exercise that attempts to reach executives' mailboxes",
    "A tabletop exercise on the ransomware response plan"],
   "Assessments are broad, repeatable and rank known weaknesses; penetration tests and red team exercises are narrower and prove exploitability, and tabletops rehearse response.",
   "Separates vulnerability assessment from penetration testing in objective 5.6.")
tf(C5, 'ops', "Before running a penetration test against workloads in a public cloud, the customer should confirm the provider's testing policy and obtain written authorization.", True,
   "Unauthorized testing can breach contract and law, and scope must avoid attacking the provider's shared infrastructure.")
mc(C5, 'ops', "A SOC receives thousands of alerts with no context and cannot tell which matter. Which improvement would MOST help prioritization?",
   "Feeding curated threat intelligence into the SIEM and SOAR tools to enrich alerts with context",
   ["Extending log retention from ninety days to seven years without changing alert content",
    "Turning off all low-severity detections so that analysts only see the most severe signals",
    "Replacing analyst review with a single static firewall rule set for all environments"],
   "Threat intelligence adds context such as known indicators and adversary behavior, which helps rank alerts. Longer retention, disabled detections and static rules do not give context.",
   "Covers threat intelligence within log capture and analysis.")
mc(C5, 'ops', "A machine-learning anomaly detector reports nothing for weeks, until it emerges that an administrator quietly disabled rules on a network security group and turned off flow logging. What was overlooked?",
   "Monitoring must also verify that controls and log sources are active and alert on changes",
   ["Anomaly detectors should be replaced by manual review of every packet that crosses the network boundary",
    "Administrators should hold no privileges at all, which removes the need for monitoring",
    "The detector should be trained on fewer features so that it generates fewer alerts"],
   "Intelligent monitoring includes watching the health of the controls and telemetry that feed it, so a silent change is itself an alert. Packet-level manual review and zero privileges are impractical, and fewer features do not fix blind spots.",
   "Tests intelligent monitoring of security controls.")
mc(C5, 'ops', "All hosts in a cluster are healthy, but a guest virtual machine has stopped responding because of an operating system fault. Which measure addresses guest OS availability?",
   "Guest health monitoring with automatic restart and tested guest backups",
   ["Placing the host in maintenance mode so that the guest migrates to a different server in the cluster",
    "Adding more physical storage to the cluster to increase raw capacity",
    "Raising the hypervisor patch level on every host in the cluster"],
   "Host clustering protects against host failure, so a faulty guest needs its own health checks, restart logic and recoverable backups. Maintenance mode, extra storage and host patching do not fix a guest fault.",
   "Covers availability of the guest operating system.")
mc(C5, 'ops', "A cluster automatically moves virtual machines between hosts to balance load and keep response times steady. Which capability is this?",
   "Distributed resource scheduling or dynamic optimization",
   ["Maintenance mode used to evacuate a host before servicing",
    "Storage replication to a secondary site for disaster recovery",
    "Snapshot scheduling to preserve guest state at fixed times"],
   "Distributed resource scheduling places and rebalances workloads automatically. Maintenance mode is for planned servicing, replication provides recovery and snapshots preserve state.",
   "Tests clustered host availability features.")
mc(C5, 'ops', "After a major outage an organization wants a standing practice that turns incident reviews and audit findings into tracked, measured improvements. Which ITIL practice is this?",
   "Continual service improvement",
   ["Release management",
    "Deployment management",
    "Capacity management"],
   "Continual improvement measures service results and converts lessons into owned actions. Release and deployment management control how changes go live, and capacity management plans resource demand.",
   "Covers the continual service improvement management item of objective 5.6.")

# ---- second-pass questions: Domain 6
mc(C6, 'legal', "A firm wants a general enterprise risk management standard of principles, framework and process that is not specific to IT. Which should it choose?",
   "ISO 31000",
   ["ISO/IEC 27001, which certifies an information security management system",
    "PCI DSS, which sets requirements for protecting payment card data",
    "A SOC 2 report, which attests to a service provider's controls"],
   "ISO 31000 is the general risk management guideline. ISO/IEC 27001 is security-management specific, PCI DSS is a payment standard and a SOC 2 report is an attestation, not a framework to adopt.",
   "Tests recognition of risk frameworks in objective 6.4.")
mc(C6, 'legal', "Which indicator would be the MOST useful key risk indicator for the risk of cloud misconfiguration?",
   "The trend in publicly exposed storage and critical findings open past their deadline",
   ["The total number of employees who work in the cloud engineering department",
    "Annual revenue of the business units that use the cloud environment",
    "The number of cloud provider marketing emails received by the security team"],
   "A key risk indicator signals rising exposure early and links to the risk, such as exposed resources and overdue findings. Headcount, revenue and marketing volume say nothing about misconfiguration.",
   "Applies metrics for risk management.")
mc(C6, 'legal', "A company buys cyber risk insurance and concludes that its security controls can be reduced. Which statement is MOST accurate?",
   "Insurance transfers part of the financial loss, insurers expect baseline controls and accountability stays",
   ["Insurance eliminates regulatory fines in every jurisdiction regardless of how the incident arose",
    "Insurance shifts legal accountability to the cloud provider, so customer controls become optional",
    "Insurance removes the likelihood of an incident, which makes risk assessment unnecessary"],
   "Insurance is risk transfer of some financial impact, often conditional on controls and subject to exclusions. It does not remove accountability, likelihood or the need to assess risk.",
   "Tests risk transfer through contract and insurance.")
mc(C6, 'legal', "A provider is compelled by a foreign court order to hand over customer data stored in another country, which conflicts with the customer's home-country law. Which treatment BEST reduces this legal risk?",
   "Hold encryption keys under customer control and require notice and challenge rights",
   ["Rely on the provider's public statement that it never discloses customer data to any government",
    "Store the data in a region chosen only for the lowest price per gigabyte",
    "Remove the data location clause so that the contract is shorter and simpler"],
   "Customer-held keys limit what the provider can disclose and contract terms for notice and challenge give a response path. Marketing claims, price-driven location and a missing clause increase exposure.",
   "Covers conflicting legislation and legal risks specific to cloud.")
tf(C6, 'legal', "When two countries' laws conflict over the handling of data, a contract clause alone resolves the conflict because courts always honor the agreed terms.", False,
   "Mandatory law and regulators can override contract terms, so conflicts need legal analysis, location choices and technical controls.")
mc(C6, 'legal', "An auditor must plan an engagement for a SaaS provider with no on-site access. What should the plan define FIRST?",
   "Scope, objectives and evidence sources such as provider reports, logs and API evidence",
   ["Whether to skip the plan and perform only a walkthrough of the provider's website",
    "A list of physical data centers to visit regardless of what the provider allows",
    "The final audit opinion, so that fieldwork can be limited to supporting it"],
   "Planning for a cloud audit depends on agreeing scope and objectives and identifying evidence that can actually be obtained remotely. Fixing the opinion first or insisting on site visits is neither possible nor independent.",
   "Tests audit planning adapted for the cloud.")
mc(C6, 'legal', "A customer compares a provider's SOC 2 report with its own policy and finds five requirements unmet. What is the BEST next activity?",
   "Document the gaps and choose a treatment for each, such as compensating controls or contract changes",
   ["Ignore the gaps, because a SOC 2 report is a certification that the provider can never fail or lose",
    "Terminate the contract at once, since any gap makes the provider unusable",
    "Ask the provider to rewrite the report so that it matches the customer's policy"],
   "A gap analysis ends in documented treatment decisions. Reports cannot be rewritten, ignoring gaps is unsafe and automatic termination is disproportionate.",
   "Applies gap analysis and control self-assessment.")
mc(C6, 'legal', "Which role is responsible for the day-to-day quality, definitions and metadata of a dataset, working under the data owner's policy?",
   "Data steward",
   ["Data processor",
    "Data subject",
    "Regulator"],
   "A data steward maintains quality and definitions for the owner. A processor handles data for a controller, the subject is the individual the data describes and a regulator supervises compliance.",
   "Tests the difference between data roles such as owner, controller, custodian, processor and steward.")
tf(C6, 'legal', "India's Digital Personal Data Protection Act, 2023 refers to organizations that decide the purpose of processing as data fiduciaries and to individuals as data principals.", True,
   "These are the Act's equivalents of controller and data subject, with a Data Protection Board enforcing the law.")

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
        'diagram': 'cswShared',
        'vocabIds': _vocab(['found'], 9),
        'quizIds': _quiz(['found'], 3, 1, 1, 1),
        'reading': """Cloud computing is a way of renting computing power instead of owning it. The formal definition used by the exam, from NIST, names five essential characteristics: on-demand self-service (you provision resources yourself, without filing a ticket), broad network access, resource pooling, rapid elasticity and measured service. If a vendor hosts a server for you but you must phone them to resize it and pay a flat monthly fee, that is hosting, not cloud. The characteristic that most shapes security is resource pooling, because it produces multi-tenancy: many customers sharing the same physical machines, separated only by software. Isolation between tenants is therefore a cornerstone of cloud security and a favorite exam topic.

Cloud services come in three service models that differ in how much of the technology stack the provider runs for you. In infrastructure as a service you get virtual machines, storage and networks and manage everything from the guest operating system upward. In platform as a service the provider also runs the operating system and runtime, and you bring only your application and data. In software as a service you simply use a finished application. As you move from infrastructure to software, the provider takes over more of the stack and you give up control. That trade is the heart of the shared responsibility model: the provider secures the cloud itself (facilities, hardware, hypervisor, core services) and the customer secures what they put in the cloud and how they configure it. The line moves with the service model, but a few things never move. Data, identities and access decisions, and the choice of settings are always the customer's, and accountability to regulators cannot be handed to anyone.

Deployment models describe who owns and shares the environment. A public cloud is open to many customers. A private cloud serves one organization. A hybrid cloud binds two different models together so workloads and data can move between them, and a community cloud is shared by organizations with a common concern, such as the same regulator. Multi-cloud is a different idea altogether: using more than one provider.

Architects also weigh vendor lock-in. Portability, interoperability and reversibility are the properties that keep an exit possible, and the ISO/IEC 17789 cross-cutting aspects (auditability, availability, governance, privacy, regulatory, resiliency, security, service levels and more) act as a checklist of things to consider before adopting any service.

The outline also asks how newer technologies change the picture. Artificial intelligence and machine learning make training data, models and prompts into assets to classify and protect, and the customer keeps responsibility for them even on a fully managed service. Confidential computing protects data in use by running code inside a hardware-based trusted execution environment. Quantum computing threatens today's public-key algorithms, which is why architects favor crypto agility. Underlying all of this are three design principles to reach for in almost any scenario: defense in depth, least privilege and zero trust, in which identity rather than network location decides who gets in.

The outline treats the reference architecture as a map of roles and activities. The customer, the provider, the partner (such as an auditor, a service developer or a broker) and the regulator each perform different activities, so a control only works when someone owns it. ISO/IEC 17788 also describes what a customer receives as capability types: infrastructure capabilities (compute, storage and network), platform capabilities (a managed runtime for your code) and application capabilities (finished software). Underneath, every service is assembled from building blocks such as virtualization, storage, networking, databases and orchestration, and each block carries its own isolation and configuration risks.

Secure design draws on classic principles (least privilege, defense in depth, fail-safe defaults, separation of duties, complete mediation) that SANS and similar guidance teach, on provider Well-Architected frameworks, on the CSA Enterprise Architecture and on the idea of secure by design and secure by default. DevOps security means building automated checks and shared ownership into the pipeline rather than reviewing at the end. Business impact analysis, with cost-benefit analysis and return on investment, justifies the spend on continuity and recovery, and the CSA Top Threats report is a useful list of what goes wrong most often: misconfiguration and change control, identity and access, and insecure interfaces lead the 2024 edition.

Evaluating a provider means verifying it against criteria you define, using audit reports, CSA STAR entries and product certifications. Common Criteria (ISO/IEC 15408) evaluates a product against a security target, and FIPS 140 validates cryptographic modules; FIPS 140-3 supersedes 140-2, whose validated modules moved to the Historical list after September 21, 2026. Finally, the outline adds artificial intelligence and machine learning: models can strengthen cloud threat detection and security orchestration, automation and response, but their data sources must be validated and verified, ethical concerns such as bias need oversight, and regulation such as the EU AI Act and frameworks such as the NIST AI Risk Management Framework shape their use.""",
        'fundamentalsLabel': 'New to cloud security? See the everyday analogy',
        'fundamentals': "Think of renting an apartment in a large building. The landlord looks after the structure, the locks on the front door, the elevators and the fire alarms; you decide who gets a key to your flat and what you keep inside. If you leave your door unlocked, the landlord's excellent building security does not help you. The more furnished and serviced the apartment (the move from bare unit to hotel suite), the more the landlord handles, but you never hand over the question of who you let in or what you store. Other tenants share the walls and the plumbing, which is multi-tenancy, so the quality of the soundproofing between units matters. That is the shared responsibility model and the reason isolation is always on the exam.",
        'keyTerms': ['NIST essential characteristics', 'Multi-tenancy', 'IaaS, PaaS and SaaS', 'Shared responsibility model', 'Hybrid versus multi-cloud', 'Vendor lock-in and reversibility', 'Confidential computing', 'Zero trust', 'Cloud capability types', 'Secure by design and by default', 'Common Criteria and FIPS 140', 'AI threat detection and SOAR'],
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
        'diagram': 'cswLifecycle',
        'vocabIds': _vocab(['life'], 9),
        'quizIds': _quiz(['life'], 3, 1, 1, 1),
        'reading': """Data security begins with a simple question that many organizations cannot answer: what data do we have and where is it? The cloud data life cycle gives a structure for the answer. Data is created, stored, used, shared, archived and finally destroyed, and a different control matters most at each stage. At creation you classify the data and assign an owner. While stored it needs encryption and access control. While used it needs monitoring and rights management. When shared, it needs protection that follows it. At the end it needs retention rules, legal holds respected and verified destruction.

Classification is the keystone. It means labeling data by sensitivity and business impact, for example public, internal, confidential and restricted, so that handling rules follow from the label. The data owner, a person in the business who is accountable for the data, decides the classification; custodians such as the IT team and the cloud provider apply the controls. Before you can classify, you must discover: scanning storage, databases and files for sensitive content using patterns, labels and increasingly machine learning.

Once data is found and labeled, two families of control keep it in bounds. Data loss prevention watches data as it moves and blocks policy violations, such as card numbers leaving through a personal cloud account. Information rights management, by contrast, attaches protection to the file itself so that it can be opened only by permitted people and can be revoked after sharing. The difference matters on the exam: if the stem asks how to retain control after a document has left your environment, think IRM; if it asks how to stop sensitive content leaving, think DLP.

Not all copies of data need the real values. Masking replaces sensitive fields with realistic fake ones, which is ideal for test environments. Anonymization removes the link to a person irreversibly, so the data is no longer personal data; pseudonymization replaces identifiers but keeps a way back, so privacy law still applies. Tokenization, covered in the next lesson, swaps values for random tokens that point at a vault.

Retention and destruction deserve respect because they are where cloud differs most. Keep data too long and you enlarge breach and discovery exposure; delete too early and you violate regulations or a legal hold, which suspends normal deletion when litigation is likely. In the cloud you cannot degauss or shred the provider's disks, so the accepted answer for guaranteeing deletion is cryptographic erasure: encrypt the data with keys you control and destroy every copy of the key.

Finally, the newer outline adds data lakes and training datasets to the picture. A large central repository of mixed data needs fine-grained access control and lineage records, and a dataset used to train models needs integrity protection too, because a poisoned input quietly corrupts every model built from it. Always map data flows so you know which regions, providers and sub-processors touch the data, since privacy law attaches to those paths.

The outline walks through the data topics in a deliberate order. Storage types (long-term, ephemeral, raw, object and volume) each have their own threats: public buckets, leaked keys, shared snapshots, remanence after reallocation and ransomware that deletes versions. Data dispersion spreads erasure-coded fragments across locations to improve availability and limit exposure of any single site, but it can conflict with residency rules, so data flows and data locations must be mapped as well as the stored objects.

Discovery has to work differently for structured data (schemas and columns), semi-structured data (JSON and logs, parsed by key) and unstructured data (documents and images, found by content inspection). Classification then needs a written policy that defines levels, who assigns them and the handling rules, a data map of sources, owners, purposes and locations, and labels or tags that tools can enforce. Information rights management carries rights with the file, with provisioning and certificate issue and revocation as the tools, but revocation depends on the client reaching the policy server.

Retention, archiving and deletion need defined periods, mechanisms that work in the cloud (lifecycle rules, immutability, cryptographic erase) and a legal hold that overrides automatic deletion for the custodians concerned. Auditability depends on defining event sources and attributes (identity, source IP address and geolocation), storing and analyzing logs, and keeping a chain of custody; non-repudiation comes from signatures and trusted timestamps. For AI and machine learning data, protect dataset and model privacy (minimize and de-identify, test for memorization) and security (provenance, validation, signed model artifacts).""",
        'fundamentalsLabel': 'New to data security? See the everyday analogy',
        'fundamentals': "Picture the paper records of a large hospital. Someone has to decide which files are routine and which are highly sensitive, and mark them accordingly; that is classification. Staff walk through the building to find forgotten files in corridors and cupboards; that is discovery. Guards at the exit check bags for stray patient files; that is data loss prevention. A special folder that, once handed to another clinic, can still be locked remotely by the hospital is rights management. Old records follow a schedule for how long they must be kept and are then shredded, unless a lawyer places a hold on them. In the cloud you cannot watch the shredder, so you lock the records in a safe and destroy the only key.",
        'keyTerms': ['Data life cycle', 'Data classification', 'Data discovery', 'Data owner and custodian', 'DLP', 'IRM', 'Legal hold', 'Crypto-shredding', 'Pseudonymization', 'Data dispersion', 'Discovery by data type', 'Data mapping and classification policy', 'Chain of custody and non-repudiation', 'AI dataset and model protection'],
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
        'diagram': 'cswEnvelope',
        'vocabIds': _vocab(['crypto'], 9),
        'quizIds': _quiz(['crypto'], 3, 1, 1, 1),
        'reading': """Encryption in the cloud is easy to switch on and easy to get wrong, because the hard part is not the algorithm but who holds the keys. Start with the three states of data. Data at rest sits in storage and is protected with volume, database or object encryption. Data in transit moves across a network and is protected by Transport Layer Security, with TLS 1.3 the current version and legacy protocols disabled. Data in use is being processed in memory, where traditional encryption cannot reach, and is protected by confidential computing or, in specialized cases, homomorphic encryption. A complete design addresses all three, and exam questions usually ask you to match a control to the state of the data in the stem.

Symmetric encryption uses one shared secret and is fast, so it protects bulk data. Asymmetric encryption uses a public and private key pair and is slower, so it is used to exchange keys, sign data and prove identity. Real systems combine the two in envelope encryption: a data encryption key encrypts the data, and a key encryption key, held in a key management service, encrypts the data key. Because only the small data key is wrapped, you can rotate or revoke access for huge volumes by changing the key encryption key. It is also why destroying that key makes the data unrecoverable, the basis of cryptographic erasure.

Key custody is where judgement questions live, and it comes in tiers. With provider-managed keys the provider creates and operates everything. With customer-managed keys you control the policies, rotation and the ability to disable the key, while the provider's service still performs the cryptography. With bring your own key you generate the key material yourself and import it into the provider's key service or HSM, retaining a copy and the power to withdraw it. With hold your own key, the key never enters the provider's environment, for example it lives in an on-premises hardware security module, so the provider cannot decrypt at all, at the cost of availability and some features. Choose by asking who must be unable to read the data: if the answer includes the provider, only hold your own key meets the bar.

A hardware security module is a tamper-resistant device that generates and stores keys and performs operations without exposing them, validated against standards such as FIPS 140. Secrets such as API keys and passwords belong in a secrets manager and are injected at run time, never hard-coded in code or container images.

Tokenization and hashing solve different problems. Tokenization replaces a sensitive value with a random token and keeps the real value in a vault, so systems holding only tokens fall out of compliance scope, which is why it is common for payment card data. Hashing is one-way and verifies integrity; with a private key it becomes a digital signature that proves origin and non-repudiation. Public key infrastructure binds public keys to identities through certificates, whose renewal and revocation must be automated to avoid outages. Finally, plan for crypto agility so algorithms can be replaced without redesign, since quantum computing will eventually weaken today's public-key schemes and adversaries may already be collecting data to decrypt later.

Two further topics sit beside encryption in this domain. Sanitization is how data is made unrecoverable when media or resources are released: NIST SP 800-88 Rev. 2 describes clear (logical overwrite), purge (recovery infeasible even in a laboratory, which includes cryptographic erase) and destroy (physical destruction). In the cloud the customer cannot destroy the provider's disks, and overwriting is unreliable across replicas and wear-leveled flash, so cryptographic erase through key destruction is the practical method, which makes key lifecycle and retention alignment important.

Hashing proves integrity but not origin; digital signatures add non-repudiation when the private key is controlled by one signer. Data obfuscation covers masking, anonymization and pseudonymization, and tokenization substitutes a surrogate value while the original sits in a vault. Keys, secrets and certificates each need their own lifecycle: generation, storage in an HSM or managed vault, rotation, revocation and expiry monitoring, with automation to prevent outages from expired certificates.""",
        'fundamentalsLabel': 'New to encryption? See the everyday analogy',
        'fundamentals': "Imagine shipping valuables in a locked box. The box is the encrypted data, and the lock is only as good as the story of who has the key. Provider-managed keys are like leaving the key with the courier. Customer-managed keys are like holding the courier's key log and being able to cancel it. Bring your own key means you cut the key yourself and hand a copy to the courier's safe, keeping the right to demand it back. Hold your own key means the courier never sees a key at all; the box can only be opened in your own office. Envelope encryption is a small key locked inside a master safe, so changing one master lock protects every box at once. Tokenization is swapping the valuables for a numbered ticket that is worthless unless you visit the vault.",
        'keyTerms': ['Data at rest, in transit and in use', 'Envelope encryption', 'KMS', 'HSM', 'BYOK', 'HYOK', 'Tokenization', 'Key lifecycle', 'Crypto agility', 'Clear, purge and destroy', 'Digital signatures and non-repudiation', 'Secrets and certificate lifecycle'],
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
        'diagram': 'cswIsolation',
        'vocabIds': _vocab(['infra'], 9),
        'quizIds': _quiz(['infra'], 3, 1, 1, 1),
        'reading': """The cloud is built on virtualization, so the first job of an infrastructure security architect is to understand the isolation boundaries. A hypervisor allows many virtual machines to share one physical host. A bare-metal (Type 1) hypervisor runs directly on the hardware and is what cloud platforms use. Isolation between tenants rests on the hypervisor, and the signature attack is a virtual machine escape, where code in one guest reaches the hypervisor or a neighbor. Shared hardware also leaks through side channels and noisy-neighbor effects. The provider patches and hardens the hypervisor; the customer's levers are choosing dedicated hosts for very sensitive workloads, applying quotas and, where available, using confidential computing so that even the host cannot see memory.

Containers are lighter than virtual machines because they share the host's operating system kernel and are separated only by namespaces and control groups. That makes them fast and dense but a weaker isolation boundary. Security therefore focuses on what goes into the container and how the cluster is governed: build from minimal trusted images, scan them for vulnerabilities and embedded secrets, sign them and let the cluster admit only approved images from a trusted registry. In Kubernetes, secure the API server, apply least-privilege role-based access control to people and service accounts, restrict traffic between pods with network policies, enforce pod security standards and keep an audit log. An exposed dashboard or an over-privileged service account is the classic breach path.

Serverless functions remove the servers entirely, so there is no operating system for the customer to patch. The risks shift to what remains: over-privileged function roles, injection through event inputs, vulnerable dependencies and thin visibility. The remedy is the same principle again, least privilege per function.

Networks in the cloud are software defined and live inside virtual private clouds divided into subnets. Security groups are stateful rules attached to workloads, while network access control lists are stateless rules at the subnet edge. The architecture to prefer puts data stores in private subnets with no internet route, exposes only a load balancer or gateway, and uses micro-segmentation to restrict traffic between tiers so that a compromised host cannot roam. Private links and private endpoints keep service traffic off the public internet, though remember that private does not automatically mean encrypted. For remote users, zero trust network access grants per-application sessions instead of dropping them on the whole network, and distributed denial of service protection absorbs floods.

The management plane, meaning the console, command-line tools and programming interfaces that create and delete resources, is the highest-value target in any account. Protect it with multi-factor authentication, just-in-time privilege and a tamper-resistant audit log. Pair that with immutable infrastructure, where servers are replaced rather than modified, and infrastructure as code that is scanned for misconfiguration before it deploys.

A secure data center design has four layers in the outline: logical design (tenant partitioning and access control), physical design (location, hazards, and the buy-or-build decision), environmental design (HVAC, fire suppression and multi-vendor pathway connectivity, meaning carriers enter by physically separate routes) and design resilience (power, cooling and connectivity with N+1 or 2N redundancy). Uptime Institute tiers describe how much redundancy a site has, and customers verify facilities through audit reports because the physical layer belongs to the provider.

Building the environment starts with hardware security (HSM and TPM), secure by default settings, a hardened management plane and virtual hardware settings for network, storage, memory and CPU, with a Type 1 hypervisor for production. Operating it involves access controls for remote administration (a hardened bastion or jump host with multi-factor authentication, SSH keys, restricted RDP and recorded sessions), secure network configuration (VLAN segmentation, TLS, DHCP protections, DNSSEC and VPN), network security controls (firewalls, IDS and IPS, honeypots, network security groups, segmentation and vulnerability assessments), and baselines such as CIS Benchmarks and STIGs applied through monitoring and remediation.

Operational availability comes from patch management, clustered hosts (distributed resource scheduling, maintenance mode and high availability), guest operating system health monitoring, capacity and performance monitoring, hardware monitoring (disk, CPU, fan speed and temperature) and tested backup and restore of hosts and guests.""",
        'fundamentalsLabel': 'New to virtualization? See the everyday analogy',
        'fundamentals': "A large office building rents floors to different companies. Virtual machines are lockable suites on a floor, each with its own walls and door. Containers are open-plan desks on the same floor with partition screens: cheaper and quicker to set up, but a loud neighbor is closer and the partitions are thinner. Serverless is hot-desking by the hour, with nothing to maintain. The building's master control panel, where tenants can request and cancel space, is the management plane; if a thief gets that panel, every floor is at risk. Micro-segmentation is locking the doors between departments rather than trusting that anyone inside the lobby belongs everywhere.",
        'keyTerms': ['Hypervisor', 'VM escape', 'Container isolation', 'Image scanning', 'Serverless', 'Security groups and ACLs', 'Micro-segmentation', 'ZTNA', 'Management plane', 'Data center design layers', 'Bastion and jump host access', 'DNSSEC, DHCP and VLAN security', 'Clustered hosts and maintenance mode'],
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
        'diagram': 'cswBcdr',
        'vocabIds': _vocab(['resil'], 9),
        'quizIds': _quiz(['resil'], 3, 1, 1, 1),
        'reading': """Business continuity and disaster recovery planning answers a plain question: when something goes wrong, how fast must we recover and how much can we afford to lose? Business continuity keeps critical functions running through a disruption; disaster recovery restores information technology systems after a disaster; together they are called BCDR. Everything begins with a business impact analysis. The analysis ranks processes by how much harm their loss does over time and produces two numbers for each. The recovery time objective is how long the service may be down. The recovery point objective is how much data may be lost, measured as time. A bank might need a recovery time of minutes and a recovery point of seconds for payments, and hours and a full day for an internal reporting tool. A third number, the maximum tolerable downtime, is the ceiling beyond which the harm becomes unacceptable, and the recovery time must sit below it.

The order matters. Recovery objectives come from the business impact analysis and only then do you choose technology. A frequent wrong answer on the exam picks a favorite product first. Tighter objectives cost more: a smaller recovery point demands more frequent replication or backup, and a smaller recovery time demands more automation and standby capacity. Replication itself has a trade-off. Synchronous replication confirms writes in both places before acknowledging, so loss is near zero but latency rises and distance is limited. Asynchronous replication acknowledges first and copies afterwards, which performs better across regions but can lose the last few writes.

Cloud makes resilience a design choice rather than a purchase. A region is a geographic area, and availability zones are isolated groups of data centers inside it. Spreading a workload across zones survives the failure of a facility; spreading across regions survives a regional disaster but must respect any residency rules about where data may live. The recovery strategies run from cheap and slow to expensive and fast: backup and restore, pilot light with a minimal core running, warm standby with a scaled-down copy, and active-active with full capacity in more than one place. The right answer is the cheapest option that meets the stated recovery time and recovery point.

Backups deserve their own care. Keep copies in a separate account or logical domain from production credentials, make at least some of them immutable so ransomware or an attacker cannot delete them, and test restores regularly. A backup that has never been restored is an assumption.

Risk analysis sits alongside all of this. For a cloud design, identify assets, threats and vulnerabilities, estimate likelihood and impact and choose a treatment. Characteristic cloud risks include loss of governance and visibility, failure of tenant isolation, insecure interfaces, compromise of the management plane and vendor lock-in. The asset owner, not the security team, accepts whatever residual risk remains.

Risk assessment follows a fixed order: identify assets, threats and vulnerabilities, analyze likelihood and impact (qualitatively or quantitatively, for example single loss expectancy times annual rate of occurrence gives annualized loss expectancy), and then choose a treatment. The treatments in the outline are avoid, mitigate, transfer, share and accept, and each needs an owner. Cloud adds risks such as management plane compromise, isolation failure, vendor lock-in and loss of governance.

Continuity planning starts with strategy and business requirements: the recovery time objective, the recovery point objective and the recovery service level, which states how much capacity or function must be available after recovery. Plans are created, implemented and tested, with tests rising in realism from a document review and tabletop exercise through walkthroughs and simulations to parallel and full-interruption tests, each with more risk to production.""",
        'fundamentalsLabel': 'New to disaster recovery? See the everyday analogy',
        'fundamentals': "Consider a restaurant planning for a kitchen fire. How long can it stay closed before the owner loses the business is the maximum tolerable downtime. How fast they promise to reopen, perhaps in a rented kitchen across town, is the recovery time. How many orders the system can forget is the recovery point: if orders are written on a pad and photographed every five minutes, up to five minutes of orders could be lost. Having a rented kitchen idle and fully stocked is an active site and costs a lot; having the contract for one but no ingredients is cheaper but slower. And the plan is worthless until the staff has actually practiced cooking there.",
        'keyTerms': ['BIA', 'RTO', 'RPO', 'Maximum tolerable downtime', 'Availability zone and region', 'Pilot light and warm standby', 'Active-active', 'Immutable backup', 'Cloud risk analysis', 'Qualitative and quantitative analysis', 'Recovery service level', 'BCDR plan testing types'],
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
        'diagram': 'cswApiFlow',
        'vocabIds': _vocab(['app', 'iam'], 9),
        'quizIds': _quiz(['app', 'iam'], 3, 1, 1, 1),
        'reading': """Cloud applications change quickly, so security has to be built into the process that produces them rather than inspected at the end. A secure software development life cycle places security activities in every phase: requirements define security needs, design includes threat modeling, coding follows secure standards, testing includes security tests, and deployment and maintenance include monitoring and patching. DevSecOps carries this into continuous integration and delivery, where automated scans act as gates and policy as code replaces slow manual sign-off. The principle to remember is shifting left: a flaw found in design costs a conversation, and the same flaw in production costs an incident.

Threat modeling is the design-time activity to know best. Draw how data flows through the system, mark the trust boundaries and ask what could go wrong at each. STRIDE gives a vocabulary: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service and Elevation of privilege. Testing then verifies the design. Static analysis reads code without running it; dynamic analysis attacks a running application from outside; interactive testing instruments it from within; software composition analysis finds known vulnerabilities in third-party libraries. Because most modern applications are largely third-party code, a software bill of materials and signed, provenance-checked build artifacts are now core controls against supply chain attacks.

Application programming interfaces deserve special attention because they are how cloud applications talk to each other and to the world. Authenticate every call, authorize each request against the specific object and action (broken object-level authorization is the leading API flaw), validate input against a schema, rate-limit, log, and keep an inventory so that forgotten or deprecated interfaces do not linger. A web application firewall helps as a compensating control, but it does not replace fixing the code. The root fix for injection is to treat all input as untrusted, validate it against an allow-list and use parameterized queries.

The newer outline adds the risks of applications built on large language models and other AI. Prompt injection, direct or hidden in retrieved content, can override instructions; defend by treating model output and retrieved text as untrusted, restricting what tools and data the model can reach, filtering inputs and outputs and keeping secrets out of prompts.

Identity ties it all together. Federation lets users authenticate once to an identity provider that issues signed assertions to many services, usually through SAML or OpenID Connect; OAuth 2.0 delegates authorization without sharing passwords and is not an authentication protocol by itself. Use multi-factor authentication, preferring phishing-resistant methods such as hardware keys or passkeys. Choose role-based access control for simplicity or attribute-based control for contextual decisions, remove standing privilege with just-in-time elevation, give workloads short-lived identities rather than static keys, and automate provisioning so leavers lose access everywhere.

Application security training starts with the common lists: the OWASP Top 10 (2025 edition, led by broken access control), the OWASP API Security Top 10 (2023, led by broken object level authorization), the OWASP Top 10 for Large Language Model Applications, the CWE Top 25 and the ASVS, which provides verifiable requirements at three assurance levels. In the secure software development life cycle, security belongs in every phase whether the team uses waterfall or agile, where it must be part of each iteration. Threat modeling methods include STRIDE (threat categories), DREAD (scoring), ATASM and PASTA (a staged, risk-centric method), and secure coding guidance comes from OWASP and SAFECode, with configuration management and versioning making builds reproducible.

Assurance and validation combine functional and non-functional testing in CI/CD, black-box, gray-box and white-box approaches, SAST, DAST, IAST and software composition analysis, quality assurance and abuse case testing. Verified software means securing APIs, managing the supply chain (vendor assessment, integrity, authenticity, licensing), controlling third-party code and validating open source. Cloud application architecture adds supplemental components: a web application firewall, database activity monitoring, XML firewalls, an API gateway and load balancers, plus cryptography, sandboxing and microservices on containers and Kubernetes.

Identity design uses federation, identity providers, single sign-on and multi-factor authentication, a cloud access security broker for visibility and policy over SaaS use, and managed secrets, keys and certificates.""",
        'fundamentalsLabel': 'New to secure development? See the everyday analogy',
        'fundamentals': "Building software is like building a house. An architect who checks the plans for weak points before construction (threat modeling) saves far more than an inspector who finds a missing support beam after the roof is on. Inspecting the bricks and the wood supplier's paperwork is software composition and supply chain checking; walking through the finished house testing the locks is dynamic testing. Identity is the key system: a single front-door key everyone shares is a disaster, so each person gets their own key that can be cancelled, visitors get temporary passes, and the master key is kept in a safe and signed out only when needed.",
        'keyTerms': ['Secure SDLC', 'STRIDE', 'SAST and DAST', 'SCA and SBOM', 'API authorization', 'Prompt injection', 'Federation and SSO', 'OAuth and OpenID Connect', 'Just-in-time access', 'OWASP lists and ASVS', 'DREAD, ATASM and PASTA', 'Abuse case testing', 'API gateway and WAF', 'CASB'],
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
        'diagram': 'cswIr',
        'vocabIds': _vocab(['ops'], 9),
        'quizIds': _quiz(['ops'], 3, 1, 1, 1),
        'reading': """Security operations is the discipline of keeping the environment secure after it is built. It starts with visibility. Management-plane audit logs record who did what through the console and interfaces; flow logs record network connections; workload, application and identity logs fill in the rest. Send them to a central store that the source systems cannot alter, keep clocks synchronized and retain them long enough for legal and investigative needs. A security information and event management platform correlates those logs and raises alerts, and orchestration and automation tools turn repetitive responses into playbooks. The pairing to remember is that the SIEM detects while orchestration responds, and both are only as good as the data they receive.

Operations also means controlling change. Configuration management defines a secure baseline and detects drift from it, ideally by holding the baseline in version-controlled templates so that out-of-band edits are flagged. Cloud security posture management scans accounts continuously for misconfigurations such as public storage or open management ports, which cause far more breaches than exotic exploits. Change management reviews, approves, tests and records changes. Patching follows shared responsibility: in infrastructure as a service the customer patches guest operating systems and applications, and the provider patches the layers it operates.

When something does go wrong, incident response follows a life cycle: preparation, detection and analysis, containment, eradication and recovery, then lessons learned. NIST's current guidance, SP 800-61 Rev. 3, aligns these activities with the functions of the Cybersecurity Framework 2.0. Preparation is the phase that decides the outcome in the cloud, because resources are ephemeral, some logs belong to the provider and responsibilities are split. Enable logging, stage an isolated analysis account, agree evidence procedures and contacts with the provider and write playbooks before you need them. During containment, isolate rather than destroy: move an affected instance into a quarantine network, snapshot its disks and memory, revoke credentials and rotate keys. Powering off or terminating first destroys volatile evidence.

Digital forensics applies the same care to evidence. Collect in order of volatility, with memory and running processes before disks and archived logs, work on copies, hash evidence to prove integrity and keep a chain of custody that records every handler. Without it even a perfect analysis can be inadmissible.

The newer outline adds several themes. Machine learning and analytics support threat hunting, the proactive search for undetected compromise based on a hypothesis. A deployed model whose behavior changes without an approved update should be investigated as a possible poisoning or tampering incident. And operating across several clouds demands a normalized log schema, consistent identity attributes and runbooks that account for each provider's tooling and evidence limits. Measure the operation by outcomes such as mean time to detect and to respond, not by alert volume.

The operations domain is organized around standards, evidence and process. Operational controls draw on NIST (CSF 2.0, SP 800-53 and the RMF), ISO/IEC 27001 and 20000-1, COBIT 2019, the CIS Critical Security Controls, COSO and ITIL. Digital forensics follows evidence handling rules: forensic data collection methodologies, evidence management, and collecting, acquiring and preserving evidence with a documented chain of custody, which is harder in the cloud because resources are shared and ephemeral and the provider controls the layers underneath.

Communication with vendors, customers, partners, regulators and other stakeholders uses pre-agreed lists, channels, templates and owners. Security operations covers the SOC, intelligent monitoring of controls (including AI-assisted detection, with checks that the controls and log sources are still active), log capture and analysis through SIEM and threat intelligence, incident response, vulnerability assessments (broad, repeatable and ranked) versus penetration tests (authorized and exploiting, within the provider's testing policy), and the ITIL-style management processes: change, continuity, information security, continual service improvement, incident, problem, release, deployment, configuration, service level, availability and capacity management.""",
        'fundamentalsLabel': 'New to security operations? See the everyday analogy',
        'fundamentals': "Think of running a large hotel. The security desk watches cameras and logs of every door card swipe (logging and the SIEM), a checklist makes sure every room is set up the same way and flags a lock that was changed without a work order (baselines and change management), and housekeeping fixes things on a schedule (patching). When an alarm sounds, staff contain the problem by closing off the floor and preserving the room exactly as found, not by cleaning it. Photos are taken, items are bagged and every person who handles them signs a form (forensics and chain of custody). The manager, not the night porter, speaks to the press.",
        'keyTerms': ['Management-plane audit logs', 'SIEM and SOAR', 'CSPM', 'Configuration drift', 'Incident response life cycle', 'Containment', 'Order of volatility', 'Chain of custody', 'Threat hunting', 'Operational standards (NIST, ISO, COBIT, CIS, COSO, ITIL)', 'Vulnerability assessment versus penetration test', 'Threat intelligence in the SOC', 'Continual service improvement'],
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
        'diagram': 'cswLegal',
        'vocabIds': _vocab(['legal'], 9),
        'quizIds': _quiz(['legal'], 3, 1, 1, 1),
        'reading': """Cloud puts data in other people's buildings, often in other countries, and the law follows the data. Start with the roles. The controller decides why and how personal data is processed and carries primary legal responsibility; the processor acts on its instructions. A cloud customer is usually the controller and the provider the processor, and providers may use sub-processors of their own. Handing processing to a provider outsources work, never accountability. The European General Data Protection Regulation shows the pattern most privacy laws now follow: principles such as lawfulness, minimization and accountability, rights for individuals to access, correct, erase and port their data, breach notification to authorities within 72 hours of becoming aware, and heavy fines. It applies based on whose data you process, not only where you sit.

Where data is stored and who can reach it are separate legal questions. Residency is the physical location. Sovereignty is the principle that data is subject to the laws of the country where it sits or where its controller is based. Transfers of personal data out of the European Union need a lawful mechanism, such as an adequacy decision, standard contractual clauses or binding corporate rules, usually supported by an assessment of the destination country's laws. Foreign government access, for example through the US CLOUD Act, which can compel US providers to produce data wherever it is stored, creates conflict. Sector rules add their own layers: HIPAA for US health data with business associate agreements, the Payment Card Industry standard for card data and Sarbanes-Oxley for financial reporting controls.

Litigation brings electronic discovery, the identifying, preserving, collecting and producing of electronic data. In the cloud you must know where data is held, how a legal hold is applied so that deletion stops, what the provider will support and at what cost. Contracts are the customer's main instrument for turning promises into obligations. Look for service levels, data ownership and location, security obligations, breach notification timelines, audit rights, subprocessor controls, termination assistance and verified deletion.

Customers rarely audit a hyperscale provider themselves, so they rely on independent evidence. A SOC 1 report concerns controls over financial reporting; SOC 2 reports on security, availability, processing integrity, confidentiality and privacy, with Type I covering design at a point in time and Type II covering operating effectiveness over a period; SOC 3 is a public summary. ISO/IEC 27001 certifies an information security management system, 27017 adds cloud-specific controls and 27018 covers personal data in public clouds. The Cloud Security Alliance's Cloud Controls Matrix and STAR registry give a public, comparable view, from a self-assessment at Level 1 to third-party audit at Level 2.

Risk management ties it together. Identify assets and threats, assess likelihood and impact, and treat risk by mitigating, transferring, avoiding or accepting it. Vendor risk management applies due diligence before onboarding, contracts for obligations, ongoing monitoring and an exit plan.

Legal analysis begins with the unique cloud risks: conflicting international legislation, government access requests, jurisdiction of the data and of the provider, and the evaluation of legal and regulatory frameworks. Privacy requirements distinguish contractual from regulated personal data (PII and PHI), name country-specific laws (FERPA, PIPEDA, GDPR, HIPAA with HITECH, India's Digital Personal Data Protection Act), recognize jurisdictional differences, and use standard privacy frameworks such as ISO/IEC 27018 and GAPP, with a privacy impact assessment before launch. eDiscovery follows ISO/IEC 27050 and CSA guidance, and forensics requirements follow ISO/IEC 27037, 27041, 27042 and 27043.

Audits in the cloud must be adapted: virtualization and shared responsibility create assurance challenges, report types (SOC 1, 2 and 3 under SSAE 18, and ISAE 3402 or 3000 internationally) have scope statements that limit what they assure, and gap analysis and control self-assessment turn findings into treatments. Enterprise risk management adds data roles (owner, controller, custodian, processor, steward), regulatory transparency duties (breach notification, SOX), risk frameworks (ISO 31000, NIST RMF, COSO, ENISA), metrics such as key risk indicators, and specialized regimes for regulated sectors (NERC CIP, HIPAA and HITECH, PCI DSS).

Contract design ties it together: the master service agreement, statement of work and service-level agreement set the business terms, and vendor management, right to audit, termination, data ownership, escrow, cyber risk insurance, supply-chain standards (ISO/IEC 27036) and assessments of the provider's risk management program protect the customer when things go wrong.""",
        'fundamentalsLabel': 'New to cloud law and risk? See the everyday analogy',
        'fundamentals': "Imagine you store family heirlooms in a bank's safe deposit boxes in several countries. You remain the owner and answer for the heirlooms, even though the bank holds them, and you need a rental contract that says who may open the box, how fast you are told if something happens and what happens when you close it. Different countries have different rules about what officials may demand from a bank, so you might keep the only key yourself. Instead of inspecting every bank vault, you read independent inspection reports and check whether they covered your branch and the right period. And before choosing a bank you investigate it; afterwards you keep watching it.",
        'keyTerms': ['Controller and processor', 'GDPR', 'Data residency versus sovereignty', 'Standard contractual clauses', 'eDiscovery and legal hold', 'SOC 2 Type II', 'ISO/IEC 27001, 27017, 27018', 'CSA STAR', 'Due diligence and due care', 'Conflicting laws and jurisdiction', 'Privacy laws and frameworks', 'SOC, SSAE and ISAE reports', 'Risk frameworks and metrics', 'Contract terms and vendor management'],
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
