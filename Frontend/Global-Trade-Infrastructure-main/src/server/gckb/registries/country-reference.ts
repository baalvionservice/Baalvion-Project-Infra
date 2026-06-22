/**
 * @file server/gckb/registries/country-reference.ts
 * @description The country-reference domain, expressed as GCKB registry
 * configuration. A country, its currencies, languages, timezones, the trade
 * regions / agreements it belongs to, its subdivisions, government authorities
 * and points of entry are all knowledge-base entities: one generic versioned
 * record shape with an entity-specific `attributes` schema. By registering them
 * with the GCKB registry they inherit the whole platform lifecycle for free —
 * versioning, append-only history, side-by-side version comparison, temporal
 * (`asOf`) search, faceted search, CSV/JSON import with dry-run + rollback,
 * export, immutable audit, transactional-outbox domain events and Row-Level
 * Security tenant isolation — with **no new table, migration, service or route**.
 *
 * Each definition also carries declarative `formFields` and `relationshipTypes`
 * so the registry-driven Admin UI (`GET /api/gckb/entities`) can render dynamic
 * create/edit forms and the public explorers can label fields — without
 * hardcoding any entity's shape. Nothing here is seeded business data: the
 * schemas describe *shape only*; real country data is loaded through the import
 * API or the seed tooling.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  FormFieldDescriptor,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/**
 * Typed relationship edges emitted by country-reference records. Declared as
 * constants so services, tests and the Admin UI never use magic strings.
 */
export const COUNTRY_RELATIONSHIP_TYPES = {
  /** country → currency */
  USES_CURRENCY: 'USES_CURRENCY',
  /** country → language */
  USES_LANGUAGE: 'USES_LANGUAGE',
  /** country → timezone */
  OBSERVES_TIMEZONE: 'OBSERVES_TIMEZONE',
  /** country → trade_region (continent / economic bloc / customs territory) */
  MEMBER_OF_REGION: 'MEMBER_OF_REGION',
  /** country → trade_agreement (FTA / customs union / EPA …) */
  PARTY_TO_AGREEMENT: 'PARTY_TO_AGREEMENT',
  /** subdivision → country */
  SUBDIVISION_OF: 'SUBDIVISION_OF',
  /** authority → country (the jurisdiction it governs) */
  AUTHORITY_OF: 'AUTHORITY_OF',
  /** authority → authority (parent ministry / agency) */
  PARENT_AUTHORITY: 'PARENT_AUTHORITY',
  /** point_of_entry → subdivision (where it is physically located) */
  LOCATED_IN: 'LOCATED_IN',
  /** point_of_entry → authority (the customs office that oversees it) */
  OVERSEEN_BY: 'OVERSEEN_BY',
  /** trade_agreement → country (a member party) */
  HAS_MEMBER: 'HAS_MEMBER',
  /** trade_region → country (a member country) */
  REGION_INCLUDES: 'REGION_INCLUDES',
} as const;

export type CountryRelationshipType =
  (typeof COUNTRY_RELATIONSHIP_TYPES)[keyof typeof COUNTRY_RELATIONSHIP_TYPES];

// ── Attribute schemas for the strongly-relational anchor entities ────────────

const countrySchema = z.object({
  alpha2: z.string().length(2),
  alpha3: z.string().length(3),
  numericCode: z.string().optional(),
  officialName: z.string().optional(),
  capital: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  currencyCodes: z.array(z.string()).optional(),
  languageCodes: z.array(z.string()).optional(),
  timezoneCodes: z.array(z.string()).optional(),
  dialingCode: z.string().optional(),
  flagEmoji: z.string().optional(),
});

const currencySchema = z.object({
  alpha: z.string().length(3),
  numericCode: z.string().optional(),
  minorUnits: z.number().int().min(0).optional(),
  symbol: z.string().optional(),
});

const languageSchema = z.object({
  iso639_1: z.string().optional(),
  iso639_2: z.string().optional(),
  nativeName: z.string().optional(),
  direction: z.enum(['LTR', 'RTL']).optional(),
});

const timezoneSchema = z.object({
  tzName: z.string().min(1),
  utcOffset: z.string().min(1),
  dst: z.boolean().optional(),
});

