// Melee enemies. State machine: idle/chase -> windup (telegraph) -> strike -> recover; also stagger and parried (riposte window).
import * as THREE from 'three';
import { heightAt } from './world.js';
import { Status } from './combat.js';
import { buildEnemy } from './models.js';
const V = new THREE.Vector3(), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const KINDS = {
  'Husk Soldier': { col: 0x8a5a3c, hp: 90, type: 'physical', amt: 14, poise: 40, status: ['bleed', 40], res: {} },
  'Ember Wretch': { col: 0xc4541c, hp: 70, type: 'fire', amt: 12, poise: 25, status: null, res: { fire: .6, magic: -.2 } },
  'Marsh Hag': { flee: 1, col: 0x4f7a3a, hp: 80, type: 'physical', amt: 10, poise: 30, status: ['poison', 45], res: { holy: -.3 } },
  'Frost Shade': { flee: 1, col: 0x8fc4e0, hp: 75, type: 'magic', amt: 12, poise: 30, status: ['frost', 45], res: { fire: -.4, magic: .5 } }
};
export class Enemy {
  constructor(scene, name, x, z) {
    const k = this.k = KINDS[name]; this.name = name; this.isEnemy = true; this.res = k.res;
    this.maxHp = this.hp = k.hp; this.maxPoise = this.poise = k.poise; this.poiseT = 0; this.slow = 1; this.status = new Status(this);
    this.home = new THREE.Vector3(x, heightAt(x, z), z); this.s = 'idle'; this.t = 0; this.cd = 1; this.flash = 0; this.dead = 0; this.speed = 3.2; this.aggro = 16;
    this.mat = new THREE.MeshStandardMaterial({ color: k.col }); const m = buildEnemy(name, this.mat); this.mesh = m.group; this.arm = m.arm; this.legs = m.legs; this.ph = 0; this.mesh.position.copy(this.home); scene.add(this.mesh); this.pos = this.mesh.position;
  }
  get alive() { return this.hp > 0; }
  set(s) { this.s = s; this.t = 0; }
  onStagger() { if (this.alive) this.set('stagger'); }
  takeDamage(d) { this.hp -= d; this.flash = .12; if (this.hp <= 0) { this.dead = 1e9; this.mesh.visible = false; if (this.pw) { const r = Math.round(this.maxHp * .8); this.pw.motes += r; this.ctx.ui.damage(this.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), '+' + r + ' motes', '#ffd27a'); } } } // stays dead until the player rests at a beacon
  statusHurt(n, c) { if (!this.alive) return; this.takeDamage(n); this.ctx.ui.damage(this.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), n, '#' + c.toString(16).padStart(6, '0')); }
  update(dt, w) {
    this.ctx = w.ctx; const p = this.pw = w.player;
    if (this.flash > 0) { this.flash -= dt; this.mat.emissive.setHex(0xffffff); } else this.mat.emissive.setHex(this.s === 'windup' ? 0x661100 : 0);
    if (!this.alive) { // respawn after a delay
      if ((this.dead -= dt) <= 0) { this.hp = this.maxHp; this.poise = this.maxPoise; this.mesh.visible = true; this.pos.copy(this.home); this.status.reset(); this.set('idle'); }
      return;
    }
    this.status.update(dt); dt *= this.slow; // frost slows the whole AI
    if ((this.poiseT -= dt) <= 0) this.poise = Math.min(this.maxPoise, this.poise + 12 * dt);
    this.cd -= dt; this.t += dt;
    const d = V.subVectors(p.pos, this.pos); d.y = 0; const dist = d.length();
    const face = () => { this.mesh.rotation.y += wrap(Math.atan2(d.x, d.z) - this.mesh.rotation.y) * Math.min(1, dt * 8); };
    switch (this.s) {
      case 'idle': case 'chase':
        if (p.dead || dist > this.aggro) { // idle: patrol around home
          this.s = 'idle'; if (!this.pt) this.pt = this.home.clone(); if (this.t % 5 < dt) this.pt.set(this.home.x + (Math.random() - .5) * 12, 0, this.home.z + (Math.random() - .5) * 12);
          V.subVectors(this.pt, this.pos).setY(0); if (V.length() > 1) { this.mesh.rotation.y = Math.atan2(V.x, V.z); this.pos.addScaledVector(V.normalize(), 1.2 * dt); } break;
        }
        if (this.k.flee && this.hp < this.maxHp * .25) { d.negate().normalize(); this.mesh.rotation.y = Math.atan2(d.x, d.z); this.pos.addScaledVector(d, this.speed * 1.1 * dt); break; } // wounded enemies flee
        this.s = 'chase'; face();
        if (dist > 2.3) { d.normalize(); this.pos.addScaledVector(d, this.speed * dt); } else if (this.cd <= 0) this.set('windup');
        break;
      case 'windup': face(); if (this.t > .7) { this.set('strike'); if (dist < 3.2) p.receive(this, { amt: this.k.amt, type: this.k.type, poise: 25, status: this.k.status }, w.ctx); } break; // .7s telegraph
      case 'strike': if (this.t > .15) this.set('recover'); break;
      case 'recover': if (this.t > .7) { this.cd = 1.2; this.set('chase'); } break;
      case 'stagger': if (this.t > 1.2) this.set('chase'); break;
      case 'parried': if (this.t > 2.5) this.set('chase'); break; // riposte window
    }
    this.pos.y = heightAt(this.pos.x, this.pos.z);
    this.ph += dt * (this.s === 'chase' ? 9 : 0); this.legs[0].rotation.x = Math.sin(this.ph) * .7; this.legs[1].rotation.x = -Math.sin(this.ph) * .7; // walk cycle
    this.arm.rotation.x = this.s === 'windup' ? -2 : this.s === 'strike' ? .6 : -.3;
  }
}
