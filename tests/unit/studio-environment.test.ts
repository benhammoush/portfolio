/**
 * Verify environment restoration and ownership without requiring a GPU in unit tests.
 * @packageDocumentation
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { Scene, Texture } from 'three';
import type { WebGLRenderer } from 'three';
import { installStudioEnvironment } from '../../src/world/studio-environment';

const fixtures = vi.hoisted(() => ({
  fromScene: vi.fn(),
  roomDispose: vi.fn(),
  instanceDispose: vi.fn(),
  generatorDispose: vi.fn(),
  targetDispose: vi.fn(),
}));

vi.mock('three', async (importOriginal) => {
  const original = await importOriginal<typeof import('three')>();
  return {
    ...original,
    /** GPU-free capture fixture; tests exercise the real ownership helper. */
    PMREMGenerator: class {
      fromScene = fixtures.fromScene;
      dispose = fixtures.generatorDispose;
    },
  };
});

vi.mock('three/addons/environments/RoomEnvironment.js', async () => {
  const { InstancedMesh, BoxGeometry, MeshBasicMaterial } =
    await import('three');
  return {
    /** Simulate room-owned instance buffers separately from geometry/material cleanup. */
    RoomEnvironment: class {
      /**
       * Visit a real instance type with a tracked dispose operation.
       * @param visitor - Resource cleanup visitor from the implementation.
       */
      traverse(visitor: (mesh: InstanceType<typeof InstancedMesh>) => void) {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        const mesh = new InstancedMesh(geometry, material, 1);
        mesh.dispose = fixtures.instanceDispose;
        visitor(mesh);
        geometry.dispose();
        material.dispose();
      }
      dispose = fixtures.roomDispose;
    },
  };
});

beforeEach(() => vi.clearAllMocks());

test('restores prior scene state and disposes intermediate/output resources', () => {
  const scene = new Scene();
  const previous = new Texture();
  const output = new Texture();
  scene.environment = previous;
  scene.environmentIntensity = 1.3;
  fixtures.fromScene.mockReturnValue({
    texture: output,
    dispose: fixtures.targetDispose,
  });
  const cleanup = installStudioEnvironment(scene, {} as WebGLRenderer);
  expect(scene.environment).toBe(output);
  expect(scene.environmentIntensity).toBe(0.65);
  expect(fixtures.instanceDispose).toHaveBeenCalledOnce();
  expect(fixtures.roomDispose).toHaveBeenCalledOnce();
  expect(fixtures.generatorDispose).toHaveBeenCalledOnce();
  expect(fixtures.targetDispose).not.toHaveBeenCalled();
  cleanup();
  expect(scene.environment).toBe(previous);
  expect(scene.environmentIntensity).toBe(1.3);
  expect(fixtures.targetDispose).toHaveBeenCalledOnce();
});

test('failed capture cleans intermediates without replacing the prior environment', () => {
  const scene = new Scene();
  const previous = new Texture();
  scene.environment = previous;
  fixtures.fromScene.mockImplementationOnce(() => {
    throw new Error('Capture failed');
  });
  expect(() => installStudioEnvironment(scene, {} as WebGLRenderer)).toThrow(
    'Capture failed',
  );
  expect(scene.environment).toBe(previous);
  expect(scene.environmentIntensity).toBe(1);
  expect(fixtures.instanceDispose).toHaveBeenCalledOnce();
  expect(fixtures.roomDispose).toHaveBeenCalledOnce();
  expect(fixtures.generatorDispose).toHaveBeenCalledOnce();
});
