/**
 * @file server/search/document.ts
 * @description PROMPT 8 — pure projection of a GCKB catalogue record into a flat
 * `SearchDocument`. The three facet axes are lifted out of the generic record:
 *   • Category — the promoted `productCategory` column, else `attributes.categoryKey`.
 *   • Country  — `attributes.originCountryCode` (ISO-3166-1 alpha-2, uppercased).
 *   • Price    — `commercialTerms.unitPrice` › `tradeMetadata.indicativeUnitPrice`
 *                › a variant's `price.amount`; the matching currency travels with it.
 * No I/O: a record in, a document out — trivially unit-testable.
 */
import { GckbRecord } from '@prisma/client';
import { getEntityDefinition } from '../gckb/registry';
import { SearchDocument } from './types';

type Json = Record<string, unknown>;

function asObject(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Coerce a JSON scalar to a finite number (accepts numeric strings). */
function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** First image-ish media URL on the record, if any. */
function firstImage(attrs: Json): string | null {
  const media = attrs.media;
  if (!Array.isArray(media)) return null;
  for (const item of media) {
    const obj = asObject(item);
    const url = obj ? asString(obj.url) : null;
    if (url) return url;
  }
  return null;
}

/** Promoted unit price + currency, in source-of-truth precedence order. */
function extractPrice(attrs: Json): { price: number | null; currency: string | null } {
  const commercial = asObject(attrs.commercialTerms);
  const trade = asObject(attrs.tradeMetadata);
  const variantPrice = asObject(attrs.price);

  const price =
    (commercial && asNumber(commercial.unitPrice)) ??
    (trade && asNumber(trade.indicativeUnitPrice)) ??
    (variantPrice && asNumber(variantPrice.amount)) ??
    null;

  const currency =
    (commercial && asString(commercial.currency)) ??
    (trade && asString(trade.currency)) ??
    (variantPrice && asString(variantPrice.currency)) ??
    null;

  return { price, currency: currency ? currency.toUpperCase() : null };
}

function buildSearchText(parts: Array<string | null | undefined>): string {
  return parts
    .filter((p): p is string => Boolean(p))
    .join(' ')
    .toLowerCase();
}

/** Project a generic GCKB record into the flat search document. */
export function projectRecord(record: GckbRecord): SearchDocument {
  const attrs = asObject(record.attributes) ?? {};

  const category = record.productCategory ?? asString(attrs.categoryKey) ?? asString(attrs.productCategory);
  const countryRaw = asString(attrs.originCountryCode) ?? asString(attrs.countryCode) ?? asString(attrs.originCountry);
  const country = countryRaw ? countryRaw.toUpperCase() : null;
  const brand = asString(attrs.brand);
  const description = asString(attrs.description);
  const { price, currency } = extractPrice(attrs);

  return {
    id: record.id,
    organizationId: record.organizationId,
    entityType: record.entityType,
    domain: getEntityDefinition(record.entityType)?.domain ?? null,
    recordKey: record.recordKey,
    title: record.name,
    description,
    category,
    country,
    price,
    currency,
    brand,
    hsCode: record.hsCode,
    tags: record.tags ?? [],
    status: record.status,
    imageUrl: firstImage(attrs),
    updatedAt: record.updatedAt.toISOString(),
    searchText: buildSearchText([
      record.name,
      record.recordKey,
      record.code,
      record.hsCode,
      category,
      brand,
      description,
      country,
      ...(record.tags ?? []),
    ]),
  };
}
