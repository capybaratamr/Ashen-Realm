// Save/load: 5 slots in localStorage (per browser), autosave every 60s, resume last slot on start,
// plus an export/import code so a save can move between devices. Press P for the menu.
import { WEAPONS } from './items.js';
const KEY = n => 'ashenrealm.save.' + n, N = 5, fmt = s => `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m`;
export class SaveManager {
  constructor(p, ui) {
    this.p = p; this.ui = ui; this.play = 0; this.auto = 60; this.open = false; this.code = '';
    try { this.slot = +localStorage.getItem('ashenrealm.slot') || 1; } catch { this.slot = 1; }
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:fixed;inset:8% 10%;background:#0d1018ee;border:1px solid #ffffff33;padding:18px;display:none;overflow:auto;z-index:6;color:#e8dcc0;font-family:Georgia,serif';
    this.toastEl = document.createElement('div');
    this.toastEl.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);color:#e8dcc0;background:#000a;padding:6px 14px;display:none;z-index:7;font-family:Georgia,serif';
    document.body.append(this.el, this.toastEl); this.el.onclick = e => this.click(e);
    addEventListener('keydown', e => { if (e.code === 'KeyP' && !/TEXTAREA|INPUT/.test(e.target.tagName)) this.toggle(); });
    if (this.read(this.slot)) this.load(this.slot, true); // resume where you left off
  }
  read(n) { try { return JSON.parse(localStorage.getItem(KEY(n))); } catch { return null; } }
  write(n, d) { try { localStorage.setItem(KEY(n), JSON.stringify(d)); localStorage.setItem('ashenrealm.slot', n); return true; } catch { this.toast('Could not save (browser storage blocked)'); return false; } }
  toast(t) { this.toastEl.textContent = t; this.toastEl.style.display = 'block'; clearTimeout(this.tt); this.tt = setTimeout(() => this.toastEl.style.display = 'none', 2200); }
  snapshot() { // add new persistent fields here as later phases land (levels, flasks, inventory...)
    const p = this.p; return { v: 1, t: Date.now(), play: Math.floor(this.play), pos: [p.pos.x, p.pos.y, p.pos.z], hp: p.hp, fp: p.fp, wi: p.wi, wlvl: p.wlvl, inf: p.inf, stats: p.stats, slots: p.slots, slot: p.slot, lvl: p.level, motes: p.motes, fl: p.flask, flm: p.flaskMax, ar: p.armorIdx, sp: [p.spawn.x, p.spawn.y, p.spawn.z], lit: p.litBeacons, disc: p.discovered, tut: p.tut, rel: p.relics, bd: p.bossesDown, ng: p.ng, op: p.opened };
  }
  apply(d) {
    const p = this.p; p.pos.set(...d.pos); p.vel.set(0, 0, 0); p.hp = Math.max(1, d.hp); p.fp = d.fp; p.wi = d.wi; p.wlvl = d.wlvl; p.inf = d.inf; p.stats = { ...p.stats, ...d.stats }; p.slots = d.slots; p.slot = d.slot;
    if (d.lvl) { p.level = d.lvl; p.motes = d.motes || 0; p.flask = d.fl || p.flask; p.flaskMax = d.flm || p.flaskMax; p.armorIdx = d.ar ?? p.armorIdx; if (d.sp) p.spawn.set(...d.sp); p.litBeacons = d.lit || []; p.discovered = d.disc || ['hollow']; p.tut = d.tut || 0; p.relics = d.rel || []; p.bossesDown = d.bd || []; p.ng = d.ng || 0; p.opened = d.op || []; }
    p.blade.scale.z = p.def.rng; p.blade.visible = p.def.cat !== 'shield'; p.status.reset(); p.state = 'free'; this.play = d.play || 0;
  }
  save(n, quiet) { this.slot = n; if (this.write(n, this.snapshot()) && !quiet) this.toast('Saved to slot ' + n); }
  load(n, quiet) { const d = this.read(n); if (!d || d.v !== 1) return this.toast('Slot ' + n + ' is empty'); this.slot = n; localStorage.setItem('ashenrealm.slot', n); this.apply(d); if (!quiet) this.toast('Loaded slot ' + n); }
  tick(dt) { this.play += dt; if (!this.p.dead && (this.auto -= dt) <= 0) { this.auto = 60; this.save(this.slot, true); } } // autosave to the active slot
  toggle() {
    this.open = !this.open; this.ui.menu = this.open; this.el.style.display = this.open ? 'block' : 'none';
    if (this.open) { document.exitPointerLock(); this.render(); }
  }
  render() {
    const rows = []; for (let n = 1; n <= N; n++) {
      const d = this.read(n);
      rows.push(`<div style="margin:6px 0"><b>${n === this.slot ? '▶ ' : ''}Slot ${n}</b> — ${d ? `${WEAPONS[d.wi] ? WEAPONS[d.wi].name : '?'} +${d.wlvl} · ${fmt(d.play || 0)} played · ${new Date(d.t).toLocaleString()}` : '<i>Empty</i>'}<br>
      <button data-a="save" data-n="${n}">Save</button><button data-a="load" data-n="${n}">Load</button><button data-a="del" data-n="${n}">Delete</button></div>`);
    }
    this.el.innerHTML = `<h2>Save / Load</h2>${rows.join('')}<hr><p>Move a save to another device: <b>Export</b> here, copy the code, then <b>Import</b> it there (goes into the active slot).</p>
      <textarea style="width:100%;height:70px;background:#111;color:#cde" placeholder="save code">${this.code}</textarea><br><button data-a="export">Export current game</button><button data-a="import">Import code</button>
      <p style="opacity:.7">Autosaves every minute to the active slot · saves live in this browser · P to close</p>`;
    this.el.querySelectorAll('button').forEach(b => b.style.cssText = 'background:#1b2130;color:#e8dcc0;border:1px solid #ffffff33;margin:3px;padding:5px 10px;cursor:pointer');
  }
  click(e) {
    const b = e.target.closest('button'); if (!b) return; const n = +b.dataset.n, a = b.dataset.a;
    if (a === 'save') this.save(n); else if (a === 'load') this.load(n); else if (a === 'del') { if (confirm('Delete slot ' + n + '?')) { try { localStorage.removeItem(KEY(n)); } catch { } } }
    else if (a === 'export') this.code = btoa(JSON.stringify(this.snapshot()));
    else if (a === 'import') { try { const d = JSON.parse(atob(this.el.querySelector('textarea').value.trim())); if (d.v !== 1 || !Array.isArray(d.pos)) throw 0; this.write(this.slot, d); this.load(this.slot); } catch { this.toast('That code is not a valid save'); } }
    this.render();
  }
}
