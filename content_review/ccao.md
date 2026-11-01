# Content review: CCAO-F (Claude Certified Associate - Foundations)

Reviewed on 2026-11-01 against the CCAO-F exam format as published by third-party prep sites (60 items, 120 minutes, scaled 100-1,000, pass at 720) and against the internal consistency of the track.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 234 | 0 |
| Questions | 271 | 0 |
| Mad libs | 12 | 0 |
| Sequences | 9 | 0 |
| Compare pairs | 14 | 0 |
| Case studies | 3 (10 questions) | 0 |
| Lessons | 10 | 0 |
| Cheat sheet | 12 sections | 0 |

- `python3 build.py` passes.
- `python3 tools/audit_content.py ccao` shows 0 errors, 0 warnings and 0 info notes, the same as before the review.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 37% of the 163 single-answer questions, so length does not give the answer away.

## Changed

Nothing. No factual, wording or consistency problems turned up. There are no "Select all that apply" stems, every multiple-select stem states how many to choose, and the cheat sheet already has no 70% or partial-credit wording.

## Checked and left alone

- Exam logistics in the cheat sheet (60 items, 120 minutes, 720 to pass, scaled 100-1,000) match the figures on the prep sites I found.
- Model tiers, effort, thinking, research mode, memory, Projects, connectors and skills are described the same way in the cards, questions, lessons and cheat sheet.
- Wrong options in the questions are plausible but clearly wrong for the stated reason, and no two options in a question are equivalent.

## Needs a human check

- Product behavior (for example the 100-page PDF visual limit, the five-year retention wording, per-chat memory switch, Research availability by plan) comes from Anthropic Help Center pages that change often. I could not open the live pages, so recheck them against the current Help Center before the exam.
- The fee ($99), 12-month credential validity and retake waits come from third-party sites, not Anthropic. Confirm on Anthropic's official certification page.
- Card f1099 (AI-generated content marking, including invisible text watermarks) states a capability I could not confirm from a primary source.
