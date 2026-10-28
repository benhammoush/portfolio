/**
 * The preview-approved room fits existing geometry and owns all added resources.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';
import {
  Box3,
  Group,
  Mesh,
  PointLight,
  Raycaster,
  Scene,
  SpotLight,
  Vector3,
} from 'three';
import type { BufferGeometry, Material } from 'three';
import { installEveningRoom } from '../../src/world/evening-room';
import { CITY_WINDOW } from '../../src/world/city-window';

test('portrait window is a real hole in the back wall with a recessed pane and clear desk props', () => {
  const scene = new Scene();
  const cleanup = installEveningRoom(scene);
  scene.updateMatrixWorld(true);
  const { left, right, bottom, top, wallZ } = CITY_WINDOW;
  expect(right - left).toBeCloseTo(0.65);
  expect(top - bottom).toBeCloseTo(1.4);
  expect(left).toBe(1.4);
  expect(top).toBe(2.42);
  const ray = new Raycaster(
    new Vector3((left + right) / 2, (bottom + top) / 2, 3),
    new Vector3(0, 0, -1),
  );
  const wall = scene.getObjectByName('evening-wall')!;
  expect(ray.intersectObject(wall)).toHaveLength(0);
  const pane = scene.getObjectByName('city-window-view')!;
  const hit = ray.intersectObject(pane)[0];
  expect(hit.point.z).toBeLessThan(wallZ);
  for (const [x, y] of [
    [left - 0.05, (bottom + top) / 2],
    [right + 0.05, (bottom + top) / 2],
    [(left + right) / 2, bottom - 0.1],
    [(left + right) / 2, top + 0.1],
  ]) {
    ray.ray.origin.set(x, y, 3);
    expect(ray.intersectObject(wall)).toHaveLength(1);
  }
  expect(left).toBeGreaterThan(1.1);
  const sill = new Box3().setFromObject(
    scene.getObjectByName('city-window-sill')!,
  );
  expect(sill.max.y).toBeLessThan(bottom);
  expect(sill.max.z).toBeGreaterThan(wallZ);
  cleanup();
});

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
