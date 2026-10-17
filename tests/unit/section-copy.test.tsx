/**
 * Approved copy is complete, plain text and reachable without scene interaction.
 * @packageDocumentation
 */
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import WorldPage from '../../src/world/WorldPage';
import { SECTION_COPY } from '../../src/world/section-copy';

vi.mock('../../src/world/WorldViewport', () => ({
  /**
   * Omit browser/GPU policy from this readable-content fixture.
   * @returns No canvas; all copy remains native HTML.
   */
  default: () => null,
}));

test('all six approved sections appear once and retain every approved content block', () => {
  render(<WorldPage />);
  expect(SECTION_COPY.map((section) => section.label)).toEqual([
    'Introduction',
    'Engineering workflow',
    'Apollo',
    'Iris',
    'Crypto gateway',
    'Dripperz',
  ]);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  for (const section of SECTION_COPY) {
    expect(document.getElementById(section.id)).toBeInTheDocument();
    for (const block of section.blocks) {
      expect(screen.getByText(block.text)).toBeInTheDocument();
    }
  }
  expect(screen.getByRole('link', { name: 'Explore my work' })).toHaveAttribute(
    'href',
    '#world-apollo',
  );
  expect(
    screen.queryByText(/Composition study\. The current object/),
  ).not.toBeInTheDocument();
});
