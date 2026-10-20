/**
 * Approved readable sections over the ongoing full-page scene composition.
 * @packageDocumentation
 */
import { useEffect, useState } from 'react';
import { CHAPTERS } from './chapters';
import { SECTION_COPY } from './section-copy';
import type { CopyBlock } from './section-copy';
import WorldViewport from './WorldViewport';
import { APP_VERSION } from '../appVersion';
import introPoster from '../assets/intro/desktop-poster.png';
import workflowPoster from '../assets/workflow/workflow-screen.svg?url';
import apolloPoster from '../assets/apollo/apollo-screen.svg?url';
import './world.css';

/** Props for plain-text approved blocks; no HTML interpretation is allowed. */
interface CopyBlocksProps {
  /** Ordered paragraphs and subsection headings. */
  blocks: CopyBlock[];
}

/**
 * Render the approved wording without adding or rewriting project narrative.
 * @param props - Paragraphs and subordinate headings from the approved source.
 * @returns Safe native HTML with readable paragraphs and semantic headings.
 */
function CopyBlocks(props: CopyBlocksProps) {
  return props.blocks.map((block) =>
    block.kind === 'paragraph' ? (
      <p key={block.text}>{block.text}</p>
    ) : (
      <h2 className="world-copy-subtitle" key={block.text}>
        {block.text}
      </h2>
    ),
  );
}

/** Accepted artwork shown independently of the WebGL monitor. */
interface ScreenPosterProps {
  /** Approved section whose decorative screen should be shown. */
  chapter: 'workflow' | 'apollo';
}

/**
 * Keep an independent section alternative useful even if its small SVG fails.
 * @param props - The accepted section artwork, independent of the 3D engine.
 * @returns Decorative artwork or a readable failure notice; no automatic retry loop.
 */
function ScreenPoster(props: ScreenPosterProps) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="world-workflow-poster" role="status">
      {props.chapter === 'workflow' ? 'Workflow' : 'Apollo'} artwork could not
      load. All section content remains available.
    </p>
  ) : (
    <img
      className="world-workflow-poster"
      src={props.chapter === 'workflow' ? workflowPoster : apolloPoster}
      alt=""
      width="1040"
      height="640"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Keep content independent of unfinished section art and the two camera poses.
 * @returns All six approved sections; Contact remains its earlier provisional copy.
 */
export default function WorldPage() {
  useEffect(() => {
    const fragment = window.location.hash.slice(1);
    if (
      SECTION_COPY.some((section) => section.id === fragment) ||
      ['world-main', 'world-contact'].includes(fragment)
    ) {
      document.getElementById(fragment)?.scrollIntoView();
    }
  }, []);
  const introduction = SECTION_COPY[0]!;
  const projects = SECTION_COPY.slice(2);

  return (
    <div className="world-page">
      <a className="skip-link" href="#world-main">
        Skip to content
      </a>
      <WorldViewport />
      <header className="world-header">
        <a className="world-brand" href="#world-hub">
          Guillaume Ammouche<span aria-hidden="true">.</span>
        </a>
        <nav aria-label="World chapters">
          {CHAPTERS.map((chapter) => (
            <a key={chapter.id} href={`#${chapter.id}`}>
              {chapter.label}
            </a>
          ))}
          <a href="#world-workflow">Work</a>
          <a href="/about">About</a>
          <a href="#world-contact">Contact</a>
        </nav>
      </header>
      <main className="container world-main" id="world-main" tabIndex={-1}>
        <section
          id="world-hub"
          className="world-intro world-section"
          aria-labelledby="world-title"
        >
          <div className="world-section-inner">
            <h1 id="world-title">{introduction.blocks[0]!.text}</h1>
            <p className="world-intro-detail">{introduction.blocks[1]!.text}</p>
            <div className="world-actions">
              <a className="world-link" href="#world-apollo">
                Explore my work <span aria-hidden="true">↓</span>
              </a>
              <a href="mailto:guillaumeammouche@protonmail.com">
                Get in touch <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="world-intro-art">
            <img
              className="world-intro-poster"
              src={introPoster}
              alt=""
              width="1200"
              height="900"
            />
          </div>
        </section>
        <section
          className="world-profile world-section"
          aria-label="Experience and life outside work"
        >
          <div className="world-section-inner">
            <CopyBlocks blocks={introduction.blocks.slice(2, 4)} />
            <details
              className="world-copy-details"
              onToggle={() => window.dispatchEvent(new Event('scroll'))}
            >
              <summary>Read more about me</summary>
              <CopyBlocks blocks={introduction.blocks.slice(4)} />
            </details>
          </div>
        </section>
        {SECTION_COPY.slice(1).map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`world-copy-section world-section${index % 2 === 1 ? ' world-copy-right' : ''}${section.id === 'world-iris' ? ' world-iris-section' : ''}${['world-workflow', 'world-apollo'].includes(section.id) ? ' world-workflow-section' : ''}`}
            aria-labelledby={`${section.id}-title`}
          >
            <div className="world-section-inner">
              <p className="world-eyebrow">
                <span>{String(index + 1).padStart(2, '0')} /</span>
                {section.label}
              </p>
              <h2 id={`${section.id}-title`}>{section.blocks[0]!.text}</h2>
              <CopyBlocks blocks={section.blocks.slice(1, 3)} />
              {section.blocks.length > 3 && (
                <details
                  className="world-copy-details"
                  onToggle={() => window.dispatchEvent(new Event('scroll'))}
                >
                  <summary>Read more about {section.label}</summary>
                  <CopyBlocks blocks={section.blocks.slice(3)} />
                </details>
              )}
              {section.id === 'world-workflow' && (
                <ul
                  className="world-project-links"
                  aria-label="Project sections"
                >
                  {projects.map((project) => (
                    <li key={project.id}>
                      <a href={`#${project.id}`}>
                        {project.label} <span aria-hidden="true">↓</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {['world-workflow', 'world-apollo'].includes(section.id) && (
              <ScreenPoster
                chapter={section.id === 'world-apollo' ? 'apollo' : 'workflow'}
              />
            )}
          </section>
        ))}
        <section
          id="world-contact"
          className="world-contact world-section"
          aria-labelledby="world-contact-title"
        >
          <div className="world-section-inner">
            <p className="world-eyebrow">Next / A conversation</p>
            <h2 id="world-contact-title">Let’s build something reliable.</h2>
            <p>For full-stack development opportunities, reach me by email.</p>
            <a
              className="world-contact-link"
              href="mailto:guillaumeammouche@protonmail.com"
            >
              guillaumeammouche@protonmail.com <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <footer className="world-footer">
          <p>
            Local composition study · Not a public launch · Version{' '}
            <span data-testid="app-version">{APP_VERSION}</span>
          </p>
          <a href="/about">Return to the profile ↗</a>
        </footer>
      </main>
    </div>
  );
}
