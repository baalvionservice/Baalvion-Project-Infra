const { evaluate } = require('../utils/kycWindow');

describe('the 7 day identity check', () => {
    const now = Date.parse('2026-10-12T00:00:00Z');
    const day = 86400000;
    test('a new member has days left', () => {
        expect(evaluate({ now, deadlineAt: now + 7 * day, rowState: 'open', kycStatus: null })).toEqual({ state: 'open', daysLeft: 7 });
        expect(evaluate({ now, deadlineAt: now + 1000, rowState: 'open', kycStatus: null })).toEqual({ state: 'open', daysLeft: 1 });
    });
    test('the deadline passing blocks, and a blocked row stays blocked', () => {
        expect(evaluate({ now, deadlineAt: now - 1, rowState: 'open', kycStatus: null }).state).toBe('blocked');
        expect(evaluate({ now, deadlineAt: now + 5 * day, rowState: 'blocked', kycStatus: null }).state).toBe('blocked');
        expect(evaluate({ now, deadlineAt: now - day, rowState: 'open', kycStatus: 'rejected' }).state).toBe('blocked');
    });
    test('approved or submitted identity checks are never blocked, and staff are exempt', () => {
        expect(evaluate({ now, deadlineAt: now - day, rowState: 'blocked', kycStatus: 'approved' }).state).toBe('verified');
        expect(evaluate({ now, deadlineAt: now - day, rowState: 'blocked', kycStatus: 'submitted' }).state).toBe('under_review');
        expect(evaluate({ now, deadlineAt: now - day, rowState: 'blocked', kycStatus: null, exempt: true }).state).toBe('exempt');
    });
});
