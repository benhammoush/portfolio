/**
 * Keyboard retargeting is local, loop-preserving and keeps hands above the key caps.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import {
  AnimationClip,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three';
import { refineKeyboardAnimation } from '../../src/world/keyboard-animation';

test('home-row corrections lift the wrist, soften finger travel and leave cached and mouse tracks untouched', () => {
  const clip = new AnimationClip('working', 24, [
    new VectorKeyframeTrack(
      'KeyboardUpperArm.position',
      [0, 24],
      [-0.095, 0.977, 0.44, -0.095, 0.977, 0.44],
    ),
    new VectorKeyframeTrack(
      'KeyboardForearm.position',
      [0, 24],
      [-0.128, 0.88, 0.285, -0.128, 0.88, 0.285],
    ),
    new VectorKeyframeTrack(
      'KeyboardPalm.position',
      [0, 24],
      [0.072, 0.864, 0.086, 0.072, 0.864, 0.086],
    ),
    new VectorKeyframeTrack(
      'KeyboardFinger0Tip.position',
      [0, 12, 24],
      [0.06, 0.861, 0.02, 0.06, 0.858, 0.02, 0.06, 0.861, 0.02],
    ),
    new QuaternionKeyframeTrack(
      'KeyboardForearm.quaternion',
      [0, 24],
      [0, 0, 0, 1, 0, 0, 0, 1],
    ),
    new VectorKeyframeTrack(
      'MousePalm.position',
      [0, 24],
      [0.5, 0.86, 0.19, 0.5, 0.86, 0.19],
    ),
  ]);
  const before = clip.tracks.map((track) => [...track.values]);
  const corrected = refineKeyboardAnimation(clip);
  expect(clip.tracks.map((track) => [...track.values])).toEqual(before);
  expect(corrected.duration).toBe(24);
  const palm = corrected.tracks.find(
    (track) => track.name === 'KeyboardPalm.position',
  )!;
  expect(palm.values[1]).toBeCloseTo(0.886);
  const tip = corrected.tracks.find(
    (track) => track.name === 'KeyboardFinger0Tip.position',
  )!;
  expect(Math.min(tip.values[1], tip.values[4])).toBeGreaterThan(0.873);
  expect(tip.values[1] - tip.values[4]).toBeLessThan(0.002);
  expect([...tip.values].slice(0, 3)).toEqual([...tip.values].slice(-3));
  expect([...corrected.tracks.at(-1)!.values]).toEqual(before.at(-1));
});
