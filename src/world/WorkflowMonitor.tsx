/**
 * Locally owned monitor surface with bounded demand-driven artwork playback.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import type { Object3D } from 'three';
import artworkUrl from '../assets/workflow/workflow-screen.svg?url';
import apolloUrl from '../assets/apollo/apollo-screen.svg?url';
import { drawApolloTexture } from './apollo-texture';
import { drawWorkflowTexture, shouldPaintWorkflow } from './workflow-texture';
import { readMonitorFocus } from './workflow-focus';
import type { MonitorChapter } from './workflow-focus';
import {
  drawWorkspaceShell,
  drawWorkspacePointer,
  drawDesktopScreen,
  workspaceWindow,
  workspaceFrame,
  workspaceTab,
  TAB_ACTION_SECONDS,
  advanceWorkspaceClock,
} from './monitor-workspace';

/** Policy and owned clone supplied by the introduction boundary. */
interface WorkflowMonitorProps {
  /** Per-mount model clone, never the shared loader cache. */
  scene: Object3D;
  /** Manual pause and viewport/reduced-motion policy permit decorative playback. */
  animate: boolean;
  /** Only desktop motion policy may open the workspace; other modes retain its still desktop. */
  cameraTravel: boolean;
  /** Reuse the authored supported mouse motion for deliberate window/tab actions. */
  onGesture: (elapsed: number) => void;
}

/** The effect creates fresh resources even during Strict Mode setup/cleanup cycles. */
interface MonitorSurface {
  /** Offscreen canvas context, not a second visible renderer. */
  context: CanvasRenderingContext2D;
  /** Small accepted SVGs share one GPU surface; each is loaded once per mount. */
  images: Record<MonitorChapter, { image: HTMLImageElement; ready: boolean }>;
  /** GPU texture owned by this effect. */
  texture: CanvasTexture;
  /** Plane positioned just ahead of the model's measured screen face. */
  plane: Mesh;
}

/**
 * Attach an unlit monitor surface without changing cached model materials or geometry.
 * @param props - Scene clone and shared motion/view policy.
 * @returns No Fiber geometry; the effect owns and disposes its attached surface.
 */
