/**
 * A connected camera tour through real model landmarks, driven by native scroll.
 * @packageDocumentation
 */
import type { Point } from './chapters';

/** World-space eye, focal point and framing span; no model/artwork is mutated. */
export interface ReadingPose {
  /** Camera eye in exported glTF coordinates: Y up, positive Z behind the character. */
  position: Point;
  /** Physical model landmark at the center of the scene viewport. */
  target: Point;
  /** Vertical world-space span inside the decorative scene's framing area. */
  viewHeight: number;
}

/** Native section stop paired with its physical camera waypoint. */
export interface PoseAnchor {
  /** Stable section fragment. */
  id: string;
  /** Absolute document offset after fixed-header clearance. */
  top: number;
  /** Physical eye/target and framing at the stop. */
  pose: ReadingPose;
}

/** One fixed monitor-corner composition throughout the project reading sequence. */
const PROJECT_POSE: ReadingPose = {
  position: [0.78, 1.65, 0.6],
  target: [0.76, 1.45, -0.46],
  viewHeight: 0.55,
};

/** Enter over the shoulder, hold through projects, then conclude beside the desk. */
export const SECTION_POSES: readonly (ReadingPose & { id: string })[] = [
  {
    id: 'world-profile',
    position: [-0.38, 1.45, 1.25],
    target: [0.1, 1.22, -0.444],
    viewHeight: 1.35,
  },
  { id: 'world-workflow', ...PROJECT_POSE },
  { id: 'world-apollo', ...PROJECT_POSE },
  { id: 'world-iris', ...PROJECT_POSE },
  { id: 'world-gateway', ...PROJECT_POSE },
  { id: 'world-dripperz', ...PROJECT_POSE },
  {
    id: 'world-contact',
    position: [1.8, 1.45, 2.6],
    target: [0.18, 0.97, 0.06],
    viewHeight: 2.25,
  },
];

/** Camera framing sampled between two native stops, without a queued animation. */
export interface ReadingFrame extends ReadingPose {
  /** Current stop. */
  from: string;
  /** Following stop, or the current stop at the route end. */
  to: string;
  /** Eased scroll progress; zero when paused or stationary at a stop. */
  blend: number;
}

/**
 * Blend the latest scroll position along the route, retracing exactly on reverse.
 * @param anchors - Ordered native section stops, remeasured after layout changes.
 * @param scroll - Absolute document offset; invalid values select the first stop.
 * @param animate - False selects the reached waypoint immediately without travel.
 * @returns A finite physical camera pose, including before/after-route fallbacks.
 */
export function sampleReadingPose(
  anchors: readonly PoseAnchor[],
  scroll: number,
  animate: boolean,
): ReadingFrame {
  const first = anchors[0];
  if (!first)
    return {
      ...SECTION_POSES[0]!,
      from: 'world-profile',
      to: 'world-profile',
      blend: 0,
    };
  const y = Number.isFinite(scroll) ? scroll : first.top;
  let index = 0;
  while (index + 1 < anchors.length && y >= anchors[index + 1]!.top - 1)
    index++;
  const from = anchors[index]!;
  const to = anchors[index + 1] ?? from;
  const distance = to.top - from.top;
  const t =
    animate && distance > 0 && y > from.top + 1
      ? Math.min(1, Math.max(0, (y - from.top) / distance))
      : 0;
  const blend = t * t * (3 - 2 * t);
  return {
    from: from.id,
    to: to.id,
    blend,
    position: from.pose.position.map(
      (value, axis) => value + (to.pose.position[axis]! - value) * blend,
    ) as unknown as Point,
    target: from.pose.target.map(
      (value, axis) => value + (to.pose.target[axis]! - value) * blend,
    ) as unknown as Point,
    viewHeight:
      from.pose.viewHeight +
      (to.pose.viewHeight - from.pose.viewHeight) * blend,
  };
}
