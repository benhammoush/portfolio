/**
 * A decorative Canvas 2D globe, independent of navigation, typing and GPU support.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { drawTravelGlobe } from './travel-globe';

/** Animate only while visible, with explicit pause and live reduced-motion support.
 * @returns Half-cropped artwork and an accessible motion toggle.
 */
export default function TravelGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const toggle = toggleRef.current;
    if (!canvas || !toggle) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let paused = false;
    let elapsed = 0;
    let previous: number | undefined;
    let frame = 0;
    let width = 0,
      height = 0;

    /** Paint without coupling the high-frequency animation to React rendering. */
    function draw() {
      if (width && height) drawTravelGlobe(context!, width, height, elapsed);
    }
    /** Advance visible time at no more than 30 painted frames per second.
     * @param now - Browser animation timestamp in milliseconds.
     */
    function tick(now: number) {
      if (previous === undefined) previous = now;
      const delta = now - previous;
      if (delta >= 1000 / 30) {
        elapsed += Math.min(delta, 100);
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    /** Reconcile motion settings without replaying hidden or paused time. */
    function sync() {
      cancelAnimationFrame(frame);
      previous = undefined;
      toggle!.hidden = motion.matches;
      toggle!.textContent = paused ? 'Resume globe' : 'Pause globe';
      toggle!.setAttribute('aria-pressed', String(paused));
      draw();
      if (!paused && !motion.matches && !document.hidden && width && height)
        frame = requestAnimationFrame(tick);
    }
    /** Keep the backing canvas sharp without allocating an unbounded high-DPI surface. */
    function resize() {
      const bounds = canvas!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * density);
      canvas!.height = Math.round(height * density);
      context!.setTransform(density, 0, 0, density, 0, 0);
      sync();
    }
    /** Pause all globe motion independently of the typing animation. */
    function toggleMotion() {
      paused = !paused;
      sync();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    toggle.addEventListener('click', toggleMotion);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', resize);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      toggle.removeEventListener('click', toggleMotion);
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <>
      <div className="landing-globe-art" aria-hidden="true">
        <canvas className="landing-globe" ref={canvasRef} aria-hidden="true" />
      </div>
      <button
        className="landing-globe-motion"
        ref={toggleRef}
        type="button"
        hidden
      >
        Pause globe
      </button>
    </>
  );
}
