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

from data import acronyms as acronyms_data
from data import bridges as bridges_data
from data import tracks, itil, az900, ab650, az104, dp900, dp300, az305, az802, az140, md102, sc300, sc200, sc500, cloudplus, ehrintegration, ccna, isc2cc, sscp, cissp, ccsp, cgrc, csslp

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
    "ccna": ccna,
    "isc2cc": isc2cc,
    "sscp": sscp,
    "cissp": cissp,
    "ccsp": ccsp,
    "cgrc": cgrc,
    "csslp": csslp,
}


# Tracks whose data modules are still placeholders (content in progress). They
# are registered and validated like any other, but left out of everything the
# app ships (TRACKS, EXAM_CONFIG, DATA, dist/data) until removed from this set.
UNFINISHED_TRACKS = {"ccna", "sscp", "cissp", "ccsp", "cgrc", "csslp"}


def live_tracks():
    return [t for t in tracks.TRACKS if t["key"] not in UNFINISHED_TRACKS]


def live_exam_config():
    return {k: v for k, v in tracks.EXAM_CONFIG.items() if k not in UNFINISHED_TRACKS}


# The app shuffles mc/ms option order at render time (prepareQuestion in
# src/js/03_helpers.js), so any text that points at an option by position
# ("the last option", "option B", "all of the above") names the wrong answer
# on screen. Refer to options by their content instead.
POSITIONAL_REF = re.compile(
    r"\b(?:the\s+)?(?:first|second|third|fourth|fifth|last|final|top|bottom|previous|above)\s+(?:option|answer|choice)s?\b"
    r"|\boption\s+[A-E]\b|\b(?:answer|choice)\s+[A-E]\b"
    r"|\b(?:all|none|both)\s+of\s+the\s+above\b|\bboth\s+[A-D]\s+and\s+[A-D]\b",
    re.IGNORECASE,
)


def positional_ref_errors(label, fields):
    """One error per field of `label` that refers to an option by position."""
    errors = []
    for field, text in fields:
        if isinstance(text, str):
            m = POSITIONAL_REF.search(text)
            if m:
                errors.append(
                    f"{label} {field} refers to an option by position ({m.group(0)!r}) — options are shuffled at render time, name the option by its content instead"
                )
    return errors


ACRONYM_TOKEN = re.compile(r"(?<![A-Za-z0-9])([A-Z][A-Za-z0-9]{1,7})(?![A-Za-z0-9])")


def acronym_token_counts():
    """How often each acronym-like token (2-8 characters, at least two capitals
    or digits, starting with a capital) appears across all content text."""
    counts = {}

    def scan(text):
        for m in ACRONYM_TOKEN.finditer(text):
            tok = m.group(1)
            if sum(1 for c in tok if c.isupper() or c.isdigit()) < 2 or tok.isdigit():
                continue
            counts[tok] = counts.get(tok, 0) + 1

    def walk(o):
        if isinstance(o, str):
            scan(o)
        elif isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            for v in o.values():
                walk(v)

    for mod in TRACK_MODULES.values():
        for name in ("FLASHCARDS", "QUESTIONS", "LESSONS", "CHEAT_SHEET", "MADLIBS", "SEQUENCES",
                     "CASE_STUDIES", "COMPARE", "CLI_CHALLENGES", "CATEGORIES"):
            walk(getattr(mod, name, None))
    walk(bridges_data.BRIDGES)
    return counts


def acronym_is_covered(tok):
    known = acronyms_data.ACRONYMS
    return tok in known or tok in acronyms_data.IGNORE or (tok.endswith("s") and tok[:-1] in known)


def missing_acronyms():
    return sorted(
        ((tok, n) for tok, n in acronym_token_counts().items() if n >= 2 and not acronym_is_covered(tok)),
        key=lambda x: (-x[1], x[0]),
    )


