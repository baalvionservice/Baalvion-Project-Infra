'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { acceptInvitationSchema } = require('../validators/invitationSchemas');
const { addMemberSchema } = require('../validators/websiteSchemas');

test('acceptInvitationSchema accepts a minimal valid author profile', () => {
    const r = acceptInvitationSchema.safeParse({ authorProfile: { name: 'Jane Writer', expertise: [] } });
    assert.equal(r.success, true);
    assert.equal(r.data.authorProfile.name, 'Jane Writer');
});

test('acceptInvitationSchema rejects a byline shorter than 2 characters', () => {
    const r = acceptInvitationSchema.safeParse({ authorProfile: { name: 'J', expertise: [] } });
    assert.equal(r.success, false);
});

test('acceptInvitationSchema rejects a missing authorProfile', () => {
    assert.equal(acceptInvitationSchema.safeParse({}).success, false);
});

test('acceptInvitationSchema defaults expertise to an empty array', () => {
    const r = acceptInvitationSchema.safeParse({ authorProfile: { name: 'Jane Writer' } });
    assert.equal(r.success, true);
    assert.deepEqual(r.data.authorProfile.expertise, []);
});

test('acceptInvitationSchema caps expertise at 8 tags', () => {
    const expertise = Array.from({ length: 9 }, (_, i) => `topic-${i}`);
    const r = acceptInvitationSchema.safeParse({ authorProfile: { name: 'Jane Writer', expertise } });
    assert.equal(r.success, false);
});

test('acceptInvitationSchema rejects a non-URL avatarUrl', () => {
    const r = acceptInvitationSchema.safeParse({
        authorProfile: { name: 'Jane Writer', expertise: [], avatarUrl: 'not-a-url' },
    });
    assert.equal(r.success, false);
});

test('acceptInvitationSchema accepts optional social links', () => {
    const r = acceptInvitationSchema.safeParse({
        authorProfile: { name: 'Jane Writer', expertise: [], social: { linkedin: 'linkedin.com/in/jane' } },
    });
    assert.equal(r.success, true);
    assert.equal(r.data.authorProfile.social.linkedin, 'linkedin.com/in/jane');
});

test('addMemberSchema accepts an email invite with a personal note', () => {
    const r = addMemberSchema.safeParse({ email: 'writer@example.com', role: 'cms_author', personalNote: 'Loved your last piece.' });
    assert.equal(r.success, true);
    assert.equal(r.data.personalNote, 'Loved your last piece.');
});

test('addMemberSchema rejects a personal note over 600 characters', () => {
    const r = addMemberSchema.safeParse({ email: 'writer@example.com', role: 'cms_author', personalNote: 'x'.repeat(601) });
    assert.equal(r.success, false);
});

test('addMemberSchema requires either an email or a userId', () => {
    const r = addMemberSchema.safeParse({ role: 'cms_author' });
    assert.equal(r.success, false);
});

test('addMemberSchema defaults role to cms_author', () => {
    const r = addMemberSchema.safeParse({ email: 'writer@example.com' });
    assert.equal(r.success, true);
    assert.equal(r.data.role, 'cms_author');
});
