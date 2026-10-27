/**
 * Non-destructive customization of the per-mount model clone.
 * @packageDocumentation
 */
import {
  DetachedBindMode,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
  SkinnedMesh,
} from 'three';
import type { BufferGeometry, Material, Object3D } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { refineCurvedGeometry } from './curved-geometry';
import { repairCharacterNeck } from './character-neck';

/** A 27-inch 16:9 active display in metre-scaled model coordinates. */
export const MONITOR_SCREEN = {
  width: 0.598,
  height: 0.336,
  x: 0,
  y: 1.18,
  z: -0.458,
};

/** Keep the smaller flag grounded at its original desktop foot. */
const FLAG_SCALE = 0.8;

/**
 * Trace a centered rounded aperture or outer bezel, in real model dimensions.
 * @param path - Owned outline to populate.
 * @param width - Full horizontal dimension.
 * @param height - Full vertical dimension.
 * @param radius - Small corner radius.
 */
function roundedRectangle(
  path: Path,
  width: number,
  height: number,
  radius: number,
): void {
  const x = width / 2,
    y = height / 2;
  path.moveTo(-x + radius, -y);
  path.lineTo(x - radius, -y);
  path.quadraticCurveTo(x, -y, x, -y + radius);
  path.lineTo(x, y - radius);
  path.quadraticCurveTo(x, y, x - radius, y);
  path.lineTo(-x + radius, y);
  path.quadraticCurveTo(-x, y, -x, y - radius);
  path.lineTo(-x, -y + radius);
  path.quadraticCurveTo(-x, -y, -x + radius, -y);
  path.closePath();
}

/**
 * Customize only this mount, retaining loader-cache resources and the animated flag.
 * @param scene - Per-mount cloned model, never the loader cache.
 * @returns Restoration and cleanup of locally owned resources.
 */
