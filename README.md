# VSTOPIA — GitCollab Public Tree

**Public GitHub Pages preview**, with an animated and interactive tree and an encouraging supervisor. The tree's project names and node-level activity are explicitly **illustrative**. They are not private repo names or private contributor activity.

Five headline metrics are **real aggregated counts** from a narrowly selected subset of VSTOPIA-GitCollab repositories: repositories which both collaborators can access. These counts are intentionally published in `snapshot.json`. The file includes schema/version, scope, capture timestamp, aggregate organizational counts, and only the two user-authorized personal contribution and task-queue summaries. No repository identifiers, commit messages, PR titles, repository URLs, discussions, review details or credentials are included. **The owner explicitly approved public display** of the two collaborator names and GitHub handles, their total default-branch mapped commit counts, authored PR count, merged-by PR count, observed push events during the last 30 days, and the date/type of last recorded interaction. These personal aggregates are now intentionally public.

Push counts are **observed GitHub Events API PushEvent records for the last 30 days** and may not be complete if event history is truncated; they are not an all-time push count. The last recorded interaction is based on observable GitHub events, with a mapped commit timestamp fallback. Service account `VSTOPIA` contributions are **not** silently attributed to `ostinsolo`. These figures must not be presented as measures of effort or productivity.

## Static hosting

Publish the root of the public repository with GitHub Pages → Deploy from a branch → `main` → `/ (root)`.

- `index.html`, `style.css`, `app.js`: browser-only tree and supervisor, no API credentials.
- `snapshot.json`: deliberately public sanitized aggregates, initially generated from the private source with explicit allowlisting; refreshed by the **private** VSTOPIA Team Tree GitHub Action when owner-provided scoped secrets are configured.
- Reopening the page checks `snapshot.json` immediately. An open tab re-checks every 5 minutes. The private Action is configured to generate the snapshot hourly; GitHub scheduled workflows may run late.

## Important distinctions

- The displayed anonymous project labels and their per-node commit/Issue/PR example counts are **demonstration content**, not real data.
- Only the aggregate cards are backed by `snapshot.json`.
- All-time merges are a historical count, not merges today or this week.
- The public snapshot is visible to everyone. GitHub Pages provides no repository-member-only access in this deployment.
- Do not move the private source backend, personal contributor metrics, private repository names or tokens into this public repository.
- For private task details and collaborator-specific supervision, use the separately authenticated application, not public GitHub Pages.

## Assigned work and review requests

The public collaborator cards include aggregated **open issues assigned**, **open PRs assigned** and **explicit individual pending review requests** from GitHub. Draft PRs are excluded from the review-request tally. Issue and PR assignments are counted separately. A PR is not considered a review obligation merely because it is open; the user must be in its `requested_reviewers` collection. These counts are a pending work queue, **not** a productivity rating, deadline, or inference from lack of commits. Node names and individual per-project activity remain illustrative, not real.


## Realistic 3D scene & glass UI

The optional, self-hosted EZ-Tree / Three.js oak uses a licensed sky photograph and liquid-glass CSS. See [the scene runbook](docs/REAL_TREE_LIQUID_SKY.md) and vendored MIT licenses. Browser without WebGL continues to receive the prior animated Canvas tree. The visible project labels are synthetic; public GitHub activity is aggregated and must never expose private repository contents.

## Wide Council garden scene — 21 October 2026

The 3D scene has a wide layout and a bottom horizontal GitHub stats bar, physically lit foliage with sun shadows, stochastic anti-tiling PBR meadow shading with HDRI-edge blending, and a functioning snail-to-rabbit wind speed slider. See [implementation and QA notes](docs/SCENE_POLISH_2026-10-21.md) and [desktop screenshot](docs/screenshots/scene-polish-2026-10-21.png). The speed-slider interpretation is not claimed to reproduce Marcello's original unavailable Council code.


## Right floating LIST + HDRI color match (21 October 2026)

`LIST` now opens a right-side liquid-glass drawer while preserving the active animated Three.js tree, rather than replacing it. Close by clicking `LIST` again, `3D REAL TREE`, `×`, or `Escape`. The list contains demonstrative branch names only.

`ground-blend.js` retains existing stochastic anti-tiling and distance feathering. `scripts/calibrate_ground.py` and the public-safe numeric `assets/calibration/ground-grade.json` apply robust multi-point linear-sRGB terrain/HDRI grading, followed by a restrained left/right color adjustment based on real browser measurements. See [color and interaction notes](docs/RIGHT_LIST_HDRI_COLOR_MATCH.md), [right-drawer screenshot](docs/screenshots/right-list-open-2026-10-21.png), and [calibrated meadow screenshot](docs/screenshots/terrain-hdri-calibrated-2026-10-21.png). The user's original desktop screenshot is **not** published.


## October 21 — Apple glass, planted trunk, extended garden

