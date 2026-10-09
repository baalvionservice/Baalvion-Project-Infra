// Supply model. Six different quantities that must never be conflated:
//
//   total       the fixed supply (design value until a token exists)
//   allocated   the part of total assigned to an allocation (equals total)
//   locked      allocated minus vested/eligible, only where a schedule is approved
//   vested      released by an approved schedule and so ELIGIBLE to be distributed
//   distributed observed as actually sent to a holder outside the allocation's own custody
//   circulating distributed AND eligible, only where a schedule is approved
//
// Unlocked is not circulating: vested tokens that were never distributed stay
// out of circulation. An allocation whose schedule is TBD contributes null to
// every derived quantity, never zero and never a guess, so a TBD schedule can
// not leak into a circulating-supply number.

import type { AllocationDocument } from './allocation.ts';
import { parseUint } from './units.ts';
import { vestedAmount, vestingParamsFromSpec } from './vesting.ts';

export interface SupplyObservation {
  /** Unix seconds of the observation. */
  readonly at: number;
  /** TGE timestamp. Undefined means BAAL has not launched: nothing is vested or distributed. */
  readonly tge: number | undefined;
  /** Observed base units distributed out of each allocation, keyed by allocation id. */
  readonly distributed?: Readonly<Record<string, bigint>>;
}

export interface AllocationSupply {
  readonly id: string;
  readonly allocated: bigint;
  readonly scheduleStatus: 'approved' | 'tbd';
  readonly vestedEligible: bigint | null;
  readonly locked: bigint | null;
  readonly distributed: bigint;
  readonly circulating: bigint | null;
}

export interface SupplyReport {
  readonly totalSupply: bigint;
  readonly allocated: bigint;
  readonly allocations: readonly AllocationSupply[];
  readonly tbdAllocationIds: readonly string[];
  /** null while any schedule is TBD. */
  readonly locked: bigint | null;
  /** null while any schedule is TBD. */
  readonly vestedEligible: bigint | null;
  readonly distributed: bigint;
  /** null while any schedule is TBD. */
  readonly circulating: bigint | null;
}

export function computeSupply(doc: AllocationDocument, obs: SupplyObservation): SupplyReport {
  const distributedIn = obs.distributed ?? {};
  const ids = new Set(doc.allocations.map((a) => a.id));
  for (const [id, amount] of Object.entries(distributedIn)) {
    if (!ids.has(id)) throw new RangeError(`distributed names unknown allocation "${id}"`);
    if (amount < 0n) throw new RangeError(`distributed for "${id}" must not be negative`);
    if (obs.tge === undefined && amount !== 0n) {
      throw new RangeError('nothing can be distributed before launch (tge is undefined)');
    }
  }

  const rows: AllocationSupply[] = doc.allocations.map((a) => {
    const allocated = parseUint(a.baseUnits);
    if (allocated === undefined) throw new RangeError(`allocation "${a.id}" has invalid baseUnits`);
    const distributed = distributedIn[a.id] ?? 0n;
    const params = vestingParamsFromSpec(a.vesting);
    if (a.vesting.status === 'tbd' || params === undefined) {
      return {
        id: a.id,
        allocated,
        scheduleStatus: 'tbd',
        vestedEligible: null,
        locked: null,
        distributed,
        circulating: null,
      };
    }
    const vested = obs.tge === undefined ? 0n : vestedAmount(allocated, params, obs.tge, obs.at);
    if (distributed > vested) {
      throw new RangeError(
        `allocation "${a.id}" distributed ${distributed} exceeds vested ${vested}`,
      );
    }
    return {
      id: a.id,
      allocated,
      scheduleStatus: 'approved',
      vestedEligible: vested,
      locked: allocated - vested,
      distributed,
      circulating: distributed,
    };
  });

  const tbd = rows.filter((r) => r.scheduleStatus === 'tbd').map((r) => r.id);
  const sumKnown = (pick: (r: AllocationSupply) => bigint | null): bigint | null =>
    tbd.length > 0 ? null : rows.reduce((sum, r) => sum + (pick(r) ?? 0n), 0n);

  return {
    totalSupply: BigInt(doc.token.totalSupplyBaseUnits),
    allocated: rows.reduce((sum, r) => sum + r.allocated, 0n),
    allocations: rows,
    tbdAllocationIds: tbd,
    locked: sumKnown((r) => r.locked),
    vestedEligible: sumKnown((r) => r.vestedEligible),
    distributed: rows.reduce((sum, r) => sum + r.distributed, 0n),
    circulating: sumKnown((r) => r.circulating),
  };
}

/** The only sanctioned way to obtain a publishable circulating supply. */
export function requireCirculating(report: SupplyReport): bigint {
  if (report.circulating === null) {
    throw new RangeError(
      `circulating supply is undetermined: schedules are TBD for ${report.tbdAllocationIds.join(', ')}`,
    );
  }
  return report.circulating;
}
