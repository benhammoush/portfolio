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
  expect(document.querySelector('.world-brand')).toHaveTextContent(
    /^Guillaume Ammouche$/,
  );
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

test('emphasis matches every approved workflow, stack and outcome phrase', () => {
  render(<WorldPage />);
  const expected: Record<string, string[]> = {
    'world-profile': [
      'understanding the problem and its constraints',
      'across the application',
    ],
    'world-workflow': [
      'architecture and interface design',
      'tests',
      'CI/CD pipelines',
      'continuing to improve it through use',
    ],
    'world-apollo': [
      'bring everything into one place',
      'used and tested individually',
      'Python/FastAPI',
      'React/TypeScript',
      'keeping long-running analysis separate from API requests',
    ],
    'world-iris': [
      'Solana',
      'combining several providers',
      'handling external-service failures',
    ],
    'world-gateway': [
      'API',
      'without depending on a particular commerce platform',
      'signing stays in the customer’s wallet',
      'backend verifies transactions independently',
    ],
    'world-dripperz': [
      'Solidity',
      'supply limits, reservations and sale controls',
      'React/TypeScript',
      'dedicated desktop and mobile layouts',
      'AWS',
    ],
  };
  for (const [id, phrases] of Object.entries(expected)) {
    expect(
      [...document.querySelectorAll(`#${id} strong`)].map((e) => e.textContent),
    ).toEqual(phrases);
  }
  expect(document.querySelector('#world-hub strong')).toBeNull();
  expect(document.querySelector('#world-contact strong')).toBeNull();
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
