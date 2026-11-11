# Apex Carts - developer guide (read this first)

Goal (owner's brief): a AAA-quality kart racer for laptop (Intel Iris Xe, 8 GB) and phone (Samsung S25 Ultra, steady 60 fps).
Graphics are the top priority. Look: cartoon-style kart game with realistic lighting and materials.
External CC0 assets are allowed. No pay-to-use services (Firebase Spark plan only).

## Layout
- `src/head.html`, `src/body.html`, `src/style.css` - page shell, menus, HUD markup.
- `src/js/NN-name.js` - game code. `build.js` concatenates them in filename order into ONE script (`docs/game.js`).
  Files `00`..`95` live INSIDE `function boot(){ ... }` (00-core opens it, 95-main closes it) and share one scope; lines are dense.
  Files `96-*`, `97-assets.js`, `99-loader.js` are OUTSIDE boot (global scope).
- `src/lib/` - vendored three.js r128 (`THREE` global, classic scripts, NOT modules), GLTFLoader, RGBELoader, SkeletonUtils, BufferGeometryUtils, peerjs.
- `assets/` - shipped assets (copied to `docs/assets/`). `assets-src/` (git-ignored, only in C:\Apex-Carts) - downloaded source kits (Kenney car-kit, racing-kit, city-kit-*, nature-kit unzipped there).
- `docs/` - build output, deployed to Firebase Hosting + GitHub Pages. Never edit by hand.
- `tests/run.js` - Playwright regression suite. `tools/shot.js` - screenshot tool (headless, real GPU).

## Commands (from repo root)
- Build: `node build.js`
- Fast tests: `node build.js && cd tests && node run.js --fast` (must end with `0 failed`; takes several minutes; full suite without `--fast`)
- Screenshot: `node tools/shot.js <0|1|2|menu> out.png --t=16 --q=high` (prints fps, GPU and console errors as JSON; LOOK at the PNG with the Read tool)
- In a git worktree `tests/node_modules` is missing: create a junction once:
  `cmd //c mklink /J tests\\node_modules C:\\Apex-Carts\\tests\\node_modules`
- This laptop has 8 GB RAM: run only ONE browser/test at a time, never leave browsers open.

## Assets
- CC0 / public-domain ONLY (Kenney, Quaternius, Poly Haven, ambientCG, poly.pizza CC0 items, OpenGameArt CC0). Check each file's licence. Record every asset in `assets/CREDITS.md` (name, author, source URL, licence).
- Register in your own `src/js/96-preload-<area>.js` (global scope): `PRELOAD.push({type:'glb',name:'kart_a',url:'assets/karts/a.glb'});`
  types: `glb`, `tex` (sRGB), `lin` (linear data), `hdr`, `audio`, `json`. Read with `Assets.model(name)` (fresh clone; clone materials before tinting), `Assets.gltf`, `Assets.tex`, `Assets.hdr`, `Assets.audio`, `Assets.has(name,type)`.
- Missing assets must never break the game: always keep a fallback (the old procedural path). Tests block nothing local, but stay robust.
- Size budget: whole `assets/` under ~35 MB; prefer GLB, textures <= 1024 px (2048 only for hero items), jpg/webp for colour maps, ogg/mp3 for audio.

## Engine facts and traps (three.js r128)
- Custom HDR post pipeline (`75-probe-post.js`): scene -> HalfFloat MSAA target, SSAO, SSR (wet roads), bloom, motion blur, ACES, grade. Materials are in LINEAR space with NO tone mapping in the HDR path; `applyHDR()` switches paths. `linMat()/linGroup()` convert authored sRGB colours once.
- Scene alpha is a flag channel (`alphaFlag(material, glsl)`): 0 = moving object (karts; excluded from motion blur), 0.25-0.99 = wet road (SSR), 1 = everything else. New kart materials need alphaFlag 0.
- Layer 1 = things that must not write depth (sky, particles, weather, decals, flames, glows). All cameras enable layer 1.
- Every `InstancedMesh` MUST have an `instanceColor` buffer (white is fine) or the depth pass crashes. r128 culls an InstancedMesh by its geometry bounding sphere at the mesh origin: give real bounds or split scatters into sectors (see end of `buildTrack`).
- r128 `Texture` has no `userData`. MSAA targets cannot hold a depth texture. Emissive values that look fine in LDR blow out in HDR - keep emissive modest and let bloom do the work.
- glTF materials arrive as MeshStandardMaterial with sRGB textures: correct for this pipeline; give them `envMap` via the reflection probe (`Probe.setEnv` covers kart paints) or `scene.environment`.
- Quality: `CFG.quality` auto/low/med/high/ultra, `isTouch` trims counts on phones, dynamic resolution in `95-main.js`. Anything new must scale down on phones (S25 Ultra is strong, but keep draw calls low: merge static geometry, instance repeated props, share materials). Budget: under ~450 draw calls and ~1.2 M triangles in view on High.
- `window.__apex` is the debug/test handle (G, race, karts, T, TRACKS, selTrack, startSolo, simulate, views).
- Tracks: `TRACKS` array + `buildTrack(ti)` in `20-tracks.js` (ids `alpine`, `desert`, `neon`; tests address tracks by index 0,1,2 and expect 3 tracks, 6 racers, races that finish).

## Rules
- Never put AI model names/identifiers in code, comments or commits. Never commit secrets or keys (the Firebase web config is public by design and fine).
- Work in your own git worktree/branch; commit your work there with a plain descriptive message. Do NOT push, deploy, open PRs or touch other branches. Do not edit `docs/` by hand (it is fine to commit the rebuilt `docs/`... but prefer NOT to: leave `docs/` out of your commits to avoid merge conflicts; the integrator rebuilds).
- Keep changes inside your area's files where possible; when you must touch a shared file make the smallest edit you can.
- Before finishing: build, run the fast tests (0 failed), take screenshots and LOOK at them, fix what looks wrong. Report: what changed, files touched, assets added (with licences), fps numbers, known issues, and ideas not done.
