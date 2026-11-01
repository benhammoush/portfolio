/**
 * The physical monitor opens on About me without waiting for entry scrolling.
 * @packageDocumentation
 */
import { render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Group } from 'three';
import type { Mesh, MeshPhysicalMaterial, PlaneGeometry } from 'three';
import WorkflowMonitor from '../../src/world/WorkflowMonitor';
import { drawTerminalWelcome } from '../../src/world/terminal-screen';

const canvas = document.createElement('canvas');
const invalidate = vi.fn();
vi.mock('@react-three/fiber', () => ({
  /** Replace the renderer while retaining real owned surface resources.
   * @returns The decorative canvas and demand-frame request.
   */
  useThree: () => ({ gl: { domElement: canvas }, invalidate }),
}));
vi.mock('../../src/world/terminal-screen', () => ({
  drawTerminalWelcome: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());

test('About me is ready on mount and all per-mount resources are released', () => {
  const context = {} as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const scene = new Group();
  const { unmount } = render(<WorkflowMonitor scene={scene} />);
  expect(drawTerminalWelcome).toHaveBeenCalledWith(context);
  expect(canvas).toHaveAttribute('data-monitor-terminal', 'true');
  expect(invalidate).toHaveBeenCalled();
  const plane = scene.children[0] as Mesh<PlaneGeometry, MeshPhysicalMaterial>;
  expect(plane.material.clearcoat).toBe(0);
  const geometry = vi.spyOn(plane.geometry, 'dispose');
  const material = vi.spyOn(plane.material, 'dispose');
  const texture = vi.spyOn(plane.material.emissiveMap!, 'dispose');
  unmount();
  expect(scene.children).toHaveLength(0);
  expect(geometry).toHaveBeenCalledOnce();
  expect(material).toHaveBeenCalledOnce();
  expect(texture).toHaveBeenCalledOnce();
  expect(canvas).not.toHaveAttribute('data-monitor-terminal');
});
