'use strict';
const v = require('../validators/bounty');

const report = {
    taskId: '8608d706-671d-4797-a275-9d460c1d4f42', title: 'Login bypass',
    description: 'Send payload X to the login endpoint and observe the Y response each time.',
};

describe('bounty validators', () => {
    it('requires a real description and valid evidence links', () => {
        expect(v.reportSchema.safeParse({ ...report, description: 'too short' }).success).toBe(false);
        expect(v.reportSchema.safeParse({ ...report, evidenceLinks: ['not a url'] }).success).toBe(false);
        expect(v.reportSchema.parse(report).evidenceLinks).toEqual([]);
    });

    it('rejects non-uuid task ids', () => {
        expect(v.reportSchema.safeParse({ ...report, taskId: '1' }).success).toBe(false);
    });

    it('forces an explanation for rejected/duplicate and a payout note for paid', () => {
        expect(v.reviewReportSchema.safeParse({ status: 'rejected' }).success).toBe(false);
        expect(v.reviewReportSchema.safeParse({ status: 'duplicate', reviewerNote: 'Same as #12' }).success).toBe(true);
        expect(v.reviewReportSchema.safeParse({ status: 'paid' }).success).toBe(false);
        expect(v.reviewReportSchema.safeParse({ status: 'paid', rewardNote: 'USDT sent 4 Oct' }).success).toBe(false);
        const payout = { method: 'usdt', amount: '150', currency: 'usdt', reference: '0xabc123' };
        const ok = v.reviewReportSchema.safeParse({ status: 'paid', payout });
        expect(ok.success).toBe(true);
        expect(ok.data.payout.currency).toBe('USDT');
        expect(ok.data.payout.amount).toBe(150);
        expect(v.reviewReportSchema.safeParse({ status: 'accepted' }).success).toBe(true);
    });

    it('rejects incomplete or misplaced payout records', () => {
        const base = { method: 'btc', amount: 50, currency: 'BTC', reference: 'tx1234' };
        expect(v.reviewReportSchema.safeParse({ status: 'paid', payout: { ...base, reference: 'x' } }).success).toBe(false);
        expect(v.reviewReportSchema.safeParse({ status: 'paid', payout: { ...base, amount: 0 } }).success).toBe(false);
        expect(v.reviewReportSchema.safeParse({ status: 'paid', payout: { ...base, method: 'cash' } }).success).toBe(false);
        expect(v.reviewReportSchema.safeParse({ status: 'accepted', payout: base }).success).toBe(false);
    });

    it('does not let a review reset a report to submitted', () => {
        expect(v.reviewReportSchema.safeParse({ status: 'submitted' }).success).toBe(false);
    });

    it('rejects empty and oversized chat messages', () => {
        expect(v.messageSchema.safeParse({ content: '   ' }).success).toBe(false);
        expect(v.messageSchema.safeParse({ content: 'x'.repeat(4001) }).success).toBe(false);
        expect(v.messageSchema.safeParse({ content: 'hello' }).success).toBe(true);
    });

    it('requires at least one field to update a task', () => {
        expect(v.updateTaskSchema.safeParse({}).success).toBe(false);
        expect(v.updateTaskSchema.safeParse({ status: 'open' }).success).toBe(true);
    });
});
