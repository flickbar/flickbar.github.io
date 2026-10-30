// Words for the demo and buttons, in the page's language.
const T = JSON.parse(document.getElementById('i18n').textContent);
for (const b of document.querySelectorAll('.copy')) b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.previousElementSibling.textContent); b.textContent = T.copied; }
  catch { b.textContent = T.selectToCopy; }
  setTimeout(() => b.textContent = T.copy, 1600);
});

const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

// Theme: auto follows the system; light and dark are remembered.
const ICON = { auto: '#i-auto', light: '#i-sun', dark: '#i-moon' };
const themeBtn = document.getElementById('themeBtn');
function setTheme(t) {
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { t === 'auto' ? localStorage.removeItem('theme') : localStorage.setItem('theme', t); } catch (e) {}
  themeBtn.querySelector('use').setAttribute('href', ICON[t]);
  themeBtn.setAttribute('aria-label', T.theme[t]);
  for (const b of document.querySelectorAll('[data-theme-set]')) b.setAttribute('aria-pressed', b.dataset.themeSet === t);
}
setTheme(document.documentElement.dataset.theme || 'auto');
themeBtn.addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  setTheme(order[(order.indexOf(document.documentElement.dataset.theme || 'auto') + 1) % 3]);
});
for (const b of document.querySelectorAll('[data-theme-set]')) b.addEventListener('click', () => setTheme(b.dataset.themeSet));

// Frames are [x, y, w, h] in % of the screen below the menu bar.
const $ = id => document.getElementById(id);
const win = $('win'), preview = $('preview'), grid = $('grid'), pad = $('pad'), pointer = $('pointer'), tag = $('tag'), arrow = $('arrow');
const [f1, f2] = pad.children;
const stepItems = [...$('steps').children];
const HOME = [18, 12, 56, 72], FULL = [0, -6.38, 100, 106.38]; // full screen also covers the menu bar
let frame = HOME, beforeFull = null, last = null, repeat = 0;
const set = (el, [x, y, w, h]) => Object.assign(el.style, { left: x + '%', top: y + '%', width: w + '%', height: h + '%' });
set(win, frame);
const at = (el, [x, y]) => Object.assign(el.style, { left: x + '%', top: y + '%' });
// Where the pointer rests on a window's title bar (the bar is about 4% of the screen's height).
const onTitleBar = f => [f[0] + f[2] / 2, Math.max(f[1], 0) + 2];
function placeTag(f) {
  const p = onTitleBar(f);
  at(pointer, p), at(tag, p);
  tag.classList.toggle('flip', p[0] > 60);
}
placeTag(frame);
// Lights up step i of the three (point, gesture, result), optionally with new words.
function showStep(i, text) {
  stepItems.forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('done', j < i); });
  if (text) stepItems[i].textContent = text;
}
// Which way the arrow on the trackpad points, in degrees from pointing right.
const ARROW = { left: [180], right: [0], up: [-90], down: [90], leftUp: [180, -90] };
// Beside the fingers' path rather than on top of it.
const showArrow = deg => { arrow.style.transform = `rotate(${deg}deg) translateY(-30px)`; arrow.classList.add('on'); };

const names = T.names, R = T.results;
function target(g) {
  const w = [50, 66.67, 33.33][repeat % 3];
  switch (g) {
    case 'left': return [[0, 0, w, 100], R.left[repeat % 3]];
    case 'right': return [[100 - w, 0, w, 100], R.right[repeat % 3]];
    case 'up': return repeat % 2 ? [[33.33, 0, 33.34, 100], R.middleThird] : [[0, 0, 100, 100], R.fill];
    case 'leftUp': return [[0, 0, 50, 50], R.topLeft];
    case 'down': return [frame, R.minimize];
    case 'tap': return [[(100 - frame[2]) / 2, (100 - frame[3]) / 2, frame[2], frame[3]], R.center];
    case 'pinchOut': return beforeFull ? [beforeFull, R.leaveFull] : [FULL, R.full];
    case 'pinchIn': return [frame, R.close];
    case 'grid': return [[33.33, 0, 33.34, 50], R.grid];
  }
}
// Finger offsets in px on the trackpad: one [x1, y1, x2, y2] per step.
const steps = {
  left: [[-34, 0, -34, 0]], right: [[34, 0, 34, 0]], up: [[0, -22, 0, -22]], down: [[0, 22, 0, 22]],
  leftUp: [[-34, 0, -34, 0], [-34, -22, -34, -22]], tap: [], pinchOut: [[-34, -10, 34, 10]],
  pinchIn: [[0, 0, 0, 0]], grid: [[22, 0, 22, 0], [22, -16, 22, -16]],
};
const start = { pinchIn: [-34, -10, 34, 10] };
const place = ([x1, y1, x2, y2]) => {
  f1.style.transform = `translate(${x1 - 12}px, ${y1}px)`;
  f2.style.transform = `translate(${x2 + 12}px, ${y2}px)`;
};
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, still ? Math.min(ms, 120) : ms));
let busy = false, queued = null;

