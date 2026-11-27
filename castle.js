// Hollow Keep: the walled castle you start in. The gate stays sealed until the first world boss (Orsolt, in the great hall) falls.
import * as THREE from 'three';
import { heightAt } from './world.js';
const R = 40, SEG = 36, GA = Math.PI / 2, wrapA = a => Math.atan2(Math.sin(a), Math.cos(a)); // gate faces +z, toward the outer lands
export class Castle {
  constructor(p, w, ui) {
    this.p = p; this.w = w; this.ui = ui; this.cols = []; this.t = 0; const sc = w.scene, stone = new THREE.MeshStandardMaterial({ color: 0x6a6a74, roughness: .9 }), dark = new THREE.MeshStandardMaterial({ color: 0x3e3e48, roughness: .9 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); sc.add(m); return m; }, col = (x, z, r, list) => { const c = { x, z, r }; w.colliders.push(c); if (list) list.push(c); };
    for (let i = 0; i < SEG; i++) { // curtain wall: tall boxes along the circle, 3 overlapping colliders each so there are no gaps
      const a = i / SEG * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R; if (Math.abs(wrapA(a - GA)) < .12) continue;
      add(new THREE.BoxGeometry(2, 11, 7.4), stone, x, heightAt(x, z) + 3.5, z).rotation.y = -a;
      for (let k = -1; k <= 1; k++) col(x - Math.sin(a) * k * 2.4, z + Math.cos(a) * k * 2.4, 1.7);
    }
    [[Math.PI / 4], [3 * Math.PI / 4], [5 * Math.PI / 4], [7 * Math.PI / 4], [GA - .2], [GA + .2]].forEach(([a]) => { // corner + gatehouse towers
      const x = Math.cos(a) * R, z = Math.sin(a) * R, y = heightAt(x, z); add(new THREE.CylinderGeometry(3.4, 3.8, 18, 10), stone, x, y + 7, z); add(new THREE.ConeGeometry(4.4, 5, 10), dark, x, y + 18.5, z); col(x, z, 3.8);
    });
    this.gy = heightAt(0, R); this.door = add(new THREE.BoxGeometry(2, 9, 8), dark, 0, this.gy + 3.5, R); this.door.rotation.y = -GA; for (let k = -1; k <= 1; k++) this.cols.push({ x: k * 2.4, z: R, r: 1.7 });
    const hy = heightAt(0, -22); add(new THREE.CircleGeometry(14, 40), new THREE.MeshStandardMaterial({ color: 0x3a3a44 }), 0, hy + .06, -22).rotation.x = -Math.PI / 2; // great hall floor (boss arena)
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = Math.cos(a) * 15.5, z = -22 + Math.sin(a) * 15.5; add(new THREE.CylinderGeometry(.9, 1.1, 10, 8), stone, x, heightAt(x, z) + 4.5, z); col(x, z, 1.1); }
    this.open = p.bossesDown.includes('gate'); this.door.position.y = this.gy + (this.open ? -7 : 3.5); if (!this.open) this.cols.forEach(c => w.colliders.push(c));
  }
  update(dt) {
    const p = this.p, w = this.w, should = p.bossesDown.includes('gate');
    if (should !== this.open) { this.open = should; if (should) for (const c of this.cols) { const i = w.colliders.indexOf(c); if (i >= 0) w.colliders.splice(i, 1); } else this.cols.forEach(c => { if (!w.colliders.includes(c)) w.colliders.push(c); }); if (should) this.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 'The castle gate grinds open', '#ffe9a0'); }
    this.door.position.y += ((this.gy + (this.open ? -7 : 3.5)) - this.door.position.y) * Math.min(1, dt * 1.2);
    if (!this.open && (this.t -= dt) <= 0 && Math.hypot(p.pos.x, p.pos.z - R) < 8) { this.t = 5; this.ui.damage(p.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 'The gate is sealed: defeat the Warden in the great hall', '#ffd27a'); }
  }
}
