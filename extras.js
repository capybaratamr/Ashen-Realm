// Finishes Phase 6: weather, chests + hidden illusory walls, a lever-operated gate, a mount (Y), and the full map (N).
import * as THREE from 'three';
import { REGIONS, regionAt } from './regions.js';
import { heightAt } from './world.js';
const UP = new THREE.Vector3(0, 2, 0);
export class Extras {
  constructor(p, w, ui, prog) {
    this.p = p; this.w = w; this.ui = ui; this.prog = prog; this.things = []; this.near = null; this.mapOpen = false; const sc = w.scene; p.opened = p.opened || [];
    const n = 500; this.wp = new Float32Array(n * 3); for (let i = 0; i < n; i++) { this.wp[i * 3] = p.pos.x + (Math.random() - .5) * 50; this.wp[i * 3 + 1] = p.pos.y + Math.random() * 20; this.wp[i * 3 + 2] = p.pos.z + (Math.random() - .5) * 50; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.wp, 3));
    this.wmat = new THREE.PointsMaterial({ size: .1, transparent: true, opacity: .7, depthWrite: false }); this.wpts = new THREE.Points(g, this.wmat); this.wpts.frustumCulled = false; sc.add(this.wpts);
    const box = this.box = (a, b, c, col, x, y, z, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), new THREE.MeshStandardMaterial({ color: col, ...o })); m.position.set(x, y, z); sc.add(m); return m; };
    REGIONS.forEach((R, i) => { // per region: one open chest, plus a hidden chest inside a stone ring whose 4th block is an illusory wall (hit it to dissolve it)
      const a = i * 1.7 + .5, x = R.cx + Math.cos(a) * 24, z = R.cz + Math.sin(a) * 24, hx = R.cx + Math.cos(a + 2.4) * 30, hz = R.cz + Math.sin(a + 2.4) * 30, hy = heightAt(hx, hz), id = R.id + '-w';
      this.chest(R.id + '-a', x, z, 120 + i * 40); this.chest(R.id + '-h', hx, hz, 300 + i * 80);
      [[0, 1], [0, -1], [-1, 0]].forEach(([dx, dz]) => { box(2.4, 3, 2.4, 0x6a6a74, hx + dx * 2.2, hy + 1.5, hz + dz * 2.2); w.colliders.push({ x: hx + dx * 2.2, z: hz + dz * 2.2, r: 1.4 }); });
      if (!p.opened.includes(id)) { const col = { x: hx + 2.2, z: hz, r: 1.4 }; w.colliders.push(col); this.things.push({ k: 'wall', id, x: hx + 2.2, z: hz, col, mesh: box(2.4, 3, 2.4, 0x8a8a96, hx + 2.2, hy + 1.5, hz, { transparent: true, opacity: .6 }) }); }
    });
    const gy = this.gy = heightAt(15, 48); this.gate = { open: p.opened.includes('gate'), mesh: box(18, 5, 1.2, 0x555a66, 15, gy + 2.5, 48), cols: [] }; this.gate.mesh.rotation.y = .316;
    for (let k = -3; k <= 3; k++) { const c = { x: 15 + .95 * k * 2.4, z: 48 - .31 * k * 2.4, r: 1.4 }; this.gate.cols.push(c); if (!this.gate.open) w.colliders.push(c); }
    if (this.gate.open) this.gate.mesh.position.y = gy - 3;
    this.things.push({ k: 'lever', x: 24, z: 56, mesh: box(.4, 1.6, .4, 0xaa7a3a, 24, heightAt(24, 56) + .8, 56) });
    const mm = new THREE.MeshStandardMaterial({ color: 0x5a4636 }), mt = this.mount = new THREE.Group(); this.mlegs = [];
    const part = (a, b, c, x, y, z, par = mt) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mm); m.position.set(x, y, z); par.add(m); };
    part(.8, .8, 1.8, 0, 1, 0); part(.35, .8, .35, 0, 1.5, 1); part(.35, .4, .7, 0, 1.9, 1.4);
    [[-.3, .8], [.3, .8], [-.3, -.8], [.3, -.8]].forEach(([x, z]) => { const l = new THREE.Group(); l.position.set(x, .7, z); part(.2, .7, .2, 0, -.35, 0, l); mt.add(l); this.mlegs.push(l); });
    mt.visible = false; p.mesh.add(mt);
    const css = 'position:fixed;font-family:Georgia,serif;color:#e8dcc0;z-index:7;';
    this.hint = document.createElement('div'); this.hint.style.cssText = css + 'left:50%;bottom:240px;transform:translateX(-50%);font-size:20px;text-shadow:0 0 6px #000;display:none;pointer-events:none';
    this.mapc = document.createElement('canvas'); this.mapc.width = this.mapc.height = 560; this.mapc.style.cssText = css + 'left:50%;top:50%;transform:translate(-50%,-50%);border:1px solid #fff4;display:none;z-index:9'; document.body.append(this.hint, this.mapc);
    addEventListener('keydown', e => {
      if (e.code === 'KeyY' && p.state === 'free' && !ui.menu && !p.dead && !w.bossActive) p.mounted = !p.mounted;
      else if (e.code === 'KeyN') { if (this.mapOpen) this.map(false); else if (!ui.menu) this.map(true); }
      else if (e.code === 'KeyG' && !ui.menu && !prog.near && this.near) this.use(this.near);
    });
  }
  chest(id, x, z, amt) { const y = heightAt(x, z), t = { k: 'chest', id, x, z, amt, open: this.p.opened.includes(id) }; this.box(1.2, .7, .8, 0x6a4a2a, x, y + .35, z); t.lid = this.box(1.2, .25, .8, 0xc8a24a, x, y + .82, z); if (t.open) t.lid.rotation.x = -1.1; this.things.push(t); }
  use(t) {
    const p = this.p, say = (s, c) => this.ui.damage(p.pos.clone().add(UP), s, c);
    if (t.k === 'chest') { t.open = true; t.lid.rotation.x = -1.1; p.opened.push(t.id); p.motes += t.amt; say('+' + t.amt + ' motes', '#ffd27a'); if (t.id.endsWith('-h') && p.flaskMax[0] < 8) { p.flaskMax[0]++; p.flask[0]++; say('Golden Seed: +1 Crimson Flask charge', '#ffe9a0'); } }
    else if (t.k === 'lever' && !this.gate.open) { this.gate.open = true; this.gate.sink = true; p.opened.push('gate'); for (const c of this.gate.cols) { const i = this.w.colliders.indexOf(c); if (i >= 0) this.w.colliders.splice(i, 1); } say('A distant gate grinds open', '#9fe8ff'); }
  }
  map(on) { this.mapOpen = on; this.mapc.style.display = on ? 'block' : 'none'; this.ui.menu = on; if (on) { document.exitPointerLock(); this.draw(); } }
  draw() {
    const c = this.mapc.getContext('2d'), S = 560 / 380, X = x => (x + 190) * S, Z = z => (z + 190) * S, p = this.p, w = this.w; c.fillStyle = '#0a0d14'; c.fillRect(0, 0, 560, 560); c.font = '13px Georgia'; c.textAlign = 'center';
    for (const r of REGIONS) { const d = p.discovered.includes(r.id), k = r.col.map(v => Math.round(v * 255)); c.fillStyle = d ? `rgba(${k},.8)` : 'rgba(40,40,52,.9)'; c.beginPath(); c.arc(X(r.cx), Z(r.cz), r.r * S, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.fillText(d ? r.name : '???', X(r.cx), Z(r.cz) - r.r * S + 16); }
    for (const b of w.beacons) { c.fillStyle = p.litBeacons.includes(b.name) ? '#ffb347' : '#889'; c.fillRect(X(b.x) - 4, Z(b.z) - 4, 8, 8); }
    for (const b of w.bosses || []) if (p.discovered.includes(regionAt(b.d.x, b.d.z).id)) { c.fillStyle = b.defeated ? '#6a6' : '#e44'; c.fillText('☠', X(b.d.x), Z(b.d.z) + 5); }
    for (const t of this.things) if (t.k === 'chest' && t.open) { c.fillStyle = '#ffd27a'; c.fillRect(X(t.x) - 2, Z(t.z) - 2, 4, 4); }
    c.fillStyle = c.strokeStyle = '#fff'; c.beginPath(); c.arc(X(p.pos.x), Z(p.pos.z), 4, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(X(p.pos.x), Z(p.pos.z)); c.lineTo(X(p.pos.x) + Math.sin(p.face) * 12, Z(p.pos.z) + Math.cos(p.face) * 12); c.stroke();
    c.textAlign = 'left'; c.fillText('N to close · ☠ boss · gold = lit beacon · north is up', 10, 548);
  }
  update(dt) {
    const p = this.p, w = this.w, R = regionAt(p.pos.x, p.pos.z), type = R.id === 'marsh' || R.id === 'forest' ? 'rain' : R.id === 'monastery' ? 'snow' : R.id === 'glass' ? null : 'ash';
    this.wpts.visible = !!type; // weather: rain (marsh, forest), snow (monastery), ash (hollow, clock), none in the desert
    if (type) {
      const v = { rain: 22, snow: 2.5, ash: 1.2 }[type]; this.wmat.color.setHex({ rain: 0x9ab8d8, snow: 0xffffff, ash: 0x999999 }[type]); this.wmat.size = type === 'rain' ? .07 : .16;
      for (let i = 0; i < this.wp.length; i += 3) {
        this.wp[i + 1] -= v * dt; if (type !== 'rain') this.wp[i] += Math.sin(this.wp[i + 1] * .8 + i) * dt * .6;
        if (this.wp[i + 1] < p.pos.y - 3 || Math.abs(this.wp[i] - p.pos.x) > 26 || Math.abs(this.wp[i + 2] - p.pos.z) > 26) { this.wp[i] = p.pos.x + (Math.random() - .5) * 50; this.wp[i + 1] = p.pos.y + 10 + Math.random() * 10; this.wp[i + 2] = p.pos.z + (Math.random() - .5) * 50; }
      }
      this.wpts.geometry.attributes.position.needsUpdate = true;
    }
    let near = null, bd = 2.6; for (const t of this.things) { if (t.k === 'wall') continue; const d = Math.hypot(p.pos.x - t.x, p.pos.z - t.z); if (d < bd && !(t.k === 'chest' && t.open) && !(t.k === 'lever' && this.gate.open)) { bd = d; near = t; } }
    this.near = near; this.hint.style.display = near && !this.prog.near && !p.dead && !this.ui.menu ? 'block' : 'none'; if (near) this.hint.textContent = near.k === 'chest' ? 'Press G to open the chest' : 'Press G to pull the lever';
    for (const t of this.things) if (t.k === 'wall' && !t.gone && p.state === 'attack' && Math.hypot(p.pos.x - t.x, p.pos.z - t.z) < 4.2) { t.gone = true; w.scene.remove(t.mesh); w.colliders.splice(w.colliders.indexOf(t.col), 1); p.opened.push(t.id); this.ui.damage(p.pos.clone().add(UP), 'The wall was an illusion', '#9fe8ff'); }
    if (this.gate.sink && this.gate.mesh.position.y > this.gy - 3) this.gate.mesh.position.y -= 2 * dt;
    if (w.bossActive) p.mounted = false; this.mount.visible = p.mounted; p.legs.forEach(l => l.visible = !p.mounted);
    const sp = p.onGround ? Math.hypot(p.vel.x, p.vel.z) : 0; this.mph = (this.mph || 0) + dt * sp * 1.2; this.mlegs.forEach((l, i) => l.rotation.x = Math.sin(this.mph + (i % 2 ? 0 : 3.14)) * .6 * Math.min(1, sp / 5));
    if (this.mapOpen) this.draw();
  }
}
