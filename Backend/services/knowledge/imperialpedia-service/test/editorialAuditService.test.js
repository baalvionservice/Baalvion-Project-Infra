'use strict';

// Pure-logic tests for the Prompt 4 aggregation layer — no DB, no network. Builds `analysis`
// objects via the REAL analyzeArticle() (never hand-rolled fixtures that could drift from the
// actual shape) so these tests also double as a Prompt 1/2/3 regression check for the fields
// this module reads.

const test = require('node:test');
const assert = require('node:assert/strict');

const { analyzeArticle } = require('../service/articleAnalysisService');
const audit = require('../service/editorialAuditService');

const GOOD_SENTENCE = 'A well diversified portfolio tends to reduce the impact of any single investment performing poorly over time.';

function longContent(sentence = GOOD_SENTENCE, times = 15) {
    return Array(times).fill(sentence).join(' ');
}

function analyze(overrides = {}) {
    const { title = 'Diversification Basics', content = longContent(), ...rest } = overrides;
    const result = analyzeArticle({ title, content, ...rest }, { candidates: [] });
    return { title, content, analysis: { analyzable: true, ...result } };
}

// ---- AGGREGATION ----

test('buildEditorialAudit never recomputes analysis — it only reads the provided analysis object', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.articleSummary.wordCount, analysis.wordCount);
    assert.equal(result.articleSummary.primaryTopic, analysis.topics.primary);
});

test('buildEditorialAudit produces all ten audit categories', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    const keys = result.categories.map((c) => c.key).sort();
    assert.deepEqual(keys, ['CONTENT', 'EDITORIAL', 'FACTS', 'LINKING', 'ORIGINALITY', 'SEO', 'SOURCES', 'STRUCTURE', 'TOPIC', 'WRITING'].sort());
});

test('every audit issue uses only the existing CRITICAL/WARNING/SUGGESTION severities', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} Federal law requires employers to report wages accurately without exception ever again.`,
    });
    const result = audit.buildEditorialAudit({ title, content, analysis });
    const allIssues = result.categories.flatMap((c) => c.issues);
    assert.ok(allIssues.length > 0);
    for (const issue of allIssues) {
        assert.ok(['CRITICAL', 'WARNING', 'SUGGESTION'].includes(issue.severity));
        assert.equal(issue.resolved, false);
    }
});

// ---- SEVERITY NORMALIZATION ----

test('a CRITICAL fact-source claim produces a CRITICAL FACTS-category issue', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} Federal law requires employers to withhold payroll taxes from every paycheck without exception ever.`,
    });
    const result = audit.buildEditorialAudit({ title, content, analysis });
    const facts = result.categories.find((c) => c.key === 'FACTS');
    assert.equal(facts.status, 'critical');
    assert.ok(facts.issues.some((i) => i.severity === 'CRITICAL'));
});

test('SUGGESTION-severity claims never appear in the FACTS category (kept out to avoid noise)', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} The World Bank projected slower growth for some emerging markets this year in its outlook.`,
    });
    const result = audit.buildEditorialAudit({ title, content, analysis });
    const facts = result.categories.find((c) => c.key === 'FACTS');
    assert.ok(facts.issues.every((i) => i.severity !== 'SUGGESTION'));
});

// ---- STATUS CALCULATION ----

test('NOT_ENOUGH_CONTENT when the underlying analysis was not analyzable', () => {
    const result = audit.buildEditorialAudit({ title: 'X', content: 'short', analysis: { analyzable: false, wordCount: 2, message: 'Add more content.' } });
    assert.equal(result.status, 'NOT_ENOUGH_CONTENT');
    assert.deepEqual(result.categories, []);
    assert.equal(result.articleSummary, null);
});

test('CRITICAL_REVIEW_REQUIRED when at least one CRITICAL issue exists', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} Federal law requires employers to withhold payroll taxes from every paycheck without exception ever.`,
    });
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.status, 'CRITICAL_REVIEW_REQUIRED');
});

test('REVISION_RECOMMENDED when several significant WARNING issues exist with no CRITICAL', () => {
    // Fabricate an analysis object directly to control warning count precisely without
    // depending on which exact sentences the heuristics flag.
    const { title, content, analysis } = analyze();
    analysis.intent = { detected: 'How-to', confidence: 'high', coverage: 'Needs improvement', missing: 'Step-by-step implementation section' };
    analysis.depth = { ...analysis.depth, currentDepth: 'Well below suggested range', suggestedMin: 1000, suggestedMax: 1800 };
    analysis.seo = { ...analysis.seo, metaDescription: { current: null, suggestion: null, tooShort: false, tooLong: false } };
    analysis.writingQuality = { ...analysis.writingQuality, keywordStuffing: { occurrences: 10, per1000Words: 20, stuffed: true } };
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.summary.critical, 0);
    assert.ok(result.summary.warnings >= audit.SIGNIFICANT_WARNING_THRESHOLD);
    assert.equal(result.status, 'REVISION_RECOMMENDED');
});

