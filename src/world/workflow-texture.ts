/**
 * Native monitor layout recomposed from accepted Workflow vector concepts.
 * @packageDocumentation
 */
import { conceptCrop, workspaceBox } from './monitor-workspace';

/**
 * Limit uploads independently of frames caused by native scroll or resize.
 * @param now - Monotonic milliseconds.
 * @param previous - Last upload timestamp; negative infinity means not painted yet.
 * @returns Whether the shared 50 ms upload interval has elapsed.
 */
export function shouldPaintWorkflow(now: number, previous: number) {
  return (
    Number.isFinite(now) && (previous === -Infinity || now - previous >= 50)
  );
}

/**
 * Reflow the accepted concepts into the physical display, keeping shapes undistorted.
 * @param context - Owned 1040×464 monitor context.
 * @param image - Generated original Workflow SVG.
 * @param time - Brief active entry time; all concepts settle after 1.8 seconds.
 */
export function drawWorkflowTexture(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  time: number,
) {
  context.font = '600 24px system-ui, sans-serif';
  context.fillStyle = '#e6eee8';
  context.fillText('From interface to data', 30, 111);
  const panels = [
    {
      x: 26,
      label: 'Interface',
      color: '#142e3d',
      crop: [80, 270, 210, 145],
      at: [78, 185, 1],
    },
    {
      x: 369,
      label: 'Services',
      color: '#3a3453',
      crop: [395, 270, 250, 145],
      at: [397, 185, 1],
    },
    {
      x: 712,
      label: 'Data',
      color: '#49402f',
      crop: [790, 270, 155, 145],
      at: [790, 185, 1],
    },
  ] as const;
  panels.forEach(({ x, label, color, crop, at }, index) => {
    workspaceBox(context, x, 133, 302, 217, color);
    conceptCrop(context, image, crop, at);
    context.fillStyle = '#e0e9e6';
    context.font = '600 21px system-ui, sans-serif';
    context.fillText(label, x + 22, 167);
    if (
      time > 0 &&
      time < 1.8 &&
      index === Math.min(2, Math.floor(time / 0.6))
    ) {
      context.strokeStyle = '#b5d4c5';
      context.lineWidth = 2;
      context.strokeRect(x + 1, 134, 300, 215);
    }
  });
  context.font = '15px system-ui, sans-serif';
  context.fillStyle = '#bacbd3';
  context.fillText(
    'Understand    →    Design    →    Build    →    Check    →    Deliver',
    30,
    392,
  );
  context.font = '13px system-ui, sans-serif';
  context.fillStyle = '#a5c5b0';
  context.fillText(
    'Readable interfaces     ·     Clear boundaries     ·     Careful delivery',
    30,
    434,
  );
}
