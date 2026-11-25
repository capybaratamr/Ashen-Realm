// Entry: renderer, main loop, hit-stop. Shared context {fx, ui, particles} is attached to the world for all systems.
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Player, CameraRig } from './player.js';
import { Particles, Projectiles } from './combat.js';
import { updateMagic } from './magic.js';
import { SaveManager } from './save.js';
import { createUI } from './ui.js';
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 400);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const world = buildWorld(scene), player = new Player(scene), rig = new CameraRig(camera, renderer.domElement), ui = createUI(camera);
const fx = { shake: 0, hitstop: 0 }, particles = new Particles(scene);
const projectiles = new Projectiles(scene); world.scene = scene; world.delayed = []; world.summons = []; ui.bind(player); const saves = new SaveManager(player, ui); world.ctx = { fx, ui, particles, projectiles }; world.player = player;
let last = performance.now();
renderer.setAnimationLoop(now => {
  let dt = Math.min(.05, (now - last) / 1000); last = now;
  if (fx.hitstop > 0) { fx.hitstop -= dt; dt *= .05; } // hit-stop: near-freeze for a few frames
  if (ui.menu) dt = 0; // memorize screen pauses the world
  player.update(dt, rig, world, ui, fx); world.update(dt); particles.update(dt); projectiles.update(dt, world); updateMagic(dt, world); saves.tick(dt); rig.update(dt, player, fx);
  ui.update(player, rig.target); renderer.render(scene, camera);
});
