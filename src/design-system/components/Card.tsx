/**
 * Shared article surface without knowledge of portfolio content or layout.
 * @packageDocumentation
 */

import type { ComponentPropsWithoutRef } from 'react';

/** Render an article surface while preserving native attributes and children.
 * @param props - Native article content, attributes and optional extra class names.
 * @returns A reusable card; its parent owns placement and its feature owns content.
 */
export function Card(props: ComponentPropsWithoutRef<'article'>) {
  const { className = '', ...attributes } = props;
  return <article {...attributes} className={`card ${className}`.trim()} />;
}
