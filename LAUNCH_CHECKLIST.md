# Launch Checklist — Moving to a Real Domain

Right now this app lives entirely as a generated `index.html` running inside
a Claude artifact/session — no accounts (beyond the optional Claude-runtime
cloud sync), no server, no third-party trackers, nothing collected off the
device it's used on. That's a genuinely simple starting point for going
public: most of what a "real" site needs to bolt on (auth, a backend, a
database) isn't here yet, which means the legal and hosting surface area is
small today. This is the list of what to put in place before/while pointing
a real domain at it, grouped so you can tackle it in whatever order makes
sense. Nothing here is built yet — check items off as they land.

## 1. Legal & compliance documents

Small footprint today (no accounts, no PII, no cookies, no ads, no
third-party trackers — everything is `localStorage` plus, only inside a
Claude artifact, the user's own Claude-account cloud sync) means these can
start simple and honest rather than needing dense boilerplate. Say what's
actually true; expand later only if the data footprint actually grows
(see item 2's note on cloud sync).

- [ ] **Terms of Service / Terms of Use.** Who this is for, that it's an
  independent study aid (not an official prep course), acceptable use,
  no warranty that using it guarantees passing any exam, liability limits.
- [ ] **Privacy Policy.** What's collected (today: nothing server-side;
  progress lives in the browser's `localStorage`, or in the user's own
  Claude account if opened as a Claude artifact), what isn't (no email,
  no accounts, no ad tracking, no analytics unless/until you add one —
  see item 2), and how someone clears their own data (the existing Data &
  Progress panel's reset/export already covers this well).
- [ ] **Cookie / local-storage disclosure.** The app doesn't use cookies
  today, only `localStorage` for progress — under most cookie-law
  frameworks, "strictly necessary, no tracking" local storage doesn't need
  a consent banner, but it should still be disclosed plainly (can likely
  live inside the Privacy Policy rather than as a separate banner, unless
  you add analytics — then revisit).
- [ ] **Disclaimer.** Not affiliated with, endorsed by, or sponsored by
  Microsoft, CompTIA, or AXELOS/ITIL — those are their respective owners'
  trademarks, used here only to describe which exam each track studies
  for. All questions/explanations are original content, not reproduced
  real exam questions ("no braindump" statement).
- [ ] **Accessibility statement.** A short, honest note on current state
  (keyboard/screen-reader support, contrast, etc.) plus a contact path for
  reporting accessibility issues.
- [ ] **Copyright/trademark footer notice** on every page (© year, the
  trademark disclaimer above, and attribution for the licensed Azure
  Portal screenshots — see item 4).
- [ ] **A content-correction / feedback contact path.** Somewhere to
  report a wrong or outdated question — an email alias or a lightweight
  form beats no path at all once real users start relying on this.

## 2. Hosting & deployment technical readiness

- [ ] **Pick a static host** (Cloudflare Pages, Netlify, Vercel, GitHub
  Pages all work for a single generated HTML file + a handful of assets)
  and wire up **CI** (a GitHub Action) to run `python3 build.py` and
  publish `index.html` + `images/`/`icons/`/`manifest.json`/
  `service-worker.js` automatically on push, instead of committing a
  manually-regenerated `index.html` by hand.
- [ ] **Custom domain, DNS, TLS.** Most static hosts auto-provision HTTPS
  certs once DNS points at them — service workers specifically *require*
  HTTPS in production (unlike the `file://`/`localhost` testing done so
  far), so this isn't optional for the PWA/offline features to keep working.
- [ ] **Decide the fate of cloud sync before launch.** `window.claude.use
  ('db')` (src/js/06_app.jsx) only exists inside a Claude artifact — on a
  standalone domain it silently falls back to local-only storage (already
  flagged in ROADMAP.md's future-proofing section). Two honest options:
  ship as **local-only** on the new domain (fine, just say so plainly —
  "progress stays on this device/browser" — and this keeps the Privacy
  Policy trivial), or build a **real lightweight backend** for
  cross-device sync (bigger effort, and the moment it exists the Privacy
  Policy needs real content about account data, retention, and deletion).
  Decide before launch, not after — it changes what the legal docs above
  need to say.
- [ ] **SEO basics.** `<title>`, a real meta description, Open Graph/
  Twitter card tags for link previews, `robots.txt`, a trivial
  `sitemap.xml` (one URL, but still good practice). The favicon/app icons
  already exist under `icons/`.
- [ ] **Re-test PWA installability on the real domain.** `manifest.json`
  and `service-worker.js` already exist and were built for this, but
  "Add to Home Screen" behavior should be re-verified once served over a
  real HTTPS domain rather than the local test harness.
- [ ] **Security headers** via the host's config: CSP, X-Content-Type-
  Options, Referrer-Policy, etc. — most static hosts make this a config
  file, not code.
- [ ] **Decide on analytics.** None at all is the simplest and keeps the
  Privacy Policy short; a privacy-respecting option (Plausible, Fathom)
  is a reasonable middle ground. Whatever's chosen needs to be disclosed
  in the Privacy Policy, and may trigger needing a cookie-consent banner
  depending on the tool.
- [ ] **Error monitoring (optional).** Something like Sentry so a JS error
  on someone else's device/browser doesn't go unnoticed the way it would
  today.

## 3. Product/UX readiness

- [ ] **First-run onboarding tour.** A short, dismissible walkthrough for
  brand-new visitors covering: the hamburger menu (switching tracks), the
  Learn/Quiz/Exam tabs, the achievements button, and the cheat sheet's
  print button. Persist a `hasSeenTour` flag alongside the existing
  stats/localStorage; skip it automatically for anyone who already has
  results (a returning user doesn't need the tour replayed).
- [ ] **An About/Contact surface.** Who built this, how to send feedback
  or report a wrong question (ties into item 1's feedback path) — likely
  a footer link or a row inside the hamburger menu.
- [ ] **A visible "what's new" / changelog.** So a returning user notices
  something changed, rather than silently getting a new build — this
  also gives the existing service-worker cache-bump discipline something
  user-facing to point at.
- [ ] **Real cross-device/cross-browser QA.** iOS Safari, Android Chrome,
  desktop Firefox/Edge, on actual hardware — the Playwright emulation
  used throughout this project's development is a good first pass but
  not a substitute for the real thing before public launch.
- [ ] **Content-currency messaging.** Cert exam objectives change over
  time; consider a small "content last reviewed" note per track, plus
  clear wording that this is a study aid, not a guarantee of passing.

## 4. Branding & trademark due diligence

- [ ] **Trademark-check the site/app name** before public launch — make
  sure whatever name is chosen doesn't collide with an existing product.
- [ ] **Keep the screenshot attribution visible and reachable** — the
  real Azure Portal screenshots are CC BY 4.0 from Microsoft's own
  MicrosoftDocs GitHub repos with inline captions already; add a
  dedicated About/Credits page once public so the attribution isn't only
  buried inline.
- [ ] **Confirm no content resembles a copyrighted "exam dump."**
  Everything here should stay original explanations and questions, never
  reproductions of real exam items — worth a final pass before launch.

## 5. Nice-to-have, not blocking

- [ ] Basic uptime monitoring (most static hosts are reliable enough at
  small scale that this is optional).
- [ ] A dedicated feedback email/alias for the site, separate from a
  personal inbox.

---

When you're ready to move on any of these, the legal documents (Terms,
Privacy Policy, Disclaimer, cookie/local-storage disclosure) are the
fastest to get a solid first draft of, precisely because today's data
story is simple and easy to describe honestly. Say the word and I'll draft
starter text for each as real in-app pages (not just files sitting
unlinked in the repo) once you're ready to start on this list.
