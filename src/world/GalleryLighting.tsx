/**
 * Procedural studio reflections with explicit ownership of generated GPU resources.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { installStudioEnvironment } from './studio-environment';
import { installEveningRoom } from './evening-room';
import { installCityWindowView } from './city-window';
import type { CityWindowView } from './city-window';

/** Shared scene policy; the city adds no independent render loop or controls. */
interface GalleryLightingProps {
  /** Whether the visitor currently allows scene motion. */
  animate: boolean;
}

/**
 * Keep the evening lamp and subtle reflections under the mounted canvas owner.
 * All room geometry, PMREM intermediates and the output target are locally owned.
 * @param props - Shared scene-motion policy for the live city window.
 * @returns Quiet fill lights plus the owned room/environment lifecycle.
 */
export default function GalleryLighting(props: GalleryLightingProps) {
  const get = useThree((state) => state.get);
  const city = useRef<CityWindowView | null>(null);
  const cityTime = useRef(0);
  useFrame(({ camera, gl }, delta) => {
    const view = city.current;
    if (!view) return;
    const time = view.update(
      camera,
      delta,
      props.animate &&
        !document.hidden &&
        gl.domElement.getAttribute('data-intro-motion') === 'playing',
    );
    gl.domElement.setAttribute('data-city-time', String(time));
    gl.domElement.setAttribute(
      'data-city-motion',
      time > cityTime.current ? 'playing' : 'paused',
    );
    cityTime.current = time;
  });
  useEffect(() => {
    const { scene, gl, camera, invalidate } = get();
    const cleanupEnvironment = installStudioEnvironment(scene, gl);
    let cleanupRoom: (() => void) | undefined;
    let view: CityWindowView | undefined;
    try {
      cleanupRoom = installEveningRoom(scene);
      view = installCityWindowView(scene, gl);
      view.update(camera, 0, false);
      city.current = view;
      cityTime.current = 0;
    } catch (error) {
      view?.dispose();
      cleanupRoom?.();
      cleanupEnvironment();
      throw error;
    }
    gl.domElement.setAttribute('data-evening-room', 'ready');
    gl.domElement.setAttribute('data-city-window', 'ready');
    invalidate();
    return () => {
      gl.domElement.removeAttribute('data-evening-room');
      gl.domElement.removeAttribute('data-city-window');
      gl.domElement.removeAttribute('data-city-time');
      gl.domElement.removeAttribute('data-city-motion');
      city.current = null;
      view.dispose();
      cleanupRoom();
      cleanupEnvironment();
    };
  }, [get]);

  return (
    <>
      <ambientLight color="#d3b58b" intensity={0.08} />
      <hemisphereLight args={['#b5c8df', '#24201c', 0.38]} />
      <directionalLight position={[3, 3, 4]} intensity={0.27} color="#b1cadc" />
    </>
  );
}
