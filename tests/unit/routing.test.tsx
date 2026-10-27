/**
 * Exercise the public route boundary without loading the optional renderer.
 * @packageDocumentation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import App from '../../src/App';

// Routing tests own HTML selection, not GPU or browser media-query capabilities.
vi.mock('../../src/world/WorldViewport', () => ({
  /**
   * Exclude the browser-only renderer from route-selection unit fixtures.
   * @returns No canvas; route HTML remains under test.
   */
  default: () => null,
}));

test.each(['/', '/world'])('matches the portfolio at %s', (path) => {
  render(
    <MemoryRouter initialEntries={[path]}>
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

test('retired design and study routes use the normal not-found view', () => {
  for (const path of [
    '/design',
    '/hero-study',
    '/hero-study/immersive',
    '/scene-study',
    '/scene-study/workflow',
    '/scene-study/iris',
    '/screen-study/workflow',
    '/screen-study/apollo',
  ]) {
    const view = render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    view.unmount();
  }
});
