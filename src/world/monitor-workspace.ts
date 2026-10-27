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
 * @param duration - Active duration of the window, tab gesture or artwork playback.
 * @returns A bounded clock; inactive/invalid frames discard the timestamp baseline.
 */
export function advanceWorkspaceClock(
  clock: WorkspaceClock,
  now: number,
  active: boolean,
  duration = TAB_ACTION_SECONDS,
): WorkspaceClock {
  const elapsed = Math.min(duration, Math.max(0, clock.elapsed));
  if (!active || !Number.isFinite(now)) return { elapsed, previous: null };
  const delta = clock.previous === null ? 0 : Math.max(0, now - clock.previous);
  return {
    elapsed: Math.min(duration, elapsed + delta / 1000),
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
 * @param height - Native display height; older artwork coordinates stay undistorted.
 * @returns A uniform window transform; the closed origin is the launcher center.
 */
export function workspaceFrame(amount: number, height = 464) {
  return {
    scale: 0.08 + 0.92 * amount,
    left: 22.4 * (1 - amount),
    top: (401.44 + (height - 464) * 0.96) * (1 - amount),
  };
}

/**
 * Keep the launch target visible on the desktop before any pointer action.
 * @param context - Shared monitor canvas, not another texture.
 */
export function drawWorkspaceLauncher(context: CanvasRenderingContext2D) {
  const height = context.canvas?.height ?? 464;
  workspaceBox(context, 24, height - 66, 142, 44, '#293b48');
  workspaceBox(context, 36, height - 54, 18, 18, '#a5c5b0');
  context.font = '15px system-ui, sans-serif';
  context.fillStyle = '#e6eee8';
  context.fillText('Workspace', 66, height - 38);
}

/**
 * Paint a VS Code-inspired TypeScript editor, not a live or branded application.
 * @param context - The same native-width canvas used by the section workspace.
 */
export function drawDesktopScreen(context: CanvasRenderingContext2D) {
  const height = context.canvas?.height ?? 464;
  context.fillStyle = '#1e1e1e';
  context.fillRect(0, 0, 1040, height);
  context.fillStyle = '#323233';
  context.fillRect(0, 0, 1040, 29);
  context.font = '13px system-ui, sans-serif';
  context.fillStyle = '#cccccc';
  context.fillText(
    'File   Edit   Selection   View   Go   Run   Terminal',
    18,
    20,
  );
  context.fillText('portfolio — Guillaume', 760, 20);
  context.fillStyle = '#252526';
  context.fillRect(0, 29, 220, height - 99);
  context.fillStyle = '#333333';
  context.fillRect(0, 29, 42, height - 99);
  context.fillStyle = '#9aa7b1';
  context.font = '20px monospace';
  ['▱', '⌕', '⑂', '▷'].forEach((icon, i) =>
    context.fillText(icon, 11, 66 + i * 53),
  );
  context.font = '12px system-ui, sans-serif';
  context.fillStyle = '#cccccc';
  context.fillText('EXPLORER', 58, 53);
  [
    '⌄ PORTFOLIO',
    '  ⌄ src',
    '     components',
    '     world',
    '     App.tsx',
    '     main.tsx',
    '  package.json',
    '  README.md',
  ].forEach((file, i) => context.fillText(file, 55, 86 + i * 27));
  context.fillStyle = '#1e1e1e';
  context.fillRect(220, 29, 175, 32);
  context.fillStyle = '#4ec9b0';
  context.fillText('TS   App.tsx    ×', 237, 51);
  context.font = '16px monospace';
  const code = [
    ['#c586c0', "import { Portfolio } from './components';"],
    ['#6a9955', '// Build things. Keep learning.'],
    ['#569cd6', 'export default function App() {'],
    ['#c586c0', '  return ('],
    ['#4ec9b0', '    <Portfolio'],
    ['#9cdcfe', '      name="Guillaume Ammouche"'],
    ['#ce9178', '      focus="Full-stack development"'],
    ['#9cdcfe', '      curious={true}'],
    ['#4ec9b0', '    />'],
    ['#c586c0', '  );'],
    ['#d4d4d4', '}'],
  ];
  code.forEach(([color, line], i) => {
    context.fillStyle = '#858585';
    context.fillText(String(i + 1).padStart(2), 237, 90 + i * 24);
    context.fillStyle = color;
    context.fillText(line, 285, 90 + i * 24);
  });
  context.fillStyle = '#007acc';
  context.fillRect(0, height - 22, 1040, 22);
  context.font = '12px monospace';
  context.fillStyle = '#ffffff';
  context.fillText('main*   ✓ TypeScript    UTF-8', 185, height - 7);
  context.fillText('Ln 8, Col 21     TypeScript React', 735, height - 7);
  if (height > 464) {
    context.fillStyle = '#181818';
    context.fillRect(220, height - 145, 820, 123);
    context.font = '12px monospace';
    context.fillStyle = '#a9b6bf';
    context.fillText('TERMINAL', 243, height - 120);
    context.fillStyle = '#d4d4d4';
    context.fillText('~/portfolio $ npm run dev', 243, height - 91);
    context.fillStyle = '#8dc891';
    context.fillText('Local workspace ready.', 243, height - 66);
  }
  drawWorkspaceLauncher(context);
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
  const height = context.canvas?.height ?? 464;
  context.fillStyle = '#17232f';
  context.fillRect(0, 0, 1040, height);
  if (height > 464) {
    context.fillStyle = '#21313e';
    context.fillRect(0, 464, 1040, height - 464);
    context.font = '13px system-ui, sans-serif';
    context.fillStyle = '#b9c8cf';
    context.fillText('Project workspace', 24, 499);
    context.font = '12px monospace';
    context.fillText(
      'Guillaume / portfolio / ' + MONITOR_LABELS[selected],
      24,
      530,
    );
    context.fillText(
      'Illustrative project view · details in the page',
      24,
      557,
    );
  }
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
    const height = context.canvas?.height ?? 464;
    const travel = Math.min(1, elapsed / 0.4);
    const smooth = travel * travel * (3 - 2 * travel);
    const frame = workspaceFrame(windowAmount, height);
    const target =
      requested === 'open'
        ? [64, height - 44]
        : requested === 'close'
          ? [frame.left + 18 * frame.scale, frame.top + 15 * frame.scale]
          : [78 + MONITOR_CHAPTERS.indexOf(requested) * 164, 51];
    const x = 810 + (target[0] - 810) * smooth;
    const startY = height - 124;
    const y = startY + (target[1] - startY) * smooth;
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
