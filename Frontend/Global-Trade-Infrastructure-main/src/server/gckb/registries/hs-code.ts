/**
 * @file server/gckb/registries/hs-code.ts
 * @description MODULE 2 — Global HS (Harmonized System) Registry, expressed as
 * GCKB registry configuration. A single `hs_code` entity models the full HS
 * hierarchy (chapter HS2 → heading HS4 → subheading HS6 → tariff lines HS8/HS10)
 * plus national/country extensions, explanatory notes and effective-dated
 * editions (HS 2017 / 2022 / …). Because it is registered with the GCKB engine,
 * it inherits versioning, append-only history, side-by-side version comparison,
 * effective-dated (`asOf`) search, faceted search (the promoted `hsCode` column),
 * CSV/JSON import with dry-run + rollback, export, immutable audit, domain events
 * and Row-Level-Security tenant isolation — with **no new table, migration,
 * service or route**.
 *
 * No HS data is seeded; real HS nomenclature is loaded through the import API.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/** Valid HS code lengths (digits): chapter, heading, subheading, tariff lines. */
export const HS_LEVELS = [2, 4, 6, 8, 10] as const;

/** Typed relationship edges emitted by HS records (no magic strings). */
export const HS_RELATIONSHIP_TYPES = {
  /** hs_code → hs_code (its parent in the hierarchy, e.g. 100630 → 1006) */
  SUBHEADING_OF: 'SUBHEADING_OF',
  /** national hs_code → the international HS6 it extends */
  NATIONAL_EXTENSION_OF: 'NATIONAL_EXTENSION_OF',
  /** hs_code → hs_code ("see also" cross-reference) */
  CROSS_REFERENCED: 'CROSS_REFERENCED',
  /** hs_code → hs_code in a prior edition this one replaces */
  SUPERSEDES: 'SUPERSEDES',
} as const;

export type HsRelationshipType =
  (typeof HS_RELATIONSHIP_TYPES)[keyof typeof HS_RELATIONSHIP_TYPES];

const hsCodeSchema = z.object({
  // Code length: 2/4/6/8/10. HS2-6 are the international (WCO) levels; 8/10 are
  // national tariff lines.
  level: z
    .number()
    .int()
    .refine((v) => (HS_LEVELS as readonly number[]).includes(v), { message: 'must be one of 2, 4, 6, 8, 10' }),
  parentHsCode: z.string().optional(), // hierarchy parent (e.g. '1006' for '100630')
  section: z.string().optional(), // HS Section (I–XXI)
  chapter: z.string().optional(), // HS Chapter (01–99)
  edition: z.string().optional(), // 'HS2022' | 'HS2017' | national schedule edition
  countryCode: z.string().optional(), // set for national extensions (HS8/HS10)
  unitOfQuantity: z.string().optional(), // standard unit (KG, NMB/number, M2, …)
  explanatoryNotes: z.string().optional(),
  inclusions: z.array(z.string()).optional(), // "this heading covers …"
  exclusions: z.array(z.string()).optional(), // "this heading does not cover …"
  keywords: z.array(z.string()).optional(),
});

/**
 * Natural key: the (dot/space-stripped) HS code, prefixed with the country code
 * for national extensions so 'IN:10063010' and the international '1006' coexist.
 */
function hsKey(i: KbWriteInput): string {
  const raw = i.hsCode ?? i.code ?? slug(i.name);
  const code = String(raw).replace(/[.\s]/g, '');
  const cc = i.attributes?.countryCode ? `${String(i.attributes.countryCode).toUpperCase()}:` : '';
  return `${cc}${code}`;
}

const hsRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: HS_RELATIONSHIP_TYPES.SUBHEADING_OF, label: 'Subheading of', toType: 'hs_code' },
  { relationType: HS_RELATIONSHIP_TYPES.NATIONAL_EXTENSION_OF, label: 'National extension of', toType: 'hs_code' },
  { relationType: HS_RELATIONSHIP_TYPES.CROSS_REFERENCED, label: 'Cross-referenced', toType: 'hs_code' },
  { relationType: HS_RELATIONSHIP_TYPES.SUPERSEDES, label: 'Supersedes', toType: 'hs_code' },
];

const hsFormFields: KbEntityDefinition['formFields'] = [
  { name: 'name', label: 'Heading description', type: 'string', placement: 'top', required: true },
  { name: 'hsCode', label: 'HS code', type: 'string', placement: 'top', required: true, description: 'Promoted, indexed facet (2/4/6/8/10 digits).' },
  { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
  { name: 'level', label: 'Level (digits)', type: 'enum', placement: 'attributes', required: true, options: HS_LEVELS.map(String) },
  { name: 'parentHsCode', label: 'Parent HS code', type: 'string', placement: 'attributes' },
  { name: 'countryCode', label: 'Country (national extension)', type: 'string', placement: 'attributes' },
  { name: 'section', label: 'HS Section', type: 'string', placement: 'attributes' },
  { name: 'chapter', label: 'HS Chapter', type: 'string', placement: 'attributes' },
  { name: 'edition', label: 'Edition', type: 'string', placement: 'attributes', description: 'e.g. HS2022.' },
  { name: 'unitOfQuantity', label: 'Unit of quantity', type: 'string', placement: 'attributes' },
  { name: 'explanatoryNotes', label: 'Explanatory notes', type: 'text', placement: 'attributes' },
  { name: 'inclusions', label: 'Inclusions', type: 'string[]', placement: 'attributes' },
  { name: 'exclusions', label: 'Exclusions', type: 'string[]', placement: 'attributes' },
  { name: 'keywords', label: 'Keywords', type: 'string[]', placement: 'attributes' },
];

export const hsCodeEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'hs_code',
    label: 'HS Code',
    description: 'A Harmonized System nomenclature node (HS2–HS10), with hierarchy, national extensions, explanatory notes and effective-dated editions.',
    domain: 'hs',
    countryScoped: false,
    schema: hsCodeSchema,
    recordKey: hsKey,
    events: { created: 'HS_CODE_CREATED', updated: 'HS_CODE_UPDATED', archived: 'HS_CODE_ARCHIVED' },
    formFields: hsFormFields,
    relationshipTypes: hsRelationshipTypes,
  }),
];
