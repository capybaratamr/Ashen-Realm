// Small shared helpers (leaf module).
export const isTyping = e => /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || !!(e.target && e.target.isContentEditable); // hotkeys must ignore typing in text fields
export function pushOut(pos, cols, r) { // circle-vs-circle push-out used by enemies and bosses so they respect walls and props
  for (const o of cols) { const dx = pos.x - o.x, dz = pos.z - o.z, m = o.r + r, d2 = dx * dx + dz * dz; if (d2 < m * m && d2 > 1e-8) { const d = Math.sqrt(d2); pos.x = o.x + dx / d * m; pos.z = o.z + dz / d * m; } }
}
