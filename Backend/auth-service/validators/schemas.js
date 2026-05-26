const { z } = require('zod');

const register = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    fullName: z.string().max(200).optional(),
    orgName: z.string().max(200).optional(),
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

const createOrg = z.object({ name: z.string().min(2).max(200) });

const inviteMember = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const updateMemberRole = z.object({
    role: z.enum(['admin', 'member', 'viewer']).optional(),
    serviceRoles: z.record(z.string()).optional(),
});

const acceptInvite = z.object({
    token: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    fullName: z.string().max(200).optional(),
});

module.exports = { register, login, forgotPassword, resetPassword, verifyEmail, updateMe, mfaVerify, mfaChallenge, createOrg, inviteMember, updateMemberRole, acceptInvite };
