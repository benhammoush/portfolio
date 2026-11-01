/**
 * The approved black-and-green workspace, with native controls and one short project pitch.
 * @packageDocumentation
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PROJECTS,
  WORKFLOW_STEPS,
  copySection,
  workspacePath,
} from './workspace-content';
import type { WorkspaceView } from './workspace-content';
import { playMonitorGlitch } from './monitor-glitch';

/** Content navigation owned by the portfolio page. */
interface WorkspaceProps {
  /** Route-selected About me or project content. */
  view: WorkspaceView;
}

/** Approved media for a selected project. */
interface ProjectPreviewProps {
  /** Metadata and illustration, not a live product integration. */
  project: (typeof PROJECTS)[number];
}

/** Display original artwork honestly, with a native full-size dialog and an image failure path.
 * @param props - The selected, approved project metadata.
 * @returns A large image pane; no live product integration or private screenshot.
 */
function ProjectPreview(props: ProjectPreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  return (
    <section
      className="monitor-preview"
      aria-label={`${props.project.label} visual preview`}
    >
      <div className="monitor-media-label">
        <span>┌─ preview / {props.project.id}</span>
        {!failed && (
          <button type="button" onClick={() => dialog.current?.showModal()}>
            Expand ↗
          </button>
        )}
      </div>
      <div className="monitor-image-wrap">
        {failed ? (
          <p role="status">
            The illustration could not load. The project description remains
            available.
          </p>
        ) : (
          <img
            src={props.project.image}
            alt={`${props.project.label} conceptual illustration, not a product screenshot`}
            width="1040"
            height="640"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <p className="monitor-asset-note">
        Preview illustration · product screenshot pending
        {props.project.id === 'apollo'
          ? ' · private material requires approval'
          : ''}
        .
      </p>
      <dialog
        className="monitor-image-dialog"
        ref={dialog}
        aria-label={`${props.project.label} illustration`}
      >
        <div>
          <span>{props.project.label} / illustration</span>
          <button type="button" onClick={() => dialog.current?.close()}>
            Close ×
          </button>
        </div>
        <img
          src={props.project.image}
          alt={`${props.project.label} conceptual illustration`}
          width="1040"
          height="640"
        />
      </dialog>
    </section>
  );
}

/** Present About me as the default pane of the project explorer.
 * @param props - Current workspace selection and history actions.
 * @returns The full-screen responsive portfolio, with no graphics prerequisite.
 */
export default function MonitorWorkspace(props: WorkspaceProps) {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuView, setMenuView] = useState<WorkspaceView | null>(null);
  const menuOpen = menuView === props.view;
  if (menuView !== null && menuView !== props.view) setMenuView(null);
  const [effects, setEffects] = useState(true);
  const project = PROJECTS.find((item) => item.id === props.view);
  const welcome = !project;
  const about = copySection('world-about');
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    if (content.current) content.current.scrollTop = 0;
  }, [props.view]);
  useEffect(() => {
    if (!effects || !root.current) return;
    return playMonitorGlitch(root.current, welcome);
  }, [props.view, effects, welcome]);
  useEffect(() => {
    /** A drawer opened on a phone must not survive a layout change. */
    function resize() {
      setMenuView(null);
    }
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    /** Dismiss even when Safari pointer activation leaves focus outside the drawer.
     * @param event - Document-level dismissal key.
     */
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setMenuView(null);
      menuButton.current?.focus();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [menuOpen]);
  /** Close the drawer while the router handles the native link navigation.
   * @param view - Destination used to restore focus on a same-view selection.
   */
  function select(view: WorkspaceView) {
    setMenuView(null);
    if (view === props.view) title.current?.focus({ preventScroll: true });
  }
  /** Restore a visible focus target when dismissing the compact navigation. */
  function closeMenu() {
    setMenuView(null);
    menuButton.current?.focus();
  }
  return (
    <section
      ref={root}
      className="monitor-workspace"
      data-view={props.view}
      data-effects={effects}
      data-menu-open={menuOpen}
      aria-label="Portfolio workspace"
    >
      <header className="monitor-bar">
        <Link
          to="/about"
          replace={welcome}
          onClick={() => select('about')}
          aria-label="Return to About me"
        >
          <span>guillaume</span>@portfolio:
          <span className="monitor-current-path">
            ~/{project?.id ?? 'about'}
          </span>
        </Link>
        <div className="monitor-bar-actions">
          <label className="monitor-effects">
            <input
              type="checkbox"
              checked={effects}
              onChange={(event) => setEffects(event.target.checked)}
            />
            FX
          </label>
        </div>
      </header>
      <button
        className="monitor-project-picker"
        type="button"
        ref={menuButton}
        aria-label="Choose project"
        aria-expanded={menuOpen}
        aria-controls="monitor-navigation"
        onClick={() => setMenuView(menuOpen ? null : props.view)}
      >
        <span>Choose project</span>
        <span>
          {project?.label ?? '04 projects'}{' '}
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </span>
      </button>
      <div className="monitor-body">
        {menuOpen && (
          <button
            className="monitor-menu-backdrop"
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
          />
        )}
        <nav
          id="monitor-navigation"
          className="monitor-navigation"
          aria-label="Workspace navigation"
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget) &&
              event.relatedTarget !== menuButton.current
            )
              setMenuView(null);
          }}
        >
          <p className="monitor-directory">~/portfolio/</p>
          <Link
            to="/about"
            replace={welcome}
            aria-label="About me"
            aria-current={welcome ? 'page' : undefined}
            onClick={() => select('about')}
          >
            <span aria-hidden="true">├─</span>About me
          </Link>
          <p className="monitor-project-directory">├─ projects/</p>
          {PROJECTS.map((item, index) => (
            <Link
              key={item.id}
              to={workspacePath(item.id)}
              replace={props.view === item.id}
              aria-label={item.label}
              aria-current={props.view === item.id ? 'page' : undefined}
              onClick={() => select(item.id)}
            >
              <span aria-hidden="true">
                │ {index === PROJECTS.length - 1 ? '└─' : '├─'}
              </span>
              {item.label}
            </Link>
          ))}
          <p className="monitor-directory-note">
            04 selected projects
            <br />
            Interfaces → infrastructure
          </p>
        </nav>
        <div className="monitor-content" ref={content}>
          {welcome ? (
            <section className="monitor-welcome monitor-about">
              <p className="monitor-path">~/portfolio / about</p>
              <div className="monitor-welcome-heading">
                <div>
                  <h1 ref={title} tabIndex={-1}>
                    {about.blocks[0].text}
                    <span className="monitor-cursor" aria-hidden="true" />
                  </h1>
                  <p className="monitor-about-intro">{about.blocks[1].text}</p>
                </div>
              </div>
              <div className="monitor-about-links">
                <a
                  href="https://github.com/benhammoush"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
                <a
                  href="/resume/Guillaume_Ammouche_CV_ATS.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Résumé (PDF) ↗
                </a>
                <a href="mailto:guillaumeammouche@protonmail.com">Email ↗</a>
              </div>
              <ol className="monitor-steps" aria-label="How I work">
                {WORKFLOW_STEPS.map((step, index) => (
                  <li key={step.title}>
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h2>{step.title}</h2>
                    <p>{step.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <article className="monitor-project">
              <div className="monitor-project-copy">
                <p className="monitor-path">~/projects / {project.id}</p>
                <div className="monitor-project-heading">
                  <h1 ref={title} tabIndex={-1}>
                    {project.label}
                  </h1>
                  <span>
                    {String(PROJECTS.indexOf(project) + 1).padStart(2, '0')} /
                    04
                  </span>
                </div>
                <p className="monitor-description">{project.description}</p>
                <p className="monitor-stack">{project.stack}</p>
              </div>
              <ProjectPreview key={project.id} project={project} />
            </article>
          )}
        </div>
        <div className="monitor-fragments" aria-hidden="true" />
      </div>
      <footer className="monitor-status">
        <span>
          portfolio <span>{project?.id ?? 'about'}</span>
        </span>
        <span>FR / EN · DA NANG, VN</span>
      </footer>
    </section>
  );
}
