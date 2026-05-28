'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

exports.campaignAnalytics = async (req, res, next) => {
    try {
        const { id } = req.params;
        const campaign = await db.Campaign.findOne({ where: { id, org_id: req.user.orgId } });
        if (!campaign) return next(new AppError('NOT_FOUND', 'Campaign not found', 404));
        const [appCount, partnerCount] = await Promise.all([
            db.CampaignApplication.count({ where: { campaign_id: id } }),
            db.Partnership.count({ where: { campaign_id: id } }),
        ]);
        return sendSuccess(req, res, {
            campaign,
            applications: appCount,
            partnerships: partnerCount,
            views: campaign.views_count || 0,
            conversion_rate: appCount > 0 ? Math.round((partnerCount / appCount) * 100) : 0,
        });
    } catch (err) { return next(err); }
};

exports.creatorAnalytics = async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        const campaign = await db.Campaign.findOne({ where: { id: campaignId, org_id: req.user.orgId } });
        if (!campaign) return next(new AppError('NOT_FOUND', 'Campaign not found', 404));
        const partnerships = await db.Partnership.findAll({
            where: { campaign_id: campaignId },
            include: [{ model: db.InfluencerProfile, as: 'influencer' }],
        });
        const creatorsData = partnerships.map((p) => ({
            partnership_id: p.id,
            creator: p.influencer,
            status: p.status,
            deliverables_count: 0,
        }));
        return sendSuccess(req, res, { campaignId, creators: creatorsData });
    } catch (err) { return next(err); }
};

exports.overviewAnalytics = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [
            totalLeads, totalDeals, totalProposals, totalPayments,
            totalCampaigns, totalOutreachCampaigns, activePartnerships,
        ] = await Promise.all([
            db.Lead.count({ where: { org_id: orgId } }),
            db.Deal.count({ where: { org_id: orgId } }),
            db.Proposal.count({ where: { org_id: orgId } }),
            db.Payment.count({ where: { org_id: orgId } }),
            db.Campaign.count({ where: { org_id: orgId } }),
            db.OutreachCampaign.count({ where: { org_id: orgId } }),
            db.Partnership.count({ where: { org_id: orgId } }),
        ]);

        const revenueResult = await db.Payment.findOne({
            where: { org_id: orgId, status: { [Op.in]: ['paid', 'escrow', 'released'] } },
            attributes: [[fn('SUM', col('amount')), 'total']],
        });
        const totalRevenue = Number((revenueResult && revenueResult.getDataValue('total')) || 0);

        const leadsThisMonth = await db.Lead.count({
            where: {
                org_id: orgId,
                created_at: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
        });

        const dealsWon = await db.Deal.count({ where: { org_id: orgId, stage: 'closed_won' } });
        const dealsClosed = await db.Deal.count({
            where: { org_id: orgId, stage: { [Op.in]: ['closed_won', 'closed_lost'] } },
        });
        const winRate = dealsClosed > 0 ? Math.round((dealsWon / dealsClosed) * 100) : 0;

        return sendSuccess(req, res, {
            leads: { total: totalLeads, this_month: leadsThisMonth },
            deals: { total: totalDeals, won: dealsWon, win_rate: winRate },
            proposals: { total: totalProposals },
            payments: { total: totalPayments, revenue: totalRevenue },
            campaigns: { total: totalCampaigns, outreach: totalOutreachCampaigns },
            partnerships: { active: activePartnerships },
        });
    } catch (err) { return next(err); }
};
