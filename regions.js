// Region definitions (leaf module): six themed lands around the hub, each with colors, sky/fog, terrain roughness, enemy types.
export const REGIONS = [
  { id: 'hollow', name: 'Hollow Keep', cx: 0, cz: 0, r: 42, col: [.30, .36, .24], sky: 0x7a8aa0, fog: 170, amp: .6, enemies: ['Husk Soldier'], lore: 'Where the last lantern fell. Ash drifts like snow.' },
  { id: 'marsh', name: 'Sunken Salt Marsh', cx: 100, cz: 0, r: 62, col: [.22, .38, .36], sky: 0x6f8a80, fog: 75, amp: .3, enemies: ['Marsh Hag', 'Tide Brute', 'Husk Soldier'], lore: 'Brine seeps from the old tideworks. The low water is poisoned.' },
  { id: 'clock', name: 'Clockwork Ruin City', cx: 31, cz: 95, r: 62, col: [.45, .38, .28], sky: 0x8a7a68, fog: 140, amp: .5, enemies: ['Cog Sentinel', 'Ember Wretch', 'Husk Soldier'], lore: 'Brass districts that ticked until time itself stalled.' },
  { id: 'glass', name: 'Glass Desert', cx: -81, cz: 59, r: 62, col: [.78, .74, .55], sky: 0xb8b090, fog: 200, amp: .4, enemies: ['Glass Wisp', 'Ember Wretch', 'Cog Sentinel'], lore: 'Sand fused to glass beneath a sun that never set.' },
  { id: 'monastery', name: 'Frozen Monastery', cx: -81, cz: -59, r: 62, col: [.78, .85, .92], sky: 0x9fb4cc, fog: 95, amp: 1.4, enemies: ['Frost Shade', 'Bell Acolyte', 'Husk Soldier'], lore: 'Bell-ringers prayed here until the cold answered.' },
  { id: 'forest', name: 'Lantern Forest', cx: 31, cz: -95, r: 62, col: [.16, .28, .22], sky: 0x3a4a50, fog: 90, amp: .9, enemies: ['Lantern Stalker', 'Marsh Hag', 'Frost Shade'], lore: 'Each lantern holds a name. Do not blow one out.' }
];
export function regionAt(x, z) { let best = REGIONS[0], bd = 1e9; for (const r of REGIONS) { const d = Math.hypot(x - r.cx, z - r.cz) / r.r; if (d < bd) { bd = d; best = r; } } return best; }
export function blend(x, z) { // smooth terrain color + roughness between neighbouring regions
  let w = 0, a = 0; const c = [0, 0, 0];
  for (const r of REGIONS) { const k = Math.max(0, 1 - Math.hypot(x - r.cx, z - r.cz) / (r.r * 1.15)), kk = k * k; w += kk; a += r.amp * kk; for (let i = 0; i < 3; i++) c[i] += r.col[i] * kk; }
  return w < 1e-4 ? { col: [.3, .3, .3], amp: 1 } : { col: c.map(v => v / w), amp: a / w };
}
// Boss arena centers [x, z, radius]: gate (castle great hall), tide, queen, moth, choir, forge, shadow, warden, astronomer. Props and normal enemies stay out of them.
import { REGION_LORE } from './lore.js';
for (const r of REGIONS) r.lore = REGION_LORE[r.id] || r.lore;
export const ARENAS = [[0, -22, 14], [125, -25, 24], [60, 120, 22], [-105, 85, 24], [-110, -85, 22], [5, 125, 24], [15, -125, 20], [62, -120, 22], [-30, -150, 26]];
