Flower vs Zombie: Base Defense - v5 design preview

CHARACTERS
Whole sprites, no limb parts. Three plant classes: Pepper Scout, Acorn Marksman, Pinecone Gunner. Each has ten authored fitted outfit/weapon looks, 30 in total. Rookie uses a small crude weapon with little clothing; ranks 8-9 add blue/purple and gold; rank 10 has a golden plant body and legendary fitted armor and weapon. Existing neutral characters and weapon/accessory studies remain archived.
Runtime connected-sprite isolation avoids neighboring atlas fragments while preserving original PNG files.

MOTION
Calm breathing idle; cheeky bouncing enemy walk; short hurt hop and intermittent bright tint. Hurt is additive and does not reset attack timers. Ground shadows shrink/lighten on hops and widen/darken on landing.

SCENES
User-provided logos appear only before entering play or after leaving play. No logo on boss entrance or stage preset changes. Boss reuses a larger sprite (150 world units) and a 4.2-second camera push/hold/return at 12 percent simulation speed. English stage names, replay and skip supported.

UI
Selected bright cartoon direction: red ribbon, lime actions, slate tray, cream/gold cards. English in-game text, Sunlight Rate and sunlight icons. Live deployment, merge, pause/resume and class/star/theme preview.

PRODUCTION
Character evolution, panel and field assets use built-in ImageGen. User original logo and UI PNGs are preserved unchanged. See fitted-outfit-prompts.json, legend-refinement-prompt.json, rig-prompts.json, ui-production.json, ui-skins.json and rigs.json.

SCOPE
Art, motion and UI preview; not final combat progression or balance. v4 remains unchanged.

COMBAT / BASE / PAUSE REFINEMENT
Five base forms: wooden hut > reinforced hut > greenhouse > fortified greenhouse > golden garden fortress. Click Castle Health to compare tiers.
All ranged enemies have independent firing cooldowns. Seeds, bolts and pinecone shells have separate shapes and trails. Facing follows the attack target.
Preview Star Upgrade replays the star burst. Drag merges use the same effect.
Base HP appears above the base for 3 seconds after damage, hidden during boss intro. Permanent health HUD removed.
Boss uses supplied warning artwork and gold nameplate with English labels. Pause uses a cream/gold card and RESUME / HOME.

FINAL USER SELECTION: garden base now uses cartoon-v5-garden-base.png (leaf roof and sun crest, five tiers). Earlier wooden / greenhouse atlas is preserved but inactive. Soft ground shadow and broad light surround the base.
Latest interactions: range only on hold or briefly after deployment; no persistent unit inspector or star badges; mint soul exit and gold upgrade ring use transparent generated VFX; PAUSED and RETURN HOME dialogs have centered icon/label groups.

PLANTS / EDGE ENTRY
Plants tab opens the four-card collection UI. Unlocked cards show stats; ACORN costs 100 and PINECONE costs 400 coins. The background repeats only the user-selected sprout. This is session-only UI state, not persistent main-game progression. Sunflower is included in the collection; combat and fitted star gear remain the three reviewed classes.
Initial enemies and replacements now spawn 85 units outside the map. An obstacle-aware path guides them around ground props. Boss entry waits until it has walked into the visible field.

PLANNED PURCHASE PROGRESSION
Main-game Plants must read saved purchase ownership. SUNFLOWER becomes purchasable after clearing stage 3, ACORN after 6, PINECONE after 9, then one additional plant every 3 cleared stages. This unlocks eligibility, not free ownership. Current illustrative collection state is intentionally unchanged until integration. See planned-purchase-progression.json.
Base growth demonstration: base-growth-preview.gif / base-growth-comparison.png (native preview captures, equal camera scale).
