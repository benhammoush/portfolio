/**
 * Reading-led monitor selection, independent of the background camera.
 * @packageDocumentation
 */

/** Shared desk target; only explicit inspection enlarges the decorative scene. */
export const WORKFLOW_POSE = {
  position: [2.55, 1.95, 5.7] as const,
  target: [0.26, 1.16, -0.445] as const,
};

/** Preserve the desk angle while a wider reading lens keeps the scene secondary. */
export const READING_POSE = {
  position: WORKFLOW_POSE.position,
  target: WORKFLOW_POSE.target,
};

/** Reading order shared by heading selection, artwork and the monitor's five tabs. */
export const MONITOR_CHAPTERS = [
  'workflow',
  'apollo',
  'iris',
  'gateway',
  'dripperz',
] as const;
/** Views within one illustrative computer workspace. */
export type MonitorChapter = (typeof MONITOR_CHAPTERS)[number];
/** Human-readable tab identities, independent of section IDs. */
export const MONITOR_LABELS: Record<MonitorChapter, string> = {
  workflow: 'Workflow',
  apollo: 'Apollo',
  iris: 'Iris',
  gateway: 'Crypto gateway',
  dripperz: 'Dripperz',
};

/**
 * Select a tab at the actual heading's reading line, with a small reverse deadband.
 * @param headingTops - Project headline positions relative to the viewport.
 * @param line - Reading line below navigation.
 * @param previous - Last selected tab, preventing jitter near the boundary.
 * @returns The requested workspace view, never a scroll-blocking animation queue.
 */
export function selectMonitorChapter(
  headingTops: Partial<Record<MonitorChapter, number>>,
  line: number,
  previous: MonitorChapter,
): MonitorChapter {
  let selected: MonitorChapter = 'workflow';
  const previousIndex = MONITOR_CHAPTERS.indexOf(previous);
  for (const [index, chapter] of MONITOR_CHAPTERS.entries()) {
    const top = headingTops[chapter];
    if (
      index > 0 &&
      top !== undefined &&
      Number.isFinite(top) &&
      top <= line + (index <= previousIndex ? 24 : -24)
    )
      selected = chapter;
  }
  return selected;
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
  const headingTops: Partial<Record<MonitorChapter, number>> = {};
  for (const chapter of MONITOR_CHAPTERS)
    headingTops[chapter] =
      document.getElementById(`world-${chapter}-title`)?.getBoundingClientRect()
        .top ?? Infinity;
  const workflow = headingTops.workflow!;
  const contact =
    document.getElementById('world-contact')?.getBoundingClientRect().top ??
    Infinity;
  const line = Math.max(360, window.innerHeight * 0.42);
  const chapter = selectMonitorChapter(headingTops, line, previous);
  return {
    progress: workflow <= line && contact > line ? 1 : 0,
    chapter,
    workspace: workflow <= line + (wasOpen ? 24 : -24),
  };
}
