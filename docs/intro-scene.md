# Introduction scene — first still

## Approved direction

An original, detailed stylized miniature of the author working at a computer.
Reference treatment: a modeled adult character, tactile materials, soft light and
believable working posture—not low-poly blocks or a photorealistic face.

Include only the desk/computer setup and chair, a plant, a **green water flask**,
and a pair of **parallettes on the desk** (revised after rear-view review). No room, walls, shelving, sofa,
display platform or unrelated clutter. A neutral ground exists only for shadows.
The reference screenshot does not grant permission to copy its models or branding.

The character is an original loose avatar, not yet an approved exact likeness.
No personal photo, third-party character, texture or proprietary product screen is
embedded in the asset. The monitor displays original schematic editor marks.

## Bounded asset-production checkpoint

The owner authorized an official portable Blender download, without system
installation or purchased assets. Blender 4.5.14 LTS Windows x64 is sourced from
`https://download.blender.org/release/Blender4.5/` and checked against the publisher's
SHA-256 manifest before extraction or execution.

Original scene source: `scripts/blender/build_intro_scene.py`. Generated `.blend`,
PNG and manifest outputs belong under ignored `.opencode/artifacts/intro/` in a
new, explicitly selected review subdirectory; the script refuses to overwrite a
previous `.blend` review file. Keep the portable tool outside the repository.

Example after locating the authorized portable executable:

```powershell
& '<portable-blender>/blender.exe' --background --factory-startup --disable-autoexec --python-exit-code 1 --python scripts/blender/build_intro_scene.py -- --output .opencode/artifacts/intro/new-review --width 1600 --samples 40 --threads 8
```

The generator authors continuous shaped body/clothing/head meshes, facial details,
posed hands, a computer with input devices/cables, original procedural wood/fabric,
the approved personal props and a soft studio lighting setup. It validates required
assemblies, finite transforms and absence of external file textures before rendering.

Focused checks run in a separate factory-startup Blender process using
`--python scripts/blender/test_intro_scene.py`. They cover color conversion, output
path resolution, render limits, closed/finite loft geometry, required assemblies,
external-texture refusal and preservation of existing review outputs. They do not
certify likeness, animation, visual quality or runtime performance.

## Not established by a still

### Rear-view refinement

Following review of the first composition, the owner requested a view from behind
the chair and a more refined character. The next still uses a rear three-quarter
camera, blended shoulder/sleeve and elbow surfaces, smaller hands and a closer,
swept hair silhouette. The approved prop inventory is unchanged. This was a
still-only checkpoint without site integration.

The subsequent owner revision places both parallettes on the desktop, dresses the
avatar in a black hoodie and black tapered joggers, replaces the chair back with a
black ergonomic contour/headrest/support, removes the separate raised-looking shoe
sole blocks and uses a conventional short crop instead of the swept combed strands.
The rear three-quarter camera, plant and green flask remain unchanged.

The overall-design polish pass retains this composition and inventory. It adds
subtle procedural wood color grain, cloth sheen/hem/folds, jogger seams, tailored
chair edges and lumbar/adjustment details, keyboard legends and original editor UI
structure, with a warmer key and stronger rim separation for the black clothing.
These are asset details, not new furniture or props; review stills remain local.

The first output is for visual review. It is **not a finished character rig**, typing
animation, optimized glTF/WebGL asset, agreed performance budget or accepted likeness.
Future work needs approved proportions/composition first, then appropriate topology,
rigging/animation, material baking, resource budgets and web integration. The current
shader-based Blender materials cannot be assumed to export faithfully to glTF.

No website integration, runtime changes, Git publication or deployment is included.

## Subsequent authorized web-integration pass

After acceptance of review-06, the owner authorized preparation of a lightweight
web asset, homepage introduction integration, responsive/static fallbacks and a
browser checkpoint **before animation**. The preceding no-integration boundary
describes still production, not this subsequent authorization. No publication or
deployment is authorized.

`scripts/blender/export_intro_web.py` reads the accepted `.blend` without saving
over it. It renders a transparent, self-shadowed poster without a flattened floor, converts the evaluated
posed geometry, reduces dense surfaces and batches by material. It exports no
rig, camera, lights, animation or external asset dependency. The generated files
live in `src/assets/intro/` and receive Vite content-hashed URLs. Procedural grain
and bump are not baked to textures; browser PBR lighting/material appearance must
be reviewed rather than assumed identical to Cycles.

