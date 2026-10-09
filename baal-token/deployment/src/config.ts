import { checkKeys, isRecord, readJson, report, ValidationError } from '../../token/src/guards.ts';
import type { ValidationReport } from '../../token/src/guards.ts';
import { SPL_TOKEN_PROGRAM_ID } from '../../token/src/allocation.ts';

export type NetworkName = 'devnet' | 'mainnet-beta';

/**
 * Genesis hashes are public chain identifiers. They are pinned in code (not
 * just in the JSON) so that editing a config file cannot silently re-point a
 * network at a different cluster.
 */
export const KNOWN_GENESIS_HASHES: Readonly<Record<NetworkName, string>> = {
  devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
  'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
};

export interface NetworkConfig {
  readonly schemaVersion: 1;
  readonly network: NetworkName;
  readonly genesisHash: string;
  readonly rpc: { readonly publicUrl: string | null; readonly urlEnvVar: string };
  readonly tokenProgram: string;
  readonly mintAddress: null;
  readonly freezeAuthority: null;
  readonly safety: {
    readonly deploymentEnabled: false;
    readonly requiresExplicitSelection: boolean;
    readonly requiresGenesisVerification: true;
    readonly requiresTypedConfirmation: boolean;
    readonly ciExecutionAllowed: false;
    readonly signing: 'hardware-wallet-offline';
  };
}

const BASE58_HASH_RE = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
const ENV_VAR_RE = /^[A-Z][A-Z0-9_]*$/;
const SECRET_KEY_NAME_RE = /(private|secret|seed|mnemonic|keypair|password|passphrase|credential)/i;
const SECRET_VALUE_RE = /(keypair|id\.json|\.pem$|\.key$|BEGIN [A-Z ]*PRIVATE KEY)/i;

/** Walks the whole document looking for secret-shaped keys and values. */
function scanForSecrets(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v: unknown, i) => {
      scanForSecrets(v, `${path}[${i}]`, errors);
    });
  } else if (isRecord(value)) {
    for (const [key, v] of Object.entries(value)) {
      if (SECRET_KEY_NAME_RE.test(key))
        errors.push(`${path}.${key}: secret-like field names are forbidden in config`);
      scanForSecrets(v, `${path}.${key}`, errors);
    }
  } else if (typeof value === 'string' && SECRET_VALUE_RE.test(value)) {
    errors.push(`${path}: value looks like a key file reference or key material`);
  }
}

function checkRpc(value: unknown, errors: string[]): void {
  if (!checkKeys(value, ['publicUrl', 'urlEnvVar'], 'config.rpc', errors)) return;
  const { publicUrl, urlEnvVar } = value;
  if (typeof urlEnvVar !== 'string' || !ENV_VAR_RE.test(urlEnvVar)) {
    errors.push('config.rpc.urlEnvVar must name an environment variable (UPPER_SNAKE_CASE)');
  }
  if (publicUrl === null) return;
  if (typeof publicUrl !== 'string') {
    errors.push('config.rpc.publicUrl must be a string or null');
    return;
  }
  try {
    const url = new URL(publicUrl);
    if (url.protocol !== 'https:') errors.push('config.rpc.publicUrl must use https');
    if (url.username !== '' || url.password !== '' || url.search !== '') {
      errors.push('config.rpc.publicUrl must not embed credentials or API keys (use the env var)');
    }
  } catch {
    errors.push('config.rpc.publicUrl is not a valid URL');
  }
}

export function validateNetworkConfig(doc: unknown): ValidationReport {
  const errors: string[] = [];
  scanForSecrets(doc, 'config', errors);
  const keys = [
    'schemaVersion',
    'network',
    'genesisHash',
    'rpc',
    'tokenProgram',
    'mintAddress',
    'freezeAuthority',
    'safety',
  ];
  if (!checkKeys(doc, keys, 'config', errors)) return report(errors);
  if (doc['schemaVersion'] !== 1) errors.push('config.schemaVersion must be 1');

  const network = doc['network'];
  const known = network === 'devnet' || network === 'mainnet-beta';
  if (!known) errors.push('config.network must be "devnet" or "mainnet-beta"');

  const hash = doc['genesisHash'];
  if (typeof hash !== 'string' || hash === '') {
    errors.push('config.genesisHash is missing');
  } else if (!BASE58_HASH_RE.test(hash)) {
    errors.push('config.genesisHash is not a valid base58 hash');
  } else if (known && hash !== KNOWN_GENESIS_HASHES[network]) {
    errors.push(`config.genesisHash does not match the pinned genesis hash for ${network}`);
  }

  checkRpc(doc['rpc'], errors);
  if (doc['tokenProgram'] !== SPL_TOKEN_PROGRAM_ID)
    errors.push('config.tokenProgram must be the classic SPL Token program (ADR-001)');
  if (doc['mintAddress'] !== null)
    errors.push('config.mintAddress must be null in Phase 1 (no token exists)');
  if (doc['freezeAuthority'] !== null) errors.push('config.freezeAuthority must be null (ADR-003)');

  const safetyKeys = [
    'deploymentEnabled',
    'requiresExplicitSelection',
    'requiresGenesisVerification',
    'requiresTypedConfirmation',
    'ciExecutionAllowed',
    'signing',
  ];
  const safety = doc['safety'];
  if (checkKeys(safety, safetyKeys, 'config.safety', errors)) {
    if (safety['deploymentEnabled'] !== false)
      errors.push('config.safety.deploymentEnabled must be false in Phase 1');
    if (safety['requiresGenesisVerification'] !== true)
      errors.push('config.safety.requiresGenesisVerification must be true');
    if (safety['ciExecutionAllowed'] !== false)
      errors.push('config.safety.ciExecutionAllowed must be false (ADR-005)');
    if (safety['signing'] !== 'hardware-wallet-offline')
      errors.push('config.safety.signing must be "hardware-wallet-offline"');
    if (network === 'mainnet-beta') {
      if (safety['requiresExplicitSelection'] !== true)
        errors.push('mainnet must require explicit selection');
      if (safety['requiresTypedConfirmation'] !== true)
        errors.push('mainnet must require typed confirmation');
      const rpc = doc['rpc'];
      if (isRecord(rpc) && rpc['publicUrl'] !== null)
        errors.push('mainnet config must stay inert: rpc.publicUrl must be null');
    }
  }
  return report(errors);
}

export function loadNetworkConfig(path: string): NetworkConfig {
  const raw = readJson(path);
  const result = validateNetworkConfig(raw);
  if (!result.ok) throw new ValidationError(`network config ${path}`, result.errors);
  return raw as NetworkConfig;
}
