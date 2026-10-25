/**
 * Shared article surface preserves content and native semantics.
 * @packageDocumentation
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Card } from '../../src/design-system';

afterEach(cleanup);

it('preserves article semantics, content and caller-owned attributes', () => {
  render(
    <Card aria-label="Example" id="example" className="extra">
      <h3>Supplied heading</h3>
      <p>Supplied content</p>
    </Card>,
  );
  const card = screen.getByRole('article', { name: 'Example' });
  expect(card).toHaveClass('card', 'extra');
  expect(card).toHaveAttribute('id', 'example');
  expect(
    screen.getByRole('heading', { name: 'Supplied heading' }),
  ).toBeVisible();
  expect(screen.getByText('Supplied content')).toBeVisible();
});