The initial review outputs were mistakenly stored under `test-results/`, which
Playwright clears. During integration checks that directory was removed. The
unchanged review-06 authoring script regenerates the accepted scene under
`.opencode/artifacts/intro/review-06-regenerated/`; editable artifacts and future
reviews must remain outside test-report output. Earlier iterations are not claimed
to be archived. The web manifest records the regenerated source hash.

The model is imported through the lazy world module on every world visit, including
narrow and reduced-motion layouts. Those layouts keep stationary camera framing;
reduced motion starts animation paused and permits an explicit Resume motion.
Loading, loading-screen escape, errors and context loss retain the poster and
readable HTML. There is no selectable illustrated viewing mode.

The model has 114,056 triangles in 31 material batches (about 2.12 MB raw GLB).
These are measurements of the local derivative, not accepted device/performance
budgets. The optional engine remains separately loaded, with its build-size warning
visible. Browser checks caught and corrected a white glTF sheen on black clothing
and a hidden-canvas loading deadlock: resolve the model at the HTML Suspense
boundary before creating the demand-rendered canvas.

## Next local still: lower viewpoint and visual polish

The owner requested visual polish, not animation, and rejected the elevated
three-quarter viewpoint in favor of a camera level with the desktop or slightly
below. The next review uses `--view desk-level --polish`: a nearly horizontal,
straight rear perspective view, with refined hand surfaces, a softer short-back
hair taper, hood drape and twin chair casters. `--view below-desk` provides the
slightly lower alternative; `--view overview` without `--polish` preserves the
accepted milestone's original recipe. Props and black outfit remain unchanged.

These are new unapproved local stills under `.opencode/artifacts/intro/`, not
replacements for the committed GLB/poster, camera or website. No animation,
commit, PR update, merge or deployment is part of this polish checkpoint.

Following the lower-view still, the owner requested a more cartoon-like treatment.
`--cartoon` is an optional next study: slightly larger head/hands, rounder cropped
hair masses, quieter seams, clean matte pigments and sturdier miniature details.
Keep the lower rear camera, adult working pose, black outfit and approved props.
Review the new still before any runtime/export or PR update.

The reference was re-shown in chat; the next direction is explicitly flashier and
less detailed, not a realism pass. `--vivid` builds on the cartoon proportions with
honey-yellow wood, bright green foliage/flask, cyan input accents, simplified
screen marks and fewer small seams/ports/legends. A blue background and warm ground
echo its lively color contrast without adding the reference's room, platform,
branding or posters. Keep the desk-level rear camera and black outfit. This remains
a local still study, not an assertion of exact style matching or website acceptance.
The owner also requested the reference hairstyle: a compact dark curly crop,
authored as overlapping rounded clumps instead of fine strands or a smooth cap.

## Character rebuild: transparent review before website integration

The owner rejected the quality of the iterative primitive/clump-based versions.
The reference specifies modeling/material style, **not its room or composition**.
The approved next slice rebuilds the character first: adult proportions, coherent
hoodie/sleeve and bent-jogger surfaces, shaped hands and one connected irregular
hair mesh. Keep the desk-level rear composition and existing chair/props for now.

`scripts/blender/build_character_review.py` reads a local source scene without
executing embedded scripts, replaces its avatar, removes the ground and renders
RGBA PNGs with transparency. No backdrop, floor, platform or cast ground shadow is
included; self-shading remains to describe form. It writes a new local `.blend`,
full-scene still and diagnostic character close-up, without touching the source
review, committed GLB/poster, runtime camera or open PR. Pale viewing proofs are
only optional image-viewer aids, not asset backgrounds.

`scripts/blender/test_character_review.py` checks closed continuous sleeve geometry,
closed evaluated hair topology and finite vertices, one connected haircut instead
of repeated sphere objects, deliberate head scale and English helper documentation.
Geometry checks do not certify visual quality, a finished character rig or a web
performance budget. The close-up is for owner review before further integration.

## Next furniture/prop review

