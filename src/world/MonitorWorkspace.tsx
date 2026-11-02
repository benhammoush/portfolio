/**
 * The approved black-and-green workspace, with native controls and one short project pitch.
 * @packageDocumentation
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PROJECTS,
  WORKFLOW,
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
  /** Metadata and preview media, not a live product integration. */
  project: (typeof PROJECTS)[number];
}

/** Show a project screenshot and direct production link, even when the image fails.
 * @param props - The selected, approved project metadata.
 * @returns A large image pane using the selected project's supplied media.
 */
function ProjectPreview(props: ProjectPreviewProps) {
  const [failed, setFailed] = useState(false);
  return (
    <section
      className="monitor-preview"
      aria-label={`${props.project.label} visual preview`}
    >
      <div className="monitor-media-label">
        <span>┌─ preview / {props.project.id}</span>
        <a
          href={props.project.productionUrl}
          tabIndex={0}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit project ↗
        </a>
      </div>
      <div className="monitor-image-wrap">
        {failed ? (
          <p role="status">
            The preview could not load. The project description remains
            available.
          </p>
        ) : (
          <img
            src={props.project.image}
            alt={props.project.imageAlt}
            width={props.project.imageWidth}
            height={props.project.imageHeight}
            onError={() => setFailed(true)}
          />
        )}
      </div>
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
  const project = PROJECTS.find((item) => item.id === props.view);
  const welcome = !project;
  const about = copySection('world-about');
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    if (content.current) content.current.scrollTop = 0;
  }, [props.view]);
  useEffect(() => {
    if (!root.current) return;
    return playMonitorGlitch(root.current, welcome);
  }, [props.view, welcome]);
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
      data-effects="true"
      data-menu-open={menuOpen}
      aria-label="Portfolio workspace"
    >
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
              <section
                className="monitor-workflow"
                aria-labelledby="workflow-title"
              >
                <div className="monitor-workflow-heading">
                  <p className="monitor-workflow-eyebrow">My approach</p>
                  <h2 id="workflow-title">{WORKFLOW.blocks[0].text}</h2>
                  <p className="monitor-workflow-intro">
                    {WORKFLOW.blocks[1].text}
                  </p>
                </div>
                <ol className="monitor-steps" aria-label="How I work">
                  {WORKFLOW_STEPS.map((step, index) => (
                    <li key={step.title}>
                      <span aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </section>
          ) : (
            <article className="monitor-project">
              <div className="monitor-project-copy">
                <p className="monitor-path">~/projects / {project.id}</p>
                <div className="monitor-project-heading">
                  <h1 ref={title} tabIndex={-1}>
                    {project.label}
                  </h1>
                </div>
                <p className="monitor-description">{project.description}</p>
                <p className="monitor-stack">{project.stack}</p>
                <nav
                  className="monitor-project-links"
                  aria-label="GitHub repositories"
                >
                  <a
                    href={project.frontendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Frontend on GitHub"
                  >
                    Frontend ↗
                  </a>
                  {project.backendUrl ? (
                    <a
                      href={project.backendUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Backend on GitHub"
                    >
                      Backend ↗
                    </a>
                  ) : null}
                </nav>
              </div>
              <ProjectPreview key={project.id} project={project} />
            </article>
          )}
        </div>
        <div className="monitor-fragments" aria-hidden="true" />
      </div>
    </section>
  );
}
