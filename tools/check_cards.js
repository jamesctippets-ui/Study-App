#!/usr/bin/env node
/* Checks for definition-first flashcards (flashcardPrompt in src/js/03_helpers.js) against every
 * real card in dist/data: the term must never be readable in the prompt, and ordinary cards are
 * left alone. build.py runs this when node is on the PATH.  node tools/check_cards.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'dist/data');
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'tracks.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'src/js/03_helpers.js'), 'utf8');
const start = src.indexOf('/* ---------------- definition-first flashcards');
// eslint-disable-next-line no-new-func
const { flashcardCore, flashcardPrompt } = new Function(`${src.slice(start)}\nreturn { flashcardCore, flashcardPrompt };`)();

let checks = 0; let failures = 0;
function ok(cond, label, extra) { checks += 1; if (!cond) { failures += 1; console.error(`FAIL ${label}${extra ? `\n   ${extra}` : ''}`); } }

// unit cases
let p = flashcardPrompt({ front: 'Master Patient Index (MPI)', back: 'A Master Patient Index maintains one identity per patient; the MPI links records.' });
ok(!/master patient index/i.test(p.text) && !/\bMPI\b/.test(p.text), 'term and acronym are blanked', p.text);
ok(p.masked === true && p.text.includes('_____'), 'mask marker present');
ok(p.speech.includes('blank') && !p.speech.includes('_'), 'speech says blank');
ok(p.hint.words === 3 && p.hint.initial === 'M', 'hint counts words and first letter', JSON.stringify(p.hint));
p = flashcardPrompt({ front: 'Region', back: 'A geographic area containing datacenters. Regions are paired.' });
ok(!/\bregions?\b/i.test(p.text), 'plural is blanked too', p.text);
p = flashcardPrompt({ front: 'Elastic pool', back: 'A shared pool of compute that many databases draw from.' });
ok(p.text === 'A shared pool of compute that many databases draw from.' && p.masked === false, 'a definition without the term is untouched', p.text);
p = flashcardPrompt({ front: 'IP', back: 'The addressing protocol. Not the same as a ship.' });
ok(p.hint.words === 1, 'one-word term');
p = flashcardPrompt({ front: 'Request Units (RU/s)', back: 'The currency Cosmos DB uses; RU/s are billed per second.' });
ok(!/RU\/s/.test(p.text), 'slash acronym blanked', p.text);
p = flashcardPrompt({ front: 'Azure Policy effects (Audit, Deny, Modify)', back: 'Audit only flags it, Deny blocks the request, Modify changes properties.' });
ok(p.text.includes('Audit') && p.text.includes('Deny') && p.masked === false, 'a bracket of examples is not blanked', p.text);
p = flashcardPrompt({ front: 'Role-based access control (RBAC)', back: 'Assigns roles. Not about adrbacx.' });
ok(p.text.includes('adrbacx'), 'acronym inside another word is left alone', p.text);

// every real card
let cards = 0; let masked = 0;
manifest.tracks.forEach((t) => {
  const d = JSON.parse(fs.readFileSync(path.join(dataDir, `${t.key}.json`), 'utf8'));
  (d.flashcards || []).forEach((c) => {
    cards += 1;
    const r = flashcardPrompt(c);
    if (r.masked) masked += 1;
    const core = flashcardCore(c.front);
    if (core.length >= 3) {
      const leak = new RegExp(`(^|[^A-Za-z0-9])${core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i');
      ok(!leak.test(r.text), `${t.key}/${c.id}: the term is still readable in the prompt`, r.text.slice(0, 140));
    }
    ok(r.text.replace(/_____/g, '').trim().length > 0, `${t.key}/${c.id}: nothing left of the definition`);
    ok(r.hint.words >= 1 && r.hint.initial !== '', `${t.key}/${c.id}: hint is empty`);
  });
});
ok(cards > 4000, 'cards were loaded', String(cards));
if (failures) { console.error(`${failures} of ${checks} flashcard checks failed`); process.exit(1); }
console.log(`definition-first cards: ${checks} checks passed (${masked} of ${cards} definitions needed the term blanked)`);
