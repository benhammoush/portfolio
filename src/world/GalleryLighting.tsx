/**
 * Procedural studio reflections with explicit ownership of generated GPU resources.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { installStudioEnvironment } from './studio-environment';
import { installEveningRoom } from './evening-room';

/**
 * Keep the evening lamp and subtle reflections under the mounted canvas owner.
 * All room geometry, PMREM intermediates and the output target are locally owned.
 * @returns Quiet fill lights plus the owned room/environment lifecycle.
 */
export default function GalleryLighting() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    const { scene, gl, invalidate } = get();
    const cleanupEnvironment = installStudioEnvironment(scene, gl);
    let cleanupRoom: () => void;
    try {
      cleanupRoom = installEveningRoom(scene);
    } catch (error) {
      cleanupEnvironment();
      throw error;
    }
    gl.domElement.setAttribute('data-evening-room', 'ready');
    invalidate();
    return () => {
      gl.domElement.removeAttribute('data-evening-room');
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
