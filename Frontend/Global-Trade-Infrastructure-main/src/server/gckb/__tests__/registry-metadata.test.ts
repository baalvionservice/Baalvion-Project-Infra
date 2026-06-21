/**
 * @file server/gckb/__tests__/registry-metadata.test.ts
 * @description Pure (no-I/O) tests for the self-describing GCKB registry: every
 * entity and every policy type must expose valid declarative form metadata so the
 * registry-driven Admin UI and the public explorers can render without hardcoding
 * any entity's shape. Also locks the country-scoped contract, the policy-form
 * coverage (1:1 with policy types) and the cross-module relationship edges.
 */
import { describe, it, expect } from 'vitest';
import {
  getEntityDefinition,
  listEntityTypes,
  POLICY_RELATIONSHIP_TYPES,
} from '../registry';
import { POLICY_TYPE_KEYS, getPolicyType } from '../policy-types';
import { POLICY_FORMS, POLICY_FORM_KEYS, getPolicyForm, getPolicyGroup, POLICY_GROUPS } from '../policy-forms';
import type { FormFieldDescriptor } from '../entity-kit';
import type { KbWriteInput } from '../types';

const FIELD_TYPES: ReadonlyArray<FormFieldDescriptor['type']> = ['string', 'text', 'number', 'boolean', 'date', 'string[]', 'enum', 'json'];
const PLACEMENTS: ReadonlyArray<FormFieldDescriptor['placement']> = ['top', 'attributes'];

/**
 * The country/regulatory entities this slice owns. Strict per-entity invariants
 * are asserted over this explicit set (not the whole dynamic registry) so the
 * test stays independent of other domain registries (product, hs_code, …) that
 * are composed in concurrently.
 */
const OWNED_ENTITIES = [
  'country', 'currency', 'language', 'timezone', 'trade_region', 'subdivision',
  'authority', 'point_of_entry', 'trade_agreement', 'country_policy',
] as const;

function assertValidField(field: FormFieldDescriptor): void {
  expect(field.name, 'field name').toBeTruthy();
  expect(field.label, `label for ${field.name}`).toBeTruthy();
  expect(FIELD_TYPES, `type for ${field.name}`).toContain(field.type);
  expect(PLACEMENTS, `placement for ${field.name}`).toContain(field.placement);
  if (field.type === 'enum') {
    expect(field.options && field.options.length > 0, `enum ${field.name} needs options`).toBe(true);
  }
}

describe('GCKB entity registry — declarative metadata', () => {
  const entityTypes = listEntityTypes();

  it('registers the full country/regulatory + product entity set', () => {
    for (const expected of [
      'country', 'currency', 'language', 'timezone', 'trade_region', 'subdivision',
      'authority', 'point_of_entry', 'trade_agreement', 'country_policy',
      'product', 'product_category', 'brand', 'manufacturer',
    ]) {
      expect(entityTypes, `missing entity: ${expected}`).toContain(expected);
    }
  });

  it.each(OWNED_ENTITIES)('entity "%s" exposes valid form metadata with a required top-level name', (entityType) => {
    const def = getEntityDefinition(entityType)!;
    expect(def).toBeTruthy();
    expect(def.label).toBeTruthy();
    expect(Array.isArray(def.formFields) && def.formFields!.length > 0, 'has formFields').toBe(true);
    for (const field of def.formFields!) assertValidField(field);
    const nameField = def.formFields!.find((f) => f.name === 'name');
    expect(nameField, `${entityType} must collect a name`).toBeTruthy();
    expect(nameField!.placement).toBe('top');
    expect(nameField!.required).toBe(true);
  });

  it('country-scoped entities require a country in their form', () => {
    for (const entityType of OWNED_ENTITIES) {
      const def = getEntityDefinition(entityType)!;
      if (!def.countryScoped) continue;
      const cc = def.formFields!.find((f) => f.name === 'countryCode');
      expect(cc, `${entityType} is countryScoped → needs a countryCode field`).toBeTruthy();
      expect(cc!.placement).toBe('top');
      expect(cc!.required).toBe(true);
    }
  });

  it('relationship descriptors are well formed', () => {
    for (const entityType of OWNED_ENTITIES) {
      const def = getEntityDefinition(entityType)!;
      for (const rel of def.relationshipTypes ?? []) {
        expect(rel.relationType).toBeTruthy();
        expect(rel.label).toBeTruthy();
        expect(rel.toType).toBeTruthy();
      }
    }
  });

  it('country_policy links into the Rule Engine via a typed edge', () => {
    const def = getEntityDefinition('country_policy')!;
    const edge = def.relationshipTypes!.find((r) => r.relationType === POLICY_RELATIONSHIP_TYPES.ENFORCED_BY_RULE);
    expect(edge).toBeTruthy();
    expect(edge!.toType).toBe('rule');
  });
});

describe('GCKB registry — natural key derivation', () => {
  const cases: Array<{ entityType: string; input: KbWriteInput; key: string }> = [
    { entityType: 'country', input: { name: 'India', attributes: { alpha2: 'IN', alpha3: 'IND' } }, key: 'IN' },
    { entityType: 'currency', input: { name: 'Indian Rupee', attributes: { alpha: 'INR' } }, key: 'INR' },
    { entityType: 'subdivision', input: { name: 'Maharashtra', countryCode: 'IN', code: 'MH', attributes: { kind: 'STATE' } }, key: 'IN-MH' },
    { entityType: 'point_of_entry', input: { name: 'Nhava Sheva', countryCode: 'IN', code: 'INNSA', attributes: { kind: 'SEAPORT' } }, key: 'IN:poe:INNSA' },
    { entityType: 'authority', input: { name: 'CBIC', code: 'cbic', countryCode: 'IN', attributes: { kind: 'CUSTOMS' } }, key: 'IN:authority:cbic' },
    { entityType: 'trade_agreement', input: { name: 'India–UAE CEPA', code: 'IND-UAE-CEPA', attributes: { kind: 'FTA' } }, key: 'IND-UAE-CEPA' },
    { entityType: 'country_policy', input: { name: 'IGST', countryCode: 'IN', policyType: 'tax', code: 'igst', attributes: {} }, key: 'IN:tax:igst' },
  ];

  it.each(cases)('derives "$key" for $entityType', ({ entityType, input, key }) => {
    expect(getEntityDefinition(entityType)!.deriveRecordKey(input)).toBe(key);
  });
});

describe('GCKB policy types — form coverage', () => {
  it('exposes exactly the known policy long tail', () => {
    // The 19 configured policy types (configuration over code).
    expect(POLICY_TYPE_KEYS.length).toBe(19);
  });

  it('every policy type has a 1:1 presentation form', () => {
    expect([...POLICY_FORM_KEYS].sort()).toEqual([...POLICY_TYPE_KEYS].sort());
  });

  it.each(POLICY_TYPE_KEYS)('policy type "%s" has a valid form + group + schema', (key) => {
    expect(getPolicyType(key), `${key} has a validation schema`).toBeTruthy();
    const form = getPolicyForm(key);
    expect(form, `${key} has a form definition`).toBeTruthy();
    expect(form!.formFields.length, `${key} has at least one field`).toBeGreaterThan(0);
    for (const field of form!.formFields) {
      assertValidField(field);
      expect(field.placement, `${key}.${field.name} is an attributes field`).toBe('attributes');
    }
    expect(getPolicyGroup(key)).toBeTruthy();
  });

  it('groups partition the policy types without loss', () => {
    const grouped = Object.values(POLICY_GROUPS).flat().sort();
    expect(grouped).toEqual([...POLICY_TYPE_KEYS].sort());
  });
});
