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
- [x] A cross-track glossary/reference so a term explained once (e.g.
  Microsoft Entra ID) is consistently linked wherever it resurfaces in a
  different track's reading. Shipped as a "Glossary" panel off the Home
  screen (`GlossaryPanel` in 04_shared_ui.jsx, `buildGlossaryEntries()` in
  03_helpers.js): merges every visible track's flashcard fronts by
  lowercased/trimmed text, so a term defined identically in two tracks
  shows one entry with both tracks' badges, while a term with genuinely
  different phrasing per track stays as separate entries (deliberately —
  silently picking one track's wording over another's would be wrong).
  Searchable, expand/collapse per entry, capped display at 200 matches.
  746 unique entries from 764 flashcards at time of shipping.

## 3. Tips and tricks (user's idea)

- [x] A short "how to take this exam" strategy section per track: time
  management, flagging-for-review habits, process-of-elimination, and the
  specific wording patterns that Microsoft/CompTIA exams use (negative
  questions, "choose two," "best" vs. "most secure" framing). Shipped as a
  new "Exam-day strategy" section, inserted first in every track's
  `CHEAT_SHEET`, with a per-track time-budget line computed from that
  track's real exam length/duration and pass-mark framing from its
  `EXAM_CONFIG`. EHR Integration — not a real proctored exam — gets a
  differently-worded "How to use this module's self-assessment" section
  instead of exam-day framing that wouldn't apply to it.
- [ ] Inline "why this is tested" notes on trickier questions, distinct from
  the existing answer explanation — the meta-level reason an exam likes this
  distinction, not just why the answer is correct.

## 4. Simulations (user's idea)

- [x] Turn the existing static portal mockups into **step-by-step interactive
  walkthroughs** (click through creating a resource across several fake
  portal screens) instead of one static illustration per lesson. Shipped
  as `PORTAL_WALKTHROUGHS` + `PortalWalkthroughPlayer` (02_portal_mockups.jsx):
  a registry keyed by the SAME string a lesson's `portalMockup` field
  already points at, so `LessonDetail` checks it first and renders the
  interactive player instead of the single static `Mockup*` component
  whenever an entry exists — upgrading an existing lesson from static to
  interactive needs zero changes to that lesson's own data, just a new
  registry entry. Every other key without an entry keeps rendering
  exactly as before (verified empirically, not just by inspection — a
  still-static lesson shows no stray "Step X of Y" UI). The flagship
  example converts the `vmSize` mockup (used by both an AZ-900 and an
  AZ-104 lesson, so both upgrade at once) into a real 5-step "Create a
  virtual machine" walkthrough — Basics → Size → Networking → Review +
  create → a completion screen — with a step counter, progress dots, and
  Back/Next controls, reusing the exact same `PortalFrame`/`MockField`
  SVG primitives the static mockups already use. More existing mockup
  keys can be upgraded the same way as course depth continues to expand;
  most still render as their original single static illustration.
- [x] A lightweight CLI/PowerShell **command-practice** mode: type the command
  for a stated task, get validated against expected syntax/flags, for tracks
  where that's core to the job (AZ-104, AZ-802 especially). Shipped as a
  new "Commands" Quiz sub-tab, only shown for tracks that carry a new
  `CLI_CHALLENGES` list (`{prompt, tool, verb, command, requiredFlags,
  explanation}` per data/&lt;track&gt;.py) — AZ-104 (12 real Azure CLI `az`
  commands: resource groups, VMs, storage, networking, RBAC, locks) and
  AZ-802 (12 real PowerShell cmdlets: AD users/groups, Windows features,
  Hyper-V VMs, networking, storage, firewall, event logs) at launch.
  `checkCliAnswer` (03_helpers.js) is deliberately lenient about
  whitespace/casing/flag order/flag values — it checks the right verb and
  every required flag are present (returns `'close'`), separately from a
  byte-exact match against the canonical answer (`'exact'`) — a strict
  string comparison would fail plenty of genuinely-correct answers over
  formatting alone. Deliberately NOT wired into mastery/results/exam-
  readiness: those systems' category weighting is calibrated to
  flashcards+questions counts only, and this is meant to stay a
  lightweight practice add-on, not a third scored item type woven through
  the whole app — its running score is session-local only.
- [ ] Longer term: scenario-based "mini case studies" that chain several
  related questions off one larger setup, mirroring how AZ-305's real exam
  works.

## 5. Diagrams (user's idea)

- [x] Close the existing diagram/portal-mockup gaps in AZ-104's course.
  The portal-mockup/screenshot side was already complete on all 7 lessons;
  the remaining gap was 2 lessons with no diagram at all (Identities &
  Access, Storage Management). Gave each its own new diagram —
  `DiagramGroupLicensing` (security vs. dynamic group → license/access
  applied) and `DiagramStorageAccess` (access key vs. SAS, plus a storage
  firewall) in `01_diagrams.jsx` — rather than reusing AZ-900's generic
  `identity`/`storage` diagrams, since those illustrate different concepts
  (Entra ID/RBAC/Conditional Access; blob/file/queue/table + access tiers)
  than what these two lessons actually teach. AZ-104 now matches AZ-900:
  full diagram + portal-mockup + real-screenshot coverage on all 7 lessons.
- [x] Add course/diagram content to ITIL and Cloud+, which previously had
  none at all. ITIL got 7 lessons covering all 7 categories (terms,
  valueSystem, dimensions, lifecycle, streams/ai/frameworks) plus 3 new
  diagrams (`fourDimensions`, `productServiceLifecycle`,
  `continualImprovementModel`); Cloud+ got 6 lessons covering all 5
  categories (archDesign split across two lessons since it has a clean
  deployment/virtualization vs. scaling/resilience seam) plus 3 new
  diagrams (`deploymentModels`, `scalingApproaches`, `dmzZones`). Both use
  the same `LESSONS` schema and `CourseView` as AZ-900/AZ-104 — no
  `portalMockup` field on either track's lessons, correctly, since neither
  ITIL nor Cloud+ has a real vendor portal to mock up.
- [x] A one-page **cheat sheet** per track — the single highest-praised
  feature from the platforms surveyed (Tutorials Dojo) — a printable/
  shareable visual summary of the exam's must-know facts, not just prose.
  Shipped: schema (`CHEAT_SHEET` in data/&lt;track&gt;.py), the "Sheet" tab under
  Learn (`CheatSheetView` in 04_shared_ui.jsx), print-to-PDF styling
  (`@media print` in templates/index.html.tmpl), and real content for all 15
  tracks. build.py's validator now hard-requires every track to have one,
  matching EXAM_CONFIG's `resources`.

## 6. A more robust UI: menus and separate pages (user's idea)

