// Eight starting classes: stats, armor, weapons and spells. You begin with ONLY your class's kit; everything else is found in the world.
import { CLASS_LORE } from './lore.js';
import { wIndex } from './loot.js';
import { SPELL_BY_ID } from './magic.js';
import { WEAPONS } from './items.js';
export const CLASSES = [
  { id: 'knight', stats: { vig: 14, mind: 9, end: 12, str: 15, dex: 11, int: 8, fai: 9, arc: 8 }, armor: 3, weapons: ['Ashbrand Sword', 'Lantern Buckler'], spells: ['fury'] },
  { id: 'duelist', stats: { vig: 11, mind: 10, end: 11, str: 10, dex: 16, int: 10, fai: 8, arc: 9 }, armor: 2, weapons: ['Reedmoon Saber', 'Quillpoint Dagger'], spells: ['blink'] },
  { id: 'brute', stats: { vig: 16, mind: 7, end: 13, str: 18, dex: 9, int: 6, fai: 7, arc: 7 }, armor: 3, weapons: ['Hollowoak Axe', 'Tidebreaker Maul'], spells: ['stoneheart'] },
  { id: 'sorcerer', stats: { vig: 9, mind: 16, end: 9, str: 8, dex: 11, int: 18, fai: 8, arc: 10 }, armor: 1, weapons: ['Starwood Staff', 'Cinder Dirk'], spells: ['dart', 'lance', 'shards'] },
  { id: 'cleric', stats: { vig: 12, mind: 13, end: 10, str: 11, dex: 9, int: 8, fai: 17, arc: 9 }, armor: 2, weapons: ["Saint's Talisman", 'Gilt Oathsword'], spells: ['mend', 'smite', 'purify'] },
  { id: 'ranger', stats: { vig: 11, mind: 10, end: 10, str: 10, dex: 15, int: 9, fai: 9, arc: 12 }, armor: 2, weapons: ['Reedwood Bow', 'Brineglass Spear'], spells: ['arc'] },
  { id: 'dancer', stats: { vig: 10, mind: 11, end: 10, str: 9, dex: 17, int: 10, fai: 8, arc: 13 }, armor: 1, weapons: ['Twinfang Blades', 'Thornweave Whip'], spells: ['blink', 'dart'] },
  { id: 'wayfarer', stats: { vig: 12, mind: 11, end: 11, str: 12, dex: 12, int: 10, fai: 10, arc: 9 }, armor: 2, weapons: ["Warden's Blade", 'Gearwork Crossbow'], spells: ['ward', 'mend'] }
].map(c => ({ ...c, ...(CLASS_LORE[c.id] || { name: c.id, desc: '' }) }));
export class ClassSelect { // shown on a new game (after the intro) and for old saves with no class; cannot be skipped
  constructor(p, ui, guide, saves) {
    this.p = p; this.ui = ui; this.guide = guide; this.saves = saves; this.open = false;
    this.el = document.createElement('div'); this.el.style.cssText = 'position:fixed;inset:0;background:#05070cf6;display:none;overflow:auto;padding:3% 6%;z-index:13;color:#e8dcc0;font-family:Georgia,serif';
    document.body.appendChild(this.el); this.el.onclick = e => { const b = e.target.closest('button'); if (b) this.pick(b.dataset.id); };
  }
  update() { if (!this.p.cls && !this.guide.open && !this.open) this.show(); }
  show() {
    this.open = true; this.ui.menu = true; document.exitPointerLock(); this.el.style.display = 'block';
    const st = s => Object.entries(s).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ');
    this.el.innerHTML = `<h1 style="letter-spacing:5px;text-align:center">CHOOSE YOUR CLASS</h1><p style="text-align:center;opacity:.7">You begin with only your class's weapons and spells. Everything else must be found in the world.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">${CLASSES.map(c => `<button data-id="${c.id}" style="text-align:left;background:#141a28;color:#e8dcc0;border:1px solid #ffffff33;padding:12px;cursor:pointer;font-family:inherit;font-size:14px;line-height:1.5"><b style="font-size:20px">${c.name}</b><br>${c.desc}<br><small>${st(c.stats)}</small><br><b>Weapons:</b> ${c.weapons.join(', ')}<br><b>Spells:</b> ${c.spells.map(s => SPELL_BY_ID[s].n).join(', ')}</button>`).join('')}</div>`;
  }
  pick(id) {
    const c = CLASSES.find(x => x.id === id), p = this.p; if (!c) return;
    p.cls = id; p.stats = { ...c.stats }; p.ownW = c.weapons.map(wIndex); p.ownS = [...c.spells]; p.wi = p.ownW[0]; p.wlvl = 0; p.inf = 0; p.level = 1; p.armorIdx = c.armor;
    p.slots = [...c.spells, null, null, null, null, null, null].slice(0, 6); p.slot = 0; p.blade.scale.z = p.def.rng; p.blade.visible = p.def.cat !== 'shield'; p.hp = p.fp = p.stam = 1e9; // recalc clamps these to the new maximums
    this.open = false; this.ui.menu = false; this.el.style.display = 'none'; this.saves.save(this.saves.slot, true);
  }
}