async function play(g) {
  if (busy) { queued = g; return; }
  busy = true;
  repeat = g === last ? repeat + 1 : 0;
  for (const b of document.querySelectorAll('#controls button')) b.setAttribute('aria-current', b.dataset.g === g);
  const [to, result] = target(g);

  // 1. The pointer moves onto the title bar, which lights up and gets a label.
  showStep(0);
  pointer.style.transition = tag.style.transition = 'none';
  at(pointer, [frame[0] + frame[2] / 2, Math.max(frame[1], 0) + frame[3] * 0.6]);
  pointer.getBoundingClientRect();
  pointer.style.transition = tag.style.transition = '';
  placeTag(frame);
  win.classList.add('pointing');
  tag.classList.add('on');
  await wait(750);

  // 2. Two fingers do the gesture on the trackpad, with an arrow for its direction.
  showStep(1, names[g]);
  for (const f of [f1, f2]) f.style.transition = 'none';
  place(start[g] || [0, 0, 0, 0]);
  pad.classList.add('down');
  await wait(180);
  for (const f of [f1, f2]) f.style.transition = '';
  if (g === 'tap') for (let i = 0; i < 2; i++) { pad.classList.remove('down'); await wait(110); pad.classList.add('down'); await wait(110); }
  if (g === 'grid') { pad.classList.add('hold'); await wait(500); grid.classList.add('on'); }
  for (const [i, s] of steps[g].entries()) {
    if (ARROW[g]) showArrow(ARROW[g][i]);
    place(s);
    if (g === 'grid') set(preview, s[1] ? to : [33.33, 0, 33.34, 100]), preview.classList.add('on');
    await wait(380);
  }
  // Closing and minimizing have nowhere to preview, like the app.
  if (g !== 'pinchIn' && g !== 'down') set(preview, to), preview.classList.add('on');
  await wait(600);

  // 3. The fingers lift and the window moves.
  showStep(2, result);
  pad.classList.remove('down', 'hold');
  arrow.classList.remove('on');
  preview.classList.remove('on');
  grid.classList.remove('on');
  tag.classList.remove('on');
  win.classList.remove('pointing');

  if (g === 'pinchIn' || g === 'down') {
    // The window goes, then comes back so the demo can go on: fresh after a close, as it was after a minimize.
    const gone = g === 'down' ? 'minimized' : 'closed';
    win.classList.add(gone);
    await wait(900);
    if (g === 'pinchIn') { set(win, frame = HOME); beforeFull = null; placeTag(HOME); }
    win.classList.remove(gone);
  } else {
    if (g === 'pinchOut') beforeFull = beforeFull ? null : frame;
    else if (g !== 'tap') beforeFull = null;
    set(win, frame = to);
    placeTag(to);
  }
  last = g;
  await wait(450);
  busy = false;
  if (queued) { const q = queued; queued = null; play(q); }
}

let auto = !still;
$('controls').addEventListener('click', e => {
  const g = e.target.dataset?.g;
  if (!g) return;
  auto = false;
  // Announce the steps only for gestures the visitor picked, not the tour that plays by itself.
  $('steps').setAttribute('aria-live', 'polite');
  play(g);
});
(async () => {
  const tour = ['left', 'left', 'right', 'leftUp', 'up', 'grid', 'down', 'tap', 'pinchOut', 'pinchOut'];
  await wait(900);
  for (let i = 0; auto; i++) { await play(tour[i % tour.length]); await wait(1100); }
})();

// The language menu closes on a click elsewhere or Esc, like a native menu.
const langpick = document.querySelector('.langpick');
document.addEventListener('click', e => { if (!langpick.contains(e.target)) langpick.open = false; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && langpick.open) { langpick.open = false; langpick.querySelector('summary').focus(); } });
