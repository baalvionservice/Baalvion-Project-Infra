'use strict';
const db = require('../models');
const visibility = require('../domain/visibility');
const consent = require('../domain/consent');
const notificationService = require('./notificationService');
const { badRequest, notFound, forbidden, conflict } = require('../utils/errors');

/**
 * Invite someone to a case as a participant.
 *
 * The invitee must already be a CanWeMarry account: there is no email invitation and no
 * way to add a person by name. Adding someone who has not signed up would mean recording
 * an identity for a person who never agreed to be on the platform, which is the exact
 * thing the schema is shaped to prevent.
 */
async function invite(ctx, caseId, { userId, relation }) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.isOwner(ctx, row)) throw forbidden('Only the person who opened a case can invite participants.');
    if (relation === consent.RELATION.SELF) throw badRequest('SELF is reserved for the case owner.');
    if (userId === ctx.actor.userId) throw badRequest('You are already a participant in your own case.');

    const invitee = await db.User.findByPk(userId);
    if (!invitee) throw notFound('User');

    const existing = await db.CaseParticipant.findOne({ where: { case_id: caseId, user_id: userId } });
    if (existing) {
        // A declined or withdrawn answer is final. Allowing a re-invite would turn the
        // consent model into something a determined case owner could wear down by repetition.
        if (existing.consent_status === consent.CONSENT.INVITED) throw conflict('That person has already been invited.');
        throw conflict('That person has already answered an invitation to this case.');
    }

    const created = await db.CaseParticipant.create({
        case_id: caseId,
        user_id: userId,
        relation,
        consent_status: consent.CONSENT.INVITED,
        invited_by: ctx.actor.userId,
    });

    await notificationService.create({
        userId,
        type: 'case.participant.invited',
        title: 'You have been invited to a case',
        body: 'Someone has asked you to take part in a support case. You can accept or decline.',
        link: `/cases/${caseId}`,
    });

    return serialize(created, ctx.actor.userId);
}

/**
 * Answer an invitation. Only the invitee can call this — see domain/consent.canRespond.
 * There is deliberately no administrative override.
 */
async function respond(ctx, caseId, participantId, decision) {
    const row = await db.CaseParticipant.findOne({ where: { id: participantId, case_id: caseId } });
    if (!row) throw notFound('Invitation');
    if (!consent.canRespond(ctx.actor.userId, row)) throw forbidden('Only the person invited can answer an invitation.');
    if (!consent.canTransition(row.consent_status, decision)) {
        throw conflict(`An invitation that is ${row.consent_status} cannot become ${decision}.`);
    }

    await row.update({ consent_status: decision, responded_at: new Date() });

    const caseRow = await db.Case.findByPk(caseId);
    if (caseRow) {
        await notificationService.create({
            userId: caseRow.owner_id,
            type: `case.participant.${decision.toLowerCase()}`,
            title: decision === consent.CONSENT.GRANTED ? 'An invitation was accepted' : 'An invitation was answered',
            body: decision === consent.CONSENT.GRANTED
                ? 'Someone you invited has joined your case.'
                : 'Someone you invited has chosen not to take part.',
            link: `/cases/${caseId}`,
        });
    }

    return serialize(row, ctx.actor.userId);
}

/** Withdrawing consent is always available to a participant and takes effect at once. */
async function withdraw(ctx, caseId, participantId) {
    return respond(ctx, caseId, participantId, consent.CONSENT.WITHDRAWN);
}

async function listForCase(ctx, caseId) {
    const row = await db.Case.findByPk(caseId);
    if (!row) throw notFound('Case');
    const level = visibility.viewLevel(ctx, row);
    if (level === visibility.VIEW_LEVEL.NONE || level === visibility.VIEW_LEVEL.SUMMARY) throw notFound('Case');

    const rows = await db.CaseParticipant.findAll({ where: { case_id: caseId }, raw: true, order: [['created_at', 'ASC']] });
    return consent.visibleParticipants(rows, ctx.actor.userId);
}

/** Invitations addressed to the caller, across every case. */
async function listMyInvitations(ctx) {
    const rows = await db.CaseParticipant.findAll({
        where: { user_id: ctx.actor.userId, consent_status: consent.CONSENT.INVITED },
        order: [['created_at', 'DESC']],
    });
    return rows.map((r) => serialize(r, ctx.actor.userId));
}

const serialize = (r, viewerUserId) => consent.visibleParticipants([r.get ? r.get({ plain: true }) : r], viewerUserId)[0];

module.exports = { invite, respond, withdraw, listForCase, listMyInvitations };
