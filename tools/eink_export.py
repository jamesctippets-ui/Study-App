#!/usr/bin/env python3
"""Exports each track as EPUB books for e-ink readers (built for the Seeed reTerminal Sticky).

The Sticky (3.97-inch, 800x480, 4-level grey, touch, ESP32-S3) has no web browser, so the app cannot run on it.
It does run the open-source CrossPoint Reader firmware, which opens EPUB files from the microSD card. This tool
turns the study content into EPUBs it can open, so the card, question and cheat-sheet content goes with you with
no backend and no custom firmware. Nothing is added to the shipped app.

Per track it writes up to three books:

  <LABEL> Flashcards.epub   one chapter per category. Each card is two pages: the definition with the term
                            blanked (the same definition-first prompt as the app), then the term, definition
                            and example.
  <LABEL> Questions.epub    one chapter per category. Each question is two pages: the question with lettered
                            options, then the answer and explanation. Image questions are skipped (the
                            picture cannot be shown); the count is printed.
  <LABEL> Cheat sheet.epub  the printable cheat sheet, one chapter per section.

Usage (run `python3 build.py` first so dist/data is fresh; Node is needed for the blanked prompts):

    python3 tools/eink_export.py                       all tracks into ./eink-out
    python3 tools/eink_export.py ccna az104            only these tracks
    python3 tools/eink_export.py --out /Volumes/SD     write straight to the card
    python3 tools/eink_export.py --only flashcards     one kind of book (flashcards | questions | cheatsheet)

Only the Python standard library is used. Page breaks come from CSS `break-before: page`; a reader that
ignores it still shows prompt-then-answer in order, just without the page turn between them.
"""
import argparse
import json
import re
import subprocess
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "dist" / "data"
KINDS = ("flashcards", "questions", "cheatsheet")
LETTERS = "ABCDEFGHIJ"

CSS = """\
body { margin: 0; padding: 0; line-height: 1.4; }
h1, h2 { margin: 0 0 0.6em 0; line-height: 1.2; }
h1 { font-size: 1.4em; }
h2 { font-size: 1.15em; }
.card { break-before: page; page-break-before: always; }
.cat { font-size: 0.75em; margin: 0 0 0.8em 0; }
.prompt, .q { font-size: 1.1em; margin: 0 0 0.8em 0; }
.term, .ans { font-weight: bold; margin: 0 0 0.6em 0; }
.eg { margin: 0.8em 0 0 0; font-style: italic; }
.opts { list-style: none; margin: 0.6em 0 0 0; padding: 0; }
.opts li { margin: 0 0 0.5em 0; }
.hint { font-size: 0.8em; margin-top: 1em; }
ul { margin: 0.4em 0 0 1.1em; padding: 0; }
li { margin: 0 0 0.5em 0; }
"""


def esc(text):
    return escape(str(text), quote=True)


def masked_prompts(track):
    """{cardId: definition-first prompt} for cards whose term is blanked, from the app's own flashcardPrompt."""
    try:
        out = subprocess.run(
            ["node", str(ROOT / "tools" / "dump_content.js"), track, "--masked-json"],
            check=True, capture_output=True, text=True,
        ).stdout
        return json.loads(out)
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        sys.exit(f"Could not read the blanked prompts via tools/dump_content.js ({exc}). Is Node installed?")


def page(title, body):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">\n'
        f'<head><meta charset="utf-8"/><title>{esc(title)}</title>'
        '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
        f'<body>\n{body}\n</body>\n</html>\n'
    )


def para(text, cls=None):
    c = f' class="{cls}"' if cls else ""
    return f"<p{c}>{esc(text)}</p>"


def build_epub(path, title, book_id, chapters):
    """chapters: list of (chapter title, body html). Writes a valid EPUB 3 (with an EPUB 2 NCX for older readers)."""
    when = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    urn = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, 'cert-study-hub/' + book_id)}"
    items, spine, nav_li, ncx_pts = [], [], [], []
    files = {}
    for i, (ctitle, body) in enumerate(chapters, 1):
        name = f"c{i:03d}.xhtml"
        files[name] = page(ctitle, f"<h1>{esc(ctitle)}</h1>\n{body}")
        items.append(f'<item id="c{i:03d}" href="{name}" media-type="application/xhtml+xml"/>')
        spine.append(f'<itemref idref="c{i:03d}"/>')
        nav_li.append(f'<li><a href="{name}">{esc(ctitle)}</a></li>')
        ncx_pts.append(
            f'<navPoint id="n{i}" playOrder="{i}"><navLabel><text>{esc(ctitle)}</text></navLabel>'
            f'<content src="{name}"/></navPoint>'
        )
    nav = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">'
        f'<head><meta charset="utf-8"/><title>{esc(title)}</title></head><body>'
        f'<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>{"".join(nav_li)}</ol></nav></body></html>\n'
    )
    ncx = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
        f'<head><meta name="dtb:uid" content="{urn}"/><meta name="dtb:depth" content="1"/>'
        '<meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>'
        f'<docTitle><text>{esc(title)}</text></docTitle><navMap>{"".join(ncx_pts)}</navMap></ncx>\n'
    )
    opf = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:identifier id="bookid">{urn}</dc:identifier><dc:title>{esc(title)}</dc:title>'
        '<dc:creator>Cert Study Hub</dc:creator><dc:language>en</dc:language>'
        f'<meta property="dcterms:modified">{when}</meta></metadata><manifest>'
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        '<item id="css" href="style.css" media-type="text/css"/>'
        f'{"".join(items)}</manifest><spine toc="ncx">{"".join(spine)}</spine></package>\n'
    )
    container = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>'
        '</container>\n'
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as z:
        # The EPUB spec wants "mimetype" first and uncompressed.
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", container, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/content.opf", opf, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/nav.xhtml", nav, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/toc.ncx", ncx, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/style.css", CSS, compress_type=zipfile.ZIP_DEFLATED)
        for name, text in files.items():
            z.writestr(f"OEBPS/{name}", text, compress_type=zipfile.ZIP_DEFLATED)


