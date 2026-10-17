# CISSP content review

Track `cissp` (data/cissp_a.py and data/cissp_b.py). Reviewed October 2026 against the ISC2 exam outline effective 15 April 2024.

## Counts

- **Read:** 534 flashcards (all read by the first reviewer; the successor re-read all 534 after the edits and re-examined every card in the near-duplicate and blanking lists), 408 questions (283 multiple choice, 46 multi-select, 79 true/false), 14 mad libs, 11 sequences, 21 compare pairs, 4 case studies (16 questions), 18 lesson readings, 15 cheat-sheet sections.
- **Changed:** 37 flashcards, 31 questions (23 mc, 0 ms, 8 tf), 1 compare pair, 1 lesson reading. No mad lib, sequence, case study or cheat-sheet section needed a change.
- **Flagged for a human check:** 4 (below).
- No item was added or removed; ids, categories and counts are unchanged. `python3 build.py` passes and `python3 tools/audit_content.py cissp` shows 0 errors (the two remaining "double-period" warnings, f9272 and q9126, are the literal path string `../`).

## Changed

### Flashcards: bracketed acronyms blanked the definition (fronts)
The app blanks any bracketed acronym of the front wherever the definition spells it, so these prompts became mostly blanks. The list moved after a colon (or the bracket was dropped), so the definition reads and the term is still the topic.

- f10 | "NIST, COBIT, SABSA" in brackets were blanked inside the definition of the frameworks | front now "Security control frameworks"
- f81 | 4 blanks (ECB, CBC, CTR, GCM) | front "Block cipher modes of operation: ECB, CBC, CTR and GCM"
- f9108 | 4 blanks (DV, OV, EV, SAN) | front "Certificate types and validation: DV, OV, EV, wildcard and SAN"
- f1004 | 6 blanks (FAR, FRR, CER) | front "Biometric error rates: FAR, FRR and CER"
- f1010 | 5 blanks (KDC, AS, TGS, TGT) | front "Kerberos components: KDC, AS, TGS and TGT"
- f9046 | "AI" blanked three times | bracket dropped from the front
- f9130 | "CO2" blanked | front "Gaseous fire suppressants: clean agents, CO2 and halon"
- f9101 | "PBKDF2" blanked | front "Password hashing and key stretching: bcrypt, scrypt, Argon2 and PBKDF2"
- f9061 | "STIGs" blanked | front "Standards selection and baselines: CIS Benchmarks and STIGs"
- f9292 | SaaS, PaaS, IaaS blanked, and the definition repeated f9072 | bracket dropped; definition now about assessing the provider at acquisition (SOC 2 or ISO reports, security duties, breach notification, audit rights, data location, exit)

