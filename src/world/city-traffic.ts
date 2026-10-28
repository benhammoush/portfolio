/**
 * Bounded riverfront traffic and wind-rippled flags, driven by the shared scene clock.
 * @packageDocumentation
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  CatmullRomCurve3,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BufferAttribute } from 'three';

/** Stable traffic positions are sampled from active time; hidden/paused time never advances it. */
export interface CityTraffic {
  /** Meshes share prototype resources; the preview owner deduplicates their disposal. */
  group: Group;
  /**
   * Place all vehicles and flag cloth at the supplied active time.
   * @param seconds - Active elapsed seconds, excluding paused or hidden time.
   */
  update: (seconds: number) => void;
}

/**
 * Build road traffic, one occasional neon passenger boat and two parked fishing boats.
 * @returns Independently mounted traffic and its deterministic animation sampler.
 */
export function createCityTraffic(): CityTraffic {
  const group = new Group();
  group.name = 'city-traffic';
  const material = new MeshBasicMaterial({
    vertexColors: true,
    toneMapped: false,
  });
  let seed = 1287;

  /**
   * Keep spacing and model selection stable across remounts.
   * @returns A repeatable random fraction for vehicle placement.
   */
  function random(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  /**
   * Batch one vehicle, including its tiny lamps, into a single draw call.
   * @param kind - Cartoon vehicle silhouette.
   * @param paint - Baked night body color.
   * @returns A reusable prototype mesh; clones share its geometry/material.
   */
  function model(
    kind: 'car' | 'motorbike' | 'cruise-boat' | 'fishing-boat',
    paint: string,
  ): Mesh {
    const parts: BufferGeometry[] = [];

    /**
     * Color a vehicle primitive before merging it into the prototype.
     * @param geometry - Owned primitive, consumed during assembly.
     * @param color - Surface or lamp color.
     * @param x - Model-local horizontal position.
     * @param y - Height above road/water.
     * @param z - Model-local lateral position.
     */
    function part(
      geometry: BufferGeometry,
      color: string,
      x: number,
      y: number,
      z = 0,
    ): void {
      const flat = geometry.index ? geometry.toNonIndexed() : geometry;
      if (geometry !== flat) geometry.dispose();
      flat.translate(x, y, z);
      flat.deleteAttribute('uv');
      const base = new Color(color);
      const normals = flat.getAttribute('normal');
      const colors = new Float32Array(flat.getAttribute('position').count * 3);
      for (let index = 0; index < normals.count; index++) {
        const light = 0.75 + Math.max(0, normals.getY(index)) * 0.25;
        colors[index * 3] = base.r * light;
        colors[index * 3 + 1] = base.g * light;
        colors[index * 3 + 2] = base.b * light;
      }
      flat.setAttribute('color', new Float32BufferAttribute(colors, 3));
      parts.push(flat);
    }

    if (kind === 'car') {
      part(new BoxGeometry(0.75, 0.16, 0.31), paint, 0, 0.18);
      part(new BoxGeometry(0.36, 0.15, 0.27), '#35526a', -0.03, 0.32);
      part(new BoxGeometry(0.29, 0.035, 0.28), paint, -0.03, 0.41);
      for (const x of [-0.23, 0.23]) {
        for (const z of [-0.17, 0.17])
          part(
            new CylinderGeometry(0.08, 0.08, 0.05, 8).rotateX(Math.PI / 2),
            '#111926',
            x,
            0.09,
            z,
          );
      }
      for (const z of [-0.1, 0.1]) {
        part(new BoxGeometry(0.025, 0.055, 0.065), '#ffe1a0', 0.39, 0.2, z);
        part(new BoxGeometry(0.025, 0.05, 0.065), '#e85049', -0.39, 0.2, z);
      }
    } else if (kind === 'motorbike') {
      for (const x of [-0.17, 0.17])
        part(
          new CylinderGeometry(0.09, 0.09, 0.055, 8).rotateX(Math.PI / 2),
          '#101725',
          x,
          0.09,
        );
      part(new BoxGeometry(0.27, 0.1, 0.12), paint, 0, 0.2);
      part(
        new SphereGeometry(1, 8, 6).scale(0.075, 0.13, 0.06),
        '#455a71',
        -0.015,
        0.36,
      );
      part(new SphereGeometry(0.075, 8, 6), '#b6bac9', 0.01, 0.53);
      part(new BoxGeometry(0.03, 0.025, 0.18), '#667c8d', 0.15, 0.3);
      part(new BoxGeometry(0.035, 0.055, 0.06), '#ffe5a7', 0.23, 0.25);
      part(new BoxGeometry(0.025, 0.045, 0.06), '#d6494e', -0.21, 0.22);
    } else {
      const hull = new Shape();
      hull.moveTo(-1.55, -0.44);
      hull.quadraticCurveTo(-1.8, 0, -1.55, 0.44);
      hull.lineTo(0.8, 0.6);
      hull.quadraticCurveTo(1.7, 0.55, 2, 0);
      hull.quadraticCurveTo(1.7, -0.55, 0.8, -0.6);
      hull.closePath();
      const hullGeometry = new ExtrudeGeometry(hull, {
        depth: 0.35,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.035,
        bevelSegments: 1,
        curveSegments: 5,
      });
      hullGeometry.rotateX(-Math.PI / 2);
      part(hullGeometry, kind === 'fishing-boat' ? '#1479b4' : '#297f9d', 0, 0);
      part(new BoxGeometry(2.95, 0.05, 0.99), '#355e74', -0.05, 0.37);

      if (kind === 'cruise-boat') {
        // Two distinct decks and steady colored outline lighting, not blinking party lights.
        part(new BoxGeometry(2.45, 0.52, 0.91), '#405c77', -0.12, 0.65);
        part(new BoxGeometry(2.85, 0.08, 1.15), '#6a78a0', -0.05, 0.96);
        part(new BoxGeometry(2.8, 0.06, 1.13), '#495972', -0.05, 1.65);
        for (const x of [-1.45, 1.35])
          part(new BoxGeometry(0.035, 0.035, 1.15), '#d4f3ed', x, 1.7);
        for (const side of [-1, 1]) {
          for (const x of [-1.15, -0.5, 0.15, 0.8, 1.25]) {
            part(
              new BoxGeometry(0.035, 0.64, 0.035),
              '#66eab0',
              x,
              1.3,
              side * 0.52,
            );
            part(
              new BoxGeometry(0.4, 0.31, 0.025),
              '#c6e6cd',
              x - 0.08,
              0.67,
              side * 0.47,
            );
          }
          for (const [height, color] of [
            [0.4, '#42e2b3'],
            [0.98, '#bd83ff'],
            [1.28, '#66ee9a'],
            [1.58, '#ff9adf'],
            [1.7, '#67e7f0'],
          ] as const)
            part(
              new BoxGeometry(2.9, 0.035, 0.03),
              color,
              -0.05,
              height,
              side * 0.55,
            );
          for (let step = 0; step < 5; step++)
            part(
              new BoxGeometry(0.18, 0.07, 0.24),
              '#89d8c0',
              -1.3 + step * 0.16,
              0.47 + step * 0.12,
              side * 0.52,
            );
          const wake = new PlaneGeometry(2.5, 0.035);
          wake.rotateX(-Math.PI / 2);
          wake.rotateY(side * 0.12);
          part(wake, '#24425a', -2.5, -0.025, side * 0.4);
        }
      } else {
        // Blue Vietnamese fishing launch: aft cabin, open working deck, rigging and flag.
        part(new BoxGeometry(3.1, 0.075, 1.05), '#112d43', -0.1, 0.3);
        part(new BoxGeometry(1.35, 0.66, 0.86), '#207db5', -0.62, 0.73);
        part(new BoxGeometry(1.62, 0.075, 1.03), '#c9a95a', -0.62, 1.09);
        part(new BoxGeometry(1.0, 0.3, 0.7), '#2476a4', -0.65, 1.28);
        part(new BoxGeometry(1.3, 0.065, 0.9), '#2c8cba', -0.65, 1.47);
        for (const side of [-1, 1]) {
          for (const x of [-1.03, -0.61, -0.19]) {
            part(
              new BoxGeometry(0.29, 0.29, 0.025),
              '#cfa85e',
              x,
              0.8,
              side * 0.44,
            );
            part(
              new BoxGeometry(0.23, 0.23, 0.03),
              '#274557',
              x,
              0.8,
              side * 0.46,
            );
          }
          part(
            new BoxGeometry(1.7, 0.04, 0.045),
            '#83b2b8',
            0.8,
            0.54,
            side * 0.52,
          );
          for (const x of [0.12, 0.8, 1.4])
            part(
              new BoxGeometry(0.035, 0.23, 0.035),
              '#7197a9',
              x,
              0.43,
              side * 0.52,
            );
        }
        for (let plank = 0; plank < 5; plank++)
          part(
            new BoxGeometry(0.075, 0.025, 0.78),
            '#4185a4',
            0.2 + plank * 0.25,
            0.415,
          );
        part(new CylinderGeometry(0.025, 0.035, 2.1, 7), '#3a85b3', 0.88, 1.45);
        part(new BoxGeometry(0.52, 0.035, 0.035), '#5887a3', 0.88, 1.88);
        part(
          new CylinderGeometry(0.018, 0.025, 1.25, 6),
          '#7e98a9',
          -0.95,
          1.9,
        );
        part(new BoxGeometry(2.0, 0.035, 0.035), '#798e99', -0.2, 1.72);
        const anchor = new CatmullRomCurve3([
          new Vector3(1.8, 0.45, 0),
          new Vector3(2.05, 0.1, 0.15),
          new Vector3(2.2, -0.04, 0.2),
        ]);
        part(new TubeGeometry(anchor, 8, 0.014, 4, false), '#7c826f', 0, 0);
      }
    }
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry)
      throw new Error(`Vehicle geometry could not be batched: ${kind}`);
    const mesh = new Mesh(geometry, material);
    mesh.name = kind;
    return mesh;
  }

  /**
   * Tessellate both flag faces and emblems so they follow the same smooth wind surface.
   * @returns An independently owned, two-sided red flag with upright yellow stars.
   */
  function createFlag(): Mesh {
    const star = new Shape();
    for (let point = 0; point < 10; point++) {
      const angle = Math.PI / 2 + (point * Math.PI) / 5;
      const radius = point % 2 === 0 ? 0.2 : 0.08;
      if (point === 0)
        star.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else star.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    star.closePath();
    const original = new ShapeGeometry(star);
    const flat = original.toNonIndexed();
    original.dispose();
    let triangles = new Float32Array(flat.getAttribute('position').array);
    flat.dispose();
    // Two midpoint subdivisions keep the star attached to the rippling cloth, not a rigid badge.
    for (let pass = 0; pass < 2; pass++) {
      const split = new Float32Array(triangles.length * 4);
      for (let index = 0; index < triangles.length; index += 9) {
        const a = Array.from(triangles.subarray(index, index + 3));
        const b = Array.from(triangles.subarray(index + 3, index + 6));
        const c = Array.from(triangles.subarray(index + 6, index + 9));
        const ab = a.map((value, axis) => (value + b[axis]) / 2);
        const bc = b.map((value, axis) => (value + c[axis]) / 2);
        const ca = c.map((value, axis) => (value + a[axis]) / 2);
        split.set(
          [
            ...a,
            ...ab,
            ...ca,
            ...ab,
            ...b,
            ...bc,
            ...ca,
            ...bc,
            ...c,
            ...ab,
            ...bc,
            ...ca,
          ],
          index * 4,
        );
      }
      triangles = split;
    }
    const parts: BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      const fieldSource = new PlaneGeometry(0.96, 0.64, 20, 8);
      const field = fieldSource.toNonIndexed();
      fieldSource.dispose();
      const emblem = new BufferGeometry();
      emblem.setAttribute(
        'position',
        new Float32BufferAttribute(triangles.slice(), 3),
      );
      emblem.computeVertexNormals();
      for (const [geometry, tint, offset] of [
        [field, '#e9363e', 0.006],
        [emblem, '#ffe45d', 0.02],
      ] as const) {
        if (side < 0) geometry.rotateY(Math.PI);
        geometry.translate(1.36, 2.16, side * offset);
        geometry.deleteAttribute('uv');
        const colors = new Float32Array(
          geometry.getAttribute('position').count * 3,
        );
        const color = new Color(tint).multiplyScalar(0.75);
        for (let index = 0; index < colors.length; index += 3)
          color.toArray(colors, index);
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        parts.push(geometry);
      }
    }
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error('Flag geometry could not be batched');
    (geometry.getAttribute('position') as BufferAttribute).setUsage(
      DynamicDrawUsage,
    );
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) geometry.boundingSphere.radius += 0.2;
    const flag = new Mesh(geometry, material);
    flag.name = 'vietnam-flag';
    return flag;
  }

  const prototypes = [
    model('car', '#647f9c'),
    model('car', '#ad704f'),
    model('motorbike', '#bb8c55'),
  ];
  const road = new Group();
  road.name = 'bridge-traffic';
  road.applyMatrix4(
    new Matrix4()
      .makeTranslation(0, 0, -12)
      .multiply(new Matrix4().makeRotationY(0.5))
      .multiply(new Matrix4().makeTranslation(0, 0, 5)),
  );
  group.add(road);
  const vehicles: {
    mesh: Mesh;
    phase: number;
    direction: number;
    speed: number;
  }[] = [];
  for (const direction of [-1, 1]) {
    const speed = 1.65 + random() * 0.5;
    for (let index = 0; index < 4; index++) {
      const mesh = prototypes[[0, 2, 1, 2][index]].clone();
      mesh.scale.setScalar(0.7);
      mesh.position.set(0, 1.065, -5 + direction * 0.42);
      mesh.rotation.y = direction > 0 ? 0 : Math.PI;
      road.add(mesh);
      vehicles.push({
        mesh,
        phase: index * 16 + random() * 4,
        direction,
        speed,
      });
    }
  }
  const passenger = new Group();
  passenger.name = 'passing-cruise-boat';
  passenger.position.set(0, -0.04, -14.4);
  passenger.scale.setScalar(0.32);
  passenger.add(model('cruise-boat', '#297f9d'));
  const neonWater = new PlaneGeometry(3.5, 3.3, 12, 16);
  neonWater.rotateX(-Math.PI / 2);
  const points = neonWater.getAttribute('position');
  const glow = new Float32Array(points.count * 3);
  for (let index = 0; index < points.count; index++) {
    const u = points.getX(index) / 1.75;
    const v = points.getZ(index) / 1.65;
    const fade =
      Math.max(0, (1 - u * u) * (1 - v * v)) *
      0.35 *
      (0.55 + Math.sin(v * 18) ** 2 * 0.45);
    new Color(u < 0 ? '#c276ff' : '#4ae7ba')
      .multiplyScalar(fade)
      .toArray(glow, index * 3);
  }
  neonWater.setAttribute('color', new Float32BufferAttribute(glow, 3));
  neonWater.translate(0, -0.04, 1.35);
  passenger.add(
    new Mesh(
      neonWater,
      new MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  group.add(passenger);

  const fishingPrototype = model('fishing-boat', '#1479b4');
  const flags: { mesh: Mesh; rest: Float32Array; phase: number }[] = [];
  const mooringAngle = -0.65;
  for (const [index, offset] of [-0.25, 0.25].entries()) {
    const fishing = fishingPrototype.clone();
    fishing.name = `parked-fishing-boat-${index + 1}`;
    fishing.position.set(
      5.5 + Math.sin(mooringAngle) * offset,
      -0.05,
      -0.6 + Math.cos(mooringAngle) * offset,
    );
    fishing.scale.setScalar(index === 0 ? 0.3 : 0.2625);
    fishing.rotation.y = mooringAngle;
    const flag = createFlag();
    fishing.add(flag);
    flags.push({
      mesh: flag,
      rest: new Float32Array(flag.geometry.getAttribute('position').array),
      phase: index * 1.9,
    });
    group.add(fishing);
  }

  /**
   * Move traffic without allocations, new resources, or jumps through paused time.
   * @param seconds - Finite active elapsed time, in seconds.
   */
  function update(seconds: number): void {
    for (const vehicle of vehicles) {
      const x = ((vehicle.phase + seconds * vehicle.speed) % 64) - 32;
      vehicle.mesh.position.x = x * vehicle.direction;
      vehicle.mesh.visible = Math.abs(x) < 24.1;
    }
    // One slow passenger boat, followed by a long quiet interval; parked boats never move.
    const passage = (seconds + 30) % 140;
    passenger.visible = passage < 66;
    // This deeper water lane crosses the diagonal bridge midway between two piers.
    passenger.position.x = -18 + passage * 0.65;
    for (const flag of flags) {
      const position = flag.mesh.geometry.getAttribute('position');
      for (let index = 0; index < position.count; index++) {
        const x = flag.rest[index * 3];
        const y = flag.rest[index * 3 + 1];
        const z = flag.rest[index * 3 + 2];
        // The pole edge is pinned; only the free cloth and its emblem ripple in the breeze.
        const u = Math.min(1, Math.max(0, (x - 0.88) / 0.96));
        const wave =
          u *
          (Math.sin(u * 7 - seconds * 2.6 + flag.phase) * 0.085 +
            Math.sin(u * 13 + seconds * 1.7 + flag.phase) * 0.025);
        position.setY(
          index,
          y + Math.sin(u * 8 - seconds * 2.1 + flag.phase) * 0.025 * u,
        );
        position.setZ(index, z + wave);
      }
      position.needsUpdate = true;
    }
  }
  update(0);
  return { group, update };
}
