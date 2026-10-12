#!/usr/bin/env node
/* Tests for the share code and the step bank (src/js/03f_share_bank.js). build.py runs this when
 * node is on the PATH.  node tools/check_share.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'dist/data');
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'tracks.json'), 'utf8'));
const DATA = {};
manifest.tracks.forEach((t) => { DATA[t.key] = JSON.parse(fs.readFileSync(path.join(dataDir, `${t.key}.json`), 'utf8')); });
const read = (f) => fs.readFileSync(path.join(root, 'src/js', f), 'utf8');
const src = `${read('03_helpers.js')}\n${read('03f_share_bank.js')}`;
const names = [...src.matchAll(/^function ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
// eslint-disable-next-line no-new-func
const E = new Function('DATA', 'TRACKS', 'BRIDGES', 'EXAM_CONFIG', 'STORAGE_KEY', `${src}\nreturn { ${[...new Set(names)].join(', ')} };`)(DATA, manifest.tracks, [], manifest.examConfig, manifest.storageKey);

let failures = 0; let checks = 0;
function eq(actual, expected, label) {
  checks += 1;
  const a = JSON.stringify(actual); const b = JSON.stringify(expected);
  if (a !== b) { failures += 1; console.error(`FAIL ${label}\n   got      ${a}\n   expected ${b}`); }
}
const ok = (c, l) => eq(!!c, true, l);

/* ---- share code ---- */
const terms = [
  { id: 'a1', kind: 'term', front: 'Réseau privé', back: 'A private network (accents and “quotes” survive).', track: 'all', at: null },
  { id: 'a2', kind: 'acronym', front: 'RBAC', back: 'Role-based access control', track: 'az900', at: null },
  { id: 'a3', kind: 'term', front: 'Split tunnel', back: 'Only some traffic goes through the VPN.', track: 'nonexistent', at: null },
];
const scenarios = [
  { id: 's1', track: 'az900', title: 'Create a VM', steps: ['Pick a region', 'Choose a size', 'Review and create'], note: 'Region first.', at: null },
];
const code = E.encodeShareCode(terms, scenarios);
ok(/^CSH1\.[A-Za-z0-9_-]+$/.test(code), 'a code is a prefix plus URL-safe text (no padding, no spaces)');
const dec = E.decodeShareCode(code);
eq(dec.error, null, 'a fresh code decodes');
eq(dec.terms.map((t) => [t.kind, t.front, t.track]), [['term', 'Réseau privé', 'all'], ['acronym', 'RBAC', 'az900'], ['term', 'Split tunnel', 'all']], 'terms round-trip; an unknown cert becomes "all"');
eq(dec.terms[0].back, 'A private network (accents and “quotes” survive).', 'unicode survives');
eq(dec.scenarios, [{ track: 'az900', title: 'Create a VM', steps: ['Pick a region', 'Choose a size', 'Review and create'], note: 'Region first.' }], 'scenarios round-trip');
eq(E.decodeShareCode(`  ${code.slice(0, 20)}\n${code.slice(20)}  `).terms.length, 3, 'whitespace and line breaks in a pasted code are ignored');
ok(E.decodeShareCode('hello').error, 'text without the prefix is refused');
ok(E.decodeShareCode('CSH1.@@@').error, 'garbage after the prefix is refused');
ok(E.decodeShareCode(`CSH1.${Buffer.from('{"v":2,"t":[],"s":[]}').toString('base64url')}`).error, 'a newer version is refused');
ok(E.decodeShareCode(code.slice(0, code.length - 12)).error || E.decodeShareCode(code.slice(0, code.length - 12)).terms.length < 3, 'a code cut short does not import as if it were whole');
// items that break the rules are dropped and counted
const bad = E.encodeShareCode([{ kind: 'acronym', front: 'lowercase', back: 'nope' }, { kind: 'term', front: 'ok', back: 'too short a term' }, { kind: 'term', front: 'Good term', back: 'Fine.' }], [{ track: 'az900', title: 'Short', steps: ['one', 'two'], note: '' }, { track: 'nope', title: 'X', steps: ['a', 'b', 'c'], note: '' }]);
const d2 = E.decodeShareCode(bad);
eq([d2.terms.length, d2.scenarios.length, d2.invalid], [1, 0, 4], 'invalid terms and scenarios are dropped and counted');

/* ---- merge ---- */
let n = 0;
const makeId = (p) => `${p}${++n}`;
const existing = [{ id: 'x', kind: 'acronym', front: 'RBAC', back: 'Role-based access control', track: 'az900', at: null }];
const merged = E.mergeSharedItems(existing, [], dec, makeId, '2026-10-12');
eq(merged.added, { terms: 2, scenarios: 1 }, 'new items are added');
eq(merged.skipped, { terms: 1, scenarios: 0 }, 'a duplicate is skipped, not doubled');
eq(merged.terms.length, 3, 'existing items stay');
ok(merged.terms.every((t) => t.id && t.at !== undefined), 'imported items get ids');
const again = E.mergeSharedItems(merged.terms, merged.scenarios, dec, makeId, '2026-10-12');
eq([again.added, again.skipped], [{ terms: 0, scenarios: 0 }, { terms: 3, scenarios: 1 }], 'importing the same code twice adds nothing');
const full = Array.from({ length: 300 }, (_, i) => ({ id: `t${i}`, kind: 'term', front: `Term number ${i}`, back: 'Some definition.', track: 'all', at: null }));
eq(E.mergeSharedItems(full, [], { terms: [{ kind: 'term', front: 'One more', back: 'Over the limit.', track: 'all' }], scenarios: [], invalid: 0 }, makeId).added.terms, 0, 'the limit on terms is respected');

/* ---- step bank ---- */
const lists = [
  { steps: ['Create the resource group', 'Create the virtual network', 'Create the VM'], mine: false, track: 'az104' },
  { steps: ['Create the virtual network', 'Add a subnet', 'Create the VM'], mine: true, track: 'az104' },
  { steps: ['Plan the change', 'Get approval', 'Run the change'], mine: true, track: 'itil' },
];
const bank = E.buildStepBank(lists, 'az104');
eq(bank.map((x) => x.text).slice(0, 3), ['Create the virtual network', 'Add a subnet', 'Create the VM'], 'own steps for this cert come first, in order');
eq(bank.map((x) => x.text).slice(3), ['Plan the change', 'Get approval', 'Run the change', 'Create the resource group'], 'then own steps from other certs, then built-in');
eq(new Set(bank.map((x) => x.text.toLowerCase())).size, bank.length, 'the same wording appears once');
eq(bank.filter((x) => x.mine).length, 6 - 0, 'every step that came from the learner is marked');
eq(E.suggestNextSteps(['Create the virtual network'], lists).map((x) => x.text), ['Add a subnet', 'Create the VM'], 'suggests what followed the last step, own scenarios first');
eq(E.suggestNextSteps(['Create the virtual network', 'Add a subnet'], lists).map((x) => x.text), ['Create the VM'], 'an already-used step is not suggested');
eq(E.suggestNextSteps(['', '  '], lists), [], 'nothing typed, nothing suggested');
eq(E.suggestNextSteps(['  CREATE the   virtual NETWORK '], lists).length, 2, 'matching ignores case and spacing');
eq(E.suggestNextSteps(['Something new'], lists), [], 'an unknown step gives no suggestion');
eq(E.suggestNextSteps(['Create the virtual network'], lists, 1).length, 1, 'max limits the list');

if (failures) { console.error(`\n${failures} of ${checks} share/step-bank checks failed`); process.exit(1); }
console.log(`share code and step bank: ${checks} checks passed`);
