'use strict';
// AI insights, computed from LIVE platform data (domains + KPIs + financial_entries) where possible.
// Revenue forecasts and risk alerts are derived from real numbers; growth opportunities and strategy
// playbooks come from the editable ai_recommendations / ai_strategy_scenarios tables.

const TREND_TO_GROWTH = { up: 0.05, flat: 0.015, down: -0.03 };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(Number(n) || 0);

// Monthly revenue growth for a business, inferred from its financial history; falls back to the
// KPI profit_trend hint when there isn't enough history. Clamped to a sane monthly band.
function inferMonthlyGrowth(domainId, financials, profitTrend) {
    const byMonth = new Map();
    for (const f of financials) {
        if (f.domain_id !== domainId || f.type !== 'Revenue') continue;
        const month = String(f.date).slice(0, 7); // YYYY-MM
        byMonth.set(month, (byMonth.get(month) || 0) + Number(f.amount || 0));
    }
    const months = [...byMonth.keys()].sort();
    if (months.length >= 2) {
        const prev = byMonth.get(months[months.length - 2]);
        const last = byMonth.get(months[months.length - 1]);
        if (prev > 0) return clamp((last - prev) / prev, -0.1, 0.2);
    }
    return clamp(TREND_TO_GROWTH[profitTrend] ?? 0.015, -0.1, 0.2);
}

async function computeAi(db, orgId) {
    const [domains, kpis, financials, recs, scenarios] = await Promise.all([
        db.Domain.findAll({ where: { org_id: orgId }, raw: true }),
        db.KPI.findAll({ where: { org_id: orgId }, raw: true }),
        db.FinancialEntry.findAll({ where: { org_id: orgId }, raw: true }),
        db.AiRecommendation.findAll({ where: { org_id: orgId }, order: [['sort_order', 'ASC']], raw: true }),
        db.AiStrategyScenario.findAll({ where: { org_id: orgId }, raw: true }),
    ]);

    const kpiByBiz = new Map(kpis.map((k) => [k.business_id, k]));
    const hasHistory = (id) => financials.some((f) => f.domain_id === id && f.type === 'Revenue');

    // ── Revenue forecasts (real MRR compounded by inferred growth) ──────────────
    const revenuePredictions = domains
        .filter((d) => kpiByBiz.has(d.id))
        .map((d) => {
            const kpi = kpiByBiz.get(d.id);
            const currentMrr = round(kpi.revenue_actual);
            const g = inferMonthlyGrowth(d.id, financials, kpi.profit_trend);
            const project = (m) => round(currentMrr * Math.pow(1 + g, m));
            let confidence = 70;
            if (hasHistory(d.id)) confidence += 10;
            if (currentMrr > 0) confidence += 5;
            return {
                businessId: String(d.id),
                currentMrr,
                forecasts: { threeMonth: project(3), sixMonth: project(6), twelveMonth: project(12) },
                confidence: clamp(confidence, 65, 90),
            };
        });

    const confidenceScore = revenuePredictions.length
        ? round(revenuePredictions.reduce((s, p) => s + p.confidence, 0) / revenuePredictions.length)
        : 78;

    // ── Risk alerts derived from real revenue concentration + FX exposure ───────
    const riskAlerts = [];
    const totalRevenue = kpis.reduce((s, k) => s + Number(k.revenue_actual || 0), 0);
    if (totalRevenue > 0) {
        for (const d of domains) {
            const kpi = kpiByBiz.get(d.id);
            if (!kpi) continue;
            const share = Number(kpi.revenue_actual || 0) / totalRevenue;
            if (share >= 0.5) {
                riskAlerts.push({ business: d.name, description: `High revenue concentration — ${Math.round(share * 100)}% of portfolio revenue.`, level: 'HIGH' });
            }
        }
    }
    const currencies = domains.map((d) => d.currency).filter(Boolean);
    const mainCurrency = currencies.sort((a, b) =>
        currencies.filter((c) => c === b).length - currencies.filter((c) => c === a).length)[0] || 'USD';
    for (const d of domains) {
        if (d.currency && d.currency !== mainCurrency) {
            riskAlerts.push({ business: d.name, description: `FX exposure on ${d.currency}-denominated revenue.`, level: 'MEDIUM' });
        }
    }
    const cappedRisks = riskAlerts.slice(0, 3).map((r, i) => ({ id: `risk_${i + 1}`, ...r }));

    // ── Editable curated content ────────────────────────────────────────────────
    const growthOpportunities = recs.map((r) => ({
        id: r.rec_key,
        title: r.title,
        description: r.description,
        estimatedImpact: r.estimated_impact,
        confidence: r.confidence,
    }));

    const strategy = {};
    for (const s of scenarios) strategy[s.scenario] = s.payload || {};

    return {
        predictions: { confidenceScore, revenuePredictions, growthOpportunities, riskAlerts: cappedRisks },
        strategy,
    };
}

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

