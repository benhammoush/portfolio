/**
 * Native-scroll close-up boundaries, invalid layout and accepted artwork provenance.
 * @packageDocumentation
 */
import { expect, test, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  readMonitorFocus,
  WORKFLOW_POSE,
  selectMonitorChapter,
  readSceneSide,
  settleSceneColumn,
} from '../../src/world/workflow-focus';
import {
  conceptCrop,
  workspaceTab,
  TAB_ACTION_SECONDS,
  workspaceWindow,
  workspaceFrame,
  drawDesktopScreen,
  advanceWorkspaceClock,
} from '../../src/world/monitor-workspace';
import { shouldPaintWorkflow } from '../../src/world/workflow-texture';

test('heading selection has a reverse deadband rather than outer-section switching', () => {
  expect(selectMonitorChapter(400, 378, 'workflow')).toBe('workflow');
  expect(selectMonitorChapter(354, 378, 'workflow')).toBe('apollo');
  expect(selectMonitorChapter(380, 378, 'apollo')).toBe('apollo');
  expect(selectMonitorChapter(403, 378, 'apollo')).toBe('workflow');
  expect(selectMonitorChapter(NaN, 378, 'apollo')).toBe('workflow');
  expect(WORKFLOW_POSE.position[0]).toBeGreaterThan(WORKFLOW_POSE.target[0]);
});

test('alternating sections place the shared scene opposite the active card', () => {
  const section = document.createElement('section');
  section.className = 'world-copy-section world-copy-right';
  const heading = document.createElement('h2');
  section.append(heading);
  document.body.append(section);
  const bounds = vi.spyOn(heading, 'getBoundingClientRect');
  try {
    bounds.mockReturnValue(new DOMRect(0, 1000, 100, 40));
    expect(readSceneSide()).toBe('right');
    bounds.mockReturnValue(new DOMRect(0, 120, 100, 40));
    expect(readSceneSide()).toBe('left');
    section.classList.remove('world-copy-right');
    expect(readSceneSide()).toBe('right');
  } finally {
    bounds.mockRestore();
    section.remove();
  }
});

test('column travel moves continuously, reverses from its current position and settles', () => {
  const first = settleSceneColumn(-0.25, 0.25, 1 / 60, true);
  expect(first).toBeGreaterThan(-0.25);
  expect(first).toBeLessThan(0.25);
  const reverse = settleSceneColumn(first, -0.25, 1 / 60, true);
  expect(reverse).toBeLessThan(first);
  expect(reverse).toBeGreaterThan(-0.25);
  let value = first;
  for (let frame = 0; frame < 120; frame += 1)
    value = settleSceneColumn(value, 0.25, 1 / 60, true);
  expect(value).toBe(0.25);
  expect(settleSceneColumn(-0.25, 0.25, 0.01, false)).toBe(0.25);
});

test('one tab action keeps the old view until the click and supports an immediate static result', () => {
  expect(workspaceTab('workflow', 'apollo', 0.39)).toBe('workflow');
  expect(workspaceTab('workflow', 'apollo', 0.4)).toBe('apollo');
  expect(workspaceTab('apollo', 'workflow', 0.4)).toBe('workflow');
  expect(workspaceTab('workflow', 'apollo', TAB_ACTION_SECONDS)).toBe('apollo');
});

test('the application opens after its click and reverses from its current amount', () => {
  expect(workspaceWindow(0, true, 0.39)).toBe(0);
  expect(workspaceWindow(0, true, 0.4)).toBe(0);
  expect(workspaceWindow(0, true, TAB_ACTION_SECONDS)).toBe(1);
  const partial = workspaceWindow(0, true, 0.6);
  expect(partial).toBeGreaterThan(0);
  expect(partial).toBeLessThan(1);
  expect(workspaceWindow(partial, false, 0)).toBe(partial);
  expect(workspaceWindow(partial, false, TAB_ACTION_SECONDS)).toBe(0);
  expect(workspaceWindow(1, false, 0.39)).toBe(1);
  expect(workspaceFrame(1)).toEqual({ scale: 1, left: 0, top: 0 });
  expect(workspaceFrame(0)).toEqual({ scale: 0.08, left: 22.4, top: 401.44 });
});

test('sparse visible frames finish a window action without a frame-count slowdown', () => {
  let clock = advanceWorkspaceClock({ elapsed: 0, previous: null }, 100, true);
  expect(clock.elapsed).toBe(0);
  clock = advanceWorkspaceClock(clock, 500, true);
  expect(clock.elapsed).toBe(0.4);
  clock = advanceWorkspaceClock(clock, 2100, true);
  expect(clock.elapsed).toBe(TAB_ACTION_SECONDS);
  expect(workspaceWindow(0.5, false, clock.elapsed)).toBe(0);
  expect(advanceWorkspaceClock(clock, 10_000, true).elapsed).toBe(
    TAB_ACTION_SECONDS,
  );
});