### Flashcards: accuracy and wording
- f90 | definition said "known and chosen plaintext" but the term lists chosen ciphertext | definition now covers known-plaintext and chosen-ciphertext attacks
- f9071 | garbled sentence "Resources are treated as untrusted-network resources" | now "No resource is trusted merely because of its network location" (NIST SP 800-207); "in the outline" became "in the exam outline"
- f9092 | example said the provider's share of responsibility is narrowest in serverless (backwards) | now says the customer's share is at its narrowest but not zero
- f9216 | example had the dangling reference "evidence for 6.3" | made self-contained (objective 6.3 of the exam outline, links to Domain 5)
- f9294 | said SSDF 1.1 "is the current release" | NIST issued the SP 800-218 Rev. 1 (SSDF 1.2) initial public draft on 17 December 2025; 1.1 is still the final release, so the wording says so (https://csrc.nist.gov/projects/ssdf/news)
- f9102 | listed DSA as a current signature algorithm | FIPS 186-5 (2023) no longer approves DSA for creating new signatures; caveat added (https://csrc.nist.gov/pubs/fips/186-5/ipd and the Federal Register notice of 3 Feb 2023)
- f9259 | example said a camera that nobody "monitors or retains" only helps after the incident (illogical) | reworded

### Flashcards: near-duplicate pairs, one card of each pair now tests something different
- f1065 | same as f102 (IDS vs IPS) | now network-based vs host-based intrusion detection (NIDS/HIDS)
- f1011 | same as f106 (RADIUS vs TACACS+) | now Diameter as the successor to RADIUS
- f1085 | same as f36 (BCP vs DRP) | now the disaster recovery plan itself
- f1083 | same as f35 (hot, warm, cold, mobile sites) | now reciprocal (mutual aid) agreements
- f1084 | same as f37 (test-type ladder) | now parallel vs full-interruption tests
- f1061 | same as f22 and f9020 (standards of proof, types of investigation) | now the administrative (internal) investigation
- f1080 | same as f34 (MTD, RTO, RPO, WRT) | now RPO vs RTO and what each drives; example corrected to "RTO plus WRT must fit inside the MTD"
- f9218 | same as f9045 (measuring awareness) | now training completion and coverage as security process data
- f9202 | same as f9075 (access control matrix, ACLs, capabilities) | now capabilities
- f1062 | same as f45 (legal hold) | now eDiscovery
- f9181 | same as f3 (AAA) | now centralized AAA services
- f1100 | same as f9277 (OWASP Top 10 2025 list) | concept card no longer repeats the ten categories (the list stays in f9277; both verified against https://top10.owasp.org/2025)
- f1020 | same as f9070 (segregation of duties) | now dual control and split knowledge
- f9247 | same as f1070 (honeypots) | now enticement vs entrapment
- f9257 | same as f9134 (fence heights, bollards, guards) | now the four functions deter, delay, detect, respond
- f1089 | same as f9129 (sprinkler types) | now the pre-action sprinkler system
- f1058 | same as f21 (chain of custody) | now evidence integrity and hash verification
- f18 | same as f9016 (GDPR transfer mechanisms) | concept card no longer repeats the mechanisms; adds data localization
- f9242 | same notification clocks as f9012 | keeps the reporting and communications process; the clocks stay in f9012
- f9241 | same as f9064 (data at rest and in transit) | now backups, keys, certificates and endpoints in operations
- f1083 example reworded again ("cheapest is least reliable" also fitted a cold site).

### Questions: key and stem defects
- q1037 | **wrong answer key**: the marked answer was "Rebuild the workstation ... immediately" while the explanation (and the incident lifecycle) says containment with evidence preserved comes first | key moved to "Contain the affected system while preserving evidence"
- q9068 | stem did not say the VPN login came from outside, so "normal behavior" was defensible | stem now says the login came from an external internet address
- tf1013 | called an incident "an observable occurrence" (that is an event), so the statement was false for two reasons | now "An event is any observable occurrence ... every event should be treated as an incident"
- q52 | criterion "BEST aligned with security governance" did not match the life-safety explanation | stem now "Which design is BEST?"
- cmp-cissp-106 | scenario said the server "is restored every Sunday from a full backup" | now "gets a full backup every Sunday"

### Questions: near-duplicates rewritten to test something different (explanations rewritten with them)
- q9004 | copy of q27 (PCI DSS is not a law) | now PCI DSS scope: a hosting company that only transmits card data is in scope
- q1015 | copy of q66 (mantrap stops tailgating) | now visitor management (distinct, limited, escorted visitor credentials)
- q1045 | copy of q60 (pre-action limits accidental discharge) | now the right portable extinguisher for an energized rack
- q1046 | copy of q16 (mandatory vacation) | now job rotation with cross-training
- q1044 | third parallel-test question (with q15 and q9115) | now the full interruption test as the most realistic and riskiest
- q9115 | same | now what must follow a DR test (document results, update the plan)
- q1032 | copy of q19 (write-blocked, hashed image) | now the limit of flow records as network evidence
- q9074 | copy of q1013 (PAM vault for shared admin passwords) | now just-in-time privileged access
- q9081 | copy of q1008 (mover step) | now break-glass emergency access
- q9128 | copy of q51 (fail secure) | now complete mediation
- q9122 | copy of q1060 (SAMM) | now BSIMM as the descriptive benchmark
- q9110 | copy of q1041 (emergency change) | now the rollback plan in a change request
- q1059 | copy of q11 (identify STRIDE) | now map a price-tampering threat to a STRIDE category
- q9077 | copy of q9026 (policy decision point) | now the policy information point
- tf9002 | copy of tf8 (degaussing and SSDs) | now a single overwrite pass is unreliable on flash media
- tf1018 | copy of tf9 (suspend deletion under a legal hold) | now spoliation even when deletion followed the schedule
- tf9020 | copy of tf1019 (allow vs deny lists) | now name-based allow lists are weak compared with hash or publisher rules
- tf1001 | restated the exact scenario of q1001 | now the positive case, password plus hardware token
- tf1002 | overlapped q1002 (CER) | now the FAR/FRR trade-off
- tf1011 | overlapped q9087 (coverage) | now a clean static analysis report does not prove security
- tf9016 | overlapped q9093 (coordinated disclosure) | now security.txt (RFC 9116)

### Questions: giveaways
- q9059, q9081, q9083, q9092, q9101, q9117, q9125 | the correct option was 25 to 30 percent longer than the next one | distractors lengthened with plausible detail; q9004 stem reworded so the key no longer repeats its words. Share of mc items where the key is longest is now 24 percent.

### Lessons
- cryptography-pki (reading) | called bcrypt and PBKDF2 "memory-hard" | now "slow, salted hashing such as Argon2, scrypt, bcrypt or PBKDF2 (Argon2 and scrypt are also memory-hard)"

## Needs a human check

- f9294 | SSDF version: 1.2 (SP 800-218 Rev. 1) was a draft in December 2025 and no final was visible in October 2026 searches | worded as "1.1 is the current final release"; re-check before relying on it
- Cheat sheet "Exam format and domain weights" (experience line) | a secondary source says ISC2 shortened the list of credentials that can waive one year of CISSP experience from April 2026; also no sign of a new CISSP outline after 15 April 2024, but ISC2's own pages were not checked | text says "an approved credential" and "outline in effect since April 15, 2024", still true as far as found
- f9007 (FedRAMP) | FedRAMP is being reworked under "20x"; the Low/Moderate/High baselines the card cites were not re-checked | left unchanged
- q1043 | "restore as quick as possible while keeping daily backup windows short": daily fulls restore fastest, differential is the usual compromise (and cmp-cissp-106 and the lesson teach it) | left as is

## Patterns

The track is strong on facts: the 2025 OWASP list, NIST CSF 2.0, SP 800-61 Rev. 3, SP 800-63-4, TLS certificate lifetimes, PCI DSS 4.0.1 and FIPS 140-3 all checked out, and only one answer key was wrong (q1037). The main weakness is repetition: the two authoring passes (domain files and the later ISC2 refresh) produced about 20 card pairs and 20 question pairs that asked the same thing, which matters more now that cards are shown definition first, so one of each pair was retargeted to a neighbouring topic from the same objective. The second problem is cards whose bracketed acronyms are all blanked in the prompt; moving the list after a colon fixes it without losing the information. Distractors are generally plausible, and the longest-correct-option bias is close to chance (24 percent).
