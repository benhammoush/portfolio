/**
 * A bounded, one-way arrival animation from the room to its monitor.
 * @packageDocumentation
 */
import { CHAPTERS } from './chapters';
import type { Point } from './chapters';
import { MONITOR_SCREEN } from './monitor-landmarks';
import { readSceneLoading, subscribeSceneLoading } from './scene-loading';

const SESSION_KEY = 'portfolio-intro-seen';
let progress = 0;
let seenWithoutStorage = false;

/** Bypass optional graphics for content links, reduced motion and this tab's repeat visits.
 * @returns Whether content should be available immediately.
 */
export function bypassEntry(): boolean {
  if (seenWithoutStorage) return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return seenWithoutStorage;
  }
}

/** Remember completion or skipping without making storage a requirement. */
export function rememberEntry(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    seenWithoutStorage = true;
    // Keep SPA visits one-way even when reload persistence is unavailable.
  }
}

/** A finite camera sample; span is the vertical world-space view at the target. */
export interface MonitorPose {
  /** Camera eye in model coordinates. */
  position: Point;
  /** Look-at point in model coordinates. */
  target: Point;
  /** Vertical view span in metres. */
  span: number;
  /** Eased approach fraction, from the room to the monitor. */
  blend: number;
}

/** Read animation progress without rerendering React on every frame.
 * @returns Zero through one, independent of document scrolling.
 */
export function readEntryProgress(): number {
  return progress;
}

/** Run four visible seconds after the first painted frame, with an eight-second loading ceiling.
 * @param complete - Open content on completion, timeout, Escape or reduced motion.
 * @returns Cleanup for frames, timeout, loading subscription and accessibility listeners.
 */
export function startEntry(complete: () => void): () => void {
  progress = 0;
  let frame = 0;
  let elapsed = 0;
  let last: number | null = null;
  let started = false;
  let finished = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** Hand control to HTML at most once. */
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    clearTimeout(deadline);
    complete();
  }
  /** Advance only while visible; hidden tabs do not consume the entrance.
   * @param time - Browser animation timestamp in milliseconds.
   */
  function tick(time: number) {
    if (finished) return;
    if (!document.hidden && last !== null) elapsed += time - last;
    last = document.hidden ? null : time;
    progress = Math.min(1, elapsed / 4000);
    document
      .querySelector<HTMLElement>('.monitor-page')
      ?.style.setProperty(
        '--entry-reveal',
        String(Math.max(0, Math.min(1, (progress - 0.9) / 0.1))),
      );
    if (progress === 1) finish();
    else frame = requestAnimationFrame(tick);
  }
  const deadline = window.setTimeout(finish, 8000);
  /** Begin only after the complete scene has painted, never from download percentage. */
  function ready() {
    if (started || finished || readSceneLoading().stage !== 'ready') return;
    started = true;
    clearTimeout(deadline);
    frame = requestAnimationFrame(tick);
  }
  /** Escape bypasses loading and animation.
   * @param event - Native keyboard input.
   */
  function key(event: KeyboardEvent) {
    if (event.key === 'Escape') finish();
  }
  /** A newly enabled reduced-motion preference bypasses remaining movement. */
  function reduce() {
    if (motion.matches) finish();
  }
  /** Reset the timing baseline across tab visibility changes. */
  function visibility() {
    last = null;
  }
  const unsubscribe = subscribeSceneLoading(ready);
  document.addEventListener('keydown', key);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', reduce);
  ready();
  return () => {
    finished = true;
    clearTimeout(deadline);
    cancelAnimationFrame(frame);
    unsubscribe();
    document.removeEventListener('keydown', key);
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', reduce);
    document
      .querySelector<HTMLElement>('.monitor-page')
      ?.style.removeProperty('--entry-reveal');
  };
}

/** Sample a camera path that passes left and above the character before aligning with the screen.
 * @param progress - Timed entrance fraction; invalid values retain the room.
 * @param heroSpan - Opening framing derived from the existing poster rectangle.
 * @param aspect - Viewport width divided by height.
 * @returns Camera and framing along the existing collision-free approach.
 */
export function sampleMonitorPose(
  progress: number,
  heroSpan: number,
  aspect: number,
): MonitorPose {
  const t = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const blend = t * t * (3 - 2 * t);
  const u = 1 - blend;
  const start = CHAPTERS[0];
  const controlA: Point = [-1.25, 1.9, 1];
  const controlB: Point = [-0.5, 1.55, -0.02];
  const end: Point = [0, MONITOR_SCREEN.y, -0.12];
  const screen: Point = [MONITOR_SCREEN.x, MONITOR_SCREEN.y, MONITOR_SCREEN.z];
  const position = start.position.map(
    (value, axis) =>
      u ** 3 * value +
      3 * u ** 2 * blend * controlA[axis] +
      3 * u * blend ** 2 * controlB[axis] +
      blend ** 3 * end[axis],
  ) as unknown as Point;
  const target = start.target.map(
    (value, axis) => value + (screen[axis] - value) * blend,
  ) as unknown as Point;
  const cover =
    Math.min(
      MONITOR_SCREEN.height,
      MONITOR_SCREEN.width / Math.max(0.1, aspect),
    ) * 0.97;
  return {
    position,
    target,
    span: heroSpan + (cover - heroSpan) * blend,
    blend,
  };
}
