/**
 * @file server/gckb/registries/organization.ts
 * @description MODULE 4 — Universal Organization Registry, expressed as GCKB
 * registry configuration. It models organizations as master/reference data (a
 * counterparty's corporate structure, a supplier's facilities) — distinct from
 * the tenant `Organization` table, which records *who owns* data. Five entities:
 *
 *   organization  — a legal entity (parent / subsidiary / branch-of-group)
 *   org_unit      — a sub-unit discriminated by unitType (BRANCH | FACTORY |
 *                   WAREHOUSE | DEPARTMENT | TEAM | OFFICE) — one entity, not five
 *   org_address   — a postal/geographic address
 *   bank_account  — bank-account reference metadata (no payment integration)
 *   org_license   — a licence held by an organization
 *
 * Users and certificates are NOT re-modelled here — an organization links to
 * identity `user`s and Module-3 `certificate`s via typed edges. Everything rides
 * the GCKB engine (versioning, history, search, import/export, audit, events,
 * RLS) with **no new table, migration, service or route**. Nothing is seeded.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/** Typed relationship edges for the organization domain (no magic strings). */
export const ORG_RELATIONSHIP_TYPES = {
  SUBSIDIARY_OF: 'SUBSIDIARY_OF', // organization → organization (parent company)
  HAS_UNIT: 'HAS_UNIT', // organization → org_unit
  SUB_UNIT_OF: 'SUB_UNIT_OF', // org_unit → org_unit (or organization)
  LOCATED_AT: 'LOCATED_AT', // organization / org_unit → org_address
  HAS_BANK_ACCOUNT: 'HAS_BANK_ACCOUNT', // organization → bank_account
  HOLDS_LICENSE: 'HOLDS_LICENSE', // organization → org_license
  HOLDS_CERTIFICATE: 'HOLDS_CERTIFICATE', // organization → certificate (Module 3)
  HAS_MEMBER: 'HAS_MEMBER', // organization / org_unit → user (identity, external ref)
  REGISTERED_IN: 'REGISTERED_IN', // organization → country
  SUPPLIES: 'SUPPLIES', // organization → organization (supplier → buyer)
} as const;

export type OrgRelationshipType =
  (typeof ORG_RELATIONSHIP_TYPES)[keyof typeof ORG_RELATIONSHIP_TYPES];

/** Configurable unit kinds — data, not hardcoded entity types. */
export const ORG_UNIT_TYPES = ['BRANCH', 'FACTORY', 'WAREHOUSE', 'DEPARTMENT', 'TEAM', 'OFFICE'] as const;

const organizationSchema = z.object({
  legalName: z.string().optional(),
  orgType: z.string().optional(), // PARENT | SUBSIDIARY | BRANCH | JOINT_VENTURE | SOLE_PROPRIETOR | …
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  leiCode: z.string().optional(), // Legal Entity Identifier
  dunsNumber: z.string().optional(),
  gln: z.string().optional(),
  countryCode: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  parentOrganizationKey: z.string().optional(),
  incorporationDate: z.string().optional(),
  employeeCount: z.number().int().nonnegative().optional(),
});

const orgUnitSchema = z.object({
  unitType: z.string().refine((v) => (ORG_UNIT_TYPES as readonly string[]).includes(v), {
    message: `must be one of ${ORG_UNIT_TYPES.join(', ')}`,
  }),
  organizationKey: z.string().optional(), // owning organization
  parentUnitKey: z.string().optional(),
  countryCode: z.string().optional(),
  addressKey: z.string().optional(),
  function: z.string().optional(),
  capacity: z.string().optional(),
  manager: z.string().optional(),
});

