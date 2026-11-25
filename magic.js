// Magic: 27 spells (13 sorceries scale on Int, 14 incantations on Faith), data-driven by `kind`. Also delayed strikes + summons.
import * as THREE from 'three';
import { applyHit, COLORS } from './combat.js';
import { heightAt } from './world.js';
const UP = new THREE.Vector3(0, 1.4, 0), YAX = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3();
const S = (id, n, sch, fp, cast, kind, type, amt, x = {}) => ({ id, n, sch, fp, cast, kind, type, amt, ...x });
export const SPELLS = [
  S('dart', 'Arcane Dart', 'sorc', 4, .3, 'proj', 'magic', 14, { poise: 15 }), S('lance', 'Prism Lance', 'sorc', 7, .5, 'proj', 'magic', 26, { speed: 45, poise: 30 }),
  S('orb', 'Ember Orb', 'sorc', 9, .6, 'proj', 'fire', 30, { big: 1, speed: 20, poise: 40 }), S('shards', 'Shatterfrost Shards', 'sorc', 8, .5, 'proj', 'magic', 10, { n: 3, spread: .35, st: ['frost', 40] }),
  S('arc', 'Stormcall Bolt', 'sorc', 7, .4, 'proj', 'lightning', 22, { speed: 55 }), S('soulspear', 'Soul Spear', 'sorc', 15, .6, 'proj', 'magic', 38, { speed: 50, charge: 1.2, poise: 60 }), // charge: hold T
  S('beam', 'Sunwire Beam', 'sorc', 12, .7, 'beam', 'magic', 34, { range: 20, width: 1.3, poise: 50 }), S('pull', 'Void Pull', 'sorc', 10, .5, 'pull', 'magic', 12, { radius: 12 }),
  S('nova', 'Nova Burst', 'sorc', 14, .6, 'nova', 'magic', 32, { radius: 5.5, poise: 70 }), S('meteor', 'Meteor Rain', 'sorc', 20, .9, 'strike', 'fire', 40, { n: 4, radius: 3, delay: .8, spread: 5, range: 12, charge: .6 }),
  S('crush', 'Crushing Weight', 'sorc', 16, .8, 'strike', 'magic', 45, { n: 1, radius: 4.5, delay: .6, poise: 120 }), S('ward', 'Mirror Ward', 'sorc', 12, .4, 'ward', 'magic', 45, { dur: 20 }),
  S('blink', 'Phase Step', 'sorc', 8, .15, 'blink', 'magic', 0, { dist: 9 }),
  S('mend', 'Mend', 'inc', 12, .8, 'heal', 'holy', 30), S('mend2', 'Greater Mend', 'inc', 22, 1.2, 'heal', 'holy', 60), S('renew', 'Renewal', 'inc', 14, .6, 'regen', 'holy', 4, { dur: 10 }),
  S('aegis', 'Aegis Prayer', 'inc', 12, .5, 'guardbuff', 'holy', .3, { dur: 25 }), S('fury', 'Oath of Fury', 'inc', 10, .5, 'buff', 'holy', 0, { dur: 30 }),
  S('stoneheart', 'Stoneheart Prayer', 'inc', 10, .5, 'poisebuff', 'holy', 40, { dur: 25 }), S('purify', 'Purifying Light', 'inc', 10, .5, 'purify', 'holy', 15),
  S('smite', 'Smiting Bolt', 'inc', 10, .5, 'strike', 'lightning', 36, { n: 1, radius: 2.2, delay: .5, poise: 60 }), S('rain', "Heaven's Rain", 'inc', 18, .8, 'strike', 'lightning', 24, { n: 4, radius: 2, delay: .5, spread: 6, range: 10 }),
  S('wave', 'Radiant Wave', 'inc', 14, .6, 'nova', 'holy', 30, { radius: 7, poise: 80 }), S('flame', 'Pyre Burst', 'inc', 12, .5, 'nova', 'fire', 28, { radius: 4.5, poise: 50 }),
  S('judge', 'Judgement Beam', 'inc', 16, .8, 'beam', 'holy', 40, { range: 18, width: 1.6, poise: 60 }),
  S('familiar', 'Lantern Familiar', 'inc', 18, .9, 'summon', 'holy', 16, { dur: 15, ranged: 1 }), S('hound', 'Spectral Hound', 'inc', 16, .9, 'summon', 'magic', 20, { dur: 15 })
];
export const SPELL_BY_ID = Object.fromEntries(SPELLS.map(s => [s.id, s]));
const ring = (ctx, c, r, col, n = 24) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283; ctx.particles.burst(new THREE.Vector3(c.x + Math.cos(a) * r, c.y + .3, c.z + Math.sin(a) * r), col, 1, 1); } };
const near = (w, c, r, fn) => { for (const e of w.enemies) if (e.alive && Math.hypot(e.pos.x - c.x, e.pos.z - c.z) < r) fn(e); };

