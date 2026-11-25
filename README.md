# Ashen Realm (WIP)
Original browser Souls-like built with Three.js (CDN, no build step).
## Run
    cd ashen-realm && python3 -m http.server 8000
Open http://localhost:8000 and click the game to capture the mouse.
## Controls
T cast (hold to charge) · Z next spell slot · M memorize screen · WASD move · Shift sprint · Space roll/backstep · F jump · LMB light combo (air: plunge; on a parried enemy: riposte) · E hold/release charged heavy · RMB guard (raise just before a hit to parry) · Q lock-on · R switch target · C weapon skill · 1/2 prev/next weapon · at the anvil (3,5): X infuse, U upgrade

## Saving
Press **P** for 5 save slots (autosaves every minute and resumes your last slot on launch). Saves live in the browser's localStorage, so they stay on one device/browser. To move one: **Export** a code on one device, **Import** it on the other.

## Play it online (GitHub Pages)
No build step, so it hosts as-is:
1. Create a GitHub repo (e.g. `ashen-realm`) and upload every file in this folder (index.html, *.js, README.md...).
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)` → Save.
3. After a minute it is live at `https://<your-username>.github.io/ashen-realm/`. Open that URL on any device with a keyboard and mouse.
