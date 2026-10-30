/**
 * Accessible HTML boundary for automatic WebGL, motion controls and recovery.
 * @packageDocumentation
 */
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import introPoster from '../assets/intro/desktop-poster.png';
import { readMonitorFocus } from './workflow-focus';
import SceneLoadingScreen from './SceneLoadingScreen';

const LazyCanvas = lazy(() => import('./WorldCanvas'));
const WIDTH_MEDIA =
  '(min-width: 1200px), (min-width: 768px) and (min-height: 600px)';
const MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/** Select rendering resolution and initial motion without treating viewport size as a capability test. */
type ViewPolicy = 'desktop' | 'narrow' | 'reduced-motion';

/**
 * Subscribe to viewport/motion preference changes.
 * @param listener - React's snapshot invalidation callback.
 * @returns A cleanup that removes this preference listener.
 */
function subscribePolicy(listener: (event: MediaQueryListEvent) => void) {
  const queries = [
    window.matchMedia(WIDTH_MEDIA),
    window.matchMedia(MOTION_MEDIA),
  ];
  queries.forEach((query) => query.addEventListener('change', listener));
  return () =>
    queries.forEach((query) => query.removeEventListener('change', listener));
}

/**
 * Read the rendering budget and reduced-motion preference independently of camera travel.
 * @returns Desktop resolution, a compact rendering budget, or reduced motion.
 */
function readPolicy(): ViewPolicy {
  if (window.matchMedia(MOTION_MEDIA).matches) return 'reduced-motion';
  return window.matchMedia(WIDTH_MEDIA).matches ? 'desktop' : 'narrow';
}

/**
 * Update the optional inspection affordance only as the reading context changes.
 * @param listener - React snapshot invalidation callback.
 * @returns Native scroll/resize listener cleanup.
 */
function subscribeReading(listener: () => void) {
  window.addEventListener('scroll', listener, { passive: true });
  window.addEventListener('resize', listener);
  return () => {
    window.removeEventListener('scroll', listener);
    window.removeEventListener('resize', listener);
  };
}

/**
 * Keep the inspection control inside the project-reading sequence.
 * @returns Whether a project screen chapter is at the reading line.
 */
function readScreenContext() {
  return readMonitorFocus().progress > 0;
}

/**
 * Show the authored composition while the engine loads or is intentionally absent.
 * @returns A decorative illustration; the adjacent HTML describes the world.
 */
function StillView() {
  return (
    <div className="world-still">
      <img
        src={introPoster}
        alt=""
        width="1200"
        height="900"
        fetchPriority="high"
      />
    </div>
  );
}

/** Properties for a local lazy-engine error boundary. */
interface BoundaryProps {
  /** Canvas content whose module or renderer may fail. */
  children: ReactNode;
  /** Retain failure in the HTML owner even if media eligibility later changes. */
  onFailure: () => void;
}

/** Sticky failure state: recovery requires a deliberate page reload, not a loop. */
interface BoundaryState {
  /** Whether a module/render failure has replaced WebGL with its still view. */
  failed: boolean;
}

/** Catch module and renderer failures without removing readable chapter content. */
class WorldBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  /**
   * Switch the failed renderer to the illustrated alternative.
   * @returns A sticky failure marker until this boundary unmounts.
   */
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  /** Keep the owner's recovery status consistent with a module/renderer failure. */
  componentDidCatch() {
    this.props.onFailure();
  }

  /**
   * Keep the scene alternative and a useful status visible after engine failure.
   * @returns The safe fallback or the pending/live canvas subtree.
   */
  render() {
    if (this.state.failed) {
      return (
        <>
          <StillView />
          <p className="world-notice" role="status">
            3D could not load. The illustrated view and all content remain
            available.
          </p>
        </>
      );
    }
    return this.props.children;
  }
}

/**
 * Load 3D on every viewport, respecting reduced motion until deliberately resumed.
 * @returns One decorative viewport plus accessible motion controls and recovery.
 */
export default function WorldViewport() {
  const [inspect, setInspect] = useState(false);
  const [motionPaused, setMotionPaused] = useState(
    () => readPolicy() === 'reduced-motion',
  );
  const subscribeViewPolicy = useCallback(
    (listener: () => void) =>
      subscribePolicy((event) => {
        if (event.media === MOTION_MEDIA && event.matches)
          setMotionPaused(true);
        listener();
      }),
    [],
  );
  // Reset from the native reading event, not during render or after a stale
  // inspection has already reached the next visit's canvas.
  const subscribeInspection = useCallback(
    (listener: () => void) =>
      subscribeReading(() => {
        if (!readScreenContext()) setInspect(false);
        listener();
      }),
    [],
  );
  const screenContext = useSyncExternalStore(
    subscribeInspection,
    readScreenContext,
    () => false,
  );
  const policy = useSyncExternalStore(
    subscribeViewPolicy,
    readPolicy,
    () => 'narrow' as const,
  );
  const [skipped, setSkipped] = useState(false);
  const [lost, setLost] = useState(false);
  const [failed, setFailed] = useState(false);
  const onContextLost = useCallback(() => setLost(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const live = !skipped && !lost && !failed;
  const cameraTravel = policy !== 'reduced-motion';
  const canInspect = policy === 'desktop' && screenContext;

  return (
    <figure className="world-viewport" data-live={live}>
      {live && <SceneLoadingScreen onSkip={() => setSkipped(true)} />}
      <div className="world-stage">
        {live ? (
          <WorldBoundary onFailure={onFailure}>
            <Suspense
              fallback={
                <>
                  <StillView />
                  <p className="world-notice" role="status">
                    Loading 3D. The illustrated view is available meanwhile.
                  </p>
                </>
              }
            >
              <div className="world-canvas" aria-hidden="true">
                <LazyCanvas
                  onContextLost={onContextLost}
                  cameraTravel={cameraTravel}
                  dpr={policy === 'desktop' ? 2 : [1, 1.5]}
                  animateIntro={!motionPaused}
                  inspect={canInspect && inspect}
                />
              </div>
            </Suspense>
          </WorldBoundary>
        ) : (
          <StillView />
        )}
      </div>
      <figcaption>
        <span
          className={failed || lost ? 'world-visual-status' : 'visually-hidden'}
          role={failed || lost ? 'status' : undefined}
        >
          {failed
            ? '3D could not load. The illustrated view and all content remain available. Reload to retry.'
            : lost
              ? 'Graphics context lost. The illustration and all content remain available; reload to retry.'
              : live
                ? cameraTravel
                  ? policy === 'desktop'
                    ? '3D supports the reading. View screen offers an optional closer look during the project sections.'
                    : '3D follows the reading sections. Pause motion stops animation without removing the scene.'
                  : 'Stationary 3D view — camera travel is off for the reduced-motion preference.'
                : '3D loading skipped. The illustration and all content remain available. Reload to retry.'}
        </span>
        {live && (
          <details
            className="world-scene-options"
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              event.currentTarget.open = false;
              event.currentTarget.querySelector('summary')?.focus();
              event.stopPropagation();
            }}
          >
            <summary>Scene options</summary>
            <div className="world-scene-actions">
              {canInspect && (
                <button
                  type="button"
                  aria-pressed={inspect}
                  onClick={() => setInspect(!inspect)}
                >
                  {inspect ? 'Return to reading' : 'View screen'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMotionPaused(!motionPaused)}
              >
                {motionPaused ? 'Resume motion' : 'Pause motion'}
              </button>
            </div>
          </details>
        )}
      </figcaption>
    </figure>
  );
}
