// Vice Lights cover renderer: draws the multi-panel poster onto any canvas.
// Everything is drawn from the state object, so the live preview and the PNG
// export are the same picture at different sizes.

export const GRADES = {
  'neon-nights': {
    top: 'rgba(0,229,255,0.12)', bottom: 'rgba(255,0,136,0.32)',
    accent: '#ff2e88', accent2: '#00e5ff',
    ribbon: ['#7a00ff', '#ff2e88'], title: ['#8ef6ff', '#ff2e88'], scrim: 'rgba(20,0,40,0.55)',
  },
  'sunset-heist': {
    top: 'rgba(255,150,60,0.12)', bottom: 'rgba(220,30,120,0.30)',
    accent: '#ff7a3d', accent2: '#ffd76a',
    ribbon: ['#ff5e62', '#ff9966'], title: ['#ffe9a3', '#ff8a3d'], scrim: 'rgba(40,8,20,0.55)',
  },
  'golden-hour': {
    top: 'rgba(255,205,90,0.16)', bottom: 'rgba(180,90,0,0.24)',
    accent: '#ffb703', accent2: '#fb8500',
    ribbon: ['#ffb703', '#fb8500'], title: ['#fff8d6', '#ffb703'], scrim: 'rgba(45,25,0,0.55)',
  },
  'vice-pink': {
    top: 'rgba(255,120,200,0.14)', bottom: 'rgba(140,0,160,0.32)',
    accent: '#ff5da2', accent2: '#e0aaff',
    ribbon: ['#ff5da2', '#b5179e'], title: ['#ffd6ec', '#ff5da2'], scrim: 'rgba(45,0,45,0.55)',
  },
};

export const LAYOUTS = ['hero-duo', 'triptych', 'poster'];
export const TITLE_STYLES = ['neon-stack', 'sunset-gradient', 'poster-outline'];
export const EXPORT_SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };

/** Panel rectangles for a layout, as fractions of the canvas, with gutters. */
export function panelRects(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.011));
  const m = Math.max(4, Math.round(w * 0.011));
  const inner = (x0, y0, x1, y1) => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  if (layout === 'triptych') {
    const third = (w - m * 2 - g * 2) / 3;
    return [0, 1, 2].map((i) => inner(m + i * (third + g), m, m + (i + 1) * third + i * g, h - m));
  }
  if (layout === 'poster') {
    const split = Math.round(h * 0.66);
    const half = (w - m * 2 - g) / 2;
    return [
      inner(m, m, w - m, split - g / 2),
      inner(m, split + g / 2, m + half, h - m),
      inner(m + half + g, split + g / 2, w - m, h - m),
    ];
  }
  // hero-duo: one tall hero panel left, two stacked panels right.
  const heroW = Math.round(w * 0.60);
  const halfH = (h - m * 2 - g) / 2;
  return [
    inner(m, m, heroW - g / 2, h - m),
    inner(heroW + g / 2, m, w - m, m + halfH),
    inner(heroW + g / 2, m + halfH + g, w - m, h - m),
  ];
}

/** Deterministic speckled grain, so preview and export match exactly. */
let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 140; tile.height = 140;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(140, 140);
  let seed = 20261121;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = rnd() * 46;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

/** Cover-fits one photo into a panel, honouring its zoom and drag offset. */
export function drawPhotoPanel(ctx, img, rect, zoom, ox, oy) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3b1d5e'); g.addColorStop(1, '#1c0b33');
    ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.max(14, rect.w * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  } else {
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    const cx = rect.x + rect.w / 2 + ox * rect.w;
    const cy = rect.y + rect.h / 2 + oy * rect.h;
    ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  }
  ctx.restore();
  // Comic-book keyline: white frame, thin dark outer edge.
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeRect(rect.x - ctx.lineWidth, rect.y - ctx.lineWidth, rect.w + ctx.lineWidth * 2, rect.h + ctx.lineWidth * 2);
}

/** Sunset / neon grade wash, vignette and grain over the whole cover. */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, w * 0.25, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  const glow = ctx.createRadialGradient(w * 0.72, h * 0.18, 10, w * 0.72, h * 0.18, w * 0.7);
  glow.addColorStop(0, 'rgba(255,220,150,0.9)');
  glow.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

