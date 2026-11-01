/**
 * Accessible profile shell using owner-supplied CV content, without project claims.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { APP_VERSION } from './appVersion';
import { Card } from './design-system';
import { PROFILE } from './profile-content';

/**
 * Present the approved profile with native section navigation and email contact.
 * @returns A motion-free homepage independent of future case studies and WebGL.
 */
export default function HomePage() {
  useEffect(() => {
    // The browser's initial fragment lookup can precede React's DOM commit.
    // Later anchor clicks/history remain native; no scroll interception is used.
    const section = window.location.hash.slice(1);
    if (['main-content', 'about', 'expertise', 'contact'].includes(section)) {
      document.getElementById(section)?.scrollIntoView();
    }
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content" tabIndex={0}>
        Skip to content
      </a>
      <header className="site-header container">
        <a
          className="wordmark"
          href="#main-content"
          aria-label="Guillaume Ammouche, introduction"
        >
          Guillaume Ammouche
        </a>
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="#about">About</a>
          <a href="#expertise">Expertise</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main id="main-content" className="container" tabIndex={-1}>
        <section className="hero" aria-labelledby="profile-title">
          <p className="eyebrow">React · TypeScript · Python · FastAPI</p>
          <h1 id="profile-title">Guillaume Ammouche</h1>
          <p className="hero-headline">Full-Stack Developer</p>
          <p className="intro">
            Building React/TypeScript interfaces and Python/FastAPI backends.
          </p>
          <div className="actions">
            <a
              className="button"
              href="mailto:guillaumeammouche@protonmail.com"
            >
              Get in touch <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#expertise">
              Explore my expertise <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <section
          id="about"
          className="section-grid"
          aria-labelledby="about-title"
        >
          <div>
            <p className="eyebrow">01 / About</p>
            <h2 id="about-title">Across the stack.</h2>
          </div>
          <div className="section-copy">
            <p>{PROFILE.biography}</p>
            <p className="muted">
              {PROFILE.languages}
              <br />
              {PROFILE.availability}
            </p>
          </div>
        </section>
        <section
          id="expertise"
          className="expertise-section"
          aria-labelledby="expertise-title"
        >
          <p className="eyebrow">02 / Expertise</p>
          <h2 id="expertise-title">From interface to infrastructure.</h2>
          <div className="capability-grid">
            {PROFILE.capabilities.map((capability) => (
              <Card key={capability.title}>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
                <p className="card-detail">{capability.stack}</p>
              </Card>
            ))}
          </div>
        </section>
        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <p className="eyebrow">03 / Contact</p>
          <h2 id="contact-title">Let’s talk.</h2>
          <p>For full-stack development opportunities, reach me by email.</p>
          <a
            className="contact-link"
            href="mailto:guillaumeammouche@protonmail.com"
          >
            guillaumeammouche@protonmail.com <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <footer className="site-footer container">
        <p>Guillaume Ammouche · Full-Stack Developer</p>
        <p>
          Version <span data-testid="app-version">{APP_VERSION}</span> ·
          Preview, not a public launch
        </p>
      </footer>
    </>
  );
}