test('REVIEW_RECOMMENDED when only minor warnings/suggestions exist', () => {
    const { title, content, analysis } = analyze();
    // Force every OTHER category clean so only the single meta-description WARNING remains —
    // avoids depending on which exact sentences the heuristics happen to flag in the fixture.
    analysis.intent = { detected: 'Informational', confidence: 'medium', coverage: 'Good', missing: null };
    analysis.depth = { ...analysis.depth, currentDepth: 'Within suggested range' };
    analysis.writingSignals = { ...analysis.writingSignals, repeatedOpeningsCount: 0, formulaicStructure: 'Low' };
    analysis.originalityReview = { status: 'Clean' };
    analysis.internalOverlap = [];
    analysis.seo = { ...analysis.seo, metaDescription: { current: null, suggestion: null, tooShort: false, tooLong: false } };
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.summary.critical, 0);
    assert.ok(result.summary.warnings < audit.SIGNIFICANT_WARNING_THRESHOLD);
    assert.equal(result.status, 'REVIEW_RECOMMENDED');
});

test('READY_FOR_HUMAN_REVIEW when no unresolved critical/warning/suggestion issues remain', () => {
    const { title, content, analysis } = analyze();
    // Force a "clean" analysis object: no issues in any category this module reads.
    analysis.intent = { detected: 'Informational', confidence: 'medium', coverage: 'Good', missing: null };
    analysis.title = { length: 30, issues: [] };
    analysis.headings = { list: [], issues: [] };
    analysis.topicCoverage = [];
    analysis.depth = { ...analysis.depth, currentDepth: 'Within suggested range' };
    analysis.cannibalization = [];
    analysis.semanticCoverage = { headingStuffing: false, consecutiveUsage: false, forcedSynonymPattern: false, issues: [] };
    analysis.seo = { metaTitle: { current: 'x', suggestion: null }, metaDescription: { current: 'a fine meta description', suggestion: null, tooShort: false, tooLong: false }, slug: null };
    analysis.writingQuality = { repeatedPhrases: [], repeatedOpenings: [], genericPhrases: [], emDash: { count: 0, per1000Words: 0, unusual: false }, keywordStuffing: { occurrences: 0, per1000Words: 0, stuffed: false } };
    analysis.readability = { fleschScore: 50, avgSentenceLength: 15, longSentenceCount: 0, label: 'Good' };
    analysis.writingSignals = { repeatedPhrasesCount: 0, repeatedOpeningsCount: 0, genericWordingCount: 0, formulaicStructure: 'Low', sentenceVariation: 'Good', paragraphVariation: 'Good', punctuationPattern: 'Good' };
    analysis.internalOverlap = [];
    analysis.originalityReview = { status: 'Clean' };
    analysis.factSourceIntelligence = { claims: [], summary: { total: 0, needsVerification: 0, citationPresent: 0, timeSensitive: 0, primarySourceOpportunities: 0 }, researchStatus: 'not_researched' };
    analysis.sourceOpportunities = [];
    analysis.internalLinks = [];
    analysis.wordCount = 400;

    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.deepEqual(result.summary, { critical: 0, warnings: 0, suggestions: 0 });
    assert.equal(result.status, 'READY_FOR_HUMAN_REVIEW');
});

// ---- RESOLVED / UNRESOLVED ----

