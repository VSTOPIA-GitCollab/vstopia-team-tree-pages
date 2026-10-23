# Protected night-sky WebGL fix and reusable 360° shooting stars

Updated: 2026-10-23 (BST) · Project: VSTOPIA Living Tree / Stillwater · Branch: one canonical `main` checkout.

## Accepted sky-seam bug fix — DO NOT REINTRODUCE

**User acceptance 2026-10-23:** the intermittent high, curved, dashed white line in the NIGHT SKY was solved. This was **not** the normal irregular mountain silhouette, a colour/brightness issue, or a photo alpha halo. The user explicitly accepted the appearance and requested durable documentation so later scene authors do not undo the repair.

**Real cause and isolation:** within `stillwater/atmosphere.js`, an older per-pixel conditional `if(cropV>=0.&&cropV<=1.&&arcU>=0.&&arcU<=1.)` enclosed `texture2D` samples of far/midground photographic masks. Different fragments within one GPU derivative group entered different branches. GLSL implicit UV derivatives used for mip selection then became undefined at the mask crop boundary, creating intermittent spurious far-mountain alpha above the actual photographed skyline. Chrome CDP material toggles showed the line existed only in the night/weather shader; displaying `mountainAlpha` directly showed the same disconnected mask pixels. The source 4K/8K alpha texture did not contain that shape.

**Keep the accepted fix:** `texture2D(uBackdropMountains,ridgeUV)` and `texture2D(uBackdropMidground,midUV)` run uniformly for every fragment within the *uniform-only* `if(uBackdropMountainsVisible>.5)` branch, with UVs clamped into 0–1. Then compute `arcVisible`, `verticalVisible` and the existing `arcFade` and apply their product **after the texture samples** to `mountainAlpha`. Do not put either texture sample inside `if` driven by `cropV`, `arcU`, dynamic `uv`, fragment coordinate or camera ray. Preserve the original mask math, photographic image RGB, photo feather, darkness and atmospheric lighting. Equal 48×24 spheres were an earlier inconclusive experiment, **not the true fix**; RGB edge dilation v10 addressed a different fringe.

**Source/tests:** `stillwater/atmosphere.js`, `tests/test_weather_mountain_occlusion_20261022.py`, `tests/test_shared_atmosphere_uniforms_20261022.py`. Prior fixed-camera night A/B: bright sky-pixel count **457 before → 50 after** (remaining legitimate stars). Independent user confirmation: solved. Root/integration/iframe cache URLs and **all four importers** of shared `atmosphere.js` must remain coherent: URL query strings are part of ES module identity. Detailed historical diagnostics are retained in `docs/ALPS_FIELD_PANORAMA_SEAM_LOCAL_2026-10-22.md`, section `Definitive dotted sky arc fix ... (v12)`. Do not delete prior evidence.

### Portable shader debugging method for future scenes

1. Take matched camera/day/night/rain screenshots. Identify whether the artifact tracks a source texture boundary, geometry, or the sphere latitude. Do not recolour to conceal a bug.
2. Disable **one actual material at a time** (not a JS variable captured before asynchronous resource loading). Identify which render pass owns the artifact.
3. Visualize **mask alpha** directly in the offending shader and inspect uncompressed source texture alpha pixels/components. This separates image defects from GPU sampling errors.
4. Examine per-fragment `if` branches around mipmapped texture fetches. Make sampler execution uniform; clamp coordinates; apply coverage only **after** sampling.
5. Remove all temporary debug hooks; retain a negative regression guard, actual night screenshot, mobile emulation check, and user's acceptance note before release.

## Shooting-star system and 360° coverage

**Code:** `stillwater/shooting-stars.js`; integrated only in `stillwater/scene.js` (single pre-existing RAF), native controls in `stillwater/index.html`; Node regression: `scripts/check_shooting_stars.mjs`.

- One shared `THREE.PlaneGeometry(1,1)`; eight **bounded, pooled** GPU quads and shaders, each facing into the world-space celestial sphere. The meteor quad is camera-centred at the same sky range on each frame, not a DOM/canvas screen overlay; geometry is depth-tested, depthWrite=false, behind the 3D mountains and in front of the background weather dome.
- Meteor origin is a world-space unit direction at an elevation above the horizon, and motion follows a short angular great-circle approximation (`uStart*cos(t)+uTangent*sin(t)`). Streak width, head/tail brightness, speed and fade envelope are controlled per event. No animated image files, extra requests, particle explosion, new timers or PMREM rebuild.
- Global deterministic scheduler uses the shared pause-aware simulation `clock.value`. At **default frequency 25** an individual streak is scheduled about **70–180 simulated seconds** apart; short duration approx 0.6–1.0 seconds, no persistent streaks. **0** disables events. Raising frequency shortens the waiting time nonlinearly; above 55, pairs may appear and above 85 groups of three spread across sky sectors.
- **All directions:** eight azimuth sectors span 360°. Sector selection cycles with coprime step 3, so successive events do not keep appearing in the same direction. On higher settings one member of each group is aimed into the upper portion of the user's current view, with the other stars distributed across different world-space sectors. On default rare settings, events retain unbiased azimuth rather than following the viewer.
- **Nature/weather response:** `meteorVisibility(day,rain)` gives zero in day, gradual visibility through dusk and stronger brightness at night. Cloud/rain attenuation reduces visibility; full rain suppresses it. At no setting should meteor frequency force streaks to appear in daylight.
- The native **The atmosphere → Shooting stars** slider exposes `Off / Very rare / Occasional / Frequent / Very frequent`, default **Very rare (25)**. The input reschedules immediately, including a true off state; there is no independent meteor clock or simulation outside the page's own existing RAF.
- Reuse this pattern in future scenery: seeded events, one master clock, geometry pooling, world-space azimuth coverage, responsive user-adjustable rarity, and lighting/weather-driven visibility. Do not replace the validated night weather mask when adding other sky effects.

## Verification and release criteria

Run from the one canonical checkout:

```bash
/Users/ostino/.nvm/versions/node/v24.18.0/bin/node scripts/check_shooting_stars.mjs
python3 -m unittest discover -s tests -q
python3 scripts/validate_public_snapshot.py snapshot.json
git diff --check
```

Also check specialized Node scene tests, browser WebGL/GLSL console in daylight/night/storm, live slider input and pause behaviour, desktop and mobile emulation, a visible meteor in the top of the current camera view at high frequency, absence of old sky arc, and unchanged 20 public aliases. Physical Safari is a separate real-device gate. **Commit/push state must be recorded from live Git evidence; this document alone proves no deployment.**
