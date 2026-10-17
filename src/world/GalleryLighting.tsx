/**
 * Procedural studio reflections with explicit ownership of generated GPU resources.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { installStudioEnvironment } from './studio-environment';

/**
 * Give glass/metal a reflected room instead of increasing flat ambient brightness.
 * All room geometry, PMREM intermediates and the output target are locally owned.
 * @returns Studio lights plus an effect that restores/disposes its environment on exit.
 */
export default function GalleryLighting() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    const { scene, gl, invalidate } = get();
    const cleanup = installStudioEnvironment(scene, gl);
    invalidate();
    return cleanup;
  }, [get]);

  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#fffdf3', '#81927f', 0.65]} />
      <directionalLight
        position={[-3.5, 7, 5]}
        intensity={2.4}
        color="#fff8e9"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-radius={4}
        shadow-normalBias={0.003}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[4, 3, -4]} intensity={0.7} color="#d9e9df" />
    </>
  );
}
