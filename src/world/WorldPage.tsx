/**
 * Approved readable sections over the ongoing full-page scene composition.
 * @packageDocumentation
 */
import { useEffect, useRef, useState } from 'react';
import { CHAPTERS } from './chapters';
import { SECTION_COPY } from './section-copy';
import type { CopyBlock } from './section-copy';
import WorldViewport from './WorldViewport';
import { APP_VERSION } from '../appVersion';
import introPoster from '../assets/intro/desktop-poster.png';
import workflowPoster from '../assets/workflow/workflow-screen.svg?url';
import apolloPoster from '../assets/apollo/apollo-screen.svg?url';
import irisPoster from '../assets/iris/iris-screen.svg?url';
import gatewayPoster from '../assets/gateway/gateway-screen.svg?url';
import dripperzPoster from '../assets/dripperz/dripperz-screen.svg?url';
import { MONITOR_CHAPTERS, MONITOR_LABELS } from './workflow-focus';
import type { MonitorChapter } from './workflow-focus';
import './world.css';
import { useSectionNavigation } from './useSectionNavigation';

/** Props for plain-text approved blocks; no HTML interpretation is allowed. */
interface CopyBlocksProps {
  /** Ordered paragraphs and subsection headings. */
  blocks: CopyBlock[];
  /** Individual terms to emphasize without changing approved copy. */
  emphasis?: readonly string[];
}

/**
 * Render the approved wording without adding or rewriting project narrative.
 * @param props - Paragraphs and subordinate headings from the approved source.
 * @returns Safe native HTML with readable paragraphs and semantic headings.
 */
function CopyBlocks(props: CopyBlocksProps) {
  const pattern = props.emphasis?.length
    ? new RegExp(`\\b(${props.emphasis.join('|')})\\b`, 'gi')
    : undefined;
  return props.blocks.map((block) =>
    block.kind === 'paragraph' ? (
      <p key={block.text}>
        {pattern
          ? block.text
              .split(pattern)
              .map((part, index) =>
                props.emphasis!.some(
                  (word) => word.toLowerCase() === part.toLowerCase(),
                ) ? (
                  <strong key={index}>{part}</strong>
                ) : (
                  part
                ),
              )
          : block.text}
      </p>
    ) : (
      <h3 className="world-copy-subtitle" key={block.text}>
        {block.text}
      </h3>
    ),
  );
}

/** Accepted artwork shown independently of the WebGL monitor. */
interface ScreenPosterProps {
  /** Approved section whose decorative screen should be shown. */
  chapter: MonitorChapter;
}

/** Independent decorative alternatives also work without loading the 3D engine. */
const SCREEN_POSTERS: Record<MonitorChapter, string> = {
  workflow: workflowPoster,
  apollo: apolloPoster,
  iris: irisPoster,
  gateway: gatewayPoster,
  dripperz: dripperzPoster,
};

/** A few single-word anchors give each project copy a quick visual scan point. */
const SECTION_EMPHASIS: Record<string, readonly string[]> = {
  'world-apollo': ['trading', 'workers', 'memory', 'backtesting'],
  'world-iris': ['Stacks', 'Solana', 'wallet', 'caching'],
  'world-gateway': ['API', 'security', 'wallet', 'verification'],
  'world-dripperz': ['Ethereum', 'Solidity', 'minting', 'AWS'],
};

/** Native section targets represented by the scroll-anchor rail. */
const PAGE_ANCHORS = [
  { id: 'world-hub', label: 'Introduction' },
  { id: 'world-profile', label: 'About me' },
  ...SECTION_COPY.slice(1).map(({ id, label }) => ({ id, label })),
  { id: 'world-contact', label: 'Contact' },
];

/**
 * Small direct links show the active stop without replacing native scrolling.
 * @returns An accessible rail of section links with the current anchor marked.
 */
