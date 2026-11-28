# Ashen Realm: 3D model specification and prompts (for the 3D AI)

Everything here must be producible with free tools. Tool names below are suggestions from general knowledge and are NOT verified for current free limits or licenses: check each tool's terms before using its output.
Free pipeline idea: a text/image-to-3D generator (open-source options such as Hunyuan3D or TRELLIS have free demos) for the mesh, Blender (free) to clean up, scale and export GLB, and Mixamo (free Adobe account) to rig and animate humanoids.

## Pilot batch first (validates the whole pipeline)
1. `player` (knight), 2. `enemy:Husk Soldier`, 3. `weapon:Ashbrand Sword`. Only after these load and animate correctly in the game do we order the rest.

## Technical requirements (every asset)
- Format: GLB (glTF 2.0), embedded textures, no external files, no Draco/Meshopt compression.
- Axes and units: Y up, **+Z is forward**, 1 unit = 1 meter. Origin at the **center of the feet** on the ground. Apply all transforms (scale 1, rotation 0) before export.
- Size: knight about 1.9 m tall; Husk Soldier 1.8 m; other sizes below. Bosses are scaled in code too, so model them at a believable "1x" and tell us the intended multiplier.
- Triangles: player <= 12,000; enemy <= 8,000; boss <= 25,000; weapon <= 2,000; prop <= 3,000. File size <= 2 MB per character, <= 300 KB per weapon, <= 10 MB total.
- Materials: PBR metallic-roughness, at most 3 materials per character. Textures <= 1024x1024 (512x512 for weapons and props). Base color + normal + one packed roughness/metalness map.
- No lights, cameras, or background/base platform in the file. Mesh must be watertight enough to render from all sides; no flipped normals.
- Look: dark fantasy, desaturated, weathered metal and cloth. Palette anchors: ash grey, rust brown, deep crimson, dull brass, bone white, with one accent glow per creature (eyes, core, or weapon).

## Rig and animation (characters)
- Humanoids: standard humanoid skeleton (Mixamo-compatible naming is fine: Hips, Spine, Spine1, Spine2, Neck, Head, LeftArm/LeftForeArm/LeftHand, RightArm/..., LeftUpLeg/LeftLeg/LeftFoot, RightUpLeg/...). Skinned, max 4 influences per vertex.
- Required clips, named EXACTLY (case-sensitive), in one GLB: `Idle`, `Walk`, `Run`, `Roll`, `Backstep`, `Jump`, `Fall`, `Land`, `Attack1`, `Attack2`, `Attack3`, `HeavyAttack`, `ChargeLoop`, `Guard`, `Parry`, `Riposte`, `Hit`, `Stagger`, `Drink`, `Cast`, `Die`.
- Enemies and bosses need: `Idle`, `Walk`, `Windup`, `Strike`, `Recover`, `Roar` (bosses), `Stagger`, `Die`. Non-humanoids (Frost Shade, Glass Wisp, Tidemaw, Cinderhold) may use their own bone names: list them in a text note.
- Loop clips: Idle, Walk, Run, ChargeLoop, Guard. All others play once.

## Weapons
Separate GLBs. Origin at the grip, blade/length along +Z, edge facing +X. Real-world scale (sword blade ~0.9 m). One model per category is enough at first (15 categories); named variants come later.

## Prompts (paste into the 3D tool; add the pose line at the end of each character)
Pose line for characters: "Full body, A-pose, arms slightly away from the body, neutral expression, symmetrical, no ground, plain background."

**Player:** Armored wandering knight, layered worn steel and dark leather armor, steel helmet with a small crimson plume and a glowing amber visor slit, large rounded pauldrons, gauntlets, tattered crimson cape, scuffed boots, no weapon, hands open.

