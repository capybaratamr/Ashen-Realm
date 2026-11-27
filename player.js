// Player + orbit camera. State machine: free | roll | back | attack. Combat hit logic is inline for now (see TODO: move to combat.js).
import * as THREE from 'three';
import { heightAt, BOUND } from './world.js';
import { Status, applyHit, COLORS } from './combat.js';
import { SPELL_BY_ID, castSpell } from './magic.js';
import { buildKnight } from './models.js';
import { respawnAll, dropMotes } from './progress.js';
import { WEAPONS, INFUSIONS, SKILLS, STAT0, weaponDamage } from './items.js';
const K = {}, pressed = {};
addEventListener('keydown', e => { if (!e.repeat) pressed[e.code] = true; K[e.code] = true; });
addEventListener('keyup', e => K[e.code] = false);
addEventListener('mousedown', e => { if (document.pointerLockElement) { pressed['Mouse' + e.button] = true; K['Mouse' + e.button] = true; } });
addEventListener('mouseup', e => K['Mouse' + e.button] = false);
addEventListener('contextmenu', e => e.preventDefault());
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const GRAV = 22, V = new THREE.Vector3();

export class CameraRig { // third-person orbit camera with soft lock-on
  constructor(cam, dom) {
    this.cam = cam; this.yaw = 0; this.pitch = .35; this.dist = 6.5; this.target = null; this.sens = .0022;
    dom.addEventListener('click', () => dom.requestPointerLock());
    addEventListener('mousemove', e => { if (document.pointerLockElement && !this.target) { this.yaw -= e.movementX * this.sens; this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * this.sens, -.2, 1.2); } });
  }
  update(dt, pl, fx) {
    if (this.cine) { this.cam.position.copy(this.cine.pos); this.cam.lookAt(this.cine.look); return; } // boss intro cinematic
    if (this.target) { // soft lock: ease yaw toward the line player->target
      const d = V.subVectors(this.target.pos, pl.pos), want = Math.atan2(d.x, d.z) + Math.PI;
      this.yaw += wrap(want - this.yaw) * Math.min(1, dt * 6); this.pitch += (.3 - this.pitch) * Math.min(1, dt * 4);
    }
    const f = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    const look = pl.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), p = look.clone().addScaledVector(f, this.dist);
    p.y = Math.max(p.y, heightAt(p.x, p.z) + .6); // don't clip below terrain
    if (fx.shake > 0) { p.x += (Math.random() - .5) * fx.shake * (fx.shakeMul ?? 1); p.y += (Math.random() - .5) * fx.shake * (fx.shakeMul ?? 1); fx.shake = Math.max(0, fx.shake - dt * 2); }
    this.cam.position.copy(p); this.cam.lookAt(look);
  }
  pick(enemies, pl, next) { // Q toggles lock; R cycles to next-nearest
    const c = enemies.filter(e => e.alive && e.pos.distanceTo(pl.pos) < 30).sort((a, b) => a.pos.distanceTo(pl.pos) - b.pos.distanceTo(pl.pos));
    if (!c.length) { this.target = null; return; }
    this.target = next && this.target ? c[(c.indexOf(this.target) + 1) % c.length] : c[0];
  }
}

