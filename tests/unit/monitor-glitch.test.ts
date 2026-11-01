/**
 * Signal decoration is random, bounded, interruptible and disabled for reduced motion.
 * @packageDocumentation
 */
import { afterEach, expect, test, vi } from 'vitest';
import {
  createSignalPattern,
  playMonitorGlitch,
} from '../../src/world/monitor-glitch';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('controlled randomness changes tear locations, direction and fragments within supported ranges', () => {
  const first = createSignalPattern(true, () => 0.2);
  const second = createSignalPattern(true, () => 0.8);
  expect(first.style['--tear-top-a']).not.toBe(second.style['--tear-top-a']);
  expect(parseFloat(String(first.style['--tear-shift-a']))).toBeLessThan(0);
  expect(parseFloat(String(second.style['--tear-shift-a']))).toBeGreaterThan(0);
  for (const pattern of [first, second]) {
    expect(pattern.duration).toBeGreaterThanOrEqual(780);
    expect(pattern.duration).toBeLessThanOrEqual(1080);
    expect(pattern.fragments).toHaveLength(7);
    for (const fragment of pattern.fragments)
      expect(parseFloat(String(fragment['--noise-width']))).toBeLessThanOrEqual(
        34,
      );
  }
  expect(JSON.stringify(createSignalPattern(false, () => NaN))).not.toContain(
    'NaN',
  );
});

test.each([false, true])(
  'bursts clean up without leaving timers or fragments; reduced=%s',
  (reduced) => {
    vi.useFakeTimers();
    const remove = vi.fn();
    vi.stubGlobal('matchMedia', () => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: remove,
    }));
    const root = document.createElement('section');
    root.innerHTML = '<div class="monitor-fragments"></div>';
    const cleanup = playMonitorGlitch(root, true);
    expect(root.hasAttribute('data-glitch')).toBe(!reduced);
    expect(root.querySelectorAll('.monitor-fragments > span')).toHaveLength(
      reduced ? 0 : 7,
    );
    vi.advanceTimersByTime(1200);
    expect(root.hasAttribute('data-glitch')).toBe(false);
    expect(root.querySelectorAll('.monitor-fragments > span')).toHaveLength(0);
    cleanup();
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalled();
  },
);
