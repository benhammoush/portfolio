/**
 * Original city geometry and bounded traffic retain the approved composition and motion contracts.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import { Box3, Color, Light, Mesh, Raycaster, Vector3 } from 'three';
import type { BufferGeometry, Material, Object3D } from 'three';
import { createRiverfrontCity } from '../../src/world/riverfront-city';
import { createCityTraffic } from '../../src/world/city-traffic';

/**
 * Release fixture resources once, including shared vehicle prototypes.
 * @param roots - Independently owned fixture roots.
 */
function disposeFixtures(...roots: Object3D[]): void {
  const resources = new Set<BufferGeometry | Material>();
  for (const root of roots)
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const mesh = object as Mesh<BufferGeometry, Material>;
      resources.add(mesh.geometry);
      resources.add(mesh.material);
    });
  for (const resource of resources) resource.dispose();
}

test('night city stays deterministic and bounded without textures, lights or per-building draw calls', () => {
  const first = createRiverfrontCity();
  const second = createRiverfrontCity();
  expect(first.children).toHaveLength(13);
  let triangles = 0;
  first.traverse((object) => {
    expect(object).not.toBeInstanceOf(Light);
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material>;
    const positions = mesh.geometry.getAttribute('position');
    const colors = mesh.geometry.getAttribute('color');
    const other = second.getObjectByName(mesh.name) as Mesh<BufferGeometry>;
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(colors.array).every(Number.isFinite)).toBe(true);
    expect(colors.count).toBe(positions.count);
    expect(
      positions.array.every(
        (value, index) =>
          value === other.geometry.getAttribute('position').array[index],
      ),
    ).toBe(true);
    expect(mesh.castShadow).toBe(false);
    triangles += (mesh.geometry.index?.count ?? positions.count) / 3;
  });
  expect(triangles).toBeLessThan(100_000);
  disposeFixtures(first, second);
});

test('aligned fishing boats stay parked, flags ripple from pinned edges, and road traffic stays smaller', () => {
  const traffic = createCityTraffic();
  const road = traffic.group.getObjectByName('bridge-traffic')!;
  expect(road.children).toHaveLength(8);
  expect(road.children.filter((mesh) => mesh.name === 'car')).toHaveLength(4);
  expect(
    road.children.every((mesh) =>
      mesh.scale.equals(new Vector3(0.7, 0.7, 0.7)),
    ),
  ).toBe(true);
  const parked = traffic.group.children.filter((mesh) =>
    mesh.name.startsWith('parked-fishing-boat-'),
  );
  expect(parked.map((mesh) => mesh.scale.x)).toEqual([0.3, 0.2625]);
  expect(parked[0].rotation.y).toBe(parked[1].rotation.y);
  const separation = parked[1].position.clone().sub(parked[0].position);
  expect(separation.length()).toBeCloseTo(0.5);
  expect(
    separation.dot(
      new Vector3(
        Math.cos(parked[0].rotation.y),
        0,
        -Math.sin(parked[0].rotation.y),
      ),
    ),
  ).toBeCloseTo(0);
  const parkedPositions = parked.map((mesh) => mesh.position.toArray());
  const flags = parked.map(
    (mesh) => mesh.getObjectByName('vietnam-flag') as Mesh<BufferGeometry>,
  );
  const initialFlags = flags.map(
    (flag) => new Float32Array(flag.geometry.getAttribute('position').array),
  );
  const initialCars = road.children.map((mesh) => mesh.position.x);
  traffic.update(5);
  expect(parked.map((mesh) => mesh.position.toArray())).toEqual(
    parkedPositions,
  );
  expect(road.children.map((mesh) => mesh.position.x)).not.toEqual(initialCars);
  for (const [flagIndex, flag] of flags.entries()) {
    const positions = flag.geometry.getAttribute('position').array;
    expect(positions).not.toEqual(initialFlags[flagIndex]);
    expect(Array.from(positions).every(Number.isFinite)).toBe(true);
    for (let index = 0; index < positions.length; index += 3) {
      if (Math.abs(positions[index] - 0.88) > 1e-6) continue;
      expect(positions[index + 1]).toBe(initialFlags[flagIndex][index + 1]);
      expect(positions[index + 2]).toBe(initialFlags[flagIndex][index + 2]);
    }
    const colors = flag.geometry.getAttribute('color').array;
    for (const tint of ['#e9363e', '#ffe45d']) {
      const expected = new Color(tint).multiplyScalar(0.75).toArray();
      let found = false;
      for (let index = 0; index < colors.length; index += 3)
        if (
          expected.every(
            (value, channel) =>
              Math.abs(value - colors[index + channel]) < 1e-6,
          )
        )
          found = true;
      expect(found).toBe(true);
    }
  }
  traffic.update(0);
  for (const [index, flag] of flags.entries())
    expect(flag.geometry.getAttribute('position').array).toEqual(
      initialFlags[index],
    );
  disposeFixtures(traffic.group);
});

test('one small neon boat has quiet intervals and physically clears the bridge underside between piers', () => {
  const city = createRiverfrontCity();
  const traffic = createCityTraffic();
  const passenger = traffic.group.getObjectByName('passing-cruise-boat')!;
  expect(passenger.scale.x).toBe(0.32);
  expect(passenger.position.z).toBe(-14.4);
  const crossingX = (-12 - passenger.position.z) / Math.tan(0.5);
  traffic.update((crossingX + 18) / 0.65 - 30);
  expect(passenger.position.x).toBeCloseTo(crossingX);
  traffic.group.updateMatrixWorld(true);
  city.updateMatrixWorld(true);
  const ray = new Raycaster(
    new Vector3(crossingX, -0.06, passenger.position.z),
    new Vector3(0, 1, 0),
  );
  const deck = ray.intersectObject(
    city.getObjectByName('riverfront-bridges')!,
  )[0];
  expect(new Box3().setFromObject(passenger).max.y).toBeLessThan(
    deck.point.y - 0.1,
  );
  traffic.update(100);
  expect(passenger.visible).toBe(false);
  traffic.update(0);
  expect(passenger.visible).toBe(true);
  disposeFixtures(city, traffic.group);
});
