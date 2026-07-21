# HIKYAKU G07 nutrition mock generation report

## Deliverables

Both variants are a single four-screen landscape sheet (four full-height mobile screens in reading order), rather than four separate PNGs.

| File | Real size | Image validation | Variant |
| --- | ---: | --- | --- |
| `variant-a-imperial-data-led-g07-flow.png` | 2,280,222 bytes | Valid PNG; 1717 × 916, 8-bit RGB, non-interlaced | A — data-led premium night: the score, dense nutrient table/radar, town impact, and recommendations are balanced evenly. |
| `variant-b-courier-story-g07-flow.png` | 2,486,710 bytes | Valid PNG; 1536 × 1024, 8-bit RGB, non-interlaced | B — courier-forward premium night: the character more visibly narrates the score, nutrient comparison, town impact, and next-day recommendation flow. |
| `GENERATION_REPORT.md` | 2448 bytes | Markdown report | Generation notes and reference-conditioning record. |

The PNG validity and dimensions above were checked after copying the generated files into this directory with the local file inspector. Both were visually reviewed after copy.

## Reference-image conditioning

The built-in generator accepts at most five reference images per call. The G07/G08 references were therefore conditioned across the two variants, not reduced to a text-only description:

| Required reference | Conditioning result |
| --- | --- |
| `P0IMG0096` G08 daily-report reflection | Used directly as a conditioning input for Variant A. |
| `P0IMG0091` G07 four-screen nutrition flow | Used directly for Variants A and B. |
| `P0IMG0092` G07 premium-detail patterns | Used directly for Variants A and B. |
| `P0IMG0095` G07 completeness/source-state board | Used directly for Variants A and B. |
| `P0IMG0093` G07 nutrient-to-town board | Used directly for Variants A and B. |

The specified `public/assets/dispatch-hero-v3b.png` was not present at the supplied path, so it could not be conditioned. This was **not** replaced with text-only conditioning: Variant B directly used the available approved adjacent courier reference `public/assets/courier-kanto-card.png`; Variant A used the courier direction in the prompt because its five conditioning slots were occupied by the five required G07/G08 reference sheets.

## Scope confirmation

Only the two PNG mock sheets and this report were added under `design-review/nutrition-g07-mock/`. No source file was edited and no Git add, commit, or other Git mutation was performed.
