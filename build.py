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
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from data import tracks, itil, az900, az104, cloudplus

TRACK_MODULES = {"itil": itil, "az900": az900, "az104": az104, "cloudplus": cloudplus}


def validate():
    errors = []

    track_keys = {t["key"] for t in tracks.TRACKS}
    if track_keys != set(TRACK_MODULES):
        errors.append(f"TRACKS keys {track_keys} don't match data modules {set(TRACK_MODULES)}")

    missing_exam_config = track_keys - set(tracks.EXAM_CONFIG)
    if missing_exam_config:
        errors.append(f"EXAM_CONFIG is missing entries for: {missing_exam_config}")

    for key, mod in TRACK_MODULES.items():
        cat_keys = {c["key"] for c in mod.CATEGORIES}
        item_ids = set()

        for kind, items in (("flashcard", mod.FLASHCARDS), ("question", mod.QUESTIONS)):
            for item in items:
                if item["id"] in item_ids:
                    errors.append(f"[{key}] duplicate id '{item['id']}' ({kind})")
                item_ids.add(item["id"])
                if item["cat"] not in cat_keys:
                    errors.append(f"[{key}] {kind} '{item['id']}' references unknown category '{item['cat']}'")

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


def build_data_json():
    data = {
        key: {
            "categories": mod.CATEGORIES,
            "flashcards": mod.FLASHCARDS,
            "questions": mod.QUESTIONS,
            **({"lessons": mod.LESSONS} if hasattr(mod, "LESSONS") else {}),
        }
        for key, mod in TRACK_MODULES.items()
    }
    return "\n".join(
        [
            f"const STORAGE_KEY = {json.dumps(tracks.STORAGE_KEY)};",
            f"const TRACKS = {json.dumps(tracks.TRACKS)};",
            f"const EXAM_CONFIG = {json.dumps(tracks.EXAM_CONFIG)};",
            f"const DATA = {json.dumps(data)};",
        ]
    )


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


def main():
    validate()
    app_script = build_app_script()
    template = (ROOT / "templates" / "index.html.tmpl").read_text()
    if "__APP_SCRIPT__" not in template:
        raise SystemExit("templates/index.html.tmpl is missing the __APP_SCRIPT__ placeholder")
    output = template.replace("__APP_SCRIPT__", app_script)
    out_path = ROOT / "index.html"
    out_path.write_text(output)

    total_flashcards = sum(len(mod.FLASHCARDS) for mod in TRACK_MODULES.values())
    total_questions = sum(len(mod.QUESTIONS) for mod in TRACK_MODULES.values())
    print(f"Built {out_path} ({len(output):,} bytes)")
    print(f"  {len(tracks.TRACKS)} tracks, {total_flashcards} flashcards, {total_questions} questions")


if __name__ == "__main__":
    main()
