# Alps Field photographic mountain layer — local QA and 360° wrap correction
Updated: 2026-10-22 20:29 BST
Status: CODED / TESTED LOCALLY; **NOT committed, pushed or deployed**.

## Project invariants

Canonical single checkout:
`/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-pages-organic-vegetation-texture-20261022`.
Existing `main` at `849c9f1`. No new branch, clone, worktree or alternate
project folder.

User wanted photographic distant real mountains behind the three original
Three.js ridges, without replacing the moving HDR clouds or altering scene
lighting. The source is *Alps Field* by Andreas Mischok, CC0 from
https://polyhaven.com/a/alps_field ; original 8192×4096 panorama:
https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/alps_field.jpg

## Architecture

- `scripts/build_alps_backdrop.py --source ORIGINAL_8K.jpg` uses an offline
  skyline trace and native-resolution refinement to remove sky and grass;
  outputs only a mountain RGBA band, as 8192×1020 and 4096×510 WebP.
- `stillwater/moving-cloud-sky.js`: renders the transparent photo inside
  the existing camera-centered moving-HDRI dome with separate still photo UV,
  rather than introducing another mesh or sky. The photographic sky remains
  transparent; the existing HDR sky clouds move behind it. Static PMREM/IBL,
  weather, water, birds, terrain and original 3D ridges remain unchanged.
- `stillwater/scene.js`: chooses 8K cropped mountain image for desktop,
  4K for mobile, safely falls back to original sky when image cannot load.
  Root/integration/iframe version IDs include `-alps-field-v1`.
- Backdrop slope and color values `uMountainsVerticalScale:2.85` and
  `haze=.30+.24*rain` preserve the accepted composition. These should not
  be changed to fix an azimuth wrap seam.

## Specific screenshot defects diagnosed

1. **Wrap at 0°/360°:** the *leftmost and rightmost columns of the source
   360° photo* do not match exactly. Its original summit silhouette at the
   two ends differed by roughly 22 source pixels. The browser repeats the
   photo longitude, resulting in a local vertical join, and the alpha
   transparency mismatch can expose a narrow strip of the brighter HDR sky.
   This does **not** affect every part of the mountain crest.
2. **Local light-blue distant mountains:** genuine source-photo colors vary:
   wooded patches near some longitudes have blue-red difference of only
   ~0–10 RGB levels, while farther bluish mountains in the photo often have
   blue-red difference of ~40–55. A uniform haze and alpha compositing
   therefore make those peaks locally brighter than the forests. This is
   source-photo atmospheric perspective, **not selective Three.js light**.
3. **Do NOT change the global skyline opacity, mountain height or colors**
   to hide the wrap: earlier attempts altered an otherwise accepted look.

## Targeted correction — ONLY periodic wrap

At the original 8K RGBA band boundaries, compute a common crest height.
Smoothly warp only the first/last 480 pixels (~5.9% per side), then apply
symmetric C1-smooth RGB and alpha corrections over those same narrow strips.
The other ~88.2% of the texture remains unchanged. The original narrow
upper-edge and bottom-edge fades were restored, as were the accepted
mountain vertical scale and haze.

QA after correction on real encoded files:
- **8K:** 360 seam first opaque ridge pixel at y394 / y394; alpha mean
  difference across border 0; RGB mean difference approx 2–4 levels.
- **4K:** first opaque ridge pixel y197 / y197; alpha mean difference ~0.2;
  RGB mean difference approx 9–10 levels (WebP encoder introduces residual
  differences; no large silhouette displacement).
- `tests/test_alps_field_panorama_seam_20261022.py` checks encoded crest,
  RGB+A boundary continuity, preserved HDR/cloud/haze constants.
- Browser Chrome WebGL desktop and emulated mobile locally reported 20/20
  scene labels/anchors, `mountainBackdrop=ready`, `skyReady=ready`, moving
  HDR clouds and zero captured JavaScript errors.
- Python full suite: 117/117 PASS (includes 2 new seam assertions);
  public JSON allowlist PASS and JS syntax checks PASS.
- **Not verified:** real Safari iOS visual quality/frame rate; user has not
  yet approved the final 360-degree appearance after this seam adjustment.

## Next steps

Inspect the 360° seam from an unobstructed camera angle on the user's Mac,
and compare the old x=0/x=8191 joined panorama. If a single region remains
unacceptably bright, retouch only that photographic region's intrinsic
exposure/sky contamination; never uniformly darken the full panorama.
No GitHub push/Pages deployment until the owner approves this local edit.

## Weather / Day-Night mountain occlusion regression — 2026-10-22 20:57 BST

**Bug report:** after changing Weather or Day/Night, the new photographic
mountains faded away, while the older procedural 3D mountains remained.

**Reproduced before changing source** in Chrome from the canonical local
server `http://127.0.0.1:39231/`: clear day showed the photographic Alps;
rain=1 removed almost all photographic detail, and night=0 erased its
silhouette. Screenshot evidence (QA-only temporary files):
`/tmp/vstopia-weather-mountains-before-{clear,rain,night,storm}.jpg`.
No JavaScript errors: this was a **render-order/alpha-compositing bug**.

**Root cause:** `moving-cloud-sky.js` renders the mountain photograph on
the 7200m HDR panorama dome at renderOrder=-10000, with depthWrite=false.
`atmosphere.js` then renders a separate 7100m day/night/rain sky
(renderOrder=-9999). The latter's alpha can reach **0.94** during rain or
**1.0** at night, completely overpainting the photographic mountains.
The procedural meshes are unaffected because their depth-test occludes the
atmosphere dome. This bug began when adding the photo backdrop, not the
earlier weather system itself.

