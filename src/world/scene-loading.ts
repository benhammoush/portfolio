/**
 * Small HTML-side loading state; importing it never downloads the 3D engine.
 * @packageDocumentation
 */

/** Measured transfer bytes and the current, non-estimated preparation stage. */
export interface SceneLoadingState {
  /** Engine download, model transfer, mesh preparation or a completed first frame. */
  stage: 'engine' | 'download' | 'preparing' | 'ready';
  /** Transferred model bytes, not a simulated scene percentage. */
  loaded: number;
  /** Known transfer length, or zero when the server cannot provide it. */
  total: number;
}

let state: SceneLoadingState = { stage: 'engine', loaded: 0, total: 0 };
const listeners = new Set<() => void>();

/**
 * Subscribe from the HTML loader without coupling it to the canvas renderer.
 * @param listener - React snapshot listener.
 * @returns Subscription cleanup.
 */
export function subscribeSceneLoading(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the stable snapshot shared by the lazy import, transfer and first frame.
 * @returns Current immutable-by-convention loading snapshot.
 */
export function readSceneLoading(): SceneLoadingState {
  return state;
}

/**
 * Publish actual transfer progress, remaining indeterminate when length is unknown.
 * @param loaded - Bytes transferred so far.
 * @param total - Known total bytes, or zero.
 */
export function reportSceneDownload(loaded: number, total: number): void {
  if (state.stage === 'ready') return;
  const length = Number.isFinite(total) ? Math.max(0, total) : 0;
  const bytes = Number.isFinite(loaded) ? Math.max(0, loaded) : 0;
  state = {
    stage: length > 0 && bytes >= length ? 'preparing' : 'download',
    loaded: bytes,
    total: length,
  };
  listeners.forEach((listener) => listener());
}

/** Mark decoding complete without pretending that GPU setup has already finished. */
export function prepareScene(): void {
  if (state.stage === 'ready') return;
  state = { ...state, stage: 'preparing' };
  listeners.forEach((listener) => listener());
}

/** Complete loading only after a mounted scene has drawn its first frame. */
export function finishSceneLoading(): void {
  if (state.stage === 'ready') return;
  state = { ...state, stage: 'ready' };
  listeners.forEach((listener) => listener());
}
