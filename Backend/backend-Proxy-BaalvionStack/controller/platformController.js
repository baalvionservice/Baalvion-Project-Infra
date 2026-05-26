const proxyService = require('../service/proxyService');
const analyticsService = require('../service/analyticsService');
const billingService = require('../service/billingService');
const notificationService = require('../service/notificationService');
const store = require('../service/platformStore');
const sessionStore = require('../service/sessionStore');
const emailService = require('../utils/emailService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const inviteStore = require('../utils/inviteStore');

const wrap = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

const orgId = (req) => req.auth.orgId;

module.exports = {
    listProxies: wrap(async (req, res) => sendPaginated(req, res, await proxyService.listProxies(req.auth, req.query))),
    getProxy: wrap(async (req, res) => sendSuccess(req, res, await proxyService.getProxy(req.auth, req.params.id))),
    createProxy: wrap(async (req, res) => sendSuccess(req, res, await proxyService.createProxy(req.auth, req.body), 201)),
    updateProxy: wrap(async (req, res) => sendSuccess(req, res, await proxyService.updateProxy(req.auth, req.params.id, req.body))),
    deleteProxy: wrap(async (req, res) => { await proxyService.deleteProxy(req.auth, req.params.id); sendSuccess(req, res, null, 200); }),
    rotateProxy: wrap(async (req, res) => sendSuccess(req, res, await proxyService.rotateProxy(req.auth, req.params.id))),
    getProxyLogs: wrap(async (req, res) => sendPaginated(req, res, await proxyService.getProxyLogs(req.auth, req.params.id, req.query))),
    testProxy: wrap(async (req, res) => sendSuccess(req, res, await proxyService.testProxy(req.auth, req.body))),
    exportProxies: wrap(async (req, res) => sendSuccess(req, res, await proxyService.exportProxies())),

    listPresets: wrap(async (req, res) => sendSuccess(req, res, await proxyService.listPresets(req.auth))),
    createPreset: wrap(async (req, res) => sendSuccess(req, res, await proxyService.createPreset(req.auth, req.body), 201)),
    updatePreset: wrap(async (req, res) => sendSuccess(req, res, await proxyService.updatePreset(req.auth, req.params.id, req.body))),
    deletePreset: wrap(async (req, res) => { await proxyService.deletePreset(req.auth, req.params.id); sendSuccess(req, res, null, 200); }),

    getUsageSummary: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getUsageSummary(req.auth))),
    getUsageHistory: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.listUsageHistory(req.auth, req.query.days || 30))),
    getRealtimeUsage: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getRealtimeUsage(req.auth))),
    getProjectedOverage: wrap(async (req, res) => sendSuccess(req, res, await require('../service/billingEngine').projectOverage(req.auth.organizationId))),

    // Server-Sent Events: live usage pushed to the dashboard from real counters.
    streamUsage: (req, res) => {
        res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.flushHeaders?.();
        const meteringMetrics = require('../observability/meteringMetrics');
        meteringMetrics.incWs();
        let alive = true;
        const tick = async () => {
            if (!alive) return;
            try {
                const data = await analyticsService.getRealtimeUsage(req.auth);
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (_) { /* keep stream open */ }
        };
        tick();
        const iv = setInterval(tick, Number(process.env.USAGE_SSE_INTERVAL_MS || 3000));
        req.on('close', () => { alive = false; clearInterval(iv); meteringMetrics.decWs(); res.end(); });
    },
    getBandwidth: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getBandwidthSeries(req.auth))),
    getSuccessRate: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getSuccessRateSeries(req.auth))),
    getTopCountries: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getTopCountries(req.auth))),
    getTopDomains: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getTopDomains(req.auth))),
    getLatencyDistribution: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getLatencyDistribution(req.auth))),
    getAnomalies: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getAnomalies(req.auth))),
    exportAnalytics: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.exportAnalytics(req.auth))),

    getSubscription: wrap(async (req, res) => sendSuccess(req, res, await billingService.getSubscription(req.auth))),
    getPlans: wrap(async (req, res) => sendSuccess(req, res, await billingService.getPlans())),
    getInvoices: wrap(async (req, res) => sendSuccess(req, res, await billingService.getInvoices(req.auth))),
    getInvoice: wrap(async (req, res) => sendSuccess(req, res, await billingService.getInvoice(req.auth, req.params.id))),
    changePlan: wrap(async (req, res) => sendSuccess(req, res, await billingService.changePlan(req.auth, req.body.planSlug))),
    getPaymentMethods: wrap(async (req, res) => sendSuccess(req, res, await billingService.getPaymentMethods(req.auth))),
    addPaymentMethod: wrap(async (req, res) => sendSuccess(req, res, await billingService.addPaymentMethod(req.auth, req.body), 201)),
    deletePaymentMethod: wrap(async (req, res) => { await billingService.removePaymentMethod(req.auth, req.params.id); sendSuccess(req, res, null, 200); }),
    getUsageForecast: wrap(async (req, res) => sendSuccess(req, res, await billingService.getUsageForecast(req.auth))),
    billingWebhook: wrap(async (req, res) => sendSuccess(req, res, await billingService.handleWebhook(req.body))),

    getOrganization: wrap(async (req, res) => sendSuccess(req, res, await store.getById('organizations', orgId(req)))),
    updateOrganization: wrap(async (req, res) => sendSuccess(req, res, await store.update('organizations', orgId(req), req.body))),
    listOrgMembers: wrap(async (req, res) => {
        const currentOrgId = orgId(req);
        const memberships = await store.getCollection('orgMemberships', currentOrgId);

        // Enrich each membership with the user's email and name
        const enriched = await Promise.all(memberships.map(async (m) => {
            if (!m.userId) return m;
            const user = await store.getById('users', m.userId);
            return {
                ...m,
                email: user?.email || null,
                name: user?.name || user?.email?.split('@')[0] || null,
            };
        }));

        // Append still-pending invites (email not yet registered)
        const pending = inviteStore.pendingInvites
            .filter(i => i.orgId === currentOrgId && new Date(i.expiresAt) > new Date())
            .map(i => ({
                id: i.id,
                orgId: i.orgId,
                userId: null,
                role: i.role,
                email: i.email,
                name: i.name,
                status: 'pending',
                createdAt: i.createdAt,
            }));

        sendSuccess(req, res, [...enriched, ...pending]);
    }),

    inviteOrgMember: wrap(async (req, res) => {
        const { email, role = 'viewer', name } = req.body;
        const currentOrgId = orgId(req);
        const appUrl = process.env.APP_URL || 'http://localhost:8080';

        // Check if user already exists in the system
        const existingUser = await store.findUserByEmail(email);
        let member;
        let inviteUrl;

        if (existingUser) {
            // Check not already a member
            const allMembers = await store.getCollection('orgMemberships', currentOrgId);
            if (allMembers.find(m => String(m.userId) === String(existingUser.id))) {
                throw new AppError('ALREADY_MEMBER', 'This user is already a member of the organization', 409);
            }
            member = await store.insert('orgMemberships', {
                orgId: currentOrgId,
                userId: existingUser.id,
                role,
                invitedBy: req.auth.id,
                status: 'active',
            });
            member = { ...member, email: existingUser.email, name: existingUser.name, status: 'active' };
            inviteUrl = `${appUrl}/login`;
        } else {
            // User doesn't exist yet — create a pending invite token
            const token = uuidv4();
            const invite = {
                id: `inv_${token.slice(0, 8)}`,
                token,
                email,
                name: name || email.split('@')[0],
                orgId: currentOrgId,
                role,
                invitedBy: req.auth.id,
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString(),
            };
            // Remove any existing pending invite for the same email+org
            const existing = inviteStore.pendingInvites.findIndex(i => i.email === email && i.orgId === currentOrgId);
            if (existing !== -1) inviteStore.pendingInvites.splice(existing, 1);
            inviteStore.pendingInvites.push(invite);

            member = {
                id: invite.id, orgId: currentOrgId, userId: null,
                role, email, name: invite.name, status: 'pending', createdAt: invite.createdAt,
            };
            inviteUrl = `${appUrl}/accept-invite?inviteToken=${token}&email=${encodeURIComponent(email)}`;
        }

        // Send invitation email
        try {
            const org = await store.getById('organizations', currentOrgId);
            const inviter = await store.findUserByEmail(req.auth.email);
            const result = await emailService.sendInvitationEmail({
                toEmail: email,
                toName: name || email.split('@')[0],
                inviterName: inviter?.name || req.auth.email,
                orgName: org?.name || 'Baalvion NetStack',
                role,
                inviteUrl,
            });
            member.emailPreviewUrl = result.previewUrl || undefined;
        } catch (emailErr) {
            console.error('[Invite] Email send failed (non-fatal):', emailErr.message);
        }

        sendSuccess(req, res, member, 201);
    }),

    updateOrgMemberRole: wrap(async (req, res) => {
        const currentOrgId = orgId(req);
        const { id } = req.params;

        // Check if it's a pending invite
        const pendingIdx = inviteStore.pendingInvites.findIndex(i => i.id === id && i.orgId === currentOrgId);
        if (pendingIdx !== -1) {
            inviteStore.pendingInvites[pendingIdx].role = req.body.role;
            const i = inviteStore.pendingInvites[pendingIdx];
            return sendSuccess(req, res, {
                id: i.id, orgId: i.orgId, userId: null,
                role: i.role, email: i.email, name: i.name,
                status: 'pending', createdAt: i.createdAt,
            });
        }

        const membership = await store.update('orgMemberships', id, { role: req.body.role }, currentOrgId);
        if (!membership) throw new AppError('MEMBERSHIP_NOT_FOUND', 'Membership not found', 404);

        const user = membership.userId ? await store.getById('users', membership.userId) : null;
        sendSuccess(req, res, {
            ...membership,
            email: user?.email || null,
            name: user?.name || user?.email?.split('@')[0] || null,
        });
    }),

    deleteOrgMember: wrap(async (req, res) => {
        const currentOrgId = orgId(req);
        const { id } = req.params;

        // Check if it's a pending invite
        const pendingIdx = inviteStore.pendingInvites.findIndex(i => i.id === id && i.orgId === currentOrgId);
        if (pendingIdx !== -1) {
            inviteStore.pendingInvites.splice(pendingIdx, 1);
            return sendSuccess(req, res, null, 200);
        }
        await store.remove('orgMemberships', id, currentOrgId);
        sendSuccess(req, res, null, 200);
    }),

    listRoles: wrap(async (req, res) => sendSuccess(req, res, [
        { key: 'admin', label: 'Admin', description: 'Full access except billing', permissions: ['proxy:view', 'proxy:create', 'proxy:delete', 'dashboard:view', 'analytics:view', 'org:member:view'] },
        { key: 'developer', label: 'Developer', description: 'API keys & proxies', permissions: ['proxy:view', 'proxy:create', 'dashboard:view', 'analytics:view'] },
        { key: 'viewer', label: 'Viewer', description: 'Read-only access', permissions: ['proxy:view', 'dashboard:view'] },
    ])),
    getActivity: wrap(async (req, res) => sendSuccess(req, res, await store.getCollection('auditLogs', orgId(req)))),

    listApiKeys: wrap(async (req, res) => sendSuccess(req, res, await store.getCollection('apiKeys', orgId(req)))),
    createApiKey: wrap(async (req, res) => sendSuccess(req, res, await store.createApiKey({ orgId: orgId(req), name: req.body.name, createdBy: req.auth.userId, scopes: req.body.scopes, expiresAt: req.body.expiresAt || null, keyType: req.body.keyType }), 201)),
    deleteApiKey: wrap(async (req, res) => { await store.update('apiKeys', req.params.id, { revokedAt: new Date().toISOString(), status: 'revoked' }, orgId(req)); await store.remove('apiKeys', req.params.id, orgId(req)); sendSuccess(req, res, null, 200); }),
    revokeApiKey: wrap(async (req, res) => { await store.update('apiKeys', req.params.id, { revokedAt: new Date().toISOString(), status: 'revoked' }, orgId(req)); sendSuccess(req, res, null, 200); }),

    listSessions: wrap(async (req, res) => sendSuccess(req, res, await sessionStore.listSessions(req.auth.userId))),
    deleteSession: wrap(async (req, res) => { const ok = await sessionStore.revokeSessionForOrg(req.params.id, orgId(req)); if (!ok) throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404); sendSuccess(req, res, null, 200); }),
    getLoginHistory: wrap(async (req, res) => sendSuccess(req, res, await store.getCollection('loginHistory', orgId(req)))),
    getIpAllowlist: wrap(async (req, res) => sendSuccess(req, res, (await store.getById('organizations', orgId(req)))?.ipAllowlist || [])),
    addIpAllowlist: wrap(async (req, res) => {
        const organization = await store.getById('organizations', orgId(req));
        const ipAllowlist = Array.from(new Set([...(organization?.ipAllowlist || []), req.body.ip]));
        await store.update('organizations', orgId(req), { ipAllowlist });
        sendSuccess(req, res, ipAllowlist);
    }),
    deleteIpAllowlist: wrap(async (req, res) => {
        const organization = await store.getById('organizations', orgId(req));
        const ipAllowlist = (organization?.ipAllowlist || []).filter((item) => item !== req.params.ip);
        await store.update('organizations', orgId(req), { ipAllowlist });
        sendSuccess(req, res, ipAllowlist);
    }),

    listNotifications: wrap(async (req, res) => sendSuccess(req, res, await notificationService.listNotifications(req.auth))),
    markNotificationRead: wrap(async (req, res) => { await notificationService.markRead(req.auth, req.params.id); sendSuccess(req, res, null, 200); }),
    markAllNotificationsRead: wrap(async (req, res) => { await notificationService.markAllRead(req.auth); sendSuccess(req, res, null, 200); }),

    listAuditLogs: wrap(async (req, res) => sendPaginated(req, res, store.paginate(await store.getCollection('auditLogs', orgId(req)), req.query.page, req.query.pageSize))),
    exportAuditLogs: wrap(async (req, res) => sendSuccess(req, res, { downloadUrl: '/downloads/audit-logs.csv' })),

    listTickets: wrap(async (req, res) => sendSuccess(req, res, await store.getCollection('supportTickets', orgId(req)))),
    createTicket: wrap(async (req, res) => sendSuccess(req, res, await store.insert('supportTickets', { orgId: orgId(req), ...req.body, status: 'open', createdAt: new Date().toISOString() }), 201)),
    getTicket: wrap(async (req, res) => {
        const ticket = await store.getById('supportTickets', req.params.id, orgId(req));
        if (!ticket) {
            throw new AppError('TICKET_NOT_FOUND', 'Ticket not found', 404);
        }
        const messages = (await store.getCollection('ticketMessages', orgId(req))).filter((item) => item.ticketId === ticket.id);
        sendSuccess(req, res, { ...ticket, messages });
    }),
    replyTicket: wrap(async (req, res) => sendSuccess(req, res, await store.insert('ticketMessages', { orgId: orgId(req), ticketId: req.params.id, authorUserId: req.auth.userId, message: req.body.message, createdAt: new Date().toISOString() }), 201)),
    closeTicket: wrap(async (req, res) => sendSuccess(req, res, await store.update('supportTickets', req.params.id, { status: 'closed' }, orgId(req)))),

    getDashboardSummary: wrap(async (req, res) => sendSuccess(req, res, await analyticsService.getDashboardSummary(req.auth))),
    exportUsageLogs: wrap(async (req, res) => sendSuccess(req, res, { downloadUrl: '/downloads/usage-logs.csv', expiresAt: new Date(Date.now() + 3600000).toISOString() })),
    exportApiLogs: wrap(async (req, res) => sendSuccess(req, res, { downloadUrl: '/downloads/api-logs.csv', expiresAt: new Date(Date.now() + 3600000).toISOString() })),
    exportAccountData: wrap(async (req, res) => sendSuccess(req, res, { downloadUrl: '/downloads/account-data.json', expiresAt: new Date(Date.now() + 3600000).toISOString() })),
    deleteAccount: wrap(async (req, res) => sendSuccess(req, res, { requestId: `acctdel_${Date.now()}`, estimatedCompletion: '72h' })),
    evaluateFeatureFlags: wrap(async (req, res) => {
        const flags = await store.getCollection('featureFlags');
        const planSlug = req.query.planSlug || (await store.getById('organizations', req.query.orgId || orgId(req)))?.planSlug;
        const evaluated = flags.reduce((accumulator, flag) => {
            accumulator[flag.key] = flag.defaultValue && (!flag.plans || flag.plans.includes(planSlug));
            return accumulator;
        }, {});
        sendSuccess(req, res, evaluated);
    }),
};