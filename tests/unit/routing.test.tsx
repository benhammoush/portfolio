/**
 * Exercise the minimal client route boundary without adding future product routes.
 * @packageDocumentation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import App from '../../src/App';

test('matches the home route', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: 'Portfolio foundation' }),
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
  fireEvent.click(
    screen.getByRole('link', { name: 'Return to the foundation' }),
  );
  expect(
    screen.getByRole('heading', { name: 'Portfolio foundation' }),
  ).toBeInTheDocument();
});
