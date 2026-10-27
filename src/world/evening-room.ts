/**
 * Owned, procedural evening room and desk lamp; the approved model stays untouched.
 * @packageDocumentation
 */
import {
  BackSide,
  CircleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
  Vector3,
} from 'three';
import type { BufferGeometry, Material, Scene } from 'three';
import { createPersonalDecor } from './personal-decor';

/**
 * Add a matte room and one warm lamp beside, not on top of, the existing props.
 * @param scene - Mounted scene whose owner calls the returned cleanup on exit.
 * @returns Cleanup removing only this room and releasing its geometry, materials and shadows.
 */
export function installEveningRoom(scene: Scene): () => void {
  const room = new Group();
  room.name = 'evening-room';
  const metal = new MeshStandardMaterial({
    color: '#252d2a',
    metalness: 0.55,
    roughness: 0.4,
  });

  /**
   * Keep locally created meshes under the room's single ownership boundary.
   * @param geometry - Geometry owned by this installation, possibly shared within it.
   * @param material - Room-owned material.
   * @param position - Model-space location, with Y up.
   * @param parent - Room or lamp assembly owning the new mesh.
   * @returns The attached mesh for its individual pose and shadow settings.
   */
  function addMesh(
    geometry: BufferGeometry,
    material: Material,
    position: readonly [number, number, number],
    parent: Group = room,
  ) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const wall = addMesh(
    new PlaneGeometry(18, 9),
    new MeshStandardMaterial({ color: '#373c3d', roughness: 1 }),
    [0, 3, -0.92],
  );
  wall.name = 'evening-wall';
  wall.castShadow = false;
  const floor = addMesh(
    new PlaneGeometry(18, 18),
    new MeshStandardMaterial({ color: '#262c2e', roughness: 1 }),
    [0, -0.008, 0],
  );
  floor.name = 'evening-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  room.add(createPersonalDecor());

  const lamp = new Group();
  lamp.name = 'desk-lamp';
  room.add(lamp);

  /**
   * Join two physical lamp joints with a fitted metal arm.
   * @param from - Lower joint in model coordinates.
   * @param to - Upper joint in model coordinates.
   */
  function addArm(from: Vector3, to: Vector3) {
    const direction = to.clone().sub(from);
    const arm = addMesh(
      new CylinderGeometry(0.012, 0.012, direction.length(), 20),
      metal,
      from.clone().add(to).multiplyScalar(0.5).toArray(),
      lamp,
    );
    arm.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.normalize(),
    );
  }

  // The measured desktop ends at X=1.1, Z=-0.65 and its top is Y=0.8275.
  const base = addMesh(
    new CylinderGeometry(0.085, 0.095, 0.016, 40),
    metal,
    [0.98, 0.8355, -0.48],
    lamp,
  );
  base.name = 'desk-lamp-base';
  addArm(new Vector3(0.98, 0.8435, -0.48), new Vector3(0.98, 1.17, -0.48));
  addArm(new Vector3(0.98, 1.17, -0.48), new Vector3(0.99, 1.39, -0.38));
  for (const position of [
    [0.98, 1.17, -0.48],
    [0.99, 1.39, -0.38],
  ] as const)
    addMesh(new SphereGeometry(0.022, 20, 16), metal, position, lamp);

  const shade = new Group();
  shade.position.set(0.97, 1.325, -0.36);
  shade.quaternion.setFromUnitVectors(
    new Vector3(0, -1, 0),
    new Vector3(-0.4, -1, 0.3).normalize(),
  );
  lamp.add(shade);
  const shadeGeometry = new CylinderGeometry(0.038, 0.095, 0.12, 40, 1, true);
  addMesh(shadeGeometry, metal, [0, 0, 0], shade);
  const lining = addMesh(
    shadeGeometry,
    new MeshStandardMaterial({
      color: '#e8d8bd',
      side: BackSide,
      roughness: 0.65,
      emissive: '#ffba61',
      emissiveIntensity: 0.15,
    }),
    [0, 0, 0],
    shade,
  );
  lining.castShadow = false;
  const diffuser = addMesh(
    new CircleGeometry(0.078, 40),
    new MeshStandardMaterial({
      color: '#fff1d5',
      emissive: '#ffd09a',
      emissiveIntensity: 2,
    }),
    [0, -0.056, 0],
    shade,
  );
  diffuser.rotation.x = Math.PI / 2;
  diffuser.castShadow = false;

  room.updateMatrixWorld(true);
  const source = shade.localToWorld(new Vector3(0, -0.075, 0));
  const key = new SpotLight('#ffc88b', 3.2, 5, Math.PI / 2.6, 0.85, 2);
  key.name = 'desk-lamp-key';
  key.position.copy(source);
  key.target.position.set(0.45, 0.827, -0.1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.03;
  key.shadow.camera.far = 5;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.008;
  room.add(key, key.target);

  // Small realtime fill approximates diffuse spill, not path-traced light bounce.
  const spill = new PointLight('#ffc488', 0.5, 3, 2);
  spill.position.copy(source);
  const wash = new SpotLight('#ffd2a0', 1.4, 4, 1, 1, 2);
  wash.position.copy(source);
  wash.target.position.set(0.95, 1.25, -0.92);
  room.add(spill, wash, wash.target);
  scene.add(room);

  return () => {
    scene.remove(room);
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    room.traverse((object) => {
      if (object instanceof Mesh) {
        const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
        geometries.add(mesh.geometry);
        for (const material of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material])
          materials.add(material);
      }
      if (object instanceof SpotLight || object instanceof PointLight)
        object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  };
}
