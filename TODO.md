# TODO
- [x] Phases 1-7 (see CHANGELOG)
- [~] Phase 8: pause/settings, post-processing, low-end mode, accessibility done. Open: title screen, key rebinding, gamepad, lore codex screen (reads CODEX in lore.js), profiling on real hardware, animation polish
- [ ] Phase 9 (unfinished): towns, merchants, marketplaces (buy/sell/barter, motes), trading, quest givers + quest log. Quests must hand out the RESERVED items in loot.js (4 weapons, 4 spells)
- [~] 3D models: loader, animation wrapper, entity binding and fallback are done and self-tested with synthetic data. Waiting on the 3D AI for the pilot batch (player, Husk Soldier, Ashbrand Sword); then calibrate scale / yaw / hand offset / clip names
- [ ] Browser playtest pass: run index.html?selftest, play through castle -> Orsolt -> first region, report console errors and balance
- [ ] Lore: friend is writing it (lore.js stays placeholder until then)
- [ ] Performance ideas not done: instanced props, LOD, per-region lazy asset loading, swept melee hitboxes
- Old saves have no class and show the class screen once
