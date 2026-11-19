#!/usr/bin/env python3
"""Builds one plain-English, chapter-based study book per certification track, as an EPUB for e-ink readers.

This replaces the flashcard-per-page, question-per-page books from tools/eink_export.py with a single
reflowable book per track that reads like a beginner's guide:

  Start here          what the exam is and how to use the book
  Part 1  Lessons     one chapter per app lesson: chapter in a nutshell, the everyday picture, the details,
                      words to know, watch-out traps, a worked example, on-the-job advice, and a short quiz
                      with the answers right after it
  Part 2  Cheat sheet one short section per topic
  Part 3  Word bank   every flashcard as a glossary entry, grouped by exam domain
  Part 4  Worked examples
                      case studies, "put it in order" processes, head-to-head choices, commands to know
  Part 5  Practice questions
                      the whole question bank in sets of ten, each set followed by its answers

Design rules, chosen so the books survive small, low-memory e-readers (the Seeed reTerminal Sticky running
CrossPoint, and any other EPUB reader):

  * Plain reflowable XHTML: headings, paragraphs and lists only. No tables, no images inside the text, no
    forced page breaks, no columns, no scripts, no fixed sizes. The reader chooses font and margins.
  * One small file per table-of-contents entry, so every entry opens its own file and no reader has to
    understand `#anchor` links. Files stay well under 100 KB.
  * Callouts are bold lead-in words ("Remember:", "Watch out:") rather than icons or boxes.
  * A real table of contents (EPUB 3 nav plus the EPUB 2 NCX older readers use), two levels deep.
  * Questions that need a picture (the `image` field) are left out, and the count is reported.

Usage (run `python3 build.py` first so dist/data is fresh):

    python3 tools/dummies_guide.py ccna ab650            only these tracks
    python3 tools/dummies_guide.py                       every track
    python3 tools/dummies_guide.py ccna --out some/dir   choose the output folder (default ./eink-out/guides)

Only the Python standard library is required. If Pillow is installed, a simple black-and-white cover is drawn.
"""
import argparse
import json
import re
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "dist" / "data"
LETTERS = "ABCDEFGHIJ"
SET_SIZE = 10

# The book title is built from this template so the naming can be changed in one place.
TITLE_TEMPLATE = "{label} in Plain English"
SUBTITLE_TEMPLATE = "A beginner's guide to {sub}"

CSS = """\
body { margin: 0; padding: 0; line-height: 1.4; }
h1 { font-size: 1.5em; margin: 0 0 0.7em 0; line-height: 1.2; }
h2 { font-size: 1.2em; margin: 1.4em 0 0.5em 0; line-height: 1.2; }
h3 { font-size: 1.05em; margin: 1.1em 0 0.4em 0; }
p { margin: 0 0 0.8em 0; }
ul, ol { margin: 0.3em 0 0.9em 0; padding-left: 1.3em; }
li { margin: 0 0 0.5em 0; }
.nutshell { font-style: italic; }
.callout { margin: 0 0 0.9em 0; }
.small { font-size: 0.85em; }
.center { text-align: center; }
.opt { margin: 0 0 0.3em 0; }
"""

# Words that end in a full stop without ending the sentence, so paragraph splitting must not break after them.
_ABBREV = {"e.g.", "i.e.", "vs.", "etc.", "approx.", "no.", "inc.", "st.", "dr.", "mr.", "mrs.", "ms.", "fig.", "cf."}


def esc(text):
    return escape(str(text), quote=True)


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-") or "x"


def safe_filename(text):
    return re.sub(r'[\\/:*?"<>|]+', "-", text).strip()


# ---------------------------------------------------------------- text helpers

def split_sentences(text):
    pieces, buf = [], ""
    for tok in re.split(r"(?<=[.!?])\s+", text.strip()):
        buf = f"{buf} {tok}".strip() if buf else tok
        last = buf.split()[-1].lower() if buf.split() else ""
        nxt_is_new = True
        if last in _ABBREV:
            nxt_is_new = False
        if nxt_is_new:
            pieces.append(buf)
            buf = ""
    if buf:
        pieces.append(buf)
    return pieces


