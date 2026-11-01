/**
 * Decorative typing never delays access to the full copy and owns all of its timers.
 * @packageDocumentation
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import TypingFacts from '../../src/world/TypingFacts';

const text = '29 · French · Coding since 2017';
const media = {
  matches: false,
  addEventListener: vi.fn<(event: string, listener: () => void) => void>(),
  removeEventListener: vi.fn(),
};
beforeEach(() => {
  vi.useFakeTimers();
  media.matches = false;
  media.addEventListener.mockClear();
  media.removeEventListener.mockClear();
  vi.stubGlobal('matchMedia', () => media);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('full readable copy exists immediately while the decorative text types once', () => {
  const { container, unmount } = render(<TypingFacts text={text} />);
  expect(container.querySelector('.landing-facts-readable')).toHaveTextContent(
    text,
  );
  const visual = container.querySelector('.landing-facts-text')!;
  expect(visual.parentElement).toHaveAttribute('aria-hidden', 'true');
  expect(visual).toHaveTextContent('');
  act(() => {
    vi.advanceTimersByTime(40);
  });
  expect(visual.textContent).toBe('2');
  act(() => {
    vi.advanceTimersByTime(10000);
  });
  expect(visual).toHaveTextContent(text);
  expect(
    screen.getByRole('region', { name: 'Personal details' }),
  ).toHaveAttribute('data-typing', 'complete');
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

test('reduced motion renders full text without starting a typing timer', () => {
  media.matches = true;
  const { container, unmount } = render(<TypingFacts text={text} />);
  expect(container.querySelector('.landing-facts-text')).toHaveTextContent(
    text,
  );
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

test('a newly enabled reduced-motion preference completes the line immediately', () => {
  const { container, unmount } = render(<TypingFacts text={text} />);
  act(() => {
    media.matches = true;
    media.addEventListener.mock.calls[0][1]();
  });
  expect(container.querySelector('.landing-facts-text')).toHaveTextContent(
    text,
  );
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

test('hiding the page finishes typing and unmount removes listeners and timers', () => {
  const { container, unmount } = render(<TypingFacts text={text} />);
  act(() => {
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(container.querySelector('.landing-facts-text')).toHaveTextContent(
    text,
  );
  expect(vi.getTimerCount()).toBe(0);
  unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith(
    'change',
    media.addEventListener.mock.calls[0][1],
  );
});

test('leaving during typing cancels the pending interval', () => {
  const { unmount } = render(<TypingFacts text={text} />);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
