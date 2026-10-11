#!/usr/bin/env node
/* Unit tests for the definition-flyout placement maths (src/js/03e_flyout_place.js). build.py runs
 * this when node is on the PATH. Run by hand with:  node tools/check_flyout.js
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src/js/03e_flyout_place.js'), 'utf8');
// eslint-disable-next-line no-new-func
const { flyoutPlacement, FLYOUT_MARGIN } = new Function(`${src}\nreturn { flyoutPlacement, FLYOUT_MARGIN };`)();

let failures = 0;
let checks = 0;
function ok(cond, label, extra) {
  checks += 1;
  if (!cond) { failures += 1; console.error(`FAIL ${label}${extra ? `\n   ${JSON.stringify(extra)}` : ''}`); }
}

const VIEW = { width: 390, height: 844 };
const INSET = { top: 56, bottom: 68 };
const SIZE = { width: 262, height: 100 };
const word = (left, width, top = 400) => ({ left, right: left + width, top, bottom: top + 20 });

// every horizontal position of a word, for several box widths: the box is always fully on screen
for (const w of [120, 180, 262, 280, 600]) {
  for (let left = 0; left <= 390 - 10; left += 5) {
    for (const wordW of [18, 40, 110]) {
      const a = word(Math.min(left, 390 - wordW), wordW);
      const p = flyoutPlacement(a, { width: w, height: 100 }, VIEW, INSET);
      ok(p.left >= FLYOUT_MARGIN && p.left + p.width <= VIEW.width - FLYOUT_MARGIN + 0.5, `on screen w=${w} left=${left} wordW=${wordW}`, p);
      ok(p.arrowLeft >= 10 && p.arrowLeft <= p.width - 10, `arrow inside box w=${w} left=${left}`, p);
    }
  }
}

// a word in the middle opens to the right, starting at the word
let p = flyoutPlacement(word(40, 30), SIZE, VIEW, INSET);
ok(p.side === 'right' && p.left === 40, 'left-side word opens rightwards from the word', p);

// a word near the right edge opens to the LEFT: the box's right edge lines up with the word's right edge
p = flyoutPlacement(word(318, 23), SIZE, VIEW, INSET);
ok(p.side === 'left', 'right-edge word opens leftwards', p);
ok(p.left + p.width === 341, 'right edges line up', p);
const tip = p.left + p.arrowLeft + 4.5;
ok(tip >= 318 && tip <= 341, 'arrow points at the word', p);

// a word hard against the right margin: clamped, still on screen, arrow still on the word
p = flyoutPlacement(word(365, 20), SIZE, VIEW, INSET);
ok(p.left + p.width <= 380 && p.side === 'left', 'word at the very edge stays inside the margin', p);
ok(Math.abs((p.left + p.arrowLeft + 4.5) - 375) <= 12, 'arrow stays near the word', p);

// vertical: below when it fits, above when the bottom is too tight, the roomier side otherwise
p = flyoutPlacement(word(100, 40, 300), SIZE, VIEW, INSET);
ok(p.vertical === 'below' && p.top === 328 && p.maxHeight === null, 'fits below', p);
p = flyoutPlacement(word(100, 40, 650), { width: 262, height: 200 }, VIEW, INSET);
ok(p.vertical === 'above' && p.top === 650 - 8 - 200, 'too tight below: opens above', p);
p = flyoutPlacement(word(100, 40, 400), { width: 262, height: 900 }, VIEW, INSET);
ok(p.maxHeight !== null && p.maxHeight > 0, 'taller than any room: capped and scrollable', p);
ok(p.top >= INSET.top && p.top + p.maxHeight <= VIEW.height - INSET.bottom, 'capped box stays between header and tab bar', p);

// the word scrolled out of the visible band hides the flyout (and brings it back when visible)
ok(flyoutPlacement(word(100, 40, -50), SIZE, VIEW, INSET).hidden === true, 'word above the header: hidden');
ok(flyoutPlacement(word(100, 40, 800), SIZE, VIEW, INSET).hidden === true, 'word under the tab bar: hidden');
ok(flyoutPlacement(word(100, 40, 400), SIZE, VIEW, INSET).hidden === false, 'word in view: shown');

// tiny screens and no insets do not break anything
p = flyoutPlacement(word(150, 30), { width: 280, height: 120 }, { width: 320, height: 568 }, null);
ok(p.left >= 10 && p.left + p.width <= 310, '320px phone', p);
p = flyoutPlacement(word(20, 30), { width: 500, height: 120 }, { width: 320, height: 568 }, INSET);
ok(p.width === 300 && p.left === 10, 'box wider than the screen shrinks to fit', p);

if (failures) { console.error(`${failures} of ${checks} flyout checks failed`); process.exit(1); }
console.log(`flyout placement: ${checks} checks passed`);