**Scoped fix (no 3D geometry changes):**
1. Atmosphere now accepts the existing mountains texture, active flag, yaw,
   and vertical scale from the HDR dome with `bindBackdropMountains(...)`.
   The texture is **shared**, never fetched or instantiated twice.
2. Both shaders use the **same 360° equirectangular direction and cropped
   mountain UV**. The weather-sphere opacity is multiplied by
   `1 - mountainAlpha`, so procedural night/storm sky appears only where
   the photographic mountain pixels are transparent. Existing depth testing
   continues to protect 3D geometry. When the photo fails to load, the
   original sky overlay remains unchanged.
3. The HDR dome compensates the two-pass blend of semitransparent mountain
   edges to prevent a bright white outline of original daytime HDR sky
   against the night sky:
   `photoBlend = A / max(.0001, 1 - F*(1-A))`,
   where A=mountain mask alpha and F=weather sky opacity. Mathematically,
   the displayed image becomes `A*photo + (1-A)*mix(HDR, weather, F)`.
   For F=0 (clear day) the original photo and pixels are **unchanged**.
4. Cache tokens updated across root→integration→iframe→scene modules to
   suffix `-weather-occlusion-v1`, ensuring the local browser does not use
   stale shaders. No new checkout, branch, project directory or sky asset.

**QA after fixing:** Desktop Chrome WebGL tested clear day, full rain,
night, and rainy night with mountains still visible as weather-appropriate
terrain. The thin white HDR contour at night disappeared after the
double-blending correction. 430×930 mobile Chrome emulation additionally
tested clear → full rain → night → rainy night → **back to clear**;
all changes completed, 20 labels remained, HDR sky and photo mountain
reported ready, frame counts progressed (43 → 784), **zero captured JS
errors**. Physical iOS Safari remains unverified.

`tests/test_weather_mountain_occlusion_20261022.py` adds three tests
covering identical UV mapping, shared/fallback texture contract and
the algebra of weather-photo compositing. Total **120 Python tests PASS**,
all three pre-existing specialized node scene tests PASS, public GitHub
snapshot allowlist PASS, Node syntax PASS, `git diff --check` PASS.

**Release state:** Local `main` checkout based on `849c9f1` is intentionally
still uncommitted alongside the already staged-in-progress 360° Alps Field
backdrop. **NOT PUSHED / NOT DEPLOYED**. The owner explicitly requested
local inspection prior to any public release.

## Night lighting regression — atmosphere module identity (22 October 2026)

**Reported:** the 3D procedural mountain ridges on the local build stayed light
grey under Night + Rain, while the current live GitHub Pages build showed dark
mountains. Comparison showed different deployments: GitHub Pages remained
on `849c9f1` whereas localhost contained the **uncommitted** Alps Field
backdrop/weather overlay.

**Root cause verified in source:** the last local weather-overlay patch changed
the dynamic import in `stillwater/scene.js` to
`./atmosphere.js?v=waterfall-weather-v1-mountain-occlusion-v1`, but
`nature.js`, `lake-life.js`, and `mountain-waterfall.js` still imported
`./atmosphere.js?v=waterfall-weather-v1`. JavaScript ES modules use their
**entire resolved URL, including ?v query**, as module identity. Thus two
different instances of `atmosphereUniforms` were constructed. The visible
weather controls updated only the scene's new instance; mountain rock
`uAtmosphereLight`, waterfall, and fish used the old, daylight-default
instance. This was why real 3D mountains appeared bright at night. The
photographic mountains, which receive uniforms from the scene directly,
continued to darken normally.

**Fix:** all four importers now reference the identical module URL ending
`waterfall-weather-v1-mountain-occlusion-v1`. Import cache IDs for
`nature.js`, `lake-life.js`, `mountain-waterfall.js` and the existing
root/integration/iframe HTML chain were bumped to `atmosphere-shared-v1`
so browser refresh fetches the corrected module graph.

A briefly tested mountain-specific brightness multiplier was **removed**
after finding the real cause. Original `MeshStandardMaterial`, PBR rock
texture, lighting shader, custom program key (`rock-scan-woodland-v3`),
material colors and mountain geometry are preserved byte-for-byte aside
from `nature.js`'s single updated atmosphere import. This is a shared
state synchronization fix, not a re-lighting of the scenery.

**Browser evidence:** local Chrome desktop 1450×960: Day/clear and Night,
Night+0.5 Rain, Night+1 Rain and return to Day, all with photo Alps loaded,
20 tree labels and moving frames. 3D mountains now darken in the same
direction as trees and foreground; no white daytime ridges in storm/night,
zero JS/WebGL runtime errors. Earlier screenshots with the wrong uniform
module had grey mountain ridges even after testing an extra darkening
factor; the root cause was the disconnected state, not rock brightness.

**Regression:** `tests/test_shared_atmosphere_uniforms_20261022.py`
tests identical URL import specifiers across the four modules; original
PBR rock shader unchanged; and the entire cache-busting chain. Full suite
**123/123 PASS**. Three specialized Node regressions for weather/waterfall,
lake fish, and material relief all PASS; public snapshot privacy validation
PASS, Node JS syntax and `git diff --check` PASS.

**Status:** changed files and pano remain LOCAL / UNCOMMITTED. GitHub Pages
`main` remains `849c9f1`. No branch, worktree, clone, push or deployment.

