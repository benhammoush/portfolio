/**
 * Component coverage for the scaffold, not acceptance of the final portfolio UX.
 * @packageDocumentation
 */
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import FoundationPage from '../../src/FoundationPage';
import { APP_VERSION } from '../../src/appVersion';

test('shows foundation status and the runtime identity without project claims', () => {
  render(<FoundationPage />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Portfolio foundation' }),
  ).toBeInTheDocument();
  expect(screen.getByTestId('app-version')).toHaveTextContent(APP_VERSION);
  expect(screen.getByText(/are not implemented yet/)).toBeInTheDocument();
});