const tradeRegionSchema = z.object({
  kind: z.string().min(1), // CONTINENT | ECONOMIC_BLOC | CUSTOMS_TERRITORY
  memberCountryCodes: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const subdivisionSchema = z.object({
  iso3166_2: z.string().optional(),
  kind: z.string().min(1), // STATE | PROVINCE | REGION | TERRITORY | EMIRATE | PREFECTURE
});

const authoritySchema = z.object({
  kind: z.string().min(1), // CUSTOMS | TAX | HEALTH | AGRICULTURE | STANDARDS | CENTRAL_BANK | …
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const pointOfEntrySchema = z.object({
  kind: z.string().min(1), // SEAPORT | AIRPORT | LAND_BORDER | DRY_PORT | RAIL | ICD
  unlocode: z.string().optional(),
  iata: z.string().optional(),
  icao: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacityNote: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

const tradeAgreementSchema = z.object({
  kind: z.string().min(1), // FTA | CUSTOMS_UNION | PREFERENTIAL | EPA | COMMON_MARKET
  memberCountryCodes: z.array(z.string()).optional(),
  inForceSince: z.string().optional(),
  status: z.string().optional(), // IN_FORCE | SIGNED | NEGOTIATING | SUSPENDED
  rulesOfOriginSummary: z.string().optional(),
  dutyPreferenceNote: z.string().optional(),
});

// ── Form metadata (drives the registry-driven Admin UI + public labels) ──────

const countryFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Country name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top', description: 'Alpha-2 ISO code (also the natural key).' },
  { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
  { name: 'alpha2', label: 'ISO alpha-2', type: 'string', placement: 'attributes', required: true },
  { name: 'alpha3', label: 'ISO alpha-3', type: 'string', placement: 'attributes', required: true },
  { name: 'numericCode', label: 'ISO numeric', type: 'string', placement: 'attributes' },
  { name: 'officialName', label: 'Official name', type: 'string', placement: 'attributes' },
  { name: 'capital', label: 'Capital', type: 'string', placement: 'attributes' },
  { name: 'region', label: 'Region', type: 'string', placement: 'attributes' },
  { name: 'subregion', label: 'Subregion', type: 'string', placement: 'attributes' },
  { name: 'currencyCodes', label: 'Currency codes', type: 'string[]', placement: 'attributes' },
  { name: 'languageCodes', label: 'Language codes', type: 'string[]', placement: 'attributes' },
  { name: 'timezoneCodes', label: 'Timezone codes', type: 'string[]', placement: 'attributes' },
  { name: 'dialingCode', label: 'Dialing code', type: 'string', placement: 'attributes' },
  { name: 'flagEmoji', label: 'Flag emoji', type: 'string', placement: 'attributes' },
];

const currencyFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Currency name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'alpha', label: 'ISO alpha-3', type: 'string', placement: 'attributes', required: true },
  { name: 'numericCode', label: 'ISO numeric', type: 'string', placement: 'attributes' },
  { name: 'minorUnits', label: 'Minor units', type: 'number', placement: 'attributes', description: 'Decimal places (e.g. 2 for USD, 0 for JPY).' },
  { name: 'symbol', label: 'Symbol', type: 'string', placement: 'attributes' },
];

const languageFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Language name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'iso639_1', label: 'ISO 639-1', type: 'string', placement: 'attributes' },
  { name: 'iso639_2', label: 'ISO 639-2', type: 'string', placement: 'attributes' },
  { name: 'nativeName', label: 'Native name', type: 'string', placement: 'attributes' },
  { name: 'direction', label: 'Script direction', type: 'enum', placement: 'attributes', options: ['LTR', 'RTL'] },
];

const timezoneFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Timezone label', type: 'string', placement: 'top', required: true },
  { name: 'tzName', label: 'IANA name', type: 'string', placement: 'attributes', required: true, description: 'e.g. Asia/Kolkata.' },
  { name: 'utcOffset', label: 'UTC offset', type: 'string', placement: 'attributes', required: true, description: 'e.g. +05:30.' },
  { name: 'dst', label: 'Observes DST', type: 'boolean', placement: 'attributes' },
];

const tradeRegionFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Region name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'kind', label: 'Kind', type: 'enum', placement: 'attributes', required: true, options: ['CONTINENT', 'ECONOMIC_BLOC', 'CUSTOMS_TERRITORY'] },
  { name: 'memberCountryCodes', label: 'Member countries', type: 'string[]', placement: 'attributes' },
  { name: 'description', label: 'Description', type: 'text', placement: 'attributes' },
];

const subdivisionFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Subdivision name', type: 'string', placement: 'top', required: true },
  { name: 'countryCode', label: 'Country', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'iso3166_2', label: 'ISO 3166-2', type: 'string', placement: 'attributes' },
  { name: 'kind', label: 'Kind', type: 'enum', placement: 'attributes', required: true, options: ['STATE', 'PROVINCE', 'REGION', 'TERRITORY', 'COUNTY', 'DISTRICT', 'EMIRATE', 'PREFECTURE'] },
];

const authorityFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Authority name', type: 'string', placement: 'top', required: true },
  { name: 'countryCode', label: 'Country', type: 'string', placement: 'top', description: 'Leave blank for a supranational body.' },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'kind', label: 'Kind', type: 'enum', placement: 'attributes', required: true, options: ['CUSTOMS', 'TAX', 'COMMERCE', 'HEALTH', 'AGRICULTURE', 'STANDARDS', 'CENTRAL_BANK', 'ENVIRONMENT', 'TRANSPORT', 'IMMIGRATION', 'MINING', 'TRADE_MINISTRY', 'OTHER'] },
  { name: 'website', label: 'Website', type: 'string', placement: 'attributes' },
  { name: 'email', label: 'Email', type: 'string', placement: 'attributes' },
  { name: 'phone', label: 'Phone', type: 'string', placement: 'attributes' },
  { name: 'address', label: 'Address', type: 'text', placement: 'attributes' },
  { name: 'jurisdiction', label: 'Jurisdiction', type: 'string', placement: 'attributes' },
];

const pointOfEntryFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Port / checkpoint name', type: 'string', placement: 'top', required: true },
  { name: 'countryCode', label: 'Country', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'kind', label: 'Kind', type: 'enum', placement: 'attributes', required: true, options: ['SEAPORT', 'AIRPORT', 'LAND_BORDER', 'DRY_PORT', 'RAIL', 'ICD'] },
  { name: 'unlocode', label: 'UN/LOCODE', type: 'string', placement: 'attributes' },
  { name: 'iata', label: 'IATA', type: 'string', placement: 'attributes' },
  { name: 'icao', label: 'ICAO', type: 'string', placement: 'attributes' },
  { name: 'latitude', label: 'Latitude', type: 'number', placement: 'attributes' },
  { name: 'longitude', label: 'Longitude', type: 'number', placement: 'attributes' },
  { name: 'capacityNote', label: 'Capacity', type: 'text', placement: 'attributes' },
  { name: 'contactPhone', label: 'Contact phone', type: 'string', placement: 'attributes' },
  { name: 'contactEmail', label: 'Contact email', type: 'string', placement: 'attributes' },
];

const tradeAgreementFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Agreement name', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'kind', label: 'Kind', type: 'enum', placement: 'attributes', required: true, options: ['FTA', 'CUSTOMS_UNION', 'PREFERENTIAL', 'EPA', 'COMMON_MARKET'] },
  { name: 'memberCountryCodes', label: 'Member countries', type: 'string[]', placement: 'attributes' },
  { name: 'inForceSince', label: 'In force since', type: 'date', placement: 'attributes' },
  { name: 'status', label: 'Status', type: 'enum', placement: 'attributes', options: ['IN_FORCE', 'SIGNED', 'NEGOTIATING', 'SUSPENDED'] },
  { name: 'rulesOfOriginSummary', label: 'Rules of origin', type: 'text', placement: 'attributes' },
  { name: 'dutyPreferenceNote', label: 'Duty preference', type: 'text', placement: 'attributes' },
];

// ── The country-reference domain registry ────────────────────────────────────

