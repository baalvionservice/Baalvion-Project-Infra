/**
 * @file server/logistics/freight-rating.ts
 * @description Pure freight-rating maths: chargeable (volumetric) weight and the
 * quote total from a rate card. Carriers bill the greater of actual and
 * volumetric weight; this module computes that deterministically so quoting is
 * exhaustively testable. Money rounding is half-up to 2 decimal places.
 */

/** Default volumetric factors (kg per m³) by transport mode. */
export const VOLUMETRIC_FACTOR_KG_PER_M3: Readonly<Record<string, number>> = {
  AIR: 167, // IATA 1:6 (1 m³ ≈ 167 kg)
  SEA: 1000, // 1 m³ ≈ 1 tonne (LCL)
  ROAD: 333,
  RAIL: 333,
  MULTIMODAL: 500,
};

export interface FreightRatingInput {
  mode: string;
  weightKg?: number; // actual gross weight
  volumeM3?: number; // shipment volume
  ratePerKg: number; // currency per chargeable kg
  minimumCharge?: number; // floor on the base amount
  surchargePct?: number; // % surcharge on the base (fuel, security, …)
  volumetricFactorKgPerM3?: number; // override the mode default
}

export interface FreightRating {
  chargeableWeightKg: number;
  baseAmount: number;
  surchargeAmount: number;
  totalAmount: number;
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** The volumetric (dimensional) weight for a volume at the mode's factor. */
export function volumetricWeightKg(mode: string, volumeM3: number, factorOverride?: number): number {
  const factor = factorOverride ?? VOLUMETRIC_FACTOR_KG_PER_M3[mode.toUpperCase()] ?? 500;
  return round(volumeM3 * factor, 3);
}

/** The chargeable weight: the greater of actual and volumetric weight. */
export function chargeableWeightKg(input: Pick<FreightRatingInput, 'mode' | 'weightKg' | 'volumeM3' | 'volumetricFactorKgPerM3'>): number {
  const actual = input.weightKg ?? 0;
  const volumetric = input.volumeM3 ? volumetricWeightKg(input.mode, input.volumeM3, input.volumetricFactorKgPerM3) : 0;
  return round(Math.max(actual, volumetric), 3);
}

/** Rate a freight shipment into a base + surcharge + total breakdown. */
export function rateFreight(input: FreightRatingInput): FreightRating {
  if (input.ratePerKg < 0) throw new Error('RATE_NEGATIVE: ratePerKg must be non-negative');
  const chargeable = chargeableWeightKg(input);
  let base = round(chargeable * input.ratePerKg, 2);
  if (input.minimumCharge !== undefined && base < input.minimumCharge) base = round(input.minimumCharge, 2);
  const surcharge = round(base * ((input.surchargePct ?? 0) / 100), 2);
  const total = round(base + surcharge, 2);
  return { chargeableWeightKg: chargeable, baseAmount: base, surchargeAmount: surcharge, totalAmount: total };
}

/** Whether a quote is still valid at `now` (null validUntil = open-ended). */
export function isQuoteValid(validUntil: Date | null, now: Date): boolean {
  if (!validUntil) return true;
  return now.getTime() <= validUntil.getTime();
}
