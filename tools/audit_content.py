#!/usr/bin/env python3
"""Mechanical content audit for the study data (reads dist/data/*.json, so run build.py first).

It does not judge facts. It finds the problems a script can see: broken structure, answer keys that
do not match, giveaways, duplicates, wording slips and explanations that cannot be right once
answers are shuffled. A person (or a reviewing agent) still has to read the content.

    python3 tools/audit_content.py                 # every track, summary table
    python3 tools/audit_content.py ccna sscp       # some tracks, full finding list
    python3 tools/audit_content.py --all-findings  # every track, full finding list
    python3 tools/audit_content.py --json out.json # machine-readable findings

Each finding is (track, kind, item id, code, detail). Severity: 'error' = certainly wrong,
'warn' = very likely worth a look, 'info' = a style or statistical note.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'dist' / 'data'

MOJIBAKE = re.compile(r'(Ã.|â€.|Â |ï»¿|�)')
DOUBLE_SPACE = re.compile(r'\S  +\S')
REPEATED_WORD = re.compile(r'\b([A-Za-z]{3,})\s+\1\b', re.I)
LETTER_REF = re.compile(r'\b(?:option|answer|choice|statement)\s+\(?[A-E]\)?\b(?!\w)|\(\s*[A-E]\s*\)(?=\s*(?:is|are|and|,|\.|:))', re.I)
LETTER_PREFIX = re.compile(r'^\s*(?:[A-E][\.\)]|\([A-E]\))\s+')
ALL_NONE = re.compile(r'\b(all|none) of the (above|following)\b|\bboth (a|b|1|2) and\b', re.I)
IMAGE_WORDS = re.compile(r'\b(exhibit|screenshot|shown below|following (diagram|image|figure|picture)|refer to the (image|diagram|figure))\b', re.I)
PLACEHOLDER = re.compile(r'\b(TODO|TBD|FIXME|lorem ipsum|XXX|placeholder)\b', re.I)
CHOOSE_N = re.compile(r'\(?\bchoose\s+(two|three|four|2|3|4)\b', re.I)
NUMS = {'two': 2, 'three': 3, 'four': 4, '2': 2, '3': 3, '4': 4}


def norm(s):
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', ' ', str(s).lower())).strip()


def tokens(s):
    return set(w for w in norm(s).split() if len(w) > 2)


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def text_slips(text):
    """Wording and encoding slips in one string: -> [(code, detail)]"""
    out = []
    if not isinstance(text, str):
        return [('not-text', repr(text)[:60])]
    if text != text.strip():
        out.append(('whitespace-edge', 'leading or trailing space'))
    if MOJIBAKE.search(text):
        out.append(('mojibake', MOJIBAKE.search(text).group(0)))
    if DOUBLE_SPACE.search(text):
        out.append(('double-space', DOUBLE_SPACE.search(text).group(0)))
    for m in REPEATED_WORD.finditer(text):
        if m.group(1).lower() not in ('any', 'had', 'that', 'bye', 'no'):   # 'permit ip any any' is correct
            out.append(('repeated-word', m.group(0)))
            break
    if PLACEHOLDER.search(text):
        out.append(('placeholder', PLACEHOLDER.search(text).group(0)))
    if text.count('(') != text.count(')'):
        out.append(('unbalanced-parens', f'{text.count("(")} ( vs {text.count(")")} )'))
    if text.count('"') % 2:
        out.append(('odd-quotes', 'odd number of " marks'))
    if re.search(r' [,.](?=\s|$)', text.replace(' ...', '')):
        out.append(('space-before-punct', 'space before , or .'))
    if '..' in text.replace('...', ''):
        out.append(('double-period', '..'))
    return out


class Report:
    def __init__(self):
        self.rows = []

    def add(self, track, kind, item, code, detail, sev='warn'):
        self.rows.append({'track': track, 'kind': kind, 'id': item, 'code': code, 'detail': detail, 'sev': sev})


def audit_questions(track, d, cats, rep):
    qs = d.get('questions', [])
    seen_stem = {}
    stems = []
    longest_correct = 0
    countable = 0
    for q in qs:
        qid = q.get('id')
        t = q.get('type')
        stem = q.get('question', '')
        opts = q.get('options') or []
        ex = q.get('explanation') or ''
        if q.get('cat') not in cats:
            rep.add(track, 'question', qid, 'bad-category', str(q.get('cat')), 'error')
        for code, det in text_slips(stem):
            rep.add(track, 'question', qid, code, f'stem: {det}')
        for code, det in text_slips(ex):
            rep.add(track, 'question', qid, code, f'explanation: {det}')
        if len(ex) < 25:
            rep.add(track, 'question', qid, 'explanation-missing', f'{len(ex)} chars', 'error' if not ex else 'warn')
        if LETTER_REF.search(ex):
            rep.add(track, 'question', qid, 'explanation-names-a-letter', LETTER_REF.search(ex).group(0) + '  (answers are shuffled, so a letter reference is wrong)', 'error')
        if IMAGE_WORDS.search(stem) and not q.get('image'):
            rep.add(track, 'question', qid, 'mentions-image-without-one', IMAGE_WORDS.search(stem).group(0))
        if t in ('mc', 'ms'):
            if not (3 <= len(opts) <= 6):
                rep.add(track, 'question', qid, 'option-count', f'{len(opts)} options', 'error')
            keys = [norm(o) for o in opts]
            if len(set(keys)) != len(keys):
                rep.add(track, 'question', qid, 'duplicate-options', 'two options are the same', 'error')
            for o in opts:
                for code, det in text_slips(o):
                    rep.add(track, 'question', qid, code, f'option "{o[:40]}": {det}')
                if LETTER_PREFIX.search(o):
                    rep.add(track, 'question', qid, 'option-has-letter-prefix', o[:40])
                if ALL_NONE.search(o):
                    rep.add(track, 'question', qid, 'all-or-none-option', o[:60])
            if t == 'mc':
                c = q.get('correct')
                if not isinstance(c, int) or not (0 <= c < len(opts)):
                    rep.add(track, 'question', qid, 'bad-answer-key', repr(c), 'error')
                else:
                    correct = opts[c]
                    lens = sorted((len(o) for i, o in enumerate(opts) if i != c), reverse=True)
                    countable += 1
                    if len(correct) > max(lens):
                        longest_correct += 1
                        if lens and len(correct) >= 2.2 * lens[0] and len(correct) > 80:
                            rep.add(track, 'question', qid, 'correct-answer-much-longer', f'{len(correct)} chars vs {lens[0]}', 'info')
                    if len(norm(correct)) >= 12 and norm(correct) in norm(stem):
                        rep.add(track, 'question', qid, 'answer-appears-in-stem', correct[:50])
            else:
                c = q.get('correct')
                if not isinstance(c, list) or len(c) < 2 or len(set(c)) != len(c) or any((not isinstance(i, int)) or not (0 <= i < len(opts)) for i in c):
                    rep.add(track, 'question', qid, 'bad-answer-key', repr(c), 'error')
                else:
                    if len(c) >= len(opts):
                        rep.add(track, 'question', qid, 'every-option-correct', f'{len(c)} of {len(opts)}', 'error')
                    m = CHOOSE_N.search(stem)
                    if m and NUMS[m.group(1).lower()] != len(c):
                        rep.add(track, 'question', qid, 'choose-count-mismatch', f'stem says {m.group(1)}, key has {len(c)}', 'error')
                    if not m:
                        rep.add(track, 'question', qid, 'multi-select-without-choose-n', 'stem does not say how many to choose', 'warn')
        elif t == 'tf':
            if not isinstance(q.get('answer'), bool):
                rep.add(track, 'question', qid, 'bad-answer-key', repr(q.get('answer')), 'error')
            if opts:
                rep.add(track, 'question', qid, 'tf-has-options', str(len(opts)), 'warn')
        else:
            rep.add(track, 'question', qid, 'unknown-type', str(t), 'error')
        stripped = stem.strip()
        if t != 'tf' and stripped and stripped[-1] not in '?.:)"”' and 'which' not in stripped.lower():
            rep.add(track, 'question', qid, 'stem-ends-oddly', stripped[-30:], 'info')
        key = norm(stem)
        if key in seen_stem:
            rep.add(track, 'question', qid, 'duplicate-stem', f'same wording as {seen_stem[key]}')
        else:
            seen_stem[key] = qid
        stems.append((qid, tokens(stem + ' ' + ' '.join(opts)), stem))
    # near duplicates (same topic, same wording): compare stems with the same first words
    buckets = defaultdict(list)
    for qid, toks, stem in stems:
        buckets[' '.join(norm(stem).split()[:3])].append((qid, toks))
    for _, items in buckets.items():
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                if jaccard(items[i][1], items[j][1]) >= 0.8 and norm(next(s for q, _, s in stems if q == items[i][0])) != norm(next(s for q, _, s in stems if q == items[j][0])):
                    rep.add(track, 'question', items[i][0], 'near-duplicate', f'very similar to {items[j][0]}', 'info')
    return {'countable': countable, 'longest': longest_correct}


def audit_cards(track, d, cats, rep, masked):
    cards = d.get('flashcards', [])
    by_front = defaultdict(list)
    by_back = defaultdict(list)
    for c in cards:
        cid = c.get('id')
        front = c.get('front', '')
        back = c.get('back', '')
        if c.get('cat') not in cats:
            rep.add(track, 'card', cid, 'bad-category', str(c.get('cat')), 'error')
        for field in ('front', 'back', 'detail'):
            if field in c and c[field] not in (None, ''):
                for code, det in text_slips(c[field]):
                    rep.add(track, 'card', cid, code, f'{field}: {det}')
        if not front.strip() or not back.strip():
            rep.add(track, 'card', cid, 'empty-side', 'front or back is empty', 'error')
            continue
        if len(back) < 25:
            rep.add(track, 'card', cid, 'definition-very-short', f'"{back}"')
        if len(front) > 90:
            rep.add(track, 'card', cid, 'term-very-long', f'{len(front)} chars')
        if front.strip().endswith('?'):
            rep.add(track, 'card', cid, 'term-is-a-question', front[:60], 'info')
        if re.search(r'\b(see|refer to) (the )?(lesson|above|below|previous|next)\b', back, re.I):
            rep.add(track, 'card', cid, 'definition-points-elsewhere', back[:60])
        ft = norm(front)
        if ft and norm(back).startswith(ft + ' is ') and len(back) < 70:
            rep.add(track, 'card', cid, 'definition-restates-term', back[:70], 'info')
        by_front[ft].append(cid)
        by_back[norm(back)].append(cid)
        m = masked.get(cid)
        if m is not None:
            if m.count('_____') > 3:
                rep.add(track, 'card', cid, 'prompt-mostly-blanks', f'{m.count("_____")} blanks')
            if len(m.replace('_____', '').strip()) < 25:
                rep.add(track, 'card', cid, 'prompt-too-thin-to-guess', m[:80])
    for ft, ids in by_front.items():
        if len(ids) > 1:
            rep.add(track, 'card', ids[0], 'duplicate-term', f'same term on {", ".join(ids[1:])}')
    for bk, ids in by_back.items():
        if len(ids) > 1:
            rep.add(track, 'card', ids[0], 'duplicate-definition', f'same definition on {", ".join(ids[1:])}')


def audit_others(track, d, cats, rep):
    for m in d.get('madlibs', []):
        mid = m.get('id')
        if m.get('cat') not in cats:
            rep.add(track, 'madlib', mid, 'bad-category', str(m.get('cat')), 'error')
        sc = m.get('scenario', '')
        for code, det in text_slips(sc) + text_slips(m.get('explanation', '')):
            rep.add(track, 'madlib', mid, code, det)
        keys = [b.get('key') for b in m.get('blanks', [])]
        for k in keys:
            if '{' + str(k) + '}' not in sc:
                rep.add(track, 'madlib', mid, 'blank-not-in-scenario', str(k), 'error')
        for k in re.findall(r'\{(\w+)\}', sc):
            if k not in keys:
                rep.add(track, 'madlib', mid, 'scenario-blank-undefined', k, 'error')
        for b in m.get('blanks', []):
            o = b.get('options', [])
            if len(set(norm(x) for x in o)) != len(o) or len(o) < 2:
                rep.add(track, 'madlib', mid, 'blank-options', f'{b.get("key")}: duplicate or too few options', 'error')
            if not isinstance(b.get('correct'), int) or not (0 <= b.get('correct', -1) < len(o)):
                rep.add(track, 'madlib', mid, 'bad-answer-key', f'{b.get("key")}', 'error')
        if len(m.get('explanation', '')) < 25:
            rep.add(track, 'madlib', mid, 'explanation-missing', '')
    for s in d.get('sequences', []):
        sid = s.get('id')
        steps = s.get('steps', [])
        if s.get('cat') not in cats:
            rep.add(track, 'sequence', sid, 'bad-category', str(s.get('cat')), 'error')
        if len(steps) < 3 or len(set(norm(x) for x in steps)) != len(steps):
            rep.add(track, 'sequence', sid, 'steps', 'fewer than 3 steps, or two steps are the same', 'error')
        for x in steps + [s.get('prompt', ''), s.get('explanation', '')]:
            for code, det in text_slips(x):
                rep.add(track, 'sequence', sid, code, det)
        if len(s.get('explanation', '')) < 25:
            rep.add(track, 'sequence', sid, 'explanation-missing', '')
    for c in d.get('compare', []):
        cid = c.get('id')
        if c.get('cat') not in cats:
            rep.add(track, 'compare', cid, 'bad-category', str(c.get('cat')), 'error')
        if c.get('better') not in ('A', 'B'):
            rep.add(track, 'compare', cid, 'bad-answer-key', repr(c.get('better')), 'error')
        if norm(c.get('optionA', '')) == norm(c.get('optionB', '')):
            rep.add(track, 'compare', cid, 'identical-options', '', 'error')
        for x in (c.get('scenario', ''), c.get('optionA', ''), c.get('optionB', ''), c.get('why', '')):
            for code, det in text_slips(x):
                rep.add(track, 'compare', cid, code, det)
        if len(c.get('why', '')) < 25:
            rep.add(track, 'compare', cid, 'explanation-missing', '')
        a, b = c.get('optionA', ''), c.get('optionB', '')
        better = a if c.get('better') == 'A' else b
        other = b if c.get('better') == 'A' else a
        if len(better) > 2 * len(other) and len(better) > 90:
            rep.add(track, 'compare', cid, 'better-option-much-longer', f'{len(better)} vs {len(other)}', 'info')
    for cs in d.get('caseStudies', []):
        cid = cs.get('id')
        if cs.get('cat') not in cats:
            rep.add(track, 'case', cid, 'bad-category', str(cs.get('cat')), 'error')
        for x in (cs.get('scenario', ''), cs.get('title', '')):
            for code, det in text_slips(x):
                rep.add(track, 'case', cid, code, det)
        qs = cs.get('questions', [])
        if len(qs) < 2:
            rep.add(track, 'case', cid, 'few-questions', f'{len(qs)} question(s)')
        for q in qs:
            qid = q.get('id')
            opts = q.get('options') or []
            if q.get('type') == 'mc':
                c = q.get('correct')
                if not isinstance(c, int) or not (0 <= c < len(opts)):
                    rep.add(track, 'case', f'{cid}/{qid}', 'bad-answer-key', repr(c), 'error')
            if len(opts) and len(set(norm(o) for o in opts)) != len(opts):
                rep.add(track, 'case', f'{cid}/{qid}', 'duplicate-options', '', 'error')
            if LETTER_REF.search(q.get('explanation', '') or ''):
                rep.add(track, 'case', f'{cid}/{qid}', 'explanation-names-a-letter', LETTER_REF.search(q.get('explanation', '')).group(0), 'error')
    for l in d.get('lessons', []):
        lid = l.get('id')
        reading = l.get('reading', '')
        for code, det in text_slips(reading):
            if code not in ('whitespace-edge',):
                rep.add(track, 'lesson', lid, code, f'reading: {det}')
        if len(reading) < 600:
            rep.add(track, 'lesson', lid, 'reading-short', f'{len(reading)} chars')
        for x in (l.get('title', ''), l.get('summary', '')):
            for code, det in text_slips(x):
                rep.add(track, 'lesson', lid, code, det)
    for sec in d.get('cheatSheet', []):
        for p in sec.get('points', []):
            for code, det in text_slips(p):
                rep.add(track, 'cheat', sec.get('heading', '?')[:30], code, det)


def load_masked(track):
    """Definition-first prompts as the app shows them (needs node); {} when node is missing."""
    import shutil
    import subprocess
    node = shutil.which('node')
    if not node:
        return {}
    script = ROOT / 'tools' / 'dump_content.js'
    if not script.exists():
        return {}
    r = subprocess.run([node, str(script), track, '--masked-json'], capture_output=True, text=True)
    if r.returncode != 0:
        return {}
    try:
        return json.loads(r.stdout)
    except ValueError:
        return {}


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    flags = [a for a in argv if a.startswith('--')]
    json_out = None
    if '--json' in flags:
        i = argv.index('--json')
        json_out = argv[i + 1]
        args = [a for a in args if a != json_out]
    manifest = json.loads((DATA / 'tracks.json').read_text())
    keys = [t['key'] for t in manifest['tracks']]
    wanted = args or keys
    rep = Report()
    stats = {}
    for key in wanted:
        if key not in keys:
            print(f'unknown track {key}', file=sys.stderr)
            return 2
        d = json.loads((DATA / f'{key}.json').read_text())
        cats = {c['key'] for c in d.get('categories', [])}
        qstats = audit_questions(key, d, cats, rep)
        audit_cards(key, d, cats, rep, load_masked(key))
        audit_others(key, d, cats, rep)
        stats[key] = qstats
    out = rep.rows
    if json_out:
        Path(json_out).write_text(json.dumps(out, indent=1))
    show_all = '--all-findings' in flags or bool(args)
    if show_all:
        for r in sorted(out, key=lambda r: (r['track'], {'error': 0, 'warn': 1, 'info': 2}[r['sev']], r['kind'], str(r['id']))):
            print(f"{r['track']:<14} {r['sev']:<5} {r['kind']:<8} {str(r['id']):<26} {r['code']:<28} {r['detail']}")
        print()
    by_track = defaultdict(Counter)
    for r in out:
        by_track[r['track']][r['sev']] += 1
    print(f"{'track':<15}{'errors':>8}{'warn':>8}{'info':>8}   correct-is-longest")
    for key in wanted:
        c = by_track[key]
        s = stats[key]
        pct = round(100 * s['longest'] / s['countable']) if s['countable'] else 0
        print(f"{key:<15}{c['error']:>8}{c['warn']:>8}{c['info']:>8}   {pct}% of {s['countable']} multiple-choice")
    tot = Counter()
    for c in by_track.values():
        tot.update(c)
    print(f"{'TOTAL':<15}{tot['error']:>8}{tot['warn']:>8}{tot['info']:>8}")
    codes = Counter((r['sev'], r['code']) for r in out)
    print('\nmost common:')
    for (sev, code), n in codes.most_common(25):
        print(f'  {n:>5}  {sev:<5} {code}')
    return 1 if tot['error'] else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
