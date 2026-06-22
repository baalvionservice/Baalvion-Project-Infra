/**
 * @file server/gckb/__tests__/directories.integration.test.ts
 * @description Integration tests for the cross-country Port + Authority
 * directories against real PostgreSQL: country tagging, published-only filtering,
 * and supranational (country-less) authorities.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { listPortsDirectory, listAuthoritiesDirectory } from '../public-read';

const GLOBAL: KbActorContext = { organizationId: null, actorId: 'kb-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };

describe('gckb directories (PostgreSQL)', () => {
  beforeEach(async () => {
    await resetDatabase();
    await gckbService.create(GLOBAL, 'country', { name: 'India', code: 'IN', status: 'PUBLISHED', attributes: { alpha2: 'IN', alpha3: 'IND' } });
    await gckbService.create(GLOBAL, 'point_of_entry', { name: 'Nhava Sheva (JNPT)', countryCode: 'IN', code: 'INNSA', status: 'PUBLISHED', attributes: { kind: 'SEAPORT', unlocode: 'INNSA' } });
    await gckbService.create(GLOBAL, 'point_of_entry', { name: 'Draft Airport', countryCode: 'IN', code: 'INDEL', attributes: { kind: 'AIRPORT', iata: 'DEL' } }); // DRAFT
    await gckbService.create(GLOBAL, 'authority', { name: 'CBIC', code: 'cbic', countryCode: 'IN', status: 'PUBLISHED', attributes: { kind: 'CUSTOMS', website: 'https://cbic.gov.in' } });
    await gckbService.create(GLOBAL, 'authority', { name: 'World Customs Organization', code: 'wco', status: 'PUBLISHED', attributes: { kind: 'STANDARDS' } }); // supranational (no country)
  });
  afterAll(async () => {
    await disconnect();
  });

  it('lists published ports country-tagged, excluding drafts', async () => {
    const ports = await listPortsDirectory();
    expect(ports).toHaveLength(1);
    expect(ports[0].name).toContain('Nhava Sheva');
    expect(ports[0].countryCode).toBe('IN');
    expect(ports[0].countryName).toBe('India');
    expect(ports[0].unlocode).toBe('INNSA');
  });

  it('lists authorities, tagging supranational bodies without a country', async () => {
    const authorities = await listAuthoritiesDirectory();
    expect(authorities).toHaveLength(2);
    const cbic = authorities.find((a) => a.name === 'CBIC')!;
    expect(cbic.countryCode).toBe('IN');
    expect(cbic.countryName).toBe('India');
    const wco = authorities.find((a) => a.name === 'World Customs Organization')!;
    expect(wco.countryCode).toBe('—');
    expect(wco.countryName).toBe('Supranational');
  });
});
