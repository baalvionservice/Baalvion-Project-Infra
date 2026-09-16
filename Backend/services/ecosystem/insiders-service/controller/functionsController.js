'use strict';
// Ports of the four Supabase Edge Functions to plain Express handlers.
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createNotification } = require('../utils/notify');

const SYSTEM_PROMPT = 'You are a helpful AI assistant for the Baalvion Insiders platform (for investors and founders). '
    + 'You help users understand how to use the platform, navigate features (forums, threads, elite applications, '
    + 'deals, marketplace, leaderboards, profiles), and get the most out of their membership. Be concise and friendly.';

// POST /functions/ai-chat  — provider-agnostic, OpenAI-compatible chat completion.
async function aiChat(req, res, next) {
    try {
        const { message, history = [] } = req.body || {};
        if (!message || typeof message !== 'string' || message.length > 4000) {
            throw new AppError('BAD_REQUEST', 'Invalid message', 400);
        }
        if (!config.ai.apiKey) {
            // No provider key configured — return a graceful stub so the UI works.
            return sendSuccess(req, res, {
                response: "The AI assistant isn't configured yet. Ask your admin to set AI_API_KEY in the "
                    + 'insiders-service environment. In the meantime: explore Forums to discuss strategy, '
                    + 'submit a Deal as a founder, or browse the Marketplace.',
                stub: true,
            });
        }
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(Array.isArray(history) ? history.slice(-10) : []),
            { role: 'user', content: message },
        ];
        const resp = await fetch(`${config.ai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${config.ai.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: config.ai.model, messages, max_tokens: 500 }),
        });
        if (!resp.ok) {
            const text = await resp.text();
            console.error('[ai-chat] provider error', resp.status, text);
            throw new AppError('AI_ERROR', `AI provider error: ${resp.status}`, 502);
        }
        const data = await resp.json();
        const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
        return sendSuccess(req, res, { response: answer });
    } catch (err) { return next(err); }
}

// POST /functions/scheduled-tag-report  (admin) — aggregates tag usage, persists
// a report, and notifies moderators. Mirrors the original edge function.
async function scheduledTagReport(req, res, next) {
    try {
        const now = new Date();
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const threadTags = await db.ThreadTag.findAll({ where: { created_at: { [Op.gte]: start } }, attributes: ['tag_id'] });
        const counts = {};
        threadTags.forEach((tt) => { counts[tt.tag_id] = (counts[tt.tag_id] || 0) + 1; });
        const tags = await db.Tag.findAll();
        const tagMap = new Map(tags.map((t) => [t.id, t]));
        const topTags = Object.entries(counts)
            .map(([tagId, count]) => ({ tag: tagMap.get(tagId)?.name || 'unknown', slug: tagMap.get(tagId)?.slug, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const report = {
            generated_at: now.toISOString(),
            period_start: start.toISOString(),
            period_end: now.toISOString(),
            total_tagged_threads: threadTags.length,
            top_tags: topTags,
        };
        await db.TagAnalyticsReport.create({
            report_type: 'weekly', period_start: start, period_end: now, report_data: report,
        });

        // Notify moderators + admins.
        const mods = await db.UserRole.findAll({ where: { role: { [Op.in]: ['moderator', 'admin'] } }, attributes: ['user_id'] });
        const uniq = [...new Set(mods.map((m) => m.user_id))];
        await Promise.all(uniq.map((uid) => createNotification({
            userId: uid, type: 'tag_report', title: 'Weekly tag report ready',
            message: `Top tag: ${topTags[0]?.tag || 'n/a'} (${threadTags.length} tagged threads this week)`, link: '/admin',
        })));

        return sendSuccess(req, res, { report, notifiedModerators: uniq.length });
    } catch (err) { return next(err); }
}

// POST /functions/update-report-schedule  (admin) — persists schedule settings.
async function updateReportSchedule(req, res, next) {
    try {
        const schedule = req.body || {};
        const [row, created] = await db.AppSetting.findOrCreate({
            where: { key: 'report_schedule' }, defaults: { key: 'report_schedule', value: schedule },
        });
        if (!created) await row.update({ value: schedule });
        return sendSuccess(req, res, { success: true, schedule });
    } catch (err) { return next(err); }
}

// POST /functions/send-notification  — create a notification (self, or any user if admin).
async function sendNotification(req, res, next) {
    try {
        const { user_id, type, title, message, link } = req.body || {};
        if (!user_id || !title || !message) throw new AppError('BAD_REQUEST', 'user_id, title, message required', 400);
        if (user_id !== req.auth.userId && !req.auth.roles.includes('admin')) {
            throw new AppError('FORBIDDEN', 'Not permitted', 403);
        }
        const id = await createNotification({ userId: user_id, type: type || 'system', title, message, link: link || null });
        return sendSuccess(req, res, { id });
    } catch (err) { return next(err); }
}

// POST /functions/checkout  — completes a (demo) membership payment for the caller.
// Replace the "mark active" block with a real Stripe charge/webhook when keys exist.
async function checkout(req, res, next) {
    // SUPERSEDED. This granted a full 365-day membership on request, with no charge and no
    // provider involved at all (payment_ref was literally `demo_<timestamp>`), so any
    // authenticated caller could take a paid tier for free. Membership is now granted ONLY by
    // billingService.fulfill, on payment-service's signed callback for a captured payment.
    return next(new AppError(
        'ENDPOINT_RETIRED',
        'This checkout endpoint has been retired. Use POST /v1/billing/checkout.',
        410,
    ));
}

// POST /functions/profile-score — recompute + persist the caller's profile/readiness score.
async function profileScore(req, res, next) {
    try {
        const founderId = (req.body?.founder_id && req.auth.roles.includes('admin')) ? req.body.founder_id : req.auth.userId;
        const profile = await db.Profile.findByPk(founderId);
        if (!profile) throw new AppError('NOT_FOUND', 'Profile not found', 404);
        const metrics = await db.TractionMetric.findAll({ where: { founder_id: founderId } });
        const verifs = await db.Verification.findAll({ where: { user_id: founderId, status: 'verified' } });
        const { computeScores } = require('../utils/score');
        const result = computeScores(profile.get({ plain: true }), metrics.map((m) => m.get({ plain: true })), verifs.map((v) => v.kind));
        await profile.update({ profile_score: result.profile_score, readiness_score: result.readiness_score });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
}

// POST /functions/ai-analyze — investor-grade brief (LLM if AI_API_KEY set, else heuristic).
async function aiAnalyze(req, res, next) {
    try {
        const founderId = req.body?.founder_id || req.auth.userId;
        const p = await db.Profile.findByPk(founderId);
        if (!p) throw new AppError('NOT_FOUND', 'Profile not found', 404);
        const metrics = await db.TractionMetric.findAll({ where: { founder_id: founderId }, order: [['as_of', 'DESC']] });
        const verifs = await db.Verification.findAll({ where: { user_id: founderId, status: 'verified' } });
        const { computeScores } = require('../utils/score');
        const scores = computeScores(p.get({ plain: true }), metrics.map((m) => m.get({ plain: true })), verifs.map((v) => v.kind));

        if (config.ai.apiKey) {
            const ctx = JSON.stringify({
                company: p.company_name, sector: p.sector, stage: p.stage, region: p.region,
                idea: p.idea, problem: p.problem, solution: p.solution, why_now: p.why_now,
                differentiation: p.differentiation, market_tam: p.market_tam,
                metrics: metrics.map((m) => ({ k: m.metric_key, v: m.value, unit: m.unit, as_of: m.as_of })),
                raising: p.raising, raise_amount: p.raise_amount, scores: scores.breakdown,
            });
            const resp = await fetch(`${config.ai.baseUrl}/chat/completions`, {
                method: 'POST', headers: { Authorization: `Bearer ${config.ai.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: config.ai.model, max_tokens: 600, messages: [
                    { role: 'system', content: 'You are a VC analyst. Given startup JSON, return ONLY JSON: {"summary":string,"strengths":[3 strings],"risks":[3 strings]}. Be specific and investor-grade.' },
                    { role: 'user', content: ctx },
                ] }),
            });
            if (resp.ok) {
                const data = await resp.json();
                try {
                    const txt = (data.choices?.[0]?.message?.content || '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
                    const parsed = JSON.parse(txt);
                    return sendSuccess(req, res, { ...parsed, scores, source: 'ai' });
                } catch { /* fall through to heuristic */ }
            }
        }

        // Heuristic fallback (works with no AI key).
        const strengths = [];
        const risks = [...scores.flags];
        if (scores.breakdown.traction >= 50) strengths.push(`Real traction across ${metrics.length} tracked metrics.`);
        if (scores.breakdown.founder_credibility >= 50) strengths.push('Credible founder background.');
        if (scores.breakdown.market >= 60) strengths.push('Large market with a clear why-now.');
        if (scores.breakdown.differentiation >= 80) strengths.push('Clear differentiation / moat articulated.');
        while (strengths.length < 3) strengths.push('Profile fundamentals in place.');
        const summary = `${p.company_name || 'This startup'} is a ${p.stage || 'early'}-stage ${p.sector || ''} company. `
            + `Profile score ${scores.profile_score}/100, investor-readiness ${scores.readiness_score}/100.`;
        return sendSuccess(req, res, { summary, strengths: strengths.slice(0, 3), risks: risks.slice(0, 3), scores, source: 'heuristic' });
    } catch (err) { return next(err); }
}