test('every issue is returned as unresolved — the server never persists a resolved state', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} Federal law requires employers to withhold payroll taxes from every paycheck without exception ever.`,
    });
    const result = audit.buildEditorialAudit({ title, content, analysis });
    const allIssues = result.categories.flatMap((c) => c.issues);
    assert.ok(allIssues.length > 0);
    assert.ok(allIssues.every((i) => i.resolved === false));
});

// ---- STALE-AUDIT / CONTENT FINGERPRINT ----

test('contentFingerprint is deterministic for the same title+content', () => {
    assert.equal(audit.contentFingerprint('Title', 'Body text'), audit.contentFingerprint('Title', 'Body text'));
});

test('contentFingerprint changes when the content changes', () => {
    assert.notEqual(audit.contentFingerprint('Title', 'Body text'), audit.contentFingerprint('Title', 'Body text changed'));
});

test('contentFingerprint changes when the title changes', () => {
    assert.notEqual(audit.contentFingerprint('Title A', 'Body text'), audit.contentFingerprint('Title B', 'Body text'));
});

test('buildEditorialAudit always returns a contentFingerprint, even for NOT_ENOUGH_CONTENT', () => {
    const result = audit.buildEditorialAudit({ title: 'X', content: 'short', analysis: { analyzable: false, wordCount: 2 } });
    assert.equal(typeof result.contentFingerprint, 'string');
    assert.ok(result.contentFingerprint.length > 0);
});

// ---- EXTERNAL PROVIDER HANDLING (no duplicate external calls; missing provider handling) ----

test('externalVerification reports not_performed when neither external input is supplied', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.deepEqual(result.externalVerification, { originality: 'not_performed', research: 'not_performed' });
});

test('a malformed externalOriginality payload is treated as not performed, never as a pass', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis, externalOriginality: { status: 'totally-fine' } });
    assert.equal(result.externalVerification.originality, 'not_performed');
});

test('sanitizeExternalOriginality accepts a well-formed provider echo', () => {
    assert.deepEqual(audit.sanitizeExternalOriginality({ status: 'checked', similarity: 0.4 }), { status: 'checked', similarity: 0.4 });
});

test('sanitizeExternalOriginality rejects an out-of-range similarity', () => {
    const result = audit.sanitizeExternalOriginality({ status: 'checked', similarity: 5 });
    assert.equal(result.similarity, null);
});

test('a high-similarity external originality echo adds a CRITICAL ORIGINALITY issue (raises, never lowers)', () => {
    const { title, content, analysis } = analyze();
    const withoutExternal = audit.buildEditorialAudit({ title, content, analysis });
    const withExternal = audit.buildEditorialAudit({ title, content, analysis, externalOriginality: { status: 'checked', similarity: 0.55 } });
    assert.ok(withExternal.summary.critical > withoutExternal.summary.critical);
    assert.equal(withExternal.externalVerification.originality, 'checked');
});

test('sanitizeClaimResearch drops malformed result entries rather than trusting them', () => {
    const result = audit.sanitizeClaimResearch({ researchStatus: 'completed', results: [{ notAClaimId: true }, { claimId: 'x', status: 'SUPPORTED' }] });
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].claimId, 'x');
});

test('a CONTRADICTED claim research result adds a CRITICAL FACTS issue', () => {
    const { title, content, analysis } = analyze();
    const withoutResearch = audit.buildEditorialAudit({ title, content, analysis });
    const withResearch = audit.buildEditorialAudit({
        title, content, analysis,
        claimResearch: { researchStatus: 'completed', results: [{ claimId: 'claim-0', status: 'CONTRADICTED', sourceConflict: false }] },
    });
    assert.ok(withResearch.summary.critical > withoutResearch.summary.critical);
});

test('a sourceConflict:true result adds a CRITICAL FACTS issue even without status CONTRADICTED', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({
        title, content, analysis,
        claimResearch: { researchStatus: 'completed', results: [{ claimId: 'claim-0', status: 'PARTIALLY_SUPPORTED', sourceConflict: true }] },
    });
    const facts = result.categories.find((c) => c.key === 'FACTS');
    assert.ok(facts.issues.some((i) => i.severity === 'CRITICAL' && /disagree|discrepancy/i.test(i.message)));
});

test('a SUPPORTED claim research result never lowers an already-CRITICAL local finding', () => {
    const { title, content, analysis } = analyze({
        content: `${longContent()} Federal law requires employers to withhold payroll taxes from every paycheck without exception ever.`,
    });
    const withoutResearch = audit.buildEditorialAudit({ title, content, analysis });
    const withResearch = audit.buildEditorialAudit({
        title, content, analysis,
        claimResearch: { researchStatus: 'completed', results: [{ claimId: 'claim-1', status: 'SUPPORTED', sourceConflict: false }] },
    });
    assert.equal(withResearch.summary.critical, withoutResearch.summary.critical);
    assert.ok(withResearch.summary.critical >= 1);
});

// ---- HUMAN REVIEW CHECKLIST ----

test('humanReviewChecklist always has the full fixed set of items, unresolved', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.humanReviewChecklist.length, 10);
    assert.ok(result.humanReviewChecklist.every((i) => typeof i.id === 'string' && typeof i.label === 'string'));
});

// ---- QUALITY SUMMARY (no invention) ----

test('qualitySummary is derived from real counts and never fabricates a problem for a clean article', () => {
    const { title, content, analysis } = analyze();
    analysis.intent = { detected: 'Informational', confidence: 'medium', coverage: 'Good', missing: null };
    analysis.topicCoverage = [];
    analysis.writingSignals = { ...analysis.writingSignals, repeatedOpeningsCount: 0, formulaicStructure: 'Low' };
    analysis.internalOverlap = [];
    analysis.originalityReview = { status: 'Clean' };
    analysis.factSourceIntelligence = { claims: [], summary: { total: 0, needsVerification: 0, citationPresent: 0, timeSensitive: 0, primarySourceOpportunities: 0 }, researchStatus: 'not_researched' };
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.match(result.qualitySummary, /aligned/i);
    assert.doesNotMatch(result.qualitySummary, /factual claim/i);
});

test('qualitySummary never claims a false guarantee like "100% original" or "plagiarism-free"', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    for (const phrase of ['100%', 'plagiarism-free', 'guaranteed', 'AdSense', 'Google-approved']) {
        assert.doesNotMatch(result.qualitySummary, new RegExp(phrase, 'i'));
    }
});

// ---- ARTICLE SUMMARY USES EXISTING VALUES (no recompute) ----

test('articleSummary pulls straight from analysis, not a recomputation', () => {
    const { title, content, analysis } = analyze();
    const result = audit.buildEditorialAudit({ title, content, analysis });
    assert.equal(result.articleSummary.wordCount, analysis.wordCount);
    assert.equal(result.articleSummary.searchIntent, analysis.intent.detected);
    assert.equal(result.articleSummary.claimsDetected, analysis.factSourceIntelligence.summary.total);
    assert.equal(result.articleSummary.internalLinkCandidatePoolSize, analysis.internalLinkCandidatePoolSize);
});
