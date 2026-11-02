/**
 * A minimal landing page leads into the accessible portfolio workspace.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../appVersion';
import { copySection } from './workspace-content';
import type { WorkspaceView } from './workspace-content';
import MonitorWorkspace from './MonitorWorkspace';
import TypingFacts from './TypingFacts';
import TravelGlobe from './TravelGlobe';
import './monitor.css';

/** The router resolves content before the portfolio is rendered. */
interface WorldPageProps {
  /** Omitted on the landing route. */
  view?: WorkspaceView;
}

/** Keep content and project history independent of graphics or visit storage.
 * @param props - Route-selected content, without fragment or history ownership.
 * @returns A static landing page or the directly linked workspace view.
 */
export default function WorldPage(props: WorldPageProps) {
  const selection = props.view ?? null;
  const landing = copySection('world-landing');
  useEffect(() => {
    document.documentElement.classList.add('monitor-route', 'workspace-open');
    return () =>
      document.documentElement.classList.remove(
        'monitor-route',
        'workspace-open',
      );
  }, []);
  useEffect(() => {
    if (selection === null)
      document
        .querySelector<HTMLElement>('.portfolio-landing h1')
        ?.focus({ preventScroll: true });
  }, [selection]);
  return (
    <div className="monitor-page" data-app-version={APP_VERSION}>
      <a
        className="skip-link"
        tabIndex={0}
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document
            .querySelector<HTMLElement>('#main-content h1')
            ?.focus({ preventScroll: true });
        }}
      >
        Skip to content
      </a>
      <main id="main-content" data-app-version={APP_VERSION}>
        {selection === null ? (
          <section
            className="monitor-workspace portfolio-landing"
            aria-labelledby="landing-title"
          >
            <TravelGlobe />
            <div className="portfolio-landing-inner">
              <h1 id="landing-title" tabIndex={-1}>
                {landing.blocks[0].text}
              </h1>
              <TypingFacts text={landing.blocks[1].text} />
              <Link className="monitor-primary" to="/about">
                Enter portfolio <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        ) : (
          <MonitorWorkspace view={selection} />
        )}
      </main>
    </div>
  );
}
