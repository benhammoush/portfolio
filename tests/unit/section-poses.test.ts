/**
 * Physical camera waypoints interpolate reversibly and preserve stationary policies.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import {
  SECTION_POSES,
  sampleReadingPose,
} from '../../src/world/section-poses';

/** Synthetic native stops keep pose mathematics independent of browser layout. */
const anchors = SECTION_POSES.map((pose, index) => ({
  id: pose.id,
  top: (index + 1) * 1000,
  pose,
}));

test('each native stop selects its physical camera waypoint', () => {
  for (const anchor of anchors) {
    const frame = sampleReadingPose(anchors, anchor.top, true);
    expect(frame).toMatchObject({
      from: anchor.id,
      position: anchor.pose.position,
      target: anchor.pose.target,
      viewHeight: anchor.pose.viewHeight,
      blend: 0,
    });
    expect(
      Math.hypot(...frame.position.map((v, i) => v - frame.target[i]!)),
    ).toBeGreaterThan(0.5);
    expect(frame.viewHeight).toBeGreaterThan(0);
  }
  expect(sampleReadingPose(anchors, 9000, true).position).toEqual([
    1.8, 1.45, 2.6,
  ]);
});
test('the About view stays fixed from About through Dripperz', () => {
  expect(SECTION_POSES.map((p) => p.id)).toEqual([
    'world-profile',
    'world-workflow',
    'world-apollo',
    'world-iris',
    'world-gateway',
    'world-dripperz',
    'world-contact',
  ]);
  expect(SECTION_POSES[0]!.position[0]).toBeLessThan(0);
  expect(SECTION_POSES[0]!.position[1]).toBeGreaterThan(1.4);
  expect(SECTION_POSES[1]!.position).toEqual(SECTION_POSES[0]!.position);
  expect(SECTION_POSES[1]!.target).toEqual([0.1, 1.22, -0.444]);
  const workflow = SECTION_POSES[1]!;
  for (let y = 2000; y <= 6000; y += 125) {
    expect(sampleReadingPose(anchors, y, true)).toMatchObject({
      position: workflow.position,
      target: workflow.target,
      viewHeight: workflow.viewHeight,
    });
  }
});
test('scroll blending retraces the same route without queuing missed movements', () => {
  const middle = sampleReadingPose(anchors, 6500, true);
  expect(middle.blend).toBe(0.5);
  expect(middle.target[0]).toBeCloseTo(0.14, 12);
  expect(middle.viewHeight).toBeCloseTo(1.8, 12);
  expect(sampleReadingPose(anchors, 6800, true).target[0]).toBeGreaterThan(
    middle.target[0],
  );
  expect(sampleReadingPose(anchors, 6200, true).target[0]).toBeLessThan(
    middle.target[0],
  );
  expect(sampleReadingPose(anchors, 6500, true)).toEqual(middle);
});
test('pause and invalid offsets choose finite reached waypoints immediately', () => {
  expect(sampleReadingPose(anchors, 2500, false)).toMatchObject({
    from: 'world-workflow',
    blend: 0,
    target: SECTION_POSES[1]!.target,
  });
  expect(sampleReadingPose(anchors, 1999.5, false).from).toBe('world-workflow');
  expect(sampleReadingPose(anchors, NaN, true)).toEqual(
    sampleReadingPose(anchors, 1000, true),
  );
  expect(sampleReadingPose([], 0, true).position).toEqual(
    SECTION_POSES[0]!.position,
  );
});
