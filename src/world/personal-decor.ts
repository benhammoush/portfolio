/**
 * Personal wall pieces and a small sculpted bonsai, owned by the evening room.
 * @packageDocumentation
 */
import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { BufferGeometry, Material } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Apply the approved slim, tucked-waist contour without changing the rest of the statue.
 * @param geometry - Owned torso already placed in statue-local coordinates.
 */
function shapePlancheTorso(geometry: BufferGeometry): void {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const waist = Math.exp(-(((x - 0.012) / 0.028) ** 2));
    const back = Math.exp(-(((x - 0.105) / 0.035) ** 2));
    const waistSlope = (-2 * (x - 0.012) * waist) / 0.028 ** 2;
    const backSlope = (-2 * (x - 0.105) * back) / 0.035 ** 2;
    const radial = 0.75 * (1 - 0.2 * waist);
    const radialSlope = -0.75 * 0.2 * waistSlope;
    const lift = 0.006 * back - 0.002 * waist;
    positions.setXYZ(index, x, 0.18 + lift + (y - 0.18) * radial, z * radial);
    // Curvature changes the surface normal: use the deformation's inverse transpose.
    const dy =
      0.006 * backSlope - 0.002 * waistSlope + (y - 0.18) * radialSlope;
    const dz = z * radialSlope;
    const ny = normals.getY(index) / radial;
    const nz = normals.getZ(index) / radial;
    const nx = normals.getX(index) - dy * ny - dz * nz;
    const length = Math.hypot(nx, ny, nz);
    normals.setXYZ(index, nx / length, ny / length, nz / length);
  }
}

/**
 * Build static decor in small material batches, without adding animation or lights.
 * @returns Room-owned decorative assemblies and their disposable resources.
 */
