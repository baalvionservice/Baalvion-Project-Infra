/**
 * @file server/gckb/__tests__/import-engine.test.ts
 * @description Unit tests for the import engine: CSV/JSON parsing + coercion,
 * validation, in-file duplicate detection and the error report. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { parseCsv, parseImport, validateImport } from '../import-engine';

describe('parseCsv', () => {
  it('parses quoted fields, embedded commas/newlines and escaped quotes', () => {
    const csv = 'name,note\n"Acme, Inc.","line1\nline2"\n"He said ""hi""",ok';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Acme, Inc.');
    expect(rows[0].note).toBe('line1\nline2');
    expect(rows[1].name).toBe('He said "hi"');
  });
});

describe('parseImport — CSV scalar coercion into attributes', () => {
  it('coerces numbers, booleans and JSON in flat CSV columns', () => {
    const csv = 'name,countryCode,policyType,taxName,taxType,ratePercent,exemptions\nVAT,US,tax,VAT,VAT,20,"[""food""]"';
    const [input] = parseImport('csv', csv);
    expect(input.name).toBe('VAT');
    expect(input.countryCode).toBe('US');
    expect(input.policyType).toBe('tax');
    expect(input.attributes).toMatchObject({ taxName: 'VAT', taxType: 'VAT', ratePercent: 20, exemptions: ['food'] });
  });
});

describe('parseImport — JSON', () => {
  it('accepts an array and a { records: [...] } wrapper', () => {
    const arr = parseImport('json', JSON.stringify([{ name: 'A', attributes: { alpha2: 'AA', alpha3: 'AAA' } }]));
    expect(arr).toHaveLength(1);
    const wrapped = parseImport('json', JSON.stringify({ records: [{ name: 'B', attributes: {} }] }));
    expect(wrapped).toHaveLength(1);
  });

  it('rejects unsupported formats with a clear error', () => {
    expect(() => parseImport('xml', '<x/>')).toThrow(/not enabled/i);
    expect(() => parseImport('excel', 'x')).toThrow(/not enabled/i);
  });
});

describe('validateImport', () => {
  it('passes valid country rows and derives keys', () => {
    const inputs = parseImport('json', JSON.stringify([
      { name: 'United States', attributes: { alpha2: 'US', alpha3: 'USA' } },
      { name: 'Canada', attributes: { alpha2: 'CA', alpha3: 'CAN' } },
    ]));
    const { report, validInputs } = validateImport('country', inputs, 'json');
    expect(report.valid).toBe(2);
    expect(report.invalid).toBe(0);
    expect(validInputs).toHaveLength(2);
  });

  it('reports per-row errors for missing required fields and bad schema', () => {
    const inputs = parseImport('json', JSON.stringify([
      { name: '', attributes: {} }, // missing name + alpha fields
      { name: 'Tax no country', policyType: 'tax', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 5 } }, // no countryCode (handled by country_policy entity)
    ]));
    const { report } = validateImport('country', inputs, 'json');
    expect(report.invalid).toBeGreaterThanOrEqual(1);
    expect(report.errors[0].row).toBe(1);
  });

  it('detects in-file duplicates by derived record key', () => {
    const inputs = parseImport('json', JSON.stringify([
      { name: 'United States', attributes: { alpha2: 'US', alpha3: 'USA' } },
      { name: 'USA again', attributes: { alpha2: 'US', alpha3: 'USA' } },
    ]));
    const { report } = validateImport('country', inputs, 'json');
    expect(report.duplicatesInFile).toBe(1);
    expect(report.valid).toBe(1);
  });

  it('flags country_policy rows missing policyType/countryCode', () => {
    const inputs = parseImport('json', JSON.stringify([{ name: 'X', attributes: {} }]));
    const { report } = validateImport('country_policy', inputs, 'json');
    expect(report.invalid).toBe(1);
    expect(report.errors[0].errors.join(' ')).toMatch(/countryCode|policyType/);
  });
});
