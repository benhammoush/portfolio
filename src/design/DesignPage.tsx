/**
 * Local art-direction board for owner review before a real scroll-world prototype.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import GalleryScene from './GalleryScene';
import './design.css';

/**
 * Show composition, material language and accessible behavior as one static study.
 * @returns A clearly labeled concept, not a case study or completed 3D experience.
 */
export default function DesignPage() {
  useEffect(() => {
    // Initial native fragment lookup can happen before the client renders targets.
    const section = window.location.hash.slice(1);
    if (
      ['design-main', 'gallery', 'iris-study', 'interaction'].includes(section)
    ) {
      document.getElementById(section)?.scrollIntoView();
    }
  }, []);

  return (
    <div className="design-board">
      <a className="skip-link" href="#design-main">
        Skip to concept
      </a>
      <header className="design-header">
        <Link className="design-signature" to="/about">
          Guillaume Ammouche<span aria-hidden="true"> / </span>
          <span>Engineering & interfaces</span>
        </Link>
        <nav aria-label="Concept navigation">
          <a href="#gallery">The gallery</a>
          <a href="#iris-study">Iris study</a>
          <a href="#interaction">Interaction</a>
        </nav>
        <span className="design-status">Art direction / 01</span>
      </header>

      <main id="design-main" className="container design-main" tabIndex={-1}>
        <section
          className="design-hero"
          id="gallery"
          aria-labelledby="gallery-heading"
        >
          <div className="design-hero-copy">
            <p className="design-kicker">An engineering gallery</p>
            <h1 id="gallery-heading">
              Software,
              <br />
              made tangible<span>.</span>
            </h1>
            <p className="design-deck">
              Full-stack developer building reliable software—from interface to
              production.
            </p>
            <p className="design-description">
              A quiet space to explore the systems behind the screen. Each
              installation opens a different engineering story.
            </p>
            <a className="design-action" href="#iris-study">
              Step inside the first study <span aria-hidden="true">↘</span>
            </a>
            <p className="design-footnote">
              Visual concept · Original vector artwork · Not live 3D
            </p>
          </div>
          <figure className="design-world">
            <div className="scene-topline">
              <span>Exhibit 00—01</span>
              <span>Hub → Iris</span>
            </div>
            <GalleryScene />
            <figcaption>
              <span className="scene-dot" aria-hidden="true" /> The hub connects
              the installations. Iris is marked in copper.
            </figcaption>
          </figure>
        </section>

        <div
          className="design-materials"
          aria-label="Proposed material palette"
        >
          <p>
            Less spaceship.
            <br />
            <strong>More architectural model.</strong>
          </p>
          <ul>
            <li>
              <span className="swatch swatch-chalk" />
              Chalk ceramic
            </li>
            <li>
              <span className="swatch swatch-glass" />
              Frosted glass
            </li>
            <li>
              <span className="swatch swatch-ink" />
              Forest ink
            </li>
            <li>
              <span className="swatch swatch-copper" />
              Copper signal
            </li>
          </ul>
        </div>

        <section
          id="iris-study"
          className="design-iris"
          aria-labelledby="iris-heading"
        >
          <figure className="iris-detail">
            <GalleryScene detail />
            <figcaption>
              Material study / schematic data, not product UI
            </figcaption>
          </figure>
          <div className="iris-copy">
            <p className="design-kicker">01 / First installation</p>
            <h2 id="iris-heading">
              Iris.
              <br />
              Signals, brought into focus.
            </h2>
            <p>
              A proposed visual metaphor for exploring public-wallet and market
              information: layered panes, a clear signal path and one restrained
              accent.
            </p>
            <p className="design-description">
              The interface and case-study text stay in readable HTML beside the
              installation. The scene supports the story; it never contains the
              only way to understand it.
            </p>
            <dl className="design-facts">
              <div>
                <dt>Form</dt>
                <dd>Layered observation panes</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>Glass, ceramic, brushed copper</dd>
              </div>
              <div>
                <dt>Camera proposal</dt>
                <dd>Wide hub → closer three-quarter view</dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          id="interaction"
          className="design-interaction"
          aria-labelledby="interaction-heading"
        >
          <div>
            <p className="design-kicker">The interaction contract</p>
            <h2 id="interaction-heading">
              A world to explore.
              <br />
              Not an obstacle to navigate.
            </h2>
          </div>
          <div className="design-rules">
            <article>
              <span>01</span>
              <h3>Your scroll, your pace.</h3>
              <p>
                Proposed camera poses follow native page progress. No scroll
                hijacking, free flight or forced animation waits.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>The content comes first.</h3>
              <p>
                Normal links, visible focus and readable HTML remain usable
                without a canvas. No hover-only information.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Still is a complete experience.</h3>
              <p>
                Reduced motion uses fixed views without camera travel. Mobile
                and unsupported WebGL keep an illustrated alternative.
              </p>
            </article>
          </div>
        </section>

        <footer className="design-footer">
          <div>
            <p className="design-kicker">Next, after visual approval</p>
            <p>
              Build the hub + Iris in real 3D.
              <br />
              Measure it before setting performance budgets.
            </p>
          </div>
          <Link to="/about">
            Back to the profile <span aria-hidden="true">↗</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
