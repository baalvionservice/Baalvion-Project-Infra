import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { KNOWN_GENESIS_HASHES } from '../deployment/src/config.ts';
import {
  assessDeployment,
  findSigningMaterialVariables,
  isCiEnvironment,
  MAINNET_CONFIRMATION_PHRASE,
  resolveNetwork,
} from '../deployment/src/guard.ts';
import type { DeploymentRequest, RefusalCode } from '../deployment/src/guard.ts';

const MAINNET_HASH = KNOWN_GENESIS_HASHES['mainnet-beta'];

const base: DeploymentRequest = {
  network: undefined,
  networkSource: 'default',
  observedGenesisHash: undefined,
  confirmation: undefined,
  env: {},
};

const codes = (r: Partial<DeploymentRequest>): RefusalCode[] =>
  assessDeployment({ ...base, ...r }).refusals.map((x) => x.code);

const fullMainnet: Partial<DeploymentRequest> = {
  network: 'mainnet-beta',
  networkSource: 'cli',
  observedGenesisHash: MAINNET_HASH,
  confirmation: MAINNET_CONFIRMATION_PHRASE,
};

describe('network selection', () => {
  it('defaults to devnet', () => {
    assert.equal(resolveNetwork(undefined), 'devnet');
    assert.equal(assessDeployment(base).network, 'devnet');
  });

  it('rejects unknown and aliased network names', () => {
    for (const name of ['mainnet', 'Mainnet-Beta', 'MAINNET-BETA', 'testnet', ' devnet', '']) {
      assert.equal(resolveNetwork(name), undefined, name);
      assert.ok(codes({ network: name }).includes('UNKNOWN_NETWORK'), name);
    }
  });

  it('devnet has no mainnet gates', () => {
    assert.deepEqual(codes({ network: 'devnet', networkSource: 'cli' }), [
      'PHASE1_DEPLOYMENT_DISABLED',
    ]);
  });
});

describe('mainnet safeguards', () => {
  it('requires explicit CLI selection, not env or default', () => {
    for (const networkSource of ['default', 'env'] as const) {
      assert.ok(
        codes({ ...fullMainnet, networkSource }).includes(
          'MAINNET_REQUIRES_EXPLICIT_CLI_SELECTION',
        ),
      );
    }
  });

  it('requires a genesis hash', () => {
    for (const hash of [undefined, '']) {
      assert.ok(
        codes({ ...fullMainnet, observedGenesisHash: hash }).includes(
          'MAINNET_GENESIS_HASH_MISSING',
        ),
      );
    }
  });

  it('rejects a genesis hash from the wrong cluster', () => {
    const c = codes({ ...fullMainnet, observedGenesisHash: KNOWN_GENESIS_HASHES.devnet });
    assert.ok(c.includes('MAINNET_GENESIS_HASH_MISMATCH'));
  });

  it('requires the typed confirmation, exactly', () => {
    assert.ok(
      codes({ ...fullMainnet, confirmation: undefined }).includes('MAINNET_CONFIRMATION_MISSING'),
    );
    assert.ok(codes({ ...fullMainnet, confirmation: '' }).includes('MAINNET_CONFIRMATION_MISSING'));
    for (const wrong of [
      'yes',
      'y',
      MAINNET_CONFIRMATION_PHRASE.toLowerCase(),
      `${MAINNET_CONFIRMATION_PHRASE} `,
      'I CONFIRM',
    ]) {
      assert.ok(
        codes({ ...fullMainnet, confirmation: wrong }).includes('MAINNET_CONFIRMATION_INVALID'),
        wrong,
      );
    }
  });

  it('attempted mainnet execution with nothing supplied reports every missing gate', () => {
    const c = codes({ network: 'mainnet-beta', networkSource: 'cli' });
    assert.deepEqual(c, [
      'MAINNET_GENESIS_HASH_MISSING',
      'MAINNET_CONFIRMATION_MISSING',
      'PHASE1_DEPLOYMENT_DISABLED',
    ]);
  });

  it('even with every gate satisfied, Phase 1 still refuses', () => {
    const decision = assessDeployment({ ...base, ...fullMainnet });
    assert.equal(decision.allowed, false);
    assert.deepEqual(
      decision.refusals.map((r) => r.code),
      ['PHASE1_DEPLOYMENT_DISABLED'],
    );
  });

  it('is never allowed, whatever the input', () => {
    for (const network of [undefined, 'devnet', 'mainnet-beta', 'nonsense']) {
      for (const networkSource of ['default', 'cli', 'env'] as const) {
        const d = assessDeployment({ ...base, ...fullMainnet, network, networkSource });
        assert.equal(d.allowed, false);
        assert.ok(d.refusals.some((r) => r.code === 'PHASE1_DEPLOYMENT_DISABLED'));
      }
    }
  });
});

describe('CI and signing-key safety', () => {
  it('detects CI environments', () => {
    for (const env of [
      { CI: 'true' },
      { GITHUB_ACTIONS: 'true' },
      { GITLAB_CI: '1' },
      { BUILDKITE: 'true' },
      { JENKINS_URL: 'http://j' },
    ]) {
      assert.equal(isCiEnvironment(env), true, JSON.stringify(env));
    }
    for (const env of [{}, { CI: 'false' }, { CI: '' }, { CI: '0' }])
      assert.equal(isCiEnvironment(env), false);
  });

  it('refuses everything in CI, even a fully-gated mainnet request', () => {
    assert.ok(
      codes({ ...fullMainnet, env: { GITHUB_ACTIONS: 'true' } }).includes('CI_ENVIRONMENT'),
    );
    assert.ok(codes({ network: 'devnet', env: { CI: 'true' } }).includes('CI_ENVIRONMENT'));
  });

  it('attempted use of a signing key in CI is refused and named without leaking the value', () => {
    const secretValue = 'x'.repeat(40);
    const decision = assessDeployment({
      ...base,
      ...fullMainnet,
      env: { CI: 'true', SOLANA_PRIVATE_KEY: secretValue, ANCHOR_WALLET: '/home/runner/id' },
    });
    const c = decision.refusals.map((r) => r.code);
    assert.ok(c.includes('CI_ENVIRONMENT'));
    assert.ok(c.includes('SIGNING_MATERIAL_IN_ENVIRONMENT'));
    const text = JSON.stringify(decision);
    assert.ok(text.includes('SOLANA_PRIVATE_KEY'));
    assert.ok(!text.includes(secretValue));
  });

  it('detects signing material outside CI too, but ignores empty values and RPC URLs', () => {
    assert.deepEqual(
      findSigningMaterialVariables({
        DEPLOYER_KEY: 'a',
        WALLET_PATH: 'b',
        MNEMONIC: 'c',
        SEED_PHRASE: 'd',
        KEYPAIR_PATH: 'e',
        SECRET_KEY: 'f',
        EMPTY_PRIVATE_KEY: '',
        SOLANA_RPC_URL: 'https://api.devnet.solana.com',
        DEVNET_RPC_URL: 'https://x',
        PATH: '/usr/bin',
      }),
      ['DEPLOYER_KEY', 'KEYPAIR_PATH', 'MNEMONIC', 'SECRET_KEY', 'SEED_PHRASE', 'WALLET_PATH'],
    );
    assert.ok(
      codes({ network: 'devnet', env: { PRIVATE_KEY: 'x' } }).includes(
        'SIGNING_MATERIAL_IN_ENVIRONMENT',
      ),
    );
  });
});
