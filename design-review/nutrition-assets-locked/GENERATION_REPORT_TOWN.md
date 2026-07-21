# Town illustration generation report

Generated 2026-07-21 with the built-in image-generation workflow, conditioned on `town-scene-illustration-only.png`.

| File | Real size | Image validation | Visual text/bubble inspection |
| --- | ---: | --- | --- |
| `town-scene-no-bubbles-v1.png` | 2,383,193 bytes | Valid PNG; RGB; 1543 x 1019 px | Confirmed by visual inspection: zero baked-in readable text or speech bubbles. |
| `town-scene-no-bubbles-v2.png` | 2,370,690 bytes | Valid PNG; RGB; 1544 x 1019 px | Confirmed by visual inspection: zero baked-in readable text or speech bubbles. |

Both variants retain the requested isometric nighttime market scene and remove the reference image's dialogue balloons. No source-code or Git changes were made.

Note: `public/assets/dispatch-hero-v3b.png`, the requested secondary palette reference, was not present in this checkout; palette matching was based directly on the approved town reference.