**Enemies (9)**
1. Husk Soldier: hollow undead soldier in a rusted kettle helm and ragged grey tabard, red glowing eyes, round wooden shield on the left arm, rusty sword in the right hand.
2. Ember Wretch: hunched emaciated humanoid with charred skin, two curved black horns, a glowing orange cavity in the chest, holding a burning torch-club.
3. Marsh Hag: stooped swamp crone with very long arms, grey-green skin, clawed fingers, torn hood, algae and reeds clinging to her rags, glowing green eyes.
4. Frost Shade: tall hooded spectral figure, tattered icy robe that tapers to nothing at the ground (no legs), pale blue glowing eyes, holding a staff topped with an ice crystal.
5. Tide Brute: massive hunched brute 2.5 m tall, teal skin covered in barnacles and kelp, huge fists, tiny head, glowing sea-green eyes.
6. Cog Sentinel: clockwork armored automaton, brass plates and exposed gears, glowing amber gear core in the chest, riveted helm with a slit visor, sword-arm.
7. Glass Wisp: small floating spectral figure of translucent glass shards, long clawed arms, pale cyan glow, no legs.
8. Bell Acolyte: hooded monk in frost-rimed robes, pale glowing eyes, carrying a staff with a small hanging bell.
9. Lantern Stalker: lanky forest predator with antlers, mossy dark-green hide, glowing amber eyes, holding a lantern on a pole.

**Bosses (9)** (names may change in the lore; these describe the visuals)
1. Gate Warden: 3.8 m armored gatekeeper in dull grey plate, ring of huge iron keys at the belt, tower shield, massive sword, closed helm.
2. Tidal Colossus: 6 m drowned giant encrusted with coral and kelp, water streaming from its body, sunken ship fragments embedded in its back.
3. Clockwork Queen: 4 m regal automaton in a brass gear-dress, crown made of clock hands, porcelain mask face, elegant but menacing.
4. Glass-Winged Knight: slender knight in crystalline armor with large translucent glass wings, a long thin blade, prismatic glints.
5. Frozen Choir: three hooded bell-ringers, each carrying a huge bell, icicles on the robes (deliver as ONE model; we tint it three ways).
6. Forge Titan: 5.5 m molten titan with anvil-shaped fists, cracked black rock skin glowing orange, chains hanging from the shoulders.
7. Shadow Duelist: human-sized swordsman that is a matte-black silhouette with a faint violet rim glow, no facial detail.
8. Lantern Warden: 4.5 m forest guardian in a long moss-covered coat, antlered skull head, many small lanterns hanging from antlers and coat.
9. Fallen Astronomer: 4.5 m gaunt figure in tattered star-patterned robes, a cracked crown, thin floating astrolabe rings orbiting the body.

**Weapons (15 categories):** straight sword, greatsword, curved saber, dagger, spear, halberd, single-bit axe, great hammer, whip, short sword (for dual wield), round buckler shield, shortbow, crossbow, wooden staff with a crystal, hand-held holy talisman on a chain. Each: worn, believable, dark fantasy, no glow unless a gem or crystal.

**Armor sets (6)** are a later batch because they must share the player's skeleton: Wanderer's Rags, Warden Leathers, Gilt Mail, Cinderplate, Colossus Harness. Fallback plan: deliver each as a full recolored player model variant.

**Environment (later batch):** castle wall segment (7 m wide, 11 m tall), round tower with conical roof, iron portcullis gate (8 m wide), beacon (stone pillar with a brazier), treasure chest (closed + lid separate), lever, anvil; per-region props: marsh reed clump, clockwork pillar with a gear ring, glass spire, ice pillar, lantern tree, plain dead tree; a stag-like mount.

## Delivery
For each asset send: the GLB, a one-line note of intended height in meters, the clip list, and any non-standard bone names. Put the file in `assets/models/` and add it to `assets/manifest.json` (see assets/README.md).

## Pilot status
No production model exists. A code-built test sword is kept only as a loader test fixture (`assets/dev/test_sword.glb`, not listed in the manifest, not used in the game). All three pilot assets (`player`, `enemy:Husk Soldier`, `weapon:Ashbrand Sword`) need the 3D AI. Manifest format and clip-name overrides: see ASSET_PIPELINE.md.