After the owner accepted the character rebuild direction, the next local pass
keeps `character-rebuild-03` unchanged and refines its furniture/props. A slimmer
contoured ergonomic chair, narrow rear carrier and compact headrest expose more of
the hoodie. The desktop retains its footprint and exact top height, with a less
rounded oak edge and lighter steel frame. Personal props retain their identities
and general locations; the parallettes turn 35 degrees on the desktop to make the
grips readable from the fixed low rear camera. The plant becomes asymmetric and
the green flask receives a clearer shoulder/lid profile.

`scripts/blender/build_furniture_review.py` reads the accepted local character
scene, guards its avatar assembly signature, and saves a new transparent full
scene plus a diagnostic detail view. `test_furniture_review.py` checks closed back
topology, slimmer dimensions, five twin casters, desktop height, rotated-parallette
fit and assembly separation. No background, floor, ground shadow, new prop,
character edit, animation, runtime asset replacement or PR update is included.

### Owner correction: simple chair, connected table frame, no parallettes

The owner rejected that chair and identified the visible leg/tabletop gap. The
chosen replacement is a **simple black office chair** with one curved upholstered
back, compact fixed armrests, a five-wheel base and **no headrest**. Flat back
brackets physically connect to the seat; the earlier narrow rear spine and thin
curved arm carriers are removed. The desk columns now reach the tabletop underside
and join top rails. The desktop height and accepted character remain unchanged.

The owner explicitly removed **both parallettes**, superseding their inclusion in
earlier local reviews. The remaining personal props are the plant and green flask.
The latest furniture builder enforces this inventory; its checks cover absence of
parallettes/headrest, chair topology, and all four column/top-rail connections.
This is still a transparent local review, not a website or PR update.

## Four approved finishing improvements

After accepting the simple-chair scene, the owner authorized the four proposed
refinements: a more relaxed working pose and input contact; separation of the black
fabric/upholstery/metal/rubber surfaces; an asymmetric, connected haircut with a
cleaner hairline; and shaped sneakers with a restrained integral sole band. No
furniture or camera redesign, new props, ground/shadows, animation, website asset
replacement or PR update is authorized by this local-review pass.

`scripts/blender/build_finish_review.py` loads `office-chair-review-01`, preserves
the furniture/prop transforms and geometry via a signature guard, and enables the
optional finishing variant of the character builder. The earlier character recipe
remains reproducible with its default arguments. Full-scene and character-detail
PNGs remain transparent; the detail angle is diagnostic, not a composition change.
Focused checks cover elbow bend/mouse alignment, distinct black materials, closed
single-mesh hair/footwear, integral sole faces, cuff contact and protected geometry.
Reported evaluated mesh counts are local review measurements, not web-performance
acceptance or a claim of a rig/optimized runtime export.

## Crewneck, Vietnam flag and natural foliage

The owner next requested removal of the hood, a small Vietnam flag near the plant,
and a less artificial plant. `scripts/blender/build_personal_details_review.py`
reads `four-refinements-02`, removes only the hanging hood while retaining a black
crewneck sweatshirt, adds an original red 2:3 desktop flag with a centered upright
yellow five-point star, and replaces the fan-shaped foliage with a central stem,
alternate petioles and varied curved leaf blades. The existing ceramic pot, pose,
hair, footwear, simple chair, desk, green flask and main camera are preserved.

These are new transparent local review stills. A geometry-signature guard protects
the unchanged assemblies. Focused checks cover selective hood removal, branch
attachment heights, closed leaf thickness, flag proportions/star geometry and
desktop placement. No room, floor, ground shadow, parallettes, animation, runtime
asset replacement or PR update is included.

## Approved personal-details-01 homepage integration

The owner accepted `personal-details-01` and authorized its local homepage
integration. This supersedes the earlier runtime review-06 asset: black crewneck,
simple office chair, connected desk frame, branching plant, small Vietnam flag and
green flask, with no hood or parallettes. Animation, PR updates and deployment
remain outside this checkpoint.

The export now batches **per-face material slots**, preserving leaf undersides and
integral sneaker sole colors. The approved transparent poster is reused directly,
without a flattened floor, CSS shadow or edge-fading mask. The live canvas uses
alpha transparency, a desk-level perspective camera and no ground/cast shadows;
existing native-scroll travel and stationary-3D policy remain in place.

