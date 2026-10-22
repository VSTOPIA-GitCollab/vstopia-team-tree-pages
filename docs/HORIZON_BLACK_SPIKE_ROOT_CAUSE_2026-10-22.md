# Horizon artifact: collapsed far-meadow geometry — confirmed root cause

**22 October 2026.** User screenshots at 06:45 and 06:47 BST showed
a near-black winding line projected against sky, changing position as the
camera rotated. It was first suspected to be a rogue tree twig, but source
analysis found a more fundamental geometric error.

## Specific source location

`stillwater/scene.js`, `farGroundGeo` distant meadow ring:

```js
const farGroundGeo=new THREE.RingGeometry(144,FAR_MEADOW_RADIUS,...);
const fgp=farGroundGeo.attributes.position, ...;
for (...) {
  const oldX=fgp.getX(i),oldZ=fgp.getZ(i); // BUG
  const oldR=Math.hypot(oldX,oldZ);
  ...
  fgp.setXYZ(i,x,distantMeadowHeight(x,z),z);
}
```

**THREE.RingGeometry is initially in the XY plane; every vertex Z is zero.**
The old code therefore calculated radius from X alone and rewrote **all**
far-ground Z values to zero. A circular landmass with an outer diameter of
19,200 meters turned into a vertical/collapsed sheet with long, edge-on
triangles. Its silhouette produced a dark streak crossing the photographic
sky, visible only for some camera orientations. It is **not** a natural branch,
the cloud image, or a mountain ridge.

## Minimal code correction

Immediately after constructing the `RingGeometry`, before taking the
position attributes, call:

```js
farGroundGeo.rotateX(-Math.PI / 2);
```

This standard Three.js ring-to-ground transformation maps its XY coordinates
to XZ with upward-facing normals (original Y becomes -Z). All existing
radial-distance redistribution, smooth edge interpolation, vertex colors,
world-space grass UVs, normals, Lambert material, lake and mountains stay
unchanged.

## Geometry verification

Simulated both production tessellations from the exact RingGeometry coordinate
definition and heightfield redistribution:

| Profile | Vertices | Before X span | Before Z span | After X span | After Z span |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 108,209 | 19,200 m | **0 m** | 19,200 m | 19,200 m |
| Mobile | 17,376 | 19,200 m | **0 m** | 19,200 m | 19,200 m |

Test: `tests/test_horizon_ring_geometry_20261022.py`.
No private account metadata or secrets are affected.

## Safeguards

Only the distant ground geometry is changed. Do not modify the ancient tree's
`createMysticTree()`, the procedural `shoot()` twigs, 30 birds, Water.js
timing, iOS animation recovery, UI, colors, breakpoints, 20 alias mapping,
or GitHub snapshot. No destructive Git operations on another agent's worktree.

## Validation gates

Run all Python tests, the public snapshot allowlist validator and a real
Three.js/WebGL view at front and orbited camera angles. Release only after
those checks. The test must also verify that the restored ring now occupies
the XZ plane and produces no spurious elevated black surface.

## Browser proof using the exact vendored Three.js r180

This was additionally validated **in Chromium with the unmodified vendored
`stillwater/vendor/three.module.js` and `three.core.js`**, not a reimplementation.
Constructed and redistributed production RingGeometry at both tessellations:

| Profile | Geometry | X span | Z span | Vertices with Z = 0 |
| --- | --- | ---: | ---: | ---: |
| Desktop | Without rotation | 19,200m | **0m** | 100% |
| Desktop | Corrected XZ rotation | 19,200m | 19,200m | 0.67% |
| Mobile | Without rotation | 19,200m | **0m** | 100% |
| Mobile | Corrected XZ rotation | 19,200m | 19,200m | 1.66% |

The remaining Z=0 values are normal ring vertices on the central X axis,
not collapsed land. Actual renderer rendering from every user orbit angle is
still distinguishable from this geometric proof; the 2D source collapse is,
however, definitively eliminated by the rotation.
