// Character models built from primitives: an armored knight and four enemy silhouettes, with parts exposed for animation.
import * as THREE from 'three';
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: .2, ...o });
const box = (w, h, d, mat, x, y, z, p) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); p.add(m); return m; };
const ball = (r, mat, x, y, z, p) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat); m.position.set(x, y, z); p.add(m); return m; };
export function buildKnight() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const steel = M(0x8a94a8, { metalness: .6, roughness: .4 }), cloth = M(0x2a3350), torsoMat = M(0x7a5a3a), dark = M(0x1a1c24);
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .18, .9, 0); box(.24, .55, .26, cloth, 0, -.28, 0, l); box(.28, .4, .3, steel, 0, -.7, .02, l); g.add(l); return l; });
  box(.72, .78, .42, torsoMat, 0, 1.3, 0, body); box(.78, .14, .46, dark, 0, .95, 0, body); box(.5, .3, .1, steel, 0, 1.5, .24, body); // chest, belt, breastplate
  ball(.24, steel, 0, 1.95, 0, body); box(.3, .06, .1, new THREE.MeshBasicMaterial({ color: 0xffb347 }), 0, 1.98, .2, body); // helmet + glowing visor
  const plume = new THREE.Mesh(new THREE.ConeGeometry(.08, .4, 6), M(0x8a1c24)); plume.position.set(0, 2.28, -.05); body.add(plume);
  [-1, 1].forEach(s => ball(.2, steel, s * .5, 1.62, 0, body)); // shoulder pads
  const cape = new THREE.Group(); cape.position.set(0, 1.62, -.24); const cm = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.2), M(0x7a1c24, { side: THREE.DoubleSide })); cm.position.y = -.6; cape.add(cm); body.add(cape);
  const arm = new THREE.Group(); arm.position.set(.55, 1.5, 0); box(.18, .6, .18, steel, 0, -.3, 0, arm);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 1.3), new THREE.MeshStandardMaterial({ color: 0xcfd4dc, metalness: .8, roughness: .3 })); blade.position.set(0, -.6, .75); arm.add(blade); body.add(arm);
  box(.18, .6, .18, steel, -.55, 1.2, 0, body);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(.1, .9, .7), M(0x8a6a3a)); shield.position.set(-.55, 1.2, .35); shield.visible = false; body.add(shield);
  return { group: g, body, arm, blade, shield, legs, cape, torsoMat };
}
const LOOK = {
  'Husk Soldier': { sc: 1, torso: [.8, .9, .5], glow: 0xff3030, weapon: 'sword', helm: 1, shield: 1 },
  'Ember Wretch': { sc: 1.05, torso: [.85, .9, .5], glow: 0xff7a2a, weapon: 'torch', horns: 1, core: 1 },
  'Marsh Hag': { sc: 1, torso: [.6, .8, .4], glow: 0x9aff4a, weapon: 'claws', hunch: .35, hood: 1, long: 1 },
  'Frost Shade': { sc: 1.15, torso: [.6, 1.1, .4], glow: 0x9fe8ff, weapon: 'staff', robe: 1 }
};
export function buildEnemy(name, mat) { // mat is shared by body parts so the hit-flash tints the whole enemy
  const L = LOOK[name], g = new THREE.Group(), body = new THREE.Group(), acc = M(0x1c1c22), gl = new THREE.MeshBasicMaterial({ color: L.glow }), top = 1.35 + L.torso[1] / 2;
  g.add(body); g.scale.setScalar(L.sc); body.rotation.x = L.hunch || 0;
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .2, .9, 0); if (!L.robe) box(.26, .9, .28, mat, 0, -.45, 0, l); g.add(l); return l; });
  box(...L.torso, mat, 0, 1.35, 0, body); ball(.26, mat, 0, top + .2, .05, body); box(.26, .06, .1, gl, 0, top + .22, .24, body); // torso, head, glowing eyes
  if (L.helm) box(.4, .3, .4, acc, 0, top + .27, .05, body);
  if (L.horns) [-1, 1].forEach(s => { const h = new THREE.Mesh(new THREE.ConeGeometry(.07, .4, 5), acc); h.position.set(s * .2, top + .5, .05); h.rotation.z = -s * .4; body.add(h); });
  if (L.core) ball(.2, gl, 0, 1.4, .27, body);
  if (L.hood) { const h = new THREE.Mesh(new THREE.ConeGeometry(.35, .6, 6), acc); h.position.set(0, top + .45, 0); body.add(h); }
  if (L.robe) { const r = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.9, 8), mat); r.position.y = .95; body.add(r); }
  if (L.shield) box(.1, .8, .6, acc, -.6, 1.3, .3, body);
  const al = L.long ? 1.1 : .7; box(.2, al, .2, mat, -.5, 1.7 - al / 2, 0, body);
  const arm = new THREE.Group(); arm.position.set(.55, 1.7, 0); box(.2, al, .2, mat, 0, -al / 2, 0, arm);
  if (L.weapon === 'sword') box(.1, .1, 1.5, acc, 0, -.7, .8, arm);
  else if (L.weapon === 'torch') { box(.12, .12, 1.3, acc, 0, -.7, .7, arm); ball(.22, gl, 0, -.7, 1.4, arm); }
  else if (L.weapon === 'staff') { box(.08, .08, 1.8, acc, 0, -.7, .8, arm); ball(.18, gl, 0, -.7, 1.8, arm); }
  else [-1, 0, 1].forEach(i => box(.04, .04, .5, gl, i * .06, -al, .3, arm)); // claws
  body.add(arm);
  return { group: g, arm, legs, body };
}
