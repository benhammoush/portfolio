/**
 * One native-aspect illustrative workspace, not a slideshow or a live application.
 * @packageDocumentation
 */
import type { MonitorChapter } from './workflow-focus';
import { MONITOR_CHAPTERS, MONITOR_LABELS } from './workflow-focus';

/** Brief tab action; the shell persists while only the selected view is replaced. */
export const TAB_ACTION_SECONDS = 0.85;

/** A short window transition's active clock, independent of renderer throughput. */
export interface WorkspaceClock {
  /** Bounded action seconds already consumed. */
  elapsed: number;
  /** Last eligible frame in milliseconds; null seeds a fresh or resumed clock. */
  previous: number | null;
}

/**
 * Let sparse visible frames finish a short action without counting suspended time.
 * The caller clears previous on visibility/policy changes and direction reversals.
 * @param clock - Current active seconds and last eligible frame timestamp.
 * @param now - Monotonic frame timestamp in milliseconds.
 * @param active - Whether this frame permits the window transition to advance.
 * @returns A bounded clock; inactive/invalid frames discard the timestamp baseline.
 */
export function advanceWorkspaceClock(
  clock: WorkspaceClock,
  now: number,
  active: boolean,
): WorkspaceClock {
  const elapsed = Math.min(TAB_ACTION_SECONDS, Math.max(0, clock.elapsed));
  if (!active || !Number.isFinite(now)) return { elapsed, previous: null };
  const delta = clock.previous === null ? 0 : Math.max(0, now - clock.previous);
  return {
    elapsed: Math.min(TAB_ACTION_SECONDS, elapsed + delta / 1000),
    previous: now,
  };
}

/**
 * Open or close the application only after the deliberate pointer click.
 * @param from - Current visible window amount, retained when direction reverses.
 * @param open - Latest requested window state.
 * @param elapsed - Active action seconds, excluding hidden and paused time.
 * @returns Smooth zero-to-one window amount; a static result uses the full duration.
 */
export function workspaceWindow(from: number, open: boolean, elapsed: number) {
  const phase = Math.min(
    1,
    Math.max(0, (elapsed - 0.4) / (TAB_ACTION_SECONDS - 0.4)),
  );
  const smooth = phase * phase * (3 - 2 * phase);
  return from + ((open ? 1 : 0) - from) * smooth;
}

/**
 * Expand an opaque app window from the launcher instead of crossfading two screens.
 * @param amount - Zero-to-one window amount.
 * @returns A uniform window transform; the closed origin is the launcher center.
 */
export function workspaceFrame(amount: number) {
  return {
    scale: 0.08 + 0.92 * amount,
    left: 22.4 * (1 - amount),
    top: 401.44 * (1 - amount),
  };
}

/**
 * Keep the launch target visible on the desktop before any pointer action.
 * @param context - Shared monitor canvas, not another texture.
 */
export function drawWorkspaceLauncher(context: CanvasRenderingContext2D) {
  workspaceBox(context, 24, 398, 142, 44, '#293b48');
  workspaceBox(context, 36, 410, 18, 18, '#a5c5b0');
  context.font = '15px system-ui, sans-serif';
  context.fillStyle = '#e6eee8';
  context.fillText('Workspace', 66, 426);
}

/**
 * Paint a quiet, original OS-like desktop and an already-open portfolio window.
 * This is decorative UI, not a branded operating system or an interactive app.
 * @param context - The same native-width canvas used by the section workspace.
 */
export function drawDesktopScreen(context: CanvasRenderingContext2D) {
  context.fillStyle = '#3c5665';
  context.fillRect(0, 0, 1040, 464);
  context.fillStyle = '#2c4351';
  context.fillRect(0, 0, 1040, 29);
  context.font = '600 14px system-ui, sans-serif';
  context.fillStyle = '#e2eae6';
  context.fillText('Desktop', 24, 20);
  context.font = '12px system-ui, sans-serif';
  context.fillStyle = '#bdcdd0';
  context.fillText('Personal workspace', 900, 20);
  workspaceBox(context, 24, 46, 992, 330, '#203541');
  workspaceBox(context, 24, 46, 992, 37, '#314957');
  ['#d39a8d', '#d7bf87', '#90b9a6'].forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(44 + index * 17, 65, 5, 0, Math.PI * 2);
    context.fill();
  });
  context.font = '14px system-ui, sans-serif';
  context.fillStyle = '#dce6e4';
  context.fillText('Portfolio', 123, 70);
  workspaceBox(context, 38, 98, 147, 262, '#293f4c');
  workspaceBox(context, 49, 111, 125, 35, '#415d6a');
  context.fillStyle = '#e1ebe5';
  context.font = '14px system-ui, sans-serif';
  context.fillText('Overview', 64, 133);
  context.fillStyle = '#b7c9cd';
  context.fillText('Projects', 64, 180);
  context.fillText('Workflow', 64, 222);
  context.fillStyle = '#e5ece7';
  context.font = '600 28px system-ui, sans-serif';
  context.fillText('Portfolio', 210, 127);
  context.fillStyle = '#aebfc7';
  context.font = '14px system-ui, sans-serif';
  context.fillText('A place to explore my work', 210, 153);
  workspaceBox(context, 210, 177, 452, 166, '#335464');
  workspaceBox(context, 230, 200, 118, 120, '#86b5c4');
  workspaceBox(context, 367, 200, 271, 51, '#abc9b3');
  workspaceBox(context, 367, 268, 124, 52, '#bfa6d6');
  workspaceBox(context, 509, 268, 129, 52, '#d6ba87');
  workspaceBox(context, 681, 177, 314, 166, '#3d3853');
  context.fillStyle = '#c4abe4';
  context.beginPath();
  context.arc(780, 257, 48, 0, Math.PI * 2);
  context.fill();
  workspaceBox(context, 847, 209, 111, 96, '#9f8abc');
  drawWorkspaceLauncher(context);
  // Other dock icons are abstract, with no invented OS branding or live status.
  [191, 238, 285].forEach((x, index) => {
    workspaceBox(
      context,
      x,
      404,
      34,
      34,
      ['#83a9bd', '#c2a7cd', '#cfb685'][index]!,
    );
  });
}

