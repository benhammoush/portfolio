/**
 * Dependency-free spherical artwork for the landing page's decorative travel loop.
 * @packageDocumentation
 */

/** Cartesian coordinates on or above the unit sphere. */
export type GlobeVector = readonly [number, number, number];

/** Convert geographic degrees to a unit sphere with north pointing upward.
 * @param longitude - East-positive longitude in degrees.
 * @param latitude - North-positive latitude in degrees.
 * @returns A unit vector before view rotation.
 */
export function globeVector(longitude: number, latitude: number): GlobeVector {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return [
    Math.cos(lat) * Math.sin(lon),
    -Math.sin(lat),
    Math.cos(lat) * Math.cos(lon),
  ];
}

// France → Thailand → Vietnam → Hawaii → Los Angeles → Buenos Aires → France.
export const travelStops = [
  [2.35, 48.86],
  [98.99, 18.79],
  [108.2, 16.05],
  [-157.86, 21.31],
  [-118.24, 34.05],
  [-58.38, -34.6],
].map(([lon, lat]) => globeVector(lon, lat));

/** Lift a shortest-path great-circle route above the sphere.
 * @param start - Unit vector at departure.
 * @param end - Unit vector at arrival; travel stops are neither coincident nor antipodal.
 * @param fraction - Progress from zero to one.
 * @returns The interpolated, lifted position.
 */
export function travelArc(
  start: GlobeVector,
  end: GlobeVector,
  fraction: number,
): GlobeVector {
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        start.reduce((sum, n, i) => sum + n * end[i], 0),
      ),
    ),
  );
  const sine = Math.sin(angle);
  if (Math.abs(sine) < 0.0001) return start;
  const lift = 1 + 0.16 * Math.sin(Math.PI * fraction);
  const a = (Math.sin((1 - fraction) * angle) / sine) * lift;
  const b = (Math.sin(fraction * angle) / sine) * lift;
  return [
    start[0] * a + end[0] * b,
    start[1] * a + end[1] * b,
    start[2] * a + end[2] * b,
  ];
}

// Original, deliberately coarse silhouettes: decorative artwork, not cartographic data.
const continents = [
  [
    [-168, 72],
    [-142, 70],
    [-130, 57],
    [-124, 49],
    [-123, 38],
    [-112, 30],
    [-104, 22],
    [-95, 16],
    [-87, 19],
    [-82, 25],
    [-80, 32],
    [-67, 45],
    [-55, 52],
    [-60, 60],
    [-82, 65],
    [-98, 73],
    [-125, 72],
  ],
  [
    [-81, 12],
    [-70, 11],
    [-61, 7],
    [-51, 3],
    [-35, -6],
    [-39, -20],
    [-48, -28],
    [-55, -38],
    [-68, -55],
    [-75, -45],
    [-74, -24],
    [-80, -5],
  ],
  [
    [-52, 60],
    [-40, 61],
    [-20, 72],
    [-26, 82],
    [-45, 84],
    [-60, 76],
  ],
  [
    [-10, 36],
    [-10, 44],
    [-3, 49],
    [6, 54],
    [10, 58],
    [20, 70],
    [31, 70],
    [32, 60],
    [44, 52],
    [39, 42],
    [27, 39],
    [20, 36],
    [12, 42],
    [4, 43],
  ],
  [
    [-18, 36],
    [4, 37],
    [16, 32],
    [33, 31],
    [43, 12],
    [51, 11],
    [44, -3],
    [40, -15],
    [32, -27],
    [19, -35],
    [11, -29],
    [8, -13],
    [-1, 4],
    [-10, 6],
    [-17, 16],
  ],
  [
    [27, 70],
    [62, 77],
    [100, 77],
    [139, 71],
    [179, 66],
    [170, 53],
    [146, 47],
    [140, 35],
    [129, 31],
    [122, 20],
    [111, 17],
    [108, 9],
    [102, 3],
    [98, 10],
    [91, 22],
    [80, 7],
    [73, 17],
    [66, 24],
    [53, 25],
    [48, 31],
    [37, 37],
    [43, 47],
    [31, 58],
  ],
  [
    [95, 5],
    [104, 1],
    [107, -6],
    [119, -9],
    [130, -5],
    [140, -7],
    [146, -5],
    [132, 2],
    [117, 5],
    [111, 12],
    [107, 19],
    [103, 16],
    [101, 8],
  ],
  [
    [112, -12],
    [131, -11],
    [142, -10],
    [153, -26],
    [146, -39],
    [132, -35],
    [115, -34],
  ],
  [
    [46, -13],
    [51, -16],
    [49, -25],
    [44, -25],
  ],
  [
    [130, 31],
    [141, 43],
    [145, 44],
    [141, 35],
  ],
  [
    [-8, 50],
    [-4, 51],
    [-3, 59],
    [-7, 58],
  ],
  [
    [-25, 63],
    [-14, 64],
    [-15, 67],
    [-23, 67],
  ],
];

/** Test whether a sample lies inside one coarse continent silhouette.
 * @param longitude - Sample longitude in degrees.
 * @param latitude - Sample latitude in degrees.
 * @param polygon - Ordered geographic vertices.
 * @returns Whether the sample belongs to the silhouette.
 */
