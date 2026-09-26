# Cert Study Hub

A self-contained study app for certification prep — built iteratively in
Claude.ai as a published artifact, exported to run locally, and now built from a
proper Python source tree instead of one giant file.

## What's inside

Three top-level tabs: **Learn**, **Quiz**, **Exam**. Learn holds two
sub-views — Cards (flashcards, ordered by a real SM-2 spaced-repetition
schedule and rated on the same 1-5 confidence scale SM-2 was originally
designed around — 1 "Blank" through 5 "Easy" — rather than a binary
right/wrong; a 3+ resurfaces the card later by a growing interval, under
3 resets it sooner. The order is computed fresh each time you enter a
category/track rather than reshuffling mid-session) and Study
(for tracks without a course, a flashcard list paginated one category/section
at a time — Previous/Next section controls instead of one long scroll; for
AZ-900/AZ-104, a full mini-course per topic: reading with tappable key terms,
an SVG diagram, a portal mockup, a worked scenario, and common exam traps)
— plus Sheet (a one-page, printable cheat sheet per track — every
track's must-know facts condensed into a few dense sections, with a
Print/save-as-PDF button, opening with an "Exam-day strategy" section —
time-per-question budget computed from that track's real exam length,
pass-mark framing, and process-of-elimination/flagging advice; EHR
Integration, not a real proctored exam, gets a differently-worded section
instead). A lesson's reading is itself split
into pages when it runs long — moving past the first page takes either a
one-question quick check or a 3-pair mini match round, alternating between
the two, so the material isn't just a wall of text to skim past.

Quiz itself has two sub-views: **Questions** (the rotating multiple-choice/
true-false/multi-select engine described below) and **Match** (a
term-matching game — each of the round's 4 pairs gets a small numbered
badge on its term and a lettered prefix on its definition, so it reads at a
glance as "match 1-4 to A-D" rather than two unlabeled walls of text. Tap a
term chip then its definition, *or* press a term and drag straight down
onto its definition with a live line following your finger; a wrong drop
flashes red, a correct one leaves a permanent dashed line joining the pair;
dragging near the top/bottom edge auto-scrolls, for the rare round still
taller than one screen. Respects the current category filter, tracks
mistakes, and deals a fresh random round each time). Match lives under
Quiz rather than Learn since it's a recall
self-test like the rest of Quiz, not a reading/reference view like Cards or
Study. Starting a specific quiz programmatically — "Quiz this section," a
lesson's own quiz, reviewing missed questions — always lands on Questions
even if Match was the last sub-view open, so you never get dropped into the
matching game instead of the quiz you actually asked for.

