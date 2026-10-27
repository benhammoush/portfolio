/**
 * Initial scene-loading screen with truthful byte progress and an immediate escape.
 * @packageDocumentation
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { readSceneLoading, subscribeSceneLoading } from './scene-loading';

/** Loading can always be skipped without removing readable portfolio content. */
interface SceneLoadingScreenProps {
  /** Retain the still view instead of waiting for optional graphics. */
  onSkip: () => void;
}

/**
 * Use a native modal to keep focus out of content hidden behind the loading screen.
 * @param props - Parent-owned opt-out action.
 * @returns Initial loading dialog, removed permanently once the first scene is ready.
 */
export default function SceneLoadingScreen(props: SceneLoadingScreenProps) {
  const state = useSyncExternalStore(
    subscribeSceneLoading,
    readSceneLoading,
    readSceneLoading,
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = state.stage !== 'ready';
  useEffect(() => {
    const element = dialog.current;
    if (!pending || !element) return;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, [pending]);
  if (!pending) return null;
  const downloading = state.stage === 'download';
  const percent =
    downloading && state.total > 0
      ? Math.min(100, Math.floor((state.loaded / state.total) * 100))
      : undefined;
  return (
    <dialog
      ref={dialog}
      className="world-loading-screen"
      aria-labelledby="scene-loading-title"
      onCancel={(event) => {
        event.preventDefault();
        props.onSkip();
      }}
    >
      <div className="world-loading-content">
        <p id="scene-loading-title">Loading experience</p>
        <progress
          aria-label={
            downloading ? '3D model download' : '3D scene preparation'
          }
          max={100}
          value={percent}
        />
        <p className="world-loading-stage" role="status">
          {percent !== undefined
            ? `${percent}%`
            : state.stage === 'preparing'
              ? 'Preparing 3D…'
              : 'Loading 3D…'}
        </p>
        <button type="button" onClick={props.onSkip}>
          Continue without 3D
        </button>
      </div>
    </dialog>
  );
}
