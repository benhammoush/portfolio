/**
 * Loading percentages describe real model bytes, never invented GPU completion.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';

test('known transfers report bytes, preparation is separate, and only the first rendered frame completes loading', async () => {
  vi.resetModules();
  const loading = await import('../../src/world/scene-loading');
  expect(loading.readSceneLoading().stage).toBe('engine');
  const listener = vi.fn();
  const cleanup = loading.subscribeSceneLoading(listener);
  loading.reportSceneDownload(250, 1000);
  expect(loading.readSceneLoading()).toEqual({
    stage: 'download',
    loaded: 250,
    total: 1000,
  });
  loading.reportSceneDownload(1000, 1000);
  expect(loading.readSceneLoading().stage).toBe('preparing');
  loading.prepareScene();
  expect(loading.readSceneLoading().stage).not.toBe('ready');
  loading.finishSceneLoading();
  expect(loading.readSceneLoading().stage).toBe('ready');
  const complete = loading.readSceneLoading();
  loading.reportSceneDownload(0, 1000);
  expect(loading.readSceneLoading()).toBe(complete);
  cleanup();
  const calls = listener.mock.calls.length;
  loading.finishSceneLoading();
  expect(listener).toHaveBeenCalledTimes(calls);
});

test('unknown length stays indeterminate and malformed byte counts do not create a fake percentage', async () => {
  vi.resetModules();
  const loading = await import('../../src/world/scene-loading');
  loading.reportSceneDownload(125, 0);
  expect(loading.readSceneLoading()).toEqual({
    stage: 'download',
    loaded: 125,
    total: 0,
  });
  loading.reportSceneDownload(NaN, Infinity);
  expect(loading.readSceneLoading()).toEqual({
    stage: 'download',
    loaded: 0,
    total: 0,
  });
});
