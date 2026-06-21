/**
 * @file server/gckb/registries/product.ts
 * @description MODULE 1 — Universal Product Registry, expressed as GCKB registry
 * configuration. A product, its taxonomy (product_category), its brand and its
 * manufacturer are all knowledge-base entities: one generic versioned record
 * shape with an entity-specific `attributes` schema. Because they are registered
 * with the GCKB registry, they inherit the entire platform lifecycle for free —
 * versioning, append-only history, side-by-side version comparison, temporal
 * (`asOf`) search, faceted search (hsCode / productCategory / code / tag /
 * keyword), CSV/JSON import with dry-run + rollback, export, immutable audit,
 * domain events through the transactional outbox, and Row-Level-Security tenant
 * isolation — with **no new table, migration, service or route**.
 *
 * Nothing here is hardcoded business data: there are no seeded products,
 * categories, brands or manufacturers. The schemas describe *shape only*; real
 * reference data is loaded through the import API.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/**
 * Typed relationship edges emitted by product-domain records. Declared as
 * constants so services, tests and the Admin UI never use magic strings.
 */
export const PRODUCT_RELATIONSHIP_TYPES = {
  /** product → manufacturer */
  MANUFACTURED_BY: 'MANUFACTURED_BY',
  /** product → brand */
  BRANDED_AS: 'BRANDED_AS',
  /** product → product_category */
  CLASSIFIED_AS: 'CLASSIFIED_AS',
  /** product → hs_code (Module 2; held by toRef until the entity exists) */
  CLASSIFIED_UNDER_HS: 'CLASSIFIED_UNDER_HS',
  /** product → certificate (Module 3) */
  REQUIRES_CERTIFICATE: 'REQUIRES_CERTIFICATE',
  /** product → country (origin) */
  ORIGINATES_FROM: 'ORIGINATES_FROM',
  /** product → product (a variant — colour/size/grade) */
  VARIANT_OF: 'VARIANT_OF',
  /** product → product (interchangeable substitute) */
  SUBSTITUTE_FOR: 'SUBSTITUTE_FOR',
  /** product → product (bill-of-materials component) */
  COMPONENT_OF: 'COMPONENT_OF',
  /** product_category → product_category (taxonomy parent) */
  SUBCATEGORY_OF: 'SUBCATEGORY_OF',
} as const;

export type ProductRelationshipType =
  (typeof PRODUCT_RELATIONSHIP_TYPES)[keyof typeof PRODUCT_RELATIONSHIP_TYPES];

// ── Reusable attribute fragments ─────────────────────────────────────────────

