/**
 * Native-width Apollo view; fixed original concepts, never live trading data.
 * @packageDocumentation
 */
import { conceptCrop, workspaceBox } from './monitor-workspace';

/**
 * Reflow market context, strategy and engineering concepts within one application.
 * @param context - Owned native monitor canvas.
 * @param image - Generated public-safe original Apollo SVG.
 * @param time - Active entry seconds; one highlight settles rather than looping.
 */
export function drawApolloTexture(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  time: number,
) {
  context.fillStyle = '#e6eee8';
  context.font = '600 24px system-ui, sans-serif';
  context.fillText('Apollo / Trading-platform engineering', 30, 111);
  workspaceBox(context, 26, 132, 594, 269, '#213541');
  context.fillStyle = '#bbd7cc';
  context.font = '18px system-ui, sans-serif';
  context.fillText('Market context', 47, 166);
  conceptCrop(context, image, [64, 213, 552, 195], [47, 184, 1]);
  workspaceBox(context, 640, 132, 374, 129, '#39334f');
  context.fillStyle = '#ddc9f4';
  context.font = '18px system-ui, sans-serif';
  context.fillText('Strategy', 662, 169);
  conceptCrop(context, image, [750, 230, 126, 126], [881, 149, 0.72]);
  context.fillStyle = '#c4b5d7';
  context.font = '14px system-ui, sans-serif';
  context.fillText('Explore · configure · review', 662, 210);
  workspaceBox(context, 640, 276, 374, 125, '#443a2e');
  context.fillStyle = '#ebce9a';
  context.font = '18px system-ui, sans-serif';
  context.fillText('Trading engine', 662, 309);
  conceptCrop(context, image, [64, 520, 571, 57], [661, 335, 0.58]);
  if (time > 0 && time < 1.8) {
    context.strokeStyle = '#b6d5c6';
    context.lineWidth = 2;
    context.strokeRect(
      time < 0.9 ? 27 : 641,
      time < 0.9 ? 133 : 277,
      time < 0.9 ? 592 : 372,
      time < 0.9 ? 267 : 123,
    );
  }
  context.fillStyle = '#aebfc6';
  context.font = '13px system-ui, sans-serif';
  context.fillText(
    'Illustrative market shapes    ·    Strategy automation    ·    Monitoring',
    30,
    434,
  );
}
