/**
 * Bound wheel gestures to adjacent chapter stops without trapping oversized copy.
 * @packageDocumentation
 */
import { useEffect } from 'react';

/**
 * Native snapping handles touch/keys; wheel momentum cannot skip chapter anchors.
 * Allow browser zoom, horizontal gestures and nested scroll controls unchanged.
 * @returns No state; listeners and gesture timing belong to this route's lifetime.
 */
export function useSectionNavigation() {
  useEffect(() => {
    let lastWheel = -Infinity;
    let direction = 0;
    let consumed = false;
    let destination: number | null = null;
    let scrollIdle: ReturnType<typeof setTimeout> | undefined;
    /** Clear the queued stop when scrolling finishes or stalls. */
    function clearDestination() {
      destination = null;
      if (scrollIdle !== undefined) clearTimeout(scrollIdle);
      scrollIdle = undefined;
    }
    /** Wait for a quiet scroll interval before releasing the queued stop. */
    function scheduleScrollIdle() {
      if (scrollIdle !== undefined) clearTimeout(scrollIdle);
      scrollIdle = setTimeout(clearDestination, 200);
    }
    /**
     * Consume one vertical gesture, or allow native reading within a tall section.
     * @param event - Cancelable wheel input; modifier gestures remain browser-owned.
     */
    function onWheel(event: WheelEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
        !event.cancelable
      )
        return;
      const step = Math.sign(event.deltaY);
      if (!step) return;
      // An embedded scrolling control owns its input, not the surrounding chapter.
      for (
        let element = event.target instanceof Element ? event.target : null;
        element && element !== document.body;
        element = element.parentElement
      ) {
        if (
          element.matches(
            'input, textarea, select, [contenteditable="true"]',
          ) ||
          (/(auto|scroll)/.test(getComputedStyle(element).overflowY) &&
            element.scrollHeight > element.clientHeight)
        )
          return;
      }
      const now = performance.now();
      const continuing = now - lastWheel < 180;
      lastWheel = now;
      if (!continuing || direction !== step) consumed = false;
      if (continuing && direction === step && consumed) {
        event.preventDefault();
        return;
      }
      direction = step;
      const sections = [
        ...document.querySelectorAll<HTMLElement>('.world-section'),
      ];
      const positions = sections.map((section) =>
        Math.max(
          0,
          section.getBoundingClientRect().top +
            scrollY -
            parseFloat(getComputedStyle(section).scrollMarginTop),
        ),
      );
      let index = positions.reduce(
        (current, top, candidate) => (top <= scrollY + 2 ? candidate : current),
        0,
      );
      const section = sections[index];
      if (!section) return;
      const content =
        index === 0
          ? (section.querySelector('.world-section-inner') ?? section)
          : section;
      const bottom =
        content.getBoundingClientRect().bottom + scrollY - innerHeight;
      const reading =
        step > 0 ? scrollY < bottom - 2 : scrollY > positions[index]! + 2;
      if (destination === null && reading) {
        const limit = step > 0 ? bottom : positions[index]!;
        const pixels =
          event.deltaY *
          (event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? innerHeight
              : 1);
        if (Math.abs(pixels) > Math.abs(limit - scrollY)) {
          event.preventDefault();
          consumed = true;
          direction = step;
          window.scrollTo({ top: limit, behavior: 'instant' });
        }
        return;
      }
      // Opposite intent reverses an in-flight transition from its requested stop.
      if (destination !== null) index = destination;
      const next = Math.max(0, Math.min(sections.length - 1, index + step));
      if (next === index) return;
      const target = positions[next]!;
      if (Math.abs(target - scrollY) <= 2) {
        clearDestination();
        return;
      }
      event.preventDefault();
      direction = step;
      consumed = true;
      destination = next;
      window.scrollTo({
        top: target,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
      scheduleScrollIdle();
    }
    /** Release the in-flight target once native scrolling reaches its resting stop. */
    function onScrollEnd() {
      clearDestination();
    }
    /** Extend the fallback while native scroll events continue. */
    function onScroll() {
      if (destination !== null) scheduleScrollIdle();
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
      clearDestination();
    };
  }, []);
}
