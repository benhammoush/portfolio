/**
 * Workspace identities, approved copy and illustrative media, independent of WebGL.
 * @packageDocumentation
 */
import { SECTION_COPY } from './section-copy';
import apollo from '../assets/apollo/apollo-screen.svg?url';
import iris from '../assets/iris/iris-screen.svg?url';
import gateway from '../assets/gateway/gateway-screen.svg?url';
import dripperz from '../assets/dripperz/dripperz-screen.svg?url';

/** Stable project keys retain existing deep links. */
export type ProjectId = 'apollo' | 'iris' | 'gateway' | 'dripperz';
/** About me is the default explorer pane alongside the four project views. */
export type WorkspaceView = ProjectId | 'about';

/** Read one canonical Markdown section, failing loudly on missing content.
 * @param id - Stable section identity.
 * @returns The approved, parsed section.
 */
export function copySection(id: string) {
  const section = SECTION_COPY.find((item) => item.id === id);
  if (!section) throw new Error(`Missing portfolio copy: ${id}`);
  return section;
}

/** Project metadata, with prose read exclusively from the approved document. */
export const PROJECTS = (
  [
    {
      id: 'apollo',
      image: apollo,
      stack: 'React / TypeScript / Python / FastAPI',
    },
    {
      id: 'iris',
      image: iris,
      stack: 'React / TypeScript / Cloudflare Workers / Firebase',
    },
    {
      id: 'gateway',
      image: gateway,
      stack: 'React / TypeScript / Cloudflare Workers / Solana',
    },
    {
      id: 'dripperz',
      image: dripperz,
      stack: 'React / TypeScript / Python / Solidity',
    },
  ] as const
).map((project) => ({
  ...project,
  label: copySection(`world-${project.id}`).label,
  description: copySection(`world-${project.id}`).blocks[0].text,
}));

export const WORKFLOW = copySection('world-workflow');
export const WORKFLOW_STEPS = WORKFLOW.blocks
  .slice(2)
  .filter((block) => block.kind === 'subtitle')
  .map((block) => ({
    title: block.text,
    description: WORKFLOW.blocks[WORKFLOW.blocks.indexOf(block) + 1].text,
  }));

/** Resolve historical fragments so existing bookmarks can redirect to clean routes.
 * @param hash - Browser fragment, including its optional hash prefix.
 * @returns A workspace view, or null for the landing page.
 */
export function workspaceViewFromHash(hash: string): WorkspaceView | null {
  const id = hash.replace(/^#/, '');
  if (
    [
      'world-about',
      'world-profile',
      'world-workflow',
      'world-contact',
      'world-main',
    ].includes(id)
  )
    return 'about';
  if (id === 'world-projects') return 'about';
  return PROJECTS.find((project) => `world-${project.id}` === id)?.id ?? null;
}

/** Canonical public destination for an explorer view.
 * @param view - About me or a known project.
 * @returns A clean path consumed by the router and native links.
 */
export function workspacePath(view: WorkspaceView): string {
  return view === 'about' ? '/about' : `/projects/${view}`;
}
