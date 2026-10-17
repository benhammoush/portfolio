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

The optional model is imported only through the lazy world module. Reduced-motion
and narrow layouts retain the approved PNG without requesting the engine/model.
Mobile shows the still below the intro copy, not behind it. Desktop reserves the
left side for HTML; the model has no idle animation. Explicit stationary 3D remains
available. Loading/errors/context loss retain the poster and readable HTML.

The model has 114,056 triangles in 31 material batches (about 2.12 MB raw GLB).
These are measurements of the local derivative, not accepted device/performance
budgets. The optional engine remains separately loaded, with its build-size warning
visible. Browser checks caught and corrected a white glTF sheen on black clothing
and a hidden-canvas loading deadlock: resolve the model at the HTML Suspense
boundary before creating the demand-rendered canvas.
