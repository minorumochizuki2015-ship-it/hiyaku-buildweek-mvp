# HIYAKU Dispatch Screen v3 — generation report

## Method and reference conditioning

Generated with the built-in `image_gen__imagegen` tool in `ui-mockup` mode. Its
local reference-image conditioning accepts `referenced_image_paths`; both
renders used both approved references:

- `public/assets/courier-kanto-card.png` — the purple-haired courier's
  character identity, outfit, pack, banner, and illustrative treatment.
- `/Users/moc/Desktop/採用/採用.png` — the approved dark navy/violet mobile UI
  mood and gold framing treatment.

The new renders deliberately retain the successful moonlit-road and
river-bridge directions from v2, while moving the full figure into a dedicated
upper scene area and reserving a complete lower ledger area.

## Defect-by-defect visual check

| Prior audited defect | Fixed? | How the retained v3 output shows the repair |
| --- | --- | --- |
| 1. v2-A's circular gold CTA was cropped by the bottom canvas edge. | **Yes.** | In v3-A, the fully drawn gold `BEGIN DISPATCH` CTA ends at approximately y=1,752 of the 1,846px canvas, followed by about 94px of visible violet canvas. It is not clipped. v3-B also keeps its complete CTA above a visible lower margin. |
| 2. v2-B and v2-C obscured or cropped the courier's legs; every variant must be full-body. | **Yes.** | v3-A shows the courier from hair to both complete boots, with boot soles visible immediately above the ledger at approximately y=760px. v3-B likewise shows head, coat hem, both lower legs, and both boots/soles before the ledger begins at approximately y=800px. No retained v3 variant crops or overlays the lower body. |
| 3. v2-C added an unrequested `CHANGE ROUTE` control. | **Yes.** | Neither v3 screen contains `CHANGE ROUTE`, route editing, or a route-changing button. The Run section only presents a readout (`Distance 6.3 km` in A; `Distance 5.0 km` in B). |
| 4. v2's Meal section had only a six-level quality selector and no visible route to a separate nutrition screen. | **Yes.** | Both v3 screens replace the quality selector with separate `TYPE` and `AMOUNT` inputs, a one-line `AI preview`, and an underlined gold `View full nutrition report ->` element directly below. This visually identifies a distinct, tappable Nutrition Report destination without rendering that screen on Dispatch. |

## Verified output files

Both files were copied into this v3 directory, decoded successfully by `sips`,
and report `format: png` at 852 × 1846 pixels.

| File | Exact size | Composition |
| --- | ---: | --- |
| `dispatch-screen-v3-a-moonlit-road.png` | 2,414,307 bytes | Moonlit Edo street; standing full-body courier, complete dark-violet ledger, regular rice-bowl meal input. |
| `dispatch-screen-v3-b-river-bridge.png` | 2,296,986 bytes | Lantern-lit river bridge; standing full-body courier, complete dark-violet ledger, light bento meal input. |

## Visual QA measurements and candidate status

These are review candidates, not production-integrated assets; human selection
is still required before any app use. The static-image check used the
appropriate method for this artifact type: direct rendered-image inspection
plus decoded PNG metadata, not runtime/device acceptance.

| Measure | v3-A | v3-B |
| --- | ---: | ---: |
| Canvas | 852 × 1,846px | 852 × 1,846px |
| Scene through courier feet | ~780px (42.3% height) | ~802px (43.4% height) |
| Visible space from CTA bottom to canvas bottom | ~94px (5.1% height) | ~95px (5.1% height) |
| Separate Meal destination | 1 visible, underlined report link | 1 visible, underlined report link |
| Route-changing controls | 0 | 0 |

## Scope

This delivery contains only new review PNGs and this report under
`design-review/dispatch-screen-v3/`. No source code, existing asset, or Git
state was modified.
