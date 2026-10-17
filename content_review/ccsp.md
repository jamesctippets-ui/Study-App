# Content review: CCSP (data/ccsp.py)

Reviewed by worker cr-ccsp (a predecessor read the cards, the successor read everything else). Today is October 2026.

## Counts

| Item type | Read | Changed |
|---|---|---|
| Flashcards | 329 (all read by the predecessor; the successor re-checked every flagged card and ran a scripted scan of all 329 for readable terms, near-identical definitions and repeated fronts) | 7 |
| Multiple choice | 214 | 29 |
| Multi-select | 46 | 0 |
| True/false | 97 | 1 |
| Mad libs | 7 | 1 |
| Sequences | 5 | 0 |
| Compare pairs | 10 | 0 |
| Case studies | 3 (scenarios plus their 12 questions) | 0 |
| Lesson readings | 8 (reading, analogy, common traps, scenario, on the job) | 1 |
| Cheat-sheet sections | 9 | 1 |

Flagged under "Needs a human check": 15 cards (compound fronts and f101), 14 bank questions (9 mc, 4 tf, 1 ms) plus 2 case-study questions, 1 sequence, 1 compare pair, 1 mad lib. Most are overlaps left on purpose, not doubts about a key.

357 questions in total, 30 changed, 13 of them near-duplicate rewrites (marked REWRITE). No ids, categories, counts or structure changed; nothing was removed.
`python3 build.py` passes and `python3 tools/audit_content.py ccsp` shows 0 errors (1 warning: f101 term length, left on purpose).

