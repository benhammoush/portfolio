/**
 * Optional graphics expose a single exit and a bounded mobile rendering budget.
 * @packageDocumentation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import WorldViewport from '../../src/world/WorldViewport';

/** Minimal graphics inputs observed by the mock. */
interface CanvasProps {
  /** Desktop or bounded compact resolution. */
  dpr: number | [number, number];
  /** Terminal graphics failure opens HTML. */
  onContextLost: () => void;
}

vi.mock('../../src/world/SceneLoadingScreen', () => ({
  /** Leave modal behavior to browser coverage.
   * @returns No loading overlay.
   */
  default: () => null,
}));
vi.mock('../../src/world/WorldCanvas', () => ({
  /** Expose the rendering budget without a GPU.
   * @param props - Scene settings and terminal graphics callback.
   * @returns Observable graphics settings and a failure trigger.
   */
  default: (props: CanvasProps) => (
    <button
      data-testid="scene"
      data-dpr={String(props.dpr)}
      onClick={props.onContextLost}
    >
      Lose graphics
    </button>
  ),
}));
afterEach(() => vi.unstubAllGlobals());

test.each([true, false])(
  'arrival uses the expected resolution budget; desktop=%s',
  async (desktop) => {
    vi.stubGlobal('matchMedia', () => ({ matches: desktop }));
    const finish = vi.fn();
    render(<WorldViewport onFinish={finish} />);
    const scene = await screen.findByTestId('scene');
    expect(scene).toHaveAttribute('data-dpr', desktop ? '2' : '1,1.5');
    expect(screen.queryByText('Scene options')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
    expect(finish).toHaveBeenCalledOnce();
    fireEvent.click(scene);
    expect(finish).toHaveBeenCalledTimes(2);
  },
);
