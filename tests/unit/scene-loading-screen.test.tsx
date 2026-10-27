/**
 * Minimal loader markup keeps measured download progress separate from preparation.
 * @packageDocumentation
 */
import { afterEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SceneLoadingScreen from '../../src/world/SceneLoadingScreen';
import * as loading from '../../src/world/scene-loading';
import type { SceneLoadingState } from '../../src/world/scene-loading';

afterEach(() => vi.restoreAllMocks());

test.each<{
  state: SceneLoadingState;
  label: string;
  value: string | null;
}>([
  {
    state: { stage: 'engine', loaded: 0, total: 0 },
    label: 'Loading 3D…',
    value: null,
  },
  {
    state: { stage: 'download', loaded: 640, total: 1000 },
    label: '64%',
    value: '64',
  },
  {
    state: { stage: 'download', loaded: 640, total: 0 },
    label: 'Loading 3D…',
    value: null,
  },
  {
    state: { stage: 'preparing', loaded: 1000, total: 1000 },
    label: 'Preparing 3D…',
    value: null,
  },
])(
  'minimal $state.stage markup shows $label without invented completion',
  ({ state, label, value }) => {
    vi.spyOn(loading, 'readSceneLoading').mockReturnValue(state);
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(
      <SceneLoadingScreen onSkip={vi.fn()} />,
    );
    expect(container.querySelector('#scene-loading-title')?.textContent).toBe(
      'Loading experience',
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe(label);
    expect(container.querySelector('progress')?.getAttribute('value')).toBe(
      value,
    );
    expect(container.querySelector('progress')?.getAttribute('max')).toBe(
      '100',
    );
    expect(container.querySelectorAll('svg, h1, h2')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelector('button')?.textContent).toBe(
      'Continue without 3D',
    );
  },
);

test('the ready scene does not retain a loading dialog', () => {
  vi.spyOn(loading, 'readSceneLoading').mockReturnValue({
    stage: 'ready',
    loaded: 1000,
    total: 1000,
  });
  expect(renderToStaticMarkup(<SceneLoadingScreen onSkip={vi.fn()} />)).toBe(
    '',
  );
});