/** Shrinks text until it fits, then returns the fitted size. */
function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`.trim();
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(1, Math.round(size * 0.04));
    ctx.font = `${weight} ${size}px ${family}`.trim();
  }
  return size;
}

/** The title block: scrim, ribbon, title, script subtitle and tagline. */
export function drawTitleBlock(ctx, w, h, state, grade) {
  const bandH = h * 0.24;
  const bandY = h - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.08, 0, h);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.08, w, bandH + h * 0.08);

  const title = (state.title || 'VICE LIGHTS').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tagline = (state.tagline || '').trim();
  const cx = w / 2;

  // Ribbon behind the title (sunset-gradient + poster-outline styles).
  if (state.titleStyle !== 'neon-stack') {
    const rh = h * 0.115;
    const ry = h - h * 0.135;
    const grad = ctx.createLinearGradient(0, ry, w, ry);
    grad.addColorStop(0, grade.ribbon[0]);
    grad.addColorStop(1, grade.ribbon[1]);
    ctx.save();
    ctx.translate(0, 0);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const slant = w * 0.02;
    ctx.moveTo(-slant, ry);
    ctx.lineTo(w + slant, ry - h * 0.012);
    ctx.lineTo(w + slant, ry + rh);
    ctx.lineTo(-slant, ry + rh + h * 0.012);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (subtitle) {
    ctx.font = `${Math.round(h * 0.042)}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent2;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = h * 0.01;
    // Neon Stack's title block is taller, so its subtitle sits higher.
    ctx.fillText(subtitle, cx, state.titleStyle === 'neon-stack' ? h - h * 0.335 : h - h * 0.185);
    ctx.shadowBlur = 0;
  }

  if (state.titleStyle === 'neon-stack') {
    const words = title.split(/\s+/).filter(Boolean);
    const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [title];
    const size = fitFont(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b)), w * 0.86, h * 0.15, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.strokeStyle = grade.accent;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.35;
    lines.forEach((line, i) => {
      // Two-line stack ends clear of the canvas foot; one line sits lower.
      const y = lines.length > 1 ? h - h * 0.213 + i * size * 0.92 : h - h * 0.12;
      ctx.strokeText(line, cx, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, cx, y);
    });
    ctx.shadowBlur = 0;
  } else if (state.titleStyle === 'poster-outline') {
    const size = fitFont(ctx, title, w * 0.9, h * 0.13, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(20,5,30,0.55)';
    const y = h - h * 0.075;
    ctx.strokeText(title, cx, y);
    ctx.fillText(title, cx, y);
  } else {
    const size = fitFont(ctx, title, w * 0.86, h * 0.115, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    const grad = ctx.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(1, grade.title[1]);
    ctx.fillStyle = grad;
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeStyle = 'rgba(40,8,25,0.85)';
    const y = h - h * 0.075;
    ctx.strokeText(title, cx, y);
    ctx.fillText(title, cx, y);
  }

  if (tagline) {
    try { ctx.letterSpacing = `${Math.max(1, h * 0.004)}px`; } catch { /* older canvas: no letter spacing */ }
    // Shrink the tagline until it clears the badge at the top right
    // (canvas letter-spacing is added at draw time, so leave extra room).
    const tagSize = fitFont(ctx, tagline.toUpperCase(), w * 0.62, Math.round(h * 0.024), 'system-ui, sans-serif', '700');
    ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(tagline.toUpperCase(), cx, h * 0.055);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }

  // Badge: small Vice Lights seal, top right.
  const r = Math.max(18, h * 0.042);
  const bx = w - r - w * 0.02;
  const by = r + h * 0.03;
  ctx.save();
  ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15,5,30,0.72)'; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07); ctx.strokeStyle = grade.accent; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(r * 0.62)}px Anton, sans-serif`;
  ctx.fillText('VL', bx, by + r * 0.03);
  ctx.restore();
  // The Neon Stack title fills the foot, so it carries no foot credit line.
  if (state.titleStyle !== 'neon-stack') {
    ctx.font = `700 ${Math.round(h * 0.018)}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'left';
    ctx.fillText('VICE LIGHTS · FAN-MADE COVER', w * 0.02, h - h * 0.018);
    ctx.textAlign = 'center';
  }
}

/** Draws the whole cover for a state onto the canvas at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES['sunset-heist'];
  ctx.fillStyle = '#1c0b33';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    drawPhotoPanel(ctx, state.photos[i] || null, rect, state.zooms[i] || 1, (state.offsets[i] || [0, 0])[0], (state.offsets[i] || [0, 0])[1]);
  });
  applyGrade(ctx, w, h, grade);
  drawTitleBlock(ctx, w, h, state, grade);
}
