/**
 * Authorized CI-only static delivery; no provisioning, implicit retries or rollback.
 * Secrets stay scoped to this step; provider responses are never logged wholesale.
 * @file
 */
import assert from 'node:assert/strict';
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  applicationOrigin,
  assertCurrentSource,
  assertDevCandidate,
  assertProductionApproval,
  assertRunApproval,
  configurationDigest,
  hostingConfiguration,
  sourceRevision,
} from './delivery-policy.mjs';

const env = process.env;

/**
 * Reject absent configuration without disclosing credential values.
 * @param name - Required environment variable name.
 * @returns Its nonempty value.
 */
function required(name) {
  assert.ok(env[name], `Missing ${name}.`);
  return env[name];
}

/**
 * Read fixed-origin APIs with explicit credentials, bounded time and no redirects.
 * @param provider - Either github or vercel, never supplied by workflow input.
 * @param path - Trusted relative API path.
 * @returns Parsed JSON from the successful response.
 */
async function api(provider, path) {
  const github = provider === 'github';
  const origin = github ? 'https://api.github.com' : 'https://api.vercel.com';
  const token = required(github ? 'POLICY_READ_TOKEN' : 'VERCEL_TOKEN');
  const suffix = github
    ? ''
    : `${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(required('VERCEL_ORG_ID'))}`;
  const response = await fetch(`${origin}${path}${suffix}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(
    response.ok,
    `${provider} readiness read failed (${response.status}).`,
  );
  return response.json();
}

/**
 * Append only explicitly selected non-secret identities to the retained run summary.
 * @param heading - Lifecycle checkpoint, including before a potentially failed mutation.
 * @param record - Sanitized deployment/recovery identities.
 */
function record(heading, record) {
  appendFileSync(
    required('GITHUB_STEP_SUMMARY'),
    `\n### ${heading}\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`,
  );
}

/**
 * Read hosted identity and basic routing without following redirects or mutating data.
 * @param origin - Explicit configured origin or verified provider deployment origin.
 * @param identity - Expected release identity generated before upload.
 * @param bypass - Optional approved automation access secret, sent only to this origin.
 */
