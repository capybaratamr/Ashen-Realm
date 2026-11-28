// In-browser self-test. Open index.html?selftest : it drives the REAL game through scripted scenarios and prints PASS/FAIL.
// It never writes your saves, but it leaves the running game in a modified state: reload the page afterwards.
import * as THREE from 'three';
import { heightAt } from './world.js';
import { applyHit } from './combat.js';
import { recalc, respawnAll } from './progress.js';
import { pool, RESERVED, grant } from './loot.js';
import { CLASSES } from './classes.js';
import { Assets, AnimatedModel } from './assets.js';
import { ModelSlot } from './charmodel.js';
export async function runSelfTest(g) {
  const { player: p, world: w, ui, saves, bosses, classes, guide, castle } = g, out = [];
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;right:8px;top:8px;bottom:8px;width:520px;overflow:auto;background:#000d;color:#dfd;font:12px monospace;padding:10px;z-index:30;white-space:pre-wrap;pointer-events:auto'; document.body.appendChild(el);
  const render = (done) => { const pass = out.filter(r => r.ok).length; el.textContent = `ASHEN REALM SELF-TEST  ${pass}/${out.length} passed${done ? '  (finished)' : '  (running...)'}\n\n` + out.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  [${r.ms.toFixed(0)} ms]${r.note ? '\n      ' + r.note : ''}`).join('\n') + (done ? '\n\nReload the page to return to normal play. Nothing was saved. Copy this text into your bug report.' : ''); };
  const t = async (name, fn) => { const t0 = performance.now(); try { const note = await fn(); out.push({ name, ok: true, note: note || '', ms: performance.now() - t0 }); } catch (e) { out.push({ name, ok: false, note: String((e && e.message) || e), ms: performance.now() - t0 }); console.error('[selftest]', name, e); } render(); await new Promise(r => setTimeout(r, 0)); };
  const ok = (c, m) => { if (!c) throw new Error(m); }, frames = n => { for (let i = 0; i < n; i++) g.step(1 / 60); };
  saves.write = () => true; saves.auto = 1e9; guide.hide(); bosses.felled = () => { }; // never touch real saves; suppress the ending screen

  await t('classes: every kit loads and has a valid equip load', async () => { const tiers = []; for (const c of CLASSES) { classes.pick(c.id); recalc(p); ok(p.ownW.length >= 2 && p.ownS.length >= 1, c.id + ': empty kit'); ok(p.ownW.includes(p.wi), c.id + ': equipped weapon not owned'); ok(Number.isFinite(p.ratio) && p.tierName, c.id + ': bad equip load'); tiers.push(c.id + ':' + p.tierName); } classes.pick('wayfarer'); return tiers.join(' '); });
  await t('loot: pools exclude owned and quest-reserved items', async () => { const pl = pool(p); ok(pl.length > 20, 'pool too small'); ok(!pl.some(c => RESERVED.includes(c)), 'reserved item leaked'); ok(!p.ownS.some(s => pl.includes('s:' + s)), 'owned spell in pool'); const m0 = p.motes; grant(p, w.ctx, 's:' + p.ownS[0]); ok(p.motes === m0 + 400, 'duplicate should give motes'); });
  await t('simulation: 180 frames in the castle without errors', async () => { ui.menu = false; frames(180); ok(Number.isFinite(p.pos.x + p.pos.y + p.pos.z + p.hp), 'player state is NaN'); });
  await t('save: snapshot -> apply round trip', async () => { const s = saves.snapshot(); p.motes += 77; p.wlvl = 5; saves.apply(JSON.parse(JSON.stringify(s))); ok(p.motes === s.motes && p.wlvl === s.wlvl, 'fields differ after apply'); ok(JSON.stringify(p.ownW) === JSON.stringify(s.ow) && p.cls === s.cls, 'class/ownership differ'); });
  await t('combat: damage, poise and status buildup apply', async () => { const e = w.enemies.find(x => !x.isBoss), h0 = e.hp; applyHit(e, { amt: 20, type: 'physical', poise: 10, status: ['bleed', 30], crit: 1 }, w.ctx); ok(e.hp < h0, 'no damage dealt'); ok(e.status.m.bleed > 0, 'no status buildup'); respawnAll(w); });
  await t('enemies cannot walk through the castle wall', async () => {
    respawnAll(w); const e = w.enemies.find(x => !x.isBoss); p.pos.set(0, heightAt(0, 30), 30); e.pos.set(0, heightAt(0, 44), 44); e.aggro = 80; e.s = 'chase';
    for (let i = 0; i < 240; i++) { g.step(1 / 60); p.hp = p.maxHp; p.pos.set(0, heightAt(0, 30), 30); } const r = Math.hypot(e.pos.x, e.pos.z); respawnAll(w); ok(r > 38.5, 'enemy reached radius ' + r.toFixed(1)); return 'enemy held at radius ' + r.toFixed(1);
  });
  await t('hotkeys ignore typing in text fields', async () => { const ta = document.createElement('textarea'); document.body.appendChild(ta); ta.focus(); for (const code of ['KeyH', 'KeyM', 'KeyG', 'KeyN', 'KeyY', 'Enter']) ta.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); ta.remove(); ok(!guide.open && !ui.menu && !g.extras.mapOpen && !bosses.skip, 'a hotkey fired while typing'); });
  await t('assets: errors are contained and results are cached', async () => {
    const a = new Assets(), bad = await a.register('weapon:Missing', { url: 'assets/dev/does_not_exist.glb' }); ok(bad === null && a.errors.length === 1, 'a missing file should record exactly one error');
    const head = await fetch('assets/dev/test_sword.glb', { method: 'HEAD' }).catch(() => ({ ok: false })); if (!head.ok) return 'bad-URL path OK; test fixture not uploaded, cache check skipped';
    const g1 = await a.register('weapon:Test', { url: 'assets/dev/test_sword.glb' }); ok(g1 && g1.userData.stats.tris > 0, 'fixture failed to load'); ok(await a.load('weapon:Test') === g1, 'second load should hit the cache');
    const i1 = a.instance('weapon:Test'), i2 = a.instance('weapon:Test'); ok(i1.root !== i2.root, 'instances must be independent'); return `fixture ${g1.userData.stats.tris} tris; ${a.summary()}`;
  });
  await t('animation: logical clip names, overrides and missing clips', async () => {
    const mk = n => new THREE.AnimationClip(n, 1, [new THREE.NumberKeyframeTrack('.position[y]', [0, 1], [0, 1])]), root = new THREE.Group(), am = new AnimatedModel(root, [mk('Idle'), mk('WALK'), mk('HeavyAttack'), mk('Foo')], { attack1: ['foo'] });
    ok(am.has('idle') && am.has('walk') && am.has('heavy') && am.has('attack1'), 'alias/override mapping failed'); ok(!am.has('roll') && am.play('roll') === false, 'missing clip must return false'); ok(am.play('walk') === true, 'could not play walk'); am.update(.5); ok(root.position.y > .4 && root.position.y < .6, 'clip did not drive the root: y=' + root.position.y);
  });
  await t('ModelSlot: attaches a model, hides the procedural body, and recovers from failure', async () => {
    const owner = { mesh: new THREE.Group(), onModelAttached: s => { owner.called = s.key; } }, body = new THREE.Group(), fake = { ready: true, has: () => true, instance: () => ({ root: new THREE.Group(), clips: [], entry: {} }) }, slot = new ModelSlot(owner, 'enemy:Test', [body]);
    slot.poll(fake); ok(slot.active && !body.visible && owner.called === 'enemy:Test', 'did not attach'); ok(slot.play('idle') === false, 'a model with no clips must report missing clips');
    const owner2 = { mesh: new THREE.Group() }, body2 = new THREE.Group(), bad = { ready: true, has: () => true, instance: () => { throw new Error('boom'); } }, s2 = new ModelSlot(owner2, 'x', [body2]); s2.poll(bad); ok(s2.state === 'failed' && body2.visible, 'failure must restore the procedural body');
  });
  const beacons = p.litBeacons.slice(); bosses.list.forEach(b => { });
  for (const b of bosses.list) await t('boss: ' + b.d.name, async () => {
    respawnAll(w); const d = b.d, seen = new Set(); if (d.g === 'astro') p.litBeacons = ['a', 'b', 'c', 'd', 'e', 'f'];
    p.pos.set(d.x + d.r * .3, heightAt(d.x, d.z), d.z); p.vel.set(0, 0, 0); p.dead = false; p.hp = p.maxHp; ui.menu = false;
    for (let i = 0; i < 420; i++) { g.step(1 / 60); p.hp = p.maxHp; if (bosses.cine) bosses.skip = true; seen.add(b.s); ok(Number.isFinite(b.pos.x + b.pos.z + b.hp), 'boss state became NaN'); }
    ok(b.active, 'boss never engaged'); ok(seen.has('windup'), 'boss never telegraphed an attack (states: ' + [...seen] + ')');
    for (let i = 0; i < 4 && !b.defeated; i++) b.takeDamage(1e9); frames(3);
    ok(b.defeated && p.bossesDown.includes(d.id) && p.relics.includes(d.relic), 'defeat / relic not granted'); if (d.id === 'gate') ok(castle.open && p.keyItems.includes('kindling'), 'castle gate did not open or key item missing'); return 'states: ' + [...seen].join(',');
  });
  p.litBeacons = beacons;
  await t('performance probe (informational)', async () => {
    classes.pick('wayfarer'); respawnAll(w); p.pos.set(0, heightAt(0, 8), 8); ui.menu = false; const times = []; for (let i = 0; i < 240; i++) { const t0 = performance.now(); g.step(1 / 60); times.push(performance.now() - t0); }
    const avg = times.reduce((a, b) => a + b, 0) / times.length, mx = Math.max(...times), r0 = performance.now(); for (let i = 0; i < 30; i++) g.renderer.render(g.scene, g.camera); const rms = (performance.now() - r0) / 30, inf = g.renderer.info;
    return `step avg ${avg.toFixed(2)} ms (max ${mx.toFixed(1)}), render ${rms.toFixed(1)} ms, ${inf.render.calls} calls, ${inf.render.triangles} triangles, ${g.scene.children.length} scene children${avg > 6 || rms > 14 ? '  WARNING: above the 60 FPS budget on this machine' : ''}`;
  });
  render(true); window.__selftest = out; console.table(out.map(r => ({ test: r.name, result: r.ok ? 'PASS' : 'FAIL', note: r.note })));
}
