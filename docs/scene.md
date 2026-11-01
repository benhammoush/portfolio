# Workspace architecture

The website is a native HTML workspace. `WorldPage` opens a landing page
with the name, personal-details line and one Enter portfolio link. Entry is explicit:
there is no timed redirect or graphics/visit-storage dependency. Enter portfolio
opens `/about`; direct content routes bypass the landing page. Browser
Back returns to the landing when it preceded About me. It does not import the room viewport,
entry controller or scene styles, and never waits for graphics or visit storage.
The personal-details line types once with a blinking decorative cursor; its full
text is available to assistive technology immediately. Desktop keeps a single line;
phones wrap naturally without shrinking the text. Reduced motion shows the complete
text without blinking, and hiding the tab finishes typing rather than replaying it.
Enter portfolio remains hidden and unfocusable while typing, then fades in with
a slight upward movement. Reduced motion reveals it immediately without animation.
The production build contains no 3D engine chunk, model, decoder or room poster.

The landing's decorative dotted globe uses local Canvas 2D artwork, not a 3D engine
or remote service. Muted green arcs connect France → Thailand → Vietnam → Hawaii
→ Los Angeles → Buenos Aires → France, without visible names or a route legend.
The globe is approximately half cropped beyond the right edge on desktop and below
the bottom edge on mobile; mobile copy is centered above it. Coarse continent
silhouettes are original decorative artwork rather than cartographic data. Its
colors intentionally belong to the black-and-green canvas artwork, outside shared
UI tokens. Rotation and the travelling pulse pause in hidden tabs, respect live
reduced-motion changes and have a keyboard-accessible Pause globe control. Reduced
motion keeps a static globe and hides that control. Canvas failure never blocks
the personal details, entry link or content. Animation frames and observers are
released on navigation; painting is capped at 30 fps and pixel density at 2.

## Monitor workspace

About me is the default content pane inside the project explorer, combining the
short introduction, five workflow steps and GitHub, résumé and email links. The
desktop sidebar and mobile project picker are available immediately, including
on About me. The `/projects` route redirects to this overview, not an empty
selection placeholder. Selecting a project replaces the content pane. Each project has
one short product sentence, a consistently ordered stack and a large image pane.
The current images are explicitly labelled conceptual illustrations, not product
screenshots. Private Apollo screenshots require separate approval.

React Router owns navigation and history; workspace links are native-capable `Link`
elements. The public paths are `/`, `/about`, `/projects/apollo`, `/projects/iris`,
`/projects/gateway` and `/projects/dripperz`. Unknown project paths show the normal
not-found view rather than silently selecting a default project.

Old `#world-*` bookmarks on `/` or `/world` redirect client-side to their clean
routes using history replacement, preserving query parameters and removing the
old fragment. About/profile/workflow/contact/main/projects fragments open `/about`;
project fragments open their project, and old room fragments return to `/`.
The `/world` route itself redirects to `/`. Selection participates in browser
Back/Forward; opening the homepage does not add a history step. The standalone `/profile`
profile route remains available with its detailed expertise content. The terminal's
About me view uses one short introduction from the homepage copy, workflow rows
and direct contact links rather than separate Workflow and Contact pages or a CV summary.
The résumé is served from `public/resume/Guillaume_Ammouche_CV_ATS.pdf`; replace
that file to update the downloadable copy without changing its public link.
The explorer navigation contains About me and the four projects only.
The standalone profile's native section fragments remain intact at `/profile`;
old `/about#about`, `/about#expertise` and `/about#contact` links redirect there.
These are browser-side compatibility redirects, not server-side HTTP redirects.

The black-and-green interface uses a persistent directory-style navigation on
wide screens. Phones and short landscape viewports use a drawer opened by a
prominent full-width Choose project bar above the content. It shows the current
selection and stays visible while the description and full-width image scroll.
The drawer closes on selection, Escape, outside interaction, keyboard focus
leaving the navigation, viewport changes and route changes through browser history.

Reduced motion disables glitch/cursor animation. The FX control
can also disable decoration. Glitches occur only on entry or explicit content
changes: bounded, randomized tear positions, offsets and small disconnected
fragments, with no repeated full-screen flashing. Timers and fragments are cleared
on interruption, hidden tabs, preference changes and unmount.

## Retained scene authoring

Earlier room source and original assets are retained on disk, not loaded by the
application. Three.js and React Three Fiber are development-only dependencies for
the retained source and unit-level asset checks. There is no active GPU browser
suite or homepage poster-capture workflow. The following describes these unused
scene resources, not the current website experience.

Per-mount changes leave the loader cache untouched. The desk flag uses a French
blue-white-red texture on both original cloth pieces, retaining their skeletal
wave animation. The original star-shaped cloth insert receives the same texture
and UV frame so it does not leave a hole or a visible emblem.

### Riverfront window

The right-hand back wall has a real portrait opening, with a charcoal frame,
recessed reveal and sill. The tall opening sits in the space to the right of the
desk and extends upward; the city crop follows its proportions without stretching.
The left wood-slat panel runs from the floor to just above the window's top edge.
Its view is a live, independently rendered 3D scene—not
a photograph, video, iframe or remote service. Original procedural geometry
depicts a golden dragon bridge, waterfront buildings, mountains and colored
nighttime reflections. Reference photographs are not included in the application.

An offscreen view preserves the portrait composition as the room camera moves.
It uses the same WebGL renderer, a fixed 512 × 768 render target and bloom scoped
to the city. Its linear output is color-encoded once by the main renderer. It does
not change the room's exposure, lighting, camera route or HTML layout. The fixed
city viewpoint intentionally does not reproduce outdoor parallax as the room
camera travels; the physical frame and reveal retain their normal perspective.
Close-up and narrow layouts may naturally crop the window.

Static architecture is batched by geometry family. Sparse cars and motorbikes
cross the bridge; one small neon-outlined passenger boat occasionally passes
underneath it. Two parallel blue fishing boats stay parked in the foreground.
Their Vietnamese flags retain red fields and yellow stars and ripple from pinned
pole edges. Water reflections and wakes are inexpensive stylized geometry, not
additional reflection render passes or a fluid simulation.

### Motion and ownership

The retained city renderer uses a bounded demand-render loop.
City time advances only while motion is allowed and the window is in the camera
frustum. Paused, hidden and offscreen time is not replayed on resume.

The room owns its frame, pane and wall geometry. The live view owns its private
scene, postprocessing passes and render targets. It restores renderer state after
each offscreen pass and releases shared city and traffic resources once on
unmount. The desktop poster remains an unused, stationary asset alongside the model.
