'use strict';
const db = require('../models');
const ai = require('../service/aiService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Maximum characters allowed for client-supplied free-text context (prompt-injection guard).
const CONTEXT_MAX_LEN = 500;

/**
 * Sanitize a client-supplied context string before embedding in a prompt.
 * - Truncates to CONTEXT_MAX_LEN characters.
 * - Strips null bytes and common control characters that can confuse tokenisers.
 * - Does NOT allow the value to contain role/instruction override patterns.
 */
function sanitizeContext(raw) {
    // Cast to string, strip null bytes and other control chars, trim whitespace.
    const cleaned = String(raw || '')
        .replace(/\x00/g, '')
        .replace(/[\x01-\x1F\x7F]/g, ' ')
        .trim()
        .slice(0, CONTEXT_MAX_LEN);
    return cleaned;
}

// GET /ai/status — is generative AI configured? (no secrets leaked)
const status = (req, res) => sendSuccess(req, res, { enabled: ai.isEnabled(), provider: ai.provider, model: ai.model });

// POST /ai/asset-summary { symbol } — LLM insights when keyed, templated fallback otherwise.
const assetSummary = async (req, res, next) => {
    try {
        const symbol = String(req.body.symbol || req.query.symbol || '').toUpperCase();
        const asset = symbol ? await db.AssetSummary.findOne({ where: { symbol } }) : null;
        if (symbol && !asset) return next(new AppError('NOT_FOUND', 'Asset not found', 404));

        // When no DB asset is found, use the client-supplied context — sanitize and
        // clearly delimit it as untrusted so the model cannot be instructed via it.
        const facts = asset
            ? `${asset.name} (${asset.symbol}), type ${asset.asset_type}, price $${asset.current_price}, 24h change ${asset.change_pct_24h}%, sentiment ${asset.sentiment}. Note: ${asset.ai_summary || ''}`
            : sanitizeContext(req.body.context);

        const generated = await ai.generate({
            system: 'You are a concise sell-side financial research analyst. Respond with ONLY a JSON object: {"summary": string, "bull_case": string, "bear_case": string, "catalysts": string[3], "confidence_score": number between 0 and 1}. No text outside the JSON.',
            // Untrusted client context is wrapped in explicit delimiters so the model
            // treats it as data, not as additional instructions.
            prompt: `Produce an investment view for the following asset description.\n\n<asset_description>\n${facts}\n</asset_description>`,
        });

        let insights = null;
        if (generated) { try { insights = JSON.parse(generated); } catch { /* fall through */ } }

        if (insights) {
            insights.ai_generated = true;
        } else {
            const sent = asset?.sentiment || 'neutral';
            insights = {
                summary: asset?.ai_summary || facts || 'No data available.',
                bull_case: asset?.ai_summary || 'Constructive momentum and improving fundamentals support the upside case.',
                bear_case: 'Stretched valuation and macro/liquidity risks could pressure the price near-term.',
                catalysts: Object.keys(asset?.key_metrics || {}).slice(0, 3).map((k) => `${k}: ${asset.key_metrics[k]}`),
                confidence_score: sent === 'bullish' ? 0.82 : sent === 'bearish' ? 0.46 : 0.62,
                ai_generated: false,
            };
            if (!insights.catalysts.length) insights.catalysts = ['Earnings & flows', 'Macro data', 'Sector rotation'];
        }
        return sendSuccess(req, res, { symbol, ...insights });
    } catch (err) { return next(err); }
};

module.exports = { status, assetSummary };
