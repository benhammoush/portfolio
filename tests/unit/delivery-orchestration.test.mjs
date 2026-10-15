/**
 * Mock provider/CLI boundaries to prove delivery ordering without external mutations.
 * @file
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { configurationDigest } from '../../scripts/delivery-policy.mjs';

const mocks = vi.hoisted(() => ({
  exec: vi.fn(),
  summary: vi.fn(),
  write: vi.fn(),
  copy: vi.fn(),
}));
vi.mock('node:child_process', () => ({ execFileSync: mocks.exec }));
vi.mock('node:fs', () => ({
  appendFileSync: mocks.summary,
  writeFileSync: mocks.write,
  cpSync: mocks.copy,
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => JSON.stringify({ version: '0.1.0' })),
}));
import { deliver } from '../../scripts/delivery.mjs';

const source = 'a'.repeat(40);
let state;

/**
 * Serve deterministic GET-only provider/application fixtures and reject unknown paths.
 * @param input - Requested URL from the orchestrator.
 * @param options - Fetch options including credentials and redirect restrictions.
 * @returns A minimal fetch-compatible response, never an external network request.
 */
async function response(input, options) {
  expect(options.redirect).toBe('error');
  expect(options.method).toBeUndefined();
  const url = new URL(input);
  let body;
  let status = 200;
  if (url.hostname === 'api.github.com') {
    if (url.pathname.endsWith('/compare/' + source + '...main'))
      body = { status: state.comparison };
    else if (url.pathname.endsWith('/git/ref/heads/main'))
      body = { object: { sha: state.main } };
    else if (url.pathname.endsWith('/environments/production'))
      body = state.approval;
    else if (url.pathname.endsWith('/actions/runs/12/approvals'))
      body = state.reviews;
  } else if (url.hostname === 'api.vercel.com') {
    if (url.pathname === '/v9/projects/prj_dev') body = state.devProject;
    else if (url.pathname === '/v9/projects/prj_prod') body = state.prodProject;
    else if (url.pathname === '/v13/deployments/dpl_accepted')
      body = state.accepted;
    else if (url.pathname === '/v13/deployments/build.vercel.app') {
      body = {
        id: 'dpl_new',
        projectId: process.env.VERCEL_PROJECT_ID,
        readyState: 'READY',
      };
    }
  } else {
    expect(options.headers.Authorization).toBeUndefined();
    if (url.pathname === '/release.json') {
      const isDevAcceptance =
        process.env.DELIVERY_TARGET === 'production' &&
        url.hostname === 'dev.example.com';
      body = isDevAcceptance ? state.devIdentity : state.identity;
    } else if (url.pathname.includes('not-a-real')) {
      status = state.badAsset ? 200 : 404;
      body = 'Asset not found';
    } else if (['/', '/not-a-portfolio-route'].includes(url.pathname))
      body = '<div id="root"></div>';
  }
  if (body === undefined)
    throw new Error(`Unmocked URL ${url.origin}${url.pathname}`);
  return {
    ok: status === 200,
    status,
    /**
     * Return the fixture's decoded JSON without involving network/body streams.
     * @returns The selected provider or identity fixture.
     */
    json: async () => body,
    /**
     * Return the fixture body for routing checks.
     * @returns The static shell or controlled missing-asset text.
     */
    text: async () => body,
    headers: {
      /**
       * Model the non-launch header supplied by hosted routing.
       * @returns The no-index directive required by smoke checks.
       */
      get: () => 'noindex, nofollow',
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  const values = {
    GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'push',
    DELIVERY_ENABLED: 'true',
    DELIVERY_TARGET: 'dev',
    SOURCE_SHA: source,
    GITHUB_REPOSITORY: 'owner/portfolio',
    VERCEL_ORG_ID: 'team_test',
    VERCEL_PROJECT_ID: 'prj_dev',
    DEV_PROJECT_ID: 'prj_dev',
    PRODUCTION_PROJECT_ID: 'prj_prod',
    TARGET_ORIGIN: 'https://dev.example.com',
    DELIVERY_CONFIG_ID: 'config-1',
    DEV_CONFIG_ID: 'config-1',
    DEV_ORIGIN: 'https://dev.example.com',
    READINESS_REFERENCE: 'https://example.com/readiness',
    POLICY_READ_TOKEN: 'test-policy',
    VERCEL_TOKEN: 'test-vercel',
    GITHUB_RUN_ID: '12',
    GITHUB_RUN_ATTEMPT: '1',
    GITHUB_STEP_SUMMARY: 'test-summary',
    DEV_DEPLOYMENT_ID: 'dpl_accepted',
    DEV_ACCEPTANCE_REFERENCE: 'https://example.com/acceptance',
  };
  for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
  const devProject = {
    id: 'prj_dev',
    accountId: 'team_test',
    targets: { production: { id: 'dpl_accepted' } },
  };
  const digest = configurationDigest(devProject, {
    target: 'dev',
    origin: values.DEV_ORIGIN,
    epoch: 'config-1',
  });
  const devIdentity = {
    source,
    version: '0.1.0',
    target: 'dev',
    configuration: digest,
    run: '12-1',
  };
  state = {
    comparison: 'identical',
    main: source,
    devProject,
    prodProject: {
      id: 'prj_prod',
      accountId: 'team_test',
      targets: { production: { id: 'dpl_prior' } },
    },
    devIdentity,
    identity: devIdentity,
    accepted: {
      id: 'dpl_accepted',
      projectId: 'prj_dev',
      readyState: 'READY',
      meta: {
        portfolioSource: source,
        portfolioVersion: '0.1.0',
        portfolioConfig: digest,
        portfolioRun: '12-1',
      },
    },
    approval: {
      id: 42,
      name: 'production',
      can_admins_bypass: false,
      protection_rules: [
        {
          type: 'required_reviewers',
          prevent_self_review: false,
          reviewers: [{ type: 'User' }],
        },
      ],
    },
    reviews: [
      {
        state: 'approved',
        user: { login: 'reviewer' },
        environments: [{ id: 42 }],
      },
    ],
  };
  mocks.exec.mockImplementation((command) => {
    if (command === 'git') return source;
    expect(command).toBe('npm');
    expect(mocks.summary).toHaveBeenCalled();
    const targetProject =
      process.env.DELIVERY_TARGET === 'dev'
        ? state.devProject
        : state.prodProject;
    targetProject.targets.production.id = 'dpl_new';
    return 'https://build.vercel.app';
  });
  vi.stubGlobal('fetch', vi.fn(response));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/**
 * Select a manually approved production fixture without changing dev acceptance.
 */
function selectProduction() {
  vi.stubEnv('GITHUB_EVENT_NAME', 'workflow_dispatch');
  vi.stubEnv('DELIVERY_TARGET', 'production');
  vi.stubEnv('VERCEL_PROJECT_ID', 'prj_prod');
  vi.stubEnv('TARGET_ORIGIN', 'https://portfolio.example.com');
  state.identity = {
    ...state.devIdentity,
    target: 'production',
    configuration: configurationDigest(state.prodProject, {
      target: 'production',
      origin: 'https://portfolio.example.com',
      epoch: 'config-1',
    }),
  };
}

it('records prior identity before exactly one dev mutation and completes read-only smoke', async () => {
  await deliver();
  const mutations = mocks.exec.mock.calls.filter(
    ([command]) => command === 'npm',
  );
  expect(mutations).toHaveLength(1);
  expect(mutations[0][1]).toContain('--prebuilt');
  expect(mocks.copy).toHaveBeenCalledWith(
    'candidate/dist',
    '.vercel/output/static',
    { recursive: true },
  );
  expect(mocks.summary.mock.calls[0][1]).toContain('dpl_accepted');
  expect(mocks.summary.mock.calls.at(-1)[1]).toContain('HTTP smoke passed');
});

it('does not mutate on disabled delivery, non-main execution, unmerged or superseded source', async () => {
  for (const [name, value] of [
    ['DELIVERY_ENABLED', 'false'],
    ['GITHUB_REF', 'refs/heads/feature'],
  ]) {
    const original = process.env[name];
    vi.stubEnv(name, value);
    await expect(deliver()).rejects.toThrow();
    vi.stubEnv(name, original);
  }
  state.comparison = 'diverged';
  await expect(deliver()).rejects.toThrow('not reachable');
  state.comparison = 'identical';
  state.main = 'b'.repeat(40);
  await expect(deliver()).rejects.toThrow('superseded');
  expect(
    mocks.exec.mock.calls.filter(([command]) => command === 'npm'),
  ).toHaveLength(0);
});

it.each([
  ['DEV_ORIGIN', 'https://other.example.com'],
  ['DEV_ORIGIN', ''],
  ['DEV_CONFIG_ID', 'config-2'],
  ['DEV_CONFIG_ID', ''],
])(
  'rejects inconsistent or missing dev promotion configuration: %s=%s',
  async (name, value) => {
    vi.stubEnv(name, value);
    await expect(deliver()).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.exec).not.toHaveBeenCalled();
    expect(mocks.copy).not.toHaveBeenCalled();
  },
);

it('fails closed when production policy is unavailable or dev acceptance drifted', async () => {
  selectProduction();
  state.approval = {};
  await expect(deliver()).rejects.toThrow();
  state.approval = {
    id: 42,
    name: 'production',
    can_admins_bypass: false,
    protection_rules: [
      {
        type: 'required_reviewers',
        prevent_self_review: false,
        reviewers: [{}],
      },
    ],
  };
  state.devProject.targets.production.id = 'dpl_drift';
  await expect(deliver()).rejects.toThrow('no longer serves');
  expect(
    mocks.exec.mock.calls.filter(([command]) => command === 'npm'),
  ).toHaveLength(0);
});

it('revalidates accepted dev identity before production mutation', async () => {
  selectProduction();
  await deliver();
  const policyReads = fetch.mock.calls.filter(([url]) =>
    url.endsWith('/environments/production'),
  );
  expect(policyReads).toHaveLength(2);
  expect(
    mocks.summary.mock.calls.some(([, text]) => text.includes('dpl_prior')),
  ).toBe(true);
  expect(
    mocks.exec.mock.calls.filter(([command]) => command === 'npm'),
  ).toHaveLength(1);
});

it('retains recovery checkpoints and never retries after hosted smoke fails', async () => {
  state.badAsset = true;
  await expect(deliver()).rejects.toThrow('Hosted route failed');
  expect(
    mocks.exec.mock.calls.filter(([command]) => command === 'npm'),
  ).toHaveLength(1);
  expect(
    mocks.summary.mock.calls.some(([, text]) =>
      text.includes('Deployment created'),
    ),
  ).toBe(true);
});
