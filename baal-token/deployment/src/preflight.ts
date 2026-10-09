import { join } from 'node:path';
import { loadAllocation } from '../../token/src/allocation.ts';
import type { AllocationDocument } from '../../token/src/allocation.ts';
import { ValidationError } from '../../token/src/guards.ts';
import { loadMetadata } from '../../token/src/metadata.ts';
import { computeSupply } from '../../token/src/supply.ts';
import type { TreasuryPolicy } from '../../token/src/treasury.ts';
import { loadTreasuryPolicy } from '../../token/src/treasury.ts';
import { loadNetworkConfig } from './config.ts';
import type { NetworkConfig } from './config.ts';

export interface PreflightResult {
  readonly allocation: AllocationDocument;
  readonly devnet: NetworkConfig;
  readonly mainnet: NetworkConfig;
  readonly treasury: TreasuryPolicy;
}

/** Loads every committed data file and cross-checks them against each other. */
export function runPreflight(root: string): PreflightResult {
  const allocation = loadAllocation(join(root, 'token', 'allocation.json'));
  const metadata = loadMetadata(join(root, 'token', 'metadata.json'));
  const devnet = loadNetworkConfig(join(root, 'config', 'devnet.json'));
  const mainnet = loadNetworkConfig(join(root, 'config', 'mainnet.json'));
  const treasury = loadTreasuryPolicy(join(root, 'token', 'treasury-policy.json'));

  const errors: string[] = [];
  if (devnet.network !== 'devnet') errors.push('config/devnet.json must describe devnet');
  if (mainnet.network !== 'mainnet-beta')
    errors.push('config/mainnet.json must describe mainnet-beta');
  if (metadata.symbol !== allocation.token.symbol)
    errors.push('metadata symbol differs from allocation symbol');
  if (metadata.name !== allocation.token.name)
    errors.push('metadata name differs from allocation name');
  for (const config of [devnet, mainnet]) {
    if (config.tokenProgram !== allocation.token.tokenProgram) {
      errors.push(`${config.network} tokenProgram differs from allocation tokenProgram`);
    }
  }
  if (errors.length > 0) throw new ValidationError('cross-file consistency', errors);
  return { allocation, devnet, mainnet, treasury };
}

export function describePlan(result: PreflightResult): string[] {
  const { allocation } = result;
  const supply = computeSupply(allocation, { at: 0, tge: undefined });
  return [
    `Token: ${allocation.token.symbol}, ${allocation.token.decimals} decimals, ${allocation.token.totalSupplyTokens} total supply`,
    `Standard: ${allocation.token.standard} (program ${allocation.token.tokenProgram})`,
    `Supply policy: fixed; mint authority ${allocation.token.supplyPolicy.mintAuthority}; freeze authority ${allocation.token.supplyPolicy.freezeAuthority}`,
    ...allocation.allocations.map((a) => `  ${a.percent.padStart(3)}%  ${a.id}`),
    `Circulating supply: ${
      supply.circulating === null
        ? `undetermined (schedules TBD: ${supply.tbdAllocationIds.join(', ')})`
        : supply.circulating.toString()
    }`,
    `Treasury: ${result.treasury.treasuryMultisig.threshold}-of-${result.treasury.treasuryMultisig.signerCount} multisig (design only)`,
  ];
}
