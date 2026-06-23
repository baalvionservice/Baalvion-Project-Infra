'use strict';
/**
 * Zod schemas for the highest-risk staff (HR) mutation routes.
 *
 * These MIRROR the manual checks already enforced inside service/staffService.js
 * and are deliberately PERMISSIVE — they must never reject an input the service
 * currently accepts:
 *
 *   - createDepartment: service requires a non-empty `name`; headId/parentId are
 *     optional and may be null. Everything else passes through.
 *   - updateEmployee:   service COALESCEs every column, so every field is optional.
 *   - sendInvitation:   service requires a syntactically valid email (same regex,
 *     <= 254 chars); role/departmentId/teamId are optional.
 *
 * `.passthrough()` keeps any extra keys the service tolerates today untouched.
 */
const { z } = require('zod');

// Matches the exact email check in staffService.sendInvitation (length + regex),
// so validation is no stricter than the current runtime behaviour.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Optional id-like field: accepts a string or null/undefined (UUIDs are passed
// straight to parameterised SQL, so we only enforce "string-or-null" shape here).
const optionalId = z.string().nullish();
const optionalText = z.string().nullish();

// POST /v1/staff/departments
const createDepartmentSchema = z
    .object({
        name: z.string().trim().min(1, 'name is required'),
        headId: optionalId,
        parentId: optionalId,
    })
    .passthrough();

// PATCH /v1/staff/employees/:id  — all fields optional (service uses COALESCE)
const updateEmployeeSchema = z
    .object({
        fullName: optionalText,
        title: optionalText,
        departmentId: optionalId,
        teamId: optionalId,
        managerId: optionalId,
        status: optionalText,
        role: optionalText,
        location: optionalText,
        timezone: optionalText,
    })
    .passthrough();

// POST /v1/staff/invitations
const sendInvitationSchema = z
    .object({
        email: z
            .string()
            .max(254, 'A valid email is required')
            .regex(EMAIL_RE, 'A valid email is required'),
        role: optionalText,
        departmentId: optionalId,
        teamId: optionalId,
    })
    .passthrough();

module.exports = {
    EMAIL_RE,
    createDepartmentSchema,
    updateEmployeeSchema,
    sendInvitationSchema,
};
