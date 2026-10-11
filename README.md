# Cert Study Hub

A self-contained study app for certification prep — built iteratively in
Claude.ai as a published artifact, exported to run locally, and now built from a
proper Python source tree instead of one giant file.

## What's inside

The bottom bar has Home and Profile plus four top-level tabs per track: **Path** (a guided, Duolingo-style walk
through the track — see below), **Practice** (every quiz and game, picked
from one grouped dropdown), **Reference** (the study material), and
**Exam**. Reference holds three sub-views — Cards (flashcards, ordered by a real SM-2 spaced-repetition
schedule and rated on the same 1-5 confidence scale SM-2 was originally
designed around — 1 "Blank" through 5 "Easy" — rather than a binary
right/wrong; a 3+ resurfaces the card later by a growing interval, under
3 resets it sooner. The order is computed fresh each time you enter a
category/track rather than reshuffling mid-session; once any card has been rated 3 or lower a
"Tough terms" deck appears beside All cards — the cards you last rated OK or below, hardest first,
where a 4 or 5 graduates a card out — and the Path map links to it too) and Study
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
Practice rather than Reference since it's a recall
self-test like the rest of Practice, not a reading/reference view like Cards or
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
length/pass mark, in two flavors: the **practice exam** (navigate freely,
change answers, submit whenever) and a proctored-style **Final Mock** —
same questions and clock, but every answer locks the moment you move on,
there's no going back or submitting early, nothing is shown until the end,
and the result is a straight pass/fail at the real pass mark with a
per-area score report like the real one. Once you've attempted anything in a track, its Exam tab
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
already recorded. Every Path/Practice/Reference/Exam view for a track ends with a
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

