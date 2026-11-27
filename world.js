// World: procedural terrain, tree/pillar colliders, and training-dummy enemies.
import * as THREE from 'three';
import { Enemy } from './enemies.js';
import { REGIONS, regionAt, blend, ARENAS } from './regions.js';
export function heightAt(x, z) {
  const n = Math.sin(x*.05)*Math.cos(z*.045)*4 + Math.sin(x*.13+z*.11)*1.2 + Math.sin(x*.02+1)*Math.sin(z*.03)*8;
  return n * Math.min(1, Math.hypot(x, z) / 20) * blend(x, z).amp; // flat spawn area; each region has its own roughness
}
export const BOUND = 180;
export function buildWorld(scene) {
  scene.background = new THREE.Color(0x7a8aa0); scene.fog = new THREE.Fog(0x7a8aa0, 40, 170);
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x3a3020, .8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.1); sun.position.set(60, 100, 40); scene.add(sun);
  const g = new THREE.PlaneGeometry(2 * BOUND + 20, 2 * BOUND + 20, 180, 180); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const h = heightAt(p.getX(i), p.getZ(i)); p.setY(i, h);
    const t = THREE.MathUtils.clamp((h + 8) / 20, 0, 1), b = blend(p.getX(i), p.getZ(i)).col; col.push(b[0] * (.8 + t * .4), b[1] * (.8 + t * .4), b[2] * (.8 + t * .4));
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true })));
  const colliders = []; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // Region props: each land gets its own look (reeds, pillars + gears, glass spires, ice pillars, lantern trees) and its own enemies
  const enemies = [];
  const mk = (geo, color, x, y, z, emissive) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: emissive || 0 })); m.position.set(x, y, z); scene.add(m); return m; };
  for (const R of REGIONS) {
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R.r * .9, x = R.cx + Math.cos(a) * d, z = R.cz + Math.sin(a) * d;
      if (Math.hypot(x, z) < 14 || regionAt(x, z) !== R || Math.abs(x) > BOUND - 4 || Math.abs(z) > BOUND - 4 || ARENAS.some(q => Math.hypot(x - q[0], z - q[1]) < q[2] + 2)) continue;
      const y = heightAt(x, z); let r = .6;
      if (R.id === 'marsh') { mk(new THREE.CylinderGeometry(.08, .12, 3, 5), 0x6a8a52, x, y + 1.5, z); r = .2; }
      else if (R.id === 'clock') { mk(new THREE.CylinderGeometry(.9, 1, 7, 8), 0x9a7a4a, x, y + 3, z); if (i % 3 === 0) mk(new THREE.TorusGeometry(1.6, .25, 6, 14), 0xb08a40, x, y + 6.5, z); r = .9; }
      else if (R.id === 'glass') { mk(new THREE.ConeGeometry(1, 6, 5), 0xcfe8e0, x, y + 3, z); r = .8; }
      else if (R.id === 'monastery') { mk(new THREE.CylinderGeometry(.7, 1, 8, 6), 0xdfeaf5, x, y + 4, z); r = .9; }
      else if (R.id === 'forest') { mk(new THREE.CylinderGeometry(.5, .7, 5, 6), 0x3a2a24, x, y + 2.5, z); mk(new THREE.ConeGeometry(3, 6, 7), 0x1e3a2a, x, y + 7, z); mk(new THREE.SphereGeometry(.25, 8, 6), 0xffcc66, x + 1, y + 2.2, z, 0xffaa33); }
      else { mk(new THREE.CylinderGeometry(.5, .7, 5, 6), 0x4a3524, x, y + 2.5, z); mk(new THREE.ConeGeometry(3, 6, 7), 0x24472b, x, y + 7, z); }
      colliders.push({ x, z, r });
    }
    R.enemies.forEach((k, j) => { for (let n = 0; n < (R.id === 'hollow' ? 1 : 2); n++) { const a = (n + j * .5) * 2.1, d = R.id === 'hollow' ? 22 : 18 + n * 7; const ex = R.cx + Math.cos(a) * d, ez = R.cz + Math.sin(a) * d; if (!ARENAS.some(q => Math.hypot(ex - q[0], ez - q[1]) < q[2] + 3)) enemies.push(new Enemy(scene, k, ex, ez)); } });
  }
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, .8), new THREE.MeshStandardMaterial({ color: 0x333840 })); anvil.position.set(3, heightAt(3, 5) + .5, 5); scene.add(anvil); colliders.push({ x: 3, z: 5, r: .8 }); // smith
  const world = { colliders, enemies, smith: { x: 3, z: 5 }, sun, hemi }; world.update = dt => enemies.forEach(e => e.update(dt, world)); return world;
}
