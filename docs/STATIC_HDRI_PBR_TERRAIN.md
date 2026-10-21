# Static physically coherent outdoor world — HDRI + real 3D ground

**Status:** implemented in public Pages branch `feature/static-hdri-pbr-terrain`; requires verification of the merged GitHub Pages deployment before marking VERIFIED.

## Fix and controls

The previous terrain was a *transparent canvas radial gradient*, not opaque ground. It could show sky through its surface and was visually disconnected from the background. Replaced by a real `THREE.PlaneGeometry(1100, 1100, 96, 96)` world terrain mesh with deterministic low-relief vertex deformation and recomputed normals. Its material is opaque `THREE.MeshStandardMaterial`, matte PBR, with tiled 1K diffuse, OpenGL normal, and roughness maps. There are 1500 deterministic instanced grass blades, a subtle contact-shadow overlay, and far-distance fog matching the scene. The **terrain itself is fully opaque**; the contact shadow overlay intentionally uses transparency only for its falloff.

The visible 2K HDR panorama is also assigned to `scene.environment`, giving consistent IBL light, color and horizon as the user moves the camera. Tone-mapped static JPG generated from **the exact same** HDRI is only for CSS/Canvas fallback. Do not rotate the environment automatically. The oak wind simulation is frozen at `tree.update(0)` and the render loop skips drawing when unchanged; drag/wheel/arrow keys/reset trigger redraw. The 2D fallback has `motion:false` with t=0.

## Licensed assets (original sources)

All Poly Haven resources are CC0 and hosted in this repository to avoid runtime third-party requests:

- **Kloppenheim 03**, by Greg Zaal — [asset](https://polyhaven.com/a/kloppenheim_03), `assets/environment/kloppenheim_03_2k.hdr`. 2048 x 1024; equirectangular field/cloud/sky with visible horizon, natural partly cloudy midday. `assets/environment/kloppenheim_03_tonemapped.jpg` is its own tone-mapped derivative, not an unrelated sky image.
- **Grass Ground**, Poly Haven — [asset](https://polyhaven.com/a/grass_ground), diffuse `grass_ground_diff_1k.jpg`, OpenGL normal `grass_ground_nor_gl_1k.jpg`, roughness `grass_ground_rough_1k.jpg`. All 1024 x 1024.
- **RGBELoader** from Three.js r167, used to load the binary Radiance HDR, under the upstream Three.js MIT license `vendor/THREE-LICENSE.txt`.

Licensing for EZ-Tree and Three.js stays in `vendor/`; site and analytics privacy controls remain unchanged. The tree project labels remain fictional demo nodes. The public aggregates continue reading preapproved `snapshot.json` only.

## Browser checks

Verify on desktop and mobile: horizon appears in both directions during manual orbit, the ground under the tree is textured and solid (does not reveal the HDRI behind), sky and world share one static HDRI, 3 maps load, no automatic movement, orbit/zoom/list/search/auto-tour remain functional, and WebGL-unavailable fallback works. Acceptance DOM flags: `data-tree-kind=real-ez-tree-threejs`, `data-hdri=kloppenheim_03_2k`, `data-pbr=diffuse-normal-roughness-ready`, `data-terrain=opaque-pbr-mesh`.
