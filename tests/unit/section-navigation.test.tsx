/**
 * Wheel gestures cannot skip anchors, trap long copy or consume browser controls.
 * @packageDocumentation
 */
import { render, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useSectionNavigation } from '../../src/world/useSectionNavigation';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Mount three viewport-sized chapters and a mutable native scroll position.
 * @returns Scroll spy and input/timing controls for one route lifetime.
 */
function navigationFixture() {
  vi.stubGlobal('innerHeight', 900);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(
    <>
      {[0, 1, 2].map((index) => (
        <section
          key={index}
          className="world-section"
          data-index={index}
          style={{ scrollMarginTop: 0 }}
        />
      ))}
    </>,
  );
  for (const section of document.querySelectorAll<HTMLElement>(
    '.world-section',
  )) {
    const top = Number(section.dataset.index) * 900;
    vi.spyOn(section, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, top - scrollY, 1200, 900),
    );
  }
  const hook = renderHook(useSectionNavigation);
  /**
   * Dispatch cancelable, bubbling input just as a browser wheel target would.
   * @param options - Delta/modifier overrides for this gesture.
   * @returns Whether the route consumed this event.
   */
  function wheel(options: WheelEventInit = {}) {
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 1600,
      ...options,
    });
    document.body.dispatchEvent(event);
    return event.defaultPrevented;
  }
  return { clock, scroll, wheel, unmount: hook.unmount };
}

test('momentum stays consumed after scrollend, but a fresh gesture and reversal work', () => {
  const { clock, scroll, wheel } = navigationFixture();
  expect(wheel()).toBe(true);
  expect(scroll).toHaveBeenLastCalledWith({ top: 900, behavior: 'smooth' });
  vi.stubGlobal('scrollY', 900);
  window.dispatchEvent(new Event('scrollend'));
  clock.mockReturnValue(1050);
  expect(wheel()).toBe(true);
  expect(scroll).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(1400);
  expect(wheel()).toBe(true);
  expect(scroll).toHaveBeenLastCalledWith({ top: 1800, behavior: 'smooth' });
  clock.mockReturnValue(1420);
  expect(wheel({ deltaY: -120 })).toBe(true);
  expect(scroll).toHaveBeenLastCalledWith({ top: 900, behavior: 'smooth' });
});

test('browser modifiers, horizontal input and unmounted routes keep their wheel input', () => {
  const { scroll, wheel, unmount } = navigationFixture();
  expect(wheel({ ctrlKey: true })).toBe(false);
  expect(wheel({ deltaX: 2000 })).toBe(false);
  expect(scroll).not.toHaveBeenCalled();
  unmount();
  expect(wheel()).toBe(false);
});

test('a fresh gesture can read tall content after a previous anchor step', () => {
  const { clock, scroll, wheel } = navigationFixture();
  wheel();
  vi.stubGlobal('scrollY', 900);
  window.dispatchEvent(new Event('scrollend'));
  const section = document.querySelectorAll('.world-section')[1]!;
  vi.spyOn(section, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 900 - scrollY, 1200, 1800),
  );
  clock.mockReturnValue(1400);
  expect(wheel({ deltaY: 100 })).toBe(false);
  clock.mockReturnValue(1450);
  expect(wheel({ deltaY: 100 })).toBe(false);
  expect(scroll).toHaveBeenCalledTimes(1);
  // A large delta stops at the readable end, not past the following chapter.
  expect(wheel()).toBe(true);
  expect(scroll).toHaveBeenLastCalledWith({ top: 1800, behavior: 'instant' });
});
