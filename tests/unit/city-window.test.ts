/**
 * Offscreen city rendering restores the room renderer and obeys the shared motion lifecycle.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  Vector4,
  WebGLRenderTarget,
} from 'three';
import type { BufferGeometry, Material, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  CITY_WINDOW,
  createCityWindowFrame,
  installCityWindowView,
} from '../../src/world/city-window';

test('city pass renders once while stationary, suspends offscreen, restores renderer state on failure, and disposes once', () => {
  const room = new Scene();
  const frame = createCityWindowFrame();
  room.add(frame);
  const pane = room.getObjectByName('city-window-view') as Mesh<
    BufferGeometry,
    MeshBasicMaterial
  >;
  const previousMap = new Texture();
  const releasePreviousMap = vi.spyOn(previousMap, 'dispose');
  pane.material.map = previousMap;
  const originalTarget = new WebGLRenderTarget(16, 16);
  let target: WebGLRenderTarget | null = originalTarget;
  const viewport = new Vector4(0, 0, 1440, 900);
  const scissor = new Vector4(2, 4, 800, 600);
  const clearColor = new Color('#142432');
  let clearAlpha = 0.42;
  let scissorTest = true;
  const stub = {
    getPixelRatio: vi.fn().mockReturnValue(2),
    getRenderTarget: vi.fn().mockImplementation(() => target),
    setRenderTarget: vi
      .fn()
      .mockImplementation((value: WebGLRenderTarget | null) => {
        target = value;
      }),
    getViewport: vi
      .fn()
      .mockImplementation((out: Vector4) => out.copy(viewport)),
    setViewport: vi.fn().mockImplementation((value: Vector4) => {
      viewport.copy(value);
    }),
    getScissor: vi.fn().mockImplementation((out: Vector4) => out.copy(scissor)),
    setScissor: vi.fn().mockImplementation((value: Vector4) => {
      scissor.copy(value);
    }),
    getScissorTest: vi.fn().mockImplementation(() => scissorTest),
    setScissorTest: vi.fn().mockImplementation((value: boolean) => {
      scissorTest = value;
    }),
    getClearColor: vi
      .fn()
      .mockImplementation((out: Color) => out.copy(clearColor)),
    getClearAlpha: vi.fn().mockImplementation(() => clearAlpha),
    setClearColor: vi.fn().mockImplementation((value: Color, alpha: number) => {
      clearColor.copy(value);
      clearAlpha = alpha;
    }),
    autoClear: true,
    xr: { enabled: true },
  };
  const renderer = stub as unknown as WebGLRenderer;
  let fail = false;
  const render = vi
    .spyOn(EffectComposer.prototype, 'render')
    .mockImplementation(() => {
      target = null;
      viewport.set(1, 2, 3, 4);
      scissor.set(5, 6, 7, 8);
      clearColor.set('#abcdef');
      clearAlpha = 0.9;
      renderer.autoClear = false;
      if (fail) throw new Error('offscreen failure');
    });
  const addPass = vi.spyOn(EffectComposer.prototype, 'addPass');
  const view = installCityWindowView(room, renderer);
  const cityPass = addPass.mock.calls[0][0] as RenderPass;
  const cityCamera = cityPass.camera as PerspectiveCamera;
  expect(cityCamera.view!.width / cityCamera.view!.height).toBeCloseTo(
    (CITY_WINDOW.right - CITY_WINDOW.left) /
      (CITY_WINDOW.top - CITY_WINDOW.bottom),
  );
  expect(cityCamera.view!.offsetX + cityCamera.view!.width / 2).toBe(636);
  const bloomPass = addPass.mock.calls[1][0] as UnrealBloomPass;
  const releaseBloomHighPass = vi.spyOn(
    bloomPass.materialHighPassFilter,
    'dispose',
  );
  const owned = new Set<BufferGeometry | Material>();
  cityPass.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material>;
    owned.add(mesh.geometry);
    owned.add(mesh.material);
  });
  const releases = [...owned].map((resource) => vi.spyOn(resource, 'dispose'));
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  const x = (CITY_WINDOW.left + CITY_WINDOW.right) / 2;
  const y = (CITY_WINDOW.bottom + CITY_WINDOW.top) / 2;
  camera.position.set(x, y, 3);
  camera.lookAt(x, y, -1);
  expect(view.update(camera, 0, false)).toBe(0);
  expect(render).toHaveBeenCalledOnce();
  expect(pane.material.map).not.toBe(previousMap);
  expect(view.update(camera, 0.05, true)).toBeCloseTo(0.05);
  expect(view.update(camera, 99, true)).toBeCloseTo(0.15);
  expect(view.update(camera, 0.05, false)).toBeCloseTo(0.15);
  // The recessed pane enters this frustum, but the physical opening is entirely outside it.
  const reading = new PerspectiveCamera(
    (2 * Math.atan(1.35 / (2 * Math.hypot(0.48, -0.23, -1.694))) * 180) /
      Math.PI,
    1.6,
    0.1,
    300,
  );
  reading.position.set(-0.38, 1.45, 1.25);
  reading.lookAt(0.1, 1.22, -0.444);
  reading.setViewOffset(1440, 900, -1440 * 0.22, 0, 1440, 900);
  expect(view.update(reading, 0.05, true)).toBeCloseTo(0.15);
  camera.lookAt(-20, 0, -1);
  expect(view.update(camera, 0.05, true)).toBeCloseTo(0.15);
  expect(render).toHaveBeenCalledTimes(3);
  camera.lookAt(x, y, -1);
  fail = true;
  expect(() => view.update(camera, 0.05, true)).toThrow('offscreen failure');
  expect(target).toBe(originalTarget);
  expect(viewport.toArray()).toEqual([0, 0, 1440, 900]);
  expect(scissor.toArray()).toEqual([2, 4, 800, 600]);
  expect(scissorTest).toBe(true);
  expect(clearColor.getHexString()).toBe('142432');
  expect(clearAlpha).toBe(0.42);
  expect(renderer.autoClear).toBe(true);
  expect(renderer.xr.enabled).toBe(true);
  view.dispose();
  view.dispose();
  expect(releaseBloomHighPass).toHaveBeenCalledOnce();
  expect(pane.material.map).toBe(previousMap);
  for (const release of releases) expect(release).toHaveBeenCalledOnce();
  expect(releasePreviousMap).not.toHaveBeenCalled();
  expect(view.update(camera, 1, true)).toBeCloseTo(0.2);
  render.mockRestore();
  addPass.mockRestore();
  originalTarget.dispose();
  previousMap.dispose();
  const frameResources = new Set<BufferGeometry | Material>();
  frame.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const mesh = object as Mesh<BufferGeometry, Material>;
    frameResources.add(mesh.geometry);
    frameResources.add(mesh.material);
  });
  for (const resource of frameResources) resource.dispose();
});