def chunk_paragraph(text, limit=75):
    """Splits a long paragraph into shorter ones at sentence boundaries so it reads well on a small screen."""
    words = len(text.split())
    if words <= limit * 1.4:
        return [text]
    out, cur = [], ""
    for sent in split_sentences(text):
        if cur and len((cur + " " + sent).split()) > limit:
            out.append(cur)
            cur = sent
        else:
            cur = f"{cur} {sent}".strip()
    if cur:
        # Do not leave a one-sentence stub of a few words on its own.
        if out and len(cur.split()) < 12:
            out[-1] += " " + cur
        else:
            out.append(cur)
    return out


def paras(text, cls=None, chunk=False):
    """Text with blank-line or newline breaks -> <p> elements."""
    if text is None:
        return ""
    c = f' class="{cls}"' if cls else ""
    out = []
    for block in re.split(r"\n+", str(text).strip()):
        block = block.strip()
        if not block:
            continue
        for piece in (chunk_paragraph(block) if chunk else [block]):
            out.append(f"<p{c}>{esc(piece)}</p>")
    return "\n".join(out)


def callout(label, text):
    return f'<p class="callout"><b>{esc(label)}</b> {esc(text)}</p>'


def bullets(items, ordered=False):
    items = [i for i in items if isinstance(i, str) and i.strip()]
    if not items:
        return ""
    tag = "ol" if ordered else "ul"
    return f"<{tag}>" + "".join(f"<li>{esc(i)}</li>" for i in items) + f"</{tag}>"


def ensure_stop(text):
    text = str(text).strip()
    return text if text[-1:] in ".!?)\"'" else text + "."


# ---------------------------------------------------------------- questions

def question_block(n, q):
    """Returns (question html, answer html) for one question numbered n."""
    if q["type"] == "tf":
        ask = f"<p><b>{n}.</b> True or false? {esc(q['question'])}</p>"
        opts = ""
        right = "True" if q.get("answer") else "False"
    else:
        options = q["options"]
        correct = q["correct"] if isinstance(q["correct"], list) else [q["correct"]]
        multi = ""
        if q["type"] == "ms" and "choose" not in q["question"].lower() and "select" not in q["question"].lower():
            multi = " (Choose all that apply.)"
        ask = f"<p><b>{n}.</b> {esc(q['question'])}{multi}</p>"
        opts = "".join(f'<p class="opt">{LETTERS[i]}. {esc(o)}</p>' for i, o in enumerate(options))
        right = "; ".join(f"{LETTERS[i]}. {options[i]}" for i in correct)
    ans = f"<p><b>{n}. {esc(right)}</b></p>\n{paras(q['explanation'])}"
    if q.get("whyTested"):
        ans += "\n" + callout("Why it is tested:", q["whyTested"])
    return ask + opts, ans


def quiz_section(questions, heading="Check yourself"):
    """A short quiz followed by its answers, for the end of a chapter or case study."""
    if not questions:
        return ""
    qs, ans = [], []
    for n, q in enumerate(questions, 1):
        a, b = question_block(n, q)
        qs.append(a)
        ans.append(b)
    return (
        f"<h2>{esc(heading)}</h2>\n" + "\n".join(qs) +
        "\n<h2>Answers</h2>\n" + "\n".join(ans)
    )


# ---------------------------------------------------------------- book model

