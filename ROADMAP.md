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

- [x] "On the job" callouts inside lessons — real-world notes that go beyond
  what's tested. Shipped as a new optional `onTheJob` field per lesson,
  rendered as a teal-accented "On the job" block in `LessonDetail`
  (04_shared_ui.jsx) right after "Common exam traps" — visually distinct
  from the gold "Worked scenario" and red "Common exam traps" blocks it
  sits alongside. Every one of the app's 85 lessons across all 15 tracks
  now has one (5 background agents wrote them, ~3 sentences each, grounded
  in that lesson's own reading/commonTraps content and its track's real
  practitioner domain — a hospital IT department's HIPAA-adjacent PHI
  access/ticketing/on-call realities for EHR Integration specifically, per
  this item's own original framing, and the equivalent domain reality for
  every other track: a sysadmin's patch-Tuesday reality for AZ-802, a SOC
  analyst's alert fatigue for SC-200, an architect's design-review politics
  for AZ-305, and so on). `build.py` validates the field is non-empty
  when present.
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
- [x] Inline "why this is tested" notes on trickier questions, distinct from
  the existing answer explanation. Shipped as an optional `whyTested`
  field per question, rendered as a small teal "Why this is tested" note
  wherever the question's `explanation` already shows — the live
  `QuestionView` (quiz, exam, and the Daily Question card, which reuses
  it), `QuizSummary`'s "Worth another look" missed-question review, and
  `ExamResults`' review list — always alongside the explanation, never
  replacing it (06_app.jsx threads `whyTested` through the three places
  session/exam review items get built, so it survives from the live
  question into every results screen). Deliberately NOT on every
  question — 66 of the 1263 were picked (4-6 per track, the genuinely
  trickiest: multi-concept traps, scenario questions with subtly-wrong
  distractors, commonly-confused distinctions), each explaining the
  meta-level reason an exam probes that exact distinction rather than
  restating why the correct answer is correct.

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
- [x] Scenario-based "mini case studies" that chain several related
  questions off one larger setup, mirroring how AZ-305's real exam works.
  Shipped as a new optional `CASE_STUDIES` list per track (data/&lt;track&gt;.py),
  each entry a `{id, cat, title, scenario, questions}` dict whose `questions`
  reuse the exact same mc/tf/ms shape as `QUESTIONS` — deliberately not a
  new question format, since `QuestionView` (04d_quiz_ui.jsx) already
  renders all three types; only the shared scenario paragraph and the
  grouping of several questions under it are new. New "Case Study" Quiz
  sub-tab (only shown for tracks that ship one), with its own picker
  screen (`CaseStudySetup`) since which case study is a real choice, not
  something to shuffle into blindly the way Mad Libs/Sequence do —
  `CaseStudyView` then shows the scenario pinned above the current
  question and reuses `QuestionView` unchanged, with `QuizSummary` reused
  for the completion screen (`QuizSummary` gained an optional
  `restartLabel` prop so it can say "Back to case studies" here instead of
  "New quiz"). Unlike Mad Libs/Sequence (scored all-or-nothing per
  scenario), each embedded question is scored individually via the same
  `recordResult` call a regular quiz question uses — matching how a real
  case study's questions are graded independently — and folds into
  mastery the same way (`trackMastery` in 03_helpers.js and
  `masteryByCategory` in 06_app.jsx both flatten every case study's
  question ids into their existing id lists). `build.py` validates the
  new list the same way it validates MADLIBS/SEQUENCES: unique ids, a
  real category, non-empty title/scenario, and every embedded question
  checked against the same per-type rules QUESTIONS entries already get.
  Piloted on AZ-305 by hand (2 case studies, matching this item's own
  "mirrors AZ-305's real exam" framing), then rolled out to the other 14
  tracks via 5 parallel background agents (each writing case studies +
  additional Mad Libs scenarios for its assigned tracks against the
  AZ-305 example, self-verifying with `build.py`). All 15 tracks now ship
  `CASE_STUDIES` — 18 case studies total (71 embedded questions), and
  Mad Libs grew from 49 to 79 scenarios in the same pass (see section 13).
  Initially shipped verified only by `build.py`'s structural validation
  (this session's outbound network briefly blocked the CDN this app loads
  React/Babel from at runtime, so no browser was reachable at the time) —
  confirmed afterward with a real Playwright pass once a local mirror of
  the CDN scripts unblocked testing: the full `full_smoke.js` regression
  suite passes clean, a full picker→scenario→4-question→results→back
  walkthrough on AZ-305 works end to end, and a spot-check across 7 more
  tracks (ITIL, AZ-104, SC-300, Cloud+, EHR Integration, DP-900, AZ-802)
  confirms both Mad Libs and Case Study render and open correctly with
  zero real console errors.

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
  - Refreshed later once enough had shipped to make the "what's new"
    list stale: replaced the oldest entries (routing, ITIL/Cloud+ course
    mode, SRS rating — all now baseline features, not "new") with the
    Home/cert-path redesign, mini case studies, the Mad Libs/flashcard
    expansion, on-the-job/why-tested callouts, and the smarter TTS voice
    picker — keeping the list a recent-highlights reel rather than an
    ever-growing one. The Disclaimer's trademark list also picked up two
    real gaps found on review: Microsoft Copilot (AB-650 covers M365
    Copilot administration) and HL7/FHIR (both are trademarks of HL7
    International, and the EHR Integration track is built entirely
    around them) — neither had been named despite both tracks existing
    for a while.
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
- [x] Milestone badges — 17 achievements (mastery, streaks, quiz/exam/match/
  case-study counts, course completion) opened from a 🏆 header button, with
  a toast on unlock. Once earned, an achievement stays shown as earned even
  if the live condition later goes false (e.g. a new track diluting an
  all-tracks mastery check) — see src/js/03_helpers.js's evaluateAchievements().
