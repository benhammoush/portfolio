/**
 * Regress the trusted pre-execution source boundary and its workflow ordering.
 * @file
 */
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { checkDeliverySource } from '../../scripts/check-delivery-source.mjs';

const source = 'a'.repeat(40);
afterEach(() => vi.unstubAllGlobals());

it('allows only verified merged source and fails closed before candidate execution', async () => {
  for (const status of [
    'ahead',
    'identical',
    'behind',
    'diverged',
    undefined,
  ]) {
    const network = vi.fn().mockResolvedValue({
      ok: true,
      /**
       * Model the provider's comparison result without external requests.
       * @returns The selected ancestry status fixture.
       */
      json: async () => ({ status }),
    });
    vi.stubGlobal('fetch', network);
    const result = checkDeliverySource(
      source,
      'owner/portfolio',
      'read-only-test-token',
    );
    if (['ahead', 'identical'].includes(status))
      await expect(result).resolves.toBeUndefined();
    else await expect(result).rejects.toThrow('Unmerged candidate');
    expect(network).toHaveBeenCalledWith(
      `https://api.github.com/repos/owner/portfolio/compare/${source}...main`,
      expect.objectContaining({ redirect: 'error' }),
    );
  }
});

it('rejects invalid inputs and unavailable GitHub evidence', async () => {
  const network = vi.fn().mockResolvedValue({ ok: false, status: 403 });
  vi.stubGlobal('fetch', network);
  await expect(
    checkDeliverySource('main', 'owner/portfolio', 'read'),
  ).rejects.toThrow();
  await expect(
    checkDeliverySource(source, 'owner/portfolio', ''),
  ).rejects.toThrow();
  expect(network).not.toHaveBeenCalled();
  await expect(
    checkDeliverySource(source, 'owner/portfolio', 'read'),
  ).rejects.toThrow('Source ancestry read failed');
});

it('delegates ancestry and candidate verification to the immutable shared guard before deployment', () => {
  const workflow = readFileSync(
    '.github/workflows/deploy-production.yml',
    'utf8',
  );
  expect(workflow).toMatch(
    /ci-cd-workflows\/\.github\/workflows\/verify-web.yml@[a-f0-9]{40}/,
  );
  expect(workflow).toContain('needs: verify_release');
  const beforeDeploy = workflow.slice(
    0,
    workflow.indexOf('\n  deploy_production:'),
  );
  expect(beforeDeploy).not.toContain('secrets.');
  expect(beforeDeploy).toContain('source_sha: ${{ inputs.sha }}');
});
