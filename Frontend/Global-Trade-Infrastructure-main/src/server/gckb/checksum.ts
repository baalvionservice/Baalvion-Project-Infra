/**
 * @file server/gckb/checksum.ts
 * @description Deterministic content checksum for GCKB records. The checksum is a
 * stable SHA-256 over a canonical (key-sorted) JSON encoding, so two records with
 * equal content always hash identically regardless of key order. Used for change
 * detection (skip no-op versions) and import duplicate detection.
 */
import { createHash } from 'crypto';

/** Canonical JSON: object keys sorted recursively; arrays preserved in order. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortValue(obj[key]);
        return acc;
      }, {});
  }
  return value;
}

/** SHA-256 hex checksum of the canonical content. */
export function checksum(value: unknown): string {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

/** The content fields that define a record's identity for checksum purposes. */
export interface ChecksumInput {
  entityType: string;
  recordKey: string;
  name: string;
  attributes: Record<string, unknown>;
  code?: string | null;
  policyType?: string | null;
  hsCode?: string | null;
  productCategory?: string | null;
  tags?: string[];
  countryCode?: string | null;
}

export function recordChecksum(input: ChecksumInput): string {
  return checksum({
    entityType: input.entityType,
    recordKey: input.recordKey,
    name: input.name,
    attributes: input.attributes,
    code: input.code ?? null,
    policyType: input.policyType ?? null,
    hsCode: input.hsCode ?? null,
    productCategory: input.productCategory ?? null,
    tags: [...(input.tags ?? [])].sort(),
    countryCode: input.countryCode ?? null,
  });
}
