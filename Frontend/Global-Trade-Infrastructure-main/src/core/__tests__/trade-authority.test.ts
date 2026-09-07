import { describe, it, expect } from 'vitest';
import { resolveTradeAuthority, resolveAuthority } from '../authority-mapping';
import { USER_ROLES } from '../roles';
import { getPersona, personaAllowsPath } from '../personas';

/**
 * Where trade authority comes from.
 *
 * Access to this product is granted once in the admin console and travels in the access token
 * as `businesses.trade`, projected here by the gateway. Before that existed, authority was
 * inferred from an ORGANIZATION role — which says what someone is inside their company, not
 * what they were given in trade. One person working across trade and jobs needed two separate
 * role assignments in two systems.
 *
 * An explicit grant therefore wins; the org role remains only as the fallback for principals
 * who have no grant yet.
 */
describe('an explicit grant wins over the inferred org role', () => {
  it('resolves the granted trade role, ignoring the org role entirely', () => {
    // 'viewer' in their org, but granted compliance in trade — the grant is the statement.
    expect(resolveTradeAuthority(['viewer'], { trade: 'compliance' }))
      .toBe(USER_ROLES.COMPLIANCE_OFFICER);
  });

  it('a grant can be LOWER than the org role would have given', () => {
    // Someone senior in their org, deliberately given read-only access to trade.
    const withGrant = resolveTradeAuthority(['owner'], { trade: 'viewer' });
    const withoutGrant = resolveAuthority(['owner']);
    expect(withGrant).toBe(USER_ROLES.MEMBER);
    expect(withGrant).not.toBe(withoutGrant);
  });

  it('falls back to the org role when there is no grant', () => {
    expect(resolveTradeAuthority(['owner'], {})).toBe(resolveAuthority(['owner']));
    expect(resolveTradeAuthority(['owner'], undefined)).toBe(resolveAuthority(['owner']));
    expect(resolveTradeAuthority(['owner'], null)).toBe(resolveAuthority(['owner']));
  });
});

describe('grants for other products confer nothing here', () => {
  it('a jobs grant does not grant trade access', () => {
    // Falls through to the org role — the jobs grant is invisible to this product.
    expect(resolveTradeAuthority(['viewer'], { jobs: 'admin' }))
      .toBe(resolveAuthority(['viewer']));
  });

  it('an ir grant alongside a trade grant does not change the trade role', () => {
    expect(resolveTradeAuthority(['viewer'], { ir: 'admin', trade: 'viewer' }))
      .toBe(USER_ROLES.MEMBER);
  });
});

describe('fails closed', () => {
  it('an unrecognised grant resolves to the floor, not to the org role', () => {
    // It WAS a deliberate grant, so it must not silently widen access via the fallback.
    const resolved = resolveTradeAuthority(['owner'], { trade: 'wizard' });
    expect(resolved).toBe(USER_ROLES.MEMBER);
    expect(resolved).not.toBe(resolveAuthority(['owner']));
  });

  it('an empty grant string is treated as no grant', () => {
    expect(resolveTradeAuthority(['owner'], { trade: '' })).toBe(resolveAuthority(['owner']));
  });

  it('no roles and no grant lands on MEMBER', () => {
    expect(resolveTradeAuthority([], {})).toBe(USER_ROLES.MEMBER);
    expect(resolveTradeAuthority(undefined, undefined)).toBe(USER_ROLES.MEMBER);
  });
});

describe('the resolved role drives a real persona', () => {
  it('every trade grant maps to a persona that can reach its own home', () => {
    for (const grant of ['viewer', 'ops', 'compliance', 'finance', 'admin']) {
      const role = resolveTradeAuthority(['viewer'], { trade: grant });
      const persona = getPersona(role);
      expect(persona, `${grant} has no persona`).toBeTruthy();
      expect(personaAllowsPath(persona, persona.home), `${grant} cannot open its own home`).toBe(true);
    }
  });

  it('a viewer grant does not land on a god-view persona', () => {
    const persona = getPersona(resolveTradeAuthority(['owner'], { trade: 'viewer' }));
    expect(persona.godView ?? false).toBe(false);
    expect(persona.nav.includes('*')).toBe(false);
  });
});
