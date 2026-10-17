# Content review: CGRC (ISC2 Certified in Governance, Risk and Compliance)

Reviewer: cr-cgrc-itil. Source: `data/cgrc.py`. Reviewed against the ISC2 CGRC exam outline in force (effective June 15, 2024; seven domains, 125 items, 3 hours, 700/1000, confirmed on isc2.org) and NIST SP 800-37 Rev. 2, SP 800-53 Rev. 5 (catalog 5.2.0), SP 800-53A/53B, SP 800-137.

## Counts

| Type | Read | Changed | Flagged |
|---|---|---|---|
| Flashcards | 248 | 8 | 3 (see below) |
| Questions (173 mc, 43 ms, 71 tf) | 287 | 1 | 0 |
| Mad libs | 9 | 0 | 0 |
| Sequences | 8 | 1 | 0 |
| Compare pairs | 12 | 0 | 0 |
| Case studies (2 cases, 8 questions) | 2 | 0 | 0 |
| Lessons | 8 | 0 | 0 |
| Cheat sheet sections | 10 | 0 | 0 |

Every item of every type was read in full (ids f1-f131 and f9001-f9620, q1-q78, msq/tf, q9001-q9615 and their msq/tf, all mad libs, sequences, compare pairs, case studies, lessons and cheat sheet). Build passes; `tools/audit_content.py cgrc` shows 0 errors, 0 warnings.

## Changed

- f3 | "defining the authorization boundary candidates" is not RMF wording | "determining the authorization boundary of the system" (SP 800-37 Rev. 2, Prepare task P-11).
- f16 | the definition spelled out both acronyms in brackets "(ISSO)" and "(ISSM)", so the answer was visible in the definition-first prompt | removed the bracketed acronyms.
- f74 | the PT family was described as covering "data subject access and redress, and limits on use"; those are not PT controls | now lists the real PT-2 to PT-8 topics: authority to process PII, processing purposes, consent, privacy notices, system of records notices, specific categories of PII, computer matching requirements. Source: NIST OSCAL SP 800-53 Rev. 5 catalog (PT-1 to PT-8 titles), https://github.com/usnistgov/oscal-content
- f99 | "The assessment of controls ... can rely on" is ungrammatical | "An assessment of provider-supplied controls can rely on ...".
- f101 | called Risk analysis and determination a "step"; it is a task (R-2) inside the Authorize step | "The Authorize task in which ...".
- f114 | definition showed "(SORN)", which is half the term | removed the bracketed acronym.
- f120 | definition showed "(CCB)", which is part of the term | removed the bracketed acronym.
- f9003 | the definition named "ISO/IEC 27001" and "ISO/IEC 27002", so the term sat in the prompt and the card duplicated f21 | reworded to describe the two 2022 editions without naming them (same facts: four themes, 93 controls, replaced 114 in 14 domains).
- f9004 | said ISO/IEC 27701 "is designed to sit alongside an ISMS"; the 2025 edition (published Oct 2025) is a standalone, separately certifiable management system standard | now says the 2025 edition can be certified on its own and can also be integrated with an ISMS. Sources: https://knowledge.bsigroup.com/articles/reimagining-data-privacy-compliance-with-bs-en-iso-iec-27701-2025 and https://amtivo.com/uk/standards/iso-27701/insights/what-you-need-to-know-about-the-updated-privacy-standard/
- q9005 | stem was arithmetically inconsistent: a score of 92 of 110 means 18 points lost, yet "the three unmet requirements are each worth one point" | "The unmet requirements are each worth one point" (92 of 110 is at least 88, so conditional status within 180 days is still the key; 32 CFR 170.21).
- seq-cgrc-2 | last step "...and register the system" contradicts f35 and tf11 (system registration is a Prepare task, P-18) | step is now "Review and approve the documented categorization".

## Needs a human check

- f9017, f112, lesson `frameworks-regulations`, tf9004 | FedRAMP 20x details: "classes A, B and C are available; D is planned" and "stop accepting new Rev5 certifications on June 11, 2027". Only vendor and consultancy write-ups confirm these (Class A opened Aug 3, 2026; B and C planned Aug 31, 2026; Class D timing differs between sources). Left unchanged; check fedramp.gov before the next release because this is moving quickly.
- f39 | "Release 5.2.0 (August 2025) added SA-15(13), SA-24 and SI-02(07)": the three controls are confirmed in the Rev. 5 catalog 5.2.0 (SA-15(13) Logging Syntax, SA-24 Design For Cyber Resiliency, SI-2(7) Root Cause Analysis) but the OSCAL file's last-modified stamp is May 2026, so the release date could not be tied to August 2025. Left unchanged.
- f9004 | one certification body (DNV) still describes ISO/IEC 27701:2025 as extending ISO/IEC 27001, while BSI and Amtivo call it standalone. The new wording ("can be certified on its own and can also be integrated") is consistent with both, but verify against the ISO text if the card is ever tightened.

## Patterns

CGRC is in good shape. The facts (RMF tasks, FIPS 199/200, SP 800-53/53A/53B, FedRAMP, CMMC 32 CFR 170 scoring, GDPR and HIPAA timelines, PCI DSS 4.0.1 cadences, SP 800-88 Rev. 2, SP 800-61 Rev. 3) checked out against NIST and ISC2 sources, and the older cards already carry current-revision updates. The defects found were small: one wrong family description (PT), one arithmetic slip in a stem, one sequence step that contradicted a card, and a handful of definitions that left the answer (an acronym or standard number) readable in the definition-first prompt. Question quality is high: no letter references, no length giveaways (correct option is longest in about 13 percent of multiple-choice items and never by a wide margin), keys match explanations. Many of the later "outline" cards (ids f9xxx) have descriptive process names rather than crisp terms, so they are weaker as definition-first prompts than the older cards, and a few overlap (f47, f9203 and f9308 on compensating or mitigating controls; f94, f101 and f9505 on residual risk); each has a distinct emphasis, so they were left as they are. The task brief says the outline has six domains; the track (and ISC2) uses seven.
