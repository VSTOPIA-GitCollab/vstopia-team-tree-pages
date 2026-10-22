# VSTOPIA — text-only Selected Branch and Team Supervisor

**Published design goal:** retain the full Team Activity side rail and its glass, but remove the secondary dark, rounded and blurred cards behind **Selected Branch** and **Team Supervisor**. Display their heading, information and live narration as plain legible typography directly against the rail. Keep the existing team member cards untouched.

The source-of-truth `site-design.css` adds narrow overrides only for `.inspector-section.detail-section`, `.inspector-section.collaborator`, `#selectedDetail`, `#activityFeed`, `#supervisorMessage` and their faux-card descendants. `scripts/build_site_css.py` regenerates the sole `site-unified.css`; do **not** add more loaded CSS bundles.

Do **not** remove or rename the dynamic `selectedDetail`, `selectedIndicator`, `activityFeed`, or `supervisorMessage` DOM IDs. `app.js` updates the current demo project on sidebar/tree selection, polls `snapshot.json` every five minutes, and rotates team supervisor copy every 7.8 seconds. The supervisor remains a public aggregate-only editorial message, never a claim of direct private GitHub access.

Verified on local Chrome / WebGL: both sections and their descendant card surfaces have transparent background, no borders/shadows/backdrop blur; teammate card glass stays translucent; 13 repository aggregate, physical 3D lake and 12 bark names remain. Selecting Creative Engine updates the selected-branch copy, supervisor content changes on its existing animation interval; mobile width 430px has no horizontal overflow. All 71 Python tests pass. Art-direction screenshots:

- [Desktop](screenshots/plain-selected-branch-supervisor-desktop-2026-10-22.jpg)
- [Mobile](screenshots/plain-selected-branch-supervisor-mobile-2026-10-22.jpg)
