# Writing lore for Ashen Realm

All the story text lives in one file: **lore.js**. Open it in any text editor (Notepad works) and replace the text between the quotes.

## What you can write
| Section | Where it shows up in the game | Length |
|---|---|---|
| `INTRO` | Opening screen (and the H help screen) | A few sentences to 3 short paragraphs |
| `REGION_LORE` | Banner when you enter each of the 6 lands | 1 to 2 sentences |
| `BOSS_LORE` | Boss cutscene title card + health bar (`name`, `sub`) | Name, plus one short line |
| `CLASS_LORE` | The 8 starting classes: a name and a one-line description each (keep the keys) | 1 sentence each |
| `ENDING` | Ending screen after the final boss (a list of paragraphs) | 1 to 3 short paragraphs |
| `RELIC_LORE` | Name + description of each boss's reward | Name + 1 sentence |
| `CODEX` | A lore-book screen in the next update | Any number of entries |

## The world (so far)
You start inside **Hollow Keep**, a walled castle, and cannot leave until you beat its Warden, **Orsolt** (the first boss). Beyond the gate are five lands: **Sunken Salt Marsh**, **Clockwork Ruin City**, **Glass Desert**, **Frozen Monastery**, **Lantern Forest**. Each has a boss (plus a second boss in the clockwork and forest lands), nine bosses in total. The final boss is **Vael Orrun, the Fallen Astronomer**, in a far-north observatory. The player is an "Emberless", relighting 6 beacons. There is no leveling: power comes from gear, upgrades, flasks and boss relics. Later updates add towns, merchants, trading and quests. Everything is original: please don't use names or lore from other games.

## Rules so nothing breaks
- Don't rename the words on the **left** (`hollow`, `marsh`, `gate`, `tide`, `queen`, ...). Only change the text on the right.
- Keep every quote mark and comma. Use \' before an apostrophe inside single quotes (it\'s), or use "double quotes".
- Plain text only: no `<` or `>` characters.
- Don't rename the beacons (the tutorial looks for "Hollow Beacon").
