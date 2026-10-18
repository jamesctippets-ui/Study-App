# Content review: CSSLP (data/csslp.py)

Reviewed October 2026 against the ISC2 CSSLP outline (effective 15 September 2023, still the current outline on isc2.org).

## Counts

- Read in full: 272 flashcards, 330 questions (216 multiple choice, 40 multi-select, 74 true/false), 9 mad libs, 9 sequences, 16 compare pairs, 2 case studies (9 questions), 8 lessons, 9 cheat-sheet sections.
- Changed: 127 flashcards (15 fronts), 69 questions (37 mc, 7 ms, 25 tf; 12 true/false keys changed because the statement was replaced), 2 mad libs, 1 sequence, 8 compare pairs, 2 case studies, 4 lessons, 2 cheat-sheet bullets.
- No item added or removed. Ids, categories and counts are unchanged. Every changed card and every rewritten question was re-read after the edit; `python3 build.py` passes and `tools/audit_content.py csslp` reports 0 errors and 1 warning (f9102 `..%252f` is an intentional path-traversal example).
- Flagged for a human: 4 (below).
- Facts checked online: ISC2 outline page (effective date, weights, 125 items, 3 hours, 700/1000), NIST SP 800-88 Rev. 2 (final 26 Sep 2025, supersedes Rev. 1, still uses clear/purge/destroy; csrc.nist.gov/pubs/sp/800/88/r2/final), CSA Cloud Controls Matrix v4 (197 control objectives, 17 domains), SAFECode (still active, published the CIS Secure by Design guide in Oct 2025, v1.1 in Jul 2026), CJEU C-413/23 P (4 Sep 2025), SSDF (SP 800-218 v1.1 is still the final text; Rev. 1 is a Dec 2025 draft).

## Changed

### Flashcards: definition-first prompt broken (blanks that are different terms, half a term blanked, or a front too long)

- f39 | front "(GDPR, HIPAA, PCI DSS, SOX)" gave "_____ for personal data ..., _____ for US health information, PCI DSS for payment cards and _____ for financial reporting" | front is now "Regulatory and compliance requirements"; the four regulations stay named in the text.
- f62 | bracket list blanked only SAML ("_____ and OpenID Connect carry authentication") | front "Federated identity and single sign-on"; SAML, OIDC and OAuth 2.0 named in the text.
- f9091 | "(REST, SOAP, GraphQL, statelessness)" gave "_____ APIs ... _____ offers ... _____ needs" | front "Protocol and API design choices"; opening sentence reworded.
- f9172 | SLO and SLA both blanked as "(_____)", nothing says which is which | definition now describes the two terms without naming them.
- f44 | RTO and RPO were two identical blanks | definition describes time to restore and tolerable data loss as a pair, no blanks.
- f37 | only DPIA blanked, PIA readable in the text | front "Privacy impact assessment (PIA)"; the DPIA is named in the text as the GDPR counterpart.
- f9031 | spelled out both verification and validation, only "Independent V&V" blanked | definition describes the two checks; only "independent _____" is blanked.
- f9076 | TPM readable, TCB blanked half-way ("(_____)", "A smaller _____") | definition describes both without naming them.
- f9066 | acronym list blanked "_____ tags" and "(_____)" | front "Pervasive and ubiquitous computing"; technology list moved to f9092.
- f52, f75 | answer readable in the text ("Data flow diagram ... and trust boundaries", "Use-after-free and memory safety") | fronts "Data flow diagram (DFD)" and "Use-after-free"; the second idea stays inside the definition.
- f9064, f9070, f9160 | fronts of 91, 103 and 93 characters (audit warning) | "Service-oriented architecture (SOA)", "Hardware platform security concerns", "Operational risk analysis"; the lists stay in the definitions.

### Flashcards: multi-term front whose definition spelled out every member (answer readable)

- f1, f2, f12, f16, f17, f27, f31, f33, f36, f45, f94, f95, f97, f100, f102, f103, f104, f118, f121, f123, f9002, f9005, f9006, f9027, f9028, f9042, f9044, f9045, f9063, f9067, f9068, f9087, f9100, f9102, f9108, f9131, f9132, f9139, f9140, f9144, f9168, f9182 | definition named each member of the front (CIA, AAA, "X versus Y", "X and Y") so the prompt read the answer back | definitions reworded to describe each member without naming it (for example f1 "The three core properties of information security: keeping it from unauthorized disclosure, keeping it accurate ..."); fronts kept.
- f42 | front "Identity and access requirements (RBAC and ABAC)" did not match a definition about two access control models | front "Role-based and attribute-based access control (RBAC and ABAC)", definition no longer names the models.
- f53, f69, f76 | same pattern, with an attack/defense pair (f69) and a flaw/special case pair (f76) | definitions reworded.

