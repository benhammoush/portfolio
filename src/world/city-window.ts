/**
 * Recessed room window with a bounded, live 3D riverfront view and isolated bloom.
 * @packageDocumentation
 */
import {
  BoxGeometry,
  Box3,
  Color,
  Frustum,
  Group,
  HalfFloatType,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from 'three';
import type {
  BufferGeometry,
  Camera,
  Material,
  Object3D,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createRiverfrontCity } from './riverfront-city';
import { createCityTraffic } from './city-traffic';

/** One model-space opening shared by wall geometry, its frame and the live view. */
export const CITY_WINDOW = {
  left: 1.4,
  right: 2.05,
  bottom: 1.02,
  top: 2.42,
  wallZ: -0.92,
} as const;

/** Live view lifecycle owned by the mounted room; it starts no animation loop. */
export interface CityWindowView {
  /**
   * Refresh only a visible, active window, or the first stationary frame.
   * @param camera - Current room camera used only to check window visibility.
   * @param delta - Active frame duration in seconds, capped by the caller.
   * @param animate - Shared scene motion policy, including pause and hidden-tab state.
   * @returns Active city time in seconds; offscreen/paused time is not accumulated.
   */
  update(camera: Camera, delta: number, animate: boolean): number;
  /** Release only this view's GPU/CPU resources and restore the pane's previous map. */
  dispose(): void;
}

/**
 * Build room-owned frame, reveal, sill and pane; the room disposes these shared resources.
 * @returns Window assembly positioned in the right-hand back wall.
 */
export function createCityWindowFrame(): Group {
  const group = new Group();
  group.name = 'city-window';
  group.position.z = CITY_WINDOW.wallZ;
  const { left, right, bottom, top } = CITY_WINDOW;
  const width = right - left;
  const height = top - bottom;
  const x = (left + right) / 2;
  const y = (bottom + top) / 2;
  const metal = new MeshStandardMaterial({
    color: '#202c30',
    roughness: 0.65,
    metalness: 0.3,
  });
  const plaster = new MeshStandardMaterial({
    color: '#454c4c',
    roughness: 0.95,
  });
  for (const side of [left, right]) {
    const direction = side === left ? -1 : 1;
    const frame = new Mesh(new BoxGeometry(0.03, height + 0.06, 0.055), metal);
    frame.position.set(side + direction * 0.015, y, 0.025);
    const reveal = new Mesh(new BoxGeometry(0.015, height, 0.15), plaster);
    reveal.position.set(side + direction * 0.0075, y, -0.05);
    frame.receiveShadow = true;
    reveal.receiveShadow = true;
    group.add(frame, reveal);
  }
  for (const side of [bottom, top]) {
    const direction = side === bottom ? -1 : 1;
    const frame = new Mesh(new BoxGeometry(width, 0.03, 0.055), metal);
    frame.position.set(x, side + direction * 0.015, 0.025);
    const reveal = new Mesh(new BoxGeometry(width, 0.015, 0.15), plaster);
    reveal.position.set(x, side + direction * 0.0075, -0.05);
    frame.receiveShadow = true;
    reveal.receiveShadow = true;
    group.add(frame, reveal);
  }
  const sill = new Mesh(new BoxGeometry(width + 0.12, 0.04, 0.25), plaster);
  sill.name = 'city-window-sill';
  sill.position.set(x, bottom - 0.05, 0.015);
  sill.receiveShadow = true;
  const pane = new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
  );
  pane.name = 'city-window-view';
  pane.position.set(x, y, -0.125);
  group.add(sill, pane);
  return group;
}

/**
 * Release private city resources, deduplicating vehicle prototypes and their shared materials.
 * @param scene - Private scene, never the main room or cached GLB.
 */
function disposeCity(scene: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material | Material[]>;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material])
      materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

/**
 * Render the approved live 3D composition behind the physical window opening.
 * A fixed-resolution portal retains the portrait framing across the room's camera tour;
 * bloom stays inside this view rather than changing the room's lighting or exposure.
 * @param room - Mounted room containing the owned window pane.
 * @param renderer - Existing Fiber renderer; no second canvas/context is created.
 * @returns Explicit update/disposal hooks driven by the existing demand render loop.
 */
