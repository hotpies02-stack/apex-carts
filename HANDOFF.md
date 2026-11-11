# Apex Carts – handoff

Single-file 3D cart racer (`index.html`, v6). Three.js r128 + PeerJS 1.5.4 from CDN. No build step.

## Test suite
```
cd tests
npm install
npx playwright install chromium
npm test            # full: boot, menus, 3-lap AI race on all 3 tracks, multiplayer (mock PeerJS)  ~9 min software GL
npm run test:shots  # also writes screenshots to tests/out
node run.js --fast  # one track only, ~3 min
node run.js --headed  # visible browser, real GPU
```
Exit code 0 = all pass.

## Hosting goal
Create public repo `hotpies02-stack/apex-carts`, push index.html, sw.js, manifest.webmanifest, icon.svg, .nojekyll as `main`, enable Pages (main, root). Then remove branch `apex-carts` from rehab-log if wanted.

## Open work (procedural-only ceiling ~65-68% of AAA)
Neon infield props and mid buildings; desert wall displacement/gullies and softer shadows; Alpine sun/ambient ratio, snow berms; dithered fade for near opponents; gantry housings, start-line checks, minimap backing; kart mesh merge (~75 draws/kart); context-restore handling; background-tab host.

## Rules
Review loop after every rebuild (screenshots + sub-agent art-director review). No model identifiers in commits/code. Never commit secrets or signing keys. Do not open a PR unless asked.
