/**
 * @file server/gckb/__tests__/public-read.integration.test.ts
 * @description Integration tests for the public, read-only GCKB projection against
 * real PostgreSQL. Locks the two safety invariants that make the public portal
 * safe to expose without a principal:
 *   1. Published only — drafts/archived never surface.
 *   2. Global baseline only — no tenant's private overrides ever surface.
 * Plus the country-profile aggregation (policy grouping, authorities, ports,
 * agreement membership).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { listCountries, getCountryProfile, getCountryDetail } from '../public-read';

const GLOBAL: KbActorContext = { organizationId: null, actorId: 'kb-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };

function tenantCtx(orgId: string): KbActorContext {
  return { organizationId: orgId, actorId: 'tenant-admin', actorRole: 'COUNTRY_ADMIN', source: 'test' };
}

async function publishCountry(ctx: KbActorContext, alpha2: string, name: string, attrs: Record<string, unknown> = {}) {
  return gckbService.create(ctx, 'country', {
    name,
    code: alpha2,
    status: 'PUBLISHED',
    attributes: { alpha2, alpha3: `${alpha2}X`, officialName: name, region: 'Testland', ...attrs },
  });
}

describe('gckb public-read (PostgreSQL)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await disconnect();
  });

  it('lists only PUBLISHED global countries', async () => {
    await publishCountry(GLOBAL, 'XX', 'Country XX');
    await gckbService.create(GLOBAL, 'country', { name: 'Country YY', code: 'YY', attributes: { alpha2: 'YY', alpha3: 'YYX' } }); // DRAFT

    const countries = await listCountries();
    const codes = countries.map((c) => c.code);
    expect(codes).toContain('XX');
    expect(codes).not.toContain('YY');
    expect(countries.find((c) => c.code === 'XX')!.name).toBe('Country XX');
  });

  it('never leaks a tenant override into the public baseline', async () => {
    const orgA = await seedOrganization('Org A');
    await publishCountry(GLOBAL, 'XX', 'Country XX (global)');
    await publishCountry(tenantCtx(orgA), 'XX', 'Country XX (tenant override)');

    const countries = await listCountries();
    const xx = countries.filter((c) => c.code === 'XX');
    expect(xx).toHaveLength(1);
    expect(xx[0].name).toBe('Country XX (global)');
  });

  it('returns null for an unknown or unpublished country', async () => {
    await gckbService.create(GLOBAL, 'country', { name: 'Draft ZZ', code: 'ZZ', attributes: { alpha2: 'ZZ', alpha3: 'ZZX' } }); // DRAFT
    expect(await getCountryProfile('ZZ')).toBeNull(); // exists but not published
    expect(await getCountryProfile('QQ')).toBeNull(); // does not exist
    expect(await getCountryDetail('ZZ')).toBeNull();
  });

  it('aggregates a published country profile, grouped, excluding drafts and tenant data', async () => {
    const orgA = await seedOrganization('Org A');
    await publishCountry(GLOBAL, 'XX', 'Country XX', { capital: 'Capital City', currencyCodes: ['XXD'], languageCodes: ['en'] });

    // Published policies across three groups.
    await gckbService.create(GLOBAL, 'country_policy', { name: 'GST', countryCode: 'XX', policyType: 'tax', status: 'PUBLISHED', hsCode: '1006', attributes: { taxName: 'GST', taxType: 'GST', ratePercent: 18 } });
    await gckbService.create(GLOBAL, 'country_policy', { name: 'MFN Tariff', countryCode: 'XX', policyType: 'tariff', status: 'PUBLISHED', attributes: { schedule: 'MFN', ratePercent: 10 } });
    await gckbService.create(GLOBAL, 'country_policy', { name: 'Import License', countryCode: 'XX', policyType: 'license', status: 'PUBLISHED', attributes: { licenseName: 'Import License', appliesTo: 'IMPORT' } });
    // A DRAFT policy — must be excluded.
    await gckbService.create(GLOBAL, 'country_policy', { name: 'Draft Duty', countryCode: 'XX', policyType: 'duty', attributes: { dutyType: 'CUSTOMS', ratePercent: 5 } });

    // Authority + port (published, global).
    await gckbService.create(GLOBAL, 'authority', { name: 'XX Customs', code: 'xxc', countryCode: 'XX', status: 'PUBLISHED', attributes: { kind: 'CUSTOMS', website: 'https://customs.xx' } });
    await gckbService.create(GLOBAL, 'point_of_entry', { name: 'Port of XX', code: 'XXPOX', countryCode: 'XX', status: 'PUBLISHED', attributes: { kind: 'SEAPORT', unlocode: 'XXPOX' } });

    // Trade agreements — one with XX as a member, one without.
    await gckbService.create(GLOBAL, 'trade_agreement', { name: 'XX–AA FTA', code: 'XX-AA-FTA', status: 'PUBLISHED', attributes: { kind: 'FTA', memberCountryCodes: ['XX', 'AA'], status: 'IN_FORCE' } });
    await gckbService.create(GLOBAL, 'trade_agreement', { name: 'BB–CC FTA', code: 'BB-CC-FTA', status: 'PUBLISHED', attributes: { kind: 'FTA', memberCountryCodes: ['BB', 'CC'] } });

    // Tenant pollution — a published tenant policy/country for XX that must NOT surface.
    await publishCountry(tenantCtx(orgA), 'XX', 'Tenant XX');
    await gckbService.create(tenantCtx(orgA), 'country_policy', { name: 'Tenant Secret Tax', countryCode: 'XX', policyType: 'tax', status: 'PUBLISHED', attributes: { taxName: 'SECRET', taxType: 'VAT', ratePercent: 99 } });

    const profile = await getCountryProfile('XX');
    expect(profile).not.toBeNull();
    const p = profile!;

    expect(p.country.code).toBe('XX');
    expect(p.country.capital).toBe('Capital City');
    expect(p.counts.policies).toBe(3); // 3 published, draft + tenant excluded
    expect(p.policyGroups.tax).toHaveLength(1);
    expect(p.policyGroups.tariff).toHaveLength(1);
    expect(p.policyGroups.license).toHaveLength(1);
    expect(p.policyGroups.tax![0].name).toBe('GST'); // not the tenant 'SECRET'
    expect(p.policies.every((policy) => policy.name !== 'Draft Duty')).toBe(true);

    expect(p.counts.authorities).toBe(1);
    expect(p.authorities[0].name).toBe('XX Customs');
    expect(p.counts.ports).toBe(1);
    expect(p.ports[0].unlocode).toBe('XXPOX');

    expect(p.counts.agreements).toBe(1);
    expect(p.agreements[0].recordKey).toBe('XX-AA-FTA');
  });
});
