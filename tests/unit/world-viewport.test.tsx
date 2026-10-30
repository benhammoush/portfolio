/**
 * Automatic scene policy and motion controls without expensive WebGL rendering.
 * @packageDocumentation
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import WorldViewport from '../../src/world/WorldViewport';

/** Loader escape action used by the lightweight mock. */
interface LoaderProps {
  /** Escape pending graphics. */
  onSkip: () => void;
}
/** Scene policy observed without a GPU. */
interface CanvasProps {
  /** Whether character motion is running. */
  animateIntro: boolean;
  /** Whether scroll-driven camera travel is allowed. */
  cameraTravel: boolean;
  /** Compact rendering resolution remains bounded even with camera travel. */
  dpr: number | [number, number];
}

vi.mock('../../src/world/workflow-focus', () => ({
  /** Keep inspection available for the mocked project-reading context.
   * @returns An active reading stop.
   */
  readMonitorFocus: () => ({ progress: 1 }),
}));
vi.mock('../../src/world/SceneLoadingScreen', () => ({
  /** Expose the loader's recovery action without a native modal.
   * @param props - Loader escape action.
   * @returns A recovery button.
   */
  default: (props: LoaderProps) => (
    <button onClick={props.onSkip}>Continue without 3D</button>
  ),
}));
vi.mock('../../src/world/WorldCanvas', () => ({
  /** Expose the real boundary's motion and camera props without WebGL.
   * @param props - Scene policy.
   * @returns Observable scene props.
   */
  default: (props: CanvasProps) => (
    <canvas
      data-testid="scene"
      data-motion={String(props.animateIntro)}
      data-travel={String(props.cameraTravel)}
      data-dpr={String(props.dpr)}
    />
  ),
}));

let narrow = false;
let short = false;
let wideDesktop = false;
let reduced = false;
const listeners = new Set<(event: MediaQueryListEvent) => void>();

beforeEach(() => {
  narrow = false;
  short = false;
  wideDesktop = false;
  reduced = false;
  listeners.clear();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduced-motion')
      ? reduced
      : wideDesktop || (!narrow && !short),
    /** Observe policy subscriptions for deterministic preference changes.
     * @param _ - Native event name.
     * @param listener - Policy invalidation callback.
     * @returns Updated listener set.
     */
    addEventListener: (
      _: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    /** Release the corresponding policy subscription.
     * @param _ - Native event name.
     * @param listener - Policy invalidation callback.
     * @returns Whether the listener was removed.
     */
    removeEventListener: (
      _: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
  }));
});
afterEach(() => vi.unstubAllGlobals());

test.each([
  { mobile: false, reduce: false, motion: 'true', travel: 'true' },
  { mobile: true, reduce: false, motion: 'true', travel: 'true' },
  { mobile: false, reduce: true, motion: 'false', travel: 'false' },
  { mobile: true, reduce: true, motion: 'false', travel: 'false' },
])(
  '3D starts automatically for mobile=$mobile reduced=$reduce',
  async ({ mobile, reduce, motion, travel }) => {
    narrow = mobile;
    reduced = reduce;
    render(<WorldViewport />);
    const scene = await screen.findByTestId('scene');
    expect(scene).toHaveAttribute('data-motion', motion);
    expect(scene).toHaveAttribute('data-travel', travel);
    expect(scene).toHaveAttribute(
      'data-dpr',
      !mobile && !reduce ? '2' : '1,1.5',
    );
    expect(
      screen.queryByRole('button', {
        name: /Use still view|Enable 3D|View stationary 3D/,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: reduce ? 'Resume motion' : 'Pause motion',
      }),
    );
    expect(scene).toHaveAttribute('data-motion', reduce ? 'true' : 'false');
    expect(scene).toHaveAttribute('data-travel', travel);
    fireEvent.click(
      screen.getByRole('button', {
        name: reduce ? 'Pause motion' : 'Resume motion',
      }),
    );
    expect(scene).toHaveAttribute('data-motion', motion);
  },
);

test('a new reduced-motion preference pauses without unloading the scene', async () => {
  render(<WorldViewport />);
  const scene = await screen.findByTestId('scene');
  act(() => {
    reduced = true;
    listeners.forEach((listener) =>
      listener({
        media: '(prefers-reduced-motion: reduce)',
        matches: true,
      } as MediaQueryListEvent),
    );
  });
  expect(scene).toHaveAttribute('data-motion', 'false');
  expect(scene).toHaveAttribute('data-travel', 'false');
  fireEvent.click(screen.getByRole('button', { name: 'Resume motion' }));
  expect(scene).toHaveAttribute('data-motion', 'true');
  expect(scene).toHaveAttribute('data-travel', 'false');
  act(() => {
    narrow = true;
    listeners.forEach((listener) =>
      listener({
        media:
          '(min-width: 1200px), (min-width: 768px) and (min-height: 600px)',
        matches: false,
      } as MediaQueryListEvent),
    );
  });
  expect(scene).toHaveAttribute('data-motion', 'true');
});

test('loading can still be skipped, without offering a selectable still mode', async () => {
  render(<WorldViewport />);
  await screen.findByTestId('scene');
  fireEvent.click(screen.getByRole('button', { name: 'Continue without 3D' }));
  expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
  expect(screen.queryByText('Scene options')).not.toBeInTheDocument();
  expect(screen.getByText(/3D loading skipped/)).toBeInTheDocument();
});

test('landscape phones keep camera travel without desktop supersampling', async () => {
  short = true;
  render(<WorldViewport />);
  const scene = await screen.findByTestId('scene');
  expect(scene).toHaveAttribute('data-travel', 'true');
  expect(scene).toHaveAttribute('data-dpr', '1,1.5');
  act(() => {
    short = false;
    listeners.forEach((listener) =>
      listener({
        media:
          '(min-width: 1200px), (min-width: 768px) and (min-height: 600px)',
        matches: true,
      } as MediaQueryListEvent),
    );
  });
  expect(scene).toHaveAttribute('data-travel', 'true');
});

test('short desktop windows retain the accepted monitor and camera composition', async () => {
  short = true;
  wideDesktop = true;
  render(<WorldViewport />);
  expect(await screen.findByTestId('scene')).toHaveAttribute(
    'data-travel',
    'true',
  );
});
