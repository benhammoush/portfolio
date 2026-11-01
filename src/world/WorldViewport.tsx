/**
 * Automatic WebGL, motion policy and recovery remain independent of workspace access.
 * @packageDocumentation
 */
import { Component, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import introPoster from '../assets/intro/desktop-poster.png';
import SceneLoadingScreen from './SceneLoadingScreen';

const LazyCanvas = lazy(() => import('./WorldCanvas'));
const WIDTH_MEDIA =
  '(min-width: 1200px), (min-width: 768px) and (min-height: 600px)';

/** Show the preserved room while graphics are loading, skipped or unavailable.
 * @returns A decorative image; workspace content never depends on this asset.
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

/** Graphics-only boundary inputs. */
interface BoundaryProps {
  /** Optional engine subtree. */
  children: ReactNode;
  /** Retain failure in the HTML owner. */
  onFailure: () => void;
}

/** Workspace coverage is independent of media policy. */
interface ViewportProps {
  /** Bypass the optional scene on user request or graphics failure. */
  onFinish: () => void;
}

/** Sticky, local renderer failure boundary; reload is the only graphics retry. */
class WorldBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  /** Replace failed WebGL without removing the workspace.
   * @returns Sticky failure state.
   */
  static getDerivedStateFromError() {
    return { failed: true };
  }
  /** Inform the accessible HTML owner of the terminal graphics failure. */
  componentDidCatch() {
    this.props.onFailure();
  }
  /** Render a safe still view or the optional renderer subtree.
   * @returns Local graphics content only.
   */
  render() {
    return this.state.failed ? <StillView /> : this.props.children;
  }
}

/** Mount graphics only for the initial arrival; all exits open HTML directly.
 * @param props - One-way content handoff.
 * @returns A bounded optional scene with an always-available skip action.
 */
export default function WorldViewport(props: ViewportProps) {
  const desktop = window.matchMedia(WIDTH_MEDIA).matches;
  return (
    <figure className="world-viewport" aria-label="Arrival animation">
      <SceneLoadingScreen onSkip={props.onFinish} />
      <div className="world-stage">
        <WorldBoundary onFailure={props.onFinish}>
          <Suspense fallback={<StillView />}>
            <div className="world-canvas" aria-hidden="true">
              <LazyCanvas
                onContextLost={props.onFinish}
                cameraTravel
                dpr={desktop ? 2 : [1, 1.5]}
                animateIntro
                workspaceOpen={false}
              />
            </div>
          </Suspense>
        </WorldBoundary>
      </div>
      <button
        type="button"
        className="monitor-skip-intro"
        onClick={props.onFinish}
      >
        Skip intro
      </button>
    </figure>
  );
}
