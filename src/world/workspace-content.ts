/**
 * Workspace identities, approved copy and preview media, independent of WebGL.
 * @packageDocumentation
 */
import { SECTION_COPY } from './section-copy';
import apollo from '../assets/apollo/apollo-screenshot.png?url';
import iris from '../assets/iris/iris-screenshot.png?url';
import gateway from '../assets/gateway/gateway-screenshot.png?url';
import dripperz from '../assets/dripperz/dripperz-screenshot.png?url';

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
      productionUrl: 'https://apollo-frontend-lime.vercel.app/',
      frontendUrl: 'https://github.com/benhammoush/apollo-frontend',
      backendUrl: 'https://github.com/benhammoush/apollo-backend',
      image: apollo,
      imageWidth: 1917,
      imageHeight: 914,
      imageAlt:
        'Apollo trading workspace screenshot with EUR/USD charts, a data table and example job logs',
      stack: 'React / TypeScript / Python / FastAPI',
    },
    {
      id: 'iris',
      productionUrl: 'https://iris-frontend-production.vercel.app/',
      frontendUrl: 'https://github.com/benhammoush/iris-frontend',
      backendUrl: 'https://github.com/benhammoush/iris-backend',
      image: iris,
      imageWidth: 1918,
      imageHeight: 913,
      imageAlt:
        'Iris dashboard screenshot showing token discovery, Solana network activity and DeFi protocols',
      stack: 'React / TypeScript / Cloudflare Workers / Firebase',
    },
    {
      id: 'gateway',
      productionUrl: 'https://crypto-gateway-production.vercel.app/',
      frontendUrl: 'https://github.com/benhammoush/crypto_gateway_frontend',
      backendUrl: 'https://github.com/benhammoush/crypto_gateway_backend',
      image: gateway,
      imageWidth: 1919,
      imageHeight: 909,
      imageAlt:
        'Solana Payments checkout screenshot showing payment link creation, wallet approval and on-chain verification on Devnet',
      stack: 'React / TypeScript / Cloudflare Workers / Solana',
    },
    {
      id: 'dripperz',
      productionUrl: 'https://dripperz-production.vercel.app/',
      frontendUrl: 'https://github.com/benhammoush/dripperz',
      backendUrl: null,
      image: dripperz,
      imageWidth: 1917,
      imageHeight: 903,
      imageAlt:
        'Dripperz Cyber Club website screenshot with three cyberpunk characters and the Enter the Cyberclub heading',
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