def validate_acronyms():
    errors = []
    for key, entry in acronyms_data.ACRONYMS.items():
        label = f"[acronym {key}]"
        if not re.fullmatch(r"[A-Za-z0-9]{2,8}", key):
            errors.append(f"{label} key must be 2-8 letters/digits")
        if key in acronyms_data.IGNORE:
            errors.append(f"{label} is also listed in IGNORE")
        exp = entry.get("exp") if isinstance(entry, dict) else None
        exps = exp if isinstance(exp, list) else [exp]
        if not exps or not all(isinstance(e, str) and e.strip() for e in exps):
            errors.append(f"{label} needs a non-empty 'exp' string or list of strings")
        if "trigger" in entry and not isinstance(entry["trigger"], bool):
            errors.append(f"{label} 'trigger' must be True or False")
        if set(entry) - {"exp", "trigger"}:
            errors.append(f"{label} has unknown fields {set(entry) - {'exp', 'trigger'}}")
    if acronyms_data.ENFORCE_COVERAGE:
        missing = missing_acronyms()
        if missing:
            shown = ", ".join(f"{t} ({n})" for t, n in missing[:40])
            errors.append(
                f"{len(missing)} acronym-like tokens used in content are in neither ACRONYMS nor IGNORE "
                f"(data/acronyms.py): {shown}{' ...' if len(missing) > 40 else ''}"
            )
    return errors


