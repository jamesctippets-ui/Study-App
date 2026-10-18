# SSCP content review

Track `sscp` (`data/sscp.py`, one file, no part files). Reviewed October 2026 against the ISC2 SSCP exam outline effective 1 October 2025 (checked on isc2.org: domain names and weights, 100 to 125 items, 2 hours, 700/1000, English, Japanese and Spanish, risk treatment list "accept, transfer, mitigate, avoid", "Storage management (e.g., data domain)").

## Counts

- **Read (every item):** 315 flashcards, 368 questions (226 multiple choice, 51 multi-select, 91 true/false), 8 mad libs, 6 sequences, 12 compare pairs, 2 case studies (8 questions), 8 lessons (reading plus summary, analogy, key terms, traps, scenario and on-the-job text), 9 cheat-sheet sections.
- **Changed:** 52 flashcards, 14 questions (6 mc, 4 ms, 4 tf), 1 mad lib, 2 sequences, 4 lessons, 1 cheat-sheet section. No compare pair or case study needed a change.
- **Flagged for a human check:** 3 (below).
- No item was added or removed. Ids, categories and counts are unchanged (315 cards, 368 questions). One card (f9164) was rescoped because it duplicated another. `python3 build.py` passes and `python3 tools/audit_content.py sscp` shows 0 errors and 0 warnings (it started with 7 warnings). The number of cards whose definition-first prompt is blanked fell from 37 to 18, and none of the 18 has two different blank terms.

## Changed

### Flashcards: the definition-first prompt blanked several different terms (fronts that listed acronyms)
The app blanks every bracketed acronym of the front wherever the definition spells it, so these prompts read as "_____ encrypts each block ... _____ chains blocks ...". The members are now spelled out in the definition with their acronym after the name, and the front is a single concept name (or the definition says "One ... The other ..."), so nothing is blanked.

- f51 | five blanks (SLE, ARO, ALE, SLE, ARO) | front "Quantitative risk formulas"
- f83 | four different blanks (MTD, RTO, RPO) | front "Recovery objectives"
- f93 | four different blanks (ECB, CBC, CTR, GCM) | front "Block cipher modes of operation"; definition names Electronic codebook (ECB), Cipher block chaining (CBC), Counter mode (CTR), Galois/Counter Mode (GCM)
- f98 | two blanks (PKI, CA) | front "Public key infrastructure (PKI)"; certificate authority (CA) described in the definition
- f116 | IKE blanked while AH and ESP were spelled out | front "IPsec"; AH, ESP and IKE given after their full names
- f118 | two blanks (WPA2, WPA3) and a near-duplicate of f9121 | front "Wi-Fi personal vs. enterprise mode"; definition is now shared passphrase versus 802.1X/EAP with RADIUS (unique keys, per-user accountability, revocation); WPA versions stay on f9121
- f9121 | four blanks (WEP, WPA, WPA2, WPA3) | front "Wi-Fi Protected Access evolution"
- f126 | three blanks (SASE, ZTNA) | front "Secure Access Service Edge (SASE)"; ZTNA described in the definition
- f151 | only DMARC blanked, SPF and DKIM spelled out | front "Email authentication standards"; SPF, DKIM, DMARC with full names
- f9035 | only ISACs blanked | front "Threat intelligence sharing"; ISACs, STIX, TAXII, TLP in the definition
- f9047 | only HIPAA blanked, GDPR spelled out | front "Privacy regulations and breach notification"; GDPR added after the name
- f9079 | "_____/IEC 27001", plus GDPR and HIPAA blanked | front "Regulatory drivers for cryptography"
- f32 | only SAML blanked while OAuth and OpenID Connect stayed readable | front "Federated identity"; definition opens with a description
- f122 | only DNSSEC blanked | front "DNS security"
- f9014 | "Configuration management" readable in the definition | front "Configuration management (CM)"; definition opens with a description and ends with the configuration management database (CMDB), which is now the only blank
- f12 | front 97 characters (audit warning) | front "Types of security controls by function"; the six functions are in the definition
- f112 | five identical VLAN blanks (audit warning) | two blanks; "VLAN 1" and "native VLAN" detail moved to the example
- f82, f102, f113, f138, f43 | one half of an "X and Y" front blanked while the other half was spelled out | "One ... The other ..." wording so neither half is readable
- f94 | RSA readable while ECC was blanked | definition describes the two algorithm families without naming either
- f149 | only XSS blanked, SQL injection readable | "One attack ... Another ..." wording
- f120 | DoS readable, DDoS blanked | definition no longer names either

