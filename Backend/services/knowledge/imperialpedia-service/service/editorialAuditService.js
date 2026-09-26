'use strict';
/**
 * PROMPT 4 — Full Editorial QA & Pre-Publish Audit.
 *
 * This module does NOT run any analysis of its own. It AGGREGATES the already-computed
 * results of:
 *   - articleAnalysisService.analyzeArticle() (Prompt 1 SEO/content + Prompt 2 originality +
 *     Prompt 3 factSourceIntelligence — all already folded into one object)
 *   - an optional, client-supplied echo of a prior POST /ai/originality-check response
 *   - an optional, client-supplied echo of a prior POST /ai/verify-claims response
 *
 * It never calls an external provider, never recomputes topic/depth/originality/claim
 * detection, and never mutates the article. It is a pure, synchronous, deterministic
 * transform: same inputs -> same audit, every time.
 *
 * Trust model for the two optional externally-sourced inputs (spec §33: "never trust
 * client-provided audit results"): both were themselves originally PRODUCED by this backend
 * (via the existing /ai/originality-check and /ai/verify-claims endpoints) — the client is
 * just handing back what the server already told it, so this isn't the client inventing a
 * verdict from nothing. Even so, this module only ever lets them ADD a CRITICAL finding
 * (significant external similarity; contradicted/conflicting research evidence) — it never
 * uses them to downgrade or suppress a severity that the server's own local analysis already
 * computed. A malicious or buggy client can make the audit MORE cautious with these fields,
 * never less.
 */

const SIGNIFICANT_WARNING_THRESHOLD = 3;

const HUMAN_REVIEW_CHECKLIST = [
    { id: 'claims', label: 'I personally reviewed factual claims.' },
    { id: 'sources', label: 'I verified important primary sources.' },
    { id: 'quotations', label: 'I reviewed quotations and attribution.' },
    { id: 'jurisdiction', label: 'I checked jurisdiction-specific claims.' },
    { id: 'dates-numbers', label: 'I confirmed dates and numbers.' },
    { id: 'originality', label: 'I reviewed originality/similarity warnings.' },
    { id: 'answers-question', label: "I confirmed the article actually answers the reader's question." },
    { id: 'internal-links', label: 'I reviewed internal links.' },
    { id: 'title-meta', label: 'I reviewed title and meta description.' },
    { id: 'proofread', label: 'I performed final human proofreading.' },
];

/** Dependency-free string hash (djb2) — good enough for an editor-facing "has this content
 *  changed since the audit ran?" staleness check, not used for anything security-sensitive. */
function contentFingerprint(title, content) {
    const input = `${title || ''}\u0000${content || ''}`;
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash * 33) ^ input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
}

/** Validates an echoed POST /ai/originality-check response. Returns null if unrecognizable —
 *  an unrecognized shape is treated the same as "not performed", never as a pass. */
function sanitizeExternalOriginality(input) {
    if (!input || typeof input !== 'object') return null;
    const status = input.status;
    if (!['not_configured', 'checked', 'error'].includes(status)) return null;
    const similarity = typeof input.similarity === 'number' && input.similarity >= 0 && input.similarity <= 1
        ? input.similarity
        : null;
    return { status, similarity };
}

/** Validates an echoed POST /ai/verify-claims response. Drops any malformed entries rather
 *  than trusting them. */
function sanitizeClaimResearch(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.results)) return null;
    const VALID_STATUSES = new Set(['SUPPORTED', 'CONTRADICTED', 'PARTIALLY_SUPPORTED', 'UNCLEAR', 'NO_SOURCE_FOUND', 'needs_research']);
    const results = input.results
        .filter((r) => r && typeof r === 'object' && typeof r.claimId === 'string')
        .slice(0, 50)
        .map((r) => ({
            claimId: r.claimId,
            status: VALID_STATUSES.has(r.status) ? r.status : 'needs_research',
            sourceConflict: r.sourceConflict === true,
        }));
    const researchStatus = typeof input.researchStatus === 'string' ? input.researchStatus : 'not_configured';
    return { researchStatus, results };
}

