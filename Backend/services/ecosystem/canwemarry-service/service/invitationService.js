'use strict';
const crypto = require('node:crypto');
const db = require('../models');
const visibility = require('../domain/visibility');
const consent = require('../domain/consent');
const notificationService = require('./notificationService');
const { notFound, forbidden, conflict, badRequest } = require('../utils/errors');

const STATUS = Object.freeze({ PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', DECLINED: 'DECLINED', REVOKED: 'REVOKED' });

// Crockford-style: no I, L, O or U, so a code read aloud or copied by hand does not come
// back with a character swapped. 16 characters over 32 symbols is 80 bits — well beyond
// guessing, and the lookup is rate-limited on top.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TOKEN_LENGTH = 16;

const DEFAULT_TTL_DAYS = 14;
const MAX_TTL_DAYS = 60;

function mintToken() {
    // `crypto.randomInt` rejection-samples, so every symbol is equally likely.
    //
    // The obvious `randomBytes(n)[i] % ALPHABET.length` is unbiased ONLY while the alphabet
    // length divides 256. That is true at 32 symbols, so the previous version was in fact
    // uniform — and one added or removed character away from quietly skewing every token
    // toward the front of the alphabet, which is not a defect anybody finds by reading.
    // This form does not care how long the alphabet is.
    let out = '';
    for (let i = 0; i < TOKEN_LENGTH; i += 1) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
    return out;
}

/**
 * Tokens are stored as a hash, never in the clear — the same reasoning as a password or an
 * API key. Someone who can read this table cannot use what they find to accept anything.
 * SHA-256 without a work factor is right here: the token is 80 bits of true randomness, so
 * there is no dictionary to slow down, and redemption must stay a single index probe.
 */
const hashToken = (token) => crypto.createHash('sha256').update(String(token).trim().toUpperCase()).digest('hex');

/** Create an invitation. Owner only, and it names a relation rather than a person. */
async function create(ctx, caseId, { relation, expiresInDays }) {
    const row = await db.Case.findByPk(caseId);
    if (!row || visibility.viewLevel(ctx, row) === visibility.VIEW_LEVEL.NONE) throw notFound('Case');
    if (!visibility.isOwner(ctx, row)) throw forbidden('Only the person who opened a case can invite someone to it.');
    if (relation === consent.RELATION.SELF) throw badRequest('SELF is reserved for the case owner.');

    const days = Math.min(Math.max(Number(expiresInDays) || DEFAULT_TTL_DAYS, 1), MAX_TTL_DAYS);
    const token = mintToken();

    const created = await db.CaseInvitation.create({
        case_id: caseId,
        token_hash: hashToken(token),
        relation,
        created_by: ctx.actor.userId,
        expires_at: new Date(Date.now() + days * 86_400_000),
    });

    // The only time the raw code exists outside the sharer's hands. It is never stored and
    // never returned again — a lost code is revoked and replaced, not recovered.
    return { ...serialize(created), token };
}

/**
 * What a holder of the code may see BEFORE deciding.
 *
 * Just enough to make an informed choice — that an invitation exists, the relation it names,
 * and whether it is still open. Deliberately no case title, no summary, no owner: the code
 * may have travelled further than the owner intended, and none of that should be readable by
 * whoever ends up holding it. The case itself becomes visible only after accepting.
 */
async function preview(token) {
    const row = await db.CaseInvitation.findOne({ where: { token_hash: hashToken(token) } });
    // A bad code and a revoked one answer identically, so the endpoint cannot be used to
    // discover which codes were ever real.
    if (!row) throw notFound('Invitation');

    return {
        relation: row.relation,
        status: effectiveStatus(row),
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    };
}

/** PENDING but past its expiry is EXPIRED, without needing a sweep job to relabel it. */
function effectiveStatus(row) {
    if (row.status === STATUS.PENDING && row.expires_at && row.expires_at.getTime() <= Date.now()) return 'EXPIRED';
    return row.status;
}

/**
 * Redeem a code. Requires a signed-in caller: accepting IS the act of consenting, so it has
 * to be an identifiable person doing it.
 */
async function accept(ctx, token) {
    const row = await db.CaseInvitation.findOne({ where: { token_hash: hashToken(token) } });
    if (!row) throw notFound('Invitation');

    const status = effectiveStatus(row);
    if (status === 'EXPIRED') throw conflict('This invitation has expired. Ask for a new one.');
    if (status === STATUS.REVOKED) throw conflict('This invitation has been withdrawn.');
    if (status !== STATUS.PENDING) throw conflict('This invitation has already been answered.');

    const caseRow = await db.Case.findByPk(row.case_id);
    if (!caseRow) throw notFound('Case');
    if (caseRow.owner_id === ctx.actor.userId) throw badRequest('You opened this case; you are already part of it.');

    const existing = await db.CaseParticipant.findOne({ where: { case_id: row.case_id, user_id: ctx.actor.userId } });
    if (existing && consent.isActive(existing.consent_status)) throw conflict('You are already taking part in this case.');
    if (existing) throw conflict('You have already answered an invitation to this case.');

    const participant = await db.sequelize.transaction(async (tx) => {
        // Accepting the code and granting consent are the same act, so the participant row
        // is created GRANTED rather than passing through INVITED — there is nothing left to
        // ask, and a pending row would misrepresent what happened.
        const created = await db.CaseParticipant.create({
            case_id: row.case_id,
            user_id: ctx.actor.userId,
            relation: row.relation,
            consent_status: consent.CONSENT.GRANTED,
            invited_by: row.created_by,
            responded_at: new Date(),
        }, { transaction: tx });

        await row.update({
            status: STATUS.ACCEPTED,
            accepted_by: ctx.actor.userId,
            responded_at: new Date(),
        }, { transaction: tx });

        return created;
    });

    await notificationService.create({
        userId: caseRow.owner_id,
        type: 'case.invitation.accepted',
        title: 'Someone accepted your invitation',
        body: 'A person you invited has joined your case.',
        link: `/cases/${row.case_id}`,
    });

    return { caseId: row.case_id, participantId: participant.id };
}

/** Declining is final, and tells the owner only that the invitation was answered. */
async function decline(ctx, token) {
    const row = await db.CaseInvitation.findOne({ where: { token_hash: hashToken(token) } });
    if (!row) throw notFound('Invitation');

    const status = effectiveStatus(row);
    if (status !== STATUS.PENDING) throw conflict('This invitation can no longer be answered.');

    await row.update({ status: STATUS.DECLINED, responded_at: new Date() });

    const caseRow = await db.Case.findByPk(row.case_id);
    if (caseRow) {
        await notificationService.create({
            userId: caseRow.owner_id,
            type: 'case.invitation.declined',
            title: 'An invitation was answered',
            body: 'Someone you invited has chosen not to take part.',
            link: `/cases/${row.case_id}`,
        });
    }
    return { declined: true };
}

/** Withdraw an unredeemed invitation. Owner only. */
async function revoke(ctx, caseId, invitationId) {
    const caseRow = await db.Case.findByPk(caseId);
    if (!caseRow) throw notFound('Case');
    if (!visibility.isOwner(ctx, caseRow)) throw forbidden('Only the person who opened a case can withdraw its invitations.');

    const row = await db.CaseInvitation.findOne({ where: { id: invitationId, case_id: caseId } });
    if (!row) throw notFound('Invitation');
    if (row.status === STATUS.ACCEPTED) {
        throw conflict('That invitation has already been accepted. Remove the participant instead.');
    }
    await row.update({ status: STATUS.REVOKED, responded_at: new Date() });
    return serialize(row);
}

/** The owner's view of a case's invitations. Never includes the token or who holds it. */
async function listForCase(ctx, caseId) {
    const caseRow = await db.Case.findByPk(caseId);
    if (!caseRow) throw notFound('Case');
    if (!visibility.isOwner(ctx, caseRow) && !visibility.isModerator(ctx)) {
        throw forbidden('Only the person who opened a case can see its invitations.');
    }
    const rows = await db.CaseInvitation.findAll({ where: { case_id: caseId }, order: [['created_at', 'DESC']] });
    return rows.map(serialize);
}

/** Every invitation the caller issued, across their cases. */
async function listMine(ctx) {
    const rows = await db.CaseInvitation.findAll({
        where: { created_by: ctx.actor.userId },
        order: [['created_at', 'DESC']],
        limit: 200,
    });
    return rows.map(serialize);
}

const serialize = (r) => ({
    id: r.id,
    caseId: r.case_id,
    relation: r.relation,
    status: effectiveStatus(r),
    // Whether it was taken up, never by whom — the owner learns that from the participant
    // list, which applies the consent rules.
    accepted: r.status === STATUS.ACCEPTED,
    expiresAt: r.expires_at,
    respondedAt: r.responded_at,
    createdAt: r.created_at,
});

module.exports = {
    create, preview, accept, decline, revoke, listForCase, listMine,
    STATUS, hashToken, mintToken, effectiveStatus,
};
