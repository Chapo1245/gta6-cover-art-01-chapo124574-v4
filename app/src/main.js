// Vice Lights editor: photos, crop drag, zoom, layouts, grades, lettering, export.
// The default state is variant A, "Palm Heist": triptych, Sunset Heist grade,
// Sunset Gradient title. Variant B ("Neon Nights") is one click on the sample
// button's second preset in shots.js; the editor keeps whichever you pick.
import { drawCover, EXPORT_SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const taglineEl = document.getElementById('tagline');

export const state = {
  layout: 'triptych',
  grade: 'sunset-heist',
  titleStyle: 'sunset-gradient',
  title: 'PALM HEIST',
  subtitle: 'Vice Lights',
  tagline: 'One last score under the neon sun',
  size: '1920x1080',
  photos: [null, null, null],
  zooms: [1.15, 1.25, 1.15],
  offsets: [[0, 0.05], [0, -0.02], [0, 0.08]],
};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function previewSize() {
  const [w, h] = EXPORT_SIZES[state.size];
  const scale = Math.min(960 / w, 675 / h, 1);
  return [Math.round(w * scale), Math.round(h * scale)];
}

export function redraw() {
  const [w, h] = previewSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(canvas, state);
}

function markChoice(groupId, attr, value) {
  document.querySelectorAll(`#${groupId} [data-${attr}]`).forEach((b) => b.classList.toggle('on', b.dataset[attr] === value));
}

function bindChoices(groupId, attr, apply) {
  document.querySelectorAll(`#${groupId} [data-${attr}]`).forEach((b) => {
    b.addEventListener('click', () => { apply(b.dataset[attr]); markChoice(groupId, attr, b.dataset[attr]); redraw(); });
  });
}

bindChoices('layoutChoices', 'layout', (v) => { state.layout = v; });
bindChoices('gradeChoices', 'grade', (v) => { state.grade = v; });
bindChoices('titleChoices', 'titleStyle', (v) => { state.titleStyle = v; });
bindChoices('sizeChoices', 'size', (v) => { state.size = v; });

titleEl.addEventListener('input', () => { state.title = titleEl.value; redraw(); });
subtitleEl.addEventListener('input', () => { state.subtitle = subtitleEl.value; redraw(); });
taglineEl.addEventListener('input', () => { state.tagline = taglineEl.value; redraw(); });

document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    const panel = Number(b.dataset.panel);
    state.photos[panel] = await loadImage(`samples/${b.dataset.sample}.jpg`);
    state.offsets[panel] = [0, 0];
    redraw();
  });
});
document.querySelectorAll('[data-photo]').forEach((input) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const panel = Number(input.dataset.photo);
    state.photos[panel] = await loadImage(URL.createObjectURL(file));
    state.offsets[panel] = [0, 0];
    redraw();
  });
});
document.querySelectorAll('[data-zoom]').forEach((slider) => {
  slider.addEventListener('input', () => {
    state.zooms[Number(slider.dataset.zoom)] = Number(slider.value);
    redraw();
  });
});
document.getElementById('fillAll').addEventListener('click', () => {
  if (!state.photos[0]) { statusEl.textContent = 'Load a photo into Panel 1 first.'; return; }
  state.photos[1] = state.photos[0];
  state.photos[2] = state.photos[0];
  statusEl.textContent = 'Panel 1 photo now fills all three panels — drag each to frame it differently.';
  redraw();
});
document.getElementById('sampleCover').addEventListener('click', async () => {
  await applySampleCover();
  statusEl.textContent = 'Sample cover “Palm Heist” loaded.';
});

/** Loads the default sample cover (variant A) into the editor. */
export async function applySampleCover() {
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  state.photos = [pier, boulevard, pier];
  state.zooms = [1.15, 1.25, 1.15];
  state.offsets = [[0, 0.05], [0, -0.02], [0, 0.08]];
  state.layout = 'triptych'; state.grade = 'sunset-heist'; state.titleStyle = 'sunset-gradient';
  state.title = 'PALM HEIST'; state.subtitle = 'Vice Lights'; state.tagline = 'One last score under the neon sun';
  titleEl.value = state.title; subtitleEl.value = state.subtitle; taglineEl.value = state.tagline;
  markChoice('layoutChoices', 'layout', 'triptych');
  markChoice('gradeChoices', 'grade', 'sunset-heist');
  markChoice('titleChoices', 'titleStyle', 'sunset-gradient');
  redraw();
}

// Drag a panel on the preview to pan its photo inside the frame.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = (e.clientX - box.left) * (canvas.width / box.width);
  const y = (e.clientY - box.top) * (canvas.height / box.height);
  drag = { x, y, panel: panelAt(x, y) };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || drag.panel === -1) return;
  const box = canvas.getBoundingClientRect();
  const x = (e.clientX - box.left) * (canvas.width / box.width);
  const y = (e.clientY - box.top) * (canvas.height / box.height);
  const rect = panelRectsForPreview()[drag.panel];
  const off = state.offsets[drag.panel];
  off[0] = clamp(off[0] + (x - drag.x) / rect.w, -0.5, 0.5);
  off[1] = clamp(off[1] + (y - drag.y) / rect.h, -0.5, 0.5);
  drag.x = x; drag.y = y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function panelRectsForPreview() {
  // Recompute the same fractions drawCover uses, at preview size.
  const w = canvas.width; const h = canvas.height;
  const g = Math.max(4, Math.round(w * 0.011));
  const m = Math.max(4, Math.round(w * 0.011));
  const inner = (x0, y0, x1, y1) => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  if (state.layout === 'triptych') {
    const third = (w - m * 2 - g * 2) / 3;
    return [0, 1, 2].map((i) => inner(m + i * (third + g), m, m + (i + 1) * third + i * g, h - m));
  }
  if (state.layout === 'poster') {
    const split = Math.round(h * 0.66);
    const half = (w - m * 2 - g) / 2;
    return [inner(m, m, w - m, split - g / 2), inner(m, split + g / 2, m + half, h - m), inner(m + half + g, split + g / 2, w - m, h - m)];
  }
  const heroW = Math.round(w * 0.60);
  const halfH = (h - m * 2 - g) / 2;
  return [inner(m, m, heroW - g / 2, h - m), inner(heroW + g / 2, m, w - m, m + halfH), inner(heroW + g / 2, m + halfH + g, w - m, h - m)];
}
function panelAt(x, y) {
  return panelRectsForPreview().findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

/** Renders the current state at exact export pixels and downloads the PNG. */
export function exportCover(sizeKey) {
  const [w, h] = EXPORT_SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-lights-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(`${w}x${h}`);
    }, 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const size = await exportCover(state.size);
  statusEl.textContent = `Saved vice-lights-${size}.png — share it anywhere.`;
});
document.getElementById('exportAll').addEventListener('click', async () => {
  for (const key of Object.keys(EXPORT_SIZES)) await exportCover(key);
  statusEl.textContent = 'Saved all 3 sizes: 1920x1080, 1080x1350 and 1080x1080.';
});

// Fonts first, then the first paint; shot scenes take over when ?shot= is set.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { state, loadImage, redraw, applySampleCover, markChoice, titleEl, subtitleEl, taglineEl, canvas });
} else {
  Promise.all([
    document.fonts.load('80px Anton'),
    document.fonts.load('40px Pacifico'),
  ]).catch(() => {}).finally(async () => {
    await applySampleCover();
    redraw();
  });
}
