/**
 * Accessible HTML boundary for lazy WebGL, user choice and illustrated fallbacks.
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
import introPoster from '../assets/intro/intro-scene.png';

const LazyCanvas = lazy(() => import('./WorldCanvas'));
const WIDTH_MEDIA = '(min-width: 768px)';
const MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/** Explain the automatic view policy without treating it as a graphics capability test. */
type ViewPolicy = 'desktop' | 'narrow' | 'reduced-motion';

/** A deliberate selection applies only to the viewport/motion policy it was made in. */
interface ViewChoice {
  /** Policy under which this choice was made. */
  policy: ViewPolicy;
  /** Whether to load real 3D or retain the vector illustration. */
  live: boolean;
}

/**
 * Subscribe to device/motion preference changes without loading the WebGL module.
 * @param listener - React's snapshot invalidation callback.
 * @returns A cleanup that removes this preference listener.
 */
function subscribePolicy(listener: () => void) {
  const queries = [
    window.matchMedia(WIDTH_MEDIA),
    window.matchMedia(MOTION_MEDIA),
  ];
  queries.forEach((query) => query.addEventListener('change', listener));
  return () =>
    queries.forEach((query) => query.removeEventListener('change', listener));
}

/**
 * Read whether automatic 3D is appropriate for this viewport and motion preference.
 * @returns The exact reason for stationary/default-static mode or desktop travel.
 */
function readPolicy(): ViewPolicy {
  if (window.matchMedia(MOTION_MEDIA).matches) return 'reduced-motion';
  return window.matchMedia(WIDTH_MEDIA).matches ? 'desktop' : 'narrow';
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
 * Default to an illustration on narrow/reduced-motion layouts, but let the user
 * explicitly request real stationary 3D without enabling camera travel.
 * @returns One decorative viewport plus an accessible mode control and status.
 */
export default function WorldViewport() {
  const policy = useSyncExternalStore(
    subscribePolicy,
    readPolicy,
    () => 'narrow' as const,
  );
  const [choice, setChoice] = useState<ViewChoice | null>(null);
  const [lost, setLost] = useState(false);
  const [failed, setFailed] = useState(false);
  const onContextLost = useCallback(() => setLost(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  const requested =
    choice?.policy === policy ? choice.live : policy === 'desktop';
  const live = requested && !lost && !failed;
  const cameraTravel = policy === 'desktop';

  return (
    <figure className="world-viewport" data-live={live}>
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
                />
              </div>
            </Suspense>
          </WorldBoundary>
        ) : (
          <StillView />
        )}
      </div>
      <figcaption>
        <span role={failed || lost ? 'status' : undefined}>
          {failed
            ? '3D could not load. The illustrated view and all content remain available. Reload to retry.'
            : lost
              ? 'Graphics context lost. Still view retained; reload to retry.'
              : live
                ? cameraTravel
                  ? '3D view — scroll the page to move the camera toward Iris.'
                  : 'Stationary 3D view — camera travel is off for this viewport or motion preference.'
                : policy === 'reduced-motion'
                  ? 'Still view: reduced motion is enabled. Optional 3D keeps the camera stationary.'
                  : policy === 'narrow'
                    ? 'Still view: this window is under 768 pixels wide. Optional 3D is stationary; widen the window for camera travel.'
                    : 'Still view. The complete story stays in HTML.'}
        </span>
        {!lost && !failed && (
          <button
            type="button"
            onClick={() => setChoice({ policy, live: !live })}
          >
            {live
              ? 'Use still view'
              : cameraTravel
                ? 'Enable 3D'
                : 'View stationary 3D'}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
