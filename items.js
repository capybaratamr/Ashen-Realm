// Weapon data: categories (speed/range/poise/status), 27 weapons with stat scaling, infusions, and weapon skills.
export const STAT0 = { vig: 10, mind: 10, end: 10, str: 14, dex: 13, int: 12, fai: 12, arc: 10 };
// speed = animation multiplier, rng = reach multiplier, arc = min facing dot (spear is narrow), poise = poise-damage multiplier
export const CAT = {
  sword: { speed: 1, rng: 1, arc: .3, poise: 1 }, great: { speed: .7, rng: 1.2, arc: .3, poise: 1.8 },
  curved: { speed: 1.15, rng: 1, arc: .3, poise: .8, status: ['bleed', 25] }, dagger: { speed: 1.45, rng: .7, arc: .3, poise: .5, status: ['bleed', 40] },
  spear: { speed: 1, rng: 1.3, arc: .65, poise: .9 }, halberd: { speed: .85, rng: 1.35, arc: .3, poise: 1.3 },
  axe: { speed: .9, rng: 1, arc: .3, poise: 1.3 }, hammer: { speed: .65, rng: 1.1, arc: .3, poise: 2.2 },
  whip: { speed: 1.1, rng: 1.7, arc: .5, poise: .5 }, twin: { speed: 1.2, rng: .9, arc: .3, poise: .7, multi: 2 },
  shield: { speed: .95, rng: .8, arc: .3, poise: 1.4, guard: .5 }, // guard: stamina cost mult + longer parry window
  bow: { speed: 1, rng: 1, arc: .3, poise: .5, ranged: 1 }, xbow: { speed: .8, rng: 1, arc: .3, poise: .8, ranged: 1 },
  staff: { speed: 1, rng: .9, arc: .3, poise: .5, ranged: 1, type: 'magic' }, talisman: { speed: 1.1, rng: .8, arc: .3, poise: .5, ranged: 1, type: 'holy' }
};
// [name, category, base dmg, scaling str,dex,int,fai,arc (0..1.2), skill, optional element]
const W = [
  ['Ashbrand Sword', 'sword', 12, .6, .6, 0, 0, 0, 'warcry'], ["Warden's Blade", 'sword', 13, .8, .4, 0, 0, 0, 'spin'], ['Gilt Oathsword', 'sword', 11, .4, .4, 0, .6, 0, 'smite', 'holy'],
  ['Duskiron Greatsword', 'great', 22, 1, .2, 0, 0, 0, 'spin'], ['Colossus Edge', 'great', 26, 1.2, 0, 0, 0, 0, 'quake'],
  ['Reedmoon Saber', 'curved', 11, .3, .9, 0, 0, .3, 'flurry'], ['Silkwing Tachi', 'curved', 12, .2, 1, 0, 0, .2, 'lunge'],
  ['Cinder Dirk', 'dagger', 8, .2, .8, 0, 0, .4, 'flurry'], ['Quillpoint Dagger', 'dagger', 7, .1, 1, 0, 0, .5, 'lunge'],
  ['Brineglass Spear', 'spear', 12, .5, .7, 0, 0, 0, 'lunge'], ['Gale Pike', 'spear', 13, .7, .5, 0, 0, 0, 'lunge'],
  ['Ironbloom Halberd', 'halberd', 18, .8, .3, 0, 0, 0, 'spin'], ['Sunder Glaive', 'halberd', 17, .5, .6, 0, 0, 0, 'spin'],
  ['Hollowoak Axe', 'axe', 16, .9, .2, 0, 0, 0, 'warcry'], ['Marrow Cleaver', 'axe', 15, .7, .3, 0, 0, .3, 'quake'],
  ['Tidebreaker Maul', 'hammer', 28, 1.2, 0, 0, 0, 0, 'quake'], ['Anvilfall Hammer', 'hammer', 26, 1, .1, 0, .3, 0, 'quake'],
  ['Cinderlash', 'whip', 9, .3, .7, 0, 0, .4, 'lash'], ['Thornweave Whip', 'whip', 8, .2, .8, .2, 0, .3, 'lash'],
  ['Twinfang Blades', 'twin', 7, .2, .9, 0, 0, 0, 'flurry'], ['Dusk & Dawn Blades', 'twin', 8, .3, .8, 0, 0, .2, 'spin'],
  ['Lantern Buckler', 'shield', 6, .5, .3, 0, 0, 0, 'bulwark'], ['Bulwark Door', 'shield', 7, .9, 0, 0, 0, 0, 'bulwark'],
  ['Reedwood Bow', 'bow', 10, .2, .9, 0, 0, 0, 'volley'], ['Gearwork Crossbow', 'xbow', 14, .6, .6, 0, 0, 0, 'volley'],
  ['Starwood Staff', 'staff', 8, 0, 0, 1.2, 0, 0, 'smite'], ["Saint's Talisman", 'talisman', 8, 0, 0, 0, 1.2, 0, 'smite']
];
export const WEAPONS = W.map(([name, cat, base, s, d, i, f, a, skill, type]) => ({ name, cat, base, sc: { str: s, dex: d, int: i, fai: f, arc: a }, skill, ...CAT[cat], ...(type ? { type } : {}) }));
// Smith infusions: change element/status and rescale (half the weapon's own scaling + the infusion's).
export const INFUSIONS = [
  { n: 'Standard' }, { n: 'Fire', type: 'fire', sc: { str: .4, int: .4 } }, { n: 'Lightning', type: 'lightning', sc: { dex: .4, int: .4 } },
  { n: 'Holy', type: 'holy', sc: { fai: .8 } }, { n: 'Magic', type: 'magic', sc: { int: .8 } },
  { n: 'Blood', st: ['bleed', 40], sc: { arc: .6 } }, { n: 'Poison', st: ['poison', 40], sc: { arc: .6 } }, { n: 'Frost', st: ['frost', 40], sc: { int: .5 } }
];
// Weapon skills (cost FP). mv fields are read by Player.begin()/fire(): around, dash, multi, proj, buff, ward...
export const SKILLS = {
  warcry: { n: 'Rallying Cry', fp: 8, mv: { wind: .3, act: .1, rec: .4, amt: 0, poise: 0, buff: 1 } },
  spin: { n: 'Whirlwind Cut', fp: 8, mv: { wind: .25, act: .2, rec: .45, amt: 20, poise: 50, range: 3.3, around: 1 } },
  lunge: { n: 'Piercing Rush', fp: 7, mv: { wind: .2, act: .2, rec: .45, amt: 24, poise: 40, range: 3.8, dash: 9 } },
  quake: { n: 'Faultline Slam', fp: 12, mv: { wind: .5, act: .15, rec: .6, amt: 30, poise: 120, range: 4.2, around: 1, shake: .6 } },
  flurry: { n: 'Thousand Cuts', fp: 9, mv: { wind: .2, act: .25, rec: .4, amt: 9, poise: 20, range: 2.6, multi: 4 } },
  lash: { n: 'Hooked Lash', fp: 7, mv: { wind: .3, act: .15, rec: .45, amt: 22, poise: 50, range: 5.5 } },
  volley: { n: 'Rain of Needles', fp: 10, mv: { wind: .35, act: .1, rec: .4, amt: 9, poise: 15, proj: 5, spread: .5 } },
  smite: { n: 'Starfall Bolt', fp: 12, mv: { wind: .4, act: .1, rec: .45, amt: 34, poise: 60, proj: 1, big: 1 } },
  bulwark: { n: 'Bulwark Stance', fp: 10, mv: { wind: .2, act: .1, rec: .3, amt: 0, poise: 0, ward: 1.5 } }
};
export function weaponDamage(def, lvl, inf, stats) {
  const base = def.base * (1 + .12 * lvl) * (inf.type ? .9 : 1), sc = {};
  for (const k in def.sc) sc[k] = def.sc[k] * (inf.sc ? .5 : 1);
  if (inf.sc) for (const k in inf.sc) sc[k] = (sc[k] || 0) + inf.sc[k];
  let bonus = 0; for (const k in sc) bonus += sc[k] * (stats[k] - 8) / 20 * base;
  return Math.round((base + bonus) * 10) / 10;
}