const YAX = new THREE.Vector3(0, 1, 0), UPV = new THREE.Vector3(0, 2, 0), nxt = (a, v) => a[(a.indexOf(v) + 1) % a.length];
// Move table: wind-up -> active (hitbox live) -> recovery, each with damage and poise damage.
const RANGED = { wind: .4, act: .05, rec: .3, amt: 10, poise: 15, proj: 1 }; // bow/crossbow/staff/talisman basic shot
const MV = {
  l0: { wind: .15, act: .15, rec: .3, amt: 12, poise: 18, range: 2.6, light: 1 },
  l1: { wind: .15, act: .15, rec: .3, amt: 14, poise: 18, range: 2.6, light: 1 },
  l2: { wind: .2, act: .15, rec: .45, amt: 19, poise: 32, range: 2.8, light: 1 },
  heavy: { wind: .45, act: .15, rec: .5, amt: 30, poise: 60, range: 2.9 }
};
export class Player {
  constructor(scene) {
    this.pos = new THREE.Vector3(0, 0, 8); this.vel = new THREE.Vector3(); this.face = Math.PI; this.name = 'You'; this.isEnemy = false;
    this.hp = this.maxHp = 100; this.stam = this.maxStam = 100; this.regen = 0; this.poise = this.maxPoise = 35; this.poiseT = 0; this.res = {}; this.slow = 1;
    this.status = new Status(this); this.stats = { ...STAT0 }; this.wi = 0; this.wlvl = 0; this.inf = 0; this.fp = this.maxFp = 50; this.buff = 0; this.ward = 0; this.nearSmith = false; this.slots = [null, null, null, null, null, null]; this.slot = 0; this.absorb = 0; this.absorbT = 0; this.dr = 0; this.drT = 0; this.regenT = 0; this.regenAmt = 0; this.poiseBuffT = 0; this.sp = null; this.cp = 0; this.chg = 0; this.level = 1; this.motes = 0; this.flask = [3, 2]; this.flaskMax = [3, 2]; this.armorIdx = 2; this.spawn = new THREE.Vector3(0, 0, 8); this.lost = null; this.litBeacons = []; this.discovered = ['hollow']; this.tut = 0; this.drinkK = 0; this.armorDef = 0; this.dmgMul = 1; this.spd = 1; this.rollMul = 1; this.regenMul = 1; this.noRoll = false; this.world = null; this.ph = 0; this.relics = []; this.bossesDown = []; this.ownW = []; this.ownS = []; this.cls = null; this.keyItems = []; this.ng = 0; this.opened = []; this.mounted = false; this.gmul = 1; this.relicDmg = 1; this.relicPoise = 0;
    this.state = 'free'; this.t = 0; this.combo = 0; this.mv = null; this.hitDone = false; this.queued = false; this.gcd = 0; this.charge = 0;
    this.iframes = false; this.onGround = true; this.plunge = false; this.dir = new THREE.Vector3(); this.dead = false;
    const m = buildKnight(); this.mesh = m.group; this.body = m.body; this.arm = m.arm; this.blade = m.blade; this.shield = m.shield; this.legs = m.legs; this.cape = m.cape; this.torsoMat = m.torsoMat; scene.add(this.mesh);
  }
  spend(n) { if (this.stam <= 0) return false; this.stam -= n; this.regen = .8; return true; }
  forward() { return new THREE.Vector3(Math.sin(this.face), 0, Math.cos(this.face)); }
  syncWeaponModel() { // use a loaded GLB for the current weapon (key 'weapon:<name>'), otherwise the procedural blade
    const a = this.ctx && this.ctx.assets, key = 'weapon:' + this.def.name, sig = key + (a && a.has(key));
    if (this.wmSig !== sig) { this.wmSig = sig; if (this.wm) { this.arm.remove(this.wm); this.wm = null; } if (a && a.has(key)) { this.wm = a.instance(key).root; this.wm.position.set(0, -.6, .1); this.arm.add(this.wm); } }
    this.blade.visible = !this.wm && this.def.cat !== 'shield';
  }
  snd(k) { const s = this.ctx && this.ctx.sound; if (s) s.sfx(k); }
  startDrink(k) { // flasks: V = Crimson (HP), B = Cerulean (FP). The charge is spent only when the drink finishes; a hit or a roll cancels it.
    if (this.flask[k] <= 0) { this.ctx.ui.damage(this.pos.clone().add(UPV), 'NO FLASKS', '#ff8080'); return false; }
    this.drinkK = k; this.state = 'drink'; this.t = 0; return true;
  }
  finishDrink() {
    const k = this.drinkK; this.flask[k]--;
    if (k === 0) { const h = Math.round(this.maxHp * .45); this.hp = Math.min(this.maxHp, this.hp + h); this.ctx.ui.damage(this.pos.clone().add(UPV), '+' + h, '#7ad13a'); }
    else { this.fp = Math.min(this.maxFp, this.fp + this.maxFp * .4); this.ctx.ui.damage(this.pos.clone().add(UPV), 'FP restored', '#6aa0ff'); }
    this.ctx.particles.burst(this.pos.clone().add(UPV), k ? 0x6aa0ff : 0xff6a6a, 18, 3); this.snd('heal'); this.state = 'free';
  }
  walk(dt) { // leg / cape / body animation from ground speed
    const sp = this.onGround ? Math.hypot(this.vel.x, this.vel.z) : 0; this.ph += dt * sp * 1.7; const k = Math.min(1, sp / 4);
    this.legs[0].rotation.x = Math.sin(this.ph) * .8 * k; this.legs[1].rotation.x = -Math.sin(this.ph) * .8 * k;
    this.cape.rotation.x = .15 + k * .45; this.body.rotation.x = this.state === 'roll' ? .6 : this.state === 'back' ? -.25 : 0; this.body.position.y = Math.sin(this.ph * 2) * .03 * k + (this.mounted ? .35 : 0);
  }
  curSpell() { return SPELL_BY_ID[this.slots[this.slot]]; }
  slotLabel() { const s = this.curSpell(); return s ? `Spell ${this.slot + 1}/6: ${s.n} (${s.fp} FP)${s.charge ? ' [hold]' : ''}${this.absorb > 0 ? ' · Ward ' + Math.round(this.absorb) : ''}<br>Z slot · T cast · M memorize` : 'Spell slot empty (M)'; }
  canCast() { const s = this.curSpell(); if (!s) return false; if (this.fp < s.fp) { this.ctx.ui.damage(this.pos.clone().add(UPV), 'NOT ENOUGH FP', '#6aa0ff'); return false; } return true; }
  beginCast() { const s = this.curSpell(); this.fp -= s.fp; this.sp = s; this.snd('cast'); this.state = 'cast'; this.t = 0; this.chg = 0; } // FP is spent up front, so an interrupted cast is lost
  // Catalysts boost their school (staff -> sorceries, talisman -> incantations); anything else casts at reduced power.
  spellPower(s) { const st = this.stats[s.sch === 'sorc' ? 'int' : 'fai'], c = this.def.cat; return s.amt * (.7 + (st - 8) * .08) * ((s.sch === 'sorc' && c === 'staff') || (s.sch === 'inc' && c === 'talisman') ? 1.5 : .6); }
  castTick(dt, world, lockFace, fx) {
    const s = this.sp; lockFace(); this.cp = Math.min(1, this.t / s.cast);
    if (Math.random() < dt * 25) world.ctx.particles.burst(this.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).addScaledVector(this.forward(), .6), COLORS[s.type], 1, 1); // spell-colored gather effect
    if (this.t < s.cast) return;
    if (s.charge) { this.chg = Math.min(1, (this.t - s.cast) / 1.2); this.cp = this.chg; if (K.KeyT && this.chg < 1) return; } // hold T to charge
    castSpell(this, world, s, this.chg); this.state = 'free'; this.chg = 0;
  }
  get def() { return WEAPONS[this.wi]; }
  wdmg() { return weaponDamage(this.def, this.wlvl, INFUSIONS[this.inf], this.stats); }
  wtype() { return INFUSIONS[this.inf].type || this.def.type || 'physical'; }
  wstatus() { return INFUSIONS[this.inf].st || this.def.status || null; }
  wlabel() { const d = this.def, s = SKILLS[d.skill]; return `${d.name} +${this.wlvl} [${INFUSIONS[this.inf].n}] · ${this.wdmg()} dmg<br>C: ${s.n} (${s.fp} FP)`; }
  begin(mv) { // scale timings by weapon speed; weapons add reach / multi-hit
    const d = this.def, sp = mv.skill ? 1 : d.speed, r = { ...mv, wind: mv.wind / sp, act: mv.act / sp, rec: mv.rec / sp };
    if (!mv.skill && mv.range) r.range = mv.range * d.rng;
    if (d.multi && mv.light) { r.multi = d.multi; r.amt = mv.amt * .6; }
    this.state = 'attack'; this.t = 0; this.mv = r; this.snd('swing'); this.hitDone = false; this.queued = false;
  }
  fire(world, m, fx) { // active-frame dispatcher: self-buff, ward, projectiles, or melee arc
    const ctx = world.ctx;
    if (m.buff) { this.buff = 12; ctx.particles.burst(this.pos.clone().add(UPV), 0xffd27a, 30, 5); }
    else if (m.ward) { this.ward = m.ward; ctx.particles.burst(this.pos.clone().add(UPV), 0x9fe8ff, 25, 4); }
    else if (m.proj) {
      const hit = this.mk(m), dir = this.forward(); if (this.aim) dir.subVectors(this.aim.pos, this.pos).setY(0).normalize();
      for (let i = 0; i < m.proj; i++) { const a = m.proj > 1 ? (i / (m.proj - 1) - .5) * (m.spread || .5) * 2 : 0; ctx.projectiles.spawn(this.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).addScaledVector(dir, .8), dir.clone().applyAxisAngle(YAX, a), hit, m.big ? 22 : 30, 1.3, COLORS[hit.type], m.big); }
    } else this.swing(world, m, m.around);
    if (m.shake) fx.shake = m.shake;
  }
  mk(mv) { return { amt: mv.amt / 12 * this.wdmg() * (this.buff > 0 ? 1.3 : 1) * this.relicDmg, type: mv.type || this.wtype(), poise: mv.poise * this.def.poise, status: this.wstatus(), crit: mv.crit || 1 }; }
  riposteTarget(w) { return w.enemies.find(e => e.s === 'parried' && e.alive && e.pos.distanceTo(this.pos) < 3); }
  turn(x, z, k) { this.face += wrap(Math.atan2(x - this.pos.x, z - this.pos.z) - this.face) * Math.min(1, k); }
  stagger() { this.state = 'stagger'; this.t = 0; this.charge = 0; }
  onStagger() { this.stagger(); }
  takeDamage(d) {
    d = Math.max(1, Math.round(d * (1 - this.armorDef) * this.dmgMul)); // armor + load tier
    if (this.drT > 0) d = Math.round(d * (1 - this.dr)); // Aegis Prayer
    if (this.absorb > 0) { const a = Math.min(this.absorb, d); this.absorb -= a; d -= a; if (d <= 0) return; } // Mirror Ward
    this.hp -= d;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true; const ui = this.ctx.ui; ui.msg(true); dropMotes(this);
      setTimeout(() => { this.hp = this.maxHp; this.stam = this.maxStam; this.pos.copy(this.spawn); respawnAll(this.world); this.vel.set(0, 0, 0); this.dead = false; this.state = 'free'; this.status.reset(); ui.msg(false); }, 2500);
    }
  }
  statusHurt(n, c) { this.takeDamage(n); this.ctx.ui.damage(this.pos.clone().add(UPV), n, '#' + c.toString(16).padStart(6, '0')); }
  // An enemy strike lands: i-frames dodge it, guard blocks it, a guard raised in the first .3s parries it.
  receive(src, h, ctx) {
    if (this.dead || this.iframes) return;
    const to = V.subVectors(src.pos, this.pos).setY(0).normalize(), mid = this.pos.clone().add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(to, .6);
    if (this.state === 'guard' && to.dot(this.forward()) > .2) {
      if (this.t < (this.def.guard ? .45 : .3)) { // PARRY (shields: longer window)
        this.snd('parry'); src.set('parried'); src.poise = src.maxPoise; ctx.fx.hitstop = .15; ctx.fx.shake = .3; ctx.particles.burst(mid, 0xffe08a, 30, 7); ctx.ui.damage(this.pos.clone().add(UPV), 'PARRY', '#ffe08a'); return;
      }
      this.stam -= h.amt * 1.6 * (this.def.guard || 1); this.regen = 1.2; ctx.particles.burst(mid, 0xffd27a, 14, 5); ctx.fx.shake = .15;
      this.takeDamage(Math.round(h.amt * .15)); // chip damage
      if (this.stam <= 0) { this.stam = 0; this.stagger(); ctx.ui.damage(this.pos.clone().add(UPV), 'GUARD BROKEN', '#ff5050'); }
      return;
    }
    this.mounted = false; if (this.state === 'cast' || this.state === 'drink') { this.state = 'free'; ctx.ui.damage(this.pos.clone().add(UPV), 'INTERRUPTED', '#ff8080'); } // hits break casting
    applyHit(this, h, ctx);
  }
  swing(world, mv, around) { // arc test in front of the player (full circle for plunge)
    const ctx = world.ctx, f = this.forward(), hit = this.mk(mv);
    if (mv.rip) { if (mv.rip.s === 'parried' && mv.rip.alive) { applyHit(mv.rip, hit, ctx); if (mv.rip.alive) mv.rip.set('stagger'); } return; }
    for (const e of world.enemies) {
      if (!e.alive) continue; const d = V.subVectors(e.pos, this.pos); d.y = 0; const dist = d.length();
      if (dist < mv.range && (around || d.normalize().dot(f) > this.def.arc)) for (let n = mv.multi || 1; n--;) applyHit(e, hit, ctx);
    }
  }
  update(dt, cam, world, ui, fx) {
    this.ctx = world.ctx; this.world = world;
    if (this.mounted) { delete pressed.Mouse0; delete pressed.KeyE; delete pressed.KeyT; delete pressed.KeyC; } // no fighting from the saddle
    if (this.dead) { for (const k in pressed) delete pressed[k]; return; }
    const inp = new THREE.Vector3((K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0), 0, (K.KeyS ? 1 : 0) - (K.KeyW ? 1 : 0)), moving = inp.lengthSq() > 0;
    inp.normalize(); const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
    const wd = new THREE.Vector3(inp.x * c + inp.z * s, 0, -inp.x * s + inp.z * c);
    if (pressed.KeyQ) cam.target ? cam.target = null : cam.pick(world.enemies, this);
    if (pressed.KeyR) cam.pick(world.enemies, this, true);
    if (cam.target && !cam.target.alive) cam.pick(world.enemies, this);
    if ((pressed.Digit1 || pressed.Digit2) && this.state === 'free') { const o = this.ownW, i = o.indexOf(this.wi); if (o.length) this.wi = o[i < 0 ? 0 : (i + (pressed.Digit2 ? 1 : o.length - 1)) % o.length]; /* only weapons you own */ this.blade.scale.z = this.def.rng; this.blade.visible = this.def.cat !== 'shield'; } // prev/next weapon
    this.status.update(dt); this.gcd -= dt; this.t += dt; this.iframes = false; this.aim = cam.target;
    this.fp = Math.min(this.maxFp, this.fp + .6 * dt); this.buff -= dt; if ((this.ward -= dt) > 0) this.iframes = true; // slow FP regen until flasks exist (Phase 5)
    this.nearSmith = Math.hypot(this.pos.x - 3, this.pos.z - 5) < 4; // smith anvil: X infuse, U upgrade (free for now)
    if (this.nearSmith) { if (pressed.KeyX && this.motes >= 100) { this.motes -= 100; this.inf = (this.inf + 1) % INFUSIONS.length; } // smith: infusing costs 100 motes
      if (pressed.KeyU && this.wlvl < 10 && this.motes >= 150 * (this.wlvl + 1)) { this.motes -= 150 * (this.wlvl + 1); this.wlvl++; } } // upgrading costs 150 x next level (this closes the nearSmith block) }
    if (pressed.KeyZ) this.slot = (this.slot + 1) % this.slots.length;
    this.absorbT -= dt; if (this.absorbT <= 0) this.absorb = 0; this.drT -= dt; this.poiseBuffT -= dt; this.maxPoise = (this.poiseBuffT > 0 ? 75 : 35) + (this.armor ? this.armor.poise : 0) + this.relicPoise; if ((this.regenT -= dt) > 0) this.hp = Math.min(this.maxHp, this.hp + this.regenAmt * dt);
    if ((this.poiseT -= dt) <= 0) this.poise = Math.min(this.maxPoise, this.poise + 10 * dt);
    let sprinting = false, vx = 0, vz = 0;
    const lockFace = () => { if (cam.target) this.turn(cam.target.pos.x, cam.target.pos.z, dt * 12); else if (moving) this.face += wrap(Math.atan2(wd.x, wd.z) - this.face) * Math.min(1, dt * 14); };

    if (this.state === 'free' || this.state === 'guard') {
      const g = this.state === 'guard', sp = !g && !this.mounted && K.ShiftLeft && moving && this.stam > 0 && this.onGround;
      if (sp) { sprinting = true; this.stam -= 12 * dt; this.regen = .8; }
      const speed = (this.mounted ? 10 : g ? 2 : sp ? 7 : cam.target ? 3.6 : 4.2) * this.slow * this.spd;
      if (moving) { vx = wd.x * speed; vz = wd.z * speed; } lockFace();
      if (g && !K.Mouse2) { this.state = 'free'; this.gcd = .3; }
      if (pressed.Space && this.onGround && !(this.noRoll && moving) && this.spend(moving ? 20 : 12)) {
        this.state = moving ? 'roll' : 'back'; this.t = 0; this.snd('roll'); this.dir.copy(moving ? wd : this.forward().negate()); if (moving) this.face = Math.atan2(wd.x, wd.z);
      } else if (pressed.KeyF && this.onGround && this.spend(15)) { this.vel.y = this.mounted ? 11 : 8; this.onGround = false; }
      else if (pressed.KeyC && this.onGround && this.fp >= SKILLS[this.def.skill].fp && this.spend(10)) { const s = SKILLS[this.def.skill]; this.fp -= s.fp; this.begin({ ...s.mv, skill: 1 }); } // weapon skill
      else if (pressed.Mouse0) {
        const r = this.riposteTarget(world);
        if (r && this.spend(10)) { this.turn(r.pos.x, r.pos.z, 1); this.begin({ wind: .2, act: .15, rec: .5, amt: 50, poise: 0, range: 3, crit: 1.9, rip: r }); } // RIPOSTE on a parried enemy
        else if (!g && !this.onGround && this.vel.y < 2 && this.spend(15)) { this.plunge = true; this.vel.y = -22; }
        else if (!g && this.onGround && this.spend(15)) { this.combo = 0; this.begin(this.def.ranged ? RANGED : MV.l0); }
      } else if ((pressed.KeyV || pressed.KeyB) && !g && this.onGround && this.startDrink(pressed.KeyB ? 1 : 0)) {
      } else if (pressed.KeyT && !g && this.onGround && this.canCast()) { this.beginCast(); }
      else if (pressed.KeyE && !g && this.onGround && this.spend(28)) { this.state = 'charge'; this.t = 0; }
      else if (!g && K.Mouse2 && this.onGround && this.gcd <= 0) { this.state = 'guard'; this.t = 0; } // t<.3 = parry window
    } else if (this.state === 'charge') { // hold E to charge heavy, release to swing
      this.charge = Math.min(1, this.t); lockFace();
      if (!K.KeyE) this.begin({ ...MV.heavy, wind: .1, amt: MV.heavy.amt * (1 + this.charge * .9), poise: MV.heavy.poise * (1 + this.charge) });
    } else if (this.state === 'drink') { if (moving) { vx = wd.x * 1.6; vz = wd.z * 1.6; } if (pressed.Space) this.state = 'free'; else if (this.t >= 1.1) this.finishDrink();
    } else if (this.state === 'cast') { this.castTick(dt, world, lockFace, fx);
    } else if (this.state === 'roll' || this.state === 'back') {
      const roll = this.state === 'roll', dur = roll ? .55 : .38;
      this.iframes = this.t > .05 && this.t < (roll ? .35 : .22) * Math.min(1, this.rollMul + .1); // heavier load = shorter i-frames
      const sp = (roll ? 9 : 6) * (1 - this.t / dur * .5) * this.slow * this.rollMul; vx = this.dir.x * sp; vz = this.dir.z * sp;
      if (this.t > dur) this.state = 'free';
    } else if (this.state === 'attack') {
      const m = this.mv, t = this.t;
      if (m.rip) this.turn(m.rip.pos.x, m.rip.pos.z, dt * 10); else if (cam.target) this.turn(cam.target.pos.x, cam.target.pos.z, dt * 8);
      const adv = t < m.wind + m.act ? (m.dash || 1.5) : 0; vx = Math.sin(this.face) * adv; vz = Math.cos(this.face) * adv;
      if (t >= m.wind && t < m.wind + m.act && !this.hitDone) { this.hitDone = true; this.fire(world, m, fx); }
      if (pressed.Mouse0 && m.light) this.queued = true;
      if (t > m.wind + m.act + m.rec) {
        if (this.queued && m.light && this.combo < 2 && this.spend(15)) { this.combo++; this.begin(MV['l' + this.combo]); }
        else { this.state = 'free'; this.combo = 0; }
      }
    } else if (this.state === 'stagger' && this.t > .6) this.state = 'free';

    // animation
    const a = this.state === 'attack' ? THREE.MathUtils.clamp((this.t - (this.mv.wind - .05)) / .25, 0, 1) : 0;
    this.arm.rotation.x = this.state === 'attack' ? -1.3 + a * 2.2 : this.state === 'charge' ? -1.6 : this.state === 'drink' ? -2.5 : -.3; this.arm.rotation.z = this.combo % 2 ? -.6 : 0;
    this.shield.visible = this.state === 'guard'; this.mesh.rotation.z = this.state === 'stagger' ? .25 : 0;
    this.blade.material.emissive.setHex(this.state === 'charge' ? 0x884400 : 0);

    const k = Math.min(1, dt * (this.onGround ? 14 : 3)); this.vel.x += (vx - this.vel.x) * k; this.vel.z += (vz - this.vel.z) * k; this.vel.y -= GRAV * this.gmul * dt; // gmul: the Astronomer bends gravity
    const gx = heightAt(this.pos.x + .5, this.pos.z) - heightAt(this.pos.x - .5, this.pos.z), gz = heightAt(this.pos.x, this.pos.z + .5) - heightAt(this.pos.x, this.pos.z - .5);
    if (this.onGround && Math.hypot(gx, gz) > .85) { this.vel.x -= gx * 60 * dt; this.vel.z -= gz * 60 * dt; } // too steep: slide
    this.pos.addScaledVector(this.vel, dt);
    for (const o of world.colliders) { const dx = this.pos.x - o.x, dz = this.pos.z - o.z, d = Math.hypot(dx, dz), m = o.r + .4; if (d < m && d > 1e-4) { this.pos.x = o.x + dx / d * m; this.pos.z = o.z + dz / d * m; } }
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -BOUND, BOUND); this.pos.z = THREE.MathUtils.clamp(this.pos.z, -BOUND, BOUND);
    const gh = heightAt(this.pos.x, this.pos.z);
    if (this.pos.y <= gh) {
      if (!this.onGround) {
        if (this.plunge) { this.plunge = false; fx.shake = .5; fx.hitstop = .08; this.swing(world, { amt: 40, poise: 70, range: 3.5 }, true); this.ctx.particles.burst(this.pos.clone(), 0xccbb99, 24, 6); }
        else if (this.vel.y < -14) { const d = Math.round((-this.vel.y - 14) * 6); this.takeDamage(d); ui.damage(this.pos.clone().add(UPV), d, '#ff8080'); fx.shake = .4; }
      }
      this.pos.y = gh; this.vel.y = 0; this.onGround = true;
    } else if (this.pos.y > gh + .05) this.onGround = false;
    if (this.pos.y < -40) this.takeDamage(999);
    if (!sprinting && this.regen <= 0 && ['free', 'roll', 'back'].includes(this.state)) this.stam = Math.min(this.maxStam, this.stam + 28 * dt * this.slow * this.regenMul);
    this.regen -= dt; this.syncWeaponModel(); this.walk(dt); this.mesh.position.copy(this.pos); this.mesh.rotation.y = this.face;
    for (const k in pressed) delete pressed[k];
  }
}