Measured derivative: 118,264 triangles, 36 material batches, 2,167,156 raw GLB bytes
and 635,929 PNG bytes. These remain local measurements rather than accepted device
performance budgets. The source hash and revised inventory are in the generated
asset manifest. Full-size local `.blend` and review renders remain outside test
output so browser checks cannot clear the editable source.

## Travelling flag folds and seated lower-body movement

The owner found the first breeze insufficiently flag-like and authorized clearer
cloth motion plus animation of the legs/feet. The camera, flag position, upper-body
work cycle and all other props remain unchanged. This is a new local visual trial.

`flag_motion.py` replaces the three-strip bend with fifteen cloth controls across
both width and height. Waves travel from the pinned edge, change phase across the
height, curl/sag the free edge and rotate the surface normals for visible folds.
All wind periods divide the shared 24-second clip; both pose and velocity close at
the seam. `refine_flag_cloth.py` retessellates only the flag, using the original 2:3
outline, exact five-point star boundary and existing red/yellow materials. The star
is now a colour region of the same two-sided cloth rather than offset overlay faces:
folding cannot make an overlay disappear inside the red surface. Both exported
material batches share the same boundary positions/weights. The exporter exempts
this conforming flag surface from its organic-mesh decimation to preserve the star.

`lower_body_motion.py` adds six leg/foot bones: fixed seated hip controls, coupled
thigh/calf movement, occasional right heel rocks and a separate small left-foot
shuffle/toe-out. Shoes and soles share rigid foot transforms; knee/ankle transitions
blend through the existing joggers and cuffs. Actual evaluated sole vertices fit a
virtual support height; the left shuffle briefly clears it by up to 9 mm. There is
no new floor, room, cast shadow, pelvis bounce or constant leg tapping. The existing
upper-body animation tracks were compared and remain value-identical.

Source: `.opencode/artifacts/intro/cloth-feet-01/cloth-feet.blend`, derived from
`rear-flag-01` with the flag-only builder's geometry guard. Derivative/screenshots:
`.opencode/artifacts/intro/cloth-feet-web-01/`. Export with `--review cloth-feet-01
--intro-animation --draco`, without `--poster` to regenerate the matching static
flag. Model: 1,392,000 bytes, 47 bones, 141,252 triangles (+380 flag triangles),
37 batches. The richer baked animation increases transfer cost; the engine-size
warning and unresolved actual-device performance budget remain.

Offline checks cover 1,153 samples for joint continuity, invariant limb lengths,
fixed hips/pole and supported soles. The actual decoded asset checks still pass
all 22 typing contacts/33 hand-transfer surfaces. Twenty shared flag colour-seam
vertices remain attached through the sampled folds (~3.4 cm maximum change from the
initial pose). Decoded soles show the intended foot movement with a 0.5 mm allowance
for the existing web decimation/quantization approximation; the decoded rest soles
are also compared to the authored support plane, and exact authored soles stay
supported. These checks do not establish continuous whole-body/chair collision
freedom or owner visual acceptance. Pause, hidden/off-intro, reduced-motion and
stationary-3D policies apply to the new motion. No PR update or deployment.

## Rear camera, original flag placement and light breeze

The owner requested the desk-height camera behind the character again, the flag's
original desktop placement and a little wind. Runtime camera is restored to
`[0.1, 0.84, 7.14]`, target `[0.1, 0.8, 0]`, retaining the 30%-smaller framing.
`move_intro_flag.py --y 0.40` derives `rear-flag-01` from the preserved
`input-details-01`; all unrelated source geometry/transforms are guarded unchanged.

Three cloth-wave bones are appended to the existing rig. Red cloth and both sides
of the yellow star share the same width-based weights, with zero motion at the
pole edge; the pole/base remain unskinned. Small wind components have 3- and 8-second
periods and close smoothly in the shared 24-second clip. Character animation tracks
were compared against `natural-animation-web-03` and are value-identical. Pausing,
stationary/reduced-motion views and visibility handling also apply to the flag.

Current source: `.opencode/artifacts/intro/rear-flag-01/rear-flag.blend`; derivative:
`.opencode/artifacts/intro/rear-flag-web-01/`. Export with `--review rear-flag-01
--intro-animation --draco`, omitting `--poster` to regenerate the restored flag's
transparent fallback. Current model: 1,071,112 bytes, 29 bones, 140,872 triangles
and 37 batches. The new flag palette/geometry is unchanged; only placement and
cloth motion differ. Exported-surface checks confirm a fixed pole/attachment edge,
star-to-cloth attachment (including signed clearance to prevent sinking) and about
4.1 mm maximum flutter at the sampled phases.
Planner checks also cover wind amplitude and loop velocity continuity. This remains
a local visual trial; no publication, PR update or deployment.

