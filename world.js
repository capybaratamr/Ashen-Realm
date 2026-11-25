// World: procedural terrain, tree/pillar colliders, and training-dummy enemies.
import * as THREE from 'three';
import { Enemy } from './enemies.js';
export function heightAt(x, z) {
  const n = Math.sin(x*.05)*Math.cos(z*.045)*4 + Math.sin(x*.13+z*.11)*1.2 + Math.sin(x*.02+1)*Math.sin(z*.03)*8;
  return n * Math.min(1, Math.hypot(x, z) / 20); // flat spawn area
}
export const BOUND = 180;
export function buildWorld(scene) {
  scene.background = new THREE.Color(0x7a8aa0); scene.fog = new THREE.Fog(0x7a8aa0, 40, 170);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a3020, .8));
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.1); sun.position.set(60, 100, 40); scene.add(sun);
  const g = new THREE.PlaneGeometry(2 * BOUND + 20, 2 * BOUND + 20, 180, 180); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const h = heightAt(p.getX(i), p.getZ(i)); p.setY(i, h);
    const t = THREE.MathUtils.clamp((h + 8) / 20, 0, 1); col.push(.25 + t * .2, .38 + t * .1, .2 + t * .1);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true })));
  const colliders = []; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) { // deterministic trees + ruin pillars
    const x = (rnd() - .5) * 320, z = (rnd() - .5) * 320; if (Math.hypot(x, z) < 14) continue;
    const y = heightAt(x, z), pillar = rnd() < .3, r = pillar ? .9 : .6;
    const m = new THREE.Mesh(pillar ? new THREE.CylinderGeometry(.9, 1, 7, 8) : new THREE.CylinderGeometry(.5, .7, 5, 6),
      new THREE.MeshStandardMaterial({ color: pillar ? 0x8d8a82 : 0x4a3524 }));
    m.position.set(x, y + (pillar ? 3 : 2.5), z); scene.add(m);
    if (!pillar) { const c = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 7), new THREE.MeshStandardMaterial({ color: 0x24472b })); c.position.set(x, y + 7, z); scene.add(c); }
    colliders.push({ x, z, r });
  }
  const enemies = [['Husk Soldier', 8, -4], ['Ember Wretch', -10, -12], ['Marsh Hag', 16, -18], ['Frost Shade', -4, -28]].map(([k, x, z]) => new Enemy(scene, k, x, z));
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, .8), new THREE.MeshStandardMaterial({ color: 0x333840 })); anvil.position.set(3, heightAt(3, 5) + .5, 5); scene.add(anvil); colliders.push({ x: 3, z: 5, r: .8 }); // smith
  const world = { colliders, enemies, smith: { x: 3, z: 5 } }; world.update = dt => enemies.forEach(e => e.update(dt, world)); return world;
}
