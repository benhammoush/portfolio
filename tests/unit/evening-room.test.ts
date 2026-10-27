/**
 * The preview-approved room fits existing geometry and owns all added resources.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';
import { Box3, Group, Mesh, PointLight, Scene, SpotLight } from 'three';
import type { BufferGeometry, Material } from 'three';
import { installEveningRoom } from '../../src/world/evening-room';

test('lamp rests inside the desktop footprint with only one bounded shadow light', () => {
  const scene = new Scene();
  const cleanup = installEveningRoom(scene);
  const base = scene.getObjectByName('desk-lamp-base')!;
  const bounds = new Box3().setFromObject(base);
  expect(bounds.min.y).toBeCloseTo(0.8275, 5);
  expect(bounds.min.x).toBeGreaterThan(0.88);
  expect(bounds.max.x).toBeLessThan(1.1);
  expect(bounds.min.z).toBeGreaterThan(-0.65);
  expect(bounds.max.z).toBeLessThan(-0.3);
  expect(scene.getObjectByName('evening-wall')!.position.z).toBeLessThan(-0.65);
  const shadows: SpotLight[] = [];
  scene.traverse((object) => {
    if (object instanceof SpotLight && object.castShadow) shadows.push(object);
  });
  expect(shadows).toHaveLength(1);
  expect(shadows[0].shadow.mapSize.toArray()).toEqual([1024, 1024]);
  expect(shadows[0].decay).toBe(2);
  expect(shadows[0].target.parent).not.toBeNull();
  cleanup();
});

test('room cleanup releases shared local resources once and preserves unrelated scene objects', () => {
  const scene = new Scene();
  const existing = new Group();
  scene.add(existing);
  const cleanup = installEveningRoom(scene);
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const lights: (SpotLight | PointLight)[] = [];
  scene.getObjectByName('evening-room')!.traverse((object) => {
    if (object instanceof Mesh) {
      const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material])
        materials.add(material);
    }
    if (object instanceof SpotLight || object instanceof PointLight)
      lights.push(object);
  });
  const dispose = [...geometries, ...materials, ...lights].map((resource) =>
    vi.spyOn(resource, 'dispose'),
  );
  cleanup();
  expect(scene.children).toEqual([existing]);
  for (const release of dispose) expect(release).toHaveBeenCalledOnce();
  const removeFresh = installEveningRoom(scene);
  expect(scene.getObjectByName('evening-room')).toBeDefined();
  removeFresh();
  expect(scene.children).toEqual([existing]);
});