const orgAddressSchema = z.object({
  addressType: z.string().optional(), // HQ | REGISTERED | BILLING | SHIPPING | FACTORY | WAREHOUSE
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const bankAccountSchema = z.object({
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountNumber: z.string().optional(),
  swiftBic: z.string().optional(),
  countryCode: z.string().optional(),
  currency: z.string().length(3).optional(),
  purpose: z.string().optional(), // SETTLEMENT | PAYROLL | ESCROW | …
});

const orgLicenseSchema = z.object({
  licenseType: z.string().min(1), // IMPORT | EXPORT | CUSTOMS_BROKER | MANUFACTURING | …
  number: z.string().optional(),
  issuingAuthority: z.string().optional(),
  countryCode: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  scope: z.string().optional(),
});

function upperCodeKey(i: KbWriteInput): string {
  return String(i.code ?? slug(i.name)).toUpperCase();
}

function organizationKey(i: KbWriteInput): string {
  const a = i.attributes ?? {};
  const id = a.leiCode ?? a.registrationNumber ?? a.dunsNumber ?? i.code;
  return id ? String(id).trim().toUpperCase() : slug(i.name).toUpperCase();
}

function bankAccountKey(i: KbWriteInput): string {
  const a = i.attributes ?? {};
  const id = a.iban ?? a.accountNumber ?? i.code;
  return id ? String(id).trim().toUpperCase() : slug(i.name).toUpperCase();
}

function licenseKey(i: KbWriteInput): string {
  const a = i.attributes ?? {};
  const id = a.number ?? i.code;
  return id ? String(id).trim().toUpperCase() : slug(i.name).toUpperCase();
}

const organizationRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: ORG_RELATIONSHIP_TYPES.SUBSIDIARY_OF, label: 'Subsidiary of', toType: 'organization' },
  { relationType: ORG_RELATIONSHIP_TYPES.HAS_UNIT, label: 'Has unit', toType: 'org_unit' },
  { relationType: ORG_RELATIONSHIP_TYPES.LOCATED_AT, label: 'Located at', toType: 'org_address' },
  { relationType: ORG_RELATIONSHIP_TYPES.HAS_BANK_ACCOUNT, label: 'Has bank account', toType: 'bank_account' },
  { relationType: ORG_RELATIONSHIP_TYPES.HOLDS_LICENSE, label: 'Holds licence', toType: 'org_license' },
  { relationType: ORG_RELATIONSHIP_TYPES.HOLDS_CERTIFICATE, label: 'Holds certificate', toType: 'certificate' },
  { relationType: ORG_RELATIONSHIP_TYPES.HAS_MEMBER, label: 'Has member', toType: 'user' },
  { relationType: ORG_RELATIONSHIP_TYPES.REGISTERED_IN, label: 'Registered in', toType: 'country' },
  { relationType: ORG_RELATIONSHIP_TYPES.SUPPLIES, label: 'Supplies', toType: 'organization' },
];

