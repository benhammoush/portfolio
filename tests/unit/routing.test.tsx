/**
 * Exercise the minimal client route boundary without adding future product routes.
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

test('matches the home route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: 'Hi, I’m Guillaume.' }),
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
    screen.getByRole('heading', { name: 'Hi, I’m Guillaume.' }),
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
