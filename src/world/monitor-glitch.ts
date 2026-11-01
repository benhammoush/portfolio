/**
 * Bounded, decorative signal glitches; random values never affect application state.
 * @packageDocumentation
 */
import type { CSSProperties } from 'react';

/** CSS custom properties used only by an individual visual burst. */
export type SignalStyle = CSSProperties &
  Record<`--${string}`, string | number>;
/** One bounded animation pattern and its disconnected display fragments. */
export interface SignalPattern {
  /** Active milliseconds before cleanup; entry is slightly longer than switching. */
  duration: number;
  /** Tear offsets and bands applied to the workspace root. */
  style: SignalStyle;
  /** Localized decorative rectangles, never full-screen flashes. */
  fragments: SignalStyle[];
}

/** Generate a new constrained pattern on each explicit content change.
 * @param entry - Whether the monitor has just opened.
 * @param random - Injectable zero-to-one visual randomness for deterministic tests.
 * @returns Finite coordinates, duration and seven small fragments.
 */
export function createSignalPattern(
  entry: boolean,
  random = Math.random,
): SignalPattern {
  /** Sample within the supported visual range.
   * @param min - Lower bound.
   * @param max - Upper bound.
   * @returns A finite sample even if an injected random source is invalid.
   */
  function between(min: number, max: number): number {
    const value = random();
    return (
      min +
      (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5) *
        (max - min)
    );
  }
  const duration = Math.round(between(entry ? 780 : 500, entry ? 1080 : 800));
  const direction = between(0, 1) < 0.5 ? -1 : 1;
  const a = between(10, 43),
    b = between(49, 85);
  return {
    duration,
    style: {
      '--glitch-duration': `${duration}ms`,
      '--tear-top-a': `${a}%`,
      '--tear-bottom-a': `${a + between(0.6, 3)}%`,
      '--tear-top-b': `${b}%`,
      '--tear-bottom-b': `${b + between(0.5, 2.4)}%`,
      '--tear-shift-a': `${direction * between(7, 15)}px`,
      '--tear-shift-b': `${-direction * between(5, 12)}px`,
      '--tear-shift-c': `${direction * between(2, 6)}px`,
      '--tear-skew-a': `${direction * between(0.2, 0.6)}deg`,
      '--tear-skew-b': `${-direction * between(0.1, 0.4)}deg`,
    },
    fragments: Array.from({ length: 7 }, (_, index) => {
      const x = between(0, 78);
      return {
        '--noise-x': `${x}%`,
        '--noise-y': `${between(8, 89)}%`,
        '--noise-width': `${between(6, Math.min(34, 99 - x))}%`,
        '--noise-height': `${between(1, index < 2 ? 11 : 4)}px`,
        '--noise-shift-a': `${direction * between(5, 27)}px`,
        '--noise-shift-b': `${-direction * between(3, 18)}px`,
        '--noise-delay': `${between(0, duration * 0.2)}ms`,
        '--noise-duration': `${between(duration * 0.4, duration * 0.7)}ms`,
        '--noise-opacity': between(0.2, 0.48),
        '--noise-color': index % 3 === 0 ? '#68ccdb' : '#70ec9a',
      };
    }),
  };
}

/** Play one non-blocking burst, with complete timeout, preference and visibility cleanup.
 * @param root - Mounted workspace element, never the full page or loading screen.
 * @param entry - Whether to use the longer entrance pattern.
 * @returns Idempotent cleanup, also used when a new selection interrupts this burst.
 */
export function playMonitorGlitch(
  root: HTMLElement,
  entry: boolean,
): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = root.querySelector<HTMLElement>('.monitor-fragments');
  let timer: number | undefined;
  /** Stop pending decoration without changing content or focus. */
  function stop() {
    window.clearTimeout(timer);
    root.removeAttribute('data-glitch');
    layer?.replaceChildren();
  }
  /** Hidden time is never replayed; the cursor also pauses until visible. */
  function visibility() {
    root.toggleAttribute('data-hidden', document.hidden);
    if (document.hidden) stop();
  }
  /** Honor a newly enabled reduced-motion preference immediately. */
  function preference() {
    if (media.matches) stop();
  }
  visibility();
  document.addEventListener('visibilitychange', visibility);
  media.addEventListener('change', preference);
  if (!media.matches && !document.hidden && layer) {
    const pattern = createSignalPattern(entry);
    for (const [key, value] of Object.entries(pattern.style))
      root.style.setProperty(key, String(value));
    for (const style of pattern.fragments) {
      const fragment = document.createElement('span');
      for (const [key, value] of Object.entries(style))
        fragment.style.setProperty(key, String(value));
      layer.append(fragment);
    }
    root.setAttribute('data-glitch', 'active');
    timer = window.setTimeout(stop, pattern.duration + 90);
  }
  return () => {
    stop();
    document.removeEventListener('visibilitychange', visibility);
    media.removeEventListener('change', preference);
  };
}
