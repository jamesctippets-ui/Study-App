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

from data import tracks, itil, az900, az104, az305, az802, sc500, cloudplus

TRACK_MODULES = {
    "itil": itil,
    "az900": az900,
    "az104": az104,
    "az305": az305,
    "az802": az802,
    "sc500": sc500,
    "cloudplus": cloudplus,
}


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
