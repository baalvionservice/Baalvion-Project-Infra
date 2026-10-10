'use strict';
const v = require('../validators/nightlife');
const { slugify } = require('../utils/slug');

const guest = { firstName: 'A', lastName: 'B', email: 'a@b.co', phone: '+91 98765 43210', visitDate: '2030-01-01' };

describe('nightlife validators', () => {
    it('requires at least one guest on a guest list', () => {
        expect(v.guestListSchema.safeParse({ ...guest, males: 0, females: 0 }).success).toBe(false);
        expect(v.guestListSchema.safeParse({ ...guest, males: 1, females: 0 }).success).toBe(true);
    });

    it('rejects malformed phone, email and date', () => {
        expect(v.guestListSchema.safeParse({ ...guest, males: 1, females: 0, phone: 'abc' }).success).toBe(false);
        expect(v.guestListSchema.safeParse({ ...guest, males: 1, females: 0, email: 'nope' }).success).toBe(false);
        expect(v.guestListSchema.safeParse({ ...guest, males: 1, females: 0, visitDate: '01/01/2030' }).success).toBe(false);
    });

    it('coerces VIP group size from form strings and caps it', () => {
        expect(v.vipTableSchema.safeParse({ ...guest, groupSize: '6' }).data.groupSize).toBe(6);
        expect(v.vipTableSchema.safeParse({ ...guest, groupSize: '500' }).success).toBe(false);
    });

    it('rejects empty club updates and bad image urls', () => {
        expect(v.updateClubSchema.safeParse({}).success).toBe(false);
        expect(v.createClubSchema.safeParse({ name: 'X Club', state: 'Goa', city: 'Goa', image: 'not-a-url' }).success).toBe(false);
    });

    it('only allows reviewer statuses on applications', () => {
        expect(v.applicationStatusSchema.safeParse({ status: 'accepted' }).success).toBe(true);
        expect(v.applicationStatusSchema.safeParse({ status: 'withdrawn' }).success).toBe(false);
    });
});

describe('slugify', () => {
    it('produces stable url-safe slugs', () => {
        expect(slugify("R' Adda-Mumbai")).toBe('r-adda-mumbai');
        expect(slugify('Bastian - At The Top-Mumbai')).toBe('bastian-at-the-top-mumbai');
    });
});

describe('events and VIP packages', () => {
    const club = '4d7db75e-7e89-4902-b0d8-cef51187d1b8';

    it('validates event input', () => {
        const ev = { clubId: club, eventName: 'Saturday Night', eventDate: '2031-02-01', tag: 'BUY TICKETS' };
        expect(v.createEventSchema.safeParse(ev).success).toBe(true);
        expect(v.createEventSchema.safeParse({ ...ev, tag: 'MAYBE' }).success).toBe(false);
        expect(v.createEventSchema.safeParse({ ...ev, clubId: 'x' }).success).toBe(false);
        expect(v.createEventSchema.safeParse({ ...ev, ticketUrl: 'nope' }).success).toBe(false);
        expect(v.updateEventSchema.safeParse({}).success).toBe(false);
    });

    it('accepts VIP packages with defaults and rejects bad ones', () => {
        const base = { name: 'Toy Room', state: 'Maharashtra', city: 'Mumbai' };
        const ok = v.createClubSchema.parse({ ...base, vipPackages: [{ name: 'Gold', minimumSpend: '₹50,000' }] });
        expect(ok.vipPackages[0]).toMatchObject({ perks: [], popular: false });
        expect(v.createClubSchema.safeParse({ ...base, vipPackages: [{ name: 'Gold' }] }).success).toBe(false);
        expect(v.createClubSchema.safeParse({ ...base, vipPackages: new Array(9).fill({ name: 'Gold', minimumSpend: '1' }) }).success).toBe(false);
    });
});

