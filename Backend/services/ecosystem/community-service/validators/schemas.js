const { z } = require('zod');

const joinCommunitySchema = z.object({
    message: z.string().max(2000).optional(),
});

const createInviteSchema = z.object({
    invitedEmail: z.string().email().optional(),
});

const redeemInviteSchema = z.object({
    token: z.string().min(10),
});

const decideJoinRequestSchema = z.object({
    approve: z.boolean(),
});

const adminSetMemberSchema = z.object({
    role: z.enum(['member', 'moderator', 'admin']).optional(),
    status: z.enum(['invited', 'requested', 'approved', 'paid', 'rejected', 'banned', 'cancelled', 'expired']).optional(),
}).refine((d) => d.role || d.status, { message: 'role or status is required' });

const resolveFlagSchema = z.object({
    action: z.enum(['dismiss', 'remove']),
});

module.exports = {
    joinCommunitySchema,
    createInviteSchema,
    redeemInviteSchema,
    decideJoinRequestSchema,
    adminSetMemberSchema,
    resolveFlagSchema,
};
