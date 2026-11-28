# Ashen Realm
A browser dark-fantasy action RPG. Three.js 0.160.0 + vanilla ES modules, no build step, GitHub Pages compatible. Work in progress; never browser-tested by its author (see REVIEW_PACKET.md).

## Run
Online: your GitHub Pages URL. Locally: `python3 -m http.server 8000` in this folder, then open http://localhost:8000 and click the game to capture the mouse.

## Controls
| Key | Action | Key | Action |
|---|---|---|---|
| WASD / mouse | move / camera | Q / R | lock on / switch target |
| Shift | sprint | 1 / 2 | previous / next owned weapon |
| Space | roll (backstep if still) | C | weapon skill |
| F | jump | T (hold) / Z / M | cast / next spell slot / manage spells |
| Left click | light attack, combo, plunge (air), riposte | V / B | Crimson / Cerulean flask |
| Right click | guard (just before a hit = parry) | G | rest at beacon / open chest / pull lever |
| E (hold) | charged heavy | X / U | infuse / upgrade at the anvil |
| Y | mount | N | full map |
| P | save / load | H | help and lore | 
| K | skip tutorial | Esc | pause + settings |
| Enter | skip boss cinematic | F3 | performance overlay |

## What is in it
Hollow Keep (castle start) with a tutorial and the first boss, Orsolt, who drops the Kindling Stone that unlocks leveling. 8 starting classes. Weapons and spells are found (chests, bosses, enemy drops). 27 weapons, 27 spells, 6 regions, 9 enemy types, 9 bosses, flasks, motes, beacons, equip-load tiers, 5 save slots, weather, day/night, minimap and map, synthesized audio, settings with post-processing, New Game+.

## Layout
`main.js` wiring and loop | `player.js` | `combat.js` | `enemies.js` `bosses.js` | `magic.js` `items.js` `loot.js` `classes.js` | `progress.js` | `world.js` `regions.js` `castle.js` `extras.js` | `guide.js` `ui.js` `settings.js` `debug.js` | `save.js` `audio.js` | `models.js` (procedural models) `assets.js` `charmodel.js` (GLB pipeline) | `lore.js` (all story text) | `selftest.js`.

## Story text
All lore lives in `lore.js` (placeholder until the real lore is written). See `LORE_FOR_FRIEND.md`.

## 3D models
Procedural models are the fallback; GLB models plug in without code changes once listed in `assets/manifest.json`. Docs: `ASSET_PIPELINE.md` (architecture), `ASSET_SPEC.md` (requirements and prompts), `PILOT_PROMPTS.md` (first batch).

## Testing
Open `index.html?selftest` for a scripted in-browser test (classes, loot, save round trip, combat, enemy-wall collision, hotkey typing guard, asset loader, animation mapping, model fallback, all 9 bosses, performance probe). It does not write your saves. Press F3 for a live FPS/draw-call overlay.
