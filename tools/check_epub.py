#!/usr/bin/env python3
"""Structural check for the EPUBs this repo writes. A stand-in for epubcheck when Java and epubcheck are not at hand.

It does NOT replace epubcheck (it does not validate against the XHTML or OPF schemas); it catches the mistakes that
make e-readers refuse or mangle a book: bad zip layout, XML that is not well formed, broken manifest/spine/TOC links,
duplicate ids, missing files, unreferenced files, and markup these small readers handle badly (tables, scripts,
inline images in the text, fixed pixel sizes, forced page breaks).

    python3 -I tools/check_epub.py book.epub [more.epub ...]

Exit status is 1 if any book has an error. Warnings do not change it.
"""
import posixpath
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = {
    "c": "urn:oasis:names:tc:opendocument:xmlns:container",
    "o": "http://www.idpf.org/2007/opf",
    "dc": "http://purl.org/dc/elements/1.1/",
    "x": "http://www.w3.org/1999/xhtml",
    "n": "http://www.daisy.org/z3986/2005/ncx/",
    "e": "http://www.idpf.org/2007/ops",
}
BAD_TAGS = ("table", "script", "iframe", "svg", "img", "object", "form", "style", "font")


def check(path):
    errs, warns = [], []
    try:
        z = zipfile.ZipFile(path)
    except zipfile.BadZipFile as exc:
        return [f"not a zip: {exc}"], []
    names = z.namelist()
    infos = z.infolist()
    if len(names) != len(set(names)):
        errs.append("duplicate names in the zip")
    if not infos or infos[0].filename != "mimetype":
        errs.append("mimetype is not the first entry")
    elif infos[0].compress_type != zipfile.ZIP_STORED:
        errs.append("mimetype is compressed")
    elif z.read("mimetype") != b"application/epub+zip":
        errs.append("mimetype content is wrong")
    if infos and infos[0].extra:
        errs.append("mimetype entry has extra field data")

    def xml(name):
        try:
            return ET.fromstring(z.read(name))
        except KeyError:
            errs.append(f"missing {name}")
        except ET.ParseError as exc:
            errs.append(f"{name}: not well-formed XML: {exc}")
        return None

    cont = xml("META-INF/container.xml")
    if cont is None:
        return errs, warns
    rf = cont.find(".//c:rootfile", NS)
    opf_path = rf.get("full-path") if rf is not None else None
    if not opf_path or opf_path not in names:
        return errs + ["container.xml does not point at an existing package file"], warns
    base = posixpath.dirname(opf_path)
    opf = xml(opf_path)
    if opf is None:
        return errs, warns

    def res(href):
        return posixpath.normpath(posixpath.join(base, href.split("#")[0]))

    # metadata
    if opf.get("version") not in ("3.0", "2.0"):
        errs.append(f"package version {opf.get('version')}")
    uid = opf.get("unique-identifier")
    ids = [e.get("id") for e in opf.findall(".//o:metadata/*", NS) if e.get("id")]
    if uid not in ids:
        errs.append("unique-identifier does not match a dc:identifier id")
    for tag in ("dc:identifier", "dc:title", "dc:language"):
        if opf.find(f".//{tag}", NS) is None:
            errs.append(f"missing <{tag}>")
    mod = [m for m in opf.findall(".//o:meta", NS) if m.get("property") == "dcterms:modified"]
    if opf.get("version") == "3.0" and not (mod and re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", (mod[0].text or ""))):
        errs.append("dcterms:modified missing or not CCYY-MM-DDThh:mm:ssZ")

    # manifest
    items, hrefs = {}, set()
    for it in opf.findall(".//o:manifest/o:item", NS):
        i, h = it.get("id"), it.get("href")
        if i in items:
            errs.append(f"duplicate manifest id {i}")
        items[i] = it
        p = res(h)
        hrefs.add(p)
        if p not in names:
            errs.append(f"manifest file missing: {h}")
        if not it.get("media-type"):
            errs.append(f"manifest item {i} has no media-type")
    navs = [i for i in items.values() if "nav" in (i.get("properties") or "").split()]
    if opf.get("version") == "3.0" and len(navs) != 1:
        errs.append(f"expected exactly one nav item, found {len(navs)}")
    for n in names:
        if n.startswith("META-INF/") or n == "mimetype" or n == opf_path or n.endswith("/"):
            continue
        if n not in hrefs:
            warns.append(f"file not in the manifest: {n}")

    # spine
    spine = opf.findall(".//o:spine/o:itemref", NS)
    if not spine:
        errs.append("empty spine")
    spine_files = []
    for r in spine:
        it = items.get(r.get("idref"))
        if it is None:
            errs.append(f"spine idref {r.get('idref')} not in the manifest")
        else:
            spine_files.append(res(it.get("href")))
    toc_id = opf.find(".//o:spine", NS).get("toc")
    if toc_id and toc_id not in items:
        errs.append("spine toc does not name a manifest item")

    # content documents
    for f in spine_files:
        root = xml(f)
        if root is None:
            continue
        if root.tag != "{%s}html" % NS["x"]:
            errs.append(f"{f}: root is not XHTML html")
        if root.find(".//x:head/x:title", NS) is None or not (root.find(".//x:head/x:title", NS).text or "").strip():
            errs.append(f"{f}: empty or missing <title>")
        idset, seen = set(), set()
        for el in root.iter():
            i = el.get("id")
            if i:
                if i in seen:
                    errs.append(f"{f}: duplicate id {i}")
                seen.add(i)
            tag = el.tag.split("}")[-1]
            if tag in BAD_TAGS and tag != "style":
                warns.append(f"{f}: <{tag}> (small readers handle this badly)")
            if el.get("style"):
                warns.append(f"{f}: inline style")
        if root.find(".//x:h1", NS) is None:
            warns.append(f"{f}: no <h1>")
        size = len(z.read(f))
        if size > 120_000:
            warns.append(f"{f}: {size // 1024} KB (large for a small reader)")
        text = z.read(f).decode("utf-8")
        if re.search(r"page-break|break-(before|after)", text):
            warns.append(f"{f}: forced page break")
        if re.search(r"<(\w+)[^>]*>\s*</\1>", text.replace("<br/>", "")) and "<p></p>" in text:
            warns.append(f"{f}: empty paragraph")
    for css in [h for h in hrefs if h.endswith(".css")]:
        t = z.read(css).decode("utf-8")
        if re.search(r"break-(before|after)|page-break|\bpx\b|position\s*:|float\s*:|column", t):
            warns.append(f"{css}: has page breaks, px sizes, positioning, floats or columns")

    # nav (EPUB 3)
    if navs:
        nav_path = res(navs[0].get("href"))
        nav = xml(nav_path)
        if nav is not None:
            toc = [n for n in nav.iter("{%s}nav" % NS["x"]) if n.get("{%s}type" % NS["e"]) == "toc"]
            if len(toc) != 1:
                errs.append("nav.xhtml needs exactly one nav epub:type=toc")
            else:
                links = [a.get("href") for a in toc[0].iter("{%s}a" % NS["x"])]
                for h in links:
                    p = posixpath.normpath(posixpath.join(posixpath.dirname(nav_path), h.split("#")[0]))
                    if p not in spine_files:
                        errs.append(f"nav link not in the spine: {h}")
                missing = [f for f in spine_files if f not in {posixpath.normpath(posixpath.join(posixpath.dirname(nav_path), h.split('#')[0])) for h in links}]
                if missing:
                    warns.append(f"{len(missing)} spine files are not in the table of contents")
                depth = 0
                for ol in toc[0].iter("{%s}ol" % NS["x"]):
                    pass
    # ncx
    if toc_id and toc_id in items:
        ncx_path = res(items[toc_id].get("href"))
        ncx = xml(ncx_path)
        if ncx is not None:
            pts = list(ncx.iter("{%s}navPoint" % NS["n"]))
            orders = [int(p.get("playOrder", 0)) for p in pts]
            if orders != sorted(orders) or len(set(orders)) != len(orders):
                errs.append("ncx playOrder is not unique and increasing")
            nid = [p.get("id") for p in pts]
            if len(set(nid)) != len(nid):
                errs.append("ncx navPoint ids are not unique")
            for p in pts:
                src = p.find("n:content", NS).get("src")
                if posixpath.normpath(posixpath.join(posixpath.dirname(ncx_path), src.split("#")[0])) not in spine_files:
                    errs.append(f"ncx link not in the spine: {src}")
            uid_meta = ncx.find(".//n:meta[@name='dtb:uid']", NS)
            ident = opf.find(".//dc:identifier", NS)
            if uid_meta is not None and ident is not None and uid_meta.get("content") != ident.text:
                errs.append("ncx dtb:uid differs from dc:identifier")
    return errs, warns


def main():
    paths = sys.argv[1:]
    if not paths:
        sys.exit(__doc__)
    bad = 0
    for p in paths:
        errs, warns = check(p)
        print(f"{p}: {'OK' if not errs else 'ERRORS'}  ({len(errs)} errors, {len(warns)} warnings)")
        for e in errs:
            print("  ERROR  ", e)
        for w in sorted(set(warns))[:20]:
            print("  warning", w)
        bad += bool(errs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
