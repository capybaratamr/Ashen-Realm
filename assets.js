// Centralized asset loading for GLB/glTF models. Models are optional by design: with nothing listed in assets/manifest.json the game
// keeps using its procedural models (models.js). A model that is listed but fails to load is skipped and the fallback stays in use.
// STATUS: loader only. No model is wired into Player/Enemy/Boss yet, because no GLB has been supplied or tested.
export class Assets {
  constructor() { this.models = new Map(); this.failed = []; this.ready = false; this.clone = null; }
  async init() {
    try {
      const res = await fetch('assets/manifest.json'); if (!res.ok) throw new Error('no manifest');
      const entries = Object.entries((await res.json()).models || {});
      if (!entries.length) { this.ready = true; console.info('[assets] no models listed; using procedural models'); return; }
      const [{ GLTFLoader }, SU] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/utils/SkeletonUtils.js')]);
      const loader = new GLTFLoader(); this.clone = SU.clone;
      await Promise.all(entries.map(async ([key, url]) => { try { this.models.set(key, await loader.loadAsync(url)); } catch { this.failed.push(key); console.warn('[assets] failed to load', key, url); } }));
      console.info(`[assets] loaded ${this.models.size} model(s), ${this.failed.length} failed`);
    } catch { console.info('[assets] none loaded; using procedural models'); }
    this.ready = true;
  }
  has(key) { return this.models.has(key); }
  instance(key) { const g = this.models.get(key); return g ? { root: this.clone(g.scene), clips: g.animations } : null; } // null => caller uses the procedural fallback
}
