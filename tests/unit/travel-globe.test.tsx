/**
 * Travel geometry and canvas lifecycle stay independent of portfolio navigation.
 * @packageDocumentation
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TravelGlobe from '../../src/world/TravelGlobe';
import {
  globeVector,
  travelArc,
  travelStops,
} from '../../src/world/travel-globe';
import { drawTravelGlobe } from '../../src/world/travel-globe';

vi.mock('../../src/world/travel-globe', async (original) => ({
  ...(await original<typeof import('../../src/world/travel-globe')>()),
  drawTravelGlobe: vi.fn(),
}));
const media = {
  matches: false,
  addEventListener: vi.fn<(event: string, listener: () => void) => void>(),
  removeEventListener: vi.fn(),
};
const disconnect = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  media.matches = false;
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      /** Observe without automatic resize callbacks in the component contract test. */
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(
    HTMLCanvasElement.prototype,
    'getBoundingClientRect',
  ).mockReturnValue({ width: 600, height: 700 } as DOMRect);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('all six destinations form a closed loop of lifted great-circle arcs', () => {
  expect(travelStops).toEqual(
    [
      [2.35, 48.86],
      [98.99, 18.79],
      [108.2, 16.05],
      [-157.86, 21.31],
      [-118.24, 34.05],
      [-58.38, -34.6],
    ].map(([lon, lat]) => globeVector(lon, lat)),
  );
  for (const [i, start] of travelStops.entries()) {
    const end = travelStops[(i + 1) % travelStops.length];
    expect(Math.hypot(...start)).toBeCloseTo(1);
    travelArc(start, end, 0).forEach((n, j) => expect(n).toBeCloseTo(start[j]));
    travelArc(start, end, 1).forEach((n, j) => expect(n).toBeCloseTo(end[j]));
    expect(Math.hypot(...travelArc(start, end, 0.5))).toBeCloseTo(1.16);
  }
});

test('animation has no controls, pauses in hidden tabs and cleans up on unmount', () => {
  const { container, unmount } = render(<TravelGlobe />);
  expect(container.querySelector('canvas')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(drawTravelGlobe).toHaveBeenCalled();
  expect(screen.queryByRole('button')).toBeNull();
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  vi.mocked(drawTravelGlobe).mockClear();
  act(() => {
    vi.advanceTimersByTime(60000);
  });
  expect(drawTravelGlobe).not.toHaveBeenCalled();
  hidden.mockReturnValue(false);
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
  });
  expect(drawTravelGlobe).toHaveBeenCalled();
  expect(vi.mocked(drawTravelGlobe).mock.lastCall?.[3]).toBeLessThan(1500);
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
  expect(media.removeEventListener).toHaveBeenCalledWith(
    'change',
    media.addEventListener.mock.calls[0][1],
  );
});

test('rotation continues beyond five seconds and resize preserves its progress', () => {
  const { unmount } = render(<TravelGlobe />);
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  const elapsed = vi.mocked(drawTravelGlobe).mock.lastCall![3];
  expect(elapsed).toBeGreaterThan(4500);
  act(() => {
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(1000);
  });
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  expect(vi.mocked(drawTravelGlobe).mock.lastCall?.[3]).toBeGreaterThan(
    elapsed,
  );
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('reduced motion paints once and live preference changes stop animation', () => {
  media.matches = true;
  const { unmount } = render(<TravelGlobe />);
  expect(drawTravelGlobe).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  act(() => {
    media.matches = false;
    media.addEventListener.mock.calls[0][1]();
    vi.advanceTimersByTime(100);
  });
  expect(vi.mocked(drawTravelGlobe).mock.calls.length).toBeGreaterThan(2);
  act(() => {
    media.matches = true;
    media.addEventListener.mock.calls[0][1]();
  });
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

test('a missing canvas context leaves decoration optional', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const { unmount } = render(<TravelGlobe />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

test('real artwork batches dots and arcs into a bounded number of draw calls', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/world/travel-globe')
  >('../../src/world/travel-globe');
  const context = {
    clearRect: vi.fn(),
    /** Supply a gradient without a native canvas.
     * @returns A no-op color-stop recorder.
     */
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
  };
  for (const elapsed of [0, 10000, 100000]) {
    vi.clearAllMocks();
    actual.drawTravelGlobe(
      context as unknown as CanvasRenderingContext2D,
      600,
      700,
      elapsed,
    );
    expect(context.arc.mock.calls.length).toBeGreaterThan(1000);
    expect(context.fill.mock.calls.length).toBeLessThan(40);
    expect(context.stroke.mock.calls.length).toBeLessThan(25);
  }
});
