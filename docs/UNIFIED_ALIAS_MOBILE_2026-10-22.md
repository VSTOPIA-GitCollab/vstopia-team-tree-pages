# Unified VSTOPIA public repository aliases and phone-friendly Three.js

**22 October 2026 — Review branch only. Not deployed or merged.**

## Decision and scope

The public sidebar and real bark-anchored Stillwater 3D tree now use the same
strictly validated snapshot alias catalog. The 12 botanical conceptual labels
remain a fallback ONLY when there is no v3 snapshot. A valid v3 snapshot has:

- 13 shared, permission-checked repositories, with measured GitHub metrics.
- 7 unshared repositories marked **In programmazione** (planning label only).
- 20 total alias entries, with no private repository names, references, PR
  titles, SHAs, URLs, or fabricated metrics for the seven.
- Per-person aggregates still cover the 13 shared repositories ONLY.

The seven planning aliases are passed as an array of bare strings named
`planned_aliases`. The organization inventory and private aliases are verified
against each other in the private collector; unknown repos fail closed. The
public validator also checks exact lengths, allowed characters, collisions,
and allowed fields. The current static snapshot retains its original timestamp
and existing real numeric results; only the seven pseudonyms were added.

## Data and interaction flow

Private Python collector `scripts/create_public_snapshot.py` verifies the
complete private alias registry; `scripts/verify_alias_snapshot.py` rejects
private identifiers. Public `scripts/validate_public_snapshot.py` independently
checks the JSON. `app.js` creates one sorted list: shared and planned aliases.
`vstopia:aliases` publishes only that public catalog to the Three.js iframe.
`vstopia:choose-alias` and `vstopia:alias-selected` synchronize mouse/touch
selection, the sidebar, 3D labels and the live Selected Branch panel.

Iframe initialization is nondeterministic on slower WebGL browsers. The parent
uses a bounded ready/ping/configured handshake so messages are not lost or
repeated forever. The dynamic bridge samples the actual 3D bark vertices and
positions 20 labels; mobile collision culling prevents labels from covering
one another. Rotating the tree reveals additional physical branches.

## Mobile rendering

Native Three.js r180 is preserved. At narrow/coarse-pointer viewports only:
pixel ratio 1, 512px directional shadow map, 256px Water.js reflection target,
24,000 main grass instances rather than 180,000, 2,500 short grass instances,
up to 10 bushes, lower PMREM resource size, and fewer GPU-heavy initialization
steps. OrbitControls and animated wind/water remain enabled. Phone navigation
has a 440px scrollable sidebar and at least 470px scene height. Desktop keeps
its established visual settings.

## Validation and limits

Tests: `python3 -m unittest discover -s tests -q` separately in both repos;
private and public snapshot validators; Chrome DevTools mobile WebGL emulation
at 390x844 and touch-event simulation. These are **not physical iOS/Android
device tests**. Source-only passes do not prove native Safari compatibility.

The recurring GitHub Actions collector remains DISABLED until two correctly
scoped secrets, branch write policies and an explicit enablement gate are
reviewed. Do not use a personal broad GitHub token for unattended Actions.
No unauthorized repository metrics are read or published by the website.

## Verified browser QA — 22 October 2026, London time

- Source: 83/83 public unit/contract tests; 31/31 private collector tests.
- Both independent JSON validators PASS with 20 distinct public aliases.
- Headless Google Chrome 155 CDP, desktop host / mobile emulation: at viewport
  390x844, DPR 2, 20 sidebar entries, 7 planning entries, 20 3D label
  elements, 20 projected bark-vertex anchors, no horizontal page overflow.
- Touch gesture via Chrome CDP on the iframe's Three.js canvas changed actual
  camera.position from [30.99,12.77,38.99] to [20.11,17.49,43.56]:
  real 3D orbit movement, not a static fallback.
- Selection of a visible 3D label updated both selected sidebar item and
  Selected Branch title; planning item displayed IN PROGRAMMAZIONE.
- A separate cold mobile-sized load reported renderProfile=mobile-webgl
  with 10 bushes, 2,500 local tufts and 24k primary grass capacity. Note that
  resizing an existing desktop instance to 390px does not retroactively change
  the lowPower flag; the touch pass used such a resized WebGL instance.
- Overlap-aware mobile label culling shows a subset (about 4-5 in measured
  camera angles) simultaneously; all 20 remain selectable from the sidebar.
- Headless SwiftShader and CDP are NOT equivalent to testing physical
  iPhone Safari or Android Chrome. Physical device performance remains UNKNOWN.

## Operational release gate

The collected activity statistics in this candidate are a timestamped
copy of the previously approved public v3 snapshot, not a newly fetched
organization audit. Only the 7 alias-only planning strings were added;
no non-shared repository activity was exported. The automatic GitHub Action
is still disabled (scoped Actions secrets absent). Do not imply auto-refresh.
