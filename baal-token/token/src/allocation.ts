import { checkKeys, isRecord, readJson, report, ValidationError } from './guards.ts';
import type { ValidationReport } from './guards.ts';
import {
  BPS_DENOMINATOR,
  bpsOf,
  isValidDecimals,
  parsePercentToBps,
  parseUint,
  tokensToBaseUnits,
  U64_MAX,
} from './units.ts';
import {
  MAX_CLIFF_MONTHS,
  MAX_LINEAR_MONTHS,
  MONTH_COUNTING,
  RELEASE_SHAPE,
  vestingParamsFromSpec,
  vestedAmount,
} from './vesting.ts';
import type { VestingSpec } from './vesting.ts';

export const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const APPROVED_TOTAL_SUPPLY_TOKENS = 1_000_000_000n;
export const APPROVED_DECIMALS = 9;

export interface WalletRole {
  readonly role: string;
  /** Always null in Phase 1: no addresses exist yet. */
  readonly address: null;
}

export interface Allocation {
  readonly id: string;
  readonly label: string;
  readonly percent: string;
  readonly tokens: string;
  readonly baseUnits: string;
  readonly walletRole: WalletRole;
  readonly vesting: VestingSpec;
}

export interface AllocationDocument {
  readonly schemaVersion: 1;
  readonly token: {
    readonly symbol: string;
    readonly name: string;
    readonly standard: string;
    readonly tokenProgram: string;
    readonly decimals: number;
    readonly totalSupplyTokens: string;
    readonly totalSupplyBaseUnits: string;
    readonly supplyPolicy: {
      readonly fixedSupply: boolean;
      readonly mintAuthority: string;
      readonly freezeAuthority: string;
    };
  };
  readonly allocations: readonly Allocation[];
  /** "tbd" until every allocation has an approved schedule. See token/src/supply.ts. */
  readonly circulation: { readonly status: 'tbd' | 'approved'; readonly note: string };
  /** How vesting is enforced. "open" until a provider is verified (ADR-008). */
  readonly enforcement: { readonly status: 'open'; readonly note: string };
  readonly operationalRoles: readonly WalletRole[];
}

const ID_RE = /^[a-z][a-z0-9-]{1,63}$/;
const SYMBOL_RE = /^[A-Z0-9]{2,10}$/;

function parseWalletRole(value: unknown, path: string, errors: string[]): WalletRole | undefined {
  if (!checkKeys(value, ['role', 'address'], path, errors)) return undefined;
  const { role, address } = value;
  if (typeof role !== 'string' || !ID_RE.test(role))
    errors.push(`${path}.role must be a kebab-case id`);
  if (address !== null) {
    errors.push(`${path}.address must be null in Phase 1 (no wallet addresses may be committed)`);
  }
  return { role: String(role), address: null };
}

function parseVesting(value: unknown, path: string, errors: string[]): VestingSpec | undefined {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return undefined;
  }
  const type = value['type'];
  if (type === 'none' || type === 'unspecified') {
    if (!checkKeys(value, ['type', 'status', 'tgeUnlockPercent'], path, errors)) return undefined;
    const tge = value['tgeUnlockPercent'];
    const status = value['status'];
    if (type === 'none') {
      if (tge !== '100') {
        errors.push(`${path}: type "none" means fully liquid, so tgeUnlockPercent must be "100"`);
      }
      if (status !== 'approved') errors.push(`${path}.status must be "approved" for type "none"`);
      return { type, status: 'approved', tgeUnlockPercent: typeof tge === 'string' ? tge : '' };
    }
    if (tge !== null) errors.push(`${path}: a TBD schedule must have tgeUnlockPercent null`);
    if (status !== 'tbd') errors.push(`${path}.status must be "tbd" for an unspecified schedule`);
    return { type, status: 'tbd', tgeUnlockPercent: null };
  }
  if (type === 'cliff-linear') {
    if (
      !checkKeys(
        value,
        [
          'type',
          'status',
          'releaseShape',
          'monthCounting',
          'cliffMonths',
          'linearMonths',
          'tgeUnlockPercent',
        ],
        path,
        errors,
      )
    ) {
      return undefined;
    }
    const { cliffMonths, linearMonths, tgeUnlockPercent } = value;
    if (value['status'] !== 'approved') {
      errors.push(`${path}.status must be "approved" (a schedule with parameters is approved)`);
    }
    if (value['releaseShape'] !== RELEASE_SHAPE) {
      errors.push(`${path}.releaseShape must be "${RELEASE_SHAPE}" (ADR-006)`);
    }
    if (value['monthCounting'] !== MONTH_COUNTING) {
      errors.push(`${path}.monthCounting must be "${MONTH_COUNTING}" (ADR-006)`);
    }
    if (
      !Number.isInteger(cliffMonths) ||
      (cliffMonths as number) < 0 ||
      (cliffMonths as number) > MAX_CLIFF_MONTHS
    ) {
      errors.push(`${path}.cliffMonths must be an integer 0..${MAX_CLIFF_MONTHS}`);
    }
    if (
      !Number.isInteger(linearMonths) ||
      (linearMonths as number) < 1 ||
      (linearMonths as number) > MAX_LINEAR_MONTHS
    ) {
      errors.push(`${path}.linearMonths must be an integer 1..${MAX_LINEAR_MONTHS}`);
    }
    const bps = parsePercentToBps(tgeUnlockPercent);
    if (bps === undefined || bps > BPS_DENOMINATOR) {
      errors.push(`${path}.tgeUnlockPercent must be a percent string between "0" and "100"`);
    }
    return {
      type,
      status: 'approved',
      releaseShape: RELEASE_SHAPE,
      monthCounting: MONTH_COUNTING,
      cliffMonths: cliffMonths as number,
      linearMonths: linearMonths as number,
      tgeUnlockPercent: String(tgeUnlockPercent),
    };
  }
  errors.push(`${path}.type must be "none", "cliff-linear" or "unspecified"`);
  return undefined;
}

