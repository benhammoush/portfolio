# World prototype

The current local direction is the base desk with small section-specific screen
states. See **Shared monitor integration trial** below and the product spec.

## Historical hub + Iris proposal (superseded)

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

## Shared monitor integration trial (five project tabs)

The owner authorized original Iris, Crypto gateway and Dripperz monitor concepts.
`src/design/ProjectScreenArtwork.tsx` is their public-safe source: a teal public-chain
explorer, a checkout/trust-boundary composition, and a cyberpunk mint workspace with
original collectible-like artwork (not an actual collection asset). All are clearly
illustrative, with no live values, real addresses, transactions or private source.
Generate/check each SVG with `npm run generate:iris-art` / `check:iris-art`, and the
equivalent `gateway` and `dripperz` commands. Native monitor crops preserve proportions.
The source-to-SVG checks run in unit tests. These are local design candidates, not
owner visual acceptance or product screenshots.

Five heading-selected tabs share the existing plane, texture, bounded gesture and
pause/visibility lifecycle. Direct entry, reverse intent and each failed artwork
remain independent. Static/reduced-motion pages have small HTML artwork alternatives.
Workflow and Apollo artwork stay unchanged; project copy and the fixed monitor-corner
camera from Workflow through Dripperz stay unchanged. The UI is decorative, not an
interactive checkout or minting application.

### Current content-first composition

The newest local revision retains direction D's reading column, quiet sans-serif
project name and expressive local-system-serif lead, now on a frosted surface.
Approved paragraphs remain verbatim, not the design mockup's draft short summaries.
Hero, existing Workflow/Apollo artwork and the original tab/window behavior are unchanged.

`src/world/section-poses.ts` owns a physical eye/target/framing route rather than
alternating orbit variations. The accepted wide hero enters an over-left-shoulder
About view, then reaches the monitor's top-right corner at Workflow. One shared
eye, target and framing span holds that exact view through Apollo, Iris, Crypto
gateway and Dripperz, including scrolling between them and expanded project copy.
Leaving Dripperz transitions to the wider rear-three-quarter Contact conclusion,
without resetting to the hero. Explicit View screen inspection remains optional.
The material-batched model uses explicit glTF-space landmarks, not batch names.

Native section stops, including fixed-header clearance, drive an eased scroll blend
without a separate animation timer. Reverse scroll retraces the same route; jumps
sample the latest position without queuing missed motion. The owner superseded
the right-side rail and feather: the scene now fills the viewport behind the text,
with unmasked full-width projection and full-height landmark framing. An off-axis
composition keeps each focal detail visible to the right of the reading surface,
without clipping the rest of the scene. On desktop (1200px+), one fixed frosted
sheet covers the left 50% of the viewport, full height, instead of rounded panels;
all reading content stays inside that half. Smaller layouts retain readable-width
surfaces rather than squeezing prose into half a phone/tablet. The backdrop is
independent of WebGL and disappears on returning to the hero. It uses a 16px
backdrop blur and 84% light tint; lettering itself
stays fully opaque and sharp. The tint protects contrast even over black geometry;
browsers without backdrop-filter use a 97% tint instead. The hero stays unchanged.
Text and monitor artwork do not move or change with the scene. Resize and expanded
copy re-measure stops. Pause selects the reached stop; reduced-motion and narrow
stationary policies never follow the route. Character/flag animation keeps its
separate pause and hidden-tab safeguards. This is not owner visual acceptance or
a measured physical-device performance guarantee.

The following text describes earlier composition iterations:

The selected text presentation is project-led: project name as the section heading,
the approved story sentence as a smaller lead, and two labeled paragraph blocks
separating context from contribution/delivery. All original wording remains present;
only presentation labels are added. A light, left-accented contribution block replaces
the enclosing project card. Expanded copy uses subordinate headings. Fragment IDs,
monitor selection/artwork and the hero remain unchanged.

Post-hero sections use a stable, left-aligned reading column at desktop sizes,
with stronger headings, small chapter labels and bounded paragraph line lengths.
The shared desk is smaller, capped independently of viewport width and placed at
the lower right as decoration. The hero is unchanged. Explicit screen inspection
enlarges only the decoration; it does not move or narrow the reading surface.
Monitor artwork, original desktop/tab behavior, approved wording, section anchors,
Read more and motion/static controls are preserved. This supersedes the alternating
split composition described in the historical trial below; it is not visual
acceptance or authorization to redesign any monitor artwork or another product.

### Earlier composition trials

The accepted Workflow artwork is exported from its review component with
`npm run generate:workflow-art`. `npm run check:workflow-art` and a unit test check
that the generated SVG matches; this is offline artwork export, not route SSR.
Apollo uses the same exporter via `npm run generate:apollo-art` and
`npm run check:apollo-art`. Both original artworks are checked against their
review components; no private Apollo source or real market data is included.