**My Cert Path** — consolidated right on Home once you have one (see
"Home" below) — lets you put whichever certs you're actually planning to
take into your own order — not a curated sequence, your sequence. It
always surfaces an "Up next" card for the
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
opens a small flyout anchored to that word (front/back/detail,
sourced from that track's own flashcards), not a block appended below the
whole paragraph or card — it closes on a second tap, on Escape, or on tapping
anywhere else. The flyout is a fixed-position box that always stays fully on
screen: it opens to the right of a word, to the **left** when the word is near
the right edge, and above the word when there is no room below; it follows the
word while you scroll and never makes the page wider (tall definitions scroll
inside the box). Curated tracks (AZ-900, AZ-104) use a hand-picked term list;
every other track auto-detects terms by matching flashcard fronts against
the surrounding text, so coverage scales to new content with no
per-question authoring needed.

**Flyouts spell out acronyms.** Every flyout says what its acronym stands
for: tap `RBAC` and it opens with "**RBAC** stands for Role-Based Access
Control", then the card's definition. Acronyms that appear in a card's
definition get a short "Acronyms" footer (capped at six). Those expansions
live in `data/acronyms.py` (`ACRONYMS`, about 470 entries; an entry is
`{'exp': 'text' | ['meaning 1', 'meaning 2'], 'trigger': False}` where
`trigger: False` stops a trivial token like ID or OS from being tappable by
itself). An acronym with several meanings (CA, CI, MDM, SAS, SOC...) lists
them all, best match for the surrounding text first, with the others shown
as "(also: ...)". Matching is alias-based: a card is found by its front, its
front without a trailing parenthetical, a parenthetical acronym
("Role-Based Access Control (RBAC)" is also matched by "RBAC"), or either
half of an "A vs. B" front, and an acronym that has no flashcard of its own
still gets a definition-less "Stands for ..." flyout. Flyouts now also work
on lesson sections (summary, fundamentals, scenario, traps, on the job),
case-study scenarios, cheat-sheet points, final-exam results, Home bridges
and deep dives, all through one `GlossText` component. The Glossary has a
**Terms / Acronyms** switch so you can browse or search the expansions
directly.

`python3 build.py` **fails** if the content uses an acronym-shaped token
(2+ capitals/digits, used at least twice) that is neither in `ACRONYMS` nor
in the `IGNORE` set of non-acronyms (plurals are covered by the singular).
`python3 build.py --check-acronyms` lists what's missing. Add the expansion,
or add the token to `IGNORE` if it isn't an acronym.

The Exam tab for each track links out to real official study resources —
Microsoft Learn study guides and certification pages for the Microsoft
tracks, PeopleCert for ITIL, CompTIA for Cloud+, and HL7 International's
FHIR/V2 specs for the EHR Integration module. Individual categories get
their own more specific "Learn more" links too (see `resources` on each
track's `CATEGORIES` in data/&lt;track&gt;.py) — shown on Study section pages, a
lesson's Vocabulary block, and the cheat sheet.

Some portal mockups are step-by-step **interactive walkthroughs** rather
than one static illustration — a "Create a virtual machine" lesson (both
AZ-900 and AZ-104 share this one) clicks through Basics → Size →
Networking → Review + create → a completion screen, with a step counter,
progress dots, and Back/Next controls. Any existing mockup can be
upgraded the same way by adding an entry to `PORTAL_WALKTHROUGHS`
(02_portal_mockups.jsx) keyed by the same string the lesson's
`portalMockup` field already uses — no lesson data changes needed; every
other mockup keeps rendering as its original single static illustration.

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
quiz/exam questions. DP-300 (`images/azuresql/`, from `MicrosoftDocs/sql-docs`),
AZ-802 (`images/windowsadmincenter/`, from `MicrosoftDocs/windowsserverdocs`),
and SC-300 (`images/entra/`, from `MicrosoftDocs/entra-docs`) each added one
more this way. Note `learn.microsoft.com` itself is blocked by this
project's dev-session network policy, so every `sourceUrl` here points at
the GitHub blob in Microsoft's own public docs repo rather than the
rendered page — the same content, just a verifiably-live link. More tracks
are a straightforward data addition now that the slot exists — see
ROADMAP.md section 12 for which ones are still blocked on finding a
properly-licensed source. A screenshot's optional
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
(`GlossaryPanel` in 04b_panels_ui.jsx): every visible track's flashcard
fronts merged by lowercased/trimmed text (so identical terms across
tracks collapse into one entry with both tracks' badges, while genuinely
different phrasing per track stays separate), searchable, with
expand/collapse per entry.

A trophy header button opens **Achievements** — 17 milestone badges (mastery,
streaks, quiz/exam/match/case-study counts, course completion) plus a daily streak
counter, all computed from progress already being tracked, no new data
entry required. A gear **Data & progress** button opens export/import
(download all progress as a JSON file, or restore from one — the only
backup/device-migration option, since the app has no accounts) alongside
the existing per-track reset and a **Voice & speech** section — a rate
slider and a voice picker (from `speechSynthesis.getVoices()`, English
voices sorted first, then by a quality heuristic within that — see
below) for every 🔊 Listen button in the app, with a "Test voice" preview
button. Both the theme and these speech settings are per-device
localStorage preferences, not synced progress. Both use small
wireframe (line-art) icons rather than emoji, matching the hamburger menu
below.

There's no separate "TTS agent" here to swap for a better one — every
🔊 Listen button and Verbal Quiz mode call the browser's own
`speechSynthesis` directly, and a genuinely better cloud neural voice
(ElevenLabs/OpenAI/Azure/Google) would mean a bring-your-own-API-key,
per-character-cost, online-only dependency that breaks this app's
fully-static/free/offline-capable design. Two free improvements instead:
picking a voice by a name-based quality heuristic
(`voiceQualityScore`/`bestVoiceForLang` in 03_helpers.js — "Natural",
"Online", "Neural", "Premium", "Enhanced", "Wavenet", or "Studio" in the
name, or a non-`localService` voice, both usually mean a nicer cloud-
backed voice rather than the OS's older on-device default) instead of
leaving the choice to the browser's own arbitrary default when you
haven't picked one yourself; and speaking text as a chain of
sentence-by-sentence utterances (`splitIntoSpeechChunks`) rather than one
long unbroken one, which several engines render flatter/more monotone on
and which can hit a hard length cutoff on very long text. A generation
counter guards the chain so any cancellation — toggling Listen off,
switching tracks, unmounting — reliably stops it even on browsers that
fire `onend` rather than `onerror` on an interrupted utterance.

Opening the app always lands on **Home** (`HomeView` in `04a_home_ui.jsx`)
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
- **If you have an active cert path, Home leads with it** —
  `CertPathHomeSection` in 04a_home_ui.jsx, not a card linking out to a
  separate panel. The first not-yet-passed cert gets a full "up next"
  hero: mastery, exam readiness (see below), a scheduled-date countdown
  badge if you've set one (red if overdue, gold inside a week), and a
  tap takes you straight into it. Every cert after it in your path is a
  compact numbered row with the same tap-to-study action. A
  the header's hamburger button (see below) opens the same reorder/
  schedule/add/remove/mark-passed panel this always had (still the only
  place you edit the path itself) — Home is for seeing your path and
  jumping into it, not editing it. The **readiness prediction** below (`stats.readinessHistory`
  logs one score snapshot a day per track; `readinessProjection` draws a
  straight line through the oldest and newest snapshots to estimate how
  many days of study, at that pace, would cross the 80% mark — e.g. "At
  your current pace, AZ-900 could be exam-ready in about 12 days (around
  Oct 7)," or says so plainly with too little history or a flat/declining
  trend) is folded straight into that hero rather than shown twice.
- **If your path is empty**, Home instead leads with the full 15-track
  browser itself, expanded (not the old collapsed dropdown) — the thing
  a new user actually needs is right there, not buried below the daily
  cards. Each row gets a small "+" to add it to your path without
  leaving Home or opening the manage panel; tapping the row itself still
  goes straight into studying it. The standalone readiness card only
  shows here (an empty path has no hero to fold it into), for whichever
  track you last visited, or AZ-900 by default.
- A **study path** across your whole cert plan: one trail of the units from
  every cert you've added, in plan order, with an up-next step that runs right
  on Home, the next few steps tagged by cert, the up-next cert's exam
  countdown and readiness, and a "Go deeper" link into the cert itself.
  Progress is the same progress each cert's own Path tab shows. A switch
  chooses **Just my certs** or **Extended learning**, which mixes in optional,
  skippable sections: a deep dive on the unit's terms, bonus games, and
  cross-cert "bridges" that teach an idea several certs share and how each
  frames it. A second switch can order certs by your cert path or by exam date and then weakest. An "Already know this? Test out" link skips an untouched unit.
- A **Review across your certs** card: Weak spots (missed questions), Tough
  terms (flashcards rated OK or lower), and Missed games, plus a single
  "Review everything due" round that mixes all three — drawn from every cert in
  your plan, with each answer recorded to its own cert. A selector on that card
  sets an in-app review reminder (Off, Daily, Every 3 days, Weekly; default
  every 3 days) that shows once something is waiting and you haven't reviewed
  for that long; finishing a deep dive or a bridge adds a small flat bonus to
  the daily goal.
- A compact **Your certs** list (order, path progress, exam countdown,
  mastery) with the cert you're studying marked.
- A **"Continue where you left off"** button once you've actually
  visited a track this browser (tracked separately from the path, so
  Home is never mistaken for "a place you left off at").
- A **Question of the Day** (collapsed to one row until tapped) and **Vocab of the Day** — one question and
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
- Once you have an active path, a collapsed **"Browse all tracks"**
  dropdown sits below it for adding more certs or one-off studying
  outside your path — the same rich rows (colored label, subtitle, live
  mastery %/passed/scheduled badge, "+" to add to path) as the empty-path
  browser above, just secondary once a path exists instead of the main
  event.

From inside any track, the track name itself in the header is now a
button — tapping it opens a **track switcher** (`TrackSwitcherSheet`)
right there from any tab, no trip back to Home required: your cert
path listed first (numbered, same order as Home), every other track
below it, current track highlighted. Picking one always lands you on
that track's Path — Practice/Exam session state isn't built to survive an
`activeTrack` swap mid-session, so this sidesteps that instead of risking
it.

Navigation follows a gamified-learning-app layout. A slim, sticky top bar
holds a ☰ button (titled "Manage cert path", always opens `CertPathPanel`),
the track chip (tap to switch tracks), your streak, the theme switch,
achievements, and settings. A fixed bottom tab bar (`BottomTabBar` in
04b_panels_ui.jsx) holds Home / Path / Practice / Reference / Exam; Home is the
cross-cert dashboard (its tab button is titled "Home"), and the other four act on
the track named in the top bar. The Path tab draws each unit as a sticky banner
over a winding trail of large round nodes (done, current with a START bubble,
checkpoint, upcoming), with up to three stars from a step's stored score.
Home draws the same trail for the cross-cert path (the up-next step as a big node in
its cert's colour, then the next few). Finishing a step shows a celebration screen
(stars, confetti on a perfect score or a finished unit, streak and daily-goal
chips), and moving to the next question scrolls back to the top.
On a cert's Path tab, a unit stays locked until the one before it is finished (or
you tap "Unlock anyway"; units you've started never lock), and a chime can play
on step completion. Both are switches under Data & Progress → Path & sounds.
Your own terms can be limited to one cert and saved straight from a flyout, and Practice > Sequence lets you build your own step-ordering scenarios (with a step bank) alongside the built-in ones. Answer sounds also cover the Match, Compare, Mad Libs, Sequence and command games.
Every cert accent, unit banner and tab has its own hue in both themes. The **Profile** tab (`#/profile`, `04g_profile_ui.jsx`) shows a study level, stat tiles (streak, days studied, questions, cards, path steps, exams), a 12-week activity map, earned certifications you can mark or undo, your plan with exam dates, and achievements. Path units now have 11 steps, with a Match round, a Quick-fire true or false set and a second game woven in (saves from earlier versions are migrated once). Practice question stems carry tappable definitions, and there are about 550 more flashcards (1,736 in all) and 507 acronym expansions.
Fonts are self-hosted (`fonts/`) with an OpenDyslexic option, every image and font is precached for offline use, and the Glossary has a **Mine** tab for your own terms and acronyms, which then appear in flyouts. Sounds (celebration chimes and right/wrong answer tones) are opt-in in Data & Progress.
Call-to-action buttons use `.btn-3d` (a solid pressable edge), and the font is
Nunito, loaded from Google Fonts, with Inter as the fallback.
Navigation is also real client-side routing, not
just in-memory state: the URL hash always reflects where you are
(`#/az900/practice/questions`, `#/az900/path`, `#/home`), so the browser's back/forward
buttons walk through actual
app history instead of doing nothing, and a link straight to a specific
track+mode+sub-tab lands there directly on load — hash-based rather than
real paths, deliberately, since a static site with no server has nowhere
to add the rewrite rule a path router needs for a refreshed deep link to
resolve, and a hash needs none (see `routeToHash`/`parseHash` in
`03_helpers.js`; the old `/learn` and `/quiz` URL segments still resolve to
Reference and Practice, so existing bookmarks keep working). Practice and Exam missed-question review lists show each question's
explanation alongside the prompt, not just what you got wrong. A
hand-picked 66 of the 1263 questions (the genuinely trickiest — multi-
concept traps, scenario questions with subtly-wrong distractors) also
carry a `whyTested` field: a small "Why this is tested" note shown right
alongside the explanation, everywhere the explanation shows (live quiz,
exam, both missed-question reviews) — the meta-level reason an exam
probes that exact distinction, distinct from the explanation's own job
of saying why the correct answer is correct.

Every lesson (all 85, across all 15 tracks) also carries an `onTheJob`
field: a short, teal-accented "On the job" callout shown after "Common
exam traps" — real-world context that goes beyond exam scope entirely
(what actually gets a cloud migration approved, what a SOC analyst's
alert fatigue really looks like, HIPAA-adjacent PHI-access realities for
EHR Integration) rather than pretending to be examinable content.

Practice's tools (Questions, Compare, Case Study, Mad Libs, Sequence, Match,
Commands, Verbal) are chosen from one grouped dropdown — Test yourself,
Games & drills, Hands-free — that only lists what the track supports,
instead of a row of eight tabs; wherever this README says "sub-tab" for one
of them, read "practice tool". Verbal is one of those tools —
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

Every track now ships `MADLIBS` content (79 scenarios total, 5-7 per
track) and gets a **Mad Libs** sub-tab: a short real-world scenario paragraph with a
couple of inline dropdown blanks, each filled from a small set of term
choices — reinforces vocabulary in context instead of as an isolated
flashcard front/back. Unlike Verbal Quiz and Commands above, this one
*does* feed into mastery %/results the normal way (scored all-or-nothing
per scenario — every blank right, or it counts as one miss, the same
logic the app's multi-select questions already use).

Tracks with `SEQUENCES` content (AZ-104, AZ-305, ITIL, and AZ-802 today)
get a **Sequence** sub-tab: shuffle the steps for a stated real-world
procedure — deploying a VM behind a load balancer, designing an isolated
landing zone, the ITIL Continual Improvement Model — and arrange them
back into the right order with simple up/down move buttons (no drag-
and-drop needed). Also feeds mastery %/results the normal way, scored
all-or-nothing per sequence.

Every track now ships `CASE_STUDIES` content too (18 case studies total,
1-2 per track, 71 embedded questions) and gets a **Case Study** sub-tab: a shared
scenario paragraph (a fictional company/situation) with several related
questions answered off it in sequence, mirroring how a real associate/
expert-level exam groups multiple questions under one larger case instead
of testing each fact in isolation. Each embedded question reuses the exact
same mc/tf/ms `QuestionView` every other quiz question uses — only the
scenario and the grouping are new — so unlike Mad Libs/Sequence above
(scored all-or-nothing per item), each case-study question is scored
individually the same way a regular quiz question is, matching how a real
case study's questions are graded independently.

Tracks with `COMPARE` content get a **Compare** practice tool ("choose the
more correct answer"): a scenario with two options that are *both*
plausible, where only one is the better fit — pick it, then read why
the runner-up falls short. This exercises the best-answer-not-just-a-
correct-one judgment real Microsoft/CompTIA exams lean on, which plain
multiple choice can't quite reach. The displayed A/B order is re-
shuffled per session so position never gives the answer away. Feeds
mastery %/results the normal way, scored all-or-nothing per item.

The **Path** tab is the default way into a track — a guided, Duolingo-style
walk through its content instead of choosing among tools yourself. Each
lesson becomes a unit, and each unit is a run of steps in a deliberately
mixed order rather than "read everything, then quiz everything": read the
lesson, flashcards, a quick-check quiz, a mini-game (a Compare, Mad Lib,
Sequence, or Match round, whichever the unit has), an apply-it scenario with
the portal mockup and on-the-job note, more flashcards, a longer practice
quiz, and a unit checkpoint. The order rotates between units so consecutive
ones don't feel identical. Everything is visible and nothing is locked: a
"Continue" button always opens the first step you haven't finished, and the
current unit is open while finished ones fold away. Quiz steps need 70% to
count (a miss shows the explanations and offers a fresh set), the checkpoint
mixes the unit with up to three questions you've missed from earlier units,
and **Already know this? Test out** runs a 10-question check at 80% that
marks a whole unit done. Once any started unit has missed questions, a
**Review weak spots** card pulls the longest-neglected ones back — from the
path and from Practice alike, since both write to the same results.
Nothing here needs extra authoring: units are built from each lesson's own
vocab and quiz ids, and every other flashcard, question, Mad Lib, sequence,
and Compare item in the same categories is handed to exactly one unit
(round-robin), so every question in a track is reachable from its path. Each
step reuses an existing view over its own set of items and records through
the same handlers Practice uses, so mastery, spaced repetition, streaks, the
daily goal, and achievements need no path-specific scoring. Progress lives
in `stats.path` and persists and syncs like everything else. See
`buildPathUnits` and friends in `03_helpers.js` and `04e_path_ui.jsx`.

Every multiple-choice question across all 15 tracks has been through a
wording-giveaway audit — checking that the correct answer isn't
identifiable just from being longer, more specific, free of absolute
language ("always"/"never"), or an echo of the question's own wording,
independent of actually knowing the material — plus a real easy/medium/
hard difficulty mix per track (not uniform difficulty), weighted across
categories by their real exam marks. The question bank grew from 1126 to
1263 in the same pass.

**Fifteen tracks, all visible in the track switcher, and all with full course/
lesson mode** (not just a flat question bank — every track now has the same
Learn-tab lesson-by-lesson course treatment: reading, key terms, diagrams
where one genuinely fits, vocab/quiz call-outs, and common-traps notes):
- **AZ-900** (Azure Fundamentals) — full course content, 119 questions, 7 lessons.
- **AB-650** (M365 & AI Services Administrator) — full question bank (77
  questions, 5 lessons); tenant administration, governance/compliance, and
  Microsoft 365 Copilot/AI-services management. Replaces the retiring MS-102.
- **AZ-104** (Azure Administrator) — full question bank (87 questions) and the
  same course treatment as AZ-900 (7 lessons, diagrams, mockups).
- **DP-900** (Azure Data Fundamentals) — full question bank (71 questions, 5 lessons).
- **DP-300** (Azure Database Administrator) — full question bank (73 questions, 5 lessons).
- **AZ-305** (Azure Solutions Architect Expert) — full question bank (81 questions, 6 lessons).
- **AZ-802** (Windows Server Administrator) — full question bank (81 questions,
  6 lessons); consolidates what used to be separate AZ-800/AZ-801 tracks,
  matching Microsoft's real exam consolidation (AZ-800/801 retire Sept 30, 2026).
- **AZ-140** (Azure Virtual Desktop Specialty) — full question bank (87 questions,
  5 lessons); host pools, FSLogix, MSIX app attach, AVD identity/security, and monitoring.
- **MD-102** (Endpoint Administrator) — full question bank (80 questions, 5 lessons);
  Intune, Windows Autopilot, device compliance/security, and app management.
- **SC-300** (Identity & Access Administrator) — full question bank (75 questions, 5 lessons).
- **SC-200** (Security Operations Analyst) — full question bank (75 questions,
  5 lessons); Defender XDR/Sentinel operations, incident response, and real
  KQL-based threat hunting.
- **SC-500** (Cloud & AI Security Engineer) — full question bank (87 questions,
  5 lessons), including current AI-security content (Copilot, Microsoft Foundry
  agents, Entra Agent ID).
- **ITIL Foundation** (Version 5) — full question bank (106 questions) plus full
  course mode (7 lessons covering the Value System, Guiding Principles, the Four
  Dimensions, the Continual Improvement Model, and the Product/Service Lifecycle).
- **CompTIA Cloud+** (CV0-004) — full question bank (82 questions) across all
  five exam domains, plus full course mode (6 lessons: deployment models &
  virtualization, scaling & resilience, security, deployment strategies,
  operations/governance, and troubleshooting).
- **CCNA and the ISC2 certifications** — seven tracks added together:
  **CCNA** (Cisco 200-301, v1.1: 233 flashcards, 201 questions, 14 lessons and
  45 typed **Cisco IOS** command challenges), **ISC2 CC**, **SSCP**, **CISSP**,
  **CCSP**, **CGRC** and **CSSLP** (about 2,170 flashcards and 2,200 questions across the
  seven, each with a guided Path, games, a cheat sheet and an exam-day strategy
  section). Each cert states its **work-experience requirement** (for example CISSP
  5 years, CCSP 5 years, CSSLP 4, CGRC 2, SSCP 1, CC none, CCNA 1 recommended) as a
  chip on the cert lists, the Path header and the Profile plan, and as a full card on
  the Exam tab with the waivers and the Associate of ISC2 route. Each ISC2 track was then
  audited objective by objective against the official exam outline (CC effective September 1, 2026;
  CCSP August 1, 2026; SSCP October 1, 2025; CISSP April 2024; CGRC June 2024; CSSLP September 2023),
  with the missing objectives filled in, facts corrected (for example NIST SP 800-88 Rev. 2,
  SP 800-61 Rev. 3, OWASP Top 10:2025) and exam formats fixed; the CCNA topic list could not be
  checked because Cisco's page is gated, so confirm it before you book. ISSAP, ISSEP and ISSMP are not covered. Most lessons carry a diagram
  (CCNA 13, CISSP 14, CCSP 8, CSSLP 7, CC 6, SSCP 6, CGRC 5), each in its own
  `src/js/01a_diagrams_*.jsx` file.
- **Weak subjects** (Path tab → "Weak spots", `#/<cert>/path/weak`) — turns what you got wrong
  into a study plan. Each answer already updated "last outcome"; a new **miss log** adds how
  often and how recently an item was missed. For every cert the app ranks the *lessons* your
  misses point back at (repeat and recent misses weigh more, tough flashcards, mini-game and
  case-study misses count, and areas worth more of the exam rank higher), says why in one line,
  and lists what to review: the reading (with the official links for that area), the flashcards
  that match the questions you missed, and the missed questions themselves, each one tap away.
  One button turns the ranking into a **weak-subjects path** in a new study order (most urgent
  first): re-read, targeted flashcards, a quiz built around your misses with a few fresh
  questions, an optional game and a retest. It runs on the same step runner as the course path,
  keeps its own progress, shows how many of the original misses are fixed, and can be rebuilt
  from your latest results. Entry points: the Path tab switch, a Home card and the exam results
  screen. The ranking is pure logic (`src/js/03d_weak_path.js`, 104 checks in
  `tools/check_weak_path.js`, run by build.py when node is installed).
- **IT Playground** (`#/playground`) — a sandbox outside any cert, reached from a card
  on Home. Ten tools; all but the calculator have a free sandbox and guided troubleshooting
  scenarios (starter, core, stretch; 75 in all): a **subnet calculator** (network, broadcast,
  host range, wildcard, binary view with the network/host boundary, step-by-step working,
  split a network, same-subnet checker, **VLSM** planner, a subnetting drill and an **IPv6**
  tab: compression, expansion, address types, EUI-64 and /64 subnetting); an **IP
  configuration lab** (hosts, default gateways, masks and static routes; ping and read the
  trace that names the first thing that breaks); a **VLAN playground** (two switches, access
  and trunk ports, allowed lists, native VLANs, router on a stick, MAC address tables that
  fill as switches learn and flood, and port security with sticky MACs and violation modes);
  a **firewall and port-forwarding tester** (ordered rules with implicit deny, port forwards,
  source NAT, stateful versus stateless, hairpin NAT); a **DHCP lab** (scopes, exclusions,
  relay, lease exhaustion); a **DNS lab** (records, caching, TTLs, resolvers); a **spanning
  tree** lab (root election, port roles, link failures); a **site-to-site VPN** tester
  (tunnel up but no traffic: selectors, routes, NAT exemption); an **Azure NSG** tester
  (priorities, default rules, subnet versus NIC level) and a **certificate checker**
  (expiry, name match, chain, trust). Every lab can **predict first** (guess the cause
  before running; the score is kept on the device), saves its sandbox setup on the device
  with reset and export/import, and collapses its tall editors. A progress card tracks
  scenarios fixed and a few milestones. 41 lessons that teach a tool (CCNA, CC, SSCP, CISSP, SC-500 and the Azure tracks)
  show a "Try it in the Playground" link that opens the matching tool or scenario. Nothing in the
  Playground touches mastery, results, the daily goal or readiness. The simulations are
  deliberately simplified (no vendor-exact behaviour; each tool says what it leaves out).
  The engines are pure JavaScript (`src/js/03b_playground_engine.js` for the core tools and
  one `03c_pg_<tool>.js` per extra tool); `tools/check_playground.js` (about 1,800 checks)
  unit-tests them and replays every scenario's broken and fixed outcomes, and build.py runs
  it when node is installed. **Adding a tool** needs four new files and no shared edits:
  `src/js/03c_pg_<k>.js` (engine), `src/js/04l_pg_<k>.jsx` (screens, ending with a
  `PLAYGROUND_EXTRA_TOOLS.push({...})`), `data/playground_<k>.py` (`SCENARIOS`, `SANDBOX`,
  optional `LESSON_LINKS`, `validate()`) and `tools/checks/<k>.js`; build.py discovers and
  validates them.
- **EHR Integration** — *not a certification.* Epic (the dominant hospital EHR
  vendor) requires employer sponsorship to even take its exams, and its exam
  content is proprietary, so there's no legitimate way to build real cert-prep
  for it. This track instead covers general, publicly-documented healthcare
  interoperability knowledge (HL7v2, FHIR, integration-engine architecture,
  healthcare data governance) — 82 questions, 6 lessons, clearly labeled as a
  self-study concepts module rather than a real exam.

To hide a track again (e.g. while it's a work in progress), open `data/tracks.py`
and add `'hidden': True` to that track's entry, then rebuild (see below).

## Source layout

The shipped app is still a single static `index.html` (so it keeps working as an
offline-installable PWA with no server), but that file is now **generated** —
don't edit it directly, it'll be overwritten. The real source is:

```
data/
  tracks.py     — TRACKS (which certs exist / are visible) and EXAM_CONFIG
  acronyms.py   — acronym → expansion dictionary for flyouts (coverage enforced by build.py)
  itil.py       — ITIL categories, flashcards, questions, course lessons
  az900.py      — AZ-900 categories, flashcards, questions, course lessons
  az104.py      — AZ-104 categories, flashcards, questions, course lessons
  cloudplus.py  — CompTIA Cloud+ categories, flashcards, questions, course lessons
  ccna.py, cissp.py — combine ccna_a/_b and cissp_a/_b (two parts each, written in parallel)
  isc2cc.py, sscp.py, ccsp.py, cgrc.py, csslp.py — the ISC2 tracks (experience requirements live in tracks.py)
  playground.py — guided scenarios for the IT Playground (validated by build.py, replayed through the engine)
  playground_<tool>.py — one file per extra Playground tool (dhcp, dns, stp, vpn, nsg, certs), auto-discovered
tools/
  check_weak_path.js  — unit tests for the weak-subjects engine against the real content
  check_playground.js — unit tests for the Playground engines plus a replay of every scenario
  check_flyout.js     — unit tests for the flyout placement maths
  checks/<tool>.js    — per-tool checks for the extra Playground tools (loaded by check_playground.js)
src/js/
  00_preamble.js        — React hook imports, the COLOR palette
  01_diagrams.jsx        — SVG lesson diagrams
  02_portal_mockups.jsx  — fake Azure Portal screenshots used in lessons; the term-flyout engine (alias matching, acronym lookup, GlossText)
  03_helpers.js          — shuffling, storage, question-prep helpers
  04a_home_ui.jsx        — Home, cert path, daily goal/question/vocab, achievements, Data panel
  04b_panels_ui.jsx      — About/Legal, Glossary, term flyout, category filter
  04c_lesson_ui.jsx      — flashcards, Study, cheat sheet, Match game, lesson/course view
  04d_quiz_ui.jsx        — practice tool picker, quiz setup, Verbal Quiz, CLI practice, Mad Libs, Sequence, Compare, Case Study, QuestionView/QuizSummary
  04e_path_ui.jsx        — the guided Path tab: unit map, step runners, test-out, weak-spot review
  03d_weak_path.js        — weak-subjects engine: miss log, lesson ranking, snapshot path (pure logic)
  03e_flyout_place.js     — where a definition flyout goes (open left/right, above/below, clamped to the screen; pure geometry)
  04m_weak_path_ui.jsx    — the Weak spots panel, path progress and the Home card
  03b_playground_engine.js — pure-JS simulation engine for the IT Playground (subnet maths incl. IPv6, ping, VLAN switching, firewall)
  03c_pg_<tool>.js       — engines for the extra Playground tools (dhcp, dns, stp, vpn, nsg, certs)
  04g_playground_core.jsx — shared Playground parts: cards, fields, predict-first, scenario shell, sandbox store, tool registry
  04h_playground_ui.jsx  — Playground shell and subnet tools; 04i (IP lab), 04j (VLANs), 04k (firewall), 04l_pg_<tool> (extra tools) hold the others
  05_final_exam_ui.jsx   — timed exam intro/runner/results (practice exam + proctored-style Final Mock)
  06_app.jsx             — CertStudyApp, the top-level component

  Files are concatenated in filename sort order (see build.py below), which
  is why they're numerically prefixed; the 04a-04d split (formerly one
  04_shared_ui.jsx) is purely for readability — see ROADMAP.md section 10
  for why 06_app.jsx stays a single file.
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

- **In-browser Babel is still a load-time cost, but a much smaller one.** Every
  page load re-transpiles the JSX in `src/js/` with Babel Standalone before React
  can render anything. The several MB of content (`DATA`, `BRIDGES`, ...) used to be
  inside that same Babel script, so Babel had to chew through all of it; it now sits
  in its own plain `<script>` ahead of the app code, so only the ~0.6 MB of app code
  is transpiled. Measured in headless Chromium: Home interactive in about 1.8 s,
  down from 3.8-4.8 s. Removing Babel entirely means precompiling the JSX as part
  of `build.py`, which needs a JS toolchain (Babel CLI or esbuild via Node) wherever
  the build runs — a bigger call since it adds a non-Python dependency to a build
  that's currently pure Python. Worth doing if load time on a phone still feels
  slow; hold off otherwise.
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
- **All remaining tracks now have full course/lesson mode too** — the previously
  "thin" (flat question-bank-only) tracks (DP-900, DP-300, SC-300, SC-200, AZ-305,
  AZ-802, AB-650, AZ-140, MD-102, SC-500, EHR Integration) each gained 5-6 lessons
  covering every one of their categories. Diagram reuse stayed honest rather than
  complete: several lessons ship with `diagram: None` where no existing
  `LESSON_DIAGRAMS` entry actually fit the content (notably AZ-802's on-prem
  Windows Server material and all of EHR Integration's HL7/FHIR material, where
  reusing an Azure- or ITIL-branded diagram would have been misleading rather
  than helpful). MD-102 gaining lessons also exposed a real regression — its
  5 category-level real screenshots were only ever rendered by the flat
  `StudyView`, and `CourseView` fully supersedes `StudyView` once a track has
  `lessons` — fixed by having `LessonDetail` fall back to a lesson's own
  category screenshot when it has no `portalMockup` of its own (see ROADMAP.md).
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
