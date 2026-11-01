# Content review: EHR Integration (Healthcare Interoperability Concepts)

Reviewed on 2026-11-01. This is a self-study module, not a certification, so there is no official outline to check category weights against. Facts were checked against general HL7 v2, FHIR R4, SMART on FHIR and HIPAA knowledge.
The October review stopped partway through this track. This pass read everything again from the start.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 124 | 0 |
| Questions | 116 | 21 stems |
| Mad libs | 6 | 0 |
| Sequences | 0 | 0 |
| Compare pairs | 10 | 0 |
| Case studies | 2 (8 questions) | 2 stems |
| Lessons | 6 | 0 |
| Cheat sheet | 8 sections | 0 |

`python3 build.py` passes, and all `tools/check_*.js` pass. `python3 tools/audit_content.py ehrintegration` shows 0 errors and 2 warnings, down from 23. The 2 remaining warnings are false positives: q12 is about a placeholder value, so the word "placeholder" belongs there.

## Changed

- msq1 to msq20 and tf19 (multi-select questions) | The stems said "(Select all that apply)", so the learner couldn't tell how many answers to pick (21 audit warnings) | They now say "(Choose two.)" for msq11 and msq14 and "(Choose three.)" for the rest, matching how many answers are correct
- Case studies maple-ridge q4 and bright-path q4 | Same "(Select all that apply.)" wording | Now "(Choose two.)" and "(Choose three.)"

## Checked and left alone

- HL7 v2:
  - delimiters declared in MSH;
  - MLLP framing, and BHS/BTS and FHS/FTS batch files;
  - AA/AE/AR meanings, and the MSA control-ID echo;
  - enhanced-mode commit and application acks;
  - A01/A02/A03/A08 triggers, and the VXU direction;
  - placer and filler numbers;
  - TXA completion status, and EVN-6 event time versus MSH time;
  - PV1-3 assigned location.
- FHIR:
  - transaction and batch bundles, and urn:uuid references;
  - $everything versus Bulk $export, and backend-services auth;
  - presentedForm versus result;
  - 422 for profile violations;
  - Provenance versus AuditEvent;
  - Consent does not enforce itself;
  - LOINC, RxNorm, NDC and UCUM.
- Governance:
  - TEFCA versus HIE;
  - ABAC versus RBAC, and break-the-glass review;
  - referential matching, overlays and fragmented histories;
  - BAA and minimum necessary;
  - Safe Harbor and Expert Determination;
  - the 42 CFR Part 2 2024 rule (compliance date 16 February 2026).
- The cheat sheet's 44-question, 60-minute, 80% figures match `data/tracks.py`.

## Needs a human check

- f28 and the governance lesson say the 2025 HIPAA Security Rule proposal (which would make at-rest encryption mandatory) "had not been finalized as of mid-2026". I could not confirm whether it has been finalized since. Recheck before relying on it.
- In 51% of the 73 single-answer questions, the correct option is the longest one. Answer length is a giveaway here. Lengthening distractors in a later pass would help.
- No sequence games exist for this track. A message-flow sequence (order, ORM, filler, ORU, ACK) would fit well if you want one.
