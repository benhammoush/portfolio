# World prototype

The current local direction is the base desk with small section-specific screen
states. See **Shared monitor integration trial** below and the product spec.

## Historical hub + Iris proposal (superseded)

Local candidate **0.3.0**, ongoing prototype iteration. `/` and `/world` now compose
HTML through one viewport-sized world; `/about` retains the CV-based profile.
The earlier `/design` and study routes have been retired; this proposal is historical.
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
`src/artwork/ProjectScreenArtwork.tsx` is their public-safe source: a teal public-chain
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
Workflow and Apollo artwork stay unchanged; project copy and the About camera view
stay fixed through Workflow and all project chapters. The UI is decorative, not an
interactive checkout or minting application.

### Current content-first composition

The newest local revision retains direction D's reading column, quiet sans-serif
project name and expressive local-system-serif lead, now on a frosted surface.
Approved paragraphs remain verbatim, not the design mockup's draft short summaries.
Hero framing, all five monitor artworks and the original tab/window behavior are unchanged.
The owner-approved evening room adds a matte wall, a simple grounding surface and
a small lamp at the far-right desktop corner, away from the plant, flask and copy.
Warm lamp light and restrained cool fill replace the daytime studio lighting.
The lamp has one bounded shadow map; decorative character motion retains the
existing demand-driven loop. Room geometry, materials, shadow resources and the
reflection texture are owned by the canvas mount and released when it exits.

