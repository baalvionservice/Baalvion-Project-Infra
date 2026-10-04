'use strict';
// Records what staff do on /admin routes. Mounted with router.use('/admin', auditAdmin), it hooks the
// response 'finish' event, so it sees the final status and the authenticated actor. It logs:
//   - every successful write (POST/PATCH/PUT/DELETE),
//   - reads of sensitive material (identity documents),
//   - denied attempts (403) by an authenticated user, as a warning.
// It never logs request bodies, only a short human summary built from non-sensitive fields, and it
// can never fail or slow the request (inserted after the response is sent, errors swallowed).
const db = require('../models');
const { decodeEmailFromRequest } = require('./authMiddleware');

const short = (id) => (id ? String(id).slice(0, 8) : '');

// [method, route pattern, severity, summary builder]
const RULES = [
    ['GET', '/admin/kyc/:id/documents/:kind', 'critical', (r) => `Opened ${r.params.kind === 'id' ? 'ID document' : 'selfie'} of KYC case ${short(r.params.id)}`],
    ['PATCH', '/admin/kyc/:id', 'critical', (r) => `${r.body && r.body.status === 'approved' ? 'Approved' : 'Rejected'} KYC case ${short(r.params.id)}`],
    ['PUT', '/admin/staff/:userId', 'critical', (r) => `Granted ${r.body && r.body.tier} access to ${short(r.params.userId)}`],
    ['DELETE', '/admin/staff/:userId', 'critical', (r) => `Removed staff access of ${short(r.params.userId)}`],
    ['PATCH', '/admin/nightlife/bookings/:id', 'info', (r) => `Set booking ${short(r.params.id)} to ${r.body && r.body.status}`],
    ['PATCH', '/admin/nightlife/applications/:id', 'info', (r) => `Set application ${short(r.params.id)} to ${r.body && r.body.status}`],
    ['POST', '/admin/nightlife/clubs', 'info', () => 'Created a club'],
    ['PATCH', '/admin/nightlife/clubs/:id', 'info', (r) => (r.body && r.body.status === 'archived' ? `Archived club ${short(r.params.id)}` : `Edited club ${short(r.params.id)}`)],
    ['POST', '/admin/nightlife/events', 'info', () => 'Created an event'],
    ['PATCH', '/admin/nightlife/events/:id', 'info', (r) => (r.body && r.body.status === 'cancelled' ? `Cancelled event ${short(r.params.id)}` : `Edited event ${short(r.params.id)}`)],
    ['POST', '/admin/nightlife/locals', 'info', () => 'Posted a Locals listing'],
    ['PATCH', '/admin/nightlife/locals/:id', 'info', (r) => `Edited Locals listing ${short(r.params.id)}${r.body && r.body.status ? ` (now ${r.body.status})` : ''}`],
    ['PATCH', '/admin/nightlife/profiles/:id', 'warning', (r) => `${r.body && r.body.status === 'verified' ? 'Verified' : 'Rejected'} candidate profile ${short(r.params.id)}`],
    ['PATCH', '/admin/nightlife/employers/:id', 'warning', (r) => `${r.body && r.body.status === 'verified' ? 'Verified' : 'Rejected'} employer ${short(r.params.id)}`],
    ['PATCH', '/admin/nightlife/gigs/:id', 'warning', (r) => `Set gig ${short(r.params.id)} to ${r.body && r.body.status}`],
    ['POST', '/admin/bounty/tasks', 'info', () => 'Created a bounty task'],
    ['PATCH', '/admin/bounty/tasks/:id', 'warning', (r) => `Edited bounty task ${short(r.params.id)}${r.body && r.body.status ? ` (now ${r.body.status})` : ''}`],
    ['PATCH', '/admin/bounty/reports/:id', 'warning', (r) => `Marked bounty report ${short(r.params.id)} ${r.body && r.body.status}`],
    ['POST', '/admin/bounty/threads/:id', 'info', (r) => `Replied in bounty chat ${short(r.params.id)}`],
    ['PATCH', '/admin/edu/teachers/:id', 'warning', (r) => `Set teacher ${short(r.params.id)} to ${r.body && r.body.status}`],
    ['POST', '/admin/edu/sessions/:id/cancel', 'warning', (r) => `Cancelled education session ${short(r.params.id)}`],
    ['PATCH', '/admin/support/tickets/:id', 'info', (r) => `Updated support ticket ${short(r.params.id)}`],
    ['POST', '/admin/support/tickets/:id/messages', 'info', (r) => `Replied to support ticket ${short(r.params.id)}`],
    ['POST', '/admin/announcements', 'warning', () => 'Created an announcement'],
    ['PATCH', '/admin/announcements/:id', 'warning', (r) => `Changed announcement ${short(r.params.id)}${r.body && r.body.status ? ` (now ${r.body.status})` : ''}`],
    ['POST', '/admin/notify', 'info', (r) => `Sent a ${r.body && r.body.type} notification to ${short(r.body && r.body.userId)}`],
];

const lookup = new Map(RULES.map(([m, route, sev, fn]) => [`${m} ${route}`, { sev, fn }]));

function auditAdmin(req, res, next) {
    res.on('finish', () => {
        try {
            const actorId = req.auth && req.auth.userId;
            if (!actorId) return;
            const route = req.route && req.route.path;
            const key = `${req.method} ${route}`;
            const rule = lookup.get(key);
            const denied = res.statusCode === 403;
            const isWrite = req.method !== 'GET' && req.method !== 'HEAD' && res.statusCode < 400;
            const sensitiveRead = req.method === 'GET' && rule && res.statusCode < 400;
            if (!denied && !isWrite && !sensitiveRead) return;

            const email = decodeEmailFromRequest(req);
            const summary = denied
                ? `Denied: ${req.method} ${route || req.path}`
                : (rule ? rule.fn(req) : `${req.method} ${route || req.path}`);
            db.AuditEvent.create({
                actor_id: actorId,
                actor_label: email ? email.slice(0, 160) : null,
                actor_tier: req.staffTier || null,
                action: String(key).slice(0, 120),
                summary: String(summary).slice(0, 300),
                target_id: (req.params && (req.params.id || req.params.userId)) ? String(req.params.id || req.params.userId).slice(0, 80) : null,
                severity: denied ? 'warning' : (rule ? rule.sev : 'info'),
                ip: req.ip ? String(req.ip).slice(0, 64) : null,
                status_code: res.statusCode,
            }).catch(() => {});
        } catch { /* auditing must never affect the request */ }
    });
    next();
}

module.exports = { auditAdmin, RULES };
