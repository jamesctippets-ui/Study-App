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
    python3 tools/eink_export.py ccna --preview        also write a browser preview (open eink-out/preview/index.html)

The preview is a plain HTML page per book that pages the content on an 800x480, four-grey screen with tap zones, so it
can be tried on any computer. It approximates the Sticky (the real reader uses its own fonts and layout) and is not
written next to the books if you point --out at an SD card; use --preview-dir for a separate folder.

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
h1 + .card { break-before: auto; page-break-before: auto; }
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


PREVIEW_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__ (e-ink preview)</title>
<style>
__CSS__
html,body{margin:0;background:#d8d8d8;color:#111;font:14px system-ui,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:16px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}
.bar button,.bar select{font:inherit;padding:6px 10px}
.bar .info{margin-left:auto}
#stage{width:800px;height:480px;transform-origin:0 0}
#holder{width:800px;height:480px}
#screen{width:800px;height:480px;overflow:hidden;position:relative;background:#fff;box-shadow:0 0 0 10px #222}
#screen.grey{filter:url(#g4)}
#flow{box-sizing:border-box;width:800px;height:480px;padding:24px;column-width:752px;column-gap:48px;column-fill:auto;
  font:var(--fs,24px)/1.4 Georgia,"Times New Roman",serif;color:#000;transition:none;position:relative}
#flow h1{break-before:column;-webkit-column-break-before:always;font-size:1.3em}
#flow .card{break-before:column;-webkit-column-break-before:always}
#flow h1+.card{break-before:auto;-webkit-column-break-before:auto}
#flash{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}
.help{margin-top:22px;font-size:13px;color:#333}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="g4"><feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"/>
<feComponentTransfer><feFuncR type="discrete" tableValues="0 0.33 0.67 1"/><feFuncG type="discrete" tableValues="0 0.33 0.67 1"/><feFuncB type="discrete" tableValues="0 0.33 0.67 1"/></feComponentTransfer></filter></svg>
<div class="wrap">
<div class="bar"><a href="index.html">All books</a><strong>__TITLE__</strong>
<span class="info"><span id="pos"></span></span></div>
<div class="bar">
<button id="prev">&larr; Prev</button><button id="next">Next &rarr;</button>
<select id="chap" aria-label="Chapter"></select>
<label>Text <select id="fs"><option value="20px">Small</option><option value="24px" selected>Medium</option><option value="28px">Large</option><option value="32px">Extra large</option></select></label>
<label>Zoom <select id="zoom"><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>
<label><input type="checkbox" id="grey" checked> 4 greys</label>
<label><input type="checkbox" id="fl"> refresh flash</label>
</div>
<div id="holder"><div id="stage"><div id="screen" class="grey"><div id="flow"></div><div id="flash"></div></div></div></div>
<p class="help">Tap the right two-thirds of the screen (or press &rarr; / space) for the next page, the left third (or &larr;) for the previous page.
This approximates the Sticky's 800x480 panel; its CrossPoint firmware uses its own fonts and may break lines and pages differently.</p>
</div>
<script id="book" type="application/json">__DATA__</script>
<script>
(function(){
var chapters=JSON.parse(document.getElementById("book").textContent);
var flow=document.getElementById("flow"),screen=document.getElementById("screen"),flash=document.getElementById("flash");
var chap=document.getElementById("chap"),pos=document.getElementById("pos");
flow.innerHTML=chapters.map(function(c){return "<h1>"+c[0]+"</h1>"+c[1];}).join("");
chapters.forEach(function(c,i){var o=document.createElement("option");o.value=i;o.textContent=c[0].replace(/&amp;/g,"&");chap.appendChild(o);});
var page=0,pages=1,starts=[];
function measure(){
  pages=Math.max(1,Math.ceil(flow.scrollWidth/800));
  var h=flow.querySelectorAll("h1");starts=[];
  h.forEach(function(e){starts.push(Math.round(e.offsetLeft/800));});
  show(Math.min(page,pages-1),false);
}
function show(n,flashIt){
  page=Math.max(0,Math.min(pages-1,n));
  flow.style.transform="translateX("+(-800*page)+"px)";
  var ci=0;starts.forEach(function(s,i){if(s<=page)ci=i;});chap.value=ci;
  pos.textContent="page "+(page+1)+" of "+pages;
  if(flashIt&&document.getElementById("fl").checked){flash.style.transition="none";flash.style.opacity="1";
    setTimeout(function(){flash.style.transition="opacity .35s";flash.style.opacity="0";},120);}
}
document.getElementById("prev").onclick=function(){show(page-1,true);};
document.getElementById("next").onclick=function(){show(page+1,true);};
chap.onchange=function(){show(starts[+chap.value]||0,true);};
document.getElementById("fs").onchange=function(){flow.style.setProperty("--fs",this.value);measure();};
document.getElementById("grey").onchange=function(){screen.classList.toggle("grey",this.checked);};
var z=document.getElementById("zoom"),stage=document.getElementById("stage"),holder=document.getElementById("holder");
z.onchange=function(){var f=+z.value;stage.style.transform="scale("+f+")";holder.style.width=800*f+"px";holder.style.height=480*f+"px";};
screen.addEventListener("click",function(e){var r=screen.getBoundingClientRect();(e.clientX-r.left)/r.width<1/3?show(page-1,true):show(page+1,true);});
document.addEventListener("keydown",function(e){
  if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){e.preventDefault();show(page+1,true);}
  else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();show(page-1,true);}
});
window.addEventListener("load",measure);measure();
})();
</script></body></html>
"""


def write_preview(path, title, chapters):
    """One self-contained HTML page that pages a book on an 800x480 four-grey screen (see PREVIEW_PAGE)."""
    # Chapter titles go into innerHTML, so they are escaped here; bodies are already escaped HTML.
    data = json.dumps([[esc(t), body] for t, body in chapters]).replace("</", "<\\/")
    html = (PREVIEW_PAGE.replace("__CSS__", CSS).replace("__TITLE__", esc(title)).replace("__DATA__", data))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, "utf-8")


def write_preview_index(path, books):
    rows = "".join(f'<li><a href="{esc(f)}">{esc(t)}</a></li>' for t, f in books)
    path.write_text(
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        "<title>E-ink preview</title><style>body{font:16px system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:0 1rem}"
        "li{margin:.3rem 0}</style></head><body><h1>E-ink preview</h1>"
        "<p>Each book pages on an 800x480, four-grey screen like the reTerminal Sticky. It is an approximation: "
        "the device's own fonts and page breaks will differ.</p>"
        f"<ul>{rows}</ul></body></html>\n",
        "utf-8",
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("tracks", nargs="*", help="track keys (default: all)")
    ap.add_argument("--out", default=str(ROOT / "eink-out"), help="output folder (default: ./eink-out)")
    ap.add_argument("--only", choices=KINDS, help="write only this kind of book")
    ap.add_argument("--preview", action="store_true", help="also write a browser preview of each book")
    ap.add_argument("--preview-dir", help="where to write the preview (default: <out>/preview)")
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
    pdir = Path(args.preview_dir) if args.preview_dir else out / "preview"
    previews = []

    def emit(name, title, book_id, chapters):
        build_epub(out / f"{safe_name(name)}.epub", title, book_id, chapters)
        if args.preview:
            fname = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower() + ".html"
            write_preview(pdir / fname, title, chapters)
            previews.append((title, fname))

    for k in keys:
        data = json.loads((DATA / f"{k}.json").read_text("utf-8"))
        label = labels[k]
        notes = []
        if "flashcards" in want and data.get("flashcards"):
            ch = flashcard_chapters(data, masked_prompts(k))
            emit(f"{label} Flashcards", f"{label} Flashcards", f"{k}-flashcards", ch)
            notes.append(f"{len(data['flashcards'])} cards")
            total += 1
        if "questions" in want and data.get("questions"):
            ch, skipped = question_chapters(data)
            emit(f"{label} Questions", f"{label} Questions", f"{k}-questions", ch)
            notes.append(f"{len(data['questions']) - skipped} questions" + (f" ({skipped} image questions skipped)" if skipped else ""))
            total += 1
        if "cheatsheet" in want:
            ch = cheatsheet_chapters(data)
            if ch:
                emit(f"{label} Cheat sheet", f"{label} Cheat sheet", f"{k}-cheatsheet", ch)
                notes.append(f"{len(ch)} cheat-sheet sections")
                total += 1
        print(f"{label}: " + ", ".join(notes))
    print(f"Wrote {total} EPUB files to {out}")
    if args.preview and previews:
        write_preview_index(pdir / "index.html", previews)
        print(f"Preview: open {pdir / 'index.html'}")


if __name__ == "__main__":
    main()
