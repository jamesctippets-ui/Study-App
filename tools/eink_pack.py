#!/usr/bin/env python3
"""Writes a "study pack" for an e-ink reader's study mode: the cards and questions as line-per-item JSON.

This is the data half of running flashcards and quizzes ON the reTerminal Sticky (see EINK_STUDY_PACK.md for the
format and what the firmware must do). The EPUB books from tools/eink_export.py are for reading; this pack is for a
firmware study mode that picks due cards, takes Got it / Don't got it and quiz answers by touch, and appends what you
did to /study/progress.jsonl. Data & Progress in the app imports that file ("Import e-reader progress").

It writes, under <out>/study/:

  manifest.json              the tracks in the pack, their categories and counts
  <track>/cards.jsonl        one flashcard per line
  <track>/questions.jsonl    one question per line (image questions are left out)
  state.json                 only with --progress: your current flashcard schedule, so the reader starts in step
  progress.sample.jsonl      only with --sample-log N: a made-up log to try the app's import with

Usage (run `python3 build.py` first so dist/data is fresh; Node is needed for the blanked prompts):

    python3 tools/eink_pack.py                         every track into ./eink-out/study
    python3 tools/eink_pack.py ccna az104              only these tracks
    python3 tools/eink_pack.py --out /Volumes/SD       write straight to the card (creates /study)
    python3 tools/eink_pack.py --progress cert-study-hub-progress-2026-11-11.json
    python3 tools/eink_pack.py ccna --sample-log 40    also write a sample log for testing the import

Only the Python standard library is used.
"""
import argparse
import json
import random
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from eink_export import DATA, by_category, masked_prompts  # noqa: E402

PACK_NAME = "cert-study-eink"
PACK_VERSION = 1
QUESTION_TYPES = ("mc", "tf", "ms")


