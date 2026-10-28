/**
 * Personal scene changes preserve the cache, animation bindings and owned lifetimes.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';
import {
  Bone,
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PropertyBinding,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  Uint16BufferAttribute,
  Vector3,
  DataTexture,
  NearestFilter,
  SRGBColorSpace,
} from 'three';
import { createPersonalDecor } from '../../src/world/personal-decor';
import {
  installPersonalModel,
  MONITOR_SCREEN,
} from '../../src/world/personal-model';

test('personal decorations retain only the occupied shelf, a bonsai and bounded static batches', () => {
  const decor = createPersonalDecor();
  expect(decor.getObjectByName('upper-wall-shelf')).toBeUndefined();
  expect(decor.getObjectByName('statue-shelf')).toBeDefined();
  expect(
    new Box3().setFromObject(decor.getObjectByName('vertical-wood-slats')!).max
      .x,
  ).toBeLessThan(0);
  const slats = new Box3().setFromObject(
    decor.getObjectByName('vertical-wood-slats')!,
  );
  expect(slats.min.y).toBeCloseTo(0);
  expect(slats.max.y).toBeCloseTo(7.5);
  expect(slats.max.x).toBeCloseTo(-0.88);
  expect(
    new Box3().setFromObject(decor.getObjectByName('bonsai')!).min.y,
  ).toBeGreaterThanOrEqual(0.8275);
  const statue = new Box3().setFromObject(
    decor.getObjectByName('calisthenics-planche-statue')!,
  );
  expect(statue.min.y).toBeCloseTo(1.4975);
  let meshes = 0;
  decor.traverse((object) => {
    if (object instanceof Mesh) meshes++;
  });
  expect(meshes).toBeLessThan(15);
});

test('the approved statue has a slim hollow torso, mirrored rounded shoulders and finite batched geometry', () => {
  const decor = createPersonalDecor();
  const statue = decor.getObjectByName('calisthenics-planche-statue')!;
  expect(statue.position.toArray()).toEqual([0.78, 1.4975, -0.76]);
  expect(statue.scale.toArray()).toEqual([0.75, 0.75, 0.75]);
  expect(statue.children).toHaveLength(2);
  const bronze = (statue.children as Mesh[]).find(
    (mesh) => (mesh.material as MeshStandardMaterial).metalness === 0.55,
  )!;
  const positions = bronze.geometry.getAttribute('position');
  const normals = bronze.geometry.getAttribute('normal');
  const sphere = new SphereGeometry(1, 32, 24);
  const original = sphere.getAttribute('position');
  // The first batch component is the torso; reconstruct the approved numeric contour.
  for (let index = 0; index < original.count; index++) {
    const x = Math.fround(0.064 + original.getX(index) * 0.105);
    const y = Math.fround(0.18 + original.getY(index) * 0.042);
    const z = Math.fround(original.getZ(index) * 0.054);
    const waist = Math.exp(-(((x - 0.012) / 0.028) ** 2));
    const back = Math.exp(-(((x - 0.105) / 0.035) ** 2));
    expect(positions.getX(index)).toBeCloseTo(x, 7);
    expect(positions.getY(index)).toBeCloseTo(
      0.18 +
        0.006 * back -
        0.002 * waist +
        (y - 0.18) * 0.75 * (1 - 0.2 * waist),
      7,
    );
    expect(positions.getZ(index)).toBeCloseTo(z * 0.75 * (1 - 0.2 * waist), 7);
  }
  for (const side of [-1, 1]) {
    let shoulderTop = false;
    for (let index = 0; index < positions.count; index++) {
      if (
        Math.abs(positions.getX(index) - 0.114) < 1e-6 &&
        Math.abs(positions.getY(index) - 0.208) < 1e-6 &&
        Math.abs(positions.getZ(index) - side * 0.033) < 1e-6
      )
        shoulderTop = true;
    }
    expect(shoulderTop).toBe(true);
  }
  for (let index = 0; index < positions.count; index++) {
    expect(Number.isFinite(positions.getX(index))).toBe(true);
    expect(Number.isFinite(positions.getY(index))).toBe(true);
    expect(Number.isFinite(positions.getZ(index))).toBe(true);
    expect(
      Math.hypot(normals.getX(index), normals.getY(index), normals.getZ(index)),
    ).toBeCloseTo(1, 5);
  }
  sphere.dispose();
  const materials = new Set<MeshStandardMaterial>();
  decor.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    (object.geometry as BufferGeometry).dispose();
    materials.add(object.material as MeshStandardMaterial);
  });
  materials.forEach((material) => material.dispose());
});

test('sanitized GLB objects are replaced, shared furniture is isolated and the smaller animated flag stays on the desk', () => {
  const scene = new Group();
  const material = new MeshStandardMaterial();
  /**
   * Match GLTFLoader animation-safe names rather than raw GLB node names.
   * @param name - Raw model node name.
   * @returns Attached synthetic model mesh.
   */
  const fixture = (name: string) => {
    const mesh = new Mesh(new BufferGeometry(), material);
    mesh.name = PropertyBinding.sanitizeNodeName(name);
    scene.add(mesh);
    return mesh;
  };
  const oldMonitor = fixture('Web / monitor');
  const plant = fixture('Web / Plant review / leaf green');
  const pot = fixture('Web / Furniture review / ceramic');
  const flag = fixture('Web / Flag review / dark stand');
  const furniture = fixture('Web / Furniture review / frame');
  furniture.geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        0, 0.9, -0.5, 0.1, 0.9, -0.5, 0, 1, -0.5, 0, 0.5, 0.5, 0.1, 0.5, 0.5, 0,
        1, 0.5,
      ],
      3,
    ),
  );
  furniture.geometry.setAttribute(
    'normal',
    new Float32BufferAttribute(
      [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      3,
    ),
  );
  const original = furniture.geometry;
  const cachedDispose = vi.spyOn(original, 'dispose');
  const bone = new Bone();
  bone.name = 'FlagWave1';
  bone.position.set(-0.5, 1, -0.4);
  scene.add(bone);
  const rest = new Bone();
  scene.add(rest);
  const clothGeometry = new BufferGeometry();
  clothGeometry.setAttribute(
    'position',
    new Float32BufferAttribute([0, 1, 0, 0.1, 1, 0], 3),
  );
  clothGeometry.setAttribute(
    'skinIndex',
    new Uint16BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0], 4),
  );
  clothGeometry.setAttribute(
    'skinWeight',
    new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0], 4),
  );
  const cloth = new SkinnedMesh(clothGeometry, material);
  cloth.name = PropertyBinding.sanitizeNodeName(
    'Web / Flag review / Vietnam red',
  );
  scene.add(cloth);
  scene.updateMatrixWorld(true);
  cloth.bind(new Skeleton([bone, rest]));
  const star = fixture('Web / Flag review / Vietnam yellow');
  star.geometry.setAttribute(
    'position',
    new Float32BufferAttribute([0.04, 1, 0, 0.06, 1, 0, 0.05, 1.02, 0], 3),
  );
  const originalStar = star.geometry;
  const cleanup = installPersonalModel(scene);
  expect(cloth.geometry).not.toBe(clothGeometry);
  expect(clothGeometry.hasAttribute('uv')).toBe(false);
  expect(star.geometry).not.toBe(originalStar);
  expect(star.visible).toBe(true);
  expect(star.material).toBe(cloth.material);
  const frenchMaterial = cloth.material;
  const frenchTexture = frenchMaterial.map as DataTexture;
  expect(frenchMaterial).not.toBe(material);
  expect(frenchTexture).toBeInstanceOf(DataTexture);
  expect(frenchTexture.colorSpace).toBe(SRGBColorSpace);
  expect(frenchTexture.magFilter).toBe(NearestFilter);
  expect(Array.from(frenchTexture.image.data!)).toEqual([
    0, 35, 149, 255, 255, 255, 255, 255, 237, 41, 57, 255,
  ]);
  expect(star.geometry.getAttribute('uv').getX(0)).toBeCloseTo(0.4);
  expect(star.geometry.getAttribute('uv').getX(1)).toBeCloseTo(0.6);
  const releaseFlagTexture = vi.spyOn(frenchTexture, 'dispose');
  const releaseFlagMaterial = vi.spyOn(frenchMaterial, 'dispose');
  expect(oldMonitor.visible).toBe(false);
  expect(plant.visible).toBe(false);
  expect(pot.visible).toBe(false);
  expect(flag.position.x).toBeCloseTo(-0.11);
  expect(flag.position.y).toBeCloseTo(0.1655);
  expect(flag.position.z).toBeCloseTo(-0.08);
  expect(flag.scale.toArray()).toEqual([0.8, 0.8, 0.8]);
  expect(furniture.geometry).not.toBe(original);
  expect(furniture.geometry.index!.count).toBe(12);
  expect(original.index).toBeNull();
  // Wave- and Rest-weighted vertices must both move; otherwise the flag stretches to the desk.
  scene.updateMatrixWorld(true);
  cloth.skeleton.update();
  const foot = new Vector3(-0.55, 0.8275, -0.4).applyMatrix4(flag.matrixWorld);
  expect(foot.x).toBeCloseTo(-0.55);
  expect(foot.y).toBeCloseTo(0.8275);
  expect(foot.z).toBeCloseTo(-0.4);
  for (const index of [0, 1]) {
    const world = cloth
      .getVertexPosition(index, new Vector3())
      .applyMatrix4(cloth.matrixWorld);
    expect(world.y).toBeCloseTo(0.9655);
  }
  bone.position.y += 0.02;
  scene.updateMatrixWorld(true);
  cloth.skeleton.update();
  expect(
    cloth.getVertexPosition(0, new Vector3()).applyMatrix4(cloth.matrixWorld).y,
  ).toBeCloseTo(0.9815);
  expect(MONITOR_SCREEN.x).toBe(0);
  const bezel = scene.getObjectByName('monitor-recessed-bezel')!;
  expect(new Box3().setFromObject(bezel).max.z).toBeGreaterThan(
    MONITOR_SCREEN.z,
  );
  expect(MONITOR_SCREEN.width / MONITOR_SCREEN.height).toBeCloseTo(16 / 9, 2);
  expect(
    Math.hypot(MONITOR_SCREEN.width, MONITOR_SCREEN.height) / 0.0254,
  ).toBeCloseTo(27, 1);
  const replacement = furniture.geometry;
  const release = vi.spyOn(replacement, 'dispose');
  cleanup();
  expect(cloth.geometry).toBe(clothGeometry);
  expect(star.geometry).toBe(originalStar);
  expect(cloth.material).toBe(material);
  expect(star.material).toBe(material);
  expect(releaseFlagTexture).toHaveBeenCalledOnce();
  expect(releaseFlagMaterial).toHaveBeenCalledOnce();
  expect(release).toHaveBeenCalledOnce();
  expect(cachedDispose).not.toHaveBeenCalled();
  expect(furniture.geometry).toBe(original);
  expect(oldMonitor.visible).toBe(true);
  expect(flag.position.toArray()).toEqual([0, 0, 0]);
  expect(flag.scale.toArray()).toEqual([1, 1, 1]);
  expect(cloth.scale.toArray()).toEqual([1, 1, 1]);
  expect(bone.parent).toBe(scene);
  expect(scene.getObjectByName('centered-27-inch-monitor')).toBeUndefined();
  const secondCleanup = installPersonalModel(scene);
  secondCleanup();
  expect(flag.position.toArray()).toEqual([0, 0, 0]);
});
