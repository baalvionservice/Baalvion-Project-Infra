import { describe, it, expect } from 'vitest';
import { ORG_TYPE_CONFIG, getOrgTypeNav, orgTypeAllowsPath, isPlatformOrgType, type OrgType } from '../organizations';

/**
 * Organization-type access matrix.
 *
 * When a session carries an organization type, the RouteGuard decides access with
 * orgTypeAllowsPath, not with the persona list. Allow-list entries match by PREFIX, so a bare
 * '/governance' once opened every /governance/* screen to the regulator organization (platform
 * admin, bank admin, customs...). These tests pin the boundaries between organization types.
 */

const orgTypes = Object.keys(ORG_TYPE_CONFIG) as OrgType[];
const scoped = orgTypes.filter((t) => !isPlatformOrgType(t));

/** Home screens that belong to exactly one organization type. */
const OWN_SCREENS: Partial<Record<OrgType, string[]>> = {
  buyer: ['/buyer/dashboard'],
  seller: ['/seller/dashboard'],
  trade_agent: ['/agent/dashboard'],
  bank: ['/governance/bank-admin'],
  customs_authority: ['/governance/customs'],
  regulator: ['/governance/regulatory'],
  compliance_agency: ['/governance/compliance-admin'],
};

describe('organization type access', () => {
  it('every scoped organization type can open its own home', () => {
    for (const t of scoped) {
      expect(orgTypeAllowsPath(t, ORG_TYPE_CONFIG[t].home), `${t} must reach its own home`).toBe(true);
    }
  });

  it('only the platform owner reaches the platform and executive consoles', () => {
    for (const t of scoped) {
      for (const path of ['/governance/platform-admin', '/governance/sovereign-admin', '/executive/command', '/platform/organizations']) {
        expect(orgTypeAllowsPath(t, path), `${t} must not reach ${path}`).toBe(false);
      }
    }
  });

  it('customer dashboards are closed to every other organization type', () => {
    for (const [owner, screens] of Object.entries(OWN_SCREENS) as [OrgType, string[]][]) {
      for (const t of scoped.filter((x) => x !== owner)) {
        for (const screen of screens) {
          // The one deliberate overlap: compliance and regulator organizations both work in the
          // governance compliance screens through their persona lists. Everything else must be closed.
          if (screen === '/governance/regulatory' || screen === '/governance/compliance-admin') continue;
          // Regulators oversee customs: /governance/customs is listed in the national-regulator persona.
          if (t === 'regulator' && screen === '/governance/customs') continue;
          expect(orgTypeAllowsPath(t, screen), `${t} must not reach ${owner}'s ${screen}`).toBe(false);
        }
      }
    }
  });

  it('a regulator cannot reach the bank or platform consoles', () => {
    expect(orgTypeAllowsPath('regulator', '/governance/regulatory')).toBe(true);
    expect(orgTypeAllowsPath('regulator', '/governance/bank-admin')).toBe(false);
    expect(orgTypeAllowsPath('regulator', '/governance/platform-admin')).toBe(false);
    expect(orgTypeAllowsPath('regulator', '/governance')).toBe(false);
  });

  it('no scoped organization type is allowed a prefix broad enough to open a whole area', () => {
    const TOO_BROAD = new Set(['/', '/governance', '/executive', '/platform', '/financials', '/oversight']);
    for (const t of scoped) {
      for (const entry of getOrgTypeNav(t)) {
        expect(TOO_BROAD.has(entry), `${t} allow-list contains the over-broad prefix "${entry}"`).toBe(false);
      }
    }
  });
});
