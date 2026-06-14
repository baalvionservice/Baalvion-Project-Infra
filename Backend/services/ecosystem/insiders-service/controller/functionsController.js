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
    try {
        const plan = (req.body?.plan && config.tiers[req.body.plan]) ? req.body.plan : 'founder';
        const amount = config.tiers[plan];
        const now = new Date();
        const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const [m] = await db.Membership.findOrCreate({
            where: { user_id: req.auth.userId },
            defaults: { user_id: req.auth.userId, plan, status: 'active', amount_usd: amount, started_at: now, expires_at: expires, payment_ref: `demo_${Date.now()}` },
        });
        await m.update({ plan, status: 'active', amount_usd: amount, started_at: now, expires_at: expires, payment_ref: m.payment_ref || `demo_${Date.now()}` });
        await createNotification({ userId: req.auth.userId, type: 'membership', title: 'Membership active', message: `Your ${plan} membership is active. Investor & deal access unlocked.`, link: '/investors' });
        return sendSuccess(req, res, { membership: m });
    } catch (err) { return next(err); }
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

// ── Payments: tiers, proration quote, create-order, confirm ───────────────────
const { getProvider, PROVIDERS } = require('../payments');
const TIER_LABEL = { founder: 'Founder', investor_partner: 'Investor Partner' };

// Quote the amount due to move to `targetTier`, applying the upgrade-within-grace rule.
function quoteTier(membership, targetTier) {
    const tiers = config.tiers;
    const full = tiers[targetTier];
    if (full == null) return null;
    let amount = full, proration = false, note = `${TIER_LABEL[targetTier]} membership`;
    if (membership && membership.status === 'active' && membership.plan && membership.plan !== targetTier) {
        const currentPrice = tiers[membership.plan] ?? 0;
        const days = membership.started_at ? (Date.now() - new Date(membership.started_at).getTime()) / 86400000 : Infinity;
        if (currentPrice < full && days <= config.upgradeGraceDays) {
            amount = full - currentPrice; proration = true;
            note = `Upgrade credit: $${currentPrice} paid ${Math.floor(days)}d ago (within ${config.upgradeGraceDays} days) → pay only the difference.`;
        } else if (currentPrice < full) {
            note = `Past the ${config.upgradeGraceDays}-day upgrade window — full ${TIER_LABEL[targetTier]} price applies.`;
        }
    }
    return { tier: targetTier, label: TIER_LABEL[targetTier], full_price: full, amount, proration, note, currency: 'USD' };
}

// GET-ish: returns tiers, current membership, and an upgrade quote for each tier.
async function paymentTiers(req, res, next) {
    try {
        const membership = await db.Membership.findOne({ where: { user_id: req.auth.userId } });
        const tiers = Object.keys(config.tiers).map((t) => ({
            key: t, label: TIER_LABEL[t], price: config.tiers[t],
            current: membership?.status === 'active' && membership.plan === t,
            quote: quoteTier(membership, t),
        }));
        // Only advertise gateways that are actually configured — never offer a provider that will fail closed.
        const providers = Object.values(PROVIDERS).filter((p) => p.configured()).map((p) => p.name);
        return sendSuccess(req, res, { tiers, membership, grace_days: config.upgradeGraceDays, providers });
    } catch (err) { return next(err); }
}

// Create a payment order with the chosen provider (amount = prorated quote).
async function paymentOrder(req, res, next) {
    try {
        const { provider: providerName, tier } = req.body || {};
        const provider = getProvider(providerName);
        if (!provider) throw new AppError('BAD_REQUEST', 'Unknown payment provider', 400);
        if (!provider.configured()) throw new AppError('PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway is not configured', 503);
        if (!config.tiers[tier]) throw new AppError('BAD_REQUEST', 'Unknown tier', 400);
        const membership = await db.Membership.findOne({ where: { user_id: req.auth.userId } });
        const q = quoteTier(membership, tier);
        const profile = await db.Profile.findByPk(req.auth.userId);
        const payment = await db.Payment.create({
            user_id: req.auth.userId, provider: providerName, tier, amount_usd: q.amount, currency: 'USD',
            status: 'created', proration: q.proration, meta: { full_price: q.full_price, note: q.note },
        });
        const order = await provider.createOrder({
            amount: q.amount, currency: 'USD', receipt: payment.id,
            meta: { tier, name: profile?.full_name, email: req.auth.email },
        });
        await payment.update({ provider_order_id: order.order_id });
        return sendSuccess(req, res, { payment_id: payment.id, provider: providerName, amount: q.amount, proration: q.proration, note: q.note, order });
    } catch (err) { return next(err); }
}

// Confirm a payment (verify via provider) → activate/upgrade the membership.
async function paymentConfirm(req, res, next) {
    try {
        const { payment_id, payload } = req.body || {};
        const payment = await db.Payment.findOne({ where: { id: payment_id, user_id: req.auth.userId } });
        if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404);
        if (payment.status === 'paid') return sendSuccess(req, res, { already: true });
        const provider = getProvider(payment.provider);
        if (!provider || !provider.configured()) throw new AppError('PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway is not configured', 503);
        const ok = provider.verify({ payment, payload });
        if (!ok) { await payment.update({ status: 'failed' }); throw new AppError('PAYMENT_FAILED', 'Payment verification failed', 402); }

        await payment.update({ status: 'paid', provider_ref: payload?.payment_id || payload?.id || payment.provider_order_id });
        const now = new Date();
        const [m] = await db.Membership.findOrCreate({
            where: { user_id: req.auth.userId },
            defaults: { user_id: req.auth.userId, plan: payment.tier, status: 'active', amount_usd: config.tiers[payment.tier], started_at: now, expires_at: new Date(now.getTime() + 365 * 864e5), payment_ref: payment.id },
        });
        // On upgrade keep the original started_at? No — new tier starts now (resets the grace window).
        await m.update({ plan: payment.tier, status: 'active', amount_usd: config.tiers[payment.tier], started_at: now, expires_at: new Date(now.getTime() + 365 * 864e5), payment_ref: payment.id });
        await createNotification({ userId: req.auth.userId, type: 'membership', title: `${TIER_LABEL[payment.tier]} active`, message: `Payment received. Your ${TIER_LABEL[payment.tier]} membership is now active.`, link: '/investors' });
        return sendSuccess(req, res, { membership: m, payment });
    } catch (err) { return next(err); }
}

module.exports = { aiChat, scheduledTagReport, updateReportSchedule, sendNotification, checkout, profileScore, aiAnalyze, matchInvestors, paymentTiers, paymentOrder, paymentConfirm };