/**
 * Resolve the visible tab during a reversible, interruptible computer action.
 * @param from - View visible before the action.
 * @param to - Latest reading-led request.
 * @param elapsed - Active seconds since that request, excluding hidden/paused time.
 * @returns Visible content tab; direct/static changes never wait for a gesture.
 */
export function workspaceTab(
  from: MonitorChapter,
  to: MonitorChapter,
  elapsed: number,
) {
  return elapsed < 0.4 ? from : to;
}

/**
 * Draw a small rounded workspace panel using the accepted concept palette.
 * @param context - Owned canvas context.
 * @param x - Left edge.
 * @param y - Top edge.
 * @param width - Width in native screen pixels.
 * @param height - Height in native screen pixels.
 * @param color - Palette fill.
 */
export function workspaceBox(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, 10);
  context.fill();
}

/**
 * Recompose accepted vector concepts at their original aspect ratio, without outer frames.
 * @param context - Owned native-width monitor canvas.
 * @param image - Generated original concept SVG.
 * @param source - Source rectangle in the approved art.
 * @param destination - Top-left and uniform scale; never nonuniform stretching.
 */
export function conceptCrop(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: readonly [number, number, number, number],
  destination: readonly [number, number, number],
) {
  const [x, y, width, height] = source;
  const [left, top, scale] = destination;
  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    left,
    top,
    width * scale,
    height * scale,
  );
}

/**
 * Paint persistent desktop chrome, tabs and an intentional pointer action.
 * @param context - Shared 1040×464 canvas.
 * @param selected - Currently visible view.
 */
export function drawWorkspaceShell(
  context: CanvasRenderingContext2D,
  selected: MonitorChapter,
) {
  context.fillStyle = '#17232f';
  context.fillRect(0, 0, 1040, 464);
  context.fillStyle = '#293b48';
  context.fillRect(0, 0, 1040, 29);
  ['#d39a8d', '#d7bf87', '#90b9a6'].forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(18 + index * 16, 15, 4, 0, Math.PI * 2);
    context.fill();
  });
  context.font = '12px system-ui, sans-serif';
  context.fillStyle = '#c3d0d7';
  context.fillText('Guillaume / Concept workspace', 82, 19);
  context.fillStyle = '#21313e';
  context.fillRect(0, 29, 1040, 42);
  for (const [index, chapter] of MONITOR_CHAPTERS.entries()) {
    const label = MONITOR_LABELS[chapter];
    const left = 20 + index * 164;
    if (selected === chapter)
      workspaceBox(context, left, 34, 154, 32, '#3b5060');
    context.fillStyle = selected === chapter ? '#f1f5f3' : '#aebec9';
    context.font = '16px system-ui, sans-serif';
    context.fillText(label, left + 17, 56);
  }
  context.fillStyle = '#aebec9';
  context.font = '11px system-ui, sans-serif';
  context.fillText('ILLUSTRATIVE · NOT LIVE DATA', 815, 19);
}

/**
 * Paint the deliberate cursor above the content, matching the authored mouse gesture.
 * @param context - Owned monitor context.
 * @param requested - Destination tab, application launcher or close button.
 * @param elapsed - Active gesture time.
 * @param windowAmount - Visible window amount when its close control was targeted.
 */
export function drawWorkspacePointer(
  context: CanvasRenderingContext2D,
  requested: MonitorChapter | 'open' | 'close',
  elapsed: number,
  windowAmount = 1,
) {
  if (elapsed < TAB_ACTION_SECONDS) {
    const travel = Math.min(1, elapsed / 0.4);
    const smooth = travel * travel * (3 - 2 * travel);
    const frame = workspaceFrame(windowAmount);
    const target =
      requested === 'open'
        ? [64, 420]
        : requested === 'close'
          ? [frame.left + 18 * frame.scale, frame.top + 15 * frame.scale]
          : [78 + MONITOR_CHAPTERS.indexOf(requested) * 164, 51];
    const x = 810 + (target[0]! - 810) * smooth;
    const y = 340 + (target[1]! - 340) * smooth;
    context.save();
    context.translate(x, y);
    context.fillStyle = '#fbfaf4';
    context.strokeStyle = '#17232f';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, 23);
    context.lineTo(6, 17);
    context.lineTo(12, 27);
    context.lineTo(16, 24);
    context.lineTo(10, 15);
    context.lineTo(19, 15);
    context.closePath();
    context.fill();
    context.stroke();
    if (elapsed >= 0.4 && elapsed < 0.65) {
      context.strokeStyle = '#b8d9cf';
      context.beginPath();
      context.arc(0, 0, 11 + (elapsed - 0.4) * 35, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }
}
