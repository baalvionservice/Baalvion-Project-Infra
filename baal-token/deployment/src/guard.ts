// Network-safety gate. It decides whether a deployment request could proceed.
//
// In Phase 1 the answer is ALWAYS "no": `allowed` is typed as the literal
// `false` and PHASE1_DEPLOYMENT_DISABLED is attached to every decision. The
// individual gates are still evaluated and reported so that they are tested
// now, before any later phase relaxes the lock.
//
// This module performs no I/O: it never reads files, keys or the network.

import { KNOWN_GENESIS_HASHES } from './config.ts';
import type { NetworkName } from './config.ts';

export const MAINNET_CONFIRMATION_PHRASE =
  'I CONFIRM MAINNET DEPLOYMENT OF BAAL WITH HARDWARE WALLET SIGNING';

export type NetworkSource = 'default' | 'cli' | 'env';

export type RefusalCode =
  | 'PHASE1_DEPLOYMENT_DISABLED'
  | 'UNKNOWN_NETWORK'
  | 'MAINNET_REQUIRES_EXPLICIT_CLI_SELECTION'
  | 'MAINNET_GENESIS_HASH_MISSING'
  | 'MAINNET_GENESIS_HASH_MISMATCH'
  | 'MAINNET_CONFIRMATION_MISSING'
  | 'MAINNET_CONFIRMATION_INVALID'
  | 'CI_ENVIRONMENT'
  | 'SIGNING_MATERIAL_IN_ENVIRONMENT';

export interface DeploymentRequest {
  /** Requested network; undefined means "not specified" and resolves to devnet. */
  readonly network: string | undefined;
  readonly networkSource: NetworkSource;
  /** Genesis hash reported by the RPC node (Phase 1 callers supply it by hand). */
  readonly observedGenesisHash: string | undefined;
  readonly confirmation: string | undefined;
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface Refusal {
  readonly code: RefusalCode;
  readonly message: string;
}

export interface DeploymentDecision {
  readonly allowed: false;
  readonly network: NetworkName | undefined;
  readonly refusals: readonly Refusal[];
}

const CI_VARIABLES = [
  'CI',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'BUILDKITE',
  'CIRCLECI',
  'JENKINS_URL',
  'TF_BUILD',
  'TRAVIS',
];
const FALSY = new Set(['', '0', 'false']);

// Names of variables that could carry signing material. Values are never read
// into messages, only the names are reported.
const SIGNING_ENV_RE =
  /(PRIVATE[_-]?KEY|SECRET[_-]?KEY|KEYPAIR|MNEMONIC|SEED[_-]?PHRASE|ANCHOR_WALLET|WALLET[_-]?(KEY|PATH|SECRET)|SIGNER|DEPLOYER[_-]?KEY)/i;

export function isCiEnvironment(env: Readonly<Record<string, string | undefined>>): boolean {
  return CI_VARIABLES.some((name) => {
    const value = env[name];
    return value !== undefined && !FALSY.has(value.toLowerCase());
  });
}

export function findSigningMaterialVariables(
  env: Readonly<Record<string, string | undefined>>,
): string[] {
  return Object.entries(env)
    .filter(([name, value]) => SIGNING_ENV_RE.test(name) && value !== undefined && value !== '')
    .map(([name]) => name)
    .sort();
}

/** Resolves a requested network name. Unspecified means devnet. */
export function resolveNetwork(requested: string | undefined): NetworkName | undefined {
  if (requested === undefined) return 'devnet';
  if (requested === 'devnet') return 'devnet';
  if (requested === 'mainnet-beta') return 'mainnet-beta';
  return undefined;
}

export function assessDeployment(request: DeploymentRequest): DeploymentDecision {
  const refusals: Refusal[] = [];
  const refuse = (code: RefusalCode, message: string): void => {
    refusals.push({ code, message });
  };

  const network = resolveNetwork(request.network);
  if (network === undefined)
    refuse(
      'UNKNOWN_NETWORK',
      `Unknown network "${request.network ?? ''}". Use devnet or mainnet-beta.`,
    );

  if (network === 'mainnet-beta') {
    if (request.networkSource !== 'cli') {
      refuse(
        'MAINNET_REQUIRES_EXPLICIT_CLI_SELECTION',
        'Mainnet must be selected with an explicit --network mainnet-beta flag, never by default or environment.',
      );
    }
    const observed = request.observedGenesisHash;
    if (observed === undefined || observed === '') {
      refuse(
        'MAINNET_GENESIS_HASH_MISSING',
        'Mainnet requires the RPC genesis hash to be verified before anything else.',
      );
    } else if (observed !== KNOWN_GENESIS_HASHES['mainnet-beta']) {
      refuse(
        'MAINNET_GENESIS_HASH_MISMATCH',
        'The RPC endpoint reports a genesis hash that is not Solana mainnet-beta.',
      );
    }
    if (request.confirmation === undefined || request.confirmation === '') {
      refuse(
        'MAINNET_CONFIRMATION_MISSING',
        'Mainnet requires typing the exact confirmation phrase.',
      );
    } else if (request.confirmation !== MAINNET_CONFIRMATION_PHRASE) {
      refuse(
        'MAINNET_CONFIRMATION_INVALID',
        'The typed confirmation does not match the required phrase exactly.',
      );
    }
  }

  if (isCiEnvironment(request.env)) {
    refuse('CI_ENVIRONMENT', 'Deployment is never permitted from a CI environment.');
  }
  const signing = findSigningMaterialVariables(request.env);
  if (signing.length > 0) {
    refuse(
      'SIGNING_MATERIAL_IN_ENVIRONMENT',
      `Signing material must never be provided through the environment (${signing.join(', ')}). Signing is hardware-wallet only, outside this repository.`,
    );
  }

  refuse(
    'PHASE1_DEPLOYMENT_DISABLED',
    'Phase 1 contains no deployment capability. Nothing was sent to any network.',
  );
  return { allowed: false, network, refusals };
}
