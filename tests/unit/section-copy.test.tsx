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
  expect(screen.getByRole('heading', { name: 'About me' })).toBeInTheDocument();
  expect(document.querySelector('.world-copy-right')).toBeNull();
  for (const section of SECTION_COPY) {
    expect(document.getElementById(section.id)).toBeInTheDocument();
    if (section.id !== 'world-hub') {
      expect(
        screen.getByRole('heading', { level: 2, name: section.label }),
      ).toBeInTheDocument();
    }
    for (const block of section.blocks) {
      expect(document.body).toHaveTextContent(block.text);
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

test('project emphasis is limited to selected individual words', () => {
  render(<WorldPage />);
  const emphasized = [
    ...document.querySelectorAll('.world-copy-section strong'),
  ].map((word) => word.textContent!.toLowerCase());
  expect(emphasized).toEqual(
    expect.arrayContaining([
      'trading',
      'backtesting',
      'solana',
      'caching',
      'security',
      'verification',
      'solidity',
      'aws',
    ]),
  );
  expect(emphasized.every((word) => !/\s/.test(word))).toBe(true);
});

test('the reading-first chapter retains its expressive lead and unboxed approved prose', () => {
  render(<WorldPage />);
  const apollo = document.getElementById('world-apollo')!;
  expect(apollo.querySelector('h2')).toHaveTextContent('Apollo');
  expect(apollo.querySelector('.world-section-lead')).toHaveTextContent(
    'From strategy automation to a full-stack trading platform.',
  );
  expect(apollo.querySelector('.world-summary-contribution')).toBeNull();
  expect(
    apollo.querySelectorAll(
      '.world-section-inner > p:not(.world-eyebrow, .world-section-lead)',
    ),
  ).toHaveLength(2);
  expect(
    screen.getByRole('heading', {
      level: 3,
      name: 'How I like to work',
      hidden: true,
    }),
  ).toBeInTheDocument();
});

test('section snapping belongs only to the mounted world route', () => {
  const { unmount } = render(<WorldPage />);
  expect(document.documentElement).toHaveClass('world-snap');
  expect(
    [...document.querySelectorAll('.world-section')].map(
      (section) => section.id,
    ),
  ).toEqual([
    'world-hub',
    'world-profile',
    'world-workflow',
    'world-apollo',
    'world-iris',
    'world-gateway',
    'world-dripperz',
    'world-contact',
  ]);
  unmount();
  expect(document.documentElement).not.toHaveClass('world-snap');
});
