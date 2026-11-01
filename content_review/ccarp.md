# Content review: CCAR-P (Claude Certified Architect - Professional)

Reviewed on 2026-11-01 against the Claude Platform docs (models overview, pricing, prompt caching, batches) as used elsewhere in this app, and against the internal consistency of the track.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 242 | 0 |
| Questions | 270 | 0 |
| Mad libs | 11 | 0 |
| Sequences | 9 | 0 |
| Compare pairs | 14 | 0 |
| Case studies | 3 | 0 |
| Lessons | 11 | 0 |
| Cheat sheet | 12 sections | 0 |

- `python3 build.py` passes.
- `python3 tools/audit_content.py ccarp` shows 0 errors, 0 warnings and 0 info notes.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 35% of the 162 single-answer questions.

## Changed

Nothing. No error was found.

## Checked and left alone

- Caching facts agree across cards, mad libs and the cheat sheet: prefix order tools, system, messages; 1.25x for a five-minute write, 2x for one hour, reads a small fraction of base input.
- Batch facts agree: 50% discount, 24-hour expiry, results matched by custom id, results downloadable for 29 days.
- Worked arithmetic in q1120 is correct.
- Blueprint weights in the cheat sheet (19, 17, 16, 14, 14, 13, 7) add to 100%.
- MCP control split (tools model-controlled, resources application-controlled, prompts user-controlled) is consistent everywhere.

## Needs a human check

- Exam logistics (63 items, 120 minutes, 720 to pass, $175, 12-month validity) come from prep sites, not a live Anthropic page. Confirm before the exam.
- Managed Agents limits (25 child threads, beta status, no ZDR or HIPAA coverage) and Claude Code managed-settings behavior change often. Recheck against current docs.
