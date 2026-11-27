# Models folder
Put `.glb` files in `assets/models/` and list them in `assets/manifest.json`, for example:

    { "models": { "player": "assets/models/player.glb", "enemy:Husk Soldier": "assets/models/husk_soldier.glb" } }

Key names: `player`, `enemy:<kind>`, `boss:<id>`, `weapon:<name>`, `prop:<name>`. See ../ASSET_SPEC.md for the exact requirements.
Nothing in the game reads these yet except the loader (`assets.js`); each model type gets wired in and tested when its first real GLB exists.