function parseAllocation(value: unknown, path: string, errors: string[]): Allocation | undefined {
  const keys = ['id', 'label', 'percent', 'tokens', 'baseUnits', 'walletRole', 'vesting'];
  if (!checkKeys(value, keys, path, errors)) return undefined;
  const { id, label, percent, tokens, baseUnits } = value;
  if (typeof id !== 'string' || !ID_RE.test(id)) errors.push(`${path}.id must be a kebab-case id`);
  if (typeof label !== 'string' || label.length === 0)
    errors.push(`${path}.label must be a non-empty string`);
  for (const [name, v] of [
    ['percent', percent],
    ['tokens', tokens],
    ['baseUnits', baseUnits],
  ] as const) {
    if (typeof v !== 'string')
      errors.push(`${path}.${name} must be a decimal string (numbers are not allowed)`);
  }
  const walletRole = parseWalletRole(value['walletRole'], `${path}.walletRole`, errors);
  const vesting = parseVesting(value['vesting'], `${path}.vesting`, errors);
  if (!walletRole || !vesting) return undefined;
  return {
    id: String(id),
    label: String(label),
    percent: String(percent),
    tokens: String(tokens),
    baseUnits: String(baseUnits),
    walletRole,
    vesting,
  };
}

function parseStructure(doc: unknown, errors: string[]): AllocationDocument | undefined {
  const top = [
    'schemaVersion',
    'token',
    'allocations',
    'circulation',
    'enforcement',
    'operationalRoles',
  ];
  if (!checkKeys(doc, top, 'allocation', errors)) return undefined;
  if (doc['schemaVersion'] !== 1) errors.push('allocation.schemaVersion must be 1');

  const tokenKeys = [
    'symbol',
    'name',
    'standard',
    'tokenProgram',
    'decimals',
    'totalSupplyTokens',
    'totalSupplyBaseUnits',
    'supplyPolicy',
  ];
  const token = doc['token'];
  if (!checkKeys(token, tokenKeys, 'allocation.token', errors)) return undefined;
  const policy = token['supplyPolicy'];
  if (
    !checkKeys(
      policy,
      ['fixedSupply', 'mintAuthority', 'freezeAuthority'],
      'allocation.token.supplyPolicy',
      errors,
    )
  ) {
    return undefined;
  }
  const circulation = doc['circulation'];
  if (!checkKeys(circulation, ['status', 'note'], 'allocation.circulation', errors)) {
    return undefined;
  }
  const enforcement = doc['enforcement'];
  if (!checkKeys(enforcement, ['status', 'note'], 'allocation.enforcement', errors)) {
    return undefined;
  }

  const list = doc['allocations'];
  const allocations: Allocation[] = [];
  if (!Array.isArray(list) || list.length === 0) {
    errors.push('allocation.allocations must be a non-empty array');
  } else {
    list.forEach((item: unknown, i) => {
      const parsed = parseAllocation(item, `allocation.allocations[${i}]`, errors);
      if (parsed) allocations.push(parsed);
    });
  }

  const roles: WalletRole[] = [];
  const rawRoles = doc['operationalRoles'];
  if (!Array.isArray(rawRoles)) {
    errors.push('allocation.operationalRoles must be an array');
  } else {
    rawRoles.forEach((item: unknown, i) => {
      const parsed = parseWalletRole(item, `allocation.operationalRoles[${i}]`, errors);
      if (parsed) roles.push(parsed);
    });
  }
  if (errors.length > 0) return undefined;

  return {
    schemaVersion: 1,
    token: {
      symbol: String(token['symbol']),
      name: String(token['name']),
      standard: String(token['standard']),
      tokenProgram: String(token['tokenProgram']),
      decimals: token['decimals'] as number,
      totalSupplyTokens: String(token['totalSupplyTokens']),
      totalSupplyBaseUnits: String(token['totalSupplyBaseUnits']),
      supplyPolicy: {
        fixedSupply: policy['fixedSupply'] === true,
        mintAuthority: String(policy['mintAuthority']),
        freezeAuthority: String(policy['freezeAuthority']),
      },
    },
    allocations,
    circulation: {
      status: circulation['status'] === 'approved' ? 'approved' : 'tbd',
      note: String(circulation['note']),
    },
    enforcement: { status: 'open', note: String(enforcement['note']) },
    operationalRoles: roles,
  };
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) (seen.has(v) ? dupes : seen).add(v);
  return [...dupes];
}

