'use strict';
// AI matching engine v1 — transparent weighted-rules scorer. Produces a 0–100 match score
// with human-readable reasons, scoring an investor's preferences against a live opportunity
// (joined to its company for industry/stage/geography). Phase-2 upgrade path: embeddings +
// similarity via ml-service once enough deal data accrues (see architecture doc §8).
const db = require('../../models');

const WEIGHTS = { industry: 30, stage: 20, geography: 20, ticket: 20, recency: 10 };
const MODEL_VERSION = 'rules-v1';

function scoreOne(pref, opp) {
    const company = opp.company || {};
    const reasons = [];
    let score = 0;

    const industries = pref.industries || [];
    if (industries.length && company.industry_code) {
        if (industries.includes(company.industry_code)) { score += WEIGHTS.industry; reasons.push(`Industry match: ${company.industry_code}`); }
    } else { score += WEIGHTS.industry * 0.4; } // no preference set → neutral partial

    const stages = pref.stages || [];
    if (stages.length && company.stage) {
        if (stages.includes(company.stage)) { score += WEIGHTS.stage; reasons.push(`Stage match: ${company.stage}`); }
    } else { score += WEIGHTS.stage * 0.4; }

    const geos = pref.geographies || [];
    if (geos.length && company.country) {
        if (geos.includes(company.country)) { score += WEIGHTS.geography; reasons.push(`Geography match: ${company.country}`); }
    } else { score += WEIGHTS.geography * 0.4; }

    // Ticket fit — the opportunity's minimum ticket sits within the investor's range.
    const min = pref.ticket_min != null ? Number(pref.ticket_min) : null;
    const max = pref.ticket_max != null ? Number(pref.ticket_max) : null;
    const oppMin = opp.min_ticket != null ? Number(opp.min_ticket) : null;
    if (min == null && max == null) { score += WEIGHTS.ticket * 0.4; }
    else if (oppMin == null) { score += WEIGHTS.ticket * 0.5; }
    else if ((min == null || oppMin >= min) && (max == null || oppMin <= max)) { score += WEIGHTS.ticket; reasons.push('Ticket size fits your range'); }

    // Recency — newer live rounds score a little higher.
    if (opp.published_at) {
        const ageDays = (Date.now() - new Date(opp.published_at).getTime()) / 86400000;
        score += ageDays <= 30 ? WEIGHTS.recency : ageDays <= 90 ? WEIGHTS.recency * 0.5 : 0;
    }

    return { score: Math.round(Math.min(100, score) * 100) / 100, reasons };
}

// Recommend live opportunities for an investor, scored + sorted desc. Persists into matches.
async function recommendForInvestor(investorId, { limit = 20 } = {}) {
    const pref = (await db.InvestmentPreference.findByPk(investorId))?.toJSON() || {};
    const opps = await db.Opportunity.findAll({
        where: { status: 'live', visibility: 'public' },
        include: [{ model: db.Company, as: 'company' }],
        order: [['published_at', 'DESC']],
        limit: 200,
    });
    const scored = opps.map((o) => {
        const oj = o.toJSON();
        const { score, reasons } = scoreOne(pref, oj);
        return {
            opportunity_id: oj.id, title: oj.title, round: oj.round,
            amount_sought: oj.amount_sought, min_ticket: oj.min_ticket,
            company: oj.company ? { id: oj.company.id, name: oj.company.brand_name || oj.company.legal_name, industry: oj.company.industry_code, stage: oj.company.stage, country: oj.company.country } : null,
            score, reasons,
        };
    }).sort((a, b) => b.score - a.score).slice(0, limit);

    // Best-effort persistence of the top matches (upsert on the unique opportunity+investor).
    await Promise.all(scored.map((m) =>
        db.sequelize.query(
            `INSERT INTO marketplace.matches (opportunity_id, investor_id, score, reasons_json, model_version, status)
             VALUES (:oid, :iid, :score, :reasons, :mv, 'suggested')
             ON CONFLICT (opportunity_id, investor_id)
             DO UPDATE SET score = EXCLUDED.score, reasons_json = EXCLUDED.reasons_json, model_version = EXCLUDED.model_version`,
            { replacements: { oid: m.opportunity_id, iid: investorId, score: m.score, reasons: JSON.stringify({ reasons: m.reasons }), mv: MODEL_VERSION } },
        ).catch(() => undefined),
    ));

    return { items: scored, model_version: MODEL_VERSION };
}

module.exports = { recommendForInvestor, scoreOne, MODEL_VERSION };
