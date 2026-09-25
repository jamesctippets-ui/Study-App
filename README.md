# Cert Study Hub

A self-contained study app for certification prep — built iteratively in
Claude.ai as a published artifact, exported to run locally, and now built from a
proper Python source tree instead of one giant file.

## What's inside

Three top-level tabs: **Learn**, **Quiz**, **Exam**. Learn holds two
sub-views — Cards (flashcards, ordered by a simplified SM-2 spaced-repetition
schedule — "Still learning" resurfaces a card sooner, "Got it" pushes its
next appearance out by a growing interval; the order is computed fresh each
time you enter a category/track rather than reshuffling mid-session) and Study
(for tracks without a course, a flashcard list paginated one category/section
at a time — Previous/Next section controls instead of one long scroll; for
AZ-900/AZ-104, a full mini-course per topic: reading with tappable key terms,
an SVG diagram, a portal mockup, a worked scenario, and common exam traps)
— plus Sheet (a one-page, printable cheat sheet per track — every
track's must-know facts condensed into a few dense sections, with a
Print/save-as-PDF button). A lesson's reading is itself split
into pages when it runs long — moving past the first page takes either a
one-question quick check or a 3-pair mini match round, alternating between
the two, so the material isn't just a wall of text to skim past.

Quiz itself has two sub-views: **Questions** (the rotating multiple-choice/
true-false/multi-select engine described below) and **Match** (a
term-matching game — tap a term chip then its definition, *or* press a term
and drag straight down onto its definition with a live line following your
finger; a wrong drop flashes red, a correct one leaves a permanent dashed
line joining the pair; dragging near the top/bottom edge auto-scrolls, since
a full round of 6 pairs can easily run taller than one screen. Respects the
current category filter, tracks mistakes, and deals a fresh random round
each time). Match lives under Quiz rather than Learn since it's a recall
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
queue. Exam is a timed Final Exam mode matching each real exam's
length/pass mark. Text-to-speech is available on readings and flashcards.

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
self-contained card. MD-102 is the first track to use this, sourced from
`MicrosoftDocs/memdocs` (Intune's own CC BY 4.0-licensed docs repo) with
one screenshot per category (`images/intune/`); more tracks are a
straightforward data addition now that the slot exists — see ROADMAP.md
section 12 for which ones are still blocked on finding a properly-licensed
source. A screenshot's optional `product` field controls the attribution
caption's wording ("Real Azure Portal screenshot" by default, "Real
Microsoft Intune admin center screenshot" for MD-102's) so it's never
mislabeled just because most of the existing screenshots happen to be
Azure Portal.

A handful of AZ-900/AZ-104 quiz and exam questions go a step further and
put one of those same real screenshots directly in the question itself
("Looking at this real Access control (IAM) role assignments list,
which action would..."), testing whether you can actually read the
portal rather than just recall a definition. These render in both Quiz
and Final Exam mode (they share the same question bank) with the
descriptive caption deliberately hidden — showing it there would just
hand over the answer.

A trophy header button opens **Achievements** — 15 milestone badges (mastery,
streaks, quiz/exam/match counts, course completion) plus a daily streak
counter, all computed from progress already being tracked, no new data
entry required. A gear **Data & progress** button opens export/import
(download all progress as a JSON file, or restore from one — the only
backup/device-migration option, since the app has no accounts) alongside
the existing per-track reset. Both use small wireframe (line-art) icons
rather than emoji, matching the hamburger menu below.

Opening the app lands you right back on the last track+mode you were
using — no separate home/dashboard page in between, so a refresh never
feels like it "lost your place" the way a full landing screen did. A
first-time visitor with no history yet lands on **AZ-900 → Learn → Study**.
A ☰ hamburger button in the header opens the **track menu** (`TrackMenuPanel`
in `04_shared_ui.jsx`): overall average mastery across every track, the
daily streak, an optional "continue where you left off" shortcut (for
jumping back after browsing other tracks in the menu), and a flat list of
all 15 tracks — each shown exactly once with its description and live
mastery % (no path-grouping; the earlier Learning Paths feature was removed
in favor of this simpler list). Quiz and Exam missed-question review lists
show each question's explanation alongside the prompt, not just what you
got wrong.

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
- **ITIL Foundation** (Version 5) — full question bank (97 questions), classic
  flashcard-list study mode (no course yet).
- **CompTIA Cloud+** (CV0-004) — full question bank (72 questions) across all
  five exam domains, classic flashcard-list study mode (no course yet).
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
  itil.py       — ITIL categories, flashcards, questions
  az900.py      — AZ-900 categories, flashcards, questions, course lessons
  az104.py      — AZ-104 categories, flashcards, questions, course lessons
  cloudplus.py  — CompTIA Cloud+ categories, flashcards, questions
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
```

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

There are no accounts and no login. Anyone with the link gets the full app —
all fifteen tracks, flashcards, quizzes, exams, achievements — and their progress saves to
*their own* browser's local storage, same as it does for you. It's private to
them, isn't visible to you, and doesn't sync between their own devices either
(each browser/device is its own independent copy). That's the trade-off for
staying a fully static site with no server: simple to share, but progress
doesn't follow a person across devices or accounts.

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
- **ITIL and Cloud+ have no course/lesson mode at all yet** — same format as AZ-900
  and AZ-104 would extend cleanly, reusing the existing `DBox`/`DLine`/`PortalFrame`
  diagram helpers.
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