export function installPersonalModel(scene: Object3D): () => void {
  const restore: (() => void)[] = [];
  const ownedGeometry: BufferGeometry[] = [];
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    // GLTFLoader sanitizes spaces/slashes for animation binding names.
    const name = mesh.name.replace(/[ _/]+/g, ' ').trim();
    if (name.startsWith('Web Character review ')) {
      const original = mesh.geometry;
      let prepared: BufferGeometry | undefined;
      if (/^Web Character review skin\d*$/.test(name))
        prepared = repairCharacterNeck(original);
      if (/^Web Character review rib\d*$/.test(name)) {
        // The former hood-opening ring is above 1.05; wrist/ankle cuffs stay below it.
        prepared = original.clone();
        const positions = original.getAttribute('position');
        const kept: number[] = [];
        for (
          let offset = 0;
          offset < (original.index?.count ?? positions.count);
          offset += 3
        ) {
          const triangle = [0, 1, 2].map(
            (slot) => original.index?.getX(offset + slot) ?? offset + slot,
          );
          if (!triangle.every((index) => positions.getY(index) > 1.05))
            kept.push(...triangle);
        }
        prepared.setIndex(kept);
      }
      const geometry = refineCurvedGeometry(prepared ?? original);
      prepared?.dispose();
      mesh.geometry = geometry;
      ownedGeometry.push(geometry);
      restore.push(() => {
        mesh.geometry = original;
      });
    }
    if (
      /^Web (monitor|screen(?: panel| sage| blue| amber)?)$/.test(name) ||
      name.startsWith('Web Plant review ') ||
      /^Web Furniture review (ceramic|soil)$/.test(name)
    ) {
      const visible = mesh.visible;
      mesh.visible = false;
      restore.push(() => {
        mesh.visible = visible;
      });
    }
    if (name.startsWith('Web Flag review ')) {
      const position = mesh.position.clone();
      const scale = mesh.scale.clone();
      // Detached skinning translates the entire cloth, including its Rest-weighted edge.
      // Keep the character's shared skeleton and original wave animation untouched.
      if (mesh instanceof SkinnedMesh) {
        const mode = mesh.bindMode;
        mesh.bindMode = DetachedBindMode;
        restore.push(() => {
          mesh.bindMode = mode;
        });
      }
      // Scale around the original stand's foot, not the scene origin.
      mesh.scale.multiplyScalar(FLAG_SCALE);
      mesh.position.multiplyScalar(FLAG_SCALE).add({
        x: -0.55 * (1 - FLAG_SCALE),
        y: 0.8275 * (1 - FLAG_SCALE),
        z: -0.4 * (1 - FLAG_SCALE),
      });
      restore.push(() => {
        mesh.position.copy(position);
        mesh.scale.copy(scale);
      });
    }
    if (
      /^Web (rubber|Furniture review (fabric|shell|frame|rubber))$/.test(name)
    ) {
      // Stand parts share furniture batches; remove only triangles above the rear desktop.
      const original = (object as Mesh<BufferGeometry, Material | Material[]>)
        .geometry;
      const position = original.getAttribute('position');
      const indices = original.index;
      const kept: number[] = [];
      const count = indices?.count ?? position.count;
      for (let i = 0; i < count; i += 3) {
        const triangle = [0, 1, 2].map((j) =>
          indices ? indices.getX(i + j) : i + j,
        );
        const stand = triangle.every(
          (index) =>
            position.getY(index) > 0.827 && position.getZ(index) < -0.35,
        );
        if (!stand) kept.push(...triangle);
      }
      let geometry = original.clone();
      geometry.setIndex(kept);
      if (
        name.startsWith('Web Furniture review ') &&
        geometry.hasAttribute('normal')
      ) {
        const filtered = geometry;
        geometry = refineCurvedGeometry(filtered, (a, b, c) =>
          [a, b, c].every((index) => position.getZ(index) > 0.3),
        );
        filtered.dispose();
      }
      mesh.geometry = geometry;
      ownedGeometry.push(geometry);
      restore.push(() => {
        mesh.geometry = original;
      });
    }
  });
  const monitor = new Group();
  monitor.name = 'centered-27-inch-monitor';
  const material = new MeshStandardMaterial({
    color: '#25292c',
    roughness: 0.5,
    metalness: 0.25,
  });
  const bezel = new Shape();
  roundedRectangle(bezel, 0.628, 0.366, 0.008);
  const aperture = new Path();
  roundedRectangle(
    aperture,
    MONITOR_SCREEN.width,
    MONITOR_SCREEN.height,
    0.002,
  );
  bezel.holes.push(aperture);
  const bezelGeometry = new ExtrudeGeometry(bezel, {
    depth: 0.026,
    steps: 1,
    curveSegments: 8,
    bevelEnabled: true,
    bevelSize: 0.001,
    bevelThickness: 0.001,
    bevelSegments: 3,
  });
  ownedGeometry.push(bezelGeometry);
  const front = new Mesh(bezelGeometry, material);
  front.name = 'monitor-recessed-bezel';
  front.position.set(0, MONITOR_SCREEN.y, -0.483);
  front.castShadow = true;
  front.receiveShadow = true;
  monitor.add(front);
  for (const [width, height, depth, x, y, z] of [
    [0.628, 0.366, 0.018, 0, 1.18, -0.486],
    [0.04, 0.18, 0.035, 0, 0.92, -0.49],
    [0.24, 0.012, 0.17, 0, 0.8335, -0.46],
  ]) {
    const geometry = new RoundedBoxGeometry(
      width,
      height,
      depth,
      4,
      Math.min(depth * 0.3, 0.007),
    );
    ownedGeometry.push(geometry);
    const part = new Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    monitor.add(part);
  }
  scene.add(monitor);
  return () => {
    scene.remove(monitor);
    restore.forEach((reset) => reset());
    ownedGeometry.forEach((geometry) => geometry.dispose());
    material.dispose();
  };
}
