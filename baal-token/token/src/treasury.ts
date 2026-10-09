import { checkKeys, isRecord, readJson, report, ValidationError } from './guards.ts';
import type { ValidationReport } from './guards.ts';

export type Affiliation = 'independent' | 'team' | 'unassigned';

export interface SignerSlot {
  readonly slot: number;
  readonly role: string;
  readonly affiliation: Affiliation;
  readonly identity: null;
  readonly address: null;
}

export interface TreasuryPolicy {
  readonly schemaVersion: 1;
  readonly status: 'design';
  readonly treasuryMultisig: {
    readonly threshold: number;
    readonly signerCount: number;
    readonly minIndependentSigners: number;
    readonly signerSlots: readonly SignerSlot[];
    readonly recovery: readonly { readonly id: string; readonly requirement: string }[];
  };
  readonly implementation: { readonly status: 'not-yet-implemented'; readonly note: string };
}

export const REQUIRED_RECOVERY_IDS = [
  'signer-key-loss',
  'signer-compromise',
  'signer-unavailability',
  'signer-rotation',
  'quorum-loss',
] as const;

const AFFILIATIONS: readonly string[] = ['independent', 'team', 'unassigned'];

export function validateTreasuryPolicy(doc: unknown): ValidationReport {
  const errors: string[] = [];
  const top = ['schemaVersion', 'status', 'treasuryMultisig', 'implementation'];
  if (!checkKeys(doc, top, 'treasury', errors)) return report(errors);
  if (doc['schemaVersion'] !== 1) errors.push('treasury.schemaVersion must be 1');
  if (doc['status'] !== 'design')
    errors.push('treasury.status must be "design" (nothing is implemented)');

  const impl = doc['implementation'];
  if (checkKeys(impl, ['status', 'note'], 'treasury.implementation', errors)) {
    if (impl['status'] !== 'not-yet-implemented') {
      errors.push('treasury.implementation.status must be "not-yet-implemented"');
    }
  }

  const m = doc['treasuryMultisig'];
  const keys = ['threshold', 'signerCount', 'minIndependentSigners', 'signerSlots', 'recovery'];
  if (!checkKeys(m, keys, 'treasury.treasuryMultisig', errors)) return report(errors);
  const { threshold, signerCount, minIndependentSigners, signerSlots, recovery } = m;

  if (threshold !== 3) errors.push('threshold must be 3 (approved 3-of-5 design)');
  if (signerCount !== 5) errors.push('signerCount must be 5 (approved 3-of-5 design)');
  if (
    typeof minIndependentSigners !== 'number' ||
    !Number.isInteger(minIndependentSigners) ||
    minIndependentSigners < 1
  ) {
    errors.push('minIndependentSigners must be an integer of at least 1');
  }

  if (!Array.isArray(signerSlots)) {
    errors.push('signerSlots must be an array');
  } else {
    if (signerSlots.length !== signerCount)
      errors.push('signerSlots length must equal signerCount');
    const seen = new Set<unknown>();
    let independent = 0;
    signerSlots.forEach((raw: unknown, i) => {
      const path = `signerSlots[${i}]`;
      if (!checkKeys(raw, ['slot', 'role', 'affiliation', 'identity', 'address'], path, errors))
        return;
      if (!Number.isInteger(raw['slot'])) errors.push(`${path}.slot must be an integer`);
      if (seen.has(raw['slot'])) errors.push(`${path}.slot is duplicated`);
      seen.add(raw['slot']);
      if (typeof raw['role'] !== 'string' || raw['role'] === '')
        errors.push(`${path}.role must be a non-empty string`);
      if (typeof raw['affiliation'] !== 'string' || !AFFILIATIONS.includes(raw['affiliation'])) {
        errors.push(`${path}.affiliation must be independent, team or unassigned`);
      }
      if (raw['affiliation'] === 'independent') independent += 1;
      if (raw['identity'] !== null)
        errors.push(`${path}.identity must be null: signers are not named yet`);
      if (raw['address'] !== null)
        errors.push(`${path}.address must be null: no wallets exist yet`);
    });
    if (typeof minIndependentSigners === 'number' && independent < minIndependentSigners) {
      errors.push(
        `only ${independent} independent signer slot(s); at least ${minIndependentSigners} required`,
      );
    }
  }

  if (!Array.isArray(recovery)) {
    errors.push('recovery must be an array');
  } else {
    const ids = recovery.map((r: unknown) => (isRecord(r) ? r['id'] : undefined));
    for (const required of REQUIRED_RECOVERY_IDS) {
      if (!ids.includes(required)) errors.push(`recovery requirement "${required}" is missing`);
    }
    recovery.forEach((r: unknown, i) => {
      if (checkKeys(r, ['id', 'requirement'], `recovery[${i}]`, errors)) {
        if (typeof r['requirement'] !== 'string' || r['requirement'].length < 20) {
          errors.push(`recovery[${i}].requirement must be a meaningful sentence`);
        }
      }
    });
  }
  return report(errors);
}

export interface QuorumAnalysis {
  readonly independentSlots: number;
  readonly nonIndependentSlots: number;
  /** True if signers who are not independent could reach the threshold with no independent signer. */
  readonly nonIndependentCanReachThreshold: boolean;
}

export function analyseQuorum(policy: TreasuryPolicy): QuorumAnalysis {
  const { signerSlots, threshold } = policy.treasuryMultisig;
  const independentSlots = signerSlots.filter((s) => s.affiliation === 'independent').length;
  const nonIndependentSlots = signerSlots.length - independentSlots;
  return {
    independentSlots,
    nonIndependentSlots,
    nonIndependentCanReachThreshold: nonIndependentSlots >= threshold,
  };
}

export function loadTreasuryPolicy(path: string): TreasuryPolicy {
  const raw = readJson(path);
  const result = validateTreasuryPolicy(raw);
  if (!result.ok) throw new ValidationError('treasury policy', result.errors);
  return raw as TreasuryPolicy;
}
