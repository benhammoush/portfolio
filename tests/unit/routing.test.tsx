/**
 * Exercise the minimal client route boundary without adding future product routes.
 * @packageDocumentation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import App from '../../src/App';
import { SECTION_COPY } from '../../src/world/section-copy';

// Routing tests own HTML selection, not GPU or browser media-query capabilities.
vi.mock('../../src/world/WorldViewport', () => ({
  /**
   * Exclude the browser-only renderer from route-selection unit fixtures.
   * @returns No canvas; route HTML remains under test.
   */
  default: () => null,
}));

test('matches the home route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', {
      name: 'Hi, I’m Guillaume, a full-stack developer',
    }),
  ).toBeInTheDocument();
});

test('unknown route offers client navigation back to the foundation', () => {
  render(
    <MemoryRouter initialEntries={['/not-a-portfolio-route']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: 'Page not found' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Return to home' }));
  expect(
    screen.getByRole('heading', {
      name: 'Hi, I’m Guillaume, a full-stack developer',
    }),
  ).toBeInTheDocument();
});

test('selects the independent, original Apollo artwork review', () => {
  render(
    <MemoryRouter initialEntries={['/screen-study/apollo']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Strategy, engine, perspective.',
  );
  expect(
    screen.getByText(/No private source or screenshots are used/),
  ).toBeInTheDocument();
  expect(document.querySelectorAll('[data-concept]')).toHaveLength(4);
});

test('Workflow artwork stays readable and still when browser motion APIs are absent', () => {
  vi.stubGlobal('matchMedia', undefined);
  vi.stubGlobal('IntersectionObserver', undefined);
  try {
    render(
      <MemoryRouter initialEntries={['/screen-study/workflow']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'One workspace, from idea to delivery.',
    );
    expect(
      screen.getByText('Still artwork: reduced motion is enabled.'),
    ).toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});

test('retains the approved profile at the about route', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: 'Guillaume Ammouche' }),
  ).toBeInTheDocument();
});

for (const [path, direction] of [
  ['/hero-study', '01 / Editorial'],
  ['/hero-study/immersive', '02 / Immersive'],
]) {
  test(`matches the independent static hero study at ${path}`, () => {
    render(
      <MemoryRouter initialEntries={[path!]}>
        <App />
      </MemoryRouter>,
    );
    const introduction = SECTION_COPY[0]!;
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      introduction.blocks[0]!.text,
    );
    expect(screen.getByText(introduction.blocks[1]!.text)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: direction! })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByText(/Static artwork · Not live 3D/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
}

for (const [path, sectionId, cueCount] of [
  ['/scene-study', 'world-hub', 0],
  ['/scene-study/workflow', 'world-workflow', 1],
  ['/scene-study/iris', 'world-iris', 1],
] as const) {
  test(`matches the quiet section study at ${path}`, () => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    const section = SECTION_COPY.find(
      (candidate) => candidate.id === sectionId,
    )!;
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      section.blocks[0]!.text,
    );
    const paragraphs =
      sectionId === 'world-hub'
        ? section.blocks.slice(1, 2)
        : section.blocks.slice(1);
    for (const block of paragraphs) {
      expect(screen.getByText(block.text)).toBeInTheDocument();
    }
    expect(document.querySelectorAll('.scene-cue-art image')).toHaveLength(1);
    expect(document.querySelectorAll('[data-cue]')).toHaveLength(cueCount);
    expect(document.querySelector('.scene-cue-art')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      screen.getByText(/Schematic cues only, not product UI/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Read this section/ }),
    ).toHaveAttribute('href', `/#${sectionId}`);
  });
}
