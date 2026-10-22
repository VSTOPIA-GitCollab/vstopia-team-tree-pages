# Moving Clouds — existing Stillwater scene / local working branch

**22 October 2026.** In the OWNER'S EXISTING checkout and branch, not a
second version. Local path:

`/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-pages-organic-vegetation-texture-20261022`

Branch: `feat/organic-grass-and-stochastic-tex-20261022`.
Base: owner's local materials commit `5614d918f6502a9d5502e87e95494829d15844d6`.

## Source finding

The existing Sky.js sky had `cloudShader` drifting under the shared `time`
uniform, but the embedded scene intentionally used the CC0
`partly-cloudy-2k.hdr` and set `sky.visible=false;clouds.visible=false`,
thus hiding the procedural cloud mesh. Simply increasing `uTime` could
never move the actual photograph shown to users.

## Minimal, image-preserving implementation

Added `stillwater/moving-cloud-sky.js` (same repository). It makes a
low-poly, back-facing, camera-centered 7200m sky dome sampling the
**exact existing 2K HDR image**. World direction is mapped to equirectangular
coordinates, with horizontal UV displacement:

`uv.x = fract(uv.x + uCloudTime * 0.00026 * smoothstep(-0.015,0.18,worldDirection.y))`

Thus:
- **Photographic clouds drift** gently in the upper sky (0.00026 panorama
  wraps per second, about 0.53 pixels/second on the existing 2K image);
- at/below the skyline, the panorama stays still — no sliding mountains;
- the HDRI image stays the same, and the existing lighting/IBL PMREM,
  sun, water, trees, birds, fog, textures and liquid glass are not changed;
- on HDR load error, the original procedural sky fallback remains intact;
- `uCloudTime` is **the existing scene's shared clock** `time` and respects
  its paused state and tab visibility. No new RAF, interval, network asset
  or HDR environment prefilter per frame;
- the dome follows the camera **just before render** after orbit and
  autofocus operations, so there is no parallax for camera movement;
- simple dome shader uses exactly 1 HDR pixel lookup per fragment and no
  volumetric ray-marching. Mobile and desktop retain their usual FPS budget.

Release key in root → integration script → iframe script is locally
versioned `organic-grass-variation-20261022-moving-clouds-v1`. This is a
**local preview**, not an uploaded GitHub Pages version.

## Verification on the ORIGINAL checkout

- `python3 -m unittest discover -s tests -q`: **115 tests PASS**.
- `python3 scripts/validate_public_snapshot.py snapshot.json`: PASS.
- Node syntax `stillwater/scene.js`, `stillwater/moving-cloud-sky.js` PASS.
- Chrome headless WebGL real scene from the **original repo**:
  desktop `desktop-webgl`, mobile `mobile-webgl`, skyReady=ready,
  cloudMotion=hdri-clouds-drifting, 20 tree nodes, no JavaScript errors.
- Desktop frame counter advanced from 7 to 302 in the 12-second interval.
- On 1450×863 browser screenshot, cropped sky region
  `(x320–660, y115–190)` has mean absolute RGB pixel difference **8.88**
  between t=0 and t≈12 seconds. Under manual Pause the same region had
  **0.00** difference over an additional ~3 seconds.
  This is visual evidence of moving clouds and Pause actually freezing them;
  the rest of the scene can also move, so the sky ROI matters.
- Physical Safari iOS test is STILL NOT VERIFIED. The historic issue of
  animation immobility on real phones remains separately open.

### Evidence

- [Animated cloud sky at t=0](screenshots/clouds-original-checkout-desktop-t0-2026-10-22.jpg)
- [Animated cloud sky at t≈12s](screenshots/clouds-original-checkout-desktop-t12-2026-10-22.jpg)
- [Mobile scene with same clouds](screenshots/clouds-original-checkout-mobile-2026-10-22.jpg)

## Reuse in other scenes

If a scene has a static panorama but needs moving clouds, separate the
**visible sky background** from the **lighting environment**. Render a
camera-centered inside-out sky dome with a light UV flow limited to upper
sky, keeping terrain horizon static and IBL sky sampling unchanged.
Feed it an existing monotonic simulation time, not a new independent
timer. Test movement with camera orbit off and a fixed sky crop, then
manually pause and compare pixels. Only recompute IBL when truly
necessary; a cosmetic cloud drift should not re-prefilter HDR light
every frame.

## Safety and next actions

No cloud volumes, transparency stacked meshes, extra 2K downloads,
WebGL sky rebuild, color/layout updates or GitHub telemetry changes.
Do not publish a new version/branch without the owner's authorization.
All work goes into the current development checkout above. The temporary
duplicate checkout used earlier in this conversation should be removed
after final verification, because it was not requested.