The current desktop trial uses alternating reading-card/3D columns at 1200px and
above, rather than a faded scene behind the article. Workflow places text left;
Apollo reverses, and later sections alternate. Native heading position selects the
opposite scene column using the same camera and monitor. Projection changes
move with damping, reversing from the current position and stopping at
rest; paused changes are immediate. The viewport has no half-page clipping mask:
only the opaque cards cover scene geometry behind their own bounds. Cards show two introductory paragraphs and
retain longer approved copy in native Read more disclosures. Narrower reading layouts
remain stacked and show independent art, without a scene behind the text.

The current navigation uses native mandatory section snapping, with a top/hero
anchor, profile anchor, one per project/workflow section and contact. Section snap
stops guide native touch/key scrolling. Bounded vertical wheel gestures select one
adjacent anchor, retaining browser zoom, horizontal gestures and nested controls; content
taller than the viewport remains natively scrollable, including expanded details.
Reduced motion disables smooth scrolling, not access to any anchor. Snapping is
removed on leaving the world route. This supersedes the historical free-scroll
prototype policy above.

The shared character/flag clip continues beyond the hero while the scene is
visible. Pause, hidden-tab, unlaid-out and stationary/reduced-motion policies still
stop it. The working loop remains bounded at approximately 30fps, with device pixel
ratio between 1 and 1.5 rather than forced 2x supersampling. These are safeguards,
not a physical-device performance acceptance claim.

The preceding editorial revision established the readable card styling. HTML
has centered solid reading cards with roughly 42rem content width, prominent project
labels, darker 19px body text and tighter content-sized
sections. The monitor stays up close as a centered, 10%-opacity backdrop, not a second
content column. Static artwork stays small; hidden alternatives retain their footprint
so decoding cannot shift native anchors. Explicit inspection temporarily left-aligns
the same-width article beside the screen without changing chapter heights. After the
accepted hero departs, the desk holds one peripheral reading pose across chapters.
The lens is fixed until layout changes. **View screen** optionally approaches the
same target within a clipped visual rail; **Return to reading** restores the desk.
Neither view can cover the reading column. Compact controls do not fade the text.
No new scene/model assets or later section art are introduced.

The screen owns one unlit 1040×464 canvas texture. Original vector concepts are
cropped at their explicit source dimensions and uniformly scaled into a native-width
application layout, not letterboxed or stretched. Persistent tabs replace only the
selected view, using a brief pointer action and the existing authored mouse gesture
(clip seconds 6.4–7.15, click at 6.8). Actual headline position, not the section box,
selects the view with a 24px reverse-scroll deadband. Latest intent interrupts the
action; native scrolling never waits. The original hero screen stays intact through
the profile in the preceding trial. The current default is an original OS-like
desktop with an open portfolio window and a persistent Workspace launcher. It is
painted once into the same opaque canvas/texture, including stationary opt-ins.
At Workflow's actual heading, one deliberate click selects that existing launcher
and opens the application above the desktop.
When this native desktop and the section art are ready, independent HTML posters
stay hidden even before launch; they are not layered over the monitor. Static,
stationary and per-artwork failure alternatives remain independently available.
Only the opaque application window expands from its launcher; screen images never
crossfade, and the original geometry is never changed
or replaced wholesale. Reverse scrolling closes it with the window's close control,
and direction changes retain its current amount. Direct anchors and paused changes
resolve immediately. The workspace then stays open across later sections without
repeated camera or screen resets.

The homepage's `desktop-poster.png` is a transparent stationary capture of this
same live scene, not a separate environment or model edit. With a current local
preview running, `npm run generate:desktop-poster` captures its 1200×900 framed
still view. The export script allows only a local HTTP preview and uses no remote
artwork; pixel output can differ by renderer/device. The original Blender poster
and model remain unchanged for provenance and earlier comparison routes.

Entry emphasis settles after 1.8 active seconds per view; there is no perpetual
decorative loop during reading. Uploads share a provisional maximum 20 Hz cap,
independent of camera invalidations. Two
small decoded SVG images share the same canvas, plane, texture and upload budget;
screen changes still apply while manually paused, without advancing animation.
Pause and hidden time never advance the gesture or view clocks. Paused tab changes
resolve immediately without synthetic input. Narrow/reduced-motion layouts remain
static by default; stationary opt-ins do not animate or approach the screen.
Surface resources and timers are disposed;
the loader-cached model is not modified or disposed. The generated SVG is also
the independent HTML alternative; failure retains readable section content.

This is a local visual trial, not an accepted device/render budget or deployment.
Cold software-rendered shader startup can be slow; the browser tests verify
functionality, not device performance. Owner review must confirm framing,
screen readability, motion and content priority before further scene work.
