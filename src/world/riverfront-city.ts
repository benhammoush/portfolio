/**
 * Original cartoon riverfront architecture and baked-style midnight illumination.
 * @packageDocumentation
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Coordinates in the independently viewable miniature, with Y up. */
type Point = readonly [number, number, number];

/**
 * Build rounded, baked-shaded geometry without textures, actual city lights or animation.
 * @returns An independent asset; its caller owns all final materials and geometry.
 */
export function createRiverfrontCity(): Group {
  const city = new Group();
  city.name = 'cartoon-riverfront';
  const batches = new Map<string, BufferGeometry[]>();
  const nightLights = ['#ffc175', '#66dcec', '#bc87f2', '#f48cab', '#7edfc4'];
  const pierLights = ['#478dff', '#ae75f0', '#40c9e4', '#e56ab9', '#54d8c4'];
  let seed = 736;

  /**
   * Keep city and water details stable across remounts.
   * @returns A deterministic fraction for repeatable geometry and illumination.
   */
  function random(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  /**
   * Consume one primitive, bake gentle cartoon face shading and queue a shared draw batch.
   * @param geometry - Independently owned primitive, disposed when consumed.
   * @param color - Surface color or an already generated linear color.
   * @param batch - Semantic exported mesh family.
   * @param at - Model-space translation.
   * @param shade - Whether rounded faces receive baked directional shading.
   */
  function add(
    geometry: BufferGeometry,
    color: string | Color,
    batch: string,
    at: Point = [0, 0, 0],
    shade = true,
  ): void {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    flat.translate(...at);
    flat.deleteAttribute('uv');
    const normals = flat.getAttribute('normal');
    const base = new Color(color);
    // Midnight ambient affects surfaces, not decorative lamps or baked water reflections.
    const ambient = ['buildings', 'waterfront', 'bridges'].includes(batch)
      ? 0.055
      : batch === 'water-glints'
        ? 0.08
        : batch.startsWith('dragon-')
          ? 0.65
          : 1;
    base.multiplyScalar(ambient);
    const colors = new Float32Array(flat.getAttribute('position').count * 3);
    for (let index = 0; index < normals.count; index++) {
      const light = shade
        ? 0.64 +
          Math.max(0, normals.getY(index)) * 0.36 +
          Math.max(0, normals.getZ(index)) * 0.18 -
          Math.max(0, normals.getX(index)) * 0.08
        : 1;
      colors[index * 3] = base.r * light;
      colors[index * 3 + 1] = base.g * light;
      colors[index * 3 + 2] = base.b * light;
    }
    flat.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const parts = batches.get(batch) ?? [];
    parts.push(flat);
    batches.set(batch, parts);
  }

  /**
   * Add a box with optional softly beveled edges.
   * @param at - Center in model coordinates.
   * @param size - Width, height and depth.
   * @param color - Cartoon surface color.
   * @param batch - Semantic family.
   * @param round - Bevel radius; zero uses a plain box.
   */
  function box(
    at: Point,
    size: Point,
    color: string,
    batch: string,
    round = 0,
  ): void {
    const geometry = round
      ? new RoundedBoxGeometry(...size, 1, round)
      : new BoxGeometry(...size);
    add(
      geometry,
      color,
      batch,
      at,
      batch !== 'city-lights' && batch !== 'bridge-lights',
    );
  }

  /**
   * Add a softly sculpted ellipsoid for the dragon or tree canopy.
   * @param at - Ellipsoid center.
   * @param size - Radii along X, Y and Z.
   * @param color - Surface color.
   * @param batch - Semantic mesh family.
   */
  function ball(at: Point, size: Point, color: string, batch: string): void {
    add(new SphereGeometry(1, 12, 8).scale(...size), color, batch, at);
  }

  /**
   * Join rounded bridge and dragon details along a smooth path.
   * @param points - Ordered model-space joints.
   * @param radius - Tube radius.
   * @param color - Surface color.
   * @param batch - Semantic family.
   * @param segments - Bounded tessellation along the path.
   */
  function tube(
    points: readonly Point[],
    radius: number,
    color: string,
    batch: string,
    segments = 12,
  ): void {
    const curve = new CatmullRomCurve3(
      points.map((point) => new Vector3(...point)),
    );
    add(new TubeGeometry(curve, segments, radius, 8, false), color, batch);
  }

  // Midnight navy gradient: vertex colors, not a reference-photo backdrop.
  const sky = new PlaneGeometry(600, 200, 1, 40);
  const skyPositions = sky.getAttribute('position');
  const skyColors = new Float32Array(skyPositions.count * 3);
  for (let index = 0; index < skyPositions.count; index++) {
    const height = skyPositions.getY(index) + 14;
    const fraction = Math.min(1, Math.max(0, (height + 10) / 25));
    new Color('#151b3d')
      .lerp(new Color('#030617'), fraction)
      .toArray(skyColors, index * 3);
  }
  sky.setAttribute('color', new Float32BufferAttribute(skyColors, 3));
  sky.translate(0, 14, -85);
  const skyMesh = new Mesh(
    sky,
    new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  );
  skyMesh.name = 'riverfront-sky';
  city.add(skyMesh);

  for (const [z, color, lift] of [
    [-43, '#20284b', 1.5],
    [-37, '#151f3c', 0],
  ] as const) {
    const ridge = new Shape();
    ridge.moveTo(-200, -1);
    for (let x = -200; x <= 200; x += 2) {
      const height =
        1 +
        3 * Math.exp(-(((x + 8) / 11) ** 2)) +
        4.6 * Math.exp(-(((x - 17) / 15) ** 2)) +
        1.2 * Math.exp(-(((x - 37) / 10) ** 2));
      ridge.lineTo(x, height + lift);
    }
    ridge.lineTo(200, -1);
    ridge.closePath();
    add(
      new ExtrudeGeometry(ridge, {
        depth: 1.5,
        bevelEnabled: false,
        curveSegments: 4,
      }),
      color,
      'mountains',
      [0, 0, z],
      false,
    );
  }

  const river = new PlaneGeometry(140, 70, 1, 20);
  river.rotateX(-Math.PI / 2);
  const waterPositions = river.getAttribute('position');
  const waterColors = new Float32Array(waterPositions.count * 3);
  for (let index = 0; index < waterPositions.count; index++) {
    const fraction = Math.min(
      1,
      Math.max(0, (waterPositions.getZ(index) + 24) / 45),
    );
    new Color('#132943')
      .lerp(new Color('#071429'), fraction)
      .toArray(waterColors, index * 3);
  }
  river.setAttribute('color', new Float32BufferAttribute(waterColors, 3));
  river.translate(0, -0.06, -7);
  const riverMesh = new Mesh(
    river,
    new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  );
  riverMesh.name = 'riverfront-river';
  city.add(riverMesh);

  box([0, 0.03, -37], [400, 0.3, 26], '#607d8c', 'waterfront');
  box([0, 0.24, -24], [400, 0.18, 0.6], '#a6a8ac', 'waterfront');
  box([0, 0.36, -23.7], [400, 0.045, 0.035], '#ffe0a1', 'city-lights');
  box([-63, 0.03, 10], [83, 0.3, 30], '#5a8e86', 'waterfront');
  const palette = [
    '#8e9caf',
    '#7a9ca9',
    '#8b91b0',
    '#b5a1a0',
    '#6692a0',
    '#a4a5b2',
  ];
  for (let row = 0; row < 2; row++) {
    for (let index = 0; index < 38; index++) {
      const x = -37 + index * 2.1 + random() * 0.45;
      const z = -25.6 - row * 2.6;
      const height = 0.65 + random() * (row ? 2.1 : 1.35);
      const width = 1.1 + random() * 0.65;
      const depth = 1.25;
      box(
        [x, height / 2, z],
        [width, height, depth],
        palette[index % palette.length],
        'buildings',
        0.07,
      );
      box(
        [x, height + 0.04, z],
        [width + 0.08, 0.12, depth + 0.08],
        '#647d92',
        'buildings',
        0.035,
      );
      if (index % 3 === 0)
        box(
          [x, height * 0.8, z + depth / 2 + 0.025],
          [width * 0.86, 0.07, 0.025],
          nightLights[index % nightLights.length],
          'city-lights',
        );
      for (let floor = 0.32; floor < height - 0.1; floor += 0.42) {
        for (let column = -width * 0.32; column < width * 0.4; column += 0.36) {
          if (random() < 0.28) continue;
          box(
            [x + column, floor, z + depth / 2 + 0.01],
            [0.14, 0.18, 0.018],
            nightLights[Math.floor(random() * nightLights.length)],
            'city-lights',
          );
        }
      }
    }
  }
  // Keep the skyline low; a small cluster of towers marks the bridge's far landing.
  for (const [x, height, width, accent] of [
    [17.8, 4.9, 1.65, '#6bd9e8'],
    [22, 6.1, 1.9, '#db87d4'],
    [27, 4.2, 1.5, '#a290ec'],
  ] as const) {
    const z = -26.6;
    box([x, height / 2, z], [width, height, 1.7], '#708caa', 'buildings', 0.12);
    box(
      [x, height + 0.06, z],
      [width * 0.85, 0.14, 1.5],
      accent,
      'city-lights',
    );
    for (let floor = 0.4; floor < height; floor += 0.4) {
      for (let column = -width * 0.35; column < width * 0.4; column += 0.34)
        box(
          [x + column, floor, z + 0.86],
          [0.15, 0.16, 0.018],
          floor % 0.8 < 0.4 ? '#ffdba7' : accent,
          'city-lights',
        );
    }
  }

  const bridgeZ = -5;
  box([0, 0.83, bridgeZ], [50, 0.32, 2.15], '#bd9c76', 'bridges', 0.1);
  box([0, 1.015, bridgeZ], [50, 0.07, 1.75], '#78818b', 'bridges', 0.025);
  for (const side of [-1, 1]) {
    box(
      [0, 1.12, bridgeZ + side * 1.02],
      [50, 0.15, 0.12],
      '#ffe0a1',
      'bridge-lights',
      0.035,
    );
    for (let x = -24; x < 25; x += 1.1)
      box(
        [x, 1.3, bridgeZ + side * 1.02],
        [0.045, 0.36, 0.045],
        '#d6bb8d',
        'bridges',
      );
  }
  for (let x = -24; x < 25; x += 1.8)
    box([x, 1.058, bridgeZ], [0.65, 0.012, 0.035], '#fff0b4', 'bridge-lights');
  for (const [index, x] of [-19, -10, 0, 10, 20].entries()) {
    add(new CylinderGeometry(0.48, 0.62, 1.05, 12), '#b1bbca', 'bridges', [
      x,
      0.25,
      bridgeZ,
    ]);
    box([x, 0.6, bridgeZ], [1.5, 0.22, 1.6], '#8c9aad', 'bridges', 0.09);
    box(
      [x, 0.04, bridgeZ + 0.55],
      [0.65, 0.55, 0.04],
      pierLights[index],
      'bridge-lights',
      0.06,
    );
    box(
      [x, 0.75, bridgeZ + 0.98],
      [5.5, 0.08, 0.06],
      pierLights[index],
      'bridge-lights',
    );
  }

  // Three connected humps form one dragon, not three independent suspension bridges.
  const spine: Point[] = [
    [-18.5, 1.85, bridgeZ + 0.3],
    [-17, 1.2, bridgeZ + 0.3],
  ];
  for (const [start, end, height] of [
    [-16.5, -5.5, 2.4],
    [-5.5, 8, 3.5],
    [8, 19, 2.2],
  ] as const) {
    for (let step = 0; step <= 16; step++) {
      const fraction = step / 16;
      const x = start + (end - start) * fraction;
      const y = 1.3 + Math.sin(fraction * Math.PI) * height;
      spine.push([x, y, bridgeZ + 0.3]);
      if (step % 2 === 0)
        tube(
          [
            [x, 1.11, bridgeZ + 0.3],
            [x, y, bridgeZ + 0.3],
          ],
          0.045,
          '#e9ad35',
          'dragon-body',
          1,
        );
    }
  }
  spine.push([21, 1.2, bridgeZ + 0.3], [23, 1.65, bridgeZ + 0.3]);
  tube(spine, 0.25, '#f6bd36', 'dragon-body', 180);
  const bodyPath = new CatmullRomCurve3(
    spine.map((point) => new Vector3(...point)),
  );
  for (let index = 1; index < 95; index++) {
    const point = bodyPath.getPoint(index / 95);
    ball(
      [point.x, point.y, point.z],
      [0.12, 0.31, 0.39],
      index % 3 === 0 ? '#ffe183' : '#e9a326',
      'dragon-body',
    );
    if (index % 3 === 0) {
      const spike = new ConeGeometry(0.14, 0.44, 5);
      spike.rotateZ(-0.3);
      add(spike, '#ffda6e', 'dragon-body', [
        point.x + 0.04,
        point.y + 0.43,
        point.z,
      ]);
    }
  }

  // Friendly, exaggerated face: brows, eyes, snout, swept horns and curling whiskers.
  const headZ = bridgeZ + 0.3;
  ball([-18.9, 2.05, headZ], [1.0, 0.72, 0.66], '#fac843', 'dragon-head');
  ball([-19.8, 1.82, headZ], [0.9, 0.42, 0.53], '#ffda65', 'dragon-head');
  ball([-20.48, 1.86, headZ], [0.37, 0.3, 0.49], '#efac34', 'dragon-head');
  ball([-19.75, 1.49, headZ], [0.78, 0.15, 0.45], '#e8a22d', 'dragon-head');
  for (const side of [-1, 1]) {
    const faceZ = headZ + side * 0.58;
    ball([-19.06, 2.27, faceZ], [0.34, 0.29, 0.13], '#fff2be', 'dragon-face');
    ball(
      [-19.18, 2.25, faceZ + side * 0.1],
      [0.13, 0.18, 0.065],
      '#3e4251',
      'dragon-face',
    );
    ball(
      [-19.23, 2.32, faceZ + side * 0.15],
      [0.045, 0.055, 0.018],
      '#ffffff',
      'dragon-face',
    );
    tube(
      [
        [-19.5, 2.5, faceZ],
        [-19.15, 2.68, faceZ],
        [-18.73, 2.48, faceZ],
      ],
      0.1,
      '#df922b',
      'dragon-head',
    );
    tube(
      [
        [-18.5, 2.43, headZ + side * 0.35],
        [-18.1, 3.05, headZ + side * 0.52],
        [-17.6, 3.3, headZ + side * 0.57],
      ],
      0.1,
      '#fff0ad',
      'dragon-head',
    );
    tube(
      [
        [-18.55, 2.03, headZ + side * 0.43],
        [-17.85, 2.25, headZ + side * 0.85],
        [-17.65, 2.62, headZ + side * 0.95],
      ],
      0.17,
      '#ed9d2b',
      'dragon-head',
    );
    ball(
      [-20.44, 1.99, headZ + side * 0.32],
      [0.1, 0.075, 0.045],
      '#ae702c',
      'dragon-face',
    );
    tube(
      [
        [-20.6, 1.68, headZ + side * 0.3],
        [-20.05, 1.59, headZ + side * 0.49],
        [-19.42, 1.64, headZ + side * 0.5],
      ],
      0.035,
      '#b67a30',
      'dragon-face',
    );
    tube(
      [
        [-20.23, 1.85, headZ + side * 0.44],
        [-20.85, 2, headZ + side * 0.9],
        [-21.1, 2.43, headZ + side * 1.13],
      ],
      0.045,
      '#ffe795',
      'dragon-head',
    );
  }

  // Small lamps and rounded shoreline trees make the large dragon feel playful, not realistic.
  for (let x = -23; x < 25; x += 3.1) {
    for (const side of [-1, 1]) {
      const z = bridgeZ + side * 0.94;
      add(new CylinderGeometry(0.025, 0.035, 1.05, 6), '#8295ad', 'bridges', [
        x,
        1.7,
        z,
      ]);
      ball([x, 2.25, z], [0.075, 0.085, 0.075], '#fff3ba', 'bridge-lights');
    }
  }
  for (let index = 0; index < 46; index++) {
    const x = -35 + index * 1.7;
    const size = 0.2 + random() * 0.16;
    add(new CylinderGeometry(0.045, 0.065, 0.4, 5), '#7f7b81', 'waterfront', [
      x,
      0.52,
      -24.2,
    ]);
    ball([x, 0.95, -24.2], [size, size * 1.4, size], '#548d88', 'waterfront');
    box([x + 0.5, 0.65, -23.8], [0.035, 0.6, 0.035], '#8c9cab', 'waterfront');
    ball([x + 0.5, 0.97, -23.8], [0.06, 0.06, 0.06], '#ffe8b1', 'city-lights');
  }

  /**
   * Add a feathered, gently wavy patch of colored light on the river, without a texture.
   * @param x - Horizontal source position.
   * @param z - Back end of the reflection.
   * @param length - Reflection length toward the viewer.
   * @param width - Maximum width.
   * @param tint - Linear-light source color.
   * @param strength - Bounded additive intensity.
   */
  function reflection(
    x: number,
    z: number,
    length: number,
    width: number,
    tint: string,
    strength: number,
  ): void {
    const geometry = new PlaneGeometry(width, length, 8, 32);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);
    const color = new Color(tint);
    for (let index = 0; index < positions.count; index++) {
      const u = positions.getX(index) / (width / 2);
      const v = Math.min(
        1,
        Math.max(0, (positions.getZ(index) + length / 2) / length),
      );
      const feather =
        Math.max(0, 1 - u * u) ** 2 * Math.sin(v * Math.PI) ** 0.65;
      const ripples =
        0.65 + Math.sin(v * 90 + x) * 0.2 + Math.sin(v * 39) * 0.15;
      const intensity = feather * ripples * strength;
      positions.setX(
        index,
        positions.getX(index) + Math.sin(v * 17 + x) * 0.12,
      );
      color
        .clone()
        .multiplyScalar(intensity)
        .toArray(colors, index * 3);
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.translate(x, -0.045, z + length / 2);
    const parts = batches.get('reflections') ?? [];
    parts.push(geometry.toNonIndexed());
    geometry.dispose();
    batches.set('reflections', parts);
  }

  const bridgeRotation = 0.5;
  for (const [index, x] of [-19, -10, 0, 10, 20].entries()) {
    const worldX = Math.cos(bridgeRotation) * x;
    const worldZ = -12 - Math.sin(bridgeRotation) * x;
    reflection(worldX - 0.3, worldZ - 0.6, 12, 1.9, '#edb05d', 0.8);
    reflection(worldX + 0.5, worldZ + 0.1, 8, 1.65, pierLights[index], 0.8);
  }
  for (let index = 0; index < 16; index++)
    reflection(
      -31 + index * 4.5,
      -23,
      5 + random() * 6,
      0.3 + random() * 0.45,
      nightLights[index % nightLights.length],
      0.45,
    );

  for (let index = 0; index < 220; index++) {
    const glint = new PlaneGeometry(0.1 + random() * 0.5, 0.025);
    glint.rotateX(-Math.PI / 2);
    add(
      glint,
      '#729fb4',
      'water-glints',
      [-42 + random() * 83, -0.035, -22 + random() * 38],
      false,
    );
  }

  const bridgeTransform = new Matrix4()
    .makeTranslation(0, 0, -12)
    .multiply(new Matrix4().makeRotationY(bridgeRotation))
    .multiply(new Matrix4().makeTranslation(0, 0, -bridgeZ));
  for (const [name, parts] of batches) {
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error(`Cartoon riverfront batch failed: ${name}`);
    if (
      name === 'bridges' ||
      name === 'bridge-lights' ||
      name.startsWith('dragon-')
    )
      geometry.applyMatrix4(bridgeTransform);
    geometry.computeBoundingSphere();
    const material = new MeshBasicMaterial({
      vertexColors: true,
      toneMapped: false,
      ...(name === 'reflections'
        ? {
            transparent: true,
            opacity: 0.8,
            blending: AdditiveBlending,
            depthWrite: false,
          }
        : {}),
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `riverfront-${name}`;
    city.add(mesh);
  }
  return city;
}
