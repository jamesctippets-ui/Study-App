# Feature Roadmap

A running backlog of features to incorporate, drawn from the user's own ideas
plus a survey of what established study/cert-prep platforms do well (Anki,
Brainscape, Quizlet, Whizlabs, MeasureUp, ExamTopics, Tutorials Dojo,
Microsoft Learn, Duolingo-style gamified learning). Nothing here is built
yet — this is the list to work through, roughly ordered by impact vs. effort
within each section. Check items off as they land, and add new ones as they
come up.

## 1. Multi-cert learning paths (user's idea — removed)

- [x] ~~A **Path** mode that sequences multiple tracks in a recommended
  order for a stated goal~~ Shipped, then **removed**: the user found
  path-grouping got in the way of just picking a cert directly, and asked
  for a flat list of every track (shown once, with its description) instead
  of any path-based navigation. `data/paths.py`, `PathPanel`, and the
  `PATHS`/`showPaths` wiring are gone; `TrackMenuPanel` in
  `04_shared_ui.jsx` is the replacement track picker (see section 6).

## 2. Content beyond the direct exam scope (user's idea)

- [ ] "On the job" callouts inside lessons — real-world notes that go beyond
  what's tested, specifically the kind of thing that matters at an actual
  hospital IT department (HIPAA-adjacent handling of PHI access, ticketing/
  change-management realities, on-call patterns) without pretending they're
  examinable content.
- [ ] A cross-track glossary/reference so a term explained once (e.g.
  Microsoft Entra ID) is consistently linked wherever it resurfaces in a
  different track's reading.

## 3. Tips and tricks (user's idea)

- [ ] A short "how to take this exam" strategy section per track: time
  management, flagging-for-review habits, process-of-elimination, and the
  specific wording patterns that Microsoft/CompTIA exams use (negative
  questions, "choose two," "best" vs. "most secure" framing).
- [ ] Inline "why this is tested" notes on trickier questions, distinct from
  the existing answer explanation — the meta-level reason an exam likes this
  distinction, not just why the answer is correct.

## 4. Simulations (user's idea)

- [ ] Turn the existing static portal mockups into **step-by-step interactive
  walkthroughs** (click through creating a resource across several fake
  portal screens) instead of one static illustration per lesson.
- [ ] A lightweight CLI/PowerShell **command-practice** mode: type the command
  for a stated task, get validated against expected syntax/flags, for tracks
  where that's core to the job (AZ-104, AZ-802 especially).
- [ ] Longer term: scenario-based "mini case studies" that chain several
  related questions off one larger setup, mirroring how AZ-305's real exam
  works.

## 5. Diagrams (user's idea)

- [ ] Close the existing diagram/portal-mockup gaps in AZ-104's course (2
  lessons still lack a diagram, 4 lack a portal mockup — see README).
- [ ] Add course/diagram content to ITIL and Cloud+, which currently have
  none at all.
- [x] A one-page **cheat sheet** per track — the single highest-praised
  feature from the platforms surveyed (Tutorials Dojo) — a printable/
  shareable visual summary of the exam's must-know facts, not just prose.
  Shipped: schema (`CHEAT_SHEET` in data/&lt;track&gt;.py), the "Sheet" tab under
  Learn (`CheatSheetView` in 04_shared_ui.jsx), print-to-PDF styling
  (`@media print` in templates/index.html.tmpl), and real content for all 15
  tracks. build.py's validator now hard-requires every track to have one,
  matching EXAM_CONFIG's `resources`.

## 6. A more robust UI: menus and separate pages (user's idea)

- [ ] Real client-side routing instead of pure in-memory tab state, so the
  browser back button, refresh, and deep links to a specific track/mode/
  lesson all work as a user would expect from a "real" multi-page app.
- [x] ~~A proper **home/dashboard** page as the default landing screen~~
  Shipped, then reworked: refreshing into a separate dashboard page felt
  clunky for a static site with no real routing, so the app now defaults
  straight into AZ-900 → Learn → Study on every load (no more `view` state
  in `06_app.jsx`). Overall progress, streak, and "continue where you left
  off" moved into the new hamburger menu (below) instead of a full page.
- [x] A side/hamburger **menu** for track navigation (☰, `IconMenu` in
  src/js/00_preamble.js) — opens `TrackMenuPanel` (04_shared_ui.jsx),
  which shows overall average mastery + streak, an optional "continue
  where you left off" shortcut, and a flat list of all 15 tracks (each
  once, with its description and live mastery %) — no path-grouping, no
  separate dropdown. Achievements and Data & Progress stay as their own
  quick-access header buttons alongside the hamburger.