## Restoration accepted: original crest, darker photographic mountain exposure — 2026-10-22 21:59 BST

**Owner decision:** Reject the six isolated curved mountain cards. The original single
180-degree non-repeating Alps Field mountain background looked better. During an
earlier restoration the summit shape was still wrong because the abandoned
cutout experiment had left two changes behind. The user now approves the
restored skyline and asks to darken ONLY the photographic mountain image.

**Precisely what was restored (CODED and VERIFIED):**
- Removed the isolated-card module `stillwater/mountain-cutout-panels.js` and
  its twelve `alps-cutout-*.webp` output assets; the existing 180° cropped
  `alps-field-mountains-8k.webp` / `-4k.webp` are the ONLY new photo terrain
  assets loaded at runtime.
- `scripts/build_alps_backdrop.py`: old top alpha was restored to
  `(y-skyline+1.8)/8.5`, replacing the later experiment's
  `(y-skyline-8)/26`. Removed the later terrain-RGB replacement at
  the crest, returning to original photo pixels. Old lower mask retained.
- `stillwater/moving-cloud-sky.js`: restored the visually accepted shorter
  skyline mapping `uMountainsVerticalScale=2.85`,
  `uMountainsVerticalOffset=0.0`. The source remains a nonrepeated 180°
  photographic portion, without any repeated 360° copy.
- The background looked right again in local Chrome desktop and mobile
  emulation: `/tmp/vstopia-alps-original-crest-desktop.jpg` and corresponding
  mobile capture. Both displayed photo+HDR sky ready, 20 labels/20 3D
  anchors and zero captured runtime JavaScript exceptions.

**New brightness change, isolated to the photograph:** added shader-only
`uMountainExposure:0.78`, applied to `photoRock` **after** the existing haze,
rain and daylight attenuation. This makes the photographed ridge roughly
22% darker, without altering the original encoded WebP pixel data, the
procedural 3D PBR mountain material, the moving HDR clouds, sun/moon,
grass, waterfall, lake, birds, or scene-global exposure. Day/Night remains
active and the photo stays dark at night. The exposure is one scalar and can
be changed reversibly without reprocessing an 8K texture.

**Caching:** existing canonical root HTML → integration script → scene iframe
entry URLs and the `moving-cloud-sky.js` import were version-bumped with
`-crest-restored-dark-v1` so a normal reload picks up the revised shader.
The shared `atmosphere.js` singleton URL is preserved, preventing the old
day/night lighting regression.

**Tests:** 124 Python unit tests passed; specialised Node checks for weather,
lake fish, and surface relief passed; public snapshot privacy check and
`git diff --check` passed. Verified the darker photograph in a local Chrome
WebGL render on desktop and emulated mobile, with `backdrop=ready`,
`sky=ready`, 20 labels/anchors and zero captured JS exceptions. Desktop
render: `/tmp/vstopia-alps-original-crest-darker-desktop.jpg`, matching
mobile capture. Real physical iOS/Safari remains **NOT VERIFIED**.

**Delivery state:** DOCUMENTED/CODED/TESTED/LOCAL WEBGL VERIFIED. **NOT PUSHED,
NOT MERGED, NOT DEPLOYED to GitHub Pages.** The only repository checkout is
`/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-pages-organic-vegetation-texture-20261022`
on local `main` with its existing uncommitted scene modifications. Published
GitHub `main` remains at `849c9f1`. No new branches or worktrees.

## Darker forest in front: authentic summit and original photographic brightness — 2026-10-22 22:27 BST

**User-approved intent:** retain the previously accepted far Alps skyline, and add a second darker wooded mountain photograph in front of it and behind the procedural 3D ridges. After reviewing the first prototype, user rejected the artificial faded/sinusoidal summit and the over-darkening of the inserted layer. **Final user instruction: leave the new image at its ORIGINAL brightness** (not the far mountain exposure, which was earlier approved as .78).

**Current implementation (local only):**
- New only `scripts/build_alps_midground.py` reuses the CC0 Alps Field **original 8192x4096 panorama**, taking an independent untouched-real RGB section (columns 0..4096); no 360 wrap, upscaling, panorama repetition, or fabricated heights. The real summit contour is refined from photograph edges/land-mask, ~2.5px alpha antialias; no imposed `np.sin` ridge, no 20px top fade, no permanent RGB reduction. Only invisible transparent pixels borrow adjacent terrain colors to prevent bright-sky mipmap halos. `--source ORIGINAL_JPG --overwrite` rebuilds `stillwater/assets/sky/alps-midground-8k.webp` (4096×1020) and `...-4k.webp` (2048×510). The approved original far mountain 8K/4K assets and skyline parameters are not changed.
- The optional new band is sampled inside the existing moving-cloud HDR dome shader; its separate alpha is layered in front of the old photographic band (which is itself behind real 3D mountain geometry). Render order and weather/night sky mask use the mathematically matching union of foreground/old mountain alphas in `stillwater/atmosphere.js`. No new mesh, no separate browser background, no extra rendering loop. The new terrain asset automatically falls back to the old background if it cannot load.
- At clear daylight its new RGB is used unmodified: `vec3 midRock=mix(nearRidge.rgb,uBackdropFog,.20*rain)` and `midRock*=mix(.075,1.,pow(daylight,.85))*(1.-.27*rain)`. Since rain=0 and day=1, both factors are exactly 1. Importantly **do not multiply new `midRock` by `uMountainExposure=.78`** (that old factor remains limited to the far photographic Alps previously darkened by user request). Night and rain still dim/mist both appropriately. Image asset URL `?v=real-crest-source-colors-v2` avoids stale cached darker WebP.
- Existing shared `atmosphere.js` ES-module identity remains consistent across scene/nature/fish/waterfall, and version IDs for local HTML/integration/iframe, both shader modules and the generated midground photo were bumped `-real-crest-v2`, preventing the earlier split-uniforms day/night bug.
- Browser localhost desktop & emulated mobile: `mountainMidground=ready`, far `mountainBackdrop=ready`, moving-cloud HDR `skyReady=ready`, 20 labels/anchors, no runtime JS exception. Verified image review: `/tmp/vstopia-alps-midground-real-bright-desktop.jpg` and `...-mobile.jpg`. Not tested on physical iOS Safari.
- Regression tests: `tests/test_alps_midground_layer_20261022.py` asserts the new layer does NOT use the far ridge exposure and preserves rain-only fog. Full 127/127 Python tests PASS, 3 targeted Node scene tests PASS, public snapshot privacy allowlist PASS, git diff check PASS.