// POST /functions/match-investors — rank investors by fit for the caller's startup.
async function matchInvestors(req, res, next) {
    try {
        const founderId = req.body?.founder_id || req.auth.userId;
        const p = await db.Profile.findByPk(founderId);
        if (!p) throw new AppError('NOT_FOUND', 'Profile not found', 404);
        const investors = await db.Investor.findAll();
        const raise = Number(p.raise_amount) || null;
        const ranked = investors.map((iv) => {
            const sectors = Array.isArray(iv.focus_sectors) ? iv.focus_sectors : [];
            const stages = Array.isArray(iv.stages) ? iv.stages : [];
            let fit = 0; const reasons = [];
            if (p.sector && sectors.includes(p.sector)) { fit += 40; reasons.push(`Invests in ${p.sector}`); }
            if (p.stage && stages.includes(p.stage)) { fit += 30; reasons.push(`Backs ${p.stage}`); }
            if (p.region && iv.region === p.region) { fit += 15; reasons.push(`Active in ${p.region}`); }
            if (raise && iv.check_min != null && iv.check_max != null) {
                if (raise >= Number(iv.check_min) * 0.2 && raise <= Number(iv.check_max) * 3) { fit += 15; reasons.push('Check size fits'); }
            } else if (!raise) { fit += 5; }
            return { id: iv.id, name: iv.name, firm: iv.firm, firm_type: iv.firm_type, avatar_url: iv.avatar_url, region: iv.region, fit: Math.min(100, fit), reasons };
        }).filter((r) => r.fit > 0).sort((a, b) => b.fit - a.fit).slice(0, 8);
        return sendSuccess(req, res, { matches: ranked });
    } catch (err) { return next(err); }
}

