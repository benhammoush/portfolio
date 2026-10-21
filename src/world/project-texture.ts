/**
 * Native-width compositions of the three original public-safe project illustrations.
 * @packageDocumentation
 */
import { conceptCrop } from './monitor-workspace';
import { MONITOR_LABELS } from './workflow-focus';
import type { MonitorChapter } from './workflow-focus';

/**
 * Reflow original panels without stretching their proportions or adding live values.
 * @param context - The single shared monitor canvas.
 * @param image - Locally generated original SVG artwork.
 * @param chapter - New project tab whose panels are being composed.
 * @param time - Bounded entry time; the frame highlight settles without looping.
 */
export function drawProjectTexture(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  chapter: Exclude<MonitorChapter, 'workflow' | 'apollo'>,
  time: number,
) {
  const dripperz = chapter === 'dripperz';
  context.fillStyle = dripperz ? '#191525' : '#14272d';
  context.fillRect(0, 71, 1040, 393);
  context.fillStyle = dripperz
    ? '#c1f26b'
    : chapter === 'iris'
      ? '#7edac9'
      : '#8cc8f4';
  context.font = '600 24px system-ui, sans-serif';
  context.fillText(
    `${MONITOR_LABELS[chapter]} / ${chapter === 'iris' ? 'Public-chain explorer' : dripperz ? 'Mint experience' : 'Portable checkout'}`,
    30,
    111,
  );
  if (chapter === 'iris') {
    conceptCrop(context, image, [36, 153, 968, 51], [26, 132, 1]);
    conceptCrop(context, image, [36, 225, 576, 260], [26, 197, 0.95]);
    conceptCrop(context, image, [632, 225, 372, 260], [632, 184, 1]);
  } else if (chapter === 'gateway') {
    conceptCrop(context, image, [36, 202, 577, 334], [26, 145, 0.88]);
    conceptCrop(context, image, [645, 155, 359, 440], [672, 128, 0.72]);
    context.font = '13px system-ui, sans-serif';
    context.fillStyle = '#bdced7';
    context.fillText(
      'Wallet-side signing · Independent backend verification',
      30,
      459,
    );
  } else {
    conceptCrop(context, image, [36, 155, 584, 354], [26, 133, 0.88]);
    conceptCrop(context, image, [644, 155, 360, 354], [674, 133, 0.88]);
    context.font = '13px system-ui, sans-serif';
    context.fillStyle = '#c5b9db';
    context.fillText(
      'Original portfolio art · Ethereum contracts · No real minting',
      30,
      459,
    );
  }
  if (time > 0 && time < 1.8) {
    context.strokeStyle = dripperz
      ? '#c1f26b'
      : chapter === 'iris'
        ? '#7edac9'
        : '#8cc8f4';
    context.lineWidth = 2;
    context.strokeRect(26, 127, 988, 318);
  }
}