export const organizationEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'organization',
    label: 'Organization',
    description: 'A legal entity in the trade graph (parent company / subsidiary / counterparty), with corporate hierarchy, units, addresses, bank accounts, licences and certificates linked by typed edges.',
    domain: 'organization',
    countryScoped: false,
    schema: organizationSchema,
    recordKey: organizationKey,
    events: { created: 'ORGANIZATION_CREATED', updated: 'ORGANIZATION_UPDATED', archived: 'ORGANIZATION_ARCHIVED' },
    relationshipTypes: organizationRelationshipTypes,
    formFields: [
      { name: 'name', label: 'Organization name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
      { name: 'legalName', label: 'Legal name', type: 'string', placement: 'attributes' },
      { name: 'orgType', label: 'Type', type: 'string', placement: 'attributes' },
      { name: 'registrationNumber', label: 'Registration number', type: 'string', placement: 'attributes' },
      { name: 'leiCode', label: 'LEI', type: 'string', placement: 'attributes' },
      { name: 'countryCode', label: 'Country', type: 'string', placement: 'attributes' },
      { name: 'industry', label: 'Industry', type: 'string', placement: 'attributes' },
      { name: 'parentOrganizationKey', label: 'Parent organization', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'org_unit',
    label: 'Organization Unit',
    description: 'A sub-unit of an organization: branch, factory, warehouse, department, team or office (discriminated by unitType).',
    domain: 'organization',
    countryScoped: false,
    schema: orgUnitSchema,
    recordKey: upperCodeKey,
    events: { created: 'ORG_UNIT_CREATED', updated: 'ORG_UNIT_UPDATED', archived: 'ORG_UNIT_ARCHIVED' },
    relationshipTypes: [
      { relationType: ORG_RELATIONSHIP_TYPES.SUB_UNIT_OF, label: 'Sub-unit of', toType: 'org_unit' },
      { relationType: ORG_RELATIONSHIP_TYPES.LOCATED_AT, label: 'Located at', toType: 'org_address' },
      { relationType: ORG_RELATIONSHIP_TYPES.HAS_MEMBER, label: 'Has member', toType: 'user' },
    ],
    formFields: [
      { name: 'name', label: 'Unit name', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'unitType', label: 'Unit type', type: 'enum', placement: 'attributes', required: true, options: [...ORG_UNIT_TYPES] },
      { name: 'organizationKey', label: 'Organization', type: 'string', placement: 'attributes' },
      { name: 'parentUnitKey', label: 'Parent unit', type: 'string', placement: 'attributes' },
      { name: 'countryCode', label: 'Country', type: 'string', placement: 'attributes' },
      { name: 'function', label: 'Function', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'org_address',
    label: 'Address',
    description: 'A postal / geographic address belonging to an organization or unit.',
    domain: 'organization',
    countryScoped: false,
    schema: orgAddressSchema,
    recordKey: upperCodeKey,
    events: { created: 'ORG_ADDRESS_CREATED', updated: 'ORG_ADDRESS_UPDATED', archived: 'ORG_ADDRESS_ARCHIVED' },
    formFields: [
      { name: 'name', label: 'Label', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'addressType', label: 'Type', type: 'string', placement: 'attributes' },
      { name: 'line1', label: 'Line 1', type: 'string', placement: 'attributes' },
      { name: 'city', label: 'City', type: 'string', placement: 'attributes' },
      { name: 'postalCode', label: 'Postal code', type: 'string', placement: 'attributes' },
      { name: 'countryCode', label: 'Country', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'bank_account',
    label: 'Bank Account',
    description: 'Bank-account reference metadata for an organization (no payment integration in Phase 1).',
    domain: 'organization',
    countryScoped: false,
    schema: bankAccountSchema,
    recordKey: bankAccountKey,
    events: { created: 'BANK_ACCOUNT_CREATED', updated: 'BANK_ACCOUNT_UPDATED', archived: 'BANK_ACCOUNT_ARCHIVED' },
    formFields: [
      { name: 'name', label: 'Label', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'accountName', label: 'Account name', type: 'string', placement: 'attributes' },
      { name: 'bankName', label: 'Bank', type: 'string', placement: 'attributes' },
      { name: 'iban', label: 'IBAN', type: 'string', placement: 'attributes' },
      { name: 'swiftBic', label: 'SWIFT/BIC', type: 'string', placement: 'attributes' },
      { name: 'currency', label: 'Currency', type: 'string', placement: 'attributes' },
    ],
  }),
  simpleEntity({
    entityType: 'org_license',
    label: 'Organization Licence',
    description: 'A licence held by an organization (import/export/customs-broker/manufacturing/…).',
    domain: 'organization',
    countryScoped: false,
    schema: orgLicenseSchema,
    recordKey: licenseKey,
    events: { created: 'ORG_LICENSE_CREATED', updated: 'ORG_LICENSE_UPDATED', archived: 'ORG_LICENSE_ARCHIVED' },
    formFields: [
      { name: 'name', label: 'Label', type: 'string', placement: 'top', required: true },
      { name: 'code', label: 'Code', type: 'string', placement: 'top' },
      { name: 'licenseType', label: 'Licence type', type: 'string', placement: 'attributes', required: true },
      { name: 'number', label: 'Number', type: 'string', placement: 'attributes' },
      { name: 'issuingAuthority', label: 'Issuing authority', type: 'string', placement: 'attributes' },
      { name: 'validFrom', label: 'Valid from', type: 'date', placement: 'attributes' },
      { name: 'validTo', label: 'Valid to', type: 'date', placement: 'attributes' },
    ],
  }),
];
