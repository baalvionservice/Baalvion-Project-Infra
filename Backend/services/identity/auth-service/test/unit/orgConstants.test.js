'use strict';
import { describe, it, expect } from 'vitest';
import {
    ORG_TYPES,
    MEMBERSHIP_ROLES,
    ROLE_CAPABILITIES,
    isValidOrgType,
    isValidRole,
    canManageUsers,
    canManageOrganization,
} from '../../utils/orgConstants.js';

// ─────────────────────────────────────────────────────────────────────────────
// ORG_TYPES
// ─────────────────────────────────────────────────────────────────────────────
describe('ORG_TYPES', () => {
    const EXPECTED_TYPES = [
        'buyer',
        'seller',
        'trade_agent',
        'logistics_provider',
        'customs_authority',
        'bank',
        'insurance_provider',
        'compliance_agency',
        'regulator',
        'platform_owner',
    ];

    it('contains exactly 10 org types', () => {
        expect(ORG_TYPES).toHaveLength(10);
    });

    it('contains every expected type and no extras', () => {
        // Arrange
        const actual = [...ORG_TYPES].sort();
        const expected = [...EXPECTED_TYPES].sort();
        // Assert
        expect(actual).toEqual(expected);
    });

    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(ORG_TYPES)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MEMBERSHIP_ROLES
// ─────────────────────────────────────────────────────────────────────────────
describe('MEMBERSHIP_ROLES', () => {
    const EXPECTED_ROLES = ['owner', 'admin', 'manager', 'officer', 'analyst', 'operator', 'viewer'];

    it('contains exactly 7 roles', () => {
        expect(MEMBERSHIP_ROLES).toHaveLength(7);
    });

    it('contains every expected role and no extras', () => {
        // Arrange
        const actual = [...MEMBERSHIP_ROLES].sort();
        const expected = [...EXPECTED_ROLES].sort();
        // Assert
        expect(actual).toEqual(expected);
    });

    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(MEMBERSHIP_ROLES)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidOrgType
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidOrgType', () => {
    it('accepts "buyer" as a valid org type', () => {
        expect(isValidOrgType('buyer')).toBe(true);
    });

    it('accepts "bank" as a valid org type', () => {
        expect(isValidOrgType('bank')).toBe(true);
    });

    it('accepts "platform_owner" as a valid org type', () => {
        expect(isValidOrgType('platform_owner')).toBe(true);
    });

    it('accepts all 10 org types', () => {
        // Arrange + Act + Assert
        for (const type of ORG_TYPES) {
            expect(isValidOrgType(type)).toBe(true);
        }
    });

    it('rejects an unknown string', () => {
        expect(isValidOrgType('unknown_type')).toBe(false);
    });

    it('rejects an empty string', () => {
        expect(isValidOrgType('')).toBe(false);
    });

    it('rejects null', () => {
        expect(isValidOrgType(null)).toBe(false);
    });

    it('rejects undefined', () => {
        expect(isValidOrgType(undefined)).toBe(false);
    });

    it('rejects a numeric value', () => {
        expect(isValidOrgType(42)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidRole
// ─────────────────────────────────────────────────────────────────────────────
describe('isValidRole', () => {
    it('accepts "owner" as a valid role', () => {
        expect(isValidRole('owner')).toBe(true);
    });

    it('accepts "viewer" as a valid role', () => {
        expect(isValidRole('viewer')).toBe(true);
    });

    it('accepts all 7 current roles', () => {
        for (const role of MEMBERSHIP_ROLES) {
            expect(isValidRole(role)).toBe(true);
        }
    });

    it('rejects the legacy "member" role', () => {
        // "member" was the old 3-tier model — must NOT be accepted
        expect(isValidRole('member')).toBe(false);
    });

    it('rejects the legacy "editor" role', () => {
        // "editor" was also part of the old model — must NOT be accepted
        expect(isValidRole('editor')).toBe(false);
    });

    it('rejects an unknown string', () => {
        expect(isValidRole('superuser')).toBe(false);
    });

    it('rejects an empty string', () => {
        expect(isValidRole('')).toBe(false);
    });

    it('rejects null', () => {
        expect(isValidRole(null)).toBe(false);
    });

    it('rejects undefined', () => {
        expect(isValidRole(undefined)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROLE_CAPABILITIES
// ─────────────────────────────────────────────────────────────────────────────
describe('ROLE_CAPABILITIES', () => {
    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(ROLE_CAPABILITIES)).toBe(true);
    });

    it('defines a capabilities entry for every role in MEMBERSHIP_ROLES', () => {
        for (const role of MEMBERSHIP_ROLES) {
            expect(ROLE_CAPABILITIES).toHaveProperty(role);
        }
    });

    // ── owner ──
    describe('owner', () => {
        it('has manageOrganization = true', () => {
            expect(ROLE_CAPABILITIES.owner.manageOrganization).toBe(true);
        });

        it('has manageUsers = true', () => {
            expect(ROLE_CAPABILITIES.owner.manageUsers).toBe(true);
        });

        it('has approve = true', () => {
            expect(ROLE_CAPABILITIES.owner.approve).toBe(true);
        });

        it('has view = true and edit = true', () => {
            expect(ROLE_CAPABILITIES.owner.view).toBe(true);
            expect(ROLE_CAPABILITIES.owner.edit).toBe(true);
        });
    });

    // ── admin ──
    describe('admin', () => {
        it('has manageUsers = true', () => {
            expect(ROLE_CAPABILITIES.admin.manageUsers).toBe(true);
        });

        it('has manageOrganization = false (cannot delete org / transfer ownership)', () => {
            expect(ROLE_CAPABILITIES.admin.manageOrganization).toBe(false);
        });

        it('has approve = true', () => {
            expect(ROLE_CAPABILITIES.admin.approve).toBe(true);
        });
    });

    // ── manager ──
    describe('manager', () => {
        it('has approve = true', () => {
            expect(ROLE_CAPABILITIES.manager.approve).toBe(true);
        });

        it('has manageUsers = false', () => {
            expect(ROLE_CAPABILITIES.manager.manageUsers).toBe(false);
        });

        it('has manageOrganization = false', () => {
            expect(ROLE_CAPABILITIES.manager.manageOrganization).toBe(false);
        });
    });

    // ── officer ──
    describe('officer', () => {
        it('has approve = true (functional authority, e.g. compliance officer)', () => {
            expect(ROLE_CAPABILITIES.officer.approve).toBe(true);
        });

        it('has manageUsers = false', () => {
            expect(ROLE_CAPABILITIES.officer.manageUsers).toBe(false);
        });

        it('has manageOrganization = false', () => {
            expect(ROLE_CAPABILITIES.officer.manageOrganization).toBe(false);
        });
    });

    // ── operator ──
    describe('operator', () => {
        it('has edit = true (can create/edit records)', () => {
            expect(ROLE_CAPABILITIES.operator.edit).toBe(true);
        });

        it('has approve = false (cannot approve)', () => {
            expect(ROLE_CAPABILITIES.operator.approve).toBe(false);
        });

        it('has manageUsers = false', () => {
            expect(ROLE_CAPABILITIES.operator.manageUsers).toBe(false);
        });

        it('has manageOrganization = false', () => {
            expect(ROLE_CAPABILITIES.operator.manageOrganization).toBe(false);
        });
    });

    // ── analyst ──
    describe('analyst', () => {
        it('has view = true (read-only analytics)', () => {
            expect(ROLE_CAPABILITIES.analyst.view).toBe(true);
        });

        it('has edit = false (cannot edit)', () => {
            expect(ROLE_CAPABILITIES.analyst.edit).toBe(false);
        });

        it('has approve = false', () => {
            expect(ROLE_CAPABILITIES.analyst.approve).toBe(false);
        });

        it('has manageUsers = false', () => {
            expect(ROLE_CAPABILITIES.analyst.manageUsers).toBe(false);
        });

        it('has manageOrganization = false', () => {
            expect(ROLE_CAPABILITIES.analyst.manageOrganization).toBe(false);
        });
    });

    // ── viewer ──
    describe('viewer', () => {
        it('has view = true (read-only)', () => {
            expect(ROLE_CAPABILITIES.viewer.view).toBe(true);
        });

        it('has edit = false', () => {
            expect(ROLE_CAPABILITIES.viewer.edit).toBe(false);
        });

        it('has approve = false', () => {
            expect(ROLE_CAPABILITIES.viewer.approve).toBe(false);
        });

        it('has manageUsers = false', () => {
            expect(ROLE_CAPABILITIES.viewer.manageUsers).toBe(false);
        });

        it('has manageOrganization = false', () => {
            expect(ROLE_CAPABILITIES.viewer.manageOrganization).toBe(false);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// canManageUsers
// ─────────────────────────────────────────────────────────────────────────────
describe('canManageUsers', () => {
    it('returns true for owner', () => {
        expect(canManageUsers('owner')).toBe(true);
    });

    it('returns true for admin', () => {
        expect(canManageUsers('admin')).toBe(true);
    });

    it('returns false for manager', () => {
        expect(canManageUsers('manager')).toBe(false);
    });

    it('returns false for officer', () => {
        expect(canManageUsers('officer')).toBe(false);
    });

    it('returns false for operator', () => {
        expect(canManageUsers('operator')).toBe(false);
    });

    it('returns false for analyst', () => {
        expect(canManageUsers('analyst')).toBe(false);
    });

    it('returns false for viewer', () => {
        expect(canManageUsers('viewer')).toBe(false);
    });

    it('returns false for an unknown role', () => {
        expect(canManageUsers('ghost')).toBe(false);
    });

    it('returns false for the legacy "member" role', () => {
        expect(canManageUsers('member')).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// canManageOrganization
// ─────────────────────────────────────────────────────────────────────────────
describe('canManageOrganization', () => {
    it('returns true only for owner', () => {
        expect(canManageOrganization('owner')).toBe(true);
    });

    it('returns false for admin (cannot transfer ownership / delete org)', () => {
        expect(canManageOrganization('admin')).toBe(false);
    });

    it('returns false for manager', () => {
        expect(canManageOrganization('manager')).toBe(false);
    });

    it('returns false for officer', () => {
        expect(canManageOrganization('officer')).toBe(false);
    });

    it('returns false for operator', () => {
        expect(canManageOrganization('operator')).toBe(false);
    });

    it('returns false for analyst', () => {
        expect(canManageOrganization('analyst')).toBe(false);
    });

    it('returns false for viewer', () => {
        expect(canManageOrganization('viewer')).toBe(false);
    });

    it('returns false for an unknown role', () => {
        expect(canManageOrganization('ghost')).toBe(false);
    });

    it('returns false for the legacy "editor" role', () => {
        expect(canManageOrganization('editor')).toBe(false);
    });
});
