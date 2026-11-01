# Content review: CCAR-F (Claude Certified Architect - Foundations)

Reviewed on 2026-11-01 against the Claude Platform docs (tool_choice, structured outputs, batches, sessions, hooks) as used elsewhere in this app, and against the internal consistency of the track.

## Counts

| Type | Read | Changed |
| --- | --- | --- |
| Flashcards | 289 | 1 |
| Questions | 344 | 1 |
| Mad libs | 14 | 0 |
| Sequences | 14 | 0 |
| Compare pairs | 18 | 0 |
| Case studies | 6 | 0 |
| Lessons | 13 | 0 |
| Cheat sheet | 13 sections | 0 |

- `python3 build.py` passes.
- `python3 tools/audit_content.py ccarf` shows 0 errors, 0 warnings and 0 info notes, down from 2 warnings.
- All `tools/check_*.js` pass.
- The correct option is the longest one in 30% of the 208 single-answer questions.

## Changed

- f114 | Definition began "Placeholder syntax", which tripped the audit's unfinished-text check (warning) | "Variable syntax"; the meaning is unchanged
- q1015 | Explanation called `$ARGUMENTS` "the placeholder" (same audit warning) | Names `$ARGUMENTS` directly

## Checked and left alone

- The tool_choice questions (q77, q78, q79, msq19, tf31 to tf34) already carry the caveat that forced and "any" tool choice are rejected on the newest models, and the cheat sheet and the CCDV-F track say the same.
- Worked scheduling arithmetic in q1231 (a batch every 9 hours gives 9 + 24 = 33 hours worst case) is correct.
- Hook, session, skill, rule and `.mcp.json` scope statements agree between cards, questions, lessons and the cheat sheet.
- Blueprint weights in the cheat sheet add to 100% (27, 18, 20, 20, 15), and no stem uses "Select all that apply".

## Needs a human check

- Exam logistics (60 items from 4 of 6 scenarios, 120 minutes, 720 to pass) come from the exam guide and prep sites, not a live Anthropic page. Confirm before the exam.
- Claude Code behaviors (skill frontmatter fields, path-scoped rules, `--bare`, auto memory) change often. Recheck them against the current Claude Code docs.
