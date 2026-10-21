# Team cards readability — October 21, 2026

## Root cause

Old CSS in `scene-polish.css`, `water-garden.css` and prior glass styles used four member statistics in a single tiny row, three assignment indicators in another row, 6–8px text, percentages forcing the card section to shrink, and multiple competing layout/scroll rules. Text also used pale blue/grey against a translucent bright HDRI sky.

## Fix

`team-readable.css` is loaded **after** all historical CSS and is the single authoritative override for the team panel. It makes the **right inspector 27vw (capped 450px)**, and each contribution card a two-column grid. The four stats form a readable 2x2 matrix in one half and review/issue/PR assignments take separate natural-height rows in the other. The name and latest activity use full-width rows. Both people remain visible, without nested scrollbars. The inspector alone can scroll vertically if the device window is too short; content is not clipped.

White/off-white (#f8fcff) typography with two restrained dark text shadows is applied to panel text, all project branch labels including the selected transparent labels, and sidebar/search controls. Selected labels gain a translucent deep slate overlay to stay legible in the sky; cards retain true glass translucency (30–34% dark tint, not solid). Existing real GitHub data sources and all 3D rendering stay untouched.

## Actual Chrome QA

Using Chrome DevTools Protocol after the public snapshot loaded, verified the *real DOM rectangles* at 1600px desktop and 430px mobile: both member cards (2/2), no overlapping direct card regions, no horizontal content overflow for any stat/task tile, no nested scroll in Team Members, and white computed text on both selected and normal branch labels. The 430px mobile viewport had exactly 430px page width. The member contents (including real metric values) stayed fully visible, and all five bottom stats and bark labels remained intact.

- [Desktop rendering](screenshots/team-readable-desktop-2026-10-21.png)
- [Mobile team cards](screenshots/team-readable-mobile-2026-10-21.png)
