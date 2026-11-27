// Item ownership: you start with only your class's kit. Everything else is found: chests, bosses, strong enemies, chance drops (quests arrive with Phase 9).
import * as THREE from 'three';
import { WEAPONS } from './items.js';
import { SPELLS, SPELL_BY_ID } from './magic.js';
export const wIndex = name => WEAPONS.findIndex(w => w.name === name);
export const RESERVED = ['w:Anvilfall Hammer', 'w:Cinderlash', 'w:Bulwark Door', 'w:Gale Pike', 's:familiar', 's:hound', 's:renew', 's:aegis']; // held back as quest rewards for Phase 9
export function pool(p) { // everything the player does not own yet (and that is not quest-reserved)
  const out = [];
  for (const w of WEAPONS) if (!p.ownW.includes(wIndex(w.name)) && !RESERVED.includes('w:' + w.name)) out.push('w:' + w.name);
  for (const s of SPELLS) if (!p.ownS.includes(s.id) && !RESERVED.includes('s:' + s.id)) out.push('s:' + s.id);
  return out;
}
export function grant(p, ctx, code) { // code is 'w:Weapon Name' or 's:spellid'; duplicates turn into motes
  const id = code.slice(2); let txt;
  if (code[0] === 'w') { const i = wIndex(id); if (p.ownW.includes(i)) { p.motes += 400; txt = 'Duplicate weapon: +400 motes'; } else { p.ownW.push(i); txt = 'New weapon: ' + id; } }
  else if (p.ownS.includes(id)) { p.motes += 400; txt = 'Duplicate spell: +400 motes'; } else { p.ownS.push(id); txt = 'New spell: ' + SPELL_BY_ID[id].n; }
  ctx.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 3.4, 0)), txt, '#ffe9a0');
}
export function chestItem(p, ctx) { const pl = pool(p); if (pl.length) grant(p, ctx, pl[Math.floor(Math.random() * pl.length)]); else p.motes += 500; }
export function rollDrop(p, ctx, strong) { if (Math.random() < (strong ? .15 : .04)) chestItem(p, ctx); } // 4% from normal enemies, 15% from strong ones
