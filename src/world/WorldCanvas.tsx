/**
 * Independently loaded WebGL scene; primitives are owned and disposed by Fiber.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import sceneUrl from '../assets/intro/intro-scene.glb?url';
import { CHAPTERS, cameraProgress, interpolateAxis } from './chapters';
import GalleryObjects from './GalleryObjects';
import GalleryLighting from './GalleryLighting';
import IntroScene from './IntroScene';

/** Props shared by the scene lifecycle and its canvas boundary. */
interface WorldCanvasProps {
  /** Replace a lost context with a static view; do not loop automatic retries. */
  onContextLost: () => void;
  /** Only the wide, no-reduced-motion layout permits native-scroll camera travel. */
  cameraTravel: boolean;
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
    /** Stationary 3D needs resize frames, but native scrolling must not move it. */
    function requestScrollFrame() {
      if (cameraTravel) requestFrame();
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
      active.current = false;
    };
  }, [gl, invalidate, onContextLost, cameraTravel, setFrameloop]);

  useFrame(({ camera, size }) => {
    if (!active.current) return;
    const first = CHAPTERS[0]!;
    const last = CHAPTERS[1]!;
    const hub = document.getElementById(first.id);
    const iris = document.getElementById(last.id);
    if (!hub || !iris) return;
    const offset = window.scrollY;
    const progress = cameraTravel
      ? cameraProgress(
          offset,
          hub.getBoundingClientRect().top + offset,
          iris.getBoundingClientRect().top + offset,
          window.innerHeight,
        )
      : 0;
    const viewHeight =
      first.viewHeight + (last.viewHeight - first.viewHeight) * progress;
    const zoom = Math.min(
      size.width / (viewHeight * 1.4),
      size.height / viewHeight,
    );
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
    // Reserve the left side of the full-page projection for readable HTML.
    const horizontalOffset = size.width >= 768 ? -size.width * 0.22 : 0;
    const verticalOffset = size.width < 768 ? -size.height * 0.18 : 0;
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
    // Small public diagnostics support pose/resize verification without React state.
    gl.domElement.setAttribute(
      'data-camera-pose',
      camera.position.toArray().join(','),
    );
    gl.domElement.setAttribute('data-camera-zoom', String(camera.zoom));
  });
  return null;
}

/**
 * Render only when the camera or layout changes; no idle animation loop is needed.
 * @param props - Context-loss callback for the HTML fallback boundary.
 * @returns An orthographic, noninteractive canvas; HTML owns all navigation.
 */
export default function WorldCanvas(props: WorldCanvasProps) {
  // Resolve before creating the renderer: a suspended, hidden canvas cannot
  // satisfy the viewport observer's demand-rendering visibility policy.
  const model = useLoader(GLTFLoader, sceneUrl);
  return (
    <Canvas
      orthographic
      camera={{ position: [3, 4.2, 6.2], zoom: 55, near: 0.1, far: 300 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      shadows="percentage"
      gl={{ antialias: true, alpha: false }}
      fallback={<p>WebGL unavailable. Use the still view below.</p>}
    >
      <color attach="background" args={['#eeeee5']} />
      <GalleryLighting />
      <IntroScene scene={model.scene} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.004, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#eeeee5" roughness={0.92} />
      </mesh>
      <group position={[10, 0, 0]}>
        <GalleryObjects />
      </group>
      <ScrollCamera
        onContextLost={props.onContextLost}
        cameraTravel={props.cameraTravel}
      />
    </Canvas>
  );
}