function makeIssue({ category, severity, title, message, source, location = null }) {
    return {
        category, severity, title, message, source, location,
        // "actionable" means a [Locate] affordance is meaningful for this issue — reuses the
        // SAME best-effort findLocateRange()/onLocate mechanism as every other panel section,
        // no second location system.
        actionable: Boolean(location),
        // The audit itself never persists a resolved/dismissed state (spec §14/§15) — this is
        // always false from the server; the frontend may track a transient dismissal locally
        // for SUGGESTION-level, non-factual issues only.
        resolved: false,
    };
}

function computeCategory(key, label, issues) {
    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const suggestionCount = issues.filter((i) => i.severity === 'SUGGESTION').length;
    const status = criticalCount ? 'critical' : warningCount ? 'warn' : 'ok';
    return { key, label, status, issueCount: issues.length, criticalCount, warningCount, suggestionCount, issues };
}

/**
 * Generates the "article quality summary" sentence (spec §26) purely from already-computed
 * counts — never a template that could imply a problem that wasn't actually detected.
 */
function buildQualitySummary({ analysis, critical, categories }) {
    const parts = [];
    parts.push(
        analysis.intent?.coverage === 'Good'
            ? 'Article structure and search intent are aligned.'
            : 'Search intent coverage may need attention.'
    );

    const factsCat = categories.find((c) => c.key === 'FACTS');
    if (factsCat && factsCat.issueCount > 0) {
        parts.push(`${factsCat.issueCount} factual claim${factsCat.issueCount === 1 ? '' : 's'} still need${factsCat.issueCount === 1 ? 's' : ''} verification.`);
    }

    const topicCat = categories.find((c) => c.key === 'TOPIC');
    if (topicCat && topicCat.issueCount > 0) {
        parts.push(`${topicCat.issueCount} topic${topicCat.issueCount === 1 ? '' : 's'} could use more coverage or depth.`);
    }

    const originalityCat = categories.find((c) => c.key === 'ORIGINALITY');
    if (originalityCat && originalityCat.issueCount > 0) {
        parts.push('Writing signals show some repetition or overlap worth a closer look.');
    }

    parts.push(critical > 0 ? 'Human review is required before publication.' : 'Human review is recommended before publication.');
    return parts.join(' ');
}

/**
 * Builds the unified audit from an already-computed analyzeArticle() result. `analysis` may
 * also be the `{ analyzable: false, ... }` shape the controller returns for too-short drafts —
 * that maps to NOT_ENOUGH_CONTENT without looking at anything else.
 */