**Release policy:** All changes remain uncommitted in the sole canonical repo directory, local branch `main` based on `849c9f1`; NO GitHub push or Pages deploy. Do not resurrect the 6 standalone cutout cards. Keep old user-approved far photo and bright new photo separated in future adjustments.

## Generated mountain source replacement and right-side placement — 2026-10-22 23:06 BST

**The owner changed the art workflow:** instead of continuing to cut, fabricate
or remap skyline contours from the Alps Field panorama, use the edited
mountain picture that the owner generated, downloaded and reviewed visually,
and replace only the single approved photographed midground asset.
Do not create a new checkout, feature branch, panoramic sky or extra set of
mountain cards. The former far Alps background and all 3D geometry remain.

**User-provided picture**: `/Users/ostino/Downloads/Mountain Valley Panorama on Black.png`,
2172×724 RGB image. It includes **black, opaque background**, not true
transparency (all alpha would be 255). Its SHA-256 when imported was
`d1c01a696afcb1c22a7e69599042de8549c2899804774576c431f79fe82706f8`.
Simply loading it as a Three.js texture creates a large black rectangle.
The import process therefore uses the largest connected nonblack component,
fills its irregular real mountain silhouette, antialiases only ~0.6 px and
reconstructs narrow RGB edge pixels to remove black-matte fringing. It
does **not** fade or alter the summit geometry/colors. Reusable command:

`python3 scripts/prepare_approved_mountain_texture.py --source "/Users/ostino/Downloads/Mountain Valley Panorama on Black.png"`

The script retains a single canonical transparent source at
`stillwater/assets/sky/approved-alpine-mountains-source.png` and rewrites
the existing active desktop/mobile texture pair
`approved-alpine-midground-8k.webp` (4096×1020) /
`approved-alpine-midground-4k.webp` (2048×510), fitting the photo
without changing its pixel aspect ratio, with alpha-only narrow L/R taper.
Original user Download is untouched. File paths are reused; only asset
loading query changes to `?v=dark-summit-replacement-v2`, and root/iframe
cache chain changes accordingly. This script is explicit and must never run
unattended as it replaces the two existing canonical image assets.

**Subsequent placement refinement requested by owner:** screenshot showed
the new photographed massif confined to a thin segment on the right.
The initial shader experiment `midUV.x = .5+(ridgeUV.x-.5)*1.38-.10`
shifted it further offscreen — REJECTED. An opposite experiment at
`+.22` filled essentially the whole horizon — too broad for the desired
right-side feature. Visually selected midpoint:
`midUV.x = clamp(.5+(ridgeUV.x-.5)*1.38+.13,.0005,.9995)`,
`midUV.y = clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995)`.
The panorama becomes moderately wider and higher, with its dark snow/rock
mass occupying the right-hand part of the view. Crucially, this exact UV
mapping was changed BOTH in `stillwater/moving-cloud-sky.js` and
`stillwater/atmosphere.js` so night and rain masks follow the actual
photo, avoiding the old silhouette halo. Original source textures, alpha
mask, far panorama, trees, terrain and water were not modified by this
placement operation. Full browser cache-chain suffixed `-right-wide-v4`;
all `atmosphere.js` consumers maintain the same resolved module URL.

**QA:** Chrome desktop + 430×930 mobile emulation both load
`mountainBackdrop=ready`, `mountainMidground=ready`, moving HDR sky,
20 labels/20 anchors and progressing frames; zero captured JavaScript
exceptions. Comparison captures:
`/tmp/vstopia-dark-summit-replacement-desktop.jpg` (too small, on edge),
`/tmp/vstopia-right-wide-high-v4-desktop.jpg` (shifted off right edge),
`/tmp/vstopia-right-visible-offset22-desktop.jpg` (fills whole horizon),
`/tmp/vstopia-right-visible-offset13-desktop.jpg` (chosen), with mobile
equivalents. Full 129 Python tests pass including new
`tests/test_approved_mountain_placement_20261022.py` that asserts identical
shader UVs, opaque/transparent WebP image properties, and original far
background still present; 3 specialised Node scripts and public snapshot
allowlist pass. Physical iPhone/Safari remains NOT TESTED.

**State:** local uncommitted `main` only, originally based `849c9f1`;
no push or GitHub Pages deploy; do not claim visual owner approval beyond
the reference image itself. Continue at `http://127.0.0.1:39231/`.

## HDR sky-lit photographic midground blend (local shader v5) — 2026-10-22 23:16 BST

