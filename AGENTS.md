# VSTOPIA Living Tree — agent operating rules

## Single canonical checkout (owner decision, 22 October 2026)
- Canonical LOCAL checkout: `/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-pages-organic-vegetation-texture-20261022`.
- Canonical REMOTE: `https://github.com/VSTOPIA-GitCollab/vstopia-team-tree-pages`; source of truth: `main`, matching the publicly released GitHub Pages source.
- **ONE project directory.** Work in this existing checkout and on `main`; never create clones, worktrees, task-suffixed project folders or feature branches without the owner's explicit request.
- Do not duplicate the project because a task is difficult, tests are needed, a handoff approaches context limit, or a commit is being inspected. Use git diffs, existing commit history, in-repo tests and localhost previews.
- A commit is history, not a reason to preserve an obsolete copy. Do not call uncommitted work in old folders a separate version: inspect it, consult the owner before removal, and never recreate folders the owner deleted.
- Before each edit: read relevant docs (newest first), this file and the private handoff; check `pwd`, `git status --short --branch`, `git worktree list`, `git fetch`/remote references read-only, and concurrent agents/processes.
- Protect existing changes: no forced checkout/pull, reset, clean, stash, branch deletion or directory removal without authorization and a verified preservation plan.
- Test in-place; make small scoped edits and regression checks. Commit and push directly to `main` when authorized and permitted, without creating extra folders; use a PR/branch only if explicitly requested or required by repository protection.
- Distinguish CODED, TESTED, PUSHED, MERGED, DEPLOYED, VERIFIED. Pushing `main` does not prove Pages/Cloudflare actually deployed: verify GitHub Actions and live asset URLs/cache IDs.
- Maintain **one private living handoff**: `/Users/ostino/Documents/OSTIN-Handoffs/CHAT_HANDOFF_VSTOPIA_GITCOLLAB_LIVING_TREE.md`; component detail belongs in the existing repo `docs/`. Never publish private handoff to GitHub.
- For procedural 3D methods, see existing `docs/SURFACE_DEPTH_MATERIAL_REVIEW_2026-10-22.md`, `docs/MOVING_HDRI_CLOUDS_LOCAL_2026-10-22.md` and the private `REUSABLE_3D_SCENE_CREATION_PLAYBOOK.md`.
- Do not change the layout, colors, public-only GitHub metadata, moving sky/water/birds or iOS animation behavior accidentally. Safari physical QA remains distinct from browser emulation.

## Shared state import identity
- A shared JavaScript ES module is identified by its **full URL including query string**. When versioning `atmosphere.js?v=...`, ALL importers (`scene.js`, `nature.js`, `lake-life.js`, `mountain-waterfall.js`) MUST use the EXACT same string. Different `?v` versions create independent `atmosphereUniforms` singletons and silently break day/night lighting. Before changing any cache tokens, run `python3 -m unittest discover -s tests -q`, including `test_shared_atmosphere_uniforms_20261022.py`.

## Protected sky regression and reusable meteors (owner-approved, 23 Oct 2026)
- The user visually approved **v12 fixing the bright dashed arc in the night sky**. Do not put `texture2D` or implicit-mipmap photographic mask fetches inside **per-pixel UV clip branches** (`if(cropV...)`, `if(arcU...)`): clamp and sample consistently, THEN gate the sampled alpha with the existing spatial mask. Never undo this bug fix or hide a renderer defect by changing photographic colour/brightness/feather. Earlier v10 RGB-edge padding and v11 mesh tessellation were separate experiments and did NOT fix this particular artifact.
- Before changing layered skies, read `docs/SHOOTING_STARS_AND_SKY_MASK_REGRESSION_2026-10-23.md` and `docs/ALPS_FIELD_PANORAMA_SEAM_LOCAL_2026-10-22.md`. Run the full unit suite including weather occlusion and shared uniform identity tests, then check actual night WebGL. Preserve the same `atmosphere.js?v=...` URL across all four importers.
- Meteor animation lives in `stillwater/shooting-stars.js`: pooled, 360° world azimuth, single paused scene clock, dusk/night/rain visibility and an Atmosphere frequency slider defaulting to realistic rare events. Do not add an independent RAF or write into the repaired weather mask. Run `scripts/check_shooting_stars.mjs` for any meteor change.
