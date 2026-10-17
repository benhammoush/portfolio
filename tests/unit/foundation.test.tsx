/**
 * Profile-shell content and native navigation contracts, not final launch acceptance.
 * @packageDocumentation
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import HomePage from '../../src/HomePage';
import { APP_VERSION } from '../../src/appVersion';

test('shows the approved identity, contact and native section links', () => {
  render(<HomePage />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Guillaume Ammouche' }),
  ).toBeInTheDocument();
  expect(screen.getByTestId('app-version')).toHaveTextContent(APP_VERSION);
  expect(screen.getByRole('link', { name: /Get in touch/ })).toHaveAttribute(
    'href',
    'mailto:guillaumeammouche@protonmail.com',
  );
  for (const name of ['About', 'Expertise', 'Contact']) {
    const link = screen.getByRole('link', { name });
    const target = link.getAttribute('href');
    expect(target).toBe(`#${name.toLowerCase()}`);
    expect(document.querySelector(target!)).toBeInTheDocument();
  }
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
    'href',
    '#main-content',
  );
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  expect(
    screen.queryByRole('link', { name: /resume/i }),
  ).not.toBeInTheDocument();
});
