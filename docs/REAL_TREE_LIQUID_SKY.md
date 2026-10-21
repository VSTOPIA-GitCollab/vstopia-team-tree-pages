# EZ-Tree realistic 3D / cloud sky / liquid glass

## Implementation

- **3D Tree:** `ez-tree-scene.js` uses Daniel Greenheck's MIT-licensed [EZ-Tree](https://github.com/dgreenheck/ez-tree) (v1.1.0, preset `Oak Large`) with Three.js r167. Both ESM bundles are vendored under `vendor/` with their MIT licenses; no runtime CDN or server is needed on GitHub Pages.
- **Sky:** `assets/cloud-sky-source.jpg` (2600 × 1733), Pexels photo **"Beautiful Fluffy Clouds in Blue Sky" by Lucas Andrade**, [source](https://www.pexels.com/photo/beautiful-fluffy-clouds-in-blue-sky-29477692/), used under the Pexels License. The actual image file lives in the Pages repo so it loads without third-party requests.
- **Liquid glass:** `liquid-glass.css` applies one translucent design system to header, sidebar, inspector, contributor cards and lower toolbar. Uses `backdrop-filter` and WebKit fallback, gradients, rounded borders, and non-backdrop fallback. Dark original `style.css` is retained as fallback beneath the new stylesheet.
- **Real 3D controls:** mouse/touch drag, wheel zoom, keyboard arrows/+/- via a WebGL canvas. Project labels are projected from 3D anchor points and route click events to the existing `app.js` selection system. Search, filters, list mode, reset, autoselection, and GitHub public aggregate snapshots remain in place.
- **Reduced motion and fallback:** `prefers-reduced-motion` disables wind updates, and WebGL initialization failures keep the previous Canvas scene interactive. Original Council forest SVG rabbit/turtle still appear as visual accents.
- **Privacy:** 12 tree labels remain DEMO projects. Only the preapproved static `snapshot.json` is used for actual GitHub team data. No private repository names, token or internal data added.

## Source/license

1. EZ-Tree — © Daniel Greenheck, MIT, `vendor/EZ-TREE-LICENSE.txt`.
2. Three.js — © three.js authors, MIT, `vendor/THREE-LICENSE.txt`.
3. Sky photo — Lucas Andrade / Pexels, published 19 November 2024, [photograph](https://www.pexels.com/photo/beautiful-fluffy-clouds-in-blue-sky-29477692/). Pexels Free License applies. Original image downloaded compressed to width 2600.
4. Rabbit/turtle — originally developed as VSTOPIA scene SVGs in this repository.

This scene uses the public EZ-Tree engine referenced at `https://threejsroadmap.com/assets/ez-tree`, not a claimed copy of Marcello's inaccessible original Council assets.

## Acceptance checks

- Headless Chrome with WebGL enabled: `data-tree-kind=real-ez-tree-threejs`, `has-webgl-tree`, large visible oak, correct sky photo and translucent panels.
- DOM smoke: 12 project anchor buttons, selection updates sidebar, filter/list/reset switch without losing data, aggregate panel keeps `snapshot.json` counters.
- GitHub Pages: verify build Action PASS and live static assets return HTTP 200. Do not claim VERIFIED until a real deployed-site browser screenshot is inspected.
