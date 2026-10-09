import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkWorkflowText } from '../ci/workflow-policy.ts';
import { REPO_ROOT } from '../token/src/guards.ts';

const rulesFor = (yaml: string): string[] => checkWorkflowText(yaml).map((v) => v.rule);

describe('CI workflow policy (no automated mainnet deployment)', () => {
  const real = readFileSync(
    join(REPO_ROOT, '..', '.github', 'workflows', 'baal-token-ci.yml'),
    'utf8',
  );

  it('the real workflow passes', () => {
    assert.deepEqual(checkWorkflowText(real), []);
  });

  it('the real workflow runs every required check', () => {
    for (const needle of [
      'pnpm run format',
      'pnpm run lint',
      'pnpm run typecheck',
      'pnpm run test',
      'pnpm run audit',
      'scan-secrets',
      'gitleaks',
      'codeql-action',
      'pnpm run build',
    ]) {
      assert.ok(real.includes(needle), `workflow is missing: ${needle}`);
    }
  });

  it('the real workflow is read-only and cannot be triggered by hand', () => {
    assert.match(real, /permissions:\s*\n\s*contents: read/);
    assert.ok(!/workflow_dispatch/.test(real));
    assert.ok(!/^\s*environment:/m.test(real));
    assert.ok(!/\$\{\{\s*secrets\.(?!GITHUB_TOKEN)/.test(real));
  });

  const bad: [string, string, string][] = [
    ['a mainnet job', '  deploy-mainnet:\n    runs-on: x', 'mainnet-reference'],
    ['a deploy step', '      - name: Deploy token', 'deploy-job-or-step'],
    ['a release step', '      - name: Release', 'deploy-job-or-step'],
    ['solana program deploy', '        run: solana program deploy x.so', 'solana-cli-mutation'],
    ['spl-token create-token', '        run: spl-token create-token', 'spl-token-cli-mutation'],
    ['keygen', '        run: solana-keygen new', 'keygen'],
    ['anchor deploy', '        run: anchor deploy', 'anchor-deploy'],
    [
      'the deploy script',
      '        run: node deployment/src/deploy.ts deploy',
      'deploy-script-invocation',
    ],
    [
      'a signing key secret',
      '        env:\n          KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}',
      'secret-reference',
    ],
    ['inherited secrets', '    secrets: inherit', 'secrets-passthrough'],
    ['manual trigger', '  workflow_dispatch:', 'manual-trigger'],
    ['an environment gate', '    environment: production', 'environment-gate'],
    ['OIDC token', '      id-token: write', 'id-token-write'],
  ];
  for (const [label, yaml, rule] of bad) {
    it(`rejects ${label}`, () => {
      assert.ok(rulesFor(yaml).includes(rule), `${rule} not raised for: ${yaml}`);
    });
  }

  it('ignores comments and allows GITHUB_TOKEN', () => {
    assert.deepEqual(rulesFor('# deploy to mainnet is forbidden'), []);
    assert.deepEqual(rulesFor('        env:\n          T: ${{ secrets.GITHUB_TOKEN }}'), []);
  });
});

describe('Phase 1 has no blockchain capability', () => {
  const FORBIDDEN: [string, RegExp][] = [
    ['a Solana SDK import', /@solana\/|@coral-xyz|@metaplex/],
    ['Keypair handling', /\bKeypair\b/],
    [
      'network access',
      /\bfetch\s*\(|node:https?|node:net\b|node:dgram|\bXMLHttpRequest\b|\bWebSocket\b/,
    ],
    ['process spawning', /node:child_process/],
    ['key-file reading', /id\.json|\.config\/solana/],
    ['secret env access', /process\.env\[?['".]*\w*(KEY|SECRET|SEED|MNEMONIC)/i],
  ];

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : [];
    });
  }

  for (const dir of ['token/src', 'deployment/src', 'website/src']) {
    for (const file of sources(join(REPO_ROOT, dir))) {
      it(`${dir}/${file.split('/').pop() ?? ''} has no signer, SDK, or network code`, () => {
        const text = readFileSync(file, 'utf8');
        for (const [label, re] of FORBIDDEN) assert.ok(!re.test(text), `${file} contains ${label}`);
      });
    }
  }

  it('package.json has no blockchain dependencies and no install scripts', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as Record<
      string,
      Record<string, string> | undefined
    >;
    assert.equal(pkg['dependencies'], undefined);
    for (const name of Object.keys(pkg['devDependencies'] ?? {}))
      assert.ok(!/solana|web3|metaplex|anchor|spl-token/i.test(name), name);
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare'])
      assert.equal(pkg['scripts']?.[hook], undefined, hook);
    assert.ok(!Object.keys(pkg['scripts'] ?? {}).some((s) => /deploy|mint|publish/i.test(s)));
  });
});
