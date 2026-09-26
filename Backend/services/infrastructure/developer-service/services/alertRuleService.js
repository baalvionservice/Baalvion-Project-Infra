'use strict';

const db = require('../models');
const { randomToken, signWebhook } = require('./signing');
const { validateWebhookUrl } = require('../utils/safeUrl');
const { Errors } = require('../utils/errors');
const logger = require('../utils/logger');

const CONDITION_TYPES = ['keyword', 'category', 'country', 'sentiment', 'entity'];

function publicView(row) {
    const j = row.toJSON ? row.toJSON() : row;
    delete j.webhook_secret;
    return j;
}

async function create({ orgId, label, conditionType, conditionValue, webhookUrl, actorId }) {
    if (!CONDITION_TYPES.includes(conditionType)) {
        throw Errors.badRequest(`conditionType must be one of ${CONDITION_TYPES.join(', ')}`);
    }
    await validateWebhookUrl(webhookUrl);
    const row = await db.AlertRule.create({
        org_id: orgId, label, condition_type: conditionType, condition_value: conditionValue,
        webhook_url: webhookUrl, webhook_secret: `whsec_${randomToken(24)}`, created_by: actorId ?? null,
    });
    return publicView(row);
}

async function list(orgScope) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    const rows = await db.AlertRule.findAll({ where, order: [['created_at', 'DESC']] });
    return rows.map(publicView);
}

async function get(id, orgScope) {
    const row = await db.AlertRule.findByPk(id);
    if (!row) throw Errors.notFound('Alert rule not found');
    if (orgScope && row.org_id !== orgScope) throw Errors.forbidden('Rule belongs to another organization');
    return row;
}

async function update(id, patch, orgScope) {
    const row = await get(id, orgScope);
    const next = {};
    if (patch.label !== undefined) next.label = patch.label;
    if (patch.active !== undefined) next.active = Boolean(patch.active);
    if (patch.conditionValue !== undefined) next.condition_value = patch.conditionValue;
    if (patch.webhookUrl !== undefined) {
        await validateWebhookUrl(patch.webhookUrl);
        next.webhook_url = patch.webhookUrl;
    }
    next.updated_at = new Date();
    await row.update(next);
    return publicView(row);
}

async function remove(id, orgScope) {
    const row = await get(id, orgScope);
    await row.destroy();
    return { id, deleted: true };
}

function matches(rule, article) {
    const value = rule.condition_value.toLowerCase();
    switch (rule.condition_type) {
        case 'keyword':
            return (article.title || '').toLowerCase().includes(value);
        case 'category':
            return (article.category || '').toLowerCase() === value;
        case 'country':
            return (article.country || '').toLowerCase() === value;
        case 'sentiment':
            return (article.sentiment || '').toLowerCase() === value;
        case 'entity':
            return (article.entities || []).some((e) => (e?.name || '').toLowerCase() === value);
        default:
            return false;
    }
}

/** Called for each newly-enriched article (see controllers/alertController.js `evaluate`,
 *  hit internally by news-service's enrichment loop). Delivers a signed POST directly to
 *  each matching rule's webhook_url — fire-and-forget, logged on failure, no retry queue
 *  (unlike the generic webhook_endpoints/deliveries pipeline, which does retry). */
async function evaluateArticle(article) {
    const rules = await db.AlertRule.findAll({ where: { active: true } });
    const triggered = rules.filter((rule) => matches(rule, article));

    await Promise.all(
        triggered.map(async (rule) => {
            const body = JSON.stringify({
                eventType: 'alert.triggered',
                rule: { id: rule.id, label: rule.label, conditionType: rule.condition_type, conditionValue: rule.condition_value },
                article: {
                    title: article.title, category: article.category, country: article.country,
                    sentiment: article.sentiment, entities: article.entities, published_at: article.published_at,
                },
            });
            const { header } = signWebhook(rule.webhook_secret, body);
            try {
                const res = await fetch(rule.webhook_url, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'X-Baalvion-Signature': header },
                    body,
                    signal: AbortSignal.timeout(8000),
                });
                await rule.update({ last_triggered_at: new Date(), trigger_count: rule.trigger_count + 1 });
                if (!res.ok) logger.warn({ ruleId: rule.id, status: res.status }, '[alerts] webhook delivery non-2xx');
            } catch (err) {
                logger.warn({ ruleId: rule.id, err: err.message }, '[alerts] webhook delivery failed');
            }
        })
    );

    return { evaluated: rules.length, triggered: triggered.length };
}

module.exports = { CONDITION_TYPES, create, list, get, update, remove, evaluateArticle, publicView };
