# Pilot batch: ready-to-paste prompts (player + Husk Soldier)

These need a real 3D generator; the model work belongs to the dedicated 3D AI. The Ashbrand Sword (`weapon:Ashbrand Sword`) is part of the pilot batch too: "worn arming sword, straight tapered blade about 0.9 m, brass crossguard, leather-wrapped grip, round pommel; origin at the grip, blade along +Z."
Tool suggestions (NOT verified for current free limits or licenses, check before use): an image-to-3D or text-to-3D generator with a free tier or free demo (for example Hunyuan3D or TRELLIS demos), Blender for cleanup, Mixamo for free rigging and animation.

## Step A, optional: make a concept image first (many generators give better results from an image)
Prompt for any free image AI: "Full-body character concept art, front view, A-pose, plain light-grey background, no shadow. Dark fantasy. [PASTE THE CHARACTER DESCRIPTION BELOW]"

## Player (knight)
"Armored wandering knight, layered worn steel and dark leather armor, steel helmet with a small crimson plume and a glowing amber visor slit, large rounded pauldrons, gauntlets, tattered crimson cape, scuffed boots, no weapon, hands open. Full body, A-pose, arms slightly away from the body, symmetrical, no ground, plain background. Low-poly game character, PBR, weathered metal."

## Enemy: Husk Soldier
"Hollow undead soldier in a rusted kettle helm and ragged grey tabard, red glowing eyes, round wooden shield on the left arm, rusty sword in the right hand. Full body, A-pose, symmetrical, no ground, plain background. Low-poly game character, PBR, weathered."

## After the generator (all free)
1. Open in Blender. Delete everything except the mesh. Scale to 1.9 m (player) / 1.8 m (Husk). Origin to the center of the feet. Rotate so the character faces +Z in glTF terms (Blender: face -Y with Y-forward export off; check in a glTF viewer). Apply all transforms. Decimate to <= 12,000 triangles (player) / 8,000 (Husk).
2. Rig and animate: upload to Mixamo (free Adobe account), auto-rig, then download the animations listed below as FBX with skin.
3. Combine into one GLB in Blender and export glTF Binary (.glb) with animations on. Clip names must match EXACTLY.
   Minimum pilot clips: `Idle`, `Walk`, `Run`, `Attack1`, `Die`. (Full list is in ASSET_SPEC.md.)
4. Put the files in `assets/models/`, list them in `assets/manifest.json` under `player` and `enemy:Husk Soldier`, and send them to me.

Skeletal playback for characters is not wired into the game yet. I will wire and test it against the first real rigged GLB.
