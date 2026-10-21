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
import {
  readMonitorFocus,
  readSceneSide,
  settleSceneColumn,
  READING_POSE,
  WORKFLOW_POSE,
} from './workflow-focus';
import GalleryLighting from './GalleryLighting';
import IntroScene from './IntroScene';
import { configureIntroLoader } from './intro-loader';

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
  const clipping = useRef('');
  const column = useRef<number | null>(null);
  const columnTarget = useRef<number | null>(null);
  useEffect(() => {
    invalidate();
  }, [props.inspect, props.animateIntro, invalidate]);

  useEffect(() => {
    let inView = true;
    const canvas = gl.domElement;
    /** Refresh the demand loop after visibility or viewport intersection changes. */
    function updateActivity() {
      active.current = inView && !document.hidden;
      setFrameloop(active.current ? 'demand' : 'never');
      if (active.current) invalidate();
    }
    /** Request one frame for native scroll/resize, never set per-frame React state. */
    function requestFrame() {
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
    window.addEventListener('scroll', requestScrollFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    document.addEventListener('visibilitychange', updateActivity);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.setAttribute('data-world-ready', 'true');
    updateActivity();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', requestScrollFrame);
      window.removeEventListener('resize', requestFrame);
      document.removeEventListener('visibilitychange', updateActivity);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeAttribute('data-world-ready');
      canvas
        .closest<HTMLElement>('.world-stage')
        ?.style.removeProperty('clip-path');
      clipping.current = '';
      active.current = false;
    };
  }, [gl, invalidate, onContextLost, cameraTravel, setFrameloop]);

  useFrame(({ camera, size }, delta) => {
    if (!active.current) return;
    const first = CHAPTERS[0]!;
    const hub = document.getElementById(first.id);
    if (!hub) return;
    // One departure from the accepted hero, then a settled desk across all copy.
    // Dock before profile copy enters, not after it is already behind the chair.
    // The opening pose stays exact at scroll zero; no section zooms follow it.
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
    // The hero's own bottom is also the visual boundary: incoming HTML must never
    // inherit foreground geometry while the desk is still departing into its rail.
    const boundary = Math.max(
      0,
      Math.min(size.height, hub.getBoundingClientRect().bottom),
    );
    const stage = gl.domElement.closest<HTMLElement>('.world-stage');
    const sceneSide = readSceneSide();
    const inspecting = props.inspect && readMonitorFocus().progress > 0;
    const targetColumn = inspecting || sceneSide === 'right' ? -0.25 : 0.25;
    // A newly requested transition must not consume time spent idle before it.
    const columnDelta = columnTarget.current === targetColumn ? delta : 0;
    column.current = settleSceneColumn(
      column.current ?? targetColumn,
      targetColumn,
      columnDelta,
      cameraTravel && props.animateIntro,
    );
    columnTarget.current = targetColumn;
    if (column.current !== targetColumn) invalidate();
    const apertureLeft = (0.25 - column.current) * 100;
    const aperture =
      column.current === -0.25
        ? 'inset(0 0 0 50%)'
        : column.current === 0.25
          ? 'inset(0 50% 0 0)'
          : `inset(0 ${50 - apertureLeft}% 0 ${apertureLeft}%)`;
    const rail = wide
      ? boundary > 0 || (props.inspect && readMonitorFocus().progress > 0)
        ? '62%'
        : '0%'
      : '100%';
    const clip =
      boundary >= size.height
        ? 'none'
        : boundary <= 0
          ? !wide
            ? 'inset(0 0 0 100%)'
            : aperture
          : `polygon(0 0, 100% 0, 100% 100%, ${rail} 100%, ${rail} ${boundary}px, 0 ${boundary}px)`;
    if (stage && clipping.current !== clip) {
      stage.style.clipPath = clip;
      clipping.current = clip;
    }
    const galleryZoom = Math.min(
      size.width / (first.viewHeight * (wide ? 1.6 : 1.4)),
      size.height / first.viewHeight,
    );
    const poster = document
      .querySelector('.world-intro-poster')
      ?.getBoundingClientRect();
    // The accepted poster's full width spans approximately 0.82 opening view heights.
    // Track its HTML rectangle so loading/static/live views share the same composition.
    // Lens depends only on layout, never on scroll, chapter or inspection distance.
    const zoom = poster
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
    const last = {
      position: READING_POSE.position.map(
        (value, axis) =>
          value + (WORKFLOW_POSE.position[axis]! - value) * inspection.current,
      ) as [number, number, number],
      target: READING_POSE.target.map(
        (value, axis) =>
          value + (WORKFLOW_POSE.target[axis]! - value) * inspection.current,
      ) as [number, number, number],
    };
    const horizontalOffset =
      (poster ? size.width / 2 - poster.x - poster.width / 2 : 0) *
        introWeight +
      (wide ? size.width * column.current : 0) * (1 - introWeight);
    const verticalOffset =
      (poster ? size.height / 2 - poster.y - poster.height / 2 : 0) *
      introWeight;
    if (
      camera.view?.fullWidth !== size.width ||
      camera.view?.fullHeight !== size.height ||
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
      const distance = Math.hypot(
        ...first.position.map((value, axis) => value - first.target[axis]!),
      );
      camera.fov =
        (2 * Math.atan(size.height / zoom / (2 * distance)) * 180) / Math.PI;
      camera.updateProjectionMatrix();
    }
    // Small public diagnostics support pose/resize verification without React state.
    gl.domElement.setAttribute(
      'data-camera-pose',
      camera.position.toArray().join(','),
    );
    gl.domElement.setAttribute('data-camera-zoom', String(zoom));
    gl.domElement.setAttribute(
      'data-scene-side',
      inspecting ? 'right' : sceneSide,
    );
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
 * Render only when the camera or layout changes; no idle animation loop is needed.
 * @param props - Context-loss callback for the HTML fallback boundary.
 * @returns A transparent perspective canvas; HTML owns all navigation.
 */
export default function WorldCanvas(props: WorldCanvasProps) {
  // Resolve before creating the renderer: a suspended, hidden canvas cannot
  // satisfy the viewport observer's demand-rendering visibility policy.
  const model = useLoader(GLTFLoader, sceneUrl, configureIntroLoader);
  return (
    <Canvas
      camera={{ position: CHAPTERS[0]!.position, fov: 28, near: 0.1, far: 300 }}
      // Supersample even on 1x displays: native-resolution MSAA alone leaves
      // visible steps on the thin desk/chair diagonals. Bound the ratio at 2x.
      dpr={2}
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
