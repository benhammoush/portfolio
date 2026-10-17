/**
 * Static posed introduction asset, derived from the owner's approved review-06.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import type { Group } from 'three';

/** Cached model resolved before the canvas is mounted, avoiding hidden-canvas suspension. */
interface IntroSceneProps {
  /** Single static posed scene owned by the URL-keyed loader cache. */
  scene: Group;
}

/**
 * Suspend with the outer poster/error boundary until the static asset is available.
 * The URL-keyed loader cache owns these shared CPU resources for the page session;
 * the renderer releases its GPU context on unmount. Never dispose cached geometry
 * on a mode toggle, or a later stationary-3D request would reuse disposed buffers.
 * @param props - The model already loaded at the HTML Suspense boundary.
 * @returns The material-batched model without a rig, animation or idle frame loop.
 */
export default function IntroScene(props: IntroSceneProps) {
  const { scene } = props;
  const { gl, invalidate } = useThree();
  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    gl.domElement.setAttribute('data-intro-ready', 'true');
    invalidate();
    return () => gl.domElement.removeAttribute('data-intro-ready');
  }, [scene, gl, invalidate]);
  return <primitive object={scene} dispose={null} />;
}