def line(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"


def pack_track(out, key, data):
    """Writes one track's cards and questions; returns its manifest entry and the ids it wrote."""
    cats = [c["label"] for c in data["categories"]]
    cat_index = {c["key"]: i for i, c in enumerate(data["categories"])}
    folder = out / key
    folder.mkdir(parents=True, exist_ok=True)

    masked = masked_prompts(key)
    card_ids = []
    with open(folder / "cards.jsonl", "w", encoding="utf-8") as f:
        # Category order, so the reader can study one category by reading a run of lines.
        for _, cards in by_category(data.get("flashcards", []), data["categories"]):
            for c in cards:
                rec = {"id": c["id"], "c": cat_index.get(c.get("cat"), -1), "term": c["front"], "def": c["back"]}
                if c["id"] in masked:  # the definition with the term blanked; without it, show "def" as the prompt
                    rec["prompt"] = masked[c["id"]]
                if c.get("detail"):
                    rec["eg"] = c["detail"]
                f.write(line(rec))
                card_ids.append(c["id"])

    question_ids, skipped = [], 0
    with open(folder / "questions.jsonl", "w", encoding="utf-8") as f:
        for _, qs in by_category(data.get("questions", []), data["categories"]):
            for q in qs:
                if q.get("image") or q.get("type") not in QUESTION_TYPES:
                    skipped += 1
                    continue
                if q["type"] == "tf":
                    opts, ans = ["True", "False"], [0 if q["answer"] else 1]
                else:
                    opts = q["options"]
                    ans = q["correct"] if isinstance(q["correct"], list) else [q["correct"]]
                rec = {"id": q["id"], "c": cat_index.get(q.get("cat"), -1), "type": q["type"],
                       "q": q["question"], "opts": opts, "ans": ans, "why": q["explanation"]}
                f.write(line(rec))
                question_ids.append(q["id"])

    entry = {"key": key, "categories": cats, "cards": len(card_ids), "questions": len(question_ids)}
    return entry, card_ids, question_ids, skipped


def schedule_from_progress(path, packed_cards):
    """The app's own progress export -> {track: {cardId: {due, iv, ease, reps, last}}} for the packed cards."""
    try:
        raw = json.loads(Path(path).read_text("utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        sys.exit(f"Could not read the progress export {path}: {exc}")
    srs = raw.get("srs") if isinstance(raw, dict) else None
    if not isinstance(srs, dict):
        sys.exit(f"{path} does not look like a Cert Study Hub progress export (no flashcard schedule in it).")
    out = {}
    for key, ids in packed_cards.items():
        have = srs.get(key) or {}
        live = set(ids)
        track = {}
        for cid, e in have.items():
            if cid not in live or not isinstance(e, dict) or not isinstance(e.get("due"), (int, float)):
                continue
            rec = {"due": int(e["due"] // 1000), "iv": e.get("interval", 0), "ease": round(e.get("ease", 2.5), 2),
                   "reps": e.get("reps", 0)}
            if isinstance(e.get("last"), int):
                rec["last"] = e["last"]
            track[cid] = rec
        if track:
            out[key] = track
    # How much of the reader's own log this export already includes, so the reader does not count it twice.
    sync = (raw.get("stats") or {}).get("einkSync")
    synced = None
    if isinstance(sync, dict) and isinstance(sync.get("id"), str) and isinstance(sync.get("applied"), int):
        synced = {"id": sync["id"], "applied": sync["applied"]}
    return out, synced


def sample_log(packed_cards, packed_questions, count):
    """A plausible log with no clock times (so the import treats every event as happening now)."""
    rng = random.Random(7)
    pool = [("c", k, i) for k, ids in packed_cards.items() for i in ids] + \
           [("q", k, i) for k, ids in packed_questions.items() for i in ids]
    picks = rng.sample(pool, min(count, len(pool)))
    lines = [line({"log": PACK_NAME, "v": PACK_VERSION, "id": f"sample-{rng.randrange(36 ** 6):06x}"})]
    for kind, key, item in picks:
        if kind == "c":
            lines.append(line({"k": "c", "tr": key, "id": item, "q": 4 if rng.random() < 0.7 else 1}))
        else:
            lines.append(line({"k": "q", "tr": key, "id": item, "ok": 1 if rng.random() < 0.7 else 0}))
    return "".join(lines), len(picks)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("tracks", nargs="*", help="track keys (default: all)")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "eink-out"),
                    help="output folder; the pack goes in <out>/study (default: ./eink-out)")
    ap.add_argument("--progress", help="a progress export from the app, to carry your flashcard schedule over")
    ap.add_argument("--sample-log", type=int, metavar="N", help="also write progress.sample.jsonl with N made-up events")
    args = ap.parse_args()

    meta = json.loads((DATA / "tracks.json").read_text("utf-8"))
    info = {t["key"]: t for t in meta["tracks"]}
    keys = args.tracks or list(info)
    for k in keys:
        if k not in info or not (DATA / f"{k}.json").exists():
            sys.exit(f"Unknown track '{k}'. Known: {', '.join(info)}")

    out = Path(args.out) / "study"
    out.mkdir(parents=True, exist_ok=True)
    entries, packed_cards, packed_questions = [], {}, {}
    for k in keys:
        data = json.loads((DATA / f"{k}.json").read_text("utf-8"))
        entry, card_ids, question_ids, skipped = pack_track(out, k, data)
        entry = {"key": k, "label": info[k]["label"], "subtitle": info[k].get("subtitle", ""), **{x: entry[x] for x in ("categories", "cards", "questions")}}
        entries.append(entry)
        packed_cards[k], packed_questions[k] = card_ids, question_ids
        note = f" ({skipped} image questions left out)" if skipped else ""
        print(f"{entry['label']}: {entry['cards']} cards, {entry['questions']} questions{note}")

    manifest = {"pack": PACK_NAME, "v": PACK_VERSION, "built": date.today().isoformat(), "tracks": entries}
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", "utf-8")

    state_path = out / "state.json"
    if args.progress:
        srs, synced = schedule_from_progress(args.progress, packed_cards)
        state = {"pack": PACK_NAME, "v": PACK_VERSION, "synced": synced, "srs": srs}
        state_path.write_text(json.dumps(state, separators=(",", ":")) + "\n", "utf-8")
        print(f"Carried over the schedule for {sum(len(v) for v in srs.values())} cards (state.json)")
    if args.sample_log:
        text, n = sample_log(packed_cards, packed_questions, args.sample_log)
        (out / "progress.sample.jsonl").write_text(text, "utf-8")
        print(f"Sample log with {n} events: {out / 'progress.sample.jsonl'}")

    size = sum(p.stat().st_size for p in out.rglob("*") if p.is_file())
    print(f"Wrote the study pack for {len(entries)} tracks to {out} ({size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
