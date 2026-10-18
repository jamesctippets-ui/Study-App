#!/usr/bin/env node
/* Prints a track's study content as compact plain text so it can be read (or reviewed) quickly.
 *   node tools/dump_content.js ccna                 everything
 *   node tools/dump_content.js ccna cards           one part: cards | questions | other | lessons | cheat
 *   node tools/dump_content.js ccna --masked-json   {cardId: prompt} for the cards whose term is blanked
 * Reads dist/data, so run build.py first. Cards show the definition-first prompt (the term blanked
 * out) when it differs from the stored definition, because that is what the learner sees first.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/js/03_helpers.js'), 'utf8');
const start = src.indexOf('/* ---------------- definition-first flashcards');
// eslint-disable-next-line no-new-func
const { flashcardPrompt } = new Function(`${src.slice(start)}\nreturn { flashcardPrompt };`)();

const args = process.argv.slice(2);
const track = args[0];
if (!track) { console.error('usage: node tools/dump_content.js <track> [cards|questions|other|lessons|cheat] [--masked-json]'); process.exit(2); }
const d = JSON.parse(fs.readFileSync(path.join(root, 'dist/data', `${track}.json`), 'utf8'));
if (args.includes('--masked-json')) {
  const out = {};
  d.flashcards.forEach((c) => { const p = flashcardPrompt(c); if (p.masked) out[c.id] = p.text; });
  console.log(JSON.stringify(out));
  process.exit(0);
}
const part = args.find((a, i) => i > 0 && !a.startsWith('--')) || 'all';
const want = (p) => part === 'all' || part === p;
const cats = {}; d.categories.forEach((c) => { cats[c.key] = c.label; });
const L = [];
if (want('cards')) {
  L.push(`## FLASHCARDS (${d.flashcards.length}): id | category | term, then the definition`);
  d.flashcards.forEach((c) => {
    L.push(`${c.id} | ${c.cat} | ${c.front}`);
    L.push(`   DEF: ${c.back}`);
    const p = flashcardPrompt(c);
    if (p.masked) L.push(`   SHOWN FIRST (term blanked): ${p.text}`);
    if (c.detail) L.push(`   EXAMPLE: ${c.detail}`);
  });
}
if (want('questions')) {
  L.push(`## QUESTIONS (${d.questions.length}): id | category | type; options are shuffled in the app, * marks the correct one`);
  d.questions.forEach((q) => {
    L.push(`${q.id} | ${q.cat} | ${q.type}${q.image ? ` | image:${q.image}` : ''}`);
    L.push(`   Q: ${q.question}`);
    if (q.type === 'tf') L.push(`   ANSWER: ${q.answer ? 'True' : 'False'}`);
    else {
      const ok = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
      q.options.forEach((o, i) => L.push(`   ${ok.has(i) ? '*' : '-'} ${o}`));
    }
    L.push(`   WHY: ${q.explanation}`);
  });
}
if (want('other')) {
  L.push(`## MAD LIBS (${d.madlibs.length}): each {bN} blank lists its options, * is correct`);
  d.madlibs.forEach((m) => {
    L.push(`${m.id} | ${m.cat}`);
    L.push(`   ${m.scenario}`);
    m.blanks.forEach((b) => L.push(`   {${b.key}}: ${b.options.map((o, i) => (i === b.correct ? `*${o}` : o)).join(' / ')}`));
    L.push(`   WHY: ${m.explanation}`);
  });
  const sequences = d.sequences || [];
  L.push(`## SEQUENCES (${sequences.length}): steps are listed in the CORRECT order`);
  sequences.forEach((s) => {
    L.push(`${s.id} | ${s.cat} | ${s.prompt}`);
    s.steps.forEach((x, i) => L.push(`   ${i + 1}. ${x}`));
    L.push(`   WHY: ${s.explanation}`);
  });
  L.push(`## COMPARE (${d.compare.length}): "which is better" pairs`);
  d.compare.forEach((c) => {
    L.push(`${c.id} | ${c.cat} | ${c.scenario}`);
    L.push(`   ${c.better === 'A' ? '*' : '-'} A: ${c.optionA}`);
    L.push(`   ${c.better === 'B' ? '*' : '-'} B: ${c.optionB}`);
    L.push(`   WHY: ${c.why}`);
  });
  L.push(`## CASE STUDIES (${d.caseStudies.length})`);
  d.caseStudies.forEach((cs) => {
    L.push(`${cs.id} | ${cs.cat} | ${cs.title}`);
    L.push(`   SCENARIO: ${cs.scenario}`);
    cs.questions.forEach((q) => {
      L.push(`   ${q.id} | ${q.type}: ${q.question}`);
      if (q.type === 'tf') L.push(`      ANSWER: ${q.answer ? 'True' : 'False'}`);
      else { const ok = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]); q.options.forEach((o, i) => L.push(`      ${ok.has(i) ? '*' : '-'} ${o}`)); }
      L.push(`      WHY: ${q.explanation}`);
    });
  });
}
if (want('lessons')) {
  L.push(`## LESSONS (${d.lessons.length})`);
  d.lessons.forEach((l) => {
    L.push(`${l.id} | ${l.title} | ${l.summary}`);
    L.push(`   READING: ${(l.reading || '').replace(/\n\n/g, '\n   ')}`);
  });
}
if (want('cheat')) {
  L.push(`## CHEAT SHEET (${d.cheatSheet.length} sections)`);
  d.cheatSheet.forEach((s) => { L.push(`${s.heading}`); s.points.forEach((p) => L.push(`   - ${p}`)); });
}
console.log(L.join('\n'));
