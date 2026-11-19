# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cert Study Hub: an offline-installable PWA for certification prep (27 tracks: Azure/Microsoft, ISC2, CCNA, Cloud+, ITIL, the Claude certs, ...). There is no backend, no accounts and no leaderboards, and that is a standing constraint (ROADMAP.md section 10). The phone layout is the primary target; the desktop layout is CSS-only on top of it.

## Commands

No installs are needed: `build.py` is stdlib-only Python, and the checks use plain `node`.

```
python3 build.py                    # validate data, regenerate index.html, service-worker.js, dist/data/*.json, then run the node checks
python3 tools/audit_content.py      # content audit over all tracks; fails on errors only
python3 tools/audit_content.py sc900  # one track; also prints every finding
for f in tools/check_*.js; do node "$f"; done   # the node suites (build.py already runs them when node is on PATH)
node tools/check_cards.js           # a single suite
python3 build.py --check-acronyms   # list acronym-like tokens used 2+ times that are missing from data/acronyms.py
python3 -m http.server 8000         # serve the repo to try the app (file:// works but PWA/service worker need a real origin)
```

CI (`.github/workflows/ci.yml`) runs build, audit, the node checks, then fails if `git diff` is non-empty. So **always run `python3 build.py` and commit the regenerated files**.

## Architecture

**`index.html`, `service-worker.js` and `dist/data/*.json` are generated and committed. Never edit them by hand.** `build.py` assembles them from:

- `data/*.py`: content, one module per track (`CATEGORIES`, `FLASHCARDS`, `QUESTIONS`, and optionally `LESSONS`, `CHEAT_SHEET`, `MADLIBS`, `SEQUENCES`, `CASE_STUDIES`, `COMPARE`, `CLI_CHALLENGES`). Big tracks are split into parts (`ccna_a.py` + `ccna_b.py`, `ccao_a/_b1/_g1/...`) that the track module concatenates. `data/tracks.py` holds `TRACKS` and `EXAM_CONFIG` (exam length, pass mark, experience requirements, resources). Also in `data/`: `acronyms.py` (flyout dictionary; coverage is enforced), `bridges*.py` (cross-cert links), `playground*.py` (IT Playground scenarios; `playground_<tool>.py` files are auto-discovered).
- `src/js/*`: the React/JSX app, concatenated in **filename sort order** (hence the numeric prefixes: `00_` preamble, `03*` pure logic, `04*` UI, `06_app.jsx` the single top-level `CertStudyApp`). JSX is transpiled by Babel Standalone in the browser at load; there is no JS build step. Pure-logic files (`03d_weak_path.js`, `03e_flyout_place.js`, `03f_share_bank.js`, `03g_eink_sync.js`, `03b/03c` playground engines) are exercised by `tools/check_*.js` against the real content.
- `templates/index.html.tmpl`: the HTML shell, all CSS (theme variables, the `@media (min-width:1024px)` desktop layout), and the `__DATA_SCRIPT__` / `__APP_SCRIPT__` placeholders. Content goes into a plain script (`DATA`, `TRACKS`, `EXAM_CONFIG`, `BRIDGES`, `PLAYGROUND`, `ACRONYMS`); only app code goes through Babel.

`build.py`'s `validate()` is the real schema: it rejects unknown categories, duplicate ids, dangling `vocabIds`/`quizIds`, malformed answer keys, missing explanations, acronym coverage gaps, and **text that refers to an option by position** ("option B", "all of the above"), because option order is shuffled at render time. Name options by content. A bad edit fails the build with a specific message, so read the error.

`build.py` also derives `service-worker.js`'s `CACHE_NAME` from a hash of the output and regenerates its precache list of `images/` and `fonts/` between the `BEGIN/END GENERATED ASSETS` markers. Don't touch either by hand.

**Adding a track** needs no JS changes: create `data/<key>.py`, add it to `TRACKS` and `EXAM_CONFIG` in `data/tracks.py`, and import and register it in `build.py` (the import line and `TRACK_MODULES`). `UNFINISHED_TRACKS` in `build.py` keeps a placeholder track registered and validated but out of the shipped bundle. Write a `content_review/<key>.md` report (Counts / Changed / Checked and left alone / Needs a human check), as every existing track has.

**Desktop layout** is pure CSS keyed off class hooks in the JSX (`app-root`, `app-col`, `app-tabbar`, `app-sheet`, `app-pinbar`, `desktop-only`). The bottom tab bar *is* the sidebar on desktop. New bottom sheets need `data-overlay` and the `app-sheet-backdrop`/`app-sheet` classes; keyboard shortcuts go through `useKeyShortcuts`. Theming uses CSS variables (`COLOR.*` are `var(--color-*)` strings), so use `COLOR.onAccent` for text on accent backgrounds and don't hardcode colors. The theme preference stays out of the synced progress payload on purpose.

**Progress** is saved through `window.claude.use('db')` when hosted as a Claude artifact, else `localStorage`; a failed write shows a banner. Progress export/import is JSON via Data & Progress.

**E-ink tooling (separate from the app):** `tools/eink_export.py` writes per-track EPUBs (flashcards, questions, cheat sheet) and an optional browser preview; `tools/eink_pack.py` writes a JSONL "study pack" for a future e-reader firmware study mode; the app's "Import e-reader progress" (`03g_eink_sync.js`) merges that firmware's log. Both read `dist/data`, so run `python3 build.py` first; they need node for the blanked flashcard prompts. The format contract is `EINK_STUDY_PACK.md`; the firmware half is not built. Output goes to `eink-out/` (gitignored).

## Docs and where to put things

- `ROADMAP.md`: Now / Next / Later / Ideas at the top. Add new ideas as a one-line entry under Ideas. Below it is the numbered feature log, which code comments cite as "ROADMAP.md section N", so don't renumber or move those sections.
- `README.md` has the long feature description and the source layout; update its file listing when you add a source file.
- `content_review/<track>.md`: per-track review reports. Their "Needs a human check" sections list facts that couldn't be verified from a primary source (exam fees, durations, preview status); don't present those as confirmed.

## Git workflow

- There is no `main`. The long-lived branch is `claude/certification-study-app-n6bst5`: PRs target it, and CI also runs on pushes to it.
- Each thread works on its own `claude/project-thread-*` branch. Force-push is blocked; when the base moves, merge it into your branch rather than rebasing. If `index.html` or `service-worker.js` conflicts, take either side and rerun `python3 build.py`.
- Check open and merged PRs before starting UI work, since parallel threads have built the same thing twice.