const dimensionsSchema = z.object({
  length: z.number().nonnegative().optional(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  unit: z.string().min(1), // cm | in | m
});

const weightSchema = z.object({
  net: z.number().nonnegative().optional(),
  gross: z.number().nonnegative().optional(),
  tare: z.number().nonnegative().optional(),
  unit: z.string().min(1), // kg | g | lb | t
});

const volumeSchema = z.object({
  value: z.number().nonnegative().optional(),
  unit: z.string().min(1).optional(), // l | ml | m3 | cbm
  dimensions: dimensionsSchema.optional(),
});

const shelfLifeSchema = z.object({
  value: z.number().int().positive(),
  unit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  afterOpeningDays: z.number().int().positive().optional(),
  note: z.string().optional(),
});

const storageConditionsSchema = z.object({
  temperatureMin: z.number().optional(),
  temperatureMax: z.number().optional(),
  temperatureUnit: z.string().optional(), // C | F
  humidityMin: z.number().min(0).max(100).optional(),
  humidityMax: z.number().min(0).max(100).optional(),
  lightSensitive: z.boolean().optional(),
  controlledTemperature: z.boolean().optional(),
  hazardClass: z.string().optional(),
  specialHandling: z.array(z.string()).optional(),
});

const packagingSchema = z.object({
  packageType: z.string().optional(), // BOX | PALLET | DRUM | BAG | CARTON | …
  unitsPerPackage: z.number().int().positive().optional(),
  packagesPerLayer: z.number().int().positive().optional(),
  layersPerPallet: z.number().int().positive().optional(),
  materials: z.array(z.string()).optional(),
  dimensions: dimensionsSchema.optional(),
  grossWeight: z.number().nonnegative().optional(),
  recyclable: z.boolean().optional(),
  marksAndNumbers: z.string().optional(),
});

const tradeMetadataSchema = z.object({
  unitOfMeasure: z.string().optional(), // PCS | KG | L | M | …
  incoterms: z.array(z.string()).optional(),
  dutiable: z.boolean().optional(),
  dangerousGoods: z.boolean().optional(),
  unNumber: z.string().optional(),
  countryOfOriginCriterion: z.string().optional(),
  exportControlClassification: z.string().optional(),
  dualUse: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  indicativeUnitPrice: z.number().nonnegative().optional(),
});

const complianceSchema = z.object({
  rohs: z.boolean().optional(),
  reach: z.boolean().optional(),
  ceMarking: z.boolean().optional(),
  fdaRegulated: z.boolean().optional(),
  organic: z.boolean().optional(),
  halal: z.boolean().optional(),
  kosher: z.boolean().optional(),
  frameworks: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const hsClassificationSchema = z.object({
  hsCode: z.string().min(2),
  countryCode: z.string().optional(), // country-specific extension classification
  description: z.string().optional(),
  preferential: z.boolean().optional(),
});

const certificateRefSchema = z.object({
  certificateType: z.string().min(1),
  certificateKey: z.string().optional(), // → certificate registry (Module 3)
  issuer: z.string().optional(),
  number: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

const restrictionSchema = z.object({
  type: z.string().min(1), // IMPORT_BAN | EXPORT_CONTROL | LICENSE_REQUIRED | AGE_RESTRICTED | …
  jurisdictionCode: z.string().optional(), // country / region code the restriction applies in
  description: z.string().optional(),
  authority: z.string().optional(),
  reference: z.string().optional(),
});

// ── Entity attribute schemas ─────────────────────────────────────────────────

const productSchema = z.object({
  // Identity — any of these may seed the natural key; all optional so a product
  // can be created with just a name and enriched later.
  globalProductId: z.string().optional(), // platform GPID
  gtin: z.string().optional(), // GTIN / EAN / UPC
  sku: z.string().optional(),
  mpn: z.string().optional(), // manufacturer part number
  description: z.string().optional(),
  // Soft references to sibling registry records (resolved to typed edges).
  brand: z.string().optional(),
  brandKey: z.string().optional(),
  manufacturer: z.string().optional(),
  manufacturerKey: z.string().optional(),
  categoryKey: z.string().optional(),
  // Origin.
  originCountryCode: z.string().optional(),
  originRegion: z.string().optional(),
  // Free-form, configurable specifications (no hardcoded attribute set).
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  // Physical envelope.
  packaging: packagingSchema.optional(),
  weight: weightSchema.optional(),
  volume: volumeSchema.optional(),
  shelfLife: shelfLifeSchema.optional(),
  storageConditions: storageConditionsSchema.optional(),
  // Trade / compliance.
  tradeMetadata: tradeMetadataSchema.optional(),
  hsClassifications: z.array(hsClassificationSchema).optional(),
  certificates: z.array(certificateRefSchema).optional(),
  compliance: complianceSchema.optional(),
  restrictions: z.array(restrictionSchema).optional(),
});

const productCategorySchema = z.object({
  classificationSystem: z.string().optional(), // INTERNAL | UNSPSC | GS1 | HS | CUSTOM
  level: z.number().int().nonnegative().optional(),
  parentCategoryKey: z.string().optional(),
  description: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
});

const brandSchema = z.object({
  legalName: z.string().optional(),
  ownerOrganizationKey: z.string().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  countryCode: z.string().optional(),
  trademarkNumber: z.string().optional(),
});

const manufacturerSchema = z.object({
  legalName: z.string().optional(),
  registrationNumber: z.string().optional(),
  gln: z.string().optional(), // GS1 Global Location Number
  countryCode: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ── Natural-key derivation ───────────────────────────────────────────────────

function productKey(i: KbWriteInput): string {
  const a = i.attributes ?? {};
  const id = a.globalProductId ?? a.gtin ?? a.sku ?? i.code;
  return id ? String(id).trim() : slug(i.name);
}

function codeOrSlugKey(i: KbWriteInput): string {
  return String(i.code ?? slug(i.name)).toUpperCase();
}

// ── Form metadata (drives the registry-driven Admin UI) ──────────────────────

const productRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY, label: 'Manufactured by', toType: 'manufacturer' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.BRANDED_AS, label: 'Branded as', toType: 'brand' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_AS, label: 'Classified as', toType: 'product_category' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_UNDER_HS, label: 'HS classification', toType: 'hs_code' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.REQUIRES_CERTIFICATE, label: 'Requires certificate', toType: 'certificate' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.ORIGINATES_FROM, label: 'Origin', toType: 'country' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.VARIANT_OF, label: 'Variant of', toType: 'product' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.SUBSTITUTE_FOR, label: 'Substitute for', toType: 'product' },
  { relationType: PRODUCT_RELATIONSHIP_TYPES.COMPONENT_OF, label: 'Component of', toType: 'product' },
];

const productFormFields: KbEntityDefinition['formFields'] = [
  { name: 'name', label: 'Product name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'SKU / code', type: 'string', placement: 'top', description: 'Promoted, indexed identifier.' },
  { name: 'hsCode', label: 'HS code', type: 'string', placement: 'top', description: 'Primary HS classification (indexed facet).' },
  { name: 'productCategory', label: 'Category', type: 'string', placement: 'top', description: 'Promoted category facet (indexed).' },
  { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
  { name: 'gtin', label: 'GTIN / EAN / UPC', type: 'string', placement: 'attributes' },
  { name: 'brand', label: 'Brand', type: 'string', placement: 'attributes' },
  { name: 'manufacturer', label: 'Manufacturer', type: 'string', placement: 'attributes' },
  { name: 'originCountryCode', label: 'Country of origin', type: 'string', placement: 'attributes' },
  { name: 'specifications', label: 'Specifications', type: 'json', placement: 'attributes' },
  { name: 'weight', label: 'Weight', type: 'json', placement: 'attributes' },
  { name: 'volume', label: 'Volume / dimensions', type: 'json', placement: 'attributes' },
  { name: 'packaging', label: 'Packaging', type: 'json', placement: 'attributes' },
  { name: 'shelfLife', label: 'Shelf life', type: 'json', placement: 'attributes' },
  { name: 'storageConditions', label: 'Storage conditions', type: 'json', placement: 'attributes' },
  { name: 'tradeMetadata', label: 'Trade metadata', type: 'json', placement: 'attributes' },
  { name: 'compliance', label: 'Compliance metadata', type: 'json', placement: 'attributes' },
  { name: 'restrictions', label: 'Restrictions', type: 'json', placement: 'attributes' },
];

// ── The product-domain registry ──────────────────────────────────────────────

export const productEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'product',
    label: 'Product',
    description: 'A universal, versioned product master record (GPID, HS code, specs, packaging, trade & compliance metadata).',
    domain: 'product',
    countryScoped: false,
    schema: productSchema,
    recordKey: productKey,
    events: { created: 'PRODUCT_CREATED', updated: 'PRODUCT_UPDATED', archived: 'PRODUCT_ARCHIVED' },
    formFields: productFormFields,
    relationshipTypes: productRelationshipTypes,
  }),
  simpleEntity({
    entityType: 'product_category',
    label: 'Product Category',
    description: 'A node in a configurable product taxonomy (no hardcoded category tree).',
    domain: 'product',
    countryScoped: false,
    schema: productCategorySchema,
    recordKey: codeOrSlugKey,
    events: { created: 'PRODUCT_CATEGORY_CREATED', updated: 'PRODUCT_CATEGORY_UPDATED', archived: 'PRODUCT_CATEGORY_ARCHIVED' },
    relationshipTypes: [
      { relationType: PRODUCT_RELATIONSHIP_TYPES.SUBCATEGORY_OF, label: 'Subcategory of', toType: 'product_category' },
    ],
    formFields: [
      { name: 'name', label: 'Category name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'classificationSystem', label: 'Classification system', type: 'string', placement: 'attributes' },
      { name: 'parentCategoryKey', label: 'Parent category key', type: 'string', placement: 'attributes' },
      { name: 'level', label: 'Level', type: 'number', placement: 'attributes' },
      { name: 'synonyms', label: 'Synonyms', type: 'string[]', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'brand',
    label: 'Brand',
    description: 'A product brand, optionally owned by an organization registry record.',
    domain: 'product',
    countryScoped: false,
    schema: brandSchema,
    recordKey: codeOrSlugKey,
    events: { created: 'BRAND_CREATED', updated: 'BRAND_UPDATED', archived: 'BRAND_ARCHIVED' },
    formFields: [
      { name: 'name', label: 'Brand name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'legalName', label: 'Legal name', type: 'string', placement: 'attributes' },
      { name: 'website', label: 'Website', type: 'string', placement: 'attributes' },
      { name: 'countryCode', label: 'Country', type: 'string', placement: 'attributes' },
      { name: 'trademarkNumber', label: 'Trademark number', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'manufacturer',
    label: 'Manufacturer',
    description: 'A manufacturing organization (links to the Organization Registry — Module 4 — via a typed edge).',
    domain: 'product',
    countryScoped: false,
    schema: manufacturerSchema,
    recordKey: codeOrSlugKey,
    events: { created: 'MANUFACTURER_CREATED', updated: 'MANUFACTURER_UPDATED', archived: 'MANUFACTURER_ARCHIVED' },
    formFields: [
      { name: 'name', label: 'Manufacturer name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'legalName', label: 'Legal name', type: 'string', placement: 'attributes' },
      { name: 'registrationNumber', label: 'Registration number', type: 'string', placement: 'attributes' },
      { name: 'gln', label: 'GLN', type: 'string', placement: 'attributes' },
      { name: 'countryCode', label: 'Country', type: 'string', placement: 'attributes' },
      { name: 'website', label: 'Website', type: 'string', placement: 'attributes' },
      { name: 'email', label: 'Email', type: 'string', placement: 'attributes' },
    ],
  }),
];
