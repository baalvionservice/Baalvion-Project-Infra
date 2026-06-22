/**
 * @file server/gckb/__tests__/admin-form-model.test.ts
 * @description Pure (no-I/O) tests for the registry-driven Admin form engine:
 * schema construction per entity / policy type, type coercion, and the
 * form-values → KbWriteInput round-trip. The decisive assertion is that the
 * produced write input validates against the very registry definition that drove
 * the form — so the Admin UI can never build an input the engine would reject.
 */
import { describe, it, expect } from 'vitest';
import { buildFormSchema, formValuesToWriteInput, coerceValue, WORKFLOW_ACTIONS } from '../admin-form-model';
import { getEntityDefinition } from '../registry';
import type { FormFieldDescriptor } from '../entity-kit';

describe('buildFormSchema', () => {
  it('splits top vs attribute fields for a simple entity', () => {
    const schema = buildFormSchema('country')!;
    expect(schema.usesPolicyType).toBe(false);
    expect(schema.topFields.find((f) => f.name === 'name')?.required).toBe(true);
    expect(schema.attributeFields.map((f) => f.name)).toEqual(expect.arrayContaining(['alpha2', 'alpha3']));
  });

  it('pulls attribute fields from the chosen policy type for country_policy', () => {
    const schema = buildFormSchema('country_policy', 'tax')!;
    expect(schema.usesPolicyType).toBe(true);
    expect(schema.policyType).toBe('tax');
    expect(schema.attributeFields.map((f) => f.name)).toEqual(expect.arrayContaining(['taxName', 'taxType', 'ratePercent']));
    expect(schema.topFields.find((f) => f.name === 'policyType')?.type).toBe('enum');
  });

  it('leaves the attribute section empty until a policy type is selected', () => {
    expect(buildFormSchema('country_policy')!.attributeFields).toHaveLength(0);
  });

  it('returns null for an unknown entity', () => {
    expect(buildFormSchema('not_a_real_entity')).toBeNull();
  });
});

describe('coerceValue', () => {
  const f = (type: FormFieldDescriptor['type']): FormFieldDescriptor => ({ name: 'x', label: 'X', type, placement: 'attributes' });
  it('coerces by declared type', () => {
    expect(coerceValue(f('number'), '18')).toBe(18);
    expect(coerceValue(f('number'), 'nope')).toBeUndefined();
    expect(coerceValue(f('boolean'), 'true')).toBe(true);
    expect(coerceValue(f('boolean'), 'false')).toBe(false);
    expect(coerceValue(f('string[]'), 'a, b ,c')).toEqual(['a', 'b', 'c']);
    expect(coerceValue(f('string[]'), ['x', 'y'])).toEqual(['x', 'y']);
    expect(coerceValue(f('json'), '{"a":1}')).toEqual({ a: 1 });
    expect(coerceValue(f('string'), 'hi')).toBe('hi');
    expect(coerceValue(f('string'), '')).toBeUndefined();
  });
});

describe('formValuesToWriteInput → registry validation', () => {
  it('round-trips a country and validates', () => {
    const schema = buildFormSchema('country')!;
    const write = formValuesToWriteInput(schema, {
      name: 'India', code: 'IN', alpha2: 'IN', alpha3: 'IND', officialName: 'Republic of India', currencyCodes: 'INR, USD',
    });
    expect(write.name).toBe('India');
    expect(write.code).toBe('IN');
    expect(write.attributes.alpha2).toBe('IN');
    expect(write.attributes.currencyCodes).toEqual(['INR', 'USD']);
    expect(getEntityDefinition('country')!.validate(write).ok).toBe(true);
  });

  it('round-trips a tax policy (attributes from the policy type) and validates', () => {
    const schema = buildFormSchema('country_policy', 'tax')!;
    const write = formValuesToWriteInput(schema, {
      name: 'IGST', countryCode: 'IN', policyType: 'tax', taxName: 'IGST', taxType: 'GST', ratePercent: '18', exemptions: 'drugs, food',
    });
    expect(write.policyType).toBe('tax');
    expect(write.countryCode).toBe('IN');
    expect(write.attributes).toMatchObject({ taxName: 'IGST', taxType: 'GST', ratePercent: 18, exemptions: ['drugs', 'food'] });
    expect(getEntityDefinition('country_policy')!.validate(write).ok).toBe(true);
  });

  it('surfaces registry validation failures for incomplete input', () => {
    const schema = buildFormSchema('country_policy', 'tax')!;
    const write = formValuesToWriteInput(schema, { name: 'Bad', countryCode: 'IN', policyType: 'tax', taxName: 'X' }); // missing taxType + ratePercent
    const result = getEntityDefinition('country_policy')!.validate(write);
    expect(result.ok).toBe(false);
  });

  it('exposes the workflow transitions', () => {
    expect(WORKFLOW_ACTIONS).toEqual(['DRAFT', 'REVIEW', 'PUBLISH', 'ARCHIVE']);
  });
});
