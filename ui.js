// HUD: bars, status meters, weapon infusion, target health bar, lock-on reticle, floating damage numbers, death banner.
import * as THREE from 'three';
import { COLORS } from './combat.js';
import { isTyping } from './util.js';
import { SPELLS, SPELL_BY_ID } from './magic.js';
export function createUI(camera) {
  const $ = id => document.getElementById(id), hp = $('hp').firstChild, st = $('st').firstChild, ret = $('reticle'), msg = $('msg'), tbar = $('tbar'), th = $('th').firstChild;
  const toScreen = p => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z < 1]; };
  const api = {
    menu: false,
    update(pl, target) {
      hp.style.width = Math.max(0, pl.hp / pl.maxHp * 100) + '%'; st.style.width = Math.max(0, pl.stam / pl.maxStam * 100) + '%';
      $('stat').innerHTML = Object.entries(pl.status.m).filter(([k, v]) => v > .5 || pl.status[k] > 0).map(([k, v]) => `<span style="color:#${COLORS[k].toString(16).padStart(6, '0')}">${k.toUpperCase()} ${pl.status[k] > 0 ? 'ACTIVE' : Math.round(v)}</span>`).join(' · ');
      $('fp').firstChild.style.width = pl.fp / pl.maxFp * 100 + '%'; $('cb').style.display = pl.state === 'cast' ? 'block' : 'none'; $('cb').firstChild.style.width = (pl.cp || 0) * 100 + '%'; $('wpn').innerHTML = pl.wlabel() + '<br>' + pl.slotLabel() + (pl.nearSmith ? '<br>Smith: X infuse (100 motes) · U upgrade (' + (pl.wlvl < 10 ? 150 * (pl.wlvl + 1) + ' motes' : 'max') + ')' : '');
      if (target) {
        const [x, y, ok] = toScreen(target.pos.clone().add(new THREE.Vector3(0, 1.2, 0))); ret.style.display = ok ? 'block' : 'none'; ret.style.left = x + 'px'; ret.style.top = y + 'px';
        tbar.style.display = 'block'; $('tn').textContent = target.name; th.style.width = Math.max(0, target.hp / target.maxHp * 100) + '%';
      } else { ret.style.display = 'none'; tbar.style.display = 'none'; }
    },
    damage(p, n, color = '#fff') { const [x, y] = toScreen(p), d = document.createElement('div'); d.className = 'dmg'; d.textContent = typeof n === 'number' ? Math.round(n) : n; d.style.color = color; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 800); },
    msg(on) { msg.style.display = on ? 'flex' : 'none'; },
    bind(pl) { // memorize/equip screen: M toggles; click a slot, then a spell
      const m = $('menu'), render = () => { m.innerHTML = '<h2>Memorize Spells</h2><div>' + pl.slots.map((id, i) => `<button data-s="${i}" class="${i === pl.slot ? 'sel' : ''}">${i + 1}: ${id ? SPELL_BY_ID[id].n : '—'}</button>`).join('') + '</div><div class="grid">' + SPELLS.filter(s => pl.ownS.includes(s.id)).map(s => `<button data-sp="${s.id}">${s.n}<br><small>${s.sch === 'sorc' ? 'Sorcery' : 'Incantation'} · ${s.fp} FP · ${s.kind}</small></button>`).join('') + '</div><p>M to close · click a slot, then a spell to memorize it</p>'; };
      m.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.s !== undefined) pl.slot = +b.dataset.s; if (b.dataset.sp) pl.slots[pl.slot] = b.dataset.sp; render(); };
      addEventListener('keydown', e => { if (isTyping(e)) return; if (e.code === 'KeyM') { api.menu = !api.menu; m.style.display = api.menu ? 'block' : 'none'; if (api.menu) { document.exitPointerLock(); render(); } } });
    }
  };
  return api;
}
