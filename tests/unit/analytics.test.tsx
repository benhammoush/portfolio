/**
 * Track canonical portfolio navigation once, without query strings or fragments.
 * @packageDocumentation
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from '../../src/App';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  document
    .querySelectorAll('script[data-sdkn="@vercel/analytics/react"]')
    .forEach((script) => script.remove());
  delete window.va;
  delete window.vaq;
  delete window.vam;
  vi.unstubAllGlobals();
});

test('the SDK injects once and receives pathname-only SPA page views', () => {
  render(
    <MemoryRouter initialEntries={['/about?private=not-for-analytics#section']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    document.querySelectorAll('script[data-sdkn="@vercel/analytics/react"]'),
  ).toHaveLength(1);
  expect(
    document.querySelector('script[data-sdkn="@vercel/analytics/react"]'),
  ).toHaveAttribute('data-disable-auto-track', '1');
  expect(window.vaq).toEqual([
    ['pageview', { route: '/about', path: '/about' }],
  ]);
  fireEvent.click(screen.getByRole('link', { name: 'Iris' }));
  expect(window.vaq).toEqual([
    ['pageview', { route: '/about', path: '/about' }],
    ['pageview', { route: '/projects/iris', path: '/projects/iris' }],
  ]);
  expect(
    document.querySelectorAll('script[data-sdkn="@vercel/analytics/react"]'),
  ).toHaveLength(1);
});

test('legacy links record their canonical destination, not the redirect URL', () => {
  render(
    <MemoryRouter initialEntries={['/world?source=bookmark#world-iris']}>
      <App />
    </MemoryRouter>,
  );
  expect(window.vaq).toEqual([
    ['pageview', { route: '/projects/iris', path: '/projects/iris' }],
  ]);
});

test.each([
  ['/projects', '/about'],
  ['/world', '/'],
  ['/projects/', '/about'],
  ['/world/', '/'],
  ['/PROJECTS?source=bookmark', '/about'],
  ['/WORLD//?source=bookmark', '/'],
])('redirect-only entry %s records only %s', (entry, path) => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
    </MemoryRouter>,
  );
  expect(window.vaq).toEqual([['pageview', { route: path, path }]]);
});
