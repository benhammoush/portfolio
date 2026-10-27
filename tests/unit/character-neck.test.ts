/**
 * Neck repairs hide end caps while preserving disconnected anatomy and skin bindings.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import {
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  Mesh,
  Group,
  MeshStandardMaterial,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint8BufferAttribute,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { repairCharacterNeck } from '../../src/world/character-neck';
import { installPersonalModel } from '../../src/world/personal-model';

test.each([8, 16])(
  'only the neck island is replaced, preserving anatomy and %i-bit skin storage',
  (bits) => {
    const neck = new CylinderGeometry(0.05, 0.053, 0.1, 16, 2).translate(
      0.06,
      1.125,
      0.55,
    );
    const head = new SphereGeometry(0.1, 16, 12).translate(0.06, 1.3, 0.55);
    const hand = new SphereGeometry(0.03, 16, 12).translate(0.3, 0.86, 0.1);
    const source = mergeGeometries([neck, head, hand]);
    const count = source.getAttribute('position').count;
    const bones = new Uint16Array(count * 4),
      weights = new Float32Array(count * 4);
    for (let index = 0; index < count; index++) {
      bones[index * 4] =
        index < neck.getAttribute('position').count &&
        source.getAttribute('position').getY(index) > 1.145
          ? 3
          : 2;
      weights[index * 4] = 1;
    }
    source.setAttribute(
      'skinIndex',
      bits === 8
        ? new Uint8BufferAttribute(bones, 4)
        : new Uint16BufferAttribute(bones, 4),
    );
    source.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
    const before = source.toJSON();
    const repaired = repairCharacterNeck(source);
    expect(repaired.getAttribute('skinIndex').array.constructor).toBe(
      source.getAttribute('skinIndex').array.constructor,
    );
    expect(source.toJSON()).toEqual(before);
    expect(
      [...repaired.getAttribute('skinIndex').array].slice(0, bones.length),
    ).toEqual([...bones]);
    expect(
      [...repaired.getAttribute('skinWeight').array].slice(0, weights.length),
    ).toEqual([...weights]);
    const positions = repaired.getAttribute('position'),
      original = source.getAttribute('position');
    let lower = false,
      upper = false;
    expect(positions.count).toBe(count + 33 * 64);
    for (const index of repaired.index!.array)
      expect(index).toBeGreaterThanOrEqual(neck.getAttribute('position').count);
    let blended = false;
    for (let index = 0; index < positions.count; index++) {
      if (index < count) {
        expect(positions.getX(index)).toBe(original.getX(index));
        expect(positions.getY(index)).toBe(original.getY(index));
        expect(positions.getZ(index)).toBe(original.getZ(index));
      } else {
        if (positions.getY(index) < 1.06) lower = true;
        if (positions.getY(index) > 1.23) upper = true;
        const skin = repaired.getAttribute('skinWeight'),
          ids = repaired.getAttribute('skinIndex');
        expect(skin.getX(index) + skin.getY(index)).toBeCloseTo(1, 6);
        expect(ids.getX(index)).toBe(2);
        expect(ids.getY(index)).toBe(3);
        if (skin.getX(index) > 0 && skin.getY(index) > 0) blended = true;
      }
      const normals = repaired.getAttribute('normal');
      expect(
        Math.hypot(
          normals.getX(index),
          normals.getY(index),
          normals.getZ(index),
        ),
      ).toBeCloseTo(1, 5);
    }
    expect(lower && upper && blended).toBe(true);
    [neck, head, hand, source, repaired].forEach((geometry) =>
      geometry.dispose(),
    );
  },
);

test('the collar ring is removed from the rib batch without deleting cuffs, and cleanup restores the original', () => {
  const collar = new TorusGeometry(0.065, 0.004, 8, 32)
    .rotateX(Math.PI / 2)
    .translate(0.06, 1.095, 0.56);
  const cuff = new TorusGeometry(0.03, 0.004, 8, 32)
    .rotateX(Math.PI / 2)
    .translate(0.3, 0.86, 0.1);
  const source = mergeGeometries([collar, cuff]);
  const mesh = new Mesh(source, new MeshStandardMaterial());
  mesh.name = 'Web__Character_review__rib001';
  const scene = new Group();
  scene.add(mesh);
  const cleanup = installPersonalModel(scene);
  expect(mesh.geometry.index!.count).toBe(cuff.index!.count * 4);
  const positions = mesh.geometry.getAttribute('position');
  for (const index of mesh.geometry.index!.array)
    expect(positions.getY(index)).toBeLessThan(1.05);
  cleanup();
  expect(mesh.geometry).toBe(source);
  [collar, cuff, source].forEach((geometry) => geometry.dispose());
  mesh.material.dispose();
});