// Per-business AI performance summary, computed from the business's REAL KPIs + financial history.
// LLM seam: if GEMINI_API_KEY is set, the computed brief below is handed to a model for narrative
// polish; otherwise the deterministic, data-driven summary is returned (always live, never empty).
async function buildBusinessSummary(db, orgId, businessId) {
    const id = Number(businessId);
    const domain = await db.Domain.findOne({ where: { id, org_id: orgId }, raw: true });
    if (!domain) return { error: 'Business not found' };

    const [kpi, fins] = await Promise.all([
        db.KPI.findOne({ where: { business_id: id, org_id: orgId }, raw: true }),
        db.FinancialEntry.findAll({ where: { domain_id: id, org_id: orgId }, raw: true }),
    ]);

    const revenue = fins.filter((f) => f.type === 'Revenue').reduce((s, f) => s + Number(f.amount || 0), 0);
    const expense = fins.filter((f) => f.type === 'Expense').reduce((s, f) => s + Number(f.amount || 0), 0);
    const net = revenue - expense;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;
    const g = inferMonthlyGrowth(id, fins, kpi && kpi.profit_trend);
    const trendWord = g > 0.01 ? 'growing' : g < -0.01 ? 'contracting' : 'holding steady';

    const sentences = [];
    sentences.push(`${domain.name} (${domain.country || 'global'}, ${domain.currency || 'USD'}) is currently marked "${domain.status || 'Active'}".`);
    if (fins.length) {
        sentences.push(`Across ${fins.length} recorded entries it shows ${money(revenue)} in revenue against ${money(expense)} in expenses — a net of ${money(net)} (${pct(margin)} margin).`);
        sentences.push(`Revenue is ${trendWord} at roughly ${pct(g * 100)} month over month.`);
    } else {
        sentences.push('No financial entries are recorded yet, so revenue/expense figures are unavailable.');
    }
    if (kpi) {
        if (kpi.revenue_target && kpi.revenue_actual) {
            const attain = Number(kpi.revenue_target) > 0 ? (Number(kpi.revenue_actual) / Number(kpi.revenue_target)) * 100 : 0;
            sentences.push(`It is at ${pct(attain)} of its ${money(kpi.revenue_target)} revenue target (${money(kpi.revenue_actual)} actual).`);
        }
        const kpiBits = [];
        if (kpi.customers_total != null) kpiBits.push(`${Number(kpi.customers_total).toLocaleString('en-US')} customers (${pct(kpi.customers_change)} change)`);
        if (kpi.nps != null) kpiBits.push(`NPS ${kpi.nps}`);
        if (kpi.return_rate != null) kpiBits.push(`${pct(kpi.return_rate)} return rate`);
        if (kpiBits.length) sentences.push(`Key metrics: ${kpiBits.join(', ')}.`);
    }
    sentences.push(net >= 0
        ? 'Recommendation: the unit is profitable — consider reinvesting net margin into the fastest-growing channel.'
        : 'Recommendation: the unit is running at a loss — review the largest expense categories and prioritise margin recovery.');

    const summary = sentences.join(' ');
    // To enable LLM polish, set GEMINI_API_KEY and call the Generative Language API here with `summary`
    // as grounding context; on any failure, return the computed summary unchanged.
    return { summary };
}

module.exports = { computeAi, buildBusinessSummary };
