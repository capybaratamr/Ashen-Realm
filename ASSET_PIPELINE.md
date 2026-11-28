# Asset pipeline architecture (Three.js 0.160.0, GitHub Pages compatible)

## Principles
1. Models are optional. With an empty `assets/manifest.json` the game behaves exactly as before (procedural models from `models.js`).
2. One door for all assets: `assets.js` (`Assets`). Game code never calls GLTFLoader directly.
3. Failures never reach gameplay. A missing, slow, corrupt or over-budget file is logged and skipped; the procedural model stays.
4. No build step. Everything loads through the import map in `index.html` (`three` and `three/addons/`), relative URLs only.

## Manifest (`assets/manifest.json`, version 2)
```json
{ "version": 2, "models": {
    "player":            { "url": "assets/models/player.glb", "scale": 1, "yaw": 0, "hand": { "pos": [0, 0, 0], "rot": [0, 0, 0] }, "clips": { "idle": ["Armature|Idle"] } },
    "enemy:Husk Soldier": "assets/models/husk.glb",
    "boss:gate":          { "url": "assets/models/orsolt.glb" },
    "weapon:Ashbrand Sword": "assets/models/ashbrand.glb" } }
```
A plain string is shorthand for `{ "url": ... }`. Keys: `player`, `enemy:<kind>`, `boss:<id>`, `weapon:<name>`, `prop:<name>`.
Optional fields: `scale`, `yaw` (radians), `hand` (weapon offset on the right-hand bone, calibrated per model), `clips` (extra accepted clip names per logical clip).

## Lifecycle
`init()` fetches the manifest (15 s timeout) -> `setup()` imports GLTFLoader + SkeletonUtils (+ Meshopt decoder if present) -> `load(key)` for every entry:
cached, de-duplicated while in flight, 15 s timeout, one retry, then `validate()` -> stored. `ready` becomes true when everything has settled.
`instance(key)` returns an independent copy (own skeleton, **shared geometry and textures**), the clips, and the manifest entry.
Errors go to `assets.errors`, budget overruns to `assets.warnings`; `summary()` feeds the F3 overlay.

## Validation and budgets (warnings, except unusable files which are rejected)
Triangles per prefix: player 12k, enemy 8k, boss 25k, weapon 2k, prop 3k. Texture > 1024 px and > 3 materials warn. A file with no meshes is rejected.

## Animation
`AnimatedModel` wraps an AnimationMixer. Game code uses **logical** names (`idle walk run roll backstep jump fall land attack1-3 heavy charge guard parry riposte hit stagger drink cast die windup strike recover roar`).
Each maps to accepted GLB clip names (case-insensitive; defaults in `CLIP_ALIASES`, extendable per model in the manifest). `play(name)` returns **false** when the clip is missing so the caller falls back to `idle` (or the procedural pose).
Looping: idle, walk, run, charge, guard. Everything else plays once and clamps. Cross-fade 0.15 s.
State -> clip tables: Player in `Player.driveModel`, enemies in `Enemy.update`, bosses in `Boss.update`.

## Entity binding (`charmodel.js`, `ModelSlot`)
Each Player / Enemy / Boss owns one slot. Every frame it polls once the assets are ready. If a model exists for its key it: clones materials per instance (so hit-flash only tints that enemy), attaches the model, hides the procedural body, and starts driving clips. If anything throws, the model is removed and the procedural body is restored (`state = 'failed'`).
Bosses are scaled by the game (model them at 1x). The player weapon (procedural blade or `weapon:<name>` GLB) rides the right-hand bone when the model has one; otherwise it is hidden and a warning is logged.

## Performance decisions
Shared geometry and textures across instances; only materials are cloned. Distant idle enemies sleep and are hidden (140 m). No Draco by default (needs an external decoder). Meshopt is used automatically if the file needs it. Textures capped at 1024. `Assets.dispose(key)` frees GPU memory. Not done yet: instancing for repeated props, LOD, per-region lazy loading (the API supports `load(key)` on demand).

## What is NOT done or verified
No generated model exists, so the character path (rig, clips, hand socket) has only been exercised with synthetic data in the self-test, never with a real skinned GLB. Expect calibration work (scale, yaw, hand offset, clip names) when the first real model arrives.
