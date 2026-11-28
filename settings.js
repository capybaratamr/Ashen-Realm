// Phase 8 (start): pause + settings menu (Esc), post-processing (bloom, vignette, film grain), low-end mode, accessibility options.
import * as THREE from 'three';
const DEF = { vol: .6, fov: 70, sens: 2.2, diff: 1, shake: 1, cb: 0, quality: 'high' };
export async function initPost(renderer, scene, camera) { // loaded lazily; if it fails the game just renders without post-processing
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }] = await Promise.all(['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'ShaderPass', 'OutputPass'].map(n => import(`three/addons/postprocessing/${n}.js`)));
    const c = new EffectComposer(renderer); c.addPass(new RenderPass(scene, camera)); c.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .6, .85));
    const fin = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); float v=smoothstep(.95,.35,distance(vUv,vec2(.5))); float g=fract(sin(dot(vUv+time,vec2(12.9898,78.233)))*43758.5453); c.rgb*=mix(.55,1.,v); c.rgb+=(g-.5)*.035; gl_FragColor=c; }' });
    c.addPass(fin); c.addPass(new OutputPass()); return { c, fin };
  } catch { return null; }
}
export class Settings {
  constructor(o) {
    Object.assign(this, o); this.open = false; this.s = { ...DEF }; try { Object.assign(this.s, JSON.parse(localStorage.getItem('ashenrealm.settings') || '{}')); } catch { }
    const st = document.createElement('style'); st.textContent = 'body.cb #hp i{background:#e69f00!important}body.cb #st i{background:#56b4e9!important}body.cb #fp i{background:#cc79a7!important}'; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.style.cssText = 'position:fixed;inset:10% 20%;background:#0d1018f2;border:1px solid #fff3;padding:18px;display:none;overflow:auto;z-index:12;color:#e8dcc0;font-family:Georgia,serif;line-height:1.9'; document.body.appendChild(this.el);
    this.el.oninput = e => { const t = e.target, k = t.dataset.k; if (!k) return; this.s[k] = t.type === 'checkbox' ? (k === 'shake' ? (t.checked ? .25 : 1) : +t.checked) : k === 'quality' ? t.value : +t.value; this.apply(); if (t.type === 'range') t.nextElementSibling.textContent = t.value; };
    this.el.onclick = e => { const a = e.target.dataset.a; if (!a) return; this.hide(); if (a === 'save') dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' })); if (a === 'help') dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' })); };
    addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && !this.ui.menu && !this.open) this.show(); }); // Esc releases the mouse -> pause
    addEventListener('keydown', e => { if (e.code === 'Escape' && this.open) this.hide(); });
    this.apply();
  }
  apply() {
    const s = this.s; this.sound.setVol(s.vol); this.camera.fov = s.fov; this.camera.updateProjectionMatrix(); this.rig.sens = s.sens * .001; this.world.diff = s.diff; this.fx.shakeMul = s.shake; document.body.classList.toggle('cb', !!s.cb);
    this.renderer.setPixelRatio(s.quality === 'high' ? Math.min(devicePixelRatio, 2) : 1); this.renderer.setSize(innerWidth, innerHeight); dispatchEvent(new Event('resize')); try { localStorage.setItem('ashenrealm.settings', JSON.stringify(s)); } catch { }
  }
  show() {
    const s = this.s, r = (k, mn, mx, st, label) => `<div>${label}: <input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${s[k]}"> <b>${s[k]}</b></div>`;
    this.open = true; this.ui.menu = true; this.el.style.display = 'block';
    this.el.innerHTML = `<h2>Paused</h2>${r('vol', 0, 1, .05, 'Volume')}${r('fov', 60, 100, 1, 'Field of view')}${r('sens', .8, 5, .1, 'Mouse sensitivity')}
      <div>Difficulty: <select data-k="diff">${[['Easy', .75], ['Normal', 1], ['Hard', 1.3]].map(([n, v]) => `<option value="${v}" ${s.diff == v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div>Graphics: <select data-k="quality"><option value="high" ${s.quality === 'high' ? 'selected' : ''}>High (bloom, vignette, film grain)</option><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Low-end (no post-processing, 1x resolution)</option></select></div>
      <div><label><input type="checkbox" data-k="shake" ${s.shake < 1 ? 'checked' : ''}> Reduced screen shake</label></div><div><label><input type="checkbox" data-k="cb" ${s.cb ? 'checked' : ''}> Color-blind friendly HUD</label></div>
      <p><button data-a="resume">Resume (Esc)</button> <button data-a="save">Save / Load (P)</button> <button data-a="help">Controls (H)</button></p><p style="opacity:.6">Click the game after resuming to capture the mouse. Key rebinding is not available yet.</p>`;
  }
  hide() { this.open = false; this.ui.menu = false; this.el.style.display = 'none'; }
}
