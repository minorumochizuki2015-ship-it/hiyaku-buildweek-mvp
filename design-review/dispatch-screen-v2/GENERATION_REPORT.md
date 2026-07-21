# HIYAKU Dispatch Screen v2 — generation report

## Method and reference conditioning

Generated with the built-in `image_gen__imagegen` tool in `ui-mockup` mode.
Its available parameters are `prompt`, `referenced_image_paths`, and
`num_last_images_to_include`.  It therefore supports local reference-image
conditioning; this was **not** a text-only fallback.  Each render attached
both of these references through `referenced_image_paths`:

- `public/assets/courier-kanto-card.png` — character identity/outfit and
  ukiyo-e-influenced rendering to preserve.
- `/Users/moc/Desktop/採用/採用.png` — the approved overall mobile UI mood.

The prompts explicitly removed the collectible/trading-card composition from
the hero and asked for one unified illustrated scene plus washi-ledger
preparation controls.  They used the existing screen palette: near-black
navy `#0a0c1d`/`#0c1022`, violet `#171631`/`#201a3c`, gold
`#f4b942`/`#fff0cb`, vermilion `#bc3d32`, cream `#f7f2e8`, and lilac
`#9c78ff`.

## Verified outputs

All files below were copied to this directory after generation and verified as
valid non-interlaced 8-bit RGB PNG images at 853 x 1844 pixels.

| File | Exact size | Distinguishing composition |
| --- | ---: | --- |
| `dispatch-screen-v2-a-moonlit-road.png` | 2,995,567 bytes | Courier walks toward the viewer down a moonlit Edo street; the lower ledger is a broad, curled scroll emerging from the road. |
| `dispatch-screen-v2-b-river-bridge.png` | 2,877,984 bytes | Three-quarter courier on a lantern-lit bridge/river scene; a tall clean ledger sits below, with a small narrator annotation in open sky. |
| `dispatch-screen-v2-c-map-preparation.png` | 2,896,547 bytes | Intimate kneeling pre-departure/map scene; the courier's physical map becomes the preparation ledger through a violet cloud transition. |

## Scope note

This task generated review-only image references. No application source,
existing asset, or worktree file was modified.
