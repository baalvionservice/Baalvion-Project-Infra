'use strict';
const v = require('../validators/gigs');

const profile = {
    fullName: 'Test Person', gender: 'Female', age: 24, instagram: '@test.person', zone: 'Juhu',
    roles: ['Paid Party Hostess'], whatsapp: '+91 98000 00002',
};

describe('gigs validators', () => {
    it('enforces the 21+ rule and requires a role', () => {
        expect(v.profileSchema.safeParse({ ...profile, age: 20 }).success).toBe(false);
        expect(v.profileSchema.safeParse({ ...profile, roles: [] }).success).toBe(false);
        expect(v.profileSchema.safeParse(profile).success).toBe(true);
    });

    it('normalises the instagram handle and rejects junk', () => {
        expect(v.profileSchema.parse(profile).instagram).toBe('test.person');
        expect(v.profileSchema.safeParse({ ...profile, instagram: 'not a handle!' }).success).toBe(false);
    });

    it('treats blank optional photo links as absent but rejects non-urls', () => {
        expect(v.profileSchema.parse({ ...profile, portraitUrl: '' }).portraitUrl).toBeUndefined();
        expect(v.profileSchema.safeParse({ ...profile, portraitUrl: 'nope' }).success).toBe(false);
    });

    it('requires a reason to reject but not to verify', () => {
        expect(v.reviewSchema.safeParse({ status: 'rejected' }).success).toBe(false);
        expect(v.reviewSchema.safeParse({ status: 'rejected', note: 'Fake account' }).success).toBe(true);
        expect(v.reviewSchema.safeParse({ status: 'verified' }).success).toBe(true);
    });

    it('validates gig fields and caps pay', () => {
        const gig = { title: 'Hosts needed', payAmount: '3000', payCycle: 'Weekly', venueAddress: 'Somewhere, Mumbai', rolesNeeded: ['x'], eventDate: '2031-01-01' };
        expect(v.gigSchema.parse(gig).payAmount).toBe(3000);
        expect(v.gigSchema.safeParse({ ...gig, payAmount: 99999999 }).success).toBe(false);
        expect(v.gigSchema.safeParse({ ...gig, eventDate: 'tomorrow' }).success).toBe(false);
    });

    it('does not let employers set the admin-only removed status', () => {
        expect(v.gigStatusSchema.safeParse({ status: 'removed' }).success).toBe(false);
        expect(v.adminGigStatusSchema.safeParse({ status: 'removed' }).success).toBe(true);
    });
});