### Flashcards: near-duplicates, one of each pair now tests something different
- f9164 | exact duplicate of f111 (microsegmentation) | rescoped to a different concept, "East-west and north-south traffic"; the extra detail of the old f9164 (processes, cloud security groups, lateral movement, map flows first, default deny) moved onto f111. Lesson network-security-controls now mentions east-west and north-south.
- f108 | near-duplicate of f9161 (cleartext replacements) and f9102 (port list) | definition now the secure services by port (SSH/SFTP/SCP 22, HTTPS 443, LDAPS 636, IMAPS 993, POP3S 995, SMTP submission 587, DNS over TLS 853) against the cleartext ports they replace
- f132 | near-duplicate of f9136 (social engineering methods) | front "Social engineering"; definition about manipulation, spear phishing, pretexting and in-person forms; channels (spam, smishing, vishing, whaling) stay on f9136
- f136 | near-duplicate of f69 (patch and vulnerability cycle) | definition is the vendor-update workflow: assess, pilot group, maintenance window, rollback, verify
- f9159 | near-duplicate of f69 | definition is the program view: inventory, schedule, severity-based deadlines, exceptions with owner and expiry
- f9140 | near-duplicate of f102 (HSM) | definition leads with management practice (roles, quorum, wrapped backups, clustering, logs)
- f9156 | near-duplicate of f145 (VM escape and sprawl) | front "Hyperjacking and other virtualization threats"; definition leads with the rogue hypervisor, snapshots and management consoles
- f104 | "Steganography" readable in a card that also covers attacks | definition describes the technique without the name
- f9095 | overlapped f2 (non-repudiation) | definition lists the three mechanisms (signatures, timestamps, audit trails) and why HMAC cannot

