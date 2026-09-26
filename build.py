#!/usr/bin/env python3
"""Builds index.html from the data/ modules and src/js/ source files.

The shipped app is still a single static HTML file (so it keeps working as
an offline-installable PWA with no server), but the *source* is no longer
one 2,500-line file: content lives in data/*.py, one module per cert track,
and the React/JSX code lives in src/js/*, one file per section. This script
validates the data, then assembles both into templates/index.html.tmpl to
produce index.html.

Usage: python3 build.py
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from data import tracks, itil, az900, ab650, az104, dp900, dp300, az305, az802, az140, md102, sc300, sc200, sc500, cloudplus, ehrintegration

TRACK_MODULES = {
    "itil": itil,
    "az900": az900,
    "ab650": ab650,
    "az104": az104,
    "dp900": dp900,
    "dp300": dp300,
    "az305": az305,
    "az802": az802,
    "az140": az140,
    "md102": md102,
    "sc300": sc300,
    "sc200": sc200,
    "sc500": sc500,
    "cloudplus": cloudplus,
    "ehrintegration": ehrintegration,
}


def validate():
    errors = []

    track_keys = {t["key"] for t in tracks.TRACKS}
    if track_keys != set(TRACK_MODULES):
        errors.append(f"TRACKS keys {track_keys} don't match data modules {set(TRACK_MODULES)}")

    missing_exam_config = track_keys - set(tracks.EXAM_CONFIG)
    if missing_exam_config:
        errors.append(f"EXAM_CONFIG is missing entries for: {missing_exam_config}")

    for key, cfg in tracks.EXAM_CONFIG.items():
        resources = cfg.get("resources")
        if not resources:
            errors.append(f"[{key}] EXAM_CONFIG is missing a non-empty 'resources' list")
        else:
            for r in resources:
                if not r.get("label") or not r.get("url"):
                    errors.append(f"[{key}] a resources entry is missing a 'label' or 'url'")
                elif not r["url"].startswith("http"):
                    errors.append(f"[{key}] resource '{r['label']}' has a non-http url: {r['url']!r}")

    for key, mod in TRACK_MODULES.items():
        cat_keys = {c["key"] for c in mod.CATEGORIES}
        marks_sum = sum(c["marks"] for c in mod.CATEGORIES)
        if marks_sum != 100:
            errors.append(f"[{key}] CATEGORIES marks sum to {marks_sum}, not 100")
        for cat in mod.CATEGORIES:
            resources = cat.get("resources")
            if not resources:
                errors.append(f"[{key}] category '{cat['key']}' is missing a non-empty 'resources' list")
            else:
                for r in resources:
                    if not r.get("label") or not r.get("url"):
                        errors.append(f"[{key}] category '{cat['key']}' has a resources entry missing a 'label' or 'url'")
                    elif not r["url"].startswith("http"):
                        errors.append(f"[{key}] category '{cat['key']}' resource '{r['label']}' has a non-http url: {r['url']!r}")
        item_ids = set()
        seen_flashcard_fronts = {}
        seen_question_text = {}

        for kind, items in (("flashcard", mod.FLASHCARDS), ("question", mod.QUESTIONS)):
            for item in items:
                if item["id"] in item_ids:
                    errors.append(f"[{key}] duplicate id '{item['id']}' ({kind})")
                item_ids.add(item["id"])
                if item["cat"] not in cat_keys:
                    errors.append(f"[{key}] {kind} '{item['id']}' references unknown category '{item['cat']}'")

        for f in mod.FLASHCARDS:
            fid = f["id"]
            if not f.get("front", "").strip() or not f.get("back", "").strip():
                errors.append(f"[{key}] flashcard '{fid}' has an empty front or back")
            front_key = f["front"].strip().lower()
            if front_key in seen_flashcard_fronts:
                errors.append(f"[{key}] flashcards '{seen_flashcard_fronts[front_key]}' and '{fid}' have the same front text")
            else:
                seen_flashcard_fronts[front_key] = fid

        for q in mod.QUESTIONS:
            qid = q["id"]
            qtype = q.get("type")
            question_key = q.get("question", "").strip().lower()
            if question_key in seen_question_text:
                errors.append(f"[{key}] questions '{seen_question_text[question_key]}' and '{qid}' have identical question text")
            else:
                seen_question_text[question_key] = qid

            if qtype == "mc":
                options = q.get("options")
                if not isinstance(options, list) or len(options) < 2:
                    errors.append(f"[{key}] mc question '{qid}' needs an options list with at least 2 entries")
                    continue
                if len(options) != len(set(o.strip().lower() for o in options)):
                    errors.append(f"[{key}] mc question '{qid}' has duplicate option text")
                correct = q.get("correct")
                if not isinstance(correct, int) or not (0 <= correct < len(options)):
                    errors.append(f"[{key}] mc question '{qid}' has out-of-range or missing 'correct' index: {correct!r}")
            elif qtype == "tf":
                if not isinstance(q.get("answer"), bool):
                    errors.append(f"[{key}] tf question '{qid}' is missing a boolean 'answer' field")
            elif qtype == "ms":
                options = q.get("options")
                if not isinstance(options, list) or len(options) < 2:
                    errors.append(f"[{key}] ms question '{qid}' needs an options list with at least 2 entries")
                    continue
                correct = q.get("correct")
                if not isinstance(correct, list) or not correct:
                    errors.append(f"[{key}] ms question '{qid}' needs a non-empty 'correct' list")
                elif len(correct) != len(set(correct)):
                    errors.append(f"[{key}] ms question '{qid}' has duplicate indices in 'correct'")
                elif any(not isinstance(i, int) or not (0 <= i < len(options)) for i in correct):
                    errors.append(f"[{key}] ms question '{qid}' has an out-of-range index in 'correct': {correct!r}")
                elif len(correct) >= len(options):
                    errors.append(f"[{key}] ms question '{qid}' marks all options correct — needs at least one wrong option")
            else:
                errors.append(f"[{key}] question '{qid}' has unknown type '{qtype}'")

            if not q.get("explanation", "").strip():
                errors.append(f"[{key}] question '{qid}' is missing an explanation")

            if "image" in q and not q["image"].strip():
                errors.append(f"[{key}] question '{qid}' has an empty 'image' field")

        cheat_sheet = getattr(mod, "CHEAT_SHEET", [])
        if not cheat_sheet:
            errors.append(f"[{key}] is missing a CHEAT_SHEET")
        else:
            seen_headings = set()
            for section in cheat_sheet:
                heading = section.get("heading", "").strip()
                if not heading:
                    errors.append(f"[{key}] a CHEAT_SHEET section is missing a heading")
                elif heading in seen_headings:
                    errors.append(f"[{key}] CHEAT_SHEET has a duplicate section heading '{heading}'")
                else:
                    seen_headings.add(heading)
                points = section.get("points")
                if not isinstance(points, list) or len(points) < 2:
                    errors.append(f"[{key}] CHEAT_SHEET section '{heading}' needs at least 2 points")
                elif any(not isinstance(p, str) or not p.strip() for p in points):
                    errors.append(f"[{key}] CHEAT_SHEET section '{heading}' has an empty point")

        lessons = getattr(mod, "LESSONS", [])
        lesson_ids_seen = set()
        for lesson in lessons:
            if lesson["id"] in lesson_ids_seen:
                errors.append(f"[{key}] duplicate lesson id '{lesson['id']}'")
            lesson_ids_seen.add(lesson["id"])
            for ref_field in ("vocabIds", "quizIds"):
                for ref_id in lesson.get(ref_field, []):
                    if ref_id not in item_ids:
                        errors.append(
                            f"[{key}] lesson '{lesson['id']}' {ref_field} references unknown id '{ref_id}'"
                        )

    if errors:
        print("Data validation failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)


def build_track_data():
    """One dict, keyed by track, of exactly what a client needs to render
    that track — the single source both the inline bundle (build_data_json)
    and the standalone per-track JSON files (write_track_json_files) build
    from, so the two can never drift apart.
    """
    return {
        key: {
            "categories": mod.CATEGORIES,
            "flashcards": mod.FLASHCARDS,
            "questions": mod.QUESTIONS,
            **({"lessons": mod.LESSONS} if hasattr(mod, "LESSONS") else {}),
            **({"cheatSheet": mod.CHEAT_SHEET} if hasattr(mod, "CHEAT_SHEET") else {}),
        }
        for key, mod in TRACK_MODULES.items()
    }


def build_data_json():
    data = build_track_data()
    return "\n".join(
        [
            f"const STORAGE_KEY = {json.dumps(tracks.STORAGE_KEY)};",
            f"const TRACKS = {json.dumps(tracks.TRACKS)};",
            f"const EXAM_CONFIG = {json.dumps(tracks.EXAM_CONFIG)};",
            f"const DATA = {json.dumps(data)};",
        ]
    )


def write_track_json_files():
    """Writes each track's content as its own standalone dist/data/<key>.json
    (plus dist/data/tracks.json for TRACKS/EXAM_CONFIG) — content as
    fetchable data instead of only ever baked into one HTML file, per
    ROADMAP.md's "future-proofing for a standalone app" section. Additive
    groundwork only: the live app here still inlines DATA into index.html
    exactly as before (that's what build_data_json above still feeds it),
    so this changes nothing about how today's single-page app behaves —
    it just gives a future second client (a separate web deployment, an
    iOS/Android app) a real per-track source of truth to fetch instead of
    embedding its own copy of the content.
    """
    out_dir = ROOT / "dist" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    data = build_track_data()
    for key, track_data in data.items():
        (out_dir / f"{key}.json").write_text(json.dumps(track_data, indent=2) + "\n")
    manifest = {"storageKey": tracks.STORAGE_KEY, "tracks": tracks.TRACKS, "examConfig": tracks.EXAM_CONFIG}
    (out_dir / "tracks.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return len(data)


def build_app_script():
    js_dir = ROOT / "src" / "js"
    files = sorted(js_dir.glob("*.js*"))
    if not files:
        raise SystemExit(f"No source files found in {js_dir}")
    chunks = [f.read_text() for f in files]
    bootstrap = (
        "\nconst root = ReactDOM.createRoot(document.getElementById('root'));\n"
        "root.render(<CertStudyApp />);\n\n"
        "if ('serviceWorker' in navigator) {\n"
        "  window.addEventListener('load', () => {\n"
        "    navigator.serviceWorker.register('service-worker.js').catch(() => {});\n"
        "  });\n"
        "}\n"
    )
    return build_data_json() + "\n\n" + "\n".join(chunks) + bootstrap


def sync_service_worker_cache_name(html):
    """Keeps service-worker.js's CACHE_NAME in lockstep with index.html's
    actual content, so a content change always invalidates the cache-first
    fetch handler's stale copy. This used to be a manual version-string
    bump on service-worker.js — twice now, a commit changed index.html
    without remembering that bump, leaving returning visitors stuck on an
    old snapshot until someone noticed something "looked old" and traced
    it back. Deriving the version from a hash of the built output removes
    the human step (and the failure mode) entirely.
    """
    sw_path = ROOT / "service-worker.js"
    sw_text = sw_path.read_text()
    content_hash = hashlib.sha256(html.encode()).hexdigest()[:10]
    new_line = f"const CACHE_NAME = 'cert-study-hub-{content_hash}';"
    updated, count = re.subn(r"^const CACHE_NAME = '.*';$", new_line, sw_text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit("service-worker.js is missing the expected CACHE_NAME line")
    if updated != sw_text:
        sw_path.write_text(updated)
        return True
    return False


def main():
    validate()
    app_script = build_app_script()
    template = (ROOT / "templates" / "index.html.tmpl").read_text()
    if "__APP_SCRIPT__" not in template:
        raise SystemExit("templates/index.html.tmpl is missing the __APP_SCRIPT__ placeholder")
    output = template.replace("__APP_SCRIPT__", app_script)
    out_path = ROOT / "index.html"
    out_path.write_text(output)
    sw_updated = sync_service_worker_cache_name(output)
    json_track_count = write_track_json_files()

    total_flashcards = sum(len(mod.FLASHCARDS) for mod in TRACK_MODULES.values())
    total_questions = sum(len(mod.QUESTIONS) for mod in TRACK_MODULES.values())
    print(f"Built {out_path} ({len(output):,} bytes)")
    print(f"  {len(tracks.TRACKS)} tracks, {total_flashcards} flashcards, {total_questions} questions")
    print(f"  dist/data/*.json refreshed ({json_track_count} tracks + tracks.json) — not yet consumed by index.html, see ROADMAP.md §10")
    if sw_updated:
        print("  service-worker.js CACHE_NAME updated (content changed) — commit it alongside index.html")


if __name__ == "__main__":
    main()
