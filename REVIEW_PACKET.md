# Ashen Realm: review packet for the Technical Director (ChatGPT)

## Scope and state
Browser dark-fantasy action RPG, Three.js 0.160.0 (CDN, ES modules, no build step), GitHub Pages compatible. ~1368 lines across the JS modules in this folder.
Built so far: movement/camera/lock-on, combat (parry, riposte, poise, damage types, status buildup), 27 weapons, 27 spells, saves (5 slots), flasks/motes/beacons/armor + equip load, 6 regions, 9 enemy types, 9 bosses (cinematic intros, phases, mechanics), castle start (Hollow Keep), 8 starting classes with item discovery, Kindling Stone leveling gate, weather/day-night/minimap/full map, synthesized audio, settings + post-processing, centralized asset loader (loader only).

## Architecture (where to look)
main.js (loop, wiring) | player.js (Player + CameraRig, state machine) | combat.js (applyHit, Status, Particles, Projectiles) | enemies.js | bosses.js | magic.js | items.js (weapons, infusions, skills, relics) | loot.js (ownership, drops) | classes.js | progress.js (motes, flasks, beacons, equip load) | regions.js / world.js / castle.js / extras.js (world) | guide.js (tutorial, HUD, minimap) | settings.js | save.js | audio.js | models.js (procedural models) | assets.js (GLB loader) | lore.js (all story text, editable by a non-programmer).
Conventions: a shared ctx object ({fx, ui, particles, projectiles, sound, assets}) hangs off world.ctx; input uses a per-frame pressed{} map; most patches were applied by script, so some functions are long single lines.

## What has actually been verified
- Every .js file passes node --check (syntax).
- Every named import resolves to a matching export (scripted check).
- Class starting kits and boss drops reference weapons/spells that exist (scripted check).
## What has NOT been verified
- The game has never been run in a browser by me. Nothing about gameplay, rendering, audio, or performance is confirmed.
- No automated tests exist.

## Known bugs and limitations
1. Two of my scripted edits produced syntax errors (a // comment swallowed a closing brace). They were caught by the syntax check, but similar logic slips could exist where no syntax error results. Please review long one-line methods in player.js and bosses.js.
2. Enemies and bosses do not collide with walls or props; an enemy outside the castle can walk through the wall. Boss arenas only clamp the player.
3. Melee hits are an instant arc test on the active frame, not a swept volume (the original brief asked for swept hitboxes).
4. Performance is unprofiled: ~45 enemies of ~12-15 meshes each, ~300 prop meshes, 36 wall boxes, 900 weather/particle points, optional bloom pass. No instancing or LOD yet.
5. Pause menu opens on pointer-lock loss; this heuristic may misfire.
6. Old saves have no class and are reset to the class kit on first load.
7. Phase 8 unfinished: title screen, key rebinding, gamepad, lore codex screen, animation polish. Quests/trading/marketplaces (Phase 9) not started; 8 items are reserved in loot.js for quest rewards.
8. Models: every character is still built from Three.js primitives (fallback). One code-built GLB exists (assets/models/ashbrand_sword.glb, a placeholder-quality sword, not AI-generated) and Player.syncWeaponModel() swaps it in for the Ashbrand Sword when it loads. The GLB itself passes a structural check (scripted re-parse); loading and rendering in the browser are UNTESTED. No rigged/animated GLB exists yet.
9. Balance is untuned (boss HP/damage, drop rates, motes costs).
10. lore.js was accidentally overwritten once and rebuilt from the friend's guide; the original placeholder wording was lost.

## Questions for review
- Is the state-machine + procedural-animation approach in player.js a good base for switching to skeletal GLB clips, or should animation be restructured first?
- Which of the performance risks in item 4 should be fixed before models arrive?
- Any spec items from the original brief that are missing or only half-met?
