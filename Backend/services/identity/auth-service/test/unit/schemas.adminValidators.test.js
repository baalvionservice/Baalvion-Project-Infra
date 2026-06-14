'use strict';
/**
 * Validator tests for the admin/org schemas defined in validators/schemas.js.
 * No DB — this module only depends on zod + utils/orgConstants.
 */
import { describe, it, expect } from 'vitest';
import {
    inviteMember,
    bulkInvite,
    platformCreateOrg,
    updateOrg,
    setOrgStatus,
    transferOwnership,
} from '../../validators/schemas.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns the .data of a successful parse or throws to surface the zod error. */
function mustPass(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        throw new Error(`Expected valid, got: ${JSON.stringify(result.error.issues)}`);
    }
    return result.data;
}

/** Returns the ZodError issues array of a failed parse or throws if it unexpectedly passed. */
function mustFail(schema, input) {
    const result = schema.safeParse(input);
    if (result.success) {
        throw new Error(`Expected invalid, but schema accepted: ${JSON.stringify(result.data)}`);
    }
    return result.error.issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// inviteMember
// ─────────────────────────────────────────────────────────────────────────────
describe('inviteMember', () => {
    const VALID_BASE = { email: 'user@example.com' };

    it('accepts all 7 current membership roles', () => {
        // Arrange
        const roles = ['owner', 'admin', 'manager', 'officer', 'analyst', 'operator', 'viewer'];
        // Act + Assert
        for (const role of roles) {
            const data = mustPass(inviteMember, { ...VALID_BASE, role });
            expect(data.role).toBe(role);
        }
    });

    it('defaults the role to "viewer" when omitted', () => {
        // Arrange
        const input = { email: 'user@example.com' };
        // Act
        const data = mustPass(inviteMember, input);
        // Assert
        expect(data.role).toBe('viewer');
    });

    it('accepts an optional fullName', () => {
        // Arrange
        const input = { email: 'user@example.com', role: 'admin', fullName: 'Alice Smith' };
        // Act
        const data = mustPass(inviteMember, input);
        // Assert
        expect(data.fullName).toBe('Alice Smith');
    });

    it('rejects the legacy "member" role', () => {
        // Arrange
        const input = { email: 'user@example.com', role: 'member' };
        // Act
        const issues = mustFail(inviteMember, input);
        // Assert
        expect(issues.length).toBeGreaterThan(0);
    });

    it('rejects an "admin-typo" role string', () => {
        // Arrange
        const input = { email: 'user@example.com', role: 'admin-typo' };
        // Act
        const issues = mustFail(inviteMember, input);
        // Assert
        expect(issues.length).toBeGreaterThan(0);
    });

    it('rejects a missing email', () => {
        // Arrange
        const input = { role: 'viewer' };
        // Act + Assert
        mustFail(inviteMember, input);
    });

    it('rejects a malformed email', () => {
        // Arrange
        const input = { email: 'not-an-email', role: 'viewer' };
        // Act + Assert
        mustFail(inviteMember, input);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// bulkInvite
// ─────────────────────────────────────────────────────────────────────────────
describe('bulkInvite', () => {
    const oneInvite = { email: 'a@example.com', role: 'analyst' };

    it('accepts 1 invite (lower boundary)', () => {
        // Arrange
        const input = { invites: [oneInvite] };
        // Act
        const data = mustPass(bulkInvite, input);
        // Assert
        expect(data.invites).toHaveLength(1);
    });

    it('accepts exactly 500 invites (upper boundary)', () => {
        // Arrange
        const input = { invites: Array.from({ length: 500 }, (_, i) => ({ email: `u${i}@example.com` })) };
        // Act
        const data = mustPass(bulkInvite, input);
        // Assert
        expect(data.invites).toHaveLength(500);
    });

    it('rejects an empty array (0 invites)', () => {
        // Arrange
        const input = { invites: [] };
        // Act
        const issues = mustFail(bulkInvite, input);
        // Assert
        expect(issues.some(i => i.path.includes('invites'))).toBe(true);
    });

    it('rejects 501 invites (above upper boundary)', () => {
        // Arrange
        const input = { invites: Array.from({ length: 501 }, (_, i) => ({ email: `u${i}@example.com` })) };
        // Act
        const issues = mustFail(bulkInvite, input);
        // Assert
        expect(issues.length).toBeGreaterThan(0);
    });

    it('defaults role to "viewer" for each invite that omits it', () => {
        // Arrange
        const input = { invites: [{ email: 'x@example.com' }] };
        // Act
        const data = mustPass(bulkInvite, input);
        // Assert
        expect(data.invites[0].role).toBe('viewer');
    });

    it('rejects a legacy "member" role inside an invite', () => {
        // Arrange
        const input = { invites: [{ email: 'x@example.com', role: 'member' }] };
        // Act + Assert
        mustFail(bulkInvite, input);
    });

    it('rejects when a single invite has a malformed email', () => {
        // Arrange
        const input = { invites: [{ email: 'bad-email', role: 'viewer' }] };
        // Act + Assert
        mustFail(bulkInvite, input);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// platformCreateOrg
// ─────────────────────────────────────────────────────────────────────────────
describe('platformCreateOrg', () => {
    const MINIMAL_VALID = { name: 'Acme Corp', type: 'buyer' };

    it('accepts minimal required fields (name + type)', () => {
        // Arrange + Act
        const data = mustPass(platformCreateOrg, MINIMAL_VALID);
        // Assert
        expect(data.name).toBe('Acme Corp');
        expect(data.type).toBe('buyer');
    });

    it('defaults status to "active" when not provided', () => {
        // Arrange + Act
        const data = mustPass(platformCreateOrg, MINIMAL_VALID);
        // Assert
        expect(data.status).toBe('active');
    });

    it('accepts all 10 valid org types', () => {
        // Arrange
        const types = [
            'buyer', 'seller', 'trade_agent', 'logistics_provider', 'customs_authority',
            'bank', 'insurance_provider', 'compliance_agency', 'regulator', 'platform_owner',
        ];
        // Act + Assert
        for (const type of types) {
            const data = mustPass(platformCreateOrg, { name: 'Org', type });
            expect(data.type).toBe(type);
        }
    });

    it('rejects an unknown type string', () => {
        // Arrange
        const input = { name: 'Bad Org', type: 'unicorn' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('rejects when type is missing', () => {
        // Arrange
        const input = { name: 'No Type Org' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('accepts a full org profile with all optional fields', () => {
        // Arrange
        const input = {
            name: 'Global Bank Ltd',
            type: 'bank',
            slug: 'global-bank',
            legalName: 'Global Bank Limited',
            displayName: 'Global Bank',
            country: 'GB',
            jurisdiction: 'England & Wales',
            contactEmail: 'contact@globalbank.com',
            contactPhone: '+44 20 7946 0000',
            status: 'active',
            ownerEmail: 'ceo@globalbank.com',
            ownerFullName: 'Jane CEO',
        };
        // Act
        const data = mustPass(platformCreateOrg, input);
        // Assert
        expect(data.type).toBe('bank');
        expect(data.slug).toBe('global-bank');
        expect(data.country).toBe('GB');
        expect(data.ownerEmail).toBe('ceo@globalbank.com');
    });

    it('accepts status "suspended"', () => {
        // Arrange
        const input = { name: 'Suspended Org', type: 'seller', status: 'suspended' };
        // Act
        const data = mustPass(platformCreateOrg, input);
        // Assert
        expect(data.status).toBe('suspended');
    });

    it('rejects an invalid status', () => {
        // Arrange
        const input = { name: 'Org', type: 'seller', status: 'deleted' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('rejects a name that is too short (< 2 chars)', () => {
        // Arrange
        const input = { name: 'X', type: 'buyer' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('rejects an invalid contactEmail', () => {
        // Arrange
        const input = { name: 'Org', type: 'buyer', contactEmail: 'not-an-email' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('accepts an empty string for contactEmail (opt-out)', () => {
        // Arrange
        const input = { name: 'Org', type: 'buyer', contactEmail: '' };
        // Act
        const data = mustPass(platformCreateOrg, input);
        // Assert
        expect(data.contactEmail).toBe('');
    });

    it('rejects a country code that is not exactly 2 chars', () => {
        // Arrange
        const input = { name: 'Org', type: 'buyer', country: 'GBR' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });

    it('rejects a slug with spaces', () => {
        // Arrange — slug regex is /^[a-z0-9-]+$/i, so spaces are disallowed
        const input = { name: 'Org', type: 'buyer', slug: 'my org' };
        // Act + Assert
        mustFail(platformCreateOrg, input);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateOrg
// ─────────────────────────────────────────────────────────────────────────────
describe('updateOrg', () => {
    it('accepts an empty object (all fields optional)', () => {
        // Arrange + Act
        const data = mustPass(updateOrg, {});
        // Assert — all fields are optional, so an empty patch is valid
        expect(data).toBeDefined();
    });

    it('accepts a partial update with just a name change', () => {
        // Arrange
        const input = { name: 'New Name Corp' };
        // Act
        const data = mustPass(updateOrg, input);
        // Assert
        expect(data.name).toBe('New Name Corp');
    });

    it('accepts all updatable fields', () => {
        // Arrange
        const input = {
            name: 'Updated Corp',
            legalName: 'Updated Corporation Ltd',
            displayName: 'Updated',
            country: 'US',
            jurisdiction: 'Delaware',
            contactEmail: 'hello@updated.com',
            contactPhone: '+1 555 000 0000',
            plan: 'enterprise',
        };
        // Act
        const data = mustPass(updateOrg, input);
        // Assert
        expect(data.plan).toBe('enterprise');
        expect(data.country).toBe('US');
    });

    it('rejects a name that is too short (< 2 chars)', () => {
        // Arrange
        const input = { name: 'X' };
        // Act + Assert
        mustFail(updateOrg, input);
    });

    it('rejects a malformed contactEmail', () => {
        // Arrange
        const input = { contactEmail: 'bad' };
        // Act + Assert
        mustFail(updateOrg, input);
    });

    it('accepts an empty string for contactEmail', () => {
        // Arrange
        const input = { contactEmail: '' };
        // Act
        const data = mustPass(updateOrg, input);
        // Assert
        expect(data.contactEmail).toBe('');
    });

    it('rejects a country code that is not exactly 2 chars', () => {
        // Arrange
        const input = { country: 'USA' };
        // Act + Assert
        mustFail(updateOrg, input);
    });

    it('does NOT expose a "type" field (type is immutable once created)', () => {
        // Arrange — passing type should either be stripped or cause a failure
        const input = { type: 'bank' };
        // Act
        const result = updateOrg.safeParse(input);
        // Assert — if it succeeds, type must have been stripped; if it fails that's also correct
        if (result.success) {
            expect(result.data).not.toHaveProperty('type');
        }
        // A failure here is also acceptable (strict mode); both outcomes are correct
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// setOrgStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('setOrgStatus', () => {
    it('accepts "active"', () => {
        // Arrange + Act
        const data = mustPass(setOrgStatus, { status: 'active' });
        // Assert
        expect(data.status).toBe('active');
    });

    it('accepts "suspended"', () => {
        // Arrange + Act
        const data = mustPass(setOrgStatus, { status: 'suspended' });
        // Assert
        expect(data.status).toBe('suspended');
    });

    it('rejects an unknown status string', () => {
        // Arrange
        const input = { status: 'deleted' };
        // Act + Assert
        mustFail(setOrgStatus, input);
    });

    it('rejects when status is missing', () => {
        // Arrange
        const input = {};
        // Act + Assert
        mustFail(setOrgStatus, input);
    });

    it('rejects a numeric status', () => {
        // Arrange
        const input = { status: 1 };
        // Act + Assert
        mustFail(setOrgStatus, input);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// transferOwnership
// ─────────────────────────────────────────────────────────────────────────────
describe('transferOwnership', () => {
    it('accepts a string user id', () => {
        // Arrange
        const input = { newOwnerUserId: 'user-uuid-123' };
        // Act
        const data = mustPass(transferOwnership, input);
        // Assert
        expect(data.newOwnerUserId).toBe('user-uuid-123');
    });

    it('accepts a numeric user id and coerces it to a string', () => {
        // Arrange
        const input = { newOwnerUserId: 42 };
        // Act
        const data = mustPass(transferOwnership, input);
        // Assert — schema transforms the number to a string
        expect(data.newOwnerUserId).toBe('42');
        expect(typeof data.newOwnerUserId).toBe('string');
    });

    it('rejects when newOwnerUserId is missing', () => {
        // Arrange
        const input = {};
        // Act + Assert
        mustFail(transferOwnership, input);
    });

    it('rejects null', () => {
        // Arrange
        const input = { newOwnerUserId: null };
        // Act + Assert
        mustFail(transferOwnership, input);
    });
});
