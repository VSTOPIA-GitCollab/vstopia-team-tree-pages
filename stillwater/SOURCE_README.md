# Stillwater — Ancient Grove (v1.1)

An explorable Three.js lake, built around an ancient, twisting broadleaf tree. All browser code and assets are included. No npm install, account, API key, build step, or internet connection is needed to run it.

## Start on your Mac

1. Extract the ZIP completely.
2. Open Terminal in the extracted `lake-scene` folder.
3. Run:

   ```sh
   python3 serve.py
   ```

4. Open **http://localhost:8000/**. The Python launcher also attempts to open it automatically. Keep Terminal open while exploring; press Control+C to stop.

If port 8000 is already occupied, the launcher uses the next available port up to 8010 and prints the correct address.

You can also run `bash Start-Mac.command` from that folder. A direct double-click may depend on macOS file permissions; the Terminal command is the reliable route.

**Node.js alternative:** `node serve.mjs` or `npm start`. No packages need installing.

**Windows:** double-click `Start-Windows.bat`, or run `py -3 serve.py` in the extracted folder. Python 3 or Node.js must already be installed.

Do not open `public/index.html` with a file:// URL: browsers restrict JavaScript module loading from local files. Use localhost.

## Explore

| Action | Control |
| --- | --- |
| Orbit the tree | Left-drag / one-finger drag |
| Pan the scene | Right-drag, or Shift + left-drag |
| Zoom | Scroll / pinch |
| Touch pan | Two-finger drag |
| Return to the opening tree view | “Return to the tree”, or F |
| Hide / restore the interface | H |
| Freeze / resume the scene | Space, or Pause |
| Gentle camera tour | Auto orbit |
| Wind, light, detail | Atmosphere panel |
| Fullscreen | Bottom-right button |

The camera initially targets the main tree, maintains damping during movement, and is kept above the terrain. Pan is bounded to keep the scene reachable. Reduced-motion preferences start animation paused.

## What is in the scene

- A sculptural ancient tree inspired by the three supplied references: an S-shaped trunk, intertwined wood, spreading buttress roots, asymmetrical limbs and a broad green canopy of smaller, twig-attached leaves.
- A surrounding broadleaf grove. All pine and conifer geometry has been removed.
- A lake with animated normal-map ripples, Fresnel shading, sunlight highlights and a real mirrored-camera reflection of the scene.
- Displaced shoreline terrain, 180,000 grass blades at High/Ultra detail, reeds and 500 irregular shoreline stones.
- Three layers of low mountain ridges beginning about 650 metres away, with ridged surface detail and distance haze, plus a physical sky and drifting procedural clouds.
- Physical materials, sky-based image lighting, tone mapping and directional shadows.
- Adjustable wind, sunlight and detail, a pause control and optional camera orbit.

This is a procedural real-time interpretation of your reference, not a reconstruction of its original 3D assets or a photograph. It does not contain scanned trees, ray-traced global illumination or volumetric cloud simulation. The individual leaf and vegetation geometry allows camera movement throughout the scene. Near-bank rocks and foliage are genuinely three-dimensional.

## Quality

Start on **High**. Use **Balanced** if movement is slow; it lowers pixel density, shadow resolution and visible grass count. **Ultra** increases pixel density and shadows. Reflections use a 1024px texture in all presets.

Requires a WebGL 2-capable browser with graphics acceleration. Chrome, Edge, Firefox or Safari can serve as the browser; actual frame rate depends on the GPU, window size and pixel density. A context-loss message asks you to reload rather than silently displaying a frozen scene.

## Publish on GitHub Pages later

No publication has been performed. The browser-ready website is the **entire contents of `public/`**:

```text
index.html
scene.js
nature.js
style.css
assets/
vendor/
```

When you are happy with the local scene, place those files and folders in the publishing root of your GitHub Pages repository (or its `docs/` folder if that is your chosen Pages source). All imports and asset references are relative, so it also works at a repository URL such as `https://YOUR-NAME.github.io/YOUR-REPO/`. Preserve directory names and capitalization. The Python/Node launchers are only for local use and are not needed by Pages.

## Source layout

- `public/scene.js`: scene generation, shaders, camera and interactions.
- `public/nature.js`: ancient tree geometry and distant mountain system.
- `public/style.css`: optional interface overlay.
- `public/index.html`: browser entry and local import map.
- `public/vendor/`: pinned Three.js 0.180.0 and the three used addons.
- `public/assets/`: bundled texture assets.
- `serve.py` / `serve.mjs`: localhost-only static servers.
- `ATTRIBUTION.md`: dependency and texture sources.

To edit: change the source, then refresh localhost. To change the camera, edit `home` and `focus` in `public/scene.js`. The deterministic random seed keeps the generated world stable across reloads.

## Verification

JavaScript syntax, Python launcher syntax, local dependency references and image asset decoding were checked. The v1.1 tree and mountain geometries were constructed in Node.js and checked for finite vertices, valid indices and spatial bounds; the tree silhouette was also inspected using an offline geometry projection. The preview supervisor reported a running static site, but its HTTP endpoint was not reachable from the source-checking process. Browser visual and interaction QA was blocked by the preview browser's access policy in the creation environment. No browser-rendered visual pass or measured hardware performance is claimed. Please inspect the local scene before publishing.