async function smoke(origin, identity, bypass) {
  const base = applicationOrigin(origin);
  const headers = bypass ? { 'x-vercel-protection-bypass': bypass } : {};
  for (const path of [
    '/release.json',
    '/',
    '/not-a-portfolio-route',
    '/assets/not-a-real-bundle.js',
    '/not-a-real-icon.svg',
  ]) {
    const response = await fetch(`${base}${path}`, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    const missing = path.includes('not-a-real');
    assert.equal(
      response.status,
      missing ? 404 : 200,
      `Hosted route failed: ${path}`,
    );
    if (path === '/release.json') {
      const actual = await response.json();
      assert.deepEqual(
        actual,
        identity,
        'Hosted candidate/configuration identity changed.',
      );
    } else if (!missing) {
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
      assert.match(await response.text(), /<div id="root"><\/div>/);
    } else {
      assert.ok(
        !(await response.text()).includes('<div id="root">'),
        'Missing asset rewrote to the app.',
      );
    }
  }
}

/**
 * Verify source/policy/configuration, upload one prebuilt target, then read-only smoke.
 * Both target jobs share a mutation lock; external provider changes invalidate evidence.
 */
export async function deliver() {
  assert.equal(
    required('GITHUB_REF'),
    'refs/heads/main',
    'Run delivery workflows from main only.',
  );
  assert.equal(required('DELIVERY_ENABLED'), 'true', 'Delivery is disabled.');
  const target = required('DELIVERY_TARGET');
  assert.ok(['dev', 'production'].includes(target));
  const source = sourceRevision(required('SOURCE_SHA'));
  const repository = required('GITHUB_REPOSITORY');
  assert.match(repository, /^[\w.-]+\/[\w.-]+$/);
  const repoPath = `/repos/${repository}`;
  const projectId = required('VERCEL_PROJECT_ID');
  const devProjectId = required('DEV_PROJECT_ID');
  const productionProjectId = required('PRODUCTION_PROJECT_ID');
  assert.notEqual(
    devProjectId,
    productionProjectId,
    'Dev and production must be isolated projects.',
  );
  assert.equal(
    projectId,
    target === 'dev' ? devProjectId : productionProjectId,
  );
  const origin = applicationOrigin(required('TARGET_ORIGIN'));
  const epoch = required('DELIVERY_CONFIG_ID');
  const governance = new URL(required('READINESS_REFERENCE'));
  assert.equal(governance.protocol, 'https:');
  const comparison = await api(
    'github',
    `${repoPath}/compare/${source}...main`,
  );
  assert.ok(
    ['ahead', 'identical'].includes(comparison.status),
    'Source is not reachable from main.',
  );
  const currentMain = await api('github', `${repoPath}/git/ref/heads/main`);
  assertCurrentSource(
    source,
    currentMain.object.sha,
    env.GITHUB_EVENT_NAME === 'push',
  );
  assert.equal(
    execFileSync('git', ['-C', 'candidate', 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    source,
  );
  const { version } = JSON.parse(
    readFileSync('candidate/package.json', 'utf8'),
  );
  let project = await api(
    'vercel',
    `/v9/projects/${encodeURIComponent(projectId)}`,
  );
  assert.equal(project.id, projectId);
  assert.equal(project.accountId, required('VERCEL_ORG_ID'));
  const configuration = configurationDigest(project, { target, origin, epoch });
  const identity = {
    source,
    version,
    target,
    configuration,
    run: `${required('GITHUB_RUN_ID')}-${required('GITHUB_RUN_ATTEMPT')}`,
  };

  /**
   * Re-read the accepted dev candidate and native approval policy after any waiting.
   */
  async function verifyPromotion() {
    assert.equal(
      required('GITHUB_RUN_ATTEMPT'),
      '1',
      'Production retries require a new dispatch and approval.',
    );
    const environment = await api(
      'github',
      `${repoPath}/environments/production`,
    );
    assertProductionApproval(environment);
    assertRunApproval(
      environment,
      await api(
        'github',
        `${repoPath}/actions/runs/${required('GITHUB_RUN_ID')}/approvals`,
      ),
    );
    const devProject = await api(
      'vercel',
      `/v9/projects/${encodeURIComponent(devProjectId)}`,
    );
    assert.equal(devProject.id, devProjectId);
    const devOrigin = applicationOrigin(required('DEV_ORIGIN'));
    const devConfiguration = configurationDigest(devProject, {
      target: 'dev',
      origin: devOrigin,
      epoch: required('DEV_CONFIG_ID'),
    });
    const candidateId = required('DEV_DEPLOYMENT_ID');
    assert.match(candidateId, /^dpl_[a-zA-Z0-9]+$/);
    const deployment = await api('vercel', `/v13/deployments/${candidateId}`);
    assertDevCandidate(deployment, {
      deployment: candidateId,
      current: devProject.targets?.production?.id,
      project: devProjectId,
      source,
      version,
      configuration: devConfiguration,
    });
    const acceptance = new URL(required('DEV_ACCEPTANCE_REFERENCE'));
    assert.equal(acceptance.protocol, 'https:');
    const devIdentity = {
      source,
      version,
      target: 'dev',
      configuration: devConfiguration,
      run: deployment.meta.portfolioRun,
    };
    await smoke(devOrigin, devIdentity, env.DEV_SMOKE_BYPASS);
    record('Dev candidate revalidated (human acceptance must be reviewed)', {
      deployment: candidateId,
      ...devIdentity,
      acceptance: acceptance.href,
    });
  }

  if (target === 'production') await verifyPromotion();
  // Own generated output only; repository source/configuration is never uploaded.
  mkdirSync('.vercel/output', { recursive: true });
  cpSync('candidate/dist', '.vercel/output/static', { recursive: true });
  writeFileSync(
    '.vercel/output/static/release.json',
    `${JSON.stringify(identity)}\n`,
  );
  writeFileSync(
    '.vercel/output/config.json',
    JSON.stringify(hostingConfiguration()),
  );
  writeFileSync(
    '.vercel/project.json',
    JSON.stringify({ orgId: required('VERCEL_ORG_ID'), projectId }),
  );

  // Final read immediately before mutation, inside the shared target mutation lock.
  const latestMain = await api('github', `${repoPath}/git/ref/heads/main`);
  assertCurrentSource(
    source,
    latestMain.object.sha,
    env.GITHUB_EVENT_NAME === 'push',
  );
  project = await api(
    'vercel',
    `/v9/projects/${encodeURIComponent(projectId)}`,
  );
  assert.equal(
    configurationDigest(project, { target, origin, epoch }),
    configuration,
    'Target configuration drifted.',
  );
  if (target === 'production') await verifyPromotion();
  const previous = project.targets?.production?.id ?? null;
  record('Before target mutation — retain for recovery', {
    project: projectId,
    origin,
    previous,
    ...identity,
    readiness: governance.href,
  });
  // Pinned CLI; no latest tool resolution, project linking, remote build or source upload.
  const output = execFileSync(
    'npm',
    [
      'exec',
      '--yes',
      '--package=vercel@64.2.0',
      '--',
      'vercel',
      'deploy',
      '--prebuilt',
      '--prod',
      '--yes',
      '--token',
      required('VERCEL_TOKEN'),
      '--meta',
      `portfolioSource=${source}`,
      '--meta',
      `portfolioVersion=${version}`,
      '--meta',
      `portfolioConfig=${configuration}`,
      '--meta',
      `portfolioRun=${identity.run}`,
    ],
    {
      encoding: 'utf8',
      timeout: 600_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ).trim();
  const deployedOrigin = applicationOrigin(output);
  assert.ok(new URL(deployedOrigin).hostname.endsWith('.vercel.app'));
  const deployment = await api(
    'vercel',
    `/v13/deployments/${encodeURIComponent(new URL(deployedOrigin).hostname)}`,
  );
  assert.equal(deployment.projectId, projectId);
  assert.equal(deployment.readyState, 'READY');
  record('Deployment created — smoke/acceptance still required', {
    deployment: deployment.id,
    previous,
    origin,
    providerOrigin: deployedOrigin,
    ...identity,
  });
  const after = await api(
    'vercel',
    `/v9/projects/${encodeURIComponent(projectId)}`,
  );
  assert.equal(
    configurationDigest(after, { target, origin, epoch }),
    configuration,
    'Target configuration changed during deployment.',
  );
  assert.equal(
    after.targets?.production?.id,
    deployment.id,
    'Target changed during deployment.',
  );
  await smoke(deployedOrigin, identity, env.SMOKE_BYPASS);
  await smoke(origin, identity, env.SMOKE_BYPASS);
  record(
    'Read-only HTTP smoke passed — not human or public-launch acceptance',
    { deployment: deployment.id, previous, ...identity },
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  deliver().catch(() => {
    // Do not dump subprocess output or provider bodies: either may contain secrets.
    console.error(
      'Delivery stopped. Inspect the last sanitized run-summary checkpoint; do not retry or roll back blindly.',
    );
    process.exitCode = 1;
  });
