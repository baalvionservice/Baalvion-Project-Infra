'use strict';

// Pure-logic tests for Stage A of Fact & Source Intelligence (Prompt 3) — no DB, no network.
// Mirrors the style of articleAnalysisService.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');

const svc = require('../service/claimDetectionService');

// ---- CLAIM DETECTION ----

test('detects a numerical/currency claim', () => {
    const { claims } = svc.detectClaims({ title: 'Emergency Funds', content: 'A typical emergency fund holds $7,000 in savings for most households across the country.' });
    assert.ok(claims.some((c) => c.category === 'NUMERICAL' || c.category === 'STATISTICAL'));
});

test('detects a percentage claim', () => {
    const { claims } = svc.detectClaims({ title: 'Inflation', content: 'Inflation reached 4.2% in the most recent reading according to public data released this quarter.' });
    assert.ok(claims.length > 0);
});

test('detects a statistical claim', () => {
    const { claims } = svc.detectClaims({ title: 'Retirement', content: 'A recent survey found that most Americans have not saved enough for retirement by the time they turn fifty.' });
    assert.ok(claims.some((c) => c.category === 'STATISTICAL'));
});

test('detects a date-sensitive claim', () => {
    const { claims } = svc.detectClaims({ title: 'IRA Limits', content: 'The current IRA contribution limit for 2026 applies to most taxpayers who file a federal return.' });
    const claim = claims.find((c) => c.timeSensitive);
    assert.ok(claim);
});

test('detects a legal claim', () => {
    const { claims } = svc.detectClaims({ title: 'Employment Law', content: 'Federal law requires employers to provide certain notices before a covered layoff can proceed under this statute.' });
    assert.ok(claims.some((c) => c.category === 'LEGAL'));
});

test('detects a regulatory claim', () => {
    const { claims } = svc.detectClaims({ title: 'Compliance', content: 'Applicants are required to obtain a license before operating, and failure to comply can result in penalties for the business.' });
    assert.ok(claims.some((c) => c.category === 'REGULATORY'));
});

test('detects a financial claim', () => {
    const { claims } = svc.detectClaims({ title: 'Mortgages', content: 'The average mortgage rate reported by major lenders this week affects millions of prospective homebuyers nationwide.' });
    assert.ok(claims.length > 0);
});

test('detects a tax claim', () => {
    const { claims } = svc.detectClaims({ title: 'Capital Gains', content: 'The IRS applies a different capital gains tax rate depending on how long an asset was held before selling it.' });
    assert.ok(claims.some((c) => c.category === 'TAX'));
});

test('detects an organization attribution', () => {
    const { claims } = svc.detectClaims({ title: 'Global Growth', content: 'The World Bank projected slower growth for emerging markets in its latest outlook released to member countries.' });
    assert.ok(claims.some((c) => c.category === 'GOVERNMENT' || c.category === 'ORGANIZATION'));
});

test('detects a person attribution', () => {
    const { claims } = svc.detectClaims({ title: 'Market Views', content: 'According to Jane Rodriguez, market volatility is likely to persist through the remainder of the fiscal year.' });
    assert.ok(claims.some((c) => c.category === 'PERSON_ATTRIBUTION'));
});

test('detects a geographic/jurisdiction-scoped claim', () => {
    const { claims } = svc.detectClaims({ title: 'State Taxes', content: 'California imposes its own state income tax in addition to any federal tax obligations that apply to residents.' });
    assert.ok(claims.length > 0);
    const claim = claims.find((c) => c.category === 'TAX');
    assert.equal(claim.jurisdiction.stated, true);
});

test('does not flag an ordinary non-factual sentence', () => {
    const { claims } = svc.detectClaims({ title: 'Style', content: 'Writing clearly and simply helps readers understand complex ideas more easily over time.' });
    assert.equal(claims.length, 0);
});

test('does not flag a self-referential count about the article itself', () => {
    const { claims } = svc.detectClaims({ title: 'Guide', content: 'The article contains five sections that walk through each step of the process in order.' });
    assert.equal(claims.length, 0);
});

// ---- CLASSIFICATION ----

test('classifySentence assigns the correct category for a tax claim', () => {
    const result = svc.classifySentence('The IRS allows a standard deduction that reduces taxable income for most filers.');
    assert.equal(result.category, 'TAX');
});

test('classifySentence falls back to null (not a claim) for low-signal prose', () => {
    const result = svc.classifySentence('This part of the guide explains the general idea in plain language.');
    assert.equal(result, null);
});

test('classifySentence flags jurisdiction as unclear when a legal claim names no jurisdiction', () => {
    const result = svc.classifySentence('Employers must provide written notice before terminating certain employees under the law.');
    assert.equal(result.jurisdictionRelevant, true);
    assert.equal(result.jurisdictionStated, false);
});

test('classifySentence detects a stated jurisdiction', () => {
    const result = svc.classifySentence('Under United States federal law, employers must provide written notice before certain layoffs.');
    assert.equal(result.jurisdictionStated, true);
});

test('classifySentence marks a claim time-sensitive when a year and a freshness keyword co-occur', () => {
    const result = svc.classifySentence('The current contribution limit for 2026 is higher than in prior years for most account types.');
    assert.equal(result.timeSensitive, true);
});

