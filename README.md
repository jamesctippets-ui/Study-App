# Cert Study Hub

A self-contained study app for Microsoft certification prep — built iteratively in
Claude.ai as a published artifact, now exported here to run locally and keep
developing with Claude Code.

## What's inside

One file, `index.html`, holds the entire app: flashcards, a rotating quiz engine
(multiple choice, true/false, multi-select, short-answer), a timed Final Exam mode
matching each real exam's length/pass mark, a missed-question review queue, and — for
AZ-900 — a full mini-course per topic (reading with highlighted key terms, an SVG
diagram, a portal mockup, a worked scenario, common exam traps, and a 3–4 question
quiz), plus text-to-speech on the readings and flashcards.

**Three tracks exist in the data:**
- **AZ-900** (Azure Fundamentals) — the only one currently visible in the track
  switcher. Full course content, 95 questions.
- **AZ-104** (Azure Administrator) — full question bank (56 questions) *and* now has
  the same course treatment as AZ-900 (7 lessons, diagrams, mockups). Currently
  hidden.
- **ITIL Foundation** (Version 5) — full question bank (80 questions), classic
  flashcard-list study mode (no course yet). Currently hidden.

To unhide a track, find the `TRACKS` array near the top of the script and delete
its `hidden: true`.

## Running it

No build step, no `npm install` — it's plain HTML with React and Babel Standalone
loaded from `<script>` tags, transpiling JSX in the browser at load time. Styling
is a small hand-written CSS reset plus the ~20 utility classes the app actually
uses (previously Tailwind's CDN script, which shipped its whole runtime JIT
compiler and re-scanned the DOM on every re-render just to serve that fixed,
known set of classes — see "Where things stand" below). You need internet access
once, on first load, to fetch React/Babel and Google Fonts; nothing else talks to
the network after that, and a service worker caches all of it for offline use
after the first visit.

**Easiest:** just double-click `index.html` to open it in a browser.

**More reliable** (some browsers restrict `localStorage` under a bare `file://`
origin): serve the folder instead —

```
npx serve .
# or
python3 -m http.server 8000
```

then open the printed `localhost` URL.

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
  the whole ~2,500-line script with Babel Standalone before React can render anything.
  Tailwind's CDN script (a much bigger cost — a full runtime JIT compiler plus a
  MutationObserver re-scanning the DOM on every re-render) has already been swapped
  for a small static stylesheet, since the app only ever used a fixed ~20 utility
  classes. Removing Babel too means precompiling the JSX ahead of time, which needs
  an actual build step (Babel CLI or a bundler) — a bigger call since it trades away
  the "just edit index.html, no build step" workflow this project is built around.
  Worth doing if load time on a phone still feels slow; hold off otherwise.
- **Everything currently lives in one ~2,500-line file.** It's organized with clear
  `/* ---- section ---- */` comments (data per track, shared UI components, the exam
  engine, diagrams, etc.), so it's readable, but splitting it into real modules
  (and optionally a Vite build) would make it much nicer to keep extending. I didn't
  do that conversion myself — I don't have network access in the environment I built
  this in, so I couldn't verify an `npm install`/bundler setup actually runs. That's
  a good first task now that real testing is possible.
- **AZ-104 and ITIL are feature-complete on data, but AZ-104's course still only has
  5 of 7 lessons with a diagram and 3 of 7 with a portal mockup** (Identities & Access
  and App Hosting & IaC have neither) — same gap pattern AZ-900 started with.
- **ITIL has no course/lesson mode at all yet** — same format as AZ-900 and AZ-104
  would extend cleanly, reusing the existing `DBox`/`DLine`/`PortalFrame` diagram
  helpers.
- Re-enabling a hidden track is one line each in the `TRACKS` array.