function checkToken(doc: AllocationDocument, errors: string[]): bigint | undefined {
  const { token } = doc;
  if (!SYMBOL_RE.test(token.symbol))
    errors.push('token.symbol must be 2-10 uppercase letters/digits');
  if (token.standard !== 'spl-token-classic')
    errors.push('token.standard must be "spl-token-classic" (ADR-001)');
  if (token.tokenProgram !== SPL_TOKEN_PROGRAM_ID) {
    errors.push(
      'token.tokenProgram must be the classic SPL Token program, not Token-2022 (ADR-001)',
    );
  }
  if (!isValidDecimals(token.decimals)) {
    errors.push('token.decimals must be an integer between 0 and 9');
    return undefined;
  }
  if (token.decimals !== APPROVED_DECIMALS)
    errors.push(`token.decimals must be ${APPROVED_DECIMALS} (Phase 0 decision)`);
  const { fixedSupply, mintAuthority, freezeAuthority } = token.supplyPolicy;
  if (!fixedSupply) errors.push('supplyPolicy.fixedSupply must be true (ADR-002)');
  if (mintAuthority !== 'revoke-permanently')
    errors.push('supplyPolicy.mintAuthority must be "revoke-permanently" (ADR-002)');
  if (freezeAuthority !== 'none')
    errors.push('supplyPolicy.freezeAuthority must be "none" (ADR-003)');

  const tokens = parseUint(token.totalSupplyTokens);
  const base = parseUint(token.totalSupplyBaseUnits);
  if (tokens === undefined)
    errors.push('token.totalSupplyTokens must be a canonical unsigned integer string');
  if (base === undefined)
    errors.push('token.totalSupplyBaseUnits must be a canonical unsigned integer string');
  if (tokens === undefined || base === undefined) return undefined;
  if (tokens !== APPROVED_TOTAL_SUPPLY_TOKENS)
    errors.push('token.totalSupplyTokens must be exactly 1000000000');
  if (base !== tokensToBaseUnits(tokens, token.decimals)) {
    errors.push('token.totalSupplyBaseUnits must equal totalSupplyTokens * 10^decimals');
  }
  if (base > U64_MAX)
    errors.push('total supply in base units exceeds the u64 limit of the SPL Token program');
  return base;
}

