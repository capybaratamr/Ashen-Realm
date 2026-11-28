// Binds an optional GLB character to a game entity (Player / Enemy / Boss) and drives its animation clips.
// With no model loaded the slot stays inert and the entity keeps its procedural body. If attaching fails, the procedural body is restored.
import { AnimatedModel } from './assets.js';
export class ModelSlot {
  constructor(owner, key, hide) { this.owner = owner; this.key = key; this.hide = hide; this.state = 'pending'; this.am = null; this.mats = []; this.root = null; this.entry = {}; }
  get active() { return this.state === 'glb'; }
  poll(assets) { // called every frame; acts once, after the asset manifest has finished loading
    if (this.state !== 'pending' || !assets || !assets.ready) return;
    this.state = 'none'; if (!assets.has(this.key)) return;
    try {
      const inst = assets.instance(this.key); if (!inst) return; this.root = inst.root; this.entry = inst.entry || {};
      this.root.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); this.mats.push(...[].concat(o.material)); } }); // per-instance materials so hit-flash only tints this one
      this.owner.mesh.add(this.root); this.hide.forEach(o => { o.visible = false; });
      this.am = new AnimatedModel(this.root, inst.clips, this.entry.clips); this.state = 'glb';
      if (this.owner.onModelAttached) this.owner.onModelAttached(this);
    } catch (e) {
      console.warn('[models] could not attach', this.key, e); if (this.root && this.root.parent) this.root.parent.remove(this.root);
      this.hide.forEach(o => { o.visible = true; }); this.am = null; this.state = 'failed';
    }
  }
  play(name, opts) { return this.am ? this.am.play(name, opts) : false; }
  update(dt) { if (this.am) this.am.update(dt); }
  flash(hex) { for (const m of this.mats) if (m.emissive) m.emissive.setHex(hex); }
}
