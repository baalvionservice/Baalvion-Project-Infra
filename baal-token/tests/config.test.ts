import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import {
  KNOWN_GENESIS_HASHES,
  loadNetworkConfig,
  validateNetworkConfig,
} from '../deployment/src/config.ts';
import { runPreflight } from '../deployment/src/preflight.ts';
import { REPO_ROOT } from '../token/src/guards.ts';
import { load, mutate } from './helpers.ts';

const devnet = load('config', 'devnet.json');
const mainnet = load('config', 'mainnet.json');

function errorsOf(doc: unknown): string {
  const result = validateNetworkConfig(doc);
  assert.equal(result.ok, false, 'expected the config to be rejected');
  return result.errors.join('\n');
}

describe('network configuration', () => {
  it('committed devnet and mainnet configs are valid', () => {
    assert.equal(validateNetworkConfig(devnet).ok, true);
    assert.equal(validateNetworkConfig(mainnet).ok, true);
    assert.equal(loadNetworkConfig(join(REPO_ROOT, 'config', 'devnet.json')).network, 'devnet');
  });

  it('mainnet is inert: no RPC URL, no mint, deployment disabled, CI barred', () => {
    assert.equal(mainnet['network'], 'mainnet-beta');
    assert.equal(mainnet['rpc'].publicUrl, null);
    assert.equal(mainnet['mintAddress'], null);
    assert.equal(mainnet['safety'].deploymentEnabled, false);
    assert.equal(mainnet['safety'].ciExecutionAllowed, false);
    assert.equal(mainnet['safety'].requiresExplicitSelection, true);
    assert.equal(mainnet['safety'].requiresGenesisVerification, true);
    assert.equal(mainnet['safety'].requiresTypedConfirmation, true);
  });

  it('pins the genesis hash in code as well as in the file', () => {
    assert.equal(devnet['genesisHash'], KNOWN_GENESIS_HASHES.devnet);
    assert.equal(mainnet['genesisHash'], KNOWN_GENESIS_HASHES['mainnet-beta']);
  });

  it('passes cross-file preflight', () => {
    assert.equal(runPreflight(REPO_ROOT).allocation.token.symbol, 'BAAL');
  });

  describe('rejects malformed configuration', () => {
    it('missing genesis hash', () => {
      const bad = mutate(mainnet, (d) => {
        delete d['genesisHash'];
      });
      assert.match(errorsOf(bad), /genesisHash is missing/);
      assert.match(
        errorsOf(mutate(mainnet, (d) => (d['genesisHash'] = ''))),
        /genesisHash is missing/,
      );
    });

    it('genesis hash that is not base58 or not the pinned cluster', () => {
      assert.match(
        errorsOf(mutate(mainnet, (d) => (d['genesisHash'] = 'not-a-hash'))),
        /not a valid base58 hash/,
      );
      assert.match(
        errorsOf(mutate(mainnet, (d) => (d['genesisHash'] = KNOWN_GENESIS_HASHES.devnet))),
        /does not match the pinned genesis hash/,
      );
    });

    it('unknown network and unknown fields', () => {
      assert.match(
        errorsOf(mutate(devnet, (d) => (d['network'] = 'mainnet'))),
        /must be "devnet" or "mainnet-beta"/,
      );
      assert.match(
        errorsOf(mutate(devnet, (d) => (d['extra'] = 1))),
        /extra is not an allowed field/,
      );
    });

    it('truncated / non-object input', () => {
      for (const junk of [null, 'x', 42, [], {}])
        assert.equal(validateNetworkConfig(junk).ok, false);
    });

    it('Token-2022, a mint address, or a freeze authority', () => {
      const msg = errorsOf(
        mutate(devnet, (d) => {
          d['tokenProgram'] = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
          d['mintAddress'] = 'x';
          d['freezeAuthority'] = 'x';
        }),
      );
      assert.match(msg, /classic SPL Token program/);
      assert.match(msg, /mintAddress must be null/);
      assert.match(msg, /freezeAuthority must be null/);
    });

    it('enabled deployment or CI execution', () => {
      const bad = mutate(devnet, (d) => {
        d['safety'].deploymentEnabled = true;
        d['safety'].ciExecutionAllowed = true;
      });
      const msg = errorsOf(bad);
      assert.match(msg, /deploymentEnabled must be false/);
      assert.match(msg, /ciExecutionAllowed must be false/);
    });

    it('a mainnet config that is weakened or activated', () => {
      const bad = mutate(mainnet, (d) => {
        d['safety'].requiresExplicitSelection = false;
        d['safety'].requiresTypedConfirmation = false;
        d['safety'].requiresGenesisVerification = false;
        d['rpc'].publicUrl = 'https://api.mainnet-beta.solana.com';
      });
      const msg = errorsOf(bad);
      assert.match(msg, /explicit selection/);
      assert.match(msg, /typed confirmation/);
      assert.match(msg, /requiresGenesisVerification must be true/);
      assert.match(msg, /mainnet config must stay inert/);
    });

    it('RPC URLs with credentials or API keys, or non-https', () => {
      const withCredentials = ['https://', 'user', ':', 'pass', '@rpc.example.com'].join('');
      const withApiKey = ['https://rpc.example.com/?api', '-key=', 'abcdef123456'].join('');
      for (const url of [withCredentials, withApiKey, 'http://rpc.example.com']) {
        assert.equal(
          validateNetworkConfig(mutate(devnet, (d) => (d['rpc'].publicUrl = url))).ok,
          false,
          url,
        );
      }
    });

    it('bad env var name', () => {
      assert.match(
        errorsOf(mutate(devnet, (d) => (d['rpc'].urlEnvVar = 'lower-case'))),
        /urlEnvVar must name an environment variable/,
      );
    });

    it('secret-looking fields and values anywhere in the document', () => {
      for (const field of [
        'privateKey',
        'secretKey',
        'keypair',
        'mnemonic',
        'seedPhrase',
        'walletPassword',
      ]) {
        assert.match(
          errorsOf(mutate(devnet, (d) => (d[field] = 'x'))),
          /secret-like field names are forbidden/,
          field,
        );
      }
      for (const path of ['~/.config/solana/id.json', './deployer-keypair.json', 'signer.pem']) {
        assert.match(
          errorsOf(mutate(devnet, (d) => (d['rpc'].urlEnvVar = path))),
          /key file reference|urlEnvVar/,
          path,
        );
      }
    });
  });
});