// ── Payments: tier catalogue ──────────────────────────────────────────────────
// The quote/checkout logic itself lives in service/billingService.js so that one
// server-authoritative price is shared by the catalogue and the charge.
const billing = require('../service/billingService');

// GET-ish: returns tiers, current membership, and an upgrade quote for each tier.
async function paymentTiers(req, res, next) {
    try {
        const data = await billing.tiersFor(req.auth.userId);
        // Providers are resolved by payment-service from the CMS vault, not from local keys —
        // this service holds none. The browser opens whatever clientParams checkout returns, so
        // it does not need to choose a provider up front.
        return sendSuccess(req, res, { ...data, providers: [] });
    } catch (err) { return next(err); }
}

// SUPERSEDED — payment-order / payment-confirm.
//
// These ran against the adapters in ../payments, which returned SYNTHETIC order ids (no order
// ever existed at the provider) and verified payment from a client-supplied payload:
// PayU accepted `{status:'success'}`, Stripe `{status:'succeeded'}`, crypto
// `{event:'charge:confirmed'}`. The browser sent exactly those literals, so confirming a payment
// required no payment. Adding real keys would not have fixed it — `configured()` would flip to
// true and the same client-asserted verification would then grant memberships against a live
// merchant account.
//
// Both are kept as explicit 410s rather than deleted so a stale client gets a clear answer
// instead of a 404 that looks like a routing fault.
const RETIRED_PAYMENT_ENDPOINT = 'Retired. Membership checkout is POST /v1/billing/checkout; '
    + 'activation happens only on payment-service\'s verified fulfilment callback.';

async function paymentOrder(req, res, next) {
    return next(new AppError('ENDPOINT_RETIRED', RETIRED_PAYMENT_ENDPOINT, 410));
}

async function paymentConfirm(req, res, next) {
    return next(new AppError('ENDPOINT_RETIRED', RETIRED_PAYMENT_ENDPOINT, 410));
}

module.exports = { aiChat, scheduledTagReport, updateReportSchedule, sendNotification, checkout, profileScore, aiAnalyze, matchInvestors, paymentTiers, paymentOrder, paymentConfirm };
