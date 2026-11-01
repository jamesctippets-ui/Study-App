# Content review: CompTIA Cloud+ (CV0-004)

Reviewed on 2026-11-01 against the CV0-004 exam objectives (90 questions, 90 minutes, 750 on a 100-900 scale, six domain weights) and the CompTIA troubleshooting methodology.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 125 | 1 |
| Questions | 116 | 0 |
| Mad libs | 7 | 0 |
| Sequences | 0 | 0 |
| Compare pairs | 11 | 0 |
| Case studies | 2 (8 questions) | 2 stems |
| Lessons | 6 | 0 |
| Cheat sheet | 9 sections | 0 |

- `python3 build.py` passes.
- `python3 tools/audit_content.py cloudplus` shows 0 errors, 0 warnings and 0 info notes, down from 1 warning.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 62% of the 73 multiple-choice questions.

## Changed

- f29 | Numbered steps "1) ... 6)" left the parentheses unbalanced (audit warning) | Rewritten as "Step 1: ... Step 6: ..."; the content is unchanged
- Case study cs-cloudplus-solstice-outdoor q3 | "(Select all that apply.)" with two correct answers | "(Choose two.)"
- Case study cs-cloudplus-harborview-freight q4 | "(Select all that apply.)" with two correct answers | "(Choose two.)"

## Checked and left alone

- Exam format, passing score and domain weights in the cheat sheet match the CV0-004 objectives, and the cheat sheet already uses the 75% buffer and unanswered-question wording.
- Troubleshooting steps are in the CompTIA order in the card, lesson, cheat sheet and questions.
- N+1/N+2, RTO/RPO, backup types, blue-green/canary/rolling, showback/chargeback and quorum/fencing are used consistently across items.

## Needs a human check

- I checked Cloud+ against my knowledge of the CV0-004 objectives, not a live copy of the CompTIA PDF, so confirm the domain percentages against the current objectives document.