test('suspended window time is excluded and resuming or reversing seeds a fresh clock', () => {
  const initial = { elapsed: 0.5, previous: 100 };
  const paused = advanceWorkspaceClock(initial, 200, false);
  expect(paused).toEqual({ elapsed: 0.5, previous: null });
  const resumed = advanceWorkspaceClock(paused, 60_000, true);
  expect(resumed.elapsed).toBe(0.5);
  expect(advanceWorkspaceClock(resumed, 60_100, true).elapsed).toBeCloseTo(0.6);
  const reversed = advanceWorkspaceClock(
    { elapsed: 0, previous: null },
    90_000,
    true,
  );
  expect(reversed.elapsed).toBe(0);
  expect(advanceWorkspaceClock(reversed, 89_000, true).elapsed).toBe(0);
  expect(advanceWorkspaceClock(resumed, NaN, true)).toEqual(paused);
});

test('the default desktop has window chrome and a persistent visible launcher without loading section art', () => {
  const fillText = vi.fn();
  const fillRect = vi.fn();
  const context = {
    fillText,
    fillRect,
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  drawDesktopScreen(context);
  expect(fillRect).toHaveBeenCalledWith(0, 0, 1040, 464);
  expect(fillText).toHaveBeenCalledWith('Desktop', 24, 20);
  expect(fillText).toHaveBeenCalledWith('Portfolio', 123, 70);
  expect(fillText).toHaveBeenCalledWith('Workspace', 66, 426);
});

test('generated monitor SVG matches the approved review component', () => {
  expect(() =>
    execFileSync(
      process.execPath,
      ['scripts/export-workflow-art.mjs', '--check'],
      { cwd: process.cwd(), stdio: 'pipe' },
    ),
  ).not.toThrow();
});

test('Apollo SVG also matches its accepted public-safe review artwork', () => {
  expect(() =>
    execFileSync(
      process.execPath,
      ['scripts/export-workflow-art.mjs', '--apollo', '--check'],
      { cwd: process.cwd(), stdio: 'pipe' },
    ),
  ).not.toThrow();
});

test('heading reading position selects the workspace, not the camera', () => {
  const workflow = document.createElement('section');
  workflow.id = 'world-workflow-title';
  const apollo = document.createElement('section');
  apollo.id = 'world-apollo-title';
  const iris = document.createElement('section');
  iris.id = 'world-iris-title';
  document.body.append(workflow, apollo, iris);
  vi.stubGlobal('innerHeight', 900);
  vi.spyOn(workflow, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 2000 - window.scrollY, 100, 1000),
  );
  vi.spyOn(apollo, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 3000 - window.scrollY, 100, 1000),
  );
  vi.spyOn(iris, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 4000 - window.scrollY, 100, 1000),
  );
  try {
    vi.stubGlobal('scrollY', 1880);
    expect(readMonitorFocus()).toEqual({
      progress: 1,
      chapter: 'workflow',
      workspace: true,
    });
    vi.stubGlobal('scrollY', 2500);
    expect(readMonitorFocus()).toEqual({
      progress: 1,
      chapter: 'workflow',
      workspace: true,
    });
    vi.stubGlobal('scrollY', 3880);
    expect(readMonitorFocus().progress).toBe(0);
    vi.stubGlobal('scrollY', 2880);
    expect(readMonitorFocus()).toEqual({
      progress: 1,
      chapter: 'apollo',
      workspace: true,
    });
    vi.stubGlobal('scrollY', 5000);
    expect(readMonitorFocus().progress).toBe(0);
    expect(readMonitorFocus().workspace).toBe(true);
    vi.stubGlobal('scrollY', 0);
    expect(readMonitorFocus().workspace).toBe(false);
    vi.stubGlobal('scrollY', 1600);
    expect(readMonitorFocus().workspace).toBe(false);
    expect(readMonitorFocus('workflow', true).workspace).toBe(true);
  } finally {
    workflow.remove();
    apollo.remove();
    iris.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

test('texture uploads stay capped when camera invalidations exceed 20 Hz', () => {
  let previous = -Infinity;
  const paints: number[] = [];
  for (let frame = 0; frame <= 120; frame += 1) {
    const now = (frame * 1000) / 120;
    if (shouldPaintWorkflow(now, previous)) {
      paints.push(now);
      previous = now;
    }
  }
  expect(paints.length).toBeLessThanOrEqual(21);
  for (let index = 1; index < paints.length; index += 1)
    expect(paints[index]! - paints[index - 1]!).toBeGreaterThanOrEqual(50);
  expect(shouldPaintWorkflow(49, 0)).toBe(false);
  expect(shouldPaintWorkflow(50, 0)).toBe(true);
  expect(shouldPaintWorkflow(NaN, 0)).toBe(false);
});

test('native monitor crops preserve concept proportions rather than stretching the old page', () => {
  const drawImage = vi.fn();
  const context = { drawImage } as unknown as CanvasRenderingContext2D;
  const image = new Image();
  conceptCrop(context, image, [64, 213, 552, 195], [47, 184, 0.75]);
  expect(drawImage).toHaveBeenCalledWith(
    image,
    64,
    213,
    552,
    195,
    47,
    184,
    414,
    146.25,
  );
});
