/**
 * Independently loaded WebGL scene; primitives are owned and disposed by Fiber.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PerspectiveCamera } from 'three';
import sceneUrl from '../assets/intro/intro-scene.glb?url';
import { CHAPTERS, chapterProgress, interpolateAxis } from './chapters';
import { readMonitorFocus, WORKFLOW_POSE } from './workflow-focus';
import GalleryLighting from './GalleryLighting';
import IntroScene from './IntroScene';
import { configureIntroLoader } from './intro-loader';
import { SECTION_POSES, sampleReadingPose } from './section-poses';
import type { PoseAnchor } from './section-poses';

/** Props shared by the scene lifecycle and its canvas boundary. */
interface WorldCanvasProps {
  /** Replace a lost context with a static view; do not loop automatic retries. */
  onContextLost: () => void;
  /** Only the wide, no-reduced-motion layout permits native-scroll camera travel. */
  cameraTravel: boolean;
  /** Explicit motion pause is separate from native-scroll camera travel. */
  animateIntro: boolean;
  /** Close-up is an explicit request, not the default scroll composition. */
  inspect: boolean;
}

/**
 * Drive camera composition from native scroll and pause all scheduled rendering
 * while hidden or offscreen. Listeners and observers belong to this mounted scene.
 * @param props - Context-loss notification owned by the outer HTML boundary.
 * @returns No geometry; this component owns only the camera and lifecycle.
 */