class Book:
    """Collects XHTML files and a two-level table of contents, then writes the EPUB."""

    def __init__(self, title, subtitle, book_id, language="en"):
        self.title, self.subtitle, self.book_id, self.language = title, subtitle, book_id, language
        self.files = []        # (filename, title, body)
        self.toc = []          # [(title, filename, [(title, filename), ...])]
        self._n = 0

    def add(self, title, body, parent=None):
        self._n += 1
        name = f"s{self._n:03d}-{slug(title)[:40]}.xhtml"
        self.files.append((name, title, body))
        entry = (title, name)
        if parent is None:
            self.toc.append([title, name, []])
        else:
            parent[2].append(entry)
        return self.toc[-1] if parent is None else entry

    def page(self, title, body):
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n'
            f'<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="{self.language}" xml:lang="{self.language}">\n'
            f'<head><meta charset="utf-8"/><title>{esc(title)}</title>'
            '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
            f'<body>\n{body}\n</body>\n</html>\n'
        )

    def write(self, path, cover_png=None):
        when = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        urn = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, 'cert-study-hub/guide/' + self.book_id)}"
        manifest, spine = [], []
        for i, (name, _t, _b) in enumerate(self.files, 1):
            manifest.append(f'<item id="f{i:03d}" href="{name}" media-type="application/xhtml+xml"/>')
            spine.append(f'<itemref idref="f{i:03d}"/>')
        cover_meta = cover_item = ""
        if cover_png:
            cover_item = '<item id="cover-img" href="cover.png" media-type="image/png" properties="cover-image"/>'
            cover_meta = '<meta name="cover" content="cover-img"/>'

        def li(entry):
            title, name, kids = entry
            sub = ""
            if kids:
                sub = "<ol>" + "".join(f'<li><a href="{n}">{esc(t)}</a></li>' for t, n in kids) + "</ol>"
            return f'<li><a href="{name}">{esc(title)}</a>{sub}</li>'

        nav = (
            '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">'
            f'<head><meta charset="utf-8"/><title>{esc(self.title)}</title></head><body>'
            f'<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>{"".join(li(e) for e in self.toc)}</ol></nav></body></html>\n'
        )
        order = [0]

        def ncx_point(entry):
            title, name, kids = entry
            order[0] += 1
            me = order[0]
            inner = "".join(ncx_point((t, n, [])) for t, n in kids)
            return (f'<navPoint id="n{me}" playOrder="{me}"><navLabel><text>{esc(title)}</text></navLabel>'
                    f'<content src="{name}"/>{inner}</navPoint>')

        points = "".join(ncx_point(e) for e in self.toc)
        depth = 2 if any(e[2] for e in self.toc) else 1
        ncx = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
            f'<head><meta name="dtb:uid" content="{urn}"/><meta name="dtb:depth" content="{depth}"/>'
            '<meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>'
            f'<docTitle><text>{esc(self.title)}</text></docTitle><navMap>{points}</navMap></ncx>\n'
        )
        opf = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">'
            '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
            f'<dc:identifier id="bookid">{urn}</dc:identifier><dc:title>{esc(self.title)}</dc:title>'
            f'<dc:creator>Cert Study Hub</dc:creator><dc:language>{self.language}</dc:language>'
            f'<dc:description>{esc(self.subtitle)}</dc:description>'
            f'<meta property="dcterms:modified">{when}</meta>{cover_meta}</metadata><manifest>'
            '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
            '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
            '<item id="css" href="style.css" media-type="text/css"/>'
            f'{cover_item}{"".join(manifest)}</manifest><spine toc="ncx">{"".join(spine)}</spine></package>\n'
        )
        container = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
            '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>'
            '</container>\n'
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(path, "w") as z:
            z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
            z.writestr("META-INF/container.xml", container, compress_type=zipfile.ZIP_DEFLATED)
            z.writestr("OEBPS/content.opf", opf, compress_type=zipfile.ZIP_DEFLATED)
            z.writestr("OEBPS/nav.xhtml", nav, compress_type=zipfile.ZIP_DEFLATED)
            z.writestr("OEBPS/toc.ncx", ncx, compress_type=zipfile.ZIP_DEFLATED)
            z.writestr("OEBPS/style.css", CSS, compress_type=zipfile.ZIP_DEFLATED)
            if cover_png:
                z.writestr("OEBPS/cover.png", cover_png, compress_type=zipfile.ZIP_STORED)
            for name, title, body in self.files:
                z.writestr(f"OEBPS/{name}", self.page(title, body), compress_type=zipfile.ZIP_DEFLATED)


