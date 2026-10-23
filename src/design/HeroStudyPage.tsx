/**
 * Static hero alternatives for local composition review, independent of WebGL.
 * @packageDocumentation
 */
import introPoster from '../assets/intro/intro-scene.png';
import { SECTION_COPY } from '../world/section-copy';
import './hero-study.css';

/** Select the review composition without changing the actual homepage. */
interface HeroStudyProps {
  /** Editorial prioritizes typography; immersive crops the workspace closer. */
  direction: 'editorial' | 'immersive';
}

/**
 * Compare layout and artwork scale using only the accepted introduction wording.
 * @param props - The independently addressable, static direction to preview.
 * @returns A labeled review surface with real navigation and no animation engine.
 */
export default function HeroStudyPage(props: HeroStudyProps) {
  const direction = props.direction;
  const introduction = SECTION_COPY[0]!;

  return (
    <div className={`hero-study hero-study--${direction}`}>
      <a className="skip-link" href="#hero-study-main" tabIndex={0}>
        Skip to hero
      </a>
      <header className="hero-study-toolbar">
        <p>Local hero study · Static artwork · Not live 3D</p>
        <nav aria-label="Hero directions">
          <a
            href="/hero-study"
            aria-current={direction === 'editorial' ? 'page' : undefined}
          >
            01 / Editorial
          </a>
          <a
            href="/hero-study/immersive"
            aria-current={direction === 'immersive' ? 'page' : undefined}
          >
            02 / Immersive
          </a>
        </nav>
      </header>

      <main
        className="container hero-study-preview"
        id="hero-study-main"
        tabIndex={-1}
      >
        <div className="hero-study-site-header">
          <a className="hero-study-brand" href="/">
            Guillaume Ammouche<span aria-hidden="true">.</span>
          </a>
          <nav aria-label="Portfolio navigation">
            <a href="/#world-workflow">Work</a>
            <a href="/about">About</a>
            <a href="/#world-contact">Contact</a>
          </nav>
        </div>

        <section
          className="hero-study-composition"
          aria-labelledby="hero-study-title"
        >
          <div className="hero-study-copy">
            <h1 id="hero-study-title">{introduction.blocks[0]!.text}</h1>
            <p className="hero-study-description">
              {introduction.blocks[1]!.text}
            </p>
            <div className="hero-study-actions">
              <a className="hero-study-primary" href="/#world-apollo">
                Explore my work <span aria-hidden="true">↗</span>
              </a>
              <a href="mailto:guillaumeammouche@protonmail.com">
                Get in touch <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="hero-study-art" aria-hidden="true">
            <img
              src={introPoster}
              alt=""
              width="1200"
              height="900"
              fetchPriority="high"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