function ScrollCamera(props: WorldCanvasProps) {
  const { onContextLost, cameraTravel } = props;
  const { gl, invalidate, setFrameloop } = useThree();
  const active = useRef(true);
  const inspection = useRef(0);
  const anchors = useRef<PoseAnchor[]>([]);
  useEffect(() => {
    invalidate();
  }, [props.inspect, props.animateIntro, invalidate]);

  useEffect(() => {
    let inView = true;
    const canvas = gl.domElement;
    /** Measure layout only on native changes, not on every idle character frame. */
    function measureAnchors() {
      anchors.current = SECTION_POSES.flatMap((pose) => {
        const section = document.getElementById(pose.id);
        if (!section) return [];
        const margin =
          parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        return [
          {
            id: pose.id,
            top: Math.max(
              0,
              section.getBoundingClientRect().top + window.scrollY - margin,
            ),
            pose,
          },
        ];
      });
    }
    /** Refresh the demand loop after visibility or viewport intersection changes. */
    function updateActivity() {
      active.current = inView && !document.hidden;
      setFrameloop(active.current ? 'demand' : 'never');
      if (active.current) invalidate();
    }
    /** Request one frame for native scroll/resize, never set per-frame React state. */
    function requestFrame() {
      measureAnchors();
      if (active.current) invalidate();
    }
    /** Track the HTML artwork on scroll even when the world pose stays stationary. */
    function requestScrollFrame() {
      requestFrame();
    }
    /**
     * Fail to the illustrated alternative rather than attempting repeated recovery.
     * @param event - Native WebGL context-loss event.
     */
    function contextLost(event: Event) {
      event.preventDefault();
      onContextLost();
    }
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      updateActivity();
    });
    observer.observe(canvas);
    const layoutObserver = new ResizeObserver(requestFrame);
    const main = document.getElementById('world-main');
    if (main) layoutObserver.observe(main);
    measureAnchors();
    window.addEventListener('scroll', requestScrollFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    document.addEventListener('visibilitychange', updateActivity);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.setAttribute('data-world-ready', 'true');
    updateActivity();
    return () => {
      observer.disconnect();
      layoutObserver.disconnect();
      window.removeEventListener('scroll', requestScrollFrame);
      window.removeEventListener('resize', requestFrame);
      document.removeEventListener('visibilitychange', updateActivity);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeAttribute('data-world-ready');
      gl.setScissorTest(false);
      active.current = false;
    };
  }, [gl, invalidate, onContextLost, cameraTravel, setFrameloop]);

  useFrame(({ camera, size }, delta) => {
    if (!active.current) return;
    const first = CHAPTERS[0];
    const hub = document.getElementById(first.id);
    if (!hub) return;
    // Preserve the accepted hero before entering the physical landmark route.
    // Dock before profile copy enters, not after it is already behind the chair.
    // The opening pose stays exact at scroll zero.
    const heroBottom = hub.getBoundingClientRect().bottom;
    const introFraction =
      1 -
      chapterProgress(
        window.scrollY,
        0,
        Math.max(1, heroBottom + window.scrollY - window.innerHeight * 0.9),
      );
    const introWeight = introFraction * introFraction * (3 - 2 * introFraction);
    // Match CSS/media policy, not the scrollbar-reduced canvas width at 768px.
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const galleryZoom = Math.min(
      size.width / (first.viewHeight * (wide ? 1.6 : 1.4)),
      size.height / first.viewHeight,
    );
    const poster = document
      .querySelector('.world-intro-poster')
      ?.getBoundingClientRect();
    // The accepted poster's full width spans approximately 0.82 opening view heights.
    // Track its HTML rectangle so loading/static/live views share the same composition.
    const heroZoom = poster
      ? poster.width / (first.viewHeight * 0.82)
      : galleryZoom;
    const progress = cameraTravel ? 1 - introWeight : 0;
    const requestedInspection =
      props.inspect && readMonitorFocus().progress > 0 && cameraTravel ? 1 : 0;
    inspection.current = props.animateIntro
      ? inspection.current +
        (requestedInspection - inspection.current) *
          (1 - Math.exp(-Math.min(delta, 0.1) * 7))
      : requestedInspection;
    if (Math.abs(inspection.current - requestedInspection) < 0.001)
      inspection.current = requestedInspection;
    else invalidate();
    // The route changes only the scene; the reading column never moves.
    const reading = sampleReadingPose(
      anchors.current,
      window.scrollY,
      props.animateIntro,
    );
    // Full-screen framing: the HTML reading surface supplies contrast, not a rail.
    const routeSpan =
      reading.viewHeight + (1.4 - reading.viewHeight) * inspection.current;
    const worldSpan =
      size.height / heroZoom + (routeSpan - size.height / heroZoom) * progress;
    const zoom = size.height / worldSpan;
    const last = {
      position: reading.position.map(
        (value, axis) =>
          value + (WORKFLOW_POSE.position[axis] - value) * inspection.current,
      ) as [number, number, number],
      target: reading.target.map(
        (value, axis) =>
          value + (WORKFLOW_POSE.target[axis] - value) * inspection.current,
      ) as [number, number, number],
    };
    const horizontalOffset =
      (poster ? size.width / 2 - poster.x - poster.width / 2 : 0) *
        introWeight -
      size.width * 0.22 * progress;
    const verticalOffset =
      (poster ? size.height / 2 - poster.y - poster.height / 2 : 0) *
      introWeight;
    if (
      camera.view?.fullWidth !== size.width ||
      camera.view?.fullHeight !== size.height ||
      camera.view?.width !== size.width ||
      camera.view?.offsetX !== horizontalOffset ||
      camera.view?.offsetY !== verticalOffset
    ) {
      camera.setViewOffset(
        size.width,
        size.height,
        horizontalOffset,
        verticalOffset,
        size.width,
        size.height,
      );
    }
    camera.position.set(
      interpolateAxis(first.position, last.position, progress, 0),
      interpolateAxis(first.position, last.position, progress, 1),
      interpolateAxis(first.position, last.position, progress, 2),
    );
    camera.lookAt(
      interpolateAxis(first.target, last.target, progress, 0),
      interpolateAxis(first.target, last.target, progress, 1),
      interpolateAxis(first.target, last.target, progress, 2),
    );
    if (camera instanceof PerspectiveCamera) {
      camera.aspect = size.width / size.height;
      const targetDistance = Math.hypot(
        ...first.position.map(
          (_, axis) =>
            interpolateAxis(
              first.position,
              last.position,
              progress,
              axis as 0 | 1 | 2,
            ) -
            interpolateAxis(
              first.target,
              last.target,
              progress,
              axis as 0 | 1 | 2,
            ),
        ),
      );
      camera.fov =
        (2 * Math.atan(worldSpan / (2 * targetDistance)) * 180) / Math.PI;
      camera.updateProjectionMatrix();
    }
    // Small public diagnostics support pose/resize verification without React state.
    gl.domElement.setAttribute(
      'data-camera-pose',
      camera.position.toArray().join(','),
    );
    gl.domElement.setAttribute('data-camera-zoom', String(zoom));
    gl.domElement.setAttribute(
      'data-reading-section',
      cameraTravel ? reading.from : 'stationary',
    );
    gl.domElement.setAttribute(
      'data-reading-blend',
      String(cameraTravel ? reading.blend : 0),
    );
    gl.domElement.setAttribute(
      'data-camera-target',
      first.target
        .map((_, axis) =>
          interpolateAxis(
            first.target,
            last.target,
            progress,
            axis as 0 | 1 | 2,
          ),
        )
        .join(','),
    );
    gl.domElement.setAttribute(
      'data-route-span',
      String(cameraTravel ? reading.viewHeight : 0),
    );
    gl.domElement.setAttribute('data-scene-side', 'full');
    gl.domElement.setAttribute(
      'data-camera-offset-x',
      String(camera.view?.offsetX ?? 0),
    );
    gl.domElement.setAttribute('data-workflow-focus', String(progress));
    gl.domElement.setAttribute(
      'data-camera-mode',
      requestedInspection
        ? 'inspect'
        : introWeight === 0 && !cameraTravel
          ? 'stationary-reading'
          : progress === 1
            ? 'reading'
            : 'intro',
    );
    gl.domElement.setAttribute(
      'data-camera-fov',
      String(camera instanceof PerspectiveCamera ? camera.fov : 0),
    );
    gl.domElement.setAttribute(
      'data-camera-offset-y',
      String(camera.view?.offsetY ?? 0),
    );
  });
  return null;
}

/**
 * Render on demand, with bounded invalidation for visible working-pose animation.
 * @param props - Context-loss callback for the HTML fallback boundary.
 * @returns A transparent perspective canvas; HTML owns all navigation.
 */
export default function WorldCanvas(props: WorldCanvasProps) {
  // Resolve before creating the renderer: a suspended, hidden canvas cannot
  // satisfy the viewport observer's demand-rendering visibility policy.
  const model = useLoader(GLTFLoader, sceneUrl, configureIntroLoader);
  return (
    <Canvas
      camera={{ position: CHAPTERS[0].position, fov: 28, near: 0.1, far: 300 }}
      // Do not force four physical pixels per CSS pixel for continuous desk motion.
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      fallback={<p>WebGL unavailable. Use the still view below.</p>}
    >
      <GalleryLighting />
      <IntroScene
        scene={model.scene}
        animations={model.animations}
        animate={props.animateIntro}
        cameraTravel={props.cameraTravel}
      />
      <ScrollCamera
        onContextLost={props.onContextLost}
        cameraTravel={props.cameraTravel}
        inspect={props.inspect}
        animateIntro={props.animateIntro}
      />
    </Canvas>
  );
}
