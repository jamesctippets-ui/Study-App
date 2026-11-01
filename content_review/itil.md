# Content review: ITIL Foundation (Version 5)

Reviewed on 2026-11-01.

Sources:
- the published ITIL (Version 5) Foundation syllabus summary (February 2026), which covers:
  - category weights: terms 30%, value system 40%, four dimensions 10%, lifecycle 10%, value streams 5%, AI 2.5%, other frameworks 2.5%;
  - the exam format: 40 questions, 60 minutes, 26 of 40 to pass;
- third-party change summaries comparing ITIL 4 with Version 5. PeopleCert's own syllabus PDF was not reachable.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 100 | 3 |
| Questions | 123 | 0 |
| Mad libs | 6 | 1 |
| Sequences | 3 | 0 |
| Compare pairs | 12 | 0 |
| Case studies | 1 (4 questions) | 1 stem |
| Lessons | 7 | 3 |
| Cheat sheet | 7 sections | 0 |

The category marks match the syllabus: the AI and frameworks categories are 3 and 2 marks, which round the 2.5% each.
- `python3 build.py` passes.
- `python3 tools/audit_content.py itil` shows 0 errors and 0 warnings, with 2 info notes about cards whose term is phrased as a question.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 27% of questions, about what you'd expect by chance with four options.

## Changed

- f12 and the value-system lesson | Called it the "Service Value System" and the "service value chain", which are ITIL 4 names | Version 5 says "ITIL Value System" and "value chain". The lesson notes the old name once.
- product-service-lifecycle lesson | Said "The service value chain component" | Now "The value chain component"
- f31 and the lifecycle lesson | Transition was described as "change management" | Now "change enablement, release, and deployment", using ITIL's own term
- f37 and the frameworks lesson | Said CI/CD sits in Build, Deliver and Support, which contradicted f99 and q39 (Build, Transition, Deliver) | All three now say Build, Transition and Deliver
- ml-itil-6 | Its second blank called "auto-filing every email into the correct queue" Curation. q50 calls assigning work to the right team Coordination, so the two contradicted each other | The scenario now filters, de-duplicates and surfaces urgent emails, which is clearly Curation
- Case study q4 | "(Select all that apply.)" | "(Choose two.)"

## Checked and left alone

- The 7 guiding principles, the 5 Value System components, the four dimensions plus PESTLE, and the 8 lifecycle activities in order.
- The 34 practices are kept from ITIL 4, and the technical management group is removed.
- The 6C AI Capability Model: Creation, Curation, Clarification, Cognition, Communication, Coordination.
- Incident, problem and known error; standard, normal and emergency changes; service request versus incident.
- The Continual Improvement Model steps.
- The cheat sheet's ITIL 4 value chain list, given as history.

## Needs a human check

- f43, q60's explanation and the value-system lesson all say the 34 practices split into 12 general management and 22 product and service management. The public summaries I found confirm the two groups but give no counts. Check this against the official Version 5 Foundation book.
- "Digital product vendor" appears in f6, q6, q57, tf22, ml-itil-4 and cmp-itil-3 as a role that supplies a product without a service relationship. I could not confirm that Version 5 uses this exact term.
- The Operate and Deliver definitions are applied consistently across the track: Deliver is the consumer receiving the agreed outcome. They have not been checked word for word against the official text.