Facts checked on the web: CCSP exam format (adaptive, 100 to 150 items, 3 hours, 700 of 1000) and the six domain weights 17/20/17/16/17/13 on isc2.org (https://www.isc2.org/certifications/ccsp/ccsp-certification-exam-outline) match the cheat sheet and the file header; OWASP Top 10:2025 order (broken access control first, supply chain failures and mishandling of exceptional conditions new) matches tf9016; PCI DSS 4.0.1 is still the current version (tf9034); FIPS 140-2 modules move to the Historical list on 21 or 22 September 2026 (sources differ by a day), consistent with q9010, tf9003 and lesson 1.

## Changed

### Flashcards
- f23 | said post-quantum algorithms "are being standardized"; NIST finalized FIPS 203, 204 and 205 in August 2024 | now "NIST has standardized post-quantum algorithms (ML-KEM, ML-DSA and SLH-DSA in FIPS 203, 204 and 205)" (https://csrc.nist.gov/projects/post-quantum-cryptography)
- f97 | "PASTA and attack trees" duplicated f9069 (PASTA) and mixed two methods | front is now "Attack trees" with a definition of the technique only; PASTA stays on f9069
- f171 | "Cyber insurance and risk transfer" duplicated f9157 (Cyber risk insurance) | now the concept card "Risk transfer" (insurance or contract terms move the financial consequence; accountability and reputation stay)
- f9011 | blanked prompt still read "Cost-benefit analysis compares..." (half the answer visible) | definition reworded so the term is not spelled out; ROI is still blanked
- f94 | listed the same phases as f9065 so the two definitions were interchangeable | f94 now names the security activity in each phase (threat modeling, secure coding and review, testing, patching and monitoring); f9065 keeps the plain phase list and requirement sources
- f164 | treatment list omitted "share" although the outline (and f9148, tf9033) lists avoid, mitigate, transfer, share, accept | added "sharing"
- f9148 | said transfer moves the financial impact "entirely", contradicting f9157 and f171 (insurance moves part) | "transfer shifts the financial impact to another party, for example through insurance or an indemnity clause"

### Questions: wording, key, giveaways
- q3 | correct option was the only one without a "because" clause (odd one out) | "Community cloud, because the participants have the same regulatory needs"
- q9 | correct option 103 characters against 52 to 68 | the three distractors lengthened to match
- q10 | stem "Why is the roadmap for post-quantum cryptography a concern today" was garbled | "Why should an organization start planning its move to post-quantum cryptography today for data that must remain confidential for twenty years?"
- q14 | distractor "Elasticity" is not an ISO/IEC 17789 cross-cutting aspect, so "separate aspects" in the explanation was loose | replaced by "Availability" (a real aspect) and corrected the explanation
- tf5 | statement was garbled ("the cloud reference architecture's impact of related technologies") | reworded to what the outline expects (containers, serverless, edge, AI affect architecture and security); answer still True
- q36 | correct option twice as long as the distractors | distractors lengthened
- q44 | correct option read "after verifying device" | "after verifying user and device"
- q53 | correct option 79 characters against 30 to 41 | distractors lengthened
- q81 | correct option 47 characters against 19 to 24 | distractors lengthened
- q88 | correct option 119 characters against 47 to 70, and two implausible distractors | three plausible misconceptions of similar length; explanation extended (waiting for provider confirmation delays containment)
- q96 | stem called the customer "a processor of US health data" and then referred to a "covered entity" never introduced | stem rewritten around a HIPAA covered entity; explanation says a cloud provider handling PHI is a business associate
- q97 | three absurd distractors (console colour scheme, website redesign, headcount) | plausible but irrelevant provider facts (uptime percentage, number of regions, ISO/IEC 27001 certificate); explanation adjusted
- q98 | "How does this risk treatment BEST classify?" | "How is this risk treatment BEST classified?"
- q9037 | stem spelled out "large language model applications", which the correct option repeated | stem reworded without the phrase
- q9045, q9046, q9049 | correct option much longer than the distractors; q9049 option said "Weak coupling" while the explanation said "loose coupling" | distractors lengthened; "Loose coupling" now matches the explanation

### Questions: near-duplicates rewritten so they test something different (same ids, topic tags and categories)
- q9005 REWRITE | same scenario and key as q16 (cryptographic erasure of a decommissioned volume) | now asks which evidence best shows to an auditor that cryptographic erasure worked (key destruction records, no backup or escrow copy)
- q9017 REWRITE | same idea and key as q18 (rights management after sharing) | now classification labels that automatically apply rights management protection
- q9074 REWRITE | same scenario and key as q9031 (second vendor, split consequences, risk sharing) | now risk avoidance (cancelling a feature that cannot meet residency law)
- q9086 REWRITE | same idea as q9020 (who, when, where log attributes) | now management-plane logs versus object-level data event logging
- q9087 REWRITE | same scenario and key as q9022 (fine-tuning on personal data, minimize and test for memorization) | now retrieval-time permission filtering for an assistant over a vector index
- q9090 REWRITE | mirror image of q9025 and tf9012 (two carriers, one conduit) | now standby power: which component carries the load before generators take over (UPS)
- q9092 REWRITE | same idea as q9032 (recovery service level) | now RPO against backup frequency (six-hour snapshots, fifteen-minute tolerance)
- q9095 REWRITE | identical to q63 (invoice number changed, broken object level authorization) | now broken object property level authorization (mass assignment, OWASP API3:2023)
- q9108 REWRITE | third variant of q103 and q9064 (foreign demand, customer-held keys) | now the contract term that helps most (notice of government requests where lawful, challenge of overbroad ones)
- q9064 REWRITE | second variant of q103 (customer-held keys against a foreign order) | now which US law can compel a US provider to produce data stored abroad (CLOUD Act)
- q86 REWRITE | same drift-after-manual-fixes idea as q46 and q9056 | now how to handle a direct production fix outside change control (record as emergency change, review afterwards, fold into baseline)
- q9044 REWRITE | same control as q64 (signed artifacts and provenance) | now image tag overwriting: pin by digest and enable tag immutability
- q9093 REWRITE | same centralized, correlated log answer as q9035 and q82 | now events appearing in impossible order: synchronize clocks and log in UTC

### Other item types
- ml-ccsp-4 | "can be down for at most five minutes" also fits the maximum tolerable downtime option offered for the same blank | reworded to "commits to restoring service within five minutes of an outage", which only fits RTO
- lesson legal-privacy-risk-audit (reading, risk management paragraph) | listed four treatments while the resilience lesson and the outline list five | added "sharing"
- cheat sheet, "Legal, privacy, audit and vendor management" | "Risk treatments: mitigate, transfer, avoid, accept" | added "share"

## Needs a human check
- f8, f10, f13, f14, f31, f32, f33, f43, f57, f62, f72, f90, f9115, f9154 and other compound fronts ("X versus Y", "X and Y") | the definition has to name both terms, and the blanking rule in src/js/03_helpers.js only hides the whole front phrase, so the answer is readable in the prompt | left; fixing it would mean splitting the cards or changing the blanking rule (outside this track)
- f101 | front is 94 characters (IAST and RASP in one card; audit warning) | left because splitting would add a card
- q9031 | "Contracting a second provider to carry part of the workload" is offered as the textbook example of risk sharing; it can equally be read as diversification (mitigation) | left; the distractors are clearly wrong so the key is defensible, but a pooled-insurance or joint-venture example would be cleaner
- q64, tf9020, msq9011, cs-ccsp-harbor-fintech-launch-q4 | still several items on signed artifacts and provenance (q9044 was rewritten) | left as reinforcement of a heavily tested topic
- q82, q9035, cs-ccsp-nimbus-retail-incident-q2 | three items whose answer is central, correlated logs (q9093 was rewritten) | left
- q46, q9056, tf45 | configuration drift is still covered three times (q86 was rewritten) | left
- q18, cmp-ccsp-2, ml-ccsp-2 | the same law-firm rights management scenario appears in a question, a compare pair and a mad lib | left because they are different item types
- q103 | remains the customer-held keys question for a foreign government demand | left (q9064 and q9108 were moved to other angles)
- seq-ccsp-5 | whether "approve residual risk" comes before or after "negotiate contract terms" is debatable in practice; the explanation states residual risk is accepted before go-live | left
- q9010, tf9003, lesson 1 | FIPS 140-2 Historical date: sources give 21 September or 22 September 2026; the content says "September 21, 2026" or "September 2026" | left; check the NIST CMVP page if the exact day matters
- tf9034 | "PCI DSS 4.0.1 is the current version" is true today (no successor found; one source reports a 2026 request for comments) | recheck before release

Nothing outside data/ccsp.py and this log needs to change. `python3 build.py` regenerated index.html, service-worker.js and dist/data (build outputs, not hand-edited); they need a final rebuild after all tracks are merged.

## Patterns
This track was in good shape factually: one outdated fact (post-quantum standardization), two contradictions between cards (risk transfer and sharing, "entirely" versus "part") and no wrong keys found in 357 questions. The main weakness is overlap between the original question set and the later 9xxx supplement: 13 pairs or triples had the same scenario and key, which I rewrote to test a new angle (power, tag immutability, time sync, emergency change, CLOUD Act and so on). The second weakness is answer-length giveaways (about 15 items, now balanced) and a few absurd distractors and garbled stems, all fixed with the smallest wording change. Lessons, cheat sheet, mad libs, sequences, compare pairs and case studies were clean apart from the RTO/MTD ambiguity in ml-ccsp-4 and the missing "share" treatment.