def validate_bridges():
    """Checks data/bridges_*.py against the shape documented in data/bridges.py."""
    errors = []
    seen_ids = set()
    seen_question_ids = set()
    for b in bridges_data.BRIDGES:
        bid = b.get("id") or "<missing id>"
        label = f"[bridge {bid}]"
        if not b.get("id") or not str(b["id"]).startswith("br-"):
            errors.append(f"{label} id must be non-empty and start with 'br-'")
        if bid in seen_ids:
            errors.append(f"{label} duplicate bridge id")
        seen_ids.add(bid)
        for field in ("title", "summary", "watchOut"):
            if not isinstance(b.get(field), str) or not b[field].strip():
                errors.append(f"{label} is missing a non-empty '{field}'")
        appears = b.get("appearsIn") or []
        if len(appears) < 2:
            errors.append(f"{label} needs at least 2 'appearsIn' entries (a bridge links certs)")
        tracks_seen = set()
        for a in appears:
            t = a.get("track")
            if t not in TRACK_MODULES:
                errors.append(f"{label} appearsIn names unknown track {t!r}")
                continue
            if t in tracks_seen:
                errors.append(f"{label} lists track {t!r} twice in appearsIn")
            tracks_seen.add(t)
            lesson_ids = {l["id"] for l in getattr(TRACK_MODULES[t], "LESSONS", [])}
            if a.get("lesson") not in lesson_ids:
                errors.append(f"{label} appearsIn[{t}] lesson {a.get('lesson')!r} is not a lesson of that track")
            if not isinstance(a.get("angle"), str) or not a["angle"].strip():
                errors.append(f"{label} appearsIn[{t}] is missing a non-empty 'angle'")
        qs = b.get("questions") or []
        if not 2 <= len(qs) <= 4:
            errors.append(f"{label} needs 2-4 questions, has {len(qs)}")
        for q in qs:
            qid = q.get("id") or "<missing id>"
            qlabel = f"{label} question {qid}"
            if not q.get("id") or qid in seen_question_ids:
                errors.append(f"{qlabel} id is missing or not unique across bridges")
            seen_question_ids.add(qid)
            if q.get("type") != "mc":
                errors.append(f"{qlabel} must have type 'mc'")
            opts = q.get("options") or []
            if not 3 <= len(opts) <= 5 or len(set(opts)) != len(opts):
                errors.append(f"{qlabel} needs 3-5 distinct options")
            if not isinstance(q.get("correct"), int) or not 0 <= q["correct"] < len(opts):
                errors.append(f"{qlabel} 'correct' must be an index into options")
            for field in ("question", "explanation"):
                if not isinstance(q.get(field), str) or not q[field].strip():
                    errors.append(f"{qlabel} is missing a non-empty '{field}'")
            errors.extend(
                positional_ref_errors(
                    qlabel,
                    [("question", q.get("question")), ("explanation", q.get("explanation")), ("whyTested", q.get("whyTested"))]
                    + [(f"option {i}", o) for i, o in enumerate(opts)],
                )
            )
        errors.extend(
            positional_ref_errors(label, [("summary", b.get("summary")), ("watchOut", b.get("watchOut"))]
                                  + [(f"angle[{a.get('track')}]", a.get("angle")) for a in appears])
        )
    return errors


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

    for key, cfg in tracks.EXAM_CONFIG.items():
        exp = cfg.get("experience")
        if exp is None:
            continue
        if exp.get("level") not in ("required", "recommended", "none"):
            errors.append(f"[{key}] experience.level must be 'required', 'recommended' or 'none'")
        if not isinstance(exp.get("years"), int) or exp["years"] < 0:
            errors.append(f"[{key}] experience.years must be a non-negative integer")
        elif (exp.get("level") == "none") != (exp["years"] == 0):
            errors.append(f"[{key}] experience.years is 0 exactly when experience.level is 'none'")
        if not isinstance(exp.get("summary"), str) or not exp["summary"].strip():
            errors.append(f"[{key}] experience needs a non-empty 'summary'")
        for field in ("waivers",):
            if field in exp and (not isinstance(exp[field], list) or any(not isinstance(w, str) or not w.strip() for w in exp[field])):
                errors.append(f"[{key}] experience.{field} must be a list of non-empty strings")
        if "associate" in exp and (not isinstance(exp["associate"], str) or not exp["associate"].strip()):
            errors.append(f"[{key}] experience.associate must be a non-empty string")

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

            if "whyTested" in q and not q["whyTested"].strip():
                errors.append(f"[{key}] question '{qid}' has an empty 'whyTested' field")

            errors.extend(positional_ref_errors(
                f"[{key}] question '{qid}'",
                [("question", q.get("question")), ("explanation", q.get("explanation")), ("whyTested", q.get("whyTested"))]
                + [("option", o) for o in (q.get("options") or [])],
            ))

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

        madlibs = getattr(mod, "MADLIBS", [])
        for ml in madlibs:
            mlid = ml.get("id")
            if not mlid:
                errors.append(f"[{key}] a MADLIBS entry is missing an 'id'")
            elif mlid in item_ids:
                errors.append(f"[{key}] duplicate id '{mlid}' (madlib shares an id with a flashcard/question)")
            else:
                item_ids.add(mlid)
            if ml.get("cat") not in cat_keys:
                errors.append(f"[{key}] MADLIBS '{mlid}' references unknown category '{ml.get('cat')}'")
            scenario = ml.get("scenario", "")
            if not scenario.strip():
                errors.append(f"[{key}] MADLIBS '{mlid}' is missing a non-empty 'scenario'")
            if not ml.get("explanation", "").strip():
                errors.append(f"[{key}] MADLIBS '{mlid}' is missing a non-empty 'explanation'")
            blanks = ml.get("blanks")
            if not isinstance(blanks, list) or not blanks:
                errors.append(f"[{key}] MADLIBS '{mlid}' needs a non-empty 'blanks' list")
                continue
            blank_keys_seen = set()
            for b in blanks:
                bkey = b.get("key")
                if not bkey:
                    errors.append(f"[{key}] MADLIBS '{mlid}' has a blank missing a 'key'")
                elif bkey in blank_keys_seen:
                    errors.append(f"[{key}] MADLIBS '{mlid}' has duplicate blank key '{bkey}'")
                else:
                    blank_keys_seen.add(bkey)
                if ("{" + str(bkey) + "}") not in scenario:
                    errors.append(f"[{key}] MADLIBS '{mlid}' blank '{bkey}' has no matching {{{bkey}}} placeholder in its scenario")
                options = b.get("options")
                if not isinstance(options, list) or len(options) < 2:
                    errors.append(f"[{key}] MADLIBS '{mlid}' blank '{bkey}' needs an options list with at least 2 entries")
                    continue
                correct = b.get("correct")
                if not isinstance(correct, int) or not (0 <= correct < len(options)):
                    errors.append(f"[{key}] MADLIBS '{mlid}' blank '{bkey}' has an out-of-range or missing 'correct' index: {correct!r}")
            for placeholder in re.findall(r"\{(\w+)\}", scenario):
                if placeholder not in blank_keys_seen:
                    errors.append(f"[{key}] MADLIBS '{mlid}' scenario references placeholder '{{{placeholder}}}' with no matching blank")

        sequences = getattr(mod, "SEQUENCES", [])
        for sq in sequences:
            sqid = sq.get("id")
            if not sqid:
                errors.append(f"[{key}] a SEQUENCES entry is missing an 'id'")
            elif sqid in item_ids:
                errors.append(f"[{key}] duplicate id '{sqid}' (sequence shares an id with a flashcard/question/madlib)")
            else:
                item_ids.add(sqid)
            if sq.get("cat") not in cat_keys:
                errors.append(f"[{key}] SEQUENCES '{sqid}' references unknown category '{sq.get('cat')}'")
            if not sq.get("prompt", "").strip():
                errors.append(f"[{key}] SEQUENCES '{sqid}' is missing a non-empty 'prompt'")
            if not sq.get("explanation", "").strip():
                errors.append(f"[{key}] SEQUENCES '{sqid}' is missing a non-empty 'explanation'")
            steps = sq.get("steps")
            if not isinstance(steps, list) or len(steps) < 3:
                errors.append(f"[{key}] SEQUENCES '{sqid}' needs a 'steps' list with at least 3 entries")
            elif any(not isinstance(s, str) or not s.strip() for s in steps):
                errors.append(f"[{key}] SEQUENCES '{sqid}' has an empty step")
            elif len(steps) != len(set(steps)):
                errors.append(f"[{key}] SEQUENCES '{sqid}' has duplicate step text")

        case_studies = getattr(mod, "CASE_STUDIES", [])
        for cs in case_studies:
            csid = cs.get("id")
            if not csid:
                errors.append(f"[{key}] a CASE_STUDIES entry is missing an 'id'")
            elif csid in item_ids:
                errors.append(f"[{key}] duplicate id '{csid}' (case study shares an id with a flashcard/question/madlib/sequence)")
            else:
                item_ids.add(csid)
            if cs.get("cat") not in cat_keys:
                errors.append(f"[{key}] CASE_STUDIES '{csid}' references unknown category '{cs.get('cat')}'")
            if not cs.get("title", "").strip():
                errors.append(f"[{key}] CASE_STUDIES '{csid}' is missing a non-empty 'title'")
            if not cs.get("scenario", "").strip():
                errors.append(f"[{key}] CASE_STUDIES '{csid}' is missing a non-empty 'scenario'")
            cs_questions = cs.get("questions")
            if not isinstance(cs_questions, list) or len(cs_questions) < 2:
                errors.append(f"[{key}] CASE_STUDIES '{csid}' needs a 'questions' list with at least 2 entries")
                continue
            cs_question_ids_seen = set()
            for q in cs_questions:
                qid = q.get("id")
                if not qid:
                    errors.append(f"[{key}] CASE_STUDIES '{csid}' has a question missing an 'id'")
                elif qid in item_ids or qid in cs_question_ids_seen:
                    errors.append(f"[{key}] duplicate id '{qid}' (CASE_STUDIES '{csid}' question)")
                else:
                    item_ids.add(qid)
                    cs_question_ids_seen.add(qid)
                qtype = q.get("type")
                if not q.get("question", "").strip():
                    errors.append(f"[{key}] CASE_STUDIES '{csid}' question '{qid}' is missing non-empty 'question' text")
                if qtype == "mc":
                    options = q.get("options")
                    if not isinstance(options, list) or len(options) < 2:
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' mc question '{qid}' needs an options list with at least 2 entries")
                        continue
                    correct = q.get("correct")
                    if not isinstance(correct, int) or not (0 <= correct < len(options)):
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' mc question '{qid}' has out-of-range or missing 'correct' index: {correct!r}")
                elif qtype == "tf":
                    if not isinstance(q.get("answer"), bool):
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' tf question '{qid}' is missing a boolean 'answer' field")
                elif qtype == "ms":
                    options = q.get("options")
                    if not isinstance(options, list) or len(options) < 2:
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' ms question '{qid}' needs an options list with at least 2 entries")
                        continue
                    correct = q.get("correct")
                    if not isinstance(correct, list) or not correct:
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' ms question '{qid}' needs a non-empty 'correct' list")
                    elif any(not isinstance(i, int) or not (0 <= i < len(options)) for i in correct):
                        errors.append(f"[{key}] CASE_STUDIES '{csid}' ms question '{qid}' has an out-of-range index in 'correct': {correct!r}")
                else:
                    errors.append(f"[{key}] CASE_STUDIES '{csid}' question '{qid}' has unknown type '{qtype}'")
                if not q.get("explanation", "").strip():
                    errors.append(f"[{key}] CASE_STUDIES '{csid}' question '{qid}' is missing an explanation")
                errors.extend(positional_ref_errors(
                    f"[{key}] CASE_STUDIES '{csid}' question '{qid}'",
                    [("question", q.get("question")), ("explanation", q.get("explanation")), ("whyTested", q.get("whyTested"))]
                    + [("option", o) for o in (q.get("options") or [])],
                ))

        compare = getattr(mod, "COMPARE", [])
        seen_compare_scenarios = {}
        for cp in compare:
            cpid = cp.get("id")
            if not cpid:
                errors.append(f"[{key}] a COMPARE entry is missing an 'id'")
            elif cpid in item_ids:
                errors.append(f"[{key}] duplicate id '{cpid}' (COMPARE shares an id with another item)")
            else:
                item_ids.add(cpid)
            if cp.get("cat") not in cat_keys:
                errors.append(f"[{key}] COMPARE '{cpid}' references unknown category '{cp.get('cat')}'")
            scenario = cp.get("scenario", "")
            if not scenario.strip():
                errors.append(f"[{key}] COMPARE '{cpid}' is missing a non-empty 'scenario'")
            else:
                scenario_key = " ".join(scenario.split()).lower()
                if scenario_key in seen_compare_scenarios:
                    errors.append(f"[{key}] COMPARE '{seen_compare_scenarios[scenario_key]}' and '{cpid}' have identical scenario text")
                else:
                    seen_compare_scenarios[scenario_key] = cpid
            opt_a = cp.get("optionA", "")
            opt_b = cp.get("optionB", "")
            if not opt_a.strip() or not opt_b.strip():
                errors.append(f"[{key}] COMPARE '{cpid}' needs non-empty 'optionA' and 'optionB'")
            elif opt_a.strip().lower() == opt_b.strip().lower():
                errors.append(f"[{key}] COMPARE '{cpid}' has identical optionA and optionB")
            if cp.get("better") not in ("A", "B"):
                errors.append(f"[{key}] COMPARE '{cpid}' needs 'better' set to 'A' or 'B', got {cp.get('better')!r}")
            if not cp.get("why", "").strip():
                errors.append(f"[{key}] COMPARE '{cpid}' is missing a non-empty 'why'")
            errors.extend(positional_ref_errors(
                f"[{key}] COMPARE '{cpid}'",
                [("scenario", cp.get("scenario")), ("optionA", cp.get("optionA")), ("optionB", cp.get("optionB")), ("why", cp.get("why"))],
            ))

        cli_challenges = getattr(mod, "CLI_CHALLENGES", [])
        cli_ids_seen = set()
        for c in cli_challenges:
            cid = c.get("id")
            if not cid:
                errors.append(f"[{key}] a CLI_CHALLENGES entry is missing an 'id'")
            elif cid in cli_ids_seen:
                errors.append(f"[{key}] duplicate CLI_CHALLENGES id '{cid}'")
            else:
                cli_ids_seen.add(cid)
            if c.get("cat") not in cat_keys:
                errors.append(f"[{key}] CLI_CHALLENGES '{cid}' references unknown category '{c.get('cat')}'")
            if c.get("tool") not in ("az", "powershell", "ios"):
                errors.append(f"[{key}] CLI_CHALLENGES '{cid}' has unknown 'tool' {c.get('tool')!r} (expected 'az', 'powershell' or 'ios')")
            for field in ("prompt", "verb", "command", "explanation"):
                if not c.get(field, "").strip():
                    errors.append(f"[{key}] CLI_CHALLENGES '{cid}' is missing a non-empty '{field}'")
            if not c.get("command", "").startswith(c.get("verb", "\0")):
                errors.append(f"[{key}] CLI_CHALLENGES '{cid}' has a 'command' that doesn't start with its own 'verb'")
            required_flags = c.get("requiredFlags")
            if not isinstance(required_flags, list) or not required_flags:
                errors.append(f"[{key}] CLI_CHALLENGES '{cid}' needs a non-empty 'requiredFlags' list")

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
            if "onTheJob" in lesson and not lesson["onTheJob"].strip():
                errors.append(f"[{key}] lesson '{lesson['id']}' has an empty 'onTheJob' field")

    errors.extend(validate_bridges())
    errors.extend(validate_acronyms())

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
            **({"cliChallenges": mod.CLI_CHALLENGES} if hasattr(mod, "CLI_CHALLENGES") else {}),
            **({"madlibs": mod.MADLIBS} if hasattr(mod, "MADLIBS") else {}),
            **({"sequences": mod.SEQUENCES} if hasattr(mod, "SEQUENCES") else {}),
            **({"caseStudies": mod.CASE_STUDIES} if hasattr(mod, "CASE_STUDIES") else {}),
            **({"compare": mod.COMPARE} if hasattr(mod, "COMPARE") else {}),
        }
        for key, mod in TRACK_MODULES.items()
        if key not in UNFINISHED_TRACKS
    }