## Articulated animation rework (local, awaiting visual acceptance)

The owner rejected the previous mouse/typing motion as unnatural. That four-bone
translation-driven trial is superseded by `Intro natural working cycle`, a
26-bone, 24-second authored sequence in `intro_animation.py`. This is a local
animation trial, not a claim of owner acceptance or measured device performance.

- Both hands type in short, irregular bursts. Each finger has base/tip controls;
  fingers lift before returning to their contact pose instead of bobbing the palm.
- The right hand deliberately lifts/transfers between keyboard and mouse. Its
  clearance arc is 4 cm above the interpolated endpoints, not a repeating hover.
- Mouse travel is planar, with individual strokes, corrections, dwell periods and
  index-finger clicks. The palm shares the mouse transform only while gripping it;
  the mouse stays on the mat when the hand releases it for typing.
- Upper/forearm transforms are derived with a two-bone IK solution, keeping segment
  lengths and shoulder/elbow/wrist endpoints connected. Smooth weights blend sleeve
  seams; all skin vertices have at most four normalized influences.
- Typing contact height is fitted against the actual keycaps and evaluated finger
  pads. The left wrist settles once before typing and is then supported, not raised
  on every keypress. The right hand targets the same key surface during typing.
- Spine/head adjustments are sparse authored changes with real holds, not a shared
  sine-wave sway. Minimum-jerk waypoint transitions ease into holds; the loop has
  resting beginning/end intervals rather than snapping at its boundary.

Reproduce from `.opencode/artifacts/intro/input-details-01/input-details.blend`
with the existing exporter, `--intro-animation --draco --review input-details-01`
and `--poster .opencode/artifacts/intro/input-details-web-01/intro-scene.png`.
Current derivative/review screenshots: `.opencode/artifacts/intro/natural-animation-web-03/`.
The original modeling source is unchanged. Source mesh bounds, material definitions
and per-batch triangle counts match the previous derivative; the transparent poster
is byte-identical. Camera, input-device colors, mat, flag placement and all other
assemblies are unchanged. The articulated clip/skin grows the GLB from 620,316 to
**1,019,620 bytes**, still 140,872 triangles and 37 batches. The optional engine size
warning remains; this richer animation costs more data and is not a loading win.

Offline validation: run Blender with `--python scripts/blender/test_intro_animation.py`
and `-- --source <the input-details blend>`. It checks 1,153 pose/contact samples,
arm-length/joint continuity, planar mouse contact, hand-transfer/support bounds,
fingertip/key clearance, independent taps, loop endpoint/rest continuity, actual
baked bone transforms and preservation of the modeling source. Asset unit tests
check the exported 24-second clip, articulated joints and bounded tracks. Browser
checks retain pause/resume, cached remounts, stationary/reduced-motion and failure
policies; their motion image check now observes the first hand transfer.

`test_exported_intro_animation.py --reference <the blend> --model <the GLB>`
also reimports the actual Draco-decoded asset and evaluates its weighted surfaces.
All 22 typing contact beats pass penetration/hover bounds (measured fingertip gap
0.52–2.60 mm above the key-height plane, not key-by-key footprint mapping).
BVH checks found no input-device intersections
in 33 sampled mid-transfer hand surfaces. Intentional grip/contact endpoints are
excluded from this air-clearance check; it is sampled validation, not a proof of
continuous whole-body collision freedom.

No animation scheduler, camera behavior, pause UI or static policy was changed in
this rework. No publication, PR update or deployment. Visual naturalness and actual
device smoothness still require the owner's review of the local result.

## Local keyboard and desk-mat details

Using the owner's reference as visual guidance only, `build_input_details_review.py`
derives `input-details-01` from the preserved `flag-placement-01`: charcoal keyboard
case and mouse, graphite main keys, muted red far/top-row and right-column keys,
and a large matte black desk mat spanning keyboard and mouse. No reference photo,
logos, personal imagery or screen content is included in repository/runtime assets.
Keyboard/hand/mouse contact positions and unrelated geometry are guarded unchanged;
only the existing pad is repositioned/resized to `(1.05, 0.46, 0.003)` scene units.
Separate local materials avoid recoloring the computer enclosure or other props.