function SectionAnchorRail() {
  const [active, setActive] = useState(PAGE_ANCHORS[0]!.id);
  useEffect(() => {
    /** Mark the last chapter whose anchor has entered the upper reading area. */
    function updateActiveAnchor() {
      const threshold = window.scrollY + window.innerHeight * 0.35;
      let current = PAGE_ANCHORS[0]!.id;
      for (const anchor of PAGE_ANCHORS) {
        const section = document.getElementById(anchor.id);
        if (
          section &&
          section.getBoundingClientRect().top + window.scrollY <= threshold
        )
          current = anchor.id;
      }
      setActive(current);
    }
    updateActiveAnchor();
    window.addEventListener('scroll', updateActiveAnchor, { passive: true });
    window.addEventListener('resize', updateActiveAnchor);
    return () => {
      window.removeEventListener('scroll', updateActiveAnchor);
      window.removeEventListener('resize', updateActiveAnchor);
    };
  }, []);

  return (
    <nav className="world-anchor-rail" aria-label="Section anchors">
      {PAGE_ANCHORS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={`Go to ${label}`}
          aria-current={active === id ? 'location' : undefined}
          title={label}
        >
          <span aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
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
      {MONITOR_LABELS[props.chapter]} artwork could not load. All section
      content remains available.
    </p>
  ) : (
    <img
      className="world-workflow-poster"
      src={SCREEN_POSTERS[props.chapter]}
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
  useSectionNavigation();
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    document.documentElement.classList.add('world-snap');
    const fragment = window.location.hash.slice(1);
    if (
      SECTION_COPY.some((section) => section.id === fragment) ||
      ['world-main', 'world-profile', 'world-contact'].includes(fragment)
    ) {
      document.getElementById(fragment)?.scrollIntoView();
    }
    /** Keep the reading backdrop independent of engine loading and motion policy. */
    function updateReadingBackdrop() {
      const profile = document.getElementById('world-profile');
      page.current?.toggleAttribute(
        'data-reading',
        !!profile &&
          profile.getBoundingClientRect().top <= window.innerHeight * 0.9,
      );
    }
    updateReadingBackdrop();
    window.addEventListener('scroll', updateReadingBackdrop, { passive: true });
    window.addEventListener('resize', updateReadingBackdrop);
    return () => {
      document.documentElement.classList.remove('world-snap');
      window.removeEventListener('scroll', updateReadingBackdrop);
      window.removeEventListener('resize', updateReadingBackdrop);
    };
  }, []);
  const introduction = SECTION_COPY[0]!;
  const projects = SECTION_COPY.slice(2);

  return (
    <div className="world-page" ref={page}>
      <a className="skip-link" href="#world-main" tabIndex={0}>
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
      <SectionAnchorRail />
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
          id="world-profile"
          className="world-profile world-section"
          aria-label="Experience and life outside work"
        >
          <div className="world-section-inner">
            <h2>About me</h2>
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
            className={`world-copy-section world-section world-workflow-section${section.id === 'world-iris' ? ' world-iris-section' : ''}`}
            aria-labelledby={`${section.id}-title`}
          >
            <div className="world-section-inner">
              <p className="world-eyebrow">
                <span>{String(index + 1).padStart(2, '0')} /</span>
                {section.id === 'world-workflow' ? 'Workflow' : 'Project'}
              </p>
              <h2 id={`${section.id}-title`}>{section.label}</h2>
              <p className="world-section-lead">{section.blocks[0]!.text}</p>
              <CopyBlocks
                blocks={section.blocks.slice(1, 3)}
                emphasis={SECTION_EMPHASIS[section.id]}
              />
              {section.blocks.length > 3 && (
                <details
                  className="world-copy-details"
                  onToggle={() => window.dispatchEvent(new Event('scroll'))}
                >
                  <summary>Read more about {section.label}</summary>
                  <CopyBlocks
                    blocks={section.blocks.slice(3)}
                    emphasis={SECTION_EMPHASIS[section.id]}
                  />
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
            <ScreenPoster
              chapter={MONITOR_CHAPTERS.find(
                (chapter) => section.id === `world-${chapter}`,
              )!}
            />
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
