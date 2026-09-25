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
  clunky for a static site with no real routing, so the app now restores
  the last track+mode you were actually using on every load (a first-time
  visitor with no history yet gets AZ-900 → Learn → Study) — no more
  `view` state in `06_app.jsx`. Overall progress, streak, and a "continue
  where you left off" shortcut (for jumping back after browsing other
  tracks in the menu) moved into the new hamburger menu instead of a full
  page.
- [x] A side/hamburger **menu** for track navigation (☰, `IconMenu` in
  src/js/00_preamble.js) — opens `TrackMenuPanel` (04_shared_ui.jsx),
  which shows overall average mastery + streak, an optional "continue
  where you left off" shortcut, and a flat list of all 15 tracks (each
  once, with its description and live mastery %) — no path-grouping, no
  separate dropdown. Achievements and Data & Progress stay as their own
  quick-access header buttons alongside the hamburger.
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
- [ ] DP-300 (Azure SQL/Cosmos DB), AZ-305 (architecture-center diagrams —
  `MicrosoftDocs/architecture-center` is confirmed CC BY 4.0, just not
  yet used), and SC-200 (Defender for Cloud/Sentinel) still need their
  actual source repo found (SC-200) or content mined from a repo already
  confirmed licensed (AZ-305). SC-300 stays blocked on `entra-docs`'
  licensing per above unless a different, properly CC-BY-licensed source
  turns up. Cloud+ has no real portal to screenshot anyway (vendor-neutral
  by design).
- [ ] More quiz/exam questions built around each new screenshot, matching
  the existing pattern (`'image': '<key>'` on the question dict,
  `hideDescription` so the caption doesn't give away the answer) — MD-102
  doesn't have any of these yet, only the Study-view placement above.

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
    screen (up to `ROUND_SIZE`, 6 by default, full-sentence definitions
    stacked), and the drag captures the pointer instead of allowing a
    normal touch-scroll — so without help, a term near the top literally
    can't be dragged onto a definition below the fold. Holding near the
    top/bottom edge now auto-scrolls the page (faster the closer to the
    edge), verified end-to-end with a short-viewport test that drags to
    the edge, holds, watches the page scroll, then re-measures the
    target's new position before completing the drop — a naive test (or
    a naive implementation) that computes the drop point once, before any
    scrolling, breaks the moment the auto-scroll it's supposed to be
    testing actually moves the target.
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

- [ ] **A daily goal ring.** A small, self-set "study N cards/questions
  today" target with a simple progress ring — the single highest-leverage
  Duolingo mechanic and one this app doesn't have yet, despite already
  having the streak infrastructure to hang it off of. Cheap to build
  (a number + a count against today's activity, both already tracked)
  and directly answers "why open this again today."
- [ ] **A cross-track "Today's Mix" review session.** Now that Learning
  Paths (track-ordering) is gone, there's no session that pulls from more
  than one track at once — real value for someone actively juggling
  several certs (the user's own AZ-900/AZ-104/MD-102/SC-300-style stack):
  a single session mixing each active track's SRS-due cards and missed
  questions. Not a revival of Learning Paths — no ordering/sequencing
  claim, just a review mixer across whatever's actually due.
- [ ] **An "exam readiness" signal per track.** A single blended indicator
  (recent quiz/exam accuracy + mastery % + how stale that mastery is)
  instead of a flat mastery percentage alone — Tutorials Dojo and
  Whizlabs both lean on this and it's a more honest answer to "am I
  actually ready" than a lifetime-ratio percentage that never decays.
  Ties into the missing "trend over time" item already in section 7.
- [ ] **Confidence-based self-rating for flashcards** (already listed in
  section 7, resurfaced here because it's the most direct fix for a real
  risk: streaks/badges can quietly reward speed-clicking through cards
  over actually retaining them). Rating 1–5 instead of binary correct/
  incorrect is more honest self-assessment and plugs straight into the
  existing SM-2-style interval math.
- [ ] **Retrieval-practice "blurting."** Before flipping a flashcard, ask
  the user to mentally (or literally, in a text box) recall the answer
  first — self-graded, no backend/grading needed, but the extra effortful
  step before reveal is a well-evidenced retention booster over passive
  flip-and-read.
- [ ] **A "teach it back" mode.** Free-text: explain a concept in your own
  words before seeing the official explanation (the protégé effect) —
  self-graded like blurting above, no AI grading required. Pairs well
  with the "on the job" real-world callouts already in section 2.
- [ ] **An explicit interleaved/mixed-category quiz option**, distinct
  from today's per-category or per-track quiz — pulling randomly across
  categories (or tracks, via Today's Mix above) on purpose. Blocked
  practice (all-one-topic-in-a-row, which is what "Quiz this section"
  gives you) feels more fluent while studying but interleaving is the
  more evidence-backed technique for actual exam-day transfer; worth
  offering both rather than only the easier-feeling one.
- [x] **Surface the SRS ordering, don't hide it.** Cards mode silently
  reordered by due-date with no explanation. Shipped a small "Cards you're
  overdue to review come first" caption above Cards mode, shown only once
  there's actual SRS history for that track (so a brand-new deck doesn't
  show a meaningless caption on cards that have never been rated).
- [ ] **Open design question, not a ticket yet: header density on small
  phones.** The header currently stacks a hamburger, track name/subtitle,
  mastery %, achievements, and settings into one row above the mode tabs.
  It held together in this session's testing, but it's worth a real
  on-device look (see LAUNCH_CHECKLIST.md's cross-device QA item) — if it
  feels cramped, moving the primary Learn/Quiz/Exam switch to a bottom
  tab bar (more thumb-reachable on a large phone) is worth considering
  before it's a launch-day scramble.

## 15. Content ideas beyond quiz questions

- [ ] **A personal mnemonic bank.** Let a user attach their own short
  note/mnemonic to any term (stored locally like everything else), which
  then resurfaces alongside that term's flashcard/flyout — a low-effort
  personalization layer that plain flashcards can't offer.
- [ ] **Milestone "boss battle" sessions.** Once a track crosses a mastery
  threshold, unlock a themed, harder mixed-mode session as a checkpoint —
  distinct from routine quizzes, gamifying the mastery threshold itself
  rather than just badge-collecting.

---

Not in scope / deliberately not doing: crowd-sourced/disputed answer voting
(ExamTopics' model — a correctness liability, and this app's answers are
already reviewed, not crowd-sourced); official vendor endorsement partnerships
(MeasureUp's model — not applicable to an independent project); accounts,
social features, or leaderboards (this app is intentionally accountless and
fully static, per README's "How progress is saved").
