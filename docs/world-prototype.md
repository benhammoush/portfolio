# Hub + Iris prototype

Local candidate **0.3.0**, ongoing prototype iteration. `/` and `/world` now compose
HTML through one viewport-sized world; `/about` retains the CV-based profile.
`/design` retains the earlier static study, not the accepted page composition.
The owner rejected the boxed viewport and Iris object; current geometry is held
only to assess the new full-page composition, not treated as accepted art.
This iteration needs owner walkthrough, not public launch or full-world expansion.

## Page composition

The scene spans the viewport edge-to-edge and stays behind native HTML sections:
introduction/hub, engineering practice, Iris and contact. No canvas border, scene
card, split-column viewport or separate mobile illustration widget. Camera projection
reserves the left side for text, while a continuous tonal wash protects readability.
HTML remains the source of navigation and content. Mobile and reduced-motion use
the same page-sized illustrated background by default, not a cropped desktop canvas.
The header, mode controls and skip link remain accessible above the composition.

## Behavior

- Original procedural geometry: low ceramic hub, beveled exhibition platform,
  framed optical panes, recessed signal assembly and copper rail. Signals are
  schematic, not product UI. The earlier floating-ring blockout has been replaced.
  A locally generated room environment supplies metal/glass reflections without
  downloading HDR assets; its render target and intermediate resources are disposed.
- Shared `src/world/chapters.ts` connects native HTML IDs and camera poses. Native
  scroll/reload/anchors drive a wide-to-close orthographic view; no scroll handlers
  prevent input, no snapping/free flight and no forced animation wait.
- Three.js/Fiber are loaded in the separate `WorldCanvas` chunk, only on the world
  route for viewports at least 768 CSS pixels wide with no reduced-motion preference.
  This threshold is a prototype policy, not a performance/device capability claim.
  The caption identifies narrow width versus reduced motion. Either can explicitly
  request **View stationary 3D**, which loads the engine but never enables camera
  travel. Widening to the desktop layout permits travel only without reduced motion.
- Mobile/reduced-motion default to the authored illustration with full HTML;
  deliberate still mode always remains available. Automatic eligibility changes
  release the renderer unless explicitly opted into stationary 3D for that policy.
  No WebGL is needed
  to navigate, read or use contact links; JavaScript is still required.
- Module/renderer errors and lost contexts use a still view. No automatic retry
  loop. Reload deliberately after investigating a graphics failure.
- Demand rendering has no idle animation. Scroll/resize invalidates frames;
  visibility and intersection gate scheduling. A fixed background normally stays
  onscreen; hidden/unlaid-out renderers still pause. Observers/listeners are removed on
  unmount, and declarative scene geometry/materials are disposed by Fiber.

## Provisional renderer settings

Device pixel ratio capped at 1.5, a 1024-square directional shadow map, primitive
geometry, layered transparent glass approximations and procedural room reflections, without postprocessing
or remote textures. These are implementation choices,
**not accepted budgets or measured performance guarantees**. No numeric load/render
target has been agreed. Do not extrapolate software-rendered Chromium to real GPUs.

## Local checkpoint

Check actual WebGL, lazy-load failure, unsupported graphics, context loss, mobile and
reduced motion, viewport changes, native chapter entry/reload and renderer teardown.
Inspect wide/narrow rendering and collect preliminary local browser observations
for requests/transfer, loading and idle/scroll behavior. Keep raw generated traces
out of source. Report observed environment and limitations rather than claiming a
physical-device or complete accessibility/performance pass.

Get owner visual/interaction feedback before expanding. Agree representative
devices and measured budgets before building the connected full world. No Git
publication, remote enablement or deployment is authorized by this prototype.
