/**
 * One bounded point-normal refinement of owned, single-material model surfaces.
 * @packageDocumentation
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Vector3,
} from 'three';

/**
 * Split selected triangles into four, curving new edge points along authored normals.
 * Existing vertices stay fixed; skin influences are blended by bone, not by slot.
 * @param source - Cached geometry, read only; no morph targets or material groups.
 * @param select - Optional original-triangle predicate for mixed furniture batches.
 * @returns A locally owned geometry, with original seams and animation attributes retained.
 */
export function refineCurvedGeometry(
  source: BufferGeometry,
  select: (a: number, b: number, c: number) => boolean = () => true,
): BufferGeometry {
  const position = source.getAttribute('position');
  const normal = source.getAttribute('normal');
  if (
    !position ||
    !normal ||
    source.groups.length ||
    Object.keys(source.morphAttributes).length
  )
    throw new Error(
      'Curved refinement requires a single-material position/normal surface without morphs',
    );
  const attributes = Object.entries(source.attributes);
  const data = new Map(
    attributes.map(([name, attribute]) => [
      name,
      Array.from({ length: attribute.count * attribute.itemSize }, (_, i) =>
        attribute.getComponent(
          Math.floor(i / attribute.itemSize),
          i % attribute.itemSize,
        ),
      ),
    ]),
  );
  const edges = new Map<string, number>();
  const fixedEdges = new Set<string>();
  const triangles: number[] = [];
  const aPoint = new Vector3(),
    bPoint = new Vector3(),
    aNormal = new Vector3(),
    bNormal = new Vector3();

  /**
   * Reuse one curved midpoint per indexed edge, keeping adjacent triangles joined.
   * @param a - Original first endpoint index.
   * @param b - Original second endpoint index.
   * @returns New shared vertex index.
   */
  function midpoint(a: number, b: number): number {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    const previous = edges.get(key);
    if (previous !== undefined) return previous;
    const index = data.get('position')!.length / 3;
    for (const [name, attribute] of attributes) {
      const values = data.get(name)!;
      for (let component = 0; component < attribute.itemSize; component++)
        values.push(
          (attribute.getComponent(a, component) +
            attribute.getComponent(b, component)) /
            2,
        );
    }
    aPoint.fromBufferAttribute(position, a);
    bPoint.fromBufferAttribute(position, b);
    aNormal.fromBufferAttribute(normal, a).normalize();
    bNormal.fromBufferAttribute(normal, b).normalize();
    const direction = bPoint.clone().sub(aPoint);
    // Cubic point-normal edge midpoint: tangents relax the chord toward the curved silhouette.
    const curved = aPoint.add(bPoint).multiplyScalar(0.5);
    if (!fixedEdges.has(key))
      curved
        .addScaledVector(bNormal, direction.dot(bNormal) / 8)
        .addScaledVector(aNormal, -direction.dot(aNormal) / 8);
    const smooth = aNormal.clone().add(bNormal);
    // A folded seam can have opposing normals; retain an authored normal rather than zero.
    if (smooth.lengthSq() < 1e-12) smooth.copy(aNormal);
    smooth.normalize();
    const points = data.get('position')!,
      normals = data.get('normal')!;
    for (let axis = 0; axis < 3; axis++) {
      points[index * 3 + axis] = curved.getComponent(axis);
      normals[index * 3 + axis] = smooth.getComponent(axis);
    }
    const skinIndex = source.getAttribute('skinIndex');
    const skinWeight = source.getAttribute('skinWeight');
    if (skinIndex && skinWeight) {
      const weights = new Map<number, number>();
      for (const vertex of [a, b])
        for (let slot = 0; slot < 4; slot++) {
          const bone = skinIndex.getComponent(vertex, slot);
          weights.set(
            bone,
            (weights.get(bone) ?? 0) +
              skinWeight.getComponent(vertex, slot) * 0.5,
          );
        }
      const influences = [...weights].sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = influences.reduce(
        (sum, influence) => sum + influence[1],
        0,
      );
      for (let slot = 0; slot < 4; slot++) {
        data.get('skinIndex')![index * 4 + slot] = influences[slot]?.[0] ?? 0;
        data.get('skinWeight')![index * 4 + slot] =
          total > 0 ? (influences[slot]?.[1] ?? 0) / total : Number(slot === 0);
      }
    }
    edges.set(key, index);
    return index;
  }

  const sourceIndex = source.index;
  const count = sourceIndex?.count ?? position.count;
  const selected: boolean[] = [];
  for (let offset = 0; offset < count; offset += 3) {
    const a = sourceIndex?.getX(offset) ?? offset;
    const b = sourceIndex?.getX(offset + 1) ?? offset + 1;
    const c = sourceIndex?.getX(offset + 2) ?? offset + 2;
    const refine = select(a, b, c);
    selected.push(refine);
    if (!refine)
      for (const [from, to] of [
        [a, b],
        [b, c],
        [c, a],
      ])
        fixedEdges.add(from < to ? `${from}:${to}` : `${to}:${from}`);
  }
  for (let offset = 0; offset < count; offset += 3) {
    const a = sourceIndex?.getX(offset) ?? offset;
    const b = sourceIndex?.getX(offset + 1) ?? offset + 1;
    const c = sourceIndex?.getX(offset + 2) ?? offset + 2;
    if (!selected[offset / 3]) {
      triangles.push(a, b, c);
      continue;
    }
    const ab = midpoint(a, b),
      bc = midpoint(b, c),
      ca = midpoint(c, a);
    triangles.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  const result = new BufferGeometry();
  for (const [name, attribute] of attributes) {
    const values = data.get(name)!;
    result.setAttribute(
      name,
      name === 'skinIndex'
        ? new Uint16BufferAttribute(values, attribute.itemSize)
        : new Float32BufferAttribute(values, attribute.itemSize),
    );
  }
  result.setIndex(triangles);
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}