- [x] **Case Cracked / Case Veteran added, plus a real scoring bug fixed,
  once mini case studies (section 4) and the Mad Libs/Sequence expansion
  landed.** Two new achievements track `stats.counts.caseStudiesCompleted`
  (incremented in `advanceCaseStudy`, 06_app.jsx, the same pattern as
  `matchRoundsCompleted`): finish 1 case study, finish 10. Along the way,
  found and fixed a real inconsistency: `buildAchievementContext`'s
  `totalCorrect` (what "First Steps"/"Quick Learner"/"Century Club"/"Half
  Grand" count) only ever summed flashcard + question ids — Mad Libs,
  Sequence, and case-study answers already fed `trackMastery` everywhere
  else in the app, but never counted toward these achievements. Someone
  studying mostly through case studies or Mad Libs would answer plenty of
  questions correctly and never see these achievements move. Fixed by
  folding in the exact same id set `trackMastery` already uses. Verified
  live (not just read the code): completing one AZ-305 case study took the
  unlocked count from 0/17 to 2/17 in a real browser session.
- No leaderboards or social features — those need accounts/a backend, which
  is a deliberate trade-off this app has made for staying fully static.

## 9. Exam realism (from research)

- [x] A stricter "final mock" variant of Exam mode: no mid-exam retries, only
  reviewable at the very end, closer to the real proctored experience than
  the current Exam mode already is. Shipped as a second start button on
  the Exam tab ("Start Final Mock", under a gold rules card). Same
  question pool, length, and clock as the practice exam, but each answer
  locks the moment you advance ("Lock in & next" — no Previous button and
  it stays disabled until you've answered), there's no early submit, the
  running answered-count is hidden, and the result is a straight PASS/FAIL
  at the real pass mark plus a per-area score report (correct/total and %
  per category, colored against the pass mark) the way a real Microsoft/
  CompTIA score report breaks it down. Passing one unlocks the "Dress
  Rehearsal" achievement (`finalMocksPassed` in stats.counts). The
  practice exam is unchanged. See `startExam(variant)` in 06_app.jsx and
  ExamIntro/ExamResults in 05_final_exam_ui.jsx.
- [~] **Decided against: a separate "stretch" question pool.** Dropped in
  favor of raising difficulty in the main bank itself (the question-
  hardening pass in section 10.5), so there's one pool that's already at
  real-exam difficulty rather than a second, deliberately harder tier.

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
- [x] **Balancing track depth toward AZ-900's bar (user's idea).** The user
  judged AZ-900 "nearly complete" and asked that the other tracks be
  brought up to roughly its depth, slimmest first. Measuring flashcard +
  question count per track (the clearest, most comparable depth signal —
  lesson prose, onTheJob coverage, Mad Libs, and case studies were
  already roughly even across all 15 by this point) found AZ-900 a real
  outlier at 185 combined (66 flashcards, 119 questions) against a pack
  mostly in the 115-155 range. Round 1 targeted the 5 tracks furthest
  below the pack: DP-900 (114), DP-300 (115), SC-300 (122), SC-200 (124),
  AZ-305 (128) — one background agent per track, each adding ~15
  flashcards and ~17 questions weighted toward its thinnest exam-weighted
  categories, finding real gaps by cross-referencing existing content
  against each track's own LESSONS/CHEAT_SHEET text and Microsoft's
  official skills-measured objectives (not padding with filler), and
  held to the same anti-wording-giveaway bar as the audit above. Grew
  the overall question bank from 1263 to 1348 and flashcards from 814 to
  889. All 5 targets now land in the 146-160 range, solidly mid-pack
  instead of the bottom; the new lowest tier (AZ-802 135, EHR Integration
  138, Cloud+ 139, AB-650/SC-500 142 each) is the natural target for a
  round 2. AZ-900 itself stays the named bar to aim toward, not something
  to exactly match number-for-number — its 3-broad-category shape doesn't
  translate cleanly to tracks with 5-7 narrower categories.
  - **Round 2**, same recipe, one agent per track on AZ-802, EHR
    Integration, Cloud+, AB-650, and SC-500 (the round-1 leftovers).
    Flashcards 889 → 964, questions 1348 → 1433. All 5 now land at
    167-174 combined — ahead of the rest of the pack and closing in on
    AZ-900's 185. New lowest tier for a round 3: MD-102 (143), AZ-140
    (144), DP-900 (146), DP-300 (147), AZ-104 (151) — note DP-900/DP-300
    already got a round-1 pass and still rank low, since round 1's goal
    was closing the worst gaps, not full parity in one pass; a track can
    legitimately need more than one round.
  - **Round 3**: MD-102, AZ-140, AZ-104, plus a *second* pass each for
    DP-900 and DP-300 — each of those two agents was explicitly told what
    round 1 already added (by exact topic) so round 3's gaps didn't
    overlap it. Flashcards 964 → 1039, questions 1433 → 1518. Results:
    MD-102 175, AZ-140 176, DP-900 178, DP-300 179, AZ-104 183 combined —
    AZ-104 is now within 2 of AZ-900's 185, and every round-3 target
    cleared the entire round-1/round-2 pack. New lowest tier for a round
    4: SC-300 (154), ITIL (155), SC-200 (156), AZ-305 (160), AZ-802
    (167) — all from round 1 or earlier, confirming a single pass isn't
    always enough and this really is iterative, ongoing work rather than
    a fixed list to clear once.
  - **Round 4**: a *second* pass each for SC-300, SC-200, AZ-305, and
    AZ-802, plus ITIL's first pass (it had been untouched by this
    effort). Each repeat-track agent was told exactly what the earlier
    round already covered by topic to avoid overlap. Flashcards 1039 →
    1114, questions 1518 → 1603. Results: SC-300 186, ITIL 187, SC-200
    188, AZ-305 192, AZ-802 199 combined — all five now clear AZ-900's
    185 bar outright. New lowest tier for a round 5: EHR Integration
    (170), Cloud+ (171), AB-650/SC-500 (174 each), MD-102 (175) — the
    round-2/round-3 leftovers, each due for a second pass.
  - **Round 5**: a second pass each for EHR Integration, Cloud+,
    AB-650, SC-500, and MD-102. Flashcards 1114 → 1189, questions 1603
    → 1688. Results: EHR Integration 202, Cloud+ 203, AB-650 206,
    SC-500 206, MD-102 207 combined — every one of these previously-slim
    tracks now exceeds AZ-900's own 185. With this round done, all 15
    tracks sit in a tight 176-207 combined band (AZ-104 183, AZ-140 176,
    DP-900 178, DP-300 179 are the only four still under the 185 bar,
    each already on its second or third pass) — the depth gap that
    motivated this effort is now closed in practice, though AZ-140/
    DP-900/DP-300/AZ-104 remain the natural next targets if further
    rounds continue.