export function createPersonalDecor(): Group {
  const decor = new Group();
  decor.name = 'personal-decor';
  const oak = new MeshStandardMaterial({ color: '#805538', roughness: 0.86 });
  const darkWood = new MeshStandardMaterial({ color: '#31251e', roughness: 1 });
  const bronze = new MeshStandardMaterial({
    color: '#77776b',
    metalness: 0.55,
    roughness: 0.64,
  });
  const bark = new MeshStandardMaterial({ color: '#654635', roughness: 1 });
  const green = new MeshStandardMaterial({ color: '#365b32', roughness: 1 });
  const pot = new MeshStandardMaterial({ color: '#39494b', roughness: 0.8 });

  /**
   * Attach one shaped mesh, subsequently merged into its local material batch.
   * @param parent - Assembly owning the mesh.
   * @param geometry - Locally owned shape.
   * @param material - Shared decorative finish.
   * @param at - Assembly-local position.
   * @param scale - Optional nonuniform shape scaling.
   * @returns The attached mesh.
   */
  function mesh(
    parent: Group,
    geometry: BufferGeometry,
    material: Material,
    at: readonly [number, number, number],
    scale?: readonly [number, number, number],
  ) {
    const object = new Mesh(geometry, material);
    object.position.set(...at);
    if (scale) object.scale.set(...scale);
    parent.add(object);
    return object;
  }
  /**
   * Fit a tapered branch or sculptural limb between two joints.
   * @param parent - Owning assembly.
   * @param from - Lower joint.
   * @param to - Upper joint.
   * @param bottom - Lower radius.
   * @param top - Upper radius.
   * @param material - Shared finish.
   */
  function limb(
    parent: Group,
    from: readonly [number, number, number],
    to: readonly [number, number, number],
    bottom: number,
    top: number,
    material: Material,
  ) {
    const a = new Vector3(...from),
      b = new Vector3(...to);
    const direction = b.clone().sub(a);
    const object = mesh(
      parent,
      new CylinderGeometry(top, bottom, direction.length(), 24),
      material,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
    );
    object.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.normalize(),
    );
  }
  /**
   * One separately named, statically batched decorative assembly.
   * @param name - Stable assembly identity.
   * @param at - Model-space position.
   * @returns An attached group.
   */
  function assembly(name: string, at: readonly [number, number, number]) {
    const group = new Group();
    group.name = name;
    group.position.set(...at);
    decor.add(group);
    return group;
  }

  // The existing wall reaches Y=7.5; the slatted section runs from floor to its top.
  const panels = assembly('vertical-wood-slats', [-1.32, 3.75, -0.875]);
  mesh(panels, new BoxGeometry(0.88, 7.5, 0.02), darkWood, [0, 0, 0]);
  const slatWood = new MeshStandardMaterial({
    color: '#ab8056',
    roughness: 0.9,
  });
  for (let slat = 0; slat < 20; slat++)
    mesh(panels, new BoxGeometry(0.031, 7.5, 0.035), slatWood, [
      -0.418 + slat * 0.044,
      0,
      0.022,
    ]);

  for (const [name, x, y, width] of [
    ['statue-shelf', 0.78, 1.48, 0.66],
  ] as const) {
    const shelf = assembly(name, [x, y, -0.79]);
    mesh(shelf, new BoxGeometry(width, 0.035, 0.24), oak, [0, 0, 0]);
    for (const side of [-1, 1])
      mesh(shelf, new BoxGeometry(0.022, 0.13, 0.15), darkWood, [
        side * width * 0.34,
        -0.07,
        -0.035,
      ]);
  }

  // A small bronze full-planche study: straight body, locked arms, palms on plinth.
  const statue = assembly('calisthenics-planche-statue', [0.78, 1.4975, -0.76]);
  statue.scale.setScalar(0.75);
  mesh(statue, new BoxGeometry(0.53, 0.028, 0.17), pot, [0, 0.014, 0]);
  const ball = new SphereGeometry(1, 32, 24);
  const torso = ball
    .clone()
    .applyMatrix4(
      new Matrix4().makeScale(0.105, 0.042, 0.054).setPosition(0.064, 0.18, 0),
    );
  shapePlancheTorso(torso);
  mesh(statue, torso, bronze, [0, 0, 0]);
  mesh(statue, ball, bronze, [-0.042, 0.181, 0], [0.045, 0.035, 0.045]);
  mesh(statue, ball, bronze, [0.189, 0.162, 0], [0.035, 0.04, 0.034]);
  limb(statue, [0.13, 0.181, 0], [0.17, 0.17, 0], 0.025, 0.024, bronze);
  for (const side of [-1, 1]) {
    const z = side * 0.033;
    mesh(statue, ball, bronze, [-0.13, 0.183, z], [0.019, 0.019, 0.019]);
    mesh(statue, ball, bronze, [0.055, 0.105, z * 1.8], [0.016, 0.016, 0.016]);
    limb(
      statue,
      [-0.035, 0.18, z * 0.65],
      [-0.13, 0.183, z],
      0.027,
      0.019,
      bronze,
    );
    limb(statue, [-0.13, 0.183, z], [-0.23, 0.19, z], 0.019, 0.012, bronze);
    mesh(statue, ball, bronze, [-0.243, 0.19, z], [0.026, 0.012, 0.014]);
    limb(
      statue,
      [0.114, 0.183, z],
      [0.055, 0.105, z * 1.8],
      0.022,
      0.016,
      bronze,
    );
    limb(
      statue,
      [0.055, 0.105, z * 1.8],
      [0.015, 0.045, z * 2],
      0.016,
      0.011,
      bronze,
    );
    mesh(statue, ball, bronze, [0.031, 0.039, z * 2], [0.031, 0.009, 0.017]);
    mesh(statue, ball, bronze, [0.114, 0.183, z], [0.025, 0.025, 0.024]);
  }

  const bonsai = assembly('bonsai', [-0.86, 0.8275, -0.41]);
  mesh(
    bonsai,
    new LatheGeometry(
      [
        [0, 0],
        [0.09, 0],
        [0.095, 0.003],
        [0.122, 0.052],
        [0.125, 0.057],
        [0.125, 0.061],
        [0.122, 0.062],
        [0.115, 0.062],
        [0.114, 0.058],
      ].map(([radius, height]) => new Vector2(radius, height)),
      64,
    ),
    pot,
    [0, 0.004, 0],
    [1, 1, 0.72],
  );
  mesh(
    bonsai,
    new CylinderGeometry(0.114, 0.114, 0.007, 64),
    darkWood,
    [0, 0.066, 0],
    [1, 1, 0.72],
  );
  const trunkPath = new CatmullRomCurve3([
    new Vector3(0, 0.06, 0),
    new Vector3(0.035, 0.17, 0),
    new Vector3(-0.015, 0.27, -0.01),
    new Vector3(0.025, 0.38, -0.01),
  ]);
  const trunk = new TubeGeometry(trunkPath, 32, 0.026, 24, false);
  const trunkPositions = trunk.getAttribute('position');
  for (let ring = 0; ring <= 32; ring++) {
    const center = trunkPath.getPointAt(ring / 32);
    const taper = 1 - (ring / 32) * 0.76;
    for (let side = 0; side <= 24; side++) {
      const index = ring * 25 + side;
      const point = new Vector3()
        .fromBufferAttribute(trunkPositions, index)
        .sub(center)
        .multiplyScalar(taper)
        .add(center);
      trunkPositions.setXYZ(index, point.x, point.y, point.z);
    }
  }
  trunk.computeVertexNormals();
  mesh(bonsai, trunk, bark, [0, 0, 0]);
  for (const [x, y, z, size] of [
    [-0.105, 0.22, 0.015, 0.095],
    [0.1, 0.285, 0, 0.09],
    [-0.065, 0.335, -0.015, 0.078],
    [0.025, 0.405, -0.01, 0.085],
  ]) {
    limb(bonsai, [0.01, y - 0.07, 0], [x, y, z], 0.011, 0.004, bark);
    for (let tuft = 0; tuft < 5; tuft++) {
      const angle = tuft * 2.4;
      mesh(
        bonsai,
        ball,
        green,
        [
          x + Math.cos(angle) * size * 0.4,
          y + Math.sin(angle * 2) * 0.012,
          z + Math.sin(angle) * size * 0.35,
        ],
        [size * 0.6, size * 0.3, size * 0.55],
      );
    }
  }

  // Batch static parts by material so the slats and foliage do not multiply draw calls.
  for (const group of decor.children as Group[]) {
    group.updateMatrix();
    const batches = new Map<Material, BufferGeometry[]>();
    const originals = new Set<BufferGeometry>();
    for (const child of [...group.children] as Mesh<
      BufferGeometry,
      Material
    >[]) {
      child.updateMatrix();
      const geometry = child.geometry.clone().applyMatrix4(child.matrix);
      const batch = batches.get(child.material) ?? [];
      batch.push(geometry);
      batches.set(child.material, batch);
      originals.add(child.geometry);
      group.remove(child);
    }
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      if (!geometry)
        throw new Error('Personal decor geometry could not be batched');
      const object = new Mesh(geometry, material);
      object.castShadow = true;
      object.receiveShadow = true;
      group.add(object);
      geometries.forEach((part) => part.dispose());
    }
    // The shared unit sphere is released after all assemblies have been built/batched.
    originals.forEach((geometry) => {
      if (geometry !== ball) geometry.dispose();
    });
  }
  ball.dispose();
  return decor;
}
