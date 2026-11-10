# Apex Carts

Single-file 3D cart racing game (`index.html`). Three tracks, 6 racers, items, drift, garage and graphics settings, PeerJS multiplayer with a TV viewer mode and phone-controller mode.

## Host on GitHub Pages
1. Create a new **public** repository and upload every file in this folder (including `.nojekyll`).
2. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
3. After about a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.

## Play together
- Big screen: open the link → **Host Multiplayer Room** → "This screen is the TV".
- Phones: open the link the host shows (or enter the `CART-1234` code) → **Join as Player** → tick "Phone controller" to use the phone as a gamepad.
- `?room=CART-1234&role=viewer` opens a second TV view; `&role=controller` opens the gamepad directly.

`sw.js` and `manifest.webmanifest` make the hosted game installable ("Add to Home screen") and playable offline in single-player after the first visit.
