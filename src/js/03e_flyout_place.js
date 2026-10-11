// Where a definition flyout goes. Pure geometry (no DOM, no React) so tools/check_flyout.js can
// test it in node. The flyout is drawn with position: fixed from these numbers, so it can never
// widen the page: a word near the right edge opens the flyout to the LEFT (its right edge lines
// up with the word's right edge), a word near the left edge opens it to the right, and the box is
// always clamped inside the visible area.
//
//   anchor  {left, right, top, bottom}  the tapped word, in viewport coordinates
//   size    {width, height}             the flyout's natural size
//   view    {width, height}             the visible area (documentElement.clientWidth/Height — NOT
//                                       window.innerWidth, which mobile browsers inflate when a page
//                                       overflows sideways)
//   inset   {top, bottom}               fixed chrome to stay clear of (sticky header, tab bar)
//
// Returns { left, top, width, maxHeight, side, vertical, arrowLeft, hidden }:
//   side      'right' (opens rightwards from the word) or 'left' (opens leftwards)
//   vertical  'below' or 'above' the word; the other side is used when the first does not fit
//   maxHeight set when neither side fits the whole box (the box then scrolls inside itself)
//   hidden    true while the word itself is scrolled out of the visible band
const FLYOUT_MARGIN = 10;
const FLYOUT_GAP = 8;
const FLYOUT_ARROW = 9;
// The box's own vertical padding (2 x 10px) and border (2 x 1px): the body's height + this = the box's height
const FLYOUT_CHROME = 22;

function flyoutPlacement(anchor, size, view, inset) {
  const ins = { top: (inset && inset.top) || 0, bottom: (inset && inset.bottom) || 0 };
  const M = FLYOUT_MARGIN;
  const width = Math.max(0, Math.min(size.width, view.width - 2 * M));

  // Horizontal: open rightwards from the word's left edge; if that would run past the right
  // edge, open leftwards from the word's right edge; finally clamp into the margins.
  let side = 'right';
  let left = anchor.left;
  if (left + width > view.width - M) { side = 'left'; left = anchor.right - width; }
  left = Math.max(M, Math.min(left, view.width - M - width));

  // The arrow points at the middle of the word, kept inside the box's rounded corners.
  const centre = (anchor.left + anchor.right) / 2;
  const arrowLeft = Math.round(Math.max(10, Math.min(centre - left - FLYOUT_ARROW / 2, width - 10 - FLYOUT_ARROW)));

  // Vertical: below the word if the whole box fits there, else above, else the roomier side
  // with the box scrolling inside itself.
  const edge = 6;
  const roomBelow = view.height - ins.bottom - edge - (anchor.bottom + FLYOUT_GAP);
  const roomAbove = anchor.top - FLYOUT_GAP - (ins.top + edge);
  let vertical;
  if (size.height <= roomBelow) vertical = 'below';
  else if (size.height <= roomAbove) vertical = 'above';
  else vertical = roomBelow >= roomAbove ? 'below' : 'above';
  const room = Math.max(0, vertical === 'below' ? roomBelow : roomAbove);
  const height = Math.min(size.height, room);
  const maxHeight = size.height > room ? Math.floor(room) : null;
  const top = vertical === 'below' ? anchor.bottom + FLYOUT_GAP : anchor.top - FLYOUT_GAP - height;

  const hidden = anchor.bottom < ins.top || anchor.top > view.height - ins.bottom;
  return { left: Math.round(left), top: Math.round(top), width: Math.round(width), maxHeight, side, vertical, arrowLeft, hidden };
}
