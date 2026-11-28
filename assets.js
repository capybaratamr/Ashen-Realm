// Centralized GLB/glTF asset pipeline (Three.js 0.160.0). Optional by design: with an empty manifest the game keeps its procedural models.
// Features: manifest v2, cache + in-flight de-duplication, timeout + one retry, validation against polygon/texture budgets,
// error containment (never throws to callers), shared geometry with per-entity instances, and AnimatedModel for clip playback.
// See ASSET_PIPELINE.md. STATUS: no generated model exists yet, so only the test fixture has exercised this code.
import * as THREE from 'three';
export const BUDGETS = { player: 12000, enemy: 8000, boss: 25000, weapon: 2000, prop: 3000 }; // max triangles per key prefix
export const CLIP_ALIASES = { // logical clip name -> accepted GLB clip names (case-insensitive); a manifest entry can add its own via "clips"
  idle: ['idle'], walk: ['walk'], run: ['run'], roll: ['roll'], backstep: ['backstep'], jump: ['jump'], fall: ['fall'], land: ['land'],
  attack1: ['attack1'], attack2: ['attack2'], attack3: ['attack3'], heavy: ['heavyattack', 'heavy'], charge: ['chargeloop', 'charge'], guard: ['guard'],
  parry: ['parry'], riposte: ['riposte'], hit: ['hit'], stagger: ['stagger'], drink: ['drink'], cast: ['cast'], die: ['die', 'death'],
  windup: ['windup'], strike: ['strike'], recover: ['recover'], roar: ['roar']
};
const LOOPED = new Set(['idle', 'walk', 'run', 'charge', 'guard']);
export class AnimatedModel { // clip playback with logical names, cross-fading, and graceful "clip missing" results
  constructor(root, clips = [], overrides = {}) {
    this.root = root; this.mixer = new THREE.AnimationMixer(root); this.actions = {}; this.cur = null; this.curName = null;
    const byName = new Map(clips.map(c => [c.name.toLowerCase(), c]));
    for (const logical of Object.keys(CLIP_ALIASES)) {
      const want = [...(overrides[logical] || []), ...CLIP_ALIASES[logical]].map(s => s.toLowerCase()); let clip = null;
      for (const w of want) if (byName.has(w)) { clip = byName.get(w); break; }
      if (clip) this.actions[logical] = this.mixer.clipAction(clip);
    }
    if (!this.actions.idle && clips.length === 1) this.actions.idle = this.mixer.clipAction(clips[0]); // a single unnamed clip is treated as the idle loop
  }
  has(name) { return !!this.actions[name]; }
  play(name, { once = false, fade = .15 } = {}) { // returns false when the model has no such clip so the caller can fall back
    const a = this.actions[name]; if (!a) return false;
    if (this.cur === a && !(once && !a.isRunning())) return true;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1);
    if (once || !LOOPED.has(name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    if (this.cur && this.cur !== a) a.crossFadeFrom(this.cur, fade, false);
    a.play(); this.cur = a; this.curName = name; return true;
  }
  update(dt) { this.mixer.update(dt); }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }
}
export class Assets {
  constructor() { this.entries = new Map(); this.models = new Map(); this.pending = new Map(); this.errors = []; this.warnings = []; this.ready = false; this.loader = null; this.clone = null; }
  timed(p, ms = 15000) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]); }
  async init(url = 'assets/manifest.json') { // reads the manifest, then preloads everything it lists. Never throws.
    try {
      const res = await this.timed(fetch(url, { cache: 'no-cache' })); if (!res.ok) throw new Error('HTTP ' + res.status);
      const man = await res.json(); for (const [k, v] of Object.entries(man.models || {})) this.entries.set(k, typeof v === 'string' ? { url: v } : { ...v });
    } catch (e) { console.info('[assets] no manifest (' + e.message + '); using procedural models'); this.ready = true; return; }
    if (this.entries.size) { await this.setup(); await Promise.all([...this.entries.keys()].map(k => this.load(k))); console.info('[assets]', this.summary()); }
    else console.info('[assets] manifest lists no models; using procedural models');
    this.ready = true;
  }
  async setup() { // GLTFLoader + SkeletonUtils from the import map; Meshopt decoding if available. Draco is off (it needs an external decoder).
    if (this.loader) return;
    try {
      const [{ GLTFLoader }, SU] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/utils/SkeletonUtils.js')]); this.loader = new GLTFLoader(); this.clone = SU.clone;
      try { const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js'); this.loader.setMeshoptDecoder(MeshoptDecoder); } catch { /* optional */ }
    } catch (e) { this.errors.push({ key: '*', message: 'GLTFLoader unavailable: ' + e.message }); }
  }
  register(key, entry) { this.entries.set(key, entry); return this.setup().then(() => this.load(key)); } // add + load one entry at runtime (also used by the self-test)
  load(key) { // cached, de-duplicated, retried once, validated; resolves to the glTF or null (the caller then keeps its procedural model)
    if (this.models.has(key)) return Promise.resolve(this.models.get(key));
    if (this.pending.has(key)) return this.pending.get(key);
    const entry = this.entries.get(key); if (!entry || !this.loader) return Promise.resolve(null);
    const p = (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try { const gltf = await this.timed(this.loader.loadAsync(entry.url)); this.validate(key, gltf); this.models.set(key, gltf); return gltf; }
        catch (e) { if (attempt) { this.errors.push({ key, message: (e && e.message) || String(e) }); console.warn('[assets] failed to load', key, (e && e.message) || e); } }
      }
      return null;
    })().finally(() => this.pending.delete(key));
    this.pending.set(key, p); return p;
  }
  validate(key, gltf) { // throws on unusable files; only warns on budget overruns
    let tris = 0, meshes = 0, maxTex = 0; const mats = new Set(), texs = new Set();
    gltf.scene.traverse(o => { if (!o.isMesh) return; meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      for (const m of [].concat(o.material)) { mats.add(m); for (const k in m) { const t = m[k]; if (t && t.isTexture) { texs.add(t); if (t.image) maxTex = Math.max(maxTex, t.image.width || 0, t.image.height || 0); } } } });
    if (!meshes) throw new Error('file contains no meshes');
    gltf.userData.stats = { tris: Math.round(tris), meshes, materials: mats.size, textures: texs.size, maxTex, clips: gltf.animations.length };
    const cat = key.split(':')[0], budget = BUDGETS[cat];
    if (budget && tris > budget) this.warn(`${key}: ${Math.round(tris)} triangles exceeds the ${budget} budget`);
    if (maxTex > 1024) this.warn(`${key}: ${maxTex}px texture exceeds 1024`);
    if (mats.size > 3 && cat !== 'prop') this.warn(`${key}: ${mats.size} materials (max 3)`);
  }
  warn(m) { this.warnings.push(m); console.warn('[assets]', m); }
  has(key) { return this.models.has(key); }
  instance(key) { // independent copy (own skeleton, shared geometry/textures) + clips + manifest entry, or null
    const g = this.models.get(key); if (!g) return null; const entry = this.entries.get(key) || {}, root = this.clone(g.scene);
    if (entry.scale && entry.scale !== 1) root.scale.multiplyScalar(entry.scale); if (entry.yaw) root.rotation.y = entry.yaw; return { root, clips: g.animations, entry };
  }
  dispose(key) { const g = this.models.get(key); if (!g) return; g.scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); for (const m of [].concat(o.material)) { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); } } }); this.models.delete(key); }
  summary() { return `${this.models.size}/${this.entries.size} models loaded, ${this.errors.length} errors, ${this.warnings.length} warnings`; }
}
