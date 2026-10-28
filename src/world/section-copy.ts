/**
 * Read the approved, deliberately small Markdown subset as plain React text.
 * @packageDocumentation
 */
import approvedCopy from '../../docs/homepage-content.md?raw';

/** A content block; HTML and arbitrary Markdown are never interpreted. */
export interface CopyBlock {
  /** Heading level or ordinary paragraph from the approved document. */
  kind: 'title' | 'subtitle' | 'paragraph';
  /** Exact wording, with paragraph line wraps normalized to spaces. */
  text: string;
}

/** One approved section and its native HTML identity. */
export interface CopySection {
  /** Stable fragment identifier, independent of a future scene's camera pose. */
  id: string;
  /** Human-readable section name. */
  label: string;
  /** Content from the approved source, excluding the separately rendered actions. */
  blocks: CopyBlock[];
}

const identities: Record<string, string> = {
  Introduction: 'world-hub',
  'Engineering workflow': 'world-workflow',
  Apollo: 'world-apollo',
  Iris: 'world-iris',
  'Crypto gateway': 'world-gateway',
  Dripperz: 'world-dripperz',
};

export const SECTION_COPY: CopySection[] = approvedCopy
  .split(/^## /m)
  .slice(1)
  .filter((section) => section.split('\n')[0].trim() in identities)
  .map((section) => {
    const [label, ...lines] = section.trim().split('\n');
    return {
      id: identities[label],
      label,
      blocks: lines
        .join('\n')
        .trim()
        .split(/\n\s*\n/)
        .filter((block) => !block.startsWith('**'))
        .map((block): CopyBlock => ({
          kind: block.startsWith('#### ')
            ? 'subtitle'
            : block.startsWith('### ')
              ? 'title'
              : 'paragraph',
          text: block.replace(/^#{3,4} /, '').replace(/\n/g, ' '),
        })),
    };
  });
