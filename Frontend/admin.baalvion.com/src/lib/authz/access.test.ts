import { describe, it, expect } from 'vitest';
import { evaluate, hasPermission, permissionMatches, type Principal } from './access';
import { policyFor, ROUTE_POLICIES } from './policy';
import { canOpenSitePath, siteKeyOf } from './siteScope';
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

describe('website-scoped writer (invited via CMS, no org role)', () => {
  // A person who accepted a CMS invite holds cms_author on one site and no console org role.
  const writer = P(['cms_author']);

  it('can open only the CMS workspace, media, notifications and their own profile', () => {
    for (const path of ['/dashboard', '/welcome', '/cms', '/cms/websites/law-elite-network', '/media', '/notifications', '/settings/profile']) {
      expect(can(writer, path), path).toBe(true);
    }
  });

  it('is locked out of every other section', () => {
    for (const path of [
      '/analytics', '/commerce', '/jobs', '/ctm', '/imperialpedia', '/news-intelligence', '/law', '/newsroom',
      '/crm', '/ir', '/marketplace', '/users', '/staff', '/people', '/payments', '/billing', '/revenue',
      '/security', '/audit-logs', '/settings', '/status', '/pending-features', '/infrastructure', '/rbac',
    ]) {
      expect(can(writer, path), path).toBe(false);
    }
  });

  it('still lets higher roles into the sections that were opened up to everyone before', () => {
    expect(can(PEOPLE.editor, '/law')).toBe(true);
    expect(can(PEOPLE.manager, '/jobs')).toBe(true);
    expect(can(PEOPLE.viewer, '/jobs')).toBe(false);
    expect(can(PEOPLE.admin, '/status')).toBe(true);
    expect(can(PEOPLE.superAdmin, '/commerce')).toBe(true);
  });
});

describe('website scoping', () => {
  const mine = new Set(['law-elite-network', 'ec574a0b-519a-460d-b7cf-4ccd4fe0cf1e']);

  it('reads the site out of /cms/websites/<site>/…', () => {
    expect(siteKeyOf('/cms/websites/imperialpedia/analytics')).toBe('imperialpedia');
    expect(siteKeyOf('/cms/websites/ir.baalvion.com/members')).toBe('ir.baalvion.com');
    expect(siteKeyOf('/cms/websites')).toBeNull();
    expect(siteKeyOf('/cms/posts')).toBeNull();
  });

  it('lets a member open their own site and locks every other one', () => {
    const roles = ['cms_author'];
    expect(canOpenSitePath('/cms/websites/law-elite-network/members', roles, mine)).toBe(true);
    expect(canOpenSitePath('/cms/websites/imperialpedia', roles, mine)).toBe(false);
    expect(canOpenSitePath('/cms/websites/ir.baalvion.com/seo', roles, mine)).toBe(false);
    expect(canOpenSitePath('/cms/posts', roles, mine)).toBe(true);
  });

  it('does not lock while memberships are still loading, and never locks platform admins', () => {
    expect(canOpenSitePath('/cms/websites/imperialpedia', ['cms_author'], null)).toBe(true);
    expect(canOpenSitePath('/cms/websites/imperialpedia', ['admin'], mine)).toBe(true);
    expect(canOpenSitePath('/cms/websites/imperialpedia', ['super_admin'], new Set())).toBe(true);
  });
});
