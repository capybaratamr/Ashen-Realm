// Phase 5 systems: Ashmotes (currency) + one-shot death recovery, beacons (rest / level up / armor / fast travel), equip load tiers.
import * as THREE from 'three';
import { REGIONS, regionAt } from './regions.js';
import { heightAt } from './world.js';
import { RELICS } from './items.js';
import { isTyping } from './util.js';
export const ARMOR = [
  { n: 'Bare Skin', w: 0, def: 0, poise: 0, col: 0x9a7a60 }, { n: "Wanderer's Rags", w: 2, def: .03, poise: 0, col: 0x6a5a48 }, { n: 'Warden Leathers', w: 7, def: .12, poise: 6, col: 0x7a5a3a },
  { n: 'Gilt Mail', w: 14, def: .22, poise: 16, col: 0xb8a060 }, { n: 'Cinderplate', w: 24, def: .32, poise: 30, col: 0x5a3a3a }, { n: 'Colossus Harness', w: 38, def: .42, poise: 50, col: 0x4a5058 }
];
const WEIGHT = { sword: 5, great: 14, curved: 5, dagger: 2, spear: 7, halberd: 11, axe: 8, hammer: 16, whip: 3, twin: 6, shield: 9, bow: 3, xbow: 6, staff: 3, talisman: 1 };
export const STAT_NAMES = { vig: 'Vigor', mind: 'Mind', end: 'Endurance', str: 'Strength', dex: 'Dexterity', int: 'Intelligence', fai: 'Faith', arc: 'Arcane' };
const costFor = lv => Math.round(60 * 1.14 ** lv); // scaling level-up cost curve
export function recalc(p) { // derived stats: vigor->HP, mind->FP, endurance->stamina + equip load; load ratio picks a tier
  const s = p.stats, A = ARMOR[p.armorIdx];
  p.maxHp = 100 + 6 * (s.vig - 10); p.maxFp = 50 + 4 * (s.mind - 10); p.maxStam = 100 + 4 * (s.end - 10);
  let rd = 0, rdef = 0, rp = 0; for (const id of p.relics) { const r = RELICS[id]; if (!r) continue; p.maxHp += r.hp || 0; p.maxFp += r.fp || 0; p.maxStam += r.stam || 0; rd += r.dmg || 0; rdef += r.def || 0; rp += r.poise || 0; } // boss relics
  p.relicDmg = 1 + rd; p.relicPoise = rp; p.armor = A; p.armorDef = A.def + rdef; p.maxLoad = 30 + 1.8 * (s.end - 10); p.load = A.w + WEIGHT[p.def.cat]; const r = p.ratio = p.load / p.maxLoad;
  [p.tierName, p.rollMul, p.dmgMul, p.spd, p.regenMul] = r < .1 ? ['Underweight', 1.3, 1.2, 1, 1] : r < .3 ? ['Light', 1.15, 1, 1, 1] : r < .7 ? ['Medium', 1, 1, 1, 1] : r < 1 ? ['Heavy', .85, 1, .9, .85] : ['OVERWEIGHT', .6, 1, .6, .5];
  p.noRoll = r >= 1; p.hp = Math.min(p.hp, p.maxHp); p.fp = Math.min(p.fp, p.maxFp); p.stam = Math.min(p.stam, p.maxStam); if (p.torsoMat) p.torsoMat.color.setHex(A.col);
}
export function respawnAll(w) { for (const e of w.enemies) { if (e.defeated) continue; e.hp = e.maxHp; e.poise = e.maxPoise; e.mesh.visible = true; e.pos.copy(e.home); e.status.reset(); e.s = 'idle'; e.t = 0; e.dead = 0; e.cd = 1; } }
export function dropMotes(p) { // die: motes stay at the death spot. Die again before reaching them and they are gone.
  const w = p.world; if (p.lost) { w.scene.remove(p.lost.mesh); p.lost = null; }
  if (p.motes > 0) { const m = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a })); m.position.set(p.pos.x, p.pos.y + 1, p.pos.z); w.scene.add(m); p.lost = { x: p.pos.x, z: p.pos.z, amt: p.motes, mesh: m }; p.motes = 0; }
}
export class Progress {
  constructor(p, w, ui, saves) {
    this.p = p; this.w = w; this.ui = ui; this.saves = saves; this.open = false; this.near = null;
    w.beacons = [['Hollow Beacon', -5, 4], ...REGIONS.slice(1).map(r => [r.name + ' Beacon', r.cx + 6, r.cz + 6])].map(([name, x, z]) => {
      const y = heightAt(x, z), g = new THREE.Group(), pil = new THREE.Mesh(new THREE.CylinderGeometry(.25, .4, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x555a66 })); pil.position.y = 1.1;
      const flame = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0x445566 })); flame.position.y = 2.6; g.add(pil, flame); g.position.set(x, y, z); w.scene.add(g); w.colliders.push({ x, z, r: .5 }); return { name, x, y, z, flame };
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(60, 40), new THREE.MeshStandardMaterial({ color: 0x3a6a5a, transparent: true, opacity: .6 })); water.rotation.x = -Math.PI / 2; water.position.set(100, -.8, 0); w.scene.add(water); // poisonous marsh water
    const css = 'position:fixed;font-family:Georgia,serif;color:#e8dcc0;z-index:7;';
    this.el = document.createElement('div'); this.el.style.cssText = css + 'inset:6% 12%;background:#0d1018f2;border:1px solid #ffffff33;padding:18px;display:none;overflow:auto';
    this.hint = document.createElement('div'); this.hint.style.cssText = css + 'left:50%;bottom:200px;transform:translateX(-50%);font-size:20px;text-shadow:0 0 6px #000;display:none;pointer-events:none';
    document.body.append(this.el, this.hint); this.el.onclick = e => this.click(e);
    addEventListener('keydown', e => { if (e.code !== 'KeyG' || isTyping(e)) return; if (this.open) this.close(); else if (this.near && !p.dead && !ui.menu) this.rest(this.near); });
  }
  rest(b) { const p = this.p; p.hp = p.maxHp; p.fp = p.maxFp; p.stam = p.maxStam; p.flask = p.flaskMax.slice(); p.status.reset(); p.spawn.set(b.x, b.y, b.z + 2); if (!p.litBeacons.includes(b.name)) p.litBeacons.push(b.name); respawnAll(this.w); this.open = true; this.ui.menu = true; document.exitPointerLock(); this.el.style.display = 'block'; this.render(); }
  close() { this.open = false; this.ui.menu = false; this.el.style.display = 'none'; this.saves.save(this.saves.slot, true); }
  render() {
    const p = this.p, cost = costFor(p.level);
    this.el.innerHTML = `<h2>${this.near ? this.near.name : 'Beacon'}: you rest. Flasks refilled, enemies stir again.</h2><p>Ashmotes: <b>${p.motes}</b></p>
    ${p.keyItems.includes('kindling') ? `<h3>Level ${p.level}: level up (${cost} motes each)</h3>${Object.keys(STAT_NAMES).map(k => `<div>${STAT_NAMES[k]}: <b>${p.stats[k]}</b> <button data-a="lvl" data-k="${k}">+</button></div>`).join('')}` : '<p style="opacity:.6">You cannot grow stronger yet. Something the Warden of the keep carries may change that.</p>'}
    <h3>Flasks</h3><button data-a="fl" data-k="0">Crimson ${p.flaskMax[0]}→${p.flaskMax[0] + 1} (${300 * p.flaskMax[0]})</button><button data-a="fl" data-k="1">Cerulean ${p.flaskMax[1]}→${p.flaskMax[1] + 1} (${300 * p.flaskMax[1]})</button>
    <h3>Armor · load ${p.load.toFixed(1)}/${p.maxLoad.toFixed(1)} (${p.tierName})</h3>${ARMOR.map((a, i) => `<button data-a="armor" data-k="${i}" ${i === p.armorIdx ? 'data-sel="1"' : ''}>${a.n} · ${a.w} wt · -${Math.round(a.def * 100)}% dmg</button>`).join('')}
    <p style="opacity:.7">Light load = faster rolls. Heavy = slower. Overweight = no rolling. Your weapon's weight counts. Endurance raises your limit.</p>
    <h3>Fast travel</h3>${this.w.beacons.filter(x => p.litBeacons.includes(x.name)).map(x => `<button data-a="go" data-k="${x.name}">${x.name}</button>`).join('')}<p><button data-a="close">Leave (G)</button></p>`;
    this.el.querySelectorAll('button').forEach(b => b.style.cssText = 'background:#1b2130;color:#e8dcc0;border:1px solid ' + (b.dataset.sel ? '#ffd27a' : '#ffffff33') + ';margin:3px;padding:5px 10px;cursor:pointer;font-family:inherit');
  }
  click(e) {
    const b = e.target.closest('button'); if (!b) return; const p = this.p, a = b.dataset.a, k = b.dataset.k;
    if (a === 'lvl' && p.keyItems.includes('kindling')) { const c = costFor(p.level); if (p.motes >= c) { p.motes -= c; p.stats[k]++; p.level++; } }
    else if (a === 'fl') { const c = 300 * p.flaskMax[k]; if (p.motes >= c && p.flaskMax[k] < (k == 0 ? 8 : 6)) { p.motes -= c; p.flaskMax[k]++; p.flask[k]++; } }
    else if (a === 'armor') p.armorIdx = +k;
    else if (a === 'go') { const t = this.w.beacons.find(x => x.name === k); p.pos.set(t.x, t.y, t.z + 2); p.vel.set(0, 0, 0); this.close(); return; }
    else if (a === 'close') { this.close(); return; }
    recalc(p); this.render();
  }
  update(dt) {
    const p = this.p, w = this.w; recalc(p);
    for (const b of w.beacons) { const lit = p.litBeacons.includes(b.name); b.flame.material.color.setHex(lit ? 0xffb347 : 0x445566); b.flame.scale.setScalar(lit ? 1 + Math.sin(performance.now() / 120 + b.x) * .15 : .7); }
    if (p.lost && Math.hypot(p.pos.x - p.lost.x, p.pos.z - p.lost.z) < 1.8) { p.motes += p.lost.amt; this.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 2, 0)), 'Motes recovered +' + p.lost.amt, '#ffd27a'); w.scene.remove(p.lost.mesh); p.lost = null; }
    if (regionAt(p.pos.x, p.pos.z).id === 'marsh' && p.onGround && p.pos.y < -.8) p.status.add('poison', 15 * dt); // marsh hazard
    let near = null; for (const b of w.beacons) if (Math.hypot(p.pos.x - b.x, p.pos.z - b.z) < 3.5) near = b;
    this.near = near; this.hint.style.display = near && !p.dead && !this.open ? 'block' : 'none'; if (near) this.hint.textContent = 'Press G to rest at the beacon';
  }
}
