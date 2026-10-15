/**
 * Pure fail-closed delivery contracts shared by orchestration and regression tests.
 * @file
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

/**
 * Require an immutable full Git revision rather than a moving ref or expression.
 * @param value - Untrusted workflow source input.
 * @returns The validated source revision.
 */
export function sourceRevision(value) {
  assert.match(
    value ?? '',
    /^[a-f0-9]{40}$/,
    'A full lowercase source SHA is required.',
  );
  return value;
}

/**
 * Validate a configured HTTPS origin without allowing credentials or URL suffixes.
 * @param value - Configured application origin, never an arbitrary smoke-test URL.
 * @returns A canonical origin for same-origin read-only requests.
 */
export function applicationOrigin(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.username + url.password + url.search + url.hash, '');
  assert.equal(url.pathname, '/');
  return url.origin;
}

/**
 * Reject an automatic dev candidate if main advanced while checks/approval waited.
 * @param source - Candidate checked by this run.
 * @param main - Fresh main revision from GitHub.
 * @param automatic - Whether this is automatic main-to-dev delivery.
 */
export function assertCurrentSource(source, main, automatic) {
  sourceRevision(source);
  sourceRevision(main);
  assert.ok(
    !automatic || source === main,
    'Automatic dev candidate was superseded.',
  );
}

/**
 * Validate operator setup readback of native approval and explicit bypass policy.
 * The delivery controller relies on GitHub's gate, not runtime policy API checks.
 * @param environment - GitHub environment REST response, never inferred from YAML.
 */
export function assertProductionApproval(environment) {
  assert.equal(environment.name, 'production');
  assert.equal(
    environment.can_admins_bypass,
    false,
    'Administrator bypass must be disabled.',
  );
  const review = environment.protection_rules?.find(
    (rule) => rule.type === 'required_reviewers',
  );
  assert.ok(
    review?.reviewers?.length > 0,
    'Native required reviewers are missing.',
  );
  assert.equal(
    review.prevent_self_review,
    false,
    'The approved policy permits self-review.',
  );
}

/**
 * Fingerprint relevant non-secret hosting controls and a human-managed config epoch.
 * Project credentials/environment values must never be written into release records.
 * @param project - Provider project response; only supported disconnected projects qualify.
 * @param configuration - Explicit target, origin and configuration generation.
 * @returns A stable digest excluding mutable deployment pointers and timestamps.
 */
export function configurationDigest(project, configuration) {
  assert.ok(
    project.id && project.accountId,
    'Provider project identity is missing.',
  );
  assert.ok(
    !project.link,
    'Disconnect Vercel Git integration before enabling delivery.',
  );
  assert.ok(
    configuration.epoch,
    'A reviewed configuration generation is required.',
  );
  const snapshot = {
    project: project.id,
    account: project.accountId,
    sso: project.ssoProtection ?? null,
    password: project.passwordProtection ?? null,
    trustedIps: project.trustedIps ?? null,
    ...configuration,
  };
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

/**
 * Check the provider identity and metadata of the accepted, still-current dev candidate.
 * @param deployment - Provider deployment selected for promotion.
 * @param expected - Source, version, project, current pointer and configuration digest.
 */
export function assertDevCandidate(deployment, expected) {
  assert.equal(
    deployment.id,
    expected.deployment,
    'Dev deployment selection changed.',
  );
  assert.equal(
    deployment.id,
    expected.current,
    'Dev no longer serves the accepted candidate.',
  );
  assert.equal(deployment.projectId, expected.project);
  assert.equal(deployment.readyState, 'READY');
  assert.equal(deployment.meta?.portfolioSource, expected.source);
  assert.equal(deployment.meta?.portfolioVersion, expected.version);
  assert.equal(deployment.meta?.portfolioConfig, expected.configuration);
}

/**
 * Emit filesystem-first SPA routes with explicit asset errors and non-launch indexing.
 * @returns Vercel Build Output API version 3 configuration.
 */
export function hostingConfiguration() {
  return {
    version: 3,
    routes: [
      {
        src: '/(.*)',
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
        continue: true,
      },
      { handle: 'filesystem' },
      { src: '/assets(?:/.*)?', status: 404 },
      { src: '/.*\\.[^/]+/?', status: 404 },
      { src: '/(.*)', dest: '/index.html' },
    ],
  };
}
