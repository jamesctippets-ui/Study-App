# Feature Roadmap

A running backlog of features to incorporate, drawn from the user's own ideas
plus a survey of what established study/cert-prep platforms do well (Anki,
Brainscape, Quizlet, Whizlabs, MeasureUp, ExamTopics, Tutorials Dojo,
Microsoft Learn, Duolingo-style gamified learning). Nothing here is built
yet — this is the list to work through, roughly ordered by impact vs. effort
within each section. Check items off as they land, and add new ones as they
come up.

## 1. Multi-cert learning paths (user's idea)

- [x] A **Path** mode that sequences multiple tracks in a recommended order
  for a stated goal, instead of the user picking tracks independently. Shipped
  as the "Hospital Microsoft Engineer" path (AZ-900 → AZ-104 → DP-900 →
  DP-300 → AZ-802 → SC-300 → SC-500 → AZ-305 → EHR Integration), opened from
  the "🗺️ Recommended study path" button — each step shows why it's there and
  live per-track mastery. data/paths.py can hold more than one named path.
- [ ] Prerequisite awareness: flag when a track assumes knowledge from an
  earlier one in the path (AZ-104-level hands-on knowledge is a stated
  prerequisite mindset for AZ-305, for example).
- [ ] A combined progress view across an entire path, not just per-track.
- [ ] Support more than one named path (e.g. a security-focused path vs. an
  architecture-focused path) since different goals want different orders.

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
- [~] A one-page **cheat sheet** per track — the single highest-praised
  feature from the platforms surveyed (Tutorials Dojo) — a printable/
  shareable visual summary of the exam's must-know facts, not just prose.
  Shipped: schema (`CHEAT_SHEET` in data/&lt;track&gt;.py), the "Sheet" tab under
  Learn (`CheatSheetView` in 04_shared_ui.jsx), and print-to-PDF styling
  (`@media print` in templates/index.html.tmpl). Content: az900 and itil are
  done; the other 13 tracks are in progress — build.py's validator will make
  CHEAT_SHEET a hard requirement (matching EXAM_CONFIG's `resources`) once
  all 15 are filled in.

## 6. A more robust UI: menus and separate pages (user's idea)

- [ ] Real client-side routing instead of pure in-memory tab state, so the
  browser back button, refresh, and deep links to a specific track/mode/
  lesson all work as a user would expect from a "real" multi-page app.
- [x] A proper **home/dashboard** page — overall progress across every track,
  streak, and a "pick up where you left off" action — instead of always
  landing straight into one track's Cards view. Shipped as the app's new
  landing screen (src/js/06_app.jsx's `view` state), with a 🏠 button in the
  track header to return to it.
- [ ] A side/hamburger menu for track + mode navigation once the track list
  and mode list have both grown past what a button row or dropdown handles
  gracefully together.

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

---

Not in scope / deliberately not doing: crowd-sourced/disputed answer voting
(ExamTopics' model — a correctness liability, and this app's answers are
already reviewed, not crowd-sourced); official vendor endorsement partnerships
(MeasureUp's model — not applicable to an independent project); accounts,
social features, or leaderboards (this app is intentionally accountless and
fully static, per README's "How progress is saved").
