# E-ink study pack and progress log (format v1)

How flashcards and quizzes can run **on** an e-ink reader that has no browser (the Seeed reTerminal Sticky), and how
what you do there gets back into the app. There are two halves:

- **This repo (built and tested):** `tools/eink_pack.py` writes the study pack; Data & Progress has
  "Import e-reader progress", which merges the reader's log into the app (`src/js/03g_eink_sync.js`,
  `tools/check_eink.js`).
- **The reader's firmware (not built yet):** a study mode that reads the pack and writes the log. On the Sticky that
  means a fork of CrossPoint Reader, because its maintainers rule interactive apps out of scope and its SD plugins do
  not run code on the device. This file is the contract that firmware has to meet.

Nothing here needs a server or an account.

## Files on the SD card

```
/study/manifest.json            tracks in the pack
/study/<track>/cards.jsonl      one flashcard per line
/study/<track>/questions.jsonl  one question per line
/study/state.json               optional: the schedule carried over from the app
/study/progress.jsonl           written by the reader: what you did
```

All files are UTF-8. The `.jsonl` files hold one JSON object per line, so firmware can read a line at a time with a
small buffer and index items by byte offset instead of loading a file whole.

### manifest.json

```json
{"pack": "cert-study-eink", "v": 1, "built": "2026-11-11",
 "tracks": [{"key": "ccna", "label": "CCNA", "subtitle": "Cisco Certified Network Associate (200-301)",
             "categories": ["Network Fundamentals", "Network Access"], "cards": 233, "questions": 201}]}
```

### cards.jsonl

```json
{"id":"f7","c":0,"term":"Trunk port","prompt":"A _____ carries several VLANs over one link ...","def":"A trunk port carries several VLANs over one link ...","eg":"..."}
```

| Field | Meaning |
|---|---|
| `id` | The app's card id. Log it back unchanged. |
| `c` | Index into the track's `categories`. Lines are in category order. |
| `term` | The answer. |
| `prompt` | Optional. The definition with the term blanked (`_____`). When absent, show `def` as the prompt. |
| `def` | The definition, shown with the term on the answer side. |
| `eg` | Optional example, shown on the answer side. |

Show the prompt, wait for a tap, show term + definition + example, then take **Got it** or **Don't got it**.

### questions.jsonl

```json
{"id":"q1","c":0,"type":"mc","q":"...","opts":["...","..."],"ans":[2],"why":"..."}
```

`type` is `mc` (one answer), `ms` (several: all of `ans`, and only those, must be picked) or `tf` (`opts` is
`["True","False"]`). `ans` holds indexes into `opts`. The reader may shuffle `opts`, since explanations never refer to
an option by position. Questions that need a picture are not in the pack.

### state.json (optional)

Written when the pack is built with `--progress <the app's progress export>`:

```json
{"pack":"cert-study-eink","v":1,"synced":{"id":"k3f9a2","applied":120},
 "srs":{"ccna":{"f12":{"due":1763000000,"iv":6,"ease":2.5,"reps":2,"last":4}}}}
```

`due` is Unix seconds, `iv` the interval in days. `synced` says how much of the reader's own log that export already
included: if `synced.id` equals the id in `progress.jsonl`, replay only the log lines after the first `applied`
events; otherwise replay the whole log. A reader with no `state.json` starts every card as new and replays its log.

## Scheduling on the reader

Use the app's SM-2 (`nextSrsEntry` in `src/js/03_helpers.js`) so both sides agree:

- Got it is quality 4, Don't got it is quality 1.
- Quality below 3: `ease = max(1.3, ease - 0.2)`, `interval = 1`, `reps = 0`, due now.
- Otherwise: `reps += 1`; `ease = max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`; interval is 1 day at
  `reps` 1, 6 days at `reps` 2, then `round(interval * ease)`; due = now + interval.
- New cards start at ease 2.5. Study order: due or never-rated cards first, most overdue first.

The reader's schedule only has to be good enough to pick cards. The app recomputes its own schedule from the log, so
the app stays the source of truth.

## progress.jsonl (the reader writes, the app reads)

Append one line per event and flush; never rewrite earlier lines.

```json
{"log":"cert-study-eink","v":1,"id":"k3f9a2"}
{"k":"c","tr":"ccna","id":"f12","q":4,"t":1762825000}
{"k":"q","tr":"ccna","id":"q3","ok":1,"t":1762825060}
```

| Line | Fields |
|---|---|
| Header | Written once when the file is created. `id` is any random string; it names this log so the app can tell a continued log from a new one. |
| Card rating | `k:"c"`, track `tr`, card `id`, `q` from 1 to 5 (4 for Got it, 1 for Don't got it). |
| Question | `k:"q"`, track `tr`, question `id`, `ok` 1 for right or 0 for wrong. |

`t` is Unix seconds and optional. A reader with no clock leaves it out (or writes 0), and the app uses the import time.
If the file is deleted, start a new one with a new `id`.

## What the app does on import

Data & Progress, then "Import e-reader progress", then choose `/study/progress.jsonl`.

- It **merges**. Each card rating runs through the app's SM-2 and counts as correct (3 or more) or incorrect; each
  question sets its result and when it was last seen; misses feed the weak-subjects log. Nothing else is touched.
- It remembers the log's `id` and how many events it has applied, so importing the same or a longer copy of the log
  only adds the new lines.
- An event with a real time that is older than what the app already holds for that item is skipped, so studying in
  the app afterwards is not rolled back. Events with no time cannot be judged and are applied.
- Events for tracks or items this version of the app does not have are skipped and counted in the message.
- Streaks and the daily goal are not changed by an import.

## Trying it without a reader

```
python3 build.py
python3 tools/eink_pack.py ccna --sample-log 40      # writes eink-out/study/, with progress.sample.jsonl
```

Open the app, go to Data & Progress, choose "Import e-reader progress" and pick
`eink-out/study/progress.sample.jsonl`. The sample is made-up answers, so export your progress first if you want to
undo it. `node tools/check_eink.js` runs the automated checks.