**User instruction:** directly apply the atmospheric blending to the owner-approved
mountain photo through Desktop Commander, rather than supply manual copy/paste.
The owner noted that the mountain looked pasted into the scene and needed to
receive the reflected/lightened color of the sky. Crucially, the owner had also
rejected artificial fading of the summit and wanted its silhouette intact.

**Implementation:** only `stillwater/moving-cloud-sky.js` changes the color
of the NEW owner-edited photographic midground. It samples `uSky`, the actual
animated HDR sky panorama, at the same azimuth and +0.14 normalized latitude,
clamped to a sky-visible 0.59..0.86 V band. Sky irradiance sample is capped to
1.1 to prevent bright cloud HDR outliers. Its ambient tint is combined
with the shared fog color: `airLight = mix(uBackdropFog,sampledSky,.43)`.
The midground color has an atmospheric mix `.10 + .14 * upperHaze +
.20 * rain` (maximum .45), mild saturation adjustment `.91` and shadow/
contrast blending `.965`. Existing day/night light and rainy attenuation
remain, with rain coefficient now .25. **There is NO crest opacity fade** and
no modifications to the original transparent PNG, the generated WebP images,
the 3D mountains, moving clouds, lake, birds, terrain, or tree materials.
The previously user-chosen rightward placement remains at
`midUV.x = clamp(.5+(ridgeUV.x-.5)*1.38+.13,.0005,.9995)`,
`midUV.y = clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995)`.

**Night/weather masking:** `stillwater/atmosphere.js` remains unchanged.
That shader owns only the alpha weather-sky occlusion, **not mountain RGB**
grading. The exact UV transform and photographic alpha union are still shared
between both shaders, so a single silhouette applies on clear, rain and night.
The shared `atmosphere.js` ES module URL did not change; its singleton remains
intact. Root `index.html` → `stillwater-integration.js` → iframe
`stillwater/index.html` and the `moving-cloud-sky.js` importer cache URLs
were bumped `-skylight-v5` for browser refresh.

**Verification, local only:** `python3 -m unittest discover -s tests -q`
**129/129 PASS**; weather/waterfall, lake fish and surface material Node checks
PASS; public snapshot privacy validator and `git diff --check` PASS.
Local Chrome desktop and 430×930 emulated mobile both show
`mountainMidground=ready`, `mountainBackdrop=ready`, HDR sky ready, 20
anchors/labels and advancing frames; zero captured JS exceptions.
Day/clear, rain=1, night=0 and storm/night (day=.04,rain=1) QA all PASS
with no disappearing photographic or 3D mountains.
Screenshots:
`/tmp/vstopia-skylight-v5-desktop.jpg`,
`/tmp/vstopia-skylight-v5-mobile.jpg`,
`/tmp/vstopia-skylight-v5-weather-{clear,rain,night,storm}.jpg`.
Physical Safari/iOS remains **NOT VERIFIED**. The user has not yet given
a fresh visual approval of this actual shader render.

**Reusable workflow:** (1) owner produces and visually approves a rendered
photo cutout; (2) `scripts/prepare_approved_mountain_texture.py --source
<local PNG>` regenerates only canonical 8K/4K RGBA textures after explicit
review (opaque-black backgrounds require alpha reconstruction);
(3) preserve existing far Alps and 3D geometry; (4) tune atmosphere
**in shader color only** using sky sampling and fog, never synthesize the
summit or rescan the source photo; (5) maintain EXACT same UV silhouette
in weather mask; (6) cache-bust the shader + HTML chain; (7) test day,
night, rain and emulated mobile; (8) document and seek approval before
GitHub push/deploy. Never create extra checkout folders.

**Delivery:** CODED, TESTED, LOCAL WEBGL VERIFIED; NOT PUSHED, NOT MERGED
and NOT DEPLOYED to GitHub Pages. Existing dirty `main` protected.

## Local placement adjustment: slightly wider and reverse-direction v6 — 2026-10-22 23:26:46 BST

**User request:** make the generated mountain photo a little wider and move it
in the opposite direction to the last placement. Previous owner-suggested
numerical change was approved for direct execution via Desktop Commander:
replace UV scale `1.38` with `1.28`, offset `+.13` with `+.03`. This is
a **UV-relative shift, not a physical 45-degree camera rotation**. Its apparent
direction depends on the spherical panorama's azimuthal UV convention.
Height stays `.52+.065`.

**What changed:** exactly the same horizontal UV mapping was changed in
`stillwater/moving-cloud-sky.js` (photo sampling) and
`stillwater/atmosphere.js` (night/weather photo alpha mask). The original
sky-reflection/HDR color blending v5, RGB asset content, mountain top alpha,
cloud movement, 3D mesh terrain, lake and trees were NOT modified.
To avoid stale browser modules and split atmosphere uniforms, the common
atmosphere query token and all four importers were advanced together
`-leftstretch-v6`; the moving HDR module and the root → integration →
iframe cache tokens also gained `-leftstretch-v6`. The same single checkout
on dirty `main` remains authoritative; no reset, branch, new worktree,
commit, push or deployment.

**Verification:** 129 Python tests PASS, including exact parity of mountain
photo UV with weather mask and shared atmosphere import identity. JS syntax
and `git diff --check` PASS. Chrome local WebGL desktop / 430×930 mobile
emulation both show `sky/backdrop/midground=ready`, 20 labels and anchors,
advancing frame count, zero exceptions. Day, heavy rain, night, and storm
all completed without JS exceptions or lost mountains. Captures:
`/tmp/vstopia-leftstretch-v6-desktop.jpg`,
`/tmp/vstopia-leftstretch-v6-mobile.jpg`,
`/tmp/vstopia-leftstretch-v6-weather-{clear,rain,night,storm}.jpg`.
The photo appears farther towards the right side than the prior v5
placement, which is a visible/physical effect of the reverse UV offset
direction. Owner's in-browser aesthetic approval remains **PENDING**.
Physical iOS Safari and GitHub Pages remain **NOT VERIFIED/NOT DEPLOYED**.