### Flashcards: definition opened with the term itself (or a near copy)

- f25, f26, f28, f54, f56, f72, f81, f89, f90, f91, f101, f106, f108, f113, f114, f127, f128, f9001, f9004, f9007, f9030, f9032, f9033, f9043, f9082, f9085, f9109, f9141, f9164, f9180, f9185, f9188 | first words repeated the front ("Zero trust assumes", "Hardening removes", "Fuzzing feeds", "The CSA Cloud Controls Matrix is") | opening reworded ("An architecture that assumes ...", "Removing unneeded services ...", "Feeding large amounts of ..."); meaning unchanged.

### Flashcards: near-duplicate definitions sharpened (could not be told apart definition-first)

- f96 vs f9147 | both ended in "attempts to skip steps ... refuses safely" | f96 now lists boundary values, wrong types, oversized or malformed fields.
- f115 vs f9083 | both "backups protected from ransomware" | f115 now operations (scheduled backups, rehearsed restores, recovery and continuity plans); f9083 kept as the design view.
- f125, f9050 (and f9186) | three cards on supplier security terms | f9050 is the requirements baseline before selection, f125 is the enforceable contract after selection, f9186 unchanged apart from apostrophes.
- f9011 vs f10 | both opened with "security rests on keys, not a hidden design" | f9011 now only the practices (peer review, open source, bug bounties).
- f9014 vs f11 | same principle twice | f9014 renamed "Usable controls and screen layouts" and limited to design choices.
- f9034 vs f22 | the same waterfall/agile/DevOps contrast | f9034 now covers ownership and scheduling of each activity.
- f9051 vs f33 | both opened with "a misuse or abuse case describes how an attacker ..." | f9051 now stresses that the write-up is complete only with mitigating controls.
- f9078 vs f9093 | both defined managed runtimes and scripting hosts | f9078 now "Managed runtimes and virtual machines (CLR and JVM)", f9093 "Scripting environments (Python and PowerShell)".
- f9092 vs f9066 | both defined pervasive computing with the same technology list | f9066 is the paradigm and its constraints, f9092 the RFID/NFC/sensor-mesh technologies and their attacks (front "RFID, NFC and sensor mesh technologies").
- f9094 vs f9080 | both "virtualization lets many workloads share hardware under a hypervisor" | f9094 now infrastructure defined as code and the template as control point.
- f9122 vs f77 | both "generic message to users, detail in protected logs" | f9122 now the exception-handling mechanics (specific catches, no empty catch, finally, default deny).
- f9123 vs f85 | f9123 repeated the SAST definition | f9123 starts from linting versus heavier security analysis.
- f9161 vs f9174 | both listed version control, baselines, patch records, documentation | f9161 code, configuration and patch levels; f9174 hardware and firmware.
- f9164 vs f9067 | both defined secure boot and root of trust | f9164 as a chain of trust and signing-key management; f9067 as the embedded view.
- f9020 vs f26 | both "completed threat model ... scans" | f9020 now milestones with approved requirements, design review, dependency scan.

### Flashcards: factual or wording errors

- f40 | said FIPS 199 categorization "is the first step in the NIST risk management approach" (RMF Rev. 2 starts with Prepare) | "This is the Categorize step of the NIST Risk Management Framework."
- f65 | said NIST AI RMF catalogs LLM threats | OWASP Top 10 for LLM Applications catalogs them, NIST AI RMF frames the wider risk management.
- f71 | EXAMPLE had the trust direction of XSS and CSRF muddled ("the site trust in the browser content") | "XSS abuses the browser's trust in content from a site; CSRF abuses a site's trust in requests from the browser."
- f116 | listed Log4Shell as a supply chain attack (it was a library flaw, not a compromised supplier) | SolarWinds and the xz Utils backdoor are the attacks; Log4Shell shows how one library flaw reaches every dependent product.
- f51 | "with AND and OR nodes" (audit repeated word) | "joined by AND nodes (all steps needed) and OR nodes (any one step is enough)".

