/**
 * Metadata validation boundary for future case studies; no published records yet.
 * Validation checks shape and dates, not claim truth, disclosure approval or rights.
 * @packageDocumentation
 */
import { z } from 'zod';

const nonemptyText = z.string().trim().min(1);
const publicUrl = z.url({ protocol: /^https$/ });

/** Metadata associated with one approved asset; rights are reviewed separately. */
export const mediaSchema = z.strictObject({
  src: nonemptyText,
  alt: nonemptyText,
  provenance: nonemptyText,
});

/** A dated public reference; presence is not independent verification of its claim. */
export const evidenceSchema = z.strictObject({
  label: nonemptyText,
  url: publicUrl,
  verifiedOn: z.iso.date(),
});

/** Required metadata for draft or final records, with no silent defaults or extra keys. */
export const projectSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: nonemptyText,
  summary: nonemptyText,
  capabilityTags: z.array(nonemptyText).min(1),
  outcomes: z.array(nonemptyText).min(1),
  deliveryState: z.enum([
    'Planned',
    'Implemented',
    'Merged',
    'Deployed',
    'Verified',
  ]),
  media: z.array(mediaSchema),
  evidence: z.array(evidenceSchema),
  limits: z.array(nonemptyText),
});

/** Parsed metadata shape; future release approval remains a separate content gate. */
export type ProjectMetadata = z.infer<typeof projectSchema>;

/**
 * Validate untrusted metadata without coercion or invented evidence.
 * @param input - A record read by a future content loader or an isolated test fixture.
 * @returns Strictly validated metadata, with surrounding text whitespace removed.
 * @throws A ZodError when fields, dates, public URLs or unknown keys are invalid.
 */
export function parseProjectMetadata(input: unknown): ProjectMetadata {
  return projectSchema.parse(input);
}