- [x] **Real client-side routing.** Hash-based (`#/az900/quiz/questions`,
  `#/home`), not path-based — a static site with no server has nowhere to
  add the rewrite rule a path router needs for a hard refresh on a deep
  link to resolve (GitHub Pages included), and a hash needs none, since
  the fragment never reaches the server at all. `routeToHash`/`parseHash`
  (03_helpers.js) are the pure translation in each direction; two effects
  in `06_app.jsx` keep the URL and `mode`/`activeTrack`/`learnView`/
  `quizView` state in sync without fighting each other, using an
  always-current ref (not a stale mount-time closure) to tell a real
  navigation apart from the harmless echo `hashchange` event a same-value
  write generates a moment later. Browser back/forward now walk real app
  history (confirmed via Playwright: picking a track, then Quiz, then a
  sub-tab, then Exam creates four distinct back-stack entries, each one
  restoring the exact prior view), and a link straight to
  `#/itil/quiz/questions` lands there directly — deep links work, not
  just the always-Home landing Home itself deliberately still is. An
  unrecognized or hidden track in the hash falls back to Home rather than
  erroring. Lesson-level deep links (which specific AZ-900/AZ-104 lesson)
  aren't part of the route — `CourseView`'s lesson selection is local
  component state, one level below what this pass scoped to.
- [x] ~~A proper **home/dashboard** page as the default landing screen~~
  Shipped, then reworked: refreshing into a separate dashboard page felt
  clunky for a static site with no real routing, so the app briefly
  restored the last track+mode you were actually using on every load
  instead (a first-time visitor with no history yet got AZ-900 → Learn →
  Study) — no more `view` state in `06_app.jsx`. Overall progress, streak,
  and a "continue where you left off" shortcut (for jumping back after
  browsing other tracks in the menu) moved into a hamburger menu instead
  of a full page.
- [x] **Reversed again, deliberately, by request: Home is back as the
  default landing screen.** The hamburger's bottom-sheet menu content
  (`TrackMenuPanel`) was promoted into a full inline page (`HomeView`,
  rendered for a new `mode === 'home'`) that the app now always opens to,
  instead of auto-resuming the last track+mode. The header's ☰ button —
  no longer needed to open an overlay, since you're either already on
  Home or one tap from it — was repointed to navigate straight back to
  Home from inside any track (title="Home"), so it's still one recognizable
  button doing "get me to the overview," just without the overlay. The
  "continue where you left off" tracking (`stats.lastVisited`) is now
  explicitly skipped while `mode === 'home'`, so landing on Home doesn't
  itself get recorded as "the place you left off" the next time you
  reload — it only tracks real learn/quiz/exam visits, which is what
  Home's own Continue button needs to stay meaningful.
- [x] **Home dashboard expansion, by request: a track dropdown, daily
  question/vocab, a next-cert-date countdown, and a readiness
  prediction.** Four asks landed together:
  - The always-expanded 15-track list became `TrackListDropdown` —
    collapsed by default behind an "All tracks (N)" summary row,
    expanding to the exact same rich rows the old hamburger bottom-sheet
    showed, since Home's other widgets now compete for the same space.
  - **Question of the Day** / **Vocab of the Day**: one question and one
    flashcard, picked deterministically per day (`seededIndex` in
    03_helpers.js — a stable string hash of the date, so the same pick
    survives reloads without persisting which item was chosen) from a
    shared "focus track" (`focusTrackKey`: the Cert Path's Up Next cert,
    else the last-visited track, else AZ-900 — one shared notion of
    "the cert you're currently working on" for every Home widget).
    Answering/revealing bumps the daily goal and records real
    mastery/results data, and locks for the day via a new
    `stats.dailyChallenge` field (`DailyQuestionCard`/`DailyVocabCard` in
    04_shared_ui.jsx) — revisiting Home later the same day shows the
    already-answered/revealed state instead of resetting it.
  - **Next cert date**: the My Cert Path card's plain "›" chevron becomes
    a countdown badge (reusing `formatScheduledLabel`'s phrasing, colored
    red overdue / gold inside a week) whenever the Up Next cert has a
    scheduled date.
  - **Readiness prediction**: `stats.readinessHistory` logs one score
    snapshot per track per day (self-correcting — a same-day write
    overwrites rather than duplicates); `readinessProjection` fits a
    straight line through the oldest and newest snapshots to project
    days-to-80%, falling back to an honest "keep practicing" message with
    fewer than 2 days of history, a flat/declining trend, or a
    >365-day projection, rather than a specific date it can't back up.
    Shown on Home as part of the same readiness card already on the Exam
    tab, for the focus track.
- [x] A side/hamburger **menu** for track navigation (☰, `IconMenu` in
  src/js/00_preamble.js) — opens `TrackMenuPanel` (04_shared_ui.jsx),
  which shows overall average mastery + streak, an optional "continue
  where you left off" shortcut, and a flat list of all 15 tracks (each
  once, with its description and live mastery %) — no path-grouping, no
  separate dropdown. Achievements and Data & Progress stay as their own
  quick-access header buttons alongside the hamburger. Superseded by the
  Home-page reversal directly above: `TrackMenuPanel` itself was renamed
  `HomeView` and its content now renders inline as the Home page rather
  than in a bottom-sheet overlay.
- [x] **An "About & Legal" panel**, reached from a footer link inside the
  hamburger menu rather than new header chrome (`AboutLegalPanel` in
  04_shared_ui.jsx) — About/contact, a manually-curated "what's new"
  changelog, and first-draft Terms/Privacy/Disclaimer text as collapsible
  sections in one bottom-sheet, matching every other panel's visual
  pattern instead of introducing a new one. See LAUNCH_CHECKLIST.md
  section 1 for what's covered and what's still open (an accessibility
  statement, a persistent footer once this has its own domain).