def by_category(items, cats):
    """Groups items under their category labels, in the track's category order, then any strays."""
    order = [c["key"] for c in cats]
    label = {c["key"]: c["label"] for c in cats}
    groups = {}
    for it in items:
        groups.setdefault(it.get("cat"), []).append(it)
    for key in [k for k in groups if k not in order]:
        order.append(key)
        label[key] = key or "Other"
    return [(label[k], groups[k]) for k in order if k in groups]


def flashcard_chapters(data, masked):
    chapters = []
    for cat_label, cards in by_category(data["flashcards"], data["categories"]):
        parts = []
        for n, c in enumerate(cards, 1):
            tag = f"{cat_label} · card {n} of {len(cards)}"
            prompt = masked.get(c["id"], c["back"])
            parts.append(
                f'<div class="card">{para(tag, "cat")}{para(prompt, "prompt")}'
                f'{para("Name the term, then turn the page.", "hint")}</div>'
            )
            ans = [para(tag, "cat"), para(c["front"], "term"), para(c["back"])]
            if c.get("detail"):
                ans.append(para("Example: " + c["detail"], "eg"))
            parts.append(f'<div class="card">{"".join(ans)}</div>')
        chapters.append((f"{cat_label} ({len(cards)})", "\n".join(parts)))
    return chapters


def question_chapters(data):
    chapters, skipped = [], 0
    for cat_label, qs in by_category(data["questions"], data["categories"]):
        parts, shown = [], [q for q in qs if not q.get("image")]
        skipped += len(qs) - len(shown)
        for n, q in enumerate(shown, 1):
            tag = f"{cat_label} · question {n} of {len(shown)}"
            if q["type"] == "tf":
                opts = ["True", "False"]
                correct = [0 if q["answer"] else 1]
                hint = "True or false? Turn the page for the answer."
                ask = para(q["question"], "q")
                body = ask + para(hint, "hint")
            else:
                opts = q["options"]
                correct = q["correct"] if isinstance(q["correct"], list) else [q["correct"]]
                lis = "".join(f"<li>{LETTERS[i]}. {esc(o)}</li>" for i, o in enumerate(opts))
                multi = " Choose all that apply." if q["type"] == "ms" and "choose" not in q["question"].lower() else ""
                body = para(q["question"] + multi, "q") + f'<ul class="opts">{lis}</ul>'
            parts.append(f'<div class="card">{para(tag, "cat")}{body}</div>')
            right = "; ".join(f"{LETTERS[i]}. {opts[i]}" if q["type"] != "tf" else opts[i] for i in correct)
            ans = [para(tag, "cat"), para("Answer: " + right, "ans"), para(q["explanation"])]
            if q.get("whyTested"):
                ans.append(para("Why it is tested: " + q["whyTested"], "eg"))
            parts.append(f'<div class="card">{"".join(ans)}</div>')
        if parts:
            chapters.append((f"{cat_label} ({len(shown)})", "\n".join(parts)))
    return chapters, skipped


def cheatsheet_chapters(data):
    chapters = []
    for sec in data.get("cheatSheet", []):
        points = sec.get("points")
        if not points:
            continue
        lis = "".join(f"<li>{esc(p)}</li>" for p in points if isinstance(p, str))
        if lis:
            chapters.append((sec.get("heading", "Cheat sheet"), f"<ul>{lis}</ul>"))
    return chapters


def safe_name(text):
    return re.sub(r'[\\/:*?"<>|]+', "-", text).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("tracks", nargs="*", help="track keys (default: all)")
    ap.add_argument("--out", default=str(ROOT / "eink-out"), help="output folder (default: ./eink-out)")
    ap.add_argument("--only", choices=KINDS, help="write only this kind of book")
    args = ap.parse_args()

    meta = json.loads((DATA / "tracks.json").read_text("utf-8"))
    labels = {t["key"]: t["label"] for t in meta["tracks"]}
    keys = args.tracks or list(labels)
    for k in keys:
        if k not in labels or not (DATA / f"{k}.json").exists():
            sys.exit(f"Unknown track '{k}'. Known: {', '.join(labels)}")
    out = Path(args.out)
    want = (args.only,) if args.only else KINDS
    total = 0
    for k in keys:
        data = json.loads((DATA / f"{k}.json").read_text("utf-8"))
        label = labels[k]
        notes = []
        if "flashcards" in want and data.get("flashcards"):
            ch = flashcard_chapters(data, masked_prompts(k))
            build_epub(out / f"{safe_name(label)} Flashcards.epub", f"{label} Flashcards", f"{k}-flashcards", ch)
            notes.append(f"{len(data['flashcards'])} cards")
            total += 1
        if "questions" in want and data.get("questions"):
            ch, skipped = question_chapters(data)
            build_epub(out / f"{safe_name(label)} Questions.epub", f"{label} Questions", f"{k}-questions", ch)
            notes.append(f"{len(data['questions']) - skipped} questions" + (f" ({skipped} image questions skipped)" if skipped else ""))
            total += 1
        if "cheatsheet" in want:
            ch = cheatsheet_chapters(data)
            if ch:
                build_epub(out / f"{safe_name(label)} Cheat sheet.epub", f"{label} Cheat sheet", f"{k}-cheatsheet", ch)
                notes.append(f"{len(ch)} cheat-sheet sections")
                total += 1
        print(f"{label}: " + ", ".join(notes))
    print(f"Wrote {total} EPUB files to {out}")


if __name__ == "__main__":
    main()