### Flashcards: accuracy and wording
- f9043 | "Ignoring appears on the outline's treatment list as the behaviour to avoid" is false: the 2025 outline reads "Risk treatment (e.g., accept, transfer, mitigate, avoid)" (https://www.isc2.org/certifications/sscp/sscp-certification-exam-outline) | now "It is not a treatment option (the options are accept, transfer, mitigate and avoid) but a failure to choose one"; front was a sentence, now "Risk acceptance vs. ignoring risk"
- f79 | RAM, process list and network tables are one tier in RFC 3227, but the card, the sequence and the lesson put network state after processes, which is ambiguous | card, seq-sscp-2, lesson incident-response-forensics-recovery and the cheat sheet now agree: registers and cache, RAM with processes and network state, temporary files and swap, disk, remote logs, archival media (consistent with the CISSP and CCSP cards)
- f9086 | "The elliptic-curve ephemeral form" was awkward and implied that only the elliptic-curve variant gives forward secrecy | "The ephemeral variants, including the elliptic-curve one, give forward secrecy"
- f9155 | "Dell Data Domain" | "Dell PowerProtect Data Domain" (current product line, https://www.dell.com/en-us/shop/storage-servers-and-networking-for-business/sf/powerprotect-data-domain)
- f89 | typo "about cause cause legal" | "about the cause can cause legal"
- f9020 | "a lockers area" | "lockers"

### Flashcards: the term was readable in the definition (definition now opens with a description)
f81 ("A legal hold is ..."), f9023 ("In Security Assertion Markup Language ..."), f9024 ("OpenID Connect adds ..."), f9034 ("assurance levels"), f9045 ("CVSS v4.0 from FIRST ..."), f9060 ("ISO/IEC 27035 describes ..."), f9085 ("Cryptanalysis attempts ..."), f9089 ("A blockchain is ..."), f9113 ("A load balancer spreads ..."), f9117 ("CIDR notation gives ..."), f9148 ("A virtual private cloud is ...").

### Questions
- q32 | the key option "Residual risk remaining after the hardening controls were applied" was pasted from a distractor of q8 (65 characters against 14, and it mentions hardening, which the stem never does) | key option is now "Residual risk"
- msq9001 | distractor "A next-generation firewall policy" reads as an administrative policy | "Rules configured on a next-generation firewall"; explanation says "firewall rules"
- msq9020 | both keys described the same attack (cache poisoning and forged DNS responses) | now "Which TWO controls help protect a resolver against DNS cache poisoning": DNSSEC validation and randomized source ports and transaction IDs; distractors SYN cookies, ARP inspection, output encoding
- msq3, msq9011 | both keys far longer than the distractors | distractors lengthened (msq9011 also shortened one key)
- q9100 | near-duplicate of q52 (lawsuit, legal hold FIRST) | the hold is already issued and the question asks the NEXT step: work with the provider to preserve and export the mailboxes with metadata and custody records
- q9090 | near-duplicate of q9076 (virtual patch for a flaw that cannot be fixed) | now a critical patch under a short maintenance window: pilot test, planned window with rollback, verify
- q9084 | near-duplicate of q75 (worm identification) | now the control that limits a worm: patch the service and block it between segments
- q9094 | near-duplicate of q80 (BYOD container with selective wipe) | now a rooted personal phone: mark non-compliant and block corporate access
- q9114 | near-duplicate of q24 (same ABAC answer) | now ACL attached to the object versus capability held by the subject
- tf9053 | near-duplicate of tf9042 (snapshot is not a backup) | now True: a pre-patch snapshot is a quick short-term rollback if deleted once the change is confirmed
- tf9050 | near-duplicate of tf30 and q9129 (span port cannot block) | now True: a network sensor cannot read encrypted traffic unless it is decrypted first or inspected at an endpoint
- tf9011 | near-duplicate of tf13 (CVSS is not business risk) | now True: Threat and Environmental metrics move a base score toward real-world priority
- tf34 | near-duplicate of q81 (IaaS customer patches the guest OS) | now PaaS: the provider patches the underlying OS, the customer keeps application code and data

### Mad libs, sequences, compare, case studies
- ml-sscp-6 | "an {b1}" and "an {b2}" with the distractors "proxy server" and "network tap" gave them away by grammar | "application proxy" and "inline network tap"
- seq-sscp-2 | steps 2 and 3 (memory and processes, then network state) ambiguous against RFC 3227 | step 2 is "Contents of memory (RAM), including running processes and network connections", step 3 "Temporary files and swap space"; explanation rewritten
- seq-sscp-9001 | duplicate of seq-sscp-3 (vulnerability management cycle) | now the seven NIST RMF steps (prepare, categorize, select, implement, assess, authorize, monitor)
- Compare (12 pairs) and case studies (2, with 8 questions): read in full, keys and explanations agree, scenarios consistent; no change.

### Lessons and cheat sheet
- security-concepts-and-controls | key term "Compensating control" listed twice | duplicate removed
- incident-response-forensics-recovery | order-of-volatility sentence | aligned with f79 and seq-sscp-2
- network-security-controls | reading did not cover east-west traffic; two near-identical span-port traps | reading now says east-west and north-south once; the repeated trap replaced by the micro-segmentation / east-west trap
- systems-endpoint-cloud-application-security | empty paragraph in the reading (a stray "\n\n" literal) | removed
- Cheat sheet, Incident response and recovery | forensics bullet | order of volatility aligned

## Needs a human check

- f9079 (and the HIPAA mention in f9047) | "HIPAA treats encryption as an addressable safeguard" is correct today, but the January 2025 NPRM would make it required | The Federal Register search (October 2026) still shows only the proposed rule, so I left the card; recheck if a final rule is published before the exam content is next reviewed.
- f9060, q9036, tf9020, lesson incident-response-forensics-recovery, cheat sheet | ISO/IEC 27035 phase names (prepare, detect and report, assess and decide, respond, learn lessons) | The standard is paywalled; the public abstract (preparation, detection, reporting, assessment, response, lessons) agrees, but I could not read the exact labels. Left as written.
- "X vs. Y" comparison cards (f19, f21, f34, f55, f60, f63, f106, f107, f144, f9008, f9033, f9042, f9083, f9097, f9111, f9145) | both names appear in the definition, so the definition-first prompt shows the answer | The build check only forbids the exact front, so it passes; I changed only the cards where one half was blanked and the other not. A project-wide decision on comparison cards is outside this track.

Also left on purpose: mc/tf pairs that restate the same fact (q26/tf12, q9062/tf9028, q9027/tf9014, q9063/tf9029, q42/msq10); they reinforce rather than duplicate scenarios.

## Patterns

The track is factually sound: every key I checked was right, explanations agreed with the keys, calculations (SLE/ALE, /26 hosts, full mesh) were correct, and the 2025 facts I checked on the web (OWASP Top 10:2025 at top10.owasp.org, CVSS 4.0 as current at first.org, the outline's domains, weights, format and languages, the Dell product name) held up. The NIST items (SP 800-61 Rev. 3, SP 800-88, SP 800-57 strengths, FIPS 203 to 205) agree with the other tracks' cards but were not re-read at csrc.nist.gov. The one false statement was the claim that the outline lists "ignore" as a treatment. The real problem was mechanical: about 20 fronts carried bracketed acronym lists that the definition-first prompt turned into rows of different blanks, and the "October 2025 outline audit" cards and questions (ids 9001 and up) repeated older items (HSM, microsegmentation, social engineering, patching, snapshots, span ports, worms, legal hold) and often opened with "A X is ...", leaving the term readable. Questions needed little: one pasted key option (q32), one ambiguous distractor, one question with two keys for the same attack, a handful of giveaways and nine near-duplicates rewritten to test a different point.
