/**
 * Static chapter-cue comparisons using one existing poster, without a 3D engine.
 * @packageDocumentation
 */
import introPoster from '../assets/intro/intro-scene.png';
import { SECTION_COPY } from '../world/section-copy';
import ScreenStudyPanel from './ScreenStudyPanel';
import './scene-study.css';

/** Only the three review states are authorized; these are not product demos. */
type StudyChapter = 'intro' | 'workflow' | 'iris';

/** Route-owned selection keeps each static comparison independently addressable. */
interface SceneStudyProps {
  /** Chapter whose small decorative cue is being proposed. */
  chapter: StudyChapter;
}

const STUDIES = {
  intro: {
    label: 'Introduction',
    id: 'world-hub',
    href: '/scene-study',
    cue: 'Baseline: the existing desk, with no additions.',
  },
  workflow: {
    label: 'Workflow',
    id: 'world-workflow',
    href: '/scene-study/workflow',
    cue: 'Proposed cue: a small plan/build/check panel on screen; no extra desk objects.',
  },
  iris: {
    label: 'Iris',
    id: 'world-iris',
    href: '/scene-study/iris',
    cue: 'Proposed cue: a small markets/wallets/watchlist panel; no extra desk objects.',
  },
};

/**
 * Add only small, original vector cues to the accepted, unchanged desk poster.
 * The panel occupies the exposed right screen area, never the character/props.
 * @param props - Selected cue; schematic panels are not real product screenshots.
 * @returns Decorative still artwork whose meaning is explained in HTML.
 */
function DeskStudy(props: SceneStudyProps) {
  return (
    <svg className="scene-cue-art" viewBox="0 0 1200 900" aria-hidden="true">
      <image href={introPoster} width="1200" height="900" />
      {props.chapter !== 'intro' && (
        <g data-cue={props.chapter}>
          <svg x="663" y="220" width="170" height="151" viewBox="0 0 240 216">
            <ScreenStudyPanel chapter={props.chapter} />
          </svg>
        </g>
      )}
    </svg>
  );
}

/**
 * Compare quiet chapter-specific details while approved copy remains primary.
 * @param props - The static state requested by an explicit local review route.
 * @returns Readable chapter content and a subordinate scene cue, with no WebGL.
 */
export default function SceneStudyPage(props: SceneStudyProps) {
  const study = STUDIES[props.chapter];
  const section = SECTION_COPY.find((candidate) => candidate.id === study.id)!;
  const paragraphs =
    props.chapter === 'intro'
      ? section.blocks.slice(1, 2)
      : section.blocks.slice(1);

  return (
    <div className="scene-study">
      <a className="skip-link" href="#scene-study-main" tabIndex={0}>
        Skip to section study
      </a>
      <header className="scene-study-toolbar">
        <div>
          <p>Section cue study · Static artwork · Not live 3D</p>
          <a href="/">Return to the accepted homepage ↗</a>
        </div>
        <nav aria-label="Section studies">
          {(Object.keys(STUDIES) as StudyChapter[]).map((chapter) => (
            <a
              key={chapter}
              href={STUDIES[chapter].href}
              aria-current={props.chapter === chapter ? 'page' : undefined}
            >
              {STUDIES[chapter].label}
            </a>
          ))}
        </nav>
      </header>
      <main
        className="container scene-study-main"
        id="scene-study-main"
        tabIndex={-1}
      >
        <article className="scene-study-copy">
          <p className="scene-study-label">{section.label}</p>
          <h1>{section.blocks[0]!.text}</h1>
          {paragraphs.map((block) => (
            <p key={block.text}>{block.text}</p>
          ))}
          <a className="scene-study-link" href={`/#${study.id}`}>
            Read this section on the homepage ↗
          </a>
        </article>
        <figure className="scene-study-figure">
          <DeskStudy chapter={props.chapter} />
          <figcaption>
            <p>{study.cue}</p>
            {props.chapter === 'workflow' && (
              <p>
                <a href="/screen-study/workflow">
                  Review the detailed Workflow screen ↗
                </a>
              </p>
            )}
            <p>
              Schematic cues only, not product UI or live activity. The accepted
              hero is unchanged.
            </p>
            {props.chapter !== 'intro' && (
              <details className="scene-study-inspector">
                <summary>Inspect screen concept</summary>
                <p>
                  Review-only close-up of the same panel. It stays small on the
                  desk.
                </p>
                <svg viewBox="0 0 240 216" aria-hidden="true">
                  <ScreenStudyPanel chapter={props.chapter} />
                </svg>
              </details>
            )}
          </figcaption>
        </figure>
      </main>
    </div>
  );
}