### Flashcards: missing possessive apostrophes (the source had none)

- f10, f13, f57, f58, f71, f73, f88, f9009, f9021, f9030, f9042, f9047, f9048, f9111, f9184, f9186, f121 | "Kerckhoffs principle", "the organization appetite", "someone else data", "the user browser", "the server network egress", "the buyer SIEM" and similar | apostrophes added.

### Questions: stem, key and distractor fixes

- q35 | stem never said the tester was signed in, but the key and explanation rely on it (and the "no account" distractor) | stem now says a signed-in caller; "another customer's order number".
- q12 | distractor "NIST SP 800-61, which defines the phases of incident handling" is outdated (Rev. 3, Apr 2025, follows CSF 2.0) | "which gives incident response recommendations".
- q4, msq5, msq6, msq9171 | nonsense or joke distractors ("Only symmetric algorithms can be kept hidden ...", "the vendor of the monitors in the office", "every user keystroke", "the tester enjoyed the engagement") | replaced with plausible wrong statements; explanations adjusted.
- msq18, q9048 | correct options clearly the longest, or the only option not in the gerund form | lengths balanced; "Using the enterprise identity provider ...".
- q9314 | tested the verification/validation definitions a third time (tf9006, q9015) | now "Which activity is an example of validation rather than verification?" with four example activities.
- q9325 | repeated q8 and cmp-csslp-3 (do not collect unneeded data) | now purpose limitation (e-mail addresses reused for marketing).
- q9328 | repeated q20 (SRTM is the artifact) | now how an SRTM helps when a requirement is dropped.
- q9206 | repeated q9014 (the authorizing official signs) | now sign-off level rises with the risk accepted (internal tool versus payment system).
- msq9241 | repeated msq16 (secure CI/CD elements) | now what makes automated pipeline checks effective (scanning on every change, break criteria with controlled exceptions).
- q9202 | repeated q62 (sign the installer, publish a hash) | now reproducible builds versus a compromised build server.
- q9210 | repeated q67 and cmp-csslp-9 (compensating controls while a patch is tested) | now inventory with versions and patch levels comes before patching.
- tf9017 | stem "a static analysis tool with automated code coverage metrics can show how much code tests exercised" was muddled | "A static analysis scan can show how much of the code has been exercised by the test suite." (False, unchanged).
- tf9013 | "the outline attention to" | "the outline's attention to".
- q9317 | the two stories were not quoted | quotation marks added.
- Missing apostrophes: q1, q8, q17, q22, q41, q59, q70, q75, tf1, q9001, q9005, q9020, q9023, msq9027, q9034, q9040, q9153, q9165, q9230, q9233, q9234, q9236, q9237, q9238, q9239, msq9243, tf9031, q9303, q9311, q9318 | "revokes the user permissions", "two weeks time", "the supplier marketing page" and similar | apostrophes added.

### Questions: true/false items that restated a multiple-choice question (same fact, same answer), retargeted to a new fact

- tf4 (vs q4) separation of privilege; tf5 (vs q11) SSDF is outcome-based and fits any lifecycle model (key now True); tf8 (vs q17) security impact analysis applies to every change; tf10 (vs q9022) GDPR lists six lawful bases, consent is not the only one (key now False); tf11 (vs q26) PCI DSS is contractual, not a law; tf13 (vs q30) attack trees start from the attacker's goal; tf15 (vs q38) SAML single sign-on; tf17 (vs q36) IaaS customer patches the guest operating system (key now True); tf19 (vs q45) HttpOnly cookies (key now True); tf20 (vs q43) unique salt defeats precomputed tables (key now True); tf21 (vs q44) SSRF allow-list beats block-list (key now True); tf23 (vs q52) IAST only sees paths the tests exercise; tf24 (vs q54) RASP is not primarily a test technique (key now False); tf26 (vs q55) a pen test with no critical findings proves nothing about absence; tf27 (vs q57 and the Northwind case study) false negatives are more dangerous (key now True); tf29 (vs q65) CVSS Base is the same for every organization, Environmental adjusts it (key now True); tf30 (vs q69) cryptographic erase can be acceptable (key now True); tf31 (vs q68) blue-green rollback; tf34 (vs q77) Common Criteria is evaluated against a Security Target (key now True); tf9007 (vs q9020) classification labels travel with the data (key now True); tf9011 (vs q9042) hardware security module. Explanations rewritten to match; true/false balance moved from 30 True of 74 to 38 of 74.