**Next:** review `http://127.0.0.1:39231/` in the owner's actual view.
If horizontal movement direction is not as intended, use captured image
comparison, not trial-and-error new clones; change one x parameter with
both shaders in lockstep. Do not modify photo assets or unrelated layouts.

## User-reviewed localized sunlight suppression and inward-transparent mountain feather v9 — 2026-10-22 23:52 BST

**Problem and owner acceptance criterion:** The owner-approved photo cutout
still had sunlight permanently baked into its bright snow/rock when the Light,
Day/Night and Weather sliders changed. The initial automatic brightness mask
(v7) made too wide an area too dark. The user then requested a narrower,
less-strong highlight mask and an extra **slight transparent gradient along
the actual mountain silhouette**, not a broad hazy top or a modified sky.

**Source and geometry preserved:** No edit to the downloaded original black
background RGB image, the original far Alps photo or any 3D mesh/camera.
Canonical active photos only:
`stillwater/assets/sky/approved-alpine-midground-8k.webp`
(4096×1020) and `...-4k.webp` (2048×510).
The canonical `approved-alpine-mountains-source.png` is regenerated from
the original download, not manually painted over. The existing UV transform
is retained `midUV.x = .5+(ridgeUV.x-.5)*1.28+.03` and
`midUV.y = .5+(ridgeUV.y-.5)*.52+.065`.

**Lighting mask / source-sun removal (linear sRGB):**
- Uses source photo luminance, not sky RGB or a global exposure reduction:
  `sourceLuma = dot(nearRidge.rgb, vec3(.2126,.7152,.0722))`.
- Bounded mask after reviewer correction:
  `smoothstep(.22,.42,sourceLuma)*smoothstep(.49,.70,midUV.y)`.
  Prior rejected thresholds were `.12..30` and `.40..61`, catching
  substantially more pixels of non-sunlit forest/rock.
- Weather-gating based on `daylight`, `rain` and independently wired
  `uSceneLight`. The `Light` slider and 3D bridge both write to the same
  `photoSceneLight` uniform. Clear day/full light leaves the source
  photograph's bright highlight intact.
- Source-photo matte ceiling now `mix(.50,.20,cloudyShadow)` with mask
  strength `highlightMask*cloudyShadow*.64`, replacing the v7 hard
  `.46,.105` ceiling with strength 1. Final post-fog matte cap now
  `mix(.61,.22,cloudyShadow)` applied with strength `*.56`, rather than
  v7 `.58,.115` with strength 1. This prevents a static patch of apparent
  sunlight during rain/night without crushing broad mountain areas.
- Animated HDR sky remains sampled by the existing `skyLightUV`; at night
  and in rain the HDR sunlight contribution is already gated by
  `skyIllumination`. The photo texture RGB and skyline alpha geometry
  never enter the color mask.

**Inward-only edge transparency (not a Gaussian/blurred external halo):**
`scripts/prepare_approved_mountain_texture.py` now regenerates the RGBA
cutout and its normal desktop/mobile WebPs from the approved source, fits
the original photo without stretching, then computes
`cv2.distanceTransform(alpha>=128, DIST_L2, DIST_MASK_PRECISE)`.
Within the source terrain, a cubic smoothstep
`f*f*(3-2*f)`, where `f=clamp(distance/width,0,1)`, multiplies the
existing alpha. Width: **8 texture pixels desktop 8K, 4 mobile 4K**.
Outside the image, alpha stays 0, so no black fringe is added and the
skyline shape does not expand. Inner mountain stays opaque. The same
regenerated photo alpha is sampled by `moving-cloud-sky.js` and by
`atmosphere.js` for the rain/night occlusion, so they remain aligned.
Do not blur the entire frame, add top-to-bottom opacity fades, repeat
mountain cards or accumulate successive feather operations on an old WebP.

**Reproducible rebuild** (explicit overwriting of the two canonical assets;
the source download is never overwritten):

`python3 scripts/prepare_approved_mountain_texture.py --source "/Users/ostino/Downloads/Mountain Valley Panorama on Black.png"`

If the photo is replaced, update only its active asset query in
`stillwater/scene.js` and root/integration/iframe cache tokens consistently.
Current asset token: `highlight-mask-feather-v9`, HTML route token:
`-innergradient-v9`, shader token `-narrow-v9`.
The shared `atmosphere.js` module URL and photo/weather silhouette
mapping are not modified by this visual refinement.

**Tests and screenshot evidence:** 133 Python unit tests PASS including a
new numerical test verifying 4K/8K alpha transitions from transparent to
opaque within a few texels. Three Node scene regressions PASS, JS syntax,
public snapshot allowlist and `git diff --check` PASS.
Local Chrome desktop + emulated mobile: HDR sky/old ridge/new photo ready,
20 labels/anchors, frames advance, zero collected runtime exceptions.
Day, rain, night and storm, PLUS separate Light slider (1→0) with rain,
all rendered without disappearing mountain regions.
Captured screenshots:
`/tmp/vstopia-matte-gradient-v9-{desktop,mobile}.jpg`,
`/tmp/vstopia-matte-gradient-v9-weather-{clear,rain,night,storm}.jpg`,
`/tmp/vstopia-matte-gradient-v9-light-{day-maxlight,day-lowlight,rain-lowlight,night-lowlight}.jpg`.
Real physical iOS/Safari remains NOT VERIFIED. This is source/build +
local WEBGL VERIFIED, not proof of owner's final subjective signoff.