export default function WorkflowMonitor(props: WorkflowMonitorProps) {
  const { gl, invalidate } = useThree();
  const surface = useRef<MonitorSurface | null>(null);
  const time = useRef({ workflow: 0, apollo: 0 });
  const previousPaint = useRef(-Infinity);
  const paintedFrames = useRef(0);
  const wasPlaying = useRef<MonitorChapter | null>(null);
  const previousWindowFrame = useRef<number | null>(null);
  const paintedChapter = useRef<MonitorChapter | null>(null);
  const paintedWindow = useRef(-1);
  const action = useRef<{
    from: MonitorChapter;
    to: MonitorChapter;
    elapsed: number;
  } | null>(null);
  const wasBusy = useRef(false);
  const windowAction = useRef<{
    from: number;
    open: boolean;
    elapsed: number;
  } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    /** Freeze the first returning frame, even when the demand loop skipped hidden frames. */
    function suspendClock() {
      wasPlaying.current = null;
      previousWindowFrame.current = null;
      window.clearTimeout(timer.current);
    }
    document.addEventListener('visibilitychange', suspendClock);
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) suspendClock();
    });
    observer.observe(gl.domElement);
    return () => {
      document.removeEventListener('visibilitychange', suspendClock);
      observer.disconnect();
    };
  }, [gl]);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 464;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawDesktopScreen(context);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    const geometry = new PlaneGeometry(0.99, 0.441);
    // Desktop and app windows share this one opaque surface, including stationary 3D.
    const material = new MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    });
    const plane = new Mesh(geometry, material);
    plane.position.set(0.26, 1.2235, -0.444);
    plane.visible = true;
    props.scene.add(plane);
    const owned: MonitorSurface = {
      context,
      images: {
        workflow: { image: new Image(), ready: false },
        apollo: { image: new Image(), ready: false },
      },
      texture,
      plane,
    };
    surface.current = owned;
    paintedChapter.current = null;
    paintedWindow.current = 0;
    previousPaint.current = performance.now();
    paintedFrames.current = 1;
    gl.domElement.setAttribute('data-monitor-desktop', 'ready');
    gl.domElement.setAttribute('data-workflow-frames', '1');
    gl.domElement.setAttribute('data-monitor-painted-window', '0');
    wasPlaying.current = null;
    action.current = null;
    wasBusy.current = false;
    windowAction.current = null;
    previousWindowFrame.current = null;
    for (const chapter of ['workflow', 'apollo'] as const) {
      const item = owned.images[chapter];
      item.image.onload = () => {
        if (surface.current !== owned) return;
        item.ready = true;
        gl.domElement.setAttribute(`data-${chapter}-ready`, 'true');
        invalidate();
      };
      item.image.onerror = () => {
        if (surface.current === owned) {
          gl.domElement.setAttribute(`data-${chapter}-error`, 'true');
          invalidate();
        }
      };
      item.image.src = chapter === 'workflow' ? artworkUrl : apolloUrl;
    }
    return () => {
      window.clearTimeout(timer.current);
      Object.values(owned.images).forEach(({ image }) => {
        image.onload = null;
        image.onerror = null;
      });
      surface.current = null;
      props.scene.remove(plane);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      [
        'data-workflow-ready',
        'data-workflow-error',
        'data-workflow-motion',
        'data-workflow-time',
        'data-workflow-active',
        'data-workflow-frames',
        'data-apollo-ready',
        'data-apollo-error',
        'data-monitor-chapter',
        'data-monitor-action',
        'data-monitor-workflow-time',
        'data-monitor-apollo-time',
        'data-monitor-window',
        'data-monitor-window-time',
        'data-monitor-window-amount',
        'data-monitor-painted-window',
        'data-monitor-desktop',
      ].forEach((name) => gl.domElement.removeAttribute(name));
    };
  }, [props.scene, gl, invalidate]);
  useEffect(() => {
    previousWindowFrame.current = null;
    invalidate();
    return () => window.clearTimeout(timer.current);
  }, [props.animate, props.cameraTravel, invalidate]);
  useFrame((_, delta) => {
    window.clearTimeout(timer.current);
    const owned = surface.current;
    if (!owned) return;
    const focus = readMonitorFocus(
      action.current?.to,
      windowAction.current?.open,
    );
    const chapter = focus.chapter;
    const item = owned.images[chapter];
    const pastHero =
      (document.getElementById('world-hub')?.getBoundingClientRect().bottom ??
        Infinity) <= 0;
    const section = document
      .getElementById(`world-${chapter}`)
      ?.getBoundingClientRect();
    const bounds = gl.domElement.getBoundingClientRect();
    const canAnimate =
      props.cameraTravel &&
      pastHero &&
      props.animate &&
      !document.hidden &&
      bounds.width > 0 &&
      bounds.height > 0;
    const requestedWindow = props.cameraTravel && focus.workspace;
    if (!windowAction.current)
      windowAction.current = {
        from: requestedWindow ? 1 : 0,
        open: requestedWindow,
        elapsed: TAB_ACTION_SECONDS,
      };
    const windowChanged = windowAction.current.open !== requestedWindow;
    if (windowChanged)
      windowAction.current = {
        from: workspaceWindow(
          windowAction.current.from,
          windowAction.current.open,
          windowAction.current.elapsed,
        ),
        open: requestedWindow,
        elapsed: canAnimate ? 0 : TAB_ACTION_SECONDS,
      };
    const windowState = windowAction.current;
    // A jump past the accepted reading sections must not play a missed launch later.
    if (
      !pastHero ||
      !props.cameraTravel ||
      (windowState.open && focus.progress === 0)
    )
      windowState.elapsed = TAB_ACTION_SECONDS;
    const windowMoving = windowState.elapsed < TAB_ACTION_SECONDS;
    const eligible =
      props.cameraTravel &&
      pastHero &&
      item.ready &&
      (requestedWindow || windowMoving);
    const playing =
      eligible &&
      canAnimate &&
      (windowMoving ||
        (focus.progress > 0 &&
          !!section &&
          section.bottom > 0 &&
          section.top < window.innerHeight));
    const windowClock = advanceWorkspaceClock(
      {
        elapsed: windowState.elapsed,
        previous: windowChanged ? null : previousWindowFrame.current,
      },
      performance.now(),
      playing,
    );
    windowState.elapsed = windowClock.elapsed;
    previousWindowFrame.current = windowClock.previous;
    const windowAmount = workspaceWindow(
      windowState.from,
      windowState.open,
      windowState.elapsed,
    );
    const opening = windowState.elapsed < TAB_ACTION_SECONDS;
    const visible =
      props.cameraTravel &&
      pastHero &&
      item.ready &&
      (requestedWindow || opening);
    gl.domElement.setAttribute('data-workflow-active', String(visible));
    gl.domElement.setAttribute(
      'data-monitor-window',
      opening
        ? windowState.open
          ? 'opening'
          : 'closing'
        : requestedWindow
          ? 'open'
          : 'closed',
    );
    gl.domElement.setAttribute(
      'data-monitor-window-time',
      String(windowState.elapsed),
    );
    gl.domElement.setAttribute(
      'data-monitor-window-amount',
      String(windowAmount),
    );
    gl.domElement.setAttribute(
      'data-workflow-motion',
      playing ? 'playing' : 'paused',
    );
    if (action.current?.to !== chapter || windowChanged)
      action.current = {
        from: paintedChapter.current ?? chapter,
        to: chapter,
        elapsed:
          !opening &&
          paintedChapter.current &&
          paintedChapter.current !== chapter &&
          playing
            ? 0
            : TAB_ACTION_SECONDS,
      };
    const current = action.current;
    if (!current) return;
    if (playing && !opening && wasPlaying.current === chapter)
      current.elapsed = Math.min(
        TAB_ACTION_SECONDS,
        current.elapsed + Math.min(delta, 0.1),
      );
    if (!playing) wasPlaying.current = null;
    // The first resume frame must not add time spent paused or offscreen.
    if (playing && windowAmount === 1 && wasPlaying.current === chapter)
      time.current[chapter] = Math.min(
        1.8,
        time.current[chapter] + Math.min(delta, 0.1),
      );
    if (playing) wasPlaying.current = chapter;
    const selected = workspaceTab(current.from, current.to, current.elapsed);
    const busy =
      playing &&
      (opening ||
        current.elapsed < TAB_ACTION_SECONDS ||
        (requestedWindow && time.current[chapter] < 1.8));
    if (playing && (opening || current.elapsed < TAB_ACTION_SECONDS))
      props.onGesture(opening ? windowState.elapsed : current.elapsed);
    gl.domElement.setAttribute(
      'data-monitor-action',
      opening
        ? windowState.open
          ? 'opening-window'
          : 'closing-window'
        : current.elapsed < TAB_ACTION_SECONDS
          ? 'selecting-tab'
          : 'settled',
    );
    const artChanged =
      (visible && windowAmount > 0 && paintedChapter.current !== selected) ||
      paintedWindow.current !== (visible ? windowAmount : 0);
    if (!playing && !artChanged) {
      wasBusy.current = false;
      return;
    }
    if (!busy && !artChanged && !wasBusy.current) return;
    const now = performance.now();
    if (shouldPaintWorkflow(now, previousPaint.current)) {
      const paintArtwork =
        visible && windowAmount > 0 && owned.images[selected].ready;
      const draw =
        selected === 'workflow' ? drawWorkflowTexture : drawApolloTexture;
      drawDesktopScreen(owned.context);
      if (paintArtwork) {
        const frame = workspaceFrame(windowAmount);
        owned.context.save();
        owned.context.translate(frame.left, frame.top);
        owned.context.scale(frame.scale, frame.scale);
        drawWorkspaceShell(owned.context, selected);
        draw(
          owned.context,
          owned.images[selected].image,
          time.current[selected],
        );
        owned.context.restore();
      }
      if (visible)
        drawWorkspacePointer(
          owned.context,
          opening ? (windowState.open ? 'open' : 'close') : chapter,
          opening ? windowState.elapsed : current.elapsed,
          windowState.from,
        );
      owned.texture.needsUpdate = true;
      previousPaint.current = now;
      paintedFrames.current += 1;
      // Desktop fallback is not an outgoing artwork frame. In particular, a
      // failed image must never become the source of the next tab transition.
      paintedChapter.current = paintArtwork ? selected : null;
      paintedWindow.current = visible ? windowAmount : 0;
      gl.domElement.setAttribute(
        'data-monitor-painted-window',
        String(paintedWindow.current),
      );
      wasBusy.current = busy;
      if (paintArtwork)
        gl.domElement.setAttribute('data-monitor-chapter', selected);
      else gl.domElement.removeAttribute('data-monitor-chapter');
      // Existing diagnostic names represent the shared monitor, not a second surface.
      gl.domElement.setAttribute(
        'data-workflow-time',
        String(time.current[chapter]),
      );
      for (const name of ['workflow', 'apollo'] as const)
        gl.domElement.setAttribute(
          `data-monitor-${name}-time`,
          String(time.current[name]),
        );
      gl.domElement.setAttribute(
        'data-workflow-frames',
        String(paintedFrames.current),
      );
    }
    if (
      busy ||
      wasBusy.current ||
      (visible && windowAmount > 0 && paintedChapter.current !== selected) ||
      paintedWindow.current !== (visible ? windowAmount : 0)
    )
      timer.current = window.setTimeout(
        invalidate,
        Math.max(1, 50 - (performance.now() - previousPaint.current)),
      );
  });
  return null;
}
