/**
 * Timed arrival owns its deadline, visible-time clock, storage and complete cleanup.
 * @packageDocumentation
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  bypassEntry,
  readEntryProgress,
  rememberEntry,
  startEntry,
} from '../../src/world/monitor-entry';

const loading = vi.hoisted(() => ({
  ready: false,
  listener: vi.fn<() => void>(),
}));
vi.mock('../../src/world/scene-loading', () => ({
  /** Read an isolated graphics readiness snapshot.
   * @returns The simulated loading stage.
   */
  readSceneLoading: () => ({ stage: loading.ready ? 'ready' : 'engine' }),
  /** Retain one readiness listener.
   * @param listener - Entry readiness handler.
   * @returns Subscription cleanup.
   */
  subscribeSceneLoading: (listener: () => void) => {
    loading.listener.mockImplementation(listener);
    return () => {
      loading.listener.mockReset();
    };
  },
}));
beforeEach(() => {
  vi.useFakeTimers();
  loading.ready = false;
  sessionStorage.clear();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('waits for a painted frame, then completes in four visible seconds rather than the loading deadline', () => {
  const finish = vi.fn();
  const stop = startEntry(finish);
  vi.advanceTimersByTime(7000);
  expect(readEntryProgress()).toBe(0);
  loading.ready = true;
  loading.listener();
  vi.advanceTimersByTime(2016);
  expect(readEntryProgress()).toBeCloseTo(0.5, 1);
  expect(finish).not.toHaveBeenCalled();
  vi.advanceTimersByTime(2100);
  expect(finish).toHaveBeenCalledOnce();
  stop();
  expect(vi.getTimerCount()).toBe(0);
});

test('a stalled load bypasses at eight seconds and late readiness cannot restart it', () => {
  const finish = vi.fn();
  const stop = startEntry(finish);
  vi.advanceTimersByTime(8000);
  expect(finish).toHaveBeenCalledOnce();
  loading.ready = true;
  loading.listener();
  vi.advanceTimersByTime(5000);
  expect(finish).toHaveBeenCalledOnce();
  stop();
});

test('hidden time is not consumed; cleanup cancels animation and keyboard listeners', () => {
  loading.ready = true;
  const finish = vi.fn();
  const stop = startEntry(finish);
  vi.advanceTimersByTime(1016);
  const initial = readEntryProgress();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(10000);
  expect(readEntryProgress()).toBe(initial);
  stop();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  vi.advanceTimersByTime(10000);
  expect(finish).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('Escape skips immediately and remembered entries bypass later arrivals', () => {
  expect(bypassEntry()).toBe(false);
  const finish = vi.fn();
  const stop = startEntry(finish);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(finish).toHaveBeenCalledOnce();
  stop();
  rememberEntry();
  expect(bypassEntry()).toBe(true);
});

test('storage restrictions never prevent content handoff', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(bypassEntry()).toBe(false);
  expect(rememberEntry).not.toThrow();
  expect(bypassEntry()).toBe(true);
});

test('a reduced-motion preference change completes the entrance immediately', () => {
  const media = {
    matches: false,
    addEventListener: vi.fn<(name: string, listener: () => void) => void>(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', () => media);
  const finish = vi.fn();
  const stop = startEntry(finish);
  media.matches = true;
  const listener = media.addEventListener.mock.calls[0][1];
  listener();
  expect(finish).toHaveBeenCalledOnce();
  stop();
  expect(media.removeEventListener).toHaveBeenCalledWith('change', listener);
  expect(vi.getTimerCount()).toBe(0);
});

test('readable storage with rejected writes still remembers same-tab SPA visits', async () => {
  vi.resetModules();
  const entry = await import('../../src/world/monitor-entry');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota exceeded');
  });
  expect(entry.bypassEntry()).toBe(false);
  entry.rememberEntry();
  expect(sessionStorage.getItem('portfolio-intro-seen')).toBeNull();
  expect(entry.bypassEntry()).toBe(true);
});