def build_data_json():
    data = build_track_data()
    return "\n".join(
        [
            f"const STORAGE_KEY = {json.dumps(tracks.STORAGE_KEY)};",
            f"const TRACKS = {json.dumps(live_tracks())};",
            f"const EXAM_CONFIG = {json.dumps(live_exam_config())};",
            f"const DATA = {json.dumps(data)};",
            f"const BRIDGES = {json.dumps(bridges_data.BRIDGES)};",
            f"const ACRONYMS = {json.dumps(acronyms_data.ACRONYMS)};",
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
    manifest = {"storageKey": tracks.STORAGE_KEY, "tracks": live_tracks(), "examConfig": live_exam_config()}
    (out_dir / "tracks.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (out_dir / "bridges.json").write_text(json.dumps(bridges_data.BRIDGES, indent=2) + "\n")
    (out_dir / "acronyms.json").write_text(json.dumps(acronyms_data.ACRONYMS, indent=2) + "\n")
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
    return "\n".join(chunks) + bootstrap


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
    # Every image and font file is precached, so a fully offline session shows
    # the same screenshots and typography as an online one. The list between
    # the markers is regenerated here from what is actually on disk.
    assets = sorted(
        "./" + p.relative_to(ROOT).as_posix()
        for folder in ("images", "fonts")
        for p in (ROOT / folder).rglob("*")
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".woff2"}
    )
    block = "  // BEGIN GENERATED ASSETS (build.py)\n" + "".join(f"  '{a}',\n" for a in assets) + "  // END GENERATED ASSETS"
    sw_text, n_block = re.subn(r"  // BEGIN GENERATED ASSETS.*?// END GENERATED ASSETS", lambda m: block, sw_text, count=1, flags=re.DOTALL)
    if n_block != 1:
        raise SystemExit("service-worker.js is missing the GENERATED ASSETS markers")
    content_hash = hashlib.sha256((html + "\n".join(assets)).encode()).hexdigest()[:10]
    new_line = f"const CACHE_NAME = 'cert-study-hub-{content_hash}';"
    updated, count = re.subn(r"^const CACHE_NAME = '.*';$", new_line, sw_text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit("service-worker.js is missing the expected CACHE_NAME line")
    if updated != sw_text:
        sw_path.write_text(updated)
        return True
    return False


def main():
    if "--check-acronyms" in sys.argv:
        missing = missing_acronyms()
        print(f"{len(missing)} acronym-like tokens used at least twice are in neither ACRONYMS nor IGNORE:")
        for tok, n in missing:
            print(f"  {tok} ({n})")
        return
    validate()
    app_script = build_app_script()
    template = (ROOT / "templates" / "index.html.tmpl").read_text()
    for placeholder in ("__DATA_SCRIPT__", "__APP_SCRIPT__"):
        if placeholder not in template:
            raise SystemExit(f"templates/index.html.tmpl is missing the {placeholder} placeholder")
    # The content (several MB of JSON-shaped constants) goes in a plain script
    # so the browser parses it natively; only the app code goes through
    # in-browser Babel. "</" is escaped so no string can close the tag early.
    data_script = build_data_json().replace("</", "<\\/")
    output = template.replace("__DATA_SCRIPT__", data_script).replace("__APP_SCRIPT__", app_script)
    out_path = ROOT / "index.html"
    out_path.write_text(output)
    sw_updated = sync_service_worker_cache_name(output)
    json_track_count = write_track_json_files()

    total_flashcards = sum(len(mod.FLASHCARDS) for k, mod in TRACK_MODULES.items() if k not in UNFINISHED_TRACKS)
    total_questions = sum(len(mod.QUESTIONS) for k, mod in TRACK_MODULES.items() if k not in UNFINISHED_TRACKS)
    print(f"Built {out_path} ({len(output):,} bytes)")
    print(f"  {len(live_tracks())} tracks, {total_flashcards} flashcards, {total_questions} questions")
    print(f"  dist/data/*.json refreshed ({json_track_count} tracks + tracks.json) — not yet consumed by index.html, see ROADMAP.md §10")
    if sw_updated:
        print("  service-worker.js CACHE_NAME updated (content changed) — commit it alongside index.html")


if __name__ == "__main__":
    main()
