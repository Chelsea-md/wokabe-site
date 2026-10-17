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
