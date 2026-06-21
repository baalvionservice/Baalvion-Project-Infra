/**
 * @file server/gckb/registry.ts
 * @description The GCKB entity registry — the single configuration surface that
 * composes every knowledge-base entity. The country-reference domain (country,
 * currency, language, timezone, trade_region, subdivision, authority,
 * point_of_entry, trade_agreement) lives in `./registries/country-reference`; the
 * product registry in `./registries/product`. The `country_policy` entity — the
 * long tail of import/export policy, tax, tariff, duty, certificate, license,
 * restricted/prohibited goods, inspection/packaging/labeling rules, document &
 * form requirements, digital-API metadata, signatures, compliance, risk and
 * sanctions — is defined here because its `attributes` shape is selected at
 * runtime by `policyType` from POLICY_TYPES.
 *
 * The generic repository/service/API operate purely off this registry, so adding
 * an entity type (or a policy type) is a config entry — never new tables,
 * services or routes. Each definition also carries declarative `formFields` and
 * `relationshipTypes` that drive the registry-driven Admin UI and the public
 * explorers. The reusable building blocks live in `./entity-kit` (cycle-free).
 */
import { KbWriteInput } from './types';
import { POLICY_TYPES, getPolicyType, POLICY_TYPE_KEYS } from './policy-types';
import {
  KbEntityDefinition,
  FormFieldDescriptor,
  RelationshipTypeDescriptor,
  slug,
  zodErrors,
} from './entity-kit';
import { countryReferenceEntities } from './registries/country-reference';
import { productEntities } from './registries/product';
import { hsCodeEntities } from './registries/hs-code';
import { certificateEntities } from './registries/certificate';
import { organizationEntities } from './registries/organization';
import { documentEntities } from './registries/document';
import { workflowEntities } from './registries/workflow';

export type { KbEntityDefinition } from './entity-kit';

/**
 * Typed relationship edges emitted by country-policy records. A policy can be
 * administered by an authority, enforced at a point of entry, granted under a
 * trade agreement, scoped to an HS code or product category, supported by a
 * document, or enforced by a Rule-Engine rule (cross-module typed edge).
 */
export const POLICY_RELATIONSHIP_TYPES = {
  ADMINISTERED_BY: 'ADMINISTERED_BY', // → authority
  ENFORCED_AT: 'ENFORCED_AT', // → point_of_entry
  UNDER_AGREEMENT: 'UNDER_AGREEMENT', // → trade_agreement
  APPLIES_TO_HS: 'APPLIES_TO_HS', // → hs_code (external ref)
  APPLIES_TO_CATEGORY: 'APPLIES_TO_CATEGORY', // → product_category
  SUPPORTED_BY_DOCUMENT: 'SUPPORTED_BY_DOCUMENT', // → document (external ref)
  ENFORCED_BY_RULE: 'ENFORCED_BY_RULE', // → rule (Rule Engine, external ref)
} as const;

export type PolicyRelationshipType =
  (typeof POLICY_RELATIONSHIP_TYPES)[keyof typeof POLICY_RELATIONSHIP_TYPES];

const policyRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: POLICY_RELATIONSHIP_TYPES.ADMINISTERED_BY, label: 'Administered by', toType: 'authority' },
  { relationType: POLICY_RELATIONSHIP_TYPES.ENFORCED_AT, label: 'Enforced at', toType: 'point_of_entry' },
  { relationType: POLICY_RELATIONSHIP_TYPES.UNDER_AGREEMENT, label: 'Under agreement', toType: 'trade_agreement' },
  { relationType: POLICY_RELATIONSHIP_TYPES.APPLIES_TO_HS, label: 'Applies to HS code', toType: 'hs_code' },
  { relationType: POLICY_RELATIONSHIP_TYPES.APPLIES_TO_CATEGORY, label: 'Applies to category', toType: 'product_category' },
  { relationType: POLICY_RELATIONSHIP_TYPES.SUPPORTED_BY_DOCUMENT, label: 'Supported by document', toType: 'document' },
  { relationType: POLICY_RELATIONSHIP_TYPES.ENFORCED_BY_RULE, label: 'Enforced by rule', toType: 'rule' },
];

