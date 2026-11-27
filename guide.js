// Onboarding + world feedback: lore intro, step-by-step tutorial, objective, region banners, day/night, HUD info panel, minimap, help (H).
import * as THREE from 'three';
import { REGIONS, regionAt } from './regions.js';
import { INTRO as LORE } from './lore.js'; // story text lives in lore.js
const CONTROLS = 'WASD move · Mouse camera · Shift sprint · Space roll/backstep · F jump\nLeft click attack/combo · E hold = charged heavy · Right click guard (raise just before a hit to parry, then left click = riposte)\nQ lock-on · R switch target · 1/2 weapon · C weapon skill\nT cast spell (hold for some) · Z next spell · M memorize spells\nV Crimson flask (heal) · B Cerulean flask (FP) · G rest at a beacon (armor, flasks, fast travel)\nY mount/dismount · N full map · G open chests / pull levers (hit suspicious walls) · P save/load · H help · K skip tutorial · Esc pause/settings';
const STEPS = [
  { t: 'Move with W A S D and look around with the mouse.', done: g => g.moved > 6 },
  { t: 'Hold SHIFT while moving to sprint. It drains stamina (the green bar).', done: g => g.seen.sprint },
  { t: 'Press SPACE while moving to roll. You are invulnerable for part of the roll.', done: g => g.seen.roll },
  { t: 'Click the LEFT mouse button to attack. Click again quickly for a combo.', done: g => g.seen.attack },
  { t: 'Walk toward the Husk Soldier (to your right, east of spawn) and press Q to lock on.', done: g => g.seen.lock },
  { t: 'Hold RIGHT mouse to guard. Raise it just BEFORE its swing lands to parry, then left-click to riposte!', done: g => g.seen.guard },
  { t: 'Defeat the Husk Soldier. It raises its arm and glows red before striking: roll, guard or parry.', done: g => !g.w.enemies[0].alive },
  { t: 'Press V to drink your Crimson Flask and heal.', done: g => g.seen.drink },
  { t: 'Walk to the grey Beacon near spawn and press G to rest. There you change armor, upgrade flasks and fast travel.', done: g => g.p.litBeacons.includes('Hollow Beacon') },
  { t: 'Press T to cast your equipped spell (Z swaps slots, M manages them). Staffs and talismans cast stronger; 1 and 2 swap weapons.', done: g => g.seen.cast },
  { t: 'The gate is sealed. Enter the great hall to the north and defeat Orsolt, the Warden of the Hollow Gate.', done: g => g.p.bossesDown.includes('gate') }
];
export class Guide {
  constructor(p, w, ui) {
    this.p = p; this.w = w; this.ui = ui; this.seen = {}; this.moved = 0; this.lx = p.pos.x; this.lz = p.pos.z; this.time = .3; this.it = 0; this.open = false; this.tc = new THREE.Color();
    const mk = (css, tag = 'div') => { const e = document.createElement(tag); e.style.cssText = 'position:fixed;font-family:Georgia,serif;color:#e8dcc0;pointer-events:none;z-index:4;' + css; document.body.appendChild(e); return e; };
    this.info = mk('right:18px;top:16px;text-align:right;font-size:14px;text-shadow:0 0 4px #000;line-height:1.5;max-width:340px');
    this.prompt = mk('left:50%;bottom:130px;transform:translateX(-50%);text-align:center;font-size:20px;text-shadow:0 0 6px #000;background:#0008;padding:8px 18px;border:1px solid #ffffff22;max-width:70%');
    this.banner = mk('left:0;right:0;top:26%;text-align:center;font-size:44px;letter-spacing:4px;text-shadow:0 0 12px #000;opacity:0;transition:opacity 1s');
    this.map = mk('right:18px;bottom:18px;border:1px solid #ffffff44;background:#0008', 'canvas'); this.map.width = this.map.height = 150;
    this.over = mk('inset:0;background:#05070cf2;display:none;overflow:auto;padding:5% 12%;font-size:17px;line-height:1.6'); Object.assign(this.over.style, { pointerEvents: 'auto', zIndex: 8 });
    addEventListener('keydown', e => {
      if ((e.code === 'Enter' || e.code === 'KeyH') && this.open) this.hide(); else if (e.code === 'KeyH' && !ui.menu) this.show(false); else if (e.code === 'KeyK') p.tut = STEPS.length;
    });
    let seenIntro = false; try { seenIntro = localStorage.getItem('ashenrealm.intro'); } catch { } if (!seenIntro) this.show(true);
  }
  objective() { const n = this.p.litBeacons.length; if (!this.p.bossesDown.includes('gate')) return 'Escape Hollow Keep: defeat Orsolt, Warden of the Hollow Gate, in the great hall to the north.'; return this.p.tut < STEPS.length ? 'Learn the basics (follow the prompts at the bottom).' : n < 6 ? `Light every beacon: ${n}/6. Each land has one. Travel outward from the Hollow, fight its guardian (bosses felled ${this.p.bossesDown.length}/9), and rest at it with G.` : 'All six beacons are lit. The observatory gate far to the north is open: face the Fallen Astronomer.'; }
  show(first) { this.open = true; this.ui.menu = true; document.exitPointerLock(); this.over.style.display = 'block'; this.over.innerHTML = `<h1 style="letter-spacing:6px">ASHEN REALM</h1><p>${LORE}</p><h3>Your goal</h3><p>${this.objective()}</p><h3>Controls</h3><pre style="font-family:inherit;white-space:pre-wrap">${CONTROLS}</pre><p><b>Press Enter${first ? '' : ' or H'} to ${first ? 'begin' : 'close'}, then click the game to capture the mouse.</b></p>`; }
  hide() { this.open = false; this.ui.menu = false; this.over.style.display = 'none'; try { localStorage.setItem('ashenrealm.intro', '1'); } catch { } }
  update(dt, rig) {
    const p = this.p, w = this.w, st = p.tut || 0; this.seen[p.state] = true; if (rig.target) this.seen.lock = true; if (p.onGround && Math.hypot(p.vel.x, p.vel.z) > 5.5) this.seen.sprint = true;
    this.moved += Math.hypot(p.pos.x - this.lx, p.pos.z - this.lz); this.lx = p.pos.x; this.lz = p.pos.z;
    const s = STEPS[st]; if (s && !this.open && s.done(this)) { p.tut = st + 1; this.seen = {}; this.moved = 0; }
    this.prompt.style.display = s ? 'block' : 'none'; if (s) this.prompt.innerHTML = `Tutorial ${st + 1}/${STEPS.length}<br>${s.t}<br><small style="opacity:.6">K skips the tutorial · H help</small>`;
    const R = regionAt(p.pos.x, p.pos.z);
    if (R !== this.reg) { this.reg = R; if (w.ctx.sound) w.ctx.sound.ambient(R.id); if (!p.discovered.includes(R.id)) p.discovered.push(R.id); this.banner.innerHTML = `${R.name}<div style="font-size:18px;letter-spacing:1px;margin-top:8px">${R.lore}</div>`; this.banner.style.opacity = 1; clearTimeout(this.bt); this.bt = setTimeout(() => this.banner.style.opacity = 0, 4000); }
    this.time += dt / 480; const day = Math.sin(this.time * 6.283) * .5 + .5; // 8-minute day/night cycle
    const dk = w.darkness ? .12 : 1; w.sun.intensity = (.15 + day) * dk; w.hemi.intensity = (.25 + day * .6) * dk; this.tc.set(R.sky).multiplyScalar((.2 + .8 * day) * dk);
    const bg = w.scene.background; bg.lerp(this.tc, Math.min(1, dt * .8)); w.scene.fog.color.copy(bg); w.scene.fog.far += ((w.darkness ? 18 : R.fog) - w.scene.fog.far) * Math.min(1, dt * .8);
    if ((this.it -= dt) <= 0) { this.it = .25; this.info.innerHTML = `Ashmotes <b>${p.motes}</b>${p.keyItems.includes('kindling') ? ' · Level ' + p.level : ''}<br>Crimson Flask ${p.flask[0]}/${p.flaskMax[0]} (V) · Cerulean ${p.flask[1]}/${p.flaskMax[1]} (B)<br>Load ${Math.round(p.ratio * 100)}% ${p.tierName}<br><b>${R.name}</b><br><i>${this.objective()}</i>${p.lost ? '<br><span style="color:#ffd27a">Your lost motes glow where you fell.</span>' : ''}`; }
    const c = this.map.getContext('2d'), S = 150 / 380, X = x => (x + 190) * S, Z = z => (z + 190) * S; c.clearRect(0, 0, 150, 150);
    for (const r of REGIONS) { const k = r.col.map(v => Math.round(v * 255)); c.fillStyle = p.discovered.includes(r.id) ? `rgba(${k},.75)` : 'rgba(30,30,40,.8)'; c.beginPath(); c.arc(X(r.cx), Z(r.cz), r.r * S, 0, 6.283); c.fill(); }
    for (const b of w.beacons) { if (!p.discovered.includes(regionAt(b.x, b.z).id)) continue; c.fillStyle = p.litBeacons.includes(b.name) ? '#ffb347' : '#889'; c.fillRect(X(b.x) - 2, Z(b.z) - 2, 4, 4); }
    c.fillStyle = '#e33'; for (const e of w.enemies) if (e.alive && Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 30) c.fillRect(X(e.pos.x) - 1.5, Z(e.pos.z) - 1.5, 3, 3);
    c.fillStyle = c.strokeStyle = '#fff'; c.beginPath(); c.arc(X(p.pos.x), Z(p.pos.z), 3, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(X(p.pos.x), Z(p.pos.z)); c.lineTo(X(p.pos.x) + Math.sin(p.face) * 8, Z(p.pos.z) + Math.cos(p.face) * 8); c.stroke();
  }
}
