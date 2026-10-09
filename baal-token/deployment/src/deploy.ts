// Phase 1 deployment entry point. It can validate and print a plan, and it
// can explain exactly why a deployment would be refused. It cannot deploy:
// there is no RPC client, no signer and no key-reading code in this package.
//
//   node deployment/src/deploy.ts plan
//   node deployment/src/deploy.ts deploy [--network devnet|mainnet-beta] [--confirm "<phrase>"]
//                                        [--observed-genesis-hash <hash>]

import { REPO_ROOT } from '../../token/src/guards.ts';
import { assessDeployment } from './guard.ts';
import type { NetworkSource } from './guard.ts';
import { describePlan, runPreflight } from './preflight.ts';

interface Parsed {
  readonly command: string;
  readonly flags: ReadonlyMap<string, string>;
}

function parseArgs(argv: readonly string[]): Parsed {
  const [command = 'deploy', ...rest] = argv;
  const flags = new Map<string, string>();
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg?.startsWith('--') !== true) throw new Error(`Unexpected argument "${arg ?? ''}"`);
    const value = rest[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`Flag ${arg} needs a value`);
    flags.set(arg.slice(2), value);
    i += 1;
  }
  return { command, flags };
}

export function run(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): number {
  const { command, flags } = parseArgs(argv);
  const preflight = runPreflight(REPO_ROOT);

  if (command === 'plan') {
    console.log(describePlan(preflight).join('\n'));
    console.log('\nPlan only. Nothing was sent to any network.');
    return 0;
  }
  if (command !== 'deploy')
    throw new Error(`Unknown command "${command}". Use "plan" or "deploy".`);

  const cliNetwork = flags.get('network');
  const source: NetworkSource = cliNetwork === undefined ? 'default' : 'cli';
  const decision = assessDeployment({
    network: cliNetwork,
    networkSource: source,
    observedGenesisHash: flags.get('observed-genesis-hash'),
    confirmation: flags.get('confirm'),
    env,
  });
  console.error(`REFUSED (network: ${decision.network ?? 'unknown'})`);
  for (const refusal of decision.refusals) console.error(`  [${refusal.code}] ${refusal.message}`);
  return 2;
}

if (import.meta.main) {
  try {
    process.exitCode = run(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