Source: `.opencode/artifacts/intro/input-details-01/input-details.blend`; derivative:
`.opencode/artifacts/intro/input-details-web-01/`. Re-export this source with
`--review input-details-01 --intro-animation --draco`, without `--poster` so the
transparent still includes the revised devices/mat. Local visual acceptance is
pending. GLB is 620,316 bytes, 140,872 triangles and 37 batches (one extra palette
batch). Camera, flag placement, model silhouette and stronger animation are unchanged.

## Three-quarter flag visibility follow-up

The owner requested the elevated rear three-quarter view again, keeping the
30%-smaller framing and stronger animation, then asked to uncover the flag.
Runtime intro position is now `[3.1, 3, 6.1]`, target `[0.1, 0.8, 0]`, with the
same `2.5 / 0.7` viewHeight. `move_intro_flag.py` derives `flag-placement-01` from
`plant-monitor-01` by moving only the flag root forward on the desk (local y from
0.40 to -0.10). Its scale, cloth, upright star and desk contact remain unchanged.
A geometry-signature guard protects all unrelated assemblies. Re-export the new
source with `--intro-animation --draco --review flag-placement-01`, omitting
`--poster` to regenerate the transparent fallback with the new prop placement.
Current editable source and web artifacts are under
`.opencode/artifacts/intro/flag-placement-01/` and `flag-placement-web-01/`.
GLB remains 619,024 bytes, with the same 140,872 triangles and 36 batches.

## Local working-animation trial

The owner accepted `plant-monitor-01` and subsequently authorized subtle typing,
mouse movement and posture changes before any Engineering workflow scene work.
The accepted editable source, transparent poster, camera, materials and 140,872
triangles remain unchanged. Export with `--intro-animation --draco` and the existing
`--source`, `--poster` and `--review plant-monitor-01` arguments. The optional helper
`scripts/blender/intro_animation.py` adds an export-only four-bone rig, with smooth
weights tapering through sleeves/waist. The mouse shell and mouse hand share a bone;
furniture, foliage, flag, legs and keyboard remain fixed. This is a small working-pose
rig, not a general-purpose character rig or individually articulated finger animation.

The seamless clip spans 16 seconds of animation time: typing bursts, a pause,
mouse travel, then a small upper-body posture shift. Typing is intentionally subtle
and partly occluded from the accepted rear camera. Translation amplitudes are under
25 mm in authored scene units, with a roughly 2-degree upper-body lean. The model
grows from 550,504 to 619,024 bytes; triangle
and material-batch counts stay unchanged. The decoder and original engine-size
warning remain. Faster loading does not imply animation GPU cost is unchanged.

Each mount clones only the scene/skeleton using SkeletonUtils and shares cached
geometry/materials. Its own mixer, actions, timer and skeleton bone textures are
released on exit without disposing the cached mesh. The demand loop requests a
new frame after 32 ms only while animation is enabled and the intro is
onscreen. Hidden/unlaid-out/paused/out-of-intro views stop requesting animation
frames. Slow-frame deltas are bounded at 0.1 seconds, so overloaded software renderers
may play more slowly; this does not establish physical-device performance acceptance.
Native scroll may independently request frames but never adds idle camera motion.
`Pause motion` / `Resume motion` controls animation without replacing the scene.
Reduced motion starts paused; resuming does not enable camera travel. Narrow scenes
also keep stationary framing. The frozen recovery poster is unchanged.

The owner found the first animation too subtle from the rear camera. The follow-up
increases typing-hand lift from 1.8 to 4.5 mm, mouse travel from 6 to 20 mm nominal
amplitude and posture translation from 3 to 15 mm, and adds shoulder/head lean
during typing as well as the later posture phase. The same working-pose weights
keep wrist transitions smooth and the mouse/hand together. Timing, static poster,
camera, mesh geometry and motion eligibility are unchanged.

Artifacts: `.opencode/artifacts/intro/intro-animation-web-03/`. This is a local
visual checkpoint pending owner animation acceptance; no PR update or deployment.

