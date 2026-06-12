'use strict';
/**
 * War Room 3 — ledger write authorization.
 *
 * The ledger is the accounting system of record. Two classes of caller may WRITE
 * (post / reverse) entries:
 *
 *   1. Trusted internal services (authenticated via X-Internal-Key → req.user.isService).
 *      e.g. order-service / payment-service posting the journal pair for a settled
 *      payment. These are pre-authorized — blocking them would break legitimate
 *      double-entry posting.
 *   2. Human operators holding a finance/admin role. Viewer/member/editor and any
 *      other low-privilege role may READ the ledger but never post or reverse.
 *
 * Reversals are the highest-risk operation (they move balances); they are gated by
 * the same writer requirement plus immutable audit at the controller.
 */
const MONEY_ROLES = new Set(['admin', 'owner', 'super_admin', 'finance_officer', 'compliance_officer', 'finance']);

function callerRoles(req) {
    return ((req.user && req.user.roles) || []).map((r) => String(r).toLowerCase());
}

function requireLedgerWriter(req, res, next) {
    // Trusted system-of-record poster (internal key) — pre-authorized.
    if (req.user && req.user.isService) return next();
    const roles = callerRoles(req);
    if (roles.some((r) => MONEY_ROLES.has(r))) return next();
    return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Ledger write requires a finance or admin role',
    });
}

module.exports = { requireLedgerWriter, MONEY_ROLES };
