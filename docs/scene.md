# Scene architecture

The workspace combines a locally served GLB with procedural room decorations.
Per-mount changes leave the loader cache untouched. The desk flag uses a French
blue-white-red texture on both original cloth pieces, retaining their skeletal
wave animation. The original star-shaped cloth insert receives the same texture
and UV frame so it does not leave a hole or a visible emblem.

## Riverfront window

The right-hand back wall has a real portrait opening, with a charcoal frame,
recessed reveal and sill. The tall opening sits in the space to the right of the
desk and extends upward; the city crop follows its proportions without stretching.
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

## Motion and ownership

The city uses the existing scene's bounded demand-render loop and Pause/Resume
control. It starts stationary under the same reduced-motion policy as the room.
City time advances only while motion is allowed and the window is in the camera
frustum. Paused, hidden and offscreen time is not replayed on resume.

The room owns its frame, pane and wall geometry. The live view owns its private
scene, postprocessing passes and render targets. It restores renderer state after
each offscreen pass and releases shared city and traffic resources once on
unmount. The regenerated desktop poster provides a stationary representation for
loading and error recovery.