export function castSpell(p, w, s, chg) {
  const ctx = w.ctx, pw = p.spellPower(s) * (1 + chg * (s.charge || 0)), col = COLORS[s.type];
  const hit = { amt: pw, type: s.type, poise: s.poise || 20, status: s.st || null, crit: 1 };
  const fwd = p.forward(); if (p.aim) fwd.subVectors(p.aim.pos, p.pos).setY(0).normalize();
  const hand = p.pos.clone().add(UP), say = (t, c) => ctx.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 2, 0)), t, c);
  ctx.particles.burst(hand, col, 12, 4);
  switch (s.kind) {
    case 'proj': { const n = s.n || 1; for (let i = 0; i < n; i++) { const a = n > 1 ? (i / (n - 1) - .5) * s.spread * 2 : 0; ctx.projectiles.spawn(hand.clone().addScaledVector(fwd, .8), fwd.clone().applyAxisAngle(YAX, a), hit, s.speed || 32, 1.6, col, s.big); } break; }
    case 'beam': // instant line hit; particles draw the beam
      for (let d = 0; d < s.range; d += 1) ctx.particles.burst(hand.clone().addScaledVector(fwd, d), col, 2, .6);
      for (const e of w.enemies) { if (!e.alive) continue; V.subVectors(e.pos, p.pos).setY(0); const along = V.dot(fwd), perp = Math.abs(V.x * fwd.z - V.z * fwd.x); if (along > 0 && along < s.range && perp < s.width + .5) applyHit(e, hit, ctx); }
      ctx.fx.shake = .2; break;
    case 'pull': ring(ctx, p.pos, s.radius, col); near(w, p.pos, s.radius, e => { V.subVectors(p.pos, e.pos).setY(0); const d = V.length(); if (d > 2) e.pos.addScaledVector(V.normalize(), Math.min(7, d - 2)); applyHit(e, hit, ctx); }); break; // gravity yank
    case 'nova': ring(ctx, p.pos, s.radius, col, 36); ring(ctx, p.pos, s.radius * .5, col); near(w, p.pos, s.radius, e => applyHit(e, hit, ctx)); ctx.fx.shake = .3; break;
    case 'strike': { // telegraphed delayed hits (lightning columns, meteors, gravity weights)
      const c = p.aim ? p.aim.pos.clone() : p.pos.clone().addScaledVector(fwd, s.range || 6);
      for (let i = 0; i < (s.n || 1); i++) {
        const t = c.clone(); if ((s.n || 1) > 1) { t.x += (Math.random() - .5) * s.spread * 2; t.z += (Math.random() - .5) * s.spread * 2; } ring(ctx, t, s.radius, col, 14);
        w.delayed.push({ t: s.delay + i * .15, fn: () => { for (let y = 0; y < 10; y += .8) ctx.particles.burst(new THREE.Vector3(t.x, t.y + y, t.z), col, 2, 1.2); ring(ctx, t, s.radius, col, 18); near(w, t, s.radius, e => applyHit(e, hit, ctx)); ctx.fx.shake = Math.max(ctx.fx.shake, .25); } });
      } break;
    }
    case 'ward': p.absorb = pw; p.absorbT = s.dur; say('WARD ' + Math.round(pw), '#9a7bff'); break;
    case 'blink': p.pos.addScaledVector(fwd, s.dist); p.ward = .3; ctx.particles.burst(p.pos.clone().add(UP), col, 20, 5); break;
    case 'heal': p.hp = Math.min(p.maxHp, p.hp + pw); say('+' + Math.round(pw), '#7ad13a'); break;
    case 'regen': p.regenT = s.dur; p.regenAmt = pw; say('RENEWAL', '#7ad13a'); break;
    case 'guardbuff': p.dr = s.amt; p.drT = s.dur; say('AEGIS', '#ffe9a0'); break;
    case 'buff': p.buff = s.dur; say('FURY', '#ffd27a'); break;
    case 'poisebuff': p.poiseBuffT = s.dur; say('STONEHEART', '#ffe9a0'); break;
    case 'purify': p.status.reset(); p.hp = Math.min(p.maxHp, p.hp + pw); say('PURGED', '#ffe9a0'); ring(ctx, p.pos, 2, col); break;
    case 'summon': {
      if (w.summons.length >= 2) { const o = w.summons.shift(); w.scene.remove(o.mesh); }
      const m = new THREE.Mesh(s.ranged ? new THREE.SphereGeometry(.35, 10, 8) : new THREE.BoxGeometry(.6, .5, 1.1), new THREE.MeshBasicMaterial({ color: col }));
      m.position.copy(p.pos).add(UP); w.scene.add(m); w.summons.push({ s, mesh: m, t: s.dur, cd: .5, a: Math.random() * 6, hit }); break;
    }
  }
}
// Per-frame: delayed strikes and summon AI (familiar orbits + shoots, hound chases + bites).
export function updateMagic(dt, w) {
  for (let i = w.delayed.length; i--;) if ((w.delayed[i].t -= dt) <= 0) w.delayed.splice(i, 1)[0].fn();
  for (let i = w.summons.length; i--;) {
    const o = w.summons[i], p = w.player; o.t -= dt; o.cd -= dt;
    if (o.t <= 0) { w.scene.remove(o.mesh); w.summons.splice(i, 1); continue; }
    let tgt = null, bd = 25; for (const e of w.enemies) { const d = e.alive ? e.pos.distanceTo(o.mesh.position) : 99; if (d < bd) { bd = d; tgt = e; } }
    if (o.s.ranged) {
      o.a += dt * 2; o.mesh.position.set(p.pos.x + Math.cos(o.a) * 1.6, p.pos.y + 2 + Math.sin(o.a * 2) * .2, p.pos.z + Math.sin(o.a) * 1.6);
      if (tgt && o.cd <= 0) { o.cd = 1.3; V.set(tgt.pos.x, tgt.pos.y + 1.2, tgt.pos.z).sub(o.mesh.position).normalize(); w.ctx.projectiles.spawn(o.mesh.position, V, o.hit, 26, 1.5, COLORS[o.s.type]); }
    } else {
      const to = tgt ? tgt.pos : p.pos; V.subVectors(to, o.mesh.position).setY(0); const d = V.length();
      if (d > (tgt ? 1.8 : 3)) o.mesh.position.addScaledVector(V.normalize(), 7 * dt); else if (tgt && o.cd <= 0) { o.cd = 1; applyHit(tgt, o.hit, w.ctx); }
      o.mesh.position.y = heightAt(o.mesh.position.x, o.mesh.position.z) + .4;
    }
  }
}