**Delivery constraints:** CODED + TESTED + LOCAL WEBGL VERIFIED only.
Not pushed, merged, or deployed to GitHub Pages. Protect dirty existing
`main` and all other agents' uncommitted files. Do not create another
worktree or new alternate asset branch. Owner should review locally via
`http://127.0.0.1:39231/` and only then authorize publication.

## Proven texture-edge defect: transparent RGB bleed / mipmapping (v10) — 2026-10-23 00:19 BST

**Owner screenshot** (22 Oct 22:58) showed a sharp line along the inserted
photographic mountain skyline. This was NOT proven to be a loading error.

**Isolation:** in desktop Chrome, reload once normally then with only
`*approved-alpine-midground-*.webp*` blocked via CDP Network.setBlockedURLs.
Normal data: `midground=ready, far=ready, sky=ready`; blocked data:
`midground=fallback, far=ready, sky=ready`. The dark snowy inserted mountain
outline disappeared; far Alps and all 3D terrain remained. Local proof:
`/tmp/vstopia-edge-isolation-{normal,without-photo}.png`.
The defect is in the NEW transparent photo layer, not sky/network loading.

**Direct RGB/alpha evidence:** before fix, decoded 4K WebP transparent texels
immediately outside the ridge contained almost-black RGB
(`(0,2,4,0)`, `(0,3,10,0)`), while adjacent visible rock was grey/blue
(`(134,138,143,255)`). Straight-alpha fragment shader texture2D samples
RGB and alpha separately. Filtering and mipmap downsizing mix black invisible
RGB into partly transparent edge pixels: a dark/coloured outline artifact.
This is the established **alpha bleed / edge dilation** issue in game
texture pipelines; background:
`https://github.com/iniGlowee/alpha-bleed`. The linked library was NOT
installed: fix implemented with the already available SciPy dependency.

**Actual fix:** the SINGLE existing
`scripts/prepare_approved_mountain_texture.py` builder now invokes
`scipy.ndimage.distance_transform_edt(~opaque,
return_distances=False,return_indices=True)` on the finished RGBA canvas,
where `opaque = alpha>=250`. It copies RGB from nearest genuine opaque
mountain texel into every `alpha<250` texel (including alpha=0). It
preserves the entire alpha channel, short approved inward gradient, all
fully opaque terrain RGB, original downloaded image, skyline shape and
the mountain's shader coordinates/light. The canonical
`approved-alpine-midground-8k.webp` and `...-4k.webp` were
regenerated in place. No other backdrop or worktree was created.

**After fix:** at the central 4K crest, decoded RGBA now transitions
`(77,80,92,0)` → `(74,79,93,40)` → `(73,80,93,127)` →
`(70,77,91,214)` → `(70,78,89,255)`; no abrupt black RGB
between invisible/visible pixels. A new regression test verifies
`alpha=0` RGB near the crest matches neighboring opaque mountain colour.
134 Python tests PASS, Python compile, JS syntax, `git diff --check` PASS.
Cache busts: `?v=rgb-bleed-ridge-v10` on active texture and
`-rgbbleed-v10` root/integration/iframe chain. Do NOT version the shared
`atmosphere.js` singleton for this image-only correction.

**Real WebGL QA:** Chrome desktop plus mobile emulation: HDR sky and both
mountain layers `ready`, 20 labels/anchors, frames advance, no collected JS
errors. Clear/rain/night/storm rendered normally. Captures:
`/tmp/vstopia-rgbbleed-v10-{desktop,mobile}.jpg` and
`/tmp/vstopia-rgbbleed-v10-weather-{clear,rain,night,storm}.jpg`.
The user must still approve the visual appearance on their own device;
real iOS Safari NOT VERIFIED. Local changes only, NOT PUSHED/DEPLOYED.

**Reusable rule:** for each user-approved image, reconstruct its real alpha
silhouette, fit without image distortion, apply tiny inward alpha gradient,
THEN **dilate mountain RGB into transparent pixels BEFORE encoding WebP**;
never leave (0,0,0,0) padding beside visible ridge. Decode/test edge pixels,
version asset URL, and verify on real browser with and without the layer,
and in day/night/rain/mobile. Do not "fix" by globally blurring the sky,
shifting mountains, or lowering opacity everywhere.

## Definitive dotted sky arc fix: branchless night mask texture sampling (v12) — 2026-10-23 00:45:02 BST

**Exact symptom and owner constraints:** The screenshot uploaded on
23 October at ~00:25 shows a long CURVED **DASHED BRIGHT LINE**
across the night sky, well ABOVE the regular silhouette of the inserted
mountains. The owner specified that this is a RENDERER BUG,
**not an image alpha feather/halo**. Preserve *all* existing RGB,
lighting levels, approved straight/irregular photo outline, both source
RGBA textures, clouds, water, terrain, 3D geometry and UI.

**Why v10 RGB padding and v11 48×24 matched sphere geometry were
insufficient:** Image alpha-bleed can cause true edge fringes, but this
line floats high above the image and remained unchanged after v10.
V11 sphere tessellation matching also did NOT remove it. Preserve
historical work as separate experiments; do NOT attribute this
particular dashed arc to their earlier diagnoses.