function buildEditorialAudit({ title = '', content = '', analysis, externalOriginality = null, claimResearch = null } = {}) {
    const fingerprint = contentFingerprint(title, content);

    if (!analysis || analysis.analyzable === false) {
        return {
            status: 'NOT_ENOUGH_CONTENT',
            generatedAt: new Date().toISOString(),
            contentFingerprint: fingerprint,
            summary: { critical: 0, warnings: 0, suggestions: 0 },
            categories: [],
            humanReviewChecklist: HUMAN_REVIEW_CHECKLIST,
            qualitySummary: (analysis && analysis.message) || 'Add more content before running a full editorial audit.',
            externalVerification: { originality: 'not_performed', research: 'not_performed' },
            articleSummary: null,
        };
    }

    const sanitizedOriginality = sanitizeExternalOriginality(externalOriginality);
    const sanitizedResearch = sanitizeClaimResearch(claimResearch);

    // --- A. CONTENT / SEARCH INTENT ---
    const contentIssues = [];
    if (analysis.intent && analysis.intent.coverage !== 'Good') {
        contentIssues.push(makeIssue({
            category: 'CONTENT', severity: 'WARNING', title: 'Search intent coverage',
            message: `Detected intent is "${analysis.intent.detected}" — missing: ${analysis.intent.missing}.`,
            source: 'prompt1', location: analysis.intent.missing,
        }));
    }
    const contentCategory = computeCategory('CONTENT', 'Content & Search Intent', contentIssues);

    // --- B. ARTICLE STRUCTURE ---
    const structureIssues = [];
    (analysis.title?.issues || []).forEach((i) => structureIssues.push(
        makeIssue({ category: 'STRUCTURE', severity: i.severity, title: 'Title', message: i.message, source: 'prompt1' })
    ));
    (analysis.headings?.issues || []).forEach((m) => structureIssues.push(
        makeIssue({ category: 'STRUCTURE', severity: 'WARNING', title: 'Heading structure', message: m, source: 'prompt1', location: m })
    ));
    if (analysis.wordCount < 50) {
        structureIssues.push(makeIssue({
            category: 'STRUCTURE', severity: 'CRITICAL', title: 'Article body',
            message: 'Article body is very short — add more content before publishing.', source: 'prompt1',
        }));
    }
    const structureCategory = computeCategory('STRUCTURE', 'Article Structure', structureIssues);

    // --- C. TOPIC COVERAGE ---
    const topicIssues = [];
    (analysis.topicCoverage || []).filter((c) => c.status === 'partial').forEach((c) => topicIssues.push(
        makeIssue({ category: 'TOPIC', severity: 'SUGGESTION', title: 'Partial topic coverage', message: `"${c.concept}" — ${c.note}`, source: 'prompt1', location: c.concept })
    ));
    (analysis.topicCoverage || []).filter((c) => c.status === 'missing').forEach((c) => topicIssues.push(
        makeIssue({ category: 'TOPIC', severity: 'SUGGESTION', title: 'Possible topic gap (AI suggestion)', message: `"${c.concept}" — ${c.note}`, source: 'prompt1', location: c.concept })
    ));
    if (analysis.depth && analysis.depth.currentDepth === 'Well below suggested range') {
        topicIssues.push(makeIssue({
            category: 'TOPIC', severity: 'WARNING', title: 'Article depth',
            message: `Suggested depth is approximately ${analysis.depth.suggestedMin}–${analysis.depth.suggestedMax} words; current depth is well below that.`,
            source: 'prompt1',
        }));
    }
    (analysis.cannibalization || []).forEach((c) => topicIssues.push(
        makeIssue({ category: 'TOPIC', severity: 'SUGGESTION', title: 'Possible topic overlap', message: `Possible overlap with "${c.title}" (/${c.slug}).`, source: 'prompt1', location: c.title })
    ));
    (analysis.semanticCoverage?.issues || []).forEach((m) => topicIssues.push(
        makeIssue({ category: 'TOPIC', severity: 'SUGGESTION', title: 'Semantic coverage', message: m, source: 'prompt1', location: m })
    ));
    const topicCategory = computeCategory('TOPIC', 'Topic Coverage', topicIssues);

    // --- D. SEO ---
    const seoIssues = [];
    if (!analysis.seo?.metaDescription?.current) {
        seoIssues.push(makeIssue({ category: 'SEO', severity: 'WARNING', title: 'Meta description', message: 'Missing meta description.', source: 'prompt1' }));
    }
    if (analysis.writingQuality?.keywordStuffing?.stuffed) {
        seoIssues.push(makeIssue({
            category: 'SEO', severity: 'WARNING', title: 'Keyword stuffing risk',
            message: `Primary topic phrase appears frequently in close proximity (${analysis.writingQuality.keywordStuffing.occurrences} times).`,
            source: 'prompt1',
        }));
    }
    if (analysis.seo?.slug) {
        seoIssues.push(makeIssue({ category: 'SEO', severity: 'SUGGESTION', title: 'Slug suggestion', message: `${analysis.seo.slug.suggestion} — ${analysis.seo.slug.note}`, source: 'prompt1' }));
    }
    const seoCategory = computeCategory('SEO', 'SEO Signals', seoIssues);

    // --- E. WRITING QUALITY ---
    const writingIssues = [];
    (analysis.writingQuality?.repeatedPhrases || []).forEach((r) => writingIssues.push(
        makeIssue({ category: 'WRITING', severity: 'SUGGESTION', title: 'Repeated phrase', message: `"${r.phrase}" repeats ${r.occurrences} times.`, source: 'prompt1', location: r.phrase })
    ));
    (analysis.writingQuality?.genericPhrases || []).forEach((s) => writingIssues.push(
        makeIssue({ category: 'WRITING', severity: 'SUGGESTION', title: 'Generic wording', message: s, source: 'prompt1', location: s })
    ));
    if (analysis.readability?.label && /Dense|under-explaining/.test(analysis.readability.label)) {
        writingIssues.push(makeIssue({ category: 'WRITING', severity: 'SUGGESTION', title: 'Readability', message: analysis.readability.label, source: 'prompt1' }));
    }
    const writingCategory = computeCategory('WRITING', 'Writing Quality', writingIssues);

    // --- F. ORIGINALITY ---
    const originalityIssues = [];
    if (analysis.writingSignals?.repeatedOpeningsCount > 0) {
        originalityIssues.push(makeIssue({ category: 'ORIGINALITY', severity: 'WARNING', title: 'Repeated sentence openings', message: 'Repeated sentence openings detected — vary sentence structure.', source: 'prompt2' }));
    }
    if (analysis.writingSignals?.formulaicStructure && analysis.writingSignals.formulaicStructure !== 'Low') {
        originalityIssues.push(makeIssue({ category: 'ORIGINALITY', severity: 'SUGGESTION', title: 'Formulaic structure', message: `Formulaic sentence structure: ${analysis.writingSignals.formulaicStructure}.`, source: 'prompt2' }));
    }
    (analysis.internalOverlap || []).forEach((m) => originalityIssues.push(
        makeIssue({
            category: 'ORIGINALITY', severity: m.similarity >= 0.3 ? 'WARNING' : 'SUGGESTION', title: 'Internal content overlap',
            message: `Similar passage found in "${m.title}" (/${m.slug}).`, source: 'prompt2', location: m.matchingPassage || m.title,
        })
    ));
    if (analysis.originalityReview?.status === 'External check required') {
        originalityIssues.push(makeIssue({ category: 'ORIGINALITY', severity: 'WARNING', title: 'Originality review', message: 'Local signals suggest an external originality check is warranted before publishing.', source: 'prompt2' }));
    }
    if (sanitizedOriginality?.status === 'checked' && typeof sanitizedOriginality.similarity === 'number' && sanitizedOriginality.similarity >= 0.3) {
        originalityIssues.push(makeIssue({
            category: 'ORIGINALITY', severity: 'CRITICAL', title: 'External originality match',
            message: `External originality provider reported significant similarity (${Math.round(sanitizedOriginality.similarity * 100)}%) — review before publishing.`,
            source: 'external-originality',
        }));
    }
    const originalityCategory = computeCategory('ORIGINALITY', 'Originality', originalityIssues);

    // --- G. FACTS & SOURCES (kept as two categories per spec §3/§4) ---
    const factsIssues = (analysis.factSourceIntelligence?.claims || [])
        .filter((c) => c.severity !== 'SUGGESTION')
        .map((c) => makeIssue({ category: 'FACTS', severity: c.severity, title: `${c.category.replace(/_/g, ' ').toLowerCase()} claim`, message: c.text, source: 'prompt3', location: c.text }));
    if (sanitizedResearch) {
        sanitizedResearch.results.forEach((r) => {
            if (r.status === 'CONTRADICTED' || r.sourceConflict) {
                factsIssues.push(makeIssue({
                    category: 'FACTS', severity: 'CRITICAL', title: 'Contradicted or conflicting evidence',
                    message: r.status === 'CONTRADICTED'
                        ? 'Research evidence contradicts a detected claim — human editor must resolve before publishing.'
                        : 'Credible sources disagree on a detected claim — human editor must resolve the discrepancy.',
                    source: 'external-research',
                }));
            }
        });
    }
    const factsCategory = computeCategory('FACTS', 'Facts', factsIssues);

    const sourcesIssues = [];
    const fsSummary = analysis.factSourceIntelligence?.summary;
    if (fsSummary?.primarySourceOpportunities > 0) {
        sourcesIssues.push(makeIssue({
            category: 'SOURCES', severity: 'SUGGESTION', title: 'Primary-source opportunities',
            message: `${fsSummary.primarySourceOpportunities} claim(s) could be backed by a primary source.`, source: 'prompt3',
        }));
    }
    (analysis.sourceOpportunities || []).forEach((s) => sourcesIssues.push(
        makeIssue({ category: 'SOURCES', severity: 'SUGGESTION', title: 'Citation opportunity', message: s, source: 'prompt1', location: s })
    ));
    const sourcesCategory = computeCategory('SOURCES', 'Sources', sourcesIssues);

    // --- H. INTERNAL LINKS ---
    const linkingIssues = (analysis.internalLinks || []).map((l) => makeIssue({
        category: 'LINKING', severity: 'SUGGESTION', title: 'Internal link opportunity', message: `"${l.anchor}" → ${l.targetTitle}`, source: 'prompt1', location: l.anchor,
    }));
    const linkingCategory = computeCategory('LINKING', 'Internal Links', linkingIssues);

    // --- I. EDITORIAL COMPLETENESS — only the structural/content blockers that would make an
    // otherwise-complete audit meaningless (kept intentionally narrow to avoid re-deriving a
    // second opinion the STRUCTURE category already gives). ---
    const editorialIssues = structureIssues.filter((i) => i.severity === 'CRITICAL');
    const editorialCategory = computeCategory('EDITORIAL', 'Editorial Completeness', editorialIssues);

    const categories = [
        contentCategory, structureCategory, topicCategory, seoCategory, writingCategory,
        originalityCategory, factsCategory, sourcesCategory, linkingCategory, editorialCategory,
    ];

    const allIssues = categories.flatMap((c) => c.issues);
    const critical = allIssues.filter((i) => i.severity === 'CRITICAL').length;
    const warnings = allIssues.filter((i) => i.severity === 'WARNING').length;
    const suggestions = allIssues.filter((i) => i.severity === 'SUGGESTION').length;

    // --- J. PUBLISHING READINESS (overall status — see spec §9) ---
    let status;
    if (critical > 0) status = 'CRITICAL_REVIEW_REQUIRED';
    else if (warnings >= SIGNIFICANT_WARNING_THRESHOLD) status = 'REVISION_RECOMMENDED';
    else if (warnings > 0 || suggestions > 0) status = 'REVIEW_RECOMMENDED';
    else status = 'READY_FOR_HUMAN_REVIEW';

    return {
        status,
        generatedAt: new Date().toISOString(),
        contentFingerprint: fingerprint,
        summary: { critical, warnings, suggestions },
        categories,
        humanReviewChecklist: HUMAN_REVIEW_CHECKLIST,
        qualitySummary: buildQualitySummary({ analysis, critical, categories }),
        // Never presented as proof of correctness when absent (spec §17/§23/§24) — the
        // frontend must render "not_performed"/"not_configured" explicitly, never silence.
        externalVerification: {
            originality: sanitizedOriginality ? sanitizedOriginality.status : 'not_performed',
            research: sanitizedResearch ? sanitizedResearch.researchStatus : 'not_performed',
        },
        articleSummary: {
            wordCount: analysis.wordCount,
            primaryTopic: analysis.topics?.primary || null,
            topicConfidence: analysis.topics?.confidence || null,
            searchIntent: analysis.intent?.detected || null,
            topicComplexity: analysis.depth?.topicComplexity || null,
            currentDepth: analysis.depth?.currentDepth || null,
            readabilityLabel: analysis.readability?.label || null,
            originalityReviewStatus: analysis.originalityReview?.status || null,
            claimsDetected: fsSummary?.total ?? 0,
            claimsNeedingVerification: fsSummary?.needsVerification ?? 0,
            citationsPresent: fsSummary?.citationPresent ?? 0,
            timeSensitiveClaims: fsSummary?.timeSensitive ?? 0,
            primarySourceOpportunities: fsSummary?.primarySourceOpportunities ?? 0,
            internalLinkOpportunities: analysis.internalLinks?.length ?? 0,
            internalLinkCandidatePoolSize: analysis.internalLinkCandidatePoolSize ?? null,
        },
    };
}

module.exports = {
    buildEditorialAudit,
    contentFingerprint,
    sanitizeExternalOriginality,
    sanitizeClaimResearch,
    HUMAN_REVIEW_CHECKLIST,
    SIGNIFICANT_WARNING_THRESHOLD,
};
