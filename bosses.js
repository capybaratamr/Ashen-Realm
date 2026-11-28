// Phase 7: 8 bosses with arenas, cinematic intros, 2-3 phases, telegraphed attacks (state machine + weighted picks), gimmicks,
// anti-cheese rules, relic loot, and New Game+. Bosses live in world.enemies so lock-on, parry, riposte and projectiles just work.
import * as THREE from 'three';
import { heightAt } from './world.js';
import { ARENAS } from './regions.js';
import { grant } from './loot.js';
import { ENDING } from './lore.js';
import { RELICS } from './items.js';
import { BOSS_LORE } from './lore.js';
import { buildEnemy } from './models.js';
import { ModelSlot } from './charmodel.js';
import { pushOut, isTyping } from './util.js';
import { Status, COLORS } from './combat.js';
import { respawnAll } from './progress.js';
const V = new THREE.Vector3(), T = new THREE.Vector3(), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const SW = (wind, amt, r, ph = [1, 2, 3], w = 1) => ({ k: 'swing', wind, amt, r, ph, w, poise: 40 });
const SL = (wind, amt, r, ph = [1, 2, 3], w = 1) => ({ k: 'slam', wind, amt, r, ph, w, poise: 70 });
const CH = (wind, amt, ph = [1, 2, 3], w = 1) => ({ k: 'charge', wind, amt, r: 0, ph, w, poise: 60 });
const SH = (wind, amt, n, ph = [1, 2, 3], w = 1) => ({ k: 'shot', wind, amt, n, r: 0, ph, w, poise: 20 });
const ER = (wind, amt, n, ph = [1, 2, 3], w = 1) => ({ k: 'erupt', wind, amt, n, r: 3.2, ph, w, poise: 40 });
const DROPS = { gate: ['w:Duskiron Greatsword'], tide: ['s:crush'], queen: ['w:Ironbloom Halberd'], moth: ['s:beam'], choir: ['s:judge'], forge: ['w:Marrow Cleaver'], shadow: ['w:Dusk & Dawn Blades'], warden: ['s:rain'], astro: ['w:Colossus Edge', 's:meteor'] }; // guaranteed weapon / spell per boss
const DEFS = [
  { id: 'gate', name: 'Orsolt, Warden of the Hollow Gate', sub: '', look: 'Husk Soldier', col: 0x6a6a78, scale: 2, hp: 420, ph: [.5], g: 'gate', type: 'physical', spd: 3.2, reward: 500, relic: 'gate', atk: [SW(.9, 20, 4.5), SL(1.1, 24, 6), CH(1, 22, [2])] },
  { id: 'tide', name: 'Tidemaw, the Tidal Colossus', sub: 'The flood remembers every drowned city', look: 'Tide Brute', col: 0x3a6a78, scale: 2.4, hp: 600, ph: [.5], g: 'flood', type: 'physical', spd: 3, reward: 900, relic: 'tide', atk: [SW(.9, 26, 5), SL(1.1, 30, 7), CH(.9, 28, [1, 2]), SH(.9, 18, 3, [2])] },
  { id: 'queen', name: 'Maribel, the Horologe Queen', sub: 'Time bends to her last word', look: 'Cog Sentinel', col: 0xb08a40, scale: 2, hp: 560, ph: [.5], g: 'rewind', type: 'lightning', spd: 3.6, reward: 850, relic: 'queen', atk: [SW(.7, 22, 4.5), SL(.9, 26, 6), CH(.8, 24), SH(.8, 16, 5, [2])] },
  { id: 'moth', name: 'Prism, the Glass-Winged Knight', sub: 'Every reflection carries a blade', look: 'Glass Wisp', col: 0xdff4ff, scale: 2.2, hp: 520, ph: [.66, .33], g: 'mirror', type: 'magic', spd: 4, reward: 900, relic: 'moth', atk: [SW(.6, 20, 4.5), CH(.7, 24), SH(.8, 14, 5, [2, 3]), SL(.9, 22, 6, [3])] },
  { id: 'choir', name: 'The Frozen Choir', sub: 'Three ringers. They must fall in order', look: 'Bell Acolyte', col: 0xcfe0ff, scale: 1.7, hp: 220, pools: [220, 240, 260], ph: [], g: 'choir', type: 'holy', spd: 3.4, reward: 1000, relic: 'choir', atk: [SW(.8, 18, 4), SH(.9, 14, 3), SL(1, 22, 5, [2, 3]), ER(1, 20, 3, [3])] },
  { id: 'forge', name: 'Cinderhold, the Forge Titan', sub: 'The floor remembers the furnace', look: 'Ember Wretch', col: 0xc4541c, scale: 2.8, hp: 760, ph: [.5], g: 'forge', type: 'fire', spd: 2.8, reward: 1100, relic: 'forge', atk: [SW(1, 30, 6), SL(1.2, 34, 8), CH(1, 28), ER(1, 22, 3, [2])] },
  { id: 'shadow', name: 'The Umbral Duelist', sub: 'It fights with your own arms', look: 'Husk Soldier', col: 0x14141c, scale: 1.3, hp: 520, ph: [.5], g: 'shadow', type: 'physical', spd: 4.6, reward: 1000, relic: 'shadow', atk: [SW(.5, 18, 3.2), SW(.4, 14, 3.2, [1, 2, 3], 1.2), CH(.6, 22), SH(.7, 14, 3, [2])] },
  { id: 'warden', name: 'The Lantern Warden', sub: 'Only your torch holds back the dark', look: 'Lantern Stalker', col: 0x2a4a30, scale: 2.2, hp: 600, ph: [.5], g: 'dark', type: 'fire', spd: 3.8, reward: 1100, relic: 'warden', atk: [SW(.8, 22, 4.8), SL(1, 26, 6), SH(.8, 16, 3), CH(.8, 24, [2]), ER(1, 20, 3, [2])] },
  { id: 'astro', name: 'Vael Orrun, the Fallen Astronomer', sub: 'He rewrote gravity, and gravity forgot him', look: 'Frost Shade', col: 0x6a4aa0, scale: 2.2, hp: 1200, ph: [.66, .33], g: 'astro', type: 'magic', spd: 3.6, reward: 3000, relic: 'astro', atk: [SW(.8, 26, 5), SL(1, 30, 7), SH(.8, 20, 5), CH(.8, 28), ER(1, 24, 4, [2, 3])] }
].map((d, i) => ({ ...d, drop: DROPS[d.id] || [], keyItem: d.id === 'gate' ? 'kindling' : null, x: ARENAS[i][0], z: ARENAS[i][1], r: ARENAS[i][2], ...(BOSS_LORE[d.id] || {}) }));
const CAMP = { k: 'erupt', wind: .9, amt: 24, n: 3, r: 3.2, ph: [1, 2, 3], w: 1, poise: 40 }; // anti-camping punishment