- [x] A **light/dark theme toggle** (user's idea) — a sun/moon sliding
  switch (`ThemeToggle`, `00_preamble.js`) in the header, dark mode a
  neutral dark grey (not the previous purple-tinted dark), light mode
  off-white. Implemented via CSS custom properties in
  `templates/index.html.tmpl` (`--color-*` under `:root` /
  `:root[data-theme="light"]`) rather than React state, so none of the
  hundreds of existing `COLOR.xxx` call sites needed to change — see
  README's "Light/dark theming" section for the full architecture,
  including the `COLOR.onAccent` token that keeps accent-colored
  buttons legible in both themes. Preference persists via `localStorage`
  only (not synced progress — it's a display setting, not study data).
  Also **color-blocked the top nav bar**: the header now sits in its own
  full-width bar with a distinct background + drop shadow instead of
  blending into the page body. `TRACK_ACCENTS` (hamburger menu track
  colors) was left theme-unaware after visual review showed no contrast
  problem in either theme — worth a second look if a future track's
  color reads poorly on the light card background.
- [x] **My Cert Path** (user's idea) — a personal, user-ordered sequence of
  certs, distinct from the removed multi-cert Learning Paths in section 1
  above (that was curated grouping; this is whichever certs the user adds,
  in whichever order they place them). Reached from a teaser card at the
  top of the hamburger menu ("Up next: <cert>") that opens `CertPathPanel`
  (04_shared_ui.jsx). Each cert added to the path can carry an optional
  scheduled test date and a "mark passed" flag; the "Up next" card is
  always just the first not-yet-passed cert in the order, so passing one
  automatically promotes the next with no manual re-ordering, and a passed
  cert moves into a collapsed Completed section instead of cluttering the
  active list — the "automatically moves you along and hides ones you
  complete" behavior asked for. Reordering uses simple up/down buttons
  (`moveActiveTrack` in 03_helpers.js), matching the no-drag-and-drop
  convention already set in section 13. Every track also gets a compact
  badge in the main "All tracks" list (a date chip if scheduled, a green
  "✓ Passed" if completed) so the tracking is visible outside the panel
  too, without adding controls that clutter that flat list. New `certPlan`
  state (`{order, scheduled, completed}`) rides the same sync/export-import
  path as `results`/`stats`/`srs` — it's study-planning data, not a display
  preference, so unlike the theme toggle it does travel with your account.
- [x] **Moved Match under Quiz, not Learn** (user's idea). Match is a recall
  self-test — you either know the pairing or you don't — which fits Quiz's
  purpose (testing) far better than Learn's (reading/reference), so Learn's
  sub-tabs are now just Cards/Study/Sheet and Quiz gained its own
  Questions/Match sub-tab row, both in `06_app.jsx`. The category filter
  chips above already applied to both Learn and Quiz, so Match kept
  respecting the active category filter with no extra wiring; `MatchGame`
  itself (04_shared_ui.jsx) didn't change at all. One real bug caught in
  testing: `startLessonQuiz`/`startCategoryQuiz` ("Quiz this section," a
  lesson's own quiz) only set `mode` to `'quiz'`, not the new `quizView`
  sub-tab — so triggering one of those while Match happened to be the last
  open Quiz sub-tab would silently land you on the matching game instead
  of the quiz you asked for. Fixed by having those functions explicitly
  set `quizView` back to `'questions'`.
- [x] **Category filter chips → a dropdown**, on the same request as the
  quiz-length control above. The horizontally-scrolling chip row above
  Cards, flat-track Study, and both Quiz sub-views (Questions/Match) is now
  one `CategoryFilterSelect` (04_shared_ui.jsx) — a `<select>` with each
  category's live mastery % folded into its option label, since a
  dropdown's options have no useful hover state to hold a tooltip the way
  the old chips did. `CategoryChip` is gone; nothing else used it.
  Converting this surfaced a real, previously-latent bug in `MatchGame`:
  its `onRoundComplete` effect was declared *after* the component's "not
  enough cards for a round" early return, an unconditional-hooks-order
  violation React only throws once a render actually crosses that early
  return after having skipped it (or vice versa) — reachable when
  switching tracks while Match is the open Quiz sub-tab and a specific
  category was selected, since the new track's card count for that same
  category key can transiently drop below 2 for one render before the
  existing `activeCat` reset effect fires. Fixed by moving `isDone` and
  its effect above the early return (with an added `round.picked.length >
  0` guard, since without it an empty round would immediately count as
  "done" now that the effect runs on every render). This was a
  pre-existing defect, not something this dropdown change introduced —
  it's just what finally exercised the code path that had been dormant
  while Match lived under Learn.

## 7. Spaced repetition & study-science features (from research)

- [x] Real spaced-repetition scheduling for flashcards (a simplified SM-2),
  so a card you get wrong resurfaces sooner and one you know well resurfaces
  later. New persisted `srs` map (per-track, per-card `{interval, ease,
  reps, due}`) in src/js/03_helpers.js's `nextSrsEntry`/`orderBySrs`, applied
  to Cards-mode ordering only — "mastery %" itself is still a lifetime ratio,
  unchanged; this only changes review order, not how mastery is scored.
- [x] Confidence-based review (rate 1–5 instead of binary correct/incorrect),
  the mechanic Brainscape is built around, as an alternative to the current
  flashcard rating. Shipped as a real change to `nextSrsEntry`, not just a
  UI relabel: it's now the textbook SM-2 quality scale (1 = total blank,
  5 = instant no-hesitation recall) rather than a bolted-on 1-5 skin over
  binary correct/incorrect — a 3+ grows the interval by the standard ease
  formula (a 5 nudges ease up more than a bare-pass 3), and anything under
  3 resets it. Deliberately did NOT thread the 1-5 scale into mastery %,
  achievements, or exam readiness — those are shared with quiz questions'
  real right/wrong signal, and reworking that into a 1-5-aware average
  everywhere would have been a much bigger, riskier change than the rating
  UI itself needed. `ratingToOutcome` (03_helpers.js) is the one seam: a
  3+ counts as "correct" for mastery purposes, same threshold as the SRS
  growth branch, so the two systems agree on what "knew it" means.
- [x] Per-category trend-over-time (not just a current-snapshot mastery
  bar). Shipped as `stats.categoryMasteryHistory` — one self-correcting
  daily snapshot per track per category (capped to 30 entries, same
  pattern as the exam-readiness history above), recorded while a track's
  Learn/Quiz/Exam view is open. The weighted-mastery breakdown at the
  bottom of those views now shows each category's % *and* its change
  since the oldest recorded snapshot (e.g. "+8% / 6d"), spelled out as
  visible text rather than only a hover tooltip — tooltips don't fire on
  touch at all, so that was the only way this was ever going to be usable
  on a phone. A resurfaced "missed question history" beyond the one-shot
  missed-question queue is still open.

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

- [x] **Question-bank wording-giveaway audit (user's idea).** The user
  found that some multiple-choice questions were answerable just from
  how the options were worded, without knowing the material — a real
  quality problem distinct from content accuracy. Ran a full pass across
  every `mc` question in all 15 tracks (~275+ questions reviewed, over
  100 fixed) looking for five specific tells: (1) the correct option
  noticeably longer/more detailed than distractors, (2) distractors
  using absolute language ("always," "never," "completely") while the
  correct answer is measured, (3) the correct option echoing distinctive
  stem vocabulary that distractors don't share, (4) distractors
  obviously irrelevant to the domain rather than plausible near-misses,
  (5) only the correct option grammatically completing the stem. Fixed
  by rewriting distractors to be plausible, comparable in length/
  register, and genuinely confusable — never by changing which answer
  is correct. Not every long/absolute-sounding option is a violation
  (e.g. a real product name like "RA-GZRS" is just longer than "LRS" —
  that's the real term, not a tell), so this took actual per-question
  judgment, not a mechanical find-and-replace. Same pass also brought
  every track's question count up with a genuine easy/medium/hard mix
  (roughly 30/40/30) rather than uniform difficulty, weighted across
  each track's categories proportional to their exam-weight `marks` —
  total question bank grew from 1126 to 1263 across all 15 tracks.
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
- [x] **Real Azure Portal screenshots.** Ten genuine screenshots (resource
  group creation, storage account tabs, VM instance details, IAM role
  assignments, App Service deployment slots, an NSG inbound security
  rule, an Azure Policy compliance dashboard, a Recovery Services vault's
  backup configuration, an Invite external user panel, and the public
  Azure pricing calculator website), sourced from Microsoft's own CC BY
  4.0-licensed MicrosoftDocs GitHub repos and saved locally under
  `images/portal/`, shown alongside (not replacing) the existing SVG
  portal mockups in AZ-900/AZ-104 lessons, each with a plain-language
  description of what's shown, a source link, and attribution. Both
  AZ-900 and AZ-104 now have a real screenshot on every single lesson —
  no gaps left in either course. No real screenshot was added for
  the VNet-creation mockup — no clean, on-topic match was found.
- [x] **Quiz/exam questions built around the real screenshots.** 7 new
  questions (4 in AZ-900, 3 in AZ-104 — `'image': 'resourceGroup'` etc. on
  the question dict) show one of the real screenshots above the
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
- [x] **Service worker cache-busting, now automatic.** A stale cached
  `index.html` on a returning visitor's device made two separate real
  content updates (Cloud+ being "missing," then AZ-900's Study page
  "looking old") look like regressions, because the manual `CACHE_NAME`
  bump in `service-worker.js` got forgotten both times. `build.py` now
  derives `CACHE_NAME` from a hash of the built `index.html` itself
  (`sync_service_worker_cache_name()`) and rewrites `service-worker.js`
  automatically whenever the content actually changes — the human step,
  and the failure mode, are both gone for good.
- [x] **Course tracks (AZ-900/AZ-104) now open straight into lesson 1,
  not a lesson-list page.** `CourseView` used to force a click through a
  full "Course progress" list before showing any actual content, even
  though non-course tracks (ITIL, etc.) already opened straight into
  their first section. It now defaults to the first lesson directly, with
  "‹ Previous lesson" / "Next lesson ›" buttons (matching StudyView's
  section navigation) to move straight through the course. The full
  lesson list is still reachable via "‹ All lessons" for jumping to a
  specific one out of order. Fixed two related state bugs along the way:
  `LessonDetail` needed `key={lesson.id}` so switching lessons actually
  resets its reading-page/gating state instead of carrying it over, and
  `CourseView` needed `key={activeTrack}` so switching tracks resets which
  lesson is showing instead of carrying over a lesson id that doesn't
  exist in the new track.
- [x] **Term flyouts no longer overflow off-screen near the right edge.**
  A flyout anchored purely `left: 0` under its trigger word would run off
  the right edge of the screen (forcing a horizontal scroll to read the
  rest of it) for any term close enough to the margin. `TermTrigger`
  (02_portal_mockups.jsx) now measures the flyout's actual rendered
  position in a `useLayoutEffect` (before paint, so there's no flash of
  the wrong position) and nudges it back on screen with a `transform`
  shift, moving the little pointer arrow the opposite amount so it still
  visually points at the real word. A simple left/right flip wasn't
  enough on its own — a 280px-wide flyout on a ~390px phone screen can
  overflow the *other* edge if the word sits mid-screen — so this shifts
  by exactly the overflow amount instead of just flipping sides.
- [x] **More key terms, and real cross-referencing so flyouts actually
  fire, across all 15 tracks (three batches so far).** Audited why term
  flyouts felt sparse outside AZ-900/AZ-104: the mechanism
  (`autoHighlightTerms` in 02_portal_mockups.jsx) was always working
  correctly, but most tracks' flashcard definitions almost never
  mentioned each other's terms by name, so there was nothing to
  highlight — a measured baseline found several tracks at literally 0%
  of cards triggering even one flyout. Batch 1 added 39 new flashcards
  (607 → 646) targeting the zero-coverage tracks first. Batch 2 added 17
  more (646 → 663), pushing the remaining weakest tracks up to 9-12%.
  Batch 3, at the user's request, focused specifically on AZ-900,
  Cloud+, AZ-104, and DP-900: added 4-5 new flashcards to each (663 →
  681 total), moving them from 21/10/11/22% to 24/13/15/28%
  respectively. Batch 4 targeted the (then) 5 lowest-coverage tracks —
  SC-300, SC-500, AB-650, AZ-305, SC-200 — adding 4 new flashcards to
  each (681 → 700 total), moving them from 10/11/12/12/12% to
  20/18/17/20/17% respectively; new lowest are now AZ-802, MD-102, and
  EHR Integration (14/14/16%), a natural target for a batch 5. Overall
  coverage keeps climbing batch over batch. Caught
  and fixed two real mistakes along the way: batch 1 accidentally added
  an "Azure landing zone" card to AZ-305 that nearly duplicated an
  existing "Azure landing zones" card (replaced with a genuinely
  distinct term, Cloud Adoption Framework); batch 3 caught its own
  SC-500 addition citing a card front that doesn't actually exist in
  that track (belonged to a different track) before it shipped, and
  rewrote it to reference something real. This is real, meaningful
  progress, not full coverage — most cards still don't cross-reference
  another term, since a natural, accurate definition doesn't always have
  one to reference. Continuing this in further batches is legitimate
  ongoing work, not a one-time fix.

## 10. Future-proofing for a standalone web/iOS/Android app (user's idea)

The user wants the option to eventually turn this into a real multi-platform
product (own web deployment, iOS app, Android app), separate from its current
life as a single generated HTML file synced via the Claude runtime. Originally
scoped as "nothing here should be built now, just decisions to not foreclose
it" — since revisited by explicit request to actually start on it, with one
constraint that turned out to be permanent rather than a stepping stone: stay
serverless. No hosting, database, or accounts, not "not yet" but not ever —
see the cloud-sync entry below for the actual decision. The items below are
the ones that fit inside that constraint, plus the one that still explicitly
doesn't (and why it's still waiting).

- [x] **Separate pure logic from rendering.** Achievement evaluation, streak
  math, spaced-repetition scheduling, and scoring in src/js/03_helpers.js
  were already plain JS functions with no DOM/React dependency — with one
  exception found on closer audit: `downloadJSON` (the progress-export
  button) reached into `document`/`Blob`/`URL`, browser APIs a React
  Native core wouldn't have. Moved it into `06_app.jsx` next to its one
  call site (`doExport`), so 03_helpers.js is now genuinely 100%
  platform-agnostic — the reusable "core" a future iOS/Android client
  would want to share with the web app, not just mostly one.
- [x] **Content as data, not baked-in JSON — additive, not yet live.**
  `build.py` now also writes `dist/data/<track>.json` (plus a
  `dist/data/tracks.json` manifest of `TRACKS`/`EXAM_CONFIG`) from the
  exact same `data/*.py` source the inline bundle uses
  (`build_track_data()` feeds both, so they can't drift apart). This is
  deliberately scoped to the safe half of the idea: it proves the content
  has a real, fetchable, per-track source of truth a future second
  client could read, without touching how *this* app loads data today —
  `index.html` still inlines everything up front exactly as before,
  zero behavior change, zero regression risk. Actually switching this
  app's own runtime to fetch `dist/data/*.json` lazily per track (instead
  of inlining all 15 tracks whether you use them or not) is real, valuable
  follow-on work — it would cut the initial payload substantially — but it
  touches nearly every `DATA[activeTrack]` call site in the app for a
  loading-state guard, which is a much larger, riskier change than fit
  alongside everything else moving this session. Left for its own pass.
- [x] **Made today's persistence layer actually more robust ("the backend
  running smoothly," within the stay-serverless choice).** `saveLocal`
  (03_helpers.js) silently swallowed every write failure — a full
  localStorage quota, a private-browsing restriction — meaning progress
  could simply stop saving with zero signal to the user. It now reports
  success/failure, and `persistPayload` (06_app.jsx) surfaces a real
  banner ("Your last save didn't go through...") when a write fails,
  clearing automatically the next time one succeeds. This is the concrete
  reliability work that fits under "run smoothly" without standing up a
  server; the items below are what still needs one.
- [x] **Decided, not just deferred: no real backend, ever — this stays a
  serverless, accountless static site.** Closing out what had been an
  open architectural question. `window.claude.use('db')` (src/js/06_app.jsx's
  persistence effect) only exists inside a Claude artifact and syncs
  progress there; everywhere else the app already falls through to
  plain `localStorage`, scoped per browser/device with no accounts and
  no cross-device sync — and that's the permanent shape of it, not a
  placeholder for a future account system. No server to run, host, pay
  for, secure, or keep patched; no accounts, passwords, or user data to
  be responsible for beyond what already lives in the visitor's own
  browser; the entire deployment story stays "commit index.html, point
  GitHub Pages at it." If cross-device sync is ever wanted, the answer is
  each person's own existing cloud (export the JSON from Data & Progress,
  drop it in their Drive/iCloud/Dropbox, import it on another device) —
  not a service this project runs on their behalf. This is why the
  "future-proofing for a standalone app" framing above no longer applies
  to sync specifically: a standalone build still wouldn't grow a backend,
  it would ship with the same local-only model this version already has.
- [ ] **A real package/module boundary — still explicitly deferred.** The
  filename-concatenation build (build.py sorting src/js/*.jsx) is fine
  for one static page; real npm/ES module boundaries only pay for
  themselves "once more than one client consumes it," per this section's
  original framing — and there still isn't a second client yet, just the
  standalone JSON now sitting there for one. Forcing real modules today
  would also mean adding a JS build toolchain (Babel CLI or esbuild) this
  project doesn't currently have — README's "Where things stand" section
  already flags that as "a bigger call" needing its own justification,
  not something to bundle in as a side effect of an architecture cleanup
  pass. Revisit when an actual second client shows up.

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

- [x] **Extend the real-screenshot treatment to more AZ-900/AZ-104 lessons
  that currently only have the hand-drawn SVG mockup — now complete for
  both courses.** Went from 5 to 10 real screenshots total, all CC BY 4.0
  from `MicrosoftDocs/azure-docs`: App Service "Add Slot" panel (AZ-104
  App Hosting & IaC), an NSG "Add inbound security rule" panel (AZ-104
  Networking), an Azure Policy initiative compliance dashboard (AZ-900
  Cost, Policy & Monitoring — previously had neither a diagram nor a
  mockup at all), a Recovery Services vault Backup Configuration panel
  (AZ-104 Monitoring & Recovery), an "Invite external user" panel (AZ-104
  Identities & Access — its last remaining gap), and the public Azure
  pricing calculator website (AZ-900 Cloud Fundamentals). Each shipped
  with its own new hand-drawn `PORTAL_MOCKUPS` component too, since the
  real-screenshot slot only renders alongside one. Every lesson in both
  AZ-900 and AZ-104 now has a real screenshot — no remaining gaps in
  either course (see README's "ideas for Claude Code," which still notes
  the separate, smaller diagram gap: 2 AZ-104 lessons lack a hand-drawn
  diagram, independent of the screenshot work).
- [x] **Licensing note learned the hard way:** not every `MicrosoftDocs/*`
  GitHub repo uses the same license as `azure-docs` (CC BY 4.0 for content
  + MIT for code samples, in separate `LICENSE`/`LICENSE-CODE` files).
  `entra-docs`, for example, has a single plain MIT `LICENSE` for the
  whole repo — a real, non-obvious difference, not an oversight — so its
  images weren't used here despite finding an on-topic candidate. Check
  each repo's actual license file before reusing an image from it; don't
  assume the azure-docs pattern holds elsewhere in the MicrosoftDocs org.
  Re-confirmed on a second pass: `entra-docs`' `LICENSE` *and*
  `LICENSE-CODE` are both plain MIT (no CC BY split at all), so SC-300
  screenshots are still blocked on this. Also learned Microsoft has split
  `azure-docs` into many product-specific repos over time — Azure SQL/
  Cosmos DB content is no longer in `azure-docs` and its actual current
  repo wasn't found; `azure-security-docs` (CC BY 4.0, confirmed) only
  covers Key Vault/HSM/attestation, not Defender for Cloud or Sentinel,
  so SC-200 sourcing is also still open. Don't assume a repo name from
  the product name — verify it exists and check its license before use.
- [x] **Structural gap closed: real screenshots now work on flat-StudyView
  tracks, not just AZ-900/AZ-104's course lessons.** A category in any
  track's `CATEGORIES` can carry an optional `screenshot` key into
  `REAL_PORTAL_SCREENSHOTS`; a new `CategoryScreenshot` component renders
  it in `StudyView` (both the single-category and paginated-"all" views),
  right where `ResourceLinksRow` already sits. `RealPortalScreenshot`
  itself needed no changes — it was already a fully self-contained card,
  never actually dependent on being nested under a hand-drawn mockup the
  way `LessonDetail` happened to use it. One real fix along the way: its
  caption was hardcoded to "Real Azure Portal screenshot," which would
  have mislabeled a screenshot from a different admin console — added an
  optional `product` field on each shot (defaults to "Azure Portal" for
  every existing entry, so nothing already shipped changed) so a caption
  can correctly say "Real Microsoft Intune admin center screenshot"
  instead.
- [x] **MD-102 (Intune admin center) — first track shipped under the new
  structural slot, all 5 categories covered.** Sourced from
  `MicrosoftDocs/memdocs` (confirmed CC BY 4.0 + MIT split, same pattern
  as azure-docs): the Settings catalog/Templates/Properties catalog
  profile-type picker (Manage and Maintain Devices), the MDM automatic
  enrollment scope setting (Prepare Infrastructure), a compliance policy's
  noncompliance-notification wizard (Protect Devices), a Win32 app's
  registry-based detection rule (Manage and Secure Applications), and the
  enrollment/compliance/configuration health-tile dashboard (Optimize
  Endpoint Operations) — `images/intune/*.png`, registered in
  `REAL_PORTAL_SCREENSHOTS` with `product: 'Microsoft Intune admin
  center'`.
- [x] **AZ-305 (architecture-center diagrams)** — shipped. 5 CC BY 4.0
  diagrams from `MicrosoftDocs/architecture-center` (confirmed via that
  repo's own `LICENSE`, distinct from its code-only `LICENSE-CODE`): a
  hub-spoke virtual network topology, a VM landing-zone baseline
  architecture, a compute-service decision tree, a load-balancing-service
  decision tree, and a horizontal data-partitioning (sharding) diagram —
  all genuinely embedded in live architecture-center articles, not
  orphaned assets. Registered in `REAL_PORTAL_SCREENSHOTS` with
  `product: 'Azure Architecture Center reference diagram'` (they're
  reference diagrams, not portal screenshots, so get their own product
  label rather than misleadingly saying "Azure Portal"). Images in
  `images/az305-arch/`.
- [ ] DP-300 (Azure SQL/Cosmos DB) and SC-200 (Defender for Cloud/Sentinel)
  still need their actual source repo found. SC-300 stays blocked on
  `entra-docs`' licensing per above unless a different, properly
  CC-BY-licensed source turns up. Cloud+ has no real portal to screenshot
  anyway (vendor-neutral by design).
- [x] More quiz/exam questions built around each new screenshot, matching
  the existing pattern (`'image': '<key>'` on the question dict) — done
  for AZ-305: 10 new questions (2 per new diagram, `q38`–`q47`) spanning
  the `infrastructure`, `identityGovernance`, and `dataStorage`
  categories. MD-102 still doesn't have any of these yet, only the
  Study-view placement.

## 13. Interactive learning games (user's idea)

- [x] **Draw-a-line matching**, added on top of (not replacing) the
  existing tap-a-term-then-tap-a-definition flow in `MatchGame`
  (04_shared_ui.jsx). Rather than the originally-sketched left-column-of-
  terms/right-column-of-definitions layout — a poor fit for this app's
  definitions, which are full sentences, not short glossary phrases, and
  would force cramped multi-line cells at phone width — the existing
  vertical layout (terms wrapped in a row, definitions stacked as full-
  width cards below) was kept, with the drag going top-to-bottom instead
  of left-to-right: press a term and drag down onto its definition, with a
  live dashed SVG line following the pointer, a solid red line flashing
  between the two on a wrong drop, and a permanent dashed green line
  linking every matched pair. Both interaction styles share one
  `evaluateMatch` function so they can never disagree about what counts as
  correct, and tapping still works completely unchanged for keyboard users
  or anyone who just taps instead of drags.
  Two real, non-obvious things came out of building this rather than just
  planning it:
  - **Drag currently only starts from a term, not a definition** — the
    reverse direction (drag a definition onto its term) isn't wired up
    yet, though tapping still supports both orders. Worth adding if this
    turns out to matter to how people actually play.
  - **Auto-scroll while dragging.** A round can run taller than one
    screen (up to `ROUND_SIZE` full-sentence definitions stacked), and the
    drag captures the pointer instead of allowing a normal touch-scroll —
    so without help, a term near the top literally can't be dragged onto
    a definition below the fold. Holding near the top/bottom edge now
    auto-scrolls the page (faster the closer to the edge), verified
    end-to-end with a short-viewport test that drags to the edge, holds,
    watches the page scroll, then re-measures the target's new position
    before completing the drop — a naive test (or a naive implementation)
    that computes the drop point once, before any scrolling, breaks the
    moment the auto-scroll it's supposed to be testing actually moves the
    target.
- [x] **Match redesign for legibility** (user feedback: the first version
  didn't read as an obvious matching exercise, and the text was cramped).
  `ROUND_SIZE` dropped from 6 to 4 pairs by default (the in-lesson mini
  round, `roundSize={3}`, is unaffected) — less on screen at once, and a
  round is far more likely to fit in one view without needing the
  auto-scroll above at all. Every term chip now carries a small numbered
  badge (1, 2, 3…) and every definition an inline lettered prefix (A.,
  B., C.…), the standard worksheet convention for "these two lists are
  meant to be connected" — that framing was previously invisible; the
  player just saw two unlabeled walls of text with no visual cue they
  were a matching pair at all. Base font sizes went up across the board
  (definitions 12.5px → 14.5px; terms 12.5px → 15.5px for short ones),
  with a new `termFontSize()` helper that steps a long compound term
  (e.g. "AzCopy vs. Storage Explorer vs. Azure File Sync") down to a
  smaller size instead of overflowing or wrapping into a ransom note —
  short terms get to be noticeably bigger rather than everything sharing
  one compromise size.
- [ ] **"Choose the more correct answer."** A comparative-judgment mode:
  given a scenario, show two plausible-but-imperfect answers and ask which
  is *better*, with an explanation of what makes the runner-up fall short.
  This targets the "best answer, not just a correct one" reasoning real
  Microsoft/CompTIA exams lean on, which today's single-best-answer
  multiple choice doesn't quite exercise. Needs a new question shape
  (e.g. `{"type": "compare", "scenario": ..., "optionA": ..., "optionB": ...,
  "betterKey": "A", "why": ...}`) and its own view alongside the existing
  `QuestionView`.
- [x] **Scenario Mad Libs.** Shipped as a "Mad Libs" Quiz sub-tab (only
  shown for tracks with `MADLIBS` content — now all 15 tracks, 3-4
  scenarios each, 49 total; started with AZ-900/AZ-104/ITIL/Cloud+ and
  later expanded to the remaining 11 in the same content-quality pass
  as the question-bank audit below): a short real-world scenario
  paragraph with 2-3 inline dropdown blanks, each filled from a small
  set of term choices (`MadLibsView` in 04_shared_ui.jsx). Scored
  all-or-nothing per scenario — every blank right, or the whole scenario
  counts as one miss (matching the existing `ms` multi-select question's
  all-or-nothing precedent) — and genuinely feeds into `results`/mastery
  the same way flashcards and questions do: `trackMastery`
  (03_helpers.js) and `masteryByCategory` (06_app.jsx) both fold in
  `mod.madlibs` ids alongside flashcards/questions, unlike Verbal Quiz
  and CLI practice above, which are deliberately unscored. Data shape:
  `{id, cat, scenario, blanks: [{key, options, correct}], explanation}`,
  where `scenario` is a template string with `{key}` placeholders split
  on render (`item.scenario.split(/\{(\w+)\}/)`). `build.py` validates
  every blank has a matching placeholder in its scenario and vice versa
  (a common authoring mistake this catches immediately), plus the usual
  unique-id/valid-category/non-empty-explanation checks — madlib ids
  share the same id namespace as flashcards/questions (validated against
  the same `item_ids` set) since they write into the same
  `results[trackKey]` map. CLI_CHALLENGES coverage (AZ-104/AZ-802 only)
  stays the one deliberately narrower exception — that mode only makes
  sense for tracks where real CLI/PowerShell syntax is actually core to
  the job, unlike Mad Libs/Sequences which generalize to any track.
- [x] **Step-ordering / sequencing challenges.** Shipped as a "Sequence"
  Quiz sub-tab (only shown for tracks with `SEQUENCES` content — AZ-104,
  AZ-305, ITIL, and AZ-802 at launch, 3 challenges each): shuffle the
  steps for a stated goal — deploying a VM behind a load balancer,
  designing an isolated landing zone, the ITIL Continual Improvement
  Model, promoting a domain controller — and arrange them back into the
  right order with simple up/down move buttons per row (`SequenceView`
  in 04_shared_ui.jsx) — no drag-and-drop dependency, exactly per this
  item's own scoping; true drag-to-reorder stays a later enhancement,
  not a blocker. Data shape ended up simpler than originally sketched:
  `{id, cat, prompt, steps: [...], explanation}` with `steps` authored
  already in correct order — the UI shuffles a working copy and tracks
  it as an array of original indices, so checking correctness
  (`checkSequenceOrder` in 03_helpers.js) is just "is this array already
  [0,1,...,n-1]," with no separate `correctOrder` field needed. A
  shuffle that happens to land already-sorted (rare, small lists) is
  detected and reversed so the challenge is never trivially "already
  correct." Scored all-or-nothing per sequence, same as Mad Libs, and
  feeds into `results`/mastery the same way (`trackMastery`/
  `masteryByCategory` fold in sequence ids too). `build.py` validates
  unique ids (shared namespace with flashcards/questions/madlibs, since
  they all write into the same `results[trackKey]` map), valid
  categories, non-empty prompt/explanation, and a `steps` list of at
  least 3 unique, non-empty entries.
- [ ] **Stretch, lower priority — build-your-own-scenario.** Instead of only
  solving developer-authored sequences, let the user assemble their own
  scenario from a bank of steps as a self-test/review tool. Since the app
  has no accounts or backend, an authored scenario would need to persist
  through the same localStorage/cloud-sync path as everything else
  (extending the `results`/`stats` shape) — worth scoping in more detail
  once the core step-ordering game above exists and its data model has
  proven out, rather than designing both at once.
- [x] **Vocabulary flyouts extended to Mad Libs and Sequence.** Both new
  game modes' text (Mad Libs' scenario prose plus its post-submit
  explanation; Sequence's prompt, each individual step, and its
  explanation) now runs through the same `autoHighlightTerms` auto-detect
  mechanism already used for flashcard backs and quiz explanations — tap
  a bolded term for its flashcard's flyout definition, same as everywhere
  else. No new mechanism needed, just new call sites in `MadLibsView`/
  `SequenceView` (04_shared_ui.jsx) plus threading `flashcardsData`
  through from `CertStudyApp`. Confirmed empirically (not just by
  inspection) that real matches do fire — about 40% of the existing Mad
  Libs scenarios contain at least one flashcard-front term verbatim in
  their prose/explanation; the rest simply don't happen to reuse another
  term's exact front string, which is expected given ~24% of all
  flashcard fronts across the app are compound "X vs. Y" comparison
  cards that rarely recur verbatim in unrelated sentences — a pre-
  existing characteristic of the auto-detect mechanism itself (already
  true everywhere else it's used), not something this change introduced
  or could fix without a much bigger, separately-scoped change to how
  comparison-style flashcards are authored.

## 14. UX & learning-science feedback (user asked for an honest review)

A candid pass on what's working, what's rough, and where study-science
research points next — requested directly, not just inferred. Grouped by
theme; the concrete, buildable ones are checkboxes like everywhere else,
but a few are genuinely open design questions rather than tasks, and are
called out as such.

**What's actually working well, worth knowing so it doesn't get diluted
later:** immediate explanations right after answering a question (not just
at the end of a session) is a real testing-effect win — most cheap
quiz apps only show correctness, not the reasoning, and delay it. Real
spaced repetition (not a gimmick — an uncapped, genuinely growing interval
via `nextSrsEntry` in 03_helpers.js) plus a timed Exam mode plus per-
category resource links plus real portal screenshots is a level of depth
most indie study apps don't bother with. That combination is the app's
actual competitive edge — worth protecting as new features get added, not
trading away for shinier but shallower ones.

- [x] **A daily goal ring.** A small, self-set "study N cards/questions
  today" target with a simple progress ring — the single highest-leverage
  Duolingo mechanic and one this app doesn't have yet, despite already
  having the streak infrastructure to hang it off of. Cheap to build
  (a number + a count against today's activity, both already tracked)
  and directly answers "why open this again today." Shipped as
  `stats.dailyGoal` (`{ target, date, count }` in 03_helpers.js, rolled
  over — not accumulated forever — the first time `recordDailyActivity`
  sees a new calendar day) and a small circular-progress ring in the
  hamburger menu's Cert Study Hub panel: it bumps on every flashcard
  rating, quiz/exam question answered (Today's Mix questions count too,
  since the bump doesn't care which track a question came from), turns
  solid green with a checkmark once the target is hit, and a tap on the
  ring opens a small +/- 5 stepper to change the target. Travels with the
  rest of synced progress, same as everything else in `stats`.
- [x] **A cross-track "Today's Mix" review session.** Shipped as an
  extension of My Cert Path rather than a standalone feature: a "Start
  Today's Mix" button appears in the Cert Path panel once 2+ active
  (not-yet-passed) certs are in the path. It builds one quiz session
  drawn from every active cert's own question pool, weighted by priority
  order — the top ("Up next") cert gets a harmonic-weighted majority
  share (`weightedTrackQuotas` in 03_helpers.js: 1, 1/2, 1/3... apportioned
  by largest remainder so quotas always sum exactly to the session length
  and every included cert gets at least one question), so the top cert
  gets primary coverage and the rest supplement it rather than competing
  equally. Each question is tagged with its source track so answering it
  updates that track's own mastery/SRS data, not the currently open
  track's — and the question card, category badge, and the "worth another
  look" summary all show which cert each question came from. Not a
  revival of Learning Paths — no fixed ordering/sequencing claim, just a
  weighted mixer across the certs you're actively juggling.
- [x] **An "exam readiness" signal per track.** A single blended indicator
  (recent quiz/exam accuracy + mastery % + how stale that mastery is)
  instead of a flat mastery percentage alone — Tutorials Dojo and
  Whizlabs both lean on this and it's a more honest answer to "am I
  actually ready" than a lifetime-ratio percentage that never decays.
  Shipped as `examReadiness` in 03_helpers.js, purely derived from data
  already recorded elsewhere (no new persisted fields): starts from the
  existing lifetime mastery %, then discounts it by a freshness factor
  computed from each attempted item's last-seen timestamp (already
  tracked in `seenLog` for spaced repetition) — 1.0 if you studied today,
  decaying to a 0.6 floor by 30 days out, so a 90%-mastery track you
  haven't touched in two months reads as less ready than the same 90%
  built this week. Surfaces as a labeled card ("Just starting" /
  "Building" / "Getting there" / "Exam ready") on the Exam tab's intro
  screen — the moment you're actually deciding whether to sit the exam —
  rather than replacing the mastery % shown elsewhere, since those serve
  a broader "browse progress" purpose. Ties into the missing "trend over
  time" item already in section 7, which would need real per-attempt
  history rather than this timestamp-based proxy.
- [x] **Confidence-based self-rating for flashcards** (already listed in
  section 7 — shipped there, see that entry for the implementation).
  Resurfaced here originally because it's the most direct fix for a real
  risk: streaks/badges can quietly reward speed-clicking through cards
  over actually retaining them. Rating 1–5 instead of binary correct/
  incorrect is more honest self-assessment, and now genuinely does plug
  into real SM-2 interval math rather than just relabeling two buttons
  as five.
- [ ] **Retrieval-practice "blurting."** Before flipping a flashcard, ask
  the user to mentally (or literally, in a text box) recall the answer
  first — self-graded, no backend/grading needed, but the extra effortful
  step before reveal is a well-evidenced retention booster over passive
  flip-and-read.
- [ ] **A "teach it back" mode.** Free-text: explain a concept in your own
  words before seeing the official explanation (the protégé effect) —
  self-graded like blurting above, no AI grading required. Pairs well
  with the "on the job" real-world callouts already in section 2.
- [x] **An explicit interleaved/mixed-category quiz option**, distinct
  from today's per-category or per-track quiz — pulling randomly across
  categories (or tracks, via Today's Mix above) on purpose. Blocked
  practice (all-one-topic-in-a-row, which is what "Quiz this section"
  gives you) feels more fluent while studying but interleaving is the
  more evidence-backed technique for actual exam-day transfer; worth
  offering both rather than only the easier-feeling one. Shipped as
  `pickInterleaved` in 03_helpers.js: choosing "All categories" in a
  single track's Quiz now round-robins across every category on purpose
  (still recency-biased within each category via the existing
  seen-timestamp logic), instead of leaving diversity up to chance the
  way a plain shuffle would. A short caption under Quiz's "All
  categories" pool now says so explicitly, so it reads as a deliberate
  mode rather than an unfiltered default.
- [x] **Surface the SRS ordering, don't hide it.** Cards mode silently
  reordered by due-date with no explanation. Shipped a small "Cards you're
  overdue to review come first" caption above Cards mode, shown only once
  there's actual SRS history for that track (so a brand-new deck doesn't
  show a meaningless caption on cards that have never been rated).
- [x] **Header tested across phone sizes and desktop — no breakage found,
  one real cosmetic rough edge confirmed.** Actually verified via
  Playwright at 320/360/390/428/768/1024/1280/1920px (not just eyeballed):
  no horizontal overflow, no clipped/overlapping icons, and the centered
  `max-w-md` column scales correctly up through desktop widths. Along the
  way, testing surfaced and fixed a real bug, not just a density question
  — switching mode/track/sub-tab left scroll position wherever the
  previous view had it, which on a phone-width screen could mean landing
  fully below the header after navigating away from a deeply-scrolled
  Home. Fixed with a scroll-to-top-on-navigation effect in `06_app.jsx`,
  forced to `behavior: 'instant'` since the page's global
  `scroll-behavior: smooth` would otherwise animate it slowly enough to
  be visible. The one remaining rough edge: a long track subtitle (e.g.
  AB-650's "M365 & AI Services Administrator") wraps to 2-3 lines on a
  320-360px-wide phone instead of clipping — nothing breaks or overlaps,
  it just makes the header taller on the narrowest real devices. Left
  as-is rather than truncating with an ellipsis, since that would hide
  real information (exam codes, full product names) the subtitle exists
  to show — a call worth making deliberately, not as a side effect of a
  test pass, so flagging it here rather than just fixing it. Moving the
  Learn/Quiz/Exam switch to a bottom tab bar remains a bigger, separate
  redesign if this ever does feel cramped on a real device (see
  LAUNCH_CHECKLIST.md's cross-device QA item).

## 15. Content ideas beyond quiz questions

- [ ] **A personal mnemonic bank.** Let a user attach their own short
  note/mnemonic to any term (stored locally like everything else), which
  then resurfaces alongside that term's flashcard/flyout — a low-effort
  personalization layer that plain flashcards can't offer.
- [ ] **Milestone "boss battle" sessions.** Once a track crosses a mastery
  threshold, unlock a themed, harder mixed-mode session as a checkpoint —
  distinct from routine quizzes, gamifying the mastery threshold itself
  rather than just badge-collecting.

## 16. Text-to-speech revamp & a hands-free "Verbal Quiz" mode (user's idea)

TTS started minimal: a single per-item "Listen" button (readings, flashcard
fronts/backs) that called the browser's `SpeechSynthesisUtterance` API at a
fixed 0.95 rate, no voice picker, no auto-advance — you tap it once per item
and it reads that one thing (`speak()` in `06_app.jsx`). Two asks here: make
that existing TTS more capable (done — see below), and build an entirely new
mode on top of it for studying hands-free — the driving use case
specifically (still open).

- [x] **TTS revamp.** Shipped as a new "Voice & speech" section in the
  Data & Progress panel (`DataPanel` in 04_shared_ui.jsx): a rate slider
  (0.6×–1.4×, step 0.05) and a voice `<select>` populated from
  `speechSynthesis.getVoices()` (English voices sorted first, since all
  of this app's content is English, but every installed voice stays
  selectable), plus a "Test voice" button that speaks a sample sentence
  with the current settings so you can preview before committing. Both
  persist via a new `useTtsPrefs()` hook (00_preamble.js) — same
  per-device-only localStorage pattern as `useTheme`, keyed by
  `voiceURI` rather than name/index since a browser's voice list can
  reorder between sessions. `speak()` (06_app.jsx) now reads the saved
  rate/voice on every call instead of a hardcoded 0.95, so the existing
  per-item Listen button picks up the new settings everywhere it's used —
  no changes needed to `SpeakButton` or any of its call sites (flashcards,
  lesson vocab/fundamentals, etc.), since `speak()` is a single shared
  function. Voice loading handles the well-known async-population quirk
  (`getVoices()` often returns empty on the very first call in Chrome
  until a `voiceschanged` event fires) by listening for that event as
  well as calling it eagerly on mount.
- [x] **Verbal Quiz mode — hands-free, distraction-free studying (e.g.
  while driving).** Shipped as a third Quiz sub-tab ("Verbal", alongside
  Questions/Match) with its own state machine, deliberately separate from
  the tap-to-answer quiz's `sessionScore`/`sessionAnswers` since there's
  no captured answer to track here. A dedicated driver `useEffect`
  (06_app.jsx, keyed on `[verbalPhase, verbalIndex, verbalStep]`) chains
  question → [options, mc only] → thinking pause → answer → explanation →
  next question, via each utterance's `onend` (or a `setTimeout` for the
  thinking pause), reusing the same `pickRotated`/`pickInterleaved`
  selection logic and category filter as the regular quiz. A start screen
  offers length (5/10/15/25) and thinking-pause duration (4/6/8/10/15s);
  a single large Pause/Play + Skip control pair handles the rare
  in-session glance. Pause/Resume deliberately re-reads the current line
  from the top on resume rather than trying to resume
  `speechSynthesis` mid-utterance (unreliable cross-browser) — the
  effect's own cleanup cancels speech/clears the pause timer the instant
  `verbalPhase` leaves `'active'`, and simply re-runs the same step when
  it returns. No mastery/SRS/results update happens from this mode — the
  setup screen says so plainly — and multi-select (`ms`) questions are
  excluded from its pool entirely (there's nothing to "select" without a
  mic), per the option below.
  - **Screen Wake Lock** (`navigator.wakeLock`, feature-detected)
    requested while a session is actively playing and released on
    pause/complete/navigate-away/unmount — keeps the screen from
    auto-locking mid-session, which is the actual mechanism available to
    a web app here (there's no way to keep audio playing *through* a
    real hard lock or a backgrounded tab, so the setup screen says so
    plainly rather than overpromising background playback).
  - Leaving the Verbal tab, switching mode, or switching tracks
    mid-session stops the speech and resets back to its own setup screen
    (a small effect keyed on `[mode, quizView, activeTrack]`) rather than
    letting it keep talking in the background.

---

Not in scope / deliberately not doing: crowd-sourced/disputed answer voting
(ExamTopics' model — a correctness liability, and this app's answers are
already reviewed, not crowd-sourced); official vendor endorsement partnerships
(MeasureUp's model — not applicable to an independent project); accounts,
social features, or leaderboards (this app is intentionally accountless and
fully static, per README's "How progress is saved").
