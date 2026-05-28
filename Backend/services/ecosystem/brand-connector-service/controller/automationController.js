'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

async function executeActions(actions, payload, orgId) {
    const results = [];
    for (const action of (actions || [])) {
        if (action.type === 'notify') {
            await db.Notification.create({
                user_id: payload.userId || 0,
                org_id: orgId,
                title: action.title || 'Automation triggered',
                message: action.message || JSON.stringify(payload),
                type: 'automation',
                read: false,
            });
            results.push({ action: 'notify', status: 'done' });
        } else if (action.type === 'update_lead_status' && payload.leadId) {
            await db.Lead.update({ status: action.status }, { where: { id: payload.leadId, org_id: orgId } });
            results.push({ action: 'update_lead_status', status: 'done' });
        } else if (action.type === 'create_deal' && payload.leadId) {
            const lead = await db.Lead.findByPk(payload.leadId);
            if (lead) {
                await db.Deal.create({
                    lead_id: lead.id,
                    company_name: lead.company_name,
                    value: action.value || 0,
                    stage: 'new',
                    source: 'automation',
                    org_id: orgId,
                });
                results.push({ action: 'create_deal', status: 'done' });
            }
        } else {
            results.push({ action: action.type, status: 'skipped' });
        }
    }
    return results;
}

function matchesConditions(conditions, payload) {
    if (!conditions || Object.keys(conditions).length === 0) return true;
    for (const [key, value] of Object.entries(conditions)) {
        if (payload[key] !== value) return false;
    }
    return true;
}

exports.listRules = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const p = paginate(page, limit);
        const { rows, count } = await db.AutomationRule.findAndCountAll({
            where: { org_id: req.user.orgId },
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.triggerEvent = async (req, res, next) => {
    try {
        const { event, payload } = req.body;
        if (!event) return next(new AppError('VALIDATION', 'event is required', 400));
        const rules = await db.AutomationRule.findAll({
            where: { org_id: req.user.orgId, event_trigger: event, is_active: true },
        });
        const triggered = [];
        for (const rule of rules) {
            if (matchesConditions(rule.conditions, payload || {})) {
                const results = await executeActions(rule.actions, { ...(payload || {}), userId: req.user.id }, req.user.orgId);
                triggered.push({ ruleId: rule.id, name: rule.name, actions: results });
            }
        }
        return sendSuccess(req, res, { event, rules_matched: triggered.length, triggered });
    } catch (err) { return next(err); }
};
