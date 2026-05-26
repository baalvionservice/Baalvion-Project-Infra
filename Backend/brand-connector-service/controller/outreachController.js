'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const REPLY_TEMPLATES = [
    'Hi, thanks for reaching out! We would love to learn more.',
    'Interesting proposal. Can you share more details?',
    'We are currently looking for partnerships. Let us schedule a call.',
    'Thanks! Our team will review and get back soon.',
    'Love the idea! What are the deliverables?',
];

exports.listOutreachCampaigns = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = { org_id: req.user.orgId };
        if (status) where.status = status;
        const p = paginate(page, limit);
        const { rows, count } = await db.OutreachCampaign.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.getOutreachCampaign = async (req, res, next) => {
    try {
        const campaign = await db.OutreachCampaign.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
        });
        if (!campaign) return next(new AppError('NOT_FOUND', 'Outreach campaign not found', 404));
        return sendSuccess(req, res, campaign);
    } catch (err) { return next(err); }
};

exports.createOutreachCampaign = async (req, res, next) => {
    try {
        const { name, type, message_template, subject } = req.body;
        if (!name) return next(new AppError('VALIDATION', 'name is required', 400));
        const campaign = await db.OutreachCampaign.create({
            name, type: type || 'email', message_template, subject,
            status: 'draft', total_leads: 0, sent_count: 0, reply_count: 0,
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, campaign, 201);
    } catch (err) { return next(err); }
};

exports.listMessages = async (req, res, next) => {
    try {
        const { campaignId, page = 1, limit = 20 } = req.query;
        const where = {};
        if (campaignId) where.campaign_id = campaignId;
        const p = paginate(page, limit);
        const { rows, count } = await db.OutreachMessage.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.sendCampaign = async (req, res, next) => {
    try {
        const { campaignId } = req.body;
        if (!campaignId) return next(new AppError('VALIDATION', 'campaignId is required', 400));
        const campaign = await db.OutreachCampaign.findOne({ where: { id: campaignId, org_id: req.user.orgId } });
        if (!campaign) return next(new AppError('NOT_FOUND', 'Outreach campaign not found', 404));
        const leads = await db.Lead.findAll({ where: { org_id: req.user.orgId }, limit: 20 });
        const messages = await Promise.all(leads.map((lead) =>
            db.OutreachMessage.create({
                lead_id: lead.id,
                lead_name: lead.company_name,
                campaign_id: campaign.id,
                subject: campaign.subject || 'Partnership Opportunity',
                message: campaign.message_template || 'Hi, we would love to partner with you!',
                status: 'sent',
                sent_at: new Date(),
            })
        ));
        await campaign.update({ status: 'running', total_leads: leads.length, sent_count: messages.length });
        return sendSuccess(req, res, { sent: messages.length, campaign });
    } catch (err) { return next(err); }
};

exports.simulateReplies = async (req, res, next) => {
    try {
        const { campaignId } = req.body;
        if (!campaignId) return next(new AppError('VALIDATION', 'campaignId is required', 400));
        const campaign = await db.OutreachCampaign.findOne({ where: { id: campaignId, org_id: req.user.orgId } });
        if (!campaign) return next(new AppError('NOT_FOUND', 'Outreach campaign not found', 404));
        const messages = await db.OutreachMessage.findAll({
            where: { campaign_id: campaignId, status: 'sent' },
            limit: 5,
        });
        let repliedCount = 0;
        for (const msg of messages) {
            if (Math.random() > 0.4) {
                const replyText = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];
                await msg.update({ status: 'replied', reply_text: replyText, is_interested: Math.random() > 0.5 });
                repliedCount++;
            }
        }
        await campaign.update({ reply_count: campaign.reply_count + repliedCount });
        return sendSuccess(req, res, { simulated: messages.length, replied: repliedCount });
    } catch (err) { return next(err); }
};

exports.sendFollowUp = async (req, res, next) => {
    try {
        const { messageId } = req.body;
        if (!messageId) return next(new AppError('VALIDATION', 'messageId is required', 400));
        const original = await db.OutreachMessage.findByPk(messageId);
        if (!original) return next(new AppError('NOT_FOUND', 'Message not found', 404));
        const followUp = await db.OutreachMessage.create({
            lead_id: original.lead_id,
            lead_name: original.lead_name,
            campaign_id: original.campaign_id,
            subject: `Follow-up: ${original.subject || 'Partnership Opportunity'}`,
            message: `Just following up on our previous message. We would love to hear from you!`,
            status: 'sent',
            sent_at: new Date(),
        });
        return sendSuccess(req, res, followUp, 201);
    } catch (err) { return next(err); }
};
