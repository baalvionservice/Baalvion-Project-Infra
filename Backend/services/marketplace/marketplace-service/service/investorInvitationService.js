'use strict';
// Admin-triggered investor invitations — distinct from the self-serve onboarding flow
// in investorService (a prospect applies with KYC/AML already in motion). An invitation
// is a lightweight pre-application record: staff send a link, the invitee lands on the
// public onboarding form with the token attached, and accepting it associates the new
// Investor row back to this invitation.
const crypto = require('crypto');
const db = require('../models');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { sendMailSafe } = require('../utils/mailer');

const SORTABLE = ['created_at', 'updated_at', 'email', 'status'];
const INVITE_TTL_DAYS = 14;

function shape(row) {
    const r = row.toJSON ? row.toJSON() : row;
    return {
        id: r.id,
        email: r.email,
        investorType: r.investor_type,
        note: r.note,
        status: r.status,
        invitedBy: r.invited_by_name || '',
        expiresAt: r.expires_at,
        acceptedAt: r.accepted_at,
        createdAt: r.created_at,
    };
}

async function listInvitations({ orgId, isPlatform, query }) {
    const { order, limit, offset, page } = parseListQuery(query, { sortable: SORTABLE });
    const where = isPlatform ? {} : { org_id: orgId };
    if (query.status) where.status = query.status;
    const { count, rows } = await db.InvestorInvitation.findAndCountAll({ where, order, limit, offset });
    return paginate({ rows: rows.map(shape), count, page, limit });
}

async function sendInvitation({ orgId, data, invitedBy = {} }) {
    const { email, investorType = 'angel', note } = data;

    const dupe = await db.InvestorInvitation.findOne({
        where: { org_id: orgId, email: email.toLowerCase(), status: 'pending' },
    });
    if (dupe) throw new AppError('CONFLICT', 'A pending invitation already exists for this email', 409);

    const inviterName = invitedBy.name || invitedBy.email || 'The Baalvion Invest team';
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const row = await db.InvestorInvitation.create({
        org_id: orgId,
        email: email.toLowerCase(),
        investor_type: investorType,
        note: note || null,
        token,
        invited_by: invitedBy.id || null,
        invited_by_name: inviterName,
        expires_at: expiresAt,
    });

    const onboardUrl = `${config.appUrl}/invest/onboarding?invite=${token}`;
    const mail = await sendMailSafe({
        to: email,
        subject: `You're invited to join Baalvion Invest`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
            <h2>You're invited to become an investor</h2>
            <p>${inviterName} has invited you to explore investment opportunities on Baalvion Invest as a${
                investorType === 'angel' || investorType === 'institutional' ? 'n' : ''
            } <b>${investorType.replace(/_/g, ' ')}</b> investor.</p>
            ${note ? `<p style="color:#444">"${note}"</p>` : ''}
            <p><a href="${onboardUrl}" style="background:#0f4c81;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Start onboarding</a></p>
            <p style="color:#666;font-size:13px">Or use this link: ${onboardUrl}<br/>This invitation expires in ${INVITE_TTL_DAYS} days. Onboarding includes standard KYC/AML and accreditation checks.</p>
        </div>`,
    });

    return { ...shape(row), emailDelivered: mail.delivered, onboardUrl };
}

async function revokeInvitation({ orgId, isPlatform, id }) {
    const row = await db.InvestorInvitation.findByPk(id);
    if (!row || (!isPlatform && row.org_id !== orgId)) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (row.status !== 'pending') throw new AppError('CONFLICT', `Invitation already ${row.status}`, 409);
    await row.update({ status: 'revoked' });
    return { id: row.id, status: 'revoked' };
}

/** Called from investorService.create when the onboarding submission carries an invite token. */
async function redeemInvitation(token) {
    if (!token) return null;
    const row = await db.InvestorInvitation.findOne({ where: { token, status: 'pending' } });
    if (!row || row.expires_at < new Date()) return null;
    await row.update({ status: 'accepted', accepted_at: new Date() });
    return row;
}

module.exports = { listInvitations, sendInvitation, revokeInvitation, redeemInvitation };
