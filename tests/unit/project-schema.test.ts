/**
 * Synthetic metadata fixtures: no record here is production portfolio content.
 * @packageDocumentation
 */
import { describe, expect, test } from 'vitest';
import { parseProjectMetadata } from '../../src/content/project-schema';

const fixture = {
  slug: 'fixture-project',
  title: 'Fixture project',
  summary: 'Synthetic schema test, not a public claim.',
  capabilityTags: ['TypeScript'],
  outcomes: ['Readable evidence'],
  deliveryState: 'Planned',
  media: [
    {
      src: '/fixture.png',
      alt: 'Synthetic image',
      provenance: 'Test-only fixture',
    },
  ],
  evidence: [
    {
      label: 'Synthetic reference',
      url: 'https://example.com/evidence',
      verifiedOn: '2026-10-14',
    },
  ],
  limits: ['Not published'],
};

describe('metadata boundary', () => {
  test('accepts a complete record and trims text', () => {
    expect(
      parseProjectMetadata({ ...fixture, title: ' Fixture project ' }).title,
    ).toBe('Fixture project');
  });

  test.each([
    { slug: '../private' },
    { title: '   ' },
    { summary: '' },
    { capabilityTags: [] },
    { outcomes: [] },
    { deliveryState: 'Launched' },
    { media: [{ src: '/fixture.png', alt: '', provenance: 'Test' }] },
    {
      evidence: [
        {
          label: 'Reference',
          url: 'javascript:alert(1)',
          verifiedOn: '2026-10-14',
        },
      ],
    },
    {
      evidence: [
        {
          label: 'Reference',
          url: 'https://example.com',
          verifiedOn: '2026-02-30',
        },
      ],
    },
    { unexpected: true },
  ])('rejects invalid metadata: %j', (change) => {
    expect(() => parseProjectMetadata({ ...fixture, ...change })).toThrow();
  });

  test('rejects missing required fields', () => {
    expect(() => parseProjectMetadata({ slug: 'fixture-project' })).toThrow();
  });
});