describe('link safety across validators', () => {
    const evil = ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:x', 'file:///etc/passwd'];
    const bountyV = require('../validators/bounty');
    const gigsV = require('../validators/gigs');
    const eduV = require('../validators/edu');

    it('rejects non-http(s) schemes everywhere a link can reach an admin anchor', () => {
        for (const u of evil) {
            expect(bountyV.reportSchema.safeParse({ taskId: '8608d706-671d-4797-a275-9d460c1d4f42', title: 'Login bug', description: 'x'.repeat(40), evidenceLinks: [u] }).success).toBe(false);
            expect(v.createClubSchema.safeParse({ name: 'X Club', state: 'Goa', city: 'Goa', image: u }).success).toBe(false);
            expect(v.createEventSchema.safeParse({ clubId: '4d7db75e-7e89-4902-b0d8-cef51187d1b8', eventName: 'Night', eventDate: '2031-01-01', tag: 'BUY TICKETS', ticketUrl: u }).success).toBe(false);
            expect(v.applyListingSchema.safeParse({ fullName: 'A B', phone: '+919876543210', details: { introVideoLink: u } }).success).toBe(false);
            expect(gigsV.employerSchema.safeParse({ businessName: 'Biz Co', contactName: 'Con Tact', phone: '+919876543210', city: 'Mumbai', website: u }).success).toBe(false);
            expect(eduV.teacherSchema.safeParse({ displayName: 'Tea Cher', subject: 'Math', bio: 'x'.repeat(30), regionId: 'sas', country: 'India', avatarUrl: u }).success).toBe(false);
        }
    });

    it('still accepts normal http(s) links', () => {
        expect(bountyV.reportSchema.safeParse({ taskId: '8608d706-671d-4797-a275-9d460c1d4f42', title: 'Login bug', description: 'x'.repeat(40), evidenceLinks: ['https://example.com/a.png', 'http://example.com/b'] }).success).toBe(true);
    });
});

describe('apply form payloads as the real form sends them', () => {
    it('accepts blank optional fields (video link, height, instagram) instead of rejecting them', () => {
        const r = v.applyListingSchema.safeParse({
            fullName: 'Flow Tester', phone: '+91 98765 00000',
            details: { age: '25', gender: '', country: 'India', state: 'Maharashtra', city: 'Mumbai', height: '', instagram: '', introVideoLink: '' },
        });
        expect(r.success).toBe(true);
        expect(r.data.details.introVideoLink).toBeUndefined();
    });
});

describe('staff/support validators', () => {
    const sv = require('../validators/staffSupport');
    it('keeps admin notification buttons on this site', () => {
        const base = { userId: '71717171-7171-4717-8717-717171717171', type: 'seller', title: 'Approved', body: 'Your store is live.' };
        expect(sv.notifySchema.safeParse({ ...base, url: '/seller/listings' }).success).toBe(true);
        for (const u of ['https://evil.com/x', '//evil.com', 'javascript:alert(1)']) expect(sv.notifySchema.safeParse({ ...base, url: u }).success).toBe(false);
        expect(sv.notifySchema.safeParse({ ...base, userId: 'nope' }).success).toBe(false);
    });
    it('only lets announcements link to site paths or https', () => {
        const base = { title: 'Heads up', body: 'Something', severity: 'info' };
        expect(sv.announcementCreateSchema.safeParse({ ...base, linkUrl: '/support' }).success).toBe(true);
        expect(sv.announcementCreateSchema.safeParse({ ...base, linkUrl: 'https://example.com' }).success).toBe(true);
        for (const u of ['http://example.com', 'javascript:alert(1)', '//evil.com']) expect(sv.announcementCreateSchema.safeParse({ ...base, linkUrl: u }).success).toBe(false);
    });
    it('never allows granting super and requires a label', () => {
        expect(sv.staffGrantSchema.safeParse({ tier: 'super', label: 'Boss man' }).success).toBe(false);
        expect(sv.staffGrantSchema.safeParse({ tier: 'moderator', label: 'x' }).success).toBe(false);
        expect(sv.staffGrantSchema.safeParse({ tier: 'admin', label: 'Ann Admin' }).success).toBe(true);
    });
    it('validates tickets', () => {
        expect(sv.ticketCreateSchema.safeParse({ category: 'order', subject: 'Order is late', message: 'It has been two weeks already.' }).success).toBe(true);
        expect(sv.ticketCreateSchema.safeParse({ category: 'hacking', subject: 'Order is late', message: 'It has been two weeks already.' }).success).toBe(false);
        expect(sv.ticketStaffUpdateSchema.safeParse({}).success).toBe(false);
        expect(sv.ticketStaffUpdateSchema.safeParse({ assignedTo: 'someone-else' }).success).toBe(false);
    });
});
