/**
 * Camera progress is clamped to native chapter positions, never scroll ownership.
 * @packageDocumentation
 */
import { expect, test } from 'vitest';
import {
  CHAPTERS,
  chapterProgress,
  interpolateAxis,
} from '../../src/world/chapters';

test('normalizes chapter positions and clamps either end', () => {
  expect(chapterProgress(0, 100, 500)).toBe(0);
  expect(chapterProgress(100, 100, 500)).toBe(0);
  expect(chapterProgress(300, 100, 500)).toBe(0.5);
  expect(chapterProgress(700, 100, 500)).toBe(1);
});

test('rejects degenerate or nonfinite layout positions', () => {
  expect(chapterProgress(200, 100, 100)).toBe(0);
  expect(chapterProgress(200, 500, 100)).toBe(0);
  expect(chapterProgress(NaN, 100, 500)).toBe(0);
  expect(chapterProgress(200, 100, Infinity)).toBe(0);
});

test('shared poses preserve exact endpoints and linear coordinates', () => {
  const start = CHAPTERS[0];
  const end = CHAPTERS[1];
  expect(new Set(CHAPTERS.map((chapter) => chapter.id)).size).toBe(
    CHAPTERS.length,
  );
  for (const axis of [0, 1, 2] as const) {
    expect(interpolateAxis(start.position, end.position, 0, axis)).toBe(
      start.position[axis],
    );
    expect(interpolateAxis(start.position, end.position, 1, axis)).toBe(
      end.position[axis],
    );
    expect(interpolateAxis(start.target, end.target, 0.5, axis)).toBeCloseTo(
      (start.target[axis] + end.target[axis]) / 2,
      12,
    );
  }
});