### Mad libs, sequences, compare, case studies

- ml-csslp-9001 | distractor "tokenization of the vault" is also a form of pseudonymization and oddly worded | "aggregation".
- ml-csslp-9002 | "coverage-free" is not a fuzzing term | "grammar-based".
- seq-csslp-9001 | last step "verify that nothing depends on the system" read as a check that should come before removing access and destroying data | now "confirm that no dependencies, DNS records or integrations still point at the system, and close it formally"; explanation matched.
- cmp-csslp-1, cmp-csslp-8, cmp-csslp-9002 | missing apostrophes ("a user entitlements", "the vendor repository", "the whole supplier product line") | added.
- cmp-csslp-9001 (repeated cmp-csslp-9), cmp-csslp-9003 (repeated q9120), cmp-csslp-9004 (repeated q9155), cmp-csslp-9005 (repeated cmp-csslp-3), cmp-csslp-9006 (repeated q9035) | each pair was the same idea and the same answer | rewritten to certificate expiry lifecycle, unsafe native deserialization, FIPS 140-3 validated module versus in-house cryptography, retention of support chat transcripts, private object storage with short-lived links versus public random names; the `better` key is unchanged on each.
- cs-csslp-harborview-health (Q4 and Q2), cs-csslp-northwind-pipeline (Q1, Q2, Q4) | the correct option was about twice as long as every distractor; one missing apostrophe | key shortened and distractors lengthened (Q4 explanation matched); apostrophe added.

### Lessons and cheat sheet

- secure-software-concepts | "Kerckhoffs principle" | "Kerckhoffs's principle".
- secure-software-requirements | "the organization policies and standards" | "the organization's policies and standards".
- secure-implementation | "another user record"; "Sanitization means canonicalizing input before validating it and encoding output" merged three different things | apostrophe; sentence now separates sanitization, canonicalization and output encoding.
- secure-supply-chain | "the supplier secure development practices", "the buyer SIEM" | apostrophes added.
- Cheat sheet, Exam facts | "bachelor or master degree" | "bachelor's or master's degree".
- Cheat sheet, Exam-day strategy | "about 1 minute 25 seconds per question" (10,800 s / 125 = 86.4 s) | "about 1 minute 26 seconds".

## Needs a human check

- f9045, q9022, tf9038, f38, lesson "Secure Software Requirements" | the track teaches that pseudonymized data remains personal data under GDPR. The CJEU (C-413/23 P, EDPS v SRB, 4 Sep 2025) held that pseudonymised data need not be personal data for a recipient that cannot re-identify the people. Left as is: the exam teaching and the question scenarios (the controller holds the mapping table) are still correct; add a qualifier if ISC2 material changes.
- f19, f9026, q13, tf5, cheat sheet | cite SSDF as SP 800-218. NIST published a Rev. 1 draft (SSDF 1.2) on 17 Dec 2025 and I found no final version; the four groups are expected to stay. Recheck once Rev. 1 is final.
- Cheat sheet "Exam facts" | "the outline names the CSSLP accreditation as ISO/IEC 17024 through ANAB": the outline page I fetched did not show this wording, so I could not confirm it; left unchanged.
- f9088 | CVSS card is filed under csslpDesign while the topic is vulnerability scoring (testing and operations). Left because the outline mapping is not visible from here and no question depends on it.

## Patterns

The track was factually strong: the technical content (design principles, OWASP, NIST, SLSA, SBOM, CVSS 4.0, FIPS 199) checked out, and only a handful of factual slips were found (f40, f65, f71, f116 and an outdated NIST SP 800-61 distractor in q12). The main defect was structural: about 60 cards used a list or "X and Y" front, so the definition-first prompt either blanked unrelated terms or spelled the answer out in the definition; these were fixed by single-concept fronts or by definitions that describe the members without naming them. The second pattern was duplication: the outline-mapping items (ids 9xxx) restated earlier cards and questions, and 21 true/false items restated a multiple-choice question, so cards, questions and compare pairs were retargeted to new facts. Possessive apostrophes had been stripped everywhere ("the user browser", "someone else data"), which is fixed in roughly 60 items. A group of topic-list cards (for example f22, f30, f9003, f9026, f9071, f9111, f9114, f9170) still name their members in the definition because the front is a list of topics, not a single term; they have no blanking problem and were left.