/**
 * Top-level form fields for a country policy. The `attributes` fields are
 * policy-type-specific and surfaced separately (per policyType) via
 * `policy-forms.ts` / `GET /api/gckb/entities`, because they are chosen at
 * runtime once a policyType is selected.
 */
const policyTopFormFields: FormFieldDescriptor[] = [
  { name: 'name', label: 'Policy name', type: 'string', placement: 'top', required: true },
  { name: 'countryCode', label: 'Country', type: 'string', placement: 'top', required: true },
  { name: 'policyType', label: 'Policy type', type: 'enum', placement: 'top', required: true, options: POLICY_TYPE_KEYS, description: 'Selects the attribute schema for this policy.' },
  { name: 'code', label: 'Code', type: 'string', placement: 'top' },
  { name: 'hsCode', label: 'HS code', type: 'string', placement: 'top', description: 'Promoted, indexed facet.' },
  { name: 'productCategory', label: 'Product category', type: 'string', placement: 'top', description: 'Promoted, indexed facet.' },
  { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
];

/**
 * The generic country-policy entity. The shape of `attributes` is selected by
 * `policyType` from POLICY_TYPES — one entity type covers the entire policy long
 * tail without a bespoke table or route per policy.
 */
const countryPolicyEntity: KbEntityDefinition = {
  entityType: 'country_policy',
  label: 'Country Policy',
  description: 'The configurable policy long tail (tax, tariff, duty, license, certificate, restriction, document, form, integration, compliance, risk, sanctions) — the attribute schema is selected by policyType.',
  domain: 'policy',
  countryScoped: true,
  usesPolicyType: true,
  deriveRecordKey: (input) =>
    input.recordKey?.trim() ||
    `${String(input.countryCode).toUpperCase()}:${input.policyType}:${String(input.code ?? slug(input.name))}`,
  validate: (input) => {
    const def = getPolicyType(input.policyType);
    if (!def) {
      return { ok: false, errors: [`policyType: "${input.policyType ?? ''}" is not a known policy type (one of: ${POLICY_TYPE_KEYS.join(', ')})`] };
    }
    const r = def.schema.safeParse(input.attributes ?? {});
    return r.success ? { ok: true } : { ok: false, errors: zodErrors(r) };
  },
  events: { created: 'POLICY_CREATED', updated: 'POLICY_UPDATED', archived: 'POLICY_ARCHIVED' },
  extraCreatedEvents: (input) => {
    const def = getPolicyType(input.policyType);
    return def?.createdEvent ? [def.createdEvent] : [];
  },
  formFields: policyTopFormFields,
  relationshipTypes: policyRelationshipTypes,
};

// ── The registry ─────────────────────────────────────────────────────────────

const definitions: KbEntityDefinition[] = [
  ...countryReferenceEntities, // country, currency, language, timezone, trade_region, subdivision, authority, point_of_entry, trade_agreement
  countryPolicyEntity, // the policy long tail (policyType-discriminated)
  ...productEntities, // Module 1 — Universal Product Registry
  ...hsCodeEntities, // Module 2 — Global HS Registry
  ...certificateEntities, // Module 3 — Global Certificate Registry
  ...organizationEntities, // Module 4 — Universal Organization Registry
  ...documentEntities, // Module 5 — Universal Document Engine (templates)
  ...workflowEntities, // Module 6 — Data-Driven Workflow Engine (templates)
];

const REGISTRY = new Map<string, KbEntityDefinition>(definitions.map((d) => [d.entityType, d]));

export function getEntityDefinition(entityType: string): KbEntityDefinition | null {
  return REGISTRY.get(entityType) ?? null;
}

export function listEntityTypes(): string[] {
  return [...REGISTRY.keys()];
}

export function isKnownEntity(entityType: string): boolean {
  return REGISTRY.has(entityType);
}

export { POLICY_TYPES, POLICY_TYPE_KEYS };
