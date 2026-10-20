/**
 * Reading-led monitor selection, independent of the background camera.
 * @packageDocumentation
 */

/** Optional close-up framing; the lens and reading target remain stable. */
export const WORKFLOW_POSE = {
  position: [2.55, 1.95, 5.7] as const,
  target: [0.26, 1.16, -0.445] as const,
};

/** Keep the monitor close behind the article; inspection only changes its presentation. */
export const READING_POSE = {
  position: WORKFLOW_POSE.position,
  target: WORKFLOW_POSE.target,
};

/** Accepted views within one illustrative computer workspace. */
export type MonitorChapter = 'workflow' | 'apollo';

/**
 * Damped projection travel follows the latest section without queuing transitions.
 * @param current - Present horizontal projection offset as a viewport fraction.
 * @param target - Requested column offset.
 * @param delta - Active frame seconds; hidden time is bounded out.
 * @param animate - Motion policy; static/paused changes resolve immediately.
 * @returns A finite settled offset with no perpetual demand-render tail.
 */
export function settleSceneColumn(
  current: number,
  target: number,
  delta: number,
  animate: boolean,
) {
  if (!animate) return target;
  const next =
    current +
    (target - current) * (1 - Math.exp(-Math.min(Math.max(delta, 0), 0.1) * 7));
  return Math.abs(next - target) < 0.0005 ? target : next;
}

/**
 * Place the shared scene opposite the section currently at the reading line.
 * @returns The scene column; the introduction/profile default to the right.
 */
export function readSceneSide(): 'left' | 'right' {
  const line = Math.max(360, window.innerHeight * 0.42);
  let side: 'left' | 'right' = 'right';
  for (const section of document.querySelectorAll(
    '.world-copy-section, .world-contact',
  )) {
    const heading = section.querySelector('h2');
    if (heading && heading.getBoundingClientRect().top <= line)
      side = section.classList.contains('world-copy-right') ? 'left' : 'right';
  }
  return side;
}

/**
 * Select a tab at the actual heading's reading line, with a small reverse deadband.
 * @param headingTop - Apollo headline top relative to the viewport.
 * @param line - Reading line below navigation.
 * @param previous - Last selected tab, preventing jitter near the boundary.
 * @returns The requested workspace view, never a scroll-blocking animation queue.
 */
export function selectMonitorChapter(
  headingTop: number,
  line: number,
  previous: MonitorChapter,
): MonitorChapter {
  if (!Number.isFinite(headingTop)) return 'workflow';
  return headingTop <= line + (previous === 'apollo' ? 24 : -24)
    ? 'apollo'
    : 'workflow';
}

/**
 * Read heading-led workspace context; this no longer controls automatic close-ups.
 * @param previous - Last requested tab for reverse-scroll hysteresis.
 * @param wasOpen - Last requested window state for the same reading-line deadband.
 * @returns Whether inspection is relevant and the requested tab.
 */
export function readMonitorFocus(
  previous: MonitorChapter = 'workflow',
  wasOpen = false,
) {
  const workflow = document
    .getElementById('world-workflow-title')
    ?.getBoundingClientRect();
  const apollo = document
    .getElementById('world-apollo-title')
    ?.getBoundingClientRect();
  const iris = document
    .getElementById('world-iris-title')
    ?.getBoundingClientRect();
  const line = Math.max(360, window.innerHeight * 0.42);
  const chapter = selectMonitorChapter(apollo?.top ?? Infinity, line, previous);
  return {
    progress:
      workflow && workflow.top <= line && (!iris || iris.top > line) ? 1 : 0,
    chapter,
    workspace: !!workflow && workflow.top <= line + (wasOpen ? 24 : -24),
  };
}
