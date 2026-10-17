/**
 * Explicit resource ownership for the procedural room reflection capture.
 * @packageDocumentation
 */
import { InstancedMesh, PMREMGenerator } from 'three';
import type { Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Install local reflections and retain the exact previous scene configuration.
 * @param scene - Mounted Fiber scene that temporarily owns the environment texture.
 * @param renderer - Renderer used for the small procedural reflection capture.
 * @returns Cleanup restoring the previous environment and disposing the output target.
 */
export function installStudioEnvironment(
  scene: Scene,
  renderer: WebGLRenderer,
): () => void {
  const previous = scene.environment;
  const previousIntensity = scene.environmentIntensity;
  const room = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  const target = (() => {
    try {
      return generator.fromScene(room, 0, 0.1, 100, { size: 64 });
    } finally {
      // RoomEnvironment disposes geometry/materials, but not instance-matrix buffers.
      room.traverse((object) => {
        if (object instanceof InstancedMesh) object.dispose();
      });
      room.dispose();
      generator.dispose();
    }
  })();
  scene.environment = target.texture;
  scene.environmentIntensity = 0.65;
  return () => {
    scene.environment = previous;
    scene.environmentIntensity = previousIntensity;
    target.dispose();
  };
}
