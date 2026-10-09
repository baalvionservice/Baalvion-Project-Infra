'use strict';
const v = require('../validators/edu');

const teacher = {
    displayName: 'Tea Cher', subject: 'Mixology', regionId: 'sas', country: 'India',
    bio: 'Ten years behind the bar teaching cocktail technique to beginners.',
};

describe('education validators', () => {
    it('requires a real bio and applies defaults', () => {
        expect(v.teacherSchema.safeParse({ ...teacher, bio: 'short' }).success).toBe(false);
        const ok = v.teacherSchema.parse(teacher);
        expect(ok.tags).toEqual([]);
        expect(ok.skills).toEqual([]);
    });

    it('treats a blank avatar link as absent and rejects non-urls', () => {
        expect(v.teacherSchema.parse({ ...teacher, avatarUrl: '' }).avatarUrl).toBeUndefined();
        expect(v.teacherSchema.safeParse({ ...teacher, avatarUrl: 'nope' }).success).toBe(false);
    });

    it('only accepts https meeting links and sane durations', () => {
        const s = { title: 'Intro class', startAt: '2031-01-01T10:00:00Z', durationMin: 60, capacity: 10, meetingUrl: 'https://meet.example.com/x' };
        expect(v.sessionSchema.safeParse(s).success).toBe(true);
        expect(v.sessionSchema.safeParse({ ...s, meetingUrl: 'http://meet.example.com/x' }).success).toBe(false);
        expect(v.sessionSchema.safeParse({ ...s, meetingUrl: 'javascript:alert(1)' }).success).toBe(false);
        expect(v.sessionSchema.safeParse({ ...s, durationMin: 5 }).success).toBe(false);
        expect(v.sessionSchema.safeParse({ ...s, startAt: 'tomorrow' }).success).toBe(false);
    });

    it('requires a reason when rejecting or suspending a teacher', () => {
        expect(v.reviewTeacherSchema.safeParse({ status: 'active' }).success).toBe(true);
        expect(v.reviewTeacherSchema.safeParse({ status: 'rejected' }).success).toBe(false);
        expect(v.reviewTeacherSchema.safeParse({ status: 'suspended', note: 'Spam' }).success).toBe(true);
    });

    it('limits enrollment decisions and review ratings', () => {
        expect(v.enrollmentDecisionSchema.safeParse({ status: 'approved' }).success).toBe(true);
        expect(v.enrollmentDecisionSchema.safeParse({ status: 'cancelled' }).success).toBe(false);
        expect(v.reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
        expect(v.reviewSchema.parse({ rating: '4' }).rating).toBe(4);
    });
});
