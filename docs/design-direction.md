# Art direction 01 — Engineering gallery

Status: local visual proposal for owner review, not an accepted design, live 3D,
project case study or public-launch content. Preview route: `/design`. The existing
profile remains at `/`. No engine dependencies or external assets are introduced.

## Intent

Make software feel tangible without turning the portfolio into a game. Use a
light architectural exhibition model: one connected ceramic platform, a central
hub, distinct engineering installations, soft daylight and restrained material
accents. Avoid star fields, neon tunnels, floating project planets and HUD clutter.
Lead with full-stack engineering; AI belongs in a supporting workflow explanation,
not the headline.

## Composition and materials

- Large editorial typography and readable HTML sit beside an oblique model.
- Chalk ceramic plinths, frosted green-gray glass, forest-ink text, copper signals.
- Hub: nested observation rings around a central core, with inlaid connecting paths.
- Iris: layered observation panes and one copper signal marker. The geometric
  marks are schematic, not actual product UI, financial results or live data.
- Original SVG artwork is a composition/material study and possible direction for
  a later static poster; it is not a rendered 3D asset or a production fallback yet.

## Proposed real-3D slice after visual approval

Build only the hub and Iris first. Use independently loaded React Three Fiber/Three.js,
native scroll progress and a shared chapter/pose configuration. Keep ordinary HTML
and links in charge of navigation. Camera proposal: wide three-quarter hub view,
then a closer three-quarter Iris view; no free flight or forced animation waits.

Reduced motion avoids camera travel. Mobile and unsupported WebGL retain readable
HTML and a static illustrated alternative. Test loading/error, context loss,
resource/listener cleanup and pause behavior in the real prototype. None of these
WebGL behaviors is demonstrated by a motion-free vector board.

Measure actual desktop/mobile loading and render behavior before agreeing numeric
budgets or expanding to the remaining installations. Device selection and budgets
remain unresolved, not silently selected by the artwork.

## Visual acceptance checkpoint

Review the wide and narrow composition, the architectural rather than game-like
direction, hub form, Iris material language and legibility. Revise those before
installing world dependencies. Dedicated case studies, the completed world and the
full workflow page remain later slices. No publication or deployment is included.