Loading readback: on the local software-rendered Chromium test environment, the
model/decoder requests completed in tens of milliseconds, while first-render
initialization can exceed the former five-second assertion window. Lifecycle
tests allow 15 seconds for readiness; this is functional-test headroom, not a
loading-speed acceptance claim. Physical-device loading/render performance still
needs assessment with the animation enabled.

## Local plant and monitor trial

The owner authorized squaring the monitor and replacing the sparse pale foliage
with a compact, bushier plant: smaller pointed dark-green leaves on branching
stems. `build_plant_monitor_review.py` derives `plant-monitor-01` from the preserved
`personal-details-01` source. It creates 35 curved lanceolate leaves on five shoots
and zeroes the display parent's rotation; monitor meshes remain unchanged.
Geometry-signature guards protect the pot, soil and unrelated assemblies.
The owner accepted this art after local review; animation acceptance is separate.

Editable source: `.opencode/artifacts/intro/plant-monitor-01/plant-monitor.blend`.
Reproduce with the new builder's `--source` / `--output`, then export via
`export_intro_web.py --draco --review plant-monitor-01` without `--poster` so the
transparent fallback is regenerated from the revised scene. The new derivative
has 140,872 triangles, 36 material batches and a 550,504-byte GLB; extra foliage
adds geometry versus the compression-only checkpoint below. No new textures,
animation, PR update or deployment. Runtime camera remains desk-height at
`[0.1, 0.84, 7.14]`, with target `[0.1, 0.8, 0]` and viewHeight `2.5 / 0.7`
(approximately 30% smaller than the original framing). The earlier poster framing
policy is retained; the static render now includes both art corrections.

## Edge smoothing follow-up

After local review the owner reported stair-stepped outlines and approved a
focused rendering-quality pass. Canvas now uses a bounded 2x backing resolution
with the existing hardware antialiasing, including supersampling on 1x screens.
The former device-dependent 1–1.5x policy left 1x displays at native resolution.
This increases buffer pixel count up to fourfold versus 1x (about 1.78x versus
1.5x); it does not reduce GPU cost or establish device-performance acceptance.
Demand rendering, transparent composition, model, framing and static fallbacks
are unchanged. No postprocessing dependency or model redesign is introduced.

## Loading optimization, before animation

The owner authorized a lighter-loading derivative of the same accepted scene.
`export_intro_web.py --draco` compresses the existing evaluated meshes using
16-bit position and 14-bit normal quantization. It does not apply any additional
decimation: the 118,264 triangles, 36 batches, material definitions, node transforms
and source-review hash are unchanged. Keep `--draco` and `--review personal-details-01`
when reproducing this derivative. The transparent PNG is byte-for-byte unchanged.

Measured local artifact sizes:

- Original GLB: 2,167,156 bytes; compressed GLB: **461,264 bytes** (about 79% smaller).
- Requested glTF decoder wrapper: 58,456 bytes; decoder WASM: 192,420 bytes.
- Model plus decoder: **712,140 bytes**, about 67% less than the original model alone.
- Optional engine JS grows by about 7.4 KB minified; its existing size warning remains.

The decoder is supplied by the already pinned Three.js dependency, uses local
Vite-hashed URLs and one worker, and is not preloaded. Every world visit requests
the engine/model/decoder regardless of viewport or motion preference. The loader's
terminal callbacks dispose the worker even if React unmounted while loading;
success waits for complete parsing, while a terminal error abandons this unusable
asset and its remaining tasks. Viewport/preference changes retain the decoded model cache. Decoder
download failure and malformed mesh data follow the same sticky poster/HTML fallback.
The loader serves one asset URL per page session; changed assets require reload.

Three.js also causes Vite to emit its default fallback decoder files. The explicit
glTF decoder configuration does not request those files; actual request readback
confirmed only the wrapper and 192 KB WASM above. No new npm packages were added.
Draco's upstream Apache-2.0 license and attribution are included under
`public/third-party/`; this is codec software, not third-party artwork.

A same-viewport desktop comparison changed 170 of 1,296,000 pixels by more than
3/255 in any RGB channel (about 0.013%), with mean absolute channel difference
0.00355/255. This is one local image comparison, not a pixel-identity guarantee or
physical-device performance acceptance. Compression reduces transfer/storage cost,
not triangle count or GPU draw cost. No animation, PR update or deployment is part
of this optimization checkpoint.
