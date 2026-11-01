/**
 * Optional room rendering and a one-way timed monitor approach, never project navigation.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PerspectiveCamera } from 'three';
import sceneUrl from '../assets/intro/intro-scene.glb?url';
import { CHAPTERS } from './chapters';
import GalleryLighting from './GalleryLighting';
import IntroScene from './IntroScene';
import { configureIntroLoader } from './intro-loader';
import { finishSceneLoading } from './scene-loading';
import { readEntryProgress, sampleMonitorPose } from './monitor-entry';

/** Scene lifecycle and independent resolution/motion policy. */
interface WorldCanvasProps {
  /** Surface terminal graphics failure to the HTML owner. */
  onContextLost: () => void;
  /** Reduced motion bypasses the physical approach. */
  cameraTravel: boolean;
  /** Narrow screens keep a bounded pixel budget. */
  dpr: number | [number, number];
  /** Whether character and city animations may advance. */
  animateIntro: boolean;
  /** Stop all rendering while the HTML workspace covers the room. */
  workspaceOpen: boolean;
}

/** Signal readiness only after a complete room and desktop frame has been painted.
 * @returns No geometry; owns one animation-frame callback.
 */
function FirstSceneFrame() {
  const gl = useThree((state) => state.gl);
  const ticket = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (ticket.current !== null) cancelAnimationFrame(ticket.current);
    },
    [],
  );
  useFrame(() => {
    if (
      ticket.current !== null ||
      gl.domElement.getAttribute('data-intro-ready') !== 'true' ||
      gl.domElement.getAttribute('data-evening-room') !== 'ready' ||
      gl.domElement.getAttribute('data-monitor-desktop') !== 'ready'
    )
      return;
    ticket.current = requestAnimationFrame(() => {
      gl.domElement.setAttribute('data-scene-loaded', 'true');
      finishSceneLoading();
    });
  });
  return null;
}

/** Drive camera framing from timed entry progress and suspend hidden GPU work.
 * @param props - Graphics lifecycle and entry policy.
 * @returns No geometry; owns camera composition and renderer activity.
 */
function ArrivalCamera(props: Omit<WorldCanvasProps, 'dpr'>) {
  const { workspaceOpen, onContextLost } = props;
  const { gl, invalidate, setFrameloop } = useThree();
  const active = useRef(false);
  useEffect(() => {
    let inView = true;
    /** Demand rendering never runs behind the workspace or while the tab is hidden. */
    function activity() {
      active.current = inView && !document.hidden && !workspaceOpen;
      setFrameloop(active.current ? 'demand' : 'never');
      gl.domElement.setAttribute(
        'data-room-suspended',
        String(!active.current),
      );
      if (active.current) invalidate();
    }
    /** Native motion requests a frame without per-frame React state. */
    function refresh() {
      if (active.current) invalidate();
    }
    /** Fail once to the illustrated room instead of retrying graphics.
     * @param event - Context loss reported by this renderer.
     */
    function lost(event: Event) {
      event.preventDefault();
      onContextLost();
    }
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      activity();
    });
    observer.observe(gl.domElement);
    window.addEventListener('resize', refresh);
    document.addEventListener('visibilitychange', activity);
    gl.domElement.addEventListener('webglcontextlost', lost);
    gl.domElement.setAttribute('data-world-ready', 'true');
    activity();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', refresh);
      document.removeEventListener('visibilitychange', activity);
      gl.domElement.removeEventListener('webglcontextlost', lost);
      gl.domElement.removeAttribute('data-world-ready');
      active.current = false;
    };
  }, [gl, invalidate, setFrameloop, onContextLost, workspaceOpen]);
  useFrame(({ camera, size }) => {
    if (!active.current) return;
    const first = CHAPTERS[0];
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const heroZoom = Math.min(
      size.width / (first.viewHeight * (wide ? 1.1 : 0.9)),
      size.height / (first.viewHeight * 0.82),
    );
    const progress = props.cameraTravel ? readEntryProgress() : 0;
    const pose = sampleMonitorPose(
      progress,
      size.height / heroZoom,
      size.width / size.height,
    );
    const offsetX = 0;
    const offsetY = -size.height * 0.1 * (1 - pose.blend);
    camera.setViewOffset(
      size.width,
      size.height,
      offsetX,
      offsetY,
      size.width,
      size.height,
    );
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    if (camera instanceof PerspectiveCamera) {
      camera.aspect = size.width / size.height;
      camera.fov =
        (2 *
          Math.atan(
            pose.span /
              (2 *
                camera.position.distanceTo({
                  x: pose.target[0],
                  y: pose.target[1],
                  z: pose.target[2],
                })),
          ) *
          180) /
        Math.PI;
      camera.updateProjectionMatrix();
    }
    gl.domElement.setAttribute('data-entry-progress', String(progress));
    gl.domElement.setAttribute('data-camera-pose', pose.position.join(','));
    gl.domElement.setAttribute('data-camera-target', pose.target.join(','));
    gl.domElement.setAttribute(
      'data-camera-mode',
      progress > 0 ? 'monitor-entry' : 'intro',
    );
    gl.domElement.setAttribute(
      'data-camera-fov',
      String(camera instanceof PerspectiveCamera ? camera.fov : 0),
    );
    gl.domElement.setAttribute('data-camera-offset-x', String(offsetX));
    gl.domElement.setAttribute('data-camera-offset-y', String(offsetY));
  });
  return null;
}

/** Retain the model, city, lighting and hero while content remains native HTML.
 * @param props - Context failure, rendering budget and workspace state.
 * @returns One lazy, demand-rendered scene with per-mount owned resources.
 */
export default function WorldCanvas(props: WorldCanvasProps) {
  const model = useLoader(GLTFLoader, sceneUrl, configureIntroLoader);
  return (
    <Canvas
      camera={{ position: CHAPTERS[0].position, fov: 28, near: 0.03, far: 300 }}
      dpr={props.dpr}
      frameloop="demand"
      shadows
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.05 }}
      fallback={<p>WebGL unavailable. The workspace remains available.</p>}
    >
      <GalleryLighting animate={props.animateIntro} />
      <IntroScene
        scene={model.scene}
        animations={model.animations}
        animate={props.animateIntro}
        cameraTravel={props.cameraTravel}
      />
      <ArrivalCamera {...props} />
      <FirstSceneFrame />
    </Canvas>
  );
}
