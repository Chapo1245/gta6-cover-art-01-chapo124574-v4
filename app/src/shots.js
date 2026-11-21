// Fixed scenes for screenshots. ?shot=cover draws the cover alone, full frame,
// at the size the query asks for; ?shot=editor shows the editor with a sample
// photo loaded. window.__shotReady is set once the scene has painted, and
// window.__shotError names any failure, so the screenshot run can check both.
import { EXPORT_SIZES } from './cover.js';

const VARIANTS = {
  palm: {
    layout: 'triptych', grade: 'sunset-heist', titleStyle: 'sunset-gradient',
    title: 'PALM HEIST', subtitle: 'Vice Lights', tagline: 'One last score under the neon sun',
    photos: ['pier', 'boulevard', 'pier'],
    zooms: [1.15, 1.25, 1.15], offsets: [[0, 0.05], [0, -0.02], [0, 0.08]],
  },
  neon: {
    layout: 'hero-duo', grade: 'neon-nights', titleStyle: 'neon-stack',
    title: 'NEON NIGHTS', subtitle: 'Vice Lights', tagline: 'The city never sleeps',
    photos: ['boulevard', 'pier', 'boulevard'],
    zooms: [1.2, 1.3, 1.2], offsets: [[0, 0], [0, 0.04], [0, -0.03]],
  },
};

export async function runShot(shot, query, app) {
  try {
    const variant = VARIANTS[query.get('variant') || 'palm'] || VARIANTS.palm;
    const sizeKey = query.get('size') || '1920x1080';
    const [w, h] = EXPORT_SIZES[sizeKey] || EXPORT_SIZES['1920x1080'];
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]).catch(() => {});
    const s = app.state;
    s.layout = query.get('layout') || variant.layout;
    s.grade = query.get('grade') || variant.grade;
    s.titleStyle = query.get('titleStyle') || variant.titleStyle;
    s.title = query.get('title') || variant.title;
    s.subtitle = query.get('subtitle') || variant.subtitle;
    s.tagline = query.get('tagline') || variant.tagline;
    s.zooms = variant.zooms.slice();
    s.offsets = variant.offsets.map((o) => o.slice());
    const names = (query.get('photos') || variant.photos.join(',')).split(',');
    s.photos = [];
    for (const name of names) s.photos.push(await app.loadImage(`samples/${name.trim()}.jpg`));
    if (app.titleEl) { app.titleEl.value = s.title; app.subtitleEl.value = s.subtitle; app.taglineEl.value = s.tagline; }
    if (app.markChoice) {
      app.markChoice('layoutChoices', 'layout', s.layout);
      app.markChoice('gradeChoices', 'grade', s.grade);
      app.markChoice('titleChoices', 'titleStyle', s.titleStyle);
      app.markChoice('sizeChoices', 'size', sizeKey);
    }
    s.size = sizeKey;
    if (shot === 'cover') {
      document.body.classList.add('shot-cover');
      app.canvas.width = w;
      app.canvas.height = h;
    }
    app.redraw();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.__shotReady = true;
  } catch (err) {
    window.__shotError = String(err && err.message || err);
  }
}