## 7. Spaced repetition & study-science features (from research)

- [x] Real spaced-repetition scheduling for flashcards (a simplified SM-2),
  so a card you get wrong resurfaces sooner and one you know well resurfaces
  later. New persisted `srs` map (per-track, per-card `{interval, ease,
  reps, due}`) in src/js/03_helpers.js's `nextSrsEntry`/`orderBySrs`, applied
  to Cards-mode ordering only — "mastery %" itself is still a lifetime ratio,
  unchanged; this only changes review order, not how mastery is scored.
- [ ] Confidence-based review (rate 1–5 instead of binary correct/incorrect),
  the mechanic Brainscape is built around, as an alternative to the current
  flashcard rating.
- [ ] Per-category trend-over-time (not just a current-snapshot mastery bar),
  and a resurfaced "missed question history" beyond the current one-shot
  missed-question queue.

## 8. Light gamification (from research)

- [x] A daily streak counter (no accounts needed — this is exactly the kind
  of thing that fits the app's local-storage-only, no-login model).
- [x] Milestone badges — 15 achievements (mastery, streaks, quiz/exam/match
  counts, course completion) opened from a 🏆 header button, with a toast
  on unlock. Once earned, an achievement stays shown as earned even if the
  live condition later goes false (e.g. a new track diluting an all-tracks
  mastery check) — see src/js/03_helpers.js's evaluateAchievements().
- No leaderboards or social features — those need accounts/a backend, which
  is a deliberate trade-off this app has made for staying fully static.

## 9. Exam realism (from research)

- [ ] A stricter "final mock" variant of Exam mode: no mid-exam retries, only
  reviewable at the very end, closer to the real proctored experience than
  the current Exam mode already is.
- [ ] An optional harder "stretch" question pool per track for confidence-
  building beyond real exam difficulty (Tutorials Dojo's approach), kept
  clearly labeled as harder-than-real so it doesn't skew mastery stats.

## 10.5. Data portability & review quality (not originally listed — added as they shipped)

- [x] **Progress export/import.** The app has no accounts, so a cleared browser
  or a new device previously meant losing everything. The ⚙ Data & progress
  panel now downloads all progress (results, seenLog, stats) as a JSON file
  and can restore from one, with validation against malformed/unrelated
  files. See `downloadJSON`/`parseImportedProgress` in src/js/03_helpers.js.
- [x] **Explanations on missed-question review.** QuizSummary and ExamResults
  used to show only the missed prompt; both now show the explanation too,
  matching what's already shown live during the quiz/exam itself.
- [x] **Per-category "Learn more" resource links.** Beyond the whole-track
  links on the Exam tab, every category across all 15 tracks now has its own
  1-2 more specific official links (`resources` on each track's
  `CATEGORIES`), shown on Study section pages, a lesson's Vocabulary block,
  and a consolidated block on the cheat sheet. All ~90 URLs were
  WebSearch-verified, not guessed.
- [x] **Real Azure Portal screenshots.** Four genuine screenshots (resource
  group creation, storage account tabs, VM instance details, IAM role
  assignments), sourced from Microsoft's own CC BY 4.0-licensed
  MicrosoftDocs GitHub repos and saved locally under `images/portal/`,
  shown alongside (not replacing) the existing SVG portal mockups in
  AZ-900/AZ-104 lessons, each with a plain-language description of what's
  shown, a source link, and attribution. No real screenshot was added for
  the VNet-creation mockup — no clean, on-topic match was found.
- [x] **Quiz/exam questions built around the real screenshots.** 7 new
  questions (4 in AZ-900, 3 in AZ-104 — `'image': 'resourceGroup'` etc. on
  the question dict) show one of the four real screenshots above the
  question itself and ask about what's actually on screen, in both Quiz
  and Final Exam mode (`REAL_PORTAL_SCREENSHOTS` lookup in
  `QuestionView`/`ExamQuestionView`). The descriptive caption is
  deliberately suppressed in this context (`hideDescription`) since it
  would otherwise spell out the answer.
- [x] **"Quiz this section" — test one category in isolation.** Every Study
  section now ends with a button that starts a quiz using every question
  tagged with that category (not the small curated set the in-reading gate
  checks use) — `startCategoryQuiz` in 06_app.jsx for StudyView's per-category
  pages, and a recomputed `finalQuizIds` in LessonDetail (every question
  whose category matches that lesson's vocabulary) for course tracks. Reuses
  the existing `startLessonQuiz` session-start plumbing rather than adding a
  parallel one.
- [x] **Lesson Vocabulary collapsed by default.** Now that term flyouts
  surface most definitions inline while reading, the full Vocabulary list
  at the bottom of a lesson is a collapsed, expandable block (same
  show/hide pattern as the existing "fundamentals" toggle) instead of
  always being fully expanded.
- [x] **Wireframe icons for menu chrome.** The hamburger, achievements,
  settings, and cheat-sheet print buttons now use small inline-SVG
  line-art icons (`IconMenu`/`IconTrophy`/`IconSettings`/`IconPrinter` in
  src/js/00_preamble.js) instead of emoji. Achievement badge icons and the
  inline streak 🔥 are left as emoji — those are content, not menu chrome.
- [x] **Service worker cache-busting discipline.** A stale cached
  `index.html` on a returning visitor's device made a real content update
  (Cloud+ was actually fine) look like a missing/regressed track. Bumped
  `CACHE_NAME` in `service-worker.js`, and any future commit that changes
  `index.html` needs the same bump so the cache-first fetch handler
  doesn't keep serving an old snapshot indefinitely.

## 10. Future-proofing for a standalone web/iOS/Android app (user's idea — lowest priority, not being worked on)

The user wants the option to eventually turn this into a real multi-platform
product (own web deployment, iOS app, Android app), separate from its current
life as a single generated HTML file synced via the Claude runtime. Nothing
here should be built now — it's a set of architectural decisions to keep in
mind so today's choices don't quietly foreclose that option later:

- [ ] **The Claude-runtime cloud sync is the one non-portable piece.**
  `window.claude.use('db')` (see src/js/06_app.jsx's persistence effect) only
  exists inside a Claude artifact. A standalone app of any kind needs its own
  backend for account-based sync — localStorage-only fallback already works
  today and would keep working unmodified as the offline/no-account tier.
- [ ] **Separate pure logic from rendering.** Achievement evaluation, streak
  math, spaced-repetition scheduling, and scoring (currently in
  src/js/03_helpers.js) are already plain JS functions with no DOM/React
  dependency — that's the reusable "core" a React Native iOS/Android app
  would want to share with the web app, so keep new logic in that same
  dependency-free style rather than reaching into React state directly.
- [ ] **Content as data, not baked-in JSON.** data/*.py currently gets
  inlined into one HTML file at build time. A multi-client future wants that
  content served from a fetchable endpoint (even a static JSON file per
  track behind a CDN) so web/iOS/Android all read one source of truth instead
  of each embedding a copy.
- [ ] **A real package/module boundary.** The filename-concatenation build
  (build.py sorting src/js/*.jsx) is fine for one static page; a shared
  "core" package would need real npm module boundaries (even just ES
  modules) once more than one client consumes it.
- No action item here is worth taking today at the cost of the current
  static-site simplicity — this section exists so a future rewrite reuses
  the content and logic instead of starting over.

## 11. More certification tracks (user's idea)

- [ ] Candidate next tracks, roughly in order of fit with the user's stated
  goal (Microsoft systems engineer, M365 focus, hospital IT background):
  - **AZ-500** (Azure Security Engineer) — natural pairing with AZ-104/AZ-305,
    and security is already a recurring theme (SC-200/300/500 are covered).
  - **AZ-400** (DevOps Engineer Expert) — rounds out the Azure admin/architect
    cluster (AZ-104/305/802) with CI/CD and release-management content.
  - **MS-700** (Managing Microsoft Teams) — squarely M365-admin territory,
    complements AB-650/MD-102 without much overlap.
  - **PL-300** (Power BI Data Analyst) — adjacent to the DP-900/DP-300 data
    cluster, useful if reporting/analytics work comes up.
  - **CompTIA Security+** — pairs with the existing Cloud+ track the same
    way AZ-900 pairs with AZ-104, and is a common next step after Cloud+.
  - A **second healthcare-interoperability track** (e.g. content aligned with
    HL7v2/FHIR implementation specifics, or a vendor-specific analyst
    credential such as Epic/Cerner) as a deeper follow-on to the existing
    EHR Integration track, if that's still the career-relevant direction.
  - Final track selection is the user's call — this list is a starting menu,
    not a commitment. Whichever is picked follows the same production
    pattern as the existing 15: `data/<track>.py` module (categories,
    flashcards, questions, cheat sheet, lessons if it gets full course
    treatment), registered in `build.py`'s `TRACK_MODULES`/`TRACKS`/
    `EXAM_CONFIG`, and passing `validate()`.

## 12. More official screenshots (user's idea)

- [ ] Extend the real-screenshot treatment (4 shipped so far: Resource Group
  creation, Storage Account tabs, VM instance details, IAM role assignments —
  see `images/portal/` and `REAL_PORTAL_SCREENSHOTS`) to more AZ-900/AZ-104
  lessons that currently only have the hand-drawn SVG mockup.
- [ ] Bring the same treatment to other tracks that have a real admin-console
  UI worth showing: DP-300 (Azure SQL/Cosmos DB portal blades), AZ-305
  (Azure landing zone / architecture-center diagrams), SC-300 (Entra ID
  admin center), MD-102 (Intune admin center), SC-200 (Defender/Sentinel
  portal). Same sourcing rule as before: only Microsoft's own CC BY
  4.0-licensed MicrosoftDocs GitHub repos (`raw.githubusercontent.com` is
  reachable even when `learn.microsoft.com` itself isn't) — never a generic
  "free stock photo," since no such thing exists for a specific product UI.
- [ ] More quiz/exam questions built around each new screenshot, matching
  the existing pattern (`'image': '<key>'` on the question dict,
  `hideDescription` so the caption doesn't give away the answer).

## 13. Interactive learning games (user's idea)

- [ ] **Draw-a-line matching.** The current Match game (`MatchGame` —
  tap a term, then tap its definition) becomes a drag-a-line interaction:
  terms in a left column, definitions in a right column, the user drags
  from one to the other and an SVG line tracks the connection live. Needs
  pointer/touch drag handling and a line-overlay layer; keep the existing
  tap-to-select mode available too (as a simpler/more accessible fallback
  for anyone on a small screen or without fine pointer control) rather than
  replacing it outright.
- [ ] **"Choose the more correct answer."** A comparative-judgment mode:
  given a scenario, show two plausible-but-imperfect answers and ask which
  is *better*, with an explanation of what makes the runner-up fall short.
  This targets the "best answer, not just a correct one" reasoning real
  Microsoft/CompTIA exams lean on, which today's single-best-answer
  multiple choice doesn't quite exercise. Needs a new question shape
  (e.g. `{"type": "compare", "scenario": ..., "optionA": ..., "optionB": ...,
  "betterKey": "A", "why": ...}`) and its own view alongside the existing
  `QuestionView`.
- [ ] **Scenario Mad Libs.** A short real-world scenario paragraph with a
  few blanks, each filled from a small set of term choices — reinforces
  vocabulary in context instead of as an isolated flashcard front/back.
  New per-track data (e.g. `MADLIBS`: a list of `{scenario, blanks: [{key,
  options, correct}]}`), scored the same way everything else feeds into
  `results`/mastery.
- [ ] **Step-ordering / sequencing challenges.** Shuffle the steps for a
  stated goal — "stand up a compliant Azure VM," "triage a P1 incident per
  ITIL," "onboard a new user with proper Conditional Access" — and have the
  user arrange them into the right order. This is a strong fit for
  AZ-104/AZ-305/ITIL/AZ-802, where procedure order is genuinely tested, not
  just terminology. New data (e.g. `SEQUENCES`: `{prompt, steps: [...],
  correctOrder}`); start with simple up/down move buttons for the UI (works
  everywhere, no drag-and-drop dependency) and treat true drag-to-reorder
  as a later enhancement, not a blocker.
- [ ] **Stretch, lower priority — build-your-own-scenario.** Instead of only
  solving developer-authored sequences, let the user assemble their own
  scenario from a bank of steps as a self-test/review tool. Since the app
  has no accounts or backend, an authored scenario would need to persist
  through the same localStorage/cloud-sync path as everything else
  (extending the `results`/`stats` shape) — worth scoping in more detail
  once the core step-ordering game above exists and its data model has
  proven out, rather than designing both at once.

---

Not in scope / deliberately not doing: crowd-sourced/disputed answer voting
(ExamTopics' model — a correctness liability, and this app's answers are
already reviewed, not crowd-sourced); official vendor endorsement partnerships
(MeasureUp's model — not applicable to an independent project); accounts,
social features, or leaderboards (this app is intentionally accountless and
fully static, per README's "How progress is saved").
