/**
 * Locally animated introduction derived from the approved plant/monitor scene.
 * @packageDocumentation
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AnimationMixer, Mesh, SkinnedMesh } from 'three';
import type { AnimationClip, Group } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import WorkflowMonitor from './WorkflowMonitor';
import { installPersonalModel } from './personal-model';
import { refineKeyboardAnimation } from './keyboard-animation';

/** Cached model resolved before the canvas is mounted, avoiding hidden-canvas suspension. */
interface IntroSceneProps {
  /** Shared decoded geometry/materials, never disposed on mode changes. */
  scene: Group;
  /** Small working-pose clip exported with the model. */
  animations: AnimationClip[];
  /** Only desktop no-reduced-motion mode may animate, unless explicitly paused. */
  animate: boolean;
  /** Native-scroll camera approach is disabled by stationary/reduced-motion policy. */
  cameraTravel: boolean;
}

/**
 * Suspend with the outer poster/error boundary until the animated asset is available.
 * The URL-keyed loader cache owns these shared CPU resources for the page session;
 * the renderer releases its GPU context on unmount. Never dispose cached geometry
 * on a mode toggle, or a later stationary-3D request would reuse disposed buffers.
 * @param props - The model already loaded at the HTML Suspense boundary.
 * @returns An independently posed skeleton sharing the cached mesh resources.
 */
export default function IntroScene(props: IntroSceneProps) {
  const scene = useMemo(() => clone(props.scene), [props.scene]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const clip = useMemo(
    () =>
      props.animations[0] ? refineKeyboardAnimation(props.animations[0]) : null,
    [props.animations],
  );
  const timer = useRef<number | undefined>(undefined);
  const { gl, invalidate } = useThree();
  useEffect(() => {
    if (clip) {
      mixer.clipAction(clip).play();
      mixer.update(0);
    }
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [mixer, scene, clip, invalidate]);
  useEffect(() => {
    invalidate();
    return () => window.clearTimeout(timer.current);
  }, [props.animate, invalidate]);
  useFrame((_, delta) => {
    const bounds = gl.domElement.getBoundingClientRect();
    const playing =
      props.animate &&
      !document.hidden &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < window.innerHeight &&
      getComputedStyle(gl.domElement).visibility === 'visible';
    gl.domElement.setAttribute(
      'data-intro-motion',
      playing ? 'playing' : 'paused',
    );
    window.clearTimeout(timer.current);
    if (!playing) return;
    // Resume smoothly rather than advancing through time spent hidden/paused.
    mixer.update(Math.min(delta, 0.1));
    gl.domElement.setAttribute('data-intro-time', String(mixer.time));
    // Keep the shared desk alive beyond the hero, but stop hidden/paused work.
    // The bounded ~30fps loop does not require an always-on 60fps renderer.
    timer.current = window.setTimeout(invalidate, 32);
  });
  useEffect(() => {
    const cleanupPersonalModel = installPersonalModel(scene);
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    gl.domElement.setAttribute('data-intro-ready', 'true');
    invalidate();
    return () => {
      cleanupPersonalModel();
      gl.domElement.removeAttribute('data-intro-ready');
      // SkeletonUtils owns new skeletons/bone textures, but shares the cached
      // geometry and materials. Release only the per-mount skeleton resources.
      scene.traverse((object) => {
        if (object instanceof SkinnedMesh) object.skeleton.dispose();
      });
    };
  }, [scene, gl, invalidate]);
  return (
    <>
      <primitive object={scene} dispose={null} />
      <WorkflowMonitor
        scene={scene}
        animate={props.animate}
        cameraTravel={props.cameraTravel}
        onGesture={(elapsed) => mixer.setTime(6.4 + Math.min(elapsed, 0.75))}
      />
    </>
  );
}
