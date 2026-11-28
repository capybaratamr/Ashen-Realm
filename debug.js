// F3 toggles a small performance/status overlay (FPS, draw calls, triangles, enemies, asset status).
import { isTyping } from './util.js';
export class Debug {
  constructor(renderer, world, assets) {
    this.r = renderer; this.w = world; this.a = assets; this.fps = 60; this.on = false; this.t = 0; this.el = document.createElement('div');
    this.el.style.cssText = 'position:fixed;left:8px;top:8px;background:#000a;color:#9f9;font:12px monospace;padding:6px 8px;z-index:20;display:none;white-space:pre;pointer-events:none'; document.body.appendChild(this.el);
    addEventListener('keydown', e => { if (e.code === 'F3' && !isTyping(e)) { e.preventDefault(); this.on = !this.on; this.el.style.display = this.on ? 'block' : 'none'; } });
  }
  update(dt) {
    if (dt > 0) this.fps += (1 / dt - this.fps) * .05; if (!this.on || (this.t -= dt) > 0) return; this.t = .5;
    const i = this.r.info, vis = this.w.enemies.filter(e => e.alive && e.mesh.visible).length;
    this.el.textContent = `FPS ${this.fps.toFixed(0)}  (${(1000 / Math.max(1, this.fps)).toFixed(1)} ms)\ndraw calls ${i.render.calls}  triangles ${i.render.triangles}  (last pass)\ngeometries ${i.memory.geometries}  textures ${i.memory.textures}\nenemies visible ${vis}/${this.w.enemies.length}\nassets: ${this.a.summary()}`;
  }
}
