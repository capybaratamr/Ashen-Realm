# Changelog
## Phase 2
- combat.js: damage types + resists, poise/stagger, bleed/poison/frost buildup meters, pooled particles, applyHit()
- enemies.js: 4 melee enemies with telegraphed attacks (state machine), stagger, parried/riposte window
- Player: heavy + charged heavy (E), guard (RMB), parry (guard raised <0.3s before hit), riposte (LMB on parried enemy), poise/stagger, status effects
- HUD: status meters, weapon infusion line, target health bar; colored damage numbers
## Phase 1
- Orbit camera + lock-on, sprint/roll/backstep/jump, stamina, terrain collision, fall damage, plunge, light combo
## Phase 3
- items.js: 27 weapons in 15 categories (speed/reach/poise/status, scaling on Str/Dex/Int/Fai/Arc), 8 infusions, 9 weapon skills (FP cost)
- Damage = base * upgrade (+0..+10) + stat scaling; infusions change element/status; ranged weapons fire pooled projectiles
- Anvil near spawn: X infuse, U upgrade (free until Phase 5 currency); FP bar added
## Phase 4
- magic.js: 27 spells (13 sorceries, 14 incantations): projectiles, charged Soul Spear/Meteor, beams, gravity pull, novas, delayed strikes, wards, blink, heals/regen, buffs, purify, 2 summons
- FP spent at cast start; cast bar; getting hit interrupts casting; staff/talisman boost their school
- Memorize screen (M) with 6 slots; spell-colored gather/impact particles
## Phase 5 (partial)
- save.js: 5 localStorage slots, autosave, resume last slot, export/import save code (P menu)
## Phase 5 (rest) + Phase 6 (core) + onboarding
- models.js: armored knight (helmet, cape, pads, legs) and 4 distinct enemy silhouettes, with walk/roll/drink animation
- progress.js: Ashmotes + one-shot death recovery, Crimson/Cerulean flasks (V/B, interruptible), beacons (G: rest, level up 8 stats w/ cost curve, flask upgrades, armor, fast travel), equip load tiers (Underweight/Light/Medium/Heavy/Overweight)
- regions.js: 6 themed regions (hub, marsh, clockwork city, glass desert, frozen monastery, lantern forest) with own terrain colors/roughness, props, enemies, fog/sky; marsh water poisons
- guide.js: lore intro, 10-step tutorial, objective (light 6 beacons), region banners, day/night cycle, HUD info panel, minimap with discovery, help screen (H)
- Enemies patrol, flee when wounded, and stay dead until you rest; save now stores level, motes, flasks, armor, beacons, tutorial step
## Phase 6 finished, Phase 7 and start of Phase 8
- extras.js: weather (rain/snow/ash), 12 chests + hidden chests behind illusory walls (hit the wall), lever-operated gate, mount (Y), full map (N)
- 9 enemy types, 3 per outer region; pack alerts; difficulty scaling
- bosses.js: 8 bosses (Tidemaw, Horologe Queen, Prism, Frozen Choir, Cinderhold, Umbral Duelist, Lantern Warden, Fallen Astronomer) with arenas, cinematic intros, 2-3 phases, telegraphs, per-boss mechanics, anti-camping/anti-kiting rules, relics, boss bar, ending + New Game+
- audio.js: synthesized sound effects + per-region ambient; settings.js: pause/settings menu, bloom/vignette/grain, low-end mode, reduced shake, color-blind HUD
## Castle start, no leveling
- castle.js: you start inside walled Hollow Keep; the gate is sealed until the first boss, Orsolt, Warden of the Hollow Gate (great hall, north), is defeated
- Leveling removed entirely. Power now comes from weapon upgrades/infusions (cost motes at the anvil), armor, flask upgrades and boss relics
- lore.js: all story text in one file (intro, ending, region lines, boss names, codex) for easy editing
