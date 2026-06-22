const { z } = require('zod');
const { ORG_TYPES, MEMBERSHIP_ROLES, ORG_STATUSES } = require('../utils/orgConstants');

// The 7-tier membership model — replaces the legacy ['admin','member','viewer'] set everywhere.
const roleEnum = z.enum(MEMBERSHIP_ROLES);
const orgTypeEnum = z.enum(ORG_TYPES);
const orgStatusEnum = z.enum(ORG_STATUSES);

// Loose E.164-ish phone: optional leading +, then 7–19 digits/spaces/dashes/parens.
const phoneSchema = z.string().trim().min(8).max(20).regex(/^\+?[0-9][0-9\s\-()]{6,18}$/, 'Invalid phone number');

const register = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    fullName: z.string().max(200).optional(),
    orgName: z.string().max(200).optional(),
    // Public self-service account type — drives the new org's type (buyer is the default).
    accountType: z.enum(['buyer', 'seller']).optional(),
    // Optional phone captured at signup; verified later via the phone OTP flow.
    phone: phoneSchema.optional(),
});

// Phone verification (OTP). request: target number optional (falls back to the stored phone).
const phoneOtpRequest = z.object({ phone: phoneSchema.optional() });
const phoneOtpVerify = z.object({ code: z.string().trim().regex(/^[0-9]{4,8}$/, 'Code must be 4–8 digits') });

// Passwordless email-OTP login (public). request needs only the email; verify needs email + code.
const emailOtpRequest = z.object({ email: z.string().email() });
const emailOtpVerify = z.object({
    email: z.string().email(),
    code:  z.string().trim().regex(/^[0-9]{4,8}$/, 'Code must be 4–8 digits'),
});

const login = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const forgotPassword = z.object({ email: z.string().email() });

const resetPassword = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
});

const verifyEmail = z.object({ token: z.string().min(1) });

const updateMe = z.object({
    fullName: z.string().max(200).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
});

const mfaVerify     = z.object({ code: z.string().length(6) });
const mfaChallenge  = z.object({
    challengeToken: z.string().min(1),
    code:           z.string().length(6),
});
const mfaEnrollStart = z.object({ challengeToken: z.string().min(1) });
const mfaEnroll      = z.object({
    challengeToken: z.string().min(1),
    code:           z.string().length(6),
});

const createOrg = z.object({ name: z.string().min(2).max(200) });

const inviteMember = z.object({
    email: z.string().email(),
    role: roleEnum.default('viewer'),
    fullName: z.string().max(200).optional(),
});

const bulkInvite = z.object({
    invites: z.array(z.object({
        email: z.string().email(),
        role: roleEnum.default('viewer'),
        fullName: z.string().max(200).optional(),
    })).min(1).max(500),
});

const updateMemberRole = z.object({
    role: roleEnum.optional(),
    serviceRoles: z.record(z.string()).optional(),
});

const acceptInvite = z.object({
    token: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    fullName: z.string().max(200).optional(),
});

const transferOwnership = z.object({
    newOwnerUserId: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

// ── Platform-owner organization administration ──────────────────────────────────
const platformCreateOrg = z.object({
    name: z.string().min(2).max(200),
    type: orgTypeEnum,
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/i).optional(),
    legalName: z.string().max(255).optional(),
    displayName: z.string().max(255).optional(),
    country: z.string().length(2).optional(),
    jurisdiction: z.string().max(120).optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().max(40).optional(),
    status: orgStatusEnum.default('active'),
    // Optionally seed the first owner by inviting them in the same call.
    ownerEmail: z.string().email().optional(),
    ownerFullName: z.string().max(200).optional(),
});

const updateOrg = z.object({
    name: z.string().min(2).max(200).optional(),
    legalName: z.string().max(255).optional(),
    displayName: z.string().max(255).optional(),
    country: z.string().length(2).optional(),
    jurisdiction: z.string().max(120).optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().max(40).optional(),
    plan: z.string().max(50).optional(),
});

const setOrgStatus = z.object({ status: orgStatusEnum });

module.exports = {
    register, login, forgotPassword, resetPassword, verifyEmail, updateMe, mfaVerify, mfaChallenge,
    mfaEnrollStart, mfaEnroll, phoneOtpRequest, phoneOtpVerify, emailOtpRequest, emailOtpVerify,
    createOrg, inviteMember, bulkInvite, updateMemberRole, acceptInvite, transferOwnership,
    platformCreateOrg, updateOrg, setOrgStatus,
};
