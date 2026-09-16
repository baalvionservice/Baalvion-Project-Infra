import { normRole, businessRole } from '../AuthProvider';
import { ALL_ADMIN_ROLES } from '@/lib/access/access.types';

/**
 * How the portal decides who someone is.
 *
 * Two bugs are pinned here, both found on 2026-09-05:
 *
 *  1. `OWNER` mapped to `SUPER_ADMIN`. Registration makes every signed-up user the owner of
 *     their own organization, so every new account was optimistically a portal super-admin —
 *     and STAYED one whenever the profile call that corrects it failed, which the code
 *     explicitly tolerates ("jobs-service down — keep optimistic state").
 *
 *  2. Authority was read from `roles[0]`, an arbitrary pick out of an unordered array.
 *
 * Portal authority now comes from `businesses.jobs` — granted once in the admin console and
 * carried in the access token — so one grant is honoured here without a second role system.
 */
const canReachAdmin = (role: string) => (ALL_ADMIN_ROLES as readonly string[]).includes(role);

describe('org roles grant nothing on their own', () => {
  it('OWNER is NOT a portal super-admin', () => {
    expect(normRole('owner')).toBe('CANDIDATE');
    expect(normRole('OWNER')).toBe('CANDIDATE');
    expect(canReachAdmin(normRole('owner'))).toBe(false);
  });

  it.each(['member', 'viewer', 'owner'])('%s cannot reach the admin panel', (r: string) => {
    expect(canReachAdmin(normRole(r))).toBe(false);
  });

  it('an unknown role falls back to CANDIDATE rather than passing through', () => {
    expect(normRole('')).toBe('CANDIDATE');
    expect(canReachAdmin(normRole('wizard'))).toBe(false);
  });
});

describe('central grants decide portal authority', () => {
  it('reads the role granted for THIS product', () => {
    expect(businessRole({ businesses: { jobs: 'recruiter' } })).toBe('RECRUITER');
    expect(businessRole({ businesses: { jobs: 'admin' } })).toBe('ADMIN');
  });

  it('ignores grants for OTHER products', () => {
    // A trade grant must not confer anything in jobs.
    expect(businessRole({ businesses: { trade: 'admin' } })).toBeNull();
  });

  it('returns null when there is no grant, so the caller falls back rather than guessing', () => {
    expect(businessRole({})).toBeNull();
    expect(businessRole({ businesses: {} })).toBeNull();
    expect(businessRole({ roles: ['owner'] })).toBeNull();
  });

  it('a granted role can reach the admin panel; the absence of one cannot', () => {
    expect(canReachAdmin(businessRole({ businesses: { jobs: 'recruiter' } })!)).toBe(true);
    expect(businessRole({ roles: ['owner'] })).toBeNull();
  });

  it('a malformed businesses claim does not throw or grant', () => {
    expect(businessRole({ businesses: null as never })).toBeNull();
    expect(businessRole({ businesses: 'nonsense' as never })).toBeNull();
  });
});
