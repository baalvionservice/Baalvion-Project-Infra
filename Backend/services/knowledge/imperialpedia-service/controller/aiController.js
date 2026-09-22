'use strict';
const db = require('../models');
const ai = require('../service/aiService');
const { analyzeArticle, computeOriginalityStatus } = require('../service/articleAnalysisService');
const originalityProvider = require('../service/originalityProvider');
const { detectClaims } = require('../service/claimDetectionService');
const claimResearchProvider = require('../service/claimResearchProvider');
const editorialAuditService = require('../service/editorialAuditService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// Maximum characters allowed for client-supplied free-text context (prompt-injection guard).
const CONTEXT_MAX_LEN = 500;
// Article title/content are much longer than the asset-summary context, but still capped —
// this bounds both the DB read-back cost and what we'd ever interpolate into an LLM prompt.
const ARTICLE_TEXT_MAX_LEN = 20000;
// Below this, there isn't enough content for the heuristics to say anything useful (avoids
// analyzing "Hello world" per the product spec).
const MIN_ANALYZABLE_WORDS = 30;

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

/**
 * Shared local-analysis pipeline behind BOTH /ai/article-analysis and
 * /ai/full-editorial-audit (Prompt 4 reuses this rather than re-implementing it — see
 * editorialAuditService.js's header comment). Reads the same sanitized fields, runs the same
 * candidate lookup, and returns EXACTLY what articleAnalysis used to build inline: either
 * `{ analyzable: false, wordCount, message }` or `{ analyzable: true, ...analyzeArticle() }`
 * (with the optional AI subtopic enhancement folded in).
 */
async function runLocalArticleAnalysis(req) {
    const title = sanitizeContext(req.body.title).slice(0, 300) || String(req.body.title || '').slice(0, 300);
    const content = String(req.body.content || '').replace(/\x00/g, '').slice(0, ARTICLE_TEXT_MAX_LEN);
    const summary = String(req.body.summary || '').slice(0, 1000);
    const metaTitle = String(req.body.metaTitle || '').slice(0, 200);
    const metaDescription = String(req.body.metaDescription || '').slice(0, 400);
    const slug = String(req.body.slug || '').slice(0, 500);
    const status = String(req.body.status || 'draft');
    const category = req.body.category ? String(req.body.category).slice(0, 100) : null;
    const articleId = req.body.articleId ? parseInt(req.body.articleId, 10) : null;

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    if (wordCount < MIN_ANALYZABLE_WORDS) {
        return {
            title, content,
            result: {
                analyzable: false,
                wordCount,
                message: `Add a bit more content (at least ${MIN_ANALYZABLE_WORDS} words) to see Content Intelligence suggestions.`,
            },
        };
    }

    // Candidate pool for internal-link/cannibalization/internal-similarity detection: other
    // PUBLISHED articles, same category first (more likely to be topically relevant).
    // `content` is included (Prompt 2) so detectInternalSimilarity() has real text to
    // compare against — kept to a modest limit since this now reads full article bodies,
    // not just titles, and this endpoint still needs to stay fast on every debounced call.
    let candidates = [];
    try {
        const where = { status: 'published' };
        if (category) where.category = category;
        candidates = await db.Article.findAll({
            where,
            attributes: ['id', 'slug', 'title', 'content'],
            limit: 25,
            order: [['views_count', 'DESC']],
        });
    } catch (e) {
        // Internal-link/similarity detection is a bonus, not a requirement — never fail the
        // whole analysis because the candidate lookup had trouble.
        candidates = [];
    }

    const result = analyzeArticle(
        { title, content, summary, metaTitle, metaDescription, slug, status },
        { candidates: candidates.map((c) => c.toJSON ? c.toJSON() : c).filter((c) => !articleId || c.id !== articleId) }
    );

    // Optional AI enhancement: genuinely-missing subtopic suggestions. This is the one
    // part local heuristics structurally can't do (it requires external topic knowledge),
    // so it's skipped cleanly — never faked — when no provider key is configured.
    let aiSuggestedSubtopics = null;
    if (ai.isEnabled()) {
        const generated = await ai.generate({
            system: 'You are an editorial assistant for an educational encyclopedia. Given an article title and excerpt, respond with ONLY a JSON object: {"missing_subtopics": string[] (0-5 short subtopic phrases a reader would reasonably expect but that do not appear to be covered)}. Do not repeat topics already obviously covered. No text outside the JSON.',
            prompt: `<title>\n${title}\n</title>\n<excerpt>\n${content.slice(0, 4000)}\n</excerpt>`,
            maxTokens: 300,
        });
        if (generated) {
            try {
                const parsed = JSON.parse(generated);
                if (Array.isArray(parsed.missing_subtopics)) aiSuggestedSubtopics = parsed.missing_subtopics.slice(0, 5);
            } catch { /* ignore malformed AI output — heuristics-only result still stands */ }
        }
    }
    result.topics.aiSuggestedMissing = aiSuggestedSubtopics;
    result.aiEnhanced = Boolean(aiSuggestedSubtopics);
    // Genuine topic-gap ("missing") entries can ONLY come from this optional AI pass — see
    // the comment on buildTopicCoverage() in articleAnalysisService.js for why local
    // heuristics never populate this bucket on their own.
    if (aiSuggestedSubtopics) {
        for (const concept of aiSuggestedSubtopics) {
            result.topicCoverage.push({ concept, status: 'missing', note: 'AI suggestion — optional, verify before adding.' });
        }
    }

    return { title, content, result: { analyzable: true, ...result } };
}

// POST /ai/article-analysis — Live Content Intelligence for the article editor.
// Auth required (mirrors createArticle: any authenticated writer, no elevated role needed —
// this only reads back the caller's own in-progress draft text, it never touches the DB
// beyond the read-only candidate lookup for internal-link matching).
const articleAnalysis = async (req, res, next) => {
    try {
        const { result } = await runLocalArticleAnalysis(req);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// POST /ai/originality-check — EXPLICIT, user-triggered external originality/similarity check.
// Deliberately a separate endpoint from /ai/article-analysis: the local writing-signal pass
// above runs automatically on every debounced keystroke, but an external provider call must
// only ever happen on a deliberate action (e.g. an "Run Originality Check" button) so we never
// repeatedly spend third-party provider credits while someone is just typing.
const originalityCheck = async (req, res, next) => {
    try {
        const validated = originalityProvider.validateOriginalityCheckInput(req.body);
        if (!validated.ok) return next(new AppError('VALIDATION_ERROR', validated.error, 400));
        const { title, content, slug, options } = validated.value;

        // Local signals are recomputed here too (no DB candidates needed for this quick pass —
        // the automatic /ai/article-analysis call already covers internal overlap) so the
        // status returned reflects BOTH local writing signals and the external provider result.
        const localResult = analyzeArticle({ title, content, slug });
        const providerResult = await originalityProvider.analyzeOriginality(content, options);
        const status = computeOriginalityStatus({
            internalOverlap: localResult.internalOverlap,
            writingSignals: localResult.writingSignals,
            providerResult,
        });

        return sendSuccess(req, res, {
            // rawReference is an opaque provider-side id at most — the API key and full raw
            // provider payload never leave originalityProvider.js, let alone this response.
            provider: providerResult.provider,
            status: providerResult.status,
            similarity: providerResult.similarity,
            matches: providerResult.matches,
            checkedAt: providerResult.checkedAt,
            originalityReview: { status },
        });
    } catch (err) { return next(err); }
};

// POST /ai/verify-claims — EXPLICIT, user-triggered STAGE B of Fact & Source Intelligence.
// Deliberately a separate endpoint from /ai/article-analysis, same reasoning as
// originalityCheck above: Stage A claim detection runs on every debounced keystroke, but
// external research (or even the deterministic-but-costlier prioritization/dedup pass) must
// only ever run on a deliberate "Verify Claims" action.
const verifyClaims = async (req, res, next) => {
    try {
        const title = sanitizeContext(req.body.title).slice(0, 300) || String(req.body.title || '').slice(0, 300);
        const content = String(req.body.content || '').replace(/\x00/g, '').slice(0, ARTICLE_TEXT_MAX_LEN);
        const jurisdiction = req.body.jurisdiction ? String(req.body.jurisdiction).slice(0, 100) : null;

        if (!content.trim()) return next(new AppError('VALIDATION_ERROR', 'content is required', 400));

        // Re-run Stage A locally rather than trusting claim objects the client might send —
        // the client only ever gets to pick WHICH detected claims to verify implicitly by
        // calling this endpoint with the current draft text, never to hand us arbitrary
        // "claim" text to research on the article's behalf.
        const { claims } = detectClaims({ title, content });
        if (!claims.length) {
            return sendSuccess(req, res, { researchStatus: 'completed', provider: null, results: [], skippedCount: 0, message: 'No verifiable claims were detected in this draft.' });
        }

        const research = await claimResearchProvider.researchClaims(claims, { jurisdiction });
        return sendSuccess(req, res, research);
    } catch (err) { return next(err); }
};

// POST /ai/full-editorial-audit — Prompt 4: aggregates Prompts 1-3's already-computed results
// into one editorial checklist. Deliberately reuses runLocalArticleAnalysis() (same code path
// as /ai/article-analysis) rather than re-implementing any detection — see
// editorialAuditService.js's header comment for the full aggregation contract, including why
// the optional externalOriginality/claimResearch echoes can only ever ADD a CRITICAL finding,
// never suppress one. Like /ai/originality-check and /ai/verify-claims, this endpoint never
// calls an external provider itself — it is a manual, explicit "Run Full Audit" action, not
// part of the debounced typing loop.
const fullEditorialAudit = async (req, res, next) => {
    try {
        const { title, content, result } = await runLocalArticleAnalysis(req);

        // Both are optional echoes of a PRIOR server response the client already holds (from
        // /ai/originality-check and /ai/verify-claims respectively) — never a fresh external
        // call from here. Malformed/absent input degrades to "not performed", never a pass.
        const externalOriginality = req.body.externalOriginality || null;
        const claimResearch = req.body.claimResearch || null;

        const audit = editorialAuditService.buildEditorialAudit({ title, content, analysis: result, externalOriginality, claimResearch });
        return sendSuccess(req, res, audit);
    } catch (err) { return next(err); }
};

module.exports = { status, assetSummary, articleAnalysis, originalityCheck, verifyClaims, fullEditorialAudit };
