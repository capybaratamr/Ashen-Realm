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