**Actual browser isolation, verified in Chrome via CDP:**
- Changed night slider to 0, rain to 0 and kept camera fixed.
- Disable ONLY `Day night and storm sky` ShaderMaterial: line disappears;
  the visible HDR cloud sky remains. Disable ONLY `Moving photograph
  clouds / horizon locked` ShaderMaterial: dashed line REMAINS over the
  otherwise dark night sky.
- With both rendered, set the weather overlay uniform
  `uBackdropMountainsVisible=0` at runtime: dashed line disappears,
  while disabling only `uBackdropMidgroundVisible` leaves the line.
  Hence problem is the FAR photographic mountain mask calculation
  **inside the night/weather shader**, not the approved near photo or
  the source texture RGB.
- Temporary shader visualization
  `gl_FragColor=vec4(vec3(mountainAlpha),1.)` reproduced the same
  isolated dashed horizontal arc AS WHITE MASK PIXELS well above
  the actual continuous mountain mask. The 4K/8K source alpha PNG/WebP
  contains only ONE connected mountain silhouette (no disconnected
  components) and the first/last ~10 texture rows are all zero-alpha.
  This proves a GPU sampling artifact, not a bad mask image.
- All runtime diagnostics were removed from `stillwater/scene.js`
  after testing. No hidden persistent debug hooks in source.

**Root cause (confirmed by shader A/B test):** the v11
`stillwater/atmosphere.js` shader contained a per-fragment spatial
condition:

`if(cropV>=0.&&cropV<=1.&&arcU>=0.&&arcU<=1.)`

with `texture2D(uBackdropMountains,ridgeUV)` and
`texture2D(uBackdropMidground,midUV)` INSIDE it. WebGL implicit UV
derivatives for mipmap selection are undefined at branches whose
condition differs between neighboring fragments. At the boundary
of the panoramic photo's angular crop this generated intermittent
incorrect alpha samples/dashed curved screen-space streaks.

**Minimal verified v12 fix:** Within the remaining uniform-only
`if(uBackdropMountainsVisible>.5)`, both `texture2D` calls run on
EVERY fragment of the weather sphere, sampling clamped RGBA coordinates
without pixel-dependent branching. Then multiply the alpha union by
the original spatial range mask **after sampling**:

```glsl
float arcVisible=step(0.,arcU)*step(arcU,1.);
float verticalVisible=step(0.,cropV)*step(cropV,1.);
vec2 ridgeUV=vec2(clamp(arcU,.0005,.9995),clamp(cropV,.0005,.9995));
float arcFade=smoothstep(.0,.10,arcU)*(1.-smoothstep(.90,1.,arcU));
float farAlpha=texture2D(uBackdropMountains,ridgeUV).a;
vec2 midUV=vec2(clamp(.5+(ridgeUV.x-.5)*1.28+.03,.0005,.9995),
                clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995));
float midAlpha=texture2D(uBackdropMidground,midUV).a*uBackdropMidgroundVisible;
float maskArea=arcFade*arcVisible*verticalVisible;
float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;
opacity*=1.-mountainAlpha;
```

This keeps the mountain-mask shape/position and night/weather sky RGB
unchanged. Both signed and unsigned image textures stay unchanged.
All four importers of shared `atmosphere.js` were advanced together
to `-branchless-mask-v12`, and root → integration → iframe HTML
cache chain advanced to the same name, so no two uniform singleton
instances are created.

**Objective A/B evidence:** identical camera/night via local CDP,
before branchless fix the top sky strip contained 457 high-intensity
near-white pixels (mostly the dotted arc); after this replacement
only 50 (stars/normal points), from the same fixed x/y crop.
The screenshot
`/tmp/vstopia-weather-branchless-zoom.png`
shows the arc GONE while photographed and 3D mountains remain.
The temporary fragment shader was restored after the A/B, then the
identical patch applied permanently to the ONE canonical checkout.

**Production-like fresh-load QA** from `127.0.0.1:39231`:
clear / rain / night / storm screenshots
`/tmp/vstopia-branchless-v12-weather-{clear,rain,night,storm}.jpg`;
desktop/mobile emulated WebGL screenshot
`/tmp/vstopia-branchless-v12-{desktop,mobile}.jpg`.
Night zoom `/tmp/vstopia-branchless-v12-night-zoom.jpg` has NO dashed
arc; both photo layers ready, 20 labels/anchors, frames advance,
and no collected JavaScript exceptions.
134 Python regressions PASS including explicit no-spatial-branch
test and matching mask math, 3 Node scene test scripts PASS,
public-only snapshot validator PASS, JS syntax and
`git diff --check` PASS. Real physical iOS/Safari not yet tested.
The owner has not yet visually signed off on their own browser.

**Reusable rule for future layered skies:** Never call implicit-
derivative texture sampling functions (`texture2D`, `texture`)
inside non-uniform per-pixel UV clipping conditionals. Sample
continuously (clamp UV), then multiply by a smooth binary/spatial
visibility mask. This avoids undefined derivatives at fragment
group boundaries in WebGL/Three.js. To isolate artifacts,
temporarily switch off one actual material at a time, then
visualize **mask alpha directly** rather than adjusting the image
color or alpha geometry. Any QA-only object hooks must be removed
from source before delivery.

**Release:** CODED, TESTED and LOCAL WEBGL VERIFIED, with
all prior dirty files preserved. NOT COMMITTED, PUSHED, MERGED
or DEPLOYED to GitHub Pages.
