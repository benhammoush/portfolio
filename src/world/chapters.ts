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
    position: [0.1, 0.84, 7.14],
    target: [0.1, 0.8, 0],
    // Desk-height rear pullback; 2.5 / 0.7 keeps the scene approximately
    // 30% smaller than the original desk-height framing at the target plane.
    viewHeight: 2.5 / 0.7,
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
 * Begin camera travel as the gallery enters the opening viewport, not only after
 * the reader has scrolled past the introduction. Keep native anchor end framing.
 * @param scroll - Current document scroll offset in CSS pixels.
 * @param hubTop - First chapter's document top in CSS pixels.
 * @param irisTop - Second chapter's document top in CSS pixels.
 * @param viewportHeight - Visible viewport height in CSS pixels.
 * @returns Clamped camera progress with an earlier, viewport-relative start.
 */
export function cameraProgress(
  scroll: number,
  hubTop: number,
  irisTop: number,
  viewportHeight: number,
): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  const start = Math.max(0, hubTop - viewportHeight * 0.65);
  const end = irisTop - 120;
  // Native fragment scrolling can round a fractional CSS-pixel target. Normalize
  // that final pixel to its exact pose rather than leaving the chapter almost at rest.
  return chapterProgress(scroll >= end - 1 ? end : scroll, start, end);
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
