import { describe, it, expect } from 'vitest';
import { evaluate, hasPermission, permissionMatches, type Principal } from './access';
import { policyFor, ROUTE_POLICIES } from './policy';
import { roleLevel, isRoleAtLeast, FUNCTIONAL_ROLE_TIER, ROLE_HIERARCHY } from './hierarchy';

/**
 * The console's access decisions.
 *
 * Before this engine existed, 34 of 35 dashboard sections had NO authorization at all — the
 * sidebar hid links and typing the URL still worked. These assertions pin the behaviour that
 * replaced it, and mirror auth-node's guards (Backend/packages/auth-node/rbac.js), which is
 * what actually enforces server-side. If the two drift, the console starts promising access
 * the API refuses — or hiding access it would have granted.
 */
const P = (roles: string[], permissions: string[] = []): Principal => ({ roles, permissions });

const PEOPLE = {
  superAdmin: P(['super_admin']),
  owner: P(['owner']),
  admin: P(['admin']),
  manager: P(['manager']),
  editor: P(['editor']),
  viewer: P(['viewer']),
  writerAlsoAdmin: P(['cms_author', 'admin']), // the roles[0] bug case
  finance: P(['finance']),
  platformSecurity: P(['platform_security_admin']),
};

const can = (who: Principal, path: string) => evaluate(who, policyFor(path) ?? {}).allowed;

describe('route policy covers the console', () => {
  it('governs every declared route and each rule has a label', () => {
    expect(ROUTE_POLICIES.length).toBeGreaterThan(30);
    for (const p of ROUTE_POLICIES) {
      expect(p.path.startsWith('/'), `${p.path} must be absolute`).toBe(true);
      expect(p.label, `${p.path} needs a human label for the denial screen`).toBeTruthy();
    }
  });

  it('matches the LONGEST prefix, so a child can be opened up relative to its parent', () => {
    // /settings needs admin; your own profile underneath it must stay reachable.
    expect(policyFor('/settings')?.path).toBe('/settings');
    expect(policyFor('/settings/profile')?.path).toBe('/settings/profile');
    expect(can(PEOPLE.viewer, '/settings/profile')).toBe(true);
    expect(can(PEOPLE.viewer, '/settings')).toBe(false);
  });

  it('an ungoverned path returns null so callers can fail closed', () => {
    expect(policyFor('/a-section-nobody-declared')).toBeNull();
  });
});

describe('signed-out users reach nothing', () => {
  it.each(['/dashboard', '/cms', '/payments', '/rbac'])('%s', (path) => {
    const d = evaluate(null, policyFor(path) ?? {});
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe('unauthenticated');
  });
});

describe('an external writer is confined to content', () => {
  it.each(['/payments', '/security', '/staff', '/rbac', '/infrastructure', '/users', '/settings'])(
    'blocked from %s',
    (path) => expect(can(PEOPLE.editor, path)).toBe(false),
  );

  it.each(['/cms', '/media', '/dashboard', '/settings/profile'])(
    'still reaches %s',
    (path) => expect(can(PEOPLE.editor, path)).toBe(true),
  );
});

describe('regressions that were real bugs', () => {
  it('a multi-role user is judged on their HIGHEST role, not the first', () => {
    // ['cms_author','admin'] used to collapse to cms_author and hide the whole console.
    expect(can(PEOPLE.writerAlsoAdmin, '/payments')).toBe(true);
    expect(can(PEOPLE.writerAlsoAdmin, '/staff')).toBe(true);
  });

  it('owner reaches sections the old nav hid from them', () => {
    // The nav listed ['super_admin','admin'] literally, excluding owner — who outranks admin
    // server-side and would have been served.
    for (const path of ['/security', '/sessions', '/identity']) {
      expect(can(PEOPLE.owner, path)).toBe(true);
    }
  });

  it('functional roles are mapped, not stranded at -1', () => {
    for (const [role, tier] of Object.entries(FUNCTIONAL_ROLE_TIER)) {
      expect(roleLevel(role)).toBe(roleLevel(tier));
      expect(roleLevel(role)).not.toBe(-1);
    }
  });

  it('a genuinely unknown role still scores -1 and is refused', () => {
    expect(roleLevel('wizard')).toBe(-1);
    expect(isRoleAtLeast(['wizard'], 'viewer')).toBe(false);
    expect(can(P(['wizard']), '/payments')).toBe(false);
  });

  it('a permission claim does NOT open an admin-service section', () => {
    // admin-service gates on requireStaffAdmin (roles only), so offering a permission route in
    // would promise access the server refuses.
    expect(can(P(['member'], ['manage:billing']), '/payments')).toBe(false);
  });

  it('but a permission clause still works where the service honours one', () => {
    expect(can(P(['member'], ['role:assign']), '/rbac')).toBe(true);
  });
});

describe('platform roles are their own dimension', () => {
  it('platform_security_admin reaches security but not billing', () => {
    expect(can(PEOPLE.platformSecurity, '/security')).toBe(true);
    expect(can(PEOPLE.platformSecurity, '/payments')).toBe(false);
  });
});

describe('super_admin reaches everything the console declares', () => {
  it.each(ROUTE_POLICIES.map((p) => p.path))('%s', (path) => {
    expect(can(PEOPLE.superAdmin, path)).toBe(true);
  });
});

describe('permission matching', () => {
  it('matches exactly, and honours a trailing wildcard', () => {
    expect(permissionMatches('manage:org', 'manage:org')).toBe(true);
    expect(permissionMatches('user:*', 'user:read')).toBe(true);
    expect(permissionMatches('*', 'anything')).toBe(true);
  });

  it('does not treat a partial string as a wildcard', () => {
    expect(permissionMatches('user', 'user:read')).toBe(false);
    expect(permissionMatches('manage:o', 'manage:org')).toBe(false);
  });

  it('super_admin and a "*" claim both grant everything', () => {
    expect(hasPermission(P(['super_admin']), 'whatever:you:like')).toBe(true);
    expect(hasPermission(P(['viewer'], ['*']), 'manage:org')).toBe(true);
  });

  it('functional roles carry their own implied permissions', () => {
    expect(hasPermission(PEOPLE.finance, 'manage:billing')).toBe(true);
    expect(hasPermission(PEOPLE.finance, 'delete:org')).toBe(false);
  });
});

describe('denial reasons are honest', () => {
  it('reports a config problem, not user error, only for a truly unknown role', () => {
    expect(evaluate(P(['wizard']), policyFor('/payments')!).reason).toBe('unmapped-role');
    // finance IS mapped — telling them their account needs setup would be wrong.
    expect(evaluate(PEOPLE.finance, policyFor('/payments')!).reason).not.toBe('unmapped-role');
  });
});

describe('the hierarchy itself', () => {
  it('is strictly ordered and index-addressed', () => {
    ROLE_HIERARCHY.forEach((role, i) => expect(roleLevel(role)).toBe(i));
  });
});
