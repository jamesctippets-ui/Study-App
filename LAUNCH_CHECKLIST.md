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

- [x] **Terms of Service / Terms of Use.** First draft shipped in-app: an
  "About & Legal" panel reached from the hamburger menu (`AboutLegalPanel`
  in `src/js/04_shared_ui.jsx`), covering that this is an independent
  study aid (not an official prep course or a guarantee of passing),
  acceptable use, original content, and liability limits. Written to
  match today's actual data footprint, not boilerplate — worth a real
  legal review before wider release, as the panel itself says.
- [x] **Privacy Policy.** Shipped in the same panel: no accounts, what's
  collected (nothing server-side; progress is `localStorage` or, inside a
  Claude artifact, the user's own Claude account), no cookies/analytics/ad
  tracking today, and a pointer to the existing Data & Progress export/
  reset for clearing your own data. Explicitly commits to rewriting this
  the moment that data footprint changes (e.g. a real backend gets added).
- [x] **Cookie / local-storage disclosure.** Folded into the Privacy
  Policy section above rather than a separate banner, since there's
  nothing here that actually needs consent yet (no tracking cookies) —
  revisit as its own item only once analytics or accounts are added.
- [x] **Disclaimer.** Shipped as its own "Disclaimer & trademarks"
  section: not affiliated with/endorsed by Microsoft, CompTIA, or
  AXELOS/ITIL, all content is original (not reproduced real exam
  questions), and screenshot attribution is called out explicitly.
- [ ] **Accessibility statement.** Not written yet — still needed: a
  short, honest note on current state (keyboard/screen-reader support,
  contrast, etc.) plus a contact path for reporting accessibility issues.
  Could be its own section in the same About & Legal panel.
- [ ] **Copyright/trademark footer notice on every page.** The Disclaimer
  section above covers the substance, but it's one tap into a menu, not
  visible by default the way a persistent footer would be — worth
  revisiting once this is on its own domain (a static site can afford a
  real footer; this single-page app currently can't without adding
  visual clutter the user specifically asked to avoid).
- [x] **A content-correction / feedback contact path.** A `mailto:` link
  in the About & Legal panel's "About Cert Study Hub" section.

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
  brand-new visitors covering: Home's "All tracks" dropdown (switching
  tracks), the Learn/Quiz/Exam tabs, the achievements button, and the
  cheat sheet's print button. Persist a `hasSeenTour` flag alongside the
  existing stats/localStorage; skip it automatically for anyone who
  already has results (a returning user doesn't need the tour replayed).
- [x] **An About/Contact surface.** Shipped as a row on the Home screen
  ("About & Legal"), exactly as scoped here (moved there from the
  now-retired hamburger menu once Home became the landing page).
- [x] **A visible "what's new" / changelog.** Shipped as a section in the
  same About & Legal panel — currently a short, manually-curated list;
  worth revisiting to auto-generate from commit messages once real
  releases are versioned, but manual is fine at this scale.
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
