/**
 * The combined About me display bridges the physical monitor and accessible HTML.
 * @packageDocumentation
 */
import { copySection, WORKFLOW_STEPS } from './workspace-content';

/** Draw the green welcome at the monitor's native 16:9 aspect, without external assets.
 * @param context - The monitor's single owned canvas context.
 */
export function drawTerminalWelcome(context: CanvasRenderingContext2D): void {
  const { width, height } = context.canvas;
  const about = copySection('world-about');
  context.fillStyle = '#0b0e0c';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#101711';
  context.fillRect(0, 0, width, 34);
  context.fillStyle = '#70ec9a';
  context.font = '12px monospace';
  context.fillText('guillaume@portfolio:~/about', 24, 22);
  context.fillStyle = '#88a793';
  context.fillText('~/portfolio / about', 36, 76);
  context.fillStyle = '#e1ebe4';
  context.font = '25px monospace';
  context.fillText(about.blocks[0].text, 36, 121);
  context.fillStyle = '#70ec9a';
  context.fillRect(180, 102, 10, 22);
  context.fillStyle = '#b5c9bc';
  context.font = '12px monospace';
  context.fillText(about.blocks[1].text, 36, 156);
  context.strokeStyle = '#447f57';
  context.strokeRect(816, 100, 186, 42);
  context.fillStyle = '#70ec9a';
  context.fillText('Explore projects →', 834, 126);
  context.fillText('GitHub ↗    Résumé (PDF) ↗    Email ↗', 36, 185);
  WORKFLOW_STEPS.forEach((step, index) => {
    const y = 222 + index * 61;
    context.fillStyle = '#293c30';
    context.fillRect(36, y - 18, width - 72, 1);
    context.fillStyle = '#70ec9a';
    context.fillText(String(index + 1).padStart(2, '0'), 36, y + 5);
    context.fillStyle = '#d1e1d7';
    context.fillText(step.title, 78, y + 5);
    context.fillStyle = '#a0bfae';
    context.font = '11px monospace';
    context.fillText(step.description, 208, y + 5);
    context.font = '12px monospace';
  });
  context.fillStyle = '#101711';
  context.fillRect(0, height - 25, width, 25);
  context.fillStyle = '#70ec9a';
  context.font = '10px monospace';
  context.fillText('portfolio  about', 20, height - 9);
}