export function installCityWindowView(
  room: Scene,
  renderer: WebGLRenderer,
): CityWindowView {
  const object = room.getObjectByName('city-window-view');
  if (
    !(object instanceof Mesh) ||
    !(object.material instanceof MeshBasicMaterial)
  )
    throw new Error('City window pane is missing');
  const pane = object;
  const frame = pane.parent!;
  const paneMaterial = object.material;
  const previousMap = paneMaterial.map;
  const city = new Scene();
  city.background = new Color('#030617');
  const traffic = createCityTraffic();
  city.add(createRiverfrontCity(), traffic.group);
  const cityCamera = new PerspectiveCamera(37, 1.6, 0.1, 300);
  cityCamera.position.set(7, 11, 19);
  cityCamera.lookAt(6, 2, -13);
  cityCamera.zoom = 1.2;
  // Keep the city undistorted in the taller opening, retaining the original crop center.
  const cropWidth =
    (900 * (CITY_WINDOW.right - CITY_WINDOW.left)) /
    (CITY_WINDOW.top - CITY_WINDOW.bottom);
  cityCamera.setViewOffset(1440, 900, 636 - cropWidth / 2, 0, cropWidth, 900);
  cityCamera.updateProjectionMatrix();
  const target = new WebGLRenderTarget(512, 768, {
    type: HalfFloatType,
    stencilBuffer: false,
  });
  let composer: EffectComposer | undefined;
  let bloom: UnrealBloomPass | undefined;
  const frustum = new Frustum();
  const paneBounds = new Box3();
  const openingBounds = new Box3(
    new Vector3(CITY_WINDOW.left, CITY_WINDOW.bottom, 0),
    new Vector3(CITY_WINDOW.right, CITY_WINDOW.top, 0),
  );
  const projection = new Matrix4();
  const viewport = new Vector4();
  const scissor = new Vector4();
  const clearColor = new Color();
  let elapsed = 0;
  let dirty = true;
  let disposed = false;

  /** Release the portal before the room releases the pane material. */
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    paneMaterial.map = previousMap;
    paneMaterial.needsUpdate = true;
    if (composer) {
      for (const pass of composer.passes) pass.dispose();
      // Three.js 0.186.1 omits the high-pass material from UnrealBloomPass.dispose().
      bloom?.materialHighPassFilter.dispose();
      composer.dispose();
    } else target.dispose();
    disposeCity(city);
  }

  try {
    composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(1);
    composer.renderToScreen = false;
    composer.addPass(new RenderPass(city, cityCamera));
    bloom = new UnrealBloomPass(new Vector2(512, 768), 0.28, 0.4, 0.65);
    composer.addPass(bloom);
    // Keep this render texture linear; the main renderer performs the one final sRGB encoding.
    paneMaterial.map = composer.readBuffer.texture;
    paneMaterial.needsUpdate = true;
  } catch (error) {
    dispose();
    throw error;
  }

  /**
   * Advance visible city motion without scheduling any additional frames.
   * @param camera - Main room camera, never the private city camera.
   * @param delta - Active elapsed seconds.
   * @param animate - Whether shared motion is currently allowed.
   * @returns Accumulated active city time in seconds.
   */
  function update(camera: Camera, delta: number, animate: boolean): number {
    if (disposed) return elapsed;
    camera.updateMatrixWorld();
    pane.updateWorldMatrix(true, false);
    frustum.setFromProjectionMatrix(
      projection.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );
    // Cull the physical opening: the deeper pane can intersect behind an opaque wall edge.
    const active =
      animate &&
      frustum.intersectsBox(
        paneBounds.copy(openingBounds).applyMatrix4(frame.matrixWorld),
      );
    if (!dirty && !active) return elapsed;
    if (active) elapsed += Math.min(Math.max(delta, 0), 0.1);
    traffic.update(elapsed);
    const previousTarget = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    const clearAlpha = renderer.getClearAlpha();
    const scissorTest = renderer.getScissorTest();
    const xrEnabled = renderer.xr.enabled;
    renderer.getClearColor(clearColor);
    renderer.getViewport(viewport);
    renderer.getScissor(scissor);
    try {
      renderer.xr.enabled = false;
      renderer.setScissorTest(false);
      composer!.render(delta);
      paneMaterial.map = composer!.readBuffer.texture;
      dirty = false;
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.setViewport(viewport);
      renderer.setScissor(scissor);
      renderer.setScissorTest(scissorTest);
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.xr.enabled = xrEnabled;
    }
    return elapsed;
  }
  return { update, dispose };
}
