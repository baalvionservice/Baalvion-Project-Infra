'use strict';
const DAY = 24 * 60 * 60 * 1000;

// Where a member stands. Staff are exempt; approved or submitted (under review) KYC is never blocked; otherwise the
// deadline decides. Pure so it can be tested without a database.
function evaluate({ now = Date.now(), deadlineAt, rowState, kycStatus, exempt }) {
    if (exempt) return { state: 'exempt', daysLeft: null };
    if (kycStatus === 'approved') return { state: 'verified', daysLeft: null };
    if (kycStatus === 'submitted') return { state: 'under_review', daysLeft: null };
    const left = new Date(deadlineAt).getTime() - now;
    if (rowState === 'blocked' || left <= 0) return { state: 'blocked', daysLeft: 0 };
    return { state: 'open', daysLeft: Math.max(1, Math.ceil(left / DAY)) };
}

module.exports = { evaluate, DAY };
