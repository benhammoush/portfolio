/**
 * Camera entry retraces the same path and covers the physical monitor on every aspect.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import { sampleMonitorPose } from '../../src/world/monitor-entry';
import { CHAPTERS } from '../../src/world/chapters';
import { MONITOR_SCREEN } from '../../src/world/monitor-landmarks';

test('the hero is unchanged and the camera approaches the monitor from outside the character', () => {
  const initial = sampleMonitorPose(0, 4.4, 16 / 9);
  expect(initial.position).toEqual(CHAPTERS[0].position);
  expect(initial.target).toEqual(CHAPTERS[0].target);
  expect(initial.span).toBe(4.4);
  expect(sampleMonitorPose(0.5, 4.4, 16 / 9).position[0]).toBeLessThan(-0.4);
  const end = sampleMonitorPose(1, 4.4, 16 / 9);
  expect(end.position).toEqual([0, MONITOR_SCREEN.y, -0.12]);
  expect(end.target).toEqual([
    MONITOR_SCREEN.x,
    MONITOR_SCREEN.y,
    MONITOR_SCREEN.z,
  ]);
});

test.each([0.4, 1, 16 / 9, 2.5])(
  'the final screen covers aspect %s without stretching its geometry',
  (aspect) => {
    const end = sampleMonitorPose(1, 5, aspect);
    expect(end.span).toBeLessThan(MONITOR_SCREEN.height);
    expect(end.span * aspect).toBeLessThan(MONITOR_SCREEN.width);
    expect(end.span).toBeGreaterThan(0);
  },
);

test('reverse samples retrace exactly, invalid progress is finite and no animation queue exists', () => {
  const forward = [0, 0.2, 0.6, 1].map((progress) =>
    sampleMonitorPose(progress, 4, 1.6),
  );
  const reverse = [1, 0.6, 0.2, 0]
    .map((progress) => sampleMonitorPose(progress, 4, 1.6))
    .reverse();
  expect(reverse).toEqual(forward);
  expect(sampleMonitorPose(NaN, 4, 1).blend).toBe(0);
  expect(sampleMonitorPose(-1, 4, 1).blend).toBe(0);
  expect(sampleMonitorPose(2, 4, 1).blend).toBe(1);
});