function checkAllocations(doc: AllocationDocument, totalBase: bigint, errors: string[]): void {
  const { allocations, token } = doc;
  const decimals = token.decimals;

  for (const dup of findDuplicates(allocations.map((a) => a.id)))
    errors.push(`duplicate allocation id "${dup}"`);
  for (const dup of findDuplicates(allocations.map((a) => a.walletRole.role))) {
    errors.push(`duplicate wallet role "${dup}"`);
  }
  const roleNames = [
    ...allocations.map((a) => a.walletRole.role),
    ...doc.operationalRoles.map((r) => r.role),
  ];
  for (const dup of findDuplicates(roleNames))
    errors.push(`wallet role "${dup}" is used more than once`);

  let sumBps = 0n;
  let sumBase = 0n;
  for (const a of allocations) {
    const where = `allocation "${a.id}"`;
    const bps = parsePercentToBps(a.percent);
    const tokens = parseUint(a.tokens);
    const base = parseUint(a.baseUnits);
    if (bps === undefined)
      errors.push(
        `${where}: percent "${a.percent}" is not a valid non-negative percent with at most 2 decimals`,
      );
    if (tokens === undefined)
      errors.push(
        `${where}: tokens "${a.tokens}" is not a canonical unsigned integer (negatives are rejected)`,
      );
    if (base === undefined)
      errors.push(
        `${where}: baseUnits "${a.baseUnits}" is not a canonical unsigned integer (negatives are rejected)`,
      );
    if (bps === undefined || tokens === undefined || base === undefined) continue;

    if (base !== tokensToBaseUnits(tokens, decimals))
      errors.push(`${where}: baseUnits must equal tokens * 10^decimals`);
    const expectedBase = bpsOf(totalBase, bps);
    if ((totalBase * bps) % BPS_DENOMINATOR !== 0n || base !== expectedBase) {
      errors.push(
        `${where}: percent ${a.percent}% does not exactly correspond to ${a.baseUnits} base units`,
      );
    }
    sumBps += bps;
    sumBase += base;
    checkVesting(a, base, errors);
  }

  if (sumBps !== BPS_DENOMINATOR)
    errors.push(`percentages total ${formatBps(sumBps)}%, must be exactly 100%`);
  if (sumBase !== totalBase) {
    const delta = sumBase - totalBase;
    errors.push(
      `allocations total ${sumBase} base units, ${delta > 0n ? 'over' : 'under'} total supply by ${delta < 0n ? -delta : delta}`,
    );
  }
}

function formatBps(bps: bigint): string {
  const frac = (bps % 100n).toString().padStart(2, '0');
  return `${bps / 100n}.${frac}`;
}

/** A schedule may never release more than its allocation, nor go backwards. */
function checkVesting(a: Allocation, base: bigint, errors: string[]): void {
  const where = `allocation "${a.id}" vesting`;
  const params = vestingParamsFromSpec(a.vesting);
  if (!params) return;
  const tge = 1_800_000_000;
  const day = 86_400;
  let previous = 0n;
  for (let d = 0; d <= 365 * 12; d += 7) {
    const v = vestedAmount(base, params, tge, tge + d * day);
    if (v > base) errors.push(`${where} releases ${v} > allocation ${base} at day ${d}`);
    if (v < previous) errors.push(`${where} decreases at day ${d}`);
    previous = v;
  }
  const end = vestedAmount(base, params, tge, tge + 365 * 12 * day);
  if (end !== base)
    errors.push(
      `${where} does not release exactly the full allocation (releases ${end} of ${base})`,
    );
}

export function validateAllocationDocument(doc: unknown): ValidationReport {
  const errors: string[] = [];
  const parsed = parseStructure(doc, errors);
  if (!parsed) return report(errors);
  const totalBase = checkToken(parsed, errors);
  if (totalBase !== undefined) checkAllocations(parsed, totalBase, errors);
  const rawCirculation = (doc as Record<string, Record<string, unknown>>)['circulation'];
  if (rawCirculation?.['status'] !== 'tbd' && rawCirculation?.['status'] !== 'approved') {
    errors.push('circulation.status must be "tbd" or "approved"');
  } else if (rawCirculation['status'] === 'approved') {
    const tbd = parsed.allocations.filter((a) => a.vesting.status === 'tbd').map((a) => a.id);
    if (tbd.length > 0) {
      errors.push(`circulation is "approved" but schedules are TBD for: ${tbd.join(', ')}`);
    }
  }
  const rawEnforcement = (doc as Record<string, Record<string, unknown>>)['enforcement'];
  if (rawEnforcement?.['status'] !== 'open') {
    errors.push(
      'enforcement.status must be "open": no vesting provider has been verified (ADR-008)',
    );
  }
  return report(errors);
}

/** Validates and returns a typed document, or throws ValidationError. */
export function parseAllocationDocument(doc: unknown): AllocationDocument {
  const result = validateAllocationDocument(doc);
  if (!result.ok) throw new ValidationError('allocation document', result.errors);
  const errors: string[] = [];
  const parsed = parseStructure(doc, errors);
  if (!parsed) throw new ValidationError('allocation document', errors);
  return parsed;
}

export function loadAllocation(path: string): AllocationDocument {
  return parseAllocationDocument(readJson(path));
}
