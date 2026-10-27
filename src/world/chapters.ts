/**
 * Shared HTML chapter identities and camera poses for the bounded hub/Iris study.
 * @packageDocumentation
 */

/** A world-space point in the prototype's arbitrary scene units, not a budget. */
export type Point = readonly [number, number, number];

/** One readable chapter and the camera composition associated with its anchor. */
interface Chapter {
  /** Native HTML fragment identifier. */
  id: string;
  /** Human-readable navigation label. */
  label: string;
  /** Perspective camera location in scene units. */
  position: Point;
  /** The world point the camera looks toward. */
  target: Point;
  /** Vertical span at the look-at plane, adjusted to preserve responsive framing. */
  viewHeight: number;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'world-hub',
    label: 'Introduction',
    position: [0.1, 0.74, 7.14],
    target: [0.1, 0.7, 0],
    // A slightly wider opening; Contact reuses this complete view, not just its eye.
    viewHeight: 4.4,
  },
  {
    id: 'world-iris',
    label: 'Iris',
    position: [15.8, 3.4, 5.5],
    target: [11.45, 1.55, -0.45],
    viewHeight: 4.4,
  },
];

/**
 * Normalize progress between chapter tops without scroll interception or snapping.
 * @param scroll - Current document scroll offset in CSS pixels.
 * @param start - First chapter's document top in CSS pixels.
 * @param end - Second chapter's document top in CSS pixels.
 * @returns Finite progress clamped to zero through one, including degenerate layouts.
 */
export function chapterProgress(
  scroll: number,
  start: number,
  end: number,
): number {
  if (![scroll, start, end].every(Number.isFinite) || end <= start) return 0;
  return Math.min(1, Math.max(0, (scroll - start) / (end - start)));
}

/**
 * Interpolate a camera point without allocations in the render loop.
 * @param start - The wide hub pose.
 * @param end - The closer Iris pose.
 * @param progress - Normalized chapter progress.
 * @param axis - Which coordinate to interpolate.
 * @returns The coordinate at the requested progress.
 */
export function interpolateAxis(
  start: Point,
  end: Point,
  progress: number,
  axis: 0 | 1 | 2,
): number {
  if (progress <= 0) return start[axis];
  if (progress >= 1) return end[axis];
  return start[axis] + (end[axis] - start[axis]) * progress;
}
