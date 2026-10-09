import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { MAINNET_CONFIRMATION_PHRASE } from '../../deployment/src/guard.ts';
import { REPO_ROOT } from '../../token/src/guards.ts';

function run(script: string, args: string[], env: Record<string, string> = {}) {
  // Minimal environment: no inherited CI flags or credentials leak into the child.
  const result = spawnSync(process.execPath, [join(REPO_ROOT, script), ...args], {
    env: { PATH: process.env['PATH'] ?? '', ...env },
    encoding: 'utf8',
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

const DEPLOY = 'deployment/src/deploy.ts';

describe('deploy CLI (integration)', () => {
  it('plan prints the allocation and states nothing was sent', () => {
    const r = run(DEPLOY, ['plan']);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /BAAL, 9 decimals, 1000000000 total supply/);
    assert.match(r.out, /Nothing was sent to any network/);
  });

  it('deploy with no arguments defaults to devnet and refuses', () => {
    const r = run(DEPLOY, ['deploy']);
    assert.equal(r.code, 2);
    assert.match(r.err, /REFUSED \(network: devnet\)/);
    assert.match(r.err, /PHASE1_DEPLOYMENT_DISABLED/);
  });

  it('mainnet without confirmation is refused with the missing gates listed', () => {
    const r = run(DEPLOY, ['deploy', '--network', 'mainnet-beta']);
    assert.equal(r.code, 2);
    assert.match(r.err, /MAINNET_GENESIS_HASH_MISSING/);
    assert.match(r.err, /MAINNET_CONFIRMATION_MISSING/);
  });

  it('mainnet via environment variable alone is not mainnet (stays devnet and refuses)', () => {
    const r = run(DEPLOY, ['deploy'], { SOLANA_NETWORK: 'mainnet-beta' });
    assert.equal(r.code, 2);
    assert.match(r.err, /network: devnet/);
  });

  it('mainnet with every gate satisfied is still refused in Phase 1', () => {
    const r = run(DEPLOY, [
      'deploy',
      '--network',
      'mainnet-beta',
      '--observed-genesis-hash',
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
      '--confirm',
      MAINNET_CONFIRMATION_PHRASE,
    ]);
    assert.equal(r.code, 2);
    assert.match(r.err, /PHASE1_DEPLOYMENT_DISABLED/);
    assert.ok(!/MAINNET_/.test(r.err.replace(/network: mainnet-beta/g, '')), r.err);
  });

  it('a signing key in a CI environment is refused and its value is never printed', () => {
    const secret = 'z'.repeat(32);
    const r = run(DEPLOY, ['deploy'], {
      CI: 'true',
      GITHUB_ACTIONS: 'true',
      SOLANA_PRIVATE_KEY: secret,
    });
    assert.equal(r.code, 2);
    assert.match(r.err, /CI_ENVIRONMENT/);
    assert.match(r.err, /SIGNING_MATERIAL_IN_ENVIRONMENT/);
    assert.ok(!r.err.includes(secret) && !r.out.includes(secret));
  });

  it('rejects unknown commands and malformed flags', () => {
    assert.equal(run(DEPLOY, ['frobnicate']).code, 1);
    assert.equal(run(DEPLOY, ['deploy', '--network']).code, 1);
    assert.equal(run(DEPLOY, ['deploy', 'stray']).code, 1);
  });
});

describe('validate and scan scripts (integration)', () => {
  it('validate passes on the committed data', () => {
    const r = run('scripts/validate.ts', []);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /OK: allocation, metadata and network configs are valid/);
  });

  it('secret scan is clean', () => {
    assert.equal(run('scripts/scan-secrets.ts', []).code, 0);
  });

  it('workflow policy check passes', () => {
    const r = run('scripts/check-workflows.ts', []);
    assert.equal(r.code, 0, r.err);
  });
});
