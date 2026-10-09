import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { isForbiddenFilename, scanDirectory, scanText } from '../security/src/secret-scan.ts';
import { REPO_ROOT } from '../token/src/guards.ts';

// Fixtures are assembled at runtime so this file never contains a literal
// that the scanner (or gitleaks) would flag. The values are obviously fake.
const fakeKeypairArray = `[${Array.from({ length: 64 }, (_, i) => String(i)).join(',')}]`;
const fakeBase58 = 'x'.repeat(88);
const fakeSeedPhrase = [
  'mnemonic',
  ' = "',
  [...Array.from({ length: 11 }, () => 'abandon'), 'about'].join(' '),
  '"',
].join('');
const rules = (text: string): string[] => scanText('f', text).map((f) => f.rule);

describe('secret scanner', () => {
  it('detects Solana keypair arrays and base58 secret keys', () => {
    assert.deepEqual(rules(fakeKeypairArray), ['solana-keypair-array']);
    assert.ok(rules(`key: ${fakeBase58}`).includes('base58-secret-key'));
  });

  it('ignores number arrays that are not keys', () => {
    const tooBig = `[${Array.from({ length: 64 }, () => '999').join(',')}]`;
    assert.deepEqual(rules(tooBig), []);
    assert.deepEqual(rules('[1,2,3]'), []);
  });

  it('detects seed phrases, PEM keys, cloud and git tokens', () => {
    assert.deepEqual(rules(fakeSeedPhrase), ['seed-phrase']);
    assert.deepEqual(rules(['-----BEGIN ', 'PRIVATE', ' KEY-----'].join('')), ['pem-private-key']);
    assert.deepEqual(rules(`AKIA${'A'.repeat(16)}`), ['aws-access-key']);
    assert.deepEqual(rules(`ghp_${'a'.repeat(36)}`), ['github-token']);
  });

  it('detects credentials and API keys embedded in URLs', () => {
    assert.ok(
      rules(['https://', 'user', ':', 'hunter2', '@rpc.example.com'].join('')).includes(
        'url-credentials',
      ),
    );
    assert.ok(
      rules(['https://rpc.example.com/?api', '-key=', 'abcdef123456'].join('')).includes(
        'url-api-key',
      ),
    );
    assert.deepEqual(rules('https://api.devnet.solana.com'), []);
  });

  it('detects assigned secrets but accepts empty values and placeholders', () => {
    assert.deepEqual(rules(`PRIVATE_KEY=${'a'.repeat(20)}`), ['assigned-secret']);
    assert.deepEqual(rules(`export DB_PASSWORD=${'a'.repeat(12)}`), ['assigned-secret']);
    assert.deepEqual(rules('SOLANA_RPC_URL='), []);
    assert.deepEqual(rules('PRIVATE_KEY=<set-me>'), []);
    assert.deepEqual(rules('PRIVATE_KEY='), []);
  });

  it('honours the allow marker', () => {
    assert.deepEqual(rules(`${fakeBase58} # secret-scan:allow`), []);
  });

  it('reports positions but never the matched text', () => {
    const findings = scanText('a.txt', `ok\n${fakeBase58}`);
    assert.deepEqual(findings, [{ file: 'a.txt', line: 2, rule: 'base58-secret-key' }]);
  });

  it('flags forbidden filenames, allowing only .env.example', () => {
    for (const name of [
      'id.json',
      'my-keypair.json',
      'wallet-1.json',
      'x.pem',
      'deployer.key',
      '.env',
      '.env.local',
      'a.mnemonic',
    ]) {
      assert.equal(isForbiddenFilename(name), true, name);
    }
    for (const name of ['.env.example', 'allocation.json', 'devnet.json', 'package.json']) {
      assert.equal(isForbiddenFilename(name), false, name);
    }
  });

  it('scans directories, skipping node_modules', () => {
    const dir = mkdtempSync(join(tmpdir(), 'baal-scan-'));
    try {
      mkdirSync(join(dir, 'node_modules'));
      writeFileSync(join(dir, 'node_modules', 'ignored.txt'), fakeBase58);
      writeFileSync(join(dir, 'clean.txt'), 'nothing here');
      writeFileSync(join(dir, 'leak.txt'), fakeKeypairArray);
      writeFileSync(join(dir, 'id.json'), '{}');
      const found = scanDirectory(dir)
        .map((f) => `${f.file}:${f.rule}`)
        .sort();
      assert.deepEqual(found, ['id.json:forbidden-filename', 'leak.txt:solana-keypair-array']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('finds nothing in this repository', () => {
    assert.deepEqual(scanDirectory(REPO_ROOT), []);
  });
});

describe('secret-safety files', () => {
  const lines = (name: string): string[] =>
    readFileSync(join(REPO_ROOT, name), 'utf8')
      .split('\n')
      .map((l) => l.trim());

  it('.gitignore blocks env files, keys, keypairs, wallets and seed material', () => {
    const ignore = lines('.gitignore');
    for (const pattern of [
      '.env',
      '.env.*',
      '!.env.example',
      '*.pem',
      '*.key',
      '*.mnemonic',
      '*.seed',
      'id.json',
      '*keypair*.json',
      'wallet*.json',
      '.anchor/',
      'test-ledger/',
      'node_modules/',
    ]) {
      assert.ok(ignore.includes(pattern), `.gitignore is missing ${pattern}`);
    }
  });

  it('.env.example contains placeholders only', () => {
    const entries = lines('.env.example').filter((l) => l !== '' && !l.startsWith('#'));
    const map = Object.fromEntries(entries.map((l) => l.split('=') as [string, string]));
    for (const name of ['SOLANA_RPC_URL', 'DEVNET_RPC_URL', 'MAINNET_RPC_URL'])
      assert.equal(map[name], '');
    assert.equal(map['SOLANA_NETWORK'], 'devnet');
    assert.ok(
      !entries.some((l) => /KEY|SECRET|SEED|MNEMONIC|PASSWORD/i.test(l.split('=')[0] ?? '')),
    );
  });

  it('gitleaks config covers Solana key shapes', () => {
    const text = readFileSync(join(REPO_ROOT, 'security', 'gitleaks.toml'), 'utf8');
    assert.match(text, /solana-keypair-json-array/);
    assert.match(text, /solana-base58-secret-key/);
  });
});
