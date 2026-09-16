'use strict';
const consent = require('../domain/consent');

const { CONSENT, RELATION, canTransition, canRespond, visibleParticipants, isActive } = consent;

const row = (over = {}) => ({
    id: 'p1',
    case_id: 'case-1',
    user_id: 'invitee-1',
    relation: RELATION.PARTNER,
    consent_status: CONSENT.INVITED,
    invited_at: '2026-01-01T00:00:00.000Z',
    responded_at: null,
    ...over,
});

describe('consent transitions', () => {
    test('an invitation can be accepted or declined', () => {
        expect(canTransition(CONSENT.INVITED, CONSENT.GRANTED)).toBe(true);
        expect(canTransition(CONSENT.INVITED, CONSENT.DECLINED)).toBe(true);
    });

    test('granted consent can be withdrawn at any point', () => {
        expect(canTransition(CONSENT.GRANTED, CONSENT.WITHDRAWN)).toBe(true);
    });

    test('a declined or withdrawn answer is final', () => {
        // Otherwise a case owner could re-ask until they got the answer they wanted.
        expect(canTransition(CONSENT.DECLINED, CONSENT.GRANTED)).toBe(false);
        expect(canTransition(CONSENT.WITHDRAWN, CONSENT.GRANTED)).toBe(false);
        expect(canTransition(CONSENT.DECLINED, CONSENT.INVITED)).toBe(false);
    });

    test('the owner cannot resign from their own case', () => {
        expect(canTransition(CONSENT.SELF, CONSENT.WITHDRAWN)).toBe(false);
    });
});

describe('who may answer an invitation', () => {
    test('only the person invited', () => {
        expect(canRespond('invitee-1', row())).toBe(true);
    });

    test('not the case owner, and not an administrator', () => {
        // Consent someone else can grant on your behalf is not consent. There is
        // deliberately no override path anywhere in the service.
        expect(canRespond('owner-1', row())).toBe(false);
        expect(canRespond('admin-1', row())).toBe(false);
        expect(canRespond(null, row())).toBe(false);
    });
});

describe('participant exposure', () => {
    test('an invitee who has not answered is not identified to anyone else', () => {
        const [view] = visibleParticipants([row()], 'owner-1');
        expect(view.userId).toBeNull();
        expect(view.relation).toBe(RELATION.PARTNER);
        expect(view.consentStatus).toBe(CONSENT.INVITED);
    });

    test('an invitee always sees their own row', () => {
        const [view] = visibleParticipants([row()], 'invitee-1');
        expect(view.userId).toBe('invitee-1');
        expect(view.isSelf).toBe(true);
    });

    test('a consenting participant is identified', () => {
        const [view] = visibleParticipants([row({ consent_status: CONSENT.GRANTED })], 'owner-1');
        expect(view.userId).toBe('invitee-1');
    });

    test('withdrawing consent removes the identity again', () => {
        const [view] = visibleParticipants([row({ consent_status: CONSENT.WITHDRAWN })], 'owner-1');
        expect(view.userId).toBeNull();
        expect(view.respondedAt).toBeNull();
    });

    test('a declined invitation is never identified', () => {
        const [view] = visibleParticipants([row({ consent_status: CONSENT.DECLINED })], 'owner-1');
        expect(view.userId).toBeNull();
    });

    test('the owner row is active by definition', () => {
        expect(isActive(CONSENT.SELF)).toBe(true);
        expect(isActive(CONSENT.GRANTED)).toBe(true);
        expect(isActive(CONSENT.INVITED)).toBe(false);
    });
});
