/**
 * Trusted pre-execution source gate; candidate code must not run before this passes.
 * @file
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { sourceRevision } from './delivery-policy.mjs';

/**
 * Verify a selected SHA is already reachable from main using a read-only token.
 * This check runs before checkout/install of candidate code in the deployment job;
 * step-scoped secrets do not isolate a runner from earlier executable code.
 * @param source - Full selected source SHA, never a branch/tag/expression.
 * @param repository - Owning GitHub owner/name pair.
 * @param token - Read-only contents token, not a deployment credential.
 */
export async function checkDeliverySource(source, repository, token) {
  sourceRevision(source);
  assert.match(repository ?? '', /^[\w.-]+\/[\w.-]+$/);
  assert.ok(token, 'A read-only source verification token is required.');
  const response = await fetch(
    `https://api.github.com/repos/${repository}/compare/${source}...main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    },
  );
  assert.ok(response.ok, `Source ancestry read failed (${response.status}).`);
  const comparison = await response.json();
  assert.ok(
    ['ahead', 'identical'].includes(comparison.status),
    'Unmerged candidate rejected before execution.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
  await checkDeliverySource(
    process.env.SELECTED_SOURCE,
    process.env.GITHUB_REPOSITORY,
    process.env.GITHUB_TOKEN,
  );
}
