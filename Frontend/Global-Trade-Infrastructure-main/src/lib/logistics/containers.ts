/**
 * @file lib/logistics/containers.ts
 * @description ISO shipping-container equipment types.
 *
 * Dimensions are internal (usable) in centimetres and weights in kilograms — the
 * units the freight marketplace's piece normaliser expects, so a booked container
 * quotes on its real cube and payload rather than a guessed box. `isoCode` is the
 * ISO 6346 size-type code carriers actually put on the booking.
 *
 * Payload figures are the standard maxima for the equipment type; a specific box,
 * lane or road leg can cap lower, so treat them as the ceiling, not a guarantee.
 */

export interface ContainerSpec {
  /** Equipment code used across the booking flow. */
  code: string;
  label: string;
  /** ISO 6346 size-type code. */
  isoCode: string;
  /** Twenty-foot equivalent units — what a carrier counts allocation in. */
  teu: number;
  internalLengthCm: number;
  internalWidthCm: number;
  internalHeightCm: number;
  /** Internal volume in cubic metres. */
  capacityCbm: number;
  tareWeightKg: number;
  maxPayloadKg: number;
  /** Powered equipment needs a reefer plug at the terminal and on the vessel. */
  refrigerated?: boolean;
  note?: string;
}

export const CONTAINER_SPECS: readonly ContainerSpec[] = [
  {
    code: '20GP',
    label: "20ft general purpose",
    isoCode: '22G1',
    teu: 1,
    internalLengthCm: 590,
    internalWidthCm: 235,
    internalHeightCm: 239,
    capacityCbm: 33.2,
    tareWeightKg: 2200,
    maxPayloadKg: 28200,
    note: 'The dense-cargo box — payload runs out long before the cube does.',
  },
  {
    code: '40GP',
    label: "40ft general purpose",
    isoCode: '42G1',
    teu: 2,
    internalLengthCm: 1203,
    internalWidthCm: 235,
    internalHeightCm: 239,
    capacityCbm: 67.7,
    tareWeightKg: 3750,
    maxPayloadKg: 28750,
  },
  {
    code: '40HC',
    label: "40ft high cube",
    isoCode: '45G1',
    teu: 2,
    internalLengthCm: 1203,
    internalWidthCm: 235,
    internalHeightCm: 270,
    capacityCbm: 76.4,
    tareWeightKg: 3940,
    maxPayloadKg: 28560,
    note: 'One extra foot of height — the default for volumetric cargo.',
  },
  {
    code: '45HC',
    label: "45ft high cube",
    isoCode: 'L5G1',
    teu: 2.25,
    internalLengthCm: 1356,
    internalWidthCm: 235,
    internalHeightCm: 270,
    capacityCbm: 86,
    tareWeightKg: 4800,
    maxPayloadKg: 27700,
    note: 'Not accepted on every lane or by every inland haulier.',
  },
  {
    code: '20RF',
    label: "20ft reefer",
    isoCode: '22R1',
    teu: 1,
    internalLengthCm: 544,
    internalWidthCm: 229,
    internalHeightCm: 227,
    capacityCbm: 28.3,
    tareWeightKg: 3000,
    maxPayloadKg: 27400,
    refrigerated: true,
  },
  {
    code: '40RH',
    label: "40ft high-cube reefer",
    isoCode: '45R1',
    teu: 2,
    internalLengthCm: 1158,
    internalWidthCm: 229,
    internalHeightCm: 250,
    capacityCbm: 67,
    tareWeightKg: 4800,
    maxPayloadKg: 27700,
    refrigerated: true,
  },
  {
    code: '20OT',
    label: "20ft open top",
    isoCode: '22U1',
    teu: 1,
    internalLengthCm: 588,
    internalWidthCm: 233,
    internalHeightCm: 234,
    capacityCbm: 32.1,
    tareWeightKg: 2350,
    maxPayloadKg: 28050,
    note: 'Top-loaded cargo; over-height needs carrier approval.',
  },
  {
    code: '40FR',
    label: "40ft flat rack",
    isoCode: '42P1',
    teu: 2,
    internalLengthCm: 1200,
    internalWidthCm: 240,
    internalHeightCm: 205,
    capacityCbm: 59,
    tareWeightKg: 5000,
    maxPayloadKg: 39000,
    note: 'Out-of-gauge and project cargo; rated by stow, not cube.',
  },
];