Every Study section — a lesson's category in AZ-900/AZ-104, or a
category page anywhere else — ends with a **"Quiz this section"** button
that tests every question tagged with that one category, not just a small
curated sample, so you can drill a single topic (e.g. just "Governance &
Resource Structure") in isolation before mixing it back into a full quiz
or exam. A lesson's own Vocabulary list now sits in a collapsed-by-default
expandable block underneath the reading — term flyouts already surface
definitions inline as you read, so the full list stays out of the way
until you actually want to scan it.

Quiz is a rotating question engine
(multiple choice, true/false, multi-select — matching the question formats
the real proctored exams actually use; there's no free-response short-answer
type since none of these exams have one) with a missed-question review
queue. Choosing **All categories** as the filter is a deliberately
interleaved mixed-practice mode, not just an unfiltered pool — it
round-robins the session across every category on purpose (`pickInterleaved`
in `03_helpers.js`, still recency-biased within each category), since
interleaving across topics is the more evidence-backed technique for
actual exam-day transfer than always drilling one category in a row. A
short caption under the quiz setup calls this out so it reads as an
intentional mode. Exam is a timed Final Exam mode matching each real exam's
length/pass mark. Once you've attempted anything in a track, its Exam tab
also shows a blended **exam readiness** signal (`examReadiness` in
`03_helpers.js`) above the "Start Exam" button — labeled "Just starting,"
"Building," "Getting there," or "Exam ready" — instead of just the flat
lifetime mastery % shown elsewhere. It's the same mastery number, but
discounted by how stale it is: each attempted item's last-seen timestamp
(already tracked for spaced repetition) feeds a freshness factor that
decays from full credit the day you studied down to a 0.6 floor by 30
days out, so a 90%-mastery track you haven't touched in two months reads
as less exam-ready than the same 90% built this week. It's a more honest
answer to "am I actually ready" than a percentage that never decays, and
it needed no new data — just a different read on results/seenLog that are
already recorded. Every Learn/Quiz/Exam view for a track ends with a
weighted-mastery breakdown (segment width matches the real exam's category
emphasis) that also tracks **trend over time**, not just today's snapshot:
`stats.categoryMasteryHistory` logs one self-correcting daily score per
category, and once there are 2+ days of history each category line shows
its change since the oldest recorded one (e.g. "+8% / 6d"), spelled out as
visible text below the bar rather than only a hover tooltip — tooltips
don't fire on a touch screen at all, so that was the only way this was
ever going to be usable on a phone. Text-to-speech is available on
readings and flashcards.

A sliding switch in the top nav bar toggles between a dark-grey and an
off-white theme — see "Light/dark theming" under Source layout for how it's
implemented and what it does/doesn't affect.

The hamburger menu's **My Cert Path** panel lets you put whichever certs
you're actually planning to take into your own order — not a curated
sequence, your sequence. It always surfaces an "Up next" card for the
first cert in that order you haven't marked passed yet, so finishing one
automatically promotes the next without any manual re-ordering. Each cert
in your path can carry an optional scheduled test date; marking one passed
moves it into a collapsed "Completed" section (with the date you passed
it) instead of cluttering the active list, though it keeps its place in
line so un-marking it restores exactly where it was. This travels with the
rest of your synced progress (unlike the theme setting) since it's study
planning data, not a display preference — see `certPlan` in
`03_helpers.js`/`06_app.jsx`.

Once 2 or more active certs are in your path, the panel also offers a
**"Start Today's Mix"** button — one quiz session that intermingles
questions from every active cert instead of studying them one at a time,
for cross-certification study when you're juggling more than one track at
once. It isn't an equal-share shuffle: coverage is weighted by your path's
priority order, so the "Up next" cert gets primary coverage and each
subsequent cert contributes a progressively smaller supplemental share
(a harmonic 1, 1/2, 1/3... split via `weightedTrackQuotas`, apportioned by
largest remainder so quotas always add up to the full session length and
every included cert gets at least one question). Every question is tagged
with the cert it came from, so answering it updates *that* cert's own
mastery and spaced-repetition data — not whichever track happens to be
open — and the question card, its category badge, and the post-quiz
"worth another look" list all show which cert each question belongs to.

Key terms aren't just highlighted in lesson readings — every track gets this
now, in quiz explanations and flashcard backs too. Tapping a highlighted term
opens a small flyout anchored directly under that word (front/back/detail,
sourced from that track's own flashcards), not a block appended below the
whole paragraph or card — it closes on a second tap, on Escape, or on tapping
anywhere else. Curated tracks (AZ-900, AZ-104) use a hand-picked term list;
every other track auto-detects terms by matching flashcard fronts against
the surrounding text, so coverage scales to new content with no
per-question authoring needed.

The Exam tab for each track links out to real official study resources —
Microsoft Learn study guides and certification pages for the Microsoft
tracks, PeopleCert for ITIL, CompTIA for Cloud+, and HL7 International's
FHIR/V2 specs for the EHR Integration module. Individual categories get
their own more specific "Learn more" links too (see `resources` on each
track's `CATEGORIES` in data/&lt;track&gt;.py) — shown on Study section pages, a
lesson's Vocabulary block, and the cheat sheet.

AZ-900/AZ-104 lessons that have a portal mockup also show a real Azure
Portal screenshot underneath it ("See the real thing:") for the topics
where one was available — pulled directly from Microsoft's own
CC BY 4.0-licensed documentation source (the MicrosoftDocs GitHub repos),
saved locally under `images/portal/` and captioned with a plain-language
description of what's on screen plus attribution and a link back to the
source page. The hand-drawn mockup stays as the primary illustration
(dark-theme consistent, and covers every topic); the real screenshot is a
supplementary, secondary reference where one exists.

The other 13 (non-course) tracks get the same real-screenshot treatment
per category instead of per lesson — any category in `CATEGORIES` can
carry a `screenshot` key into `REAL_PORTAL_SCREENSHOTS`
(02_portal_mockups.jsx), shown under a "Portal screenshot" heading on that
category's Study page. There's no hand-drawn mockup involved here since
flat tracks never had one — the real screenshot renders as its own
self-contained card. MD-102 was the first track to use this, sourced from
`MicrosoftDocs/memdocs` (Intune's own CC BY 4.0-licensed docs repo) with
one screenshot per category (`images/intune/`). AZ-305 followed with 5
reference diagrams from `MicrosoftDocs/architecture-center` (also CC BY
4.0) — hub-spoke networking, a VM landing-zone baseline, and decision
trees for compute and load-balancing service choices plus a data-
partitioning diagram (`images/az305-arch/`), each with its own pair of
quiz/exam questions. More tracks are a straightforward data addition now
that the slot exists — see ROADMAP.md section 12 for which ones are still
blocked on finding a properly-licensed source. A screenshot's optional
`product` field controls the attribution caption's wording ("Real Azure
Portal screenshot" by default, "Real Microsoft Intune admin center
screenshot" for MD-102's, "Azure Architecture Center reference diagram"
for AZ-305's) so it's never mislabeled just because most of the existing
screenshots happen to be Azure Portal.

A handful of AZ-900/AZ-104 quiz and exam questions go a step further and
put one of those same real screenshots directly in the question itself
("Looking at this real Access control (IAM) role assignments list,
which action would..."), testing whether you can actually read the
portal rather than just recall a definition. These render in both Quiz
and Final Exam mode (they share the same question bank) with the
descriptive caption deliberately hidden — showing it there would just
hand over the answer.

A **Glossary** button on Home opens a cross-track term reference
(`GlossaryPanel` in 04_shared_ui.jsx): every visible track's flashcard
fronts merged by lowercased/trimmed text (so identical terms across
tracks collapse into one entry with both tracks' badges, while genuinely
different phrasing per track stays separate), searchable, with
expand/collapse per entry.

A trophy header button opens **Achievements** — 15 milestone badges (mastery,
streaks, quiz/exam/match counts, course completion) plus a daily streak
counter, all computed from progress already being tracked, no new data
entry required. A gear **Data & progress** button opens export/import
(download all progress as a JSON file, or restore from one — the only
backup/device-migration option, since the app has no accounts) alongside
the existing per-track reset and a **Voice & speech** section — a rate
slider and a voice picker (from `speechSynthesis.getVoices()`, English
voices sorted first) for every 🔊 Listen button in the app, with a
"Test voice" preview button. Both the theme and these speech settings are
per-device localStorage preferences, not synced progress. Both use small
wireframe (line-art) icons rather than emoji, matching the hamburger menu
below.

Opening the app always lands on **Home** (`HomeView` in `04_shared_ui.jsx`)
rather than resuming the last track+mode directly — a real dashboard to
start from every time, not a mid-session drop-back-in. Home shows, top to
bottom:

- Overall average mastery across every track and the daily streak.
- A **daily goal ring** — a small self-set "study N cards/questions
  today" target (`stats.dailyGoal`) with a circular progress indicator
  that fills as you rate flashcards and answer quiz/exam questions
  (across every track, Today's Mix and the daily question/vocab below
  included), turns solid green once you hit it, and can be adjusted with
  a tap-to-reveal +/- 5 stepper.
- An **exam readiness** card for your "current cert" (see below) with a
  lightweight readiness **prediction**: `stats.readinessHistory` logs one
  score snapshot a day per track, and `readinessProjection` draws a
  straight line through the oldest and newest snapshots to estimate how
  many days of study, at that pace, would cross the 80% mark — e.g. "At
  your current pace, AZ-900 could be exam-ready in about 12 days (around
  Oct 7)." With fewer than two days of real history, a flat/declining
  trend, or a projection over a year out, it says so plainly instead of
  guessing a date it can't back up.
- A **My Cert Path** card showing your "Up next" cert, with a **next
  cert date** countdown badge (reusing `formatScheduledLabel`'s "in N
  days"/"today"/"N days past" phrasing, colored red if overdue and gold
  inside a week) whenever that cert has a scheduled test date set.
- A **"Continue where you left off"** button once you've actually
  visited a track this browser (tracked separately from Home itself, so
  Home is never mistaken for "a place you left off at").
- A **Question of the Day** and **Vocab of the Day** — one question and
  one flashcard, deterministically picked each day (`seededIndex`, hashed
  from the date so the pick is stable across reloads without needing to
  store which item was chosen) from your "current cert": the Cert Path's
  Up Next track if you've set one, else whichever track you last
  actually visited, else AZ-900. Answering the question or revealing the
  vocab counts toward the daily goal and updates that track's real
  mastery/results data (`stats.dailyChallenge` just remembers you've
  already done today's so revisiting Home later doesn't reset or
  double-count it) — both lock in place with a "new one tomorrow" note
  once done.
- A collapsed-by-default **dropdown** for the full 15-track list — tap
  "All tracks (N)" to expand the same rich rows (colored label, subtitle,
  live mastery %/passed/scheduled badge) the earlier hamburger bottom-sheet
  showed, collapsed by default now that several other widgets share the
  page. No path-grouping — every track once, description and mastery %
  intact — tapping one takes you straight into its Learn tab.

From inside any track, a ☰ button in the header (titled "Home") takes you
back to this same Home page at any time — it's a real navigation
destination now, not a bottom-sheet
overlay. Navigation is also real client-side routing, not just in-memory
state: the URL hash always reflects where you are (`#/az900/quiz/questions`,
`#/home`), so the browser's back/forward buttons walk through actual
app history instead of doing nothing, and a link straight to a specific
track+mode+sub-tab lands there directly on load — hash-based rather than
real paths, deliberately, since a static site with no server has nowhere
to add the rewrite rule a path router needs for a refreshed deep link to
resolve, and a hash needs none (see `routeToHash`/`parseHash` in
`03_helpers.js`). Quiz and Exam missed-question review lists show each question's
explanation alongside the prompt, not just what you got wrong.

Quiz mode has a third **Verbal** sub-tab (alongside Questions and Match) —
hands-free, audio-only studying for e.g. driving. Pick a length and a
"thinking pause" duration, hit Start, and it reads each question aloud
(and its options, for multiple-choice), pauses, then reads the correct
answer and explanation before auto-advancing — no microphone, no answer
capture, so it's a pure listen-and-recall aid rather than a scored
session (mastery/SRS/daily goal don't move from it). Multi-select
questions are skipped — there's nothing to "select" without a mic. A
single Pause/Play plus Skip control covers the rare safe glance; a
Screen Wake Lock keeps the phone from auto-locking mid-session
(feature-detected, and the setup screen is upfront that a real hard lock
or a backgrounded tab can still stop playback — that's outside any web
app's control).

Tracks where real command-line syntax is core to the job (AZ-104's Azure
CLI, AZ-802's PowerShell) get a fourth **Commands** sub-tab: type the
command for a stated task and get checked against its expected syntax
and flags, rather than picking from options. Checking is deliberately
lenient about whitespace, casing, flag order, and flag values (a
different resource-group name still counts) but strict about the right
verb and every required flag being present — a byte-exact string match
would fail plenty of genuinely-correct answers over formatting alone.
Correct answers show as either "exactly right" (matched the canonical
form) or "right idea — close enough" (structurally correct, different
formatting), both revealing the canonical command and an explanation.
This mode is deliberately self-contained — it doesn't feed mastery %,
results, or exam readiness, so its score is tracked for the practice
session only.

**Fifteen tracks, all visible in the track switcher:**
- **AZ-900** (Azure Fundamentals) — full course content, 106 questions.
- **AB-650** (M365 & AI Services Administrator) — full question bank (52
  questions); tenant administration, governance/compliance, and Microsoft 365
  Copilot/AI-services management. Replaces the retiring MS-102.
- **AZ-104** (Azure Administrator) — full question bank (75 questions) and the
  same course treatment as AZ-900 (7 lessons, diagrams, mockups).
- **DP-900** (Azure Data Fundamentals) — full question bank (62 questions).
- **DP-300** (Azure Database Administrator) — full question bank (64 questions).
- **AZ-305** (Azure Solutions Architect Expert) — full question bank (62 questions).
- **AZ-802** (Windows Server Administrator) — full question bank (72 questions);
  consolidates what used to be separate AZ-800/AZ-801 tracks, matching
  Microsoft's real exam consolidation (AZ-800/801 retire Sept 30, 2026).
- **AZ-140** (Azure Virtual Desktop Specialty) — full question bank (62 questions);
  host pools, FSLogix, MSIX app attach, AVD identity/security, and monitoring.
- **MD-102** (Endpoint Administrator) — full question bank (55 questions);
  Intune, Windows Autopilot, device compliance/security, and app management.
- **SC-300** (Identity & Access Administrator) — full question bank (66 questions).
- **SC-200** (Security Operations Analyst) — full question bank (66 questions);
  Defender XDR/Sentinel operations, incident response, and real KQL-based
  threat hunting.
- **SC-500** (Cloud & AI Security Engineer) — full question bank (78 questions),
  including current AI-security content (Copilot, Microsoft Foundry agents,
  Entra Agent ID).
- **ITIL Foundation** (Version 5) — full question bank (97 questions) plus full
  course mode (7 lessons covering the Value System, Guiding Principles, the Four
  Dimensions, the Continual Improvement Model, and the Product/Service Lifecycle).
- **CompTIA Cloud+** (CV0-004) — full question bank (72 questions) across all
  five exam domains, plus full course mode (6 lessons: deployment models &
  virtualization, scaling & resilience, security, deployment strategies,
  operations/governance, and troubleshooting).
- **EHR Integration** — *not a certification.* Epic (the dominant hospital EHR
  vendor) requires employer sponsorship to even take its exams, and its exam
  content is proprietary, so there's no legitimate way to build real cert-prep
  for it. This track instead covers general, publicly-documented healthcare
  interoperability knowledge (HL7v2, FHIR, integration-engine architecture,
  healthcare data governance) — 56 questions, clearly labeled as a self-study
  concepts module rather than a real exam.

To hide a track again (e.g. while it's a work in progress), open `data/tracks.py`
and add `'hidden': True` to that track's entry, then rebuild (see below).

## Source layout

The shipped app is still a single static `index.html` (so it keeps working as an
offline-installable PWA with no server), but that file is now **generated** —
don't edit it directly, it'll be overwritten. The real source is:

```
data/
  tracks.py     — TRACKS (which certs exist / are visible) and EXAM_CONFIG
  itil.py       — ITIL categories, flashcards, questions, course lessons
  az900.py      — AZ-900 categories, flashcards, questions, course lessons
  az104.py      — AZ-104 categories, flashcards, questions, course lessons
  cloudplus.py  — CompTIA Cloud+ categories, flashcards, questions, course lessons
src/js/
  00_preamble.js        — React hook imports, the COLOR palette
  01_diagrams.jsx        — SVG lesson diagrams
  02_portal_mockups.jsx  — fake Azure Portal screenshots used in lessons
  03_helpers.js          — shuffling, storage, question-prep helpers
  04_shared_ui.jsx       — flashcards, quiz engine, lesson/course view
  05_final_exam_ui.jsx   — timed exam intro/runner/results
  06_app.jsx             — CertStudyApp, the top-level component
templates/
  index.html.tmpl        — the <head>/<body> shell, with a placeholder for
                            the assembled script
build.py                  — reads data/ + src/js/, validates it, fills in the
                            template, writes index.html
dist/data/                 — generated per-track JSON (<track>.json plus a
                            tracks.json manifest) — see below
```

`build.py` also writes each track's content out as its own standalone
`dist/data/<track>.json` (built from the exact same source as the inline
bundle, so the two can never drift apart), plus a `dist/data/tracks.json`
manifest of `TRACKS`/`EXAM_CONFIG`. This is content-as-fetchable-data
groundwork for a possible future second client (a separate web deployment,
an iOS/Android app) — additive only: `index.html` still inlines everything
up front exactly as it always has, so this changes nothing about how this
app itself loads or behaves today.

`build.py` is plain-stdlib Python (no pip installs needed). It also **validates the
data** before building — every flashcard/question's `cat` must exist in that
track's category list, every id must be unique within a track, every lesson's
`vocabIds`/`quizIds` must point at real flashcard/question ids, and every
question's answer key is structurally sound (`correct` indices in range,
`mc`/`ms` options non-empty and non-duplicated, `tf` has a boolean `answer`,
every question has an explanation). A bad edit fails the build with a specific
error instead of shipping a broken lesson or an unanswerable question silently.

**After editing anything in `data/` or `src/js/`, rebuild:**

```
python3 build.py
```

This overwrites `index.html`. Commit the rebuilt `index.html` along with your
source changes — GitHub Pages (or any static host) serves that file directly,
it doesn't run the Python build for you.

The React/JSX code itself is still transpiled by Babel Standalone *in the
browser* at load time (see "Where things stand" below for the trade-off there) —
`build.py` only assembles source files and content, it doesn't compile JS.

### Light/dark theming

The dark-grey/off-white toggle is implemented with CSS custom properties, not
React state/re-rendering. `templates/index.html.tmpl` defines every themed
color as a `--color-*` variable under `:root` (dark, the default) and
`:root[data-theme="light"]` (light); `00_preamble.js`'s `COLOR` object just
holds `var(--color-*)` strings, so the hundreds of existing `COLOR.xxx`
inline-style references across every component file didn't need to change at
all. `useTheme()` (also in `00_preamble.js`) reads/writes `localStorage`
(key `certStudyHub_theme`) and flips `document.documentElement`'s
`data-theme` attribute; the browser re-resolves every `var()` in the
already-rendered DOM instantly, with zero React re-render. `ThemeToggle` is
the sun/moon sliding switch in the top nav bar.

Theme preference is deliberately **not** part of the synced progress payload
(`persistPayload`/`saveResults` in `06_app.jsx`) — it's a per-device display
preference like an OS setting, not study data, so it stays in plain
`localStorage` and doesn't travel between devices/accounts the way mastery
and streaks do.

The app's accent colors (primary/success/red/gold/teal) are theme-aware too —
lighter/pastel in dark mode, darker/more saturated in light mode — so text
set directly in an accent color stays readable against both backgrounds.
Anywhere an accent is used as a *background* (buttons, badges) pairs it with
`COLOR.onAccent`, a token that's dark in dark mode and light in light mode,
instead of a hardcoded text color, so those stay legible under both themes
too. `TRACK_ACCENTS` (the per-track color chips in the hamburger menu) is
the one palette left theme-unaware — it's used as text on a light card
background in both themes and hasn't shown a contrast problem in testing,
but if a future track color reads poorly in light mode, that's the place to
add a light-mode variant.

## Running it

No `npm install` needed to run the app — it's plain HTML with React and Babel
Standalone loaded from `<script>` tags. Styling is a small hand-written CSS reset
plus the ~20 utility classes the app actually uses (previously Tailwind's CDN
script, which shipped its whole runtime JIT compiler and re-scanned the DOM on
every re-render just to serve that fixed, known set of classes). You need internet
access once, on first load, to fetch React/Babel and Google Fonts; nothing else
talks to the network after that, and a service worker caches all of it for offline
use after the first visit.

**Easiest:** just double-click `index.html` to open it in a browser.

**More reliable** (some browsers restrict `localStorage` under a bare `file://`
origin, and the service worker/PWA install need a real origin): serve the folder
instead —

```
npx serve .
# or
python3 -m http.server 8000
```

then open the printed `localhost` URL.

**On your phone:** `localhost` only works on the same device. To install this on
a phone, it needs to be served over `https://` from somewhere your phone can
reach — GitHub Pages on this repo is the simplest free option (see "Sharing it"
below). Once it's live, open the URL on your phone and use "Add to Home Screen"
to install it.

## Sharing it

There are no accounts and no login — and, per a deliberate decision (not just
a "not yet"), never will be. Anyone with the link gets the full app —
all fifteen tracks, flashcards, quizzes, exams, achievements — and their progress saves to
*their own* browser's local storage, same as it does for you. It's private to
them, isn't visible to you, and doesn't sync between their own devices either
(each browser/device is its own independent copy). That's the trade-off for
staying a fully static site with no server: simple to share, no server to run
or secure, no accounts or user data to be responsible for — but progress
doesn't follow a person across devices or accounts. If cross-device sync ever
matters, the path is each person's own existing cloud: export the JSON from
Data & Progress, put it wherever they already keep files, import it on
another device — not a service this project runs on their behalf.

**To publish it (GitHub Pages, free):**
1. On GitHub, go to this repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch".
3. Pick the branch this app lives on (currently
   `claude/certification-study-app-n6bst5`) and folder **/ (root)**, then Save.
4. GitHub gives you a URL like `https://<your-username>.github.io/Study-App/`
   after a minute or two — that's the link to share.

A `.nojekyll` file is already committed at the repo root. GitHub Pages runs
sites through Jekyll by default, and Jekyll's `{{ ... }}` templating syntax
would otherwise collide with the React JSX in `index.html` (e.g.
`style={{ padding: '10px' }}`) and corrupt the page. `.nojekyll` tells Pages to
skip that and serve the files as-is — without it, the published site would
likely come up blank or broken.

If you'd rather publish from a permanent `main` branch instead of this
session's branch name, that's a quick change whenever you want it.

## How progress is saved

The app tries `window.claude.use('db')` first — that's the hook it used when hosted
as a Claude.ai artifact, syncing progress to your account. That object won't exist
here, so it falls through automatically to plain browser `localStorage`, scoped to
whichever origin you're viewing it from. That fallback was built in from the start
specifically for this local-hosting case, so no code changes were needed to make it
work outside Claude.ai — progress just won't sync between devices anymore, it'll
stay wherever you're running it.

A failed write (a full `localStorage` quota, a private-browsing restriction) used to
fail completely silently — progress would just stop saving with no indication anything
was wrong. It's now surfaced: a red banner ("Your last save didn't go through...")
appears above the content the next time a save fails, and clears automatically the
next time one succeeds, pointing you at Data & Progress → Export as the way to back up
what you already have before troubleshooting further.

## Where things stand / ideas for Claude Code

- **In-browser Babel is the remaining load-time cost.** Every page load re-transpiles
  the JSX in `src/js/` with Babel Standalone before React can render anything.
  Removing it means precompiling the JSX ahead of time as part of `build.py`, which
  needs a JS toolchain (Babel CLI or esbuild via Node) available wherever the build
  runs — a bigger call since it adds a non-Python dependency to a build that's
  currently pure Python. Worth doing if load time on a phone still feels slow; hold
  off otherwise.
- **AZ-104's course is now fully complete on both diagram and portal mockup/
  screenshot coverage across all 7 lessons**, matching AZ-900. The last two
  gaps — Identities & Access and Storage Management — got their own new
  diagrams (`groupLicensing`, `storageAccess` in `01_diagrams.jsx`) rather
  than reusing AZ-900's generic `identity`/`storage` diagrams, since those
  lessons' actual content (dynamic-group licensing; access keys vs. SAS vs.
  a storage firewall) didn't match what the generic ones illustrate.
- **ITIL and Cloud+ now have full course/lesson mode**, matching AZ-900/AZ-104's
  format (ITIL: 7 lessons across all 7 categories; Cloud+: 6 lessons across all 5
  categories), reusing the existing `DBox`/`DLine`/`DCaption` diagram helpers. Neither
  carries a `portalMockup`, correctly, since neither has a real vendor portal.
- Re-enabling a hidden track is one line each in `data/tracks.py`.
- **Adding a track no longer means touching `src/js/`.** The JS side used to hardcode
  `{ itil, az900, az104 }` in a few places (initial state, storage migration) — those
  now derive the set of tracks from `TRACKS` itself, so adding one is just a new
  `data/<name>.py` module plus a `build.py` import/registration.

## Other project docs

- **`ROADMAP.md`** — the feature backlog: what's shipped, what's next, and
  ideas not yet started (more certs, more real screenshots, new interactive
  study games, etc.).
- **`LAUNCH_CHECKLIST.md`** — what's needed before moving this off of a
  Claude artifact and onto a real domain (legal docs, hosting/deployment
  setup, onboarding, trademark/branding due diligence).