export const countryReferenceEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'country',
    label: 'Country',
    description: 'A sovereign country / customs territory — the root of the knowledge base.',
    domain: 'country',
    countryScoped: false,
    schema: countrySchema,
    recordKey: (i) => String((i.attributes?.alpha2 as string) ?? i.code ?? slug(i.name)).toUpperCase(),
    events: { created: 'COUNTRY_CREATED', updated: 'COUNTRY_UPDATED', archived: 'COUNTRY_ARCHIVED' },
    formFields: countryFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.USES_CURRENCY, label: 'Uses currency', toType: 'currency' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.USES_LANGUAGE, label: 'Uses language', toType: 'language' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.OBSERVES_TIMEZONE, label: 'Observes timezone', toType: 'timezone' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.MEMBER_OF_REGION, label: 'Member of region', toType: 'trade_region' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.PARTY_TO_AGREEMENT, label: 'Party to agreement', toType: 'trade_agreement' },
    ],
  }),
  simpleEntity({
    entityType: 'currency',
    label: 'Currency',
    description: 'An ISO-4217 currency.',
    domain: 'country',
    countryScoped: false,
    schema: currencySchema,
    recordKey: (i) => String((i.attributes?.alpha as string) ?? i.code ?? slug(i.name)).toUpperCase(),
    formFields: currencyFormFields,
  }),
  simpleEntity({
    entityType: 'language',
    label: 'Language',
    description: 'An ISO-639 language.',
    domain: 'country',
    countryScoped: false,
    schema: languageSchema,
    recordKey: (i) => String((i.attributes?.iso639_1 as string) ?? i.code ?? slug(i.name)).toLowerCase(),
    formFields: languageFormFields,
  }),
  simpleEntity({
    entityType: 'timezone',
    label: 'Timezone',
    description: 'An IANA timezone with its UTC offset.',
    domain: 'country',
    countryScoped: false,
    schema: timezoneSchema,
    recordKey: (i) => String((i.attributes?.tzName as string) ?? i.code ?? slug(i.name)),
    formFields: timezoneFormFields,
  }),
  simpleEntity({
    entityType: 'trade_region',
    label: 'Trade Region',
    description: 'A continent, economic bloc or customs territory grouping countries.',
    domain: 'country',
    countryScoped: false,
    schema: tradeRegionSchema,
    recordKey: (i) => String(i.code ?? slug(i.name)).toUpperCase(),
    formFields: tradeRegionFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.REGION_INCLUDES, label: 'Includes country', toType: 'country' },
    ],
  }),
  simpleEntity({
    entityType: 'subdivision',
    label: 'State / Province',
    description: 'A first-level administrative subdivision of a country.',
    domain: 'country',
    countryScoped: true,
    schema: subdivisionSchema,
    recordKey: (i) => `${String(i.countryCode).toUpperCase()}-${String(i.code ?? slug(i.name)).toUpperCase()}`,
    formFields: subdivisionFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.SUBDIVISION_OF, label: 'Subdivision of', toType: 'country' },
    ],
  }),
  simpleEntity({
    entityType: 'authority',
    label: 'Government / Customs Authority',
    description: 'A government body — customs, tax, health, standards, central bank, trade ministry, etc.',
    domain: 'authority',
    countryScoped: false,
    schema: authoritySchema,
    recordKey: (i) => `${i.countryCode ? `${String(i.countryCode).toUpperCase()}:` : ''}authority:${String(i.code ?? slug(i.name))}`,
    events: { created: 'AUTHORITY_CREATED', updated: 'AUTHORITY_UPDATED', archived: 'AUTHORITY_ARCHIVED' },
    formFields: authorityFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.AUTHORITY_OF, label: 'Governs country', toType: 'country' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.PARENT_AUTHORITY, label: 'Reports to', toType: 'authority' },
    ],
  }),
  simpleEntity({
    entityType: 'point_of_entry',
    label: 'Port / Airport / Border Checkpoint',
    description: 'A seaport, airport, dry port, ICD, rail or land border crossing.',
    domain: 'port',
    countryScoped: true,
    schema: pointOfEntrySchema,
    recordKey: (i) => `${String(i.countryCode).toUpperCase()}:poe:${String(i.code ?? slug(i.name))}`,
    formFields: pointOfEntryFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.LOCATED_IN, label: 'Located in', toType: 'subdivision' },
      { relationType: COUNTRY_RELATIONSHIP_TYPES.OVERSEEN_BY, label: 'Overseen by', toType: 'authority' },
    ],
  }),
  simpleEntity({
    entityType: 'trade_agreement',
    label: 'Trade Agreement / FTA',
    description: 'A free-trade agreement, customs union, EPA or preferential arrangement.',
    domain: 'fta',
    countryScoped: false,
    schema: tradeAgreementSchema,
    recordKey: (i) => String(i.code ?? slug(i.name)).toUpperCase(),
    events: { created: 'FTA_CREATED', updated: 'FTA_UPDATED', archived: 'FTA_ARCHIVED' },
    formFields: tradeAgreementFormFields,
    relationshipTypes: [
      { relationType: COUNTRY_RELATIONSHIP_TYPES.HAS_MEMBER, label: 'Has member', toType: 'country' },
    ],
  }),
];