`src/world/section-poses.ts` owns a physical eye/target/framing route rather than
alternating orbit variations. The accepted wide hero enters an over-left-shoulder
About view and keeps that same view through Workflow, Apollo, Iris, Crypto gateway
and Dripperz, including scrolling between them and expanded project copy. Monitor
artwork remains visible without drawing the camera to a close-up. Leaving Dripperz
transitions to the wider rear-three-quarter Contact conclusion, without resetting
to the hero. Explicit View screen inspection remains optional.
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
independent of WebGL and disappears on returning to the hero. On desktop it uses
a 16px backdrop blur and 25% charcoal tint, feathering to transparent across the
sheet's rightmost 30%. Text blocks have soft-edged 70% local backing and warm,
fully opaque lettering to protect contrast even over bright geometry. Smaller
layouts use an 84% dark tint; browsers without backdrop-filter use a 97% dark tint.
The loading/still/mobile alternative is captured from this same lit room and
authored monitor desktop, without baking HTML controls into the image. The source
model and the separate design-study poster remain untouched.
The personalized local revision adds three geometric wood panels on the left and
two staggered wall shelves on the right: the existing animated Vietnamese flag
is relocated off the desk, and a small bronze-style full-planche sculpture is
procedurally modeled from the owner's reference. A sculpted bonsai replaces the
original plant and pot. These are stylized meshes, not scanned copies of the photos.
The centered monitor has a 0.598 × 0.336 active display (approximately 27 inches,
16:9 in the scene's metre-like scale), replacing the oversized off-center model
and stand. The IDE default is original VS Code-inspired illustrative artwork;
project windows keep their authored aspect ratio, inset within the display.
Contact returns to the opening eye/target, with the normal right-side reading
composition retained. Runtime customization touches only the mounted clone, and
static decor is batched by material; the source GLB and shared loader cache stay intact.
The subsequent owner revision replaces the chevron panels with a single vertical
oak-slat section on the left, running continuously from the floor to the existing
wall's top (Y=7.5). The flag and stand are scaled to 80% together around their foot;
the flag shelf moves higher/right and the planche shelf lower/left. Both objects
remain seated on their respective shelves, including during flag animation.
The latest owner adjustment returns the smaller flag to its original desktop foot
at [-0.55, 0.8275, -0.4], retaining the wave and 80% scale. Both shelves keep their
current positions; the upper shelf is now empty. The full-height slat section
shifts a further 0.3 scene units left, centered at X=-1.32.
The owner subsequently removed the now-empty upper shelf; retain only the occupied
planche-statue shelf. The flag remains on the desk.
The owner removed the individual dark blurred patches behind desktop text blocks.
Retain the 25% feathered frosted reading sheet, but no local paragraph/heading
backgrounds or backing shadows. Mobile and no-blur fallback surfaces are unchanged.
Static contrast checks cover the static reading surface; without local opaque
backing, live contrast depends on the scene composition and requires visual checks.
The owner tried a 1px canvas finishing blur, then rejected that approach. The
current pass removes it and supersamples desktop rendering at 2×, even on 1×
displays; stationary narrow opt-ins retain their 1–1.5× cap. Keep MSAA and the
demand-driven lifecycle. One bounded point-normal tessellation pass curves new
edge points on the character and selected chair surfaces while retaining authored
vertices, seams and normalized bone influences. This operates on per-mount owned
geometry, leaving the GLB and loader cache untouched. Bonsai foliage and the statue
use denser spheres/cylinders; the trunk is one tapered curved tube, the pot has a
rounded lathed rim, and the monitor housing/stand have small rounded bevels.
The existing monitor art, scene layout and camera path remain unchanged. The
comparison uses two fixed views per element with identical lighting and clip time:
before = 1.5× plus the prior 1px blur; after = 2× without blur and refined geometry.
Additional geometry and pixel work increase GPU cost; no device-performance
acceptance is implied. Refresh the owned static poster from the same revised scene.

The subsequent loader/display/pose revision adds a native initial loading dialog
with measured model-byte progress, honest indeterminate preparation stages and a
keyboard-accessible opt-out. A first-frame callback completes it; loading never
forces static-policy visitors to request the engine. The monitor now uses a true
1040×585 full-panel canvas recessed 2mm behind an extruded bezel, with an emissive
clear-coated display. The IDE and workspace footer reflow into the extra height;
authored project artwork remains undistorted. The keyboard clip is copied and
retargeted locally to support the lifted wrist and reduce finger travel, preserving
the cached clip and unrelated motion. The opening viewHeight is 4.4; Contact restores
the full opening framing, including lens and offsets, not merely its eye/target.
The shared opening/Contact eye is `[0.1, 0.74, 7.14]`, target `[0.1, 0.7, 0]`:
both are lowered by 0.1 scene units without changing the viewing angle.
The owner is now trialing `blur(0.5px)` on `.world-canvas canvas` only, retaining
the renderer resolution and leaving HTML, navigation and loading UI unfiltered.
Close-up comparison with original geometry and disabled shadows identified the
main character's neck seams in the decimated source and the raised ring as the
retained former hood opening. A clone-local smooth neck loft replaces only that
skin island, reusing the existing Spine/Head bindings and source attribute storage.
Its open ends taper into the existing head/shirt. The raised collar's triangles
are removed from the rib batch; cuffs remain. No source GLB or facial geometry
changes, additional material, or extra character draw call is needed.
An independent anatomical planche study lives under the ignored local
`.opencode/artifacts/statue-review-01/` folder. It is not imported by the website
and remains unapproved. The owner instead approved the existing website statue's
slimmer, hollow-body variant with rounded shoulders. Implement that contour in
the owned torso geometry and batch two small matching shoulder caps into the
existing bronze mesh. Preserve all other statue parts, shelf placement and scale;
no external model download or additional draw call is needed. Private local
`.opencode/artifacts/` studies are outside the project formatting/lint targets;
handwritten application modules, tests and project tooling remain gated.
The mobile still crop includes the lamp, and its soft outer edges blend into the
page background. This masks only the HTML image container, never the live 3D canvas.
The compact Scene options disclosure keeps inspection, pause/resume and still-view
actions available without showing a row of buttons. It starts closed, supports
native keyboard operation and returns focus to its trigger on Escape. Failure
messages remain visible outside the disclosure.
The compact header omits the decorative name dot and shares its top row with
Scene options. It is approximately 65px high on desktop and 72px on narrow screens;
section anchors reserve 80px and 88px respectively to keep headings clear.
Text and monitor artwork do not move or change with the scene. Resize and expanded
copy re-measure stops. The slim left rail links the native section anchors and marks
the current stop. Owner-selected phrases highlight workflow, technology and
delivered capabilities across About, Workflow and projects, including Read more.
The approved wording remains unchanged; these replace the earlier single-word highlights.
Pause selects the reached stop; reduced-motion and narrow stationary policies never
follow the route. Character/flag animation keeps its separate pause and hidden-tab
safeguards. This is not owner visual acceptance or a measured physical-device
performance guarantee.

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
Visible playback uses active elapsed time rather than a capped increment per frame,
so sparse rendering does not stretch a short gesture into dozens of seconds.
Surface resources and timers are disposed;
the loader-cached model is not modified or disposed. The generated SVG is also
the independent HTML alternative; failure retains readable section content.

This is a local visual trial, not an accepted device/render budget or deployment.
Cold software-rendered shader startup can be slow; the browser tests verify
functionality, not device performance. Monitor and reading-interaction assertions
allow multiple software-rendered frames; this is not a device-performance target.
Owner review must confirm framing,
screen readability, motion and content priority before further scene work.
