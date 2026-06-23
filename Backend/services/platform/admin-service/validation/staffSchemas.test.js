'use strict';
/**
 * Pure unit tests for the staff mutation validation schemas.
 *
 * Runs with NO database and NO network — it only exercises the zod schemas,
 * which are pure functions. The intent is to prove the schemas stay PERMISSIVE:
 * they must accept every shape the underlying service already accepts and reject
 * only inputs the service itself would reject (empty department name, invalid
 * invitation email).
 *
 * Uses the built-in node:test runner (no extra dependency) so it runs anywhere
 * with `node --test`, consistent with the other backend service test suites.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
    createDepartmentSchema,
    updateEmployeeSchema,
    sendInvitationSchema,
} = require('./staffSchemas');

describe('createDepartmentSchema', () => {
    it('accepts a minimal valid department (name only)', () => {
        const out = createDepartmentSchema.parse({ name: 'Engineering' });
        assert.strictEqual(out.name, 'Engineering');
    });

    it('accepts optional headId/parentId and trims the name (mirrors service trim)', () => {
        const out = createDepartmentSchema.parse({ name: '  Ops  ', headId: 'u1', parentId: null });
        assert.strictEqual(out.name, 'Ops');
        assert.strictEqual(out.parentId, null);
    });

    it('passes through unknown keys the service tolerates today', () => {
        const out = createDepartmentSchema.parse({ name: 'Sales', somethingExtra: 'kept' });
        assert.strictEqual(out.somethingExtra, 'kept');
    });

    it('rejects a missing name (service requires it)', () => {
        assert.throws(() => createDepartmentSchema.parse({}));
    });

    it('rejects an empty/whitespace name (service rejects it)', () => {
        assert.throws(() => createDepartmentSchema.parse({ name: '   ' }));
    });
});

describe('updateEmployeeSchema', () => {
    it('accepts an empty body — every field is optional (service COALESCEs)', () => {
        const out = updateEmployeeSchema.parse({});
        assert.deepStrictEqual(out, {});
    });

    it('accepts a partial update with only some fields', () => {
        const out = updateEmployeeSchema.parse({ title: 'Lead', status: 'active' });
        assert.strictEqual(out.title, 'Lead');
        assert.strictEqual(out.status, 'active');
    });

    it('accepts null values (service treats null as no-change via COALESCE)', () => {
        const out = updateEmployeeSchema.parse({ managerId: null, teamId: null });
        assert.strictEqual(out.managerId, null);
    });

    it('passes through extra keys without rejecting', () => {
        const out = updateEmployeeSchema.parse({ fullName: 'Ada', extra: 1 });
        assert.strictEqual(out.extra, 1);
    });
});

describe('sendInvitationSchema', () => {
    it('accepts a valid email with no role/department', () => {
        const out = sendInvitationSchema.parse({ email: 'new.hire@example.com' });
        assert.strictEqual(out.email, 'new.hire@example.com');
    });

    it('accepts an explicit role and department', () => {
        const out = sendInvitationSchema.parse({ email: 'a@b.co', role: 'admin', departmentId: 'd1' });
        assert.strictEqual(out.role, 'admin');
    });

    it('rejects a malformed email (mirrors service regex)', () => {
        assert.throws(() => sendInvitationSchema.parse({ email: 'not-an-email' }));
    });

    it('rejects a missing email (service requires it)', () => {
        assert.throws(() => sendInvitationSchema.parse({ role: 'member' }));
    });

    it('rejects an over-length email (> 254 chars, mirrors service guard)', () => {
        const longLocal = 'a'.repeat(250);
        assert.throws(() => sendInvitationSchema.parse({ email: `${longLocal}@x.co` }));
    });
});