// ---- CITATION ----

test('findNearbyCitation detects a markdown link in the same sentence', () => {
    const sentences = ['The IRS contribution limit is $7,000 [source](https://www.irs.gov/retirement).'];
    const citation = svc.findNearbyCitation(sentences, 0);
    assert.equal(citation.present, true);
    assert.match(citation.url, /irs\.gov/);
});

test('findNearbyCitation returns null when no citation is present', () => {
    const sentences = ['The IRS contribution limit is $7,000 for most taxpayers this year.'];
    assert.equal(svc.findNearbyCitation(sentences, 0), null);
});

test('findNearbyCitation also checks the following sentence (footnote-style)', () => {
    const sentences = [
        'The IRS contribution limit is $7,000 for most taxpayers this year.',
        'See https://www.irs.gov/retirement for the official figures.',
    ];
    const citation = svc.findNearbyCitation(sentences, 0);
    assert.equal(citation.present, true);
});

test('a citation-present claim never has severity CRITICAL from citation absence alone', () => {
    const { claims } = svc.detectClaims({
        title: 'IRA Limits',
        content: 'Federal law requires plan administrators to report contributions annually [source](https://www.irs.gov/retirement-plans).',
    });
    const legalClaim = claims.find((c) => c.category === 'LEGAL');
    assert.ok(legalClaim);
    assert.equal(legalClaim.citationPresent, true);
    assert.notEqual(legalClaim.severity, 'CRITICAL');
});

// ---- SOURCE QUALITY ----

test('classifySourceQuality recognizes a primary (.gov) source', () => {
    assert.equal(svc.classifySourceQuality('https://www.irs.gov/retirement-plans'), 'primary');
});

test('classifySourceQuality recognizes a high-quality secondary source', () => {
    assert.equal(svc.classifySourceQuality('https://www.reuters.com/markets/some-article'), 'secondary');
});

test('classifySourceQuality falls back to general for an unrecognized domain', () => {
    assert.equal(svc.classifySourceQuality('https://some-random-blog.example/post'), 'general');
});

test('classifySourceQuality returns unknown for no URL', () => {
    assert.equal(svc.classifySourceQuality(null), 'unknown');
});

// ---- SEVERITY / PRIMARY-SOURCE OPPORTUNITY ----

test('an unsupported legal claim is CRITICAL', () => {
    const { claims } = svc.detectClaims({ title: 'Law', content: 'Federal law requires all employers to withhold payroll taxes from every paycheck without exception.' });
    const claim = claims.find((c) => c.category === 'LEGAL');
    assert.equal(claim.severity, 'CRITICAL');
});

test('a claim with a general-quality citation gets a primary-source-opportunity suggestion', () => {
    const { claims } = svc.detectClaims({
        title: 'Tax Limits',
        content: 'The IRA contribution limit is $7,000 this year according to [this blog post](https://some-random-blog.example/ira-limits).',
    });
    const claim = claims.find((c) => c.category === 'TAX' || c.category === 'FINANCIAL');
    assert.ok(claim);
    assert.equal(claim.primarySourceOpportunity, true);
    assert.equal(claim.recommendedSourceType, 'Government / IRS or Treasury');
});

test('a claim already backed by a primary source has no primary-source opportunity', () => {
    const { claims } = svc.detectClaims({
        title: 'Tax Limits',
        content: 'The IRA contribution limit is $7,000 this year [source](https://www.irs.gov/retirement-plans/ira-contribution-limits).',
    });
    const claim = claims.find((c) => c.category === 'TAX' || c.category === 'FINANCIAL');
    assert.ok(claim);
    assert.equal(claim.primarySourceOpportunity, false);
});

// ---- SUMMARY ----

test('detectClaims returns an accurate summary count', () => {
    const content = [
        'Federal law requires employers to report wages accurately each quarter without fail.',
        'The current 2026 contribution limit is higher than last year for most plans.',
        'A recent survey found that most Americans feel unprepared for retirement.',
    ].join(' ');
    const { claims, summary } = svc.detectClaims({ title: 'Mixed', content });
    assert.equal(summary.total, claims.length);
    assert.equal(summary.needsVerification, claims.filter((c) => c.severity !== 'SUGGESTION').length);
    assert.equal(summary.timeSensitive, claims.filter((c) => c.timeSensitive).length);
});

test('detectClaims never returns a "verified" or "true" status — Stage A only ever reports not_researched', () => {
    const { claims, researchStatus } = svc.detectClaims({ title: 'X', content: 'The IRS allows a standard deduction that most taxpayers claim automatically each year.' });
    assert.equal(researchStatus, 'not_researched');
    for (const c of claims) assert.equal(c.researchStatus, 'not_researched');
});

// ---- QUERY GENERATION ----

test('buildResearchQuery produces a targeted, non-empty query without mutating the claim', () => {
    const claim = { text: 'The IRA contribution limit is $7,000 in 2026.', category: 'TAX' };
    const query = svc.buildResearchQuery(claim);
    assert.match(query, /irs\.gov/);
    assert.match(query, /2026/);
});

test('buildResearchQuery handles an empty claim gracefully', () => {
    assert.equal(svc.buildResearchQuery(null), '');
    assert.equal(svc.buildResearchQuery({}), '');
});
