# Ashen Realm: review packet for the Technical Director (round 2)

## Scope and state
Three.js 0.160.0 dark-fantasy action RPG, vanilla ES modules, no build step, GitHub Pages compatible. 26 modules, ~1588 lines. Feature scope: 6 regions, 9 enemy types, 9 bosses, 27 weapons, 27 spells, 8 classes, castle start, item discovery, saves, audio, settings. Phase 9 (towns, trading, quests) is NOT started. Lore is placeholder (lore.js unchanged this round).

## Your 8 findings and what was done
1. Primitive models -> still the fallback; the GLB path now exists (ModelSlot) but no model has been generated, so nothing has replaced a primitive yet.
2. No central asset pipeline -> assets.js v2 + ASSET_PIPELINE.md.
3. Procedural fallbacks must remain -> yes, untouched; ModelSlot restores them on any failure.
4. Caching, error handling, animation, optimization -> implemented (cache + de-dupe, timeout/retry, validation budgets, AnimatedModel, shared geometry, distant-enemy sleep). Draco, instancing, LOD, lazy loading: not done.
5. Never browser-tested -> still true. Added index.html?selftest (scripted scenarios) and an F3 overlay so a real test pass is one click. I have NOT run them.
6. Phase 9 unfinished -> acknowledged, not started.
7. Lore placeholders preserved -> lore.js untouched.
8. Docs -> README, ASSET_PIPELINE, ASSET_SPEC, PILOT_PROMPTS, TODO, CHANGELOG refreshed.

## Architecture verified by inspection (script)
Import graph resolves. Cycles exist: world -> enemies -> world, and world -> enemies -> loot -> magic -> world. They work because cross-module values are only used inside functions, never at module load. Please judge whether they should be broken. main.js now exposes step() and window.__ashen. A hidden-collision catch: Player already used `slot` for the spell index, so the model binding is named `glb`.

## Bugs found and fixed this round
Typing in text fields triggered hotkeys; enemies/bosses ignored walls and props; pack-alert aggro never expired; all enemies updated every frame regardless of distance; quality change did not resize the composer; missing favicon (console 404); a latent temporal-dead-zone risk on `post` in the resize handler.

## Verified (by me, in a sandbox without a browser)
Syntax of every module; every named import resolves to an export; class/boss-drop data matches the item lists; GLB test fixture structure (re-parsed independently). 
## NOT verified
Everything else: rendering, gameplay, audio, combat feel, boss fights, performance, the self-test itself (written but never executed), GLB loading in a real browser, skinned-model playback, hand-socket alignment.

## Known limitations
Melee uses an instant arc test, not swept hitboxes. Enemies have no pathfinding (they slide along obstacles). Performance unprofiled. The pause menu opens on pointer-lock loss (heuristic). Pointer-lock, audio autoplay and post-processing dynamic imports can fail silently on some browsers. Balance is untuned. The two CommonJS-style hazards I hit earlier (a // comment swallowing a closing brace) were caught only by syntax checks; please review long one-line methods in player.js and bosses.js.

## Questions for review
- Are the module cycles acceptable or should a registry/service object replace direct imports?
- Is per-instance material cloning (for hit flash) acceptable for ~45 skinned enemies, or should flash use a shader uniform / outline pass?
- Is the logical-clip + ModelSlot design the right seam for skeletal characters, given procedural animation currently drives arm/legs?