class Boss {
  constructor(scene, d, mgr) {
    Object.assign(this, { d, k: d, mgr, scene, name: d.name, isEnemy: true, isBoss: true, res: {}, poise: 160, maxPoise: 160, poiseT: 0, slow: 1, s: 'idle', t: 0, cd: 1, flash: 0, dead: 0, ph: 1, active: false, defeated: false, ringer: 0, still: 0, far: 0, sx: 0, sz: 0, q: [], tg: [], gt: 0, lt: 0, burn: 0, hpMult: 1, wantIntro: false, wph: 0, dd: new THREE.Vector3() });
    this.maxHp = this.hp = d.g === 'choir' ? d.pools[0] : d.hp; this.status = new Status(this); this.home = new THREE.Vector3(d.x, heightAt(d.x, d.z), d.z);
    this.mat = new THREE.MeshStandardMaterial({ color: d.col }); const m = buildEnemy(d.look, this.mat); this.mesh = m.group; this.mesh.scale.setScalar(d.scale); this.arm = m.arm; this.legs = m.legs; this.slot = new ModelSlot(this, 'boss:' + d.id, [m.body, ...m.legs]); this.mesh.position.copy(this.home); scene.add(this.mesh); this.pos = this.mesh.position;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(d.r - .5, d.r, 56), new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: .35, side: THREE.DoubleSide, depthTest: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(d.x, this.home.y + .4, d.z); this.ring.visible = false; scene.add(this.ring);
  }
  get alive() { return this.hp > 0; }
  set(s) { this.s = s; this.t = 0; }
  onStagger() { if (this.alive && this.active && this.s !== 'roar') this.set('stagger'); }
  statusHurt(n, c) { if (!this.alive) return; this.takeDamage(n); this.ctx.ui.damage(this.pos.clone().add(new THREE.Vector3(0, 3, 0)), n, '#' + c.toString(16).padStart(6, '0')); }
  takeDamage(d) {
    this.hp -= d; this.flash = .1; if (this.hp > 0 || !this.active) return;
    if (this.d.g === 'choir' && this.ringer < 2) { // the next ringer steps forward; only one is ever vulnerable
      this.ringer++; this.ph = this.ringer + 1; this.maxHp = this.hp = Math.round(this.d.pools[this.ringer] * this.hpMult); this.mat.color.setHex([0xcfe0ff, 0x9fb8e8, 0x6a88c8][this.ringer]); this.set('roar'); this.mgr.say('The next ringer steps forward'); this.ctx.sound && this.ctx.sound.sfx('bell');
    } else this.die();
  }
  die() { const p = this.pw, d = this.d; this.defeated = true; this.hp = 0; this.dead = 1e9; this.mesh.visible = false; this.cleanup(); p.motes += d.reward; if (!p.relics.includes(d.relic)) p.relics.push(d.relic); for (const c of d.drop) grant(p, this.ctx, c);
    if (d.keyItem && !p.keyItems.includes(d.keyItem)) { p.keyItems.push(d.keyItem); this.ctx.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 4.4, 0)), 'Kindling Stone obtained: you can now level up at beacons', '#ffd27a'); } /* key item: unlocks leveling */ if (!p.bossesDown.includes(d.id)) p.bossesDown.push(d.id); this.mgr.felled(this); }
  cleanup() { this.active = false; this.ring.visible = false; for (const k of ['fl', 'lv']) if (this[k]) { this.scene.remove(this[k]); this[k] = null; } if (this.cl) { this.cl.forEach(c => this.scene.remove(c)); this.cl = null; } this.q.length = 0; if (this.pw) this.pw.gmul = 1; this.mgr.w.darkness = 0; this.gf = undefined; }
  reset() { this.cleanup(); this.ringer = 0; this.ph = 1; if (this.d.g === 'choir') this.maxHp = Math.round(this.d.pools[0] * this.hpMult); this.hp = this.maxHp; this.mat.color.setHex(this.d.col); this.pos.copy(this.home); this.set('idle'); }
  engage() { this.active = true; this.ring.visible = true; this.set('choose'); this.cd = .6; this.sx = this.pw.pos.x; this.sz = this.pw.pos.z; if (this.d.g === 'dark') this.mgr.w.darkness = 1; }
  images() { const r = this.mesh.rotation.y, o = this.pos, d = this.d, a = [{ x: o.x, z: o.z, r }]; if (this.cl) a.push({ x: 2 * d.x - o.x, z: 2 * d.z - o.z, r: r + Math.PI }, { x: o.x, z: 2 * d.z - o.z, r: Math.PI - r }); return a; } // mirror-boss reflections also strike
  mk(a) { const p = this.pw, sh = this.d.g === 'shadow'; return { amt: a.amt * (1 + .5 * (p.ng || 0)) * (this.mgr.w.diff || 1) * (sh ? .6 + p.wdmg() / 40 : 1), type: sh ? p.wtype() : this.d.type, poise: a.poise || 30, status: sh ? p.wstatus() : null }; }
  hit(a) { this.pw.receive(this, this.mk(a), this.ctx); }
  pick(dist) {
    const pool = this.d.atk.filter(a => a.ph.includes(this.ph));
    if (this.still > 5) { this.still = 0; return CAMP; } // standing still too long -> eruptions under your feet
    if (this.far > 3) { this.far = 0; return pool.find(a => a.k === 'charge') || pool.find(a => a.k === 'shot') || pool[0]; } // kiting -> gap closer / ranged
    const ws = pool.map(a => a.w * (a.k === 'swing' || a.k === 'slam' ? (dist < a.r + 2 ? 3 : .15) : (dist > 7 ? 2 : .6)));
    let r = Math.random() * ws.reduce((x, y) => x + y, 0); for (let i = 0; i < pool.length; i++) if ((r -= ws[i]) <= 0) return pool[i]; return pool[0];
  }
  begin(a, mult = 1) {
    const p = this.pw; this.atk = a; this.lastAtk = a; this.wind = a.wind * mult; this.set('windup'); this.tg = [];
    if (a.k === 'erupt') for (let i = 0; i < a.n; i++) this.tg.push({ x: p.pos.x + (i ? (Math.random() - .5) * 9 : 0), z: p.pos.z + (i ? (Math.random() - .5) * 9 : 0) });
    if (a.k === 'charge') { this.dd.set(p.pos.x - this.pos.x, 0, p.pos.z - this.pos.z).normalize(); this.mesh.rotation.y = Math.atan2(this.dd.x, this.dd.z); }
  }
  tele(dt) { // telegraph: red particles mark the danger zone during wind-up
    if ((this.tt = (this.tt || 0) - dt) > 0) return; this.tt = .1; const a = this.atk, P = this.ctx.particles, o = this.pos, r = this.mesh.rotation.y, at = (x, z) => P.burst(T.set(x, heightAt(x, z) + .4, z), 0xff4030, 1, .4);
    if (a.k === 'swing') for (let i = -3; i <= 3; i++) at(o.x + Math.sin(r + i * .22) * a.r, o.z + Math.cos(r + i * .22) * a.r);
    else if (a.k === 'slam') for (let i = 0; i < 14; i++) at(o.x + Math.cos(i * .45) * a.r, o.z + Math.sin(i * .45) * a.r);
    else if (a.k === 'charge') for (let i = 1; i < 8; i++) at(o.x + this.dd.x * i * 2, o.z + this.dd.z * i * 2);
    else if (a.k === 'erupt') for (const t of this.tg) for (let i = 0; i < 8; i++) at(t.x + Math.cos(i * .8) * a.r, t.z + Math.sin(i * .8) * a.r);
    else P.burst(T.set(o.x, o.y + 2 * this.d.scale, o.z), 0xff4030, 3, 1);
  }
  strike() {
    const a = this.atk, p = this.pw, ctx = this.ctx, o = this.pos;
    if (a.k === 'swing' || a.k === 'slam') {
      for (const q of this.images()) { const dx = p.pos.x - q.x, dz = p.pos.z - q.z, dd = Math.hypot(dx, dz); if (dd < a.r && (a.k === 'slam' || (dx * Math.sin(q.r) + dz * Math.cos(q.r)) / (dd || 1) > .15)) { this.hit(a); break; } }
      if (a.k === 'slam') { for (let i = 0; i < 20; i++) ctx.particles.burst(T.set(o.x + Math.cos(i * .31) * a.r, o.y + .4, o.z + Math.sin(i * .31) * a.r), 0xccbb99, 2, 3); ctx.fx.shake = .5; ctx.sound && ctx.sound.sfx('boom'); }
      this.set('recover');
    } else if (a.k === 'charge') { this.set('dash'); this.hitDone = false; }
    else if (a.k === 'shot') { const base = Math.atan2(p.pos.x - o.x, p.pos.z - o.z); for (let i = 0; i < a.n; i++) { const ang = base + (i - (a.n - 1) / 2) * .28; this.mgr.shoot(this, T.set(o.x, o.y + 1.3, o.z), new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang)), this.mk(a), 15); } this.set('recover'); }
    else if (a.k === 'erupt') { for (const t of this.tg) this.q.push({ t: .6, x: t.x, z: t.z, a }); this.set('recover'); }
  }
  gim(dt, p) { // per-boss mechanics
    const g = this.d.g, d = this.d;
    if (g === 'flood' && this.ph >= 2) { // arena floods; low ground poisons
      if (!this.fl) { this.fl = new THREE.Mesh(new THREE.CircleGeometry(d.r, 32), new THREE.MeshStandardMaterial({ color: 0x2a6a7a, transparent: true, opacity: .6 })); this.fl.rotation.x = -Math.PI / 2; this.fl.position.set(d.x, this.home.y - .6, d.z); this.scene.add(this.fl); this.mgr.say('The arena floods'); }
      this.fl.position.y = Math.min(this.home.y + 1, this.fl.position.y + dt * .3); if (p.onGround && p.pos.y < this.fl.position.y) p.status.add('poison', 30 * dt);
    } else if (g === 'mirror' && this.ph >= 2) { // two reflections that mirror her movement and attacks
      if (!this.cl) { this.cl = [this.mesh.clone(), this.mesh.clone()]; this.cl.forEach(c => this.scene.add(c)); }
      const o = this.pos, r = this.mesh.rotation.y; this.cl[0].position.set(2 * d.x - o.x, heightAt(2 * d.x - o.x, 2 * d.z - o.z), 2 * d.z - o.z); this.cl[1].position.set(o.x, o.y, 2 * d.z - o.z); this.cl[0].rotation.y = r + Math.PI; this.cl[1].rotation.y = Math.PI - r;
    } else if (g === 'forge' && this.ph >= 2) { // floor cycles stone -> warning -> lava; stay on the central platform
      if (!this.lv) { this.lv = new THREE.Mesh(new THREE.RingGeometry(6, d.r, 40), new THREE.MeshBasicMaterial({ color: 0xff4a10, transparent: true, side: THREE.DoubleSide, depthTest: false })); this.lv.rotation.x = -Math.PI / 2; this.lv.position.set(d.x, this.home.y + .5, d.z); this.scene.add(this.lv); }
      this.lt = (this.lt + dt) % 9; const lava = this.lt > 6, warn = this.lt > 4.5 && !lava; this.lv.visible = lava || warn; this.lv.material.opacity = lava ? .75 : .25 + .2 * Math.sin(this.lt * 14);
      if (lava && p.onGround && Math.hypot(p.pos.x - d.x, p.pos.z - d.z) > 6 && (this.burn += dt) > .7) { this.burn = 0; p.statusHurt(12, 0xff6a20); }
    } else if (g === 'astro' && this.ph >= 3) { // gravity flips between floaty and crushing
      this.gt += dt; const f = Math.floor(this.gt / 3.5) % 2; if (f !== this.gf) { this.gf = f; this.mgr.say('Gravity shifts'); } p.gmul = f ? 2.4 : .3;
    }
  }
  update(dt, w) {
    const p = this.pw = w.player; this.ctx = w.ctx;
    const fh = this.flash > 0 ? 0xffffff : this.s === 'windup' ? 0x771100 : 0; if (this.flash > 0) this.flash -= dt; this.mat.emissive.setHex(fh); this.slot.flash(fh);
    this.slot.poll(this.ctx.assets); if (this.slot.active) { this.slot.update(dt); if (!this.active && !this.defeated) this.slot.play('idle'); }
    if (this.defeated) return;
    const ax = p.pos.x - this.d.x, az = p.pos.z - this.d.z, ar = Math.hypot(ax, az) || 1;
    if (!this.active) {
      if (this.d.g === 'astro' && p.litBeacons.length < 6) { if (ar < this.d.r + 1) { p.pos.x = this.d.x + ax / ar * (this.d.r + 2); p.pos.z = this.d.z + az / ar * (this.d.r + 2); this.mgr.say('The observatory gate is sealed. Light all six beacons.'); } return; }
      if (ar < this.d.r * .7 && !p.dead) this.wantIntro = true; return;
    }
    if (p.dead) { this.reset(); return; }
    this.status.update(dt); dt *= this.slow;
    if (ar > this.d.r) { p.pos.x = this.d.x + ax / ar * this.d.r; p.pos.z = this.d.z + az / ar * this.d.r; } // fog wall: no leaving the arena
    if (Math.hypot(p.pos.x - this.sx, p.pos.z - this.sz) < 1.6) this.still += dt; else { this.still = 0; this.sx = p.pos.x; this.sz = p.pos.z; }
    const d = V.subVectors(p.pos, this.pos); d.y = 0; const dist = d.length(); this.far = dist > 14 ? this.far + dt : 0; this.t += dt; this.cd -= dt;
    if ((this.poiseT -= dt) <= 0) this.poise = Math.min(this.maxPoise, this.poise + 15 * dt);
    if (this.d.g !== 'choir') { const want = 1 + this.d.ph.filter(t => this.hp / this.maxHp < t).length; if (want > this.ph) { this.ph = want; this.set('roar'); this.mgr.say(want === 3 ? 'It is not finished' : 'It grows desperate'); } }
    this.gim(dt, p);
    for (let i = this.q.length; i--;) { // delayed eruptions
      const e = this.q[i]; e.t -= dt;
      if (e.t <= 0) { this.q.splice(i, 1); if (Math.hypot(p.pos.x - e.x, p.pos.z - e.z) < e.a.r) this.hit(e.a); for (let y = 0; y < 6; y++) this.ctx.particles.burst(T.set(e.x, heightAt(e.x, e.z) + y, e.z), 0xff7a2a, 2, 2); this.ctx.fx.shake = Math.max(this.ctx.fx.shake, .3); }
      else if (Math.random() < .3) this.ctx.particles.burst(T.set(e.x + (Math.random() - .5) * 2 * e.a.r, heightAt(e.x, e.z) + .3, e.z + (Math.random() - .5) * 2 * e.a.r), 0xff4030, 1, .5);
    }
    const face = () => { this.mesh.rotation.y += wrap(Math.atan2(d.x, d.z) - this.mesh.rotation.y) * Math.min(1, dt * 6); }; let moving = false;
    switch (this.s) {
      case 'choose': face(); if (dist > 2.5 + this.d.scale * .8) { d.normalize(); this.pos.addScaledVector(d, this.d.spd * dt); moving = true; } if (this.cd <= 0) this.begin(this.pick(dist)); break;
      case 'windup': if (this.t < this.wind * .7) face(); this.tele(dt); if (this.t >= this.wind) this.strike(); break;
      case 'dash': this.pos.addScaledVector(this.dd, 22 * dt); moving = true; if (!this.hitDone && dist < 1.8 + this.d.scale) { this.hitDone = true; this.hit(this.atk); } if (this.t > .5) this.set('recover'); break;
      case 'recover': if (this.t > .8) { // rewind queen: sometimes instantly repeats her last attack
        if (this.d.g === 'rewind' && this.ph >= 2 && this.lastAtk && !this.rep && Math.random() < .45) { this.rep = true; this.mgr.say('Rewind'); this.begin(this.lastAtk, .5); } else { this.rep = false; this.cd = .6 - this.ph * .1; this.set('choose'); } } break;
      case 'roar': if (this.t > 1.3) this.set('choose'); break;
      case 'stagger': if (this.t > 2) this.set('choose'); break;
      case 'parried': if (this.t > 2.5) this.set('choose'); break;
    }
    pushOut(this.pos, w.colliders, 1); this.pos.y = heightAt(this.pos.x, this.pos.z); this.wph += dt * (moving ? 8 : 0); this.legs[0].rotation.x = Math.sin(this.wph) * .6; this.legs[1].rotation.x = -Math.sin(this.wph) * .6;
    if (this.slot.active) { const c = { windup: 'windup', recover: 'recover', roar: 'roar', stagger: 'stagger', parried: 'stagger', dash: 'walk' }[this.s] || (moving ? 'walk' : 'idle'); if (!this.slot.play(c, { once: c !== 'walk' && c !== 'idle' })) this.slot.play(moving ? 'walk' : 'idle'); }
    this.arm.rotation.x = this.s === 'windup' || this.s === 'roar' ? -2 : this.s === 'recover' ? .6 : -.3;
  }
}

