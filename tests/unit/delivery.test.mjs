/**
 * Negative-first delivery authorization, candidate and static-hosting regressions.
 * @file
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  applicationOrigin,
  assertCurrentSource,
  assertDevCandidate,
  assertProductionApproval,
  configurationDigest,
  hostingConfiguration,
  sourceRevision,
} from '../../scripts/delivery-policy.mjs';

const source = 'a'.repeat(40);
const project = { id: 'prj_dev', accountId: 'team_test', link: null };
const configuration = {
  target: 'dev',
  origin: 'https://dev.example.com',
  epoch: 'reviewed-1',
};
const approval = {
  name: 'production',
  can_admins_bypass: false,
  protection_rules: [
    {
      type: 'required_reviewers',
      prevent_self_review: false,
      reviewers: [{ type: 'User', reviewer: { id: 1 } }],
    },
  ],
};
const expected = {
  deployment: 'dpl_test',
  current: 'dpl_test',
  project: 'prj_dev',
  source,
  version: '0.1.0',
  configuration: 'digest',
};
const deployment = {
  id: 'dpl_test',
  projectId: 'prj_dev',
  readyState: 'READY',
  meta: {
    portfolioSource: source,
    portfolioVersion: '0.1.0',
    portfolioConfig: 'digest',
  },
};

it('wires only the target deployment credential without enabling delivery', () => {
  const workflow = readFileSync('.github/workflows/delivery.yml', 'utf8');
  expect(workflow).toContain('VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}');
  expect(workflow).not.toContain('DEV_VERCEL_TOKEN');
  expect(workflow).not.toContain('DEV_SMOKE_BYPASS');
  expect(workflow).toContain('inputs.sha || github.sha');
  expect(workflow).toContain("vars.DELIVERY_ENABLED == 'true'");
});

describe('immutable source and safe application origin', () => {
  it('accepts only complete immutable revisions', () => {
    expect(sourceRevision(source)).toBe(source);
    for (const input of [
      '',
      'main',
      'v1.0',
      source.slice(1),
      `${source};echo bad`,
      undefined,
    ]) {
      expect(() => sourceRevision(input)).toThrow();
    }
  });
  it('rejects superseded automatic candidates but permits explicit merged redeployments', () => {
    expect(() => assertCurrentSource(source, source, true)).not.toThrow();
    expect(() => assertCurrentSource(source, 'b'.repeat(40), true)).toThrow();
    expect(() =>
      assertCurrentSource(source, 'b'.repeat(40), false),
    ).not.toThrow();
  });
  it('allows only credential-free HTTPS origins', () => {
    expect(applicationOrigin('https://dev.example.com/')).toBe(
      'https://dev.example.com',
    );
    for (const input of [
      'http://dev.example.com',
      'https://user:secret@dev.example.com',
      'https://dev.example.com/path',
      'https://dev.example.com/?token=x',
      'https://dev.example.com/#x',
    ]) {
      expect(() => applicationOrigin(input)).toThrow();
    }
  });
});

describe('operator setup validator for native production approval', () => {
  it('accepts the explicit required-reviewer and administrator policy', () => {
    expect(() => assertProductionApproval(approval)).not.toThrow();
  });
  it('fails closed on missing/unsupported controls or bypass', () => {
    for (const input of [
      {},
      { ...approval, name: 'dev' },
      { ...approval, can_admins_bypass: true },
      { ...approval, can_admins_bypass: undefined },
      { ...approval, protection_rules: [] },
      {
        ...approval,
        protection_rules: [{ type: 'required_reviewers', reviewers: [] }],
      },
      {
        ...approval,
        protection_rules: [
          { ...approval.protection_rules[0], prevent_self_review: true },
        ],
      },
    ])
      expect(() => assertProductionApproval(input)).toThrow();
  });
});

describe('reviewed configuration and candidate identity', () => {
  it('excludes mutable pointers but detects relevant protection/configuration changes', () => {
    const digest = configurationDigest(project, configuration);
    expect(
      configurationDigest(
        {
          ...project,
          updatedAt: 42,
          targets: { production: { id: 'dpl_other' } },
        },
        configuration,
      ),
    ).toBe(digest);
    expect(
      configurationDigest(
        { ...project, ssoProtection: { deploymentType: 'all' } },
        configuration,
      ),
    ).not.toBe(digest);
    expect(
      configurationDigest(project, { ...configuration, epoch: 'reviewed-2' }),
    ).not.toBe(digest);
    expect(
      configurationDigest(project, {
        ...configuration,
        origin: 'https://other.example.com',
      }),
    ).not.toBe(digest);
    expect(() =>
      configurationDigest(project, { ...configuration, epoch: '' }),
    ).toThrow();
    expect(() =>
      configurationDigest(
        { ...project, link: { type: 'github' } },
        configuration,
      ),
    ).toThrow();
  });
  it('rejects dev drift, wrong provider project, version, source or configuration', () => {
    expect(() => assertDevCandidate(deployment, expected)).not.toThrow();
    for (const changed of [
      { ...expected, current: 'dpl_other' },
      { ...expected, project: 'prj_production' },
      { ...expected, source: 'b'.repeat(40) },
      { ...expected, version: '0.2.0' },
      { ...expected, configuration: 'changed' },
    ])
      expect(() => assertDevCandidate(deployment, changed)).toThrow();
    expect(() =>
      assertDevCandidate({ ...deployment, readyState: 'ERROR' }, expected),
    ).toThrow();
    expect(() =>
      assertDevCandidate({ ...deployment, meta: {} }, expected),
    ).toThrow();
  });
});

it('hosts files before SPA fallback and rejects missing assets and file-like paths', () => {
  const config = hostingConfiguration();
  expect(config.version).toBe(3);
  expect(config.routes[0].headers['X-Robots-Tag']).toContain('noindex');
  expect(config.routes[1]).toEqual({ handle: 'filesystem' });
  const assetRule = new RegExp(`^${config.routes[2].src}$`);
  const fileRule = new RegExp(`^${config.routes[3].src}$`);
  for (const path of ['/assets', '/assets/missing', '/assets/missing.js'])
    expect(assetRule.test(path)).toBe(true);
  for (const path of ['/missing.svg', '/missing.json/', '/deep/missing.html'])
    expect(fileRule.test(path)).toBe(true);
  for (const path of ['/', '/projects/iris', '/unknown-route']) {
    expect(assetRule.test(path) || fileRule.test(path)).toBe(false);
  }
  expect(config.routes.at(-1).dest).toBe('/index.html');
});
