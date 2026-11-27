// ALL STORY TEXT LIVES HERE. Edit the text between the quotes and the game picks it up (no other file needs to change).
// Everything below is PLACEHOLDER lore until the real lore is written. See LORE_FOR_FRIEND.md for the rules.

// Opening screen (also the H help screen).
export const INTRO = 'The great Lantern that hung above the world went dark the night the astronomer Vael Orrun tried to rewrite gravity. Ash has fallen ever since. You wake inside the sealed walls of Hollow Keep, an Emberless with no name and no past. The only way out is through the Warden who holds the gate. Beyond lie five dying lands, each guarded, each with a beacon that might yet be relit.';

// Shown after the final boss falls (plain text; blank lines are not needed, each string is one paragraph).
export const ENDING = ['Vael Orrun falls, and for the first time in an age the sky holds still. Ash settles. Somewhere above the dark, a single light returns.', 'The Emberless walks home through the quiet lands.'];

// Banner when you enter a land (1 to 2 sentences).
export const REGION_LORE = {
  hollow: 'The keep that holds the last beacon. Its gate has not opened in an age.',
  marsh: 'Brine seeps from the old tideworks. The low water is poisoned.',
  clock: 'Brass districts that ticked until time itself stalled.',
  glass: 'Sand fused to glass beneath a sun that never set.',
  monastery: 'Bell-ringers prayed here until the cold answered.',
  forest: 'Each lantern holds a name. Do not blow one out.'
};

// Boss cutscene title card and health bar: name + one short line.
export const BOSS_LORE = {
  gate: { name: 'Orsolt, Warden of the Hollow Gate', sub: 'No one leaves the keep who cannot win their way out' },
  tide: { name: 'Tidemaw, the Tidal Colossus', sub: 'The flood remembers every drowned city' },
  queen: { name: 'Maribel, the Horologe Queen', sub: 'Time bends to her last word' },
  moth: { name: 'Prism, the Glass-Winged Knight', sub: 'Every reflection carries a blade' },
  choir: { name: 'The Frozen Choir', sub: 'Three ringers. They must fall in order' },
  forge: { name: 'Cinderhold, the Forge Titan', sub: 'The floor remembers the furnace' },
  shadow: { name: 'The Umbral Duelist', sub: 'It fights with your own arms' },
  warden: { name: 'The Lantern Warden', sub: 'Only your torch holds back the dark' },
  astro: { name: 'Vael Orrun, the Fallen Astronomer', sub: 'He rewrote gravity, and gravity forgot him' }
};

// Name + one sentence for each boss reward. (Only the name is used in game right now.)
export const RELIC_LORE = {
  gate: { n: "Warden's Signet", d: 'Placeholder: the signet that once opened the keep gate.' },
  tide: { n: 'Tidal Heart', d: 'Placeholder.' }, queen: { n: 'Rewound Mainspring', d: 'Placeholder.' }, moth: { n: 'Mirrorwing Shard', d: 'Placeholder.' },
  choir: { n: 'Hollow Bell', d: 'Placeholder.' }, forge: { n: "Titan's Ember", d: 'Placeholder.' }, shadow: { n: 'Umbral Sigil', d: 'Placeholder.' },
  warden: { n: "Warden's Lantern", d: 'Placeholder.' }, astro: { n: 'Crown of Stars', d: 'Placeholder.' }
};

// Lore-book entries for the codex screen (coming in the next update). Add as many as you like.
export const CODEX = [
  { title: 'The Lantern', text: 'Placeholder: what the Lantern was and why it went dark.' },
  { title: 'Hollow Keep', text: 'Placeholder: who built the keep and why it was sealed.' },
  { title: 'The Emberless', text: 'Placeholder: who you are.' }
];