export class Bosses {
  constructor(scene, w, ui, rig, p) {
    this.w = w; this.ui = ui; this.rig = rig; this.p = p; this.cine = null; this.pool = []; p.relics = p.relics || []; p.bossesDown = p.bossesDown || [];
    this.list = DEFS.map(d => new Boss(scene, d, this)); w.enemies.push(...this.list); w.bosses = this.list;
    for (const b of this.list) if (p.bossesDown.includes(b.d.id)) { b.defeated = true; b.hp = 0; b.dead = 1e9; b.mesh.visible = false; }
    const sg = new THREE.SphereGeometry(.4, 8, 6); for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xff6a40 })); m.visible = false; scene.add(m); this.pool.push({ m, life: 0, vel: new THREE.Vector3() }); }
    this.torch = new THREE.PointLight(0xffc070, 0, 16); scene.add(this.torch);
    const mk = (css, html = '') => { const e = document.createElement('div'); e.style.cssText = 'position:fixed;font-family:Georgia,serif;color:#e8dcc0;pointer-events:none;' + css; e.innerHTML = html; document.body.appendChild(e); return e; };
    this.bar = mk('left:20%;right:20%;bottom:40px;display:none;z-index:5', '<div style="text-align:center;font-size:20px;letter-spacing:2px;margin-bottom:4px;text-shadow:0 0 6px #000"></div><div style="height:14px;background:#000a;border:1px solid #ffffff44"><i style="display:block;height:100%;width:100%;background:#a0262e"></i></div>');
    this.bn = this.bar.children[0]; this.bf = this.bar.children[1].firstChild;
    this.top = mk('left:0;right:0;top:0;height:11vh;background:#000;display:none;z-index:9'); this.bot = mk('left:0;right:0;bottom:0;height:11vh;background:#000;display:none;z-index:9');
    this.title = mk('left:0;right:0;bottom:16vh;text-align:center;font-size:42px;letter-spacing:5px;text-shadow:0 0 12px #000;display:none;z-index:10');
    this.msg = mk('left:0;right:0;top:35%;text-align:center;font-size:34px;letter-spacing:3px;text-shadow:0 0 10px #000;opacity:0;transition:opacity .6s;z-index:6');
    this.over = mk('inset:0;background:#05070cf2;display:none;padding:12%;text-align:center;font-size:20px;line-height:1.7;z-index:11'); this.over.style.pointerEvents = 'auto';
    this.over.onclick = e => { if (e.target.tagName === 'BUTTON') this.ng(); };
    addEventListener('keydown', e => { if (e.code === 'Enter' && !isTyping(e)) this.skip = true; });
  }
  say(t) { if (t === this.lt && performance.now() - this.ltt < 3000) return; this.lt = t; this.ltt = performance.now(); this.msg.textContent = t; this.msg.style.opacity = 1; clearTimeout(this.mt); this.mt = setTimeout(() => this.msg.style.opacity = 0, 2400); }
  shoot(src, pos, dir, hit, speed) { const q = this.pool.find(o => o.life <= 0); if (!q) return; q.life = 2.5; q.m.position.copy(pos); q.vel.copy(dir).multiplyScalar(speed); q.src = src; q.hit = hit; q.m.material.color.setHex(COLORS[hit.type] || 0xff6a40); q.m.visible = true; }
  startCine(b) { this.cine = { b, t0: performance.now() }; this.skip = false; this.ui.menu = true; document.exitPointerLock(); this.top.style.display = this.bot.style.display = this.title.style.display = 'block'; this.title.innerHTML = `${b.d.name}<div style="font-size:18px;letter-spacing:1px;margin-top:6px">${b.d.sub}</div>`; this.w.ctx.sound && this.w.ctx.sound.sfx('bell'); }
  tickCine() { // 3.4s orbiting camera shot (real time, since the game is paused); Enter skips
    const c = this.cine, t = (performance.now() - c.t0) / 1000, b = c.b, s = b.d.scale;
    if (t > 3.4 || this.skip) { this.rig.cine = null; this.cine = null; this.ui.menu = false; this.top.style.display = this.bot.style.display = this.title.style.display = 'none'; b.engage(); return; }
    const a = 1 + t * .45; this.rig.cine = { pos: new THREE.Vector3(b.pos.x + Math.cos(a) * 6 * s, b.pos.y + (1.6 + t * .3) * s, b.pos.z + Math.sin(a) * 6 * s), look: new THREE.Vector3(b.pos.x, b.pos.y + 1.8 * s, b.pos.z) };
  }
  felled(b) {
    this.say('FOE FELLED'); this.w.ctx.sound && this.w.ctx.sound.sfx('boom'); this.ui.damage(this.p.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), `+${b.d.reward} motes · ${RELICS[b.d.relic].n}`, '#ffd27a');
    if (b.d.id === 'astro') setTimeout(() => { this.ui.menu = true; document.exitPointerLock(); this.over.style.display = 'block'; this.over.innerHTML = '<h1 style="letter-spacing:6px">THE LANTERN BURNS AGAIN</h1>' + ENDING.map(t => '<p>' + t + '</p>').join('') + '<p><button style="font-size:20px;padding:10px 24px;cursor:pointer">Begin New Game+</button></p><p style="opacity:.6">Enemies and bosses return stronger; you keep your level, gear and relics.</p>'; }, 3200);
  }
  ng() { // New Game+: everything respawns 60% tougher, you keep your build
    const p = this.p, w = this.w; p.ng = (p.ng || 0) + 1; p.bossesDown = []; p.litBeacons = [];
    for (const e of w.enemies) { e.maxHp = Math.round(e.maxHp * 1.6); e.defeated = false; if (e.isBoss) { e.hpMult *= 1.6; e.ringer = 0; e.ph = 1; if (e.d.g === 'choir') e.maxHp = Math.round(e.d.pools[0] * e.hpMult); } }
    respawnAll(w); this.over.style.display = 'none'; this.ui.menu = false; this.say('New Game+ ' + p.ng);
  }
  update(dt) {
    const w = this.w, p = this.p; this.torch.position.set(p.pos.x, p.pos.y + 2.5, p.pos.z); this.torch.intensity = w.darkness ? 2.5 : 0;
    if (this.cine) this.tickCine(); else { const b = this.list.find(b => b.wantIntro); if (b) { b.wantIntro = false; this.startCine(b); } }
    const act = this.list.find(b => b.active); w.bossActive = !!act; this.bar.style.display = act ? 'block' : 'none'; if (act) { this.bn.textContent = act.name; this.bf.style.width = Math.max(0, act.hp / act.maxHp * 100) + '%'; }
    for (const q of this.pool) { if (q.life <= 0) continue; q.life -= dt; q.m.position.addScaledVector(q.vel, dt); if (Math.hypot(p.pos.x - q.m.position.x, p.pos.z - q.m.position.z) < 1 && Math.abs(p.pos.y + 1 - q.m.position.y) < 1.6) { p.receive(q.src, q.hit, w.ctx); q.life = 0; } if (q.life <= 0) q.m.visible = false; }
  }
}
