# Vice Lights — Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Chapo1245/gta6-cover-art-01-chapo124574-v4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Chapo1245/gta6-cover-art-01-chapo124574-v4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Lights** turns any photo and caption into GTA 6-style cover art — a
multi-panel Vice City poster with a neon-sunset grade — and exports it as a
PNG to share. It runs entirely offline in a desktop browser: no upload, no
account, no network request. Entry for the
[make.fun bounty gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **3 photo panels** in a comic-book grid — one photo across all three, or a
  different photo per panel. Drag any panel to reposition the photo inside
  it; each panel has its own zoom slider.
- **3 layouts**: Hero + Duo, Triptych, Poster.
- **4 colour grades**: Neon Nights, Sunset Heist, Golden Hour, Vice Pink.
- **3 title treatments**: Neon Stack, Sunset Gradient, Poster Outline, with
  editable title, subtitle (script) and tagline.
- **One-click PNG export** at 1920×1080, 1080×1350 and 1080×1080 — or all
  three sizes at once.
- Live preview that is exactly what exports. Lettering is Anton & Pacifico
  (SIL Open Font License, vendored under `app/fonts/`). No Rockstar logo,
  artwork or font anywhere.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a sample photo (or upload your own), drag to frame it, choose a layout,
grade and title style, then hit **Export PNG**.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with `vendor/makefun-app.ts`.

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
