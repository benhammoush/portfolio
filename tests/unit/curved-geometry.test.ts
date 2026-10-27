/**
 * Curved tessellation retains authored vertices, normalized skinning and cache ownership.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import { refineCurvedGeometry } from '../../src/world/curved-geometry';

/**
 * A coarse spherical triangle with two different bone-slot assignments.
 * @returns An indexed fixture whose source arrays must remain unchanged.
 */
function curvedTriangle(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3),
  );
  geometry.setAttribute(
    'normal',
    new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3),
  );
  geometry.setAttribute(
    'skinIndex',
    new Uint16BufferAttribute([0, 1, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0], 4),
  );
  geometry.setAttribute(
    'skinWeight',
    new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4),
  );
  geometry.setIndex([0, 1, 2]);
  return geometry;
}

test('one refinement curves chords, quadruples triangles and preserves original vertices without mutating the source', () => {
  const source = curvedTriangle();
  const before = source.toJSON();
  const refined = refineCurvedGeometry(source);
  expect(refined.index!.count).toBe(12);
  expect(refined.getAttribute('position').count).toBe(6);
  expect(source.toJSON()).toEqual(before);
  expect([...refined.getAttribute('position').array].slice(0, 9)).toEqual([
    ...source.getAttribute('position').array,
  ]);
  const midpoint = new Vector3().fromBufferAttribute(
    refined.getAttribute('position'),
    3,
  );
  expect(midpoint.toArray()).toEqual([0.625, 0.625, 0]);
  expect(Math.abs(1 - midpoint.length())).toBeLessThan(1 - Math.SQRT1_2);
  for (let i = 0; i < refined.getAttribute('normal').count; i++)
    expect(
      new Vector3()
        .fromBufferAttribute(refined.getAttribute('normal'), i)
        .length(),
    ).toBeCloseTo(1);
  refined.dispose();
  source.dispose();
});

test('new skin influences are blended by bone identity and normalized, never interpolated bone indices', () => {
  const refined = refineCurvedGeometry(curvedTriangle());
  const bones = refined.getAttribute('skinIndex'),
    weights = refined.getAttribute('skinWeight');
  expect([bones.getX(3), bones.getY(3)]).toEqual([0, 1]);
  expect([weights.getX(3), weights.getY(3)]).toEqual([0.5, 0.5]);
  for (let i = 0; i < weights.count; i++) {
    expect(
      [0, 1, 2, 3].reduce(
        (sum, slot) => sum + weights.getComponent(i, slot),
        0,
      ),
    ).toBeCloseTo(1);
    for (let slot = 0; slot < 4; slot++)
      expect(Number.isInteger(bones.getComponent(i, slot))).toBe(true);
  }
});

test('a refinement boundary stays on the untouched edge of an adjacent furniture triangle', () => {
  const source = new BufferGeometry();
  source.setAttribute(
    'position',
    new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3),
  );
  source.setAttribute(
    'normal',
    new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0.5, 0, 0.866, 0, 0, 1], 3),
  );
  source.setIndex([0, 1, 2, 0, 2, 3]);
  const result = refineCurvedGeometry(source, (_a, b) => b === 1);
  expect(result.index!.count).toBe(15);
  expect([...result.index!.array].slice(-3)).toEqual([0, 2, 3]);
  expect(
    new Vector3()
      .fromBufferAttribute(result.getAttribute('position'), 6)
      .toArray(),
  ).toEqual([0.5, 0.5, 0]);
});

test('opposing endpoint normals retain a finite authored direction at a folded seam', () => {
  const source = curvedTriangle();
  source.getAttribute('normal').setXYZ(1, -1, 0, 0);
  const result = refineCurvedGeometry(source);
  const midpointNormal = new Vector3().fromBufferAttribute(
    result.getAttribute('normal'),
    3,
  );
  expect(midpointNormal.toArray()).toEqual([1, 0, 0]);
});