export const containerSpec = (code: string): ContainerSpec | undefined =>
  CONTAINER_SPECS.find((spec) => spec.code === code);

export interface ContainerLine {
  containerCode: string;
  quantity: number;
  /** Cargo weight per container, excluding tare. */
  cargoWeightKgPerUnit: number;
}

export interface CargoTotals {
  containers: number;
  teu: number;
  cargoWeightKg: number;
  /** Cargo plus tare — what the vessel and the road leg actually carry. */
  grossWeightKg: number;
  capacityCbm: number;
  /** Lines whose per-container cargo weight exceeds the equipment's payload. */
  overloaded: { containerCode: string; maxPayloadKg: number; cargoWeightKgPerUnit: number }[];
}

/** Roll up a set of container lines into the totals the booking and quote need. */
export function summariseCargo(lines: ContainerLine[]): CargoTotals {
  const totals: CargoTotals = { containers: 0, teu: 0, cargoWeightKg: 0, grossWeightKg: 0, capacityCbm: 0, overloaded: [] };

  for (const line of lines) {
    const spec = containerSpec(line.containerCode);
    if (!spec || line.quantity <= 0) continue;

    totals.containers += line.quantity;
    totals.teu += spec.teu * line.quantity;
    totals.cargoWeightKg += line.cargoWeightKgPerUnit * line.quantity;
    totals.grossWeightKg += (line.cargoWeightKgPerUnit + spec.tareWeightKg) * line.quantity;
    totals.capacityCbm += spec.capacityCbm * line.quantity;

    if (line.cargoWeightKgPerUnit > spec.maxPayloadKg) {
      totals.overloaded.push({
        containerCode: spec.code,
        maxPayloadKg: spec.maxPayloadKg,
        cargoWeightKgPerUnit: line.cargoWeightKgPerUnit,
      });
    }
  }

  totals.teu = Number(totals.teu.toFixed(2));
  totals.capacityCbm = Number(totals.capacityCbm.toFixed(1));
  return totals;
}

/** Container lines as freight-marketplace pieces (cm / kg), one piece set per line. */
export function toFreightPieces(lines: ContainerLine[]) {
  return lines
    .map((line) => ({ line, spec: containerSpec(line.containerCode) }))
    .filter((entry): entry is { line: ContainerLine; spec: ContainerSpec } => Boolean(entry.spec) && entry.line.quantity > 0)
    .map(({ line, spec }) => ({
      quantity: line.quantity,
      weight_kg: line.cargoWeightKgPerUnit + spec.tareWeightKg,
      length_cm: spec.internalLengthCm,
      width_cm: spec.internalWidthCm,
      height_cm: spec.internalHeightCm,
    }));
}

/** Incoterms 2020 — the rule set decides who books and pays for the main carriage. */
export const INCOTERMS = [
  { code: 'EXW', label: 'EXW — Ex Works' },
  { code: 'FCA', label: 'FCA — Free Carrier' },
  { code: 'FAS', label: 'FAS — Free Alongside Ship' },
  { code: 'FOB', label: 'FOB — Free On Board' },
  { code: 'CFR', label: 'CFR — Cost and Freight' },
  { code: 'CIF', label: 'CIF — Cost, Insurance and Freight' },
  { code: 'CPT', label: 'CPT — Carriage Paid To' },
  { code: 'CIP', label: 'CIP — Carriage and Insurance Paid To' },
  { code: 'DAP', label: 'DAP — Delivered At Place' },
  { code: 'DPU', label: 'DPU — Delivered At Place Unloaded' },
  { code: 'DDP', label: 'DDP — Delivered Duty Paid' },
] as const;