function inside(longitude: number, latitude: number, polygon: number[][]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > latitude !== b[1] > latitude &&
      longitude < ((b[0] - a[0]) * (latitude - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
}

/** Precompute geographic samples once, never during an animation frame.
 * @returns Land and ocean dots evenly spaced along each latitude.
 */
function makeDots() {
  const dots: { vector: GlobeVector; land: boolean }[] = [];
  for (let latitude = -58; latitude <= 81; latitude += 2.8) {
    const step = 2.8 / Math.max(0.22, Math.cos((latitude * Math.PI) / 180));
    for (let longitude = -180; longitude < 180; longitude += step)
      dots.push({
        vector: globeVector(longitude, latitude),
        land: continents.some((p) => inside(longitude, latitude, p)),
      });
  }
  return dots;
}
const dots = makeDots();
const routes = travelStops.map((stop, leg) =>
  Array.from({ length: 76 }, (_, i) =>
    travelArc(stop, travelStops[(leg + 1) % travelStops.length], i / 75),
  ),
);

/** Draw the entire globe in CSS-pixel coordinates; the caller owns backing resolution.
 * @param context - Canvas 2D context, already scaled for pixel density.
 * @param width - Canvas width in CSS pixels.
 * @param height - Canvas height in CSS pixels.
 * @param elapsed - Visible, unpaused animation time in milliseconds.
 */
export function drawTravelGlobe(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
) {
  const radius = Math.min(width * 0.48, height * 0.46);
  const cx = width * 0.57,
    cy = height * 0.51;
  const rotation = elapsed * 0.000035 - (56 * Math.PI) / 180;
  const cosine = Math.cos(rotation),
    sine = Math.sin(rotation);
  /** Project a rotated sphere with the mockup's gentle screen-plane tilt.
   * @param vector - Position on or above the sphere.
   * @returns Canvas x/y and signed depth.
   */
  function project(vector: GlobeVector): GlobeVector {
    const x = vector[0] * cosine + vector[2] * sine;
    const z = vector[2] * cosine - vector[0] * sine;
    return [
      cx + (x * Math.cos(-0.13) + vector[1] * Math.sin(-0.13)) * radius,
      cy + (vector[1] * Math.cos(-0.13) - x * Math.sin(-0.13)) * radius,
      z,
    ];
  }
  /** Fill one circular dot in the current paint color.
   * @param position - Projected canvas position.
   * @param size - Radius in CSS pixels.
   */
  function dot(position: GlobeVector, size: number) {
    context.beginPath();
    context.arc(position[0], position[1], size, 0, Math.PI * 2);
    context.fill();
  }
  context.clearRect(0, 0, width, height);
  const glow = context.createRadialGradient(
    cx - radius * 0.2,
    cy - radius * 0.25,
    radius * 0.1,
    cx,
    cy,
    radius,
  );
  glow.addColorStop(0, 'rgba(40,88,59,.12)');
  glow.addColorStop(1, 'rgba(20,55,32,.025)');
  context.fillStyle = glow;
  dot([cx, cy, 0], radius);
  context.strokeStyle = 'rgba(90,160,113,.10)';
  context.lineWidth = 0.65;
  context.stroke();
  // Batch similar depths so thousands of dots need only 24 fill calls per frame.
  const batches: GlobeVector[][] = Array.from({ length: 24 }, () => []);
  for (const sample of dots) {
    const p = project(sample.vector);
    if (p[2] < 0) continue;
    batches[(sample.land ? 12 : 0) + Math.min(11, Math.floor(p[2] * 12))].push(
      p,
    );
  }
  for (const [index, batch] of batches.entries()) {
    const land = index >= 12;
    const depth = 0.26 + 0.74 * (((index % 12) + 0.5) / 12);
    const size = (land ? 1.12 : 0.5) * Math.max(0.7, width / 470);
    context.fillStyle = land
      ? `rgba(112,236,154,${depth * 0.65})`
      : `rgba(77,137,95,${depth * 0.14})`;
    context.beginPath();
    for (const p of batch) {
      context.moveTo(p[0] + size, p[1]);
      context.arc(p[0], p[1], size, 0, Math.PI * 2);
    }
    context.fill();
  }
  const phase = (elapsed / 3300) % travelStops.length;
  const active = Math.floor(phase);
  for (const [leg, route] of routes.entries()) {
    const projected = route.map(project);
    for (const front of [false, true]) {
      context.setLineDash(front ? [] : [1.5, 3.5]);
      context.strokeStyle = front
        ? leg === active
          ? 'rgba(150,255,187,.9)'
          : 'rgba(112,236,154,.46)'
        : 'rgba(99,163,120,.12)';
      context.lineWidth = front ? (leg === active ? 1.35 : 0.85) : 0.65;
      context.beginPath();
      for (let i = 0; i < projected.length - 1; i++) {
        const p = projected[i],
          q = projected[i + 1];
        if (p[2] + q[2] >= 0 !== front) continue;
        context.moveTo(p[0], p[1]);
        context.lineTo(q[0], q[1]);
      }
      context.stroke();
    }
  }
  context.setLineDash([]);
  for (const stop of travelStops) {
    const p = project(stop),
      front = p[2] >= 0;
    context.fillStyle = front ? '#b9ffcc' : 'rgba(112,236,154,.16)';
    dot(p, front ? 2.7 : 1.5);
    if (front) {
      context.strokeStyle = 'rgba(112,236,154,.28)';
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(p[0], p[1], 6, 0, Math.PI * 2);
      context.stroke();
    }
  }
  const pulse = project(
    travelArc(
      travelStops[active],
      travelStops[(active + 1) % travelStops.length],
      phase - active,
    ),
  );
  if (pulse[2] >= 0) {
    const halo = context.createRadialGradient(
      pulse[0],
      pulse[1],
      0,
      pulse[0],
      pulse[1],
      8,
    );
    halo.addColorStop(0, 'rgba(187,255,210,.8)');
    halo.addColorStop(1, 'rgba(112,236,154,0)');
    context.fillStyle = halo;
    dot(pulse, 8);
    context.fillStyle = '#dbffe6';
    dot(pulse, 2);
  }
}