The redundant LIST drawer has been removed (the searchable sidebar remains the canonical project navigator). The stage uses a 16 km world mesh with longer HDRI transition, adjusts the EZ-Tree geometry’s true bounding-box base to the PBR terrain, and includes 12 procedural shrubs built from shared EZ-Tree branches and an instanced 3D leafy canopy (3,120 small lobes, one draw call). The interface uses the macOS system SF font stack and a self-hosted, small React island built with the **actual** MIT [`rdev/liquid-glass-react`](https://github.com/rdev/liquid-glass-react) library on prominent glass controls. The 3D tree and sidebar stay in plain JavaScript. See [implementation notes](docs/APPLE_GLASS_GROUNDED_GARDEN.md).

## Project labels attached to actual branches (October 21, 2026)

The Three.js tree now displays **only clickable project name labels** in its scene. It has no extra legend, instructions, rhythm slider or mascots; the redundant footer counts and Auto Tour/Reset View controls have been removed to enlarge the scene and the lower intelligence panel. Wind animates at a fixed maximum 2×, while the user may still orbit/zoom with pointer, wheel and keyboard. Each label now anchors to a real vertex on EZ-Tree's bark mesh (`tree.branchesMesh`) and is reprojected with the world/camera matrices every frame, rather than using imaginary spherical coordinates or screen edge clamps. See [the technical correction](docs/SCENE_LABEL_ANCHOR_FIX.md), [desktop screenshot](docs/screenshots/anchored-project-branches-2026-10-21.png), and [mobile screenshot](docs/screenshots/anchored-project-branches-mobile-2026-10-21.png).

## Living Garden V2 — water and breathable glass UI (21 Oct 2026)

Wide Three.js stage with a reflective HDRI lake and continuously flowing creek, real carved shore geometry, stones, 10,000 five-leaf grass tufts plus 28 EZ-Tree-derived shrubs. Right inspector now contains branch details, team supervisor and verified member summaries; below is only a five-metric liquid glass strip. Read [technical notes and upstream sources](docs/WATER_GARDEN_2026-10-21.md).


## Living Garden V3 — irregular remote lake, full-length river and actual glass underlay

The public Three.js canvas now extends **behind** the header and glass UI panels. The redundant public-aggregates disclaimer block was removed from the sidebar while backend privacy validation remains. The lake is an irregular triangulated polygon away from the main EZ-Tree, now visible on the left; its feeding creek starts near the 16 km terrain's western edge, with wider banks and physically carved riverbed. More meadow and natural riverbank grass groups (33,000 five-blade tufts), angular deformed boulders scattered throughout the landscape (~220 visible instances), and no pebble ring around the lake. The large right inspector presents both members and task cards without nested scrolling.

A single original MIT [`@specy/liquid-glass-react`](https://www.npmjs.com/package/@specy/liquid-glass-react) WebGL island provides the header's optical refraction; other containers use existing self-hosted liquid-glass-react optical surfaces and low-opacity backdrop glass. Avoid spawning a WebGL renderer for every small card. Full V3 build/QA notes and multiple rotated screenshots: [Natural Garden V3](docs/NATURAL_GARDEN_V3_2026-10-21.md).


## Readable collaborators / white glass labels (October 21, 2026)

Both public team cards now use a responsive two-column internal layout: readable 2×2 commit/PR metrics alongside three independent work-status rows and full-width latest-activity dates. The side rail is slightly wider, no child card scroll/clipping is allowed, and the glass overlays display white text (including selected tree labels) with subtle HDRI-safe text shadows. See [implementation notes](docs/TEAM_CARDS_READABILITY_2026-10-21.md) and desktop/mobile screenshots.

## Connected lake, animated cascade and flocking birds (October 21, 2026)

The giant irregular lake and long river now share **one Three.js reflective water surface**, with an animated rocky waterfall, spray and foam, 30 animated birds in three small flocks, and wildflower patches. The redundant supervisor clover was removed. See [implementation and source references](docs/WATERFALL_FLOCKS_CONNECTED_WATER_2026-10-21.md) and the five real browser views linked there.

## Local visual experiment — user-supplied Stillwater scene × VSTOPIA

The current local-only branch `feat/stillwater-base-integration-local-20261021` uses the **user's original Stillwater — Ancient Grove v1.1** scene, not the earlier procedural EZ-Tree or Alpine mockup. The original Three.js r180 renderer, ancient tree, physical sky/PMREM, planar-reflected lake, rocks, mountains, foreground grass, camera and Atmosphere sliders remain under `stillwater/`; VSTOPIA appears as translucent glass UI around it. The public GitHub Pages app is unchanged.

On the main Mac:

```sh
python3 -m http.server 38995 --bind 127.0.0.1
```

Open [the combined local VSTOPIA website](http://127.0.0.1:38995/) or [the original full-screen Stillwater scene](http://127.0.0.1:38995/stillwater/). In the integration, **wind starts at 2/2 and light at 1/1**, the source sliders remain available through **The atmosphere** dropdown, the old bushes/short grasses/flocks are integrated, and 12 actual bark-vertex project labels can be revealed with **SHOW 12 BRANCHES**. The website still uses public-only GitHub statistics; there are no private repo tokens or backend dependencies. Controls remain original: drag orbit, right/Shift-drag pan, wheel zoom, `F` home and `H` native UI. No merges or deploy without owner approval.

**Full audited architecture, source provenance, differences, test evidence and next review steps:** [Stillwater source and local integration](docs/STILLWATER_SOURCE_ARCHITECTURE_LOCAL_2026-10-22.md).
