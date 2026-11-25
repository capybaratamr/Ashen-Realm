// Combat core: damage types + resists, poise/stagger, status buildup (bleed/poison/frost), pooled particles, applyHit().
import * as THREE from 'three';
export const TYPES = ['physical', 'fire', 'lightning', 'holy', 'magic'];
export const STATUSES = ['bleed', 'poison', 'frost'];
export const COLORS = { physical: 0xdddddd, fire: 0xff7a2a, lightning: 0xfff04a, holy: 0xffe9a0, magic: 0x9a7bff, bleed: 0xb3202a, poison: 0x7ad13a, frost: 0x9fe8ff };
const UP = new THREE.Vector3(0, 1.3, 0);

// Meters fill from hits; at threshold they proc. Bleed = burst damage, poison = damage over time, frost = slow + extra damage taken.
export class Status {
  constructor(o, th = {}) { this.o = o; this.th = { bleed: 100, poison: 100, frost: 100, ...th }; this.reset(); }
  reset() { this.m = { bleed: 0, poison: 0, frost: 0 }; this.poison = 0; this.frost = 0; this.tk = 0; this.decay = 0; if (this.o) this.o.slow = 1; }
  add(s, a) {
    if (this[s] > 0) return; this.m[s] += a; this.decay = 1.5;
    if (this.m[s] >= this.th[s]) {
      this.m[s] = 0; const o = this.o;
      if (s === 'bleed') o.statusHurt(Math.round(o.maxHp * .18), COLORS.bleed); else this[s] = s === 'poison' ? 8 : 6;
      if (o.ctx) o.ctx.particles.burst(o.pos.clone().add(UP), COLORS[s], 20, 3);
    }
  }
  update(dt) {
    if ((this.decay -= dt) <= 0) for (const k in this.m) this.m[k] = Math.max(0, this.m[k] - 8 * dt);
    if (this.poison > 0) { this.poison -= dt; if ((this.tk += dt) >= 1) { this.tk = 0; this.o.statusHurt(Math.max(1, Math.round(this.o.maxHp * .02)), COLORS.poison); } }
    if (this.frost > 0) this.frost -= dt;
    this.o.slow = this.frost > 0 ? .6 : 1;
  }
}

// Resolve one hit {amt,type,poise,status:[name,amount],crit} against any target with hp/poise/res/status.
export function applyHit(t, h, ctx) {
  const res = (t.res && t.res[h.type]) || 0;
  const d = Math.max(1, Math.round(h.amt * (1 - res) * (t.status && t.status.frost > 0 ? 1.2 : 1) * (h.crit || 1)));
  t.takeDamage(d);
  if (h.poise) { t.poise -= h.poise; t.poiseT = 4; if (t.poise <= 0) { t.poise = t.maxPoise; t.onStagger && t.onStagger(); } } // poise break -> stagger
  if (h.status && t.status) t.status.add(h.status[0], h.status[1]);
  const p = t.pos.clone().add(UP), col = h.type === 'physical' ? COLORS.bleed : COLORS[h.type];
  ctx.particles.burst(p, col, 14, 4);
  ctx.ui.damage(p.clone().setY(p.y + .8), d, '#' + (h.crit > 1 ? 'ffd24a' : COLORS[h.type].toString(16).padStart(6, '0')));
  ctx.fx.shake = Math.max(ctx.fx.shake, t.isEnemy ? .12 : .35); if (t.isEnemy) ctx.fx.hitstop = h.crit > 1 ? .12 : .06;
  return d;
}

// Fixed-size ring buffer of particles (no allocation per burst).
export class Particles {
  constructor(scene, n = 400) {
    this.n = n; this.i = 0; this.pos = new Float32Array(n * 3).fill(-999); this.col = new Float32Array(n * 3); this.base = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .2, vertexColors: true, transparent: true, depthWrite: false })); this.pts.frustumCulled = false; scene.add(this.pts);
  }
  burst(p, hex, c = 12, sp = 4) {
    const col = new THREE.Color(hex);
    for (let k = 0; k < c; k++) {
      const i = this.i = (this.i + 1) % this.n, j = i * 3;
      this.pos[j] = p.x; this.pos[j + 1] = p.y; this.pos[j + 2] = p.z;
      this.vel[j] = (Math.random() - .5) * sp; this.vel[j + 1] = Math.random() * sp * .8; this.vel[j + 2] = (Math.random() - .5) * sp;
      this.base[j] = col.r; this.base[j + 1] = col.g; this.base[j + 2] = col.b; this.life[i] = this.max[i] = .4 + Math.random() * .4;
    }
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      const j = i * 3; if (this.life[i] <= 0) continue;
      if ((this.life[i] -= dt) <= 0) { this.pos[j + 1] = -999; continue; }
      this.vel[j + 1] -= 9 * dt; this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = this.life[i] / this.max[i]; this.col[j] = this.base[j] * f; this.col[j + 1] = this.base[j + 1] * f; this.col[j + 2] = this.base[j + 2] * f;
    }
    this.pts.geometry.attributes.position.needsUpdate = this.pts.geometry.attributes.color.needsUpdate = true;
  }
}

// Pooled projectiles (arrows, bolts, spell shots): fixed meshes recycled via life<=0.
export class Projectiles {
  constructor(scene, n = 24) {
    this.list = []; const g = new THREE.SphereGeometry(.18, 8, 6);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff })); m.visible = false; scene.add(m); this.list.push({ m, life: 0, vel: new THREE.Vector3(), hit: null }); }
  }
  spawn(p, dir, hit, speed, life, color, big) {
    const o = this.list.find(o => o.life <= 0); if (!o) return;
    o.life = life; o.m.position.copy(p); o.vel.copy(dir).multiplyScalar(speed); o.hit = hit; o.m.material.color.setHex(color); o.m.scale.setScalar(big ? 2.2 : 1); o.m.visible = true;
  }
  update(dt, w) {
    for (const o of this.list) {
      if (o.life <= 0) continue; o.life -= dt; o.m.position.addScaledVector(o.vel, dt);
      if (Math.random() < .5) w.ctx.particles.burst(o.m.position, COLORS[o.hit.type], 1, .5);
      for (const e of w.enemies) if (e.alive && Math.hypot(e.pos.x - o.m.position.x, e.pos.z - o.m.position.z) < .9 && Math.abs(e.pos.y + 1.2 - o.m.position.y) < 1.6) { applyHit(e, o.hit, w.ctx); o.life = 0; break; }
      if (o.life <= 0) o.m.visible = false;
    }
  }
}
