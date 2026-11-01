/**
 * Exercise the public route boundary without loading the optional renderer.
 * @packageDocumentation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from '../../src/App';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

/** Observe the actual router location after declarative redirects.
 * @returns The pathname, search and hash used by the router.
 */
function RouteLocation() {
  const { pathname, search, hash } = useLocation();
  return (
    <output data-testid="route-location">
      {pathname}
      {search}
      {hash}
    </output>
  );
}

test.each([
  ['/about', 'About me'],
  ['/projects/apollo', 'Apollo'],
  ['/projects/iris', 'Iris'],
  ['/projects/gateway', 'Solana Payments'],
  ['/projects/dripperz', 'Dripperz'],
])('clean route %s opens its selected content', (path, heading) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: heading })).toHaveFocus();
});

test.each([
  ['/#world-about', '/about'],
  ['/#world-projects', '/about'],
  ['/#world-hub', '/'],
  ['/#world-apollo', '/projects/apollo'],
  ['/world?from=bookmark#world-iris', '/projects/iris?from=bookmark'],
  ['/world', '/'],
  ['/projects', '/about'],
  ['/about#expertise', '/profile#expertise'],
])('legacy location %s resolves to %s', (from, to) => {
  render(
    <MemoryRouter initialEntries={[from]}>
      <App />
      <RouteLocation />
    </MemoryRouter>,
  );
  expect(screen.getByTestId('route-location').textContent).toBe(to);
});

test.each(['/', '/world'])('matches the portfolio at %s', (path) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', {
      name: 'Guillaume Ammouche',
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
      name: 'Guillaume Ammouche',
    }),
  ).toBeInTheDocument();
});

test('retains the approved profile at the profile route', () => {
  render(
    <MemoryRouter initialEntries={['/profile']}>
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
    '/projects/unknown',
    '/projects/apollo/unknown',
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
