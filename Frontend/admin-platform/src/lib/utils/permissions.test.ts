import { describe, it, expect } from 'vitest';
import { can, isAtLeast, isAdminLevel, isSuperAdmin } from './permissions';
import { canManageRole } from '@/lib/constants/roles';

describe('can', () => {
  it('grants an action a role is explicitly permitted', () => {
    expect(can('admin', 'cms', 'delete')).toBe(true);
  });

  it('denies an action a role is not permitted', () => {
    expect(can('viewer', 'users', 'delete')).toBe(false);
  });

  it('denies a resource the role has no entry for at all', () => {
    expect(can('editor', 'payments', 'read')).toBe(false);
  });

  it('denies everything when no role is present (unauthenticated/unresolved)', () => {
    expect(can(undefined, 'cms', 'read')).toBe(false);
  });

  it('grants super_admin the manage action on every resource it lists', () => {
    expect(can('super_admin', 'users', 'manage')).toBe(true);
    expect(can('super_admin', 'feature_flags', 'manage')).toBe(true);
  });
});

describe('isAtLeast', () => {
  it('is true when the role exceeds the minimum', () => {
    expect(isAtLeast('owner', 'admin')).toBe(true);
  });

  it('is true when the role exactly equals the minimum', () => {
    expect(isAtLeast('admin', 'admin')).toBe(true);
  });

  it('is false when the role is below the minimum', () => {
    expect(isAtLeast('viewer', 'admin')).toBe(false);
  });

  it('is false when no role is present', () => {
    expect(isAtLeast(undefined, 'admin')).toBe(false);
  });
});

describe('isAdminLevel', () => {
  it('is true for admin and above', () => {
    expect(isAdminLevel('admin')).toBe(true);
    expect(isAdminLevel('owner')).toBe(true);
    expect(isAdminLevel('super_admin')).toBe(true);
  });

  it('is false below admin', () => {
    expect(isAdminLevel('manager')).toBe(false);
    expect(isAdminLevel('viewer')).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('is true only for super_admin', () => {
    expect(isSuperAdmin('super_admin')).toBe(true);
    expect(isSuperAdmin('owner')).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('canManageRole (role-hierarchy admin permission check)', () => {
  it('allows a higher-level role to manage a lower-level one', () => {
    expect(canManageRole('owner', 'admin')).toBe(true);
  });

  it('denies a role managing an equal-level role (no lateral management)', () => {
    expect(canManageRole('admin', 'admin')).toBe(false);
  });

  it('denies a lower-level role managing a higher-level one — the core admin-escalation guard', () => {
    expect(canManageRole('viewer', 'super_admin')).toBe(false);
  });

  it('lets super_admin manage every other role', () => {
    expect(canManageRole('super_admin', 'owner')).toBe(true);
    expect(canManageRole('super_admin', 'admin')).toBe(true);
  });
});