- [x] **Question-difficulty hardening pass (user's request: "make questions
  more difficult across all paths").** The audit above fixed *wording
  giveaways*; this pass raised the *difficulty itself*, because too many
  questions were definition recall ("What is X?") or restated-definition
  true/false that the real exams almost never ask. Each track's questions
  were classified as recall, trivial TF, weak distractors, or already
  scenario-based, and the first three rewritten **in place** (same `id`
  and `cat`, so saved progress carries over; type changed only where it
  made a better question) into short workplace scenarios with a hard
  constraint, a near-miss distractor from the same concept family, and an
  explanation that says why each wrong option is less fitting. TF items
  now encode one specific misconception, kept roughly balanced between
  True and False. Done for all 15 tracks, from roughly 60% rewritten
  (AZ-900, AZ-104) to nearly all (DP-300, MD-102, EHR Integration), and
  every track gained 10-12 **Compare** items (section 13). The app
  shuffles mc/ms options at render time, so text like "the last option" or
  "option B" names the wrong answer on screen — `build.py` now rejects any
  stem, option, explanation, or Compare text that refers to an option by
  position (it caught 21 existing instances). Agents were told to flag,
  not edit, factual doubts outside the questions; ~70 were reported, plus
  one structural problem (flashcard text garbled by pasted-in card
  titles, first seen in SC-500). All are queued for a verification pass
  rather than changed on an agent's recollection.
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
- [x] **Batch 5, plus two new cross-track initiatives, via 5 parallel
  background agents (all 15 tracks this round, not just the weakest
  few).** Grew flashcards from 764 to 814 (50 new cards), each one
  filling a real content gap (a term already tested in `QUESTIONS`/
  `CHEAT_SHEET`/a case study but never given its own flashcard) whose
  `back` text was written to naturally reference 1-2 other real,
  verbatim same-track flashcard fronts — every agent read that track's
  actual `FLASHCARDS` list first rather than inventing cross-references.
  Two things genuinely new this round, not just more of batch 1-4's
  recipe: **(a) cross-course concept callouts** — one sentence added to
  an existing lesson's `onTheJob` per track, naming a real sibling
  track and the specific concept they share (verified by grepping that
  other track's actual file before writing the sentence — e.g. AZ-104's
  `monitoring-recovery` lesson now names AZ-305's identical "Azure
  Monitor Metrics vs. Logs" tradeoff; SC-300 and SC-500 both test the
  same "Entitlement management: access packages" model and now say so).
  This is a different thing from the cross-reference flyouts above:
  those make a term tappable within one track's own content; this makes
  the student aware a concept they're studying here is the *same*
  mechanism another cert tests, not a coincidence of naming.
  **(b) Deeper learning** — 2 lessons per track (30 total) got one more
  `onTheJob` sentence of genuine real-world nuance (an edge case, a
  common misconfiguration) that wasn't already covered, not filler
  restating the lesson body. Verified with a real Playwright pass
  (not just `build.py`): full `full_smoke.js` regression clean, and a
  direct in-page check of the live `DATA` object confirms the new
  Azure Key Vault flashcard's exact content and the AZ-104→AZ-305
  cross-course callout both render correctly.

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
  pass. Revisit when an actual second client shows up — most likely a
  Capacitor/native wrapper if this ever heads toward app-store
  distribution (a real but not-currently-prioritized goal), since that's
  the point a second consumer of this code would actually exist.
- [x] **Lighter file-organization cleanup (not the full module rework
  above).** `04_shared_ui.jsx` had grown into a 3065-line grab-bag —
  Home/cert-path widgets, overlay panels, lesson/study views, and every
  quiz/game mode all in one file — genuinely hard to navigate even though
  build.py's concatenation build doesn't require it to be one file. Split
  into four files by responsibility, kept inside the same numeric-prefix
  scheme so `build.py`'s `sorted(js_dir.glob("*.js*"))` concatenation
  order is unaffected (`04a_home_ui.jsx` &lt; `04b_panels_ui.jsx` &lt;
  `04c_lesson_ui.jsx` &lt; `04d_quiz_ui.jsx`, all still sorting between
  `03_helpers.js` and `05_final_exam_ui.jsx`): `04a_home_ui.jsx` (Home,
  `CertPathHomeSection`, `TrackListDropdown`, `TrackSwitcherSheet`,
  `CertPathPanel`, daily goal/question/vocab widgets, achievements,
  `DataPanel`), `04b_panels_ui.jsx` (About/Legal, Glossary, term flyout,
  category filter), `04c_lesson_ui.jsx` (flashcards, Study, cheat sheet,
  Match game, lesson/course views), `04d_quiz_ui.jsx` (quiz setup, Verbal
  Quiz, CLI practice, Mad Libs, Sequence, `QuestionView`/`QuizSummary`).
  Pure move — no logic changed — verified with a full rebuild
  (`python3 build.py`) and the full Playwright regression suite passing
  clean with zero errors. `06_app.jsx` (1845 lines) was evaluated too but
  deliberately left as one file: it's a single `CertStudyApp` root
  component whose ~35 `useState` hooks, ~25 effects, and mode-based JSX
  routing all close over the same state — splitting it would mean either
  extracting custom hooks (a real behavioral refactor, more than
  "reorganize for readability") or spreading one function's body across
  file boundaries with no actual decoupling benefit. Left for a future
  pass if it's ever worth lifting state into hooks on its own merits.

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
- [x] **DP-300, SC-300, and AZ-802 each got a first real screenshot** —
  the "still need their source repo / blocked on licensing" notes above
  are now resolved for those three: DP-300 from `MicrosoftDocs/sql-docs`
  (an Azure SQL Database compute-utilization chart), SC-300 from
  `entra-docs` (a PIM role-activation panel — see the comment above
  `pimActivateRole` in `02_portal_mockups.jsx` for how its MIT-only
  license was handled), and AZ-802 from the Windows Admin Center docs (a
  Failover Cluster Manager drain-roles view). They're one image each,
  though, so most categories in those tracks are still bare.
- [x] More quiz/exam questions built around each new screenshot, matching
  the existing pattern (`'image': '<key>'` on the question dict) — done
  for AZ-305: 10 new questions (2 per new diagram, `q38`–`q47`) spanning
  the `infrastructure`, `identityGovernance`, and `dataStorage`
  categories. AZ-900 (4) and AZ-104 (3) have a few too. MD-102, DP-300,
  SC-300, and AZ-802 have the Study-view placement but no screenshot-
  backed questions yet.
- [ ] **Queued next: bring real screenshots to every track with an admin
  portal.** Coverage today, by track (categories with a real image of
  their own / total): AZ-900 and AZ-104 every lesson; AZ-305 5 reference
  diagrams; MD-102 5/5; DP-300 1/6; AZ-802 1/7; SC-300 1/4; **none yet:**
  SC-200 (0/3), SC-500 (0/4), DP-900 (0/4), AZ-140 (0/4), AB-650 (0/3).
  ITIL, Cloud+, and EHR Integration have no vendor portal to screenshot
  (vendor-neutral by design) and stay out of scope. Order of work, each
  step following the same rules as everything above — verify the source
  repo exists and read its actual `LICENSE` file before reusing anything,
  only use images genuinely embedded in a live docs article, and ship
  each with alt text, a plain-language description, a source link, and
  attribution:
  1. **SC-200** (Sentinel / Defender XDR / KQL hunting) — largest
     all-zero gap on a heavily portal-based exam. Source repo(s) still
     to be found and license-checked (`azure-security-docs` was already
     ruled out for Defender for Cloud/Sentinel).
  2. **SC-500** — Defender for Cloud, Key Vault, Entra, and Azure AI
     security surfaces (`azure-security-docs` is confirmed CC BY 4.0 for
     Key Vault/HSM, and `entra-docs` is already in use for SC-300).
  3. **DP-900** — Cosmos DB, storage/Data Lake, Synapse, and Power BI
     surfaces.
  4. **AZ-140** — Azure Virtual Desktop host pools, app groups, and
     scaling plans.
  5. **AB-650** — Microsoft 365 admin center, Purview, and Copilot
     settings.
  6. **Fill the thin tracks:** DP-300 (5 more categories), AZ-802 (6
     more), SC-300 (3 more).
  7. **Screenshot-backed questions** (about 2 per image, the AZ-305
     pattern) for every screenshot above — the hardest class of
     question to write badly, since the answer has to be read off the
     image.
  Sequencing note: steps 1-7 all touch each track's `data/<track>.py`
  (a `screenshot` key on categories, `image` on questions), the same
  files the question-hardening pass rewrites, so the data edits wait
  until that pass is merged to avoid clobbering it. Image sourcing and
  registering new entries in `REAL_PORTAL_SCREENSHOTS` can start any time.

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
- [x] **"Choose the more correct answer."** A comparative-judgment mode:
  given a scenario, show two plausible-but-imperfect answers and ask which
  is *better*, with an explanation of what makes the runner-up fall short.
  This targets the "best answer, not just a correct one" reasoning real
  Microsoft/CompTIA exams lean on, which single-best-answer multiple
  choice doesn't quite exercise. Shipped as a **Compare** Quiz sub-tab
  for any track whose data module ships a `COMPARE` list: each entry is
  `{id, cat, scenario, optionA, optionB, better: 'A'|'B', why}`, validated
  by build.py (unique ids and scenario text, non-identical options,
  `better` in A/B, non-empty `why`). The app re-shuffles the displayed
  A/B order per session item so position never leaks the answer, shows
  BETTER / RUNNER-UP tags plus the `why` after a pick, and scores each
  item all-or-nothing through recordResult — so it folds into mastery,
  results, and achievements exactly like Mad Libs and Sequence (10 right
  picks across any tracks unlocks "Fine Print"). AZ-900 was seeded first;
  the question-hardening pass (section 10.5) extends it to every track.
  See CompareView in 04d_quiz_ui.jsx and the `cmp*` state in 06_app.jsx.
- [x] **Scenario Mad Libs.** Shipped as a "Mad Libs" Quiz sub-tab (only
  shown for tracks with `MADLIBS` content — now all 15 tracks, 3-4
  scenarios each, 49 total; started with AZ-900/AZ-104/ITIL/Cloud+ and
  later expanded to the remaining 11 in the same content-quality pass
  as the question-bank audit below). Grown again later (see section 4's
  mini-case-studies entry) to 79 scenarios total (5-7 per track, up to 7
  on Cloud+/EHR Integration), added by the same 5 background agents that
  wrote the case study rollout, in the same pass, against the existing
  entries' own tone/depth as the style reference. A short real-world scenario
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
- [~] **Decided against: retrieval-practice "blurting" and a "teach it
  back" mode.** Both were self-graded active-recall steps layered onto
  flashcards (recall before flip; free-text explanation before the
  official one). Dropped by the user — the existing confidence-rated
  flashcards, SRS ordering, and the Quiz modes already cover active recall
  well enough that these weren't worth the extra UI.
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

- [x] **Navigation declutter + a guided study path (user's request — the
  app "was starting to feel cluttered").** Shipped in two linked pieces;
  the path is also the main way the clutter was reduced, since most people
  shouldn't have to choose among 8 quiz tools at all.

  **A. Navigation.** The Learn/Quiz/Exam tab bar became four tabs —
  **Path** (the guided default), **Practice**, **Reference**, **Exam** —
  and the 8-button Quiz sub-tab row (where "Case Study" already wrapped at
  390px) became one grouped dropdown, `PracticeToolPicker`: Test yourself
  (Questions, Compare, Case Study), Games & drills (Mad Libs, Sequence,
  Match, Commands), Hands-free (Verbal), listing only tools the track
  supports, each with a one-line description. Reference holds Cards /
  Study / Sheet. URLs became `/path`, `/practice/...`, `/reference/...`
  (`routeToHash`/`parseHash`), with the old `/learn` and `/quiz` segments
  still accepted so bookmarks keep working. The Questions screen's length
  and question-type controls fold into one "Options" summary row (the
  first question now sits on the first screen instead of below the fold),
  and long exam review lists show five at a time with "Show all N".
  Internally the modes are still `'learn'`/`'quiz'` so every session effect
  that keys off them is untouched; only labels and URLs changed.

  **B. The Path.** A vertical, winding trail of nodes grouped into one unit
  per lesson, walking through the track in a mixed order (not a revival
  of the removed multi-cert Learning Paths in section 1 — that sequenced
  *several tracks*; this sequences the content *inside one*). Built
  entirely from existing data, no new authoring: `buildPathUnits` takes
  each lesson's `vocabIds`/`quizIds`, then hands every other flashcard,
  question, Mad Lib, sequence, and Compare item in the same categories to
  exactly one unit round-robin, so 100% of questions in all 15 tracks are
  reachable from the path (76-100% of flashcards; the rest are capped out
  of the "more flashcards" step and still reachable in Practice). A unit's
  step order rotates through three variants — read, cards, quick check,
  game, apply-it, more cards, practice quiz, checkpoint — so consecutive
  units differ. Steps reuse existing views (reading with tappable terms,
  `FlashcardView`, `QuestionView`, `MatchGame`, `MadLibsView`,
  `SequenceView`, `CompareView`, and a `LessonApplySections` component
  extracted from `LessonDetail` so Reference and the path render the
  apply-it content identically) and record through the same handlers
  Practice uses, so mastery, spaced repetition, streaks, the daily goal,
  and achievements need no path-specific scoring. Everything is visible,
  nothing locked: "Continue" opens the first unfinished step, the current
  unit is open and finished ones fold away. Quiz steps need 70%
  (`PATH_PASS_PCT`), a miss shows explanations and offers a fresh draw;
  the checkpoint mixes the unit with up to three missed questions from
  earlier units; **test-out** (10 questions at 80%) marks a whole unit
  done, tagged `via: 'testout'` and never overwriting an earlier honest
  score; and a **Review weak spots** card pulls the longest-neglected
  missed questions from started units — from the path and Practice alike —
  without ever completing a step. State is `stats.path[track].done`
  (normalized on load, persisted and cloud-synced like the rest).
  Verified by driving a full unit end to end in a real browser (all 8
  steps, a deliberate quiz failure and retry, the Match step, test-out,
  the review card, persistence, and the achievements it unlocks) plus an
  audit that every track yields complete, reference-valid units.

  **Not done / known rough edges.** The Home screen's resume button
  returns to the last mode but doesn't deep-link to the next path step.
  The path covers lessons only, so Case Studies, CLI Commands, and Verbal
  stay Practice-only. Header subtitles on 320-360px phones still wrap
  (deliberately left, flagged earlier in this section). Reloading any
  deep link lands on Home rather than the linked view — that predates
  this work (confirmed on the previous build): the first-render hash
  writer overwrites the incoming hash before the route is applied.

- [ ] **Queued: a "tough terms" flashcard deck (user's request).** Track how
  each flashcard was last rated (the 1-5 confidence rating already feeds
  `srs` and `results`) and offer a deck built from every card currently
  rated 3 ("OK") or below, so the learner can go back through just the
  terms they find hard. Open design points to settle when building it:
  a per-track deck on the Reference > Cards screen (and a card on the
  Path map next to "Review weak spots"); cards leave the deck once they
  are later rated 4 or 5; the last rating per card needs storing, since
  `srs` keeps the schedule (interval, ease, reps) rather than the rating
  itself, and `results` only keeps correct/incorrect.
- [ ] **Queued: finish the question-hardening pass.** SC-200, SC-500,
  DP-300, Cloud+, and EHR Integration are not done — their agents were cut
  off by a session rate limit before finishing and nothing was saved, so
  they need relaunching. The other ten tracks are merged.

## 15. Content ideas beyond quiz questions

- [~] **Decided against: a personal mnemonic bank** (a user's own note
  attached to any term) **and milestone "boss battle" sessions** (a harder
  themed session unlocked at a mastery threshold). Both dropped by the
  user; nothing open in this section.

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
- [x] **Follow-up: smoother playback without adding a cloud TTS dependency.**
  User feedback: the existing TTS didn't sound smooth enough. The app only
  ever calls the browser's own `speechSynthesis` — there's no separate
  "TTS agent" to swap — so a real quality jump (ElevenLabs/OpenAI/Azure/
  Google neural voices) would mean a bring-your-own-API-key, per-character-
  cost, online-only dependency, which breaks the fully-static/free/
  offline-capable design this app has held to throughout. Shipped the
  free, architecture-preserving half instead:
  - **Voice quality heuristic** (`voiceQualityScore`/`bestVoiceForLang` in
    03_helpers.js): every OS/browser that ships a nicer neural voice
    alongside its older default flags it in the name somehow ("Natural",
    "Online", "Neural", "Premium", "Enhanced", "Wavenet", "Studio" — Edge,
    Chrome, and Android all use one), and a non-`localService` voice is
    usually cloud-model-backed rather than the OS's older on-device
    engine — both decent proxies for "will sound smoother" without ever
    being able to actually hear a voice first. `speak()` (06_app.jsx) now
    auto-picks the best-scoring English voice when the user hasn't chosen
    one explicitly, instead of leaving `utter.voice` unset (which just
    handed the choice to the browser's own arbitrary "default," often
    its oldest, lowest-quality installed voice). The Data & Progress
    voice picker sorts by the same score within each language (better
    voices surface first instead of alphabetical) and marks whichever
    voice the auto-pick would resolve to as "— recommended."
  - **Sentence-chunked chained utterances** (`splitIntoSpeechChunks`):
    `speak()` now splits text on sentence boundaries and speaks each as
    its own utterance, chained via `onend`, rather than handing a whole
    paragraph over as one long unbroken utterance — several engines
    sound noticeably flatter/more monotone on a long run-on utterance
    (no prosody reset between sentences) than the same text as several
    shorter ones back to back, and very long text can hit a hard length
    cutoff on some engines. A generation counter (`speakGenerationRef`)
    guards every chained step, so a cancel from anywhere — toggling the
    same Listen button off, switching tracks, unmounting — reliably
    stops the whole chain even on browsers that fire `onend` rather than
    `onerror` for an interrupted utterance (verified directly: a naive
    version of this chain would otherwise let a stale utterance's onend
    keep the old chain going after a supposedly-cancelling click).
- [x] **All 15 tracks now have full course/LESSONS mode** (previously only
  AZ-900, AZ-104, ITIL, and Cloud+ did). Six background agents added
  `LESSONS` to the remaining 11 tracks in pairs (DP-900+DP-300,
  SC-300+SC-200, AZ-305+AZ-802, AB-650+AZ-140, MD-102+SC-500) plus
  EHR Integration solo — each track's lessons cover every one of its
  categories (high-weight categories split across two lessons where it
  made sense), reusing existing `LESSON_DIAGRAMS` keys only (many lessons
  ended up `diagram: None` rather than force a misleading reuse —
  honest absence over a wrong diagram, especially for AZ-802's on-prem
  Windows Server content and EHR Integration's HL7/FHIR content, neither
  of which has an Azure/ITIL-flavored diagram that actually fits).
  - Along the way, MD-102 gaining `LESSONS` exposed a real regression:
    its 5 category-level real portal screenshots (`CATEGORIES[].screenshot`
    → `CategoryScreenshot`) were previously only rendered by the flat
    `StudyView`, and `06_app.jsx` switches a track to `CourseView`
    unconditionally once it has `lessons`, so those screenshots became
    unreachable. Fixed generally in `LessonDetail` (`04_shared_ui.jsx`):
    when a lesson maps to exactly one category, has no `portalMockup` of
    its own, and that category has a `screenshot`, it now renders that
    category's real screenshot as a "Portal screenshot" block — so any
    future track that gains course mode while already having
    category-level screenshots stays covered without a data change.
- [x] **Every lesson across those same 9 tracks now has its own diagram too**
  — the 31 lessons that shipped with `diagram: None` (honest absence over a
  misleading reuse) all got a genuine new SVG built from that lesson's
  actual reading text: an HL7v2 message anatomy and ORM/ORU/ACK flow, a
  FHIR REST interaction and SMART-on-FHIR launch flow, an integration-engine
  hub-and-spoke with a dead-letter branch, a master-patient-index matching
  diagram (EHR Integration); an OLTP-vs-OLAP table, a star schema, Fabric
  OneLake, a SQL diagnostics pipeline, Elastic Jobs architecture
  (DP-900/DP-300); a messaging-services comparison (AZ-305); GPO
  precedence, a failover cluster, DFS namespace, Credential Guard
  isolation, a monitoring pipeline (AZ-802); host-pool fan-out and an
  FSLogix attach flow (AZ-140); an agent-identity/blast-radius diagram, a
  Defender-for-Cloud/Sentinel pipeline, a Purview protection flow, Copilot
  licensing/grounding, DSPM agent governance (SC-500/AB-650); an
  auth-methods bootstrap ladder, a workload-identity landscape, a Sentinel
  data flow, an XDR correlation fan-in, an endpoint response flow, a CASB
  session-control flow, and a KQL join comparison (SC-300/SC-200). Five
  parallel worktree agents did this, each also given a bounded,
  best-effort shot at sourcing a *real* portal screenshot.
  - `learn.microsoft.com` is blocked by this session's own egress policy
    (confirmed via both `curl` and `WebFetch` — an explicit policy denial,
    not a transient failure), so real screenshots had to come from the
    public GitHub repos Microsoft authors its docs in instead
    (`raw.githubusercontent.com`/`git clone` are both reachable). No GitHub
    code-search API is available in this session (repo access is scoped to
    attached repos only), so finding the *right* repo per product was
    blind name-guessing — confirmed working: `MicrosoftDocs/azure-docs`,
    `MicrosoftDocs/memdocs`, `MicrosoftDocs/entra-docs`,
    `MicrosoftDocs/windowsserverdocs`, `MicrosoftDocs/microsoft-365-docs`
    (branch `public`/`master`, not `main`), `MicrosoftDocs/sql-docs`
    (branch `live`); confirmed nonexistent after real attempts: dedicated
    repos for Cosmos DB, Azure Virtual Desktop, Sentinel, or
    Defender-for-Cloud.
  - Three real screenshots landed this way, each with a `sourceUrl`
    pointing at the actual GitHub blob (not a guessed
    `learn.microsoft.com` URL this session can't verify is still live):
    DP-300's `sqlComputeUtilization` (an Azure SQL Database Overview
    page's compute-utilization chart, from `MicrosoftDocs/sql-docs`),
    AZ-802's `failoverClusterDrainRoles` (a real Failover Cluster Manager
    "Pause → Drain Roles" screenshot, from
    `MicrosoftDocs/windowsserverdocs`), and SC-300's `pimActivateRole` (a
    real Microsoft Entra admin center PIM role-activation panel, from
    `MicrosoftDocs/entra-docs`). Wired via the same category-screenshot
    fallback above — no fabricated or placeholder images were added
    anywhere; a track with no confirmed real repo (DP-900, AZ-140,
    SC-200, SC-500, AB-650, EHR Integration) simply stayed diagram-only.
  - AZ-802's real screenshot exposed a second, narrower bug in that same
    fallback: its `hybrid-management-clustering-virtualization` lesson
    pulls vocabulary from *two* categories (`hybridWorkloads` and
    `vmContainers`), so the original "lesson maps to exactly one
    category" check silently skipped it even though `hybridWorkloads`
    carries a real screenshot. `LessonDetail`'s check now resolves
    whenever exactly one of a lesson's categories carries a screenshot,
    regardless of how many categories the lesson spans — still refusing
    to guess when two categories both have one.

- [x] **Navigation rework: header track switcher + Home as the consolidated
  cert-path view.** User feedback: switching tracks felt clunky (the only
  way was a tiny ☰ icon back to Home, then scroll past the daily-goal ring,
  readiness card, and both daily-challenge cards to reach the track list —
  four-plus taps), and "My Cert Path" was just a teaser card on Home that
  opened a separate modal rather than actually living there.
  - **Home now leads with the user's own cert path, not a link to it.**
    `CertPathHomeSection` (04_shared_ui.jsx) replaces the old one-line
    teaser: the first not-completed path entry gets the full "up next"
    hero (mastery, readiness, scheduled date, tap to study), every entry
    after it is a compact numbered row with the same tap-to-study action,
    and a "Manage path ›" link opens the existing `CertPathPanel` for
    reordering/scheduling/adding/removing — that editor wasn't rebuilt,
    just relocated behind an explicit action instead of being the only
    way to see your path at all. The old standalone readiness card is
    only shown when there's no path (it'd otherwise repeat the hero's own
    readiness line for the same focus track).
  - **Empty path (new user) shows the full track browser immediately**,
    expanded by default, right after the daily-goal ring — not buried
    below Question/Vocab of the Day like the old collapsed dropdown was.
    Each row gets a small "+" (`onAddToPath`, wired to the existing
    `addToCertPath`) to add it to the path without leaving Home or
    opening the manage panel; tapping the row itself still navigates
    straight to studying it, unchanged. Once the path has at least one
    entry, this same list becomes a collapsed "Browse all tracks" section
    below the path (for adding more or one-off browsing), consistent
    with the "path first, browsing second" hierarchy once one exists.
  - **New header track switcher** (`TrackSwitcherSheet`): the track
    name in the header (Learn/Quiz/Exam, not Home) is now a button —
    tapping it opens a bottom sheet listing "Your cert path" (numbered,
    matching Home's order) then "All other tracks" below, with the
    current track highlighted. Picking one always lands on Learn for
    that track (`switchTrack` in 06_app.jsx) rather than trying to
    preserve Quiz/Exam mode across the swap — session state
    (question index, score, etc.) isn't set up to survive an
    `activeTrack` change mid-session, and Learn is a safe landing spot
    for any track, so this sidesteps that risk entirely rather than
    auditing every quiz/exam state path for it. Cuts a track switch
    from "four-plus taps via Home" to two taps from anywhere.
  - `activeCertOrder(tracks, certPlan)` (03_helpers.js) is the one shared
    "user's active path, in order, as track objects" helper both the new
    Home section and the switcher read from, so they can't disagree with
    each other about what's on the path.
  - `full_smoke.js` (the standing regression suite) updated: the "All
    tracks" dropdown now defaults open when the path is empty, so the
    smoke test's toggle-click would've closed it instead of opening it;
    added an `ensureTrackListOpen` helper plus new sections covering the
    header switcher and the inline path section.
- [x] **Follow-up: header corner cleanup — hamburger opens Manage Path,
  a dedicated Home icon sits next to it.** The ☰ icon used to just be a
  "go to Home" shortcut (only shown once you'd left Home), and "Manage
  path" only existed as a text link inside Home's `CertPathHomeSection`
  — two different corners doing two different jobs. Now the corner is
  consistent everywhere: ☰ (titled "Manage cert path") always opens
  `CertPathPanel` directly, in every mode including Home itself, since
  editing your path is just as relevant from Home as from a track; a new
  house icon (`IconHome`, added alongside the other Feather-style icons
  in 00_preamble.js) sits next to it and only shows when you're not
  already on Home, doing exactly what ☰ used to do. `CertPathHomeSection`
  no longer needs its own "Manage path ›" link or an `onOpenCertPath`
  prop threaded through `HomeView` — removed both now that there's a
  single, always-available entry point. `full_smoke.js` extended to
  cover the hamburger opening the panel from both Learn and Home.

---

Not in scope / deliberately not doing: crowd-sourced/disputed answer voting
(ExamTopics' model — a correctness liability, and this app's answers are
already reviewed, not crowd-sourced); official vendor endorsement partnerships
(MeasureUp's model — not applicable to an independent project); accounts,
social features, or leaderboards (this app is intentionally accountless and
fully static, per README's "How progress is saved").