def make_cover(title, subtitle):
    """A plain black-and-white cover (600x900). Returns PNG bytes, or None if Pillow is not installed."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io
    except ImportError:
        return None
    W, H = 600, 900
    img = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 300], fill=0)
    d.rectangle([20, 20, W - 20, 280], outline=255, width=4)

    def font(size, bold=False):
        for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                  "/System/Library/Fonts/Helvetica.ttc", "DejaVuSans.ttf"):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
        return ImageFont.load_default()

    def wrapped(text, f, width):
        lines, cur = [], ""
        for w in text.split():
            t = f"{cur} {w}".strip()
            if d.textlength(t, font=f) <= width or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    head, tail = title.split(" in ", 1) if " in " in title else (title, "")
    f1 = font(84, True)
    y = 70
    for ln in wrapped(head, f1, W - 90):
        d.text((W // 2, y), ln, font=f1, fill=255, anchor="mt")
        y += 96
    if tail:
        f2 = font(38, True)
        d.text((W // 2, 215), "in " + tail, font=f2, fill=255, anchor="mt")
    f3 = font(34)
    y = 360
    for ln in wrapped(subtitle, f3, W - 100):
        d.text((W // 2, y), ln, font=f3, fill=0, anchor="mt")
        y += 46
    d.line([120, H - 110, W - 120, H - 110], fill=0, width=3)
    d.text((W // 2, H - 80), "Cert Study Hub", font=font(26), fill=0, anchor="mt")
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


# ---------------------------------------------------------------- content -> chapters

def by_category(items, cats):
    order = [c["key"] for c in cats]
    label = {c["key"]: c["label"] for c in cats}
    groups = {}
    for it in items:
        groups.setdefault(it.get("cat"), []).append(it)
    for key in [k for k in groups if k not in order]:
        order.append(key)
        label[key] = str(key or "Other")
    return [(label[k], groups[k]) for k in order if k in groups]


def part_page(title, intro_paragraphs, contents=None):
    body = f"<h1>{esc(title)}</h1>\n" + "\n".join(paras(p) for p in intro_paragraphs)
    if contents:
        body += "\n" + bullets(contents)
    return body


def start_here(track, cfg, data, counts):
    label, sub = track["label"], track["subtitle"]
    body = [f"<h1>Start here</h1>"]
    body.append(paras(f"This guide gets you ready for the {label} exam ({sub}). It is written for someone starting out: "
                      "short paragraphs, everyday comparisons first, the technical detail second, and a quick quiz at the end of every chapter."))
    body.append("<h2>About the exam</h2>")
    facts = []
    if cfg.get("passLabel"):
        facts.append(cfg["passLabel"])
    exp = cfg.get("experience") or {}
    if exp.get("summary"):
        facts.append("Experience: " + exp["summary"])
    body.append(bullets(facts) if facts else paras("Check the official exam page for the current format, length and passing score."))
    body.append("<h2>How this book is organised</h2>")
    body.append(bullets([
        f"Part 1, The lessons: {counts['lessons']} chapters. Read these in order the first time.",
        f"Part 2, Cheat sheet: {counts['cheat']} one-screen summaries for the night before.",
        f"Part 3, Word bank: {counts['cards']} terms with plain definitions and examples.",
        "Part 4, Worked examples: case studies, step-by-step processes, head-to-head choices"
        + (" and commands." if counts["cli"] else "."),
        f"Part 5, Practice questions: {counts['questions']} questions in sets of ten, with the answers at the end of each set.",
    ]))
    body.append("<h2>How to use it</h2>")
    body.append(bullets([
        "Read a chapter, then answer its Check yourself questions before you read the answers.",
        "Anything you get wrong, find in the Word bank and read the plain definition again.",
        "When you finish Part 1, work through the Practice questions a set at a time.",
        "Keep the Cheat sheet for the last few days before the exam.",
    ]))
    if counts["skipped"]:
        body.append(paras(f"Note: {counts['skipped']} questions that depend on a picture or diagram are left out of this "
                          "book because the picture cannot be shown. They are in the study app.", "small"))
    return "\n".join(body)


def lesson_chapter(n, lesson, cards, questions):
    title = lesson["title"]
    b = [f"<h1>Chapter {n}: {esc(title)}</h1>"]
    if lesson.get("summary"):
        b.append(f'<p class="nutshell"><b>In a nutshell:</b> {esc(lesson["summary"])}</p>')
    if lesson.get("keyTerms"):
        b.append(f'<p class="callout"><b>You will meet:</b> {esc(", ".join(lesson["keyTerms"]))}.</p>')
    if lesson.get("fundamentals"):
        b.append("<h2>The everyday picture</h2>")
        b.append(paras(lesson["fundamentals"], chunk=True))
    b.append("<h2>The details</h2>")
    b.append(paras(lesson["reading"], chunk=True))
    vocab = [cards[i] for i in lesson.get("vocabIds", []) if i in cards]
    if vocab:
        b.append("<h2>Words to know</h2>")
        b.append("".join(f"<p><b>{esc(c['front'])}.</b> {esc(c['back'])}</p>" for c in vocab))
    if lesson.get("commonTraps"):
        b.append("<h2>Watch out</h2>")
        b.append(bullets(lesson["commonTraps"]))
    if lesson.get("scenario"):
        b.append("<h2>A worked example</h2>")
        b.append(paras(lesson["scenario"], chunk=True))
    if lesson.get("onTheJob"):
        b.append("<h2>On the job</h2>")
        b.append(paras(lesson["onTheJob"], chunk=True))
    quiz = [questions[i] for i in lesson.get("quizIds", []) if i in questions and not questions[i].get("image")]
    b.append(quiz_section(quiz))
    return "\n".join(b)


def glossary_page(cat_label, cards):
    b = [f"<h1>Word bank: {esc(cat_label)}</h1>", paras(f"{len(cards)} terms.", "small")]
    for c in cards:
        b.append(f"<p><b>{esc(c['front'])}.</b> {esc(c['back'])}</p>")
        if c.get("detail"):
            b.append(f"<p><i>Example:</i> {esc(c['detail'])}</p>")
    return "\n".join(b)


def case_study_page(cs):
    b = [f"<h1>Case study: {esc(cs['title'])}</h1>", paras(cs["scenario"], chunk=True)]
    b.append(quiz_section([q for q in cs.get("questions", []) if not q.get("image")], "Questions"))
    return "\n".join(b)


def sequences_page(items):
    b = ["<h1>Put it in order</h1>", paras("Each process below is listed in the correct order, with a note on why it works that way.")]
    for i, s in enumerate(items, 1):
        b.append(f"<h2>{i}. {esc(s['prompt'])}</h2>")
        b.append(bullets(s["steps"], ordered=True))
        b.append(paras(s["explanation"], chunk=True))
    return "\n".join(b)


def compare_page(items):
    b = ["<h1>Which would you choose?</h1>", paras("Each scenario has two plausible answers. The better one is marked, with the reason.")]
    for i, c in enumerate(items, 1):
        better = "A" if str(c["better"]).upper() == "A" else "B"
        b.append(f"<h2>Scenario {i}</h2>")
        b.append(paras(c["scenario"]))
        b.append(f'<p class="opt"><b>A.</b> {esc(c["optionA"])}</p><p class="opt"><b>B.</b> {esc(c["optionB"])}</p>')
        b.append(f"<p><b>Better: {better}.</b></p>")
        b.append(paras(c["why"], chunk=True))
    return "\n".join(b)


def cli_page(items):
    b = ["<h1>Commands to know</h1>", paras("Each item says what you want to do and the command that does it.")]
    for i, c in enumerate(items, 1):
        b.append(f"<p><b>{i}.</b> {esc(c['prompt'])}</p>")
        b.append(f"<p>Command: <b>{esc(c['command'])}</b></p>")
        b.append(paras(c["explanation"]))
    return "\n".join(b)


def cheat_page(sec):
    return f"<h1>{esc(sec['heading'])}</h1>\n{bullets(sec.get('points', []))}"


def build_track(track, tracks_cfg, out_dir, quiet=False):
    key = track["key"]
    data = json.loads((DATA / f"{key}.json").read_text())
    cfg = tracks_cfg.get(key, {})
    cards = {c["id"]: c for c in data["flashcards"]}
    all_q = {q["id"]: q for q in data["questions"]}
    usable_q = [q for q in data["questions"] if not q.get("image")]
    skipped = len(data["questions"]) - len(usable_q)

    title = TITLE_TEMPLATE.format(label=track["label"])
    subtitle = SUBTITLE_TEMPLATE.format(sub=track["subtitle"])
    book = Book(title, subtitle, key)
    counts = {"lessons": len(data["lessons"]), "cheat": len([s for s in data.get("cheatSheet", []) if s.get("points")]),
              "cards": len(cards), "questions": len(usable_q), "skipped": skipped, "cli": len(data.get("cliChallenges", []))}

    book.add("Start here", start_here(track, cfg, data, counts))

    # Part 1
    parent = book.add("Part 1: The lessons", part_page(
        "Part 1: The lessons",
        [f"{counts['lessons']} chapters. Each one starts with the big picture in plain words, then the detail, then a short quiz."],
        [f"Chapter {i}: {l['title']}" for i, l in enumerate(data["lessons"], 1)]))
    for i, lesson in enumerate(data["lessons"], 1):
        book.add(f"Chapter {i}: {lesson['title']}", lesson_chapter(i, lesson, cards, all_q), parent)

    # Part 2
    secs = [s for s in data.get("cheatSheet", []) if s.get("points")]
    if secs:
        parent = book.add("Part 2: Cheat sheet", part_page(
            "Part 2: Cheat sheet", ["The key facts, one topic at a time. Good for a last read before the exam."],
            [s["heading"] for s in secs]))
        for s in secs:
            book.add(s["heading"], cheat_page(s), parent)

    # Part 3
    groups = by_category(data["flashcards"], data["categories"])
    parent = book.add("Part 3: Word bank", part_page(
        "Part 3: Word bank",
        [f"{len(cards)} terms in plain language, grouped by exam domain. Each has a short example of how it shows up."],
        [f"{lab} ({len(cs)})" for lab, cs in groups]))
    for lab, cs in groups:
        book.add(f"Words: {lab} ({len(cs)})", glossary_page(lab, cs), parent)

    # Part 4
    ex_pages = []
    for cs in data.get("caseStudies", []):
        ex_pages.append((f"Case study: {cs['title']}", case_study_page(cs)))
    if data.get("sequences"):
        ex_pages.append(("Put it in order", sequences_page(data["sequences"])))
    if data.get("compare"):
        ex_pages.append(("Which would you choose?", compare_page(data["compare"])))
    if data.get("cliChallenges"):
        ex_pages.append(("Commands to know", cli_page(data["cliChallenges"])))
    if ex_pages:
        parent = book.add("Part 4: Worked examples", part_page(
            "Part 4: Worked examples", ["Real-world scenarios and step-by-step processes that tie the chapters together."],
            [t for t, _ in ex_pages]))
        for t, body in ex_pages:
            book.add(t, body, parent)

    # Part 5
    qgroups = by_category(usable_q, data["categories"])
    nsets = sum((len(qs) + SET_SIZE - 1) // SET_SIZE for _, qs in qgroups)
    parent = book.add("Part 5: Practice questions", part_page(
        "Part 5: Practice questions",
        [f"{len(usable_q)} questions in {nsets} sets of up to {SET_SIZE}, grouped by exam domain. "
         "Answer a whole set first, then read the answers that follow it."]))
    for lab, qs in qgroups:
        pages = (len(qs) + SET_SIZE - 1) // SET_SIZE
        for p in range(pages):
            chunk = qs[p * SET_SIZE:(p + 1) * SET_SIZE]
            first = p * SET_SIZE + 1
            heading = f"{lab}: questions {first} to {first + len(chunk) - 1}"
            body = f"<h1>{esc(heading)}</h1>\n" + quiz_section_numbered(chunk, first)
            book.add(heading, body, parent)

    out_path = out_dir / f"{safe_filename(title)}.epub"
    book.write(out_path, make_cover(title, track["subtitle"]))
    if not quiet:
        kb = out_path.stat().st_size / 1024
        print(f"{track['label']:<16} {len(book.files):>3} files  {counts['lessons']:>2} chapters  "
              f"{counts['questions']:>3} questions ({skipped} picture questions left out)  {kb:,.0f} KB  -> {out_path}")
    return out_path


def quiz_section_numbered(questions, first):
    qs, ans = [], []
    for n, q in enumerate(questions, first):
        a, b = question_block(n, q)
        qs.append(a)
        ans.append(b)
    return "\n".join(qs) + "\n<h2>Answers</h2>\n" + "\n".join(ans)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tracks", nargs="*", help="track keys (default: all)")
    ap.add_argument("--out", default=str(ROOT / "eink-out" / "guides"))
    args = ap.parse_args()
    tracks_json = json.loads((DATA / "tracks.json").read_text())
    tracks = tracks_json["tracks"]
    cfg = tracks_json["examConfig"]
    if args.tracks:
        known = {t["key"] for t in tracks}
        bad = [k for k in args.tracks if k not in known]
        if bad:
            sys.exit(f"Unknown track(s): {', '.join(bad)}. Known: {', '.join(sorted(known))}")
        tracks = [t for t in tracks if t["key"] in args.tracks]
    out = Path(args.out)
    for t in tracks:
        if not (DATA / f"{t['key']}.json").exists():
            print(f"skip {t['key']}: no dist/data file (run python3 build.py)")
            continue
        build_track(t, cfg, out)


if __name__ == "__main__":
    main()
