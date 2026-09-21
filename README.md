# Cert Study Hub

A self-contained study app for Microsoft certification prep — built iteratively in
Claude.ai as a published artifact, exported to run locally, and now built from a
proper Python source tree instead of one giant file.

## What's inside

Flashcards, a rotating quiz engine (multiple choice, true/false, multi-select —
matching the question formats the real proctored exams actually use; there's no
free-response short-answer type since none of these exams have one), a timed
Final Exam mode matching each real exam's length/pass mark, a missed-question
review queue, and — for AZ-900 and AZ-104 — a full mini-course per topic (reading
with tappable key terms, an SVG diagram, a portal mockup, a worked scenario,
common exam traps, and a 3–4 question quiz), plus text-to-speech on the readings
and flashcards.

Key terms in a lesson's reading aren't just highlighted — tapping one pulls up
its definition inline (front/back/detail, sourced from that track's flashcards)
without leaving the reading. Coverage depends on whether a matching flashcard
exists for that exact term; where one doesn't, the term stays highlighted but
plain, rather than showing a broken or empty popover.

**Four tracks, all visible in the track switcher:**
- **AZ-900** (Azure Fundamentals) — full course content, 83 questions.
- **AZ-104** (Azure Administrator) — full question bank (48 questions) and the
  same course treatment as AZ-900 (7 lessons, diagrams, mockups).
- **ITIL Foundation** (Version 5) — full question bank (65 questions), classic
  flashcard-list study mode (no course yet).
- **CompTIA Cloud+** (CV0-004) — full question bank (50 questions) across all
  five exam domains, classic flashcard-list study mode (no course yet).

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
track's category list, every id must be unique within a track, and every lesson's
`vocabIds`/`quizIds` must point at real flashcard/question ids. A bad edit fails
the build with a specific error instead of shipping a broken lesson silently.

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
all three tracks, flashcards, quizzes, exams — and their progress saves to
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
- **AZ-104 and ITIL are feature-complete on data, but AZ-104's course still only has
  5 of 7 lessons with a diagram and 3 of 7 with a portal mockup** (Identities & Access
  and App Hosting & IaC have neither) — same gap pattern AZ-900 started with.
- **ITIL and Cloud+ have no course/lesson mode at all yet** — same format as AZ-900
  and AZ-104 would extend cleanly, reusing the existing `DBox`/`DLine`/`PortalFrame`
  diagram helpers.
- Re-enabling a hidden track is one line each in `data/tracks.py`.
- **Adding a track no longer means touching `src/js/`.** The JS side used to hardcode
  `{ itil, az900, az104 }` in a few places (initial state, storage migration) — those
  now derive the set of tracks from `TRACKS` itself, so adding one is just a new
  `data/<name>.py` module plus a `build.py` import/registration.
