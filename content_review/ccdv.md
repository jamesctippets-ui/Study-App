# Content review: CCDV-F (Claude Certified Developer - Foundations)

Reviewed on 2026-11-01 against the Claude Platform docs (models overview, pricing, prompt caching) and the internal consistency of the track.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 269 | 1 |
| Questions | 292 | 0 |
| Mad libs | 12 | 0 |
| Sequences | 10 | 0 |
| Compare pairs | 14 | 0 |
| Case studies | 3 (9 questions) | 0 |
| Lessons | 10 | 0 |
| Cheat sheet | 12 sections | 0 |

- `python3 build.py` passes.
- `python3 tools/audit_content.py ccdv` shows 0 errors, 0 warnings and 0 info notes, down from 1 warning.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 35% of the 176 single-answer questions.

## Changed

- f1057 | The word "placeholder" in the definition tripped the audit's unfinished-text check | "leaving a short marker where they were"; the meaning is unchanged and it matches the wording in tf1205

## Checked and left alone

- Verified against the current Claude Platform docs: model lineup and tiers, default effort, 1M context, minimum cacheable prompt length of 512 tokens on the current models, cache write multipliers of 1.25x and 2x, 4 breakpoints, output tokens at 5x input, and the higher Haiku 5.5 price above 100,000 tokens versus standard pricing across the window on the other models.
- Worked arithmetic checks out: q1118 ($0.67 against $0.75 per completed task) and q1122 (about one fifth).
- Batch, retry, SDK default, header, payload-limit and timeout facts match the API behavior described in the cards, questions and cheat sheet.
- No "Select all that apply" stems, and the cheat sheet already uses the 720 pass mark and current model names.

## Needs a human check

- Exam logistics (53 items, 120 minutes, $125 fee, 720 to pass, domain weights) come from third-party prep sites, not Anthropic. Confirm on Anthropic's certification page.
- Beta and preview features (context editing, task budget, fast mode, Managed Agents, tool runner) change often. Recheck the cards for these against the docs before the exam.
