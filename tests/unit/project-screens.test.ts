/**
 * Original artwork provenance, public-safe content and native-width crop behavior.
 * @packageDocumentation
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expect, test, vi } from 'vitest';
import { drawProjectTexture } from '../../src/world/project-texture';

for (const chapter of ['iris', 'gateway', 'dripperz'] as const) {
  test(`${chapter} SVG matches its original source and has no external or transactional content`, () => {
    expect(() =>
      execFileSync(
        process.execPath,
        ['scripts/export-workflow-art.mjs', `--${chapter}`, '--check'],
        { cwd: process.cwd(), stdio: 'pipe' },
      ),
    ).not.toThrow();
    const svg = readFileSync(
      `src/assets/${chapter}/${chapter}-screen.svg`,
      'utf8',
    );
    expect(svg).toContain('ILLUSTRATIVE CONCEPT');
    expect(svg).toContain('NOT LIVE');
    expect(svg).toContain('width="1040"');
    expect(svg).toContain('height="640"');
    expect(svg).not.toMatch(
      /<script|<foreignObject|(?:href|src)=["']https?:|0x[0-9a-fA-F]{40}/,
    );
    const drawImage = vi.fn();
    const strokeRect = vi.fn();
    const context = {
      drawImage,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect,
    } as unknown as CanvasRenderingContext2D;
    drawProjectTexture(context, new Image(), chapter, 1.8);
    expect(drawImage).toHaveBeenCalled();
    for (const args of drawImage.mock.calls) {
      expect(args[7] / args[3]).toBeCloseTo(args[8] / args[4], 12);
      expect(args[5] + args[7]).toBeLessThanOrEqual(1040);
      expect(args[6] + args[8]).toBeLessThanOrEqual(464);
    }
    expect(strokeRect).not.toHaveBeenCalled();
  });
}
