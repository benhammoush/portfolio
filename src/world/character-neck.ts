/**
 * Clone-local repair of the exported neck's exposed, decimated end seams.
 * @packageDocumentation
 */
import {
  BufferGeometry,
  BufferAttribute,
  CatmullRomCurve3,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Replace only the disconnected neck component with a smooth tucked-in surface.
 * Authored skin bindings remain intact; face, ears and hand vertices never move.
 * @param source - Read-only character skin batch in exported model coordinates.
 * @returns Owned geometry with the neck's uneven caps hidden inside adjoining surfaces.
 */
export function repairCharacterNeck(source: BufferGeometry): BufferGeometry {
  const result = source.clone();
  const positions = source.getAttribute('position');
  const parents = Array.from({ length: positions.count }, (_, index) => index);
  /**
   * Find a vertex island with path compression.
   * @param index - Original vertex index.
   * @returns Island representative.
   */
  function root(index: number): number {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  }
  const welded = new Map<string, number>();
  for (let index = 0; index < positions.count; index++) {
    const key = [
      positions.getX(index),
      positions.getY(index),
      positions.getZ(index),
    ]
      .map((value) => Math.round(value * 1e5))
      .join(':');
    const previous = welded.get(key);
    if (previous !== undefined) parents[root(index)] = root(previous);
    else welded.set(key, index);
  }
  const indices = source.index;
  for (
    let offset = 0;
    offset < (indices?.count ?? positions.count);
    offset += 3
  ) {
    const a = indices?.getX(offset) ?? offset;
    const b = indices?.getX(offset + 1) ?? offset + 1;
    const c = indices?.getX(offset + 2) ?? offset + 2;
    parents[root(b)] = root(a);
    parents[root(c)] = root(a);
  }
  // The neck is the only skin island starting at the sweatshirt opening.
  const seed = Array.from(
    { length: positions.count },
    (_, index) => index,
  ).find(
    (index) =>
      positions.getY(index) > 1.07 &&
      positions.getY(index) < 1.085 &&
      positions.getX(index) > 0 &&
      positions.getX(index) < 0.13 &&
      positions.getZ(index) > 0.48 &&
      positions.getZ(index) < 0.63,
  );
  if (seed === undefined) return result;
  const neck = root(seed);
  const vertices: number[] = [];
  for (let index = 0; index < positions.count; index++) {
    if (root(index) === neck) vertices.push(index);
  }
  const kept: number[] = [];
  for (
    let offset = 0;
    offset < (indices?.count ?? positions.count);
    offset += 3
  ) {
    const a = indices?.getX(offset) ?? offset;
    if (root(a) !== neck)
      kept.push(
        a,
        indices?.getX(offset + 1) ?? offset + 1,
        indices?.getX(offset + 2) ?? offset + 2,
      );
  }
  result.setIndex(kept);
  const weights = source.getAttribute('skinWeight'),
    bones = source.getAttribute('skinIndex');
  const sorted = [...vertices].sort(
    (a, b) => positions.getY(a) - positions.getY(b),
  );
  /**
   * Recover the authored endpoint bone from the original neck, not a guessed rig index.
   * @param vertex - Neck endpoint vertex.
   * @returns Dominant original bone index.
   */
  function dominantBone(vertex: number): number {
    let slot = 0;
    for (let index = 1; index < 4; index++)
      if (
        weights.getComponent(vertex, index) > weights.getComponent(vertex, slot)
      )
        slot = index;
    return bones.getComponent(vertex, slot);
  }
  const spine = weights && bones ? dominantBone(sorted[0]) : 0;
  const head = weights && bones ? dominantBone(sorted[sorted.length - 1]) : 0;
  // Original loft dimensions and posed root rotation; only the hidden ends taper inward.
  const levels = [
    [1.055, 0.043, 0.04, 0.154],
    [1.08, 0.05, 0.046, 0.16],
    [1.12, 0.053, 0.048, 0.18],
    [1.16, 0.051, 0.047, 0.198],
    [1.185, 0.045, 0.041, 0.205],
    [1.215, 0.025, 0.022, 0.21],
    [1.235, 0.012, 0.01, 0.21],
  ];
  const centers = new CatmullRomCurve3(
    levels.map(([y, , , offset]) => new Vector3(y, offset, 0)),
  );
  const radii = new CatmullRomCurve3(
    levels.map(([, x, z]) => new Vector3(x, z, 0)),
  );
  const attributes = Object.entries(source.attributes);
  const data = new Map(attributes.map(([name]) => [name, [] as number[]]));
  const triangles: number[] = [];
  const rows = 32,
    segments = 64,
    cosine = Math.cos(0.35),
    sine = Math.sin(0.35);
  for (let row = 0; row <= rows; row++) {
    const center = centers.getPoint(row / rows),
      radius = radii.getPoint(row / rows);
    const amount = Math.max(0, Math.min(1, (center.x - 1.08) / 0.065));
    const blend = amount * amount * (3 - 2 * amount);
    for (let column = 0; column < segments; column++) {
      const angle = (column / segments) * Math.PI * 2;
      const localX = radius.x * Math.cos(angle),
        localY = center.y + radius.y * Math.sin(angle);
      const point = new Vector3(
        cosine * localX + sine * localY,
        center.x,
        0.72 + sine * localX - cosine * localY,
      );
      let nearest = vertices[0],
        distance = Infinity;
      for (const vertex of vertices) {
        const next =
          (positions.getX(vertex) - point.x) ** 2 +
          (positions.getY(vertex) - point.y) ** 2 +
          (positions.getZ(vertex) - point.z) ** 2;
        if (next < distance) {
          distance = next;
          nearest = vertex;
        }
      }
      for (const [name, attribute] of attributes) {
        const values = data.get(name)!;
        if (name === 'position') values.push(point.x, point.y, point.z);
        else if (name === 'skinIndex') values.push(spine, head, 0, 0);
        else if (name === 'skinWeight')
          values.push(
            spine === head ? 1 : 1 - blend,
            spine === head ? 0 : blend,
            0,
            0,
          );
        else
          for (let slot = 0; slot < attribute.itemSize; slot++)
            values.push(attribute.getComponent(nearest, slot));
      }
      if (row < rows) {
        const a = row * segments + column,
          next = row * segments + ((column + 1) % segments);
        triangles.push(
          a,
          next,
          a + segments,
          next,
          next + segments,
          a + segments,
        );
      }
    }
  }
  const tube = new BufferGeometry();
  for (const [name, attribute] of attributes) {
    const values = data.get(name)!;
    // GLTF skin indices can be Uint8, not Uint16; material batches require identical storage.
    const ArrayType = attribute.array.constructor as typeof Float32Array;
    const output = new BufferAttribute(
      new ArrayType(values.length),
      attribute.itemSize,
      attribute.normalized,
    );
    for (let index = 0; index < output.count; index++)
      for (let slot = 0; slot < attribute.itemSize; slot++)
        output.setComponent(
          index,
          slot,
          values[index * attribute.itemSize + slot],
        );
    tube.setAttribute(name, output);
  }
  tube.setIndex(triangles);
  tube.computeVertexNormals();
  // Ends are intentionally open and buried inside the head/shirt, avoiding cap pinching.
  const merged = mergeGeometries([result, tube]);
  result.dispose();
  tube.dispose();
  if (!merged)
    throw new Error(
      'Character neck attributes could not be merged with the skin batch',
    );
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}
